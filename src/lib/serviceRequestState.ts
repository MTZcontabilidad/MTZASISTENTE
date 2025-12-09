/**
 * Manejo del estado de solicitudes de servicios entre mensajes
 * Guarda el estado en metadata de la conversación
 */

import { supabase } from './supabase'
import type { ServiceRequestState } from './serviceRequests'

const STATE_KEY = 'service_request_state'

/**
 * Obtiene el estado actual de solicitud desde la conversación
 */
export async function getServiceRequestState(
  conversationId: string | null
): Promise<ServiceRequestState | null> {
  if (!conversationId || conversationId.startsWith('temp-')) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', conversationId)
      .single()

    if (error) throw error

    const state = data?.metadata?.[STATE_KEY]
    return state || null
  } catch (error) {
    console.error('Error al obtener estado de solicitud:', error)
    return null
  }
}

/**
 * Guarda el estado de solicitud en la conversación
 */
export async function saveServiceRequestState(
  conversationId: string | null,
  state: ServiceRequestState
): Promise<boolean> {
  if (!conversationId || conversationId.startsWith('temp-')) {
    return false
  }

  try {
    // Obtener metadata actual
    const { data: current, error: fetchError } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', conversationId)
      .single()

    if (fetchError) throw fetchError

    // Actualizar metadata
    const updatedMetadata = {
      ...(current?.metadata || {}),
      [STATE_KEY]: state
    }

    const { error: updateError } = await supabase
      .from('conversations')
      .update({ metadata: updatedMetadata })
      .eq('id', conversationId)

    if (updateError) throw updateError
    return true
  } catch (error) {
    console.error('Error al guardar estado de solicitud:', error)
    return false
  }
}

/**
 * Limpia el estado de solicitud
 */
export async function clearServiceRequestState(
  conversationId: string | null
): Promise<boolean> {
  if (!conversationId || conversationId.startsWith('temp-')) {
    return false
  }

  try {
    const { data: current, error: fetchError } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', conversationId)
      .single()

    if (fetchError) throw fetchError

    const updatedMetadata = { ...(current?.metadata || {}) }
    delete updatedMetadata[STATE_KEY]

    const { error: updateError } = await supabase
      .from('conversations')
      .update({ metadata: updatedMetadata })
      .eq('id', conversationId)

    if (updateError) throw updateError
    return true
  } catch (error) {
    console.error('Error al limpiar estado de solicitud:', error)
    return false
  }
}

