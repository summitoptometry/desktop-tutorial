<template>
  <div class="routine-exam">
    <Teleport defer to="#btn-group3">
      <div style="text-align: right; margin-bottom: 16px;display: flex;justify-content: right">
        <a-button class="header-btn" v-if="!isEditMode" type="primary" @click="startEdit">编辑</a-button>
        <a-button class="header-btn" v-if="isEditMode" type="primary" @click="handleSave" style="margin-right: 8px;">保存</a-button>
        <a-button class="header-btn" v-if="isEditMode" type="primary" @click="handleCancel">取消</a-button>
      </div>
    </Teleport>
    <div class="exam-content">
      <div v-if="!record">暂无检查数据</div>
      <div v-else>
        <a-table class="exam-table" :columns="columns1" :data-source="tableData" :pagination="false" :bordered="true">
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
        <a-table class="exam-table exam-table2" :columns="columns2" :data-source="tableData" :pagination="false" :bordered="true">
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
            <div :class="['signal-sub-tabs-item', { active: selectedChartType === tab.key }]" v-for="tab in chartOptions" :key="tab.key" @click="selectedChartType = tab.key">
              {{tab.title}}
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
import { message } from 'ant-design-vue';
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
  // 近视临界点 = 2.99 * 角膜曲率半径
  const avgK = (Number(k1) + Number(k2)) / 2;
  const radius = 337.5 / avgK;
  return 2.99 * radius;
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
const columns1 = computed(() => [
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
]);

const columns2 = computed(() => [
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
  {
    title: '裸眼视力\n',
    dataIndex: 'uva',
    width: 100,
  },
  {
    title: '旧镜视力\n',
    dataIndex: 'vaec',
    width: 100,
  },
])

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

  return [
    {
      key: 'right',
      eye: '右眼',
      axial_length: formatValue(props.record.right_eye_axial_length, 'default'),
      axial_change: rightAxialChange,
      k1: formatValue(props.record.right_eye_k1, 'default'),
      k2: formatValue(props.record.right_eye_k2, 'default'),
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
      uva: formatValue(props.record.uva_right_vision, 'vision'),
      vaec: formatValue(props.record.vaec_right_old_vision, 'vision'),
    },
    {
      key: 'left',
      eye: '左眼',
      axial_length: formatValue(props.record.left_eye_axial_length, 'default'),
      axial_change: leftAxialChange,
      k1: formatValue(props.record.left_eye_k1, 'default'),
      k2: formatValue(props.record.left_eye_k2, 'default'),
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
      uva: formatValue(props.record.uva_left_vision, 'vision'),
      vaec: formatValue(props.record.vaec_left_old_vision, 'vision'),
    }
  ];
});

// 添加图表类型选择
const selectedChartType = ref('axial');
const chartOptions = [
  {key: 'axial', title: '眼轴'},
  {key: 'iop', title: '眼压'},
  {key: 'vision', title: '视力'},
  {key: 'choroid', title: '脉络膜厚度'},
];

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
  const sortedRecords = [...props.examinationRecords].sort((a, b) =>
      new Date(a.examination_date) - new Date(b.examination_date)
  );

  const dates = [];
  const rightEyeData = [];
  const leftEyeData = [];
  const rightEyeVaecData = [];
  const leftEyeVaecData = [];

  sortedRecords.forEach((record, index) => {
    // 眼轴、眼压、脉络膜厚度
    let rightValue = null, leftValue = null;
    let rightVaecValue = null, leftVaecValue = null;
    if (selectedChartType.value === 'axial') {
      const r = Number(record.right_eye_axial_length);
      const l = Number(record.left_eye_axial_length);
      rightValue = (!isNaN(r) && r !== 0 && r !== null) ? r : null;
      leftValue = (!isNaN(l) && l !== 0 && l !== null) ? l : null;
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
    }

    // 只要有一个有效数据就保留
    const hasValid = [rightValue, leftValue, rightVaecValue, leftVaecValue].some(v => v !== null);
    if (hasValid) {
      dates.push(record.examination_date);
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
    leftEyeVaecData
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
  const yAxisMax = maxValue + 0.05;
  const yAxisMin = minValue - 0.05;

  // 为每个数据点计算标签位置
  const processDataWithLabels = (data, compareData) => {
    return data.map((item, index) => {
      const compareValue = compareData[index]?.value;
      return {
        ...item,
        label: {
          show: true,
          position: item.value > compareValue ? 'top' : 'bottom',
          formatter: (params) => {
            const change = item.change;
            if (change) {
              return [
                `${params.value}`,
                `{change|${change.isIncrease ? '↑' : '↓'}${change.value}}`
              ].join('\n');
            }
            return params.value;
          },
          rich: {
            change: {
              color: (params) => {
                const change = item.change;
                return change?.isIncrease ? '#ff4d4f' : '#52c41a';
              }
            }
          }
        }
      };
    });
  };

  const rightEyeData = processDataWithLabels(chartData.value.rightEyeData, chartData.value.leftEyeData);
  const leftEyeData = processDataWithLabels(chartData.value.leftEyeData, chartData.value.rightEyeData);
  const rightEyeVaecData = selectedChartType.value === 'vision' ?
      processDataWithLabels(chartData.value.rightEyeVaecData, chartData.value.leftEyeVaecData) : [];
  const leftEyeVaecData = selectedChartType.value === 'vision' ?
      processDataWithLabels(chartData.value.leftEyeVaecData, chartData.value.rightEyeVaecData) : [];

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
            return `${param.seriesName}: ${data.formattedValue}`;
          }).join('<br/>');
        } else {
          result += params.map(param => {
            const data = param.data;
            return `${param.seriesName}: ${data.formattedValue}`;
          }).join('<br/>');
        }
        
        // 添加诊疗方案信息（只在眼轴长度图表中显示）
        if (selectedChartType.value === 'axial') {
          const currentRecord = props.examinationRecords.find(record => record.examination_date === date);
          if (currentRecord) {
            result += '<br/>';
            
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
    yAxis: {
      ...axialLengthOption.yAxis,
      min: yAxisMin,
      max: yAxisMax,
      name: getYAxisUnit(),
      nameLocation: 'end'
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
      }
    ]
  };

  try {
    chart.setOption(option);
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
    axial_ratio: 'right_axial_ratio', // 如无可删
    critical_point: 'right_critical_point', // 如无可删
    cct: 'right_cct',
    acd: 'right_anterior_chamber_depth',
    lens_thickness: 'right_lens_thickness',
    vitreous_length: 'right_vitreous_space_thickness',
    choroid_thickness: 'right_oct_fovea',
    iop: 'right_intraocular_pressure',
    uva: 'uva_right_vision',
    vaec: 'vaec_right_old_vision'
  },
  left: {
    axial_length: 'left_eye_axial_length',
    k1: 'left_eye_k1',
    k2: 'left_eye_k2',
    axial_ratio: 'left_axial_ratio', // 如无可删
    critical_point: 'left_critical_point', // 如无可删
    cct: 'left_cct',
    acd: 'left_anterior_chamber_depth',
    lens_thickness: 'left_lens_thickness',
    vitreous_length: 'left_vitreous_space_thickness',
    choroid_thickness: 'left_oct_fovea',
    iop: 'left_intraocular_pressure',
    uva: 'uva_left_vision',
    vaec: 'vaec_left_old_vision'
  }
};
</script>

<style scoped lang="scss">
.routine-exam {
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
  width: 436px;
  height: 37px;
  border-radius: 18px;
  border: 1px solid #F4BB22;
  display: flex;
  margin: 0 auto 16px;


  .signal-sub-tabs-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 400;
    font-size: 16px;
    color: #000714;
    line-height: 40px;
    position: relative;
  }

  .signal-sub-tabs-item.active {
    color: #ffffff;
    font-weight: 500;
    background: #F4BB22;
  }

  .signal-sub-tabs-item.active:after{
    display: none;
  }

  .signal-sub-tabs-item:after{
    content: '';
    position: absolute;
    right: -4px;
    width: 4px;
    height: 20px;
    background: #F4BB22;
    box-shadow: inset 1px 0 0px 0px #F4BB22;
  }

  .signal-sub-tabs-item:first-child {
    border-radius: 18px 0 0 18px;
  }

  .signal-sub-tabs-item:last-child {
    border-radius: 0 18px 18px 0;
  }

  .signal-sub-tabs-item:last-child:after{
    display: none;
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
:deep(.exam-table2){

  .ant-table-thead tr th:first-child{
    background: #fcf1ec;
  }

  .ant-table-tbody tr td:first-child {
    background: #fcf1ec;
  }
}
</style>
