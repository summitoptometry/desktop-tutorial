"""
版本管理API视图（Django）
用于提供版本管理的REST API接口
"""

import os
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import logging

from .version_manager import VersionManager

logger = logging.getLogger(__name__)

# 全局版本管理器实例
_version_manager = None

def get_version_manager():
    """获取版本管理器实例（单例）"""
    global _version_manager
    if _version_manager is None:
        # 从settings或环境变量获取配置路径
        config_path = getattr(settings, 'VERSION_MANAGER_CONFIG', None)
        if not config_path:
            # 默认配置路径（相对于当前文件所在目录）
            config_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                'config.json'
            )
        try:
            _version_manager = VersionManager(config_path)
        except Exception as e:
            logger.warning(f"初始化版本管理器失败，使用默认配置: {e}")
            _version_manager = VersionManager()
    return _version_manager


@csrf_exempt
@require_http_methods(["GET"])
def get_version_list(request):
    """
    获取版本列表
    GET /api/version/list/
    """
    try:
        manager = get_version_manager()
        versions = manager.get_version_list()
        current = manager.get_current_version()
        
        return JsonResponse({
            "success": True,
            "data": {
                "versions": versions,
                "current_version": current
            }
        })
    except Exception as e:
        logger.error(f"获取版本列表失败: {e}")
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_current_version(request):
    """
    获取当前版本
    GET /api/version/current/
    """
    try:
        manager = get_version_manager()
        current = manager.get_current_version()
        
        return JsonResponse({
            "success": True,
            "data": {
                "current_version": current
            }
        })
    except Exception as e:
        logger.error(f"获取当前版本失败: {e}")
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def switch_version(request):
    """
    切换当前版本
    POST /api/version/switch/
    Body: {"version_name": "v1.0.0"}
    """
    try:
        import json as json_module
        data = json_module.loads(request.body)
        version_name = data.get("version_name")
        
        if not version_name:
            return JsonResponse({
                "success": False,
                "error": "缺少version_name参数"
            }, status=400)
        
        manager = get_version_manager()
        success = manager.set_current_version(version_name)
        
        if success:
            return JsonResponse({
                "success": True,
                "data": {
                    "current_version": version_name
                }
            })
        else:
            return JsonResponse({
                "success": False,
                "error": "切换版本失败"
            }, status=500)
    
    except ValueError as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=400)
    except Exception as e:
        logger.error(f"切换版本失败: {e}")
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def upload_version(request):
    """
    上传版本（通过API）
    POST /api/version/upload/
    注意：实际部署时应该使用文件上传而不是JSON传递文件路径
    """
    try:
        import json as json_module
        data = json_module.loads(request.body)
        dist_dir = data.get("dist_dir")
        version_name = data.get("version_name")
        description = data.get("description", "")
        
        if not dist_dir:
            return JsonResponse({
                "success": False,
                "error": "缺少dist_dir参数"
            }, status=400)
        
        manager = get_version_manager()
        version_info = manager.upload_version(dist_dir, version_name, description)
        
        return JsonResponse({
            "success": True,
            "data": version_info
        })
    
    except ValueError as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=400)
    except Exception as e:
        logger.error(f"上传版本失败: {e}")
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_version(request, version_name):
    """
    删除版本
    DELETE /api/version/delete/{version_name}/
    """
    try:
        manager = get_version_manager()
        keep_files = request.GET.get("keep_files", "false").lower() == "true"
        success = manager.delete_version(version_name, keep_files)
        
        if success:
            return JsonResponse({
                "success": True,
                "message": f"版本 {version_name} 已删除"
            })
        else:
            return JsonResponse({
                "success": False,
                "error": "删除版本失败"
            }, status=500)
    
    except ValueError as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=400)
    except Exception as e:
        logger.error(f"删除版本失败: {e}")
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_version_info(request, version_name):
    """
    获取指定版本信息
    GET /api/version/info/{version_name}/
    """
    try:
        manager = get_version_manager()
        version_info = manager.get_version_info(version_name)
        
        if version_info:
            return JsonResponse({
                "success": True,
                "data": version_info
            })
        else:
            return JsonResponse({
                "success": False,
                "error": f"版本不存在: {version_name}"
            }, status=404)
    
    except Exception as e:
        logger.error(f"获取版本信息失败: {e}")
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)

