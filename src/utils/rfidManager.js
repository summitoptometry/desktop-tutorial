// RFID标签管理工具类
// 用于高质商品的盘点、出入库和效期管理

/**
 * 生成RFID标签ID
 * @param {string} prefix - 前缀（如：LENS, FRAME, SOLUTION等）
 * @returns {string} RFID标签ID
 */
export const generateRFIDTag = (prefix = 'PROD') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * 验证RFID标签格式
 * @param {string} rfidTag - RFID标签ID
 * @returns {boolean} 是否有效
 */
export const validateRFIDTag = (rfidTag) => {
  if (!rfidTag || typeof rfidTag !== 'string') {
    return false;
  }
  // RFID格式：PREFIX-TIMESTAMP-RANDOM
  const pattern = /^[A-Z]+-\d+-\d{4}$/;
  return pattern.test(rfidTag);
};

/**
 * 绑定RFID标签到商品
 * @param {Object} params - 绑定参数
 * @param {string} params.rfidTag - RFID标签ID
 * @param {number} params.productId - 商品ID
 * @param {string} params.productType - 商品类型（lens/frame/solution等）
 * @param {number} params.inventoryId - 库存条目ID
 * @param {Object} params.productInfo - 商品信息（品名、规格、效期等）
 * @returns {Promise<Object>} 绑定结果
 */
export const bindRFIDTag = async (params) => {
  const { rfidTag, productId, productType, inventoryId, productInfo } = params;

  // 验证RFID标签格式
  if (!validateRFIDTag(rfidTag)) {
    throw new Error('RFID标签格式无效');
  }

  // 检查RFID是否已被使用
  const existingBinding = getRFIDBinding(rfidTag);
  if (existingBinding && existingBinding.inventoryId !== inventoryId) {
    throw new Error('该RFID标签已被其他商品使用');
  }

  // 构建RFID绑定数据
  const binding = {
    rfidTag,
    productId,
    productType,
    inventoryId,
    productInfo: {
      name: productInfo.name || '',
      specification: productInfo.specification || '',
      expiryDate: productInfo.expiryDate || null,
      productionDate: productInfo.productionDate || null,
      batchNumber: productInfo.batchNumber || '',
      ...productInfo
    },
    bindTime: new Date().toISOString(),
    operator: localStorage.getItem('username') || 'system',
    status: 'active' // active: 激活, inactive: 停用, lost: 丢失
  };

  // 保存到localStorage（实际应该调用后端API）
  const rfidBindings = getRFIDBindings();
  const existingIndex = rfidBindings.findIndex(b => b.rfidTag === rfidTag);
  
  if (existingIndex !== -1) {
    rfidBindings[existingIndex] = binding;
  } else {
    rfidBindings.push(binding);
  }

  saveRFIDBindings(rfidBindings);

  // 调用后端API保存
  try {
    const organization_id = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (organization_id && csrftoken) {
      const response = await fetch('https://aiforoptometry.com/rfid/bind/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        },
        credentials: 'include',
        body: JSON.stringify({
          organization_id,
          ...binding
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 200 || result.code === 201) {
          return { success: true, data: result.data || binding };
        }
      }
    }
  } catch (error) {
    console.warn('RFID绑定API调用失败，使用本地存储:', error);
  }

  return { success: true, data: binding };
};

/**
 * 获取RFID标签绑定信息
 * @param {string} rfidTag - RFID标签ID
 * @returns {Object|null} 绑定信息
 */
export const getRFIDBinding = (rfidTag) => {
  const bindings = getRFIDBindings();
  return bindings.find(b => b.rfidTag === rfidTag && b.status === 'active') || null;
};

/**
 * 获取所有RFID绑定
 * @returns {Array} RFID绑定列表
 */
export const getRFIDBindings = () => {
  const stored = localStorage.getItem('rfid_bindings');
  return stored ? JSON.parse(stored) : [];
};

/**
 * 保存RFID绑定
 * @param {Array} bindings - RFID绑定列表
 */
export const saveRFIDBindings = (bindings) => {
  localStorage.setItem('rfid_bindings', JSON.stringify(bindings));
};

/**
 * 通过RFID标签查询商品信息
 * @param {string} rfidTag - RFID标签ID
 * @returns {Promise<Object>} 商品信息
 */
export const queryProductByRFID = async (rfidTag) => {
  // 先从本地缓存查询
  const binding = getRFIDBinding(rfidTag);
  if (binding) {
    return {
      success: true,
      data: {
        ...binding.productInfo,
        rfidTag: binding.rfidTag,
        inventoryId: binding.inventoryId,
        productId: binding.productId,
        productType: binding.productType
      }
    };
  }

  // 调用后端API查询
  try {
    const organization_id = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (organization_id && csrftoken) {
      const response = await fetch(`https://aiforoptometry.com/rfid/query/${rfidTag}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 200 && result.data) {
          return { success: true, data: result.data };
        }
      }
    }
  } catch (error) {
    console.error('RFID查询失败:', error);
  }

  return { success: false, message: '未找到该RFID标签对应的商品' };
};

/**
 * 批量扫描RFID标签
 * @param {Array<string>} rfidTags - RFID标签ID数组
 * @returns {Promise<Array>} 商品信息列表
 */
export const batchScanRFID = async (rfidTags) => {
  const results = [];
  
  for (const rfidTag of rfidTags) {
    const result = await queryProductByRFID(rfidTag);
    results.push({
      rfidTag,
      ...result
    });
  }

  return results;
};

/**
 * 解绑RFID标签
 * @param {string} rfidTag - RFID标签ID
 * @returns {Promise<Object>} 解绑结果
 */
export const unbindRFIDTag = async (rfidTag) => {
  const bindings = getRFIDBindings();
  const index = bindings.findIndex(b => b.rfidTag === rfidTag);
  
  if (index === -1) {
    throw new Error('未找到该RFID标签');
  }

  // 标记为停用而不是删除
  bindings[index].status = 'inactive';
  bindings[index].unbindTime = new Date().toISOString();
  bindings[index].unbindOperator = localStorage.getItem('username') || 'system';
  
  saveRFIDBindings(bindings);

  // 调用后端API
  try {
    const organization_id = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (organization_id && csrftoken) {
      await fetch(`https://aiforoptometry.com/rfid/unbind/${rfidTag}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        },
        credentials: 'include',
        body: JSON.stringify({ organization_id })
      });
    }
  } catch (error) {
    console.warn('RFID解绑API调用失败:', error);
  }

  return { success: true };
};

/**
 * 检查商品效期
 * @param {string} rfidTag - RFID标签ID
 * @returns {Object} 效期检查结果
 */
export const checkExpiryByRFID = (rfidTag) => {
  const binding = getRFIDBinding(rfidTag);
  
  if (!binding || !binding.productInfo.expiryDate) {
    return {
      hasExpiry: false,
      isExpired: false,
      daysRemaining: null,
      status: 'unknown'
    };
  }

  const expiryDate = new Date(binding.productInfo.expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  const daysRemaining = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
  
  let status = 'normal';
  if (daysRemaining < 0) {
    status = 'expired';
  } else if (daysRemaining <= 30) {
    status = 'warning';
  } else if (daysRemaining <= 90) {
    status = 'caution';
  }

  return {
    hasExpiry: true,
    isExpired: daysRemaining < 0,
    daysRemaining,
    expiryDate: binding.productInfo.expiryDate,
    status
  };
};

/**
 * 获取即将过期的商品列表
 * @param {number} days - 预警天数（默认30天）
 * @returns {Array} 即将过期的商品列表
 */
export const getExpiringProducts = (days = 30) => {
  const bindings = getRFIDBindings().filter(b => b.status === 'active');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiringProducts = [];

  bindings.forEach(binding => {
    if (binding.productInfo.expiryDate) {
      const expiryDate = new Date(binding.productInfo.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      
      const daysRemaining = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining >= 0 && daysRemaining <= days) {
        expiringProducts.push({
          ...binding,
          daysRemaining,
          isExpired: daysRemaining < 0
        });
      }
    }
  });

  return expiringProducts.sort((a, b) => a.daysRemaining - b.daysRemaining);
};

/**
 * 模拟RFID扫描（实际应该从硬件设备获取）
 * @returns {Promise<string>} RFID标签ID
 */
export const simulateRFIDScan = () => {
  return new Promise((resolve) => {
    // 模拟扫描延迟
    setTimeout(() => {
      // 实际应该从RFID读取器获取
      // 这里返回一个示例RFID
      const prefix = ['LENS', 'FRAME', 'SOLUTION', 'ACCESSORY'][Math.floor(Math.random() * 4)];
      resolve(generateRFIDTag(prefix));
    }, 500);
  });
};

/**
 * 监听RFID扫描事件（需要与硬件设备集成）
 * @param {Function} callback - 扫描回调函数
 * @returns {Function} 取消监听的函数
 */
export const listenRFIDScan = (callback) => {
  // 实际实现需要与RFID读取器硬件集成
  // 这里提供一个模拟实现
  
  const handleKeyPress = (event) => {
    // 模拟：按F1键触发RFID扫描
    if (event.key === 'F1' && event.ctrlKey) {
      event.preventDefault();
      simulateRFIDScan().then(callback);
    }
  };

  window.addEventListener('keydown', handleKeyPress);

  // 返回取消监听的函数
  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
};

export default {
  generateRFIDTag,
  validateRFIDTag,
  bindRFIDTag,
  getRFIDBinding,
  getRFIDBindings,
  queryProductByRFID,
  batchScanRFID,
  unbindRFIDTag,
  checkExpiryByRFID,
  getExpiringProducts,
  simulateRFIDScan,
  listenRFIDScan
};

