-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rut TEXT NOT NULL,
    razon_social TEXT NOT NULL,
    nombre_fantasia TEXT,
    giro TEXT,
    direccion TEXT,
    contacto_nombre TEXT,
    contacto_email TEXT,
    contacto_fono TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own companies" ON companies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies" ON companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies" ON companies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies" ON companies
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
