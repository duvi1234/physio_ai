@echo off
REM =========================================================
REM SMAART EMR - Quick Setup Script (Windows)
REM =========================================================
REM This script automates the setup of both frontend and backend

echo.
echo ==========================================
echo 🏥 SMAART EMR - Quick Setup
echo ==========================================
echo.

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Node.js is not installed. Please install Node.js v16+
  exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js version: %NODE_VERSION%

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm version: %NPM_VERSION%
echo.

REM Setup Backend
echo ==========================================
echo Setting up Backend...
echo ==========================================
cd smaart-emr-backend

if not exist ".env" (
  echo Creating .env file from .env.example...
  copy .env.example .env
  echo ✓ Backend .env created
  echo ⚠️  Please edit .env with your MongoDB URI
) else (
  echo ✓ Backend .env already exists
)

echo Installing backend dependencies...
call npm install
echo ✓ Backend setup complete!
echo.

REM Setup Frontend
echo ==========================================
echo Setting up Frontend...
echo ==========================================
cd ..\smaart-emr-frontend

if not exist ".env" (
  echo Creating .env file from .env.example...
  copy .env.example .env
  echo ✓ Frontend .env created
) else (
  echo ✓ Frontend .env already exists
)

echo Installing frontend dependencies...
call npm install
echo ✓ Frontend setup complete!
echo.

REM Summary
echo ==========================================
echo ✅ Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo.
echo 1️⃣  Start Backend:
echo    cd smaart-emr-backend
echo    npm run dev
echo.
echo 2️⃣  Start Frontend (in another terminal):
echo    cd smaart-emr-frontend
echo    npm run dev
echo.
echo 3️⃣  Open your browser:
echo    http://localhost:5173
echo.
echo 4️⃣  Test login with:
echo    Email: admin@smaart-healthcare.com
echo    Password: Admin@123456
echo.
echo 📖 For detailed setup guide, see: COMPLETE_SETUP_GUIDE.md
echo.
pause
