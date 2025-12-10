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
  updates: Partial<Omit<CompanyInfo, 'id' | 'created_at' | 'updated_at' | 'social_media'>>
): Promise<boolean> {
  try {
    // Limpiar valores undefined para evitar problemas con Supabase
    const cleanUpdates: Record<string, any> = {}
    
    // Solo incluir campos que están definidos (no undefined)
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key]
      if (value !== undefined) {
        // Convertir strings vacíos a null para campos opcionales
        if (value === '' && key !== 'company_name') {
          cleanUpdates[key] = null
        } else {
          cleanUpdates[key] = value
        }
      }
    })

    // Intentar usar la función RPC primero (bypass RLS)
    // La función RPC usa COALESCE, así que podemos pasar null para mantener valores existentes
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_company_info', {
        p_company_name: cleanUpdates.company_name !== undefined ? cleanUpdates.company_name : null,
        p_phone: cleanUpdates.phone !== undefined ? cleanUpdates.phone : null,
        p_email: cleanUpdates.email !== undefined ? cleanUpdates.email : null,
        p_address: cleanUpdates.address !== undefined ? cleanUpdates.address : null,
        p_website: cleanUpdates.website !== undefined ? cleanUpdates.website : null,
        p_business_hours: cleanUpdates.business_hours !== undefined ? cleanUpdates.business_hours : null,
        p_description: cleanUpdates.description !== undefined ? cleanUpdates.description : null,
      })

      if (!rpcError) {
        console.log('Información de empresa actualizada usando RPC, resultado:', rpcData)
        // Verificar que realmente se actualizó esperando un momento
        await new Promise(resolve => setTimeout(resolve, 500))
        const verify = await getCompanyInfo()
        if (verify) {
          // Verificar que al menos uno de los campos se actualizó
          let hasChanges = false
          for (const key in cleanUpdates) {
            if (key === 'updated_at') continue
            const newValue = cleanUpdates[key]
            const currentValue = (verify as any)[key]
            
            // Comparar valores
            if (newValue === null && currentValue === null) continue
            if (newValue === null || currentValue === null) {
              hasChanges = true
              break
            }
            if (String(newValue) !== String(currentValue)) {
              hasChanges = true
              break
            }
          }
          
          if (hasChanges) {
            console.log('Actualización verificada correctamente - cambios detectados')
            return true
          } else {
            console.warn('RPC retornó éxito pero no se detectaron cambios')
          }
        }
      }
      
      // Si hay error pero no es crítico (función no existe), continuar con el método normal
      if (rpcError) {
        if (rpcError.code === '42883') {
          console.log('Función RPC no disponible, usando método normal')
        } else {
          console.warn('Error al usar RPC, intentando método normal:', rpcError)
        }
      }
    } catch (rpcErr: any) {
      // Si la función RPC no existe (código 42883), continuar con método normal
      if (rpcErr.code === '42883') {
        console.log('Función RPC no disponible, usando método normal')
      } else {
        console.warn('Error al usar RPC, intentando método normal:', rpcErr)
      }
    }

    // Método normal (puede ser bloqueado por RLS en modo desarrollo)
    const existing = await getCompanyInfo()

    if (!existing) {
      // Crear nuevo registro usando upsert para evitar problemas de duplicados
      const insertData = {
        ...cleanUpdates,
        company_name: cleanUpdates.company_name || 'MTZ Contabilidad',
        social_media: {} // Inicializar social_media como objeto vacío
      }
      
      // Usar upsert en lugar de insert para manejar mejor los casos edge
      const { data, error } = await supabase
        .from('company_info')
        .upsert(insertData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        console.error('Error al crear información de empresa:', error)
        throw error
      }
      
      if (!data || data.length === 0) {
        console.error('No se devolvieron datos después de insertar')
        return false
      }
      
      console.log('Información de empresa creada correctamente:', data[0])
      return true
    }

    // Actualizar registro existente
    const { data, error } = await supabase
      .from('company_info')
      .update(cleanUpdates)
      .eq('id', existing.id)
      .select()

    if (error) {
      console.error('Error al actualizar información de empresa:', error)
      console.error('Detalles del error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw error
    }
    
    // Si hay datos de retorno, la actualización fue exitosa
    if (data && data.length > 0) {
      console.log('Información de empresa actualizada correctamente:', data[0])
      return true
    }
    
    // Si no hay datos de retorno, verificar que realmente se actualizó
    console.log('No se devolvieron datos del select, verificando actualización...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const verify = await getCompanyInfo()
    if (!verify) {
      console.error('No se pudo verificar la actualización - registro no encontrado')
      throw new Error('No se pudo verificar que la actualización se realizó correctamente')
    }
    
    // Verificar que al menos uno de los campos se actualizó
    let hasChanges = false
    for (const key in cleanUpdates) {
      if (key === 'updated_at') continue // Ignorar updated_at
      const newValue = cleanUpdates[key]
      const currentValue = (verify as any)[key]
      
      // Comparar valores (manejar null/undefined)
      if (newValue === null && currentValue === null) continue
      if (newValue === null || currentValue === null) {
        hasChanges = true
        break
      }
      if (String(newValue) !== String(currentValue)) {
        hasChanges = true
        break
      }
    }
    
    if (!hasChanges) {
      console.warn('La actualización no cambió ningún valor. Puede ser que RLS esté bloqueando la actualización.')
      throw new Error('La actualización no se pudo completar. Verifica que tengas permisos de administrador.')
    }
    
    console.log('Información de empresa actualizada correctamente (verificada)')
    return true
  } catch (error: any) {
    console.error('Error al actualizar información de la empresa:', error)
    // Lanzar el error para que el componente pueda manejarlo
    throw error
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
      const hasTrigger = faq.triggers.some((trigger: string) => 
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

