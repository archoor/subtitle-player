# 在 Windows 桌面创建「字幕播放工具」快捷方式
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$Launcher = Join-Path $PSScriptRoot "launch.bat"
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "字幕播放工具.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($ShortcutPath)
$shortcut.TargetPath = $Launcher
$shortcut.WorkingDirectory = $ProjectRoot
$shortcut.WindowStyle = 1
$shortcut.Description = "启动字幕播放工具 (http://127.0.0.1:8800)"
$shortcut.Save()

Write-Host "已创建桌面快捷方式: $ShortcutPath"
