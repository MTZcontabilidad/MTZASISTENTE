/**
 * Sistema de resúmenes de conversaciones para evitar sobrecarga
 * Cuando una conversación tiene muchos mensajes, se crea un resumen
 * y solo se cargan los mensajes recientes + el resumen
 */

import { supabase } from './supabase'
import { getConversationMessages } from './conversations'

export interface ConversationSummary {
  id: string
  conversation_id: string
  summary_text: string
  key_points: string[]
  important_info: Record<string, any>
  message_count: number
  first_message_id: string | null
  last_message_id: string | null
  created_at: string
  summarized_message_ids: string[]
}

const MAX_MESSAGES_BEFORE_SUMMARY = 50 // Crear resumen después de 50 mensajes
const MESSAGES_TO_KEEP = 20 // Mantener los últimos 20 mensajes sin resumir

/**
 * Crea un resumen de una conversación
 */
export async function createConversationSummary(
  conversationId: string
): Promise<ConversationSummary | null> {
  try {
    // Obtener todos los mensajes de la conversación
    const allMessages = await getConversationMessages(conversationId)
    
    if (allMessages.length < MAX_MESSAGES_BEFORE_SUMMARY) {
      return null // No es necesario crear resumen aún
    }

    // Separar mensajes: los que se resumirán y los que se mantendrán
    const messagesToSummarize = allMessages.slice(0, -MESSAGES_TO_KEEP)
    const messagesToKeep = allMessages.slice(-MESSAGES_TO_KEEP)

    // Extraer información importante de los mensajes
    const keyPoints: string[] = []
    const importantInfo: Record<string, any> = {}
    let summaryText = ''

    // Analizar mensajes para extraer información clave
    for (const msg of messagesToSummarize) {
      const text = msg.text.toLowerCase()
      
      // Detectar información importante
      if (text.includes('nombre') || text.includes('me llamo')) {
        const nameMatch = msg.text.match(/(?:nombre|me llamo|soy)\s+(.+?)(?:\.|$|,)/i)
        if (nameMatch) {
          importantInfo.client_name = nameMatch[1].trim()
          keyPoints.push(`Cliente: ${nameMatch[1].trim()}`)
        }
      }

      if (text.includes('teléfono') || text.includes('celular') || text.includes('fono')) {
        const phoneMatch = msg.text.match(/(?:teléfono|celular|fono)[\s:]+([+\d\s-]+)/i)
        if (phoneMatch) {
          importantInfo.client_phone = phoneMatch[1].trim()
          keyPoints.push(`Teléfono: ${phoneMatch[1].trim()}`)
        }
      }

      if (text.includes('dirección') || text.includes('direccion') || text.includes('dire')) {
        const addressMatch = msg.text.match(/(?:dirección|direccion|dire)[\s:]+(.+?)(?:\.|$|,)/i)
        if (addressMatch) {
          importantInfo.client_address = addressMatch[1].trim()
        }
      }

      // Detectar solicitudes de servicios
      if (text.includes('taller') || text.includes('silla')) {
        importantInfo.service_type = 'wheelchair_workshop'
        keyPoints.push('Solicitud de servicio: Taller de Sillas de Ruedas')
      }

      if (text.includes('transporte') || text.includes('viaje') || text.includes('llevar')) {
        importantInfo.service_type = 'transport'
        keyPoints.push('Solicitud de servicio: Transporte Inclusivo')
      }

      // Agregar al resumen
      summaryText += `${msg.sender === 'user' ? 'Usuario' : 'Asistente'}: ${msg.text}\n`
    }

    // Crear resumen más conciso
    const conciseSummary = `Resumen de conversación con ${importantInfo.client_name || 'cliente'} sobre ${importantInfo.service_type || 'consulta general'}. ${keyPoints.join('. ')}.`

    // Guardar resumen en la base de datos
    const { data, error } = await supabase
      .from('conversation_summaries')
      .insert({
        conversation_id: conversationId,
        summary_text: conciseSummary,
        key_points: keyPoints,
        important_info: importantInfo,
        message_count: messagesToSummarize.length,
        first_message_id: messagesToSummarize[0]?.id || null,
        last_message_id: messagesToSummarize[messagesToSummarize.length - 1]?.id || null,
        summarized_message_ids: messagesToSummarize.map(m => m.id)
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al crear resumen de conversación:', error)
    return null
  }
}

/**
 * Obtiene los resúmenes de una conversación
 */
export async function getConversationSummaries(
  conversationId: string
): Promise<ConversationSummary[]> {
  try {
    const { data, error } = await supabase
      .from('conversation_summaries')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error al obtener resúmenes:', error)
    return []
  }
}

/**
 * Verifica si una conversación necesita resumen
 */
export async function shouldCreateSummary(
  conversationId: string
): Promise<boolean> {
  try {
    const messages = await getConversationMessages(conversationId)
    
    // Verificar si ya hay un resumen reciente
    const summaries = await getConversationSummaries(conversationId)
    const lastSummary = summaries[summaries.length - 1]
    
    if (lastSummary) {
      // Si hay un resumen, verificar cuántos mensajes nuevos hay desde entonces
      const messagesSinceSummary = messages.filter(
        m => !lastSummary.summarized_message_ids.includes(m.id)
      )
      return messagesSinceSummary.length >= MAX_MESSAGES_BEFORE_SUMMARY
    }

    return messages.length >= MAX_MESSAGES_BEFORE_SUMMARY
  } catch (error) {
    console.error('Error al verificar necesidad de resumen:', error)
    return false
  }
}

/**
 * Obtiene mensajes optimizados (resumen + mensajes recientes)
 */
export async function getOptimizedConversationMessages(
  conversationId: string
): Promise<{
  summaries: ConversationSummary[]
  recentMessages: any[]
  totalMessageCount: number
}> {
  try {
    const allMessages = await getConversationMessages(conversationId)
    const summaries = await getConversationSummaries(conversationId)
    
    // Obtener IDs de mensajes ya resumidos
    const summarizedIds = new Set(
      summaries.flatMap(s => s.summarized_message_ids)
    )
    
    // Filtrar mensajes recientes (no resumidos)
    const recentMessages = allMessages.filter(
      m => !summarizedIds.has(m.id)
    )

    return {
      summaries,
      recentMessages,
      totalMessageCount: allMessages.length
    }
  } catch (error) {
    console.error('Error al obtener mensajes optimizados:', error)
    return {
      summaries: [],
      recentMessages: [],
      totalMessageCount: 0
    }
  }
}

