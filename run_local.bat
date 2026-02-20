@echo off
echo Starting RetinaLens AI Diagnostic Suite (Local Mode)...

:: Check for backend virtual environment or dependencies
echo [1/3] Checking Backend...
cd backend
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
echo Activating virtual environment and installing backend requirements...
call venv\Scripts\activate
pip install -r requirements.txt
start "RetinaLens Backend" cmd /k "python app.py"
cd ..

:: Check for frontend dependencies
echo [2/3] Checking Frontend...
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies (this may take a minute)...
    npm install
)
echo Starting frontend on port 3000...
start "RetinaLens Frontend" cmd /k "npm run dev -- --port 3000 --host"
cd ..

echo [3/3] Launching Success!
echo -----------------------------------------
echo FRONTEND URL: http://localhost:3000
echo BACKEND HEALTH: http://127.0.0.1:5000/api/health
echo -----------------------------------------
echo.
echo If localhost doesn't work, try: http://127.0.0.1:3000
echo.
echo Press any key to exit this window. (Servers will keep running in their own windows.)
pause > nul
