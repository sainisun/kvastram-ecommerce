@echo off
chcp 65001 >nul
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          🧹 SAFE CLEANUP - FINAL CONFIRMATION                    ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo ⚠️  Yeh delete karega (18 files, 69 KB):
echo    • Test scripts (test-*.ts, test-*.js)
echo    • Audit scripts (audit-*.ts, verify-*.ts)
echo    • Temporary documentation
echo.
echo 🛡️  Yeh SAFE rahenge:
echo    • All source code (backend/src/, storefront/src/, admin/src/)
echo    • Database files (schema, migrations)
echo    • Framework dependencies (react, tailwind, pg, drizzle)
echo    • Configuration files (package.json, .env, etc.)
echo.
echo 🗄️  Backup automatically ban jayega pehle
echo.
echo ═════════════════════════════════════════════════════════════════
echo.
set /p confirm="Kya aap cleanup karna chahte hain? (yes/no): "

if /i "%confirm%"=="yes" (
    echo.
    echo 🚀 Cleanup shuru ho raha hai...
    echo.
    node selective-cleanup.js --go
    echo.
    pause
) else (
    echo.
    echo ❌ Cleanup cancelled.
    echo.
    pause
)
