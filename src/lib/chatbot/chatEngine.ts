import { supabase } from '../supabase';
import { getGeminiApiKey } from '../geminiApiKey';
import { getOrCreateClientInfo } from '../clientInfo';
import { getClientExtendedInfo } from '../clientExtendedInfo';
import { generateResponse as generateAIResponseFn } from '../responseEngine';

import { CHAT_TREES, MenuOption } from './chatTrees';

// --- TYPES & STATE ---

export interface ChatState {
  mode: 'idle' | 'booking_transport';
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
  userRole: 'cliente' | 'inclusion' | 'invitado' = 'invitado',
  userName?: string
): Promise<ChatResponse> {
  const input = normalizeInput(userMessage);

  // 1. GLOBAL COMMANDS (Priority #1)
  if (isGlobalCommand(input)) {
    return handleGlobalCommand(input, userRole, userName);
  }

  // 2. ACTIVE AGENT (If in a flow)
  if (currentState.mode === 'booking_transport') {
    return runBookingAgent(userId, input, currentState);
  }

  // 3. IDLE MODE LOGIC
  // 3.1 Numeric Selection (Accessibility)
  if (currentState.lastOptions && /^\d+$/.test(input)) {
    const index = parseInt(input) - 1;
    if (index >= 0 && index < currentState.lastOptions.length) {
      const selectedOption = currentState.lastOptions[index];
      // Simulate selecting the option
      // If it's a navigating option, we might need to handle it or just return the action
      if (selectedOption.action === 'show_menu' && selectedOption.params?.menu) {
         // Recursively call for that menu
         return handleMenuRequest(selectedOption.params.menu, userName);
      }
      return {
        text: `Has seleccionado: ${selectedOption.label}`,
        nextState: { ...currentState, lastOptions: undefined }, // Clear options after selection
        action_to_execute: { type: selectedOption.action, payload: selectedOption.params }
      };
    }
  }

  // 3.2 Specific Intents (Start Booking)
  if (input.includes('agendar') && (input.includes('traslado') || input.includes('viaje'))) {
    return {
      text: "¡Claro! Empecemos a coordinar tu traslado. 🚗\n\n¿Para qué **fecha** necesitas el transporte? (Ej: Mañana, El Lunes, 25 de Octubre)",
      nextState: { mode: 'booking_transport', step: 1, data: {} } // Activate Agent
    };
  }

  // 3.3 Static Menu Match
  const strictMatch = findStaticMatch(input, userRole);
  if (strictMatch) {
    return handleMenuRequest(strictMatch, userName);
  }

  // 3.4 Smart Fallback (Gemini)
  return await generateAIResponse(userId, userMessage, userRole, userName, currentState);
}

// --- SUB-AGENTS ---

/**
 * AGENT: TRANSPORT BOOKING
 * Fills slots: Date -> Time -> Origin -> Destination -> Confirm
 */
async function runBookingAgent(userId: string, input: string, state: ChatState): Promise<ChatResponse> {
  const step = state.step;
  const newData = { ...state.data };

  // Helper to stay in agent
  const stay = (text: string, nextStep: number = step): ChatResponse => ({
    text,
    nextState: { ...state, step: nextStep, data: newData }
  });

  // STEP 1: DATE
  if (step === 1) {
    // Simple validation (can be enhanced with regex)
    if (input.length < 3) return stay("Por favor, indícame una fecha válida (Ej: 'Mañana', 'Lunes 15').");
    
    newData.date = input;
    return stay("Entendido. ¿A qué **hora** te pasamos a buscar? (Ej: 10:30 AM)", 2);
  }

  // STEP 2: TIME
  if (step === 2) {
    newData.time = input;
    return stay("Perfecto. ¿Desde **dónde** salimos y hacia **dónde** vas? (Origen - Destino)", 3);
  }

  // STEP 3: LOCATION
  if (step === 3) {
    newData.location = input;
    
    // Summary
    const summary = `
📋 **Resumen del Viaje**:
- 📅 Fecha: ${newData.date}
- 🕒 Hora: ${newData.time}
- 📍 Ruta: ${newData.location}

¿Es correcto? (Responde Sí o No)
    `.trim();
    
    return stay(summary, 4);
  }

  // STEP 4: CONFIRMATION
  if (step === 4) {
    if (input.includes('si') || input.includes('ok') || input.includes('claro')) {
      // SAVE TO DB (Mock for now, replacing with real insert later)
      // await supabase.from('transport_requests').insert(...)
      
      return {
        text: "¡Excelente! Tu solicitud ha sido registrada. ✅\nNuestro equipo de coordinación te contactará para confirmar el conductor.\n\n¿Necesitas algo más para el Taller de Sillas?",
        nextState: { mode: 'idle', step: 0, data: {} },
        show_menu: true,
        options: CHAT_TREES['inclusion_root'].options // Back to hub
      };
    } else {
      return {
        text: "Entendido, cancelemos esta solicitud. ¿En qué más puedo ayudarte?",
        nextState: { mode: 'idle', step: 0, data: {} },
        show_menu: true,
        options: CHAT_TREES['inclusion_root'].options
      };
    }
  }

  return stay("No entendí eso. ¿Podemos continuar?");
}

// --- HELPERS ---

function normalizeInput(str: string): string {
  return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isGlobalCommand(input: string): boolean {
  return ['cancelar', 'salir', 'menu', 'inicio', 'volver', 'ayuda', 'hola'].includes(input);
}

function handleGlobalCommand(input: string, userRole: string, userName?: string): ChatResponse {
  const rootMenuId = 
    userRole === 'cliente' ? 'cliente_root' : 
    userRole === 'inclusion' ? 'inclusion_root' : 
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

  return {
    text: menu.text.replace('[Nombre]', userName || 'Usuario'),
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
  if (input.includes('taller') || input.includes('silla')) return 'inclusion_workshop';
  if (input.includes('traslado') || input.includes('transporte')) return 'inclusion_transport';
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
  currentState: ChatState
): Promise<ChatResponse> {
  try {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      // Fallback amigable si no hay API key (Modo Offline / Sin IA)
      const rootMenuId = userRole === 'cliente' ? 'cliente_root' : 
                         userRole === 'inclusion' ? 'inclusion_root' : 
                         'invitado_root';
      const rootMenuFallback = handleMenuRequest(rootMenuId, userName);
      
      return {
        text: "No entendí lo que dijiste. 😅 Por favor selecciona una de las opciones del menú:",
        show_menu: true,
        options: rootMenuFallback.options,
        nextState: {
             ...currentState,
             lastMenuId: rootMenuId 
        }
      };
    }

    const [basicInfo, extendedInfo] = await Promise.all([
       getOrCreateClientInfo(userId),
       getClientExtendedInfo(userId)
    ]);
    const aiProfile = extendedInfo?.ai_profile || { tone: 'neutral' };

    const systemPrompt = `
    Eres Arise, asistente de MTZ.
    
    USUARIO: ${userName || 'Usuario'} | ROL: ${userRole}
    ESTADO ACTUAL: ${JSON.stringify(currentState)}
    
    OBJETIVO:
    1. Responder la duda del usuario de forma útil y concisa (max 2 párrafos).
    2. SIEMPRE SUGERIR UN MENÚ VISUAL ("menu_suggestion") que tenga sentido con la respuesta.
       - IDs Disponibles: invitado_root, invitado_cotizar, cliente_root, cliente_docs, inclusion_workshop, inclusion_transport.
    3. Si el usuario intenta hacer algo que requiere un Agente (como "Agendar Traslado"), indícalo.

    FORMATO JSON:
    {
      "text": "Respuesta...",
      "suggested_menu_id": "inclusion_transport" (Opcional, si aplica)
    }
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: "${message}"` }] }],
          generationConfig: { temperature: 0.5 }
        })
      }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API fail: ${response.status} - ${errText}`);
    }
    
    const data = await response.json();
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

  } catch (e) {
    console.error("Gemini Error:", e);
    const rootMenuId = userRole === 'cliente' ? 'cliente_root' : 
                       userRole === 'inclusion' ? 'inclusion_root' : 
                       'invitado_root';
    const rootMenuFallback = handleMenuRequest(rootMenuId, userName);

    return { 
      text: "Tuve un pequeño problema técnico. 🤕 ¿Podemos intentar con una de estas opciones?", 
      nextState: currentState,
      show_menu: true,
      options: rootMenuFallback.options
    };
  }
}
