# 🔧 Corrección de Site URL en Supabase

## ❌ Problema Detectado

En Supabase Dashboard, el **Site URL** está configurado como:
```
http://localhost:3000
```

Pero debería ser:
```
http://localhost:5173
```

## ✅ Solución

### 1. Cambiar Site URL

En Supabase Dashboard:
1. Ve a **Authentication** > **URL Configuration**
2. En el campo **Site URL**, cambia:
   - ❌ `http://localhost:3000`
   - ✅ `http://localhost:5173`
3. Haz clic en **"Save changes"**

### 2. Redirect URLs (Ya están correctas ✅)

Las Redirect URLs que tienes están bien:
- ✅ `http://localhost:5173/`
- ✅ `https://mtzasistente-1xo324gxr-mtz-consultores-tributarios-projects.vercel.app/`

**No necesitas cambiarlas**, solo el Site URL.

## 📋 Configuración Correcta Final

### Site URL:
```
http://localhost:5173
```

### Redirect URLs:
```
http://localhost:5173/
https://mtzasistente-1xo324gxr-mtz-consultores-tributarios-projects.vercel.app/
```

## 🔍 ¿Por qué es importante?

El **Site URL** es la URL por defecto que Supabase usa cuando:
- No se especifica un `redirectTo` en el código
- El `redirectTo` no coincide con ninguna URL de la lista de Redirect URLs

Si está en `localhost:3000` pero tu app corre en `localhost:5173`, Supabase intentará redirigir al puerto incorrecto.

## ✅ Después de Cambiar

1. Guarda los cambios en Supabase
2. Prueba el login en desarrollo (`http://localhost:5173`)
3. Debería redirigir correctamente a `localhost:5173` (no a `localhost:3000`)

## 🚨 Nota sobre Producción

Para producción, el Site URL debería ser tu URL de Vercel:
```
https://mtzasistente-1xo324gxr-mtz-consultores-tributarios-projects.vercel.app
```

Pero como estás en desarrollo, usa `localhost:5173` por ahora.

