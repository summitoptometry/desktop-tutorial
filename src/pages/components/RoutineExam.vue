<template>
  <div class="routine-exam">
   <Teleport defer to="#btn-group">
     <div style="text-align: right; margin-bottom: 16px;display: flex;justify-content: right">
       <a-button class="header-btn" v-if="!isEditMode" type="primary" @click="startEdit">编辑</a-button>
       <a-button class="header-btn" v-if="isEditMode" type="primary" @click="handleSave" style="margin-right: 8px;">保存</a-button>
       <a-button class="header-btn" v-if="isEditMode" type="primary" @click="handleCancel">取消</a-button>
     </div>
   </Teleport>
    <div class="exam-content">
      <div v-if="!record">暂无检查数据</div>
      <div v-else>
        <a-table class="exam-table" :columns="columns" :data-source="tableData" :pagination="false" :bordered="true">
          <template #bodyCell="{ column, record: row }">
            <template v-if="column.dataIndex === 'date'">
              <template v-if="isEditMode">
                <a-date-picker v-model:value="form.examination_date" style="width: 120px" />
              </template>
              <template v-else>
                {{ formatDate(form.examination_date) }}
              </template>
            </template>
            <template v-else-if="column.dataIndex === 'eye'">
              {{ row[column.dataIndex] || '-' }}
            </template>
            <template v-else-if="isEditMode && fieldMap[row.key] && fieldMap[row.key][column.dataIndex]">
              <a-input-number v-if="['axial_length','k1','k2','axial_ratio','critical_point','cct','acd','lens_thickness','vitreous_length','choroid_thickness','iop','uva','vaec'].includes(column.dataIndex)"
                v-model:value="form[fieldMap[row.key][column.dataIndex]]"
                style="width: 80px" />
              <a-input v-else v-model:value="form[fieldMap[row.key][column.dataIndex]]" style="width: 80px" />
            </template>
            <template v-else>
              {{ row[column.dataIndex] || '-' }}
            </template>
          </template>
        </a-table>

        <!-- 添加图表容器和切换选项 -->
        <div class="chart-container">
          <div class="chart-title">
            <ImgIcon class="qushi-icon" title="趋势"/>
            <h3>{{getChartTitle()}}</h3>
          </div>
          <div class="chart-options">
            <a-button 
              v-for="tab in chartOptions" 
              :key="tab.key" 
              :type="selectedChartType === tab.key ? 'primary' : 'default'"
              class="chart-option-btn"
              @click="selectedChartType = tab.key"
            >
              {{tab.title}}
            </a-button>
          </div>
          <!-- 眼轴图表显示身高体重开关 -->
          <div v-if="selectedChartType === 'axial'" class="height-weight-switch">
            <a-checkbox v-model:checked="showHeightWeightInAxial">
              同时显示身高体重数据
            </a-checkbox>
            <div v-if="selectedBaseDate" class="base-date-info">
              <span class="base-date-text">基准日期: {{ selectedBaseDate }}</span>
              <a-button type="link" size="small" @click="clearBaseDate" style="color: #ff4d4f; padding: 0 8px;">
                清除
              </a-button>
            </div>
          </div>
          <!-- 添加日期范围筛选器 -->
          <div class="date-filter-container">
            <div class="date-filter-label">数据时间范围：</div>
            <div class="date-filter-inputs">
              <div class="date-range-item">
                <span class="date-range-label">开始：</span>
                <a-select 
                  v-model:value="startYear" 
                  placeholder="年"
                  style="width: 80px; margin-right: 8px;"
                  @change="handleDateFilterChange"
                >
                  <a-select-option v-for="year in yearOptions" :key="year" :value="year">
                    {{ year }}年
                  </a-select-option>
                </a-select>
                <a-select 
                  v-model:value="startMonth" 
                  placeholder="月"
                  style="width: 80px; margin-right: 16px;"
                  @change="handleDateFilterChange"
                >
                  <a-select-option v-for="month in monthOptions" :key="month.value" :value="month.value">
                    {{ month.label }}
                  </a-select-option>
                </a-select>
              </div>
              <div class="date-range-item">
                <span class="date-range-label">结束：</span>
                <a-select 
                  v-model:value="endYear" 
                  placeholder="年"
                  style="width: 80px; margin-right: 8px;"
                  @change="handleDateFilterChange"
                >
                  <a-select-option v-for="year in yearOptions" :key="year" :value="year">
                    {{ year }}年
                  </a-select-option>
                </a-select>
                <a-select 
                  v-model:value="endMonth" 
                  placeholder="月"
                  style="width: 80px; margin-right: 16px;"
                  @change="handleDateFilterChange"
                >
                  <a-select-option v-for="month in monthOptions" :key="month.value" :value="month.value">
                    {{ month.label }}
                  </a-select-option>
                </a-select>
              </div>
              <a-button 
                type="link" 
                @click="resetDateFilter"
                style="color: #1890ff;"
              >
                重置
              </a-button>
            </div>
          </div>
          <div v-if="noValidData" class="no-data-tip">
            <div class="no-data-img">
              <svg width="80" height="80" viewBox="0 0 1024 1024" fill="none">
                <circle cx="512" cy="512" r="400" fill="#f5f5f5"/>
                <ellipse cx="512" cy="700" rx="180" ry="40" fill="#e6f7ff"/>
                <ellipse cx="420" cy="480" rx="30" ry="20" fill="#bfbfbf"/>
                <ellipse cx="604" cy="480" rx="30" ry="20" fill="#bfbfbf"/>
                <rect x="440" y="600" width="140" height="20" rx="10" fill="#bfbfbf"/>
                <path d="M 420 600 Q 512 650 604 600" stroke="#bfbfbf" stroke-width="8" fill="none"/>
              </svg>
            </div>
            <div class="no-data-title">暂无有效数据</div>
            <div class="no-data-desc">一次有效数据都没有哦，请完善数据</div>
          </div>
          <div v-else ref="chartRef" class="chart"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { initChart, axialLengthOption } from '@/utils/echarts';
import { message, Checkbox } from 'ant-design-vue';
import dayjs from 'dayjs';
import ImgIcon from "@/pages/components/ImgIcon.vue";

const emit = defineEmits(['refresh']);
const isEditMode = ref(false);
const originalRecord = ref({});
const props = defineProps({
  record: {
    type: Object,
    default: () => ({})
  },
  previousRecord: {
    type: Object,
    default: () => ({})
  },
  examinationRecords: {
    type: Array,
    default: () => []
  }
});
const form = ref({ ...props.record });

watch(() => props.record, (newVal) => {
  if (!isEditMode.value) {
    form.value = { ...newVal };
  }
}, { immediate: true, deep: true });

function startEdit() {
  form.value = JSON.parse(JSON.stringify(props.record));
  originalRecord.value = JSON.parse(JSON.stringify(form.value));
  // 日期转dayjs对象
  if (form.value.examination_date && typeof form.value.examination_date === 'string') {
    form.value.examination_date = dayjs(form.value.examination_date);
  }
  isEditMode.value = true;
}
function handleCancel() {
  form.value = JSON.parse(JSON.stringify(originalRecord.value));
  isEditMode.value = false;
}
function handleSave() {
  // 兼容 patient_id 和 patient_id_id
  const patientId = form.value.patient_id || form.value.patient_id_id;
  if (!patientId) {
    message.error('缺少患者ID，无法保存');
    return;
  }
  // 构造payload，提交所有表单字段
  const updatedRecord = {
    ...form.value,
    id: form.value.id,
    patient_id: patientId,
    examination_date: form.value.examination_date ? dayjs(form.value.examination_date).format('YYYY-MM-DD') : null,
  };
  const csrftoken = localStorage.getItem('csrftoken');
  fetch('https://aiforoptometry.com/medicalrecords/recordsedit', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken
    },
    body: JSON.stringify(updatedRecord)
  })
    .then(response => response.json())
    .then(data => {
      if (data.status_code === 200) {
        message.success('保存成功');
        isEditMode.value = false;
        originalRecord.value = JSON.parse(JSON.stringify(form.value));
        // 同步 sessionStorage
        try {
          const storageKey = `patient_${patientId}`;
          const savedData = sessionStorage.getItem(storageKey);
          if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed.currentData && parsed.currentData.id === updatedRecord.id) {
              parsed.currentData = { ...parsed.currentData, ...updatedRecord };
            }
            if (parsed.allData && Array.isArray(parsed.allData)) {
              const idx = parsed.allData.findIndex(item => item.id === updatedRecord.id);
              if (idx !== -1) {
                parsed.allData[idx] = { ...parsed.allData[idx], ...updatedRecord };
              }
            }
            if (parsed.examinationRecords && Array.isArray(parsed.examinationRecords)) {
              const idx = parsed.examinationRecords.findIndex(item => item.id === updatedRecord.id);
              if (idx !== -1) {
                parsed.examinationRecords[idx] = { ...parsed.examinationRecords[idx], ...updatedRecord };
              }
            }
            sessionStorage.setItem(storageKey, JSON.stringify(parsed));
          }
        } catch (e) {
          console.error('同步 sessionStorage 失败:', e);
        }
        emit('refresh');
      } else {
        message.error('保存失败: ' + (data.msg || '未知错误'));
      }
    })
    .catch(error => {
      console.error('更新失败:', error);
      message.error('保存失败: ' + error.message);
    });
}
// 日期格式化函数
function formatDate(val) {
  if (!val) return '-';
  return dayjs(val).format('YYYY-MM-DD');
}

// 添加视力格式化函数
const formatVisionValue = (value) => {
  const num = Number(value);
  if (Number.isInteger(num)) {
    return num.toFixed(1);
  }
  // 不是整数时，保留原始格式
  return num.toString();
};

// 添加计算函数
const calculateAxialRatio = (axialLength, k1, k2) => {
  if (!axialLength || !k1 || !k2) return null;
  // 角膜曲率半径 = 337.5 / 平均K值
  const avgK = (Number(k1) + Number(k2)) / 2;
  const radius = 337.5 / avgK;
  return Number(axialLength) / radius;
};

const calculateCriticalPoint = (k1, k2) => {
  if (!k1 || !k2) return null;
  const avgK = (Number(k1) + Number(k2)) / 2;
  
  // 根据平均K值分情况计算
  if (avgK > 43) {
    // 平均K > 43: 临界值 = 23.5 - (平均K - 43) / 3
    return 23.5 - (avgK - 43) / 3;
  } else {
    // 平均K ≤ 43: 临界值 = 23.5 - (平均K - 43) / 2.5
    return 23.5 - (avgK - 43) / 2.5;
  }
};

// 添加计算眼轴长度变化的函数
const calculateAxialLengthChange = (current, previous, eye) => {
  if (!current || !previous) return null;

  const currentLength = eye === 'right' ? current.right_eye_axial_length : current.left_eye_axial_length;
  const previousLength = eye === 'right' ? previous.right_eye_axial_length : previous.left_eye_axial_length;

  if (!currentLength || !previousLength) return null;

  const change = Number(currentLength) - Number(previousLength);
  return {
    value: Math.abs(change).toFixed(2),
    isIncrease: change > 0
  };
};

// 添加格式化函数
function formatValue(value, type) {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  switch (type) {
    case 'choroid':
    case 'iop':
      return num.toFixed(1);
    case 'vision':
      if (Number.isInteger(num)) {
        return num.toFixed(1);
      }
      return num.toString();
    default:
      return num.toFixed(2);
  }
}

// 将columns改为计算属性
const columns = computed(() => [
  {
    title: props.record?.examination_date || '',
    dataIndex: 'eye',
    width: 120,
  },
  {
    title: '眼轴长度\n(mm)',
    dataIndex: 'axial_length',
    width: 120,
  },
  {
    title: 'K1\n(D)',
    dataIndex: 'k1',
    width: 100,
  },
  {
    title: 'K2\n(D)',
    dataIndex: 'k2',
    width: 100,
  },
  {
    title: 'ΔK\n(D)',
    dataIndex: 'delta_k',
    width: 100,
  },
  {
    title: 'avK\n(D)',
    dataIndex: 'avg_k',
    width: 100,
  },
  {
    title: '轴率比\n',
    dataIndex: 'axial_ratio',
    width: 100,
  },
  {
    title: '近视临界点\n(mm)',
    dataIndex: 'critical_point',
    width: 120,
  },
  {
    title: '角膜厚度\n(μm)',
    dataIndex: 'cct',
    width: 120,
  },
  {
    title: '前房深度\n(mm)',
    dataIndex: 'acd',
    width: 120,
  },
  {
    title: '晶体厚度\n(mm)',
    dataIndex: 'lens_thickness',
    width: 120,
  },
  {
    title: '玻璃体长度\n(mm)',
    dataIndex: 'vitreous_length',
    width: 120,
  },
  {
    title: '脉络膜厚度\n(μm)',
    dataIndex: 'choroid_thickness',
    width: 120,
  },
  {
    title: '眼压\n(mmHg)',
    dataIndex: 'iop',
    width: 100,
  },
]);

const tableData = computed(() => {
  if (!props.record) return [];

  // 计算近视临界点（只需要计算一次，因为左右眼K值相同）
  const criticalPoint = calculateCriticalPoint(
    props.record.right_eye_k1,
    props.record.right_eye_k2
  );

  // 计算眼轴长度变化
  const rightAxialChange = calculateAxialLengthChange(props.record, props.previousRecord, 'right');
  const leftAxialChange = calculateAxialLengthChange(props.record, props.previousRecord, 'left');

  // 计算ΔK和avK
  const rightDeltaK = props.record.right_eye_k1 && props.record.right_eye_k2 ? 
    Math.abs(Number(props.record.right_eye_k1) - Number(props.record.right_eye_k2)) : null;
  const leftDeltaK = props.record.left_eye_k1 && props.record.left_eye_k2 ? 
    Math.abs(Number(props.record.left_eye_k1) - Number(props.record.left_eye_k2)) : null;
  const rightAvgK = props.record.right_eye_k1 && props.record.right_eye_k2 ? 
    (Number(props.record.right_eye_k1) + Number(props.record.right_eye_k2)) / 2 : null;
  const leftAvgK = props.record.left_eye_k1 && props.record.left_eye_k2 ? 
    (Number(props.record.left_eye_k1) + Number(props.record.left_eye_k2)) / 2 : null;

  return [
    {
      key: 'right',
      eye: '右眼',
      axial_length: formatValue(props.record.right_eye_axial_length, 'default'),
      axial_change: rightAxialChange,
      k1: formatValue(props.record.right_eye_k1, 'default'),
      k2: formatValue(props.record.right_eye_k2, 'default'),
      delta_k: formatValue(rightDeltaK, 'default'),
      avg_k: formatValue(rightAvgK, 'default'),
      axial_ratio: formatValue(
        calculateAxialRatio(
          props.record.right_eye_axial_length,
          props.record.right_eye_k1,
          props.record.right_eye_k2
        ),
        'default'
      ),
      critical_point: formatValue(criticalPoint, 'default'),
      cct: formatValue(props.record.right_cct, 'default'),
      acd: formatValue(props.record.right_anterior_chamber_depth, 'default'),
      lens_thickness: formatValue(props.record.right_lens_thickness, 'default'),
      vitreous_length: formatValue(props.record.right_vitreous_space_thickness, 'default'),
      choroid_thickness: formatValue(props.record.right_oct_fovea, 'choroid'),
      iop: formatValue(props.record.right_intraocular_pressure, 'iop'),
    },
    {
      key: 'left',
      eye: '左眼',
      axial_length: formatValue(props.record.left_eye_axial_length, 'default'),
      axial_change: leftAxialChange,
      k1: formatValue(props.record.left_eye_k1, 'default'),
      k2: formatValue(props.record.left_eye_k2, 'default'),
      delta_k: formatValue(leftDeltaK, 'default'),
      avg_k: formatValue(leftAvgK, 'default'),
      axial_ratio: formatValue(
        calculateAxialRatio(
          props.record.left_eye_axial_length,
          props.record.left_eye_k1,
          props.record.left_eye_k2
        ),
        'default'
      ),
      critical_point: formatValue(criticalPoint, 'default'),
      cct: formatValue(props.record.left_cct, 'default'),
      acd: formatValue(props.record.left_anterior_chamber_depth, 'default'),
      lens_thickness: formatValue(props.record.left_lens_thickness, 'default'),
      vitreous_length: formatValue(props.record.left_vitreous_space_thickness, 'default'),
      choroid_thickness: formatValue(props.record.left_oct_fovea, 'choroid'),
      iop: formatValue(props.record.left_intraocular_pressure, 'iop'),
    }
  ];
});

// 添加图表类型选择
const selectedChartType = ref('axial');
// 眼轴图表显示身高体重开关
const showHeightWeightInAxial = ref(false);
// 选中的基准日期（用于显示变化量）
const selectedBaseDate = ref(null);
 const chartOptions = [
   {key: 'axial', title: '眼轴'},
   {key: 'iop', title: '眼压'},
   {key: 'vision', title: '视力'},
   {key: 'choroid', title: '脉络膜厚度'},
   {key: 'height_weight', title: '身高'},
 ];

// 添加日期筛选相关变量
const startYear = ref(null);
const startMonth = ref(null);
const endYear = ref(null);
const endMonth = ref(null);

// 生成年份选项（从2020年到当前年份+1年）
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 2020; year <= currentYear + 1; year++) {
    years.push(year);
  }
  return years;
});

// 月份选项
const monthOptions = [
  { value: 1, label: '1月' },
  { value: 2, label: '2月' },
  { value: 3, label: '3月' },
  { value: 4, label: '4月' },
  { value: 5, label: '5月' },
  { value: 6, label: '6月' },
  { value: 7, label: '7月' },
  { value: 8, label: '8月' },
  { value: 9, label: '9月' },
  { value: 10, label: '10月' },
  { value: 11, label: '11月' },
  { value: 12, label: '12月' }
];

// 日期筛选处理函数
const handleDateFilterChange = () => {
  // 当日期改变时，图表会自动重新计算和渲染
  // 因为 chartData 是计算属性，会自动响应年月选择的变化
};

// 重置日期筛选
const resetDateFilter = () => {
  startYear.value = null;
  startMonth.value = null;
  endYear.value = null;
  endMonth.value = null;
};

// 清除基准日期
const clearBaseDate = () => {
  selectedBaseDate.value = null;
  updateChart();
  message.info('已清除基准日期');
};

// 添加图表相关代码
const chartRef = ref(null);
let chart = null;

const noValidData = ref(false);

// 修改chartData计算属性
const chartData = computed(() => {
  if (!props.record || !props.examinationRecords.length) {
    noValidData.value = true;
    return null;
  }

  // 获取所有检查记录并按日期排序
  let sortedRecords = [...props.examinationRecords].sort((a, b) =>
    new Date(a.examination_date) - new Date(b.examination_date)
  );

  // 应用日期筛选
  if (startYear.value || startMonth.value || endYear.value || endMonth.value) {
    sortedRecords = sortedRecords.filter(record => {
      const recordDate = dayjs(record.examination_date);
      const recordYear = recordDate.year();
      const recordMonth = recordDate.month() + 1; // dayjs月份从0开始，需要+1
      
      // 检查开始日期筛选
      if (startYear.value || startMonth.value) {
        // 如果只选择了年份
        if (startYear.value && !startMonth.value) {
          if (recordYear < startYear.value) {
            return false;
          }
        }
        // 如果只选择了月份
        else if (!startYear.value && startMonth.value) {
          // 这种情况下，我们检查所有年份的该月份
          if (recordMonth < startMonth.value) {
            return false;
          }
        }
        // 如果同时选择了年份和月份
        else if (startYear.value && startMonth.value) {
          if (recordYear < startYear.value || (recordYear === startYear.value && recordMonth < startMonth.value)) {
            return false;
          }
        }
      }
      
      // 检查结束日期筛选
      if (endYear.value || endMonth.value) {
        // 如果只选择了年份
        if (endYear.value && !endMonth.value) {
          if (recordYear > endYear.value) {
            return false;
          }
        }
        // 如果只选择了月份
        else if (!endYear.value && endMonth.value) {
          // 这种情况下，我们检查所有年份的该月份
          if (recordMonth > endMonth.value) {
            return false;
          }
        }
        // 如果同时选择了年份和月份
        else if (endYear.value && endMonth.value) {
          if (recordYear > endYear.value || (recordYear === endYear.value && recordMonth > endMonth.value)) {
            return false;
          }
        }
      }
      
      return true;
    });
  }

  const dates = [];
  const rightEyeData = [];
  const leftEyeData = [];
  const rightEyeVaecData = [];
  const leftEyeVaecData = [];
  // 眼轴图表中的身高体重数据
  const heightData = [];
  const weightData = [];

  sortedRecords.forEach((record, index) => {
    // 眼轴、眼压、脉络膜厚度
    let rightValue = null, leftValue = null;
    let rightVaecValue = null, leftVaecValue = null;
    let heightValue = null, weightValue = null;
    if (selectedChartType.value === 'axial') {
      const r = Number(record.right_eye_axial_length);
      const l = Number(record.left_eye_axial_length);
      rightValue = (!isNaN(r) && r !== 0 && r !== null) ? r : null;
      leftValue = (!isNaN(l) && l !== 0 && l !== null) ? l : null;
      // 如果开启显示身高体重，同时收集身高体重数据
      if (showHeightWeightInAxial.value) {
        const h = Number(record.height);
        const w = Number(record.weight);
        heightValue = (!isNaN(h) && h !== 0 && h !== null) ? h : null;
        weightValue = (!isNaN(w) && w !== 0 && w !== null) ? w : null;
      }
    } else if (selectedChartType.value === 'iop') {
      const r = Number(record.right_intraocular_pressure);
      const l = Number(record.left_intraocular_pressure);
      rightValue = (!isNaN(r) && r !== 0 && r !== null) ? r : null;
      leftValue = (!isNaN(l) && l !== 0 && l !== null) ? l : null;
    } else if (selectedChartType.value === 'choroid') {
      const r = Number(record.right_oct_fovea);
      const l = Number(record.left_oct_fovea);
      rightValue = (!isNaN(r) && r !== 0 && r !== null) ? r : null;
      leftValue = (!isNaN(l) && l !== 0 && l !== null) ? l : null;
    } else if (selectedChartType.value === 'vision') {
      // 裸眼视力
      const rUva = Number(record.uva_right_vision);
      const lUva = Number(record.uva_left_vision);
      rightValue = (!isNaN(rUva) && rUva !== 0 && rUva !== null) ? rUva : null;
      leftValue = (!isNaN(lUva) && lUva !== 0 && lUva !== null) ? lUva : null;
      // 旧镜视力
      const rVaec = Number(record.vaec_right_old_vision);
      const lVaec = Number(record.vaec_left_old_vision);
      rightVaecValue = (!isNaN(rVaec) && rVaec !== 0 && rVaec !== null) ? rVaec : null;
      leftVaecValue = (!isNaN(lVaec) && lVaec !== 0 && lVaec !== null) ? lVaec : null;
    } else if (selectedChartType.value === 'height_weight') {
      const height = Number(record.height);
      rightValue = (!isNaN(height) && height !== 0 && height !== null) ? height : null;
      leftValue = null; // 不再收集体重数据
    }

    // 只要有一个有效数据就保留（包括身高体重）
    const hasValid = [rightValue, leftValue, rightVaecValue, leftVaecValue, heightValue, weightValue].some(v => v !== null);
    if (hasValid) {
      dates.push(record.examination_date);
      
      // 如果在眼轴模式下显示身高体重，收集身高体重数据
      if (selectedChartType.value === 'axial' && showHeightWeightInAxial.value) {
        heightData.push({
          value: heightValue,
          formattedValue: heightValue !== null ? heightValue.toFixed(1) + 'cm' : '-',
          rawValue: heightValue
        });
        weightData.push({
          value: weightValue,
          formattedValue: weightValue !== null ? weightValue.toFixed(1) + 'kg' : '-',
          rawValue: weightValue
        });
      }
      
      if (selectedChartType.value === 'vision') {
        // 裸眼视力
        rightEyeData.push({
          value: rightValue,
          formattedValue: rightValue !== null ? formatVisionValue(rightValue) : '-',
          change: null
        });
        leftEyeData.push({
          value: leftValue,
          formattedValue: leftValue !== null ? formatVisionValue(leftValue) : '-',
          change: null
        });
        // 旧镜视力
        rightEyeVaecData.push({
          value: rightVaecValue,
          formattedValue: rightVaecValue !== null ? formatVisionValue(rightVaecValue) : '-',
          change: null
        });
        leftEyeVaecData.push({
          value: leftVaecValue,
          formattedValue: leftVaecValue !== null ? formatVisionValue(leftVaecValue) : '-',
          change: null
        });
      } else {
        // 根据不同类型格式化数值
        const formatValueForChart = (value) => {
          if (value === null || value === undefined || value === '') return '-';
          const num = Number(value);
          if (isNaN(num)) return '-';
          switch (selectedChartType.value) {
            case 'axial':
              return num.toFixed(2); // 强制两位小数
            case 'iop':
            case 'choroid':
              return num.toFixed(1);
            case 'height_weight':
              return num.toFixed(1); // 身高保留一位小数
            default:
              return num.toString();
          }
        };
        rightEyeData.push({
          value: rightValue,
          formattedValue: formatValueForChart(rightValue)
        });
        leftEyeData.push({
          value: leftValue,
          formattedValue: formatValueForChart(leftValue)
        });
      }
    }
  });

  if (dates.length === 0) {
    noValidData.value = true;
    return null;
  }
  noValidData.value = false;
  return {
    dates,
    rightEyeData,
    leftEyeData,
    rightEyeVaecData,
    leftEyeVaecData,
    heightData,
    weightData
  };
});

// 获取对应图表类型的数据字段
const getDataField = (eye) => {
  const prefix = eye === 'right' ? 'right_eye_' : 'left_eye_';
  switch (selectedChartType.value) {
    case 'axial':
      return prefix + 'axial_length';
    case 'iop':
      return eye + '_intraocular_pressure';
    case 'vision':
      return 'uva_' + eye + '_vision';
    case 'choroid':
      return eye + '_oct_fovea';
    default:
      return prefix + 'axial_length';
  }
};

// 获取图表标题
const getChartTitle = () => {
  switch (selectedChartType.value) {
    case 'axial':
      return '眼轴长度趋势图';
    case 'iop':
      return '眼压趋势图';
    case 'vision':
      return '视力趋势图';
    case 'choroid':
      return '脉络膜厚度趋势图';
    case 'height_weight':
      return '身高趋势图';
    default:
      return '眼轴长度趋势图';
  }
};

// 获取Y轴单位
const getYAxisUnit = () => {
  switch (selectedChartType.value) {
    case 'axial':
      return 'mm';
    case 'iop':
      return 'mmHg';
    case 'vision':
      return '';
    case 'choroid':
      return 'μm';
    case 'height_weight':
      return 'cm';
    default:
      return 'mm';
  }
};

// 修改图表初始化逻辑
const initChartInstance = () => {
  if (!chartRef.value) return;

  // 确保DOM元素已经渲染
  nextTick(() => {
    if (chartRef.value) {
      chart = initChart(chartRef.value);
      updateChart();
    }
  });
};

// 修改组件挂载时的初始化
onMounted(() => {
  // 延迟初始化图表，确保DOM已经渲染完成
  setTimeout(() => {
    initChartInstance();
  }, 100);

  window.addEventListener('resize', handleResize);
});

// 修改数据监听
watch(chartData, () => {
  if (chart) {
    nextTick(() => {
      updateChart();
    });
  }
}, { deep: true });

// 修改更新图表函数
const updateChart = () => {
  if (noValidData.value) {
    if (chart) {
      chart.dispose();
      chart = null;
    }
    return;
  }
  if (!chartRef.value || !chartData.value) return;
  if (chart) {
    chart.dispose();
    chart = null;
  }
  chart = initChart(chartRef.value);

  // 计算所有数据点的最大值和最小值
  let yAxisMax, yAxisMin;
  
  if (selectedChartType.value === 'height_weight') {
    // 身高图表Y轴范围
    const heightValues = chartData.value.rightEyeData.map(item => item.value).filter(value => value !== null && value !== undefined);
    
    // 身高Y轴范围 (cm)
    const heightMax = heightValues.length > 0 ? Math.max(...heightValues) : 180;
    const heightMin = heightValues.length > 0 ? Math.min(...heightValues) : 100;
    const heightRange = heightMax - heightMin;
    yAxisMax = heightMax + heightRange * 0.1;
    yAxisMin = Math.max(0, heightMin - heightRange * 0.1);
  } else {
    const allValues = selectedChartType.value === 'vision' ? [
      ...chartData.value.rightEyeData.map(item => item.value),
      ...chartData.value.leftEyeData.map(item => item.value),
      ...chartData.value.rightEyeVaecData.map(item => item.value),
      ...chartData.value.leftEyeVaecData.map(item => item.value)
    ] : [
      ...chartData.value.rightEyeData.map(item => item.value),
      ...chartData.value.leftEyeData.map(item => item.value)
    ].filter(value => value !== null && value !== undefined);

    if (allValues.length === 0) return;

    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);

    // 设置y轴范围，最大值+0.05，最小值-0.05
    // 使用四舍五入避免浮点数精度问题
    yAxisMax = Math.round((maxValue + 0.05) * 100) / 100;
    yAxisMin = Math.round((minValue - 0.05) * 100) / 100;
  }

  // 为每个数据点计算标签位置
  const processDataWithLabels = (data, compareData, eye = 'right') => {
    return data.map((item, index) => {
      const compareValue = compareData[index]?.value;
      
      // 计算相对于选中基准日期的变化量（仅在眼轴图表中）
      let baseDateChange = null;
      if (selectedChartType.value === 'axial' && selectedBaseDate.value) {
        const currentDate = chartData.value.dates[index];
        const baseDateIndex = chartData.value.dates.indexOf(selectedBaseDate.value);
        
        // 如果当前日期在基准日期之后，计算变化量
        if (baseDateIndex !== -1 && index > baseDateIndex && item.value !== null && item.value !== undefined) {
          const baseData = eye === 'right' ? chartData.value.rightEyeData[baseDateIndex] : chartData.value.leftEyeData[baseDateIndex];
          const baseValue = baseData?.value;
          
          if (baseValue !== null && baseValue !== undefined) {
            const changeValue = item.value - baseValue;
            baseDateChange = {
              value: Math.abs(changeValue).toFixed(2),
              isIncrease: changeValue > 0
            };
          }
        }
      }
      
      return {
        ...item,
        baseDateChange, // 存储相对于基准日期的变化量
        label: {
          show: true,
          position: item.value > compareValue ? 'top' : 'bottom',
          formatter: (params) => {
            // 优先使用formattedValue，如果没有则使用value
            let result = item.formattedValue || (params.value !== null && params.value !== undefined ? params.value.toFixed(2) : '-');
            
            // 如果有相对于基准日期的变化量，显示变化量和箭头
            if (baseDateChange) {
              const arrow = baseDateChange.isIncrease ? '↑' : '↓';
              const colorStyle = baseDateChange.isIncrease ? 'changeIncrease' : 'changeDecrease';
              result += `\n{${colorStyle}|${arrow}${baseDateChange.value}}`;
            } else {
              // 否则显示原有的变化量（如果有）
              const change = item.change;
              if (change) {
                const arrow = change.isIncrease ? '↑' : '↓';
                const colorStyle = change.isIncrease ? 'changeIncrease' : 'changeDecrease';
                result += `\n{${colorStyle}|${arrow}${change.value}}`;
              }
            }
            
            return result;
          },
          rich: {
            changeIncrease: {
              fontSize: 12,
              fontWeight: 'bold',
              color: '#ff4d4f'
            },
            changeDecrease: {
              fontSize: 12,
              fontWeight: 'bold',
              color: '#52c41a'
            }
          }
        }
      };
    });
  };

  const rightEyeData = processDataWithLabels(chartData.value.rightEyeData, chartData.value.leftEyeData, 'right');
  const leftEyeData = processDataWithLabels(chartData.value.leftEyeData, chartData.value.rightEyeData, 'left');
  const rightEyeVaecData = selectedChartType.value === 'vision' ?
    processDataWithLabels(chartData.value.rightEyeVaecData, chartData.value.leftEyeVaecData) : [];
  const leftEyeVaecData = selectedChartType.value === 'vision' ?
    processDataWithLabels(chartData.value.leftEyeVaecData, chartData.value.rightEyeVaecData) : [];

  // 计算平均眼轴长度（仅用于眼轴图表）
  let rightAvgAxialLength = null;
  let leftAvgAxialLength = null;
  
  if (selectedChartType.value === 'axial') {
    const rightValues = chartData.value.rightEyeData.map(item => item.value).filter(val => val !== null && val !== undefined);
    const leftValues = chartData.value.leftEyeData.map(item => item.value).filter(val => val !== null && val !== undefined);
    
    if (rightValues.length > 0) {
      rightAvgAxialLength = rightValues.reduce((sum, val) => sum + val, 0) / rightValues.length;
    }
    if (leftValues.length > 0) {
      leftAvgAxialLength = leftValues.reduce((sum, val) => sum + val, 0) / leftValues.length;
    }
  }

  // 清除之前的图表配置
  chart.clear();

  const option = {
    ...axialLengthOption,
    title: {
      text: '',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const date = params[0].axisValue;
        let result = `${date}<br/>`;
        
        // 添加数据值
        if (selectedChartType.value === 'vision') {
          result += params.map(param => {
            const data = param.data;
            if (!data || data.formattedValue === undefined || data.formattedValue === null) {
              return `${param.seriesName}: -`;
            }
            return `${param.seriesName}: ${data.formattedValue}`;
          }).join('<br/>');
        } else {
          result += params.map(param => {
            const data = param.data;
            if (!data || data.formattedValue === undefined || data.formattedValue === null) {
              return `${param.seriesName}: -`;
            }
            return `${param.seriesName}: ${data.formattedValue}`;
          }).join('<br/>');
        }
        
        // 添加平均值和诊疗方案信息（只在眼轴长度图表中显示）
        if (selectedChartType.value === 'axial') {
          result += '<br/>';
          
          // 添加平均值信息
          if (rightAvgAxialLength) {
            result += `<span style="color: #ff4d4f;">右眼平均:</span> ${rightAvgAxialLength.toFixed(2)}mm<br/>`;
          }
          if (leftAvgAxialLength) {
            result += `<span style="color: #1890ff;">左眼平均:</span> ${leftAvgAxialLength.toFixed(2)}mm<br/>`;
          }
          
          // 如果显示了身高体重，在tooltip中也显示
          if (showHeightWeightInAxial.value) {
            const recordIndex = chartData.value.dates.indexOf(date);
            if (recordIndex !== -1) {
              const heightItem = chartData.value.heightData[recordIndex];
              const weightItem = chartData.value.weightData[recordIndex];
              if (heightItem && heightItem.rawValue !== null && heightItem.formattedValue) {
                result += `<span style="color: #52c41a;">身高:</span> ${heightItem.formattedValue}<br/>`;
              }
              if (weightItem && weightItem.rawValue !== null && weightItem.formattedValue) {
                result += `<span style="color: #fa8c16;">体重:</span> ${weightItem.formattedValue}<br/>`;
              }
            }
          }
          
          const currentRecord = props.examinationRecords.find(record => record.examination_date === date);
          if (currentRecord) {
            // 右眼方案
            const rightTreatment = formatTreatmentPlan(currentRecord, 'right');
            if (rightTreatment) {
              result += `<span style="color: #ff4d4f;">右眼方案:</span> ${rightTreatment}<br/>`;
            }
            
            // 左眼方案
            const leftTreatment = formatTreatmentPlan(currentRecord, 'left');
            if (leftTreatment) {
              result += `<span style="color: #1890ff;">左眼方案:</span> ${leftTreatment}`;
            }
          }
        }
        
        return result;
      }
    },
    legend: {
      data: selectedChartType.value === 'vision' ?
        ['右眼裸眼视力', '左眼裸眼视力', '右眼旧镜视力', '左眼旧镜视力'] :
        selectedChartType.value === 'axial' ?
          ['右眼', '左眼', ...(rightAvgAxialLength ? ['右眼平均'] : []), ...(leftAvgAxialLength ? ['左眼平均'] : []), ...(showHeightWeightInAxial.value ? ['身高', '体重'] : [])] :
        selectedChartType.value === 'height_weight' ?
          ['身高'] :
          ['右眼', '左眼'],
      top: 30,
      textStyle: {
        fontSize: 14
      }
    },
    xAxis: {
      ...axialLengthOption.xAxis,
      data: chartData.value.dates,
      boundaryGap: true,
      axisLabel: {
        margin: 16
      }
    },
    yAxis: selectedChartType.value === 'height_weight' ? [
      {
        type: 'value',
        name: '身高(cm)',
        position: 'left',
        min: (() => {
          const heightValues = chartData.value.rightEyeData.map(item => item.value).filter(value => value !== null && value !== undefined);
          if (heightValues.length === 0) return 100;
          const heightMin = Math.min(...heightValues);
          const heightMax = Math.max(...heightValues);
          const heightRange = heightMax - heightMin;
          return Math.round(Math.max(0, heightMin - heightRange * 0.1) * 10) / 10;
        })(),
        max: (() => {
          const heightValues = chartData.value.rightEyeData.map(item => item.value).filter(value => value !== null && value !== undefined);
          if (heightValues.length === 0) return 180;
          const heightMin = Math.min(...heightValues);
          const heightMax = Math.max(...heightValues);
          const heightRange = heightMax - heightMin;
          return Math.round((heightMax + heightRange * 0.1) * 10) / 10;
        })(),
        nameLocation: 'end',
        axisLabel: {
          formatter: (value) => {
            return value.toFixed(1) + ' cm';
          }
        }
      }
    ] : {
      ...axialLengthOption.yAxis,
      min: yAxisMin,
      max: yAxisMax,
      name: getYAxisUnit(),
      nameLocation: 'end',
      axisLabel: {
        formatter: (value) => {
          // 格式化Y轴标签，避免浮点数精度问题
          // 对于眼轴、眼压等需要保留2位小数的数据
          if (selectedChartType.value === 'axial' || selectedChartType.value === 'iop') {
            return value.toFixed(2);
          }
          // 对于脉络膜厚度等需要保留1位小数的数据
          if (selectedChartType.value === 'choroid') {
            return value.toFixed(1);
          }
          // 默认保留2位小数
          return value.toFixed(2);
        }
      }
    },
    series: selectedChartType.value === 'vision' ? [
      {
        name: '右眼裸眼视力',
        type: 'line',
        data: rightEyeData,
        itemStyle: { color: '#ff4d4f' },
        lineStyle: { color: '#ff4d4f' },
        label: {
          show: true,
          formatter: (params) => {
            return params.data.formattedValue;
          },
          position: 'top',
          distance: 5,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#666',
          rich: {
            change: {
              fontSize: 14,
              fontWeight: 'bold'
            }
          }
        }
      },
      {
        name: '左眼裸眼视力',
        type: 'line',
        data: leftEyeData,
        itemStyle: { color: '#1890ff' },
        lineStyle: { color: '#1890ff' },
        label: {
          show: true,
          formatter: (params) => {
            return params.data.formattedValue;
          },
          position: 'top',
          distance: 5,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#666',
          rich: {
            change: {
              fontSize: 14,
              fontWeight: 'bold'
            }
          }
        }
      },
      {
        name: '右眼旧镜视力',
        type: 'line',
        data: rightEyeVaecData,
        itemStyle: { color: '#ff7a45' },
        lineStyle: { color: '#ff7a45', type: 'dashed' },
        label: {
          show: true,
          formatter: (params) => {
            return params.data.formattedValue;
          },
          position: 'top',
          distance: 5,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#666',
          rich: {
            change: {
              fontSize: 14,
              fontWeight: 'bold'
            }
          }
        }
      },
      {
        name: '左眼旧镜视力',
        type: 'line',
        data: leftEyeVaecData,
        itemStyle: { color: '#40a9ff' },
        lineStyle: { color: '#40a9ff', type: 'dashed' },
        label: {
          show: true,
          formatter: (params) => {
            return params.data.formattedValue;
          },
          position: 'top',
          distance: 5,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#666',
          rich: {
            change: {
              fontSize: 14,
              fontWeight: 'bold'
            }
          }
        }
      }
    ] : selectedChartType.value === 'height_weight' ? [
      {
        name: '身高',
        type: 'line',
        yAxisIndex: 0,
        data: rightEyeData,
        itemStyle: { color: '#52c41a' },
        lineStyle: { color: '#52c41a', width: 3 },
        label: {
          show: true,
          formatter: (params) => {
            return params.data.formattedValue;
          },
          position: 'top',
          distance: 5,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#52c41a',
          rich: {
            change: {
              fontSize: 14,
              fontWeight: 'bold'
            }
          }
        }
      }
    ] : [
      {
        name: '右眼',
        type: 'line',
        data: rightEyeData,
        itemStyle: { color: '#ff4d4f' },
        lineStyle: { color: '#ff4d4f' },
        label: {
          show: true,
          formatter: (params) => {
            return params.data.formattedValue;
          },
          position: 'top',
          distance: 5,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#666',
          rich: {
            change: {
              fontSize: 14,
              fontWeight: 'bold'
            }
          }
        }
      },
      {
        name: '左眼',
        type: 'line',
        data: leftEyeData,
        itemStyle: { color: '#1890ff' },
        lineStyle: { color: '#1890ff' },
        label: {
          show: true,
          formatter: (params) => {
            return params.data.formattedValue;
          },
          position: 'top',
          distance: 5,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#666',
          rich: {
            change: {
              fontSize: 14,
              fontWeight: 'bold'
            }
          }
        }
      },
      // 添加右眼平均眼轴长度横线（仅眼轴图表显示）
      ...(selectedChartType.value === 'axial' && rightAvgAxialLength ? [{
        name: '右眼平均',
        type: 'line',
        data: chartData.value.dates.map(() => rightAvgAxialLength),
        lineStyle: { 
          color: '#ff4d4f', 
          type: 'dashed',
          width: 2
        },
        itemStyle: { color: '#ff4d4f' },
        symbol: 'circle',
        symbolSize: 0,
        legendHoverLink: true,
        label: {
          show: true,
          formatter: (params) => {
            // 只在最后一个数据点显示标签
            return params.dataIndex === chartData.value.dates.length - 1 ? 
              `右眼平均: ${rightAvgAxialLength.toFixed(2)}mm` : '';
          },
          position: 'right',
          distance: 10,
          fontSize: 12,
          fontWeight: 'bold',
          color: '#ff4d4f',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#ff4d4f',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 8]
        },
        tooltip: {
          show: false
        }
      }] : []),
      // 添加左眼平均眼轴长度横线（仅眼轴图表显示）
      ...(selectedChartType.value === 'axial' && leftAvgAxialLength ? [{
        name: '左眼平均',
        type: 'line',
        data: chartData.value.dates.map(() => leftAvgAxialLength),
        lineStyle: { 
          color: '#1890ff', 
          type: 'dashed',
          width: 2
        },
        itemStyle: { color: '#1890ff' },
        symbol: 'circle',
        symbolSize: 0,
        legendHoverLink: true,
        label: {
          show: true,
          formatter: (params) => {
            // 只在最后一个数据点显示标签
            return params.dataIndex === chartData.value.dates.length - 1 ? 
              `左眼平均: ${leftAvgAxialLength.toFixed(2)}mm` : '';
          },
          position: 'right',
          distance: 10,
          fontSize: 12,
          fontWeight: 'bold',
          color: '#1890ff',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#1890ff',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 8]
        },
        tooltip: {
          show: false
        }
      }] : []),
      // 添加身高体重系列（仅在眼轴图表中且开启开关时显示）
      ...(selectedChartType.value === 'axial' && showHeightWeightInAxial.value && chartData.value.heightData.length > 0 ? [
        {
          name: '身高',
          type: 'line',
          data: chartData.value.heightData.map(item => {
            // 将身高数据映射到眼轴Y轴范围内以便显示
            // 身高范围通常是 100-180cm，眼轴范围由 yAxisMin-yAxisMax 决定
            // 这里使用简单的线性映射
            if (!item || item.rawValue === null || item.rawValue === undefined) return null;
            const heightValues = chartData.value.heightData.map(d => d?.rawValue).filter(v => v !== null && v !== undefined);
            if (heightValues.length === 0) return null;
            const heightMin = Math.min(...heightValues);
            const heightMax = Math.max(...heightValues);
            const heightRange = heightMax - heightMin;
            if (heightRange === 0) return yAxisMin + (yAxisMax - yAxisMin) / 2;
            // 映射到 yAxisMin 到 yAxisMax 的范围
            const mappedValue = ((item.rawValue - heightMin) / heightRange) * (yAxisMax - yAxisMin) + yAxisMin;
            return {
              value: mappedValue,
              formattedValue: item.formattedValue || '-',
              rawValue: item.rawValue
            };
          }),
          itemStyle: { color: '#52c41a' },
          lineStyle: { color: '#52c41a', width: 2, type: 'dashed' },
          symbol: 'circle',
          symbolSize: 6,
          label: {
            show: true,
            formatter: (params) => {
              return params.data?.formattedValue || '';
            },
            position: 'top',
            distance: 5,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#52c41a'
          }
        }
      ] : []),
      ...(selectedChartType.value === 'axial' && showHeightWeightInAxial.value && chartData.value.weightData.length > 0 ? [
        {
          name: '体重',
          type: 'line',
          data: chartData.value.weightData.map(item => {
            // 将体重数据映射到眼轴Y轴范围内以便显示
            if (!item || item.rawValue === null || item.rawValue === undefined) return null;
            const weightValues = chartData.value.weightData.map(d => d?.rawValue).filter(v => v !== null && v !== undefined);
            if (weightValues.length === 0) return null;
            const weightMin = Math.min(...weightValues);
            const weightMax = Math.max(...weightValues);
            const weightRange = weightMax - weightMin;
            if (weightRange === 0) return yAxisMin + (yAxisMax - yAxisMin) / 2;
            // 映射到 yAxisMin 到 yAxisMax 的范围
            const mappedValue = ((item.rawValue - weightMin) / weightRange) * (yAxisMax - yAxisMin) + yAxisMin;
            return {
              value: mappedValue,
              formattedValue: item.formattedValue || '-',
              rawValue: item.rawValue
            };
          }),
          itemStyle: { color: '#fa8c16' },
          lineStyle: { color: '#fa8c16', width: 2, type: 'dashed' },
          symbol: 'diamond',
          symbolSize: 6,
          label: {
            show: true,
            formatter: (params) => {
              return params.data?.formattedValue || '';
            },
            position: 'bottom',
            distance: 5,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#fa8c16'
          }
        }
      ] : [])
    ]
  };

  try {
    chart.setOption(option);
    
    // 添加点击事件监听（仅在眼轴图表中）
    if (selectedChartType.value === 'axial') {
      chart.off('click'); // 先移除之前的事件监听
      chart.on('click', (params) => {
        // 点击数据点时，设置基准日期
        if (params.componentType === 'series' && params.seriesType === 'line') {
          // 排除平均线的点击
          if (params.seriesName !== '右眼平均' && params.seriesName !== '左眼平均') {
            const clickedDate = chartData.value.dates[params.dataIndex];
            if (clickedDate) {
              selectedBaseDate.value = clickedDate;
              // 重新渲染图表以显示变化量
              updateChart();
              message.info(`已选择基准日期: ${clickedDate}，将显示后续检查的变化量`);
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('更新图表失败:', error);
  }
};

// 监听窗口大小变化
const handleResize = () => {
  chart?.resize();
};

// 监听图表类型变化
watch(selectedChartType, async () => {
  await nextTick();
  updateChart();
});

// 监听身高体重开关变化
watch(showHeightWeightInAxial, async () => {
  if (selectedChartType.value === 'axial') {
    await nextTick();
    updateChart();
  }
});

// 监听 noValidData 变化，切换为有数据时 nextTick 后再渲染
watch(noValidData, async (val) => {
  await nextTick();
  updateChart();
});

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chart?.dispose();
});

// 格式化诊疗方案
function formatTreatmentPlan(record, eye) {
  const prefix = eye === 'right' ? 'right_' : 'left_';
  const treatments = [];
  
  // 阿托品
  const atropine = record[prefix + 'atropine'];
  if (atropine && atropine !== '否' && atropine !== 'none') {
    treatments.push(`阿托品: ${atropine}`);
  }
  
  // 配镜手段
  const glasses = record[prefix + 'glasses'];
  if (glasses && glasses !== '否' && glasses !== 'none') {
    const glassesPP = record[prefix + 'glasses_pp'];
    const glassesText = glassesPP ? `${glasses}(${glassesPP})` : glasses;
    treatments.push(`配镜: ${glassesText}`);
  }
  
  // 低强度红光
  const hg = record[prefix + 'hg'];
  if (hg && hg !== '否' && hg !== 'none') {
    const hgDW = record[prefix + 'hg_dw'];
    const hgText = hgDW !== undefined && hgDW !== '' ? `${hg}(档位${hgDW})` : hg;
    treatments.push(`低强度红光: ${hgText}`);
  }
  
  // 理疗
  const physiotherapy = record[prefix + 'physiotherapy'];
  if (physiotherapy && physiotherapy !== '否' && physiotherapy !== 'none') {
    treatments.push('理疗: 进行');
  }
  
  // 视觉训练
  const visualTraining = record[prefix + 'visual_training'];
  if (visualTraining && visualTraining !== '否' && visualTraining !== 'none') {
    treatments.push('视觉训练: 进行');
  }
  
  return treatments.length > 0 ? treatments.join(', ') : '无治疗方案';
}

// 字段映射，保证v-model绑定form的真实字段名
const fieldMap = {
  right: {
    axial_length: 'right_eye_axial_length',
    k1: 'right_eye_k1',
    k2: 'right_eye_k2',
    delta_k: 'right_delta_k', // 计算字段，不可编辑
    avg_k: 'right_avg_k', // 计算字段，不可编辑
    axial_ratio: 'right_axial_ratio', // 如无可删
    critical_point: 'right_critical_point', // 如无可删
    cct: 'right_cct',
    acd: 'right_anterior_chamber_depth',
    lens_thickness: 'right_lens_thickness',
    vitreous_length: 'right_vitreous_space_thickness',
    choroid_thickness: 'right_oct_fovea',
    iop: 'right_intraocular_pressure'
  },
  left: {
    axial_length: 'left_eye_axial_length',
    k1: 'left_eye_k1',
    k2: 'left_eye_k2',
    delta_k: 'left_delta_k', // 计算字段，不可编辑
    avg_k: 'left_avg_k', // 计算字段，不可编辑
    axial_ratio: 'left_axial_ratio', // 如无可删
    critical_point: 'left_critical_point', // 如无可删
    cct: 'left_cct',
    acd: 'left_anterior_chamber_depth',
    lens_thickness: 'left_lens_thickness',
    vitreous_length: 'left_vitreous_space_thickness',
    choroid_thickness: 'left_oct_fovea',
    iop: 'left_intraocular_pressure'
  }
};
</script>

<style scoped lang="scss">
.routine-exam {
  width: 100%;
}
.exam-content {
  margin-top: 16px;
}
:deep(.ant-table-cell) {
  text-align: center !important;
}
:deep(.ant-table-thead > tr > th) {
  background-color: #f5f5f5;
  font-weight: bold;
  padding: 8px !important;
  white-space: pre-line !important;
  height: auto !important;
  line-height: 1.5 !important;
}
.axial-length-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.change-indicator {
  display: flex;
  align-items: center;
  font-size: 12px;
}
.change-indicator.increase {
  color: #ff4d4f;
}
.change-indicator.decrease {
  color: #52c41a;
}
.change-value {
  font-size: 12px;
}

.chart-options {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    margin: 0 auto 16px;
    width: auto;
    height: auto;

    .chart-option-btn {
      min-width: 100px;
      height: 36px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.3s ease;
      border: 1px solid #d9d9d9;
      
      // 默认状态
      &:not(.ant-btn-primary) {
        background: #fff;
        color: #333;
        border-color: #d9d9d9;
        
        &:hover {
          background: #f5f5f5;
          border-color: #1890ff;
          color: #1890ff;
        }
      }
      
      // 选中状态（蓝色背景）
      &.ant-btn-primary {
        background: #1890ff;
        border-color: #1890ff;
        color: #fff;
        
        &:hover {
          background: #40a9ff;
          border-color: #40a9ff;
        }
      }
    }
  }

.height-weight-switch {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 16px 0;
  gap: 12px;
  
  :deep(.ant-checkbox-wrapper) {
    font-size: 14px;
    color: #666;
    
    .ant-checkbox-checked .ant-checkbox-inner {
      background-color: #F4BB22;
      border-color: #F4BB22;
    }
    
    .ant-checkbox:hover .ant-checkbox-inner {
      border-color: #F4BB22;
    }
  }
  
  .base-date-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #fff7e6;
    border: 1px solid #ffd591;
    border-radius: 4px;
    font-size: 14px;
    
    .base-date-text {
      color: #d46b08;
      font-weight: 500;
    }
  }
}

.chart-container {
  margin-top: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .chart-title {
    display: flex;
    align-items: center;

    .qushi-icon {
      width: 18px;
      height: 18px;
      margin-right: 16px;
    }

    h3 {
      font-weight: 500;
      font-size: 20px;
      color: #000714;
    }
  }

  .date-filter-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 16px 0;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;

    .date-filter-label {
      font-size: 14px;
      color: #666;
      margin-right: 12px;
      white-space: nowrap;
    }

    .date-filter-inputs {
      display: flex;
      align-items: center;
      gap: 16px;

      .date-range-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .date-range-label {
          font-size: 14px;
          color: #666;
          white-space: nowrap;
        }
      }
    }
  }
}

.chart {
  width: 100%;
  height: 400px;
}

.no-data-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  color: #888;
  background: #fcfcfc;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  margin: 24px 0;
}
.no-data-img {
  margin-bottom: 16px;
}
.no-data-title {
  font-size: 20px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
  letter-spacing: 2px;
}
.no-data-desc {
  font-size: 15px;
  color: #888;
  letter-spacing: 1px;
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

:deep(.exam-table) {

  .ant-table-thead tr th:first-child{
    background: #e4e8f0;
  }

  .ant-table-thead th{
    background: #fcf1ec;
    height: 35px !important;
    line-height: 35px !important;
    white-space: nowrap !important;
    padding: 0 !important;
  }

  .ant-table-tbody tr td:first-child {
    background: #e4e8f0;
  }

  .ant-table-tbody tr td {
    height: 35px !important;
    line-height: 35px !important;
    white-space: nowrap !important;
    padding: 0 !important;
  }
}
</style>
