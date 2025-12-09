import { supabase } from './supabase'
import type { Meeting, MeetingInput, MeetingStatus } from '../types'

/**
 * Obtiene todas las reuniones del usuario actual
 */
export async function getUserMeetings(userId: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_id', userId)
    .order('meeting_date', { ascending: true })

  if (error) {
    console.error('Error al obtener reuniones:', error)
    throw error
  }

  return data || []
}

/**
 * Obtiene todas las reuniones (solo para administradores)
 */
export async function getAllMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      user_profiles!meetings_user_id_fkey (
        email,
        full_name
      ),
      client_info!meetings_user_id_fkey (
        company_name,
        phone
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener todas las reuniones:', error)
    throw error
  }

  // Transformar los datos para incluir información del usuario y cliente
  return (data || []).map((meeting: any) => ({
    ...meeting,
    user_email: meeting.user_profiles?.email,
    user_full_name: meeting.user_profiles?.full_name,
    company_name: meeting.client_info?.company_name,
    client_phone: meeting.client_info?.phone,
  }))
}

/**
 * Obtiene una reunión por ID
 */
export async function getMeetingById(meetingId: string): Promise<Meeting | null> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error al obtener reunión:', error)
    throw error
  }

  return data
}

/**
 * Crea una nueva reunión
 */
export async function createMeeting(
  userId: string,
  meetingData: MeetingInput
): Promise<Meeting> {
  const { data, error } = await supabase
    .from('meetings')
    .insert({
      user_id: userId,
      title: meetingData.title,
      description: meetingData.description || null,
      meeting_date: meetingData.meeting_date,
      duration_minutes: meetingData.duration_minutes || 30,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Error al crear reunión:', error)
    throw error
  }

  return data
}

/**
 * Actualiza el estado de una reunión (para administradores)
 */
export async function updateMeetingStatus(
  meetingId: string,
  status: MeetingStatus,
  adminNotes?: string,
  adminId?: string
): Promise<Meeting> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes
  }

  if (status === 'approved' && adminId) {
    updateData.approved_at = new Date().toISOString()
    updateData.approved_by = adminId
  }

  const { data, error } = await supabase
    .from('meetings')
    .update(updateData)
    .eq('id', meetingId)
    .select()
    .single()

  if (error) {
    console.error('Error al actualizar estado de reunión:', error)
    throw error
  }

  return data
}

/**
 * Cancela una reunión (para usuarios)
 */
export async function cancelMeeting(meetingId: string, userId: string): Promise<Meeting> {
  const { data, error } = await supabase
    .from('meetings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error al cancelar reunión:', error)
    throw error
  }

  return data
}

/**
 * Obtiene las reuniones pendientes (para administradores)
 */
export async function getPendingMeetings(): Promise<Meeting[]> {
  // Obtener reuniones pendientes
  const { data: meetings, error: meetingsError } = await supabase
    .from('meetings')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (meetingsError) {
    console.error('Error al obtener reuniones pendientes:', meetingsError)
    throw meetingsError
  }

  if (!meetings || meetings.length === 0) {
    return []
  }

  // Obtener información de usuarios y clientes
  const userIds = [...new Set(meetings.map(m => m.user_id))]
  
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, email, full_name')
    .in('id', userIds)

  const { data: clientInfos } = await supabase
    .from('client_info')
    .select('user_id, company_name, phone')
    .in('user_id', userIds)

  // Crear mapas para búsqueda rápida
  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])
  const clientInfoMap = new Map(clientInfos?.map(c => [c.user_id, c]) || [])

  // Combinar datos
  return meetings.map((meeting: any) => {
    const profile = profilesMap.get(meeting.user_id)
    const clientInfo = clientInfoMap.get(meeting.user_id)
    
    return {
      ...meeting,
      user_email: profile?.email,
      user_full_name: profile?.full_name,
      company_name: clientInfo?.company_name || null,
      client_phone: clientInfo?.phone || null,
    }
  })
}

/**
 * Obtiene las reuniones aprobadas del usuario
 */
export async function getApprovedUserMeetings(userId: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .order('meeting_date', { ascending: true })

  if (error) {
    console.error('Error al obtener reuniones aprobadas:', error)
    throw error
  }

  return data || []
}

