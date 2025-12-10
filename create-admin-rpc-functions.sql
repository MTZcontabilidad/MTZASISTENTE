-- Funciones RPC para administradores
-- Estas funciones permiten a los administradores acceder a todos los datos
-- incluso con RLS activo, resolviendo el problema de "column reference 'id' is ambiguous"

-- Función para obtener todos los usuarios (para administradores)
CREATE OR REPLACE FUNCTION get_all_users_for_admin()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  user_type TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  avatar_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario es administrador
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: Solo administradores pueden acceder';
  END IF;

  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.user_type,
    up.is_active,
    up.created_at,
    up.updated_at,
    up.avatar_url
  FROM user_profiles up
  ORDER BY up.created_at DESC;
END;
$$;

-- Función para obtener todas las reuniones (para administradores)
CREATE OR REPLACE FUNCTION get_all_meetings_for_admin()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  meeting_date TIMESTAMPTZ,
  duration_minutes INTEGER,
  status TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  user_email TEXT,
  user_full_name TEXT,
  company_name TEXT,
  client_phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario es administrador
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: Solo administradores pueden acceder';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.user_id,
    m.title,
    m.description,
    m.meeting_date,
    m.duration_minutes,
    m.status,
    m.admin_notes,
    m.created_at,
    m.updated_at,
    m.approved_at,
    m.approved_by,
    up.email::TEXT as user_email,
    up.full_name::TEXT as user_full_name,
    ci.company_name::TEXT as company_name,
    ci.phone::TEXT as client_phone
  FROM meetings m
  LEFT JOIN user_profiles up ON m.user_id = up.id
  LEFT JOIN client_info ci ON m.user_id = ci.user_id
  ORDER BY m.created_at DESC;
END;
$$;

-- Función para obtener todas las solicitudes de transporte (para administradores)
CREATE OR REPLACE FUNCTION get_all_transport_requests_for_admin()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  conversation_id UUID,
  passenger_name TEXT,
  passenger_phone TEXT,
  passenger_email TEXT,
  passenger_rut TEXT,
  passenger_age INTEGER,
  has_mobility_aid BOOLEAN,
  mobility_aid_type TEXT,
  mobility_aid_description TEXT,
  special_needs TEXT,
  companion_name TEXT,
  companion_phone TEXT,
  companion_relationship TEXT,
  trip_type TEXT,
  origin_address TEXT,
  destination_address TEXT,
  trip_date TEXT,
  trip_time TEXT,
  return_date TEXT,
  return_time TEXT,
  trip_purpose TEXT,
  trip_purpose_description TEXT,
  estimated_duration INTEGER,
  number_of_passengers INTEGER,
  requires_assistance BOOLEAN,
  assistance_type TEXT,
  status TEXT,
  admin_notes TEXT,
  confirmed_date TEXT,
  confirmed_time TEXT,
  confirmed_by UUID,
  confirmed_at TIMESTAMPTZ,
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario es administrador
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: Solo administradores pueden acceder';
  END IF;

  RETURN QUERY
  SELECT 
    tr.id,
    tr.user_id,
    tr.conversation_id,
    tr.passenger_name,
    tr.passenger_phone,
    tr.passenger_email,
    tr.passenger_rut,
    tr.passenger_age,
    tr.has_mobility_aid,
    tr.mobility_aid_type,
    tr.mobility_aid_description,
    tr.special_needs,
    tr.companion_name,
    tr.companion_phone,
    tr.companion_relationship,
    tr.trip_type,
    tr.origin_address,
    tr.destination_address,
    tr.trip_date,
    tr.trip_time,
    tr.return_date,
    tr.return_time,
    tr.trip_purpose,
    tr.trip_purpose_description,
    tr.estimated_duration,
    tr.number_of_passengers,
    tr.requires_assistance,
    tr.assistance_type,
    tr.status,
    tr.admin_notes,
    tr.confirmed_date,
    tr.confirmed_time,
    tr.confirmed_by,
    tr.confirmed_at,
    tr.estimated_cost,
    tr.actual_cost,
    tr.metadata,
    tr.created_at,
    tr.updated_at
  FROM transport_requests tr
  ORDER BY tr.created_at DESC;
END;
$$;

-- Función para obtener todas las solicitudes del taller (para administradores)
CREATE OR REPLACE FUNCTION get_all_wheelchair_requests_for_admin()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  conversation_id UUID,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  client_address TEXT,
  wheelchair_type TEXT,
  wheelchair_brand TEXT,
  wheelchair_model TEXT,
  wheelchair_condition TEXT,
  service_type TEXT,
  service_description TEXT,
  is_urgent BOOLEAN,
  preferred_date TEXT,
  preferred_time TEXT,
  location TEXT,
  address_if_domicilio TEXT,
  status TEXT,
  admin_notes TEXT,
  confirmed_date TEXT,
  confirmed_time TEXT,
  confirmed_by UUID,
  confirmed_at TIMESTAMPTZ,
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario es administrador
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: Solo administradores pueden acceder';
  END IF;

  RETURN QUERY
  SELECT 
    wr.id,
    wr.user_id,
    wr.conversation_id,
    wr.client_name,
    wr.client_phone,
    wr.client_email,
    wr.client_address,
    wr.wheelchair_type,
    wr.wheelchair_brand,
    wr.wheelchair_model,
    wr.wheelchair_condition,
    wr.service_type,
    wr.service_description,
    wr.is_urgent,
    wr.preferred_date,
    wr.preferred_time,
    wr.location,
    wr.address_if_domicilio,
    wr.status,
    wr.admin_notes,
    wr.confirmed_date,
    wr.confirmed_time,
    wr.confirmed_by,
    wr.confirmed_at,
    wr.estimated_cost,
    wr.actual_cost,
    wr.metadata,
    wr.created_at,
    wr.updated_at
  FROM wheelchair_workshop_requests wr
  ORDER BY wr.created_at DESC;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION get_all_users_for_admin() IS 'Obtiene todos los usuarios para administradores';
COMMENT ON FUNCTION get_all_meetings_for_admin() IS 'Obtiene todas las reuniones para administradores con información de usuarios y clientes';
COMMENT ON FUNCTION get_all_transport_requests_for_admin() IS 'Obtiene todas las solicitudes de transporte para administradores';
COMMENT ON FUNCTION get_all_wheelchair_requests_for_admin() IS 'Obtiene todas las solicitudes del taller para administradores';

