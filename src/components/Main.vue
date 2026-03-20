<template>
  <div class="main-wrapper">
    <a-layout style="min-height: 100vh;background: transparent">
      <!-- 顶部 title 区域 -->
      <a-layout-header style="background: transparent; padding: 0 16px;">
        <div class="title-container">
          <div class="logo" style="display: flex; align-items: center;">
            <img src="@/assets/logo.png" alt="Logo"/>
            <span class="app-title">眼科管理系统</span>
          </div>
          <div class="user-info">
            <!-- 网络状态指示器 -->
            <div class="network-status" :class="networkStatusClass" style="margin-right: 12px;">
              <a-tooltip :title="networkStatusText">
                <span class="network-indicator"></span>
                <span style="margin-left: 4px; font-size: 12px;">{{ networkStatusText }}</span>
              </a-tooltip>
            </div>
            <span>欢迎，{{ currentUserName }}</span>
            <div class="user-info-divider"></div>
            <div 
              v-if="!isSubaccount" 
              class="user-info-setttings" 
              style="display: flex; align-items: center" 
              @click="showSettings"
            >
              <img-icon class="header-title-icon" title="设置"/>
              系统设置
            </div>
            <div 
              v-if="!isSubaccount" 
              class="user-info-permission" 
              style="display: flex; align-items: center" 
              @click="showPermissionManagement"
            >
              <TeamOutlined class="header-title-icon" style="color: #FEFCFF; margin-right: 8px;"/>
              权限管理
            </div>
            <div 
              v-if="!isSubaccount" 
              class="user-info-change-password" 
              style="display: flex; align-items: center" 
              @click="showChangePassword"
            >
              <LockOutlined class="header-title-icon" style="color: #FEFCFF; margin-right: 8px;"/>
              修改密码
            </div>
            <div class="user-info-logout" style="display: flex; align-items: center" @click="logout">
              <img-icon class="header-title-icon" title="退出登录"/>
              退出登录</div>
          </div>
        </div>
      </a-layout-header>

      <!-- 中间的 mainpage 区域 -->
      <a-layout style="background: transparent; position: relative">
        <!-- 左侧导航栏（默认收缩，鼠标悬停后展开） -->
        <a-layout-sider
            class="main-sider"
            style="background: transparent;"
            @mouseenter="handleSiderMouseEnter"
            @mouseleave="handleSiderMouseLeave">
          <a-menu
              style="background: transparent"
              mode="inline"
              :selectedKeys="selectedKey"
              :openKeys="menuOpenKeys"
              @click="handleMenuClick">
            <!-- 工作台，无二级菜单 -->
            <a-menu-item v-if="hasPermission('dashboard')" key="dashboard">
              <template #icon>
                <DashboardOutlined class="menu-parent-icon" :style="{ color: selectedKey.includes('dashboard') ? '#E27244' : '#FEFCFF' }" />
              </template>
              <span>工作台</span>
            </a-menu-item>
            <!-- 超级工作台，仅当organization_id为1时显示 -->
            <a-menu-item v-if="isSuperAdmin" key="super-dashboard">
              <template #icon>
                <CrownOutlined class="menu-parent-icon" :style="{ color: selectedKey.includes('super-dashboard') ? '#E27244' : '#FEFCFF' }" />
              </template>
              <span>超级工作台</span>
            </a-menu-item>
            <!-- 患者管理 -->
            <a-sub-menu v-if="hasAnyPatientPermission()" key="patient">
              <template #icon>
                <TeamOutlined class="menu-parent-icon" :style="{ color: menuOpenKeys[0] === 'patient' ? '#E27244' : '#FEFCFF' }" />
              </template>
              <template #title>患者管理</template>
              <a-menu-item v-if="hasPermission('patient-list')" key="patient-list">患者列表</a-menu-item>
              <a-menu-item v-if="hasPermission('patient-check')" key="patient-check">复查管理</a-menu-item>
              <a-menu-item v-if="hasPermission('patient-appointment')" key="patient-appointment">预约管理</a-menu-item>
            </a-sub-menu>
            <!-- 检查管理 -->
            <a-sub-menu v-if="hasAnyExaminationPermission()" key="examination">
              <template #icon>
                <FileSearchOutlined class="menu-parent-icon" :style="{ color: menuOpenKeys[0] === 'examination' ? '#E27244' : '#FEFCFF' }" />
              </template>
              <template #title>检查管理</template>
              <a-menu-item v-if="hasPermission('examination-1')" key="examination-1">快速复查</a-menu-item>
              <a-menu-item v-if="hasPermission('examination-2')" key="examination-2">检查档案</a-menu-item>
              <a-menu-item v-if="hasPermission('examination-3')" key="examination-3">检查设备</a-menu-item>
            </a-sub-menu>
            <!-- 商品管理 -->
            <a-sub-menu key="product">
              <template #icon>
                <ShoppingOutlined class="menu-parent-icon" :style="{ color: menuOpenKeys[0] === 'product' ? '#E27244' : '#FEFCFF' }" />
              </template>
              <template #title>商品管理</template>
              <a-menu-item key="product-info">商品信息管理</a-menu-item>
              <a-menu-item key="purchase">采购管理</a-menu-item>
              <a-menu-item key="inventory">库存管理</a-menu-item>
              <a-menu-item key="product-sales">销售管理</a-menu-item>
              <a-menu-item key="gsp">GSP管理</a-menu-item>
            </a-sub-menu>
          </a-menu>
        </a-layout-sider>
        <!-- 主内容 -->
        <a-layout-content class="main-content">
          <!-- Tabbar 展示所有打开的标签页，可关闭 -->
          <div class="tabs-container">
            <a-tabs class="main-tabs" v-model:activeKey="activeTabId" type="editable-card" hideAdd @edit="onTabEdit" @tabClick="onMainTabClick">
              <template #rightExtra>
                <a-button 
                  v-if="openedTabs.length > 1" 
                  type="link" 
                  size="small" 
                  @click="closeAllTabs"
                  class="close-all-btn"
                  title="关闭所有标签页"
                >
                  全部关闭
                </a-button>
              </template>
              <a-tab-pane v-for="tab in openedTabs" :key="tab.id" :tab="tab.title">
                <template #closeIcon>
                  <img-icon class="close-icon" title="tab-关闭"/>
                </template>
              </a-tab-pane>
            </a-tabs>
          </div>
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
          <!-- 子页面区域：限制高度，子页面内部滚动，不超出 Main -->
          <div class="main-tab-body">
            <div class="main-tab-body-inner">
            <div class="tab-content-wrapper">
            <!-- 滚动容器：确保所有页面支持鼠标滚轮滚动 -->
            <div class="tab-content-scroll">
            <keep-alive>
              <component
                v-if="currentComponent"
                :is="currentComponent.component"
                :key="currentComponent.id"
                v-bind="currentComponent.props || {}"
                @open-new-tab="handleOpenNewTab"
                @view-patient="handleViewPatient"
              />
            </keep-alive>
            </div>
            </div>
            </div>
          </div>
        </a-layout-content>
      </a-layout>

      <!-- 底部 footer 区域 -->
      <!--      <a-layout-footer style="text-align: center; border-top: 0px solid #f0f0f0;">-->
      <!--        版权所有 © 2023 眼科产品管理系统-->
      <!--      </a-layout-footer>-->

      <!-- 系统设置模态框 -->
      <a-modal
          v-model:visible="settingsVisible"
          title="系统设置"
          @ok="handleSettingsOk"
          @cancel="handleSettingsCancel"
          width="700px"
      >
        <!-- 分页组件 -->
        <a-tabs v-model:activeKey="settingsActiveTab" style="margin-bottom: 20px;" type="card">
          <a-tab-pane key="basic" tab="基本设置">
            <a-form :model="settingsForm" layout="vertical">
              <a-form-item label="机构Logo">
                <a-upload
                    v-model:file-list="fileList"
                    :before-upload="beforeUpload"
                    list-type="picture-card"
                    :max-count="1"
                >
                  <div v-if="fileList.length < 1">
                    <plus-outlined/>
                    <div style="margin-top: 8px">上传</div>
                  </div>
                </a-upload>
              </a-form-item>
              <a-form-item label="机构打印名称">
                <a-input v-model:value="settingsForm.printName" placeholder="请输入机构打印名称"/>
              </a-form-item>
              <a-form-item label="机构联系电话">
                <a-input v-model:value="settingsForm.external_contact" placeholder="请输入机构联系电话"/>
              </a-form-item>
              <a-form-item label="机构地址">
                <a-input v-model:value="settingsForm.address" placeholder="请输入机构地址"/>
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
          </a-tab-pane>
          
          <!-- 新增：更新设置（第二页） -->
          <a-tab-pane key="update" tab="更新设置">
            <a-form :model="settingsForm" layout="vertical">
              <a-form-item label="自动更新模式">
                <a-radio-group v-model:value="settingsForm.autoRefreshMode">
                  <a-radio value="auto">自动更新</a-radio>
                  <a-radio value="manual">手动更新</a-radio>
                </a-radio-group>
              </a-form-item>
              <a-form-item 
                label="自动刷新间隔" 
                v-if="settingsForm.autoRefreshMode === 'auto'"
              >
                <a-input-number
                    v-model:value="settingsForm.autoRefreshInterval"
                    :min="1"
                    :max="60"
                    style="width: 200px"
                    addon-after="分钟"
                    placeholder="请输入刷新间隔"
                />
                <div style="color: #666; font-size: 12px; margin-top: 4px;">
                  建议设置范围：1-60分钟
                </div>
              </a-form-item>
            </a-form>
          </a-tab-pane>
          
          <a-tab-pane key="display" tab="显示设置">
            <a-form :model="displaySettingsForm" layout="vertical">
              <a-form-item label="出生日期显示格式">
                <a-radio-group v-model:value="displaySettingsForm.birthDateDisplayFormat">
                  <a-radio value="date">出生日期</a-radio>
                  <a-radio value="age_int">年龄（整数）</a-radio>
                  <a-radio value="age_decimal">年龄（一位小数）</a-radio>
                </a-radio-group>
                <div style="color: #666; font-size: 12px; margin-top: 4px;">
                  此设置将影响患者列表中年龄列的显示格式，设置会立即生效
                </div>
              </a-form-item>
              
              <a-divider>说明</a-divider>
              <div style="color: #666; font-size: 12px; line-height: 1.6;">
                <p><strong>出生日期：</strong>显示患者的出生日期，格式为 YYYY-MM-DD</p>
                <p><strong>年龄（整数）：</strong>显示患者的年龄，只显示整数部分，如"25岁"</p>
                <p><strong>年龄（一位小数）：</strong>显示患者的年龄，保留一位小数，如"25.3岁"</p>
                <p style="color: #E27244; font-weight: 500;">注意：此设置仅保存在本地，不会上传到服务器</p>
              </div>
            </a-form>
          </a-tab-pane>
          
          <!-- 新增：提醒设置（第四页） -->
          <a-tab-pane key="reminder" tab="提醒设置">
            <a-form :model="displaySettingsForm" layout="vertical">
              <a-form-item label="提前提醒">
                <a-input-number
                    v-model:value="displaySettingsForm.advanceReminderDays"
                    :min="0"
                    :max="365"
                    style="width: 200px"
                    addon-after="天"
                    placeholder="请输入提前提醒天数"
                />
                <div style="color: #666; font-size: 12px; margin-top: 4px;">
                  设置提前多少天显示需要提醒的患者，0天表示当天，设置会立即生效
                </div>
              </a-form-item>
              
              <a-divider>说明</a-divider>
              <div style="color: #666; font-size: 12px; line-height: 1.6;">
                <p><strong>提前提醒：</strong>控制复查管理页面中"需提醒列表"的显示逻辑</p>
                <p><strong>0天：</strong>显示下次复查时间为今天的患者</p>
                <p><strong>7天：</strong>显示下次复查时间为7天后的患者</p>
                <p><strong>示例：</strong>如果今天是2025/8/18，设置7天，则显示下次复查时间为2025/8/25的患者</p>
                <p style="color: #E27244; font-weight: 500;">注意：此设置仅保存在本地，不会上传到服务器</p>
              </div>
            </a-form>
          </a-tab-pane>
          
          <!-- 新增：方案设置（第五页） -->
          <a-tab-pane key="treatment" tab="方案设置">
            <div style="margin-bottom: 20px;">
              <div style="color: #666; font-size: 14px; margin-bottom: 16px;">
                选择您需要的配镜手段、品牌和低强度红光选项，在诊疗方案编辑时会显示这些选项
              </div>
              
              <!-- 配镜手段选择 -->
              <div style="margin-bottom: 24px;">
                <div style="font-weight: 600; margin-bottom: 12px; color: #333; font-size: 16px;">配镜手段</div>
                <a-checkbox-group v-model:value="treatmentSettingsForm.glassesMethods">
                  <a-row :gutter="[16, 8]">
                    <a-col :span="6" v-for="method in ['离焦镜', '点扩散', 'OK镜', '离焦软镜', 'RGP', '单光镜', '渐近镜', '双效离焦点扩散']" :key="method">
                      <a-checkbox :value="method">{{ method }}</a-checkbox>
                    </a-col>
                  </a-row>
                </a-checkbox-group>
              </div>
              
              <!-- 配镜品牌表格 -->
              <div style="margin-bottom: 24px;">
                <div style="font-weight: 600; margin-bottom: 12px; color: #333; font-size: 16px;">配镜品牌</div>
                <a-table 
                  :columns="glassesBrandColumns" 
                  :data-source="glassesBrandData" 
                  :pagination="false"
                  size="small"
                  :scroll="{ x: 800 }"
                  :row-key="record => record.method"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'method'">
                      <div style="font-weight: 500; color: #333;">{{ record.method }}</div>
                    </template>
                    <template v-else-if="column.key === 'brands'">
                      <a-checkbox-group 
                        v-model:value="treatmentSettingsForm.glassesBrands[record.method]"
                        @change="(values) => handleBrandSelectionChange(record.method, values)"
                      >
                        <div style="display: flex; flex-wrap: wrap; gap: 16px 8px;">
                          <div v-for="brand in record.brands" :key="brand" style="width: calc(33.333% - 6px); min-width: 80px;">
                            <a-checkbox :value="brand" style="font-size: 12px;">{{ brand }}</a-checkbox>
                          </div>
                        </div>
                      </a-checkbox-group>
                    </template>
                  </template>
                </a-table>
              </div>
              
              <!-- 低强度红光设备选择 -->
              <div style="margin-bottom: 24px;">
                <div style="font-weight: 600; margin-bottom: 12px; color: #333; font-size: 16px;">低强度红光设备</div>
                <a-checkbox-group v-model:value="treatmentSettingsForm.hgDevices">
                  <a-row :gutter="[128, 8]">
                    <a-col :span="6" v-for="device in ['唯迪科', '小太阳', '三代人', '其他']" :key="device">
                      <a-checkbox :value="device">{{ device }}</a-checkbox>
                    </a-col>
                  </a-row>
                </a-checkbox-group>
              </div>
              
              <!-- 低强度红光档位表格 -->
              <div style="margin-bottom: 24px;">
                <div style="font-weight: 600; margin-bottom: 12px; color: #333; font-size: 16px;">低强度红光档位</div>
                <a-table 
                  :columns="hgLevelColumns" 
                  :data-source="hgLevelData" 
                  :pagination="false"
                  size="small"
                  :scroll="{ x: 600 }"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'device'">
                      <div style="font-weight: 500; color: #333;">{{ record.device }}</div>
                    </template>
                    <template v-else-if="column.key === 'levels'">
                      <div v-if="record.levels.length === 0" style="color: #999; font-size: 12px;">
                        无
                      </div>
                      <a-checkbox-group 
                        v-else
                        v-model:value="treatmentSettingsForm.hgLevels[record.device]"
                        @change="(values) => handleLevelSelectionChange(record.device, values)"
                      >
                        <div style="display: flex; flex-wrap: wrap; gap: 16px 8px;">
                          <div v-for="level in record.levels" :key="level" style="width: calc(16.666% - 6px); min-width: 30px;">
                            <a-checkbox :value="level" style="font-size: 12px;">{{ level }}</a-checkbox>
                          </div>
                        </div>
                      </a-checkbox-group>
                    </template>
                  </template>
                </a-table>
              </div>
            </div>
          </a-tab-pane>
          
          <!-- 新增：患者类型设置（第六页） -->
          <a-tab-pane key="patient-type" tab="患者类型">
            <div style="margin-bottom: 20px;">
              <div style="color: #666; font-size: 14px; margin-bottom: 16px;">
                管理患者类型选项，这些选项将在患者列表中使用。您可以添加、删除或编辑患者类型。
              </div>
              
              <!-- 添加新患者类型 -->
              <div style="margin-bottom: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
                <div style="font-weight: 600; margin-bottom: 12px; color: #333; font-size: 16px;">添加新患者类型</div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <a-input
                    v-model:value="newPatientType"
                    placeholder="请输入患者类型名称"
                    style="width: 300px;"
                    @pressEnter="handleAddPatientType"
                  />
                  <a-button type="primary" @click="handleAddPatientType" :disabled="!newPatientType || newPatientType.trim() === ''">
                    添加
                  </a-button>
                </div>
                <div style="color: #999; font-size: 12px; margin-top: 8px;">
                  提示：患者类型名称不能为空，且不能与现有类型重复
                </div>
              </div>
              
              <!-- 患者类型列表 -->
              <div style="margin-bottom: 24px;">
                <div style="font-weight: 600; margin-bottom: 12px; color: #333; font-size: 16px;">患者类型列表</div>
                <div v-if="settingsForm.patientTypes && settingsForm.patientTypes.length === 0" style="padding: 40px; text-align: center; color: #999;">
                  暂无患者类型，请添加
                </div>
                <a-list
                  v-else
                  :data-source="settingsForm.patientTypes || []"
                  bordered
                >
                  <template #renderItem="{ item, index }">
                    <a-list-item>
                      <template #actions>
                        <a-button type="link" danger size="small" @click="handleDeletePatientType(index)">
                          删除
                        </a-button>
                      </template>
                      <a-list-item-meta>
                        <template #title>
                          <a-input
                            v-if="editingPatientTypeIndex === index"
                            v-model:value="editingPatientTypeValue"
                            @pressEnter="handleSavePatientType(index)"
                            @blur="handleSavePatientType(index)"
                            style="width: 200px;"
                            ref="editingInputRef"
                          />
                          <span v-else style="font-size: 14px; color: #333;">{{ item }}</span>
                        </template>
                      </a-list-item-meta>
                      <template v-if="editingPatientTypeIndex !== index">
                        <a-button type="link" size="small" @click="handleEditPatientType(index)">
                          编辑
                        </a-button>
                      </template>
                    </a-list-item>
                  </template>
                </a-list>
              </div>
              
              <a-divider>说明</a-divider>
              <div style="color: #666; font-size: 12px; line-height: 1.6;">
                <p><strong>患者类型：</strong>用于在患者列表中分类和管理患者</p>
                <p><strong>添加：</strong>输入患者类型名称后点击"添加"按钮</p>
                <p><strong>编辑：</strong>点击"编辑"按钮修改患者类型名称，按回车或失去焦点保存</p>
                <p><strong>删除：</strong>点击"删除"按钮移除患者类型（已使用的患者类型仍会保留在患者记录中）</p>
                <p style="color: #E27244; font-weight: 500;">注意：此设置会保存到服务器，所有用户共享</p>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-modal>

      <!-- 权限管理模态框 -->
      <a-modal
          v-model:visible="permissionManagementVisible"
          title="权限管理"
          @cancel="permissionManagementVisible = false"
          width="1200px"
          class="permission-management"
          :footer="null"
      >
        <!-- 标签页切换 -->
        <a-tabs v-model:activeKey="permissionActiveTab" style="margin-bottom: 20px;" type="card">
          <!-- 成员管理标签页 -->
          <a-tab-pane key="members" tab="成员管理">
            <!-- 顶部操作区：添加成员按钮和权限说明/查看按钮 -->
            <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <a-button type="primary" @click="showAddMemberModal">
                  <template #icon><PlusOutlined /></template>
                  添加成员
                </a-button>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="color: #666; font-size: 14px; margin-right: 8px;">权限说明：</span>
                <a-button type="link" @click="showAvailablePermissionsModal" style="padding: 0;">
                  查看可用权限列表
                  <template #icon><RightOutlined /></template>
                </a-button>
              </div>
            </div>
            
            <!-- 成员列表 -->
            <div style="margin-bottom: 20px;" class="member-list">
              <h4>成员列表</h4>
              <a-table
                  :columns="memberColumns"
                  :data-source="memberList"
                  :pagination="{
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalMembers,
                    showSizeChanger: false,
                    showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  }"
                  @change="handleTableChange"
                  size="small"
                  bordered
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'action'">
                    <a-button
                        type="link"
                        size="small"
                        @click="editMember(record)"
                        style="margin-right: 8px;"
                    >
                      编辑
                    </a-button>
                    <a-button
                        type="link"
                        danger
                        size="small"
                        @click="deleteMember(record.id)"
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
                  <template v-else-if="column.key === 'created_at'">
                    {{ record.created_at }}
                  </template>
                </template>
              </a-table>
            </div>
          </a-tab-pane>

          <!-- 医生管理标签页 -->
          <a-tab-pane key="doctors" tab="医生管理">
            <!-- 顶部操作区：添加医生按钮 -->
            <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <a-button type="primary" @click="showAddDoctorModal">
                  <template #icon><PlusOutlined /></template>
                  添加医生
                </a-button>
              </div>
              <div style="display: flex; align-items: center;">
                <a-input-search
                    v-model:value="doctorSearchKeyword"
                    placeholder="搜索医生姓名或手机号"
                    style="width: 250px;"
                    @search="searchDoctors"
                    @change="onDoctorSearchChange"
                />
              </div>
            </div>
            
            <!-- 医生列表 -->
            <div style="margin-bottom: 20px;" class="doctor-list">
              <h4>医生列表</h4>
              <a-table
                  :columns="doctorColumns"
                  :data-source="doctorList"
                  :pagination="{
                    current: doctorCurrentPage,
                    pageSize: doctorPageSize,
                    total: totalDoctors,
                    showSizeChanger: false,
                    showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  }"
                  @change="handleDoctorTableChange"
                  size="small"
                  bordered
                  :loading="doctorLoading"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'action'">
                    <a-button
                        type="link"
                        size="small"
                        @click="assignPatients(record)"
                        style="margin-right: 8px;"
                    >
                      分配患者
                    </a-button>
                    <a-button
                        type="link"
                        size="small"
                        @click="viewDoctorPatients(record)"
                        style="margin-right: 8px;"
                    >
                      查看患者
                    </a-button>
                    <a-button
                        type="link"
                        size="small"
                        @click="editDoctor(record)"
                        style="margin-right: 8px;"
                    >
                      编辑
                    </a-button>
                    <a-button
                        type="link"
                        danger
                        size="small"
                        @click="deleteDoctor(record.id)"
                    >
                      删除
                    </a-button>
                  </template>
                  <template v-else-if="column.key === 'patient_count'">
                    <a-tag color="green">{{ record.patient_count }}人</a-tag>
                  </template>
                  <template v-else-if="column.key === 'is_active'">
                    <a-tag :color="record.is_active ? 'green' : 'red'">
                      {{ record.is_active ? '启用' : '禁用' }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'created_at'">
                    {{ formatDate(record.created_at) }}
                  </template>
                </template>
              </a-table>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-modal>

      <!-- 新增：可用权限列表模态框 -->
      <a-modal
          v-model:visible="availablePermissionsVisible"
          title="可用权限列表"
          @cancel="handleAvailablePermissionsCancel"
          width="800px"
          :footer="null"
      >
        <p style="color: #666; font-size: 14px; margin-bottom: 16px;">
          以下是系统中所有可用的权限及其对应的功能模块。
        </p>
        
        <div style="margin-top: 8px;">
          <div v-for="group in permissionGroups" :key="group.key" style="margin-bottom: 16px;">
            <div style="font-weight: bold; color: #333; margin-bottom: 8px; padding: 8px; background: #e6f7ff; border-radius: 4px;">
              {{ group.title }}
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-left: 16px;">
              <div v-for="permission in group.permissions" :key="permission.key" style="padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 12px;">
                <strong>{{ permission.label }}</strong>
                <div style="color: #666; font-size: 11px;">{{ permission.key }}</div>
              </div>
            </div>
          </div>
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
            <a-input v-model:value="addMemberForm.username" placeholder="请输入中文用户名" />
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              用户名必须是中文，在机构内必须唯一，且不能与其他机构的相同账号+密码组合重复
            </div>
          </a-form-item>
          <a-form-item label="密码" required>
            <a-input-password v-model:value="addMemberForm.password" placeholder="请输入密码" />
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              密码长度至少6位，且不能与其他机构的相同用户名+密码组合重复
            </div>
          </a-form-item>
          <a-form-item label="确认密码" required>
            <a-input-password v-model:value="addMemberForm.confirmPassword" placeholder="请确认密码" />
          </a-form-item>
          <a-form-item label="角色权限">
            <!-- 全选按钮 -->
            <div style="margin-bottom: 16px;">
              <a-button 
                type="link" 
                size="small" 
                @click="selectAllPermissionsForAdd"
                style="margin-right: 16px;"
              >
                全选
              </a-button>
              <a-button 
                type="link" 
                size="small" 
                @click="deselectAllPermissionsForAdd"
              >
                取消全选
              </a-button>
            </div>
            
            <!-- 分组权限选择 -->
            <div style="max-height: 300px; overflow-y: auto;">
              <div v-for="group in permissionGroups" :key="group.key" style="margin-bottom: 16px;">
                <div style="margin-bottom: 8px; font-weight: bold; color: #333;">
                  <a-checkbox
                    :indeterminate="isGroupIndeterminateForAdd(group.key)"
                    :checked="isGroupSelectedForAdd(group.key)"
                    @change="(e) => e.target.checked ? selectGroupPermissionsForAdd(group.key) : deselectGroupPermissionsForAdd(group.key)"
                  >
                    {{ group.title }}
                  </a-checkbox>
                </div>
                <div style="margin-left: 24px;">
                  <a-checkbox-group v-model:value="addMemberForm.permissions">
                    <div v-for="permission in group.permissions" :key="permission.key" style="margin-bottom: 8px;">
                      <a-checkbox :value="permission.key">{{ permission.label }}</a-checkbox>
                    </div>
                  </a-checkbox-group>
                </div>
              </div>
            </div>
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- 编辑成员模态框 -->
      <a-modal
          v-model:visible="editMemberVisible"
          title="编辑成员"
          @ok="handleEditMemberOk"
          @cancel="handleEditMemberCancel"
          width="500px"
      >
        <a-form :model="editMemberForm" layout="vertical">
          <a-form-item label="用户名" required>
            <a-input v-model:value="editMemberForm.username" placeholder="请输入中文用户名" />
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              用户名必须是中文，在机构内必须唯一，且不能与其他机构的相同账号+密码组合重复
            </div>
          </a-form-item>
          <a-form-item label="密码">
            <a-input-password v-model:value="editMemberForm.password" placeholder="留空则不修改密码" />
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              密码长度至少6位，且不能与其他机构的相同用户名+密码组合重复
            </div>
          </a-form-item>
          <a-form-item label="确认密码">
            <a-input-password v-model:value="editMemberForm.confirmPassword" placeholder="留空则不修改密码" />
          </a-form-item>
          <a-form-item label="角色权限">
            <!-- 全选按钮 -->
            <div style="margin-bottom: 16px;">
              <a-button 
                type="link" 
                size="small" 
                @click="selectAllPermissionsForEdit"
                style="margin-right: 16px;"
              >
                全选
              </a-button>
              <a-button 
                type="link" 
                size="small" 
                @click="deselectAllPermissionsForEdit"
              >
                取消全选
              </a-button>
            </div>
            
            <!-- 分组权限选择 -->
            <div style="max-height: 300px; overflow-y: auto;">
              <div v-for="group in permissionGroups" :key="group.key" style="margin-bottom: 16px;">
                <div style="margin-bottom: 8px; font-weight: bold; color: #333;">
                  <a-checkbox
                    :indeterminate="isGroupIndeterminateForEdit(group.key)"
                    :checked="isGroupSelectedForEdit(group.key)"
                    @change="(e) => e.target.checked ? selectGroupPermissionsForEdit(group.key) : deselectGroupPermissionsForEdit(group.key)"
                  >
                    {{ group.title }}
                  </a-checkbox>
                </div>
                <div style="margin-left: 24px;">
                  <a-checkbox-group v-model:value="editMemberForm.permissions">
                    <div v-for="permission in group.permissions" :key="permission.key" style="margin-bottom: 8px;">
                      <a-checkbox :value="permission.key">{{ permission.label }}</a-checkbox>
                    </div>
                  </a-checkbox-group>
                </div>
              </div>
            </div>
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- 修改密码模态框 -->
      <a-modal
          v-model:visible="changePasswordVisible"
          title="修改密码"
          @ok="handleChangePasswordOk"
          @cancel="handleChangePasswordCancel"
          width="400px"
      >
        <a-form :model="changePasswordForm" layout="vertical">
          <a-form-item label="当前密码" required>
            <a-input-password v-model:value="changePasswordForm.oldPassword" placeholder="请输入当前密码" />
          </a-form-item>
          <a-form-item label="新密码" required>
            <a-input-password v-model:value="changePasswordForm.newPassword" placeholder="请输入新密码" />
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              密码长度至少6位
            </div>
          </a-form-item>
          <a-form-item label="确认新密码" required>
            <a-input-password v-model:value="changePasswordForm.confirmPassword" placeholder="请确认新密码" />
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- 添加医生模态框 -->
      <a-modal
          v-model:visible="addDoctorVisible"
          title="添加医生"
          @ok="handleAddDoctorOk"
          @cancel="handleAddDoctorCancel"
          width="500px"
      >
        <a-form :model="addDoctorForm" layout="vertical">
          <a-form-item label="医生姓名" required>
            <a-input v-model:value="addDoctorForm.name" placeholder="请输入中文姓名" />
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              姓名必须是中文，2-20个字符
            </div>
          </a-form-item>
          <a-form-item label="职称" required>
            <a-select v-model:value="addDoctorForm.title" placeholder="请选择职称">
              <a-select-option 
                v-for="title in doctorTitles" 
                :key="title.id" 
                :value="title.id"
                :disabled="!title.is_active"
              >
                {{ title.title }}
                <span v-if="!title.is_active" style="color: #999; margin-left: 8px;">(已禁用)</span>
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="角色" required>
            <a-select v-model:value="addDoctorForm.role" placeholder="请选择角色">
              <a-select-option 
                v-for="role in doctorRoles" 
                :key="role.id" 
                :value="role.id"
                :disabled="!role.is_active"
              >
                {{ role.role }}
                <span v-if="!role.is_active" style="color: #999; margin-left: 8px;">(已禁用)</span>
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="手机号码" required>
            <a-input v-model:value="addDoctorForm.phone" placeholder="请输入11位手机号码" />
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              手机号码将作为登录账号，在机构内必须唯一
            </div>
          </a-form-item>
          <a-form-item label="密码">
            <a-input-password v-model:value="addDoctorForm.password" placeholder="留空则使用手机号后6位" />
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              密码长度至少6位，留空则默认使用手机号后6位
            </div>
          </a-form-item>
          <a-form-item label="确认密码">
            <a-input-password v-model:value="addDoctorForm.confirmPassword" placeholder="请确认密码" />
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- 编辑医生模态框 -->
      <a-modal
          v-model:visible="editDoctorVisible"
          title="编辑医生"
          @ok="handleEditDoctorOk"
          @cancel="handleEditDoctorCancel"
          width="500px"
      >
        <a-form :model="editDoctorForm" layout="vertical">
          <a-form-item label="医生姓名" required>
            <a-input v-model:value="editDoctorForm.name" placeholder="请输入中文姓名" />
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              姓名必须是中文，2-20个字符
            </div>
          </a-form-item>
          <a-form-item label="职称" required>
            <a-select v-model:value="editDoctorForm.title" placeholder="请选择职称">
              <a-select-option 
                v-for="title in doctorTitles" 
                :key="title.id" 
                :value="title.id"
                :disabled="!title.is_active"
              >
                {{ title.title }}
                <span v-if="!title.is_active" style="color: #999; margin-left: 8px;">(已禁用)</span>
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="角色" required>
            <a-select v-model:value="editDoctorForm.role" placeholder="请选择角色">
              <a-select-option 
                v-for="role in doctorRoles" 
                :key="role.id" 
                :value="role.id"
                :disabled="!role.is_active"
              >
                {{ role.role }}
                <span v-if="!role.is_active" style="color: #999; margin-left: 8px;">(已禁用)</span>
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="手机号码" required>
            <a-input v-model:value="editDoctorForm.phone" placeholder="请输入11位手机号码" />
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              手机号码将作为登录账号，在机构内必须唯一
            </div>
          </a-form-item>
          <a-form-item label="密码">
            <a-input-password v-model:value="editDoctorForm.password" placeholder="留空则不修改密码" />
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              密码长度至少6位，留空则不修改密码
            </div>
          </a-form-item>
          <a-form-item label="确认密码">
            <a-input-password v-model:value="editDoctorForm.confirmPassword" placeholder="留空则不修改密码" />
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- 分配患者模态框 -->
      <a-modal
          v-model:visible="assignPatientsVisible"
          title="分配患者"
          @ok="handleAssignPatientsOk"
          @cancel="handleAssignPatientsCancel"
          width="800px"
      >
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="display: flex; gap: 12px; align-items: center;">
              <a-input
                  v-model:value="unassignedPatientGkidSearch"
                  placeholder="输入患者编号（精准筛选）"
                  style="width: 200px;"
                  @change="onUnassignedPatientGkidSearchChange"
              />
              <a-input-search
                  v-model:value="unassignedPatientSearch"
                  placeholder="搜索患者姓名或手机号（模糊筛选）"
                  style="width: 250px;"
                  @search="searchUnassignedPatients"
                  @change="onUnassignedPatientSearchChange"
              />
            </div>
            <div style="color: #666; font-size: 14px;">
              已选择 <span style="color: #1890ff; font-weight: bold;">{{ selectedPatientIds.length }}</span> 个患者
            </div>
          </div>
          <div style="font-size: 12px; color: #999;">
            提示：编号筛选为精准筛选，输入时自动生效；姓名/手机号筛选为模糊筛选，需要点击搜索按钮或按回车键
          </div>
        </div>
        <a-table
            :columns="unassignedPatientColumns"
            :data-source="unassignedPatientList"
            :pagination="{
              current: unassignedPatientPage,
              pageSize: unassignedPatientPageSize,
              total: totalUnassignedPatients,
              showSizeChanger: false,
              showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }"
            @change="handleUnassignedPatientTableChange"
            size="small"
            bordered
            :loading="unassignedPatientLoading"
            :row-selection="unassignedPatientRowSelection"
            row-key="id"
            :row-class-name="getUnassignedPatientRowClassName"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'age'">
              {{ record.age || '-' }}岁
            </template>
            <template v-if="column.key === 'name'">
              <span :style="{ color: isSelectedButNotInCurrentFilter(record) ? '#1890ff' : 'inherit' }">
                {{ record.name }}
                <span v-if="isSelectedButNotInCurrentFilter(record)" style="color: #52c41a; margin-left: 4px;">
                  (已选择)
                </span>
              </span>
            </template>
          </template>
        </a-table>
      </a-modal>

      <!-- 查看医生患者模态框 -->
      <a-modal
          v-model:visible="viewDoctorPatientsVisible"
          title="医生患者列表"
          @cancel="viewDoctorPatientsVisible = false"
          width="800px"
          :footer="null"
      >
        <div style="margin-bottom: 16px;">
          <span style="font-weight: bold; color: #333;">
            {{ currentDoctor?.name }} 医生的患者列表
          </span>
        </div>
        <a-table
            :columns="doctorPatientColumns"
            :data-source="doctorPatientList"
            :pagination="{
              current: doctorPatientPage,
              pageSize: doctorPatientPageSize,
              total: totalDoctorPatients,
              showSizeChanger: false,
              showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }"
            @change="handleDoctorPatientTableChange"
            size="small"
            bordered
            :loading="doctorPatientLoading"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-button
                  type="link"
                  danger
                  size="small"
                  @click="removePatientAssignment(record.id)"
              >
                移除分配
              </a-button>
            </template>
            <template v-else-if="column.key === 'age'">
              {{ record.age || '-' }}岁
            </template>
            <template v-else-if="column.key === 'assigned_at'">
              {{ formatDate(record.assigned_at) }}
            </template>
          </template>
        </a-table>
      </a-modal>
    </a-layout>
  </div>
</template>

<script setup>
import {ref, onMounted, computed, watch, markRaw, inject, onErrorCaptured, nextTick} from 'vue';
import {message, Modal} from 'ant-design-vue';
import axios from 'axios';
import {
  DashboardOutlined,
  UsergroupAddOutlined,
  FileSearchOutlined,
  SettingOutlined,
  PlusOutlined,
  TeamOutlined,
  RightOutlined,
  LockOutlined,
  CrownOutlined,
  ShoppingOutlined
} from '@ant-design/icons-vue';
import { Tabs } from 'ant-design-vue';
const { TabPane } = Tabs;
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
import SuperDashboard from '../pages/SuperDashboard.vue'
import ProductInfo from '../pages/product/ProductInfo.vue'
import Purchase from '../pages/product/Purchase.vue'
import Inventory from '../pages/product/Inventory.vue'
import ProductSalesMgmt from '../pages/product/ProductSalesMgmt.vue'
import Gsp from '../pages/product/Gsp.vue'
import ImgIcon from "@/pages/components/ImgIcon.vue";
import { getCache } from '@/utils/cacheManager';
import { 
  isOnline, 
  networkStatus, 
  initNetworkListener, 
  cleanupNetworkListener, 
  getNetworkStatus,
  fetchWithRetry 
} from '@/utils/networkManager';

// API 基础URL
const API_BASE_URL = 'https://aiforoptometry.com';


const ACCOUNT_STORE = 'accounts';

const organizationName = ref('');
const selectedKey = ref(['dashboard']);
// router 变量，如果应用使用了 vue-router 且组件在 Router 上下文中，可以通过其他方式获取
// 目前代码已经有处理 router 为 null 的逻辑，所以这里设置为 null
// 如果需要使用 router，可以通过 props 或 provide/inject 传递
const router = null;
const collapsed = ref(true);

// 判断是否为子账号
const isSubaccount = computed(() => {
  const username = localStorage.getItem('current_username');
  return username && /^[\u4e00-\u9fa5]+$/.test(username);
});

// 判断是否为超级管理员（organization_id为1）
const isSuperAdmin = computed(() => {
  const orgId = localStorage.getItem('organization_id');
  return orgId === '1';
});

// 计算当前用户名
const currentUserName = computed(() => {
  const username = localStorage.getItem('current_username');
  const orgName = localStorage.getItem('organization_name');
  
  if (isSubaccount.value) {
    // 子账号登录：显示子账号名称
    return username;
  } else {
    // 机构账号登录：显示机构名称
    return orgName || '用户';
  }
});

// 网络状态计算属性
const networkStatusClass = computed(() => {
  const status = getNetworkStatus();
  if (status.isOffline) {
    return 'network-offline';
  } else if (status.isSlow) {
    return 'network-slow';
  }
  return 'network-online';
});

const networkStatusText = computed(() => {
  const status = getNetworkStatus();
  if (status.isOffline) {
    return '离线模式';
  } else if (status.isSlow) {
    return '网络缓慢';
  }
  return '在线';
});

// 页面映射，key 为左侧菜单项点击时传入的标识，对应页面标题和组件
const pageMapping = {
  dashboard: {title: '工作台', component: markRaw(Workbench)},
  'super-dashboard': {title: '超级工作台', component: markRaw(SuperDashboard)},
  'patient-list': {title: '患者列表', component: markRaw(PatientList), extraProps: { isArchiveMode: false }},
  'patient-check': {title: '复查管理', component: markRaw(PatientCheck)},
  'patient-appointment': {title: '预约管理', component: markRaw(PatientAppointment)},
  'examination-1': {title: '快速复查', component: markRaw(Examination1)},
  'examination-2': {title: '检查档案', component: markRaw(Examination2)},
  'examination-3': {title: '检查设备', component: markRaw(Examination3)},
  'newrecord': {title: '新增检查记录', component: markRaw(Newrecord)},
  'view-patient': {title: '查看患者信息', component: markRaw(ViewPatient)},
  'patient': {title: '患者主页', component: markRaw(Patient)},
  'patient-sales': {title: '销售开单', component: markRaw(PatientSales)},
  'sales': {title: '销售开单', component: markRaw(PatientSales)},
  // 商品管理（空白页，逐步开发）
  'product-info': {title: '商品信息管理', component: markRaw(ProductInfo)},
  'purchase': {title: '采购管理', component: markRaw(Purchase)},
  'inventory': {title: '库存管理', component: markRaw(Inventory)},
  'product-sales': {title: '销售管理', component: markRaw(ProductSalesMgmt)},
  'gsp': {title: 'GSP管理', component: markRaw(Gsp)},
}

const patientCheckSubViewComponent = markRaw(PatientCheckSubView);

function buildPatientCheckSubTabs(parentTabId) {
  const C = patientCheckSubViewComponent;
  return [
    { id: `${parentTabId}-pc-routine`, key: 'patient-check-routine', title: '常规复查', component: C, props: { variant: 'routine' }, closable: false },
    { id: `${parentTabId}-pc-glasses`, key: 'patient-check-glasses', title: '配镜复查', component: C, props: { variant: 'glasses' }, closable: false },
    { id: `${parentTabId}-pc-rgp`, key: 'patient-check-rgp', title: '硬镜复查', component: C, props: { variant: 'rgp' }, closable: false },
  ];
}

/** 复查管理主标签：固定三个不可关闭的子标签页 */
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
  try {
    // 检查是否为已删除的页面
    const deletedPages = [
      'product-management', 'warehouse', 'expiry-management',
      'inventory-stock', 'inventory-sales', 'inventory-record', 'inventory-return',
      'purchase-order', 'purchase-in', 'transfer', 'stock-warning', 'return',
      'inventory-report', 'rfid-management', 'expiry-warning-config',
      'business-report', 'business-cost', 'business-work', 'business-data',
      'smart-device', 'smart-ai', 'smart-clinic'
    ];
    if (deletedPages.includes(pageKey)) {
      console.warn('尝试访问已删除的页面:', pageKey);
      message.warning('该功能已移除');
      return;
    }
    
    const config = pageMapping[pageKey];
    if (!config || !config.component) {
      console.error('未配置的页面或组件无效:', pageKey);
      message.error('页面配置错误，请刷新页面重试');
      return;
    }

    // 先检查是否已存在相同 key 的标签页（对于普通页面）
    // 如果已存在，直接切换到该标签页，不需要检查权限
    if (!parentTabId) {
      let existingTab = null;
      const specialPages = ['newrecord', 'view-patient', 'patient', 'sales', 'patient-sales', 'super-dashboard'];
      
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
        console.log('找到已存在的标签页，切换到:', existingTab.id, existingTab.title);
        activeTabId.value = existingTab.id;
        // 如果传入了新的 props，更新标签页的 props
        if (Object.keys(extraProps).length > 0) {
          existingTab.props = { ...existingTab.props, ...extraProps };
        }
        
        // 如果是患者列表页面，触发刷新事件
        if (pageKey === 'patient-list') {
          console.log('切换到标签页，触发刷新事件:', pageKey);
          setTimeout(() => {
            if (window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('tab-activated', {
                detail: { pageKey: pageKey }
              }));
            }
          }, 100);
        }

        if (pageKey === 'patient-check') {
          ensurePatientCheckSubTabs(existingTab);
        }
        
        return;
      } else {
        console.log('未找到已存在的标签页，pageKey:', pageKey);
      }
    }

    // 检查权限（除了特殊页面如 newrecord, view-patient, patient, sales 等）
    // 只有在创建新标签页时才检查权限
    const specialPages = ['newrecord', 'view-patient', 'patient', 'sales', 'patient-sales', 'super-dashboard', 'warehouse', 'expiry-management'];
    const noPermissionCheckPages = ['super-dashboard', 'product-info', 'purchase', 'inventory', 'product-sales', 'gsp'];
    if (!specialPages.includes(pageKey) && !noPermissionCheckPages.includes(pageKey) && !hasPermission(pageKey)) {
      message.warning('您没有权限访问此功能');
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
        title: config.title || '未知页面',
        component: config.component,
        props: extraProps || {}
      };
      
      // 设置子标签页标题
      if (pageKey === 'patient' && extraProps.record && extraProps.record.patient && extraProps.record.patient.name) {
        newSubTab.title = extraProps.record.patient.name;
      }
      
      // 子标签页最多容纳8个，超过时移除最旧的（按时间推移）
      const MAX_SUB_TABS = 8;
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

    // 如果不存在，创建新主标签页
    // 合并 pageMapping 中的 extraProps 和传入的 extraProps
    const mergedProps = { ...(config.extraProps || {}), ...extraProps };
    
    const newTab = {
      id: 'tab-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      key: pageKey,
      title: config.title || '未知页面', // 默认标题
      component: config.component,
      props: mergedProps,
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

    // 标签页最多容纳7个，超过时移除最旧的标签页（按时间推移）
    const MAX_TABS = 7;
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
  } catch (error) {
    console.error('添加标签页时发生错误:', error);
    message.error('添加标签页失败，请刷新页面重试');
  }
}

const menuOpenKeys = ref(['dashboard'])

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


// 菜单错误处理函数
function handleMenuError(error) {
  // 捕获菜单组件上下文错误（Ant Design Vue 已知问题）
  if (error && error.message && (error.message.includes('useInjectMenu') || error.message.includes('prefixCls'))) {
    console.warn('菜单组件上下文错误（已知问题，已忽略）:', error.message);
    return true; // 阻止错误传播
  }
  return false; // 允许其他错误正常处理
}

// 修改左侧菜单的点击处理，点击后新增标签页
function handleMenuClick({key, keyPath}) {
  try {
    // 不需要权限检查的页面（超级工作台、商品管理相关，逐步开发）
    const noPermissionCheckPages = ['super-dashboard', 'product-info', 'purchase', 'inventory', 'product-sales', 'gsp'];
    
    // 检查权限（特殊页面不需要权限检查）
    if (!noPermissionCheckPages.includes(key) && !hasPermission(key)) {
      message.warning('您没有权限访问此功能');
      return;
    }
    
    selectedKey.value = [key];
    menuOpenKeys.value = keyPath;
    addTab(key);
    console.log('切换选项卡：', key);
  } catch (error) {
    // 如果是菜单组件上下文错误，静默处理
    if (error && error.message && (error.message.includes('useInjectMenu') || error.message.includes('prefixCls'))) {
      console.warn('菜单组件上下文错误（已知问题，已忽略）:', error.message);
      return;
    }
    console.error('菜单点击处理时发生错误:', error);
    message.error('操作失败，请刷新页面重试');
  }
}

// Tab 编辑事件，主要处理关闭标签页
function onTabEdit(targetKey, action) {
  try {
    if (action === 'remove') {
      removeTab(targetKey);
    }
  } catch (error) {
    console.error('标签页编辑时发生错误:', error);
    message.error('操作失败，请刷新页面重试');
  }
}

// 清除当前激活标签页的子标签页激活状态
function clearActiveSubTab() {
  if (activeTabId.value) {
    try {
      const tab = openedTabs.value.find(tab => tab.id === activeTabId.value);
      if (tab && tab.activeSubTabId) {
        // 清除子标签页的激活状态，这样就会显示主标签页内容
        tab.activeSubTabId = '';
      }
    } catch (error) {
      console.error('清除子标签页激活状态时发生错误:', error);
    }
  }
}

// 主标签页点击事件：仅在此处清除子标签激活状态。不在 watch(activeTabId) 里清除，
// 否则从复查管理通过 view-patient 切到“患者列表+患者主页”时会误清掉刚设的 activeSubTabId，子 tab 栏不高亮。
function onMainTabClick(activeKey) {
  clearActiveSubTab();
}

function removeTab(targetKey) {
  try {
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
    
    // 如果没有标签页了，默认打开工作台
    if (openedTabs.value.length === 0) {
      addTab('dashboard');
    }
  } catch (error) {
    console.error('移除标签页时发生错误:', error);
    // 如果出错，尝试重置标签页状态
    try {
      openedTabs.value = [];
      activeTabId.value = '';
      addTab('dashboard');
    } catch (fallbackError) {
      console.error('重置标签页状态失败:', fallbackError);
    }
  }
}

// 关闭所有标签页
function closeAllTabs() {
  try {
    // 清空所有标签页
    openedTabs.value = [];
    activeTabId.value = '';
    
    // 默认打开工作台
    addTab('dashboard');
    
    message.success('已关闭所有标签页');
  } catch (error) {
    console.error('关闭所有标签页时发生错误:', error);
    message.error('关闭所有标签页失败，请刷新页面重试');
  }
}

// 计算当前激活标签对应的页面对象
const activeTab = computed(() => {
  try {
    if (!activeTabId.value || !openedTabs.value.length) {
      return null;
    }
    return openedTabs.value.find(tab => tab.id === activeTabId.value) || null;
  } catch (error) {
    console.error('计算当前激活标签时发生错误:', error);
    return null;
  }
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
onMounted(async () => {
  console.log('加载用户信息：', currentUserName.value);
  if (openedTabs.value.length === 0) {
    addTab('dashboard');
  }
  
  // 初始化网络监听
  initNetworkListener();
  
  // 将addTab函数暴露到window对象，方便其他组件直接调用
  window.openTab = (pageKey, extraProps = {}, parentTabId = null) => {
    console.log('window.openTab 被调用:', pageKey, extraProps);
    addTab(pageKey, extraProps, parentTabId);
  };
  
  // 监听工作台发出的打开新标签页事件
  window.addEventListener('open-new-tab', handleOpenNewTabEvent);
  
  // 监听查看患者事件（从工作台等页面发出）
  window.addEventListener('view-patient', handleViewPatientEvent);
  
  // 监听工作台发出的打开系统设置事件
  window.addEventListener('open-system-settings', handleOpenSystemSettingsEvent);
  
  // 添加全局错误处理，捕获未处理的 Promise 错误
  window.addEventListener('unhandledrejection', (event) => {
    // 如果是菜单组件相关的错误，静默处理
    if (event.reason && typeof event.reason === 'object') {
      const errorMsg = event.reason.message || event.reason.toString();
      if (errorMsg.includes('useInjectMenu') || errorMsg.includes('prefixCls')) {
        console.warn('菜单组件上下文错误（已知问题，已忽略）:', errorMsg);
        event.preventDefault(); // 阻止错误在控制台显示
        return;
      }
    }
    // 其他错误正常处理
    console.error('未处理的 Promise 错误:', event.reason);
  });
  
  // 自动获取系统设置
  await loadSystemSettings();
  
  // 自动加载患者列表缓存到localStorage
  await loadPatientListCache();
  
  // 自动加载检查列表缓存到localStorage
  await loadCheckListCache();
});

// 捕获组件渲染错误（用于处理菜单组件的已知问题）
onErrorCaptured((err, instance, info) => {
  // 捕获菜单组件上下文错误（Ant Design Vue 已知问题）
  if (err && err.message && (err.message.includes('useInjectMenu') || err.message.includes('prefixCls'))) {
    console.warn('菜单组件渲染错误（已知问题，已忽略）:', err.message);
    return false; // 阻止错误继续传播，静默处理
  }
  // 其他错误继续正常处理
  console.error('组件渲染错误:', err, info);
  return true; // 允许错误继续传播以便其他错误处理器处理
});

// 组件卸载时的清理函数
import { onUnmounted } from 'vue';

onUnmounted(() => {
  // 清理网络监听
  cleanupNetworkListener();
  // 清理事件监听器
  window.removeEventListener('open-new-tab', handleOpenNewTabEvent);
  window.removeEventListener('view-patient', handleViewPatientEvent);
  window.removeEventListener('open-system-settings', handleOpenSystemSettingsEvent);
  
  // 清空标签页，避免组件卸载时的错误
  openedTabs.value = [];
  activeTabId.value = '';
});

  // 自动加载患者列表缓存到localStorage
  const loadPatientListCache = async () => {
    try {
      const organizationId = localStorage.getItem('organization_id');
      if (!organizationId) {
        console.log('未找到organization_id，跳过缓存加载');
        return;
      }

      console.log('正在从缓存加载患者列表数据...');
      const result = await getCache('patientlist', organizationId);
      
      if (result.data) {
        // 将缓存数据同步到localStorage，供其他组件使用
        try {
          localStorage.setItem('patientlist', JSON.stringify(result.data));
          localStorage.setItem('patientlist_storage', 'indexedDB');
          localStorage.setItem('patientlist_indexedDB_key', `patientlist_${organizationId}`);
          console.log(`患者列表缓存加载成功，数据来源: ${result.source}，已同步到localStorage`);
        } catch (localStorageError) {
          console.warn('同步到localStorage失败:', localStorageError.message);
        }
      } else {
        console.log('患者列表缓存未找到');
      }
    } catch (error) {
      console.error('加载患者列表缓存失败:', error);
    }
  };

  // 自动加载检查列表缓存到localStorage
  const loadCheckListCache = async () => {
    try {
      const organizationId = localStorage.getItem('organization_id');
      if (!organizationId) {
        console.log('未找到organization_id，跳过缓存加载');
        return;
      }

      console.log('正在从缓存加载检查列表数据...');
      const result = await getCache('checkmanagementlist', organizationId);
      
      if (result.data) {
        // 将缓存数据同步到localStorage，供其他组件使用
        try {
          localStorage.setItem('checkmanagementlist', JSON.stringify(result.data));
          localStorage.setItem('checkmanagementlist_storage', 'indexedDB');
          localStorage.setItem('checkmanagementlist_indexedDB_key', `checkmanagementlist_${organizationId}`);
          console.log(`检查列表缓存加载成功，数据来源: ${result.source}，已同步到localStorage`);
        } catch (localStorageError) {
          console.warn('同步到localStorage失败:', localStorageError.message);
        }
      } else {
        console.log('检查列表缓存未找到');
      }
    } catch (error) {
      console.error('加载检查列表缓存失败:', error);
    }
  };

// 新增：自动加载系统设置函数（带网络检测和离线模式）
const loadSystemSettings = async () => {
  try {
    const orgId = localStorage.getItem('organization_id');
    if (!orgId) {
      console.log('未找到机构ID，跳过系统设置加载');
      return;
    }

    // 检查网络状态
    const networkInfo = getNetworkStatus();
    if (networkInfo.isOffline) {
      // 离线模式：从本地存储加载
      const cachedSettings = localStorage.getItem(`system_settings_${orgId}`);
      if (cachedSettings) {
        try {
          const settings = JSON.parse(cachedSettings);
          console.log('离线模式：从本地缓存加载系统设置');
          // 应用缓存的设置
          applySystemSettings(settings);
          return;
        } catch (e) {
          console.warn('加载缓存的系统设置失败:', e);
        }
      }
      message.warning('网络不可用，无法加载系统设置');
      return;
    }

    console.log('开始自动加载系统设置...');
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/organization/detail/${orgId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      }, 2, 2000); // 最多重试2次，每次间隔2秒
      
      const result = await response.json();
      
      if (result.code === 200) {
        // 保存到本地缓存
        localStorage.setItem(`system_settings_${orgId}`, JSON.stringify(result.data));
        applySystemSettings(result.data);
      }
    } catch (error) {
      console.error('加载系统设置失败:', error);
      
      // 检查是否为服务器错误（502/503/504）或网络错误
      const errorMsg = error.message || error.toString() || '';
      const isServerError = errorMsg.includes('服务器错误: 502') ||
                           errorMsg.includes('服务器错误: 503') ||
                           errorMsg.includes('服务器错误: 504') ||
                           errorMsg.includes('502') ||
                           errorMsg.includes('503') ||
                           errorMsg.includes('504');
      
      // 尝试从缓存加载
      const cachedSettings = localStorage.getItem(`system_settings_${orgId}`);
      if (cachedSettings) {
        try {
          const settings = JSON.parse(cachedSettings);
          console.log('从本地缓存加载系统设置');
          applySystemSettings(settings);
          if (isServerError) {
            message.warning('服务器暂时不可用，已使用缓存的系统设置');
          } else {
            message.warning('网络连接失败，已使用缓存的系统设置');
          }
        } catch (e) {
          console.warn('加载缓存的系统设置失败:', e);
        }
      } else {
        // 如果没有缓存，尝试从旧的缓存格式加载
        const oldCache = localStorage.getItem('systemSettings');
        if (oldCache) {
          try {
            const oldSettings = JSON.parse(oldCache);
            console.log('从旧格式缓存加载系统设置');
            applySystemSettings(oldSettings);
            if (isServerError) {
              message.warning('服务器暂时不可用，已使用缓存的系统设置');
            } else {
              message.warning('网络连接失败，已使用缓存的系统设置');
            }
          } catch (e) {
            console.warn('加载旧格式缓存失败:', e);
          }
        } else if (isServerError) {
          message.warning('服务器暂时不可用，且无缓存数据');
        }
      }
    }
  } catch (error) {
    console.error('加载系统设置出错:', error);
    // 最后的兜底：尝试从旧格式缓存加载
    const oldCache = localStorage.getItem('systemSettings');
    if (oldCache) {
      try {
        const oldSettings = JSON.parse(oldCache);
        applySystemSettings(oldSettings);
      } catch (e) {
        console.warn('加载旧格式缓存失败:', e);
      }
    }
  }
};

// 应用系统设置
const applySystemSettings = (orgData) => {
  if (!orgData) return;
  
  const systemSettings = {
    printName: orgData.print_name || '',
    checkCycle: orgData.review_interval_days || 1,
    logoUrl: orgData.logo || '',
    autoRefreshMode: orgData.auto_refresh_mode || 'auto',
    autoRefreshInterval: orgData.auto_refresh_interval || 15,
    external_contact: orgData.external_contact || '',
    address: orgData.address || '',
    patientTypes: Array.isArray(orgData.patient_types) && orgData.patient_types.length > 0 ? orgData.patient_types : DEFAULT_PATIENT_TYPES, // 患者类型选项数组，如果后端没有配置则使用系统预设
    id: orgData.id,
    name: orgData.name,
  };
  
  // 保存到 localStorage
  localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
  localStorage.setItem('organization_name', orgData.name || '');
  
  // 触发患者类型设置变化事件，通知患者列表组件
  window.dispatchEvent(new CustomEvent('patient-types-changed', {
    detail: systemSettings.patientTypes
  }));
};

// 退出登录，清除本地存储并通知用户
const emit = defineEmits(["logout"]);

async function logout() {
  try {
    // 显示退出确认对话框
    let isResolved = false;
    const result = await new Promise((resolve) => {
      const modal = Modal.confirm({
        title: '确认退出登录',
        content: '是否要清除所有已保存的账号信息？',
        okText: '是，清除所有',
        cancelText: '否，仅退出',
        closable: true,
        onOk: () => {
          isResolved = true;
          resolve('clear_all');
        },
        onCancel: () => {
          isResolved = true;
          resolve('logout_only');
        },
        afterClose: () => {
          if (!isResolved) {
            resolve('cancel');
          }
        }
      });
    });

    // 如果用户点击×按钮取消，直接返回，不执行任何退出操作
    if (result === 'cancel') {
      return;
    }

    // 先清空所有打开的标签页，避免组件卸载时的错误
    openedTabs.value = [];
    activeTabId.value = '';

    // 获取当前登录的账号信息
    const currentUsername = localStorage.getItem('current_username');
    
    if (result === 'clear_all') {
      // 用户选择清除所有账号信息
      localStorage.removeItem('multiAccounts');
      localStorage.removeItem('multiAccounts_storage');
      localStorage.removeItem('checkmanagementlist');
      localStorage.removeItem('checkmanagementlist_storage');
      localStorage.removeItem('checkmanagementlist_indexedDB_key');
      localStorage.removeItem('patientlist');
      localStorage.removeItem('patientlist_storage');
      localStorage.removeItem('patientlist_indexedDB_key');
      localStorage.removeItem('organization');
      localStorage.removeItem('organization_name');
      localStorage.removeItem('organization_id');
      localStorage.removeItem('loginInfo');
      localStorage.removeItem('current_username');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('csrftoken');
      message.info('已清除所有账号信息');
    } else {
      // 用户选择仅退出当前账号
      // 在退出前，将当前的缓存数据保存回multiAccounts中
      if (currentUsername) {
        try {
          const multiAccounts = JSON.parse(localStorage.getItem('multiAccounts') || '[]');
          const currentAccountIndex = multiAccounts.findIndex(acc => acc.username === currentUsername);
          
          if (currentAccountIndex >= 0) {
            // 获取当前的缓存数据
            const currentPatientData = localStorage.getItem('patientlist');
            const currentCheckData = localStorage.getItem('checkmanagementlist');
            const patientStorage = localStorage.getItem('patientlist_storage');
            const checkStorage = localStorage.getItem('checkmanagementlist_storage');
            const patientIndexedDBKey = localStorage.getItem('patientlist_indexedDB_key');
            const checkIndexedDBKey = localStorage.getItem('checkmanagementlist_indexedDB_key');
            
            // 更新账号数据，保留缓存信息
            multiAccounts[currentAccountIndex] = {
              ...multiAccounts[currentAccountIndex],
              autoLogin: false,
              // 如果数据在localStorage中，直接保存
              patientlist: patientStorage === 'localStorage' ? (currentPatientData ? JSON.parse(currentPatientData) : null) : null,
              checkmanagementlist: checkStorage === 'localStorage' ? (currentCheckData ? JSON.parse(currentCheckData) : null) : null,
              // 保存存储方式信息
              patientStorage: patientStorage || 'localStorage',
              checkStorage: checkStorage || 'localStorage',
              patientIndexedDBKey: patientIndexedDBKey,
              checkIndexedDBKey: checkIndexedDBKey
            };
            
            // 保存更新后的账号数据
            localStorage.setItem('multiAccounts', JSON.stringify(multiAccounts));
            console.log('已保存当前账号的缓存数据到multiAccounts');
          }
        } catch (error) {
          console.error('保存当前账号缓存数据失败:', error);
        }
      }

      // 清除当前会话相关的信息，但保留多账号缓存
      localStorage.removeItem('loginInfo'); // 清除单账号的自动登录信息
      localStorage.removeItem('current_username'); // 清除当前用户名标识
      localStorage.removeItem('access_token'); // 清除当前访问令牌
      localStorage.removeItem('refresh_token'); // 清除当前刷新令牌
      localStorage.removeItem('csrftoken'); // 清除当前CSRF令牌
      
      // 清除成员列表缓存
      clearMemberListCache();
      
      // 保留机构ID和多账号缓存，用于下次登录时的快速切换
      message.info('已退出登录，账号信息已保留');
    }

    console.log('用户已退出登录');

    // 触发logout事件
    emit('logout');

    // 使用路由导航到登录页，添加错误处理
    try {
      // 如果 router 可用，使用 router 跳转，否则直接触发 logout 事件
      if (router && typeof router.push === 'function') {
        await router.push('/login');
      } else {
        console.log('使用emit事件进行登出');
        // 如果路由不可用，使用window.location作为备选方案
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('路由跳转失败:', error);
      // 如果路由跳转失败，使用window.location作为备选方案
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('退出登录过程中发生错误:', error);
    // 确保即使出错也能跳转到登录页
    try {
      window.location.href = '/login';
    } catch (fallbackError) {
      console.error('备选跳转方案也失败:', fallbackError);
    }
  }
}

function handleSiderMouseEnter() {
  try {
    collapsed.value = false;
    console.log("展开导航栏");
  } catch (error) {
    console.warn('展开导航栏时发生错误（已忽略）:', error);
  }
}

function handleSiderMouseLeave() {
  try {
    collapsed.value = true;
    console.log("收缩导航栏");
  } catch (error) {
    // 捕获菜单组件上下文错误（Ant Design Vue 已知问题）
    if (error && error.message && error.message.includes('useInjectMenu')) {
      console.warn('菜单组件上下文错误（已知问题，已忽略）:', error.message);
      // 即使出错也尝试收缩菜单
      try {
        collapsed.value = true;
      } catch (e) {
        // 静默忽略
      }
    } else {
      console.warn('收缩导航栏时发生错误（已忽略）:', error);
    }
  }
}

// 修改菜单展开状态的计算属性
// const menuOpenKeys = computed(() => {
//   if (collapsed.value) {
//     return [];
//   }
//   return ['patient', 'examination', 'inventory', 'business'];
// });


function handleOpenNewTab(record) {
  console.log('handleOpenNewTab 接收到:', record);
  // 根据传入的key决定打开哪个页面
  if (record.key === 'sales') {
    console.log('Main.vue接收到的销售数据:', record);
    addTab('sales', {salesRecord: record.salesRecord});
  } else if (record.key === 'patient-list') {
    // 打开患者列表页面
    console.log('打开患者列表页面');
    addTab('patient-list');
  } else {
    // 默认打开新增检查记录页面
    addTab('newrecord', {record: record});
  }
}

function handleViewPatient(record) {
  console.log('处理查看患者:', record);
  
  // 先查找或创建患者列表标签页
  let patientListTab = openedTabs.value.find(tab => tab.key === 'patient-list');
  
  if (!patientListTab) {
    // 如果患者列表标签页不存在，先创建它
    console.log('患者列表标签页不存在，先创建患者列表标签页');
    addTab('patient-list');
    // 使用 nextTick 确保标签页已创建
    nextTick(() => {
      patientListTab = openedTabs.value.find(tab => tab.key === 'patient-list');
      if (patientListTab) {
        // 在患者列表标签页下创建患者主页子标签页
        console.log('在患者列表标签页下创建患者主页子标签页');
        addTab('patient', {record}, patientListTab.id);
      } else {
        // 如果还是找不到，直接创建患者主页标签页
        console.warn('无法找到患者列表标签页，直接创建患者主页标签页');
        addTab('patient', {record});
      }
    });
  } else {
    // 如果患者列表标签页已存在，直接在该标签页下创建患者主页子标签页
    console.log('患者列表标签页已存在，在该标签页下创建患者主页子标签页');
    addTab('patient', {record}, patientListTab.id);
  }
}

// window 事件处理函数（需要在 onMounted 和 onUnmounted 中使用）
const handleOpenNewTabEvent = (event) => {
  const { key } = event.detail;
  console.log('window事件接收到 open-new-tab:', key);
  if (key === 'patient-list') {
    addTab('patient-list');
  } else {
    addTab(key);
  }
};

const handleViewPatientEvent = (event) => {
  try {
    const record = event.detail;
    console.log('window事件接收到 view-patient:', record);
    handleViewPatient(record);
  } catch (error) {
    console.error('处理 view-patient 事件错误:', error);
  }
};

const handleOpenSystemSettingsEvent = () => {
  try {
    showSettings();
  } catch (error) {
    console.error('处理 open-system-settings 事件错误:', error);
  }
};

// 系统设置相关
const settingsVisible = ref(false);
const fileList = ref([]);
const settingsActiveTab = ref('basic'); // 当前激活的设置标签页
// 系统预设的患者类型
const DEFAULT_PATIENT_TYPES = ['近视建档', '塑形镜', '点扩散', '视觉训练'];

const settingsForm = ref({
  printName: '',
  checkCycle: 1,  // 默认值设为1（一个月）
  logoUrl: '',      // 添加logoUrl字段
  autoRefreshMode: 'auto', // 新增自动更新模式
  autoRefreshInterval: 15, // 新增自动刷新间隔
  external_contact: '', // 新增机构联系电话
  address: '', // 新增机构地址
  patientTypes: [...DEFAULT_PATIENT_TYPES] // 患者类型选项数组，默认使用系统预设
});

// 方案设置表单
const treatmentSettingsForm = ref({
  glassesMethods: ['离焦镜', '点扩散', 'OK镜', '离焦软镜', 'RGP', '单光镜', '渐近镜', '双效离焦点扩散'], // 默认全选配镜手段
  glassesBrands: {
    '离焦镜': ['星趣控', '新乐学', '轻松控', '爱眼星', '成长乐', '小乐园', '奥拉', '学趣控', '成长怡', '国产', '艾视晰', '蔚来星空', '欧陆智造', '柯学佳', '欧视佳', '益贝视', '其他'],
    '点扩散': ['控优点2.0', '控优点3.0', '爱眼星', '柯学优', '其他'],
    'OK镜': ['亨泰', '普诺瞳', 'CRT', '阿尔法', '露晰德', '欧几里德', '梦戴维', '天瞳', '菁眸', '目立康', '视达佳', '其他'],
    '离焦软镜': ['misight', '蝶适', '其他'],
    'RGP': ['目立康', '菲仕康', '亨泰', '其他'],
    '单光镜': ['蔡司', '依视路', '国产', '其他'],
    '渐近镜': ['蔡司', '依视路', '国产', '其他'],
    '双效离焦点扩散': ['格林视通', '爱眼星', '其他']
  },
  hgDevices: ['唯迪科', '小太阳', '三代人', '其他'], // 默认全选低强度红光
  hgLevels: {
    '唯迪科': [0, 3, 6, 9, 12, 15],
    '小太阳': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    '三代人': [], // 无档位
    '其他': [] // 无档位
  }
});

// 配镜品牌表格列定义
const glassesBrandColumns = [
  {
    title: '配镜手段',
    dataIndex: 'method',
    key: 'method',
    width: 120,
    align: 'center'
  },
  {
    title: '可选品牌',
    dataIndex: 'brands',
    key: 'brands',
    align: 'left'
  }
];

// 配镜品牌表格数据源
const glassesBrandData = computed(() => {
  const allBrands = {
    '离焦镜': ['星趣控', '新乐学', '轻松控', '爱眼星', '成长乐', '小乐园', '奥拉', '学趣控', '成长怡', '国产', '艾视晰', '蔚来星空', '欧陆智造', '柯学佳', '欧视佳', '益贝视', '其他'],
    '点扩散': ['控优点2.0', '控优点3.0', '爱眼星', '柯学优', '其他'],
    'OK镜': ['亨泰', '普诺瞳', 'CRT', '阿尔法', '露晰德', '欧几里德', '梦戴维', '天瞳', '菁眸', '目立康', '视达佳', '其他'],
    '离焦软镜': ['misight', '蝶适', '其他'],
    'RGP': ['目立康', '菲仕康', '亨泰', '其他'],
    '单光镜': ['蔡司', '依视路', '国产', '其他'],
    '渐近镜': ['蔡司', '依视路', '国产', '其他'],
    '双效离焦点扩散': ['格林视通', '爱眼星', '其他']
  };
  
  return Object.keys(allBrands).map(method => ({
    method,
    brands: allBrands[method]
  }));
});

// 低强度红光档位表格列定义
const hgLevelColumns = [
  {
    title: '低强度红光设备',
    dataIndex: 'device',
    key: 'device',
    width: 120,
    align: 'center'
  },
  {
    title: '可选档位',
    dataIndex: 'levels',
    key: 'levels',
    align: 'left'
  }
];

// 低强度红光档位表格数据源
const hgLevelData = computed(() => {
  const allLevels = {
    '唯迪科': [0, 3, 6, 9, 12, 15],
    '小太阳': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    '三代人': [], // 无档位
    '其他': [] // 无档位
  };
  
  return Object.keys(allLevels).map(device => ({
    device,
    levels: allLevels[device]
  }));
});

// 处理品牌选择变化
const handleBrandSelectionChange = (method, selectedBrands) => {
  treatmentSettingsForm.value.glassesBrands[method] = selectedBrands;
};

// 处理档位选择变化
const handleLevelSelectionChange = (device, selectedLevels) => {
  treatmentSettingsForm.value.hgLevels[device] = selectedLevels;
};

// 患者类型管理相关
const newPatientType = ref('');
const editingPatientTypeIndex = ref(-1);
const editingPatientTypeValue = ref('');
const editingInputRef = ref(null);

// 添加患者类型
const handleAddPatientType = () => {
  const typeName = newPatientType.value.trim();
  if (!typeName) {
    message.warning('患者类型名称不能为空');
    return;
  }
  
  if (!settingsForm.value.patientTypes) {
    settingsForm.value.patientTypes = [];
  }
  
  // 检查是否已存在
  if (settingsForm.value.patientTypes.includes(typeName)) {
    message.warning('该患者类型已存在');
    return;
  }
  
  settingsForm.value.patientTypes.push(typeName);
  newPatientType.value = '';
  message.success('患者类型添加成功');
};

// 编辑患者类型
const handleEditPatientType = (index) => {
  editingPatientTypeIndex.value = index;
  editingPatientTypeValue.value = settingsForm.value.patientTypes[index];
  // 使用 nextTick 确保 DOM 更新后再聚焦
  setTimeout(() => {
    if (editingInputRef.value) {
      editingInputRef.value.focus();
    }
  }, 100);
};

// 保存患者类型编辑
const handleSavePatientType = (index) => {
  const newValue = editingPatientTypeValue.value.trim();
  if (!newValue) {
    message.warning('患者类型名称不能为空');
    // 恢复原值
    editingPatientTypeValue.value = settingsForm.value.patientTypes[index];
    editingPatientTypeIndex.value = -1;
    return;
  }
  
  // 检查是否与其他项重复
  const currentValue = settingsForm.value.patientTypes[index];
  if (newValue !== currentValue && settingsForm.value.patientTypes.includes(newValue)) {
    message.warning('该患者类型已存在');
    editingPatientTypeValue.value = currentValue;
    editingPatientTypeIndex.value = -1;
    return;
  }
  
  settingsForm.value.patientTypes[index] = newValue;
  editingPatientTypeIndex.value = -1;
  editingPatientTypeValue.value = '';
  message.success('患者类型已更新');
};

// 删除患者类型
const handleDeletePatientType = (index) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除患者类型"${settingsForm.value.patientTypes[index]}"吗？已使用该类型的患者记录不会受影响。`,
    onOk() {
      settingsForm.value.patientTypes.splice(index, 1);
      message.success('患者类型已删除');
    }
  });
};

// 显示设置表单（仅保存在localStorage）
const displaySettingsForm = ref({
  birthDateDisplayFormat: 'age_decimal', // 默认显示年龄（一位小数）
  advanceReminderDays: 0 // 默认提前提醒0天
});

// 加载显示设置
const loadDisplaySettings = () => {
  try {
    const savedDisplaySettings = localStorage.getItem('displaySettings');
    if (savedDisplaySettings) {
      const settings = JSON.parse(savedDisplaySettings);
      displaySettingsForm.value = {
        birthDateDisplayFormat: settings.birthDateDisplayFormat || 'age_decimal',
        advanceReminderDays: settings.advanceReminderDays || 0
      };
    }
  } catch (error) {
    console.error('加载显示设置失败:', error);
  }
};

// 保存显示设置
const saveDisplaySettings = () => {
  try {
    localStorage.setItem('displaySettings', JSON.stringify(displaySettingsForm.value));
    console.log('显示设置已保存到localStorage:', displaySettingsForm.value);
    
    // 触发显示设置变化事件，通知其他组件
    window.dispatchEvent(new CustomEvent('display-settings-changed', {
      detail: displaySettingsForm.value
    }));
    
    // 显示成功提示
    message.success('显示设置已保存');
  } catch (error) {
    console.error('保存显示设置失败:', error);
    message.error('保存显示设置失败');
  }
};

// 加载方案设置
const loadTreatmentSettings = () => {
  try {
    const savedTreatmentSettings = localStorage.getItem('treatmentSettings');
    if (savedTreatmentSettings) {
      const settings = JSON.parse(savedTreatmentSettings);
      treatmentSettingsForm.value = {
        glassesMethods: settings.glassesMethods || ['离焦镜', '点扩散', 'OK镜', '离焦软镜', 'RGP', '单光镜', '渐近镜', '双效离焦点扩散'],
        glassesBrands: settings.glassesBrands || {
          '离焦镜': ['星趣控', '新乐学', '轻松控', '爱眼星', '成长乐', '小乐园', '奥拉', '学趣控', '成长怡', '国产', '艾视晰', '蔚来星空', '欧陆智造', '柯学佳', '欧视佳', '益贝视', '其他'],
          '点扩散': ['控优点2.0', '控优点3.0', '爱眼星', '柯学优', '其他'],
          'OK镜': ['亨泰', '普诺瞳', 'CRT', '阿尔法', '露晰德', '欧几里德', '梦戴维', '天瞳', '菁眸', '目立康', '其他'],
          '离焦软镜': ['misight', '蝶适', '其他'],
          'RGP': ['目立康', '菲仕康', '亨泰', '其他'],
          '单光镜': ['蔡司', '依视路', '国产', '其他'],
          '渐近镜': ['蔡司', '依视路', '国产', '其他'],
          '双效离焦点扩散': ['格林视通', '爱眼星', '其他']
        },
        hgDevices: settings.hgDevices || ['唯迪科', '小太阳', '三代人', '其他'],
        hgLevels: settings.hgLevels || {
          '唯迪科': [0, 3, 6, 9, 12, 15],
          '小太阳': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          '三代人': [], // 无档位
          '其他': [] // 无档位
        }
      };
    }
  } catch (error) {
    console.error('加载方案设置失败:', error);
  }
};

// 保存方案设置
const saveTreatmentSettings = () => {
  try {
    localStorage.setItem('treatmentSettings', JSON.stringify(treatmentSettingsForm.value));
    console.log('方案设置已保存到localStorage:', treatmentSettingsForm.value);
    
    // 触发方案设置变化事件，通知其他组件
    window.dispatchEvent(new CustomEvent('treatment-settings-changed', {
      detail: treatmentSettingsForm.value
    }));
    
    // 显示成功提示
    message.success('方案设置已保存');
  } catch (error) {
    console.error('保存方案设置失败:', error);
    message.error('保存方案设置失败');
  }
};

const showSettings = async () => {
  // 检查是否为子账号
  if (isSubaccount.value) {
    message.warning('子账号无法访问系统设置');
    return;
  }
  
  settingsVisible.value = true;
  
  // 加载显示设置（从localStorage）
  loadDisplaySettings();
  
  // 加载方案设置（从localStorage）
  loadTreatmentSettings();
  
  // 优先从localStorage加载设置，确保显示最新保存的值
  const savedSettings = localStorage.getItem('systemSettings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      // 使用Object.assign确保响应式更新
      Object.assign(settingsForm.value, {
        printName: settings.printName || '',
        checkCycle: settings.checkCycle || 1,
        logoUrl: settings.logoUrl || '',
        autoRefreshMode: settings.autoRefreshMode || 'auto',
        autoRefreshInterval: settings.autoRefreshInterval || 15,
        external_contact: settings.external_contact || '',
        address: settings.address || '',
        patientTypes: Array.isArray(settings.patientTypes) && settings.patientTypes.length > 0 ? settings.patientTypes : DEFAULT_PATIENT_TYPES // 从localStorage加载，如果为空则使用系统预设
      });
      
      console.log('更新后的settingsForm.value:', settingsForm.value);
      console.log('autoRefreshInterval值:', settingsForm.value.autoRefreshInterval);
      
      // 更新文件列表
      if (settings.logoUrl) {
        const logoUrl = settings.logoUrl.startsWith('http://') 
          ? settings.logoUrl.replace('http://', 'https://') 
          : settings.logoUrl;
        
        fileList.value = [{
          uid: '-1',
          name: 'logo.png',
          status: 'done',
          url: logoUrl
        }];
      } else {
        fileList.value = [];
      }
      
      console.log('从localStorage快速加载系统设置（临时显示）:', settings);
      // 注意：不再直接返回，继续执行后端请求以获取最新数据
      // 这样可以先显示缓存数据提供即时反馈，然后更新为最新数据
    } catch (error) {
      console.error('解析localStorage中的系统设置失败:', error);
    }
  }
  
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

      // 先获取本地设置，保留更新设置
      const currentLocalSettings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
      
      // 更新表单数据
      settingsForm.value = {
        printName: orgData.print_name || '',
        checkCycle: orgData.review_interval_days || 1,
        logoUrl: orgData.logo || '',
        // 更新设置使用本地值，不从后端获取
        autoRefreshMode: currentLocalSettings.autoRefreshMode || 'auto',
        autoRefreshInterval: currentLocalSettings.autoRefreshInterval || 15,
        external_contact: orgData.external_contact || '', // 从后端获取机构联系电话
        address: orgData.address || '', // 从后端获取机构地址
        patientTypes: Array.isArray(orgData.patient_types) && orgData.patient_types.length > 0 ? orgData.patient_types : DEFAULT_PATIENT_TYPES // 从后端获取患者类型选项，如果为空则使用系统预设
      };

      // 更新文件列表
      if (orgData.logo) {
        // 确保logo URL使用HTTPS协议
        const logoUrl = orgData.logo.startsWith('http://') 
          ? orgData.logo.replace('http://', 'https://') 
          : orgData.logo;
        
        fileList.value = [{
          uid: '-1',
          name: 'logo.png',
          status: 'done',
          url: logoUrl
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
        autoRefreshMode: orgData.auto_refresh_mode || 'auto', // 保存自动更新模式
        autoRefreshInterval: orgData.auto_refresh_interval || 15, // 保存自动刷新间隔
        external_contact: orgData.external_contact || '', // 保存机构联系电话
        address: orgData.address || '', // 保存机构地址
        patientTypes: Array.isArray(orgData.patient_types) && orgData.patient_types.length > 0 ? orgData.patient_types : DEFAULT_PATIENT_TYPES, // 保存患者类型选项，如果后端没有配置则使用系统预设

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
      
      // 触发患者类型设置变化事件，通知患者列表组件刷新
      window.dispatchEvent(new CustomEvent('patient-types-changed', {
        detail: systemSettings.patientTypes
      }));
      
      console.log('从后端获取最新系统设置成功');
    } else {
      message.error(response.data.message || '获取设置失败');
    }
  } catch (error) {
    console.error('获取设置失败:', error);
    // 如果之前已经显示了缓存数据，不显示错误提示（避免打扰用户）
    // 只有在没有缓存数据时才显示错误
    const hasCachedData = localStorage.getItem('systemSettings');
    if (!hasCachedData) {
    message.error('获取设置失败，请稍后重试');
    }

    // 如果获取失败，尝试从本地存储加载
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      // 只更新表单相关的设置
      settingsForm.value = {
        printName: settings.printName || '',
        checkCycle: settings.checkCycle || 1,
        logoUrl: settings.logoUrl || '',
        autoRefreshMode: settings.autoRefreshMode || 'auto', // 恢复自动更新模式
        autoRefreshInterval: settings.autoRefreshInterval || 15, // 恢复自动刷新间隔
        external_contact: settings.external_contact || '', // 恢复机构联系电话
        address: settings.address || '', // 恢复机构地址
        patientTypes: Array.isArray(settings.patientTypes) && settings.patientTypes.length > 0 ? settings.patientTypes : DEFAULT_PATIENT_TYPES // 恢复患者类型选项，如果为空则使用系统预设
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

    // 保存显示设置到localStorage（不发送到后端）
    saveDisplaySettings();
    
    // 保存方案设置到localStorage（不发送到后端）
    saveTreatmentSettings();

    // 创建FormData对象（不包含更新设置，这些仅本地存储）
    const formData = new FormData();
    formData.append('review_interval_days', settingsForm.value.checkCycle);
    formData.append('print_name', settingsForm.value.printName);
    // 注意：autoRefreshMode 和 autoRefreshInterval 不发送到后端，仅本地存储
    formData.append('external_contact', settingsForm.value.external_contact);
    formData.append('address', settingsForm.value.address);
    formData.append('advance_reminder_days', displaySettingsForm.value.advanceReminderDays);
    // 发送患者类型选项数组（JSON字符串）
    if (settingsForm.value.patientTypes && Array.isArray(settingsForm.value.patientTypes)) {
      formData.append('patient_types', JSON.stringify(settingsForm.value.patientTypes));
    }
    
    // 调试：打印发送的数据
    console.log('发送到后端的设置数据（不包含更新设置）:');
    console.log('完整的settingsForm.value:', settingsForm.value);

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
      console.log('后端保存响应:', response.data);
      
      // 获取最新的完整机构信息
      const detailResponse = await axios.get(`${API_BASE_URL}/organization/detail/${orgId}/`);
      if (detailResponse.data.code === 200) {
        const orgData = detailResponse.data.data;
        console.log('保存后从后端获取的数据:', orgData);
        console.log('后端返回的auto_refresh_interval:', orgData.auto_refresh_interval);

        // 更新本地存储，保存所有机构信息
        const systemSettings = {
          // 表单相关设置（从后端获取）
          printName: orgData.print_name || '',
          checkCycle: orgData.review_interval_days || 1,
          logoUrl: orgData.logo || '',
          external_contact: orgData.external_contact || '', // 保存机构联系电话
          address: orgData.address || '', // 保存机构地址
          patientTypes: Array.isArray(orgData.patient_types) && orgData.patient_types.length > 0 ? orgData.patient_types : (settingsForm.value.patientTypes && settingsForm.value.patientTypes.length > 0 ? settingsForm.value.patientTypes : DEFAULT_PATIENT_TYPES), // 保存患者类型选项，优先使用后端数据，其次使用表单数据，最后使用系统预设
          
          // 更新设置（使用当前表单的值，因为这是用户刚刚修改的）
          autoRefreshMode: settingsForm.value.autoRefreshMode,
          autoRefreshInterval: settingsForm.value.autoRefreshInterval,

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
        console.log('保存后的本地设置:', systemSettings);
        
        // 触发患者类型设置变化事件，通知患者列表组件刷新
        window.dispatchEvent(new CustomEvent('patient-types-changed', {
          detail: systemSettings.patientTypes
        }));

        // 更新表单显示值，确保下次打开时显示最新数据
        settingsForm.value = {
          printName: orgData.print_name || '',
          checkCycle: orgData.review_interval_days || 1,
          logoUrl: orgData.logo || '',
          autoRefreshMode: settingsForm.value.autoRefreshMode, // 保持用户刚设置的值
          autoRefreshInterval: settingsForm.value.autoRefreshInterval, // 保持用户刚设置的值
          external_contact: orgData.external_contact || '',
          address: orgData.address || '',
          patientTypes: Array.isArray(orgData.patient_types) && orgData.patient_types.length > 0 ? orgData.patient_types : (settingsForm.value.patientTypes && settingsForm.value.patientTypes.length > 0 ? settingsForm.value.patientTypes : DEFAULT_PATIENT_TYPES) // 保持用户刚设置的值或从后端获取，最后使用系统预设
        };

        // 更新文件列表中的图片URL
        if (orgData.logo) {
          // 确保logo URL使用HTTPS协议
          const logoUrl = orgData.logo.startsWith('http://') 
            ? orgData.logo.replace('http://', 'https://') 
            : orgData.logo;
          
          fileList.value = [{
            uid: '-1',
            name: 'logo.png',
            status: 'done',
            url: logoUrl
          }];
        }
      }

      message.success('基本设置已保存');
      settingsVisible.value = false;
      
      // 触发设置变化事件，通知工作台组件
      window.dispatchEvent(new CustomEvent('system-settings-changed'));
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
const permissionActiveTab = ref('members'); // 当前激活的标签页
const permissionManagementForm = ref({
  roleName: '',
  permissions: []
});

// 权限分组配置
const permissionGroups = ref([
  {
    title: '工作台',
    key: 'dashboard',
    permissions: [
      { key: 'dashboard', label: '工作台' }
    ]
  },
  {
    title: '患者管理',
    key: 'patient',
    permissions: [
      { key: 'patient-list', label: '患者列表' },
      { key: 'patient-check', label: '复查管理' },
      { key: 'patient-appointment', label: '预约管理' }
    ]
  },
  {
    title: '检查管理',
    key: 'examination',
    permissions: [
      { key: 'examination-1', label: '快速复查' },
      { key: 'examination-2', label: '检查档案' },
                { key: 'examination-3', label: '检查设备' }
    ]
  },
]);

// 获取所有权限的扁平列表（用于兼容现有代码）
const permissions = computed(() => {
  return permissionGroups.value.flatMap(group => group.permissions);
});

const selectedPermissions = ref([]);

// 新增：可用权限列表模态框相关
const availablePermissionsVisible = ref(false);

const showAvailablePermissionsModal = () => {
  availablePermissionsVisible.value = true;
};

const handleAvailablePermissionsCancel = () => {
  availablePermissionsVisible.value = false;
};

// 工具函数：获取成员列表（供其他地方使用）
const getMemberListFromCache = () => {
  const orgId = localStorage.getItem('organization_id');
  if (!orgId) return null;
  
  const cacheKey = `memberList_${orgId}`;
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    try {
      const parsedData = JSON.parse(cachedData);
      const cacheTime = parsedData.timestamp;
      const currentTime = Date.now();
      
      // 缓存有效期：5分钟
      if (currentTime - cacheTime < 5 * 60 * 1000) {
        return parsedData.data;
      }
    } catch (error) {
      console.error('解析缓存的成员列表失败:', error);
    }
  }
  
  return null;
};

// 工具函数：清除成员列表缓存
const clearMemberListCache = () => {
  const orgId = localStorage.getItem('organization_id');
  if (orgId) {
    const cacheKey = `memberList_${orgId}`;
    localStorage.removeItem(cacheKey);
    console.log('成员列表缓存已清除');
  }
};

// 成员列表分页相关
const currentPage = ref(1);
const pageSize = ref(5); // 每页显示5条
const totalMembers = ref(0);

const handleTableChange = (pagination) => {
  currentPage.value = pagination.current;
  pageSize.value = pagination.pageSize;
};

// 全选功能 - 针对添加成员表单
const selectAllPermissionsForAdd = () => {
  const allPermissions = permissionGroups.value.flatMap(group => 
    group.permissions.map(perm => perm.key)
  );
  addMemberForm.value.permissions = allPermissions;
};

// 取消全选 - 针对添加成员表单
const deselectAllPermissionsForAdd = () => {
  addMemberForm.value.permissions = [];
};

// 选择某个分组的所有权限 - 针对添加成员表单
const selectGroupPermissionsForAdd = (groupKey) => {
  const group = permissionGroups.value.find(g => g.key === groupKey);
  if (group) {
    const groupPermissions = group.permissions.map(perm => perm.key);
    // 添加该分组的所有权限（避免重复）
    groupPermissions.forEach(perm => {
      if (!addMemberForm.value.permissions.includes(perm)) {
        addMemberForm.value.permissions.push(perm);
      }
    });
  }
};

// 取消选择某个分组的所有权限 - 针对添加成员表单
const deselectGroupPermissionsForAdd = (groupKey) => {
  const group = permissionGroups.value.find(g => g.key === groupKey);
  if (group) {
    const groupPermissions = group.permissions.map(perm => perm.key);
    addMemberForm.value.permissions = addMemberForm.value.permissions.filter(
      perm => !groupPermissions.includes(perm)
    );
  }
};

// 检查某个分组是否全选 - 针对添加成员表单
const isGroupSelectedForAdd = (groupKey) => {
  const group = permissionGroups.value.find(g => g.key === groupKey);
  if (!group) return false;
  
  const groupPermissions = group.permissions.map(perm => perm.key);
  const isSelected = groupPermissions.every(perm => addMemberForm.value.permissions.includes(perm));
  console.log(`添加成员 - 分组 ${groupKey} 是否全选:`, isSelected, '当前权限:', addMemberForm.value.permissions, '分组权限:', groupPermissions);
  return isSelected;
};

// 检查某个分组是否部分选择 - 针对添加成员表单
const isGroupIndeterminateForAdd = (groupKey) => {
  const group = permissionGroups.value.find(g => g.key === groupKey);
  if (!group) return false;
  
  const groupPermissions = group.permissions.map(perm => perm.key);
  const selectedCount = groupPermissions.filter(perm => 
    addMemberForm.value.permissions.includes(perm)
  ).length;
  
  return selectedCount > 0 && selectedCount < groupPermissions.length;
};

// 全选功能 - 针对编辑成员表单
const selectAllPermissionsForEdit = () => {
  const allPermissions = permissionGroups.value.flatMap(group => 
    group.permissions.map(perm => perm.key)
  );
  editMemberForm.value.permissions = allPermissions;
};

// 取消全选 - 针对编辑成员表单
const deselectAllPermissionsForEdit = () => {
  editMemberForm.value.permissions = [];
};

// 选择某个分组的所有权限 - 针对编辑成员表单
const selectGroupPermissionsForEdit = (groupKey) => {
  const group = permissionGroups.value.find(g => g.key === groupKey);
  if (group) {
    const groupPermissions = group.permissions.map(perm => perm.key);
    // 添加该分组的所有权限（避免重复）
    groupPermissions.forEach(perm => {
      if (!editMemberForm.value.permissions.includes(perm)) {
        editMemberForm.value.permissions.push(perm);
      }
    });
  }
};

// 取消选择某个分组的所有权限 - 针对编辑成员表单
const deselectGroupPermissionsForEdit = (groupKey) => {
  const group = permissionGroups.value.find(g => g.key === groupKey);
  if (group) {
    const groupPermissions = group.permissions.map(perm => perm.key);
    editMemberForm.value.permissions = editMemberForm.value.permissions.filter(
      perm => !groupPermissions.includes(perm)
    );
  }
};

// 检查某个分组是否全选 - 针对编辑成员表单
const isGroupSelectedForEdit = (groupKey) => {
  const group = permissionGroups.value.find(g => g.key === groupKey);
  if (!group) return false;
  
  const groupPermissions = group.permissions.map(perm => perm.key);
  const isSelected = groupPermissions.every(perm => editMemberForm.value.permissions.includes(perm));
  console.log(`分组 ${groupKey} 是否全选:`, isSelected, '当前权限:', editMemberForm.value.permissions, '分组权限:', groupPermissions);
  return isSelected;
};

// 检查某个分组是否部分选择 - 针对编辑成员表单
const isGroupIndeterminateForEdit = (groupKey) => {
  const group = permissionGroups.value.find(g => g.key === groupKey);
  if (!group) return false;
  
  const groupPermissions = group.permissions.map(perm => perm.key);
  const selectedCount = groupPermissions.filter(perm => 
    editMemberForm.value.permissions.includes(perm)
  ).length;
  
  return selectedCount > 0 && selectedCount < groupPermissions.length;
};

// 修改showPermissionManagement函数，获取成员列表
const showPermissionManagement = () => {
  // 检查是否为子账号
  if (isSubaccount.value) {
    message.warning('子账号无法访问权限管理');
    return;
  }
  
  permissionManagementVisible.value = true;
  // 获取成员列表（优先使用缓存）
  getMemberList();
  // 获取医生列表
  getDoctorList();
  // 获取职称和角色数据（优先使用一次性获取接口）
  getDoctorDicts();
};

// 添加成员相关
const addMemberVisible = ref(false);
const addMemberForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  permissions: []
});

// 编辑成员相关
const editMemberVisible = ref(false);
const editMemberForm = ref({
  id: null,
  username: '',
  password: '',
  confirmPassword: '',
  permissions: []
});

// 修改密码相关
const changePasswordVisible = ref(false);
const changePasswordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
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
  
  // 检查用户名是否为中文
  const chineseRegex = /^[\u4e00-\u9fa5]+$/;
  if (!chineseRegex.test(addMemberForm.value.username.trim())) {
    message.error('用户名必须是中文！');
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

    const requestData = {
      organization_id: orgId,
      account: addMemberForm.value.username.trim(),
      password: addMemberForm.value.password,
      permissions: addMemberForm.value.permissions
    };

    console.log('添加成员请求数据:', requestData);
    const response = await axios.post(
      `${API_BASE_URL}/subaccount/add/`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('添加成员响应:', response.data);
    if (response.data.code === 200) {
      message.success('成员添加成功！');
      addMemberVisible.value = false; // 关闭添加成员模态框
      // 强制刷新成员列表
      getMemberList(true);
    } else {
      message.error(response.data.message || '添加成员失败');
    }
  } catch (error) {
    console.error('添加成员失败:', error);
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      const errorMessage = errorData.message || '添加成员失败';
      
      // 处理特定的409错误情况
      if (error.response.status === 409) {
        if (errorMessage.includes('该机构下已存在相同账号')) {
          message.error('该机构下已存在相同账号，请使用其他用户名');
        } else if (errorMessage.includes('已有账号和密码相同的存在')) {
          message.error('已有账号和密码相同的存在，请修改密码');
        } else {
          message.error(errorMessage);
        }
      } else if (error.response.status === 400) {
        message.error('请求参数错误：' + errorMessage);
      } else {
        message.error(errorMessage);
      }
    } else {
      message.error('添加成员失败，请稍后重试');
    }
  }
};

const handleAddMemberCancel = () => {
  addMemberVisible.value = false;
};

// 编辑成员相关函数
const editMember = (record) => {
  editMemberForm.value = {
    id: record.id,
    username: record.account,
    password: '',
    confirmPassword: '',
    permissions: record.permissions || []
  };
  editMemberVisible.value = true;
};

const handleEditMemberOk = async () => {
  // 表单验证
  if (!editMemberForm.value.username.trim()) {
    message.error('请输入用户名！');
    return;
  }
  
  // 检查用户名是否为中文
  const chineseRegex = /^[\u4e00-\u9fa5]+$/;
  if (!chineseRegex.test(editMemberForm.value.username.trim())) {
    message.error('用户名必须是中文！');
    return;
  }
  
  if (editMemberForm.value.password && editMemberForm.value.password.length < 6) {
    message.error('密码长度不能少于6位！');
    return;
  }
  
  if (editMemberForm.value.password !== editMemberForm.value.confirmPassword) {
    message.error('两次输入的密码不一致！');
    return;
  }

  try {
    const orgId = localStorage.getItem('organization_id');
    if (!orgId) {
      message.error('未找到机构ID');
      return;
    }

    const requestData = {
      organization_id: orgId, // 添加必传的机构ID
      account: editMemberForm.value.username.trim(),
      permissions: editMemberForm.value.permissions
    };

    // 只有当密码不为空时才添加到请求中
    if (editMemberForm.value.password) {
      requestData.password = editMemberForm.value.password;
    }

    console.log('更新成员请求数据:', requestData);
    const response = await axios.post(
      `${API_BASE_URL}/subaccount/update/${editMemberForm.value.id}/`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('更新成员响应:', response.data);
    if (response.data.code === 200) {
      message.success('成员信息更新成功！');
      editMemberVisible.value = false;
      getMemberList(true); // 强制刷新成员列表
    } else {
      message.error(response.data.message || '更新成员信息失败');
    }
  } catch (error) {
    console.error('更新成员信息失败:', error);
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      const errorMessage = errorData.message || '更新成员信息失败';
      
      // 处理特定的409错误情况
      if (error.response.status === 409) {
        if (errorMessage.includes('该机构下账号已存在')) {
          message.error('该机构下已存在相同账号，请使用其他用户名');
        } else if (errorMessage.includes('其他机构已存在相同账号和密码')) {
          message.error('其他机构已存在相同账号和密码，请修改为其他密码');
        } else {
          message.error(errorMessage);
        }
      } else if (error.response.status === 404) {
        message.error('账号不存在，可能已被删除');
      } else {
        message.error(errorMessage);
      }
    } else {
      message.error('更新成员信息失败，请稍后重试');
    }
  }
};

const handleEditMemberCancel = () => {
  editMemberVisible.value = false;
};

// 修改密码相关函数
const showChangePassword = () => {
  // 检查是否为子账号
  if (isSubaccount.value) {
    message.warning('子账号无法修改密码');
    return;
  }
  
  changePasswordVisible.value = true;
  changePasswordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
};

const handleChangePasswordOk = async () => {
  // 表单验证
  if (!changePasswordForm.value.oldPassword) {
    message.error('请输入当前密码！');
    return;
  }
  
  if (!changePasswordForm.value.newPassword) {
    message.error('请输入新密码！');
    return;
  }
  
  if (changePasswordForm.value.newPassword.length < 6) {
    message.error('新密码长度不能少于6位！');
    return;
  }
  
  if (changePasswordForm.value.newPassword !== changePasswordForm.value.confirmPassword) {
    message.error('两次输入的新密码不一致！');
    return;
  }

  try {
    const currentUsername = localStorage.getItem('current_username');
    if (!currentUsername) {
      message.error('未找到当前用户名');
      return;
    }

    const requestData = {
      username: currentUsername,
      old_password: changePasswordForm.value.oldPassword,
      new_password: changePasswordForm.value.newPassword
    };

    console.log('修改密码请求数据:', requestData);
    const response = await axios.post(
      `${API_BASE_URL}/organization/change_password/`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('修改密码响应:', response.data);
    if (response.data.code === 200) {
      message.success('密码修改成功！请重新登录');
      changePasswordVisible.value = false;
      
      // 修改密码成功后，清除当前账号的缓存数据
      await clearCurrentAccountCache();
      
      // 设置修改密码重新登录标记
      localStorage.setItem('password_change_relogin', 'true');
      
      // 显示提示信息，告知用户需要重新登录
      Modal.info({
        title: '密码修改成功',
        content: '您的密码已成功修改。请使用新密码重新登录，系统将自动勾选"保存账号"选项以保存新的登录信息。',
        okText: '确定',
        closable: true,
        onOk: () => {
          // 触发重新登录
          logout();
        }
      });
    } else {
      message.error(response.data.message || '修改密码失败');
    }
  } catch (error) {
    console.error('修改密码失败:', error);
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      const errorMessage = errorData.message || '修改密码失败';
      
      if (error.response.status === 401) {
        message.error('当前密码错误');
      } else if (error.response.status === 404) {
        message.error('用户不存在');
      } else if (error.response.status === 400) {
        message.error('请求参数错误：' + errorMessage);
      } else {
        message.error(errorMessage);
      }
    } else {
      message.error('修改密码失败，请稍后重试');
    }
  }
};

const handleChangePasswordCancel = () => {
  changePasswordVisible.value = false;
};

// 清除当前账号的缓存数据
const clearCurrentAccountCache = async () => {
  try {
    const currentUsername = localStorage.getItem('current_username');
    if (!currentUsername) return;
    
    // 获取多账号列表
    const accounts = JSON.parse(localStorage.getItem('multiAccounts') || '[]');
    const currentAccountIndex = accounts.findIndex(acc => acc.username === currentUsername);
    
    if (currentAccountIndex >= 0) {
      // 完全删除当前账号，而不是清除密码
      // 因为修改密码后，用户需要重新输入新密码登录
      accounts.splice(currentAccountIndex, 1);
      
      // 保存更新后的账号列表
      localStorage.setItem('multiAccounts', JSON.stringify(accounts));
      console.log('已删除当前账号，用户需要重新输入新密码登录');
    }
  } catch (error) {
    console.error('清除当前账号缓存失败:', error);
  }
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
      closable: true,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
      onClose: () => resolve(false),
    });
  });

  if (!confirmed) {
    return;
  }

  try {
    console.log('删除成员，用户ID:', userId);
    const response = await axios.delete(
      `${API_BASE_URL}/subaccount/delete/${userId}/`
    );

    console.log('删除成员响应:', response.data);
    if (response.data.code === 200) {
      message.success('成员删除成功！');
      getMemberList(true); // 强制刷新成员列表
    } else {
      message.error(response.data.message || '删除成员失败');
    }
  } catch (error) {
    console.error('删除成员失败:', error);
    if (error.response && error.response.data) {
      message.error(error.response.data.message || '删除成员失败');
    } else {
      message.error('删除成员失败，请稍后重试');
    }
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
    dataIndex: 'account',
    key: 'account',
    width: 120, // 调整宽度，减少空白
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180, // 设置固定宽度
  },
  {
    title: '权限',
    dataIndex: 'permissions',
    key: 'permissions',
    width: 380, // 增加权限列宽度，给更多空间显示权限标签
  },
  {
    title: '操作',
    key: 'action',
    width: 120, // 设置固定宽度
  },
]);

// 医生列表的列定义
const doctorColumns = ref([
  {
    title: '医生姓名',
    dataIndex: 'name',
    key: 'name',
    width: 120,
  },
  {
    title: '职称',
    dataIndex: 'title',
    key: 'title',
    width: 120,
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    width: 120,
  },
  {
    title: '手机号码',
    dataIndex: 'phone',
    key: 'phone',
    width: 140,
  },
  {
    title: '名下患者',
    dataIndex: 'patient_count',
    key: 'patient_count',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'is_active',
    key: 'is_active',
    width: 80,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 280,
  },
]);

// 未分配患者列表的列定义
const unassignedPatientColumns = ref([
  {
    title: '患者编号',
    dataIndex: 'gkid',
    key: 'gkid',
    width: 120,
    customRender: ({ text }) => extractGkidNumber(text)
  },
  {
    title: '患者姓名',
    dataIndex: 'name',
    key: 'name',
    width: 120,
  },
  {
    title: '手机号码',
    dataIndex: 'phone',
    key: 'phone',
    width: 140,
  },
  {
    title: '性别',
    dataIndex: 'gender',
    key: 'gender',
    width: 80,
  },
  {
    title: '年龄',
    dataIndex: 'age',
    key: 'age',
    width: 80,
  },
]);

// 医生患者列表的列定义
const doctorPatientColumns = ref([
  {
    title: '患者编号',
    dataIndex: 'gkid',
    key: 'gkid',
    width: 120,
    customRender: ({ text }) => extractGkidNumber(text)
  },
  {
    title: '患者姓名',
    dataIndex: 'name',
    key: 'name',
    width: 120,
  },
  {
    title: '手机号码',
    dataIndex: 'phone',
    key: 'phone',
    width: 140,
  },
  {
    title: '性别',
    dataIndex: 'gender',
    key: 'gender',
    width: 80,
  },
  {
    title: '年龄',
    dataIndex: 'age',
    key: 'age',
    width: 80,
  },
  {
    title: '分配时间',
    dataIndex: 'assigned_at',
    key: 'assigned_at',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
  },
]);

// 成员列表数据
const memberList = ref([]);

// 医生管理相关数据
const doctorList = ref([]);
const doctorLoading = ref(false);
const doctorCurrentPage = ref(1);
const doctorPageSize = ref(10);
const totalDoctors = ref(0);
const doctorSearchKeyword = ref('');

// 医生表单数据
const addDoctorVisible = ref(false);
const addDoctorForm = ref({
  name: '',
  title: null,
  role: null,
  phone: '',
  password: '',
  confirmPassword: ''
});

const editDoctorVisible = ref(false);
const editDoctorForm = ref({
  id: null,
  name: '',
  title: null,
  role: null,
  phone: '',
  password: '',
  confirmPassword: ''
});

// 职称和角色数据
const doctorTitles = ref([]);
const doctorRoles = ref([]);

// 分配患者相关数据
const assignPatientsVisible = ref(false);
const currentDoctor = ref(null);
const unassignedPatientList = ref([]);
const unassignedPatientLoading = ref(false);
const unassignedPatientPage = ref(1);
const unassignedPatientPageSize = ref(20);
const totalUnassignedPatients = ref(0);
const unassignedPatientSearch = ref(''); // 姓名/手机号模糊搜索
const unassignedPatientGkidSearch = ref(''); // 患者编号精准搜索
const selectedPatientIds = ref([]);
const selectedPatients = ref([]); // 存储已选择的患者完整信息
const allUnassignedPatients = ref([]); // 存储所有未分配患者（用于显示已选择但不符合筛选条件的患者）

// 查看医生患者相关数据
const viewDoctorPatientsVisible = ref(false);
const doctorPatientList = ref([]);
const doctorPatientLoading = ref(false);
const doctorPatientPage = ref(1);
const doctorPatientPageSize = ref(20);
const totalDoctorPatients = ref(0);

// 获取成员列表
const getMemberList = async (forceRefresh = false) => {
  const orgId = localStorage.getItem('organization_id');
  if (!orgId) {
    message.error('未找到机构ID');
    return;
  }

  // 检查是否有缓存的成员列表
  const cacheKey = `memberList_${orgId}`;
  const cachedData = localStorage.getItem(cacheKey);
  
  if (!forceRefresh && cachedData) {
    try {
      const parsedData = JSON.parse(cachedData);
      const cacheTime = parsedData.timestamp;
      const currentTime = Date.now();
      
      // 缓存有效期：5分钟
      if (currentTime - cacheTime < 5 * 60 * 1000) {
        console.log('使用缓存的成员列表');
        memberList.value = parsedData.data;
        totalMembers.value = parsedData.data.length;
        return;
      }
    } catch (error) {
      console.error('解析缓存的成员列表失败:', error);
    }
  }

  try {
    console.log('从服务器获取成员列表，机构ID:', orgId);
    const response = await axios.get(`${API_BASE_URL}/subaccount/list/?organization_id=${orgId}`);
    console.log('成员列表响应:', response.data);
    
    if (response.data.code === 200) {
      memberList.value = response.data.data;
      totalMembers.value = response.data.data.length;
      
      // 保存到localStorage
      const cacheData = {
        data: response.data.data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('成员列表已缓存到localStorage');
    } else {
      message.error(response.data.message || '获取成员列表失败');
    }
  } catch (error) {
    console.error('获取成员列表失败:', error);
    message.error('获取成员列表失败，请稍后重试');
  }
};

// =========================
// 医生管理相关函数
// =========================

// 获取医生列表
const getDoctorList = async (forceRefresh = false) => {
  const orgId = localStorage.getItem('organization_id');
  if (!orgId) {
    message.error('未找到机构ID');
    return;
  }

  doctorLoading.value = true;
  try {
    const params = {
      organization_id: orgId,
      page: doctorCurrentPage.value,
      page_size: doctorPageSize.value
    };
    
    if (doctorSearchKeyword.value) {
      params.search = doctorSearchKeyword.value;
    }

    const response = await axios.get(`${API_BASE_URL}/doctor/list/`, { params });
    
    if (response.data.code === 200) {
      doctorList.value = response.data.data.results;
      totalDoctors.value = response.data.data.total;
    } else {
      message.error(response.data.message || '获取医生列表失败');
    }
  } catch (error) {
    console.error('获取医生列表失败:', error);
    message.error('获取医生列表失败，请稍后重试');
  } finally {
    doctorLoading.value = false;
  }
};

// 获取职称列表
const getDoctorTitles = async (includeInactive = false) => {
  try {
    const params = {};
    if (includeInactive) {
      params.include_inactive = 1;
    }
    const response = await axios.get(`${API_BASE_URL}/doctor/titles/`, { params });
    if (response.data.code === 200) {
      doctorTitles.value = response.data.data;
    }
  } catch (error) {
    console.error('获取职称列表失败:', error);
    message.error('获取职称列表失败，请刷新页面重试');
  }
};

// 获取角色列表
const getDoctorRoles = async (includeInactive = false) => {
  try {
    const params = {};
    if (includeInactive) {
      params.include_inactive = 1;
    }
    const response = await axios.get(`${API_BASE_URL}/doctor/roles/`, { params });
    if (response.data.code === 200) {
      doctorRoles.value = response.data.data;
    }
  } catch (error) {
    console.error('获取角色列表失败:', error);
    message.error('获取角色列表失败，请刷新页面重试');
  }
};

// 获取职称和角色字典（一次性获取）
const getDoctorDicts = async (includeInactive = false) => {
  try {
    const params = {};
    if (includeInactive) {
      params.include_inactive = 1;
    }
    const response = await axios.get(`${API_BASE_URL}/doctor/dicts/`, { params });
    if (response.data.code === 200) {
      doctorTitles.value = response.data.data.titles || [];
      doctorRoles.value = response.data.data.roles || [];
      
      // 调试输出
      console.log('获取到的职称数据:', doctorTitles.value);
      console.log('获取到的角色数据:', doctorRoles.value);
    }
  } catch (error) {
    console.error('获取医生字典数据失败:', error);
    // 如果一次性获取失败，分别获取
    await getDoctorTitles(includeInactive);
    await getDoctorRoles(includeInactive);
  }
};

// 搜索医生
const searchDoctors = () => {
  doctorCurrentPage.value = 1;
  getDoctorList();
};

// 医生搜索变化处理
const onDoctorSearchChange = (e) => {
  doctorSearchKeyword.value = e.target.value;
  if (!doctorSearchKeyword.value) {
    searchDoctors();
  }
};

// 医生表格分页变化
const handleDoctorTableChange = (pagination) => {
  doctorCurrentPage.value = pagination.current;
  doctorPageSize.value = pagination.pageSize;
  getDoctorList();
};

// 显示添加医生模态框
const showAddDoctorModal = () => {
  addDoctorForm.value = {
    name: '',
    title: null,
    role: null,
    phone: '',
    password: '',
    confirmPassword: ''
  };
  addDoctorVisible.value = true;
};

// 添加医生
const handleAddDoctorOk = async () => {
  // 表单验证
  if (!addDoctorForm.value.name.trim()) {
    message.error('请输入医生姓名！');
    return;
  }
  
  // 检查姓名是否为中文
  const chineseRegex = /^[\u4e00-\u9fa5·]{2,20}$/;
  if (!chineseRegex.test(addDoctorForm.value.name.trim())) {
    message.error('医生姓名必须是2-20个中文字符！');
    return;
  }
  
  if (!addDoctorForm.value.title) {
    message.error('请选择职称！');
    return;
  }
  
  if (!addDoctorForm.value.role) {
    message.error('请选择角色！');
    return;
  }
  
  if (!addDoctorForm.value.phone) {
    message.error('请输入手机号码！');
    return;
  }
  
  // 检查手机号格式
  const phoneRegex = /^\d{11}$/;
  if (!phoneRegex.test(addDoctorForm.value.phone)) {
    message.error('手机号码必须为11位数字！');
    return;
  }
  
  if (addDoctorForm.value.password && addDoctorForm.value.password.length < 6) {
    message.error('密码长度不能少于6位！');
    return;
  }
  
  if (addDoctorForm.value.password !== addDoctorForm.value.confirmPassword) {
    message.error('两次输入的密码不一致！');
    return;
  }

  try {
    const orgId = localStorage.getItem('organization_id');
    if (!orgId) {
      message.error('未找到机构ID');
      return;
    }

    const requestData = {
      organization_id: parseInt(orgId),
      name: addDoctorForm.value.name.trim(),
      title: addDoctorForm.value.title,
      role: addDoctorForm.value.role,
      phone: addDoctorForm.value.phone
    };

    if (addDoctorForm.value.password) {
      requestData.password = addDoctorForm.value.password;
    }

    const response = await axios.post(`${API_BASE_URL}/doctor/add/`, requestData);

    if (response.data.code === 200) {
      message.success('医生添加成功！');
      addDoctorVisible.value = false;
      getDoctorList(true);
    } else {
      message.error(response.data.message || '添加医生失败');
    }
  } catch (error) {
    console.error('添加医生失败:', error);
    if (error.response && error.response.data) {
      message.error(error.response.data.message || '添加医生失败');
    } else {
      message.error('添加医生失败，请稍后重试');
    }
  }
};

const handleAddDoctorCancel = () => {
  addDoctorVisible.value = false;
};

// 编辑医生
const editDoctor = (record) => {
  editDoctorForm.value = {
    id: record.id,
    name: record.name,
    title: record.title_id || record.title,
    role: record.role_id || record.role,
    phone: record.phone,
    password: '',
    confirmPassword: ''
  };
  editDoctorVisible.value = true;
};

const handleEditDoctorOk = async () => {
  // 表单验证
  if (!editDoctorForm.value.name.trim()) {
    message.error('请输入医生姓名！');
    return;
  }
  
  const chineseRegex = /^[\u4e00-\u9fa5·]{2,20}$/;
  if (!chineseRegex.test(editDoctorForm.value.name.trim())) {
    message.error('医生姓名必须是2-20个中文字符！');
    return;
  }
  
  if (!editDoctorForm.value.title) {
    message.error('请选择职称！');
    return;
  }
  
  if (!editDoctorForm.value.role) {
    message.error('请选择角色！');
    return;
  }
  
  if (!editDoctorForm.value.phone) {
    message.error('请输入手机号码！');
    return;
  }
  
  const phoneRegex = /^\d{11}$/;
  if (!phoneRegex.test(editDoctorForm.value.phone)) {
    message.error('手机号码必须为11位数字！');
    return;
  }
  
  if (editDoctorForm.value.password && editDoctorForm.value.password.length < 6) {
    message.error('密码长度不能少于6位！');
    return;
  }
  
  if (editDoctorForm.value.password !== editDoctorForm.value.confirmPassword) {
    message.error('两次输入的密码不一致！');
    return;
  }

  try {
    const orgId = localStorage.getItem('organization_id');
    if (!orgId) {
      message.error('未找到机构ID');
      return;
    }

    const requestData = {
      organization_id: parseInt(orgId),
      name: editDoctorForm.value.name.trim(),
      title: editDoctorForm.value.title,
      role: editDoctorForm.value.role,
      phone: editDoctorForm.value.phone
    };

    if (editDoctorForm.value.password) {
      requestData.password = editDoctorForm.value.password;
    }

    const response = await axios.put(`${API_BASE_URL}/doctor/update/${editDoctorForm.value.id}/`, requestData);

    if (response.data.code === 200) {
      message.success('医生信息更新成功！');
      editDoctorVisible.value = false;
      getDoctorList(true);
    } else {
      message.error(response.data.message || '更新医生信息失败');
    }
  } catch (error) {
    console.error('更新医生信息失败:', error);
    if (error.response && error.response.data) {
      message.error(error.response.data.message || '更新医生信息失败');
    } else {
      message.error('更新医生信息失败，请稍后重试');
    }
  }
};

const handleEditDoctorCancel = () => {
  editDoctorVisible.value = false;
};

// 删除医生
const deleteDoctor = async (doctorId) => {
  const confirmed = await new Promise((resolve) => {
    const modal = Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个医生吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      closable: true,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
      onClose: () => resolve(false),
    });
  });

  if (!confirmed) {
    return;
  }

  try {
    const orgId = localStorage.getItem('organization_id');
    if (!orgId) {
      message.error('未找到机构ID');
      return;
    }

    const response = await axios.delete(`${API_BASE_URL}/doctor/delete/${doctorId}/?organization_id=${orgId}`);

    if (response.data.code === 200) {
      message.success('医生删除成功！');
      getDoctorList(true);
    } else {
      message.error(response.data.message || '删除医生失败');
    }
  } catch (error) {
    console.error('删除医生失败:', error);
    if (error.response && error.response.data) {
      message.error(error.response.data.message || '删除医生失败');
    } else {
      message.error('删除医生失败，请稍后重试');
    }
  }
};

// 分配患者相关函数
const assignPatients = (record) => {
  currentDoctor.value = record;
  assignPatientsVisible.value = true;
  selectedPatientIds.value = [];
  selectedPatients.value = [];
  allUnassignedPatients.value = [];
  unassignedPatientPage.value = 1;
  unassignedPatientSearch.value = '';
  unassignedPatientGkidSearch.value = '';
  getUnassignedPatients();
};

// 获取未分配的患者列表
const getUnassignedPatients = async () => {
  const orgId = localStorage.getItem('organization_id');
  if (!orgId) {
    message.error('未找到机构ID');
    return;
  }

  unassignedPatientLoading.value = true;
  try {
    const params = {
      organization_id: orgId,
      page: unassignedPatientPage.value,
      page_size: unassignedPatientPageSize.value
    };
    
    if (unassignedPatientSearch.value) {
      params.search = unassignedPatientSearch.value;
    }
    
    if (unassignedPatientGkidSearch.value) {
      params.gkid = unassignedPatientGkidSearch.value;
    }
    
    console.log('获取未分配患者列表参数:', params);

    const response = await axios.get(`${API_BASE_URL}/doctor/unassigned-patients/`, { params });
    
    if (response.data.code === 200) {
      const currentPagePatients = response.data.data.results;
      
      // 如果是第一页且没有搜索条件，保存所有患者数据
      if (unassignedPatientPage.value === 1 && !unassignedPatientSearch.value && !unassignedPatientGkidSearch.value) {
        allUnassignedPatients.value = currentPagePatients;
      }
      
      // 合并当前页患者和已选择的患者（确保已选择的患者显示在列表中）
      const selectedPatientsInCurrentPage = selectedPatients.value.filter(patient => 
        currentPagePatients.some(currentPatient => currentPatient.id === patient.id)
      );
      
      // 添加已选择但不在当前页的患者
      const selectedPatientsNotInCurrentPage = selectedPatients.value.filter(patient => 
        !currentPagePatients.some(currentPatient => currentPatient.id === patient.id)
      );
      
      unassignedPatientList.value = [
        ...selectedPatientsNotInCurrentPage, // 已选择但不符合当前筛选条件的患者
        ...currentPagePatients
      ];
      
      totalUnassignedPatients.value = response.data.data.total;
    } else {
      message.error(response.data.message || '获取未分配患者列表失败');
    }
  } catch (error) {
    console.error('获取未分配患者列表失败:', error);
    message.error('获取未分配患者列表失败，请稍后重试');
  } finally {
    unassignedPatientLoading.value = false;
  }
};

// 搜索未分配患者
const searchUnassignedPatients = () => {
  unassignedPatientPage.value = 1;
  getUnassignedPatients();
};

// 未分配患者搜索变化处理
const onUnassignedPatientSearchChange = (e) => {
  unassignedPatientSearch.value = e.target.value;
  if (!unassignedPatientSearch.value) {
    // 清空搜索时，重新获取列表
    unassignedPatientPage.value = 1;
    getUnassignedPatients();
  }
};

// 未分配患者编号搜索变化处理（自动筛选）
const onUnassignedPatientGkidSearchChange = (e) => {
  unassignedPatientGkidSearch.value = e.target.value;
  console.log('编号搜索变化:', unassignedPatientGkidSearch.value);
  // 编号搜索是精准搜索，输入时自动筛选
  unassignedPatientPage.value = 1;
  getUnassignedPatients();
};

// 未分配患者表格分页变化
const handleUnassignedPatientTableChange = (pagination) => {
  unassignedPatientPage.value = pagination.current;
  unassignedPatientPageSize.value = pagination.pageSize;
  getUnassignedPatients();
};

// 未分配患者行选择配置
const unassignedPatientRowSelection = computed(() => ({
  selectedRowKeys: selectedPatientIds.value,
  onChange: (selectedRowKeys, selectedRows) => {
    selectedPatientIds.value = selectedRowKeys;
    
    // 更新已选择的患者完整信息
    selectedPatients.value = selectedRows;
    
    // 如果当前有搜索条件，需要重新获取列表以显示已选择但不符合筛选条件的患者
    if (unassignedPatientSearch.value) {
      getUnassignedPatients();
    }
  },
}));

// 确认分配患者
const handleAssignPatientsOk = async () => {
  if (selectedPatientIds.value.length === 0) {
    message.warning('请选择要分配的患者');
    return;
  }

  try {
    const orgId = localStorage.getItem('organization_id');
    if (!orgId || !currentDoctor.value) {
      message.error('参数错误');
      return;
    }

    const requestData = {
      organization_id: parseInt(orgId),
      doctor_id: currentDoctor.value.id,
      patient_ids: selectedPatientIds.value
    };

    const response = await axios.post(`${API_BASE_URL}/doctor/assign-patients/`, requestData);

    if (response.data.code === 200) {
      message.success(`成功分配 ${response.data.data.assigned_count} 个患者`);
      assignPatientsVisible.value = false;
      // 清空选择状态
      selectedPatientIds.value = [];
      selectedPatients.value = [];
      getDoctorList(true); // 刷新医生列表
    } else {
      message.error(response.data.message || '分配患者失败');
    }
  } catch (error) {
    console.error('分配患者失败:', error);
    if (error.response && error.response.data) {
      message.error(error.response.data.message || '分配患者失败');
    } else {
      message.error('分配患者失败，请稍后重试');
    }
  }
};

const handleAssignPatientsCancel = () => {
  assignPatientsVisible.value = false;
  selectedPatientIds.value = [];
  selectedPatients.value = [];
  allUnassignedPatients.value = [];
  unassignedPatientGkidSearch.value = '';
};

// 查看医生患者
const viewDoctorPatients = (record) => {
  currentDoctor.value = record;
  viewDoctorPatientsVisible.value = true;
  doctorPatientPage.value = 1;
  getDoctorPatients();
};

// 获取医生名下的患者列表
const getDoctorPatients = async () => {
  const orgId = localStorage.getItem('organization_id');
  if (!orgId || !currentDoctor.value) {
    message.error('参数错误');
    return;
  }

  doctorPatientLoading.value = true;
  try {
    const params = {
      organization_id: orgId,
      page: doctorPatientPage.value,
      page_size: doctorPatientPageSize.value
    };

    const response = await axios.get(`${API_BASE_URL}/doctor/${currentDoctor.value.id}/patients/`, { params });
    
    if (response.data.code === 200) {
      doctorPatientList.value = response.data.data.results;
      totalDoctorPatients.value = response.data.data.total;
    } else {
      message.error(response.data.message || '获取医生患者列表失败');
    }
  } catch (error) {
    console.error('获取医生患者列表失败:', error);
    message.error('获取医生患者列表失败，请稍后重试');
  } finally {
    doctorPatientLoading.value = false;
  }
};

// 医生患者表格分页变化
const handleDoctorPatientTableChange = (pagination) => {
  doctorPatientPage.value = pagination.current;
  doctorPatientPageSize.value = pagination.pageSize;
  getDoctorPatients();
};

// 移除患者分配关系
const removePatientAssignment = async (patientId) => {
  const confirmed = await new Promise((resolve) => {
    const modal = Modal.confirm({
      title: '确认移除',
      content: '确定要移除这个患者的分配关系吗？',
      okText: '确定',
      cancelText: '取消',
      closable: true,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
      onClose: () => resolve(false),
    });
  });

  if (!confirmed) {
    return;
  }

  try {
    const orgId = localStorage.getItem('organization_id');
    if (!orgId || !currentDoctor.value) {
      message.error('参数错误');
      return;
    }

    const requestData = {
      organization_id: parseInt(orgId),
      doctor_id: currentDoctor.value.id,
      patient_id: patientId
    };

    const response = await axios.delete(`${API_BASE_URL}/doctor/remove-patient/`, { data: requestData });

    if (response.data.code === 200) {
      message.success('患者分配关系已移除');
      getDoctorPatients(); // 刷新患者列表
      getDoctorList(true); // 刷新医生列表
    } else {
      message.error(response.data.message || '移除患者分配关系失败');
    }
  } catch (error) {
    console.error('移除患者分配关系失败:', error);
    if (error.response && error.response.data) {
      message.error(error.response.data.message || '移除患者分配关系失败');
    } else {
      message.error('移除患者分配关系失败，请稍后重试');
    }
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

// 提取患者编号的数字部分
const extractGkidNumber = (gkid) => {
  if (!gkid) return '-';
  const match = gkid.match(/\d+/);
  return match ? match[0] : gkid;
};

// 判断患者是否已选择但不符合当前筛选条件
const isSelectedButNotInCurrentFilter = (record) => {
  if (!unassignedPatientSearch.value && !unassignedPatientGkidSearch.value) return false;
  
  const isSelected = selectedPatientIds.value.includes(record.id);
  
  // 检查是否符合姓名/手机号筛选条件
  const matchesNamePhoneFilter = !unassignedPatientSearch.value || 
    record.name.includes(unassignedPatientSearch.value) || 
    record.phone.includes(unassignedPatientSearch.value);
  
  // 检查是否符合编号筛选条件
  const matchesGkidFilter = !unassignedPatientGkidSearch.value || 
    (record.gkid && record.gkid.includes(unassignedPatientGkidSearch.value));
  
  // 必须同时满足两个筛选条件（如果都有的话）
  const matchesCurrentFilter = matchesNamePhoneFilter && matchesGkidFilter;
  
  return isSelected && !matchesCurrentFilter;
};

// 获取未分配患者表格行样式
const getUnassignedPatientRowClassName = (record) => {
  if (isSelectedButNotInCurrentFilter(record)) {
    return 'selected-but-not-in-filter';
  }
  return '';
};

</script>

<style scoped>
.main-wrapper {
  width: 100vw;
  height: 100vh;
  max-height: 100vh;
  background: url("@/assets/bg.jpg") no-repeat center center;
  background-size: cover;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-wrapper .ant-layout {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.logo img {
  width: 43px;
  height: 32px;
}

.title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-title {
  margin-left: 10px;
  font-weight: bold;
  font-size: 35px;
  color: #FEFCFF;
}

.user-info {
  display: flex;
  align-items: center;
  font-size: 20px;
  color: #FEFCFF;
}

.user-info-divider {
  width: 3px;
  height: 24px;
  background: #E27244;
  opacity: 0.48;
  margin: 0 40px;
}

.user-info-setttings {
  margin-right: 40px;
}

.user-info-permission {
  margin-right: 40px;
  cursor: pointer;
}

.user-info-change-password {
  margin-right: 40px;
  cursor: pointer;
}

.user-info-logout {
  margin-right: 72px;
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

/* 系统设置模态框样式 */
:deep(.ant-modal-body) {
  .ant-tabs-tab {
    font-size: 14px;
    font-weight: 500;
  }
  
  .ant-tabs-tab-active {
    color: #E27244;
  }
  
  .ant-tabs-ink-bar {
    background: #E27244;
  }
  
  .ant-radio-group {
    .ant-radio-wrapper {
      margin-bottom: 8px;
    }
  }
  
  .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
    border-color: #d9d9d9;
  }
  
  .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
    border-color: #E27244;
    color: #E27244;
  }
}

.member-list {
  .ant-table-tbody > tr > td {
    padding: 8px 12px;
    white-space: nowrap; /* 防止文本换行 */
    overflow: hidden;
    text-overflow: ellipsis; /* 超出部分显示省略号 */
  }
  
  .ant-table-thead > tr > th {
    background: #fafafa;
    font-weight: 600;
    color: #333;
    white-space: nowrap; /* 防止表头文本换行 */
  }
  
  .ant-table-tbody > tr:hover > td {
    background: #f5f5f5;
  }
  
  .ant-table-tbody > tr:nth-child(even) > td {
    background: #fafafa;
  }
  
  .ant-table-tbody > tr:nth-child(even):hover > td {
    background: #f0f0f0;
  }
  
  .ant-pagination {
    margin-top: 16px;
    text-align: right;
  }
  
  /* 权限列特殊处理，允许换行显示标签 */
  .ant-table-tbody > tr > td:nth-child(3) {
    white-space: normal;
    word-break: break-all;
  }
}

.ant-upload-select {
  width: 128px;
  height: 128px;
}

.img-icon {
  width: 18px;
  height: 18px;
}

/* 父级菜单图标：统一尺寸，与选中态颜色一致 */
.menu-parent-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
}

.main-sider {
  width: 220px !important;
  min-width: 220px !important;
  position: absolute;
  left: 0;
  top: 0;
}

:deep(.main-sider) {
  .ant-menu-submenu-selected .ant-menu-submenu-title {
    color: #E27244;
    background: #e4ebfa;
  }

  .ant-menu-submenu-title:hover:not(.ant-menu-item-selected):not(.ant-menu-submenu-selected) {
    color: #E27244;
    background: rgba(228, 235, 250, 0.6);
    box-shadow: 0 2px 8px rgba(226, 114, 68, 0.3);
    transform: translateY(-2px);
    transition: all 0.3s ease;
  }

  .ant-menu-item {
    height: 56px;
    line-height: 56px;
    border-radius: 50px;
    color: #FEFCFF;
  }

  .ant-menu-item:hover {
    color: #F4C955 !important;
  }

  .ant-menu-item-active, .ant-menu-submenu {
    color: #FEFCFF;
  }


  .ant-menu-item-selected {
    color: #E27244;
    background: #e4ebfa;
  }

  .ant-menu-submenu-selected .ant-menu-item-selected {
    color: #F4C955;
    background: transparent;
  }

  .ant-menu-item {
    margin-right: 0;
    width: 100%;
  }

  .ant-menu-submenu-selected .ant-menu-submenu-title:before,
  .ant-menu-submenu-selected .ant-menu-submenu-title:after {
    box-shadow: 0 0 0 28px #e4ebfa;
  }

  .ant-menu-submenu-title {
    height: 56px;
    line-height: 56px;
    border-radius: 50px 0 0 50px;
    margin-right: 0;
    width: 100%;
    position: relative;
    overflow: visible;
    margin: 0 0 0 10px;
    transition: all 0.3s ease;
  }

  .ant-menu-submenu-title:before, .ant-menu-submenu-title:after {
    position: absolute;
    right: 8px;
    content: '';
    width: 60px;
    height: 60px;
    border-radius: 100%;
    box-shadow: 0 0 0 30px transparent;
    transition-duration: 0.3s;
    z-index: 1;
  }

  .ant-menu-submenu-title:before {
    top: -59px;
    clip-path: inset(50% 0 0 50%);
  }

  .ant-menu-submenu-title:after {
    bottom: -59px;
    clip-path: inset(0 0 50% 50%);
  }
}

.main-content {
  background: #e4ebfa;
  padding: clamp(8px, 1.5vw, 16px);
  box-sizing: border-box;
  border-radius: clamp(24px, 3vw, 48px);
  margin-left: clamp(80px, 12vw, 220px);
  margin-right: clamp(8px, 1.5vw, 20px);
  margin-bottom: clamp(8px, 1vw, 12px);
  width: calc(100% - clamp(80px, 12vw, 220px) - clamp(8px, 1.5vw, 20px));
  max-width: 100%;
  overflow: hidden;
  /* 限制主内容区高度，减去 header 和 margin-bottom */
  height: calc(100vh - 96px - clamp(8px, 1vw, 12px));
  min-height: 0;
  display: flex;
  flex-direction: column;
}


/* 子页面嵌入区域：占满剩余空间，患者主页无外层滚动条，由各子页面内部处理滚动 */
.main-tab-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
}

.main-tab-body-inner {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* 患者主页等内容需占满高度，以便内部滚动区域正确约束 */
.main-tab-body-inner .tab-content-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* 滚动容器：支持鼠标滚轮滚动，所有页面共用 */
.main-tab-body-inner .tab-content-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  -webkit-overflow-scrolling: touch;
}

/* 子组件根：高度填满滚动容器，内容超出时由 tab-content-scroll 滚动 */
.main-tab-body-inner .tab-content-scroll > * {
  height: 100%;
  min-height: 0;
  min-width: 100%;
  position: relative;
  overflow: visible;
}

/* 患者列表：确保内部 .wrapper 可滚动 */
.main-tab-body-inner .tab-content-scroll :deep(.patient-list-spin-wrapper) {
  height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}

/* 强制患者主页不突破父级高度，否则内部滚动失效 */
.main-tab-body-inner .tab-content-wrapper :deep(.patient-constraint),
.main-tab-body-inner .tab-content-wrapper :deep(.patient-spin-wrapper),
.main-tab-body-inner .tab-content-wrapper :deep(.patient-page-root),
.main-tab-body-inner .tab-content-wrapper :deep(.style-two-root) {
  min-height: 0 !important;
  overflow: hidden !important;
  max-height: 100% !important;
}

.main-tab-body::-webkit-scrollbar {
  width: 8px;
}

.main-tab-body::-webkit-scrollbar-thumb {
  background: rgba(34, 75, 150, 0.3);
  border-radius: 4px;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: clamp(40px, 8vw, 80px);
    margin-right: clamp(4px, 1vw, 8px);
    width: calc(100% - clamp(40px, 8vw, 80px) - clamp(4px, 1vw, 8px));
    padding: clamp(4px, 1vw, 8px);
  }
}

.tabs-container {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  overflow: hidden;
  flex-shrink: 0;
}

.close-all-btn {
  flex-shrink: 0;
  padding: 4px 12px;
  height: 32px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: #ff8c42;
  border-radius: 6px;
  transition: all 0.3s ease;
  margin-right: calc(12em - 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-all-btn:hover {
  color: #fff;
  background: #ff6b1a;
}

:deep(.main-tabs) {
  flex: 1;
  min-width: 0;
  overflow: hidden;

  .ant-tabs-nav {
    height: 44px;
    border-radius: 10px;
    background: url("@/assets/tab-bg.png") no-repeat center center;
    background-size: cover;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .ant-tabs-nav-wrap {
    overflow-x: auto;
    overflow-y: hidden;
  }

  .ant-tabs-nav-list {
    overflow: visible !important;
    flex-wrap: nowrap !important;
    display: flex !important;
    min-width: max-content !important;
    width: max-content !important;
  }

  .ant-tabs-tab {
    background: transparent;
    border: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin: 0 4px !important;
    padding: 6px 20px;
    overflow: visible !important;
    max-width: none !important;
    min-width: fit-content !important;
    width: auto !important;
    flex-shrink: 0 !important;
    flex-grow: 0 !important;
    flex-basis: auto !important;
  }

  .ant-tabs-tab:hover {
    color: #E27244;
  }

  .ant-tabs-tab-active {
    background: #e4ebfa;
    margin: 0 !important;
    transform: none;
    overflow: visible !important;
    max-width: none !important;
  }

  /* 统一所有标签页的字体格式 */
  .ant-tabs-tab-btn {
    white-space: nowrap !important;
    overflow: visible !important;
    text-overflow: clip !important;
    max-width: none !important;
    min-width: auto !important;
    width: auto !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 14px !important;
    line-height: 1.5;
    display: inline-block !important;
    font-weight: 500;
    box-sizing: border-box;
  }

  /* 激活状态 - 仅改变颜色，保持字体大小一致 */
  .ant-tabs-tab-active .ant-tabs-tab-btn {
    font-size: 14px !important;
    color: #E27244;
    font-weight: 500;
    overflow: visible !important;
    text-overflow: clip !important;
  }

  /* 未激活状态 - 统一格式 */
  .ant-tabs-tab:not(.ant-tabs-tab-active) .ant-tabs-tab-btn {
    color: #666;
    font-size: 14px !important;
    font-weight: 500;
    overflow: visible !important;
    text-overflow: clip !important;
  }

  /* 平滑的标签页切换动画 */
  .ant-tabs-ink-bar {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.header-title-icon{
  width: 24px;
  height: 24px;
}

.close-icon{
  width: 12px;
  height: 12px;
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

/* 医生管理相关样式 */
.doctor-list {
  .ant-table-tbody > tr > td {
    padding: 8px 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .ant-table-thead > tr > th {
    background: #fafafa;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
  }
  
  .ant-table-tbody > tr:hover > td {
    background: #f5f5f5;
  }
  
  .ant-table-tbody > tr:nth-child(even) > td {
    background: #fafafa;
  }
  
  .ant-table-tbody > tr:nth-child(even):hover > td {
    background: #f0f0f0;
  }
}

/* 权限管理标签页样式 */
.permission-management {
  .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
    border-color: #d9d9d9;
    font-size: 14px;
    font-weight: 500;
  }
  
  .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
    border-color: #E27244;
    color: #E27244;
  }
  
  .ant-tabs-ink-bar {
    background: #E27244;
  }
}

/* 分配患者表格样式 */
.selected-but-not-in-filter {
  background-color: #f0f8ff !important;
  
  &:hover {
    background-color: #e6f7ff !important;
  }
  
  td {
    background-color: #f0f8ff !important;
  }
}

/* 网络状态指示器样式 */
.network-status {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.network-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.network-online .network-indicator {
  background-color: #52c41a;
  box-shadow: 0 0 4px rgba(82, 196, 26, 0.5);
}

.network-slow .network-indicator {
  background-color: #faad14;
  box-shadow: 0 0 4px rgba(250, 173, 20, 0.5);
}

.network-offline .network-indicator {
  background-color: #ff4d4f;
  box-shadow: 0 0 4px rgba(255, 77, 79, 0.5);
}

.network-online {
  color: #52c41a;
}

.network-slow {
  color: #faad14;
}

.network-offline {
  color: #ff4d4f;
}

/* 子标签页样式美化 */
.sub-tabs-container {
  margin-top: 8px;
  margin-bottom: 4px;
  padding: 0 4px;
  flex-shrink: 0;
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
