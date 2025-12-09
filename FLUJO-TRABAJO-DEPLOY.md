# 🔄 Flujo de Trabajo: Desarrollo Local → Deploy Online

## 📋 Proceso Completo

### 1. **Desarrollo Local**

```powershell
# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará en: http://localhost:5173
# Los cambios se reflejan automáticamente (hot reload)
```

### 2. **Hacer Cambios**

- Edita archivos en `src/`
- Modifica estilos en `src/*.css`
- Agrega nuevas funcionalidades
- Prueba localmente antes de subir

### 3. **Verificar que Funcione**

```powershell
# Verificar que compile sin errores
npm run build

# Si hay errores, corrígelos antes de hacer commit
```

### 4. **Commit y Push a GitHub**

```powershell
# Ver qué archivos cambiaron
git status

# Agregar cambios
git add .

# Crear commit con mensaje descriptivo
git commit -m "Mejorar diseño de ChatInterface y agregar nuevas funcionalidades"

# Subir a GitHub
git push origin main
```

### 5. **Deploy Automático en Vercel**

- ✅ Vercel detecta automáticamente el nuevo commit
- ✅ Ejecuta `npm run build`
- ✅ Despliega automáticamente en producción
- ✅ Puedes ver el progreso en https://vercel.com

### 6. **Verificar en Producción**

- Ve a tu URL de producción
- Verifica que los cambios funcionen correctamente
- Si hay problemas, revisa los logs en Vercel

## 🔧 Cambios en Supabase

### Si Modificas la Base de Datos:

1. **Hacer cambios en Supabase Dashboard**:
   - Ve a https://supabase.com
   - SQL Editor > Ejecuta tus queries
   - O usa el MCP de Supabase desde Cursor

2. **No necesitas redeploy**:
   - Los cambios en Supabase son inmediatos
   - La aplicación ya conectada usará los nuevos cambios

3. **Si cambias variables de entorno**:
   - Actualiza en Vercel: Settings > Environment Variables
   - Haz un nuevo deploy (o espera al siguiente push)

## 📝 Buenas Prácticas

### Commits Descriptivos

```powershell
# ✅ Bueno
git commit -m "Mejorar diseño responsive del AdminPanel"
git commit -m "Agregar funcionalidad de búsqueda en chat"
git commit -m "Corregir bug en autenticación Google"

# ❌ Malo
git commit -m "cambios"
git commit -m "fix"
```

### Probar Antes de Push

```powershell
# Siempre verifica que compile
npm run build

# Prueba localmente
npm run dev
```

### Deploy Manual (si es necesario)

```powershell
# Si quieres forzar un deploy sin commit
vercel --prod
```

## 🎯 Resumen del Flujo

```
1. Desarrollo Local (npm run dev)
   ↓
2. Hacer Cambios (editar archivos)
   ↓
3. Probar Localmente
   ↓
4. Verificar Build (npm run build)
   ↓
5. Commit y Push (git add, commit, push)
   ↓
6. Vercel Deploy Automático
   ↓
7. Verificar en Producción
```

## ⚡ Tips

- **Desarrollo rápido**: Usa `npm run dev` para ver cambios instantáneos
- **Deploy rápido**: Cada push a `main` despliega automáticamente
- **Rollback**: Puedes redeployar cualquier commit anterior desde Vercel
- **Preview**: Cada PR crea un deployment de preview automáticamente

