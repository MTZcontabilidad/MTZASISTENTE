/**
 * Función compartida para obtener la API key de Gemini desde la base de datos
 * Usada por geminiAnalyzer, geminiTTS y otros procesos
 * 
 * Estrategia de búsqueda:
 * 1. Buscar en company_info (configuración global de la empresa)
 * 2. Buscar en companies.metadata por company_id del usuario
 * 3. Buscar en companies.metadata por RUT del usuario
 */

import { supabase } from './supabase';

/**
 * Obtiene la API key de Gemini desde la base de datos
 * Busca en múltiples ubicaciones para máxima compatibilidad
 */
export async function getGeminiApiKey(): Promise<string | null> {
  try {
    // ESTRATEGIA 1: Buscar en company_info (configuración global)
    try {
      const { data: companyInfo } = await supabase
        .from('company_info')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (companyInfo) {
        // Buscar en metadata de company_info si existe
        const metadata = (companyInfo as any).metadata as Record<string, any> | undefined;
        if (metadata?.gemini_api_key) {
          console.log('API key de Gemini encontrada en company_info');
          return metadata.gemini_api_key;
        }
        
        // También buscar directamente en campos de company_info (por si está en un campo directo)
        const directKey = (companyInfo as any).gemini_api_key;
        if (directKey) {
          console.log('API key de Gemini encontrada en company_info (campo directo)');
          return directKey;
        }
      }
    } catch (error) {
      console.log('No se pudo buscar en company_info:', error);
    }

    // ESTRATEGIA 2: Buscar en todas las companies (búsqueda global como fallback)
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('metadata')
        .limit(50); // Buscar en más companies
      
      if (companies && companies.length > 0) {
        for (const company of companies) {
          if (company?.metadata) {
            const metadata = company.metadata as Record<string, any>;
            if (metadata.gemini_api_key) {
              console.log('API key de Gemini encontrada en companies (búsqueda global)');
              return metadata.gemini_api_key;
            }
          }
        }
      }
    } catch (error) {
      console.log('Error en búsqueda global de companies:', error);
    }

    // ESTRATEGIA 3: Buscar por usuario y company_id/rut (más específico)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No hay usuario autenticado');
        return null;
      }

      // Obtener información del cliente para encontrar su RUT
      const { data: clientInfo } = await supabase
        .from('client_info')
        .select('rut, company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!clientInfo) {
        console.log('No hay client_info para el usuario');
        return null;
      }

      let company = null;

      // Intentar buscar por company_id primero (si existe)
      if (clientInfo.company_id) {
        const { data } = await supabase
          .from('companies')
          .select('metadata')
          .eq('id', clientInfo.company_id)
          .maybeSingle();
        company = data;
      }

      // Si no se encontró por company_id, buscar por RUT
      if (!company && clientInfo.rut) {
        const { data } = await supabase
          .from('companies')
          .select('metadata')
          .eq('rut', clientInfo.rut)
          .maybeSingle();
        company = data;
      }

      if (company?.metadata) {
        const metadata = company.metadata as Record<string, any>;
        if (metadata.gemini_api_key) {
          console.log('API key de Gemini encontrada en companies.metadata');
          return metadata.gemini_api_key;
        }
      }
    } catch (error) {
      console.log('Error buscando por usuario:', error);
    }

    // Si no se encontró en ninguna ubicación
    console.warn('No se encontró API key de Gemini en ninguna ubicación');
    return null;
  } catch (error) {
    console.error('Error obteniendo API key de Gemini:', error);
    return null;
  }
}

