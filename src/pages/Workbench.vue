<template>
  <div class="workbench-container">
    <!-- 今日检查情况 -->
    <div class="today-exam-section">
      <a-card :loading="isLoading">
        <template #title>
          <div class="today-exam-header" @click="toggleTodayExam">
            <span class="header-title">今日检查情况</span>
            <div class="expand-icon-wrapper">
              <UpOutlined v-if="isTodayExamExpanded" class="expand-icon" />
              <DownOutlined v-else class="expand-icon" />
            </div>
            <span class="stat-info">
              <span class="stat-item">复查：<span class="stat-number">{{ todayReviewCount }}</span> 人</span>
              <span class="stat-divider">|</span>
              <span class="stat-item">新建：<span class="stat-number">{{ todayRegisterCount }}</span> 人</span>
            </span>
          </div>
        </template>
        <template #extra>
          <a-date-picker
            v-model:value="selectedDate"
            :format="dateFormat"
            :locale="locale"
            size="small"
            @change="handleDateChange"
          />
          <a-button 
            type="link" 
            size="small" 
            @click="fetchTodayData"
            :loading="isLoading"
            style="margin-left: 8px;"
          >
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
        </template>
        
        <transition name="slide-fade">
          <div v-show="isTodayExamExpanded">
            <a-row :gutter="16">
          <!-- 复查患者 -->
          <a-col :span="12">
            <a-card class="exam-card review-card" :bordered="false">
              <div class="card-header">
                <FileSearchOutlined class="card-icon" />
                <span class="card-title">复查患者</span>
                <a-tag color="blue" style="margin-left: 8px;">{{ todayReviewCount }} 人</a-tag>
            </div>
              <div class="patient-cards-container">
                <a-row :gutter="[12, 12]">
                  <a-col :flex="1" :style="{ minWidth: '18%', maxWidth: '20%' }" v-for="patient in todayReviewPatients" :key="patient.id || patient.gkid">
                    <div class="patient-card patient-card-review" @click="viewPatient(patient)">
                      <div class="patient-name">{{ patient.name }}</div>
                      <div class="patient-gkid">{{ patient.gkid }}</div>
              </div>
                  </a-col>
                  <div v-if="todayReviewPatients.length === 0" class="empty-state">
                    暂无数据
            </div>
                </a-row>
          </div>
        </a-card>
          </a-col>
          
          <!-- 新建患者 -->
          <a-col :span="12">
            <a-card class="exam-card register-card" :bordered="false">
              <div class="card-header">
                <UserAddOutlined class="card-icon" />
                <span class="card-title">新建患者</span>
                <a-tag color="green" style="margin-left: 8px;">{{ todayRegisterCount }} 人</a-tag>
            </div>
              <div class="patient-cards-container">
                <a-row :gutter="[12, 12]">
                  <a-col :flex="1" :style="{ minWidth: '18%', maxWidth: '20%' }" v-for="patient in todayRegisterPatients" :key="patient.id || patient.gkid">
                    <div class="patient-card patient-card-register" @click="viewPatient(patient)">
                      <div class="patient-name">{{ patient.name }}</div>
                      <div class="patient-gkid">{{ patient.gkid }}</div>
              </div>
                  </a-col>
                  <div v-if="todayRegisterPatients.length === 0" class="empty-state">
                    暂无数据
            </div>
                </a-row>
          </div>
        </a-card>
          </a-col>
        </a-row>
            </div>
        </transition>
        </a-card>
    </div>

    <!-- 周复查患者提醒 -->
    <div class="week-reminder-section" style="margin-top: 16px;">
      <a-card :loading="isWeekLoading">
        <template #title>
          <div class="week-reminder-header" @click="toggleWeekReminder">
            <span class="header-title">周复查患者提醒</span>
            <div class="expand-icon-wrapper">
              <UpOutlined v-if="isWeekReminderExpanded" class="expand-icon" />
              <DownOutlined v-else class="expand-icon" />
            </div>
          </div>
        </template>
        <template #extra>
          <a-button 
            type="link" 
            size="small" 
            @click="fetchWeekReminders"
            :loading="isWeekLoading"
          >
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
        </template>
        
        <transition name="slide-fade">
          <div v-show="isWeekReminderExpanded">
            <!-- 14天日历 -->
            <div class="calendar-container">
          <div class="calendar-grid">
            <div 
              v-for="day in weekCalendarDays" 
              :key="day.date"
              class="calendar-day"
              :class="{ 
                'today': day.isToday, 
                'weekend': day.isWeekend,
                'has-patients': day.patientCount > 0,
                'selected': selectedCalendarDate === day.date
              }"
              @click="onCalendarDayClick(day.date)"
            >
              <div class="calendar-day-header">
                <div class="day-label">{{ day.dayLabel }}</div>
                <div class="day-date">{{ day.dateLabel }}</div>
          </div>
              <div class="calendar-day-content">
                <div class="patient-count" v-if="day.patientCount > 0">
                  <a-badge :count="day.patientCount" :number-style="{ backgroundColor: '#E27244' }" />
          </div>
                <div class="no-patients" v-else>
                  <span class="zero-count">0</span>
          </div>
        </div>
    </div>
        </div>
        </div>
        
        <!-- 患者列表 -->
        <div class="patients-list-container" style="margin-top: 24px;">
          <div class="patients-list-header" @click="togglePatientsList">
            <div class="header-title">
              <span>患者列表</span>
              <span class="patient-count-badge" v-if="filteredWeekReminderPatients.length > 0">
                ({{ filteredWeekReminderPatients.length }})
          </span>
        </div>
            <div class="expand-icon-wrapper">
              <UpOutlined v-if="isPatientsListExpanded" class="expand-icon" />
              <DownOutlined v-else class="expand-icon" />
        </div>
          </div>
          <transition name="slide-fade">
            <div v-show="isPatientsListExpanded" class="patients-list-content">
              <a-table
            :columns="reminderColumns"
            :data-source="filteredWeekReminderPatients"
            :pagination="{ pageSize: 15, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }"
            size="middle"
            :row-class-name="getRowClassName"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <a @click="viewPatient(record)">{{ record.patient_name || record.name }}</a>
              </template>
              <template v-else-if="column.key === 'review_date'">
                <span :class="{ 'overdue': isOverdue(record.review_date) }">
                  {{ formatDate(record.review_date) }}
                  <a-tag v-if="isOverdue(record.review_date)" color="red" size="small" style="margin-left: 8px;">
                    逾期
          </a-tag>
          </span>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ record.status || '待提醒' }}
          </a-tag>
      </template>
              </template>
          </a-table>
          </div>
          </transition>
        </div>
            </div>
        </transition>
      </a-card>
      </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getNetworkStatus, fetchWithRetry } from '@/utils/networkManager';
import { 
  FileSearchOutlined, 
  UserAddOutlined,
  ReloadOutlined,
  UpOutlined,
  DownOutlined
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { pinyin } from 'pinyin-pro';

/** 按姓名首字母（拼音）排序，用于复查/新建患者列表 */
function sortPatientsByName(patients) {
  if (!Array.isArray(patients) || patients.length === 0) return patients;
  return [...patients].sort((a, b) => {
    const nameA = (a.name || '').trim();
    const nameB = (b.name || '').trim();
    const keyA = nameA ? pinyin(nameA, { toneType: 'none', pattern: 'first' }).toLowerCase() : '';
    const keyB = nameB ? pinyin(nameB, { toneType: 'none', pattern: 'first' }).toLowerCase() : '';
    return keyA.localeCompare(keyB, 'zh-CN');
  });
}

// 设置dayjs为中文
dayjs.locale('zh-cn');

// 中文日期选择器配置
const locale = {
  lang: {
    locale: 'zh-cn',
    placeholder: '选择日期',
    today: '今天',
    now: '此刻',
    backToToday: '返回今天',
    ok: '确定',
    clear: '清除',
    month: '月',
    year: '年',
    timeSelect: '选择时间',
    dateSelect: '选择日期',
    weekSelect: '选择周',
    monthSelect: '选择月份',
    yearSelect: '选择年份',
    decadeSelect: '选择年代',
    yearFormat: 'YYYY年',
    dateFormat: 'YYYY年M月D日',
    dayFormat: 'D日',
    dateTimeFormat: 'YYYY年M月D日 HH时mm分ss秒',
    monthBeforeYear: true,
    previousMonth: '上个月 (PageUp)',
    nextMonth: '下个月 (PageDown)',
    previousYear: '上一年 (Control + left)',
    nextYear: '下一年 (Control + right)',
    previousDecade: '上一年代',
    nextDecade: '下一年代',
    previousCentury: '上一世纪',
    nextCentury: '下一世纪',
  },
  timePickerLocale: {
    placeholder: '请选择时间',
  },
  dateFormat: 'YYYY-MM-DD',
  dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
  weekFormat: 'YYYY-wo',
  monthFormat: 'YYYY-MM',
};

// 日期相关
const selectedDate = ref(dayjs());
const dateFormat = 'YYYY-MM-DD';

// 加载状态
const isLoading = ref(false);
const isWeekLoading = ref(false);

// 今日数据
const todayReviewCount = ref(0);
const todayRegisterCount = ref(0);
const todayReviewPatients = ref([]);
const todayRegisterPatients = ref([]);

// 周提醒数据
const weekReminderPatients = ref([]);
const weekCalendarDays = ref([]);
const selectedCalendarDate = ref(''); // 选中的日期，用于筛选
const isPatientsListExpanded = ref(true); // 患者列表是否展开（默认展开）
const isTodayExamExpanded = ref(false); // 今日检查情况是否展开（默认收缩）
const isWeekReminderExpanded = ref(true); // 周复查患者提醒是否展开（默认展开）

// 表格列定义
const reviewColumns = [
  {
    title: '患者姓名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '患者编号',
    dataIndex: 'gkid',
    key: 'gkid',
  },
];

const registerColumns = [
  {
    title: '患者姓名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '患者编号',
    dataIndex: 'gkid',
    key: 'gkid',
  },
];

const reminderColumns = [
  {
    title: '患者姓名',
    dataIndex: 'patient_name',
    key: 'name',
  },
  {
    title: '患者编号',
    dataIndex: 'gkid',
    key: 'gkid',
  },
  {
    title: '性别',
    dataIndex: 'gender',
    key: 'gender',
  },
  {
    title: '电话',
    dataIndex: 'phone',
    key: 'phone',
  },
  {
    title: '复查日期',
    dataIndex: 'review_date',
    key: 'review_date',
    sorter: (a, b) => {
      const dateA = dayjs(a.review_date);
      const dateB = dayjs(b.review_date);
      return dateA.diff(dateB);
    },
    sortDirections: ['ascend', 'descend'],
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '备注',
    dataIndex: 'remarks',
    key: 'remarks',
    ellipsis: true,
  },
];

// 获取今日检查数据（带网络检测和离线模式）
const fetchTodayData = async () => {
  isLoading.value = true;
  try {
    const organizationId = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    const queryDate = selectedDate.value.format('YYYY-MM-DD');
    
    // 检查网络状态
    const networkInfo = getNetworkStatus();
    if (networkInfo.isOffline) {
      // 离线模式：从本地存储加载
      const cacheKey = `today_data_${organizationId}_${queryDate}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const data = JSON.parse(cachedData);
          todayReviewPatients.value = sortPatientsByName(data.reviewPatients || []);
          todayReviewCount.value = todayReviewPatients.value.length;
          todayRegisterPatients.value = sortPatientsByName(data.registerPatients || []);
          todayRegisterCount.value = todayRegisterPatients.value.length;
          message.warning('网络不可用，已加载缓存数据');
          return;
        } catch (e) {
          console.warn('加载缓存数据失败:', e);
        }
      }
      message.warning('网络不可用，且无缓存数据');
      return;
    }
    
    try {
      // 获取今日复查数据（带重试）
      const reviewResponse = await fetchWithRetry(
        'https://aiforoptometry.com/medicalrecords/search_same_day_recheck',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          credentials: 'include',
          body: JSON.stringify({
            date: queryDate,
            organization_id: organizationId
          })
        },
        2, // 最多重试2次
        2000 // 每次间隔2秒
      );
      
      const reviewData = await reviewResponse.json();
      todayReviewPatients.value = sortPatientsByName(reviewData.patients || []);
      todayReviewCount.value = todayReviewPatients.value.length;
      
      // 获取今日新建患者数据（带重试）
      const registerResponse = await fetchWithRetry(
        'https://aiforoptometry.com/medicalrecords/search_same_day_registered',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          credentials: 'include',
          body: JSON.stringify({
            date: queryDate,
            organization_id: organizationId
          })
        },
        2,
        2000
      );
      
      const registerData = await registerResponse.json();
      todayRegisterPatients.value = sortPatientsByName(registerData.patients || []);
      todayRegisterCount.value = todayRegisterPatients.value.length;
      
      // 保存到本地缓存
      const cacheKey = `today_data_${organizationId}_${queryDate}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        reviewPatients: todayReviewPatients.value,
        registerPatients: todayRegisterPatients.value,
        timestamp: Date.now()
      }));
      
      message.success('数据加载成功');
    } catch (error) {
      console.error('获取今日检查数据失败:', error);
      
      // 检查是否为服务器错误（404/502/503/504）或网络错误
      const errorMsg = error.message || error.toString() || '';
      const isServerError = errorMsg.includes('服务器错误: 404') ||
                           errorMsg.includes('服务器错误: 502') ||
                           errorMsg.includes('服务器错误: 503') ||
                           errorMsg.includes('服务器错误: 504') ||
                           errorMsg.includes('404') ||
                           errorMsg.includes('502') ||
                           errorMsg.includes('503') ||
                           errorMsg.includes('504');
      const isNetworkError = error.name === 'TypeError' ||
                            error.name === 'AbortError' ||
                            errorMsg.includes('Failed to fetch') ||
                            errorMsg.includes('CORS') ||
                            errorMsg.includes('网络连接失败') ||
                            isServerError;
      
      // 尝试从缓存加载
      const cacheKey = `today_data_${organizationId}_${queryDate}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const data = JSON.parse(cachedData);
          todayReviewPatients.value = sortPatientsByName(data.reviewPatients || []);
          todayReviewCount.value = todayReviewPatients.value.length;
          todayRegisterPatients.value = sortPatientsByName(data.registerPatients || []);
          todayRegisterCount.value = todayRegisterPatients.value.length;
          if (isServerError) {
            message.warning('服务器暂时不可用，已使用缓存数据');
          } else if (isNetworkError) {
            message.warning('网络连接失败，已使用缓存数据');
          } else {
            message.warning('数据加载失败，已使用缓存数据');
          }
        } catch (e) {
          if (isServerError) {
            message.warning('服务器暂时不可用，且无缓存数据');
          } else if (isNetworkError) {
            message.warning('网络连接失败，且无缓存数据');
          } else {
            message.error('获取数据失败，请稍后重试');
          }
        }
      } else {
        if (isServerError) {
          message.warning('服务器暂时不可用，且无缓存数据');
        } else if (isNetworkError) {
          message.warning('网络连接失败，且无缓存数据');
        } else {
          message.error('获取数据失败，请稍后重试');
        }
      }
    }
  } catch (error) {
    console.error('获取今日检查数据出错:', error);
    message.error('获取数据失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};

// 生成14天日历数据（本周+下周）
const generateWeekCalendar = () => {
  const today = dayjs();
  const startOfWeek = today.startOf('week'); // 本周一
  const days = [];
  
  for (let i = 0; i < 14; i++) {
    const date = startOfWeek.add(i, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    const isToday = date.isSame(today, 'day');
    const dayOfWeek = date.day();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    days.push({
      date: dateStr,
      dateLabel: date.format('MM/DD'),
      dayLabel: dayLabels[dayOfWeek],
      isToday,
      isWeekend,
      patientCount: 0
    });
  }
  
  return days;
};

// 获取周复查患者提醒（14天）
const fetchWeekReminders = async () => {
  isWeekLoading.value = true;
  try {
    // 生成14天日历
    weekCalendarDays.value = generateWeekCalendar();
    
    const organizationId = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (!organizationId) {
      message.error('未找到机构信息，请重新登录');
      return;
    }

    // 获取14天的日期范围
    const today = dayjs();
    const startOfWeek = today.startOf('week');
    const startDate = startOfWeek.format('YYYY-MM-DD');
    const endDate = startOfWeek.add(13, 'day').format('YYYY-MM-DD');
    
    // 检查网络状态
    const networkInfo = getNetworkStatus();
    if (networkInfo.isOffline) {
      // 离线模式：从本地存储加载
      const cacheKey = `week_reminders_${organizationId}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const data = JSON.parse(cachedData);
          weekReminderPatients.value = data.patients || [];
          updateCalendarWithPatients(data.patients || []);
          message.warning('网络不可用，已加载缓存数据');
          return;
        } catch (e) {
          console.warn('加载缓存数据失败:', e);
        }
      }
      message.warning('网络不可用，且无缓存数据');
      return;
    }
    
    try {
      // 获取复查提醒数据（带重试）
      const response = await fetchWithRetry(
        `https://aiforoptometry.com/api/review/latest_by_org/${organizationId}/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          credentials: 'include',
          body: JSON.stringify({
            status: ['待提醒', '已改期', '已提醒']
          })
        },
        2, // 最多重试2次
        2000 // 每次间隔2秒
      );
    
    if (!response.ok) {
      // 404 或 502 错误，抛出错误以便触发缓存加载
      if (response.status === 404 || response.status >= 500) {
        throw new Error(`服务器错误: ${response.status}`);
      }
      throw new Error(`请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 处理返回的数据
    let allPatients = [];
    if (data && data.items && Array.isArray(data.items)) {
      allPatients = data.items;
    } else if (Array.isArray(data)) {
      allPatients = data;
    }
    
    // 筛选14天的数据并按日期排序
    const filteredPatients = allPatients.filter(patient => {
      if (!patient.review_date) return false;
      const reviewDate = dayjs(patient.review_date);
      return reviewDate.isAfter(dayjs(startDate).subtract(1, 'day')) && 
             reviewDate.isBefore(dayjs(endDate).add(1, 'day'));
    });
    
    // 按日期排序
    filteredPatients.sort((a, b) => {
      const dateA = dayjs(a.review_date);
      const dateB = dayjs(b.review_date);
      return dateA.diff(dateB);
    });
    
    weekReminderPatients.value = filteredPatients;
    
    // 统计每天的患者数量
    const dateCountMap = {};
    filteredPatients.forEach(patient => {
      const dateStr = dayjs(patient.review_date).format('YYYY-MM-DD');
      dateCountMap[dateStr] = (dateCountMap[dateStr] || 0) + 1;
    });
    
    // 更新日历中的患者数量
    weekCalendarDays.value.forEach(day => {
      day.patientCount = dateCountMap[day.date] || 0;
    });
    
    // 保存到本地缓存
    const cacheKey = `week_reminders_${organizationId}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      patients: filteredPatients,
      timestamp: Date.now()
    }));
    
    message.success('数据加载成功');
    } catch (error) {
      console.error('获取周复查提醒数据失败:', error);
      
      // 检查是否为服务器错误（404/502/503/504）或网络错误
      const errorMsg = error.message || error.toString() || '';
      const isServerError = errorMsg.includes('服务器错误: 404') ||
                           errorMsg.includes('服务器错误: 502') ||
                           errorMsg.includes('服务器错误: 503') ||
                           errorMsg.includes('服务器错误: 504') ||
                           errorMsg.includes('404') ||
                           errorMsg.includes('502') ||
                           errorMsg.includes('503') ||
                           errorMsg.includes('504');
      const isNetworkError = error.name === 'TypeError' ||
                            error.name === 'AbortError' ||
                            errorMsg.includes('Failed to fetch') ||
                            errorMsg.includes('CORS') ||
                            errorMsg.includes('网络连接失败') ||
                            isServerError;
      
      // 尝试从缓存加载
      const cacheKey = `week_reminders_${organizationId}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const data = JSON.parse(cachedData);
          weekReminderPatients.value = data.patients || [];
          updateCalendarWithPatients(data.patients || []);
          if (isServerError) {
            message.warning('服务器暂时不可用，已使用缓存数据');
          } else if (isNetworkError) {
            message.warning('网络连接失败，已使用缓存数据');
          } else {
            message.warning('数据加载失败，已使用缓存数据');
          }
        } catch (e) {
          if (isServerError) {
            message.warning('服务器暂时不可用，且无缓存数据');
          } else if (isNetworkError) {
            message.warning('网络连接失败，且无缓存数据');
          } else {
            message.error('获取数据失败，请稍后重试');
          }
        }
      } else {
        if (isServerError) {
          message.warning('服务器暂时不可用，且无缓存数据');
        } else if (isNetworkError) {
          message.warning('网络连接失败，且无缓存数据');
        } else {
          message.error('获取数据失败，请稍后重试');
        }
      }
    }
  } catch (error) {
    console.error('获取周复查提醒数据出错:', error);
    message.error('获取数据失败，请稍后重试');
  } finally {
    isWeekLoading.value = false;
  }
};

// 更新日历中的患者数量
const updateCalendarWithPatients = (patients) => {
  const dateCountMap = {};
  patients.forEach(patient => {
    if (patient.review_date) {
      const dateStr = dayjs(patient.review_date).format('YYYY-MM-DD');
      dateCountMap[dateStr] = (dateCountMap[dateStr] || 0) + 1;
    }
  });
  
  weekCalendarDays.value.forEach(day => {
    day.patientCount = dateCountMap[day.date] || 0;
  });
};

// 日期变化处理
const handleDateChange = () => {
  fetchTodayData();
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD');
};

// 判断是否逾期
const isOverdue = (reviewDate) => {
  if (!reviewDate) return false;
  return dayjs(reviewDate).isBefore(dayjs(), 'day');
};

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    '待提醒': 'orange',
    '已提醒': 'green',
    '已改期': 'blue',
    '已复查': 'cyan',
    '已逾期': 'red',
  };
  return colorMap[status] || 'default';
};

// 获取表格行的类名
const getRowClassName = (record) => {
  if (isOverdue(record.review_date)) {
    return 'overdue-row';
  }
  return '';
};

// 过滤后的患者列表（根据选中的日期）
const filteredWeekReminderPatients = computed(() => {
  if (!selectedCalendarDate.value) {
    return weekReminderPatients.value;
  }
  return weekReminderPatients.value.filter(patient => {
    const patientDate = dayjs(patient.review_date).format('YYYY-MM-DD');
    return patientDate === selectedCalendarDate.value;
  });
});

// 日历日期点击事件
const onCalendarDayClick = (date) => {
  if (selectedCalendarDate.value === date) {
    // 如果点击的是已选中的日期，则取消选择
    selectedCalendarDate.value = '';
  } else {
    // 否则选中该日期
    selectedCalendarDate.value = date;
  }
};

// 切换患者列表展开/收缩
const togglePatientsList = () => {
  isPatientsListExpanded.value = !isPatientsListExpanded.value;
};

// 切换今日检查情况展开/收缩
const toggleTodayExam = () => {
  isTodayExamExpanded.value = !isTodayExamExpanded.value;
};

// 切换周复查患者提醒展开/收缩
const toggleWeekReminder = () => {
  isWeekReminderExpanded.value = !isWeekReminderExpanded.value;
};

// 查看患者
const viewPatient = (record) => {
  console.log('点击患者卡片，原始数据:', record);
  
  // 构建格式化后的患者记录
  // 确保 patient_id 正确：优先使用 patient_id，如果没有则使用 id
  const patientId = record.patient_id || record.id || record.patient?.id;
  
  const formattedRecord = {
    patient_id: patientId,
    patient: {
      id: patientId, // 确保 patient 对象中也有 id
      gkid: record.gkid || record.patient?.gkid,
      name: record.patient_name || record.name || record.patient?.name,
      gender: record.gender || record.patient_gender || record.patient?.gender,
      birthDate: record.birthDate || record.birth_date || record.patient?.birthDate,
      phone: record.phone || record.patient_phone || record.patient?.phone
    }
  };
  
  console.log('格式化后的患者记录:', formattedRecord);
  
  // 触发查看患者事件
  const event = new CustomEvent('view-patient', { detail: formattedRecord });
  window.dispatchEvent(event);
};

// 页面加载时获取数据
onMounted(() => {
  fetchTodayData();
  fetchWeekReminders();
});
</script>

<style scoped>
.workbench-container {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100vh;
}

.today-exam-section {
  margin-bottom: 16px;
}

/* 今日检查情况标题栏 */
.today-exam-header {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
}

.today-exam-header .header-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.today-exam-header .stat-info {
  font-size: 18px;
  font-weight: normal;
  color: #666;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 8px;
}

.today-exam-header .stat-item {
  display: inline-flex;
  align-items: center;
}

.today-exam-header .stat-number {
  color: #E27244;
  font-weight: 600;
  margin: 0 4px;
  font-size: 18px;
}

.today-exam-header .stat-divider {
  color: #d9d9d9;
}

/* 确保今日检查情况标题与周复查患者提醒标题字体一致 */
:deep(.today-exam-section .ant-card-head-title) {
  font-size: 18px;
  font-weight: 600;
}

/* 周复查患者提醒标题栏 */
.week-reminder-header {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
}

.week-reminder-header .header-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 确保周复查患者提醒标题字体一致 */
:deep(.week-reminder-section .ant-card-head-title) {
  font-size: 18px;
  font-weight: 600;
}

.exam-card {
  height: 100%;
  border-radius: 8px;
}

.review-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.register-card {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
}

.card-icon {
  font-size: 20px;
  margin-right: 8px;
  color: #E27244;
}

.card-title {
  flex: 1;
}

/* 患者卡片容器 */
.patient-cards-container {
  padding: 8px 0;
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 自定义滚动条样式 */
.patient-cards-container::-webkit-scrollbar {
  width: 8px;
}

.patient-cards-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.patient-cards-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.patient-cards-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.patient-cards-container :deep(.ant-row) {
  display: flex;
  flex-wrap: wrap;
}

.patient-cards-container :deep(.ant-col) {
  flex: 0 0 calc(20% - 10px);
  max-width: calc(20% - 10px);
  margin-bottom: 12px;
}

/* 患者卡片样式 */
.patient-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 80px;
}

/* 复查患者卡片 - 蓝色系 */
.patient-card-review {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-color: #90caf9;
}

.patient-card-review:hover {
  border-color: #42a5f5;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
  transform: translateY(-2px);
  background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
}

/* 新建患者卡片 - 绿色系 */
.patient-card-register {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-color: #a5d6a7;
}

.patient-card-register:hover {
  border-color: #66bb6a !important;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3) !important;
  transform: translateY(-2px);
  background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
}

.patient-card-review:hover {
  border-color: #42a5f5 !important;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3) !important;
  transform: translateY(-2px);
  background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
}

.patient-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.patient-gkid {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px 0;
  width: 100%;
  grid-column: 1 / -1;
}

.week-reminder-section {
  margin-top: 16px;
}

/* 14天日历样式 */
.calendar-container {
  margin-bottom: 24px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.calendar-day {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: all 0.3s ease;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.calendar-day:hover {
  border-color: #E27244;
  box-shadow: 0 2px 8px rgba(226, 114, 68, 0.15);
}

.calendar-day.today {
  border-color: #E27244;
  background: #fff7e6;
  border-width: 2px;
}

.calendar-day.weekend {
  background: #fafafa;
}

.calendar-day.has-patients {
  background: #f0f9ff;
  border-color: #91d5ff;
}

.calendar-day.selected {
  background: #fff7e6;
  border-color: #E27244;
  border-width: 2px;
  box-shadow: 0 4px 12px rgba(226, 114, 68, 0.3);
  transform: scale(1.02);
}

.calendar-day {
  cursor: pointer;
}

.calendar-day-header {
  margin-bottom: 8px;
}

.day-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.day-date {
  font-size: 16px;
  font-weight: 500;
    color: #333;
}

.calendar-day.today .day-date {
  color: #E27244;
  font-weight: 600;
}

.calendar-day-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.patient-count {
  font-size: 18px;
  font-weight: 600;
  color: #E27244;
}

.no-patients .zero-count {
  font-size: 14px;
  color: #999;
}

.patients-list-container {
  margin-top: 24px;
}

/* 患者列表标题栏 */
.patients-list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.patients-list-header:hover {
  background: #f0f0f0;
  border-color: #E27244;
}

.header-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  gap: 8px;
}

/* 确保患者列表标题与周复查患者提醒标题字体一致 */
:deep(.week-reminder-section .ant-card-head-title) {
  font-size: 18px;
  font-weight: 600;
}

.patient-count-badge {
  font-size: 14px;
  color: #E27244;
  font-weight: 600;
}

.expand-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #fff;
  border: 2px solid #E27244;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(226, 114, 68, 0.2);
}

.patients-list-header:hover .expand-icon-wrapper {
  background: #E27244;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(226, 114, 68, 0.3);
}

.expand-icon {
  font-size: 14px;
  color: #E27244;
  transition: all 0.3s ease;
  font-weight: bold;
}

.patients-list-header:hover .expand-icon {
  color: #fff;
}

/* 患者列表内容 */
.patients-list-content {
  border: 1px solid #e8e8e8;
  border-top: none;
  border-radius: 0 0 6px 6px;
  overflow: hidden;
}

/* 患者列表字体大小 - 与周复查患者提醒Card内容字体一致 */
:deep(.patients-list-content .ant-table) {
  font-size: 14px;
}

:deep(.patients-list-content .ant-table-thead > tr > th) {
  font-size: 14px;
  font-weight: 600;
  padding: 12px 16px;
  white-space: nowrap;
}

:deep(.patients-list-content .ant-table-tbody > tr > td) {
  font-size: 14px;
  padding: 12px 16px;
  white-space: nowrap;
}

/* 患者编号列允许换行 */
:deep(.patients-list-content .ant-table-tbody > tr > td:nth-child(2)) {
  white-space: normal;
  word-break: break-all;
}

/* 复查日期列允许换行，以便显示日期和标签 */
:deep(.patients-list-content .ant-table-tbody > tr > td:nth-child(6)) {
  white-space: normal;
}

/* 状态列允许换行，以便显示多个标签 */
:deep(.patients-list-content .ant-table-tbody > tr > td:nth-child(7)) {
  white-space: normal;
}

/* 备注列允许换行 */
:deep(.patients-list-content .ant-table-tbody > tr > td:nth-child(8)) {
  white-space: normal;
  word-break: break-all;
}

:deep(.patients-list-content .ant-table-tbody > tr > td a) {
  font-size: 14px;
}

:deep(.patients-list-content .ant-tag) {
  font-size: 18px;
  padding: 4px 12px;
}

/* 展开/收缩动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.overdue {
  color: #ff4d4f;
  font-weight: 500;
}

:deep(.ant-table-tbody > tr.overdue-row > td) {
  background-color: #fff1f0;
}

:deep(.ant-table-tbody > tr.overdue-row:hover > td) {
  background-color: #ffe7e5;
}
</style> 
