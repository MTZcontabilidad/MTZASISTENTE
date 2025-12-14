import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { sessionCache } from "../lib/sessionCache";
import {
  getActiveConversation,
  getConversationMessages,
  createMessage,
  clearConversation,
} from "../lib/conversations";
import { getUserMemories, createMemory } from "../lib/memories";
import {
  detectImportantInfo,
} from "../lib/chatUtils";
import { handleChat, ChatState, getInitialChatState } from "../lib/chatbot/chatEngine";
import { markdownToHtml, hasMarkdown } from "../lib/markdown";
import { Message, UserType, UserRole, Conversation } from "../types";
import InteractiveMenu from "./InteractiveMenu";
import QuickActions from "./QuickActions";
import CategoryButtons from "./CategoryButtons";
import MeetingScheduler from "./MeetingScheduler";
import VoiceControls from "./VoiceControls";
import HumanSupportOptions from "./HumanSupportOptions";
import UserProfile from "./UserProfile";
import VoiceSettingsDropdown from "./VoiceSettingsDropdown";
import { useSpeechToText } from "../lib/speechToText";
import { useTextToSpeech } from "../lib/textToSpeech";
import ClientSidebar, { type ClientTab } from "./ClientSidebar";
import {
  ClientMeetingsSection,
  ClientDocumentsSection,
  ClientCompanyInfoSection,
  ClientRequestsSection,
  ClientNotesSection,
  ClientProfileSection,
} from "./ClientSections";
import { ClientServicesSection } from "./ClientServicesSection";
import {
  MTZConsultoresSection,
  AbuelitaAlejandraSection,
} from "./InvitadoServices";
import "./ChatInterface.css";

// Interface definida localmente
export interface MessageWithMenu extends Message {
  menu?: any;
  document?: any;
}

interface ChatInterfaceProps {
}

function ChatInterface({}: ChatInterfaceProps = {}) {
  const [messages, setMessages] = useState<MessageWithMenu[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [userType, setUserType] = useState<UserType | undefined>(undefined);
  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTutorial, setShowTutorial] = useState<{id: string, content: string} | null>(null);
  const [showMeetings, setShowMeetings] = useState(false);
  const [showHumanSupport, setShowHumanSupport] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Supervisor Engine State
  const [chatUtilsState, setChatUtilsState] = useState<ChatState>(getInitialChatState());
  const [autoReadEnabled, setAutoReadEnabled] = useState(true); 
  const [isMuted, setIsMuted] = useState(false);
  const [lastAssistantMessage, setLastAssistantMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ClientTab>("chat");
  const autoSentRef = useRef(false);
  const handleSendRef = useRef<(() => void) | null>(null);
  const lastVoiceTranscriptRef = useRef(""); // Added back missing ref

  // Escuchar evento de toggle mute desde el header
  useEffect(() => {
    const handleToggleMute = () => {
      setIsMuted(prev => {
        const newMuted = !prev;
        setAutoReadEnabled(!newMuted); 
        return newMuted;
      });
    };
    
    window.addEventListener('toggleMute', handleToggleMute as EventListener);
    return () => window.removeEventListener('toggleMute', handleToggleMute as EventListener);
  }, []);

  const [welcomePlayed, setWelcomePlayed] = useState(false);
  const welcomeSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  /*
  const {
    start: startListening,
    stop: stopListening,
    abort: abortListening,
    isListening,
    transcript: voiceTranscript,
    error: sttError,
    isSupported: sttSupported,
  } = useSpeechToText({
    onSpeechEnd: (finalTranscript) => {
      console.log('🎤 Pausa detectada, transcript:', finalTranscript);
      
      if (!finalTranscript || finalTranscript.trim().length < 2) {
        console.log('⚠️ Transcript muy corto o vacío');
        return;
      }

      if (autoSentRef.current) {
        return;
      }

      stopListening();
      
      autoSentRef.current = true;
      // lastVoiceTranscriptRef.current = ""; // Removed standard ref usage if not defined, assuming handled inside hook or not needed here
      
      const trySendMessage = () => {
        const currentConversationId = conversationId;
        const currentHandleSend = handleSendRef.current; // Assuming this ref is populated elsewhere

        if (!currentConversationId) {
             console.warn('⚠️ No hay conversationId');
             return;
        }
        if (currentHandleSend) currentHandleSend();
      };
      trySendMessage();
    }
  });
  */
  // Mock values to prevent TS errors
  const startListening = () => {};
  const stopListening = () => {};
  const isListening = false;
  const voiceTranscript = "";
  const sttError = null;
  const sttSupported = false;
  // Code removed
  
  // Text-to-Speech para el botón "Leer" en cada mensaje
  const {
    speak,
    pause,
    resume,
    stop: stopTTS,
    isSpeaking: ttsIsSpeaking,
    isPaused: ttsIsPaused,
  } = useTextToSpeech();
  
  const isUpdatingInputRef = useRef(false);
  
  /*
  useEffect(() => {
    // Prevenir loops: solo actualizar si realmente cambió el transcript y no estamos en medio de una actualización
    if (isUpdatingInputRef.current) return;
    
    if (voiceTranscript && voiceTranscript !== lastVoiceTranscriptRef.current && !autoSentRef.current && isListening) {
      isUpdatingInputRef.current = true;
      lastVoiceTranscriptRef.current = voiceTranscript;
      setInput(voiceTranscript);
      // Resetear flag después de un breve delay
      setTimeout(() => {
        isUpdatingInputRef.current = false;
      }, 50);
    } else if (!voiceTranscript && !isListening && lastVoiceTranscriptRef.current && !autoSentRef.current) {
      // Si no hay transcript y no se está escuchando, limpiar el input y el ref
      isUpdatingInputRef.current = true;
      lastVoiceTranscriptRef.current = "";
      setInput("");
      setTimeout(() => {
        isUpdatingInputRef.current = false;
      }, 50);
    }
  }, [voiceTranscript, isListening]); // Removido 'input' de dependencias para evitar loop
  */

  // Auto-enviar mensaje cuando se detiene la grabación manualmente (botón)
  // DESHABILADO: El envío automático se maneja completamente en onSpeechEnd
  // Si el usuario detiene manualmente, puede enviar con el botón de envío
  // Esto evita loops y doble envío
  const prevIsListeningRef = useRef(false);
  
  useEffect(() => {
    // Solo actualizar la referencia, NO enviar automáticamente
    // Esto evita loops - onSpeechEnd ya maneja todo el envío automático
    prevIsListeningRef.current = isListening;
  }, [isListening]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // scrollToBottom es estable, no necesita estar en dependencias

  // Detectar si el usuario está cerca del final del scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages.length]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Cargar conversación activa y mensajes históricos al montar
  // Se ejecuta cada vez que el componente se monta (incluyendo cuando vuelves del admin panel)
  useEffect(() => {
    let mounted = true;
    let isCancelled = false;

    // Resetear estados al montar para evitar estados inconsistentes
    setLoading(false);
    setInput("");

    const loadConversation = async () => {
      try {
        if (!mounted || isCancelled) return;
        
        setLoadingHistory(true);
        
        // Intentar obtener usuario de Supabase
        let user = null;
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          user = authUser;
        } catch (error) {
          console.log('No hay sesión de Supabase, intentando desde caché...');
        }
        
        // Si no hay usuario de Supabase, intentar desde caché (modo desarrollo)
        if (!user) {
          const cachedUser = sessionCache.get();
          if (cachedUser && cachedUser.id) {
            user = {
              id: cachedUser.id,
              email: cachedUser.email || '',
            } as any;
            console.log('✅ Usuario cargado desde caché:', user.id, user.email);
          }
        }
        
        if (!user || !mounted || isCancelled) {
          if (mounted && !isCancelled) {
            setLoadingHistory(false);
          }
          return;
        }

        // Obtener perfil del usuario para userType, userRole y userName
        try {
          // Verificar si es un usuario de modo desarrollo (ID empieza con "dev-")
          const isDevUser = user.id.startsWith('dev-');
          
          let profile = null;
          if (!isDevUser) {
            // Solo buscar en Supabase si no es usuario de desarrollo
            const { data } = await supabase
              .from("user_profiles")
              .select("user_type, role, full_name, email")
              .eq("id", user.id)
              .maybeSingle();
            profile = data;
          }

          if (!mounted || isCancelled) return;

          if (profile) {
            setUserType(profile.user_type as UserType);
            setUserRole(profile.role as UserRole);
            setUserName(profile.full_name || undefined);
            setUserEmail(profile.email || user.email || undefined);
          } else if (isDevUser) {
            // Para usuarios de desarrollo, extraer el rol del ID (formato: dev-{role}-{timestamp})
            // O del email (formato: dev-{role}@test.local)
            let devRole: UserRole = 'invitado';
            const roleMatch = user.id.match(/^dev-([^-]+)-/);
            if (roleMatch) {
              devRole = roleMatch[1] as UserRole;
            } else {
              // Intentar extraer del email si el ID no tiene el formato esperado
              const emailMatch = user.email?.match(/^dev-([^@]+)@/);
              if (emailMatch) {
                devRole = emailMatch[1] as UserRole;
              }
            }
            console.log('🔧 Modo desarrollo - Rol detectado:', devRole, 'ID:', user.id, 'Email:', user.email);
            setUserRole(devRole);
            setUserType('cliente_existente'); // Por defecto para clientes en dev mode
            setUserEmail(user.email || undefined);
            setUserName(undefined);
          } else {
            setUserEmail(user.email || undefined);
          }
          setCurrentUserId(user.id);
        } catch (error) {
          console.warn("No se pudo obtener perfil del usuario:", error);
          if (!mounted || isCancelled) return;
        }

        // Obtener o crear conversación activa
        const activeConvId = await getActiveConversation(user.id);
        
        if (!mounted || isCancelled) return;
        
        setConversationId(activeConvId);

        // Cargar mensajes históricos usando sistema optimizado
        const { getOptimizedConversationMessages, shouldCreateSummary, createConversationSummary } = await import("../lib/conversationSummaries");
        
        // Verificar si necesita crear resumen
        const needsSummary = await shouldCreateSummary(activeConvId);
        if (needsSummary) {
          await createConversationSummary(activeConvId);
        }
        
        // Obtener mensajes optimizados (resúmenes + mensajes recientes)
        const { summaries, recentMessages, totalMessageCount } = await getOptimizedConversationMessages(activeConvId);
        
        if (!mounted || isCancelled) return;
        
        // Mapear mensajes recientes
        const mappedMessages = recentMessages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.created_at),
          menu: undefined,
          document: undefined,
        }));
        
        // Si hay resúmenes, agregar un mensaje especial al inicio
        if (summaries.length > 0) {
          const summaryMessage = {
            id: `summary-${summaries[0].id}`,
            conversation_id: activeConvId,
            text: `📋 **Resumen de conversación anterior:**\n\n${summaries.map(s => s.summary_text).join('\n\n')}\n\n_Se muestran los últimos ${recentMessages.length} mensajes. Para ver el historial completo, contacta con nuestro equipo._`,
            sender: "assistant" as const,
            user_id: user.id,
            created_at: summaries[0].created_at,
            timestamp: new Date(summaries[0].created_at),
            menu: undefined,
            document: undefined,
          };
          mappedMessages.unshift(summaryMessage);
        }
        
        setMessages(mappedMessages);

        // Si no hay mensajes, mostrar mensaje de bienvenida automático
        if (mappedMessages.length === 0 && activeConvId && mounted && !isCancelled) {
          // Obtener información de la empresa para personalizar el mensaje
          const { getCompanyInfo } = await import("../lib/companyConfig");
          const { generateContextualMessages, formatClientName } = await import("../lib/responseConfig");
          const { getOrCreateClientInfo } = await import("../lib/clientInfo");
          const companyInfo = await getCompanyInfo();
          const companyName = companyInfo?.company_name || "MTZ";
          
          // Cargar información del cliente para obtener nombre/apodo y género
          let clientInfo = null;
          try {
            clientInfo = await getOrCreateClientInfo(user.id);
          } catch (error) {
            console.warn("No se pudo obtener información del cliente:", error);
          }
          
          // Generar mensaje contextual usando la configuración de respuestas
          // Usar valores locales en lugar de estado para evitar dependencias
          const currentUserType = userType || "invitado";
          const isInvitado = currentUserType === 'invitado' || userRole === 'invitado';
          
          // Para INVITADOS: usar nombre simple sin formateo (sin "Don", "Srita", ni "estimado cliente")
          // Para CLIENTES: formatear nombre con "Don" o "Srita"
          let displayNameForWelcome = '';
          let formattedClientName = '';
          
          if (isInvitado) {
            // Invitados: NO usar nombres técnicos como "dev-invitado"
            // Solo usar nombres reales si existen, de lo contrario dejar vacío para saludo genérico
            const rawName = userName || clientInfo?.preferred_name || clientInfo?.company_name || '';
            // Filtrar nombres técnicos de desarrollo (dev-*, invitado, etc.)
            if (rawName && 
                !rawName.toLowerCase().includes('dev-') && 
                !rawName.toLowerCase().includes('invitado') &&
                !rawName.toLowerCase().includes('test') &&
                rawName.trim().length > 0) {
              displayNameForWelcome = rawName;
            } else {
              // Si es un nombre técnico o no hay nombre real, usar cadena vacía para saludo genérico
              displayNameForWelcome = '';
            }
            formattedClientName = displayNameForWelcome;
          } else {
            // Clientes: formatear nombre con "Don" o "Srita"
            formattedClientName = formatClientName(
              userName || clientInfo?.company_name || undefined,
              clientInfo?.preferred_name || undefined,
              clientInfo?.use_formal_address !== false,
              clientInfo?.gender || undefined
            );
            displayNameForWelcome = formattedClientName;
          }
          
          const context = {
            userType: currentUserType,
            userName: isInvitado ? displayNameForWelcome : formattedClientName,
            companyName: companyName,
            memories: [],
            recentMessages: [],
          };
          const contextualMessages = generateContextualMessages(context, {
            preferredName: clientInfo?.preferred_name,
            useFormalAddress: clientInfo?.use_formal_address !== false,
            gender: clientInfo?.gender || undefined,
          });
          
          // Crear mensaje de bienvenida personalizado
          const greeting = contextualMessages.greeting;
          const welcomeMsg = contextualMessages.welcomeMessage;
          const displayName = contextualMessages.userName;
          
          // Verificar si el usuario tiene perfil completo
          const hasCompleteProfile = clientInfo && (
            clientInfo.phone || 
            clientInfo.is_mtz_client !== null ||
            clientInfo.wants_to_be_client !== null
          );
          
          // Generar mensaje de bienvenida - SEPARADO POR ROL CON MENÚ
          const { CHAT_TREES } = await import('../lib/chatbot/chatTrees');
          
          let welcomeMessage = '';
          let initialMenu: any = undefined;
          
          // Determinar rol efectivo
          const safeUserRole = userRole || 'invitado'; // Default to invitado if undefined
          
          if (isInvitado) {
             const rootMenu = CHAT_TREES['invitado_root'];
             welcomeMessage = rootMenu.text;
             initialMenu = {
                type: 'options',
                title: 'Opciones:',
                options: rootMenu.options
             };
          } else {
             // Clientes
             const rootMenuId = 'cliente_root';
             const rootMenu = CHAT_TREES[rootMenuId];
             // Personalizar texto con nombre real
             welcomeMessage = rootMenu.text.replace('[Nombre]', formattedClientName || displayNameForWelcome || 'Cliente');
             
             initialMenu = {
                type: 'options',
                title: 'Opciones:',
                options: rootMenu.options
             };
          }
          
          // Crear mensaje de bienvenida en la base de datos
          const welcomeMsgData = await createMessage(
            activeConvId,
            user.id,
            welcomeMessage,
            "assistant"
          );
          
          if (welcomeMsgData && mounted && !isCancelled) {
            setMessages([
              {
                ...welcomeMsgData,
                timestamp: new Date(welcomeMsgData.created_at),
                menu: initialMenu // Attach the menu we just determined
              },
            ]);
            
            // Reproducir mensaje de bienvenida en audio
            playWelcomeAudio(greeting, welcomeMsg, displayName);
          }
        }

        // Cargar recuerdos importantes para contexto futuro
        if (mounted && !isCancelled) {
          const memories = await getUserMemories(user.id, activeConvId);
          if (memories.length > 0 && mounted && !isCancelled) {
            console.log("Recuerdos cargados:", memories.length);
          }
        }
      } catch (error: any) {
        if (!mounted || isCancelled) return;
        
        console.error("Error al cargar conversación:", error);
        // Si hay error crítico, permitir usar la app sin conversación
        if (error?.code === "42P01") {
          console.warn(
            "Las tablas aún no están creadas. Ejecuta supabase-chat-structure.sql en Supabase."
          );
        }
      } finally {
        if (mounted && !isCancelled) {
          setLoadingHistory(false);
        }
      }
    };

    loadConversation();

    return () => {
      isCancelled = true;
      mounted = false;
      // Limpiar estados al desmontar para evitar problemas al remontar
      setLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío - se ejecuta cada vez que el componente se monta

  const handleSend = useCallback(async (customMessage?: string) => {
    const messageToSend = customMessage || input.trim();
    
    // Verificaciones más estrictas
    if (!messageToSend) {
      console.log("handleSend bloqueado: no hay mensaje para enviar");
      return;
    }

    if (loading || loadingHistory) {
      console.log("handleSend bloqueado: sistema cargando", { loading, loadingHistory });
      return;
    }

    if (!conversationId) {
      console.warn("handleSend bloqueado: no hay conversationId");
      return;
    }

    // Obtener usuario actual (con fallback para modo desarrollo)
    let user = null;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    } catch (error) {
      console.log('No hay usuario de Supabase, intentando desde caché...');
    }
    
    // Si no hay usuario de Supabase, intentar desde caché (modo desarrollo)
    if (!user) {
      const cachedUser = sessionCache.get();
      if (cachedUser && cachedUser.id) {
        user = {
          id: cachedUser.id,
          email: cachedUser.email || '',
        } as any;
        console.log('✅ Usando usuario desde caché para enviar mensaje:', user.id);
      }
    }

    if (!user) {
      console.warn("No hay usuario autenticado ni en caché");
      return;
    }

    const currentInput = messageToSend;
    if (!customMessage) {
      setInput("");
    }
    
    // Crear AbortController para poder cancelar la respuesta
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);

    try {
      // Crear mensaje del usuario en la conversación
      const userMsg = await createMessage(
        conversationId,
        user.id,
        currentInput,
        "user"
      );

      if (userMsg) {
        setMessages((prev) => [
          ...prev,
          {
            ...userMsg,
            timestamp: new Date(userMsg.created_at),
          },
        ]);
      }

      // Detectar si el mensaje contiene información importante para guardar en memoria
      const importantInfo = await detectImportantInfo(currentInput);

      if (importantInfo.shouldSave && importantInfo.type) {
        // Guardar en memoria automáticamente con el tipo correcto
        await createMemory(
          user.id,
          conversationId,
          importantInfo.type,
          currentInput,
          importantInfo.type === "important_info" ? 7 : 5 // Alta importancia para info importante
        );
      }
      
      // Detectar y guardar información del cliente (RUT, giro, etc.)
      const { detectAndSaveClientInfo } = await import("../lib/chatUtils");
      await detectAndSaveClientInfo(user.id, currentInput);

      // Verificar si se canceló la operación
      if (controller.signal.aborted) {
        return;
      }

      // Generar respuesta inteligente usando el motor de respuestas
      // Simular tiempo de procesamiento para mejor UX
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 800);
        controller.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          resolve(undefined);
        });
      });

      // Verificar nuevamente si se canceló
      if (controller.signal.aborted) {
        return;
      }

      // --- NEW HYBRID ROUTER INTEGRATION ---
      const assistantResponse = await handleChat(
        user.id,
        currentInput, // normalized input is handled inside handleChat
        chatUtilsState,
        (userRole as 'cliente' | 'invitado') || 'invitado',
        userName
      );

      // Manejar respuesta
      let responseText = assistantResponse.text;
      let responseMenu: any = undefined;
      // Map 'options' (Array) to 'menu' (InteractiveMenu format) if show_menu is true
      if (assistantResponse.show_menu && assistantResponse.options) {
        responseMenu = {
          type: 'options',
          title: 'Opciones disponibles:',
          options: assistantResponse.options
        };
      } else if (assistantResponse.options && assistantResponse.options.length > 0) {
         // Even if show_menu is false, if there are options, we might want to show them as quick actions
         // For now, let's map them to menu as well to ensure they are visible
         responseMenu = {
          type: 'options',
          title: 'Acciones sugeridas:',
          options: assistantResponse.options
        };
      }
      
      let responseDocument: any = undefined; // chatEngine doesn't support docs yet in Phase 2
      
      // Execute actions returned by the engine (e.g., navigation)
      if (assistantResponse.action_to_execute) {
         const { type, payload } = assistantResponse.action_to_execute;
         console.log("🤖 Engine requested action:", type, payload);
         
         if (type === 'navigate' && payload?.route) {
             // Small delay to allow message to appear first
             setTimeout(() => {
                 try {
                     // Check if it's a valid tab
                     const validTabs = ['chat', 'mtz-consultores', 'abuelita-alejandra', 'services', 'meetings', 'documents', 'company', 'requests', 'notes', 'profile'];
                     if (validTabs.includes(payload.route)) {
                        setActiveTab(payload.route as ClientTab);
                     } else {
                        console.warn("Invalid route requested:", payload.route);
                     }
                 } catch(e) {
                     console.error("Navigation action failed:", e);
                 }
             }, 800);
         }
      }
      // -------------------------------------

      // Crear mensaje del asistente
      const assistantMsg = await createMessage(
        conversationId,
        user.id,
        responseText,
        "assistant"
      );

      if (assistantMsg) {
        const newMessage = {
          ...assistantMsg,
          timestamp: new Date(assistantMsg.created_at),
          menu: responseMenu,
          document: responseDocument,
        };
        
        // Reproducir audio automáticamente si está habilitado (por defecto sí)
        // El audio se reproduce automáticamente a través de VoiceControls cuando textToRead cambia
        // Solo actualizamos lastAssistantMessage para que VoiceControls lo detecte
        setMessages((prev) => [...prev, newMessage]);
        // Actualizar texto para lectura de voz
        setLastAssistantMessage(responseText);
      }
    } catch (error) {
      // No mostrar error si fue cancelado intencionalmente
      if (controller.signal.aborted) {
        return;
      }
      
      console.error("Error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        conversation_id:
          conversationId && !conversationId.startsWith("temp-")
            ? conversationId
            : null,
        text: "Lo siento, hubo un error. Por favor intenta de nuevo.",
        sender: "assistant",
        user_id: user.id,
        created_at: new Date().toISOString(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  }, [input, loading, conversationId, loadingHistory, userType, userName]);
  
  // Actualizar referencia cuando handleSend cambia
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  const handleStopResponse = () => {
    if (abortController) {
      abortController.abort();
      setLoading(false);
      setAbortController(null);
      
      // Agregar mensaje indicando que se detuvo
      const stopMessage: Message = {
        id: Date.now().toString(),
        conversation_id: conversationId,
        text: "Respuesta detenida. ¿Necesitas ayuda de un ejecutivo?",
        sender: "assistant",
        user_id: currentUserId || "",
        created_at: new Date().toISOString(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, stopMessage]);
    }
  };

  // Función para limpiar/reiniciar el chat
  const handleClearChat = async () => {
    if (!currentUserId || !conversationId) return;

    try {
      setLoading(true);
      
      // Limpiar conversación
      const newConversationId = await clearConversation(currentUserId, conversationId);
      
      // Limpiar mensajes locales
      setMessages([]);
      setInput("");
      setConversationId(newConversationId);
      setWelcomePlayed(false);
      
      // Recargar mensajes (debería estar vacío)
      const newMessages = await getConversationMessages(newConversationId);
      setMessages(newMessages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.created_at)
      })));
      
      setShowClearConfirm(false);
    } catch (error) {
      console.error("Error al limpiar chat:", error);
      alert("Error al limpiar el chat. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Función para reproducir mensaje de bienvenida en audio usando Gemini TTS
  const playWelcomeAudio = async (greeting: string, welcomeMsg: string, displayName: string) => {
    // Verificar si ya se reprodujo el mensaje de bienvenida
    if (welcomePlayed) {
      return;
    }

    // Crear mensaje de audio corto y natural
    // Mensaje más simple y directo como pidió el usuario
    const audioText = userName 
      ? `¡Hola ${displayName}! Soy Arise, tu asistente de MTZ. ¿En qué te ayudo?`
      : `¡Hola! Soy Arise, tu asistente de MTZ. ¿En qué te ayudo?`;

    try {
      // Cargar configuración desde localStorage si existe
      let voiceRate = 1.1;
      let voicePitch = 1.1;
      let voiceVolume = 1.0;
      let useGemini = false; // Por defecto usar TTS del navegador (gratis)
      let geminiVoiceName = 'es-CL-Neural2-A';
      
      try {
        const saved = localStorage.getItem('voiceSettings');
        if (saved) {
          const parsed = JSON.parse(saved);
          voiceRate = parsed.speakingRate || voiceRate;
          voicePitch = parsed.pitch || voicePitch;
          voiceVolume = parsed.volume || voiceVolume;
          useGemini = parsed.useGeminiTTS !== undefined ? parsed.useGeminiTTS : useGemini;
          geminiVoiceName = parsed.geminiVoice || geminiVoiceName;
        }
      } catch (error) {
        console.log('Error cargando configuración de voz:', error);
      }
      
      // Intentar usar Gemini TTS primero para voz más natural y latina
      await speak(audioText, {
        rate: voiceRate,
        pitch: voicePitch,
        volume: voiceVolume,
        useGemini: useGemini,
        geminiVoice: useGemini ? geminiVoiceName : undefined,
      });
      setWelcomePlayed(true);
    } catch (error) {
      console.warn('Error al reproducir audio de bienvenida:', error);
      // Si falla, no marcar como reproducido para permitir reintento
    }
  };

  // Cargar voces disponibles cuando estén listas
  useEffect(() => {
    const loadVoices = () => {
      // Las voces pueden tardar en cargarse
      if (window.speechSynthesis.getVoices().length > 0) {
        return;
      }
      // Intentar cargar voces después de un delay
      setTimeout(() => {
        window.speechSynthesis.getVoices();
      }, 100);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      // Limpiar al desmontar
      if (welcomeSpeechRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Verificar que el botón no esté deshabilitado antes de enviar
      if (input.trim() && !loading && conversationId && !loadingHistory) {
        handleSend();
      }
    }
  };

  // Detectar si el usuario quiere ver reuniones
  useEffect(() => {
    // DESHABILITADO: No abrir automáticamente el panel de reuniones
    // El usuario debe solicitarlo explícitamente o el chatbot debe derivarlo cuando sea necesario
    // Esto evita interrupciones cuando el usuario está haciendo otras consultas
    // const lastMessage = messages[messages.length - 1];
    // if (
    //   lastMessage &&
    //   lastMessage.sender === "user" &&
    //   (lastMessage.text.toLowerCase().includes("reunión") ||
    //     lastMessage.text.toLowerCase().includes("reunion") ||
    //     lastMessage.text.toLowerCase().includes("agendar") ||
    //     lastMessage.text.toLowerCase().includes("reservar") ||
    //     lastMessage.text.toLowerCase().includes("cita"))
    // ) {
    //   setShowMeetings(true);
    // }
  }, [messages]);

  // Filtrar mensajes según búsqueda
  const filteredMessages = searchQuery.trim()
    ? messages.filter((msg) =>
        msg.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Determinar si mostrar el sidebar (para todos los usuarios excepto admins)
  // Los admins tienen su propio panel, así que no necesitan este sidebar
  const shouldShowSidebar = currentUserId && 
    userRole !== 'admin';

  if (loadingHistory) {
    return (
      <div className="chat-interface">
        <div className="messages-container">
          <div className="empty-state">
            <div className="spinner"></div>
            <p>Cargando conversación...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si hay un tab activo diferente a chat, mostrar la sección correspondiente
  if (shouldShowSidebar && activeTab !== 'chat' && currentUserId) {
    return (
      <div className="chat-interface with-sidebar">
        {shouldShowSidebar && (
          <ClientSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userId={currentUserId}
            userRole={userRole || 'invitado'}
          />
        )}
        <div className="chat-content" key={activeTab}>
          {/* Secciones para invitados */}
          {activeTab === 'mtz-consultores' && (
            <MTZConsultoresSection onBack={() => setActiveTab('chat')} />
          )}
          {activeTab === 'abuelita-alejandra' && (
            <AbuelitaAlejandraSection onBack={() => setActiveTab('chat')} />
          )}
          {/* Seccion de Servicios (Común) */}
          {activeTab === 'services' && (
            <ClientServicesSection onBack={() => setActiveTab('chat')} />
          )}
          {/* Secciones para clientes */}
          {activeTab === 'meetings' && (
            <ClientMeetingsSection
              userId={currentUserId}
              onBack={() => setActiveTab('chat')}
            />
          )}
          {activeTab === 'documents' && (
            <ClientDocumentsSection
              userId={currentUserId}
              onBack={() => setActiveTab('chat')}
            />
          )}
          {activeTab === 'company' && (
            <ClientCompanyInfoSection
              userId={currentUserId}
              onBack={() => setActiveTab('chat')}
            />
          )}
          {activeTab === 'requests' && (
            <ClientRequestsSection
              userId={currentUserId}
              userRole="cliente"
              onBack={() => setActiveTab('chat')}
            />
          )}
          {activeTab === 'notes' && (
            <ClientNotesSection
              userId={currentUserId}
              onBack={() => setActiveTab('chat')}
            />
          )}
          {activeTab === 'profile' && (
            <ClientProfileSection
              userId={currentUserId}
              userEmail={userEmail || ''}
              userName={userName}
              onBack={() => setActiveTab('chat')}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-interface ${shouldShowSidebar ? 'with-sidebar' : ''}`}>
      {shouldShowSidebar && currentUserId && (
        <ClientSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userId={currentUserId}
          userRole={userRole || 'invitado'}
        />
      )}
      <div className="chat-content">
      <>

      {/* Vista de reuniones */}
      {showMeetings && currentUserId && (
        <div className="meetings-view">
          <div className="meetings-view-header">
            <h3>📅 Mis Reuniones</h3>
            <button
              onClick={() => setShowMeetings(false)}
              className="close-button"
              aria-label="Cerrar reuniones"
            >
              ✕
            </button>
          </div>
          <MeetingScheduler userId={currentUserId} />
        </div>
      )}

      {/* Barra de búsqueda */}
      {showSearch && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar en la conversación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
            className="search-close-button"
            aria-label="Cerrar búsqueda"
          >
            ✕
          </button>
          {searchQuery.trim() && (
            <span className="search-results-count">
              {filteredMessages.length} resultado{filteredMessages.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Botón de scroll al final */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="scroll-to-bottom-button"
          aria-label="Ir al final"
          title="Ir al final"
        >
          ↓
        </button>
      )}

      <div className="messages-container" ref={messagesContainerRef}>
        {filteredMessages.length === 0 ? (
          <div className="empty-state">
            {searchQuery.trim() ? (
              <>
                <p>No se encontraron mensajes con "{searchQuery}"</p>
                <p className="empty-subtitle">Intenta con otros términos de búsqueda</p>
              </>
            ) : (
              <>
                <p>Comienza una conversación escribiendo un mensaje</p>
                <p className="empty-subtitle">Esta es tu conversación personal</p>
                {/* Mostrar acciones rápidas cuando no hay mensajes */}
                <QuickActions
                  onActionClick={(actionId) => {
                    console.log("Acción rápida seleccionada:", actionId);
                  }}
                  onSendMessage={(message) => {
                    setInput(message);
                    // Auto-enviar después de un pequeño delay
                    setTimeout(() => {
                      handleSend(message);
                    }, 300);
                  }}
                />
              </>
            )}
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div key={message.id} className={`message ${message.sender}`}>
              <div className="message-content">
                {/* Mostrar nombre Arise y botón Leer solo en mensajes del asistente */}
                {message.sender === "assistant" && (
                  <div className="assistant-header">
                    <span className="assistant-name">Arise</span>
                    <button
                      className={`read-button ${ttsIsSpeaking && lastAssistantMessage === message.text ? "active" : ""}`}
                      onClick={() => {
                        // Extraer texto sin HTML para leer
                        const textToRead = message.text.replace(/<[^>]*>/g, '').replace(/\*\*/g, '').trim();
                        
                        if (ttsIsSpeaking && lastAssistantMessage === message.text) {
                          // Si está leyendo este mensaje, pausar/reanudar
                          if (ttsIsPaused) {
                            resume();
                          } else {
                            pause();
                          }
                        } else {
                          // Leer este mensaje
                          stopTTS(); // Detener cualquier lectura anterior
                          if (textToRead) {
                            // Cargar configuración desde localStorage si existe
                            let voiceRate = 1.1;
                            let voicePitch = 1.1;
                            let voiceVolume = 1.0;
                            let useGemini = true;
                            let geminiVoiceName = 'es-CL-Neural2-A';
                            
                            try {
                              const saved = localStorage.getItem('voiceSettings');
                              if (saved) {
                                const parsed = JSON.parse(saved);
                                voiceRate = parsed.speakingRate || voiceRate;
                                voicePitch = parsed.pitch || voicePitch;
                                voiceVolume = parsed.volume || voiceVolume;
                                useGemini = parsed.useGeminiTTS !== undefined ? parsed.useGeminiTTS : useGemini;
                                geminiVoiceName = parsed.geminiVoice || geminiVoiceName;
                              }
                            } catch (error) {
                              console.log('Error cargando configuración de voz:', error);
                            }
                            
                            speak(textToRead, {
                              rate: voiceRate,
                              pitch: voicePitch,
                              volume: voiceVolume,
                              useGemini: useGemini,
                              geminiVoice: useGemini ? geminiVoiceName : undefined,
                            });
                            setLastAssistantMessage(message.text);
                          }
                        }
                      }}
                      type="button"
                      title={ttsIsSpeaking && lastAssistantMessage === message.text 
                        ? (ttsIsPaused ? "Reanudar lectura" : "Pausar lectura") 
                        : "Leer mensaje"}
                      aria-label="Leer mensaje"
                    >
                      {ttsIsSpeaking && lastAssistantMessage === message.text 
                        ? (ttsIsPaused ? "▶️" : "⏸️") 
                        : "🔊"}
                    </button>
                  </div>
                )}
                
                {hasMarkdown(message.text) ? (
                  <p
                    dangerouslySetInnerHTML={{
                      __html: markdownToHtml(message.text),
                    }}
                  />
                ) : (
                  <p>{message.text}</p>
                )}

                {/* Mostrar CategoryButtons si el mensaje indica solicitud de categorías */}
                {(message.text.toLowerCase().includes("ver todas las categorías") ||
                  message.text.toLowerCase().includes("ver todas las categorias") ||
                  message.text.toLowerCase().includes("categorías de trámites") ||
                  message.text.toLowerCase().includes("categorias de tramites") ||
                  message.text.toLowerCase().includes("ver categorías") ||
                  message.text.toLowerCase().includes("ver categorias")) &&
                message.sender === "user" ? (
                  <div className="category-buttons-wrapper">
                    <CategoryButtons
                      onCategorySelect={(categoryId) => {
                        console.log("Categoría seleccionada:", categoryId);
                      }}
                      onTramiteSelect={(tramiteId) => {
                        console.log("Trámite seleccionado:", tramiteId);
                      }}
                    />
                  </div>
                ) : null}

                {/* Mostrar menú interactivo si existe */}
                {message.menu && message.menu.options && currentUserId && (
                  <InteractiveMenu
                    options={message.menu.options}
                    userId={currentUserId}
                    title={message.menu.title}
                    description={message.menu.description}
                    guideImage={message.menu.guide_image}
                    onActionComplete={async (action, result) => {
                      console.log("Acción completada:", action, result);
                      
                      if (action === "navigate" && result?.route) {
                        try {
                           setActiveTab(result.route as ClientTab);
                        } catch (e) {
                          console.warn("Ruta no válida:", result.route);
                        }
                      }
                      
                      if ((action === "show_menu" && result?.menu) || (action === "show_tutorial" && result?.id)) {
                        const { CHAT_TREES, TUTORIAL_CONTENT } = await import('../lib/chatbot/chatTrees');
                        
                        if (action === "show_menu") {
                            const menuKey = result.menu;
                            let targetMenuKey = menuKey;
                            if (menuKey === 'root_back') {
                               targetMenuKey = userRole === 'cliente' ? 'cliente_root' : 'invitado_root';
                            }
                            
                            const menu = CHAT_TREES[targetMenuKey];
                            if (menu && currentUserId) {
                               const newMsg: MessageWithMenu = {
                                 id: `menu-${Date.now()}`,
                                 conversation_id: conversationId!,
                                 sender: 'assistant',
                                 user_id: currentUserId,
                                 text: menu.text,
                                 created_at: new Date().toISOString(),
                                 timestamp: new Date(),
                                 menu: {
                                   type: 'options',
                                   title: 'Opciones:',
                                   options: menu.options
                                 }
                               };
                               setMessages(prev => [...prev, newMsg]);
                               setLastAssistantMessage(menu.text);
                            }
                        }
                        
                        if (action === "show_tutorial" && result.id) {
                             // Special handler for dynamic data actions
                             if (result.id === 'action_fetch_profile' && currentUserId) {
                               setLoading(true);
                               try {
                                 // Dynamic import to keep bundle small
                                 const { supabase } = await import('../lib/supabase');
                                 const { data: profile } = await supabase
                                    .from('client_extended_info')
                                    .select('*')
                                    .eq('id', currentUserId)
                                    .single();
                                    
                                 let profileText = '';
                                 if (profile) {
                                    profileText = `📋 **Ficha de Cliente**\n\n` +
                                      `**Nombre:** ${profile.preferred_name || 'No registrado'}\n` +
                                      `**RUT:** ${profile.rut || 'No registrado'}\n` +
                                      `**Empresa:** ${profile.company_name || 'No registrada'}\n` +
                                      `**Giro:** ${profile.business_line || 'No registrado'}\n` +
                                      `**Regimen:** ${profile.tax_regime || 'No asignado'}\n\n` +
                                      `*Esta información es privada y solo tú puedes verla.*`;
                                 } else {
                                    profileText = "⚠️ No encontramos información extendida en tu perfil. Por favor, actualiza tus datos en la sección 'Mi Perfil'.";
                                 }
                                 
                                 const newMsg: MessageWithMenu = {
                                   id: `prof-${Date.now()}`,
                                   conversation_id: conversationId!,
                                   sender: 'assistant',
                                   user_id: currentUserId,
                                   text: profileText,
                                   created_at: new Date().toISOString(),
                                   timestamp: new Date(),
                                 };
                                 setMessages(prev => [...prev, newMsg]);
                                 setLastAssistantMessage(profileText);
                               } catch (err) {
                                 console.error("Error fetching profile:", err);
                               } finally {
                                 setLoading(false);
                               }
                               return; // Stop here, don't look for static tutorial
                             }

                             const content = TUTORIAL_CONTENT[result.id];
                             if (content && currentUserId) {
                                const newMsg: MessageWithMenu = {
                                 id: `tut-${Date.now()}`,
                                 conversation_id: conversationId!,
                                 sender: 'assistant',
                                 user_id: currentUserId,
                                 text: content,
                                 created_at: new Date().toISOString(),
                                 timestamp: new Date(),
                               };
                               setMessages(prev => [...prev, newMsg]);
                               setLastAssistantMessage(content);
                             }
                        }
                      }
                      
                      // Handle Support Action
                      if (action === "contact_support") {
                          setShowHumanSupport(true);
                      }
                    }}
                  />
                )}

                {/* Mostrar botón de descarga si hay documento */}
                {message.document && message.document.download_url && (
                  <a
                    href={message.document.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="document-download-link"
                    onClick={() => {
                      // Trackear acceso al documento
                      if (message.document?.id) {
                        import("../lib/documents").then(
                          ({ trackDocumentAccess }) => {
                            trackDocumentAccess(message.document.id);
                          }
                        );
                      }
                    }}
                  >
                    📥 Descargar {message.document.document_name}
                  </a>
                )}

                <span className="timestamp">
                  {message.timestamp
                    ? message.timestamp.toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : new Date(message.created_at).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </span>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Modal de soporte humano */}
      {showHumanSupport && (
        <HumanSupportOptions
          onClose={() => setShowHumanSupport(false)}
          userMessage={input.trim() || undefined}
        />
      )}

      {/* Modal de confirmación para limpiar chat */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>¿Limpiar conversación?</h3>
            <p>Esta acción iniciará una nueva conversación. Los mensajes anteriores se guardarán pero no se mostrarán en esta sesión.</p>
            <div className="modal-actions">
              <button
                onClick={handleClearChat}
                className="modal-button primary"
                disabled={loading}
              >
                {loading ? "Limpiando..." : "Sí, limpiar"}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="modal-button secondary"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="input-container">
        <div className="input-actions">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="action-button clear-button"
            title="Limpiar conversación"
            aria-label="Limpiar conversación"
          >
            🗑️
          </button>
          <button
            onClick={() => {
              setShowSearch(!showSearch)
            }}
            className="action-button search-button"
            title="Buscar en conversación"
            aria-label="Buscar"
          >
            🔍
          </button>
        </div>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            loadingHistory
              ? "Cargando conversación..."
              : "Escribe tu mensaje... (Shift+Enter para nueva línea)"
          }
          rows={1}
          disabled={loading || loadingHistory || !conversationId}
          className="message-input"
        />
        <button
          onClick={async () => {
            if (isListening) {
              // Detener grabación manualmente (el usuario puede hacer clic para detener antes de la pausa automática)
              console.log('🛑 Deteniendo grabación manualmente');
              stopListening();
              // El useEffect se encargará de enviar si hay transcript
            } else {
              // Solicitar permisos de micrófono e iniciar grabación continua
              try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                autoSentRef.current = false; // Resetear bandera al iniciar nueva grabación
                console.log('🎤 Iniciando grabación continua - el mensaje se enviará automáticamente cuando detectes una pausa');
                startListening();
                // Ahora el sistema escuchará continuamente y enviará automáticamente
                // cuando detecte una pausa de 2 segundos (configurado en useSpeechToText)
              } catch (error: any) {
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                  alert("Por favor, permite el acceso al micrófono en la configuración de tu navegador.");
                } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                  alert("No se encontró ningún micrófono. Verifica que tu dispositivo tenga un micrófono conectado.");
                } else {
                  alert("No se pudo acceder al micrófono. Por favor, verifica los permisos.");
                }
              }
            }
          }}
          className={`action-button voice-input-button ${isListening ? 'listening' : ''} ${!sttSupported ? 'disabled' : ''}`}
          type="button"
          title={isListening ? "Detener grabación y enviar" : sttSupported ? "Grabar audio" : "Reconocimiento de voz no disponible"}
          aria-label={isListening ? "Detener grabación y enviar" : sttSupported ? "Grabar audio" : "Reconocimiento de voz no disponible"}
          disabled={loading || loadingHistory || !conversationId || !sttSupported}
        >
          {isListening ? '⏹' : '🎙️'}
        </button>
        {loading ? (
          <button
            onClick={handleStopResponse}
            className="stop-button"
            type="button"
            title="Detener respuesta"
          >
            <span className="stop-button-icon">⏹</span>
            <span className="stop-button-text">Detener</span>
          </button>
        ) : (
          <button
            onClick={() => handleSend()}
            disabled={
              !input.trim() || loading || !conversationId || loadingHistory
            }
            className="send-button"
            type="button"
            title="Enviar mensaje (Enter)"
          >
            <span className="send-button-icon">➤</span>
          </button>
        )}
      </div>

      {/* Controles de voz para accesibilidad */}
      <VoiceControls
        onTranscript={(text) => {
          // Cuando se recibe texto del micrófono, enviarlo como mensaje
          if (text.trim()) {
            setInput(text);
            // Auto-enviar después de un pequeño delay
            setTimeout(() => {
              handleSend(text);
            }, 300);
          }
        }}
        autoRead={autoReadEnabled}
        onAutoReadChange={setAutoReadEnabled}
        textToRead={lastAssistantMessage}
      />
      </>
      </div>
    </div>
  );
}

export default ChatInterface;
