<template>
  <div class="accessory-inventory">
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
                @confirm="deleteAccessoryInventory(record.id)"
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
      title="新增配件条目"
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
        <a-form-item label="生产日期" name="productionDate">
          <a-date-picker
            v-model:value="addForm.productionDate"
            placeholder="请选择生产日期"
          />
        </a-form-item>
        <a-form-item label="到期日期" name="expiryDate">
          <a-date-picker
            v-model:value="addForm.expiryDate"
            placeholder="请选择到期日期"
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
      type="non_medical"
      :product-id="currentProduct?.id"
      :detail="currentProduct ? `${currentProduct.name}+${currentProduct.salePrice}` : ''"
      :category="'non_medical'"
      @update:visible="(val) => historyModalVisible = val"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { adjustStock, getStockHistory } from '@/utils/stockManager';
import StockHistoryModal from './StockHistoryModal.vue';

// 状态变量
const isLoading = ref(false);
const stockModalVisible = ref(false);
const stockFormRef = ref(null);
const stockForm = ref({
  currentStock: 0,
  adjustAmount: 0,
  adjustType: 'in',
  remark: ''
});
const addModalVisible = ref(false);
const historyModalVisible = ref(false);
const inventoryData = ref([]);
const currentProduct = ref(null);

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
  name: ''
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
  { title: '生产日期', dataIndex: 'productionDate', key: 'productionDate' },
  { title: '到期日期', dataIndex: 'expiryDate', key: 'expiryDate' },
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
  productionDate: null,
  expiryDate: null,
  currentStock: 0
});

// 新增表单验证规则
const addFormRules = {
  productId: [{ required: true, message: '请选择产品' }],
  currentStock: [{ required: true, message: '请输入库存数量' }]
};

// 产品选项
const productOptions = computed(() => {
  const products = getProductData();
  return products
    .filter(p => p.category === 'non_medical')
    .map(p => ({
      label: p.name,
      value: p.id
    }));
});

// 获取配件数据
const fetchAccessoryData = async () => {
  try {
    isLoading.value = true;
    const organization_id = localStorage.getItem('organization_id');
    if (!organization_id) {
      message.error('未找到机构ID');
      return;
    }
    const requestData = { organization_id };
    if (searchForm.value.name) requestData.name = searchForm.value.name;
    
    const response = await fetch('https://aiforoptometry.com/accessory/list/', {
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
          productionDate: item.production_date,
          expiryDate: item.expiry_date,
          currentStock: Math.floor(item.current_stock),
          salePrice: product ? Number(product.salePrice) : 0,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          organization: item.organization
        };
      });
      localStorage.setItem('accessorydata', JSON.stringify(frontendData));
      inventoryData.value = frontendData;
      pagination.value.total = result.data.total;
    } else {
      throw new Error(result.message || '获取配件数据失败');
    }
  } catch (error) {
    message.error('获取配件数据失败');
    console.error('获取配件数据失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 从localStorage获取配件数据
const getAccessoryData = () => {
  const accessoryData = localStorage.getItem('accessorydata');
  return accessoryData ? JSON.parse(accessoryData) : [];
};

// 从localStorage获取产品名录数据
const getProductData = () => {
  const productData = localStorage.getItem('ProductModaldata');
  return productData ? JSON.parse(productData) : [];
};

// 合并配件和产品数据
const mergeAccessoryAndProductData = () => {
  const accessoryData = inventoryData.value;
  const productData = getProductData();
  
  return accessoryData.map(accessory => {
    const product = productData.find(p => p.id === accessory.productid);
    return {
      ...accessory,
      name: product ? product.name : '未知产品',
      salePrice: product ? Number(product.salePrice) : 0,
      currentStock: Math.floor(accessory.currentStock)
    };
  });
};

// 过滤后的库存数据
const filteredInventory = computed(() => {
  let data = mergeAccessoryAndProductData();
  
  if (searchForm.value.name) {
    data = data.filter(item => 
      item.name.toLowerCase().includes(searchForm.value.name.toLowerCase())
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
  currentProduct.value = record;
  stockForm.value = {
    currentStock: record.currentStock,
    adjustAmount: 0,
    adjustType: 'in',
    remark: ''
  };
  stockModalVisible.value = true;
};

// 查看库存记录
const showHistoryModal = (record) => {
  console.log('Opening history modal for:', record);
  currentProduct.value = record;
  historyModalVisible.value = true;
  // 传递必要信息给StockHistoryModal
  const detail = record.name + '+' + record.salePrice;
  emit('update:detail', detail);
  emit('update:category', 'non_medical');
};

// 处理库存调整
const handleStockAdjust = async () => {
  try {
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
      ? `https://aiforoptometry.com/accessory/in/${currentProduct.value.id}/`
      : `https://aiforoptometry.com/accessory/out/${currentProduct.value.id}/`;
    const requestData = {
      adjustAmount: Number(adjustAmount),
      operator: localStorage.getItem('username') || 'admin',
      remark: remark || (adjustType === 'in' ? '配件入库' : '配件出库'),
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
      await fetchAccessoryData();
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
    productionDate: null,
    expiryDate: null,
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
      current_stock: Math.floor(addForm.value.currentStock),
      operator: localStorage.getItem('username') || 'admin',
      created_at: now,
      updated_at: now
    };
    const response = await fetch('https://aiforoptometry.com/inventory/accessory/add/', {
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
      await fetchAccessoryData();
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

// 删除配件库存
const deleteAccessoryInventory = async (id) => {
  try {
    const organization_id = localStorage.getItem('organization_id');
    if (!organization_id) {
      message.error('未找到机构ID');
      return;
    }
    const response = await fetch(`https://aiforoptometry.com/accessory/delete/${id}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken'),
        'X-Organization-ID': organization_id
      },
      credentials: 'include'
    });
    const result = await response.json();
    if (result.code === 200) {
      await fetchAccessoryData();
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
  await fetchAccessoryData();
});

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已通过计算属性实现
};

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    name: ''
  };
};
</script>

<style scoped>
.accessory-inventory {
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