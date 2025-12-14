/**
 * Sistema para recopilar datos faltantes de usuarios nuevos
 * El chatbot pregunta automáticamente por información faltante
 */

import { getOrCreateClientInfo, updateClientInfo } from './clientInfo';
import { supabase } from './supabase';
import type { ClientInfo } from '../types';

interface MissingData {
  field: string;
  question: string;
  priority: number;
}

/**
 * Detecta qué datos faltan en el perfil del usuario
 */
export async function detectMissingUserData(userId: string): Promise<MissingData | null> {
  try {
    // Obtener perfil de usuario
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', userId)
      .maybeSingle();

    // Obtener información del cliente
    const clientInfo = await getOrCreateClientInfo(userId);

    // Priorizar datos más importantes
    const missingData: MissingData[] = [];

    // 1. Nombre completo (alta prioridad)
    if (!profile?.full_name || profile.full_name.trim() === '') {
      missingData.push({
        field: 'full_name',
        question: '¿Cuál es tu nombre completo?',
        priority: 10,
      });
    }

    // 2. Teléfono (alta prioridad)
    if (!clientInfo?.phone || clientInfo.phone.trim() === '') {
      missingData.push({
        field: 'phone',
        question: '¿Cuál es tu número de teléfono?',
        priority: 9,
      });
    }

    // 3. Nombre de empresa (media prioridad)
    if (!clientInfo?.company_name || clientInfo.company_name.trim() === '') {
      missingData.push({
        field: 'company_name',
        question: '¿Cuál es el nombre de tu empresa? (Si no tienes empresa, puedes escribir "No aplica")',
        priority: 7,
      });
    }

    // 4. Dirección (baja prioridad)
    if (!clientInfo?.address || clientInfo.address.trim() === '') {
      missingData.push({
        field: 'address',
        question: '¿Cuál es tu dirección? (Opcional)',
        priority: 5,
      });
    }

    // Retornar el dato más prioritario que falta
    if (missingData.length > 0) {
      missingData.sort((a, b) => b.priority - a.priority);
      return missingData[0];
    }

    return null;
  } catch (error) {
    console.error('Error al detectar datos faltantes:', error);
    return null;
  }
}

/**
 * Extrae y guarda datos del mensaje del usuario
 */
export async function extractAndSaveUserData(
  userId: string,
  userMessage: string
): Promise<{ saved: boolean; field?: string }> {
  try {
    const clientInfo = await getOrCreateClientInfo(userId);
    if (!clientInfo) return { saved: false };

    const messageLower = userMessage.toLowerCase();
    const updates: Partial<ClientInfo> = {};

    // Detectar teléfono (formato chileno: +56912345678, 912345678, etc.)
    const phonePattern = /(\+?56)?9\d{8}|\d{9}/;
    const phoneMatch = userMessage.match(phonePattern);
    if (phoneMatch && !clientInfo.phone) {
      let phone = phoneMatch[0];
      // Normalizar formato
      if (!phone.startsWith('+56')) {
        if (phone.startsWith('56')) {
          phone = '+' + phone;
        } else if (phone.startsWith('9')) {
          phone = '+56' + phone;
        } else {
          phone = '+569' + phone;
        }
      }
      updates.phone = phone;
    }

    // Detectar nombre (si el mensaje parece un nombre y no contiene palabras comunes del chat)
    const chatWords = ['hola', 'gracias', 'ayuda', 'necesito', 'quiero', 'puedo', 'como', 'donde', 'cuando'];
    const isLikelyName = !chatWords.some(word => messageLower.includes(word)) && 
                         userMessage.split(' ').length <= 4 &&
                         userMessage.length < 50;
    
    if (isLikelyName && !clientInfo.company_name) {
      // Verificar si es nombre de persona o empresa
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
      
      if (!profile?.full_name || profile.full_name.trim() === '') {
        // Actualizar nombre en perfil
        await supabase
          .from('user_profiles')
          .update({ full_name: userMessage.trim() })
          .eq('id', userId);
        return { saved: true, field: 'full_name' };
      }
    }

    // Detectar nombre de empresa (si menciona "empresa", "negocio", etc.)
    if (messageLower.includes('empresa') || messageLower.includes('negocio') || messageLower.includes('compañía')) {
      const companyMatch = userMessage.match(/(?:empresa|negocio|compañía)[\s:]+(.+)/i);
      if (companyMatch && companyMatch[1]) {
        updates.company_name = companyMatch[1].trim();
      }
    }

    // Detectar dirección (si menciona "dirección", "direccion", "vivo en", etc.)
    if (messageLower.includes('dirección') || messageLower.includes('direccion') || messageLower.includes('vivo en')) {
      const addressMatch = userMessage.match(/(?:dirección|direccion|vivo en)[\s:]+(.+)/i);
      if (addressMatch && addressMatch[1]) {
        updates.address = addressMatch[1].trim();
      }
    }

    // Guardar actualizaciones si hay alguna
    if (Object.keys(updates).length > 0) {
      const saved = await updateClientInfo(userId, updates);
      return { saved, field: Object.keys(updates)[0] };
    }

    return { saved: false };
  } catch (error) {
    console.error('Error al extraer y guardar datos:', error);
    return { saved: false };
  }
}







