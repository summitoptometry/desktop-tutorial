<template>
  <div class="rfid-inventory">
    <a-card title="RFID盘点管理">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="startInventory">
            <template #icon><play-circle-outlined /></template>
            开始盘点
          </a-button>
          <a-button @click="showInventoryHistory">盘点历史</a-button>
          <a-button @click="clearScannedItems">清空已扫描</a-button>
          <a-button @click="exportInventoryResult">导出结果</a-button>
        </a-space>
      </template>

      <div class="inventory-status" v-if="isInventorying">
        <a-alert
          :message="`盘点进行中... 已扫描 ${scannedItems.length} 件商品`"
          type="info"
          show-icon
          style="margin-bottom: 16px;"
        />
      </div>

      <a-row :gutter="16">
        <!-- 左侧：RFID扫描区域 -->
        <a-col :span="12">
          <a-card title="RFID扫描" size="small">
            <div class="scan-area">
              <a-input
                v-model:value="currentRFID"
                placeholder="请扫描RFID标签或手动输入"
                size="large"
                @pressEnter="handleScan"
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

              <a-space style="width: 100%; margin-bottom: 16px;">
                <a-button type="primary" @click="handleScan" :loading="scanning">
                  确认扫描
                </a-button>
                <a-button @click="clearCurrentRFID">清空</a-button>
                <a-switch v-model:checked="autoScan" checked-children="自动扫描" un-checked-children="手动扫描" />
              </a-space>

              <!-- 最近扫描的商品信息 -->
              <a-card v-if="lastScannedItem" title="最近扫描" size="small" style="margin-top: 16px;">
                <a-descriptions :column="1" size="small">
                  <a-descriptions-item label="RFID标签">
                    {{ lastScannedItem.rfidTag }}
                  </a-descriptions-item>
                  <a-descriptions-item label="商品名称">
                    {{ lastScannedItem.productInfo?.name || '未知' }}
                  </a-descriptions-item>
                  <a-descriptions-item label="规格">
                    {{ lastScannedItem.productInfo?.specification || '-' }}
                  </a-descriptions-item>
                  <a-descriptions-item label="效期">
                    <span :class="getExpiryStatusClass(lastScannedItem.expiryStatus)">
                      {{ formatExpiryInfo(lastScannedItem.expiryStatus) }}
                    </span>
                  </a-descriptions-item>
                </a-descriptions>
              </a-card>
            </div>
          </a-card>
        </a-col>

        <!-- 右侧：盘点结果 -->
        <a-col :span="12">
          <a-card title="盘点结果" size="small">
            <div class="result-stats">
              <a-statistic-group>
                <a-statistic title="已扫描" :value="scannedItems.length" />
                <a-statistic title="正常" :value="normalCount" :value-style="{ color: '#3f8600' }" />
                <a-statistic title="异常" :value="abnormalCount" :value-style="{ color: '#cf1322' }" />
              </a-statistic-group>
            </div>

            <a-table
              :columns="columns"
              :data-source="scannedItems"
              :pagination="{ pageSize: 10 }"
              size="small"
              style="margin-top: 16px;"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'expiryStatus'">
                  <a-tag :color="getExpiryTagColor(record.expiryStatus?.status)">
                    {{ formatExpiryInfo(record.expiryStatus) }}
                  </a-tag>
                </template>
                <template v-else-if="column.key === 'status'">
                  <a-tag :color="record.status === 'normal' ? 'green' : 'red'">
                    {{ record.status === 'normal' ? '正常' : '异常' }}
                  </a-tag>
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-button type="link" danger size="small" @click="removeScannedItem(record.rfidTag)">
                    移除
                  </a-button>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>

      <!-- 盘点完成对话框 -->
      <a-modal
        v-model:visible="finishModalVisible"
        title="盘点完成"
        @ok="handleFinishInventory"
      >
        <a-descriptions :column="1">
          <a-descriptions-item label="总扫描数">
            {{ scannedItems.length }}
          </a-descriptions-item>
          <a-descriptions-item label="正常商品">
            {{ normalCount }}
          </a-descriptions-item>
          <a-descriptions-item label="异常商品">
            {{ abnormalCount }}
          </a-descriptions-item>
        </a-descriptions>
        <a-form-item label="盘点备注" style="margin-top: 16px;">
          <a-textarea v-model:value="inventoryRemark" :rows="3" placeholder="请输入盘点备注" />
        </a-form-item>
      </a-modal>

      <!-- 盘点历史对话框 -->
      <a-modal
        v-model:visible="historyModalVisible"
        title="盘点历史记录"
        width="90%"
        :footer="null"
      >
        <a-table
          :columns="historyColumns"
          :data-source="inventoryHistory"
          :pagination="{ pageSize: 10 }"
          :loading="historyLoading"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'date'">
              {{ formatDate(record.inventoryTime) }}
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="record.status === 'completed' ? 'green' : 'orange'">
                {{ record.status === 'completed' ? '已完成' : '进行中' }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="viewHistoryDetail(record)">查看详情</a-button>
                <a-button type="link" size="small" @click="exportHistoryRecord(record)">导出</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-modal>

      <!-- 历史记录详情对话框 -->
      <a-modal
        v-model:visible="historyDetailModalVisible"
        title="盘点详情"
        width="80%"
        :footer="null"
      >
        <a-descriptions :column="2" bordered v-if="selectedHistory">
          <a-descriptions-item label="盘点时间">
            {{ formatDate(selectedHistory.inventoryTime) }}
          </a-descriptions-item>
          <a-descriptions-item label="操作人">
            {{ selectedHistory.operator }}
          </a-descriptions-item>
          <a-descriptions-item label="总扫描数">
            {{ selectedHistory.totalCount }}
          </a-descriptions-item>
          <a-descriptions-item label="正常商品">
            {{ selectedHistory.normalCount }}
          </a-descriptions-item>
          <a-descriptions-item label="异常商品">
            {{ selectedHistory.abnormalCount }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="selectedHistory.status === 'completed' ? 'green' : 'orange'">
              {{ selectedHistory.status === 'completed' ? '已完成' : '进行中' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="备注" :span="2">
            {{ selectedHistory.remark || '-' }}
          </a-descriptions-item>
        </a-descriptions>
        <a-divider>盘点明细</a-divider>
        <a-table
          :columns="columns"
          :data-source="selectedHistory?.scannedItems || []"
          :pagination="{ pageSize: 10 }"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'expiryStatus'">
              <a-tag :color="getExpiryTagColor(record.expiryStatus?.status)">
                {{ formatExpiryInfo(record.expiryStatus) }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="record.status === 'normal' ? 'green' : 'red'">
                {{ record.status === 'normal' ? '正常' : '异常' }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </a-modal>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  PlayCircleOutlined,
  ScanOutlined
} from '@ant-design/icons-vue';
import {
  queryProductByRFID,
  checkExpiryByRFID,
  simulateRFIDScan,
  listenRFIDScan
} from '../../utils/rfidManager';
import dayjs from 'dayjs';

// 状态
const isInventorying = ref(false);
const currentRFID = ref('');
const scannedItems = ref([]);
const lastScannedItem = ref(null);
const scanning = ref(false);
const autoScan = ref(false);
const finishModalVisible = ref(false);
const inventoryRemark = ref('');
const rfidInputRef = ref(null);
const historyModalVisible = ref(false);
const historyDetailModalVisible = ref(false);
const historyLoading = ref(false);
const inventoryHistory = ref([]);
const selectedHistory = ref(null);

// 表格列定义
const columns = [
  { title: 'RFID标签', dataIndex: 'rfidTag', key: 'rfidTag', width: 150 },
  { title: '商品名称', dataIndex: ['productInfo', 'name'], key: 'name' },
  { title: '规格', dataIndex: ['productInfo', 'specification'], key: 'specification' },
  { title: '效期状态', key: 'expiryStatus', width: 120 },
  { title: '状态', key: 'status', width: 80 },
  { title: '操作', key: 'action', width: 80 }
];

// 历史记录表格列
const historyColumns = [
  { title: '盘点时间', key: 'date', width: 180 },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 120 },
  { title: '总扫描数', dataIndex: 'totalCount', key: 'totalCount', width: 100 },
  { title: '正常', dataIndex: 'normalCount', key: 'normalCount', width: 100 },
  { title: '异常', dataIndex: 'abnormalCount', key: 'abnormalCount', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 150 }
];

// 计算属性
const normalCount = computed(() => {
  return scannedItems.value.filter(item => item.status === 'normal').length;
});

const abnormalCount = computed(() => {
  return scannedItems.value.filter(item => item.status === 'abnormal').length;
});

// 方法
const startInventory = () => {
  isInventorying.value = true;
  scannedItems.value = [];
  lastScannedItem.value = null;
  message.success('盘点已开始，请开始扫描RFID标签');
  
  // 聚焦输入框
  setTimeout(() => {
    rfidInputRef.value?.focus();
  }, 100);
};

const handleScan = async () => {
  if (!currentRFID.value.trim()) {
    message.warning('请输入或扫描RFID标签');
    return;
  }

  if (!isInventorying.value) {
    message.warning('请先开始盘点');
    return;
  }

  // 检查是否已扫描
  if (scannedItems.value.some(item => item.rfidTag === currentRFID.value)) {
    message.warning('该RFID标签已扫描');
    currentRFID.value = '';
    return;
  }

  scanning.value = true;

  try {
    // 查询商品信息
    const result = await queryProductByRFID(currentRFID.value);
    
    if (!result.success) {
      // 未找到商品，标记为异常
      scannedItems.value.push({
        rfidTag: currentRFID.value,
        productInfo: null,
        status: 'abnormal',
        error: result.message || '未找到商品信息',
        scanTime: new Date().toISOString()
      });
      message.error(result.message || '未找到该RFID对应的商品');
    } else {
      // 检查效期
      const expiryStatus = checkExpiryByRFID(currentRFID.value);
      
      const item = {
        rfidTag: currentRFID.value,
        productInfo: result.data,
        status: expiryStatus.isExpired ? 'abnormal' : 'normal',
        expiryStatus,
        scanTime: new Date().toISOString()
      };

      scannedItems.value.push(item);
      lastScannedItem.value = item;
      
      if (item.status === 'normal') {
        message.success(`扫描成功: ${item.productInfo.name || '未知商品'}`);
      } else {
        message.warning(`扫描成功，但商品已过期: ${item.productInfo.name || '未知商品'}`);
      }
    }

    // 清空输入框并自动聚焦
    currentRFID.value = '';
    if (autoScan.value) {
      setTimeout(() => {
        rfidInputRef.value?.focus();
      }, 100);
    }
  } catch (error) {
    message.error('扫描失败: ' + error.message);
    console.error('RFID扫描失败:', error);
  } finally {
    scanning.value = false;
  }
};

const simulateScan = async () => {
  try {
    const rfidTag = await simulateRFIDScan();
    currentRFID.value = rfidTag;
    if (autoScan.value) {
      handleScan();
    }
  } catch (error) {
    message.error('模拟扫描失败');
  }
};

const clearCurrentRFID = () => {
  currentRFID.value = '';
  rfidInputRef.value?.focus();
};

const clearScannedItems = () => {
  scannedItems.value = [];
  lastScannedItem.value = null;
  message.success('已清空扫描记录');
};

const removeScannedItem = (rfidTag) => {
  const index = scannedItems.value.findIndex(item => item.rfidTag === rfidTag);
  if (index !== -1) {
    scannedItems.value.splice(index, 1);
    message.success('已移除');
  }
};

const formatExpiryInfo = (expiryStatus) => {
  if (!expiryStatus || !expiryStatus.hasExpiry) {
    return '无效期';
  }
  
  if (expiryStatus.isExpired) {
    return `已过期 ${Math.abs(expiryStatus.daysRemaining)} 天`;
  }
  
  if (expiryStatus.daysRemaining <= 30) {
    return `即将过期 ${expiryStatus.daysRemaining} 天`;
  }
  
  return `剩余 ${expiryStatus.daysRemaining} 天`;
};

const getExpiryStatusClass = (expiryStatus) => {
  if (!expiryStatus) return '';
  
  if (expiryStatus.isExpired) return 'expired-text';
  if (expiryStatus.daysRemaining <= 30) return 'warning-text';
  if (expiryStatus.daysRemaining <= 90) return 'caution-text';
  return 'normal-text';
};

const getExpiryTagColor = (status) => {
  const colorMap = {
    expired: 'red',
    warning: 'orange',
    caution: 'gold',
    normal: 'green',
    unknown: 'default'
  };
  return colorMap[status] || 'default';
};

const handleFinishInventory = async () => {
  if (scannedItems.value.length === 0) {
    message.warning('没有扫描任何商品');
    return;
  }

  try {
    const organization_id = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    
    const inventoryData = {
      organization_id,
      scannedItems: scannedItems.value,
      totalCount: scannedItems.value.length,
      normalCount: normalCount.value,
      abnormalCount: abnormalCount.value,
      remark: inventoryRemark.value,
      operator: localStorage.getItem('username') || 'system',
      inventoryTime: new Date().toISOString(),
      status: 'completed'
    };

    // 调用后端API保存盘点结果
    if (organization_id && csrftoken) {
      const response = await fetch('https://aiforoptometry.com/rfid/inventory/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        },
        credentials: 'include',
        body: JSON.stringify(inventoryData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 200 || result.code === 201) {
          message.success('盘点结果已保存');
          finishModalVisible.value = false;
          isInventorying.value = false;
          // 刷新历史记录
          await fetchInventoryHistory();
        } else {
          throw new Error(result.message || '保存失败');
        }
      } else {
        throw new Error('保存失败');
      }
    } else {
      // 仅本地保存
      const history = JSON.parse(localStorage.getItem('rfid_inventory_history') || '[]');
      history.unshift({
        ...inventoryData,
        id: Date.now()
      });
      localStorage.setItem('rfid_inventory_history', JSON.stringify(history));
      message.success('盘点结果已保存（本地）');
      finishModalVisible.value = false;
      isInventorying.value = false;
      await fetchInventoryHistory();
    }
  } catch (error) {
    message.error('保存盘点结果失败: ' + error.message);
    console.error('保存盘点结果失败:', error);
  }
};

const showInventoryHistory = async () => {
  historyModalVisible.value = true;
  await fetchInventoryHistory();
};

const fetchInventoryHistory = async () => {
  historyLoading.value = true;
  try {
    const organization_id = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    
    // 先尝试从后端获取
    if (organization_id && csrftoken) {
      const response = await fetch(`https://aiforoptometry.com/rfid/inventory/history/?organization_id=${organization_id}`, {
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
          inventoryHistory.value = result.data.items || [];
          return;
        }
      }
    }
    
    // 从本地存储获取
    const history = JSON.parse(localStorage.getItem('rfid_inventory_history') || '[]');
    inventoryHistory.value = history;
  } catch (error) {
    console.error('获取盘点历史失败:', error);
    // 从本地存储获取
    const history = JSON.parse(localStorage.getItem('rfid_inventory_history') || '[]');
    inventoryHistory.value = history;
  } finally {
    historyLoading.value = false;
  }
};

const viewHistoryDetail = (record) => {
  selectedHistory.value = record;
  historyDetailModalVisible.value = true;
};

const exportHistoryRecord = (record) => {
  if (!record.scannedItems || record.scannedItems.length === 0) {
    message.warning('该记录没有明细数据');
    return;
  }

  const headers = ['RFID标签', '商品名称', '规格', '效期', '状态', '扫描时间'];
  const rows = record.scannedItems.map(item => [
    item.rfidTag,
    item.productInfo?.name || '未知',
    item.productInfo?.specification || '-',
    formatExpiryInfo(item.expiryStatus),
    item.status === 'normal' ? '正常' : '异常',
    dayjs(item.scanTime).format('YYYY-MM-DD HH:mm:ss')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `RFID盘点记录_${dayjs(record.inventoryTime).format('YYYYMMDD_HHmmss')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  message.success('导出成功');
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

const exportInventoryResult = () => {
  if (scannedItems.value.length === 0) {
    message.warning('没有可导出的数据');
    return;
  }

  // 构建CSV数据
  const headers = ['RFID标签', '商品名称', '规格', '效期', '状态', '扫描时间'];
  const rows = scannedItems.value.map(item => [
    item.rfidTag,
    item.productInfo?.name || '未知',
    item.productInfo?.specification || '-',
    formatExpiryInfo(item.expiryStatus),
    item.status === 'normal' ? '正常' : '异常',
    dayjs(item.scanTime).format('YYYY-MM-DD HH:mm:ss')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // 创建下载链接
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `RFID盘点结果_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  message.success('导出成功');
};

// 监听RFID扫描（如果启用自动扫描）
let scanListener = null;

onMounted(() => {
  // 可以在这里初始化RFID硬件设备
  // scanListener = listenRFIDScan((rfidTag) => {
  //   currentRFID.value = rfidTag;
  //   if (autoScan.value) {
  //     handleScan();
  //   }
  // });
});

onUnmounted(() => {
  if (scanListener) {
    scanListener();
  }
});
</script>

<style scoped>
.rfid-inventory {
  padding: 16px;
}

.scan-area {
  min-height: 200px;
}

.result-stats {
  margin-bottom: 16px;
}

.expired-text {
  color: #ff4d4f;
  font-weight: bold;
}

.warning-text {
  color: #fa8c16;
  font-weight: bold;
}

.caution-text {
  color: #faad14;
}

.normal-text {
  color: #52c41a;
}
</style>

