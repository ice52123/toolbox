@echo off
title CampusHub 一键停止
echo 正在停止 MySQL (data2) ...
F:\tools\mysql\bin\mysqladmin.exe -uroot -padmin123 shutdown 2>nul

echo 正在停止 Redis / 后端 / 前端 ...
for %%p in (6379 3201 5173 4200) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
)

echo 完成。所有 CampusHub 服务已停止。
pause
