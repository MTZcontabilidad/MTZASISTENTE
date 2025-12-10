import { supabase } from './supabase';
import { ServiceItem, FeeRange } from '../types';

export async function getServices(): Promise<ServiceItem[]> {
  const { data, error } = await supabase
    .from('service_pricing')
    .select('*')
    .eq('is_active', true)
    .order('base_price', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return data as ServiceItem[];
}

export async function getServiceByCode(code: string): Promise<ServiceItem | null> {
  const { data, error } = await supabase
    .from('service_pricing')
    .select('*')
    .eq('service_code', code)
    .single();

  if (error) {
    console.error(`Error fetching service ${code}:`, error);
    return null;
  }

  return data as ServiceItem;
}

export function calculateMonthlyFee(netSales: number): number {
  // Default fee ranges (fallback if not loaded from DB)
  // Based on user provided image
  const defaultRanges: FeeRange[] = [
    { max: 400000, price: 10000 },
    { max: 1500000, price: 25000 },
    { max: 3000000, price: 35000 },
    { max: 5000000, price: 50000 },
    { max: 7000000, price: 70000 },
    { max: 10000000, price: 100000 },
    { max: 15000000, price: 130000 },
    { max: 20000000, price: 160000 },
    { max: 30000000, price: 180000 },
    { max: 40000000, price: 200000 },
  ];

  for (const range of defaultRanges) {
    if (netSales <= range.max) {
      return range.price;
    }
  }

  // If sales exceed the max range, return the highest price or custom logic
  return 200000;
}
