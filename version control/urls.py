"""
版本管理API URL配置
"""

from django.urls import path
from . import api_views

urlpatterns = [
    path('list/', api_views.get_version_list, name='version_list'),
    path('current/', api_views.get_current_version, name='version_current'),
    path('switch/', api_views.switch_version, name='version_switch'),
    path('upload/', api_views.upload_version, name='version_upload'),
    path('delete/<str:version_name>/', api_views.delete_version, name='version_delete'),
    path('info/<str:version_name>/', api_views.get_version_info, name='version_info'),
]

