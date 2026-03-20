#!/bin/bash
# 在 version control 目录中创建虚拟环境并安装依赖

echo "========================================"
echo "设置部署脚本虚拟环境"
echo "========================================"
echo

# 检查是否已存在虚拟环境
if [ -d "venv" ]; then
    echo "虚拟环境已存在，跳过创建..."
else
    echo "正在创建虚拟环境..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "错误: 无法创建虚拟环境，请确保已安装 Python3"
        exit 1
    fi
    echo "✓ 虚拟环境创建成功"
fi

echo
echo "正在激活虚拟环境并安装依赖..."
source venv/bin/activate

echo
echo "正在安装依赖..."
pip install --upgrade pip
pip install -r deploy_requirements.txt

if [ $? -ne 0 ]; then
    echo
    echo "✗ 依赖安装失败"
    exit 1
else
    echo
    echo "========================================"
    echo "✓ 环境设置完成！"
    echo "========================================"
    echo
    echo "使用方法:"
    echo "1. 激活虚拟环境: source venv/bin/activate"
    echo "2. 运行部署脚本: python deploy.py"
    echo "3. 或者直接运行: ./deploy.sh"
    echo
fi

