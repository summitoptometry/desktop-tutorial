"""
选择历史版本并部署到 v1 或 v2
不需要重新构建，直接从已有版本中选择
"""

import os
import sys

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from version_builder import VersionBuilder
from deploy_v2 import VersionDeployer
from datetime import datetime


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


def list_versions():
    """列出版本"""
    builder = VersionBuilder()
    versions = builder.get_version_list()
    return versions


def select_version():
    """选择要部署的版本"""
    print_header("选择要部署的版本")
    
    versions = list_versions()
    
    if not versions:
        print("暂无可用版本")
        return None
    
    print("可用版本列表:\n")
    print(f"{'序号':<6} {'版本名称':<15} {'状态':<10} {'文件数':<10} {'创建时间':<20} {'描述':<20}")
    print("-" * 90)
    
    for i, v in enumerate(versions[:20], 1):  # 只显示最近20个
        status = v.get("status", "created")
        file_count = v.get("file_count", 0)
        created_at = v.get("created_at", "")
        if created_at:
            try:
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                created_at = dt.strftime("%Y-%m-%d %H:%M:%S")
            except:
                pass
        
        description = (v.get("description", "") or "无")[:18]
        print(f"  {i:<4} {v['name']:<15} {status:<10} {file_count:<10} {created_at:<20} {description:<20}")
    
    if len(versions) > 20:
        print(f"\n... 还有 {len(versions) - 20} 个更早的版本")
    
    print()
    
    # 创建选项
    options = [{"label": f"{v['name']} - {v.get('description', '无描述')[:30]}", "value": v['name']} 
               for v in versions[:20]]
    
    selected = get_user_choice(options, "选择要部署的版本")
    return selected["value"]


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
    print_header("选择历史版本并部署")
    
    # 1. 选择版本
    version_name = select_version()
    if not version_name:
        print("未选择版本，退出")
        return
    
    # 2. 选择部署版本类型
    version_type = select_deploy_version_type()
    
    # 3. 获取描述
    description = get_deploy_description()
    
    # 4. 确认部署
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

