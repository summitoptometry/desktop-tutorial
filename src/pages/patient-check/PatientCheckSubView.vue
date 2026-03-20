<template>
  <div class="patient-check-sub-blank" />
</template>

<script setup>
defineProps({
  /** 子页类型：routine | glasses | rgp，占位供后续开发 */
  variant: {
    type: String,
    default: '',
  },
});
</script>

<style scoped>
.patient-check-sub-blank {
  width: 100%;
  min-height: 400px;
}
</style>
