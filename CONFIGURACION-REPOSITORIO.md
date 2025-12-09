# Configuración del Repositorio y Credenciales

## 📦 Repositorio de GitHub

**Repositorio oficial**: `https://github.com/MTZcontabilidad/MTZASISTENTE.git`

### Configurar el repositorio remoto

Si el repositorio aún no está configurado, ejecuta:

```bash
# Verificar si hay un repositorio git inicializado
git status

# Si no hay repositorio, inicializarlo
git init

# Agregar el repositorio remoto
git remote add origin https://github.com/MTZcontabilidad/MTZASISTENTE.git

# Verificar que se agregó correctamente
git remote -v
```

### Configurar credenciales de Git

```bash
# Configurar usuario (si no está configurado)
git config user.name "Tu Nombre"
git config user.email "tu-email@ejemplo.com"

# O configurar globalmente
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

## 🔐 Credenciales de Supabase

### Variables de Entorno

Las credenciales de Supabase deben configurarse en dos lugares:

#### 1. Desarrollo Local (archivo `.env`)

Crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_SUPABASE_URL=https://lcskqvadolwqcrqhxfvz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjc2txdmFkb2x3cWNycWh4ZnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODQ3MTYsImV4cCI6MjA4MDM2MDcxNn0.cQmbl9F7ge23V1FBDciBXpqzh6GHFjuT4LVu6ks-A7I
```

**Importante**: El archivo `.env` está en `.gitignore` y NO se sube al repositorio por seguridad.

#### 2. Producción en Vercel

Configura las variables de entorno en Vercel:

1. Ve a tu proyecto en Vercel: https://vercel.com/mtz-consultores-tributarios-projects/mtzasistente
2. Ve a **Settings** > **Environment Variables**
3. Agrega las siguientes variables:

   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://lcskqvadolwqcrqhxfvz.supabase.co`
   - **Environment**: Production, Preview, Development (selecciona todas)

   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjc2txdmFkb2x3cWNycWh4ZnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODQ3MTYsImV4cCI6MjA4MDM2MDcxNn0.cQmbl9F7ge23V1FBDciBXpqzh6GHFjuT4LVu6ks-A7I`
   - **Environment**: Production, Preview, Development (selecciona todas)

4. Haz clic en **Save**
5. Redespliega la aplicación para que los cambios surtan efecto

## 🚀 Configuración de Vercel

### Conectar el Repositorio

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `mtzasistente`
3. Ve a **Settings** > **Git**
4. Verifica que el repositorio conectado sea: `MTZcontabilidad/MTZASISTENTE`
5. Si no está conectado, haz clic en **Connect Git Repository** y selecciona el repositorio

### Configuración del Proyecto

- **Project Name**: `mtzasistente`
- **Project ID**: `prj_jTpdWhSj181XCpdP5ay1GWu9oC7n`
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## ✅ Verificación

### Verificar que las credenciales se usan correctamente

1. **En desarrollo local**:
   ```bash
   # Verificar que el archivo .env existe
   cat .env
   
   # Iniciar el servidor de desarrollo
   npm run dev
   
   # Verificar en la consola del navegador que no hay errores de conexión
   ```

2. **En producción (Vercel)**:
   - Ve a **Settings** > **Environment Variables**
   - Verifica que ambas variables estén configuradas
   - Ve a **Deployments** y verifica que el último despliegue sea exitoso
   - Abre la aplicación en producción y verifica que funcione correctamente

### Verificar el repositorio

```bash
# Ver el repositorio remoto configurado
git remote -v

# Debe mostrar:
# origin  https://github.com/MTZcontabilidad/MTZASISTENTE.git (fetch)
# origin  https://github.com/MTZcontabilidad/MTZASISTENTE.git (push)
```

## 🔒 Seguridad

### ✅ Buenas Prácticas

- ✅ El archivo `.env` está en `.gitignore` y NO se sube al repositorio
- ✅ Las credenciales se configuran en Vercel como variables de entorno
- ✅ No hay credenciales hardcodeadas en el código fuente
- ✅ Se usa `.env.example` como plantilla sin credenciales reales

### ⚠️ Importante

- **NUNCA** subas el archivo `.env` al repositorio
- **NUNCA** hardcodees credenciales en el código
- **SIEMPRE** usa variables de entorno
- **VERIFICA** que `.env` esté en `.gitignore` antes de hacer commit

## 📝 Comandos Útiles

```bash
# Clonar el repositorio (si trabajas en otra máquina)
git clone https://github.com/MTZcontabilidad/MTZASISTENTE.git
cd MTZASISTENTE

# Instalar dependencias
npm install

# Crear archivo .env desde la plantilla
cp .env.example .env
# Luego edita .env y agrega las credenciales reales

# Verificar que todo funciona
npm run dev
```

## 🐛 Solución de Problemas

### Error: "Faltan las variables de entorno de Supabase"

**Solución**: 
1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Verifica que las variables tengan los nombres correctos: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
3. Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "Failed to fetch" en producción

**Solución**:
1. Ve a Vercel > Settings > Environment Variables
2. Verifica que las variables estén configuradas correctamente
3. Redespliega la aplicación

### El repositorio no está conectado

**Solución**:
```bash
# Verificar el remoto actual
git remote -v

# Si no existe, agregarlo
git remote add origin https://github.com/MTZcontabilidad/MTZASISTENTE.git

# Si existe pero es incorrecto, cambiarlo
git remote set-url origin https://github.com/MTZcontabilidad/MTZASISTENTE.git
```
