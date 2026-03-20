<template>
  <div class="frame-inventory">
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
          <a-form-item label="销售价格">
            <a-input-number
              v-model:value="searchForm.salePrice"
              placeholder="请输入销售价格"
              :min="0"
              :precision="1"
              allowClear
              @change="handleSearch"
            />
          </a-form-item>
          <a-form-item label="材质">
            <a-select
              v-model:value="searchForm.material"
              placeholder="请选择材质"
              allowClear
              @change="handleSearch"
            >
              <a-select-option value="titanium">钛</a-select-option>
              <a-select-option value="alloy">合金</a-select-option>
              <a-select-option value="tr">TR</a-select-option>

            </a-select>
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
                @confirm="deleteFrameInventory(record.id)"
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
      title="新增镜架条目"
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
            show-search
            :filterOption="filterProductOption"
            :field-names="{ label: 'label', value: 'value' }"
            :dropdownMatchSelectWidth="false"
          >
            <template #option="option">
              <span>{{ option.label }}</span>
            </template>
          </a-select>
        </a-form-item>
        <a-form-item label="型号" name="model">
          <a-input
            v-model:value="addForm.model"
            placeholder="请输入型号"
          />
        </a-form-item>
        <a-form-item label="材质" name="material">
          <a-select v-model:value="addForm.material" placeholder="请选择材质">
            <a-select-option value="titanium">钛</a-select-option>
            <a-select-option value="alloy">合金</a-select-option>
            <a-select-option value="tr">TR</a-select-option>

          </a-select>
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
          <a-input-number v-model:value="stockForm.adjustAmount" :min="1" />
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
      type="frame"
      :product-id="currentProduct?.id"
      :detail="currentProduct ? `${currentProduct.name}/${currentProduct.model}` : ''"
      :category="'frame'"
      @update:visible="(val) => historyModalVisible = val"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
  name: '',
  salePrice: undefined,
  material: undefined
});

// 材质映射表
const materialMap = {
  titanium: '钛',
  alloy: '合金',
  tr: 'TR',
  metal: '金属',
  plastic: '塑料',
  carbon: '碳纤维'
};

// 表格列定义
const columns = [
  { 
    title: '序号', 
    key: 'index',
    width: 80,
    customRender: ({ index }) => index + 1 + (pagination.value.current - 1) * pagination.value.pageSize
  },
  { title: '品名', dataIndex: 'name', key: 'name' },
  { title: '型号', dataIndex: 'model', key: 'model' },
  {
    title: '材质',
    dataIndex: 'material',
    key: 'material',
    customRender: ({ text }) => materialMap[text] || text
  },
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
  model: '',
  material: undefined,
  currentStock: 0
});

// 新增表单验证规则
const addFormRules = {
  productId: [{ required: true, message: '请选择产品' }],
  model: [{ required: true, message: '请输入型号' }],
  material: [{ required: true, message: '请选择材质' }],
  currentStock: [{ required: true, message: '请输入库存数量' }]
};

// 产品选项
const productOptions = computed(() => {
  const products = getProductData();
  const suppliers = JSON.parse(localStorage.getItem('SupplierModaldata') || '[]');
  
  return products
    .filter(p => p.category === 'frame')
    .map(p => {
      const supplier = suppliers.find(s => String(s.id) === String(p.supplierId));
      return {
        label: `${p.name} - ${p.model || ''} - ${p.material || ''} - ￥${p.salePrice || 0} - ${supplier?.name || '未知供应商'}`,
        value: p.id,
        supplierName: supplier?.name,
        model: p.model,
        material: p.material,
        salePrice: p.salePrice
      };
    });
});

// 获取北京时间
const getBeijingTime = () => {
  const now = new Date();
  // 获取北京时间（UTC+8）
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijingTime.toISOString();
};

// 获取镜架数据
const fetchFrameData = async () => {
  try {
    isLoading.value = true;
    
    // 从localStorage获取缓存数据
    const cachedData = getFrameData();
    inventoryData.value = cachedData;
    
    // 获取组织ID
    const organization_id = localStorage.getItem('organization_id');
    if (!organization_id) {
      message.error('未找到机构ID');
      return;
    }

    // 构造请求数据
    const requestData = {
      organization_id: organization_id
    };

    // 添加可选的筛选条件
    if (searchForm.value.name) requestData.name = searchForm.value.name;
    if (searchForm.value.salePrice !== undefined) requestData.salePrice = searchForm.value.salePrice;
    if (searchForm.value.material) requestData.material = searchForm.value.material;

    // 请求后端数据
    const response = await fetch('https://aiforoptometry.com/inventory/list/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken'),
        'X-Organization-ID': organization_id
      },
      body: JSON.stringify(requestData),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.code === 200 && result.data) {
      // 通过产品ID补全销售价格
      const productData = getProductData();
      const frontendData = result.data.items.map(item => {
        const product = productData.find(p => p.id === item.product);
        return {
          id: item.id,
          productid: item.product,
          name: item.name,
          model: item.model,
          material: item.material,
          currentStock: Math.floor(item.current_stock),
          salePrice: product ? Number(product.salePrice) : 0,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          organization: item.organization
        };
      });
      
      // 更新localStorage
      localStorage.setItem('framedata', JSON.stringify(frontendData));
      
      // 更新页面数据
      inventoryData.value = frontendData;
      pagination.value.total = result.data.total;
    } else {
      throw new Error(result.message || '获取镜架数据失败');
    }
  } catch (error) {
    message.error('获取镜架数据失败');
    console.error('获取镜架数据失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 从localStorage获取镜架数据
const getFrameData = () => {
  const frameData = localStorage.getItem('framedata');
  return frameData ? JSON.parse(frameData) : [];
};

// 从localStorage获取产品名录数据
const getProductData = () => {
  const productData = localStorage.getItem('ProductModaldata');
  return productData ? JSON.parse(productData) : [];
};

// 合并镜架和产品数据
const mergeFrameAndProductData = () => {
  const frameData = inventoryData.value;
  const productData = getProductData();
  
  return frameData.map(frame => {
    const product = productData.find(p => p.id === frame.productid);
    return {
      ...frame,
      name: product ? product.name : '未知产品',
      model: frame.model || (product ? product.model : ''),
      material: frame.material || (product ? product.material : '未知材质'),
      salePrice: product ? Number(product.salePrice) : 0,
      currentStock: Math.floor(frame.currentStock)
    };
  });
};

// 过滤后的库存数据
const filteredInventory = computed(() => {
  let data = mergeFrameAndProductData();
  
  if (searchForm.value.name) {
    data = data.filter(item => 
      item.name.toLowerCase().includes(searchForm.value.name.toLowerCase())
    );
  }
  
  if (searchForm.value.salePrice !== undefined && searchForm.value.salePrice !== null) {
    data = data.filter(item => 
      Number(item.salePrice) === Number(searchForm.value.salePrice)
    );
  }
  
  if (searchForm.value.material) {
    data = data.filter(item => 
      item.material === searchForm.value.material
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
};

// 处理库存调整
const handleStockAdjust = async () => {
  try {
    // 验证表单
    if (!stockFormRef.value) {
      throw new Error('表单引用未定义');
    }
    await stockFormRef.value.validate();
    
    const { adjustType, adjustAmount, remark } = stockForm.value;
    if (!currentProduct.value) {
      throw new Error('未选择产品');
    }

    const organization_id = localStorage.getItem('organization_id');
    if (!organization_id) {
      message.error('未找到机构ID');
      return;
    }

    // 获取北京时间
    const now = getBeijingTime();

    // 构造请求数据
    const requestData = {
      adjustAmount: Number(adjustAmount),
      operator: localStorage.getItem('username') || 'admin',
      remark: remark || '库存调整',
      created_at: now
    };

    // 根据调整类型选择API
    const apiUrl = adjustType === 'in' 
      ? `https://aiforoptometry.com/frameinventory/in/${currentProduct.value.id}/`
      : `https://aiforoptometry.com/frameinventory/out/${currentProduct.value.id}/`;

    // 调用后端API
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
      // 更新本地缓存
      const currentData = getFrameData();
      const item = currentData.find(item => item.id === currentProduct.value.id);
      if (item) {
        item.currentStock = result.data.current_stock;
        item.updated_at = now;
        localStorage.setItem('framedata', JSON.stringify(currentData));
      }

      message.success('库存调整成功');
      stockModalVisible.value = false;
      inventoryData.value = currentData;
    } else {
      throw new Error(result.message || '库存调整失败');
    }
  } catch (error) {
    console.error('库存调整失败:', error);
    message.error(error.message || '库存调整失败');
  }
};

// 显示新增弹窗
const showAddModal = () => {
  addForm.value = {
    productId: undefined,
    model: '',
    material: undefined,
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

    // 获取北京时间
    const now = getBeijingTime();

    const requestData = {
      organization_id,
      product_id: addForm.value.productId,
      model: addForm.value.model,
      material: addForm.value.material,
      current_stock: Math.floor(addForm.value.currentStock),
      operator: localStorage.getItem('username') || 'admin',
      created_at: now,
      updated_at: now
    };

    // 调用后端API
    const response = await fetch('https://aiforoptometry.com/inventory/add/', {
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
      // 后端成功后再更新本地缓存
      const currentData = getFrameData();
      const newItem = {
        id: result.data.id,
        productid: addForm.value.productId,
        name: result.data.name,
        model: addForm.value.model,
        material: addForm.value.material,
        currentStock: Math.floor(addForm.value.currentStock),
        salePrice: result.data.salePrice,
        createdAt: now,
        updatedAt: now,
        organization: result.data.organization
      };
      currentData.push(newItem);
      localStorage.setItem('framedata', JSON.stringify(currentData));
      
      message.success('新增成功');
      addModalVisible.value = false;
      inventoryData.value = currentData;
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

// 组件挂载时加载数据
onMounted(async () => {
  await fetchFrameData();
  // 初始化状态
  historyModalVisible.value = false;
  currentProduct.value = null;
});

// 添加定时刷新功能
const refreshInterval = 5 * 60 * 1000; // 5分钟刷新一次
let refreshTimer = null;

onMounted(() => {
  // 初始加载数据
  fetchFrameData();
  
  // 设置定时刷新
  refreshTimer = setInterval(() => {
    fetchFrameData();
  }, refreshInterval);
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已通过计算属性实现
};

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    name: '',
    salePrice: undefined,
    material: undefined
  };
};

// 支持模糊搜索
const filterProductOption = (input, option) => {
  const searchText = input.toLowerCase();
  const optionText = option.label.toLowerCase();
  return optionText.includes(searchText);
};

// 删除库存（软删除）
const deleteFrameInventory = async (id) => {
  try {
    const organization_id = localStorage.getItem('organization_id');
    if (!organization_id) {
      message.error('未找到机构ID');
      return;
    }
    // 调用后端API
    const response = await fetch(`https://aiforoptometry.com/inventory/delete/${id}/`, {
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
      // 后端成功后再更新本地缓存
      const currentData = getFrameData();
      const index = currentData.findIndex(item => item.id === id);
      if (index !== -1) {
        currentData.splice(index, 1);
        localStorage.setItem('framedata', JSON.stringify(currentData));
      }
      message.success('删除成功');
      inventoryData.value = currentData;
    } else {
      throw new Error(result.message || '删除失败');
    }
  } catch (error) {
    console.error('删除失败:', error);
    message.error(error.message || '删除失败');
  }
};
</script>

<style scoped>
.frame-inventory {
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