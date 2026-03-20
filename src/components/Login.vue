<template>
  <div class="login-wrapper">
    <a-layout style="height: 100vh;">
      <a-layout-content style="display: flex; align-items: center; justify-content: center;">
        <div class="login-form">
          <a-form @submit.prevent="handleLogin" @keyup.enter="handleLogin" style="width: 300px;">
            <!-- 登录状态提示 -->
            <div v-if="savedAccounts.length > 0" style="margin-bottom: 16px; padding: 8px 12px; background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 6px;">
              <div style="font-size: 14px; color: #52c41a; font-weight: 500;">
                📋 发现 {{ savedAccounts.length }} 个已保存的账号
              </div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                您可以从下拉框中选择快速登录，或输入新账号信息
              </div>
              <div style="font-size: 11px; color: #52c41a; margin-top: 4px; font-style: italic;">
                💡 快速登录：无需网络请求，直接使用缓存数据，秒级切换
              </div>
            </div>
            
            <!-- 账号保存提示 -->
            <div v-if="savedAccounts.length === 0" style="margin-bottom: 16px; padding: 8px 12px; background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 6px;">
              <div style="font-size: 14px; color: #1890ff; font-weight: 500;">
                💡 首次使用多账号管理
              </div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                勾选"保存账号"后，您的账号信息将保存到本地，支持快速切换登录
              </div>
            </div>
            
            <!-- 账号选择下拉框 -->
            <a-form-item v-if="savedAccounts.length > 0">
              <div style="display: flex; gap: 8px; align-items: center;">
                <a-select 
                  v-model:value="selectedAccountIndex" 
                  placeholder="选择已保存的账号"
                  @change="handleAccountSelect"
                  style="flex: 1;"
                >
                  <a-select-option 
                    v-for="(account, index) in savedAccounts" 
                    :key="index" 
                    :value="index"
                  >
                    {{ account.username }} ({{ account.organization_name || '未知机构' }}{{ account.isSubaccount ? ' - 子账号' : '' }})
                  </a-select-option>
                  <a-select-option value="new">+ 使用新账号登录</a-select-option>
                </a-select>
                <a-button 
                  v-if="selectedAccountIndex !== null && selectedAccountIndex !== 'new'"
                  type="text" 
                  danger 
                  size="small"
                  @click="deleteAccount"
                  title="删除此账号"
                >
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                已保存 {{ savedAccounts.length }} 个账号，支持快速切换
              </div>
            </a-form-item>
            
            <!-- 应用模式选择（必选） -->
            <a-form-item :required="true">
              <a-select 
                v-model:value="selectedAppMode" 
                placeholder="请选择应用模式（必选）"
                @change="handleAppModeChange"
                :disabled="appModeLoading || checkingVersions"
              >
                <a-select-option 
                  v-for="mode in availableModes" 
                  :key="mode.value"
                  :value="mode.value"
                >
                  {{ mode.label }}
                </a-select-option>
              </a-select>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                <span v-if="checkingVersions" style="color: #1890ff;">
                  正在检测可用版本...
                </span>
                <span v-else-if="currentAppMode">{{ getAppModeLabel(currentAppMode) }}</span>
                <span v-else style="color: #ff4d4f;">请先选择应用模式才能登录</span>
                <span v-if="availableModes.length === 0 && !checkingVersions" style="color: #ff4d4f; margin-left: 8px;">
                  未检测到可用版本
                </span>
              </div>
            </a-form-item>
            
            <a-form-item>
              <a-input v-model:value="username" placeholder="账号" />
            </a-form-item>
            <a-form-item>
              <a-input-password v-model:value="password" placeholder="密码" />
            </a-form-item>
            <a-form-item>
              <a-checkbox v-model:checked="rememberMe">保存账号</a-checkbox>
            </a-form-item>
            <a-form-item>
              <a-checkbox v-model:checked="autoLogin" @change="handleAutoLoginChange">自动登录</a-checkbox>
            </a-form-item>
            <a-form-item>
              <a-button 
                type="primary" 
                block 
                :loading="loadingVisible"
                @click="handleLogin"
                @mousedown.prevent
              >
                登录
              </a-button>
            </a-form-item>
            
            <!-- 账号管理按钮 -->
            <a-form-item v-if="savedAccounts.length > 0" style="margin-bottom: 8px;">
              <a-button 
                type="link" 
                size="small" 
                @click="showAccountManager"
                style="padding: 0; height: auto;"
              >
                管理已保存的账号 ({{ savedAccounts.length }})
              </a-button>
            </a-form-item>
            
            <!-- 调试按钮（开发环境使用） -->
            <a-form-item v-if="isDevelopment" style="margin-bottom: 8px;">
              <a-button 
                type="link" 
                size="small" 
                danger
                @click="rebuildDatabase"
                style="padding: 0; height: auto;"
              >
                🔧 重建数据库（慎点！！！）
              </a-button>
            </a-form-item>
            
            <!-- 手动刷新按钮 -->
            <a-form-item style="margin-bottom: 8px;">
              <a-button 
                type="link" 
                size="small" 
                @click="refreshPage"
                style="padding: 0; height: auto; color: #1890ff;"
              >
                🔄 更新应用
              </a-button>
            </a-form-item>
            
            <input type="hidden" name="csrfmiddlewaretoken" ref="csrfTokenInput" value="{{ csrf_token }}" />
          </a-form>
        </div>
      </a-layout-content>
    </a-layout>

    <!-- 全屏加载动画 -->
    <a-modal
        v-model:open="loadingVisible"
        :footer="null"
        :closable="false"
        :maskClosable="false"
        :keyboard="false"
        :width="400"
        :centered="true"
        :maskStyle="{ background: 'rgba(0, 0, 0, 0.45)' }"
        class="loading-modal"
    >
      <div class="loading-content">
        <div class="loading-icon">
          <a-spin size="large" />
        </div>
        <div class="loading-text">
          <h3>{{ loadingText }}</h3>
          <p v-if="loadingProgress">{{ loadingProgress }}</p>
        </div>
      </div>
    </a-modal>

    <!-- 账号管理弹窗 -->
    <a-modal
      v-model:open="accountManagerVisible"
      title="账号管理"
      :footer="null"
      :width="500"
    >
      <div style="max-height: 400px; overflow-y: auto;">
        <div v-for="(account, index) in savedAccounts" :key="index" class="account-item">
          <div class="account-info">
            <div class="account-main">
              <strong>{{ account.username }}</strong>
              <span class="account-org">{{ account.organization_name || '未知机构' }}</span>
              <span v-if="selectedAccountIndex === index" class="current-account-badge">当前选中</span>
            </div>
            <div class="account-meta">
              <div class="account-status">
                <span class="account-time">最后登录: {{ formatTime(account.lastLoginTime) }}</span>
                <div class="cache-status">
                  <span v-if="account.patientIndexedDBKey && account.checkIndexedDBKey" class="cache-badge cache-available">
                    有缓存数据
                  </span>
                  <span v-else class="cache-badge cache-unavailable">
                    无缓存数据
                  </span>
                </div>
              </div>
              <div class="account-actions">
                <a-button 
                  v-if="selectedAccountIndex !== index"
                  type="primary" 
                  size="small" 
                  @click="switchToAccount(index)"
                >
                  切换到此账号
                </a-button>
                <a-button 
                  v-else
                  type="default" 
                  size="small" 
                  disabled
                >
                  当前账号
                </a-button>
                <a-button 
                  type="link" 
                  size="small" 
                  danger 
                  @click="deleteAccountFromManager(index)"
                >
                  删除
                </a-button>
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
          <a-button 
            type="default" 
            danger 
            block 
            @click="clearAllAccounts"
          >
            清除所有已保存的账号
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 确认对话框 -->
    <a-modal
      v-model:open="confirmModalVisible"
      :title="confirmModalTitle"
      :ok-text="confirmModalOkText"
      :cancel-text="confirmModalCancelText"
      :ok-type="confirmModalOkType"
      @ok="handleConfirmOk"
      @cancel="handleConfirmCancel"
    >
      <p>{{ confirmModalContent }}</p>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineEmits } from 'vue';
import { message, Layout, Form, Input, Checkbox, Button, Modal, Spin, Select } from 'ant-design-vue';
const { Password } = Input;
import { DeleteOutlined } from '@ant-design/icons-vue';
import { saveCache } from '@/utils/cacheManager';

// 向父组件派发登录成功事件
const emit = defineEmits(['login-success']);

// 开发环境检测
const isDevelopment = ref(import.meta.env?.MODE === 'development' || import.meta.env?.DEV === true);

// 快捷键状态追踪
const keyPressed = ref({
  ctrl: false,
  shift: false,
  p: false
});

// 防抖计时器
let debounceTimer = null;

const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const autoLogin = ref(false);
const csrfTokenInput = ref(null);
const loadingVisible = ref(false);
const loadingText = ref('正在加载数据...');
const loadingProgress = ref('');

// 应用模式相关
const APP_MODES = {
  STABLE: 'stable',
  TEST: 'test',
  DEVELOPMENT: 'development'
}

const currentAppMode = ref('');
const selectedAppMode = ref(null);
const appModeLoading = ref(false);
const checkingVersions = ref(false); // 是否正在检测版本
const availableModes = ref([]); // 可用的版本列表 [{value: 'stable', label: '稳定版', url: '...'}]


// 多账号管理相关
const savedAccounts = ref([]);
const selectedAccountIndex = ref(null);
const accountManagerVisible = ref(false); // 新增：控制账号管理弹窗的显示

// 获取应用模式标签
const getAppModeLabel = (mode) => {
  const labels = {
    'stable': '稳定版',
    'test': '测试版',
    'development': '开发版'
  }
  return labels[mode] || mode
}

// 从主进程获取当前应用模式
const loadAppMode = async () => {
  try {
    // 检查是否在Electron环境中
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron')
      const result = await ipcRenderer.invoke('get-app-mode')
      currentAppMode.value = result.mode
      selectedAppMode.value = result.mode
      
      console.log('当前应用模式:', result.mode, 'URL:', result.url)
    } else {
      // 非Electron环境，从localStorage读取
      const savedMode = localStorage.getItem('app-mode')
      if (savedMode) {
      currentAppMode.value = savedMode
      selectedAppMode.value = savedMode
      } else {
        // 默认稳定版
        currentAppMode.value = APP_MODES.STABLE
        selectedAppMode.value = APP_MODES.STABLE
      }
    }
  } catch (error) {
    console.error('获取应用模式失败:', error)
    // 默认稳定版
    currentAppMode.value = APP_MODES.STABLE
    selectedAppMode.value = APP_MODES.STABLE
  }
}

// 版本URL配置
const MODE_URLS = {
  [APP_MODES.STABLE]: 'https://aiforoptometry.com/media/exehtml/v1/index.html',
  [APP_MODES.TEST]: 'https://aiforoptometry.com/media/exehtml/v2/index.html',
  [APP_MODES.DEVELOPMENT]: 'http://localhost:5173'
}

// 版本标签配置（用于前端显示）
const MODE_LABELS = {
  [APP_MODES.STABLE]: '稳定版',
  [APP_MODES.TEST]: '测试版',
  [APP_MODES.DEVELOPMENT]: '开发版'
}

// 检测URL是否可用
const checkUrlAvailable = async (url) => {
  try {
    // 对于本地URL和远程URL使用不同的策略
    if (url.startsWith('http://localhost')) {
      // 本地URL：使用图片加载方式检测（更可靠）
      try {
        const img = new Image()
        const checkPromise = new Promise((resolve) => {
          img.onload = () => resolve(true)
          img.onerror = () => resolve(false)
          setTimeout(() => resolve(false), 2000) // 2秒超时
        })
        // 尝试加载favicon或根路径
        img.src = url + '/favicon.ico?' + Date.now()
        return await checkPromise
      } catch {
        return false
      }
    } else {
      // 远程URL：使用fetch检测，但使用更宽松的策略
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时
        
        // 尝试使用GET请求检测（HEAD可能被某些服务器拒绝）
        const response = await fetch(url, {
          method: 'GET',
          mode: 'no-cors', // 避免CORS问题
          signal: controller.signal,
          cache: 'no-cache'
        })
        clearTimeout(timeoutId)
        // 如果能到达这里，说明URL可访问
        return true
      } catch (error) {
        // 对于远程URL，即使fetch失败，也尝试用图片加载
        if (error.name === 'AbortError' || error.name === 'TypeError') {
          try {
            const img = new Image()
            const checkPromise = new Promise((resolve) => {
              img.onload = () => resolve(true)
              img.onerror = () => resolve(false)
              setTimeout(() => resolve(false), 3000) // 3秒超时
            })
            img.src = url + '?' + Date.now()
            return await checkPromise
          } catch {
            // 如果图片加载也失败，对于远程URL，我们假设网络正常时是可用的
            // 返回true，让用户尝试（因为可能是临时网络问题）
            return true
          }
        }
        return false
      }
    }
  } catch (error) {
    console.error('检测URL失败:', url, error)
    return false
  }
}

// 检测所有版本的可用性（从主进程获取）
const checkAllVersions = async () => {
  checkingVersions.value = true
  availableModes.value = []
  
  console.log('[Frontend] ========== Starting version check ==========')
  console.log('[Frontend] window exists:', typeof window !== 'undefined')
  console.log('[Frontend] window.require exists:', typeof window !== 'undefined' && typeof window.require !== 'undefined')
  
  try {
    // 检查是否在Electron环境中
    let canUseIPC = false
    let ipcRenderer = null
    
    if (typeof window !== 'undefined' && typeof window.require !== 'undefined') {
      try {
        console.log('[Frontend] Attempting to require electron...')
        ipcRenderer = window.require('electron').ipcRenderer
        console.log('[Frontend] Successfully got ipcRenderer:', !!ipcRenderer)
        canUseIPC = true
      } catch (requireError) {
        console.error('[Frontend] Failed to require electron:', requireError)
        canUseIPC = false
      }
    } else {
      console.log('[Frontend] window.require not available (not Electron or remote content)')
    }
    
    if (canUseIPC && ipcRenderer) {
      try {
        console.log('[Frontend] Calling IPC: get-available-versions...')
        const versions = await ipcRenderer.invoke('get-available-versions')
        console.log('[Frontend] IPC response received:', versions)
        console.log('[Frontend] IPC response type:', typeof versions)
        console.log('[Frontend] IPC response is array:', Array.isArray(versions))
        
        if (versions && Array.isArray(versions) && versions.length > 0) {
          // 将主进程返回的英文标签转换为中文标签（用于前端显示）
          availableModes.value = versions.map(v => ({
            ...v,
            label: MODE_LABELS[v.value] || v.label // 使用前端的中文标签
          }))
          
          console.log('[Frontend] Available versions:', availableModes.value.map(m => m.label).join(', '))
          console.log('[Frontend] Available modes count:', availableModes.value.length)
        } else {
          console.warn('[Frontend] No versions received from main process, using fallback')
          // 如果主进程返回空数组，使用默认值
          availableModes.value = [{
            value: APP_MODES.STABLE,
            label: MODE_LABELS[APP_MODES.STABLE],
            url: MODE_URLS[APP_MODES.STABLE]
          }]
        }
      } catch (ipcError) {
        console.error('[Frontend] IPC call failed:', ipcError)
        console.error('[Frontend] IPC error details:', {
          name: ipcError?.name,
          message: ipcError?.message,
          stack: ipcError?.stack
        })
        // IPC调用失败，继续使用前端检测作为备用
        availableModes.value = []
      }
    } else {
      console.log('[Frontend] Cannot use IPC, will use fallback detection')
      availableModes.value = []
    }
    
    // 如果Electron环境检测失败或非Electron环境，使用前端检测
    if (availableModes.value.length === 0) {
      console.log('[Frontend] Using frontend detection as fallback')
      const checkPromises = Object.values(APP_MODES).map(async (mode) => {
        const url = MODE_URLS[mode]
        const label = MODE_LABELS[mode]
        
        console.log(`检测 ${label} (${mode}): ${url}`)
        try {
          const isAvailable = await checkUrlAvailable(url)
          
          if (isAvailable) {
            console.log(`✓ ${label} 可用`)
            return { value: mode, label, url }
          } else {
            console.log(`✗ ${label} 不可用`)
            return null
          }
        } catch (error) {
          console.error(`检测 ${label} 时出错:`, error)
          return null
        }
      })
      
      const results = await Promise.all(checkPromises)
      availableModes.value = results.filter(mode => mode !== null)
      
      // 如果检测后没有任何可用版本，至少显示稳定版
      if (availableModes.value.length === 0) {
        console.warn('[Frontend] No versions detected, using default stable version')
        availableModes.value = [{
          value: APP_MODES.STABLE,
          label: MODE_LABELS[APP_MODES.STABLE],
          url: MODE_URLS[APP_MODES.STABLE]
        }]
      }
    }
    
    // 确保至少有一个可用版本（最终保障）
    if (availableModes.value.length === 0) {
      console.error('[Frontend] CRITICAL: availableModes is still empty, forcing default')
      availableModes.value = [{
        value: APP_MODES.STABLE,
        label: MODE_LABELS[APP_MODES.STABLE],
        url: MODE_URLS[APP_MODES.STABLE]
      }]
    }
    
    // 如果当前选择的模式不在可用列表中，自动切换到第一个可用模式
    if (selectedAppMode.value && !availableModes.value.find(m => m.value === selectedAppMode.value)) {
      if (availableModes.value.length > 0) {
        console.log(`[Frontend] Current mode unavailable, switching to: ${availableModes.value[0].label}`)
        selectedAppMode.value = availableModes.value[0].value
        currentAppMode.value = availableModes.value[0].value
      }
    }
    
    console.log('[Frontend] ========== Version check completed ==========')
    console.log('[Frontend] Final availableModes:', availableModes.value)
    console.log('[Frontend] Final availableModes.length:', availableModes.value.length)
    
    return availableModes.value
  } catch (error) {
    console.error('[Frontend] ERROR in checkAllVersions:', error)
    console.error('[Frontend] Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    })
    // 发生错误时，至少提供稳定版作为默认选项
    availableModes.value = [{
      value: APP_MODES.STABLE,
      label: MODE_LABELS[APP_MODES.STABLE],
      url: MODE_URLS[APP_MODES.STABLE]
    }]
    console.log('[Frontend] Set default stable version due to error')
    return availableModes.value
  } finally {
    checkingVersions.value = false
    console.log('[Frontend] checkingVersions set to false')
  }
}

// 处理应用模式切换
const handleAppModeChange = async (mode) => {
  if (!mode) {
    selectedAppMode.value = null
    return
  }
  
  // 检查选择的模式是否在可用列表中（理论上不应该发生，因为UI已经过滤）
  const availableMode = availableModes.value.find(m => m.value === mode)
  if (!availableMode) {
    message.error('选择的版本不可用，请选择其他版本')
    selectedAppMode.value = currentAppMode.value
    return
  }
  
  // 如果模式发生变化，切换模式并重启应用
  if (mode !== currentAppMode.value) {
    try {
      appModeLoading.value = true
      
      // 检查是否在Electron环境中
      if (typeof window !== 'undefined' && window.require) {
        const { ipcRenderer } = window.require('electron')
        const result = await ipcRenderer.invoke('switch-app-mode', mode, null)
        
        if (result.success) {
          if (result.restart) {
            message.success('模式已切换，应用即将重启...')
            // 保存选择的模式到localStorage
            localStorage.setItem('app-mode', mode)
          } else {
            message.info(result.message || '模式切换成功')
          }
        } else {
          message.error(result.error || '模式切换失败')
          // 恢复选择
          selectedAppMode.value = currentAppMode.value
        }
      } else {
        // 非Electron环境，仅保存到localStorage
        localStorage.setItem('app-mode', mode)
        currentAppMode.value = mode
        message.success('模式已保存（非Electron环境，无需重启）')
      }
    } catch (error) {
      console.error('切换模式失败:', error)
      message.error('切换模式失败，请重试')
      // 恢复选择
      selectedAppMode.value = currentAppMode.value
    } finally {
      appModeLoading.value = false
    }
  }
}


// 确认对话框状态
const confirmModalVisible = ref(false);
const confirmModalTitle = ref('');
const confirmModalContent = ref('');
const confirmModalOkText = ref('确定');
const confirmModalCancelText = ref('取消');
const confirmModalOkType = ref('primary');
const confirmModalOnOk = ref(null);
const confirmModalOnCancel = ref(null);

// 账号数据结构
const createAccountData = (loginData, organization, patientData, checkData) => {
  console.log('创建账号数据，输入参数:', {
    username: loginData.username,
    organization: organization?.name,
    hasPatientData: !!patientData,
    hasCheckData: !!checkData
  });
  
  // 根据你的需求：总是将数据保存到IndexedDB，账号数据中不包含完整数据
  const accountData = {
    username: loginData.username,
    password: loginData.password,
    autoLogin: loginData.autoLogin,
    organization_id: loginData.organization_id,
    organization_name: organization?.name || '',
    organization_data: organization,
    // 账号数据中不包含完整数据，只保存存储方式信息
    patientlist: null, // 数据存储在IndexedDB中
    patientStorage: 'indexedDB', // 总是使用IndexedDB
    patientIndexedDBKey: patientData ? `patientlist_${loginData.organization_id}` : null,
    lastLoginTime: new Date().toISOString(),
    access_token: loginData.access_token,
    refresh_token: loginData.refresh_token,
    csrf_token: loginData.csrf_token
  };
  
  // 只有在有检查记录数据时才设置相关字段（现在不再使用）
  if (checkData) {
    accountData.checkmanagementlist = null;
    accountData.checkStorage = 'indexedDB';
    accountData.checkIndexedDBKey = `checkmanagementlist_${loginData.organization_id}`;
  }
  
  console.log('创建的账号数据:', {
    username: accountData.username,
    organization_id: accountData.organization_id,
    organization_name: accountData.organization_name,
    patientStorage: accountData.patientStorage,
    checkStorage: accountData.checkStorage,
    patientIndexedDBKey: accountData.patientIndexedDBKey,
    checkIndexedDBKey: accountData.checkIndexedDBKey,
    lastLoginTime: accountData.lastLoginTime
  });
  
  return accountData;
};

// 保存账号信息到localStorage
const saveAccountToStorage = async (accountData) => {
  console.log('开始保存账号到存储:', accountData.username);
  console.log('账号数据详情:', {
    username: accountData.username,
    organization_id: accountData.organization_id,
    organization_name: accountData.organization_name,
    hasPatientData: !!accountData.patientlist,
    hasCheckData: !!accountData.checkmanagementlist,
    lastLoginTime: accountData.lastLoginTime
  });
  
  try {
    const accounts = JSON.parse(localStorage.getItem('multiAccounts') || '[]');
    console.log('当前已保存账号数量:', accounts.length);
    console.log('现有账号列表:', accounts.map(acc => acc.username));
    
    // 检查是否已存在相同账号
    const existingIndex = accounts.findIndex(acc => acc.username === accountData.username);
    
    if (existingIndex >= 0) {
      // 更新现有账号
      console.log('更新现有账号:', accountData.username);
      accounts[existingIndex] = { ...accounts[existingIndex], ...accountData };
    } else {
      // 添加新账号
      console.log('添加新账号:', accountData.username);
      accounts.push(accountData);
    }
    
    // 按最后登录时间排序
    accounts.sort((a, b) => new Date(b.lastLoginTime) - new Date(a.lastLoginTime));
    
    console.log('保存的账号数量:', accounts.length);
    console.log('保存的账号列表:', accounts.map(acc => acc.username));
    
    // 检查数据大小，如果太大则使用IndexedDB存储账号数据
    const accountsString = JSON.stringify(accounts);
    if (accountsString.length > 1000000) { // 1MB限制
      console.warn('账号数据过大，使用IndexedDB存储');
      // 将账号数据存储到IndexedDB
      const success = await saveLargeDataToIndexedDB(ACCOUNT_STORE, 'accounts', accounts);
      if (success) {
        // 在localStorage中只保存基本信息
        const basicAccounts = accounts.map(account => ({
          username: account.username,
          organization_id: account.organization_id,
          organization_name: account.organization_name,
          lastLoginTime: account.lastLoginTime,
          patientStorage: account.patientStorage,
          checkStorage: account.checkStorage,
          patientIndexedDBKey: account.patientIndexedDBKey,
          checkIndexedDBKey: account.checkIndexedDBKey,
          hasPatientData: !!account.patientIndexedDBKey,
          hasCheckData: !!account.checkIndexedDBKey
        }));
        localStorage.setItem('multiAccounts', JSON.stringify(basicAccounts));
        localStorage.setItem('multiAccounts_storage', 'indexedDB');
      }
    } else {
      // 保存到localStorage
      localStorage.setItem('multiAccounts', JSON.stringify(accounts));
    }
    console.log('localStorage保存完成');
    
    // 更新响应式数据
    savedAccounts.value = accounts;
    console.log('响应式数据更新完成');
    
    // 验证保存是否成功
    const verification = JSON.parse(localStorage.getItem('multiAccounts') || '[]');
    const savedAccount = verification.find(acc => acc.username === accountData.username);
    if (savedAccount) {
      console.log('账号保存验证成功:', savedAccount.username);
    } else {
      console.error('账号保存验证失败！');
    }
    
    console.log('账号保存完成，更新后的账号数量:', accounts.length);
    return true;
  } catch (error) {
    console.error('保存账号时发生错误:', error);
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage配额不足，清理旧数据后重试');
      // 清理localStorage中的其他数据
      try {
        localStorage.removeItem('patientlist');
        localStorage.removeItem('checkmanagementlist');
        // 重新尝试保存（不包含缓存数据）
        const cleanAccountData = { ...accountData };
        delete cleanAccountData.patientlist;
        delete cleanAccountData.checkmanagementlist;
        return await saveAccountToStorage(cleanAccountData);
      } catch (retryError) {
        console.error('重试保存失败:', retryError);
        return false;
      }
    }
    return false;
  }
};

// 从localStorage或IndexedDB加载账号信息
const loadAccountsFromStorage = async () => {
  try {
    // 检查是否使用IndexedDB存储
    const storageType = localStorage.getItem('multiAccounts_storage');
    
    if (storageType === 'indexedDB') {
      // 从IndexedDB读取完整账号数据
      const fullAccounts = await getLargeDataFromIndexedDB(ACCOUNT_STORE, 'accounts');
      if (fullAccounts) {
        savedAccounts.value = fullAccounts;
        return fullAccounts;
      }
    }
    
    // 从localStorage读取
    const accounts = JSON.parse(localStorage.getItem('multiAccounts') || '[]');
    savedAccounts.value = accounts;
    return accounts;
  } catch (error) {
    console.error('加载多账号信息失败:', error);
    return [];
  }
};

// IndexedDB 数据库管理
const DB_NAME = 'ERP_CACHE_DB';
const DB_VERSION = 2;
const ACCOUNT_STORE = 'accounts';

// 删除现有数据库
const deleteExistingDB = () => {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => {
      console.log('现有数据库删除成功');
      resolve();
    };
    request.onerror = () => {
      console.log('删除数据库失败或数据库不存在');
      resolve();
    };
  });
};

// 初始化IndexedDB
const initDB = async () => {
  // 检查是否需要重建数据库
  const needRebuild = localStorage.getItem('need_rebuild_indexeddb');
  if (needRebuild === 'true') {
    console.log('检测到需要重建数据库，正在删除现有数据库...');
    await deleteExistingDB();
    localStorage.removeItem('need_rebuild_indexeddb');
  }
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('IndexedDB升级中，版本:', event.oldVersion, '->', event.newVersion);
      
      // 删除旧的存储（如果存在）
      if (db.objectStoreNames.contains('patients')) {
        db.deleteObjectStore('patients');
      }
      if (db.objectStoreNames.contains('checks')) {
        db.deleteObjectStore('checks');
      }
      if (db.objectStoreNames.contains(ACCOUNT_STORE)) {
        db.deleteObjectStore(ACCOUNT_STORE);
      }
      
      // 创建患者数据存储
      const patientStore = db.createObjectStore('patients', { keyPath: 'key' });
      patientStore.createIndex('key', 'key', { unique: true });
      console.log('患者数据存储创建成功');
      
      // 创建检查数据存储
      const checkStore = db.createObjectStore('checks', { keyPath: 'key' });
      checkStore.createIndex('key', 'key', { unique: true });
      console.log('检查数据存储创建成功');
      
      // 创建账号数据存储
      const accountStore = db.createObjectStore(ACCOUNT_STORE, { keyPath: 'key' });
      accountStore.createIndex('key', 'key', { unique: true });
      console.log('账号数据存储创建成功');
    };
  });
};

// 保存大数据到IndexedDB
const saveLargeDataToIndexedDB = async (storeName, key, data) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const dataObject = { key, data, timestamp: Date.now() };
    console.log('准备保存到IndexedDB的对象:', dataObject);
    console.log('key值:', key);
    console.log('key类型:', typeof key);
    
    const result = await new Promise((resolve, reject) => {
      const request = store.put(dataObject);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    console.log(`大数据保存到IndexedDB成功: ${storeName} - ${key}`);
    return true;
  } catch (error) {
    console.error(`保存大数据到IndexedDB失败: ${storeName} - ${key}`, error);
    return false;
  }
};

// 从IndexedDB读取大数据
const getLargeDataFromIndexedDB = async (storeName, key) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    const result = await new Promise((resolve, reject) => {
      // 使用key作为查询条件
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (result) {
      console.log(`从IndexedDB读取大数据成功: ${storeName} - ${key}`);
      return result.data;
    }
    return null;
  } catch (error) {
    console.error(`从IndexedDB读取大数据失败: ${storeName} - ${key}`, error);
    return null;
  }
};

// 检查数据大小并选择合适的存储方式
const saveDataWithSizeCheck = async (key, data, dataType, organizationId = null) => {
  const dataString = JSON.stringify(data);
  const dataSize = dataString.length;
  
  console.log(`${dataType}数据大小: ${(dataSize / 1024 / 1024).toFixed(2)}MB`);
  
  let localStorageSuccess = false;
  
  // 尝试保存到localStorage
  try {
    localStorage.setItem(key, dataString);
    console.log(`${dataType}数据已保存到localStorage（主界面可立即访问）`);
    localStorageSuccess = true;
  } catch (error) {
    console.warn(`localStorage保存失败: ${error.message}`);
    localStorageSuccess = false;
  }
  
  if (dataSize < 5000000 && localStorageSuccess) { // 5MB以下且localStorage成功，只使用localStorage
    console.log(`${dataType}数据大小适中，仅使用localStorage存储`);
    return { success: true, storage: 'localStorage' };
  }
  
  // 5MB以上或localStorage失败，保存到IndexedDB
  const storeName = dataType === 'patient' ? 'patients' : 'checks';
  // 如果有organizationId，使用带机构ID的key
  const indexedDBKey = organizationId ? `${key}_${organizationId}` : key;
  const success = await saveLargeDataToIndexedDB(storeName, indexedDBKey, data);
  
  if (success) {
    console.log(`${dataType}数据保存到IndexedDB成功，key: ${indexedDBKey}`);
    // 如果localStorage失败，从localStorage中移除该key，避免存储不完整的数据
    if (!localStorageSuccess) {
      localStorage.removeItem(key);
    }
    return { success: true, storage: 'indexedDB', indexedDBKey };
  } else {
    console.error(`${dataType}数据IndexedDB保存失败`);
    // 如果localStorage成功但IndexedDB失败，仍然返回成功
    if (localStorageSuccess) {
      return { success: true, storage: 'localStorage' };
    } else {
      return { success: false, storage: null };
    }
  }
};

// 读取数据（使用统一缓存管理器）
const getDataWithFallback = async (key, dataType, organizationId = null) => {
  if (!organizationId) {
    console.warn('未提供organizationId，无法使用缓存管理器');
    return { data: null, storage: null };
  }
  
  try {
    // 使用统一缓存管理器读取数据
    const result = await getCache(key, organizationId);
    if (result.data) {
      console.log(`${dataType}数据从缓存读取成功，来源: ${result.source}`);
      return { data: result.data, storage: result.source };
    } else {
      console.log(`${dataType}数据未找到`);
      return { data: null, storage: null };
    }
  } catch (error) {
    console.error(`读取${dataType}数据失败:`, error);
    return { data: null, storage: null };
  }
};

// 处理账号选择
const handleAccountSelect = (index) => {
  if (index === 'new') {
    // 选择新账号登录
    username.value = '';
    password.value = '';
    rememberMe.value = false;
    autoLogin.value = false;
    selectedAccountIndex.value = null;
  } else {
    // 选择已保存的账号
    const account = savedAccounts.value[index];
    username.value = account.username;
    password.value = account.password;
    rememberMe.value = true;
    autoLogin.value = account.autoLogin;
    selectedAccountIndex.value = index;
  }
};

// 使用缓存的账号数据直接登录
const loginWithCachedData = async (accountData) => {
  console.log('使用缓存数据快速登录:', accountData.username);
  console.log('账号数据详情:', {
    username: accountData.username,
    organization_id: accountData.organization_id,
    organization_name: accountData.organization_name,
    hasPatientData: !!accountData.patientlist,
    hasCheckData: !!accountData.checkmanagementlist,
    patientStorage: accountData.patientStorage,
    checkStorage: accountData.checkStorage
  });
  
  // 显示快速登录状态
  loadingText.value = '正在快速登录...';
  loadingProgress.value = '正在恢复缓存数据...';
  
  // 立即设置当前账号信息（这些是同步操作，会立即生效）
  localStorage.setItem('organization_id', accountData.organization_id);
  
  // 确保机构数据存在且格式正确
  if (accountData.organization_data) {
    localStorage.setItem('organization', JSON.stringify(accountData.organization_data));
  } else {
    // 如果没有机构数据，创建一个基本的机构对象
    const basicOrgData = {
      id: accountData.organization_id,
      name: accountData.organization_name || '未知机构',
      permissions: accountData.subaccount_permissions || [] // 子账号权限
    };
    localStorage.setItem('organization', JSON.stringify(basicOrgData));
    console.log('使用基本机构数据:', basicOrgData);
  }
  
  localStorage.setItem('organization_name', accountData.organization_name);
  localStorage.setItem('access_token', accountData.access_token);
  localStorage.setItem('refresh_token', accountData.refresh_token);
  localStorage.setItem('csrftoken', accountData.csrf_token);
  
  // 设置当前用户名标识，用于退出登录时识别当前账号
  localStorage.setItem('current_username', accountData.username);
  
  // 重要：先清除旧的缓存数据，确保不会混入上一个账号的数据
  console.log('清除旧的缓存数据，准备设置新账号的缓存...');
  localStorage.removeItem('patientlist');
  localStorage.removeItem('checkmanagementlist');
  localStorage.removeItem('patientlist_storage');
  localStorage.removeItem('checkmanagementlist_storage');
  localStorage.removeItem('patientlist_indexedDB_key');
  localStorage.removeItem('checkmanagementlist_indexedDB_key');
  
  // 统计缓存数据
  let cacheStats = [];
  let needFetchData = false; // 标记是否需要从后端获取数据
  
  // 检查账号是否有患者列表缓存键信息
  const hasPatientCacheKey = accountData.patientIndexedDBKey;
  
  console.log('缓存键检查:', {
    patientIndexedDBKey: hasPatientCacheKey
  });
  
  // 如果没有患者列表缓存键信息，直接标记需要获取数据
  if (!hasPatientCacheKey) {
    console.log('账号没有患者列表缓存键信息，需要从后端获取数据');
    needFetchData = true;
  }
  
  // 根据你的需求：总是从IndexedDB加载数据并覆盖到localStorage
  const asyncDataPromises = [];
  
  // 恢复患者数据（从IndexedDB）
  if (hasPatientCacheKey) {
    console.log('正在从IndexedDB恢复患者数据...');
    const patientKey = accountData.patientIndexedDBKey;
    console.log('尝试读取的患者数据key:', patientKey);
    
    const patientPromise = getLargeDataFromIndexedDB('patients', patientKey)
      .then(patientData => {
        if (patientData) {
          localStorage.setItem('patientlist', JSON.stringify(patientData));
          const patientCount = Array.isArray(patientData) ? patientData.length : 0;
          cacheStats.push(`${patientCount} 个患者 (IndexedDB)`);
          console.log('已从IndexedDB恢复患者列表缓存数据');
          // 设置存储方式标记
          localStorage.setItem('patientlist_storage', 'indexedDB');
          localStorage.setItem('patientlist_indexedDB_key', patientKey);
        } else {
          console.log('未找到患者数据缓存，需要从后端获取');
          needFetchData = true;
        }
      })
      .catch(error => {
        console.error('患者数据读取失败:', error);
        needFetchData = true;
      });
    asyncDataPromises.push(patientPromise);
  } else {
    console.log('患者数据没有缓存键，跳过IndexedDB读取');
  }
  
  // 等待所有异步数据恢复完成
  if (asyncDataPromises.length > 0) {
    await Promise.all(asyncDataPromises);
  }
  
  // 如果患者列表缓存数据不完整，自动从后端获取并补充
  if (needFetchData) {
    console.log('检测到患者列表缓存数据不完整，正在从后端获取数据...');
    loadingText.value = '正在补充缓存数据...';
    loadingProgress.value = '从服务器获取患者列表数据...';
    
    try {
      // 判断是否为开发环境
      const isDevelopment = import.meta.env.DEV;
      
      // 获取患者列表
      const patientUrl = isDevelopment 
        ? `/patient/opatientList_originationids/?organization_ids=${accountData.organization_id}`
        : `https://aiforoptometry.com/patient/opatientList_originationids/?organization_ids=${accountData.organization_id}`;
      console.log('请求患者列表:', patientUrl);
      
      // 创建超时控制器
      const patientController = new AbortController();
      const patientTimeoutId = setTimeout(() => patientController.abort(), 30000); // 30秒超时
      
      let patientResponse;
      try {
        patientResponse = await fetch(patientUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accountData.access_token}`
          },
          credentials: 'include',
          signal: patientController.signal
        });
        clearTimeout(patientTimeoutId); // 请求成功，清除超时
      } catch (fetchError) {
        clearTimeout(patientTimeoutId); // 清除超时定时器
        console.error('患者列表请求失败:', fetchError);
        if (fetchError.name === 'AbortError') {
          console.error('患者列表请求超时（30秒）');
          loadingProgress.value = '患者列表请求超时，跳过此数据';
        } else {
          console.error('患者列表网络错误:', fetchError.message);
          loadingProgress.value = '患者列表请求失败，跳过此数据';
        }
        patientResponse = null; // 设置为null，后续会跳过处理
      }

      if (patientResponse) {
        console.log('患者列表响应状态:', patientResponse.status, patientResponse.url);
      }

      loadingProgress.value = '正在处理数据...';
      
      let patientData = null;

      // 处理患者列表数据
      if (patientResponse && patientResponse.ok) {
        try {
          const responseText = await patientResponse.text();
          patientData = JSON.parse(responseText);
          console.log('患者列表数据获取成功，开始保存...');
          
          // 使用智能存储方式保存患者数据
          const patientResult = await saveDataWithSizeCheck('patientlist', patientData, 'patient', accountData.organization_id);
          if (patientResult.success) {
            console.log(`患者列表数据保存成功，存储方式: ${patientResult.storage}`);
            if (patientResult.storage === 'indexedDB') {
              localStorage.setItem('patientlist_storage', 'indexedDB');
              if (patientResult.indexedDBKey) {
                localStorage.setItem('patientlist_indexedDB_key', patientResult.indexedDBKey);
              }
            }
            const patientCount = Array.isArray(patientData) ? patientData.length : 0;
            cacheStats.push(`${patientCount} 个患者 (新获取)`);
          } else {
            console.warn('患者列表数据保存失败');
            patientData = null;
          }
        } catch (error) {
          console.error('解析患者列表数据失败:', error);
        }
      } else {
        console.error('患者列表请求失败:', patientResponse.status, patientResponse.statusText);
      }

      // 更新账号数据中的缓存信息
      if (patientData) {
        console.log('更新账号缓存信息...');
        const updatedAccountData = { ...accountData };
        
        updatedAccountData.patientIndexedDBKey = `patientlist_${accountData.organization_id}`;
        
        // 使用统一缓存管理器保存数据
        await saveCache('patientlist', patientData, accountData.organization_id);
        
        // 更新账号存储
        updatedAccountData.lastLoginTime = new Date().toISOString();
        await saveAccountToStorage(updatedAccountData);
        
        console.log('账号缓存信息更新完成');
      } else {
        console.warn('未能获取到患者列表数据，无法更新缓存信息');
      }
      
      console.log('缓存数据补充完成');
      
    } catch (error) {
      console.error('补充缓存数据失败:', error);
      loadingProgress.value = '缓存数据补充失败，但可以继续使用';
    }
  }
  
  // 更新最后登录时间
  accountData.lastLoginTime = new Date().toISOString();
  await saveAccountToStorage(accountData);
  
  // 最终验证：确保所有缓存数据都已正确设置
  loadingProgress.value = '正在验证数据完整性...';
  
  // 等待一下确保所有异步操作完成
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 验证数据是否已正确设置到localStorage
  console.log('最终验证localStorage数据设置（快速登录）:');
  console.log('organization_id:', localStorage.getItem('organization_id'));
  console.log('organization_name:', localStorage.getItem('organization_name'));
  
  const storedPatientData = localStorage.getItem('patientlist');
  
  if (storedPatientData) {
    try {
      const patientArray = JSON.parse(storedPatientData);
      console.log('patientlist长度:', Array.isArray(patientArray) ? patientArray.length : '非数组格式');
      if (Array.isArray(patientArray) && patientArray.length > 0) {
        console.log('patientlist第一条数据:', patientArray[0]);
      }
    } catch (e) {
      console.log('patientlist解析失败:', e);
    }
  } else {
    console.log('patientlist: null');
  }
  
  // 验证关键数据是否存在
  const hasPatientData = storedPatientData !== null;
  const hasOrgData = localStorage.getItem('organization_id') !== null;
  
  if (!hasOrgData) {
    console.error('机构信息未正确设置！');
    loadingText.value = '数据设置失败';
    loadingProgress.value = '机构信息未正确设置，请重试';
    setTimeout(() => {
      loadingVisible.value = false;
    }, 2000);
    return;
  }
  
  if (!hasPatientData) {
    console.warn('患者列表数据未正确设置，但继续跳转');
    loadingProgress.value = '患者列表数据加载失败，但可以继续使用';
  } else {
    console.log('患者列表数据验证通过，准备跳转');
    loadingProgress.value = '数据验证完成，正在跳转...';
  }
  
  // 显示成功消息和缓存统计
  const cacheInfo = cacheStats.length > 0 ? ` (${cacheStats.join(', ')})` : '';
  const sourceInfo = needFetchData ? '，已补充缓存数据' : '，使用缓存数据';
  loadingProgress.value = `快速登录成功${sourceInfo}${cacheInfo}，正在跳转...`;
  
  // 确保所有操作完成后再跳转
  await new Promise(resolve => setTimeout(resolve, 300));
  
  loadingVisible.value = false;
  emit('login-success');
};

async function handleLogin(e) {
  // 阻止默认表单提交行为和事件冒泡
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  console.log('尝试登录：', username.value);
  console.log('登录按钮被点击，开始处理登录逻辑');
  
  // 验证应用模式是否已选择
  if (!selectedAppMode.value) {
    message.error('请先选择应用模式才能登录');
    return;
  }
  
  // 验证选择的模式是否在可用列表中
  const availableMode = availableModes.value.find(m => m.value === selectedAppMode.value);
  if (!availableMode) {
    message.error('选择的版本不可用，请刷新页面重新检测或选择其他版本');
    return;
  }
  
  // 账号可以为任意格式
  if (!username.value || username.value.trim() === '') {
    message.error('请输入账号');
    return;
  }
  // 密码至少6位
  if (password.value.length < 6) {
    message.error('密码至少需要6位');
    return;
  }

  // 判断账号类型：纯中文为子账号，其他为机构账号
  const isChineseAccount = /^[\u4e00-\u9fa5]+$/.test(username.value);
  console.log('账号类型判断:', {
    username: username.value,
    isChineseAccount: isChineseAccount
  });

  // 已保存账号也走登录接口：重新验证账号密码并获取新 token，不再使用缓存直接登录

  // 显示登录中的 loading 动画
  loadingVisible.value = true;
  loadingText.value = '正在登录...';
  loadingProgress.value = '';

  try {
    let loginUrl, loginData;
    
    // 判断是否为开发环境
    const isDevelopment = import.meta.env.DEV;
    
    if (isChineseAccount) {
      // 纯中文账号：使用子账号登录接口
      console.log('使用子账号登录接口');
      // 在开发环境使用代理路径，避免CORS问题
      loginUrl = isDevelopment 
        ? '/subaccount/login/'
        : 'https://aiforoptometry.com/subaccount/login/';
      loginData = { account: username.value, password: password.value };
    } else {
      // 其他格式：使用机构账号登录接口
      console.log('使用机构账号登录接口');
      // 在开发环境使用代理路径，避免CORS问题
      loginUrl = isDevelopment 
        ? '/api/login/verif'
        : 'https://aiforoptometry.com/api/login/verif';
      loginData = { username: username.value, password: password.value };
    }
    
    // 进行登录请求
    const csrfToken = csrfTokenInput.value ? csrfTokenInput.value.value : '';
    console.log('发送登录请求:', {
      url: loginUrl,
      method: 'POST',
      hasCsrfToken: !!csrfToken,
      username: username.value
    });
    
    // 创建超时控制器
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
    
    let response;
    try {
      response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(loginData),
        signal: controller.signal
      });
      clearTimeout(timeoutId); // 请求成功，清除超时
    } catch (fetchError) {
      clearTimeout(timeoutId); // 清除超时定时器
      console.error('网络请求失败:', fetchError);
      loadingVisible.value = false;
      
      if (fetchError.name === 'AbortError') {
        message.error('请求超时（30秒），请检查网络连接后重试');
      } else if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
        message.error('无法连接到服务器，请检查：\n1. 网络连接是否正常\n2. 服务器地址是否正确\n3. 防火墙或代理设置');
      } else {
        message.error(`网络错误：${fetchError.message || '请检查网络连接后重试'}`);
      }
      return;
    }

    console.log('登录响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorMessage = '';
      let errorDetail = '';
      
      try {
        const errorData = await response.json();
        errorDetail = errorData.message || errorData.error || JSON.stringify(errorData);
        console.error('登录失败，服务器返回:', errorData);
      } catch (e) {
        try {
          const errorText = await response.text();
          errorDetail = errorText.substring(0, 200);
          console.error('登录失败，响应内容:', errorDetail);
        } catch (textError) {
          console.error('无法读取错误响应内容');
        }
      }
      
      if (response.status === 401) {
        if (isChineseAccount) {
          errorMessage = '子账号或密码错误';
        } else {
          errorMessage = '账号或者密码错误';
        }
      } else if (response.status === 404) {
        if (isChineseAccount) {
          errorMessage = '子账号不存在';
        } else {
          errorMessage = '账号不存在';
        }
      } else if (response.status === 500) {
        errorMessage = '服务器内部错误，请稍后重试';
      } else if (response.status === 503) {
        errorMessage = '服务暂时不可用，请稍后重试';
      } else {
        errorMessage = `网络响应错误 (状态码: ${response.status})`;
      }
      
      if (errorDetail) {
        console.error('详细错误信息:', errorDetail);
      }
      
      message.error(errorMessage);
      loadingVisible.value = false;
      return;
    }

    let data;
    try {
      const responseText = await response.text();
      console.log('登录响应原始内容长度:', responseText.length);
      if (responseText.trim()) {
        data = JSON.parse(responseText);
        console.log('后端返回信息: ', data);
      } else {
        throw new Error('响应内容为空');
      }
    } catch (parseError) {
      console.error('解析响应JSON失败:', parseError);
      loadingVisible.value = false;
      message.error('服务器响应格式错误，请稍后重试');
      return;
    }

    // 子账号登录特殊处理
    if (isChineseAccount) {
      if (data.code === 200) {
        console.log('子账号登录成功，返回数据:', data);
        
        // 设置子账号登录信息
        const organizationId = data.organization.id;
        const accessToken = data.access;
        const refreshToken = data.refresh;
        const csrfToken = data.csrfToken;
        
        // 保存token信息
        localStorage.setItem('organization_id', organizationId);
        localStorage.setItem('organization', JSON.stringify(data.organization));
        localStorage.setItem('organization_name', data.organization_name);
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('csrftoken', csrfToken);
        
        // 设置当前用户名标识
        localStorage.setItem('current_username', username.value);
        
        // 重要：保存子账号权限信息到organization对象中
        // 这样Main.vue中的权限检查就能正常工作
        const organizationWithSubaccountPermissions = {
          ...data.organization,
          permissions: data.subaccount.permissions // 使用子账号的权限，而不是机构的权限
        };
        localStorage.setItem('organization', JSON.stringify(organizationWithSubaccountPermissions));
        
        console.log('子账号权限信息已保存:', data.subaccount.permissions);
        
        // 有缓存时：仅更新 token，用缓存恢复患者列表，不重新请求
        const accounts = await loadAccountsFromStorage();
        const sameOrgAccount = accounts.find(acc => acc.organization_id === String(organizationId));
        const hasPatientCache = sameOrgAccount && (sameOrgAccount.patientIndexedDBKey || sameOrgAccount.patientlist);
        if (hasPatientCache) {
          console.log('发现同机构缓存数据，仅更新 token 并恢复缓存，不重新请求患者列表');
          const updatedAccountData = {
            ...sameOrgAccount,
            access_token: accessToken,
            refresh_token: refreshToken,
            csrf_token: csrfToken,
            organization_id: String(organizationId),
            organization_name: data.organization_name ?? sameOrgAccount.organization_name,
            organization_data: organizationWithSubaccountPermissions || sameOrgAccount.organization_data
          };
          loadingText.value = '正在登录...';
          loadingProgress.value = '正在恢复缓存数据...';
          await loginWithCachedData(updatedAccountData);
          return;
        }

        // 无缓存：清除旧数据并重新获取患者列表
        console.log('无缓存或缓存不完整，清除旧数据并重新获取患者列表...');
        localStorage.removeItem('patientlist');
        localStorage.removeItem('checkmanagementlist');
        localStorage.removeItem('patientlist_storage');
        localStorage.removeItem('checkmanagementlist_storage');
        localStorage.removeItem('patientlist_indexedDB_key');
        localStorage.removeItem('checkmanagementlist_indexedDB_key');

        // 登录成功后，获取患者列表数据
        loadingText.value = '正在加载数据...';
        loadingProgress.value = '正在获取患者列表...';

        // 等待一下，确保cookies设置完成
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
          // 判断是否为开发环境
          const isDevelopment = import.meta.env.DEV;
          
          // 获取患者列表
          const patientUrl = isDevelopment 
            ? `/patient/opatientList_originationids/?organization_ids=${organizationId}`
            : `https://aiforoptometry.com/patient/opatientList_originationids/?organization_ids=${organizationId}`;
          console.log('请求患者列表:', patientUrl);
          
          // 创建超时控制器
          const patientController = new AbortController();
          const patientTimeoutId = setTimeout(() => patientController.abort(), 30000); // 30秒超时
          
          let patientResponse;
          try {
            patientResponse = await fetch(patientUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              credentials: 'include',
              signal: patientController.signal
            });
            clearTimeout(patientTimeoutId); // 请求成功，清除超时
          } catch (fetchError) {
            clearTimeout(patientTimeoutId); // 清除超时定时器
            console.error('患者列表请求失败:', fetchError);
            if (fetchError.name === 'AbortError') {
              console.error('患者列表请求超时（30秒）');
              loadingProgress.value = '患者列表请求超时，跳过此数据';
            } else {
              console.error('患者列表网络错误:', fetchError.message);
              loadingProgress.value = '患者列表请求失败，跳过此数据';
            }
            patientResponse = null; // 设置为null，后续会跳过处理
          }

          if (patientResponse) {
            console.log('患者列表响应状态:', patientResponse.status, patientResponse.url);
          }

          loadingProgress.value = '正在处理数据...';
          
          let patientData = null;

          // 处理患者列表数据
          if (patientResponse && patientResponse.ok) {
            try {
              const responseText = await patientResponse.text();
              patientData = JSON.parse(responseText);
              console.log('患者列表数据获取成功，开始保存...');
              
              // 使用智能存储方式保存患者数据（会自动设置到localStorage）
              const patientResult = await saveDataWithSizeCheck('patientlist', patientData, 'patient', organizationId);
              if (patientResult.success) {
                console.log(`患者列表数据保存成功，存储方式: ${patientResult.storage}`);
                // 如果存储到IndexedDB，在localStorage中标记
                if (patientResult.storage === 'indexedDB') {
                  localStorage.setItem('patientlist_storage', 'indexedDB');
                  // 保存IndexedDB的key信息
                  if (patientResult.indexedDBKey) {
                    localStorage.setItem('patientlist_indexedDB_key', patientResult.indexedDBKey);
                  }
                }
              } else {
                console.warn('患者列表数据保存失败');
                patientData = null;
              }
            } catch (error) {
              console.error('解析患者列表数据失败:', error);
            }
          }

          // 等待所有数据保存完成
          loadingProgress.value = '正在保存数据...';
          
          // 如果选择了记住账号，保存到多账号管理
          if (rememberMe.value) {
            console.log('准备保存子账号到多账号管理:', username.value);
            
            // 根据你的需求：总是将数据保存到IndexedDB
            let patientIndexedDBKey = null;
            
            // 使用统一缓存管理器保存患者数据
            if (patientData) {
              console.log('organizationId值:', organizationId);
              console.log('organizationId类型:', typeof organizationId);
              const patientSuccess = await saveCache('patientlist', patientData, organizationId);
              console.log('患者数据缓存保存结果:', patientSuccess);
              if (patientSuccess) {
                patientIndexedDBKey = `patientlist_${organizationId}`;
                console.log('患者数据缓存保存成功');
              } else {
                console.error('患者数据缓存保存失败');
              }
            } else {
              console.log('没有患者数据需要保存');
            }
            
            // 创建子账号数据
            const accountData = {
              username: username.value,
              password: password.value,
              autoLogin: autoLogin.value,
              organization_id: organizationId,
              organization_name: data.organization_name,
              organization_data: organizationWithSubaccountPermissions,
              // 子账号也保存缓存数据
              patientlist: null, // 数据存储在IndexedDB中
              patientStorage: 'indexedDB', // 总是使用IndexedDB
              patientIndexedDBKey: patientIndexedDBKey,
              lastLoginTime: new Date().toISOString(),
              access_token: accessToken,
              refresh_token: refreshToken,
              csrf_token: csrfToken,
              isSubaccount: true, // 标记为子账号
              subaccount_id: data.subaccount.id,
              subaccount_permissions: data.subaccount.permissions
            };
            
            await saveAccountToStorage(accountData);
            console.log('子账号保存完成，当前已保存账号数量:', savedAccounts.value.length);
            
            // 显示保存成功提示
            message.success(`子账号 ${username.value} 已保存到快速登录列表`);
          } else {
            console.log('用户未选择保存子账号');
          }

          // 最终验证：确保所有缓存数据都已正确设置
          loadingProgress.value = '正在验证数据完整性...';
          
          // 等待一下确保所有异步操作完成
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // 验证数据是否已正确设置到localStorage
          console.log('最终验证localStorage数据设置（子账号登录）:');
          console.log('organization_id:', localStorage.getItem('organization_id'));
          console.log('organization_name:', localStorage.getItem('organization_name'));
          
          let storedPatientData = localStorage.getItem('patientlist');
          
          // 如果localStorage中没有数据，检查是否存储在IndexedDB中
          if (!storedPatientData) {
            const patientStorage = localStorage.getItem('patientlist_storage');
            if (patientStorage === 'indexedDB') {
              console.log('患者数据存储在IndexedDB中，正在验证...');
              const patientResult = await getDataWithFallback('patientlist', 'patient', organizationId);
              if (patientResult.data) {
                console.log('IndexedDB中的患者数据验证成功');
                storedPatientData = 'verified'; // 标记为已验证
              }
            }
          }
          
          if (storedPatientData && storedPatientData !== 'verified') {
            try {
              const patientArray = JSON.parse(storedPatientData);
              console.log('patientlist长度:', Array.isArray(patientArray) ? patientArray.length : '非数组格式');
              if (Array.isArray(patientArray) && patientArray.length > 0) {
                console.log('patientlist第一条数据:', patientArray[0]);
              }
            } catch (e) {
              console.log('patientlist解析失败:', e);
            }
          } else if (storedPatientData === 'verified') {
            console.log('patientlist: 已从IndexedDB验证');
          } else {
            console.log('patientlist: null');
          }
          
          // 验证关键数据是否存在
          const hasPatientData = storedPatientData !== null;
          const hasOrgData = localStorage.getItem('organization_id') !== null;
          
          if (!hasOrgData) {
            console.error('机构信息未正确设置！');
            loadingText.value = '数据设置失败';
            loadingProgress.value = '机构信息未正确设置，请重试';
            setTimeout(() => {
              loadingVisible.value = false;
            }, 2000);
            return;
          }
          
          if (!hasPatientData) {
            console.warn('患者列表数据未正确设置，但继续跳转');
            loadingProgress.value = '患者列表数据加载失败，但可以继续使用';
          } else {
            console.log('患者列表数据验证通过，准备跳转');
            loadingProgress.value = '数据验证完成，正在跳转...';
          }
          
          // 验证保存是否成功（如果选择了记住账号）
          if (rememberMe.value) {
            const verificationAccounts = JSON.parse(localStorage.getItem('multiAccounts') || '[]');
            const savedAccount = verificationAccounts.find(acc => acc.username === username.value);
            if (!savedAccount) {
              console.error('子账号保存失败，重新尝试保存');
              // 重新尝试保存
              const accountData = {
                username: username.value,
                password: password.value,
                autoLogin: autoLogin.value,
                organization_id: organizationId,
                organization_name: data.organization_name,
                organization_data: organizationWithSubaccountPermissions,
                patientlist: null,
                patientStorage: 'indexedDB',
                patientIndexedDBKey: patientIndexedDBKey,
                lastLoginTime: new Date().toISOString(),
                access_token: accessToken,
                refresh_token: refreshToken,
                csrf_token: csrfToken,
                isSubaccount: true,
                subaccount_id: data.subaccount.id,
                subaccount_permissions: data.subaccount.permissions
              };
              await saveAccountToStorage(accountData);
            }
          }
          
          // 确保所有操作完成后再跳转
          await new Promise(resolve => setTimeout(resolve, 300));
          
          loadingVisible.value = false;
          emit('login-success');
        } catch (error) {
          console.error('子账号数据加载失败:', error);
          loadingText.value = '数据加载失败';
          loadingProgress.value = '请刷新页面重试';
          setTimeout(() => {
            loadingVisible.value = false;
            emit('login-success');
          }, 2000);
        }
        return;
      } else {
        loadingVisible.value = false;
        message.error(data.message || '子账号登录失败');
        return;
      }
    }

    // 机构账号登录处理
    if (data.success) {
      console.log('机构账号登录成功');
      
      // 设置新的机构信息
      const organizationId = data.all_organization_ids[0];
      if (!organizationId) {
        console.error('未收到有效的organization_id');
        loadingVisible.value = false;
        return;
      }

      // 保存token信息
      const accessToken = data.access;
      const refreshToken = data.refresh;
      const csrfToken = data.csrfToken;
      
      // 保存登录信息（如果选择了保存账号）
      if (rememberMe.value) {
        const loginInfo = {
          username: username.value,
          password: password.value,
          autoLogin: autoLogin.value
        };
        localStorage.setItem('loginInfo', JSON.stringify(loginInfo));
        console.log('保存账号信息', loginInfo);
      } else {
        localStorage.removeItem('loginInfo');
      }

      // 有缓存时：仅更新 token，用缓存恢复患者列表，不重新请求
      const accounts = await loadAccountsFromStorage();
      const existingAccount = accounts.find(acc => acc.username === username.value && acc.organization_id === String(organizationId));
      const sameOrgAccount = accounts.find(acc => acc.organization_id === String(organizationId));
      const accountWithCache = existingAccount || sameOrgAccount;
      const hasPatientCache = accountWithCache && (accountWithCache.patientIndexedDBKey || accountWithCache.patientlist);
      if (hasPatientCache) {
        console.log('发现缓存数据，仅更新 token 并恢复缓存，不重新请求患者列表');
        const updatedAccountData = {
          ...accountWithCache,
          access_token: accessToken,
          refresh_token: refreshToken,
          csrf_token: csrfToken,
          organization_id: String(organizationId),
          organization_name: data.organization?.name ?? accountWithCache.organization_name,
          organization_data: data.organization || accountWithCache.organization_data
        };
        loadingText.value = '正在登录...';
        loadingProgress.value = '正在恢复缓存数据...';
        await loginWithCachedData(updatedAccountData);
        return;
      }

      // 无缓存：清除旧数据并重新获取患者列表
      console.log('无缓存或缓存不完整，清除旧数据并重新获取患者列表...');
      localStorage.removeItem('patientlist');
      localStorage.removeItem('checkmanagementlist');
      localStorage.removeItem('patientlist_storage');
      localStorage.removeItem('checkmanagementlist_storage');
      localStorage.removeItem('patientlist_indexedDB_key');
      localStorage.removeItem('checkmanagementlist_indexedDB_key');
      
      localStorage.setItem('organization_id', organizationId);
      localStorage.setItem('organization', JSON.stringify(data.organization));
      localStorage.setItem('organization_name', data.organization?.name || '');
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('csrftoken', csrfToken);
      localStorage.setItem('current_username', username.value);

      // 登录成功后，获取患者列表数据
      loadingText.value = '正在加载数据...';
      loadingProgress.value = '正在获取患者列表...';

      // 等待一下，确保cookies设置完成
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // 判断是否为开发环境
        const isDevelopment = import.meta.env.DEV;
        
        // 获取患者列表
        const patientUrl = isDevelopment 
          ? `/patient/opatientList_originationids/?organization_ids=${organizationId}`
          : `https://aiforoptometry.com/patient/opatientList_originationids/?organization_ids=${organizationId}`;
        console.log('请求患者列表:', patientUrl);
        
        // 创建超时控制器
        const patientController = new AbortController();
        const patientTimeoutId = setTimeout(() => patientController.abort(), 30000); // 30秒超时
        
        let patientResponse;
        try {
          patientResponse = await fetch(patientUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            credentials: 'include',
            signal: patientController.signal
          });
          clearTimeout(patientTimeoutId); // 请求成功，清除超时
        } catch (fetchError) {
          clearTimeout(patientTimeoutId); // 清除超时定时器
          console.error('患者列表请求失败:', fetchError);
          if (fetchError.name === 'AbortError') {
            console.error('患者列表请求超时（30秒）');
            loadingProgress.value = '患者列表请求超时，跳过此数据';
          } else {
            console.error('患者列表网络错误:', fetchError.message);
            loadingProgress.value = '患者列表请求失败，跳过此数据';
          }
          patientResponse = null; // 设置为null，后续会跳过处理
        }

        if (patientResponse) {
          console.log('患者列表响应状态:', patientResponse.status, patientResponse.url);
        }

        loadingProgress.value = '正在处理数据...';
        
        let patientData = null;

        // 处理患者列表数据
        if (patientResponse && patientResponse.ok) {
          try {
            const responseText = await patientResponse.text();
            patientData = JSON.parse(responseText);
            console.log('患者列表数据获取成功，开始保存...');
            
            // 使用智能存储方式保存患者数据（会自动设置到localStorage）
            const patientResult = await saveDataWithSizeCheck('patientlist', patientData, 'patient', organizationId);
            if (patientResult.success) {
              console.log(`患者列表数据保存成功，存储方式: ${patientResult.storage}`);
              // 如果存储到IndexedDB，在localStorage中标记
              if (patientResult.storage === 'indexedDB') {
                localStorage.setItem('patientlist_storage', 'indexedDB');
                // 保存IndexedDB的key信息
                if (patientResult.indexedDBKey) {
                  localStorage.setItem('patientlist_indexedDB_key', patientResult.indexedDBKey);
                }
              }
            } else {
              console.warn('患者列表数据保存失败');
              patientData = null;
            }
          } catch (error) {
            console.error('解析患者列表数据失败:', error);
          }
        }

        // 等待所有数据保存完成
        loadingProgress.value = '正在保存数据...';
        
        // 如果选择了记住账号，保存到多账号管理
        if (rememberMe.value) {
          console.log('准备保存账号到多账号管理:', username.value);
          
          // 根据你的需求：总是将数据保存到IndexedDB
          let patientIndexedDBKey = null;
          
          // 使用统一缓存管理器保存患者数据
          if (patientData) {
            console.log('organizationId值:', organizationId);
            console.log('organizationId类型:', typeof organizationId);
            console.log('尝试保存患者数据到缓存');
            const patientSuccess = await saveCache('patientlist', patientData, organizationId);
            console.log('患者数据缓存保存结果:', patientSuccess);
            if (patientSuccess) {
              patientIndexedDBKey = `patientlist_${organizationId}`;
              console.log('患者数据缓存保存成功');
            } else {
              console.error('患者数据缓存保存失败');
            }
          } else {
            console.log('没有患者数据需要保存');
          }
          
          // 创建账号数据
          const accountData = createAccountData(
            {
              username: username.value,
              password: password.value,
              autoLogin: autoLogin.value,
              organization_id: organizationId,
              access_token: accessToken,
              refresh_token: refreshToken,
              csrf_token: csrfToken
            },
            data.organization,
            patientData,
            null // 不再保存检查记录数据
          );
          
          console.log('创建的账号数据:', accountData);
          await saveAccountToStorage(accountData);
          console.log('账号保存完成，当前已保存账号数量:', savedAccounts.value.length);
          
          // 显示保存成功提示
          message.success(`账号 ${username.value} 已保存到快速登录列表`);
        } else {
          console.log('用户未选择保存账号');
        }

        // 最终验证：确保所有缓存数据都已正确设置
        loadingProgress.value = '正在验证数据完整性...';
        
        // 等待一下确保所有异步操作完成
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 验证数据是否已正确设置到localStorage
        console.log('最终验证localStorage数据设置:');
        console.log('organization_id:', localStorage.getItem('organization_id'));
        console.log('organization_name:', localStorage.getItem('organization_name'));
        
        let storedPatientData = localStorage.getItem('patientlist');
        
        // 如果localStorage中没有数据，检查是否存储在IndexedDB中
        if (!storedPatientData) {
          const patientStorage = localStorage.getItem('patientlist_storage');
          if (patientStorage === 'indexedDB') {
            console.log('患者数据存储在IndexedDB中，正在验证...');
            const patientResult = await getDataWithFallback('patientlist', 'patient', organizationId);
            if (patientResult.data) {
              console.log('IndexedDB中的患者数据验证成功');
              storedPatientData = 'verified'; // 标记为已验证
            }
          }
        }
        
        if (storedPatientData && storedPatientData !== 'verified') {
          try {
            const patientArray = JSON.parse(storedPatientData);
            console.log('patientlist长度:', Array.isArray(patientArray) ? patientArray.length : '非数组格式');
            if (Array.isArray(patientArray) && patientArray.length > 0) {
              console.log('patientlist第一条数据:', patientArray[0]);
            }
          } catch (e) {
            console.log('patientlist解析失败:', e);
          }
        } else if (storedPatientData === 'verified') {
          console.log('patientlist: 已从IndexedDB验证');
        } else {
          console.log('patientlist: null');
        }
        
        // 验证关键数据是否存在
        const hasPatientData = storedPatientData !== null;
        const hasOrgData = localStorage.getItem('organization_id') !== null;
        
        if (!hasOrgData) {
          console.error('机构信息未正确设置！');
          loadingText.value = '数据设置失败';
          loadingProgress.value = '机构信息未正确设置，请重试';
          setTimeout(() => {
            loadingVisible.value = false;
          }, 2000);
          return;
        }
        
        if (!hasPatientData) {
          console.warn('患者列表数据未正确设置，但继续跳转');
          loadingProgress.value = '患者列表数据加载失败，但可以继续使用';
        } else {
          console.log('患者列表数据验证通过，准备跳转');
          loadingProgress.value = '数据验证完成，正在跳转...';
        }
        
        // 验证保存是否成功（如果选择了记住账号）
        if (rememberMe.value) {
          const verificationAccounts = JSON.parse(localStorage.getItem('multiAccounts') || '[]');
          const savedAccount = verificationAccounts.find(acc => acc.username === username.value);
          if (!savedAccount) {
            console.error('账号保存失败，重新尝试保存');
            // 重新尝试保存
            const accountData = createAccountData(
              {
                username: username.value,
                password: password.value,
                autoLogin: autoLogin.value,
                organization_id: organizationId,
                access_token: accessToken,
                refresh_token: refreshToken,
                csrf_token: csrfToken
              },
              data.organization,
              patientData,
              null // 不再保存检查记录数据
            );
            await saveAccountToStorage(accountData);
          }
        }
        
        // 确保所有操作完成后再跳转
        await new Promise(resolve => setTimeout(resolve, 300));
        
        loadingVisible.value = false;
        emit('login-success');
      } catch (error) {
        console.error('加载数据失败:', error);
        loadingText.value = '数据加载失败';
        loadingProgress.value = '请刷新页面重试';
        setTimeout(() => {
          loadingVisible.value = false;
          emit('login-success');
        }, 2000);
      }
    } else {
      loadingVisible.value = false;
      if (isChineseAccount) {
        message.error('子账号登录失败');
      } else {
        message.error('密码错误');
      }
    }
  } catch (error) {
    console.error('登录异常', error);
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    
    loadingVisible.value = false;
    
    // 根据错误类型提供更详细的错误信息
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      message.error('请求超时，请检查网络连接后重试');
    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      message.error('无法连接到服务器，请检查：\n1. 网络连接是否正常\n2. 服务器地址是否正确\n3. 防火墙或代理设置');
    } else if (error.name === 'SyntaxError') {
      message.error('服务器响应格式错误，请稍后重试');
    } else {
      const errorMsg = error.message || '未知错误';
      message.error(`登录失败：${errorMsg}\n请检查网络连接后重试`);
    }
  }
}

function handleAutoLoginChange(checked) {
  if (checked) {
    rememberMe.value = true;
  }
}

// 显示确认对话框的辅助函数
const showConfirm = (options) => {
  confirmModalTitle.value = options.title || '确认';
  confirmModalContent.value = options.content || '';
  confirmModalOkText.value = options.okText || '确定';
  confirmModalCancelText.value = options.cancelText || '取消';
  confirmModalOkType.value = options.okType || 'primary';
  confirmModalOnOk.value = options.onOk || null;
  confirmModalOnCancel.value = options.onCancel || null;
  confirmModalVisible.value = true;
};

// 处理确认对话框的确定按钮
const handleConfirmOk = async () => {
  if (confirmModalOnOk.value) {
    await confirmModalOnOk.value();
  }
  confirmModalVisible.value = false;
};

// 处理确认对话框的取消按钮
const handleConfirmCancel = () => {
  if (confirmModalOnCancel.value) {
    confirmModalOnCancel.value();
  }
  confirmModalVisible.value = false;
};

const deleteAccount = () => {
  if (selectedAccountIndex.value === null || selectedAccountIndex.value === 'new') {
    message.warning('请选择一个已保存的账号进行删除');
    return;
  }

  const accountToDelete = savedAccounts.value[selectedAccountIndex.value];
  showConfirm({
    title: '确认删除账号',
    content: `确定要删除账号 "${accountToDelete.username}" 吗？此操作不可逆。`,
    okText: '删除',
    cancelText: '取消',
    onOk: async () => {
      const newAccounts = savedAccounts.value.filter((_, index) => index !== selectedAccountIndex.value);
      savedAccounts.value = newAccounts;
      
      // 检查是否需要更新IndexedDB
      const storageType = localStorage.getItem('multiAccounts_storage');
      if (storageType === 'indexedDB') {
        await saveLargeDataToIndexedDB(ACCOUNT_STORE, 'accounts', newAccounts);
      }
      localStorage.setItem('multiAccounts', JSON.stringify(newAccounts));
      
      message.success('账号删除成功');
      selectedAccountIndex.value = null; // 清除选中
      username.value = '';
      password.value = '';
      rememberMe.value = false;
      autoLogin.value = false;
    },
    onCancel: () => {
      console.log('取消删除');
    },
  });
};

// 新增：显示账号管理弹窗
const showAccountManager = () => {
  accountManagerVisible.value = true;
  
  // 调试：检查当前账号数据
  console.log('账号管理弹窗打开，当前账号数据:', savedAccounts.value);
  savedAccounts.value.forEach((account, index) => {
          console.log(`账号${index + 1}缓存状态检查:`, {
        username: account.username,
        patientStorage: account.patientStorage,
        checkStorage: account.checkStorage,
        patientIndexedDBKey: account.patientIndexedDBKey,
        checkIndexedDBKey: account.checkIndexedDBKey,
        hasPatientData: !!account.patientIndexedDBKey,
        hasCheckData: !!account.checkIndexedDBKey,
        // 检查判断条件
        patientCondition: !!account.patientIndexedDBKey,
        checkCondition: !!account.checkIndexedDBKey,
        finalCondition: !!account.patientIndexedDBKey && !!account.checkIndexedDBKey
      });
  });
};

// 新增：切换到指定账号
const switchToAccount = (index) => {
  handleAccountSelect(index);
  accountManagerVisible.value = false;
};

// 新增：从账号管理弹窗中删除账号
const deleteAccountFromManager = (index) => {
  const accountToDelete = savedAccounts.value[index];
  showConfirm({
    title: '确认删除账号',
    content: `确定要删除账号 "${accountToDelete.username}" 吗？此操作不可逆。`,
    okText: '删除',
    cancelText: '取消',
    onOk: async () => {
      const newAccounts = savedAccounts.value.filter((_, accIndex) => accIndex !== index);
      savedAccounts.value = newAccounts;
      
      // 检查是否需要更新IndexedDB
      const storageType = localStorage.getItem('multiAccounts_storage');
      if (storageType === 'indexedDB') {
        await saveLargeDataToIndexedDB(ACCOUNT_STORE, 'accounts', newAccounts);
      }
      localStorage.setItem('multiAccounts', JSON.stringify(newAccounts));
      
      message.success('账号删除成功');
      if (selectedAccountIndex.value === index) {
        selectedAccountIndex.value = null;
        username.value = '';
        password.value = '';
        rememberMe.value = false;
        autoLogin.value = false;
      }
    },
    onCancel: () => {
      console.log('取消删除');
    },
  });
};

// 新增：清除所有已保存的账号
const clearAllAccounts = () => {
  showConfirm({
    title: '确认清除所有账号',
    content: '确定要清除所有已保存的账号吗？此操作不可逆。',
    okText: '清除',
    cancelText: '取消',
    onOk: async () => {
      localStorage.removeItem('multiAccounts');
      localStorage.removeItem('multiAccounts_storage');
      savedAccounts.value = [];
      selectedAccountIndex.value = null;
      username.value = '';
      password.value = '';
      rememberMe.value = false;
      autoLogin.value = false;
      message.success('所有账号已清除');
    },
    onCancel: () => {
      console.log('取消清除');
    },
  });
};

// 新增：格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '从未登录';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

  if (diffInSeconds < 60) {
    return `${Math.round(diffInSeconds)}秒前`;
  } else if (diffInSeconds < 3600) {
    return `${Math.round(diffInSeconds / 60)}分钟前`;
  } else if (diffInSeconds < 86400) {
    return `${Math.round(diffInSeconds / 3600)}小时前`;
  } else {
    return `${Math.round(diffInSeconds / 86400)}天前`;
  }
};

// 实际执行重建数据库的函数
const executeRebuildDatabase = async () => {
  try {
    console.log('执行重建数据库...');
    loadingVisible.value = true;
    loadingText.value = '正在重建数据库...';
    loadingProgress.value = '删除现有数据库...';
    
    localStorage.setItem('need_rebuild_indexeddb', 'true');
    await deleteExistingDB();
    
    loadingProgress.value = '创建新数据库...';
    await initDB();
    
    // 清除所有相关数据
    localStorage.removeItem('multiAccounts');
    localStorage.removeItem('multiAccounts_storage');
    localStorage.removeItem('patientlist');
    localStorage.removeItem('checkmanagementlist');
    localStorage.removeItem('patientlist_storage');
    localStorage.removeItem('checkmanagementlist_storage');
    localStorage.removeItem('patientlist_indexedDB_key');
    localStorage.removeItem('checkmanagementlist_indexedDB_key');
    
    // 重置组件状态
    savedAccounts.value = [];
    selectedAccountIndex.value = null;
    username.value = '';
    password.value = '';
    rememberMe.value = false;
    autoLogin.value = false;
    
    console.log('数据库重建完成');
    loadingVisible.value = false;
    message.success('数据库重建完成，所有数据已清除，请重新登录');
  } catch (error) {
    console.error('重建数据库失败:', error);
    loadingVisible.value = false;
    message.error('重建数据库失败，请刷新页面重试');
  }
};

// 手动重建数据库（用于调试）
const rebuildDatabase = async () => {
  // 显示确认弹窗
  showConfirm({
    title: '⚠️ 确认重建数据库',
    content: '此操作将删除所有已保存的账号和缓存数据，且不可恢复！确定要继续吗？',
    okText: '确认重建',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      await executeRebuildDatabase();
    },
    onCancel: () => {
      console.log('取消重建数据库');
    },
  });
};

// 强制刷新页面（获取最新HTML，但保留localStorage数据）
const refreshPage = () => {
  // 显示更新提示
  message.loading('正在更新应用...', 0);
  
  // 注意：localStorage数据在页面刷新时会自动保留
  // 使用 reload(true) 强制从服务器重新加载HTML，不使用缓存
  // 但localStorage中的数据不会丢失
  console.log('刷新页面，localStorage数据将保留');
  
  // 延迟一下让用户看到提示
  setTimeout(() => {
    window.location.reload(true);
  }, 500);
};

// 键盘事件处理
const handleKeyDown = (event) => {
  if (event.ctrlKey) keyPressed.value.ctrl = true;
  if (event.shiftKey) keyPressed.value.shift = true;
  if (event.key.toLowerCase() === 'p') keyPressed.value.p = true;
  
  // 检查是否按下了 Ctrl+Shift+P
  if (keyPressed.value.ctrl && keyPressed.value.shift && keyPressed.value.p) {
    event.preventDefault();
    
    // 防抖处理：清除之前的计时器
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // 设置新的计时器，200ms后执行
    debounceTimer = setTimeout(() => {
      triggerProductionRebuildDatabase();
      resetKeyState();
      debounceTimer = null;
    }, 200);
  }
};

const handleKeyUp = (event) => {
  if (!event.ctrlKey) keyPressed.value.ctrl = false;
  if (!event.shiftKey) keyPressed.value.shift = false;
  if (event.key.toLowerCase() === 'p') keyPressed.value.p = false;
};

const resetKeyState = () => {
  keyPressed.value.ctrl = false;
  keyPressed.value.shift = false;
  keyPressed.value.p = false;
};

// 生产环境的重建数据库功能（通过快捷键触发）
const triggerProductionRebuildDatabase = async () => {
  // 无论是开发环境还是生产环境，都需要确认
  await rebuildDatabase();
};

onMounted(async () => {
  // 添加键盘事件监听器
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  
  // 检查是否需要重建数据库（调试用）
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('rebuild_db') === 'true') {
    // 即使是URL参数触发，也需要确认
    await rebuildDatabase();
    return;
  }
  
  // 首先检测所有可用版本
  console.log('[Frontend] onMounted: Starting version check...')
  await checkAllVersions();
  console.log('[Frontend] onMounted: Version check completed, availableModes:', availableModes.value)
  console.log('[Frontend] onMounted: availableModes.length:', availableModes.value.length)
  
  // 确保至少有一个可用版本（如果检测失败，使用默认值）
  if (availableModes.value.length === 0) {
    console.warn('[Frontend] onMounted: No available modes, setting default stable version')
    availableModes.value = [{
      value: APP_MODES.STABLE,
      label: MODE_LABELS[APP_MODES.STABLE],
      url: MODE_URLS[APP_MODES.STABLE]
    }]
  }
  
  // 加载应用模式（必须在检测版本之后）
  await loadAppMode();
  
  // 如果当前模式不在可用列表中，切换到第一个可用模式
  if (selectedAppMode.value && !availableModes.value.find(m => m.value === selectedAppMode.value)) {
    if (availableModes.value.length > 0) {
      console.log(`[Frontend] Current mode unavailable, switching to: ${availableModes.value[0].label}`)
      selectedAppMode.value = availableModes.value[0].value
      currentAppMode.value = availableModes.value[0].value
    }
  }
  
  // 加载多账号信息
  await loadAccountsFromStorage();
  
  // 调试：检查加载的账号数据
  console.log('加载的账号数据:', savedAccounts.value);
  savedAccounts.value.forEach((account, index) => {
    console.log(`账号${index + 1}:`, {
      username: account.username,
      patientStorage: account.patientStorage,
      checkStorage: account.checkStorage,
      patientIndexedDBKey: account.patientIndexedDBKey,
      checkIndexedDBKey: account.checkIndexedDBKey,
      hasPatientData: !!account.patientIndexedDBKey,
      hasCheckData: !!account.checkIndexedDBKey
    });
  });
  
  // 检查是否是修改密码后的重新登录
  const isPasswordChangeRelogin = localStorage.getItem('password_change_relogin');
  if (isPasswordChangeRelogin === 'true') {
    // 清除标记
    localStorage.removeItem('password_change_relogin');
    // 自动勾选保存账号
    rememberMe.value = true;
    console.log('检测到修改密码后的重新登录，自动勾选保存账号');
  }
  
  // 加载上次登录信息
  const info = localStorage.getItem('loginInfo');
  if (info) {
    try {
      const loginInfo = JSON.parse(info);
      username.value = loginInfo.username || '';
      password.value = loginInfo.password || '';
      rememberMe.value = true;
      autoLogin.value = loginInfo.autoLogin || false;
      console.log('加载保存的登录信息', loginInfo);
      
      // 检查是否在已保存的账号列表中
      const accountIndex = savedAccounts.value.findIndex(acc => acc.username === loginInfo.username);
      if (accountIndex >= 0) {
        selectedAccountIndex.value = accountIndex;
      }
      
      if (autoLogin.value) {
        // 自动登录会调用 handleLogin()，请求新 token 和 csrf 并更新 localStorage/多账号缓存，不使用旧缓存
        console.log('自动登录已启用，尝试自动登录');
        handleLogin();
      }
    } catch (e) {
      console.error('解析登录信息失败', e);
    }
  }
});

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keyup', handleKeyUp);
  
  // 清理防抖计时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
});
</script>

<style scoped>
.login-wrapper {
  background: url("../assets/bg1.jpg") no-repeat center center;
  background-size: cover;
  height: 100vh;
  width: 100%;
}

.login-form {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-modal :deep(.ant-modal-content) {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
}

.loading-icon {
  margin-bottom: 24px;
}

.loading-text {
  text-align: center;
}

.loading-text h3 {
  margin: 0 0 8px 0;
  color: #1890ff;
  font-size: 18px;
}

.loading-text p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

/* 新增账号管理弹窗样式 */
.account-item {
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.account-item:hover {
  background: #f5f5f5;
  border-color: #d9d9d9;
}

.account-item:last-child {
  margin-bottom: 0;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.account-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-main strong {
  font-size: 16px;
  color: #1890ff;
  font-weight: 600;
}

.account-org {
  font-size: 14px;
  color: #666;
  background: #e6f7ff;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #91d5ff;
}

.account-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.account-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-time {
  font-style: italic;
  font-size: 12px;
  color: #999;
}

.cache-status {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cache-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.cache-available {
  background-color: #52c41a;
  color: white;
}

.cache-unavailable {
  background-color: #f5222d;
  color: white;
}

.account-actions {
  display: flex;
  gap: 8px;
}

.account-actions .ant-btn {
  padding: 2px 8px;
  height: 24px;
  font-size: 12px;
}

.current-account-badge {
  background-color: #1890ff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 10px;
}
</style>
