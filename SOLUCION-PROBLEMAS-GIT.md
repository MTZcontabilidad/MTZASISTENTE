# 🔧 Solución de Problemas Git - MTZ Asistente

## ❌ Problemas Detectados

1. **Rama incorrecta**: Estás en `mtz-prueba-2` en lugar de `main`
2. **Error de push**: "repository not found" al intentar hacer push
3. **Cambios sin commitear**: Archivos modificados pendientes

## ✅ Soluciones Aplicadas

### 1. Cambiar a Rama Main

```powershell
git checkout main
git branch -D mtz-prueba-2  # Eliminar rama incorrecta
```

### 2. Configurar Remote con Token

```powershell
# Configura tu token de GitHub como variable de entorno
$env:GITHUB_TOKEN = "tu-token-aqui"
# Obtén tu token en: https://github.com/settings/tokens

$token = $env:GITHUB_TOKEN
git remote set-url origin https://$token@github.com/MTZcontabilidad/MTZASISTENTE.git
```

### 3. Agregar y Commitear Cambios

```powershell
git add -A
git commit -m "Corregir referencias y configuraciones - MTZ Asistente"
```

### 4. Hacer Push

```powershell
git push -u origin main
```

## 🚀 Script Automático

He creado el script `corregir-problemas-git.ps1` que hace todo automáticamente:

```powershell
.\corregir-problemas-git.ps1
```

Este script:
- ✅ Verifica y cambia a la rama `main`
- ✅ Configura el remote correctamente
- ✅ Agrega cambios pendientes
- ✅ Crea commits si es necesario
- ✅ Verifica conexión con GitHub
- ✅ Hace push automáticamente

## 📋 Verificación

Después de ejecutar el script, verifica:

```powershell
# Ver rama actual
git branch

# Ver remote
git remote -v

# Ver estado
git status

# Ver commits
git log --oneline -5
```

## ⚠️ Importante

- **Siempre trabaja en la rama `main`** para este proyecto
- **Usa el token en el remote** para autenticación
- **Verifica el remote** antes de hacer push: `git remote -v`

## 🔄 Si el Problema Persiste

1. Ejecuta el script: `.\corregir-problemas-git.ps1`
2. Si falla, verifica manualmente:
   ```powershell
   git checkout main
   # Configura tu token primero: $env:GITHUB_TOKEN = "tu-token-aqui"
   git remote set-url origin https://$env:GITHUB_TOKEN@github.com/MTZcontabilidad/MTZASISTENTE.git
   git push -u origin main
   ```
3. Verifica en GitHub: https://github.com/MTZcontabilidad/MTZASISTENTE
