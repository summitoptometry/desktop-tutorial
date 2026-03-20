<template>
  <Transition name="slide-up">
    <div v-if="visible" class="chart-panel">
      <div class="chart-panel-header">
        <div class="chart-title-section">
          <h3 class="chart-title">{{ chartTitle }}</h3>
          <div v-if="chartType === 'axial' && selectedBaseDate" class="base-date-info">
            <span class="base-date-text">基准日期: {{ selectedBaseDate }}</span>
            <a-button type="link" size="small" @click="clearBaseDate" class="clear-base-date-btn">
              清除
            </a-button>
          </div>
        </div>
        <a-button type="text" class="close-btn" @click="handleClose">
          <template #icon>
            <CloseOutlined />
          </template>
        </a-button>
      </div>
      <div class="chart-panel-body">
        <!-- 图表类型切换（独立按钮） -->
        <div class="chart-options">
          <a-button 
            v-for="tab in chartOptions" 
            :key="tab.key" 
            :type="chartType === tab.key ? 'primary' : 'default'"
            class="chart-option-btn"
            @click="handleChartTypeChange(tab.key)"
          >
            {{ tab.title }}
          </a-button>
        </div>
        
        <!-- 柱状图/折线图切换（仅屈光度图显示） -->
        <div v-if="chartType === 'refraction'" class="chart-type-options">
          <div 
            :class="['chart-type-item', { active: selectedChartStyle === style.key }]" 
            v-for="style in chartStyleOptions" 
            :key="style.key" 
            @click="selectedChartStyle = style.key"
          >
            {{ style.title }}
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
        <div v-show="!noValidData" ref="chartRef" class="chart"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { CloseOutlined } from '@ant-design/icons-vue';
import { initChart, axialLengthOption } from '@/utils/echarts';
import dayjs from 'dayjs';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  chartType: {
    type: String,
    default: 'axial'
  },
  examinationRecords: {
    type: Array,
    default: () => []
  },
  currentRecord: {
    type: Object,
    default: () => ({})
  }
});

// 添加调试日志
console.log('[ChartModalStyleTwo] 组件被创建, visible:', props.visible, 'chartType:', props.chartType);

const emit = defineEmits(['update:visible', 'close', 'chart-type-change']);

const chartOptions = [
  { key: 'axial', title: '眼轴' },
  { key: 'refraction', title: '屈光度' },
  { key: 'vision', title: '视力' },
  { key: 'choroid', title: '脉络膜厚度' },
  { key: 'height_weight', title: '身高' }
];

const handleChartTypeChange = (type) => {
  emit('chart-type-change', type);
};

const chartRef = ref(null);
let chart = null;
const noValidData = ref(false);
const selectedBaseDate = ref(null); // 选中的基准日期（用于计算变化量）
const selectedChartStyle = ref('bar'); // 图表样式：柱状图或折线图（仅用于屈光度图）

// 图表样式选项（仅用于屈光度图）
const chartStyleOptions = [
  {
    key: 'bar',
    title: '柱状图'
  },
  {
    key: 'line',
    title: '折线图'
  }
];

const chartTitle = computed(() => {
  const titles = {
    axial: '眼轴长度趋势图',
    refraction: '屈光度趋势图',
    vision: '视力趋势图',
    choroid: '脉络膜厚度趋势图',
    height_weight: '身高趋势图'
  };
  return titles[props.chartType] || '趋势图';
});

const handleClose = () => {
  emit('update:visible', false);
  emit('close');
};

// 清除基准日期
const clearBaseDate = () => {
  selectedBaseDate.value = null;
  if (chart && props.visible) {
    nextTick(() => {
      updateChart();
    });
  }
};

// 格式化视力值
const formatVisionValue = (value) => {
  const num = Number(value);
  if (Number.isInteger(num)) {
    return num.toFixed(1);
  }
  return num.toString();
};

// 有效性判断函数（保留0，过滤空、null、NaN、N/A等）
function isValidNumber(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === '' || s === 'n/a' || s === 'na') return false;
  }
  const num = Number(val);
  return !isNaN(num);
}

// 计算图表数据
const chartData = computed(() => {
  console.log('[ChartModalStyleTwo] chartData computed 被调用, currentRecord:', props.currentRecord, 'examinationRecords.length:', props.examinationRecords.length);
  
  if (!props.currentRecord || !props.examinationRecords.length) {
    console.log('[ChartModalStyleTwo] 数据不足，设置 noValidData = true');
    noValidData.value = true;
    return null;
  }

  // 获取所有检查记录并按日期排序
  const sortedRecords = [...props.examinationRecords].sort((a, b) =>
    new Date(a.examination_date) - new Date(b.examination_date)
  );

  // 屈光度图：先过滤有效记录（完全按照风格1的方式）
  if (props.chartType === 'refraction') {
    const validRecords = sortedRecords.filter(record => {
      return (
        isValidNumber(record.subjective_right_spherical) ||
        isValidNumber(record.subjective_right_cylindrical) ||
        isValidNumber(record.subjective_left_spherical) ||
        isValidNumber(record.subjective_left_cylindrical)
      );
    });

    if (validRecords.length === 0) {
      noValidData.value = true;
      return null;
    }
    noValidData.value = false;

    // 日期直接使用 examination_date（不格式化，与风格1一致）
    const dates = validRecords.map(record => {
      // 格式化日期：将 YYYY-MM-DD 转换为 YYMMDD 格式（如 240101），与其他图表保持一致
      const dateStr = record.examination_date ? dayjs(record.examination_date).format('YYYY-MM-DD') : '';
      return dateStr.replace(/-/g, '').slice(2);
    });
    const rightSpherical = validRecords.map(record => isValidNumber(record.subjective_right_spherical) ? Number(record.subjective_right_spherical) : null);
    const rightCylindrical = validRecords.map(record => isValidNumber(record.subjective_right_cylindrical) ? Number(record.subjective_right_cylindrical) : null);
    const leftSpherical = validRecords.map(record => isValidNumber(record.subjective_left_spherical) ? Number(record.subjective_left_spherical) : null);
    const leftCylindrical = validRecords.map(record => isValidNumber(record.subjective_left_cylindrical) ? Number(record.subjective_left_cylindrical) : null);
    
    // 计算等效光度 (球镜 + 1/2柱镜)
    const rightEquivalent = rightSpherical.map((spherical, index) => {
      const cylindrical = rightCylindrical[index];
      if (spherical !== null && cylindrical !== null) {
        return spherical + (cylindrical / 2);
      }
      return null;
    });
    
    const leftEquivalent = leftSpherical.map((spherical, index) => {
      const cylindrical = leftCylindrical[index];
      if (spherical !== null && cylindrical !== null) {
        return spherical + (cylindrical / 2);
      }
      return null;
    });

    return {
      dates,
      rightSpherical,
      leftSpherical,
      rightCylindrical,
      leftCylindrical,
      rightEquivalent,
      leftEquivalent,
      rightEyeData: [],
      leftEyeData: [],
      rightEyeVaecData: [],
      leftEyeVaecData: [],
      heightData: [],
      weightData: []
    };
  }

  // 其他图表类型的处理
  const dates = [];
  const rightEyeData = [];
  const leftEyeData = [];
  const rightEyeVaecData = [];
  const leftEyeVaecData = [];
  const heightData = [];
  const weightData = [];

  console.log('[ChartModalStyleTwo] 开始处理记录，chartType:', props.chartType, 'sortedRecords数量:', sortedRecords.length);
  
  sortedRecords.forEach((record, index) => {
    let rightValue = null, leftValue = null;
    let rightVaecValue = null, leftVaecValue = null;
    let heightValue = null, weightValue = null;
    
    if (props.chartType === 'axial') {
      const r = Number(record.right_eye_axial_length);
      const l = Number(record.left_eye_axial_length);
      rightValue = (!isNaN(r) && r !== 0 && r !== null) ? r : null;
      leftValue = (!isNaN(l) && l !== 0 && l !== null) ? l : null;
      if (index === 0) {
        console.log('[ChartModalStyleTwo] 第一条记录眼轴数据, right:', r, 'left:', l, 'rightValue:', rightValue, 'leftValue:', leftValue);
      }
    } else if (props.chartType === 'choroid') {
      const r = Number(record.right_oct_fovea);
      const l = Number(record.left_oct_fovea);
      rightValue = (!isNaN(r) && r !== 0 && r !== null) ? r : null;
      leftValue = (!isNaN(l) && l !== 0 && l !== null) ? l : null;
    } else if (props.chartType === 'vision') {
      const rUva = Number(record.uva_right_vision);
      const lUva = Number(record.uva_left_vision);
      rightValue = (!isNaN(rUva) && rUva !== 0 && rUva !== null) ? rUva : null;
      leftValue = (!isNaN(lUva) && lUva !== 0 && lUva !== null) ? lUva : null;
      const rVaec = Number(record.vaec_right_old_vision);
      const lVaec = Number(record.vaec_left_old_vision);
      rightVaecValue = (!isNaN(rVaec) && rVaec !== 0 && rVaec !== null) ? rVaec : null;
      leftVaecValue = (!isNaN(lVaec) && lVaec !== 0 && lVaec !== null) ? lVaec : null;
    } else if (props.chartType === 'height_weight') {
      const height = Number(record.height);
      rightValue = (!isNaN(height) && height !== 0 && height !== null) ? height : null;
      leftValue = null; // 不再收集体重数据
    } else if (props.chartType === 'refraction') {
      // 屈光度图：使用主觉验光的球镜和柱镜数据
      const rSph = Number(record.subjective_right_spherical);
      const lSph = Number(record.subjective_left_spherical);
      const rCyl = Number(record.subjective_right_cylindrical);
      const lCyl = Number(record.subjective_left_cylindrical);
      
      // 计算等效光度：球镜 + 柱镜/2
      const rEq = (!isNaN(rSph) && rSph !== null && !isNaN(rCyl) && rCyl !== null) 
        ? rSph + rCyl / 2 : null;
      const lEq = (!isNaN(lSph) && lSph !== null && !isNaN(lCyl) && lCyl !== null) 
        ? lSph + lCyl / 2 : null;
      
      rightSpherical.push(!isNaN(rSph) && rSph !== null && rSph !== '' ? rSph : null);
      leftSpherical.push(!isNaN(lSph) && lSph !== null && lSph !== '' ? lSph : null);
      rightCylindrical.push(!isNaN(rCyl) && rCyl !== null && rCyl !== '' ? rCyl : null);
      leftCylindrical.push(!isNaN(lCyl) && lCyl !== null && lCyl !== '' ? lCyl : null);
      rightEquivalent.push(rEq);
      leftEquivalent.push(lEq);
      
      // 用于判断是否有有效数据
      rightValue = (!isNaN(rSph) && rSph !== null && rSph !== '') ? rSph : null;
      leftValue = (!isNaN(lSph) && lSph !== null && lSph !== '') ? lSph : null;
    }

    const hasValid = props.chartType === 'refraction' 
      ? (rightSpherical.length > 0 && rightSpherical[rightSpherical.length - 1] !== null) || 
        (leftSpherical.length > 0 && leftSpherical[leftSpherical.length - 1] !== null) ||
        (rightCylindrical.length > 0 && rightCylindrical[rightCylindrical.length - 1] !== null) ||
        (leftCylindrical.length > 0 && leftCylindrical[leftCylindrical.length - 1] !== null)
      : [rightValue, leftValue, rightVaecValue, leftVaecValue, heightValue].some(v => v !== null);
    
    // 对于屈光度图，需要确保数据被正确收集
    if (props.chartType === 'refraction' && !hasValid) {
      // 如果当前记录没有有效数据，但数组已经有数据，继续处理
      if (rightSpherical.length > 0 || leftSpherical.length > 0) {
        // 继续处理，即使当前记录无效
      }
    }
    if (hasValid) {
      // 格式化日期：将 YYYY-MM-DD 转换为 YYMMDD 格式（如 240101）
      const dateStr = record.examination_date ? dayjs(record.examination_date).format('YYYY-MM-DD') : '';
      const formattedDate = dateStr.replace(/-/g, '').slice(2);
      dates.push(formattedDate);
      if (index < 3) {
        console.log('[ChartModalStyleTwo] 添加日期:', formattedDate, '原始日期:', record.examination_date);
      }
      
      if (props.chartType === 'vision') {
        rightEyeData.push({
          value: rightValue,
          formattedValue: rightValue !== null ? formatVisionValue(rightValue) : '-'
        });
        leftEyeData.push({
          value: leftValue,
          formattedValue: leftValue !== null ? formatVisionValue(leftValue) : '-'
        });
        rightEyeVaecData.push({
          value: rightVaecValue,
          formattedValue: rightVaecValue !== null ? formatVisionValue(rightVaecValue) : '-'
        });
        leftEyeVaecData.push({
          value: leftVaecValue,
          formattedValue: leftVaecValue !== null ? formatVisionValue(leftVaecValue) : '-'
        });
      } else {
        const formatValueForChart = (value) => {
          if (value === null || value === undefined || value === '') return '-';
          const num = Number(value);
          if (isNaN(num)) return '-';
          if (props.chartType === 'axial') {
            return num.toFixed(2);
          }
          if (props.chartType === 'choroid') {
            return num.toFixed(1);
          }
          if (props.chartType === 'height_weight') {
            return num.toFixed(1);
          }
          return num.toString();
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
    weightData,
    rightSpherical: props.chartType === 'refraction' ? rightSpherical : [],
    leftSpherical: props.chartType === 'refraction' ? leftSpherical : [],
    rightCylindrical: props.chartType === 'refraction' ? rightCylindrical : [],
    leftCylindrical: props.chartType === 'refraction' ? leftCylindrical : [],
    rightEquivalent: props.chartType === 'refraction' ? rightEquivalent : [],
    leftEquivalent: props.chartType === 'refraction' ? leftEquivalent : []
  };
});

// 获取Y轴单位
const getYAxisUnit = () => {
  switch (props.chartType) {
    case 'axial':
      return 'mm';
    case 'iop':
      return 'mmHg';
    case 'vision':
      return '';
    case 'choroid':
      return 'μm';
    case 'height_weight':
      return 'cm/kg';
    default:
      return 'mm';
  }
};

// 初始化图表
const initChartInstance = () => {
  if (!chartRef.value) {
    console.log('[ChartModalStyleTwo] chartRef.value 为空');
    return;
  }
  
  console.log('[ChartModalStyleTwo] 开始初始化图表, chartData:', chartData.value, 'noValidData:', noValidData.value);
  
  // 确保DOM元素已经渲染（参考风格1使用setTimeout）
  setTimeout(() => {
    if (chartRef.value) {
      console.log('[ChartModalStyleTwo] DOM已准备好，开始创建图表实例');
      chart = initChart(chartRef.value);
      if (chart) {
        console.log('[ChartModalStyleTwo] 图表实例创建成功，开始更新图表');
        updateChart();
      } else {
        console.error('[ChartModalStyleTwo] 图表实例创建失败');
      }
    } else {
      console.error('[ChartModalStyleTwo] chartRef.value 在setTimeout后仍为空');
    }
  }, 100);
};

// 计算动态字体大小（根据图表容器大小）
const getDynamicFontSize = (baseSize = 14) => {
  if (!chartRef.value) return baseSize;
  const containerWidth = chartRef.value.clientWidth || 1200; // 默认1200px
  // 根据容器宽度计算字体大小，最小12px，最大24px（增大最大字体限制）
  // 基准：1200px宽度对应baseSize字体
  const fontSize = Math.max(12, Math.min(24, Math.round((containerWidth / 1200) * baseSize)));
  return fontSize;
};

// 更新图表（完全按照风格1的方式）
const updateChart = () => {
  console.log('[ChartModalStyleTwo] updateChart 被调用, noValidData:', noValidData.value, 'chartData:', chartData.value);
  
  if (noValidData.value) {
    console.log('[ChartModalStyleTwo] 无有效数据，清理图表');
    if (chart) {
      chart.dispose();
      chart = null;
    }
    return;
  }
  if (!chartRef.value || !chartData.value) {
    console.log('[ChartModalStyleTwo] chartRef或chartData为空，返回');
    return;
  }
  
  console.log('[ChartModalStyleTwo] 开始更新图表，dates数量:', chartData.value.dates.length);
  
  // 计算动态字体大小
  const baseFontSize = getDynamicFontSize(18); // 增大数据标签字体大小：从14改为18
  const labelFontSize = getDynamicFontSize(16); // 增大差值标签字体大小：从13改为16
  const axisFontSize = getDynamicFontSize(14);
  
  // 每次更新都先dispose旧的chart，然后重新init
  if (chart) {
    chart.dispose();
    chart = null;
  }
  chart = initChart(chartRef.value);
  
  if (!chart) {
    console.error('[ChartModalStyleTwo] 图表实例创建失败');
    return;
  }
  
  // 计算Y轴范围
  let yAxisMax, yAxisMin;
  
  if (props.chartType === 'height_weight') {
    const heightValues = chartData.value.rightEyeData.map(item => item.value).filter(v => v !== null);
    const heightMax = heightValues.length > 0 ? Math.max(...heightValues) : 180;
    const heightMin = heightValues.length > 0 ? Math.min(...heightValues) : 100;
    yAxisMax = heightMax * 1.1;
    yAxisMin = heightMin * 0.9;
  } else if (props.chartType === 'refraction') {
    // 屈光度图：计算所有球镜、柱镜、等效光度的最大值和最小值
    const allValues = [
      ...(chartData.value.rightSpherical || []).filter(v => v !== null && v !== undefined),
      ...(chartData.value.leftSpherical || []).filter(v => v !== null && v !== undefined),
      ...(chartData.value.rightCylindrical || []).filter(v => v !== null && v !== undefined),
      ...(chartData.value.leftCylindrical || []).filter(v => v !== null && v !== undefined),
      ...(chartData.value.rightEquivalent || []).filter(v => v !== null && v !== undefined),
      ...(chartData.value.leftEquivalent || []).filter(v => v !== null && v !== undefined)
    ];
    
    if (allValues.length === 0) return;
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    yAxisMax = maxValue + 0.5;  // 留出一些空间
    yAxisMin = minValue - 0.5;  // 留出一些空间
  } else {
    const allValues = props.chartType === 'vision' ? [
      ...chartData.value.rightEyeData.map(item => item.value),
      ...chartData.value.leftEyeData.map(item => item.value),
      ...chartData.value.rightEyeVaecData.map(item => item.value),
      ...chartData.value.leftEyeVaecData.map(item => item.value)
    ] : [
      ...chartData.value.rightEyeData.map(item => item.value),
      ...chartData.value.leftEyeData.map(item => item.value)
    ].filter(v => v !== null && v !== undefined);
    
    if (allValues.length === 0) return;
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    yAxisMax = Math.round((maxValue + 0.05) * 100) / 100;
    yAxisMin = Math.round((minValue - 0.05) * 100) / 100;
  }
  
  // 处理数据，添加变化量计算（仅眼轴图且选中基准日期时）
  const processDataWithLabels = (data, eye = 'right', compareData = null) => {
    return data.map((item, index) => {
      let baseDateChange = null;
      
      // 计算相对于选中基准日期的变化量（仅在眼轴图表中）
      if (props.chartType === 'axial' && selectedBaseDate.value) {
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
      
      const result = {
        ...item,
        baseDateChange
      };
      
      // 在眼轴图表中，为每个数据点添加label配置（包括position）
      if (props.chartType === 'axial' && compareData) {
        const currentValue = item.value;
        const compareValue = compareData[index]?.value;
        
        // 计算标签位置：数值高的在上方，数值低的在下方
        let labelPosition = 'top'; // 默认在上方
        if (currentValue !== null && currentValue !== undefined && 
            compareValue !== null && compareValue !== undefined) {
          labelPosition = currentValue >= compareValue ? 'top' : 'bottom';
        }
        
        result.label = {
          position: labelPosition
        };
      }
      
      return result;
    });
  };
  
  const rightEyeDataProcessed = props.chartType === 'axial' 
    ? processDataWithLabels(chartData.value.rightEyeData, 'right', chartData.value.leftEyeData)
    : processDataWithLabels(chartData.value.rightEyeData, 'right');
  const leftEyeDataProcessed = props.chartType === 'axial'
    ? processDataWithLabels(chartData.value.leftEyeData, 'left', chartData.value.rightEyeData)
    : processDataWithLabels(chartData.value.leftEyeData, 'left');
  
  // 屈光度图：为每条系列的数据点计算标签位置（与眼轴图一致：数值高的在上方，低的在下方，避免重叠）
  const processRefractionSeriesWithLabelPosition = (rightArr, leftArr) => {
    const rightProcessed = (rightArr || []).map((val, i) => {
      const leftVal = leftArr && leftArr[i] != null && !isNaN(leftArr[i]) ? leftArr[i] : null;
      const numRight = val != null && !isNaN(val) ? Number(val) : null;
      let position = 'top';
      if (numRight !== null && leftVal !== null) {
        position = numRight >= leftVal ? 'top' : 'bottom';
      }
      return { value: val, label: { position } };
    });
    const leftProcessed = (leftArr || []).map((val, i) => {
      const rightVal = rightArr && rightArr[i] != null && !isNaN(rightArr[i]) ? rightArr[i] : null;
      const numLeft = val != null && !isNaN(val) ? Number(val) : null;
      let position = 'top';
      if (numLeft !== null && rightVal !== null) {
        position = numLeft >= rightVal ? 'top' : 'bottom';
      }
      return { value: val, label: { position } };
    });
    return [rightProcessed, leftProcessed];
  };
  const [rightSphericalProcessed, leftSphericalProcessed] = props.chartType === 'refraction'
    ? processRefractionSeriesWithLabelPosition(chartData.value.rightSpherical, chartData.value.leftSpherical)
    : [[], []];
  const [rightCylindricalProcessed, leftCylindricalProcessed] = props.chartType === 'refraction'
    ? processRefractionSeriesWithLabelPosition(chartData.value.rightCylindrical, chartData.value.leftCylindrical)
    : [[], []];
  const [rightEquivalentProcessed, leftEquivalentProcessed] = props.chartType === 'refraction'
    ? processRefractionSeriesWithLabelPosition(chartData.value.rightEquivalent, chartData.value.leftEquivalent)
    : [[], []];
  
  // 计算平均眼轴长度（仅用于眼轴图表）
  let rightAvgAxialLength = null;
  let leftAvgAxialLength = null;
  
  if (props.chartType === 'axial') {
    const rightValues = chartData.value.rightEyeData.map(item => item.value).filter(val => val !== null && val !== undefined);
    const leftValues = chartData.value.leftEyeData.map(item => item.value).filter(val => val !== null && val !== undefined);
    
    if (rightValues.length > 0) {
      rightAvgAxialLength = rightValues.reduce((sum, val) => sum + val, 0) / rightValues.length;
    }
    if (leftValues.length > 0) {
      leftAvgAxialLength = leftValues.reduce((sum, val) => sum + val, 0) / leftValues.length;
    }
  }
  
  // 构建图表配置（使用axialLengthOption作为基础）
  const option = {
    ...(props.chartType === 'refraction' ? {} : axialLengthOption),  // 屈光度图不使用 axialLengthOption
    color: props.chartType === 'refraction' ? ['#ff4d4f', '#ff7875', '#ff9c6e', '#1890ff', '#40a9ff', '#69c0ff'] : undefined,
    title: {
      text: '',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#d9d9d9',
      borderWidth: 1,
      textStyle: {
        color: '#000000',
        fontSize: baseFontSize,
        fontWeight: 'normal'
      },
      axisPointer: props.chartType === 'refraction' ? {
        type: selectedChartStyle.value === 'bar' ? 'shadow' : 'line'  // 柱状图用shadow，折线图用line
      } : undefined,
      formatter: (params) => {
        const date = params[0].axisValue;
        let result = `${date}<br/>`;
        if (props.chartType === 'refraction') {
          // 屈光度图的tooltip格式（完全按照风格1）
          params.forEach(param => {
            if (param.value !== null && param.value !== undefined && !isNaN(param.value)) {
              result += `${param.seriesName}: ${param.value.toFixed(2)}D<br/>`;
            }
          });
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
        if (props.chartType === 'axial') {
          result += '<br/>';
          if (rightAvgAxialLength) {
            result += `<span style="color: #000000;">右眼平均:</span> ${rightAvgAxialLength.toFixed(2)}mm<br/>`;
          }
          if (leftAvgAxialLength) {
            result += `<span style="color: #000000;">左眼平均:</span> ${leftAvgAxialLength.toFixed(2)}mm<br/>`;
          }
          
          // 添加诊疗方案信息
          const currentRecord = props.examinationRecords.find(record => {
            const recordDate = record.examination_date ? dayjs(record.examination_date).format('YYYY-MM-DD').replace(/-/g, '').slice(2) : '';
            return recordDate === date;
          });
          if (currentRecord) {
            // 格式化诊疗方案（tooltip 中显示详情：配镜显示类型+品牌，低强度红光显示档位等）
            const formatTreatmentPlan = (record, eye) => {
              const treatments = [];
              const atropine = record[`${eye}_atropine`];
              const glasses = record[`${eye}_glasses`];
              const glassesPP = record[`${eye}_glasses_pp`];
              const hg = record[`${eye}_hg`];
              const hgDW = record[`${eye}_hg_dw`];
              const ok = record[`${eye}_ok`];
              const visualTraining = record[`${eye}_visual_training`];
              const physiotherapy = record[`${eye}_physiotherapy`];
              
              if (atropine && atropine !== 'none' && atropine !== '否') {
                treatments.push(`阿托品: ${atropine}`);
              }
              if (glasses && glasses !== 'none' && glasses !== '否') {
                const glassesText = glassesPP && glassesPP !== 'none' && glassesPP !== '否'
                  ? `配镜: ${glasses}(${glassesPP})`
                  : `配镜: ${glasses}`;
                treatments.push(glassesText);
              }
              if (hg && hg !== 'none' && hg !== '否') {
                const hgText = hgDW ? `低强度红光: ${hg}(档位${hgDW})` : `低强度红光: ${hg}`;
                treatments.push(hgText);
              }
              if (ok && ok !== 'none' && ok !== '否') {
                treatments.push(`OK镜: ${ok}`);
              }
              if (visualTraining && visualTraining !== 'none' && visualTraining !== '否') {
                treatments.push('视训: 是');
              }
              if (physiotherapy && physiotherapy !== 'none' && physiotherapy !== '否') {
                treatments.push('理疗: 是');
              }
              
              return treatments.length > 0 ? treatments.join('、') : null;
            };
            
            const rightTreatment = formatTreatmentPlan(currentRecord, 'right');
            if (rightTreatment) {
              result += `<span style="color: #000000;">右眼方案:</span> ${rightTreatment}<br/>`;
            }
            
            const leftTreatment = formatTreatmentPlan(currentRecord, 'left');
            if (leftTreatment) {
              result += `<span style="color: #000000;">左眼方案:</span> ${leftTreatment}`;
            }
          }
        }
        
        return result;
      }
    },
    legend: {
      data: props.chartType === 'vision' ?
        ['右眼裸眼视力', '左眼裸眼视力', '右眼旧镜视力', '左眼旧镜视力'] :
        props.chartType === 'axial' ?
          ['右眼', '左眼', ...(rightAvgAxialLength ? ['右眼平均'] : []), ...(leftAvgAxialLength ? ['左眼平均'] : [])] :
        props.chartType === 'height_weight' ?
          ['身高', '体重'] :
        props.chartType === 'refraction' ?
          ['右眼球镜', '右眼柱镜', '右眼等效光度', '左眼球镜', '左眼柱镜', '左眼等效光度'] :
          ['右眼', '左眼'],
      top: props.chartType === 'refraction' ? 30 : 10,
      textStyle: {
        fontSize: 16,
        color: '#000000',
        fontWeight: 'normal'
      },
      selected: props.chartType === 'refraction' ? (selectedChartStyle.value === 'line' ? {
        '右眼球镜': false,
        '右眼柱镜': false,
        '右眼等效光度': true,
        '左眼球镜': false,
        '左眼柱镜': false,
        '左眼等效光度': true
      } : {
        '右眼球镜': true,
        '右眼柱镜': true,
        '右眼等效光度': true,
        '左眼球镜': true,
        '左眼柱镜': true,
        '左眼等效光度': true
      }) : undefined
    },
    grid: {
      left: '5%',
      right: props.chartType === 'axial' ? '15%' : '5%', // 眼轴图需要右侧空间显示平均线标签
      bottom: '5%',
      top: '10%',
      containLabel: true
    },
    xAxis: props.chartType === 'refraction' ? {
      type: 'category',
      data: chartData.value.dates,
      axisLabel: {
        rotate: 45,
        fontSize: axisFontSize,
        color: '#000000',
        fontWeight: 'normal'
      },
      nameTextStyle: {
        fontSize: axisFontSize,
        color: '#000000',
        fontWeight: 'normal'
      }
    } : {
      ...axialLengthOption.xAxis,
      data: chartData.value.dates,
      boundaryGap: true,
      axisLabel: {
        margin: 16,
        fontSize: axisFontSize,
        color: '#000000',
        fontWeight: 'normal'
      },
      nameTextStyle: {
        fontSize: axisFontSize,
        color: '#000000',
        fontWeight: 'normal'
      }
    },
    yAxis: props.chartType === 'height_weight' ? [
      {
        type: 'value',
        name: '身高(cm)',
        position: 'left',
        min: yAxisMin,
        max: yAxisMax,
        nameLocation: 'end',
        axisLabel: {
          formatter: (value) => {
            return value.toFixed(1) + ' cm';
          },
          fontSize: axisFontSize,
          color: '#000000',
          fontWeight: 'normal'
        },
        nameTextStyle: {
          fontSize: axisFontSize,
          color: '#000000',
          fontWeight: 'normal'
        }
      }
    ] : props.chartType === 'refraction' ? {
      type: 'value',
      name: '屈光度(D)',
      nameLocation: 'end',
      min: yAxisMin,
      max: yAxisMax,
      inverse: true,  // 反转Y轴，使负值在上方
      axisLabel: {
        formatter: (value) => value.toFixed(2),
        fontSize: axisFontSize,
        color: '#000000',
        fontWeight: 'normal'
      },
      nameTextStyle: {
        fontSize: axisFontSize,
        color: '#000000',
        fontWeight: 'normal'
      }
    } : {
      ...axialLengthOption.yAxis,
      min: yAxisMin,
      max: yAxisMax,
      name: getYAxisUnit(),
      nameLocation: 'end',
      axisLabel: {
        formatter: (value) => {
          if (props.chartType === 'axial') {
            return value.toFixed(2);
          }
          if (props.chartType === 'choroid') {
            return value.toFixed(1);
          }
          return value.toFixed(2);
        },
        fontSize: axisFontSize,
        color: '#000000',
        fontWeight: 'normal'
      },
      nameTextStyle: {
        fontSize: axisFontSize,
        color: '#000000',
        fontWeight: 'normal'
      }
    },
    series: props.chartType === 'vision' ? [
      {
        name: '右眼裸眼视力',
        type: 'line',
        data: chartData.value.rightEyeData,
        itemStyle: { color: '#ff4d4f' },
        lineStyle: { color: '#ff4d4f' },
        label: {
          show: true,
          formatter: (params) => params.data.formattedValue,
          position: 'top',
          fontSize: baseFontSize,
          color: '#000000',
          fontWeight: 'normal',
          distance: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 6]
        }
      },
      {
        name: '左眼裸眼视力',
        type: 'line',
        data: chartData.value.leftEyeData,
        itemStyle: { color: '#1890ff' },
        lineStyle: { color: '#1890ff' },
        label: {
          show: true,
          formatter: (params) => params.data.formattedValue,
          position: 'top',
          fontSize: baseFontSize,
          color: '#000000',
          fontWeight: 'normal',
          distance: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 6]
        }
      },
      {
        name: '右眼旧镜视力',
        type: 'line',
        data: chartData.value.rightEyeVaecData,
        itemStyle: { color: '#ff7a45' },
        lineStyle: { color: '#ff7a45', type: 'dashed' },
        label: {
          show: true,
          formatter: (params) => params.data.formattedValue,
          position: 'top',
          fontSize: baseFontSize,
          color: '#000000',
          fontWeight: 'normal',
          distance: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 6]
        }
      },
      {
        name: '左眼旧镜视力',
        type: 'line',
        data: chartData.value.leftEyeVaecData,
        itemStyle: { color: '#40a9ff' },
        lineStyle: { color: '#40a9ff', type: 'dashed' },
        label: {
          show: true,
          formatter: (params) => params.data.formattedValue,
          position: 'top',
          fontSize: baseFontSize,
          color: '#000000',
          fontWeight: 'normal',
          distance: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 6]
        }
      }
    ] : props.chartType === 'refraction' ? [
      {
        name: '右眼球镜',
        type: selectedChartStyle.value,
        data: rightSphericalProcessed,
        itemStyle: { color: '#ff4d4f' },
        lineStyle: { color: '#ff4d4f' },
        label: {
          show: true,
          formatter: (params) => {
            const v = params.data?.value ?? params.value;
            return v !== null && v !== undefined && !isNaN(v) ? Number(v).toFixed(2) + 'D' : '';
          },
          position: (params) => params.data?.label?.position ?? 'top',
          fontSize: baseFontSize,
          color: '#000000',
          fontWeight: 'normal',
          distance: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 6]
        }
      },
      {
        name: '右眼柱镜',
        type: selectedChartStyle.value,
        data: rightCylindricalProcessed,
        itemStyle: { color: '#ff7875' },
        lineStyle: { color: '#ff7875' },
        label: {
          show: true,
          formatter: (params) => {
            const v = params.data?.value ?? params.value;
            return v !== null && v !== undefined && !isNaN(v) ? Number(v).toFixed(2) + 'D' : '';
          },
          position: (params) => params.data?.label?.position ?? 'top',
          fontSize: baseFontSize,
          color: '#000000',
          fontWeight: 'normal',
          distance: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 6]
        }
      },
      {
        name: '右眼等效光度',
        type: selectedChartStyle.value,
        data: rightEquivalentProcessed,
        itemStyle: { color: '#ff9c6e' },
        lineStyle: { color: '#ff9c6e' },
        label: {
          show: true,
          formatter: (params) => {
            const v = params.data?.value ?? params.value;
            return v !== null && v !== undefined && !isNaN(v) ? Number(v).toFixed(2) + 'D' : '';
          },
          position: (params) => params.data?.label?.position ?? 'top',
          fontSize: baseFontSize,
          color: '#000000',
          fontWeight: 'normal',
          distance: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 6]
        }
      },
      {
        name: '左眼球镜',
        type: selectedChartStyle.value,
        data: leftSphericalProcessed,
        itemStyle: { color: '#1890ff' },
        lineStyle: { color: '#1890ff' },
        label: {
          show: true,
          formatter: (params) => {
            const v = params.data?.value ?? params.value;
            return v !== null && v !== undefined && !isNaN(v) ? Number(v).toFixed(2) + 'D' : '';
          },
          position: (params) => params.data?.label?.position ?? 'top',
          fontSize: baseFontSize,
          color: '#000000',
          fontWeight: 'normal',
          distance: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 6]
        }
      },
      {
        name: '左眼柱镜',
        type: selectedChartStyle.value,
        data: leftCylindricalProcessed,
        itemStyle: { color: '#40a9ff' },
        lineStyle: { color: '#40a9ff' },
        label: {
          show: true,
          formatter: (params) => {
            const v = params.data?.value ?? params.value;
            return v !== null && v !== undefined && !isNaN(v) ? Number(v).toFixed(2) + 'D' : '';
          },
          position: (params) => params.data?.label?.position ?? 'top',
          fontSize: baseFontSize,
          color: '#000000',
          fontWeight: 'normal',
          distance: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 6]
        }
      },
      {
        name: '左眼等效光度',
        type: selectedChartStyle.value,
        data: leftEquivalentProcessed,
        itemStyle: { color: '#69c0ff' },
        lineStyle: { color: '#69c0ff' },
        label: {
          show: true,
          formatter: (params) => {
            const v = params.data?.value ?? params.value;
            return v !== null && v !== undefined && !isNaN(v) ? Number(v).toFixed(2) + 'D' : '';
          },
          position: (params) => params.data?.label?.position ?? 'top',
          fontSize: baseFontSize,
          color: '#000000',
          fontWeight: 'normal',
          distance: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 6]
        }
      }
    ] : props.chartType === 'height_weight' ? [
      {
        name: '身高',
        type: 'line',
        yAxisIndex: 0,
        data: chartData.value.rightEyeData,
        itemStyle: { color: '#52c41a' },
        lineStyle: { color: '#52c41a', width: 3 },
        label: {
          show: true,
          formatter: (params) => params.data.formattedValue,
          position: 'top',
          fontSize: labelFontSize,
          distance: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 6]
        }
      },
    ] : [
      {
        name: '右眼',
        type: 'line',
        data: rightEyeDataProcessed,
        itemStyle: { color: '#ff4d4f' },
        lineStyle: { color: '#ff4d4f' },
        z: 1, // 设置较低的层级，确保标签在上层
        label: {
          show: true,
          formatter: (params) => {
            let result = params.data.formattedValue || '-';
            // 如果有相对于基准日期的变化量，显示变化量和箭头
            if (params.data.baseDateChange) {
              const arrow = params.data.baseDateChange.isIncrease ? '↑' : '↓';
              const colorStyle = params.data.baseDateChange.isIncrease ? 'changeIncrease' : 'changeDecrease';
              result += `\n{${colorStyle}|${arrow}${params.data.baseDateChange.value}}`;
            }
            return result;
          },
          position: 'top',
          fontSize: baseFontSize,
          color: '#000000',
          fontWeight: 'normal',
          distance: 10, // 增加标签与数据点的距离
          backgroundColor: 'rgba(255, 255, 255, 0.9)', // 添加半透明白色背景
          borderColor: 'rgba(0, 0, 0, 0.1)', // 添加边框
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 6], // 增加内边距，让标签更突出
          rich: {
            changeIncrease: {
          fontSize: labelFontSize,
          fontWeight: 'normal',
          color: '#ff4d4f'
            },
            changeDecrease: {
          fontSize: labelFontSize,
          fontWeight: 'normal',
          color: '#52c41a'
            }
          }
        }
      },
      {
        name: '左眼',
        type: 'line',
        data: leftEyeDataProcessed,
        itemStyle: { color: '#1890ff' },
        lineStyle: { color: '#1890ff' },
        z: 1, // 设置较低的层级，确保标签在上层
        label: {
          show: true,
          formatter: (params) => {
            let result = params.data.formattedValue || '-';
            // 如果有相对于基准日期的变化量，显示变化量和箭头
            if (params.data.baseDateChange) {
              const arrow = params.data.baseDateChange.isIncrease ? '↑' : '↓';
              const colorStyle = params.data.baseDateChange.isIncrease ? 'changeIncrease' : 'changeDecrease';
              result += `\n{${colorStyle}|${arrow}${params.data.baseDateChange.value}}`;
            }
            return result;
          },
          position: 'top',
          fontSize: baseFontSize,
          color: '#000000',
          fontWeight: 'normal',
          distance: 10, // 增加标签与数据点的距离
          backgroundColor: 'rgba(255, 255, 255, 0.9)', // 添加半透明白色背景
          borderColor: 'rgba(0, 0, 0, 0.1)', // 添加边框
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 6], // 增加内边距，让标签更突出
          rich: {
            changeIncrease: {
          fontSize: labelFontSize,
          fontWeight: 'normal',
          color: '#ff4d4f'
            },
            changeDecrease: {
          fontSize: labelFontSize,
          fontWeight: 'normal',
          color: '#52c41a'
            }
          }
        }
      },
      // 添加右眼平均眼轴长度横线（仅眼轴图表显示）
      ...(props.chartType === 'axial' && rightAvgAxialLength ? [{
        name: '右眼平均',
        type: 'line',
        data: chartData.value.dates.map(() => rightAvgAxialLength),
        lineStyle: { 
          color: '#ff4d4f', 
          type: 'dashed',
          width: 2
        },
        itemStyle: { color: '#ff4d4f' },
        // 使用函数形式，只在最后一个数据点显示symbol
        symbol: (value, params) => {
          return params.dataIndex === chartData.value.dates.length - 1 ? 'circle' : 'none';
        },
        symbolSize: (value, params) => {
          return params.dataIndex === chartData.value.dates.length - 1 ? 6 : 0;
        },
        legendHoverLink: true,
        label: {
          show: true,
          formatter: (params) => {
            // 只在最后一个数据点显示标签
            return params.dataIndex === chartData.value.dates.length - 1 ? 
              `右眼平均: ${rightAvgAxialLength.toFixed(2)}mm` : '';
          },
          position: 'right',
          distance: 30,
          fontSize: baseFontSize,
          fontWeight: 'normal',
          color: '#000000',
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
      ...(props.chartType === 'axial' && leftAvgAxialLength ? [{
        name: '左眼平均',
        type: 'line',
        data: chartData.value.dates.map(() => leftAvgAxialLength),
        lineStyle: { 
          color: '#1890ff', 
          type: 'dashed',
          width: 2
        },
        itemStyle: { color: '#1890ff' },
        // 使用函数形式，只在最后一个数据点显示symbol
        symbol: (value, params) => {
          return params.dataIndex === chartData.value.dates.length - 1 ? 'circle' : 'none';
        },
        symbolSize: (value, params) => {
          return params.dataIndex === chartData.value.dates.length - 1 ? 6 : 0;
        },
        legendHoverLink: true,
        label: {
          show: true,
          formatter: (params) => {
            // 只在最后一个数据点显示标签
            return params.dataIndex === chartData.value.dates.length - 1 ? 
              `左眼平均: ${leftAvgAxialLength.toFixed(2)}mm` : '';
          },
          position: 'right',
          distance: 30,
          fontSize: baseFontSize,
          fontWeight: 'normal',
          color: '#000000',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#1890ff',
          borderWidth: 1,
          borderRadius: 4,
          padding: [4, 8]
        },
        tooltip: {
          show: false
        }
      }] : [])
    ]
  };
  
  try {
    console.log('[ChartModalStyleTwo] 设置图表配置，series数量:', option.series.length);
    chart.setOption(option);
    console.log('[ChartModalStyleTwo] 图表配置设置成功');
    
    // 添加点击事件处理（仅眼轴图）
    if (props.chartType === 'axial') {
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
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('[ChartModalStyleTwo] 更新图表失败:', error);
  }
};

// 监听visible变化
watch(() => props.visible, (newVal) => {
  console.log('[ChartModalStyleTwo] visible变化:', newVal);
  if (newVal) {
    // 延迟初始化图表，确保DOM已经渲染完成（参考风格1）
    setTimeout(() => {
      initChartInstance();
    }, 100);
  } else {
    if (chart) {
      chart.dispose();
      chart = null;
    }
    // 关闭时清除基准日期
    selectedBaseDate.value = null;
  }
});

// 监听图表类型变化
watch(() => props.chartType, () => {
  // 切换到屈光度图时，重置图表样式为柱状图
  if (props.chartType === 'refraction') {
    selectedChartStyle.value = 'bar';
  }
  if (props.visible) {
    nextTick(() => {
      if (chart) {
        updateChart();
      } else {
        initChartInstance();
      }
    });
  }
});

// 监听图表样式变化（柱状图/折线图切换，仅用于屈光度图）
watch(selectedChartStyle, () => {
  if (props.visible && props.chartType === 'refraction') {
    nextTick(() => {
      if (chart) {
        updateChart();
      }
    });
  }
});

// 监听数据变化
watch(chartData, () => {
  if (props.visible) {
    nextTick(() => {
      if (chart) {
        updateChart();
      } else {
        initChartInstance();
      }
    });
  }
}, { deep: true });

// 监听visible和currentRecord变化，重新初始化
watch(() => [props.visible, props.currentRecord], () => {
  if (props.visible) {
    nextTick(() => {
      initChartInstance();
    });
  }
});

// 窗口大小变化时调整图表
const handleResize = () => {
  if (chart) {
    chart.resize();
  }
};

onMounted(() => {
  console.log('[ChartModalStyleTwo] onMounted 被调用, props.visible:', props.visible, 'props.chartType:', props.chartType);
  window.addEventListener('resize', handleResize);
  
  // 如果 visible 为 true，立即初始化图表
  if (props.visible) {
    setTimeout(() => {
      initChartInstance();
    }, 100);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (chart) {
    chart.dispose();
    chart = null;
  }
});
</script>

<style scoped lang="scss">
.chart-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  background: #ffffff;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.chart-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e6f5;
  flex-shrink: 0;
}

.chart-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.chart-title {
  font-size: 20px;
  font-weight: normal;
  color: #000000;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.base-date-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: #f0f5ff;
  border-radius: 4px;
}

.base-date-text {
  font-size: 13px;
  color: #224b96;
}

.clear-base-date-btn {
  padding: 0;
  height: auto;
  color: #ff4d4f;
  font-size: 12px;
  
  &:hover {
    color: #ff7875;
  }
}

.close-btn {
  color: #666;
  font-size: 18px;
  
  &:hover {
    color: #224b96;
  }
}

.chart-panel-body {
  flex: 1;
  padding: 24px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
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

.chart-type-options {
  width: 160px;
  height: 32px;
  border-radius: 16px;
  border: 1px solid #F4BB22;
  display: flex;
  margin: 0 auto 16px;
  background: #ffffff;

  .chart-type-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 400;
    font-size: 14px;
    color: #000714;
    line-height: 32px;
    position: relative;
    cursor: pointer;
    transition: all 0.3s;
  }

  .chart-type-item.active {
    color: #ffffff;
    font-weight: normal;
    background: #F4BB22;
  }

  .chart-type-item:first-child {
    border-radius: 16px 0 0 16px;
  }

  .chart-type-item:last-child {
    border-radius: 0 16px 16px 0;
  }

  .chart-type-item:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    width: 1px;
    height: 20px;
    background: #F4BB22;
  }

  .chart-type-item.active::after {
    display: none;
  }
}

.chart {
  width: 100%;
  max-width: 100%;
  height: 500px; /* 增大图表高度 */
  margin: 0 auto;
}

.no-data-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  width: 100%;
  max-width: 100%;
  height: 500px; /* 与图表容器高度保持一致 */
  margin: 0 auto;
}

.no-data-img {
  margin-bottom: 20px;
}

.no-data-title {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.no-data-desc {
  font-size: 14px;
  color: #999;
}

// 从下方滑入动画
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from {
  transform: translateX(-50%) translateY(100%);
}

.slide-up-enter-to {
  transform: translateX(-50%) translateY(0);
}

.slide-up-leave-from {
  transform: translateY(0);
}

.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
