@echo off
chcp 65001 >nul
title 字幕播放工具
cd /d "%~dp0.."

rem 查找 uv（桌面快捷方式环境 PATH 可能不含 uv）
set "UV="
if exist "%USERPROFILE%\.local\bin\uv.exe" set "UV=%USERPROFILE%\.local\bin\uv.exe"
if not defined UV if exist "%LOCALAPPDATA%\Programs\uv\uv.exe" set "UV=%LOCALAPPDATA%\Programs\uv\uv.exe"
if not defined UV (
  where uv >nul 2>&1 && set "UV=uv"
)
if not defined UV (
  echo [错误] 未找到 uv，请先安装: https://docs.astral.sh/uv/
  pause
  exit /b 1
)

echo 正在启动字幕播放工具 …
echo 关闭本窗口即停止服务
echo.

"%UV%" run python subtitle_player/run.py
echo.
echo 服务已停止
pause
