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
  created_at: string
  updated_at: string
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

