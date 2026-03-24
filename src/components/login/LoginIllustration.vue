<template>
  <div class="login-illustration">
    <div class="login-illustration__header">
      <img
        :src="summitLogo"
        alt="SUMMIT SOFTWARE"
        class="login-illustration__brand-logo"
        width="144"
        height="144"
      />
    </div>

    <div class="login-illustration__stage">
      <div class="login-illustration__characters">
        <!-- Purple -->
        <div
          ref="purpleRef"
          class="login-illustration__purple"
          :style="purpleBodyStyle"
        >
          <div class="login-illustration__eyes login-illustration__eyes--purple" :style="purpleEyesStyle">
            <EyeBall
              :size="18"
              :pupil-size="7"
              :max-distance="5"
              eye-color="white"
              pupil-color="#2D2D2D"
              :is-blinking="isPurpleBlinking"
              :force-look-x="purpleForceX"
              :force-look-y="purpleForceY"
              :mouse-x="mouseX"
              :mouse-y="mouseY"
            />
            <EyeBall
              :size="18"
              :pupil-size="7"
              :max-distance="5"
              eye-color="white"
              pupil-color="#2D2D2D"
              :is-blinking="isPurpleBlinking"
              :force-look-x="purpleForceX"
              :force-look-y="purpleForceY"
              :mouse-x="mouseX"
              :mouse-y="mouseY"
            />
          </div>
        </div>

        <!-- Black -->
        <div
          ref="blackRef"
          class="login-illustration__black"
          :style="blackBodyStyle"
        >
          <div class="login-illustration__eyes login-illustration__eyes--black" :style="blackEyesStyle">
            <EyeBall
              :size="16"
              :pupil-size="6"
              :max-distance="4"
              eye-color="white"
              pupil-color="#2D2D2D"
              :is-blinking="isBlackBlinking"
              :force-look-x="blackForceX"
              :force-look-y="blackForceY"
              :mouse-x="mouseX"
              :mouse-y="mouseY"
            />
            <EyeBall
              :size="16"
              :pupil-size="6"
              :max-distance="4"
              eye-color="white"
              pupil-color="#2D2D2D"
              :is-blinking="isBlackBlinking"
              :force-look-x="blackForceX"
              :force-look-y="blackForceY"
              :mouse-x="mouseX"
              :mouse-y="mouseY"
            />
          </div>
        </div>

        <!-- Orange -->
        <div ref="orangeRef" class="login-illustration__orange" :style="orangeBodyStyle">
          <div class="login-illustration__eyes login-illustration__eyes--orange" :style="orangeEyesStyle">
            <Pupil :size="12" :max-distance="5" pupil-color="#2D2D2D" :force-look-x="orangeForceX" :force-look-y="orangeForceY" :mouse-x="mouseX" :mouse-y="mouseY" />
            <Pupil :size="12" :max-distance="5" pupil-color="#2D2D2D" :force-look-x="orangeForceX" :force-look-y="orangeForceY" :mouse-x="mouseX" :mouse-y="mouseY" />
          </div>
        </div>

        <!-- Yellow -->
        <div ref="yellowRef" class="login-illustration__yellow" :style="yellowBodyStyle">
          <div class="login-illustration__eyes login-illustration__eyes--yellow" :style="yellowEyesStyle">
            <Pupil :size="12" :max-distance="5" pupil-color="#2D2D2D" :force-look-x="yellowForceX" :force-look-y="yellowForceY" :mouse-x="mouseX" :mouse-y="mouseY" />
            <Pupil :size="12" :max-distance="5" pupil-color="#2D2D2D" :force-look-x="yellowForceX" :force-look-y="yellowForceY" :mouse-x="mouseX" :mouse-y="mouseY" />
          </div>
          <div class="login-illustration__mouth" :style="yellowMouthStyle" />
        </div>
      </div>
    </div>

    <div class="login-illustration__footer">
      <a href="#" class="login-illustration__footer-link" @click.prevent>隐私政策</a>
      <a href="#" class="login-illustration__footer-link" @click.prevent>服务条款</a>
      <a href="#" class="login-illustration__footer-link" @click.prevent>联系我们</a>
    </div>

    <div class="login-illustration__decor login-illustration__decor--blob1" />
    <div class="login-illustration__decor login-illustration__decor--blob2" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import summitLogo from '@/assets/summit-logo.png';
import EyeBall from './EyeBall.vue';
import Pupil from './Pupil.vue';

const props = defineProps({
  password: { type: String, default: '' },
  showPassword: { type: Boolean, default: false },
  isTyping: { type: Boolean, default: false },
});

const mouseX = ref(0);
const mouseY = ref(0);
const isPurpleBlinking = ref(false);
const isBlackBlinking = ref(false);
const isLookingAtEachOther = ref(false);
const isPurplePeeking = ref(false);

const purpleRef = ref(null);
const blackRef = ref(null);
const yellowRef = ref(null);
const orangeRef = ref(null);

const pwdVisible = computed(() => props.password.length > 0 && props.showPassword);
const pwdHidden = computed(() => props.password.length > 0 && !props.showPassword);
const stretchPurple = computed(() => props.isTyping || pwdHidden.value);

function calculatePosition(el) {
  if (!el) return { faceX: 0, faceY: 0, bodySkew: 0 };
  const rect = el.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 3;
  const deltaX = mouseX.value - centerX;
  const deltaY = mouseY.value - centerY;
  const faceX = Math.max(-15, Math.min(15, deltaX / 20));
  const faceY = Math.max(-10, Math.min(10, deltaY / 30));
  const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));
  return { faceX, faceY, bodySkew };
}

const purplePos = computed(() => calculatePosition(purpleRef.value));
const blackPos = computed(() => calculatePosition(blackRef.value));
const yellowPos = computed(() => calculatePosition(yellowRef.value));
const orangePos = computed(() => calculatePosition(orangeRef.value));

const purpleForceX = computed(() => {
  if (pwdVisible.value) return isPurplePeeking.value ? 4 : -4;
  if (isLookingAtEachOther.value) return 3;
  return undefined;
});
const purpleForceY = computed(() => {
  if (pwdVisible.value) return isPurplePeeking.value ? 5 : -4;
  if (isLookingAtEachOther.value) return 4;
  return undefined;
});

const blackForceX = computed(() => {
  if (pwdVisible.value) return -4;
  if (isLookingAtEachOther.value) return 0;
  return undefined;
});
const blackForceY = computed(() => {
  if (pwdVisible.value) return -4;
  if (isLookingAtEachOther.value) return -4;
  return undefined;
});

const orangeForceX = computed(() => (pwdVisible.value ? -5 : undefined));
const orangeForceY = computed(() => (pwdVisible.value ? -4 : undefined));
const yellowForceX = computed(() => (pwdVisible.value ? -5 : undefined));
const yellowForceY = computed(() => (pwdVisible.value ? -4 : undefined));

const purpleBodyStyle = computed(() => {
  const h = stretchPurple.value ? 440 : 400;
  let transform;
  if (pwdVisible.value) transform = 'skewX(0deg)';
  else if (stretchPurple.value) transform = `skewX(${(purplePos.value.bodySkew || 0) - 12}deg) translateX(40px)`;
  else transform = `skewX(${purplePos.value.bodySkew || 0}deg)`;
  return {
    height: `${h}px`,
    transform,
    transformOrigin: 'bottom center',
  };
});

const purpleEyesStyle = computed(() => ({
  left: pwdVisible.value ? '20px' : isLookingAtEachOther.value ? '55px' : `${45 + purplePos.value.faceX}px`,
  top: pwdVisible.value ? '35px' : isLookingAtEachOther.value ? '65px' : `${40 + purplePos.value.faceY}px`,
}));

const blackBodyStyle = computed(() => {
  let transform;
  if (pwdVisible.value) transform = 'skewX(0deg)';
  else if (isLookingAtEachOther.value) transform = `skewX(${(blackPos.value.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`;
  else if (stretchPurple.value) transform = `skewX(${(blackPos.value.bodySkew || 0) * 1.5}deg)`;
  else transform = `skewX(${blackPos.value.bodySkew || 0}deg)`;
  return { transform, transformOrigin: 'bottom center' };
});

const blackEyesStyle = computed(() => ({
  left: pwdVisible.value ? '10px' : isLookingAtEachOther.value ? '32px' : `${26 + blackPos.value.faceX}px`,
  top: pwdVisible.value ? '28px' : isLookingAtEachOther.value ? '12px' : `${32 + blackPos.value.faceY}px`,
}));

const orangeBodyStyle = computed(() => ({
  transform: pwdVisible.value ? 'skewX(0deg)' : `skewX(${orangePos.value.bodySkew || 0}deg)`,
  transformOrigin: 'bottom center',
}));

const orangeEyesStyle = computed(() => ({
  left: pwdVisible.value ? '50px' : `${82 + (orangePos.value.faceX || 0)}px`,
  top: pwdVisible.value ? '85px' : `${90 + (orangePos.value.faceY || 0)}px`,
}));

const yellowBodyStyle = computed(() => ({
  transform: pwdVisible.value ? 'skewX(0deg)' : `skewX(${yellowPos.value.bodySkew || 0}deg)`,
  transformOrigin: 'bottom center',
}));

const yellowEyesStyle = computed(() => ({
  left: pwdVisible.value ? '20px' : `${52 + (yellowPos.value.faceX || 0)}px`,
  top: pwdVisible.value ? '35px' : `${40 + (yellowPos.value.faceY || 0)}px`,
}));

const yellowMouthStyle = computed(() => ({
  left: pwdVisible.value ? '10px' : `${40 + (yellowPos.value.faceX || 0)}px`,
  top: pwdVisible.value ? '88px' : `${88 + (yellowPos.value.faceY || 0)}px`,
}));

function onMouseMove(e) {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
}

let purpleBlinkOuter = null;
let purpleBlinkInner = null;
let blackBlinkOuter = null;
let blackBlinkInner = null;

function schedulePurpleBlink() {
  purpleBlinkOuter = setTimeout(() => {
    isPurpleBlinking.value = true;
    purpleBlinkInner = setTimeout(() => {
      isPurpleBlinking.value = false;
      schedulePurpleBlink();
    }, 150);
  }, Math.random() * 4000 + 3000);
}

function scheduleBlackBlink() {
  blackBlinkOuter = setTimeout(() => {
    isBlackBlinking.value = true;
    blackBlinkInner = setTimeout(() => {
      isBlackBlinking.value = false;
      scheduleBlackBlink();
    }, 150);
  }, Math.random() * 4000 + 3000);
}

let lookTimer = null;
watch(
  () => props.isTyping,
  (typing) => {
    if (lookTimer) {
      clearTimeout(lookTimer);
      lookTimer = null;
    }
    if (typing) {
      isLookingAtEachOther.value = true;
      lookTimer = setTimeout(() => {
        isLookingAtEachOther.value = false;
        lookTimer = null;
      }, 800);
    } else {
      isLookingAtEachOther.value = false;
    }
  }
);

let peekTimer = null;
let peekInnerTimer = null;

watch(
  () => [props.password, props.showPassword],
  () => {
    if (peekTimer) {
      clearTimeout(peekTimer);
      peekTimer = null;
    }
    if (peekInnerTimer) {
      clearTimeout(peekInnerTimer);
      peekInnerTimer = null;
    }
    isPurplePeeking.value = false;
    if (props.password.length > 0 && props.showPassword) {
      const schedulePeek = () => {
        peekTimer = setTimeout(() => {
          isPurplePeeking.value = true;
          peekInnerTimer = setTimeout(() => {
            isPurplePeeking.value = false;
            peekInnerTimer = null;
            if (props.password.length > 0 && props.showPassword) schedulePeek();
          }, 800);
        }, Math.random() * 3000 + 2000);
      };
      schedulePeek();
    }
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove);
  schedulePurpleBlink();
  scheduleBlackBlink();
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  clearTimeout(purpleBlinkOuter);
  clearTimeout(purpleBlinkInner);
  clearTimeout(blackBlinkOuter);
  clearTimeout(blackBlinkInner);
  if (lookTimer) clearTimeout(lookTimer);
  if (peekTimer) clearTimeout(peekTimer);
  if (peekInnerTimer) clearTimeout(peekInnerTimer);
});
</script>

<style scoped>
.login-illustration {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100%;
  padding: 48px;
  background: #fff;
  color: rgba(0, 0, 0, 0.65);
  overflow: hidden;
}

.login-illustration__header {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
}

.login-illustration__brand-logo {
  display: block;
  width: 144px;
  height: 144px;
  object-fit: contain;
  object-position: left center;
}

.login-illustration__stage {
  position: relative;
  z-index: 20;
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 420px;
}

.login-illustration__characters {
  position: relative;
  width: 550px;
  height: 400px;
}

.login-illustration__purple {
  position: absolute;
  bottom: 0;
  left: 70px;
  width: 180px;
  height: 400px;
  background-color: #5dade2;
  border-radius: 10px 10px 0 0;
  z-index: 1;
  transition: all 0.7s ease-in-out;
}

.login-illustration__black {
  position: absolute;
  bottom: 0;
  left: 240px;
  width: 120px;
  height: 310px;
  background-color: #2d2d2d;
  border-radius: 8px 8px 0 0;
  z-index: 2;
  transition: all 0.7s ease-in-out;
}

.login-illustration__orange {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 240px;
  height: 200px;
  z-index: 3;
  background-color: #ff9b6b;
  border-radius: 120px 120px 0 0;
  transition: all 0.7s ease-in-out;
}

.login-illustration__yellow {
  position: absolute;
  bottom: 0;
  left: 310px;
  width: 140px;
  height: 230px;
  background-color: #e8d754;
  border-radius: 70px 70px 0 0;
  z-index: 4;
  transition: all 0.7s ease-in-out;
}

.login-illustration__eyes {
  position: absolute;
  display: flex;
  transition: all 0.7s ease-in-out;
}

.login-illustration__eyes--purple {
  gap: 32px;
}

.login-illustration__eyes--black {
  gap: 24px;
}

.login-illustration__eyes--orange,
.login-illustration__eyes--yellow {
  gap: 32px;
  transition: all 0.2s ease-out;
}

.login-illustration__mouth {
  position: absolute;
  width: 80px;
  height: 4px;
  background: #2d2d2d;
  border-radius: 999px;
  transition: all 0.2s ease-out;
}

.login-illustration__footer {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 32px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.login-illustration__footer-link {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s;
}

.login-illustration__footer-link:hover {
  color: rgba(0, 0, 0, 0.88);
}

.login-illustration__decor {
  position: absolute;
  pointer-events: none;
}

.login-illustration__decor--blob1 {
  top: 25%;
  right: 25%;
  width: 256px;
  height: 256px;
  background: rgba(93, 173, 226, 0.15);
  border-radius: 50%;
  filter: blur(48px);
}

.login-illustration__decor--blob2 {
  bottom: 25%;
  left: 25%;
  width: 384px;
  height: 384px;
  background: rgba(93, 173, 226, 0.08);
  border-radius: 50%;
  filter: blur(48px);
}
</style>
