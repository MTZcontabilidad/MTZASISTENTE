# 🔧 Actualizar URLs en Supabase - Instrucciones

## 📋 Estado Actual en Supabase

Según la captura que me mostraste, tienes configurado:

### Site URL:
```
http://localhost:5173
```
✅ **Esto está CORRECTO para desarrollo**

### Redirect URLs:
1. ✅ `http://localhost:5173/` - CORRECTO
2. ⚠️ `https://mtzasistente-lxo324gxr-mtz-consultores-tributarios-projects.vercel.app/` - **URL ANTIGUA**

## ❌ Problema Detectado

Tienes una URL de Vercel **antigua** (de hace 2 horas). La URL **más reciente** de producción es:

```
https://mtzasistente-og9xvzzes-mtz-consultores-tributarios-projects.vercel.app
```

## ✅ Solución: Agregar URLs Faltantes

### Paso 1: Agregar la URL de Producción Más Reciente

En Supabase Dashboard > Authentication > URL Configuration:

1. Haz clic en **"Agregar URL"** (botón verde)
2. Agrega estas URLs (una por una):

```
https://mtzasistente-og9xvzzes-mtz-consultores-tributarios-projects.vercel.app/
https://mtzasistente-og9xvzzes-mtz-consultores-tributarios-projects.vercel.app
```

### Paso 2: (Opcional) Mantener la URL Antigua

Puedes mantener la URL antigua también, no hace daño. Pero la importante es la nueva.

### Paso 3: Actualizar Site URL para Producción

**IMPORTANTE:** El Site URL debería ser la URL de producción cuando estés en producción.

Tienes dos opciones:

#### Opción A: Usar comodín (Recomendado)
Cambia el Site URL a:
```
https://mtzasistente-*.vercel.app
```

Esto cubrirá todas las URLs de Vercel automáticamente.

#### Opción B: Usar la URL más reciente
Cambia el Site URL a:
```
https://mtzasistente-og9xvzzes-mtz-consultores-tributarios-projects.vercel.app
```

**Nota:** Si cambias el Site URL a producción, cuando trabajes en desarrollo local, tendrás que cambiarlo de vuelta a `http://localhost:5173`.

## 📝 Lista Completa de URLs que Deberías Tener

### Redirect URLs (agregar todas):
```
http://localhost:5173/
http://localhost:5173
https://mtzasistente-og9xvzzes-mtz-consultores-tributarios-projects.vercel.app/
https://mtzasistente-og9xvzzes-mtz-consultores-tributarios-projects.vercel.app
https://mtzasistente-1xo324gxr-mtz-consultores-tributarios-projects.vercel.app/
https://mtzasistente-1xo324gxr-mtz-consultores-tributarios-projects.vercel.app
```

### Site URL:
- **Para desarrollo:** `http://localhost:5173`
- **Para producción:** `https://mtzasistente-*.vercel.app` (con comodín) O la URL específica más reciente

## 🎯 Recomendación Final

1. **Mantén el Site URL en `http://localhost:5173`** si trabajas principalmente en desarrollo
2. **Agrega TODAS las URLs de producción** en Redirect URLs (con y sin barra final)
3. El código detectará automáticamente si estás en desarrollo o producción

## ✅ Verificación

Después de agregar las URLs:

1. Prueba en desarrollo: `http://localhost:5173` → Debe funcionar ✅
2. Prueba en producción: Abre tu URL de Vercel → Debe funcionar ✅

## 🔍 Cómo Verificar las URLs de Vercel

Ejecuta en la terminal:
```bash
vercel ls
```

Esto te mostrará todas las URLs de deployment. Agrega todas las que estén marcadas como "Ready" (●).

