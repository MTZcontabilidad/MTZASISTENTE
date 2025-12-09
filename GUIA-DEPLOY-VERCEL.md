# 🚀 Guía de Deploy en Vercel - MTZ Asistente

## ✅ Estado Actual

### Configuración Completada

1. **GitHub** ✅
   - Repositorio: `https://github.com/MTZcontabilidad/MTZASISTENTE.git`
   - Archivos del chatbot subidos
   - Repositorio limpio y organizado

2. **Supabase** ✅
   - Variables de entorno configuradas localmente
   - Cliente Supabase configurado correctamente
   - **ACCIÓN REQUERIDA**: Configurar variables en Vercel

3. **Vite** ✅
   - Configuración correcta
   - Build funcionando correctamente
   - Archivos generados en `dist/`

4. **Vercel** ⚠️
   - `vercel.json` configurado
   - **PENDIENTE**: Conectar repositorio y configurar variables

## 📋 Pasos para Deploy en Vercel

### 1. Crear/Acceder a Cuenta Vercel

1. Ve a https://vercel.com
2. Inicia sesión con tu cuenta de GitHub
3. Autoriza el acceso a tus repositorios

### 2. Importar Proyecto

1. En el dashboard de Vercel, haz clic en **"Add New Project"** o **"Import Project"**
2. Selecciona el repositorio: `MTZcontabilidad/MTZASISTENTE`
3. Vercel detectará automáticamente que es un proyecto Vite

### 3. Configurar Variables de Entorno

**IMPORTANTE**: Estas variables son necesarias para que la aplicación funcione en producción.

1. En la página de configuración del proyecto, ve a **Settings** > **Environment Variables**
2. Agrega las siguientes variables:

   ```
   VITE_SUPABASE_URL=https://lcskqvadolwqcrqhxfvz.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjc2txdmFkb2x3cWNycWh4ZnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODQ3MTYsImV4cCI6MjA4MDM2MDcxNn0.cQmbl9F7ge23V1FBDciBXpqzh6GHFjuT4LVu6ks-A7I
   ```

3. Selecciona los ambientes: **Production**, **Preview**, y **Development**
4. Guarda las variables

### 4. Configurar Google OAuth

**IMPORTANTE**: Después del deploy, necesitas agregar la URL de producción a Google OAuth.

1. Una vez que Vercel despliegue tu aplicación, obtendrás una URL como: `https://mtz-asistente.vercel.app`
2. Ve a [Google Cloud Console](https://console.cloud.google.com/)
3. Selecciona tu proyecto
4. Ve a **APIs & Services** > **Credentials**
5. Edita tu OAuth 2.0 Client ID
6. Agrega la URL de Vercel a **Authorized JavaScript origins**:
   - `https://mtz-asistente.vercel.app` (o la URL que te dé Vercel)
7. Agrega también a **Authorized redirect URIs**:
   - `https://mtz-asistente.vercel.app` (o la URL que te dé Vercel)
   - `https://lcskqvadolwqcrqhxfvz.supabase.co/auth/v1/callback`

### 5. Deploy

1. Vercel detectará automáticamente el framework (Vite)
2. Usará la configuración de `vercel.json`
3. Ejecutará `npm run build`
4. Desplegará los archivos de `dist/`

### 6. Verificar Deploy

Después del deploy, verifica que:

- ✅ La aplicación carga correctamente
- ✅ La autenticación Google funciona
- ✅ Las conexiones a Supabase funcionan
- ✅ El chat funciona correctamente
- ✅ El panel de administración funciona (si eres admin)

## 🔧 Configuración Actual de Vercel

El archivo `vercel.json` está configurado con:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Esta configuración:
- ✅ Detecta automáticamente Vite
- ✅ Ejecuta el build correcto
- ✅ Configura rewrites para SPA (Single Page Application)
- ✅ Sirve `index.html` para todas las rutas

## 📝 Notas Importantes

1. **Variables de Entorno**: 
   - Las variables `VITE_*` son públicas en el cliente
   - Esto es seguro para `VITE_SUPABASE_ANON_KEY` (es la clave pública)
   - **NUNCA** expongas la clave de servicio (service role key)
   - ⚠️ **Si Vercel muestra una advertencia sobre VITE_SUPABASE_ANON_KEY**: Es normal y seguro continuar. La clave anónima está diseñada para ser pública. Ver `EXPLICACION-VITE-KEY-SEGURA.md` para más detalles.

2. **Google OAuth**:
   - Debes agregar la URL de producción a Google Cloud Console
   - Sin esto, la autenticación no funcionará en producción

3. **Supabase**:
   - Verifica que las políticas RLS estén configuradas correctamente
   - Verifica que Google OAuth esté habilitado en Supabase

4. **Build**:
   - El build local funciona correctamente
   - Vercel usará el mismo proceso
   - Si hay errores, revisa los logs en Vercel

## 🐛 Solución de Problemas

### Error: "Deployment was canceled because it was created with an unverified commit"

**Solución Rápida (Recomendada)**:
1. Ve a tu proyecto en Vercel
2. Ve a **Settings** > **Git**
3. Busca **"Deployment Protection"** o **"Require verified commits"**
4. **Desactiva** la opción de verificación de commits
5. Guarda los cambios
6. Haz un nuevo push o haz clic en **"Redeploy"** en el deploy cancelado

**Solución Alternativa**:
- Hacer un nuevo commit y push (ya hecho automáticamente)
- Vercel debería detectar el nuevo commit y hacer el deploy

### Error: "Faltan las variables de entorno de Supabase"

**Solución**: Verifica que las variables estén configuradas en Vercel:
- Settings > Environment Variables
- Deben estar en Production, Preview y Development

### Error: "Google OAuth no funciona en producción"

**Solución**: 
1. Agrega la URL de Vercel a Google Cloud Console
2. Verifica que la URL sea exacta (con https://)
3. Espera unos minutos para que los cambios se propaguen

### Error: "Build falla en Vercel"

**Solución**:
1. Revisa los logs en Vercel
2. Verifica que `npm run build` funcione localmente
3. Verifica que todas las dependencias estén en `package.json`

## ✅ Checklist Final

Antes de considerar el deploy completo:

- [ ] Proyecto conectado a Vercel
- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso
- [ ] URL de producción agregada a Google OAuth
- [ ] Autenticación funcionando
- [ ] Conexión a Supabase funcionando
- [ ] Chat funcionando
- [ ] Panel de administración funcionando (si aplica)

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu aplicación estará online y funcionando.

