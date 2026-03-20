<template>
  <a-spin :spinning="isLoading">
    <div class="wrapper">
      <div v-if="isFirstLoad" style="text-align: center; margin: 20px;">
        <h3>首次加载，请耐心等待...</h3>
      </div>
      <div class="header-container"
           style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div class="header-title">
          <img-icon class="header-icon" title="档案"/>
          <h2 class="title" style="margin: 0;">检查档案</h2>
        </div>
        <div class="filter-container" style="display: flex; align-items: center;">
          <a-input
              class="header-input"
              v-model:value="searchText"
              placeholder="请输入患者编号或姓名"
              allowClear
              style="width: 200px; margin-right: 8px;"
          >
            <template #suffix>
              <img-icon class="input-icon" style="margin-right: 0" title="搜索"/>
            </template>
          </a-input>
          <a-date-picker
              class="header-input"
              v-model:value="searchDate"
              :format="dateFormat"
              style="width: 200px; margin-right: 8px;"
              :locale="locale"
          >
            <template #suffixIcon>
              <img-icon class="input-icon" title="日历" style="margin-right: 0"/>
            </template>
          </a-date-picker>
          <a-button class="header-little-btn" type="primary" style="margin-right: 8px;" @click="prevDay">
            <template #icon>
              <left-outlined/>
            </template>
          </a-button>
          <a-button class="header-little-btn" type="primary" style="margin-right: 8px;" @click="nextDay">
            <template #icon>
              <right-outlined/>
            </template>
          </a-button>
          <a-button class="header-btn" type="primary" style="margin-left: 16px;" @click="handleSyncAll">同步全部
          </a-button>
        </div>
      </div>

      <a-table
          :columns="columns"
          :dataSource="pagedExaminations"
          rowKey="examination_id"
          :pagination="false"
          :locale="tableLocale"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button class="table-btn" type="primary" size="small" @click="handleView(record)">查看患者主页
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <div class="pagination" style="margin-top: 16px; text-align: center;">
        <a-pagination
            class="pagination"
            v-model:current="currentPage"
            :total="total"
            :pageSize="pageSize"
            @change="handlePageChange"
        />
      </div>
    </div>
  </a-spin>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue';
import {LeftOutlined, RightOutlined} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN';
import {message} from 'ant-design-vue';
import ImgIcon from "@/pages/components/ImgIcon.vue";

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');

// 定义 emit
const emit = defineEmits(['view-patient']);

const isLoading = ref(false);
const isFirstLoad = ref(false);
const examinations = ref([]);
const searchDate = ref(dayjs());
const currentPage = ref(1);
const pageSize = ref(10);
const dateFormat = 'YYYY-MM-DD';
const searchText = ref('');

const columns = [
  {
    title: '患者编号',
    dataIndex: ['patient', 'gkid'],
    key: 'gkid',
    align: 'center',
    width: 180
  },
  {
    title: '患者姓名',
    dataIndex: ['patient', 'name'],
    key: 'name',
    align: 'center',
    width: 120
  },
  {
    title: '检查次数',
    key: 'exam_count',
    align: 'center',
    width: 100,
    customRender: ({record}) => {
      // 从 localStorage 获取所有检查记录
      const cachedData = localStorage.getItem('checkmanagementlist');
      if (!cachedData) return '0';

      try {
        const allExaminations = JSON.parse(cachedData).data || [];
        // 统计该患者的检查次数
        const count = allExaminations.filter(
            item => item.patient_id === record.patient_id
        ).length;
        return count.toString();
      } catch (error) {
        console.error('计算检查次数失败:', error);
        return '0';
      }
    }
  },
  {
    title: '年龄',
    key: 'age',
    align: 'center',
    width: 80,
    customRender: ({record}) => {
      if (record.patient?.birthDate) {
        const age = ((Date.now() - new Date(record.patient.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)).toFixed(1);
        return `${age}岁`;
      }
      return '-';
    }
  },
  {
    title: '操作',
    key: 'action',
    align: 'center',
    width: 150,
    fixed: 'right'
  }
];

const tableLocale = {
  filterConfirm: '确定',
  filterReset: '重置',
  emptyText: '暂无数据',
  triggerDesc: '点击降序',
  triggerAsc: '点击升序',
  cancelSort: '取消排序'
};

// 过滤后的检查记录
const filteredExaminations = computed(() => {
  console.log('过滤检查记录, 当前examinations:', examinations.value);

  if (!Array.isArray(examinations.value)) {
    console.warn('examinations 不是数组:', examinations.value);
    return [];
  }

  // 获取当前机构名称
  const currentOrganizationName = localStorage.getItem('organization_name');
  if (!currentOrganizationName) {
    console.warn('未找到当前机构名称');
    return [];
  }

  return examinations.value.filter(item => {
    if (!item?.patient || !item?.examination) {
      console.warn('无效的记录:', item);
      return false;
    }

    // 检查机构名称是否匹配
    if (!item.patient.gkid.includes(currentOrganizationName)) {
      return false;
    }

    // 日期匹配
    const dateMatch = !searchDate.value ||
        (item.examination.examination_date === (searchDate.value ? searchDate.value.format(dateFormat) : ''));

    // 搜索文本匹配
    const searchMatch = !searchText.value ||
        (item.patient.gkid && item.patient.gkid.toLowerCase().includes(searchText.value.toLowerCase())) ||
        (item.patient.name && item.patient.name.toLowerCase().includes(searchText.value.toLowerCase()));

    return dateMatch && searchMatch;
  });
});

const pagedExaminations = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredExaminations.value.slice(start, end);
});

const total = computed(() => filteredExaminations.value.length);

// 获取检查数据
const fetchExaminationData = async (showLoading = false) => {
  const organizationId = localStorage.getItem('organization_id');
  const csrftoken = localStorage.getItem('csrftoken');

  if (showLoading) {
    isLoading.value = true;
  }

  try {
    // 1. 优先使用本地缓存填充UI
    const cachedData = localStorage.getItem('checkmanagementlist');

    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        examinations.value = parsedData.data || [];
      } catch (error) {
        console.error('解析缓存数据失败:', error);
        examinations.value = [];
      }
    }

    // 构建URL，只有在有缓存数据时才携带日期参数
    let url = `https://aiforoptometry.com/organization/${organizationId}/examinations/`;
    if (cachedData) {
      url += `?date=${searchDate.value.format(dateFormat)}`;
    }

    console.log('发送请求:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      }
    });

    const data = await response.json();
    console.log('接收数据:', data);

    if (response.ok && data) {
      // 更新本地存储
      const existingData = localStorage.getItem('checkmanagementlist');
      let mergedData;

      if (existingData) {
        try {
          const parsedExisting = JSON.parse(existingData);
          // 合并数据，保留现有数据，追加新数据
          const existingIds = new Set(parsedExisting.data.map(item => item.examination_id));
          const newData = data.data.filter(item => !existingIds.has(item.examination_id));

          // 更新现有记录的数据
          const updatedExistingData = parsedExisting.data.map(existingItem => {
            const updatedItem = data.data.find(
                newItem => newItem.examination_id === existingItem.examination_id
            );
            return updatedItem || existingItem;
          });

          mergedData = {
            ...parsedExisting,
            data: [...updatedExistingData, ...newData]
          };
        } catch (error) {
          console.error('合并缓存数据失败:', error);
          mergedData = data;
        }
      } else {
        mergedData = data;
      }

      // 更新本地存储和UI
      localStorage.setItem('checkmanagementlist', JSON.stringify(mergedData));
      examinations.value = mergedData.data || [];
    } else {
      console.error('获取数据失败:', data);
      if (!examinations.value.length) {
        message.error('获取数据失败，请刷新页面重试');
      }
    }
  } catch (error) {
    console.error('获取数据失败:', error);
    if (!examinations.value.length) {
      message.error('网络请求失败，请检查网络连接后重试');
    }
  } finally {
    if (showLoading) {
      isLoading.value = false;
    }
  }
};

const prevDay = () => {
  if (!searchDate.value) {
    searchDate.value = dayjs();
  }
  searchDate.value = dayjs(searchDate.value).subtract(1, 'day');
  fetchExaminationData(false);
};

const nextDay = () => {
  if (!searchDate.value) {
    searchDate.value = dayjs();
  }
  searchDate.value = dayjs(searchDate.value).add(1, 'day');
  fetchExaminationData(false);
};

const handlePageChange = (page) => {
  currentPage.value = page;
};

const handleView = (record) => {
  console.log('查看记录:', record);
  const formattedRecord = {
    patient_id: record.patient_id,
    patient: {
      gkid: record.patient.gkid,
      name: record.patient.name,
      gender: record.patient.gender,
      birthDate: record.patient.birthDate,
      phone: record.patient.phone
    }
  };
  console.log('传递给父组件的数据:', formattedRecord);
  emit('view-patient', formattedRecord);
};

// 添加同步全部数据的方法
const handleSyncAll = async () => {
  const organizationId = localStorage.getItem('organization_id');
  const csrftoken = localStorage.getItem('csrftoken');
  isLoading.value = true;
  try {
    const url = `https://aiforoptometry.com/organization/${organizationId}/examinations/`;
    console.log('同步全部数据，发送请求:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      }
    });

    const data = await response.json();
    console.log('同步全部数据，接收数据:', data);

    if (response.ok && data) {
      localStorage.setItem('checkmanagementlist', JSON.stringify(data));
      examinations.value = data.data || [];
      message.success('同步成功');
    } else {
      message.error('同步失败: ' + (data.error || '未知错误'));
    }
  } catch (error) {
    console.error('同步失败:', error);
    message.error('同步失败: ' + error.message);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  console.log('组件挂载，开始初始化数据');
  // 确保日期被正确初始化
  if (!searchDate.value) {
    searchDate.value = dayjs();
  }
  fetchExaminationData(true);
});

// 导出需要的变量和方法
defineExpose({
  isLoading,
  isFirstLoad,
  searchDate,
  columns,
  filteredExaminations,
  pagedExaminations,
  currentPage,
  pageSize,
  total,
  tableLocale,
  dateFormat,
  handleView,
  prevDay,
  nextDay,
  handlePageChange,
  handleSyncAll,
  searchText,
  locale
});
</script>

<style scoped>
.header-title {
  display: flex;
  align-items: center;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.header-title .title {
  font-weight: 500;
  font-size: 22px;
  color: #000714;
  text-align: left;
  font-style: normal;
  text-transform: none;
}

.filter-container {
  display: flex;
  align-items: center;
}

@media print {
  .filter-container {
    display: none !important;
  }
}

.header-input {
  width: 188px;
  height: 38px;
  background: #FFFFFF;
  border-radius: 8px 8px 8px 8px;
  border: 1px solid #E27244;
}

.header-btn {
  width: 128px;
  height: 38px;
  background: linear-gradient(-90deg, #E27244 0%, #E29D44 100%);
  border-radius: 10px 10px 10px 10px;
  font-weight: 500;
  font-size: 20px;
  color: #FFFFFF;
  text-align: left;
  font-style: normal;
  text-transform: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-little-btn {
  width: 38px;
  height: 38px;
  background: linear-gradient(-90deg, #E27244 0%, #E29D44 100%);
  border-radius: 8px 8px 8px 8px;
}

:deep(.ant-table) {
  th.ant-table-cell {
    background-color: rgba(34, 75, 150, 0.1);
  }
}

.table-btn {
  width: 128px;
  height: 28px;
  background: #F4BB22;
  border-radius: 10px 10px 10px 10px;
}

:deep(.pagination) {
  .ant-pagination-item {
    border: 1px solid #D8D8D8;
  }

  .ant-select-selector {
    border: 1px solid #E27244;
  }

  .ant-select-arrow {
    color: #E27244;
  }

  .ant-pagination-item-active {
    background: #E27244;
    border: 1px solid #F4BB22;
  }

  .ant-pagination-item-active a {
    color: white;
  }
}
</style>
