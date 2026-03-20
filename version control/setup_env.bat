@echo off
REM 在 version control 目录中创建虚拟环境并安装依赖

echo ========================================
echo 设置部署脚本虚拟环境
echo ========================================
echo.

REM 检查是否已存在虚拟环境
if exist "venv" (
    echo 虚拟环境已存在，跳过创建...
) else (
    echo 正在创建虚拟环境...
    python -m venv venv
    if errorlevel 1 (
        echo 错误: 无法创建虚拟环境，请确保已安装 Python
        pause
        exit /b 1
    )
    echo ✓ 虚拟环境创建成功
)

echo.
echo 正在激活虚拟环境并安装依赖...
call venv\Scripts\activate.bat

echo.
echo 正在安装依赖...
pip install --upgrade pip
pip install -r deploy_requirements.txt

if errorlevel 1 (
    echo.
    echo ✗ 依赖安装失败
    pause
    exit /b 1
) else (
    echo.
    echo ========================================
    echo ✓ 环境设置完成！
    echo ========================================
    echo.
    echo 使用方法:
    echo 1. 激活虚拟环境: venv\Scripts\activate.bat
    echo 2. 运行部署脚本: python deploy.py
    echo 3. 或者直接运行: deploy.bat
    echo.
)

pause

