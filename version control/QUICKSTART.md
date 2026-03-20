# 版本管理系统快速开始指南

## 概述

版本管理系统可以帮助您管理前端应用的多个版本，支持版本上传、切换和管理。

## 功能特性

✅ 上传dist目录到服务器指定位置  
✅ 控制当前使用的版本  
✅ 切换版本  
✅ 用户登录页面版本选择  
✅ 支持本地、SFTP、FTP多种上传方式  

## 快速开始

### 方式一：作为独立Python脚本使用

#### 1. 安装依赖

```bash
pip install paramiko  # 如果使用SFTP上传
```

#### 2. 配置（可选）

如果使用默认配置，可以跳过此步骤。默认配置会将版本存储在 `./versions` 目录。

如需自定义配置，创建 `config.json`：

```json
{
  "base_dir": "./versions",
  "server_base_path": "/var/www/frontend",
  "upload_method": "local"
}
```

#### 3. 使用命令行

```bash
# 在项目根目录执行
cd "version control"

# 上传版本
python version_manager.py upload ../dist --name v1.0.0 --description "初始版本"

# 查看版本列表
python version_manager.py list

# 切换版本
python version_manager.py switch v1.0.0
```

### 方式二：作为Django应用使用

#### 1. 复制应用到Django项目

将 `version control` 目录复制到Django项目目录，或者重命名为 `version_control`（推荐使用下划线）。

#### 2. 安装依赖

```bash
pip install -r "version control/requirements.txt"
```

#### 3. 配置Django

在 `settings.py` 中添加：

```python
INSTALLED_APPS = [
    # ...
    'version_control',  # 根据实际目录名称修改
]

# 可选：指定配置文件路径
VERSION_MANAGER_CONFIG = os.path.join(BASE_DIR, 'version_control', 'config.json')
```

在主 `urls.py` 中包含URL：

```python
from django.urls import path, include

urlpatterns = [
    # ...
    path('api/version/', include('version_control.urls')),
]
```

#### 4. 配置CORS（如果前端在不同域名）

在 `settings.py` 中确保CORS配置正确：

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://your-frontend-domain.com",
]

CORS_ALLOW_CREDENTIALS = True
```

#### 5. 运行迁移（如果使用数据库，当前版本使用JSON文件，不需要迁移）

```bash
python manage.py migrate
```

#### 6. 测试API

```bash
# 获取版本列表
curl http://localhost:8000/api/version/list/

# 切换版本
curl -X POST http://localhost:8000/api/version/switch/ \
  -H "Content-Type: application/json" \
  -d '{"version_name": "v1.0.0"}'
```

## 前端集成

前端登录页面已经集成了版本选择功能。确保：

1. ✅ Django API端点已配置并运行
2. ✅ CORS已正确配置
3. ✅ 前端可以访问 `/api/version/` 端点

版本选择器会自动在登录页面显示，用户可以选择要使用的版本。

## 上传方式配置

### 本地存储（默认）

```json
{
  "upload_method": "local",
  "base_dir": "./versions",
  "server_base_path": "/var/www/frontend"
}
```

### SFTP上传

```json
{
  "upload_method": "sftp",
  "server_base_path": "/var/www/frontend",
  "sftp": {
    "host": "your-server.com",
    "port": 22,
    "username": "your-username",
    "password": "your-password",
    "key_file": "/path/to/private/key"  // 可选，使用密钥文件
  }
}
```

### FTP上传

```json
{
  "upload_method": "ftp",
  "server_base_path": "/var/www/frontend",
  "ftp": {
    "host": "your-ftp-server.com",
    "port": 21,
    "username": "your-username",
    "password": "your-password"
  }
}
```

## 工作流程示例

### 1. 构建和上传新版本

```bash
# 1. 构建前端项目
npm run build

# 2. 上传版本
python version_manager.py upload ./dist --name v1.0.1 --description "修复登录bug"
```

### 2. 切换版本

```bash
# 命令行切换
python version_manager.py switch v1.0.1

# 或通过API
curl -X POST http://localhost:8000/api/version/switch/ \
  -H "Content-Type: application/json" \
  -d '{"version_name": "v1.0.1"}'

# 或在前端登录页面选择版本
```

### 3. 查看版本列表

```bash
# 命令行查看
python version_manager.py list

# 或通过API
curl http://localhost:8000/api/version/list/
```

### 4. 删除旧版本

```bash
# 删除版本（保留文件）
python version_manager.py delete v1.0.0 --keep-files

# 删除版本（删除文件）
python version_manager.py delete v1.0.0
```

## 常见问题

### Q: 如何配置服务器部署路径？

A: 在 `config.json` 中修改 `server_base_path` 字段，例如：
```json
{
  "server_base_path": "/var/www/html/frontend"
}
```

### Q: 切换版本后需要重启服务器吗？

A: 如果使用Nginx等Web服务器，切换版本后可能需要更新Nginx配置指向新版本目录，然后重载配置：
```bash
sudo nginx -s reload
```

### Q: 如何在生产环境中使用？

A: 
1. 配置正确的服务器路径和连接信息
2. 确保服务器有写入权限
3. 配置Nginx/Apache指向版本目录
4. 在生产环境中禁用调试模式

### Q: 前端如何获取当前版本？

A: 前端登录页面会自动从 `/api/version/list/` 获取版本列表和当前版本，无需额外配置。

## 下一步

- 阅读 [完整文档](README.md)
- 查看 [使用示例](example_usage.py)
- 配置服务器部署路径
- 测试版本上传和切换功能

