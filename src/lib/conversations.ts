import { supabase } from './supabase'
import { Conversation, Message } from '../types'

/**
 * Obtiene o crea la conversación activa del usuario actual
 */
export async function getActiveConversation(userId: string): Promise<string> {
  try {
    // Buscar conversación activa existente
    const { data: existingConv, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Si existe y no hay error, retornarla
    if (existingConv && !fetchError) {
      return existingConv.id
    }

    // Si hay error de tabla no encontrada, usar mensajes sin conversación
    if (fetchError && fetchError.code === '42P01') {
      console.warn('Tabla conversations no existe aún. Usando modo sin conversaciones.')
      return 'temp-' + userId
    }

    // Si no existe, crear una nueva
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: `Conversación ${new Date().toLocaleDateString('es-ES')}`,
        is_active: true
      })
      .select('id')
      .single()

    if (createError) {
      // Si falla la creación, usar modo temporal
      console.warn('No se pudo crear conversación:', createError.message)
      return 'temp-' + userId
    }

    return newConv.id
  } catch (error: any) {
    console.error('Error al obtener conversación activa:', error)
    // Fallback: retornar ID temporal
    return 'temp-' + userId
  }
}

/**
 * Obtiene todas las conversaciones del usuario
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error al obtener conversaciones:', error)
    return []
  }
}

/**
 * Limpia/reinicia una conversación (marca como inactiva y crea una nueva)
 * IMPORTANTE: Solo limpia la vista del cliente. Todos los mensajes y datos se mantienen en Supabase.
 */
export async function clearConversation(userId: string, conversationId: string): Promise<string> {
  try {
    // Si es un ID temporal, simplemente retornar un nuevo ID temporal
    // Los mensajes temporales no se guardan en BD, así que no hay nada que limpiar
    if (conversationId.startsWith('temp-')) {
      return 'temp-' + userId + '-' + Date.now()
    }

    // IMPORTANTE: NO eliminamos mensajes, solo marcamos la conversación como inactiva
    // Todos los mensajes y datos se mantienen en Supabase para referencia futura
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ is_active: false })
      .eq('id', conversationId)
      .eq('user_id', userId)

    if (updateError && updateError.code !== '42P01') {
      console.warn('Error al marcar conversación como inactiva:', updateError)
    }

    // Crear nueva conversación activa
    // La conversación anterior y todos sus mensajes permanecen en la BD
    return await getActiveConversation(userId)
  } catch (error: any) {
    console.error('Error al limpiar conversación:', error)
    // Fallback: retornar nuevo ID temporal
    return 'temp-' + userId + '-' + Date.now()
  }
}

/**
 * Obtiene los mensajes de una conversación
 */
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  try {
    // Si es un ID temporal, buscar mensajes sin conversation_id
    if (conversationId.startsWith('temp-')) {
      const userId = conversationId.replace('temp-', '')
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .is('conversation_id', null)
        .order('created_at', { ascending: true })

      if (error && error.code !== '42P01') {
        console.error('Error al obtener mensajes:', error)
        return []
      }

      return (data || []).map(msg => ({
        ...msg,
        timestamp: new Date(msg.created_at)
      }))
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      // Si la tabla no existe o hay error, retornar vacío
      if (error.code === '42P01') {
        console.warn('Tabla messages no existe aún.')
        return []
      }
      throw error
    }
    
    return (data || []).map(msg => ({
      ...msg,
      timestamp: new Date(msg.created_at)
    }))
  } catch (error) {
    console.error('Error al obtener mensajes:', error)
    return []
  }
}

/**
 * Crea un nuevo mensaje en una conversación
 */
export async function createMessage(
  conversationId: string,
  userId: string,
  text: string,
  sender: 'user' | 'assistant',
  metadata?: Record<string, any>
): Promise<Message | null> {
  try {
    // Si es ID temporal, guardar sin conversation_id
    const messageData: any = {
      user_id: userId,
      text,
      sender,
      metadata: metadata || {}
    }

    if (!conversationId.startsWith('temp-')) {
      messageData.conversation_id = conversationId
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) {
      // Si falla por tabla no existente o política, crear mensaje local
      if (error.code === '42P01' || error.code === '42501') {
        console.warn('No se pudo guardar en BD:', error.message)
        // Retornar mensaje local sin guardar
        return {
          id: Date.now().toString(),
          conversation_id: conversationId.startsWith('temp-') ? null : conversationId,
          user_id: userId,
          text,
          sender,
          created_at: new Date().toISOString(),
          timestamp: new Date()
        }
      }
      throw error
    }

    // Actualizar updated_at de la conversación solo si no es temporal
    if (!conversationId.startsWith('temp-')) {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .then(() => {}, () => {}) // Ignorar errores silenciosamente
    }

    return {
      ...data,
      timestamp: new Date(data.created_at)
    }
  } catch (error) {
    console.error('Error al crear mensaje:', error)
    // Retornar mensaje local como fallback
    return {
      id: Date.now().toString(),
      conversation_id: conversationId.startsWith('temp-') ? null : conversationId,
      user_id: userId,
      text,
      sender,
      created_at: new Date().toISOString(),
      timestamp: new Date()
    }
  }
}

/**
 * Marca una conversación como inactiva y crea una nueva activa
 */
export async function startNewConversation(userId: string): Promise<string> {
  try {
    // Marcar todas las conversaciones como inactivas
    await supabase
      .from('conversations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)

    // Crear nueva conversación activa
    return await getActiveConversation(userId)
  } catch (error) {
    console.error('Error al crear nueva conversación:', error)
    throw error
  }
}

