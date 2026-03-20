import { ref, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';

// 网络状态
const isOnline = ref(navigator.onLine);
const networkStatus = ref('online'); // 'online', 'offline', 'slow'
const lastOnlineTime = ref(Date.now());

// 判断是否为开发环境
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// URL 转换函数：在开发环境中使用代理路径避免 CORS
const convertUrlForProxy = (url) => {
  if (!isDevelopment) {
    return url; // 生产环境直接返回原 URL
  }
  
  // 如果 URL 已经是相对路径或 localhost，直接返回
  if (url.startsWith('/') || url.startsWith('http://localhost')) {
    return url;
  }
  
  // 将 https://aiforoptometry.com 的路径转换为代理路径
  const baseUrl = 'https://aiforoptometry.com';
  if (url.startsWith(baseUrl)) {
    const path = url.replace(baseUrl, '');
    // 如果路径以 /api 开头，保持 /api
    if (path.startsWith('/api')) {
      return path;
    }
    // 其他路径直接返回（Vite 代理会处理）
    // 确保路径以 / 开头
    return path.startsWith('/') ? path : '/' + path;
  }
  
  return url;
};

// 网络状态监听器
let onlineHandler = null;
let offlineHandler = null;

// 检测网络连接质量
const checkNetworkQuality = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const startTime = Date.now();
    // 使用代理路径或直接路径
    // 如果健康检查端点不存在，使用一个更通用的端点
    const healthUrl = isDevelopment ? '/api/health/' : 'https://aiforoptometry.com/api/health/';
    
    let response;
    try {
      response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });
      clearTimeout(timeoutId);
      
      // 如果返回404，静默处理，不更新网络状态，也不显示错误
      if (response.status === 404) {
        return false;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // 静默处理错误，不抛出，不更新网络状态（避免404错误影响网络状态判断）
      // 如果是404错误，不显示在控制台
      if (fetchError.name !== 'AbortError') {
        // 检查是否是404错误（通过错误消息或响应状态）
        const is404Error = fetchError.message?.includes('404') || 
                          fetchError.message?.includes('Not Found') ||
                          fetchError.message?.includes('Failed to fetch');
        if (!is404Error) {
          // 只有非超时和非404错误才设置为离线
          networkStatus.value = 'offline';
        }
      }
      return false;
    }
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    // 如果返回404，说明健康检查端点不存在，静默处理，不更新网络状态
    if (response.status === 404) {
      return false;
    }
    
    if (response.ok) {
      if (latency < 1000) {
        networkStatus.value = 'online';
      } else if (latency < 3000) {
        networkStatus.value = 'slow';
      } else {
        networkStatus.value = 'offline';
      }
      lastOnlineTime.value = Date.now();
      return true;
    }
    networkStatus.value = 'offline';
    return false;
  } catch (error) {
    // 静默处理错误，不抛出
    networkStatus.value = 'offline';
    return false;
  }
};

// 带重试的网络请求
const fetchWithRetry = async (url, options = {}, maxRetries = 3, retryDelay = 1000) => {
  let lastError = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 检查网络状态
      if (!isOnline.value) {
        throw new Error('网络已断开');
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
      
      // 转换 URL 以使用代理（开发环境）
      const proxiedUrl = convertUrlForProxy(url);
      
      // 调试日志
      if (isDevelopment) {
        console.log('[fetchWithRetry] 原始URL:', url, '-> 代理URL:', proxiedUrl);
      }
      
      let response;
      try {
        response = await fetch(proxiedUrl, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // CORS 错误或网络错误在 fetch 时就会被抛出
        const errorMsg = fetchError.message || fetchError.toString() || '';
        const isCorsOrNetworkError = fetchError.name === 'TypeError' ||
                                    fetchError.name === 'AbortError' ||
                                    errorMsg.includes('Failed to fetch') ||
                                    errorMsg.includes('CORS') ||
                                    errorMsg.includes('blocked by CORS') ||
                                    errorMsg.includes('ERR_NETWORK') ||
                                    errorMsg.includes('ERR_FAILED');
        
        if (isCorsOrNetworkError) {
          // 更新网络状态为离线
          networkStatus.value = 'offline';
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
            continue;
          } else {
            throw new Error('网络连接失败（CORS或网络错误）');
          }
        }
        throw fetchError;
      }
      
      // 如果响应成功，更新网络状态
      if (response.ok) {
        lastOnlineTime.value = Date.now();
        networkStatus.value = 'online';
        return response;
      }
      
      // 404/502/503/504 错误，可能是临时服务器问题或路径错误，可以重试
      if ([404, 502, 503, 504].includes(response.status)) {
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
          continue;
        } else {
          // 最后一次重试也失败，更新网络状态并抛出错误以便上层处理
          networkStatus.value = 'offline';
          throw new Error(`服务器错误: ${response.status}`);
        }
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // 网络错误、CORS错误、502错误或超时，可以重试
      const errorMessage = error.message || error.toString() || '';
      const isNetworkError = error.name === 'AbortError' || 
                            error.name === 'TypeError' || // CORS错误通常是TypeError
                            errorMessage.includes('Failed to fetch') ||
                            errorMessage.includes('CORS') ||
                            errorMessage.includes('ERR_NETWORK') ||
                            errorMessage.includes('ERR_FAILED') ||
                            errorMessage.includes('blocked by CORS') ||
                            errorMessage.includes('Network Error') ||
                            errorMessage.includes('网络连接失败') ||
                            errorMessage.includes('服务器错误: 502') ||
                            errorMessage.includes('服务器错误: 503') ||
                            errorMessage.includes('服务器错误: 504') ||
                            error.code === 'ERR_NETWORK';
      
      if (isNetworkError) {
        // 更新网络状态
        networkStatus.value = 'offline';
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
          continue;
        }
        // 最后一次重试也失败，抛出错误（但标记为网络错误）
        throw error;
      }
      
      // 其他错误，不重试，直接抛出
      throw error;
    }
  }
  
  // 如果所有重试都失败，更新网络状态并抛出错误
  networkStatus.value = 'offline';
  throw lastError || new Error('请求失败，已达到最大重试次数');
};

// 初始化网络监听
const initNetworkListener = () => {
  onlineHandler = () => {
    isOnline.value = true;
    networkStatus.value = 'online';
    lastOnlineTime.value = Date.now();
    message.success('网络连接已恢复', 2);
    // 延迟检查，避免立即触发错误
    // 由于健康检查端点可能不存在，暂时禁用，避免404错误
    // setTimeout(() => {
    //   checkNetworkQuality().catch(() => {
    //     // 静默处理错误
    //   });
    // }, 1000);
  };
  
  offlineHandler = () => {
    isOnline.value = false;
    networkStatus.value = 'offline';
    message.warning('网络连接已断开，将使用离线模式', 3);
  };
  
  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);
  
  // 定期检查网络质量（每60秒，减少频率）
  // 注意：如果健康检查端点不存在（404），会静默失败，不影响网络状态
  // 由于健康检查端点可能不存在，暂时禁用定期检查，避免404错误
  // setInterval(() => {
  //   if (isOnline.value) {
  //     checkNetworkQuality().catch(() => {
  //       // 静默处理错误，避免过多错误日志
  //     });
  //   }
  // }, 60000); // 改为60秒检查一次
  
  // 初始检查（延迟执行）
  // 由于健康检查端点可能不存在，暂时禁用初始检查，避免404错误
  // setTimeout(() => {
  //   checkNetworkQuality().catch(() => {
  //     // 静默处理错误
  //   });
  // }, 2000);
};

// 清理网络监听
const cleanupNetworkListener = () => {
  if (onlineHandler) {
    window.removeEventListener('online', onlineHandler);
  }
  if (offlineHandler) {
    window.removeEventListener('offline', offlineHandler);
  }
};

// 获取网络状态信息
const getNetworkStatus = () => {
  return {
    isOnline: isOnline.value,
    status: networkStatus.value,
    lastOnlineTime: lastOnlineTime.value,
    isSlow: networkStatus.value === 'slow',
    isOffline: networkStatus.value === 'offline' || !isOnline.value
  };
};

// 检查是否可以访问API
const checkAPIAvailable = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // 使用代理路径或直接路径
    const healthUrl = isDevelopment ? '/api/health/' : 'https://aiforoptometry.com/api/health/';
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export {
  isOnline,
  networkStatus,
  lastOnlineTime,
  checkNetworkQuality,
  fetchWithRetry,
  initNetworkListener,
  cleanupNetworkListener,
  getNetworkStatus,
  checkAPIAvailable,
  convertUrlForProxy
};

