/**
 * Funciones para gestionar documentos de clientes
 */

import { supabase } from './supabase'

export interface ClientDocument {
  id: string
  user_id: string
  document_type: 'iva' | 'erut' | 'factura' | 'boleta' | 'declaracion' | 'otro'
  period?: string
  year?: number
  month?: number
  document_name: string
  file_url?: string
  google_script_url?: string
  download_url?: string
  file_size?: number
  mime_type?: string
  is_active: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface DocumentFilters {
  type?: string
  year?: number
  month?: number
  period?: string
}

/**
 * Obtiene todos los documentos de un cliente
 */
export async function getClientDocuments(
  userId: string,
  filters?: DocumentFilters
): Promise<ClientDocument[]> {
  try {
    let query = supabase
      .from('client_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (filters?.type) {
      query = query.eq('document_type', filters.type)
    }

    if (filters?.year) {
      query = query.eq('year', filters.year)
    }

    if (filters?.month) {
      query = query.eq('month', filters.month)
    }

    if (filters?.period) {
      query = query.eq('period', filters.period)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error al obtener documentos:', error)
    return []
  }
}

/**
 * Obtiene un documento específico
 */
export async function getDocument(
  documentId: string
): Promise<ClientDocument | null> {
  try {
    const { data, error } = await supabase
      .from('client_documents')
      .select('*')
      .eq('id', documentId)
      .eq('is_active', true)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al obtener documento:', error)
    return null
  }
}

/**
 * Obtiene documentos por tipo
 */
export async function getDocumentsByType(
  userId: string,
  documentType: string
): Promise<ClientDocument[]> {
  return getClientDocuments(userId, { type: documentType })
}

/**
 * Obtiene el Google Script URL de un cliente
 */
export async function getClientGoogleScript(
  userId: string
): Promise<{ dashboard_url?: string; documents_url?: string } | null> {
  try {
    const { data, error } = await supabase
      .from('client_google_scripts')
      .select('dashboard_url, documents_url')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al obtener Google Script:', error)
    return null
  }
}

/**
 * Actualiza el contador de acceso a un documento
 */
export async function trackDocumentAccess(documentId: string): Promise<void> {
  try {
    const { data: document } = await supabase
      .from('client_documents')
      .select('metadata')
      .eq('id', documentId)
      .single()

    if (document) {
      const accessCount = ((document.metadata as any)?.access_count || 0) + 1
      const updatedMetadata = {
        ...(document.metadata as any),
        last_accessed: new Date().toISOString(),
        access_count: accessCount
      }

      await supabase
        .from('client_documents')
        .update({ metadata: updatedMetadata })
        .eq('id', documentId)
    }
  } catch (error) {
    console.error('Error al trackear acceso:', error)
  }
}

/**
 * Genera URL de descarga para un documento
 */
export function getDocumentDownloadUrl(document: ClientDocument): string | null {
  // Prioridad: download_url > file_url > google_script_url
  return document.download_url || document.file_url || document.google_script_url || null
}

/**
 * Formatea el nombre del documento para mostrar
 */
export function formatDocumentName(document: ClientDocument): string {
  if (document.period) {
    return `${document.document_name} (${document.period})`
  }
  if (document.year && document.month) {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${document.document_name} - ${monthNames[document.month - 1]} ${document.year}`
  }
  return document.document_name
}

/**
 * Obtiene el icono para un tipo de documento
 */
export function getDocumentIcon(type: string): string {
  const icons: Record<string, string> = {
    iva: '📊',
    erut: '📋',
    factura: '🧾',
    boleta: '🧾',
    declaracion: '📄',
    otro: '📁'
  }
  return icons[type] || '📄'
}
