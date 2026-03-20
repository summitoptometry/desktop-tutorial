<template>
  <div class="img-exam">
    <Teleport defer to="#second-tabs2">
      <div class="sub-tabs signal-sub-tabs">
        <div :class="['signal-sub-tabs-item', { active: mainTab === tab.key }]" v-for="tab in examinationTabs" :key="tab.key" @click="mainTab = tab.key">
          {{tab.title}}
        </div>
      </div>
    </Teleport>
    <div class="exam-content">
      <div v-if="!record">暂无检查数据</div>
      <div v-else>
        <!-- 角膜地形图检查 -->
        <div v-if="mainTab==='topo'" class="img-section">
          <div class="img-section-title">
            角膜地形图检查
            <div class="img-batch-group">
              <a-tabs v-model:activeKey="batchTab">
                <a-tab-pane :key="1" tab="轴向图"></a-tab-pane>
                <a-tab-pane :key="2" tab="切线图"></a-tab-pane>
                <a-tab-pane :key="3" tab="差异图"></a-tab-pane>
              </a-tabs>
            </div>
          </div>
          <div class="img-topo-group scheme1">
            <div class="img-topo-block">
              <div class="img-topo-label">右眼</div>
              <div class="img-topo-imgs-vertical">
                <div class="img-topo-img-wrap">
                  <template v-if="getTopoImg('right')">
                    <img :src="fullUrl(getTopoImg('right'))" alt="右眼" class="img-large" @click="showPreview(fullUrl(getTopoImg('right')))" />
                    <div class="img-topo-img-label">{{ batchLabel }}</div>
                  </template>
                  <template v-else>
                    <div class="img-topo-img-label notest"><span class="notest-icon">🚫</span>未测</div>
                  </template>
                </div>
              </div>
            </div>
            <div class="img-topo-block">
              <div class="img-topo-label">左眼</div>
              <div class="img-topo-imgs-vertical">
                <div class="img-topo-img-wrap">
                  <template v-if="getTopoImg('left')">
                    <img :src="fullUrl(getTopoImg('left'))" alt="左眼" class="img-large" @click="showPreview(fullUrl(getTopoImg('left')))" />
                    <div class="img-topo-img-label">{{ batchLabel }}</div>
                  </template>
                  <template v-else>
                    <div class="img-topo-img-label notest"><span class="notest-icon">🚫</span>未测</div>
                  </template>
                </div>
              </div>
            </div>
            <div class="img-topo-block">
              <div class="img-topo-label">双眼</div>
              <div class="img-topo-imgs-vertical">
                <div class="img-topo-img-wrap">
                  <template v-if="getTopoImg('doble')">
                    <img :src="fullUrl(getTopoImg('doble'))" alt="双眼" class="img-large" @click="showPreview(fullUrl(getTopoImg('doble')))" />
                    <div class="img-topo-img-label">{{ batchLabel }}</div>
                  </template>
                  <template v-else>
                    <div class="img-topo-img-label notest"><span class="notest-icon">🚫</span>未测</div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 眼底照相检查 -->
        <div v-else-if="mainTab==='fundus'" class="img-section">
          <div class="img-section-title">眼底照相检查</div>
          <div class="img-topo-group scheme1">
            <div class="img-topo-block">
              <div class="img-topo-label">右眼</div>
              <div class="img-topo-imgs-vertical">
                <div class="img-topo-img-wrap">
                  <template v-if="getFundusImg('right')">
                    <img :src="fullUrl(getFundusImg('right'))" alt="右眼" class="img-large" @click="showPreview(fullUrl(getFundusImg('right')))" />
                  </template>
                  <template v-else>
                    <div class="img-topo-img-label notest"><span class="notest-icon">🚫</span>未测</div>
                  </template>
                </div>
              </div>
            </div>
            <div class="img-topo-block">
              <div class="img-topo-label">左眼</div>
              <div class="img-topo-imgs-vertical">
                <div class="img-topo-img-wrap">
                  <template v-if="getFundusImg('left')">
                    <img :src="fullUrl(getFundusImg('left'))" alt="左眼" class="img-large" @click="showPreview(fullUrl(getFundusImg('left')))" />
                  </template>
                  <template v-else>
                    <div class="img-topo-img-label notest"><span class="notest-icon">🚫</span>未测</div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 眼底OCT检查 -->
        <div v-else-if="mainTab==='oct'" class="img-section">
          <div class="img-section-title">眼底OCT检查</div>
          <div class="img-topo-group scheme1">
            <div class="img-topo-block">
              <div class="img-topo-label">右眼</div>
              <div class="img-topo-imgs-vertical">
                <div class="img-topo-img-wrap">
                  <template v-if="record.oct_photo_right_path">
                    <img :src="fullUrl(record.oct_photo_right_path)" alt="右眼" class="img-large" @click="showPreview(fullUrl(record.oct_photo_right_path))" />
                    <div class="img-topo-img-label">DCM文件需转换格式</div>
                  </template>
                  <template v-else>
                    <div class="img-topo-img-label notest"><span class="notest-icon">🚫</span>未测</div>
                  </template>
                </div>
              </div>
            </div>
            <div class="img-topo-block">
              <div class="img-topo-label">左眼</div>
              <div class="img-topo-imgs-vertical">
                <div class="img-topo-img-wrap">
                  <template v-if="record.oct_photo_left_path">
                    <img :src="fullUrl(record.oct_photo_left_path)" alt="左眼" class="img-large" @click="showPreview(fullUrl(record.oct_photo_left_path))" />
                    <div class="img-topo-img-label">DCM文件需转换格式</div>
                  </template>
                  <template v-else>
                    <div class="img-topo-img-label notest"><span class="notest-icon">🚫</span>未测</div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 图片预览弹窗 -->
        <a-modal v-model:open="previewVisible" :footer="null" width="auto" centered :bodyStyle="{padding:0,background:'#000'}" :maskClosable="true">
          <div class="preview-container">
            <div class="preview-toolbar">
              <a-button-group>
                <a-button 
                  type="primary" 
                  size="small" 
                  @click="rotateImage(90)"
                  title="顺时针旋转90°"
                >
                  <template #icon>🔄</template>
                  旋转90°
                </a-button>
                <a-button 
                  type="primary" 
                  size="small" 
                  @click="rotateImage(180)"
                  title="旋转180°"
                >
                  <template #icon>🔄</template>
                  旋转180°
                </a-button>
                <a-button 
                  type="primary" 
                  size="small" 
                  @click="rotateImage(270)"
                  title="逆时针旋转90°"
                >
                  <template #icon>🔄</template>
                  旋转270°
                </a-button>
                <a-button 
                  type="default" 
                  size="small" 
                  @click="resetRotation"
                  title="重置旋转"
                >
                  <template #icon>↺</template>
                  重置
                </a-button>
              </a-button-group>
              <a-button-group style="margin-left: 10px;">
                <a-button 
                  type="primary" 
                  size="small" 
                  @click="zoomIn"
                  title="放大 (快捷键: +)"
                >
                  <template #icon>🔍+</template>
                  放大
                </a-button>
                <a-button 
                  type="primary" 
                  size="small" 
                  @click="zoomOut"
                  title="缩小 (快捷键: -)"
                >
                  <template #icon>🔍-</template>
                  缩小
                </a-button>
                <a-button 
                  type="default" 
                  size="small" 
                  @click="resetZoom"
                  title="重置缩放 (快捷键: 0)"
                >
                  <template #icon>🔍</template>
                  重置
                </a-button>
              </a-button-group>
            </div>
            <div class="preview-tips">
              <span>ESC: 关闭 | 方向键: 旋转 | +/-: 缩放 | 0: 重置缩放 | 滚轮: 缩放</span>
            </div>
            <div class="preview-image-container" :style="{ transform: `rotate(${rotationAngle}deg) scale(${scale})` }">
              <img :src="previewImg" alt="预览" class="preview-image" @wheel="handleWheel" />
            </div>
          </div>
        </a-modal>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';
const props = defineProps({
  record: {
    type: Object,
    default: () => ({})
  }
});
const examinationTabs = [
  { key: 'topo', title: '角膜地形图检查'},
  { key: 'fundus', title: '眼底照相检查'},
  { key: 'oct', title: '眼底OCT检查'},
];

const mainTab = ref('topo'); // 影像类型tab
const batchTab = ref(1); // 第几次检查
const batchLabel = computed(() => ['第一次','第二次','第三次'][batchTab.value-1]);
const imgCache = reactive({});
watch(() => props.record, () => {
  Object.keys(imgCache).forEach(key => delete imgCache[key]);
}, { deep: true });
function getTopoImg(eye) {
  const key = `${eye}_${batchTab.value}`;
  if (imgCache[key]) return imgCache[key];
  let img = '';
  if (eye==='right') {
    if (batchTab.value===1) img = props.record.right_corneal_topography_first;
    if (batchTab.value===2) img = props.record.right_corneal_topography_second;
    if (batchTab.value===3) img = props.record.right_corneal_topography_third;
  }
  if (eye==='left') {
    if (batchTab.value===1) img = props.record.left_corneal_topography_first;
    if (batchTab.value===2) img = props.record.left_corneal_topography_second;
    if (batchTab.value===3) img = props.record.left_corneal_topography_third;
  }
  if (eye==='doble') {
    if (batchTab.value===1) img = props.record.doble_corneal_topography_first;
    if (batchTab.value===2) img = props.record.doble_corneal_topography_second;
    if (batchTab.value===3) img = props.record.doble_corneal_topography_third;
  }
  imgCache[key] = img;
  return img;
}
function getFundusImg(eye) {
  const key = `fundus_${eye}`;
  if (imgCache[key]) return imgCache[key];
  let img = '';
  if (eye==='right') img = props.record.fundus_photo_right_path;
  if (eye==='left') img = props.record.fundus_photo_left_path;
  imgCache[key] = img;
  return img;
}
function fullUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // 保证拼接时有斜杠
  if (!path.startsWith('/')) path = '/' + path;
  return 'https://aiforoptometry.com' + path;
}
const previewVisible = ref(false);
const previewImg = ref('');
const rotationAngle = ref(0); // 图片旋转角度
const scale = ref(1); // 图片缩放比例

function showPreview(url) {
  previewImg.value = url;
  previewVisible.value = true;
  rotationAngle.value = 0; // 打开预览时重置旋转角度
  scale.value = 1; // 重置缩放比例
  
  // 添加键盘事件监听
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      previewVisible.value = false;
    } else if (e.key === 'ArrowLeft') {
      rotateImage(-90);
    } else if (e.key === 'ArrowRight') {
      rotateImage(90);
    } else if (e.key === 'r' || e.key === 'R') {
      resetRotation();
    } else if (e.key === '+' || e.key === '=') {
      zoomIn();
    } else if (e.key === '-') {
      zoomOut();
    } else if (e.key === '0') {
      resetZoom();
    }
  };
  
  document.addEventListener('keydown', handleKeydown);
  
  // 监听模态框关闭，移除键盘事件监听
  const unwatch = watch(previewVisible, (newVal) => {
    if (!newVal) {
      document.removeEventListener('keydown', handleKeydown);
      unwatch();
    }
  });
}

function rotateImage(degrees) {
  rotationAngle.value = (rotationAngle.value + degrees) % 360;
}

function resetRotation() {
  rotationAngle.value = 0;
}

function zoomIn() {
  if (scale.value < 3) {
    scale.value = Math.min(3, scale.value + 0.25);
  }
}

function zoomOut() {
  if (scale.value > 0.25) {
    scale.value = Math.max(0.25, scale.value - 0.25);
  }
}

function resetZoom() {
  scale.value = 1;
}

function handleWheel(event) {
  event.preventDefault();
  const delta = event.deltaY;
  if (delta > 0) { // 向下滚动
    zoomOut();
  } else { // 向上滚动
    zoomIn();
  }
}
</script>

<style scoped lang="scss">
.signal-sub-tabs {
  width: 382px;
  height: 37px;
  border-radius: 18px;
  border: 1px solid #F4BB22;
  display: flex;



  .signal-sub-tabs-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 400;
    font-size: 16px;
    color: #000714;
    line-height: 40px;
    position: relative;
  }

  .signal-sub-tabs-item.active {
    color: #ffffff;
    font-weight: 500;
    background: #F4BB22;
  }

  .signal-sub-tabs-item.active:after{
    display: none;
  }

  .signal-sub-tabs-item:after{
    content: '';
    position: absolute;
    right: -4px;
    width: 4px;
    height: 20px;
    background: #F4BB22;
    box-shadow: inset 1px 0 0px 0px #F4BB22;
  }

  .signal-sub-tabs-item:first-child {
    border-radius: 18px 0 0 18px;
  }

  .signal-sub-tabs-item:last-child {
    border-radius: 0 18px 18px 0;
  }

  .signal-sub-tabs-item:last-child:after{
    display: none;
  }
}

.img-exam {
}
.exam-content {
  margin-top: 8px;
}
.img-section {
  background: linear-gradient(135deg, #EEF3FC 0%, #FFFFFF 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 16px;
  margin-bottom: 24px;
}
.img-section-title {
  font-size: 18px;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 18px;
}
.img-batch-group {
  margin-left: 18px;
}
.img-section-tip {
  color: #aaa;
  font-size: 15px;
  margin-left: 8px;
}
.img-topo-group.scheme1 {
  display: flex;
  gap: 32px;
  justify-content: flex-start;
}
.img-topo-block {
  flex: 1 1 220px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  padding: 14px 12px 10px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 180px;
  background: linear-gradient(135deg, #EEF3FC 0%, #FFFFFF 100%);
  border-radius: 20px 20px 20px 20px;
  border: 1px solid #E4ECFC;
}
.img-topo-label {
  width: 100%;
  text-align: center;
  padding-bottom: 16px;
  margin-bottom: 16px;
  font-weight: 500;
  font-size: 22px;
  color: #000714;
  border-bottom: 1px solid #224B96;
}
.img-topo-imgs-vertical {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  align-items: center;
}
.img-topo-img-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.img-large {
  max-width: 512px;
  max-height: 384px;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  background: #f5f5f5;
  object-fit: contain;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.img-large:hover {
  box-shadow: 0 8px 32px rgba(24,144,255,0.18);
}
.img-topo-img-label {
  font-size: 15px;
  color: #888;
  margin-top: 4px;
}
.notest {
  color: #ff7875;
  font-style: italic;
  font-size: 18px;
  margin-top: 48px;
  font-weight: bold;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.notest-icon {
  font-size: 22px;
  margin-right: 2px;
}
@media (max-width: 900px) {
  .img-topo-group.scheme1 {
    flex-direction: column;
    gap: 18px;
  }
  .img-topo-block {
    min-width: 0;
    width: 100%;
  }
  .img-large {
    max-width: 78vw;
    max-height: 38vw;
  }
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px;
}

.preview-toolbar {
  display: flex;
  justify-content: center;
  gap: 10px;
  width: 100%;
}

.preview-tips {
  font-size: 14px;
  color: #ccc;
  margin-bottom: 10px;
}

.preview-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.preview-image {
  max-width: 90vw;
  max-height: 80vh;
  display: block;
  margin: auto;
  object-fit: contain;
}
</style>
