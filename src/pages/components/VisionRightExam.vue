<template>
  <div class="vision-exam">
    <Teleport defer to="#vision-btn-group3">
      <div style="text-align: right; margin-bottom: 16px;display: flex;justify-content: right">
        <a-button class="header-btn" v-if="!isEditMode" type="primary" @click="startEdit">编辑</a-button>
        <a-button class="header-btn" v-if="isEditMode" type="primary" @click="handleSave" style="margin-right: 8px;">保存</a-button>
        <a-button class="header-btn" v-if="isEditMode" type="primary" @click="handleCancel">取消</a-button>
      </div>
    </Teleport>
    <div class="exam-content">
      <div v-if="!record">暂无检查数据</div>
      <div v-else>
        <table class="vision-table">
          <thead>
          <tr>
            <th rowspan="4" class="date-header">
              <div>检查日期</div>
              <div class="date-value">
                <template v-if="!isEditMode">{{ formatDate(record.examination_date) }}</template>
                <template v-else>
                  <a-date-picker v-model:value="form.examination_date" style="width: 120px" />
                </template>
              </div>
            </th>
            <th colspan="5" class="group-main">主觉验光</th>
            <th colspan="4" class="group-main">电脑验光</th>
          </tr>
          <tr>
            <th class="group-main">球镜</th>
            <th class="group-main">柱镜</th>
            <th class="group-main">轴位</th>
            <th class="group-main">视力</th>
            <th class="group-main">瞳距</th>
            <th class="group-main">球镜</th>
            <th class="group-main">柱镜</th>
            <th class="group-main">轴位</th>
            <th class="group-main">瞳距</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td class="eye-label">右眼</td>
            <td>
              <template v-if="!isEditMode">{{ record.subjective_right_spherical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.subjective_right_spherical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.subjective_right_cylindrical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.subjective_right_cylindrical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.subjective_right_axis ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.subjective_right_axis" :min="0" :max="180" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.subjective_right_old_vision ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.subjective_right_old_vision" :step="0.1" style="width: 80px" />
              </template>
            </td>
            <td></td>
            <td>
              <template v-if="!isEditMode">{{ record.objective_right_spherical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.objective_right_spherical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.objective_right_cylindrical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.objective_right_cylindrical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.objective_right_axis ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.objective_right_axis" :min="0" :max="180" style="width: 80px" />
              </template>
            </td>
            <td></td>
          </tr>
          <tr>
            <td class="eye-label">左眼</td>
            <td>
              <template v-if="!isEditMode">{{ record.subjective_left_spherical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.subjective_left_spherical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.subjective_left_cylindrical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.subjective_left_cylindrical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.subjective_left_axis ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.subjective_left_axis" :min="0" :max="180" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.subjective_left_old_vision ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.subjective_left_old_vision" :step="0.1" style="width: 80px" />
              </template>
            </td>
            <td></td>
            <td>
              <template v-if="!isEditMode">{{ record.objective_left_spherical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.objective_left_spherical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.objective_left_cylindrical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.objective_left_cylindrical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.objective_left_axis ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.objective_left_axis" :min="0" :max="180" style="width: 80px" />
              </template>
            </td>
            <td></td>
          </tr>
          <tr>
            <td class="eye-label">双眼</td>
            <td></td>
            <td></td>
            <td></td>
            <td>
              <template v-if="!isEditMode">{{ record.subjective_both_old_vision ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.subjective_both_old_vision" :step="0.1" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.subjective_both_pupil_distance ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.subjective_both_pupil_distance" :step="0.5" style="width: 80px" />
              </template>
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td>
              <template v-if="!isEditMode">{{ record.objective_pupil_distance ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.objective_pupil_distance" :step="0.5" style="width: 80px" />
              </template>
            </td>
          </tr>
          </tbody>
        </table>
        <table class="vision-table">
          <thead>
          <tr>
            <th colspan="5" class="group-old">旧镜参数</th>
            <th colspan="5" class="group-old header-right">配镜处方</th>
          </tr>
          <tr>
            <th class="group-old">球镜</th>
            <th class="group-old">柱镜</th>
            <th class="group-old">轴位</th>
            <th class="group-old">视力</th>
            <th class="group-old">瞳距</th>
            <th class="group-old">球镜</th>
            <th class="group-old">柱镜</th>
            <th class="group-old">轴位</th>
            <th class="group-old">视力</th>
            <th class="group-old">瞳距</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>
              <template v-if="!isEditMode">{{ record.vaec_right_spherical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vaec_right_spherical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vaec_right_cylindrical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vaec_right_cylindrical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vaec_right_axis ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vaec_right_axis" :min="0" :max="180" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vaec_right_old_vision ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vaec_right_old_vision" :step="0.1" style="width: 80px" />
              </template>
            </td>
            <td></td>
            <td>
              <template v-if="!isEditMode">{{ record.vacc_right_spherical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vacc_right_spherical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vacc_right_cylindrical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vacc_right_cylindrical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vacc_right_axis ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vacc_right_axis" :min="0" :max="180" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vacc_right_old_vision ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vacc_right_old_vision" :step="0.1" style="width: 80px" />
              </template>
            </td>
            <td></td>
          </tr>
          <tr>
            <td>
              <template v-if="!isEditMode">{{ record.vaec_left_spherical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vaec_left_spherical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vaec_left_cylindrical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vaec_left_cylindrical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vaec_left_axis ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vaec_left_axis" :min="0" :max="180" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vaec_left_old_vision ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vaec_left_old_vision" :step="0.1" style="width: 80px" />
              </template>
            </td>
            <td></td>
            <td>
              <template v-if="!isEditMode">{{ record.vacc_left_spherical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vacc_left_spherical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vacc_left_cylindrical ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vacc_left_cylindrical" :step="0.25" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vacc_left_axis ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vacc_left_axis" :min="0" :max="180" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vacc_left_old_vision ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vacc_left_old_vision" :step="0.1" style="width: 80px" />
              </template>
            </td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td>
              <template v-if="!isEditMode">{{ record.vaec_both_old_vision ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vaec_both_old_vision" :step="0.1" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vaec_both_pupil_distance ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vaec_both_pupil_distance" :step="0.5" style="width: 80px" />
              </template>
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td>
              <template v-if="!isEditMode">{{ record.vacc_both_old_vision ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vacc_both_old_vision" :step="0.1" style="width: 80px" />
              </template>
            </td>
            <td>
              <template v-if="!isEditMode">{{ record.vacc_both_pupil_distance ?? '' }}</template>
              <template v-else>
                <a-input-number v-model:value="form.vacc_both_pupil_distance" :step="0.5" style="width: 80px" />
              </template>
            </td>
          </tr>
          </tbody>
        </table>

        <!-- 添加图表容器 -->
        <div class="chart-container">
          <div class="chart-title">
            <ImgIcon class="qushi-icon" title="趋势"/>
            <h3>{{ chartOneTitle }}</h3>
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
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { initChart } from '@/utils/echarts';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import ImgIcon from "@/pages/components/ImgIcon.vue";

const props = defineProps({
  record: {
    type: Object,
    default: () => ({})
  },
  examinationRecords: {  // 添加检查记录数组属性
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['refresh']);

// 编辑模式相关
const isEditMode = ref(false);
const originalRecord = ref({});
const form = computed(() => props.record || {});

// 图表相关
const chartRef = ref(null);
let chart = null;
const noValidData = ref(false);
const selectedChartType = ref('subjective');
const chartOptions = [
  {
    key: 'subjective',
    title: '主视觉验光'
  },
  {
    key: 'prescription',
    title: '配镜处方'
  }
];
const chartOneTitle = computed(()=>{
  return  selectedChartType.value === 'subjective' ? '主觉验光数据趋势' : '配镜处方数据趋势';
})

// 开始编辑
function startEdit() {
  originalRecord.value = JSON.parse(JSON.stringify(form.value));
  if (form.value.examination_date && typeof form.value.examination_date === 'string') {
    form.value.examination_date = dayjs(form.value.examination_date);
  }
  isEditMode.value = true;
}

// 取消编辑
function handleCancel() {
  Object.assign(form.value, JSON.parse(JSON.stringify(originalRecord.value)));
  isEditMode.value = false;
}

// 保存数据
function handleSave() {
  console.log('handleSave record:', props.record);
  // 兼容 patient_id 和 patient_id_id
  const patientId = props.record.patient_id || props.record.patient_id_id;
  if (!props.record || !patientId) {
    message.error('缺少患者ID，无法保存');
    return;
  }

  // 收集表单数据
  const updatedRecord = {
    id: props.record.id,
    patient_id: patientId,
    examination_date: form.value.examination_date ? dayjs(form.value.examination_date).format('YYYY-MM-DD') : null,
    // 主觉验光
    subjective_right_spherical: form.value.subjective_right_spherical !== null && form.value.subjective_right_spherical !== undefined && form.value.subjective_right_spherical !== '' ? form.value.subjective_right_spherical : null,
    subjective_right_cylindrical: form.value.subjective_right_cylindrical !== null && form.value.subjective_right_cylindrical !== undefined && form.value.subjective_right_cylindrical !== '' ? form.value.subjective_right_cylindrical : null,
    subjective_right_axis: form.value.subjective_right_axis !== null && form.value.subjective_right_axis !== undefined && form.value.subjective_right_axis !== '' ? form.value.subjective_right_axis : null,
    subjective_right_old_vision: form.value.subjective_right_old_vision !== null && form.value.subjective_right_old_vision !== undefined && form.value.subjective_right_old_vision !== '' ? form.value.subjective_right_old_vision : null,
    subjective_left_spherical: form.value.subjective_left_spherical !== null && form.value.subjective_left_spherical !== undefined && form.value.subjective_left_spherical !== '' ? form.value.subjective_left_spherical : null,
    subjective_left_cylindrical: form.value.subjective_left_cylindrical !== null && form.value.subjective_left_cylindrical !== undefined && form.value.subjective_left_cylindrical !== '' ? form.value.subjective_left_cylindrical : null,
    subjective_left_axis: form.value.subjective_left_axis !== null && form.value.subjective_left_axis !== undefined && form.value.subjective_left_axis !== '' ? form.value.subjective_left_axis : null,
    subjective_left_old_vision: form.value.subjective_left_old_vision !== null && form.value.subjective_left_old_vision !== undefined && form.value.subjective_left_old_vision !== '' ? form.value.subjective_left_old_vision : null,
    subjective_both_old_vision: form.value.subjective_both_old_vision !== null && form.value.subjective_both_old_vision !== undefined && form.value.subjective_both_old_vision !== '' ? form.value.subjective_both_old_vision : null,
    subjective_both_pupil_distance: form.value.subjective_both_pupil_distance !== null && form.value.subjective_both_pupil_distance !== undefined && form.value.subjective_both_pupil_distance !== '' ? form.value.subjective_both_pupil_distance : null,
    // 电脑验光
    objective_right_spherical: form.value.objective_right_spherical !== null && form.value.objective_right_spherical !== undefined && form.value.objective_right_spherical !== '' ? form.value.objective_right_spherical : null,
    objective_right_cylindrical: form.value.objective_right_cylindrical !== null && form.value.objective_right_cylindrical !== undefined && form.value.objective_right_cylindrical !== '' ? form.value.objective_right_cylindrical : null,
    objective_right_axis: form.value.objective_right_axis !== null && form.value.objective_right_axis !== undefined && form.value.objective_right_axis !== '' ? form.value.objective_right_axis : null,
    objective_left_spherical: form.value.objective_left_spherical !== null && form.value.objective_left_spherical !== undefined && form.value.objective_left_spherical !== '' ? form.value.objective_left_spherical : null,
    objective_left_cylindrical: form.value.objective_left_cylindrical !== null && form.value.objective_left_cylindrical !== undefined && form.value.objective_left_cylindrical !== '' ? form.value.objective_left_cylindrical : null,
    objective_left_axis: form.value.objective_left_axis !== null && form.value.objective_left_axis !== undefined && form.value.objective_left_axis !== '' ? form.value.objective_left_axis : null,
    objective_pupil_distance: form.value.objective_pupil_distance !== null && form.value.objective_pupil_distance !== undefined && form.value.objective_pupil_distance !== '' ? form.value.objective_pupil_distance : null,
    // 旧镜参数
    vaec_right_spherical: form.value.vaec_right_spherical !== null && form.value.vaec_right_spherical !== undefined && form.value.vaec_right_spherical !== '' ? form.value.vaec_right_spherical : null,
    vaec_right_cylindrical: form.value.vaec_right_cylindrical !== null && form.value.vaec_right_cylindrical !== undefined && form.value.vaec_right_cylindrical !== '' ? form.value.vaec_right_cylindrical : null,
    vaec_right_axis: form.value.vaec_right_axis !== null && form.value.vaec_right_axis !== undefined && form.value.vaec_right_axis !== '' ? form.value.vaec_right_axis : null,
    vaec_right_old_vision: form.value.vaec_right_old_vision !== null && form.value.vaec_right_old_vision !== undefined && form.value.vaec_right_old_vision !== '' ? form.value.vaec_right_old_vision : null,
    vaec_left_spherical: form.value.vaec_left_spherical !== null && form.value.vaec_left_spherical !== undefined && form.value.vaec_left_spherical !== '' ? form.value.vaec_left_spherical : null,
    vaec_left_cylindrical: form.value.vaec_left_cylindrical !== null && form.value.vaec_left_cylindrical !== undefined && form.value.vaec_left_cylindrical !== '' ? form.value.vaec_left_cylindrical : null,
    vaec_left_axis: form.value.vaec_left_axis !== null && form.value.vaec_left_axis !== undefined && form.value.vaec_left_axis !== '' ? form.value.vaec_left_axis : null,
    vaec_left_old_vision: form.value.vaec_left_old_vision !== null && form.value.vaec_left_old_vision !== undefined && form.value.vaec_left_old_vision !== '' ? form.value.vaec_left_old_vision : null,
    vaec_both_old_vision: form.value.vaec_both_old_vision !== null && form.value.vaec_both_old_vision !== undefined && form.value.vaec_both_old_vision !== '' ? form.value.vaec_both_old_vision : null,
    vaec_both_pupil_distance: form.value.vaec_both_pupil_distance !== null && form.value.vaec_both_pupil_distance !== undefined && form.value.vaec_both_pupil_distance !== '' ? form.value.vaec_both_pupil_distance : null,
    // 配镜处方
    vacc_right_spherical: form.value.vacc_right_spherical !== null && form.value.vacc_right_spherical !== undefined && form.value.vacc_right_spherical !== '' ? form.value.vacc_right_spherical : null,
    vacc_right_cylindrical: form.value.vacc_right_cylindrical !== null && form.value.vacc_right_cylindrical !== undefined && form.value.vacc_right_cylindrical !== '' ? form.value.vacc_right_cylindrical : null,
    vacc_right_axis: form.value.vacc_right_axis !== null && form.value.vacc_right_axis !== undefined && form.value.vacc_right_axis !== '' ? form.value.vacc_right_axis : null,
    vacc_right_old_vision: form.value.vacc_right_old_vision !== null && form.value.vacc_right_old_vision !== undefined && form.value.vacc_right_old_vision !== '' ? form.value.vacc_right_old_vision : null,
    vacc_left_spherical: form.value.vacc_left_spherical !== null && form.value.vacc_left_spherical !== undefined && form.value.vacc_left_spherical !== '' ? form.value.vacc_left_spherical : null,
    vacc_left_cylindrical: form.value.vacc_left_cylindrical !== null && form.value.vacc_left_cylindrical !== undefined && form.value.vacc_left_cylindrical !== '' ? form.value.vacc_left_cylindrical : null,
    vacc_left_axis: form.value.vacc_left_axis !== null && form.value.vacc_left_axis !== undefined && form.value.vacc_left_axis !== '' ? form.value.vacc_left_axis : null,
    vacc_left_old_vision: form.value.vacc_left_old_vision !== null && form.value.vacc_left_old_vision !== undefined && form.value.vacc_left_old_vision !== '' ? form.value.vacc_left_old_vision : null,
    vacc_both_old_vision: form.value.vacc_both_old_vision !== null && form.value.vacc_both_old_vision !== undefined && form.value.vacc_both_old_vision !== '' ? form.value.vacc_both_old_vision : null,
    vacc_both_pupil_distance: form.value.vacc_both_pupil_distance !== null && form.value.vacc_both_pupil_distance !== undefined && form.value.vacc_both_pupil_distance !== '' ? form.value.vacc_both_pupil_distance : null,
  };

  // 发送请求到后端
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
              // 更新 currentData
              if (parsed.currentData && parsed.currentData.id === updatedRecord.id) {
                parsed.currentData = { ...parsed.currentData, ...updatedRecord };
              }
              // 更新 allData 或 examinationRecords
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
        console.error("更新失败:", error);
        message.error('保存失败: ' + error.message);
      });
}

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

// 日期格式化函数，兼容字符串、Date、dayjs对象
function formatDate(val) {
  if (!val) return '-';
  return dayjs(val).format('YYYY-MM-DD');
}

// 初始化图表
const initChartInstance = () => {
  if (!chartRef.value) return;
  chart = initChart(chartRef.value);
  updateChart();
};

// 更新图表数据
const updateChart = () => {
  if (noValidData.value) {
    if (chart) {
      chart.dispose();
      chart = null;
    }
    return;
  }
  if (!chartRef.value) return;
  if (chart) {
    chart.dispose();
    chart = null;
  }
  chart = initChart(chartRef.value);
  if (!props.examinationRecords.length) return;

  // 按日期排序
  const sortedRecords = [...props.examinationRecords].sort((a, b) =>
      new Date(a.examination_date) - new Date(b.examination_date)
  );

  // 过滤有效数据
  let validRecords;
  if (selectedChartType.value === 'subjective') {
    validRecords = sortedRecords.filter(record => {
      return (
          isValidNumber(record.subjective_right_spherical) ||
          isValidNumber(record.subjective_right_cylindrical) ||
          isValidNumber(record.subjective_left_spherical) ||
          isValidNumber(record.subjective_left_cylindrical)
      );
    });
  } else {
    validRecords = sortedRecords.filter(record => {
      return (
          isValidNumber(record.vacc_right_spherical) ||
          isValidNumber(record.vacc_right_cylindrical) ||
          isValidNumber(record.vacc_left_spherical) ||
          isValidNumber(record.vacc_left_cylindrical)
      );
    });
  }

  if (validRecords.length === 0) {
    noValidData.value = true;
    if (chart) chart.clear();
    return;
  }
  noValidData.value = false;

  const dates = validRecords.map(record => record.examination_date);
  let rightSpherical, rightCylindrical, leftSpherical, leftCylindrical;
  if (selectedChartType.value === 'subjective') {
    rightSpherical = validRecords.map(record => isValidNumber(record.subjective_right_spherical) ? Number(record.subjective_right_spherical) : null);
    rightCylindrical = validRecords.map(record => isValidNumber(record.subjective_right_cylindrical) ? Number(record.subjective_right_cylindrical) : null);
    leftSpherical = validRecords.map(record => isValidNumber(record.subjective_left_spherical) ? Number(record.subjective_left_spherical) : null);
    leftCylindrical = validRecords.map(record => isValidNumber(record.subjective_left_cylindrical) ? Number(record.subjective_left_cylindrical) : null);
  } else {
    rightSpherical = validRecords.map(record => isValidNumber(record.vacc_right_spherical) ? Number(record.vacc_right_spherical) : null);
    rightCylindrical = validRecords.map(record => isValidNumber(record.vacc_right_cylindrical) ? Number(record.vacc_right_cylindrical) : null);
    leftSpherical = validRecords.map(record => isValidNumber(record.vacc_left_spherical) ? Number(record.vacc_left_spherical) : null);
    leftCylindrical = validRecords.map(record => isValidNumber(record.vacc_left_cylindrical) ? Number(record.vacc_left_cylindrical) : null);
  }

  // 计算所有有效数据中的最大值和最小值
  const allValues = [
    ...rightSpherical.filter(v => v !== null),
    ...rightCylindrical.filter(v => v !== null),
    ...leftSpherical.filter(v => v !== null),
    ...leftCylindrical.filter(v => v !== null)
  ];

  if (allValues.length === 0) return;

  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);


  const option = {
    color: ['#ff4d4f', '#ff85c0', '#1890ff', '#69c0ff'],
    title: {
      text: '',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const date = params[0].axisValue;
        let result = `${date}<br/>`;
        params.forEach(param => {
          if (param.value !== null) {
            result += `${param.seriesName}: ${param.value.toFixed(2)}D<br/>`;
          }
        });
        return result;
      }
    },
    legend: {
      data: ['右眼球镜', '右眼柱镜', '左眼球镜', '左眼柱镜'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '屈光度(D)',
      nameLocation: 'end',
      min: minValue - 0.5,  // 留出一些空间
      max: 0.5,  // 从0开始向上
      inverse: true,  // 反转Y轴，使负值在上方
      axisLabel: {
        formatter: (value) => value.toFixed(2)
      }
    },
    series: [
      {
        name: '右眼球镜',
        type: 'bar',
        data: rightSpherical,
      },
      {
        name: '右眼柱镜',
        type: 'bar',
        data: rightCylindrical,
      },
      {
        name: '左眼球镜',
        type: 'bar',
        data: leftSpherical,
      },
      {
        name: '左眼柱镜',
        type: 'bar',
        data: leftCylindrical,
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

// 监听数据变化
watch(() => props.examinationRecords, async () => {
  await nextTick();
  updateChart();
}, { deep: true });

// 监听 noValidData 变化，切换为有数据时 nextTick 后再渲染
watch(noValidData, async (val) => {
  await nextTick();
  updateChart();
});

// 监听 selectedChartType 切换
watch(selectedChartType, async () => {
  await nextTick();
  updateChart();
});

// 监听 record/examination_date 变化，保证编辑模式下 examination_date 始终为 dayjs 对象
watch(
    () => form.value.examination_date,
    (val) => {
      if (isEditMode.value && val && typeof val === 'string') {
        form.value.examination_date = dayjs(val);
      }
    }
);

watch(
    () => props.record,
    (val) => {
      if (isEditMode.value && val && typeof val.examination_date === 'string') {
        form.value.examination_date = dayjs(val.examination_date);
      }
    },
    { immediate: true, deep: true }
);

// 组件挂载时初始化图表
onMounted(() => {
  setTimeout(() => {
    initChartInstance();
  }, 100);
  window.addEventListener('resize', handleResize);
});

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chart?.dispose();
});
</script>

<style scoped lang="scss">
.vision-exam {
  padding: 16px;
}
.exam-content {
  margin-top: 16px;
}
.vision-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  background: #fff;
}
.vision-table th, .vision-table td {
  padding: 4px 8px;
  font-size: 14px;
  border-inline-end: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}
.vision-table th.group-main {
  background: #fcf1ec !important;
}
.vision-table th.group-old {
  background: #fef9ee;
}
.vision-table .date-header {
  background: #e4e8f0;
  min-width: 90px;
  vertical-align: middle;
  border-start-start-radius: 8px
}
.header-right{
  border-start-end-radius: 8px;
  border-inline-end: none !important;
}
.vision-table .date-header .date-value {
  font-weight: bold;
  margin-top: 4px;
}
.vision-table .eye-label {
  background: #e4e8f0;
  font-weight: bold;
  min-width: 48px;
}

/* 添加图表相关样式 */
.chart-container {
  margin-top: 24px;
  padding: 16px;
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

.chart-options {
  width: 214px;
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

/* 统一编辑和只读模式下输入框与文本的高度、字体、行高 */
.vision-table .ant-input-number,
.vision-table .ant-picker {
  height: 28px;
  min-height: 28px;
  line-height: 1.2;
  font-size: 14px;
  padding: 0 4px;
  box-sizing: border-box;
}
.vision-table .ant-input-number-input {
  height: 28px;
  min-height: 28px;
  line-height: 1.2;
  font-size: 14px;
  padding: 0 4px;
}
.vision-table .ant-picker-input > input {
  height: 28px;
  min-height: 28px;
  line-height: 1.2;
  font-size: 14px;
  padding: 0 4px;
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

</style>
