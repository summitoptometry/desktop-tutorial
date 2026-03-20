// 效期预警管理工具类
import dayjs from 'dayjs';

/**
 * 获取预警配置
 * @returns {Object} 预警配置
 */
export const getWarningConfig = () => {
  const savedConfig = localStorage.getItem('expiry_warning_config');
  if (savedConfig) {
    try {
      return JSON.parse(savedConfig);
    } catch (error) {
      console.error('解析预警配置失败:', error);
    }
  }
  
  // 返回默认配置
  return {
    global: {
      levels: {
        expired: { enabled: true, days: 0 },
        warning: { enabled: true, days: 30 },
        caution: { enabled: true, days: 60 },
        reminder: { enabled: false, days: 90 }
      },
      notification: {
        enabled: true,
        methods: ['system'],
        frequency: 'daily',
        time: '09:00'
      }
    },
    category: {},
    product: {}
  };
};

/**
 * 检查商品效期并返回预警级别
 * @param {Object} product - 商品信息
 * @param {string} expiryDate - 有效期至
 * @returns {Object} 预警信息
 */
export const checkExpiryWarning = (product, expiryDate) => {
  if (!expiryDate) {
    return {
      hasWarning: false,
      level: null,
      daysRemaining: null,
      message: '无效期'
    };
  }

  const config = getWarningConfig();
  const today = dayjs();
  const expiry = dayjs(expiryDate);
  const daysRemaining = expiry.diff(today, 'day');

  // 检查商品特定配置
  let warningConfig = config.global;
  if (config.product && config.product[product.id]) {
    warningConfig = config.product[product.id];
  } else if (config.category && config.category[product.category]) {
    warningConfig = config.category[product.category];
  }

  // 已过期
  if (daysRemaining < 0 && warningConfig.levels.expired.enabled) {
    return {
      hasWarning: true,
      level: 'expired',
      daysRemaining,
      message: `已过期 ${Math.abs(daysRemaining)} 天`,
      severity: 'serious',
      color: '#ff4d4f'
    };
  }

  // 警告预警
  if (daysRemaining >= 0 && daysRemaining <= warningConfig.levels.warning.days && warningConfig.levels.warning.enabled) {
    return {
      hasWarning: true,
      level: 'warning',
      daysRemaining,
      message: `还有 ${daysRemaining} 天过期`,
      severity: 'warning',
      color: '#fa8c16'
    };
  }

  // 注意预警
  if (daysRemaining > warningConfig.levels.warning.days && 
      daysRemaining <= warningConfig.levels.caution.days && 
      warningConfig.levels.caution.enabled) {
    return {
      hasWarning: true,
      level: 'caution',
      daysRemaining,
      message: `还有 ${daysRemaining} 天过期`,
      severity: 'caution',
      color: '#faad14'
    };
  }

  // 提醒预警
  if (daysRemaining > warningConfig.levels.caution.days && 
      daysRemaining <= warningConfig.levels.reminder.days && 
      warningConfig.levels.reminder.enabled) {
    return {
      hasWarning: true,
      level: 'reminder',
      daysRemaining,
      message: `还有 ${daysRemaining} 天过期`,
      severity: 'reminder',
      color: '#1890ff'
    };
  }

  return {
    hasWarning: false,
    level: 'normal',
    daysRemaining,
    message: `还有 ${daysRemaining} 天过期`,
    severity: 'normal',
    color: '#52c41a'
  };
};

/**
 * 获取所有需要预警的商品
 * @param {Array} products - 商品列表
 * @returns {Array} 预警商品列表
 */
export const getWarningProducts = (products) => {
  const warnings = [];
  
  products.forEach(product => {
    if (product.expiryDate) {
      const warning = checkExpiryWarning(product, product.expiryDate);
      if (warning.hasWarning) {
        warnings.push({
          ...product,
          warning
        });
      }
    }
  });

  // 按严重程度和剩余天数排序
  warnings.sort((a, b) => {
    const severityOrder = { expired: 0, warning: 1, caution: 2, reminder: 3 };
    const aOrder = severityOrder[a.warning.level] || 999;
    const bOrder = severityOrder[b.warning.level] || 999;
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    return (a.warning.daysRemaining || 999) - (b.warning.daysRemaining || 999);
  });

  return warnings;
};

/**
 * 发送预警通知
 * @param {Array} warnings - 预警商品列表
 */
export const sendWarningNotifications = async (warnings) => {
  const config = getWarningConfig();
  
  if (!config.global.notification.enabled) {
    return;
  }

  const notificationData = {
    warnings,
    timestamp: new Date().toISOString(),
    methods: config.global.notification.methods || ['system']
  };

  // 保存到本地存储（系统通知）
  if (notificationData.methods.includes('system')) {
    const existingNotifications = JSON.parse(localStorage.getItem('expiry_warning_notifications') || '[]');
    existingNotifications.unshift({
      ...notificationData,
      id: Date.now(),
      read: false
    });
    
    // 只保留最近100条通知
    if (existingNotifications.length > 100) {
      existingNotifications.splice(100);
    }
    
    localStorage.setItem('expiry_warning_notifications', JSON.stringify(existingNotifications));
  }

  // 调用后端API发送通知（邮件、短信等）
  try {
    const organization_id = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (organization_id && csrftoken) {
      await fetch('https://aiforoptometry.com/expiry-warning/notify/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        },
        credentials: 'include',
        body: JSON.stringify({
          organization_id,
          ...notificationData
        })
      });
    }
  } catch (error) {
    console.warn('发送预警通知失败:', error);
  }
};

/**
 * 获取未读预警通知数量
 * @returns {number} 未读通知数量
 */
export const getUnreadNotificationCount = () => {
  const notifications = JSON.parse(localStorage.getItem('expiry_warning_notifications') || '[]');
  return notifications.filter(n => !n.read).length;
};

/**
 * 标记通知为已读
 * @param {number} notificationId - 通知ID
 */
export const markNotificationAsRead = (notificationId) => {
  const notifications = JSON.parse(localStorage.getItem('expiry_warning_notifications') || '[]');
  const index = notifications.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    notifications[index].read = true;
    localStorage.setItem('expiry_warning_notifications', JSON.stringify(notifications));
  }
};

/**
 * 标记所有通知为已读
 */
export const markAllNotificationsAsRead = () => {
  const notifications = JSON.parse(localStorage.getItem('expiry_warning_notifications') || '[]');
  notifications.forEach(n => {
    n.read = true;
  });
  localStorage.setItem('expiry_warning_notifications', JSON.stringify(notifications));
};

/**
 * 获取预警通知列表
 * @param {number} limit - 限制数量
 * @returns {Array} 通知列表
 */
export const getWarningNotifications = (limit = 20) => {
  const notifications = JSON.parse(localStorage.getItem('expiry_warning_notifications') || '[]');
  return notifications.slice(0, limit);
};

/**
 * 清除过期通知
 * @param {number} days - 保留天数
 */
export const cleanExpiredNotifications = (days = 90) => {
  const notifications = JSON.parse(localStorage.getItem('expiry_warning_notifications') || '[]');
  const cutoffDate = dayjs().subtract(days, 'day');
  
  const filtered = notifications.filter(n => {
    const notificationDate = dayjs(n.timestamp);
    return notificationDate.isAfter(cutoffDate);
  });
  
  localStorage.setItem('expiry_warning_notifications', JSON.stringify(filtered));
};

export default {
  getWarningConfig,
  checkExpiryWarning,
  getWarningProducts,
  sendWarningNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getWarningNotifications,
  cleanExpiredNotifications
};

