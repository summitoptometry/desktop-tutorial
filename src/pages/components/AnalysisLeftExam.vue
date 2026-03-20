<template>
  <div class="analysis-left-exam-container">
    <div class="analysis-content">
      <div class="analysis-header">
        <h3>结果分析 - 左屏</h3>
        <p class="analysis-description">基于检查数据进行智能分析和建议</p>
      </div>
      
      <div class="whiteboard">
        <div class="placeholder-content">
          <div class="placeholder-icon">
            📊
          </div>
          <h4>结果分析</h4>
          <p>此页面正在开发中，敬请期待...</p>
          <div class="coming-soon">
            <span>Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue'

const props = defineProps({
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
  isDualScreen: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: [String, Number],
    required: true
  }
})

// 监听record变化，输出检查数据
watch(() => props.record, (newRecord) => {
  console.log('=== 结果分析页面(左屏) - 当前检查记录 ===')
  console.log('患者ID:', props.patientId)
  console.log('检查记录ID:', newRecord?.id)
  console.log('检查日期:', newRecord?.examination_date)
  
  if (newRecord) {
    console.log('\n--- 常规检查数据 ---')
    
    // 左眼常规检查数据
    console.log('【左眼】')
    console.log('  眼轴长度:', newRecord.left_eye_axial_length, 'mm')
    console.log('  K1:', newRecord.left_eye_k1, 'D')
    console.log('  K2:', newRecord.left_eye_k2, 'D')
    console.log('  ΔK:', newRecord.left_eye_delta_k, 'D')
    console.log('  角膜厚度:', newRecord.left_cct, 'μm')
    console.log('  前房深度:', newRecord.left_anterior_chamber_depth, 'mm')
    console.log('  晶体厚度:', newRecord.left_lens_thickness, 'mm')
    console.log('  玻璃体长度:', newRecord.left_vitreous_space_thickness, 'mm')
    console.log('  脉络膜厚度:', newRecord.left_oct_fovea, 'μm')
    console.log('  眼压:', newRecord.left_intraocular_pressure, 'mmHg')
    console.log('  裸眼视力:', newRecord.uva_left_vision)
    console.log('  旧镜视力:', newRecord.vaec_left_old_vision)
    
    // 右眼常规检查数据
    console.log('\n【右眼】')
    console.log('  眼轴长度:', newRecord.right_eye_axial_length, 'mm')
    console.log('  K1:', newRecord.right_eye_k1, 'D')
    console.log('  K2:', newRecord.right_eye_k2, 'D')
    console.log('  ΔK:', newRecord.right_eye_delta_k, 'D')
    console.log('  角膜厚度:', newRecord.right_cct, 'μm')
    console.log('  前房深度:', newRecord.right_anterior_chamber_depth, 'mm')
    console.log('  晶体厚度:', newRecord.right_lens_thickness, 'mm')
    console.log('  玻璃体长度:', newRecord.right_vitreous_space_thickness, 'mm')
    console.log('  脉络膜厚度:', newRecord.right_oct_fovea, 'μm')
    console.log('  眼压:', newRecord.right_intraocular_pressure, 'mmHg')
    console.log('  裸眼视力:', newRecord.uva_right_vision)
    console.log('  旧镜视力:', newRecord.vaec_right_old_vision)
    
    // 双眼数据
    console.log('\n【双眼】')
    console.log('  裸眼视力:', newRecord.uva_both_vision)
    console.log('  旧镜视力:', newRecord.vaec_both_old_vision)
    
    // 身高体重
    console.log('\n【基本信息】')
    console.log('  身高:', newRecord.height, 'cm')
    console.log('  体重:', newRecord.weight, 'kg')
    
    console.log('\n--- 诊疗方案数据 ---')
    
    // 左眼诊疗方案
    console.log('【左眼治疗方案】')
    console.log('  阿托品:', newRecord.left_atropine || '否')
    console.log('  配镜手段:', newRecord.left_glasses || '否')
    if (newRecord.left_glasses_pp) {
      console.log('  配镜参数:', newRecord.left_glasses_pp)
    }
    console.log('  低强度红光:', newRecord.left_hg || '否')
    if (newRecord.left_hg_dw !== undefined && newRecord.left_hg_dw !== '') {
      console.log('  低强度红光档位:', newRecord.left_hg_dw)
    }
    console.log('  理疗:', newRecord.left_physiotherapy || '否')
    console.log('  视觉训练:', newRecord.left_visual_training || '否')
    
    // 右眼诊疗方案
    console.log('\n【右眼治疗方案】')
    console.log('  阿托品:', newRecord.right_atropine || '否')
    console.log('  配镜手段:', newRecord.right_glasses || '否')
    if (newRecord.right_glasses_pp) {
      console.log('  配镜参数:', newRecord.right_glasses_pp)
    }
    console.log('  低强度红光:', newRecord.right_hg || '否')
    if (newRecord.right_hg_dw !== undefined && newRecord.right_hg_dw !== '') {
      console.log('  低强度红光档位:', newRecord.right_hg_dw)
    }
    console.log('  理疗:', newRecord.right_physiotherapy || '否')
    console.log('  视觉训练:', newRecord.right_visual_training || '否')
    
    // 复查安排
    console.log('\n【复查安排】')
    console.log('  检查间隔:', newRecord.review_interval_days, '天')
    console.log('  下次检查日期:', newRecord.review_date)
    console.log('  双眼同步:', newRecord.sync_eyes ? '是' : '否')
  }
}, { immediate: true, deep: true })

// 监听previousRecord变化
watch(() => props.previousRecord, (newPreviousRecord) => {
  console.log('=== 结果分析页面(左屏) - 上次检查记录 ===')
  if (newPreviousRecord) {
    console.log('上次检查记录ID:', newPreviousRecord.id)
    console.log('上次检查日期:', newPreviousRecord.examination_date)
    console.log('上次检查记录:', newPreviousRecord)
  } else {
    console.log('无上次检查记录')
  }
}, { immediate: true })

// 监听examinationRecords变化
watch(() => props.examinationRecords, (newRecords) => {
  console.log('=== 结果分析页面(左屏) - 所有检查记录 ===')
  console.log('检查记录总数:', newRecords.length)
  console.log('所有检查记录:', newRecords)
}, { immediate: true })

// 监听isDualScreen变化
watch(() => props.isDualScreen, (newIsDualScreen) => {
  console.log('=== 结果分析页面(左屏) - 双屏模式 ===')
  console.log('是否为双屏模式:', newIsDualScreen)
}, { immediate: true })
</script>

<style scoped lang="scss">
.analysis-left-exam-container {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.analysis-content {
  max-width: 100%;
}

.analysis-header {
  margin-bottom: 24px;
  text-align: center;
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }
  
  .analysis-description {
    margin: 0;
    font-size: 14px;
    color: #666;
  }
}

.whiteboard {
  background: #f8f9fa;
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  .placeholder-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
  }
  
  h4 {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 500;
    color: #666;
  }
  
  p {
    margin: 0 0 20px 0;
    font-size: 14px;
    color: #999;
    line-height: 1.5;
  }
  
  .coming-soon {
    display: inline-block;
    background: linear-gradient(-90deg, #E27244 0%, #E29D44 100%);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
}
</style>