"""
版本管理命令行工具
用于查看、选择和管理版本
"""

import os
import json
import argparse
from datetime import datetime
from version_builder import VersionBuilder


def list_versions():
    """列出所有版本"""
    builder = VersionBuilder()
    versions = builder.get_version_list()
    
    if not versions:
        print("\n暂无版本")
        return
    
    print(f"\n版本列表 (共 {len(versions)} 个):")
    print("=" * 80)
    print(f"{'版本名称':<15} {'状态':<10} {'文件数':<10} {'创建时间':<20} {'描述':<20}")
    print("-" * 80)
    
    for v in versions[:20]:  # 只显示最近20个
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
        
        print(f"{v['name']:<15} {status:<10} {file_count:<10} {created_at:<20} {description:<20}")
    
    if len(versions) > 20:
        print(f"\n... 还有 {len(versions) - 20} 个更早的版本")
    
    print("=" * 80)


def show_version(version_name: str):
    """显示版本详情"""
    builder = VersionBuilder()
    version_info = builder.get_version_info(version_name)
    
    if not version_info:
        print(f"\n✗ 版本不存在: {version_name}")
        return
    
    print(f"\n版本详情: {version_name}")
    print("=" * 60)
    print(f"版本名称: {version_info['name']}")
    print(f"版本路径: {version_info['path']}")
    print(f"状态: {version_info.get('status', 'created')}")
    print(f"文件数量: {version_info.get('file_count', 0)}")
    print(f"创建时间: {version_info.get('created_at', '')}")
    print(f"描述: {version_info.get('description', '无')}")
    
    if version_info.get('deployed_at'):
        print(f"部署时间: {version_info['deployed_at']}")
    if version_info.get('server_path'):
        print(f"服务器路径: {version_info['server_path']}")
    
    # 检查文件夹是否存在
    if os.path.exists(version_info['path']):
        print(f"✓ 版本文件夹存在")
    else:
        print(f"✗ 版本文件夹不存在")
    
    print("=" * 60)


def delete_version(version_name: str, keep_files: bool = False):
    """删除版本"""
    builder = VersionBuilder()
    
    try:
        confirm = input(f"\n确定要删除版本 {version_name} 吗？(y/N): ")
        if confirm.lower() != 'y':
            print("已取消")
            return
        
        success = builder.delete_version(version_name, keep_files)
        if success:
            print(f"\n✓ 版本已删除: {version_name}")
    except Exception as e:
        print(f"\n✗ 删除失败: {e}")


def main():
    parser = argparse.ArgumentParser(description="版本管理命令行工具")
    subparsers = parser.add_subparsers(dest="command", help="命令")
    
    # 列出版本
    list_parser = subparsers.add_parser("list", help="列出所有版本")
    
    # 显示版本详情
    show_parser = subparsers.add_parser("show", help="显示版本详情")
    show_parser.add_argument("version_name", type=str, help="版本名称")
    
    # 删除版本
    delete_parser = subparsers.add_parser("delete", help="删除版本")
    delete_parser.add_argument("version_name", type=str, help="版本名称")
    delete_parser.add_argument("--keep-files", action="store_true", help="保留文件")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        list_versions()
        return
    
    try:
        if args.command == "list":
            list_versions()
        elif args.command == "show":
            show_version(args.version_name)
        elif args.command == "delete":
            delete_version(args.version_name, args.keep_files)
    except Exception as e:
        print(f"\n✗ 错误: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())

