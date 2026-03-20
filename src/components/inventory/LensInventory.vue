<template>
  <div class="lens-inventory">
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
          <a-form-item label="柱镜度数">
            <a-input-number
              v-model:value="searchForm.cylinder"
              placeholder="请输入柱镜度数"
              :precision="2"
              :step="0.25"
              allowClear
              @change="handleSearch"
            />
          </a-form-item>
          <a-form-item label="销售价格">
<a-input-number
            v-model:value="searchForm.salePrice"
            placeholder="请输入销售价格"
            :precision="1"
            :step="10"
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
          <a-button style="margin-left: 8px" @click="showGridView">
            <template #icon><table-outlined /></template>
            表格查看
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
                @confirm="deleteLensInventory(record.id)"
                okText="确定"
                cancelText="取消"
              >
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
          <template v-else-if="column.key === 'sphere'">
            {{ record.sphere > 0 ? '+' + record.sphere.toFixed(2) : record.sphere.toFixed(2) }}
          </template>
          <template v-else-if="column.key === 'cylinder'">
            {{ record.cylinder > 0 ? '+' + record.cylinder.toFixed(2) : record.cylinder.toFixed(2) }}
          </template>
          <template v-else-if="column.key === 'salePrice'">
            {{ record.salePrice != null && record.salePrice !== '' ? Number(record.salePrice).toFixed(1) : '—' }}
          </template>
          <template v-else-if="column.key === 'currentStock'">
            {{ Math.floor(record.currentStock) }}
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增条目弹窗 -->
    <a-modal
      v-model:visible="addModalVisible"
      title="新增镜片条目"
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
        <a-form-item label="球镜度数" name="sphere">
          <a-input-number
            v-model:value="addForm.sphere"
            placeholder="请输入球镜度数"
            :precision="2"
            :step="0.25"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="柱镜度数" name="cylinder">
          <a-input-number
            v-model:value="addForm.cylinder"
            placeholder="请输入柱镜度数"
            :precision="2"
            :step="0.25"
            style="width: 100%"
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

    <!-- 表格查看弹窗 -->
    <a-modal
      v-model:visible="gridModalVisible"
      title="库存表格查看"
      width="80%"
      :footer="null"
    >
      <div class="grid-view-container">
        <div class="product-selector">
          <a-select
            v-model:value="selectedProductId"
            style="width: 300px"
            placeholder="请选择镜片品名"
            @change="handleProductChange"
          >
            <a-select-option 
              v-for="option in uniqueProductOptions" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
          <a-button 
            v-if="!isEditing" 
            type="primary" 
            style="margin-left: 16px"
            @click="startEditing"
          >
            批量录入
          </a-button>
          <div v-else class="edit-actions">
            <a-button type="primary" @click="handleSubmit">
              提交
            </a-button>
            <a-button style="margin-left: 8px" @click="cancelEditing">
              取消
            </a-button>
          </div>
        </div>
        
        <div class="grid-container" v-if="selectedProductId">
          <!-- 默认光度范围外的库存显示 -->
          <div v-if="getOutOfRangeStock.length > 0" class="out-of-range-stock">
            <h4>默认光度范围外的库存：</h4>
            <div class="out-of-range-list">
              <div v-for="item in getOutOfRangeStock" :key="`${item.sphere}-${item.cylinder}`" class="out-of-range-item">
                <span>球镜: {{ item.sphere > 0 ? '+' + item.sphere.toFixed(2) : item.sphere.toFixed(2) }}</span>
                <span>柱镜: {{ item.cylinder > 0 ? '+' + item.cylinder.toFixed(2) : item.cylinder.toFixed(2) }}</span>
                <span>库存: {{ item.stock }}</span>
              </div>
            </div>
          </div>

          <div class="grid-header">
            <div class="corner-cell">
              <div class="diagonal-line"></div>
              <div class="corner-text sphere-text">球镜</div>
              <div class="corner-text cylinder-text">柱镜</div>
            </div>
            <div 
              v-for="cylinder in cylinderValues" 
              :key="cylinder" 
              class="header-cell"
            >
              {{ cylinder > 0 ? '+' + cylinder.toFixed(2) : cylinder.toFixed(2) }}
            </div>
          </div>
          <div class="grid-body">
            <div 
              v-for="sphere in sphereValues" 
              :key="sphere" 
              class="grid-row"
            >
              <div class="row-header">
                {{ sphere > 0 ? '+' + sphere.toFixed(2) : sphere.toFixed(2) }}
              </div>
              <div 
                v-for="cylinder in cylinderValues" 
                :key="cylinder" 
                class="grid-cell"
                :class="{ 
                  'has-stock': getStockCount(sphere, cylinder) > 0,
                  'editing': isEditing,
                  'selected': isEditing && selectedCell === `${sphere}_${cylinder}`
                }"
                @click="isEditing && handleCellClick(sphere, cylinder)"
              >
                <template v-if="isEditing">
                  <a-input-number
                    v-model:value="editData[`${sphere}_${cylinder}`]"
                    :min="0"
                    :precision="0"
                    size="small"
                    style="width: 100%"
                    @change="handleCellChange(sphere, cylinder, $event)"
                    @focus="handleCellClick(sphere, cylinder)"
                  />
                </template>
                <template v-else>
                  {{ getStockCount(sphere, cylinder) }}
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 库存记录弹窗 -->
    <StockHistoryModal
      :visible="historyModalVisible"
      type="lens"
      :product-id="currentProduct?.id"
      :detail="currentProduct ? `${currentProduct.name}/${currentProduct.sphere}/${currentProduct.cylinder}` : ''"
      :category="'lens'"
      @update:visible="(val) => historyModalVisible = val"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, TableOutlined } from '@ant-design/icons-vue';
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
  sphere: null,
  cylinder: null,
  salePrice: null
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
    title: '球镜度数', 
    dataIndex: 'sphere', 
    key: 'sphere'
  },
  { 
    title: '柱镜度数', 
    dataIndex: 'cylinder', 
    key: 'cylinder'
  },
  { 
    title: '销售价格', 
    dataIndex: 'salePrice', 
    key: 'salePrice',
    customRender: ({ text }) => (text != null && text !== '' ? Number(text).toFixed(1) : '—')
  },
  { 
    title: '当前库存', 
    dataIndex: 'currentStock', 
    key: 'currentStock'
  },
  { 
    title: '操作', 
    key: 'action',
    width: 200
  }
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
  sphere: null,
  cylinder: null,
  currentStock: 0
});

// 新增表单验证规则
const addFormRules = {
  productId: [{ required: true, message: '请选择产品' }],
  sphere: [{ required: true, message: '请输入球镜度数' }],
  cylinder: [{ required: true, message: '请输入柱镜度数' }],
  currentStock: [{ required: true, message: '请输入库存数量' }]
};

// 产品选项
const productOptions = computed(() => {
  const products = getProductData();
  return products
    .filter(p => p.category === 'lens')
    .map(p => ({
      label: p.name,
      value: p.id
    }));
});

// 获取镜片数据
const fetchLensData = async () => {
  try {
    isLoading.value = true;
    
    // 从localStorage获取缓存数据
    const cachedData = getLensData();
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
    if (searchForm.value.sphere !== null) requestData.sphere = searchForm.value.sphere;
    if (searchForm.value.cylinder !== null) requestData.cylinder = searchForm.value.cylinder;
    if (searchForm.value.salePrice !== null) requestData.salePrice = searchForm.value.salePrice;

    // 请求后端数据
    const response = await fetch('https://aiforoptometry.com/inventory/lens/list/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken')
      },
      body: JSON.stringify(requestData),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.code === 200 && result.data) {
      // 将后端数据转换为前端格式
      const frontendData = result.data.items.map(item => ({
        id: item.id,
        productid: item.product,
        name: item.name,
        sphere: Number(item.sphere),
        cylinder: Number(item.cylinder),
        currentStock: Math.floor(item.current_stock),
        salePrice: Number(item.salePrice),  // 确保转换为数字
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        organization: item.organization
      }));
      
      // 更新localStorage
      localStorage.setItem('lensdata', JSON.stringify(frontendData));
      
      // 更新页面数据
      inventoryData.value = frontendData;
      pagination.value.total = result.data.total;
    } else {
      throw new Error(result.message || '获取镜片数据失败');
    }
  } catch (error) {
    message.error('获取镜片数据失败');
    console.error('获取镜片数据失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 从localStorage获取镜片数据
const getLensData = () => {
  const lensData = localStorage.getItem('lensdata');
  return lensData ? JSON.parse(lensData) : [];
};

// 从localStorage获取产品名录数据
const getProductData = () => {
  const productData = localStorage.getItem('ProductModaldata');
  return productData ? JSON.parse(productData) : [];
};

// 合并镜片和产品数据
const mergeLensAndProductData = () => {
  const lensData = inventoryData.value;
  const productData = getProductData();
  
  return lensData.map(lens => {
    const product = productData.find(p => p.id === lens.productid);
    const detail = product
      ? `${product.name}/${lens.sphere}/${lens.cylinder}`
      : `${lens.name}/${lens.sphere}/${lens.cylinder}`;
    return {
      ...lens,
      name: lens.name || (product ? product.name : '未知产品'),
      salePrice: Number(lens.salePrice) || (product ? Number(product.salePrice) : 0),  // 确保转换为数字
      sphere: Number(lens.sphere),
      cylinder: Number(lens.cylinder),
      currentStock: Math.floor(lens.currentStock),
      minStock: product ? product.minStock : 0,
      maxStock: product ? product.maxStock : 0,
      supplierName: product ? product.supplierName : '未知供应商',
      detail
    };
  });
};

// 过滤后的库存数据
const filteredInventory = computed(() => {
  let data = mergeLensAndProductData();
  
  if (searchForm.value.name) {
    // 支持汉字和数字分拆模糊
    const parts = searchForm.value.name.match(/[\u4e00-\u9fa5]+|[0-9.]+/g) || [];
    data = data.filter(item => {
      const name = item.name.toLowerCase();
      return parts.every(part => name.includes(part.toLowerCase()));
    });
  }
  
  if (searchForm.value.sphere !== null) {
    data = data.filter(item => 
      item.sphere === searchForm.value.sphere
    );
  }
  
  if (searchForm.value.cylinder !== null) {
    data = data.filter(item => 
      item.cylinder === searchForm.value.cylinder
    );
  }
  
  if (searchForm.value.salePrice !== null) {
    data = data.filter(item => 
      item.salePrice === searchForm.value.salePrice
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

const getBeijingTime = () => {
  const now = new Date();
  // 获取北京时间（UTC+8）
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijingTime.toISOString();
};

const handleStockAdjust = async () => {
  try {
    if (!stockFormRef.value) {
      throw new Error('表单引用未定义');
    }
    await stockFormRef.value.validate();
    
    const { adjustType, adjustAmount, remark } = stockForm.value;
    if (!currentProduct.value) {
      throw new Error('未选择产品');
    }

    // 获取北京时间
    const now = getBeijingTime();

    // 构造请求数据
    const requestData = {
      adjustAmount: Number(adjustAmount),
      operator: localStorage.getItem('username') || 'admin',
      id: currentProduct.value.id,
      remark: remark || '库存调整',
      created_at: now,
      updated_at: now
    };

    // 根据调整类型选择不同的接口
    const apiUrl = adjustType === 'in' 
      ? `https://aiforoptometry.com/lensinventory/in/${currentProduct.value.id}/`
      : `https://aiforoptometry.com/lensinventory/out/${currentProduct.value.id}/`;

    // 调用后端API
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken')
      },
      body: JSON.stringify(requestData),
      credentials: 'include'
    });

    const result = await response.json();
    
    if (result.code === 200) {
      // 更新本地缓存
      const currentData = getLensData();
      const item = currentData.find(item => item.id === currentProduct.value.id);
      if (item) {
        if (adjustType === 'in') {
          item.currentStock += Number(adjustAmount);
        } else {
          item.currentStock -= Number(adjustAmount);
        }
        // 更新时间字段
        item.updated_at = now;
        localStorage.setItem('lensdata', JSON.stringify(currentData));
      }

      // 生成库存记录
      const stockHistory = {
      productId: currentProduct.value.id,
        productName: currentProduct.value.name,
        sphere: currentProduct.value.sphere,
        cylinder: currentProduct.value.cylinder,
      adjustType,
      adjustAmount: Number(adjustAmount),
        beforeStock: adjustType === 'in' ? item.currentStock - Number(adjustAmount) : item.currentStock + Number(adjustAmount),
        afterStock: item.currentStock,
      remark,
        operator: requestData.operator,
        timestamp: now
      };

      // 保存到本地缓存
      const historyData = JSON.parse(localStorage.getItem('stockHistory') || '[]');
      historyData.push(stockHistory);
      localStorage.setItem('stockHistory', JSON.stringify(historyData));
      
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
    sphere: null,
    cylinder: null,
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
      organization_id: organization_id,
      product_id: addForm.value.productId,
      sphere: Number(addForm.value.sphere.toFixed(2)),
      cylinder: Number(addForm.value.cylinder.toFixed(2)),
      current_stock: Math.floor(addForm.value.currentStock),
      created_at: now,
      updated_at: now
    };

    // 先调用后端API
    const response = await fetch('https://aiforoptometry.com/lensinventory/add/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken')
      },
      body: JSON.stringify(requestData),
      credentials: 'include'
      });

    const result = await response.json();
    
    if (result.code === 201) {
      // 后端成功后再更新本地缓存
      const currentData = getLensData();
      const newItem = {
        id: result.data.id,
        productid: addForm.value.productId,
        name: result.data.name,
        sphere: Number(addForm.value.sphere.toFixed(2)),
        cylinder: Number(addForm.value.cylinder.toFixed(2)),
        currentStock: Math.floor(addForm.value.currentStock),
        salePrice: result.data.salePrice,
        createdAt: now,
        updatedAt: now,
        organization: result.data.organization
      };
      currentData.push(newItem);
      localStorage.setItem('lensdata', JSON.stringify(currentData));
      
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
  await fetchLensData();
  // 初始化状态
  historyModalVisible.value = false;
  currentProduct.value = null;
});

// 添加定时刷新功能
const refreshInterval = 5 * 60 * 1000; // 5分钟刷新一次
let refreshTimer = null;

onMounted(() => {
  // 初始加载数据
  fetchLensData();
  
  // 设置定时刷新
  refreshTimer = setInterval(() => {
    fetchLensData();
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
    sphere: null,
    cylinder: null,
    salePrice: null
  };
};

// 表格查看相关
const gridModalVisible = ref(false);
const selectedProductId = ref(null);

// 获取不重复的产品选项
const uniqueProductOptions = computed(() => {
  const products = getProductData();
  const uniqueProducts = new Map();
  
  products
    .filter(p => p.category === 'lens')
    .forEach(p => {
      if (!uniqueProducts.has(p.name)) {
        uniqueProducts.set(p.name, {
          label: p.name,
          value: p.id
        });
      }
    });
  
  return Array.from(uniqueProducts.values());
});

// 获取选中产品的所有球镜值
const sphereValues = computed(() => {
  const values = [];
  for (let i = 2.00; i >= -6.00; i -= 0.25) {
    values.push(Number(i.toFixed(2)));
  }
  return values;
});

// 获取选中产品的所有柱镜值
const cylinderValues = computed(() => {
  const values = [];
  for (let i = 0; i >= -3.00; i -= 0.25) {
    values.push(Number(i.toFixed(2)));
  }
  return values;
});

// 获取指定光度的库存数量
const getStockCount = (sphere, cylinder) => {
  if (!selectedProductId.value) return 0;
  
  const lensData = inventoryData.value;
  const item = lensData.find(item => 
    item.productid === selectedProductId.value &&
    Number(item.sphere.toFixed(2)) === Number(sphere.toFixed(2)) &&
    Number(item.cylinder.toFixed(2)) === Number(cylinder.toFixed(2))
  );
  
  return item ? Math.floor(item.currentStock) : 0;
};

// 获取默认光度范围外的库存
const getOutOfRangeStock = computed(() => {
  if (!selectedProductId.value) return [];
  
  const lensData = inventoryData.value;
  const sphereSet = new Set(sphereValues.value);
  const cylinderSet = new Set(cylinderValues.value);
  
  return lensData
    .filter(item => 
      item.productid === selectedProductId.value &&
      (!sphereSet.has(Number(item.sphere.toFixed(2))) || 
       !cylinderSet.has(Number(item.cylinder.toFixed(2))))
    )
    .map(item => ({
      sphere: Number(item.sphere.toFixed(2)),
      cylinder: Number(item.cylinder.toFixed(2)),
      stock: Math.floor(item.currentStock)
    }));
});

// 处理产品选择变化
const handleProductChange = (value) => {
  selectedProductId.value = value;
};

// 显示表格查看弹窗
const showGridView = () => {
  selectedProductId.value = null;
  gridModalVisible.value = true;
};

// 批量录入相关
const isEditing = ref(false);
const editData = ref({});
const originalData = ref({});
const selectedCell = ref('');

// 开始编辑
const startEditing = () => {
  originalData.value = {};
  editData.value = {};
  
  sphereValues.value.forEach(sphere => {
    cylinderValues.value.forEach(cylinder => {
      const key = `${sphere}_${cylinder}`;
      const stock = getStockCount(sphere, cylinder);
      originalData.value[key] = stock;
      editData.value[key] = stock;
    });
  });
  
  isEditing.value = true;
};

// 处理单元格点击
const handleCellClick = (sphere, cylinder) => {
  selectedCell.value = `${sphere}_${cylinder}`;
};

// 取消编辑
const cancelEditing = () => {
  isEditing.value = false;
  editData.value = {};
  originalData.value = {};
  selectedCell.value = '';
};

// 处理单元格数据变化
const handleCellChange = (sphere, cylinder, value) => {
  const key = `${sphere}_${cylinder}`;
  editData.value[key] = value;
};

// 提交编辑
const handleSubmit = async () => {
  try {
    const updates = [];
    Object.entries(editData.value).forEach(([key, value]) => {
      const [sphere, cylinder] = key.split('_').map(Number);
      const originalValue = originalData.value[key];
      if (value !== originalValue) {
        updates.push({
          productId: selectedProductId.value,
          sphere,
          cylinder,
          currentStock: value,
          originalStock: originalValue
        });
      }
    });

    if (updates.length === 0) {
      message.info('没有数据需要更新');
      cancelEditing();
      return;
    }

    const organization_id = localStorage.getItem('organization_id');
    if (!organization_id) {
      message.error('未找到机构ID');
      return;
    }

    // 获取北京时间
    const now = getBeijingTime();

    // 1. 先批量创建新条目
    const newItems = updates.filter(update => {
      const existingItem = inventoryData.value.find(item => 
        item.productid === update.productId &&
        Number(item.sphere.toFixed(2)) === Number(update.sphere.toFixed(2)) &&
        Number(item.cylinder.toFixed(2)) === Number(update.cylinder.toFixed(2))
      );
      return !existingItem;
    });

    const newItemIdMap = new Map();

    // 串行处理新条目创建
    for (const item of newItems) {
      try {
        const response = await fetch('https://aiforoptometry.com/lensinventory/add/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': localStorage.getItem('csrftoken')
          },
          body: JSON.stringify({
            organization_id,
            product_id: item.productId,
            sphere: Number(item.sphere.toFixed(2)),
            cylinder: Number(item.cylinder.toFixed(2)),
            current_stock: Math.floor(item.currentStock),
            created_at: now,
            updated_at: now
          }),
          credentials: 'include'
        });
        const result = await response.json();
        if (result.code === 201) {
          newItemIdMap.set(`${item.productId}_${item.sphere}_${item.cylinder}`, result.data.id);
        } else {
          throw new Error(`创建条目失败: ${result.message}`);
      }
      } catch (error) {
        console.error('创建条目失败:', error);
        throw new Error(`创建条目失败: ${error.message}`);
      }
    }

    // 2. 再批量更新库存
    const updateItems = updates.filter(update => {
      const existingItem = inventoryData.value.find(item => 
        item.productid === update.productId &&
        Number(item.sphere.toFixed(2)) === Number(update.sphere.toFixed(2)) &&
        Number(item.cylinder.toFixed(2)) === Number(update.cylinder.toFixed(2))
      );
      return existingItem && update.currentStock !== existingItem.currentStock;
    });

    // 串行处理库存更新
    for (const update of updateItems) {
      try {
        const existingItem = inventoryData.value.find(item => 
          item.productid === update.productId &&
          Number(item.sphere.toFixed(2)) === Number(update.sphere.toFixed(2)) &&
          Number(item.cylinder.toFixed(2)) === Number(update.cylinder.toFixed(2))
        );
        const diff = update.currentStock - existingItem.currentStock;
        if (diff === 0) continue;

        const apiUrl = diff > 0 
          ? `https://aiforoptometry.com/lensinventory/in/${existingItem.id}/`
          : `https://aiforoptometry.com/lensinventory/out/${existingItem.id}/`;

        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': localStorage.getItem('csrftoken')
          },
          body: JSON.stringify({
            adjustAmount: Math.abs(diff),
            operator: localStorage.getItem('username') || 'admin',
            id: existingItem.id,
            remark: '批量表格调整',
            created_at: now,
            updated_at: now
          }),
          credentials: 'include'
        });
        const result = await response.json();
        if (result.code !== 200) {
          throw new Error(`更新库存失败: ${result.message}`);
        }
      } catch (error) {
        console.error('更新库存失败:', error);
        throw new Error(`更新库存失败: ${error.message}`);
      }
    }

    // 3. 成功后更新本地缓存
    const currentData = getLensData();
    updates.forEach(update => {
      const existingItem = currentData.find(item => 
        item.productid === update.productId &&
        Number(item.sphere.toFixed(2)) === Number(update.sphere.toFixed(2)) &&
        Number(item.cylinder.toFixed(2)) === Number(update.cylinder.toFixed(2))
      );

      if (existingItem) {
        existingItem.currentStock = update.currentStock;
        existingItem.updated_at = now;
      } else {
        const newId = newItemIdMap.get(`${update.productId}_${update.sphere}_${update.cylinder}`);
        if (!newId) {
          console.error('未找到新条目的ID映射:', update);
          return;
        }
        const newItem = {
          id: newId,
          productid: update.productId,
          sphere: update.sphere,
          cylinder: update.cylinder,
          currentStock: update.currentStock,
          created_at: now,
          updated_at: now
        };
        currentData.push(newItem);
        }
    });

    localStorage.setItem('lensdata', JSON.stringify(currentData));
    inventoryData.value = currentData;
    
    message.success('批量更新成功');
    cancelEditing();
  } catch (error) {
    message.error(error.message || '更新失败');
    console.error('更新失败:', error);
  }
};

// 删除库存
const deleteLensInventory = async (id) => {
  try {
    // 先调用后端API
    const response = await fetch(`https://aiforoptometry.com/lensinventory/delete/${id}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken')
      },
      body: JSON.stringify({ id }),
      credentials: 'include'
    });

    const result = await response.json();
    
    if (result.code === 200) {
      // 后端成功后再更新本地缓存
      const currentData = getLensData();
      const index = currentData.findIndex(item => item.id === id);
      if (index !== -1) {
        currentData.splice(index, 1);
        localStorage.setItem('lensdata', JSON.stringify(currentData));
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
.lens-inventory {
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

.grid-view-container {
  padding: 20px;
}

.product-selector {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.grid-container {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: auto;
  max-height: 600px;
}

.grid-header {
  display: flex;
  position: sticky;
  top: 0;
  background: #fafafa;
  z-index: 1;
}

.corner-cell {
  width: 80px;
  height: 40px;
  border-right: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  position: relative;
  overflow: hidden;
}

.diagonal-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom left, transparent calc(50% - 0.5px), #e8e8e8 calc(50% - 0.5px), #e8e8e8 calc(50% + 0.5px), transparent calc(50% + 0.5px));
  z-index: 1;
}

.corner-text {
  position: absolute;
  font-size: 12px;
  color: #666;
  z-index: 2;
}

.sphere-text {
  bottom: 2px;
  left: 2px;
}

.cylinder-text {
  top: 2px;
  right: 2px;
}

.header-cell {
  flex: 1;
  min-width: 80px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  font-weight: bold;
}

.grid-body {
  display: flex;
  flex-direction: column;
}

.grid-row {
  display: flex;
}

.row-header {
  width: 80px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  font-weight: bold;
}

.grid-cell {
  flex: 1;
  min-width: 80px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  color: #999;
  padding: 0;
  cursor: default;
  transition: all 0.3s;
}

.grid-cell.editing {
  cursor: pointer;
}

.grid-cell.selected {
  background-color: #e6f7ff;
  border: 1px solid #1890ff;
  position: relative;
  z-index: 1;
}

.grid-cell.has-stock {
  color: #1890ff;
  font-weight: bold;
  background: #e6f7ff;
}

.grid-cell :deep(.ant-input-number) {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
}

.grid-cell :deep(.ant-input-number-input) {
  text-align: center;
  height: 100%;
  font-size: 14px;
  line-height: 40px;
  padding: 0;
  background: transparent;
  box-shadow: none;
  border: none;
  display: block;
}

.grid-cell :deep(.ant-input-number-handler-wrap) {
  display: none;
}

.grid-cell :deep(.ant-input-number-focused) {
  box-shadow: none;
}

.out-of-range-stock {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 4px;
}

.out-of-range-stock h4 {
  margin: 0 0 12px 0;
  color: #d46b08;
}

.out-of-range-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.out-of-range-item {
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #ffd591;
  border-radius: 4px;
  display: flex;
  gap: 12px;
}

.out-of-range-item span {
  color: #666;
}

.edit-actions {
  display: flex;
  align-items: center;
}
</style> 