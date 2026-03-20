<template>
  <div class="rfid-in-out">
    <a-card title="RFID出入库管理">
      <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <a-tab-pane key="in" tab="入库">
          <div class="in-out-content">
            <a-form layout="inline" style="margin-bottom: 16px;">
              <a-form-item label="入库类型">
                <a-select v-model:value="inType" style="width: 150px;">
                  <a-select-option value="purchase">采购入库</a-select-option>
                  <a-select-option value="return">退货入库</a-select-option>
                  <a-select-option value="adjust">调整入库</a-select-option>
                  <a-select-option value="transfer">调拨入库</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="目标仓库">
                <a-select
                  v-model:value="selectedWarehouse"
                  style="width: 200px;"
                  placeholder="选择仓库"
                  allowClear
                >
                  <a-select-option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                    {{ warehouse.name }} ({{ warehouse.type === 'central' ? '总仓' : '分仓' }})
                  </a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="供应商">
                <a-select
                  v-model:value="selectedSupplier"
                  style="width: 200px;"
                  placeholder="选择供应商"
                  allowClear
                >
                  <a-select-option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                    {{ supplier.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-form>

            <a-card title="RFID扫描入库" size="small">
              <div class="scan-section">
                <a-input
                  v-model:value="currentRFID"
                  placeholder="请扫描RFID标签"
                  size="large"
                  @pressEnter="handleInScan"
                  ref="rfidInputRef"
                  style="margin-bottom: 16px;"
                >
                  <template #prefix>
                    <scan-outlined />
                  </template>
                  <template #suffix>
                    <a-button type="link" @click="simulateScan">模拟扫描</a-button>
                  </template>
                </a-input>

                <a-space>
                  <a-button type="primary" @click="handleInScan" :loading="scanning">
                    确认入库
                  </a-button>
                  <a-button @click="clearCurrentRFID">清空</a-button>
                  <a-button @click="batchIn">批量入库</a-button>
                </a-space>
              </div>

              <a-divider />

              <div class="scanned-list">
                <a-table
                  :columns="inColumns"
                  :data-source="inItems"
                  :pagination="{ pageSize: 5 }"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'expiryDate'">
                      <span :class="getExpiryClass(record.expiryStatus)">
                        {{ record.productInfo?.expiryDate || '-' }}
                      </span>
                    </template>
                    <template v-else-if="column.key === 'quantity'">
                      <a-input-number
                        v-model:value="record.quantity"
                        :min="1"
                        :precision="0"
                        style="width: 80px;"
                      />
                    </template>
                    <template v-else-if="column.key === 'action'">
                      <a-button type="link" danger size="small" @click="removeInItem(record.rfidTag)">
                        移除
                      </a-button>
                    </template>
                  </template>
                </a-table>
              </div>

              <div class="action-buttons" style="margin-top: 16px;">
                <a-button type="primary" @click="confirmIn" :disabled="inItems.length === 0">
                  确认入库
                </a-button>
                <a-button @click="clearInItems">清空列表</a-button>
              </div>
            </a-card>
          </div>
        </a-tab-pane>

        <a-tab-pane key="out" tab="出库">
          <div class="in-out-content">
            <a-form layout="inline" style="margin-bottom: 16px;">
              <a-form-item label="出库类型">
                <a-select v-model:value="outType" style="width: 150px;">
                  <a-select-option value="sale">销售出库</a-select-option>
                  <a-select-option value="transfer">调拨出库</a-select-option>
                  <a-select-option value="adjust">调整出库</a-select-option>
                  <a-select-option value="return">退货出库</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="源仓库">
                <a-select
                  v-model:value="selectedWarehouse"
                  style="width: 200px;"
                  placeholder="选择仓库"
                  allowClear
                >
                  <a-select-option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                    {{ warehouse.name }} ({{ warehouse.type === 'central' ? '总仓' : '分仓' }})
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-form>

            <a-card title="RFID扫描出库" size="small">
              <div class="scan-section">
                <a-input
                  v-model:value="currentRFID"
                  placeholder="请扫描RFID标签"
                  size="large"
                  @pressEnter="handleOutScan"
                  ref="rfidInputRef"
                  style="margin-bottom: 16px;"
                >
                  <template #prefix>
                    <scan-outlined />
                  </template>
                  <template #suffix>
                    <a-button type="link" @click="simulateScan">模拟扫描</a-button>
                  </template>
                </a-input>

                <a-space>
                  <a-button type="primary" @click="handleOutScan" :loading="scanning">
                    确认出库
                  </a-button>
                  <a-button @click="clearCurrentRFID">清空</a-button>
                  <a-button @click="batchOut">批量出库</a-button>
                </a-space>
              </div>

              <a-divider />

              <div class="scanned-list">
                <a-table
                  :columns="outColumns"
                  :data-source="outItems"
                  :pagination="{ pageSize: 5 }"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'currentStock'">
                      <span :class="record.currentStock <= 0 ? 'low-stock' : ''">
                        {{ record.currentStock }}
                      </span>
                    </template>
                    <template v-else-if="column.key === 'quantity'">
                      <a-input-number
                        v-model:value="record.quantity"
                        :min="1"
                        :max="record.currentStock"
                        :precision="0"
                        style="width: 80px;"
                      />
                    </template>
                    <template v-else-if="column.key === 'expiryDate'">
                      <span :class="getExpiryClass(record.expiryStatus)">
                        {{ record.productInfo?.expiryDate || '-' }}
                      </span>
                    </template>
                    <template v-else-if="column.key === 'action'">
                      <a-button type="link" danger size="small" @click="removeOutItem(record.rfidTag)">
                        移除
                      </a-button>
                    </template>
                  </template>
                </a-table>
              </div>

              <div class="action-buttons" style="margin-top: 16px;">
                <a-button type="primary" @click="confirmOut" :disabled="outItems.length === 0">
                  确认出库
                </a-button>
                <a-button @click="clearOutItems">清空列表</a-button>
              </div>
            </a-card>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { ScanOutlined } from '@ant-design/icons-vue';
import {
  queryProductByRFID,
  checkExpiryByRFID,
  simulateRFIDScan
} from '../../utils/rfidManager';

// 状态
const activeTab = ref('in');
const currentRFID = ref('');
const scanning = ref(false);
const rfidInputRef = ref(null);

// 入库相关
const inType = ref('purchase');
const selectedSupplier = ref(null);
const selectedWarehouse = ref(null);
const inItems = ref([]);
const suppliers = ref([]);
const warehouses = ref([]);

// 出库相关
const outType = ref('sale');
const outItems = ref([]);

// 表格列定义
const inColumns = [
  { title: 'RFID标签', dataIndex: 'rfidTag', key: 'rfidTag', width: 150 },
  { title: '商品名称', dataIndex: ['productInfo', 'name'], key: 'name' },
  { title: '规格', dataIndex: ['productInfo', 'specification'], key: 'specification' },
  { title: '效期', key: 'expiryDate', width: 120 },
  { title: '数量', key: 'quantity', width: 100 },
  { title: '操作', key: 'action', width: 80 }
];

const outColumns = [
  { title: 'RFID标签', dataIndex: 'rfidTag', key: 'rfidTag', width: 150 },
  { title: '商品名称', dataIndex: ['productInfo', 'name'], key: 'name' },
  { title: '当前库存', key: 'currentStock', width: 100 },
  { title: '出库数量', key: 'quantity', width: 100 },
  { title: '效期', key: 'expiryDate', width: 120 },
  { title: '操作', key: 'action', width: 80 }
];

// 方法
const handleTabChange = (key) => {
  currentRFID.value = '';
  if (key === 'in') {
    outItems.value = [];
  } else {
    inItems.value = [];
  }
};

const handleInScan = async () => {
  if (!currentRFID.value.trim()) {
    message.warning('请输入或扫描RFID标签');
    return;
  }

  // 检查是否已添加
  if (inItems.value.some(item => item.rfidTag === currentRFID.value)) {
    message.warning('该RFID标签已添加');
    currentRFID.value = '';
    return;
  }

  scanning.value = true;

  try {
    const result = await queryProductByRFID(currentRFID.value);
    
    if (!result.success) {
      message.error(result.message || '未找到该RFID对应的商品');
      return;
    }

    const expiryStatus = checkExpiryByRFID(currentRFID.value);
    
    inItems.value.push({
      rfidTag: currentRFID.value,
      productInfo: result.data,
      expiryStatus,
      quantity: 1,
      inType: inType.value,
      supplierId: selectedSupplier.value,
      warehouseId: selectedWarehouse.value
    });

    message.success(`已添加: ${result.data.name || '未知商品'}`);
    currentRFID.value = '';
    rfidInputRef.value?.focus();
  } catch (error) {
    message.error('扫描失败: ' + error.message);
    console.error('RFID入库扫描失败:', error);
  } finally {
    scanning.value = false;
  }
};

const handleOutScan = async () => {
  if (!currentRFID.value.trim()) {
    message.warning('请输入或扫描RFID标签');
    return;
  }

  // 检查是否已添加
  if (outItems.value.some(item => item.rfidTag === currentRFID.value)) {
    message.warning('该RFID标签已添加');
    currentRFID.value = '';
    return;
  }

  scanning.value = true;

  try {
    const result = await queryProductByRFID(currentRFID.value);
    
    if (!result.success) {
      message.error(result.message || '未找到该RFID对应的商品');
      return;
    }

    // 查询当前库存
    const currentStock = await getCurrentStock(result.data.inventoryId, result.data.productType);
    
    if (currentStock <= 0) {
      message.error('该商品库存不足');
      return;
    }

    const expiryStatus = checkExpiryByRFID(currentRFID.value);
    
    outItems.value.push({
      rfidTag: currentRFID.value,
      productInfo: result.data,
      expiryStatus,
      currentStock,
      quantity: 1,
      outType: outType.value,
      warehouseId: selectedWarehouse.value
    });

    message.success(`已添加: ${result.data.name || '未知商品'}`);
    currentRFID.value = '';
    rfidInputRef.value?.focus();
  } catch (error) {
    message.error('扫描失败: ' + error.message);
    console.error('RFID出库扫描失败:', error);
  } finally {
    scanning.value = false;
  }
};

const getCurrentStock = async (inventoryId, productType) => {
  try {
    const organization_id = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    
    // 根据商品类型调用不同的API
    let apiUrl = '';
    switch (productType) {
      case 'lens':
        apiUrl = `https://aiforoptometry.com/lensinventory/detail/${inventoryId}/`;
        break;
      case 'frame':
        apiUrl = `https://aiforoptometry.com/frameinventory/detail/${inventoryId}/`;
        break;
      case 'solution':
        apiUrl = `https://aiforoptometry.com/solution/detail/${inventoryId}/`;
        break;
      default:
        return 0;
    }

    const response = await fetch(apiUrl, {
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
        return result.data.current_stock || 0;
      }
    }
  } catch (error) {
    console.error('获取库存失败:', error);
  }
  
  return 0;
};

const simulateScan = async () => {
  try {
    const rfidTag = await simulateRFIDScan();
    currentRFID.value = rfidTag;
  } catch (error) {
    message.error('模拟扫描失败');
  }
};

const clearCurrentRFID = () => {
  currentRFID.value = '';
  rfidInputRef.value?.focus();
};

const removeInItem = (rfidTag) => {
  const index = inItems.value.findIndex(item => item.rfidTag === rfidTag);
  if (index !== -1) {
    inItems.value.splice(index, 1);
    message.success('已移除');
  }
};

const removeOutItem = (rfidTag) => {
  const index = outItems.value.findIndex(item => item.rfidTag === rfidTag);
  if (index !== -1) {
    outItems.value.splice(index, 1);
    message.success('已移除');
  }
};

const clearInItems = () => {
  inItems.value = [];
  message.success('已清空入库列表');
};

const clearOutItems = () => {
  outItems.value = [];
  message.success('已清空出库列表');
};

const batchIn = async () => {
  if (inItems.value.length === 0) {
    message.warning('请先扫描商品');
    return;
  }

  try {
    // 批量确认入库
    await confirmIn();
  } catch (error) {
    message.error('批量入库失败: ' + error.message);
  }
};

const batchOut = async () => {
  if (outItems.value.length === 0) {
    message.warning('请先扫描商品');
    return;
  }

  try {
    // 批量确认出库
    await confirmOut();
  } catch (error) {
    message.error('批量出库失败: ' + error.message);
  }
};

const confirmIn = async () => {
  if (inItems.value.length === 0) {
    message.warning('请先扫描商品');
    return;
  }

  try {
    const organization_id = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    
    const inData = {
      organization_id,
      items: inItems.value.map(item => ({
        rfidTag: item.rfidTag,
        inventoryId: item.productInfo.inventoryId,
        productId: item.productInfo.productId,
        productType: item.productInfo.productType,
        quantity: item.quantity,
        inType: item.inType,
        supplierId: item.supplierId,
        warehouseId: item.warehouseId
      })),
      operator: localStorage.getItem('username') || 'system',
      inTime: new Date().toISOString()
    };

    if (organization_id && csrftoken) {
      const response = await fetch('https://aiforoptometry.com/rfid/in/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        },
        credentials: 'include',
        body: JSON.stringify(inData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 200 || result.code === 201) {
          message.success('入库成功');
          inItems.value = [];
        } else {
          throw new Error(result.message || '入库失败');
        }
      } else {
        throw new Error('入库失败');
      }
    }
  } catch (error) {
    message.error('入库失败: ' + error.message);
    console.error('RFID入库失败:', error);
  }
};

const confirmOut = async () => {
  if (outItems.value.length === 0) {
    message.warning('请先扫描商品');
    return;
  }

  // 检查库存是否充足
  for (const item of outItems.value) {
    if (item.quantity > item.currentStock) {
      message.error(`${item.productInfo.name} 库存不足`);
      return;
    }
  }

  try {
    const organization_id = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    
    const outData = {
      organization_id,
      items: outItems.value.map(item => ({
        rfidTag: item.rfidTag,
        inventoryId: item.productInfo.inventoryId,
        productId: item.productInfo.productId,
        productType: item.productInfo.productType,
        quantity: item.quantity,
        outType: item.outType,
        warehouseId: item.warehouseId
      })),
      operator: localStorage.getItem('username') || 'system',
      outTime: new Date().toISOString()
    };

    if (organization_id && csrftoken) {
      const response = await fetch('https://aiforoptometry.com/rfid/out/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        },
        credentials: 'include',
        body: JSON.stringify(outData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 200 || result.code === 201) {
          message.success('出库成功');
          outItems.value = [];
        } else {
          throw new Error(result.message || '出库失败');
        }
      } else {
        throw new Error('出库失败');
      }
    }
  } catch (error) {
    message.error('出库失败: ' + error.message);
    console.error('RFID出库失败:', error);
  }
};

const getExpiryClass = (expiryStatus) => {
  if (!expiryStatus) return '';
  
  if (expiryStatus.isExpired) return 'expired-text';
  if (expiryStatus.daysRemaining <= 30) return 'warning-text';
  return 'normal-text';
};

// 获取供应商列表
const fetchSuppliers = async () => {
  try {
    const organization_id = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (organization_id && csrftoken) {
      const response = await fetch(`https://aiforoptometry.com/supplier/list/${organization_id}/`, {
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
          suppliers.value = result.data.items || [];
        }
      }
    }
  } catch (error) {
    console.error('获取供应商列表失败:', error);
  }
};

// 获取仓库列表
const fetchWarehouses = async () => {
  // 检查API可用性标记（如果之前检测到API不可用，就不再尝试）
  const apiUnavailable = localStorage.getItem('warehouse_api_unavailable');
  if (apiUnavailable === 'true') {
    // API已知不可用，直接使用本地数据
    const cachedWarehouses = localStorage.getItem('warehouses_cache');
    if (cachedWarehouses) {
      try {
        const parsed = JSON.parse(cachedWarehouses);
        if (parsed && parsed.length > 0) {
          warehouses.value = parsed;
          return;
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
    // 使用默认仓库
    warehouses.value = [
      { id: 1, name: '总仓', code: 'MAIN001', type: 'main', status: 'active' },
      { id: 2, name: '门店1', code: 'BRANCH001', type: 'branch', status: 'active' }
    ];
    return;
  }
  
  // 先尝试从本地存储读取缓存数据
  const cachedWarehouses = localStorage.getItem('warehouses_cache');
  if (cachedWarehouses) {
    try {
      const parsed = JSON.parse(cachedWarehouses);
      if (parsed && parsed.length > 0) {
        warehouses.value = parsed;
      }
    } catch (e) {
      // 忽略解析错误
    }
  }
  
  // 如果没有缓存数据，先设置默认仓库
  if (!warehouses.value || warehouses.value.length === 0) {
    warehouses.value = [
      { id: 1, name: '总仓', code: 'MAIN001', type: 'main', status: 'active' },
      { id: 2, name: '门店1', code: 'BRANCH001', type: 'branch', status: 'active' }
    ];
  }
  
  // 尝试从API获取最新数据（仅尝试一次，如果失败则标记为不可用）
  try {
    const organization_id = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    
    // 使用AbortController设置超时，避免长时间等待
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时
    
    const response = await fetch('https://aiforoptometry.com/warehouse/list/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      credentials: 'include',
      signal: controller.signal,
      body: JSON.stringify({
        organization_id,
        page: 1,
        page_size: 100,
        status: 'active'
      })
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      if (result.code === 200 && result.data && result.data.items) {
        warehouses.value = result.data.items;
        // 保存到本地存储作为后备
        if (warehouses.value.length > 0) {
          localStorage.setItem('warehouses_cache', JSON.stringify(warehouses.value));
        }
        // API可用，清除不可用标记
        localStorage.removeItem('warehouse_api_unavailable');
      }
    } else if (response.status === 404) {
      // API不存在，标记为不可用，避免后续重复请求
      localStorage.setItem('warehouse_api_unavailable', 'true');
    }
  } catch (error) {
    // 静默处理错误
    if (error.name !== 'AbortError') {
      // 非超时错误，可能是网络问题，不标记为永久不可用
    }
  }
};

onMounted(() => {
  fetchSuppliers();
  fetchWarehouses();
});
</script>

<style scoped>
.rfid-in-out {
  padding: 16px;
}

.scan-section {
  margin-bottom: 16px;
}

.scanned-list {
  max-height: 400px;
  overflow-y: auto;
}

.expired-text {
  color: #ff4d4f;
  font-weight: bold;
}

.warning-text {
  color: #fa8c16;
  font-weight: bold;
}

.normal-text {
  color: #52c41a;
}

.low-stock {
  color: #ff4d4f;
  font-weight: bold;
}
</style>

