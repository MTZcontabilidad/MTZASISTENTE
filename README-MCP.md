# 🚀 MCP de Supabase - Guía Rápida

## ¿Qué es MCP?

MCP (Model Context Protocol) permite que Cursor (y otros asistentes de IA) accedan directamente a tu base de datos de Supabase para ayudarte mejor.

## ⚡ Configuración Rápida (2 minutos)

### 1. Abre Cursor Settings

- `Ctrl+Shift+P` → `Preferences: Open Settings (JSON)`

### 2. Agrega esto:

```json
{
  "mcp": {
    "servers": {
      "supabase": {
        "type": "http",
        "url": "https://mcp.supabase.com/mcp?project_ref=lcskqvadolwqcrqhxfvz&read_only=true"
      }
    }
  }
}
```

### 3. Guarda y reinicia Cursor

### 4. Autentica cuando te lo pida

## ✅ Verificar

Pregunta a Cursor:

```
¿Puedes listar mis tablas de Supabase?
```

## 📚 Documentación

- `DOCUMENTACION-COMPLETA.md` - Documentación completa del sistema (incluye MCP)

## 🔐 Seguridad

- ✅ `read_only=true` - Solo lectura (seguro)
- ✅ `project_ref` - Solo tu proyecto
- ✅ OAuth 2.1 - Autenticación segura

## 🎯 Casos de Uso

- Analizar estructura de BD
- Optimizar queries
- Generar tipos TypeScript
- Debugging
- Verificar políticas RLS

---

**¿Problemas?** Revisa `DOCUMENTACION-COMPLETA.md`
