/**
 * Funciones para manejar información extendida del cliente
 * Incluye estado de declaraciones, cobranza, servicios, etc.
 */

import { supabase } from './supabase';
import { ClientExtendedInfo } from '../types';

/**
 * Obtiene la información extendida del cliente
 */
export async function getClientExtendedInfo(userId: string): Promise<ClientExtendedInfo | null> {
  try {
    const { data, error } = await supabase
      .from('client_extended_info')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error al obtener información extendida del cliente:', error);
    return null;
  }
}

/**
 * Crea o actualiza la información extendida del cliente
 */
export async function upsertClientExtendedInfo(
  userId: string,
  updates: Partial<Omit<ClientExtendedInfo, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ClientExtendedInfo | null> {
  try {
    const { data, error } = await supabase
      .from('client_extended_info')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al actualizar información extendida del cliente:', error);
    return null;
  }
}

/**
 * Actualiza el estado de declaración de IVA
 */
export async function updateIVADeclarationStatus(
  userId: string,
  status: 'al_dia' | 'pendiente' | 'atrasado' | 'sin_movimiento',
  lastDeclarationDate?: string,
  nextDueDate?: string
): Promise<boolean> {
  try {
    const updates: any = {
      iva_declared: status !== 'sin_movimiento',
      iva_declaration_status: status,
    };

    if (lastDeclarationDate) {
      updates.last_iva_declaration_date = lastDeclarationDate;
    }

    if (nextDueDate) {
      updates.next_iva_declaration_due = nextDueDate;
    }

    const result = await upsertClientExtendedInfo(userId, updates);
    return result !== null;
  } catch (error) {
    console.error('Error al actualizar estado de IVA:', error);
    return false;
  }
}

/**
 * Actualiza el estado de pago del cliente
 */
export async function updatePaymentStatus(
  userId: string,
  status: 'al_dia' | 'pendiente' | 'atrasado' | 'moroso',
  outstandingBalance?: number,
  lastPaymentDate?: string,
  lastPaymentAmount?: number
): Promise<boolean> {
  try {
    const updates: any = {
      payment_status: status,
    };

    if (outstandingBalance !== undefined) {
      updates.outstanding_balance = outstandingBalance;
    }

    if (lastPaymentDate) {
      updates.last_payment_date = lastPaymentDate;
    }

    if (lastPaymentAmount !== undefined) {
      updates.last_payment_amount = lastPaymentAmount;
    }

    const result = await upsertClientExtendedInfo(userId, updates);
    return result !== null;
  } catch (error) {
    console.error('Error al actualizar estado de pago:', error);
    return false;
  }
}

/**
 * Agrega un servicio activo al cliente
 */
export async function addActiveService(
  userId: string,
  serviceCode: string
): Promise<boolean> {
  try {
    const currentInfo = await getClientExtendedInfo(userId);
    const activeServices = currentInfo?.active_services || [];

    if (activeServices.includes(serviceCode)) {
      return true; // Ya está activo
    }

    const updatedServices = [...activeServices, serviceCode];
    const result = await upsertClientExtendedInfo(userId, {
      active_services: updatedServices,
    });

    return result !== null;
  } catch (error) {
    console.error('Error al agregar servicio activo:', error);
    return false;
  }
}

/**
 * Obtiene información personalizada del cliente para usar en respuestas
 */
export async function getClientPersonalizationInfo(userId: string): Promise<{
  companyName?: string;
  ivaStatus?: string;
  paymentStatus?: string;
  activeServices?: string[];
  businessActivity?: string;
  employeeCount?: number;
  monthlyRevenue?: string;
}> {
  try {
    // Obtener información básica del cliente
    const { data: clientInfo } = await supabase
      .from('client_info')
      .select('company_name')
      .eq('user_id', userId)
      .maybeSingle();

    // Obtener información extendida
    const extendedInfo = await getClientExtendedInfo(userId);

    return {
      companyName: clientInfo?.company_name || undefined,
      ivaStatus: extendedInfo?.iva_declaration_status || undefined,
      paymentStatus: extendedInfo?.payment_status || undefined,
      activeServices: extendedInfo?.active_services || undefined,
      businessActivity: extendedInfo?.business_activity || undefined,
      employeeCount: extendedInfo?.employee_count || undefined,
      monthlyRevenue: extendedInfo?.monthly_revenue_range || undefined,
    };
  } catch (error) {
    console.error('Error al obtener información de personalización:', error);
    return {};
  }
}

