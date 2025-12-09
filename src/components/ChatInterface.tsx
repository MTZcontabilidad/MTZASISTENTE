import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  getActiveConversation,
  getConversationMessages,
  createMessage,
} from "../lib/conversations";
import { getUserMemories, createMemory } from "../lib/memories";
import {
  generateResponse,
  detectImportantInfo,
  type ResponseWithMenu,
} from "../lib/responseEngine";
import { markdownToHtml, hasMarkdown } from "../lib/markdown";
import { Message, UserType } from "../types";
import InteractiveMenu from "./InteractiveMenu";
import QuickActions from "./QuickActions";
import CategoryButtons from "./CategoryButtons";
import MeetingScheduler from "./MeetingScheduler";
import VoiceControls from "./VoiceControls";
import HumanSupportOptions from "./HumanSupportOptions";
import UserProfile from "./UserProfile";
import "./ChatInterface.css";

interface MessageWithMenu extends Message {
  menu?: any;
  document?: any;
}

function ChatInterface() {
  const [messages, setMessages] = useState<MessageWithMenu[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [userType, setUserType] = useState<UserType | undefined>(undefined);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showMeetings, setShowMeetings] = useState(false);
  const [showHumanSupport, setShowHumanSupport] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [autoReadEnabled, setAutoReadEnabled] = useState(true); // Habilitado por defecto
  const [lastAssistantMessage, setLastAssistantMessage] = useState<string>("");
  const [welcomePlayed, setWelcomePlayed] = useState(false);
  const welcomeSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (!user || !mounted || isCancelled) {
          if (mounted && !isCancelled) {
            setLoadingHistory(false);
          }
          return;
        }

        // Obtener perfil del usuario para userType y userName
        try {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("user_type, full_name, email")
            .eq("id", user.id)
            .maybeSingle();

          if (!mounted || isCancelled) return;

          if (profile) {
            setUserType(profile.user_type as UserType);
            setUserName(profile.full_name || undefined);
            setUserEmail(profile.email || user.email || undefined);
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

        // Cargar mensajes históricos
        const historyMessages = await getConversationMessages(activeConvId);
        
        if (!mounted || isCancelled) return;
        
        const mappedMessages = historyMessages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.created_at),
          menu: undefined,
          document: undefined,
        }));
        
        setMessages(mappedMessages);

        // Si no hay mensajes, mostrar mensaje de bienvenida automático
        if (mappedMessages.length === 0 && activeConvId && mounted && !isCancelled) {
          // Obtener información de la empresa para personalizar el mensaje
          const { getCompanyInfo } = await import("../lib/companyConfig");
          const { generateContextualMessages } = await import("../lib/responseConfig");
          const companyInfo = await getCompanyInfo();
          const companyName = companyInfo?.company_name || "MTZ";
          
          // Generar mensaje contextual usando la configuración de respuestas
          // Usar valores locales en lugar de estado para evitar dependencias
          const currentUserType = userType || "invitado";
          const currentUserName = userName || undefined;
          const context = {
            userType: currentUserType,
            userName: currentUserName,
            companyName: companyName,
            memories: [],
            recentMessages: [],
          };
          const contextualMessages = generateContextualMessages(context);
          
          // Crear mensaje de bienvenida personalizado
          const greeting = contextualMessages.greeting;
          const welcomeMsg = contextualMessages.welcomeMessage;
          const displayName = contextualMessages.userName;
          
          // Agregar mensaje sobre beneficios limitados para usuarios invitados
          let benefitsNotice = '';
          if (currentUserType === 'invitado') {
            benefitsNotice = '\n\n⚠️ **Nota importante**: Estás ingresando como invitado. Para acceder a todos los beneficios y servicios completos (como descargar documentos, ver tu historial completo, y recibir atención personalizada), te recomendamos registrarte con tu cuenta de Gmail.\n\n';
          }
          
          const welcomeMessage = `${greeting}, ${displayName}! 👋\n\n${welcomeMsg}. Soy **Arise**, tu asistente virtual de MTZ y estoy aquí para ayudarte con:\n\n• 📊 **MTZ Consultores Tributarios** - Consultoría tributaria y contable\n• 🚐 **Fundación Te Quiero Feliz** - Información sobre nuestros programas sociales\n• 🪑 **Taller de Sillas de Ruedas MMC** - Servicios de movilidad\n• 📋 Trámites y documentos\n• 💬 Soporte y atención al cliente\n• 📅 Agendar reuniones con nuestro equipo${benefitsNotice}\nPuedo guiarte hacia el servicio que necesitas. ¿Qué te interesa conocer?`;
          
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

  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input.trim();
    
    // Verificaciones más estrictas
    if (!messageToSend || loading || !conversationId || loadingHistory) {
      console.log("handleSend bloqueado:", {
        hasInput: !!messageToSend,
        loading,
        conversationId,
        loadingHistory,
      });
      return;
    }

    // Obtener usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.warn("No hay usuario autenticado");
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
      const importantInfo = detectImportantInfo(currentInput);

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
      const { detectAndSaveClientInfo } = await import("../lib/responseEngine");
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

      const assistantResponse = await generateResponse({
        userId: user.id,
        conversationId,
        userInput: currentInput,
        userType,
        userName,
      });

      // Manejar respuesta con menú o documento
      let responseText: string;
      let responseMenu: any = undefined;
      let responseDocument: any = undefined;

      if (
        typeof assistantResponse === "object" &&
        "text" in assistantResponse
      ) {
        // Respuesta con menú o documento
        const responseWithMenu = assistantResponse as ResponseWithMenu;
        responseText = responseWithMenu.text;
        responseMenu = responseWithMenu.menu;
        responseDocument = responseWithMenu.document;
      } else {
        // Respuesta de texto simple
        responseText = assistantResponse as string;
      }

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
  };

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

  // Función para reproducir mensaje de bienvenida en audio
  const playWelcomeAudio = (greeting: string, welcomeMsg: string, displayName: string) => {
    // Verificar si ya se reprodujo el mensaje de bienvenida
    if (welcomePlayed) {
      return;
    }

    // Verificar si el navegador soporta Speech Synthesis
    if (!('speechSynthesis' in window)) {
      console.warn('Tu navegador no soporta síntesis de voz');
      return;
    }

    // Cancelar cualquier síntesis anterior
    window.speechSynthesis.cancel();

    // Crear mensaje de audio corto y natural
    // Mensaje más simple y directo como pidió el usuario
    const audioText = userName 
      ? `¡Bienvenido, ${displayName}! Un gusto tenerte aquí. Soy **Arise**, tu asistente virtual de MTZ. Puedo ayudarte con consultoría tributaria, la fundación, el taller de sillas de ruedas y más. ¿Qué te interesa?`
      : `¡Bienvenido! Un gusto tenerte aquí. Soy **Arise**, tu asistente virtual de MTZ. Puedo ayudarte con consultoría tributaria, la fundación, el taller de sillas de ruedas y más. ¿Qué te interesa?`;

    // Esperar un momento para que las voces se carguen si es necesario
    const speakWithVoice = () => {
      // Crear utterance
      const utterance = new SpeechSynthesisUtterance(audioText);
      
      // Configurar voz en español con parámetros mejorados - más rápida, amigable y con carisma
      utterance.lang = 'es-CL'; // Preferir español de Chile
      utterance.rate = 1.15; // Velocidad más rápida y dinámica
      utterance.pitch = 1.15; // Tono más alto, amigable y simpático
      utterance.volume = 1.0; // Volumen máximo

      // Intentar usar la mejor voz en español disponible
      // PRIORIZAR VOCES DE CHILE Y LATINOAMÉRICA sobre España
      const voices = window.speechSynthesis.getVoices();
      
      // Priorizar voces más naturales de Chile y Latinoamérica
      const preferredVoiceNames = [
        "Microsoft Sabina", // México - latino
        "Google español",
        "es-CL", // Chile - máxima prioridad
        "es-MX", // México
        "es-AR", // Argentina
        "es-CO", // Colombia
        "Microsoft Pablo", // España - última opción
        "Microsoft Helena", // España
        "Microsoft Laura" // España
      ];
      
      let spanishVoice = null;
      
      // PRIMERO: Buscar voces de Chile (es-CL) - máxima prioridad
      const chileVoice = voices.find(voice => 
        voice.lang.startsWith('es-CL')
      );
      if (chileVoice) {
        spanishVoice = chileVoice;
      }
      
      // SEGUNDO: Si no hay de Chile, buscar otras voces latinoamericanas
      if (!spanishVoice) {
        for (const preferredName of preferredVoiceNames) {
          const voice = voices.find(v => {
            if (v.name.includes(preferredName) && v.lang.startsWith('es')) {
              // Evitar voces de España si hay otras opciones
              return !v.lang.startsWith('es-ES');
            }
            return false;
          });
          if (voice) {
            spanishVoice = voice;
            break;
          }
        }
      }
      
      // TERCERO: Si no se encontró una preferida, buscar cualquier voz en español latino
      if (!spanishVoice) {
        spanishVoice = voices.find(voice => 
          voice.lang.startsWith('es') && 
          !voice.lang.startsWith('es-ES') && 
          voice.localService
        ) || voices.find(voice => 
          voice.lang.startsWith('es') && 
          !voice.lang.startsWith('es-ES')
        );
      }
      
      // ÚLTIMO RECURSO: Cualquier voz en español (incluyendo España)
      if (!spanishVoice) {
        spanishVoice = voices.find(voice => 
          voice.lang.startsWith('es') && voice.localService
        ) || voices.find(voice => voice.lang.startsWith('es'));
      }
      
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      // Guardar referencia para poder cancelar si es necesario
      welcomeSpeechRef.current = utterance;

      // Reproducir
      window.speechSynthesis.speak(utterance);
      setWelcomePlayed(true);

      // Limpiar referencia cuando termine
      utterance.onend = () => {
        welcomeSpeechRef.current = null;
      };

      utterance.onerror = (error) => {
        // Solo loggear si no es un error de interrupción (que es normal)
        if (error.error !== 'interrupted') {
          console.warn('Error al reproducir audio de bienvenida:', error);
        }
        welcomeSpeechRef.current = null;
        // No marcar como reproducido si hubo error, para permitir reintento
        if (error.error !== 'interrupted') {
          setWelcomePlayed(false);
        }
      };
    };

    // Si las voces ya están cargadas, reproducir inmediatamente
    if (window.speechSynthesis.getVoices().length > 0) {
      speakWithVoice();
    } else {
      // Esperar a que las voces se carguen
      window.speechSynthesis.onvoiceschanged = () => {
        speakWithVoice();
      };
      // Timeout de seguridad
      setTimeout(() => {
        if (!welcomePlayed) {
          speakWithVoice();
        }
      }, 500);
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
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.sender === "user" &&
      (lastMessage.text.toLowerCase().includes("reunión") ||
        lastMessage.text.toLowerCase().includes("reunion") ||
        lastMessage.text.toLowerCase().includes("agendar") ||
        lastMessage.text.toLowerCase().includes("reservar") ||
        lastMessage.text.toLowerCase().includes("cita"))
    ) {
      setShowMeetings(true);
    }
  }, [messages]);

  // Filtrar mensajes según búsqueda
  const filteredMessages = searchQuery.trim()
    ? messages.filter((msg) =>
        msg.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

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

  return (
    <div className="chat-interface">
      {/* Vista de perfil */}
      {showProfile && currentUserId && (
        <div className="profile-view">
          <div className="profile-view-header">
            <h3>👤 Mi Perfil</h3>
            <button
              onClick={() => setShowProfile(false)}
              className="close-button"
              aria-label="Cerrar perfil"
            >
              ✕
            </button>
          </div>
          <UserProfile 
            userId={currentUserId}
            userEmail={userEmail || ''}
            userName={userName}
            onUpdate={() => {
              // Recargar datos si es necesario
              setShowProfile(false)
            }}
          />
        </div>
      )}

      {/* Vista de reuniones */}
      {showMeetings && currentUserId && !showProfile && (
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
                    onActionComplete={(action, result) => {
                      console.log("Acción completada:", action, result);
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

      <div className="input-container">
        <div className="input-actions">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="action-button profile-button"
            title="Mi perfil"
            aria-label="Mi perfil"
          >
            👤
          </button>
          <button
            onClick={() => {
              setShowSearch(!showSearch)
              setShowProfile(false)
            }}
            className="action-button search-button"
            title="Buscar en conversación"
            aria-label="Buscar"
          >
            🔍
          </button>
          <button
            onClick={() => {
              setShowMeetings(true)
              setShowProfile(false)
            }}
            className="action-button meetings-button"
            title="Mis reuniones"
            aria-label="Reuniones"
          >
            📅
          </button>
          <button
            onClick={() => setShowHumanSupport(true)}
            className="action-button support-button"
            title="Contactar con ejecutivo o agendar reunión"
            aria-label="Soporte humano"
          >
            💬
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
    </div>
  );
}

export default ChatInterface;
