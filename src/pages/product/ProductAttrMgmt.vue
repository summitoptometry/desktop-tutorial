<template>
  <div class="product-attr-page">
    <a-card :bordered="false" :body-style="{ paddingTop: 0, paddingLeft: 0 }">
      <div class="category-toolbar">
        <a-input
          v-model:value="attrNameInput"
          placeholder="请输入参数名称"
          allow-clear
          style="width: 240px; margin-right: 8px"
          @press-enter="addAttr"
        />
        <a-button type="primary" @click="addAttr">添加</a-button>
      </div>
      <a-table
        :columns="attrColumns"
        :data-source="attrList"
        :pagination="false"
        row-key="id"
        size="small"
        class="category-table"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'description'">
            {{ record.description || '-' }}
          </template>
          <template v-else-if="column.key === 'purchaseParam'">
            <a-button
              v-if="record.paramTypeId !== 2"
              type="link"
              size="small"
              @click="setAsPurchaseParam(record)"
            >
              选择
            </a-button>
            <template v-else>
              <span style="color: #52c41a; margin-right: 8px">已选</span>
              <a-button type="link" size="small" @click="unsetPurchaseParam(record)">取消</a-button>
            </template>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openAttrEdit(record)">编辑</a-button>
              <a-popconfirm
                title="确定删除该参数吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteAttr(record)"
              >
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
      <a-modal
        v-model:visible="attrEditVisible"
        title="编辑参数"
        ok-text="保存"
        cancel-text="取消"
        @ok="submitAttrEdit"
      >
        <a-form layout="vertical">
          <a-form-item label="参数名称">
            <a-input v-model:value="attrEditName" placeholder="请输入参数名称" />
          </a-form-item>
          <a-form-item label="参数说明">
            <a-textarea
              v-model:value="attrEditDescription"
              placeholder="请输入对参数的说明文字"
              :rows="3"
              allow-clear
            />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';

const ATTR_STORAGE_KEY = 'ProductAttributeData';
const PARAM_TYPE_PURCHASE_ID = 2; // 采购参数类型 id，与采购弹窗筛选一致

const attrNameInput = ref('');
const attrList = ref([]);
const attrColumns = [
  { title: '序号', key: 'index', width: 80, align: 'center' },
  { title: '参数名称', dataIndex: 'name', key: 'name', width: 120 },
  { title: '参数说明', dataIndex: 'description', key: 'description', width: 320, ellipsis: true },
  { title: '采购参数', key: 'purchaseParam', width: 120, align: 'center' },
  { title: '操作', key: 'action', width: 160 }
];
const attrEditVisible = ref(false);
const attrEditName = ref('');
const attrEditDescription = ref('');
const attrEditingId = ref(null);

const loadAttrList = () => {
  const raw = localStorage.getItem(ATTR_STORAGE_KEY);
  attrList.value = raw ? JSON.parse(raw) : [];
};

const saveAttrList = (list) => {
  localStorage.setItem(ATTR_STORAGE_KEY, JSON.stringify(list));
  loadAttrList();
};

const addAttr = () => {
  const name = (attrNameInput.value || '').trim();
  if (!name) {
    message.warning('请输入参数名称');
    return;
  }
  const list = [...attrList.value];
  if (list.some((item) => item.name === name)) {
    message.warning('该参数已存在');
    return;
  }
  const newId = list.length ? Math.max(...list.map((a) => a.id)) + 1 : 1;
  list.push({ id: newId, name, description: '', paramTypeId: undefined });
  saveAttrList(list);
  attrNameInput.value = '';
  message.success('添加成功');
};

const openAttrEdit = (record) => {
  attrEditingId.value = record.id;
  attrEditName.value = record.name;
  attrEditDescription.value = record.description || '';
  attrEditVisible.value = true;
};

const submitAttrEdit = () => {
  const name = (attrEditName.value || '').trim();
  if (!name) {
    message.warning('请输入参数名称');
    return;
  }
  const description = (attrEditDescription.value || '').trim();
  const list = attrList.value.map((a) =>
    a.id === attrEditingId.value ? { ...a, name, description } : a
  );
  saveAttrList(list);
  attrEditVisible.value = false;
  attrEditingId.value = null;
  message.success('保存成功');
};

const deleteAttr = (record) => {
  const list = attrList.value.filter((a) => a.id !== record.id);
  saveAttrList(list);
  message.success('已删除');
};

function setAsPurchaseParam(record) {
  const list = attrList.value.map((a) => (a.id === record.id ? { ...a, paramTypeId: PARAM_TYPE_PURCHASE_ID } : a));
  saveAttrList(list);
  message.success('已设为采购参数，采购弹窗中需填写该项');
}

function unsetPurchaseParam(record) {
  const list = attrList.value.map((a) => (a.id === record.id ? { ...a, paramTypeId: undefined } : a));
  saveAttrList(list);
  message.success('已取消采购参数');
}

onMounted(() => {
  loadAttrList();
});
</script>

<style scoped>
.product-attr-page {
  padding: 0 16px 16px 0;
}
.category-toolbar {
  margin-top: 14px;
  margin-bottom: 20px;
}
.category-table {
  font-size: 12px;
}
</style>
