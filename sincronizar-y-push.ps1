# Script para sincronizar y hacer push
Write-Host "=== SINCRONIZACIÓN CON GITHUB ===" -ForegroundColor Cyan
Write-Host ""

# Deshabilitar pager
$env:GIT_PAGER = "cat"
$env:LESS = ""

# Configurar token (reemplaza con tu token de GitHub)
# Obtén tu token en: https://github.com/settings/tokens
$token = $env:GITHUB_TOKEN
if (-not $token) {
    Write-Host "⚠️ Error: Variable GITHUB_TOKEN no configurada" -ForegroundColor Red
    Write-Host "Configura tu token con: `$env:GITHUB_TOKEN = 'tu-token-aqui'" -ForegroundColor Yellow
    exit 1
}
git remote set-url origin https://$token@github.com/MTZcontabilidad/MTZASISTENTE.git

# 1. Fetch
Write-Host "1. Obteniendo cambios remotos..." -ForegroundColor Yellow
git fetch origin 2>&1 | Out-Null
Write-Host "   ✅ Fetch completado" -ForegroundColor Green
Write-Host ""

# 2. Verificar estado
Write-Host "2. Estado actual:" -ForegroundColor Yellow
$localCommit = git rev-parse --short HEAD 2>&1
$remoteCommit = git rev-parse --short origin/main 2>&1
Write-Host "   Local:  $localCommit" -ForegroundColor White
Write-Host "   Remoto: $remoteCommit" -ForegroundColor White
Write-Host ""

# 3. Hacer merge sin editor
Write-Host "3. Integrando cambios remotos..." -ForegroundColor Yellow

# Configurar para merge automático
$env:GIT_EDITOR = "echo"
$env:GIT_MERGE_AUTOEDIT = "no"

# Intentar merge con mensaje
$mergeOutput = git -c core.pager=cat merge origin/main -m "Merge: Integrar cambios remotos" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Merge completado" -ForegroundColor Green
} else {
    # Verificar si es un error de merge o solo advertencia
    $mergeOutputStr = $mergeOutput -join "`n"
    if ($mergeOutputStr -match "Already up to date") {
        Write-Host "   ✅ Ya está actualizado" -ForegroundColor Green
    } elseif ($mergeOutputStr -match "CONFLICT") {
        Write-Host "   ❌ Hay conflictos que requieren resolución manual" -ForegroundColor Red
        Write-Host "   Conflictos detectados:" -ForegroundColor Red
        git status --short 2>&1 | Where-Object { $_ -match "^UU" }
        exit 1
    } else {
        Write-Host "   ⚠️ Resultado del merge:" -ForegroundColor Yellow
        Write-Host $mergeOutputStr -ForegroundColor Yellow
    }
}
Write-Host ""

# 4. Hacer push
Write-Host "4. Haciendo push a GitHub..." -ForegroundColor Yellow
$pushOutput = git -c core.pager=cat push -u origin main 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Push completado exitosamente!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error en push:" -ForegroundColor Red
    $pushOutputStr = $pushOutput -join "`n"
    Write-Host $pushOutputStr -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "=== SINCRONIZACIÓN COMPLETA ===" -ForegroundColor Green
Write-Host ""
Write-Host "Estado final:" -ForegroundColor Cyan
git -c core.pager=cat log --oneline -3 2>&1

