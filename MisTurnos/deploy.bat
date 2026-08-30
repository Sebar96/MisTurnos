@echo off
echo Subiendo cambios a Firebase...
firebase deploy --only hosting
echo.
echo Listo! Presiona cualquier tecla para cerrar.
pause > nul
