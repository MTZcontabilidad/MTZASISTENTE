# Script para resolver la sincronización sin problemas de pager
Write-Host "=== RESOLVIENDO SINCRONIZACIÓN ===" -ForegroundColor Cyan
Write-Host ""

# Configurar token (reemplaza con tu token de GitHub)
# Obtén tu token en: https://github.com/settings/tokens
$token = $env:GITHUB_TOKEN
if (-not $token) {
    Write-Host "⚠️ Error: Variable GITHUB_TOKEN no configurada" -ForegroundColor Red
    Write-Host "Configura tu token con: `$env:GITHUB_TOKEN = 'tu-token-aqui'" -ForegroundColor Yellow
    exit 1
}
git remote set-url origin https://$token@github.com/MTZcontabilidad/MTZASISTENTE.git

# Deshabilitar completamente el pager
$env:GIT_PAGER = ""
$env:LESS = ""
$env:LV = ""

Write-Host "1. Obteniendo cambios remotos..." -ForegroundColor Yellow
git fetch origin 2>&1 | Out-Null
Write-Host "   ✅ Completado" -ForegroundColor Green
Write-Host ""

Write-Host "2. Verificando diferencias..." -ForegroundColor Yellow
$localCommit = git rev-parse --short HEAD 2>&1
$remoteCommit = git rev-parse --short origin/main 2>&1
Write-Host "   Local:  $localCommit" -ForegroundColor White
Write-Host "   Remoto: $remoteCommit" -ForegroundColor White
Write-Host ""

Write-Host "3. Opciones de sincronización:" -ForegroundColor Yellow
Write-Host "   A) Hacer merge (recomendado si quieres conservar ambos commits)" -ForegroundColor White
Write-Host "   B) Hacer rebase (recomendado para historial limpio)" -ForegroundColor White
Write-Host "   C) Push forzado (solo si estás seguro de que tu versión es la correcta)" -ForegroundColor White
Write-Host ""
$opcion = Read-Host "Selecciona opción (A/B/C)"

switch ($opcion.ToUpper()) {
    "A" {
        Write-Host ""
        Write-Host "Haciendo merge..." -ForegroundColor Yellow
        # Crear mensaje de merge en un archivo temporal
        $mergeMsg = "Merge: Integrar cambios remotos con commit local"
        $mergeMsg | Out-File -FilePath ".git/MERGE_MSG" -Encoding utf8 -NoNewline
        git merge origin/main --no-edit 2>&1 | Out-String | Write-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Merge completado" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ Revisa el resultado arriba" -ForegroundColor Yellow
        }
    }
    "B" {
        Write-Host ""
        Write-Host "Haciendo rebase..." -ForegroundColor Yellow
        git rebase origin/main 2>&1 | Out-String | Write-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Rebase completado" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ Revisa el resultado arriba" -ForegroundColor Yellow
        }
    }
    "C" {
        Write-Host ""
        Write-Host "⚠️ ADVERTENCIA: Esto sobrescribirá el historial remoto" -ForegroundColor Red
        $confirmar = Read-Host "¿Estás seguro? (escribe 'SI' para confirmar)"
        if ($confirmar -eq "SI") {
            Write-Host "Haciendo push forzado..." -ForegroundColor Yellow
            git push -f origin main 2>&1 | Out-String | Write-Host
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Push forzado completado" -ForegroundColor Green
            }
        } else {
            Write-Host "   ❌ Operación cancelada" -ForegroundColor Red
            exit 1
        }
    }
    default {
        Write-Host "   ❌ Opción inválida" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "4. Haciendo push..." -ForegroundColor Yellow
if ($opcion.ToUpper() -ne "C") {
    git push -u origin main 2>&1 | Out-String | Write-Host
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Push completado exitosamente!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error en push. Revisa el mensaje arriba." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== COMPLETADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Últimos commits:" -ForegroundColor Cyan
git log --oneline -5 2>&1 | Out-String | Write-Host

