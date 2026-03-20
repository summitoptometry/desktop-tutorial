"""
一键部署脚本
将本地dist目录的文件上传到服务器指定位置，并记录部署日志
"""

import os
import json
import paramiko
from datetime import datetime
from pathlib import Path
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SimpleDeployer:
    """简单的部署器，用于一键上传文件到服务器"""
    
    def __init__(self, config_file: str = None):
        """
        初始化部署器
        
        Args:
            config_file: 配置文件路径，如果为None则尝试加载默认配置
        """
        if config_file and os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
        else:
            # 默认配置路径
            default_config = os.path.join(os.path.dirname(__file__), 'deploy_config.json')
            if os.path.exists(default_config):
                with open(default_config, 'r', encoding='utf-8') as f:
                    self.config = json.load(f)
            else:
                raise FileNotFoundError(
                    f"配置文件不存在: {default_config}\n"
                    "请创建 deploy_config.json 配置文件"
                )
        
        # 验证必需配置
        required_keys = ['server_host', 'server_port', 'server_username', 'server_password', 'server_path']
        for key in required_keys:
            if key not in self.config:
                raise ValueError(f"配置文件缺少必需的配置项: {key}")
    
    def deploy(self, dist_dir: str = None, description: str = ""):
        """
        一键部署dist目录到服务器
        
        Args:
            dist_dir: dist目录路径，如果为None则使用默认路径（当前目录下的dist）
            description: 部署描述，会记录到日志中
        """
        if dist_dir is None:
            # 默认使用脚本所在目录的上级目录中的dist
            dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
        
        if not os.path.exists(dist_dir):
            raise ValueError(f"dist目录不存在: {dist_dir}\n请先运行 npm run build 构建项目")
        
        if not os.path.isdir(dist_dir):
            raise ValueError(f"dist必须是目录: {dist_dir}")
        
        logger.info("=" * 60)
        logger.info("开始部署")
        logger.info(f"源目录: {dist_dir}")
        logger.info(f"目标服务器: {self.config['server_host']}:{self.config['server_port']}")
        logger.info(f"目标路径: {self.config['server_path']}")
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
            server_path = self.config['server_path']
            self._ensure_remote_directory(sftp, server_path)
            self._ensure_remote_directory(sftp, f"{server_path}/assets")
            self._ensure_remote_directory(sftp, f"{server_path}/static")
            if 'templates' in os.listdir(dist_dir):
                self._ensure_remote_directory(sftp, f"{server_path}/templates")
            
            # 部署文件
            deployed_files = []
            
            # 1. 部署 index.html
            index_html_src = os.path.join(dist_dir, "index.html")
            if os.path.exists(index_html_src):
                index_html_dst = f"{server_path}/index.html"
                self._upload_file(sftp, index_html_src, index_html_dst)
                deployed_files.append(("index.html", index_html_dst))
                logger.info(f"✓ 已部署: index.html -> {index_html_dst}")
            
            # 2. 部署 assets 目录
            assets_src = os.path.join(dist_dir, "assets")
            if os.path.exists(assets_src) and os.path.isdir(assets_src):
                count = self._upload_directory(sftp, assets_src, f"{server_path}/assets", deployed_files)
                logger.info(f"✓ 已部署 assets 目录: {count} 个文件")
            
            # 3. 部署 static 目录
            static_src = os.path.join(dist_dir, "static")
            if os.path.exists(static_src) and os.path.isdir(static_src):
                count = self._upload_directory(sftp, static_src, f"{server_path}/static", deployed_files)
                logger.info(f"✓ 已部署 static 目录: {count} 个文件")
            
            # 4. 部署 templates 目录（如果存在）
            templates_src = os.path.join(dist_dir, "templates")
            if os.path.exists(templates_src) and os.path.isdir(templates_src):
                count = self._upload_directory(sftp, templates_src, f"{server_path}/templates", deployed_files)
                logger.info(f"✓ 已部署 templates 目录: {count} 个文件")
            
            # 记录部署日志
            log_entry = self._create_log_entry(deployed_files, description)
            self._write_deploy_log(sftp, server_path, log_entry)
            
            logger.info("=" * 60)
            logger.info("部署完成！")
            logger.info(f"总共部署 {len(deployed_files)} 个文件")
            logger.info("=" * 60)
            
            return {
                "success": True,
                "files_count": len(deployed_files),
                "deployed_files": deployed_files,
                "log_entry": log_entry
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
            # 关闭连接
            if sftp:
                sftp.close()
            if ssh:
                ssh.close()
            logger.info("已关闭服务器连接")
    
    def _ensure_remote_directory(self, sftp, remote_dir):
        """确保远程目录存在"""
        try:
            # 尝试列出目录（如果目录不存在会抛出异常）
            sftp.listdir(remote_dir)
        except IOError:
            # 目录不存在，创建它
            # 需要逐级创建目录
            dirs = remote_dir.strip('/').split('/')
            current_path = ''
            for dir_name in dirs:
                if dir_name:
                    current_path = f"{current_path}/{dir_name}" if current_path else f"/{dir_name}"
                    try:
                        sftp.mkdir(current_path)
                        logger.debug(f"创建远程目录: {current_path}")
                    except IOError:
                        pass  # 目录可能已存在
    
    def _upload_file(self, sftp, local_path, remote_path):
        """上传单个文件"""
        try:
            sftp.put(local_path, remote_path)
            logger.debug(f"上传文件: {os.path.basename(local_path)} -> {remote_path}")
        except Exception as e:
            logger.error(f"上传文件失败 {local_path} -> {remote_path}: {e}")
            raise
    
    def _upload_directory(self, sftp, local_dir, remote_dir, deployed_files_list):
        """递归上传目录"""
        file_count = 0
        
        for root, dirs, files in os.walk(local_dir):
            # 计算相对路径
            rel_path = os.path.relpath(root, local_dir)
            
            # 构建远程目录路径
            if rel_path == '.':
                remote_subdir = remote_dir
            else:
                remote_subdir = f"{remote_dir}/{rel_path}".replace("\\", "/")
            
            # 确保远程子目录存在
            self._ensure_remote_directory(sftp, remote_subdir)
            
            # 上传文件
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
    
    def _create_log_entry(self, deployed_files, description):
        """创建部署日志条目"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = {
            "timestamp": timestamp,
            "description": description or "自动部署",
            "files_count": len(deployed_files),
            "files": deployed_files[:10]  # 只记录前10个文件，避免日志过长
        }
        if len(deployed_files) > 10:
            log_entry["note"] = f"共 {len(deployed_files)} 个文件，此处仅显示前10个"
        return log_entry
    
    def _write_deploy_log(self, sftp, server_path, log_entry):
        """在服务器上写入或追加部署日志"""
        log_file = f"{server_path}/deploy_log.json"
        
        try:
            # 尝试读取现有日志
            try:
                with sftp.open(log_file, 'r') as f:
                    existing_logs = json.load(f)
                    if not isinstance(existing_logs, list):
                        existing_logs = [existing_logs]
            except IOError:
                # 日志文件不存在，创建新的日志列表
                existing_logs = []
            
            # 添加新日志条目
            existing_logs.append(log_entry)
            
            # 只保留最近50条日志
            if len(existing_logs) > 50:
                existing_logs = existing_logs[-50:]
            
            # 写入日志文件
            with sftp.open(log_file, 'w') as f:
                json.dump(existing_logs, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✓ 部署日志已记录: {log_file}")
            
        except Exception as e:
            logger.warning(f"记录部署日志失败: {e}，但不影响部署")


def main():
    """命令行入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="一键部署脚本 - 将dist目录上传到服务器")
    parser.add_argument(
        "--dist",
        type=str,
        default=None,
        help="dist目录路径（默认：项目根目录下的dist）"
    )
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="配置文件路径（默认：deploy_config.json）"
    )
    parser.add_argument(
        "--description",
        type=str,
        default="",
        help="部署描述，会记录到日志中"
    )
    
    args = parser.parse_args()
    
    try:
        # 创建部署器
        deployer = SimpleDeployer(args.config)
        
        # 执行部署
        result = deployer.deploy(args.dist, args.description)
        
        if result["success"]:
            print("\n" + "=" * 60)
            print("✓ 部署成功！")
            print(f"  部署文件数: {result['files_count']}")
            print(f"  部署时间: {result['log_entry']['timestamp']}")
            print("=" * 60)
            return 0
        else:
            print("\n✗ 部署失败")
            return 1
    
    except FileNotFoundError as e:
        print(f"\n✗ 错误: {e}")
        print("\n请创建 deploy_config.json 配置文件，格式如下:")
        print("""
{
  "server_host": "your-server.com",
  "server_port": 22,
  "server_username": "admin",
  "server_password": "your-password",
  "server_path": "/home/admin/eye/media/exehtml"
}
        """)
        return 1
    except Exception as e:
        print(f"\n✗ 部署失败: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())

