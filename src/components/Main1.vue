<template>
  <a-layout style="min-height: 100vh;">
    <!-- 顶部 title 区域 -->
    <a-layout-header style="background: #fff; border-bottom: 1px solid #f0f0f0; padding: 0 16px;">
      <div class="title-container">
        <div class="logo" style="display: flex; align-items: center;">
          <img src="../assets/icons/eye.svg" alt="Logo" height="32" />
          <span class="app-title">眼科管理系统</span>
        </div>
        <div class="user-info">
          <a-button type="link" @click="showSettings">
            <template #icon><SettingOutlined /></template>
            系统设置
          </a-button>
          <a-button type="link" @click="showPermissionManagement">
            <template #icon><TeamOutlined /></template>
            权限管理
          </a-button>
          <span>欢迎，{{ organizationName }}</span>
          <a-button type="link" @click="logout">退出登录</a-button>
        </div>
      </div>
    </a-layout-header>

    <!-- 中间的 mainpage 区域 -->
    <a-layout>
      <!-- 左侧导航栏（默认收缩，鼠标悬停后展开） -->
      <a-layout-sider 
         width="200" 
         style="background: #fff;"
         :collapsed="collapsed"
         collapsible
         collapsedWidth="80"
         @mouseenter="handleSiderMouseEnter" 
         @mouseleave="handleSiderMouseLeave">
        <a-menu 
          mode="inline" 
          :selectedKeys="[selectedKey]" 
          :openKeys="menuOpenKeys"
          @click="handleMenuClick">
          <!-- 工作台，无二级菜单 -->
          <a-menu-item v-if="hasPermission('dashboard')" key="dashboard">
            <template #icon>
              <DashboardOutlined />
            </template>
            <span>工作台</span>
          </a-menu-item>
          <!-- 患者管理 -->
          <a-sub-menu v-if="hasAnyPatientPermission()" key="patient">
            <template #icon>
              <UsergroupAddOutlined />
            </template>
            <template #title>患者管理</template>
            <a-menu-item v-if="hasPermission('patient-list')" key="patient-list">患者列表</a-menu-item>
            <a-menu-item v-if="hasPermission('patient-check')" key="patient-check">复查管理</a-menu-item>
            <a-menu-item v-if="hasPermission('patient-appointment')" key="patient-appointment">预约管理</a-menu-item>
          </a-sub-menu>
          <!-- 检查管理 -->
          <a-sub-menu v-if="hasAnyExaminationPermission()" key="examination">
            <template #icon>
              <FileSearchOutlined />
            </template>
            <template #title>检查管理</template>
            <a-menu-item v-if="hasPermission('examination-1')" key="examination-1">快速复查</a-menu-item>
            <a-menu-item v-if="hasPermission('examination-2')" key="examination-2">检查档案</a-menu-item>
            <a-menu-item v-if="hasPermission('examination-3')" key="examination-3">检查管理3</a-menu-item>
          </a-sub-menu>
        </a-menu>
      </a-layout-sider>
      <!-- 主内容 -->
      <a-layout-content style="margin: 16px;">
        <!-- Tabbar 展示所有打开的标签页，可关闭 -->
        <a-tabs v-model:activeKey="activeTabId" type="editable-card" hideAdd @edit="onTabEdit" @tabClick="onMainTabClick">
          <a-tab-pane v-for="tab in openedTabs" :key="tab.id" :tab="tab.title" closable />
        </a-tabs>
        <!-- 子标签页（如果当前激活的主标签页有子标签页） -->
        <div v-if="activeTab && activeTab.subTabs && activeTab.subTabs.length > 0" class="sub-tabs-container">
          <a-tabs 
            v-model:activeKey="activeTab.activeSubTabId" 
            type="editable-card" 
            hideAdd 
            @edit="onSubTabEdit" 
            size="small"
            class="sub-tabs"
          >
            <a-tab-pane
              v-for="subTab in activeTab.subTabs"
              :key="subTab.id"
              :tab="subTab.title"
              :closable="subTab.closable !== false"
            />
          </a-tabs>
        </div>
        <!-- 根据当前激活的标签页动态加载页面组件 -->
        <div style="margin-top: 16px;">
          <keep-alive>
            <component
              v-if="currentComponent"
              :is="currentComponent.component"
              :key="currentComponent.id"
              v-bind="currentComponent.props"
              @open-new-tab="handleOpenNewTab"
              @view-patient="handleViewPatient"
            />
          </keep-alive>
        </div>
      </a-layout-content>
    </a-layout>

    <!-- 底部 footer 区域 -->
    <a-layout-footer style="text-align: center; border-top: 0px solid #f0f0f0;">
      版权所有 © 2023 眼科产品管理系统
    </a-layout-footer>

    <!-- 系统设置模态框 -->
    <a-modal
      v-model:visible="settingsVisible"
      title="系统设置"
      @ok="handleSettingsOk"
      @cancel="handleSettingsCancel"
      width="600px"
    >
      <a-form :model="settingsForm" layout="vertical">
        <a-form-item label="机构Logo">
          <a-upload
            v-model:file-list="fileList"
            :before-upload="beforeUpload"
            list-type="picture-card"
            :max-count="1"
          >
            <div v-if="fileList.length < 1">
              <plus-outlined />
              <div style="margin-top: 8px">上传</div>
            </div>
          </a-upload>
        </a-form-item>
        <a-form-item label="机构打印名称">
          <a-input v-model:value="settingsForm.printName" placeholder="请输入机构打印名称" />
        </a-form-item>
        <a-form-item label="机构复查周期">
          <a-select
            v-model:value="settingsForm.checkCycle"
            style="width: 200px"
            placeholder="请选择复查周期"
          >
            <a-select-option :value="1">一个月</a-select-option>
            <a-select-option :value="2">两个月</a-select-option>
            <a-select-option :value="3">三个月</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 权限管理模态框 -->
    <a-modal
      v-model:visible="permissionManagementVisible"
      title="权限管理"
      @ok="handlePermissionManagementOk"
      @cancel="handlePermissionManagementCancel"
      width="800px"
      class="permission-management"
    >
      <div style="margin-bottom: 20px;">
        <a-button type="primary" @click="showAddMemberModal">
          <template #icon><PlusOutlined /></template>
          添加成员
        </a-button>
      </div>
      
      <!-- 成员列表 -->
      <div style="margin-bottom: 20px;" class="member-list">
        <h4>成员列表</h4>
        <a-table 
          :columns="memberColumns" 
          :data-source="memberList" 
          :pagination="false"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-button 
                type="link" 
                danger 
                size="small" 
                @click="deleteMember(record.id)"
                :disabled="record.is_owner"
              >
                删除
              </a-button>
            </template>
            <template v-else-if="column.key === 'permissions'">
              <a-tag 
                v-for="perm in record.permissions" 
                :key="perm" 
                color="blue"
                style="margin: 2px;"
              >
                {{ getPermissionLabel(perm) }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </div>
      
      <a-divider />
      
      <div>
        <h4>权限设置</h4>
        <a-checkbox-group v-model:value="selectedPermissions" style="width: 100%;">
          <a-row :gutter="[16, 16]">
            <a-col :span="8" v-for="permission in permissions" :key="permission.key">
              <a-checkbox :value="permission.key">{{ permission.label }}</a-checkbox>
            </a-col>
          </a-row>
        </a-checkbox-group>
      </div>
    </a-modal>

    <!-- 添加成员模态框 -->
    <a-modal
      v-model:visible="addMemberVisible"
      title="添加成员"
      @ok="handleAddMemberOk"
      @cancel="handleAddMemberCancel"
      width="500px"
    >
      <a-form :model="addMemberForm" layout="vertical">
        <a-form-item label="用户名" required>
          <a-input v-model:value="addMemberForm.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="密码" required>
          <a-input-password v-model:value="addMemberForm.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item label="确认密码" required>
          <a-input-password v-model:value="addMemberForm.confirmPassword" placeholder="请确认密码" />
        </a-form-item>
        <a-form-item label="角色权限">
          <a-checkbox-group v-model:value="addMemberForm.permissions">
            <a-row :gutter="[16, 16]">
              <a-col :span="12" v-for="permission in permissions" :key="permission.key">
                <a-checkbox :value="permission.key">{{ permission.label }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-layout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import axios from 'axios';
import { 
  DashboardOutlined, 
  UsergroupAddOutlined, 
  FileSearchOutlined, 
  SettingOutlined,
  PlusOutlined,
  TeamOutlined
} from '@ant-design/icons-vue';
import Workbench from '../pages/Workbench.vue'
import PatientList from '../pages/PatientList.vue'
import PatientCheck from '../pages/PatientCheck.vue'
import PatientCheckSubView from '../pages/patient-check/PatientCheckSubView.vue'
import PatientAppointment from '../pages/PatientAppointment.vue'
import Examination1 from '../pages/Examination1.vue'
import Examination2 from '../pages/Examination2.vue'
import Examination3 from '../pages/Examination3.vue'
import Newrecord from '../pages/Newrecord.vue'
import ViewPatient from '../pages/ViewPatient.vue'
import Patient from '../pages/Patient.vue'
import PatientSales from '../pages/PatientSales.vue'
import { Modal } from 'ant-design-vue';

const organizationName = ref('');
const selectedKey = ref('dashboard');
const router = useRouter();
const collapsed = ref(true);

// 页面映射，key 为左侧菜单项点击时传入的标识，对应页面标题和组件
const pageMapping = {
  dashboard: { title: '工作台', component: Workbench },
  'patient-list': { title: '患者列表', component: PatientList },
  'patient-check': { title: '复查管理', component: PatientCheck },
  'patient-appointment': { title: '预约管理', component: PatientAppointment },
  'examination-1': { title: '快速复查', component: Examination1 },
  'examination-2': { title: '检查档案', component: Examination2 },
  'examination-3': { title: '检查管理3', component: Examination3 },
  'newrecord': { title: '新增检查记录', component: Newrecord },
  'view-patient': { title: '查看患者信息', component: ViewPatient },
  'patient': { title: '患者主页', component: Patient },
  'patient-sales': { title: '销售开单', component: PatientSales },
  'sales': { title: '销售开单', component: PatientSales },
}

function buildPatientCheckSubTabs(parentTabId) {
  return [
    { id: `${parentTabId}-pc-routine`, key: 'patient-check-routine', title: '常规复查', component: PatientCheckSubView, props: { variant: 'routine' }, closable: false },
    { id: `${parentTabId}-pc-glasses`, key: 'patient-check-glasses', title: '配镜复查', component: PatientCheckSubView, props: { variant: 'glasses' }, closable: false },
    { id: `${parentTabId}-pc-rgp`, key: 'patient-check-rgp', title: '硬镜复查', component: PatientCheckSubView, props: { variant: 'rgp' }, closable: false },
  ];
}

function ensurePatientCheckSubTabs(tab) {
  if (!tab || tab.key !== 'patient-check') return;
  if (!tab.subTabs || tab.subTabs.length === 0) {
    tab.subTabs = buildPatientCheckSubTabs(tab.id);
    tab.activeSubTabId = tab.subTabs[0].id;
  } else if (!tab.activeSubTabId) {
    tab.activeSubTabId = tab.subTabs[0].id;
  }
}

// 标签页存储数组和当前激活标签 id
const openedTabs = ref([]);
const activeTabId = ref('');

// 新增标签页函数，避免重复标签（如果已存在相同key的标签页，则切换到该标签页）
// parentTabId: 如果提供，则创建子标签页；否则创建主标签页
   function addTab(pageKey, extraProps = {}, parentTabId = null) {
     // 检查权限（除了特殊页面如 newrecord, view-patient, patient, sales 等）
     const specialPages = ['newrecord', 'view-patient', 'patient', 'sales', 'patient-sales'];
     if (!specialPages.includes(pageKey) && !hasPermission(pageKey)) {
       message.warning('您没有权限访问此功能');
       return;
     }
     
     const config = pageMapping[pageKey];
     if (!config) {
       console.log('未配置的页面:', pageKey);
       return;
     }

     // 检查是否已存在相同 key 的标签页（对于特殊页面，需要检查是否有相同的患者ID）
     let existingTab = null;
     
     if (specialPages.includes(pageKey)) {
       // 特殊页面：需要检查是否有相同的患者ID
       if (pageKey === 'newrecord' && extraProps.record && extraProps.record.id) {
         existingTab = openedTabs.value.find(tab => 
           tab.key === pageKey && 
           tab.props && tab.props.record && tab.props.record.id === extraProps.record.id
         );
       } else if (pageKey === 'view-patient' && extraProps.record && extraProps.record.id) {
         existingTab = openedTabs.value.find(tab => 
           tab.key === pageKey && 
           tab.props && tab.props.record && tab.props.record.id === extraProps.record.id
         );
       } else if (pageKey === 'patient' && extraProps.record && extraProps.record.patient && extraProps.record.patient.id) {
         existingTab = openedTabs.value.find(tab => 
           tab.key === pageKey && 
           tab.props && tab.props.record && tab.props.record.patient && 
           tab.props.record.patient.id === extraProps.record.patient.id
         );
       } else if (pageKey === 'sales' && extraProps.salesRecord && extraProps.salesRecord.id) {
         existingTab = openedTabs.value.find(tab => 
           tab.key === pageKey && 
           tab.props && tab.props.salesRecord && tab.props.salesRecord.id === extraProps.salesRecord.id
         );
       }
     } else {
       // 普通页面：只检查 key 是否相同
       existingTab = openedTabs.value.find(tab => tab.key === pageKey);
     }

     // 如果已存在相同的标签页，则切换到该标签页
     if (existingTab) {
       activeTabId.value = existingTab.id;
       // 如果传入了新的 props，更新标签页的 props
       if (Object.keys(extraProps).length > 0) {
         existingTab.props = { ...existingTab.props, ...extraProps };
       }
       if (pageKey === 'patient-check') {
         ensurePatientCheckSubTabs(existingTab);
       }
       return;
     }

    // 如果是创建子标签页
    if (parentTabId) {
      const parentTab = openedTabs.value.find(tab => tab.id === parentTabId);
      if (!parentTab) {
        console.error('父标签页不存在:', parentTabId);
        return;
      }
      
      // 初始化父标签页的 subTabs 数组（如果不存在）
      if (!parentTab.subTabs) {
        parentTab.subTabs = [];
        parentTab.activeSubTabId = '';
      }
      
      // 检查子标签页是否已存在（对于特殊页面，检查患者ID）
      let existingSubTab = null;
      if (specialPages.includes(pageKey)) {
        if (pageKey === 'patient' && extraProps.record) {
          // 检查患者ID，可能在 patient_id 或 patient.id 中
          const patientId = extraProps.record.patient_id || (extraProps.record.patient && extraProps.record.patient.id);
          if (patientId) {
            existingSubTab = parentTab.subTabs.find(subTab => {
              if (subTab.key === pageKey && subTab.props && subTab.props.record) {
                const subTabPatientId = subTab.props.record.patient_id || (subTab.props.record.patient && subTab.props.record.patient.id);
                return subTabPatientId === patientId;
              }
              return false;
            });
          }
        }
      } else {
        existingSubTab = parentTab.subTabs.find(subTab => subTab.key === pageKey);
      }
      
      // 如果子标签页已存在，切换到该子标签页
      if (existingSubTab) {
        console.log('找到已存在的患者子标签页，切换到该标签页:', existingSubTab.id);
        parentTab.activeSubTabId = existingSubTab.id;
        activeTabId.value = parentTabId; // 确保父标签页是激活的
        // 更新子标签页的 props（如果有新的数据）
        if (Object.keys(extraProps).length > 0) {
          existingSubTab.props = { ...existingSubTab.props, ...extraProps };
        }
        return; // 直接返回，不创建新的子标签页
      }
      
      // 创建新的子标签页
      const newSubTab = {
        id: 'subtab-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        key: pageKey,
        title: config.title,
        component: config.component,
        props: extraProps
      };
      
      // 设置子标签页标题
      if (pageKey === 'patient' && extraProps.record && extraProps.record.patient && extraProps.record.patient.name) {
        newSubTab.title = extraProps.record.patient.name;
      }
      
      // 子标签页最多容纳5个，超过时移除最旧的（按时间推移）
      const MAX_SUB_TABS = 5;
      if (parentTab.subTabs.length >= MAX_SUB_TABS) {
        // 移除最旧的子标签页（数组第一个元素）
        const removedSubTab = parentTab.subTabs.shift();
        // 如果移除的是当前激活的子标签页，需要更新激活状态
        if (removedSubTab && removedSubTab.id === parentTab.activeSubTabId) {
          // 如果还有子标签页，激活第一个
          if (parentTab.subTabs.length > 0) {
            parentTab.activeSubTabId = parentTab.subTabs[0].id;
          } else {
            parentTab.activeSubTabId = '';
          }
        }
      }
      
      // 添加新的子标签页
      parentTab.subTabs.push(newSubTab);
      parentTab.activeSubTabId = newSubTab.id;
      activeTabId.value = parentTabId; // 确保父标签页是激活的
      return;
    }
    
    // 如果不存在，创建新主标签页
     const newTab = {
       id: 'tab-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
       key: pageKey,
       title: config.title, // 默认标题
       component: config.component,
      props: extraProps,
      subTabs: [], // 初始化子标签页数组
      activeSubTabId: '' // 当前激活的子标签页ID
     };

     // 如果是新增检查记录页面且传入了 record，则将标题修改为"新增检查记录-患者姓名"
     if (pageKey === 'newrecord' && extraProps.record && extraProps.record.name) {
       newTab.title = `新增检查记录-${extraProps.record.name}`;
     }

     // 如果是查看患者信息页面且传入了 record，则将标题修改为"查看患者信息-患者姓名"
     if (pageKey === 'view-patient' && extraProps.record && extraProps.record.name) {
       newTab.title = `查看患者信息-${extraProps.record.name}`;
     }

     // 添加对 patient 页面的标题处理
     if (pageKey === 'patient' && extraProps.record && extraProps.record.patient && extraProps.record.patient.name) {
       newTab.title = `患者主页-${extraProps.record.patient.name}`;
     }

     // 添加对销售开单页面的特殊处理
     if (pageKey === 'sales' && extraProps.salesRecord) {
       console.log('处理销售开单数据:', extraProps.salesRecord);
       newTab.title = `销售开单-${extraProps.salesRecord.name}`;
       // 将销售开单数据存储到sessionStorage
       const salesData = {
         patientInfo: extraProps.salesRecord,
         salesItems: [],
         totalAmount: 0,
         createTime: new Date().toISOString()
       };
       sessionStorage.setItem(`sales_${newTab.id}`, JSON.stringify(salesData));
     }

    // 标签页最多容纳5个，超过时移除最旧的标签页（按时间推移）
    const MAX_TABS = 5;
    if (openedTabs.value.length >= MAX_TABS) {
      // 移除最旧的标签页（数组第一个元素）
      const removedTab = openedTabs.value.shift();
      // 如果移除的是当前激活的标签页，需要更新激活状态
      if (removedTab && removedTab.id === activeTabId.value) {
        // 如果还有标签页，激活第一个
        if (openedTabs.value.length > 0) {
          activeTabId.value = openedTabs.value[0].id;
        } else {
          activeTabId.value = '';
        }
      }
    }

     if (pageKey === 'patient-check') {
       ensurePatientCheckSubTabs(newTab);
     }

     openedTabs.value.push(newTab);
     activeTabId.value = newTab.id;
   }

// 获取机构权限
const getOrganizationPermissions = () => {
  const orgStr = localStorage.getItem('organization');
  if (!orgStr) return [];
  
  try {
    const org = JSON.parse(orgStr);
    return org.permissions || [];
  } catch (error) {
    console.error('解析机构信息失败:', error);
    return [];
  }
};

// 检查是否有权限
const hasPermission = (permissionCode) => {
  const permissions = getOrganizationPermissions();
  return permissions.includes(permissionCode);
};

// 检查是否有患者管理相关权限
const hasAnyPatientPermission = () => {
  return hasPermission('patient-list') || hasPermission('patient-check') || hasPermission('patient-appointment');
};

// 检查是否有检查管理相关权限
const hasAnyExaminationPermission = () => {
  return hasPermission('examination-1') || hasPermission('examination-2') || hasPermission('examination-3');
};


// 修改左侧菜单的点击处理，点击后新增标签页
function handleMenuClick({ key }) {
  // 检查权限
  if (!hasPermission(key)) {
    message.warning('您没有权限访问此功能');
    return;
  }
  
  selectedKey.value = key;
  addTab(key);
  console.log('切换选项卡：', key);
}

// Tab 编辑事件，主要处理关闭标签页
function onTabEdit(targetKey, action) {
  if (action === 'remove') {
    removeTab(targetKey);
  }
}

// 清除当前激活标签页的子标签页激活状态
function clearActiveSubTab() {
  if (activeTabId.value) {
    const tab = openedTabs.value.find(tab => tab.id === activeTabId.value);
    if (tab && tab.activeSubTabId) {
      // 清除子标签页的激活状态，这样就会显示主标签页内容
      tab.activeSubTabId = '';
    }
  }
}

// 主标签页点击事件，当用户点击主标签页时，清除子标签页的激活状态
function onMainTabClick(activeKey) {
  clearActiveSubTab();
}

// 监听主标签页切换，当切换主标签页时，清除子标签页的激活状态，显示主标签页内容
watch(activeTabId, (newTabId) => {
  if (newTabId) {
    // 切换标签页时也清除子标签页的激活状态
    clearActiveSubTab();
  }
});

function removeTab(targetKey) {
  const tabs = openedTabs.value;
  let newActiveKey = activeTabId.value;
  if (newActiveKey === targetKey) {
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].id === targetKey) {
        const nextTab = tabs[i + 1] || tabs[i - 1];
        if (nextTab) {
          newActiveKey = nextTab.id;
        }
        break;
      }
    }
  }
  openedTabs.value = tabs.filter(tab => tab.id !== targetKey);
  activeTabId.value = newActiveKey;
}

// 计算当前激活标签对应的页面对象
const activeTab = computed(() => {
  return openedTabs.value.find(tab => tab.id === activeTabId.value);
});

// 计算当前激活的子标签页
const activeSubTab = computed(() => {
  if (!activeTab.value || !activeTab.value.subTabs || !activeTab.value.activeSubTabId) {
    return null;
  }
  return activeTab.value.subTabs.find(subTab => subTab.id === activeTab.value.activeSubTabId);
});

// 计算当前应该显示的组件（优先显示子标签页，否则显示主标签页）
const currentComponent = computed(() => {
  if (activeSubTab.value && activeSubTab.value.component) {
    return activeSubTab.value;
  }
  if (activeTab.value && activeTab.value.component) {
    return activeTab.value;
  }
  return null;
});

// 子标签页编辑事件，主要处理关闭子标签页
function onSubTabEdit(targetKey, action) {
  if (action === 'remove') {
    removeSubTab(targetKey);
  }
}

function removeSubTab(targetKey) {
  if (!activeTab.value || !activeTab.value.subTabs) {
    return;
  }
  
  const subTabs = activeTab.value.subTabs;
  let newActiveSubTabId = activeTab.value.activeSubTabId;
  
  if (newActiveSubTabId === targetKey) {
    for (let i = 0; i < subTabs.length; i++) {
      if (subTabs[i].id === targetKey) {
        const nextSubTab = subTabs[i + 1] || subTabs[i - 1];
        if (nextSubTab) {
          newActiveSubTabId = nextSubTab.id;
        } else {
          newActiveSubTabId = '';
        }
        break;
      }
    }
  }
  
  activeTab.value.subTabs = subTabs.filter(subTab => subTab.id !== targetKey);
  activeTab.value.activeSubTabId = newActiveSubTabId;
}

// 页面加载时默认打开工作台标签页
onMounted(() => {
  organizationName.value = localStorage.getItem('organization_name') || '用户';
  console.log('加载机构信息：', organizationName.value);
  if (openedTabs.value.length === 0) {
    addTab('dashboard');
  }
  
  // 监听工作台发出的打开新标签页事件
  window.addEventListener('open-new-tab', (event) => {
    const { key } = event.detail;
    addTab(key);
  });
});

// 退出登录，清除本地存储并通知用户
const emit = defineEmits(["logout"]);

async function logout() {
  // 先清空所有打开的标签页
  openedTabs.value = [];
  activeTabId.value = '';
  
  // 只清除自动登录相关信息，保留机构ID和数据缓存
  localStorage.removeItem('loginInfo');
  // 注意：不清除 organization_id，保留用于下次登录时的缓存对比
  // 注意：不清除 checkmanagementlist 和 patientlist，保留数据缓存
  // 注意：不清除 csrftoken，保留用于API请求
  
  message.info('已退出登录');
  console.log('用户已退出登录');
  
  // 触发logout事件
  emit('logout');
  
  // 使用路由导航到登录页
  try {
    await router.push('/login');
  } catch (error) {
    console.error('路由跳转失败:', error);
  }
}

function handleSiderMouseEnter() {
  collapsed.value = false;
  console.log("展开导航栏");
}

function handleSiderMouseLeave() {
  collapsed.value = true;
  console.log("收缩导航栏");
}

// 修改菜单展开状态的计算属性
const menuOpenKeys = computed(() => {
  if (collapsed.value) {
    return [];
  }
  return ['patient', 'examination'];
});

   function handleOpenNewTab(record) {
     // 根据传入的key决定打开哪个页面
     if (record.key === 'sales') {
       console.log('Main.vue接收到的销售数据:', record);
       addTab('sales', { salesRecord: record.salesRecord });
     } else {
       // 默认打开新增检查记录页面
     addTab('newrecord', { record: record });
     }
   }

   function handleViewPatient(record) {
     console.log('处理查看患者:', record);
     // 如果当前有激活的主标签页，在该标签页下创建子标签页
     if (activeTabId.value) {
       addTab('patient', { record }, activeTabId.value);
     } else {
       // 如果没有激活的主标签页，创建新的主标签页
     addTab('patient', { record });
     }
   }

// 系统设置相关
const settingsVisible = ref(false);
const fileList = ref([]);
const settingsForm = ref({
  printName: '',
  checkCycle: 1,  // 默认值设为1（一个月）
  logoUrl: ''      // 添加logoUrl字段
});

const API_BASE_URL = 'https://aiforoptometry.com';

const showSettings = async () => {
  settingsVisible.value = true;
  try {
    const orgId = localStorage.getItem('organization_id');
    if (!orgId) {
      message.error('未找到机构ID');
      return;
    }

    // 从后端获取最新的机构设置
    const response = await axios.get(`${API_BASE_URL}/organization/detail/${orgId}/`);
    
    if (response.data.code === 200) {
      const orgData = response.data.data;
      
      // 更新表单数据
      settingsForm.value = {
        printName: orgData.print_name || '',
        checkCycle: orgData.review_interval_days || 1,
        logoUrl: orgData.logo || ''
      };

      // 更新文件列表
      if (orgData.logo) {
        fileList.value = [{
          uid: '-1',
          name: 'logo.png',
          status: 'done',
          url: orgData.logo
        }];
      } else {
        fileList.value = [];
      }

      // 更新本地存储，保存所有机构信息
      const systemSettings = {
        // 表单相关设置
        printName: orgData.print_name || '',
        checkCycle: orgData.review_interval_days || 1,
        logoUrl: orgData.logo || '',
        
        // 机构基本信息
        id: orgData.id,
        name: orgData.name,
        contact: orgData.contact,
        created_date: orgData.created_date,
        expiration_date: orgData.expiration_date,
        status: orgData.status,
        parent_id: orgData.parent_id,
        user_id: orgData.user_id,
        total_patients: orgData.total_patients
      };
      
      localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
    } else {
      message.error(response.data.message || '获取设置失败');
    }
  } catch (error) {
    console.error('获取设置失败:', error);
    message.error('获取设置失败，请稍后重试');
    
    // 如果获取失败，尝试从本地存储加载
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      // 只更新表单相关的设置
      settingsForm.value = {
        printName: settings.printName || '',
        checkCycle: settings.checkCycle || 1,
        logoUrl: settings.logoUrl || ''
      };
      if (settings.logoUrl) {
        fileList.value = [{
          uid: '-1',
          name: 'logo.png',
          status: 'done',
          url: settings.logoUrl
        }];
      }
    }
  }
};

const handleSettingsOk = async () => {
  try {
    const orgId = localStorage.getItem('organization_id');
    if (!orgId) {
      message.error('未找到机构ID');
      return;
    }

    // 创建FormData对象
    const formData = new FormData();
    formData.append('review_interval_days', settingsForm.value.checkCycle);
    formData.append('print_name', settingsForm.value.printName);
    
    // 如果有新的logo文件，添加到formData
    if (fileList.value.length > 0 && fileList.value[0].originFileObj) {
      formData.append('logo', fileList.value[0].originFileObj);
    }

    // 发送请求到后端
    const response = await axios.post(
      `${API_BASE_URL}/organization/update/${orgId}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.code === 200) {
      // 获取最新的完整机构信息
      const detailResponse = await axios.get(`${API_BASE_URL}/organization/detail/${orgId}/`);
      if (detailResponse.data.code === 200) {
        const orgData = detailResponse.data.data;
        
        // 更新本地存储，保存所有机构信息
        const systemSettings = {
          // 表单相关设置
          printName: orgData.print_name || '',
          checkCycle: orgData.review_interval_days || 1,
          logoUrl: orgData.logo || '',
          
          // 机构基本信息
          id: orgData.id,
          name: orgData.name,
          contact: orgData.contact,
          created_date: orgData.created_date,
          expiration_date: orgData.expiration_date,
          status: orgData.status,
          parent_id: orgData.parent_id,
          user_id: orgData.user_id,
          total_patients: orgData.total_patients
        };
        
        localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
        
        // 更新文件列表中的图片URL
        if (orgData.logo) {
          fileList.value = [{
            uid: '-1',
            name: 'logo.png',
            status: 'done',
            url: orgData.logo
          }];
        }
      }
      
      message.success('设置已保存');
      settingsVisible.value = false;
    } else {
      message.error(response.data.message || '保存失败');
    }
  } catch (error) {
    console.error('保存设置失败:', error);
    message.error('保存设置失败，请稍后重试');
  }
};

const handleSettingsCancel = () => {
  // 取消时恢复之前的设置
  const savedSettings = localStorage.getItem('systemSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    settingsForm.value = settings;
    if (settings.logoUrl) {
      fileList.value = [{
        uid: '-1',
        name: 'logo.png',
        status: 'done',
        url: settings.logoUrl
      }];
    } else {
      fileList.value = [];
    }
  }
  settingsVisible.value = false;
};

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件！');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB！');
    return false;
  }
  
  // 保存原始文件对象，用于后续上传
  fileList.value = [{
    uid: '-1',
    name: file.name,
    status: 'done',
    originFileObj: file,
    url: URL.createObjectURL(file)
  }];
  return false; // 阻止自动上传
};

// 权限管理相关
const permissionManagementVisible = ref(false);
const permissionManagementForm = ref({
  roleName: '',
  permissions: []
});

const permissions = ref([
  { key: 'dashboard', label: '工作台' },
  { key: 'patient-list', label: '患者列表' },
  { key: 'patient-check', label: '复查管理' },
  { key: 'patient-appointment', label: '预约管理' },
  { key: 'examination-1', label: '快速复查' },
  { key: 'examination-2', label: '检查档案' },
  { key: 'examination-3', label: '检查管理3' }
]);

const selectedPermissions = ref([]);

// 修改showPermissionManagement函数，同时获取成员列表
const showPermissionManagement = () => {
  permissionManagementVisible.value = true;
  // 初始化已选权限
  const orgId = localStorage.getItem('organization_id');
  if (orgId) {
    // 获取权限设置
    axios.get(`${API_BASE_URL}/organization/permissions/${orgId}/`)
      .then(response => {
        if (response.data.code === 200) {
          selectedPermissions.value = response.data.data.permissions;
        } else {
          message.error(response.data.message || '获取权限失败');
        }
      })
      .catch(error => {
        console.error('获取权限失败:', error);
        message.error('获取权限失败，请稍后重试');
      });
    
    // 获取成员列表
    getMemberList();
  } else {
    message.error('未找到机构ID');
  }
};

const handlePermissionManagementOk = async () => {
  try {
    const orgId = localStorage.getItem('organization_id');
    if (!orgId) {
      message.error('未找到机构ID');
      return;
    }

    const formData = new FormData();
    formData.append('permissions', JSON.stringify(selectedPermissions.value));

    const response = await axios.post(
      `${API_BASE_URL}/organization/update-permissions/${orgId}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.code === 200) {
      message.success('权限已保存');
      permissionManagementVisible.value = false;
    } else {
      message.error(response.data.message || '保存权限失败');
    }
  } catch (error) {
    console.error('保存权限失败:', error);
    message.error('保存权限失败，请稍后重试');
  }
};

const handlePermissionManagementCancel = () => {
  permissionManagementVisible.value = false;
};

// 添加成员相关
const addMemberVisible = ref(false);
const addMemberForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  permissions: []
});

const showAddMemberModal = () => {
  addMemberVisible.value = true;
  addMemberForm.value = {
    username: '',
    password: '',
    confirmPassword: '',
    permissions: []
  };
};

const handleAddMemberOk = async () => {
  // 表单验证
  if (!addMemberForm.value.username.trim()) {
    message.error('请输入用户名！');
    return;
  }
  
  if (!addMemberForm.value.password) {
    message.error('请输入密码！');
    return;
  }
  
  if (addMemberForm.value.password.length < 6) {
    message.error('密码长度不能少于6位！');
    return;
  }
  
  if (addMemberForm.value.password !== addMemberForm.value.confirmPassword) {
    message.error('两次输入的密码不一致！');
    return;
  }

  try {
    const orgId = localStorage.getItem('organization_id');
    if (!orgId) {
      message.error('未找到机构ID');
      return;
    }

    const formData = new FormData();
    formData.append('username', addMemberForm.value.username.trim());
    formData.append('password', addMemberForm.value.password);
    formData.append('permissions', JSON.stringify(addMemberForm.value.permissions));

    const response = await axios.post(
      `${API_BASE_URL}/organization/add-user/${orgId}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.code === 200) {
      message.success('成员添加成功！');
      addMemberVisible.value = false; // 关闭添加成员模态框
      // 刷新成员列表
      getMemberList();
    } else {
      message.error(response.data.message || '添加成员失败');
    }
  } catch (error) {
    console.error('添加成员失败:', error);
    message.error('添加成员失败，请稍后重试');
  }
};

const handleAddMemberCancel = () => {
  addMemberVisible.value = false;
};

// 删除成员
const deleteMember = async (userId) => {
  // 添加确认对话框
  const confirmed = await new Promise((resolve) => {
    const modal = Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个成员吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });

  if (!confirmed) {
    return;
  }

  const orgId = localStorage.getItem('organization_id');
  if (!orgId) {
    message.error('未找到机构ID');
    return;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/organization/delete-user/${orgId}/${userId}/`
    );

    if (response.data.code === 200) {
      message.success('成员删除成功！');
      getMemberList(); // 刷新成员列表
    } else {
      message.error(response.data.message || '删除成员失败');
    }
  } catch (error) {
    console.error('删除成员失败:', error);
    message.error('删除成员失败，请稍后重试');
  }
};

// 获取权限标签
const getPermissionLabel = (key) => {
  const permission = permissions.value.find(p => p.key === key);
  return permission ? permission.label : key;
};

// 成员列表的列定义
const memberColumns = ref([
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
  },
  {
    title: '权限',
    dataIndex: 'permissions',
    key: 'permissions',
  },
  {
    title: '操作',
    key: 'action',
  },
]);

// 成员列表数据
const memberList = ref([]);

// 获取成员列表
const getMemberList = async () => {
  const orgId = localStorage.getItem('organization_id');
  if (!orgId) {
    message.error('未找到机构ID');
    return;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/organization/users/${orgId}/`);
    if (response.data.code === 200) {
      memberList.value = response.data.data.users;
    } else {
      message.error(response.data.message || '获取成员列表失败');
    }
  } catch (error) {
    console.error('获取成员列表失败:', error);
    message.error('获取成员列表失败，请稍后重试');
  }
};


</script>

<style scoped>
.logo img {
  height: 32px;
}
.title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.app-title {
  margin-left: 10px;
  font-size: 20px;
  font-weight: bold;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.ant-upload-select {
  width: 128px;
  height: 128px;
}

/* 权限管理相关样式 */
.permission-management {
  .ant-table {
    margin-bottom: 16px;
  }
  
  .ant-tag {
    margin: 2px;
  }
  
  .ant-checkbox-group {
    .ant-row {
      margin-bottom: 8px;
    }
  }
}

.member-list {
  .ant-table-tbody > tr > td {
    padding: 8px 12px;
  }
}

/* 子标签页样式美化 */
.sub-tabs-container {
  margin-top: 8px;
  margin-bottom: 4px;
  padding: 0 4px;
}

:deep(.sub-tabs) {
  .ant-tabs-nav {
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .ant-tabs-tab {
    background: transparent;
    border: none;
    border-radius: 6px;
    margin: 0 2px;
    padding: 6px 16px;
    transition: all 0.3s ease;
    position: relative;
  }

  .ant-tabs-tab:hover {
    background: rgba(226, 114, 68, 0.1);
    color: #E27244;
    transform: translateY(-1px);
  }

  .ant-tabs-tab-active {
    background: linear-gradient(135deg, #E27244 0%, #d85a2e 100%);
    color: #fff;
    box-shadow: 0 2px 8px rgba(226, 114, 68, 0.3);
    font-weight: 500;
  }

  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #fff;
    font-size: 13px;
  }

  .ant-tabs-tab:not(.ant-tabs-tab-active) .ant-tabs-tab-btn {
    color: #666;
    font-size: 13px;
  }

  .ant-tabs-ink-bar {
    display: none;
  }

  .ant-tabs-tab-remove {
    color: rgba(255, 255, 255, 0.8);
    margin-left: 8px;
    transition: all 0.2s ease;
  }

  .ant-tabs-tab-remove:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
  }

  .ant-tabs-tab:not(.ant-tabs-tab-active) .ant-tabs-tab-remove {
    color: #999;
  }

  .ant-tabs-tab:not(.ant-tabs-tab-active) .ant-tabs-tab-remove:hover {
    color: #E27244;
    background: rgba(226, 114, 68, 0.1);
  }
}

/* 子标签页内容样式 */
.sub-tab-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.sub-tab-title {
  font-weight: 500;
}

.sub-tab-tag {
  margin: 0;
  font-size: 11px;
  padding: 2px 6px;
  line-height: 1.4;
  border-radius: 3px;
}

:deep(.sub-tabs .ant-tabs-tab-active) {
  .sub-tab-tag {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
  }
}

:deep(.sub-tabs .ant-tabs-tab:not(.ant-tabs-tab-active)) {
  .sub-tab-tag {
    opacity: 0.8;
  }
}
</style>
