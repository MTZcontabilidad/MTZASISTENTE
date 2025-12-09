# 📅 Sistema de Agendamiento de Reuniones

## ✅ Implementación Completada

Se ha agregado un sistema completo de agendamiento de reuniones a tu aplicación MTZ Asistente. El sistema permite:

- ✅ Los usuarios pueden solicitar reuniones
- ✅ Las reuniones aparecen con estado "En espera de confirmación"
- ✅ Los administradores pueden aprobar o rechazar reuniones desde el panel de administración
- ✅ Los usuarios pueden ver el estado de sus reuniones
- ✅ Los usuarios pueden cancelar sus propias reuniones pendientes

## 🗄️ Paso 1: Aplicar Script SQL en Supabase

**IMPORTANTE**: Debes ejecutar el script SQL en tu base de datos de Supabase antes de usar el sistema.

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Navega a **SQL Editor** en el menú lateral
3. Abre el archivo `create-meetings-table.sql` que se creó en la raíz del proyecto
4. Copia todo el contenido del archivo
5. Pégalo en el editor SQL de Supabase
6. Haz clic en **Run** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

El script creará:
- La tabla `meetings` con todos los campos necesarios
- Índices para mejorar el rendimiento
- Políticas RLS (Row Level Security) para seguridad
- Funciones y triggers automáticos

## 🎯 Funcionalidades

### Para Usuarios

1. **Agendar una Reunión**:
   - Haz clic en el botón 📅 en la barra de acciones del chat
   - O escribe en el chat: "quiero agendar una reunión"
   - O usa el botón "Agendar Reunión" en Accesos Rápidos
   - Completa el formulario con:
     - Título de la reunión
     - Descripción (opcional)
     - Fecha y hora
     - Duración (15 min, 30 min, 45 min, 1 hora, etc.)

2. **Ver Mis Reuniones**:
   - Haz clic en el botón 📅 en la barra de acciones
   - Verás todas tus reuniones con su estado:
     - ⏳ **En espera de confirmación** (pendiente)
     - ✅ **Confirmada** (aprobada por admin)
     - ❌ **Rechazada** (rechazada por admin)
     - 🚫 **Cancelada** (cancelada por ti)
     - ✓ **Completada** (reunión ya realizada)

3. **Cancelar una Reunión**:
   - Solo puedes cancelar reuniones con estado "En espera de confirmación"
   - Haz clic en "Cancelar Reunión" en la tarjeta de la reunión

### Para Administradores

1. **Acceder a Reuniones**:
   - Ve al Panel de Administración
   - Haz clic en la pestaña **📅 Reuniones**

2. **Ver Todas las Reuniones**:
   - Verás todas las reuniones de todos los usuarios
   - Puedes filtrar por estado: Todas, Pendientes, Aprobadas, Rechazadas, Canceladas, Completadas
   - Verás un contador de reuniones pendientes en el encabezado

3. **Aprobar una Reunión**:
   - Haz clic en **✅ Aprobar** en una reunión pendiente
   - Opcionalmente, agrega notas para el usuario
   - La reunión cambiará a estado "Confirmada"

4. **Rechazar una Reunión**:
   - Haz clic en **❌ Rechazar** en una reunión pendiente
   - Opcionalmente, explica el motivo del rechazo
   - La reunión cambiará a estado "Rechazada"

## 📋 Estados de las Reuniones

- **pending**: Reunión solicitada, esperando aprobación del administrador
- **approved**: Reunión aprobada por el administrador
- **rejected**: Reunión rechazada por el administrador
- **cancelled**: Reunión cancelada por el usuario
- **completed**: Reunión completada (puedes marcar manualmente si es necesario)

## 🔒 Seguridad

El sistema incluye políticas RLS (Row Level Security) que garantizan:

- Los usuarios solo pueden ver sus propias reuniones
- Los usuarios solo pueden crear reuniones para sí mismos
- Los usuarios solo pueden cancelar sus propias reuniones pendientes
- Los administradores pueden ver y gestionar todas las reuniones
- Los administradores pueden aprobar o rechazar cualquier reunión

## 🎨 Diseño

El sistema sigue el mismo tema visual de tu aplicación:
- Fondo oscuro con acentos azul neon
- Tarjetas con efectos de brillo
- Badges de estado con colores distintivos
- Diseño responsive para móviles

## 🐛 Solución de Problemas

### Error: "No se pueden cargar las reuniones"
- Verifica que hayas ejecutado el script SQL en Supabase
- Verifica que las políticas RLS estén activas
- Revisa la consola del navegador para ver errores específicos

### Error: "No tienes permisos para crear reuniones"
- Verifica que estés autenticado
- Verifica que tu usuario tenga un perfil en `user_profiles`

### Las reuniones no aparecen en el panel de administración
- Verifica que tu usuario tenga rol 'admin' en `user_profiles`
- Verifica que las políticas RLS permitan a los admins ver todas las reuniones

## 📝 Notas Adicionales

- Las fechas se validan para evitar reuniones en el pasado
- Los usuarios pueden ver notas del administrador en sus reuniones aprobadas o rechazadas
- El sistema registra quién aprobó cada reunión y cuándo
- Las reuniones se ordenan por fecha, mostrando las más próximas primero

## 🚀 Próximos Pasos (Opcional)

Puedes extender el sistema agregando:
- Notificaciones por email cuando se aprueba/rechaza una reunión
- Recordatorios automáticos antes de la reunión
- Integración con calendarios (Google Calendar, Outlook)
- Videollamadas integradas
- Historial de reuniones completadas

¡El sistema está listo para usar! 🎉

