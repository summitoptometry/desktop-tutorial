/**
 * 登录方法示例 - 一键复制到其他项目使用
 * 与主项目、患者管理系统 app 保持一致：纯中文=子账号接口，否则=机构账号接口
 */

// 1. API 基础地址（可改为环境变量）
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) ||
  'https://aiforoptometry.com';

/** 纯中文账号走子账号接口，否则走机构账号接口 */
function isChineseAccount(username) {
  return /^[\u4e00-\u9fa5]+$/.test((username || '').trim());
}

/**
 * 执行登录，成功时写入 localStorage 并返回 { success: true }，失败抛 Error
 * @param {string} username
 * @param {string} password
 * @param {object} [opts] - 可选：{ onRememberUsername: (name) => {} }
 */
export async function login(username, password, opts = {}) {
  const name = (username || '').trim();
  if (!name) throw new Error('请输入账号');
  if (!password || password.length < 6) throw new Error('密码至少6位');

  const isChinese = isChineseAccount(name);
  const loginUrl = isChinese
    ? `${API_BASE}/subaccount/login/`
    : `${API_BASE}/api/login/verif`;
  const loginData = isChinese
    ? { account: name, password }
    : { username: name, password };

  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(loginData),
  });

  const text = await res.text();
  const data = text.trim() ? JSON.parse(text) : {};

  if (!res.ok) {
    const msg =
      res.status === 401
        ? isChinese ? '子账号或密码错误' : '账号或密码错误'
        : res.status === 404
          ? isChinese ? '子账号不存在' : '账号不存在'
          : data?.message || data?.detail || text || `请求失败 ${res.status}`;
    throw new Error(msg);
  }

  if (isChinese) {
    if (data.code !== 200) throw new Error(data.message || '子账号登录失败');
    const orgId = data.organization?.id;
    const accessToken = data.access;
    const refreshToken = data.refresh;
    const csrfToken = data.csrfToken;
    if (!orgId || !accessToken) throw new Error('登录返回数据异常');
    localStorage.setItem('organization_id', String(orgId));
    localStorage.setItem('organization_name', data.organization_name || '');
    localStorage.setItem('organization', JSON.stringify(data.organization || {}));
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken || '');
    localStorage.setItem('csrftoken', csrfToken || '');
    localStorage.setItem('current_username', name);
  } else {
    if (!data.success) throw new Error(data.message || '登录失败');
    const orgId = data.all_organization_ids?.[0];
    const accessToken = data.access;
    const refreshToken = data.refresh;
    const csrfToken = data.csrfToken;
    if (!orgId || !accessToken) throw new Error('登录返回数据异常');
    localStorage.setItem('organization_id', String(orgId));
    localStorage.setItem('organization_name', data.organization?.name || '');
    localStorage.setItem('organization', JSON.stringify(data.organization || {}));
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken || '');
    localStorage.setItem('csrftoken', csrfToken || '');
    localStorage.setItem('current_username', name);
  }

  if (opts.onRememberUsername) opts.onRememberUsername(name);
  return { success: true };
}

// ========== Vue 页面里用法示例（复制到 Login.vue 的 script） ==========
/*
import { login } from '@/utils/login-example.js';  // 或你放的路径
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';  // 或你用的 message 库

const router = useRouter();
const route = useRoute();
const username = ref('');
const password = ref('');
const loading = ref(false);
const rememberMe = ref(true);

onMounted(() => {
  if (rememberMe.value) {
    const saved = localStorage.getItem('app_saved_username');
    if (saved) username.value = saved;
  }
});

async function onSubmit() {
  loading.value = true;
  try {
    await login(username.value, password.value, {
      onRememberUsername: (name) => {
        if (rememberMe.value) localStorage.setItem('app_saved_username', name);
      },
    });
    showToast('登录成功');
    const redirect = route.query.redirect || '/workbench';
    router.replace(redirect);
  } catch (e) {
    showToast(e?.message || '网络错误，请重试');
  } finally {
    loading.value = false;
  }
}
*/
