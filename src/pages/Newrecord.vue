<template>
  <div class="newrecord-container">
    <iframe
      src="/src/assets/tsx-project/index.html"
      style="width: 100%; height: 100vh; border: none;"
    ></iframe>
  </div>
</template>

<script>
import { toRaw } from 'vue';

export default {
  name: 'Newrecord',
  props: {
    record: {
      type: Object,
      default: () => ({})
    }
  },
  mounted() {
    console.log('Newrecord组件接收到的record数据:', this.record);
    const iframe = this.$el.querySelector("iframe");
    if (iframe) {
      iframe.addEventListener("load", () => {
        const plainRecord = toRaw(this.record);
        try {
          iframe.contentWindow.postMessage({ record: plainRecord }, "*");
          console.log('已发送记录数据到TSX页面:', plainRecord);
        } catch (error) {
          console.error('postMessage错误:', error);
        }
      });
    }
  }
};
</script>

<style scoped>
.newrecord-container {
  overflow: hidden;
}
</style> 