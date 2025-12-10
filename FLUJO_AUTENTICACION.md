# 🔐 Flujo de Autenticación y Routing

## 📋 Resumen del Flujo

Cuando un usuario ingresa por primera vez con su Gmail, el sistema sigue este flujo:

### 1. **Punto de Entrada: `Auth.tsx`**
   - Usuario hace clic en "Iniciar sesión con Google"
   - Se redirige a Google OAuth
   - Google redirige de vuelta a la app con el token

### 2. **Verificación de Sesión: `App.tsx`**
   - `checkUser()` verifica si hay sesión activa
   - Si hay sesión, llama a `loadUserProfile(userId)`

### 3. **Carga del Perfil: `loadUserProfile()` en `App.tsx`**

#### Paso 3.1: Verificar si es Admin
```typescript
// Línea 112-124: Busca en user_profiles si el usuario tiene role = 'admin'
const { data: profile } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('id', userId)
  .maybeSingle()
if (profile?.role === 'admin') {
  isAdmin = true
}
```

#### Paso 3.2: Buscar Perfil Existente
```typescript
// Línea 129-145: Intenta obtener el perfil completo
const profileData = await supabase
  .from('user_profiles')
  .select('id, email, role, user_type')
  .eq('id', userId)
  .maybeSingle()
```

#### Paso 3.3: Si NO existe perfil (Usuario Nuevo)
```typescript
// Línea 170-181: Crea un perfil nuevo con:
{
  id: userId,
  email: userEmail,
  full_name: authUser.user_metadata?.full_name || userEmail.split('@')[0],
  avatar_url: authUser.user_metadata?.avatar_url || null,
  role: isAdmin ? 'admin' : 'invitado',  // ⚠️ Por defecto: 'invitado'
  user_type: 'invitado'                  // ⚠️ Por defecto: 'invitado'
}
```

#### Paso 3.4: Si SÍ existe perfil
```typescript
// Línea 189-220: Usa los datos del perfil existente
const userData = {
  id: profileData.id,
  email: profileData.email,
  role: profileData.role,        // 'admin' | 'invitado' | 'cliente' | 'inclusion'
  user_type: profileData.user_type // 'invitado' | 'cliente_nuevo' | 'cliente_existente' | 'inclusion'
}
```

### 4. **Determinación del Panel a Mostrar**

#### Línea 213-219: Si es Admin
```typescript
if (userRole === 'admin') {
  setShowAdminPanel(true)  // ✅ Va directo al AdminPanel
} else {
  setShowAdminPanel(false)  // ✅ Va al ChatInterface
}
```

#### Línea 855-859: Renderizado Final
```typescript
{showAdminPanel && user.role === 'admin' ? (
  <AdminPanel onLogout={handleLogout} />  // Panel de administración
) : (
  <ChatInterface />                        // Chat normal
)}
```

## 🎯 Roles Disponibles

Según `src/types/index.ts`:

```typescript
export type UserRole = 'admin' | 'invitado' | 'cliente' | 'inclusion'
export type UserType = 'invitado' | 'cliente_nuevo' | 'cliente_existente' | 'inclusion'
```

## 📊 Flujo Visual

```
Usuario ingresa con Gmail
        ↓
Auth.tsx → signInWithOAuth('google')
        ↓
Google OAuth → Redirige a la app
        ↓
App.tsx → checkUser() → loadUserProfile()
        ↓
¿Existe perfil en user_profiles?
    ├─ NO → Crear perfil con role='invitado', user_type='invitado'
    └─ SÍ → Usar perfil existente
        ↓
¿role === 'admin'?
    ├─ SÍ → showAdminPanel = true → AdminPanel
    └─ NO → showAdminPanel = false → ChatInterface
```

## ⚠️ Puntos Importantes

1. **Por Defecto**: Los usuarios nuevos se crean con `role='invitado'` y `user_type='invitado'`

2. **Para ser Admin**: El rol debe estar configurado manualmente en la base de datos:
   ```sql
   UPDATE user_profiles 
   SET role = 'admin' 
   WHERE email = 'usuario@ejemplo.com';
   ```

3. **Panel de Admin**: Solo se muestra si:
   - `user.role === 'admin'` Y
   - `showAdminPanel === true`

4. **ChatInterface**: Se muestra para todos los demás roles:
   - `invitado`
   - `cliente`
   - `inclusion`

5. **Welcome de Invitado**: Ya NO se muestra (línea 101-102, 167, 220, 264, 316, 728)
   - Los usuarios van directo al chat

## 🔧 Cómo Cambiar el Rol de un Usuario

### Opción 1: Desde la Base de Datos
```sql
-- Hacer admin
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'usuario@gmail.com';

-- Hacer cliente
UPDATE user_profiles 
SET role = 'cliente', user_type = 'cliente_existente' 
WHERE email = 'usuario@gmail.com';
```

### Opción 2: Desde el AdminPanel (si eres admin)
- Ir a la sección "Usuarios"
- Buscar el usuario
- Cambiar su rol

## 📝 Tabla: user_profiles

Campos relevantes:
- `id`: UUID del usuario (mismo que auth.users.id)
- `email`: Email del usuario
- `role`: 'admin' | 'invitado' | 'cliente' | 'inclusion'
- `user_type`: 'invitado' | 'cliente_nuevo' | 'cliente_existente' | 'inclusion'
- `full_name`: Nombre completo
- `avatar_url`: URL del avatar

## 🎨 Diferentes Pantallas Según el Rol

| Rol | Panel Mostrado | Descripción |
|-----|----------------|-------------|
| `admin` | `AdminPanel` | Panel completo de administración |
| `invitado` | `ChatInterface` | Chat normal, acceso limitado |
| `cliente` | `ChatInterface` | Chat con acceso a servicios |
| `inclusion` | `ChatInterface` | Chat con acceso a inclusión |

