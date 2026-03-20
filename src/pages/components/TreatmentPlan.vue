<template>
  <div class="treatment-plan">
    <Teleport defer to="#treatment-btn-group">
      <div style="text-align: left; margin-bottom: 16px;display: flex;justify-content: left">
        <a-button class="header-btn" v-if="!isEditMode" type="primary" @click="startEdit">编辑</a-button>
        <a-button class="header-btn" v-if="isEditMode" type="primary" @click="save" style="margin-right: 8px;">保存</a-button>
        <a-button class="header-btn" v-if="isEditMode" type="primary" @click="cancel" style="margin-right: 8px;">取消</a-button>
        <a-button class="header-btn sync-btn" v-if="isEditMode" @click="syncFromPrevious" style="margin-right: 8px;">同步上次方案</a-button>
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
                    <span class="tp-value">{{ formatVisionWithSign(form, 'uva_right_vision') }}</span>
                  </template>
                  <template v-else>
                    <div class="tp-vision-input">
                      <a-input-number v-model:value="form.uva_right_vision" :min="0" :step="0.01" style="width: 80px" />
                      <a-input-group compact class="tp-vision-suffix-group">
                        <a-select
                            v-model:value="form.uva_right_vision_sign"
                            class="tp-vision-sign-select"
                            placeholder="±"
                            allowClear
                        >
                          <a-select-option value="+">+</a-select-option>
                          <a-select-option value="-">-</a-select-option>
                        </a-select>
                        <a-input-number
                            v-model:value="form.uva_right_vision_level"
                            class="tp-vision-level-input"
                            :min="0"
                            :max="9"
                            :precision="0"
                            placeholder="个"
                            :controls="false"
                        />
                      </a-input-group>
                    </div>
                  </template>
                </div>
                <div>
                  <span class="tp-label">左眼：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatVisionWithSign(form, 'uva_left_vision') }}</span>
                  </template>
                  <template v-else>
                    <div class="tp-vision-input">
                      <a-input-number v-model:value="form.uva_left_vision" :min="0" :step="0.01" style="width: 80px" />
                      <a-input-group compact class="tp-vision-suffix-group">
                        <a-select
                            v-model:value="form.uva_left_vision_sign"
                            class="tp-vision-sign-select"
                            placeholder="±"
                            allowClear
                        >
                          <a-select-option value="+">+</a-select-option>
                          <a-select-option value="-">-</a-select-option>
                        </a-select>
                        <a-input-number
                            v-model:value="form.uva_left_vision_level"
                            class="tp-vision-level-input"
                            :min="0"
                            :max="9"
                            :precision="0"
                            placeholder="个"
                            :controls="false"
                        />
                      </a-input-group>
                    </div>
                  </template>
                </div>
                <div>
                  <span class="tp-label">双眼：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatVisionWithSign(form, 'uva_both_vision') }}</span>
                  </template>
                  <template v-else>
                    <div class="tp-vision-input">
                      <a-input-number v-model:value="form.uva_both_vision" :min="0" :step="0.01" style="width: 80px" />
                      <a-input-group compact class="tp-vision-suffix-group">
                        <a-select
                            v-model:value="form.uva_both_vision_sign"
                            class="tp-vision-sign-select"
                            placeholder="±"
                            allowClear
                        >
                          <a-select-option value="+">+</a-select-option>
                          <a-select-option value="-">-</a-select-option>
                        </a-select>
                        <a-input-number
                            v-model:value="form.uva_both_vision_level"
                            class="tp-vision-level-input"
                            :min="0"
                            :max="9"
                            :precision="0"
                            placeholder="个"
                            :controls="false"
                        />
                      </a-input-group>
                    </div>
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
                    <span class="tp-value">{{ formatVisionWithSign(form, 'vaec_right_old_vision') }}</span>
                  </template>
                  <template v-else>
                    <div class="tp-vision-input">
                      <a-input-number v-model:value="form.vaec_right_old_vision" :min="0" :step="0.01" style="width: 80px" />
                      <a-input-group compact class="tp-vision-suffix-group">
                        <a-select
                            v-model:value="form.vaec_right_old_vision_sign"
                            class="tp-vision-sign-select"
                            placeholder="±"
                            allowClear
                        >
                          <a-select-option value="+">+</a-select-option>
                          <a-select-option value="-">-</a-select-option>
                        </a-select>
                        <a-input-number
                            v-model:value="form.vaec_right_old_vision_level"
                            class="tp-vision-level-input"
                            :min="0"
                            :max="9"
                            :precision="0"
                            placeholder="个"
                            :controls="false"
                        />
                      </a-input-group>
                    </div>
                  </template>
                </div>
                <div>
                  <span class="tp-label">左眼：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatVisionWithSign(form, 'vaec_left_old_vision') }}</span>
                  </template>
                  <template v-else>
                    <div class="tp-vision-input">
                      <a-input-number v-model:value="form.vaec_left_old_vision" :min="0" :step="0.01" style="width: 80px" />
                      <a-input-group compact class="tp-vision-suffix-group">
                        <a-select
                            v-model:value="form.vaec_left_old_vision_sign"
                            class="tp-vision-sign-select"
                            placeholder="±"
                            allowClear
                        >
                          <a-select-option value="+">+</a-select-option>
                          <a-select-option value="-">-</a-select-option>
                        </a-select>
                        <a-input-number
                            v-model:value="form.vaec_left_old_vision_level"
                            class="tp-vision-level-input"
                            :min="0"
                            :max="9"
                            :precision="0"
                            placeholder="个"
                            :controls="false"
                        />
                      </a-input-group>
                    </div>
                  </template>
                </div>
                <div>
                  <span class="tp-label">双眼：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ formatVisionWithSign(form, 'vaec_both_old_vision') }}</span>
                  </template>
                  <template v-else>
                    <div class="tp-vision-input">
                      <a-input-number v-model:value="form.vaec_both_old_vision" :min="0" :step="0.01" style="width: 80px" />
                      <a-input-group compact class="tp-vision-suffix-group">
                        <a-select
                            v-model:value="form.vaec_both_old_vision_sign"
                            class="tp-vision-sign-select"
                            placeholder="±"
                            allowClear
                        >
                          <a-select-option value="+">+</a-select-option>
                          <a-select-option value="-">-</a-select-option>
                        </a-select>
                        <a-input-number
                            v-model:value="form.vaec_both_old_vision_level"
                            class="tp-vision-level-input"
                            :min="0"
                            :max="9"
                            :precision="0"
                            placeholder="个"
                            :controls="false"
                        />
                      </a-input-group>
                    </div>
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
                      <a-select-option :value="0">自定义预约</a-select-option>
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
                <!-- 自定义预约时显示医生选择 -->
                <div v-if="form.review_interval_days === 0">
                  <span class="tp-label">预约医生：</span>
                  <template v-if="!isEditMode">
                    <span class="tp-value">{{ getDoctorName(form.appointment_doctor, form.appointment_doctor_name) }}</span>
                  </template>
                  <template v-else>
                    <a-select 
                      v-model:value="form.appointment_doctor" 
                      placeholder="选择预约医生"
                      style="width: 150px"
                      :loading="doctorListLoading"
                      :options="doctorList"
                      :field-names="{ label: 'name', value: 'id' }"
                    >
                      <template #suffixIcon>
                        <img-icon class="input-icon" title="展开" style="margin-right: 0"/>
                      </template>
                    </a-select>
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
                        <a-select-option v-for="option in treatmentSettings.glassesMethods" :key="option" :value="option">
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
                        <a-select-option v-for="device in treatmentSettings.hgDevices" :key="device" :value="device">
                          {{ device }}
                        </a-select-option>
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
                        <a-select-option v-for="option in treatmentSettings.glassesMethods" :key="option" :value="option">
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
                        <a-select-option v-for="device in treatmentSettings.hgDevices" :key="device" :value="device">
                          {{ device }}
                        </a-select-option>
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
               
               <!-- 备注区域 -->
               <div class="tp-section">
                 <div class="tp-section-title">
                   <ImgIcon class="tp-icon" title="备注"/>备注
                 </div>
                 <div class="tp-remarks-container">
                   <template v-if="!isEditMode">
                     <div class="tp-remarks-display">
                       {{ displayRemarks || '暂无备注' }}
                     </div>
                   </template>
                   <template v-else>
                     <a-textarea 
                       v-model:value="editableRemarks" 
                       placeholder="请输入备注信息..."
                       :rows="4"
                       :maxlength="500"
                       show-count
                       style="width: 100%;"
                     />
                   </template>
                 </div>
               </div>
           </div>
         </div>
       </div>
     </div>
   </div>
 </template>

<script setup>
import { ref, reactive, watch, computed, nextTick } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN';
import { message, Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { createVNode } from 'vue';
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

// 用于编辑的备注（不包含【已收藏】标记）
const editableRemarks = ref('');

// 显示的备注（不包含【已收藏】标记）
const displayRemarks = computed(() => {
  if (!form.remarks) return '';
  return form.remarks.replace(/\n?【已收藏】/g, '').trim();
});

// 判断当前记录是否被收藏
const isFavorited = computed(() => {
  if (!form.remarks) return false;
  return form.remarks.includes('【已收藏】');
});

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');

// 医生列表相关数据
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
      // 处理API响应格式
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

// 修复：监听props.record变化，自动同步到form
// 注意：医生信息（appointment_doctor 和 appointment_doctor_name）直接从检查记录中读取，无需额外API请求
watch(() => props.record, (newVal, oldVal) => {
  if (!newVal) return;
  
  // 如果记录ID变化了（说明切换了记录），且正在编辑模式，先退出编辑
  if (oldVal && newVal.id !== oldVal.id && isEditMode.value) {
    isEditMode.value = false;
  }
  
  // 同步数据到form
  Object.assign(form, newVal);
  
  // 如果记录中有预约医生信息，获取医生列表以便显示医生姓名（仅在编辑模式下需要）
  // 医生名字直接从检查记录中读取（appointment_doctor_name），无需额外请求
  if (newVal.appointment_doctor && doctorList.value.length === 0) {
    fetchDoctorList();
  }
}, { immediate: true, deep: true });

// 监听方案设置变化，实时更新选项
window.addEventListener('treatment-settings-changed', (event) => {
  treatmentSettings.value = event.detail;
});

// 从localStorage读取方案设置
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
  
  // 返回默认设置（全选）
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

// 动态获取方案设置
const treatmentSettings = ref(loadTreatmentSettings());

// 品牌选项 - 从localStorage动态获取
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

// 低强度红光档位选项 - 从localStorage动态获取
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

function startEdit() {
  isEditMode.value = true;
  Object.assign(form, props.record);
  
  // 初始化可编辑的备注（移除【已收藏】标记）
  editableRemarks.value = displayRemarks.value;
  
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

  // 自动计算检查间隔（仅当后端未提供时）
  if ((form.review_interval_days === undefined || form.review_interval_days === null)
      && form.examination_date && form.review_date) {
    const start = dayjs(form.examination_date);
    const end = dayjs(form.review_date);
    const diffMonth = end.diff(start, 'month');
    if (diffMonth === 1) form.review_interval_days = 1;
    else if (diffMonth === 2) form.review_interval_days = 2;
    else if (diffMonth === 3) form.review_interval_days = 3;
    else form.review_interval_days = 0;
  }
  
  // 获取医生列表（仅在编辑模式下需要）
  // 医生信息直接从检查记录中读取（appointment_doctor 和 appointment_doctor_name），无需额外请求
  fetchDoctorList();
}
function save() {
  // 处理备注：如果是收藏的记录，需要在用户编辑的备注后添加【已收藏】标记
  let finalRemarks = editableRemarks.value?.trim() || '';
  if (isFavorited.value) {
    // 如果原本是收藏的，保存时要保留【已收藏】标记
    if (finalRemarks) {
      finalRemarks = finalRemarks + '\n【已收藏】';
    } else {
      finalRemarks = '【已收藏】';
    }
  }
  
  // 获取医生名字（如果选择了医生）
  let appointmentDoctorName = null;
  if (form.appointment_doctor) {
    const selectedDoctor = doctorList.value.find(d => d.id === form.appointment_doctor);
    appointmentDoctorName = selectedDoctor ? selectedDoctor.name : null;
  }
  
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
    uva_right_vision_sign: (form.uva_right_vision != null && form.uva_right_vision !== '') ? (form.uva_right_vision_sign || '+') : null,
    uva_right_vision_level: form.uva_right_vision_level !== null && form.uva_right_vision_level !== undefined ? parseInt(form.uva_right_vision_level) : null,
    uva_left_vision: form.uva_left_vision,
    uva_left_vision_sign: (form.uva_left_vision != null && form.uva_left_vision !== '') ? (form.uva_left_vision_sign || '+') : null,
    uva_left_vision_level: form.uva_left_vision_level !== null && form.uva_left_vision_level !== undefined ? parseInt(form.uva_left_vision_level) : null,
    uva_both_vision: form.uva_both_vision,
    uva_both_vision_sign: (form.uva_both_vision != null && form.uva_both_vision !== '') ? (form.uva_both_vision_sign || '+') : null,
    uva_both_vision_level: form.uva_both_vision_level !== null && form.uva_both_vision_level !== undefined ? parseInt(form.uva_both_vision_level) : null,
    vaec_right_old_vision: form.vaec_right_old_vision,
    vaec_right_old_vision_sign: (form.vaec_right_old_vision != null && form.vaec_right_old_vision !== '') ? (form.vaec_right_old_vision_sign || '+') : null,
    vaec_right_old_vision_level: form.vaec_right_old_vision_level !== null && form.vaec_right_old_vision_level !== undefined ? parseInt(form.vaec_right_old_vision_level) : null,
    vaec_left_old_vision: form.vaec_left_old_vision,
    vaec_left_old_vision_sign: (form.vaec_left_old_vision != null && form.vaec_left_old_vision !== '') ? (form.vaec_left_old_vision_sign || '+') : null,
    vaec_left_old_vision_level: form.vaec_left_old_vision_level !== null && form.vaec_left_old_vision_level !== undefined ? parseInt(form.vaec_left_old_vision_level) : null,
    vaec_both_old_vision: form.vaec_both_old_vision,
    vaec_both_old_vision_sign: (form.vaec_both_old_vision != null && form.vaec_both_old_vision !== '') ? (form.vaec_both_old_vision_sign || '+') : null,
    vaec_both_old_vision_level: form.vaec_both_old_vision_level !== null && form.vaec_both_old_vision_level !== undefined ? parseInt(form.vaec_both_old_vision_level) : null,
    remarks: finalRemarks,
    id: props.record.id,
    patient_id: props.record.patient_id_id,
    appointment_doctor: form.appointment_doctor || null,
    appointment_doctor_name: appointmentDoctorName || null
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
      
      // 注意：医生信息（appointment_doctor 和 appointment_doctor_name）已保存在检查记录中，无需额外创建邀约
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
  // 重置可编辑的备注
  editableRemarks.value = displayRemarks.value;
  isEditMode.value = false;
}

// 同步上次诊疗方案
async function syncFromPrevious() {
  try {
    // 尝试多种方式获取 patientId
    const patientId = props.record.patient_id_id || props.record.patient_id;
    
    // 验证 patientId 是否有效
    if (!patientId) {
      message.error('无法获取患者ID，请刷新页面后重试');
      console.error('patient_id 未找到，record:', props.record);
      return;
    }
    
    const currentRecordId = props.record.id;
    const currentDate = props.record.examination_date;
    
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
        
        // 检查响应状态
        if (!response.ok) {
          console.error(`API 请求失败: ${response.status} ${response.statusText}`);
          message.warning('无法从服务器获取历史记录，将仅使用本地缓存数据');
          // 如果 API 失败，继续使用空的 historyRecords，后续会提示未找到
        } else {
          // 检查响应内容类型
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data.status_code === 200 && data.data) {
              historyRecords = data.data;
            }
          } else {
            console.error('响应不是 JSON 格式:', contentType);
            message.warning('服务器响应格式错误，将仅使用本地缓存数据');
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
    const examDate = formatDate(previousRecord.examination_date);
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
            form.right_atropine = previousRecord.right_atropine || form.right_atropine;
            form.right_glasses = previousRecord.right_glasses || form.right_glasses;
            form.right_glasses_pp = previousRecord.right_glasses_pp || form.right_glasses_pp;
            form.right_hg = previousRecord.right_hg || form.right_hg;
            form.right_hg_dw = previousRecord.right_hg_dw || form.right_hg_dw;
            form.right_visual_training = previousRecord.right_visual_training || form.right_visual_training;
            form.right_physiotherapy = previousRecord.right_physiotherapy || form.right_physiotherapy;
            
            form.left_atropine = previousRecord.left_atropine || form.left_atropine;
            form.left_glasses = previousRecord.left_glasses || form.left_glasses;
            form.left_glasses_pp = previousRecord.left_glasses_pp || form.left_glasses_pp;
            form.left_hg = previousRecord.left_hg || form.left_hg;
            form.left_hg_dw = previousRecord.left_hg_dw || form.left_hg_dw;
            form.left_visual_training = previousRecord.left_visual_training || form.left_visual_training;
            form.left_physiotherapy = previousRecord.left_physiotherapy || form.left_physiotherapy;
            
            // 同步备注（可选）- 不包含【已收藏】标记
            if (previousRecord.remarks) {
              const cleanedRemarks = previousRecord.remarks.replace(/\n?【已收藏】/g, '').trim();
              // 如果当前记录是收藏的，保留收藏状态
              if (isFavorited.value) {
                form.remarks = cleanedRemarks ? cleanedRemarks + '\n【已收藏】' : '【已收藏】';
              } else {
                form.remarks = cleanedRemarks;
              }
              // 更新编辑框中的备注
              editableRemarks.value = cleanedRemarks;
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
}

function periodText(val) {
  // 优先使用明确的间隔值显示
  // 如果间隔值为0，无论日期如何都显示"自定义预约"（邀约记录）
  if (val === 0) return '自定义预约';
  if (val === 1) return '一个月';
  if (val === 2) return '两个月';
  if (val === 3) return '三个月';

  // 兜底：根据日期推断（仅在未提供有效val时，且val不为0）
  if (form.examination_date && form.review_date && val !== 0) {
    const start = new Date(form.examination_date);
    const end = new Date(form.review_date);
    if (!isNaN(start) && !isNaN(end)) {
      const diffMonth = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      const dayStart = start.getDate();
      const dayEnd = end.getDate();
      if (diffMonth > 0 && Math.abs(dayStart - dayEnd) <= 1) {
        if (diffMonth === 1) return '一个月';
        if (diffMonth === 2) return '两个月';
        if (diffMonth === 3) return '三个月';
      }
      return '自定义预约';
    }
  }
  return '-';
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

// 格式化视力显示：将视力值、符号、级别组合显示
function formatVisionWithSign(record, fieldPrefix) {
  const vision = record[fieldPrefix] ?? null;
  const sign = record[`${fieldPrefix}_sign`] ?? null;
  const level = record[`${fieldPrefix}_level`] ?? null;
  
  if (vision === null || vision === undefined || vision === '') return '-';
  
  let result = formatVision(vision);
  if (sign && level !== null && level !== undefined && level !== '') {
    result += sign + level;
  } else if (sign) {
    result += sign;
  } else if (level !== null && level !== undefined && level !== '') {
    result += level;
  }
  
  return result;
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
  
  // 如果原本是邀约（review_interval_days === 0），即使日期是整月，也保持为0（自定义预约）
  // 需要检查原始记录中的review_interval_days是否为0
  const originalIntervalDays = props.record.review_interval_days;
  if (originalIntervalDays === 0) {
    form.review_interval_days = 0;
    return;
  }
  
  // 如果不是邀约，根据日期差值计算
  const start = dayjs(form.examination_date);
  const end = dayjs(form.review_date);
  const diffMonth = end.diff(start, 'month');
  if (diffMonth === 1) form.review_interval_days = 1;
  else if (diffMonth === 2) form.review_interval_days = 2;
  else if (diffMonth === 3) form.review_interval_days = 3;
  else form.review_interval_days = 0;
}
function updateTreatmentOptions(eye) {
  if (eye === 'right') {
    // 当右眼低强度红光选择"否"时，清空档位
    if (form.right_hg === '否') {
      form.right_hg_dw = null;
    }
    // 当右眼配镜手段选择"否"时，清空品牌
    if (form.right_glasses === '否') {
      form.right_glasses_pp = null;
    }
  } else if (eye === 'left') {
    // 当左眼低强度红光选择"否"时，清空档位
    if (form.left_hg === '否') {
      form.left_hg_dw = null;
    }
    // 当左眼配镜手段选择"否"时，清空品牌
    if (form.left_glasses === '否') {
      form.left_glasses_pp = null;
    }
  }
}
function formatDate(val) {
  if (!val) return '-';
  return dayjs(val).format('YYYY-MM-DD');
}

// 根据医生ID获取医生姓名
function getDoctorName(doctorId, doctorName) {
  // 优先使用传入的医生名字（从检查记录中读取）
  if (doctorName) return doctorName;
  if (!doctorId) return '-';
  // 如果没有医生名字，从医生列表中查找
  const doctor = doctorList.value.find(d => d.id === doctorId);
  return doctor ? doctor.name : '-';
}

</script>

<style scoped>
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
 
 .tp-remarks-container {
   width: 100%;
 }
 
 .tp-remarks-display {
   min-height: 80px;
   padding: 12px 16px;
   background: #f8f9fa;
   border: 1px solid #e9ecef;
   border-radius: 6px;
   color: #495057;
   font-size: 14px;
   line-height: 1.5;
   white-space: pre-wrap;
   word-wrap: break-word;
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

/* 视力输入样式 */
.tp-vision-input {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.tp-vision-suffix-group {
  display: flex;
  align-items: center;
}

.tp-vision-sign-select {
  width: 60px !important;
  min-width: 60px;
  flex-shrink: 0;
}

.tp-vision-sign-select :deep(.ant-select-selector) {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  border-right: none !important;
  padding: 0 8px !important;
  height: 32px !important;
  display: flex;
  align-items: center;
}

.tp-vision-sign-select :deep(.ant-select-selection-item) {
  line-height: 32px !important;
  text-align: center;
  padding: 0 !important;
  font-size: 16px !important;
  font-weight: bold !important;
}

.tp-vision-level-input {
  width: 55px !important;
  min-width: 55px;
  flex-shrink: 0;
}

.tp-vision-level-input :deep(.ant-input-number-input) {
  height: 32px !important;
  text-align: center;
  padding: 0 8px !important;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}

.tp-vision-level-input :deep(.ant-input-number) {
  height: 32px !important;
}

.tp-vision-suffix-group :deep(.ant-input-group) {
  display: flex;
  border-radius: 8px;
  border: 1px solid #E27244;
  overflow: hidden;
}

.tp-vision-suffix-group :deep(.ant-select) {
  border: none;
}

.tp-vision-suffix-group :deep(.ant-input-number) {
  border: none;
}
</style>
