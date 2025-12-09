/**
 * Funciones para manejar solicitudes del Taller de Sillas de Ruedas
 */

import { supabase } from './supabase'

export interface WheelchairWorkshopRequest {
  id: string
  user_id: string | null
  conversation_id: string | null
  client_name: string
  client_phone: string
  client_email: string | null
  client_address: string | null
  wheelchair_type: string | null
  wheelchair_brand: string | null
  wheelchair_model: string | null
  wheelchair_condition: string | null
  service_type: 'reparacion' | 'mantenimiento' | 'adaptacion' | 'revision' | 'otro'
  service_description: string
  is_urgent: boolean
  preferred_date: string | null
  preferred_time: string | null
  location: string | null
  address_if_domicilio: string | null
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

export interface WheelchairRequestInput {
  client_name: string
  client_phone: string
  client_email?: string
  client_address?: string
  wheelchair_type?: string
  wheelchair_brand?: string
  wheelchair_model?: string
  wheelchair_condition?: string
  service_type: 'reparacion' | 'mantenimiento' | 'adaptacion' | 'revision' | 'otro'
  service_description: string
  is_urgent?: boolean
  preferred_date?: string
  preferred_time?: string
  location?: string
  address_if_domicilio?: string
}

/**
 * Crea una nueva solicitud del taller
 */
export async function createWheelchairRequest(
  userId: string | null,
  conversationId: string | null,
  input: WheelchairRequestInput
): Promise<WheelchairWorkshopRequest | null> {
  try {
    const { data, error } = await supabase
      .from('wheelchair_workshop_requests')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        ...input,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al crear solicitud del taller:', error)
    return null
  }
}

/**
 * Obtiene todas las solicitudes del taller
 */
export async function getAllWheelchairRequests(
  status?: string
): Promise<WheelchairWorkshopRequest[]> {
  try {
    // Intentar usar la función RPC primero
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_all_wheelchair_requests_for_admin')

    if (rpcError && (rpcError.code === 'PGRST301' || rpcError.message?.includes('Acceso denegado') || rpcError.code === '42703')) {
      console.warn("⚠️ Función RPC get_all_wheelchair_requests_for_admin no disponible o con error, intentando consulta directa...");
      // Fallback a consulta directa
      let query = supabase
        .from('wheelchair_workshop_requests')
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
      throw rpcError
    } else {
      let result = rpcData || []
      
      // Filtrar por status si se especificó
      if (status && status !== 'all') {
        result = result.filter((r: WheelchairWorkshopRequest) => r.status === status)
      }
      
      return result
    }
  } catch (error) {
    console.error('Error al obtener solicitudes del taller:', error)
    return []
  }
}

/**
 * Obtiene solicitudes de un usuario
 */
export async function getUserWheelchairRequests(
  userId: string
): Promise<WheelchairWorkshopRequest[]> {
  try {
    const { data, error } = await supabase
      .from('wheelchair_workshop_requests')
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
 * Actualiza el estado de una solicitud
 */
export async function updateWheelchairRequestStatus(
  requestId: string,
  status: WheelchairWorkshopRequest['status'],
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
      .from('wheelchair_workshop_requests')
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
export async function getWheelchairRequestById(
  requestId: string
): Promise<WheelchairWorkshopRequest | null> {
  try {
    const { data, error } = await supabase
      .from('wheelchair_workshop_requests')
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

