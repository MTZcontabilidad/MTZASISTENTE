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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showMeetings, setShowMeetings] = useState(false);
  const [showHumanSupport, setShowHumanSupport] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [autoReadEnabled, setAutoReadEnabled] = useState(false);
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
  }, [messages, scrollToBottom]);

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

    // Resetear estados al montar para evitar estados inconsistentes
    setLoading(false);
    setInput("");

    const loadConversation = async () => {
      try {
        setLoadingHistory(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !mounted) {
          if (mounted) {
            setLoadingHistory(false);
          }
          return;
        }

        // Obtener perfil del usuario para userType y userName
        try {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("user_type, full_name")
            .eq("id", user.id)
            .maybeSingle();

          if (profile) {
            setUserType(profile.user_type as UserType);
            setUserName(profile.full_name || undefined);
          }
          setCurrentUserId(user.id);
        } catch (error) {
          console.warn("No se pudo obtener perfil del usuario:", error);
        }

        // Obtener o crear conversación activa
        const activeConvId = await getActiveConversation(user.id);
        setConversationId(activeConvId);

        // Cargar mensajes históricos
        const historyMessages = await getConversationMessages(activeConvId);
        const mappedMessages = historyMessages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.created_at),
          menu: undefined,
          document: undefined,
        }));
        
        setMessages(mappedMessages);

        // Si no hay mensajes, mostrar mensaje de bienvenida automático
        if (mappedMessages.length === 0 && activeConvId) {
          // Obtener información de la empresa para personalizar el mensaje
          const { getCompanyInfo } = await import("../lib/companyConfig");
          const { generateContextualMessages } = await import("../lib/responseConfig");
          const companyInfo = await getCompanyInfo();
          const companyName = companyInfo?.company_name || "MTZ";
          
          // Generar mensaje contextual usando la configuración de respuestas
          const context = {
            userType: userType || "invitado",
            userName: userName || undefined,
            companyName: companyName,
            memories: [],
            recentMessages: [],
          };
          const contextualMessages = generateContextualMessages(context);
          
          // Crear mensaje de bienvenida personalizado
          const greeting = contextualMessages.greeting;
          const welcomeMsg = contextualMessages.welcomeMessage;
          const displayName = contextualMessages.userName;
          
          const welcomeMessage = `${greeting}, ${displayName}! 👋\n\n${welcomeMsg}. Soy el asistente virtual del equipo ${companyName} y estoy aquí para ayudarte con:\n\n• 📊 Consultas sobre MTZ Consultores Tributarios\n• 🚐 Información sobre Fundación Te Quiero Feliz\n• 🪑 Consultas sobre Taller de Sillas de Ruedas MMC\n• 📋 Información sobre trámites y documentos\n• 💬 Soporte y atención al cliente\n• 📅 Agendar reuniones con nuestro equipo\n\nSi en algún momento necesitas hablar directamente con un ejecutivo, puedes usar el botón 💬 que encontrarás en la barra de mensajes.\n\n¿En qué puedo ayudarte hoy?`;
          
          // Crear mensaje de bienvenida en la base de datos
          const welcomeMsgData = await createMessage(
            activeConvId,
            user.id,
            welcomeMessage,
            "assistant"
          );
          
          if (welcomeMsgData) {
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
        const memories = await getUserMemories(user.id, activeConvId);
        if (memories.length > 0) {
          console.log("Recuerdos cargados:", memories.length);
        }
      } catch (error: any) {
        console.error("Error al cargar conversación:", error);
        // Si hay error crítico, permitir usar la app sin conversación
        if (error?.code === "42P01") {
          console.warn(
            "Las tablas aún no están creadas. Ejecuta supabase-chat-structure.sql en Supabase."
          );
        }
      } finally {
        if (mounted) {
          setLoadingHistory(false);
        }
      }
    };

    loadConversation();

    return () => {
      mounted = false;
      // Limpiar estados al desmontar para evitar problemas al remontar
      setLoading(false);
    };
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
      ? `¡Bienvenido, ${displayName}! Un gusto tenerte aquí. Soy el asistente virtual del equipo MTZ. ¿En qué puedo ayudarte?`
      : `¡Bienvenido! Un gusto tenerte aquí. Soy el asistente virtual del equipo MTZ. ¿En qué puedo ayudarte?`;

    // Esperar un momento para que las voces se carguen si es necesario
    const speakWithVoice = () => {
      // Crear utterance
      const utterance = new SpeechSynthesisUtterance(audioText);
      
      // Configurar voz en español con parámetros mejorados
      utterance.lang = 'es-CL'; // Preferir español de Chile
      utterance.rate = 0.9; // Velocidad más conversacional y natural
      utterance.pitch = 1.0; // Tono natural
      utterance.volume = 1.0; // Volumen máximo

      // Intentar usar la mejor voz en español disponible
      const voices = window.speechSynthesis.getVoices();
      
      // Priorizar voces más naturales
      const preferredVoiceNames = [
        "Microsoft Sabina",
        "Google español",
        "Microsoft Pablo",
        "Microsoft Helena",
        "Microsoft Laura"
      ];
      
      let spanishVoice = null;
      
      // Buscar voces preferidas primero
      for (const preferredName of preferredVoiceNames) {
        const voice = voices.find(v => 
          v.name.includes(preferredName) && v.lang.startsWith('es')
        );
        if (voice) {
          spanishVoice = voice;
          break;
        }
      }
      
      // Si no se encontró una preferida, buscar cualquier voz en español
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
        console.warn('Error al reproducir audio de bienvenida:', error);
        welcomeSpeechRef.current = null;
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

  return (
    <div className="chat-interface">
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
            onClick={() => setShowSearch(!showSearch)}
            className="action-button search-button"
            title="Buscar en conversación"
            aria-label="Buscar"
          >
            🔍
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
