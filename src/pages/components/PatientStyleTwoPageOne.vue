<template>
  <div class="page-one-container">
    <!-- 3. 医生建议（打印模式下勾选则显示） -->
    <div v-if="viewMode !== 'print' || (printSelectedSections && printSelectedSections.includes('doctor-instructions'))" 
         v-show="(showOnlySection === null || showOnlySection === 'doctor-instructions') && (viewMode !== 'print' || (printSelectedSections && printSelectedSections.includes('doctor-instructions')))"
         class="doctor-instructions-section"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.['doctor-instructions'] }">
      <h3 
        v-if="viewMode === 'view' || !isReportMode"
        class="section-title"
        :class="{ 'clickable': enableCollapse }"
        @click="enableCollapse && handleToggleSection('doctor-instructions')"
      >
        医生建议
        <span v-if="enableCollapse" class="section-toggle-icon">
          <UpOutlined v-if="sectionExpanded?.['doctor-instructions']" />
          <DownOutlined v-else />
        </span>
      </h3>
      <div v-show="viewMode === 'print' || (enableCollapse ? sectionExpanded?.['doctor-instructions'] : true)" class="instructions-content-wrapper">
        <!-- 第一行：检查日期和间隔时间 -->
        <div class="instructions-items-row">
          <!-- 上次检查日期 -->
          <div class="instruction-item">
            <div class="instruction-label">上次检查日期：</div>
            <div class="instruction-value">
              {{ formatDate(previousRecord?.examination_date) || '暂无' }}
            </div>
          </div>
          <!-- 本次检查日期 -->
          <div class="instruction-item">
            <div class="instruction-label">本次检查日期：</div>
            <div class="instruction-value">
              <template v-if="viewMode === 'edit'">
                <a-date-picker 
                  v-model:value="editForm.examination_date" 
                  style="width: 150px" 
                  format="YYYY-MM-DD"
                  @change="handleExaminationDateChange"
                  :locale="locale"
                />
              </template>
              <template v-else>
                {{ formatDate(currentRecord?.examination_date) || '暂无' }}
              </template>
            </div>
          </div>
          <!-- 间隔时间 -->
          <div class="instruction-item interval-item">
            <div class="instruction-label">间隔时间：</div>
            <div class="instruction-value">
              <template v-if="viewMode === 'edit'">
                <a-select 
                  v-model:value="editForm.review_interval_days" 
                  style="width: 120px" 
                  @change="handleIntervalChange"
                  placeholder="选择间隔"
                >
                  <a-select-option :value="1">一个月</a-select-option>
                  <a-select-option :value="2">两个月</a-select-option>
                  <a-select-option :value="3">三个月</a-select-option>
                  <a-select-option :value="0">自定义预约</a-select-option>
                </a-select>
              </template>
              <template v-else>
                {{ calculateInterval() }}
              </template>
            </div>
          </div>
          <!-- 自定义预约时显示预约医生 -->
          <div v-if="(viewMode === 'edit' && editForm.review_interval_days === 0) || (viewMode !== 'edit' && currentRecord?.review_interval_days === 0)" class="instruction-item">
            <div class="instruction-label">预约医生：</div>
            <div class="instruction-value">
              <template v-if="viewMode === 'edit'">
                <a-select 
                  v-model:value="editForm.appointment_doctor" 
                  placeholder="选择预约医生"
                  style="width: 150px"
                  :loading="doctorListLoading"
                  :options="doctorList"
                  :field-names="{ label: 'name', value: 'id' }"
                />
              </template>
              <template v-else>
                {{ displayedAppointmentDoctorName }}
              </template>
            </div>
          </div>
          <!-- 下次复查日期：所有间隔类型均显示 -->
          <div class="instruction-item">
            <div class="instruction-label">下次复查日期：</div>
            <div class="instruction-value">
              <template v-if="viewMode === 'edit'">
                <a-date-picker 
                  v-model:value="editForm.review_date" 
                  style="width: 150px" 
                  format="YYYY-MM-DD"
                  @change="updatePeriodBasedOnReviewDate"
                  :locale="locale"
                  placeholder="选择下次复查日期"
                />
              </template>
              <template v-else>
                {{ displayNextReviewDate }}
              </template>
            </div>
          </div>
        </div>
        <!-- 分隔线 -->
        <div class="instruction-divider"></div>
        <!-- 第二行：上次和本次医生建议 -->
        <div class="instructions-advice-row">
          <!-- 上次医生建议 -->
          <div class="instruction-advice-item">
            <div class="instruction-label">上次医生建议：</div>
            <div class="instruction-value">
              {{ previousRecord?.remarks || '暂无' }}
            </div>
          </div>
          <!-- 本次医生建议 -->
          <div class="instruction-advice-item">
            <div class="instruction-label">本次医生建议/备注：</div>
            <div class="instruction-value">
              <template v-if="viewMode === 'edit'">
                <a-textarea 
                  v-model:value="editForm.remarks" 
                  :rows="3" 
                  placeholder="请输入本次医生建议"
                  style="width: 100%;"
                />
              </template>
              <template v-else>
                {{ currentRecord?.remarks || '暂无' }}
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 诊疗方案 -->
    <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasTreatmentPlanData" 
         v-show="(showOnlySection === null || showOnlySection === 'treatment-plan') && (viewMode !== 'print' || (printSelectedSections && printSelectedSections.includes('treatment-plan')))"
         class="treatment-plan-section"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.['treatment-plan'] }">
      <h3 
        v-if="viewMode === 'view' || !isReportMode"
        class="section-title"
        :class="{ 'clickable': enableCollapse }"
        @click="enableCollapse && handleToggleSection('treatment-plan')"
      >
        <span class="section-title-text">
        诊疗方案
        </span>
        <template v-if="viewMode === 'edit'">
          <div class="section-edit-controls-wrapper" @click.stop @mousedown.stop @mouseup.stop>
            <a-checkbox v-model:checked="editForm.sync_eyes">双眼同步</a-checkbox>
            <a-button type="primary" size="small" @click="handleSyncPreviousTreatment">
            同步上次
          </a-button>
          </div>
        </template>
        <span v-if="enableCollapse" class="section-toggle-icon">
          <UpOutlined v-if="sectionExpanded?.['treatment-plan']" />
          <DownOutlined v-else />
        </span>
      </h3>
      <div v-show="viewMode === 'print' || (enableCollapse ? sectionExpanded?.['treatment-plan'] : true)">
      <table class="treatment-plan-table">
        <thead>
          <tr>
            <th>检查项目</th>
            <th>右眼</th>
            <th>左眼</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="item-label">阿托品</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-select v-model:value="editForm.right_atropine" style="width: 100%" placeholder="选择">
                  <a-select-option value="否">否</a-select-option>
                  <a-select-option value="0.01%">0.01%</a-select-option>
                  <a-select-option value="0.02%">0.02%</a-select-option>
                  <a-select-option value="0.05%">0.05%</a-select-option>
                </a-select>
              </template>
              <template v-else>{{ formatAtropine(currentRecord?.right_atropine) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-select v-model:value="editForm.left_atropine" style="width: 100%" placeholder="选择" :disabled="editForm.sync_eyes">
                  <a-select-option value="否">否</a-select-option>
                  <a-select-option value="0.01%">0.01%</a-select-option>
                  <a-select-option value="0.02%">0.02%</a-select-option>
                  <a-select-option value="0.05%">0.05%</a-select-option>
                </a-select>
              </template>
              <template v-else>{{ formatAtropine(currentRecord?.left_atropine) }}</template>
            </td>
          </tr>
          <tr>
            <td class="item-label">配镜</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <a-select v-model:value="editForm.right_glasses" style="flex: 1" @change="updateRightGlassesPP" placeholder="选择">
                  <a-select-option value="否">否</a-select-option>
                  <a-select-option v-for="option in treatmentSettings.glassesMethods" :key="option" :value="option">
                    {{ option }}
                  </a-select-option>
                </a-select>
                <a-select 
                  v-if="editForm.right_glasses && editForm.right_glasses !== '否'"
                  v-model:value="editForm.right_glasses_pp"
                    style="width: 100px"
                  placeholder="品牌"
                >
                  <a-select-option v-for="option in glassesPPOptions[editForm.right_glasses] || []" :key="option" :value="option">
                    {{ option }}
                  </a-select-option>
                </a-select>
              </div>
              </template>
              <template v-else>{{ formatGlasses(currentRecord?.right_glasses, currentRecord?.right_glasses_pp) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <a-select v-model:value="editForm.left_glasses" style="flex: 1" @change="updateLeftGlassesPP" placeholder="选择" :disabled="editForm.sync_eyes">
                  <a-select-option value="否">否</a-select-option>
                    <a-select-option v-for="option in treatmentSettings.glassesMethods" :key="option" :value="option">
                      {{ option }}
                  </a-select-option>
                </a-select>
                <a-select 
                    v-if="editForm.left_glasses && editForm.left_glasses !== '否'"
                    v-model:value="editForm.left_glasses_pp"
                    style="width: 100px"
                    placeholder="品牌"
                    :disabled="editForm.sync_eyes"
                >
                    <a-select-option v-for="option in glassesPPOptions[editForm.left_glasses] || []" :key="option" :value="option">
                    {{ option }}
                  </a-select-option>
                </a-select>
              </div>
              </template>
              <template v-else>{{ formatGlasses(currentRecord?.left_glasses, currentRecord?.left_glasses_pp) }}</template>
            </td>
          </tr>
          <tr>
            <td class="item-label">低强度红光</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <a-select v-model:value="editForm.right_hg" style="flex: 1" @change="updateRightHGDW" placeholder="选择">
                  <a-select-option value="否">否</a-select-option>
                    <a-select-option v-for="device in treatmentSettings.hgDevices" :key="device" :value="device">
                      {{ device }}
                  </a-select-option>
                </a-select>
                <a-select 
                    v-if="editForm.right_hg && editForm.right_hg !== '否'"
                    v-model:value="editForm.right_hg_dw"
                    style="width: 80px"
                    placeholder="档位"
                >
                    <a-select-option v-for="option in hgDWOptions[editForm.right_hg] || []" :key="option" :value="option">
                    {{ option }}
                  </a-select-option>
                </a-select>
              </div>
              </template>
              <template v-else>{{ formatHG(currentRecord?.right_hg, currentRecord?.right_hg_dw) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <a-select v-model:value="editForm.left_hg" style="flex: 1" @change="updateLeftHGDW" placeholder="选择" :disabled="editForm.sync_eyes">
                  <a-select-option value="否">否</a-select-option>
                  <a-select-option v-for="device in treatmentSettings.hgDevices" :key="device" :value="device">
                    {{ device }}
                  </a-select-option>
                </a-select>
                <a-select 
                  v-if="editForm.left_hg && editForm.left_hg !== '否'"
                  v-model:value="editForm.left_hg_dw"
                    style="width: 80px"
                  placeholder="档位"
                  :disabled="editForm.sync_eyes"
                >
                  <a-select-option v-for="option in hgDWOptions[editForm.left_hg] || []" :key="option" :value="option">
                    {{ option }}
                  </a-select-option>
                </a-select>
              </div>
              </template>
              <template v-else>{{ formatHG(currentRecord?.left_hg, currentRecord?.left_hg_dw) }}</template>
            </td>
          </tr>
          <tr>
            <td class="item-label">理疗</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-select v-model:value="editForm.right_physiotherapy" style="width: 100%" placeholder="选择">
                  <a-select-option value="否">否</a-select-option>
                  <a-select-option value="是">是</a-select-option>
                </a-select>
              </template>
              <template v-else>{{ formatYesNo(currentRecord?.right_physiotherapy) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-select v-model:value="editForm.left_physiotherapy" style="width: 100%" placeholder="选择" :disabled="editForm.sync_eyes">
                  <a-select-option value="否">否</a-select-option>
                  <a-select-option value="是">是</a-select-option>
                </a-select>
              </template>
              <template v-else>{{ formatYesNo(currentRecord?.left_physiotherapy) }}</template>
            </td>
          </tr>
          <tr>
            <td class="item-label">视觉训练</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-select v-model:value="editForm.right_visual_training" style="width: 100%" placeholder="选择">
                  <a-select-option value="否">否</a-select-option>
                  <a-select-option value="0">斜视训练</a-select-option>
                  <a-select-option value="1">弱视训练</a-select-option>
                  <a-select-option value="2">近视训练</a-select-option>
                </a-select>
              </template>
              <template v-else>{{ formatVisualTraining(currentRecord?.right_visual_training) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-select v-model:value="editForm.left_visual_training" style="width: 100%" placeholder="选择" :disabled="editForm.sync_eyes">
                  <a-select-option value="否">否</a-select-option>
                  <a-select-option value="0">斜视训练</a-select-option>
                  <a-select-option value="1">弱视训练</a-select-option>
                  <a-select-option value="2">近视训练</a-select-option>
                </a-select>
              </template>
              <template v-else>{{ formatVisualTraining(currentRecord?.left_visual_training) }}</template>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, nextTick, createVNode } from 'vue';
import { UpOutlined, DownOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue';
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
  enableCollapse: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle-section', 'update-record']);

// 计算 isReportMode：在查看模式下，如果没有选中特定section，则为报告模式
const isReportMode = computed(() => {
  return props.viewMode === 'view' && !props.showOnlySection;
});

// 切换section展开/收起状态
const handleToggleSection = (sectionKey) => {
  emit('toggle-section', sectionKey);
};

// 编辑表单数据
const editForm = ref({});

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
      // 初始化 sync_eyes，默认勾选
      if (editForm.value.sync_eyes === undefined || editForm.value.sync_eyes === null) {
        editForm.value.sync_eyes = true;
      }
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
    // 初始化 sync_eyes，默认勾选
    editForm.value.sync_eyes = true;
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

const hasTreatmentPlanData = computed(() => {
  const record = props.currentRecord;
  if (!record) return false;
  return !!(
    record.right_atropine || record.left_atropine ||
    record.right_glasses || record.left_glasses ||
    record.right_hg || record.left_hg ||
    record.right_physiotherapy || record.left_physiotherapy ||
    record.right_visual_training || record.left_visual_training
  );
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
  font-size: 18px;
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
  font-size: 14px;
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
  font-size: clamp(0.75rem, 1.5vw, 0.8125rem);
  font-weight: 600;
  color: #224b96;
  margin-bottom: 0;
  white-space: nowrap;
  margin-right: clamp(0.2rem, 0.5vw, 0.25rem);
  line-height: 1.5;
  vertical-align: baseline;
}

.instruction-value {
  font-size: clamp(0.75rem, 1.5vw, 0.8125rem);
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

// 4. 诊疗方案
.treatment-plan-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  width: 100%;
  max-width: 100%;
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

.treatment-plan-table {
  width: 100%;
  border-collapse: collapse;
  font-size: clamp(0.75rem, 1.5vw, 0.9375rem);
  margin-bottom: 16px;
  
  th, td {
    padding: 10px 12px;
    text-align: center;
    border: 1px solid #e0e6f5;
  }
  
  th {
    background: linear-gradient(135deg, rgba(34, 75, 150, 0.08) 0%, rgba(234, 240, 255, 0.6) 100%);
    color: #224b96;
    font-weight: 600;
  }

  td.item-label {
    background: linear-gradient(135deg, rgba(34, 75, 150, 0.05) 0%, rgba(234, 240, 255, 0.4) 100%);
    color: #333;
    font-weight: 500;
    text-align: center;
  }
  
  td {
    color: #333;
    border: 1px solid #f0f2f5;
    border-top: none;
    line-height: 1.3;
  }
  
  tbody tr {
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: rgba(34, 75, 150, 0.04) !important;
    }
  }
  
  tbody tr:nth-child(even) {
    background: #ffffff;
  }
  
  tbody tr:nth-child(odd) {
    background: #fafbff;
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
