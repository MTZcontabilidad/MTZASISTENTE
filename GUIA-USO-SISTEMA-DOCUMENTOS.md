# 📚 Guía de Uso - Sistema de Documentos y Menús Interactivos

## 🎯 Funcionalidades Implementadas

### ✅ Sistema de Documentos
- Clientes pueden solicitar documentos por chat
- Descarga directa de documentos
- Integración con Google Scripts
- Tracking de acceso

### ✅ Menús Interactivos
- Menús con botones clickeables en el chat
- Detección automática de solicitudes
- Navegación intuitiva

---

## 👤 Para Clientes

### Cómo Solicitar un Documento

#### Opción 1: Escribir en el Chat
Escribe mensajes como:
- "Quiero descargar mi IVA"
- "Necesito el E-RUT"
- "Dame mi factura de enero 2024"
- "IVA 2024-01"

#### Opción 2: Usar el Menú Interactivo
1. Escribe "documentos" o "ayuda" en el chat
2. Aparecerá un menú con botones
3. Haz clic en el botón del documento que necesitas

### Tipos de Documentos Disponibles

- **IVA** - Declaraciones de IVA mensuales
- **E-RUT** - Certificado de RUT
- **Factura** - Facturas emitidas
- **Boleta** - Boletas emitidas
- **Declaración** - Declaraciones fiscales
- **Otro** - Otros documentos

---

## 👨‍💼 Para Administradores

### Cargar Documentos para Clientes

1. Ve al **Panel de Administración**
2. Haz clic en la pestaña **"📄 Documentos"**
3. Haz clic en **"➕ Nuevo Documento"**
4. Completa el formulario:
   - Selecciona el cliente
   - Tipo de documento
   - Nombre del documento
   - Período (opcional)
   - URL del archivo o descarga
   - URL de Google Script (opcional)
5. Haz clic en **"Guardar"**

### Asociar Google Scripts

1. En el formulario de edición de usuario
2. Agrega el campo **"Google Script URL"** o **"Dashboard URL"**
3. El sistema automáticamente creará el registro en `client_google_scripts`

### Ver Documentos de un Cliente

1. Ve a **"👥 Usuarios"** en el panel admin
2. Haz clic en **"✏️ Editar"** en el usuario
3. Ve a la pestaña **"Cliente"**
4. Puedes ver y editar los campos de Google Script

---

## 🤖 Funcionamiento del Chatbot

### Detección Automática

El chatbot detecta automáticamente cuando solicitas un documento:

**Ejemplos de mensajes que activan la detección:**
- "Quiero mi IVA"
- "Necesito el E-RUT de enero"
- "Dame la factura de 2024-01"
- "IVA enero 2024"

### Respuesta del Chatbot

1. **Si encuentra el documento:**
   - Muestra el nombre del documento
   - Proporciona un enlace de descarga directa
   - Trackea el acceso automáticamente

2. **Si no encuentra el documento:**
   - Muestra un mensaje informativo
   - Ofrece el menú de documentos
   - Sugiere contactar al administrador

3. **Si detecta solicitud de menú:**
   - Muestra el menú interactivo correspondiente
   - Botones clickeables para acciones rápidas

---

## 📋 Estructura de Datos

### Documento

```typescript
{
  id: "uuid",
  user_id: "uuid",
  document_type: "iva" | "erut" | "factura" | "boleta" | "declaracion" | "otro",
  period: "2024-01", // Opcional
  year: 2024, // Opcional
  month: 1, // Opcional (1-12)
  document_name: "IVA Enero 2024",
  file_url: "https://...", // Opcional
  download_url: "https://...", // Opcional
  google_script_url: "https://...", // Opcional
  is_active: true
}
```

### Menú Interactivo

```typescript
{
  menu_key: "documentos",
  title: "📄 Documentos Disponibles",
  options: [
    {
      id: "iva",
      label: "📊 Descargar IVA",
      action: "get_document",
      params: { type: "iva" }
    }
  ]
}
```

---

## 🔧 Configuración Avanzada

### Agregar Nuevo Tipo de Documento

1. Ve a Supabase SQL Editor
2. Ejecuta:
```sql
ALTER TABLE client_documents
DROP CONSTRAINT IF EXISTS client_documents_document_type_check;

ALTER TABLE client_documents
ADD CONSTRAINT client_documents_document_type_check
CHECK (document_type IN ('iva', 'erut', 'factura', 'boleta', 'declaracion', 'nuevo_tipo', 'otro'));
```

### Crear Nuevo Menú Interactivo

1. Ve a Supabase SQL Editor
2. Ejecuta:
```sql
INSERT INTO interactive_menus (menu_key, title, description, options, priority, triggers, is_active)
VALUES (
  'mi_menu',
  'Mi Menú',
  'Descripción del menú',
  '[{"id": "opcion1", "label": "Opción 1", "action": "show_info", "params": {}}]'::jsonb,
  5,
  ARRAY['trigger1', 'trigger2'],
  true
);
```

---

## 🎯 Ejemplos de Uso

### Cliente Solicita IVA

**Cliente escribe:** "Quiero mi IVA de enero"

**Chatbot responde:**
```
📄 IVA Enero 2024

🔗 [Descargar aquí](https://...)
```

### Cliente Pide Ayuda

**Cliente escribe:** "ayuda"

**Chatbot responde:**
```
❓ ¿Necesitas Ayuda?

Selecciona una opción:

📄 Documentos
🛠️ Servicios
📞 Contacto
📊 Mi Panel
```

[Botones interactivos aparecen debajo]

---

## 📊 Estadísticas

El sistema trackea automáticamente:
- ✅ Accesos a documentos (contador y última fecha)
- ✅ Uso de menús interactivos
- ✅ Tipos de documentos más solicitados

---

## 🔒 Seguridad

- ✅ RLS habilitado en todas las tablas
- ✅ Usuarios solo ven sus propios documentos
- ✅ Admins pueden gestionar todos los documentos
- ✅ Validación de URLs antes de guardar

---

## 🚀 Próximas Mejoras

- [ ] Sincronización automática con Google Scripts
- [ ] Vista previa de documentos
- [ ] Notificaciones de nuevos documentos
- [ ] Búsqueda avanzada de documentos
- [ ] Filtros por año/mes en el panel admin

---

**¡Sistema completamente funcional y listo para usar!** 🎉
