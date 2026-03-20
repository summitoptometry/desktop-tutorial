/**
 * 诊断记录 API（与后端接口文档对齐）
 * 后端未就绪时使用 localStorage 作为降级存储；接口就绪后自动走接口。
 * 存储 key: diagnosis_records_{patient_id}
 * @see 诊断记录接口文档.md
 */

const BASE = typeof window !== 'undefined' && (import.meta.env.DEV || window.location.hostname === 'localhost')
  ? ''
  : 'https://aiforoptometry.com';
const PREFIX = '/medicalrecords';

function getCsrfToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('csrftoken') || '';
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-CSRFToken': getCsrfToken()
  };
}

const STORAGE_KEY_PREFIX = 'diagnosis_records_';

function storageKey(patientId) {
  return `${STORAGE_KEY_PREFIX}${patientId}`;
}

function loadFromStorage(patientId) {
  try {
    const raw = localStorage.getItem(storageKey(patientId));
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn('[diagnosis API] localStorage parse error', e);
    return [];
  }
}

function saveToStorage(patientId, list) {
  try {
    localStorage.setItem(storageKey(patientId), JSON.stringify(list));
  } catch (e) {
    console.warn('[diagnosis API] localStorage write error', e);
  }
}

function generateId() {
  return `diag_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 判断是否应使用本地降级（请求失败或 404）
 */
function shouldFallbackToLocal(err, response) {
  if (err) return true;
  if (response && (response.status === 404 || response.status >= 500)) return true;
  return false;
}

/**
 * 获取某患者的诊断记录列表
 * @param {number|string} patientId - 患者ID
 * @returns {Promise<{ data: Array<{id, patient_id, diagnosis_date, diagnosis_detail, remark, created_at?, updated_at?}> }>}
 */
export async function fetchDiagnosisList(patientId) {
  const url = `${BASE}${PREFIX}/patient/${encodeURIComponent(patientId)}/diagnosis`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    if (shouldFallbackToLocal(null, res)) {
      const list = loadFromStorage(patientId);
      return { data: list, fromStorage: true };
    }
    const json = await res.json();
    // 后端文档：成功 200 返回 { data: [...] }，兼容 list / diagnosis_records / data.items / data.data
    const raw = json.data ?? json.list ?? json.diagnosis_records;
    const data = Array.isArray(raw)
      ? raw
      : (raw && (Array.isArray(raw.items) ? raw.items : Array.isArray(raw.data) ? raw.data : [])) || [];
    return { data, fromStorage: false };
  } catch (err) {
    console.warn('[diagnosis API] fetchDiagnosisList failed, using localStorage', err);
    const list = loadFromStorage(patientId);
    return { data: list, fromStorage: true };
  }
}

/**
 * 新增诊断记录
 * @param {number|string} patientId
 * @param {{ diagnosis_date: string, diagnosis_detail: string, right_eye_remark?: string, left_eye_remark?: string }} payload
 * @returns {Promise<{ data: object }>}
 */
export async function createDiagnosis(patientId, payload) {
  const url = `${BASE}${PREFIX}/patient/${encodeURIComponent(patientId)}/diagnosis`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      // 后端文档：请求体仅含 diagnosis_date, diagnosis_detail, right_eye_remark, left_eye_remark（patient_id 在路径）
      body: JSON.stringify({
        diagnosis_date: payload.diagnosis_date,
        diagnosis_detail: payload.diagnosis_detail,
        right_eye_remark: payload.right_eye_remark ?? '',
        left_eye_remark: payload.left_eye_remark ?? ''
      })
    });
    if (shouldFallbackToLocal(null, res)) {
      const list = loadFromStorage(patientId);
      const newItem = {
        id: generateId(),
        patient_id: patientId,
        diagnosis_date: payload.diagnosis_date,
        diagnosis_detail: payload.diagnosis_detail || '',
        right_eye_remark: payload.right_eye_remark ?? '',
        left_eye_remark: payload.left_eye_remark ?? '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.unshift(newItem);
      saveToStorage(patientId, list);
      return { data: newItem, fromStorage: true };
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = new Error(json.error || `请求失败 ${res.status}`);
      e.fromBackend = true;
      throw e;
    }
    // 后端文档：成功 201 返回根级别对象 { id, patient_id, diagnosis_date, ... }
    const data = json.data ?? json.record ?? json;
    return { data, fromStorage: false };
  } catch (err) {
    if (err.fromBackend) throw err;
    console.warn('[diagnosis API] createDiagnosis failed, using localStorage', err);
    const list = loadFromStorage(patientId);
    const newItem = {
      id: generateId(),
      patient_id: patientId,
      diagnosis_date: payload.diagnosis_date,
      diagnosis_detail: payload.diagnosis_detail || '',
      right_eye_remark: payload.right_eye_remark ?? '',
      left_eye_remark: payload.left_eye_remark ?? '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    list.unshift(newItem);
    saveToStorage(patientId, list);
    return { data: newItem, fromStorage: true };
  }
}

/**
 * 更新诊断记录
 * @param {number|string} patientId - 患者ID（用于 localStorage 降级）
 * @param {number|string} id - 诊断记录ID
 * @param {{ diagnosis_date?: string, diagnosis_detail?: string, right_eye_remark?: string, left_eye_remark?: string }} payload
 * @returns {Promise<{ data: object }>}
 */
export async function updateDiagnosis(patientId, id, payload) {
  const url = `${BASE}${PREFIX}/patient/${encodeURIComponent(patientId)}/diagnosis/${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        diagnosis_date: payload.diagnosis_date,
        diagnosis_detail: payload.diagnosis_detail,
        right_eye_remark: payload.right_eye_remark,
        left_eye_remark: payload.left_eye_remark
      })
    });
    if (shouldFallbackToLocal(null, res)) {
      const list = loadFromStorage(patientId);
      const idx = list.findIndex((item) => String(item.id) === String(id));
      if (idx === -1) return { data: null, fromStorage: true };
      const updated = {
        ...list[idx],
        ...payload,
        updated_at: new Date().toISOString()
      };
      list[idx] = updated;
      saveToStorage(patientId, list);
      return { data: updated, fromStorage: true };
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = new Error(json.error || `请求失败 ${res.status}`);
      e.fromBackend = true;
      throw e;
    }
    // 后端文档：成功 200 返回根级别对象
    const data = json.data ?? json.record ?? json;
    return { data, fromStorage: false };
  } catch (err) {
    if (err.fromBackend) throw err;
    console.warn('[diagnosis API] updateDiagnosis failed, using localStorage', err);
    const list = loadFromStorage(patientId);
    const idx = list.findIndex((item) => String(item.id) === String(id));
    if (idx === -1) return { data: null, fromStorage: true };
    const updated = {
      ...list[idx],
      ...payload,
      updated_at: new Date().toISOString()
    };
    list[idx] = updated;
    saveToStorage(patientId, list);
    return { data: updated, fromStorage: true };
  }
}

/**
 * 删除诊断记录（与后端「方案一」一致：兼容性处理，先 DELETE，405 时用 POST + X-HTTP-Method-Override）
 * 请求头仅 X-CSRFToken，POST 时再加 X-HTTP-Method-Override: DELETE，不带 Content-Type、无请求体
 * @param {number|string} patientId
 * @param {number|string} id - 诊断记录ID
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteDiagnosis(patientId, id) {
  const url = `${BASE}${PREFIX}/patient/${encodeURIComponent(patientId)}/diagnosis/${encodeURIComponent(id)}`;
  try {
    let res = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'X-CSRFToken': getCsrfToken() }
    });

    if (!res.ok && res.status === 405) {
      res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCsrfToken(),
          'X-HTTP-Method-Override': 'DELETE'
        }
      });
    }

    const json = await res.json().catch(() => ({}));

    if (res.ok && json.error) {
      const e = new Error(json.error);
      e.fromBackend = true;
      throw e;
    }
    if (shouldFallbackToLocal(null, res)) {
      const list = loadFromStorage(patientId).filter((item) => String(item.id) !== String(id));
      saveToStorage(patientId, list);
      return { success: true, fromStorage: true };
    }
    if (!res.ok) {
      const e = new Error(json.error || json.detail || `请求失败 ${res.status}`);
      e.fromBackend = true;
      throw e;
    }
    return { success: json.success !== false, fromStorage: false };
  } catch (err) {
    if (err.fromBackend) throw err;
    console.warn('[diagnosis API] deleteDiagnosis failed, using localStorage', err);
    const list = loadFromStorage(patientId).filter((item) => String(item.id) !== String(id));
    saveToStorage(patientId, list);
    return { success: true, fromStorage: true };
  }
}
