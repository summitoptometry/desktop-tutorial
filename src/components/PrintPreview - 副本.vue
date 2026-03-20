<template>
  <a-card>
    <!-- Logo编辑控制面板 -->
    <div v-if="logoUrl && showLogoEditPanel" style="position: fixed; top: 10px; left: 10px; z-index: 10000; background: rgba(0,0,0,0.9); color: white; padding: 15px; border-radius: 8px; font-size: 12px; min-width: 220px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
      <div style="margin-bottom: 12px; font-weight: bold; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px;">
        🎨 Logo样式编辑
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; margin-bottom: 4px; color: #ccc;">宽度:</label>
        <input 
          v-model="logoStyle.maxWidth" 
          type="text" 
          style="width: 70px; padding: 4px 6px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; font-size: 11px;"
          placeholder="72px"
        />
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; margin-bottom: 4px; color: #ccc;">高度:</label>
        <input 
          v-model="logoStyle.maxHeight" 
          type="text" 
          style="width: 70px; padding: 4px 6px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; font-size: 11px;"
          placeholder="48px"
        />
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; margin-bottom: 4px; color: #ccc;">上边距:</label>
        <input 
          v-model="logoStyle.top" 
          type="text" 
          style="width: 70px; padding: 4px 6px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; font-size: 11px;"
          placeholder="10px"
        />
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: #ccc;">左边距:</label>
        <input 
          v-model="logoStyle.left" 
          type="text" 
          style="width: 70px; padding: 4px 6px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; font-size: 11px;"
          placeholder="32px"
        />
      </div>
      <div style="display: flex; gap: 6px;">
        <button 
          @click="toggleLogoEdit" 
          style="flex: 1; padding: 6px 8px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; transition: background 0.3s;"
          :style="{ background: isEditingLogo ? '#52c41a' : '#1890ff' }"
        >
          {{ isEditingLogo ? '✅ 完成' : '✏️ 编辑' }}
        </button>
        <button 
          @click="resetLogoStyle" 
          style="flex: 1; padding: 6px 8px; background: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; transition: background 0.3s;"
        >
          🔄 重置
        </button>
      </div>
      <div style="margin-top: 8px; font-size: 10px; color: #999; text-align: center;">
        样式会自动保存
      </div>
    </div>
    <div style="display:flex;justify-content:center;align-items:flex-start;background:#f5f5f5;position:relative;">
              <div class="a4-preview-box">
          <img v-if="logoUrl" :src="logoUrl" class="logo-watermark" :crossorigin="logoUrl && logoUrl.startsWith('data:') ? 'anonymous' : undefined" @error="handleLogoError" />
          <!-- Logo编辑按钮 - 放在预览区左上角 -->
          <button 
            v-if="logoUrl" 
            @click="toggleLogoEditPanel" 
            class="logo-edit-btn-preview"
            :title="showLogoEditPanel ? '隐藏编辑面板' : '显示编辑面板'"
          >
            {{ showLogoEditPanel ? '✕' : '⚙️' }}
          </button>
          <div id="print-preview-area" class="print-preview-area">
          <!-- 固定抬头区域 -->
          <div class="header-area-fixed">
            <img 
              v-if="logoUrl" 
              :src="logoUrl" 
              class="logo-fixed" 
              :class="{ 'logo-editable': isEditingLogo }"
              :style="logoStyle"
              :crossorigin="logoUrl && logoUrl.startsWith('data:') ? 'anonymous' : undefined" 
              @error="handleLogoError" 
            />
            <div v-if="orgName" class="orgname-fixed">
              {{ orgName }}
              <!-- <span class="orgname-en">Optometry Center</span> 可选英文副标题 -->
            </div>
            <!-- <div class="header-divider"></div>  // 直接注释或删除 -->
          </div>
          <!-- 原有报告内容 -->
          <h2 class="report-title">复查报告</h2>
          <div class="patient-info-row" style="margin-bottom: 16px;">
            <span>姓名：{{ props.patient?.name || flatExams[0]?.name || '-' }}</span>
            <span style="margin-left: 32px;">档案号：{{ props.patient?.gkid || flatExams[0]?.gkid || '-' }}</span>
          </div>
          <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center;">
              <span style="font-weight: bold;">本次检查日期：</span>
              <span style="margin-left: 8px;">{{ props.patient?.examination_date || flatExams[0]?.examination_date || '-' }}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span style="font-weight: bold;">下次复查日期：</span>
              <span style="margin-left: 8px;">{{ reviewDate || '-' }}</span>
            </div>
          </div>
          <div class="report-main">
            <div class="report-table-area">
              <!-- 表格内容 -->
              <table class="report-table">
                <thead>
                <tr>
                  <th class="col-date">检查日期</th>
                  <th v-if="fields.includes('naked_vision')" class="col-vision">裸眼视力</th>
                  <th v-if="fields.includes('corrected_vision')" class="col-vision">戴镜视力</th>
                  <th v-if="fields.includes('old_glasses')" class="col-glasses">旧镜度数</th>
                  <th v-if="fields.includes('objective_refraction')" class="col-glasses">电脑验光</th>
                  <th v-if="fields.includes('axial_length')" class="col-axial">眼轴长度</th>
                  <th v-if="fields.includes('axial_ratio')" class="col-axial">轴率比</th>
                  <th v-if="fields.includes('axial_residual')" class="col-axial">轴余</th>
                  <th v-if="fields.includes('height_weight')" class="col-height-weight">身高/体重</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(row, idx) in flatExams" :key="row.examination_id || idx">
                  <td>{{ row.examination_date || '-' }}</td>
                  <td v-if="fields.includes('naked_vision')">
                    <div>右：{{ formatVision(row.uva_right_vision) }}</div>
                    <div>左：{{ formatVision(row.uva_left_vision) }}</div>
                    <div>双：{{ formatVision(row.uva_both_vision) }}</div>
                  </td>
                  <td v-if="fields.includes('corrected_vision')">
                    <div>右：{{ formatVision(row.vaec_right_old_vision) }}</div>
                    <div>左：{{ formatVision(row.vaec_left_old_vision) }}</div>
                    <div>双：{{ formatVision(row.vaec_both_old_vision) }}</div>
                  </td>
                  <td v-if="fields.includes('old_glasses')">
                    <div>右：{{ format2(row.vaec_right_spherical) }}/{{ format2(row.vaec_right_cylindrical) }}/{{ formatAxis(row.vaec_right_axis) }}</div>
                    <div>左：{{ format2(row.vaec_left_spherical) }}/{{ format2(row.vaec_left_cylindrical) }}/{{ formatAxis(row.vaec_left_axis) }}</div>
                  </td>
                  <td v-if="fields.includes('objective_refraction')">
                    <div>右：{{ format2(row.objective_right_spherical) }}/{{ format2(row.objective_right_cylindrical) }}/{{ formatAxis(row.objective_right_axis) }}</div>
                    <div>左：{{ format2(row.objective_left_spherical) }}/{{ format2(row.objective_left_cylindrical) }}/{{ formatAxis(row.objective_left_axis) }}</div>
                  </td>
                  <td v-if="fields.includes('axial_length')">
                    <div>
                      右：{{ format2(row.right_eye_axial_length) }}
                      <span v-if="axialTrends[idx]?.right === 1" :style="{ color: '#e74c3c', ...getTrendArrowStyle(true) }">
                        ↑<span :style="{ ...getTrendArrowStyle(false), marginLeft: '2px' }">+{{ axialTrends[idx].rightDelta.toFixed(2) }}</span>
                      </span>
                      <span v-else-if="axialTrends[idx]?.right === -1" :style="{ color: '#27ae60', ...getTrendArrowStyle(true) }">
                        ↓<span :style="{ ...getTrendArrowStyle(false), marginLeft: '2px' }">{{ axialTrends[idx].rightDelta.toFixed(2) }}</span>
                      </span>
                    </div>
                    <div>
                      左：{{ format2(row.left_eye_axial_length) }}
                      <span v-if="axialTrends[idx]?.left === 1" :style="{ color: '#e74c3c', ...getTrendArrowStyle(true) }">
                        ↑<span :style="{ ...getTrendArrowStyle(false), marginLeft: '2px' }">+{{ axialTrends[idx].leftDelta.toFixed(2) }}</span>
                      </span>
                      <span v-else-if="axialTrends[idx]?.left === -1" :style="{ color: '#27ae60', ...getTrendArrowStyle(true) }">
                        ↓<span :style="{ ...getTrendArrowStyle(false), marginLeft: '2px' }">{{ axialTrends[idx].leftDelta.toFixed(2) }}</span>
                      </span>
                    </div>
                  </td>
                  <td v-if="fields.includes('axial_ratio')">
                    <div>右：{{ format2(row.right_axial_ratio) }}</div>
                    <div>左：{{ format2(row.left_axial_ratio) }}</div>
                  </td>
                  <td v-if="fields.includes('axial_residual')">
                    <div>
                      右：<span :style="getAxialResidualStyle(row.right_axial_residual)">
                        {{ format2(row.right_axial_residual) }}
                      </span>
                    </div>
                    <div>
                      左：<span :style="getAxialResidualStyle(row.left_axial_residual)">
                        {{ format2(row.left_axial_residual) }}
                      </span>
                    </div>
                  </td>
                  <td v-if="fields.includes('height_weight')">
                    <div>{{ formatHeight(row.height) }}</div>
                    <div>{{ formatWeight(row.weight) }}</div>
                  </td>
                </tr>
                <!-- 占位行，撑满高度 -->
                <tr v-for="i in (5 - flatExams.length)" v-if="flatExams.length < 5" :key="'empty'+i">
                  <td v-for="col in tableColCount" :key="col">&nbsp;</td>
                </tr>
                </tbody>
              </table>
            </div>
            <div class="report-chart-area" :style="chartAreaStyle">
              <!-- 始终展示echarts图表 -->
              <div :id="chartId" :style="chartContainerStyle"></div>
              <!-- 隐藏图片，仅供后续打印等用途，不在前端展示 -->
              <!-- <img v-if="chartImgUrl" :src="chartImgUrl" style="width:100%;height:100%;display:none;" /> -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-card>
</template>

<style scoped>
.a4-preview-box {
  width: 794px;
  height: 1123px;
  background: #fff;
  margin: 0 auto;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.08);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-bottom: 0 !important;
}
@media print {
  .a4-preview-box {
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    width: auto !important;
    height: auto !important;
    background: #fff !important;
    padding: 0 !important;
  }
  body {
    background: #fff !important;
  }
  .no-print {
    display: none !important;
  }
  /* 确保打印时水印可见 */
  .logo-watermark {
    opacity: 0.12 !important;
    filter: grayscale(20%) blur(0.2px) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}

/* 小屏设备响应式调整 */
@media screen and (max-width: 768px) {
  .report-table {
    font-size: 12px;
  }
  .report-table th,
  .report-table td {
    padding: 4px 2px;
  }
  .report-table .col-date {
    width: 18%;
    min-width: 60px;
  }
  .report-table .col-vision {
    width: 12%;
    min-width: 50px;
  }
  .report-table .col-glasses {
    width: 22%;
    min-width: 80px;
  }
  .report-table .col-axial {
    width: 16%;
    min-width: 70px;
  }
  .report-table .col-height-weight {
    width: 14%;
    min-width: 60px;
  }
}

/* 超小屏设备响应式调整（手机等） */
@media screen and (max-width: 480px) {
  .report-table {
    font-size: 10px;
  }
  
  .report-table th,
  .report-table td {
    padding: 2px 1px;
  }
}
.no-print { display: inline-block; }
.draggable {
  cursor: move;
  border: 1px dashed #aaa;
}
.print-preview-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
  background: transparent !important;
  padding-bottom: 0 !important;
}
.print-preview-area table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(25,118,210,0.04);
}
.print-preview-area th {
  background: #e3f0fb;
  color: #1976d2;
  font-weight: 700;
  font-size: 16px;
  border-bottom: 2px solid #e3eaf2;
  padding: 10px 0;
}
.print-preview-area td {
  background: #fff;
  color: #222;
  font-size: 15px;
  padding: 8px 0;
  border-bottom: 1px solid #e3eaf2;
  text-align: center;
}
.print-preview-area tr:last-child td {
  border-bottom: none;
}
.header-area-fixed {
  position: relative;
  width: 100%;
  height: 60px; /* 原100px，改为60px */
  margin-bottom: 0; /* 原12px，改为0，正文紧接页眉 */
  background: transparent; /* 或直接去掉background */
  /* border-bottom: none;  // 不需要分割线 */
}
.logo-fixed {
  position: absolute;
  top: 10px;
  left: 32px;
  max-width: 72px;   /* 最大宽度，可根据需要调整 */
  max-height: 48px;  /* 最大高度，可根据需要调整 */
  width: auto;
  height: auto;
  object-fit: contain;
  transition: all 0.3s ease;
}

.logo-edit-btn-preview {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(24, 144, 255, 0.9);
  color: white;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.logo-edit-btn-preview:hover {
  background: rgba(24, 144, 255, 1);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

@media print {
  .logo-edit-btn-preview {
    display: none !important;
  }
}

.logo-editable {
  cursor: move;
  border: 2px dashed #1890ff;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(24, 144, 255, 0.3);
}

.logo-editable:hover {
  border-color: #40a9ff;
  box-shadow: 0 0 15px rgba(24, 144, 255, 0.5);
}
.orgname-fixed {
  position: absolute;
  top: 14px;   /* 原32px，向上移 */
  right: 40px;
  font-size: 24px; /* 原28px，略微缩小 */
  font-weight: 700;
  color: #1976d2;
  letter-spacing: 2px;
  font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', Arial, sans-serif;
  text-shadow: 0 2px 8px rgba(25,118,210,0.06);
  line-height: 1.2;
}
/* 去除分割线 */
.header-divider {
  display: none;
}
.report-title {
  text-align: center;
  color: #224B96;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 3px;
  margin: 0px 0 4px 0;
  font-family: 'Segoe UI', 'PingFang SC', Arial, sans-serif;
  text-shadow: 0 2px 8px rgba(25,118,210,0.08);
}
.print-preview-area > div {
  color: #666;
  font-size: 15px;
  margin-bottom: 10px;
  line-height: 1.8;
}
.report-main {
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.report-table-area {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.report-table {
  width: 100%;
  height: 100%;
  table-layout: auto; /* 改为auto，让表格能够根据内容自适应 */
}
.report-table tbody {
  height: 100%;
  display: table-row-group;
}
.report-table tr {
  height: calc((100% - 370px) / 5); /* 370px为图表高度，5为最大行数(包括本次检查) */
}

/* 表格列宽定义 - 使用相对单位，支持缩放 */
.report-table .col-date {
  width: 15%;
  min-width: 80px;
}
.report-table .col-vision {
  width: 10%;
  min-width: 60px;
}
.report-table .col-glasses {
  width: 20%;
  min-width: 120px;
}
.report-table .col-axial {
  width: 15%;
  min-width: 90px;
}
.report-table .col-height-weight {
  width: 12%;
  min-width: 70px;
}
.report-chart-area {
  height: 350px; /* 调整图表高度，平衡表格和图表的空间 */
  margin-top: 16px;
  margin-bottom: 0;
  position: relative;
  /* 图表区域的margin也会通过动态样式调整 */
}
/* 图表容器样式现在通过动态计算属性设置 */
.patient-info-row {
  font-size: 24px;
  font-weight: bold;
  color: #222;
  margin-bottom: 18px;
  letter-spacing: 1px;
  font-family: 'Segoe UI', 'PingFang SC', Arial, sans-serif;
}
.a4-preview-box,
.print-preview-area {
  background: #fff !important;
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
  /* 确保在截图时可见 */
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.print-preview-area,
.header-area-fixed,
.report-title,
.patient-info-row,
.report-main {
  position: relative;
  z-index: 1;
  /* 确保不会遮挡水印 */
  pointer-events: auto;
}
</style>

<script setup>
import { defineProps, toRefs, watchEffect, onMounted, nextTick, watch, computed, ref, defineEmits, defineExpose, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

const emit = defineEmits(['update:logoStyle', 'update:orgNameStyle', 'update:headerAreaStyle']);

// 生成唯一的图表ID
const chartId = ref(`axial-length-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

// 获取当前缩放比例
const getScaleRatio = () => {
  const a4Box = document.querySelector('.a4-preview-box');
  let scaleRatio = 1;
  if (a4Box && a4Box.style.transform) {
    const transform = a4Box.style.transform;
    const match = transform.match(/scale\(([^)]+)\)/);
    if (match) {
      scaleRatio = parseFloat(match[1]);
    }
  }
  return scaleRatio;
};

// 响应式缩放比例
const currentScaleRatio = ref(1);

// 更新缩放比例
const updateScaleRatio = () => {
  currentScaleRatio.value = getScaleRatio();
};

// 计算趋势箭头的动态样式
const getTrendArrowStyle = (isArrow = true) => {
  // 直接使用与表格内容相同的字体大小，让CSS媒体查询自动处理缩放
  return {
    fontSize: 'inherit'
  };
};

// 计算图表容器的动态样式
const chartContainerStyle = computed(() => {
  const scaleRatio = currentScaleRatio.value;
  
  const basePadding = 12;
  const baseBorderRadius = 12;
  const baseBoxShadow = '0 2px 12px 0 rgba(25,118,210,0.04)';
  
  const padding = Math.max(6, Math.round(basePadding * scaleRatio));
  const borderRadius = Math.max(6, Math.round(baseBorderRadius * scaleRatio));
  
  return {
    width: '100%',
    height: '100%',
    background: '#fafdff',
    borderRadius: `${borderRadius}px`,
    boxShadow: baseBoxShadow,
    padding: `${padding}px`,
    boxSizing: 'border-box',
    transformOrigin: 'top left'
  };
});

// 计算图表区域的动态样式
const chartAreaStyle = computed(() => {
  const scaleRatio = currentScaleRatio.value;
  
  const baseMarginTop = 16;
  const baseHeight = 350;
  
  const marginTop = Math.max(8, Math.round(baseMarginTop * scaleRatio));
  const height = Math.max(200, Math.round(baseHeight * scaleRatio));
  
  return {
    height: `${height}px`,
    marginTop: `${marginTop}px`,
    marginBottom: '0',
    position: 'relative'
  };
});



const props = defineProps({
  exams: { type: Array, default: () => [] },
  fields: Array,
  patient: { type: Object, default: () => ({}) },
  logoUrl: String,
  orgName: String,
  sortOrder: { type: String, default: 'desc' },
  reviewDate: { type: String, default: '' }
});

// Logo样式状态
const logoStyle = ref({
  maxWidth: '72px',
  maxHeight: '48px',
  top: '10px',
  left: '32px'
});

// 是否处于编辑模式
const isEditingLogo = ref(false);

// 是否显示logo编辑面板
const showLogoEditPanel = ref(false);

// 是否处于抬头区域编辑模式
const isEditingHeaderStyle = ref(false);

// 机构名称样式
const orgNameStyle = ref({
  top: '14px',
  right: '40px',
  fontSize: '24px',
  fontWeight: '700',
  color: '#1976d2'
});

// 抬头区域样式
const headerAreaStyle = ref({
  position: 'relative',
  width: '100%',
  height: '60px',
  marginBottom: '0',
  background: 'transparent'
});

// 加载保存的logo样式
const loadLogoStyle = () => {
  const savedStyle = localStorage.getItem('print_logo_style');
  if (savedStyle) {
    try {
      const style = JSON.parse(savedStyle);
      logoStyle.value = { ...logoStyle.value, ...style };
      console.log('加载保存的logo样式:', logoStyle.value);
    } catch (error) {
      console.error('解析保存的logo样式失败:', error);
    }
  }
};

// 保存logo样式
const saveLogoStyle = () => {
  localStorage.setItem('print_logo_style', JSON.stringify(logoStyle.value));
  console.log('保存logo样式:', logoStyle.value);
};

// 切换编辑模式
const toggleLogoEdit = () => {
  isEditingLogo.value = !isEditingLogo.value;
  if (!isEditingLogo.value) {
    // 退出编辑模式时保存样式
    saveLogoStyle();
  }
};

// 切换logo编辑面板显示
const toggleLogoEditPanel = () => {
  showLogoEditPanel.value = !showLogoEditPanel.value;
};

// 重置logo样式
const resetLogoStyle = () => {
  logoStyle.value = {
    maxWidth: '72px',
    maxHeight: '48px',
    top: '10px',
    left: '32px'
  };
  saveLogoStyle();
  console.log('重置logo样式为默认值');
};

const {
  logoUrl,
  orgName,
  exams,
  fields,
  patient,
  sortOrder,
  reviewDate
} = toRefs(props);

watch(
  () => props.reviewDate,
  (val) => {
    console.log('[PrintPreview] watch reviewDate:（接收到的复查日期参数）', val, '（与Examination1传递参数应一致）');
  },
  { immediate: true }
);

// 监听logoUrl变化
watch(
  () => props.logoUrl,
  (val) => {
    console.log('[PrintPreview] logoUrl changed:', {
      hasLogo: !!val,
      logoType: val ? (val.startsWith('data:') ? 'base64' : 'url') : 'none',
      logoLength: val ? val.length : 0
    });
    
    // 调试水印显示
    if (val) {
      console.log('[PrintPreview] 水印logo已设置，应该显示在页面中央');
      // 检查DOM中的水印元素
      nextTick(() => {
        const watermarkElement = document.querySelector('.logo-watermark');
        if (watermarkElement) {
          console.log('[PrintPreview] 水印元素存在:', {
            src: watermarkElement.src,
            style: watermarkElement.style.cssText,
            computedStyle: window.getComputedStyle(watermarkElement)
          });
        } else {
          console.warn('[PrintPreview] 未找到水印元素');
        }
      });
    }
  },
  { immediate: true }
);

// 监听logo样式变化，自动保存
watch(
  logoStyle,
  (newStyle) => {
    console.log('[PrintPreview] logo样式变化:', newStyle);
    // 延迟保存，避免频繁保存
    setTimeout(() => {
      saveLogoStyle();
    }, 500);
  },
  { deep: true }
);

// 拖拽/缩放相关
const dragging = ref(null); // 'logo' | 'org' | 'header' | null
const dragOffset = ref({x:0, y:0});

function startDrag(type, e) {
  if (!isEditingHeaderStyle.value) return;
  dragging.value = type;
  const style = type === 'logo' ? { ...logoStyle.value } : { ...orgNameStyle.value };
  dragOffset.value = {
    x: e.clientX - parseInt(style.left),
    y: e.clientY - parseInt(style.top)
  };
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
}
function onDrag(e) {
  if (!dragging.value) return;
  let style = dragging.value === 'logo' ? { ...logoStyle.value } : { ...orgNameStyle.value };
  style.left = (e.clientX - dragOffset.value.x) + 'px';
  style.top = (e.clientY - dragOffset.value.y) + 'px';
  if (dragging.value === 'logo') {
    emit('update:logoStyle', style);
  } else if (dragging.value === 'org') {
    emit('update:orgNameStyle', style);
  }
}
function stopDrag() {
  dragging.value = null;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

// 抬头区域拖拽和缩放
let resizing = false;
let resizeStart = {x:0, y:0, width:0, height:0};
function startHeaderAreaDrag(e) {
  if (!isEditingHeaderStyle.value) return;
  dragging.value = 'header';
  const style = { ...headerAreaStyle.value };
  dragOffset.value = {
    x: e.clientX - parseInt(style.left),
    y: e.clientY - parseInt(style.top)
  };
  document.addEventListener('mousemove', onHeaderAreaDrag);
  document.addEventListener('mouseup', stopHeaderAreaDrag);
}
function onHeaderAreaDrag(e) {
  if (dragging.value !== 'header') return;
  let style = { ...headerAreaStyle.value };
  style.left = (e.clientX - dragOffset.value.x) + 'px';
  style.top = (e.clientY - dragOffset.value.y) + 'px';
  emit('update:headerAreaStyle', style);
}
function stopHeaderAreaDrag() {
  dragging.value = null;
  document.removeEventListener('mousemove', onHeaderAreaDrag);
  document.removeEventListener('mouseup', stopHeaderAreaDrag);
}
function startResize(e) {
  if (!isEditingHeaderStyle.value) return;
  resizing = true;
  const style = { ...headerAreaStyle.value };
  resizeStart = {
    x: e.clientX,
    y: e.clientY,
    width: parseInt(style.width),
    height: parseInt(style.height)
  };
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
}
function onResize(e) {
  if (!resizing) return;
  let style = { ...headerAreaStyle.value };
  style.width = (resizeStart.width + (e.clientX - resizeStart.x)) + 'px';
  style.height = (resizeStart.height + (e.clientY - resizeStart.y)) + 'px';
  emit('update:headerAreaStyle', style);
}
function stopResize() {
  resizing = false;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
}

// 格式化函数
function formatVision(val) {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  return num.toFixed(1);
}
function formatAxis(val) {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  return Math.round(num);
}
function format2(val) {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  return num.toFixed(2);
}

// 格式化身高
function formatHeight(val) {
  if (val === null || val === undefined || val === '') return '身高: -';
  const num = Number(val);
  if (isNaN(num)) return '身高: -';
  return `身高: ${num.toFixed(1)}cm`;
}

// 格式化体重，0或null视为未测
function formatWeight(val) {
  if (val === null || val === undefined || val === '' || val === 0) return '体重: 未测';
  const num = Number(val);
  if (isNaN(num) || num === 0) return '体重: 未测';
  return `体重: ${num.toFixed(1)}kg`;
}

// 日期格式化函数
function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const d = dateStr.replace(/-/g, '');
  if (d.length === 8) return d.slice(2);
  return dateStr;
}

// 计算轴率比
const calculateAxialRatio = (k1, k2, axialLength) => {
  if (!k1 || !k2 || !axialLength) {
    return null;
  }

  try {
    // 将K值转换为曲率半径（mm）
    const r1 = 337.5 / Number(k1);
    const r2 = 337.5 / Number(k2);

    // 计算平均曲率半径
    const avgRadius = (r1 + r2) / 2;

    // 计算轴率比
    const ratio = Number(axialLength) / avgRadius;

    return ratio.toFixed(2);
  } catch (error) {
    console.error('计算轴率比时出错:', error);
    return null;
  }
};

// 计算轴余
const calculateAxialResidual = (k1, k2, axialLength) => {
  if (!k1 || !k2 || !axialLength) {
    return null;
  }

  try {
    // 计算平均K值
    const avgK = (Number(k1) + Number(k2)) / 2;

    // 计算平均曲率半径
    const avgRadius = 337.5 / avgK;

    // 计算参考眼轴长度（轴率比2.99时）
    const referenceAxialLength = 2.99 * avgRadius;

    // 计算轴余
    const residual = Number(axialLength) - referenceAxialLength;

    return residual.toFixed(2);
  } catch (error) {
    console.error('计算轴余时出错:', error);
    return null;
  }
};

// 统一 exams 数据结构为扁平化，并添加计算值
const flatExams = computed(() => {
  console.log('flatExams 原始数据:', props.exams);

  const flattened = props.exams.map(item => {
    let record = item;
    if (item.examination) {
      record = {
        ...item.examination,
        examination_id: item.examination_id,
        examination_date: item.examination?.examination_date,
        name: item.patient?.name || item.name,
        gkid: item.patient?.gkid || item.gkid
      };
    }

    // 计算轴率比和轴余
    if (props.fields.includes('axial_ratio') || props.fields.includes('axial_residual')) {
      // 计算右眼数据
      if (props.fields.includes('axial_ratio')) {
        record.right_axial_ratio = calculateAxialRatio(
          record.right_eye_k1,
          record.right_eye_k2,
          record.right_eye_axial_length
        );
      }

      if (props.fields.includes('axial_residual')) {
        record.right_axial_residual = calculateAxialResidual(
          record.right_eye_k1,
          record.right_eye_k2,
          record.right_eye_axial_length
        );
      }

      // 计算左眼数据
      if (props.fields.includes('axial_ratio')) {
        record.left_axial_ratio = calculateAxialRatio(
          record.left_eye_k1,
          record.left_eye_k2,
          record.left_eye_axial_length
        );
      }

      if (props.fields.includes('axial_residual')) {
        record.left_axial_residual = calculateAxialResidual(
          record.left_eye_k1,
          record.left_eye_k2,
          record.left_eye_axial_length
        );
      }
    }

    console.log('flatExams 处理后的单条记录:', record);
    return record;
  });

  // 根据日期排序
  const sorted = [...flattened].sort((a, b) => {
    const dateA = new Date(a.examination_date || '');
    const dateB = new Date(b.examination_date || '');
    return props.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  console.log('flatExams 最终结果:', sorted);
  return sorted;
});

// 计算每一行与上一次的眼轴长度对比
const axialTrends = computed(() => {
  // 先按日期升序
  const sorted = [...flatExams.value].sort((a, b) => {
    if (!a.examination_date) return -1;
    if (!b.examination_date) return 1;
    return new Date(a.examination_date) - new Date(b.examination_date);
  });
  // trends[i] = { right: 1/0/-1, left: 1/0/-1, rightDelta, leftDelta }
  const trends = sorted.map((row, i) => {
    if (i === 0) return { right: 0, left: 0, rightDelta: null, leftDelta: null }; // 没有上一次
    const prev = sorted[i - 1];
    let right = 0, left = 0, rightDelta = null, leftDelta = null;
    if (row.right_eye_axial_length != null && prev.right_eye_axial_length != null) {
      rightDelta = (row.right_eye_axial_length - prev.right_eye_axial_length);
      if (rightDelta > 0) right = 1;
      else if (rightDelta < 0) right = -1;
    }
    if (row.left_eye_axial_length != null && prev.left_eye_axial_length != null) {
      leftDelta = (row.left_eye_axial_length - prev.left_eye_axial_length);
      if (leftDelta > 0) left = 1;
      else if (leftDelta < 0) left = -1;
    }
    return { right, left, rightDelta, leftDelta };
  });
  // trends的顺序要和flatExams一致
  const map = {};
  sorted.forEach((row, i) => { map[row.examination_id || i] = trends[i]; });
  return flatExams.value.map((row, i) => map[row.examination_id || i] || { right: 0, left: 0, rightDelta: null, leftDelta: null });
});

// 在 watchEffect 中添加调试日志
watchEffect(() => {
  console.log('PrintPreview 接收到的数据:');
  console.log('1. 字段选择:', props.fields);
  console.log('2. 检查记录数据:');
  props.exams.forEach((exam, index) => {
    console.log(`记录 ${index + 1}:`, {
      examination_date: exam.examination_date,
      name: exam.name,
      gkid: exam.gkid,
      // 根据选择的字段显示数据
      ...(props.fields.includes('axial_length') && {
        right_eye_axial_length: exam.right_eye_axial_length,
        left_eye_axial_length: exam.left_eye_axial_length
      }),
      ...(props.fields.includes('axial_ratio') && {
        right_axial_ratio: exam.right_axial_ratio,
        left_axial_ratio: exam.left_axial_ratio
      }),
      ...(props.fields.includes('axial_residual') && {
        right_axial_residual: exam.right_axial_residual,
        left_axial_residual: exam.left_axial_residual
      }),
      ...(props.fields.includes('height_weight') && {
        height: exam.height,
        weight: exam.weight
      })
    });
  });
  console.log('3. 扁平化后的数据 (flatExams):');
  flatExams.value.forEach((exam, index) => {
    console.log(`扁平化记录 ${index + 1}:`, {
      examination_date: exam.examination_date,
      name: exam.name,
      gkid: exam.gkid,
      // 根据选择的字段显示数据
      ...(props.fields.includes('axial_length') && {
        right_eye_axial_length: exam.right_eye_axial_length,
        left_eye_axial_length: exam.left_eye_axial_length
      }),
      ...(props.fields.includes('axial_ratio') && {
        right_axial_ratio: exam.right_axial_ratio,
        left_axial_ratio: exam.left_axial_ratio
      }),
      ...(props.fields.includes('axial_residual') && {
        right_axial_residual: exam.right_axial_residual,
        left_axial_residual: exam.left_axial_residual
      }),
      ...(props.fields.includes('height_weight') && {
        height: exam.height,
        weight: exam.weight
      })
    });
  });
});

// 折线图渲染（带数据标签，适合打印）
const chartImgUrl = ref('');

function renderAxialChart() {
  // 使用 flatExams 的数据，但需要按日期升序排序
  const sortedRows = [...flatExams.value]
    .filter(row => row && (row.right_eye_axial_length || row.left_eye_axial_length))
    .sort((a, b) => {
    if (!a.examination_date) return -1;
    if (!b.examination_date) return 1;
    return new Date(a.examination_date) - new Date(b.examination_date);
  });

  console.log('【调试】sortedRows:', sortedRows);

  if (!sortedRows || sortedRows.length === 0) {
    console.warn('没有可用的眼轴长度数据');
    return;
  }

  // 2. 提取日期和数据
  const dates = sortedRows.map(row => {
    if (!row.examination_date) return '-';
    const dateStr = row.examination_date.toString();
    return dateStr.replace(/-/g, '').slice(2);
  });

  const right = sortedRows.map(row => row.right_eye_axial_length ? Number(row.right_eye_axial_length) : null);
  const left = sortedRows.map(row => row.left_eye_axial_length ? Number(row.left_eye_axial_length) : null);

  console.log('【调试】dates:', dates);
  console.log('【调试】right:', right);
  console.log('【调试】left:', left);

  // 纵坐标极值扩展
  let allVals = [...right, ...left].filter(v => v != null);
  let minY = allVals.length ? Math.min(...allVals) : 0;
  let maxY = allVals.length ? Math.max(...allVals) : 1;
  minY = (minY - 0.1).toFixed(2) * 1;
  maxY = (maxY + 0.1).toFixed(2) * 1;

  console.log('【调试】minY:', minY, 'maxY:', maxY);

  const chartDom = document.getElementById(chartId.value);
  console.log('【调试】chartDom:', chartDom, 'chartId:', chartId.value);

  if (!chartDom) {
    console.warn('【调试】找不到图表容器', chartId.value);
    return;
  }

  try {
  // 清理旧的图表实例
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  if (echarts.getInstanceByDom(chartDom)) {
    echarts.dispose(chartDom);
  }
  chartInstance = echarts.init(chartDom);
  const myChart = chartInstance;
  
  // 计算缩放比例 - 基于A4预览区的实际缩放比例
  const scaleRatio = currentScaleRatio.value;
  
  // 根据缩放比例调整图表配置
  const baseFontSize = 12;
  const baseGridLeft = 60;
  const baseGridRight = 30;
  const baseGridTop = 60;
  const baseGridBottom = 60;
  const baseLineWidth = 2;
  
  // 获取图表容器的实际padding
  const chartContainer = document.getElementById(chartId.value);
  let containerPadding = Math.max(6, Math.round(12 * scaleRatio));
  if (chartContainer && chartContainer.style.padding) {
    const paddingMatch = chartContainer.style.padding.match(/(\d+)px/);
    if (paddingMatch) {
      containerPadding = parseInt(paddingMatch[1]);
    }
  }
  
  const fontSize = Math.max(8, Math.round(baseFontSize * scaleRatio));
  const gridConfig = {
    left: Math.max(20, Math.round(baseGridLeft * scaleRatio)),
    right: Math.max(10, Math.round(baseGridRight * scaleRatio)),
    top: Math.max(20, Math.round(baseGridTop * scaleRatio)),
    bottom: Math.max(20, Math.round(baseGridBottom * scaleRatio)),
    containLabel: true
  };
  const lineWidth = Math.max(1, baseLineWidth * scaleRatio);
  
  console.log('【图表缩放】scaleRatio:', scaleRatio, 'fontSize:', fontSize, 'lineWidth:', lineWidth, 'gridConfig:', gridConfig, 'containerPadding:', containerPadding);
  
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { 
      data: ['右眼', '左眼'],
      textStyle: { fontSize: fontSize }
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: dates.length > 5 ? 30 : 0,
        fontSize: fontSize,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '',
      min: minY,
      max: maxY,
      axisLabel: { fontSize: fontSize }
    },
    series: [
      {
        name: '右眼',
        type: 'line',
        data: right,
        smooth: true,
        showSymbol: true,
        itemStyle: { color: '#e74c3c' },
        lineStyle: { color: '#e74c3c', width: lineWidth },
        label: {
          show: true,
          position: 'top',
          color: '#e74c3c',
          fontWeight: 'bold',
          fontSize: fontSize,
          formatter: v => v.value != null ? v.value.toFixed(2) : ''
        }
      },
      {
        name: '左眼',
        type: 'line',
        data: left,
        smooth: true,
        showSymbol: true,
        itemStyle: { color: '#5dade2' },
        lineStyle: { color: '#5dade2', width: lineWidth },
        label: {
          show: true,
          position: 'top',
          color: '#5dade2',
          fontWeight: 'bold',
          fontSize: fontSize,
          formatter: v => v.value != null ? v.value.toFixed(2) : ''
        }
      }
    ],
    grid: gridConfig
  };
  console.log('【调试】option:', option);

  myChart.setOption(option);

  // 渲染完成后保存图片（不影响前端展示echarts）
  setTimeout(() => {
      try {
    const base64 = myChart.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' });
        if (base64) {
    chartImgUrl.value = base64;
    console.log('【调试】chartImgUrl:', base64.slice(0, 100));
        } else {
          console.warn('获取图表图片失败');
        }
      } catch (err) {
        console.error('保存图表图片时出错:', err);
      }
    }, 300);
  } catch (err) {
    console.error('渲染图表时出错:', err);
  }
}

// 自动缩放A4预览区，保证视觉上始终A4比例最大化显示
function fitA4Box() {
  const box = document.querySelector('.a4-preview-box');
  if (!box) return;
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  const scaleW = window.innerWidth / A4_WIDTH;
  const scaleH = window.innerHeight / A4_HEIGHT;
  const scale = Math.min(scaleW, scaleH, 1); // 只缩小不放大
  box.style.transform = `scale(${scale})`;
  box.style.transformOrigin = 'top left';
}

// 保存图表实例的引用
let chartInstance = null;

onMounted(() => {
  console.log('PrintPreview mounted');
  console.log('PrintPreview initial exams:', props.exams);
  console.log('PrintPreview initial fields:', props.fields);
  
  // 加载保存的logo样式
  loadLogoStyle();
  
  nextTick(() => {
    renderAxialChart();
  });
  fitA4Box();
  // 初始化缩放比例
  updateScaleRatio();
  
  window.addEventListener('resize', () => {
    fitA4Box();
    // 更新缩放比例
    updateScaleRatio();
    // 延迟重新渲染图表，确保容器尺寸已经调整
    setTimeout(() => {
      if (chartInstance) {
        chartInstance.resize();
        // 重新渲染图表以适应新的缩放比例
        renderAxialChart();
      }
    }, 200);
  });
  
  // 监听图表容器大小变化
  const resizeObserver = new ResizeObserver(() => {
    if (chartInstance) {
      chartInstance.resize();
    }
  });
  
  // 观察图表容器
  const chartContainer = document.getElementById(chartId.value);
  if (chartContainer) {
    resizeObserver.observe(chartContainer);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', fitA4Box);
  // 清理图表实例
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});

// 监听 sortOrder 变化，重新渲染图表
watch(() => props.sortOrder, () => {
  nextTick(() => {
    renderAxialChart();
  });
});

// 监听 exams 变化，重新渲染图表
watch(() => props.exams, () => {
  nextTick(() => {
    renderAxialChart();
  });
}, { deep: true });

const tableColCount = computed(() => {
  // 1固定日期列 + 其余动态列
  let count = 1;
  if (fields.value.includes('naked_vision')) count++;
  if (fields.value.includes('corrected_vision')) count++;
  if (fields.value.includes('old_glasses')) count++;
  if (fields.value.includes('objective_refraction')) count++;
  if (fields.value.includes('axial_length')) count++;
  if (fields.value.includes('axial_ratio')) count++;
  if (fields.value.includes('axial_residual')) count++;
  if (fields.value.includes('height_weight')) count++;
  return count;
});

// 获取轴余的样式
const getAxialResidualStyle = (value) => {
  if (!value || isNaN(value)) return {};

  const num = parseFloat(value);
  const absValue = Math.abs(num);

  // 根据绝对值大小计算颜色深度
  const intensity = Math.min(absValue / 0.5, 1); // 0.5mm作为最大深度参考值

  if (num > 0) {
    // 正值用红色，颜色深度随值增大而加深
    return {
      color: `rgba(231, 76, 60, ${0.5 + intensity * 0.5})`, // 从浅红到深红
      fontWeight: 'bold'
    };
  } else if (num < 0) {
    // 负值用绿色，颜色深度随绝对值增大而加深
    return {
      color: `rgba(39, 174, 96, ${0.5 + intensity * 0.5})`, // 从浅绿到深绿
      fontWeight: 'bold'
    };
  }

  return {};
};

// 处理logo加载错误
const handleLogoError = (event) => {
  console.error('[PrintPreview] Logo加载失败:', event.target.src);
  // 可以在这里添加一些错误处理逻辑，比如显示默认logo或者隐藏logo
};

watch(
  () => [props.reviewDate, props.fields, props.logoUrl, props.orgName, props.sortOrder, props.exams],
  (vals) => {
    console.log('[PrintPreview] 打印设置变动:', vals);
  },
  { deep: true }
);

defineExpose({ 
  chartImgUrl,
  logoStyle,
  isEditingLogo,
  showLogoEditPanel,
  toggleLogoEdit,
  toggleLogoEditPanel,
  resetLogoStyle,
  saveLogoStyle
});
</script>
