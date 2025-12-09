# Script para usar el commit remoto correcto (MTZ ASISTENTE)
# Descartar el commit local "AAA" y usar el remoto

Write-Host "=== USANDO COMMIT REMOTO CORRECTO ===" -ForegroundColor Cyan
Write-Host ""

# Deshabilitar pager completamente
$env:GIT_PAGER = ""
$env:LESS = ""
$env:LV = ""

# Configurar token (reemplaza con tu token de GitHub)
# Obtén tu token en: https://github.com/settings/tokens
$token = $env:GITHUB_TOKEN
if (-not $token) {
    Write-Host "⚠️ Error: Variable GITHUB_TOKEN no configurada" -ForegroundColor Red
    Write-Host "Configura tu token con: `$env:GITHUB_TOKEN = 'tu-token-aqui'" -ForegroundColor Yellow
    exit 1
}
git remote set-url origin https://$token@github.com/MTZcontabilidad/MTZASISTENTE.git

Write-Host "1. Obteniendo información del remoto..." -ForegroundColor Yellow
git fetch origin 2>&1 | Out-Null
Write-Host "   ✅ Fetch completado" -ForegroundColor Green
Write-Host ""

Write-Host "2. Verificando commits..." -ForegroundColor Yellow
$localCommit = git rev-parse --short HEAD 2>&1
$remoteCommit = git rev-parse --short origin/main 2>&1
Write-Host "   Local actual:  $localCommit (AAA - INCORRECTO)" -ForegroundColor Red
Write-Host "   Remoto correcto: $remoteCommit (MTZ ASISTENTE)" -ForegroundColor Green
Write-Host ""

Write-Host "3. Reseteando al commit remoto correcto..." -ForegroundColor Yellow
Write-Host "   Esto descartará el commit local 'AAA'" -ForegroundColor Yellow

# Hacer reset hard al commit remoto
git reset --hard origin/main 2>&1 | Out-String | Write-Host

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Reset completado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error en reset" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "4. Verificando estado actual..." -ForegroundColor Yellow
$nuevoCommit = git rev-parse --short HEAD 2>&1
Write-Host "   Commit actual: $nuevoCommit" -ForegroundColor White

if ($nuevoCommit -eq $remoteCommit) {
    Write-Host "   ✅ Ahora estás en el commit correcto de MTZ ASISTENTE" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ El commit no coincide, revisa manualmente" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "5. Estado del repositorio:" -ForegroundColor Yellow
git status --short 2>&1 | Out-String | Write-Host
Write-Host ""

Write-Host "=== COMPLETADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora estás usando el commit correcto de MTZ ASISTENTE desde GitHub" -ForegroundColor Cyan
Write-Host "El commit local 'AAA' ha sido descartado" -ForegroundColor Cyan
Write-Host ""

