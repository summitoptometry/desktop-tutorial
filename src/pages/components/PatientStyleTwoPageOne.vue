<template>
  <div class="page-one-container">
    <!-- 编辑态：检查间隔 → 诊断插槽 → 备注（草图顺序） -->
    <template v-if="viewMode === 'edit'">
      <div class="clinical-edit-mockup">
        <div class="clinical-edit-mockup__header">
        <div class="clinical-edit-mockup__interval-row">
          <div class="clinical-edit-mockup__interval-group clinical-edit-mockup__interval-group--with-sync">
            <span
              class="clinical-edit-mockup__interval-label"
              title="根据与当前检查相对应的上一条检查记录与本次检查的日期，计算相隔天数"
            >距上一条检查间隔时间：</span>
            <span class="clinical-edit-mockup__interval-value">{{ computedExamIntervalDisplay }}</span>
            <div
              class="clinical-edit-mockup__sync-from-prev"
              role="group"
              aria-label="从与当前检查相对应的上一条检查记录同步"
            >
              <button
                type="button"
                class="clinical-edit-mockup__sync-btn"
                :class="{ 'clinical-edit-mockup__sync-btn--active': diagnosisSyncActive }"
                :title="syncPrevRecordTooltip"
                @click="emit('sync-previous-diagnosis')"
              >
                同步诊断
              </button>
              <button
                type="button"
                class="clinical-edit-mockup__sync-btn"
                :class="{ 'clinical-edit-mockup__sync-btn--active': syncSchemeFromPrevActive }"
                :title="syncPrevRecordTooltip"
                @click="toggleSyncSchemeFromPrevious"
              >
                同步方案
              </button>
              <button
                type="button"
                class="clinical-edit-mockup__sync-btn"
                :class="{ 'clinical-edit-mockup__sync-btn--active': syncRemarksFromPrevActive }"
                :title="syncPrevRecordTooltip"
                @click="toggleSyncRemarksFromPrevious"
              >
                同步建议
              </button>
            </div>
          </div>
          <div class="clinical-edit-mockup__review-stack">
            <div class="clinical-edit-mockup__review-date-group">
              <span class="clinical-edit-mockup__interval-label">下次复查日期：</span>
              <a-date-picker
                v-model:value="editForm.review_date"
                class="clinical-edit-mockup__review-date-picker"
                size="small"
                format="YYYY-MM-DD"
                @change="updatePeriodBasedOnReviewDate"
                :locale="locale"
                placeholder="选择日期"
              />
            </div>
            <div
              v-if="editForm.review_interval_days === 0"
              class="clinical-edit-mockup__dates clinical-edit-mockup__dates--appointment-only clinical-edit-mockup__dates--under-review"
            >
              <div class="clinical-edit-mockup__date-item clinical-edit-mockup__date-item--appointment-doctor">
                <span class="clinical-edit-mockup__interval-label">预约医生：</span>
                <a-select
                  v-model:value="editForm.appointment_doctor"
                  class="clinical-edit-mockup__appointment-doctor-select"
                  placeholder="选择预约医生"
                  :loading="doctorListLoading"
                  :options="doctorList"
                  :field-names="{ label: 'name', value: 'id' }"
                />
              </div>
            </div>
          </div>
        </div>
        </div>
        <slot name="diagnosis" />
      <!-- 4. 诊疗方案 -->
      <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasTreatmentPlanData" 
           v-show="(showOnlySection === null || showOnlySection === 'treatment-plan') && (viewMode !== 'print' || (printSelectedSections && printSelectedSections.includes('treatment-plan')))"
           class="treatment-plan-section"
           :class="{ 'collapsed': collapseEnabled && !sectionExpanded?.['treatment-plan'] }">
        <div v-show="viewMode === 'print' || (collapseEnabled ? sectionExpanded?.['treatment-plan'] : true)">
        <div class="treatment-plan-rx treatment-plan-rx--edit">
          <div class="treatment-plan-rx__title-row">
            <div class="treatment-plan-rx__title">诊疗方案 <span class="treatment-plan-rx__rx">Rx</span>：</div>
            <button type="button" class="treatment-plan-rx__scheme-btn" @click="openSchemeModal">
              <span class="treatment-plan-rx__scheme-btn-text">方案选择</span>
              <span class="treatment-plan-rx__scheme-btn-hover-content">
                <span>方案选择</span>
                <span class="treatment-plan-rx__scheme-btn-arrow">→</span>
              </span>
            </button>
          </div>
          <div class="treatment-plan-rx__selected-list">
            <div
              v-for="(item, idx) in selectedSchemeDisplayList"
              :key="`${item.key}-${idx}`"
              class="treatment-plan-rx__selected-item"
            >
              <span class="treatment-plan-rx__selected-idx">{{ idx + 1 }}、</span>
              <button
                type="button"
                class="treatment-plan-rx__selected-chip"
                @click="openSchemeModalByKey(item.key)"
                title="点击修改该方案"
              >
                {{ item.text }}
              </button>
              <button
                type="button"
                class="treatment-plan-rx__selected-remove"
                title="删除该方案"
                @click="removeSelectedScheme(item.key)"
              >
                ×
              </button>
            </div>
            <div v-if="selectedSchemeDisplayList.length === 0" class="treatment-plan-rx__selected-empty">
              暂未选择方案，点击右侧“方案选择”添加。
            </div>
          </div>
        </div>
        </div>
      </div>
        <div class="clinical-edit-mockup__remarks">
          <div class="clinical-edit-mockup__curr-remarks">
            <span class="clinical-edit-mockup__remarks-label">本次医生建议/备注：</span>
            <div class="clinical-edit-mockup__remarks-input-wrap">
              <div class="clinical-edit-mockup__remarks-box">
                <div class="clinical-edit-mockup__remarks-quick" aria-label="医生建议快捷填充">
                  <button
                    v-for="item in remarksQuickPhrases"
                    :key="item.text"
                    type="button"
                    class="clinical-edit-mockup__remarks-quick-btn"
                    @click="appendRemarksQuick(item.text)"
                  >
                    {{ item.label }}
                  </button>
                </div>
                <a-textarea
                  v-model:value="editForm.remarks"
                  :rows="3"
                  placeholder="请输入本次医生建议"
                  class="clinical-edit-mockup__remarks-input"
                />
              </div>
            </div>
          </div>
          <div class="clinical-edit-mockup__prev-remarks">
            <span class="clinical-edit-mockup__remarks-label">上一条检查医生建议：</span>
            <span class="clinical-edit-mockup__remarks-text">{{ previousRecord?.remarks || '暂无' }}</span>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <!-- 查看/打印：与编辑态同序 — 检查间隔 → 下次复查日期（其下为预约医生）→ 诊断 → … -->
      <div class="clinical-edit-mockup clinical-view-mockup">
        <template
          v-if="viewMode !== 'print' || (printSelectedSections && printSelectedSections.includes('doctor-instructions'))"
        >
          <div class="clinical-edit-mockup__header">
          <div class="clinical-edit-mockup__interval-row">
            <div class="clinical-edit-mockup__interval-group">
              <span
                class="clinical-edit-mockup__interval-label"
                title="根据与当前检查相对应的上一条检查记录与本次检查的日期，计算相隔天数"
              >距上一条检查间隔时间：</span>
              <span class="clinical-edit-mockup__interval-value">{{ viewExamIntervalDisplay }}</span>
            </div>
            <div class="clinical-edit-mockup__review-stack">
              <div class="clinical-edit-mockup__review-date-group">
                <span class="clinical-edit-mockup__interval-label">下次复查日期：</span>
                <span class="clinical-edit-mockup__interval-value">{{ displayNextReviewDate }}</span>
              </div>
              <div
                v-if="currentRecord?.review_interval_days === 0"
                class="clinical-edit-mockup__dates clinical-edit-mockup__dates--appointment-only clinical-edit-mockup__dates--under-review"
              >
                <div class="clinical-edit-mockup__date-item clinical-edit-mockup__date-item--appointment-doctor">
                  <span class="clinical-edit-mockup__interval-label">预约医生：</span>
                  <span class="clinical-edit-mockup__interval-value">{{ displayedAppointmentDoctorName }}</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </template>
        <slot name="diagnosis" />
        <!-- 4. 诊疗方案 -->
      <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasTreatmentPlanData" 
           v-show="(showOnlySection === null || showOnlySection === 'treatment-plan') && (viewMode !== 'print' || (printSelectedSections && printSelectedSections.includes('treatment-plan')))"
           class="treatment-plan-section"
           :class="{ 'collapsed': collapseEnabled && !sectionExpanded?.['treatment-plan'] }">
        <div v-show="viewMode === 'print' || (collapseEnabled ? sectionExpanded?.['treatment-plan'] : true)">
        <div class="treatment-plan-rx treatment-plan-rx--view">
          <div class="treatment-plan-rx__title">诊疗方案 <span class="treatment-plan-rx__rx">Rx</span>：</div>
          <div class="treatment-plan-rx__selected-list treatment-plan-rx__selected-list--view">
            <div
              v-for="(item, idx) in selectedSchemeDisplayList"
              :key="`view-${item.key}-${idx}`"
              class="treatment-plan-rx__selected-item"
            >
              <span class="treatment-plan-rx__selected-idx">{{ idx + 1 }}、</span>
              <span class="treatment-plan-rx__selected-chip treatment-plan-rx__selected-chip--readonly">{{ item.text }}</span>
            </div>
          </div>
        </div>
        </div>
      </div>
        <template
          v-if="viewMode !== 'print' || (printSelectedSections && printSelectedSections.includes('doctor-instructions'))"
        >
          <div class="clinical-edit-mockup__remarks">
            <div class="clinical-edit-mockup__curr-remarks">
              <span class="clinical-edit-mockup__remarks-label">本次医生建议/备注：</span>
              <span class="clinical-edit-mockup__remarks-text">{{ currentRecord?.remarks || '暂无' }}</span>
            </div>
            <div class="clinical-edit-mockup__prev-remarks">
              <span class="clinical-edit-mockup__remarks-label">上一条检查医生建议：</span>
              <span class="clinical-edit-mockup__remarks-text">{{ previousRecord?.remarks || '暂无' }}</span>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- 诊疗方案：方案选择弹窗（先做前两列；第三列逐步完善中） -->
    <a-modal
      v-model:open="schemeModalVisible"
      title="方案选择"
      :width="640"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleSchemeModalOk"
    >
      <div class="scheme-plan-modal">
        <div
          v-for="row in visibleSchemePlanRows"
          :key="row.key"
          class="scheme-plan-modal__row"
          :class="{ 'scheme-plan-modal__row--active': row.key === schemeModalFocusKey }"
        >
          <span class="scheme-plan-modal__label">{{ row.label }}</span>
          <div class="scheme-plan-modal__eye" role="group" :aria-label="`${row.label}眼别`">
            <button
              v-for="opt in schemeEyeToggleOptions"
              :key="opt.value"
              type="button"
              class="scheme-plan-modal__eye-btn"
              :class="{ 'scheme-plan-modal__eye-btn--active': schemePlanEyeScope[row.key] === opt.value }"
              @click="toggleSchemeEyeScope(row.key, opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
          <a-select
            v-model:value="schemePlanDraft[row.key]"
            allow-clear
            placeholder="请选择"
            class="scheme-plan-modal__select"
            :class="{ 'scheme-plan-modal__select--span2': row.key !== 'frameGlasses' && row.key !== 'contactLens' && row.key !== 'lowIntensityRed' && row.key !== 'drugTherapy' }"
          >
            <a-select-option v-for="opt in row.options" :key="opt" :value="opt">{{ opt }}</a-select-option>
          </a-select>
          <a-select
            v-if="row.key === 'frameGlasses'"
            v-model:value="schemePlanDraft.frameGlassesDetail"
            allow-clear
            placeholder="请选择"
            class="scheme-plan-modal__select"
            :disabled="!schemePlanDraft.frameGlasses"
          >
            <a-select-option v-for="opt in frameGlassesDetailOptions" :key="opt" :value="opt">{{ opt }}</a-select-option>
          </a-select>
          <a-select
            v-else-if="row.key === 'contactLens'"
            v-model:value="schemePlanDraft.contactLensDetail"
            allow-clear
            placeholder="请选择"
            class="scheme-plan-modal__select"
            :disabled="!schemePlanDraft.contactLens || contactLensDetailOptions.length === 0"
          >
            <a-select-option v-for="opt in contactLensDetailOptions" :key="opt" :value="opt">{{ opt }}</a-select-option>
          </a-select>
          <a-select
            v-else-if="row.key === 'lowIntensityRed'"
            v-model:value="schemePlanDraft.lowIntensityRedDetail"
            allow-clear
            placeholder="请选择"
            class="scheme-plan-modal__select"
            :disabled="!schemePlanDraft.lowIntensityRed || lowIntensityRedDetailOptions.length === 0"
          >
            <a-select-option v-for="opt in lowIntensityRedDetailOptions" :key="opt" :value="opt">{{ opt }}</a-select-option>
          </a-select>
          <a-select
            v-else-if="row.key === 'drugTherapy'"
            v-model:value="schemePlanDraft.drugTherapyDetail"
            allow-clear
            placeholder="请选择"
            class="scheme-plan-modal__select"
            :disabled="!schemePlanDraft.drugTherapy || drugTherapyDetailOptions.length === 0"
          >
            <a-select-option v-for="opt in drugTherapyDetailOptions" :key="opt" :value="opt">{{ opt }}</a-select-option>
          </a-select>
        </div>
      </div>
    </a-modal>

  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted, watch, nextTick, createVNode } from 'vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { Modal, message } from 'ant-design-vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN';

// 设置 dayjs 为中文
dayjs.locale('zh-cn');

const props = defineProps({
  patientInfo: {
    type: Object,
    default: () => ({})
  },
  currentRecord: {
    type: Object,
    default: () => ({})
  },
  /** 与当前选中检查相对应的上一条检查记录（时间上紧邻的前一条，由 Patient.vue 传入） */
  previousRecord: {
    type: Object,
    default: () => null
  },
  examinationRecords: {
    type: Array,
    default: () => []
  },
  viewMode: {
    type: String,
    default: 'view' // 'view', 'edit', 'print'
  },
  sectionExpanded: {
    type: Object,
    default: () => ({})
  },
  printSelectedSections: {
    type: Array,
    default: () => []
  },
  showOnlySection: {
    type: String,
    default: null // 如果设置，只显示指定的 section（如 'treatment-plan'）
  },
  /** 由父级控制：是否已从「相对应的上一条检查」同步诊断（用于按钮高亮） */
  diagnosisSyncActive: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle-section', 'update-record', 'sync-previous-diagnosis']);

// 医生建议、诊疗方案：编辑时不再折叠，始终展开便于录入
const collapseEnabled = false;

// 计算 isReportMode：在查看模式下，如果没有选中特定section，则为报告模式
const isReportMode = computed(() => {
  return props.viewMode === 'view' && !props.showOnlySection;
});

/** 三个「同步」按钮的说明：数据来源为与当前检查相对应的上一条检查记录（previousRecord） */
const syncPrevRecordTooltip = computed(() => {
  const raw = props.previousRecord?.examination_date;
  if (!raw) return '无与当前检查相对应的上一条检查记录';
  const d = dayjs(raw);
  const label = d.isValid() ? d.format('YYYY-MM-DD') : String(raw);
  return `与当前检查相对应的上一条检查记录（${label}）。写入本次编辑，再次点击恢复。`;
});

// 切换section展开/收起状态
const handleToggleSection = (sectionKey) => {
  emit('toggle-section', sectionKey);
};

// 编辑表单数据
const editForm = ref({});

/** 医生建议备注：快捷填充词条（点击追加到文本框） */
const remarksQuickPhrases = [
  { label: '早睡', text: '早睡' },
  { label: '多户外', text: '多户外' },
  { label: '少吃糖', text: '少吃糖' },
  { label: '注意写作姿势', text: '注意写作姿势' },
  { label: '按时训练', text: '按时训练' }
];

function appendRemarksQuick(phrase) {
  if (!editForm.value) return;
  const cur = String(editForm.value.remarks ?? '').trim();
  editForm.value.remarks = cur ? `${cur}、${phrase}` : phrase;
}

/** 诊疗方案「方案选择」弹窗：先做前两列，逐步补第三列（现已补框架眼镜第三级） */
const schemeModalVisible = ref(false);
const schemeModalFocusKey = ref('');
const schemePlanDraft = reactive({
  frameGlasses: undefined,
  frameGlassesDetail: undefined,
  contactLens: undefined,
  contactLensDetail: undefined,
  lowIntensityRed: undefined,
  lowIntensityRedDetail: undefined,
  visualTraining: undefined,
  physicalTherapy: undefined,
  drugTherapy: undefined,
  drugTherapyDetail: undefined
});

/** 方案选择弹窗：每行眼别（与 schemePlanRows 的 key 对应）；可点选切换，再次点击同一项取消 */
const schemePlanEyeScope = reactive({
  frameGlasses: undefined,
  contactLens: undefined,
  lowIntensityRed: undefined,
  visualTraining: undefined,
  physicalTherapy: undefined,
  drugTherapy: undefined
});

const schemeEyeLabelMap = { both: '双眼', right: '右眼', left: '左眼' };

const schemeEyeToggleOptions = [
  { value: 'both', label: '双眼' },
  { value: 'right', label: '右眼' },
  { value: 'left', label: '左眼' }
];

function toggleSchemeEyeScope(rowKey, value) {
  if (schemePlanEyeScope[rowKey] === value) {
    schemePlanEyeScope[rowKey] = undefined;
  } else {
    schemePlanEyeScope[rowKey] = value;
  }
}

const schemePlanRows = [
  { key: 'frameGlasses', label: '框架眼镜', options: ['点扩散', '多点离焦', '双效离焦点扩散', '单光', '渐进', '抗疲劳', '周边离焦', '环焦'] },
  { key: 'contactLens', label: '角膜接触镜', options: ['角膜塑形镜', 'RGP', '离焦软镜', '巩膜镜'] },
  { key: 'lowIntensityRed', label: '低强度红光', options: ['唯迪科', '小太阳'] },
  { key: 'visualTraining', label: '视觉训练', options: ['斜视训练', '弱视训练', '近视训练', '调节训练', '行为视觉训练'] },
  { key: 'physicalTherapy', label: '物理治疗', options: ['热敷', '冷敷', '睑板腺按摩', '遮盖', '压抑'] },
  { key: 'drugTherapy', label: '药物治疗', options: ['阿托品', '消炎', '抗过敏'] }
];

const visibleSchemePlanRows = computed(() => {
  if (!schemeModalFocusKey.value) return schemePlanRows;
  return schemePlanRows.filter((row) => row.key === schemeModalFocusKey.value);
});

const schemeRowLabelMap = Object.fromEntries(schemePlanRows.map((r) => [r.key, r.label]));

const frameGlassesDetailOptionsMap = {
  '点扩散': ['柯学优', '控优点2.0', '控优点3.0', '爱眼星', '其他'],
  '多点离焦': ['星趣控', '星趣控2.0', '新乐学', '轻松控', '爱眼星', '小乐园H版', '小乐园S版', '奥拉', '学趣控', '成长怡', '艾视晰', '蔚来星空', '欧陆智造', '柯学佳', '欧视佳', '益贝视', '其他'],
  '单光': ['蔡司', '依视路', '尼康', '爱眼星', '其他'],
  '双效离焦点扩散': ['格林视通', '爱眼星', '压轴大师', '其他'],
  '渐进': ['依视路', '爱眼星', '蔡司', '尼康', '其他'],
  '周边离焦': ['成长乐', '其他'],
  '环焦': ['爱眼星', '其他'],
  '抗疲劳': ['依视路', '蔡司', '尼康', '爱眼星', '其他']
};

const frameGlassesDetailOptions = computed(() => {
  const type = schemePlanDraft.frameGlasses;
  return frameGlassesDetailOptionsMap[type] || [];
});

const contactLensDetailOptionsMap = {
  '角膜塑形镜': ['普洛瞳', '亨泰', '阿尔法', 'CRT', '菁视', '菁眸', '露晰得', '欧几里德', '梦戴维', '天瞳', '目立康', '视达佳', '爱视欧', '其他'],
  'RGP': ['目立康', '菲士康', '亨泰', '其他'],
  '离焦软镜': ['Misight', '蝶适', '其他'],
  '巩膜镜': ['艾普柯', '艾康菲', 'CS巩膜镜', '美视季']
};

const contactLensDetailOptions = computed(() => {
  const type = schemePlanDraft.contactLens;
  return contactLensDetailOptionsMap[type] || [];
});

const lowIntensityRedDetailOptionsMap = {
  '唯迪科': ['0档', '3档', '6档', '9档', '12档', '15档'],
  '小太阳': ['0档', '3档', '6档', '9档', '12档', '15档']
};

const lowIntensityRedDetailOptions = computed(() => {
  const type = schemePlanDraft.lowIntensityRed;
  return lowIntensityRedDetailOptionsMap[type] || [];
});

const drugTherapyDetailOptionsMap = {
  '阿托品': ['0.01%', '0.02%', '0.05%', '0.1%']
};

const drugTherapyDetailOptions = computed(() => {
  const type = schemePlanDraft.drugTherapy;
  return drugTherapyDetailOptionsMap[type] || [];
});

const selectedSchemeDisplayList = computed(() => {
  const defs = [
    { key: 'frameGlasses', detailKey: 'frameGlassesDetail' },
    { key: 'contactLens', detailKey: 'contactLensDetail' },
    { key: 'lowIntensityRed', detailKey: 'lowIntensityRedDetail' },
    { key: 'visualTraining' },
    { key: 'physicalTherapy' },
    { key: 'drugTherapy', detailKey: 'drugTherapyDetail' }
  ];
  return defs
    .map(({ key, detailKey }) => {
      const value = schemePlanDraft[key];
      if (!value) return null;
      const detail = detailKey ? schemePlanDraft[detailKey] : '';
      const label = schemeRowLabelMap[key] || key;
      const base = detail ? `${label}：${value}（${detail}）` : `${label}：${value}`;
      const eyeKey = schemePlanEyeScope[key];
      const eyeSuffix =
        eyeKey && schemeEyeLabelMap[eyeKey] ? ` · ${schemeEyeLabelMap[eyeKey]}` : '';
      return {
        key,
        text: `${base}${eyeSuffix}`
      };
    })
    .filter(Boolean);
});

function removeSelectedScheme(key) {
  const detailKeyMap = {
    frameGlasses: 'frameGlassesDetail',
    contactLens: 'contactLensDetail',
    lowIntensityRed: 'lowIntensityRedDetail',
    drugTherapy: 'drugTherapyDetail'
  };
  schemePlanDraft[key] = undefined;
  const detailKey = detailKeyMap[key];
  if (detailKey) {
    schemePlanDraft[detailKey] = undefined;
  }
  if (Object.prototype.hasOwnProperty.call(schemePlanEyeScope, key)) {
    schemePlanEyeScope[key] = undefined;
  }
}

function openSchemeModal() {
  schemeModalFocusKey.value = '';
  schemeModalVisible.value = true;
}

function openSchemeModalByKey(key) {
  schemeModalFocusKey.value = key;
  schemeModalVisible.value = true;
}

function handleSchemeModalOk() {
  schemeModalVisible.value = false;
}

/** 诊疗方案「方案选择」持久化字段（随检查记录保存） */
const TREATMENT_SCHEME_FIELD = 'treatment_scheme_selection';

let isHydratingSchemeFromRecord = false;

function schemeDraftToPlain() {
  return JSON.parse(JSON.stringify(schemePlanDraft));
}

function schemeEyeScopeToPlain() {
  return JSON.parse(JSON.stringify(schemePlanEyeScope));
}

function clearSchemePlanState() {
  Object.keys(schemePlanDraft).forEach((k) => {
    schemePlanDraft[k] = undefined;
  });
  Object.keys(schemePlanEyeScope).forEach((k) => {
    schemePlanEyeScope[k] = undefined;
  });
}

/** 从检查记录恢复方案选择（查看/编辑进入时） */
function hydrateSchemeFromRecord(rec) {
  if (!rec) {
    clearSchemePlanState();
    return;
  }
  isHydratingSchemeFromRecord = true;
  try {
    const raw = rec[TREATMENT_SCHEME_FIELD];
    if (!raw) {
      clearSchemePlanState();
      return;
    }
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const draft = data.draft || {};
    const eye = data.eyeScope || {};
    Object.keys(schemePlanDraft).forEach((k) => {
      schemePlanDraft[k] = draft[k] ?? undefined;
    });
    Object.keys(schemePlanEyeScope).forEach((k) => {
      schemePlanEyeScope[k] = eye[k] ?? undefined;
    });
  } catch {
    clearSchemePlanState();
  } finally {
    nextTick(() => {
      isHydratingSchemeFromRecord = false;
    });
  }
}

/** 将当前方案选择序列化写入 editForm，经 update-record 合并进 editingRecord，保存时一并提交 */
function syncSchemeSelectionToEditForm() {
  if (props.viewMode !== 'edit' || isUpdatingFromRecord || isHydratingSchemeFromRecord) return;
  if (!editForm.value) return;
  const json = JSON.stringify({
    draft: schemeDraftToPlain(),
    eyeScope: schemeEyeScopeToPlain()
  });
  editForm.value[TREATMENT_SCHEME_FIELD] = json;
  // 直接通知父级合并，避免仅依赖 editForm 的 deep watch 与保存按钮同一帧竞态
  emit('update-record', { [TREATMENT_SCHEME_FIELD]: json });
}

/** 编辑态：方案变更写回 editForm，随保存提交 */
watch(
  () => [schemePlanDraft, schemePlanEyeScope],
  () => {
    syncSchemeSelectionToEditForm();
  },
  { deep: true }
);

/** 从与当前检查相对应的上一条检查记录同步诊疗方案（开关式，再点恢复） */
const syncSchemeFromPrevActive = ref(false);
const schemeSyncBackup = ref(null);

function toggleSyncSchemeFromPrevious() {
  if (!props.previousRecord) {
    message.warning('无与当前检查相对应的上一条检查记录');
    return;
  }
  if (!syncSchemeFromPrevActive.value) {
    schemeSyncBackup.value = {
      draft: schemeDraftToPlain(),
      eye: schemeEyeScopeToPlain(),
      json: editForm.value?.[TREATMENT_SCHEME_FIELD]
    };
    hydrateSchemeFromRecord(props.previousRecord);
    nextTick(() => {
      syncSchemeSelectionToEditForm();
    });
    syncSchemeFromPrevActive.value = true;
  } else {
    const b = schemeSyncBackup.value;
    if (b) {
      Object.keys(schemePlanDraft).forEach((k) => {
        schemePlanDraft[k] = b.draft[k] ?? undefined;
      });
      Object.keys(schemePlanEyeScope).forEach((k) => {
        schemePlanEyeScope[k] = b.eye[k] ?? undefined;
      });
      if (editForm.value) editForm.value[TREATMENT_SCHEME_FIELD] = b.json;
      nextTick(() => syncSchemeSelectionToEditForm());
    }
    schemeSyncBackup.value = null;
    syncSchemeFromPrevActive.value = false;
  }
}

/** 从与当前检查相对应的上一条检查记录同步医生建议/备注（开关式） */
const syncRemarksFromPrevActive = ref(false);
const remarksSyncBackup = ref(null);

function toggleSyncRemarksFromPrevious() {
  if (!props.previousRecord) {
    message.warning('无与当前检查相对应的上一条检查记录');
    return;
  }
  if (!editForm.value) return;
  if (!syncRemarksFromPrevActive.value) {
    remarksSyncBackup.value = editForm.value.remarks ?? '';
    editForm.value.remarks = props.previousRecord.remarks ?? '';
    syncRemarksFromPrevActive.value = true;
  } else {
    editForm.value.remarks = remarksSyncBackup.value ?? '';
    remarksSyncBackup.value = null;
    syncRemarksFromPrevActive.value = false;
  }
}

function resetLocalSyncFromPreviousState() {
  syncSchemeFromPrevActive.value = false;
  syncRemarksFromPrevActive.value = false;
  schemeSyncBackup.value = null;
  remarksSyncBackup.value = null;
}

watch(
  () => [props.currentRecord?.id, props.previousRecord?.id],
  () => {
    resetLocalSyncFromPreviousState();
  }
);

watch(() => schemePlanDraft.frameGlasses, (newType) => {
  const options = frameGlassesDetailOptionsMap[newType] || [];
  if (!options.includes(schemePlanDraft.frameGlassesDetail)) {
    schemePlanDraft.frameGlassesDetail = undefined;
  }
});

watch(() => schemePlanDraft.contactLens, (newType) => {
  const options = contactLensDetailOptionsMap[newType] || [];
  if (!options.includes(schemePlanDraft.contactLensDetail)) {
    schemePlanDraft.contactLensDetail = undefined;
  }
});

watch(() => schemePlanDraft.lowIntensityRed, (newType) => {
  const options = lowIntensityRedDetailOptionsMap[newType] || [];
  if (!options.includes(schemePlanDraft.lowIntensityRedDetail)) {
    schemePlanDraft.lowIntensityRedDetail = undefined;
  }
});

watch(() => schemePlanDraft.drugTherapy, (newType) => {
  const options = drugTherapyDetailOptionsMap[newType] || [];
  if (!options.includes(schemePlanDraft.drugTherapyDetail)) {
    schemePlanDraft.drugTherapyDetail = undefined;
  }
});

watch(() => schemeModalVisible.value, (open) => {
  if (!open) {
    schemeModalFocusKey.value = '';
    // 弹窗关闭（确定/取消/遮罩）时强制同步一次，避免仅依赖 draft 的 watch 时序导致未写入 editForm
    nextTick(() => syncSchemeSelectionToEditForm());
  }
});

/** 查看/打印：记录变更时同步方案列表展示（含首次进入） */
watch(
  () => props.currentRecord,
  (rec) => {
    if (!rec) return;
    if (props.viewMode === 'view' || props.viewMode === 'print') {
      hydrateSchemeFromRecord(rec);
    }
  },
  { deep: true, immediate: true }
);

// 医生列表相关
const doctorList = ref([]);
const doctorListLoading = ref(false);

// 获取医生列表
const fetchDoctorList = async () => {
  try {
    doctorListLoading.value = true;
    const orgId = localStorage.getItem('organization_id');
    const csrftoken = localStorage.getItem('csrftoken');
    
    if (!orgId) {
      console.error('未找到机构ID');
      return;
    }
    
    const response = await fetch(`https://aiforoptometry.com/doctor/list/?organization_id=${orgId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      }
    });
    
    if (response.ok) {
      const responseData = await response.json();
      const data = responseData.code === 200 ? responseData.data.results : responseData.data || responseData;
      doctorList.value = data.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        title: doctor.title,
        role: doctor.role
      }));
      console.log('获取医生列表成功:', doctorList.value);
    } else {
      console.error('获取医生列表失败:', response.status);
    }
  } catch (error) {
    console.error('获取医生列表出错:', error);
  } finally {
    doctorListLoading.value = false;
  }
};

// 当为自定义预约时，根据检查记录ID从邀约记录中获取医生信息
const fetchInviteDoctorByExamRecord = async (examRecordId) => {
  if (!examRecordId) return null;
  const csrftoken = localStorage.getItem('csrftoken');
  const orgId = localStorage.getItem('organization_id');
  
  if (!orgId) {
    console.error('未找到机构ID');
    return null;
  }
  
  try {
    const url = `https://aiforoptometry.com/api/invites?exam_record_id=${examRecordId}&organization_id=${orgId}`;
    const res = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json', 
        'X-CSRFToken': csrftoken 
      }
    });
    const data = await res.json();
    const first = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null;
    
    if (first) {
      // 返回医生ID和姓名
      return {
        doctor_id: first.doctor_id || null,
        doctor_name: first.doctor_name || null
      };
    }
    return null;
  } catch (error) {
    console.error('获取邀约医生失败:', error);
    return null;
  }
};

// 从邀约记录中获取的医生信息（用于查看模式显示）
const inviteDoctorInfo = ref({ id: null, name: null });

// 尝试加载预约医生信息（当为自定义预约时）
const tryLoadAppointmentDoctor = async () => {
  const rec = props.currentRecord;
  if (!rec) {
    console.log('[PatientStyleTwoPageOne] tryLoadAppointmentDoctor: currentRecord 为空');
    return;
  }
  
  console.log('[PatientStyleTwoPageOne] tryLoadAppointmentDoctor: 开始加载', {
    recordId: rec.id,
    review_interval_days: rec.review_interval_days,
    viewMode: props.viewMode
  });
  
  // 自定义预约：review_interval_days === 0
  if (rec.review_interval_days === 0) {
    // 优先使用检查记录自带字段
    let doctorId = rec.appointment_doctor || rec.doctor_id || null;
    let doctorName = rec.appointment_doctor_name || null;
    
    console.log('[PatientStyleTwoPageOne] 自定义预约检查，已有医生信息:', { doctorId, doctorName });
    
    // 如果没有医生信息，尝试通过邀约记录关联获取
    if (!doctorId) {
      console.log('[PatientStyleTwoPageOne] 没有医生ID，开始请求后端获取预约医生信息...');
      const inviteDoctor = await fetchInviteDoctorByExamRecord(rec.id);
      if (inviteDoctor) {
        doctorId = inviteDoctor.doctor_id || null;
        doctorName = inviteDoctor.doctor_name || null;
        console.log('[PatientStyleTwoPageOne] 从后端获取到医生信息:', { doctorId, doctorName });
      } else {
        console.log('[PatientStyleTwoPageOne] 后端没有返回医生信息');
      }
    }
    
    if (doctorId) {
      // 确保医生列表已加载（用于编辑模式的下拉选择）
      if (doctorList.value.length === 0 && props.viewMode === 'edit') {
        await fetchDoctorList();
      }
      
      // 如果还没有医生姓名，尝试从医生列表中获取
      if (!doctorName && doctorList.value.length > 0) {
        const doctor = doctorList.value.find(d => d.id === doctorId);
        doctorName = doctor ? doctor.name : null;
      }
      
      // 更新邀约医生信息（用于查看模式和编辑模式显示）
      inviteDoctorInfo.value = { id: doctorId, name: doctorName };
      console.log('[PatientStyleTwoPageOne] 已更新 inviteDoctorInfo:', inviteDoctorInfo.value);
      
      // 如果 editForm 存在，更新 editForm（编辑模式预填充）
      if (editForm.value && props.viewMode === 'edit') {
        editForm.value.appointment_doctor = doctorId;
        if (doctorName) {
          editForm.value.appointment_doctor_name = doctorName;
        }
      }
    } else {
      // 没有找到医生，清空信息
      inviteDoctorInfo.value = { id: null, name: null };
    }
  } else {
    // 不是自定义预约，清空信息
    inviteDoctorInfo.value = { id: null, name: null };
  }
};

// 标志：是否正在从record同步到editForm
let isUpdatingFromRecord = false;

// 监听currentRecord变化，同步到editForm
// 优化：只监听ID变化，避免深度监听整个对象
watch(() => props.currentRecord?.id, (newId, oldId) => {
  if (newId && newId !== oldId && props.currentRecord) {
    const newVal = props.currentRecord;
    // 只在非编辑模式或ID真正变化时同步
    if (props.viewMode !== 'edit' || newId !== oldId) {
      isUpdatingFromRecord = true; // 设置标志，防止触发update-record
      editForm.value = JSON.parse(JSON.stringify(newVal));
      // 将日期字符串转换为 dayjs 对象（用于编辑模式）
      if (editForm.value.examination_date && typeof editForm.value.examination_date === 'string') {
        editForm.value.examination_date = dayjs(editForm.value.examination_date);
      }
      if (editForm.value.review_date && typeof editForm.value.review_date === 'string') {
        editForm.value.review_date = dayjs(editForm.value.review_date);
      }
      // 无「双眼同步」勾选入口时，未存过则默认 false，避免左眼列被禁用且无法解除
      if (editForm.value.sync_eyes === undefined || editForm.value.sync_eyes === null) {
        editForm.value.sync_eyes = false;
      }
      ensureRxRemarkFields();
      nextTick(() => initTreatmentRxScopesFromForm());
      hydrateSchemeFromRecord(editForm.value);
      // 初始化或计算 review_interval_days
      if (!editForm.value.review_interval_days && props.previousRecord?.examination_date && editForm.value.examination_date) {
        const prevDate = dayjs(props.previousRecord.examination_date);
        const currentDate = dayjs.isDayjs(editForm.value.examination_date) 
          ? editForm.value.examination_date 
          : dayjs(editForm.value.examination_date);
        if (prevDate.isValid() && currentDate.isValid()) {
          const monthsDiff = currentDate.diff(prevDate, 'month');
          if (monthsDiff === 1) editForm.value.review_interval_days = 1;
          else if (monthsDiff === 2) editForm.value.review_interval_days = 2;
          else if (monthsDiff === 3) editForm.value.review_interval_days = 3;
          else editForm.value.review_interval_days = 0;
        }
      }
      
    // 如果记录中有预约医生信息，或者间隔时间为自定义预约，获取医生列表（查看模式和编辑模式都需要）
    if ((newVal.appointment_doctor || newVal.review_interval_days === 0) && doctorList.value.length === 0) {
      fetchDoctorList();
    }
    
    // 如果是自定义预约，尝试从邀约记录中加载医生信息
    if (newVal.review_interval_days === 0) {
      nextTick(async () => {
        await tryLoadAppointmentDoctor();
      });
    }
    
    nextTick(() => {
      isUpdatingFromRecord = false;
    });
    }
  }
}, { immediate: true });

// 监听viewMode变化，进入编辑模式时重新同步数据
watch(() => props.viewMode, (newMode) => {
  if (newMode === 'edit' && props.currentRecord) {
    isUpdatingFromRecord = true; // 设置标志，防止触发update-record
    editForm.value = JSON.parse(JSON.stringify(props.currentRecord));
    // 将日期字符串转换为 dayjs 对象
    if (editForm.value.examination_date && typeof editForm.value.examination_date === 'string') {
      editForm.value.examination_date = dayjs(editForm.value.examination_date);
    }
    if (editForm.value.review_date && typeof editForm.value.review_date === 'string') {
      editForm.value.review_date = dayjs(editForm.value.review_date);
    }
    if (editForm.value.sync_eyes === undefined || editForm.value.sync_eyes === null) {
      editForm.value.sync_eyes = false;
    }
    ensureRxRemarkFields();
    nextTick(() => initTreatmentRxScopesFromForm());
    hydrateSchemeFromRecord(editForm.value);
    // 初始化或计算 review_interval_days
    if (!editForm.value.review_interval_days && props.previousRecord?.examination_date && editForm.value.examination_date) {
      const prevDate = dayjs(props.previousRecord.examination_date);
      const currentDate = dayjs.isDayjs(editForm.value.examination_date) 
        ? editForm.value.examination_date 
        : dayjs(editForm.value.examination_date);
      if (prevDate.isValid() && currentDate.isValid()) {
        const monthsDiff = currentDate.diff(prevDate, 'month');
        if (monthsDiff === 1) editForm.value.review_interval_days = 1;
        else if (monthsDiff === 2) editForm.value.review_interval_days = 2;
        else if (monthsDiff === 3) editForm.value.review_interval_days = 3;
        else editForm.value.review_interval_days = 0;
      }
    }
    console.log('[PatientStyleTwoPageOne] 进入编辑模式，已同步数据到editForm:', editForm.value);
    
    // 如果记录中有预约医生信息，或者间隔时间为自定义预约，获取医生列表（查看模式和编辑模式都需要）
    if ((props.currentRecord.appointment_doctor || props.currentRecord.review_interval_days === 0) && doctorList.value.length === 0) {
      fetchDoctorList();
    }
    
    // 如果是自定义预约，尝试从邀约记录中加载医生信息
    if (props.currentRecord.review_interval_days === 0) {
      nextTick(async () => {
        await tryLoadAppointmentDoctor();
      });
    }
    
    nextTick(() => {
      isUpdatingFromRecord = false;
    });
  }
});

// 监听 currentRecord 的 review_interval_days 变化（用于查看模式和编辑模式）
watch(() => props.currentRecord, (newRecord, oldRecord) => {
  // 如果是自定义预约（review_interval_days === 0），尝试加载预约医生
  if (newRecord && newRecord.review_interval_days === 0) {
    console.log('[PatientStyleTwoPageOne] 检测到自定义预约，开始加载预约医生信息', {
      viewMode: props.viewMode,
      recordId: newRecord.id,
      review_interval_days: newRecord.review_interval_days,
      hasAppointmentDoctor: !!newRecord.appointment_doctor
    });
    nextTick(async () => {
      await tryLoadAppointmentDoctor();
    });
  }
}, { immediate: true, deep: true });

// 监听editForm变化，通知父组件更新
watch(() => editForm.value, (newVal) => {
  if (props.viewMode === 'edit' && !isUpdatingFromRecord) {
    // 格式化日期字段后发送给父组件
    const updatedData = { ...newVal };
    if (updatedData.examination_date && dayjs.isDayjs(updatedData.examination_date)) {
      updatedData.examination_date = updatedData.examination_date.format('YYYY-MM-DD');
    }
    if (updatedData.review_date && dayjs.isDayjs(updatedData.review_date)) {
      updatedData.review_date = updatedData.review_date.format('YYYY-MM-DD');
    }
    // 如果选择了预约医生，获取医生姓名
    if (updatedData.appointment_doctor) {
      const selectedDoctor = doctorList.value.find(d => d.id === updatedData.appointment_doctor);
      if (selectedDoctor) {
        updatedData.appointment_doctor_name = selectedDoctor.name;
      }
    }
    emit('update-record', updatedData);
  }
}, { deep: true });

// 治疗方案设置
const loadTreatmentSettings = () => {
  try {
    const savedSettings = localStorage.getItem('treatmentSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return {
        glassesMethods: settings.glassesMethods || ['离焦镜', '点扩散', 'OK镜', '离焦软镜', 'RGP', '单光镜', '渐近镜', '双效离焦点扩散'],
        glassesBrands: settings.glassesBrands || {
          '离焦镜': ['星趣控', '新乐学', '轻松控', '爱眼星', '成长乐', '小乐园', '奥拉', '学趣控', '成长怡'],
          '点扩散': ['控优点', '爱眼星', '柯学优'],
          'OK镜': ['亨泰', '普诺瞳', 'CRT', '阿尔法', '露晰德', '欧几里德', '梦戴维', '天瞳', '菁眸', '目立康'],
          '离焦软镜': ['misight', '蝶适'],
          'RGP': ['目力康', '菲仕康'],
          '单光镜': ['蔡司', '依视路', '国产'],
          '渐近镜': ['蔡司', '依视路', '国产'],
          '双效离焦点扩散': ['格林视通', '爱眼星']
        },
        hgDevices: settings.hgDevices || ['唯迪科', '小太阳'],
        hgLevels: settings.hgLevels || {
          '唯迪科': [0, 3, 6, 9, 12, 15],
          '小太阳': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        }
      };
    }
  } catch (error) {
    console.error('加载方案设置失败:', error);
  }
  
  return {
    glassesMethods: ['离焦镜', '点扩散', 'OK镜', '离焦软镜', 'RGP', '单光镜', '渐近镜', '双效离焦点扩散'],
    glassesBrands: {
      '离焦镜': ['星趣控', '新乐学', '轻松控', '爱眼星', '成长乐', '小乐园', '奥拉', '学趣控', '成长怡'],
      '点扩散': ['控优点', '爱眼星', '柯学优'],
      'OK镜': ['亨泰', '普诺瞳', 'CRT', '阿尔法', '露晰德', '欧几里德', '梦戴维', '天瞳', '菁眸', '目立康'],
      '离焦软镜': ['misight', '蝶适'],
      'RGP': ['目力康', '菲仕康'],
      '单光镜': ['蔡司', '依视路', '国产'],
      '渐近镜': ['蔡司', '依视路', '国产'],
      '双效离焦点扩散': ['格林视通', '爱眼星']
    },
    hgDevices: ['唯迪科', '小太阳'],
    hgLevels: {
      '唯迪科': [0, 3, 6, 9, 12, 15],
      '小太阳': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    }
  };
};

const treatmentSettings = ref(loadTreatmentSettings());

// 品牌选项
const glassesPPOptions = computed(() => {
  const selectedMethods = treatmentSettings.value.glassesMethods;
  const allBrands = treatmentSettings.value.glassesBrands;
  const result = {};
  
  selectedMethods.forEach(method => {
    if (allBrands[method]) {
      result[method] = allBrands[method];
    }
  });
  
  return result;
});

// 低强度红光档位选项
const hgDWOptions = computed(() => {
  const selectedDevices = treatmentSettings.value.hgDevices;
  const allLevels = treatmentSettings.value.hgLevels;
  const result = {};
  
  selectedDevices.forEach(device => {
    if (allLevels[device]) {
      result[device] = allLevels[device];
    }
  });
  
  return result;
});

// 更新右眼配镜品牌选项
const updateRightGlassesPP = () => {
  if (!editForm.value.right_glasses || editForm.value.right_glasses === '否') {
    editForm.value.right_glasses_pp = null;
  }
};

// 更新左眼配镜品牌选项
const updateLeftGlassesPP = () => {
  if (!editForm.value.left_glasses || editForm.value.left_glasses === '否') {
    editForm.value.left_glasses_pp = null;
  }
};

// 更新右眼低强度红光档位选项
const updateRightHGDW = () => {
  if (!editForm.value.right_hg || editForm.value.right_hg === '否') {
    editForm.value.right_hg_dw = null;
  }
};

// 更新左眼低强度红光档位选项
const updateLeftHGDW = () => {
  if (!editForm.value.left_hg || editForm.value.left_hg === '否') {
    editForm.value.left_hg_dw = null;
  }
};

/** 编辑态：根据检查记录（上一条 vs 当前条）的检查日期自动计算间隔天数，只读 */
const computedExamIntervalDisplay = computed(() => {
  const prev = props.previousRecord?.examination_date;
  const ex = editForm.value?.examination_date;
  if (!prev || !ex) return '—';
  const prevD = dayjs(prev);
  const cur = dayjs.isDayjs(ex) ? ex : dayjs(ex);
  if (!prevD.isValid() || !cur.isValid()) return '—';
  const days = Math.max(0, cur.diff(prevD, 'day'));
  return `${days} 天`;
});

/** 查看态：与编辑态同一套「间隔天数」算法，用当前/上一条检查记录 */
const viewExamIntervalDisplay = computed(() => {
  const prev = props.previousRecord?.examination_date;
  const ex = props.currentRecord?.examination_date;
  if (!prev || !ex) return '—';
  const prevD = dayjs(prev);
  const cur = dayjs(ex);
  if (!prevD.isValid() || !cur.isValid()) return '—';
  const days = Math.max(0, cur.diff(prevD, 'day'));
  return `${days} 天`;
});

/** 诊疗方案 Rx：单行「选择框 + 眼别 + 备注」布局 */
const treatmentRxScope = ref({
  atropine: 'both',
  glasses: 'both',
  hg: 'both',
  physiotherapy: 'both',
  visual_training: 'both'
});

function inferRxScopeFromEyes(r, l) {
  const er = r == null || r === '' || r === 'none' || r === '否';
  const el = l == null || l === '' || l === 'none' || l === '否';
  if (!er && !el && String(r) === String(l)) return 'both';
  if (!er && el) return 'right';
  if (er && !el) return 'left';
  if (!er && !el) return 'right';
  return 'both';
}

function eyeScopeLabel(scope) {
  if (scope === 'both') return '双眼';
  if (scope === 'right') return '右眼';
  return '左眼';
}

function initTreatmentRxScopesFromForm() {
  const f = editForm.value;
  if (!f) return;
  treatmentRxScope.value = {
    atropine: inferRxScopeFromEyes(f.right_atropine, f.left_atropine),
    glasses: inferRxScopeFromEyes(f.right_glasses, f.left_glasses),
    hg: inferRxScopeFromEyes(f.right_hg, f.left_hg),
    physiotherapy: inferRxScopeFromEyes(f.right_physiotherapy, f.left_physiotherapy),
    visual_training: inferRxScopeFromEyes(f.right_visual_training, f.left_visual_training)
  };
}

function ensureRxRemarkFields() {
  const f = editForm.value;
  if (!f) return;
  ['rx_remark_atropine', 'rx_remark_glasses', 'rx_remark_hg', 'rx_remark_physiotherapy', 'rx_remark_visual_training'].forEach((k) => {
    if (f[k] === undefined || f[k] === null) f[k] = '';
  });
}

const rxAtropineSelect = computed({
  get() {
    const s = treatmentRxScope.value.atropine;
    if (s === 'left') return editForm.value?.left_atropine;
    return editForm.value?.right_atropine;
  },
  set(v) {
    const s = treatmentRxScope.value.atropine;
    if (s === 'both') {
      editForm.value.right_atropine = v;
      editForm.value.left_atropine = v;
    } else if (s === 'right') {
      editForm.value.right_atropine = v;
    } else {
      editForm.value.left_atropine = v;
    }
  }
});

const rxGlassesMethod = computed({
  get() {
    const s = treatmentRxScope.value.glasses;
    if (s === 'left') return editForm.value?.left_glasses;
    return editForm.value?.right_glasses;
  },
  set(v) {
    const s = treatmentRxScope.value.glasses;
    if (s === 'both') {
      editForm.value.right_glasses = v;
      editForm.value.left_glasses = v;
      updateRightGlassesPP();
      updateLeftGlassesPP();
      if (!v || v === '否') {
        editForm.value.right_glasses_pp = null;
        editForm.value.left_glasses_pp = null;
      } else {
        const opts = glassesPPOptions.value[v] || [];
        const first = opts[0] ?? null;
        editForm.value.right_glasses_pp = first;
        editForm.value.left_glasses_pp = first;
      }
    } else if (s === 'right') {
      editForm.value.right_glasses = v;
      updateRightGlassesPP();
    } else {
      editForm.value.left_glasses = v;
      updateLeftGlassesPP();
    }
  }
});

const rxGlassesPp = computed({
  get() {
    return treatmentRxScope.value.glasses === 'left'
      ? editForm.value?.left_glasses_pp
      : editForm.value?.right_glasses_pp;
  },
  set(v) {
    const s = treatmentRxScope.value.glasses;
    if (s === 'both') {
      editForm.value.right_glasses_pp = v;
      editForm.value.left_glasses_pp = v;
    } else if (s === 'right') {
      editForm.value.right_glasses_pp = v;
    } else {
      editForm.value.left_glasses_pp = v;
    }
  }
});

const rxHgDevice = computed({
  get() {
    return treatmentRxScope.value.hg === 'left' ? editForm.value?.left_hg : editForm.value?.right_hg;
  },
  set(v) {
    const s = treatmentRxScope.value.hg;
    if (s === 'both') {
      editForm.value.right_hg = v;
      editForm.value.left_hg = v;
      updateRightHGDW();
      updateLeftHGDW();
      if (!v || v === '否') {
        editForm.value.right_hg_dw = null;
        editForm.value.left_hg_dw = null;
      } else {
        const opts = hgDWOptions.value[v] || [];
        const first = opts[0] ?? null;
        editForm.value.right_hg_dw = first;
        editForm.value.left_hg_dw = first;
      }
    } else if (s === 'right') {
      editForm.value.right_hg = v;
      updateRightHGDW();
    } else {
      editForm.value.left_hg = v;
      updateLeftHGDW();
    }
  }
});

const rxHgDw = computed({
  get() {
    return treatmentRxScope.value.hg === 'left' ? editForm.value?.left_hg_dw : editForm.value?.right_hg_dw;
  },
  set(v) {
    const s = treatmentRxScope.value.hg;
    if (s === 'both') {
      editForm.value.right_hg_dw = v;
      editForm.value.left_hg_dw = v;
    } else if (s === 'right') {
      editForm.value.right_hg_dw = v;
    } else {
      editForm.value.left_hg_dw = v;
    }
  }
});

const rxPhysioSelect = computed({
  get() {
    return treatmentRxScope.value.physiotherapy === 'left'
      ? editForm.value?.left_physiotherapy
      : editForm.value?.right_physiotherapy;
  },
  set(v) {
    const s = treatmentRxScope.value.physiotherapy;
    if (s === 'both') {
      editForm.value.right_physiotherapy = v;
      editForm.value.left_physiotherapy = v;
    } else if (s === 'right') {
      editForm.value.right_physiotherapy = v;
    } else {
      editForm.value.left_physiotherapy = v;
    }
  }
});

const rxVisualSelect = computed({
  get() {
    return treatmentRxScope.value.visual_training === 'left'
      ? editForm.value?.left_visual_training
      : editForm.value?.right_visual_training;
  },
  set(v) {
    const s = treatmentRxScope.value.visual_training;
    if (s === 'both') {
      editForm.value.right_visual_training = v;
      editForm.value.left_visual_training = v;
    } else if (s === 'right') {
      editForm.value.right_visual_training = v;
    } else {
      editForm.value.left_visual_training = v;
    }
  }
});

watch(() => treatmentRxScope.value.atropine, (n, o) => {
  if (n === 'both' && o && o !== 'both' && editForm.value) {
    editForm.value.left_atropine = editForm.value.right_atropine;
  }
});
watch(() => treatmentRxScope.value.glasses, (n, o) => {
  if (n === 'both' && o && o !== 'both' && editForm.value) {
    editForm.value.left_glasses = editForm.value.right_glasses;
    editForm.value.left_glasses_pp = editForm.value.right_glasses_pp;
  }
});
watch(() => treatmentRxScope.value.hg, (n, o) => {
  if (n === 'both' && o && o !== 'both' && editForm.value) {
    editForm.value.left_hg = editForm.value.right_hg;
    editForm.value.left_hg_dw = editForm.value.right_hg_dw;
  }
});
watch(() => treatmentRxScope.value.physiotherapy, (n, o) => {
  if (n === 'both' && o && o !== 'both' && editForm.value) {
    editForm.value.left_physiotherapy = editForm.value.right_physiotherapy;
  }
});
watch(() => treatmentRxScope.value.visual_training, (n, o) => {
  if (n === 'both' && o && o !== 'both' && editForm.value) {
    editForm.value.left_visual_training = editForm.value.right_visual_training;
  }
});

// 格式化检查间隔文本
const periodText = (val) => {
  if (val === 0) return '自定义预约';
  if (val === 1) return '一个月';
  if (val === 2) return '两个月';
  if (val === 3) return '三个月';
  return '-';
};

// 根据医生ID获取医生姓名
const getDoctorName = (doctorId, doctorName) => {
  // 优先使用传入的医生名字（从检查记录中读取）
  if (doctorName) return doctorName;
  if (!doctorId) return null;
  // 如果没有医生名字，从医生列表中查找
  const doctor = doctorList.value.find(d => d.id === doctorId);
  return doctor ? doctor.name : null;
};

// 计算当前显示的预约医生姓名（用于查看模式）
const displayedAppointmentDoctorName = computed(() => {
  const doctorId = props.currentRecord?.appointment_doctor || inviteDoctorInfo.value?.id;
  const doctorName = props.currentRecord?.appointment_doctor_name || inviteDoctorInfo.value?.name;
  const result = getDoctorName(doctorId, doctorName);
  console.log('[PatientStyleTwoPageOne] computed 显示医生信息:', { 
    doctorId, 
    doctorName, 
    result, 
    inviteDoctorInfo: inviteDoctorInfo.value,
    currentRecord: props.currentRecord 
  });
  return result || '暂无';
});

// 查看模式下显示的下次复查日期：优先用 review_date，否则按本次检查日期+间隔计算
const displayNextReviewDate = computed(() => {
  const rec = props.currentRecord;
  if (!rec) return '暂无';
  if (rec.review_date) return formatDate(rec.review_date);
  const base = rec.examination_date ? dayjs(rec.examination_date) : null;
  const days = rec.review_interval_days;
  if (!base || !base.isValid()) return '暂无';
  if (days === 1) return base.add(1, 'month').format('YYYY-MM-DD');
  if (days === 2) return base.add(2, 'month').format('YYYY-MM-DD');
  if (days === 3) return base.add(3, 'month').format('YYYY-MM-DD');
  return '暂无';
});

// 更新下次检查日期（根据检查间隔）
const updateReviewDate = () => {
  if (!editForm.value.examination_date || !editForm.value.review_interval_days || editForm.value.review_interval_days === 0) return;
  const base = dayjs.isDayjs(editForm.value.examination_date) 
    ? editForm.value.examination_date 
    : dayjs(editForm.value.examination_date);
  let next;
  if (editForm.value.review_interval_days === 1) next = base.add(1, 'month');
  else if (editForm.value.review_interval_days === 2) next = base.add(2, 'month');
  else if (editForm.value.review_interval_days === 3) next = base.add(3, 'month');
  else return;
  editForm.value.review_date = next;
};

// 根据下次检查日期更新检查间隔
const updatePeriodBasedOnReviewDate = () => {
  if (!editForm.value.examination_date || !editForm.value.review_date) return;
  
  // 如果原本是邀约（review_interval_days === 0），即使日期是整月，也保持为0（自定义预约）
  const originalIntervalDays = props.currentRecord?.review_interval_days;
  if (originalIntervalDays === 0) {
    editForm.value.review_interval_days = 0;
    return;
  }
  
  // 如果不是邀约，根据日期差值计算
  const start = dayjs.isDayjs(editForm.value.examination_date) 
    ? editForm.value.examination_date 
    : dayjs(editForm.value.examination_date);
  const end = dayjs.isDayjs(editForm.value.review_date) 
    ? editForm.value.review_date 
    : dayjs(editForm.value.review_date);
  const diffMonth = end.diff(start, 'month');
  if (diffMonth === 1) editForm.value.review_interval_days = 1;
  else if (diffMonth === 2) editForm.value.review_interval_days = 2;
  else if (diffMonth === 3) editForm.value.review_interval_days = 3;
  else editForm.value.review_interval_days = 0;
};

// 判断字段是否有值（包括0值）
const hasFieldValue = (value) => {
  return value !== null && value !== undefined && value !== '';
};

// 判断各板块是否有数据
const hasDoctorInstructionsData = computed(() => {
  const record = props.currentRecord;
  const prevRecord = props.previousRecord;
  const hasCurrent = !!(record?.remarks && record.remarks.trim());
  const hasPrevious = !!(prevRecord?.remarks && prevRecord.remarks.trim());
  return hasCurrent || hasPrevious;
});

/** 仅当检查记录中已保存「方案选择」JSON 且至少选一项时，查看/打印才展示诊疗方案区块 */
function recordHasSavedSchemeSelection(record) {
  if (!record?.[TREATMENT_SCHEME_FIELD]) return false;
  try {
    const raw = record[TREATMENT_SCHEME_FIELD];
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const draft = data?.draft || {};
    const keys = ['frameGlasses', 'contactLens', 'lowIntensityRed', 'visualTraining', 'physicalTherapy', 'drugTherapy'];
    return keys.some((k) => draft[k] != null && String(draft[k]).trim() !== '');
  } catch {
    return false;
  }
}

const hasTreatmentPlanData = computed(() => {
  const record = props.currentRecord;
  if (!record) return false;
  return recordHasSavedSchemeSelection(record);
});

// 系统设置
const orgName = ref('');
const logoUrl = ref('');

// 加载系统设置
const loadSystemSettings = () => {
  try {
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      orgName.value = settings.printName || '';
      if (settings.logoUrl) {
        // 确保logo URL使用HTTPS协议
        logoUrl.value = settings.logoUrl.startsWith('http://') 
          ? settings.logoUrl.replace('http://', 'https://') 
          : settings.logoUrl;
      }
    }
  } catch (error) {
    console.error('加载系统设置失败:', error);
  }
};

onMounted(() => {
  loadSystemSettings();
  // 监听系统设置变化
  window.addEventListener('system-settings-changed', loadSystemSettings);
  
  // 如果是自定义预约，尝试加载预约医生信息（查看模式和编辑模式都需要）
  if (props.currentRecord?.review_interval_days === 0) {
    nextTick(async () => {
      await tryLoadAppointmentDoctor();
    });
  }
});

// 提取编号数字部分
const gkidNumber = computed(() => {
  const gkid = props.patientInfo?.gkid;
  if (!gkid) return '-';
  const match = gkid.match(/\d+/);
  return match ? match[0] : gkid;
});

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

// 计算间隔时间显示文本（参考诊疗方案的 periodText 逻辑）
const calculateInterval = () => {
  // 优先使用后端返回的 review_interval_days 字段
  const intervalDays = props.currentRecord?.review_interval_days;
  if (intervalDays !== undefined && intervalDays !== null) {
    if (intervalDays === 0) return '自定义预约';
    if (intervalDays === 1) return '一个月';
    if (intervalDays === 2) return '两个月';
    if (intervalDays === 3) return '三个月';
  }
  
  // 如果没有 review_interval_days，则根据日期计算
  if (!props.previousRecord?.examination_date || !props.currentRecord?.examination_date) {
    return '暂无';
  }
  try {
    const prevDate = dayjs(props.previousRecord.examination_date);
    const currentDate = dayjs(props.currentRecord.examination_date);
    
    if (!prevDate.isValid() || !currentDate.isValid()) {
      return '暂无';
    }
    
    // 计算月份差
    const monthsDiff = currentDate.diff(prevDate, 'month');
    // 计算剩余天数
    const remainingDays = currentDate.diff(prevDate.add(monthsDiff, 'month'), 'day');
    
    let result = '';
    if (monthsDiff > 0) {
      result += `${monthsDiff}月`;
    }
    if (remainingDays > 0) {
      result += `${remainingDays}天`;
    }
    if (monthsDiff === 0 && remainingDays === 0) {
      result = '0天';
    }
    
    return result || '暂无';
  } catch (error) {
    console.error('计算间隔时间出错:', error);
    return '暂无';
  }
};

// 根据间隔时间计算本次检查日期
const handleIntervalChange = () => {
  // 如果选择自定义预约，加载医生列表
  if (editForm.value.review_interval_days === 0) {
    if (doctorList.value.length === 0) {
      fetchDoctorList();
    }
    // 自定义预约：不自动计算下次复查日期，交由用户手动选择
    return; // 自定义间隔，不自动计算日期
  }
  
  if (!props.previousRecord?.examination_date) {
    // 没有上次检查日期：仍可基于“本次检查日期”计算下次复查日期
    updateReviewDate();
    return;
  }
  
  const prevDate = dayjs(props.previousRecord.examination_date);
  if (!prevDate.isValid()) {
    return;
  }
  
  // 根据间隔时间计算本次检查日期
  let newDate;
  if (editForm.value.review_interval_days === 1) {
    newDate = prevDate.add(1, 'month');
  } else if (editForm.value.review_interval_days === 2) {
    newDate = prevDate.add(2, 'month');
  } else if (editForm.value.review_interval_days === 3) {
    newDate = prevDate.add(3, 'month');
  } else {
    return;
  }
  
  editForm.value.examination_date = newDate;
  // 间隔变化后同步计算下次复查日期（本次检查日期 + 间隔月数）
  updateReviewDate();
};

// 根据本次检查日期计算间隔时间
const handleExaminationDateChange = () => {
  if (!editForm.value.examination_date || !props.previousRecord?.examination_date) {
    return;
  }
  
  const prevDate = dayjs(props.previousRecord.examination_date);
  const currentDate = dayjs.isDayjs(editForm.value.examination_date) 
    ? editForm.value.examination_date 
    : dayjs(editForm.value.examination_date);
  
  if (!prevDate.isValid() || !currentDate.isValid()) {
    return;
  }
  
  // 计算月份差
  const monthsDiff = currentDate.diff(prevDate, 'month');
  
  // 根据月份差设置间隔时间
  if (monthsDiff === 1) {
    editForm.value.review_interval_days = 1;
  } else if (monthsDiff === 2) {
    editForm.value.review_interval_days = 2;
  } else if (monthsDiff === 3) {
    editForm.value.review_interval_days = 3;
  } else {
    // 如果不是整月，设置为自定义
    editForm.value.review_interval_days = 0;
  }

  // 本次检查日期变化后：若是周期模式（1/2/3），同步更新下次复查日期
  updateReviewDate();
};

// 格式化阿托品
const formatAtropine = (value) => {
  if (!value || value === 'none' || value === '否') return '否';
  return value;
};

// 格式化配镜
const formatGlasses = (glasses, glassesPP) => {
  if (!glasses || glasses === 'none' || glasses === '否') return '否';
  if (glassesPP && glassesPP !== 'none' && glassesPP !== '否') {
    return `${glasses}(${glassesPP})`;
  }
  return glasses;
};

// 格式化低强度红光
const formatHG = (hg, hgDW) => {
  if (!hg || hg === 'none' || hg === '否') return '否';
  if (hgDW !== undefined && hgDW !== '' && hgDW !== null) {
    return `${hg}(档位${hgDW})`;
  }
  return hg;
};

// 格式化是/否
const formatYesNo = (value) => {
  if (!value || value === 'none' || value === '否') return '否';
  if (value === '1' || value === '是') return '是';
  return value;
};

// 格式化视觉训练
const formatVisualTraining = (value) => {
  if (!value || value === 'none' || value === '否') return '否';
  const trainingMap = {
    '0': '斜视训练',
    '1': '弱视训练',
    '2': '近视训练'
  };
  return trainingMap[value] || value;
};

// 判断是否有治疗方案
const hasRightTreatment = computed(() => {
  const record = props.currentRecord;
  return (record?.right_atropine && record.right_atropine !== 'none' && record.right_atropine !== '否') ||
         (record?.right_glasses && record.right_glasses !== 'none' && record.right_glasses !== '否') ||
         (record?.right_hg && record.right_hg !== 'none' && record.right_hg !== '否') ||
         (record?.right_physiotherapy && record.right_physiotherapy !== 'none' && record.right_physiotherapy !== '否') ||
         (record?.right_visual_training && record.right_visual_training !== 'none' && record.right_visual_training !== '否');
});

const hasLeftTreatment = computed(() => {
  const record = props.currentRecord;
  return (record?.left_atropine && record.left_atropine !== 'none' && record.left_atropine !== '否') ||
         (record?.left_glasses && record.left_glasses !== 'none' && record.left_glasses !== '否') ||
         (record?.left_hg && record.left_hg !== 'none' && record.left_hg !== '否') ||
         (record?.left_physiotherapy && record.left_physiotherapy !== 'none' && record.left_physiotherapy !== '否') ||
         (record?.left_visual_training && record.left_visual_training !== 'none' && record.left_visual_training !== '否');
});

// 右眼字段同步到左眼
const syncEyes = () => {
  if (!editForm.value.sync_eyes) return;
  editForm.value.left_atropine = editForm.value.right_atropine;
  editForm.value.left_glasses = editForm.value.right_glasses;
  editForm.value.left_glasses_pp = editForm.value.right_glasses_pp;
  editForm.value.left_hg = editForm.value.right_hg;
  editForm.value.left_hg_dw = editForm.value.right_hg_dw;
  editForm.value.left_physiotherapy = editForm.value.right_physiotherapy;
  editForm.value.left_visual_training = editForm.value.right_visual_training;
};

// 监听同步勾选
watch(() => editForm.value.sync_eyes, (val) => {
  if (val) {
    syncEyes();
  }
});

// 监听右眼字段变化
watch([
  () => editForm.value.right_atropine,
  () => editForm.value.right_glasses,
  () => editForm.value.right_glasses_pp,
  () => editForm.value.right_hg,
  () => editForm.value.right_hg_dw,
  () => editForm.value.right_physiotherapy,
  () => editForm.value.right_visual_training
], () => {
  if (editForm.value.sync_eyes) {
    syncEyes();
  }
});

// 同步上次诊疗方案
const handleSyncPreviousTreatment = async () => {
  try {
    // 尝试多种方式获取 patientId（参考TreatmentPlan.vue的实现）
    const patientId = props.currentRecord?.patient_id_id || props.currentRecord?.patient_id || props.patientInfo?.patient_id || props.patientInfo?.id;
    
    if (!patientId) {
      message.error('无法获取患者ID，请刷新页面后重试');
      console.error('patient_id 未找到，currentRecord:', props.currentRecord, 'patientInfo:', props.patientInfo);
      return;
    }
    
    const currentRecordId = props.currentRecord?.id;
    const currentDate = props.currentRecord?.examination_date;
    
    if (!currentRecordId || !currentDate) {
      message.error('当前检查记录信息不完整');
      return;
    }
    
    // 从sessionStorage获取历史记录
    let historyRecords = [];
    const storageKey = `patient_${patientId}`;
    const savedData = sessionStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        historyRecords = parsed.allData || parsed.examinationRecords || [];
      } catch (e) {
        console.error('解析 sessionStorage 数据失败:', e);
      }
    }
    
    // 如果sessionStorage没有数据，尝试从API获取
    if (!historyRecords || historyRecords.length === 0) {
      try {
        const response = await fetch(`https://aiforoptometry.com/medicalrecords/records?patient_id=${patientId}`);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data.status_code === 200 && data.data) {
              historyRecords = data.data;
            }
          }
        }
      } catch (fetchError) {
        console.error('获取历史记录失败:', fetchError);
        message.warning('网络请求失败，将仅使用本地缓存数据');
      }
    }
    
    // 当前日期
    const currentDateObj = new Date(currentDate);
    
    // 检查记录是否有方案数据的辅助函数
    const hasPlanData = (record) => {
      return record.right_atropine || record.right_glasses || record.right_hg ||
             record.left_atropine || record.left_glasses || record.left_hg ||
             record.right_visual_training || record.right_physiotherapy ||
             record.left_visual_training || record.left_physiotherapy;
    };
    
    // 过滤掉当前记录
    const validRecords = historyRecords.filter(
      record => record.id !== currentRecordId && record.examination_date
    );
    
    let previousRecord = null;
    
    // 步骤1: 优先找早于当前日期的最近一次有方案的检查
    const earlierRecords = validRecords
      .filter(record => new Date(record.examination_date) < currentDateObj)
      .sort((a, b) => new Date(b.examination_date) - new Date(a.examination_date)); // 从新到旧
    
    for (const record of earlierRecords) {
      if (hasPlanData(record)) {
        previousRecord = record;
        break;
      }
    }
    
    // 步骤2: 如果没有找到早于当前日期的，则找最早日期的有方案检查
    if (!previousRecord) {
      const allRecordsAsc = validRecords
        .sort((a, b) => new Date(a.examination_date) - new Date(b.examination_date)); // 从旧到新
      
      for (const record of allRecordsAsc) {
        if (hasPlanData(record)) {
          previousRecord = record;
          break;
        }
      }
    }
    
    if (!previousRecord) {
      message.warning('未找到可同步的历史诊疗方案');
      return;
    }
    
    // 弹窗确认
    const examDate = dayjs(previousRecord.examination_date).format('YYYY-MM-DD');
    Modal.confirm({
      title: '确认同步诊疗方案',
      icon: createVNode(ExclamationCircleOutlined),
      content: `是否同步 ${examDate} 的诊疗方案？`,
      okText: '确认',
      cancelText: '取消',
      onOk() {
        return new Promise((resolve) => {
          nextTick(() => {
            // 同步诊疗方案数据
            editForm.value.right_atropine = previousRecord.right_atropine || editForm.value.right_atropine;
            editForm.value.right_glasses = previousRecord.right_glasses || editForm.value.right_glasses;
            editForm.value.right_glasses_pp = previousRecord.right_glasses_pp || editForm.value.right_glasses_pp;
            editForm.value.right_hg = previousRecord.right_hg || editForm.value.right_hg;
            editForm.value.right_hg_dw = previousRecord.right_hg_dw || editForm.value.right_hg_dw;
            editForm.value.right_visual_training = previousRecord.right_visual_training || editForm.value.right_visual_training;
            editForm.value.right_physiotherapy = previousRecord.right_physiotherapy || editForm.value.right_physiotherapy;
            
            editForm.value.left_atropine = previousRecord.left_atropine || editForm.value.left_atropine;
            editForm.value.left_glasses = previousRecord.left_glasses || editForm.value.left_glasses;
            editForm.value.left_glasses_pp = previousRecord.left_glasses_pp || editForm.value.left_glasses_pp;
            editForm.value.left_hg = previousRecord.left_hg || editForm.value.left_hg;
            editForm.value.left_hg_dw = previousRecord.left_hg_dw || editForm.value.left_hg_dw;
            editForm.value.left_visual_training = previousRecord.left_visual_training || editForm.value.left_visual_training;
            editForm.value.left_physiotherapy = previousRecord.left_physiotherapy || editForm.value.left_physiotherapy;
            
            // 如果开启了双眼同步，同步到左眼
            if (editForm.value.sync_eyes) {
              syncEyes();
            }
            
            message.success(`已同步 ${examDate} 的诊疗方案`);
            resolve();
          });
        });
      }
    });
    
  } catch (error) {
    console.error('同步诊疗方案失败:', error);
    message.error('同步诊疗方案失败: ' + error.message);
  }
};

defineExpose({
  syncSchemeSelectionToEditForm
});
</script>

<style scoped lang="scss">
.page-one-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  max-width: 100%;
  height: 100%;
  position: relative;
  z-index: 2;
  box-sizing: border-box;
  /* 与 RoutineExamStyleTwo / ExamResultsUnified 基础检查表内字号一致 */
  --exr-font-body: 11px;
  --exr-font-table: 12px;
  /* 诊疗方案表：更紧凑 */
  --exr-font-treatment-plan: 11px;
  --exr-treatment-select-width: 80px;
  --exr-font-section-title: 16px;
}

/* 编辑态：检查间隔 → 诊断 → 备注（草图式纵向布局） */
.clinical-edit-mockup {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: none;
}
/* 页眉：检查间隔 + 预约医生等，与下方诊断区分隔 */
.clinical-edit-mockup__header {
  padding-bottom: 10px;
  margin-bottom: 0;
  border-bottom: 1px solid #e4eaf4;
}
/* 检查间隔在左；下次复查两行并靠最右 */
.clinical-edit-mockup__interval-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: clamp(12px, 2.5vw, 24px);
  font-size: 12px;
  color: #333;
  width: 100%;
  min-width: 0;
}
.clinical-edit-mockup__interval-group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-width: 0;
}
.clinical-edit-mockup__interval-group--with-sync {
  flex-wrap: wrap;
  align-items: center;
  row-gap: 6px;
  column-gap: 8px;
}
.clinical-edit-mockup__sync-from-prev {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.clinical-edit-mockup__sync-btn {
  margin: 0;
  padding: 1px 6px;
  font-size: 10px;
  line-height: 1.35;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  background: #fafafa;
  color: #555;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.clinical-edit-mockup__sync-btn:hover {
  background: #f0f0f0;
  color: #224b96;
  border-color: #c8c8c8;
}
.clinical-edit-mockup__sync-btn--active {
  background: #e6f0ff;
  color: #224b96;
  border-color: #91a8d8;
  font-weight: 600;
}
/* 下次复查日期 + 其下的预约医生，纵向排在同一列（靠右） */
.clinical-edit-mockup__review-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex: 0 0 auto;
  margin-left: auto;
  min-width: 0;
  max-width: 100%;
}

.clinical-edit-mockup__review-stack .clinical-edit-mockup__review-date-group {
  margin-left: 0;
}

.clinical-edit-mockup__review-date-group {
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex: 0 0 auto;
  margin-left: auto;
  min-width: 0;
  line-height: 1.2;
}
.clinical-edit-mockup__review-date-group .clinical-edit-mockup__interval-label {
  flex-shrink: 0;
  line-height: 1.2;
}
.clinical-edit-mockup__interval-label {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  white-space: nowrap;
}
.clinical-edit-mockup__interval-value {
  font-size: 12px;
  font-weight: 600;
  color: #1a202c;
  min-width: 2.75rem;
}
.clinical-edit-mockup__dates {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  font-size: var(--exr-font-body);
}
.clinical-edit-mockup__dates--appointment-only {
  margin-top: 2px;
}

.clinical-edit-mockup__dates--under-review {
  margin-top: 0;
  justify-content: flex-end;
  width: 100%;
}

.clinical-edit-mockup__dates--under-review .clinical-edit-mockup__date-item {
  justify-content: flex-end;
  width: 100%;
}
@media (max-width: 640px) {
  .clinical-edit-mockup__interval-row {
    flex-wrap: wrap;
    row-gap: 8px;
  }

  .clinical-edit-mockup__review-stack {
    width: 100%;
    align-items: stretch;
  }

  .clinical-edit-mockup__review-date-group {
    width: 100%;
    justify-content: flex-end;
  }
}
.clinical-edit-mockup__date-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.clinical-edit-mockup__date-label {
  font-size: var(--exr-font-body);
  color: #555;
  font-weight: 500;
  white-space: nowrap;
}
/* 与查看态 instructions-advice-row 一致：左本次、右上次，窄屏再纵向堆叠 */
.clinical-edit-mockup__remarks {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: clamp(0.5rem, 1.5vw, 1rem);
}
.clinical-edit-mockup__prev-remarks,
.clinical-edit-mockup__curr-remarks {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}
/* 两列并排时：本次与上一条之间的竖分割线 */
.clinical-edit-mockup__curr-remarks {
  border-right: 1px solid #e4eaf4;
  padding-right: clamp(0.65rem, 1.8vw, 0.9rem);
  margin-right: clamp(0.15rem, 0.8vw, 0.35rem);
  box-sizing: border-box;
}
.clinical-edit-mockup__remarks-label {
  font-size: var(--exr-font-body);
  font-weight: 600;
  color: #555;
}
.clinical-edit-mockup__remarks-text {
  font-size: var(--exr-font-body);
  color: #333;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 查看态：医生建议正文与诊断「屈光不正」只读一致 */
.clinical-view-mockup .clinical-edit-mockup__remarks-text {
  font-family: "SimSun", "宋体", serif;
  font-size: var(--exr-font-body);
  font-weight: 600;
  color: #333;
  line-height: 1.35;
}
/* 与 PatientStyleTwo .diagnosis-dx-input（屈光不正）完全一致：宋体、--exr-font-body、600、#333、行高 1.35 */
.clinical-edit-mockup__remarks-input-wrap {
  width: 100%;
  max-width: 100%;
  font-size: var(--exr-font-body, 11px);
}

/* 备注区：无整体外框；快捷词与文本域上下排列 */
.clinical-edit-mockup__remarks-box {
  width: 100%;
  border: none;
  border-radius: 0;
  background: transparent;
  box-sizing: border-box;
  overflow: visible;
}

.clinical-edit-mockup__remarks-quick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  padding: 0 0 6px;
  border: none;
  background: transparent;
}

/* 快捷词条：无边框、小尺寸、浅底文字按钮 */
.clinical-edit-mockup__remarks-quick-btn {
  margin: 0;
  padding: 1px 5px;
  font-size: 10px;
  line-height: 1.35;
  border: none;
  border-radius: 3px;
  background: #f0f0f0;
  color: #555;
  cursor: pointer;
  font-family: inherit;
  box-shadow: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.clinical-edit-mockup__remarks-quick-btn:hover {
  background: #e8e8e8;
  color: #224b96;
}

.clinical-edit-mockup__remarks-quick-btn:active {
  background: #dedede;
  color: #1a3d7a;
}

.clinical-edit-mockup__remarks-input {
  width: 100%;
  max-width: 100%;
}

/* 去掉整体外框后：文本域保留浅色边线便于辨认 */
.clinical-edit-mockup__remarks-box .clinical-edit-mockup__remarks-input :deep(textarea.ant-input) {
  border: 1px solid #e8e8e8 !important;
  box-shadow: none !important;
  border-radius: 4px !important;
  resize: vertical;
}

.clinical-edit-mockup__remarks-input-wrap :deep(.ant-input),
.clinical-edit-mockup__remarks-input :deep(textarea.ant-input) {
  padding: 2px 8px 6px !important;
  font-family: "SimSun", "宋体", serif !important;
  font-size: var(--exr-font-body, 11px) !important;
  font-weight: 600 !important;
  color: #333 !important;
  line-height: 1.35 !important;
}
.clinical-edit-mockup__remarks-input :deep(textarea.ant-input::placeholder) {
  font-family: "SimSun", "宋体", serif !important;
  color: #bfbfbf !important;
}
.clinical-edit-mockup__remarks-input :deep(textarea.ant-input::-webkit-input-placeholder) {
  font-family: "SimSun", "宋体", serif !important;
  color: #bfbfbf !important;
}
.clinical-edit-mockup__remarks-input :deep(textarea.ant-input::-moz-placeholder) {
  font-family: "SimSun", "宋体", serif !important;
  color: #bfbfbf !important;
  opacity: 1;
}
.clinical-edit-mockup :deep(.ant-picker),
.clinical-edit-mockup :deep(.ant-picker-input > input) {
  font-size: var(--exr-font-body) !important;
}
/* 下次复查：与「检查间隔」行同字号；日期框更小一号 */
.clinical-edit-mockup__review-date-group :deep(.ant-picker) {
  display: inline-flex;
  align-items: center;
  width: 108px;
  min-width: 108px;
  max-width: 108px;
  height: 26px;
  min-height: 26px;
  padding: 0 4px;
  box-sizing: border-box;
}
.clinical-edit-mockup__review-date-group :deep(.ant-picker-input) {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
}
/* 单行 input：line-height 与可视高度一致，避免字体贴顶 */
.clinical-edit-mockup__review-date-group :deep(.ant-picker-input > input) {
  font-size: 12px !important;
  color: #333 !important;
  width: 100%;
  height: 20px !important;
  min-height: 20px !important;
  max-height: 20px !important;
  line-height: 20px !important;
  padding: 0 2px !important;
  margin: 0 !important;
  border: none !important;
  box-shadow: none !important;
  text-align: left;
  vertical-align: middle;
}
.clinical-edit-mockup__review-date-group :deep(.ant-picker-suffix) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  margin-inline-start: 2px;
  padding-inline-end: 0;
  line-height: 1;
}
.clinical-edit-mockup__review-date-group :deep(.anticon-calendar) {
  display: block;
  font-size: 12px;
  line-height: 1;
}

.clinical-edit-mockup :deep(.ant-select),
.clinical-edit-mockup :deep(.ant-select-selection-item) {
  font-size: var(--exr-font-body) !important;
}

/* 预约医生：标签用 interval-label；下拉与日期选择器同尺寸（须放在全局 ant-select 之后） */
.clinical-edit-mockup__dates--under-review :deep(.clinical-edit-mockup__appointment-doctor-select.ant-select) {
  width: 108px !important;
  min-width: 108px;
  max-width: 108px;
  font-size: 12px !important;
}

.clinical-edit-mockup__dates--under-review :deep(.clinical-edit-mockup__appointment-doctor-select .ant-select-selector) {
  height: 26px !important;
  min-height: 26px !important;
  padding: 0 4px !important;
  box-sizing: border-box;
}

.clinical-edit-mockup__dates--under-review
  :deep(.clinical-edit-mockup__appointment-doctor-select .ant-select-selection-item),
.clinical-edit-mockup__dates--under-review
  :deep(.clinical-edit-mockup__appointment-doctor-select .ant-select-selection-placeholder) {
  font-size: 12px !important;
  line-height: 22px !important;
  color: #333 !important;
}

.clinical-edit-mockup__dates--under-review :deep(.clinical-edit-mockup__appointment-doctor-select .ant-select-selection-item) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clinical-edit-mockup__dates--under-review :deep(.clinical-edit-mockup__appointment-doctor-select .ant-select-arrow) {
  font-size: 12px;
  right: 4px;
  width: 14px;
  height: 14px;
}

.clinical-edit-mockup__dates--under-review :deep(.clinical-edit-mockup__appointment-doctor-select .anticon) {
  font-size: 12px;
}

// 主标题
.main-title-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.3rem, 1vw, 0.5rem);
  padding: clamp(0.5rem, 2vw, 1rem) 0;
  position: relative;
}

.main-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 800;
  background: linear-gradient(135deg, #224b96 0%, #4a7bc8 50%, #6ba3e8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(34, 75, 150, 0.2);
  letter-spacing: clamp(0.1rem, 0.3vw, 0.25rem);
  margin: 0;
  position: relative;
  text-align: center;
  line-height: 1.2;
}

.title-decoration {
  width: clamp(60px, 15vw, 120px);
  height: clamp(2px, 0.5vw, 4px);
  background: linear-gradient(90deg, transparent 0%, #224b96 20%, #4a7bc8 50%, #224b96 80%, transparent 100%);
  border-radius: 2px;
  box-shadow: 0 2px 6px rgba(34, 75, 150, 0.3);
  position: relative;
}

.title-decoration::before,
.title-decoration::after {
  content: '';
  position: absolute;
  top: 50%;
  width: clamp(4px, 1vw, 8px);
  height: clamp(4px, 1vw, 8px);
  background: #224b96;
  border-radius: 50%;
  transform: translateY(-50%);
  box-shadow: 0 0 8px rgba(34, 75, 150, 0.5);
}

.title-decoration::before {
  left: clamp(-10px, -2vw, -20px);
}

.title-decoration::after {
  right: clamp(-10px, -2vw, -20px);
}

// 1. Logo和机构名称
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4mm 0;
  border-bottom: 2px solid #e0e6f5;
}

.org-name {
  font-size: 18px;
  font-weight: 600;
  color: #224b96;
}

.logo-img {
  height: clamp(1rem, 4vw, 2rem);
  width: auto;
  max-width: clamp(2rem, 10vw, 5rem);
  object-fit: contain;
}

.section-title {
  font-size: var(--exr-font-section-title);
  font-weight: 600;
  color: #224b96;
  margin: 0;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  position: relative;
  background: linear-gradient(135deg, rgba(34, 75, 150, 0.08) 0%, rgba(234, 240, 255, 0.6) 100%);
  border-radius: 8px;
  border-left: 4px solid #224b96;
  
  .section-title-text {
    text-align: left;
    flex-shrink: 0;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
  }
  
  .section-edit-controls-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    margin-left: 16px;
    border-radius: 4px;
    background: transparent;
    flex-shrink: 0;
    isolation: isolate; /* 创建新的堆叠上下文，防止事件穿透 */
    position: relative;
    z-index: 10;
    
    // 鼠标悬停时显示微妙的背景色，表示这是一个独立区域
    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    :deep(.ant-checkbox-wrapper) {
      margin: 0;
      cursor: pointer;
      
      .ant-checkbox {
        cursor: pointer;
      }
      
      span:not(.ant-checkbox) {
        cursor: pointer;
        user-select: none;
      }
    }
    
    .ant-btn {
      margin: 0;
    }
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, #e8edf5 10%, #e8edf5 90%, transparent 100%);
    transition: all 0.3s ease;
  }
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #224b96 0%, #4a7bc8 100%);
    transition: width 0.3s ease;
  }
  
  &.clickable {
    cursor: pointer;
    user-select: none;
    
    &:hover {
      background: linear-gradient(135deg, rgba(34, 75, 150, 0.12) 0%, rgba(234, 240, 255, 0.8) 100%);
      border-left-color: #4a7bc8;
      &::before {
        width: 100%;
      }
      color: #224b96;
    }
  }
}

.section-toggle-icon {
  margin-left: auto;
  color: #666;
  font-size: 13px;
  flex-shrink: 0;
  cursor: pointer;
}

// 3. 医嘱
.doctor-instructions-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  background: transparent !important;
  
  // 收缩状态缩小间距（优先级最高）
  &.collapsed {
    margin-bottom: 2px !important;
    padding-bottom: 0 !important;
    gap: 0 !important;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #f0f2f5;
  }
}

.instructions-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: clamp(0.5rem, 1.5vw, 1rem);
  background: transparent !important;
  border: none !important;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.instruction-title {
  font-size: clamp(0.875rem, 2vw, 0.875rem);
  font-weight: 600;
  color: #224b96;
  text-align: center;
  padding-bottom: clamp(0.2rem, 0.5vw, 0.5rem);
  margin-bottom: clamp(0.2rem, 0.5vw, 0.5rem);
  border-bottom: 1px solid #e0e6f5;
}

.instructions-items-row {
  display: flex;
  flex-direction: row;
  gap: clamp(1rem, 4vw, 2rem);
  align-items: baseline;
  justify-content: center;
  flex-wrap: wrap;
}

.interval-item {
  flex: 0 0 auto;
  min-width: auto;
}

.instruction-item {
  display: flex;
  flex-direction: row;
  gap: 4px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  flex: 0 0 auto;
  min-width: 0;
  align-items: baseline;
  white-space: nowrap;
}

.instruction-divider {
  height: 1px;
  background: #e0e6f5;
  margin: clamp(0.3rem, 1vw, 0.5rem) 0;
  width: 100%;
}

.instructions-advice-row {
  display: flex;
  flex-direction: row;
  gap: clamp(0.5rem, 1.5vw, 1rem);
  align-items: flex-start;
  flex-wrap: wrap;
}

.instruction-advice-item {
  display: flex;
  flex-direction: column;
  gap: 2mm;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.instruction-label {
  font-size: var(--exr-font-body);
  font-weight: 600;
  color: #555;
  margin-bottom: 0;
  white-space: nowrap;
  margin-right: clamp(0.2rem, 0.5vw, 0.25rem);
  line-height: 1.5;
  vertical-align: baseline;
}

.instruction-value {
  font-size: var(--exr-font-body);
  line-height: 1.5;
  color: #333;
  white-space: nowrap;
  vertical-align: baseline;
}

/* 医生建议正文区域：允许换行，避免长文本溢出（一劳永逸） */
.instruction-advice-item .instruction-value {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
}

// 4. 诊疗方案（与下方医生建议之间的分割线）
.treatment-plan-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 4px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4eaf4;
  width: 100%;
  max-width: 100%;
  background: transparent !important;
  
  // 收缩状态缩小间距（优先级最高）
  &.collapsed {
    margin-bottom: 2px !important;
    padding-bottom: 8px !important;
    gap: 0 !important;
  }
}

/* 诊疗方案 Rx：行式（标签 | 选择 | 眼别 | 备注） */
.treatment-plan-rx {
  /* 本块内略收紧字号与控件尺寸 */
  --exr-font-treatment-plan: 10px;
  /* 与下拉层同宽（dropdownMatchSelectWidth），需能完整显示 0.01% / 短选项 */
  --exr-treatment-select-width: 100px;
  width: 100%;
  font-size: var(--exr-font-treatment-plan);
  margin-bottom: 0;

  &__title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin-bottom: 4px;
    min-height: 0;
  }

  &__title {
    font-weight: 600;
    color: #555;
    margin-bottom: 0;
    font-size: var(--exr-font-body);
    line-height: 1.35;
  }

  &__scheme-btn {
    position: relative;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    margin: 0;
    height: 20px;
    padding: 0 9px;
    cursor: pointer;
    overflow: hidden;
    border-radius: 999px;
    border: 1px solid #9aa3ad;
    background: #fff;
    color: #555;
    font-size: 9px;
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    vertical-align: middle;
    z-index: 1;
    transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease;
    -webkit-appearance: none;
    appearance: none;
  }

  &__scheme-btn:hover {
    background: #224b96;
    border-color: #224b96;
  }

  &__scheme-btn-text {
    position: relative;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: translateX(0);
    transition: all 0.3s ease;
  }

  &__scheme-btn-hover-content {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    color: #fff;
    opacity: 0;
    transform: translateX(18px);
    transition: all 0.3s ease;
    pointer-events: none;
  }

  &__scheme-btn-arrow {
    font-size: 9px;
    line-height: 1;
  }

  &__scheme-btn:hover &__scheme-btn-text {
    transform: translateX(20px);
    opacity: 0;
  }

  &__scheme-btn:hover &__scheme-btn-hover-content {
    transform: translateX(0);
    opacity: 1;
  }

  &__rx {
    color: #555;
    font-weight: 600;
  }

  /* 各行相对「诊疗方案 Rx」标题向右缩进两格（与诊断列表一致） */
  &__row {
    display: grid;
    grid-template-columns: 4.75rem minmax(0, 1fr) auto minmax(72px, 1.1fr);
    gap: 4px 6px;
    align-items: center;
    padding: 4px 0 4px 2em;
    box-sizing: border-box;
  }

  &__selected-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
    padding: 4px 0;
    align-items: start;
  }

  &__selected-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    min-width: 0;
  }

  &__selected-idx {
    flex-shrink: 0;
    color: #000;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.35;
  }

  &__selected-text {
    min-width: 0;
    width: auto;
    max-width: none;
    border-bottom: none;
    color: #000;
    font-family: "SimSun", "宋体", serif;
    font-size: var(--exr-font-treatment-plan);
    font-weight: 400;
    line-height: 1.4;
    padding-bottom: 2px;
    white-space: nowrap;
  }

  &__selected-chip {
    border: 1px solid #d4def1;
    background: #f8fbff;
    color: #555;
    font-family: "SimSun", "宋体", serif;
    font-weight: 700;
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 11px;
    line-height: 1.45;
    cursor: pointer;
    transition: all 0.16s ease;
    white-space: normal;
    text-align: left;
    min-width: 0;
    flex: 1;
  }

  &__selected-chip:hover {
    background: #f4f4f4;
    border-color: #cccccc;
  }

  &__selected-chip--readonly {
    cursor: default;
    pointer-events: none;
  }

  &__selected-chip--readonly:hover {
    background: #f8fbff;
    border-color: #d4def1;
  }

  &__selected-empty {
    color: #999;
    font-size: var(--exr-font-treatment-plan);
    line-height: 1.4;
  }

  &__selected-remove {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #ff4d4f;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    transition: background-color 0.15s ease;
  }

  &__selected-remove:hover {
    background: #fff1f0;
  }

  &--view &__row {
    border-bottom: 1px solid #f0f2f5;
  }

  &__label {
    color: #333;
    font-weight: 500;
    text-align: left;
  }

  &__value-cell {
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    color: #333;
  }

  &__mono {
    font-size: var(--exr-font-treatment-plan);
    white-space: nowrap;
  }

  &__eye-scope {
    flex-shrink: 0;
  }

  &__scope-badge {
    font-size: 11px;
    color: #224b96;
    padding: 0 4px;
    white-space: nowrap;
  }

  &__remark-input {
    border-bottom: 1px solid #d9d9d9 !important;
    border-radius: 0 !important;
    padding-left: 0 !important;
    background: transparent !important;
  }

  &__remark-view {
    font-size: var(--exr-font-treatment-plan);
    color: #666;
    min-width: 0;
    text-align: left;
    word-break: break-word;
  }

  &__selects {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    align-items: center;
    min-width: 0;
  }

  &__select {
    min-width: 72px;
    max-width: 100%;
  }

  &__select--narrow {
    width: var(--exr-treatment-select-width) !important;
    min-width: 0;
  }

  :deep(.ant-select) {
    width: var(--exr-treatment-select-width) !important;
    min-width: 0 !important;
    max-width: var(--exr-treatment-select-width);
  }
  :deep(.ant-select:not(.ant-select-customize-input) .ant-select-selector) {
    min-height: 20px !important;
    height: 20px !important;
    padding: 0 4px !important;
  }
  :deep(.ant-select-selection-item),
  :deep(.ant-select-selection-placeholder) {
    line-height: 18px !important;
    font-size: var(--exr-font-treatment-plan) !important;
  }
  :deep(.ant-select .ant-select-arrow) {
    font-size: 10px;
    right: 6px;
  }
  :deep(.ant-select),
  :deep(.ant-select-selection-item),
  :deep(.ant-input) {
    font-size: var(--exr-font-treatment-plan) !important;
  }

  :deep(.ant-radio-button-wrapper) {
    padding-inline: 5px !important;
    padding-block: 0 !important;
    font-size: var(--exr-font-treatment-plan) !important;
    line-height: 18px !important;
    height: 20px !important;
    min-height: 20px !important;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .instructions-items-row {
    flex-direction: column;
    gap: clamp(0.5rem, 2vw, 1rem);
    align-items: flex-start;
  }
  
  .instructions-advice-row {
    flex-direction: column;
  }

  .clinical-edit-mockup__remarks {
    flex-direction: column;
  }

  .clinical-edit-mockup__curr-remarks {
    border-right: none;
    padding-right: 0;
    margin-right: 0;
    border-bottom: 1px solid #e4eaf4;
    padding-bottom: 10px;
    margin-bottom: 6px;
  }
  
}

@media (max-width: 480px) {
  .page-one-container {
    padding: clamp(0.25rem, 1vw, 0.5rem);
  }
  
  .instructions-content-wrapper {
    padding: clamp(0.3rem, 1vw, 0.5rem);
  }
  
}

// 确保A4页面内不超出
@media print {
  .page-one-container {
    max-height: 277mm; // A4高度297mm - 上下边距20mm
  }
}
</style>

<style lang="scss">
/* 诊疗方案下拉：比窄触发器更宽，便于完整显示选项（dropdownMatchSelectWidth=false） */
.treatment-plan-rx-dropdown.ant-select-dropdown {
  min-width: 152px !important;
  max-width: min(92vw, 360px);

  .ant-select-item-option-content {
    white-space: nowrap;
  }
}

/* 方案选择弹窗（内容在 Modal 内，非 scoped） */
.scheme-plan-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
}

.scheme-plan-modal__row {
  display: grid;
  grid-template-columns: 7rem 9.25rem minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px 10px;
  align-items: center;
}

.scheme-plan-modal__eye {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.scheme-plan-modal__eye-btn {
  flex: 1 1 0;
  min-width: 0;
  margin: 0;
  padding: 0 2px;
  font-size: 11px;
  line-height: 22px;
  min-height: 24px;
  border: none;
  border-right: 1px solid #d9d9d9;
  background: #fff;
  color: #555;
  cursor: pointer;
  text-align: center;
  box-sizing: border-box;
  transition: background 0.15s ease, color 0.15s ease;
}

.scheme-plan-modal__eye-btn:last-child {
  border-right: none;
}

.scheme-plan-modal__eye-btn:hover {
  color: #224b96;
  background: #f5f8ff;
}

.scheme-plan-modal__eye-btn--active {
  background: #224b96;
  color: #fff;
}

.scheme-plan-modal__eye-btn--active:hover {
  background: #1a3d7a;
  color: #fff;
}

.scheme-plan-modal__row--active {
  background: #f7fbff;
  border: 1px solid #d9e7fa;
  border-radius: 6px;
  padding: 6px 8px;
}

.scheme-plan-modal__label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.scheme-plan-modal__select {
  width: 156px;
  max-width: 100%;
}

.scheme-plan-modal__select--span2 {
  grid-column: 3 / 5;
}

.scheme-plan-modal :deep(.ant-select-selector) {
  min-height: 26px !important;
  height: 26px !important;
  padding: 0 8px !important;
}

.scheme-plan-modal :deep(.ant-select-selection-item),
.scheme-plan-modal :deep(.ant-select-selection-placeholder),
.scheme-plan-modal :deep(.ant-select-arrow) {
  font-size: 12px !important;
}

.scheme-plan-modal :deep(.ant-select-selection-item),
.scheme-plan-modal :deep(.ant-select-selection-placeholder) {
  line-height: 24px !important;
}
</style>
