<template>
  <div class="patient-constraint">
    <a-spin :spinning="isLoading" class="patient-spin-wrapper">
    <div class="patient-page-root">
      <div v-if="isFirstLoad" style="text-align: center; margin: 20px;">
        <h3>首次加载，请耐心等待...</h3>
      </div>

      <!-- A4布局 -->
      <PatientStyleTwo
        ref="patientStyleTwoRef"
        :paged-dates="pagedDates"
        :date-page="datePage"
        :date-pages="datePages"
        :selected-record-id="selectedRecordId"
        :sorted-records="sortedRecords"
        :examination-records="examinationRecords"
        :current-record="currentRecord"
        :previous-record="previousRecord"
        :style-two-sections="styleTwoSections"
        :patient-info="patientInfo"
        :patient-id="props.record.patient_id ?? props.record.patient_id_id ?? props.record.id"
        :is-record-favorited="isRecordFavorited"
        :fetch-patient-data="fetchPatientData"
        :fill-mock-data="fillMockDataForAllRecords"
        @prev-page="onPrevPage"
        @next-page="onNextPage"
        @select-record="selectRecord"
        @toggle-favorite="handleToggleFavorite"
        @delete-record="handleDeleteRecord"
        @open-add-modal="showAddModal"
        @edit-current-record="handleEditCurrentRecord"
        @refresh-data="fetchPatientData"
        @patch-examination-record="patchExaminationRecord"
      />
    </div>

      <!-- 新增检查记录的弹窗 -->
      <a-modal
        v-model:visible="addModalVisible"
        @cancel="handleAddModalCancel"
        :footer="null"
      >
        <template #title>
          <div
              style="display: flex; align-items: center;padding-bottom:16px;margin-bottom:16px;border-bottom: 1px solid rgba(0,0,0,0.1) ">
            <img-icon class="modal-icon" title="打印"/>
            <div class="modal-title">新增检查记录</div>
          </div>
        </template>
        <div style="margin-bottom: 16px;">
          <a-form>
            <div style="display: flex; gap: 36px;justify-content: center">
              <a-form-item>
                <template #label>
                  <span style="width: 100px;text-align-last: justify">请选择检查日期</span>
                </template>
                <a-date-picker
                    class="modal-input"
                    v-model:value="selectedDate"
                    style="width: 150px"
                    format="YYYY-MM-DD"
                    :locale="{
              lang: {
                locale: 'zh-cn',
                placeholder: '请选择日期',
                rangePlaceholder: ['开始日期', '结束日期'],
                today: '今天',
                now: '现在',
                backToToday: '返回今天',
                ok: '确定',
                clear: '清除',
                month: '月',
                year: '年',
                timeSelect: '选择时间',
                dateSelect: '选择日期',
                monthSelect: '选择月份',
                yearSelect: '选择年份',
                decadeSelect: '选择年代',
                yearFormat: 'YYYY年',
                dateFormat: 'YYYY-MM-DD',
                dayFormat: 'D日',
                dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
                monthFormat: 'YYYY-MM',
                monthBeforeYear: false,
                previousMonth: '上个月 (PageUp)',
                nextMonth: '下个月 (PageDown)',
                previousYear: '上一年 (Control + left)',
                nextYear: '下一年 (Control + right)',
                previousDecade: '上一年代',
                nextDecade: '下一年代',
                previousCentury: '上一世纪',
                nextCentury: '下一世纪',
              }
            }"
                >
                  <template #suffixIcon>
                    <img-icon title="日历" style="width: 20px; height: 16px; margin-right: 0"/>
                  </template>
                </a-date-picker>
              </a-form-item>
            </div>
            <div style="display: flex;justify-content: center">
              <a-button class="modal-btn modal-btn-plain" type="primary" @click="handleAddModalCancel" :disabled="isAddingExamination">Cancel</a-button>
              <a-button class="modal-btn" type="primary" @click="handleAddExamination" :loading="isAddingExamination" :disabled="isAddingExamination">OK</a-button>
            </div>
          </a-form>
        </div>
      </a-modal>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { defineAsyncComponent } from 'vue';
import { DeleteOutlined, CaretLeftOutlined, CaretRightOutlined, StarFilled, StarOutlined, EditOutlined, PlusOutlined, ReloadOutlined, DatabaseOutlined } from '@ant-design/icons-vue';
import { Modal, DatePicker, message } from 'ant-design-vue';
import ImgIcon from "./components/ImgIcon.vue";

// 设置dayjs为中文
dayjs.locale('zh-cn');

const props = defineProps({
  record: {
    type: Object,
    required: true
  }
});

const isLoading = ref(false);
const isFirstLoad = ref(false);
// 初始化 patientInfo，直接从 props.record 获取数据
const initPatientInfo = () => {
  return {
    ...(props.record?.patient || {}),
    // 直接从 record 获取 identifiers（患者编号）
    identifiers: props.record?.identifiers || props.record?.patient?.identifiers,
    // 直接从 record 获取 gkid（档案编号）
    gkid: props.record?.gkid || props.record?.patient?.gkid,
    // 保留其他字段
    name: props.record?.name || props.record?.patient?.name,
    gender: props.record?.gender || props.record?.patient?.gender,
    birthDate: props.record?.birthDate || props.record?.patient?.birthDate,
    phone: props.record?.phone || props.record?.patient?.phone
  };
};
const patientInfo = ref(initPatientInfo());
const examinationRecords = ref([]);
const selectedRecordId = ref(null);
const activeAction = ref(null);

/** 保存成功但列表接口可能未返回的字段（如调节灵敏度通过情况、诊疗方案 JSON），按记录 id 保留并在每次拉取列表后写回 */
const EXAM_OVERLAY_KEYS = [
  'accommodation_sensitivity_pass_right',
  'accommodation_sensitivity_pass_left',
  'accommodation_sensitivity_pass_both',
  'treatment_scheme_selection',
  // 相关检查诊断：综合验光仪
  'worth_4_type',
  'stereopsis_testing',
  'aniseikonia',
  'alternate_cover_test',
  // 相关检查诊断：四孔灯
  'check_distance_2m',
  'check_distance_40cm',
  'dominant_eye_color_2m',
  'dominant_eye_color_40cm',
  'horizontal_option_2m',
  'vertical_option_2m',
  'horizontal_option_40cm',
  'vertical_option_40cm',
  'value',
  'right_eye_suppression_type',
  'right_eye_suppression_distance',
  'right_eye_suppression_direction',
  'left_eye_suppression_type',
  'left_eye_suppression_distance',
  'left_eye_suppression_direction',
  'alternate_suppression_distance',
  'alternate_suppression_direction',
  // 相关检查诊断：同视机
  'synoptophore_grade_I',
  'synoptophore_grade_II',
  'synoptophore_grade_III',
  'synoptophore_level1_sign',
  'synoptophore_level1_value',
  'synoptophore_level2_positive',
  'synoptophore_level2_negative',
  'synoptophore_level3_stereo',
  'synoptophore_level3_value'
];
const examinationRecordOverlayById = ref({});

function pickExamOverlayFromRecord(rec) {
  if (!rec?.id) return null;
  const o = { id: rec.id };
  let any = false;
  EXAM_OVERLAY_KEYS.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(rec, k)) {
      o[k] = rec[k];
      any = true;
    }
  });
  return any ? o : null;
}

function mergeExaminationOverlaysIntoList() {
  const map = examinationRecordOverlayById.value;
  const ids = Object.keys(map);
  if (!ids.length || !examinationRecords.value.length) return;
  examinationRecords.value = examinationRecords.value.map((r) => {
    const extra = map[r.id];
    return extra ? { ...r, ...extra } : r;
  });
}

/** @param {Record<string, unknown>} savedRecord - PatientStyleTwo 保存成功后的 cleanedSaveData */
function patchExaminationRecord(savedRecord) {
  const overlay = pickExamOverlayFromRecord(savedRecord);
  if (!overlay) return;
  examinationRecordOverlayById.value = {
    ...examinationRecordOverlayById.value,
    [overlay.id]: { ...examinationRecordOverlayById.value[overlay.id], ...overlay }
  };
  mergeExaminationOverlaysIntoList();
}

// 监听 props.record 变化，更新 patientInfo
watch(() => props.record, (newRecord) => {
  console.log('[Patient.vue] watch 触发，newRecord:', newRecord);
  console.log('[Patient.vue] newRecord.identifiers:', newRecord?.identifiers);
  console.log('[Patient.vue] newRecord.patient?.identifiers:', newRecord?.patient?.identifiers);
  console.log('[Patient.vue] newRecord.gkid:', newRecord?.gkid);
  console.log('[Patient.vue] newRecord.patient?.gkid:', newRecord?.patient?.gkid);
  
  if (newRecord) {
    patientInfo.value = {
      ...(newRecord.patient || {}),
      identifiers: newRecord.identifiers || newRecord.patient?.identifiers,
      gkid: newRecord.gkid || newRecord.patient?.gkid,
      name: newRecord.name || newRecord.patient?.name,
      gender: newRecord.gender || newRecord.patient?.gender,
      birthDate: newRecord.birthDate || newRecord.patient?.birthDate,
      phone: newRecord.phone || newRecord.patient?.phone
    };
    console.log('[Patient.vue] 更新后的 patientInfo:', patientInfo.value);
    console.log('[Patient.vue] patientInfo.identifiers:', patientInfo.value.identifiers);
    console.log('[Patient.vue] patientInfo.gkid:', patientInfo.value.gkid);
  }
}, { immediate: true, deep: true });

watch(
  () => props.record?.patient_id ?? props.record?.id,
  () => {
    examinationRecordOverlayById.value = {};
  }
);

// 悬浮窗分页（已改为滚动显示所有记录）
const datePage = ref(1);
const pageSize = 5; // 保留用于兼容性，但不再使用分页
const datePages = computed(() => Math.ceil(examinationRecords.value.length / pageSize));
const sortedRecords = computed(() => {
  // 时间从近到早排列
  return [...examinationRecords.value].sort((a, b) => new Date(b.examination_date) - new Date(a.examination_date));
});
// 修改为返回所有记录，不再分页
const pagedDates = computed(() => {
  // 返回所有排序后的记录，不再进行分页切片
  return sortedRecords.value;
});

const isShowDatePanel = ref(true)

const handleShowDatePanel = () => {
  isShowDatePanel.value = !isShowDatePanel.value;
}

const currentRecord = computed(() => {
  if (!selectedRecordId.value) return {};
  return examinationRecords.value.find(item => item.id === selectedRecordId.value) || {};
});

const selectRecord = (id) => {
  selectedRecordId.value = id;
};

const calculateAge = (birthDate) => {
  if (!birthDate) return '-';
  const age = ((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)).toFixed(1);
  return age;
};

// 获取患者编号（从 identifiers[1] 提取数字部分）
const getPatientId = () => {
  if (patientInfo.value.identifiers && patientInfo.value.identifiers.length > 1) {
    const patientIdStr = patientInfo.value.identifiers[1];
    const match = patientIdStr ? patientIdStr.match(/\d+/) : null;
    return match ? match[0] : '-';
  }
  return '-';
};

// 获取档案编号（从 gkid 提取数字部分）
const getArchiveId = () => {
  if (patientInfo.value.gkid) {
    const match = patientInfo.value.gkid.match(/\d+/);
    return match ? match[0] : '-';
  }
  return '-';
};

// 修正storageKey定义
const storageKey = computed(() => `patient_${props.record.patient_id}`);

const fetchPatientData = async () => {
  activeAction.value = 'refresh';
  isLoading.value = true;
  try {
    // 直接从 props.record 获取患者信息，优先使用 record 本身的字段
    patientInfo.value = {
      ...(props.record.patient || {}),
      // 直接从 record 获取 identifiers（患者编号）
      identifiers: props.record.identifiers || props.record.patient?.identifiers,
      // 直接从 record 获取 gkid（档案编号）
      gkid: props.record.gkid || props.record.patient?.gkid,
      // 保留其他字段
      name: props.record.name || props.record.patient?.name,
      gender: props.record.gender || props.record.patient?.gender,
      birthDate: props.record.birthDate || props.record.patient?.birthDate,
      phone: props.record.phone || props.record.patient?.phone
    };
    const csrftoken = localStorage.getItem('csrftoken');
    console.log('发送请求，患者ID:', props.record.patient_id);

    // 保存当前选中的记录ID（用于刷新后保持选中状态）
    const currentSelectedId = selectedRecordId.value;

    const response = await fetch('https://aiforoptometry.com/medicalrecords/allrecords_patient_id_2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify({
        patient_id: props.record.patient_id
      }),
      credentials: 'include'
    });

    const recordsData = await response.json();
    console.log('从后端获取的检查记录数据:', recordsData);
    console.log('患者ID:', props.record.patient_id, '的所有检查记录:', recordsData.examination_records);
    
    // 调试：打印每条记录的垂直眼位字段
    if (recordsData.examination_records && Array.isArray(recordsData.examination_records)) {
      recordsData.examination_records.forEach((record, index) => {
        if (record.fusional_convergence_distance_vertical_direction || record.far_vertical_eye_direction || record.far_vertical_eye_break) {
          console.log(`[Patient] 检查记录[${index}] (ID: ${record.id}) - 5m垂直眼位字段:`, {
            fusional_convergence_distance_vertical_direction: record.fusional_convergence_distance_vertical_direction,
            far_vertical_eye_direction: record.far_vertical_eye_direction,
            far_vertical_eye_break: record.far_vertical_eye_break
          });
        } else if (record.id === 97606) {
          // 特别检查当前记录
          console.log(`[Patient] 检查记录[${index}] (ID: ${record.id}) - 5m垂直眼位字段为空:`, {
            fusional_convergence_distance_vertical_direction: record.fusional_convergence_distance_vertical_direction,
            far_vertical_eye_direction: record.far_vertical_eye_direction,
            far_vertical_eye_break: record.far_vertical_eye_break,
            '所有字段': Object.keys(record).filter(k => k.includes('vertical') || k.includes('垂直'))
          });
        }
      });
    }
    
    // 不从 API 响应更新 patientInfo，直接使用从患者列表传递的数据

    examinationRecords.value = recordsData.examination_records || [];
    mergeExaminationOverlaysIntoList();

    console.log('获取到的检查记录数量:', examinationRecords.value.length);
    console.log('检查记录数据:', examinationRecords.value);

    // 优先保持当前选中的记录，如果不存在则选中最新一条
    if (examinationRecords.value.length > 0) {
      if (currentSelectedId && examinationRecords.value.some(r => r.id === currentSelectedId)) {
        selectedRecordId.value = currentSelectedId;
        const index = sortedRecords.value.findIndex(record => record.id === currentSelectedId);
        datePage.value = Math.floor(index / pageSize) + 1;
        console.log('保持当前选中的记录:', currentSelectedId);
      } else {
        // 没有选中记录或原记录已被删除，默认选中最新一条
        const latest = sortedRecords.value[0];
        if (latest && latest.id) {
          selectedRecordId.value = latest.id;
          const index = sortedRecords.value.findIndex(record => record.id === latest.id);
          datePage.value = Math.floor(index / pageSize) + 1;
          console.log('选中最新的记录:', latest.id);
        } else {
          console.warn('没有找到有效的检查记录，sortedRecords:', sortedRecords.value);
        }
      }
    } else {
      console.warn('该患者没有检查记录');
      selectedRecordId.value = null;
    }

    // 缓存数据
    const patientData = {
      patientInfo: patientInfo.value,
      examinationRecords: examinationRecords.value,
      currentData: currentRecord.value, // 当前选中的记录
      allData: sortedRecords.value, // 所有检查记录（按时间排序）
      timestamp: Date.now()
    };
    sessionStorage.setItem(storageKey.value, JSON.stringify(patientData));
    console.log('更新sessionStorage缓存:', patientData);
  } catch (error) {
    console.error('获取患者数据失败:', error);
  } finally {
    isLoading.value = false;
    isFirstLoad.value = false;
    activeAction.value = null;
  }
};

const handleViewDetail = (record) => {
  console.log('查看检查详情:', record);
  // TODO: 实现查看检查详情的功能
};

// 组件挂载时
onMounted(() => {
  try {
    console.log('=== 患者主页组件开始挂载 ===');
  console.log('患者主页组件挂载，开始加载数据');
    console.log('当前患者ID:', props.record?.patient_id);
  isFirstLoad.value = true;

  // 尝试从 sessionStorage 获取数据
  const savedData = sessionStorage.getItem(storageKey.value);
    console.log('storageKey:', storageKey.value);
    console.log('savedData exists:', !!savedData);

  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
        console.log('从sessionStorage获取到的数据:', parsedData);
      // patientInfo 已经通过 watch 从 props.record 初始化，这里不需要重复设置
      // 但确保使用最新的 props.record 数据
      patientInfo.value = {
        ...patientInfo.value,
        ...(props.record?.patient || {}),
        identifiers: props.record?.identifiers || props.record?.patient?.identifiers || patientInfo.value.identifiers,
        gkid: props.record?.gkid || props.record?.patient?.gkid || patientInfo.value.gkid
      };
      console.log('[Patient.vue] 从缓存加载后的 patientInfo:', patientInfo.value);
      console.log('[Patient.vue] patientInfo.identifiers:', patientInfo.value.identifiers);
      examinationRecords.value = parsedData.examinationRecords;

      // 从缓存加载时也要选中最新记录
      if (examinationRecords.value.length > 0) {
        const latest = sortedRecords.value[0];
        selectedRecordId.value = latest.id;

        // 计算最新记录所在的页码
        const index = sortedRecords.value.findIndex(record => record.id === latest.id);
        datePage.value = Math.floor(index / pageSize) + 1;
      }

      isFirstLoad.value = false;
    } catch (error) {
      console.error('解析保存的数据失败:', error);
      fetchPatientData();
    }
  } else {
      console.log('没有找到缓存数据，开始获取新数据');
    fetchPatientData();
    }
  } catch (error) {
    console.error('组件挂载过程中发生错误:', error);
  }
});

// 组件卸载时清理数据
onUnmounted(() => {
  // 可以选择是否在组件卸载时删除数据
  // sessionStorage.removeItem(storageKey);
});

const onPrevPage = () => {
  if(datePage.value === 1){
    return
  }
  if (datePage.value > 1) datePage.value--;
};
const onNextPage = () => {
  if(datePage.value === datePages.value || datePages.value === 0){
    return
  }
  if (datePage.value < datePages.value) datePage.value++;
};

// 检查结果子组件（仅风格2）
const RoutineExamStyleTwo = defineAsyncComponent(() => import('./components/RoutineExamStyleTwo.vue'));
const FunctionalExamStyleTwo = defineAsyncComponent(() => import('./components/FunctionalExamStyleTwo.vue'));
const ImgExamStyleTwo = defineAsyncComponent(() => import('./components/ImgExamStyleTwo.vue'));
const BiometryExamStyleTwo = defineAsyncComponent(() => import('./components/BiometryExamStyleTwo.vue'));
const TreatmentPlan = defineAsyncComponent(() => import('./components/TreatmentPlan.vue'));
const VisionExam = defineAsyncComponent(() => import('./components/VisionExam.vue'));
const AnalysisExam = defineAsyncComponent(() => import('./components/AnalysisExam.vue'));
const PatientStyleTwo = defineAsyncComponent(() => import('./components/PatientStyleTwo.vue'));

// 风格2的标签页配置
const styleTwoSections = computed(() => {
  return [
    { key: 'routine', title: '基础检查', component: RoutineExamStyleTwo },
    { key: 'vision', title: '视力检查', component: RoutineExamStyleTwo },
    { key: 'biometry', title: '生物测量仪检查', component: BiometryExamStyleTwo },
    { key: 'objective-refraction', title: '电脑验光检查', component: RoutineExamStyleTwo },
    { key: 'subjective-refraction', title: '主觉验光检查', component: RoutineExamStyleTwo },
    { key: 'functional', title: '视功能检查', component: FunctionalExamStyleTwo },
    { key: 'img', title: '影像检查', component: ImgExamStyleTwo },
    { key: 'treatment', title: '诊疗方案', component: TreatmentPlan },
    { key: 'analysis', title: '结果分析', component: AnalysisExam }
  ];
});

/** 与当前选中检查相对应的上一条检查记录：早于当前日期且时间上紧邻的前一条（非泛指的「上一次」） */
const previousRecord = computed(() => {
  if (!examinationRecords.value.length) return null;

  // 获取当前选中的记录
  const currentRecord = examinationRecords.value.find(item => item.id === selectedRecordId.value) || {};
  if (!currentRecord || !currentRecord.examination_date) return null;

  // 获取当前记录的日期
  const currentDate = new Date(currentRecord.examination_date);

  // 找到所有早于当前日期的记录
  const earlierRecords = examinationRecords.value.filter(record => {
    const recordDate = new Date(record.examination_date);
    return recordDate < currentDate;
  });

  // 如果没有更早的记录，返回null
  if (earlierRecords.length === 0) return null;

  // 按日期从近到远排序，取第一条（与当前检查相邻的上一条）
  return earlierRecords.sort((a, b) =>
    new Date(b.examination_date) - new Date(a.examination_date)
  )[0];
});

// 监听选中记录变化
watch(selectedRecordId, (newId) => {
  console.log('当前选中的检查记录(currentData):', currentRecord.value);
  // 更新缓存中的当前记录
  const savedData = sessionStorage.getItem(storageKey.value);
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      parsedData.currentData = currentRecord.value;
      sessionStorage.setItem(storageKey.value, JSON.stringify(parsedData));
      console.log('更新缓存中的当前记录:', currentRecord.value);
    } catch (error) {
      console.error('更新缓存中的当前记录失败:', error);
    }
  }
}, { immediate: true });

// 日期格式化函数，兼容字符串、Date、dayjs对象
function formatDate(val) {
  if (!val) return '-';
  return dayjs(val).format('YYYY-MM-DD');
}

// 添加弹窗和日期的状态
const addModalVisible = ref(false);
const selectedDate = ref(dayjs());
const isAddingExamination = ref(false);

// PatientStyleTwo组件的引用
const patientStyleTwoRef = ref(null);

// 显示新增检查记录的弹窗
const showAddModal = () => {
  activeAction.value = 'add';
  selectedDate.value = dayjs();
  addModalVisible.value = true;
};

// 处理新增检查弹窗取消
const handleAddModalCancel = () => {
  addModalVisible.value = false;
  activeAction.value = null; // 清除父组件的按钮激活状态
  // 清除子组件的按钮激活状态
  if (patientStyleTwoRef.value && patientStyleTwoRef.value.clearActiveAction) {
    patientStyleTwoRef.value.clearActiveAction();
  }
};

// 编辑当前选中的检查记录
const handleEditCurrentRecord = () => {
  if (!currentRecord.value || !currentRecord.value.id) {
    message.warning('请先选择一条检查记录');
    activeAction.value = null;
    return;
  }
  
  // 检查是否已经在编辑状态
  if (patientStyleTwoRef.value) {
    const isEditing = patientStyleTwoRef.value.isEditing;
    const currentEditingId = patientStyleTwoRef.value.editingRecordId;
    
    if (isEditing && currentEditingId === currentRecord.value.id) {
      // 如果已经在编辑当前记录，则取消编辑
      if (patientStyleTwoRef.value.handleCancelEdit) {
        patientStyleTwoRef.value.handleCancelEdit();
        activeAction.value = null;
        message.info('已取消编辑模式');
      }
    } else {
      // 如果不在编辑状态，则进入编辑
      activeAction.value = 'edit';
      if (patientStyleTwoRef.value.handleEditRecord) {
        patientStyleTwoRef.value.handleEditRecord(currentRecord.value);
        message.success('已进入编辑模式，所有检查项目已展开');
      } else {
        message.warning('编辑功能暂不可用，请稍后重试');
        activeAction.value = null;
      }
    }
  }
};

// 生成虚拟数据
const generateMockData = () => {
  return {
    // 基础检查
    height: 150 + Math.floor(Math.random() * 30), // 150-180cm
    weight: 40 + Math.random() * 30, // 40-70kg
    right_intraocular_pressure: 10 + Math.random() * 11, // 10-21mmHg
    left_intraocular_pressure: 10 + Math.random() * 11,
    right_cct: 500 + Math.random() * 50, // 500-550μm
    left_cct: 500 + Math.random() * 50,
    
    // 视力检查 - 裸眼视力
    uva_right_vision: 0.1 + Math.random() * 0.9, // 0.1-1.0
    uva_left_vision: 0.1 + Math.random() * 0.9,
    uva_both_vision: 0.1 + Math.random() * 0.9,
    near_uva_right_vision: 0.3 + Math.random() * 0.7,
    near_uva_left_vision: 0.3 + Math.random() * 0.7,
    near_uva_both_vision: 0.3 + Math.random() * 0.7,
    
    // 视力检查 - 矫正视力
    right_eye_vision: 0.5 + Math.random() * 0.5, // 0.5-1.0
    left_eye_vision: 0.5 + Math.random() * 0.5,
    right_eye_old_vision: 0.4 + Math.random() * 0.6,
    left_eye_old_vision: 0.4 + Math.random() * 0.6,
    
    // 旧镜视力
    near_subjective_right_old_vision: 0.3 + Math.random() * 0.7,
    near_subjective_left_old_vision: 0.3 + Math.random() * 0.7,
    near_subjective_both_old_vision: 0.3 + Math.random() * 0.7,
    
    // 旧镜光度
    vaec_right_glasses_type: Math.random() > 0.5 ? '框架' : '隐形',
    vaec_left_glasses_type: Math.random() > 0.5 ? '框架' : '隐形',
    vaec_right_spherical: -6 + Math.random() * 4, // -6到-2
    vaec_right_cylindrical: -2 + Math.random() * 1, // -2到-1
    vaec_right_axis: Math.floor(Math.random() * 180), // 0-180
    vaec_left_spherical: -6 + Math.random() * 4,
    vaec_left_cylindrical: -2 + Math.random() * 1,
    vaec_left_axis: Math.floor(Math.random() * 180),
    vaec_both_pupil_distance: 55 + Math.random() * 10, // 55-65mm
    
    // 电脑验光检查 - 小瞳
    objective_right_spherical: -5 + Math.random() * 3, // -5到-2
    objective_right_cylindrical: -2 + Math.random() * 1, // -2到-1
    objective_right_axis: Math.floor(Math.random() * 180),
    objective_left_spherical: -5 + Math.random() * 3,
    objective_left_cylindrical: -2 + Math.random() * 1,
    objective_left_axis: Math.floor(Math.random() * 180),
    
    // 电脑验光检查 - 散瞳
    dilated_objective_right_spherical: -5.5 + Math.random() * 3,
    dilated_objective_right_cylindrical: -2 + Math.random() * 1,
    dilated_objective_right_axis: Math.floor(Math.random() * 180),
    dilated_objective_left_spherical: -5.5 + Math.random() * 3,
    dilated_objective_left_cylindrical: -2 + Math.random() * 1,
    dilated_objective_left_axis: Math.floor(Math.random() * 180),
    
    // 主觉验光检查
    subjective_right_spherical: -5 + Math.random() * 3,
    subjective_right_cylindrical: -2 + Math.random() * 1,
    subjective_right_axis: Math.floor(Math.random() * 180),
    subjective_left_spherical: -5 + Math.random() * 3,
    subjective_left_cylindrical: -2 + Math.random() * 1,
    subjective_left_axis: Math.floor(Math.random() * 180),
    
    // 配镜处方
    prescription_right_spherical: -4.5 + Math.random() * 3,
    prescription_right_cylindrical: -1.5 + Math.random() * 1,
    prescription_right_axis: Math.floor(Math.random() * 180),
    prescription_left_spherical: -4.5 + Math.random() * 3,
    prescription_left_cylindrical: -1.5 + Math.random() * 1,
    prescription_left_axis: Math.floor(Math.random() * 180),
    prescription_both_pupil_distance: 56 + Math.random() * 8,
    
    // 生物测量 - 眼轴长度
    right_eye_axial_length: 23 + Math.random() * 2, // 23-25mm
    left_eye_axial_length: 23 + Math.random() * 2,
    
    // 生物测量 - 角膜曲率
    right_k1: 42 + Math.random() * 2, // 42-44D
    right_k2: 43 + Math.random() * 2, // 43-45D
    right_astigmatism: 0.5 + Math.random() * 1, // 0.5-1.5D
    right_axis: Math.floor(Math.random() * 180),
    left_k1: 42 + Math.random() * 2,
    left_k2: 43 + Math.random() * 2,
    left_astigmatism: 0.5 + Math.random() * 1,
    left_axis: Math.floor(Math.random() * 180),
    
    // 眼位和聚散检查
    eye_position_distance: '正位',
    eye_position_near: '正位',
    convergence_amplitude: 15 + Math.random() * 10, // 15-25
    divergence_amplitude: 8 + Math.random() * 5, // 8-13
    
    // 调节检查
    accommodation_amplitude_right: 10 + Math.random() * 5, // 10-15D
    accommodation_amplitude_left: 10 + Math.random() * 5,
    accommodation_facility_right: 8 + Math.random() * 4, // 8-12cpm
    accommodation_facility_left: 8 + Math.random() * 4,
    
    // 其他相关检查
    stereopsis: 40 + Math.floor(Math.random() * 60), // 40-100秒
    color_vision: '正常',
    visual_field: '正常',
    
    // 同视机检查
    synoptophore_simultaneous_perception: '正常',
    synoptophore_fusion: '正常',
    synoptophore_stereopsis: '正常',
    
    // 备注
    remarks: '虚拟测试数据'
  };
};

// 为所有检查记录填充虚拟数据
const fillMockDataForAllRecords = async () => {
  if (!examinationRecords.value || examinationRecords.value.length === 0) {
    message.warning('没有检查记录可填充');
    return;
  }
  
  Modal.confirm({
    title: '确认填充虚拟数据',
    content: `将为 ${examinationRecords.value.length} 条检查记录填充虚拟数据，是否继续？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const csrftoken = localStorage.getItem('csrftoken');
      let successCount = 0;
      let failCount = 0;
      
      message.loading('正在填充虚拟数据...', 0);
      
      for (const record of examinationRecords.value) {
        try {
          const mockData = generateMockData();
          const patientId = record.patient_id || record.patient_id_id || props.record.patient_id;
          
          const saveData = {
            ...record,
            ...mockData,
            id: record.id,
            patient_id: patientId,
            examination_date: record.examination_date ? dayjs(record.examination_date).format('YYYY-MM-DD') : null,
          };
          
          const response = await fetch('https://aiforoptometry.com/medicalrecords/recordsedit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(saveData)
          });
          
          const result = await response.json();
          
          if (result.status_code === 200 || result.code === 200) {
            successCount++;
          } else {
            failCount++;
            console.error('保存失败:', record.id, result);
          }
        } catch (error) {
          failCount++;
          console.error('保存出错:', record.id, error);
        }
      }
      
      message.destroy();
      
      if (successCount > 0) {
        message.success(`成功填充 ${successCount} 条记录${failCount > 0 ? `，失败 ${failCount} 条` : ''}`);
        // 刷新数据
        await fetchPatientData();
      } else {
        message.error('填充失败，请检查网络连接');
      }
    }
  });
};

// 修改新增检查记录的处理函数
const handleAddExamination = async () => {
  if (!selectedDate.value) {
    Modal.error({
      title: '错误',
      content: '请选择检查日期',
    });
    return;
  }

  // 防止重复点击
  if (isAddingExamination.value) {
    return;
  }

  isAddingExamination.value = true;

  try {
    const csrftoken = localStorage.getItem('csrftoken');
    const response = await fetch('https://aiforoptometry.com/medicalrecords/initialnewrecord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify({
        organization_id: localStorage.getItem('organization_id'),
        patient_id: props.record.patient_id,
        examination_date: selectedDate.value.format('YYYY-MM-DD')
      }),
      credentials: 'include'
    });

    if (response.ok) {
      // 创建成功后刷新数据
      await fetchPatientData();
      addModalVisible.value = false;
      activeAction.value = null; // 清除父组件的按钮激活状态
      // 清除子组件的按钮激活状态
      if (patientStyleTwoRef.value && patientStyleTwoRef.value.clearActiveAction) {
        patientStyleTwoRef.value.clearActiveAction();
      }
      Modal.success({
        title: '创建成功',
        content: '新的检查记录已创建',
      });
    } else {
      // 获取错误响应数据
      const errorData = await response.json();
      
      // 特殊处理 409 状态码（冲突错误）
      if (response.status === 409) {
        Modal.warning({
          title: '提示',
          content: errorData.message || '该日期检查记录已存在',
        });
        return;
      }
      
      // 其他错误
      throw new Error(errorData.message || errorData.error || '创建失败');
    }
  } catch (error) {
    console.error('创建检查记录失败:', error);
    Modal.error({
      title: '创建失败',
      content: error.message || '创建检查记录时发生错误，请稍后重试',
    });
  } finally {
    // 无论成功还是失败，都要重置状态
    isAddingExamination.value = false;
  }
};

// 判断记录是否被收藏（通过备注中的【已收藏】标记）
const isRecordFavorited = (record) => {
  if (!record || !record.remarks) return false;
  return record.remarks.includes('【已收藏】');
};

// 切换收藏状态
const handleToggleFavorite = async (record) => {
  if (!record) return;
  
  try {
    const isFavorited = isRecordFavorited(record);
    const currentRemarks = record.remarks || '';
    let newRemarks = '';
    
    if (isFavorited) {
      // 取消收藏：删除【已收藏】标记
      newRemarks = currentRemarks.replace(/\n?【已收藏】/g, '').trim();
      console.log('取消收藏，原备注:', currentRemarks, '新备注:', newRemarks);
    } else {
      // 添加收藏：在备注末尾添加【已收藏】
      if (currentRemarks.trim()) {
        newRemarks = currentRemarks.trim() + '\n【已收藏】';
      } else {
        newRemarks = '【已收藏】';
      }
      console.log('添加收藏，原备注:', currentRemarks, '新备注:', newRemarks);
    }
    
    // 调用后端API保存备注
    const csrftoken = localStorage.getItem('csrftoken');
    const response = await fetch('https://aiforoptometry.com/medicalrecords/recordsedit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify({
        id: record.id,
        patient_id: record.patient_id_id || record.patient_id,
        remarks: newRemarks
      }),
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.status_code === 200) {
        // 更新本地数据
        record.remarks = newRemarks;
        
        // 同步更新 sessionStorage
        const storageKey = `patient_${props.record.patient_id}`;
        const savedData = sessionStorage.getItem(storageKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          
          // 更新所有数据源中的该记录
          const updateRecordInArray = (arr) => {
            const idx = arr?.findIndex(item => item.id === record.id);
            if (idx !== -1 && arr[idx]) {
              arr[idx].remarks = newRemarks;
            }
          };
          
          updateRecordInArray(parsed.examinationRecords);
          updateRecordInArray(parsed.allData);
          if (parsed.currentData?.id === record.id) {
            parsed.currentData.remarks = newRemarks;
          }
          
          sessionStorage.setItem(storageKey, JSON.stringify(parsed));
        }
        
        // 显示提示
        message.success(isFavorited ? '已取消收藏' : '已添加收藏');
      } else {
        throw new Error(data.msg || '操作失败');
      }
    } else {
      throw new Error('网络请求失败');
    }
  } catch (error) {
    console.error('切换收藏状态失败:', error);
    message.error('操作失败: ' + error.message);
  }
};

// 修改删除记录的处理函数
const handleDeleteRecord = async (recordId) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条检查记录吗？此操作不可恢复。',
    okText: '确认',
    cancelText: '取消',
    okType: 'danger',
    async onOk() {
      try {
        const csrftoken = localStorage.getItem('csrftoken');
        const response = await fetch('https://aiforoptometry.com/medicalrecords/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify({
            patient_id: props.record.patient_id,
            records_id: recordId
          }),
          credentials: 'include'
        });

        if (response.status === 204) {
          // 删除成功后刷新数据
          await fetchPatientData();
          // 如果删除的是当前选中的记录，重置选中状态
          if (selectedRecordId.value === recordId) {
            selectedRecordId.value = null;
          }
          // 显示成功提示
          Modal.success({
            title: '删除成功',
            content: '检查记录已成功删除',
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || '删除失败');
        }
      } catch (error) {
        console.error('删除检查记录失败:', error);
        // 显示错误提示
        Modal.error({
          title: '删除失败',
          content: error.message || '删除检查记录时发生错误，请稍后重试',
        });
      }
    },
  });
};
</script>

<style scoped lang="scss">
/* 最外层：与 main 可见视窗一致，下缘不超出 */
.patient-constraint {
  height: calc(100vh - 280px);
  max-height: calc(100vh - 280px);
  min-height: 360px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.patient-spin-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* 保证高度能传递到内部，避免子级 100% 取到 0 */
  height: 100%;
}

.patient-spin-wrapper :deep(.ant-spin-nested-loading),
.patient-spin-wrapper :deep(.ant-spin-container) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.patient-page-root {
  width: 100%;
  max-width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.header-container {
  margin-bottom: 20px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(226, 114, 68, 0.1);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.patient-name-section {
  flex: 1;
}

.patient-info-row {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: nowrap;
  font-size: 15px;
  margin-bottom: 0;
}

.patient-id-row {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: nowrap;
  font-size: 15px;
  margin-top: 0;
}

.info-item {
  display: flex;
  align-items: baseline;
  color: #4a5568;
  white-space: nowrap;
  line-height: 1.5;
}

.info-item .info-label {
  color: #718096;
  margin-right: 8px;
  font-weight: 400;
  font-size: 15px;
  line-height: 1.5;
  vertical-align: baseline;
}

.info-item .info-value {
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 15px;
  line-height: 1.5;
  vertical-align: baseline;
}

.info-item .gender-icon {
  width: 20px;
  height: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.circular-button-group {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f5f7fa;
  padding: 8px;
  border-radius: 50px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.circular-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 20px;
  border: 2px solid transparent;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.circular-btn:hover {
  background: #e2e8f0;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.circular-btn.active {
  background: linear-gradient(135deg, #E27244 0%, #E29D44 100%);
  color: #ffffff;
  border-color: #E27244;
  box-shadow: 0 4px 12px rgba(226, 114, 68, 0.4);
  transform: scale(1.1);
}

.action-group {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.primary-btn {
  background: linear-gradient(-90deg, #E27244 0%, #E29D44 100%);
  border: none;
  color: #fff;
  
  &:hover {
    background: linear-gradient(-90deg, #d16234 0%, #d28d34 100%);
    color: #fff;
  }
}

.secondary-btn {
  background: #f5f7fa;
  border: 1px solid #e2e8f0;
  color: #4a5568;
  
  &:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
    color: #2d3748;
  }
}

.header-bottom {
  margin-top: 20px;
}

.patient-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-card {
  padding: 16px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #E27244;
    box-shadow: 0 2px 8px rgba(226, 114, 68, 0.1);
    transform: translateY(-2px);
  }
}

.info-label {
  font-size: 12px;
  color: #718096;
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 16px;
  color: #2d3748;
  font-weight: 600;
}

.gender-icon {
  width: 18px;
  height: 18px;
}

// 响应式设计
@media (max-width: 1200px) {
  .header-top {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 16px;
  }
  
  .patient-name {
    font-size: 24px;
  }
  
  .patient-info-grid {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
    
    .action-btn {
      width: 100%;
      justify-content: center;
    }
  }
}

.floating-date-panel {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1001;

  .floating-icon{
    width: 18px;
    height: 18px;
    background: #f0f4fc;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    left: -10px;
    top: 16px;
    z-index: 2;
  }
}
.date-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 200px;
  max-height: 240px;
  overflow: visible;
}
.info-margin-right {
  margin-right: 60px; /* 让出悬浮窗空间，宽度可根据悬浮窗实际宽度微调 */
}
.custom-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 8px;

  .page-icon {
    width: 20px;
    height: 20px;
  }
}

.date-button-wrapper {
  position: relative;
  width: 100%;
  margin: 2px 0;
}

.date-item-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 2px;
  width: 100%;
  padding: 0 4px;
}

.star-button {
  padding: 0 !important;
  width: 18px !important;
  height: 18px !important;
  min-width: 18px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s;
  border: none !important;
  
  &:hover {
    transform: scale(1.15);
    background: transparent !important;
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.date-button {
  flex: 1;
  min-width: 0;
  height: 28px;
  font-size: 13px;
  padding: 0 8px !important;
}

.delete-button {
  padding: 0 !important;
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.3s;
  border: none !important;
  
  &:hover {
    background: #fff1f0 !important;
  }
}

.date-item-container:hover .delete-button {
  opacity: 1;
}

.gender-icon {
  width: 20px;
  height: 20px;
}

.result-icon {
  width: 35px;
  height: 35px;
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

.modal-icon {
  width: 34px;
  height: 34px;
}

.modal-title {
  font-weight: 500;
  font-size: 22px;
  color: #000714;
}

.modal-input {
  background: #FFFFFF;
  border-radius: 8px 8px 8px 8px;
  border: 1px solid #E27244;
}

.modal-btn {
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


.modal-btn-plain {
  background: #FFFFFF;
  border-radius: 10px 10px 10px 10px;
  border: 1px solid #E27244;
  color: #E27244;
  margin-right: 32px;
}

.modal-btn-plain:hover {
  background: #FFFFFF !important;
  color: #E27244 !important;
}
</style>
