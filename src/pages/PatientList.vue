<template>
  <a-spin :spinning="isLoading" class="patient-list-spin-wrapper">
    <div class="wrapper">
      <div class="tabs-and-search-row">
        <a-tabs v-model:activeKey="activePatientSubTab" class="patient-list-sub-tabs" @change="onPatientSubTabChange">
          <a-tab-pane key="archived" tab="建档患者列表" />
          <a-tab-pane key="list" tab="患者列表" />
        </a-tabs>
        <div class="tab-row-right">
          <template v-if="activePatientSubTab === 'list'">
            <div class="search-box-group" v-if="!isArchiveMode">
              <a-input
                class="tab-row-search"
                v-model:value="listSearchInitial"
                placeholder="姓名首字母"
                allowClear
                spellcheck="false"
              />
            </div>
            <a-checkbox v-if="!isTempPatientMode" v-model:checked="showInactivePatients" class="show-inactive-checkbox tab-row-checkbox">显示停用了的患者</a-checkbox>
            <a-button class="action-btn primary-btn" type="primary" size="small" @click="handleAddTempPatient"><PlusOutlined /><span>新增患者</span></a-button>
            <a-button class="action-btn" type="default" size="small" @click="handleExcelImport"><UploadOutlined /><span>Excel导入</span></a-button>
            <a-button class="action-btn" type="default" size="small" @click="handleBatchPrint"><PrinterOutlined /><span>批量打印</span></a-button>
          </template>
          <template v-else>
            <div class="search-box-group">
              <a-input
                class="tab-row-search"
                v-model:value="archiveListSearchInitial"
                placeholder="姓名首字母"
                allowClear
                spellcheck="false"
                @pressEnter="handleArchivedListArchiveNoQuery"
              />
              <a-input
                class="tab-row-search tab-row-search-archive"
                v-model:value="archiveListSearchArchiveNo"
                placeholder="档案号"
                allowClear
                spellcheck="false"
                @pressEnter="handleArchivedListArchiveNoQuery"
              />
              <a-button type="primary" size="small" @click="handleArchivedListArchiveNoQuery">查询</a-button>
            </div>
          </template>
        </div>
      </div>
      <!-- 患者列表 -->
      <template v-if="activePatientSubTab === 'list'">
      <a-table
          :columns="isTempPatientMode ? tempPatientColumns : columns"
          :dataSource="isTempPatientMode ? filteredTempPatients : filteredPatients"
          rowKey="id"
          :rowClassName="getRowClassName"
          :locale="tableLocale"
          :sortDirections="['ascend', 'descend', 'ascend']"
          :multipleSort="true"
          :pagination="{
            position: ['bottomCenter'],
            current: currentPage,
            pageSize: pageSize,
            total: isTempPatientMode ? filteredTempPatients.length : filteredPatients.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showPrevNextJumpers: true,
            showLessItems: false,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: handlePageChange,
            onShowSizeChange: (current, size) => {
              pageSize = size;
              currentPage = 1;
            }
          }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column && column.key === 'patient_type'">
            <a-select
              v-model:value="record.patient_type"
              style="width: 100%"
              size="small"
              placeholder="请选择"
              allow-clear
              @change="(value) => handlePatientTypeChange(record, value === null ? '' : value)"
            >
              <a-select-option value=""></a-select-option>
              <a-select-option 
                v-for="type in patientTypeOptions" 
                :key="type" 
                :value="type"
              >
                {{ type }}
              </a-select-option>
            </a-select>
          </template>
          <template v-else-if="column && column.key === 'favorite'">
            <StarOutlined
              :style="{
                fontSize: '18px',
                color: record.is_favorite === true ? '#ffc107' : '#d9d9d9',
                cursor: 'pointer',
                transition: 'color 0.3s'
              }"
              @click="handleToggleFavorite(record)"
            />
          </template>
          <template v-else-if="column && column.key === 'edit_info'">
            <a-button 
              type="link" 
              size="small" 
              class="action-link-btn"
              @click="handleEdit(record)"
            >
              编辑
            </a-button>
            <!-- 患者列表显示建档按钮，建档患者显示启用/禁用按钮 -->
            <template v-if="isTempPatientMode">
              <a-tooltip :title="getArchiveIdFromRecord(record) ? '该患者已有档案编号' : '建档'">
                <a-button 
                  type="primary" 
                  size="small" 
                  class="archive-btn"
                  :class="{ 'archive-btn-disabled': getArchiveIdFromRecord(record) }"
                  :disabled="!!getArchiveIdFromRecord(record)"
                  @click="handlePromoteTempPatient(record)"
                >
                  建档
                </a-button>
              </a-tooltip>
            </template>
            <template v-else>
              <a-tooltip :title="record.status === 'active' ? '禁用' : '启用'">
                <img-icon class="action-icon" v-if="record.status === 'active'" title="禁用" @click="handleSwitch(record)"
                          style="margin-right: 8px"/>
                <switcher-outlined v-else
                                   @click="handleSwitch(record)"
                                   :style="{ marginRight: '8px', color: record.status === 'active' ? 'black' : 'green' }"
                />
              </a-tooltip>
            </template>
            <a-button 
              type="link" 
              size="small" 
              class="action-link-btn"
              @click="handleQRCode(record)"
            >
              二维码
            </a-button>
          </template>
          <template v-else-if="column && column.key === 'action'">
            <a-button 
              type="link" 
              size="small" 
              class="action-link-btn"
              @click="handleOpenSales(record)"
            >
              开单
            </a-button>
            <a-button 
              type="link" 
              size="small" 
              class="action-link-btn"
              @click="handleView(record)"
            >
              查看
            </a-button>
            <!-- 根据患者状态显示停用或恢复按钮 -->
            <a-button 
              v-if="record.status === 'active'"
              type="link" 
              size="small" 
              class="action-link-btn danger-link-btn"
              @click="handleDisablePatient(record)"
            >
              停用
            </a-button>
            <a-button 
              v-else
              type="link" 
              size="small" 
              class="action-link-btn"
              @click="handleEnablePatient(record)"
            >
              恢复
            </a-button>
          </template>
        </template>
      </a-table>
      </template>
      <!-- 建档患者列表 -->
      <template v-else>
      <a-table
          :columns="archivedListColumns"
          :dataSource="archivedListTableData"
          rowKey="id"
          :rowClassName="getRowClassName"
          :locale="tableLocale"
          :sortDirections="['ascend', 'descend', 'ascend']"
          :pagination="{
            position: ['bottomCenter'],
            current: archivedListCurrentPage,
            pageSize: archivedListPageSize,
            total: filteredArchivedListPatients.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showPrevNextJumpers: true,
            showLessItems: false,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: handleArchivedListPageChange,
            onShowSizeChange: handleArchivedListSizeChange
          }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column && column.key === 'patient_type'">
            <a-select
              v-model:value="record.patient_type"
              style="width: 100%"
              size="small"
              placeholder="请选择"
              allow-clear
              @change="(value) => handlePatientTypeChange(record, value === null ? '' : value)"
            >
              <a-select-option value=""></a-select-option>
              <a-select-option
                v-for="type in patientTypeOptions"
                :key="type"
                :value="type"
              >
                {{ type }}
              </a-select-option>
            </a-select>
          </template>
          <template v-else-if="column && column.key === 'archived_actions'">
            <a-button type="link" size="small" class="action-link-btn" @click="handleView(record)">查看</a-button>
            <a-button type="link" size="small" class="action-link-btn" @click="handleEdit(record)">编辑</a-button>
            <a-button
              v-if="record.status === 'active'"
              type="link"
              size="small"
              class="action-link-btn danger-link-btn"
              @click="handleDisablePatient(record)"
            >停用</a-button>
            <a-button
              v-else
              type="link"
              size="small"
              class="action-link-btn"
              @click="handleEnablePatient(record)"
            >恢复</a-button>
            <a-button type="link" size="small" class="action-link-btn" @click="handleQRCode(record)">二维码</a-button>
          </template>
        </template>
      </a-table>
      </template>

      <a-modal
          class="editModal"
          v-model:open="isModalVisible"
          @cancel="handleCancelPatientModal"
          :width="600"
          footer=" "
          :afterClose="handleAfterClose"
      >
        <template #title>
          <div
              style="display: flex; align-items: center;padding-bottom:16px;margin-bottom:16px;border-bottom: 1px solid rgba(0,0,0,0.1) ">
            <img-icon class="header-icon" title="增"/>
            {{ isEditMode ? '编辑患者' : (creatingPatientType === 'temp' ? '新增患者' : '新增建档患者') }}
          </div>
        </template>
        <div style="display: flex ; justify-content: center">
          <a-form>
            <div style="display: flex; gap: 36px;">
              <a-form-item>
                <template #label>
                  <span style="width: 80px;text-align-last: justify">姓名</span>
                </template>
                <a-input class="modal-input" v-model:value="patientForm.name" placeholder="请输入姓名"
                         style="width: 150px;"/>
              </a-form-item>
              <a-form-item>
                <template #label>
                  <span style="width: 80px;text-align-last: justify">性别</span>
                </template>
                <a-select class="modal-input" v-model:value="patientForm.gender" placeholder="请选择性别"
                          style="width: 150px;">
                  <template #suffixIcon>
                    <img-icon class="input-icon" title="展开" style="margin-right: 0"/>
                  </template>
                  <a-select-option value="male">男</a-select-option>
                  <a-select-option value="female">女</a-select-option>
                </a-select>
              </a-form-item>
            </div>
            <div style="display: flex; gap: 36px;">
              <a-form-item>
                <template #label>
                  <span style="width: 80px;text-align-last: justify">出生日期</span>
                </template>
                <a-date-picker class="modal-input" style="width: 150px" v-model:value="patientForm.birthDate"
                               :locale="locale">
                  <template #suffixIcon>
                    <img-icon class="input-icon" title="日历" style="margin-right: 0"/>
                  </template>
                </a-date-picker>
              </a-form-item>
              <a-form-item 
                :validateStatus="phoneValidateStatus" 
                :help="phoneValidateHelp">
                <template #label>
                  <span style="width: 80px;text-align-last: justify">联系电话</span>
                </template>
                <a-input 
                  class="modal-input" 
                  v-model:value="patientForm.phone" 
                  placeholder="请输入11位手机号码"
                  style="width: 150px;"
                  :maxlength="11"
                  @blur="validatePhone"
                  @input="handlePhoneInput"/>
              </a-form-item>
            </div>
            <div style="display: flex; gap: 36px;" v-if="isEditMode">
              <a-form-item>
                <template #label>
                  <span style="width: 80px;text-align-last: justify">档案编号</span>
                </template>
                <a-input class="modal-input" v-model:value="patientForm.archiveId" placeholder="请输入档案编号"
                         style="width: 150px;"/>
              </a-form-item>
            </div>
            <div style="display: flex; gap: 36px;" v-if="!isEditMode">
              <a-form-item>
                <template #label>
                  <span style="width: 80px;text-align-last: justify">首诊日期</span>
                </template>
                <a-date-picker 
                  class="modal-input" 
                  style="width: 150px" 
                  v-model:value="currentDateField"
                  :locale="locale">
                  <template #suffixIcon>
                    <img-icon class="input-icon" title="日历" style="margin-right: 0"/>
                  </template>
                </a-date-picker>
              </a-form-item>
            </div>
            <div style="display: flex;justify-content: center">
              <a-button 
                class="modal-btn" 
                type="primary" 
                :loading="isSubmitting"
                :disabled="isSubmitting"
                @click="submitPatient"
              >
                {{ submitButtonText }}
              </a-button>
            </div>
          </a-form>
        </div>
      </a-modal>

      <a-modal
          v-model:open="isQRCodeModalVisible"
          title="患者二维码"
          @cancel="handleCancelQRCodeModal"
          :width="400"
          footer=" "
          :afterClose="handleAfterClose"
      >
        <div style="text-align: center;">
          <img :src="qrCodeUrl" alt="患者二维码" style="max-width: 100%;"/>
        </div>
        <div style="text-align: right; margin-top: 16px;">
          <a-button @click="printQRCode">打印二维码</a-button>
          <a-button @click="handleCancelQRCodeModal" style="display: none;">关闭</a-button>
        </div>
      </a-modal>

      <!-- Excel导入进度条模态框 -->
      <a-modal
          v-model:open="isImportProgressVisible"
          title="Excel导入进度"
          :closable="false"
          :maskClosable="false"
          :keyboard="false"
          :width="500"
          :footer="null"
          class="import-progress-modal"
      >
        <div style="text-align: center; padding: 20px;">
          <div style="margin-bottom: 20px;">
            <h3>正在导入患者数据...</h3>
            <p style="color: #666; margin: 10px 0;">
              已导入 {{ excelUploadProgress }} / {{ excelUploadTotal }} 条记录
            </p>
          </div>
          
          <a-progress 
              :percent="importProgressPercent" 
              :status="importProgressStatus"
              :stroke-color="importProgressColor"
              :show-info="false"
              size="large"
          />
          
          <div style="margin-top: 20px; color: #666;">
            <p v-if="currentImportingPatient">
              正在导入: {{ currentImportingPatient.name }} ({{ currentImportingPatient.phone }})
            </p>
            <p v-if="importError">
              错误: {{ importError }}
            </p>
          </div>
          
          <div style="margin-top: 30px;" v-if="importProgressStatus === 'success' || importProgressStatus === 'exception'">
            <a-button type="primary" @click="closeImportProgress">
              {{ importProgressStatus === 'success' ? '完成' : '关闭' }}
            </a-button>
          </div>
        </div>
      </a-modal>

      <a-modal
          v-model:open="isBatchPrintModalVisible"
          @cancel="handleCancelBatchPrintModal"
          style="min-width: 400px"
          :width="400"
          :footer="null"
      >
        <template #title>
          <div
              style="display: flex; align-items: center;padding-bottom:16px;margin-bottom:16px;border-bottom: 1px solid rgba(0,0,0,0.1) ">
            <img-icon class="header-icon" title="打印"/>
            批量打印
          </div>
        </template>
        <div style="display: flex ; justify-content: center">
          <a-form>
            <div style="display: flex; gap: 36px;justify-content: center">
              <a-form-item label="打印起点">
                <a-input-number style="width: 150px" class="modal-input" v-model:value="printStart" :min="1"/>
              </a-form-item>
            </div>
            <div style="display: flex;justify-content: center">
              <a-form-item label="打印终点">
                <a-input-number style="width: 150px" class="modal-input" v-model:value="printEnd" :min="printStart"/>
              </a-form-item>
            </div>
            <div style="display: flex;justify-content: center">
              <a-form-item label="打印编号类型">
                <a-select 
                  style="width: 150px" 
                  class="modal-input" 
                  v-model:value="batchPrintIdType"
                  placeholder="请选择编号类型"
                >
                  <a-select-option value="patient">患者编号</a-select-option>
                  <a-select-option value="archive">档案编号</a-select-option>
                </a-select>
              </a-form-item>
            </div>
            <div style="display: flex;justify-content: center">
              <a-button type="primary" @click="handlePreview">确认</a-button>
            </div>
            <a-form-item label="预览">
              <div style="display: flex; flex-wrap: wrap; gap: 16px;">
                <div v-for="(url, index) in batchPrintPreviewUrls" :key="index"
                     style="border: 1px solid #ddd; padding: 8px;">
                  <img :src="url" style="width: 150px;"/>
                </div>
              </div>
            </a-form-item>
            <div style="display: flex;justify-content: center">
              <a-button class="modal-btn modal-btn-plain" type="primary" @click="handleCancelBatchPrintModal">Cancel</a-button>
              <a-button class="modal-btn" type="primary" @click="confirmBatchPrint">打印</a-button>
            </div>
          </a-form>
        </div>
      </a-modal>
    </div>
  </a-spin>
</template>

<script>
import {
  Spin,
  Table,
  Tabs,
  Tooltip,
  Input,
  Button,
  Modal,
  DatePicker,
  Select,
  Form,
  InputNumber,
  Progress,
  Checkbox
} from 'ant-design-vue';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  SwitcherOutlined,
  QrcodeOutlined,
  UploadOutlined,
  PrinterOutlined,
  SearchOutlined,
  DeleteOutlined,
  StarOutlined
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN';
import QRCode from 'qrcode';
import ImgIcon from "@/pages/components/ImgIcon.vue";
import {ref} from "vue";
import { getCache, updateCache } from '@/utils/cacheManager';
import { pinyin } from 'pinyin-pro';

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');

export default {
  name: 'PatientList',
  props: {
    isArchiveMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['open-new-tab', 'view-patient'],
  components: {
    'img-icon': ImgIcon,
    'a-spin': Spin,
    'a-tabs': Tabs,
    'a-tab-pane': Tabs.TabPane,
    'a-table': Table,
    'a-tooltip': Tooltip,
    'a-input': Input,
    'a-button': Button,
    'a-modal': Modal,
    'a-date-picker': DatePicker,
    'a-select': Select,
    'a-select-option': Select.Option,
    'a-form': Form,
    'a-form-item': Form.Item,
    PlusOutlined,
    UploadOutlined,
    PrinterOutlined,
    SearchOutlined,
    DeleteOutlined,
    StarOutlined,
    'eye-outlined': EyeOutlined,
    'edit-outlined': EditOutlined,
    'switcher-outlined': SwitcherOutlined,
    'qrcode-outlined': QrcodeOutlined,
    'a-input-number': InputNumber,
    'a-progress': Progress,
    'a-checkbox': Checkbox
  },

  data() {
    return {
      currentPage: 1,
      pageSize: 10,
      total: 0,
      isLoading: false,
      isFirstLoad: false,
      patients: [],
      // 患者列表相关数据
      isTempPatientMode: false,
      tempPatients: [],
      tempPatientTotal: 0,
      isCleared: false, // 标记是否已清除数据，防止自动重新加载
      showInactivePatients: false, // 是否显示停用了的患者，默认不勾选
      searchText: '', // 统一搜索文本（姓名/拼音/联系电话/患者编号/档案编号）
      listSearchInitial: '', // 患者列表-姓名首字母检索
      listSearchArchiveNo: '', // 患者列表-档案号输入
      listSearchArchiveNoApplied: '', // 患者列表-档案号点击查询后的精准确认值
      searchDate: null,
      isModalVisible: false,
      isEditMode: false,
      patientForm: {
        name: '',
        phone: '',
        gender: '',
        birthDate: null,
        firstExamDate: null,
        examinationDate: null,
        status: 'active',
        archiveId: ''
      },
      currentPatientId: null,
      editingPatientRecord: null, // 保存正在编辑的患者原始记录
      phoneValidateStatus: '', // 手机号验证状态：'success' | 'error' | ''
      phoneValidateHelp: '', // 手机号验证提示信息
      locale: locale,
      tableLocale: {
        triggerAsc: '点击升序',
        triggerDesc: '点击降序',
        cancelSort: '点击取消排序'
      },
      excelUploadProgress: 0,
      excelUploadTotal: 0,
      // 导入进度条相关数据
      isImportProgressVisible: false,
      currentImportingPatient: null,
      importError: '',
      importProgressStatus: 'active', // 'active', 'success', 'exception'
      importProgressColor: '#1890ff',
      isQRCodeModalVisible: false,
      qrCodeUrl: '',
      isBatchPrintModalVisible: false,
      printStart: 1,
      printEnd: 1,
      batchPrintPreviewUrls: [],
      batchPrintIdType: 'patient', // 'patient' 患者编号 或 'archive' 档案编号
      // 提交状态控制
      isSubmitting: false,
      submitButtonText: '提交',
      lastSubmitTime: 0, // 上次提交时间，用于防抖
      patientTypesRefreshKey: 0, // 用于强制刷新患者类型选项的键值
      creatingPatientType: 'temp', // 'temp' 临时患者，'archived' 建档患者
      // 患者列表子标签：'list' 患者列表，'archived' 建档患者列表（建档患者列表在前，默认选中）
      activePatientSubTab: 'archived',
      archiveListSearchInitial: '', // 建档患者列表-姓名首字母检索
      archiveListSearchArchiveNo: '', // 建档患者列表-档案号输入
      archiveListSearchArchiveNoApplied: '', // 建档患者列表-档案号点击查询后的精准确认值
      archivedListCurrentPage: 1,
      archivedListPageSize: 10
    };
  },
  computed: {
    // 获取患者类型选项（从系统设置中动态加载）
    // 使用 patientTypesRefreshKey 来确保在系统设置更新时能够刷新
    patientTypeOptions() {
      // 访问 patientTypesRefreshKey 以确保响应式更新
      const _ = this.patientTypesRefreshKey;
      try {
        const savedSettings = localStorage.getItem('systemSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.patientTypes && Array.isArray(settings.patientTypes) && settings.patientTypes.length > 0) {
            return settings.patientTypes;
          }
        }
      } catch (error) {
        console.error('加载患者类型选项失败:', error);
      }
      // 默认值（如果系统设置中没有配置）
      return ['近视建档', '塑形镜', '点扩散', '视觉训练'];
    },
    
    // 生成公共的基础列配置
    baseColumns() {
      // 从 identifiers 数组中提取数字最长的作为患者编号
      const extractPatientId = (identifiers) => {
        if (!identifiers || !Array.isArray(identifiers) || identifiers.length === 0) {
          return null;
        }
        // 找出数字部分最长的那个
        let maxLength = 0;
        let patientId = null;
        identifiers.forEach(id => {
          const match = id ? id.match(/\d+/) : null;
          if (match && match[0].length > maxLength) {
            maxLength = match[0].length;
            patientId = match[0];
          }
        });
        return patientId;
      };
      
      // 从 identifiers 数组中提取数字最短的作为档案编号（需要有两个条目）
      const extractArchiveId = (identifiers) => {
        if (!identifiers || !Array.isArray(identifiers) || identifiers.length < 2) {
          return null; // 只有一个条目说明没有档案编号
        }
        // 找出数字部分最短的那个（除了患者编号之外的那个）
        let minLength = Infinity;
        let archiveId = null;
        identifiers.forEach(id => {
          const match = id ? id.match(/\d+/) : null;
          if (match) {
            const numLength = match[0].length;
            if (numLength < minLength) {
              minLength = numLength;
              archiveId = match[0];
            }
          }
        });
        return archiveId;
      };
      
      // 获取患者编号的渲染函数
      const getPatientIdRender = () => ({record}) => {
        const patientId = extractPatientId(record.identifiers);
        return patientId || '-';
      };
      
      // 获取患者编号的排序函数：按编号的数值顺序（升序=小号在前，降序=大号在前）
      const getPatientIdSorter = () => (a, b) => {
        const patientIdA = extractPatientId(a.identifiers);
        const patientIdB = extractPatientId(b.identifiers);
        const numA = patientIdA ? parseInt(patientIdA, 10) : 0;
        const numB = patientIdB ? parseInt(patientIdB, 10) : 0;
        if (numA !== numB) return numA - numB;
        return (patientIdA || '').localeCompare(patientIdB || '');
      };
      
      // 获取档案编号的渲染函数
      const getArchiveIdRender = () => ({record}) => {
        const archiveId = extractArchiveId(record.identifiers);
        return archiveId || '-';
      };
      
      // 获取档案编号的排序函数
      const getArchiveIdSorter = () => (a, b) => {
        const archiveIdA = extractArchiveId(a.identifiers);
        const archiveIdB = extractArchiveId(b.identifiers);
        const numA = archiveIdA ? parseInt(archiveIdA) : 0;
        const numB = archiveIdB ? parseInt(archiveIdB) : 0;
        return numA - numB;
      };
      
      return {
        patientId: {
          title: '患者编号',
          key: 'gkid',
          width: 120,
          customRender: getPatientIdRender()
        },
        archiveId: {
          title: '档案编号',
          key: 'archive_id',
          width: 120,
          customRender: getArchiveIdRender()
        },
        id: {title: 'ID', dataIndex: 'id', key: 'id', className: 'hidden-column'},
        name: {title: '姓名', dataIndex: 'name', key: 'name', width: 120},
        phone: {title: '联系电话', dataIndex: 'phone', key: 'phone', width: 140},
        birthDate: {
          title: '出生日期',
          dataIndex: 'birthDate',
          key: 'birthDate',
          className: 'hidden-column'
        },
        age: {
          title: '年龄',
          key: 'age',
          width: 100,
          customRender: ({record}) => {
            return this.formatAgeDisplay(record.birthDate);
          }
        },
        gender: {title: '性别', dataIndex: 'gender', key: 'gender', width: 80},
        latestexamdate: {
          title: '最近检查日期',
          dataIndex: 'latestexamdate',
          key: 'latestexamdate',
          width: 140,
          customRender: ({text}) => {
            return text ? text : '暂无';
          }
        },
        reviewInterval: {
          title: '复查间隔时间',
          key: 'review_interval',
          width: 140,
          customRender: ({record}) => {
            return this.formatReviewInterval(record.review_interval_days || record.latest_record?.review_interval_days);
          }
        },
        editInfo: {
          title: '患者信息编辑',
          key: 'edit_info',
          dataIndex: 'edit_info',
          width: 220,
          fixed: 'right'
        },
        action: {
          title: '操作',
          key: 'action',
          dataIndex: 'action',
          width: 140
        }
      };
    },
    
    // 建档患者列配置
    columns() {
      const base = this.baseColumns;
      return [
        base.patientId,
        base.id,
        base.name,
        base.phone,
        base.birthDate,
        base.age,
        base.gender,
        base.latestexamdate,
        base.reviewInterval,
        {
          title: '总检查次数',
          dataIndex: 'total_exam_count',
          key: 'total_exam_count',
          width: 120,
          customRender: ({ record }) => record.total_exam_count ?? '-'
        },
        {
          title: '患者类型',
          key: 'patient_type',
          dataIndex: 'patient_type',
          width: 150,
          filters: this.patientTypeOptions.map(type => ({ text: type, value: type })),
          onFilter: (value, record) => {
            return record.patient_type === value;
          },
        },
        {
          title: '收藏',
          key: 'favorite',
          dataIndex: 'is_favorite',
          width: 80,
          align: 'center',
          filters: [
            { text: '已收藏', value: true },
            { text: '未收藏', value: false },
          ],
          onFilter: (value, record) => {
            // 处理 true/false/null 三种情况
            if (value === true) {
              // 筛选"已收藏"：只显示 is_favorite === true
              return record.is_favorite === true;
            } else {
              // 筛选"未收藏"：显示 is_favorite === false 或 is_favorite === null
              return record.is_favorite === false || record.is_favorite === null;
            }
          },
        },
        {
          title: '平均复查间隔',
          dataIndex: 'average_review_interval',
          key: 'average_review_interval',
          width: 140,
          sorter: (a, b) => a.average_review_interval - b.average_review_interval,
          sortDirections: ['descend', 'ascend'],
          multiple: 7
        },
        base.action,
        base.editInfo
      ];
    },
    
    // 临时患者列配置
    tempPatientColumns() {
      const base = this.baseColumns;
      return [
        base.patientId,
        base.id,
        base.name,
        base.phone,
        base.birthDate,
        base.age,
        base.gender,
        base.latestexamdate,
        base.reviewInterval,
        {
          title: '总检查次数',
          dataIndex: 'total_exam_count',
          key: 'total_exam_count',
          width: 120,
          customRender: ({ record }) => record.total_exam_count ?? '-'
        },
        {
          title: '患者类型',
          key: 'patient_type',
          dataIndex: 'patient_type',
          width: 150,
          filters: this.patientTypeOptions.map(type => ({ text: type, value: type })),
          onFilter: (value, record) => {
            return record.patient_type === value;
          },
        },
        {
          title: '收藏',
          key: 'favorite',
          dataIndex: 'is_favorite',
          width: 80,
          align: 'center',
          filters: [
            { text: '已收藏', value: true },
            { text: '未收藏', value: false },
          ],
          onFilter: (value, record) => {
            // 处理 true/false/null 三种情况
            if (value === true) {
              // 筛选"已收藏"：只显示 is_favorite === true
              return record.is_favorite === true;
            } else {
              // 筛选"未收藏"：显示 is_favorite === false 或 is_favorite === null
              return record.is_favorite === false || record.is_favorite === null;
            }
          },
        },
        base.action,
        base.editInfo
      ];
    },
    
    filteredPatients() {
      let list = this.patients.filter(item => !this.getArchiveIdFromRecord(item)); // 患者列表只显示未建档的患者
      list = list.filter(item => this.matchListSearch(item));
      if (!this.showInactivePatients) list = list.filter(item => item.status !== 'inactive');
      // 按最近检查日期由近到远排列（无检查日期的排最后）
      return [...list].sort((a, b) => {
        const timeA = a.latestexamdate ? new Date(a.latestexamdate).getTime() : 0;
        const timeB = b.latestexamdate ? new Date(b.latestexamdate).getTime() : 0;
        return timeB - timeA;
      });
    },
    
    // 临时患者筛选逻辑：只显示未建档的患者，检索、按最近检查日期由近到远排列
    filteredTempPatients() {
      let list = this.tempPatients.filter(item => !this.getArchiveIdFromRecord(item)); // 患者列表只显示未建档的患者
      list = list.filter(item => this.matchListSearch(item));
      return [...list].sort((a, b) => {
        const timeA = a.latestexamdate ? new Date(a.latestexamdate).getTime() : 0;
        const timeB = b.latestexamdate ? new Date(b.latestexamdate).getTime() : 0;
        return timeB - timeA;
      });
    },

    // 建档患者列表：仅包含有档案编号的患者
    archivedListPatients() {
      return this.patients.filter(record => this.getArchiveIdFromRecord(record));
    },
    // 建档患者列表：按姓名首字母、档案号（点击查询后精准确认）检索后的列表
    filteredArchivedListPatients() {
      let list = this.archivedListPatients;
      const initial = (this.archiveListSearchInitial || '').trim().toLowerCase();
      const archiveNo = (this.archiveListSearchArchiveNoApplied || '').trim();
      if (initial) {
        list = list.filter(record => {
          const name = (record.name || '').trim();
          if (!name) return false;
          try {
            const pinyinInitials = pinyin(name, { toneType: 'none', pattern: 'first' }).replace(/\s+/g, '').toLowerCase();
            return pinyinInitials.indexOf(initial) !== -1;
          } catch (e) {
            return name.indexOf(initial) !== -1;
          }
        });
      }
      if (archiveNo) {
        list = list.filter(record => {
          const id = this.getArchiveIdFromRecord(record) || '';
          return id === archiveNo;
        });
      }
      // 按最近检查日期由近到远排列（无检查日期的排最后）
      return [...list].sort((a, b) => {
        const timeA = a.latestexamdate ? new Date(a.latestexamdate).getTime() : 0;
        const timeB = b.latestexamdate ? new Date(b.latestexamdate).getTime() : 0;
        return timeB - timeA;
      });
    },
    // 建档患者列表：当前页数据（前端分页）
    archivedListTableData() {
      const list = this.filteredArchivedListPatients;
      const start = (this.archivedListCurrentPage - 1) * this.archivedListPageSize;
      return list.slice(start, start + this.archivedListPageSize);
    },
    // 建档患者列表列配置：档案编号、患者编号、姓名、联系电话、性别、年龄、最近检查日期、患者类型、操作
    archivedListColumns() {
      const base = this.baseColumns;
      return [
        { ...base.archiveId, title: '档案编号' },
        base.patientId,
        base.name,
        base.phone,
        {
          title: '性别',
          key: 'gender',
          dataIndex: 'gender',
          width: 80,
          customRender: ({ record }) => record.gender === 'male' ? '男' : record.gender === 'female' ? '女' : (record.gender || '-')
        },
        base.age,
        base.latestexamdate,
        {
          title: '患者类型',
          key: 'patient_type',
          dataIndex: 'patient_type',
          width: 150
        },
        {
          title: '操作',
          key: 'archived_actions',
          width: 260,
          fixed: 'right'
        }
      ];
    },

    // 计算导入进度百分比
    importProgressPercent() {
      if (this.excelUploadTotal === 0) return 0;
      return Math.round((this.excelUploadProgress / this.excelUploadTotal) * 100);
    },
    
    // 当前日期字段（根据模式动态选择）
    currentDateField: {
      get() {
        return this.isTempPatientMode ? this.patientForm.examinationDate : this.patientForm.firstExamDate;
      },
      set(value) {
        if (this.isTempPatientMode) {
          this.patientForm.examinationDate = value;
        } else {
          this.patientForm.firstExamDate = value;
        }
      }
    },
    
    // 检查是否有活动的筛选条件
    hasActiveFilters() {
      if (this.activePatientSubTab === 'list') {
        return !!(this.listSearchInitial && this.listSearchInitial.trim()) || !!(this.listSearchArchiveNoApplied && this.listSearchArchiveNoApplied.trim());
      }
      return !!this.searchText;
    },
    hasArchivedListActiveFilters() {
      return !!(this.archiveListSearchInitial && this.archiveListSearchInitial.trim()) || !!(this.archiveListSearchArchiveNoApplied && this.archiveListSearchArchiveNoApplied.trim());
    }
  },
  mounted() {
    this.initializePatientList();
    
    // 监听患者建档事件，自动刷新列表
    const handlePatientArchived = async (event) => {
      console.log('收到患者建档事件:', event.detail);
      if (this.isArchiveMode) {
        // 如果是建档列表，刷新建档患者列表
        console.log('刷新建档患者列表...');
        await this.fetchPatientsFromBackend(false);
      } else {
        // 如果是患者列表，刷新临时患者列表
        console.log('刷新患者列表（临时患者）...');
        await this.fetchTempPatientsFromBackend(false);
      }
    };
    
    window.addEventListener('patient-archived', handlePatientArchived);
    
    // 保存事件处理函数引用，以便在组件销毁时移除
    this._patientArchivedHandler = handlePatientArchived;
    
    // 监听显示设置变化事件
    window.addEventListener('display-settings-changed', this.handleDisplaySettingsChanged);
    
    // 监听患者类型设置变化事件
    const handlePatientTypesChanged = () => {
      console.log('患者类型设置已更新，刷新患者类型选项');
      // 通过更新 refreshKey 来触发 computed 属性重新计算
      this.patientTypesRefreshKey += 1;
      // 同时强制更新组件以确保下拉框选项刷新
      this.$forceUpdate();
    };
    window.addEventListener('patient-types-changed', handlePatientTypesChanged);
    this._patientTypesChangedHandler = handlePatientTypesChanged;
    
    // 监听标签页激活事件，当标签页被激活时刷新数据
    const handleTabActivated = async (event) => {
      if (event.detail && event.detail.pageKey === 'patient-list') {
        console.log('患者列表标签页被激活，刷新数据...');
        // 延迟一下，确保组件已完全激活
        setTimeout(async () => {
          if (this.isTempPatientMode) {
            await this.fetchTempPatientsFromBackend(false);
          } else {
            await this.fetchPatientsFromBackend(false);
          }
        }, 100);
      }
    };
    
    window.addEventListener('tab-activated', handleTabActivated);
    this._tabActivatedHandler = handleTabActivated;
    
    // 立即检查是否有未处理的患者类型更新事件（从localStorage中读取）
    // 这样可以处理在页面加载前触发的事件
    this.checkPendingPatientTypeUpdates();
    
    // 监听患者类型更新事件，从其他页面（如复查列表）同步更新
    const handlePatientTypeUpdated = (event) => {
      console.log('收到患者类型更新事件:', event.detail);
      const { patient_id, patient_type } = event.detail || {};
      if (patient_id == null || patient_id === '') {
        console.warn('患者类型更新事件数据不完整:', event.detail);
        return;
      }
      // patient_type 允许为空字符串（清空类型）
      
      // 使用辅助方法更新，仅更新 patient_type，不修改 status
      const updated = this.updatePatientTypeInList(patient_id, patient_type ?? '');
      
      if (!updated) {
        // 如果当前列表中没有找到患者，可能是因为数据还没有加载
        // 将更新保存到localStorage，等待数据加载后处理
        console.log(`未找到匹配的患者ID: ${patient_id}，保存待处理更新`);
        try {
          let pendingUpdates = [];
          const existingUpdates = localStorage.getItem('pendingPatientTypeUpdates');
          if (existingUpdates) {
            pendingUpdates = JSON.parse(existingUpdates);
          }
          
          // 检查是否已经存在该患者的待处理更新
          const existingIndex = pendingUpdates.findIndex(u => u.patient_id == patient_id);
          if (existingIndex >= 0) {
            pendingUpdates[existingIndex].patient_type = patient_type;
          } else {
            pendingUpdates.push({ patient_id, patient_type });
          }
          
          localStorage.setItem('pendingPatientTypeUpdates', JSON.stringify(pendingUpdates));
          console.log('已保存待处理的患者类型更新到localStorage');
        } catch (error) {
          console.warn('保存待处理更新失败:', error);
        }
      }
    };
    
    window.addEventListener('patient-type-updated', handlePatientTypeUpdated);
    this._patientTypeUpdatedHandler = handlePatientTypeUpdated;
  },
  beforeDestroy() {
    // 组件销毁时移除事件监听器
    if (this._patientArchivedHandler) {
      window.removeEventListener('patient-archived', this._patientArchivedHandler);
    }
    if (this._tabActivatedHandler) {
      window.removeEventListener('tab-activated', this._tabActivatedHandler);
    }
    if (this._patientTypeUpdatedHandler) {
      window.removeEventListener('patient-type-updated', this._patientTypeUpdatedHandler);
    }
    window.removeEventListener('display-settings-changed', this.handleDisplaySettingsChanged);
    if (this._patientTypesChangedHandler) {
      window.removeEventListener('patient-types-changed', this._patientTypesChangedHandler);
    }
  },
  methods: {
    // 后端返回 401 时：弹窗提示登录过期，用户确认后跳转登录页重新登录
    handleSessionExpired() {
      Modal.warning({
        title: '登录过期',
        content: '登录已过期，请重新登录。',
        okText: '去登录',
        onOk: () => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.reload();
        }
      });
    },
    // 根据患者 ID 在列表中仅更新 patient_type，不修改 status 等其它字段
    updatePatientTypeInList(patientId, patientType) {
      const id = patientId == null ? undefined : Number(patientId);
      if (id === undefined || isNaN(id)) return false;
      const index = this.patients.findIndex(p => (p.id != null && Number(p.id) === id) || (p.patient_id != null && Number(p.patient_id) === id));
      if (index === -1) return false;
      this.patients[index].patient_type = patientType;
      this.$forceUpdate();
      return true;
    },
    // 检查并应用 localStorage 中待处理的患者类型更新（页面加载时调用）
    checkPendingPatientTypeUpdates() {
      try {
        const existingUpdates = localStorage.getItem('pendingPatientTypeUpdates');
        if (!existingUpdates) return;
        const pendingUpdates = JSON.parse(existingUpdates);
        if (!Array.isArray(pendingUpdates) || pendingUpdates.length === 0) return;
        let appliedCount = 0;
        pendingUpdates.forEach(({ patient_id, patient_type }) => {
          const updated = this.updatePatientTypeInList(patient_id, patient_type ?? '');
          if (updated) appliedCount++;
        });
        if (appliedCount > 0) {
          localStorage.removeItem('pendingPatientTypeUpdates');
          console.log(`已应用 ${appliedCount} 条待处理的患者类型更新`);
        }
      } catch (error) {
        console.warn('检查待处理患者类型更新失败:', error);
      }
    },
    // 从 identifiers 数组中提取患者编号（数字部分最长的）
    extractPatientIdFromIdentifiers(identifiers) {
      if (!identifiers || !Array.isArray(identifiers) || identifiers.length === 0) {
        return null;
      }
      let maxLength = 0;
      let patientId = null;
      identifiers.forEach(id => {
        const match = id ? id.match(/\d+/) : null;
        if (match && match[0].length > maxLength) {
          maxLength = match[0].length;
          patientId = match[0];
        }
      });
      return patientId;
    },
    
    // 从 identifiers 数组中提取档案编号（数字部分最短的，需要有两个或更多条目）
    extractArchiveIdFromIdentifiers(identifiers) {
      if (!identifiers || !Array.isArray(identifiers) || identifiers.length < 2) {
        return null; // 只有一个条目说明没有档案编号
      }
      let minLength = Infinity;
      let archiveId = null;
      identifiers.forEach(id => {
        const match = id ? id.match(/\d+/) : null;
        if (match) {
          const numLength = match[0].length;
          if (numLength < minLength) {
            minLength = numLength;
            archiveId = match[0];
          }
        }
      });
      return archiveId;
    },
    
    // 获取显示设置
    getDisplaySettings() {
      try {
        const savedDisplaySettings = localStorage.getItem('displaySettings');
        if (savedDisplaySettings) {
          const settings = JSON.parse(savedDisplaySettings);
          console.log('获取显示设置:', settings);
          return settings;
        }
      } catch (error) {
        console.error('获取显示设置失败:', error);
      }
      // 默认设置
      const defaultSettings = { birthDateDisplayFormat: 'age_decimal' };
      console.log('使用默认显示设置:', defaultSettings);
      return defaultSettings;
    },
    
    // 格式化年龄显示
    formatAgeDisplay(birthDate) {
      if (!birthDate) {
        return '';
      }
      
      const displaySettings = this.getDisplaySettings();
      const format = displaySettings.birthDateDisplayFormat || 'age_decimal';
      
      console.log('格式化年龄显示:', { birthDate, format, displaySettings });
      
      switch (format) {
        case 'date':
          // 显示出生日期
          return new Date(birthDate).toLocaleDateString('zh-CN');
        case 'age_int':
          // 显示年龄（整数）
          const ageInt = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
          return ageInt + '岁';
        case 'age_decimal':
        default:
          // 显示年龄（一位小数）
          const age = ((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)).toFixed(1);
          return age + '岁';
      }
    },
    
    // 格式化复查间隔时间（与治疗计划一致：1/2/3 表示月，0 表示自定义预约）
    formatReviewInterval(reviewIntervalDays) {
      if (reviewIntervalDays === null || reviewIntervalDays === undefined) {
        return '-';
      }
      if (reviewIntervalDays === 0) return '自定义预约';
      if (reviewIntervalDays === 1) return '一个月';
      if (reviewIntervalDays === 2) return '两个月';
      if (reviewIntervalDays === 3) return '三个月';
      // 其他数值（如后端返回实际天数）按天显示
      return `${reviewIntervalDays}天`;
    },
    
    // 获取患者类型
    getPatientType(record, isTempPatientMode) {
      // 如果记录在临时患者列表中，返回"临时患者"，否则返回"建档患者"
      if (isTempPatientMode !== undefined) {
        return isTempPatientMode ? '临时患者' : '建档患者';
      }
      // 如果无法判断，尝试从记录中获取
      if (record.is_temp !== undefined) {
        return record.is_temp ? '临时患者' : '建档患者';
      }
      return '-';
    },
    
    // 检查姓名是否匹配（支持中文和拼音首字母）
    matchName(name, searchText) {
      if (!name || !searchText) {
        return false;
      }
      
      const search = searchText.toLowerCase().trim();
      const patientName = name.trim();
      
      // 1. 直接中文匹配（包含关系）
      if (patientName.indexOf(search) !== -1) {
        return true;
      }
      
      // 2. 拼音首字母匹配
      try {
        // 获取姓名的拼音首字母（移除所有空格）
        const pinyinInitials = pinyin(patientName, {
          toneType: 'none',
          pattern: 'first'
        })
          .replace(/\s+/g, '')  // 移除所有空格，确保连续的首字母
          .toLowerCase();
        
        console.log('拼音首字母匹配调试:', {
          patientName,
          search,
          pinyinInitials,
          match: pinyinInitials.indexOf(search) !== -1
        });
        
        // 检查拼音首字母是否包含搜索文本（支持部分匹配和完整匹配）
        if (pinyinInitials.indexOf(search) !== -1) {
          return true;
        }
        
        // 3. 完整拼音匹配（可选，如果需要）
        const pinyinFull = pinyin(patientName, {
          toneType: 'none',
          pattern: 'pinyin'
        }).replace(/\s+/g, '').toLowerCase();
        
        if (pinyinFull.indexOf(search) !== -1) {
          return true;
        }
      } catch (error) {
        console.warn('拼音转换失败:', error);
        // 如果拼音转换失败，仅使用中文匹配
      }
      
      return false;
    },
    
    // 患者列表检索匹配（姓名首字母；档案号使用点击查询后的精准确认值）
    matchListSearch(record) {
      const initial = (this.listSearchInitial || '').trim().toLowerCase();
      const archiveNo = (this.listSearchArchiveNoApplied || '').trim();
      if (initial) {
        const name = (record.name || '').trim();
        if (!name) return false;
        try {
          const pinyinInitials = pinyin(name, { toneType: 'none', pattern: 'first' }).replace(/\s+/g, '').toLowerCase();
          if (pinyinInitials.indexOf(initial) === -1) return false;
        } catch (e) {
          if (name.indexOf(initial) === -1) return false;
        }
      }
      if (archiveNo) {
        const pid = this.extractPatientIdFromIdentifiers(record.identifiers) || '';
        const aid = this.getArchiveIdFromRecord(record) || '';
        if (pid !== archiveNo && aid !== archiveNo) return false;
      }
      return true;
    },

    // 统一的患者筛选匹配逻辑
    matchPatientFilter(item, isTempPatient = false) {
      // 统一搜索文本匹配（姓名/拼音首字母/患者编号/档案编号）
      let matchSearchText = true;
      if (this.searchText && this.searchText.trim()) {
        const search = this.searchText.trim();
        let matched = false;
        
        // 1. 匹配姓名（支持拼音首字母）- 模糊搜索
        if (item.name && this.matchName(item.name, search)) {
          matched = true;
        }
        
        // 2. 匹配患者编号（从 identifiers 中提取数字最长的）- 精准搜索
        if (!matched && item.identifiers) {
          const patientId = this.extractPatientIdFromIdentifiers(item.identifiers);
          if (patientId && patientId === search) {
            matched = true;
          }
        }
        
        // 3. 匹配档案编号（从 identifiers 中提取数字最短的，需要有两个条目）- 精准搜索
        if (!matched && item.identifiers && item.identifiers.length >= 2) {
          const archiveId = this.extractArchiveIdFromIdentifiers(item.identifiers);
          if (archiveId && archiveId === search) {
            matched = true;
          }
        }
        
        matchSearchText = matched;
      }
      
      return matchSearchText;
    },
    
    // 处理显示设置变化
    handleDisplaySettingsChanged(event) {
      console.log('显示设置已更改:', event.detail);
      // 强制重新渲染表格
      this.$forceUpdate();
    },
    
    // 切换到普通患者列表
    switchToNormalPatients() {
      this.isTempPatientMode = false;
      this.clearSearchFilters();
      // 如果数据已被清除，确保列表为空
      if (this.isCleared) {
        this.patients = [];
        // filteredPatients 是计算属性，会自动根据 patients 更新
        this.total = 0;
      }
    },
    
    // 切换到患者列表
    async switchToTempPatients() {
      this.isTempPatientMode = true;
      this.clearSearchFilters();
      // 如果数据已被清除，不重新加载
      if (!this.isCleared) {
        await this.fetchTempPatientsFromBackend();
      }
    },
    
    // 清空搜索筛选条件
    clearSearchFilters() {
      this.searchText = '';
      this.listSearchInitial = '';
      this.listSearchArchiveNo = '';
      this.listSearchArchiveNoApplied = '';
    },
    // 患者列表-档案号点击查询（精准确认）
    handleListArchiveNoQuery() {
      this.listSearchArchiveNoApplied = (this.listSearchArchiveNo || '').trim();
    },
    // 建档患者列表-档案号点击查询（精准确认）
    handleArchivedListArchiveNoQuery() {
      this.archiveListSearchArchiveNoApplied = (this.archiveListSearchArchiveNo || '').trim();
    },
    // 清空建档患者列表筛选
    clearArchivedListFilters() {
      this.archiveListSearchInitial = '';
      this.archiveListSearchArchiveNo = '';
      this.archiveListSearchArchiveNoApplied = '';
    },
    
    // 清理患者数据缓存
    clearPatientCache() {
      try {
        // 清理localStorage
        localStorage.removeItem('patientlist');
        
        // 清理IndexedDB
        const organizationId = localStorage.getItem('organization_id');
        if (organizationId) {
          const patientKey = `patientlist_${organizationId}`;
          // 这里可以添加IndexedDB清理逻辑
          console.log('清理IndexedDB缓存:', patientKey);
        }
        
        console.log('患者数据缓存已清理');
        return true;
      } catch (error) {
        console.error('清理缓存失败:', error);
        return false;
      }
    },
    
    // 从缓存加载患者数据
    async loadPatientsFromCache() {
      try {
        const organizationId = localStorage.getItem('organization_id');
        if (!organizationId) {
          console.log('未找到organization_id，无法加载缓存');
          return false;
        }

        console.log('正在从缓存加载患者数据...');
        const result = await getCache('patientlist', organizationId);
        
        if (result.data && Array.isArray(result.data)) {
          this.patients = result.data;
          // filteredPatients 是计算属性，会自动根据 patients 更新
          this.total = result.data.length;
          console.log(`患者数据从缓存加载成功，共${result.data.length}条记录，数据来源: ${result.source}`);
          return true;
        } else {
          console.log('缓存中未找到患者数据');
          return false;
        }
      } catch (error) {
        console.error('从缓存加载患者数据失败:', error);
        return false;
      }
    },

    // 更新缓存中的患者数据
    async updatePatientsCache() {
      try {
        const organizationId = localStorage.getItem('organization_id');
        if (!organizationId) {
          console.log('未找到organization_id，无法更新缓存');
          return false;
        }

        console.log('正在更新患者数据缓存...');
        
        // 清理患者数据，移除不可序列化的属性
        const cleanPatients = this.cleanPatientData(this.patients);
        
        const success = await updateCache('patientlist', cleanPatients, organizationId);
        
        if (success) {
          console.log('患者数据缓存更新成功');
          return true;
        } else {
          console.error('患者数据缓存更新失败');
          return false;
        }
      } catch (error) {
        console.error('更新患者数据缓存失败:', error);
        return false;
      }
    },

    // 清理患者数据，移除不可序列化的属性
    cleanPatientData(patients) {
      if (!Array.isArray(patients)) return patients;
      
      return patients.map(patient => {
        const cleanPatient = {};
        
        // 只保留必要的患者属性
        const allowedKeys = [
          'id', 'gkid', 'name', 'phone', 'gender', 'birthDate', 
          'createDate', 'status', 'latestexamdate', 'total_exam_count', 
          'average_review_interval', 'organizationid'
        ];
        
        for (const key of allowedKeys) {
          if (patient.hasOwnProperty(key)) {
            const value = patient[key];
            
            // 处理日期字段
            if (key === 'birthDate' || key === 'createDate' || key === 'latestexamdate') {
              if (value) {
                // 如果是Date对象，转换为ISO字符串
                if (value instanceof Date) {
                  cleanPatient[key] = value.toISOString();
                } else if (typeof value === 'string') {
                  // 如果是字符串，保持原样
                  cleanPatient[key] = value;
                } else {
                  // 其他类型，尝试转换
                  cleanPatient[key] = String(value);
                }
              } else {
                cleanPatient[key] = null;
              }
            } else {
              // 非日期字段直接复制
              cleanPatient[key] = value;
            }
          }
        }
        
        return cleanPatient;
      });
    },

    // 处理分页变化
    handlePageChange(page) {
      this.currentPage = page;
      // 这里可以添加分页逻辑，如果需要的话
      console.log('切换到第', page, '页');
    },
    async onPatientSubTabChange(key) {
      if (key !== 'archived' || this.isCleared) return;
      if (this.patients.length > 0) return; // 已有数据（例如从患者列表同源填充），无需请求
      // 建档患者列表无数据时：优先从缓存展示，再后台静默刷新
      const cached = localStorage.getItem('patientlist');
      if (cached) {
        try {
          const arr = JSON.parse(cached);
          if (Array.isArray(arr) && arr.length > 0) {
            this.patients = arr;
            this.total = arr.length;
          }
        } catch (e) {
          console.warn('解析患者列表缓存失败:', e);
        }
      }
      if (this.patients.length === 0) await this.loadPatientsFromCache();
      // 无论是否命中缓存都后台静默刷新，保证数据最新
      this.fetchPatientsFromBackend(false);
    },
    handleArchivedListPageChange(page, pageSize) {
      this.archivedListCurrentPage = page;
      if (pageSize) this.archivedListPageSize = pageSize;
    },
    handleArchivedListSizeChange(current, size) {
      this.archivedListPageSize = size;
      this.archivedListCurrentPage = 1;
    },

    // 关闭导入进度条
    closeImportProgress() {
      this.isImportProgressVisible = false;
      this.currentImportingPatient = null;
      this.importError = '';
      this.importProgressStatus = 'active';
      this.importProgressColor = '#1890ff';
    },
    
    // 开始导入进度条
    startImportProgress(total) {
      this.isImportProgressVisible = true;
      this.excelUploadProgress = 0;
      this.excelUploadTotal = total;
      this.currentImportingPatient = null;
      this.importError = '';
      this.importProgressStatus = 'active';
      this.importProgressColor = '#1890ff';
    },
    
    // 更新导入进度
    updateImportProgress(current, patient = null) {
      this.excelUploadProgress = current;
      this.currentImportingPatient = patient;
    },
    
    // 设置导入错误
    setImportError(error) {
      this.importError = error;
      this.importProgressStatus = 'exception';
      this.importProgressColor = '#ff4d4f';
    },
    
    // 设置导入成功
    setImportSuccess() {
      this.importProgressStatus = 'success';
      this.importProgressColor = '#52c41a';
    },
    
    // 添加日期格式转换函数
    formatDate(dateStr) {
      console.log('formatDate input:', dateStr, 'type:', typeof dateStr);

      if (!dateStr) return null;

      try {
        // 处理Excel日期序列号（数字）
        if (typeof dateStr === 'number') {
          console.log('处理数字日期:', dateStr);
          // Excel的日期序列号是从1900年1月1日开始的天数
          // 需要转换为JavaScript的日期（从1970年1月1日开始的毫秒数）
          const excelDate = new Date((dateStr - 25569) * 86400 * 1000);
          console.log('转换后的日期:', excelDate);
          return dayjs(excelDate).format('YYYY-MM-DD');
        }

        // 如果是Date对象，直接使用dayjs处理
        if (dateStr instanceof Date) {
          console.log('处理Date对象:', dateStr);
          return dayjs(dateStr).format('YYYY-MM-DD');
        }

        // 如果是字符串，则进行格式转换
        if (typeof dateStr === 'string') {
          console.log('处理字符串日期:', dateStr);
          // 统一将各种分隔符替换为斜杠
          const normalizedDate = dateStr.replace(/[.-]/g, '/');
          // 尝试解析日期
          const parsedDate = dayjs(normalizedDate, ['YYYY/MM/DD', 'YYYY/M/D', 'YYYY/M/DD', 'YYYY/MM/D']);
          // 如果解析成功，返回标准格式
          return parsedDate.isValid() ? parsedDate.format('YYYY-MM-DD') : null;
        }

        console.log('无法处理的日期类型:', dateStr);
        return null;
      } catch (error) {
        console.error('日期格式化错误:', error, '输入值:', dateStr);
        return null;
      }
    },

    // 添加手机号处理函数
    formatPhone(phone) {
      console.log('formatPhone input:', phone, 'type:', typeof phone);
      
      if (!phone) {
        console.log('手机号为空，返回空字符串');
        return '';
      }

      // 转换为字符串，兼容数字型和文本型
      let phoneStr = String(phone);
      console.log('转换为字符串后:', phoneStr);

      // 移除所有非数字字符
      phoneStr = phoneStr.replace(/\D/g, '');
      console.log('移除非数字字符后:', phoneStr);

      return phoneStr;
    },

    // 调试函数：检查患者数据缓存状态
    debugPatientCacheStatus() {
      const cachedPatients = localStorage.getItem('patientlist');
      if (cachedPatients) {
        try {
          const patients = JSON.parse(cachedPatients);
          console.log('=== 患者数据缓存状态调试 ===');
          console.log('localStorage患者数据总数:', patients.length);
          console.log('当前显示患者数据总数:', this.patients.length);
          console.log('患者数据示例:', patients.slice(0, 2));
          
          // 检查数据序列化问题
          console.log('=== 数据序列化检查 ===');
          try {
            const testData = this.cleanPatientData(this.patients);
            console.log('清理后的数据示例:', testData.slice(0, 2));
            console.log('清理后的数据可以序列化:', JSON.stringify(testData.slice(0, 2)));
            console.log('原始数据序列化测试:', JSON.stringify(this.patients.slice(0, 2)));
          } catch (serializeError) {
            console.error('数据序列化失败:', serializeError);
            console.log('问题数据示例:', this.patients.slice(0, 2));
          }
          
          // 检查IndexedDB状态
          const organizationId = localStorage.getItem('organization_id');
          if (organizationId) {
            const patientKey = `patientlist_${organizationId}`;
            console.log('IndexedDB key:', patientKey);
            console.log('存储方式标记:', localStorage.getItem('patientlist_storage'));
          }
          
          return {
            cachedCount: patients.length,
            displayedCount: this.patients.length,
            hasData: patients.length > 0
          };
        } catch (error) {
          console.error('解析患者缓存数据失败:', error);
          return null;
        }
      } else {
        console.log('没有找到患者缓存数据');
        return null;
      }
    },

    // 初始化患者列表
    async initializePatientList() {
      // 根据props设置模式
      if (this.isArchiveMode) {
        // 建档列表模式：只显示建档患者
        this.isTempPatientMode = false;
      } else {
        // 患者列表模式：默认显示患者列表（临时患者）
        this.isTempPatientMode = true;
      }
      
      // 如果数据已被清除，不初始化（但允许手动刷新）
      if (this.isCleared) {
        console.log('数据已被清除，跳过自动初始化');
        // 不清空数据，允许手动刷新后显示
        // this.patients = [];
        // this.filteredPatients = [];
        // this.total = 0;
        // return;
      }
      
      // 根据模式加载数据
      if (this.isArchiveMode) {
        // 建档列表模式：加载建档患者
        console.log('初始化建档患者列表');
        this.isFirstLoad = true;
        
        // 优先从缓存加载数据
        const cachedData = localStorage.getItem('patientlist');
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              console.log('✅ 从缓存加载建档患者列表数据成功，共', parsedData.length, '条记录');
              this.patients = parsedData;
              this.total = parsedData.length;
              this.isLoading = false;
              
              // 后台请求最新数据来更新缓存（静默更新）
              this.fetchPatientsFromBackend(false);
              return;
            }
          } catch (error) {
            console.error('解析缓存数据失败:', error);
          }
        }
        
        // 如果没有缓存数据，显示加载动画并从后端获取
        console.log('无缓存数据，显示加载动画');
        this.isLoading = true;
        await this.fetchPatientsFromBackend(true);
      } else {
        // 患者列表模式：加载临时患者
        console.log('初始化患者列表（临时患者）');
        this.isFirstLoad = true;
        
        // 优先从缓存加载数据
        const cachedData = localStorage.getItem('patientlist');
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              console.log('✅ 从缓存加载临时患者列表数据成功，共', parsedData.length, '条记录');
              // 临时患者需要过滤出临时患者
              const tempPatients = parsedData.filter(p => !p.is_archived);
              this.tempPatients = tempPatients;
              this.tempPatientTotal = tempPatients.length;
              // 同时填充建档患者列表数据，切换子标签时无需再请求
              this.patients = parsedData;
              this.total = parsedData.length;
              this.isLoading = false;
              
              // 后台请求最新数据来更新缓存（静默更新）
              this.fetchTempPatientsFromBackend(false);
              return;
            }
          } catch (error) {
            console.error('解析缓存数据失败:', error);
          }
        }
        
        // 如果没有缓存数据，显示加载动画并从后端获取
        console.log('无缓存数据，显示加载动画');
        this.isLoading = true;
        await this.fetchTempPatientsFromBackend(true);
      }
    },

    // 从后端获取患者列表
    async fetchTempPatientsFromBackend(showLoading = true) {
      // 如果数据已被清除，允许强制刷新（通过 showLoading=false 调用时）
      if (this.isCleared && showLoading) {
        console.log('数据已被清除，跳过自动重新加载患者列表');
        // 不清空数据，允许手动刷新
        // this.tempPatients = [];
        // this.tempPatientTotal = 0;
        // this.filteredTempPatients = [];
        // return;
      }
      
      const organization_id = localStorage.getItem('organization_id');
      const accessToken = localStorage.getItem('access_token');
      
      // 判断是否为开发环境，使用代理路径避免CORS问题
      const isDevelopment = import.meta.env.DEV;
      const url = isDevelopment 
        ? `/patient/opatientList_originationids/?organization_ids=${organization_id}`
        : `https://aiforoptometry.com/patient/opatientList_originationids/?organization_ids=${organization_id}`;

      if (showLoading) {
        this.isLoading = true;
      }

      try {
        console.log('请求患者列表:', url);
        console.log('使用JWT认证，token:', accessToken ? accessToken.substring(0, 50) + '...' : 'null');
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          credentials: 'include'
        });
        
        console.log('患者列表响应状态:', response.status, response.url);
        
        // 检查是否被重定向
        if (response.redirected) {
          console.log('患者列表请求被重定向到:', response.url);
        }
        
        // 401：登录过期，弹窗提示后跳转登录页
        if (response.status === 401) {
          if (showLoading) this.isLoading = false;
          this.handleSessionExpired();
          return;
        }
        
        // 检查响应状态
        if (!response.ok) {
          console.error('患者列表请求失败:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('错误响应内容:', errorText.substring(0, 200));
          throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('后端返回的患者列表数据:', data);
        console.log('患者列表数据数量:', data ? data.length : 0);
        
        // 检查是否有肖勇和肖星禾禾
        const xiaoyong = data ? data.find(p => p.name && p.name.includes('肖勇')) : null;
        const xiaojiaochen = data ? data.find(p => p.name && p.name.includes('肖星禾禾')) : null;
        
        if (xiaoyong) {
          const patientId = xiaoyong.identifiers && xiaoyong.identifiers.length > 1 
            ? xiaoyong.identifiers[1].match(/\d+/)?.[0] : '-';
          const archiveId = xiaoyong.gkid ? xiaoyong.gkid.match(/\d+/)?.[0] : '-';
          console.log('找到肖勇:', xiaoyong);
          console.log('肖勇的患者编号:', patientId, '期望: 2512241');
          console.log('肖勇的档案编号:', archiveId, '期望: 1');
        } else {
          console.log('未找到肖勇');
        }
        
        if (xiaojiaochen) {
          const patientId = xiaojiaochen.identifiers && xiaojiaochen.identifiers.length > 1 
            ? xiaojiaochen.identifiers[1].match(/\d+/)?.[0] : '-';
          const archiveId = xiaojiaochen.gkid ? xiaojiaochen.gkid.match(/\d+/)?.[0] : '-';
          console.log('找到肖星禾禾:', xiaojiaochen);
          console.log('肖星禾禾的患者编号:', patientId, '期望: 2512242');
          console.log('肖星禾禾的档案编号:', archiveId, '期望: 2');
        } else {
          console.log('未找到肖星禾禾');
        }
        
        if (!xiaoyong && !xiaojiaochen && data) {
          const allInfo = data.map(p => {
            const patientId = p.identifiers && p.identifiers.length > 1 
              ? p.identifiers[1].match(/\d+/)?.[0] : '-';
            const archiveId = p.gkid ? p.gkid.match(/\d+/)?.[0] : '-';
            return `${p.name}(患者:${patientId},档案:${archiveId})`;
          }).join(', ');
          console.log('所有患者姓名和编号:', allInfo || '无数据');
        }

        // 数据验证和过滤：确保只包含当前机构的患者
        const currentOrgId = localStorage.getItem('organization_id');
        const filteredData = data.filter(patient => {
          // 检查患者是否属于当前机构
          const patientOrgId = patient.organizationid || patient.organization_id;
          const isValidOrg = patientOrgId == currentOrgId;
          
          if (!isValidOrg) {
            console.warn('发现其他机构的患者数据，已过滤:', {
              patientName: patient.name,
              patientGkid: patient.gkid,
              patientOrgId: patientOrgId,
              currentOrgId: currentOrgId
            });
          }
          
          return isValidOrg;
        });

        console.log(`数据过滤结果: 原始${data.length}条 -> 过滤后${filteredData.length}条`);

        // 更新本地存储和页面数据
        localStorage.setItem('patientlist', JSON.stringify(filteredData));
        
        // 更新患者列表数据（同一份全量数据同时供患者列表与建档患者列表使用，避免切换时重复请求）
        this.tempPatients = filteredData || [];
        this.tempPatientTotal = filteredData ? filteredData.length : 0;
        this.patients = filteredData || [];
        this.total = filteredData ? filteredData.length : 0;
        // filteredTempPatients 是 computed 属性，会自动根据 tempPatients 重新计算，不需要手动赋值
        console.log('更新后的tempPatients数量:', this.tempPatients.length);
        console.log('更新后的filteredTempPatients数量:', this.filteredTempPatients.length);
        
        // 同步更新到IndexedDB
        const organizationId = localStorage.getItem('organization_id');
        if (organizationId) {
          const patientKey = `patientlist_${organizationId}`;
          console.log('同步更新患者数据到IndexedDB，key:', patientKey);
          
          // 异步更新IndexedDB，不阻塞UI
          this.updatePatientsCache()
            .then(success => {
              if (success) {
                console.log('患者数据IndexedDB同步更新成功');
                // 更新存储方式标记
                localStorage.setItem('patientlist_storage', 'indexedDB');
                localStorage.setItem('patientlist_indexedDB_key', patientKey);
              } else {
                console.warn('患者数据IndexedDB同步更新失败');
              }
            })
            .catch(error => {
              console.error('患者数据IndexedDB同步更新出错:', error);
            });
        }
        
      } catch (error) {
        console.error('JWT认证获取患者列表失败:', error);
        
        // 尝试备用方案：使用session认证
        console.log('尝试备用方案：使用session认证...');
        try {
          const csrftoken = localStorage.getItem('csrftoken');
          // 判断是否为开发环境，使用代理路径避免CORS问题
          const isDevelopment = import.meta.env.DEV;
          const fallbackUrl = isDevelopment 
            ? `/patient/opatientList_originationids/?organization_ids=${organization_id}`
            : `https://aiforoptometry.com/patient/opatientList_originationids/?organization_ids=${organization_id}`;
          const fallbackResponse = await fetch(fallbackUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken
            },
            credentials: 'include'
          });
          
          if (fallbackResponse.status === 401) {
            if (showLoading) this.isLoading = false;
            this.handleSessionExpired();
            return;
          }
          
          if (fallbackResponse.ok && !fallbackResponse.redirected) {
            const data = await fallbackResponse.json();
            console.log('备用方案成功获取患者列表数据');
            console.log('备用方案患者列表数据数量:', data ? data.length : 0);
            
            // 检查是否有肖勇和肖星禾禾
            const xiaoyong = data ? data.find(p => p.name && p.name.includes('肖勇')) : null;
            const xiaojiaochen = data ? data.find(p => p.name && p.name.includes('肖星禾禾')) : null;
            
            if (xiaoyong) {
              const patientId = xiaoyong.identifiers && xiaoyong.identifiers.length > 1 
                ? xiaoyong.identifiers[1].match(/\d+/)?.[0] : '-';
              const archiveId = xiaoyong.gkid ? xiaoyong.gkid.match(/\d+/)?.[0] : '-';
              console.log('备用方案找到肖勇:', xiaoyong);
              console.log('备用方案肖勇的患者编号:', patientId, '期望: 2512241');
              console.log('备用方案肖勇的档案编号:', archiveId, '期望: 1');
            } else {
              console.log('备用方案未找到肖勇');
            }
            
            if (xiaojiaochen) {
              const patientId = xiaojiaochen.identifiers && xiaojiaochen.identifiers.length > 1 
                ? xiaojiaochen.identifiers[1].match(/\d+/)?.[0] : '-';
              const archiveId = xiaojiaochen.gkid ? xiaojiaochen.gkid.match(/\d+/)?.[0] : '-';
              console.log('备用方案找到肖星禾禾:', xiaojiaochen);
              console.log('备用方案肖星禾禾的患者编号:', patientId, '期望: 2512242');
              console.log('备用方案肖星禾禾的档案编号:', archiveId, '期望: 2');
            } else {
              console.log('备用方案未找到肖星禾禾');
            }
            
            if (!xiaoyong && !xiaojiaochen && data) {
              const allInfo = data.map(p => {
                const patientId = p.identifiers && p.identifiers.length > 1 
                  ? p.identifiers[1].match(/\d+/)?.[0] : '-';
                const archiveId = p.gkid ? p.gkid.match(/\d+/)?.[0] : '-';
                return `${p.name}(患者:${patientId},档案:${archiveId})`;
              }).join(', ');
              console.log('备用方案所有患者姓名和编号:', allInfo || '无数据');
            }
            
            // 数据验证和过滤：确保只包含当前机构的患者
            const currentOrgId = localStorage.getItem('organization_id');
            const filteredData = data.filter(patient => {
              const patientOrgId = patient.organizationid || patient.organization_id;
              return patientOrgId == currentOrgId;
            });
            
            // 更新本地存储和页面数据
            localStorage.setItem('patientlist', JSON.stringify(filteredData));
            
            this.tempPatients = filteredData || [];
            this.tempPatientTotal = filteredData ? filteredData.length : 0;
            this.patients = filteredData || [];
            this.total = filteredData ? filteredData.length : 0;
            // filteredTempPatients 是 computed 属性，会自动根据 tempPatients 重新计算，不需要手动赋值
            console.log('备用方案更新后的tempPatients数量:', this.tempPatients.length);
            console.log('备用方案更新后的filteredTempPatients数量:', this.filteredTempPatients.length);
            
            // 同步更新到IndexedDB
            const organizationId = localStorage.getItem('organization_id');
            if (organizationId) {
              const patientKey = `patientlist_${organizationId}`;
              console.log('备用方案同步更新患者数据到IndexedDB，key:', patientKey);
              
              // 异步更新IndexedDB，不阻塞UI
              this.updatePatientsCache()
                .then(success => {
                  if (success) {
                    console.log('备用方案患者数据IndexedDB同步更新成功');
                    // 更新存储方式标记
                    localStorage.setItem('patientlist_storage', 'indexedDB');
                    localStorage.setItem('patientlist_indexedDB_key', patientKey);
                  } else {
                    console.warn('备用方案患者数据IndexedDB同步更新失败');
                  }
                })
                .catch(error => {
                  console.error('备用方案患者数据IndexedDB同步更新出错:', error);
                });
            }
          } else {
            console.error('备用方案也失败了');
            throw new Error('备用方案失败');
          }
        } catch (fallbackError) {
          console.error('备用方案请求异常:', fallbackError);
          // 显示错误提示
          Modal.error({
            title: '网络连接失败',
            content: `无法连接到服务器获取患者列表数据。\n错误信息：${fallbackError.message || '未知错误'}\n请检查网络连接或稍后重试。`,
            onOk: () => {
              // 用户点击确定后，尝试重新加载
              this.fetchTempPatientsFromBackend();
            }
          });
        }
      } finally {
        if (showLoading) {
          this.isLoading = false;
        }
      }
    },

    // 从后端获取建档患者列表
    async fetchPatientsFromBackend(showLoading = true) {
      // 如果数据已被清除，允许强制刷新（通过 showLoading=false 调用时）
      if (this.isCleared && showLoading) {
        console.log('数据已被清除，跳过自动重新加载建档患者');
        // 不清空数据，允许手动刷新
        // this.patients = [];
        // this.total = 0;
        // this.filteredPatients = [];
        // return;
      }
      
      const organization_id = localStorage.getItem('organization_id');
      const accessToken = localStorage.getItem('access_token');
      
      // 判断是否为开发环境，使用代理路径避免CORS问题
      const isDevelopment = import.meta.env.DEV;
      const url = isDevelopment 
        ? `/patient/opatientList_originationids/?organization_ids=${organization_id}`
        : `https://aiforoptometry.com/patient/opatientList_originationids/?organization_ids=${organization_id}`;

      if (showLoading) {
        this.isLoading = true;
      }

      try {
        console.log('请求患者列表:', url);
        console.log('当前组织ID:', organization_id);
        console.log('使用JWT认证，token:', accessToken ? accessToken.substring(0, 50) + '...' : 'null');
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          credentials: 'include'
        });
        
        console.log('患者列表响应状态:', response.status, response.url);
        
        // 检查是否被重定向
        if (response.redirected) {
          console.log('患者列表请求被重定向到:', response.url);
        }
        
        // 401：登录过期，弹窗提示后跳转登录页
        if (response.status === 401) {
          if (showLoading) this.isLoading = false;
          this.handleSessionExpired();
          return;
        }
        
        // 检查响应状态
        if (!response.ok) {
          console.error('患者列表请求失败:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('错误响应内容:', errorText.substring(0, 200));
          throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('后端返回的数据:', data);

        // 数据验证和过滤：确保只包含当前机构的患者
        const currentOrgId = localStorage.getItem('organization_id');
        const filteredData = data.filter(patient => {
          // 检查患者是否属于当前机构
          const patientOrgId = patient.organizationid || patient.organization_id;
          const isValidOrg = patientOrgId == currentOrgId;
          
          if (!isValidOrg) {
            console.warn('发现其他机构的患者数据，已过滤:', {
              patientName: patient.name,
              patientGkid: patient.gkid,
              patientOrgId: patientOrgId,
              currentOrgId: currentOrgId
            });
          }
          
          return isValidOrg;
        });

        console.log(`数据过滤结果: 原始${data.length}条 -> 过滤后${filteredData.length}条`);

        // 更新本地存储和页面数据
        localStorage.setItem('patientlist', JSON.stringify(filteredData));
        this.patients = filteredData;
        // filteredPatients 是计算属性，会自动根据 patients 更新，不需要手动赋值
        this.total = filteredData.length; // 更新总数
        
        // 同步更新到IndexedDB
        const organizationId = localStorage.getItem('organization_id');
        if (organizationId) {
          const patientKey = `patientlist_${organizationId}`;
          console.log('同步更新患者数据到IndexedDB，key:', patientKey);
          
          // 异步更新IndexedDB，不阻塞UI
          this.updatePatientsCache()
            .then(success => {
              if (success) {
                console.log('患者数据IndexedDB同步更新成功');
                // 更新存储方式标记
                localStorage.setItem('patientlist_storage', 'indexedDB');
                localStorage.setItem('patientlist_indexedDB_key', patientKey);
              } else {
                console.warn('患者数据IndexedDB同步更新失败');
              }
            })
            .catch(error => {
              console.error('患者数据IndexedDB同步更新出错:', error);
            });
        }
      } catch (error) {
        console.error('JWT认证获取患者列表失败:', error);
        
        // 尝试备用方案：使用session认证
        console.log('尝试备用方案：使用session认证...');
        try {
          const csrftoken = localStorage.getItem('csrftoken');
          const fallbackResponse = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken
            },
            credentials: 'include'
          });
          
          if (fallbackResponse.status === 401) {
            if (showLoading) this.isLoading = false;
            this.handleSessionExpired();
            return;
          }
          
          if (fallbackResponse.ok && !fallbackResponse.redirected) {
            const data = await fallbackResponse.json();
            console.log('备用方案成功获取患者数据');
            
            // 数据验证和过滤：确保只包含当前机构的患者
            const currentOrgId = localStorage.getItem('organization_id');
            const filteredData = data.filter(patient => {
              const patientOrgId = patient.organizationid || patient.organization_id;
              return patientOrgId == currentOrgId;
            });
            
            localStorage.setItem('patientlist', JSON.stringify(filteredData));
            this.patients = filteredData;
            // filteredPatients 是计算属性，会自动根据 patients 更新，不需要手动赋值
            this.total = filteredData.length; // 更新总数
          } else {
            console.error('备用方案也失败了');
            throw new Error('备用方案失败');
          }
        } catch (fallbackError) {
          console.error('备用方案请求异常:', fallbackError);
          // 如果是首次加载失败，显示错误提示
          if (this.isFirstLoad) {
            Modal.error({
              title: '网络连接失败',
              content: '无法连接到服务器，请检查网络连接或稍后重试。如果问题持续存在，请联系管理员。',
              onOk: () => {
                // 用户点击确定后，尝试重新加载
                this.initializePatientList();
              }
            });
          } else {
            // 静默失败，不显示错误提示
            console.log('后台更新失败，继续使用缓存数据');
          }
        }
      } finally {
        if (showLoading) {
          this.isLoading = false;
        }
      }
    },
    getRowClassName(record) {
      return record.status === 'inactive' ? 'inactive-row' : '';
    },
    handleAdd(record) {
      console.log('新增', record);
      // 传递记录数据给父组件
      this.$emit("open-new-tab", record);
    },
    handleView(record) {
      console.log('查看', record);
      console.log('record.identifiers:', record.identifiers);
      const formattedRecord = {
        patient_id: record.id,
        // 直接从 record 传递 identifiers 和 gkid
        identifiers: record.identifiers,
        gkid: record.gkid,
        name: record.name,
        gender: record.gender,
        birthDate: record.birthDate,
        phone: record.phone,
        patient: {
          gkid: record.gkid,
          name: record.name,
          gender: record.gender,
          birthDate: record.birthDate,
          phone: record.phone,
          identifiers: record.identifiers
        }
      };
      console.log('formattedRecord:', formattedRecord);
      this.$emit("view-patient", formattedRecord);
    },
    handleOpenSales(record) {
      console.log('开单', record);
      const payload = {
        key: 'sales',
        title: `销售开单-${record.name}`,
        salesRecord: record
      };
      this.$emit("open-new-tab", payload);
    },
    // 获取档案编号（从 identifiers 数组中提取）
    // 如果 identifiers 长度为 2 或更多，说明已建档，返回数字最短的那个（档案编号）
    // 如果 identifiers 长度为 1，说明未建档，返回空字符串
    getArchiveIdFromRecord(record) {
      const archiveId = this.extractArchiveIdFromIdentifiers(record.identifiers);
      return archiveId || '';
    },
    
    handleEdit(record) {
      console.log('=== 编辑患者 ===');
      console.log('患者数据:', record);
      
      this.isEditMode = true;
      this.currentPatientId = record.id;
      // 保存原始记录，用于提交时获取 createDate 等字段
      this.editingPatientRecord = record;
      
      // 获取档案编号
      const archiveId = this.getArchiveIdFromRecord(record);
      
      this.patientForm = {
        name: record.name || '',
        phone: record.phone || '',
        gender: record.gender || '',
        birthDate: record.birthDate ? dayjs(record.birthDate) : null,
        firstExamDate: record.createDate ? dayjs(record.createDate) : null,
        examinationDate: record.latestexamdate ? dayjs(record.latestexamdate) : null,
        status: record.status || 'active',
        archiveId: archiveId
      };
      
      console.log('表单数据:', this.patientForm);
      
      // 重置提交状态
      this.isSubmitting = false;
      this.submitButtonText = '提交';
      // 重置手机号验证状态
      this.phoneValidateStatus = '';
      this.phoneValidateHelp = '';
      // 如果编辑时手机号存在，进行验证
      if (this.patientForm.phone) {
        this.$nextTick(() => {
          this.validatePhone();
        });
      }
      this.isModalVisible = true;
    },
    // 建建档患者
    // 处理患者类型变化
    async handlePatientTypeChange(record, value) {
      console.log('患者类型变化:', { record, value });
      // 保存原始值，以便失败时恢复
      const originalValue = record.patient_type;
      
      try {
        const organizationId = localStorage.getItem('organization_id');
        const accessToken = localStorage.getItem('access_token');
        
        // 获取患者ID
        const patientId = record.id || record.patient_id;
        
        if (!patientId) {
          this.$message.error('患者ID不存在，无法更新');
          return;
        }
        
        // 先更新本地数据，提供即时反馈
        record.patient_type = value; // value 已经是空字符串（如果选择了空白选项）
        this.$forceUpdate();
        
        // 构造请求数据，参考PatientCheck.vue的实现
        const patientName = record.name || '';
        const patientPhone = record.phone || '';
        let patientGender = record.gender || '';
        // 性别转换: 将 'male' 转为 '男'，'female' 转为 '女'
        if (patientGender === 'male') {
          patientGender = '男';
        } else if (patientGender === 'female') {
          patientGender = '女';
        }
        
        // 获取birthDate
        const birthDateRaw = record.birthDate || record.birth_date || null;
        let birthDate = null;
        if (birthDateRaw) {
          const dateObj = dayjs(birthDateRaw);
          if (dateObj.isValid()) {
            birthDate = dateObj.format('YYYY-MM-DD');
          }
        }
        
        // 获取createDate
        let createDate = null;
        if (record.createDate) {
          const createDateObj = dayjs(record.createDate);
          if (createDateObj.isValid()) {
            createDate = createDateObj.format('YYYY-MM-DD');
          }
        }
        // 如果仍然没有createDate，使用当前日期作为默认值
        if (!createDate) {
          createDate = dayjs().format('YYYY-MM-DD');
        }
        
        const requestData = {
          id: patientId,
          name: patientName,
          phone: patientPhone,
          gender: patientGender,
          birthDate: birthDate,
          createDate: createDate,
          patient_type: value || '', // 空白选项为空字符串
          organizationid: organizationId,
          force_create: true,
          status: record.status || 'active' // 保持当前启用/停用状态，避免后端覆盖为 inactive
        };
        
        console.log('更新患者类型请求数据:', requestData);
        
        // 调用API更新患者类型
        const response = await fetch('https://aiforoptometry.com/patient/create_patient/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(requestData),
          credentials: 'include'
        });
        
        console.log('更新患者类型响应状态:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('患者类型更新成功:', data);
          this.$message.success('患者类型已更新');
          
          // 触发事件通知复查列表页更新
          window.dispatchEvent(new CustomEvent('patient-type-updated', {
            detail: {
              patient_id: patientId,
              patient_type: value
            }
          }));
        } else {
          // 恢复原值
          record.patient_type = originalValue;
          this.$forceUpdate();
          const errorText = await response.text();
          console.error('更新患者类型失败:', response.status, errorText);
          let errorMessage = '更新失败';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            if (errorText) {
              errorMessage = errorText.substring(0, 100);
            }
          }
          this.$message.error(`更新失败: ${errorMessage}`);
        }
      } catch (error) {
        console.error('更新患者类型失败:', error);
        // 恢复原值
        record.patient_type = originalValue;
        this.$forceUpdate();
        this.$message.error(`更新失败: ${error.message || '请重试'}`);
      }
    },
    
    // 处理收藏切换
    async handleToggleFavorite(record) {
      console.log('切换收藏状态:', { record });
      // 保存原始值，以便失败时恢复
      const originalValue = record.is_favorite;
      
      try {
        const organizationId = localStorage.getItem('organization_id');
        const accessToken = localStorage.getItem('access_token');
        
        // 获取患者ID
        const patientId = record.id || record.patient_id;
        
        if (!patientId) {
          this.$message.error('患者ID不存在，无法更新');
          return;
        }
        
        // 切换收藏状态
        // 处理 true/false/null 三种情况：
        // null 或 false -> true (添加收藏)
        // true -> false (取消收藏)
        const newFavoriteStatus = record.is_favorite === true ? false : true;
        
        // 先更新本地数据，提供即时反馈
        record.is_favorite = newFavoriteStatus;
        this.$forceUpdate();
        
        // 构造请求数据，参考 handlePatientTypeChange 的实现
        const patientName = record.name || '';
        const patientPhone = record.phone || '';
        let patientGender = record.gender || '';
        // 性别转换: 将 'male' 转为 '男'，'female' 转为 '女'
        if (patientGender === 'male') {
          patientGender = '男';
        } else if (patientGender === 'female') {
          patientGender = '女';
        }
        
        // 获取birthDate
        const birthDateRaw = record.birthDate || record.birth_date || null;
        let birthDate = null;
        if (birthDateRaw) {
          const dateObj = dayjs(birthDateRaw);
          if (dateObj.isValid()) {
            birthDate = dateObj.format('YYYY-MM-DD');
          }
        }
        
        // 获取createDate
        let createDate = null;
        if (record.createDate) {
          const createDateObj = dayjs(record.createDate);
          if (createDateObj.isValid()) {
            createDate = createDateObj.format('YYYY-MM-DD');
          }
        }
        // 如果仍然没有createDate，使用当前日期作为默认值
        if (!createDate) {
          createDate = dayjs().format('YYYY-MM-DD');
        }
        
        const requestData = {
          id: patientId,
          name: patientName,
          phone: patientPhone,
          gender: patientGender,
          birthDate: birthDate,
          createDate: createDate,
          patient_type: record.patient_type || '',
          is_favorite: newFavoriteStatus,
          organizationid: organizationId,
          force_create: true
        };
        
        console.log('更新收藏状态请求数据:', requestData);
        
        // 调用API更新收藏状态
        const response = await fetch('https://aiforoptometry.com/patient/create_patient/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(requestData),
          credentials: 'include'
        });
        
        console.log('更新收藏状态响应状态:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('收藏状态更新成功:', data);
          this.$message.success(newFavoriteStatus ? '已添加收藏' : '已取消收藏');
        } else {
          // 恢复原值
          record.is_favorite = originalValue;
          this.$forceUpdate();
          const errorText = await response.text();
          console.error('更新收藏状态失败:', response.status, errorText);
          let errorMessage = '更新失败';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            if (errorText) {
              errorMessage = errorText.substring(0, 100);
            }
          }
          this.$message.error(`更新失败: ${errorMessage}`);
        }
      } catch (error) {
        console.error('更新收藏状态失败:', error);
        // 恢复原值
        record.is_favorite = originalValue;
        this.$forceUpdate();
        this.$message.error(`更新失败: ${error.message || '请重试'}`);
      }
    },
    
    async handlePromoteTempPatient(record) {
      // 从 identifiers 数组中提取患者编号（数字最长的）
      const patientId = this.extractPatientIdFromIdentifiers(record.identifiers) || record.gkid || '';
      
      // 确认对话框
      Modal.confirm({
        title: '确认建档',
        content: `确定要将患者 ${record.name} (患者编号: ${patientId}) 转为正式患者吗？建档后将生成档案编号，患者编号保持不变。`,
        onOk: async () => {
          try {
            // 获取组织 ID 和 JWT token
            const organizationId = localStorage.getItem('organization_id');
            const accessToken = localStorage.getItem('access_token');

            // 构造请求数据
            // 注意：建档接口需要 patient_id，gkid 应该从 identifiers 中提取
            const requestData = {
              patient_id: record.id,
              gkid: patientId // 使用从 identifiers 中提取的患者编号
            };

            console.log('发送建档请求数据:', requestData);

            // 发送请求
            const response = await fetch('https://aiforoptometry.com/patient/promote_temp/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify(requestData)
            });

            console.log('建档响应状态:', response.status);
            const data = await response.json();
            console.log('建档接收到的数据:', data);

            // 建档成功判断：response.ok 且有 id 字段就认为成功
            if (response.ok && data.id) {
              // 建档成功
              // 根据后端返回格式：old_gkid 是原来的患者编号，new_gkid 是建档后的编号（可能是档案编号）
              const patientGkid = data.old_gkid || record.gkid; // 患者编号（保持原值）
              const archiveId = data.new_gkid || '已生成'; // 档案编号（新生成）
              
              // 从 identifiers 中提取患者编号用于显示
              const displayPatientId = this.extractPatientIdFromIdentifiers(record.identifiers) || patientGkid;
              const displayArchiveId = archiveId;
              
              Modal.success({
                title: '建档成功',
                content: `患者 ${record.name} 已成功建档！\n\n患者编号: ${displayPatientId}（保持不变）\n档案编号: ${displayArchiveId}（新生成）`,
                onOk: async () => {
                  console.log('建档成功，开始刷新列表...');
                  console.log('建档患者信息:', {
                    name: record.name,
                    patientId: data.id,
                    oldGkid: data.old_gkid,
                    newGkid: data.new_gkid,
                    originalRecordId: record.id
                  });
                  
                  // 如果数据已被清除，重置清除标记以便显示新数据
                  if (this.isCleared) {
                    this.isCleared = false;
                    console.log('重置isCleared标记，允许显示新数据');
                  }
                  
                  // 无论当前在哪个模式，都刷新两个列表
                  // 因为建档后，患者应该从临时患者列表移除，并出现在建档列表中
                  console.log('刷新临时患者列表（应该移除已建档的患者）...');
                  await this.fetchTempPatientsFromBackend(false);
                  console.log('临时患者列表刷新完成，当前患者数量:', this.tempPatients.length);
                  
                  console.log('刷新建档患者列表（应该显示新建档的患者）...');
                  await this.fetchPatientsFromBackend(false);
                  console.log('建档患者列表刷新完成，当前患者数量:', this.patients.length);
                  
                  // 通知其他标签页刷新（如果存在）
                  // 这会触发其他打开的标签页自动刷新
                  if (window.dispatchEvent) {
                    console.log('发送患者建档事件通知其他标签页...');
                    window.dispatchEvent(new CustomEvent('patient-archived', {
                      detail: { 
                        patientId: data.id || record.id, 
                        patientName: record.name,
                        oldGkid: data.old_gkid,
                        newGkid: data.new_gkid
                      }
                    }));
                  }
                  
                  console.log('列表刷新完成');
                }
              });
            } else {
              // 建档失败
              const errorMessage = data.error || data.message || `建档失败，请重试（状态码: ${response.status}）`;
              console.error('建档失败:', {
                status: response.status,
                data: data
              });
              Modal.error({
                title: '建档失败',
                content: errorMessage,
              });
            }
          } catch (error) {
            console.error('建患者列表时出错:', error);
            Modal.error({
              title: '建档失败',
              content: `网络错误：${error.message || '请检查网络连接后重试'}`,
            });
          }
        },
        onCancel() {
          console.log('用户取消建档操作');
        },
      });
    },

    async handleSwitch(record) {
      const action = record.status === 'active' ? '停用' : '启用';
      const newStatus = record.status === 'active' ? 'inactive' : 'active';

      // 确认对话框
      Modal.confirm({
        title: '确认操作',
        content: `确定要${action}患者 ${record.name} 吗？`,
        onOk: async () => {
          try {
            // 获取组织 ID 和 JWT token
            const organizationId = localStorage.getItem('organization_id');
            const accessToken = localStorage.getItem('access_token');

            // 构造请求数据
            const requestData = {
              id: record.id,
              status: newStatus,
              name: record.name,
              phone: record.phone,
              gender: record.gender,
              birthDate: record.birthDate,
              createDate: record.createDate,
              organizationid: organizationId,
            };

            console.log('发送的请求数据:', requestData);

            // 发送请求
            const response = await fetch('https://aiforoptometry.com/patient/create_patient/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify(requestData)
            });

            console.log('响应状态:', response.status);
            const data = await response.json();
            console.log('接收到的数据:', data);

            if (response.ok) {
              // 更新本地数据
              const index = this.patients.findIndex(p => p.id === record.id);
              if (index !== -1) {
                this.patients[index].status = newStatus;
                // 更新本地存储
                localStorage.setItem('patientlist', JSON.stringify(this.patients));
                
                // 同步更新到IndexedDB
                const organizationId = localStorage.getItem('organization_id');
                if (organizationId) {
                  const patientKey = `patientlist_${organizationId}`;
                  console.log('患者状态更新后同步到IndexedDB，key:', patientKey);
                  
                  // 异步更新IndexedDB，不阻塞UI
                  this.updatePatientsCache()
                    .then(success => {
                      if (success) {
                        console.log('患者状态更新后IndexedDB同步成功');
                      } else {
                        console.warn('患者状态更新后IndexedDB同步失败');
                      }
                    })
                    .catch(error => {
                      console.error('患者状态更新后IndexedDB同步出错:', error);
                    });
                }
              }

              Modal.success({
                content: `患者${action}成功！`,
              });
            } else {
              Modal.error({
                content: data.message || `${action}失败，请重试`,
              });
            }
          } catch (error) {
            console.error(`${action}患者时出错:`, error);
            Modal.error({
              content: `${action}失败，请重试`,
            });
          }
        },
        onCancel() {
          console.log('用户取消操作');
        },
      });
    },
    // 停用患者（将状态改为inactive）
    handleDisablePatient(record) {
      Modal.confirm({
        title: '确认停用',
        content: `确定要停用患者 ${record.name} (${record.phone}) 吗？停用后患者将无法使用，但可以恢复。`,
        okText: '确定停用',
        cancelText: '取消',
        okType: 'danger',
        onOk: async () => {
          await this.updatePatientStatus(record, 'inactive', '停用');
        },
        onCancel() {
          console.log('用户取消停用操作');
        }
      });
    },
    
    // 恢复患者（将状态改为active）
    handleEnablePatient(record) {
      Modal.confirm({
        title: '确认恢复',
        content: `确定要恢复患者 ${record.name} (${record.phone}) 吗？恢复后患者可以正常使用。`,
        okText: '确定恢复',
        cancelText: '取消',
        onOk: async () => {
          await this.updatePatientStatus(record, 'active', '恢复');
        },
        onCancel() {
          console.log('用户取消恢复操作');
        }
      });
    },
    
    // 更新患者状态的通用方法
    async updatePatientStatus(record, newStatus, actionName) {
      try {
        const accessToken = localStorage.getItem('access_token');
        const organizationId = localStorage.getItem('organization_id');

        // 构造请求数据
        const requestData = {
          id: record.id,
          status: newStatus,
          name: record.name,
          phone: record.phone,
          gender: record.gender,
          birthDate: record.birthDate,
          createDate: record.createDate,
          organizationid: organizationId,
        };

        console.log(`[${actionName}] 发送的请求数据:`, requestData);

        // 发送请求
        const response = await fetch('https://aiforoptometry.com/patient/create_patient/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(requestData)
        });

        console.log(`[${actionName}] 响应状态:`, response.status);
        const data = await response.json();
        console.log(`[${actionName}] 接收到的数据:`, data);

        if (response.ok) {
          // 更新本地数据
          if (this.isTempPatientMode) {
            const index = this.tempPatients.findIndex(p => p.id === record.id);
            if (index !== -1) {
              this.tempPatients[index].status = newStatus;
            }
          } else {
            const index = this.patients.findIndex(p => p.id === record.id);
            if (index !== -1) {
              this.patients[index].status = newStatus;
            }
          }
          
          // 更新本地存储
          localStorage.setItem('patientlist', JSON.stringify(this.isTempPatientMode ? this.tempPatients : this.patients));
          
          // 同步更新到IndexedDB
          if (organizationId) {
            const patientKey = `patientlist_${organizationId}`;
            console.log(`[${actionName}] 患者状态更新后同步到IndexedDB，key:`, patientKey);
            
            // 异步更新IndexedDB，不阻塞UI
            this.updatePatientsCache()
              .then(success => {
                if (success) {
                  console.log(`[${actionName}] 患者状态更新后IndexedDB同步成功`);
                } else {
                  console.warn(`[${actionName}] 患者状态更新后IndexedDB同步失败`);
                }
              })
              .catch(error => {
                console.error(`[${actionName}] 患者状态更新后IndexedDB同步出错:`, error);
              });
          }

          Modal.success({
            content: `患者${actionName}成功！`,
          });
        } else {
          Modal.error({
            content: data.message || `${actionName}失败，请重试`,
          });
        }
      } catch (error) {
        console.error(`${actionName}患者时出错:`, error);
        Modal.error({
          content: `${actionName}失败，请重试`,
        });
      }
    },
    handleQRCode(record) {
      console.log('二维码', record);
      
      // 检查是否有档案编号（identifiers 长度 >= 2 表示有档案编号）
      const hasArchiveId = record.identifiers && record.identifiers.length >= 2;
      
      if (!hasArchiveId) {
        // 只有患者编号，直接打印患者编号
        this.isQRCodeModalVisible = true;
        this.generateQRCodeCanvas(record, 'patient');
      } else {
        // 既有患者编号又有档案编号，弹窗询问用户选择
        const patientId = this.extractPatientIdFromIdentifiers(record.identifiers);
        const archiveId = this.extractArchiveIdFromIdentifiers(record.identifiers);
        
        Modal.confirm({
          title: '选择打印编号',
          content: `请选择要打印的编号：\n\n患者编号: ${patientId}\n档案编号: ${archiveId}`,
          okText: '打印档案编号',
          cancelText: '打印患者编号',
          onOk: () => {
            // 用户选择打印档案编号（默认）
            this.isQRCodeModalVisible = true;
            this.generateQRCodeCanvas(record, 'archive');
          },
          onCancel: () => {
            // 用户选择打印患者编号
            this.isQRCodeModalVisible = true;
            this.generateQRCodeCanvas(record, 'patient');
          }
        });
      }
    },
    generateQRCodeCanvas(record, idType = 'patient') {
      const qrCanvas = document.createElement('canvas');
      
      // 根据 idType 选择使用患者编号还是档案编号
      let idToPrint = '';
      if (idType === 'archive') {
        // 使用档案编号（数字最短的）
        idToPrint = this.extractArchiveIdFromIdentifiers(record.identifiers) || '';
      } else {
        // 使用患者编号（数字最长的）
        idToPrint = this.extractPatientIdFromIdentifiers(record.identifiers) || record.gkid || '';
      }
      
      if (!idToPrint) {
        console.error('无法获取编号，无法生成二维码');
        Modal.error({
          title: '生成失败',
          content: '无法获取患者编号或档案编号，请检查数据'
        });
        return;
      }
      
      QRCode.toCanvas(qrCanvas, idToPrint, {width: 150}, (error) => {
        if (error) {
          console.error('二维码生成失败:', error);
          return;
        }
        console.log('二维码生成成功，使用编号:', idType === 'archive' ? '档案编号' : '患者编号', idToPrint);
        const finalCanvas = document.createElement('canvas');
        this.mergeCanvasAndText(finalCanvas, qrCanvas, record.name, record.createDate, idToPrint);
        this.qrCodeUrl = finalCanvas.toDataURL();
      });
    },
    mergeCanvasAndText(finalCanvas, qrCanvas, patientName, patientCreateDate, gkid) {
      const ctx = finalCanvas.getContext('2d');

      // 打印纸尺寸设置，50mm x 30mm，转换为像素（约 3.78 像素/mm）
      const scaleFactor = 3.78;  // 每毫米对应像素
      const canvasWidth = 50 * scaleFactor;  // 转换为像素
      const canvasHeight = 30 * scaleFactor; // 转换为像素

      // 增加画布的分辨率，宽高乘以3
      finalCanvas.width = canvasWidth * 3;  // 三倍宽度
      finalCanvas.height = canvasHeight * 3; // 三倍高度
      ctx.scale(3, 3); // 使用缩放以提高绘制质量

      ctx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);

      // 绘制二维码，设置大小为30mm*30mm
      const qrSize = 113;  // 30mm对应的像素值
      ctx.drawImage(qrCanvas, 0, 0, qrSize, qrSize); // 二维码在左侧，位置在 (0, 0)

      // 设置文字样式
      ctx.fillStyle = 'black';

      // 绘制患者姓名
      ctx.font = 'bold 16px Arial'; // 第一行字体
      ctx.fillText(patientName, qrSize + 8, 30); // 姓名的位置

      // 绘制建档日期
      ctx.font = '12px Arial'; // 第二行字体
      ctx.fillText(patientCreateDate, qrSize + 1, 90); // 首诊日期的位置

      // 只提取 gkid 中的数字部分
      const numericGkid = gkid.replace(/\D/g, ''); // 只保留数字
      ctx.font = 'bold 16px Arial'; // 第一行字体
      ctx.fillText(numericGkid, qrSize + 6, 60); // gkid的位置
    },
    // 新增临时患者
    handleAddTempPatient() {
      this.creatingPatientType = 'temp';
      this.isEditMode = false;
      this.currentPatientId = null;
      this.editingPatientRecord = null;
      this.patientForm = {
        name: '',
        phone: '',
        gender: '',
        birthDate: null,
        firstExamDate: null, // 临时患者首诊日期可为空
        examinationDate: dayjs(), // 临时患者默认当前日期
        status: 'active',
        archiveId: ''
      };
      // 重置提交状态
      this.isSubmitting = false;
      this.submitButtonText = '提交';
      // 重置手机号验证状态
      this.phoneValidateStatus = '';
      this.phoneValidateHelp = '';
      this.isModalVisible = true;
      console.log('新增临时患者');
    },
    
    // 新增建档患者
    handleAddArchivedPatient() {
      this.creatingPatientType = 'archived';
      this.isEditMode = false;
      this.currentPatientId = null;
      this.editingPatientRecord = null;
      this.patientForm = {
        name: '',
        phone: '',
        gender: '',
        birthDate: null,
        firstExamDate: dayjs(), // 建档患者默认当前日期
        examinationDate: null,
        status: 'active',
        archiveId: ''
      };
      // 重置提交状态
      this.isSubmitting = false;
      this.submitButtonText = '提交';
      // 重置手机号验证状态
      this.phoneValidateStatus = '';
      this.phoneValidateHelp = '';
      this.isModalVisible = true;
      console.log('新增建档患者');
    },
    // 生成患者编号：格式为 YYMMDD + 序号（根据首诊日期，例如：2025年12月28日第一个患者是 2512281）
    getNextPatientGkid(firstExamDate) {
      // 使用首诊日期，如果没有则使用当前日期
      const examDate = firstExamDate ? dayjs(firstExamDate) : dayjs();
      const datePrefix = examDate.format('YYMMDD'); // 例如：251228
      
      // 合并临时患者列表和建档患者列表，查找该日期已有的所有患者编号
      const allPatients = [...(this.tempPatients || []), ...(this.patients || [])];
      
      // 查找该日期已有的患者编号，提取序号
      const datePatients = allPatients.filter(patient => {
        if (!patient.identifiers || patient.identifiers.length === 0) return false;
        // 从 identifiers 中提取患者编号（数字最长的）
        const patientId = this.extractPatientIdFromIdentifiers(patient.identifiers);
        if (!patientId) return false;
        // 检查编号是否以该日期的前缀开头
        return patientId.startsWith(datePrefix);
      });
      
      // 提取该日期已有的最大序号
      let maxSequence = 0;
      datePatients.forEach(patient => {
        // 从 identifiers 中提取患者编号
        const patientId = this.extractPatientIdFromIdentifiers(patient.identifiers);
        if (!patientId) return;
        // 提取编号中的序号部分（日期前缀后的数字）
        // 例如：2512281 -> 提取 1
        const sequenceMatch = patientId.match(new RegExp(`^${datePrefix}(\\d+)$`));
        if (sequenceMatch) {
          const sequence = parseInt(sequenceMatch[1]);
          maxSequence = Math.max(maxSequence, sequence);
        }
      });
      
      // 生成新的序号（该日期最大序号 + 1）
      const nextSequence = maxSequence + 1;
      
      // 返回格式：YYMMDD + 序号（例如：2512281）
      return `${datePrefix}${nextSequence}`;
    },
    
    // 获取下一个档案编号（按顺序递增，只从已建档的患者中查找）
    getNextArchiveId() {
      // 从本地存储中获取所有建档患者，确保获取到最新的档案编号
      let allArchivedPatients = [];
      
      // 1. 从当前显示的建档患者列表中获取
      if (this.patients && this.patients.length > 0) {
        allArchivedPatients = [...this.patients];
      }
      
      // 2. 从localStorage中获取建档患者列表（如果存在）
      try {
        const cachedPatients = localStorage.getItem('patientlist');
        if (cachedPatients) {
          const parsedPatients = JSON.parse(cachedPatients);
          // 合并到列表中，避免重复
          parsedPatients.forEach(patient => {
            // 如果 identifiers 数组长度 >= 2，说明已建档
            if (patient.identifiers && patient.identifiers.length >= 2 && !allArchivedPatients.find(p => p.id === patient.id)) {
              allArchivedPatients.push(patient);
            }
          });
        }
      } catch (error) {
        console.warn('从localStorage获取建档患者列表失败:', error);
      }
      
      // 查找所有已有档案编号，找出最大值
      const maxArchiveId = allArchivedPatients.reduce((max, patient) => {
        // 从 identifiers 数组中提取档案编号（数字最短的）
        const archiveId = this.extractArchiveIdFromIdentifiers(patient.identifiers);
        if (!archiveId) return max;
        // 提取档案编号中的数字部分
        const num = parseInt(archiveId);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      
      // 返回下一个档案编号（从1开始，如果没有已建档的患者，返回1）
      const nextArchiveId = maxArchiveId + 1;
      console.log('生成档案编号:', {
        maxArchiveId,
        nextArchiveId,
        totalArchivedPatients: allArchivedPatients.length
      });
      
      return nextArchiveId.toString();
    },
    async handleExcelImport() {
      const self = this;
      const {ipcRenderer} = window.require('electron');
      Modal.confirm({
        title: '请选择操作',
        content: '请选择上传文件还是下载模板',
        okText: '上传文件',
        cancelText: '下载模板',
        closable: false,
        maskClosable: false,
        async onOk() {
          const filePath = await ipcRenderer.invoke('select-file');
          if (filePath) {
            if (!(/\.(xls|xlsx)$/.test(filePath))) {
              Modal.error({content: '请选择有效的Excel文件(xls或xlsx)'});
              return;
            }
            const excelData = await ipcRenderer.invoke('read-excel', filePath);
            console.log('读取的excel数据:', excelData);
            const organization_id = localStorage.getItem('organization_id');
            const accessToken = localStorage.getItem('access_token');
            const url = 'https://aiforoptometry.com/patient/create_patient/';
            
            // 启动进度条
            self.startImportProgress(excelData.length);
            let successCount = 0;
            for (let i = 0; i < excelData.length; i++) {
              const row = excelData[i];
              console.log('处理第', i + 1, '行数据:', row);
              console.log('Excel字段名:', Object.keys(row));
              console.log('手机号字段值:', row['手机号码'], row['手机号']);
              const createDate = self.formatDate(row['建档日期']);
              const patientData = {
                name: row['姓名'] || '',
                phone: self.formatPhone(row['手机号码'] || row['手机号'] || ''),
                gender: row['性别'] || '',
                birthDate: self.formatDate(row['出生日期']),
                createDate: createDate,
                organizationid: organization_id,
                force_create: true,
                gkid: self.getNextPatientGkid(createDate ? dayjs(createDate).toDate() : null) // 患者编号：根据建档日期生成（YYMMDD + 序号）
                // Excel导入时不生成档案编号，需要手动建档
              };
              console.log('处理后的患者数据:', patientData);
              if (patientData.gender === 'male') {
                patientData.gender = '男';
              } else if (patientData.gender === 'female') {
                patientData.gender = '女';
              }
              console.log(`上传第 ${i + 1} 条, 内容:`, patientData);
              
              // 更新进度条显示当前正在导入的患者
              self.updateImportProgress(i, {
                name: patientData.name,
                phone: patientData.phone
              });
              
              try {
                const response = await fetch(url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Requested-With': 'XMLHttpRequest'
                  },
                  credentials: 'include',
                  body: JSON.stringify(patientData)
                });
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                  const resData = await response.json();
                  console.log(`第 ${i + 1} 条上传结果:`, resData);
                  if (resData.success) {
                    successCount++;
                    self.updateImportProgress(i + 1);
                  } else {
                    self.setImportError(`患者 ${patientData.name} 创建失败`);
                    break;
                  }
                } else {
                  const text = await response.text();
                  console.error(`第 ${i + 1} 条返回非JSON数据:`, text);
                  self.setImportError(`患者 ${patientData.name} 创建失败：返回非JSON数据`);
                  break;
                }
              } catch (error) {
                console.error(`第 ${i + 1} 条上传出错:`, error);
                
                // 尝试备用方案：使用session认证
                if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                  console.log(`第 ${i + 1} 条尝试备用方案：使用session认证`);
                  try {
                    const csrftoken = localStorage.getItem('csrftoken');
                    const fallbackResponse = await fetch(url, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                        'X-Requested-With': 'XMLHttpRequest'
                      },
                      credentials: 'include',
                      body: JSON.stringify(patientData)
                    });
                    
                    if (fallbackResponse.ok) {
                      const resData = await fallbackResponse.json();
                      console.log(`第 ${i + 1} 条备用方案上传结果:`, resData);
                      if (resData.success) {
                        successCount++;
                        self.updateImportProgress(i + 1);
                        continue; // 继续处理下一条
                      }
                    }
                                  } catch (fallbackError) {
                  console.error(`第 ${i + 1} 条备用方案也失败:`, fallbackError);
                }
              }
              
              self.setImportError(`患者 ${patientData.name} 创建失败：网络错误`);
              break;
              }
            }
            if (successCount === excelData.length) {
              // 全部成功
              self.setImportSuccess();
              // 刷新列表数据
              await self.fetchPatientsFromBackend();
            } else if (successCount > 0) {
              // 部分成功
              self.setImportError(`部分患者创建失败，已成功录入 ${successCount} 个患者`);
              // 即使部分失败也刷新列表，显示已成功创建的患者
              await self.fetchPatientsFromBackend();
            }
            
            // Excel导入完成后，确保IndexedDB同步
            const organizationId = localStorage.getItem('organization_id');
            if (organizationId) {
              const patientKey = `patientlist_${organizationId}`;
              console.log('Excel导入完成后同步到IndexedDB，key:', patientKey);
              
              // 获取最新的患者数据
              const latestPatients = JSON.parse(localStorage.getItem('patientlist') || '[]');
              
              // 异步更新IndexedDB，不阻塞UI
              self.updatePatientsCache()
                .then(success => {
                  if (success) {
                    console.log('Excel导入完成后IndexedDB同步成功');
                  } else {
                    console.warn('Excel导入完成后IndexedDB同步失败');
                  }
                })
                .catch(error => {
                  console.error('Excel导入完成后IndexedDB同步出错:', error);
                });
            }
            // 如果全部失败，错误已经在循环中设置了
          }
        },
        async onCancel() {
          const savedPath = await ipcRenderer.invoke('save-template');
          if (savedPath) {
            Modal.success({content: '模板已保存至: ' + savedPath});
          } else {
            Modal.info({content: '取消下载模板'});
          }
        }
      });
    },
    handleBatchPrint() {
      this.isBatchPrintModalVisible = true;
    },
    handleCancelPatientModal() {
      this.isModalVisible = false;
      // 重置提交状态
      this.isSubmitting = false;
      this.submitButtonText = '提交';
      // 重置编辑状态
      this.isEditMode = false;
      this.editingPatientRecord = null;
      // 重置手机号验证状态
      this.phoneValidateStatus = '';
      this.phoneValidateHelp = '';
    },
    handleCancelQRCodeModal() {
      this.isQRCodeModalVisible = false;
    },
    async printQRCode() {
      if (!this.qrCodeUrl) {
        console.error('二维码还未生成');
        return;
      }
      const {ipcRenderer} = window.require('electron');
      try {
        await ipcRenderer.invoke('print-qrcode', this.qrCodeUrl);
      } catch (error) {
        console.error('打印二维码时出错:', error);
      }
    },
    async submitPatient() {
      // 防重复提交检查
      if (this.isSubmitting) {
        console.log('正在提交中，请勿重复点击');
        return;
      }

      // 防抖检查：防止500ms内重复点击
      const currentTime = Date.now();
      if (currentTime - this.lastSubmitTime < 500) {
        console.log('点击过于频繁，请稍后再试');
        return;
      }
      this.lastSubmitTime = currentTime;

      // 表单验证
      if (!this.patientForm.name || this.patientForm.name.trim() === '') {
        Modal.error({
          content: '请填写患者姓名'
        });
        return;
      }
      if (!this.patientForm.phone || this.patientForm.phone.trim() === '') {
        Modal.error({
          content: '请填写患者电话'
        });
        return;
      }
      // 验证手机号格式：必须是11位数字
      const phoneRegex = /^\d{11}$/;
      const phoneValue = this.patientForm.phone.trim();
      if (!phoneRegex.test(phoneValue)) {
        const phoneLength = phoneValue.length;
        if (phoneLength < 11) {
          Modal.error({
            content: `联系电话必须是11位手机号码，当前为${phoneLength}位，请补全`
          });
        } else {
          Modal.error({
            content: '联系电话必须是11位数字，请检查输入'
          });
        }
        this.phoneValidateStatus = 'error';
        this.phoneValidateHelp = phoneLength < 11 ? `缺少${11 - phoneLength}位数字` : '请输入11位数字';
        return;
      }
      if (!this.patientForm.gender) {
        Modal.error({
          content: '请选择患者性别'
        });
        return;
      }

      // 设置提交状态
      this.isSubmitting = true;
      this.submitButtonText = '提交中...';

      const accessToken = localStorage.getItem('access_token');
      const organization_id = localStorage.getItem('organization_id');
      
      // 根据模式选择不同的接口
      // 临时患者模式（新增）：使用临时患者创建接口（只创建患者编号）
      // 建档患者模式（新增）或编辑模式：使用创建患者接口（创建患者编号和档案编号）
      let url;
      if (!this.isEditMode && this.creatingPatientType === 'temp') {
        // 临时患者新增模式：使用临时患者创建接口
        url = 'https://aiforoptometry.com/patients/temp/create/';
      } else {
        // 建档患者新增模式或编辑模式：使用创建患者接口
        url = 'https://aiforoptometry.com/patient/create_patient/';
      }

      // 检查 organization_id 是否存在
      if (!organization_id) {
        Modal.error({
          content: '缺少组织ID，请重新登录'
        });
        this.isSubmitting = false;
        this.submitButtonText = '提交';
        return;
      }

      // 统一的患者数据结构
      let patientData = {
        name: this.patientForm.name,
        phone: this.patientForm.phone,
        gender: this.patientForm.gender,
        birthDate: this.patientForm.birthDate ? dayjs(this.patientForm.birthDate).format('YYYY-MM-DD') : null,
        status: this.patientForm.status || 'active'
      };

      // 性别转换: 将 'male' 转为 '男'，'female' 转为 '女'
      if (patientData.gender === 'male') {
        patientData.gender = '男';
      } else if (patientData.gender === 'female') {
        patientData.gender = '女';
      }

      if (this.isEditMode) {
        // 编辑模式：传递患者ID和档案编号，使用创建患者接口
        patientData.id = this.currentPatientId;
        patientData.force_create = true;
        patientData.organizationid = organization_id; // 创建患者接口使用 organizationid
        
        // 编辑时需要包含原始记录的 createDate（如果存在）
        if (this.editingPatientRecord && this.editingPatientRecord.createDate) {
          patientData.createDate = dayjs(this.editingPatientRecord.createDate).format('YYYY-MM-DD');
        }
        
        // 如果提供了档案编号，则使用表单中的档案编号
        if (this.patientForm.archiveId) {
          patientData.archive_id = this.patientForm.archiveId;
        }
      } else {
        // 新增模式
        if (this.creatingPatientType === 'temp') {
          // 临时患者模式：使用临时患者创建接口，只传递基本信息，后端会自动生成患者编号
          // 临时患者接口只创建患者编号，不创建档案编号
          // 注意：临时患者接口可能需要 organization_id（带下划线）而不是 organizationid
          patientData.organization_id = organization_id; // 临时患者接口使用 organization_id
          const firstExamDate = this.patientForm.firstExamDate ? dayjs(this.patientForm.firstExamDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
          patientData.createDate = firstExamDate;
          // 注意：临时患者接口应该由后端生成患者编号，不需要前端传递 gkid
        } else {
          // 建档患者模式：使用创建患者接口，生成患者编号和档案编号
          patientData.organizationid = organization_id; // 创建患者接口使用 organizationid
          const firstExamDate = this.patientForm.firstExamDate ? dayjs(this.patientForm.firstExamDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
          patientData.createDate = firstExamDate;
          // 根据首诊日期生成患者编号（YYMMDD + 序号）
          patientData.gkid = this.getNextPatientGkid(this.patientForm.firstExamDate);
          // 自动生成档案编号
          patientData.archive_id = this.getNextArchiveId();
        }
      }

      console.log('=== 患者提交信息 ===');
      console.log('操作:', this.isEditMode ? '编辑' : (this.creatingPatientType === 'temp' ? '新增临时患者' : '新增建档患者'));
      console.log('接口URL:', url);
      console.log('发送给后端的数据:', patientData);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(patientData)
        });

        // 检查响应状态
        if (!response.ok) {
          const errorText = await response.text();
          console.error('患者创建请求失败:', response.status, response.statusText);
          console.error('错误响应内容:', errorText);
          let errorMessage = '创建失败，请重试';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            // 如果无法解析JSON，使用原始错误文本
            if (errorText) {
              errorMessage = errorText.substring(0, 100);
            }
          }
          Modal.error({
            content: this.creatingPatientType === 'temp' ? `临时患者创建失败: ${errorMessage}` : `建档患者创建失败: ${errorMessage}`
          });
          this.isSubmitting = false;
          this.submitButtonText = '提交';
          return;
        }

        const data = await response.json();
        console.log('后端返回的数据:', data);

        if (data.success || data.updated) {
          Modal.success({content: this.isEditMode ? '更新成功！' : (this.creatingPatientType === 'temp' ? '临时患者创建成功！' : '建档患者创建成功！')});
          this.isModalVisible = false;
          
          // 重置提交状态
          this.isSubmitting = false;
          this.submitButtonText = '提交';

          if (this.creatingPatientType === 'temp') {
            // 临时患者创建成功后刷新临时患者列表
            console.log('刷新临时患者列表...');
            await this.fetchTempPatientsFromBackend();
            console.log('临时患者列表刷新完成');
          } else {
            // 建档患者创建成功后刷新建档患者列表
            console.log('刷新建档患者列表...');
            
            // 先刷新数据，确保获取最新的患者列表
            await this.fetchPatientsFromBackend(false);
            
            // 如果数据已被清除，重置清除标记以便显示新数据
            if (this.isCleared) {
              this.isCleared = false;
              console.log('重置isCleared标记，允许显示新数据');
            }
            
            console.log('建档患者列表刷新完成，当前患者数量:', this.patients.length);
          }
        } else if (data.exists && !this.isEditMode) {
          Modal.confirm({
            content: data.message + ' 该手机号已被使用，是否继续创建？',
            onOk: async () => {
              // 强制创建时，如果是临时患者模式，使用临时患者接口；否则使用创建患者接口
              patientData.force_create = true;
              // 注意：临时患者接口可能不支持 force_create，如果支持则保留，否则删除
              if (this.creatingPatientType !== 'temp') {
                // 建档患者模式：使用创建患者接口，支持 force_create
                const forceUrl = 'https://aiforoptometry.com/patient/create_patient/';
                const response2 = await fetch(forceUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                  },
                  body: JSON.stringify(patientData)
                });
                const data2 = await response2.json();
                console.log('后端返回的数据（强制创建）:', data2);
                if (data2.success) {
                  Modal.success({content: '创建成功！'});
                  this.isModalVisible = false;
                  
                  // 重置提交状态
                  this.isSubmitting = false;
                  this.submitButtonText = '提交';
                  
                  // 同步更新到IndexedDB（强制创建后）
                  const organizationId = localStorage.getItem('organization_id');
                  if (organizationId) {
                    const patientKey = `patientlist_${organizationId}`;
                    console.log('患者强制创建后同步到IndexedDB，key:', patientKey);
                    
                    // 异步更新IndexedDB，不阻塞UI
                    this.updatePatientsCache()
                      .then(success => {
                        if (success) {
                          console.log('患者强制创建后IndexedDB同步成功');
                        } else {
                          console.warn('患者强制创建后IndexedDB同步失败');
                        }
                      })
                      .catch(error => {
                        console.error('患者强制创建后IndexedDB同步出错:', error);
                      });
                  }
                  
                  // 刷新列表数据
                  await this.fetchPatientsFromBackend();
                } else {
                  Modal.error({content: '创建失败，请重试'});
                }
              } else {
                // 临时患者模式：提示用户临时患者接口可能不支持强制创建
                Modal.warning({
                  title: '提示',
                  content: '临时患者创建接口可能不支持强制创建，请检查手机号是否已存在。'
                });
                this.isSubmitting = false;
                this.submitButtonText = '提交';
              }
            },
            onCancel() {
              Modal.info({content: '操作已取消'});
              this.isSubmitting = false;
              this.submitButtonText = '提交';
            }
          });
        } else {
          const errorMsg = this.isEditMode ? '更新失败，请重试' : 
                          (this.creatingPatientType === 'temp' ? '临时患者创建失败，请重试' : '建档患者创建失败，请重试');
          Modal.error({content: errorMsg});
          
          // 重置提交状态
          this.isSubmitting = false;
          this.submitButtonText = '提交';
        }
      } catch (error) {
        console.error('出错了:', error);
        const errorMsg = this.isEditMode ? '更新失败，请重试' : 
                        (this.creatingPatientType === 'temp' ? '临时患者创建失败，请重试' : '建档患者创建失败，请重试');
        Modal.error({content: errorMsg});
        
        // 重置提交状态
        this.isSubmitting = false;
        this.submitButtonText = '提交';
      }
    },
    handleAfterClose() {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    },
    // 验证手机号格式
    validatePhone() {
      const phoneValue = this.patientForm.phone ? this.patientForm.phone.trim() : '';
      const phoneRegex = /^\d{11}$/;
      
      if (!phoneValue) {
        this.phoneValidateStatus = '';
        this.phoneValidateHelp = '';
        return;
      }
      
      if (phoneRegex.test(phoneValue)) {
        this.phoneValidateStatus = 'success';
        this.phoneValidateHelp = '';
      } else {
        const phoneLength = phoneValue.length;
        this.phoneValidateStatus = 'error';
        if (phoneLength < 11) {
          this.phoneValidateHelp = `缺少${11 - phoneLength}位数字，请输入11位手机号码`;
        } else {
          this.phoneValidateHelp = '请输入11位数字';
        }
      }
    },
    // 处理手机号输入
    handlePhoneInput(e) {
      // 只允许输入数字
      const value = e.target.value.replace(/\D/g, '');
      this.patientForm.phone = value;
      // 实时验证（仅在输入后长度变化时）
      if (value.length === 11 || value.length === 0) {
        this.validatePhone();
      } else {
        // 输入过程中显示提示
        this.phoneValidateStatus = 'error';
        this.phoneValidateHelp = `缺少${11 - value.length}位数字`;
      }
    },
    validatePrintRange() {
      const start = parseInt(this.printStart);
      const end = parseInt(this.printEnd);
      return !isNaN(start) && !isNaN(end) && start > 0 && end >= start;
    },
    async generateBatchPreview(patients) {
      this.batchPrintPreviewUrls = await Promise.all(patients.map(async patient => {
        const canvas = document.createElement('canvas');
        // 根据用户选择的编号类型提取编号
        let idToPrint = '';
        if (this.batchPrintIdType === 'archive') {
          // 使用档案编号（数字最短的），如果没有档案编号则使用患者编号作为后备
          idToPrint = this.extractArchiveIdFromIdentifiers(patient.identifiers);
          if (!idToPrint) {
            // 如果没有档案编号，使用患者编号作为后备
            idToPrint = this.extractPatientIdFromIdentifiers(patient.identifiers) || patient.gkid || '';
          }
        } else {
          // 使用患者编号（数字最长的）
          idToPrint = this.extractPatientIdFromIdentifiers(patient.identifiers) || patient.gkid || '';
        }
        
        if (!idToPrint) {
          console.warn('无法获取编号，跳过该患者:', patient.name);
          return null;
        }
        
        await QRCode.toCanvas(canvas, idToPrint, {width: 200});

        const finalCanvas = document.createElement('canvas');
        const ctx = finalCanvas.getContext('2d');

        // 设置画布尺寸
        const scaleFactor = 3.78;  // 每毫米对应像素
        const canvasWidth = 50 * scaleFactor * 3;  // 转换为像素
        const canvasHeight = 30 * scaleFactor * 3; // 转换为像素
        finalCanvas.width = canvasWidth;
        finalCanvas.height = canvasHeight;
        ctx.scale(3, 3);

        // 绘制二维码
        const qrSize = 113;  // 30mm对应的像素值
        ctx.drawImage(canvas, 0, 0, qrSize, qrSize);

        // 绘制患者信息
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(patient.name, qrSize + 8, 30);
        ctx.font = '12px Arial';
        ctx.fillText(patient.createDate, qrSize + 1, 90);
        ctx.font = 'bold 16px Arial';
        const numericId = idToPrint.replace(/\D/g, '');
        ctx.fillText(numericId, qrSize + 6, 60);

        return finalCanvas.toDataURL();
      }));
      // 过滤掉 null 值（无法获取编号的患者）
      this.batchPrintPreviewUrls = this.batchPrintPreviewUrls.filter(url => url !== null);
    },
    handleCancelBatchPrintModal() {
      this.isBatchPrintModalVisible = false;
      this.batchPrintPreviewUrls = [];
      this.batchPrintIdType = 'patient'; // 重置为默认值
    },
    async handlePreview() {
      if (!this.validatePrintRange()) {
        Modal.error({content: '请输入有效的打印范围'});
        return;
      }

      // 根据当前模式选择数据源（与表格显示的数据源保持一致）
      const sourcePatients = this.isTempPatientMode ? this.filteredTempPatients : this.filteredPatients;
      
      const patientsToPreview = sourcePatients
          .filter(patient => {
            // 根据用户选择的编号类型来决定筛选范围
            let idToFilter = '';
            if (this.batchPrintIdType === 'archive') {
              // 使用档案编号筛选
              idToFilter = this.extractArchiveIdFromIdentifiers(patient.identifiers);
              // 如果没有档案编号，跳过该患者（因为用户选择了档案编号范围）
              if (!idToFilter) {
                return false;
              }
            } else {
              // 使用患者编号筛选
              idToFilter = this.extractPatientIdFromIdentifiers(patient.identifiers);
            }
            
            const num = idToFilter ? parseInt(idToFilter) : 0;
            return num >= this.printStart && num <= this.printEnd;
          })
          .map(patient => ({
            id: patient.id,
            name: patient.name,
            identifiers: patient.identifiers,
            gkid: patient.gkid, // 保留 gkid 作为后备
            createDate: patient.createDate
          }));

      if (patientsToPreview.length === 0) {
        Modal.error({content: '没有找到符合条件的患者'});
        return;
      }

      await this.generateBatchPreview(patientsToPreview);
    },
    async confirmBatchPrint() {
      if (!this.validatePrintRange()) {
        Modal.error({content: '请输入有效的打印范围'});
        return;
      }

      const {ipcRenderer} = window.require('electron');
      try {
        // 根据当前模式选择数据源（与表格显示的数据源保持一致）
        const sourcePatients = this.isTempPatientMode ? this.filteredTempPatients : this.filteredPatients;
        
        const patientsToPrint = sourcePatients
            .filter(patient => {
              // 根据用户选择的编号类型来决定筛选范围
              let idToFilter = '';
              if (this.batchPrintIdType === 'archive') {
                // 使用档案编号筛选
                idToFilter = this.extractArchiveIdFromIdentifiers(patient.identifiers);
                // 如果没有档案编号，跳过该患者（因为用户选择了档案编号范围）
                if (!idToFilter) {
                  return false;
                }
              } else {
                // 使用患者编号筛选
                idToFilter = this.extractPatientIdFromIdentifiers(patient.identifiers);
              }
              
              const num = idToFilter ? parseInt(idToFilter) : 0;
              return num >= this.printStart && num <= this.printEnd;
            })
            .map(patient => ({
              id: patient.id,
              name: patient.name,
              identifiers: patient.identifiers,
              gkid: patient.gkid, // 保留 gkid 作为后备
              createDate: patient.createDate
            }));

        if (patientsToPrint.length === 0) {
          Modal.error({content: '没有找到符合条件的患者'});
          return;
        }

        // 生成二维码图片
        const patientsWithQrCode = await Promise.all(patientsToPrint.map(async patient => {
          const canvas = document.createElement('canvas');
          // 根据用户选择的编号类型提取编号
          let idToPrint = '';
          if (this.batchPrintIdType === 'archive') {
            // 使用档案编号（数字最短的），如果没有档案编号则使用患者编号作为后备
            idToPrint = this.extractArchiveIdFromIdentifiers(patient.identifiers);
            if (!idToPrint) {
              // 如果没有档案编号，使用患者编号作为后备
              idToPrint = this.extractPatientIdFromIdentifiers(patient.identifiers) || patient.gkid || '';
            }
          } else {
            // 使用患者编号（数字最长的）
            idToPrint = this.extractPatientIdFromIdentifiers(patient.identifiers) || patient.gkid || '';
          }
          
          if (!idToPrint) {
            console.warn('无法获取编号，跳过该患者:', patient.name);
            return null;
          }
          
          await QRCode.toCanvas(canvas, idToPrint, {width: 200});

          const finalCanvas = document.createElement('canvas');
          const ctx = finalCanvas.getContext('2d');

          // 设置画布尺寸
          const scaleFactor = 3.78;  // 每毫米对应像素
          const canvasWidth = 50 * scaleFactor * 3;  // 转换为像素
          const canvasHeight = 30 * scaleFactor * 3; // 转换为像素
          finalCanvas.width = canvasWidth;
          finalCanvas.height = canvasHeight;
          ctx.scale(3, 3);

          // 绘制二维码
          const qrSize = 113;  // 30mm对应的像素值
          ctx.drawImage(canvas, 0, 0, qrSize, qrSize);

          // 绘制患者信息
          ctx.fillStyle = 'black';
          ctx.font = 'bold 16px Arial';
          ctx.fillText(patient.name, qrSize + 8, 30);
          ctx.font = '12px Arial';
          ctx.fillText(patient.createDate, qrSize + 1, 90);
          ctx.font = 'bold 16px Arial';
          const numericId = idToPrint.replace(/\D/g, '');
          ctx.fillText(numericId, qrSize + 6, 60);

          return {
            ...patient,
            qrCodeUrl: finalCanvas.toDataURL()  // 确保包含二维码图片URL
          };
        }));
        
        // 过滤掉 null 值（无法获取编号的患者）
        const validPatientsWithQrCode = patientsWithQrCode.filter(p => p !== null);
        
        if (validPatientsWithQrCode.length === 0) {
          Modal.error({content: '没有找到符合条件的患者或无法获取编号'});
          return;
        }

        // 只传递必要的数据给主进程，避免序列化错误
        // 主进程只需要 qrCodeUrl 用于打印，其他字段可以省略
        const printData = validPatientsWithQrCode.map(patient => ({
          qrCodeUrl: patient.qrCodeUrl
        }));

        // 传递包含二维码图片的数据给主进程
        await ipcRenderer.invoke('batch-print-qrcode', printData);
        this.isBatchPrintModalVisible = false;
      } catch (error) {
        console.error('批量打印失败:', error);
        Modal.error({content: '批量打印失败，请重试'});
      }
    }
  }
};
</script>

<style scoped lang="scss">
.patient-list-spin-wrapper {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.patient-list-spin-wrapper :deep(.ant-spin-container) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.wrapper {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 18px 24px 18px 24px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* 可在此添加样式 */
:deep(.hidden-column) {
  display: none;
}

:deep(.inactive-row) {
  color: gray;
  text-decoration: line-through;
}

.header-container {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(226, 114, 68, 0.1);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  gap: 16px;
  flex-wrap: wrap;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  
  // 添加光泽效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
}

.primary-btn {
  background: linear-gradient(135deg, #E27244 0%, #E29D44 100%);
  border: none;
  color: #fff;
  box-shadow: 0 4px 12px rgba(226, 114, 68, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #d16234 0%, #d28d34 100%);
    color: #fff;
    box-shadow: 0 6px 20px rgba(226, 114, 68, 0.4);
  }
  
  &:active {
    box-shadow: 0 2px 8px rgba(226, 114, 68, 0.3);
  }
}

.danger-btn {
  background: #fff;
  border: 2px solid #ff4d4f;
  color: #ff4d4f;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.15);
  
  &:hover {
    background: linear-gradient(135deg, #fff1f0 0%, #ffe7e6 100%);
    border-color: #ff7875;
    color: #ff7875;
    box-shadow: 0 4px 12px rgba(255, 77, 79, 0.25);
  }
  
  &:active {
    box-shadow: 0 1px 4px rgba(255, 77, 79, 0.15);
  }
}

.header-bottom {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tab-switcher {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tab-btn {
  min-width: 120px;
  height: 40px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  border: 2px solid #E27244;
  background: #FFFFFF;
  color: #E27244;
  transition: all 0.3s ease;
  
  &:hover {
    background: #FFF5F2;
    border-color: #E27244;
    color: #E27244;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(226, 114, 68, 0.2);
  }
}

.tab-btn-active {
  background: linear-gradient(-90deg, #E27244 0%, #E29D44 100%) !important;
  border-color: #E27244 !important;
  color: #FFFFFF !important;
  box-shadow: 0 2px 8px rgba(226, 114, 68, 0.3);
  
  &:hover {
    background: linear-gradient(-90deg, #D6653A 0%, #D18A3A 100%) !important;
    box-shadow: 0 4px 12px rgba(226, 114, 68, 0.4);
  }
}

.search-filters {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
}

.search-input {
  width: 200px;
  min-width: 180px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #E27244;
  }
  
  &:focus,
  &:focus-within {
    border-color: #E27244;
    box-shadow: 0 0 0 2px rgba(226, 114, 68, 0.1);
  }
}

// 统一搜索框样式
.unified-search-input {
  width: 360px;
  min-width: 340px;
}

.show-inactive-checkbox {
  white-space: nowrap;
  margin-left: 0;
}

.tabs-and-search-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
  padding: 4px 0;
  width: 100%;
  overflow: visible;
  flex-shrink: 0;
}
.tabs-and-search-row .patient-list-sub-tabs {
  flex: 0 0 auto;
  margin-bottom: 0;
}
.tab-row-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}
.tab-row-right .search-box-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tab-row-right :deep(.ant-input),
.tab-row-right :deep(.ant-input-affix-wrapper) {
  height: 36px;
  font-size: 14px;
  box-sizing: border-box;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: visible;
}
.tab-row-right :deep(.ant-input-affix-wrapper) {
  display: flex;
  align-items: center;
  padding: 0 11px 0 0;
}
.tab-row-right :deep(.ant-input-affix-wrapper .ant-input),
.tab-row-right :deep(.ant-input) {
  text-align: center;
  line-height: 22px;
  padding: 6px 11px;
  height: 100%;
  box-sizing: border-box;
  border: none;
}
.tab-row-right :deep(.ant-input-affix-wrapper:focus-within),
.tab-row-right :deep(.ant-input-affix-wrapper:hover) {
  border-color: #E27244;
}
.tab-row-right :deep(.ant-input-prefix) {
  margin-right: 4px;
}
.tab-row-right :deep(.ant-btn) {
  height: 36px;
  padding: 0 15px;
  font-size: 14px;
  line-height: 34px;
}
.tab-row-search {
  width: 140px;
}
.tab-row-search.tab-row-search-archive {
  width: 160px;
}
.tab-row-checkbox {
  margin-right: 4px;
}
.patient-list-sub-tabs {
  margin-bottom: 0;
}
.patient-list-sub-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
  padding: 0;
}
.patient-list-sub-tabs :deep(.ant-tabs-nav-list) {
  margin-bottom: 0;
}
.patient-list-sub-tabs :deep(.ant-tabs-tab) {
  padding: 0 0 4px 0;
  margin: 0 24px 0 0;
  font-size: 16px;
  line-height: 1.35;
}
.patient-list-sub-tabs :deep(.ant-tabs-ink-bar) {
  bottom: 0;
}
.patient-list-sub-tabs :deep(.ant-tabs-tab + .ant-tabs-tab) {
  margin-left: 0;
}
.patient-list-header,
.archived-list-header {
  padding-bottom: 0;
  margin-bottom: 16px;
}
.patient-list-header .header-top,
.archived-list-header .header-top {
  margin-bottom: 0;
  padding-bottom: 12px;
}
.patient-list-header .search-filters,
.archived-list-header .search-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.clear-filter-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  border: 1.5px solid #d9d9d9;
  background: #fff;
  color: #666;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  
  &:hover {
    border-color: #ff7875;
    color: #ff7875;
    background: #fff1f0;
    box-shadow: 0 2px 6px rgba(255, 120, 117, 0.2);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
}

.header-input {
  width: 188px;
  height: 38px;
  background: #FFFFFF;
  border-radius: 8px 8px 8px 8px;
  border: 1px solid #E27244;
}

.header-btn {
  width: 128px;
  height: 38px;
  background: linear-gradient(-90deg, #E27244 0%, #E29D44 100%);
  border-radius: 10px 10px 10px 10px;
  font-weight: 500;
  font-size: 20px;
  color: #FFFFFF;
  text-align: left;
  font-style: normal;
  text-transform: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 切换按钮样式 */
.switch-btn {
  background: #FFFFFF !important;
  border: 2px solid #E27244 !important;
  color: #E27244 !important;
  transition: all 0.3s ease;
}

.switch-btn:hover {
  background: #FFF5F2 !important;
  border-color: #E27244 !important;
  color: #E27244 !important;
}

.switch-btn-active {
  background: linear-gradient(-90deg, #E27244 0%, #E29D44 100%) !important;
  border: 2px solid #E27244 !important;
  color: #FFFFFF !important;
  box-shadow: 0 2px 8px rgba(226, 114, 68, 0.3);
}

.switch-btn-active:hover {
  background: linear-gradient(-90deg, #D6653A 0%, #D18A3A 100%) !important;
  border-color: #D6653A !important;
  color: #FFFFFF !important;
  box-shadow: 0 4px 12px rgba(226, 114, 68, 0.4);
}

:deep(.ant-table) {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  // 表头行整体样式
  .ant-table-thead > tr {
    border-radius: 8px 8px 0 0;
    overflow: hidden;
  }
  
  .ant-table-thead > tr > th {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  th.ant-table-cell {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%);
    font-weight: 600;
    font-size: 14px;
    color: #475569;
    padding: 8px 16px;
    border-bottom: 2px solid #e2e8f0;
    border-top: none;
    border-left: none;
    border-right: none;
    white-space: nowrap;
    position: relative;
    text-align: center;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 2px rgba(0, 0, 0, 0.03);
    border-radius: 0;
    
    // 第一个表头：左上角圆角
    &:first-child {
      border-top-left-radius: 8px;
    }
    
    // 最后一个表头：右上角圆角
    &:last-child {
      border-top-right-radius: 8px;
    }
    
    // 添加左侧装饰线（圆角处理）
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
      border-radius: 0 4px 4px 0;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    // 第一个表头显示装饰线
    &:first-child::before {
      opacity: 1;
    }
    
    // 悬停效果（圆润处理）
    &:hover {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
      color: #334155;
      transform: translateY(-1px);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 2px 4px rgba(0, 0, 0, 0.06);
    }
  }
  
  // 美化排序图标
  th.ant-table-cell .ant-table-column-sorter {
    color: #64748b;
    
    .ant-table-column-sorter-up,
    .ant-table-column-sorter-down {
      color: rgba(100, 116, 139, 0.4);
      
      &.on {
        color: #475569;
      }
    }
  }
  
  td.ant-table-cell {
    padding: 10px 16px;
    font-size: 14px;
    color: #4a5568;
    border-bottom: 1px solid #f0f0f0;
    white-space: nowrap;
    text-align: center;
  }
  
  tbody tr:hover td {
    background-color: #f8fafc;
    transition: background-color 0.2s ease;
  }
  
  tbody tr:last-child td {
    border-bottom: none;
  }
  
  // 优化操作列的显示 - 背景与其他列一致（排除患者信息编辑列）
  .ant-table-cell.ant-table-cell-fix-right:not([data-column-key="edit_info"]) {
    background: transparent !important;
    box-shadow: none !important;
    text-align: center;
  }
  
  tbody tr:hover .ant-table-cell.ant-table-cell-fix-right:not([data-column-key="edit_info"]) {
    background-color: transparent !important;
  }
  
  // 操作列单元格内容居中
  .ant-table-cell[data-column-key="action"] {
    text-align: center;
    
    > * {
      display: inline-block;
      vertical-align: middle;
    }
  }
  
  // 患者信息编辑列背景色
  .ant-table-cell[data-column-key="edit_info"],
  .ant-table-cell.ant-table-cell-fix-right[data-column-key="edit_info"] {
    background-color: #f0f9ff !important;
  }
  
  // 患者信息编辑列表头背景色
  .ant-table-thead th.ant-table-cell[data-column-key="edit_info"],
  .ant-table-thead th.ant-table-cell.ant-table-cell-fix-right[data-column-key="edit_info"] {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #dbeafe 100%) !important;
  }
  
  // 鼠标悬停时保持背景色
  tbody tr:hover .ant-table-cell[data-column-key="edit_info"],
  tbody tr:hover .ant-table-cell.ant-table-cell-fix-right[data-column-key="edit_info"] {
    background-color: #e0f2fe !important;
  }
  
  // 操作列表头文字间距 - 选择包含"操作"文字的表头
  .ant-table-thead th.ant-table-cell:last-child,
  .ant-table-thead th.ant-table-cell.ant-table-cell-fix-right {
    letter-spacing: 0.5em;
  }
  
  // 美化操作列中的链接按钮
  .ant-table-cell .ant-btn-link {
    padding: 4px 8px;
    margin-right: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #475569;
    border-radius: 6px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, #E27244, #E29D44);
      transition: all 0.3s ease;
      transform: translateX(-50%);
    }
    
    &:hover {
      color: #E27244;
      background: rgba(226, 114, 68, 0.08);
      
      &::after {
        width: 80%;
      }
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  // 美化操作列中的小按钮（如建档按钮）
  .ant-table-cell .ant-btn-sm {
    height: 28px;
    padding: 0 12px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 6px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    
    &.ant-btn-primary {
      background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
      border: none;
      box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
      
      &:hover {
        background: linear-gradient(135deg, #389e0d 0%, #52c41a 100%);
        box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
        transform: translateY(-1px);
      }
      
      &:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(82, 196, 26, 0.3);
      }
    }
  }
}

// 操作列链接按钮样式
.action-link-btn {
  padding: 4px 10px !important;
  margin-right: 8px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #475569 !important;
  border-radius: 6px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative !important;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 50%;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #E27244, #E29D44);
    transition: all 0.3s ease;
    transform: translateX(-50%);
    border-radius: 1px;
  }
  
  &:hover {
    color: #E27244 !important;
    background: rgba(226, 114, 68, 0.08) !important;
    
    &::after {
      width: 70%;
    }
  }
  
  &:active {
    transform: scale(0.95);
  }
}

// 删除按钮样式（危险操作）
.danger-link-btn {
  color: #ff4d4f !important;
  
  &::after {
    background: linear-gradient(90deg, #ff4d4f, #ff7875) !important;
  }
  
  &:hover {
    color: #ff4d4f !important;
    background: rgba(255, 77, 79, 0.08) !important;
  }
}

// 建档按钮样式
.archive-btn {
  height: 28px !important;
  padding: 0 14px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-radius: 6px !important;
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%) !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  margin-right: 8px !important;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #389e0d 0%, #52c41a 100%) !important;
    box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4) !important;
    transform: translateY(-1px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(82, 196, 26, 0.3) !important;
  }
  
  // 禁用状态样式
  &:disabled,
  &.archive-btn-disabled {
    background: #d9d9d9 !important;
    border-color: #d9d9d9 !important;
    color: #ffffff !important;
    cursor: not-allowed !important;
    box-shadow: none !important;
    opacity: 0.6 !important;
    
    &:hover {
      background: #d9d9d9 !important;
      transform: none !important;
      box-shadow: none !important;
    }
  }
}

.action-icon {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 6px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: rgba(226, 114, 68, 0.1);
    transform: scale(1.15);
    color: #E27244;
  }
  
  &:active {
    transform: scale(1.05);
  }
}



.modal-input {
  background: #FFFFFF;
  border-radius: 8px 8px 8px 8px;
  border: 1px solid #E27244;
}

.modal-btn {
  width: 128px;
  height: 38px;
  background: linear-gradient(-90deg, #E27244 0%, #E29D44 100%);
  border-radius: 10px 10px 10px 10px;
  font-weight: 500;
  font-size: 20px;
  color: #FFFFFF;
  text-align: left;
  font-style: normal;
  text-transform: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.modal-btn:disabled {
  background: #d9d9d9 !important;
  color: #ffffff !important;
  cursor: not-allowed;
  opacity: 0.6;
}

.modal-btn:disabled:hover {
  background: #d9d9d9 !important;
  color: #ffffff !important;
  transform: none;
  box-shadow: none;
}

.modal-btn-plain {
  background: #FFFFFF;
  border-radius: 10px 10px 10px 10px;
  border: 1px solid #E27244;
  color: #E27244;
  margin-right: 32px;
}

.modal-btn-plain:hover {
  background: #FFFFFF !important;
  color: #E27244 !important;
}

:deep(.ant-table-pagination) {
  tr td {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .ant-pagination-item {
    border: 1px solid #D8D8D8;
  }

  .ant-select-selector {
    border: 1px solid #E27244;
  }

  .ant-select-arrow {
    color: #E27244;
  }

  .ant-pagination-item-active {
    background: #E27244;
    border: 1px solid #F4BB22;
  }

  .ant-pagination-item-active a {
    color: white;
  }
}

.header-icon {
  width: 34px;
  height: 34px;
}

/* 导入进度条样式 */
:deep(.ant-progress) {
  .ant-progress-bg {
    transition: all 0.3s ease;
  }
  
  .ant-progress-text {
    font-weight: 500;
    color: #1890ff;
  }
}

.import-progress-modal {
  .ant-modal-content {
    border-radius: 12px;
  }
  
  .ant-modal-header {
    border-bottom: 1px solid #f0f0f0;
    padding: 20px 24px;
  }
  
  .ant-modal-body {
    padding: 24px;
  }
}
</style>
