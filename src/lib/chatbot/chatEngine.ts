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
  show_lead_form?: boolean; // Trigger for LeadCaptureForm
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
  memories: UserMemory[] = [],
  onChunk?: (text: string) => void
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
  return await generateAIResponse(userId, userMessage, userRole, userName, currentState, memories, onChunk);
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
  memories: UserMemory[] = [],
  onChunk?: (text: string) => void
): Promise<ChatResponse> {
  try {
    // Obtener información de la empresa para contexto
    const { getCompanyInfo, getActiveFAQs } = await import('../companyConfig');
    const [basicInfo, extendedInfo, companyInfo, faqs] = await Promise.all([
       getOrCreateClientInfo(userId),
       getClientExtendedInfo(userId),
       getCompanyInfo(),
       getActiveFAQs()
    ]);
    const aiProfile = extendedInfo?.ai_profile || { tone: 'neutral' };

    // Determine Provider
    const aiProviderEnv = import.meta.env.VITE_AI_PROVIDER || 'gemini';
    const forceLocal = typeof localStorage !== 'undefined' && localStorage.getItem('MTZ_USE_LOCAL_LLM') === 'true';
    const isLocalProvider = forceLocal || aiProviderEnv === 'local';

    const safeName = (userName && userName !== 'undefined') ? userName : 'Usuario';

    // Construir contexto de memoria (OPT: Limit to 5 for speed)
    const recentMemories = memories.slice(-5);
    const memoryContext = recentMemories
      .map(m => `- [${m.importance >= 7 ? 'IMPORTANTE' : 'Info'}] ${m.content} (${new Date(m.created_at).toLocaleDateString()})`)
      .join('\n');

    // Construir contexto de empresa (Same as before)

    
    const companyContext = companyInfo ? `
    INFORMACIÓN DE LA EMPRESA (MTZ):
    - Nombre: ${companyInfo.company_name}
    - Horario: ${companyInfo.business_hours || 'Lunes a Viernes 9:00 - 18:00'}
    - Contacto: ${companyInfo.phone || ''} / ${companyInfo.email || ''}
    - Dirección: ${companyInfo.address || ''}
    - Ubicación (Mapa): https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companyInfo.address || 'MTZ Contabilidad Iquique')}
    - Web: ${companyInfo.website || ''}
    ` : '';
    
    const faqContext = faqs.length > 0 ? `
    PREGUNTAS FRECUENTES (Reference):
    ${faqs.slice(0, 5).map(f => `Q: ${f.question} | A: ${f.answer}`).join('\n')}
    ` : '';

    let aiRes: any = {};

    if (isLocalProvider) {
        // --- LOCAL LLM EXECUTION (STREAMING OPTIMIZED) ---
        // Prompt for Plain Text + Tags to prevent ugly JSON streaming
        const systemPromptLocal = `
        Eres Arise, asistente de MTZ.
        ${companyContext}
        ${faqContext}
        USUARIO: ${safeName} | ROL: ${userRole}
        MEMORIAS PREVIAS: ${memoryContext || "Ninguna"}
        
        OBJETIVO:
        1. Tu misión es ANALIZAR la situación del usuario y GUIARLO.
        2. Tus respuestas deben ser CORTAS y directas al grano. Evita paja.
        3. Usa las MEMORIAS para dar continuidad (ej: "Como mencionaste antes...").
        4. Si es INVITADO, tu objetivo es vender/captar lead. Si es CLIENTE, resolver dudas.
        
        FORMATO: Texto plano.
        METADATA (Al final de tu respuesta):
        - [MENU:id_menu] (Si sugieres opciones visuales)
        - [LEAD] (Si detectas alta intención de compra)
        Ids Menú: ${userRole === 'cliente' ? 'cliente_root, cliente_docs, cliente_taxes' : 'invitado_root, invitado_cotizar'}
        `;

        const { callLocalLLM } = await import('../localLLMClient');
        const localUrl = import.meta.env.VITE_LOCAL_LLM_URL || 'http://localhost:1234/v1';
        const localModel = import.meta.env.VITE_LOCAL_LLM_MODEL || 'llama-3.2-3b-instruct';

        const messages = [
            { role: "system", content: systemPromptLocal },
            { role: "user", content: message }
        ];

        // Streaming Handler
        const data = await callLocalLLM(messages, {
            url: localUrl,
            model: localModel,
            temperature: 0.7
        }, (chunk) => {
             if (onChunk) onChunk(chunk);
        });

        let fullText = data.choices?.[0]?.message?.content || "";
        
        // Parse Tags
        aiRes.text = fullText.replace(/\[MENU:.*?\]/g, '').replace(/\[LEAD\]/g, '').trim();
        
        const menuMatch = fullText.match(/\[MENU:(.*?)\]/);
        if (menuMatch) aiRes.suggested_menu_id = menuMatch[1];
        
        if (fullText.includes('[LEAD]')) aiRes.show_lead_form = true;

    } else {
        // --- GEMINI EDGE FUNCTION EXECUTION (JSON) ---
        const systemPromptJSON = `
        Eres Arise, asistente de MTZ.
        
        ${companyContext}
        ${faqContext}
        
        USUARIO: ${safeName} | ROL: ${userRole}
        ESTADO ACTUAL: ${JSON.stringify(currentState)}
        
        MEMORIAS DEL USUARIO (Información que debes recordar):
        ${memoryContext || "No hay memorias previas."}
        
        OBJETIVO:
        1. Responder la duda del usuario de forma útil, empática y concisa (max 2 párrafos).
        2. USA LAS MEMORIAS para personalizar la respuesta si es relevante (ej. si sabes su nombre o preferencias, úsalo).
        3. PROVEEDOR: Gemini via Supabase.
        4. SIEMPRE SUGERIR UN MENÚ VISUAL ("menu_suggestion") que tenga sentido con la respuesta.
           - IDs Disponibles para ${userRole}: ${userRole === 'cliente' ? 'cliente_root, cliente_docs, cliente_taxes, cliente_tutorials' : 'invitado_root, invitado_cotizar, invitado_tutorials'}.
        5. ROLES:
           - Si ROL es 'cliente': Tu foco es servicio, soporte técnico y retención.
           - Si ROL es 'invitado': Tu foco es VENTAS y CAPTURA DE LEADS (SDR).
             * Intenta sutilmente obtener: Qué servicio busca, Giro de empresa, Nombre y Correo/Teléfono.
             * No seas invasivo, pero si muestra interés, invita a dejar sus datos para que un experto lo contacte.
        
        IMPORTANTE: Nunca te dirijas al usuario como "undefined". Si no tienes nombre, usa un saludo genérico o "Usuario".
    
        FORMATO JSON (IMPORTANTE: RESPONDE SOLO JSON VÁLIDO):
        {
          "text": "Respuesta...",
          "suggested_menu_id": "optional_menu_id", // ID del menú a mostrar
          "show_lead_form": boolean // true si ves alta intención y quieres mostrar formulario
        }
        `;

        // Call Supabase Edge Function 'gemini-chat'
        const { data: responseData, error } = await supabase.functions.invoke('gemini-chat', {
            body: {
                contents: [{ parts: [{ text: `${systemPromptJSON}\n\nUser: "${message}"` }] }],
                generationConfig: { temperature: 0.5 },
                model: "gemini-2.0-flash-exp"
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
        
        aiRes = JSON.parse(textRaw);
    }
    
    let responseObj: ChatResponse = {
      text: aiRes.text || "Entendido.",
      nextState: currentState,
      show_lead_form: aiRes.show_lead_form
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
