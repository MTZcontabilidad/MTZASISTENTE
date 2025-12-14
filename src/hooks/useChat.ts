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
import { detectImportantInfo } from "../lib/chatUtils";

import { handleChat, ChatState, getInitialChatState } from "../lib/chatbot/chatEngine";
import { Message, UserType, UserRole, UserMemory } from "../types";
// We don't import specific UI components like VoiceControls here, but we manage the state they need.
import { useTextToSpeech, type TTSOptions } from "../lib/textToSpeech";

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
  
  // Memory State
  const [memories, setMemories] = useState<UserMemory[]>([]);

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
    console.log('[DEBUG] useChat useEffect started');
    let mounted = true;
    let isCancelled = false;
    setLoading(false);
    setInput("");

    const loadConversation = async () => {
      console.log('[DEBUG] loadConversation function started');
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
        
        // GUEST / DEBUG USER FALLBACK
        if (!user) {
            try {
                // First check for explicit debug user
                const debugUserStr = localStorage.getItem('MTZ_DEBUG_USER');
                if (debugUserStr) {
                    const debugUser = JSON.parse(debugUserStr);
                    if (debugUser && debugUser.id) {
                        console.log('[DEBUG] Using MTZ_DEBUG_USER from localStorage:', debugUser);
                        user = { id: debugUser.id, email: debugUser.email || 'debug@mtz.cl' } as any;
                    }
                }
                
                // If still no user, use/create generic GUEST user
                if (!user) {
                    const guestUserStr = localStorage.getItem('MTZ_GUEST_ID');
                    if (guestUserStr) {
                         user = JSON.parse(guestUserStr);
                    } else {
                         // Generate a guest ID that triggers "temp" mode in conversations.ts (starts with non-uuid or just unique string)
                         // conversations.ts checks for UUID format. A simple timestamp-based ID works to trigger temp mode.
                         const newGuestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                         user = { id: newGuestId, email: undefined } as any;
                         localStorage.setItem('MTZ_GUEST_ID', JSON.stringify(user));
                         console.log('[DEBUG] Created new GUEST user:', user);
                    }
                }
            } catch (e) {
                console.warn('Error handling Guest/Debug user', e);
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
          } else if (user.id.startsWith('guest-')) {
             // Explicit Guest Handling
             setUserRole('invitado');
             setUserType('invitado'); // Assuming 'invitado' is a valid UserType or similar fallback
             setUserName('Invitado');
          } else {
             // Default fallthrough
            setUserEmail(user.email || undefined);
            setUserRole('invitado'); 
          }
          setCurrentUserId(user.id);
        } catch (error) {
          console.warn("No se pudo obtener perfil del usuario:", error);
          if (!mounted || isCancelled) return;
        }

        // 3. Get Active Conversation
        console.log('[DEBUG] Getting active conversation for user:', user.id);
        const activeConvId = await getActiveConversation(user.id);
        console.log('[DEBUG] Active conversation ID:', activeConvId);
        if (!mounted || isCancelled) return;
        setConversationId(activeConvId);
        console.log('[DEBUG] Conversation ID set to:', activeConvId);

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
           const userMemories = await getUserMemories(user.id, activeConvId);
           // Limit to 20 most relevant/recent to prevent token overflow
           setMemories(userMemories.slice(0, 20));
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
          // Determinar rol efectivo
          const safeUserRole = userRole || 'invitado'; 
          const rootMenuId = 'cliente_root';
          const rootMenu = CHAT_TREES[rootMenuId];
          welcomeMessage = rootMenu.text.replace('[Nombre]', formattedClientName || displayNameForWelcome || 'Cliente');
          initialMenu = { type: 'options', title: 'Opciones:', options: rootMenu.options };

      const welcomeMsgData = await createMessage(activeConvId, user.id, welcomeMessage, "assistant");
      if (welcomeMsgData) {
        setMessages([{ ...welcomeMsgData, timestamp: new Date(welcomeMsgData.created_at), menu: undefined }]);
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
        let options: TTSOptions = { rate: 1.1, pitch: 1.1, volume: 1.0, useGemini: false };
        try {
            const saved = localStorage.getItem('voiceSettings');
            if (saved) {
                const parsed = JSON.parse(saved as string);
                options = { ...options, ...parsed };
            }
        } catch(e) {}
        
        await tts.speak(audioText, options);
        setWelcomePlayed(true);
    } catch(e) { console.warn('Welcome audio failed', e); }
  };

  const handleSend = useCallback(async (customMessage?: string) => {
    console.log('[DEBUG] handleSend called', { customMessage, input, loading, loadingHistory, conversationId });
    const messageToSend = customMessage || input.trim();
    if (!messageToSend || loading || loadingHistory) {
      console.log('[DEBUG] handleSend early return (no message or loading)', { messageToSend, loading, loadingHistory });
      return;
    }

    let user = null;
    try { const { data } = await supabase.auth.getUser(); user = data.user; } catch(e) {}
    if (!user) {
        const cached = sessionCache.get();
        if (cached && cached.id) user = { id: cached.id, email: cached.email || '' } as any;
    }
    
    // GUEST / DEBUG USER FALLBACK (For Send)
    if (!user) {
        try {
            const debugUserStr = localStorage.getItem('MTZ_DEBUG_USER');
            if (debugUserStr) {
                 const debugUser = JSON.parse(debugUserStr);
                 if (debugUser && debugUser.id) {
                     user = { id: debugUser.id, email: debugUser.email || 'debug@mtz.cl' } as any;
                 }
            }
            // Fallback to Guest
            if (!user) {
                 const guestUserStr = localStorage.getItem('MTZ_GUEST_ID');
                 if (guestUserStr) {
                     user = JSON.parse(guestUserStr);
                 }
            }
        } catch (e) {}
    }

    if (!user) {
      console.log('[DEBUG] No user found (even guest)');
      return;
    }
    console.log('[DEBUG] User found:', user.id);

    // Fallback: Si conversationId es null, crear uno temporal
    let activeConvId = conversationId;
    if (!activeConvId) {
      console.log('[DEBUG] conversationId is null, creating temporary conversation');
      activeConvId = await getActiveConversation(user.id);
      setConversationId(activeConvId);
      console.log('[DEBUG] Created temporary conversationId:', activeConvId);
    }



    if (!customMessage) setInput("");
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);

    try {
        const userMsg = await createMessage(activeConvId, user.id, messageToSend, "user");
        if (userMsg) {
            setMessages(prev => [...prev, { ...userMsg, timestamp: new Date(userMsg.created_at) }]);
        }

        const importantInfo = detectImportantInfo(messageToSend);
        if (importantInfo.shouldSave && importantInfo.type) {
            const newMemory = await createMemory(user.id, activeConvId, importantInfo.type, messageToSend, importantInfo.type === "important_info" ? 7 : 5);
            if (newMemory) {
               setMemories(prev => [newMemory, ...prev]);
            }
        }
        
        const { detectAndSaveClientInfo } = await import("../lib/chatUtils");
        await detectAndSaveClientInfo(user.id, messageToSend);

        if (controller.signal.aborted) return;
        await new Promise(r => setTimeout(r, 800)); // Sim delay
        if (controller.signal.aborted) return;

        const assistantResponse = await handleChat(
            user.id, messageToSend, chatUtilsState, 
            (userRole as 'cliente' | 'invitado') || 'invitado', 
            userName,
            memories // Pass memories here
        );

        let responseMenu: any = undefined;
        if (assistantResponse.show_menu && assistantResponse.options) {
            responseMenu = { type: 'options', title: 'Opciones disponibles:', options: assistantResponse.options };
        } else if (assistantResponse.options && assistantResponse.options.length > 0) {
            responseMenu = { type: 'options', title: 'Acciones sugeridas:', options: assistantResponse.options };
        }

        const assistantMsg = await createMessage(activeConvId, user.id, assistantResponse.text, "assistant");
        if (assistantMsg) {
             const newMessage = { ...assistantMsg, timestamp: new Date(assistantMsg.created_at), menu: responseMenu };
             setMessages(prev => [...prev, newMessage]);
             setLastAssistantMessage(assistantResponse.text);
        }

    } catch (error) {
        if (!controller.signal.aborted) {
            console.error("HandleSend Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(), conversation_id: activeConvId,
                text: "Lo siento, hubo un error. Por favor intenta de nuevo.",
                sender: "assistant", user_id: user.id, created_at: new Date().toISOString(), timestamp: new Date()
            }]);
        }
    } finally {
        setLoading(false);
        setAbortController(null);
    }
  }, [input, loading, conversationId, loadingHistory, userType, userRole, userName, chatUtilsState, memories]); // Added memories dependency

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
          setShowClearConfirm(false); setMemories([]); // Clear memories from UI state too? Or reload? Better reload.
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
