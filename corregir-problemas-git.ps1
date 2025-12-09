# Script para Corregir Problemas de Git
Write-Host "=== CORRECCIÓN DE PROBLEMAS GIT ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar rama actual
Write-Host "1. VERIFICANDO RAMA ACTUAL..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   Rama actual: $currentBranch" -ForegroundColor White

if ($currentBranch -ne "main") {
    Write-Host "   ⚠️ Estás en la rama '$currentBranch', cambiando a 'main'..." -ForegroundColor Yellow
    git checkout main 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Cambiado a rama 'main'" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error al cambiar de rama" -ForegroundColor Red
    }
} else {
    Write-Host "   ✅ Ya estás en la rama 'main'" -ForegroundColor Green
}
Write-Host ""

# 2. Verificar y configurar remote
Write-Host "2. VERIFICANDO REMOTE..." -ForegroundColor Yellow
$remoteUrl = git config --get remote.origin.url
Write-Host "   Remote actual: $remoteUrl" -ForegroundColor White

if ($remoteUrl -notlike "*MTZcontabilidad/MTZASISTENTE*") {
    Write-Host "   ⚠️ Remote incorrecto, corrigiendo..." -ForegroundColor Yellow
    $token = $env:GITHUB_TOKEN
    if (-not $token) {
        Write-Host "   ❌ Error: Variable GITHUB_TOKEN no configurada" -ForegroundColor Red
        Write-Host "   Configura tu token con: `$env:GITHUB_TOKEN = 'tu-token-aqui'" -ForegroundColor Yellow
        exit 1
    }
    git remote set-url origin https://$token@github.com/MTZcontabilidad/MTZASISTENTE.git
    Write-Host "   ✅ Remote corregido" -ForegroundColor Green
} else {
    Write-Host "   ✅ Remote correcto" -ForegroundColor Green
}
Write-Host ""

# 3. Agregar cambios pendientes
Write-Host "3. AGREGANDO CAMBIOS PENDIENTES..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "   Cambios encontrados:" -ForegroundColor White
    Write-Host "   $status" -ForegroundColor Gray
    git add -A
    Write-Host "   ✅ Cambios agregados" -ForegroundColor Green
} else {
    Write-Host "   ✅ No hay cambios pendientes" -ForegroundColor Green
}
Write-Host ""

# 4. Hacer commit si hay cambios
Write-Host "4. VERIFICANDO COMMITS..." -ForegroundColor Yellow
$uncommitted = git diff --cached --name-only
if ($uncommitted) {
    Write-Host "   ⚠️ Hay cambios sin commit, creando commit..." -ForegroundColor Yellow
    git commit -m "Corregir referencias y configuraciones - MTZ Asistente" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Commit creado" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ No hay cambios para commitear" -ForegroundColor Green
}
Write-Host ""

# 5. Verificar conexión con GitHub
Write-Host "5. VERIFICANDO CONEXIÓN CON GITHUB..." -ForegroundColor Yellow
$token = $env:GITHUB_TOKEN
if (-not $token) {
    Write-Host "   ❌ Error: Variable GITHUB_TOKEN no configurada" -ForegroundColor Red
    Write-Host "   Configura tu token con: `$env:GITHUB_TOKEN = 'tu-token-aqui'" -ForegroundColor Yellow
    exit 1
}
git remote set-url origin https://$token@github.com/MTZcontabilidad/MTZASISTENTE.git
$test = git ls-remote origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Conexión exitosa con GitHub!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error de conexión" -ForegroundColor Red
    Write-Host "   $test" -ForegroundColor Red
}
Write-Host ""

# 6. Hacer push
Write-Host "6. HACIENDO PUSH A GITHUB..." -ForegroundColor Yellow
git push -u origin main 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Push exitoso!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error en push" -ForegroundColor Red
    Write-Host "   Verifica el token o los permisos" -ForegroundColor Yellow
}
Write-Host ""

# 7. Resumen final
Write-Host "=== RESUMEN ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Rama actual: $(git branch --show-current)" -ForegroundColor White
Write-Host "Remote: $(git config --get remote.origin.url)" -ForegroundColor White
Write-Host "Estado:" -ForegroundColor White
git status --short
Write-Host ""
Write-Host "Últimos commits:" -ForegroundColor White
git log --oneline -3
Write-Host ""
