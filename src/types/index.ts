// Tipos para el sistema de chats individuales

export type UserRole = 'admin' | 'invitado' | 'cliente' | 'inclusion'
export type UserType = 'invitado' | 'cliente_nuevo' | 'cliente_existente' | 'inclusion'
export type MemoryType = 'fact' | 'preference' | 'context' | 'important_info' | 'custom'
export type MessageSender = 'user' | 'assistant'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  user_type: UserType
  is_active?: boolean
  created_at: string
  last_login: string | null
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  is_active: boolean
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  conversation_id: string | null
  text: string
  sender: MessageSender
  user_id: string | null
  created_at: string
  metadata?: Record<string, any>
  // Para uso en el frontend
  timestamp?: Date
}

export interface UserMemory {
  id: string
  user_id: string
  conversation_id: string | null
  memory_type: MemoryType
  content: string
  importance: number
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface ClientInfo {
  id: string
  user_id: string
  company_name: string | null
  phone: string | null
  address: string | null
  notes: string | null
  tags: string[]
  custom_fields?: Record<string, any>
  preferred_name?: string | null // Nombre preferido o apodo
  use_formal_address?: boolean // Si usar "Don" antes del nombre
  gender?: 'masculino' | 'femenino' | 'otro' | null // Género para el trato formal
  is_mtz_client?: boolean | null // Si es cliente de MTZ
  wants_to_be_client?: boolean | null // Si quiere ser cliente
  rut_empresa?: string | null // RUT de la empresa
  clave_sii?: string | null // Clave SII para validación
  created_at: string
  updated_at: string
}

export interface ClientExtendedInfo {
  id: string
  user_id: string
  company_id: string | null
  iva_declared: boolean
  last_iva_declaration_date: string | null
  iva_declaration_status: 'al_dia' | 'pendiente' | 'atrasado' | 'sin_movimiento' | null
  next_iva_declaration_due: string | null
  payment_status: 'al_dia' | 'pendiente' | 'atrasado' | 'moroso'
  last_payment_date: string | null
  last_payment_amount: number | null
  outstanding_balance: number
  payment_history: any[]
  active_services: string[]
  service_history: any[]
  business_activity: string | null
  start_date: string | null
  tax_regime: string | null
  employee_count: number | null
  monthly_revenue_range: string | null
  notes: string | null
  internal_notes: string | null
  metadata: Record<string, any>
  legal_info?: Record<string, any> // Información legal: inicio_actividades, rut_empresa, razon_social, etc.
  ai_profile?: Record<string, any> // Perfil psicológico aprendido por IA
  created_at: string
  updated_at: string
}

export interface ServicePricing {
  id: string
  service_name: string
  service_code: string
  description: string | null
  base_price: number
  currency: string
  is_active: boolean
  category: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface FeeRange {
  max: number
  price: number
}

export interface ServiceItem extends ServicePricing {
  metadata: {
    calculator_enabled?: boolean
    ranges?: FeeRange[]
    [key: string]: any
  }
}

export interface ConversationSummary {
  id: string
  user_id: string
  email: string
  full_name: string | null
  user_type: UserType
  title: string
  is_active: boolean
  created_at: string
  updated_at: string
  message_count: number
  last_message_at: string | null
}

// Tipos para el sistema de reuniones
export type MeetingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'

export interface Meeting {
  id: string
  user_id: string
  title: string
  description: string | null
  meeting_date: string
  duration_minutes: number
  status: MeetingStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
  approved_at: string | null
  approved_by: string | null
  // Campos adicionales para joins
  user_email?: string
  user_full_name?: string | null
  approver_email?: string | null
  company_name?: string | null
  client_phone?: string | null
}

export interface MeetingInput {
  title: string
  description?: string
  meeting_date: string
  duration_minutes?: number
}

