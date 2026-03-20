<template>
  <a-card class="inventory-card">
    <template #title>
      <div class="card-title">
        <inbox-outlined />
        <span class="main-title">库存信息</span>
        <div class="btn-bar-wrap">
          <a-button 
            v-for="tab in inventoryTabs" 
            :key="tab.key"
            :type="currentTab === tab.key ? 'primary' : 'default'"
            size="small"
            class="tab-btn"
            @click="currentTab = tab.key"
          >
            {{ tab.label }}
          </a-button>
        </div>
      </div>
    </template>

    <component 
      :is="currentComponent" 
      @stock-updated="handleStockUpdate"
          />
  </a-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { InboxOutlined } from '@ant-design/icons-vue';
import LensInventory from './inventory/LensInventory.vue';
import FrameInventory from './inventory/FrameInventory.vue';
import SoftContactInventory from './inventory/SoftContactInventory.vue';
import SolutionInventory from './inventory/SolutionInventory.vue';
import AccessoryInventory from './inventory/AccessoryInventory.vue';

// 当前选中的标签页
const currentTab = ref('lens');

// 库存标签页配置
const inventoryTabs = [
  { key: 'lens', label: '镜片库存' },
  { key: 'frame', label: '镜框库存' },
  { key: 'softcontact', label: '软性隐形眼镜库存' },
  { key: 'solution', label: '护理液及药品库存' },
  { key: 'accessory', label: '非医疗产品库存' }
];

// 根据当前标签页动态显示对应组件
const currentComponent = computed(() => {
  switch (currentTab.value) {
    case 'lens':
      return LensInventory;
    case 'frame':
      return FrameInventory;
    case 'softcontact':
      return SoftContactInventory;
    case 'solution':
      return SolutionInventory;
    case 'accessory':
      return AccessoryInventory;
    default:
      return LensInventory;
  }
});

// 处理库存更新事件
const handleStockUpdate = () => {
  // 可以在这里添加全局的库存更新逻辑
  console.log('库存已更新');
};
</script>

<style scoped>
.inventory-card {
  margin: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.main-title {
  font-weight: bold;
  font-size: 18px;
  margin-left: 6px;
  margin-right: 12px;
}

.btn-bar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn {
  min-width: 90px;
  font-size: 14px;
  padding: 0 16px;
}
</style> 