-- Tabla para reuniones/reservas
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meetings_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias reuniones
CREATE POLICY "Users can view their own meetings"
  ON meetings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden crear sus propias reuniones
CREATE POLICY "Users can create their own meetings"
  ON meetings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias reuniones (solo si están pendientes o para cancelar)
CREATE POLICY "Users can update their own pending meetings"
  ON meetings
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden cancelar sus propias reuniones
CREATE POLICY "Users can cancel their own meetings"
  ON meetings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND (status = 'cancelled' OR OLD.status = status));

-- Política: Los administradores pueden ver todas las reuniones
CREATE POLICY "Admins can view all meetings"
  ON meetings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Política: Los administradores pueden actualizar todas las reuniones (para aprobar/rechazar)
CREATE POLICY "Admins can update all meetings"
  ON meetings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Comentarios en la tabla
COMMENT ON TABLE meetings IS 'Tabla para gestionar reuniones/reservas de usuarios';
COMMENT ON COLUMN meetings.status IS 'Estado de la reunión: pending, approved, rejected, cancelled, completed';
COMMENT ON COLUMN meetings.duration_minutes IS 'Duración de la reunión en minutos';

