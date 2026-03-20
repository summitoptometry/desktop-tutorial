# 版本管理系统

用于管理前端应用多个版本的Python应用，支持版本上传、切换和管理。

## 功能特性

1. **版本上传**：将打包的dist目录上传到服务器指定位置
2. **版本控制**：管理多个不同版本的前端应用
3. **版本切换**：支持切换当前使用的版本
4. **版本列表**：查看所有可用版本及其信息
5. **版本删除**：删除不再需要的版本（可选择保留文件）

## 安装依赖

```bash
# 基础依赖（Python标准库已包含）
# 如果使用SFTP上传，需要安装paramiko
pip install paramiko

# 如果使用FTP上传，Python标准库已包含ftplib
```

## 配置说明

### 1. 配置文件

创建 `config.json` 文件（或使用默认配置）：

```json
{
  "base_dir": "./versions",
  "current_version_file": "./current_version.json",
  "version_list_file": "./version_list.json",
  "server_base_path": "/var/www/frontend",
  "upload_method": "local",
  "sftp": {
    "host": "your-server.com",
    "port": 22,
    "username": "your-username",
    "password": "your-password",
    "key_file": null
  },
  "ftp": {
    "host": "your-ftp-server.com",
    "port": 21,
    "username": "your-username",
    "password": "your-password"
  }
}
```

### 配置项说明：

- `base_dir`: 本地版本存储目录
- `current_version_file`: 当前版本信息文件路径
- `version_list_file`: 版本列表文件路径
- `server_base_path`: 服务器前端部署基础路径
- `upload_method`: 上传方式 (`local`, `sftp`, `ftp`)
- `sftp`: SFTP连接配置
- `ftp`: FTP连接配置

## 使用方法

### 命令行使用

```bash
# 上传版本
python version_manager.py upload ./dist --name v1.0.0 --description "初始版本"

# 列出所有版本
python version_manager.py list

# 切换当前版本
python version_manager.py switch v1.0.0

# 删除版本
python version_manager.py delete v1.0.0

# 导出版本为ZIP
python version_manager.py export v1.0.0 --output ./v1.0.0.zip

# 使用自定义配置文件
python version_manager.py --config /path/to/config.json list
```

### Django API 集成

如果作为Django应用使用：

1. 将 `version control` 目录复制到Django项目目录
2. 在 `settings.py` 中添加：

```python
INSTALLED_APPS = [
    # ...
    'version_control',  # 或你的目录名
]

# 版本管理器配置（可选）
VERSION_MANAGER_CONFIG = '/path/to/config.json'
```

3. 在主 `urls.py` 中包含版本管理URL：

```python
from django.urls import path, include

urlpatterns = [
    # ...
    path('api/version/', include('version_control.urls')),
]
```

4. API端点：

- `GET /api/version/list/` - 获取版本列表
- `GET /api/version/current/` - 获取当前版本
- `POST /api/version/switch/` - 切换版本
- `POST /api/version/upload/` - 上传版本
- `DELETE /api/version/delete/{version_name}/` - 删除版本
- `GET /api/version/info/{version_name}/` - 获取版本信息

## 前端集成

在前端登录页面添加版本选择功能，参考 `Login.vue` 中的版本选择组件。

## 注意事项

1. **服务器部署路径**：确保 `server_base_path` 配置正确，服务器有写入权限
2. **SFTP/FTP配置**：如果使用远程上传，需要正确配置服务器连接信息
3. **版本切换**：切换版本后需要重启Web服务器才能生效（如果使用Nginx等）
4. **版本命名**：建议使用语义化版本号，如 `v1.0.0`, `v1.0.1` 等
5. **文件权限**：确保版本管理器有读写版本目录的权限

## 故障排除

### 上传失败
- 检查源目录是否存在
- 检查是否有足够的磁盘空间
- 检查文件权限

### SFTP连接失败
- 检查服务器地址和端口
- 检查用户名和密码
- 如果使用密钥文件，检查密钥文件路径和权限

### 版本切换失败
- 检查版本是否存在
- 检查是否有权限写入配置文件
- 检查目标路径是否存在

## 快速开始

### 1. 安装依赖

```bash
cd "version control"
pip install -r requirements.txt
```

### 2. 配置

复制配置文件示例并修改：

```bash
cp config.example.json config.json
# 编辑 config.json，修改服务器路径和连接信息
```

### 3. 使用命令行工具

```bash
# 上传版本（在项目根目录执行）
python version_manager.py upload ./dist --name v1.0.0 --description "初始版本"

# 列出所有版本
python version_manager.py list

# 切换版本
python version_manager.py switch v1.0.0

# 删除版本
python version_manager.py delete v1.0.0
```

### 4. Django集成

如果作为Django应用使用：

1. 在 `settings.py` 中注册应用：
```python
INSTALLED_APPS = [
    # ...
    'version_control',  # 根据实际目录名称修改
]

# 可选：指定配置文件路径
VERSION_MANAGER_CONFIG = '/path/to/config.json'
```

2. 在主 `urls.py` 中包含URL：
```python
from django.urls import path, include

urlpatterns = [
    # ...
    path('api/version/', include('version_control.urls')),
]
```

3. 运行迁移（如果需要）：
```bash
python manage.py migrate
```

### 5. 前端集成

前端登录页面已集成版本选择功能，会自动从API获取版本列表。确保：

1. Django API端点已配置
2. CORS已正确配置（允许前端域名）
3. 前端可以访问 `/api/version/` 端点

## 开发计划

- [ ] 支持文件上传API（目前仅支持本地路径）
- [ ] 版本回滚功能
- [ ] 版本差异比较
- [ ] 自动部署脚本
- [ ] 版本使用统计
- [ ] Web界面管理版本

## 许可证

MIT License

