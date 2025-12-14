import { supabase } from '../supabase';
// import { getGeminiApiKey } from '../geminiApiKey'; // Deprecated

import { getOrCreateClientInfo } from '../clientInfo';
import { getClientExtendedInfo } from '../clientExtendedInfo';
import { UserMemory } from '../../types'; // Fix relative path to types


import { CHAT_TREES, MenuOption } from './chatTrees';

// --- TYPES & STATE ---

export interface ChatState {
  mode: 'idle';
  step: number;
  data: Record<string, any>;
  lastMenuId?: string;
  lastOptions?: MenuOption[];
}

export interface ChatResponse {
  text: string;
  show_menu?: boolean;
  options?: MenuOption[];
  nextState: ChatState; // Persistence for the UI
  action_to_execute?: { type: string, payload: any }; // e.g., 'navigate'
}

// Initial State Factory
export const getInitialChatState = (): ChatState => ({
  mode: 'idle',
  step: 0,
  data: {},
});

/**
 * SUPERVISOR (MAIN ROUTER)
 * Orchestrates: Inputs -> Global Cmds -> Agents -> Fallback
 */
export async function handleChat(
  userId: string,
  userMessage: string,
  currentState: ChatState,
  userRole: 'cliente' | 'invitado' = 'invitado',
  userName?: string,
  memories: UserMemory[] = [] // New argument: Memories
): Promise<ChatResponse> {
  const input = normalizeInput(userMessage);

  // 1. GLOBAL COMMANDS (Priority #1)
  if (isGlobalCommand(input)) {
    return handleGlobalCommand(input, userRole, userName);
  }

  // 3.2 Specific Intents (Eliminado: Transporte)


  // 3.3 Static Menu Match
  const strictMatch = findStaticMatch(input, userRole);
  if (strictMatch) {
    return handleMenuRequest(strictMatch, userName);
  }

  // 3.4 Smart Fallback (Gemini)
  return await generateAIResponse(userId, userMessage, userRole, userName, currentState, memories);
}

// --- SUB-AGENTS ---



// --- HELPERS ---

function normalizeInput(str: string): string {
  return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isGlobalCommand(input: string): boolean {
  return ['cancelar', 'salir', 'menu', 'inicio', 'volver', 'ayuda'].includes(input);
}

function handleGlobalCommand(input: string, userRole: string, userName?: string): ChatResponse {
  const rootMenuId = 
    userRole === 'cliente' ? 'cliente_root' : 
    'invitado_root';
    
  return handleMenuRequest(rootMenuId, userName);
}

function handleMenuRequest(menuId: string, userName?: string): ChatResponse {
  const menu = CHAT_TREES[menuId];
  if (!menu) return { text: "Menú no encontrado.", nextState: getInitialChatState() };

  // Add numbering to options for Accessibility
  const numberedOptions = menu.options.map((opt, i) => ({
    ...opt,
    label_original: opt.label,
    label: `${i + 1}. ${opt.label}` // "1. Opción"
  }));

  const safeName = (userName && userName !== 'undefined') ? userName : 'Usuario';
  return {
    text: menu.text.replace('[Nombre]', safeName),
    show_menu: true,
    options: numberedOptions,
    nextState: { 
      mode: 'idle', 
      step: 0, 
      data: {}, 
      lastMenuId: menuId,
      lastOptions: menu.options // Store original options for mapping logic
    }
  };
}

function findStaticMatch(input: string, userRole: string): string | null {
  // Simple keywords mapping

  if (input.includes('cotizar') || input.includes('precios')) return 'invitado_cotizar';
  if (input.includes('f29') || input.includes('iva')) return 'cliente_taxes';
  return null;
}

// --- AI FALLBACK ---

async function generateAIResponse(
  userId: string,
  message: string,
  userRole: string,
  userName: string | undefined,
  currentState: ChatState,
  memories: UserMemory[] = []
): Promise<ChatResponse> {
  try {
    const [basicInfo, extendedInfo] = await Promise.all([
       getOrCreateClientInfo(userId),
       getClientExtendedInfo(userId)
    ]);
    const aiProfile = extendedInfo?.ai_profile || { tone: 'neutral' };

    const safeName = (userName && userName !== 'undefined') ? userName : 'Usuario';

    // Construir contexto de memoria
    const memoryContext = memories
      .map(m => `- [${m.importance >= 7 ? 'IMPORTANTE' : 'Info'}] ${m.content} (${new Date(m.created_at).toLocaleDateString()})`)
      .join('\n');

    const systemPrompt = `
    Eres Arise, asistente de MTZ.
    
    USUARIO: ${safeName} | ROL: ${userRole}
    ESTADO ACTUAL: ${JSON.stringify(currentState)}
    
    MEMORIAS DEL USUARIO (Información que debes recordar):
    ${memoryContext || "No hay memorias previas."}
    
    OBJETIVO:
    1. Responder la duda del usuario de forma útil, empática y concisa (max 2 párrafos).
    2. USA LAS MEMORIAS para personalizar la respuesta si es relevante (ej. si sabes su nombre o preferencias, úsalo).
    3. SIEMPRE SUGERIR UN MENÚ VISUAL ("menu_suggestion") que tenga sentido con la respuesta.
       - IDs Disponibles para ${userRole}: ${userRole === 'cliente' ? 'cliente_root, cliente_docs, cliente_taxes, cliente_tutorials' : 'invitado_root, invitado_cotizar, invitado_tutorials'}.
    4. Si el usuario intenta hacer algo que requiere un Agente (como "Agendar Traslado"), indícalo.
    
    IMPORTANTE: Nunca te dirijas al usuario como "undefined". Si no tienes nombre, usa un saludo genérico o "Usuario".

    FORMATO JSON:
    {
      "text": "Respuesta...",

    }
    `;

    // Call Supabase Edge Function 'gemini-chat'
    const { data: responseData, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: "${message}"` }] }],
            generationConfig: { temperature: 0.5 },
            model: "gemini-2.0-flash-exp" // Updated to correct experimental model ID
        }
    });

    if (error) {
        console.error('Error enviando mensaje a Edge Function:', error);
        throw error;
    }
    
    const data = responseData;
    
    // Check for application-level errors returned by the function
    if (data.error) {
         console.error('Gemini API/Function Error:', data.error);
         throw new Error(`Gemini Error: ${JSON.stringify(data.error)}`);
    }

    console.log('Gemini API Success via Edge Function:', data);
    
    let textRaw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    textRaw = textRaw.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const aiRes = JSON.parse(textRaw);
    
    let responseObj: ChatResponse = {
      text: aiRes.text || "Entendido.",
      nextState: currentState
    };

    // If AI suggests a menu, attach it
    if (aiRes.suggested_menu_id && CHAT_TREES[aiRes.suggested_menu_id]) {
      const menu = CHAT_TREES[aiRes.suggested_menu_id];
      responseObj.show_menu = true;
      responseObj.options = menu.options.map((opt, i) => ({ ...opt, label: `${i + 1}. ${opt.label}` }));
      responseObj.nextState.lastOptions = menu.options;
      responseObj.nextState.lastMenuId = aiRes.suggested_menu_id;
    }

    return responseObj;

  } catch (e: any) {
    const isQuotaError = e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED') || e.message?.includes('quota');
    
    if (isQuotaError) {
        console.warn("Gemini Quota Exceeded (429). Notify user without menu.");
        return {
             text: "⚠️ El sistema de IA está recibiendo muchas consultas en este momento (Límite de cuota gratuito). Por favor, intenta tu pregunta nuevamente en unos segundos.",
             nextState: currentState,
             show_menu: false 
        };
    } else {
        console.error("Gemini Error:", e);
    }
    
    const rootMenuId = userRole === 'cliente' ? 'cliente_root' : 
                       'invitado_root';
    const rootMenuFallback = handleMenuRequest(rootMenuId, userName);

    const fallbackText = "Tuve un pequeño problema técnico. 🤕 ¿Podemos intentar con una de estas opciones?";

    return { 
      text: fallbackText, 
      nextState: currentState,
      show_menu: true,
      options: rootMenuFallback.options
    };
  }
}
