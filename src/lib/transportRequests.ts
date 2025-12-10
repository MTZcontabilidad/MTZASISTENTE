/**
 * Funciones para manejar solicitudes de Transporte Inclusivo - Fundación Te Quiero Feliz
 */

import { supabase } from './supabase'

export interface TransportRequest {
  id: string
  user_id: string | null
  conversation_id: string | null
  passenger_name: string
  passenger_phone: string
  passenger_email: string | null
  passenger_rut: string | null
  passenger_age: number | null
  has_mobility_aid: boolean
  mobility_aid_type: string | null
  mobility_aid_description: string | null
  special_needs: string | null
  companion_name: string | null
  companion_phone: string | null
  companion_relationship: string | null
  trip_type: 'ida' | 'vuelta' | 'ida_vuelta'
  origin_address: string
  destination_address: string
  trip_date: string
  trip_time: string
  return_date: string | null
  return_time: string | null
  trip_purpose: string | null
  trip_purpose_description: string | null
  estimated_duration: number | null
  number_of_passengers: number
  requires_assistance: boolean
  assistance_type: string | null
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'
  admin_notes: string | null
  confirmed_date: string | null
  confirmed_time: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  estimated_cost: number | null
  actual_cost: number | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface TransportRequestInput {
  passenger_name: string
  passenger_phone: string
  passenger_email?: string
  passenger_rut?: string
  passenger_age?: number
  has_mobility_aid?: boolean
  mobility_aid_type?: string
  mobility_aid_description?: string
  special_needs?: string
  companion_name?: string
  companion_phone?: string
  companion_relationship?: string
  trip_type: 'ida' | 'vuelta' | 'ida_vuelta'
  origin_address: string
  destination_address: string
  trip_date: string
  trip_time: string
  return_date?: string
  return_time?: string
  trip_purpose?: string
  trip_purpose_description?: string
  estimated_duration?: number
  number_of_passengers?: number
  requires_assistance?: boolean
  assistance_type?: string
}

/**
 * Crea una nueva solicitud de transporte
 */
export async function createTransportRequest(
  userId: string | null,
  conversationId: string | null,
  input: TransportRequestInput
): Promise<TransportRequest | null> {
  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        ...input,
        status: 'pending',
        number_of_passengers: input.number_of_passengers || 1,
        has_mobility_aid: input.has_mobility_aid || false,
        requires_assistance: input.requires_assistance || false
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al crear solicitud de transporte:', error)
    return null
  }
}

/**
 * Obtiene todas las solicitudes de transporte
 */
export async function getAllTransportRequests(
  status?: string
): Promise<TransportRequest[]> {
  try {
    // Intentar usar la función RPC primero
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_all_transport_requests_for_admin')

    if (rpcError && (
      rpcError.code === 'PGRST301' || 
      rpcError.code === '42883' || // Función no existe
      rpcError.code === '42703' || // Columna no existe
      rpcError.code === '42P01' || // Tabla no existe
      (rpcError as any).status === 400 || // Bad Request (incluye errores SQL)
      rpcError.message?.includes('Acceso denegado') || 
      rpcError.message?.includes('ambiguous') ||
      rpcError.message?.includes('column reference') ||
      rpcError.message?.includes('does not exist')
    )) {
      // Solo mostrar warning en desarrollo, en producción usar fallback silenciosamente
      if (import.meta.env.DEV) {
        console.warn("⚠️ Función RPC get_all_transport_requests_for_admin no disponible o con error, usando consulta directa...", rpcError.message);
      }
      // Fallback a consulta directa
      let query = supabase
        .from('transport_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
      if (error) throw error
      let result = data || []
      
      // Filtrar por status si se especificó
      if (status && status !== 'all') {
        result = result.filter(r => r.status === status)
      }
      
      return result
    } else if (rpcError) {
      // Si el error es de columna ambigua, ya se manejó el fallback arriba
      // Solo lanzar error si no es un error que tiene fallback
      if (!rpcError.message?.includes('ambiguous') && !rpcError.message?.includes('column reference')) {
        throw rpcError
      } else {
        // Si llegamos aquí, el fallback debería haber funcionado, pero por si acaso retornar array vacío
        console.warn('Error de RPC con fallback, pero fallback también falló')
        return []
      }
    } else {
      let result = rpcData || []
      
      // Filtrar por status si se especificó
      if (status && status !== 'all') {
        result = result.filter((r: TransportRequest) => r.status === status)
      }
      
      return result
    }
  } catch (error) {
    console.error('Error al obtener solicitudes de transporte:', error)
    return []
  }
}

/**
 * Obtiene solicitudes de un usuario
 */
export async function getUserTransportRequests(
  userId: string
): Promise<TransportRequest[]> {
  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error al obtener solicitudes del usuario:', error)
    return []
  }
}

/**
 * Alias para getUserTransportRequests (compatibilidad)
 */
export const getTransportRequestsByUserId = getUserTransportRequests

/**
 * Actualiza el estado de una solicitud
 */
export async function updateTransportRequestStatus(
  requestId: string,
  status: TransportRequest['status'],
  adminNotes?: string,
  confirmedDate?: string,
  confirmedTime?: string,
  confirmedBy?: string
): Promise<boolean> {
  try {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (adminNotes !== undefined) {
      updates.admin_notes = adminNotes
    }

    if (status === 'confirmed' && confirmedDate) {
      updates.confirmed_date = confirmedDate
      updates.confirmed_time = confirmedTime || null
      updates.confirmed_by = confirmedBy || null
      updates.confirmed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('transport_requests')
      .update(updates)
      .eq('id', requestId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error al actualizar solicitud:', error)
    return false
  }
}

/**
 * Obtiene una solicitud por ID
 */
export async function getTransportRequestById(
  requestId: string
): Promise<TransportRequest | null> {
  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al obtener solicitud:', error)
    return null
  }
}

