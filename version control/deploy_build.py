"""
一键构建并部署脚本
自动构建项目，然后让用户选择部署到 v1 或 v2
"""

import os
import sys
import subprocess

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from version_builder import VersionBuilder
from deploy_v2 import VersionDeployer


def print_header(text):
    """打印标题"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60 + "\n")


def print_menu(options):
    """打印菜单"""
    for i, option in enumerate(options, 1):
        print(f"  {i}. {option['label']}")
    print()


def get_user_choice(options, prompt="请选择"):
    """获取用户选择"""
    while True:
        try:
            choice = input(f"{prompt} (1-{len(options)}): ").strip()
            if choice.isdigit():
                idx = int(choice) - 1
                if 0 <= idx < len(options):
                    return options[idx]
            print(f"无效选择，请输入 1-{len(options)} 之间的数字")
        except KeyboardInterrupt:
            print("\n\n已取消操作")
            sys.exit(0)
        except Exception as e:
            print(f"输入错误: {e}")


def run_build():
    """运行构建"""
    print_header("开始构建项目")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    print(f"项目目录: {project_root}")
    print("正在运行 npm run build...\n")
    
    try:
        # 切换到项目根目录
        os.chdir(project_root)
        
        # 运行构建（不捕获输出，直接显示，避免编码问题）
        result = subprocess.run(
            ["npm", "run", "build"],
            shell=True,
            check=True
        )
        
        print("\n✓ 构建成功！\n")
        return True
    
    except subprocess.CalledProcessError as e:
        print("\n✗ 构建失败！\n")
        print(f"退出码: {e.returncode}")
        return False
    except Exception as e:
        print(f"\n✗ 构建过程出错: {e}")
        return False


def select_deploy_version_type():
    """选择部署版本类型"""
    print_header("选择部署版本类型")
    
    version_type_options = [
        {"label": "稳定版 (v1) - 部署到 /home/admin/eye/media/exehtml/v1", "value": "v1"},
        {"label": "测试版 (v2) - 部署到 /home/admin/eye/media/exehtml/v2", "value": "v2"}
    ]
    
    print_menu(version_type_options)
    selected = get_user_choice(version_type_options, "选择部署版本类型")
    return selected["value"]


def get_deploy_description():
    """获取部署描述"""
    print("\n请输入部署描述（可选，直接回车跳过）:")
    description = input("描述: ").strip()
    return description


def deploy_version(version_name, version_type="v1", description=""):
    """部署版本"""
    version_type_label = "稳定版 (v1)" if version_type == "v1" else "测试版 (v2)"
    print_header(f"部署版本: {version_name} -> {version_type_label}")
    
    try:
        deployer = VersionDeployer()
        result = deployer.deploy_version(version_name, description, version_type)
        
        if result["success"]:
            print("\n" + "=" * 60)
            print("✓ 部署成功！")
            print(f"  版本: {result['version_name']}")
            print(f"  版本类型: {version_type_label}")
            print(f"  文件数: {result['files_count']}")
            print("=" * 60)
            return True
        else:
            print("\n✗ 部署失败")
            return False
    
    except Exception as e:
        print(f"\n✗ 部署失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """主函数"""
    print_header("一键构建并部署工具")
    
    # 1. 构建项目
    if not run_build():
        print("\n构建失败，无法继续部署")
        input("\n按回车键退出...")
        return
    
    # 2. 获取最新版本
    builder = VersionBuilder()
    latest = builder.get_latest_version()
    
    if not latest:
        print("未找到新创建的版本")
        input("\n按回车键退出...")
        return
    
    version_name = latest["name"]
    print(f"\n最新版本: {version_name}")
    
    # 3. 选择部署版本类型
    version_type = select_deploy_version_type()
    
    # 4. 获取描述
    description = get_deploy_description()
    
    # 5. 确认部署
    version_type_label = "稳定版 (v1)" if version_type == "v1" else "测试版 (v2)"
    print(f"\n准备部署版本: {version_name} -> {version_type_label}")
    confirm = input("确认部署？(y/N): ").strip().lower()
    
    if confirm == 'y':
        deploy_version(version_name, version_type, description)
    else:
        print("已取消部署")
    
    input("\n按回车键退出...")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n已取消操作")
        sys.exit(0)

