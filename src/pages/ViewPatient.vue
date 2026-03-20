<template>
  <div class="view-patient-container">
    <iframe
      ref="htmlIframe"
      src="/templates/newrecord.html"
      style="width: 100%; height: 100vh; border: none;"
    ></iframe>
  </div>
</template>

<script>
import { toRaw } from 'vue';

export default {
  name: 'ViewPatient',
  props: {
    record: {
      type: Object,
      default: () => ({})
    }
  },
  mounted() {
    this.sendDataToHtml();
  },
  methods: {
    sendDataToHtml() {
      const iframe = this.$refs.htmlIframe;
      if (iframe) {
        iframe.addEventListener("load", () => {
          // 使用 toRaw 将 reactive 对象转换为普通对象
          const plainRecord = toRaw(this.record);
          try {
            iframe.contentWindow.postMessage({ record: plainRecord }, "*");
            console.log('已发送记录数据到HTML页面:', plainRecord);
          } catch (error) {
            console.error('postMessage错误:', error);
          }
        });
      }
    }
  }
};
</script>

<style scoped>
.view-patient-container {
  overflow: hidden;
}
</style>
