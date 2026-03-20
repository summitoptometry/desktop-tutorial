<template>
  <span
      :class="$style.icon"
      :style="'background-image: url(' + fullUrl + ')'"
  ></span>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: ''
    }
  },
  computed: {
    fullUrl() {
      return this.title ? new URL(`../../assets/icons/${this.title}@2x.png`, import.meta.url).href : '';
    }
  }
}
</script>

<style module>
.icon {
  display: inline-block;
  width: 35px;
  height: 35px;
  margin-right: 6px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}
</style>
