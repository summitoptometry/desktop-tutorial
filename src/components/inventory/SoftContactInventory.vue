<template>
  <div class="soft-contact-inventory">
    <div class="search-bar">
      <div class="search-content">
        <a-form layout="inline">
          <a-form-item label="品名">
            <a-input
              v-model:value="searchForm.name"
              placeholder="请输入品名"
              allowClear
              @change="handleSearch"
            />
          </a-form-item>
          <a-form-item label="类型">
            <a-select
              v-model:value="searchForm.type"
              placeholder="请选择类型"
              allowClear
              @change="handleSearch"
            >
              <a-select-option value="daily">日抛</a-select-option>
              <a-select-option value="monthly">月抛</a-select-option>
              <a-select-option value="quarterly">季抛</a-select-option>
              <a-select-option value="halfYearly">半年抛</a-select-option>
              <a-select-option value="yearly">年抛</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="球镜度数">
            <a-input-number
              v-model:value="searchForm.sphere"
              placeholder="请输入球镜度数"
              :precision="2"
              :step="0.25"
              allowClear
              @change="handleSearch"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSearch">搜索</a-button>
            <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
          </a-form-item>
        </a-form>
        <div class="action-buttons">
          <a-button type="primary" @click="showAddModal">
            <template #icon><plus-outlined /></template>
            新增条目
          </a-button>
        </div>
      </div>
    </div>

    <div class="tab-content">
      <a-table
        :columns="columns"
        :data-source="filteredInventory"
        :pagination="pagination"
        :loading="isLoading"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="showStockModal(record)">调整库存</a-button>
              <a-button type="link" @click="showHistoryModal(record)">库存记录</a-button>
              <a-popconfirm
                title="确定要删除这条记录吗？"
                @confirm="deleteSoftContactInventory(record.id)"
                okText="确定"
                cancelText="取消"
              >
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增条目弹窗 -->
    <a-modal
      v-model:visible="addModalVisible"
      title="新增软镜条目"
      @ok="handleAddSubmit"
      :confirmLoading="addSubmitting"
    >
      <a-form
        :model="addForm"
        :rules="addFormRules"
        ref="addFormRef"
        layout="vertical"
      >
        <a-form-item label="选择产品" name="productId">
          <a-select
            v-model:value="addForm.productId"
            placeholder="请选择产品"
            :options="productOptions"
          />
        </a-form-item>
        <a-form-item label="类型" name="type">
          <a-select v-model:value="addForm.type" placeholder="请选择类型">
            <a-select-option value="daily">日抛</a-select-option>
            <a-select-option value="monthly">月抛</a-select-option>
            <a-select-option value="quarterly">季抛</a-select-option>
            <a-select-option value="halfYearly">半年抛</a-select-option>
            <a-select-option value="yearly">年抛</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="球镜度数" name="sphere">
          <a-input-number
            v-model:value="addForm.sphere"
            placeholder="请输入球镜度数"
            :precision="2"
            :step="0.25"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="生产日期" name="productionDate">
          <a-date-picker
            v-model:value="addForm.productionDate"
            style="width: 100%"
            :disabledDate="disabledProductionDate"
          />
        </a-form-item>
        <a-form-item label="到期日期" name="expiryDate">
          <a-date-picker
            v-model:value="addForm.expiryDate"
            style="width: 100%"
            :disabledDate="disabledExpiryDate"
          />
        </a-form-item>
        <a-form-item label="批号" name="batchNumber">
          <a-input
            v-model:value="addForm.batchNumber"
            placeholder="请输入批号"
          />
        </a-form-item>
        <a-form-item label="库存数量" name="currentStock">
          <a-input-number
            v-model:value="addForm.currentStock"
            placeholder="请输入库存数量"
            :min="0"
            :precision="0"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 调整库存弹窗 -->
    <a-modal
      v-model:visible="stockModalVisible"
      title="调整库存"
      @ok="handleStockAdjust"
    >
      <a-form :model="stockForm" :rules="stockRules" ref="stockFormRef">
        <a-form-item label="当前库存" name="currentStock">
          <a-input-number v-model:value="stockForm.currentStock" disabled />
        </a-form-item>
        <a-form-item label="调整数量" name="adjustAmount">
          <a-input-number v-model:value="stockForm.adjustAmount" />
        </a-form-item>
        <a-form-item label="调整类型" name="adjustType">
          <a-radio-group v-model:value="stockForm.adjustType">
            <a-radio value="in">入库</a-radio>
            <a-radio value="out">出库</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="stockForm.remark" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 库存记录弹窗 -->
    <StockHistoryModal
      :visible="historyModalVisible"
      type="soft_contact"
      :product-id="currentProduct?.id"
      :detail="currentProduct ? `${currentProduct.name}/${currentProduct.sphere}/${currentProduct.batchNumber}` : ''"
      :category="'soft_contact'"
      @update:visible="(val) => historyModalVisible = val"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { adjustStock, getStockHistory } from '@/utils/stockManager';
import StockHistoryModal from './StockHistoryModal.vue';

// 状态变量
const isLoading = ref(false);
const stockModalVisible = ref(false);
const addModalVisible = ref(false);
const historyModalVisible = ref(false);
const inventoryData = ref([]);
const currentProduct = ref(null);
const stockForm = ref({
  currentStock: 0,
  adjustAmount: 0,
  adjustType: 'in',
  remark: ''
});
const stockFormRef = ref(null);

// 分页相关
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: false,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`
});

// 搜索表单
const searchForm = ref({
  name: '',
  type: undefined,
  sphere: null
});

// 表格列定义
const columns = [
  { 
    title: '序号', 
    key: 'index',
    width: 80,
    customRender: ({ index }) => index + 1 + (pagination.value.current - 1) * pagination.value.pageSize
  },
  { title: '品名', dataIndex: 'name', key: 'name' },
  { 
    title: '类型', 
    dataIndex: 'type', 
    key: 'type',
    customRender: ({ text }) => {
      const typeMap = {
        daily: '日抛',
        weekly: '周抛',
        monthly: '月抛',
        quarterly: '季抛',
        yearly: '年抛'
      };
      return typeMap[text] || text;
    }
  },
  { 
    title: '球镜度数', 
    dataIndex: 'sphere', 
    key: 'sphere',
    customRender: ({ text }) => {
      const num = Number(text);
      return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
    }
  },
  { title: '生产日期', dataIndex: 'productionDate', key: 'productionDate' },
  { title: '到期日期', dataIndex: 'expiryDate', key: 'expiryDate' },
  { title: '批号', dataIndex: 'batchNumber', key: 'batchNumber' },
  { title: '销售价格', dataIndex: 'salePrice', key: 'salePrice', customRender: ({ text }) => (text != null && text !== '' ? Number(text).toFixed(1) : '—') },
  { title: '当前库存', dataIndex: 'currentStock', key: 'currentStock' },
  { title: '操作', key: 'action' }
];

// 表单验证规则
const stockRules = {
  adjustAmount: [{ required: true, message: '请输入调整数量' }],
  adjustType: [{ required: true, message: '请选择调整类型' }]
};

// 新增条目相关
const addSubmitting = ref(false);
const addFormRef = ref(null);
const addForm = ref({
  productId: undefined,
  type: undefined,
  sphere: null,
  productionDate: null,
  expiryDate: null,
  batchNumber: '',
  currentStock: 0
});

// 新增表单验证规则
const addFormRules = {
  productId: [{ required: true, message: '请选择产品' }],
  type: [{ required: true, message: '请选择类型' }],
  sphere: [{ required: true, message: '请输入球镜度数' }],
  productionDate: [{ required: true, message: '请选择生产日期' }],
  expiryDate: [{ required: true, message: '请选择到期日期' }],
  batchNumber: [{ required: true, message: '请输入批号' }],
  currentStock: [{ required: true, message: '请输入库存数量' }]
};

// 产品选项
const productOptions = computed(() => {
  const products = getProductData();
  return products
    .filter(p => p.category === 'soft_contact')
    .map(p => ({
      label: p.name,
      value: p.id
    }));
});

// 获取软镜数据
const fetchSoftContactData = async () => {
  try {
    isLoading.value = true;
    const organization_id = localStorage.getItem('organization_id');
    if (!organization_id) {
      message.error('未找到机构ID');
      return;
    }
    const requestData = { organization_id };
    if (searchForm.value.name) requestData.name = searchForm.value.name;
    if (searchForm.value.type) requestData.type = searchForm.value.type;
    if (searchForm.value.sphere) requestData.sphere = searchForm.value.sphere;
    const response = await fetch('https://aiforoptometry.com/softcontact/list/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken'),
        'X-Organization-ID': organization_id
      },
      body: JSON.stringify(requestData),
      credentials: 'include'
    });
    const result = await response.json();
    if (result.code === 200 && result.data) {
      const productData = getProductData();
      const frontendData = result.data.items.map(item => {
        const product = productData.find(p => p.id === item.product);
        return {
          id: item.id,
          productid: item.product,
          name: product ? product.name : item.name,
          type: item.type,
          sphere: item.sphere,
          productionDate: item.production_date,
          expiryDate: item.expiry_date,
          batchNumber: item.batch_number,
          currentStock: Math.floor(item.current_stock),
          salePrice: product ? Number(product.salePrice) : 0,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          organization: item.organization
        };
      });
      localStorage.setItem('softcontactdata', JSON.stringify(frontendData));
      inventoryData.value = frontendData;
      pagination.value.total = result.data.total;
    } else {
      throw new Error(result.message || '获取软镜数据失败');
    }
  } catch (error) {
    message.error('获取软镜数据失败');
    console.error('获取软镜数据失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 从localStorage获取软镜数据
const getSoftContactData = () => {
  const softContactData = localStorage.getItem('softcontactdata');
  return softContactData ? JSON.parse(softContactData) : [];
};

// 从localStorage获取产品名录数据
const getProductData = () => {
  const productData = localStorage.getItem('ProductModaldata');
  return productData ? JSON.parse(productData) : [];
};

// 合并软镜和产品数据
const mergeSoftContactAndProductData = () => {
  const softContactData = inventoryData.value;
  const productData = getProductData();
  
  return softContactData.map(softContact => {
    const product = productData.find(p => p.id === softContact.productid);
    return {
      ...softContact,
      name: product ? product.name : '未知产品',
      salePrice: product ? Number(product.salePrice) : 0,
      currentStock: Math.floor(softContact.currentStock),
      // 保证id字段存在且为softcontactdata的id
    };
  });
};

// 过滤后的库存数据
const filteredInventory = computed(() => {
  let data = mergeSoftContactAndProductData();
  
  if (searchForm.value.name) {
    data = data.filter(item => 
      item.name.toLowerCase().includes(searchForm.value.name.toLowerCase())
    );
  }

  if (searchForm.value.type) {
    data = data.filter(item => 
      item.type === searchForm.value.type
    );
  }

  if (searchForm.value.sphere) {
    data = data.filter(item => 
      Number(item.sphere) === Number(searchForm.value.sphere)
    );
  }

  pagination.value.total = data.length;
  
  const start = (pagination.value.current - 1) * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return data.slice(start, end);
});

// 处理分页变化
const handleTableChange = (pag) => {
  pagination.value.current = pag.current;
};

// 方法定义
const showStockModal = (record) => {
  // record.id 必须是softcontactdata的id
  currentProduct.value = record;
  stockForm.value = {
    currentStock: record.currentStock,
    adjustAmount: 0,
    adjustType: 'in',
    remark: ''
  };
  stockModalVisible.value = true;
};

const showHistoryModal = (record) => {
  // record.id 必须是softcontactdata的id
  currentProduct.value = record;
  historyModalVisible.value = true;
  
  // 创建包含球镜度数的详情
  const detail = `${record.name}/${record.sphere}/${record.batchNumber}`;
  console.log('Setting history modal detail with sphere:', detail);
};

const handleStockAdjust = async () => {
  try {
    if (!stockFormRef.value) throw new Error('表单引用未定义');
    await stockFormRef.value.validate();
    if (!currentProduct.value) throw new Error('未选择产品');
    const organization_id = localStorage.getItem('organization_id');
    if (!organization_id) {
      message.error('未找到机构ID');
      return;
    }
    const now = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    const { adjustType, adjustAmount, remark } = stockForm.value;
    const apiUrl = adjustType === 'in'
      ? `https://aiforoptometry.com/softcontact/in/${currentProduct.value.id}/`
      : `https://aiforoptometry.com/softcontact/out/${currentProduct.value.id}/`;
    const requestData = {
      adjustAmount: Number(adjustAmount),
      operator: localStorage.getItem('username') || 'admin',
      remark: remark || (adjustType === 'in' ? '软镜入库' : '软镜出库'),
      created_at: now
    };
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken'),
        'X-Organization-ID': organization_id
      },
      body: JSON.stringify(requestData),
      credentials: 'include'
    });
    const result = await response.json();
    if (result.code === 200) {
      await fetchSoftContactData();
      message.success('库存调整成功');
      stockModalVisible.value = false;
    } else {
      throw new Error(result.message || '库存调整失败');
    }
  } catch (error) {
    message.error(error.message || '库存调整失败');
    console.error('库存调整失败:', error);
  }
};

// 显示新增弹窗
const showAddModal = () => {
  addForm.value = {
    productId: undefined,
    type: undefined,
    sphere: null,
    productionDate: null,
    expiryDate: null,
    batchNumber: '',
    currentStock: 0
  };
  addModalVisible.value = true;
};

// 处理新增提交
const handleAddSubmit = async () => {
  try {
    await addFormRef.value.validate();
    addSubmitting.value = true;
    const organization_id = localStorage.getItem('organization_id');
    if (!organization_id) {
      message.error('未找到机构ID');
      return;
    }
    const now = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    const requestData = {
      organization_id,
      product_id: addForm.value.productId,
      type: addForm.value.type,
      sphere: addForm.value.sphere,
      production_date: addForm.value.productionDate.format('YYYY-MM-DD'),
      expiry_date: addForm.value.expiryDate.format('YYYY-MM-DD'),
      batch_number: addForm.value.batchNumber,
      current_stock: Math.floor(addForm.value.currentStock),
      operator: localStorage.getItem('username') || 'admin',
      created_at: now,
      updated_at: now
    };
    const response = await fetch('https://aiforoptometry.com/inventory/soft_contact/add/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken'),
        'X-Organization-ID': organization_id
      },
      body: JSON.stringify(requestData),
      credentials: 'include'
    });
    const result = await response.json();
    if (result.code === 201) {
      await fetchSoftContactData();
      message.success('新增成功');
      addModalVisible.value = false;
    } else {
      throw new Error(result.message || '新增失败');
    }
  } catch (error) {
    if (error.errorFields) {
      message.error('请填写完整信息');
    } else {
      message.error(error.message || '操作失败');
      console.error('操作失败:', error);
    }
  } finally {
    addSubmitting.value = false;
  }
};

// 软删除
const deleteSoftContactInventory = async (id) => {
  try {
    const organization_id = localStorage.getItem('organization_id');
    if (!organization_id) {
      message.error('未找到机构ID');
      return;
    }
    const response = await fetch(`https://aiforoptometry.com/softcontact/delete/${id}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken'),
        'X-Organization-ID': organization_id
      },
      body: JSON.stringify({ id }),
      credentials: 'include'
    });
    const result = await response.json();
    if (result.code === 200) {
      await fetchSoftContactData();
      message.success('删除成功');
    } else {
      throw new Error(result.message || '删除失败');
    }
  } catch (error) {
    message.error(error.message || '删除失败');
    console.error('删除失败:', error);
  }
};

// 组件挂载时加载数据
onMounted(async () => {
  await fetchSoftContactData();
});

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已通过计算属性实现
};

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    name: '',
    type: undefined,
    sphere: null
  };
};

// 禁用生产日期（不能选择未来日期）
const disabledProductionDate = (current) => {
  return current && current > dayjs().endOf('day');
};

// 禁用到期日期（不能选择早于生产日期）
const disabledExpiryDate = (current) => {
  return current && addForm.value.productionDate && current < addForm.value.productionDate;
};
</script>

<style scoped>
.soft-contact-inventory {
  width: 100%;
}

.search-bar {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.search-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.action-buttons {
  display: flex;
  align-items: center;
}

.tab-content {
  min-height: 570px;
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  padding-right: 8px;
}

.tab-content::-webkit-scrollbar {
  width: 6px;
}

.tab-content::-webkit-scrollbar-thumb {
  background-color: #d9d9d9;
  border-radius: 3px;
}

.tab-content::-webkit-scrollbar-track {
  background-color: #f5f5f5;
}

.tab-content :deep(.ant-table-tbody > tr > td),
.tab-content :deep(.ant-table-thead > tr > th) {
  height: 56px !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}
</style> 