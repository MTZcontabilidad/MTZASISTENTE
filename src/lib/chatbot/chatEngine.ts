
import { supabase } from '../supabase';
import { findSIILinks } from '../sii_links';
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
    // Obtener información de la empresa para contexto
    const { getCompanyInfo, findMatchingFAQs, getActiveFAQs } = await import('../companyConfig');
    
    // Parallel fetch of all context
    const [basicInfo, extendedInfo, companyInfo, relevantFAQs] = await Promise.all([
       getOrCreateClientInfo(userId),
       getClientExtendedInfo(userId),
       getCompanyInfo(),
       findMatchingFAQs(message) // Use smart search first
    ]);
    
    // Fallback to top FAQs if no match found, to ensure some context
    const faqs = relevantFAQs.length > 0 ? relevantFAQs : (await getActiveFAQs()).slice(0, 5);
    
    const aiProfile = extendedInfo?.ai_profile || { tone: 'neutral' };

    // Determine Provider
    // Determine Provider
    const aiProviderEnv = import.meta.env.VITE_AI_PROVIDER || 'gemini';
    // Forced to false to ensure Gemini is always used
    const forceLocal = false; 
    const isLocalProvider = forceLocal;

    const safeName = (userName && userName !== 'undefined') ? userName : (basicInfo?.preferred_name || 'Usuario');

    // Construir contexto de memoria (OPT: Limit to 5 for speed)
    const recentMemories = memories.slice(-5);
    const memoryContext = recentMemories
      .map(m => `- [${m.importance >= 7 ? 'IMPORTANTE' : 'Info'}] ${m.content} (${new Date(m.created_at).toLocaleDateString()})`)
      .join('\n');

    
    const companyContext = companyInfo ? `
    INFORMACIÓN DE LA EMPRESA (MTZ):
    - Nombre: ${companyInfo.company_name}
    - Horario: ${companyInfo.business_hours || 'Lunes a Viernes 9:00 - 18:00'}
    - Contacto: ${companyInfo.phone || ''} / ${companyInfo.email || ''}
    - Dirección: ${companyInfo.address || ''}
    - Ubicación (Mapa): https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companyInfo.address || 'MTZ Contabilidad Iquique')}
    - Web: ${companyInfo.website || ''}
    ` : '';
    
    const clientContext = extendedInfo ? `
    PERFIL DEL CLIENTE (Supabase):
    - Actividad: ${extendedInfo.business_activity || "No especificada"}
    - Empleados: ${extendedInfo.employee_count || "N/A"}
    - Ingresos: ${extendedInfo.monthly_revenue_range || "N/A"}
    - Estado IVA: ${extendedInfo.iva_declaration_status || "Desconocido"}
    - Estado Pago: ${extendedInfo.payment_status || "Desconocido"}
    ` : '';
    
    const faqContext = faqs.length > 0 ? `
    PREGUNTAS FRECUENTES (Usar como referencia oficial):
    ${faqs.map(f => `Q: ${f.question} | A: ${f.answer}`).join('\n')}
    ` : '';

    let aiRes: any = {};

    if (isLocalProvider) {
         // Block removed - Dead code
         throw new Error("Local LLM is disabled");
    } else {
        // --- GEMINI EDGE FUNCTION EXECUTION (JSON) ---
        
        // 4. Integrar Knowledge Base (SII Links)
        const detectedLinks = findSIILinks(message);
        let linksContextInfo = "";
        if (detectedLinks.length > 0) {
            linksContextInfo = `\n[SISTEMA: Se encontraron ${detectedLinks.length} enlaces oficiales relevantes (ej: ${detectedLinks[0].text}). ESTÁN DISPONIBLES COMO BOTONES. Menciónalos o invita a usarlos.]`;
        }

        const systemPromptJSON = `
        Eres Arise, asistente de MTZ.
        ${linksContextInfo}
        
        ${companyContext}
        ${clientContext}
        ${faqContext}
        
        USUARIO: ${safeName} | ROL: ${userRole}
        ESTADO ACTUAL: ${JSON.stringify(currentState)}
        
        MEMORIAS DEL USUARIO (Información que debes recordar):
        ${memoryContext || "No hay memorias previas."}

        PERFIL DE ESTILO Y ADAPTABILIDAD (AI PROFILE):
        ${JSON.stringify(aiProfile)}
        
        OBJETIVO:
        1. Adaptación de ESTILO (CRÍTICO):
           - Si ai_profile.tone es 'formal', usa "Estimado/a", "Usted". Si es 'direct' o 'casual', sé más relajado y directo.
           - Si ai_profile.verbosity es 'low', SÉ EXTREMADAMENTE BREVE (max 20 palabras).
           - Si ai_profile.greeting es false, NO SALUDES, ve directo a la respuesta.
        
        2. DETECCIÓN DE INCERTIDUMBRE (NUEVO):
           - Si el usuario dice "no sé", "estoy perdido", "qué hago", "ayuda" o es muy vago/ambiguo:
             * Responde con EMPATÍA.
             * SUGIERE OBLIGATORIAMENTE el menú "invitado_guiar" (si rol es invitado) o "cliente_root" (si rol es cliente).
             * Tu respuesta de texto debe ser una frase puente para ese menú.

        3. PERFILADO ACTIVO (DETECTIVE):
           - Revisa el PERFIL DEL CLIENTE arriba. Si faltan datos clave como 'Actividad', 'Régimen', 'Ingresos' o 'Estado IVA':
             * Tu misión secundaria es OBTENERLOS sin ser molesto.
             * Si la conversación lo permite, agrega una pregunta casual al final: "Por cierto, ¿eres Pro Pyme?" o "¿A qué rubro te dedicas exactamente?".
             * No preguntes todo de golpe. Solo una cosa a la vez.

        4. Responder la duda del usuario de forma útil.
        5. USA LAS MEMORIAS para personalizar la respuesta si es relevante.
        6. PROVEEDOR: Gemini via Supabase.
        7. SIEMPRE SUGERIR UN MENÚ VISUAL ("menu_suggestion") que tenga sentido con la respuesta.
           - IDs Disponibles para ${userRole}: ${userRole === 'cliente' ? 'cliente_root, cliente_docs, cliente_taxes, cliente_tutorials' : 'invitado_root, invitado_cotizar, invitado_tutorials, invitado_guiar'}.
        8. ROLES:
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
        
        // Add detected links strictly as options
        if (detectedLinks.length > 0) {
            aiRes.options = detectedLinks.map(link => ({
                id: 'link_' + Math.random().toString(36).substr(2, 9),
                text: link.text,
                label: link.text,
                url: link.url,
                icon: 'link' // Material icon definition
            }));
        }
    }
    
    let responseObj: ChatResponse = {
      text: aiRes.text || "Entendido.",
      nextState: currentState,
      show_lead_form: aiRes.show_lead_form
    };

    // If AI provides direct options (links), use them
    if (aiRes.options && aiRes.options.length > 0) {
        responseObj.show_menu = true;
        responseObj.options = aiRes.options;
    }

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
