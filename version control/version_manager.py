"""
版本管理应用
功能：
1. 上传打包的dist目录到服务器指定位置
2. 控制当前使用的版本，以及切换版本
3. 管理多个不同版本的前端
"""

import os
import json
import shutil
import zipfile
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class VersionManager:
    """版本管理器"""
    
    def __init__(self, config_file: str = None):
        """
        初始化版本管理器
        
        Args:
            config_file: 配置文件路径，如果为None则使用默认配置
        """
        if config_file and os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
        else:
            # 默认配置
            self.config = {
                "base_dir": os.path.join(os.path.dirname(__file__), "versions"),
                "current_version_file": os.path.join(os.path.dirname(__file__), "current_version.json"),
                "version_list_file": os.path.join(os.path.dirname(__file__), "version_list.json"),
                "server_base_path": "/var/www/frontend",  # 服务器前端部署基础路径，需要用户配置
                "upload_method": "local",  # 上传方式：local, sftp, ftp
                "sftp": {
                    "host": "",
                    "port": 22,
                    "username": "",
                    "password": "",
                    "key_file": None
                },
                "ftp": {
                    "host": "",
                    "port": 21,
                    "username": "",
                    "password": ""
                }
            }
            
            # 确保配置目录存在
            os.makedirs(self.config["base_dir"], exist_ok=True)
            self._save_config(config_file or os.path.join(os.path.dirname(__file__), "config.json"))
        
        # 初始化版本列表
        self._init_version_list()
        self._init_current_version()
    
    def _save_config(self, config_file: str):
        """保存配置到文件"""
        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            logger.info(f"配置文件已保存: {config_file}")
        except Exception as e:
            logger.error(f"保存配置文件失败: {e}")
    
    def _init_version_list(self):
        """初始化版本列表"""
        if not os.path.exists(self.config["version_list_file"]):
            self.versions = []
            self._save_version_list()
        else:
            try:
                with open(self.config["version_list_file"], 'r', encoding='utf-8') as f:
                    self.versions = json.load(f)
            except Exception as e:
                logger.error(f"加载版本列表失败: {e}")
                self.versions = []
    
    def _init_current_version(self):
        """初始化当前版本"""
        if not os.path.exists(self.config["current_version_file"]):
            self.current_version = None
            self._save_current_version()
        else:
            try:
                with open(self.config["current_version_file"], 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.current_version = data.get("version")
            except Exception as e:
                logger.error(f"加载当前版本失败: {e}")
                self.current_version = None
    
    def _save_version_list(self):
        """保存版本列表到文件"""
        try:
            with open(self.config["version_list_file"], 'w', encoding='utf-8') as f:
                json.dump(self.versions, f, indent=2, ensure_ascii=False)
            logger.info(f"版本列表已保存: {len(self.versions)} 个版本")
        except Exception as e:
            logger.error(f"保存版本列表失败: {e}")
    
    def _save_current_version(self):
        """保存当前版本到文件"""
        try:
            data = {
                "version": self.current_version,
                "updated_at": datetime.now().isoformat()
            }
            with open(self.config["current_version_file"], 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"当前版本已保存: {self.current_version}")
        except Exception as e:
            logger.error(f"保存当前版本失败: {e}")
    
    def upload_version(self, dist_dir: str, version_name: str = None, description: str = "") -> Dict:
        """
        上传版本到服务器
        
        Args:
            dist_dir: dist目录的路径
            version_name: 版本名称，如果为None则自动生成（基于时间戳）
            description: 版本描述
            
        Returns:
            包含版本信息的字典
        """
        if not os.path.exists(dist_dir):
            raise ValueError(f"dist目录不存在: {dist_dir}")
        
        if not os.path.isdir(dist_dir):
            raise ValueError(f"dist必须是目录: {dist_dir}")
        
        # 生成版本名称
        if not version_name:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            version_name = f"v{timestamp}"
        
        # 检查版本是否已存在
        if any(v["name"] == version_name for v in self.versions):
            raise ValueError(f"版本已存在: {version_name}")
        
        logger.info(f"开始上传版本: {version_name}")
        logger.info(f"源目录: {dist_dir}")
        
        # 创建版本目录
        version_dir = os.path.join(self.config["base_dir"], version_name)
        os.makedirs(version_dir, exist_ok=True)
        
        # 复制dist目录内容到版本目录
        try:
            for item in os.listdir(dist_dir):
                src = os.path.join(dist_dir, item)
                dst = os.path.join(version_dir, item)
                if os.path.isdir(src):
                    shutil.copytree(src, dst, dirs_exist_ok=True)
                else:
                    shutil.copy2(src, dst)
            
            logger.info(f"版本文件已复制到: {version_dir}")
        except Exception as e:
            logger.error(f"复制版本文件失败: {e}")
            shutil.rmtree(version_dir, ignore_errors=True)
            raise
        
        # 创建版本信息
        version_info = {
            "name": version_name,
            "description": description,
            "created_at": datetime.now().isoformat(),
            "local_path": version_dir,
            "server_path": os.path.join(self.config["server_base_path"], version_name).replace("\\", "/"),
            "status": "uploaded"  # uploaded, deployed, active
        }
        
        # 如果使用SFTP或FTP上传，执行上传操作
        if self.config["upload_method"] != "local":
            try:
                self._upload_to_server(version_info)
                version_info["status"] = "deployed"
            except Exception as e:
                logger.error(f"上传到服务器失败: {e}")
                version_info["status"] = "upload_failed"
                version_info["error"] = str(e)
        
        # 添加到版本列表
        self.versions.append(version_info)
        self._save_version_list()
        
        logger.info(f"版本上传完成: {version_name}")
        return version_info
    
    def _upload_to_server(self, version_info: Dict):
        """
        上传版本到服务器（根据配置使用SFTP或FTP）
        
        Args:
            version_info: 版本信息字典
        """
        upload_method = self.config["upload_method"]
        
        if upload_method == "sftp":
            self._upload_via_sftp(version_info)
        elif upload_method == "ftp":
            self._upload_via_ftp(version_info)
        else:
            logger.warning(f"未知的上传方式: {upload_method}，跳过服务器上传")
    
    def _upload_via_sftp(self, version_info: Dict):
        """通过SFTP上传"""
        try:
            import paramiko
        except ImportError:
            raise ImportError("需要安装paramiko库: pip install paramiko")
        
        sftp_config = self.config["sftp"]
        local_path = version_info["local_path"]
        remote_path = version_info["server_path"]
        
        logger.info(f"通过SFTP上传到: {sftp_config['host']}:{remote_path}")
        
        # 创建SSH客户端
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        try:
            # 连接服务器
            if sftp_config.get("key_file"):
                ssh.connect(
                    hostname=sftp_config["host"],
                    port=sftp_config.get("port", 22),
                    username=sftp_config["username"],
                    key_filename=sftp_config["key_file"]
                )
            else:
                ssh.connect(
                    hostname=sftp_config["host"],
                    port=sftp_config.get("port", 22),
                    username=sftp_config["username"],
                    password=sftp_config["password"]
                )
            
            sftp = ssh.open_sftp()
            
            # 创建远程目录
            try:
                sftp.mkdir(remote_path)
            except IOError:
                pass  # 目录可能已存在
            
            # 递归上传文件
            self._sftp_upload_recursive(sftp, local_path, remote_path)
            
            sftp.close()
            ssh.close()
            
            logger.info("SFTP上传完成")
        except Exception as e:
            logger.error(f"SFTP上传失败: {e}")
            raise
    
    def _sftp_upload_recursive(self, sftp, local_dir: str, remote_dir: str):
        """递归上传目录"""
        import paramiko
        
        # 确保远程目录存在
        try:
            sftp.mkdir(remote_dir)
        except IOError:
            pass
        
        for item in os.listdir(local_dir):
            local_path = os.path.join(local_dir, item)
            remote_path = f"{remote_dir}/{item}".replace("\\", "/")
            
            if os.path.isdir(local_path):
                self._sftp_upload_recursive(sftp, local_path, remote_path)
            else:
                sftp.put(local_path, remote_path)
                logger.debug(f"上传文件: {remote_path}")
    
    def _upload_via_ftp(self, version_info: Dict):
        """通过FTP上传"""
        try:
            from ftplib import FTP
        except ImportError:
            raise ImportError("需要安装ftplib库（Python标准库，通常已包含）")
        
        ftp_config = self.config["ftp"]
        local_path = version_info["local_path"]
        remote_path = version_info["server_path"]
        
        logger.info(f"通过FTP上传到: {ftp_config['host']}:{remote_path}")
        
        try:
            # 连接FTP服务器
            ftp = FTP()
            ftp.connect(ftp_config["host"], ftp_config.get("port", 21))
            ftp.login(ftp_config["username"], ftp_config["password"])
            ftp.encoding = 'utf-8'
            
            # 创建远程目录
            try:
                ftp.mkd(remote_path)
            except Exception:
                pass  # 目录可能已存在
            
            # 切换目录
            ftp.cwd(remote_path)
            
            # 递归上传文件
            self._ftp_upload_recursive(ftp, local_path, "")
            
            ftp.quit()
            
            logger.info("FTP上传完成")
        except Exception as e:
            logger.error(f"FTP上传失败: {e}")
            raise
    
    def _ftp_upload_recursive(self, ftp, local_dir: str, remote_subdir: str):
        """递归上传目录到FTP"""
        for item in os.listdir(local_dir):
            local_path = os.path.join(local_dir, item)
            remote_path = f"{remote_subdir}/{item}" if remote_subdir else item
            
            if os.path.isdir(local_path):
                try:
                    ftp.mkd(remote_path)
                except Exception:
                    pass
                ftp.cwd(remote_path)
                self._ftp_upload_recursive(ftp, local_path, remote_path)
                ftp.cwd("..")
            else:
                with open(local_path, 'rb') as f:
                    ftp.storbinary(f"STOR {remote_path}", f)
                logger.debug(f"上传文件: {remote_path}")
    
    def get_version_list(self) -> List[Dict]:
        """获取版本列表"""
        return self.versions.copy()
    
    def get_version_info(self, version_name: str) -> Optional[Dict]:
        """获取指定版本信息"""
        for version in self.versions:
            if version["name"] == version_name:
                return version.copy()
        return None
    
    def get_current_version(self) -> Optional[str]:
        """获取当前使用的版本"""
        return self.current_version
    
    def set_current_version(self, version_name: str) -> bool:
        """
        切换当前使用的版本
        
        Args:
            version_name: 版本名称
            
        Returns:
            是否切换成功
        """
        # 检查版本是否存在
        version_info = self.get_version_info(version_name)
        if not version_info:
            raise ValueError(f"版本不存在: {version_name}")
        
        # 更新当前版本
        old_version = self.current_version
        self.current_version = version_name
        
        # 更新版本状态
        for version in self.versions:
            if version["name"] == version_name:
                version["status"] = "active"
            elif version["name"] == old_version:
                version["status"] = "deployed" if version["status"] == "active" else version["status"]
        
        self._save_current_version()
        self._save_version_list()
        
        logger.info(f"版本已切换: {old_version} -> {version_name}")
        return True
    
    def delete_version(self, version_name: str, keep_files: bool = False) -> bool:
        """
        删除版本
        
        Args:
            version_name: 版本名称
            keep_files: 是否保留文件（只从列表中删除）
            
        Returns:
            是否删除成功
        """
        # 不能删除当前使用的版本
        if version_name == self.current_version:
            raise ValueError(f"无法删除当前使用的版本: {version_name}")
        
        # 从版本列表中查找并删除
        version_info = None
        for i, version in enumerate(self.versions):
            if version["name"] == version_name:
                version_info = version
                del self.versions[i]
                break
        
        if not version_info:
            raise ValueError(f"版本不存在: {version_name}")
        
        # 删除文件
        if not keep_files:
            local_path = version_info.get("local_path")
            if local_path and os.path.exists(local_path):
                try:
                    shutil.rmtree(local_path)
                    logger.info(f"已删除版本文件: {local_path}")
                except Exception as e:
                    logger.error(f"删除版本文件失败: {e}")
            
            # 如果已部署到服务器，可以选择删除服务器上的文件
            # 这里暂时不实现，需要用户手动处理
        
        self._save_version_list()
        logger.info(f"版本已删除: {version_name}")
        return True
    
    def export_version_as_zip(self, version_name: str, output_path: str = None) -> str:
        """
        将版本导出为ZIP文件
        
        Args:
            version_name: 版本名称
            output_path: 输出ZIP文件路径，如果为None则自动生成
            
        Returns:
            ZIP文件路径
        """
        version_info = self.get_version_info(version_name)
        if not version_info:
            raise ValueError(f"版本不存在: {version_name}")
        
        local_path = version_info["local_path"]
        if not os.path.exists(local_path):
            raise ValueError(f"版本文件不存在: {local_path}")
        
        if not output_path:
            output_path = os.path.join(
                os.path.dirname(__file__),
                f"{version_name}.zip"
            )
        
        logger.info(f"导出版本为ZIP: {output_path}")
        
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(local_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arc_name = os.path.relpath(file_path, local_path)
                    zipf.write(file_path, arc_name)
        
        logger.info(f"版本导出完成: {output_path}")
        return output_path


def main():
    """命令行入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="前端版本管理工具")
    parser.add_argument("--config", type=str, help="配置文件路径")
    
    subparsers = parser.add_subparsers(dest="command", help="命令")
    
    # 上传版本
    upload_parser = subparsers.add_parser("upload", help="上传版本")
    upload_parser.add_argument("dist_dir", type=str, help="dist目录路径")
    upload_parser.add_argument("--name", type=str, help="版本名称")
    upload_parser.add_argument("--description", type=str, default="", help="版本描述")
    
    # 列出版本
    list_parser = subparsers.add_parser("list", help="列出所有版本")
    
    # 切换版本
    switch_parser = subparsers.add_parser("switch", help="切换当前版本")
    switch_parser.add_argument("version_name", type=str, help="版本名称")
    
    # 删除版本
    delete_parser = subparsers.add_parser("delete", help="删除版本")
    delete_parser.add_argument("version_name", type=str, help="版本名称")
    delete_parser.add_argument("--keep-files", action="store_true", help="保留文件")
    
    # 导出版本
    export_parser = subparsers.add_parser("export", help="导出版本为ZIP")
    export_parser.add_argument("version_name", type=str, help="版本名称")
    export_parser.add_argument("--output", type=str, help="输出ZIP文件路径")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        manager = VersionManager(args.config)
        
        if args.command == "upload":
            version_info = manager.upload_version(
                args.dist_dir,
                args.name,
                args.description
            )
            print(f"版本上传成功: {version_info['name']}")
            print(f"  描述: {version_info['description']}")
            print(f"  路径: {version_info['local_path']}")
            print(f"  状态: {version_info['status']}")
        
        elif args.command == "list":
            versions = manager.get_version_list()
            current = manager.get_current_version()
            print(f"\n当前版本: {current or '未设置'}")
            print(f"\n版本列表 ({len(versions)} 个):")
            for v in versions:
                marker = " [当前]" if v["name"] == current else ""
                print(f"  {v['name']}{marker}")
                print(f"    描述: {v.get('description', '无')}")
                print(f"    创建时间: {v['created_at']}")
                print(f"    状态: {v['status']}")
                print()
        
        elif args.command == "switch":
            success = manager.set_current_version(args.version_name)
            if success:
                print(f"版本已切换为: {args.version_name}")
        
        elif args.command == "delete":
            success = manager.delete_version(args.version_name, args.keep_files)
            if success:
                print(f"版本已删除: {args.version_name}")
        
        elif args.command == "export":
            output = manager.export_version_as_zip(args.version_name, args.output)
            print(f"版本已导出: {output}")
    
    except Exception as e:
        logger.error(f"执行失败: {e}")
        print(f"错误: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())

