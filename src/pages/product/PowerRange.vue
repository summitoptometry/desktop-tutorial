<template>
  <div class="power-range-page">
    <a-card :bordered="false" :body-style="{ paddingTop: 0, paddingLeft: 0 }">
      <div class="power-range-page-toolbar">
        <a-button type="primary" @click="openPowerRangeModal">光度范围</a-button>
      </div>
      <div class="power-range-page-list">
        <div class="power-range-page-list-title">光度范围模版</div>
        <a-table
          :columns="powerTemplateColumns"
          :data-source="powerRangeTemplates"
          :pagination="false"
          row-key="id"
          size="small"
          class="category-table power-template-table"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">{{ index + 1 }}</template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="openPowerTemplateEdit(record)">编辑</a-button>
                <a-popconfirm title="确定删除该模版吗？" ok-text="确定" cancel-text="取消" @confirm="deletePowerTemplate(record)">
                  <a-button type="link" size="small" danger>删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
      <!-- 光度范围选择弹窗 -->
      <a-modal
        v-model:visible="powerRangeModalVisible"
        title="光度范围选择"
        width="1280px"
        :footer="null"
        cancel-text="取消"
        @cancel="closePowerRangeModal"
      >
        <div class="power-range-tip">提示：左键拖拉批量选中，再次拖拉为取消选中！</div>
        <div
          ref="powerRangeGridWrapRef"
          class="power-range-grid-wrap"
          @mousedown="onPowerGridMouseDown"
          @mousemove="onPowerGridMouseMove"
          @mouseup="onPowerGridMouseUp"
          @mouseleave="onPowerGridMouseUp"
        >
          <table class="power-range-table">
            <thead>
              <tr>
                <th class="power-range-corner">球镜\柱镜</th>
                <th v-for="c in cylinderValues" :key="c" class="power-range-th">{{ formatPowerValue(c) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sphereValues" :key="s" :data-sphere="s">
                <td class="power-range-td-label">{{ formatSphereValue(s) }}</td>
                <td
                  v-for="c in cylinderValues"
                  :key="`${s}-${c}`"
                  class="power-range-td"
                  :class="{ selected: isPowerCellSelected(s, c) }"
                  :data-sphere="s"
                  :data-cylinder="c"
                />
              </tr>
            </tbody>
          </table>
        </div>
        <div class="power-range-templates">
          <a-button type="primary" size="small" :disabled="!powerRangeSelection || powerRangeSelection.size === 0" @click="savePowerRangeAsTemplate">保存为模版</a-button>
        </div>
        <a-modal
          v-model:visible="powerTemplateEditVisible"
          title="编辑光度模版"
          ok-text="保存"
          cancel-text="取消"
          @ok="submitPowerTemplateEdit"
        >
          <a-form layout="vertical">
            <a-form-item label="球镜范围（D）">
              <a-space>
                <a-input-number v-model:value="powerTemplateForm.sphereMin" :min="-20" :max="20" :step="0.25" :precision="2" placeholder="最小" style="width: 100px" />
                <span>~</span>
                <a-input-number v-model:value="powerTemplateForm.sphereMax" :min="-20" :max="20" :step="0.25" :precision="2" placeholder="最大" style="width: 100px" />
              </a-space>
            </a-form-item>
            <a-form-item label="柱镜范围（D）">
              <a-space>
                <a-input-number v-model:value="powerTemplateForm.cylinderMin" :min="-6" :max="0" :step="0.25" :precision="2" placeholder="最小" style="width: 100px" />
                <span>~</span>
                <a-input-number v-model:value="powerTemplateForm.cylinderMax" :min="-6" :max="0" :step="0.25" :precision="2" placeholder="最大" style="width: 100px" />
              </a-space>
            </a-form-item>
          </a-form>
        </a-modal>
      </a-modal>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { broadcastProductAuxStorage, PRODUCT_AUX_STORAGE_EVENT } from '../../utils/productStorageSync.js';

const POWER_TEMPLATE_STORAGE_KEY = 'PowerRangeTemplates';

function genCylinderValues() {
  const arr = [0];
  for (let i = 1; i <= 24; i++) arr.push(Number((-i * 0.25).toFixed(2)));
  return arr;
}
function genSphereValues() {
  const arr = [];
  for (let v = -20; v <= 20; v += 0.25) arr.push(Number(v.toFixed(2)));
  return arr;
}
const cylinderValues = genCylinderValues();
const sphereValues = genSphereValues();

const formatPowerValue = (v) => (Number(v) === v ? Number(v).toFixed(2) : String(v));
const formatSphereValue = (v) => {
  const n = Number(v);
  if (n !== n) return String(v);
  const s = n.toFixed(2);
  return n > 0 ? `+${s}` : s;
};

const powerRangeModalVisible = ref(false);
const powerRangeSelection = ref(new Set());
const powerRangeDrag = ref({ start: null, current: null, mode: 'add' });

const powerRangeKey = (s, c) => `${s},${c}`;

function getCellsInRect(sMin, sMax, cMin, cMax) {
  const cells = [];
  sphereValues.forEach((s) => {
    if (s < sMin || s > sMax) return;
    cylinderValues.forEach((c) => {
      if (c < cMin || c > cMax) return;
      cells.push({ s, c });
    });
  });
  return cells;
}

const powerRangeGridWrapRef = ref(null);

const openPowerRangeModal = () => {
  powerRangeSelection.value = new Set();
  powerRangeDrag.value = { start: null, current: null, mode: 'add' };
  loadPowerRangeTemplates();
  powerRangeModalVisible.value = true;
  nextTick(() => {
    setTimeout(scrollPowerGridToSphereZero, 150);
  });
};

function scrollPowerGridToSphereZero() {
  const wrap = powerRangeGridWrapRef.value;
  if (!wrap) return;
  const row = wrap.querySelector('tr[data-sphere="0"]');
  if (!row) return;
  const rowTop = row.offsetTop;
  const wrapHeight = wrap.clientHeight;
  const rowHeight = row.offsetHeight;
  wrap.scrollTop = Math.max(0, rowTop - wrapHeight + rowHeight);
}

const closePowerRangeModal = () => {
  powerRangeModalVisible.value = false;
  powerRangeSelection.value = new Set();
};

const getCellFromEvent = (e) => {
  const el = e.target?.closest?.('[data-sphere][data-cylinder]');
  if (!el) return null;
  const s = Number(el.getAttribute('data-sphere'));
  const c = Number(el.getAttribute('data-cylinder'));
  return { sphere: s, cylinder: c };
};

const onPowerGridMouseDown = (e) => {
  const cell = getCellFromEvent(e);
  if (!cell) return;
  const key = powerRangeKey(cell.sphere, cell.cylinder);
  const inSelection = powerRangeSelection.value.has(key);
  const mode = inSelection ? 'remove' : 'add';
  powerRangeDrag.value = { start: { ...cell }, current: { ...cell }, mode };
};

const onPowerGridMouseMove = (e) => {
  if (powerRangeDrag.value.start == null) return;
  const cell = getCellFromEvent(e);
  if (!cell) return;
  powerRangeDrag.value = { ...powerRangeDrag.value, current: cell };
};

const onPowerGridMouseUp = () => {
  if (powerRangeDrag.value.start == null) return;
  const { start, current, mode } = powerRangeDrag.value;
  const sMin = Math.min(start.sphere, current.sphere);
  const sMax = Math.max(start.sphere, current.sphere);
  const cMin = Math.min(start.cylinder, current.cylinder);
  const cMax = Math.max(start.cylinder, current.cylinder);
  const set = new Set(powerRangeSelection.value);
  const cells = getCellsInRect(sMin, sMax, cMin, cMax);
  if (mode === 'add') {
    cells.forEach(({ s, c }) => set.add(powerRangeKey(s, c)));
  } else {
    cells.forEach(({ s, c }) => set.delete(powerRangeKey(s, c)));
  }
  powerRangeSelection.value = set;
  powerRangeDrag.value = { start: null, current: null, mode: 'add' };
};

const isPowerCellSelected = (s, c) => {
  const key = powerRangeKey(s, c);
  const drag = powerRangeDrag.value;
  if (drag.start != null && drag.current != null) {
    const sMin = Math.min(drag.start.sphere, drag.current.sphere);
    const sMax = Math.max(drag.start.sphere, drag.current.sphere);
    const cMin = Math.min(drag.start.cylinder, drag.current.cylinder);
    const cMax = Math.max(drag.start.cylinder, drag.current.cylinder);
    const inRect = s >= sMin && s <= sMax && c >= cMin && c <= cMax;
    const inSet = powerRangeSelection.value.has(key);
    if (drag.mode === 'add') return inSet || inRect;
    return inSet && !inRect;
  }
  return powerRangeSelection.value.has(key);
};

const powerRangeDisplay = computed(() => {
  const set = powerRangeSelection.value;
  if (!set || set.size === 0) {
    const drag = powerRangeDrag.value;
    if (drag.start != null && drag.current != null) {
      return {
        sphereMin: Math.min(drag.start.sphere, drag.current.sphere),
        sphereMax: Math.max(drag.start.sphere, drag.current.sphere),
        cylinderMin: Math.min(drag.start.cylinder, drag.current.cylinder),
        cylinderMax: Math.max(drag.start.cylinder, drag.current.cylinder)
      };
    }
    return null;
  }
  let sphereMin = Infinity, sphereMax = -Infinity, cylinderMin = Infinity, cylinderMax = -Infinity;
  set.forEach((key) => {
    const [s, c] = key.split(',').map(Number);
    sphereMin = Math.min(sphereMin, s);
    sphereMax = Math.max(sphereMax, s);
    cylinderMin = Math.min(cylinderMin, c);
    cylinderMax = Math.max(cylinderMax, c);
  });
  return { sphereMin, sphereMax, cylinderMin, cylinderMax };
});

const powerRangeTemplates = ref([]);
const powerTemplateColumns = [
  { title: '序号', key: 'index', width: 80, align: 'center' },
  { title: '模版说明', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: 160 }
];
const powerTemplateEditVisible = ref(false);
const powerTemplateEditingId = ref(null);
const powerTemplateForm = ref({ sphereMin: null, sphereMax: null, cylinderMin: null, cylinderMax: null });

const getPowerTemplateDescription = (t) => {
  if (!t) return '';
  return `球镜 ${formatSphereValue(t.sphereMin)}D ~ ${formatSphereValue(t.sphereMax)}D，柱镜 ${formatPowerValue(t.cylinderMin)}D ~ ${formatPowerValue(t.cylinderMax)}D`;
};

const loadPowerRangeTemplates = () => {
  const raw = localStorage.getItem(POWER_TEMPLATE_STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  powerRangeTemplates.value = list.map((t) => ({ ...t, description: getPowerTemplateDescription(t) }));
};

const savePowerRangeTemplates = (list) => {
  const raw = list.map((t) => ({ id: t.id, sphereMin: t.sphereMin, sphereMax: t.sphereMax, cylinderMin: t.cylinderMin, cylinderMax: t.cylinderMax }));
  localStorage.setItem(POWER_TEMPLATE_STORAGE_KEY, JSON.stringify(raw));
  loadPowerRangeTemplates();
  broadcastProductAuxStorage('powerTemplate');
};

const savePowerRangeAsTemplate = () => {
  const d = powerRangeDisplay.value;
  if (!d) return;
  const list = [...powerRangeTemplates.value.map((t) => ({ id: t.id, sphereMin: t.sphereMin, sphereMax: t.sphereMax, cylinderMin: t.cylinderMin, cylinderMax: t.cylinderMax }))];
  const newId = list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
  list.push({ id: newId, sphereMin: d.sphereMin, sphereMax: d.sphereMax, cylinderMin: d.cylinderMin, cylinderMax: d.cylinderMax });
  savePowerRangeTemplates(list);
  message.success('已保存为模版');
};

const openPowerTemplateEdit = (record) => {
  powerTemplateEditingId.value = record.id;
  powerTemplateForm.value = {
    sphereMin: record.sphereMin,
    sphereMax: record.sphereMax,
    cylinderMin: record.cylinderMin,
    cylinderMax: record.cylinderMax
  };
  powerTemplateEditVisible.value = true;
};

const submitPowerTemplateEdit = () => {
  const { sphereMin, sphereMax, cylinderMin, cylinderMax } = powerTemplateForm.value;
  if (sphereMin == null || sphereMax == null || cylinderMin == null || cylinderMax == null) {
    message.warning('请填写完整范围');
    return;
  }
  const list = powerRangeTemplates.value.map((t) => {
    if (t.id !== powerTemplateEditingId.value) return { id: t.id, sphereMin: t.sphereMin, sphereMax: t.sphereMax, cylinderMin: t.cylinderMin, cylinderMax: t.cylinderMax };
    return { id: t.id, sphereMin, sphereMax, cylinderMin, cylinderMax };
  });
  savePowerRangeTemplates(list);
  powerTemplateEditVisible.value = false;
  powerTemplateEditingId.value = null;
  message.success('保存成功');
};

const deletePowerTemplate = (record) => {
  const list = powerRangeTemplates.value.filter((t) => t.id !== record.id);
  savePowerRangeTemplates(list);
  message.success('已删除');
};

function onPowerTemplateStorageSync(e) {
  if (e.detail?.type === 'powerTemplate') loadPowerRangeTemplates();
}

onMounted(() => {
  loadPowerRangeTemplates();
  if (typeof window !== 'undefined') {
    window.addEventListener(PRODUCT_AUX_STORAGE_EVENT, onPowerTemplateStorageSync);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener(PRODUCT_AUX_STORAGE_EVENT, onPowerTemplateStorageSync);
  }
});
</script>

<style scoped>
.power-range-page {
  padding: 0 16px 16px 0;
}
.power-range-page-toolbar {
  margin-top: 14px;
  margin-bottom: 20px;
}
.power-range-page-list-title {
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 14px;
}
.power-range-page-list {
  max-width: 800px;
}
.power-range-tip {
  margin-bottom: 12px;
  font-size: 13px;
  color: red;
}
.power-range-grid-wrap {
  overflow: auto;
  max-height: 600px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}
.power-range-table {
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
  min-width: 980px;
}
.power-range-corner {
  position: sticky;
  left: 0;
  top: 0;
  z-index: 3;
  width: 72px;
  min-width: 72px;
  max-width: 72px;
  padding: 4px 6px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  font-weight: 600;
  white-space: nowrap;
}
.power-range-th {
  position: sticky;
  top: 0;
  z-index: 2;
  min-width: 36px;
  padding: 4px 2px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  font-weight: 600;
  font-size: 12px;
}
.power-range-td-label {
  position: sticky;
  left: 0;
  z-index: 1;
  width: 72px;
  min-width: 72px;
  max-width: 72px;
  padding: 2px 6px;
  background: #fff;
  border: 1px solid #e8e8e8;
  text-align: center;
  white-space: nowrap;
}
.power-range-td {
  min-width: 36px;
  height: 22px;
  padding: 0 4px;
  border: 1px solid #e8e8e8;
  cursor: default;
  user-select: none;
}
.power-range-td.selected {
  background: #bae7ff;
}
.power-range-result {
  margin-top: 12px;
  padding: 8px 12px;
  background: #e6f7ff;
  border-radius: 4px;
  font-size: 13px;
}
.power-range-templates {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
.power-template-table {
  font-size: 12px;
}
</style>
