<template>
  <a-modal
    :visible="visible"
    title="库存记录"
    width="80%"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="stock-history">
      <div class="search-bar">
        <a-form layout="inline">
          <a-form-item label="明细">
            <a-input
              v-model:value="searchForm.detail"
              placeholder="请输入明细"
              allowClear
              @change="handleSearch"
            />
          </a-form-item>
          <a-form-item label="调整类型">
            <a-select
              v-model:value="searchForm.adjustType"
              placeholder="请选择调整类型"
              allowClear
              @change="handleSearch"
            >
              <a-select-option value="in">入库</a-select-option>
              <a-select-option value="out">出库</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="时间范围">
            <a-range-picker
              v-model:value="searchForm.dateRange"
              @change="handleSearch"
            />
          </a-form-item>
          <a-form-item label="类别">
            <a-select
              v-model:value="searchForm.category"
              placeholder="请选择类别"
              allowClear
              @change="handleSearch"
              style="width: 160px"
            >
              <a-select-option value="lens">镜片</a-select-option>
              <a-select-option value="frame">镜框</a-select-option>
              <a-select-option value="soft_contact">软镜</a-select-option>
              <a-select-option value="solution">护理液及药品</a-select-option>
              <a-select-option value="non_medical">非医疗产品</a-select-option>
              <a-select-option value="hard_contact">硬镜</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSearch">搜索</a-button>
            <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
          </a-form-item>
        </a-form>
      </div>

      <a-table
        :columns="columns"
        :data-source="filteredHistory"
        :pagination="pagination"
        :loading="loading"
        @change="handleTableChange"
      />
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { getStockHistory } from '@/utils/stockManager';
import dayjs from 'dayjs';

const props = defineProps({
  visible: Boolean,
  type: String, // 产品类型
  productId: [String, Number], // 产品ID
  detail: String, // 明细
  category: String // 新增：类别
});

const emit = defineEmits(['update:visible']);

// 状态变量
const loading = ref(false);
const historyData = ref([]);

// 分页相关
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: false,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`,
  pageSizeOptions: ['10'],
  defaultPageSize: 10
});

// 搜索表单
const searchForm = ref({
  detail: '',
  adjustType: undefined,
  dateRange: null,
  category: undefined // 新增
});

// 表格列定义
const columns = [
  { 
    title: '时间', 
    dataIndex: 'timestamp', 
    key: 'timestamp',
    customRender: ({ text }) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')
  },
  { title: '明细', dataIndex: 'detail', key: 'detail' },
  { 
    title: '调整类型', 
    dataIndex: 'adjustType', 
    key: 'adjustType',
    customRender: ({ text }) => text === 'in' ? '入库' : '出库'
  },
  { 
    title: '调整数量', 
    dataIndex: 'adjustAmount', 
    key: 'adjustAmount',
    customRender: ({ text, record }) => {
      const prefix = record.adjustType === 'in' ? '+' : '-';
      return `${prefix}${text}`;
    }
  },
  { title: '调整前库存', dataIndex: 'beforeStock', key: 'beforeStock' },
  { title: '调整后库存', dataIndex: 'afterStock', key: 'afterStock' },
  { title: '操作人', dataIndex: 'operator', key: 'operator' },
  { title: '备注', dataIndex: 'remark', key: 'remark' }
];

// 过滤后的历史记录
const filteredHistory = computed(() => {
  let data = historyData.value;

  // 判断是否有任何筛选条件
  const hasFilter =
    searchForm.value.detail ||
    searchForm.value.adjustType ||
    searchForm.value.dateRange ||
    searchForm.value.category;

  if (hasFilter) {
    if (searchForm.value.detail) {
      data = data.filter(item =>
        item.detail && item.detail.toLowerCase().includes(searchForm.value.detail.toLowerCase())
      );
    }
    if (searchForm.value.adjustType) {
      data = data.filter(item =>
        item.adjustType === searchForm.value.adjustType
      );
    }
    if (searchForm.value.dateRange) {
      const [start, end] = searchForm.value.dateRange;
      data = data.filter(item => {
        const timestamp = dayjs(item.timestamp);
        return timestamp.isAfter(start) && timestamp.isBefore(end);
      });
    }
    if (searchForm.value.category) {
      data = data.filter(item => item.type === searchForm.value.category);
    }
  }
  // 如果没有任何筛选条件，则显示所有
  pagination.value.total = data.length;
  const start = (pagination.value.current - 1) * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return data.slice(start, end);
});

// 处理分页变化
const handleTableChange = (pag) => {
  pagination.value.current = pag.current;
};

// 处理搜索
const handleSearch = () => {
  pagination.value.current = 1;
};

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    detail: '',
    adjustType: undefined,
    dateRange: null,
    category: undefined // 新增
  };
  pagination.value.current = 1;
};

// 处理取消
const handleCancel = () => {
  emit('update:visible', false);
};

// 监听弹窗显示状态
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    loading.value = true;
    try {
      console.log('Loading stock history for type:', props.type);
      historyData.value = getStockHistory(props.type);
      console.log('Loaded history data:', historyData.value);
      
      // 强制填充搜索表单
      searchForm.value.detail = props.detail || '';
      searchForm.value.category = props.category || '';
      console.log('Search form after auto-fill:', searchForm.value);
      
      // 如果是软镜类型，确保detail中包含球镜度数
      if (props.type === 'soft_contact' && props.detail) {
        const detailParts = props.detail.split('/');
        if (detailParts.length >= 3) {
          // 已经包含球镜度数，格式为：品名/球镜度数/批号
          console.log('Soft contact detail with sphere:', props.detail);
        } else if (detailParts.length === 2) {
          // 旧格式，需要更新为新格式：品名/球镜度数/批号
          console.log('Converting old soft contact detail format to new format');
        }
      }
    } catch (error) {
      console.error('获取库存记录失败:', error);
    } finally {
      loading.value = false;
    }
  } else {
    // 关闭弹窗时重置搜索表单
    resetSearch();
  }
});
</script>

<style scoped>
.stock-history {
  width: 100%;
}

.search-bar {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}
</style> 