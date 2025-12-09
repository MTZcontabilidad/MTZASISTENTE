/**
 * Funciones para manejar el tarifario de servicios
 */

import { supabase } from './supabase';
import { ServicePricing } from '../types';

/**
 * Obtiene todos los servicios activos
 */
export async function getActiveServices(): Promise<ServicePricing[]> {
  try {
    const { data, error } = await supabase
      .from('service_pricing')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('service_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return [];
  }
}

/**
 * Obtiene un servicio por código
 */
export async function getServiceByCode(serviceCode: string): Promise<ServicePricing | null> {
  try {
    const { data, error } = await supabase
      .from('service_pricing')
      .select('*')
      .eq('service_code', serviceCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error al obtener servicio:', error);
    return null;
  }
}

/**
 * Obtiene servicios por categoría
 */
export async function getServicesByCategory(category: string): Promise<ServicePricing[]> {
  try {
    const { data, error } = await supabase
      .from('service_pricing')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('service_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener servicios por categoría:', error);
    return [];
  }
}

/**
 * Formatea el precio de un servicio
 */
export function formatServicePrice(service: ServicePricing): string {
  const price = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: service.currency || 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(service.base_price);

  return price;
}

/**
 * Obtiene el precio de un servicio por código
 */
export async function getServicePrice(serviceCode: string): Promise<number | null> {
  const service = await getServiceByCode(serviceCode);
  return service?.base_price || null;
}

