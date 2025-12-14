-- ==============================================================================
-- SCRIPT DE DATOS DE PRUEBA (MOCK DATA)
-- Este script inserta datos simulados para probar la Inteligencia Artificial.
-- ID del Usuario de Prueba: 'test-user-001' (Simulado)
-- ==============================================================================

-- 1. Limpiar datos previos si existen
DELETE FROM public.client_extended_info WHERE user_id = 'test-user-001';
DELETE FROM public.user_memories WHERE user_id = 'test-user-001';
DELETE FROM public.client_info WHERE user_id = 'test-user-001';

-- 2. Crear información básica del cliente
INSERT INTO public.client_info (user_id, company_name, preferred_name, phone)
VALUES (
    'test-user-001',
    'Transportes Rápidos SPA',
    'Juan Pérez',
    '+56912345678'
);

-- 3. Crear información extendida (Estado Tributario)
INSERT INTO public.client_extended_info (
    user_id, 
    iva_declaration_status, 
    outstanding_balance, 
    business_activity,
    monthly_revenue_range
)
VALUES (
    'test-user-001',
    'atrasado',        -- Tiene IVA pendiente
    500000,            -- Debe $500.000
    'Transporte de Carga',
    '50_200'           -- Vende entre 50 y 200 millones
);

-- 4. Insertar Memorias "Aprendidas" (Simulando aprendizaje previo)
INSERT INTO public.user_memories (user_id, memory_type, content, importance)
VALUES 
    ('test-user-001', 'preference', 'El usuario prefiere que lo traten de "tú" y no de "usted".', 6),
    ('test-user-001', 'fact', 'Suele tener problemas de liquidez a fin de mes.', 8),
    ('test-user-001', 'fact', 'Tiene 3 camiones y 2 choferes.', 5);

-- ==============================================================================
-- CÓMO USAR:
-- 1. Ejecuta este script en el SQL Editor de Supabase.
-- 2. En la aplicación, abre la consola del navegador y escribe:
--    localStorage.setItem('MTZ_DEBUG_USER', JSON.stringify({id: 'test-user-001', email: 'test@mtz.cl'}));
-- 3. Recarga la página. Ahora eres "Juan Pérez" y la IA debería saber tus datos.
-- ==============================================================================
