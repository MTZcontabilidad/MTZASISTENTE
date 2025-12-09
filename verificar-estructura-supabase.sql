-- ============================================
-- SCRIPT DE VERIFICACIÓN DE ESTRUCTURA SUPABASE
-- ============================================
-- Ejecuta este script en el SQL Editor de Supabase para verificar
-- que todas las tablas, funciones, triggers y políticas estén correctas

-- ============================================
-- 1. VERIFICAR TABLAS
-- ============================================
SELECT 
  'TABLAS' as tipo,
  table_name as nombre,
  CASE 
    WHEN table_name IN ('user_profiles', 'messages', 'conversations', 'user_memories', 'client_info', 'company_info', 'faq_responses')
    THEN '✅ Existe'
    ELSE '⚠️ Tabla adicional'
  END as estado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- 2. VERIFICAR FUNCIONES
-- ============================================
SELECT 
  'FUNCIONES' as tipo,
  routine_name as nombre,
  CASE 
    WHEN routine_name IN ('is_admin', 'handle_new_user', 'update_last_login', 'ensure_active_conversation', 'get_active_conversation', 'update_updated_at_column', 'update_company_info_updated_at')
    THEN '✅ Existe'
    ELSE '⚠️ Función adicional'
  END as estado
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================
-- 3. VERIFICAR TRIGGERS
-- ============================================
SELECT 
  'TRIGGERS' as tipo,
  trigger_name as nombre,
  event_object_table as tabla,
  CASE 
    WHEN trigger_name IN ('on_auth_user_created', 'on_auth_user_login', 'on_user_profile_created', 'ensure_conversation_on_message', 'update_conversations_updated_at', 'update_user_memories_updated_at', 'update_client_info_updated_at', 'update_company_info_timestamp', 'update_faq_responses_timestamp')
    THEN '✅ Existe'
    ELSE '⚠️ Trigger adicional'
  END as estado
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 4. VERIFICAR POLÍTICAS RLS
-- ============================================
SELECT 
  'POLÍTICAS RLS' as tipo,
  schemaname || '.' || tablename as tabla,
  policyname as nombre,
  CASE 
    WHEN policyname LIKE '%is_admin%' OR policyname LIKE '%public.is_admin%'
    THEN '✅ Usa is_admin() (correcto)'
    WHEN policyname LIKE '%user_profiles%' AND policyname LIKE '%admin%'
    THEN '⚠️ Posible recursión'
    ELSE '✅ Política estándar'
  END as estado
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 5. VERIFICAR ÍNDICES
-- ============================================
SELECT 
  'ÍNDICES' as tipo,
  tablename as tabla,
  indexname as nombre,
  CASE 
    WHEN indexname LIKE 'idx_%' OR indexname LIKE 'idx_company_info_singleton'
    THEN '✅ Índice correcto'
    ELSE '⚠️ Índice adicional'
  END as estado
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'messages', 'conversations', 'user_memories', 'client_info', 'company_info', 'faq_responses')
ORDER BY tablename, indexname;

-- ============================================
-- 6. VERIFICAR VISTAS
-- ============================================
SELECT 
  'VISTAS' as tipo,
  table_name as nombre,
  CASE 
    WHEN table_name = 'conversation_summary'
    THEN '✅ Existe'
    ELSE '⚠️ Vista adicional'
  END as estado
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 7. VERIFICAR RLS HABILITADO
-- ============================================
SELECT 
  'RLS STATUS' as tipo,
  schemaname || '.' || tablename as tabla,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Habilitado'
    ELSE '❌ RLS Deshabilitado'
  END as estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'messages', 'conversations', 'user_memories', 'client_info', 'company_info', 'faq_responses')
ORDER BY tablename;

-- ============================================
-- 8. CONTAR REGISTROS (para verificar uso)
-- ============================================
SELECT 
  'REGISTROS' as tipo,
  'user_profiles' as tabla,
  COUNT(*)::text as cantidad
FROM user_profiles
UNION ALL
SELECT 
  'REGISTROS',
  'messages',
  COUNT(*)::text
FROM messages
UNION ALL
SELECT 
  'REGISTROS',
  'conversations',
  COUNT(*)::text
FROM conversations
UNION ALL
SELECT 
  'REGISTROS',
  'user_memories',
  COUNT(*)::text
FROM user_memories
UNION ALL
SELECT 
  'REGISTROS',
  'client_info',
  COUNT(*)::text
FROM client_info
UNION ALL
SELECT 
  'REGISTROS',
  'company_info',
  COUNT(*)::text
FROM company_info
UNION ALL
SELECT 
  'REGISTROS',
  'faq_responses',
  COUNT(*)::text
FROM faq_responses;

-- ============================================
-- 9. VERIFICAR TAMAÑO DE TABLAS (estimado)
-- ============================================
SELECT 
  'TAMAÑO' as tipo,
  schemaname || '.' || tablename as tabla,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamaño
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'messages', 'conversations', 'user_memories', 'client_info', 'company_info', 'faq_responses')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- 10. VERIFICAR PROBLEMAS POTENCIALES
-- ============================================
SELECT 
  'PROBLEMAS' as tipo,
  'Políticas RLS con recursión potencial' as problema,
  COUNT(*)::text as cantidad
FROM pg_policies
WHERE schemaname = 'public'
  AND (policyname LIKE '%user_profiles%' AND policyname LIKE '%admin%')
  AND policyname NOT LIKE '%is_admin%'
  AND policyname NOT LIKE '%public.is_admin%';
