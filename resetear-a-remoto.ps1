# Script para resetear al commit remoto correcto (MTZ ASISTENTE)
# Configura todo al inicio para evitar problemas con el pager

# Configurar Git para no usar pager
$env:GIT_PAGER = "cat"
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

Write-Host "=== RESETEANDO AL COMMIT REMOTO CORRECTO ===" -ForegroundColor Cyan
Write-Host ""

# Fetch sin output
Write-Host "1. Obteniendo información del remoto..." -ForegroundColor Yellow
$null = git fetch origin 2>&1
Write-Host "   ✅ Completado" -ForegroundColor Green
Write-Host ""

# Reset hard al remoto
Write-Host "2. Reseteando al commit remoto (MTZ ASISTENTE)..." -ForegroundColor Yellow
Write-Host "   Descartando commit local 'AAA'..." -ForegroundColor Yellow

# Ejecutar reset y capturar output
$resetOutput = git reset --hard origin/main 2>&1 | Out-String

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Reset completado exitosamente" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error en reset:" -ForegroundColor Red
    Write-Host $resetOutput -ForegroundColor Red
    exit 1
}
Write-Host ""

# Verificar commit actual
Write-Host "3. Verificando commit actual..." -ForegroundColor Yellow
$currentCommit = git rev-parse --short HEAD 2>&1
$remoteCommit = git rev-parse --short origin/main 2>&1

Write-Host "   Commit actual: $currentCommit" -ForegroundColor White
Write-Host "   Commit remoto: $remoteCommit" -ForegroundColor White

if ($currentCommit -eq $remoteCommit) {
    Write-Host "   ✅ Estás en el commit correcto de MTZ ASISTENTE" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Los commits no coinciden" -ForegroundColor Yellow
}
Write-Host ""

# Mostrar estado
Write-Host "4. Estado del repositorio:" -ForegroundColor Yellow
$status = git status --short 2>&1 | Out-String
if ($status.Trim()) {
    Write-Host $status
} else {
    Write-Host "   ✅ Repositorio limpio" -ForegroundColor Green
}
Write-Host ""

Write-Host "=== COMPLETADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora estás usando el commit correcto de MTZ ASISTENTE desde GitHub" -ForegroundColor Cyan
Write-Host "El commit local 'AAA' ha sido descartado" -ForegroundColor Cyan

