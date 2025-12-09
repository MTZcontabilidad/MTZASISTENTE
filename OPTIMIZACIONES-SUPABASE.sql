-- ============================================
-- OPTIMIZACIONES Y MEJORAS PARA SUPABASE
-- Script para optimizar índices, agregar constraints y mejorar performance
-- ============================================

-- 1. OPTIMIZAR ÍNDICES EXISTENTES
-- Asegurar que todos los índices importantes existan

-- Índices para user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_lower ON user_profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_type ON user_profiles(role, user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON user_profiles(last_login DESC) WHERE last_login IS NOT NULL;

-- Índices para messages (mejorar búsquedas)
CREATE INDEX IF NOT EXISTS idx_messages_user_created ON messages(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender) WHERE sender IS NOT NULL;

-- Índices para conversations (mejorar búsquedas activas)
CREATE INDEX IF NOT EXISTS idx_conversations_user_active_updated ON conversations(user_id, is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_title_trgm ON conversations USING gin(title gin_trgm_ops);

-- Índices para user_memories (mejorar búsquedas por importancia)
CREATE INDEX IF NOT EXISTS idx_user_memories_user_type_importance ON user_memories(user_id, memory_type, importance DESC);

-- Índices para client_info (búsquedas por tags)
CREATE INDEX IF NOT EXISTS idx_client_info_company_name ON client_info(company_name) WHERE company_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_client_info_phone ON client_info(phone) WHERE phone IS NOT NULL;

-- Índices para faq_responses (búsquedas por categoría y prioridad)
CREATE INDEX IF NOT EXISTS idx_faq_responses_category_priority ON faq_responses(category, priority DESC, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_faq_responses_usage_count ON faq_responses(usage_count DESC) WHERE is_active = true;

-- 2. HABILITAR EXTENSIÓN PARA BÚSQUEDAS DE TEXTO (si no existe)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 3. AGREGAR CONSTRAINTS DE VALIDACIÓN

-- Validar formato de email en user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_email_format_check'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_email_format_check
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

-- Validar que user_type tenga valores válidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'user_profiles_user_type_check'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_user_type_check
    CHECK (user_type IN ('invitado', 'cliente_nuevo', 'cliente_existente', 'inclusion'));
  END IF;
END $$;

-- 4. AGREGAR COMENTARIOS A TABLAS Y COLUMNAS (documentación)
COMMENT ON TABLE user_profiles IS 'Perfiles de usuario con información básica y roles';
COMMENT ON COLUMN user_profiles.user_type IS 'Tipo de usuario: invitado (primera vez), cliente_nuevo (cliente recién registrado), cliente_existente (cliente con historial), inclusion (solicitante de transporte inclusivo)';
COMMENT ON COLUMN user_profiles.role IS 'Rol del usuario: user (usuario normal), admin (administrador)';

COMMENT ON TABLE conversations IS 'Conversaciones individuales por usuario. Cada usuario puede tener múltiples conversaciones';
COMMENT ON COLUMN conversations.is_active IS 'Indica si la conversación está activa. Solo una conversación activa por usuario a la vez';

COMMENT ON TABLE messages IS 'Mensajes del chat. Cada mensaje pertenece a una conversación';
COMMENT ON COLUMN messages.sender IS 'Quien envió el mensaje: user (usuario) o assistant (asistente)';

COMMENT ON TABLE user_memories IS 'Memoria del sistema sobre cada usuario. Almacena información importante para personalizar respuestas';
COMMENT ON COLUMN user_memories.importance IS 'Importancia del recuerdo (1-10). Mayor número = más importante';

COMMENT ON TABLE client_info IS 'Información adicional de clientes. Datos de contacto, empresa, notas, etc.';
COMMENT ON COLUMN client_info.tags IS 'Tags personalizados para categorizar clientes';

COMMENT ON TABLE company_info IS 'Información de la empresa MTZ. Solo debe haber un registro (singleton)';
COMMENT ON TABLE faq_responses IS 'Respuestas frecuentes (FAQs). El sistema puede usar estas respuestas automáticamente';

-- 5. CREAR VISTAS ÚTILES PARA ADMINISTRADORES

-- Vista: Resumen de usuarios con estadísticas
CREATE OR REPLACE VIEW v_user_summary AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.role,
  up.user_type,
  up.created_at,
  up.last_login,
  ci.company_name,
  ci.phone,
  COUNT(DISTINCT c.id) as conversation_count,
  COUNT(DISTINCT m.id) as message_count,
  MAX(m.created_at) as last_message_at
FROM user_profiles up
LEFT JOIN client_info ci ON up.id = ci.user_id
LEFT JOIN conversations c ON up.id = c.user_id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY up.id, up.email, up.full_name, up.role, up.user_type, up.created_at, up.last_login, ci.company_name, ci.phone;

COMMENT ON VIEW v_user_summary IS 'Vista resumen de usuarios con estadísticas de uso';

-- Vista: Estadísticas de FAQs
CREATE OR REPLACE VIEW v_faq_stats AS
SELECT 
  category,
  COUNT(*) as total_faqs,
  COUNT(*) FILTER (WHERE is_active = true) as active_faqs,
  AVG(priority) as avg_priority,
  SUM(usage_count) as total_usage,
  MAX(usage_count) as max_usage
FROM faq_responses
GROUP BY category
ORDER BY total_usage DESC;

COMMENT ON VIEW v_faq_stats IS 'Estadísticas de FAQs por categoría';

-- 6. FUNCIÓN PARA LIMPIAR CONVERSACIONES ANTIGUAS (opcional, para mantenimiento)
CREATE OR REPLACE FUNCTION cleanup_old_conversations(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Desactivar conversaciones inactivas más antiguas que days_to_keep
  UPDATE conversations
  SET is_active = false
  WHERE is_active = true
  AND updated_at < NOW() - (days_to_keep || ' days')::INTERVAL
  AND id NOT IN (
    SELECT DISTINCT conversation_id 
    FROM messages 
    WHERE created_at > NOW() - (days_to_keep || ' days')::INTERVAL
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_conversations IS 'Desactiva conversaciones inactivas más antiguas que el número de días especificado';

-- 7. FUNCIÓN PARA OBTENER ESTADÍSTICAS DEL SISTEMA
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE (
  metric_name TEXT,
  metric_value BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'total_users'::TEXT, COUNT(*)::BIGINT FROM user_profiles
  UNION ALL
  SELECT 'active_users'::TEXT, COUNT(*)::BIGINT FROM user_profiles WHERE last_login > NOW() - INTERVAL '30 days'
  UNION ALL
  SELECT 'admin_users'::TEXT, COUNT(*)::BIGINT FROM user_profiles WHERE role = 'admin'
  UNION ALL
  SELECT 'total_conversations'::TEXT, COUNT(*)::BIGINT FROM conversations
  UNION ALL
  SELECT 'active_conversations'::TEXT, COUNT(*)::BIGINT FROM conversations WHERE is_active = true
  UNION ALL
  SELECT 'total_messages'::TEXT, COUNT(*)::BIGINT FROM messages
  UNION ALL
  SELECT 'total_memories'::TEXT, COUNT(*)::BIGINT FROM user_memories
  UNION ALL
  SELECT 'total_clients'::TEXT, COUNT(*)::BIGINT FROM client_info
  UNION ALL
  SELECT 'active_faqs'::TEXT, COUNT(*)::BIGINT FROM faq_responses WHERE is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_system_stats IS 'Obtiene estadísticas generales del sistema';

-- 8. CONFIGURAR AUTO-VACUUM (optimización de PostgreSQL)
-- Esto se hace automáticamente, pero podemos verificar configuración
DO $$
BEGIN
  RAISE NOTICE 'Verificando configuración de auto-vacuum...';
  RAISE NOTICE 'Para optimizar, considera ajustar auto_vacuum_vacuum_scale_factor en configuración de Supabase';
END $$;

-- 9. CREAR FUNCIÓN PARA BUSCAR USUARIOS (búsqueda mejorada)
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  user_type TEXT,
  company_name TEXT,
  phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.user_type,
    ci.company_name,
    ci.phone
  FROM user_profiles up
  LEFT JOIN client_info ci ON up.id = ci.user_id
  WHERE 
    up.email ILIKE '%' || search_term || '%'
    OR up.full_name ILIKE '%' || search_term || '%'
    OR ci.company_name ILIKE '%' || search_term || '%'
    OR ci.phone ILIKE '%' || search_term || '%'
  ORDER BY 
    CASE 
      WHEN up.email ILIKE search_term THEN 1
      WHEN up.full_name ILIKE search_term THEN 2
      ELSE 3
    END,
    up.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_users IS 'Busca usuarios por email, nombre, empresa o teléfono';

-- RESUMEN
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OPTIMIZACIONES APLICADAS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Índices optimizados';
  RAISE NOTICE '✅ Constraints de validación agregados';
  RAISE NOTICE '✅ Comentarios de documentación agregados';
  RAISE NOTICE '✅ Vistas útiles creadas';
  RAISE NOTICE '✅ Funciones de utilidad creadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones disponibles:';
  RAISE NOTICE '  - cleanup_old_conversations(days_to_keep)';
  RAISE NOTICE '  - get_system_stats()';
  RAISE NOTICE '  - search_users(search_term)';
  RAISE NOTICE '';
  RAISE NOTICE 'Vistas disponibles:';
  RAISE NOTICE '  - v_user_summary';
  RAISE NOTICE '  - v_faq_stats';
  RAISE NOTICE '';
END $$;
