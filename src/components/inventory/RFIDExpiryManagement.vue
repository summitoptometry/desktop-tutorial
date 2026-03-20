<template>
  <div class="rfid-expiry-management">
    <a-card title="RFID效期管理">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="refreshExpiryData">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
          <a-button @click="exportExpiryReport">导出报表</a-button>
        </a-space>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-section" style="margin-bottom: 16px;">
        <a-form layout="inline">
          <a-form-item label="预警天数">
            <a-input-number
              v-model:value="warningDays"
              :min="1"
              :max="365"
              style="width: 120px;"
              @change="handleFilterChange"
            />
            <span style="margin-left: 8px;">天内过期</span>
          </a-form-item>
          <a-form-item label="状态筛选">
            <a-select
              v-model:value="statusFilter"
              style="width: 150px;"
              @change="handleFilterChange"
            >
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="expired">已过期</a-select-option>
              <a-select-option value="warning">即将过期</a-select-option>
              <a-select-option value="caution">注意</a-select-option>
              <a-select-option value="normal">正常</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="商品类型">
            <a-select
              v-model:value="productTypeFilter"
              style="width: 150px;"
              @change="handleFilterChange"
            >
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="lens">镜片</a-select-option>
              <a-select-option value="frame">镜框</a-select-option>
              <a-select-option value="solution">护理液</a-select-option>
              <a-select-option value="soft_contact">软镜</a-select-option>
              <a-select-option value="accessory">非医疗产品</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleFilterChange">查询</a-button>
            <a-button style="margin-left: 8px;" @click="resetFilter">重置</a-button>
          </a-form-item>
        </a-form>
      </div>

      <!-- 统计信息 -->
      <a-row :gutter="16" style="margin-bottom: 16px;">
        <a-col :span="6">
          <a-statistic
            title="总商品数"
            :value="totalProducts"
            :value-style="{ color: '#1890ff' }"
          />
        </a-col>
        <a-col :span="6">
          <a-statistic
            title="已过期"
            :value="expiredCount"
            :value-style="{ color: '#ff4d4f' }"
          />
        </a-col>
        <a-col :span="6">
          <a-statistic
            title="即将过期"
            :value="warningCount"
            :value-style="{ color: '#fa8c16' }"
          />
        </a-col>
        <a-col :span="6">
          <a-statistic
            title="正常"
            :value="normalCount"
            :value-style="{ color: '#52c41a' }"
          />
        </a-col>
      </a-row>

      <!-- 商品列表 -->
      <a-table
        :columns="columns"
        :data-source="filteredProducts"
        :pagination="pagination"
        :loading="loading"
        @change="handleTableChange"
        row-key="rfidTag"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'expiryStatus'">
            <a-tag :color="getStatusColor(record.expiryStatus.status)">
              {{ getStatusText(record.expiryStatus) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'daysRemaining'">
            <span :class="getDaysRemainingClass(record.expiryStatus)">
              {{ formatDaysRemaining(record.expiryStatus) }}
            </span>
          </template>
          <template v-else-if="column.key === 'expiryDate'">
            <span :class="getExpiryDateClass(record.expiryStatus)">
              {{ record.productInfo?.expiryDate || '-' }}
            </span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewDetail(record)">
                查看详情
              </a-button>
              <a-button type="link" size="small" @click="scanRFID(record.rfidTag)">
                扫描RFID
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <!-- 详情对话框 -->
      <a-modal
        v-model:visible="detailModalVisible"
        title="商品详情"
        :footer="null"
        width="600px"
      >
        <a-descriptions :column="2" bordered v-if="selectedProduct">
          <a-descriptions-item label="RFID标签" :span="2">
            {{ selectedProduct.rfidTag }}
          </a-descriptions-item>
          <a-descriptions-item label="商品名称" :span="2">
            {{ selectedProduct.productInfo?.name || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="商品类型">
            {{ getProductTypeName(selectedProduct.productType) }}
          </a-descriptions-item>
          <a-descriptions-item label="规格">
            {{ selectedProduct.productInfo?.specification || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="生产日期">
            {{ selectedProduct.productInfo?.productionDate || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="到期日期">
            <span :class="getExpiryDateClass(selectedProduct.expiryStatus)">
              {{ selectedProduct.productInfo?.expiryDate || '-' }}
            </span>
          </a-descriptions-item>
          <a-descriptions-item label="批号">
            {{ selectedProduct.productInfo?.batchNumber || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="效期状态">
            <a-tag :color="getStatusColor(selectedProduct.expiryStatus.status)">
              {{ getStatusText(selectedProduct.expiryStatus) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="剩余天数" :span="2">
            <span :class="getDaysRemainingClass(selectedProduct.expiryStatus)">
              {{ formatDaysRemaining(selectedProduct.expiryStatus) }}
            </span>
          </a-descriptions-item>
          <a-descriptions-item label="绑定时间">
            {{ formatDate(selectedProduct.bindTime) }}
          </a-descriptions-item>
          <a-descriptions-item label="操作人">
            {{ selectedProduct.operator || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-modal>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import {
  getRFIDBindings,
  getExpiringProducts,
  checkExpiryByRFID
} from '../../utils/rfidManager';
import dayjs from 'dayjs';

// 状态
const loading = ref(false);
const warningDays = ref(30);
const statusFilter = ref('');
const productTypeFilter = ref('');
const allProducts = ref([]);
const selectedProduct = ref(null);
const detailModalVisible = ref(false);

// 分页
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`
});

// 表格列定义
const columns = [
  { title: 'RFID标签', dataIndex: 'rfidTag', key: 'rfidTag', width: 180 },
  { title: '商品名称', dataIndex: ['productInfo', 'name'], key: 'name' },
  { title: '商品类型', dataIndex: 'productType', key: 'productType', width: 100 },
  { title: '规格', dataIndex: ['productInfo', 'specification'], key: 'specification' },
  { title: '到期日期', key: 'expiryDate', width: 120 },
  { title: '剩余天数', key: 'daysRemaining', width: 100 },
  { title: '效期状态', key: 'expiryStatus', width: 120 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' }
];

// 计算属性
const filteredProducts = computed(() => {
  let filtered = [...allProducts.value];

  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(item => {
      return item.expiryStatus.status === statusFilter.value;
    });
  }

  // 商品类型筛选
  if (productTypeFilter.value) {
    filtered = filtered.filter(item => {
      return item.productType === productTypeFilter.value;
    });
  }

  // 预警天数筛选（只对即将过期和注意状态有效）
  if (statusFilter.value === 'warning' || statusFilter.value === 'caution') {
    filtered = filtered.filter(item => {
      return item.expiryStatus.daysRemaining <= warningDays.value;
    });
  }

  pagination.value.total = filtered.length;
  
  const start = (pagination.value.current - 1) * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return filtered.slice(start, end);
});

const totalProducts = computed(() => allProducts.value.length);

const expiredCount = computed(() => {
  return allProducts.value.filter(item => item.expiryStatus.status === 'expired').length;
});

const warningCount = computed(() => {
  return allProducts.value.filter(item => 
    item.expiryStatus.status === 'warning' || item.expiryStatus.status === 'caution'
  ).length;
});

const normalCount = computed(() => {
  return allProducts.value.filter(item => item.expiryStatus.status === 'normal').length;
});

// 方法
const refreshExpiryData = async () => {
  loading.value = true;
  
  try {
    // 获取所有RFID绑定
    const bindings = getRFIDBindings().filter(b => b.status === 'active');
    
    // 为每个绑定检查效期
    allProducts.value = bindings.map(binding => {
      const expiryStatus = checkExpiryByRFID(binding.rfidTag);
      return {
        ...binding,
        expiryStatus
      };
    });

    // 按剩余天数排序（已过期和即将过期的排在前面）
    allProducts.value.sort((a, b) => {
      if (a.expiryStatus.isExpired && !b.expiryStatus.isExpired) return -1;
      if (!a.expiryStatus.isExpired && b.expiryStatus.isExpired) return 1;
      if (a.expiryStatus.daysRemaining !== null && b.expiryStatus.daysRemaining !== null) {
        return a.expiryStatus.daysRemaining - b.expiryStatus.daysRemaining;
      }
      return 0;
    });

    message.success('数据刷新成功');
  } catch (error) {
    message.error('刷新数据失败: ' + error.message);
    console.error('刷新效期数据失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = () => {
  pagination.value.current = 1;
};

const resetFilter = () => {
  warningDays.value = 30;
  statusFilter.value = '';
  productTypeFilter.value = '';
  pagination.value.current = 1;
};

const handleTableChange = (pag) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
};

const getStatusColor = (status) => {
  const colorMap = {
    expired: 'red',
    warning: 'orange',
    caution: 'gold',
    normal: 'green',
    unknown: 'default'
  };
  return colorMap[status] || 'default';
};

const getStatusText = (expiryStatus) => {
  if (!expiryStatus || !expiryStatus.hasExpiry) {
    return '无效期';
  }
  
  const statusMap = {
    expired: '已过期',
    warning: '即将过期',
    caution: '注意',
    normal: '正常',
    unknown: '未知'
  };
  
  return statusMap[expiryStatus.status] || '未知';
};

const formatDaysRemaining = (expiryStatus) => {
  if (!expiryStatus || !expiryStatus.hasExpiry) {
    return '-';
  }
  
  if (expiryStatus.isExpired) {
    return `已过期 ${Math.abs(expiryStatus.daysRemaining)} 天`;
  }
  
  return `${expiryStatus.daysRemaining} 天`;
};

const getDaysRemainingClass = (expiryStatus) => {
  if (!expiryStatus) return '';
  
  if (expiryStatus.isExpired) return 'expired-text';
  if (expiryStatus.daysRemaining <= 30) return 'warning-text';
  if (expiryStatus.daysRemaining <= 90) return 'caution-text';
  return 'normal-text';
};

const getExpiryDateClass = (expiryStatus) => {
  if (!expiryStatus) return '';
  
  if (expiryStatus.isExpired) return 'expired-text';
  if (expiryStatus.daysRemaining <= 30) return 'warning-text';
  return 'normal-text';
};

const getProductTypeName = (type) => {
  const typeMap = {
    lens: '镜片',
    frame: '镜框',
    solution: '护理液',
    soft_contact: '软镜',
    accessory: '非医疗产品'
  };
  return typeMap[type] || type;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

const viewDetail = (record) => {
  selectedProduct.value = record;
  detailModalVisible.value = true;
};

const scanRFID = (rfidTag) => {
  message.info(`RFID标签: ${rfidTag}`);
  // 这里可以触发RFID扫描器扫描
};

const exportExpiryReport = () => {
  if (allProducts.value.length === 0) {
    message.warning('没有可导出的数据');
    return;
  }

  // 构建CSV数据
  const headers = ['RFID标签', '商品名称', '商品类型', '规格', '到期日期', '剩余天数', '效期状态'];
  const rows = allProducts.value.map(item => [
    item.rfidTag,
    item.productInfo?.name || '未知',
    getProductTypeName(item.productType),
    item.productInfo?.specification || '-',
    item.productInfo?.expiryDate || '-',
    formatDaysRemaining(item.expiryStatus),
    getStatusText(item.expiryStatus)
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
  link.setAttribute('download', `RFID效期报表_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  message.success('导出成功');
};

onMounted(() => {
  refreshExpiryData();
});
</script>

<style scoped>
.rfid-expiry-management {
  padding: 16px;
}

.filter-section {
  background: #fafafa;
  padding: 16px;
  border-radius: 4px;
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

