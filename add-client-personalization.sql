-- Script para agregar campos de personalización del cliente
-- Apodos, información legal de empresas, etc.

-- Agregar campos a client_info para apodos y nombre preferido
ALTER TABLE client_info 
ADD COLUMN IF NOT EXISTS preferred_name TEXT, -- Nombre preferido o apodo
ADD COLUMN IF NOT EXISTS use_formal_address BOOLEAN DEFAULT true; -- Si usar "Don" o no

-- Agregar campos a client_extended_info para información legal de empresas
ALTER TABLE client_extended_info
ADD COLUMN IF NOT EXISTS legal_info JSONB DEFAULT '{}'; -- Información legal: inicio de actividades, RUT empresa, etc.

-- Crear índice para búsquedas por nombre preferido
CREATE INDEX IF NOT EXISTS idx_client_info_preferred_name ON client_info(preferred_name);

-- Comentarios para documentación
COMMENT ON COLUMN client_info.preferred_name IS 'Nombre preferido o apodo del cliente para uso en conversaciones';
COMMENT ON COLUMN client_info.use_formal_address IS 'Si es true, usar "Don" antes del nombre. Si es false, usar solo el nombre o apodo';
COMMENT ON COLUMN client_extended_info.legal_info IS 'Información legal de la empresa: inicio_actividades, rut_empresa, razon_social, etc.';

