# Análisis del Sistema de Autenticación y Ciclo de Vida del Usuario

## 1. Visión General
El sistema utiliza **Supabase Auth** para la identidad y una tabla personalizada `public.user_profiles` para gestionar roles y datos específicos de la aplicación.

## 2. Ciclo de Vida del Usuario

### A. Ingreso (Login/Registro)
Existen dos métodos de ingreso verificados:
1.  **Google OAuth**: Autenticación estándar.
2.  **Invitado (Anónimo)**: Utiliza `signInAnonymously()` de Supabase.

### B. Creación de Perfil (Backend)
Cuando un usuario se crea en `auth.users`, un **Trigger (`on_auth_user_created`)** ejecuta la función `handle_new_user`.
*   **Comportamiento Actual (Sujeto a Corrección):**
    *   Si es anónimo: Asigna rol `'user'` (⚠️ Discrepancia con Frontend).
    *   Si es email: Asigna rol `'user'` por defecto.
    *   Tipo de usuario: Asigna `'invitado'` por defecto.

### C. Consumo Frontend (`AuthContext`)
1.  Detecta la sesión.
2.  Busca el perfil en `user_profiles`.
3.  Si no existe (posible latencia del trigger): Intenta crear un perfil básico desde el cliente.
4.  Carga el usuario en el estado global.

## 3. Discrepancias Detectadas (Frontend vs Backend)

| Característica | Frontend (TypeScript) | Backend (Base de Datos) | Estado |
| :--- | :--- | :--- | :--- |
| **Rol (Default)** | `'invitado'` | `'user'` | ❌ **CRÍTICO** |
| **Roles Válidos** | `admin`, `cliente`, `invitado` | `user`, `admin`, `invitado`, `cliente`, `inclusion` | ⚠️ Sucio |
| **Tipos Válidos** | `invitado`, `cliente_...` | `..., inclusion` | ⚠️ Sucio |

**Implicancia:**
Un usuario nuevo (Google o Anónimo) recibe el rol `'user'`. El frontend, al esperar `'invitado'`, podría fallar en validaciones estrictas (`user.role === 'invitado'`), rompiendo el flujo de bienvenida o acceso a menús.

## 4. Estructura de Rutas y Permisos

*   **Ruta Raíz (`/`)**: 
    *   Si `!user`: Muestra `Auth` o `DevModeSelector`.
    *   Si `user`:
        *   `role == 'admin'` -> `AdminPanel`
        *   `role == 'invitado'` -> `InvitadoWelcome` (si no lo ha completado) -> `ChatInterface`
        *   `role == 'cliente'` -> `ChatInterface`

## 5. Acciones Realizadas (Mantenimiento)

1.  **Migración SQL (Completada)**: 
    *   ✅ Se estandarizaron los roles en DB: `'user'` ahora es `'invitado'`.
    *   ✅ Se eliminaron roles obsoletos: Referencias a `inclusion` fueron migradas.
    *   ✅ Se actualizó la función trigger (`handle_new_user`) para asignar `'invitado'` por defecto.
    *   ✅ Se aplicaron Constraints estrictos en `role` (`admin`, `cliente`, `invitado`) y `user_type`.

## 6. Recomendaciones para Pruebas

El sistema está ahora alineado entre Frontend y Backend.
*   **Para probar como usuario real:**
    *   Usa el botón "Ingresar como Invitado" en la pantalla de login.
    *   Esto creará un usuario real en Auth y un perfil `'invitado'` en DB.
    *   Verifica que el chat cargue y que aparezca el menú de bienvenida de invitados.

