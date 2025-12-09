-- Estructura para tarifario de servicios y información extendida del cliente

-- Tabla de tarifario de servicios
CREATE TABLE IF NOT EXISTS service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  service_code TEXT NOT NULL UNIQUE,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'CLP',
  is_active BOOLEAN DEFAULT true,
  category TEXT, -- 'inicio_actividades', 'declaraciones', 'consultoria', etc.
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para información extendida del cliente
CREATE TABLE IF NOT EXISTS client_extended_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Información tributaria
  iva_declared BOOLEAN DEFAULT false,
  last_iva_declaration_date DATE,
  iva_declaration_status TEXT, -- 'al_dia', 'pendiente', 'atrasado', 'sin_movimiento'
  next_iva_declaration_due DATE,
  
  -- Información de cobranza
  payment_status TEXT DEFAULT 'al_dia', -- 'al_dia', 'pendiente', 'atrasado', 'moroso'
  last_payment_date DATE,
  last_payment_amount DECIMAL(10, 2),
  outstanding_balance DECIMAL(10, 2) DEFAULT 0,
  payment_history JSONB DEFAULT '[]',
  
  -- Información de servicios contratados
  active_services JSONB DEFAULT '[]', -- Array de service_codes activos
  service_history JSONB DEFAULT '[]', -- Historial de servicios
  
  -- Información adicional personalizada
  business_activity TEXT, -- Giro del negocio
  start_date DATE, -- Fecha de inicio de actividades
  tax_regime TEXT, -- Régimen tributario
  employee_count INTEGER,
  monthly_revenue_range TEXT, -- 'menos_50', '50_200', '200_500', 'mas_500' (en millones)
  
  -- Notas y observaciones
  notes TEXT,
  internal_notes TEXT, -- Notas solo para el equipo de MTZ
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_client_extended_user_id ON client_extended_info(user_id);
CREATE INDEX IF NOT EXISTS idx_client_extended_company_id ON client_extended_info(company_id);
CREATE INDEX IF NOT EXISTS idx_client_extended_iva_status ON client_extended_info(iva_declaration_status);
CREATE INDEX IF NOT EXISTS idx_client_extended_payment_status ON client_extended_info(payment_status);
CREATE INDEX IF NOT EXISTS idx_service_pricing_code ON service_pricing(service_code);
CREATE INDEX IF NOT EXISTS idx_service_pricing_category ON service_pricing(category);
CREATE INDEX IF NOT EXISTS idx_service_pricing_active ON service_pricing(is_active);

-- RLS (Row Level Security) - Solo el usuario puede ver su propia información
ALTER TABLE client_extended_info ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver su propia información
CREATE POLICY "Users can view own extended info" ON client_extended_info
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar su propia información básica
CREATE POLICY "Users can update own extended info" ON client_extended_info
  FOR UPDATE USING (auth.uid() = user_id);

-- Los admins pueden ver todo (se puede ajustar según necesidad)
-- CREATE POLICY "Admins can view all extended info" ON client_extended_info
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles
--       WHERE id = auth.uid() AND role = 'admin'
--     )
--   );

-- Insertar tarifario inicial
INSERT INTO service_pricing (service_name, service_code, description, base_price, category) VALUES
  ('Inicio de Actividades', 'inicio_actividades', 'Tramitación completa de inicio de actividades en el SII', 35000.00, 'inicio_actividades'),
  ('Declaración F29 (IVA)', 'declaracion_f29', 'Declaración mensual de IVA (F29)', 15000.00, 'declaraciones'),
  ('Declaración Sin Movimiento', 'declaracion_sin_movimiento', 'Declaración F29 sin movimiento', 5000.00, 'declaraciones'),
  ('Consulta Tributaria', 'consulta_tributaria', 'Consulta y asesoría tributaria', 20000.00, 'consultoria'),
  ('Actualización de Datos', 'actualizacion_datos', 'Actualización de datos en el SII', 10000.00, 'tramites'),
  ('Certificado de Deuda', 'certificado_deuda', 'Obtención de certificado de deuda', 8000.00, 'tramites'),
  ('Carpeta Tributaria', 'carpeta_tributaria', 'Obtención de carpeta tributaria electrónica', 5000.00, 'tramites')
ON CONFLICT (service_code) DO NOTHING;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_service_pricing_updated_at BEFORE UPDATE ON service_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_extended_info_updated_at BEFORE UPDATE ON client_extended_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

