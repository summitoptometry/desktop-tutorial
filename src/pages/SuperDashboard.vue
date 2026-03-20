<template>
  <div class="super-dashboard">
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <h1>超级工作台</h1>
          <p>欢迎使用超级管理员工作台</p>
        </div>
        <div class="header-right">
          <a-date-picker
            v-model:value="selectedActiveDate"
            :format="dateFormat"
            :locale="locale"
            size="default"
            @change="handleActiveDateChange"
            class="active-date-picker"
            placeholder="选择日期"
          />
          <a-button 
            type="primary" 
            :loading="manualUpdateLoading"
            @click="handleManualUpdate"
            class="manual-update-btn"
          >
            <template #icon><ReloadOutlined /></template>
            手动更新数据
          </a-button>
        </div>
      </div>
    </div>
    
    <div class="dashboard-content">
             <div class="stats-cards">
                   <div class="stat-card" @click="openOrganizationModal">
            <div class="stat-number">{{ stats.totalOrganizations }}</div>
            <div class="stat-label">总机构数</div>
          </div>
          <div class="stat-card" @click="openStatsModal">
            <div class="stat-number">{{ stats.totalPatients }}</div>
            <div class="stat-label">总患者数</div>
          </div>
          <div class="stat-card" @click="openStatsModal">
            <div class="stat-number">{{ stats.totalExaminations }}</div>
            <div class="stat-label">总检查次数</div>
          </div>
                   <div class="stat-card" @click="openTodayActiveModal">
            <div class="today-active-header">
              <div class="active-date-label">
                {{ selectedActiveDate.format('MM-DD') }} 活跃数据
              </div>
            </div>
            <div class="today-active-numbers">
                             <div class="active-item">
                 <div class="active-number red">{{ stats.todayReview }}</div>
                 <div class="active-label">今日复查</div>
               </div>
               <div class="active-item">
                 <div class="active-number blue">{{ stats.todayRegister }}</div>
                 <div class="active-label">今日新增</div>
               </div>
               <div class="active-item">
                 <div class="active-number green">{{ stats.todayIncomplete }}</div>
                 <div class="active-label">未完善</div>
               </div>
               <div class="active-item">
                 <div class="active-number yellow">{{ stats.todayReminder }}</div>
                 <div class="active-label">需提醒</div>
               </div>
            </div>
          </div>
       </div>
      
      <div class="quick-actions">
        <h2>快速操作</h2>
        <div class="action-buttons">
          <a-button type="primary" size="large">
            <template #icon><TeamOutlined /></template>
            机构管理
          </a-button>
          <a-button type="primary" size="large">
            <template #icon><UserOutlined /></template>
            用户管理
          </a-button>
          <a-button type="primary" size="large" @click="openDataStatsModal">
            <template #icon><BarChartOutlined /></template>
            数据统计
          </a-button>
          <a-button type="primary" size="large">
            <template #icon><SettingOutlined /></template>
            系统设置
          </a-button>
          <a-button type="primary" size="large" @click="openChartModal">
            <template #icon><BarChartOutlined /></template>
            图表展示
          </a-button>
        </div>
      </div>
      
      <div class="organization-tree">
        <h2>机构树数据 (已保存到localStorage)</h2>
        <div class="tree-content">
          <a-spin :spinning="loading" tip="正在获取所有页的机构数据...">
                         <div v-if="organizationTree.length > 0" class="tree-data">
               <div style="margin-bottom: 16px; color: #52c41a; font-weight: bold;">
                 共获取 {{ organizationTree.length - 1 }} 个子机构（不包括当前机构），数据已保存到localStorage (键名: 机构树)
               </div>
              <pre>{{ JSON.stringify(organizationTree, null, 2) }}</pre>
            </div>
            <div v-else-if="!loading" class="no-data">
              暂无机构数据
            </div>
          </a-spin>
        </div>
      </div>
      
      <div class="recent-activities">
        <h2>最近活动</h2>
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-time">2024-01-01 10:00</div>
            <div class="activity-content">暂无活动记录</div>
          </div>
        </div>
             </div>
     </div>
     
           <!-- 机构列表弹窗 -->
      <a-modal
        v-model:visible="organizationModalVisible"
        title="机构列表"
        width="800px"
        :footer="null"
        @cancel="closeOrganizationModal"
      >
        <div class="organization-modal-content">
                    <a-table
             :columns="organizationColumns"
             :data-source="organizationTree"
             :pagination="pagination"
             :loading="tableLoading"
             row-key="id"
             size="middle"
             @change="handleTableChange"
           >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'id'">
                <span class="org-id">{{ record.id }}</span>
              </template>
              <template v-else-if="column.key === 'name'">
                <span class="org-name">{{ record.name }}</span>
              </template>
              <template v-else-if="column.key === 'contact'">
                <span class="org-contact">{{ record.contact || '-' }}</span>
              </template>
              <template v-else-if="column.key === 'username'">
                <span class="org-username">{{ record.username || '-' }}</span>
              </template>
            </template>
          </a-table>
        </div>
      </a-modal>

                    <!-- 机构统计数据弹窗 -->
        <a-modal
          v-model:visible="statsModalVisible"
          width="1215px"
          :footer="null"
          :bodyStyle="{ height: '80vh', padding: '16px' }"
          @cancel="closeStatsModal"
        >
          <template #title>
            <div style="display: flex; align-items: center; justify-content: center; width: 100%; position: relative;">
              <span style="position: absolute; left: 0;">机构统计数据</span>
              <a-tabs
                v-model:activeKey="statsModalActiveTab"
                size="small"
                style="margin: 0;"
                @change="handleStatsTabChange"
              >
                <a-tab-pane key="table" tab="表格" />
                <a-tab-pane key="chart" tab="图表" />
              </a-tabs>
              <div style="position: absolute; right: 0;">
                <a-button 
                  type="primary" 
                  size="small"
                  @click="exportOrgStatsToExcel"
                  :loading="statsTableLoading"
                  :disabled="!statsTableData.length"
                >
                  <template #icon><DownloadOutlined /></template>
                  导出Excel
                </a-button>
              </div>
            </div>
          </template>
                 <div class="stats-modal-content">
           <!-- 表格视图 -->
           <div v-if="statsModalActiveTab === 'table'">
             <a-table
               :columns="statsColumns"
               :data-source="statsTableData"
               :pagination="false"
               :loading="statsTableLoading"
               row-key="id"
               size="middle"
               :scroll="{ y: 'calc(80vh - 120px)' }"
               @change="handleStatsTableChange"
             >
               <template #bodyCell="{ column, record }">
                 <template v-if="column.key === 'name'">
                   <span class="org-name">{{ record.name }}</span>
                 </template>
                 <template v-else-if="column.key === 'contact'">
                   <span class="org-contact">{{ record.contact || '-' }}</span>
                 </template>
                 <template v-else-if="column.key === 'total_patients'">
                   <span class="stats-number">{{ record.total_patients || 0 }}</span>
                 </template>
                 <template v-else-if="column.key === 'total_examinations'">
                   <span class="stats-number">{{ record.total_examinations || 0 }}</span>
                 </template>
               </template>
             </a-table>
           </div>
           
           <!-- 图表视图 -->
           <div v-else-if="statsModalActiveTab === 'chart'" class="chart-container">
             <div ref="statsChartRef" class="stats-chart"></div>
           </div>
         </div>
      </a-modal>

      <!-- 今日活跃数据弹窗 -->
      <a-modal
        v-model:visible="todayActiveModalVisible"
        width="1215px"
        :footer="null"
        :bodyStyle="{ height: '80vh', padding: '16px' }"
        @cancel="closeTodayActiveModal"
      >
        <template #title>
          <div style="display: flex; align-items: center; justify-content: center; width: 100%; position: relative;">
            <span style="position: absolute; left: 0;">今日活跃数据</span>
            <a-tabs
              v-model:activeKey="todayActiveModalActiveTab"
              size="small"
              style="margin: 0;"
              @change="handleTodayActiveTabChange"
            >
              <a-tab-pane key="table" tab="表格" />
              <a-tab-pane key="chart" tab="图表" />
            </a-tabs>
          </div>
        </template>
        <div class="today-active-modal-content">
          <!-- 表格视图 -->
          <div v-if="todayActiveModalActiveTab === 'table'">
            <!-- 排序状态显示和清除按钮 -->
            <div v-if="multiSortState.length > 0" class="sort-status-bar">
              <span class="sort-status-text">
                当前排序: 
                <span v-for="(condition, index) in multiSortState" :key="condition.field" class="sort-condition">
                  {{ getColumnTitle(condition.field) }}{{ condition.order === 'ascend' ? '↑' : '↓' }}
                  <span v-if="index < multiSortState.length - 1" class="sort-separator">, </span>
                </span>
              </span>
              <a-button 
                type="link" 
                size="small" 
                @click="clearAllSorting"
                class="clear-sort-btn"
              >
                清除排序
              </a-button>
            </div>
            
            <a-table
              :columns="todayActiveColumns"
              :data-source="sortedTodayActiveTableData"
              :pagination="false"
              :loading="todayActiveTableLoading"
              row-key="id"
              size="middle"
              :scroll="{ y: 'calc(80vh - 120px)' }"
              @change="handleTodayActiveTableSort"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <span class="org-name">{{ record.name }}</span>
                </template>
                <template v-else-if="column.key === 'today_review'">
                  <span class="today-review-number">{{ record.today_review || 0 }}</span>
                </template>
                <template v-else-if="column.key === 'today_register'">
                  <span class="today-register-number">{{ record.today_register || 0 }}</span>
                </template>
                <template v-else-if="column.key === 'today_incomplete'">
                  <span class="today-incomplete-number">{{ record.today_incomplete || 0 }}</span>
                </template>
                <template v-else-if="column.key === 'today_reminder'">
                  <span class="today-reminder-number">{{ record.today_reminder || 0 }}</span>
                </template>
                <template v-else-if="column.key === 'score'">
                  <span class="score-number" :class="getScoreClass(record.score)">{{ record.score || 0 }}</span>
                </template>
                <template v-else-if="column.key === 'total'">
                  <span class="today-total-number">{{ record.total || 0 }}</span>
                </template>
              </template>
            </a-table>
          </div>
          
          <!-- 图表视图 -->
          <div v-else-if="todayActiveModalActiveTab === 'chart'" class="today-active-chart-container">
            <div class="chart-toolbar">
              <span class="toolbar-label">排序:</span>
              <a-select
                v-model:value="chartSortValue"
                size="small"
                style="width: 180px;"
                :options="chartSortOptions"
                @change="handleChartSortChange"
              />
            </div>
            <div ref="todayActiveChartRef" class="today-active-chart"></div>
          </div>
        </div>
      </a-modal>
      
      <!-- 图表展示弹窗 -->
      <a-modal
        v-model:visible="chartModalVisible"
        title="图表展示"
        width="800px"
        :footer="null"
        @cancel="closeChartModal"
      >
        <div class="chart-modal-content">
          <div ref="chartContainer" style="width: 100%; height: 500px;"></div>
        </div>
      </a-modal>
      
      <!-- 数据统计弹窗 -->
      <a-modal
        v-model:visible="dataStatsModalVisible"
        title="数据统计"
        width="1000px"
        :footer="null"
        @cancel="closeDataStatsModal"
      >
        <div class="data-stats-modal-content">
          <!-- 日期和机构选择器 -->
          <div class="selection-container">
            <!-- 日期范围选择器 -->
            <div class="date-range-selector">
              <div class="date-inputs">
                <div class="date-input-item">
                  <label>开始日期：</label>
                  <a-date-picker
                    v-model:value="statsStartDate"
                    :format="dateFormat"
                    :locale="locale"
                    placeholder="选择开始日期"
                    @change="handleStatsDateChange"
                  />
                </div>
                <div class="date-input-item">
                  <label>结束日期：</label>
                  <a-date-picker
                    v-model:value="statsEndDate"
                    :format="dateFormat"
                    :locale="locale"
                    placeholder="选择结束日期"
                    @change="handleStatsDateChange"
                  />
                </div>
              </div>
              
              <!-- 机构选择器 -->
              <div class="organization-selector">
                <div class="selector-header">
                  <label>选择机构：</label>
                  <div class="selector-actions">
                    <a-button 
                      size="small" 
                      @click="selectAllOrganizations"
                      :disabled="!organizationTree.length"
                    >
                      全选
                    </a-button>
                    <a-button 
                      size="small" 
                      @click="clearAllOrganizations"
                      :disabled="!selectedOrganizations.length"
                    >
                      清空
                    </a-button>
                  </div>
                </div>
                <a-select
                  v-model:value="selectedOrganizations"
                  mode="multiple"
                  placeholder="请选择要查看的机构"
                  style="width: 100%"
                  :options="organizationOptions"
                  :loading="!organizationTree.length"
                  @change="handleOrganizationSelectionChange"
                  :max-tag-count="0"
                  :max-tag-text-length="0"
                />
                <div class="selection-info">
                  已选择 {{ selectedOrganizations.length }} 个机构
                  <span v-if="selectedOrganizations.length > 0" class="selected-names">
                    ({{ getSelectedOrganizationNames() }})
                  </span>
                </div>
              </div>
              
              <a-button 
                type="primary" 
                @click="fetchStatsData"
                :loading="statsLoading"
                :disabled="!statsStartDate || !statsEndDate || !selectedOrganizations.length"
              >
                获取统计数据
              </a-button>
            </div>
            
            <!-- 统计结果标签卡 -->
            <div v-if="statsData.length > 0" class="stats-results">
              <div class="results-header">
                <h4>统计结果 ({{ statsStartDate?.format('MM-DD') }} 至 {{ statsEndDate?.format('MM-DD') }})</h4>
                <div class="header-export-buttons">
                  <a-button 
                    type="primary" 
                    size="small"
                    @click="exportActiveStatsToExcel"
                    :loading="exportLoading"
                    :disabled="!activeStatsData.length"
                    class="header-export-btn"
                  >
                    <template #icon><DownloadOutlined /></template>
                    导出活跃统计
                  </a-button>
                  <a-button 
                    type="primary" 
                    size="small"
                    @click="exportWorkStatsToExcel"
                    :loading="exportLoading"
                    :disabled="!workStatsData.length"
                    class="header-export-btn"
                  >
                    <template #icon><DownloadOutlined /></template>
                    导出工作统计
                  </a-button>
                </div>
              </div>
              
              <a-tabs v-model:activeKey="activeStatsTab" class="stats-tabs">
                <!-- 活跃统计标签 -->
                <a-tab-pane key="active" tab="活跃统计">
                  <div class="stats-section">
                    <!-- 显示方式选择器 -->
                    <div class="display-mode-selector" style="margin-bottom: 16px;">
                      <span style="margin-right: 8px;">显示方式：</span>
                      <a-radio-group v-model:value="activeStatsDisplayMode" size="small">
                        <a-radio-button value="day">按天</a-radio-button>
                        <a-radio-button value="month">按月</a-radio-button>
                        <a-radio-button value="quarter">按季度</a-radio-button>
                        <a-radio-button value="year">按年</a-radio-button>
                      </a-radio-group>
                    </div>
                    
                    <div class="stats-summary">
                      <div class="summary-item">
                        <span class="label">总活跃数：</span>
                        <span class="value">{{ totalActiveStats.total }}</span>
                      </div>
                      <div class="summary-item">
                        <span class="label">总复查数：</span>
                        <span class="value">{{ totalActiveStats.review }}</span>
                      </div>
                      <div class="summary-item">
                        <span class="label">总新增数：</span>
                        <span class="value">{{ totalActiveStats.register }}</span>
                      </div>
                    </div>
                    
                    <!-- 根据显示方式显示数据 -->
                    <div class="daily-stats">
                      <h6>{{ getDisplayModeLabel(activeStatsDisplayMode) }}详细数据：</h6>
                      <div v-for="periodData in groupedActiveStatsData" :key="`active-${periodData.period}`" class="day-item">
                        <div class="day-header">
                          <span class="day-date">{{ periodData.period }}</span>
                          <span class="day-total">总计: {{ (periodData.review || 0) + (periodData.register || 0) }}</span>
                        </div>
                        <div class="day-details">
                          <span class="detail-item">复查: {{ periodData.review }}</span>
                          <span class="detail-item">新增: {{ periodData.register }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </a-tab-pane>
                
                <!-- 工作统计标签 -->
                <a-tab-pane key="work" tab="工作统计">
                  <div class="stats-section">
                    <div class="stats-summary">
                                             <div class="summary-item">
                         <span class="label">总工作量：</span>
                         <span class="value">{{ totalWorkStats.total }}</span>
                       </div>
                       <div class="summary-item">
                         <span class="label">总未完善数：</span>
                         <span class="value">{{ formattedWorkIncompleteData }}</span>
                       </div>
                       <div class="summary-item">
                         <span class="label">总需提醒数：</span>
                         <span class="value">{{ formattedWorkReminderData }}</span>
                       </div>
                     </div>
                     
                     <!-- 每日详细数据 -->
                     <div class="daily-stats">
                       <h6>每日详细数据：</h6>
                       <div v-for="dayData in workStatsData" :key="`work-${dayData.queryDate}`" class="day-item">
                         <div class="day-header">
                           <span class="day-date">{{ dayData.queryDate }}</span>
                           <span class="day-total">总计: {{ (dayData.incomplete || 0) + (dayData.reminder || 0) }}</span>
                         </div>
                         <div class="day-details">
                           <span class="detail-item">未完善: {{ formatDayIncompleteData(dayData) }}</span>
                           <span class="detail-item">需提醒: {{ formatDayReminderData(dayData) }}</span>
                         </div>
                       </div>
                     </div>
                  </div>
                </a-tab-pane>
              </a-tabs>
            </div>
            
            <div v-else-if="!statsStartDate || !statsEndDate" class="no-date-selected">
              <p>请选择开始和结束日期，然后点击"获取统计数据"按钮</p>
            </div>
            
            <div v-else class="no-data">
              <p>所选日期范围内暂无数据</p>
            </div>
          </div>
        </div>
      </a-modal>
    </div>
  </template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { message } from 'ant-design-vue';
import { 
  TeamOutlined, 
  UserOutlined, 
  BarChartOutlined, 
  SettingOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons-vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 响应式数据
const stats = ref({
  totalOrganizations: 0,
  totalPatients: 0,
  totalExaminations: 0,
  todayActive: 0,
  todayReview: 0,
  todayRegister: 0,
  todayIncomplete: 0,
  todayReminder: 0,
  // 新增：分别统计三种提醒类型
  todayNeedRemind: 0,
  todayOverdue: 0,
  todayReminded: 0
});

// 机构树数据
const organizationTree = ref([]);
const loading = ref(false);

// 机构列表弹窗相关
const organizationModalVisible = ref(false);
const tableLoading = ref(false);

// 表格列定义
const organizationColumns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
    align: 'center'
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    width: 200
  },
  {
    title: '联系人',
    dataIndex: 'contact',
    key: 'contact',
    width: 120
  },
  {
    title: '账号',
    dataIndex: 'username',
    key: 'username',
    width: 150
  }
];

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: false,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
});

// 机构统计数据弹窗相关
const statsModalVisible = ref(false);
const statsTableLoading = ref(false);
const statsTableData = ref([]);
const statsModalActiveTab = ref('table'); // 默认选择表格
const statsChartRef = ref(null);
const statsChart = ref(null);

// 今日活跃数据弹窗相关
const todayActiveModalVisible = ref(false);
const todayActiveTableLoading = ref(false);
const todayActiveTableData = ref([]);
const todayActiveModalActiveTab = ref('table'); // 默认选择表格
const todayActiveChartRef = ref(null);
const todayActiveChart = ref(null);

// 图表展示弹窗相关
const chartModalVisible = ref(false);
const chartContainer = ref(null);
const chartInstance = ref(null);

// 数据统计弹窗相关
const dataStatsModalVisible = ref(false);
const activeStatsTab = ref('active'); // 当前激活的统计标签

// 统计类型选择
const selectedStatsTypes = ref({
  active: true, // 默认选中活跃统计
  work: true,   // 默认选中工作统计
  sales: false
});

// 统计相关
const statsStartDate = ref(null);
const statsEndDate = ref(null);
const statsLoading = ref(false);
const statsData = ref([]);

// 活跃统计相关
const activeStatsData = ref([]);
const activeStatsDisplayMode = ref('day'); // 显示方式：day(按天), month(按月), quarter(按季度), year(按年)
const totalActiveStats = ref({
  total: 0,
  review: 0,
  register: 0,
  incomplete: 0,
  reminder: 0,
  // 新增：分别统计三种提醒类型
  need_remind: 0,
  overdue: 0,
  reminded: 0
});

// 工作统计相关
const workStatsData = ref([]);
const totalWorkStats = ref({
  total: 0,
  incomplete: 0,
  reminder: 0,
  // 新增：分别统计三种提醒类型
  need_remind: 0,
  overdue: 0,
  reminded: 0
});

// 机构选择相关
const selectedOrganizations = ref([]);
const exportLoading = ref(false);

// 数据统计配置存储键名
const DATA_STATS_CONFIG_KEY = '数据统计配置';

// 新增：新API数据存储键名
const NEW_API_DATA_KEY = '新API建档患者数据';

// 创建完全独立的 ECharts 实例，避免冲突
let isolatedChartInstance = null;
let isolatedStatsChartInstance = null;
let isolatedTodayActiveChartInstance = null;
// 保存今日活跃图表的图例选择状态，避免重绘时被重置
const legendSelectedTodayActive = ref(null);

// 新增：新API的IndexedDB配置
const NEW_API_DB_NAME = 'NewAPIDashboardDB';
const NEW_API_DB_VERSION = 1;
const NEW_API_STORE_NAME = 'registeredPatientsData';
let newApiDB = null;



// 多列排序状态
const multiSortState = ref([]);

// 单列排序状态（用于机构统计数据表格）
const sortState = ref({
  field: null,
  order: null
});

// 根据显示方式分组和聚合活跃统计数据
const groupedActiveStatsData = computed(() => {
  if (!activeStatsData.value.length) {
    return [];
  }
  
  const mode = activeStatsDisplayMode.value;
  
  // 如果按天显示，直接返回原数据
  if (mode === 'day') {
    return activeStatsData.value.map(item => ({
      period: item.queryDate,
      review: item.review || 0,
      register: item.register || 0,
      total: (item.review || 0) + (item.register || 0),
      orgDetails: item.orgDetails || {}
    }));
  }
  
  // 按其他方式分组
  const grouped = {};
  
  activeStatsData.value.forEach(item => {
    const date = dayjs(item.queryDate);
    let periodKey = '';
    let periodLabel = '';
    
    if (mode === 'month') {
      periodKey = date.format('YYYY-MM');
      periodLabel = date.format('YYYY年MM月');
    } else if (mode === 'quarter') {
      const quarter = Math.floor(date.month() / 3) + 1;
      periodKey = `${date.year()}-Q${quarter}`;
      periodLabel = `${date.year()}年第${quarter}季度`;
    } else if (mode === 'year') {
      periodKey = date.format('YYYY');
      periodLabel = `${date.year()}年`;
    }
    
    if (!grouped[periodKey]) {
      grouped[periodKey] = {
        period: periodLabel,
        review: 0,
        register: 0,
        orgDetails: {}
      };
    }
    
    // 累加数据
    grouped[periodKey].review += item.review || 0;
    grouped[periodKey].register += item.register || 0;
    
    // 合并机构详情
    if (item.orgDetails) {
      Object.keys(item.orgDetails).forEach(orgId => {
        if (!grouped[periodKey].orgDetails[orgId]) {
          grouped[periodKey].orgDetails[orgId] = {
            name: item.orgDetails[orgId].name || '',
            today_review: 0,
            today_register: 0,
            total: 0
          };
        }
        grouped[periodKey].orgDetails[orgId].today_review += item.orgDetails[orgId].today_review || 0;
        grouped[periodKey].orgDetails[orgId].today_register += item.orgDetails[orgId].today_register || 0;
        grouped[periodKey].orgDetails[orgId].total = 
          grouped[periodKey].orgDetails[orgId].today_review + 
          grouped[periodKey].orgDetails[orgId].today_register;
      });
    }
  });
  
  // 转换为数组并排序
  const result = Object.keys(grouped)
    .sort()
    .map(key => ({
      ...grouped[key],
      total: grouped[key].review + grouped[key].register
    }));
  
  return result;
});

// 获取显示方式的标签
const getDisplayModeLabel = (mode) => {
  const labels = {
    day: '每日',
    month: '每月',
    quarter: '每季度',
    year: '每年'
  };
  return labels[mode] || '每日';
};

// 排序后的今日活跃数据
const sortedTodayActiveTableData = computed(() => {
  if (!multiSortState.value.length) {
    return todayActiveTableData.value;
  }
  
  return [...todayActiveTableData.value].sort((a, b) => {
    // 按优先级顺序应用多个排序条件
    for (const sortCondition of multiSortState.value) {
      const { field, order } = sortCondition;
      let comparison = 0;
      
      // 根据字段类型进行不同的比较
      if (field === 'name') {
        // 字符串比较
        comparison = a.name.localeCompare(b.name, 'zh-CN');
      } else {
        // 数字比较
        const aValue = a[field] || 0;
        const bValue = b[field] || 0;
        comparison = aValue - bValue;
      }
      
      // 如果当前字段的比较结果不为0，直接返回结果
      if (comparison !== 0) {
        return order === 'ascend' ? comparison : -comparison;
      }
      // 如果当前字段相等，继续下一个排序条件
    }
    
    // 所有排序条件都相等，保持原始顺序
    return 0;
  });
});

// 格式化提醒数据显示（待提醒/已逾期/已提醒）
const formattedReminderData = computed(() => {
  // 从总计活跃统计数据中获取提醒数据
  const needRemind = totalActiveStats.value.need_remind || 0;
  const overdue = totalActiveStats.value.overdue || 0;
  const reminded = totalActiveStats.value.reminded || 0;
  return `${needRemind}/${overdue}/${reminded}`;
});

// 格式化工作统计的提醒数据显示（待提醒/已逾期/已提醒）
const formattedWorkReminderData = computed(() => {
  // 从总计工作统计数据中获取提醒数据
  const needRemind = totalWorkStats.value.need_remind || 0;
  const overdue = totalWorkStats.value.overdue || 0;
  const reminded = totalWorkStats.value.reminded || 0;
  return `${needRemind}/${overdue}/${reminded}`;
});

// 格式化工作统计的未完善数据显示（全部/未完善）
const formattedWorkIncompleteData = computed(() => {
  // 从总计工作统计数据中获取未完善数据
  const totalExaminations = totalWorkStats.value.total_examinations || 0;
  const incomplete = totalWorkStats.value.incomplete || 0;
  return `${totalExaminations}/${incomplete}`;
});

// 格式化单日提醒数据显示
const formatDayReminderData = (dayData) => {
  const needRemind = dayData.need_remind || 0;
  const overdue = dayData.overdue || 0;
  const reminded = dayData.reminded || 0;
  return `${needRemind}/${overdue}/${reminded}`;
};

// 格式化单日未完善数据显示（全部/未完善）
const formatDayIncompleteData = (dayData) => {
  const totalExaminations = dayData.total_examinations || 0;
  const incomplete = dayData.incomplete || 0;
  return `${totalExaminations}/${incomplete}`;
};

// 添加排序条件
const addSortCondition = (field, order) => {
  // 移除已存在的相同字段排序条件
  multiSortState.value = multiSortState.value.filter(condition => condition.field !== field);
  
  // 添加新的排序条件到开头（最高优先级）
  multiSortState.value.unshift({ field, order });
  
  console.log('添加排序条件:', { field, order });
  console.log('当前多列排序状态:', multiSortState.value);
};

// 移除排序条件
const removeSortCondition = (field) => {
  multiSortState.value = multiSortState.value.filter(condition => condition.field !== field);
  console.log('移除排序条件:', field);
  console.log('当前多列排序状态:', multiSortState.value);
};

// 清除所有排序
const clearAllSorting = () => {
  multiSortState.value = [];
  console.log('清除所有排序条件');
};

// 获取列标题
const getColumnTitle = (field) => {
  const columnMap = {
    'name': '机构名',
    'today_review': '今日复查',
    'today_reminder': '需提醒',
    'today_register': '今日新增',
    'today_incomplete': '未完善',
    'score': '评分'
  };
  return columnMap[field] || field;
};

// 图表排序（今日活跃）
const chartSortValue = ref('score_desc');
const chartSortOptions = [
  { label: '评分(高→低)', value: 'score_desc' },
  { label: '评分(低→高)', value: 'score_asc' },
  { label: '复查(高→低)', value: 'today_review_desc' },
  { label: '复查(低→高)', value: 'today_review_asc' },
  { label: '新增(高→低)', value: 'today_register_desc' },
  { label: '新增(低→高)', value: 'today_register_asc' },
  { label: '未完善(高→低)', value: 'today_incomplete_desc' },
  { label: '未完善(低→高)', value: 'today_incomplete_asc' },
  { label: '需提醒(高→低)', value: 'today_reminder_desc' },
  { label: '需提醒(低→高)', value: 'today_reminder_asc' },
  { label: '机构名(A→Z)', value: 'name_asc' },
  { label: '机构名(Z→A)', value: 'name_desc' }
];

const handleChartSortChange = (val) => {
  if (!val) return;
  const idx = val.lastIndexOf('_');
  const field = idx > 0 ? val.slice(0, idx) : val;
  const ord = idx > 0 ? val.slice(idx + 1) : 'desc';
  const order = ord === 'asc' ? 'ascend' : 'descend';
  // 仅保留一个排序条件，最高优先级
  multiSortState.value = [{ field, order }];
  // 重新渲染图表（数据是响应式的，等待下一个tick确保DOM准备好）
  nextTick(() => {
    if (isolatedTodayActiveChartInstance) {
      renderTodayActiveChart();
    }
  });
};

// 获取评分样式类
const getScoreClass = (score) => {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-average';
  if (score >= 20) return 'score-poor';
  return 'score-very-poor';
};

// 处理表格排序变化
const handleTodayActiveTableSort = (pagination, filters, sorter) => {
  console.log('排序变化:', sorter);
  
  if (sorter && sorter.order) {
    // 添加或更新排序条件
    addSortCondition(sorter.field, sorter.order);
  } else {
    // 移除排序条件
    removeSortCondition(sorter.field);
  }
};

// 请求跟踪变量，避免竞态条件
let currentDateRequest = null;
let currentDateRequestAbortController = null;

// 处理今日活跃日期变化
const handleActiveDateChange = async () => {
  const newDate = selectedActiveDate.value.format('YYYY-MM-DD');
  console.log('今日活跃查询日期已更改为:', newDate);
  
  // 取消之前的请求
  if (currentDateRequestAbortController) {
    currentDateRequestAbortController.abort();
    console.log('取消之前的日期数据请求:', currentDateRequest);
  }
  
  // 更新当前请求的日期
  currentDateRequest = newDate;
  
  try {
    // 1. 优先从 IndexedDB 获取对应日期的缓存数据 - 已注释，避免IndexedDB相关问题
    // const indexedDBData = await getTodayActiveDataFromIndexedDB(newDate);
    
    // if (indexedDBData) {
    //   console.log('从 IndexedDB 获取到缓存数据，更新 localStorage 和 UI');
      
    //   // 更新 localStorage
    //   localStorage.setItem('【单日活跃】', JSON.stringify(indexedDBData));
      
    //   // 更新页面统计数据
    //   stats.value.todayActive = indexedDBData.total;
    //   stats.value.todayReview = indexedDBData.review || 0;
    //   stats.value.todayRegister = indexedDBData.register || 0;
    //   stats.value.todayIncomplete = indexedDBData.incomplete || 0;
    //   stats.value.todayReminder = indexedDBData.reminder || 0;
      
    //   // 如果弹窗打开，更新表格数据
    //   if (todayActiveModalVisible.value) {
    //     await loadTodayActiveTableData();
    //   }
      
    //         // 2. 静默请求新数据（后台更新）
    // console.log('开始静默请求新数据...');
    // console.log('缓存数据时间戳:', indexedDBData.timestamp);
    // console.log('当前时间戳:', Date.now());
    // console.log('缓存是否过期:', Date.now() - indexedDBData.timestamp > 5 * 60 * 1000);
    // performSilentDateUpdate(newDate);
      
    // } else {
    //   console.log('IndexedDB 中没有缓存数据，清空 localStorage 和 UI');
      
    //   // 清空 localStorage
    //   localStorage.removeItem('【单日活跃】');
      
    //   // 立即清空 UI 显示，显示 0 值
    //   stats.value.todayActive = 0;
    //   stats.value.todayReview = 0;
    //   stats.value.todayRegister = 0;
    //   stats.value.todayIncomplete = 0;
    //   stats.value.todayReminder = 0;
    
    // 直接清空 UI 显示，显示 0 值（不依赖IndexedDB）
    stats.value.todayActive = 0;
    stats.value.todayReview = 0;
    stats.value.todayRegister = 0;
    stats.value.todayIncomplete = 0;
    stats.value.todayReminder = 0;
    
    // 如果弹窗打开，显示空状态
    if (todayActiveModalVisible.value) {
      await loadTodayActiveTableData();
    }
    
    // 3. 静默请求新数据
    console.log('开始静默请求新数据...');
    performSilentDateUpdate(newDate);
    // }
    
  } catch (error) {
    console.error('处理日期变化时出错:', error);
    // 出错时清空数据
    localStorage.removeItem('【单日活跃】');
    stats.value.todayActive = 0;
    stats.value.todayReview = 0;
    stats.value.todayRegister = 0;
    stats.value.todayIncomplete = 0;
    stats.value.todayReminder = 0;
    
    if (todayActiveModalVisible.value) {
      await loadTodayActiveTableData();
    }
  }
};

// 手动更新状态
const manualUpdateLoading = ref(false);

// 自动更新定时器
let autoUpdateTimer = null;
const AUTO_UPDATE_INTERVAL = 30 * 60 * 1000; // 30分钟

// 今日活跃数据查询日期
const selectedActiveDate = ref(dayjs()); // 默认选择当天
const dateFormat = 'YYYY-MM-DD'; // 日期格式

// 设置dayjs为中文
dayjs.locale('zh-cn');

// 中文日期选择器配置
const locale = {
  lang: {
    locale: 'zh-cn',
    placeholder: ['开始日期', '结束日期'],
    rangePlaceholder: ['开始日期', '结束日期'],
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

// 从缓存加载机构统计数据
const loadCachedOrganizationStats = () => {
  try {
    const cachedData = localStorage.getItem('super_dashboard_org_stats_cache');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      console.log('找到机构统计数据缓存，缓存时间:', new Date(parsed.timestamp).toLocaleString());
      console.log('缓存数据内容:', {
        totalPatients: parsed.totalPatients,
        totalExaminations: parsed.totalExaminations,
        todayActive: parsed.todayActive,
        todayReview: parsed.todayReview,
        todayRegister: parsed.todayRegister,
        todayIncomplete: parsed.todayIncomplete,
        todayReminder: parsed.todayReminder,
        orgStatsDataKeys: Object.keys(parsed.orgStatsData || {}),
        orgStatsDataSample: parsed.orgStatsData ? Object.values(parsed.orgStatsData)[0] : null
      });
      return {
        totalPatients: parsed.totalPatients || 0,
        totalExaminations: parsed.totalExaminations || 0,
        todayActive: parsed.todayActive || 0,
        todayReview: parsed.todayReview || 0,
        todayRegister: parsed.todayRegister || 0,
        todayIncomplete: parsed.todayIncomplete || 0,
        todayReminder: parsed.todayReminder || 0,
        orgStatsData: parsed.orgStatsData || {}
      };
    }
    return null;
  } catch (error) {
    console.error('加载机构统计数据缓存失败:', error);
    return null;
  }
};

// 从缓存加载单日活跃数据（从 localStorage）
const loadCachedTodayActiveData = () => {
  try {
    const cachedData = localStorage.getItem('【单日活跃】');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      
      console.log('找到单日活跃数据缓存，缓存时间:', new Date(parsed.timestamp).toLocaleString());
      console.log('单日活跃数据内容:', {
        total: parsed.total,
        review: parsed.review,
        register: parsed.register,
        incomplete: parsed.incomplete,
        reminder: parsed.reminder,
        queryDate: parsed.queryDate,
        orgDetailsKeys: Object.keys(parsed.orgDetails || {}),
        orgDetailsSample: parsed.orgDetails ? Object.values(parsed.orgDetails)[0] : null
      });
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('加载单日活跃数据缓存失败:', error);
    return null;
  }
};

// 保存机构统计数据到缓存
const saveCachedOrganizationStats = (data) => {
  try {
    localStorage.setItem('super_dashboard_org_stats_cache', JSON.stringify(data));
    console.log('机构统计数据已保存到缓存');
    console.log('缓存数据结构:', {
      totalPatients: data.totalPatients,
      totalExaminations: data.totalExaminations,
      todayActive: data.todayActive,
      todayReview: data.todayReview,
      todayRegister: data.todayRegister,
      todayIncomplete: data.todayIncomplete,
      todayReminder: data.todayReminder,
      orgStatsDataKeys: Object.keys(data.orgStatsData || {}),
      orgStatsDataSample: data.orgStatsData ? Object.values(data.orgStatsData)[0] : null
    });
  } catch (error) {
    console.error('保存机构统计数据缓存失败:', error);
  }
};

// IndexedDB 数据库管理
const DB_NAME = 'SuperDashboardDB';
const DB_VERSION = 1;
const STORE_NAME = 'todayActiveData';
let db = null;

// 初始化 IndexedDB
const initIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('IndexedDB 打开失败:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      db = request.result;
      console.log('IndexedDB 连接成功');
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'queryDate' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('IndexedDB 存储对象创建成功');
      }
    };
  });
};

// 保存单日活跃数据到 IndexedDB
const saveTodayActiveDataToIndexedDB = async (data) => {
  try {
    if (!db) {
      await initIndexedDB();
    }
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // 保存数据，使用 queryDate 作为主键
    const result = await store.put(data);
    // console.log('单日活跃数据已保存到 IndexedDB:', data.queryDate); // 已注释，减少控制台输出
    
    return result;
  } catch (error) {
    console.error('保存单日活跃数据到 IndexedDB 失败:', error);
    throw error;
  }
};

// 从 IndexedDB 获取指定日期的单日活跃数据
const getTodayActiveDataFromIndexedDB = async (queryDate) => {
  try {
    if (!db) {
      await initIndexedDB();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get(queryDate);
      
      request.onsuccess = () => {
        if (request.result) {
          console.log('从 IndexedDB 获取到缓存数据:', queryDate);
          resolve(request.result);
        } else {
          console.log('IndexedDB 中没有找到缓存数据:', queryDate);
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('从 IndexedDB 获取数据失败:', request.error);
        reject(request.error);
      };
      
      transaction.onerror = () => {
        console.error('IndexedDB 事务失败:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('从 IndexedDB 获取数据失败:', error);
    return null;
  }
};

// 从 IndexedDB 获取所有日期的数据
const getAllTodayActiveDataFromIndexedDB = async () => {
  try {
    if (!db) {
      await initIndexedDB();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const result = request.result;
        console.log('从 IndexedDB 获取到所有缓存数据，共', result.length, '个日期');
        console.log('IndexedDB 中的所有日期:', result.map(item => item.queryDate));
        resolve(result);
      };
      
      request.onerror = () => {
        console.error('从 IndexedDB 获取所有数据失败:', request.error);
        reject(request.error);
      };
      
      transaction.onerror = () => {
        console.error('IndexedDB 事务失败:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('从 IndexedDB 获取所有数据失败:', error);
    return [];
  }
};

// 调试函数：检查 IndexedDB 状态
const debugIndexedDB = async () => {
  try {
    console.log('=== IndexedDB 调试信息 ===');
    console.log('数据库连接状态:', db ? '已连接' : '未连接');
    
    if (db) {
      console.log('数据库名称:', db.name);
      console.log('数据库版本:', db.version);
      console.log('存储对象列表:', db.objectStoreNames);
      
      // 获取所有数据
      const allData = await getAllTodayActiveDataFromIndexedDB();
      console.log('当前存储的所有数据:', allData);
    }
    
    console.log('=== 调试信息结束 ===');
  } catch (error) {
    console.error('调试 IndexedDB 时出错:', error);
  }
};

// 保存单日活跃数据到缓存（同时更新 localStorage 和 IndexedDB）
const saveCachedTodayActiveData = async (data) => {
  try {
    console.log('开始保存单日活跃数据到缓存...');
    console.log('要保存的数据:', {
      queryDate: data.queryDate,
      total: data.total,
      review: data.review,
      register: data.register,
      incomplete: data.incomplete,
      reminder: data.reminder
    });
    
    // 保存到 localStorage（保持现有逻辑）
    localStorage.setItem('【单日活跃】', JSON.stringify(data));
    console.log('单日活跃数据已保存到 localStorage');
    
    // 验证 localStorage 保存是否成功
    const savedData = localStorage.getItem('【单日活跃】');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log('验证 localStorage 保存成功:', {
        queryDate: parsed.queryDate,
        total: parsed.total
      });
    } else {
      console.error('localStorage 保存失败！');
    }
    
    // 同时保存到 IndexedDB
    await saveTodayActiveDataToIndexedDB(data);
    console.log('单日活跃数据已保存到 IndexedDB');
    
    console.log('单日活跃数据结构:', {
      total: data.total,
      review: data.review,
      register: data.register,
      incomplete: data.incomplete,
      reminder: data.reminder,
      orgDetailsKeys: Object.keys(data.orgDetails || {}),
      orgDetailsSample: data.orgDetails ? Object.values(data.orgDetails)[0] : null
    });
    
    console.log('缓存保存完成！');
  } catch (error) {
    console.error('保存单日活跃数据缓存失败:', error);
    throw error; // 重新抛出错误，让调用者知道保存失败
  }
};

// 统计数据表格列定义
const statsColumns = [
  {
    title: '机构名',
    dataIndex: 'name',
    key: 'name',
    width: 200,
    sorter: (a, b) => a.name.localeCompare(b.name, 'zh-CN'),
    sortDirections: ['ascend', 'descend'],
    defaultSortOrder: 'ascend'
  },
  {
    title: '联系人',
    dataIndex: 'contact',
    key: 'contact',
    width: 120
  },
  {
    title: '患者总数',
    dataIndex: 'total_patients',
    key: 'total_patients',
    width: 120,
    sorter: (a, b) => (a.total_patients || 0) - (b.total_patients || 0),
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '总检查次数',
    dataIndex: 'total_examinations',
    key: 'total_examinations',
    width: 120,
    sorter: (a, b) => (a.total_examinations || 0) - (b.total_examinations || 0),
    sortDirections: ['ascend', 'descend']
  }
];

// 今日活跃数据表格列定义
const todayActiveColumns = [
  {
    title: '机构名',
    dataIndex: 'name',
    key: 'name',
    width: 200,
    sorter: true,
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '今日复查',
    dataIndex: 'today_review',
    key: 'today_review',
    width: 120,
    sorter: true,
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '今日新增',
    dataIndex: 'today_register',
    key: 'today_register',
    width: 120,
    sorter: true,
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '未完善',
    dataIndex: 'today_incomplete',
    key: 'today_incomplete',
    width: 120,
    sorter: true,
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '需提醒',
    dataIndex: 'today_reminder',
    key: 'today_reminder',
    width: 120,
    sorter: true,
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '评分',
    dataIndex: 'score',
    key: 'score',
    width: 120,
    sorter: true,
    sortDirections: ['ascend', 'descend']
  }
];

// 统计数据分页配置（已废弃，保留以防其他地方引用）
const statsPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: false,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
});

// 启动自动更新机制
// const startAutoUpdate = () => {
//   console.log('启动自动更新机制，每30分钟静默更新一次数据');
//   
//   // 设置定时器，每30分钟执行一次静默更新
//   autoUpdateTimer = setInterval(() => {
//     performSilentUpdate();
//   }, AUTO_UPDATE_INTERVAL);
// };

// 执行静默更新
// const performSilentUpdate = async () => {
//   try {
//     console.log('开始静默更新所有数据...');
//     
//     // 静默更新机构树数据
//     await loadOrganizationTreeSilently();
//     
//     // 静默更新统计数据（不传参数，从localStorage获取）
//     await fetchAllOrganizationsStatsSilently();
//     
//     console.log('静默更新完成');
//   } catch (error) {
//     console.error('静默更新失败:', error);
//   }
// };

// 手动更新所有数据
const handleManualUpdate = async () => {
  try {
    manualUpdateLoading.value = true;
    console.log('开始手动更新所有数据...');
    
    // 更新机构树数据（不包含统计数据更新）
    await loadOrganizationTreeOnly();
    
    // 更新统计数据（只更新一次）
    const orgTreeStr = localStorage.getItem('机构树');
    if (orgTreeStr) {
      const orgTree = JSON.parse(orgTreeStr);
      console.log('开始更新统计数据...');
      await fetchAllOrganizationsStats(orgTree);
      console.log('统计数据更新完成');
    }
    
    message.success('数据更新完成');
    console.log('手动更新完成');
    
    // 调试：检查 IndexedDB 状态 - 已注释，避免IndexedDB相关问题
    // await debugIndexedDB();
  } catch (error) {
    console.error('手动更新失败:', error);
    message.error('数据更新失败，请稍后重试');
  } finally {
    manualUpdateLoading.value = false;
  }
};



// 加载机构树数据
const loadOrganizationTree = async () => {
  try {
    loading.value = true;
    console.log('开始请求机构列表数据...');
    
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      message.error('未找到访问令牌，请重新登录');
      return;
    }
    
    // 获取所有页的数据
    const allOrganizations = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      console.log(`正在获取第 ${currentPage} 页数据...`);
      
      const response = await fetch(`https://aiforoptometry.com/organization/searchorganization?page=${currentPage}`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + token
        }
      });
      
             const data = await response.json();
       console.log(`第 ${currentPage} 页数据响应:`, data);
       
       if (data.data && Array.isArray(data.data)) {
         // 将当前页数据添加到总数组中
         allOrganizations.push(...data.data);
         
         // 检查是否还有更多页
         if (currentPage < data.num_pages) {
           currentPage++;
         } else {
           hasMorePages = false;
         }
       } else {
         console.error(`获取第 ${currentPage} 页数据失败:`, data.message || '数据格式错误');
         hasMorePages = false;
       }
    }
    
         // 获取当前用户的机构信息
     const currentOrgStr = localStorage.getItem('organization');
     let currentOrgName = '';
     if (currentOrgStr) {
       try {
         const currentOrg = JSON.parse(currentOrgStr);
         currentOrgName = currentOrg.name;
       } catch (error) {
         console.error('解析当前机构信息失败:', error);
       }
     }
     
     // 过滤出属于当前机构的子机构（包括当前机构本身）
     const filteredOrganizations = allOrganizations.filter(org => 
       org.parent === currentOrgName || org.name === currentOrgName
     );
     
     // 计算子机构数量（不包括当前机构本身）
     const subOrganizations = filteredOrganizations.filter(org => 
       org.name !== currentOrgName
     );
     
     // 将过滤后的数据存储到localStorage
     localStorage.setItem('机构树', JSON.stringify(filteredOrganizations));
     console.log('机构树数据已保存到localStorage:', filteredOrganizations);
     
           // 更新页面显示
      organizationTree.value = filteredOrganizations;
      message.success(`机构列表数据加载成功，共获取 ${subOrganizations.length} 个子机构`);
      
      // 更新统计数据
      updateStats(filteredOrganizations);
      
      // 获取所有机构的患者数和检查次数统计
      const cachedStats = loadCachedOrganizationStats();
      if (!cachedStats) {
        // 没有缓存，进行静默请求（不显示加载动画）
        console.log('没有缓存数据，但不立即请求，等待手动更新');
        // await fetchAllOrganizationsStatsSilently(filteredOrganizations); // 暂时注释掉，只用手动更新
      } else {
        console.log('使用缓存数据，不进行静默更新');
      }
    
  } catch (error) {
    console.error('请求机构列表数据失败:', error);
    message.error('网络错误，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 只更新机构树数据，不更新统计数据
const loadOrganizationTreeOnly = async () => {
  try {
    loading.value = true;
    console.log('开始请求机构列表数据（仅机构树）...');
    
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      message.error('未找到访问令牌，请重新登录');
      return;
    }
    
    // 获取所有页的数据
    const allOrganizations = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      console.log(`正在获取第 ${currentPage} 页数据...`);
      
      const response = await fetch(`https://aiforoptometry.com/organization/searchorganization?page=${currentPage}`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + token
        }
      });
      
      const data = await response.json();
      console.log(`第 ${currentPage} 页数据响应:`, data);
      
      if (data.data && Array.isArray(data.data)) {
        // 将当前页数据添加到总数组中
        allOrganizations.push(...data.data);
        
        // 检查是否还有更多页
        if (currentPage < data.num_pages) {
          currentPage++;
        } else {
          hasMorePages = false;
        }
      } else {
        console.error(`获取第 ${currentPage} 页数据失败:`, data.message || '数据格式错误');
        hasMorePages = false;
      }
    }
    
    // 获取当前用户的机构信息
    const currentOrgStr = localStorage.getItem('organization');
    let currentOrgName = '';
    if (currentOrgStr) {
      try {
        const currentOrg = JSON.parse(currentOrgStr);
        currentOrgName = currentOrg.name;
      } catch (error) {
        console.error('解析当前机构信息失败:', error);
      }
    }
    
    // 过滤出属于当前机构的子机构（包括当前机构本身）
    const filteredOrganizations = allOrganizations.filter(org => 
      org.parent === currentOrgName || org.name === currentOrgName
    );
    
    // 计算子机构数量（不包括当前机构本身）
    const subOrganizations = filteredOrganizations.filter(org => 
      org.name !== currentOrgName
    );
    
    // 将过滤后的数据存储到localStorage
    localStorage.setItem('机构树', JSON.stringify(filteredOrganizations));
    console.log('机构树数据已保存到localStorage:', filteredOrganizations);
    
    // 更新页面显示
    organizationTree.value = filteredOrganizations;
    message.success(`机构列表数据加载成功，共获取 ${subOrganizations.length} 个子机构`);
    
    // 更新统计数据
    updateStats(filteredOrganizations);
    
    // 不更新统计数据，只更新机构树
    console.log('机构树更新完成，不更新统计数据');
    
  } catch (error) {
    console.error('请求机构列表数据失败:', error);
    message.error('网络错误，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 静默更新指定日期的今日活跃数据
const performSilentDateUpdate = async (queryDate) => {
  try {
    // 检查请求是否已被取消
    if (currentDateRequest !== queryDate) {
      console.log(`静默更新已取消，当前请求日期: ${currentDateRequest}, 更新日期: ${queryDate}`);
      return;
    }
    
    console.log(`开始静默更新日期 ${queryDate} 的今日活跃数据...`);
    
    // 从localStorage获取机构树数据
    const orgTreeStr = localStorage.getItem('机构树');
    console.log('机构树数据存在:', !!orgTreeStr);
    if (!orgTreeStr) {
      console.warn('未找到机构数据，无法静默更新今日活跃数据');
      return;
    }
    
    const organizations = JSON.parse(orgTreeStr);
    console.log('解析后的机构数量:', organizations.length);
    const csrftoken = localStorage.getItem('csrftoken');
    console.log('CSRF令牌存在:', !!csrftoken);
    
    if (!csrftoken) {
      console.warn('未找到CSRF令牌，无法静默获取今日活跃数据');
      return;
    }
    
    // 获取指定日期的今日活跃数据
    const todayActiveData = await fetchTodayActiveStats(organizations, queryDate);
    
    // 再次检查请求是否已被取消
    if (currentDateRequest !== queryDate) {
      console.log(`静默更新已取消，当前请求日期: ${currentDateRequest}, 更新日期: ${queryDate}`);
      return;
    }
    
    // 构建完整的缓存数据结构
    const cacheData = {
      total: todayActiveData.total,
      review: todayActiveData.review,
      register: todayActiveData.register,
      incomplete: todayActiveData.incomplete,
      reminder: todayActiveData.reminder,
      orgDetails: todayActiveData.orgDetails,
      queryDate: queryDate,
      timestamp: Date.now()
    };
    
    // 更新 localStorage 和 IndexedDB - 已注释，避免IndexedDB相关问题
    // await saveCachedTodayActiveData(cacheData);
    
    // 只更新 localStorage
    localStorage.setItem('【单日活跃】', JSON.stringify(cacheData));
    
    // 最终检查请求是否已被取消
    if (currentDateRequest !== queryDate) {
      console.log(`静默更新已取消，不更新UI，当前请求日期: ${currentDateRequest}, 更新日期: ${queryDate}`);
      return;
    }
    
    console.log('静默更新完成，开始更新 UI...');
    console.log('更新前的 stats 值:', {
      todayActive: stats.value.todayActive,
      todayReview: stats.value.todayReview,
      todayRegister: stats.value.todayRegister,
      todayIncomplete: stats.value.todayIncomplete,
      todayReminder: stats.value.todayReminder
    });
    
    // 更新页面统计数据
    stats.value.todayActive = todayActiveData.total;
    stats.value.todayReview = todayActiveData.review;
    stats.value.todayRegister = todayActiveData.register;
    stats.value.todayIncomplete = todayActiveData.incomplete;
    stats.value.todayReminder = todayActiveData.reminder;
    
    console.log('更新后的 stats 值:', {
      todayActive: stats.value.todayActive,
      todayReview: stats.value.todayReview,
      todayRegister: stats.value.todayRegister,
      todayIncomplete: stats.value.todayIncomplete,
      todayReminder: stats.value.todayReminder
    });
    
    // 验证 localStorage 是否已更新
    const localStorageData = localStorage.getItem('【单日活跃】');
    if (localStorageData) {
      const parsed = JSON.parse(localStorageData);
      console.log('localStorage 中的数据:', {
        queryDate: parsed.queryDate,
        total: parsed.total,
        review: parsed.review,
        register: parsed.register,
        incomplete: parsed.incomplete,
        reminder: parsed.reminder
      });
    } else {
      console.warn('localStorage 中没有找到数据！');
    }
    
    // 如果弹窗打开，静默更新表格数据
    if (todayActiveModalVisible.value) {
      // 静默更新表格数据，不显示加载状态
      await loadTodayActiveTableDataSilently();
    }
    
    console.log(`日期 ${queryDate} 的今日活跃数据静默更新完成`);
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`静默更新被取消: ${queryDate}`);
    } else {
      console.error(`静默更新日期 ${queryDate} 的今日活跃数据失败:`, error);
    }
  }
};

// 静默更新机构树数据
const loadOrganizationTreeSilently = async () => {
  try {
    console.log('静默更新机构树数据...');
    
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.warn('未找到访问令牌，无法静默更新机构树数据');
      return;
    }
    
    // 获取所有页的数据
    const allOrganizations = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const response = await fetch(`https://aiforoptometry.com/organization/searchorganization?page=${currentPage}`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + token
        }
      });
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        allOrganizations.push(...data.data);
        
        if (currentPage < data.num_pages) {
          currentPage++;
        } else {
          hasMorePages = false;
        }
      } else {
        hasMorePages = false;
      }
    }
    
    // 获取当前用户的机构信息
    const currentOrgStr = localStorage.getItem('organization');
    let currentOrgName = '';
    if (currentOrgStr) {
      try {
        const currentOrg = JSON.parse(currentOrgStr);
        currentOrgName = currentOrg.name;
      } catch (error) {
        console.error('解析当前机构信息失败:', error);
      }
    }
    
    // 过滤出属于当前机构的子机构（包括当前机构本身）
    const filteredOrganizations = allOrganizations.filter(org => 
      org.parent === currentOrgName || org.name === currentOrgName
    );
    
    // 静默更新localStorage和页面数据
    localStorage.setItem('机构树', JSON.stringify(filteredOrganizations));
    organizationTree.value = filteredOrganizations;
    updateStats(filteredOrganizations);
    
    console.log('静默更新机构树数据完成');
  } catch (error) {
    console.error('静默更新机构树数据失败:', error);
  }
};

// 更新统计数据
const updateStats = (data) => {
  if (data && Array.isArray(data)) {
    stats.value.totalOrganizations = data.length;
    // 这里可以根据实际数据结构更新其他统计数据
    console.log('统计数据已更新:', stats.value);
  }
};

// 获取所有机构的患者数和检查次数统计
const fetchAllOrganizationsStats = async (organizations) => {
  try {
    console.log('开始获取所有机构的统计数据...');
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (!csrftoken) {
      console.warn('未找到CSRF令牌，无法获取统计数据');
      return;
    }
    
    // 直接请求数据并保存缓存
    await fetchAllOrganizationsStatsWithLoading(organizations);
    
  } catch (error) {
    console.error('获取所有机构统计数据失败:', error);
    message.error('获取统计数据失败');
  }
};

// 静默更新所有机构的统计数据
const fetchAllOrganizationsStatsSilently = async (organizations = null) => {
  try {
    console.log('静默更新所有机构的统计数据...');
    
    // 如果没有传入机构列表，从localStorage获取
    let orgList = organizations;
    if (!orgList) {
      const orgTreeStr = localStorage.getItem('机构树');
      if (!orgTreeStr) {
        console.warn('未找到机构数据，无法静默更新统计数据');
        return;
      }
      orgList = JSON.parse(orgTreeStr);
    }
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (!csrftoken) {
      console.warn('未找到CSRF令牌，无法静默获取统计数据');
      return;
    }
    
    let totalPatients = 0;
    let totalExaminations = 0;
    let todayActive = 0;
    let todayReview = 0;
    let todayRegister = 0;
    let todayIncomplete = 0;
    let todayReminder = 0;
    const orgStatsData = {};
    
    // 遍历所有机构，获取每个机构的统计数据
    for (const org of orgList) {
      try {
        const response = await fetch('https://aiforoptometry.com/medicalrecords/search_org_total_ptandexam', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify({
            org_id: org.id
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data && !data.error) {
          const orgPatients = data.total_patients || 0;
          const orgExaminations = data.total_examinations || 0;
          
          totalPatients += orgPatients;
          totalExaminations += orgExaminations;
          
          // 保存每个机构的统计数据
          orgStatsData[org.id] = {
            name: org.name,
            total_patients: orgPatients,
            total_examinations: orgExaminations,
            timestamp: Date.now()
          };
          
          console.log(`静默更新 - 机构 ${org.name} - 患者数: ${orgPatients}, 检查次数: ${orgExaminations}`);
        }
        
        // 添加小延迟，避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`静默获取机构 ${org.name} 统计数据失败:`, error);
      }
    }
    
    // 获取今日活跃数据（所有机构的今日建档、复查、未完善、需提醒的总和）
    const todayActiveData = await fetchTodayActiveStats(orgList);
    todayActive = todayActiveData.total;
    todayReview = todayActiveData.review;
    todayRegister = todayActiveData.register;
    todayIncomplete = todayActiveData.incomplete;
    todayReminder = todayActiveData.reminder;
    
    // 将今日活跃详细数据合并到机构统计数据中
    Object.keys(todayActiveData.orgDetails).forEach(orgId => {
      if (orgStatsData[orgId]) {
        orgStatsData[orgId] = {
          ...orgStatsData[orgId],
          ...todayActiveData.orgDetails[orgId]
        };
      }
    });
    
    // 静默更新UI和缓存
    stats.value.totalPatients = totalPatients;
    stats.value.totalExaminations = totalExaminations;
    stats.value.todayActive = todayActive;
    stats.value.todayReview = todayReview;
    stats.value.todayRegister = todayRegister;
    stats.value.todayIncomplete = todayIncomplete;
    stats.value.todayReminder = todayReminder;
    
    // 保存机构统计数据到缓存
    saveCachedOrganizationStats({
      totalPatients,
      totalExaminations,
      orgStatsData,
      timestamp: Date.now()
    });
    
    // 保存单日活跃数据到【单日活跃】键
    const queryDate = selectedActiveDate.value ? selectedActiveDate.value.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    await saveCachedTodayActiveData({
      total: todayActive,
      review: todayReview,
      register: todayRegister,
      incomplete: todayIncomplete,
      reminder: todayReminder,
      orgDetails: todayActiveData.orgDetails,
      queryDate: queryDate,
      timestamp: Date.now()
    });
    
    console.log('静默更新统计数据完成 - 所有机构统计数据汇总:', {
      totalOrganizations: stats.value.totalOrganizations,
      totalPatients: totalPatients,
      totalExaminations: totalExaminations,
      todayActive: todayActive,
      todayReview: todayReview,
      todayRegister: todayRegister,
      todayIncomplete: todayIncomplete,
      todayReminder: todayReminder
    });
    
  } catch (error) {
    console.error('静默更新所有机构统计数据失败:', error);
  }
};



// 带加载状态的获取所有机构统计数据
const fetchAllOrganizationsStatsWithLoading = async (organizations) => {
  try {
    console.log('开始获取所有机构的统计数据（带加载状态）...');
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (!csrftoken) {
      console.warn('未找到CSRF令牌，无法获取统计数据');
      return;
    }
    
    let totalPatients = 0;
    let totalExaminations = 0;
    let todayActive = 0;
    let todayReview = 0;
    let todayRegister = 0;
    let todayIncomplete = 0;
    let todayReminder = 0;
    const orgStatsData = {};
    
    // 遍历所有机构，获取每个机构的统计数据
    for (const org of organizations) {
      try {
        console.log(`正在获取机构 ${org.name} (ID: ${org.id}) 的统计数据...`);
        
        const response = await fetch('https://aiforoptometry.com/medicalrecords/search_org_total_ptandexam', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify({
            org_id: org.id
          })
        });
        
        const data = await response.json();
        console.log(`机构 ${org.name} 统计数据:`, data);
        
        if (response.ok && data && !data.error) {
          const orgPatients = data.total_patients || 0;
          const orgExaminations = data.total_examinations || 0;
          
          totalPatients += orgPatients;
          totalExaminations += orgExaminations;
          
          // 保存每个机构的统计数据
          orgStatsData[org.id] = {
            name: org.name,
            total_patients: orgPatients,
            total_examinations: orgExaminations,
            timestamp: Date.now()
          };
          
          console.log(`机构 ${org.name} - 患者数: ${orgPatients}, 检查次数: ${orgExaminations}`);
        } else {
          console.warn(`机构 ${org.name} 统计数据获取失败:`, data);
        }
        
        // 添加小延迟，避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`获取机构 ${org.name} 统计数据失败:`, error);
      }
    }
    
    // 获取今日活跃数据（所有机构的今日建档、复查、未完善、需提醒的总和）
    const todayActiveData = await fetchTodayActiveStats(organizations);
    todayActive = todayActiveData.total;
    todayReview = todayActiveData.review;
    todayRegister = todayActiveData.register;
    todayIncomplete = todayActiveData.incomplete;
    todayReminder = todayActiveData.reminder;
    
    // 将今日活跃详细数据合并到机构统计数据中
    Object.keys(todayActiveData.orgDetails).forEach(orgId => {
      if (orgStatsData[orgId]) {
        orgStatsData[orgId] = {
          ...orgStatsData[orgId],
          ...todayActiveData.orgDetails[orgId]
        };
      }
    });
    
    // 更新统计数据
    stats.value.totalPatients = totalPatients;
    stats.value.totalExaminations = totalExaminations;
    stats.value.todayActive = todayActive;
    stats.value.todayReview = todayReview;
    stats.value.todayRegister = todayRegister;
    stats.value.todayIncomplete = todayIncomplete;
    stats.value.todayReminder = todayReminder;
    
    // 保存机构统计数据到缓存
    saveCachedOrganizationStats({
      totalPatients,
      totalExaminations,
      orgStatsData,
      timestamp: Date.now()
    });
    
    // 保存单日活跃数据到【单日活跃】键
    const queryDate = selectedActiveDate.value ? selectedActiveDate.value.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    await saveCachedTodayActiveData({
      total: todayActive,
      review: todayReview,
      register: todayRegister,
      incomplete: todayIncomplete,
      reminder: todayReminder,
      orgDetails: todayActiveData.orgDetails,
      queryDate: queryDate,
      timestamp: Date.now()
    });
    
         console.log('所有机构统计数据汇总:', {
       totalOrganizations: stats.value.totalOrganizations,
       totalPatients: totalPatients,
       totalExaminations: totalExaminations,
       todayActive: todayActive,
       todayReview: todayReview,
       todayRegister: todayRegister,
       todayIncomplete: todayIncomplete,
       todayReminder: todayReminder
     });
    
    message.success('所有机构统计数据获取完成');
    
  } catch (error) {
    console.error('获取所有机构统计数据失败:', error);
    message.error('获取统计数据失败');
  }
};

// 获取今日活跃统计数据（参考工作台的统计逻辑）
const fetchTodayActiveStats = async (organizations, queryDate = null) => {
  try {
    console.log('开始获取今日活跃统计数据...');
    const csrftoken = localStorage.getItem('csrftoken');
    // 使用传入的日期，如果没有传入则使用选择的日期，如果都没有则使用当天
    const targetDate = queryDate || (selectedActiveDate.value ? selectedActiveDate.value.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
    console.log('查询日期:', targetDate);
    
    if (!csrftoken) {
      console.warn('未找到CSRF令牌，无法获取今日活跃数据');
      return { total: 0, review: 0, register: 0, incomplete: 0, reminder: 0, orgDetails: {} };
    }
    
    let totalTodayActive = 0;
    let totalTodayReview = 0;
    let totalTodayRegister = 0;
    let totalTodayIncomplete = 0;
    let totalTodayReminder = 0;
    const orgDetails = {};
     
     // 使用新的批量API获取指定日期的新增和复查数据
     console.log(`使用批量API获取日期 ${targetDate} 的新增和复查数据...`);
     const batchData = await fetchActiveStatsForDateRange(targetDate, targetDate);
     const dayData = batchData[targetDate] || {};
     
     // 从批量数据中提取新增和复查数据
     if (dayData.org_details && typeof dayData.org_details === 'object') {
       // 如果API返回了机构详情
       Object.keys(dayData.org_details).forEach(orgId => {
         const orgData = dayData.org_details[orgId];
         const orgIdNum = parseInt(orgId);
         const org = organizations.find(o => o.id == orgIdNum);
         
         if (org) {
           const todayRegisterCount = orgData.register || orgData.today_register || 0;
           const todayReviewCount = orgData.review || orgData.today_review || 0;
           
           // 累加各项数据
           totalTodayRegister += todayRegisterCount;
           totalTodayReview += todayReviewCount;
           
           // 保存每个机构的详细数据（先只保存新增和复查，未完善和需提醒在后面单独获取）
           orgDetails[org.id] = {
             name: org.name,
             today_review: todayReviewCount,
             today_register: todayRegisterCount,
             today_incomplete: 0, // 将在后面更新
             today_reminder: 0,   // 将在后面更新
             total: todayReviewCount + todayRegisterCount
           };
         }
       });
     } else {
       // 如果API返回的是总体数据，需要按机构分配
       const totalRegister = dayData.register || 0;
       const totalReview = dayData.review || 0;
       
       // 如果没有机构详情，为每个机构初始化数据
       organizations.forEach(org => {
         orgDetails[org.id] = {
           name: org.name,
           today_review: 0,
           today_register: 0,
           today_incomplete: 0,
           today_reminder: 0,
           total: 0
         };
       });
       
       totalTodayRegister = totalRegister;
       totalTodayReview = totalReview;
     }
     
     // 遍历所有机构，获取未完善和需提醒数据（这部分保持不变，因为新API只提供新增和复查）
     console.log(`开始遍历 ${organizations.length} 个机构获取未完善和需提醒数据...`);
     for (const org of organizations) {
       try {
         console.log(`正在获取机构 ${org.name} (ID: ${org.id}) 的未完善和需提醒数据...`);
         
         // 如果机构详情中还没有该机构的数据，初始化
         if (!orgDetails[org.id]) {
           orgDetails[org.id] = {
             name: org.name,
             today_review: 0,
             today_register: 0,
             today_incomplete: 0,
             today_reminder: 0,
             total: 0
           };
         }

         // 获取指定日期的未完善检查数据
         const incompleteResponse = await fetch(`https://aiforoptometry.com/organization/${org.id}/examinations/?date=${targetDate}`, {
           method: 'GET',
           headers: {
             'Content-Type': 'application/json',
             'X-CSRFToken': csrftoken
           }
         });
         const incompleteData = await incompleteResponse.json();
         let incompleteCount = 0;
         if (incompleteData.data) {
           // 过滤出未完善的检查记录
           incompleteCount = incompleteData.data.filter(item => {
             return !checkExaminationComplete(item);
           }).length;
         }

         // 获取指定日期的需提醒数据
         const reminderResponse = await fetch('https://aiforoptometry.com/reminders/upcoming/', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'X-CSRFToken': csrftoken
           },
           body: JSON.stringify({
             remindDate: targetDate,
             overdue_date: targetDate,
             organization_id: org.id
           })
         });
         const reminderData = await reminderResponse.json();
         
         // 处理返回的数据结构，兼容新的格式
         let reminderCount = 0;
         if (Array.isArray(reminderData)) {
           // 旧格式：直接返回数组
           reminderCount = reminderData.length;
         } else if (reminderData && typeof reminderData === 'object') {
           // 新格式：包含 overdue 和 normal 数组
           const overdueCount = reminderData.overdue && Array.isArray(reminderData.overdue) ? reminderData.overdue.length : 0;
           const normalCount = reminderData.normal && Array.isArray(reminderData.normal) ? reminderData.normal.length : 0;
           reminderCount = overdueCount + normalCount;
         }

         // 从批量API获取的数据中提取该机构的新增和复查数据
         const todayRegisterCount = orgDetails[org.id]?.today_register || 0;
         const todayReviewCount = orgDetails[org.id]?.today_review || 0;
         
         // 更新机构详情中的未完善和需提醒数据
         if (orgDetails[org.id]) {
           orgDetails[org.id].today_incomplete = incompleteCount;
           orgDetails[org.id].today_reminder = reminderCount;
           
           // 重新计算机构总计
           const orgTodayActive = todayRegisterCount + todayReviewCount + incompleteCount + reminderCount;
           orgDetails[org.id].total = orgTodayActive;
           
           // 计算评分：新增 + 复查 - 未完善 - 需提醒
           const score = todayRegisterCount + todayReviewCount - incompleteCount - reminderCount;
           orgDetails[org.id].score = score;
         } else {
           // 如果机构详情中还没有该机构的数据，创建新数据
           const orgTodayActive = todayRegisterCount + todayReviewCount + incompleteCount + reminderCount;
           const score = todayRegisterCount + todayReviewCount - incompleteCount - reminderCount;
           orgDetails[org.id] = {
             name: org.name,
             today_review: todayReviewCount,
             today_register: todayRegisterCount,
             today_incomplete: incompleteCount,
             today_reminder: reminderCount,
             score: score,
             total: orgTodayActive
           };
         }

         // 累加各项数据
         totalTodayIncomplete += incompleteCount;
         totalTodayReminder += reminderCount;
         
         // 计算该机构的今日活跃总数
         const orgTodayActive = orgDetails[org.id].total;
         totalTodayActive += orgTodayActive;
         
         console.log(`机构 ${org.name} 今日活跃数据:`, {
           建档: todayRegisterCount,
           复查: todayReviewCount,
           未完善: incompleteCount,
           需提醒: reminderCount,
           总计: orgTodayActive
         });
         
         // 添加小延迟，避免请求过于频繁
         await new Promise(resolve => setTimeout(resolve, 100));
         
       } catch (error) {
         console.error(`获取机构 ${org.name} 今日活跃数据失败:`, error);
         // 如果获取失败，使用0作为默认值
         orgDetails[org.id] = {
           name: org.name,
           today_review: 0,
           today_register: 0,
           today_incomplete: 0,
           today_reminder: 0,
           score: 0,
           total: 0
         };
       }
     }
     
     console.log('所有机构今日活跃数据汇总:', {
       建档: totalTodayRegister,
       复查: totalTodayReview,
       未完善: totalTodayIncomplete,
       需提醒: totalTodayReminder,
       总计: totalTodayActive
     });
     
     return {
       total: totalTodayActive,
       review: totalTodayReview,
       register: totalTodayRegister,
       incomplete: totalTodayIncomplete,
       reminder: totalTodayReminder,
       orgDetails: orgDetails
     };
    
  } catch (error) {
    console.error('获取今日活跃统计数据失败:', error);
    return { total: 0, review: 0, register: 0, incomplete: 0, reminder: 0, orgDetails: {} };
  }
};

// 检查检查记录是否完整（从工作台复制逻辑）
const checkExaminationComplete = (record) => {
  if (!record?.examination) return false;

  const examination = record.examination;

  // 检查基本信息（身高体重）是否完整
  const hasBasicInfo =
      (examination.height !== null && examination.height !== undefined) &&
      (examination.weight !== null && examination.weight !== undefined);

  // 检查裸眼视力是否完整
  const hasUva =
      (examination.uva_right_vision !== null && examination.uva_right_vision !== undefined) &&
      (examination.uva_left_vision !== null && examination.uva_left_vision !== undefined) &&
      (examination.uva_both_vision !== null && examination.uva_both_vision !== undefined);

  // 检查电脑验光是否完整
  const hasObjectiveRefraction =
      (examination.objective_right_spherical !== null && examination.objective_right_spherical !== undefined) &&
      (examination.objective_right_cylindrical !== null && examination.objective_right_cylindrical !== undefined) &&
      (examination.objective_right_axis !== null && examination.objective_right_axis !== undefined) &&
      (examination.objective_left_spherical !== null && examination.objective_left_spherical !== undefined) &&
      (examination.objective_left_cylindrical !== null && examination.objective_left_cylindrical !== undefined) &&
      (examination.objective_left_axis !== null && examination.objective_left_axis !== undefined);

  // 检查生物参数是否完整
  const hasBiometric =
      (examination.right_eye_axial_length !== null && examination.right_eye_axial_length !== undefined) &&
      (examination.right_eye_k1 !== null && examination.right_eye_k1 !== undefined) &&
      (examination.right_eye_k2 !== null && examination.right_eye_k2 !== undefined) &&
      (examination.left_eye_axial_length !== null && examination.left_eye_axial_length !== undefined) &&
      (examination.left_eye_k1 !== null && examination.left_eye_k1 !== undefined) &&
      (examination.left_eye_k2 !== null && examination.left_eye_k2 !== undefined);

  // 检查诊疗方案是否完整
  const hasRightAtropine = examination.right_atropine !== null && examination.right_atropine !== undefined && examination.right_atropine !== '';
  const hasRightGlasses = examination.right_glasses !== null && examination.right_glasses !== undefined && examination.right_glasses !== '';
  const hasRightHg = examination.right_hg !== null && examination.right_hg !== undefined && examination.right_hg !== '';
  const hasRightPhysiotherapy = examination.right_physiotherapy !== null && examination.right_physiotherapy !== undefined && examination.right_physiotherapy !== '';
  const hasRightVisualTraining = examination.right_visual_training !== null && examination.right_visual_training !== undefined && examination.right_visual_training !== '';
  
  const hasLeftAtropine = examination.left_atropine !== null && examination.left_atropine !== undefined && examination.left_atropine !== '';
  const hasLeftGlasses = examination.left_glasses !== null && examination.left_glasses !== undefined && examination.left_glasses !== '';
  const hasLeftHg = examination.left_hg !== null && examination.left_hg !== undefined && examination.left_hg !== '';
  const hasLeftPhysiotherapy = examination.left_physiotherapy !== null && examination.left_physiotherapy !== undefined && examination.left_physiotherapy !== '';
  const hasLeftVisualTraining = examination.left_visual_training !== null && examination.left_visual_training !== undefined && examination.left_visual_training !== '';

  const hasRightGlassesPP = (examination.right_glasses === '否') || 
      (examination.right_glasses && examination.right_glasses !== '否' && 
       examination.right_glasses_pp !== null && examination.right_glasses_pp !== undefined && examination.right_glasses_pp !== '');
  
  const hasRightHgDW = (examination.right_hg === '否') || 
      (examination.right_hg && examination.right_hg !== '否' && 
       examination.right_hg_dw !== null && examination.right_hg_dw !== undefined && examination.right_hg_dw !== '');
  
  const hasLeftGlassesPP = (examination.left_glasses === '否') || 
      (examination.left_glasses && examination.left_glasses !== '否' && 
       examination.left_glasses_pp !== null && examination.left_glasses_pp !== undefined && examination.left_glasses_pp !== '');
  
  const hasLeftHgDW = (examination.left_hg === '否') || 
      (examination.left_hg && examination.left_hg !== '否' && 
       examination.left_hg_dw !== null && examination.left_hg_dw !== undefined && examination.left_hg_dw !== '');

  const hasTreatmentPlan = hasRightAtropine && hasRightGlasses && hasRightGlassesPP && hasRightHg && hasRightHgDW && 
                           hasRightPhysiotherapy && hasRightVisualTraining && hasLeftAtropine && hasLeftGlasses && 
                           hasLeftGlassesPP && hasLeftHg && hasLeftHgDW && hasLeftPhysiotherapy && hasLeftVisualTraining;

  // 检查是否有戴镜视力数据
  const hasGlasses = !!(
      examination.vaec_right_old_vision ||
      examination.vaec_left_old_vision ||
      examination.vaec_both_old_vision ||
      examination.vaec_right_spherical ||
      examination.vaec_left_spherical
  );

  // 如果有戴镜视力，检查戴镜视力和旧镜度数是否完整
  if (hasGlasses) {
    const hasVaec =
        (examination.vaec_right_old_vision !== null && examination.vaec_right_old_vision !== undefined) &&
        (examination.vaec_left_old_vision !== null && examination.vaec_left_old_vision !== undefined) &&
        (examination.vaec_both_old_vision !== null && examination.vaec_both_old_vision !== undefined);

    const hasOldGlasses =
        (examination.vaec_right_spherical !== null && examination.vaec_right_spherical !== undefined) &&
        (examination.vaec_right_cylindrical !== null && examination.vaec_right_cylindrical !== undefined) &&
        (examination.vaec_right_axis !== null && examination.vaec_right_axis !== undefined) &&
        (examination.vaec_left_spherical !== null && examination.vaec_left_spherical !== undefined) &&
        (examination.vaec_left_cylindrical !== null && examination.vaec_left_cylindrical !== undefined) &&
        (examination.vaec_left_axis !== null && examination.vaec_left_axis !== undefined);

    // 对于戴镜患者，不检查裸眼视力数据
    return hasBasicInfo && hasObjectiveRefraction && hasBiometric && hasVaec && hasOldGlasses && hasTreatmentPlan;
  }

  // 如果没有戴镜视力，只检查基本项目
  return hasBasicInfo && hasUva && hasObjectiveRefraction && hasBiometric && hasTreatmentPlan;
};

// 打开机构列表弹窗
const openOrganizationModal = () => {
  organizationModalVisible.value = true;
  // 更新分页总数
  pagination.value.total = organizationTree.value.length;
  pagination.value.current = 1;
};

// 关闭机构列表弹窗
const closeOrganizationModal = () => {
  organizationModalVisible.value = false;
};

// 处理表格分页变化
const handleTableChange = (pag) => {
  console.log('分页变化:', pag);
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
};

// 打开机构统计数据弹窗
const openStatsModal = () => {
  statsModalVisible.value = true;
  loadStatsTableData();
};

// 关闭机构统计数据弹窗
const closeStatsModal = () => {
  statsModalVisible.value = false;
  // 重置排序状态
  sortState.value = {
    field: null,
    order: null
  };
  // 销毁独立图表实例
  if (isolatedStatsChartInstance) {
    try {
      isolatedStatsChartInstance.dispose();
      console.log('独立统计图表实例已销毁');
    } catch (error) {
      console.warn('销毁独立统计图表实例时出错:', error);
    }
    isolatedStatsChartInstance = null;
  }
  // 重置选项卡
  statsModalActiveTab.value = 'table';
};

// 打开今日活跃数据弹窗
const openTodayActiveModal = () => {
  todayActiveModalVisible.value = true;
  // 根据当前下拉选择应用一次默认排序
  if (chartSortValue.value) {
    const v = chartSortValue.value;
    const idx = v.lastIndexOf('_');
    const field = idx > 0 ? v.slice(0, idx) : v;
    const ord = idx > 0 ? v.slice(idx + 1) : 'desc';
    const order = ord === 'asc' ? 'ascend' : 'descend';
    multiSortState.value = [{ field, order }];
  }
  loadTodayActiveTableData();
};

// 关闭今日活跃数据弹窗
const closeTodayActiveModal = () => {
  todayActiveModalVisible.value = false;
  // 销毁独立图表实例
  if (isolatedTodayActiveChartInstance) {
    try {
      isolatedTodayActiveChartInstance.dispose();
      console.log('独立今日活跃图表实例已销毁');
    } catch (error) {
      console.warn('销毁独立今日活跃图表实例时出错:', error);
    }
    isolatedTodayActiveChartInstance = null;
  }
  // 重置选项卡
  todayActiveModalActiveTab.value = 'table';
};

// 打开图表展示弹窗
const openChartModal = () => {
  chartModalVisible.value = true;
  // 等待DOM更新后初始化图表
  nextTick(() => {
    // 再等待一下确保modal完全渲染
    setTimeout(() => {
      initChartModal();
    }, 200);
  });
};

// 关闭图表展示弹窗
const closeChartModal = () => {
  chartModalVisible.value = false;
  
  // 销毁独立的图表实例
  if (isolatedChartInstance) {
    try {
      isolatedChartInstance.dispose();
      console.log('独立图表实例已销毁');
    } catch (error) {
      console.warn('销毁独立图表实例时出错:', error);
    }
    isolatedChartInstance = null;
  }
  
  // 清理容器
  if (chartContainer.value) {
    chartContainer.value.innerHTML = '';
  }
};

// 打开数据统计弹窗
const openDataStatsModal = () => {
  dataStatsModalVisible.value = true;
  console.log('数据统计弹窗已打开');
  
  // 等待下一个 tick 确保机构树数据已加载
  nextTick(() => {
    // 尝试加载上次的配置
    const hasConfig = loadDataStatsConfig();
    
    if (!hasConfig) {
      // 如果没有配置，默认不选择任何机构
      selectedOrganizations.value = [];
      console.log('没有找到上次的配置，默认不选择任何机构');
    }
  });
};

// 关闭数据统计弹窗
const closeDataStatsModal = () => {
  dataStatsModalVisible.value = false;
  console.log('数据统计弹窗已关闭');
};



// 清空统计数据
const clearStatsData = () => {
  activeStatsData.value = [];
  workStatsData.value = [];
  totalActiveStats.value = {
    total: 0,
    review: 0,
    register: 0,
    incomplete: 0,
    reminder: 0
  };
  totalWorkStats.value = {
    total: 0,
    incomplete: 0,
    reminder: 0
  };
};

// 处理统计日期变化
const handleStatsDateChange = () => {
  console.log('统计日期已更改:', {
    startDate: statsStartDate.value?.format('YYYY-MM-DD'),
    endDate: statsEndDate.value?.format('YYYY-MM-DD')
  });
  
  // 清空之前的数据
  clearStatsData();
  
  // 保存配置
  saveDataStatsConfig();
};

// 全选所有机构
const selectAllOrganizations = () => {
  selectedOrganizations.value = organizationTree.value.map(org => org.id);
  console.log('已全选所有机构，共', selectedOrganizations.value.length, '个');
  
  // 保存配置
  saveDataStatsConfig();
};

// 清空所有选中的机构
const clearAllOrganizations = () => {
  selectedOrganizations.value = [];
  console.log('已清空所有选中的机构');
  
  // 保存配置
  saveDataStatsConfig();
};

// 处理机构选择变化
const handleOrganizationSelectionChange = (selectedIds) => {
  console.log('机构选择已更改:', selectedIds);
  selectedOrganizations.value = selectedIds;
  
  // 清空之前的数据
  clearStatsData();
  
  // 保存配置
  saveDataStatsConfig();
};

// 获取选中机构的名称列表
const getSelectedOrganizationNames = () => {
  if (!selectedOrganizations.value.length) return '';
  
  const names = selectedOrganizations.value.map(orgId => {
    const org = organizationTree.value.find(org => org.id === orgId);
    return org ? org.name : `未知机构(${orgId})`;
  });
  
  return names.join('、');
};

// 保存数据统计配置到 localStorage
const saveDataStatsConfig = () => {
  try {
    const config = {
      startDate: statsStartDate.value?.format('YYYY-MM-DD'),
      endDate: statsEndDate.value?.format('YYYY-MM-DD'),
      selectedOrganizations: selectedOrganizations.value,
      timestamp: Date.now()
    };
    
    localStorage.setItem(DATA_STATS_CONFIG_KEY, JSON.stringify(config));
    console.log('数据统计配置已保存:', config);
  } catch (error) {
    console.error('保存数据统计配置失败:', error);
  }
};

// 从 localStorage 加载数据统计配置
const loadDataStatsConfig = () => {
  try {
    const configStr = localStorage.getItem(DATA_STATS_CONFIG_KEY);
    if (configStr) {
      const config = JSON.parse(configStr);
      console.log('加载数据统计配置:', config);
      
      // 恢复日期选择
      if (config.startDate) {
        statsStartDate.value = dayjs(config.startDate);
      }
      if (config.endDate) {
        statsEndDate.value = dayjs(config.endDate);
      }
      
      // 恢复机构选择（需要验证机构是否仍然存在）
      if (config.selectedOrganizations && Array.isArray(config.selectedOrganizations)) {
        const validOrgIds = config.selectedOrganizations.filter(orgId => 
          organizationTree.value.some(org => org.id === orgId)
        );
        
        if (validOrgIds.length > 0) {
          selectedOrganizations.value = validOrgIds;
          console.log('恢复机构选择:', validOrgIds);
        } else {
          console.log('配置中的机构已不存在，使用默认配置');
          selectedOrganizations.value = [];
        }
      } else {
        selectedOrganizations.value = [];
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('加载数据统计配置失败:', error);
  }
};

// 新增：获取新API统计数据（使用 daily-review API）
const fetchNewApiStatsData = async () => {
  console.log('fetchNewApiStatsData 被调用');
  console.log('检查日期和机构选择...');
  
  if (!statsStartDate.value || !statsEndDate.value) {
    console.log('日期未选择，显示警告');
    message.warning('请选择开始和结束日期');
    return;
  }
  
  const startDate = statsStartDate.value.format('YYYY-MM-DD');
  const endDate = statsEndDate.value.format('YYYY-MM-DD');
  
  if (startDate > endDate) {
    message.error('开始日期不能晚于结束日期');
    return;
  }
  
  // 开始计时（移到try块外面，确保catch块也能访问）
  const startTime = Date.now();
  
  try {
    statsLoading.value = true;
    
    console.log(`开始获取新API统计数据，日期范围: ${startDate} 至 ${endDate}`);
    console.log(`开始时间: ${new Date(startTime).toLocaleTimeString()}`);
    
    // 检查是否有选中的机构
    if (!selectedOrganizations.value.length) {
      message.warning('请选择要查看的机构');
      return;
    }
    
    // 直接调用新的 daily-review API
    console.log('开始请求 daily-review API...');
    const apiStartTime = Date.now();
    console.log(`API请求开始时间: ${new Date(apiStartTime).toLocaleTimeString()}`);
    
    const batchData = await fetchActiveStatsForDateRange(startDate, endDate);
    
    const apiEndTime = Date.now();
    const apiDuration = apiEndTime - apiStartTime;
    const apiDurationSeconds = (apiDuration / 1000).toFixed(2);
    
    console.log(`API请求完成时间: ${new Date(apiEndTime).toLocaleTimeString()}`);
    console.log(`API请求耗时: ${apiDurationSeconds}秒`);
    console.log('API返回的数据:', batchData);
    
    // 处理API返回的数据，转换为 activeStatsData 格式
    const dateRange = generateDateRange(startDate, endDate);
    const organizations = organizationTree.value;
    
    const newActiveStatsData = dateRange.map(date => {
      const dayData = batchData[date] || {};
      
      // 构建活跃统计数据
      let totalReview = 0;
      let totalRegister = 0;
      const orgDetails = {};
      
      // 处理API返回的数据格式
      // API返回格式: { "review": 10, "register": 5, "org_details": { "1": { "review": 5, "register": 2, "name": "机构名" }, ... } }
      
      if (dayData.org_details && typeof dayData.org_details === 'object') {
        // 如果API返回了机构详情
        Object.keys(dayData.org_details).forEach(orgId => {
          const orgData = dayData.org_details[orgId];
          const orgIdNum = parseInt(orgId);
          // 只处理选中的机构
          if (selectedOrganizations.value.includes(orgIdNum)) {
            const orgReview = orgData.review || orgData.today_review || 0;
            const orgRegister = orgData.register || orgData.today_register || 0;
            orgDetails[orgId] = {
              name: orgData.name || organizations.find(org => org.id == orgIdNum)?.name || '',
              today_review: orgReview,
              today_register: orgRegister,
              total: orgReview + orgRegister
            };
            totalReview += orgReview;
            totalRegister += orgRegister;
          }
        });
      }
      
      // 如果没有机构详情但有总体数据，使用总体数据（这种情况应该不会发生，但保留兼容性）
      if (Object.keys(orgDetails).length === 0 && (dayData.review || dayData.register)) {
        const overallReview = dayData.review || 0;
        const overallRegister = dayData.register || 0;
        
        // 简单平均分配（实际应该从API获取机构详情）
        const orgCount = selectedOrganizations.value.length;
        if (orgCount > 0) {
          const avgReview = Math.floor(overallReview / orgCount);
          const avgRegister = Math.floor(overallRegister / orgCount);
          
          selectedOrganizations.value.forEach(orgId => {
            const org = organizations.find(o => o.id === orgId);
            if (org) {
              orgDetails[orgId] = {
                name: org.name,
                today_review: avgReview,
                today_register: avgRegister,
                total: avgReview + avgRegister
              };
            }
          });
          
          totalReview = overallReview;
          totalRegister = overallRegister;
        }
      }
      
      return {
        queryDate: date,
        review: totalReview,
        register: totalRegister,
        total: totalReview + totalRegister,
        orgDetails: orgDetails,
        timestamp: Date.now()
      };
    });
    
    // 更新UI数据
    activeStatsData.value = newActiveStatsData;
    updateTotalActiveStats(newActiveStatsData);
    updateStatsData();
    
    const totalEndTime = Date.now();
    const totalDuration = totalEndTime - startTime;
    const totalDurationSeconds = (totalDuration / 1000).toFixed(2);
    
    console.log(`数据处理完成时间: ${new Date(totalEndTime).toLocaleTimeString()}`);
    console.log(`总耗时: ${totalDurationSeconds}秒`);
    
    // 显示详细的成功提示
    message.success({
      content: `数据获取完成\nAPI请求时间: ${apiDurationSeconds}秒\n总耗时: ${totalDurationSeconds}秒\n数据来源: 服务器`,
      duration: 5
    });
    
  } catch (error) {
    const errorTime = Date.now();
    const errorDuration = errorTime - startTime;
    const errorDurationSeconds = (errorDuration / 1000).toFixed(2);
    
    console.error('获取新API统计数据失败:', error);
    console.log(`错误发生时间: ${new Date(errorTime).toLocaleTimeString()}`);
    console.log(`失败前耗时: ${errorDurationSeconds}秒`);
    
    // 显示详细的错误提示
    message.error({
      content: `数据获取失败\n失败时间: ${errorDurationSeconds}秒\n错误信息: ${error.message || '网络请求失败'}`,
      duration: 6
    });
  } finally {
    statsLoading.value = false;
  }
};

// 新增：静默更新最新数据（使用 daily-review API）
const performSilentUpdate = async (startDate, endDate, organizationIds) => {
  const silentStartTime = Date.now();
  
  try {
    console.log('开始静默更新最新数据...');
    console.log(`静默更新开始时间: ${new Date(silentStartTime).toLocaleTimeString()}`);
    
    // 调用新的 daily-review API获取最新数据
    const batchData = await fetchActiveStatsForDateRange(startDate, endDate);
    
    const silentEndTime = Date.now();
    const silentDuration = silentEndTime - silentStartTime;
    const silentDurationSeconds = (silentDuration / 1000).toFixed(2);
    
    console.log(`静默更新完成时间: ${new Date(silentEndTime).toLocaleTimeString()}`);
    console.log(`静默更新耗时: ${silentDurationSeconds}秒`);
    
    // 处理API返回的数据，转换为 activeStatsData 格式
    const dateRange = generateDateRange(startDate, endDate);
    const organizations = organizationTree.value;
    
    const newActiveStatsData = dateRange.map(date => {
      const dayData = batchData[date] || {};
      
      // 构建活跃统计数据
      let totalReview = 0;
      let totalRegister = 0;
      const orgDetails = {};
      
      // 处理API返回的数据格式
      if (dayData.org_details && typeof dayData.org_details === 'object') {
        Object.keys(dayData.org_details).forEach(orgId => {
          const orgData = dayData.org_details[orgId];
          const orgIdNum = parseInt(orgId);
          // 只处理选中的机构
          if (organizationIds.includes(orgIdNum)) {
            const orgReview = orgData.review || orgData.today_review || 0;
            const orgRegister = orgData.register || orgData.today_register || 0;
            orgDetails[orgId] = {
              name: orgData.name || organizations.find(org => org.id == orgIdNum)?.name || '',
              today_review: orgReview,
              today_register: orgRegister,
              total: orgReview + orgRegister
            };
            totalReview += orgReview;
            totalRegister += orgRegister;
          }
        });
      }
      
      return {
        queryDate: date,
        review: totalReview,
        register: totalRegister,
        total: totalReview + totalRegister,
        orgDetails: orgDetails,
        timestamp: Date.now()
      };
    });
    
    // 更新UI数据
    activeStatsData.value = newActiveStatsData;
    updateTotalActiveStats(newActiveStatsData);
    updateStatsData();
    
    console.log('静默更新完成，数据已更新');
    
    // 显示静默更新完成的提示（较短的持续时间）
    message.success({
      content: `数据已静默更新\n更新时间: ${silentDurationSeconds}秒`,
      duration: 2
    });
    
  } catch (error) {
    const silentErrorTime = Date.now();
    const silentErrorDuration = silentErrorTime - silentStartTime;
    const silentErrorDurationSeconds = (silentErrorDuration / 1000).toFixed(2);
    
    console.error('静默更新失败:', error);
    console.log(`静默更新失败时间: ${new Date(silentErrorTime).toLocaleTimeString()}`);
    console.log(`静默更新失败前耗时: ${silentErrorDurationSeconds}秒`);
    
    // 静默更新失败显示简短错误消息
    message.error({
      content: `数据静默更新失败\n失败时间: ${silentErrorDurationSeconds}秒`,
      duration: 3
    });
  }
};

// 获取统计数据（修改为使用新API）
const fetchStatsData = async () => {
  console.log('fetchStatsData 被调用');
  console.log('statsStartDate:', statsStartDate.value);
  console.log('statsEndDate:', statsEndDate.value);
  console.log('selectedOrganizations:', selectedOrganizations.value);
  
  // 新增：使用新API获取数据
  await fetchNewApiStatsData();
  
  // 旧方式：暂时注释掉
  /*
  if (!statsStartDate.value || !statsEndDate.value) {
    message.warning('请选择开始和结束日期');
    return;
  }
  
  const startDate = statsStartDate.value.format('YYYY-MM-DD');
  const endDate = statsEndDate.value.format('YYYY-MM-DD');
  
  if (startDate > endDate) {
    message.error('开始日期不能晚于结束日期');
    return;
  }
  
  try {
    statsLoading.value = true;
    console.log(`开始获取统计数据，日期范围: ${startDate} 至 ${endDate}`);
    
    // 生成日期范围内的所有日期
    const dateRange = generateDateRange(startDate, endDate);
    console.log('需要查询的日期列表:', dateRange);
    
    // 并行获取缓存数据，立即显示
    const cachePromises = [];
    
    // 默认获取两种统计数据
    console.log('开始获取活跃统计缓存数据...');
    cachePromises.push(fetchActiveStatsData(dateRange));
    
    console.log('开始获取工作统计缓存数据...');
    cachePromises.push(fetchWorkStatsData(dateRange));
    
    // 等待所有缓存数据获取完成
    if (cachePromises.length > 0) {
      await Promise.all(cachePromises);
      console.log('所有缓存数据获取完成');
      
      // 立即更新 UI 显示缓存数据
      updateStatsData();
      
      // 显示缓存数据状态
      console.log('缓存数据显示状态:', {
        活跃统计: {
          数据条数: activeStatsData.value.length,
          总计: totalActiveStats.value
        },
        工作统计: {
          数据条数: workStatsData.value.length,
          总计: totalWorkStats.value
        }
      });
    }
    
    // 后台并行静默更新最新数据
    console.log('开始后台静默更新最新数据...');
    const updatePromises = [];
    
    updatePromises.push(performActiveStatsSilentUpdate(dateRange));
    updatePromises.push(performWorkStatsSilentUpdate(dateRange));
    
    // 不等待静默更新完成，让用户继续操作
    if (updatePromises.length > 0) {
      Promise.all(updatePromises).then(() => {
        console.log('所有静默更新完成');
        // 静默更新完成后再次更新 UI
        updateStatsData();
      }).catch(error => {
        console.error('静默更新过程中出现错误:', error);
      });
    }
    
    message.success('统计数据获取完成');
    
  } catch (error) {
    console.error('获取统计数据失败:', error);
    message.error('获取统计数据失败，请稍后重试');
  } finally {
    statsLoading.value = false;
  }
  */
};

// 获取活跃统计数据
const fetchActiveStatsData = async (dateRange) => {
  try {
    console.log('开始获取活跃统计数据...');
    
    // 从 IndexedDB 获取缓存数据
    const cachedData = await getActiveStatsFromIndexedDB(dateRange);
    console.log('从 IndexedDB 获取到的活跃统计缓存数据:', cachedData);
    
    // 找出缺失的日期
    const missingDates = dateRange.filter(date => !cachedData.some(item => item.queryDate === date));
    console.log('活跃统计缺失的日期:', missingDates);
    
    // 如果有缓存数据，需要根据选中的机构进行过滤
    if (cachedData.length > 0) {
      console.log('发现缓存数据，开始过滤和显示...');
      
      // 过滤出只包含选中机构的数据
      const filteredCachedData = cachedData.map(dateData => {
        const filteredOrgDetails = {};
        let totalReview = 0;
        let totalRegister = 0;
        
        // 只统计选中机构的数据
        selectedOrganizations.value.forEach(orgId => {
          if (dateData.orgDetails && dateData.orgDetails[orgId]) {
            const orgData = dateData.orgDetails[orgId];
            filteredOrgDetails[orgId] = orgData;
            totalReview += orgData.today_review || 0;
            totalRegister += orgData.today_register || 0;
          }
        });
        
        return {
          ...dateData,
          review: totalReview,
          register: totalRegister,
          // 活跃统计的共计 = 新增 + 复查
          total: totalReview + totalRegister,
          orgDetails: filteredOrgDetails
        };
      });
      
      // 按日期排序过滤后的数据
      const sortedFilteredData = filteredCachedData.sort((a, b) => a.queryDate.localeCompare(b.queryDate));
      
      // 立即更新 UI 数据
      activeStatsData.value = sortedFilteredData;
      updateTotalActiveStats(sortedFilteredData);
      
      console.log('使用活跃统计过滤后的缓存数据更新 UI，数据条数:', sortedFilteredData.length);
      console.log('缓存数据已立即显示在 UI 中');
      
      // 立即更新 statsData，让 UI 能够显示
      updateStatsData();
      
      // 强制 UI 更新
      await nextTick();
    } else {
      console.log('没有找到缓存数据，将等待 API 请求结果');
    }
    
    // 如果有缺失的日期，静默请求数据
    if (missingDates.length > 0) {
      console.log('开始静默请求活跃统计缺失的日期数据...');
      await fetchMissingDatesData(missingDates);
    } else if (cachedData.length > 0) {
      console.log('所有活跃统计日期都有缓存，开始静默更新...');
      // 即使有缓存，也静默更新一次
      await fetchMissingDatesData(dateRange);
    }
    
    // 返回更新后的数据，用于静默更新
    return activeStatsData.value;
    
  } catch (error) {
    console.error('获取活跃统计数据失败:', error);
  }
};

// 获取工作统计数据
const fetchWorkStatsData = async (dateRange) => {
  try {
    console.log('开始获取工作统计数据...');
    
    // 从 IndexedDB 获取缓存数据
    const cachedData = await getWorkStatsFromIndexedDB(dateRange);
    console.log('从 IndexedDB 获取到的工作统计缓存数据:', cachedData);
    
    // 找出缺失的日期
    const missingDates = dateRange.filter(date => !cachedData.some(item => item.queryDate === date));
    console.log('工作统计缺失的日期:', missingDates);
    
    // 如果有缓存数据，需要根据选中的机构进行过滤
    if (cachedData.length > 0) {
      console.log('发现工作统计缓存数据，开始过滤和显示...');
      
      // 过滤出只包含选中机构的数据
      const filteredCachedData = cachedData.map(dateData => {
        const filteredOrgDetails = {};
        let totalIncomplete = 0;
        let totalReminder = 0;
        
        // 只统计选中机构的数据
        selectedOrganizations.value.forEach(orgId => {
          if (dateData.orgDetails && dateData.orgDetails[orgId]) {
            const orgData = dateData.orgDetails[orgId];
            filteredOrgDetails[orgId] = orgData;
            // 注意：机构级别的字段名是 today_incomplete 和 today_reminder
            const orgIncomplete = orgData.today_incomplete || 0;
            const orgReminder = orgData.today_reminder || 0;
            totalIncomplete += orgIncomplete;
            totalReminder += orgReminder;
            
            console.log(`机构 ${orgData.name} 工作统计数据:`, {
              未完善: orgIncomplete,
              需提醒: orgReminder,
              小计: orgIncomplete + orgReminder
            });
          }
        });
        
        console.log(`日期 ${dateData.queryDate} 工作统计汇总:`, {
          未完善: totalIncomplete,
          需提醒: totalReminder,
          总计: totalIncomplete + totalReminder
        });
        
        return {
          ...dateData,
          incomplete: totalIncomplete,
          reminder: totalReminder,
          // 工作统计的共计 = 未完善 + 需提醒
          total: totalIncomplete + totalReminder,
          orgDetails: filteredOrgDetails
        };
      });
      
      // 按日期排序过滤后的数据
      const sortedFilteredData = filteredCachedData.sort((a, b) => a.queryDate.localeCompare(b.queryDate));
      
      // 立即更新 UI 数据
      workStatsData.value = sortedFilteredData;
      updateTotalWorkStats(sortedFilteredData);
      
      console.log('使用工作统计过滤后的缓存数据更新 UI，数据条数:', sortedFilteredData.length);
      console.log('工作统计缓存数据已立即显示在 UI 中');
      
      // 立即更新 statsData，让 UI 能够显示
      updateStatsData();
      
      // 强制 UI 更新
      await nextTick();
    } else {
      console.log('没有找到工作统计缓存数据，将等待 API 请求结果');
    }
    
    // 如果有缺失的日期，静默请求数据
    if (missingDates.length > 0) {
      console.log('开始静默请求工作统计缺失的日期数据...');
      await fetchMissingWorkDatesData(missingDates);
    } else if (cachedData.length > 0) {
      console.log('所有工作统计日期都有缓存，开始静默更新...');
      // 即使有缓存，也静默更新一次
      await fetchMissingWorkDatesData(dateRange);
    }
    
    // 返回更新后的数据，用于静默更新
    return workStatsData.value;
    
  } catch (error) {
    console.error('获取工作统计数据失败:', error);
  }
};

// 静默更新活跃统计数据
const performActiveStatsSilentUpdate = async (dateRange) => {
  try {
    console.log('开始静默更新活跃统计数据...');
    
    // 使用选中的机构，如果没有选中则使用所有机构
    let organizations = [];
    if (selectedOrganizations.value.length > 0) {
      organizations = organizationTree.value.filter(org => 
        selectedOrganizations.value.includes(org.id)
      );
      console.log(`使用选中的 ${organizations.length} 个机构进行静默更新`);
    } else {
      console.warn('未选择任何机构，无法进行静默更新');
      return;
    }
    
    // 静默更新所有日期的数据
    await fetchMissingDatesData(dateRange);
    
    console.log('活跃统计静默更新完成');
    
  } catch (error) {
    console.error('活跃统计静默更新失败:', error);
  }
};

// 静默更新工作统计数据
const performWorkStatsSilentUpdate = async (dateRange) => {
  try {
    console.log('开始静默更新工作统计数据...');
    
    // 使用选中的机构，如果没有选中则使用所有机构
    let organizations = [];
    if (selectedOrganizations.value.length > 0) {
      organizations = organizationTree.value.filter(org => 
        selectedOrganizations.value.includes(org.id)
      );
      console.log(`使用选中的 ${organizations.length} 个机构进行静默更新`);
    } else {
      console.warn('未选择任何机构，无法进行静默更新');
      return;
    }
    
    // 静默更新所有日期的数据
    await fetchMissingWorkDatesData(dateRange);
    
    console.log('工作统计静默更新完成');
    
  } catch (error) {
    console.error('工作统计静默更新失败:', error);
  }
};

// 生成日期范围
const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  let current = start;
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    dates.push(current.format('YYYY-MM-DD'));
    current = current.add(1, 'day');
  }
  
  return dates;
};

// 从 IndexedDB 获取活跃统计数据
const getActiveStatsFromIndexedDB = async (dateRange) => {
  try {
    if (!db) {
      await initIndexedDB();
    }
    
    const result = [];
    
    for (const date of dateRange) {
      const data = await getTodayActiveDataFromIndexedDB(date);
      if (data) {
        result.push(data);
      }
    }
    
    console.log(`从 IndexedDB 获取到 ${result.length} 个日期的数据`);
    return result;
    
  } catch (error) {
    console.error('从 IndexedDB 获取活跃统计数据失败:', error);
    return [];
  }
};

// 从 IndexedDB 获取工作统计数据
const getWorkStatsFromIndexedDB = async (dateRange) => {
  try {
    if (!db) {
      await initIndexedDB();
    }
    
    const result = [];
    
    for (const date of dateRange) {
      const data = await getTodayActiveDataFromIndexedDB(date);
      if (data) {
        // 返回所有日期，让 UI 层决定是否显示
        result.push(data);
      }
    }
    
    console.log(`从 IndexedDB 获取到 ${result.length} 个工作统计日期的数据`);
    return result;
    
  } catch (error) {
    console.error('从 IndexedDB 获取工作统计数据失败:', error);
    return [];
  }
};

// 获取缺失日期的数据
const fetchMissingDatesData = async (dates) => {
  try {
    console.log(`开始获取 ${dates.length} 个缺失日期的数据...`);
    
    // 使用选中的机构，如果没有选中则使用所有机构
    let organizations = [];
    if (selectedOrganizations.value.length > 0) {
      // 从机构树中筛选出选中的机构
      organizations = organizationTree.value.filter(org => 
        selectedOrganizations.value.includes(org.id)
      );
      console.log(`使用选中的 ${organizations.length} 个机构进行统计`);
    } else {
      console.warn('未选择任何机构，无法获取活跃数据');
      message.warning('请选择要查看的机构');
      return;
    }
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (!csrftoken) {
      console.warn('未找到CSRF令牌，无法获取活跃数据');
      return;
    }
    
    // 如果日期数组为空，直接返回
    if (dates.length === 0) {
      console.log('没有需要获取的日期');
      return;
    }
    
    // 排序日期，获取开始和结束日期
    const sortedDates = [...dates].sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];
    
    console.log(`使用批量API获取日期范围 ${startDate} 到 ${endDate} 的数据...`);
    
    // 使用新的批量API一次性获取所有日期的数据
    const batchData = await fetchActiveStatsForDateRange(startDate, endDate);
    
    // 并行处理所有缺失日期的数据
    const promises = dates.map(async (date) => {
      try {
        console.log(`正在处理日期 ${date} 的数据...`);
        
        // 从批量数据中提取该日期的数据
        const dayData = batchData[date] || {};
        
        // 构建活跃统计数据
        let totalReview = 0;
        let totalRegister = 0;
        const orgDetails = {};
        
        // 处理API返回的数据格式
        // API返回格式可能是: { "review": 10, "register": 5, "org_details": { "1": { "review": 5, "register": 2, "name": "机构名" }, ... } }
        // 或者: { "review": 10, "register": 5 } (只有总体数据)
        
        if (dayData.org_details && typeof dayData.org_details === 'object') {
          // 如果API返回了机构详情
          Object.keys(dayData.org_details).forEach(orgId => {
            const orgData = dayData.org_details[orgId];
            const orgIdNum = parseInt(orgId);
            // 只处理选中的机构
            if (selectedOrganizations.value.includes(orgIdNum)) {
              orgDetails[orgId] = {
                name: orgData.name || organizations.find(org => org.id == orgIdNum)?.name || '',
                today_review: orgData.review || orgData.today_review || 0,
                today_register: orgData.register || orgData.today_register || 0,
                total: (orgData.review || orgData.today_review || 0) + (orgData.register || orgData.today_register || 0)
              };
              totalReview += orgData.review || orgData.today_review || 0;
              totalRegister += orgData.register || orgData.today_register || 0;
            }
          });
        } else {
          // 如果API返回的是总体数据，需要按选中机构分配
          // 如果没有机构详情，尝试从organizations构建（使用0作为默认值）
          organizations.forEach(org => {
            if (selectedOrganizations.value.includes(org.id)) {
              orgDetails[org.id] = {
                name: org.name,
                today_review: 0,
                today_register: 0,
                total: 0
              };
            }
          });
          
          // 如果API返回了总体数据，平均分配到各机构（或者根据实际情况调整）
          if (dayData.review !== undefined || dayData.register !== undefined) {
            totalReview = dayData.review || 0;
            totalRegister = dayData.register || 0;
          }
        }
        
        const activeData = {
          review: totalReview,
          register: totalRegister,
          orgDetails: orgDetails
        };
        
        // 先尝试从 IndexedDB 获取现有数据
        let existingData = await getTodayActiveDataFromIndexedDB(date);
        
        if (existingData) {
          // 如果存在数据，只更新新增和复查字段，保持其他字段不变
          console.log(`日期 ${date} 在 IndexedDB 中存在，只更新新增和复查字段`);
          
          // 创建完整的数据对象，包含所有字段
          const updatedData = {
            ...existingData,
            review: activeData.review,
            register: activeData.register,
            // IndexedDB 中的 total 字段意义不大，保持原值即可
            // 前端会根据统计类型重新计算 total
            timestamp: Date.now()
          };
          
          // 更新 orgDetails 中的活跃统计字段，保持工作统计字段不变
          Object.keys(activeData.orgDetails).forEach(orgId => {
            if (updatedData.orgDetails[orgId]) {
              updatedData.orgDetails[orgId] = {
                ...updatedData.orgDetails[orgId],
                today_review: activeData.orgDetails[orgId].today_review || 0,
                today_register: activeData.orgDetails[orgId].today_register || 0,
                // 重新计算机构总计
                total: (activeData.orgDetails[orgId].today_review || 0) + 
                       (activeData.orgDetails[orgId].today_register || 0) + 
                       (updatedData.orgDetails[orgId].today_incomplete || 0) + 
                       (updatedData.orgDetails[orgId].today_reminder || 0)
              };
            }
          });
          
          console.log(`日期 ${date} 数据更新完成:`, {
            选中的机构: selectedOrganizations.value,
            更新后的机构数量: Object.keys(updatedData.orgDetails).length,
            更新后的总计: updatedData.total
          });
          
          // 保存完整更新后的数据到 IndexedDB
          await saveTodayActiveDataToIndexedDB(updatedData);
          console.log(`日期 ${date} 的完整数据已更新到 IndexedDB`);
          
          // 返回过滤后的数据给 UI（只包含选中的机构）
          const filteredData = {
            ...updatedData,
            orgDetails: {}
          };
          
          // 只保留选中机构的数据给 UI
          selectedOrganizations.value.forEach(orgId => {
            if (updatedData.orgDetails[orgId]) {
              filteredData.orgDetails[orgId] = updatedData.orgDetails[orgId];
            }
          });
          
          return filteredData;
          
        } else {
          // 如果不存在数据，创建新的数据结构
          console.log(`日期 ${date} 在 IndexedDB 中不存在，创建新数据`);
          
          // 创建完整的数据结构，包含所有机构的数据
          const newData = {
            // IndexedDB 中的 total 字段意义不大，设为 0
            total: 0,
            review: activeData.review,
            register: activeData.register,
            incomplete: 0, // 工作统计字段初始化为0
            reminder: 0,   // 工作统计字段初始化为0
            orgDetails: activeData.orgDetails, // 包含所有机构的数据
            queryDate: date,
            timestamp: Date.now()
          };
          
          console.log(`日期 ${date} 新数据创建完成:`, {
            机构数量: Object.keys(newData.orgDetails).length,
            活跃统计总计: newData.total
          });
          
          // 保存完整数据到 IndexedDB
          await saveTodayActiveDataToIndexedDB(newData);
          console.log(`日期 ${date} 的完整新数据已保存到 IndexedDB`);
          
          // 返回过滤后的数据给 UI（只包含选中的机构）
          const filteredData = {
            ...newData,
            orgDetails: {}
          };
          
          // 只保留选中机构的数据给 UI
          selectedOrganizations.value.forEach(orgId => {
            if (newData.orgDetails[orgId]) {
              filteredData.orgDetails[orgId] = newData.orgDetails[orgId];
            }
          });
          
          return filteredData;
        }
        
      } catch (error) {
        console.error(`获取日期 ${date} 的数据失败:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    const validResults = results.filter(result => result !== null);
    
    console.log(`成功获取 ${validResults.length} 个日期的数据`);
    
    // 更新 UI 数据
    if (validResults.length > 0) {
      // 合并现有数据和新增数据
      const existingDates = activeStatsData.value.map(item => item.queryDate);
      const newData = validResults.filter(item => !existingDates.includes(item.queryDate));
      
      if (newData.length > 0) {
        // 创建新的数组确保响应式更新
        const updatedData = [...activeStatsData.value, ...newData];
        // 按日期排序
        updatedData.sort((a, b) => a.queryDate.localeCompare(b.queryDate));
        
        // 更新 UI 数据
        activeStatsData.value = updatedData;
        
        // 更新总计
        updateTotalActiveStats(updatedData);
        
        console.log('UI 数据已更新，新增数据条数:', newData.length);
        console.log('更新后的总数据条数:', updatedData.length);
        console.log('更新后的总计:', totalActiveStats.value);
        
        // 强制触发 UI 更新
        await nextTick();
        console.log('强制 UI 更新完成');
      }
    }
    
    // 最终检查 UI 数据状态
    console.log('fetchMissingDatesData 完成后的最终状态:', {
      activeStatsDataLength: activeStatsData.value.length,
      totalActiveStats: totalActiveStats.value,
      selectedOrganizations: selectedOrganizations.value.length
    });
    
  } catch (error) {
    console.error('获取缺失日期数据失败:', error);
  }
};

// 获取缺失工作统计日期的数据
const fetchMissingWorkDatesData = async (dates) => {
  try {
    console.log(`开始获取 ${dates.length} 个工作统计缺失日期的数据...`);
    
    // 使用选中的机构，如果没有选中则使用所有机构
    let organizations = [];
    if (selectedOrganizations.value.length > 0) {
      // 从机构树中筛选出选中的机构
      organizations = organizationTree.value.filter(org => 
        selectedOrganizations.value.includes(org.id)
      );
      console.log(`使用选中的 ${organizations.length} 个工作统计机构进行统计`);
    } else {
      console.warn('未选择任何机构，无法获取工作统计数据');
      message.warning('请选择要查看的机构');
      return;
    }
    
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (!csrftoken) {
      console.warn('未找到CSRF令牌，无法获取工作统计数据');
      return;
    }
    
    // 并行获取所有缺失日期的数据
    const promises = dates.map(async (date) => {
      try {
        console.log(`正在获取工作统计日期 ${date} 的数据...`);
        
        // 获取未完善和需提醒数据
        const workData = await fetchWorkStatsForModal(organizations, date);
        
        // 先尝试从 IndexedDB 获取现有数据
        let existingData = await getTodayActiveDataFromIndexedDB(date);
        
        if (existingData) {
          // 如果存在数据，只更新未完善和需提醒字段，保持其他字段不变
          console.log(`工作统计日期 ${date} 在 IndexedDB 中存在，只更新未完善和需提醒字段`);
          
          // 创建完整的数据对象，包含所有字段
          const updatedData = {
            ...existingData,
            incomplete: workData.incomplete,
            reminder: workData.reminder,
            // IndexedDB 中的 total 字段意义不大，保持原值即可
            // 前端会根据统计类型重新计算 total
            timestamp: Date.now()
          };
          
          // 更新 orgDetails 中的工作统计字段，保持活跃统计字段不变
          Object.keys(workData.orgDetails).forEach(orgId => {
            if (updatedData.orgDetails[orgId]) {
              updatedData.orgDetails[orgId] = {
                ...updatedData.orgDetails[orgId],
                today_incomplete: workData.orgDetails[orgId].incomplete || 0,
                today_reminder: workData.orgDetails[orgId].reminder || 0,
                // 重新计算机构总计
                total: (updatedData.orgDetails[orgId].today_review || 0) + 
                       (updatedData.orgDetails[orgId].today_register || 0) + 
                       (workData.orgDetails[orgId].incomplete || 0) + 
                       (workData.orgDetails[orgId].reminder || 0)
              };
            }
          });
          
          console.log(`工作统计日期 ${date} 数据更新完成:`, {
            选中的机构: selectedOrganizations.value,
            更新后的机构数量: Object.keys(updatedData.orgDetails).length,
            更新后的总计: updatedData.total
          });
          
          // 保存完整更新后的数据到 IndexedDB
          await saveTodayActiveDataToIndexedDB(updatedData);
          console.log(`工作统计日期 ${date} 的完整数据已更新到 IndexedDB`);
          
          // 返回过滤后的数据给 UI（只包含选中的机构）
          const filteredData = {
            ...updatedData,
            orgDetails: {}
          };
          
          // 只保留选中机构的数据给 UI
          selectedOrganizations.value.forEach(orgId => {
            if (updatedData.orgDetails[orgId]) {
              filteredData.orgDetails[orgId] = updatedData.orgDetails[orgId];
            }
          });
          
          return filteredData;
          
        } else {
          // 如果不存在数据，创建新的数据结构
          console.log(`工作统计日期 ${date} 在 IndexedDB 中不存在，创建新数据`);
          
          // 创建完整的数据结构，包含所有机构的数据
          const newData = {
            queryDate: date,
            incomplete: workData.incomplete,
            reminder: workData.reminder,
            // IndexedDB 中的 total 字段意义不大，设为 0
            total: 0,
            review: 0, // 活跃统计字段初始化为0
            register: 0, // 活跃统计字段初始化为0
            orgDetails: workData.orgDetails, // 包含所有机构的数据
            timestamp: Date.now()
          };
          
          console.log(`工作统计日期 ${date} 新数据创建完成:`, {
            机构数量: Object.keys(newData.orgDetails).length,
            工作统计总计: newData.total
          });
          
          // 保存完整数据到 IndexedDB
          await saveTodayActiveDataToIndexedDB(newData);
          console.log(`工作统计日期 ${date} 的完整新数据已保存到 IndexedDB`);
          
          // 返回过滤后的数据给 UI（只包含选中的机构）
          const filteredData = {
            ...newData,
            orgDetails: {}
          };
          
          // 只保留选中机构的数据给 UI
          selectedOrganizations.value.forEach(orgId => {
            if (newData.orgDetails[orgId]) {
              filteredData.orgDetails[orgId] = newData.orgDetails[orgId];
            }
          });
          
          return filteredData;
        }
        
      } catch (error) {
        console.error(`获取工作统计日期 ${date} 数据失败:`, error);
        return null;
      }
    });
    
    // 等待所有请求完成
    const results = await Promise.all(promises);
    const validResults = results.filter(result => result !== null);
    
    if (validResults.length > 0) {
      console.log(`成功获取 ${validResults.length} 个工作统计日期的数据`);
      
      // 更新工作统计数据
      const updatedData = [...workStatsData.value];
      
      validResults.forEach(newData => {
        const existingIndex = updatedData.findIndex(item => item.queryDate === newData.queryDate);
        if (existingIndex >= 0) {
          // 更新现有数据
          updatedData[existingIndex] = {
            ...updatedData[existingIndex],
            ...newData
          };
        } else {
          // 添加新数据
          updatedData.push(newData);
        }
      });
      
      // 按日期排序
      updatedData.sort((a, b) => a.queryDate.localeCompare(b.queryDate));
      
      // 更新 UI 数据
      workStatsData.value = updatedData;
      updateTotalWorkStats(updatedData);
      
      // 强制 UI 更新
      await nextTick();
      console.log('工作统计 UI 更新完成');
    }
    
    // 最终检查 UI 数据状态
    console.log('fetchMissingWorkDatesData 完成后的最终状态:', {
      workStatsDataLength: workStatsData.value.length,
      totalWorkStats: totalWorkStats.value,
      selectedOrganizations: selectedOrganizations.value.length
    });
    
  } catch (error) {
    console.error('获取缺失工作统计日期数据失败:', error);
  }
};

// 更新总计活跃统计数据
const updateTotalActiveStats = (dataArray) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    totalActiveStats.value = {
      total: 0,
      review: 0,
      register: 0,
      incomplete: 0,
      reminder: 0,
      need_remind: 0,
      overdue: 0,
      reminded: 0
    };
    console.log('数据为空，总计已重置为0');
    return;
  }
  
  const totals = {
    total: 0,
    review: 0,
    register: 0,
    incomplete: 0,
    reminder: 0,
    need_remind: 0,
    overdue: 0,
    reminded: 0
  };
  
  dataArray.forEach(item => {
    // 活跃统计只关心新增和复查，总数就是这两项的和
    totals.total += (item.review || 0) + (item.register || 0);
    totals.review += item.review || 0;
    totals.register += item.register || 0;
    // 活跃统计不关心工作统计字段，保持为0
    totals.incomplete = 0;
    totals.reminder = 0;
    // 新增：累加提醒数据
    totals.need_remind += item.need_remind || 0;
    totals.overdue += item.overdue || 0;
    totals.reminded += item.reminded || 0;
  });
  
  // 创建新对象确保响应式更新
  totalActiveStats.value = { ...totals };
    // console.log('总计活跃统计数据已更新（新增 + 复查）:', totals); // 已注释，减少控制台输出
    // console.log('更新后的 totalActiveStats:', totalActiveStats.value); // 已注释，减少控制台输出
};

// 更新总计工作统计数据
const updateTotalWorkStats = (dataArray) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    totalWorkStats.value = {
      total: 0,
      incomplete: 0,
      total_examinations: 0, // 新增：全部检查记录数量
      reminder: 0,
      need_remind: 0,
      overdue: 0,
      reminded: 0
    };
    console.log('工作统计数据为空，总计已重置为0');
    return;
  }
  
  const totals = {
    total: 0,
    incomplete: 0,
    total_examinations: 0, // 新增：全部检查记录数量
    reminder: 0,
    need_remind: 0,
    overdue: 0,
    reminded: 0
  };
  
  dataArray.forEach((item, index) => {
    const itemIncomplete = item.incomplete || 0;
    const itemTotalExaminations = item.total_examinations || 0;
    const itemReminder = item.reminder || 0;
    const itemNeedRemind = item.need_remind || 0;
    const itemOverdue = item.overdue || 0;
    const itemReminded = item.reminded || 0;
    
    // 计算已完善数量 = 总检查记录数 - 未完善数量
    const itemCompleted = itemTotalExaminations - itemIncomplete;
    
    // 计算已提醒数量 = 总需提醒数 - 待提醒数量
    const itemCompletedReminder = itemReminder - itemNeedRemind;
    
    // 总工作量 = 已完善 + 已提醒
    const itemTotal = itemCompleted + itemCompletedReminder;
    
    totals.total += itemTotal;
    totals.incomplete += itemIncomplete;
    totals.total_examinations += itemTotalExaminations; // 新增：累加全部检查记录数量
    totals.reminder += itemReminder;
    
    // 新增：累加提醒数据
    totals.need_remind += item.need_remind || 0;
    totals.overdue += item.overdue || 0;
    totals.reminded += item.reminded || 0;
    
    // console.log(`工作统计项目 ${index + 1} (${item.queryDate}):`, { // 已注释，减少控制台输出
    //   总检查记录: itemTotalExaminations,
    //   未完善: itemIncomplete,
    //   已完善: itemCompleted,
    //   总需提醒: itemReminder,
    //   待提醒: itemNeedRemind,
    //   已提醒: itemCompletedReminder,
    //   总工作量: itemTotal
    // });
  });
  
  // 创建新对象确保响应式更新
  totalWorkStats.value = { ...totals };
    // console.log('总计工作统计数据已更新（已完善 + 已提醒）:', totals); // 已注释，减少控制台输出
    // console.log('更新后的 totalWorkStats:', totalWorkStats.value); // 已注释，减少控制台输出
};

// 更新统计数据状态
const updateStatsData = () => {
  const oldLength = statsData.value.length;
  statsData.value = [];
  
  // 默认包含两种统计数据
  if (activeStatsData.value.length > 0) {
    statsData.value.push(...activeStatsData.value);
    console.log(`活跃统计数据已添加到 statsData，当前长度: ${statsData.value.length}`);
  }
  
  if (workStatsData.value.length > 0) {
    statsData.value.push(...workStatsData.value);
    console.log(`工作统计数据已添加到 statsData，当前长度: ${statsData.value.length}`);
  }
  
  console.log('统计数据状态已更新:', {
    之前长度: oldLength,
    活跃统计: {
      数据条数: activeStatsData.value.length,
      总计: totalActiveStats.value
    },
    工作统计: {
      数据条数: workStatsData.value.length,
      总计: totalWorkStats.value
    },
    最终总长度: statsData.value.length
  });
};

// 导出统计数据到 Excel
const exportStatsToExcel = async () => {
  try {
    exportLoading.value = true;
    console.log('开始导出统计数据到 Excel...');
    
    // 检查是否有数据
    if (!statsData.value.length) {
      message.warning('没有数据可以导出');
      return;
    }
    
    // 动态导入 xlsx 库
    const XLSX = await import('xlsx');
    
    // 默认导出两种统计数据
    console.log('开始导出活跃统计和工作统计数据');
    
    // 导出活跃统计
    if (activeStatsData.value.length > 0) {
      await exportActiveStatsToExcel();
    }
    
    // 导出工作统计
    if (workStatsData.value.length > 0) {
      await exportWorkStatsToExcel();
    }
    
    message.success('两个 Excel 文件已分别导出');
    
  } catch (error) {
    console.error('导出 Excel 失败:', error);
    message.error('导出失败，请稍后重试');
  } finally {
    exportLoading.value = false;
  }
};

// 导出活跃统计数据到 Excel
const exportActiveStatsToExcel = async () => {
  try {
    console.log('开始导出活跃统计数据到 Excel...');
    
    // 动态导入 xlsx 库
    const XLSX = await import('xlsx');
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    
    // 使用分组后的数据（根据显示方式）
    const dataToExport = groupedActiveStatsData.value;
    const mode = activeStatsDisplayMode.value;
    const periodLabel = getDisplayModeLabel(mode);
    
    // 创建活跃统计工作表
    const activeSheetData = [
      [periodLabel, '复查量', '新增量', '总计']
    ];
    
    // 添加数据到活跃统计表
    dataToExport.forEach(periodData => {
      activeSheetData.push([
        periodData.period,
        periodData.review || 0,
        periodData.register || 0,
        periodData.total || 0
      ]);
    });
    
    // 添加汇总行
    const totalPeriods = dataToExport.length;
    const totalReviewSum = dataToExport.reduce((sum, periodData) => sum + (periodData.review || 0), 0);
    const totalRegisterSum = dataToExport.reduce((sum, periodData) => sum + (periodData.register || 0), 0);
    const totalSum = totalReviewSum + totalRegisterSum;
    
    const summaryLabel = mode === 'day' ? `天数(${totalPeriods}天)` :
                         mode === 'month' ? `月数(${totalPeriods}个月)` :
                         mode === 'quarter' ? `季度数(${totalPeriods}个季度)` :
                         `年数(${totalPeriods}年)`;
    
    activeSheetData.push([
      summaryLabel,
      totalReviewSum,
      totalRegisterSum,
      totalSum
    ]);
    
    console.log('活跃统计汇总数据:', {
      期数: totalPeriods,
      复查总量: totalReviewSum,
      新增总量: totalRegisterSum,
      总计: totalSum
    });
    
    // 创建活跃统计工作表
    const activeSheet = XLSX.utils.aoa_to_sheet(activeSheetData);
    XLSX.utils.book_append_sheet(workbook, activeSheet, '活跃统计');
    
    // 为每个机构创建活跃统计工作表
    const selectedOrgIds = selectedOrganizations.value;
    const selectedOrgs = organizationTree.value.filter(org => 
      selectedOrgIds.includes(org.id)
    );
    
    for (const org of selectedOrgs) {
      const orgSheetData = [
        [periodLabel, '复查量', '新增量', '总计']
      ];
      
      // 添加该机构的数据
      let orgTotalReview = 0;
      let orgTotalRegister = 0;
      
      dataToExport.forEach(periodData => {
        const orgData = periodData.orgDetails[org.id];
        if (orgData) {
          const review = orgData.today_review || 0;
          const register = orgData.today_register || 0;
          const total = orgData.total || 0;
          
          orgSheetData.push([
            periodData.period,
            review,
            register,
            total
          ]);
          
          // 累加总和
          orgTotalReview += review;
          orgTotalRegister += register;
        } else {
          // 如果该机构某期没有数据，显示0
          orgSheetData.push([
            periodData.period,
            0,
            0,
            0
          ]);
        }
      });
      
      // 添加机构汇总行
      const orgTotalSum = orgTotalReview + orgTotalRegister;
      orgSheetData.push([
        summaryLabel,
        orgTotalReview,
        orgTotalRegister,
        orgTotalSum
      ]);
      
      console.log(`机构 ${org.name} 活跃统计汇总数据:`, {
        期数: totalPeriods,
        复查总量: orgTotalReview,
        新增总量: orgTotalRegister,
        总计: orgTotalSum
      });
      
      // 创建机构工作表
      const orgSheet = XLSX.utils.aoa_to_sheet(orgSheetData);
      XLSX.utils.book_append_sheet(workbook, orgSheet, `${org.name}_活跃统计`);
    }
    
    // 生成文件名
    const startDate = statsStartDate.value?.format('MM-DD') || '开始日期';
    const endDate = statsEndDate.value?.format('MM-DD') || '结束日期';
    const modeSuffix = mode === 'day' ? '按天' :
                       mode === 'month' ? '按月' :
                       mode === 'quarter' ? '按季度' :
                       '按年';
    const fileName = `活跃统计数据表_${startDate}至${endDate}_${modeSuffix}.xlsx`;
    
    // 导出文件
    XLSX.writeFile(workbook, fileName);
    
    message.success(`活跃统计 Excel 文件已导出: ${fileName}`);
    console.log('活跃统计 Excel 导出完成:', fileName);
    
  } catch (error) {
    console.error('导出活跃统计 Excel 失败:', error);
    throw error;
  }
};

// 导出工作统计数据到 Excel
const exportWorkStatsToExcel = async () => {
  try {
    console.log('开始导出工作统计数据到 Excel...');
    
    // 动态导入 xlsx 库
    const XLSX = await import('xlsx');
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    
    // 创建工作统计工作表
    const workSheetData = [
      ['日期', '未完善量', '需提醒量', '总计']
    ];
    
    // 添加每日数据到工作统计表
    workStatsData.value.forEach(dayData => {
      workSheetData.push([
        dayData.queryDate,
        dayData.incomplete || 0,
        dayData.reminder || 0,
        dayData.total || 0
      ]);
    });
    
    // 添加汇总行
    const totalDays = workStatsData.value.length;
    const totalIncompleteSum = workStatsData.value.reduce((sum, dayData) => sum + (dayData.incomplete || 0), 0);
    const totalReminderSum = workStatsData.value.reduce((sum, dayData) => sum + (dayData.reminder || 0), 0);
    const totalSum = totalIncompleteSum + totalReminderSum;
    
    workSheetData.push([
      `天数(${totalDays}天)`,
      totalIncompleteSum,
      totalReminderSum,
      totalSum
    ]);
    
    console.log('工作统计汇总数据:', {
      天数: totalDays,
      未完善总量: totalIncompleteSum,
      需提醒总量: totalReminderSum,
      总计: totalSum
    });
    
    // 创建工作统计工作表
    const workSheet = XLSX.utils.aoa_to_sheet(workSheetData);
    XLSX.utils.book_append_sheet(workbook, workSheet, '工作统计');
    
    // 为每个机构创建工作统计工作表
    const selectedOrgIds = selectedOrganizations.value;
    const selectedOrgs = organizationTree.value.filter(org => 
      selectedOrgIds.includes(org.id)
    );
    
    for (const org of selectedOrgs) {
      const orgSheetData = [
        ['日期', '未完善量', '需提醒量', '总计']
      ];
      
      // 添加该机构每日的数据
      let orgTotalIncomplete = 0;
      let orgTotalReminder = 0;
      
      workStatsData.value.forEach(dayData => {
        const orgData = dayData.orgDetails[org.id];
        if (orgData) {
          const incomplete = orgData.incomplete || 0;
          const reminder = orgData.reminder || 0;
          const total = orgData.total || 0;
          
          orgSheetData.push([
            dayData.queryDate,
            incomplete,
            reminder,
            total
          ]);
          
          // 累加总和
          orgTotalIncomplete += incomplete;
          orgTotalReminder += reminder;
        } else {
          // 如果该机构某天没有数据，显示0
          orgSheetData.push([
            dayData.queryDate,
            0,
            0,
            0
          ]);
        }
      });
      
      // 添加机构汇总行
      const orgTotalSum = orgTotalIncomplete + orgTotalReminder;
      orgSheetData.push([
        `天数(${workStatsData.value.length}天)`,
        orgTotalIncomplete,
        orgTotalReminder,
        orgTotalSum
      ]);
      
      console.log(`机构 ${org.name} 工作统计汇总数据:`, {
        天数: workStatsData.value.length,
        未完善总量: orgTotalIncomplete,
        需提醒总量: orgTotalReminder,
        总计: orgTotalSum
      });
      
      // 创建机构工作表
      const orgSheet = XLSX.utils.aoa_to_sheet(orgSheetData);
      XLSX.utils.book_append_sheet(workbook, orgSheet, `${org.name}_工作统计`);
    }
    
    // 生成文件名
    const startDate = statsStartDate.value?.format('MM-DD') || '开始日期';
    const endDate = statsEndDate.value?.format('MM-DD') || '结束日期';
    const fileName = `工作统计数据表_${startDate}至${endDate}.xlsx`;
    
    // 导出文件
    XLSX.writeFile(workbook, fileName);
    
    message.success(`工作统计 Excel 文件已导出: ${fileName}`);
    console.log('工作统计 Excel 导出完成:', fileName);
    
  } catch (error) {
    console.error('导出工作统计 Excel 失败:', error);
    throw error;
  }
};

// 机构选择器选项
const organizationOptions = computed(() => {
  return organizationTree.value.map(org => ({
    label: org.name,
    value: org.id
  }));
});



// 批量获取日期范围内所有机构的新增和复查数据
const fetchActiveStatsForDateRange = async (startDate, endDate) => {
  try {
    console.log(`开始批量获取日期范围 ${startDate} 到 ${endDate} 的活跃统计数据...`);
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (!csrftoken) {
      console.warn('未找到CSRF令牌，无法获取活跃数据');
      return {};
    }
    
    // 获取选中的机构ID列表
    const organizationIds = selectedOrganizations.value.length > 0 
      ? selectedOrganizations.value 
      : organizationTree.value.map(org => org.id);
    
    // 使用新的API一次性获取所有机构的数据
    const response = await fetch('https://aiforoptometry.com/statistics/daily-review/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        organization_ids: organizationIds,
        debug: true
      }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('批量获取的活跃统计数据原始响应:', responseData);
    
    // 解析新的返回格式
    // 格式: { "code": 0, "message": "success", "data": [{ "organization_id": 2, "items": [...] }] }
    if (responseData.code !== 0 || !responseData.data || !Array.isArray(responseData.data)) {
      console.warn('API返回格式不正确:', responseData);
      return {};
    }
    
    // 转换为按日期组织的格式
    // 目标格式: { "2025-12-01": { "org_details": { "2": { "review": 1, "register": 0, "name": "机构名" } }, "review": 1, "register": 0 } }
    const dateOrganizedData = {};
    const organizations = organizationTree.value;
    
    // 遍历每个机构的数据
    responseData.data.forEach(orgData => {
      const orgId = orgData.organization_id;
      // 优先使用API返回的机构名称，如果没有则从organizationTree中查找，最后使用默认值
      const orgName = orgData.organization_name || 
                     (organizations.find(o => o.id === orgId)?.name) || 
                     `机构${orgId}`;
      
      // 遍历该机构的每日数据
      if (orgData.items && Array.isArray(orgData.items)) {
        orgData.items.forEach(item => {
          const date = item.date;
          
          // 初始化日期数据
          if (!dateOrganizedData[date]) {
            dateOrganizedData[date] = {
              review: 0,
              register: 0,
              org_details: {}
            };
          }
          
          // 添加机构详情
          const review = item.today_review || 0;
          const register = item.today_new || 0;
          
          dateOrganizedData[date].org_details[orgId] = {
            review: review,
            register: register,
            today_review: review,  // 兼容字段
            today_register: register,  // 兼容字段
            name: orgName
          };
          
          // 累加总计（只累加选中机构的数据）
          if (organizationIds.includes(orgId)) {
            dateOrganizedData[date].review += review;
            dateOrganizedData[date].register += register;
          }
        });
      }
    });
    
    console.log('转换后的按日期组织的数据:', dateOrganizedData);
    
    return dateOrganizedData;
    
  } catch (error) {
    console.error('批量获取活跃统计数据失败:', error);
    return {};
  }
};

// 专门为活跃统计 modal 获取新增和复查数据（不影响其他字段）
// 为了兼容性，保留单日期版本，内部使用批量API
const fetchActiveStatsForModal = async (organizations, queryDate) => {
  try {
    console.log('开始获取活跃统计 modal 的新增和复查数据...');
    
    // 使用批量API获取单日数据
    const dateData = await fetchActiveStatsForDateRange(queryDate, queryDate);
    
    // 如果API返回的是按日期组织的对象
    const dayData = dateData[queryDate] || {};
    
    // 提取数据
    let totalReview = 0;
    let totalRegister = 0;
    const orgDetails = {};
    
    // 处理API返回的数据格式
    // API返回格式可能是: { "review": 10, "register": 5, "org_details": { "1": { "review": 5, "register": 2, "name": "机构名" }, ... } }
    // 或者: { "review": 10, "register": 5 } (只有总体数据)
    
    if (dayData.org_details && typeof dayData.org_details === 'object') {
      // 如果API返回了机构详情
      Object.keys(dayData.org_details).forEach(orgId => {
        const orgData = dayData.org_details[orgId];
        const orgIdNum = parseInt(orgId);
        orgDetails[orgId] = {
          name: orgData.name || organizations.find(org => org.id == orgIdNum)?.name || '',
          today_review: orgData.review || orgData.today_review || 0,
          today_register: orgData.register || orgData.today_register || 0,
          total: (orgData.review || orgData.today_review || 0) + (orgData.register || orgData.today_register || 0)
        };
        totalReview += orgData.review || orgData.today_review || 0;
        totalRegister += orgData.register || orgData.today_register || 0;
      });
    } else {
      // 如果API返回的是总体数据
      totalReview = dayData.review || 0;
      totalRegister = dayData.register || 0;
      
      // 如果没有机构详情，尝试从organizations构建
      organizations.forEach(org => {
        orgDetails[org.id] = {
          name: org.name,
          today_review: 0,
          today_register: 0,
          total: 0
        };
      });
    }
    
    console.log('活跃统计 modal 数据汇总:', {
      新增: totalRegister,
      复查: totalReview,
      总计: totalReview + totalRegister
    });
    
    return {
      review: totalReview,
      register: totalRegister,
      orgDetails: orgDetails
    };
    
  } catch (error) {
    console.error('获取活跃统计 modal 数据失败:', error);
    return { review: 0, register: 0, orgDetails: {} };
  }
};

// 专门为工作统计 modal 获取未完善和需提醒数据（不影响其他字段）
const fetchWorkStatsForModal = async (organizations, queryDate) => {
  try {
    console.log('开始获取工作统计 modal 的未完善和需提醒数据...');
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (!csrftoken) {
      console.warn('未找到CSRF令牌，无法获取工作数据');
      return { incomplete: 0, reminder: 0, orgDetails: {} };
    }
    
    let totalIncomplete = 0;
    let totalReminder = 0;
    const orgDetails = {};
    
    // 遍历所有机构，只获取未完善和需提醒数据
    for (const org of organizations) {
      try {
        // 获取指定日期的检查记录（未完善）
        const incompleteResponse = await fetch(`https://aiforoptometry.com/organization/${org.id}/examinations/?date=${queryDate}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          }
        });
        const incompleteData = await incompleteResponse.json();
        let incompleteCount = 0;
        if (incompleteData.data) {
          // 过滤出未完善的检查记录
          incompleteCount = incompleteData.data.filter(item => {
            return !checkExaminationComplete(item);
          }).length;
        }

        // 获取指定日期的需提醒数据
        const reminderResponse = await fetch('https://aiforoptometry.com/reminders/upcoming/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify({
            remindDate: queryDate,
            overdue_date: queryDate,
            organization_id: org.id
          })
        });
        const reminderData = await reminderResponse.json();
        
        // 处理返回的数据结构，兼容新的格式
        let reminderCount = 0;
        if (Array.isArray(reminderData)) {
          // 旧格式：直接返回数组
          reminderCount = reminderData.length;
        } else if (reminderData && typeof reminderData === 'object') {
          // 新格式：包含 overdue 和 normal 数组
          const overdueCount = reminderData.overdue && Array.isArray(reminderData.overdue) ? reminderData.overdue.length : 0;
          const normalCount = reminderData.normal && Array.isArray(reminderData.normal) ? reminderData.normal.length : 0;
          reminderCount = overdueCount + normalCount;
        }

        // 累加数据
        totalIncomplete += incompleteCount;
        totalReminder += reminderCount;
        
        // 保存每个机构的详细数据（只包含未完善和需提醒）
        orgDetails[org.id] = {
          name: org.name,
          incomplete: incompleteCount,
          reminder: reminderCount,
          total: incompleteCount + reminderCount
        };
        
        console.log(`机构 ${org.name} 工作统计数据:`, {
          未完善: incompleteCount,
          需提醒: reminderCount,
          总计: incompleteCount + reminderCount
        });
        
        // 添加小延迟，避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`获取机构 ${org.name} 工作统计数据失败:`, error);
        // 如果获取失败，使用0作为默认值
        orgDetails[org.id] = {
          name: org.name,
          incomplete: 0,
          reminder: 0,
          total: 0
        };
      }
    }
    
    console.log('工作统计 modal 数据汇总:', {
      未完善: totalIncomplete,
      需提醒: totalReminder,
      总计: totalIncomplete + totalReminder
    });
    
    return {
      incomplete: totalIncomplete,
      reminder: totalReminder,
      orgDetails: orgDetails
    };
    
  } catch (error) {
    console.error('获取工作统计 modal 数据失败:', error);
    return { incomplete: 0, reminder: 0, orgDetails: {} };
  }
};

// 初始化图表展示弹窗中的图表
const initChartModal = () => {
  console.log('开始初始化图表，chartContainer:', chartContainer.value);
  
  if (!chartContainer.value) {
    console.warn('图表容器元素未找到，等待DOM更新');
    // 等待DOM更新
    setTimeout(() => {
      initChartModal();
    }, 100);
    return;
  }
  
  try {
    // 销毁旧的独立图表实例
    if (isolatedChartInstance) {
      try {
        isolatedChartInstance.dispose();
      } catch (error) {
        console.warn('销毁独立图表实例时出错:', error);
      }
      isolatedChartInstance = null;
    }
    
    // 确保容器有尺寸
    const container = chartContainer.value;
    console.log('图表容器:', container);
    console.log('容器尺寸:', container.offsetWidth, 'x', container.offsetHeight);
    
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.warn('图表容器尺寸为0，等待容器渲染完成');
      // 等待容器渲染完成
      setTimeout(() => {
        initChartModal();
      }, 100);
      return;
    }
    
    // 创建完全独立的图表实例，使用新的容器克隆
    const isolatedContainer = container.cloneNode(true);
    isolatedContainer.style.width = container.offsetWidth + 'px';
    isolatedContainer.style.height = container.offsetHeight + 'px';
    
    // 清空原容器并添加独立容器
    container.innerHTML = '';
    container.appendChild(isolatedContainer);
    
    // 创建独立的 ECharts 实例
    isolatedChartInstance = echarts.init(isolatedContainer);
    console.log('独立ECharts实例创建成功:', isolatedChartInstance);
    
    // 渲染图表（使用debugchart.vue的配置）
    renderChartModal();
    
  } catch (error) {
    console.error('初始化图表展示弹窗图表失败:', error);
  }
};

// 渲染图表展示弹窗中的图表
const renderChartModal = () => {
  if (!isolatedChartInstance) {
    console.warn('独立图表实例未初始化');
    return;
  }
  
  try {
    console.log('开始渲染图表...');
    
    // 使用debugchart.vue的图表配置，确保完全一致
    const option = {
      title: {
        text: 'ECharts 示例',
        left: 'center'
      },
      tooltip: {
        trigger: 'item'
      },
      legend: {
        top: '10%',
        data: ['系列1', '系列2', '系列3'],
        selected: {
          '系列1': true,
          '系列2': true,
          '系列3': true
        }
      },
      xAxis: {
        type: 'category',
        data: ['A', 'B', 'C', 'D', 'E']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '系列1',
          type: 'line',
          data: [120, 132, 101, 134, 90],
          smooth: true
        },
        {
          name: '系列2',
          type: 'line',
          data: [220, 182, 191, 234, 290],
          smooth: true
        },
        {
          name: '系列3',
          type: 'line',
          data: [150, 232, 201, 154, 190],
          smooth: true
        }
      ]
    };
    
    console.log('图表配置:', JSON.stringify(option, null, 2));
    console.log('Series配置:', option.series);
    
    // 先清空图表，再设置新数据
    isolatedChartInstance.clear();
    isolatedChartInstance.setOption(option);
    
    console.log('图表渲染完成');
    
    // 测试图例点击功能
    setTimeout(() => {
      console.log('独立图表实例状态:', isolatedChartInstance);
      console.log('独立图表DOM元素:', isolatedChartInstance.getDom());
    }, 500);
    
  } catch (error) {
    console.error('渲染图表展示弹窗图表失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 显示错误状态
    const errorOption = {
      title: {
        text: '图表渲染失败',
        left: 'center',
        top: 'center',
        textStyle: {
          fontSize: 16,
          color: '#ff4d4f'
        }
      }
    };
    isolatedChartInstance.setOption(errorOption);
  }
};

// 加载统计数据表格数据
const loadStatsTableData = async () => {
  try {
    // 先尝试从缓存加载数据
    const cachedStats = loadCachedOrganizationStats();
    if (cachedStats && cachedStats.orgStatsData) {
      console.log('使用缓存的机构统计数据表格数据');
      
      // 从localStorage获取机构树数据
      const orgTreeStr = localStorage.getItem('机构树');
      if (orgTreeStr) {
        const orgTree = JSON.parse(orgTreeStr);
        
        // 构建表格数据
        const statsData = orgTree.map(org => {
          const cachedOrgStats = cachedStats.orgStatsData[org.id];
          return {
            id: org.id,
            name: org.name,
            contact: org.contact,
            total_patients: cachedOrgStats ? cachedOrgStats.total_patients : 0,
            total_examinations: cachedOrgStats ? cachedOrgStats.total_examinations : 0
          };
        });
        
        // 应用排序
        const sortedData = applySorting(statsData);
        statsTableData.value = sortedData;
        
        console.log('从缓存加载统计数据表格数据完成:', sortedData);
      }
      
      // 使用缓存数据，不进行静默更新
      console.log('使用缓存数据，不进行静默更新');
      return;
    }
    
    // 没有缓存，正常请求数据
    console.log('没有缓存数据，开始请求统计数据表格数据');
    await loadStatsTableDataWithLoading();
    
  } catch (error) {
    console.error('加载统计数据表格数据失败:', error);
    message.error('加载统计数据失败');
  }
};

// 静默加载今日活跃数据表格数据（不显示加载状态）
const loadTodayActiveTableDataSilently = async () => {
  try {
    // 先尝试从【单日活跃】缓存加载数据
    const cachedTodayActive = loadCachedTodayActiveData();
    if (cachedTodayActive && cachedTodayActive.orgDetails) {
      console.log('静默使用缓存的单日活跃数据');
      
      // 从localStorage获取机构树数据
      const orgTreeStr = localStorage.getItem('机构树');
      if (orgTreeStr) {
        const orgTree = JSON.parse(orgTreeStr);
        
        // 构建表格数据
        const todayActiveData = orgTree.map(org => {
          const cachedOrgDetails = cachedTodayActive.orgDetails[org.id];
          return {
            id: org.id,
            name: org.name,
            today_review: cachedOrgDetails ? cachedOrgDetails.today_review || 0 : 0,
            today_register: cachedOrgDetails ? cachedOrgDetails.today_register || 0 : 0,
            today_incomplete: cachedOrgDetails ? cachedOrgDetails.today_incomplete || 0 : 0,
            today_reminder: cachedOrgDetails ? cachedOrgDetails.today_reminder || 0 : 0,
            score: cachedOrgDetails ? cachedOrgDetails.score || 0 : 0,
            total: cachedOrgDetails ? cachedOrgDetails.total || 0 : 0
          };
        });
        
        // 更新表格数据
        todayActiveTableData.value = todayActiveData;
        
        console.log('静默从缓存加载今日活跃数据完成:', todayActiveData);
      }
      
      return;
    }
    
    // 没有缓存，显示空数据
    console.log('没有单日活跃缓存数据，显示空状态');
    todayActiveTableData.value = [];
    
  } catch (error) {
    console.error('静默加载今日活跃数据表格数据失败:', error);
    todayActiveTableData.value = [];
  }
};

// 加载今日活跃数据表格数据
const loadTodayActiveTableData = async () => {
  try {
    todayActiveTableLoading.value = true;
    
    // 先尝试从【单日活跃】缓存加载数据
    const cachedTodayActive = loadCachedTodayActiveData();
    if (cachedTodayActive && cachedTodayActive.orgDetails) {
      console.log('使用缓存的单日活跃数据');
      
      // 从localStorage获取机构树数据
      const orgTreeStr = localStorage.getItem('机构树');
      if (orgTreeStr) {
        const orgTree = JSON.parse(orgTreeStr);
        
        // 构建表格数据
        const todayActiveData = orgTree.map(org => {
          const cachedOrgDetails = cachedTodayActive.orgDetails[org.id];
          return {
            id: org.id,
            name: org.name,
            today_review: cachedOrgDetails ? cachedOrgDetails.today_review || 0 : 0,
            today_register: cachedOrgDetails ? cachedOrgDetails.today_register || 0 : 0,
            today_incomplete: cachedOrgDetails ? cachedOrgDetails.today_incomplete || 0 : 0,
            today_reminder: cachedOrgDetails ? cachedOrgDetails.today_reminder || 0 : 0,
            score: cachedOrgDetails ? cachedOrgDetails.score || 0 : 0,
            total: cachedOrgDetails ? cachedOrgDetails.total || 0 : 0
          };
        });
        
        // 更新表格数据
        todayActiveTableData.value = todayActiveData;
        
        console.log('从【单日活跃】缓存加载今日活跃数据完成:', todayActiveData);
      }
      
      // 使用缓存数据，不进行静默更新
      console.log('使用缓存数据，不进行静默更新');
      return;
    }
    
    // 没有缓存，显示提示信息
    console.log('没有单日活跃缓存数据，无法显示今日活跃数据');
    message.warning('暂无今日活跃数据，请先更新数据');
    todayActiveTableData.value = [];
    
  } catch (error) {
    console.error('加载今日活跃数据表格数据失败:', error);
    message.error('加载今日活跃数据失败');
  } finally {
    todayActiveTableLoading.value = false;
  }
};



// 带加载状态的加载统计数据表格数据
const loadStatsTableDataWithLoading = async () => {
  try {
    statsTableLoading.value = true;
    
    // 从localStorage获取机构树数据
    const orgTreeStr = localStorage.getItem('机构树');
    if (!orgTreeStr) {
      message.error('未找到机构数据，请先加载机构列表');
      return;
    }
    
    const orgTree = JSON.parse(orgTreeStr);
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (!csrftoken) {
      message.error('未找到CSRF令牌，无法获取统计数据');
      return;
    }
    
    // 获取每个机构的统计数据
    const statsData = [];
    for (const org of orgTree) {
      try {
        const response = await fetch('https://aiforoptometry.com/medicalrecords/search_org_total_ptandexam', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify({
            org_id: org.id
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data && !data.error) {
          statsData.push({
            id: org.id,
            name: org.name,
            contact: org.contact,
            total_patients: data.total_patients || 0,
            total_examinations: data.total_examinations || 0
          });
        } else {
          // 如果获取失败，使用0作为默认值
          statsData.push({
            id: org.id,
            name: org.name,
            contact: org.contact,
            total_patients: 0,
            total_examinations: 0
          });
        }
        
        // 添加小延迟，避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`获取机构 ${org.name} 统计数据失败:`, error);
        // 如果获取失败，使用0作为默认值
        statsData.push({
          id: org.id,
          name: org.name,
          contact: org.contact,
          total_patients: 0,
          total_examinations: 0
        });
      }
    }
    
         // 应用排序
     const sortedData = applySorting(statsData);
     statsTableData.value = sortedData;
     
     console.log('统计数据表格数据加载完成:', sortedData);
    
  } catch (error) {
    console.error('加载统计数据表格数据失败:', error);
    message.error('加载统计数据失败');
  } finally {
    statsTableLoading.value = false;
  }
};

// 导出机构统计数据到 Excel
const exportOrgStatsToExcel = async () => {
  try {
    console.log('开始导出机构统计数据到 Excel...');
    
    if (!statsTableData.value || statsTableData.value.length === 0) {
      message.warning('没有数据可以导出');
      return;
    }
    
    // 动态导入 xlsx 库
    const XLSX = await import('xlsx');
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    
    // 创建工作表数据
    const sheetData = [
      ['机构名', '联系人', '总患者数', '总检查次数']
    ];
    
    // 添加数据行
    let totalPatients = 0;
    let totalExaminations = 0;
    
    statsTableData.value.forEach(org => {
      sheetData.push([
        org.name || '',
        org.contact || '-',
        org.total_patients || 0,
        org.total_examinations || 0
      ]);
      
      totalPatients += org.total_patients || 0;
      totalExaminations += org.total_examinations || 0;
    });
    
    // 添加汇总行
    sheetData.push([
      '汇总',
      '-',
      totalPatients,
      totalExaminations
    ]);
    
    console.log('机构统计数据汇总:', {
      机构数: statsTableData.value.length,
      总患者数: totalPatients,
      总检查次数: totalExaminations
    });
    
    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '机构统计数据');
    
    // 生成文件名
    const fileName = `机构统计数据_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
    
    // 导出文件
    XLSX.writeFile(workbook, fileName);
    
    message.success(`机构统计数据 Excel 文件已导出: ${fileName}`);
    console.log('机构统计数据 Excel 导出完成:', fileName);
    
  } catch (error) {
    console.error('导出机构统计数据 Excel 失败:', error);
    message.error('导出失败，请稍后重试');
  }
};

// 应用排序
const applySorting = (data) => {
  if (!sortState.value.field || !sortState.value.order) {
    return data;
  }
  
  const sortedData = [...data];
  
  sortedData.sort((a, b) => {
    let aValue = a[sortState.value.field];
    let bValue = b[sortState.value.field];
    
    // 对于数字字段，确保按数字排序
    if (sortState.value.field === 'total_patients' || sortState.value.field === 'total_examinations') {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    }
    
    if (sortState.value.order === 'ascend') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  return sortedData;
};

// 初始化统计图表
const initStatsChart = () => {
  if (!statsChartRef.value) {
    console.warn('图表容器元素未找到');
    return;
  }
  
  try {
    // 销毁旧的独立图表实例
    if (isolatedStatsChartInstance) {
      try {
        isolatedStatsChartInstance.dispose();
      } catch (error) {
        console.warn('销毁独立统计图表实例时出错:', error);
      }
      isolatedStatsChartInstance = null;
    }
    
    // 确保容器有尺寸
    const container = statsChartRef.value;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.warn('图表容器尺寸为0，等待容器渲染完成');
      // 等待容器渲染完成
      setTimeout(() => {
        initStatsChart();
      }, 100);
      return;
    }
    
    // 创建完全独立的图表实例，使用新的容器克隆
    const isolatedContainer = container.cloneNode(true);
    isolatedContainer.style.width = container.offsetWidth + 'px';
    isolatedContainer.style.height = container.offsetHeight + 'px';
    
    // 清空原容器并添加独立容器
    container.innerHTML = '';
    container.appendChild(isolatedContainer);
    
    // 创建独立的 ECharts 实例
    isolatedStatsChartInstance = echarts.init(isolatedContainer);
    console.log('独立统计图表实例创建成功:', isolatedStatsChartInstance);
    
    // 渲染图表
    renderStatsChart();
    
  } catch (error) {
    console.error('初始化统计图表失败:', error);
  }
};

// 渲染统计图表
const renderStatsChart = () => {
  if (!isolatedStatsChartInstance) {
    console.warn('独立统计图表实例未初始化');
    return;
  }
  
  if (!statsTableData.value || !Array.isArray(statsTableData.value) || statsTableData.value.length === 0) {
    console.warn('统计数据为空，无法渲染图表');
    // 显示空状态
    const emptyOption = {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: {
          fontSize: 16,
          color: '#999'
        }
      }
    };
    isolatedStatsChartInstance.setOption(emptyOption);
    return;
  }
  
  try {
    // 确保数据格式正确
    const chartData = statsTableData.value.filter(item => 
      item && item.name && 
      (item.total_patients !== undefined && item.total_patients !== null) &&
      (item.total_examinations !== undefined && item.total_examinations !== null)
    );
    
    if (chartData.length === 0) {
      console.warn('过滤后没有有效数据');
      const emptyOption = {
        title: {
          text: '暂无有效数据',
          left: 'center',
          top: 'center',
          textStyle: {
            fontSize: 16,
            color: '#999'
          }
        }
      };
      isolatedStatsChartInstance.setOption(emptyOption);
      return;
    }
    
    const option = {
      title: {
        text: '机构统计数据对比',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          if (!params || params.length === 0) return '';
          let result = `${params[0].name}<br/>`;
          params.forEach(param => {
            if (param && param.seriesName !== undefined && param.value !== undefined) {
              result += `${param.seriesName}: ${param.value}<br/>`;
            }
          });
          return result;
        }
      },
      legend: {
        data: ['患者总数', '总检查次数'],
        top: 40,
        left: 'center',
        selectedMode: true
      },
      grid: {
        left: '8%',
        right: '4%',
        bottom: '15%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartData.map(item => item.name || ''),
        axisLabel: {
          fontSize: 15,
          color: '#666',
          interval: 0,
          rotate: 0,
          formatter: function(value) {
            if (!value) return '';
            // 将文字按字符分行，实现从上往下的垂直排列
            return value.split('').join('\n');
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '数量',
        nameTextStyle: {
          fontSize: 12,
          color: '#666'
        },
        axisLabel: {
          fontSize: 12,
          color: '#666'
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#e8e8e8'
          }
        }
      },
      series: [
        {
          name: '患者总数',
          type: 'bar',
          data: chartData.map(item => Number(item.total_patients) || 0),
          itemStyle: {
            color: '#667eea'
          },
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            color: '#667eea'
          }
        },
        {
          name: '总检查次数',
          type: 'bar',
          data: chartData.map(item => Number(item.total_examinations) || 0),
          itemStyle: {
            color: '#f093fb'
          },
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            color: '#f093fb'
          }
        }
      ]
    };
    
    // 先清空图表，再设置新数据
    isolatedStatsChartInstance.clear();
    isolatedStatsChartInstance.setOption(option);
    
    // 添加图例点击事件监听
    isolatedStatsChartInstance.on('legendselectchanged', function(params) {
      console.log('机构统计数据图表图例变化:', params);
      // 可以在这里添加自定义逻辑，比如更新其他相关显示
    });
    
  } catch (error) {
    console.error('渲染统计图表失败:', error);
    // 显示错误状态
    const errorOption = {
      title: {
        text: '图表渲染失败',
        left: 'center',
        top: 'center',
        textStyle: {
          fontSize: 16,
          color: '#ff4d4f'
        }
      }
    };
    isolatedStatsChartInstance.setOption(errorOption);
  }
};

// 初始化今日活跃图表
const initTodayActiveChart = () => {
  if (!todayActiveChartRef.value) {
    console.warn('今日活跃图表容器元素未找到');
    return;
  }
  
  try {
    // 销毁旧的独立图表实例
    if (isolatedTodayActiveChartInstance) {
      try {
        isolatedTodayActiveChartInstance.dispose();
      } catch (error) {
        console.warn('销毁独立今日活跃图表实例时出错:', error);
      }
      isolatedTodayActiveChartInstance = null;
    }
    
    // 确保容器有尺寸
    const container = todayActiveChartRef.value;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.warn('今日活跃图表容器尺寸为0，等待容器渲染完成');
      // 等待容器渲染完成
      setTimeout(() => {
        initTodayActiveChart();
      }, 100);
      return;
    }
    
    // 创建完全独立的图表实例，使用新的容器克隆
    const isolatedContainer = container.cloneNode(true);
    isolatedContainer.style.width = container.offsetWidth + 'px';
    isolatedContainer.style.height = container.offsetHeight + 'px';
    
    // 清空原容器并添加独立容器
    container.innerHTML = '';
    container.appendChild(isolatedContainer);
    
    // 创建独立的 ECharts 实例
    isolatedTodayActiveChartInstance = echarts.init(isolatedContainer);
    console.log('独立今日活跃图表实例创建成功:', isolatedTodayActiveChartInstance);
    
    // 渲染图表
    renderTodayActiveChart();
    
  } catch (error) {
    console.error('初始化今日活跃图表失败:', error);
  }
};

// 渲染今日活跃图表
const renderTodayActiveChart = () => {
  if (!isolatedTodayActiveChartInstance) {
    console.warn('独立今日活跃图表实例未初始化');
    return;
  }
  
  if (!sortedTodayActiveTableData.value || !Array.isArray(sortedTodayActiveTableData.value) || sortedTodayActiveTableData.value.length === 0) {
    console.warn('今日活跃数据为空，无法渲染图表');
    // 显示空状态
    const emptyOption = {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: {
          fontSize: 16,
          color: '#999'
        }
      }
    };
    isolatedTodayActiveChartInstance.setOption(emptyOption);
    return;
  }
  
  try {
    // 确保数据格式正确
    const chartData = sortedTodayActiveTableData.value.filter(item => 
      item && item.name
    );
    
    if (chartData.length === 0) {
      console.warn('过滤后没有有效数据');
      const emptyOption = {
        title: {
          text: '暂无有效数据',
          left: 'center',
          top: 'center',
          textStyle: {
            fontSize: 16,
            color: '#999'
          }
        }
      };
      isolatedTodayActiveChartInstance.setOption(emptyOption);
      return;
    }
    
    const option = {
      animation: true,
      animationDurationUpdate: 150,
      animationEasingUpdate: 'quarticOut',
      title: {
        text: '今日活跃数据对比',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          if (!params || params.length === 0) return '';
          let result = `${params[0].name}<br/>`;
          params.forEach(param => {
            if (param && param.seriesName !== undefined && param.value !== undefined) {
              result += `${param.seriesName}: ${param.value}<br/>`;
            }
          });
          return result;
        }
      },
      legend: {
        data: ['今日复查', '今日新增', '未完善', '需提醒', '评分'],
        top: 40,
        left: 'center',
        selectedMode: true,
        selected: legendSelectedTodayActive.value || { '评分': false }
      },
      grid: {
        left: '12%',
        right: 40,
        bottom: '8%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '数量',
        nameTextStyle: {
          fontSize: 12,
          color: '#666'
        },
        axisLabel: {
          fontSize: 12,
          color: '#666'
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#e8e8e8'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: chartData.map(item => item.name || ''),
        axisLabel: {
          fontSize: 14,
          color: '#666',
          interval: 0
        }
      },
      dataZoom: [
        {
          type: 'slider',
          yAxisIndex: 0,
          orient: 'vertical',
          right: 6,
          start: 0,
          end: 40,
          zoomLock: false
        },
        {
          type: 'inside',
          yAxisIndex: 0,
          // 鼠标滚轮只平移，不缩放区间
          zoomOnMouseWheel: false,
          moveOnMouseWheel: true,
          moveOnMouseMove: true,
          zoomLock: true
        }
      ],
      series: [
        {
          name: '今日复查',
          type: 'bar',
          data: chartData.map(item => Number(item.today_review) || 0),
          itemStyle: {
            color: '#d32f2f'
          },
          label: {
            show: true,
            position: 'right',
            fontSize: 10,
            color: '#d32f2f'
          }
        },
        {
          name: '今日新增',
          type: 'bar',
          data: chartData.map(item => Number(item.today_register) || 0),
          itemStyle: {
            color: '#1976d2'
          },
          label: {
            show: true,
            position: 'right',
            fontSize: 10,
            color: '#1976d2'
          }
        },
        {
          name: '未完善',
          type: 'bar',
          data: chartData.map(item => Number(item.today_incomplete) || 0),
          itemStyle: {
            color: '#388e3c'
          },
          label: {
            show: true,
            position: 'right',
            fontSize: 10,
            color: '#388e3c'
          }
        },
        {
          name: '需提醒',
          type: 'bar',
          data: chartData.map(item => Number(item.today_reminder) || 0),
          itemStyle: {
            color: '#f57c00'
          },
          label: {
            show: true,
            position: 'right',
            fontSize: 10,
            color: '#f57c00'
          }
        },
        {
          name: '评分',
          type: 'line',
          data: chartData.map(item => Number(item.score) || 0),
          xAxisIndex: 0,
          yAxisIndex: 0,
          itemStyle: {
            color: '#9c27b0'
          },
          lineStyle: {
            width: 3,
            color: '#9c27b0'
          },
          symbol: 'circle',
          symbolSize: 8,
          label: {
            show: true,
            position: 'right',
            fontSize: 10,
            color: '#9c27b0'
          }
        }
      ]
    };
    
    // 合并更新，保留 dataZoom 与 legend 的交互状态
    isolatedTodayActiveChartInstance.setOption(option, { notMerge: false, lazyUpdate: true });
    
    // 更新图例选择状态（避免重复绑定先移除再绑定）
    try { isolatedTodayActiveChartInstance.off('legendselectchanged'); } catch (e) {}
    isolatedTodayActiveChartInstance.on('legendselectchanged', function(params) {
      legendSelectedTodayActive.value = params?.selected || null;
    });
    
  } catch (error) {
    console.error('渲染今日活跃图表失败:', error);
    // 显示错误状态
    const errorOption = {
      title: {
        text: '图表渲染失败',
        left: 'center',
        top: 'center',
        textStyle: {
          fontSize: 16,
          color: '#ff4d4f'
        }
      }
    };
    isolatedTodayActiveChartInstance.setOption(errorOption);
  }
};

// 监听选项卡变化
const handleStatsTabChange = (activeKey) => {
  if (activeKey === 'chart') {
    // 切换到图表时，等待DOM更新后初始化图表
    nextTick(() => {
      // 确保有数据后再初始化图表
      if (statsTableData.value && statsTableData.value.length > 0) {
        initStatsChart();
      } else {
        console.warn('切换到图表时没有数据');
      }
    });
  } else {
    // 切换到表格时，销毁图表实例以释放内存
    if (isolatedStatsChartInstance) {
      try {
        isolatedStatsChartInstance.dispose();
        isolatedStatsChartInstance = null;
      } catch (error) {
        console.warn('销毁独立统计图表实例时出错:', error);
      }
    }
  }
};

// 监听今日活跃选项卡变化
const handleTodayActiveTabChange = (activeKey) => {
  if (activeKey === 'chart') {
    // 切换到图表时，等待DOM更新后初始化图表
    nextTick(() => {
      // 确保有数据后再初始化图表
      if (todayActiveTableData.value && todayActiveTableData.value.length > 0) {
        initTodayActiveChart();
      } else {
        console.warn('切换到今日活跃图表时没有数据');
      }
    });
  } else {
    // 切换到表格时，销毁图表实例以释放内存
    if (isolatedTodayActiveChartInstance) {
      try {
        isolatedTodayActiveChartInstance.dispose();
        isolatedTodayActiveChartInstance = null;
      } catch (error) {
        console.warn('销毁独立今日活跃图表实例时出错:', error);
      }
    }
  }
};

// 处理统计数据表格变化（排序）
const handleStatsTableChange = (pagination, filters, sorter) => {
  console.log('统计数据表格变化:', { pagination, filters, sorter });
  
  // 更新排序状态
  if (sorter && sorter.field) {
    sortState.value = {
      field: sorter.field,
      order: sorter.order
    };
    console.log('排序状态更新:', sortState.value);
  } else {
    sortState.value = {
      field: null,
      order: null
    };
  }
  
  // 重新应用排序
  if (statsTableData.value.length > 0) {
    const sortedData = applySorting([...statsTableData.value]);
    statsTableData.value = sortedData;
    console.log('排序完成，数据已更新');
  }
};

// 生命周期
onMounted(async () => {
  try {
    console.log('超级工作台页面已加载');
    
    // 初始化旧版 IndexedDB - 已注释，避免新设备上IndexedDB初始化问题
    // try {
    //   await initIndexedDB();
    //   console.log('旧版 IndexedDB 初始化成功');
    // } catch (error) {
    //   console.warn('旧版 IndexedDB 初始化失败，将使用 localStorage 作为备选:', error);
    // }
    
    // 新增：初始化新API IndexedDB
    try {
      await initNewApiIndexedDB();
      console.log('新API IndexedDB 初始化成功');
    } catch (error) {
      console.warn('新API IndexedDB 初始化失败:', error);
    }
    
    // 先尝试从缓存加载统计数据（旧方式） - 已注释，避免IndexedDB相关问题
    // const cachedStats = loadCachedOrganizationStats();
    // if (cachedStats) {
    //   console.log('页面加载时使用缓存的统计数据（旧方式）');
    //   stats.value.totalPatients = cachedStats.totalPatients;
    //   stats.value.totalExaminations = cachedStats.totalExaminations;
    // } else {
    //   console.log('没有旧方式缓存数据，需要请求新数据');
    // }
    
    // 先尝试从缓存加载单日活跃数据（旧方式） - 已注释，避免IndexedDB相关问题
    // const cachedTodayActive = loadCachedTodayActiveData();
    // if (cachedTodayActive) {
    //   console.log('页面加载时使用缓存的单日活跃数据（旧方式）');
    //   stats.value.todayActive = cachedTodayActive.total;
    //   stats.value.todayReview = cachedTodayActive.review || 0;
    //   stats.value.todayRegister = cachedTodayActive.register || 0;
    //   stats.value.todayIncomplete = cachedTodayActive.incomplete || 0;
    //   stats.value.todayReminder = cachedTodayActive.reminder || 0;
    // } else {
    //   console.log('没有旧方式单日活跃缓存数据，需要请求新数据');
    // }
    
    // 先尝试从缓存加载机构树数据
    const orgTreeStr = localStorage.getItem('机构树');
    if (orgTreeStr) {
      try {
        const orgTree = JSON.parse(orgTreeStr);
        organizationTree.value = orgTree;
        // 如果有缓存，使用缓存数据更新总机构数 - 已注释，避免IndexedDB相关问题
        // if (cachedStats) {
        //   stats.value.totalOrganizations = orgTree.length;
        //   console.log('从缓存加载机构树数据完成，总机构数:', orgTree.length);
        // } else {
        //   // 没有缓存，需要请求新数据
        //   // await loadOrganizationTree(); // 暂时注释掉，只用手动更新
        // }
        
        // 直接更新总机构数，不依赖缓存
        stats.value.totalOrganizations = orgTree.length;
        console.log('从缓存加载机构树数据完成，总机构数:', orgTree.length);
      } catch (error) {
        console.error('解析机构树缓存数据失败:', error);
        await loadOrganizationTree();
      }
    } else {
      console.log('没有机构树缓存数据，需要请求新数据');
      // await loadOrganizationTree(); // 暂时注释掉，只用手动更新
    }
    
    // 启动自动更新机制
    // startAutoUpdate();
  } catch (error) {
    console.error('页面加载过程中发生错误:', error);
  }
});

// 组件卸载时清理定时器
onUnmounted(() => {
  // if (autoUpdateTimer) {
  //   clearInterval(autoUpdateTimer);
  //   autoUpdateTimer = null;
  // }
  
  // 取消正在进行的日期请求
  if (currentDateRequestAbortController) {
    currentDateRequestAbortController.abort();
    console.log('组件卸载，取消正在进行的日期数据请求');
  }
  
  // 重置请求跟踪变量
  currentDateRequest = null;
  currentDateRequestAbortController = null;
});

// 新增：初始化新API的IndexedDB
const initNewApiIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NEW_API_DB_NAME, NEW_API_DB_VERSION);
    
    request.onerror = () => {
      console.error('新API IndexedDB 打开失败:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      newApiDB = request.result;
      console.log('新API IndexedDB 连接成功');
      resolve(newApiDB);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(NEW_API_STORE_NAME)) {
        // 使用复合键：日期范围 + 机构ID列表的组合
        const store = db.createObjectStore(NEW_API_STORE_NAME, { keyPath: 'key' });
        store.createIndex('dateRange', 'dateRange', { unique: false });
        store.createIndex('organizationIds', 'organizationIds', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('新API IndexedDB 存储对象创建成功');
      }
    };
  });
};

// 新增：保存新API数据到IndexedDB
const saveNewApiDataToIndexedDB = async (data) => {
  try {
    if (!newApiDB) {
      await initNewApiIndexedDB();
    }
    
    const transaction = newApiDB.transaction([NEW_API_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(NEW_API_STORE_NAME);
    
    // 创建复合键：日期范围 + 机构ID列表的哈希
    const key = `${data.startDate}_${data.endDate}_${data.organizationIds.sort().join('_')}`;
    
    // 确保数据可以被克隆（移除不可克隆的属性）
    const dataToStore = {
      key: key,
      startDate: data.startDate,
      endDate: data.endDate,
      organizationIds: Array.from(data.organizationIds), // 确保是普通数组
      // 保存合并后的数据结构
      registeredPatients: data.registeredPatients ? data.registeredPatients.map(patient => ({
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        gender: patient.gender,
        birthDate: patient.birthDate,
        createDate: patient.createDate,
        creationDate: patient.creationDate,
        organizationid: patient.organizationid,
        gkid: patient.gkid,
        review_date: patient.review_date,
        total_exam_count: patient.total_exam_count,
        average_review_interval: patient.average_review_interval,
        review_interval_days: patient.review_interval_days,
        status: patient.status
      })) : [],
      recheckPatients: data.recheckPatients ? data.recheckPatients.map(patient => ({
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        gender: patient.gender,
        birthDate: patient.birthDate,
        createDate: patient.createDate,
        organizationid: patient.organizationid,
        gkid: patient.gkid,
        latestexamdate: patient.latestexamdate,
        review_date: patient.review_date
      })) : [],
      upcomingPatients: data.upcomingPatients ? data.upcomingPatients.map(patient => ({
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        gender: patient.gender,
        birthDate: patient.birthDate,
        createDate: patient.createDate,
        organizationid: patient.organizationid,
        gkid: patient.gkid,
        review_date: patient.review_date,
        // 根据后端返回的数据格式调整字段
        ...patient
      })) : [],
      examinations: data.examinations ? data.examinations.map(exam => ({
        id: exam.id,
        patient_id: exam.patient_id,
        organizationId: exam.organizationId,
        examination_date: exam.examination_date,
        // 根据后端返回的数据格式调整字段
        ...exam
      })) : [],
      // 兼容旧格式
      patients: data.patients ? data.patients.map(patient => ({
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        gender: patient.gender,
        birthDate: patient.birthDate,
        createDate: patient.createDate,
        creationDate: patient.creationDate,
        organizationid: patient.organizationid,
        gkid: patient.gkid,
        review_date: patient.review_date,
        total_exam_count: patient.total_exam_count,
        average_review_interval: patient.average_review_interval,
        review_interval_days: patient.review_interval_days,
        status: patient.status
      })) : [],
      dateRange: `${data.startDate}_${data.endDate}`,
      timestamp: Date.now()
    };
    
    const result = await store.put(dataToStore);
    console.log('新API数据已保存到 IndexedDB:', key);
    
    return result;
  } catch (error) {
    console.error('保存新API数据到 IndexedDB 失败:', error);
    throw error;
  }
};

// 新增：从IndexedDB获取新API数据
const getNewApiDataFromIndexedDB = async (startDate, endDate, organizationIds) => {
  try {
    if (!newApiDB) {
      await initNewApiIndexedDB();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = newApiDB.transaction([NEW_API_STORE_NAME], 'readonly');
      const store = transaction.objectStore(NEW_API_STORE_NAME);
      
      // 查找匹配的日期范围和机构ID组合
      const key = `${startDate}_${endDate}_${Array.from(organizationIds).sort().join('_')}`;
      const request = store.get(key);
      
      request.onsuccess = () => {
        if (request.result) {
          console.log('从新API IndexedDB 获取到缓存数据:', key);
          resolve(request.result);
        } else {
          console.log('新API IndexedDB 中没有找到缓存数据:', key);
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('从新API IndexedDB 获取数据失败:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('从新API IndexedDB 获取数据失败:', error);
    return null;
  }
};

// 新增：调用新API获取建档患者数据
const fetchRegisteredPatientsByDateRange = async (startDate, endDate, organizationIds) => {
  try {
    console.log('开始调用新API获取建档患者数据...');
    console.log('请求参数:', { startDate, endDate, organizationIds });
    
    const token = localStorage.getItem('csrftoken');
    if (!token) {
      throw new Error('未找到访问令牌，请重新登录');
    }
    
    const response = await fetch('https://aiforoptometry.com/medicalrecords/search_registered_by_date_range/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 使用动态token
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        organization_ids: organizationIds
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('新API响应数据:', data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // 修复：处理新API返回的数据结构
    // 新API返回 {start_date, end_date, days: Array} 而不是 {patients: Array}
    // 需要将 days 数组转换为 patients 数组格式
    let patients = [];
    if (data.days && Array.isArray(data.days)) {
      // 将 days 数组展平为 patients 数组
      patients = data.days.reduce((acc, dayData) => {
        if (dayData.patients && Array.isArray(dayData.patients)) {
          acc.push(...dayData.patients);
        }
        return acc;
      }, []);
    }
    
    console.log('转换后的患者数据:', patients);
    
    return {
      startDate,
      endDate,
      organizationIds: Array.from(organizationIds), // 修复：转换为普通数组
      patients: patients,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('调用新API获取建档患者数据失败:', error);
    throw error;
  }
};

// 新增：调用新API获取复查患者数据
const fetchRecheckPatientsByDateRange = async (startDate, endDate, organizationIds) => {
  try {
    console.log('开始调用新API获取复查患者数据...');
    console.log('请求参数:', { startDate, endDate, organizationIds });
    
    const token = localStorage.getItem('csrftoken');
    if (!token) {
      throw new Error('未找到访问令牌，请重新登录');
    }
    
    const response = await fetch('https://aiforoptometry.com/medicalrecords/search_recheck_by_date_range/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 使用动态token
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        organization_ids: organizationIds
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('复查API响应数据:', data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // 处理复查API返回的数据结构
    // 复查API返回 {start_date, end_date, organization_ids, patients: Array} 格式
    let patients = [];
    if (data.patients && Array.isArray(data.patients)) {
      patients = data.patients;
    }
    
    console.log('转换后的复查患者数据:', patients);
    
    return {
      startDate,
      endDate,
      organizationIds: Array.from(organizationIds),
      patients: patients,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('调用新API获取复查患者数据失败:', error);
    throw error;
  }
};

// 新增：调用新API获取机构检查记录数据
const fetchExaminationsByDateRange = async (startDate, endDate, organizationIds) => {
  try {
    console.log('开始调用新API获取机构检查记录数据...');
    console.log('请求参数:', { startDate, endDate, organizationIds });
    
    const token = localStorage.getItem('csrftoken');
    if (!token) {
      throw new Error('未找到访问令牌，请重新登录');
    }
    
    // 调用检查记录API（统一接口，不需要为每个机构单独调用）
    const response = await fetch('https://aiforoptometry.com/organization/examinations/range/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        organization_ids: Array.from(organizationIds)
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('检查记录API响应数据:', data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // 处理返回的检查记录数据
    // 根据您提供的数据格式，API返回的是 {data: [...]} 格式
    const examinations = data.data || [];
    
    console.log('转换后的检查记录数据:', examinations);
    
    return {
      startDate,
      endDate,
      organizationIds: Array.from(organizationIds),
      examinations: examinations,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('调用新API获取检查记录数据失败:', error);
    throw error;
  }
};

// 新增：调用新API获取即将复查/已逾期未到的患者数据
const fetchUpcomingReminderPatientsByDateRange = async (startDate, endDate, organizationIds) => {
  try {
    console.log('开始调用新API获取即将复查/已逾期未到的患者数据...');
    console.log('请求参数:', { startDate, endDate, organizationIds });
    
    const token = localStorage.getItem('csrftoken');
    if (!token) {
      throw new Error('未找到访问令牌，请重新登录');
    }
    
    const response = await fetch('https://aiforoptometry.com/reminders/upcoming_by_range/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 使用动态token
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        organization_ids: organizationIds
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('即将复查API响应数据:', data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // 处理即将复查API返回的数据结构
    // 新格式：{ days: [{ date: "2025-09-01", organizations: { "2": { need_remind: [], overdue: [], reminded: [] } } }] }
    let patients = [];
    if (data.days && Array.isArray(data.days)) {
      patients = data.days.reduce((acc, day) => {
        // 遍历每个日期的所有机构
        Object.values(day.organizations || {}).forEach(orgData => {
          // 合并三种类型的提醒数据
          if (orgData.need_remind && Array.isArray(orgData.need_remind)) {
            acc.push(...orgData.need_remind.map(patient => ({
              ...patient,
              reminder_type: 'need_remind',
              review_date: day.date
            })));
          }
          if (orgData.overdue && Array.isArray(orgData.overdue)) {
            acc.push(...orgData.overdue.map(patient => ({
              ...patient,
              reminder_type: 'overdue',
              review_date: day.date
            })));
          }
          if (orgData.reminded && Array.isArray(orgData.reminded)) {
            acc.push(...orgData.reminded.map(patient => ({
              ...patient,
              reminder_type: 'reminded',
              review_date: day.date
            })));
          }
        });
        return acc;
      }, []);
    } else if (data.patients && Array.isArray(data.patients)) {
      // 兼容旧格式
      patients = data.patients;
    }
    
    console.log('转换后的即将复查患者数据:', patients);
    
    return {
      startDate,
      endDate,
      organizationIds: Array.from(organizationIds),
      patients: patients,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('调用新API获取即将复查/已逾期未到的患者数据失败:', error);
    throw error;
  }
};

// 新增：处理新API数据并更新UI
const processNewApiData = (data) => {
  try {
    console.log('开始处理新API数据:', data);
    
    // 按日期分组患者数据
    const patientsByDate = {};
    
    // 处理建档患者数据
    if (data.registeredPatients && Array.isArray(data.registeredPatients)) {
      data.registeredPatients.forEach(patient => {
        const createDate = patient.createDate;
        if (!patientsByDate[createDate]) {
          patientsByDate[createDate] = { 
            registered: [], 
            recheck: [], 
            upcoming: [],
            need_remind: [],
            overdue: [],
            reminded: [],
            examinations: []
          };
        }
        patientsByDate[createDate].registered.push(patient);
      });
    }
    
    // 处理复查患者数据
    if (data.recheckPatients && Array.isArray(data.recheckPatients)) {
      data.recheckPatients.forEach(patient => {
        // 复查患者按 latestexamdate 分组，而不是 createDate
        const examDate = patient.latestexamdate;
        if (!patientsByDate[examDate]) {
          patientsByDate[examDate] = { 
            registered: [], 
            recheck: [], 
            upcoming: [],
            need_remind: [],
            overdue: [],
            reminded: [],
            examinations: []
          };
        }
        patientsByDate[examDate].recheck.push(patient);
      });
    }
    
    // 处理即将复查患者数据
    if (data.upcomingPatients && Array.isArray(data.upcomingPatients)) {
      data.upcomingPatients.forEach(patient => {
        // 即将复查患者按 review_date 分组
        const reviewDate = patient.review_date;
        if (reviewDate) {
          if (!patientsByDate[reviewDate]) {
            patientsByDate[reviewDate] = { 
              registered: [], 
              recheck: [], 
              upcoming: [],
              need_remind: [],
              overdue: [],
              reminded: []
            };
          }
          // 根据提醒类型分别存储
          if (patient.reminder_type === 'need_remind') {
            patientsByDate[reviewDate].need_remind.push(patient);
          } else if (patient.reminder_type === 'overdue') {
            patientsByDate[reviewDate].overdue.push(patient);
          } else if (patient.reminder_type === 'reminded') {
            patientsByDate[reviewDate].reminded.push(patient);
          }
          // 同时保持原有的 upcoming 数组用于兼容性
          patientsByDate[reviewDate].upcoming.push(patient);
        }
      });
    }
    
    // 处理检查记录数据
    if (data.examinations && Array.isArray(data.examinations)) {
      data.examinations.forEach(exam => {
        // 检查记录按 examination.examination_date 分组
        const examDate = exam.examination?.examination_date;
        if (examDate) {
          if (!patientsByDate[examDate]) {
            patientsByDate[examDate] = { 
              registered: [], 
              recheck: [], 
              upcoming: [],
              need_remind: [],
              overdue: [],
              reminded: [],
              examinations: []
            };
          }
          // 确保 examinations 数组存在
          if (!patientsByDate[examDate].examinations) {
            patientsByDate[examDate].examinations = [];
          }
          patientsByDate[examDate].examinations.push(exam);
        }
      });
    }
    
    // 兼容旧格式：如果数据中只有 patients 字段（旧缓存数据）
    if (data.patients && Array.isArray(data.patients)) {
      data.patients.forEach(patient => {
        const createDate = patient.createDate;
        if (!patientsByDate[createDate]) {
          patientsByDate[createDate] = { 
            registered: [], 
            recheck: [], 
            upcoming: [],
            need_remind: [],
            overdue: [],
            reminded: [],
            examinations: []
          };
        }
        patientsByDate[createDate].registered.push(patient);
      });
    }
    
    // 生成日期范围内的所有日期
    const dateRange = generateDateRange(data.startDate, data.endDate);
    
    // 构建活跃统计数据（新增患者 + 复查患者 + 即将复查患者）
    const newActiveStatsData = dateRange.map(date => {
      const dayData = patientsByDate[date] || { 
        registered: [], 
        recheck: [], 
        upcoming: [],
        need_remind: [],
        overdue: [],
        reminded: [],
        examinations: []
      };
      
      // 调试信息 - 已注释，减少控制台输出
      // console.log(`处理日期 ${date} 的数据:`, dayData);
      
      const registerCount = dayData.registered && Array.isArray(dayData.registered) ? dayData.registered.length : 0;
      const reviewCount = dayData.recheck && Array.isArray(dayData.recheck) ? dayData.recheck.length : 0;
      
      // 即将复查数据按三种类型分别统计
      const needRemindCount = dayData.need_remind && Array.isArray(dayData.need_remind) ? dayData.need_remind.length : 0;
      const overdueCount = dayData.overdue && Array.isArray(dayData.overdue) ? dayData.overdue.length : 0;
      const remindedCount = dayData.reminded && Array.isArray(dayData.reminded) ? dayData.reminded.length : 0;
      const upcomingCount = needRemindCount + overdueCount + remindedCount;
      
      // 按机构分组统计数据
      const orgDetails = {};
      
      // 统计建档患者（按机构）
      if (dayData.registered && Array.isArray(dayData.registered)) {
        dayData.registered.forEach(patient => {
          const orgId = patient.organizationid;
          if (!orgDetails[orgId]) {
            orgDetails[orgId] = {
              name: '', // 将在后面填充
              today_review: 0,
              today_register: 0,
              today_incomplete: 0,
              today_reminder: 0,
              total: 0
            };
          }
          orgDetails[orgId].today_register++;
        });
      }
      
      // 统计复查患者（按机构）
      if (dayData.recheck && Array.isArray(dayData.recheck)) {
        dayData.recheck.forEach(patient => {
          const orgId = patient.organizationid;
          if (!orgDetails[orgId]) {
            orgDetails[orgId] = {
              name: '',
              today_review: 0,
              today_register: 0,
              today_incomplete: 0,
              today_reminder: 0,
              total: 0
            };
          }
          orgDetails[orgId].today_review++;
        });
      }
      
      // 统计即将复查患者（按机构）
      if (dayData.upcoming && Array.isArray(dayData.upcoming)) {
        dayData.upcoming.forEach(patient => {
          const orgId = patient.organizationid;
          if (!orgDetails[orgId]) {
            orgDetails[orgId] = {
              name: '',
              today_review: 0,
              today_register: 0,
              today_incomplete: 0,
              today_reminder: 0,
              total: 0
            };
          }
          orgDetails[orgId].today_reminder++;
        });
      }
      
      // 填充机构名称并计算每个机构的总计
      Object.keys(orgDetails).forEach(orgId => {
        const org = organizationTree.value.find(o => o.id === parseInt(orgId));
        if (org) {
          orgDetails[orgId].name = org.name;
        }
        orgDetails[orgId].total = 
          orgDetails[orgId].today_review + 
          orgDetails[orgId].today_register + 
          orgDetails[orgId].today_reminder;
      });
      
      return {
        queryDate: date,
        review: reviewCount, // 复查数据
        register: registerCount, // 新增数据
        upcoming: upcomingCount, // 即将复查数据总计
        // 新增：分别统计三种提醒类型
        need_remind: needRemindCount, // 待提醒
        overdue: overdueCount, // 已逾期
        reminded: remindedCount, // 已提醒
        total: registerCount + reviewCount + upcomingCount, // 总计
        orgDetails: orgDetails,
        timestamp: Date.now()
      };
    });
    
    // 构建工作统计数据（基于患者复查间隔计算）
    const newWorkStatsData = dateRange.map(date => {
      const dayData = patientsByDate[date] || { 
        registered: [], 
        recheck: [], 
        upcoming: [],
        need_remind: [],
        overdue: [],
        reminded: [],
        examinations: []
      };
      let incompleteCount = 0;
      let totalExaminationsCount = 0;
      let reminderCount = 0;
      
      // 使用新的提醒数据统计
      const needRemindCount = dayData.need_remind ? dayData.need_remind.length : 0;
      const overdueCount = dayData.overdue ? dayData.overdue.length : 0;
      const remindedCount = dayData.reminded ? dayData.reminded.length : 0;
      
      // 需提醒 = 待提醒 + 已逾期
      reminderCount = needRemindCount + overdueCount;
      
      // 按机构分组统计工作数据
      const orgDetails = {};
      
      // 计算检查记录数据（按机构）
      if (dayData.examinations && Array.isArray(dayData.examinations)) {
        // 新API数据结构：每个exam包含examination字段
        totalExaminationsCount = dayData.examinations.length;
        
        dayData.examinations.forEach(exam => {
          const orgId = exam.organizationId;
          if (!orgDetails[orgId]) {
            orgDetails[orgId] = {
              name: '',
              incomplete: 0,
              total_examinations: 0,
              reminder: 0,
              total: 0
            };
          }
          
          orgDetails[orgId].total_examinations++;
          
          const isComplete = checkExaminationComplete(exam);
          if (!isComplete) {
            orgDetails[orgId].incomplete++;
          }
        });
        
        incompleteCount = dayData.examinations.filter(exam => {
          const isComplete = checkExaminationComplete(exam);
          return !isComplete;
        }).length;
      } else {
        // 如果没有检查记录数据，使用已提醒数量作为未完善数量
        incompleteCount = remindedCount;
        totalExaminationsCount = remindedCount;
      }
      
      // 统计需提醒数据（按机构）
      if (dayData.need_remind && Array.isArray(dayData.need_remind)) {
        dayData.need_remind.forEach(patient => {
          const orgId = patient.organizationid;
          if (!orgDetails[orgId]) {
            orgDetails[orgId] = {
              name: '',
              incomplete: 0,
              total_examinations: 0,
              reminder: 0,
              total: 0
            };
          }
          orgDetails[orgId].reminder++;
        });
      }
      
      if (dayData.overdue && Array.isArray(dayData.overdue)) {
        dayData.overdue.forEach(patient => {
          const orgId = patient.organizationid;
          if (!orgDetails[orgId]) {
            orgDetails[orgId] = {
              name: '',
              incomplete: 0,
              total_examinations: 0,
              reminder: 0,
              total: 0
            };
          }
          orgDetails[orgId].reminder++;
        });
      }
      
      // 填充机构名称并计算每个机构的总计
      Object.keys(orgDetails).forEach(orgId => {
        const org = organizationTree.value.find(o => o.id === parseInt(orgId));
        if (org) {
          orgDetails[orgId].name = org.name;
        }
        orgDetails[orgId].total = 
          orgDetails[orgId].incomplete + 
          orgDetails[orgId].reminder;
      });
      
      return {
        queryDate: date,
        incomplete: incompleteCount,
        total_examinations: totalExaminationsCount, // 新增：全部检查记录数量
        reminder: reminderCount,
        total: incompleteCount + reminderCount,
        // 新增：分别统计三种提醒类型
        need_remind: needRemindCount,
        overdue: overdueCount,
        reminded: remindedCount,
        orgDetails: orgDetails,
        timestamp: Date.now()
      };
    });
    
    // 更新UI数据
    activeStatsData.value = newActiveStatsData;
    workStatsData.value = newWorkStatsData;
    
    // 更新总计
    updateTotalActiveStats(newActiveStatsData);
    updateTotalWorkStats(newWorkStatsData);
    
    // 更新statsData
    updateStatsData();
    
    // 计算患者总数
    const totalPatients = (data.registeredPatients?.length || 0) + 
                         (data.recheckPatients?.length || 0) + 
                         (data.upcomingPatients?.length || 0);
    
    // console.log('新API数据处理完成:', { // 已注释，减少控制台输出
    //   活跃统计: newActiveStatsData.length,
    //   工作统计: newWorkStatsData.length,
    //   患者总数: totalPatients,
    //   建档患者: data.registeredPatients?.length || 0,
    //   复查患者: data.recheckPatients?.length || 0,
    //   即将复查患者: data.upcomingPatients?.length || 0,
    //   检查记录: data.examinations?.length || 0
    // });
    
    // 新增：同时保存到旧IndexedDB以保持兼容性
    saveToOldIndexedDB(data, newActiveStatsData, newWorkStatsData);
    
  } catch (error) {
    console.error('处理新API数据失败:', error);
    throw error;
  }
};

// 新增：保存到旧IndexedDB以保持兼容性
const saveToOldIndexedDB = async (newApiData, activeStatsData, workStatsData) => {
  try {
    // console.log('开始保存到旧IndexedDB以保持兼容性...'); // 已注释，减少控制台输出
    
    // 为每个日期创建单独的记录，与旧格式兼容
    const dateRange = generateDateRange(newApiData.startDate, newApiData.endDate);
    
    for (const date of dateRange) {
      // 获取当天的建档、复查和即将复查患者数据
      const dayRegisteredPatients = newApiData.registeredPatients ? 
        newApiData.registeredPatients.filter(patient => patient.createDate === date) : [];
      const dayRecheckPatients = newApiData.recheckPatients ? 
        newApiData.recheckPatients.filter(patient => patient.latestexamdate === date) : [];
      const dayUpcomingPatients = newApiData.upcomingPatients ? 
        newApiData.upcomingPatients.filter(patient => patient.review_date === date) : [];
      
      // 兼容旧格式
      const dayPatients = newApiData.patients ? 
        newApiData.patients.filter(patient => patient.createDate === date) : [];
      
      const registerCount = dayRegisteredPatients.length + dayPatients.length;
      const reviewCount = dayRecheckPatients.length;
      const upcomingCount = dayUpcomingPatients.length;
      
      // 计算工作统计数据
      let incompleteCount = 0;
      let reminderCount = 0;
      
      // 使用检查记录数据计算未完善数量
      const dayExaminations = newApiData.examinations ? 
        newApiData.examinations.filter(exam => exam.examination?.examination_date === date) : [];
      
      if (dayExaminations.length > 0) {
        // 使用检查记录数据计算未完善数量
        // console.log(`日期 ${date} 的检查记录数量（旧IndexedDB）:`, dayExaminations.length); // 已注释，减少控制台输出
        incompleteCount = dayExaminations.filter(exam => {
          const isComplete = checkExaminationComplete(exam);
          // console.log(`检查记录 ${exam.examination_id} 是否完整（旧IndexedDB）:`, isComplete); // 已注释，减少控制台输出
          return !isComplete;
        }).length;
        // console.log(`日期 ${date} 的未完善数量（旧IndexedDB）:`, incompleteCount); // 已注释，减少控制台输出
      } else {
        // 如果没有检查记录数据，使用旧逻辑
        // 处理建档患者的工作统计
        [...dayRegisteredPatients, ...dayPatients].forEach(patient => {
          if (patient.review_date) {
            const reviewDate = new Date(patient.review_date);
            const createDate = new Date(patient.createDate);
            const daysDiff = Math.ceil((reviewDate - createDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 90) {
              reminderCount++;
            }
          } else {
            incompleteCount++;
          }
        });
        
        // 处理复查患者的工作统计
        dayRecheckPatients.forEach(patient => {
          if (patient.review_date) {
            const reviewDate = new Date(patient.review_date);
            const createDate = new Date(patient.createDate);
            const daysDiff = Math.ceil((reviewDate - createDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 90) {
              reminderCount++;
            }
          } else {
            incompleteCount++;
          }
        });
        
        // 处理即将复查患者的工作统计
        dayUpcomingPatients.forEach(patient => {
          if (patient.review_date) {
            const reviewDate = new Date(patient.review_date);
            const createDate = new Date(patient.createDate);
            const daysDiff = Math.ceil((reviewDate - createDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 90) {
              reminderCount++;
            }
          } else {
            incompleteCount++;
          }
        });
      }
      
      // 使用新的提醒数据统计需提醒数量
      const dayNeedRemind = newApiData.upcomingPatients ? 
        newApiData.upcomingPatients.filter(patient => patient.review_date === date && patient.reminder_type === 'need_remind') : [];
      const dayOverdue = newApiData.upcomingPatients ? 
        newApiData.upcomingPatients.filter(patient => patient.review_date === date && patient.reminder_type === 'overdue') : [];
      
      reminderCount = dayNeedRemind.length + dayOverdue.length;
      
      // 构建与旧格式兼容的数据结构
      const oldFormatData = {
        queryDate: date,
        total: registerCount + reviewCount + upcomingCount, // 总活跃数 = 新增数 + 复查数 + 即将复查数
        review: reviewCount, // 复查数据
        register: registerCount, // 新增数据
        upcoming: upcomingCount, // 即将复查数据
        incomplete: incompleteCount,
        reminder: reminderCount,
        orgDetails: {},
        timestamp: Date.now()
      };
      
      // 保存到旧IndexedDB
      await saveTodayActiveDataToIndexedDB(oldFormatData);
      // console.log(`日期 ${date} 的数据已保存到旧IndexedDB`); // 已注释，减少控制台输出
    }
    
    // console.log('所有数据已保存到旧IndexedDB，兼容性保持完成'); // 已注释，减少控制台输出
    
  } catch (error) {
    console.error('保存到旧IndexedDB失败:', error);
    // 不抛出错误，因为这只是为了兼容性
  }
};
</script>

<style scoped>
.super-dashboard {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.header-left {
  text-align: center;
}

.header-right {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
}

.active-date-picker {
  min-width: 140px;
}

.dashboard-header h1 {
  font-size: 32px;
  color: #1890ff;
  margin-bottom: 8px;
}

.dashboard-header p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.manual-update-btn {
  background: linear-gradient(-90deg, #E27244 0%, #E29D44 100%);
  border: none;
  border-radius: 8px;
  font-weight: 500;
  height: 40px;
  padding: 0 20px;
}

.manual-update-btn:hover {
  background: linear-gradient(-90deg, #d1653a 0%, #d18f3a 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(226, 114, 68, 0.3);
}

.dashboard-content {
  width: 100%;
  max-width: none;
  margin: 0 auto;
}

.stats-cards {
  display: grid;
  grid-template-columns: 187.5px 187.5px 187.5px 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  cursor: pointer;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.quick-actions {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.quick-actions h2 {
  margin-bottom: 24px;
  color: #333;
  font-size: 20px;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.organization-tree {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.organization-tree h2 {
  margin-bottom: 24px;
  color: #333;
  font-size: 20px;
}

.tree-content {
  min-height: 200px;
}

.tree-data {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
}

.tree-data pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #333;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.recent-activities {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recent-activities h2 {
  margin-bottom: 24px;
  color: #333;
  font-size: 20px;
}

.activity-list {
  min-height: 200px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-time {
  font-size: 12px;
  color: #999;
  width: 120px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  color: #666;
}

@media (max-width: 768px) {
  .super-dashboard {
    padding: 16px;
  }
  
  .stats-cards {
    grid-template-columns: 140px 140px 140px 1fr;
    gap: 16px;
  }
  
     .action-buttons {
     grid-template-columns: 1fr;
   }
 }

/* 机构列表弹窗样式 */
.organization-modal-content {
  max-height: 500px;
  overflow-y: auto;
}

.org-id {
  font-weight: bold;
  color: #1890ff;
}

.org-name {
  font-weight: 500;
  color: #333;
}

.org-contact {
  color: #666;
}

.org-username {
  color: #666;
  font-family: monospace;
}

/* 机构统计数据弹窗样式 */
.stats-modal-content {
  height: 100%;
  overflow: hidden;
}

.chart-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-chart {
  width: 100%;
  height: calc(80vh - 120px);
}

.today-active-chart-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.today-active-chart {
  width: 100%;
  height: calc(80vh - 120px);
}

.chart-toolbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 8px;
}

.toolbar-label {
  font-size: 12px;
  color: #666;
}

.today-active-modal-content {
  height: 100%;
  overflow: hidden;
}

.stats-number {
  font-weight: bold;
  color: #1890ff;
  text-align: center;
}

.today-review-number {
  font-weight: bold;
  color: #d32f2f;
  text-align: center;
}

.today-register-number {
  font-weight: bold;
  color: #1976d2;
  text-align: center;
}

.today-incomplete-number {
  font-weight: bold;
  color: #388e3c;
  text-align: center;
}

.today-reminder-number {
  font-weight: bold;
  color: #f57c00;
  text-align: center;
}

.score-number {
  font-weight: bold;
  text-align: center;
  padding: 4px 8px;
  border-radius: 4px;
  min-width: 40px;
  display: inline-block;
}

.score-excellent {
  color: #52c41a;
  background-color: rgba(82, 196, 26, 0.1);
}

.score-good {
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
}

.score-average {
  color: #faad14;
  background-color: rgba(250, 173, 20, 0.1);
}

.score-poor {
  color: #fa8c16;
  background-color: rgba(250, 140, 22, 0.1);
}

.score-very-poor {
  color: #f5222d;
  background-color: rgba(245, 34, 45, 0.1);
}

.today-total-number {
  font-weight: bold;
  color: #1890ff;
  text-align: center;
}

/* 今日活跃统计样式 */
.today-active-header {
  margin-bottom: 16px;
  text-align: center;
}

.active-date-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.today-active-numbers {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
}

.active-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.active-number {
  font-size: 36px;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
  border-radius: 4px;
  padding: 4px 8px;
}

.active-number.red {
  color: #d32f2f;
  background-color: rgba(211, 47, 47, 0.1);
}

.active-number.blue {
  color: #1976d2;
  background-color: rgba(25, 118, 210, 0.1);
}

.active-number.green {
  color: #388e3c;
  background-color: rgba(56, 142, 60, 0.1);
}

.active-number.yellow {
  color: #f57c00;
  background-color: rgba(245, 124, 0, 0.1);
}

.active-label {
  font-size: 12px;
  color: #666;
  font-weight: normal;
}

/* 排序状态指示器 */
.sort-indicator {
  display: inline-block;
  margin-left: 8px;
  font-size: 12px;
  color: #1890ff;
  background: #f0f8ff;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #d6e4ff;
}

.sort-priority {
  display: inline-block;
  margin-left: 4px;
  font-weight: bold;
  color: #1890ff;
}

/* 排序状态栏样式 */
.sort-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 16px;
}

.sort-status-text {
  font-size: 14px;
  color: #666;
}

.sort-condition {
  color: #1890ff;
  font-weight: bold;
  margin: 0 2px;
}

.sort-separator {
  color: #999;
  margin: 0 4px;
}

.clear-sort-btn {
  color: #ff4d4f;
  padding: 0;
  height: auto;
}

.clear-sort-btn:hover {
  color: #ff7875;
}

/* 图表展示弹窗样式 */
.chart-modal-content {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.chart-modal-content .ant-modal-body {
  padding: 0;
}

/* 图表图例样式增强 */
.chart-modal-content .echarts-legend-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.chart-modal-content .echarts-legend-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 为所有图表容器添加图例样式 */
.stats-chart .echarts-legend-item,
.today-active-chart .echarts-legend-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.stats-chart .echarts-legend-item:hover,
.today-active-chart .echarts-legend-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 数据统计弹窗样式 */
.data-stats-modal-content {
  padding: 16px;
}

.selection-container {
  margin-top: 24px;
}

.stats-section {
  margin-bottom: 32px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.stats-section h5 {
  margin-bottom: 16px;
  color: #262626;
  font-size: 16px;
  font-weight: 600;
}

.stats-section h6 {
  margin-bottom: 12px;
  color: #595959;
  font-size: 14px;
  font-weight: 500;
}

.tab-content h3 {
  color: #1890ff;
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 600;
}

.tab-content p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

/* 活跃统计样式 */
.date-range-selector {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.organization-selector {
  margin: 20px 0;
  padding: 16px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.organization-selector .ant-select {
  width: 100%;
}

.organization-selector .ant-select-selection-item {
  white-space: normal;
  word-break: break-all;
  line-height: 1.4;
}

.organization-selector .ant-select-selection-overflow {
  flex-wrap: wrap;
  gap: 4px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.selector-header label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.selector-actions {
  display: flex;
  gap: 8px;
}

.selection-info {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.selected-names {
  color: #1890ff;
  font-weight: 500;
}

.date-inputs {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.date-input-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-input-item label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.stats-results {
  margin-top: 24px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.results-header h4 {
  color: #1890ff;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

/* 标题行导出按钮样式 */
.header-export-buttons {
  display: flex;
  gap: 8px;
}

.header-export-btn {
  background: linear-gradient(-90deg, #52c41a 0%, #73d13d 100%);
  border: none;
  border-radius: 4px;
  font-weight: 500;
  font-size: 12px;
  height: 28px;
  padding: 0 12px;
}

.header-export-btn:hover {
  background: linear-gradient(-90deg, #389e0d 0%, #52c41a 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
}

.header-export-btn:disabled {
  background: #d9d9d9 !important;
  color: #999 !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.results-header .ant-btn {
  background: linear-gradient(-90deg, #52c41a 0%, #73d13d 100%);
  border: none;
  border-radius: 6px;
  font-weight: 500;
  height: 36px;
  padding: 0 16px;
}

.results-header .ant-btn:hover {
  background: linear-gradient(-90deg, #389e0d 0%, #52c41a 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.stats-results h4 {
  color: #1890ff;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  background: #f0f8ff;
  border-radius: 8px;
  border: 1px solid #d6e4ff;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.summary-item .label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.summary-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
}

.daily-stats {
  margin-top: 24px;
}

.daily-stats h5 {
  color: #333;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.day-item {
  padding: 16px;
  margin-bottom: 12px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.day-date {
  font-weight: 600;
  color: #1890ff;
  font-size: 16px;
}

.day-total {
  font-weight: 600;
  color: #52c41a;
  font-size: 16px;
}

.day-details {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.detail-item {
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

.no-date-selected,
.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

/* 统计标签卡样式 */
.stats-tabs {
  margin-top: 16px;
}

.stats-tabs .ant-tabs-tab {
  font-size: 16px;
  font-weight: 500;
  padding: 12px 24px;
}

.stats-tabs .ant-tabs-tab-active {
  color: #1890ff;
  font-weight: 600;
}

.stats-tabs .ant-tabs-content {
  padding: 20px 0;
}

/* 导出按钮样式 */
.export-section {
  margin-top: 24px;
  padding: 20px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
  text-align: center;
}

.export-section .ant-btn {
  background: linear-gradient(-90deg, #52c41a 0%, #73d13d 100%);
  border: none;
  border-radius: 6px;
  font-weight: 500;
  height: 40px;
  padding: 0 24px;
  font-size: 16px;
}

.export-section .ant-btn:hover {
  background: linear-gradient(-90deg, #389e0d 0%, #52c41a 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.export-section .ant-btn:disabled {
  background: #d9d9d9 !important;
  color: #999 !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
