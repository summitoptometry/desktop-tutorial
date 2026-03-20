@echo off
REM 一键部署脚本（Windows批处理版本）
REM 自动激活虚拟环境并运行部署脚本

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 检查虚拟环境是否存在
if not exist "venv" (
    echo 虚拟环境不存在，正在创建...
    call setup_env.bat
    if errorlevel 1 (
        echo 环境设置失败，请手动运行 setup_env.bat
        pause
        exit /b 1
    )
)

REM 激活虚拟环境
call venv\Scripts\activate.bat

REM 检查是否在项目根目录的上一级
if not exist "..\dist" (
    echo 错误: 找不到 dist 目录
    echo 请确保在项目根目录运行此脚本，或者指定 dist 目录路径
    echo 用法: deploy.bat [--dist 路径]
    pause
    exit /b 1
)

REM 运行部署脚本（新版本，支持版本选择）
python deploy_v2.py %*

REM 保持窗口打开以查看结果
if errorlevel 1 (
    echo.
    echo 部署失败，请查看上面的错误信息
) else (
    echo.
    echo 部署完成！
)

pause

