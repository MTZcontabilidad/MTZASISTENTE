# 🔧 Configuración de Redirección OAuth - Solución Completa

## ✅ Problema Resuelto

Se corrigió la lógica de redirección en `src/components/Auth.tsx` para detectar automáticamente el entorno y usar la URL correcta.

## 🔧 Configuración Requerida en Supabase

### 1. Site URL

En Supabase Dashboard:
1. Ve a **Authentication** > **URL Configuration**
2. En **Site URL**, configura según el entorno:

#### Para Desarrollo:
```
http://localhost:5173
```

#### Para Producción:
```
https://mtzasistente-og9xvzzes-mtz-consultores-tributarios-projects.vercel.app
```

**O tu dominio personalizado si lo tienes configurado.**

### 2. Redirect URLs Permitidas

En **Authentication** > **URL Configuration** > **Redirect URLs**, agrega TODAS estas URLs:

#### Desarrollo:
```
http://localhost:5173/
http://localhost:5173
```

#### Producción (Vercel):
```
https://mtzasistente-og9xvzzes-mtz-consultores-tributarios-projects.vercel.app/
https://mtzasistente-og9xvzzes-mtz-consultores-tributarios-projects.vercel.app
https://mtzasistente.vercel.app/
https://mtzasistente.vercel.app
```

**Nota:** Si tienes un dominio personalizado, agrega también:
```
https://tudominio.com/
https://tudominio.com
```

### 3. Configuración de Google OAuth

1. Ve a **Authentication** > **Providers** > **Google**
2. Verifica que esté **habilitado**
3. En **Google Cloud Console**, en **Authorized redirect URIs**, asegúrate de tener:

```
https://lcskqvadolwqcrqhxfvz.supabase.co/auth/v1/callback
```

**Importante:** Supabase maneja el callback, así que solo necesitas la URL de Supabase en Google Cloud Console, NO la URL de tu aplicación.

## 📋 Cómo Funciona Ahora

El código en `Auth.tsx` ahora:

1. **Detecta automáticamente el entorno:**
   - Si estás en `localhost` o `127.0.0.1` → usa `localhost:5173`
   - Si estás en producción → usa la URL actual de Vercel

2. **Maneja correctamente los puertos:**
   - Si el servidor está corriendo en el puerto actual, usa ese puerto
   - Si no, intenta usar el puerto 5173 (puerto por defecto de Vite)

3. **Incluye el pathname:**
   - Preserva la ruta actual (por ejemplo, si estás en `/chat`, redirige a `/chat`)

## 🚀 Deploy Completado

✅ **Deploy exitoso en Vercel:**
- URL de producción: `https://mtzasistente-og9xvzzes-mtz-consultores-tributarios-projects.vercel.app`
- Build completado sin errores
- Todos los errores de TypeScript corregidos

## 🔍 Verificación

### En Desarrollo:
1. Inicia el servidor: `npm run dev`
2. Abre `http://localhost:5173`
3. Haz login con Google
4. Debería redirigir correctamente a `http://localhost:5173/`

### En Producción:
1. Abre tu URL de Vercel
2. Haz login con Google
3. Debería redirigir correctamente a la misma URL de Vercel

## ⚠️ Si Sigue Fallando

1. **Verifica las URLs en Supabase:**
   - Deben estar exactamente como se muestran arriba
   - Sin espacios adicionales
   - Con y sin barra final (`/`)

2. **Limpia la caché del navegador:**
   - Ctrl+Shift+Delete (Windows/Linux)
   - Cmd+Shift+Delete (Mac)

3. **Verifica la consola del navegador:**
   - Abre DevTools (F12)
   - Ve a la pestaña Console
   - Busca errores relacionados con OAuth

4. **Revisa los logs de Supabase:**
   - Ve a Supabase Dashboard > Logs
   - Busca errores de autenticación

5. **Verifica que Google OAuth esté habilitado:**
   - En Supabase Dashboard > Authentication > Providers > Google
   - Debe estar marcado como "Enabled"

## 📝 Notas Importantes

- El código ahora detecta automáticamente el entorno, así que no necesitas cambiar nada en el código
- Solo necesitas configurar las URLs en Supabase Dashboard
- Las URLs deben coincidir EXACTAMENTE con las que usa tu aplicación
- Si cambias el dominio de Vercel, actualiza las URLs en Supabase

## 🎯 Próximos Pasos

1. ✅ Configura las URLs en Supabase Dashboard (pasos 1 y 2 arriba)
2. ✅ Verifica que Google OAuth esté habilitado
3. ✅ Prueba el login en desarrollo
4. ✅ Prueba el login en producción

¡Listo! El sistema de redirección debería funcionar correctamente ahora.

