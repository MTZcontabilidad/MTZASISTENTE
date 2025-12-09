# Script para Sincronizar con el Commit 91598af de GitHub
Write-Host "=== SINCRONIZACIÓN CON GITHUB ===" -ForegroundColor Cyan
Write-Host ""

# 1. Configurar token (reemplaza con tu token de GitHub)
# Obtén tu token en: https://github.com/settings/tokens
$token = $env:GITHUB_TOKEN
if (-not $token) {
    Write-Host "⚠️ Error: Variable GITHUB_TOKEN no configurada" -ForegroundColor Red
    Write-Host "Configura tu token con: `$env:GITHUB_TOKEN = 'tu-token-aqui'" -ForegroundColor Yellow
    exit 1
}
git remote set-url origin https://$token@github.com/MTZcontabilidad/MTZASISTENTE.git

# 2. Fetch del remoto
Write-Host "1. Obteniendo información de GitHub..." -ForegroundColor Yellow
git fetch origin 2>&1 | Out-Null
Write-Host "   ✅ Fetch completado" -ForegroundColor Green
Write-Host ""

# 3. Verificar commit 91598af
Write-Host "2. Verificando commit 91598af..." -ForegroundColor Yellow
$commitExists = git cat-file -e 91598af 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Commit 91598af encontrado" -ForegroundColor Green
    $commitInfo = git show 91598af --oneline --no-patch 2>&1
    Write-Host "   $commitInfo" -ForegroundColor Gray
}
else {
    Write-Host "   ⚠️ Commit 91598af no encontrado localmente" -ForegroundColor Yellow
    Write-Host "   Se obtendrá desde GitHub..." -ForegroundColor Yellow
}
Write-Host ""

# 4. Verificar estado actual
Write-Host "3. Estado actual:" -ForegroundColor Yellow
$localCommit = git rev-parse --short HEAD
$remoteCommit = git rev-parse --short origin/main 2>&1
Write-Host "   Local:  $localCommit" -ForegroundColor White
Write-Host "   Remoto: $remoteCommit" -ForegroundColor White
Write-Host ""

# 5. Verificar si hay diferencias
Write-Host "4. Verificando diferencias..." -ForegroundColor Yellow
$commitsAhead = git rev-list --count origin/main..HEAD 2>&1
$commitsBehind = git rev-list --count HEAD..origin/main 2>&1

if ($commitsAhead -gt 0) {
    Write-Host "   ⚠️ Tienes $commitsAhead commit(s) local(es) que no están en GitHub" -ForegroundColor Yellow
    Write-Host "   Commits locales:" -ForegroundColor Yellow
    git log origin/main..HEAD --oneline
    Write-Host ""
    Write-Host "   ¿Deseas hacer push? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s") {
        Write-Host "   Haciendo push..." -ForegroundColor Yellow
        git push -u origin main 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Push exitoso!" -ForegroundColor Green
        }
    }
}

if ($commitsBehind -gt 0) {
    Write-Host "   ⚠️ GitHub tiene $commitsBehind commit(s) que no tienes localmente" -ForegroundColor Yellow
    Write-Host "   Commits remotos:" -ForegroundColor Yellow
    git log HEAD..origin/main --oneline
    Write-Host ""
    Write-Host "   ¿Deseas hacer pull? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s") {
        Write-Host "   Haciendo pull..." -ForegroundColor Yellow
        git pull origin main 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Pull exitoso!" -ForegroundColor Green
        }
    }
}

if ($commitsAhead -eq 0 -and $commitsBehind -eq 0) {
    Write-Host "   ✅ Todo está sincronizado!" -ForegroundColor Green
}
Write-Host ""

# 6. Resumen final
Write-Host "=== RESUMEN ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Commit local:  $(git rev-parse --short HEAD)" -ForegroundColor White
Write-Host "Commit remoto: $(git rev-parse --short origin/main 2>&1)" -ForegroundColor White
Write-Host "Commit GitHub: 91598af" -ForegroundColor White
Write-Host ""
Write-Host "Últimos commits:" -ForegroundColor White
git log --oneline -3
Write-Host ""
