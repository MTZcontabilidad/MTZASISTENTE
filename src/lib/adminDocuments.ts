/**
 * Funciones para que el admin gestione documentos de clientes
 */

import { supabase } from './supabase'
import { ClientDocument } from './documents'

export interface DocumentInput {
  user_id: string
  document_type: 'iva' | 'erut' | 'factura' | 'boleta' | 'declaracion' | 'otro'
  document_name: string
  period?: string
  year?: number
  month?: number
  file_url?: string
  download_url?: string
  google_script_url?: string
  file_size?: number
  mime_type?: string
  metadata?: Record<string, any>
}

/**
 * Crea un documento para un cliente (solo admin)
 */
export async function createClientDocument(
  document: DocumentInput
): Promise<ClientDocument | null> {
  try {
    const { data, error } = await supabase
      .from('client_documents')
      .insert({
        ...document,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al crear documento:', error)
    throw error
  }
}

/**
 * Actualiza un documento (solo admin)
 */
export async function updateClientDocument(
  documentId: string,
  updates: Partial<DocumentInput>
): Promise<ClientDocument | null> {
  try {
    const { data, error } = await supabase
      .from('client_documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al actualizar documento:', error)
    throw error
  }
}

/**
 * Elimina un documento (solo admin)
 */
export async function deleteClientDocument(documentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('client_documents')
      .delete()
      .eq('id', documentId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error al eliminar documento:', error)
    throw error
  }
}

/**
 * Obtiene todos los documentos de todos los clientes (solo admin)
 */
export async function getAllClientDocuments(): Promise<ClientDocument[]> {
  try {
    const { data, error } = await supabase
      .from('client_documents')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error al obtener documentos:', error)
    return []
  }
}

/**
 * Obtiene documentos de un cliente específico (solo admin)
 */
export async function getDocumentsByUserId(userId: string): Promise<ClientDocument[]> {
  try {
    const { data, error } = await supabase
      .from('client_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error al obtener documentos del usuario:', error)
    return []
  }
}

/**
 * Asocia un Google Script a un cliente (solo admin)
 */
export async function setClientGoogleScript(
  userId: string,
  dashboardUrl: string,
  documentsUrl?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('client_google_scripts')
      .upsert({
        user_id: userId,
        dashboard_url: dashboardUrl,
        documents_url: documentsUrl,
        is_active: true
      }, {
        onConflict: 'user_id'
      })

    if (error) throw error
    
    // También actualizar client_info si existe
    await supabase
      .from('client_info')
      .update({
        dashboard_url: dashboardUrl,
        google_script_url: documentsUrl || dashboardUrl
      })
      .eq('user_id', userId)

    return true
  } catch (error) {
    console.error('Error al asociar Google Script:', error)
    throw error
  }
}
