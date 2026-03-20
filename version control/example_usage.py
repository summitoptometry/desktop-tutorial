"""
版本管理系统使用示例
"""

from version_manager import VersionManager
import os

def example_upload_version():
    """示例：上传版本"""
    print("=" * 50)
    print("示例：上传版本")
    print("=" * 50)
    
    # 初始化版本管理器（使用默认配置）
    manager = VersionManager()
    
    # 假设dist目录在项目根目录
    dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
    
    if not os.path.exists(dist_dir):
        print(f"错误: dist目录不存在: {dist_dir}")
        print("请先运行 npm run build 构建项目")
        return
    
    # 上传版本
    try:
        version_info = manager.upload_version(
            dist_dir=dist_dir,
            version_name="v1.0.0",
            description="初始版本 - 包含所有基础功能"
        )
        print(f"\n✓ 版本上传成功!")
        print(f"  版本名称: {version_info['name']}")
        print(f"  描述: {version_info['description']}")
        print(f"  本地路径: {version_info['local_path']}")
        print(f"  服务器路径: {version_info['server_path']}")
        print(f"  状态: {version_info['status']}")
    except Exception as e:
        print(f"\n✗ 版本上传失败: {e}")


def example_list_versions():
    """示例：列出所有版本"""
    print("\n" + "=" * 50)
    print("示例：列出所有版本")
    print("=" * 50)
    
    manager = VersionManager()
    versions = manager.get_version_list()
    current = manager.get_current_version()
    
    print(f"\n当前版本: {current or '未设置'}")
    print(f"\n版本列表 ({len(versions)} 个):")
    
    if not versions:
        print("  暂无版本")
    else:
        for v in versions:
            marker = " [当前]" if v["name"] == current else ""
            print(f"\n  {v['name']}{marker}")
            print(f"    描述: {v.get('description', '无')}")
            print(f"    创建时间: {v['created_at']}")
            print(f"    状态: {v['status']}")
            print(f"    本地路径: {v['local_path']}")


def example_switch_version():
    """示例：切换版本"""
    print("\n" + "=" * 50)
    print("示例：切换版本")
    print("=" * 50)
    
    manager = VersionManager()
    versions = manager.get_version_list()
    
    if not versions:
        print("\n错误: 没有可用版本")
        return
    
    # 获取第一个版本（如果不是当前版本）
    target_version = None
    current = manager.get_current_version()
    
    for v in versions:
        if v["name"] != current:
            target_version = v["name"]
            break
    
    if not target_version:
        print(f"\n当前只有 {current} 一个版本，无法切换")
        return
    
    try:
        success = manager.set_current_version(target_version)
        if success:
            print(f"\n✓ 版本已切换为: {target_version}")
            print(f"  原版本: {current or '未设置'}")
            print(f"  新版本: {target_version}")
    except Exception as e:
        print(f"\n✗ 切换版本失败: {e}")


def example_delete_version():
    """示例：删除版本"""
    print("\n" + "=" * 50)
    print("示例：删除版本")
    print("=" * 50)
    
    manager = VersionManager()
    versions = manager.get_version_list()
    current = manager.get_current_version()
    
    if not versions:
        print("\n错误: 没有可用版本")
        return
    
    # 找到一个非当前版本的版本进行删除
    target_version = None
    for v in versions:
        if v["name"] != current:
            target_version = v["name"]
            break
    
    if not target_version:
        print(f"\n当前只有 {current} 一个版本，无法删除当前版本")
        return
    
    try:
        success = manager.delete_version(target_version, keep_files=False)
        if success:
            print(f"\n✓ 版本已删除: {target_version}")
    except Exception as e:
        print(f"\n✗ 删除版本失败: {e}")


def example_export_version():
    """示例：导出版本为ZIP"""
    print("\n" + "=" * 50)
    print("示例：导出版本为ZIP")
    print("=" * 50)
    
    manager = VersionManager()
    versions = manager.get_version_list()
    
    if not versions:
        print("\n错误: 没有可用版本")
        return
    
    # 使用第一个版本
    target_version = versions[0]["name"]
    
    try:
        output_path = manager.export_version_as_zip(target_version)
        print(f"\n✓ 版本已导出: {output_path}")
    except Exception as e:
        print(f"\n✗ 导出版本失败: {e}")


if __name__ == "__main__":
    print("\n版本管理系统使用示例\n")
    
    # 运行示例
    example_list_versions()
    # example_upload_version()
    # example_switch_version()
    # example_delete_version()
    # example_export_version()
    
    print("\n" + "=" * 50)
    print("示例运行完成")
    print("=" * 50)

