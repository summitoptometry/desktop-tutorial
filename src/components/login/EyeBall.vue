<template>
  <div
    ref="eyeRef"
    class="login-eyeball"
    :style="eyeStyle"
  >
    <div
      v-if="!isBlinking"
      class="login-eyeball__pupil"
      :style="pupilStyle"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  size: { type: Number, default: 48 },
  pupilSize: { type: Number, default: 16 },
  maxDistance: { type: Number, default: 10 },
  eyeColor: { type: String, default: 'white' },
  pupilColor: { type: String, default: 'black' },
  isBlinking: { type: Boolean, default: false },
  forceLookX: { default: undefined },
  forceLookY: { default: undefined },
  mouseX: { type: Number, default: 0 },
  mouseY: { type: Number, default: 0 },
});

const eyeRef = ref(null);

const pupilOffset = computed(() => {
  if (!eyeRef.value) return { x: 0, y: 0 };
  if (props.forceLookX !== undefined && props.forceLookY !== undefined) {
    return { x: props.forceLookX, y: props.forceLookY };
  }
  const rect = eyeRef.value.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const deltaX = props.mouseX - cx;
  const deltaY = props.mouseY - cy;
  const dist = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), props.maxDistance);
  const angle = Math.atan2(deltaY, deltaX);
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
});

const eyeStyle = computed(() => ({
  width: `${props.size}px`,
  height: props.isBlinking ? '2px' : `${props.size}px`,
  backgroundColor: props.eyeColor,
  overflow: 'hidden',
}));

const pupilStyle = computed(() => ({
  width: `${props.pupilSize}px`,
  height: `${props.pupilSize}px`,
  backgroundColor: props.pupilColor,
  transform: `translate(${pupilOffset.value.x}px, ${pupilOffset.value.y}px)`,
  transition: 'transform 0.1s ease-out',
}));
</script>

<style scoped>
.login-eyeball {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.login-eyeball__pupil {
  border-radius: 50%;
}
</style>
