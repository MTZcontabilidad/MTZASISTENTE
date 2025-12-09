/**
 * Funciones para gestionar configuración de la empresa y respuestas frecuentes
 */

import { supabase } from './supabase'

export interface CompanyInfo {
  id: string
  company_name: string
  phone: string | null
  email: string | null
  address: string | null
  website: string | null
  business_hours: string | null
  description: string | null
  social_media: Record<string, any>
  created_at: string
  updated_at: string
}

export interface FAQResponse {
  id: string
  question: string
  answer: string
  triggers: string[]
  category: string
  priority: number
  is_active: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

/**
 * Obtiene la información de la empresa
 */
export async function getCompanyInfo(): Promise<CompanyInfo | null> {
  try {
    const { data, error } = await supabase
      .from('company_info')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      if (error.code === '42P01') {
        console.warn('Tabla company_info no existe aún. Ejecuta supabase-company-config.sql')
        return null
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error al obtener información de la empresa:', error)
    return null
  }
}

/**
 * Actualiza la información de la empresa
 */
export async function updateCompanyInfo(
  updates: Partial<Omit<CompanyInfo, 'id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  try {
    // Verificar si existe un registro
    const existing = await getCompanyInfo()

    if (!existing) {
      // Crear nuevo registro
      const { error } = await supabase
        .from('company_info')
        .insert({
          ...updates,
          company_name: updates.company_name || 'MTZ Contabilidad'
        })

      if (error) throw error
      return true
    }

    // Actualizar registro existente
    const { error } = await supabase
      .from('company_info')
      .update(updates)
      .eq('id', existing.id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error al actualizar información de la empresa:', error)
    return false
  }
}

/**
 * Obtiene todas las respuestas frecuentes activas
 */
export async function getActiveFAQs(): Promise<FAQResponse[]> {
  try {
    const { data, error } = await supabase
      .from('faq_responses')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('usage_count', { ascending: false })

    if (error) {
      if (error.code === '42P01') {
        console.warn('Tabla faq_responses no existe aún. Ejecuta supabase-company-config.sql')
        return []
      }
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error al obtener FAQs:', error)
    return []
  }
}

/**
 * Obtiene todas las respuestas frecuentes (incluyendo inactivas)
 */
export async function getAllFAQs(): Promise<FAQResponse[]> {
  try {
    const { data, error } = await supabase
      .from('faq_responses')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01') {
        return []
      }
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error al obtener todas las FAQs:', error)
    return []
  }
}

/**
 * Crea una nueva respuesta frecuente
 */
export async function createFAQ(faq: Omit<FAQResponse, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<FAQResponse | null> {
  try {
    const { data, error } = await supabase
      .from('faq_responses')
      .insert({
        ...faq,
        usage_count: 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al crear FAQ:', error)
    return null
  }
}

/**
 * Actualiza una respuesta frecuente
 */
export async function updateFAQ(
  id: string,
  updates: Partial<Omit<FAQResponse, 'id' | 'created_at' | 'updated_at' | 'usage_count'>>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('faq_responses')
      .update(updates)
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error al actualizar FAQ:', error)
    return false
  }
}

/**
 * Elimina una respuesta frecuente
 */
export async function deleteFAQ(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('faq_responses')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error al eliminar FAQ:', error)
    return false
  }
}

/**
 * Incrementa el contador de uso de una FAQ
 */
export async function incrementFAQUsage(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('increment_faq_usage', { faq_id: id })
    
    // Si la función RPC no existe, hacer update manual
    if (error && error.code === '42883') {
      const { data: current } = await supabase
        .from('faq_responses')
        .select('usage_count')
        .eq('id', id)
        .single()
      
      if (current) {
        const { error: updateError } = await supabase
          .from('faq_responses')
          .update({ usage_count: (current.usage_count || 0) + 1 })
          .eq('id', id)
        
        if (updateError) throw updateError
      }
      return true
    }
    
    if (error) throw error
    return true
  } catch (error) {
    console.warn('Error al incrementar uso de FAQ:', error)
    return false
  }
}

/**
 * Busca FAQs que coincidan con un texto
 */
export async function findMatchingFAQs(userInput: string): Promise<FAQResponse[]> {
  try {
    const inputLower = userInput.toLowerCase()
    
    const { data, error } = await supabase
      .from('faq_responses')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (error) {
      if (error.code === '42P01') {
        return []
      }
      throw error
    }

    if (!data) return []

    // Filtrar FAQs que coincidan con triggers o contenido
    const matching = data.filter(faq => {
      // Verificar triggers
      const hasTrigger = faq.triggers.some(trigger => 
        inputLower.includes(trigger.toLowerCase())
      )
      
      // Verificar si la pregunta o respuesta contiene palabras del input
      const questionMatch = faq.question.toLowerCase().includes(inputLower) ||
        inputLower.includes(faq.question.toLowerCase())
      const answerMatch = faq.answer.toLowerCase().includes(inputLower)
      
      return hasTrigger || questionMatch || answerMatch
    })

    return matching
  } catch (error) {
    console.error('Error al buscar FAQs:', error)
    return []
  }
}
