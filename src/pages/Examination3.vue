<template>
  <div class="wrapper">
    <div class="header-container">
      <div class="header-title">
        <img-icon class="header-icon" title="检查管理1"/>
        <h2 class="title" style="margin: 0;">检查设备</h2>
      </div>
    </div>
    
    <!-- 设备列表 -->
    <a-card :bordered="false" style="margin-top: 24px;">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="showBindModal">
            <template #icon><PlusOutlined /></template>
            绑定设备
          </a-button>
          <a-button @click="refreshDeviceList">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
        </a-space>
      </template>

          <!-- 搜索筛选区域 -->
          <div class="filter-section" style="margin-bottom: 16px;">
            <a-form layout="inline">
              <a-form-item label="设备序列号">
                <a-input
                  v-model:value="filter.keyword"
                  placeholder="输入设备序列号（支持模糊搜索）"
                  style="width: 250px;"
                  allowClear
                  @pressEnter="handleSearch"
                />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" @click="handleSearch">
                  <template #icon><SearchOutlined /></template>
                  查询
                </a-button>
                <a-button style="margin-left: 8px;" @click="resetFilter">重置</a-button>
              </a-form-item>
            </a-form>
          </div>

          <!-- 设备列表表格 -->
          <a-table
            :columns="deviceColumns"
            :data-source="filteredDeviceList"
            :pagination="pagination"
            :loading="deviceListLoading"
            row-key="id"
            @change="handleTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'serial_number'">
                <a-tag color="blue">{{ record.serial_number }}</a-tag>
              </template>
              <template v-else-if="column.key === 'vendor'">
                <span>{{ record.vendor || '-' }}</span>
              </template>
              <template v-else-if="column.key === 'patient_name'">
                <span v-if="record.current_binding && record.current_binding.patient">
                  {{ record.current_binding.patient.name }}
                </span>
                <span v-else style="color: #999;">未绑定</span>
              </template>
              <template v-else-if="column.key === 'patient_gkid'">
                <span v-if="record.current_binding && record.current_binding.patient">
                  {{ record.current_binding.patient.gkid }}
                </span>
                <span v-else style="color: #999;">-</span>
              </template>
              <template v-else-if="column.key === 'bind_time'">
                <span v-if="record.current_binding">
                  {{ formatDate(record.current_binding.bind_time) }}
                </span>
                <span v-else style="color: #999;">-</span>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="viewDeviceLogs(record)">
                    使用记录
                  </a-button>
                  <a-popconfirm
                    v-if="record.current_binding && record.current_binding.patient"
                    title="确定要解绑该设备吗？"
                    @confirm="handleUnbindDevice(record)"
                  >
                    <a-button type="link" danger size="small">解绑</a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
    </a-card>

    <!-- 设备绑定Modal -->
    <a-modal
      v-model:visible="bindModalVisible"
      title="绑定设备"
      width="600px"
      @ok="handleBindDevice"
      @cancel="handleBindModalCancel"
      :confirmLoading="binding"
      :maskClosable="false"
    >
      <a-form
        :model="bindForm"
        :rules="bindFormRules"
        ref="bindFormRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="选择患者" name="gkid">
          <a-select
            v-model:value="bindForm.gkid"
            placeholder="请输入首拼或者部分首拼搜索患者"
            style="width: 100%;"
            :loading="patientListLoading"
            :options="patientListOptions"
            :field-names="{ label: 'label', value: 'gkid' }"
            show-search
            :filter-option="false"
            @search="handlePatientSearch"
            @change="handlePatientSelect"
            :not-found-content="patientListLoading ? '搜索中...' : (patientSearchText ? '未找到患者' : '请输入首拼或者部分首拼搜索')"
          >
            <template #suffixIcon>
              <img-icon class="input-icon" title="展开" style="margin-right: 0"/>
            </template>
          </a-select>
        </a-form-item>
        
        <a-form-item label="患者姓名">
          <a-input v-model:value="selectedPatientName" placeholder="自动关联" disabled style="width: 100%;"/>
        </a-form-item>
        
        <a-form-item label="设备序列号" name="serial_number">
          <a-input
            v-model:value="bindForm.serial_number"
            placeholder="请输入设备序列号"
            style="width: 100%;"
          />
        </a-form-item>
        
        <a-form-item label="设备厂商" name="vendor">
          <a-input
            v-model:value="bindForm.vendor"
            placeholder="请输入设备厂商（如：唯迪科）"
            style="width: 100%;"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 设备使用记录Modal -->
    <a-modal
      v-model:visible="deviceLogsModalVisible"
      title="设备使用记录"
      width="90%"
      :footer="null"
      :maskClosable="false"
    >
      <div v-if="selectedDevice">
        <a-descriptions :column="3" bordered style="margin-bottom: 16px;">
          <a-descriptions-item label="设备序列号" :span="1">
            <a-tag color="blue">{{ selectedDevice.serial_number }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="记录总数" :span="1">
            {{ deviceLogsTotal }}
          </a-descriptions-item>
          <a-descriptions-item label="操作" :span="1">
            <a-space>
              <a-button size="small" @click="refreshDeviceLogs" :loading="deviceLogsLoading">
                <template #icon><ReloadOutlined /></template>
                刷新
              </a-button>
              <a-button size="small" @click="showTableView = !showTableView">
                {{ showTableView ? '日历视图' : '列表视图' }}
              </a-button>
            </a-space>
          </a-descriptions-item>
        </a-descriptions>

        <!-- 日历视图 -->
        <div v-if="!showTableView" class="device-logs-layout">
          <!-- 左侧：日历 -->
          <div class="device-calendar-section">
            <!-- 月份选择器 -->
            <div class="calendar-header">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span>时间选择:</span>
                <a-date-picker
                  v-model:value="selectedMonth"
                  picker="month"
                  format="YYYY/MM"
                  style="width: 150px;"
                  @change="handleMonthChange"
                />
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <a-button size="small" @click="prevMonth">
                  <template #icon><LeftOutlined /></template>
                </a-button>
                <a-button size="small" @click="nextMonth">
                  <template #icon><RightOutlined /></template>
                </a-button>
              </div>
            </div>

            <!-- 日历网格 -->
            <div class="device-calendar-container">
              <div class="device-calendar-weekdays">
                <div class="device-calendar-weekday" v-for="day in weekDays" :key="day">{{ day }}</div>
              </div>
              <div class="device-calendar-days">
                <div
                  v-for="date in calendarDates"
                  :key="date.format('YYYY-MM-DD')"
                  class="device-calendar-day"
                  :class="{
                    'device-calendar-day-selected': selectedCalendarDate && date.isSame(selectedCalendarDate, 'day'),
                    'device-calendar-day-today': date.isSame(dayjs(), 'day'),
                    'device-calendar-day-other-month': !date.isSame(selectedMonth, 'month'),
                    'device-calendar-day-has-data': getDayUsageCount(date) > 0
                  }"
                  @click="handleCalendarDateClick(date)"
                >
                  <div class="device-calendar-day-number">{{ date.date() }}</div>
                  <div v-if="getDayUsageCount(date) > 0" class="device-calendar-day-count">
                    {{ getDayUsageCount(date) }}次
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：使用记录 -->
          <div class="device-logs-section">
            <div v-if="selectedCalendarDate && dayLogsList.length > 0" class="logs-content">
              <div class="logs-header">
                <h3>当日使用记录</h3>
                <a-tag color="blue">{{ selectedCalendarDate.format('YYYY-MM-DD') }}</a-tag>
              </div>
              <a-table
                :columns="deviceLogsColumns"
                :data-source="dayLogsList"
                :pagination="false"
                :loading="deviceLogsLoading"
                :scroll="{ x: 'max-content', y: 400 }"
                row-key="welldico_log_id"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'device_mode'">
                    <a-tag :color="getDeviceModeColor(record.device_mode)">
                      {{ record.device_mode }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'left_level' || column.key === 'right_level'">
                    <span>{{ record[column.key] ?? '-' }}</span>
                  </template>
                  <template v-else-if="column.key === 'training_duration'">
                    <span>{{ record.training_duration ?? '-' }} 分钟</span>
                  </template>
                  <template v-else-if="column.key === 'training_at'">
                    {{ formatDateTime(record[column.key]) }}
                  </template>
                  <template v-else-if="column.key === 'status'">
                    <a-tag :color="getStatusColor(record.status)">
                      {{ getStatusText(record.status) }}
                    </a-tag>
                  </template>
                </template>
              </a-table>
            </div>
            <div v-else class="logs-empty">
              <a-empty description="请选择日期查看使用记录" :image="false" />
            </div>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else>
          <a-table
            :columns="deviceLogsColumns"
            :data-source="paginatedDeviceLogs"
            :pagination="deviceLogsPagination"
            :loading="deviceLogsLoading"
            :scroll="{ x: 1400 }"
            row-key="welldico_log_id"
            @change="handleDeviceLogsTableChange"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'device_mode'">
                <a-tag :color="getDeviceModeColor(record.device_mode)">
                  {{ record.device_mode }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'left_level' || column.key === 'right_level'">
                <span>{{ record[column.key] ?? '-' }}</span>
              </template>
              <template v-else-if="column.key === 'training_duration'">
                <span>{{ record.training_duration ?? '-' }} 分钟</span>
              </template>
              <template v-else-if="column.key === 'training_at'">
                {{ formatDateTime(record[column.key]) }}
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined, ReloadOutlined, SearchOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons-vue';
import ImgIcon from "@/pages/components/ImgIcon.vue";
import { convertUrlForProxy } from "@/utils/networkManager.js";
import dayjs from 'dayjs';

// 绑定Modal相关
const bindModalVisible = ref(false);

// 绑定表单相关
const bindFormRef = ref(null);
const binding = ref(false);
const bindForm = ref({
  serial_number: '',
  gkid: null,
  vendor: '唯迪科'
});

// 患者相关
const patientList = ref([]);
const patientListLoading = ref(false);
const patientSearchText = ref('');
const selectedPatientName = ref('');
let searchTimer = null; // 防抖定时器

// 设备列表相关
const deviceList = ref([]);
const deviceListLoading = ref(false);
const deviceListTotal = ref(0);
const filter = ref({
  keyword: ''
});

// 设备使用记录相关
const deviceLogsModalVisible = ref(false);
const selectedDevice = ref(null);
const deviceLogsList = ref([]);
const deviceLogsLoading = ref(false);
const deviceLogsTotal = ref(0);
const deviceLogsPagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条记录`
});
const showTableView = ref(false); // false=日历视图, true=列表视图

// 日历相关
const selectedMonth = ref(dayjs());
const selectedCalendarDate = ref(null);
const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

// 分页
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条记录`
});

// 表单验证规则
const bindFormRules = {
  gkid: [
    { required: true, message: '请选择患者', trigger: 'change' }
  ],
  serial_number: [
    { required: true, message: '请输入设备序列号', trigger: 'blur' }
  ],
  vendor: [
    { required: true, message: '请输入设备厂商', trigger: 'blur' }
  ]
};

// 设备列表表格列
const deviceColumns = [
  {
    title: '序号',
    key: 'index',
    width: 80,
    customRender: ({ index }) => index + 1 + (pagination.value.current - 1) * pagination.value.pageSize
  },
  { title: '设备序列号', dataIndex: 'serial_number', key: 'serial_number', width: 180 },
  { title: '设备厂商', dataIndex: 'vendor', key: 'vendor', width: 120 },
  { title: '患者姓名', dataIndex: 'patient_name', key: 'patient_name', width: 120 },
  { title: '患者编号', dataIndex: 'patient_gkid', key: 'patient_gkid', width: 150 },
  { title: '绑定时间', dataIndex: 'bind_time', key: 'bind_time', width: 180 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' }
];

// 设备使用记录表格列
const deviceLogsColumns = [
  { title: '记录ID', dataIndex: 'welldico_log_id', key: 'welldico_log_id', width: 80 },
  { title: '设备模式', dataIndex: 'device_mode', key: 'device_mode', width: 90 },
  { title: '左眼等级', dataIndex: 'left_level', key: 'left_level', width: 70 },
  { title: '右眼等级', dataIndex: 'right_level', key: 'right_level', width: 70 },
  { title: '训练时长(分钟)', dataIndex: 'training_duration', key: 'training_duration', width: 100 },
  { title: '训练时间', dataIndex: 'training_at', key: 'training_at', width: 150 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 70 }
];

// 计算属性：过滤后的设备列表（前端过滤，因为API已经支持模糊搜索）
const filteredDeviceList = computed(() => {
  // 如果API已经返回了过滤后的结果，直接使用
  // 这里可以做额外的前端过滤（如果需要）
  const result = [...deviceList.value];
  
  // 更新分页总数
  pagination.value.total = result.length;
  
  // 分页
  const start = (pagination.value.current - 1) * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  
  return result.slice(start, end);
});

// 计算属性：分页后的设备使用记录
const paginatedDeviceLogs = computed(() => {
  const result = [...deviceLogsList.value];
  
  // 更新分页总数
  deviceLogsPagination.value.total = result.length;
  
  // 分页
  const start = (deviceLogsPagination.value.current - 1) * deviceLogsPagination.value.pageSize;
  const end = start + deviceLogsPagination.value.pageSize;
  
  return result.slice(start, end);
});

// 计算属性：日历日期数组
const calendarDates = computed(() => {
  const month = selectedMonth.value;
  const firstDay = month.startOf('month');
  const lastDay = month.endOf('month');
  
  // 获取第一天是星期几（0=周日, 1=周一, ..., 6=周六）
  const firstDayOfWeek = firstDay.day();
  // 转换为周一开始的索引（0=周一, 1=周二, ..., 6=周日）
  const mondayIndex = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  // 计算日历开始日期（从第一个周一往前推）
  const startDate = firstDay.subtract(mondayIndex, 'day');
  
  // 计算需要显示的天数（6周 = 42天）
  const dates = [];
  for (let i = 0; i < 42; i++) {
    dates.push(startDate.add(i, 'day'));
  }
  
  return dates;
});

// 计算属性：按日期统计的使用次数
const dateUsageCounts = computed(() => {
  const counts = {};
  deviceLogsList.value.forEach(log => {
    if (log.training_at) {
      const dateKey = dayjs(log.training_at).format('YYYY-MM-DD');
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    }
  });
  return counts;
});

// 计算属性：选中日期的记录列表
const dayLogsList = computed(() => {
  if (!selectedCalendarDate.value) return [];
  const dateStr = selectedCalendarDate.value.format('YYYY-MM-DD');
  return deviceLogsList.value.filter(log => {
    if (!log.training_at) return false;
    const logDateStr = dayjs(log.training_at).format('YYYY-MM-DD');
    return logDateStr === dateStr;
  });
});

// 提取gkid数字
const extractGkidNumber = (gkid) => {
  if (!gkid) return '-';
  const numbers = gkid.match(/\d+/g);
  return numbers && numbers.length > 0 ? numbers[numbers.length - 1] : '-';
};

// 从API搜索患者
const searchPatientsFromAPI = async (searchText) => {
  if (!searchText || !searchText.trim()) {
    patientList.value = [];
    return;
  }

  try {
    patientListLoading.value = true;
    
    const organizationId = localStorage.getItem('organization_id');
    if (!organizationId) {
      message.error('未找到机构ID，请重新登录');
      return;
    }

    const search = searchText.trim();
    const isPhoneSearch = /^\d+$/.test(search);
    
    const requestBody = {
      organizationid: parseInt(organizationId),
      page: 1,
      page_size: 20
    };
    
    if (isPhoneSearch) {
      requestBody.phone = search;
    } else {
      requestBody.name = search;
    }
    
    const apiUrl = 'https://aiforoptometry.com/api/patient/search_by_org';
    const proxiedUrl = convertUrlForProxy(apiUrl);
    
    const csrfToken = localStorage.getItem('csrftoken') || '';
    const response = await fetch(proxiedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.ok && result.rows) {
      patientList.value = result.rows;
    } else {
      patientList.value = [];
    }
  } catch (error) {
    console.error('搜索患者错误:', error);
    patientList.value = [];
  } finally {
    patientListLoading.value = false;
  }
};

// 处理患者搜索（带防抖）
const handlePatientSearch = (value) => {
  patientSearchText.value = value;
  
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  
  if (!value || !value.trim()) {
    patientList.value = [];
    return;
  }
  
  searchTimer = setTimeout(() => {
    searchPatientsFromAPI(value);
  }, 500);
};

// 患者列表选项（用于下拉框）
const patientListOptions = computed(() => {
  return patientList.value.map(patient => {
    let gkidNumber = extractGkidNumber(patient.gkid);
    if (gkidNumber === '-' || (gkidNumber && !/^\d+$/.test(gkidNumber))) {
      const numbers = patient.gkid ? patient.gkid.match(/\d+/g) : null;
      gkidNumber = numbers && numbers.length > 0 ? numbers[numbers.length - 1] : '';
    }
    return {
      id: patient.id,
      label: `${patient.name} (${gkidNumber})`,
      name: patient.name,
      gkid: patient.gkid,
      gkidNumber: gkidNumber,
      phone: patient.phone
    };
  });
});

// 处理患者选择
const handlePatientSelect = (value) => {
  const selected = patientList.value.find(p => p.gkid === value);
  if (selected) {
    selectedPatientName.value = selected.name;
    bindForm.value.gkid = selected.gkid;
  } else {
    selectedPatientName.value = '';
  }
};

// 显示绑定Modal
const showBindModal = () => {
  bindModalVisible.value = true;
};

// 关闭绑定Modal
const handleBindModalCancel = () => {
  handleResetForm();
  bindModalVisible.value = false;
};

// 绑定设备
const handleBindDevice = async () => {
  try {
    // 表单验证
    await bindFormRef.value.validate();
    
    binding.value = true;
    
    const organizationId = localStorage.getItem('organization_id');
    if (!organizationId) {
      message.error('未找到机构ID，请重新登录');
      return;
    }
    
    const requestBody = {
      serial_number: bindForm.value.serial_number,
      gkid: bindForm.value.gkid,
      organization_id: parseInt(organizationId),
      vendor: bindForm.value.vendor
    };
    
    const apiUrl = 'https://aiforoptometry.com/api/device/bind/';
    const proxiedUrl = convertUrlForProxy(apiUrl);
    
    const csrfToken = localStorage.getItem('csrftoken') || '';
    const response = await fetch(proxiedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('绑定设备失败:', response.status, errorText);
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      message.success('设备绑定成功！');
      handleResetForm();
      bindModalVisible.value = false;
      // 如果当前有搜索关键词，刷新列表
      if (filter.value.keyword && filter.value.keyword.trim()) {
        await fetchDeviceList();
      }
    } else {
      message.error(result.message || '绑定失败，请稍后重试');
    }
  } catch (error) {
    console.error('绑定设备错误:', error);
    if (error.errorFields) {
      // 表单验证错误
      return;
    }
    message.error(error.message || '绑定设备失败，请检查网络连接后重试');
  } finally {
    binding.value = false;
  }
};

// 重置表单
const handleResetForm = () => {
  bindFormRef.value?.resetFields();
  bindForm.value = {
    serial_number: '',
    gkid: null,
    vendor: '唯迪科'
  };
  selectedPatientName.value = '';
  patientSearchText.value = '';
  patientList.value = [];
  
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
};

// 获取机构绑定的设备列表
const fetchDeviceList = async () => {
  try {
    deviceListLoading.value = true;
    
    const organizationId = localStorage.getItem('organization_id');
    if (!organizationId) {
      message.error('未找到机构ID，请重新登录');
      deviceList.value = [];
      deviceListTotal.value = 0;
      pagination.value.total = 0;
      return;
    }
    
    const apiUrl = 'https://aiforoptometry.com/api/device/list_by_org/';
    const proxiedUrl = convertUrlForProxy(apiUrl);
    
    const requestBody = {
      organization_id: parseInt(organizationId)
    };
    
    const csrfToken = localStorage.getItem('csrftoken') || '';
    const response = await fetch(proxiedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('获取设备列表失败:', response.status, errorText);
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('设备列表响应:', result);
    
    // 处理返回数据
    const responseData = result.data || result;
    
    if (responseData.success) {
      const devices = responseData.devices || [];
      
      // 如果有搜索关键词，进行前端过滤
      let filteredDevices = devices;
      if (filter.value.keyword && filter.value.keyword.trim()) {
        const keyword = filter.value.keyword.trim().toLowerCase();
        filteredDevices = devices.filter(device => {
          // 搜索设备序列号
          if (device.serial_number && device.serial_number.toLowerCase().includes(keyword)) {
            return true;
          }
          // 搜索患者姓名
          if (device.current_binding && device.current_binding.patient) {
            const patient = device.current_binding.patient;
            if (patient.name && patient.name.toLowerCase().includes(keyword)) {
              return true;
            }
            if (patient.gkid && patient.gkid.toLowerCase().includes(keyword)) {
              return true;
            }
          }
          return false;
        });
      }
      
      deviceList.value = filteredDevices;
      deviceListTotal.value = responseData.total || filteredDevices.length;
      pagination.value.total = filteredDevices.length;
    } else {
      deviceList.value = [];
      deviceListTotal.value = 0;
      pagination.value.total = 0;
    }
  } catch (error) {
    console.error('获取设备列表错误:', error);
    message.error('获取设备列表失败，请稍后重试');
    deviceList.value = [];
    deviceListTotal.value = 0;
    pagination.value.total = 0;
  } finally {
    deviceListLoading.value = false;
  }
};

// 查看设备使用记录
const viewDeviceLogs = (record) => {
  selectedDevice.value = record;
  deviceLogsModalVisible.value = true;
  deviceLogsPagination.value.current = 1;
  selectedMonth.value = dayjs(); // 重置为当前月份
  selectedCalendarDate.value = null; // 清除选中的日期
  showTableView.value = false; // 默认显示日历视图
  fetchDeviceLogs();
};

// 获取设备使用记录
const fetchDeviceLogs = async () => {
  if (!selectedDevice.value) return;
  
  try {
    deviceLogsLoading.value = true;
    
    const deviceId = selectedDevice.value.serial_number;
    
    const apiUrl = 'https://aiforoptometry.com/api/welldico/device_logs/';
    const proxiedUrl = convertUrlForProxy(apiUrl);
    
    const requestBody = {
      device_id: deviceId,
      all: true,
      force_refresh: true
    };
    
    const csrfToken = localStorage.getItem('csrftoken') || '';
    const response = await fetch(proxiedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('获取设备使用记录失败:', response.status, errorText);
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('设备使用记录响应:', result);
    
    // 处理返回数据
    // 数据结构：{ code: 0, message: "ok", data: { device_id, total, list, ... } }
    if (result.code === 0 && result.data) {
      const logs = result.data.list || [];
      deviceLogsList.value = logs;
      deviceLogsTotal.value = result.data.total || logs.length;
      deviceLogsPagination.value.total = logs.length;
    } else if (result.data && result.data.code === 0 && result.data.data) {
      // 兼容嵌套的数据结构
      const logs = result.data.data.list || [];
      deviceLogsList.value = logs;
      deviceLogsTotal.value = result.data.data.total || logs.length;
      deviceLogsPagination.value.total = logs.length;
    } else {
      deviceLogsList.value = [];
      deviceLogsTotal.value = 0;
      deviceLogsPagination.value.total = 0;
    }
  } catch (error) {
    console.error('获取设备使用记录错误:', error);
    message.error('获取设备使用记录失败，请稍后重试');
    deviceLogsList.value = [];
    deviceLogsTotal.value = 0;
    deviceLogsPagination.value.total = 0;
  } finally {
    deviceLogsLoading.value = false;
  }
};

// 刷新设备使用记录
const refreshDeviceLogs = () => {
  fetchDeviceLogs();
};

// 设备使用记录表格分页变化
const handleDeviceLogsTableChange = (pag) => {
  deviceLogsPagination.value.current = pag.current;
  if (pag.pageSize) {
    deviceLogsPagination.value.pageSize = pag.pageSize;
  }
};

// 解绑设备
const handleUnbindDevice = async (record) => {
  try {
    const organizationId = localStorage.getItem('organization_id');
    if (!organizationId) {
      message.error('未找到机构ID，请重新登录');
      return;
    }
    
    // 获取设备序列号
    const serialNumber = record.serial_number;
    if (!serialNumber) {
      message.error('设备序列号不存在');
      return;
    }
    
    // 获取患者ID（从current_binding中获取）
    const patientId = record.current_binding?.patient?.id;
    
    if (!patientId) {
      message.error('无法获取患者ID，请确认设备已绑定');
      return;
    }
    
    const apiUrl = 'https://aiforoptometry.com/api/device/unbind/';
    const proxiedUrl = convertUrlForProxy(apiUrl);
    
    const requestBody = {
      serial_number: serialNumber,
      organization_id: parseInt(organizationId),
      patient_id: patientId
    };
    
    console.log('解绑设备请求:', requestBody);
    
    const csrfToken = localStorage.getItem('csrftoken') || '';
    const response = await fetch(proxiedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('解绑设备失败:', response.status, errorText);
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('解绑设备响应:', result);
    
    // 处理返回数据（可能直接返回result，也可能在result.data中）
    const responseData = result.data || result;
    
    if (responseData.success || result.success) {
      message.success('设备解绑成功！');
      // 刷新列表
      await fetchDeviceList();
    } else {
      message.error(responseData.message || result.message || '解绑失败，请稍后重试');
    }
  } catch (error) {
    console.error('解绑设备错误:', error);
    message.error(error.message || '解绑设备失败，请检查网络连接后重试');
  }
};

// 刷新设备列表
const refreshDeviceList = () => {
  fetchDeviceList();
};

// 搜索（支持关键词过滤）
const handleSearch = () => {
  pagination.value.current = 1;
  // 重新获取列表（如果有关键词会在fetchDeviceList中进行前端过滤）
  fetchDeviceList();
};

// 重置筛选
const resetFilter = () => {
  filter.value = {
    keyword: ''
  };
  pagination.value.current = 1;
  // 重置时重新获取完整列表
  fetchDeviceList();
};

// 表格分页变化
const handleTableChange = (pag) => {
  pagination.value.current = pag.current;
  if (pag.pageSize) {
    pagination.value.pageSize = pag.pageSize;
  }
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateStr;
  }
};

// 格式化日期时间（精确到秒）
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return dateStr;
  }
};

// 获取设备模式颜色
const getDeviceModeColor = (mode) => {
  const colorMap = {
    '哺光模式': 'blue',
    '后像模式': 'purple',
    '多色光闪': 'cyan',
    '其他': 'default'
  };
  return colorMap[mode] || 'default';
};

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    '1': 'green',   // 正常
    '2': 'orange',  // 异常
    '3': 'red',     // 严重异常
    '4': 'volcano', // 警告
    '5': 'gold'     // 其他
  };
  return colorMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    '1': '正常',
    '2': '异常',
    '3': '严重异常',
    '4': '警告',
    '5': '其他'
  };
  return textMap[status] || `状态${status}`;
};

// 获取某天的使用次数
const getDayUsageCount = (date) => {
  const dateKey = date.format('YYYY-MM-DD');
  return dateUsageCounts.value[dateKey] || 0;
};

// 处理日历日期点击
const handleCalendarDateClick = (date) => {
  // 如果点击的是已选中的日期，则取消选择
  if (selectedCalendarDate.value && date.isSame(selectedCalendarDate.value, 'day')) {
    selectedCalendarDate.value = null;
  } else {
    selectedCalendarDate.value = date;
  }
};

// 月份切换
const prevMonth = () => {
  selectedMonth.value = selectedMonth.value.subtract(1, 'month');
};

const nextMonth = () => {
  selectedMonth.value = selectedMonth.value.add(1, 'month');
};

// 月份选择器变化
const handleMonthChange = () => {
  // 月份变化时，清除选中的日期
  selectedCalendarDate.value = null;
};

// 初始化（自动加载设备列表）
onMounted(() => {
  // 初始加载机构绑定的设备列表
  fetchDeviceList();
});
</script>

<style scoped>
.wrapper {
  background: #FFFFFF;
  border-radius: 10px 10px 10px 10px;
  border: 1px solid #FFFFFF;
  padding: 10px;
}

/* 设备使用记录布局 */
.device-logs-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  max-width: 100%;
  overflow: hidden;
}

.device-calendar-section {
  flex: 0 0 40%;
  min-width: 0;
  max-width: 40%;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.device-calendar-container {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  width: 100%;
}

.device-calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: linear-gradient(135deg, #f5f7fa 0%, #fafbfc 100%);
  border-bottom: 2px solid #e8e8e8;
}

.device-calendar-weekday {
  padding: 6px 4px;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  color: #595959;
  border-right: 1px solid #e8e8e8;
}

.device-calendar-weekday:last-child {
  border-right: none;
}

.device-calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #fff;
}

.device-calendar-day {
  aspect-ratio: 4 / 3;
  border-right: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  padding: 3px;
  cursor: pointer;
  position: relative;
  background: #fff;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
}

.device-calendar-day:hover {
  background: #f0f9ff;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
}

.device-calendar-day:nth-child(7n) {
  border-right: none;
}

.device-calendar-day-other-month {
  background: #fafafa;
  color: #bfbfbf;
}

.device-calendar-day-other-month:hover {
  background: #f5f5f5;
}

.device-calendar-day-today {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  box-shadow: inset 0 0 0 1px #91d5ff;
}

.device-calendar-day-today:hover {
  background: #bae7ff;
}

.device-calendar-day-selected {
  background: #bae7ff;
  border: 2px solid #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  z-index: 2;
}

.device-calendar-day-selected:hover {
  background: #91d5ff;
}

.device-calendar-day-has-data {
  background: #f0f9ff;
}

.device-calendar-day-number {
  font-size: 12px;
  font-weight: 500;
  color: #262626;
  line-height: 1.2;
  padding: 1px 3px;
}

.device-calendar-day-other-month .device-calendar-day-number {
  color: #bfbfbf;
  font-weight: 400;
}

.device-calendar-day-today .device-calendar-day-number {
  color: #1890ff;
  font-weight: 600;
}

.device-calendar-day-selected .device-calendar-day-number {
  color: #0050b3;
  font-weight: 600;
}

.device-calendar-day-count {
  position: absolute;
  top: 1px;
  right: 1px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #fff;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 6px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
  line-height: 1.3;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.device-calendar-day-selected .device-calendar-day-count {
  background: linear-gradient(135deg, #0050b3 0%, #003a8c 100%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.device-calendar-day-other-month .device-calendar-day-count {
  background: #d9d9d9;
  color: #8c8c8c;
}

/* 右侧使用记录区域 */
.device-logs-section {
  flex: 0 0 60%;
  min-width: 0;
  max-width: 60%;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  min-height: 400px;
  overflow: hidden;
}

.logs-content {
  height: 100%;
}

.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.logs-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.logs-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

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

.filter-section {
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.input-icon {
  margin-right: 0;
}
</style>
