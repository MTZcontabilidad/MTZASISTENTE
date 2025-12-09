# 📚 Documentación Completa - MTZ Asistente

## 🎯 Sistema Completo

### ✅ Estado: IMPLEMENTADO Y FUNCIONAL

**Última actualización:** Sistema de documentos, menús interactivos, MCP de Supabase configurado

---

## 🗄️ Base de Datos

### Tablas Creadas

1. **`client_documents`** - Documentos de clientes (IVA, E-RUT, facturas, boletas, declaraciones)
2. **`client_google_scripts`** - Links a Google Scripts y dashboards
3. **`interactive_menus`** - Menús interactivos para el chatbot
4. **`client_info`** - Actualizada con `google_script_url`, `dashboard_url`, `document_preferences`

### Triggers Automáticos

- ✅ Auto-actualización de timestamps
- ✅ Auto-creación de Google Scripts cuando se crea cliente
- ✅ Tracking de acceso a documentos

### RLS Policies

- ✅ Usuarios solo ven sus documentos
- ✅ Admins gestionan todo

---

## 🎨 Frontend

### Componentes

- ✅ `InteractiveMenu.tsx` - Menús con botones clickeables
- ✅ `DocumentDownloader.tsx` - Panel de descarga
- ✅ `ChatInterface.tsx` - Soporte para menús y documentos
- ✅ `AdminPanel.tsx` - Pestaña "📄 Documentos" para gestión

### Funciones

- ✅ `lib/documents.ts` - Gestión de documentos
- ✅ `lib/menus.ts` - Gestión de menús
- ✅ `lib/adminDocuments.ts` - Funciones admin
- ✅ `lib/responseEngine.ts` - Detección automática de documentos

---

## 🚀 Cómo Usar

### Para Clientes

**Solicitar documento:**

- Escribe: "Quiero mi IVA" o "Necesito el E-RUT de enero"
- El chatbot detecta y entrega el documento con enlace de descarga

**Usar menús:**

- Escribe: "documentos" o "ayuda"
- Aparecen botones clickeables para navegar

### Para Administradores

**Cargar documento:**

1. Panel Admin → Pestaña "📄 Documentos"
2. Click "➕ Nuevo Documento"
3. Completa: Cliente, Tipo, Nombre, Período, URL
4. Guarda

**Asociar Google Script:**

- Agrega `google_script_url` o `dashboard_url` en el formulario de cliente
- Se crea automáticamente en `client_google_scripts`

---

## 🔧 MCP de Supabase

### Configuración

**Token:** `sbp_fbaa6e626cff001dcf359c14b03037af934e0226`  
**Project ID:** `lcskqvadolwqcrqhxfvz`  
**Estado:** ✅ Configurado y funcionando

**Archivo:** `c:\Users\s_pk_\.cursor\mcp.json`

### Verificación

- ✅ MCP conectado y funcionando
- ✅ Puedo acceder a tablas, ejecutar SQL, ver migraciones
- ✅ Todas las tablas verificadas (10 tablas en total)
- ✅ 3 menús interactivos creados

---

## 📊 Estructura de Datos

### Documento

```typescript
{
  user_id: "uuid",
  document_type: "iva" | "erut" | "factura" | "boleta" | "declaracion" | "otro",
  document_name: "IVA Enero 2024",
  period: "2024-01", // Opcional
  download_url: "https://..."
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

## 🔒 Seguridad

- ✅ RLS habilitado en todas las tablas
- ✅ Usuarios solo ven sus documentos
- ✅ Admins gestionan todo
- ✅ Token MCP configurado correctamente

---

## ✅ Checklist

- [x] Base de datos estructurada
- [x] Triggers automáticos
- [x] Componentes frontend
- [x] Integración con chatbot
- [x] Menús interactivos
- [x] Panel de administración
- [x] MCP de Supabase configurado

---

---

## 📋 Scripts SQL Disponibles

### Scripts de Verificación (Útiles mantener)

- ✅ `VERIFICACION-COMPLETA-SUPABASE.sql` - Verificar estructura completa de BD
- ✅ `verificar-estructura-supabase.sql` - Verificación rápida de tablas/funciones

### Scripts de Optimización (Opcional)

- ✅ `OPTIMIZACIONES-SUPABASE.sql` - Optimizaciones e índices (puede ejecutarse si es necesario)

### Scripts Eliminados (Ya aplicados)

### Scripts Eliminados (Ya aplicados o no usados)

**Setup inicial (ya aplicados):**

- ❌ `supabase-setup.sql` - Setup inicial
- ❌ `supabase-chat-structure.sql` - Estructura de chat
- ❌ `supabase-company-config.sql` - Configuración empresa/FAQs
- ❌ `fix-rls-policies.sql` - Corrección RLS
- ❌ `fix-all-rls-policies.sql` - Corrección completa RLS (duplicado)
- ❌ `fix-company-faq-rls.sql` - Corrección específica (duplicado)
- ❌ `SETUP-COMPLETO-SUPABASE.sql` - Setup consolidado (duplicado)

**No usados:**

- ❌ `supabase-tramites.sql` - Sistema de trámites (no aplicado, eliminado)
- ❌ `src/lib/tramites.ts` - Funciones de trámites (no usadas, eliminado)

### Migraciones Aplicadas

- ✅ `create_client_documents_system` - Sistema de documentos
- ✅ `create_rls_policies_documents` - RLS para documentos
- ✅ `insert_default_interactive_menus_fixed` - Menús por defecto

**Nota:** Los scripts de setup inicial ya fueron aplicados y eliminados para mantener el proyecto limpio.

---

## 🔧 Configuración

### Variables de Entorno

```env
VITE_SUPABASE_URL=https://lcskqvadolwqcrqhxfvz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Repositorio

- GitHub: `https://github.com/MTZcontabilidad/MTZASISTENTE.git`
- Vercel: Configurado

---

**Última actualización:** Sistema completo implementado y funcionando.
