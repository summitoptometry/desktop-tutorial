<template>
  <a-card :body-style="{ padding: '0' }" class="print-preview-card">
    <!-- 分页控制栏 -->
    <div class="pagination-controls" v-if="totalPages > 1">
      <a-space>
        <a-button @click="goToPage(Math.max(1, currentPage - 2))" :disabled="currentPage === 1" size="small">
          上一页
        </a-button>
        <span class="page-info">
          第 {{ currentPage }} / {{ totalPages }} 页
        </span>
        <a-button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" size="small">
          下一页
        </a-button>
      </a-space>
    </div>
    
    <div class="preview-container" ref="previewContainerRef">
      <div class="pages-wrapper" :style="pagesWrapperStyle">
        <div 
          v-for="pageIndex in visiblePages" 
          :key="pageIndex"
          class="a4-preview-box" 
          :class="{ 'page-view': totalPages > 1 }"
        >
          <div class="page-content-wrapper" :style="getPageStyle(pageIndex)">
            <!-- Logo水印 -->
            <img 
              v-if="logoUrl" 
              :src="logoUrl" 
              class="logo-watermark" 
              :crossorigin="logoUrl && logoUrl.startsWith('data:') ? 'anonymous' : undefined" 
              @error="handleLogoError" 
            />
            
            <div 
              :id="pageIndex === visiblePages[0] ? 'print-preview-area' : undefined"
              class="print-preview-area" 
              :ref="pageIndex === visiblePages[0] ? 'printAreaRef' : undefined"
            >
          <!-- 固定抬头区域 -->
          <div class="header-area-fixed">
            <img 
              v-if="logoUrl" 
              :src="logoUrl" 
              class="logo-fixed" 
              :style="logoStyle"
              :crossorigin="logoUrl && logoUrl.startsWith('data:') ? 'anonymous' : undefined" 
              @error="handleLogoError" 
            />
            <div v-if="orgName" class="orgname-fixed">
              {{ orgName }}
            </div>
          </div>
          
          <!-- 报告标题 -->
          <h2 class="report-title">检查报告</h2>
          
          <!-- 患者信息 -->
          <div class="patient-info-section" style="margin-bottom: 20px;">
            <div class="patient-info-row" style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span>姓名：{{ patientInfo.name }}</span>
                <span style="margin-left: 32px;">性别：{{ patientInfo.gender }}</span>
                <span style="margin-left: 32px;">出生日期：{{ patientInfo.birth_date ? formatDate(patientInfo.birth_date) : '-' }}</span>
              </div>
              <div>
                <span>检查日期：{{ formatDate(examinationDate) }}</span>
              </div>
            </div>
            <div class="patient-info-row" style="margin-top: 8px;">
              <span>患者编号：{{ patientInfo.patient_id }}</span>
              <span style="margin-left: 32px;">档案编号：{{ patientInfo.archive_id }}</span>
            </div>
          </div>
          
          <!-- 检查数据内容 -->
          <div class="examination-content" v-if="props.examinationData">
            <!-- 调试信息（开发时可见） -->
            <div v-if="!hasVisionData && !hasRefractionData && !hasAxialData && !hasBiometryData && !hasOtherData" 
                 style="padding: 20px; text-align: center; color: #999; border: 1px dashed #ddd; border-radius: 8px; margin: 20px 0;">
              <p>暂无检查数据</p>
              <p style="font-size: 12px; margin-top: 8px;">数据字段: {{ Object.keys(props.examinationData || {}).join(', ') }}</p>
            </div>
            <!-- 视力检查 -->
            <div v-if="hasVisionData" class="exam-section">
              <h3 class="section-title">视力检查</h3>
              <table class="exam-table">
                <thead>
                  <tr>
                    <th>项目</th>
                    <th>右眼</th>
                    <th>左眼</th>
                    <th>双眼</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="hasNakedVision && (getExamData('uva_right_vision') != null || getExamData('uva_left_vision') != null || getExamData('uva_both_vision') != null)">
                    <td class="exam-label">裸眼视力</td>
                    <td>{{ formatVision(getExamData('uva_right_vision')) }}</td>
                    <td>{{ formatVision(getExamData('uva_left_vision')) }}</td>
                    <td>{{ formatVision(getExamData('uva_both_vision')) }}</td>
                  </tr>
                  <tr v-if="hasCorrectedVision && (getExamData('vaec_right_old_vision') != null || getExamData('vaec_left_old_vision') != null || getExamData('vaec_both_old_vision') != null)">
                    <td class="exam-label">戴镜视力</td>
                    <td>{{ formatVision(getExamData('vaec_right_old_vision')) }}</td>
                    <td>{{ formatVision(getExamData('vaec_left_old_vision')) }}</td>
                    <td>{{ formatVision(getExamData('vaec_both_old_vision')) }}</td>
                  </tr>
                  <tr v-if="hasSubjectiveVision && (getExamData('subjective_right_old_vision') != null || getExamData('subjective_left_old_vision') != null || getExamData('subjective_both_old_vision') != null)">
                    <td class="exam-label">主觉验光视力</td>
                    <td>{{ formatVision(getExamData('subjective_right_old_vision')) }}</td>
                    <td>{{ formatVision(getExamData('subjective_left_old_vision')) }}</td>
                    <td>{{ formatVision(getExamData('subjective_both_old_vision')) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- 屈光检查 -->
            <div v-if="hasRefractionData" class="exam-section">
              <h3 class="section-title">屈光检查</h3>
              <table class="exam-table">
                <thead>
                  <tr>
                    <th>项目</th>
                    <th>右眼</th>
                    <th>左眼</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="hasOldGlasses && (getExamData('vaec_right_spherical') != null || getExamData('vaec_left_spherical') != null)">
                    <td class="exam-label">旧镜度数</td>
                    <td>{{ formatRefraction(
                      getExamData('vaec_right_spherical'),
                      getExamData('vaec_right_cylindrical'),
                      getExamData('vaec_right_axis')
                    ) }}</td>
                    <td>{{ formatRefraction(
                      getExamData('vaec_left_spherical'),
                      getExamData('vaec_left_cylindrical'),
                      getExamData('vaec_left_axis')
                    ) }}</td>
                  </tr>
                  <tr v-if="hasObjectiveRefraction && (getExamData('objective_right_spherical') != null || getExamData('objective_left_spherical') != null)">
                    <td class="exam-label">电脑验光</td>
                    <td>{{ formatRefraction(
                      getExamData('objective_right_spherical'),
                      getExamData('objective_right_cylindrical'),
                      getExamData('objective_right_axis')
                    ) }}</td>
                    <td>{{ formatRefraction(
                      getExamData('objective_left_spherical'),
                      getExamData('objective_left_cylindrical'),
                      getExamData('objective_left_axis')
                    ) }}</td>
                  </tr>
                  <tr v-if="hasSubjectiveRefraction && (getExamData('subjective_right_spherical') != null || getExamData('subjective_left_spherical') != null)">
                    <td class="exam-label">主觉验光</td>
                    <td>{{ formatRefraction(
                      getExamData('subjective_right_spherical'),
                      getExamData('subjective_right_cylindrical'),
                      getExamData('subjective_right_axis')
                    ) }}</td>
                    <td>{{ formatRefraction(
                      getExamData('subjective_left_spherical'),
                      getExamData('subjective_left_cylindrical'),
                      getExamData('subjective_left_axis')
                    ) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- 生物测量检查 -->
            <div v-if="hasBiometryData" class="exam-section">
              <h3 class="section-title">生物测量检查</h3>
              <table class="exam-table">
                <thead>
                  <tr>
                    <th>项目</th>
                    <th>右眼</th>
                    <th>左眼</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="getExamData('right_eye_k1') != null || getExamData('left_eye_k1') != null">
                    <td class="exam-label">K1 (D)</td>
                    <td>{{ format2(getExamData('right_eye_k1')) }}</td>
                    <td>{{ format2(getExamData('left_eye_k1')) }}</td>
                  </tr>
                  <tr v-if="getExamData('right_eye_k2') != null || getExamData('left_eye_k2') != null">
                    <td class="exam-label">K2 (D)</td>
                    <td>{{ format2(getExamData('right_eye_k2')) }}</td>
                    <td>{{ format2(getExamData('left_eye_k2')) }}</td>
                  </tr>
                  <tr v-if="getExamData('right_cct') != null || getExamData('left_cct') != null">
                    <td class="exam-label">中央角膜厚度 (μm)</td>
                    <td>{{ format2(getExamData('right_cct')) }}</td>
                    <td>{{ format2(getExamData('left_cct')) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- 眼轴检查 -->
            <div v-if="hasAxialData" class="exam-section">
              <h3 class="section-title">眼轴检查</h3>
              <table class="exam-table">
                <thead>
                  <tr>
                    <th>项目</th>
                    <th>右眼</th>
                    <th>左眼</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="hasAxialLength && (getExamData('right_eye_axial_length') != null || getExamData('left_eye_axial_length') != null)">
                    <td class="exam-label">眼轴长度 (mm)</td>
                    <td>{{ format2(getExamData('right_eye_axial_length')) }}</td>
                    <td>{{ format2(getExamData('left_eye_axial_length')) }}</td>
                  </tr>
                  <tr v-if="hasAxialRatio && (getExamData('right_axial_ratio') != null || getExamData('left_axial_ratio') != null)">
                    <td class="exam-label">轴率比</td>
                    <td>{{ format2(getExamData('right_axial_ratio')) }}</td>
                    <td>{{ format2(getExamData('left_axial_ratio')) }}</td>
                  </tr>
                  <tr v-if="hasAxialResidual && (getExamData('right_axial_residual') != null || getExamData('left_axial_residual') != null)">
                    <td class="exam-label">轴余 (mm)</td>
                    <td>
                      <span :style="getAxialResidualStyle(getExamData('right_axial_residual'))">
                        {{ format2(getExamData('right_axial_residual')) }}
                      </span>
                    </td>
                    <td>
                      <span :style="getAxialResidualStyle(getExamData('left_axial_residual'))">
                        {{ format2(getExamData('left_axial_residual')) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- 其他检查 -->
            <div v-if="hasOtherData" class="exam-section">
              <h3 class="section-title">其他检查</h3>
              <table class="exam-table">
                <thead>
                  <tr>
                    <th>项目</th>
                    <th>数值</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="hasHeightWeight && getExamData('height') != null">
                    <td class="exam-label">身高</td>
                    <td>{{ formatHeight(getExamData('height')) }}</td>
                  </tr>
                  <tr v-if="hasHeightWeight && getExamData('weight') != null">
                    <td class="exam-label">体重</td>
                    <td>{{ formatWeight(getExamData('weight')) }}</td>
                  </tr>
                  <tr v-if="hasIOP && (getExamData('right_intraocular_pressure') != null || getExamData('left_intraocular_pressure') != null)">
                    <td class="exam-label">眼压 (mmHg)</td>
                    <td>
                      右：{{ format2(getExamData('right_intraocular_pressure')) }} 
                      左：{{ format2(getExamData('left_intraocular_pressure')) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { defineProps } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');

const props = defineProps({
  examinationData: {
    type: Object,
    default: () => ({})
  },
  logoUrl: String,
  orgName: String
});

const printAreaRef = ref(null);
const previewContainerRef = ref(null);

// 分页相关
const currentPage = ref(1);
const totalPages = ref(1);
const pageHeight = 1123; // A4高度（297mm = 1123px at 96 DPI）

// 计算总页数
const calculateTotalPages = () => {
  nextTick(() => {
    if (printAreaRef.value) {
      const contentHeight = printAreaRef.value.scrollHeight;
      // A4页面内容高度 = 297mm - 30mm(上下边距) = 267mm ≈ 1008px
      const pageContentHeight = 1008;
      totalPages.value = Math.max(1, Math.ceil(contentHeight / pageContentHeight));
      console.log('[ExaminationReportPreview] 计算总页数:', {
        contentHeight,
        pageContentHeight,
        totalPages: totalPages.value,
        visiblePages: visiblePages.value
      });
    } else {
      console.warn('[ExaminationReportPreview] printAreaRef.value 为空，无法计算页数');
      // 如果 ref 为空，至少设置为1页
      totalPages.value = 1;
    }
  });
};

// 跳转到指定页（双页模式：每次跳转2页）
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    if (previewContainerRef.value) {
      // 滚动到第一个可见页面的位置
      const scrollTop = (page - 1) * pageHeight;
      previewContainerRef.value.scrollTop = scrollTop;
    }
  }
};

// 计算可见的页面索引（双页显示）
const visiblePages = computed(() => {
  // 如果总页数为0或未初始化，至少显示第一页
  if (totalPages.value === 0) {
    return [1];
  }
  const pages = [];
  const startPage = currentPage.value;
  const endPage = Math.min(startPage + 1, totalPages.value);
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  // 确保至少返回一页
  return pages.length > 0 ? pages : [1];
});

// 页面包装器样式（双页并排显示）
const pagesWrapperStyle = computed(() => {
  return {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%'
  };
});

// 获取页面样式（用于显示对应页面的内容）
const getPageStyle = (pageIndex) => {
  if (totalPages.value > 1) {
    return {
      transform: `translateY(-${(pageIndex - 1) * 1008}px)`,
      transition: 'transform 0.3s ease'
    };
  }
  return {};
};

// 统一数据访问：兼容不同的数据结构
const getExamData = (path) => {
  const data = props.examinationData;
  if (!data) {
    console.log('[ExaminationReportPreview] 没有检查数据');
    return null;
  }
  
  // 尝试多种路径访问数据
  const paths = [
    path, // 直接路径
    `examination.${path}`, // examination 嵌套路径
    `examination.examination.${path}`, // 双重嵌套
  ];
  
  for (const p of paths) {
    const keys = p.split('.');
    let value = data;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        value = null;
        break;
      }
    }
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  
  return null;
};

// 调试：监听数据变化
watch(() => props.examinationData, (newData) => {
  console.log('[ExaminationReportPreview] 检查数据更新:', newData);
  if (newData) {
    console.log('[ExaminationReportPreview] 数据字段:', Object.keys(newData));
    console.log('[ExaminationReportPreview] 患者信息:', newData.patient || newData.name);
    console.log('[ExaminationReportPreview] 视力数据示例:', {
      uva_right_vision: getExamData('uva_right_vision'),
      uva_left_vision: getExamData('uva_left_vision'),
      right_eye_axial_length: getExamData('right_eye_axial_length'),
      left_eye_axial_length: getExamData('left_eye_axial_length')
    });
  }
}, { immediate: true, deep: true });

// 获取患者编号（从 identifiers[1] 提取数字部分）
const getPatientId = () => {
  const data = props.examinationData;
  if (!data) return '-';
  
  const identifiers = data.patient?.identifiers || data.identifiers;
  if (identifiers && identifiers.length > 1) {
    const patientIdStr = identifiers[1];
    const match = patientIdStr ? patientIdStr.match(/\d+/) : null;
    return match ? match[0] : '-';
  }
  return '-';
};

// 获取档案编号（从 gkid 提取数字部分）
const getArchiveId = () => {
  const data = props.examinationData;
  if (!data) return '-';
  
  const gkid = data.patient?.gkid || data.gkid;
  if (gkid) {
    const match = gkid.match(/\d+/);
    return match ? match[0] : '-';
  }
  return '-';
};

// 获取患者信息
const patientInfo = computed(() => {
  const data = props.examinationData;
  if (!data) return {};
  
  // 尝试多种方式获取患者信息
  const patient = data.patient || {};
  const patientName = patient?.name || data.patient_name || data.name || '-';
  const patientGender = patient?.gender || data.gender || data.patient_gender || '-';
  const patientBirthDate = patient?.birth_date || patient?.birthDate || data.birth_date || data.birthDate || null;
  
  console.log('[ExaminationReportPreview] 患者信息提取:', {
    patient: data.patient,
    patientName,
    patientGender,
    patientBirthDate,
    allKeys: Object.keys(data || {})
  });
  
  const result = {
    name: patientName,
    gender: patientGender,
    birth_date: patientBirthDate,
    patient_id: getPatientId(),
    archive_id: getArchiveId()
  };
  
  console.log('[ExaminationReportPreview] patientInfo computed 返回:', result);
  return result;
});

// 获取检查日期
const examinationDate = computed(() => {
  return getExamData('examination_date') || 
         props.examinationData?.examination_date || 
         '-';
});

// Logo样式
const logoStyle = ref({
  maxWidth: '72px',
  maxHeight: '48px',
  top: '10px',
  right: '40px'
});

// 加载保存的logo样式
const loadLogoStyle = () => {
  const savedStyle = localStorage.getItem('print_logo_style');
  if (savedStyle) {
    try {
      const style = JSON.parse(savedStyle);
      logoStyle.value = { ...logoStyle.value, ...style };
    } catch (error) {
      console.error('解析保存的logo样式失败:', error);
    }
  }
};

// 检查是否有数据 - 使用统一的数据访问方法
const hasVisionData = computed(() => {
  return hasNakedVision.value || hasCorrectedVision.value || hasSubjectiveVision.value;
});

const hasNakedVision = computed(() => {
  const right = getExamData('uva_right_vision');
  const left = getExamData('uva_left_vision');
  const both = getExamData('uva_both_vision');
  return (right != null && right !== '') || 
         (left != null && left !== '') || 
         (both != null && both !== '');
});

const hasCorrectedVision = computed(() => {
  const right = getExamData('vaec_right_old_vision');
  const left = getExamData('vaec_left_old_vision');
  const both = getExamData('vaec_both_old_vision');
  return (right != null && right !== '') || 
         (left != null && left !== '') || 
         (both != null && both !== '');
});

const hasSubjectiveVision = computed(() => {
  const right = getExamData('subjective_right_old_vision');
  const left = getExamData('subjective_left_old_vision');
  const both = getExamData('subjective_both_old_vision');
  return (right != null && right !== '') || 
         (left != null && left !== '') || 
         (both != null && both !== '');
});

const hasRefractionData = computed(() => {
  return hasOldGlasses.value || hasObjectiveRefraction.value || hasSubjectiveRefraction.value;
});

const hasOldGlasses = computed(() => {
  const right = getExamData('vaec_right_spherical');
  const left = getExamData('vaec_left_spherical');
  return (right != null && right !== '') || (left != null && left !== '');
});

const hasObjectiveRefraction = computed(() => {
  const right = getExamData('objective_right_spherical');
  const left = getExamData('objective_left_spherical');
  return (right != null && right !== '') || (left != null && left !== '');
});

const hasSubjectiveRefraction = computed(() => {
  const right = getExamData('subjective_right_spherical');
  const left = getExamData('subjective_left_spherical');
  return (right != null && right !== '') || (left != null && left !== '');
});

const hasAxialData = computed(() => {
  return hasAxialLength.value || hasAxialRatio.value || hasAxialResidual.value;
});

const hasAxialLength = computed(() => {
  const right = getExamData('right_eye_axial_length');
  const left = getExamData('left_eye_axial_length');
  return (right != null && right !== '') || (left != null && left !== '');
});

const hasAxialRatio = computed(() => {
  const right = getExamData('right_axial_ratio');
  const left = getExamData('left_axial_ratio');
  return (right != null && right !== '') || (left != null && left !== '');
});

const hasAxialResidual = computed(() => {
  const right = getExamData('right_axial_residual');
  const left = getExamData('left_axial_residual');
  return (right != null && right !== '') || (left != null && left !== '');
});

const hasBiometryData = computed(() => {
  const k1Right = getExamData('right_eye_k1');
  const k1Left = getExamData('left_eye_k1');
  const k2Right = getExamData('right_eye_k2');
  const k2Left = getExamData('left_eye_k2');
  const cctRight = getExamData('right_cct');
  const cctLeft = getExamData('left_cct');
  return (k1Right != null && k1Right !== '') || 
         (k1Left != null && k1Left !== '') ||
         (k2Right != null && k2Right !== '') ||
         (k2Left != null && k2Left !== '') ||
         (cctRight != null && cctRight !== '') ||
         (cctLeft != null && cctLeft !== '');
});

const hasOtherData = computed(() => {
  return hasHeightWeight.value || hasIOP.value;
});

const hasHeightWeight = computed(() => {
  const height = getExamData('height');
  const weight = getExamData('weight');
  return (height != null && height !== '' && height !== 0) || 
         (weight != null && weight !== '' && weight !== 0);
});

const hasIOP = computed(() => {
  const right = getExamData('right_intraocular_pressure');
  const left = getExamData('left_intraocular_pressure');
  return (right != null && right !== '') || (left != null && left !== '');
});

// 格式化函数
const formatVision = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  
  // 先格式化为2位小数，然后检查第二位是否为0
  const twoDecimalStr = num.toFixed(2);
  // 兼容整数：如果后端返回整数（如1），前端显示为1.0
  // 如果第二位小数是0，显示1位小数；否则显示2位小数
  // 例如：1 -> "1.00" -> 第二位是'0' -> 返回"1.0"
  // 例如：1.20 -> "1.20" -> 第二位是'0' -> 返回"1.2"
  // 例如：0.05 -> "0.05" -> 第二位是'5' -> 返回"0.05"
  if (twoDecimalStr.length >= 4 && twoDecimalStr[twoDecimalStr.length - 1] === '0') {
    return num.toFixed(1);
  }
  return twoDecimalStr;
};

const formatRefraction = (sphere, cylinder, axis) => {
  const s = sphere != null ? Number(sphere).toFixed(2) : '-';
  const c = cylinder != null ? Number(cylinder).toFixed(2) : '-';
  const a = axis != null ? Math.round(Number(axis)) : '-';
  return `${s} / ${c} / ${a}`;
};

const format2 = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  return num.toFixed(2);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY-MM-DD');
};

const formatHeight = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  return `${num.toFixed(1)} cm`;
};

const formatWeight = (val) => {
  if (val === null || val === undefined || val === '' || val === 0) return '-';
  const num = Number(val);
  if (isNaN(num) || num === 0) return '-';
  return `${num.toFixed(1)} kg`;
};

const calculateAge = (birthDate) => {
  if (!birthDate) return '-';
  const age = dayjs().diff(dayjs(birthDate), 'year');
  return age >= 0 ? `${age}岁` : '-';
};

// 获取轴余的样式
const getAxialResidualStyle = (value) => {
  if (!value || isNaN(value)) return {};

  const num = parseFloat(value);
  const absValue = Math.abs(num);
  const intensity = Math.min(absValue / 0.5, 1);

  if (num > 0) {
    return {
      color: `rgba(231, 76, 60, ${0.5 + intensity * 0.5})`,
      fontWeight: 'bold'
    };
  } else if (num < 0) {
    return {
      color: `rgba(39, 174, 96, ${0.5 + intensity * 0.5})`,
      fontWeight: 'bold'
    };
  }

  return {};
};

// 处理logo加载错误
const handleLogoError = (event) => {
  console.error('[ExaminationReportPreview] Logo加载失败:', event.target.src);
};

// 暴露打印区域引用和方法
defineExpose({
  printAreaRef,
  calculateTotalPages
});

// 监听内容变化，重新计算页数
watch(() => props.examinationData, (newData) => {
  console.log('[ExaminationReportPreview] 检查数据更新:', newData);
  if (newData) {
    console.log('[ExaminationReportPreview] 数据字段:', Object.keys(newData));
    console.log('[ExaminationReportPreview] 患者信息:', newData.patient || newData.name);
    console.log('[ExaminationReportPreview] 视力数据示例:', {
      uva_right_vision: getExamData('uva_right_vision'),
      uva_left_vision: getExamData('uva_left_vision'),
      right_eye_axial_length: getExamData('right_eye_axial_length'),
      left_eye_axial_length: getExamData('left_eye_axial_length')
    });
    console.log('[ExaminationReportPreview] 数据检测结果:', {
      hasVisionData: hasVisionData.value,
      hasRefractionData: hasRefractionData.value,
      hasAxialData: hasAxialData.value,
      hasBiometryData: hasBiometryData.value,
      hasOtherData: hasOtherData.value
    });
  }
  setTimeout(() => {
    calculateTotalPages();
  }, 100);
}, { deep: true, immediate: true });

onMounted(() => {
  loadLogoStyle();
  console.log('[ExaminationReportPreview] 组件已挂载，检查数据:', props.examinationData);
  setTimeout(() => {
    calculateTotalPages();
  }, 200);
});
</script>

<style scoped>
.print-preview-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.print-preview-card .ant-card-body {
  padding: 0 !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #f5f5f5;
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
}

/* 页面包装器（双页显示） */
.pages-wrapper {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  flex-wrap: wrap;
}

/* 分页控制栏 */
.pagination-controls {
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.page-info {
  font-size: 14px;
  color: #666;
  margin: 0 16px;
  min-width: 100px;
  text-align: center;
}

.a4-preview-box {
  width: 794px;
  min-height: 1123px;
  background: #fff;
  margin: 0 auto;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.08);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

/* 分页视图模式 */
.a4-preview-box.page-view {
  height: 1123px;
  margin-bottom: 20px;
  overflow: hidden;
}

/* 页面内容包装器 */
.page-content-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.print-preview-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
  background: transparent !important;
}

.header-area-fixed {
  position: relative;
  width: 100%;
  height: 60px;
  margin-bottom: 0;
  background: transparent;
}

.logo-fixed {
  position: absolute;
  top: 10px;
  right: 40px;
  max-width: 72px;
  max-height: 48px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.orgname-fixed {
  position: absolute;
  top: 14px;
  left: 32px;
  font-size: 24px;
  font-weight: 700;
  color: #1976d2;
  letter-spacing: 2px;
  font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', Arial, sans-serif;
}

.report-title {
  text-align: center;
  color: #224B96;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 4px;
  margin: 16px 0;
  font-family: 'Segoe UI', 'PingFang SC', Arial, sans-serif;
}

.patient-info-section {
  margin-bottom: 20px;
}

.patient-info-row {
  font-size: 15px;
  color: #222;
  margin-bottom: 8px;
  font-family: 'Segoe UI', 'PingFang SC', Arial, sans-serif;
}

.examination-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.exam-section {
  margin-bottom: 20px;
  page-break-inside: avoid;
  break-inside: avoid;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e3f0fb;
}

.exam-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(25,118,210,0.04);
  margin-bottom: 16px;
}

.exam-table th {
  background: #e3f0fb;
  color: #1976d2;
  font-weight: 700;
  font-size: 14px;
  padding: 10px;
  text-align: center;
  border-bottom: 2px solid #e3eaf2;
}

.exam-table td {
  background: #fff;
  color: #222;
  font-size: 14px;
  padding: 10px;
  text-align: center;
  border-bottom: 1px solid #e3eaf2;
}

.exam-table tr:last-child td {
  border-bottom: none;
}

.exam-label {
  font-weight: 600;
  color: #333;
  text-align: left !important;
}

.remark-content {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
}

.logo-watermark {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(-25deg);
  opacity: 0.15;
  max-width: 70%;
  max-height: 70%;
  z-index: 99999;
  pointer-events: none;
  filter: grayscale(15%) blur(0.3px);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* 打印样式 */
@media print {
  @page {
    size: A4 portrait;
    margin: 0;
    padding: 0;
    width: 210mm;
    height: 297mm;
  }
  
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  html, body {
    background: #fff !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
  }
  
  .preview-container {
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  .a4-preview-box {
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    background: #fff !important;
    transform: none !important;
  }
  
  .print-preview-area {
    padding: 15mm !important;
    height: calc(297mm - 30mm) !important;
    box-sizing: border-box !important;
  }
  
  .logo-watermark {
    opacity: 0.12 !important;
    filter: grayscale(20%) blur(0.2px) !important;
  }
  
  /* 智能分页：避免检查项目被分页 */
  .exam-section {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    -webkit-region-break-inside: avoid !important;
    page-break-after: auto !important;
    break-after: auto !important;
  }
  
  /* 如果检查项目太高，允许分页，但尽量保持完整 */
  .exam-section:has(table) {
    page-break-inside: auto !important;
    break-inside: auto !important;
  }
  
  /* 表格行避免分页 */
  .exam-table tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  /* 患者信息区域避免分页 */
  .patient-info-section {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  /* 报告标题避免分页 */
  .report-title {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
}
</style>

