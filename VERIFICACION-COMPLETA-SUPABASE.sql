-- ============================================
-- SCRIPT DE VERIFICACIÓN COMPLETA DE SUPABASE
-- Ejecuta este script para verificar que todo esté correcto
-- ============================================

-- 1. VERIFICAR QUE TODAS LAS TABLAS EXISTAN
DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  table_name TEXT;
  required_tables TEXT[] := ARRAY[
    'user_profiles',
    'messages',
    'conversations',
    'user_memories',
    'client_info',
    'company_info',
    'faq_responses'
  ];
BEGIN
  FOREACH table_name IN ARRAY required_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      missing_tables := array_append(missing_tables, table_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE NOTICE '⚠️ TABLAS FALTANTES: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✅ Todas las tablas requeridas existen';
  END IF;
END $$;

-- 2. VERIFICAR FUNCIÓN is_admin()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE NOTICE '⚠️ Función is_admin() no existe. Debe existir para que las políticas RLS funcionen correctamente.';
  ELSE
    RAISE NOTICE '✅ Función is_admin() existe';
  END IF;
END $$;

-- 3. VERIFICAR POLÍTICAS RLS ACTIVAS
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Activado'
    ELSE '⚠️ RLS Desactivado'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'messages',
  'conversations',
  'user_memories',
  'client_info',
  'company_info',
  'faq_responses'
)
ORDER BY tablename;

-- 4. CONTAR POLÍTICAS POR TABLA
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ Sin políticas'
    WHEN COUNT(*) < 3 THEN '⚠️ Pocas políticas'
    ELSE '✅ Políticas OK'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'messages',
  'conversations',
  'user_memories',
  'client_info',
  'company_info',
  'faq_responses'
)
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 5. VERIFICAR ÍNDICES IMPORTANTES
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'messages',
  'conversations',
  'user_memories',
  'client_info',
  'company_info',
  'faq_responses'
)
ORDER BY tablename, indexname;

-- 6. VERIFICAR TRIGGERS
SELECT 
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event,
  action_timing as timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN (
  'user_profiles',
  'messages',
  'conversations',
  'user_memories',
  'client_info',
  'company_info',
  'faq_responses'
)
ORDER BY event_object_table, trigger_name;

-- 7. VERIFICAR FOREIGN KEYS
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN (
  'user_profiles',
  'messages',
  'conversations',
  'user_memories',
  'client_info',
  'company_info',
  'faq_responses'
)
ORDER BY tc.table_name;

-- 8. VERIFICAR COLUMNAS REQUERIDAS
DO $$
DECLARE
  missing_columns TEXT;
BEGIN
  -- Verificar user_type en user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'user_type'
  ) THEN
    RAISE NOTICE '⚠️ Columna user_type falta en user_profiles';
  ELSE
    RAISE NOTICE '✅ Columna user_type existe en user_profiles';
  END IF;
  
  -- Verificar conversation_id en messages
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'conversation_id'
  ) THEN
    RAISE NOTICE '⚠️ Columna conversation_id falta en messages';
  ELSE
    RAISE NOTICE '✅ Columna conversation_id existe en messages';
  END IF;
END $$;

-- 9. VERIFICAR DATOS DE EJEMPLO
SELECT 
  'user_profiles' as tabla,
  COUNT(*) as registros,
  COUNT(*) FILTER (WHERE role = 'admin') as admins,
  COUNT(*) FILTER (WHERE user_type = 'invitado') as invitados
FROM user_profiles
UNION ALL
SELECT 
  'conversations',
  COUNT(*),
  COUNT(*) FILTER (WHERE is_active = true) as activas,
  0
FROM conversations
UNION ALL
SELECT 
  'messages',
  COUNT(*),
  COUNT(*) FILTER (WHERE sender = 'user') as user_messages,
  COUNT(*) FILTER (WHERE sender = 'assistant') as assistant_messages
FROM messages
UNION ALL
SELECT 
  'client_info',
  COUNT(*),
  0,
  0
FROM client_info
UNION ALL
SELECT 
  'company_info',
  COUNT(*),
  0,
  0
FROM company_info
UNION ALL
SELECT 
  'faq_responses',
  COUNT(*),
  COUNT(*) FILTER (WHERE is_active = true) as activas,
  0
FROM faq_responses;

-- 10. VERIFICAR ADMINISTRADOR
SELECT 
  id,
  email,
  role,
  user_type,
  created_at,
  last_login,
  CASE 
    WHEN email = 'mtzcontabilidad@gmail.com' AND role = 'admin' THEN '✅ Admin configurado correctamente'
    WHEN email = 'mtzcontabilidad@gmail.com' AND role != 'admin' THEN '⚠️ Email correcto pero no es admin'
    ELSE '⚠️ Email admin no encontrado'
  END as status
FROM user_profiles
WHERE email = 'mtzcontabilidad@gmail.com';

-- RESUMEN FINAL
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN COMPLETA FINALIZADA';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Revisa los resultados arriba.';
  RAISE NOTICE 'Si hay advertencias (⚠️), ejecuta los scripts correspondientes:';
  RAISE NOTICE '  - fix-all-rls-policies.sql (para políticas RLS)';
  RAISE NOTICE '  - Scripts de setup ya aplicados (tablas creadas)';
  RAISE NOTICE '';
END $$;
