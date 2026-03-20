"""
版本部署脚本 V2
支持从版本文件夹选择并部署，记录本地版本日志
"""

import os
import json
import paramiko
from datetime import datetime
from pathlib import Path
import logging
import sys

# 添加当前目录到路径，以便导入version_builder
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from version_builder import VersionBuilder

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class VersionDeployer:
    """版本部署器"""
    
    def __init__(self, config_file: str = None):
        """
        初始化部署器
        
        Args:
            config_file: 配置文件路径
        """
        if config_file and os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
        else:
            default_config = os.path.join(os.path.dirname(__file__), 'deploy_config.json')
            if os.path.exists(default_config):
                with open(default_config, 'r', encoding='utf-8') as f:
                    self.config = json.load(f)
            else:
                raise FileNotFoundError(
                    f"配置文件不存在: {default_config}\n"
                    "请创建 deploy_config.json 配置文件"
                )
        
        # 验证配置
        required_keys = ['server_host', 'server_port', 'server_username', 'server_password', 'server_path']
        for key in required_keys:
            if key not in self.config:
                raise ValueError(f"配置文件缺少必需的配置项: {key}")
        
        # 初始化版本构建器
        self.version_builder = VersionBuilder()
    
    def list_versions(self):
        """列出所有可用版本"""
        versions = self.version_builder.get_version_list()
        return versions
    
    def deploy_version(self, version_name: str = None, description: str = "", version_type: str = "v1"):
        """
        部署指定版本到服务器
        
        Args:
            version_name: 版本名称，如果为None则使用最新版本
            description: 部署描述
            version_type: 版本类型，'v1' 表示稳定版，'v2' 表示测试版
        """
        # 获取版本信息
        if version_name is None:
            version_info = self.version_builder.get_latest_version()
            if not version_info:
                raise ValueError("没有可用的版本，请先运行 npm run build 创建版本")
            version_name = version_info["name"]
        else:
            version_info = self.version_builder.get_version_info(version_name)
            if not version_info:
                raise ValueError(f"版本不存在: {version_name}")
        
        version_dir = version_info["path"]
        
        # 根据版本类型确定部署路径
        base_path = self.config['server_path']
        if version_type == "v2":
            server_path = f"{base_path}/v2"
        else:
            # 默认使用 v1（稳定版）
            server_path = f"{base_path}/v1"
        
        if not os.path.exists(version_dir):
            raise ValueError(f"版本文件夹不存在: {version_dir}")
        
        logger.info("=" * 60)
        logger.info(f"开始部署版本: {version_name}")
        logger.info(f"版本类型: {version_type} ({'稳定版' if version_type == 'v1' else '测试版'})")
        logger.info(f"版本目录: {version_dir}")
        logger.info(f"目标服务器: {self.config['server_host']}:{self.config['server_port']}")
        logger.info(f"目标路径: {server_path}")
        logger.info("=" * 60)
        
        # 连接服务器
        ssh = None
        sftp = None
        
        try:
            # 创建SSH客户端
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # 连接服务器
            logger.info(f"正在连接服务器 {self.config['server_host']}...")
            ssh.connect(
                hostname=self.config['server_host'],
                port=self.config.get('server_port', 22),
                username=self.config['server_username'],
                password=self.config['server_password'],
                timeout=30
            )
            logger.info("✓ 服务器连接成功")
            
            # 打开SFTP连接
            sftp = ssh.open_sftp()
            
            # 确保服务器目标目录存在
            self._ensure_remote_directory(sftp, server_path)
            self._ensure_remote_directory(sftp, f"{server_path}/assets")
            
            # 部署文件
            deployed_files = []
            
            # 1. 部署 index.html 到根目录
            index_html_src = os.path.join(version_dir, "index.html")
            if os.path.exists(index_html_src):
                index_html_dst = f"{server_path}/index.html"
                self._upload_file(sftp, index_html_src, index_html_dst)
                deployed_files.append(("index.html", index_html_dst))
                logger.info(f"✓ 已部署: index.html -> {index_html_dst}")
            
            # 2. 部署 assets 目录中的内容到 assets 子目录
            assets_src = os.path.join(version_dir, "assets")
            if os.path.exists(assets_src) and os.path.isdir(assets_src):
                count_assets = self._upload_directory(sftp, assets_src, f"{server_path}/assets", deployed_files)
                logger.info(f"✓ 已部署 assets 目录到 {server_path}/assets/: {count_assets} 个文件")
            
            # 3. 部署 assets 目录中的内容到根目录（同名文件覆盖）
            if os.path.exists(assets_src) and os.path.isdir(assets_src):
                count_root = self._upload_directory_to_root(sftp, assets_src, server_path, deployed_files)
                logger.info(f"✓ 已部署 assets 内容到根目录 {server_path}/: {count_root} 个文件")
            
            # 更新版本状态
            version_info["status"] = "deployed"
            version_info["deployed_at"] = datetime.now().isoformat()
            version_info["server_path"] = server_path
            
            # 更新版本列表中的信息
            for v in self.version_builder.versions:
                if v["name"] == version_name:
                    v.update(version_info)
                    break
            
            self.version_builder._save_log()
            
            # 记录本地部署日志
            self._write_local_deploy_log(version_info, deployed_files, description, server_path)
            
            logger.info("=" * 60)
            logger.info("部署完成！")
            logger.info(f"版本: {version_name}")
            logger.info(f"部署文件数: {len(deployed_files)}")
            logger.info("=" * 60)
            
            return {
                "success": True,
                "version_name": version_name,
                "files_count": len(deployed_files),
                "deployed_files": deployed_files
            }
        
        except paramiko.AuthenticationException:
            error_msg = "服务器认证失败，请检查用户名和密码"
            logger.error(f"✗ {error_msg}")
            raise Exception(error_msg)
        except paramiko.SSHException as e:
            error_msg = f"SSH连接错误: {str(e)}"
            logger.error(f"✗ {error_msg}")
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"部署失败: {str(e)}"
            logger.error(f"✗ {error_msg}")
            raise Exception(error_msg)
        finally:
            if sftp:
                sftp.close()
            if ssh:
                ssh.close()
            logger.info("已关闭服务器连接")
    
    def _ensure_remote_directory(self, sftp, remote_dir):
        """确保远程目录存在（逐级创建，失败时提示权限或路径问题）"""
        try:
            sftp.listdir(remote_dir)
            return
        except IOError:
            pass
        dirs = remote_dir.strip('/').split('/')
        current_path = ''
        for dir_name in dirs:
            if not dir_name:
                continue
            current_path = f"{current_path}/{dir_name}" if current_path else f"/{dir_name}"
            try:
                sftp.listdir(current_path)
            except IOError:
                try:
                    sftp.mkdir(current_path)
                    logger.info(f"已创建远程目录: {current_path}")
                except IOError as e:
                    try:
                        sftp.listdir(current_path)
                    except IOError:
                        raise RuntimeError(
                            f"无法创建远程目录: {current_path}\n"
                            f"错误: {e}\n"
                            f"请检查 deploy_config.json 中的 server_path 是否正确，"
                            f"以及用户 {self.config.get('server_username')} 是否有权限在该路径下创建目录。"
                        ) from e
    
    def _upload_file(self, sftp, local_path, remote_path):
        """上传单个文件"""
        if not os.path.exists(local_path):
            raise FileNotFoundError(f"本地文件不存在: {local_path}")
        try:
            sftp.put(local_path, remote_path)
            logger.debug(f"上传: {os.path.basename(local_path)}")
        except (IOError, OSError) as e:
            err_msg = str(e).lower()
            if "errno 2" in err_msg or "no such file" in err_msg:
                logger.error(
                    f"上传失败（远程路径可能不存在）: 本地 {local_path} -> 远程 {remote_path}\n"
                    f"若远程目录已存在，请检查 deploy_config.json 中的 server_path 及对应用户权限。"
                )
            else:
                logger.error(f"上传文件失败 {local_path} -> {remote_path}: {e}")
            raise
    
    def _upload_directory(self, sftp, local_dir, remote_dir, deployed_files_list):
        """递归上传目录到指定远程目录"""
        file_count = 0
        
        for root, dirs, files in os.walk(local_dir):
            rel_path = os.path.relpath(root, local_dir)
            
            if rel_path == '.':
                remote_subdir = remote_dir
            else:
                remote_subdir = f"{remote_dir}/{rel_path}".replace("\\", "/")
            
            self._ensure_remote_directory(sftp, remote_subdir)
            
            for file in files:
                local_file = os.path.join(root, file)
                remote_file = f"{remote_subdir}/{file}".replace("\\", "/")
                
                try:
                    self._upload_file(sftp, local_file, remote_file)
                    deployed_files_list.append((os.path.relpath(local_file, local_dir), remote_file))
                    file_count += 1
                except Exception as e:
                    logger.error(f"跳过文件 {local_file}: {e}")
                    continue
        
        return file_count
    
    def _upload_directory_to_root(self, sftp, local_dir, remote_root, deployed_files_list):
        """将目录中的文件上传到远程根目录（不保留子目录结构）"""
        file_count = 0
        
        for root, dirs, files in os.walk(local_dir):
            for file in files:
                local_file = os.path.join(root, file)
                # 直接上传到根目录，同名文件会覆盖
                remote_file = f"{remote_root}/{file}".replace("\\", "/")
                
                try:
                    self._upload_file(sftp, local_file, remote_file)
                    deployed_files_list.append((os.path.relpath(local_file, local_dir), f"ROOT:{remote_file}"))
                    file_count += 1
                except Exception as e:
                    logger.error(f"跳过文件 {local_file}: {e}")
                    continue
        
        return file_count
    
    def _write_local_deploy_log(self, version_info, deployed_files, description, server_path):
        """写入本地部署日志"""
        log_dir = self.version_builder.base_dir
        log_file = os.path.join(log_dir, "deploy_log.json")
        
        try:
            # 读取现有日志
            if os.path.exists(log_file):
                with open(log_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    deploy_logs = data.get("deployments", [])
            else:
                deploy_logs = []
            
            # 创建新日志条目
            log_entry = {
                "version_name": version_info["name"],
                "version_path": version_info["path"],
                "deployed_at": datetime.now().isoformat(),
                "description": description or "版本部署",
                "server_host": self.config['server_host'],
                "server_path": server_path,
                "files_count": len(deployed_files),
                "files": deployed_files[:20]  # 只记录前20个文件
            }
            if len(deployed_files) > 20:
                log_entry["note"] = f"共 {len(deployed_files)} 个文件，此处仅显示前20个"
            
            # 添加到日志列表
            deploy_logs.insert(0, log_entry)
            
            # 只保留最近100次部署记录
            if len(deploy_logs) > 100:
                deploy_logs = deploy_logs[:100]
            
            # 保存日志
            data = {
                "deployments": deploy_logs,
                "last_updated": datetime.now().isoformat()
            }
            
            with open(log_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✓ 部署日志已记录到: {log_file}")
            
        except Exception as e:
            logger.warning(f"记录部署日志失败: {e}，但不影响部署")


def main():
    """命令行入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="版本部署工具 - 从版本文件夹部署到服务器")
    parser.add_argument(
        "--version",
        type=str,
        default=None,
        help="要部署的版本名称（格式：YYYYMMDD-N），如果不指定则使用最新版本"
    )
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="配置文件路径"
    )
    parser.add_argument(
        "--description",
        type=str,
        default="",
        help="部署描述"
    )
    parser.add_argument(
        "--version-type",
        type=str,
        choices=["v1", "v2"],
        default="v1",
        help="版本类型: v1=稳定版, v2=测试版 (默认: v1)"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="列出所有可用版本"
    )
    
    args = parser.parse_args()
    
    try:
        deployer = VersionDeployer(args.config)
        
        # 如果是列出版本
        if args.list:
            versions = deployer.list_versions()
            if not versions:
                print("\n暂无可用版本")
                return 0
            
            print(f"\n可用版本列表 (共 {len(versions)} 个):")
            print("=" * 80)
            print(f"{'版本名称':<15} {'状态':<10} {'文件数':<10} {'创建时间':<20} {'描述':<20}")
            print("-" * 80)
            
            for v in versions[:20]:
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
            
            print("=" * 80)
            return 0
        
        # 执行部署
        result = deployer.deploy_version(args.version, args.description, args.version_type)
        
        if result["success"]:
            print("\n" + "=" * 60)
            print("✓ 部署成功！")
            print(f"  版本: {result['version_name']}")
            print(f"  部署文件数: {result['files_count']}")
            print("=" * 60)
            return 0
        else:
            print("\n✗ 部署失败")
            return 1
    
    except FileNotFoundError as e:
        print(f"\n✗ 错误: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ 部署失败: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())

