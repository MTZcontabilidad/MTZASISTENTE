import { supabase } from './supabase'
import { ClientInfo } from '../types'

/**
 * Obtiene o crea la información del cliente
 */
export async function getOrCreateClientInfo(userId: string): Promise<ClientInfo | null> {
  try {
    // Detectar usuarios de desarrollo o invitados (IDs que no son UUIDs válidos)
    const isDevUser = userId.startsWith('dev-') || userId.startsWith('guest-') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (isDevUser) {
      // Usuario de desarrollo/invitado: retornar null sin consultar Supabase
      return null
    }

    // Intentar obtener información existente
    // Usar maybeSingle() en lugar de single() para evitar errores 406 cuando no existe
    const { data: existing, error: fetchError } = await supabase
      .from('client_info')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    // Si existe y no hay error, retornarlo
    if (existing && !fetchError) {
      return existing
    }

    // Si el error es "no encontrado" (PGRST116) o UUID inválido, continuar para crear uno nuevo
    if (fetchError && fetchError.code !== 'PGRST116' && fetchError.code !== '22P02') {
      throw fetchError
    }

    // Si no existe, crear una nueva entrada vacía
    const { data: newInfo, error: createError } = await supabase
      .from('client_info')
      .insert({
        user_id: userId,
        tags: [],
        custom_fields: {}
      })
      .select()
      .single()

    if (createError) {
      // Si falla por UUID inválido, retornar null silenciosamente
      if (createError.code === '22P02') {
        return null
      }
      throw createError
    }
    return newInfo
  } catch (error) {
    // Solo loggear errores que no sean esperados en modo desarrollo
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (!errorMessage.includes('invalid input syntax for type uuid')) {
      console.error('Error al obtener/crear información del cliente:', error)
    }
    return null
  }
}

/**
 * Actualiza la información del cliente
 */
export async function updateClientInfo(
  userId: string,
  updates: Partial<Omit<ClientInfo, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  try {
    // Primero verificar si existe el registro
    const { data: existing } = await supabase
      .from('client_info')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    // Si no existe, crear uno nuevo con los datos proporcionados
    if (!existing) {
      const { error: insertError } = await supabase
        .from('client_info')
        .insert({
          user_id: userId,
          ...updates,
          tags: updates.tags || [],
          custom_fields: updates.custom_fields || {}
        })

      if (insertError) throw insertError
      return true
    }

    // Si existe, actualizarlo
    const { error } = await supabase
      .from('client_info')
      .update(updates)
      .eq('user_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error al actualizar información del cliente:', error)
    return false
  }
}

/**
 * Agrega un tag al cliente
 */
export async function addClientTag(userId: string, tag: string): Promise<boolean> {
  try {
    const info = await getOrCreateClientInfo(userId)
    if (!info) return false

    const currentTags = info.tags || []
    if (currentTags.includes(tag)) return true // Ya existe

    const updatedTags = [...currentTags, tag]
    return await updateClientInfo(userId, { tags: updatedTags })
  } catch (error) {
    console.error('Error al agregar tag:', error)
    return false
  }
}

/**
 * Elimina un tag del cliente
 */
export async function removeClientTag(userId: string, tag: string): Promise<boolean> {
  try {
    const info = await getOrCreateClientInfo(userId)
    if (!info) return false

    const currentTags = info.tags || []
    const updatedTags = currentTags.filter(t => t !== tag)
    return await updateClientInfo(userId, { tags: updatedTags })
  } catch (error) {
    console.error('Error al eliminar tag:', error)
    return false
  }
}

