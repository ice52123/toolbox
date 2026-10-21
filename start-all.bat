@echo off
title CampusHub 一键启动 (data2)
echo ==========================================
echo   CampusHub 一键启动 - 数据目录 data2
echo ==========================================
echo.

echo [1/5] 启动 MySQL (data2 目录) ...
start "MySQL" cmd /k "F:\tools\mysql\bin\mysqld.exe --console --basedir=F:\tools\mysql --datadir=F:\tools\mysql\data2 --port=3306 --character-set-server=utf8mb4"
timeout /t 4 /nobreak >nul

echo [2/5] 启动 Redis ...
start "Redis" cmd /k "F:\tools\Redis\redis-server.exe --port 6379 --dir F:\tools\Redis --maxmemory 128mb --maxmemory-policy allkeys-lru --save """
timeout /t 2 /nobreak >nul

echo [3/5] 启动后端 (3201) ...
start "Backend" cmd /k "cd /d F:\web\Node\项目\toolbox\server && C:\Users\10186\.workbuddy\binaries\node\versions\22.22.2-6\node.exe app.js"
timeout /t 3 /nobreak >nul

echo [4/5] 启动前端主应用 (5173) ...
start "Client" cmd /k "cd /d F:\web\Node\项目\toolbox\client && C:\Users\10186\.workbuddy\binaries\node\versions\22.22.2-6\node.exe node_modules\vite\bin\vite.js --host --port 5173"

echo [5/5] 启动闲置市场 (4200) ...
start "IdleMarket" cmd /k "cd /d F:\web\Node\项目\toolbox\idle-market && C:\Users\10186\.workbuddy\binaries\node\versions\22.22.2-6\node.exe node_modules\vite\bin\vite.js --host --port 4200"

echo.
echo 全部已启动！访问 http://localhost:5173
echo 关闭方式：直接关掉弹出的 5 个命令行窗口，或运行 stop-all.bat
pause
