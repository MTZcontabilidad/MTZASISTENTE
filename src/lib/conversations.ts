import { supabase } from './supabase'
import { Conversation, Message } from '../types'

/**
 * Obtiene o crea la conversación activa del usuario actual
 */
export async function getActiveConversation(userId: string): Promise<string> {
  try {
    // Detectar usuarios de desarrollo (IDs que no son UUIDs válidos)
    // Si el ID empieza con "dev-" o no es un UUID válido, usar modo temporal sin consultar Supabase
    const isDevUser = userId.startsWith('dev-') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (isDevUser) {
      // Usuario de desarrollo: retornar ID temporal sin consultar Supabase
      return 'temp-' + userId
    }

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
    // Detectar usuarios de desarrollo
    const isDevUser = userId.startsWith('dev-') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (isDevUser) {
      // Usuario de desarrollo: retornar vacío sin consultar Supabase
      return []
    }

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
    // Si es un ID temporal, no buscar en Supabase (modo desarrollo)
    if (conversationId.startsWith('temp-')) {
      // En modo desarrollo, retornar vacío sin consultar Supabase
      return []
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      // Si la tabla no existe o hay error de UUID inválido, retornar vacío silenciosamente
      if (error.code === '42P01' || error.code === '22P02') {
        return []
      }
      throw error
    }
    
    return (data || []).map(msg => ({
      ...msg,
      timestamp: new Date(msg.created_at)
    }))
  } catch (error) {
    // Solo loggear errores que no sean esperados en modo desarrollo
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (!errorMessage.includes('invalid input syntax for type uuid')) {
      console.error('Error al obtener mensajes:', error)
    }
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
    // Detectar usuarios de desarrollo o conversaciones temporales
    const isDevUser = userId.startsWith('dev-') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    const isTempConversation = conversationId.startsWith('temp-');
    
    // Si es usuario de desarrollo o conversación temporal, retornar mensaje local sin consultar Supabase
    if (isDevUser || isTempConversation) {
      return {
        id: `temp-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conversation_id: null,
        user_id: userId,
        text,
        sender,
        created_at: new Date().toISOString(),
        timestamp: new Date(),
        metadata: metadata || {}
      }
    }

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
      // Si falla por tabla no existente, política, o UUID inválido, crear mensaje local
      if (error.code === '42P01' || error.code === '42501' || error.code === '22P02' || 
          error.message?.includes('invalid input syntax for type uuid')) {
        console.warn('No se pudo guardar en BD (modo desarrollo o error de UUID):', error.message)
        // Retornar mensaje local sin guardar
        return {
          id: `temp-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          conversation_id: conversationId.startsWith('temp-') ? null : conversationId,
          user_id: userId,
          text,
          sender,
          created_at: new Date().toISOString(),
          timestamp: new Date(),
          metadata: metadata || {}
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

