<template>
  <div
    ref="pupilRef"
    class="login-pupil"
    :style="pupilStyle"
  />
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  size: { type: Number, default: 12 },
  maxDistance: { type: Number, default: 5 },
  pupilColor: { type: String, default: 'black' },
  forceLookX: { default: undefined },
  forceLookY: { default: undefined },
  mouseX: { type: Number, default: 0 },
  mouseY: { type: Number, default: 0 },
});

const pupilRef = ref(null);

const pupilOffset = computed(() => {
  if (!pupilRef.value) return { x: 0, y: 0 };
  if (props.forceLookX !== undefined && props.forceLookY !== undefined) {
    return { x: props.forceLookX, y: props.forceLookY };
  }
  const rect = pupilRef.value.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const deltaX = props.mouseX - cx;
  const deltaY = props.mouseY - cy;
  const dist = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), props.maxDistance);
  const angle = Math.atan2(deltaY, deltaX);
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
});

const pupilStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  backgroundColor: props.pupilColor,
  transform: `translate(${pupilOffset.value.x}px, ${pupilOffset.value.y}px)`,
  transition: 'transform 0.1s ease-out',
}));
</script>

<style scoped>
.login-pupil {
  border-radius: 50%;
}
</style>
