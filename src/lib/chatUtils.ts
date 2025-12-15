import { updateClientInfo } from "./clientInfo";
import { upsertClientExtendedInfo } from "./clientExtendedInfo";

import { supabase } from "./supabase";

/**
 * Detecta si el mensaje contiene información importante que debe guardarse en memoria usando IA (Gemini)
 */
// import { callLocalLLM } from "./localLLMClient"; // Removed

/**
 * Detecta si el mensaje contiene información importante que debe guardarse en memoria usando IA
 */
export async function detectImportantInfo(userInput: string): Promise<{
  shouldSave: boolean;
  type: "important_info" | "preference" | "fact" | null;
  content?: string;
  importance?: number;
}> {
  try {
    // 1. Filtrado rápido
    if (userInput.length < 5 || ["hola", "gracias", "chau", "ok"].includes(userInput.toLowerCase().trim())) {
        return { shouldSave: false, type: null };
    }

    // 2. Determinar si usar Local LLM (Eliminado - Siempre usa Cloud)
    // const forceLocal = false; 

    const systemPrompt = `Eres un experto en Memory Extraction. 
    Analiza el mensaje y extrae datos relevantes.
    NO saludes. SOLO responde con un JSON válido.
    
    SCHEMA:
    {
      "shouldSave": boolean,
      "type": "important_info" | "preference" | "fact" | "style_update" | null,
      "content": "resumen en tercera persona",
      "importance": number (1-10),
      "ai_profile_update": { // SOLO si detectas preferencias de cómo hablarle
         "tone": "formal" | "casual" | "direct" | null,
         "verbosity": "high" | "low" | null,
         "greeting": boolean | null // false si pide no saludar
      }
    }`;

    let responseText = "";

    // Siempre usar Supabase (Gemini)
    if (true) {
       // 3. Fallback a Supabase (Gemini)
       const { data: responseData, error } = await supabase.functions.invoke('gemini-chat', {
            body: {
                contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Input: "${userInput}"` }] }],
                generationConfig: { responseMimeType: "application/json" }
            }
       });
       if (error || !responseData) throw new Error(error?.message || 'No response from Supabase');
       responseText = responseData.candidates[0].content.parts[0].text;
    }

    // Limpieza de Markdown JSON si el LLM lo pone
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiRes = JSON.parse(jsonStr);

    // NUEVO: Si hay actualización de perfil, guardarla inmediatamente
    if (aiRes.ai_profile_update) {
        // Obtenemos el usuario actual del contexto (truco rápido: auth.getUser es lento aquí, asumimos que caller maneja identidad, 
        // pero detectImportantInfo no recibe userId. Necesitamos refactorizar o usar un hack. 
        // MEJOR: Retornamos el update y que el caller lo guarde, PERO chatUtils es librería.
        // SOLUCIÓN: Intentar obtener usuario actual de supabase.auth si es posible.
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
             // Fetch existing first to merge? upsertClientExtendedInfo handles merge? 
             // upsertClientExtendedInfo hace un upsert simple. Necesitamos mergear con lo existente.
             // Para simplificar y velocidad, hacemos un "patch" ciego al campo jsonb si es posible, 
             // o leemos antes. upsertClientExtendedInfo en realidad hace un merge de columnas, no de JSON profundo.
             // Vamos a leer el actual primero.
             const { getClientExtendedInfo } = await import("./clientExtendedInfo");
             const currentInfo = await getClientExtendedInfo(user.id);
             const currentProfile = currentInfo?.ai_profile || {};
             
             const newProfile = { ...currentProfile, ...aiRes.ai_profile_update };
             
             // Remove nulls
             Object.keys(newProfile).forEach(key => newProfile[key] === null && delete newProfile[key]);

             await upsertClientExtendedInfo(user.id, { ai_profile: newProfile });
             console.log('[Style Learning] Perfil actualizado:', newProfile);
        }
    }

    return {
        shouldSave: aiRes.shouldSave,
        type: aiRes.type as "important_info" | "preference" | "fact" | null,
        content: aiRes.content,
        importance: aiRes.importance
    };

  } catch (e) {
    console.warn('Fallo en Memory Extraction AI (Local/Cloud)', e);
    return fallbackDetect(userInput);
  }
}

function fallbackDetect(userInput: string): {
  shouldSave: boolean;
  type: "important_info" | "preference" | "fact" | null;
  content?: string;
  importance?: number;
} {
  // Lógica original (simplificada) para fallback
  const inputLower = userInput.toLowerCase();
  const importantKeywords = ["nombre", "soy", "empresa", "celular", "correo", "prefiero", "gusta", "odia"];
  const hasKeyword = importantKeywords.some(k => inputLower.includes(k));
  
  if (!hasKeyword) return { shouldSave: false, type: null };
  return { 
      shouldSave: true, 
      type: "fact", 
      content: userInput, 
      importance: 3 
  };
}

/**
 * Detecta y guarda información del cliente del mensaje
 */
export async function detectAndSaveClientInfo(userId: string, userInput: string): Promise<void> {
  try {
    const inputLower = userInput.toLowerCase();
    const updates: any = {};
    
    // Detectar RUT (formato: XX.XXX.XXX-X o XXXXXXXX-X)
    const rutMatch = userInput.match(/\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]\b/);
    if (rutMatch) {
      const rut = rutMatch[0].replace(/\./g, '').replace(/-/g, '');
      await updateClientInfo(userId, { custom_fields: { rut } });
    }
    
    // Detectar giro del negocio
    if (inputLower.includes('giro') || inputLower.includes('actividad')) {
      const giroMatch = userInput.match(/(?:giro|actividad)[\s:]+(.+?)(?:\.|$|,)/i);
      if (giroMatch && giroMatch[1]) {
        updates.business_activity = giroMatch[1].trim();
      }
    }
    
    // Detectar número de empleados
    const empleadosMatch = userInput.match(/(\d+)\s*(?:empleados?|trabajadores?|personas)/i);
    if (empleadosMatch) {
      updates.employee_count = parseInt(empleadosMatch[1]);
    }
    
    // Detectar rango de ingresos mensuales
    if (inputLower.includes('ingreso') || inputLower.includes('venta') || inputLower.includes('facturación')) {
      const ingresosMatch = userInput.match(/(\d+(?:\.\d+)?)\s*(?:millones?|m)/i);
      if (ingresosMatch) {
        const millones = parseFloat(ingresosMatch[1]);
        if (millones < 50) updates.monthly_revenue_range = 'menos_50';
        else if (millones < 200) updates.monthly_revenue_range = '50_200';
        else if (millones < 500) updates.monthly_revenue_range = '200_500';
        else updates.monthly_revenue_range = 'mas_500';
      }
    }

    // --- NUEVO: DETECCIÓN DE RÉGIMEN TRIBUTARIO ---
    if (inputLower.includes('14') || inputLower.includes('pro pyme') || inputLower.includes('renta presunta')) {
         if (inputLower.includes('d3') || (inputLower.includes('pro pyme') && inputLower.includes('general'))) {
             updates.tax_regime = 'Pro Pyme General (14 D3)';
         } else if (inputLower.includes('d8') || (inputLower.includes('pro pyme') && inputLower.includes('transparente'))) {
             updates.tax_regime = 'Pro Pyme Transparente (14 D8)';
         } else if (inputLower.includes('renta presunta')) {
             updates.tax_regime = 'Renta Presunta';
         } else if (inputLower.includes('semi integrad')) {
             updates.tax_regime = 'Semi Integrado (14 A)';
         }
    }

    // --- NUEVO: DETECCIÓN DE ESTADO DE PAGO / DEUDAS ---
    if (inputLower.includes('iva') || inputLower.includes('deuda') || inputLower.includes('pago')) {
        if (inputLower.includes('atrasado') || inputLower.includes('debo') || inputLower.includes('pendiente')) {
            updates.payment_status = 'deudor';
            updates.iva_declaration_status = 'atrasado';
        } else if (inputLower.includes('al día') || inputLower.includes('pagado') || inputLower.includes('listo')) {
            updates.payment_status = 'al_dia';
            updates.iva_declaration_status = 'declarado';
        }
    }
    
    // Si hay actualizaciones, guardarlas
    if (Object.keys(updates).length > 0) {
      await upsertClientExtendedInfo(userId, updates);
    }
  } catch (error) {
    console.warn('Error al detectar información del cliente:', error);
  }
}

/**
 * Captura datos de prospectos (invitados) en una tabla separada
 */
export async function captureGuestLead(
    sessionId: string, 
    userInput: string, 
    aiExtraction: { type: string | null, content?: string, importance?: number }
): Promise<void> {
    // Solo nos interesa si es 'important_info' o hay datos de contacto explícitos
    if (aiExtraction.type !== 'important_info' && aiExtraction.importance! < 7) return;
    
    try {
        // Detectar emails o telefonos con regex simple para indexar
        const emailMatch = userInput.match(/[\w.-]+@[\w.-]+\.\w+/);
        const phoneMatch = userInput.match(/(\+?56)?(\s?9)(\s?\d{4})(\s?\d{4})/);
        
        const contactInfo: any = {};
        if (emailMatch) contactInfo.email = emailMatch[0];
        if (phoneMatch) contactInfo.phone = phoneMatch[0];
        
        // Si no capturamos datos duros, pero la IA dice que es importante, guardamos el resumen
        if (Object.keys(contactInfo).length === 0 && !aiExtraction.content) return;

        // Upsert en tabla de leads
        const { error } = await supabase
            .from('guest_leads')
            .upsert({
                session_id: sessionId,
                contact_info: contactInfo,
                chat_summary: aiExtraction.content || userInput,
                intent: 'potential_client',
                updated_at: new Date().toISOString()
            }, { onConflict: 'session_id' }); // Usar session_id como clave única por simplicidad
            
        if (error) console.error('Error insertando lead:', error);
        
    } catch (e) {
        console.warn('Error capturando guest lead:', e);
    }
}

/**
 * Helper simple para determinar si es un usuario invitado basado en su ID o rol
 */
export function isGuestUser(userId: string): boolean {
    return userId.startsWith('guest-') || userId === 'invitado';
}
