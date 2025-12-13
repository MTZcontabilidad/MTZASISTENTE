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
import { detectImportantInfo, type ResponseWithMenu } from "../lib/responseEngine";
import { handleChat, ChatState, getInitialChatState } from "../lib/chatbot/chatEngine";
import { Message, UserType, UserRole } from "../types";
// We don't import specific UI components like VoiceControls here, but we manage the state they need.
import { useTextToSpeech } from "../lib/textToSpeech";

export interface MessageWithMenu extends Message {
  menu?: any;
  document?: any;
}

export function useChat() {
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
  
  // UI State managed by hook for convenience
  const [isLoading, setIsLoading] = useState(false); // redundant with loading? ChatInterface had both.
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Supervisor Engine State
  const [chatUtilsState, setChatUtilsState] = useState<ChatState>(getInitialChatState());
  const [lastAssistantMessage, setLastAssistantMessage] = useState<string>("");
  const [welcomePlayed, setWelcomePlayed] = useState(false);
  
  const handleSendRef = useRef<((customMessage?: string) => void) | null>(null);
  const welcomeSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Text-to-Speech hook
  const tts = useTextToSpeech();

  // Load Conversation & User
  useEffect(() => {
    let mounted = true;
    let isCancelled = false;
    setLoading(false);
    setInput("");

    const loadConversation = async () => {
      try {
        if (!mounted || isCancelled) return;
        setLoadingHistory(true);
        
        // 1. Get User
        let user = null;
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          user = authUser;
        } catch (error) {
          console.log('No hay sesión de Supabase, intentando desde caché...');
        }
        
        if (!user) {
          const cachedUser = sessionCache.get();
          if (cachedUser && cachedUser.id) {
            user = { id: cachedUser.id, email: cachedUser.email || '' } as any;
          }
        }
        
        if (!user || !mounted || isCancelled) {
          if (mounted && !isCancelled) setLoadingHistory(false);
          return;
        }

        // 2. Get Profile
        try {
          const isDevUser = user.id.startsWith('dev-');
          let profile = null;
          if (!isDevUser) {
            const { data } = await supabase.from("user_profiles").select("user_type, role, full_name, email").eq("id", user.id).maybeSingle();
            profile = data;
          }

          if (!mounted || isCancelled) return;

          if (profile) {
            setUserType(profile.user_type as UserType);
            setUserRole(profile.role as UserRole);
            setUserName(profile.full_name || undefined);
            setUserEmail(profile.email || user.email || undefined);
          } else if (isDevUser) {
             let devRole: UserRole = 'invitado';
             const roleMatch = user.id.match(/^dev-([^-]+)-/);
             if (roleMatch) devRole = roleMatch[1] as UserRole;
             else {
                const emailMatch = user.email?.match(/^dev-([^@]+)@/);
                if (emailMatch) devRole = emailMatch[1] as UserRole;
             }
             setUserRole(devRole);
             setUserType('cliente_existente');
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

        // 3. Get Active Conversation
        const activeConvId = await getActiveConversation(user.id);
        if (!mounted || isCancelled) return;
        setConversationId(activeConvId);

        // 4. Load Messages with Summaries
        const { getOptimizedConversationMessages, shouldCreateSummary, createConversationSummary } = await import("../lib/conversationSummaries");
        const needsSummary = await shouldCreateSummary(activeConvId);
        if (needsSummary) await createConversationSummary(activeConvId);
        
        const { summaries, recentMessages } = await getOptimizedConversationMessages(activeConvId);
        
        if (!mounted || isCancelled) return;
        
        const mappedMessages = recentMessages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.created_at),
          menu: undefined,
          document: undefined,
        }));
        
        if (summaries.length > 0) {
          const summaryMessage = {
            id: `summary-${summaries[0].id}`,
            conversation_id: activeConvId,
            text: `📋 **Resumen de conversación anterior:**\n\n${summaries.map(s => s.summary_text).join('\n\n')}\n\n_Se muestran los últimos ${recentMessages.length} mensajes._`,
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

        // 5. Welcome Message if Empty
        if (mappedMessages.length === 0 && activeConvId && mounted && !isCancelled) {
             await generateWelcomeMessage(user, activeConvId);
        }

        // 6. Load Memories
        if (mounted && !isCancelled) {
           await getUserMemories(user.id, activeConvId);
        }

      } catch (error: any) {
        if (!mounted || isCancelled) return;
        console.error("Error al cargar conversación:", error);
        if (error?.code === "42P01") console.warn("Tablas no creadas.");
      } finally {
        if (mounted && !isCancelled) setLoadingHistory(false);
      }
    };

    loadConversation();
    return () => { isCancelled = true; mounted = false; setLoading(false); };
  }, []);

  const generateWelcomeMessage = async (user: any, activeConvId: string) => {
      const { getCompanyInfo } = await import("../lib/companyConfig");
      const { generateContextualMessages, formatClientName } = await import("../lib/responseConfig");
      const { getOrCreateClientInfo } = await import("../lib/clientInfo");
      const companyInfo = await getCompanyInfo();
      const companyName = companyInfo?.company_name || "MTZ";
      
      let clientInfo = null;
      try { clientInfo = await getOrCreateClientInfo(user.id); } 
      catch (error) { console.warn("Client info error:", error); }

      const currentUserType = userType || "invitado";
      const isInvitado = currentUserType === 'invitado' || userRole === 'invitado';
      let displayNameForWelcome = '';
      let formattedClientName = '';

      if (isInvitado) {
        const rawName = userName || clientInfo?.preferred_name || clientInfo?.company_name || '';
        if (rawName && !rawName.toLowerCase().includes('dev-') && !rawName.toLowerCase().includes('invitado') && rawName.trim().length > 0) {
            displayNameForWelcome = rawName;
        }
        formattedClientName = displayNameForWelcome;
      } else {
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

      const { CHAT_TREES } = await import('../lib/chatbot/chatTrees');
      let welcomeMessage = '';
      let initialMenu: any = undefined;
      const safeUserRole = userRole || 'invitado';
      
      if (isInvitado) {
          const rootMenu = CHAT_TREES['invitado_root'];
          welcomeMessage = rootMenu.text;
          initialMenu = { type: 'options', title: 'Opciones:', options: rootMenu.options };
      } else {
          const rootMenuId = safeUserRole === 'inclusion' ? 'inclusion_root' : 'cliente_root';
          const rootMenu = CHAT_TREES[rootMenuId];
          welcomeMessage = rootMenu.text.replace('[Nombre]', formattedClientName || displayNameForWelcome || 'Cliente');
          initialMenu = { type: 'options', title: 'Opciones:', options: rootMenu.options };
      }

      const welcomeMsgData = await createMessage(activeConvId, user.id, welcomeMessage, "assistant");
      if (welcomeMsgData) {
        setMessages([{ ...welcomeMsgData, timestamp: new Date(welcomeMsgData.created_at), menu: initialMenu }]);
        playWelcomeAudio(contextualMessages.greeting, contextualMessages.welcomeMessage, displayNameForWelcome);
      }
  };

  const playWelcomeAudio = async (greeting: string, welcomeMsg: string, displayName: string) => {
    return; // Feature disabled per user request
    if (welcomePlayed) return;
    const audioText = userName 
      ? `¡Hola ${displayName}! Soy Arise, tu asistente de MTZ. ¿En qué te ayudo?`
      : `¡Hola! Soy Arise, tu asistente de MTZ. ¿En qué te ayudo?`;
    
    try {
        let options: any = { rate: 1.1, pitch: 1.1, volume: 1.0, useGemini: false };
        try {
            const saved = localStorage.getItem('voiceSettings');
            if (saved) options = { ...options, ...JSON.parse(saved) };
        } catch(e) {}
        
        await tts.speak(audioText, options);
        setWelcomePlayed(true);
    } catch(e) { console.warn('Welcome audio failed', e); }
  };

  const handleSend = useCallback(async (customMessage?: string) => {
    const messageToSend = customMessage || input.trim();
    if (!messageToSend || loading || loadingHistory || !conversationId) return;

    let user = null;
    try { const { data } = await supabase.auth.getUser(); user = data.user; } catch(e) {}
    if (!user) {
        const cached = sessionCache.get();
        if (cached && cached.id) user = { id: cached.id, email: cached.email || '' } as any;
    }
    if (!user) return;

    if (!customMessage) setInput("");
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);

    try {
        const userMsg = await createMessage(conversationId, user.id, messageToSend, "user");
        if (userMsg) {
            setMessages(prev => [...prev, { ...userMsg, timestamp: new Date(userMsg.created_at) }]);
        }

        const importantInfo = detectImportantInfo(messageToSend);
        if (importantInfo.shouldSave && importantInfo.type) {
            await createMemory(user.id, conversationId, importantInfo.type, messageToSend, importantInfo.type === "important_info" ? 7 : 5);
        }
        
        const { detectAndSaveClientInfo } = await import("../lib/responseEngine");
        await detectAndSaveClientInfo(user.id, messageToSend);

        if (controller.signal.aborted) return;
        await new Promise(r => setTimeout(r, 800)); // Sim delay
        if (controller.signal.aborted) return;

        const assistantResponse = await handleChat(
            user.id, messageToSend, chatUtilsState, 
            (userRole as 'cliente' | 'inclusion' | 'invitado') || 'invitado', 
            userName
        );

        let responseMenu: any = undefined;
        if (assistantResponse.show_menu && assistantResponse.options) {
            responseMenu = { type: 'options', title: 'Opciones disponibles:', options: assistantResponse.options };
        } else if (assistantResponse.options && assistantResponse.options.length > 0) {
            responseMenu = { type: 'options', title: 'Acciones sugeridas:', options: assistantResponse.options };
        }

        const assistantMsg = await createMessage(conversationId, user.id, assistantResponse.text, "assistant");
        if (assistantMsg) {
             const newMessage = { ...assistantMsg, timestamp: new Date(assistantMsg.created_at), menu: responseMenu };
             setMessages(prev => [...prev, newMessage]);
             setLastAssistantMessage(assistantResponse.text);
        }

    } catch (error) {
        if (!controller.signal.aborted) {
            console.error("HandleSend Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(), conversation_id: conversationId,
                text: "Lo siento, hubo un error. Por favor intenta de nuevo.",
                sender: "assistant", user_id: user.id, created_at: new Date().toISOString(), timestamp: new Date()
            }]);
        }
    } finally {
        setLoading(false);
        setAbortController(null);
    }
  }, [input, loading, conversationId, loadingHistory, userType, userRole, userName, chatUtilsState]);

  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  const handleStopResponse = () => {
      if (abortController) {
          abortController.abort();
          setLoading(false);
          setAbortController(null);
          setMessages(prev => [...prev, {
            id: Date.now().toString(), conversation_id: conversationId, text: "Respuesta detenida.",
            sender: "assistant", user_id: currentUserId || "", created_at: new Date().toISOString(), timestamp: new Date()
          }]);
      }
  };

  const handleClearChat = async () => {
      if (!currentUserId || !conversationId) return;
      try {
          setLoading(true);
          const newId = await clearConversation(currentUserId, conversationId);
          setMessages([]); setInput(""); setConversationId(newId); setWelcomePlayed(false);
          setShowClearConfirm(false);
      } catch (e) {
          console.error("Error clearing chat", e);
      } finally { setLoading(false); }
  };

  return {
    messages, setMessages,
    input, setInput,
    loading,
    loadingHistory,
    conversationId,
    userRole,
    userId: currentUserId,
    handleSend,
    handleStopResponse,
    handleClearChat,
    showClearConfirm, setShowClearConfirm,
    tts,
    lastAssistantMessage,
    setLastAssistantMessage
  };
}
