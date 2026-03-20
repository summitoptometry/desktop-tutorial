<template>
  <div class="functional-exam">
    <Teleport defer to="#functional-btn-group2">
      <div style="text-align: right; margin-bottom: 16px;display: flex;justify-content: right">
        <a-button class="header-btn" v-if="isEditMode" type="primary" @click="handleSave" style="margin-right: 8px;">保存</a-button>
        <a-button class="header-btn" v-if="isEditMode" type="primary" @click="handleCancel">取消</a-button>
        <a-button class="header-btn" v-if="!isEditMode" type="primary" @click="isEditMode = true">编辑</a-button>
      </div>
    </Teleport>
    <div class="exam-content">
      <div v-if="!record">暂无检查数据</div>
      <div v-else>
        <div :class="['func-exam-dual', { 'vertical-mode': props.isDualScreen }]">
          <!-- 远距离检查 -->
          <div class="func-exam-col">
            <div class="func-exam-col-bg">
              <div class="func-table-header">
                <div class="func-table-col item">远距离检查项目</div>
                <div class="func-table-col result">检查结果</div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item"><span class="icon">👁️</span> Worth 4点</div>
                <div class="func-table-col result">
                  <a-select v-if="isEditMode" v-model:value="form.worth_4_type" :options="worth4Options" style="width: 120px" />
                  <span v-else>{{ worth4Options.find(o => o.value === form.worth_4_type)?.label || '' }}</span>
                </div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item"><span class="icon">👁️</span> 不等像视</div>
                <div class="func-table-col result">
                  <a-select v-if="isEditMode"
                            :value="getAniseikoniaDisplayValue(form.aniseikonia)"
                            :options="aniseikoniaDisplayOptions"
                            style="width: 120px"
                            @change="val => isEditMode && (form.aniseikonia = setAniseikoniaValue(val))"
                  />
                  <span v-else>{{ aniseikoniaDisplayOptions.find(o => o.value === getAniseikoniaDisplayValue(form.aniseikonia))?.label || '' }}</span>
                </div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item"><span class="icon">⌨️</span> 立体视</div>
                                  <div class="func-table-col result">
                    <a-select v-if="isEditMode" v-model:value="form.stereopsis_testing" :options="stereopsisOptions" style="width: 120px" :max-tag-count="10" />
                    <span v-else>{{ getStereopsisLabel(form.stereopsis_testing) }}</span>
                  </div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item"><span class="icon">📷</span> 眼位（△）</div>
                <div class="func-table-col result eye-pos-group">
                  <a-select v-if="isEditMode" v-model:value="farEyeDirection" :options="eyePositionDirectionOptions" style="width: 80px" />
                  <span v-else>{{ farEyeDirection }}</span>
                  <a-input v-if="isEditMode" v-model:value="farEyeValue" :readonly="!isEditMode" :disabled="false" style="width: 80px; margin: 0 8px;" placeholder="输入数值" />
                  <span v-else style="width: 80px; margin: 0 8px; display: inline-block;">{{ farEyeValue }}</span>
                </div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item">✚ 散开BI（△）</div>
                <div class="func-table-col result">
                  <span class="input-label">模糊点</span>
                  <a-input v-if="isEditMode" v-model:value="form.fusional_disvergence_distance_blur" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="模糊点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.fusional_disvergence_distance_blur }}</span>
                  <span class="input-label">破裂点</span>
                  <a-input v-if="isEditMode" v-model:value="form.fusional_disvergence_distance_break" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="破裂点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.fusional_disvergence_distance_break }}</span>
                  <span class="input-label">恢复点</span>
                  <a-input v-if="isEditMode" v-model:value="form.fusional_disvergence_distance_recovery" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="恢复点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.fusional_disvergence_distance_recovery }}</span>
                </div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item">↩ 集合BO（△）</div>
                <div class="func-table-col result">
                  <span class="input-label">模糊点</span>
                  <a-input v-if="isEditMode" :value="form.fusional_convergence_distance_blur" @input="e => isEditMode && handleBOInput('fusional_convergence_distance_blur', e)" @blur="() => isEditMode && handleBOBlur('fusional_convergence_distance_blur')" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="模糊点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.fusional_convergence_distance_blur }}</span>
                  <span class="input-label">破裂点</span>
                  <a-input v-if="isEditMode" :value="form.fusional_convergence_distance_break" @input="e => isEditMode && handleBOInput('fusional_convergence_distance_break', e)" @blur="() => isEditMode && handleBOBlur('fusional_convergence_distance_break')" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="破裂点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.fusional_convergence_distance_break }}</span>
                  <span class="input-label">恢复点</span>
                  <a-input v-if="isEditMode" :value="form.fusional_convergence_distance_recovery" @input="e => isEditMode && handleBOInput('fusional_convergence_distance_recovery', e)" @blur="() => isEditMode && handleBOBlur('fusional_convergence_distance_recovery')" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="恢复点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.fusional_convergence_distance_recovery }}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 近距离检查 -->
          <div class="func-exam-col">
            <div class="func-exam-col-bg">
              <div class="func-table-header">
                <div class="func-table-col item">近距离检查项目</div>
                <div class="func-table-col result">检查结果</div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item"><span class="icon">📷</span> 眼位（△）</div>
                <div class="func-table-col result eye-pos-group">
                  <a-select v-if="isEditMode" v-model:value="nearEyeDirection" :options="eyePositionDirectionOptions" style="width: 80px" />
                  <span v-else>{{ nearEyeDirection }}</span>
                  <a-input v-if="isEditMode" v-model:value="nearEyeValue" :readonly="!isEditMode" :disabled="false" style="width: 80px; margin: 0 8px;" placeholder="输入数值" />
                  <span v-else style="width: 80px; margin: 0 8px; display: inline-block;">{{ nearEyeValue }}</span>
                </div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item">✚ 散开BI（△）</div>
                <div class="func-table-col result">
                  <span class="input-label">模糊点</span>
                  <a-input v-if="isEditMode" v-model:value="form.fusional_disvergence_near_blur" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="模糊点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.fusional_disvergence_near_blur }}</span>
                  <span class="input-label">破裂点</span>
                  <a-input v-if="isEditMode" v-model:value="form.fusional_disvergence_near_break" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="破裂点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.fusional_disvergence_near_break }}</span>
                  <span class="input-label">恢复点</span>
                  <a-input v-if="isEditMode" v-model:value="form.fusional_disvergence_near_recovery" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="恢复点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.fusional_disvergence_near_recovery }}</span>
                </div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item">↩ 集合BO（△）</div>
                <div class="func-table-col result">
                  <span class="input-label">模糊点</span>
                  <a-input v-if="isEditMode" :value="form.fusional_convergence_near_blur" @input="e => isEditMode && handleBOInput('fusional_convergence_near_blur', e)" @blur="() => isEditMode && handleBOBlur('fusional_convergence_near_blur')" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="模糊点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.fusional_convergence_near_blur }}</span>
                  <span class="input-label">破裂点</span>
                  <a-input v-if="isEditMode" :value="form.fusional_convergence_near_break" @input="e => isEditMode && handleBOInput('fusional_convergence_near_break', e)" @blur="() => isEditMode && handleBOBlur('fusional_convergence_near_break')" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="破裂点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.fusional_convergence_near_break }}</span>
                  <span class="input-label">恢复点</span>
                  <a-input v-if="isEditMode" :value="form.fusional_convergence_near_recovery" @input="e => isEditMode && handleBOInput('fusional_convergence_near_recovery', e)" @blur="() => isEditMode && handleBOBlur('fusional_convergence_near_recovery')" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="恢复点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.fusional_convergence_near_recovery }}</span>
                </div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item">↩ 集合近点（cm）</div>
                <div class="func-table-col result">
                  <a-input v-if="isEditMode" v-model:value="form.near_point_of_convergence_distance" :readonly="!isEditMode" :disabled="false" style="width: 80px; margin-right: 8px;" placeholder="输入数值" />
                  <span v-else style="width: 80px; margin-right: 8px; display: inline-block;">{{ form.near_point_of_convergence_distance }}</span>
                </div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item">👁️ 正相对调节（D）</div>
                <div class="func-table-col result">
                  <span class="input-label">模糊点</span>
                  <a-input v-if="isEditMode" v-model:value="form.positive_relative_accommodation_blur" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="模糊点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.positive_relative_accommodation_blur }}</span>
                  <span class="input-label">恢复点</span>
                  <a-input v-if="isEditMode" v-model:value="form.positive_relative_accommodation_recovery" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="恢复点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.positive_relative_accommodation_recovery }}</span>
                </div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item">👁️ 负相对调节（D）</div>
                <div class="func-table-col result">
                  <span class="input-label">模糊点</span>
                  <a-input v-if="isEditMode" v-model:value="form.negative_relative_accommodation_blur" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="模糊点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.negative_relative_accommodation_blur }}</span>
                  <span class="input-label">恢复点</span>
                  <a-input v-if="isEditMode" v-model:value="form.negative_relative_accommodation_recovery" :readonly="!isEditMode" :disabled="false" style="width: 72px; margin-right: 8px;" placeholder="恢复点" />
                  <span v-else style="width: 72px; margin-right: 8px; display: inline-block;">{{ form.negative_relative_accommodation_recovery }}</span>
                </div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item">👁️ 调节幅度（D）</div>
                <div class="func-table-col result">
                  <span class="input-label">右眼</span>
                  <a-input v-if="isEditMode" v-model:value="form.accommodative_amplitude_right" :readonly="!isEditMode" :disabled="false" style="width: 60px; margin-right: 4px;" placeholder="右眼" />
                  <span v-else style="width: 60px; margin-right: 4px; display: inline-block;">{{ form.accommodative_amplitude_right }}</span>
                  <span class="input-label">左眼</span>
                  <a-input v-if="isEditMode" v-model:value="form.accommodative_amplitude_left" :readonly="!isEditMode" :disabled="false" style="width: 60px; margin: 0 4px;" placeholder="左眼" />
                  <span v-else style="width: 60px; margin: 0 4px; display: inline-block;">{{ form.accommodative_amplitude_left }}</span>
                  <span class="input-label">双眼</span>
                  <a-input v-if="isEditMode" v-model:value="form.accommodative_amplitude_both" :readonly="!isEditMode" :disabled="false" style="width: 60px; margin: 0 4px;" placeholder="双眼" />
                  <span v-else style="width: 60px; margin: 0 4px; display: inline-block;">{{ form.accommodative_amplitude_both }}</span>
                  <span class="input-label">选择方法</span>
                  <a-select v-if="isEditMode" v-model:value="form.accommodation_amplitude_style" :options="amplitudeStyleOptions" style="width: 100px; margin-left: 8px;" placeholder="选择方法" />
                  <span v-else style="width: 100px; margin-left: 8px; display: inline-block;">{{ amplitudeStyleOptions.find(o => o.value === form.accommodation_amplitude_style)?.label || '' }}</span>
                </div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item">👁️ 调节灵敏度（cpm）</div>
                <div class="func-table-col result">
                  <span class="input-label">右眼</span>
                  <a-input v-if="isEditMode" v-model:value="form.accommodation_sensitivity_right" :readonly="!isEditMode" :disabled="false" style="width: 60px; margin-right: 4px;" placeholder="右眼" />
                  <span v-else style="width: 60px; margin-right: 4px; display: inline-block;">{{ form.accommodation_sensitivity_right }}</span>
                  <span class="input-label">左眼</span>
                  <a-input v-if="isEditMode" v-model:value="form.accommodation_sensitivity_left" :readonly="!isEditMode" :disabled="false" style="width: 60px; margin: 0 4px;" placeholder="左眼" />
                  <span v-else style="width: 60px; margin: 0 4px; display: inline-block;">{{ form.accommodation_sensitivity_left }}</span>
                  <span class="input-label">双眼</span>
                  <a-input v-if="isEditMode" v-model:value="form.accommodation_sensitivity_both" :readonly="!isEditMode" :disabled="false" style="width: 60px; margin: 0 4px;" placeholder="双眼" />
                  <span v-else style="width: 60px; margin: 0 4px; display: inline-block;">{{ form.accommodation_sensitivity_both }}</span>
                </div>
              </div>
              <div class="func-table-row">
                <div class="func-table-col item">👁️ 调节反应（D）</div>
                <div class="func-table-col result">
                  <span class="input-label">右眼</span>
                  <a-input v-if="isEditMode" v-model:value="form.fused_cross_cylinder_right" :readonly="!isEditMode" :disabled="false" style="width: 60px; margin-right: 4px;" placeholder="右眼" />
                  <span v-else style="width: 60px; margin-right: 4px; display: inline-block;">{{ form.fused_cross_cylinder_right }}</span>
                  <span class="input-label">左眼</span>
                  <a-input v-if="isEditMode" v-model:value="form.fused_cross_cylinder_left" :readonly="!isEditMode" :disabled="false" style="width: 60px; margin: 0 4px;" placeholder="左眼" />
                  <span v-else style="width: 60px; margin: 0 4px; display: inline-block;">{{ form.fused_cross_cylinder_left }}</span>
                  <span class="input-label">双眼</span>
                  <a-input v-if="isEditMode" v-model:value="form.fused_cross_cylinder_both" :readonly="!isEditMode" :disabled="false" style="width: 60px; margin: 0 4px;" placeholder="双眼" />
                  <span v-else style="width: 60px; margin: 0 4px; display: inline-block;">{{ form.fused_cross_cylinder_both }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 调试信息区 -->
    <div v-if="false" style="margin-top: 24px; background: #f6f6f6; border-radius: 8px; padding: 12px; font-size: 14px;">
      <b>【调试信息】</b>
      <div>远距离眼位 direction: {{ farEyeDirection }} | value: {{ farEyeValue }}</div>
      <div>近距离眼位 direction: {{ nearEyeDirection }} | value: {{ nearEyeValue }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { message } from 'ant-design-vue';
const emit = defineEmits(['refresh']);
const isEditMode = ref(false);
const originalRecord = ref({});
const props = defineProps({
  record: {
    type: Object,
    default: () => ({})
  },
  isDualScreen: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: [String, Number],
    default: null
  }
});
// 修正form为响应式computed，保证永远为对象
const form = computed(() => props.record || {});

// 输出表单数据
const logFormData = () => {
  console.group('视功能检查数据');
  console.log('远距离眼位:', {
    外隐斜字段值: form.value.pli_exo_distance_lateral_phoria,
    内隐斜字段值: form.value.plo_eso_distance_lateral_phoria,
    最终展示: farEyeDirection.value,
    展示数值: farEyeValue
  });
  console.log('近距离眼位:', {
    外隐斜字段值: form.value.pli_exo_near_lateral_phoria,
    内隐斜字段值: form.value.plo_eso_near_lateral_phoria,
    最终展示: nearEyeDirection,
    展示数值: nearEyeValue
  });
  console.groupEnd();
};

// 监听表单数据变化
watch(form, () => {
  console.log('表单数据已更新');
  logFormData();
}, { deep: true });

// 组件挂载时输出初始数据
onMounted(() => {
  console.log('视功能检查组件已挂载');
  logFormData();
  if (!form.value) return;
  [
    'fusional_convergence_distance_blur', 'fusional_convergence_distance_break', 'fusional_convergence_distance_recovery',
    'fusional_convergence_near_blur', 'fusional_convergence_near_break', 'fusional_convergence_near_recovery'
  ].forEach(key => {
    if (form.value && key in form.value) {
      form.value[key] = normalizePlus(form.value[key]);
    }
  });
});
watch(() => props.record, (val) => {
  if (!val) return;
  [
    'fusional_convergence_distance_blur', 'fusional_convergence_distance_break', 'fusional_convergence_distance_recovery',
    'fusional_convergence_near_blur', 'fusional_convergence_near_break', 'fusional_convergence_near_recovery',
    'pli_exo_near_lateral_phoria', 'plo_eso_near_lateral_phoria'
  ].forEach(key => {
    if (val && key in val) {
      form.value[key] = normalizePlus(val[key]);
    }
  });
}, { immediate: true, deep: true });

// 不等像视映射逻辑
const aniseikoniaDisplayOptions = [
  { label: '相等', value: 'OK' },
  { label: '不等', value: 'NO' },
  { label: '未测', value: null },
];
function getAniseikoniaDisplayValue(val) {
  if (val === 'OK') return 'OK';
  if (val === 'NO') return 'NO';
  return null;
}
function setAniseikoniaValue(val) {
  if (val === 'OK') return 'OK';
  if (val === 'NO') return 'NO';
  return null;
}

// 立体视选项 - 修改为使用纯数字值
const stereopsisOptions = [
  { label: "1'", value: 1 },
  { label: "2'", value: 2 },
  { label: "4'", value: 4 },
  { label: "10'", value: 10 },
  { label: 'NG', value: 'NG' },
  { label: '未测', value: null },
  { label: "800″", value: 800 },
  { label: "600″", value: 600 },
  { label: "400″", value: 400 },
  { label: "200″", value: 200 },
  { label: "100″", value: 100 },
  { label: "80″", value: 80 },
  { label: "60″", value: 60 },
  { label: "40″", value: 40 },
];

// 立体视显示函数 - 修改为处理数字格式的显示
function getStereopsisLabel(value) {
  if (value === null || value === undefined || value === '') return '未测';
  
  // 处理数字格式（包括带小数点的数字）
  if (typeof value === 'number') {
    // 处理带小数点的数字格式（如 800.00）
    if (value === 800 || value === 800.00) return "800″";
    if (value === 600 || value === 600.00) return "600″";
    if (value === 400 || value === 400.00) return "400″";
    if (value === 200 || value === 200.00) return "200″";
    if (value === 100 || value === 100.00) return "100″";
    if (value === 80 || value === 80.00) return "80″";
    if (value === 60 || value === 60.00) return "60″";
    if (value === 40 || value === 40.00) return "40″";
    
    // 处理带小数点的单引号格式
    if (value === 1 || value === 1.00) return "1'";
    if (value === 2 || value === 2.00) return "2'";
    if (value === 4 || value === 4.00) return "4'";
    if (value === 10 || value === 10.00) return "10'";
  }
  
  // 处理字符串格式
  if (typeof value === 'string') {
    if (value === 'NG') return 'NG';
    
    // 处理字符串数字格式（如 "800.00"）
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      if (numValue === 800) return "800″";
      if (numValue === 600) return "600″";
      if (numValue === 400) return "400″";
      if (numValue === 200) return "200″";
      if (numValue === 100) return "100″";
      if (numValue === 80) return "80″";
      if (numValue === 60) return "60″";
      if (numValue === 40) return "40″";
      if (numValue === 1) return "1'";
      if (numValue === 2) return "2'";
      if (numValue === 4) return "4'";
      if (numValue === 10) return "10'";
    }
    
    // 其他字符串格式保持不变
    return value;
  }
  
  return '未测';
}

// Worth 4点选项
const worth4Options = [
  { label: '4', value: '4' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '5', value: '5' },
  { label: 'NG', value: 'NG' },
];

const eyePositionOptions = [
  { label: '正', value: '正' },
  { label: '外斜', value: '外斜' },
  { label: '内斜', value: '内斜' },
  { label: '上斜', value: '上斜' },
  { label: '下斜', value: '下斜' },
];
const diplopiaTypeOptions = [
  { label: '未分离', value: '未分离' },
  { label: '棱镜分离', value: '棱镜分离' },
];
const cpmOptions = [
  { label: 'cpm', value: 'cpm' },
];
const sensitivityMethodOptions = [
  { label: '选择方法', value: '选择方法' },
];
const sensitivityVisionOptions = [
  { label: '选择视标', value: '选择视标' },
];

// 调节幅度方法选项
const amplitudeStyleOptions = [
  { label: '负镜片法', value: '负镜片法' },
  { label: '推近法', value: '推近法' },
  { label: '拉远法', value: '拉远法' },
  { label: '未测', value: '未测' },
];

// 集合BO输入自动加正号（正数加+，负数不变，空值不处理）
function normalizePlus(val) {
  if (val === null || val === undefined || val === '') return '';
  const num = Number(val);
  if (isNaN(num)) return val;
  if (num > 0) return `+${num.toFixed(2)}`;
  if (num < 0) return num.toFixed(2);
  return '0.00';
}

function handleBOInput(field, e) {
  const raw = e.target.value;
  // 允许用户输入负号和小数点
  if (/^-?\d*(\.\d*)?$/.test(raw) || raw === '' || raw === '-') {
    form.value[field] = raw;
  }
}

function handleBOBlur(field) {
  form.value[field] = normalizePlus(form.value[field]);
}

// 眼位方向选项
const eyePositionDirectionOptions = [
  { label: '正', value: '正' },
  { label: '外', value: '外' },
  { label: '内', value: '内' },
  { label: '未测', value: '未测' },
];

// 工具函数，兼容字符串和数字
function isEmpty(v) {
  return v === null || v === '' || typeof v === 'undefined';
}
function isZero(v) {
  return !isEmpty(v) && Number(v) === 0;
}

// 工具函数，处理眼位值的格式化
function formatEyePositionValue(value, direction) {
  if (!value) return '';
  // 移除可能存在的正负号，只保留数字部分
  const num = value.toString().replace(/^[+\-]/, '');
  // 根据方向添加符号
  if (direction === '外') return `-${num}`;
  if (direction === '内') return `+${num}`;
  return num;
}

// 工具函数，解析眼位值
function parseEyePositionValue(value) {
  if (!value) return { direction: '正', value: '' };
  const str = value.toString();
  if (str.startsWith('-')) return { direction: '外', value: str.substring(1) };
  if (str.startsWith('+')) return { direction: '内', value: str.substring(1) };
  return { direction: '正', value: str };
}

// 工具函数，处理眼位值的输入
function handleEyePositionInput(value, direction) {
  if (!value) return null;
  // 移除所有正负号，只保留数字部分，保持原始小数位数
  const num = value.toString().replace(/^[+\-]/, '');
  if (!num) return null;

  // 根据方向添加正确的符号，保持原始小数位数
  if (direction === '外') return `+${num}`;  // 存储时使用正值
  if (direction === '内') return `+${num}`;  // 存储时使用正值
  return null;
}

// 修改 farEyeDirection 计算属性
const farEyeDirection = computed({
  get() {
    const exo = form.value.pli_exo_distance_lateral_phoria;
    const eso = form.value.plo_eso_distance_lateral_phoria;
    if (!exo && !eso) return '正';
    if (exo) return '外';
    if (eso) return '内';
    return '正';
  },
  set(val) {
    if (val === '正') {
      // 当选择"正"时，如果有输入值，则根据值的正负来决定使用哪个字段
      if (farEyeValue.value) {
        const num = parseFloat(farEyeValue.value);
        if (num < 0) {
          form.value.pli_exo_distance_lateral_phoria = `+${Math.abs(num)}`;
          form.value.plo_eso_distance_lateral_phoria = null;
        } else if (num > 0) {
          form.value.plo_eso_distance_lateral_phoria = `+${num}`;
          form.value.pli_exo_distance_lateral_phoria = null;
        } else {
          form.value.pli_exo_distance_lateral_phoria = null;
          form.value.plo_eso_distance_lateral_phoria = null;
        }
      } else {
        form.value.pli_exo_distance_lateral_phoria = null;
        form.value.plo_eso_distance_lateral_phoria = null;
      }
    } else if (val === '外') {
      form.value.pli_exo_distance_lateral_phoria = farEyeValue.value ? `+${farEyeValue.value.replace(/^[+\-]/, '')}` : null;
      form.value.plo_eso_distance_lateral_phoria = null;
    } else if (val === '内') {
      form.value.plo_eso_distance_lateral_phoria = farEyeValue.value ? `+${farEyeValue.value.replace(/^[+\-]/, '')}` : null;
      form.value.pli_exo_distance_lateral_phoria = null;
    }
  }
});

// 修改 farEyeValue 计算属性
const farEyeValue = computed({
  get() {
    const exo = form.value.pli_exo_distance_lateral_phoria;
    const eso = form.value.plo_eso_distance_lateral_phoria;
    if (farEyeDirection.value === '外') return exo ? exo.replace(/^[+\-]/, '') : '';
    if (farEyeDirection.value === '内') return eso ? eso.replace(/^[+\-]/, '') : '';
    // 当方向为"正"时，根据值的正负来决定显示
    if (exo) return `-${exo.replace(/^[+\-]/, '')}`;
    if (eso) return `+${eso.replace(/^[+\-]/, '')}`;
    return '';
  },
  set(val) {
    if (!val) {
      form.value.pli_exo_distance_lateral_phoria = null;
      form.value.plo_eso_distance_lateral_phoria = null;
      return;
    }

    // 移除所有正负号，只保留数字部分，保持原始小数位数
    const num = val.toString().replace(/^[+\-]/, '');
    if (!num) {
      form.value.pli_exo_distance_lateral_phoria = null;
      form.value.plo_eso_distance_lateral_phoria = null;
      return;
    }

    if (farEyeDirection.value === '外') {
      form.value.pli_exo_distance_lateral_phoria = `+${num}`;
      form.value.plo_eso_distance_lateral_phoria = null;
    } else if (farEyeDirection.value === '内') {
      form.value.plo_eso_distance_lateral_phoria = `+${num}`;
      form.value.pli_exo_distance_lateral_phoria = null;
    } else if (farEyeDirection.value === '正') {
      // 当方向为"正"时，根据输入值的正负来决定使用哪个字段
      const inputNum = parseFloat(val);
      if (inputNum < 0) {
        form.value.pli_exo_distance_lateral_phoria = `+${Math.abs(inputNum)}`;
        form.value.plo_eso_distance_lateral_phoria = null;
      } else if (inputNum > 0) {
        form.value.plo_eso_distance_lateral_phoria = `+${inputNum}`;
        form.value.pli_exo_distance_lateral_phoria = null;
      } else {
        form.value.pli_exo_distance_lateral_phoria = null;
        form.value.plo_eso_distance_lateral_phoria = null;
      }
    }
  }
});

// 修改 nearEyeDirection 计算属性
const nearEyeDirection = computed({
  get() {
    const exo = form.value.pli_exo_near_lateral_phoria;
    const eso = form.value.plo_eso_near_lateral_phoria;
    if (!exo && !eso) return '正';
    if (exo) return '外';
    if (eso) return '内';
    return '正';
  },
  set(val) {
    if (val === '正') {
      // 当选择"正"时，如果有输入值，则根据值的正负来决定使用哪个字段
      if (nearEyeValue.value) {
        const num = parseFloat(nearEyeValue.value);
        if (num < 0) {
          form.value.pli_exo_near_lateral_phoria = `+${Math.abs(num)}`;
          form.value.plo_eso_near_lateral_phoria = null;
        } else if (num > 0) {
          form.value.plo_eso_near_lateral_phoria = `+${num}`;
          form.value.pli_exo_near_lateral_phoria = null;
        } else {
          form.value.pli_exo_near_lateral_phoria = null;
          form.value.plo_eso_near_lateral_phoria = null;
        }
      } else {
        form.value.pli_exo_near_lateral_phoria = null;
        form.value.plo_eso_near_lateral_phoria = null;
      }
    } else if (val === '外') {
      form.value.pli_exo_near_lateral_phoria = nearEyeValue.value ? `+${nearEyeValue.value.replace(/^[+\-]/, '')}` : null;
      form.value.plo_eso_near_lateral_phoria = null;
    } else if (val === '内') {
      form.value.plo_eso_near_lateral_phoria = nearEyeValue.value ? `+${nearEyeValue.value.replace(/^[+\-]/, '')}` : null;
      form.value.pli_exo_near_lateral_phoria = null;
    }
  }
});

// 修改 nearEyeValue 计算属性
const nearEyeValue = computed({
  get() {
    const exo = form.value.pli_exo_near_lateral_phoria;
    const eso = form.value.plo_eso_near_lateral_phoria;
    if (nearEyeDirection.value === '外') return exo ? exo.replace(/^[+\-]/, '') : '';
    if (nearEyeDirection.value === '内') return eso ? eso.replace(/^[+\-]/, '') : '';
    // 当方向为"正"时，根据值的正负来决定显示
    if (exo) return `-${exo.replace(/^[+\-]/, '')}`;
    if (eso) return `+${eso.replace(/^[+\-]/, '')}`;
    return '';
  },
  set(val) {
    if (!val) {
      form.value.pli_exo_near_lateral_phoria = null;
      form.value.plo_eso_near_lateral_phoria = null;
      return;
    }

    // 移除所有正负号，只保留数字部分，保持原始小数位数
    const num = val.toString().replace(/^[+\-]/, '');
    if (!num) {
      form.value.pli_exo_near_lateral_phoria = null;
      form.value.plo_eso_near_lateral_phoria = null;
      return;
    }

    if (nearEyeDirection.value === '外') {
      form.value.pli_exo_near_lateral_phoria = `+${num}`;
      form.value.plo_eso_near_lateral_phoria = null;
    } else if (nearEyeDirection.value === '内') {
      form.value.plo_eso_near_lateral_phoria = `+${num}`;
      form.value.pli_exo_near_lateral_phoria = null;
    } else if (nearEyeDirection.value === '正') {
      // 当方向为"正"时，根据输入值的正负来决定使用哪个字段
      const inputNum = parseFloat(val);
      if (inputNum < 0) {
        form.value.pli_exo_near_lateral_phoria = `+${Math.abs(inputNum)}`;
        form.value.plo_eso_near_lateral_phoria = null;
      } else if (inputNum > 0) {
        form.value.plo_eso_near_lateral_phoria = `+${inputNum}`;
        form.value.pli_exo_near_lateral_phoria = null;
      } else {
        form.value.pli_exo_near_lateral_phoria = null;
        form.value.plo_eso_near_lateral_phoria = null;
      }
    }
  }
});

function handleSave() {
  // 从多个来源获取patient_id
  let patientId = null;
  
  // 1. 优先从props.patientId获取
  if (props.patientId) {
    patientId = props.patientId;
  }
  // 2. 从props.record.patient_id获取
  else if (props.record && props.record.patient_id) {
    patientId = props.record.patient_id;
  }
  // 3. 从sessionStorage获取当前患者的ID
  else {
    try {
      const storageKeys = Object.keys(sessionStorage);
      const patientKey = storageKeys.find(key => key.startsWith('patient_'));
      if (patientKey) {
        const savedData = sessionStorage.getItem(patientKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.currentData && parsed.currentData.patient_id) {
            patientId = parsed.currentData.patient_id;
          }
        }
      }
    } catch (e) {
      console.error('从sessionStorage获取patient_id失败:', e);
    }
  }
  
  // 如果仍然没有patient_id，则报错
  if (!patientId) {
    message.error('缺少患者ID，无法保存');
    return;
  }

  // 收集表单数据
  const updatedRecord = {
    id: props.record.id,
    patient_id: patientId,  // 使用获取到的patient_id
    // 眼位数据 - 使用格式化函数处理
    pli_exo_distance_lateral_phoria: farEyeDirection.value === '外' ?
        handleEyePositionInput(farEyeValue.value, '外') : null,
    plo_eso_distance_lateral_phoria: farEyeDirection.value === '内' ?
        handleEyePositionInput(farEyeValue.value, '内') : null,
    pli_exo_near_lateral_phoria: nearEyeDirection.value === '外' ?
        handleEyePositionInput(nearEyeValue.value, '外') : null,
    plo_eso_near_lateral_phoria: nearEyeDirection.value === '内' ?
        handleEyePositionInput(nearEyeValue.value, '内') : null,
    // 远距离检查
    fusional_convergence_distance_blur: form.value.fusional_convergence_distance_blur !== null && form.value.fusional_convergence_distance_blur !== undefined && form.value.fusional_convergence_distance_blur !== '' ? form.value.fusional_convergence_distance_blur : null,
    fusional_convergence_distance_break: form.value.fusional_convergence_distance_break !== null && form.value.fusional_convergence_distance_break !== undefined && form.value.fusional_convergence_distance_break !== '' ? form.value.fusional_convergence_distance_break : null,
    fusional_convergence_distance_recovery: form.value.fusional_convergence_distance_recovery !== null && form.value.fusional_convergence_distance_recovery !== undefined && form.value.fusional_convergence_distance_recovery !== '' ? form.value.fusional_convergence_distance_recovery : null,
    fusional_disvergence_distance_blur: form.value.fusional_disvergence_distance_blur !== null && form.value.fusional_disvergence_distance_blur !== undefined && form.value.fusional_disvergence_distance_blur !== '' ? form.value.fusional_disvergence_distance_blur : null,
    fusional_disvergence_distance_break: form.value.fusional_disvergence_distance_break !== null && form.value.fusional_disvergence_distance_break !== undefined && form.value.fusional_disvergence_distance_break !== '' ? form.value.fusional_disvergence_distance_break : null,
    fusional_disvergence_distance_recovery: form.value.fusional_disvergence_distance_recovery !== null && form.value.fusional_disvergence_distance_recovery !== undefined && form.value.fusional_disvergence_distance_recovery !== '' ? form.value.fusional_disvergence_distance_recovery : null,
    // 近距离检查
    fusional_convergence_near_blur: form.value.fusional_convergence_near_blur !== null && form.value.fusional_convergence_near_blur !== undefined && form.value.fusional_convergence_near_blur !== '' ? form.value.fusional_convergence_near_blur : null,
    fusional_convergence_near_break: form.value.fusional_convergence_near_break !== null && form.value.fusional_convergence_near_break !== undefined && form.value.fusional_convergence_near_break !== '' ? form.value.fusional_convergence_near_break : null,
    fusional_convergence_near_recovery: form.value.fusional_convergence_near_recovery !== null && form.value.fusional_convergence_near_recovery !== undefined && form.value.fusional_convergence_near_recovery !== '' ? form.value.fusional_convergence_near_recovery : null,
    fusional_disvergence_near_blur: form.value.fusional_disvergence_near_blur !== null && form.value.fusional_disvergence_near_blur !== undefined && form.value.fusional_disvergence_near_blur !== '' ? form.value.fusional_disvergence_near_blur : null,
    fusional_disvergence_near_break: form.value.fusional_disvergence_near_break !== null && form.value.fusional_disvergence_near_break !== undefined && form.value.fusional_disvergence_near_break !== '' ? form.value.fusional_disvergence_near_break : null,
    fusional_disvergence_near_recovery: form.value.fusional_disvergence_near_recovery !== null && form.value.fusional_disvergence_near_recovery !== undefined && form.value.fusional_disvergence_near_recovery !== '' ? form.value.fusional_disvergence_near_recovery : null,
    // 集合近点
    near_point_of_convergence_distance: form.value.near_point_of_convergence_distance !== null && form.value.near_point_of_convergence_distance !== undefined && form.value.near_point_of_convergence_distance !== '' ? form.value.near_point_of_convergence_distance : null,
    // 调节幅度
    accommodative_amplitude_right: form.value.accommodative_amplitude_right !== null && form.value.accommodative_amplitude_right !== undefined && form.value.accommodative_amplitude_right !== '' ? form.value.accommodative_amplitude_right : null,
    accommodative_amplitude_left: form.value.accommodative_amplitude_left !== null && form.value.accommodative_amplitude_left !== undefined && form.value.accommodative_amplitude_left !== '' ? form.value.accommodative_amplitude_left : null,
    accommodative_amplitude_both: form.value.accommodative_amplitude_both !== null && form.value.accommodative_amplitude_both !== undefined && form.value.accommodative_amplitude_both !== '' ? form.value.accommodative_amplitude_both : null,
    accommodation_amplitude_style: form.value.accommodation_amplitude_style || null,
    // 调节相关
    accommodation_sensitivity_right: form.value.accommodation_sensitivity_right !== null && form.value.accommodation_sensitivity_right !== undefined && form.value.accommodation_sensitivity_right !== '' ? form.value.accommodation_sensitivity_right : null,
    accommodation_sensitivity_left: form.value.accommodation_sensitivity_left !== null && form.value.accommodation_sensitivity_left !== undefined && form.value.accommodation_sensitivity_left !== '' ? form.value.accommodation_sensitivity_left : null,
    accommodation_sensitivity_both: form.value.accommodation_sensitivity_both !== null && form.value.accommodation_sensitivity_both !== undefined && form.value.accommodation_sensitivity_both !== '' ? form.value.accommodation_sensitivity_both : null,
    // 调节反应
    fused_cross_cylinder_right: form.value.fused_cross_cylinder_right !== null && form.value.fused_cross_cylinder_right !== undefined && form.value.fused_cross_cylinder_right !== '' ? form.value.fused_cross_cylinder_right : null,
    fused_cross_cylinder_left: form.value.fused_cross_cylinder_left !== null && form.value.fused_cross_cylinder_left !== undefined && form.value.fused_cross_cylinder_left !== '' ? form.value.fused_cross_cylinder_left : null,
    fused_cross_cylinder_both: form.value.fused_cross_cylinder_both !== null && form.value.fused_cross_cylinder_both !== undefined && form.value.fused_cross_cylinder_both !== '' ? form.value.fused_cross_cylinder_both : null,
    // 相对调节
    negative_relative_accommodation_blur: form.value.negative_relative_accommodation_blur !== null && form.value.negative_relative_accommodation_blur !== undefined && form.value.negative_relative_accommodation_blur !== '' ? form.value.negative_relative_accommodation_blur : null,
    negative_relative_accommodation_recovery: form.value.negative_relative_accommodation_recovery !== null && form.value.negative_relative_accommodation_recovery !== undefined && form.value.negative_relative_accommodation_recovery !== '' ? form.value.negative_relative_accommodation_recovery : null,
    positive_relative_accommodation_blur: form.value.positive_relative_accommodation_blur !== null && form.value.positive_relative_accommodation_blur !== undefined && form.value.positive_relative_accommodation_blur !== '' ? form.value.positive_relative_accommodation_blur : null,
    positive_relative_accommodation_recovery: form.value.positive_relative_accommodation_recovery !== null && form.value.positive_relative_accommodation_recovery !== undefined && form.value.positive_relative_accommodation_recovery !== '' ? form.value.positive_relative_accommodation_recovery : null,
    // 其他检查项目
    worth_4_type: form.value.worth_4_type || null,
    aniseikonia: form.value.aniseikonia || null,
    stereopsis_testing: form.value.stereopsis_testing || null
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
            const storageKey = `patient_${patientId}`;  // 使用获取到的patient_id
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
function handleCancel() {
  Object.assign(form.value, JSON.parse(JSON.stringify(originalRecord.value)));
  isEditMode.value = false;
}
watch(isEditMode, (val) => {
  if (val) {
    originalRecord.value = JSON.parse(JSON.stringify(form.value));
  }
});
</script>

<style scoped lang="scss">
.functional-exam {
}
.exam-content {
  margin-top: 16px;
}
.func-exam-dual {
  display: flex;
  gap: 32px;
}
.func-exam-dual.vertical-mode {
  display: block;
}
.func-exam-dual.vertical-mode .func-exam-col {
  margin-bottom: 24px;
}
.func-exam-col {
  flex: 1;
  display: flex;
  background: #fafbfc;
  padding: 16px;
  background: linear-gradient(135deg, #EEF3FC 0%, #FFFFFF 100%);
  border-radius: 20px 20px 20px 20px;
  border: 1px solid #E4ECFC;

  .func-exam-col-bg {
    flex: 1;
    background: #ffffff;
    border-radius: 20px;
  }
}
.func-table-header {
  display: flex;
  font-weight: bold;
  background: #e8edf4;
  border-radius: 8px 8px 0 0;
  padding: 8px 0;
  margin-bottom: 8px;
}
.func-table-col {
  flex: 1;
  padding: 4px 8px;
  display: flex;
  align-items: center;
}
.func-table-col.item {
  flex: 1.2;
}
.func-table-col.result {
  flex: 2.5;
}
.func-table-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  min-height: 44px;
}
.func-table-row:nth-child(even){
  background: #ffffff;
}
.func-table-row:nth-child(odd){
  background: #fafafa;
}
.func-table-row:last-child {
  border-bottom: none;
}
.eye-pos-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon {
  margin-right: 6px;
}
.input-label {
  color: #888;
  margin-right: 4px;
  min-width: 36px;
  display: inline-block;
  text-align: right;
}
/* 阅读模式下美化表格边框 */
:deep(.func-exam-col) {
  border: 1.5px solid #e0e0e0;
}
:deep(.func-table-row) {
  border-bottom: 1.5px solid #e0e0e0;
}
:deep(.func-table-col) {
  border-right: 1px solid #e0e0e0;
}
:deep(.func-table-col:last-child) {
  border-right: none;
}

:deep(.ant-select-dropdown) {
  max-height: 400px;
  overflow-y: auto;
}

:deep(.ant-select-item-option) {
  padding: 8px 12px;
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
