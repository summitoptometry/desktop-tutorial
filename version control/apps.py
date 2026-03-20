"""
版本管理Django应用配置
如果作为Django应用使用，需要在settings.py中注册此应用
"""

from django.apps import AppConfig


class VersionControlConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'version_control'  # 根据实际目录名称修改
    verbose_name = '版本管理'

