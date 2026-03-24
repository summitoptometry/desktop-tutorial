<template>
  <div class="exam-results-unified exam-sheet-wrap">
    <RoutineExamStyleTwo
      :record="record"
      :view-mode="routineViewMode"
      :section-expanded="sectionExpandedAll"
      :enable-collapse="false"
      :show-only-section="null"
      :show-section-titles-in-view="true"
      :report-layout="true"
      :previous-record="previousRecord"
      :examination-records="examinationRecords"
      @toggle-section="emit('toggle-section', $event)"
      @update-record="emit('update-record', $event)"
    >
      <template #report-after-vision>
        <BiometryExamStyleTwo
          :record="record"
          :view-mode="biometryViewMode"
          :section-expanded="sectionExpandedAll"
          :enable-collapse="false"
          :report-layout="true"
          :previous-record="previousRecord"
          @toggle-section="emit('toggle-section', $event)"
          @update-record="emit('update-record', $event)"
        />
      </template>
    </RoutineExamStyleTwo>
    <FunctionalExamStyleTwo
      :record="record"
      :previous-record="previousRecord"
      :examination-records="examinationRecords"
      :view-mode="functionalViewMode"
      :section-expanded="sectionExpandedAll"
      :enable-collapse="false"
      :report-layout="true"
      :show-only-section="'functional-core'"
      :patient-id="patientId"
      :patient-info="patientInfo"
      @toggle-section="emit('toggle-section', $event)"
      @update-record="emit('update-record', $event)"
      @refresh="emit('refresh')"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import RoutineExamStyleTwo from './RoutineExamStyleTwo.vue';
import BiometryExamStyleTwo from './BiometryExamStyleTwo.vue';
import FunctionalExamStyleTwo from './FunctionalExamStyleTwo.vue';

defineProps({
  record: {
    type: Object,
    default: () => ({})
  },
  previousRecord: {
    type: Object,
    default: null
  },
  examinationRecords: {
    type: Array,
    default: () => []
  },
  patientId: {
    type: [Number, String],
    default: null
  },
  patientInfo: {
    type: Object,
    default: () => ({})
  },
  routineViewMode: {
    type: String,
    default: 'view'
  },
  biometryViewMode: {
    type: String,
    default: 'view'
  },
  functionalViewMode: {
    type: String,
    default: 'view'
  }
});

const emit = defineEmits(['toggle-section', 'update-record', 'refresh']);

/** 单页连续展示：子板块全部视为展开 */
const sectionExpandedAll = computed(() => ({
  routine: true,
  vision: true,
  'objective-refraction': true,
  'subjective-refraction': true,
  biometry: true,
  'eye-position': true,
  'ac-aca': true,
  accommodation: true,
  functional: true,
  'other-related': true,
  synoptophore: true,
  analysis: true
}));
</script>

<style scoped lang="scss">
.exam-results-unified {
  width: 100%;
  box-sizing: border-box;
  /* 与 RoutineExamStyleTwo 中基础检查「身高」等数值格同字号（--exr-font-body: 11px） */
  --exr-font-body: 11px;
  --exr-font-th: 11px;
  --exr-pad-td: 0 2px;
  --exr-pad-th: 3px 2px;
  --exr-line: 1.2;
  --exr-input-h: 28px;
  /* 与输入框同高，避免查看态行高与编辑态不一致 */
  --exr-row-min-h: var(--exr-input-h);
  /* 表内下拉：略矮于输入框（覆盖 Ant 默认约 32px+ 内边距导致 ~37px） */
  --exr-select-h: 22px;
  --exr-cell-border: #b0d4e8;
  /* 左侧栏（淡蓝） */
  --exr-side-bg: #cceaf5;
  --exr-routine-header-row-bg: #dff3fb;
  /* 表头下一格：右眼/左眼 */
  --exr-routine-eye-label-bg: #f0f9fd;
  /* 区块标题 / 大表头首行 */
  --exr-header-dark: #dff3fb;
  --exr-header-dark-border: #b0d4e8;
  --exr-header-dark-text: #2a3542;
  /* 默认 thead / 次表头 */
  --exr-header-soft: #f0f9fd;
  --exr-header-soft2: #e8ecf2;
  --exr-header-sub-blue: #f0f9fd;
  --exr-focus-cell-bg: #f0f9eb;
  /* 各检查区块之间仅一层留白（宜小，避免与内边距叠加成「双层」） */
  --exr-table-gap: 2px;
}

/* 统一报告：表格本身不再单独留底边距，只由外层 section-block 控制区块间距 */
.exam-results-unified :deep(.exam-sheet) {
  margin-bottom: 0 !important;
}

/* 基础检查+检影同一行：不再额外 margin-bottom，与下方视力表间距与其它区块一致 */
.exam-results-unified :deep(.exam-report-basic-retinoscopy-row) {
  margin-bottom: 0 !important;
}

/* 生物测量：v-else 外层 div 不再叠一层留白（仅 .section-block 承担间距） */
.exam-results-unified :deep(.biometry-exam-style-two > div:not(.section-block)) {
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}

/* section-block 内包裹表格的 div（v-show）：避免再叠 margin/padding */
.exam-results-unified :deep(.routine-exam-style-two .section-block > div),
.exam-results-unified :deep(.biometry-exam-style-two .section-block > div),
.exam-results-unified :deep(.functional-exam-style-two .section-block > div) {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

/* 视功能最后一块：底部不再重复留白 */
.exam-results-unified :deep(.functional-exam-style-two > .section-block:last-child) {
  margin-bottom: 0 !important;
}

/* 报告式 .exam-sheet：scoped 穿透，压过 ant-design-vue 对 Select 的默认 min-height/padding（否则约 37px） */
.exam-results-unified :deep(.exam-sheet .ant-select .ant-select-selector) {
  min-height: var(--exr-select-h) !important;
  height: var(--exr-select-h) !important;
  max-height: var(--exr-select-h) !important;
  box-sizing: border-box !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  padding-inline-start: 2px !important;
  padding-inline-end: 10px !important;
  line-height: calc(var(--exr-select-h) - 2px) !important;
}

.exam-results-unified :deep(.exam-sheet .ant-select .ant-select-selection-item),
.exam-results-unified :deep(.exam-sheet .ant-select .ant-select-selection-placeholder) {
  font-size: calc(var(--exr-font-body) - 1px) !important;
  line-height: calc(var(--exr-select-h) - 2px) !important;
}

/* 主觉验光报告表「双眼」行：与眼别 th.eye-cell.eye-name 同字号（覆盖上行 body-1px） */
.exam-results-unified :deep(.exam-sheet.exam-table-subjective-refraction .cell-field.dominant-eye-pd-report),
.exam-results-unified :deep(.exam-sheet.exam-table-subjective-refraction .cell-field.dominant-eye-pd-report .dominant-eye-pd-item),
.exam-results-unified :deep(.exam-sheet.exam-table-subjective-refraction .cell-field.dominant-eye-pd-report .dominant-eye-pd-label),
.exam-results-unified :deep(.exam-sheet.exam-table-subjective-refraction .cell-field.dominant-eye-pd-report .pupil-distance-unit) {
  font-size: max(8px, calc(var(--exr-font-body, 11px) - 2px)) !important;
}

.exam-results-unified :deep(.exam-sheet.exam-table-subjective-refraction .dominant-eye-pd-report .dominant-eye-toggle-btn) {
  font-size: max(8px, calc(var(--exr-font-body, 11px) - 3px)) !important;
}

.exam-results-unified :deep(.exam-sheet.exam-table-subjective-refraction .dominant-eye-pd-report .ant-input:not(textarea)) {
  font-size: max(8px, calc(var(--exr-font-body, 11px) - 2px)) !important;
}

.exam-results-unified :deep(.exam-sheet .ant-select-arrow) {
  width: 10px !important;
  height: 10px !important;
  margin-top: -5px !important;
}

/* 与报告截图接近：大表头色条主标题 + 细线紧凑表格 */
/* 子组件内 :not(:has(.section-title)) 会写 margin-bottom:20px、padding-bottom:12px，此处用 !important 压掉，区块之间只保留一层 --exr-table-gap */
.exam-results-unified :deep(.routine-exam-style-two),
.exam-results-unified :deep(.biometry-exam-style-two),
.exam-results-unified :deep(.functional-exam-style-two) {
  .section-block {
    gap: 0 !important;
    margin-top: 0 !important;
    margin-bottom: var(--exr-table-gap) !important;
    padding-bottom: 0 !important;
    border-bottom: none !important;

    &.collapsed {
      margin-bottom: var(--exr-table-gap) !important;
      padding-bottom: 0 !important;
      gap: 0 !important;
    }
  }

  .section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--exr-header-dark-text);
    margin: 0 !important;
    padding: 3px 6px;
    line-height: 1.15;
    background: var(--exr-header-dark);
    /* 仅上圆角，底边与表格顶线对齐、无视觉缝隙 */
    border-radius: 2px 2px 0 0;
    border: 1px solid var(--exr-header-dark-border);
    border-left-width: 3px;
    /* 底边不设边框，由表格首行上边框贴合，避免标题与表头之间出现空隙 */
    border-bottom: none;
    letter-spacing: 0.01em;

    &::before,
    &::after {
      display: none;
    }
  }

  .section-block > .section-title + div {
    margin-top: 0;
    padding-top: 0;
  }

  .section-toggle-icon {
    color: rgba(42, 53, 66, 0.62);
    font-size: 11px;
  }

  table:not(.exam-sheet) {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    font-size: var(--exr-font-body);
    line-height: var(--exr-line);
  }

  table:not(.exam-sheet) th,
  table:not(.exam-sheet) td {
    border: 1px solid var(--exr-cell-border);
    padding: var(--exr-pad-td);
    vertical-align: middle;
    text-align: center;
    box-sizing: border-box;
  }

  table:not(.exam-sheet) thead th {
    background: var(--exr-header-soft);
    color: #1a1a1a;
    font-weight: 600;
    font-size: var(--exr-font-th);
    padding: var(--exr-pad-th);
    line-height: 1.15;
    vertical-align: middle;
    text-align: center;
  }

  /*
   * 客观/生物/主觉/AC/A、调节与眼位 — 首行大表头，次行次表头
   */
  :deep(.accommodation-report-table:not(.exam-sheet)) thead tr:first-child th:not(.report-section-side-title),
  :deep(.eye-position-table:not(.exam-sheet)) thead tr:first-child th:not(.report-section-side-title),
  :deep(.objective-report-by-eye:not(.exam-sheet)) thead tr:first-child th:not(.report-section-side-title),
  :deep(.biometry-report-by-eye:not(.exam-sheet)) thead tr:first-child th:not(.report-section-side-title),
  :deep(.aca-report-table) thead tr:first-child th:not(.report-section-side-title),
  :deep(.refraction-table.subjective-table:not(.exam-sheet)) thead tr:first-child th:not(.report-section-side-title) {
    background: var(--exr-header-dark) !important;
    color: var(--exr-header-dark-text) !important;
    border-color: var(--exr-header-dark-border) !important;
    font-weight: 600;
    font-size: var(--exr-font-th);
  }

  :deep(.accommodation-report-table:not(.exam-sheet)) thead tr:nth-child(2) th,
  :deep(.eye-position-table:not(.exam-sheet)) thead tr:nth-child(2) th {
    background: var(--exr-header-sub-blue) !important;
    color: #1a1a1a !important;
    border-color: var(--exr-header-dark-border) !important;
    font-weight: 600;
    font-size: var(--exr-font-th);
  }

  :deep(.objective-report-by-eye:not(.exam-sheet)) tbody tr:nth-child(odd) td,
  :deep(.biometry-report-by-eye:not(.exam-sheet)) tbody tr:nth-child(odd) td,
  :deep(.refraction-table.subjective-table:not(.exam-sheet)) tbody tr:nth-child(odd) td,
  :deep(.accommodation-report-table:not(.exam-sheet)) tbody tr:nth-child(odd) td,
  :deep(.aca-report-table) tbody tr:nth-child(odd) td,
  :deep(.eye-position-table:not(.exam-sheet)) tbody tr:nth-child(odd) td {
    background: #f5f7fa !important;
  }

  :deep(.objective-report-by-eye:not(.exam-sheet)) tbody tr:nth-child(even) td,
  :deep(.biometry-report-by-eye:not(.exam-sheet)) tbody tr:nth-child(even) td,
  :deep(.refraction-table.subjective-table:not(.exam-sheet)) tbody tr:nth-child(even) td,
  :deep(.accommodation-report-table:not(.exam-sheet)) tbody tr:nth-child(even) td,
  :deep(.aca-report-table) tbody tr:nth-child(even) td,
  :deep(.eye-position-table:not(.exam-sheet)) tbody tr:nth-child(even) td {
    background: #fff !important;
  }

  :deep(.vision-report-by-eye:not(.exam-table-vision)) tbody td.cell-muted {
    background: #fafafa !important;
    color: #8c8c8c !important;
  }

  /* 报告式：左侧竖条（不含 exam-sheet，由 exam-sheet.css 控制） */
  table:not(.exam-sheet) th.report-section-side-title {
    width: 28px !important;
    min-width: 28px !important;
    max-width: 32px !important;
    padding: 4px 2px !important;
    background: var(--exr-side-bg) !important;
    color: var(--exr-header-dark-text) !important;
    font-size: var(--exr-font-body) !important;
    font-weight: 600;
    line-height: 1.15;
    vertical-align: middle !important;
    text-align: center !important;
    writing-mode: vertical-rl !important;
    text-orientation: upright !important;
    letter-spacing: 0.12em;
    white-space: nowrap;
    border-color: var(--exr-header-dark-border) !important;
    border-right-color: var(--exr-cell-border) !important;
  }

  table:not(.exam-sheet) th.report-section-side-title.clickable {
    cursor: pointer;
  }

  .report-section-side-title-text {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-height: 100%;
  }

  .report-section-side-toggle {
    display: block;
    margin-top: 2px;
    color: rgba(42, 53, 66, 0.72);
    font-size: 9px;
    writing-mode: horizontal-tb;
  }

  table:not(.exam-sheet) tbody td {
    font-size: var(--exr-font-body);
    line-height: var(--exr-line);
    min-height: var(--exr-row-min-h);
  }

  table:not(.exam-sheet) tbody td:has(.ant-input-focused),
  table:not(.exam-sheet) tbody td:has(.ant-input-affix-wrapper-focused),
  table:not(.exam-sheet) tbody td:has(.ant-input-number-focused),
  table:not(.exam-sheet) tbody td:has(.ant-select-focused) {
    background: var(--exr-focus-cell-bg) !important;
  }

  /* 全局：与表格一致的方角，避免 Ant 默认大圆角 */
  :deep(.ant-input),
  :deep(.ant-input-number),
  :deep(.ant-select .ant-select-selector) {
    border-radius: 0 !important;
  }

  /* 表内表单控件 */
  :deep(.ant-input),
  :deep(.ant-input-number),
  :deep(.ant-select) {
    font-size: var(--exr-font-body) !important;
  }

  /* 非报告式 exam-sheet：数字框紧凑行高；exam-sheet 内由 exam-sheet.css 统一，避免 line-height:1 导致球镜数值不垂直居中 */
  table:not(.exam-sheet) :deep(.ant-input-number) {
    line-height: 1;
  }

  table:not(.exam-sheet) :deep(.ant-input-number-input-wrap) {
    height: calc(var(--exr-input-h) - 2px);
  }

  table:not(.exam-sheet) :deep(.ant-input-number-input) {
    height: calc(var(--exr-input-h) - 2px);
    padding: 0 2px;
    font-size: var(--exr-font-body);
    line-height: calc(var(--exr-input-h) - 2px);
    text-align: center;
  }

  :deep(.ant-input-number-handler-wrap) {
    width: 12px;
    border-left: 1px solid var(--exr-cell-border) !important;
    background: rgba(255, 255, 255, 0.7) !important;
  }

  :deep(.ant-input-number-handler) {
    height: calc((var(--exr-input-h) - 2px) / 2);
    line-height: 1;
  }

  :deep(.ant-input) {
    padding: 0 2px;
    min-height: var(--exr-input-h);
    line-height: calc(var(--exr-input-h) - 2px);
    text-align: center;
  }

  :deep(.vision-combined-input) {
    font-size: var(--exr-font-body) !important;
    height: var(--exr-input-h) !important;
    min-height: var(--exr-input-h) !important;
    padding: 0 2px !important;
    line-height: calc(var(--exr-input-h) - 2px) !important;
    box-sizing: border-box;
    text-align: center;
  }

  /* 报告式 exam-sheet 视力表：原生视力框与眼压格一致（全局 exam-sheet.css 已写，此处补一层防 scoped 穿透差异） */
  :deep(.exam-sheet.exam-table-vision .vision-combined-input),
  :deep(.exam-sheet.exam-table-vision .vision-edit-display) {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  :deep(.ant-input-textarea textarea.ant-input) {
    min-height: 36px !important;
    padding: 2px 2px !important;
    font-size: var(--exr-font-body) !important;
    line-height: var(--exr-line) !important;
  }

  :deep(.ant-select-selector) {
    min-height: var(--exr-select-h) !important;
    height: var(--exr-select-h) !important;
    padding: 0 2px !important;
    padding-inline-end: 11px !important;
    align-items: center !important;
    display: flex !important;
  }

  :deep(.ant-select-selection-item),
  :deep(.ant-select-selection-placeholder) {
    line-height: calc(var(--exr-select-h) - 2px) !important;
    font-size: var(--exr-font-body) !important;
    padding-inline-end: 0 !important;
  }

  :deep(.ant-select-single .ant-select-selector .ant-select-selection-item),
  :deep(.ant-select-single .ant-select-selector .ant-select-selection-placeholder) {
    line-height: calc(var(--exr-select-h) - 2px) !important;
  }

  :deep(.ant-select-arrow) {
    inset-inline-end: 1px !important;
    width: 10px !important;
    height: 10px !important;
    margin-top: -5px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  :deep(.ant-select-arrow .anticon) {
    font-size: 10px !important;
  }

  /* 表内下拉占满单元格宽 */
  table:not(.exam-sheet) :deep(.ant-select) {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }

  /* 主导眼：右眼/左眼按钮组与标签同一行，不占满整格 */
  table:not(.exam-sheet) :deep(.dominant-eye-toggle-group) {
    width: auto !important;
    max-width: none !important;
    min-width: 0 !important;
    flex: 0 0 auto;
  }

  table:not(.exam-sheet) :deep(.dominant-eye-toggle-btn) {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: max(9px, calc(var(--exr-font-body, 11px) - 2px)) !important;
    font-weight: 500 !important;
    line-height: normal !important;
    text-align: center !important;
  }

  /* 瞳距输入：窄框、与 mm 间距小 */
  table:not(.exam-sheet) :deep(.pupil-distance-input) {
    width: 4.8ch !important;
    min-width: 4ch !important;
    max-width: 5.5ch !important;
    flex: 0 0 auto !important;
  }

  table:not(.exam-sheet) :deep(.pupil-distance-input .ant-input) {
    padding-left: 2px !important;
    padding-right: 2px !important;
  }

  table:not(.exam-sheet) :deep(.pupil-distance-unit) {
    margin-left: 0 !important;
  }

  /* 旧镜类型等：不要撑满整格时过宽 */
  table:not(.exam-sheet) :deep(.glasses-type-select.ant-select),
  table:not(.exam-sheet) :deep(.vision-value-select.ant-select) {
    max-width: 100%;
  }

  table:not(.exam-sheet) :deep(.prescription-input-group) {
    display: flex;
    gap: 0;
    align-items: stretch;
    width: 100%;
    min-width: 0;
  }

  table:not(.exam-sheet) :deep(.prescription-input-group .ant-input-number),
  table:not(.exam-sheet) :deep(.prescription-input-group .ant-input) {
    flex: 1 1 0;
    min-width: 0;
  }

  table:not(.exam-sheet) :deep(.prescription-input.prescription-axis) {
    flex: 0 1 40px;
    max-width: 48px;
  }

  /* 表内控件：无线框，由 td 格线围合（与截图一致、避免双线） */
  table:not(.exam-sheet) :deep(.ant-input-number) {
    width: 100% !important;
    max-width: 100%;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  table:not(.exam-sheet) :deep(.ant-input-number-focused),
  table:not(.exam-sheet) :deep(.ant-input-number:hover) {
    border: none !important;
    box-shadow: none !important;
  }

  table:not(.exam-sheet) :deep(.ant-input-number-input) {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    text-align: center;
  }

  table:not(.exam-sheet) :deep(.ant-input:not(textarea)) {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
    text-align: center;
  }

  table:not(.exam-sheet) :deep(.ant-input:focus),
  table:not(.exam-sheet) :deep(.ant-input-focused),
  table:not(.exam-sheet) :deep(.ant-input-affix-wrapper-focused) {
    border: none !important;
    box-shadow: none !important;
  }

  table:not(.exam-sheet) :deep(.ant-input-affix-wrapper) {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    padding: 0 2px !important;
    min-height: var(--exr-input-h) !important;
    background: transparent !important;
  }

  table:not(.exam-sheet) :deep(.ant-input-affix-wrapper .ant-input) {
    border: none !important;
    box-shadow: none !important;
    min-height: auto !important;
    text-align: center;
  }

  table:not(.exam-sheet) :deep(.ant-select:not(.ant-select-disabled) .ant-select-selector) {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  table:not(.exam-sheet) :deep(.ant-select-focused:not(.ant-select-disabled) .ant-select-selector) {
    border: none !important;
    box-shadow: none !important;
  }

  table:not(.exam-sheet) :deep(.vision-combined-input) {
    border: none !important;
    outline: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    width: 100% !important;
    max-width: 100%;
    box-sizing: border-box !important;
    background: transparent !important;
  }

  table:not(.exam-sheet) :deep(textarea.ant-input) {
    border: 1px solid var(--exr-cell-border) !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  /* 覆盖子组件内报告表的固定字号，与统一变量一致 */
  :deep(.routine-report-by-eye:not(.exam-table-basic)) th,
  :deep(.routine-report-by-eye:not(.exam-table-basic)) td,
  :deep(.objective-report-by-eye:not(.exam-sheet)) th,
  :deep(.objective-report-by-eye:not(.exam-sheet)) td,
  :deep(.vision-report-by-eye:not(.exam-table-vision)) th,
  :deep(.vision-report-by-eye:not(.exam-table-vision)) td,
  :deep(.biometry-report-by-eye:not(.exam-sheet)) th,
  :deep(.biometry-report-by-eye:not(.exam-sheet)) td,
  :deep(.accommodation-report-table:not(.exam-sheet)) th,
  :deep(.accommodation-report-table:not(.exam-sheet)) td,
  :deep(.aca-report-table) th,
  :deep(.aca-report-table) td {
    font-size: var(--exr-font-body) !important;
    padding: var(--exr-pad-td) !important;
    line-height: var(--exr-line) !important;
  }

  :deep(.objective-report-by-eye:not(.exam-sheet)) thead th:not(.report-section-side-title),
  :deep(.biometry-report-by-eye:not(.exam-sheet)) thead th:not(.report-section-side-title),
  :deep(.accommodation-report-table:not(.exam-sheet)) thead th:not(.report-section-side-title),
  :deep(.aca-report-table) thead th:not(.report-section-side-title) {
    font-size: var(--exr-font-th) !important;
    padding: var(--exr-pad-th) !important;
  }

  :deep(.refraction-table.subjective-table:not(.exam-sheet)) th,
  :deep(.refraction-table.subjective-table:not(.exam-sheet)) td {
    font-size: var(--exr-font-body) !important;
    padding: var(--exr-pad-td) !important;
    line-height: var(--exr-line) !important;
  }

  :deep(.refraction-table.subjective-table:not(.exam-sheet)) thead th:not(.report-section-side-title) {
    font-size: var(--exr-font-th) !important;
    padding: var(--exr-pad-th) !important;
  }

  :deep(.aca-report-table td.aca-report-result) {
    text-align: left !important;
    vertical-align: middle !important;
  }

  :deep(.vision-table:not(.exam-table-vision)) td.vision-label {
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
  }
}

/* 报告式 .exam-sheet：scoped 穿透，压过 ant-design-vue 对 Select 的默认 min-height/padding */
.exam-results-unified :deep(.exam-sheet .ant-select .ant-select-selector) {
  min-height: var(--exr-select-h) !important;
  height: var(--exr-select-h) !important;
  max-height: var(--exr-select-h) !important;
  box-sizing: border-box !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  padding-inline-start: 2px !important;
  padding-inline-end: 10px !important;
  line-height: calc(var(--exr-select-h) - 2px) !important;
}

.exam-results-unified :deep(.exam-sheet .ant-select .ant-select-selection-item),
.exam-results-unified :deep(.exam-sheet .ant-select .ant-select-selection-placeholder) {
  font-size: calc(var(--exr-font-body) - 1px) !important;
  line-height: calc(var(--exr-select-h) - 2px) !important;
}

.exam-results-unified :deep(.exam-sheet .ant-select-arrow) {
  width: 10px !important;
  height: 10px !important;
  margin-top: -5px !important;
}

.exam-results-unified :deep(.functional-exam-style-two) {
  .eye-position-table:not(.exam-sheet) th,
  .eye-position-table:not(.exam-sheet) td {
    border: 1px solid #b0d4e8;
    padding: var(--exr-pad-td);
    font-size: var(--exr-font-body);
  }

  .eye-position-table:not(.exam-sheet) thead th {
    background: #f0f9fd;
    color: #1a1a1a;
    font-size: var(--exr-font-th);
    padding: var(--exr-pad-th);
    line-height: 1.1;
  }

  .eye-position-table:not(.exam-sheet) thead th.report-section-side-title {
    background: var(--exr-side-bg) !important;
    color: var(--exr-header-dark-text) !important;
    font-size: var(--exr-font-body) !important;
    font-weight: 600;
    writing-mode: vertical-rl !important;
    text-orientation: upright !important;
    width: 26px !important;
    min-width: 26px !important;
    max-width: 30px !important;
    padding: 4px 3px !important;
    letter-spacing: 0.14em;
    vertical-align: middle !important;
  }

  .func-exam-col {
    border: 1px solid #b0d4e8;
    border-radius: 2px;
  }

  .func-table-header {
    background: #f0f9fd;
    color: #1a1a1a;
    border-bottom: 1px solid #b0d4e8;
    font-size: var(--exr-font-th);
    min-height: auto;
    line-height: 1.15;
  }

  .func-table-col {
    border-right: 1px solid #b0d4e8;
    padding: var(--exr-pad-td);
    font-size: var(--exr-font-body);
    line-height: var(--exr-line);
  }

  .func-table-col.item {
    color: #1a1a1a;
  }

  .func-table-row + .func-table-row {
    border-top: 1px solid #d9d9d9;
  }

  /* AC/A 等 div 表格：控件边框与报告表一致 */
  .func-exam-col :deep(.ant-input-number),
  .func-exam-col :deep(.ant-input:not(textarea)) {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .func-exam-col :deep(.ant-select:not(.ant-select-disabled) .ant-select-selector) {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .eye-position-table:not(.exam-sheet) :deep(.ant-input-number),
  .eye-position-table:not(.exam-sheet) :deep(.ant-input:not(textarea)),
  .eye-position-table:not(.exam-sheet) :deep(.ant-select:not(.ant-select-disabled) .ant-select-selector) {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  :deep(.accommodation-report-table:not(.exam-sheet) .col-eye) {
    width: 32px !important;
    font-size: var(--exr-font-th) !important;
  }
}

/* 检查结果统一页：随视口压缩字号与控件高度，减轻横向溢出 */
@media (max-width: 1199px) {
  .exam-results-unified {
    --exr-font-body: 11px;
    --exr-font-th: 11px;
    --exr-input-h: 26px;
    --exr-row-min-h: 26px;
    --exr-select-h: 20px;
  }
}

@media (max-width: 991px) {
  .exam-results-unified {
    --exr-font-body: 10.5px;
    --exr-font-th: 10.5px;
    --exr-input-h: 25px;
    --exr-row-min-h: 25px;
    --exr-select-h: 20px;
    --exr-pad-td: 0 1px;
    --exr-pad-th: 2px 1px;
  }
}

@media (max-width: 767px) {
  .exam-results-unified {
    --exr-font-body: 10px;
    --exr-font-th: 10px;
    --exr-input-h: 24px;
    --exr-row-min-h: 24px;
    --exr-select-h: 19px;
    --exr-pad-td: 0 1px;
    --exr-pad-th: 2px 1px;
    --exr-table-gap: 2px;
  }

  .exam-results-unified :deep(.routine-exam-style-two),
  .exam-results-unified :deep(.biometry-exam-style-two),
  .exam-results-unified :deep(.functional-exam-style-two) {
    .section-title {
      font-size: 11px;
      padding: 2px 4px;
    }
  }
}
</style>
