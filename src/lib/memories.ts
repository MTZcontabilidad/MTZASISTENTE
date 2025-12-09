import { supabase } from './supabase'
import { UserMemory, MemoryType } from '../types'

/**
 * Crea un nuevo recuerdo para el usuario
 */
export async function createMemory(
  userId: string,
  conversationId: string | null,
  memoryType: MemoryType,
  content: string,
  importance: number = 5,
  metadata?: Record<string, any>
): Promise<UserMemory | null> {
  try {
    // Si conversationId es temporal, no guardar memoria
    if (conversationId && conversationId.startsWith('temp-')) {
      console.log('Memoria no guardada (modo temporal)')
      return null
    }

    const { data, error } = await supabase
      .from('user_memories')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        memory_type: memoryType,
        content,
        importance,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error) {
      // Si la tabla no existe, solo loguear y continuar
      if (error.code === '42P01') {
        console.warn('Tabla user_memories no existe aún. Memoria no guardada.')
        return null
      }
      throw error
    }
    return data
  } catch (error) {
    console.error('Error al crear recuerdo:', error)
    return null
  }
}

/**
 * Obtiene todos los recuerdos de un usuario
 */
export async function getUserMemories(
  userId: string,
  conversationId?: string | null
): Promise<UserMemory[]> {
  try {
    // Si conversationId es temporal, no buscar memorias
    if (conversationId && conversationId.startsWith('temp-')) {
      return []
    }

    let query = supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })

    if (conversationId) {
      query = query.eq('conversation_id', conversationId)
    }

    const { data, error } = await query

    if (error) {
      // Si la tabla no existe, retornar vacío
      if (error.code === '42P01') {
        return []
      }
      throw error
    }
    return data || []
  } catch (error) {
    console.error('Error al obtener recuerdos:', error)
    return []
  }
}

/**
 * Obtiene recuerdos importantes (importancia >= 7)
 */
export async function getImportantMemories(userId: string): Promise<UserMemory[]> {
  try {
    const { data, error } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .gte('importance', 7)
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error al obtener recuerdos importantes:', error)
    return []
  }
}

/**
 * Actualiza un recuerdo existente
 */
export async function updateMemory(
  memoryId: string,
  updates: Partial<Pick<UserMemory, 'content' | 'importance' | 'metadata'>>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_memories')
      .update(updates)
      .eq('id', memoryId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error al actualizar recuerdo:', error)
    return false
  }
}

/**
 * Elimina un recuerdo
 */
export async function deleteMemory(memoryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_memories')
      .delete()
      .eq('id', memoryId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error al eliminar recuerdo:', error)
    return false
  }
}

