# Análisis y Propuesta: Sistema de Roles Simplificado

## Situación Actual
Actualmente existen dos capas de clasificación de usuarios:
1.  **Rol (`role`)**: Define Permisos (`admin`, `invitado`, `cliente`).
2.  **Tipo (`user_type`)**: Define "Antigüedad" o "Estado Comercial" (`invitado`, `cliente_nuevo`, `cliente_existente`).

Esta duplicidad genera confusión y complejidad innecesaria. El usuario ha solicitado simplificar esto para que el flujo sea: **Registro (Invitado) -> Admin promueve a Cliente**.

## Propuesta de Nuevo Flujo

### 1. Definición de Roles (Única Fuente de Verdad)
Eliminaremos la dependencia crítica de `UserType` para la lógica de negocio, basándonos solo en `Role`.

| Rol | Descripción | Acceso |
| :--- | :--- | :--- |
| **`invitado`** | Usuario nuevo registrado (Google o Anónimo). | Chat Básico, Bienvenida General. |
| **`cliente`** | Usuario verificado por la empresa. | Chat Completo, Documentos, Reuniones, Historial. |
| **`admin`** | Administrador del sistema. | Panel de Control Total. |

### 2. Ciclo de Vida del Usuario (Simplificado)

1.  **Ingreso**: Todo usuario nuevo entra automáticamente como **`invitado`**.
2.  **Conversión**:
    *   El usuario interactúa con el chat.
    *   Si se convierte en cliente real, el **Administrador** accede al Panel de Admin.
    *   Busca al usuario y cambia su rol de `invitado` a `cliente`.
3.  **Experiencia**:
    *   Al recargar, el usuario ahora ve la interfaz completa de Cliente (Menú de clientes, solicitudes, etc.).

### 3. Cambios Requeridos en el Sistema

#### A. Base de Datos (Ya preparados/realizados)
*   La tabla `user_profiles` ya soporta `invitado`, `cliente`, `admin`.
*   Constraint Check: Asegurar que `role` acepte `cliente`.

#### B. Panel de Administración (`AdminPanel.tsx`)
*   **Corrección**: El dropdown de edición de usuario muestra actualmente `Usuario` (legacy 'user'). Debe mostrar:
    *   `Invitado`
    *   `Cliente`
    *   `Administrador`
*   **Logro**: Esto permitirá al administrador "ascender" a los usuarios con un solo clic.

#### C. Tipos y Frontend (`user_type` como metadato opcional)
*   Podemos mantener `user_type` solo para diferenciar el *mensaje de bienvenida* ("Bienvenido nuevo cliente" vs "Bienvenido de nuevo"), pero **no para permisos**.
*   Si el admin cambia el rol a `cliente`, el sistema podría auto-asignar `cliente_existente` internamente, pero eso es transparente para la lógica de seguridad.

## Conclusión
Este modelo cumple exactamente con el requerimiento: *"Yo desde mi panel de administrador podria cambiarle el rol"*. Simplifica la gestión y elimina la ambigüedad de "¿Soy cliente nuevo o existente?".
