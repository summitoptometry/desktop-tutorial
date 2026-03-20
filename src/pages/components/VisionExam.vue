<template>
  <div class="vision-exam">
   <Teleport defer to="#vision-btn-group">
     <div style="text-align: right; margin-bottom: 16px;display: flex;justify-content: right">
       <a-button class="header-btn" v-if="!isEditMode" type="primary" @click="startEdit">编辑</a-button>
       <a-button class="header-btn" v-if="isEditMode" type="primary" @click="handleSave" style="margin-right: 8px;">保存</a-button>
       <a-button class="header-btn" v-if="isEditMode" type="primary" @click="handleCancel" style="margin-right: 8px;">取消</a-button>
       <a-button class="header-btn sync-btn" v-if="isEditMode" @click="syncFromPrevious" style="margin-right: 8px;">同步上次检查</a-button>
     </div>
   </Teleport>
   <div class="exam-content">
     <div v-if="!record">暂无检查数据</div>
     <div v-else>
       <div class="table-wrapper">
         <table class="vision-table">
          <thead>
            <tr>
              <th rowspan="4" class="date-header">
                <div>检查日期</div>
                <div class="date-value">
                  <template v-if="!isEditMode">{{ formatDate(record.examination_date) }}</template>
                  <template v-else>
                    <a-date-picker v-model:value="form.examination_date" />
                  </template>
                </div>
              </th>
              <th colspan="5" class="group-main">主觉验光</th>
              <th colspan="4" class="group-main">电脑验光</th>
              <th colspan="5" class="group-old">旧镜参数</th>
              <th colspan="5" class="group-old header-right">配镜处方</th>
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
              <td class="eye-label">右眼</td>
              <td>
                <template v-if="!isEditMode">{{ record.subjective_right_spherical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.subjective_right_spherical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.subjective_right_cylindrical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.subjective_right_cylindrical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.subjective_right_axis ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.subjective_right_axis" :min="0" :max="180" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ formatVisionWithSign(record, 'subjective_right_old_vision') }}</template>
                <template v-else>
                  <div class="vision-input-cell">
                    <a-input-number v-model:value="form.subjective_right_old_vision" :step="0.1" :controls="false" style="width: 70px" />
                    <a-input-group compact class="vision-suffix-group-cell">
                      <a-select
                          v-model:value="form.subjective_right_old_vision_sign"
                          class="vision-sign-select-cell"
                          placeholder="±"
                          allowClear
                      >
                        <a-select-option value="+">+</a-select-option>
                        <a-select-option value="-">-</a-select-option>
                      </a-select>
                      <a-input-number
                          v-model:value="form.subjective_right_old_vision_level"
                          class="vision-level-input-cell"
                          :min="0"
                          :max="9"
                          :precision="0"
                          placeholder="个"
                          :controls="false"
                      />
                    </a-input-group>
                  </div>
                </template>
              </td>
              <td></td>
              <td>
                <template v-if="!isEditMode">{{ record.objective_right_spherical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.objective_right_spherical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.objective_right_cylindrical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.objective_right_cylindrical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.objective_right_axis ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.objective_right_axis" :min="0" :max="180" :controls="false" />
                </template>
              </td>
              <td></td>
              <td>
                <template v-if="!isEditMode">{{ record.vaec_right_spherical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vaec_right_spherical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.vaec_right_cylindrical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vaec_right_cylindrical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.vaec_right_axis ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vaec_right_axis" :min="0" :max="180" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ formatVisionWithSign(record, 'vaec_right_old_vision') }}</template>
                <template v-else>
                  <div class="vision-input-cell">
                    <a-input-number v-model:value="form.vaec_right_old_vision" :step="0.1" :controls="false" style="width: 70px" />
                    <a-input-group compact class="vision-suffix-group-cell">
                      <a-select
                          v-model:value="form.vaec_right_old_vision_sign"
                          class="vision-sign-select-cell"
                          placeholder="±"
                          allowClear
                      >
                        <a-select-option value="+">+</a-select-option>
                        <a-select-option value="-">-</a-select-option>
                      </a-select>
                      <a-input-number
                          v-model:value="form.vaec_right_old_vision_level"
                          class="vision-level-input-cell"
                          :min="0"
                          :max="9"
                          :precision="0"
                          placeholder="个"
                          :controls="false"
                      />
                    </a-input-group>
                  </div>
                </template>
              </td>
              <td></td>
              <td>
                <template v-if="!isEditMode">{{ record.vacc_right_spherical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vacc_right_spherical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.vacc_right_cylindrical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vacc_right_cylindrical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.vacc_right_axis ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vacc_right_axis" :min="0" :max="180" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ formatVisionWithSign(record, 'vacc_right_old_vision') }}</template>
                <template v-else>
                  <div class="vision-input-cell">
                    <a-input-number v-model:value="form.vacc_right_old_vision" :step="0.1" :controls="false" style="width: 70px" />
                    <a-input-group compact class="vision-suffix-group-cell">
                      <a-select
                          v-model:value="form.vacc_right_old_vision_sign"
                          class="vision-sign-select-cell"
                          placeholder="±"
                          allowClear
                      >
                        <a-select-option value="+">+</a-select-option>
                        <a-select-option value="-">-</a-select-option>
                      </a-select>
                      <a-input-number
                          v-model:value="form.vacc_right_old_vision_level"
                          class="vision-level-input-cell"
                          :min="0"
                          :max="9"
                          :precision="0"
                          placeholder="个"
                          :controls="false"
                      />
                    </a-input-group>
                  </div>
                </template>
              </td>
              <td></td>
            </tr>
            <tr>
              <td class="eye-label">左眼</td>
              <td>
                <template v-if="!isEditMode">{{ record.subjective_left_spherical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.subjective_left_spherical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.subjective_left_cylindrical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.subjective_left_cylindrical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.subjective_left_axis ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.subjective_left_axis" :min="0" :max="180" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ formatVisionWithSign(record, 'subjective_left_old_vision') }}</template>
                <template v-else>
                  <div class="vision-input-cell">
                    <a-input-number v-model:value="form.subjective_left_old_vision" :step="0.1" :controls="false" style="width: 70px" />
                    <a-input-group compact class="vision-suffix-group-cell">
                      <a-select
                          v-model:value="form.subjective_left_old_vision_sign"
                          class="vision-sign-select-cell"
                          placeholder="±"
                          allowClear
                      >
                        <a-select-option value="+">+</a-select-option>
                        <a-select-option value="-">-</a-select-option>
                      </a-select>
                      <a-input-number
                          v-model:value="form.subjective_left_old_vision_level"
                          class="vision-level-input-cell"
                          :min="0"
                          :max="9"
                          :precision="0"
                          placeholder="个"
                          :controls="false"
                      />
                    </a-input-group>
                  </div>
                </template>
              </td>
              <td></td>
              <td>
                <template v-if="!isEditMode">{{ record.objective_left_spherical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.objective_left_spherical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.objective_left_cylindrical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.objective_left_cylindrical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.objective_left_axis ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.objective_left_axis" :min="0" :max="180" :controls="false" />
                </template>
              </td>
              <td></td>
              <td>
                <template v-if="!isEditMode">{{ record.vaec_left_spherical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vaec_left_spherical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.vaec_left_cylindrical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vaec_left_cylindrical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.vaec_left_axis ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vaec_left_axis" :min="0" :max="180" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ formatVisionWithSign(record, 'vaec_left_old_vision') }}</template>
                <template v-else>
                  <div class="vision-input-cell">
                    <a-input-number v-model:value="form.vaec_left_old_vision" :step="0.1" :controls="false" style="width: 70px" />
                    <a-input-group compact class="vision-suffix-group-cell">
                      <a-select
                          v-model:value="form.vaec_left_old_vision_sign"
                          class="vision-sign-select-cell"
                          placeholder="±"
                          allowClear
                      >
                        <a-select-option value="+">+</a-select-option>
                        <a-select-option value="-">-</a-select-option>
                      </a-select>
                      <a-input-number
                          v-model:value="form.vaec_left_old_vision_level"
                          class="vision-level-input-cell"
                          :min="0"
                          :max="9"
                          :precision="0"
                          placeholder="个"
                          :controls="false"
                      />
                    </a-input-group>
                  </div>
                </template>
              </td>
              <td></td>
              <td>
                <template v-if="!isEditMode">{{ record.vacc_left_spherical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vacc_left_spherical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.vacc_left_cylindrical ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vacc_left_cylindrical" :step="0.25" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.vacc_left_axis ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vacc_left_axis" :min="0" :max="180" :controls="false" />
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ formatVisionWithSign(record, 'vacc_left_old_vision') }}</template>
                <template v-else>
                  <div class="vision-input-cell">
                    <a-input-number v-model:value="form.vacc_left_old_vision" :step="0.1" :controls="false" style="width: 70px" />
                    <a-input-group compact class="vision-suffix-group-cell">
                      <a-select
                          v-model:value="form.vacc_left_old_vision_sign"
                          class="vision-sign-select-cell"
                          placeholder="±"
                          allowClear
                      >
                        <a-select-option value="+">+</a-select-option>
                        <a-select-option value="-">-</a-select-option>
                      </a-select>
                      <a-input-number
                          v-model:value="form.vacc_left_old_vision_level"
                          class="vision-level-input-cell"
                          :min="0"
                          :max="9"
                          :precision="0"
                          placeholder="个"
                          :controls="false"
                      />
                    </a-input-group>
                  </div>
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
                <template v-if="!isEditMode">{{ formatVisionWithSign(record, 'subjective_both_old_vision') }}</template>
                <template v-else>
                  <div class="vision-input-cell">
                    <a-input-number v-model:value="form.subjective_both_old_vision" :step="0.1" :controls="false" style="width: 70px" />
                    <a-input-group compact class="vision-suffix-group-cell">
                      <a-select
                          v-model:value="form.subjective_both_old_vision_sign"
                          class="vision-sign-select-cell"
                          placeholder="±"
                          allowClear
                      >
                        <a-select-option value="+">+</a-select-option>
                        <a-select-option value="-">-</a-select-option>
                      </a-select>
                      <a-input-number
                          v-model:value="form.subjective_both_old_vision_level"
                          class="vision-level-input-cell"
                          :min="0"
                          :max="9"
                          :precision="0"
                          placeholder="个"
                          :controls="false"
                      />
                    </a-input-group>
                  </div>
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.subjective_both_pupil_distance ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.subjective_both_pupil_distance" :step="0.5" :controls="false" />
                </template>
              </td>
              <td></td>
              <td></td>
              <td></td>
              <td>
                <template v-if="!isEditMode">{{ record.objective_pupil_distance ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.objective_pupil_distance" :step="0.5" :controls="false" />
                </template>
              </td>
              <td></td>
              <td></td>
              <td></td>
              <td>
                <template v-if="!isEditMode">{{ formatVisionWithSign(record, 'vaec_both_old_vision') }}</template>
                <template v-else>
                  <div class="vision-input-cell">
                    <a-input-number v-model:value="form.vaec_both_old_vision" :step="0.1" :controls="false" style="width: 70px" />
                    <a-input-group compact class="vision-suffix-group-cell">
                      <a-select
                          v-model:value="form.vaec_both_old_vision_sign"
                          class="vision-sign-select-cell"
                          placeholder="±"
                          allowClear
                      >
                        <a-select-option value="+">+</a-select-option>
                        <a-select-option value="-">-</a-select-option>
                      </a-select>
                      <a-input-number
                          v-model:value="form.vaec_both_old_vision_level"
                          class="vision-level-input-cell"
                          :min="0"
                          :max="9"
                          :precision="0"
                          placeholder="个"
                          :controls="false"
                      />
                    </a-input-group>
                  </div>
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.vaec_both_pupil_distance ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vaec_both_pupil_distance" :step="0.5" :controls="false" />
                </template>
              </td>
              <td></td>
              <td></td>
              <td></td>
              <td>
                <template v-if="!isEditMode">{{ formatVisionWithSign(record, 'vacc_both_old_vision') }}</template>
                <template v-else>
                  <div class="vision-input-cell">
                    <a-input-number v-model:value="form.vacc_both_old_vision" :step="0.1" :controls="false" style="width: 70px" />
                    <a-input-group compact class="vision-suffix-group-cell">
                      <a-select
                          v-model:value="form.vacc_both_old_vision_sign"
                          class="vision-sign-select-cell"
                          placeholder="±"
                          allowClear
                      >
                        <a-select-option value="+">+</a-select-option>
                        <a-select-option value="-">-</a-select-option>
                      </a-select>
                      <a-input-number
                          v-model:value="form.vacc_both_old_vision_level"
                          class="vision-level-input-cell"
                          :min="0"
                          :max="9"
                          :precision="0"
                          placeholder="个"
                          :controls="false"
                      />
                    </a-input-group>
                  </div>
                </template>
              </td>
              <td>
                <template v-if="!isEditMode">{{ record.vacc_both_pupil_distance ?? '' }}</template>
                <template v-else>
                  <a-input-number v-model:value="form.vacc_both_pupil_distance" :step="0.5" :controls="false" />
                </template>
              </td>
            </tr>
          </tbody>
        </table>
       </div>

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
          
          <div class="chart-type-options">
            <div :class="['chart-type-item', { active: selectedChartStyle === style.key }]" v-for="style in chartStyleOptions" :key="style.key" @click="selectedChartStyle = style.key">
              {{style.title}}
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
import { message, Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { createVNode } from 'vue';
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
const selectedChartStyle = ref('bar');
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

// 检查是否使用正柱镜
function checkPositiveCylindrical(callback) {
  const cylindricalFields = [
    { value: form.value.subjective_right_cylindrical, name: '主觉验光-右眼柱镜', key: 'subjective_right_cylindrical' },
    { value: form.value.subjective_left_cylindrical, name: '主觉验光-左眼柱镜', key: 'subjective_left_cylindrical' },
    { value: form.value.objective_right_cylindrical, name: '电脑验光-右眼柱镜', key: 'objective_right_cylindrical' },
    { value: form.value.objective_left_cylindrical, name: '电脑验光-左眼柱镜', key: 'objective_left_cylindrical' },
    { value: form.value.vaec_right_cylindrical, name: '旧镜参数-右眼柱镜', key: 'vaec_right_cylindrical' },
    { value: form.value.vaec_left_cylindrical, name: '旧镜参数-左眼柱镜', key: 'vaec_left_cylindrical' },
    { value: form.value.vacc_right_cylindrical, name: '配镜处方-右眼柱镜', key: 'vacc_right_cylindrical' },
    { value: form.value.vacc_left_cylindrical, name: '配镜处方-左眼柱镜', key: 'vacc_left_cylindrical' }
  ];

  const positiveFields = cylindricalFields.filter(field => {
    const val = field.value;
    return val !== null && val !== undefined && val !== '' && Number(val) > 0;
  });

  if (positiveFields.length > 0) {
    const fieldNames = positiveFields.map(f => f.name).join('、');

    // 复选框：是否自动转换为负柱镜
    const autoConvert = { value: false };

    const contentVNode = createVNode('div', null, [
      createVNode('div', { style: 'margin-bottom: 12px;' }, `检测到您使用了正柱镜（${fieldNames}）。临床上通常使用负柱镜表示。`),
      createVNode('label', { style: 'display: flex; align-items: center; gap: 8px; user-select: none;' }, [
        createVNode('input', {
          type: 'checkbox',
          onChange: (e) => { autoConvert.value = e.target.checked; }
        }),
        '自动将正柱镜转换为负柱镜后保存'
      ])
    ]);

    Modal.confirm({
      title: '柱镜符号提示',
      icon: createVNode(ExclamationCircleOutlined),
      content: contentVNode,
      okText: '保存',
      cancelText: '取消',
      onOk() {
        if (autoConvert.value) {
          positiveFields.forEach(posField => {
            const key = posField.key;
            if (key && form.value[key] > 0) {
              form.value[key] = -Math.abs(form.value[key]);
            }
          });
        }
        callback();
      },
      onCancel() {
        message.info('已取消保存');
      }
    });
  } else {
    callback();
  }
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

  // 先检查正柱镜
  checkPositiveCylindrical(() => {
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
    subjective_right_old_vision_sign: (form.value.subjective_right_old_vision != null && form.value.subjective_right_old_vision !== '') ? (form.value.subjective_right_old_vision_sign || '+') : null,
    subjective_right_old_vision_level: form.value.subjective_right_old_vision_level !== null && form.value.subjective_right_old_vision_level !== undefined ? parseInt(form.value.subjective_right_old_vision_level) : null,
    subjective_left_spherical: form.value.subjective_left_spherical !== null && form.value.subjective_left_spherical !== undefined && form.value.subjective_left_spherical !== '' ? form.value.subjective_left_spherical : null,
    subjective_left_cylindrical: form.value.subjective_left_cylindrical !== null && form.value.subjective_left_cylindrical !== undefined && form.value.subjective_left_cylindrical !== '' ? form.value.subjective_left_cylindrical : null,
    subjective_left_axis: form.value.subjective_left_axis !== null && form.value.subjective_left_axis !== undefined && form.value.subjective_left_axis !== '' ? form.value.subjective_left_axis : null,
    subjective_left_old_vision: form.value.subjective_left_old_vision !== null && form.value.subjective_left_old_vision !== undefined && form.value.subjective_left_old_vision !== '' ? form.value.subjective_left_old_vision : null,
    subjective_left_old_vision_sign: (form.value.subjective_left_old_vision != null && form.value.subjective_left_old_vision !== '') ? (form.value.subjective_left_old_vision_sign || '+') : null,
    subjective_left_old_vision_level: form.value.subjective_left_old_vision_level !== null && form.value.subjective_left_old_vision_level !== undefined ? parseInt(form.value.subjective_left_old_vision_level) : null,
    subjective_both_old_vision: form.value.subjective_both_old_vision !== null && form.value.subjective_both_old_vision !== undefined && form.value.subjective_both_old_vision !== '' ? form.value.subjective_both_old_vision : null,
    subjective_both_old_vision_sign: (form.value.subjective_both_old_vision != null && form.value.subjective_both_old_vision !== '') ? (form.value.subjective_both_old_vision_sign || '+') : null,
    subjective_both_old_vision_level: form.value.subjective_both_old_vision_level !== null && form.value.subjective_both_old_vision_level !== undefined ? parseInt(form.value.subjective_both_old_vision_level) : null,
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
    vaec_right_old_vision_sign: (form.value.vaec_right_old_vision != null && form.value.vaec_right_old_vision !== '') ? (form.value.vaec_right_old_vision_sign || '+') : null,
    vaec_right_old_vision_level: form.value.vaec_right_old_vision_level !== null && form.value.vaec_right_old_vision_level !== undefined ? parseInt(form.value.vaec_right_old_vision_level) : null,
    vaec_left_spherical: form.value.vaec_left_spherical !== null && form.value.vaec_left_spherical !== undefined && form.value.vaec_left_spherical !== '' ? form.value.vaec_left_spherical : null,
    vaec_left_cylindrical: form.value.vaec_left_cylindrical !== null && form.value.vaec_left_cylindrical !== undefined && form.value.vaec_left_cylindrical !== '' ? form.value.vaec_left_cylindrical : null,
    vaec_left_axis: form.value.vaec_left_axis !== null && form.value.vaec_left_axis !== undefined && form.value.vaec_left_axis !== '' ? form.value.vaec_left_axis : null,
    vaec_left_old_vision: form.value.vaec_left_old_vision !== null && form.value.vaec_left_old_vision !== undefined && form.value.vaec_left_old_vision !== '' ? form.value.vaec_left_old_vision : null,
    vaec_left_old_vision_sign: (form.value.vaec_left_old_vision != null && form.value.vaec_left_old_vision !== '') ? (form.value.vaec_left_old_vision_sign || '+') : null,
    vaec_left_old_vision_level: form.value.vaec_left_old_vision_level !== null && form.value.vaec_left_old_vision_level !== undefined ? parseInt(form.value.vaec_left_old_vision_level) : null,
    vaec_both_old_vision: form.value.vaec_both_old_vision !== null && form.value.vaec_both_old_vision !== undefined && form.value.vaec_both_old_vision !== '' ? form.value.vaec_both_old_vision : null,
    vaec_both_old_vision_sign: (form.value.vaec_both_old_vision != null && form.value.vaec_both_old_vision !== '') ? (form.value.vaec_both_old_vision_sign || '+') : null,
    vaec_both_old_vision_level: form.value.vaec_both_old_vision_level !== null && form.value.vaec_both_old_vision_level !== undefined ? parseInt(form.value.vaec_both_old_vision_level) : null,
    vaec_both_pupil_distance: form.value.vaec_both_pupil_distance !== null && form.value.vaec_both_pupil_distance !== undefined && form.value.vaec_both_pupil_distance !== '' ? form.value.vaec_both_pupil_distance : null,
    // 配镜处方
    vacc_right_spherical: form.value.vacc_right_spherical !== null && form.value.vacc_right_spherical !== undefined && form.value.vacc_right_spherical !== '' ? form.value.vacc_right_spherical : null,
    vacc_right_cylindrical: form.value.vacc_right_cylindrical !== null && form.value.vacc_right_cylindrical !== undefined && form.value.vacc_right_cylindrical !== '' ? form.value.vacc_right_cylindrical : null,
    vacc_right_axis: form.value.vacc_right_axis !== null && form.value.vacc_right_axis !== undefined && form.value.vacc_right_axis !== '' ? form.value.vacc_right_axis : null,
    vacc_right_old_vision: form.value.vacc_right_old_vision !== null && form.value.vacc_right_old_vision !== undefined && form.value.vacc_right_old_vision !== '' ? form.value.vacc_right_old_vision : null,
    vacc_right_old_vision_sign: (form.value.vacc_right_old_vision != null && form.value.vacc_right_old_vision !== '') ? (form.value.vacc_right_old_vision_sign || '+') : null,
    vacc_right_old_vision_level: form.value.vacc_right_old_vision_level !== null && form.value.vacc_right_old_vision_level !== undefined ? parseInt(form.value.vacc_right_old_vision_level) : null,
    vacc_left_spherical: form.value.vacc_left_spherical !== null && form.value.vacc_left_spherical !== undefined && form.value.vacc_left_spherical !== '' ? form.value.vacc_left_spherical : null,
    vacc_left_cylindrical: form.value.vacc_left_cylindrical !== null && form.value.vacc_left_cylindrical !== undefined && form.value.vacc_left_cylindrical !== '' ? form.value.vacc_left_cylindrical : null,
    vacc_left_axis: form.value.vacc_left_axis !== null && form.value.vacc_left_axis !== undefined && form.value.vacc_left_axis !== '' ? form.value.vacc_left_axis : null,
    vacc_left_old_vision: form.value.vacc_left_old_vision !== null && form.value.vacc_left_old_vision !== undefined && form.value.vacc_left_old_vision !== '' ? form.value.vacc_left_old_vision : null,
    vacc_left_old_vision_sign: (form.value.vacc_left_old_vision != null && form.value.vacc_left_old_vision !== '') ? (form.value.vacc_left_old_vision_sign || '+') : null,
    vacc_left_old_vision_level: form.value.vacc_left_old_vision_level !== null && form.value.vacc_left_old_vision_level !== undefined ? parseInt(form.value.vacc_left_old_vision_level) : null,
    vacc_both_old_vision: form.value.vacc_both_old_vision !== null && form.value.vacc_both_old_vision !== undefined && form.value.vacc_both_old_vision !== '' ? form.value.vacc_both_old_vision : null,
    vacc_both_old_vision_sign: (form.value.vacc_both_old_vision != null && form.value.vacc_both_old_vision !== '') ? (form.value.vacc_both_old_vision_sign || '+') : null,
    vacc_both_old_vision_level: form.value.vacc_both_old_vision_level !== null && form.value.vacc_both_old_vision_level !== undefined ? parseInt(form.value.vacc_both_old_vision_level) : null,
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

// 格式化视力显示：将视力值、符号、级别组合显示
function formatVisionWithSign(record, fieldPrefix) {
  const vision = record[fieldPrefix] ?? null;
  const sign = record[`${fieldPrefix}_sign`] ?? null;
  const level = record[`${fieldPrefix}_level`] ?? null;
  
  if (vision === null || vision === undefined || vision === '') return '';
  
  let result = String(vision);
  if (sign && level !== null && level !== undefined && level !== '') {
    result += sign + level;
  } else if (sign) {
    result += sign;
  } else if (level !== null && level !== undefined && level !== '') {
    result += level;
  }
  
  return result;
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
  let rightSpherical, rightCylindrical, leftSpherical, leftCylindrical, rightEquivalent, leftEquivalent;
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
  
  // 计算等效光度 (球镜 + 1/2柱镜)
  rightEquivalent = rightSpherical.map((spherical, index) => {
    const cylindrical = rightCylindrical[index];
    if (spherical !== null && cylindrical !== null) {
      return spherical + (cylindrical / 2);
    }
    return null;
  });
  
  leftEquivalent = leftSpherical.map((spherical, index) => {
    const cylindrical = leftCylindrical[index];
    if (spherical !== null && cylindrical !== null) {
      return spherical + (cylindrical / 2);
    }
    return null;
  });

  // 调试信息
  console.log('右眼等效光度数据:', rightEquivalent);
  console.log('左眼等效光度数据:', leftEquivalent);
  console.log('右眼球镜数据:', rightSpherical);
  console.log('右眼柱镜数据:', rightCylindrical);
  console.log('左眼球镜数据:', leftSpherical);
  console.log('左眼柱镜数据:', leftCylindrical);

  // 计算所有有效数据中的最大值和最小值
  const allValues = [
    ...rightSpherical.filter(v => v !== null),
    ...rightCylindrical.filter(v => v !== null),
    ...leftSpherical.filter(v => v !== null),
    ...leftCylindrical.filter(v => v !== null),
    ...rightEquivalent.filter(v => v !== null),
    ...leftEquivalent.filter(v => v !== null)
  ];

  if (allValues.length === 0) return;

  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);


  const option = {
    color: ['#ff4d4f', '#ff7875', '#ff9c6e', '#1890ff', '#40a9ff', '#69c0ff'],
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
          if (param.value !== null && param.value !== undefined && !isNaN(param.value)) {
            result += `${param.seriesName}: ${param.value.toFixed(2)}D<br/>`;
          }
        });
        return result;
      }
    },
    legend: {
      data: ['右眼球镜', '右眼柱镜', '右眼等效光度', '左眼球镜', '左眼柱镜', '左眼等效光度'],
      top: 30,
      selected: selectedChartStyle.value === 'line' ? {
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
      }
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
      max: maxValue + 0.5,  // 根据实际数据最大值动态调整
      inverse: true,  // 反转Y轴，使负值在上方
      axisLabel: {
        formatter: (value) => value.toFixed(2)
      }
    },
    series: [
      {
        name: '右眼球镜',
        type: selectedChartStyle.value,
        data: rightSpherical,
        itemStyle: {
          color: '#ff4d4f'
        },
        lineStyle: {
          color: '#ff4d4f'
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params) => {
            return params.value !== null && params.value !== undefined && !isNaN(params.value) ? params.value.toFixed(2) + 'D' : '';
          },
          fontSize: 12,
          color: '#666'
        }
      },
      {
        name: '右眼柱镜',
        type: selectedChartStyle.value,
        data: rightCylindrical,
        itemStyle: {
          color: '#ff7875'
        },
        lineStyle: {
          color: '#ff7875'
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params) => {
            return params.value !== null && params.value !== undefined && !isNaN(params.value) ? params.value.toFixed(2) + 'D' : '';
          },
          fontSize: 12,
          color: '#666'
        }
      },
      {
        name: '右眼等效光度',
        type: selectedChartStyle.value,
        data: rightEquivalent,
        itemStyle: {
          color: '#ff9c6e'
        },
        lineStyle: {
          color: '#ff9c6e'
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params) => {
            return params.value !== null && params.value !== undefined && !isNaN(params.value) ? params.value.toFixed(2) + 'D' : '';
          },
          fontSize: 12,
          color: '#666'
        }
      },
      {
        name: '左眼球镜',
        type: selectedChartStyle.value,
        data: leftSpherical,
        itemStyle: {
          color: '#1890ff'
        },
        lineStyle: {
          color: '#1890ff'
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params) => {
            return params.value !== null && params.value !== undefined && !isNaN(params.value) ? params.value.toFixed(2) + 'D' : '';
          },
          fontSize: 12,
          color: '#666'
        }
      },
      {
        name: '左眼柱镜',
        type: selectedChartStyle.value,
        data: leftCylindrical,
        itemStyle: {
          color: '#40a9ff'
        },
        lineStyle: {
          color: '#40a9ff'
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params) => {
            return params.value !== null && params.value !== undefined && !isNaN(params.value) ? params.value.toFixed(2) + 'D' : '';
          },
          fontSize: 12,
          color: '#666'
        }
      },
      {
        name: '左眼等效光度',
        type: selectedChartStyle.value,
        data: leftEquivalent,
        itemStyle: {
          color: '#69c0ff'
        },
        lineStyle: {
          color: '#69c0ff'
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params) => {
            return params.value !== null && params.value !== undefined && !isNaN(params.value) ? params.value.toFixed(2) + 'D' : '';
          },
          fontSize: 12,
          color: '#666'
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

// 监听 selectedChartStyle 切换
watch(selectedChartStyle, async () => {
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

// 同步上次视力检查
async function syncFromPrevious() {
  try {
    const patientId = props.record.patient_id || props.record.patient_id_id;
    const currentRecordId = props.record.id;
    const currentDate = props.record.examination_date;
    
    // 从sessionStorage获取历史记录
    let historyRecords = [];
    const storageKey = `patient_${patientId}`;
    const savedData = sessionStorage.getItem(storageKey);
    
    if (savedData) {
      const parsed = JSON.parse(savedData);
      historyRecords = parsed.allData || parsed.examinationRecords || [];
    }
    
    // 如果sessionStorage没有数据，尝试从API获取
    if (!historyRecords || historyRecords.length === 0) {
      const response = await fetch(`https://aiforoptometry.com/medicalrecords/records?patient_id=${patientId}`);
      const data = await response.json();
      if (data.status_code === 200 && data.data) {
        historyRecords = data.data;
      }
    }
    
    // 当前日期
    const currentDateObj = new Date(currentDate);
    
    // 检查记录是否有视力检查数据的辅助函数
    const hasVisionData = (record) => {
      return record.subjective_right_spherical || record.subjective_right_cylindrical ||
             record.subjective_left_spherical || record.subjective_left_cylindrical ||
             record.objective_right_spherical || record.objective_right_cylindrical ||
             record.objective_left_spherical || record.objective_left_cylindrical ||
             record.vaec_right_spherical || record.vaec_right_cylindrical ||
             record.vaec_left_spherical || record.vaec_left_cylindrical ||
             record.vacc_right_spherical || record.vacc_right_cylindrical ||
             record.vacc_left_spherical || record.vacc_left_cylindrical;
    };
    
    // 过滤掉当前记录
    const validRecords = historyRecords.filter(
      record => record.id !== currentRecordId && record.examination_date
    );
    
    let previousRecord = null;
    
    // 步骤1: 优先找早于当前日期的最近一次有视力检查的检查
    const earlierRecords = validRecords
      .filter(record => new Date(record.examination_date) < currentDateObj)
      .sort((a, b) => new Date(b.examination_date) - new Date(a.examination_date)); // 从新到旧
    
    for (const record of earlierRecords) {
      if (hasVisionData(record)) {
        previousRecord = record;
        break;
      }
    }
    
    // 步骤2: 如果没有找到早于当前日期的，则找最早日期的有视力检查
    if (!previousRecord) {
      const allRecordsAsc = validRecords
        .sort((a, b) => new Date(a.examination_date) - new Date(b.examination_date)); // 从旧到新
      
      for (const record of allRecordsAsc) {
        if (hasVisionData(record)) {
          previousRecord = record;
          break;
        }
      }
    }
    
    if (!previousRecord) {
      message.warning('未找到可同步的历史视力检查数据');
      return;
    }
    
    // 弹窗确认
    const examDate = formatDate(previousRecord.examination_date);
    Modal.confirm({
      title: '确认同步视力检查',
      icon: createVNode(ExclamationCircleOutlined),
      content: `是否同步 ${examDate} 的视力检查数据？`,
      okText: '确认',
      cancelText: '取消',
      onOk() {
        return new Promise((resolve) => {
          nextTick(() => {
            // 同步主觉验光数据
            form.value.subjective_right_spherical = previousRecord.subjective_right_spherical || form.value.subjective_right_spherical;
            form.value.subjective_right_cylindrical = previousRecord.subjective_right_cylindrical || form.value.subjective_right_cylindrical;
            form.value.subjective_right_axis = previousRecord.subjective_right_axis || form.value.subjective_right_axis;
            form.value.subjective_right_old_vision = previousRecord.subjective_right_old_vision || form.value.subjective_right_old_vision;
            form.value.subjective_right_old_vision_sign = previousRecord.subjective_right_old_vision_sign || form.value.subjective_right_old_vision_sign;
            form.value.subjective_right_old_vision_level = previousRecord.subjective_right_old_vision_level || form.value.subjective_right_old_vision_level;
            form.value.subjective_left_spherical = previousRecord.subjective_left_spherical || form.value.subjective_left_spherical;
            form.value.subjective_left_cylindrical = previousRecord.subjective_left_cylindrical || form.value.subjective_left_cylindrical;
            form.value.subjective_left_axis = previousRecord.subjective_left_axis || form.value.subjective_left_axis;
            form.value.subjective_left_old_vision = previousRecord.subjective_left_old_vision || form.value.subjective_left_old_vision;
            form.value.subjective_left_old_vision_sign = previousRecord.subjective_left_old_vision_sign || form.value.subjective_left_old_vision_sign;
            form.value.subjective_left_old_vision_level = previousRecord.subjective_left_old_vision_level || form.value.subjective_left_old_vision_level;
            form.value.subjective_both_old_vision = previousRecord.subjective_both_old_vision || form.value.subjective_both_old_vision;
            form.value.subjective_both_old_vision_sign = previousRecord.subjective_both_old_vision_sign || form.value.subjective_both_old_vision_sign;
            form.value.subjective_both_old_vision_level = previousRecord.subjective_both_old_vision_level || form.value.subjective_both_old_vision_level;
            form.value.subjective_both_pupil_distance = previousRecord.subjective_both_pupil_distance || form.value.subjective_both_pupil_distance;
            
            // 同步电脑验光数据
            form.value.objective_right_spherical = previousRecord.objective_right_spherical || form.value.objective_right_spherical;
            form.value.objective_right_cylindrical = previousRecord.objective_right_cylindrical || form.value.objective_right_cylindrical;
            form.value.objective_right_axis = previousRecord.objective_right_axis || form.value.objective_right_axis;
            form.value.objective_left_spherical = previousRecord.objective_left_spherical || form.value.objective_left_spherical;
            form.value.objective_left_cylindrical = previousRecord.objective_left_cylindrical || form.value.objective_left_cylindrical;
            form.value.objective_left_axis = previousRecord.objective_left_axis || form.value.objective_left_axis;
            form.value.objective_pupil_distance = previousRecord.objective_pupil_distance || form.value.objective_pupil_distance;
            
            // 同步旧镜参数数据
            form.value.vaec_right_spherical = previousRecord.vaec_right_spherical || form.value.vaec_right_spherical;
            form.value.vaec_right_cylindrical = previousRecord.vaec_right_cylindrical || form.value.vaec_right_cylindrical;
            form.value.vaec_right_axis = previousRecord.vaec_right_axis || form.value.vaec_right_axis;
            form.value.vaec_right_old_vision = previousRecord.vaec_right_old_vision || form.value.vaec_right_old_vision;
            form.value.vaec_right_old_vision_sign = previousRecord.vaec_right_old_vision_sign || form.value.vaec_right_old_vision_sign;
            form.value.vaec_right_old_vision_level = previousRecord.vaec_right_old_vision_level || form.value.vaec_right_old_vision_level;
            form.value.vaec_left_spherical = previousRecord.vaec_left_spherical || form.value.vaec_left_spherical;
            form.value.vaec_left_cylindrical = previousRecord.vaec_left_cylindrical || form.value.vaec_left_cylindrical;
            form.value.vaec_left_axis = previousRecord.vaec_left_axis || form.value.vaec_left_axis;
            form.value.vaec_left_old_vision = previousRecord.vaec_left_old_vision || form.value.vaec_left_old_vision;
            form.value.vaec_left_old_vision_sign = previousRecord.vaec_left_old_vision_sign || form.value.vaec_left_old_vision_sign;
            form.value.vaec_left_old_vision_level = previousRecord.vaec_left_old_vision_level || form.value.vaec_left_old_vision_level;
            form.value.vaec_both_old_vision = previousRecord.vaec_both_old_vision || form.value.vaec_both_old_vision;
            form.value.vaec_both_old_vision_sign = previousRecord.vaec_both_old_vision_sign || form.value.vaec_both_old_vision_sign;
            form.value.vaec_both_old_vision_level = previousRecord.vaec_both_old_vision_level || form.value.vaec_both_old_vision_level;
            form.value.vaec_both_pupil_distance = previousRecord.vaec_both_pupil_distance || form.value.vaec_both_pupil_distance;
            
            // 同步配镜处方数据
            form.value.vacc_right_spherical = previousRecord.vacc_right_spherical || form.value.vacc_right_spherical;
            form.value.vacc_right_cylindrical = previousRecord.vacc_right_cylindrical || form.value.vacc_right_cylindrical;
            form.value.vacc_right_axis = previousRecord.vacc_right_axis || form.value.vacc_right_axis;
            form.value.vacc_right_old_vision = previousRecord.vacc_right_old_vision || form.value.vacc_right_old_vision;
            form.value.vacc_right_old_vision_sign = previousRecord.vacc_right_old_vision_sign || form.value.vacc_right_old_vision_sign;
            form.value.vacc_right_old_vision_level = previousRecord.vacc_right_old_vision_level || form.value.vacc_right_old_vision_level;
            form.value.vacc_left_spherical = previousRecord.vacc_left_spherical || form.value.vacc_left_spherical;
            form.value.vacc_left_cylindrical = previousRecord.vacc_left_cylindrical || form.value.vacc_left_cylindrical;
            form.value.vacc_left_axis = previousRecord.vacc_left_axis || form.value.vacc_left_axis;
            form.value.vacc_left_old_vision = previousRecord.vacc_left_old_vision || form.value.vacc_left_old_vision;
            form.value.vacc_left_old_vision_sign = previousRecord.vacc_left_old_vision_sign || form.value.vacc_left_old_vision_sign;
            form.value.vacc_left_old_vision_level = previousRecord.vacc_left_old_vision_level || form.value.vacc_left_old_vision_level;
            form.value.vacc_both_old_vision = previousRecord.vacc_both_old_vision || form.value.vacc_both_old_vision;
            form.value.vacc_both_old_vision_sign = previousRecord.vacc_both_old_vision_sign || form.value.vacc_both_old_vision_sign;
            form.value.vacc_both_old_vision_level = previousRecord.vacc_both_old_vision_level || form.value.vacc_both_old_vision_level;
            form.value.vacc_both_pupil_distance = previousRecord.vacc_both_pupil_distance || form.value.vacc_both_pupil_distance;
            
            message.success(`已同步 ${examDate} 的视力检查数据`);
            resolve();
          });
        });
      }
    });
    
  } catch (error) {
    console.error('同步视力检查失败:', error);
    message.error('同步视力检查失败: ' + error.message);
  }
}

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
.table-wrapper {
  overflow-x: auto;
}
.vision-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  background: #fff;
  table-layout: auto;
  margin-bottom: 24px;
}
.vision-table th, .vision-table td {
  padding: 4px 8px;
  font-size: 14px;
  border-inline-end: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
  line-height: 1.5;
  height: 32px;
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

.chart-type-options {
  width: 160px;
  height: 32px;
  border-radius: 16px;
  border: 1px solid #1890ff;
  display: flex;
  margin: 0 auto 16px;

  .chart-type-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 400;
    font-size: 14px;
    color: #1890ff;
    line-height: 32px;
    position: relative;
    cursor: pointer;
  }

  .chart-type-item.active {
    color: #ffffff;
    font-weight: 500;
    background: #1890ff;
  }

  .chart-type-item:first-child {
    border-radius: 16px 0 0 16px;
  }

  .chart-type-item:last-child {
    border-radius: 0 16px 16px 0;
  }
}

/* 统一编辑和只读模式下输入框与文本的样式 - 让输入框看起来像纯文本 */
.vision-table .ant-input-number {
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
  text-align: center;
  width: 100% !important;
  min-width: 60px;
}

.vision-table .ant-input-number:hover,
.vision-table .ant-input-number:focus,
.vision-table .ant-input-number-focused {
  border: 1px solid #d9d9d9;
  background: #fff;
  box-shadow: none;
}

.vision-table .ant-input-number-handler-wrap {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
}

.vision-table .ant-input-number-handler {
  display: none !important;
}

.vision-table .ant-input-number-handler-up,
.vision-table .ant-input-number-handler-down {
  display: none !important;
}

.vision-table .ant-input-number-input {
  height: auto;
  line-height: 1.5;
  font-size: 14px;
  padding: 4px 0;
  text-align: center;
}

.vision-table .ant-picker {
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
  width: 100% !important;
}

.vision-table .ant-picker:hover,
.vision-table .ant-picker-focused {
  border: 1px solid #d9d9d9;
  background: #fff;
  box-shadow: none;
}

.vision-table .ant-picker-input > input {
  font-size: 14px;
  text-align: center;
  padding: 4px 0;
}

.vision-table .ant-picker-suffix {
  opacity: 0;
  transition: opacity 0.2s;
}

.vision-table .ant-picker:hover .ant-picker-suffix,
.vision-table .ant-picker-focused .ant-picker-suffix {
  opacity: 1;
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

.sync-btn {
  background: linear-gradient(-90deg, #4A90E2 0%, #5BA3F5 100%);
  width: 150px;
}

.sync-btn:hover {
  background: linear-gradient(-90deg, #3A7BC8 0%, #4B93E5 100%);
}

/* 视力输入单元格样式 */
.vision-input-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.vision-suffix-group-cell {
  display: flex;
  align-items: center;
}

.vision-sign-select-cell {
  width: 60px !important;
  min-width: 60px;
  flex-shrink: 0;
}

.vision-sign-select-cell :deep(.ant-select-selector) {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  border-right: none !important;
  padding: 0 8px !important;
  height: 32px !important;
  display: flex;
  align-items: center;
}

.vision-sign-select-cell :deep(.ant-select-selection-item) {
  line-height: 32px !important;
  text-align: center;
  padding: 0 !important;
  font-size: 16px !important;
  font-weight: bold !important;
}

.vision-level-input-cell {
  width: 55px !important;
  min-width: 55px;
  flex-shrink: 0;
}

.vision-level-input-cell :deep(.ant-input-number-input) {
  height: 32px !important;
  text-align: center;
  padding: 0 8px !important;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}

.vision-level-input-cell :deep(.ant-input-number) {
  height: 32px !important;
}

.vision-suffix-group-cell :deep(.ant-input-group) {
  display: flex;
  border-radius: 8px;
  border: 1px solid #E27244;
  overflow: hidden;
}

.vision-suffix-group-cell :deep(.ant-select) {
  border: none;
}

.vision-suffix-group-cell :deep(.ant-input-number) {
  border: none;
}

</style>
