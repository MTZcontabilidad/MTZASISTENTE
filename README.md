# MTZ Asistente

Asistente virtual para clientes y no clientes con autenticación Google OAuth, integración de Supabase y despliegue en Vercel.

## 🎨 Características

- ✅ Autenticación con Google OAuth
- ✅ Sistema de roles (Admin/Usuario)
- ✅ Panel de administración completo para gestionar usuarios
- ✅ Vista de bienvenida para invitados (primer ingreso)
- ✅ Chat en tiempo real con persistencia en Supabase
- ✅ Gestión de información de clientes
- ✅ Tema oscuro estilo neon (fondo negro con azul neon)
- ✅ Diseño responsive y moderno

## 🚀 Tecnologías

- **React** + **TypeScript** + **Vite**
- **Supabase** - Base de datos, autenticación y backend
- **Vercel** - Hosting y despliegue
- **Google OAuth** - Autenticación

## 📦 Instalación

```bash
npm install
```

## 🛠️ Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🏗️ Build

```bash
npm run build
```

## 📋 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://lcskqvadolwqcrqhxfvz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjc2txdmFkb2x3cWNycWh4ZnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODQ3MTYsImV4cCI6MjA4MDM2MDcxNn0.cQmbl9F7ge23V1FBDciBXpqzh6GHFjuT4LVu6ks-A7I
```

**IMPORTANTE**: El archivo `.env` está en `.gitignore` y NO se sube al repositorio.

### Configuración de Supabase

Sigue las instrucciones detalladas en `CONFIGURACION-SUPABASE.md` para:

1. Configurar Google OAuth en Google Cloud Console
2. Habilitar Google OAuth en Supabase
3. Ejecutar los scripts SQL necesarios

### Scripts SQL

**Nota:** Los scripts de setup inicial ya fueron aplicados. Si necesitas verificar o optimizar:

- **`VERIFICACION-COMPLETA-SUPABASE.sql`** - Verificar estructura completa
- **`verificar-estructura-supabase.sql`** - Verificación rápida
- **`OPTIMIZACIONES-SUPABASE.sql`** - Optimizaciones e índices (opcional)
- **`supabase-tramites.sql`** - Sistema de trámites (opcional, no aplicado aún)

## 👤 Roles y Tipos de Usuario

### Roles

- **Admin**: Puede ver y gestionar todos los usuarios, asignar información
- **Usuario**: Acceso al chat solamente

El email `mtzcontabilidad@gmail.com` está configurado como administrador por defecto.

### Tipos de Usuario

- **Invitado**: Usuario que ingresa por primera vez (ve pantalla de bienvenida)
- **Cliente nuevo**: Cliente recién registrado
- **Cliente existente**: Cliente con historial

## 🚢 Despliegue en Vercel

### Configuración del Repositorio

El repositorio oficial es: `https://github.com/MTZcontabilidad/MTZASISTENTE.git`

Sigue las instrucciones en `CONFIGURACION-REPOSITORIO.md` para:

- Configurar el repositorio remoto
- Configurar variables de entorno en Vercel
- Conectar el proyecto

### Pasos de Despliegue

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel (Settings > Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Asegúrate de agregar la URL de producción de Vercel a las URLs autorizadas en Google Cloud Console
4. Vercel detectará automáticamente el proyecto Vite y lo desplegará

## 🎨 Tema

El diseño utiliza un tema oscuro inspirado en Solo Leveling:

- Fondo negro (`#0a0a0f`)
- Acentos azul neon (`#00d4ff`)
- Efectos de brillo y sombras neon
- Interfaz moderna y minimalista

## 📝 Estructura del Proyecto

```
MTZ ASISTENTE/
├── src/
│   ├── components/            # Componentes React
│   │   ├── AdminPanel.tsx      # Panel de administración
│   │   ├── Auth.tsx            # Autenticación Google
│   │   ├── ChatInterface.tsx   # Interfaz de chat
│   │   ├── DocumentDownloader.tsx  # Panel de descarga
│   │   ├── Footer.tsx          # Footer con redes
│   │   ├── InteractiveMenu.tsx  # Menús interactivos
│   │   └── InvitadoWelcome.tsx # Bienvenida invitados
│   ├── config/                 # Configuración
│   │   ├── links.ts           # Enlaces externos
│   │   └── services.ts        # Servicios MTZ
│   ├── lib/                    # Funciones y utilidades
│   │   ├── adminDocuments.ts  # Gestión documentos (admin)
│   │   ├── clientInfo.ts      # Info de clientes
│   │   ├── companyConfig.ts   # Config empresa/FAQs
│   │   ├── conversations.ts   # Conversaciones
│   │   ├── documents.ts       # Gestión documentos
│   │   ├── markdown.ts        # Parser markdown
│   │   ├── memories.ts        # Sistema de memoria
│   │   ├── menus.ts           # Menús interactivos
│   │   ├── responseConfig.ts  # Config respuestas
│   │   ├── responseEngine.ts  # Motor de respuestas
│   │   ├── sessionCache.ts    # Caché de sesión
│   │   └── supabase.ts        # Cliente Supabase
│   └── types/
│       └── index.ts           # Tipos TypeScript
├── 📄 Documentación
│   ├── README.md              # README principal
│   ├── DOCUMENTACION-COMPLETA.md  # Documentación consolidada
│   ├── GUIA-USO-SISTEMA-DOCUMENTOS.md  # Guía de uso
│   └── CONFIGURACION-*.md     # Guías de configuración
└── 📄 Scripts SQL (solo útiles)
    ├── VERIFICACION-COMPLETA-SUPABASE.sql
    ├── verificar-estructura-supabase.sql
    └── OPTIMIZACIONES-SUPABASE.sql
```

## 🔧 Solución de Problemas

### Error: "Faltan las variables de entorno de Supabase"

- Verifica que el archivo `.env` existe en la raíz del proyecto
- Verifica que las variables tengan los nombres correctos
- Reinicia el servidor de desarrollo

### Error: "406 Not Acceptable" o errores de client_info

- Ejecuta el script `fix-rls-policies.sql` en Supabase
- Verifica que las políticas RLS estén activas

### Error: "Recursión infinita en políticas RLS"

- Ejecuta el script `fix-rls-policies.sql` en Supabase
- Esto crea la función `is_admin()` que evita la recursión

### La aplicación se queda en "Iniciando sesión..."

- Hay un timeout automático de 5 segundos
- Si persiste, haz clic en "Cancelar" y vuelve a intentar
- Verifica tu conexión a internet
- Verifica que las credenciales de Supabase sean correctas

### El panel de administrador no carga usuarios

- Ejecuta `fix-rls-policies.sql` en Supabase
- Verifica que tu usuario tenga rol 'admin' en `user_profiles`
- Verifica la consola del navegador para ver errores específicos

## 📚 Documentación

- `DOCUMENTACION-COMPLETA.md` - Documentación completa del sistema (BD, frontend, MCP, uso)
- `GUIA-USO-SISTEMA-DOCUMENTOS.md` - Guía de uso para clientes y administradores
- `CONFIGURACION-SUPABASE.md` - Configuración de Supabase
- `CONFIGURACION-REPOSITORIO.md` - Configuración de GitHub y Vercel
- `README-MCP.md` - Guía rápida de MCP de Supabase

## 🔒 Seguridad

- ✅ Todas las credenciales se obtienen de variables de entorno
- ✅ No hay credenciales hardcodeadas en el código
- ✅ Políticas RLS (Row Level Security) activas en todas las tablas
- ✅ El archivo `.env` está en `.gitignore`
