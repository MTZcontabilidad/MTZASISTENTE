# Configuración de Supabase para MTZ Asistente

## Pasos para configurar Google OAuth

### 1. Configurar Google OAuth en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** > **Credentials**
4. Haz clic en **Create Credentials** > **OAuth client ID**
5. Selecciona **Web application**
6. Agrega las siguientes URLs autorizadas:
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (desarrollo)
     - `https://tu-dominio.vercel.app` (producción)
   - **Authorized redirect URIs**:
     - `https://lcskqvadolwqcrqhxfvz.supabase.co/auth/v1/callback`
7. Copia el **Client ID** y **Client Secret**

### 2. Configurar en Supabase

1. Ve a tu proyecto en Supabase: https://lcskqvadolwqcrqhxfvz.supabase.co
2. Ve a **Authentication** > **Providers**
3. Habilita **Google**
4. Ingresa el **Client ID** y **Client Secret** de Google
5. Guarda los cambios

### 3. Ejecutar el SQL de configuración

1. Ve al **SQL Editor** en Supabase
2. Ejecuta el contenido del archivo `supabase-setup.sql`
3. Esto creará:
   - Tabla `messages` con relación a usuarios
   - Tabla `user_profiles` con roles
   - Asignación de `mtzcontabilidad@gmail.com` como administrador
   - Políticas de seguridad (RLS)
   - Triggers para crear perfiles automáticamente

### 4. Verificar configuración

- El email `mtzcontabilidad@gmail.com` será automáticamente asignado como administrador
- Los usuarios que inicien sesión con Google tendrán rol de "user" por defecto
- Solo los administradores pueden ver el panel de administración

## Notas importantes

- Asegúrate de que la URL de redirección en Supabase coincida con la configurada en Google Cloud Console
- El primer usuario con `mtzcontabilidad@gmail.com` será asignado como admin automáticamente
- Los perfiles de usuario se crean automáticamente al iniciar sesión por primera vez

