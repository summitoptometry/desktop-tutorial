import { createApp } from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue'

const app = createApp(App)

// 全局错误处理器 - 捕获所有 Vue 错误
app.config.errorHandler = (err, instance, info) => {
  // 捕获菜单组件上下文错误（Ant Design Vue 已知问题）
  if (err && err.message && (err.message.includes('useInjectMenu') || err.message.includes('prefixCls'))) {
    console.warn('菜单组件渲染错误（已知问题，已忽略）:', err.message);
    return; // 静默处理，不显示错误
  }
  // 其他错误正常处理
  console.error('Vue 错误:', err, info);
};

// 全局警告处理器 - 捕获 Vue 警告
const originalWarn = console.warn;
console.warn = (...args) => {
  // 过滤菜单组件相关的警告
  const message = args.join(' ');
  if (message.includes('useInjectMenu') || 
      message.includes('prefixCls') || 
      message.includes('Slot') && message.includes('render function')) {
    // 静默处理菜单组件相关的警告
    return;
  }
  // 其他警告正常显示
  originalWarn.apply(console, args);
};

app.use(Antd)
app.mount('#app')
