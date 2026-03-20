#!/bin/bash
# 一键部署脚本（Linux/Mac版本）
# 自动激活虚拟环境并运行部署脚本

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 检查虚拟环境是否存在
if [ ! -d "venv" ]; then
    echo "虚拟环境不存在，正在创建..."
    bash setup_env.sh
    if [ $? -ne 0 ]; then
        echo "环境设置失败，请手动运行 setup_env.sh"
        exit 1
    fi
fi

# 激活虚拟环境
source venv/bin/activate

# 检查是否在项目根目录的上一级
if [ ! -d "../dist" ]; then
    echo "错误: 找不到 dist 目录"
    echo "请确保在项目根目录运行此脚本，或者指定 dist 目录路径"
    echo "用法: ./deploy.sh [--dist 路径]"
    exit 1
fi

# 运行部署脚本
python deploy.py "$@"

# 检查部署结果
if [ $? -ne 0 ]; then
    echo
    echo "部署失败，请查看上面的错误信息"
    exit 1
else
    echo
    echo "部署完成！"
fi

