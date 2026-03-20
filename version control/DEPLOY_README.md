# 一键部署脚本使用说明

## 功能说明

这个部署脚本可以一键将本地构建好的 `dist` 目录上传到服务器指定位置，并自动记录部署日志。

### 部署规则

脚本会按照以下规则上传文件：

1. **index.html** → `/home/admin/eye/media/exehtml/index.html`
2. **assets/** → `/home/admin/eye/media/exehtml/assets/`（递归上传所有文件）
3. **static/** → `/home/admin/eye/media/exehtml/static/`（递归上传所有文件）
4. **templates/** → `/home/admin/eye/media/exehtml/templates/`（如果存在，递归上传所有文件）

所有同名文件会被**自动覆盖**。

### 部署日志

每次部署后，脚本会在服务器上创建或更新部署日志文件：

**位置**: `/home/admin/eye/media/exehtml/deploy_log.json`

日志包含：
- 部署时间戳
- 部署描述（可选）
- 部署的文件数量和列表
- 最近50次部署记录

## 快速开始

### 1. 安装依赖

```bash
pip install paramiko
```

### 2. 配置服务器信息

复制配置文件示例：

```bash
cd "version control"
copy deploy_config.example.json deploy_config.json
```

编辑 `deploy_config.json`，填入你的服务器信息：

```json
{
  "server_host": "47.108.224.128",
  "server_port": 22,
  "server_username": "admin",
  "server_password": "你的服务器密码",
  "server_path": "/home/admin/eye/media/exehtml"
}
```

⚠️ **注意**: 出于安全考虑，建议将 `deploy_config.json` 添加到 `.gitignore` 文件中，避免密码泄露。

### 3. 构建项目

```bash
npm run build
```

### 4. 一键部署

#### 方式一：使用 npm 脚本（推荐）

```bash
# 仅部署（需要先运行 npm run build）
npm run deploy

# 或者：构建 + 部署（一键完成）
npm run build:deploy
```

#### 方式二：直接使用 Python 脚本

```bash
# 在项目根目录执行
python "version control/deploy.py"

# 或者指定 dist 目录
python "version control/deploy.py" --dist ./dist

# 添加部署描述（会记录到日志）
python "version control/deploy.py" --description "修复登录bug"

# 使用自定义配置文件
python "version control/deploy.py" --config /path/to/config.json
```

## 部署流程

1. ✅ **连接服务器** - 使用SFTP连接到配置的服务器
2. ✅ **创建目录** - 确保服务器上的目标目录存在
3. ✅ **上传文件** - 按照规则上传所有文件，覆盖同名文件
4. ✅ **记录日志** - 在服务器上记录部署日志
5. ✅ **完成部署** - 显示部署结果和文件统计

## 命令行参数

```bash
python "version control/deploy.py" [选项]

选项:
  --dist DIR        指定dist目录路径（默认：项目根目录下的dist）
  --config FILE     指定配置文件路径（默认：deploy_config.json）
  --description TEXT 部署描述，会记录到日志中
  -h, --help        显示帮助信息
```

## 部署日志格式

部署日志以JSON格式存储在服务器上，示例如下：

```json
[
  {
    "timestamp": "2025-01-10 14:30:25",
    "description": "修复登录bug",
    "files_count": 45,
    "files": [
      ["index.html", "/home/admin/eye/media/exehtml/index.html"],
      ["assets/index-BF_lUtRk.js", "/home/admin/eye/media/exehtml/assets/index-BF_lUtRk.js"],
      ...
    ],
    "note": "共 45 个文件，此处仅显示前10个"
  },
  ...
]
```

日志会保留最近50次部署记录。

## 常见问题

### Q: 部署失败，提示认证错误？

A: 检查 `deploy_config.json` 中的用户名和密码是否正确。确保：
- `server_username` 正确
- `server_password` 正确
- 服务器允许SSH/SFTP连接
- 防火墙没有阻止连接

### Q: 部署失败，提示目录不存在？

A: 脚本会自动创建目录，但如果权限不足可能失败。确保：
- 服务器用户有创建目录的权限
- `server_path` 配置正确

### Q: 如何查看部署日志？

A: 可以通过以下方式查看：

```bash
# 使用SFTP客户端（如WinSCP）连接服务器
# 查看文件: /home/admin/eye/media/exehtml/deploy_log.json

# 或使用SSH连接后查看
ssh admin@your-server.com
cat /home/admin/eye/media/exehtml/deploy_log.json
```

### Q: 如何安全存储密码？

A: 推荐方式：
1. 将 `deploy_config.json` 添加到 `.gitignore`
2. 使用环境变量（需要修改脚本支持）
3. 使用SSH密钥认证（需要修改脚本支持）

### Q: 可以部署到多个服务器吗？

A: 可以，创建多个配置文件，使用 `--config` 参数指定不同的配置文件。

## 高级用法

### 自定义部署路径

编辑 `deploy_config.json`，修改 `server_path`：

```json
{
  "server_path": "/home/admin/eye/media/exehtml/production"
}
```

### 添加部署前检查

可以在脚本中添加构建验证、文件完整性检查等。

### 集成到CI/CD

可以在CI/CD流程中使用：

```yaml
# GitHub Actions 示例
- name: Deploy to server
  run: |
    pip install paramiko
    python "version control/deploy.py" --description "CI/CD部署"
```

## 注意事项

⚠️ **重要提示**:
1. 部署会**覆盖**服务器上的同名文件，请确保已备份重要文件
2. 确保服务器有足够的磁盘空间
3. 部署过程中请勿中断，可能导致文件不完整
4. 建议在生产环境部署前先在测试环境验证
5. 定期检查部署日志，确认部署成功

## 故障排除

如果遇到问题，可以：

1. **检查日志输出** - 脚本会输出详细的执行日志
2. **验证配置文件** - 确保JSON格式正确
3. **测试连接** - 使用SSH客户端测试能否连接服务器
4. **检查权限** - 确保服务器用户有写入权限
5. **查看错误信息** - 脚本会显示详细的错误信息

## 支持

如有问题或建议，请联系开发团队。

