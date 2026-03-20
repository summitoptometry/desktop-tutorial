"""
版本构建管理器
在npm build完成后，自动将dist内容复制到版本文件夹
版本文件夹命名格式：YYYYMMDD-N (例如：20260110-1)
"""

import os
import shutil
import json
from datetime import datetime
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class VersionBuilder:
    """版本构建管理器"""
    
    def __init__(self, base_dir: str = None):
        """
        初始化版本构建器
        
        Args:
            base_dir: 版本存储基础目录，如果为None则使用默认位置（项目根目录下的versions）
        """
        if base_dir is None:
            # 默认位置：项目根目录下的versions文件夹
            script_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(script_dir)
            base_dir = os.path.join(project_root, "versions")
        
        self.base_dir = base_dir
        self.log_file = os.path.join(base_dir, "version_log.json")
        
        # 确保版本目录存在
        os.makedirs(self.base_dir, exist_ok=True)
        
        # 初始化日志
        self._init_log()
    
    def _init_log(self):
        """初始化版本日志"""
        if not os.path.exists(self.log_file):
            self.versions = []
            self._save_log()
        else:
            try:
                with open(self.log_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.versions = data.get("versions", [])
            except Exception as e:
                logger.error(f"加载版本日志失败: {e}")
                self.versions = []
    
    def _save_log(self):
        """保存版本日志"""
        try:
            data = {
                "versions": self.versions,
                "last_updated": datetime.now().isoformat()
            }
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"保存版本日志失败: {e}")
    
    def _get_next_version_name(self, date_str: str = None) -> str:
        """
        获取下一个版本名称
        
        Args:
            date_str: 日期字符串（格式：YYYYMMDD），如果为None则使用今天
            
        Returns:
            版本名称，格式：YYYYMMDD-N
        """
        if date_str is None:
            date_str = datetime.now().strftime("%Y%m%d")
        
        # 查找今天已有的版本
        today_versions = [v for v in self.versions if v["name"].startswith(date_str)]
        
        # 获取今天的最大序列号
        max_sequence = 0
        for version in today_versions:
            try:
                # 从版本名称中提取序列号：YYYYMMDD-N
                parts = version["name"].split("-")
                if len(parts) == 2:
                    sequence = int(parts[1])
                    max_sequence = max(max_sequence, sequence)
            except (ValueError, IndexError):
                pass
        
        # 生成新序列号
        new_sequence = max_sequence + 1
        version_name = f"{date_str}-{new_sequence}"
        
        return version_name
    
    def create_version_from_dist(self, dist_dir: str, description: str = "") -> dict:
        """
        从dist目录创建新版本
        
        Args:
            dist_dir: dist目录路径
            description: 版本描述
            
        Returns:
            版本信息字典
        """
        if not os.path.exists(dist_dir):
            raise ValueError(f"dist目录不存在: {dist_dir}")
        
        if not os.path.isdir(dist_dir):
            raise ValueError(f"dist必须是目录: {dist_dir}")
        
        # 生成版本名称
        version_name = self._get_next_version_name()
        version_dir = os.path.join(self.base_dir, version_name)
        
        # 确保版本目录存在
        os.makedirs(version_dir, exist_ok=True)
        
        logger.info(f"正在创建版本: {version_name}")
        logger.info(f"源目录: {dist_dir}")
        logger.info(f"目标目录: {version_dir}")
        
        # 复制dist目录内容到版本目录
        copied_files = []
        try:
            for item in os.listdir(dist_dir):
                src = os.path.join(dist_dir, item)
                dst = os.path.join(version_dir, item)
                
                if os.path.isdir(src):
                    shutil.copytree(src, dst, dirs_exist_ok=True)
                    # 统计目录中的文件数
                    for root, dirs, files in os.walk(src):
                        copied_files.extend([os.path.join(root, f) for f in files])
                else:
                    shutil.copy2(src, dst)
                    copied_files.append(src)
            
            file_count = len(copied_files)
            logger.info(f"✓ 版本创建成功: {version_name} ({file_count} 个文件)")
            
        except Exception as e:
            logger.error(f"复制文件失败: {e}")
            # 清理已创建的部分
            if os.path.exists(version_dir):
                shutil.rmtree(version_dir, ignore_errors=True)
            raise
        
        # 创建版本信息
        version_info = {
            "name": version_name,
            "path": version_dir,
            "description": description,
            "created_at": datetime.now().isoformat(),
            "file_count": file_count,
            "status": "created",  # created, deployed, active
            "deployed_at": None,
            "server_path": None
        }
        
        # 添加到版本列表（按创建时间倒序）
        self.versions.insert(0, version_info)
        
        # 只保留最近100个版本记录（可根据需要调整）
        if len(self.versions) > 100:
            # 删除最旧的版本文件夹（可选）
            old_versions = self.versions[100:]
            for old_version in old_versions:
                old_path = old_version.get("path")
                if old_path and os.path.exists(old_path):
                    try:
                        # 可选：自动删除旧版本文件夹
                        # shutil.rmtree(old_path, ignore_errors=True)
                        pass
                    except:
                        pass
            self.versions = self.versions[:100]
        
        # 保存日志
        self._save_log()
        
        return version_info
    
    def get_version_list(self) -> list:
        """获取版本列表"""
        return self.versions.copy()
    
    def get_version_info(self, version_name: str) -> dict:
        """获取指定版本信息"""
        for version in self.versions:
            if version["name"] == version_name:
                return version.copy()
        return None
    
    def get_latest_version(self) -> dict:
        """获取最新版本"""
        if self.versions:
            return self.versions[0].copy()
        return None
    
    def delete_version(self, version_name: str, keep_files: bool = False) -> bool:
        """
        删除版本
        
        Args:
            version_name: 版本名称
            keep_files: 是否保留文件（只从列表中删除）
            
        Returns:
            是否删除成功
        """
        version_info = self.get_version_info(version_name)
        if not version_info:
            raise ValueError(f"版本不存在: {version_name}")
        
        # 从列表中删除
        self.versions = [v for v in self.versions if v["name"] != version_name]
        
        # 删除文件
        if not keep_files:
            version_dir = version_info.get("path")
            if version_dir and os.path.exists(version_dir):
                try:
                    shutil.rmtree(version_dir, ignore_errors=True)
                    logger.info(f"✓ 已删除版本文件夹: {version_dir}")
                except Exception as e:
                    logger.error(f"删除版本文件夹失败: {e}")
                    raise
        
        # 保存日志
        self._save_log()
        
        logger.info(f"✓ 版本已删除: {version_name}")
        return True


def main():
    """命令行入口，用于npm postbuild脚本"""
    import argparse
    
    parser = argparse.ArgumentParser(description="版本构建管理器 - 从dist创建版本")
    parser.add_argument("--dist", type=str, default=None, help="dist目录路径")
    parser.add_argument("--description", type=str, default="", help="版本描述")
    parser.add_argument("--base-dir", type=str, default=None, help="版本存储基础目录")
    
    args = parser.parse_args()
    
    # 默认dist路径（相对于项目根目录）
    if args.dist is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        args.dist = os.path.join(project_root, "dist")
    
    try:
        builder = VersionBuilder(args.base_dir)
        version_info = builder.create_version_from_dist(args.dist, args.description)
        
        print(f"\n✓ 版本创建成功: {version_info['name']}")
        print(f"  版本路径: {version_info['path']}")
        print(f"  文件数量: {version_info['file_count']}")
        print(f"  创建时间: {version_info['created_at']}")
        
        return 0
    
    except Exception as e:
        logger.error(f"创建版本失败: {e}")
        print(f"\n✗ 错误: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())

