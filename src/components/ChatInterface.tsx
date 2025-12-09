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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
        setMessages(
          historyMessages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.created_at),
            menu: undefined,
            document: undefined,
          }))
        );

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

  const handleSend = async () => {
    // Verificaciones más estrictas
    if (!input.trim() || loading || !conversationId || loadingHistory) {
      console.log("handleSend bloqueado:", {
        hasInput: !!input.trim(),
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

    const currentInput = input.trim();
    setInput("");
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

      // Generar respuesta inteligente usando el motor de respuestas
      // Simular tiempo de procesamiento para mejor UX
      await new Promise((resolve) => setTimeout(resolve, 800));

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
        setMessages((prev) => [
          ...prev,
          {
            ...assistantMsg,
            timestamp: new Date(assistantMsg.created_at),
            menu: responseMenu,
            document: responseDocument,
          },
        ]);
      }
    } catch (error) {
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
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Verificar que el botón no esté deshabilitado antes de enviar
      if (input.trim() && !loading && conversationId && !loadingHistory) {
        handleSend();
      }
    }
  };

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
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Comienza una conversación escribiendo un mensaje</p>
            <p className="empty-subtitle">Esta es tu conversación personal</p>
          </div>
        ) : (
          messages.map((message) => (
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

      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            loadingHistory
              ? "Cargando conversación..."
              : "Escribe tu mensaje..."
          }
          rows={1}
          disabled={loading || loadingHistory || !conversationId}
          className="message-input"
        />
        <button
          onClick={handleSend}
          disabled={
            !input.trim() || loading || !conversationId || loadingHistory
          }
          className="send-button"
          type="button"
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}

export default ChatInterface;
