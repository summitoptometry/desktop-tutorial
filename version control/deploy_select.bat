@echo off
REM 选择历史版本并部署脚本（Windows批处理版本）

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

REM 运行选择版本并部署脚本
python deploy_select.py

pause

