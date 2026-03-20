// 统一的缓存管理器
// 确保患者列表和检查记录列表的缓存获取、更新、使用代码相互适应

// IndexedDB 相关常量
const DB_NAME = 'ERP_CACHE_DB';
const DB_VERSION = 2;
const PATIENT_STORE = 'patients';
const CHECK_STORE = 'checks';
const ACCOUNT_STORE = 'accounts';

// 缓存管理器类
class CacheManager {
  constructor() {
    this.isInitialized = false;
    this.db = null; // 初始化数据库连接属性
  }

  // 初始化IndexedDB
  async initDB() {
    if (this.isInitialized && this.db && this.db.readyState === 'open') {
      // 如果已经初始化且数据库连接有效，直接返回现有的数据库连接
      return this.db;
    }
    
    // 如果数据库连接无效，重置状态
    if (this.db && this.db.readyState !== 'open') {
      this.isInitialized = false;
      this.db = null;
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.isInitialized = true;
        this.db = request.result; // 保存数据库连接
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('IndexedDB升级中，版本:', event.oldVersion, '->', event.newVersion);
        
        // 删除旧的存储（如果存在）
        if (db.objectStoreNames.contains(PATIENT_STORE)) {
          db.deleteObjectStore(PATIENT_STORE);
        }
        if (db.objectStoreNames.contains(CHECK_STORE)) {
          db.deleteObjectStore(CHECK_STORE);
        }
        if (db.objectStoreNames.contains(ACCOUNT_STORE)) {
          db.deleteObjectStore(ACCOUNT_STORE);
        }
        
        // 创建存储
        const patientStore = db.createObjectStore(PATIENT_STORE, { keyPath: 'key' });
        patientStore.createIndex('key', 'key', { unique: true });
        
        const checkStore = db.createObjectStore(CHECK_STORE, { keyPath: 'key' });
        checkStore.createIndex('key', 'key', { unique: true });
        
        const accountStore = db.createObjectStore(ACCOUNT_STORE, { keyPath: 'key' });
        accountStore.createIndex('key', 'key', { unique: true });
        
        console.log('IndexedDB存储创建成功');
      };
    });
  }

  // 保存数据到IndexedDB
  async saveToIndexedDB(storeName, key, data) {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // 清理数据，移除不可序列化的属性
      const cleanData = this.cleanDataForIndexedDB(data);
      
      const dataObject = { key, data: cleanData, timestamp: Date.now() };
      const result = await new Promise((resolve, reject) => {
        const request = store.put(dataObject);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      console.log(`数据保存到IndexedDB成功: ${storeName} - ${key}`);
      return true;
    } catch (error) {
      console.error(`保存数据到IndexedDB失败: ${storeName} - ${key}`, error);
      return false;
    }
  }

  // 检查值是否可序列化
  isSerializable(value) {
    // null 是可序列化的
    if (value === null) return true;
    
    // undefined 不可序列化
    if (value === undefined) return false;
    
    // 函数不可序列化
    if (typeof value === 'function') return false;
    
    // Symbol 不可序列化
    if (typeof value === 'symbol') return false;
    
    // 基本类型（string, number, boolean）可序列化
    if (typeof value !== 'object') return true;
    
    // Date 对象可序列化（JSON.stringify 会自动转换）
    if (value instanceof Date) return true;
    
    // 数组可序列化
    if (Array.isArray(value)) return true;
    
    // 普通对象可序列化
    return true;
  }

  // 清理数据，移除不可序列化的属性
  cleanDataForIndexedDB(data) {
    if (!data) return data;
    
    // 如果是数组，清理每个元素
    if (Array.isArray(data)) {
      return data.map(item => this.cleanDataForIndexedDB(item));
    }
    
    // 如果是对象，清理属性
    if (typeof data === 'object' && data !== null) {
      const cleanObj = {};
      for (const [key, value] of Object.entries(data)) {
        // 跳过不可序列化的属性
        if (this.isSerializable(value)) {
          cleanObj[key] = this.cleanDataForIndexedDB(value);
        } else {
          console.warn(`跳过不可序列化的属性: ${key}`, value);
        }
      }
      return cleanObj;
    }
    
    // 基本类型直接返回
    return data;
  }

  // 检查localStorage存储空间
  checkLocalStorageQuota() {
    try {
      // 尝试存储一个测试字符串来检查可用空间
      const testKey = '__quota_test__';
      const testData = 'x'.repeat(1024 * 1024); // 1MB测试数据
      
      localStorage.setItem(testKey, testData);
      localStorage.removeItem(testKey);
      
      return { available: true, message: 'localStorage空间充足' };
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        return { available: false, message: 'localStorage空间不足' };
      }
      return { available: false, message: `localStorage检查失败: ${error.message}` };
    }
  }

  // 获取localStorage使用情况
  getLocalStorageUsage() {
    let totalSize = 0;
    const items = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      const size = JSON.stringify({ key, value }).length;
      totalSize += size;
      items.push({ key, size });
    }
    
    return {
      totalSize,
      itemCount: localStorage.length,
      items: items.sort((a, b) => b.size - a.size) // 按大小排序
    };
  }

  // 安全的localStorage设置方法
  safeSetLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn(`⚠️ localStorage存储空间不足，尝试清理后重试: ${key}`);
        
        // 检查当前存储使用情况
        const usage = this.getLocalStorageUsage();
        console.log('当前localStorage使用情况:', usage);
        
        try {
          // 清理所有相关缓存
          localStorage.removeItem('checkmanagementlist');
          localStorage.removeItem('patientlist');
          localStorage.removeItem('checkmanagementlist_storage');
          localStorage.removeItem('patientlist_storage');
          localStorage.removeItem('checkmanagementlist_indexedDB_key');
          localStorage.removeItem('patientlist_indexedDB_key');
          
          // 重新尝试存储
          localStorage.setItem(key, value);
          console.log(`✅ localStorage清理后重新存储成功: ${key}`);
          return true;
        } catch (retryError) {
          console.error(`❌ localStorage存储失败，将仅使用IndexedDB: ${key}`, retryError);
          return false;
        }
      } else {
        console.error(`❌ localStorage存储失败: ${key}`, error);
        return false;
      }
    }
  }

  // 从IndexedDB读取数据
  async getFromIndexedDB(storeName, key) {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const result = await new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      if (result) {
        console.log(`从IndexedDB读取数据成功: ${storeName} - ${key}`);
        return result.data;
      }
      return null;
    } catch (error) {
      console.error(`从IndexedDB读取数据失败: ${storeName} - ${key}`, error);
      return null;
    }
  }

  // 统一的缓存保存策略
  async saveCache(cacheType, data, organizationId) {
    const key = `${cacheType}_${organizationId}`;
    const storeName = cacheType === 'patientlist' ? PATIENT_STORE : CHECK_STORE;
    
    try {
      // 1. 总是保存到IndexedDB（主要存储）
      const indexedDBSuccess = await this.saveToIndexedDB(storeName, key, data);
      
      // 2. 检查数据大小，决定是否保存到localStorage
      if (indexedDBSuccess) {
        const dataString = JSON.stringify(data);
        const dataSize = dataString.length;
        const dataSizeMB = dataSize / 1024 / 1024;
        
        // 如果数据小于5MB，尝试保存到localStorage（快速访问）
        if (dataSizeMB < 5) {
          const localStorageSuccess = this.safeSetLocalStorage(cacheType, dataString);
          if (localStorageSuccess) {
            this.safeSetLocalStorage(`${cacheType}_storage`, 'indexedDB');
            this.safeSetLocalStorage(`${cacheType}_indexedDB_key`, key);
            console.log(`${cacheType}缓存已保存到IndexedDB和localStorage`);
          } else {
            // localStorage保存失败，标记为仅使用IndexedDB
            this.safeSetLocalStorage(`${cacheType}_storage`, 'indexedDB-only');
            this.safeSetLocalStorage(`${cacheType}_indexedDB_key`, key);
            console.warn(`localStorage保存失败（数据大小: ${dataSizeMB.toFixed(2)}MB），仅使用IndexedDB`);
          }
        } else {
          // 数据过大（>=5MB），仅使用IndexedDB，不尝试保存到localStorage
          this.safeSetLocalStorage(`${cacheType}_storage`, 'indexedDB-only');
          this.safeSetLocalStorage(`${cacheType}_indexedDB_key`, key);
          console.log(`${cacheType}缓存已保存到IndexedDB（数据大小: ${dataSizeMB.toFixed(2)}MB，仅使用IndexedDB）`);
        }
      }
      
      return indexedDBSuccess;
    } catch (error) {
      console.error(`保存${cacheType}缓存失败:`, error);
      return false;
    }
  }

  // 统一的缓存读取策略
  async getCache(cacheType, organizationId) {
    const key = `${cacheType}_${organizationId}`;
    const storeName = cacheType === 'patientlist' ? PATIENT_STORE : CHECK_STORE;
    
    try {
      // 1. 优先从localStorage读取（快速访问）
      const localData = localStorage.getItem(cacheType);
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);
          console.log(`${cacheType}缓存从localStorage读取成功`);
          return { data: parsedData, source: 'localStorage' };
        } catch (parseError) {
          console.warn(`localStorage数据解析失败，尝试从IndexedDB读取`);
        }
      }
      
      // 2. 从IndexedDB读取
      const indexedDBData = await this.getFromIndexedDB(storeName, key);
      if (indexedDBData) {
        // 3. 将IndexedDB数据同步到localStorage
        const localStorageSuccess = this.safeSetLocalStorage(cacheType, JSON.stringify(indexedDBData));
        if (localStorageSuccess) {
          this.safeSetLocalStorage(`${cacheType}_storage`, 'indexedDB');
          this.safeSetLocalStorage(`${cacheType}_indexedDB_key`, key);
          console.log(`${cacheType}缓存从IndexedDB读取并同步到localStorage`);
        } else {
          console.warn(`同步到localStorage失败`);
        }
        
        return { data: indexedDBData, source: 'indexedDB' };
      }
      
      console.log(`${cacheType}缓存未找到`);
      return { data: null, source: null };
    } catch (error) {
      console.error(`读取${cacheType}缓存失败:`, error);
      return { data: null, source: null };
    }
  }

  // 统一的缓存更新策略
  async updateCache(cacheType, newData, organizationId) {
    const key = `${cacheType}_${organizationId}`;
    const storeName = cacheType === 'patientlist' ? PATIENT_STORE : CHECK_STORE;
    
    try {
      // 1. 更新IndexedDB
      const indexedDBSuccess = await this.saveToIndexedDB(storeName, key, newData);
      
      // 2. 更新localStorage
      if (indexedDBSuccess) {
        const localStorageSuccess = this.safeSetLocalStorage(cacheType, JSON.stringify(newData));
        if (localStorageSuccess) {
          this.safeSetLocalStorage(`${cacheType}_storage`, 'indexedDB');
          this.safeSetLocalStorage(`${cacheType}_indexedDB_key`, key);
          console.log(`${cacheType}缓存更新成功`);
        } else {
          console.warn(`localStorage更新失败`);
        }
      }
      
      return indexedDBSuccess;
    } catch (error) {
      console.error(`更新${cacheType}缓存失败:`, error);
      return false;
    }
  }

  // 清除缓存
  async clearCache(cacheType, organizationId) {
    const key = `${cacheType}_${organizationId}`;
    const storeName = cacheType === 'patientlist' ? PATIENT_STORE : CHECK_STORE;
    
    try {
      // 清除localStorage
      localStorage.removeItem(cacheType);
      localStorage.removeItem(`${cacheType}_storage`);
      localStorage.removeItem(`${cacheType}_indexedDB_key`);
      
      // 清除IndexedDB
      const db = await this.initDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      console.log(`${cacheType}缓存清除成功`);
      return true;
    } catch (error) {
      console.error(`清除${cacheType}缓存失败:`, error);
      return false;
    }
  }

  // 获取缓存状态信息
  getCacheStatus(cacheType, organizationId) {
    const key = `${cacheType}_${organizationId}`;
    const localData = localStorage.getItem(cacheType);
    const storageType = localStorage.getItem(`${cacheType}_storage`);
    const indexedDBKey = localStorage.getItem(`${cacheType}_indexedDB_key`);
    
    return {
      hasLocalData: !!localData,
      storageType: storageType || 'none',
      indexedDBKey: indexedDBKey,
      localDataSize: localData ? JSON.stringify(localData).length : 0,
      organizationId: organizationId
    };
  }

  // 验证缓存完整性
  async validateCache(cacheType, organizationId) {
    const localData = localStorage.getItem(cacheType);
    const indexedDBData = await this.getFromIndexedDB(
      cacheType === 'patientlist' ? PATIENT_STORE : CHECK_STORE,
      `${cacheType}_${organizationId}`
    );
    
    const localValid = localData && (() => {
      try {
        JSON.parse(localData);
        return true;
      } catch {
        return false;
      }
    })();
    
    const indexedDBValid = !!indexedDBData;
    
    return {
      localValid,
      indexedDBValid,
      isConsistent: localValid === indexedDBValid,
      hasData: localValid || indexedDBValid
    };
  }
}

// 创建全局实例
const cacheManager = new CacheManager();

// 导出工具函数
export const saveCache = (cacheType, data, organizationId) => 
  cacheManager.saveCache(cacheType, data, organizationId);

export const getCache = (cacheType, organizationId) => 
  cacheManager.getCache(cacheType, organizationId);

export const updateCache = (cacheType, newData, organizationId) => 
  cacheManager.updateCache(cacheType, newData, organizationId);

export const clearCache = (cacheType, organizationId) => 
  cacheManager.clearCache(cacheType, organizationId);

export const getCacheStatus = (cacheType, organizationId) => 
  cacheManager.getCacheStatus(cacheType, organizationId);

export const validateCache = (cacheType, organizationId) => 
  cacheManager.validateCache(cacheType, organizationId);

export const checkLocalStorageQuota = () => 
  cacheManager.checkLocalStorageQuota();

export const getLocalStorageUsage = () => 
  cacheManager.getLocalStorageUsage();

// 导出常量
export { DB_NAME, DB_VERSION, PATIENT_STORE, CHECK_STORE, ACCOUNT_STORE };

// 导出实例（如果需要直接使用）
export default cacheManager;
