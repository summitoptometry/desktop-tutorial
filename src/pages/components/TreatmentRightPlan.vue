<template>
  <div class="treatment-plan">
    <Teleport defer to="#treatment-btn-group3">
      <div style="text-align: left; margin-bottom: 16px;display: flex;justify-content: left">
        <a-button class="header-btn" v-if="!isEditMode" type="primary" @click="startEdit">编辑</a-button>
        <a-button class="header-btn" v-if="isEditMode" type="primary" @click="save" style="margin-right: 8px;">保存</a-button>
        <a-button class="header-btn" v-if="isEditMode" type="primary" @click="cancel">取消</a-button>
      </div>
    </Teleport>
    <div class="exam-content">
      <div v-if="!form">暂无诊疗方案</div>
      <div v-else>
        <div class="tp-row">
          <div class="tp-col tp-col-left">
            <div class="tp-section">
              <div class="tp-section-title"><ImgIcon class="tp-icon" title="裸眼视力"/>裸眼视力</div>
              <div class="tp-row-flex">
                <div>
                  <span class="tp-label">右眼：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatVision(form.uva_right_vision) }}</span>
                  </template>
                  <template v-else>
                    <a-input-number v-model:value="form.uva_right_vision" :min="0" :step="0.01" style="width: 80px" />
                  </template>
                </div>
                <div>
                  <span class="tp-label">左眼：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatVision(form.uva_left_vision) }}</span>
                  </template>
                  <template v-else>
                    <a-input-number v-model:value="form.uva_left_vision" :min="0" :step="0.01" style="width: 80px" />
                  </template>
                </div>
                <div>
                  <span class="tp-label">双眼：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatVision(form.uva_both_vision) }}</span>
                  </template>
                  <template v-else>
                    <a-input-number v-model:value="form.uva_both_vision" :min="0" :step="0.01" style="width: 80px" />
                  </template>
                </div>
              </div>
            </div>
            <div class="tp-section">
              <div class="tp-section-title"><ImgIcon class="tp-icon" title="旧镜视力"/>旧镜视力</div>
              <div class="tp-row-flex">
                <div>
                  <span class="tp-label">右眼：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatVision(form.vaec_right_old_vision) }}</span>
                  </template>
                  <template v-else>
                    <a-input-number v-model:value="form.vaec_right_old_vision" :min="0" :step="0.01" style="width: 80px" />
                  </template>
                </div>
                <div>
                  <span class="tp-label">左眼：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatVision(form.vaec_left_old_vision) }}</span>
                  </template>
                  <template v-else>
                    <a-input-number v-model:value="form.vaec_left_old_vision" :min="0" :step="0.01" style="width: 80px" />
                  </template>
                </div>
                <div>
                  <span class="tp-label">双眼：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatVision(form.vaec_both_old_vision) }}</span>
                  </template>
                  <template v-else>
                    <a-input-number v-model:value="form.vaec_both_old_vision" :min="0" :step="0.01" style="width: 80px" />
                  </template>
                </div>
              </div>
            </div>
            <div class="tp-section">
              <div class="tp-section-title"><ImgIcon class="tp-icon" title="身高体重"/>身高/体重</div>
              <div class="tp-row-flex">
                <div>
                  <span class="tp-label">身高(厘米)：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatNumber(form.height) }}</span>
                  </template>
                  <template v-else>
                    <a-input-number v-model:value="form.height" :min="0" style="width: 80px" />
                  </template>
                </div>
                <div>
                  <span class="tp-label">体重(千克)：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatNumber(form.weight) }}</span>
                  </template>
                  <template v-else>
                    <a-input-number v-model:value="form.weight" :min="0" :step="0.1" style="width: 80px" />
                  </template>
                </div>
                <div>
                  <span class="tp-label">BMI：</span>
                  <span class="tp-value">{{ calcBMI }}</span>
                </div>
              </div>
            </div>
            <div class="tp-section">
              <div class="tp-section-title"><ImgIcon class="tp-icon" title="检查间隔"/>检查间隔/日期</div>
              <div class="tp-row-flex">
                <div>
                  <span class="tp-label">检查间隔：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ periodText(form.review_interval_days) }}</span>
                  </template>
                  <template v-else>
                    <a-select v-model:value="form.review_interval_days" style="width: 100px" @change="updateReviewDate">
                      <a-select-option :value="3">三个月</a-select-option>
                      <a-select-option :value="2">两个月</a-select-option>
                      <a-select-option :value="1">一个月</a-select-option>
                      <a-select-option :value="0">自定义</a-select-option>
                    </a-select>
                  </template>
                </div>
                <div>
                  <span class="tp-label">检查日期：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatDate(form.examination_date) }}</span>
                  </template>
                  <template v-else>
                    <a-date-picker v-model:value="form.examination_date" style="width: 130px" @change="updateReviewDate" :locale="locale" />
                  </template>
                </div>
                <div>
                  <span class="tp-label">下次检查日期：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatDate(form.review_date) }}</span>
                  </template>
                  <template v-else>
                    <a-date-picker v-model:value="form.review_date" style="width: 130px" @change="updatePeriodBasedOnReviewDate" :locale="locale" />
                  </template>
                </div>
              </div>
            </div>
          </div>
          <div class="tp-col tp-col-right">
            <div class="tp-section-title">
              <template v-if="isEditMode">
                <a-checkbox v-model:checked="form.sync_eyes" style="margin-left: 16px">双眼同步</a-checkbox>
              </template>
            </div>
            <div class="tp-row-flex tp-row-flex-wrap">
              <div class="tp-eye-card">
                <div class="tp-eye-title"><ImgIcon class="tp-icon" title="裸眼视力"/>右眼方案</div>
                <div class="tp-eye-row">
                  <span class="tp-label">阿托品：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ form.right_atropine ?? '-' }}</span>
                  </template>
                  <template v-else>
                    <a-select v-model:value="form.right_atropine" style="width: 100px">
                      <a-select-option value="否">否</a-select-option>
                      <a-select-option value="0.01%">0.01%</a-select-option>
                      <a-select-option value="0.02%">0.02%</a-select-option>
                      <a-select-option value="0.05%">0.05%</a-select-option>
                    </a-select>
                  </template>
                </div>
                <div class="tp-eye-row">
                  <span class="tp-label">配镜手段：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ form.right_glasses ?? '-' }}</span>
                    <span v-if="form.right_glasses_pp" class="tp-value tp-value-sub">({{ form.right_glasses_pp }})</span>
                  </template>
                  <template v-else>
                    <a-select v-model:value="form.right_glasses" style="width: 120px" @change="updateTreatmentOptions('right')">
                      <a-select-option value="否">否</a-select-option>
                      <a-select-option v-for="option in Object.keys(glassesPPOptions)" :key="option" :value="option">
                        {{ option }}
                      </a-select-option>
                    </a-select>
                    <a-select v-if="form.right_glasses && form.right_glasses !== '否'"
                              v-model:value="form.right_glasses_pp"
                              style="width: 100px; margin-left: 8px">
                      <a-select-option v-for="option in glassesPPOptions[form.right_glasses]"
                                       :key="option"
                                       :value="option">
                        {{ option }}
                      </a-select-option>
                    </a-select>
                  </template>
                </div>
                <div class="tp-eye-row">
                  <span class="tp-label">低强度红光：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ form.right_hg ?? '-' }}</span>
                    <span v-if="form.right_hg_dw !== undefined && form.right_hg_dw !== ''"
                          class="tp-value tp-value-sub">({{ form.right_hg_dw }})</span>
                  </template>
                  <template v-else>
                    <a-select v-model:value="form.right_hg" style="width: 100px" @change="updateTreatmentOptions('right')">
                      <a-select-option value="否">否</a-select-option>
                      <a-select-option value="唯迪科">唯迪科</a-select-option>
                      <a-select-option value="小太阳">小太阳</a-select-option>
                    </a-select>
                    <a-select v-if="form.right_hg && form.right_hg !== '否'"
                              v-model:value="form.right_hg_dw"
                              style="width: 80px; margin-left: 8px">
                      <a-select-option v-for="option in hgDWOptions[form.right_hg]"
                                       :key="option"
                                       :value="option">
                        {{ option }}
                      </a-select-option>
                    </a-select>
                  </template>
                </div>
                <div class="tp-eye-row">
                  <span class="tp-label">理疗：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ form.right_physiotherapy ?? '-' }}</span>
                  </template>
                  <template v-else>
                    <a-select v-model:value="form.right_physiotherapy" style="width: 80px">
                      <a-select-option value="否">否</a-select-option>
                      <a-select-option value="是">是</a-select-option>
                    </a-select>
                  </template>
                </div>
                <div class="tp-eye-row">
                  <span class="tp-label">视觉训练：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ form.right_visual_training ?? '-' }}</span>
                  </template>
                  <template v-else>
                    <a-select v-model:value="form.right_visual_training" style="width: 80px">
                      <a-select-option value="否">否</a-select-option>
                      <a-select-option value="是">是</a-select-option>
                    </a-select>
                  </template>
                </div>
              </div>
              <div class="tp-eye-card">
                <div class="tp-eye-title"><ImgIcon class="tp-icon" title="裸眼视力"/>左眼方案</div>
                <div class="tp-eye-row">
                  <span class="tp-label">阿托品：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ form.left_atropine ?? '-' }}</span>
                  </template>
                  <template v-else>
                    <a-select v-model:value="form.left_atropine"
                              style="width: 100px"
                              :disabled="form.sync_eyes">
                      <a-select-option value="否">否</a-select-option>
                      <a-select-option value="0.01%">0.01%</a-select-option>
                      <a-select-option value="0.02%">0.02%</a-select-option>
                      <a-select-option value="0.05%">0.05%</a-select-option>
                    </a-select>
                  </template>
                </div>
                <div class="tp-eye-row">
                  <span class="tp-label">配镜手段：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ form.left_glasses ?? '-' }}</span>
                    <span v-if="form.left_glasses_pp" class="tp-value tp-value-sub">({{ form.left_glasses_pp }})</span>
                  </template>
                  <template v-else>
                    <a-select v-model:value="form.left_glasses"
                              style="width: 120px"
                              @change="updateTreatmentOptions('left')"
                              :disabled="form.sync_eyes">
                      <a-select-option value="否">否</a-select-option>
                      <a-select-option v-for="option in Object.keys(glassesPPOptions)" :key="option" :value="option">
                        {{ option }}
                      </a-select-option>
                    </a-select>
                    <a-select v-if="form.left_glasses && form.left_glasses !== '否'"
                              v-model:value="form.left_glasses_pp"
                              style="width: 100px; margin-left: 8px"
                              :disabled="form.sync_eyes">
                      <a-select-option v-for="option in glassesPPOptions[form.left_glasses]"
                                       :key="option"
                                       :value="option">
                        {{ option }}
                      </a-select-option>
                    </a-select>
                  </template>
                </div>
                <div class="tp-eye-row">
                  <span class="tp-label">低强度红光：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ form.left_hg ?? '-' }}</span>
                    <span v-if="form.left_hg_dw !== undefined && form.left_hg_dw !== ''"
                          class="tp-value tp-value-sub">({{ form.left_hg_dw }})</span>
                  </template>
                  <template v-else>
                    <a-select v-model:value="form.left_hg"
                              style="width: 100px"
                              @change="updateTreatmentOptions('left')"
                              :disabled="form.sync_eyes">
                      <a-select-option value="否">否</a-select-option>
                      <a-select-option value="唯迪科">唯迪科</a-select-option>
                      <a-select-option value="小太阳">小太阳</a-select-option>
                    </a-select>
                    <a-select v-if="form.left_hg && form.left_hg !== '否'"
                              v-model:value="form.left_hg_dw"
                              style="width: 80px; margin-left: 8px"
                              :disabled="form.sync_eyes">
                      <a-select-option v-for="option in hgDWOptions[form.left_hg]"
                                       :key="option"
                                       :value="option">
                        {{ option }}
                      </a-select-option>
                    </a-select>
                  </template>
                </div>
                <div class="tp-eye-row">
                  <span class="tp-label">理疗：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ form.left_physiotherapy ?? '-' }}</span>
                  </template>
                  <template v-else>
                    <a-select v-model:value="form.left_physiotherapy"
                              style="width: 80px"
                              :disabled="form.sync_eyes">
                      <a-select-option value="否">否</a-select-option>
                      <a-select-option value="是">是</a-select-option>
                    </a-select>
                  </template>
                </div>
                <div class="tp-eye-row">
                  <span class="tp-label">视觉训练：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ form.left_visual_training ?? '-' }}</span>
                  </template>
                  <template v-else>
                    <a-select v-model:value="form.left_visual_training"
                              style="width: 80px"
                              :disabled="form.sync_eyes">
                      <a-select-option value="否">否</a-select-option>
                      <a-select-option value="是">是</a-select-option>
                    </a-select>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN';
import { message } from 'ant-design-vue';
import ImgIcon from "@/pages/components/ImgIcon.vue";
const props = defineProps({
  record: {
    type: Object,
    default: () => ({})
  }
});
const isEditMode = ref(false);
const original = ref({});
const form = reactive({ ...props.record });
const emit = defineEmits(['refresh']);

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');

// 修复：监听props.record变化，自动同步到form
watch(() => props.record, (newVal) => {
  Object.assign(form, newVal || {});
}, { immediate: true, deep: true });

// 品牌选项
const glassesPPOptions = {
  '离焦镜': ['星趣控', '新乐学', '轻松控', '爱眼星', '成长乐', '小乐园', '奥拉', '学趣控', '成长怡'],
  '点扩散': ['控优点', '爱眼星', '柯学优'],
  'OK镜': ['亨泰', '普诺瞳', 'CRT', '阿尔法', '露晰德', '欧几里德', '梦戴维', '天瞳', '菁眸', '目立康'],
  '离焦软镜': ['misight', '蝶适'],
  'RGP': ['目力康', '菲仕康'],
  '单光镜': ['蔡司', '依视路', '国产'],
  '渐近镜': ['蔡司', '依视路', '国产'],
  '双效离焦点扩散': ['格林视通', '爱眼星']
};
const hgDWOptions = {
  '唯迪科': [0, 3, 6, 9, 12, 15],
  '小太阳': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
};

function startEdit() {
  isEditMode.value = true;
  Object.assign(form, props.record);
  // 转换为 dayjs 对象，确保日期格式正确
  if (form.examination_date) {
    form.examination_date = dayjs(form.examination_date).format('YYYY-MM-DD');
    form.examination_date = dayjs(form.examination_date);
  }
  if (form.review_date) {
    form.review_date = dayjs(form.review_date).format('YYYY-MM-DD');
    form.review_date = dayjs(form.review_date);
  }
  original.value = JSON.parse(JSON.stringify(form));
  form.sync_eyes = true; // 默认勾选双眼同步

  // 自动计算检查间隔
  if (form.examination_date && form.review_date) {
    const start = dayjs(form.examination_date);
    const end = dayjs(form.review_date);
    const diffMonth = end.diff(start, 'month');
    if (diffMonth === 1) form.review_interval_days = 1;
    else if (diffMonth === 2) form.review_interval_days = 2;
    else if (diffMonth === 3) form.review_interval_days = 3;
    else form.review_interval_days = 0;
  }
}
function save() {
  // 收集表单数据
  const updatedRecord = {
    right_hg: form.right_hg,
    right_hg_dw: form.right_hg_dw,
    right_glasses: form.right_glasses,
    right_glasses_pp: form.right_glasses_pp,
    right_atropine: form.right_atropine,
    right_visual_training: form.right_visual_training,
    right_physiotherapy: form.right_physiotherapy,
    left_hg: form.left_hg,
    left_hg_dw: form.left_hg_dw,
    left_glasses: form.left_glasses,
    left_glasses_pp: form.left_glasses_pp,
    left_atropine: form.left_atropine,
    left_visual_training: form.left_visual_training,
    left_physiotherapy: form.left_physiotherapy,
    height: form.height,
    weight: form.weight,
    examination_date: form.examination_date ? dayjs(form.examination_date).format('YYYY-MM-DD') : '',
    review_date: form.review_date ? dayjs(form.review_date).format('YYYY-MM-DD') : '',
    review_interval_days: form.review_interval_days,
    uva_right_vision: form.uva_right_vision,
    uva_left_vision: form.uva_left_vision,
    uva_both_vision: form.uva_both_vision,
    vaec_right_old_vision: form.vaec_right_old_vision,
    vaec_left_old_vision: form.vaec_left_old_vision,
    vaec_both_old_vision: form.vaec_both_old_vision,
    id: props.record.id,
    patient_id: props.record.patient_id_id
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
          isEditMode.value = false;
          original.value = JSON.parse(JSON.stringify(form));
          message.success('保存成功');
          // 同步 sessionStorage
          try {
            const storageKey = `patient_${updatedRecord.patient_id}`;
            const savedData = sessionStorage.getItem(storageKey);
            if (savedData) {
              const parsed = JSON.parse(savedData);
              // 更新 currentData
              if (parsed.currentData && parsed.currentData.id === updatedRecord.id) {
                Object.assign(parsed.currentData, updatedRecord);
              }
              // 更新 allData 或 examinationRecords
              if (parsed.allData && Array.isArray(parsed.allData)) {
                const idx = parsed.allData.findIndex(item => item.id === updatedRecord.id);
                if (idx !== -1) {
                  Object.assign(parsed.allData[idx], updatedRecord);
                }
              }
              if (parsed.examinationRecords && Array.isArray(parsed.examinationRecords)) {
                const idx = parsed.examinationRecords.findIndex(item => item.id === updatedRecord.id);
                if (idx !== -1) {
                  Object.assign(parsed.examinationRecords[idx], updatedRecord);
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
function cancel() {
  Object.assign(form, original.value);
  isEditMode.value = false;
}
function periodText(val) {
  if (form.examination_date && form.review_date) {
    const start = new Date(form.examination_date);
    const end = new Date(form.review_date);
    if (!isNaN(start) && !isNaN(end)) {
      const diffMonth = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      const dayStart = start.getDate();
      const dayEnd = end.getDate();
      if (diffMonth > 0 && Math.abs(dayStart - dayEnd) <= 1) {
        return `${diffMonth}个月`;
      }
      return '自定义';
    }
  }
  switch (val) {
    case 3: return '三个月';
    case 2: return '两个月';
    case 1: return '一个月';
    case 0: return '自定义';
    default: return '-';
  }
}
// 右眼字段同步到左眼
function syncEyes() {
  form.left_atropine = form.right_atropine;
  form.left_glasses = form.right_glasses;
  form.left_glasses_pp = form.right_glasses_pp;
  form.left_hg = form.right_hg;
  form.left_hg_dw = form.right_hg_dw;
  form.left_physiotherapy = form.right_physiotherapy;
  form.left_visual_training = form.right_visual_training;
}
// 监听同步勾选
watch(() => form.sync_eyes, (val) => {
  if (val) {
    syncEyes();
  }
});
// 监听右眼字段变化
watch([
  () => form.right_atropine,
  () => form.right_glasses,
  () => form.right_glasses_pp,
  () => form.right_hg,
  () => form.right_hg_dw,
  () => form.right_physiotherapy,
  () => form.right_visual_training
], () => {
  if (form.sync_eyes) syncEyes();
});
function formatVision(val) {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return val;
  if (Number.isInteger(num)) return num.toFixed(1);
  return num.toFixed(2);
}
function formatNumber(val) {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toFixed(1);
}
const calcBMI = computed(() => {
  const h = Number(form.height);
  const w = Number(form.weight);
  if (!h || !w) return '-';
  const bmi = w / Math.pow(h / 100, 2);
  return bmi.toFixed(1);
});
function updateReviewDate() {
  if (!form.examination_date || !form.review_interval_days || form.review_interval_days === 0) return;
  const base = dayjs(form.examination_date);
  let next;
  if (form.review_interval_days === 1) next = base.add(1, 'month');
  else if (form.review_interval_days === 2) next = base.add(2, 'month');
  else if (form.review_interval_days === 3) next = base.add(3, 'month');
  else return;
  form.review_date = next;
}
function updatePeriodBasedOnReviewDate() {
  if (!form.examination_date || !form.review_date) return;
  const start = dayjs(form.examination_date);
  const end = dayjs(form.review_date);
  const diffMonth = end.diff(start, 'month');
  if (diffMonth === 1) form.review_interval_days = 1;
  else if (diffMonth === 2) form.review_interval_days = 2;
  else if (diffMonth === 3) form.review_interval_days = 3;
  else form.review_interval_days = 0;
}
function updateTreatmentOptions(eye) {
  // 实现更新治疗方案的逻辑
}
function formatDate(val) {
  if (!val) return '-';
  return dayjs(val).format('YYYY-MM-DD');
}
</script>

<style scoped>
.treatment-plan {
}
.exam-content {
  margin-top: 16px;
}
.tp-row {
  display: flex;
  gap: 32px;
}
.tp-col {
  flex: 1;
  background: #fafbfc;
  padding: 16px;
  min-width: 340px;
  font-size: 16px;
  color: #222;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  background: linear-gradient(135deg, #EEF3FC 0%, #FFFFFF 100%);
  border-radius: 20px 20px 20px 20px;
  border: 1px solid #E4ECFC;
}
.tp-flex {
  display: flex;
  gap: 32px;
  align-items: center;
  margin-bottom: 18px;
}
.tp-wrap {
  flex-wrap: wrap;
}
.tp-label {
  min-width: 70px;
  color: #666;
  display: inline-block;
  text-align: right;
  font-weight: 500;
}
.tp-col h4, .tp-col h5 {
  margin: 18px 0 10px 0;
  font-size: 17px;
  color: #1a1a1a;
  font-weight: bold;
}
.tp-col h5 {
  margin-top: 10px;
  font-size: 16px;
  color: #333;
}
.tp-col-left {
  border-radius: 14px;
  margin-right: 12px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.tp-section {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  padding: 18px 20px 12px 20px;
  margin-bottom: 0;
}
.tp-section-title {
  font-size: 17px;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.tp-icon {
  width: 20px;
  height: 20px;
}
.tp-row-flex {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  margin-bottom: 0;
}
.tp-value {
  color: #222;
  font-weight: 600;
  font-size: 15px;
  margin-left: 2px;
}
.tp-col-right {
  border-radius: 14px;
  padding: 16px;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.tp-row-flex-wrap {
  flex-wrap: wrap;
  gap: 24px;
}
.tp-eye-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  padding: 18px 20px 12px 20px;
  min-width: 220px;
  flex: 1 1 220px;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tp-eye-title {
  font-size: 16px;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tp-eye-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}
.tp-value-sub {
  color: #888;
  font-size: 13px;
  margin-left: 2px;
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
