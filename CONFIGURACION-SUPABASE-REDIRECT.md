# 🔧 Configuración de Redirección OAuth en Supabase

## ❌ Problema Detectado

Cuando el usuario hace login con Google, Supabase está redirigiendo a `localhost:3000` en lugar de la URL correcta.

## ✅ Solución Aplicada en el Código

Se corrigió `src/components/Auth.tsx` para:
- Detectar automáticamente el entorno (desarrollo vs producción)
- Usar `localhost:5173` en desarrollo (puerto de Vite)
- Usar la URL de producción (Vercel) en producción

## 🔧 Configuración Necesaria en Supabase Dashboard

### 1. URLs de Redirección Permitidas

Ve a tu proyecto en Supabase:
1. **Authentication** > **URL Configuration**
2. En **Redirect URLs**, agrega:

#### Para Desarrollo Local:
```
http://localhost:5173/
http://localhost:5173
```

#### Para Producción (Vercel):
```
https://mtzasistente-1xo324gxr-mtz-consultores-tributarios-projects.vercel.app/
https://mtzasistente-1xo324gxr-mtz-consultores-tributarios-projects.vercel.app
https://mtzasistente.vercel.app/
https://mtzasistente.vercel.app
```

**Nota:** Si tienes un dominio personalizado, agrega también:
```
https://tudominio.com/
https://tudominio.com
```

### 2. Configuración de Google OAuth

1. Ve a **Authentication** > **Providers** > **Google**
2. Verifica que esté habilitado
3. En **Authorized redirect URIs** de Google Cloud Console, asegúrate de tener:

#### Desarrollo:
```
http://localhost:5173/
```

#### Producción:
```
https://lcskqvadolwqcrqhxfvz.supabase.co/auth/v1/callback
```

**Importante:** Supabase maneja el callback, así que solo necesitas la URL de Supabase en Google Cloud Console.

### 3. Site URL en Supabase

1. Ve a **Authentication** > **URL Configuration**
2. En **Site URL**, configura:

#### Desarrollo:
```
http://localhost:5173
```

#### Producción:
```
https://mtzasistente-1xo324gxr-mtz-consultores-tributarios-projects.vercel.app
```

O tu dominio personalizado si lo tienes.

## 📋 Checklist de Verificación

- [ ] Redirect URLs agregadas en Supabase (desarrollo y producción)
- [ ] Site URL configurada correctamente
- [ ] Google OAuth habilitado en Supabase
- [ ] Authorized redirect URI en Google Cloud Console apunta a Supabase
- [ ] Código actualizado con la lógica de detección de entorno

## 🔍 Cómo Verificar

1. **En Desarrollo:**
   - Abre `http://localhost:5173`
   - Haz login con Google
   - Debería redirigir a `http://localhost:5173/` (no a `localhost:3000`)

2. **En Producción:**
   - Abre tu URL de Vercel
   - Haz login con Google
   - Debería redirigir a la misma URL de Vercel

## ⚠️ Notas Importantes

- El código ahora detecta automáticamente el entorno
- En desarrollo, siempre usa `localhost:5173` (puerto de Vite)
- En producción, usa la URL actual (Vercel)
- Asegúrate de que todas las URLs estén agregadas en Supabase antes de probar

## 🚨 Si Sigue Fallando

1. Verifica que las URLs estén exactamente como se muestran arriba
2. Limpia la caché del navegador
3. Verifica la consola del navegador para ver errores
4. Revisa los logs de Supabase en el dashboard

