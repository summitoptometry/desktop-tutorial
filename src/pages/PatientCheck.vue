<template>
  <div class="patient-check-blank" />
</template>

<script>
import { defineComponent } from 'vue';

/** 复查管理：暂为空白页（原完整实现已移除，需时可从版本历史恢复） */
export default defineComponent({
  name: 'PatientCheck',
});
</script>

<style scoped>
.patient-check-blank {
  width: 100%;
  min-height: 480px;
}
</style>
