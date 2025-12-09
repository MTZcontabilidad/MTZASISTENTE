# 🌐 URL de Producción - Vercel

## ✅ URL Principal de Producción

La URL principal de tu aplicación en Vercel es:

```
https://mtzasistente.vercel.app
```

## 🔧 Configuración en Supabase

### 1. Site URL

En Supabase Dashboard:
1. Ve a **Authentication** > **URL Configuration**
2. En **Site URL**, configura:
   ```
   https://mtzasistente.vercel.app
   ```

### 2. Redirect URLs

En **Authentication** > **URL Configuration** > **Redirect URLs**, agrega:

```
https://mtzasistente.vercel.app/
https://mtzasistente.vercel.app
http://localhost:5173/
http://localhost:5173
```

## ✅ Verificación

1. Abre `https://mtzasistente.vercel.app`
2. Haz clic en "Continuar con Google"
3. Debería redirigir correctamente a la misma URL después del login

## 📝 Notas

- La lógica del código detecta automáticamente que estás en producción cuando la URL contiene `vercel.app`
- No necesitas cambiar nada en el código
- Solo asegúrate de que las URLs estén configuradas correctamente en Supabase

