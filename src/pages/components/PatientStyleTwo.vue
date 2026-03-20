<template>
  <div class="style-two-root" ref="rootWrapper">
    <!-- 顶部栏：左右比例与下方记录列表/检查详情一致，左患者信息居左，右区两行按钮均居右 -->
    <div class="top-bar-unified">
      <div class="top-bar-left">
        <div class="top-bar-info-inner">
          <div class="info-row">
            <span class="info-item"><span class="info-label">姓名</span><span class="info-colon">：</span><span class="info-value">{{ patientInfo?.name || '-' }}</span></span>
            <span class="info-item"><span class="info-label">性别</span><span class="info-colon">：</span><span class="info-value">{{ formatGender(patientInfo?.gender) }}</span></span>
            <span class="info-item"><span class="info-label">出生年月</span><span class="info-colon">：</span><span class="info-value">{{ formatBirthDate(patientInfo?.birthDate) }}</span></span>
          </div>
          <div class="info-row">
            <span class="info-item"><span class="info-label">年龄</span><span class="info-colon">：</span><span class="info-value">{{ calculateAge(patientInfo?.birthDate) }}</span></span>
            <span class="info-item"><span class="info-label">患者编号</span><span class="info-colon">：</span><span class="info-value info-value-id">{{ getPatientId() }}</span></span>
            <span class="info-item"><span class="info-label">档案编号</span><span class="info-colon">：</span><span class="info-value info-value-id">{{ getArchiveId() }}</span></span>
          </div>
        </div>
      </div>
      <div class="top-bar-right">
        <div class="top-bar-actions">
          <a-button 
            v-if="selectedRecordId"
            class="action-btn-text"
            :type="activeAction === 'edit' ? 'primary' : 'default'"
            size="small"
            @click="handleEditCurrentRecord"
          >
            <template #icon><EditOutlined /></template>
            编辑
          </a-button>
          <a-button 
            v-if="selectedRecordId"
            class="action-btn-text"
            :type="activeAction === 'save' ? 'primary' : 'default'"
            size="small"
            :disabled="!editingRecordId"
            @click="handleSaveCurrentRecord"
          >
            <template #icon><SaveOutlined /></template>
            保存
          </a-button>
          <a-button class="action-btn-text" type="default" size="small" @click="handleAddRecord">
            <template #icon><PlusOutlined /></template>
            新增
          </a-button>
          <a-button 
            class="action-btn-text"
            :type="activeAction === 'refresh' ? 'primary' : 'default'"
            size="small"
            @click="handleRefresh"
          >
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
          <a-button 
            v-if="selectedRecordId"
            class="action-btn-text"
            :type="chartVisible ? 'primary' : 'default'"
            size="small"
            @click="handleOpenChart"
          >
            <template #icon><FundProjectionScreenOutlined /></template>
            图表
          </a-button>
          <a-button 
            v-if="selectedRecordId"
            class="action-btn-text"
            :type="activeAction === 'print' ? 'primary' : 'default'"
            size="small"
            @click="handlePrintExaminationReport"
          >
            <template #icon><PrinterOutlined /></template>
            打印
          </a-button>
        </div>
        <div v-if="selectedRecordId" class="top-bar-nav-buttons">
          <a-button 
            v-for="nav in visibleNavButtons" 
            :key="nav.key"
            class="top-bar-nav-btn"
            :type="activeNavButton === nav.key ? 'primary' : 'default'"
            @click="handleNavButtonClick(nav.key)"
          >
            {{ nav.title }}
          </a-button>
        </div>
      </div>
    </div>
    
    <div class="style-two-layout" ref="layoutRef">
    <aside class="style-two-side">
      <!-- 上：诊断记录（横向日期条 + 单条展示，无分页） -->
      <div class="side-panel side-panel-diagnosis">
        <div class="side-panel-title">
          <span>诊断记录</span>
          <a-button type="link" size="small" @click="openDiagnosisModal()" class="side-panel-add-btn">新增</a-button>
        </div>
        <template v-if="diagnosisRecords.length === 0">
          <div class="diagnosis-empty">暂无诊断记录</div>
        </template>
        <template v-else>
          <div class="diagnosis-date-bar">
            <div
              v-for="(item, index) in diagnosisRecords"
              :key="item.id"
              :class="['diagnosis-date-chip', { active: selectedDiagnosisDate === item.diagnosis_date }]"
              @click="selectedDiagnosisDate = item.diagnosis_date"
            >
              {{ diagnosisSequenceLabel(index) }}
            </div>
          </div>
          <div class="diagnosis-list" ref="diagnosisListRef">
            <div v-if="selectedDiagnosisRecord" class="diagnosis-entry">
              <div class="diagnosis-entry-row diagnosis-entry-date">{{ formatDate(selectedDiagnosisRecord.diagnosis_date) }}</div>
              <div class="diagnosis-entry-row diagnosis-entry-detail">{{ diagnosisDetailDisplay(selectedDiagnosisRecord.diagnosis_detail) }}</div>
              <div class="diagnosis-entry-row diagnosis-entry-remarks-line">
                备注：<span v-if="selectedDiagnosisRecord.right_eye_remark">右眼（{{ selectedDiagnosisRecord.right_eye_remark }}）</span><span v-if="selectedDiagnosisRecord.left_eye_remark">左眼（{{ selectedDiagnosisRecord.left_eye_remark }}）</span>
              </div>
              <div class="diagnosis-entry-actions">
                <a-button type="text" size="small" @click.stop="openDiagnosisModal(selectedDiagnosisRecord)" title="编辑">
                  <EditOutlined style="font-size: 12px; color: #1890ff;" />
                </a-button>
                <a-button type="text" size="small" danger @click.stop="handleDeleteDiagnosis(selectedDiagnosisRecord)" title="删除">
                  <DeleteOutlined style="font-size: 12px;" />
                </a-button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 下：检查记录列表（显示约 5 条，内部滚动） -->
      <div class="side-panel side-panel-examination">
        <div class="side-panel-title">检查记录</div>
        <div class="style-two-date-panel">
          <div class="style-two-date-list" ref="dateListRef">
            <div
              v-for="(entry, index) in dateEntries"
              :key="entry?.record?.id ?? `placeholder-${index}`"
              :data-record-id="entry?.record?.id"
              :class="['style-two-date-entry', { active: entry && entry.record.id === selectedRecordId }]"
              @click="entry && handleSelectRecord(entry.record.id)"
            >
              <template v-if="entry">
                <!-- 第一行：检查日期、眼轴对比、功能按钮 -->
                <div class="entry-row-1">
                  <span class="entry-date">{{ formatDate(entry.record.examination_date) }}</span>
                  <div class="entry-axial-comparison">
                    <span class="comp-label">上次:</span>
                    <span class="comp-value">
                      <span :class="changeClass(entry.metrics.right.deltaValue)">
                        {{ entry.metrics.right.deltaText }}
                      </span>
                      /
                      <span :class="changeClass(entry.metrics.left.deltaValue)">
                        {{ entry.metrics.left.deltaText }}
                      </span>
                    </span>
                    <span class="comp-label">初始:</span>
                    <span class="comp-value">
                      <span :class="changeClass(entry.metrics.right.initialDeltaValue)">
                        {{ entry.metrics.right.initialDeltaText }}
                      </span>
                      /
                      <span :class="changeClass(entry.metrics.left.initialDeltaValue)">
                        {{ entry.metrics.left.initialDeltaText }}
                      </span>
                    </span>
                  </div>
                  <div class="entry-actions">
                    <a-button
                      v-if="editingRecordId !== entry.record.id"
                      type="text"
                      class="entry-action-btn"
                      @click.stop.prevent="handleEditRecord(entry.record)"
                      title="编辑"
                    >
                      <EditOutlined style="font-size: 14px; color: #1890ff;" />
                    </a-button>
                    <a-button
                      v-if="editingRecordId === entry.record.id"
                      type="text"
                      class="entry-action-btn"
                      @click.stop.prevent="handleSaveRecord(entry.record)"
                      title="保存"
                    >
                      <SaveOutlined style="font-size: 14px; color: #52c41a;" />
                    </a-button>
                    <a-button
                      v-if="editingRecordId === entry.record.id"
                      type="text"
                      class="entry-action-btn"
                      @click.stop="handleCancelEdit"
                      title="取消"
                    >
                      <span style="font-size: 14px; color: #ff4d4f;">取消</span>
                    </a-button>
                    <a-button
                      v-if="editingRecordId !== entry.record.id"
                      type="text"
                      danger
                      class="entry-action-btn"
                      @click.stop="handleDeleteRecord(entry.record.id)"
                      title="删除"
                    >
                      <DeleteOutlined style="font-size: 14px;" />
                    </a-button>
                  </div>
                </div>

                <!-- 第二行：检查项目 -->
                <div class="entry-row-2">
                  <span class="row-content">{{ entry.examinationItems }}</span>
                </div>

                <!-- 第三行：诊疗方案 -->
                <div class="entry-row-3">
                  <div v-if="entry.treatmentPlanRight || entry.treatmentPlanLeft" class="treatment-plan-content">
                    <div v-if="entry.treatmentPlanRight" class="treatment-eye-item treatment-eye-right">
                      <span class="eye-label-large">右</span>
                      <span class="treatment-content" v-html="entry.treatmentPlanRight"></span>
                    </div>
                    <span v-if="entry.treatmentPlanRight && entry.treatmentPlanLeft" class="treatment-separator">/</span>
                    <div v-if="entry.treatmentPlanLeft" class="treatment-eye-item treatment-eye-left">
                      <span class="eye-label-large">左</span>
                      <span class="treatment-content" v-html="entry.treatmentPlanLeft"></span>
                    </div>
                  </div>
                  <div v-else class="treatment-empty">
                    无
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 诊断记录新增/编辑弹窗 -->
    <a-modal
      v-model:visible="diagnosisModalVisible"
      :title="editingDiagnosisId ? '编辑诊断记录' : '新增诊断记录'"
      :maskClosable="false"
      :confirmLoading="diagnosisSubmitLoading"
      @ok="submitDiagnosisForm"
      @cancel="closeDiagnosisModal"
    >
      <a-form :model="diagnosisForm" layout="vertical">
        <a-form-item label="诊断日期" required>
          <a-date-picker
            v-model:value="diagnosisForm.diagnosis_date"
            style="width: 100%"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            placeholder="请选择诊断日期"
          />
        </a-form-item>
        <a-form-item label="诊断详情" required>
          <a-textarea
            v-model:value="diagnosisForm.diagnosis_detail"
            placeholder="请输入诊断详情"
            :rows="4"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="右眼备注">
          <a-textarea
            v-model:value="diagnosisForm.right_eye_remark"
            placeholder="可选"
            :rows="2"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="左眼备注">
          <a-textarea
            v-model:value="diagnosisForm.left_eye_remark"
            placeholder="可选"
            :rows="2"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <main class="style-two-main" ref="mainScrollRef">
      <div v-if="selectedRecordId" class="style-two-content">
        <div class="style-two-pages-wrapper" ref="a4ScrollContainer">
          <div class="style-two-continuous-page" :style="a4ScaleStyle">
            <div class="style-two-page-content" ref="contentRef" :style="a4ContentScaleStyle">
              <!-- 打印模式专用：页眉仅标题 + Logo；患者基本信息放正文最先 -->
              <div v-if="viewMode === 'print'" class="print-report-header">
                <div class="print-header-top">
                  <h1 class="print-report-title">检查报告</h1>
                  <img 
                    v-if="printHeaderLogoUrl" 
                    :src="printHeaderLogoUrl" 
                    class="print-header-logo" 
                    alt="机构Logo"
                    @error="printHeaderLogoUrl = ''"
                  />
                </div>
              </div>
              <div v-if="viewMode === 'print'" class="print-report-patient">
                <div class="print-patient-row">
                  <span>姓名：{{ patientInfo?.name || '-' }}</span>
                  <span>性别：{{ patientInfo?.gender || '-' }}</span>
                  <span>出生日期：{{ formatPrintDate(patientInfo?.birth_date || patientInfo?.birthDate) }}</span>
                  <span class="print-date">检查日期：{{ formatPrintDate(currentRecord?.examination_date) }}</span>
                </div>
                <div class="print-patient-row">
                  <span>患者编号：{{ patientInfo?.patient_id ?? patientInfo?.id ?? getPrintPatientId() }}</span>
                  <span>档案编号：{{ patientInfo?.gkid ?? getPrintArchiveId() }}</span>
                  <span>下次复查日期：{{ formatPrintDate(getNextReviewDate(currentRecord)) }}</span>
                </div>
              </div>
              <!-- 第一页：医生建议/备注、诊疗方案 -->
              <div 
                v-show="!selectedNavSection || selectedNavSection === 'doctor-instructions' || selectedNavSection === 'treatment-plan'"
                class="style-two-page-section"
              >
                <PatientStyleTwoPageOne
                  :patient-info="patientInfo"
                  :current-record="viewMode === 'edit' && editingRecord ? editingRecord : currentRecord"
                  :previous-record="previousRecord"
                  :examination-records="examinationRecords"
                  :view-mode="viewMode"
                  :section-expanded="sectionExpanded"
                  :print-selected-sections="printSelectedSections"
                  :show-only-section="selectedNavSection === 'doctor-instructions' ? 'doctor-instructions' : (selectedNavSection === 'treatment-plan' ? 'treatment-plan' : null)"
                  :enable-collapse="!selectedNavSection"
                  @toggle-section="toggleSection"
                  @update-record="handleUpdateRecord"
                />
              </div>
              
              <!-- 其他页面内容 -->
              <template v-for="page in styleTwoPages" :key="page.key">
                <div 
                  v-if="viewMode === 'edit' || (viewMode !== 'view' && viewMode !== 'print') || hasPageData(page.key, currentRecord)"
                  v-show="viewMode === 'edit' || ((viewMode !== 'print' || page.sections.some(section => printSelectedSections.includes(section.key))) && (shouldShowSection(page.key) || page.sections.some(section => shouldShowSection(section.key))))"
                  class="style-two-page-section"
                >
                  <section
                    v-for="section in page.sections"
                    :key="section.key"
                    :ref="(el) => setSectionRef(section.key, el)"
                    :id="`style-two-section-${section.key}`"
                    class="style-two-section"
                    v-show="(viewMode !== 'print' || printSelectedSections.includes(section.key)) && shouldShowSection(section.key)"
                  >
                    <!-- 板块标题：在查看模式下显示标题，在报告模式（selectedNavSection为null）下不显示标题 -->
                    <!-- 结果分析始终显示标题 -->
                    <div 
                      v-if="section.key === 'analysis' || (!['routine', 'functional', 'img', 'biometry'].includes(section.key) && (viewMode === 'view' ? selectedNavSection : true))"
                      class="style-two-section-header"
                      :class="{ 'analysis-header': section.key === 'analysis' }"
                      @click="section.key === 'analysis' && toggleSection('analysis')"
                    >
                      <template v-if="section.key !== 'analysis'">
                        <ImgIcon class="section-icon" :title="section.title" />
                      </template>
                      <span class="section-title">{{ section.title }}</span>
                      <span v-if="section.key === 'analysis'" class="section-toggle-icon">
                        <UpOutlined v-if="sectionExpanded.analysis" />
                        <DownOutlined v-else />
                      </span>
                    </div>
                    <!-- 板块内容显示逻辑 -->
                    <!-- 编辑模式：直接显示 -->
                    <!-- 打印模式：根据选择显示 -->
                    <!-- 查看模式：
                         1. 如果没有选中导航按钮（selectedNavSection为null），显示所有内容（完整报告）
                         2. 如果选中了导航按钮，只显示对应的 section（通过 shouldShowSection 控制） -->
                    <div 
                      v-if="viewMode === 'edit' || 
                            (viewMode === 'print' && printSelectedSections.includes(section.key)) ||
                            (viewMode === 'view' && shouldShowSection(section.key) && (section.key !== 'analysis' || selectedNavSection === 'analysis' || sectionExpanded.analysis))"
                      v-show="section.key !== 'analysis' || selectedNavSection === 'analysis' || sectionExpanded.analysis"
                      class="style-two-section-body"
                      :style="viewMode === 'print' && printSelectedSections.includes(section.key) ? { display: 'block !important', visibility: 'visible !important', opacity: '1 !important' } : {}"
                    >
                      <component
                        :is="section.component"
                        :record="viewMode === 'edit' && editingRecord ? editingRecord : currentRecord"
                        :previous-record="previousRecord"
                        :examination-records="examinationRecords"
                        :is-dual-screen="false"
                        :patient-id="patientId"
                        :patient-info="patientInfo"
                        :view-mode="viewMode"
                        :section-expanded="sectionExpanded"
                        :show-only-section="(selectedNavSection && ['routine', 'vision', 'objective-refraction', 'subjective-refraction'].includes(selectedNavSection) && section.key === 'routine') ? selectedNavSection : ((selectedNavSection === 'functional' && section.key === 'functional') ? 'functional' : ((selectedNavSection === 'other-related' && section.key === 'functional') ? 'other-related' : ((selectedNavSection && ['img-topography', 'img-fundus', 'img-oct', 'img-other'].includes(selectedNavSection) && section.key === 'img') ? selectedNavSection : null)))"
                        :is-report-mode="viewMode === 'view' && !selectedNavSection"
                        :enable-collapse="!selectedNavSection"
                        @refresh="fetchPatientData"
                        @toggle-section="toggleSection"
                        @update-record="handleUpdateRecord"
                        @update-image="handleImageUpdate"
                        @pending-delete-images="handlePendingDeleteImages"
                        @pending-delete-old-images="handlePendingDeleteOldImages"
                      />
                    </div>
                  </section>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="style-two-empty">
        <div v-if="examinationRecords && examinationRecords.length === 0" style="text-align: center; padding: 40px;">
          <p style="font-size: 16px; color: #999; margin-bottom: 16px;">该患者暂无检查记录</p>
          <p style="font-size: 14px; color: #ccc;">请点击"新增检查"按钮创建第一条检查记录</p>
        </div>
        <div v-else style="text-align: center; padding: 40px;">
          <p style="font-size: 16px; color: #999;">请选择左侧检查记录以查看详情</p>
        </div>
      </div>
      
      <!-- 图表底部悬浮窗 -->
      <ChartModalStyleTwo
        v-if="currentChartType && chartVisible"
        :visible="chartVisible"
        :chart-type="currentChartType"
        :examination-records="examinationRecords"
        :current-record="currentRecord"
        @close="closeChart"
        @chart-type-change="handleChartTypeChange"
      />
      
      <!-- 检查报告打印预览模态框：左侧可勾选模块 + 右侧 A4 效果预览 -->
      <a-modal
          v-model:visible="examinationReportPrintVisible"
          :width="1200"
          :footer="null"
          @cancel="handleCloseExaminationReportPrint"
          :maskClosable="false"
          :keyboard="false"
          class="print-preview-modal"
      >
        <template #title>
          <div class="print-preview-modal-title">
            <div class="title-left">
              <PrinterOutlined style="margin-right: 8px;" />
              检查报告打印预览
            </div>
            <a-space>
              <a-button type="primary" @click="handleExaminationReportPrint" :disabled="printSelectedSections.length === 0">
                打印
              </a-button>
              <a-button @click="handleCloseExaminationReportPrint">关闭</a-button>
            </a-space>
          </div>
        </template>
        <div class="print-preview-modal-body">
          <!-- 左侧：该次检查可勾选打印的模块 -->
          <div class="print-preview-sidebar">
            <div class="sidebar-title">选择本次检查需打印的模块</div>
            <p class="sidebar-drag-hint">拖拽模块可调整打印顺序</p>
            <div v-if="availablePrintSections.length === 0" class="no-sections-tip">
              当前记录没有可打印的板块数据
            </div>
            <template v-else>
              <div class="sidebar-header">
                <a-checkbox
                  :checked="printSelectedSections.length === availablePrintSections.length"
                  :indeterminate="printSelectedSections.length > 0 && printSelectedSections.length < availablePrintSections.length"
                  @change="(e) => setPrintSelectedAll(e.target.checked)"
                >
                  全选（{{ availablePrintSections.length }} 个）
                </a-checkbox>
              </div>
              <a-checkbox-group v-model:value="printSelectedSections" class="sidebar-list" @change="onPrintSectionsChange">
                <div
                  v-for="(key, index) in printSidebarOrderedKeys"
                  :key="key"
                  class="sidebar-item sidebar-item-draggable"
                  draggable="true"
                  @dragstart="onPrintSectionDragStart(index)"
                  @dragover="onPrintSectionDragOver"
                  @drop="onPrintSectionDrop($event, index)"
                >
                  <span class="sidebar-order-num">{{ index + 1 }}</span>
                  <span class="sidebar-drag-handle" title="拖拽此处排序">⋮⋮</span>
                  <a-checkbox :value="key">{{ getPrintSectionTitle(key) }}</a-checkbox>
                </div>
              </a-checkbox-group>
            </template>
            <div v-if="printPreviewBlockList.length > 0" class="print-break-settings">
              <div class="print-break-settings-title">分页设置（可点击设置分页位置）</div>
              <div class="print-break-list">
                <template v-for="(block, idx) in printPreviewBlockList" :key="block.index">
                  <div class="print-break-item">
                    <span class="print-break-label">{{ block.title }}</span>
                    <a-checkbox
                      :checked="printBreakAfterBlockIndices.includes(block.index)"
                      @change="() => togglePrintBreakAfter(block.index)"
                    >
                      在此处分页
                    </a-checkbox>
                  </div>
                  <div v-if="idx < printPreviewBlockList.length - 1" class="print-break-divider" />
                </template>
              </div>
            </div>
            <div class="sidebar-footer">
              <span class="a4-hint">打印纸张：A4，智能分页（所见即所得）</span>
            </div>
          </div>
          <!-- 右侧：智能分页 A4 效果预览（与打印效果一致） -->
          <div class="print-preview-main">
            <div class="preview-label">打印效果预览（智能分页，所见即所得）</div>
            <div class="preview-scroll" ref="printPreviewScrollRef">
              <template v-if="printPreviewPageUrls.length > 0">
                <div
                  v-for="(url, index) in printPreviewPageUrls"
                  :key="index"
                  class="preview-page-block"
                >
                  <img :src="url" :alt="`第${index + 1}页`" class="preview-page-image" />
                  <div class="preview-page-caption">第 {{ index + 1 }} 页</div>
                </div>
              </template>
              <div v-else class="preview-loading">
                <a-spin size="large" tip="正在生成智能分页预览..." />
              </div>
            </div>
          </div>
        </div>
      </a-modal>

      <!-- 打印选择对话框 -->
      <a-modal
        v-model:visible="printModalVisible"
        title="选择导出PDF板块"
        :width="500"
        @ok="handleConfirmPrint"
        @cancel="handleCancelPrint"
      >
        <div class="print-section-selector">
          <div v-if="availablePrintSections.length === 0" class="no-data-tip">
            当前记录没有可导出的板块数据
          </div>
          <template v-else>
            <div class="selector-header">
              <a-checkbox
                :checked="printSelectedSections.length === availablePrintSections.length"
                :indeterminate="printSelectedSections.length > 0 && printSelectedSections.length < availablePrintSections.length"
                @change="(e) => {
                  if (e.target.checked) {
                    printSelectedSections = availablePrintSections.map(opt => opt.key);
                  } else {
                    printSelectedSections = [];
                  }
                }"
              >
                全选（{{ availablePrintSections.length }}个板块）
              </a-checkbox>
            </div>
            <div class="selector-list">
              <a-checkbox-group v-model:value="printSelectedSections" style="width: 100%;">
                <div
                  v-for="option in availablePrintSections"
                  :key="option.key"
                  class="selector-item"
                >
                  <a-checkbox :value="option.key">
                    {{ option.title }}
                  </a-checkbox>
                </div>
              </a-checkbox-group>
            </div>
          </template>
        </div>
        <template #footer>
          <a-button @click="handleCancelPrint">取消</a-button>
          <a-button type="primary" @click="handleConfirmPrint" :disabled="availablePrintSections.length === 0">确认导出</a-button>
        </template>
      </a-modal>
    </main>
    </div>
    <!-- 打印专用文档容器：独立排版，用于预览与打印（离屏渲染） -->
    <div ref="printDocRef" class="print-doc-container" aria-hidden="true"></div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import dayjs from 'dayjs';
import { message, Modal } from 'ant-design-vue';
import { initChart, axialLengthOption } from '@/utils/echarts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ImgIcon from './ImgIcon.vue';
import { DeleteOutlined, EditOutlined, SaveOutlined, UpOutlined, DownOutlined, PlusOutlined, ReloadOutlined, FundProjectionScreenOutlined, PrinterOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons-vue';
import PatientStyleTwoPageOne from './PatientStyleTwoPageOne.vue';
import ChartModalStyleTwo from './ChartModalStyleTwo.vue';
import ExaminationReportPreview from './ExaminationReportPreview.vue';
import { fetchDiagnosisList, createDiagnosis, updateDiagnosis, deleteDiagnosis } from '@/api/diagnosis';

const props = defineProps({
  pagedDates: {
    type: Array,
    default: () => []
  },
  datePage: {
    type: Number,
    default: 1
  },
  datePages: {
    type: Number,
    default: 0
  },
  selectedRecordId: {
    type: [Number, String, null],
    default: null
  },
  sortedRecords: {
    type: Array,
    default: () => []
  },
  examinationRecords: {
    type: Array,
    default: () => []
  },
  currentRecord: {
    type: Object,
    default: () => ({})
  },
  previousRecord: {
    type: Object,
    default: () => null
  },
  styleTwoSections: {
    type: Array,
    default: () => []
  },
  patientInfo: {
    type: Object,
    default: () => ({})
  },
  patientId: {
    type: [Number, String],
    default: null
  },
  isRecordFavorited: {
    type: Function,
    required: true
  },
  fetchPatientData: {
    type: Function,
    required: true
  },
});

const emit = defineEmits([
  'select-record',
  'toggle-favorite',
  'delete-record',
  'prev-page',
  'next-page',
  'open-add-modal',
  'toggle-style',
  'edit-current-record',
  'refresh-data'
]);

// 使用普通对象存 section DOM 引用，避免 ref 回调内写 reactive 触发循环重渲染
const sectionRefs = {};
const editingRecordId = ref(null); // 当前正在编辑的记录ID
const editingRecord = ref(null); // 当前正在编辑的记录数据
const a4ScrollContainer = ref(null);
const dateListRef = ref(null);
const mainScrollRef = ref(null);
const layoutRef = ref(null);
const diagnosisListRef = ref(null); // 诊断记录列表滚动容器

// 诊断记录
const diagnosisRecords = ref([]);
const diagnosisModalVisible = ref(false);
const editingDiagnosisId = ref(null); // 编辑中的诊断记录 id
const diagnosisForm = ref({
  diagnosis_date: null,
  diagnosis_detail: '',
  right_eye_remark: '',
  left_eye_remark: ''
});
const diagnosisSubmitLoading = ref(false);
// 当前选中的诊断日期，用于横向日期条切换；无分页，只展示 1 条
const selectedDiagnosisDate = ref(null);
const selectedDiagnosisRecord = computed(() => {
  const list = diagnosisRecords.value;
  if (!list.length) return null;
  const date = selectedDiagnosisDate.value;
  if (date) {
    const found = list.find(r => r.diagnosis_date === date);
    if (found) return found;
  }
  return list[0] || null;
});

// 诊断记录：将日期统一为 YYYY-MM-DD，便于比较与展示
function normalizeDiagnosisDate(val) {
  if (val == null || val === '') return null;
  const s = typeof val === 'string' ? val.trim() : String(val);
  if (!s) return null;
  try {
    return dayjs(s).format('YYYY-MM-DD');
  } catch {
    return s.slice(0, 10) || s;
  }
}

// 诊断记录：加载列表（需在 watch patientId 之前定义）
const loadDiagnosisList = async () => {
  if (props.patientId == null || props.patientId === '') return;
  try {
    const { data } = await fetchDiagnosisList(props.patientId);
    const raw = Array.isArray(data) ? data : [];
    // 标准化每条记录的 diagnosis_date 为 YYYY-MM-DD，避免后端格式不一致导致选中/展示异常
    diagnosisRecords.value = raw.map(r => ({
      ...r,
      diagnosis_date: normalizeDiagnosisDate(r.diagnosis_date) || r.diagnosis_date
    }));
    diagnosisRecords.value.sort((a, b) => new Date(b.diagnosis_date || 0) - new Date(a.diagnosis_date || 0));
    const list = diagnosisRecords.value;
    if (list.length > 0) {
      const firstDate = list[0].diagnosis_date;
      const stillExists = selectedDiagnosisDate.value && list.some(r => r.diagnosis_date === selectedDiagnosisDate.value);
      if (!stillExists) selectedDiagnosisDate.value = firstDate;
    } else {
      selectedDiagnosisDate.value = null;
    }
  } catch (e) {
    console.warn('[PatientStyleTwo] 加载诊断记录失败', e);
    diagnosisRecords.value = [];
  }
};

// 诊断记录序号标签：最早的一条为诊断一，依次诊断二、诊断三…（列表已按日期倒序，index 0 为最新）
const diagnosisSequenceLabel = (index) => {
  const list = diagnosisRecords.value;
  const n = list.length - index;
  const chars = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (n <= 0) return '诊断';
  if (n <= 10) return `诊断${chars[n]}`;
  if (n < 20) return `诊断十${chars[n - 10]}`;
  if (n < 100) return `诊断${chars[Math.floor(n / 10)]}十${chars[n % 10] || ''}`;
  return `诊断${n}`;
};

// 诊断详情列表展示：纯文本；旧版为 JSON 时显示简短提示
function diagnosisDetailDisplay(detail) {
  if (detail == null || detail === '') return '-';
  const str = String(detail).trim();
  if (!str) return '-';
  if (str.startsWith('[')) {
    try {
      const arr = JSON.parse(str);
      if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0];
        if (first && first.freeText) return first.freeText;
        if (first && first.mode === 'free') return first.freeText || '（旧版格式）';
      }
    } catch (_) {}
    return '（旧版格式，请编辑保存）';
  }
  return str;
}

// 模式管理：查看模式、编辑模式、打印排版模式
const viewMode = ref('view'); // 'view', 'edit', 'print'

// 板块展开/收起状态（按副标题划分）- 默认全收缩
const sectionExpanded = ref({
  'doctor-instructions': false,     // 医嘱 - 默认收缩
  'treatment-plan': false,          // 诊疗方案 - 默认收缩
  'routine': false,                 // 基础检查 - 默认收缩
  'vision': false,                  // 视力检查 - 默认收缩
  'objective-refraction': false,    // 电脑验光检查 - 默认收缩
  'subjective-refraction': false,   // 主观验光检查 - 默认收缩
  'functional': false,              // 视功能检查 - 默认收缩（总标题，不影响子项目）
  'eye-position': false,            // 眼位和聚散检查 - 默认收缩
  'ac-aca': false,                  // AC/A和CA/C检查 - 默认收缩
  'accommodation': false,           // 调节检查 - 默认收缩
  'other-related': false,           // 其他相关检查 - 默认收缩
  'synoptophore': false,            // 同视机检查 - 默认收缩
  'img-topography': false,          // 角膜地形图检查 - 默认收缩
  'img-fundus': false,              // 眼底照相检查 - 默认收缩
  'img-oct': false,                 // 眼底OCT检查 - 默认收缩
  'img-other': false,               // 其他检查 - 默认收缩
  'biometry': false,                // 生物测量仪检查 - 默认收缩
  'analysis': false                 // 结果分析 - 默认不展开，仅点击「查找相似案例」时加载
});

// 切换板块展开/收起状态
const toggleSection = (sectionKey) => {
  sectionExpanded.value[sectionKey] = !sectionExpanded.value[sectionKey];
};

// 系统设置 - Logo水印
const logoUrl = ref('');

// 加载系统设置
const loadSystemSettings = () => {
  try {
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.logoUrl) {
        // 确保logo URL使用HTTPS协议
        logoUrl.value = settings.logoUrl.startsWith('http://') 
          ? settings.logoUrl.replace('http://', 'https://') 
          : settings.logoUrl;
      }
    }
  } catch (error) {
    console.error('加载系统设置失败:', error);
  }
};

// A4容器缩放：内容跟随容器等比缩放
const rootWrapper = ref(null);
const a4Scale = ref(1);
const baseA4Width = ref(945); // 250mm ≈ 945px
// a4ScrollContainer 已在上面声明（第496行），无需重复声明

let lastA4ScaleWidth = 0;
const updateA4Scale = () => {
  const scrollContainer = a4ScrollContainer.value;
  if (!scrollContainer) return;

  const containerStyle = window.getComputedStyle(scrollContainer);
  const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
  const availableWidth = scrollContainer.clientWidth - paddingLeft - paddingRight;
  
  if (!availableWidth || availableWidth <= 0) return;

  // 仅当宽度变化超过 2px 时才更新，避免滚动条显隐触发的微小区间导致循环闪烁
  if (Math.abs(availableWidth - lastA4ScaleWidth) < 2) return;
  lastA4ScaleWidth = availableWidth;

  const scale = Math.max(0.5, Math.min(availableWidth / baseA4Width.value, 2.0));
  if (Math.abs(scale - a4Scale.value) < 0.01) return;
  a4Scale.value = scale;
};

// 计算内容高度，用于确定需要显示多少个水印（需在 onMounted 之前定义，避免 ReferenceError）
const contentHeight = ref(297); // 初始值297mm（一个A4高度）
const contentRef = ref(null);
let updateContentHeightTimer = null;
let lastContentHeightMm = 297;
const updateContentHeight = () => {
  if (updateContentHeightTimer) clearTimeout(updateContentHeightTimer);
  updateContentHeightTimer = setTimeout(() => {
    nextTick(() => {
      if (contentRef.value) {
        const heightPx = contentRef.value.scrollHeight;
        const heightMm = Math.max(297, (heightPx / 96) * 25.4);
        if (Math.abs(heightMm - lastContentHeightMm) < 5) return;
        lastContentHeightMm = heightMm;
        contentHeight.value = heightMm;
      }
    });
  }, 150);
};

// ResizeObserver 用于监听容器大小变化
let resizeObserver = null;

// [调试] 打印各层级容器视窗高度，用于排查滚动问题
const debugContainerHeights = () => {
  const safe = (el) => el ? { clientHeight: el.clientHeight, scrollHeight: el.scrollHeight, offsetHeight: el.offsetHeight, overflow: window.getComputedStyle(el).overflow } : null;
  const results = {
    '1.Main.main-content': safe(document.querySelector('.main-content')),
    '2.Main.main-tab-body': safe(document.querySelector('.main-tab-body')),
    '3.Main.main-tab-body-inner': safe(document.querySelector('.main-tab-body-inner')),
    '4.Main.tab-content-wrapper': safe(document.querySelector('.tab-content-wrapper')),
    '5.Patient.patient-constraint': safe(document.querySelector('.patient-constraint')),
    '6.Patient.patient-page-root': safe(document.querySelector('.patient-page-root')),
    '7.PatientStyleTwo.style-two-root': safe(document.querySelector('.style-two-root')),
    '8.PatientStyleTwo.style-two-layout': safe(document.querySelector('.style-two-layout')),
    '9.左侧.style-two-side': safe(document.querySelector('.style-two-side')),
    '10.左侧.style-two-date-list(检查记录)': safe(dateListRef.value),
    '11.右侧.style-two-main(检查详情)': safe(mainScrollRef.value),
    '12.右侧.style-two-content': safe(document.querySelector('.style-two-content')),
    viewport: { innerHeight: window.innerHeight, innerWidth: window.innerWidth }
  };
  console.table(Object.entries(results).map(([k, v]) => ({ 容器: k, clientHeight: v?.clientHeight ?? '-', scrollHeight: v?.scrollHeight ?? '-', 可滚动: v ? v.scrollHeight > v.clientHeight : false })));
  console.log('[调试] 完整数据:', results);
  return results;
};

onMounted(() => {
  console.log('[PatientStyleTwo] 风格2页面挂载，当前页:', props.datePage, '记录数量:', props.sortedRecords.length);
  loadSystemSettings();
  // 暴露调试函数到 window，在患者主页打开后可在控制台执行: window.debugPatientHeights()
  window.debugPatientHeights = debugContainerHeights;

  // 进入患者主页时确保加载诊断记录（watch 可能早于 props 就绪，尤其是异步组件）
  const pid = props.patientId;
  if (pid != null && pid !== '') {
    loadDiagnosisList();
  }

  // 初始化缩放
  nextTick(() => {
    updateA4Scale();
    updateContentHeight();
    // [调试] 延迟打印各容器高度，确认高度链是否正确
    setTimeout(() => debugContainerHeights(), 500);
    // 再次拉取诊断记录，防止首次渲染时 patientId 尚未传入
    if (props.patientId != null && props.patientId !== '' && diagnosisRecords.value.length === 0) {
      loadDiagnosisList();
    }
    // ResizeObserver：节流处理，避免与滚动条显隐形成反馈循环导致闪烁
    const scrollContainer = a4ScrollContainer.value;
    if (scrollContainer && window.ResizeObserver) {
      let roScheduled = false;
      resizeObserver = new ResizeObserver(() => {
        if (roScheduled) return;
        roScheduled = true;
        requestAnimationFrame(() => {
          roScheduled = false;
          updateA4Scale();
          updateContentHeight();
        });
      });
      resizeObserver.observe(scrollContainer);
    }
  });

  // 同时监听窗口大小变化（作为备用）
  window.addEventListener('resize', () => {
    updateA4Scale();
    updateContentHeight();
  });
  window.addEventListener('system-settings-changed', loadSystemSettings);

  // [修复] 手动处理滚轮滚动 - 患者主页内左右区域独立滚动
  const manualWheelScroll = (e) => {
    const main = mainScrollRef.value;
    const list = dateListRef.value;
    const leftCol = document.querySelector('.style-two-side');
    const target = e.target;
    let scrolled = false;
    // 右侧详情区域
    if (main && main.contains(target) && main.scrollHeight > main.clientHeight) {
      const newTop = main.scrollTop + e.deltaY;
      main.scrollTop = Math.max(0, Math.min(newTop, main.scrollHeight - main.clientHeight));
      scrolled = true;
    }
    // 左侧栏（诊断+检查记录）：滚动检查记录列表；支持鼠标在左侧任意位置时滚动
    const inLeftCol = leftCol && leftCol.contains(target);
    if (list && (list.contains(target) || inLeftCol) && list.scrollHeight > list.clientHeight) {
      const newTop = list.scrollTop + e.deltaY;
      list.scrollTop = Math.max(0, Math.min(newTop, list.scrollHeight - list.clientHeight));
      scrolled = true;
    }
    if (scrolled) e.preventDefault();
  };
  document.addEventListener('wheel', manualWheelScroll, { passive: false });
  window._debugWheelRemove = () => document.removeEventListener('wheel', manualWheelScroll);
});

watch(() => [props.currentRecord?.id, props.selectedRecordId], () => {
  nextTick(() => {
    updateContentHeight();
  });
});

onBeforeUnmount(() => {
  delete window.debugPatientHeights;
  // 清理 ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  window.removeEventListener('resize', updateA4Scale);
  window.removeEventListener('system-settings-changed', loadSystemSettings);
  // 移除滚轮调试监听
  if (typeof window._debugWheelRemove === 'function') {
    window._debugWheelRemove();
    delete window._debugWheelRemove;
  }
});

watch(() => props.selectedRecordId, (newVal) => {
  if (newVal) {
    console.log('[PatientStyleTwo] 当前选中记录ID:', newVal);
  } else {
    console.log('[PatientStyleTwo] 未选中检查记录');
  }
});

watch(() => props.patientId, (newId) => {
  if (newId != null && newId !== '') {
    loadDiagnosisList();
  } else {
    diagnosisRecords.value = [];
    selectedDiagnosisDate.value = null;
  }
}, { immediate: true });

const setSectionRef = (key, el) => {
  if (el) {
    sectionRefs[key] = el;
  } else {
    delete sectionRefs[key];
  }
};

// 内容导航按钮配置
const contentNavButtons = [
  { key: 'doctor-instructions', title: '医生建议/备注' },
  { key: 'treatment-plan', title: '诊疗方案' },
  { key: 'routine', title: '基础检查' },
  { key: 'vision', title: '视力检查' },
  { key: 'objective-refraction', title: '客观验光检查' },
  { key: 'subjective-refraction', title: '主观验光检查' },
  { key: 'biometry', title: '生物测量检查' },
  { key: 'functional', title: '视功能检查' },
  { key: 'other-related', title: '其他相关检查' },
  { key: 'img-topography', title: '角膜地形图检查' },
  { key: 'img-fundus', title: '眼底照相检查' },
  { key: 'img-oct', title: 'OCT检查' },
  { key: 'img-other', title: '其他检查' },
  { key: 'analysis', title: '结果分析' }
];

// 当前激活的导航按钮
const activeNavButton = ref(null);

// 当前选中的导航按钮（用于控制内容显示）
const selectedNavSection = ref(null);

// 根据数据过滤可见的导航按钮
const visibleNavButtons = computed(() => {
  if (!props.currentRecord) return contentNavButtons;
  
  return contentNavButtons.filter(nav => {
    // 医生建议、诊疗方案和结果分析始终显示
    if (nav.key === 'doctor-instructions' || nav.key === 'treatment-plan' || nav.key === 'analysis') {
      return true;
    }
    
    // 对于 routine 相关的按钮，检查是否有基础检查数据
    if (nav.key === 'routine') {
      return hasSectionData('routine', props.currentRecord);
    }
    
    // 对于 vision、objective-refraction、subjective-refraction，它们都在 routine 中
    // 需要检查对应的子 section 是否有数据
    if (nav.key === 'vision') {
      return hasSectionData('vision', props.currentRecord);
    }
    if (nav.key === 'objective-refraction') {
      return hasSectionData('objective-refraction', props.currentRecord);
    }
    if (nav.key === 'subjective-refraction') {
      return hasSectionData('subjective-refraction', props.currentRecord);
    }
    
    // 对于其他检查，使用 hasSectionData 判断
    return hasSectionData(nav.key, props.currentRecord);
  });
});

// 处理导航按钮点击
const handleNavButtonClick = (key) => {
  // 如果点击的是当前已选中的按钮，则取消选中（显示所有内容）
  if (selectedNavSection.value === key) {
    selectedNavSection.value = null;
    activeNavButton.value = null;
  } else {
    selectedNavSection.value = key;
    activeNavButton.value = key;
    scrollToSection(key);
  }
};

// 判断某个 section 是否应该显示
const shouldShowSection = (sectionKey) => {
  // 编辑模式下，显示所有板块，不管有没有数据
  if (viewMode.value === 'edit') {
    return true;
  }
  
  // 如果没有选中任何导航按钮，显示所有内容（但需要通过hasPageData和hasSectionData验证）
  if (!selectedNavSection.value) {
    // 结果分析始终显示（只要有检查记录）
    if (sectionKey === 'analysis') {
      return true;
    }
    // 对于复合section（routine, functional, img, biometry），需要检查对应的page是否有数据
    if (sectionKey === 'img') {
      return hasPageData('page-5', props.currentRecord);
    }
    if (sectionKey === 'routine') {
      return hasPageData('page-2', props.currentRecord);
    }
    if (sectionKey === 'functional') {
      return hasPageData('page-4', props.currentRecord);
    }
    if (sectionKey === 'biometry') {
      return hasPageData('page-3', props.currentRecord);
    }
    // 对于其他section，使用hasSectionData判断
    return hasSectionData(sectionKey, props.currentRecord);
  }
  
  // 特殊处理：routine 页面包含多个子 section
  // 如果选中的是 routine 的子 section (vision, objective-refraction, subjective-refraction)
  // 则 routine 页面应该显示，但只显示对应的子 section（通过 showOnlySection prop 控制）
  if (sectionKey === 'routine') {
    return ['routine', 'vision', 'objective-refraction', 'subjective-refraction'].includes(selectedNavSection.value);
  }
  
  // 特殊处理：functional 页面包含多个子 section
  // 如果选中的是 functional，显示所有 functional 的子 section（眼位、AC/A、调节、同视机，但不包括 other-related，因为它有单独的按钮）
  // 如果选中的是 other-related，只显示 other-related（通过 showOnlySection prop 控制）
  if (sectionKey === 'functional') {
    if (selectedNavSection.value === 'functional') {
      return true; // 显示所有 functional 内容（不包括 other-related）
    }
    return selectedNavSection.value === 'other-related';
  }
  
  // 特殊处理：img 页面包含多个子 section
  // 如果选中的是 img 的子 section (img-topography, img-fundus, img-oct, img-other)
  // 则 img 页面应该显示，但只显示对应的子 section（通过 showOnlySection prop 控制）
  if (sectionKey === 'img') {
    return ['img-topography', 'img-fundus', 'img-oct', 'img-other'].includes(selectedNavSection.value);
  }
  
  // 特殊处理：结果分析始终显示（只要有检查记录）
  if (sectionKey === 'analysis') {
    return selectedNavSection.value === 'analysis' || !selectedNavSection.value;
  }
  
  // 如果选中了某个导航按钮，只显示对应的 section
  return selectedNavSection.value === sectionKey;
};

const scrollToSection = (key) => {
  // 等待 DOM 更新
  nextTick(() => {
    // 查找实际的滚动容器
    const scrollContainer = document.querySelector('.style-two-main') || document.documentElement;
    if (!scrollContainer) {
      console.warn('[PatientStyleTwo] 滚动容器未找到');
      return;
    }
    
    // 先尝试使用 ref
    let target = sectionRefs[key];
    
    // 如果 ref 不存在，尝试通过选择器查找
    if (!target) {
      // 对于第一页的板块（医嘱、诊疗方案）
      if (key === 'doctor-instructions') {
        target = document.querySelector('.doctor-instructions-section');
      } else if (key === 'treatment-plan') {
        target = document.querySelector('.treatment-plan-section');
      } else if (key === 'analysis') {
        // 结果分析：通过 section ID 查找
        target = document.querySelector('#style-two-section-analysis');
        if (!target) {
          // 如果找不到，尝试通过类名查找
          target = document.querySelector('.analysis-exam-container');
        }
      } else {
        // 对于其他板块，尝试在子组件中查找
        const sectionMap = {
          'routine': '.routine-exam-style-two .section-block:first-child',
          'vision': '.routine-exam-style-two .section-block:nth-child(2)',
          'objective-refraction': '.routine-exam-style-two .section-block:nth-child(3)',
          'subjective-refraction': '.routine-exam-style-two .section-block:nth-child(4)',
          'functional': '.functional-exam-style-two',
          'eye-position': '.functional-exam-style-two .section-block:first-child',
          'ac-aca': '.functional-exam-style-two .section-block:nth-child(2)',
          'accommodation': '.functional-exam-style-two .section-block:nth-child(3)',
          'other-related': '.functional-exam-style-two .section-block:nth-child(4)',
          'synoptophore': '.functional-exam-style-two .section-block:nth-child(5)',
          'img-topography': '.img-exam-style-two .section-block:first-child',
          'img-fundus': '.img-exam-style-two .section-block:nth-child(2)',
          'img-oct': '.img-exam-style-two .img-oct-section, .img-exam-style-two [data-section-key="img-oct"]',
          'img-other': '.img-exam-style-two .img-other-section, .img-exam-style-two [data-section-key="img-other"]',
          'biometry': '.biometry-exam-style-two .section-block'
        };
        const selector = sectionMap[key];
        if (selector) {
          target = document.querySelector(selector);
        }
      }
    }
    
    if (target) {
      console.log('[PatientStyleTwo] 快速定位滚动到 section:', key, 'target:', target);
      
      // 使用 scrollIntoView 方法，指定滚动容器
      try {
        // 计算目标元素相对于滚动容器的位置
        const containerRect = scrollContainer.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        // 减去导航按钮栏的高度作为偏移（约60-70px）
        const scrollTop = scrollContainer.scrollTop + (targetRect.top - containerRect.top) - 70;
        
        scrollContainer.scrollTo({ 
          top: Math.max(0, scrollTop), 
          behavior: 'smooth' 
        });
      } catch (e) {
        console.warn('[PatientStyleTwo] 滚动失败:', e);
        // 备用方案：使用 scrollIntoView
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    } else {
      console.warn('[PatientStyleTwo] 无法找到目标板块:', key);
    }
  });
};

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '--';
  const num = Number(value);
  if (Number.isNaN(num)) return '--';
  return num.toFixed(2);
};

// 获取初始记录（按日期排序最旧的）
const getInitialRecord = () => {
  const sorted = props.sortedRecords || [];
  if (sorted.length === 0) return null;
  // sortedRecords 是按日期倒序排列的，所以最后一个是初始记录
  return sorted[sorted.length - 1];
};

const buildAxialMetrics = (record, previousRecord, initialRecord) => {
  const currentRight = record?.right_eye_axial_length;
  const currentLeft = record?.left_eye_axial_length;
  const previousRight = previousRecord?.right_eye_axial_length;
  const previousLeft = previousRecord?.left_eye_axial_length;
  const initialRight = initialRecord?.right_eye_axial_length;
  const initialLeft = initialRecord?.left_eye_axial_length;

  // 与上次对比
  const rightDelta = currentRight != null && previousRight != null
    ? Number(currentRight) - Number(previousRight)
    : null;
  const leftDelta = currentLeft != null && previousLeft != null
    ? Number(currentLeft) - Number(previousLeft)
    : null;

  // 与初始对比
  const rightInitialDelta = currentRight != null && initialRight != null
    ? Number(currentRight) - Number(initialRight)
    : null;
  const leftInitialDelta = currentLeft != null && initialLeft != null
    ? Number(currentLeft) - Number(initialLeft)
    : null;

  return {
    right: {
      current: formatNumber(currentRight),
      deltaValue: rightDelta,
      deltaText: formatChange(rightDelta),
      initialDeltaValue: rightInitialDelta,
      initialDeltaText: formatChange(rightInitialDelta)
    },
    left: {
      current: formatNumber(currentLeft),
      deltaValue: leftDelta,
      deltaText: formatChange(leftDelta),
      initialDeltaValue: leftInitialDelta,
      initialDeltaText: formatChange(leftInitialDelta)
    }
  };
};

// 判断基础检查字段是否有“有效值”（用于概览/是否显示：0、"0" 和空视为无值，避免空记录仍显示基础检查）
const hasMeaningfulRoutineValue = (value) => {
  if (value === null || value === undefined) return false;
  if (value === '') return false;
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length > 0 && t !== '0';
  }
  if (typeof value === 'number') return value !== 0 && !Number.isNaN(value);
  return false; // 仅数字和字符串视为有效，其余（如 boolean、object）不算有值
};

// 获取检查项目列表（严格根据实际检查内容判断，有内容则显示，无内容则不显示）
const getExaminationItems = (record) => {
  if (!record) return '无';
  
  const items = [];
  
  // 1. 基础检查（仅身高、体重、眼压；CCT 属于生物测量，不参与此处判断，避免仅有 CCT 时仍显示基础检查）
  if (hasMeaningfulRoutineValue(record.height) || hasMeaningfulRoutineValue(record.weight) ||
      hasMeaningfulRoutineValue(record.right_intraocular_pressure) || hasMeaningfulRoutineValue(record.left_intraocular_pressure)) {
    items.push('基础检查');
  }
  
  // 2. 视力检查
  if (hasFieldValue(record.right_eye_vision) || hasFieldValue(record.left_eye_vision) ||
      hasFieldValue(record.right_eye_old_vision) || hasFieldValue(record.left_eye_old_vision) ||
      hasFieldValue(record.uva_right_vision) || hasFieldValue(record.uva_left_vision) ||
      hasFieldValue(record.uva_both_vision) ||
      hasFieldValue(record.vaec_right_old_vision) || hasFieldValue(record.vaec_left_old_vision) ||
      hasFieldValue(record.vaec_both_old_vision) ||
      hasFieldValue(record.near_uva_right_vision) || hasFieldValue(record.near_uva_left_vision) ||
      hasFieldValue(record.near_uva_both_vision) ||
      hasFieldValue(record.near_subjective_right_old_vision) || hasFieldValue(record.near_subjective_left_old_vision) ||
      hasFieldValue(record.near_subjective_both_old_vision)) {
    items.push('视力检查');
  }
  
  // 3. 客观验光
  const hasObjectiveData = hasFieldValue(record.objective_right_spherical) || hasFieldValue(record.objective_left_spherical) ||
      hasFieldValue(record.objective_right_cylindrical) || hasFieldValue(record.objective_left_cylindrical) ||
      hasFieldValue(record.objective_right_axis) || hasFieldValue(record.objective_left_axis) ||
      hasFieldValue(record.retinoscopy_right_eye_spherical) || hasFieldValue(record.retinoscopy_left_eye_spherical) ||
      hasFieldValue(record.retinoscopy_right_eye_cylindrical) || hasFieldValue(record.retinoscopy_left_eye_cylindrical);
  const hasPupillaryObjectiveData = hasFieldValue(record.pupillary_objective_right_spherical) || hasFieldValue(record.pupillary_objective_left_spherical) ||
      hasFieldValue(record.pupillary_objective_right_cylindrical) || hasFieldValue(record.pupillary_objective_left_cylindrical) ||
      hasFieldValue(record.pupillary_objective_right_axis) || hasFieldValue(record.pupillary_objective_left_axis);
  if (hasObjectiveData || hasPupillaryObjectiveData) {
    items.push(hasPupillaryObjectiveData ? '客观验光（散瞳）' : '客观验光');
  }
  
  // 4. 主观验光
  const hasSubjectiveData = hasFieldValue(record.subjective_right_spherical) || hasFieldValue(record.subjective_left_spherical) ||
      hasFieldValue(record.subjective_right_cylindrical) || hasFieldValue(record.subjective_left_cylindrical) ||
      hasFieldValue(record.subjective_right_axis) || hasFieldValue(record.subjective_left_axis) ||
      hasFieldValue(record.subjective_right_old_vision) || hasFieldValue(record.subjective_left_old_vision);
  const hasPupillarySubjectiveData = hasFieldValue(record.pupillary_subjective_right_spherical) || hasFieldValue(record.pupillary_subjective_left_spherical) ||
      hasFieldValue(record.pupillary_subjective_right_cylindrical) || hasFieldValue(record.pupillary_subjective_left_cylindrical) ||
      hasFieldValue(record.pupillary_subjective_right_axis) || hasFieldValue(record.pupillary_subjective_left_axis);
  if (hasSubjectiveData || hasPupillarySubjectiveData) {
    items.push(hasPupillarySubjectiveData ? '主观验光（散瞳）' : '主观验光');
  }
  
  // 5. 视功能检查（眼位、聚散、调节）
  if (hasFieldValue(record.pli_exo_distance_lateral_phoria) || hasFieldValue(record.plo_eso_distance_lateral_phoria) ||
      hasFieldValue(record.pli_exo_near_lateral_phoria) || hasFieldValue(record.plo_eso_near_lateral_phoria) ||
      hasFieldValue(record.fusional_convergence_distance_blur) || hasFieldValue(record.fusional_convergence_near_blur) ||
      hasFieldValue(record.fusional_convergence_distance_break) || hasFieldValue(record.fusional_convergence_near_break) ||
      hasFieldValue(record.fusional_convergence_distance_recovery) || hasFieldValue(record.fusional_convergence_near_recovery) ||
      hasFieldValue(record.fusional_disvergence_distance_blur) || hasFieldValue(record.fusional_disvergence_near_blur) ||
      hasFieldValue(record.fusional_disvergence_distance_break) || hasFieldValue(record.fusional_disvergence_near_break) ||
      hasFieldValue(record.fusional_disvergence_distance_recovery) || hasFieldValue(record.fusional_disvergence_near_recovery) ||
      hasFieldValue(record.positive_relative_accommodation_blur) || hasFieldValue(record.positive_relative_accommodation_recovery) ||
      hasFieldValue(record.negative_relative_accommodation_blur) || hasFieldValue(record.negative_relative_accommodation_recovery) ||
      hasFieldValue(record.accommodative_amplitude_right) || hasFieldValue(record.accommodative_amplitude_left) ||
      hasFieldValue(record.accommodative_facility) || hasFieldValue(record.accommodative_response)) {
    items.push('视功能');
  }
  
  // 6. 其他相关检查
  if (hasFieldValue(record.worth_4_type) || hasFieldValue(record.stereopsis_testing) ||
      hasFieldValue(record.aniseikonia) || hasFieldValue(record.alternate_cover_test)) {
    items.push('其他相关检查');
  }
  
  // 7. 生物测量检查
  if (hasFieldValue(record.right_eye_axial_length) || hasFieldValue(record.left_eye_axial_length) ||
      hasFieldValue(record.right_eye_k1) || hasFieldValue(record.left_eye_k1) ||
      hasFieldValue(record.right_eye_k2) || hasFieldValue(record.left_eye_k2) ||
      hasFieldValue(record.right_anterior_chamber_depth) || hasFieldValue(record.left_anterior_chamber_depth) ||
      hasFieldValue(record.right_lens_thickness) || hasFieldValue(record.left_lens_thickness) ||
      hasFieldValue(record.right_vitreous_space_thickness) || hasFieldValue(record.left_vitreous_space_thickness) ||
      hasFieldValue(record.right_oct_fovea) || hasFieldValue(record.left_oct_fovea)) {
    items.push('生物测量');
  }
  
  // 8. 影像检查（分别显示：角膜地形图、眼底照相、OCT）
  // 角膜地形图 - 严格检查：只有当字段值是有效的图片路径时才认为有值
  const cornealTopographyFields = [
    'right_corneal_topography_first', 'left_corneal_topography_first',
    'right_corneal_topography_second', 'left_corneal_topography_second',
    'right_corneal_topography_third', 'left_corneal_topography_third',
    'doble_corneal_topography_first', 'doble_corneal_topography_second', 'doble_corneal_topography_third'
  ];
  
  const hasCornealTopographyField = cornealTopographyFields.some(field => {
    const value = record[field];
    return isValidImagePath(value);
  });
  
  // 检查images对象中是否有角膜地形图数据
  const hasCornealTopographyInImages = record.images && (
    (record.images.corneal_topography && Array.isArray(record.images.corneal_topography) && record.images.corneal_topography.length > 0) ||
    (record.images.topography && Array.isArray(record.images.topography) && record.images.topography.length > 0)
  );
  
  // 调试：对于所有记录，都记录角膜地形图字段的值（方便排查问题）
  if (record.id) {
    const topographyValues = {};
    cornealTopographyFields.forEach(field => {
      const value = record[field];
      if (value !== undefined && value !== null) {
        topographyValues[field] = {
          value: value,
          type: typeof value,
          isValid: isValidImagePath(value)
        };
      }
    });
    
    // 如果字段中有任何值，或者判断为有值，都输出调试信息
    if (Object.keys(topographyValues).length > 0 || hasCornealTopographyField || hasCornealTopographyInImages) {
      console.log(`检查记录 ${record.id} (日期: ${record.examination_date}) 角膜地形图字段检查:`, {
        fieldValues: topographyValues,
        hasField: hasCornealTopographyField,
        hasImages: hasCornealTopographyInImages,
        willShow: hasCornealTopographyField || hasCornealTopographyInImages,
        images: record.images
      });
    }
  }
  
  if (hasCornealTopographyField || hasCornealTopographyInImages) {
    items.push('角膜地形图');
  }
  
  // 眼底照相
  if (hasFieldValue(record.fundus_photo_right_path) || hasFieldValue(record.fundus_photo_left_path) ||
      hasFieldValue(record.fundus_photo_doble_path)) {
    items.push('眼底照相');
  }
  
  // OCT
  if (hasFieldValue(record.oct_photo_right_path) || hasFieldValue(record.oct_photo_left_path) ||
      hasFieldValue(record.oct_photo_doble_path) ||
      (record.images?.oct && Array.isArray(record.images.oct) && record.images.oct.length > 0)) {
    items.push('OCT');
  }
  
  // 其他检查
  if (record.images?.other && Array.isArray(record.images.other) && record.images.other.length > 0) {
    const hasOtherImages = record.images.other.some(img => img && img.url && img.url.trim() !== '');
    if (hasOtherImages) {
      items.push('其他检查');
    }
  }
  
  return items.length > 0 ? items.join('、') : '无';
};

// 格式化诊疗方案（简化版，只显示大项名称）
const formatTreatmentPlanSimple = (currentRecord, previousRecord) => {
  if (!currentRecord) return { right: '', left: '' };
  
  const formatEyeTreatment = (eye) => {
    const treatments = [];
    
    // 尝试多种可能的字段路径
    const getFieldValue = (fieldName) => {
      // 直接字段
      if (currentRecord[fieldName] !== undefined) {
        return currentRecord[fieldName];
      }
      // 嵌套在 patient 中
      if (currentRecord.patient && currentRecord.patient[fieldName] !== undefined) {
        return currentRecord.patient[fieldName];
      }
      // 嵌套在 treatment 中
      if (currentRecord.treatment && currentRecord.treatment[fieldName] !== undefined) {
        return currentRecord.treatment[fieldName];
      }
      return undefined;
    };
    
    // 阿托品：新增时只显示"阿托品"，不显示值
    const atropine = getFieldValue(`${eye}_atropine`);
    const prevAtropine = previousRecord ? (previousRecord[`${eye}_atropine`] || (previousRecord.patient && previousRecord.patient[`${eye}_atropine`]) || (previousRecord.treatment && previousRecord.treatment[`${eye}_atropine`])) : undefined;
    if (atropine && atropine !== 'none' && atropine !== '否') {
      if (!prevAtropine || prevAtropine === 'none' || prevAtropine === '否') {
        treatments.push(`<span class="treatment-new">阿托品</span>`);
      } else if (prevAtropine !== atropine) {
        treatments.push(`<span class="treatment-deleted">阿托品${prevAtropine}</span> <span class="treatment-new">阿托品</span>`);
      } else {
        treatments.push(`阿托品${atropine}`);
      }
    } else if (prevAtropine && prevAtropine !== 'none' && prevAtropine !== '否') {
      treatments.push(`<span class="treatment-deleted">阿托品${prevAtropine}</span>`);
    }
    
    // 配镜：显示大类+小类，如 离焦镜（星趣控）
    const glasses = getFieldValue(`${eye}_glasses`);
    const glassesPP = getFieldValue(`${eye}_glasses_pp`);
    const prevGlasses = previousRecord ? (previousRecord[`${eye}_glasses`] || (previousRecord.patient && previousRecord.patient[`${eye}_glasses`]) || (previousRecord.treatment && previousRecord.treatment[`${eye}_glasses`])) : undefined;
    const prevGlassesPP = previousRecord ? (previousRecord[`${eye}_glasses_pp`] || (previousRecord.patient && previousRecord.patient[`${eye}_glasses_pp`]) || (previousRecord.treatment && previousRecord.treatment[`${eye}_glasses_pp`])) : undefined;
    if (glasses && glasses !== 'none' && glasses !== '否') {
      const glassesText = glassesPP ? `${glasses}（${glassesPP}）` : glasses;
      const prevGlassesText = (prevGlassesPP ? `${prevGlasses}（${prevGlassesPP}）` : prevGlasses) || prevGlasses;
      if (!prevGlasses || prevGlasses === 'none' || prevGlasses === '否') {
        treatments.push(`<span class="treatment-new">${glassesText}</span>`);
      } else if (prevGlasses !== glasses || prevGlassesPP !== glassesPP) {
        treatments.push(`<span class="treatment-deleted">${prevGlassesText}</span> <span class="treatment-new">${glassesText}</span>`);
      } else {
        treatments.push(glassesText);
      }
    } else if (prevGlasses && prevGlasses !== 'none' && prevGlasses !== '否') {
      const prevGlassesText = prevGlassesPP ? `${prevGlasses}（${prevGlassesPP}）` : prevGlasses;
      treatments.push(`<span class="treatment-deleted">${prevGlassesText}</span>`);
    }
    
    // 低强度红光：直接显示品牌+档位，如 唯迪科(档位6)
    const hg = getFieldValue(`${eye}_hg`);
    const hgDW = getFieldValue(`${eye}_hg_dw`);
    const prevHG = previousRecord ? (previousRecord[`${eye}_hg`] || (previousRecord.patient && previousRecord.patient[`${eye}_hg`]) || (previousRecord.treatment && previousRecord.treatment[`${eye}_hg`])) : undefined;
    const prevHGDW = previousRecord ? (previousRecord[`${eye}_hg_dw`] || (previousRecord.patient && previousRecord.patient[`${eye}_hg_dw`]) || (previousRecord.treatment && previousRecord.treatment[`${eye}_hg_dw`])) : undefined;
    if (hg && hg !== 'none' && hg !== '否') {
      const hgText = (hgDW !== undefined && hgDW !== '' && hgDW !== null) ? `${hg}(档位${hgDW})` : hg;
      const prevHGText = (prevHGDW !== undefined && prevHGDW !== '' && prevHGDW !== null) ? `${prevHG}(档位${prevHGDW})` : prevHG;
      if (!prevHG || prevHG === 'none' || prevHG === '否') {
        treatments.push(`<span class="treatment-new">${hgText}</span>`);
      } else if (prevHG !== hg) {
        treatments.push(`<span class="treatment-deleted">${prevHGText}</span> <span class="treatment-new">${hgText}</span>`);
      } else if (prevHGDW !== hgDW) {
        treatments.push(`<span class="treatment-deleted">${prevHGText}</span> <span class="treatment-new">${hgText}</span>`);
      } else {
        treatments.push(hgText);
      }
    } else if (prevHG && prevHG !== 'none' && prevHG !== '否') {
      const prevHGText = (prevHGDW !== undefined && prevHGDW !== '' && prevHGDW !== null) ? `${prevHG}(档位${prevHGDW})` : prevHG;
      treatments.push(`<span class="treatment-deleted">${prevHGText}</span>`);
    }
    
    // 视觉训练：只显示"视训"（值为否或空则不显示）
    const visualTraining = getFieldValue(`${eye}_visual_training`);
    const prevVisualTraining = previousRecord ? (previousRecord[`${eye}_visual_training`] || (previousRecord.patient && previousRecord.patient[`${eye}_visual_training`]) || (previousRecord.treatment && previousRecord.treatment[`${eye}_visual_training`])) : undefined;
    if (visualTraining && visualTraining !== 'none' && visualTraining !== '否') {
      if (!prevVisualTraining || prevVisualTraining === 'none' || prevVisualTraining === '否') {
        treatments.push(`<span class="treatment-new">视训</span>`);
      } else if (prevVisualTraining !== visualTraining) {
        treatments.push(`<span class="treatment-deleted">视训</span> <span class="treatment-new">视训</span>`);
      } else {
        treatments.push('视训');
      }
    } else if (prevVisualTraining && prevVisualTraining !== 'none' && prevVisualTraining !== '否') {
      treatments.push(`<span class="treatment-deleted">视训</span>`);
    }
    
    // 理疗：只显示"理疗"（值为否或空则不显示）
    const physiotherapy = getFieldValue(`${eye}_physiotherapy`);
    const prevPhysiotherapy = previousRecord ? (previousRecord[`${eye}_physiotherapy`] || (previousRecord.patient && previousRecord.patient[`${eye}_physiotherapy`]) || (previousRecord.treatment && previousRecord.treatment[`${eye}_physiotherapy`])) : undefined;
    if (physiotherapy && physiotherapy !== 'none' && physiotherapy !== '否') {
      if (!prevPhysiotherapy || prevPhysiotherapy === 'none' || prevPhysiotherapy === '否') {
        treatments.push(`<span class="treatment-new">理疗</span>`);
      } else if (prevPhysiotherapy !== physiotherapy) {
        treatments.push(`<span class="treatment-deleted">理疗</span> <span class="treatment-new">理疗</span>`);
      } else {
        treatments.push('理疗');
      }
    } else if (prevPhysiotherapy && prevPhysiotherapy !== 'none' && prevPhysiotherapy !== '否') {
      treatments.push(`<span class="treatment-deleted">理疗</span>`);
    }
    
    return treatments.length > 0 ? treatments.join(' ') : '';
  };
  
  return {
    right: formatEyeTreatment('right'),
    left: formatEyeTreatment('left')
  };
};

// 格式化诊疗方案，识别变化（分别返回右眼和左眼）
const formatTreatmentPlan = (currentRecord, previousRecord) => {
  if (!currentRecord) return { right: '', left: '' };
  
  const formatEyeTreatment = (eye) => {
    const treatments = [];
    
    // 阿托品
    const atropine = currentRecord[`${eye}_atropine`];
    const prevAtropine = previousRecord?.[`${eye}_atropine`];
    if (atropine && atropine !== 'none' && atropine !== '否') {
      if (!prevAtropine || prevAtropine === 'none' || prevAtropine === '否') {
        treatments.push(`<span class="treatment-new">阿托品: ${atropine}</span>`);
      } else if (prevAtropine !== atropine) {
        treatments.push(`<span class="treatment-deleted">阿托品: ${prevAtropine}</span> <span class="treatment-new">阿托品: ${atropine}</span>`);
      } else {
        treatments.push(`阿托品: ${atropine}`);
      }
    } else if (prevAtropine && prevAtropine !== 'none' && prevAtropine !== '否') {
      treatments.push(`<span class="treatment-deleted">阿托品: ${prevAtropine}</span>`);
    }
    
    // 配镜
    const glasses = currentRecord[`${eye}_glasses`];
    const glassesPP = currentRecord[`${eye}_glasses_pp`];
    const prevGlasses = previousRecord?.[`${eye}_glasses`];
    const prevGlassesPP = previousRecord?.[`${eye}_glasses_pp`];
    if (glasses && glasses !== 'none' && glasses !== '否') {
      const glassesText = glassesPP ? `${glasses}(${glassesPP})` : glasses;
      const prevGlassesText = prevGlassesPP ? `${prevGlasses}(${prevGlassesPP})` : prevGlasses;
      if (!prevGlasses || prevGlasses === 'none' || prevGlasses === '否') {
        treatments.push(`<span class="treatment-new">配镜: ${glassesText}</span>`);
      } else if (prevGlasses !== glasses || prevGlassesPP !== glassesPP) {
        treatments.push(`<span class="treatment-deleted">配镜: ${prevGlassesText || prevGlasses}</span> <span class="treatment-new">配镜: ${glassesText}</span>`);
      } else {
        treatments.push(`配镜: ${glassesText}`);
      }
    } else if (prevGlasses && prevGlasses !== 'none' && prevGlasses !== '否') {
      const prevGlassesText = prevGlassesPP ? `${prevGlasses}(${prevGlassesPP})` : prevGlasses;
      treatments.push(`<span class="treatment-deleted">配镜: ${prevGlassesText}</span>`);
    }
    
    // 低强度红光
    const hg = currentRecord[`${eye}_hg`];
    const hgDW = currentRecord[`${eye}_hg_dw`];
    const prevHG = previousRecord?.[`${eye}_hg`];
    const prevHGDW = previousRecord?.[`${eye}_hg_dw`];
    if (hg && hg !== 'none' && hg !== '否') {
      if (!prevHG || prevHG === 'none' || prevHG === '否') {
        // 新增：整个用红色
        const hgText = hgDW ? `${hg}(档位${hgDW})` : hg;
        treatments.push(`<span class="treatment-new">低强度红光: ${hgText}</span>`);
      } else if (prevHG !== hg) {
        // 设备名称变更：显示删除的旧设备和新增的新设备
        const prevHGText = prevHGDW ? `${prevHG}(档位${prevHGDW})` : prevHG;
        const hgText = hgDW ? `${hg}(档位${hgDW})` : hg;
        treatments.push(`<span class="treatment-deleted">低强度红光: ${prevHGText}</span> <span class="treatment-new">低强度红光: ${hgText}</span>`);
      } else if (prevHGDW !== hgDW) {
        // 仅档位变更：黑色显示设备名，红色显示新档位，括号内显示删除的旧档位
        const baseText = `低强度红光: ${hg}`;
        const newDW = hgDW ? `<span class="treatment-new">档位${hgDW}</span>` : '';
        const oldDW = prevHGDW ? `<span class="treatment-deleted">档位${prevHGDW}</span>` : '';
        if (newDW && oldDW) {
          treatments.push(`${baseText}(${newDW}, ${oldDW})`);
        } else if (newDW) {
          treatments.push(`${baseText}(${newDW})`);
        } else {
          treatments.push(baseText);
        }
      } else {
        // 无变化：正常显示
        const hgText = hgDW ? `${hg}(档位${hgDW})` : hg;
        treatments.push(`低强度红光: ${hgText}`);
      }
    } else if (prevHG && prevHG !== 'none' && prevHG !== '否') {
      // 删除：显示删除的设备
      const prevHGText = prevHGDW ? `${prevHG}(档位${prevHGDW})` : prevHG;
      treatments.push(`<span class="treatment-deleted">低强度红光: ${prevHGText}</span>`);
    }
    
    // 理疗
    const physiotherapy = currentRecord[`${eye}_physiotherapy`];
    const prevPhysiotherapy = previousRecord?.[`${eye}_physiotherapy`];
    if (physiotherapy && physiotherapy !== 'none' && physiotherapy !== '否') {
      if (!prevPhysiotherapy || prevPhysiotherapy === 'none' || prevPhysiotherapy === '否') {
        treatments.push(`<span class="treatment-new">理疗: 是</span>`);
      } else if (prevPhysiotherapy !== physiotherapy) {
        treatments.push(`<span class="treatment-deleted">理疗: 是</span> <span class="treatment-new">理疗: 是</span>`);
      } else {
        treatments.push('理疗: 是');
      }
    } else if (prevPhysiotherapy && prevPhysiotherapy !== 'none' && prevPhysiotherapy !== '否') {
      treatments.push(`<span class="treatment-deleted">理疗: 是</span>`);
    }
    
    // 视觉训练
    const visualTraining = currentRecord[`${eye}_visual_training`];
    const prevVisualTraining = previousRecord?.[`${eye}_visual_training`];
    if (visualTraining && visualTraining !== 'none' && visualTraining !== '否') {
      const trainingMap = { '0': '斜视训练', '1': '弱视训练', '2': '近视训练' };
      const trainingText = trainingMap[visualTraining] || visualTraining;
      const prevTrainingText = prevVisualTraining ? (trainingMap[prevVisualTraining] || prevVisualTraining) : '';
      if (!prevVisualTraining || prevVisualTraining === 'none' || prevVisualTraining === '否') {
        treatments.push(`<span class="treatment-new">视觉训练: ${trainingText}</span>`);
      } else if (prevVisualTraining !== visualTraining) {
        treatments.push(`<span class="treatment-deleted">视觉训练: ${prevTrainingText}</span> <span class="treatment-new">视觉训练: ${trainingText}</span>`);
      } else {
        treatments.push(`视觉训练: ${trainingText}`);
      }
    } else if (prevVisualTraining && prevVisualTraining !== 'none' && prevVisualTraining !== '否') {
      const trainingMap = { '0': '斜视训练', '1': '弱视训练', '2': '近视训练' };
      const prevTrainingText = trainingMap[prevVisualTraining] || prevVisualTraining;
      treatments.push(`<span class="treatment-deleted">视觉训练: ${prevTrainingText}</span>`);
    }
    
    return treatments.length > 0 ? treatments.join('; ') : '';
  };
  
  return {
    right: formatEyeTreatment('right'),
    left: formatEyeTreatment('left')
  };
};

const initialRecord = computed(() => getInitialRecord());

const axialMetricsMap = computed(() => {
  const map = new Map();
  const sorted = props.sortedRecords || [];
  if (sorted.length === 0) return map;
  const initial = initialRecord.value;
  sorted.forEach((record, index) => {
    const previous = sorted[index + 1];
    map.set(record.id, buildAxialMetrics(record, previous, initial));
  });
  return map;
});

const a4ScaleStyle = computed(() => ({
  transform: `scale(${a4Scale.value})`,
  transformOrigin: 'top center'
}));

// 内容不进行反向缩放，让其跟随容器等比缩放
const a4ContentScaleStyle = computed(() => ({
  transform: 'none', // 移除反向缩放，让内容跟随容器缩放
  transformOrigin: 'top center'
}));

// 优化：缓存 sortedRecords 的索引映射，避免重复查找
const sortedRecordsIndexMap = computed(() => {
  const map = new Map();
  const sorted = props.sortedRecords || [];
  sorted.forEach((record, index) => {
    map.set(record.id, index);
  });
  return map;
});

const dateEntries = computed(() => {
  const sorted = props.sortedRecords || [];
  const indexMap = sortedRecordsIndexMap.value;
  // 现在 pagedDates 返回所有记录，不再有null占位符
  return (props.pagedDates || []).map((record, idx) => {
    if (!record) {
      return null;
    }
    const metrics = axialMetricsMap.value.get(record.id) || buildAxialMetrics(record, null, initialRecord.value);
    
    // 使用索引映射快速找到上一条记录
    const currentIndex = indexMap.get(record.id);
    const previousRecord = currentIndex != null && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;
    
    // 获取检查项目
    const examinationItems = getExaminationItems(record);
    
    // 格式化诊疗方案（简化版，只显示大项）
    const treatmentPlan = formatTreatmentPlanSimple(record, previousRecord);
    
    return {
      record,
      metrics,
      examinationItems,
      treatmentPlanRight: treatmentPlan.right,
      treatmentPlanLeft: treatmentPlan.left
    };
  }).filter(entry => entry !== null); // 过滤掉null值（兼容性处理）
});

const formatDate = (val) => {
  if (!val) return '-';
  return dayjs(val).format('YYYY-MM-DD');
};

// 打印头部用：日期与患者/档案编号
const formatPrintDate = (val) => (val ? dayjs(val).format('YYYY-MM-DD') : '-');
const getPrintPatientId = () => {
  const p = props.patientInfo;
  if (!p) return '-';
  const id = p.patient_id ?? p.id;
  if (id != null && id !== '') return String(id);
  const ids = p.identifiers;
  if (ids && ids.length > 1 && ids[1]) {
    const m = String(ids[1]).match(/\d+/);
    return m ? m[0] : '-';
  }
  return '-';
};
const getPrintArchiveId = () => {
  const gkid = props.patientInfo?.gkid;
  if (gkid) {
    const m = String(gkid).match(/\d+/);
    return m ? m[0] : '-';
  }
  return '-';
};

// 下次复查日期（打印用，与 buildPrintDocumentHtml 内逻辑一致）
const getNextReviewDate = (rec) => {
  if (!rec) return null;
  if (rec.review_date) return rec.review_date;
  const base = rec.examination_date ? dayjs(rec.examination_date) : null;
  const days = rec.review_interval_days;
  if (!base || !base.isValid()) return null;
  if (days === 1) return base.add(1, 'month').format('YYYY-MM-DD');
  if (days === 2) return base.add(2, 'month').format('YYYY-MM-DD');
  if (days === 3) return base.add(3, 'month').format('YYYY-MM-DD');
  return null;
};

// 格式化性别
const formatGender = (gender) => {
  if (!gender) return '-';
  if (gender === 'M' || gender === 'male' || gender === '男') return '男';
  if (gender === 'F' || gender === 'female' || gender === '女') return '女';
  return gender;
};

// 格式化出生年月（只显示年月）
const formatBirthDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

// 获取患者编号（从 identifiers 提取数字部分）
const getPatientId = () => {
  if (props.patientInfo?.identifiers && Array.isArray(props.patientInfo.identifiers)) {
    // 优先从 identifiers[1] 获取（患者列表中的常见位置）
    if (props.patientInfo.identifiers.length > 1) {
      const patientIdStr = props.patientInfo.identifiers[1];
      if (patientIdStr) {
        const match = patientIdStr.match(/\d+/);
        if (match) {
          return match[0];
        }
      }
    }
    
    // 如果 identifiers[1] 没有，尝试 identifiers[0]
    if (props.patientInfo.identifiers.length > 0) {
      const patientIdStr = props.patientInfo.identifiers[0];
      if (patientIdStr) {
        const match = patientIdStr.match(/\d+/);
        if (match) {
          return match[0];
        }
      }
    }
    
    // 遍历所有 identifiers 查找包含数字的项
    for (let i = 0; i < props.patientInfo.identifiers.length; i++) {
      const identifier = props.patientInfo.identifiers[i];
      if (identifier) {
        const match = identifier.match(/\d+/);
        if (match && match[0].length >= 4) { // 至少4位数字才认为是患者编号
          return match[0];
        }
      }
    }
  }
  
  return '-';
};

// 获取档案编号（从 gkid 提取数字部分）
const getArchiveId = () => {
  if (props.patientInfo?.gkid) {
    const match = props.patientInfo.gkid.match(/\d+/);
    return match ? match[0] : '-';
  }
  return '-';
};

const formatChange = (val) => {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return '—';
  }
  if (Math.abs(val) < 0.005) return '±0.00';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}`;
};

const changeClass = (val) => {
  if (val === null || val === undefined || Number.isNaN(val)) return '';
  if (val > 0.01) return 'axial-rise';
  if (val < -0.01) return 'axial-drop';
  return 'axial-flat';
};

const handlePrevPage = () => {
  console.log('[PatientStyleTwo] 点击分页上一页，当前页:', props.datePage);
  emit('prev-page');
};
const handleNextPage = () => {
  console.log('[PatientStyleTwo] 点击分页下一页，当前页:', props.datePage);
  emit('next-page');
};
const handleSelectRecord = (recordId) => {
  console.log('[PatientStyleTwo] 点击选择检查记录ID:', recordId);
  
  // 如果当前处于编辑模式，且切换到了不同的记录
  if (viewMode.value === 'edit' && editingRecordId.value !== null && editingRecordId.value !== recordId) {
    console.log('[PatientStyleTwo] 编辑模式下切换记录，取消旧记录编辑，进入新记录编辑');
    // 先取消当前记录的编辑状态
    editingRecordId.value = null;
    editingRecord.value = null;
    // 注意：不改变 viewMode，保持编辑模式
    
    // 选中新记录
    emit('select-record', recordId);
    
    // 等待记录切换后，自动进入新记录的编辑状态
    nextTick(() => {
      // 找到新记录
      const newRecord = props.examinationRecords.find(r => r.id === recordId);
      if (newRecord) {
        // 进入新记录的编辑状态
        handleEditRecord(newRecord);
      }
      // 滚动到该记录位置
      scrollToSelectedRecord(recordId);
    });
  } else {
    // 非编辑模式或选择相同记录，正常处理
    emit('select-record', recordId);
    
    // 选中记录后，滚动到该记录位置（如果不在可见区域）
    nextTick(() => {
      scrollToSelectedRecord(recordId);
    });
  }
};

// 滚动到选中的记录
const scrollToSelectedRecord = (recordId) => {
  if (!dateListRef.value || !recordId) return;
  
  // 查找对应的记录元素
  const recordElement = dateListRef.value.querySelector(`[data-record-id="${recordId}"]`);
  if (recordElement) {
    // 检查元素是否在可见区域
    const container = dateListRef.value;
    const containerRect = container.getBoundingClientRect();
    const elementRect = recordElement.getBoundingClientRect();
    
    // 如果元素不在可见区域内，滚动到该元素
    if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
      recordElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest' // 尽可能少滚动，只在必要时滚动
      });
    }
  }
};

// 监听选中记录变化，自动滚动
watch(() => props.selectedRecordId, (newId) => {
  if (newId) {
    nextTick(() => {
      scrollToSelectedRecord(newId);
    });
  }
});
const handleToggleFavorite = (record) => {
  console.log('[PatientStyleTwo] 切换收藏状态，记录ID:', record.id);
  emit('toggle-favorite', record);
};
const handleDeleteRecord = (recordId) => {
  console.log('[PatientStyleTwo] 请求删除检查记录ID:', recordId);
  emit('delete-record', recordId);
};

// 诊断记录：打开新增/编辑弹窗
const openDiagnosisModal = (record = null) => {
  if (record) {
    editingDiagnosisId.value = record.id;
    let detailText = record.diagnosis_detail != null ? String(record.diagnosis_detail) : '';
    if (detailText.startsWith('[')) {
      try {
        const arr = JSON.parse(detailText);
        if (Array.isArray(arr) && arr.length > 0 && arr[0] && arr[0].freeText) {
          detailText = arr[0].freeText;
        }
      } catch (_) {}
    }
    diagnosisForm.value = {
      diagnosis_date: record.diagnosis_date || null,
      diagnosis_detail: detailText,
      right_eye_remark: record.right_eye_remark != null ? String(record.right_eye_remark) : '',
      left_eye_remark: record.left_eye_remark != null ? String(record.left_eye_remark) : ''
    };
  } else {
    editingDiagnosisId.value = null;
    diagnosisForm.value = {
      diagnosis_date: dayjs().format('YYYY-MM-DD'),
      diagnosis_detail: '',
      right_eye_remark: '',
      left_eye_remark: ''
    };
  }
  diagnosisModalVisible.value = true;
};

const closeDiagnosisModal = () => {
  diagnosisModalVisible.value = false;
  editingDiagnosisId.value = null;
  diagnosisForm.value = { diagnosis_date: null, diagnosis_detail: '', right_eye_remark: '', left_eye_remark: '' };
};

// 诊断记录：提交表单（新增或更新）
const submitDiagnosisForm = async () => {
  const { diagnosis_date, diagnosis_detail, right_eye_remark, left_eye_remark } = diagnosisForm.value;
  if (!diagnosis_date) {
    message.warning('请选择诊断日期');
    return;
  }
  if (!String(diagnosis_detail || '').trim()) {
    message.warning('请填写诊断详情');
    return;
  }
  const payload = {
    diagnosis_date,
    diagnosis_detail: String(diagnosis_detail).trim(),
    right_eye_remark: String(right_eye_remark || '').trim(),
    left_eye_remark: String(left_eye_remark || '').trim()
  };
  diagnosisSubmitLoading.value = true;
  try {
    if (editingDiagnosisId.value) {
      await updateDiagnosis(props.patientId, editingDiagnosisId.value, payload);
      message.success('诊断记录已更新');
    } else {
      await createDiagnosis(props.patientId, payload);
      message.success('诊断记录已添加');
    }
    closeDiagnosisModal();
    await loadDiagnosisList();
  } catch (e) {
    message.error(e?.message || '操作失败');
  } finally {
    diagnosisSubmitLoading.value = false;
  }
};

// 诊断记录：删除
const handleDeleteDiagnosis = (item) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条诊断记录吗？',
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteDiagnosis(props.patientId, item.id);
        message.success('已删除');
        await loadDiagnosisList();
      } catch (e) {
        message.error(e?.message || '删除失败');
      }
    }
  });
};

// 激活状态管理
const activeAction = ref(null);

// 编辑当前选中的检查记录
const handleEditCurrentRecord = () => {
  activeAction.value = 'edit';
  if (!props.selectedRecordId) {
    message.warning('请先选择一条检查记录');
    activeAction.value = null;
    return;
  }
  emit('edit-current-record');
};

// 保存当前编辑的检查记录
const handleSaveCurrentRecord = async () => {
  if (!editingRecordId.value) {
    message.warning('没有正在编辑的记录');
    return;
  }
  
  if (!editingRecord.value) {
    message.warning('没有可保存的编辑数据');
    return;
  }
  
  activeAction.value = 'save';
  await handleSaveRecord(editingRecord.value);
};

// 新增检查记录
const handleAddRecord = () => {
  activeAction.value = 'add';
  emit('open-add-modal');
};

// 刷新数据
const handleRefresh = () => {
  activeAction.value = 'refresh';
  emit('refresh-data');
  loadDiagnosisList();
  setTimeout(() => {
    activeAction.value = null;
  }, 1000);
};


const handleEditRecord = (record) => {
  console.log('[PatientStyleTwo] 请求编辑检查记录:', record);
  console.log('[PatientStyleTwo] 当前 editingRecordId:', editingRecordId.value);
  
  // 如果已经在编辑其他记录，先取消编辑
  if (editingRecordId.value !== null && editingRecordId.value !== record.id) {
    console.log('[PatientStyleTwo] 检测到正在编辑其他记录，先取消编辑');
    handleCancelEdit();
  }
  
  editingRecordId.value = record.id;
  editingRecord.value = JSON.parse(JSON.stringify(record));
  viewMode.value = 'edit';
  // 清空预删除列表（切换记录时重置）
  pendingDeleteImageIds.value = [];
  pendingDeleteOldImages.value = [];
  console.log('[PatientStyleTwo] 编辑模式已激活, viewMode:', viewMode.value, 'editingRecordId:', editingRecordId.value);
  // 编辑模式下所有板块默认收缩
  Object.keys(sectionExpanded.value).forEach(key => {
    sectionExpanded.value[key] = false;
  });
};

const handleSaveRecord = async (record) => {
  console.log('[PatientStyleTwo] 请求保存检查记录:', record);
  console.log('[PatientStyleTwo] 当前 editingRecordId:', editingRecordId.value);
  console.log('[PatientStyleTwo] 当前 editingRecord:', editingRecord.value);
  
  // 调试：检查 editingRecord 中的垂直眼位字段
  if (editingRecord.value) {
    console.log('[PatientStyleTwo] editingRecord 中的5m垂直眼位字段:', {
      fusional_convergence_distance_vertical_direction: editingRecord.value.fusional_convergence_distance_vertical_direction,
      far_vertical_eye_direction: editingRecord.value.far_vertical_eye_direction,
      far_vertical_eye_break: editingRecord.value.far_vertical_eye_break,
      '所有包含vertical的字段': Object.keys(editingRecord.value).filter(k => k.toLowerCase().includes('vertical'))
    });
  }
  
  // 验证是否在编辑状态
  if (editingRecordId.value !== record.id) {
    console.warn('[PatientStyleTwo] 保存失败：当前编辑的记录ID不匹配', {
      editingRecordId: editingRecordId.value,
      recordId: record.id
    });
    message.error('保存失败：编辑状态不匹配');
    return;
  }
  
  if (!editingRecord.value) {
    console.warn('[PatientStyleTwo] 保存失败：没有可保存的编辑数据');
    message.error('没有可保存的编辑数据');
    return;
  }
  
  try {
    const patientId = editingRecord.value.patient_id || editingRecord.value.patient_id_id;
    if (!patientId) {
      message.error('缺少患者ID，无法保存');
      return;
    }
    
    // 构造保存数据
    const saveData = {
      ...editingRecord.value,
      id: editingRecord.value.id,
      patient_id: patientId,
      examination_date: editingRecord.value.examination_date ? dayjs(editingRecord.value.examination_date).format('YYYY-MM-DD') : null,
      review_date: editingRecord.value.review_date ? dayjs(editingRecord.value.review_date).format('YYYY-MM-DD') : null,
    };
    
    // 处理预删除的旧图片：清空对应的旧字段（设为空字符串，不是 null）
    if (pendingDeleteOldImages.value.length > 0) {
      console.log('[PatientStyleTwo] 处理预删除的旧图片:', pendingDeleteOldImages.value);
      pendingDeleteOldImages.value.forEach(oldImage => {
        if (oldImage.type === 'fundus') {
          if (oldImage.eye === 'right') {
            if (saveData.fundus_photo_right_path === oldImage.url) {
              saveData.fundus_photo_right_path = '';
            }
            if (saveData.fundus_photo_right_path_2 === oldImage.url) {
              saveData.fundus_photo_right_path_2 = '';
            }
          } else if (oldImage.eye === 'left') {
            if (saveData.fundus_photo_left_path === oldImage.url) {
              saveData.fundus_photo_left_path = '';
            }
            if (saveData.fundus_photo_left_path_2 === oldImage.url) {
              saveData.fundus_photo_left_path_2 = '';
            }
          }
        } else if (oldImage.type === 'oct') {
          if (oldImage.eye === 'right') {
            if (saveData.oct_photo_right_path === oldImage.url) {
              saveData.oct_photo_right_path = '';
            }
          } else if (oldImage.eye === 'left') {
            if (saveData.oct_photo_left_path === oldImage.url) {
              saveData.oct_photo_left_path = '';
            }
          } else if (oldImage.eye === 'doble') {
            if (saveData.oct_photo_doble_path === oldImage.url) {
              saveData.oct_photo_doble_path = '';
            }
          }
        } else if (oldImage.type === 'topo') {
          if (oldImage.eye === 'right') {
            if (oldImage.batch === 1) {
              if (saveData.right_corneal_topography_first === oldImage.url) {
                saveData.right_corneal_topography_first = '';
              }
              if (saveData.right_corneal_topography_second === oldImage.url) {
                saveData.right_corneal_topography_second = '';
              }
            } else if (oldImage.batch === 2) {
              if (saveData.right_corneal_topography_second === oldImage.url) {
                saveData.right_corneal_topography_second = '';
              }
              if (saveData.right_corneal_topography_third === oldImage.url) {
                saveData.right_corneal_topography_third = '';
              }
            } else if (oldImage.batch === 3) {
              if (saveData.right_corneal_topography_third === oldImage.url) {
                saveData.right_corneal_topography_third = '';
              }
              if (saveData.right_corneal_topography_first === oldImage.url) {
                saveData.right_corneal_topography_first = '';
              }
            }
          } else if (oldImage.eye === 'left') {
            if (oldImage.batch === 1) {
              if (saveData.left_corneal_topography_first === oldImage.url) {
                saveData.left_corneal_topography_first = '';
              }
              if (saveData.left_corneal_topography_second === oldImage.url) {
                saveData.left_corneal_topography_second = '';
              }
            } else if (oldImage.batch === 2) {
              if (saveData.left_corneal_topography_second === oldImage.url) {
                saveData.left_corneal_topography_second = '';
              }
              if (saveData.left_corneal_topography_third === oldImage.url) {
                saveData.left_corneal_topography_third = '';
              }
            } else if (oldImage.batch === 3) {
              if (saveData.left_corneal_topography_third === oldImage.url) {
                saveData.left_corneal_topography_third = '';
              }
              if (saveData.left_corneal_topography_first === oldImage.url) {
                saveData.left_corneal_topography_first = '';
              }
            }
          } else if (oldImage.eye === 'doble') {
            if (oldImage.batch === 1) {
              if (saveData.doble_corneal_topography_first === oldImage.url) {
                saveData.doble_corneal_topography_first = '';
              }
              if (saveData.doble_corneal_topography_second === oldImage.url) {
                saveData.doble_corneal_topography_second = '';
              }
            } else if (oldImage.batch === 2) {
              if (saveData.doble_corneal_topography_second === oldImage.url) {
                saveData.doble_corneal_topography_second = '';
              }
              if (saveData.doble_corneal_topography_third === oldImage.url) {
                saveData.doble_corneal_topography_third = '';
              }
            } else if (oldImage.batch === 3) {
              if (saveData.doble_corneal_topography_third === oldImage.url) {
                saveData.doble_corneal_topography_third = '';
              }
              if (saveData.doble_corneal_topography_first === oldImage.url) {
                saveData.doble_corneal_topography_first = '';
              }
            }
          }
        }
      });
    }
    
    // 清理数据：将 undefined 转换为 null，确保数据格式正确
    const cleanData = (obj) => {
      const cleaned = {};
      for (const key in obj) {
        if (obj[key] === undefined) {
          cleaned[key] = null;
        } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
          cleaned[key] = cleanData(obj[key]);
        } else {
          cleaned[key] = obj[key];
        }
      }
      return cleaned;
    };
    
    // 临时解决方案：如果后端数据库还没有添加四孔灯检查字段，可以在这里排除它们
    // 取消下面的注释来排除这些字段（临时方案，等后端添加字段后应删除）
    const fourHoleLampFields = [
      'four_hole_lamp_2m',
      'four_hole_lamp_2m_dominant',
      'four_hole_lamp_2m_horizontal',
      'four_hole_lamp_2m_vertical',
      'four_hole_lamp_40cm',
      'four_hole_lamp_40cm_dominant',
      'four_hole_lamp_40cm_horizontal',
      'four_hole_lamp_40cm_vertical',
      'four_hole_lamp_suppression',
      'four_hole_lamp_suppression_2_type',
      'four_hole_lamp_suppression_2_distance',
      'four_hole_lamp_suppression_2_direction',
      'four_hole_lamp_suppression_3_type',
      'four_hole_lamp_suppression_3_distance',
      'four_hole_lamp_suppression_3_direction',
      'four_hole_lamp_suppression_alternate_within_distance',
      'four_hole_lamp_suppression_alternate_within_eye'
    ];
    
    // 临时排除四孔灯检查字段（等后端添加字段后，将 EXCLUDE_FOUR_HOLE_LAMP_FIELDS 设置为 false）
    const EXCLUDE_FOUR_HOLE_LAMP_FIELDS = false; // 设置为 false 以包含这些字段（需要后端先添加字段）
    
    let cleanedSaveData = cleanData(saveData);
    
    // 处理四孔灯检查字段：如果存在four_hole_lamp_list数组，将第一个元素平铺提交
    if (cleanedSaveData.four_hole_lamp_list && Array.isArray(cleanedSaveData.four_hole_lamp_list) && cleanedSaveData.four_hole_lamp_list.length > 0) {
      const firstItem = cleanedSaveData.four_hole_lamp_list[0];
      
      // 四孔灯检查字段列表
      const fourHoleLampArrayFields = [
        'distance',
        'value',
        'other',
        'check_distance_2m',
        'check_distance_40cm',
        'dominant_eye_color_2m',
        'dominant_eye_color_40cm',
        'horizontal_option_2m',
        'vertical_option_2m',
        'horizontal_option_40cm',
        'vertical_option_40cm',
        'left_eye_suppression_type',
        'left_eye_suppression_distance',
        'left_eye_suppression_direction',
        'right_eye_suppression_type',
        'right_eye_suppression_distance',
        'right_eye_suppression_direction',
        'alternate_suppression_distance',
        'alternate_suppression_direction'
      ];
      
      // 将数组字段平铺到提交数据中（直接使用后端字段名）
      fourHoleLampArrayFields.forEach(field => {
        if (firstItem[field] !== undefined && firstItem[field] !== null) {
          cleanedSaveData[field] = firstItem[field];
        }
      });
      
      // 移除four_hole_lamp_list数组，因为已经平铺了
      delete cleanedSaveData.four_hole_lamp_list;
    }
    
    if (EXCLUDE_FOUR_HOLE_LAMP_FIELDS) {
      // 排除四孔灯检查字段
      const filteredData = {};
      for (const key in cleanedSaveData) {
        if (!fourHoleLampFieldsToExclude.includes(key)) {
          filteredData[key] = cleanedSaveData[key];
        }
      }
      cleanedSaveData = filteredData;
      console.warn('[PatientStyleTwo] 已临时排除四孔灯检查字段，等待后端添加字段后请将 EXCLUDE_FOUR_HOLE_LAMP_FIELDS 设置为 false');
    }
    
    // 调试：打印垂直眼位相关字段
    if (saveData.fusional_convergence_distance_vertical_direction || saveData.far_vertical_eye_direction || saveData.far_vertical_eye_break) {
      console.log('[PatientStyleTwo] 保存数据 - 5m垂直眼位字段:', {
        fusional_convergence_distance_vertical_direction: saveData.fusional_convergence_distance_vertical_direction,
        far_vertical_eye_direction: saveData.far_vertical_eye_direction,
        far_vertical_eye_break: saveData.far_vertical_eye_break
      });
    }
    
    const csrftoken = localStorage.getItem('csrftoken');
    
    // 调试：打印完整的保存数据（特别是垂直眼位字段）
    console.log('[PatientStyleTwo] 发送到服务器的完整保存数据:', JSON.stringify(cleanedSaveData, null, 2));
    if (saveData.fusional_convergence_distance_vertical_direction || saveData.far_vertical_eye_direction || saveData.far_vertical_eye_break) {
      console.log('[PatientStyleTwo] 保存数据中的5m垂直眼位字段:', {
        fusional_convergence_distance_vertical_direction: saveData.fusional_convergence_distance_vertical_direction,
        far_vertical_eye_direction: saveData.far_vertical_eye_direction,
        far_vertical_eye_break: saveData.far_vertical_eye_break
      });
    }
    
    // 直接使用后端URL
    const apiUrl = 'https://aiforoptometry.com/medicalrecords/recordsedit';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify(cleanedSaveData)
    });
    
    // 检查响应状态
    if (!response.ok) {
      // 尝试获取错误响应内容
      const errorText = await response.text();
      console.error('[PatientStyleTwo] 服务器错误响应:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`服务器错误 (${response.status}): ${response.statusText}`);
    }
    
    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const errorText = await response.text();
      console.error('[PatientStyleTwo] 服务器返回非JSON响应:', errorText);
      throw new Error('服务器返回了非JSON格式的响应');
    }
    
    const result = await response.json();
    console.log('[PatientStyleTwo] 服务器返回的保存结果:', result);
    
    if (result.status_code === 200 || result.code === 200) {
      // 如果有预删除的图片，执行删除操作
      if (pendingDeleteImageIds.value.length > 0) {
        console.log('[PatientStyleTwo] 开始删除预删除的图片:', pendingDeleteImageIds.value);
        try {
          const csrftoken = localStorage.getItem('csrftoken');
          // 批量删除图片
          const deletePromises = pendingDeleteImageIds.value.map(imageId => 
            fetch('https://aiforoptometry.com/api/exam/image/delete_by_id/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken || ''
              },
              body: JSON.stringify({ image_id: imageId }),
              credentials: 'include'
            })
          );
          
          const deleteResults = await Promise.all(deletePromises);
          
          // 检查每个删除请求的结果
          const deleteDetails = await Promise.all(
            deleteResults.map(async (response, index) => {
              const imageId = pendingDeleteImageIds.value[index];
              if (response.ok) {
                try {
                  const result = await response.json();
                  const isSuccess = result.code === 200 || result.success === true || result.status === 'success';
                  return { imageId, success: isSuccess, message: result.message || '删除成功' };
                } catch (e) {
                  // 如果响应不是JSON，但状态码是200，认为成功
                  return { imageId, success: true, message: '删除成功' };
                }
              } else {
                const errorText = await response.text().catch(() => '未知错误');
                return { imageId, success: false, message: `删除失败: ${errorText}` };
              }
            })
          );
          
          const deleteSuccessCount = deleteDetails.filter(d => d.success).length;
          const deleteFailedCount = deleteDetails.filter(d => !d.success).length;
          
          console.log('[PatientStyleTwo] 图片删除结果:', {
            total: pendingDeleteImageIds.value.length,
            success: deleteSuccessCount,
            failed: deleteFailedCount,
            details: deleteDetails
          });
          
          if (deleteFailedCount > 0) {
            console.warn('[PatientStyleTwo] 部分图片删除失败:', deleteDetails.filter(d => !d.success));
            message.warning(`成功删除 ${deleteSuccessCount} 张图片，${deleteFailedCount} 张删除失败`);
          } else if (deleteSuccessCount > 0) {
            message.success(`成功删除 ${deleteSuccessCount} 张图片`);
          }
          
          // 清空预删除列表
          pendingDeleteImageIds.value = [];
          pendingDeleteOldImages.value = [];
        } catch (deleteError) {
          console.error('[PatientStyleTwo] 删除图片失败:', deleteError);
          // 即使删除失败，也继续执行保存成功的逻辑
        }
      }
      
      message.success('保存成功');
      
      // 同步 sessionStorage
      try {
        const storageKey = `patient_${patientId}`;
        const savedData = sessionStorage.getItem(storageKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.currentData && parsed.currentData.id === saveData.id) {
            parsed.currentData = { ...parsed.currentData, ...saveData };
          }
          if (parsed.allData && Array.isArray(parsed.allData)) {
            const idx = parsed.allData.findIndex(item => item.id === saveData.id);
            if (idx !== -1) {
              parsed.allData[idx] = { ...parsed.allData[idx], ...saveData };
            }
          }
          if (parsed.examinationRecords && Array.isArray(parsed.examinationRecords)) {
            const idx = parsed.examinationRecords.findIndex(item => item.id === saveData.id);
            if (idx !== -1) {
              parsed.examinationRecords[idx] = { ...parsed.examinationRecords[idx], ...saveData };
            }
          }
          sessionStorage.setItem(storageKey, JSON.stringify(parsed));
        }
      } catch (e) {
        console.error('同步 sessionStorage 失败:', e);
      }
      
      // 先重置编辑状态，避免组件渲染错误
      editingRecordId.value = null;
      editingRecord.value = null;
      viewMode.value = 'view';
      activeAction.value = null; // 重置按钮激活状态，使编辑按钮颜色回到原状态
      // 保存后所有板块收缩
      Object.keys(sectionExpanded.value).forEach(key => {
        sectionExpanded.value[key] = false;
      });
      
      // 延迟刷新数据，确保组件状态已更新
      await nextTick();
      setTimeout(() => {
        try {
          props.fetchPatientData?.();
        } catch (error) {
          console.error('刷新数据失败:', error);
        }
      }, 100);
    } else {
      message.error('保存失败: ' + (result.msg || result.message || '未知错误'));
    }
  } catch (error) {
    console.error('保存出错:', error);
    message.error('保存失败: ' + (error.message || '网络错误'));
  }
};

const handleUpdateRecord = (updatedFields) => {
  console.log('[PatientStyleTwo] 接收到子组件更新请求:', updatedFields);
  if (viewMode.value === 'edit' && editingRecord.value) {
    const patch = { ...updatedFields };
    for (const key of ['right_eye_axial_length', 'left_eye_axial_length']) {
      if (!(key in patch)) continue;
      const v = patch[key];
      if (v === null || v === undefined || v === '') continue;
      const n = Number(v);
      if (!Number.isNaN(n) && n < 0) patch[key] = null;
    }
    // 调试：打印垂直眼位相关字段
    if (patch.fusional_convergence_distance_vertical_direction || patch.far_vertical_eye_direction || patch.far_vertical_eye_break) {
      console.log('[PatientStyleTwo] 合并更新 - 5m垂直眼位字段:', {
        fusional_convergence_distance_vertical_direction: patch.fusional_convergence_distance_vertical_direction,
        far_vertical_eye_direction: patch.far_vertical_eye_direction,
        far_vertical_eye_break: patch.far_vertical_eye_break
      });
    }
    // 合并更新到 editingRecord
    Object.assign(editingRecord.value, patch);
    // 调试：打印合并后的数据
    if (editingRecord.value.fusional_convergence_distance_vertical_direction || editingRecord.value.far_vertical_eye_direction || editingRecord.value.far_vertical_eye_break) {
      console.log('[PatientStyleTwo] 合并后 - 5m垂直眼位字段:', {
        fusional_convergence_distance_vertical_direction: editingRecord.value.fusional_convergence_distance_vertical_direction,
        far_vertical_eye_direction: editingRecord.value.far_vertical_eye_direction,
        far_vertical_eye_break: editingRecord.value.far_vertical_eye_break
      });
    }
  }
};

const handleCancelEdit = () => {
  console.log('[PatientStyleTwo] 取消编辑');
  editingRecordId.value = null;
  editingRecord.value = null;
  viewMode.value = 'view';
  activeAction.value = null; // 清除按钮激活状态
  // 清空预删除列表
  pendingDeleteImageIds.value = [];
  pendingDeleteOldImages.value = [];
  // 取消编辑时所有板块收缩
  Object.keys(sectionExpanded.value).forEach(key => {
    sectionExpanded.value[key] = false;
  });
  // 刷新数据以恢复原始值
  props.fetchPatientData?.();
};

// 打印相关
const printModalVisible = ref(false);
const printSelectedSections = ref([]);
// 打印预览左侧模块显示顺序（可拖拽排序），与右侧报告顺序一致
const printSectionOrder = ref([]);
const printDragFromIndex = ref(-1);

// 所有可打印的板块配置（不含影像检查，影像不参与打印）
// 结果分析暂不提供打印，若需恢复请加回: { key: 'analysis', title: '结果分析' }
const printSectionOptions = [
  { key: 'doctor-instructions', title: '医生建议/备注' },
  { key: 'treatment-plan', title: '诊疗方案' },
  { key: 'routine', title: '基础检查' },
  { key: 'vision', title: '视力检查' },
  { key: 'objective-refraction', title: '客观验光' },
  { key: 'subjective-refraction', title: '主观验光' },
  { key: 'functional', title: '视功能检查' },
  { key: 'biometry', title: '生物测量仪检查' }
];

// 打开PDF导出选择对话框
const handlePrintReport = () => {
  console.log('[PatientStyleTwo] 触发导出PDF');
  if (!props.currentRecord) {
    message.warning('请先选择一条检查记录');
    return;
  }
  // 默认全选所有有数据的板块
  printSelectedSections.value = availablePrintSections.value.map(opt => opt.key);
  printModalVisible.value = true;
};

// 确认导出PDF
const handleConfirmPrint = async () => {
  if (printSelectedSections.value.length === 0) {
    message.warning('请至少选择一个要导出的板块');
    return;
  }
  
  printModalVisible.value = false;
  
  // 设置打印模式，根据选择的板块控制显示
  const originalViewMode = viewMode.value;
  const originalSectionExpanded = JSON.parse(JSON.stringify(sectionExpanded.value));
  
  // 进入打印模式：展开所有选中的板块，隐藏未选中的板块
  viewMode.value = 'print';
  // 确保所有选中的板块都展开，并且所有板块都设置为展开状态（避免子组件内部隐藏）
  printSelectedSections.value.forEach(key => {
    sectionExpanded.value[key] = true;
  });
  // 同时确保所有可能的板块都展开（避免遗漏）
  Object.keys(sectionExpanded.value).forEach(key => {
    if (printSelectedSections.value.includes(key)) {
      sectionExpanded.value[key] = true;
    }
  });
  
  // 等待DOM更新和所有资源加载完成
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 获取A4容器元素（这是实际的A4区域）
  const a4Container = document.querySelector('.style-two-continuous-page');
  const printContent = contentRef.value;
  
  if (!a4Container || !printContent) {
    message.error('无法获取A4区域内容');
    viewMode.value = originalViewMode;
    sectionExpanded.value = originalSectionExpanded;
    return;
  }
  
  // 等待所有图片加载完成
  const images = printContent.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
      setTimeout(resolve, 5000);
    });
  });
  await Promise.all(imagePromises);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    message.loading('正在生成PDF...', 0);
    
    const SCALE = 2; // 2倍缩放确保清晰度
    
    // 保存原始滚动位置
    const originalScrollTop = a4ScrollContainer.value?.scrollTop || 0;
    a4ScrollContainer.value.scrollTop = 0;
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('[PatientStyleTwo] 开始捕获完整内容...');
    
    // ✅ 1. 用 HTML2Canvas 截图整个长页面
    let canvas = null;
    try {
      canvas = await html2canvas(a4Container, {
        scale: SCALE,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        // ❌ 不要指定 width / height / windowWidth / windowHeight
        foreignObjectRendering: false,
        removeContainer: false,
        imageTimeout: 30000,
        ignoreElements: (element) => {
          // 忽略图表按钮栏
          return element.classList && element.classList.contains('chart-buttons-bar-sticky');
        },
        onclone: (clonedDoc, element) => {
          // 复制所有样式表
          const originalStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
          originalStyles.forEach((style) => {
            if (style.tagName === 'STYLE') {
              const clonedStyle = clonedDoc.createElement('style');
              let styleText = style.textContent || style.innerHTML;
              styleText = styleText.replace(/\[data-v-[a-z0-9]+\]/g, '');
              clonedStyle.textContent = styleText;
              clonedDoc.head.appendChild(clonedStyle);
            } else if (style.tagName === 'LINK' && style.rel === 'stylesheet') {
              const clonedLink = clonedDoc.createElement('link');
              clonedLink.rel = 'stylesheet';
              clonedLink.href = style.href;
              clonedDoc.head.appendChild(clonedLink);
            }
          });
          
          // 移除data-v属性
          clonedDoc.querySelectorAll('*').forEach((el) => {
            Array.from(el.attributes).forEach(attr => {
              if (attr.name.startsWith('data-v-')) {
                el.removeAttribute(attr.name);
              }
            });
          });
          
          // 隐藏图表按钮栏
          const chartButtonsBar = clonedDoc.querySelector('.chart-buttons-bar-sticky');
          if (chartButtonsBar) {
            chartButtonsBar.style.cssText = 'display: none !important;';
          }
        }
      });
      
      console.log('[PatientStyleTwo] 完整内容捕获成功，canvas尺寸:', canvas.width / SCALE, '×', canvas.height / SCALE, 'px');
    } catch (error) {
      console.error('[PatientStyleTwo] 捕获完整内容失败:', error);
      message.destroy();
      message.error('生成PDF图片失败: ' + error.message);
      a4ScrollContainer.value.scrollTop = originalScrollTop;
      viewMode.value = originalViewMode;
      sectionExpanded.value = originalSectionExpanded;
      return;
    }
    
    // ✅ 2. 自动裁剪空白（可选，但建议保留以确保PDF质量）
    const cropped = await autoCropCanvas(canvas);
    const imgData = cropped.toDataURL('image/png');
    
    // ✅ 3. PDF 尺寸：A4 = 595 × 842 pt（使用pt单位更精确）
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = 595;  // A4宽度（pt）
    const pdfHeight = 842; // A4高度（pt）
    
    // 让内容按宽度等比缩放
    const imgWidth = pdfWidth;
    const imgHeight = (cropped.height / cropped.width) * pdfWidth;
    
    console.log('[PatientStyleTwo] 图片尺寸（PDF中）:', imgWidth, '×', imgHeight, 'pt');
    
    // ✅ 4. 自动分页：使用位置参数实现分页
    let position = 0;
    let remainingHeight = imgHeight;
    let pageIndex = 0;
    
    while (remainingHeight > 0) {
      pdf.addImage(
        imgData,
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      
      remainingHeight -= pdfHeight;
      position -= pdfHeight;
      
      if (remainingHeight > 0) {
        pdf.addPage();
        pageIndex++;
        console.log(`[PatientStyleTwo] 第 ${pageIndex + 1} 页已添加，剩余高度: ${remainingHeight.toFixed(2)}pt`);
      }
    }
    
    // 恢复滚动位置
    a4ScrollContainer.value.scrollTop = originalScrollTop;
    
    message.destroy();
    
    // ✅ 5. 设置PDF元数据并添加页码
    const patientName = props.patientInfo?.name || '患者';
    const examDate = props.currentRecord?.examination_date 
      ? dayjs(props.currentRecord.examination_date).format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD');
    const totalPages = pdf.internal.pages.length - 1; // jsPDF的页数（减去封面页）
    
    pdf.setProperties({
      title: `${patientName}_${examDate}_检查报告`,
      subject: '眼科检查报告',
      author: '眼科检查系统',
      creator: '眼科检查系统'
    });
    
    // 为每一页添加页码（使用pt单位）
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      const pageText = `第 ${i} 页 / 共 ${totalPages} 页`;
      const textWidth = pdf.getTextWidth(pageText);
      const x = (pdfWidth - textWidth) / 2; // 居中
      const y = pdfHeight - 20; // 距离底部20pt
      pdf.text(pageText, x, y);
    }
    
    // 生成文件名并保存
    const fileName = `${patientName}_${examDate}_检查报告.pdf`;
    pdf.save(fileName);
    
    // 恢复原始状态
    viewMode.value = originalViewMode;
    sectionExpanded.value = originalSectionExpanded;
    
    message.success(`PDF已保存：${fileName}`);
  } catch (error) {
    message.destroy();
    console.error('[PatientStyleTwo] 导出PDF失败:', error);
    message.error('导出PDF失败: ' + error.message);
    viewMode.value = originalViewMode;
    sectionExpanded.value = originalSectionExpanded;
  }
};

// 自动裁剪空白函数（可选，但建议保留以确保PDF质量）
const autoCropCanvas = async (canvas) => {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height).data;
  
  let top = null, bottom = null;
  
  // 找上下非空白区域
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (imageData[index + 3] > 0) { // alpha > 0
        top = y;
        break;
      }
    }
    if (top !== null) break;
  }
  
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (imageData[index + 3] > 0) {
        bottom = y;
        break;
      }
    }
    if (bottom !== null) break;
  }
  
  // 如果没有找到非空白区域，返回原canvas
  if (top === null || bottom === null) {
    return canvas;
  }
  
  // 创建裁剪后 canvas
  const cropHeight = bottom - top + 1;
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = width;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext('2d');
  
  croppedCtx.drawImage(canvas, 0, -top);
  
  console.log('[PatientStyleTwo] 裁剪空白后尺寸:', width / 2, '×', cropHeight / 2, 'px');
  
  return croppedCanvas;
};

// 取消导出PDF
const handleCancelPrint = () => {
  printModalVisible.value = false;
};

const handleToggleStyle = () => {
  console.log('[PatientStyleTwo] 请求切换显示风格');
  emit('toggle-style');
};

const handleAddExamination = () => {
  console.log('[PatientStyleTwo] 请求新增检查');
  emit('open-add-modal');
};

const handleRefreshData = () => {
  console.log('[PatientStyleTwo] 手动刷新数据');
  props.fetchPatientData?.();
};

// 预删除的图片ID列表
const pendingDeleteImageIds = ref([]);
// 预删除的旧图片列表（没有ID的旧数据图片）
const pendingDeleteOldImages = ref([]);

// 处理预删除图片事件
const handlePendingDeleteImages = (imageIds) => {
  console.log('[PatientStyleTwo] 收到预删除图片ID列表:', imageIds);
  pendingDeleteImageIds.value = imageIds;
};

// 处理预删除旧图片事件
const handlePendingDeleteOldImages = (oldImages) => {
  console.log('[PatientStyleTwo] 收到预删除旧图片列表:', oldImages);
  pendingDeleteOldImages.value = oldImages;
};

// 处理图片更新事件（上传或删除图片后刷新数据）
const handleImageUpdate = (eventData) => {
  console.log('[PatientStyleTwo] 收到图片更新事件:', eventData);
  // 图片上传或删除后，刷新数据以获取最新状态
  // 注意：预删除不会触发数据刷新，只在保存时真正删除
  if (eventData.deleted === true) {
    props.fetchPatientData?.();
  }
};

const calculateAge = (birthDate) => {
  if (!birthDate) return '-';
  try {
    const now = dayjs();
    const birthday = dayjs(birthDate);
    if (!birthday.isValid()) return '-';
    const age = now.diff(birthday, 'year');
    return age + '岁';
  } catch (error) {
    return '-';
  }
};

const pageLayoutConfig = [
  { key: 'page-2', sections: ['routine'] },
  { key: 'page-3', sections: ['biometry'] },
  { key: 'page-4', sections: ['functional'] },
  { key: 'page-5', sections: ['img'] },
  { key: 'page-6', sections: ['analysis'] }
];

const styleTwoSectionList = computed(() => props.styleTwoSections || []);

// 暴露方法给父组件调用
defineExpose({
  handleEditRecord,
  handleCancelEdit,
  get isEditing() {
    return viewMode.value === 'edit';
  },
  get editingRecordId() {
    return editingRecordId.value;
  },
  viewMode,
  editingRecordId: editingRecordId,
  clearActiveAction: () => {
    activeAction.value = null;
  }
});


// 图表相关
const currentChartType = ref('axial'); // 默认显示眼轴图
const chartVisible = ref(false);

const handleOpenChart = () => {
  console.log('[PatientStyleTwo] handleOpenChart 被调用');
  if (!currentChartType.value) {
    currentChartType.value = 'axial'; // 默认显示眼轴图
  }
  chartVisible.value = true;
  console.log('[PatientStyleTwo] currentChartType:', currentChartType.value, 'chartVisible:', chartVisible.value);
};

const closeChart = () => {
  chartVisible.value = false;
  activeAction.value = null;
};

const handleChartTypeChange = (chartType) => {
  currentChartType.value = chartType;
};

// 检查报告打印相关
const examinationReportPrintVisible = ref(false);
const examinationReportPreviewRef = ref(null);
const reportLogoUrl = ref(localStorage.getItem('organization_logo') || localStorage.getItem('cached_logo_base64') || '');
const reportOrgName = ref(localStorage.getItem('organization_name') || '');
// 打印头部 Logo（进入打印模式时设置，供主内容区打印头使用）
const printHeaderLogoUrl = ref('');

// 准备检查数据（使用 ref 而不是 computed，在打开模态框时手动设置）
const preparedExaminationData = ref({});

// 打印预览：智能分页后的每页图片（与打印效果一致）
const printPreviewPageUrls = ref([]);
const printPreviewScrollRef = ref(null);
const printPreviewModalViewModeBackup = ref('view');
const printPreviewSectionExpandedBackup = ref({});
// 用户手动设置“在此处分页”的块下标（0=第1个块后），与预览/打印共用
const printBreakAfterBlockIndices = ref([]);
// 当前打印文档的块列表（标题），在生成预览时填充，用于分页设置 UI
const printPreviewBlockList = ref([]);

// 克隆文档中替换跨域图片为占位图，避免 html2canvas 触发 CORS 报错
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect fill="#f5f5f5" width="120" height="80"/><text x="60" y="45" text-anchor="middle" fill="#bfbfbf" font-size="12" font-family="sans-serif">图片</text></svg>'
);
const replaceCrossOriginImagesWithPlaceholder = (rootEl) => {
  if (!rootEl || !rootEl.querySelectorAll) return;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  rootEl.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || img.src || '';
    if (!src || src.startsWith('data:')) return;
    try {
      const url = new URL(src, origin);
      if (url.origin !== origin) {
        img.setAttribute('src', PLACEHOLDER_IMAGE);
        img.removeAttribute('crossorigin');
      }
    } catch (_) {
      img.setAttribute('src', PLACEHOLDER_IMAGE);
    }
  });
};

// 勾选变化时同步展开状态，保证预览内容正确
const syncSectionExpandedFromPrintSelected = () => {
  nextTick(() => {
    Object.keys(sectionExpanded.value).forEach(key => {
      sectionExpanded.value[key] = printSelectedSections.value.includes(key);
    });
  });
};

// 全选/取消全选打印模块
const setPrintSelectedAll = (checked) => {
  if (checked) {
    printSelectedSections.value = availablePrintSections.value.map(opt => opt.key);
  } else {
    printSelectedSections.value = [];
  }
  syncSectionExpandedFromPrintSelected();
  refreshPrintPreviewImage();
};

// 打印模块勾选变化：同步展开并刷新预览图（切换模块后清空用户分页设置，避免块下标错位）
const onPrintSectionsChange = () => {
  printBreakAfterBlockIndices.value = [];
  syncSectionExpandedFromPrintSelected();
  refreshPrintPreviewImage();
};

// 切换“在此块结束后分页”：用户可点击设置分页位置，避免突兀拆分
const togglePrintBreakAfter = (blockIndex) => {
  const arr = printBreakAfterBlockIndices.value;
  if (arr.includes(blockIndex)) {
    printBreakAfterBlockIndices.value = arr.filter(i => i !== blockIndex);
  } else {
    printBreakAfterBlockIndices.value = [...arr, blockIndex].sort((a, b) => a - b);
  }
  refreshPrintPreviewImage();
};

// 生成打印预览：使用打印专用文档（独立排版）+ 智能分页
const PREVIEW_SCALE = 1.5;
const refreshPrintPreviewImage = async () => {
  if (!examinationReportPrintVisible.value) return;
  printPreviewPageUrls.value = [];
  await nextTick();
  const record = props.currentRecord;
  const patientInfo = props.patientInfo;
  const selected = printSelectedSections.value;
  const order = printSectionOrder.value;
  const orderedSections = [...selected].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  if (!record || !orderedSections.length) return;
  const container = printDocRef.value;
  if (!container) return;
  container.innerHTML = buildPrintDocumentHtml(record, patientInfo, orderedSections, printHeaderLogoUrl.value);
  await nextTick();
  await new Promise(r => setTimeout(r, 300));
  if (orderedSections.includes('analysis') && props.examinationRecords?.length) {
    await initPrintAnalysisChart(container, props.examinationRecords);
  }
  const headerEl = container.querySelector('.print-doc-header');
  const patientEl = container.querySelector('.print-doc-patient');
  const bodyEl = container.querySelector('.print-doc-body');
  const headerHeightPx = headerEl ? headerEl.offsetHeight : 0;
  const patientHeightPx = patientEl ? patientEl.offsetHeight : 0;
  const bodyStartY = headerHeightPx + patientHeightPx;
  const bodyHeightPx = bodyEl ? Math.max(0, bodyEl.scrollHeight) : 0;
  const blockEls = container.querySelectorAll('.print-doc-section');
  printPreviewBlockList.value = Array.from(blockEls).map((el, i) => ({
    index: i,
    title: el.querySelector('.print-doc-section-title')?.textContent?.trim() || `模块${i + 1}`
  }));
  const images = container.querySelectorAll('img');
  await Promise.all(Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; setTimeout(resolve, 2000); });
  }));
  await new Promise(r => setTimeout(r, 150));
  // 页眉 logo 与 wrap 同时按宽高比设尺寸，避免 80×48 盒子导致 html2canvas 截出拉伸图
  const logoImg = container.querySelector('.print-doc-logo');
  if (logoImg && logoImg instanceof HTMLImageElement && logoImg.naturalWidth && logoImg.naturalHeight) {
    const nw = logoImg.naturalWidth;
    const nh = logoImg.naturalHeight;
    const maxW = 72;
    const maxH = 40;
    let w = maxW;
    let h = maxH;
    if (nw / nh > maxW / maxH) {
      h = Math.max(1, Math.round(maxW * nh / nw));
    } else {
      w = Math.max(1, Math.round(maxH * nw / nh));
    }
    logoImg.style.width = w + 'px';
    logoImg.style.height = h + 'px';
    logoImg.style.maxWidth = w + 'px';
    logoImg.style.maxHeight = h + 'px';
    const wrap = logoImg.closest('.print-doc-logo-wrap');
    if (wrap && wrap instanceof HTMLElement) {
      wrap.style.width = w + 'px';
      wrap.style.height = h + 'px';
      wrap.style.minWidth = w + 'px';
      wrap.style.minHeight = h + 'px';
    }
  }
  try {
    const pdfHeight = 842;
    const pdfWidth = 595;
    const contentWidth = container.offsetWidth || PRINT_DOC_WIDTH;
    const pageContentHeightPx = Math.max(200, contentWidth * (pdfHeight / pdfWidth) - PRINT_FOOTER_HEIGHT_PX - headerHeightPx - patientHeightPx);
    const pageRanges = getSmartPageRanges(container, bodyHeightPx, pageContentHeightPx, { bodyStartY, bodyHeightPx, breakAfterBlockIndices: printBreakAfterBlockIndices.value });
    const canvas = await html2canvas(container, {
      scale: PREVIEW_SCALE,
      useCORS: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc, clonedEl) => {
        replaceCrossOriginImagesWithPlaceholder(clonedEl);
      }
    });
    const urls = [];
    const totalPages = pageRanges.length;
    const headerSlice = headerHeightPx > 0 ? sliceCanvas(canvas, 0, headerHeightPx, PREVIEW_SCALE) : null;
    const patientSlice = patientHeightPx > 0 ? sliceCanvas(canvas, headerHeightPx, headerHeightPx + patientHeightPx, PREVIEW_SCALE) : null;
    let patientShortSlice = null;
    let patientShortHeightPx = 0;
    const patientShortEl = container.querySelector('.print-doc-patient-short');
    if (patientShortEl && totalPages > 1) {
      patientShortHeightPx = patientShortEl.offsetHeight;
      patientShortSlice = await html2canvas(patientShortEl, {
        scale: PREVIEW_SCALE,
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
    }
    const logoUrlForWatermark = printHeaderLogoUrl.value || '';
    for (let i = 0; i < totalPages; i++) {
      const [startY, endY] = pageRanges[i];
      const bodySlice = sliceCanvas(canvas, bodyStartY + startY, bodyStartY + endY, PREVIEW_SCALE);
      const usePatientSlice = (i === 0 || !patientShortSlice) ? patientSlice : patientShortSlice;
      const usePatientHeightPx = (i === 0 || !patientShortSlice) ? patientHeightPx : patientShortHeightPx;
      const fullPage = await makeFullPageCanvasWithHeaderFooter(headerSlice, usePatientSlice, bodySlice, headerHeightPx, usePatientHeightPx, i, totalPages, PREVIEW_SCALE, logoUrlForWatermark);
      urls.push(fullPage.toDataURL('image/png', 0.92));
    }
    printPreviewPageUrls.value = urls;
  } catch (e) {
    console.warn('[PatientStyleTwo] 打印预览截图失败', e);
  }
};

// 打开检查报告打印预览
const handlePrintExaminationReport = async () => {
  if (!props.currentRecord || !props.currentRecord.id) {
    message.warning('请先选择一条检查记录');
    return;
  }
  reportLogoUrl.value = localStorage.getItem('cached_logo_base64') || localStorage.getItem('organization_logo') || '';
  reportOrgName.value = localStorage.getItem('organization_name') || '';
  printHeaderLogoUrl.value = localStorage.getItem('cached_logo_base64') || localStorage.getItem('organization_logo') || '';
  activeAction.value = 'print';
  // 备份并进入打印模式，以便主内容只显示将打印的板块
  printPreviewModalViewModeBackup.value = viewMode.value;
  printPreviewSectionExpandedBackup.value = JSON.parse(JSON.stringify(sectionExpanded.value));
  viewMode.value = 'print';
  printSelectedSections.value = availablePrintSections.value.map(opt => opt.key);
  Object.keys(sectionExpanded.value).forEach(key => {
    sectionExpanded.value[key] = printSelectedSections.value.includes(key);
  });
  examinationReportPrintVisible.value = true;
  printPreviewPageUrls.value = [];
  printSectionOrder.value = availablePrintSections.value.map(opt => opt.key);
  await nextTick();
  await new Promise(r => setTimeout(r, 500));
  await refreshPrintPreviewImage();
};

// 关闭检查报告打印预览
const handleCloseExaminationReportPrint = () => {
  examinationReportPrintVisible.value = false;
  printPreviewPageUrls.value = [];
  viewMode.value = printPreviewModalViewModeBackup.value;
  sectionExpanded.value = JSON.parse(JSON.stringify(printPreviewSectionExpandedBackup.value));
  activeAction.value = null;
};

// 打印专用文档：表头、列结构、格式化与原页面一致
const PRINT_DOC_WIDTH = 595;
const escapeHtml = (s) => {
  if (s == null || s === '') return '-';
  const t = String(s);
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
// 与 PatientStyleTwoPageOne 一致：阿托品、配镜、低强度红光、理疗、视觉训练
const printFormatAtropine = (v) => { if (!v || v === 'none' || v === '否') return '否'; return String(v); };
const printFormatGlasses = (glasses, pp) => {
  if (!glasses || glasses === 'none' || glasses === '否') return '否';
  if (pp && pp !== 'none' && pp !== '否') return `${glasses}(${pp})`;
  return glasses;
};
const printFormatHG = (hg, dw) => {
  if (!hg || hg === 'none' || hg === '否') return '否';
  if (dw !== undefined && dw !== '' && dw !== null) return `${hg}(档位${dw})`;
  return hg;
};
const printFormatYesNo = (v) => { if (!v || v === 'none' || v === '否') return '否'; if (v === '1' || v === '是') return '是'; return String(v); };
const printFormatVisualTraining = (v) => {
  if (!v || v === 'none' || v === '否') return '否';
  const map = { '0': '斜视训练', '1': '弱视训练', '2': '近视训练' };
  return map[v] || v;
};
// 与 RoutineExamStyleTwo 一致：球镜/柱镜/轴位 → 球镜/柱镜×轴位
const printFormatSphere = (value, sign) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  if (sign === '+') return '+' + Math.abs(num).toFixed(2);
  if (sign === '-') return '-' + Math.abs(num).toFixed(2);
  return (num >= 0 ? '+' : '-') + Math.abs(num).toFixed(2);
};
// 柱镜按输入符号显示，不默认为负值
const printFormatCylinder = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  const inferred = num >= 0 ? '+' : '-';
  return inferred + Math.abs(num).toFixed(2);
};
const printFormatAxis = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return Math.abs(Math.round(num)).toString();
};
const printFormatPrescription = (spherical, sphericalSign, cylindrical, axis) => {
  const s = printFormatSphere(spherical, sphericalSign);
  const c = printFormatCylinder(cylindrical);
  const a = printFormatAxis(axis);
  if (s === '-' && c === '-' && a === '-') return '-';
  if (s === '-') return '-';
  let result = s + 'D';
  if (c !== '-' && a !== '-') result += '/' + c + 'D×' + a + '°';
  else if (c !== '-') result += '/' + c + 'D';
  else if (a !== '-') result += '×' + a + '°';
  return result;
};
// 与 RoutineExamStyleTwo 一致：身高、体重、BMI、眼压、修正眼压
const printFormatHeight = (v) => { if (v == null || v === '') return '-'; const n = Number(v); return isNaN(n) ? '-' : String(n); };
const printFormatWeight = (v) => { if (v == null || v === '') return '-'; const n = Number(v); return isNaN(n) ? '-' : Number(n).toFixed(1); };
const printCalculateBMI = (height, weight, record) => {
  if (height && weight) { const h = Number(height), w = Number(weight); if (!isNaN(h) && !isNaN(w) && h > 0) return (w / Math.pow(h / 100, 2)).toFixed(1); }
  if (record?.bmi != null) { const b = Number(record.bmi); if (!isNaN(b)) return b.toFixed(1); }
  return '-';
};
const printFormatIOP = (v) => { if (v == null || v === '') return '-'; const n = Number(v); return isNaN(n) ? '-' : Number(n).toFixed(1); };
const printCalculateCorrectedIOP = (iop, cct) => {
  if (!iop || !cct) return null;
  const i = Number(iop), c = Number(cct);
  if (isNaN(i) || isNaN(c)) return null;
  return i - (c - 520) / 40;
};
// 与 BiometryExamStyleTwo 一致：ΔK、avK、轴率比、近视临界点
const printCalculateDeltaK = (k1, k2) => { if (!k1 || !k2) return null; return (Number(k2) - Number(k1)).toFixed(2); };
const printCalculateAvgK = (k1, k2) => { if (!k1 || !k2) return null; return ((Number(k1) + Number(k2)) / 2).toFixed(2); };
const printCalculateAxialRatio = (axialLength, k1, k2) => {
  if (!axialLength || !k1 || !k2) return null;
  const avgK = (Number(k1) + Number(k2)) / 2;
  return (Number(axialLength) / (337.5 / avgK)).toFixed(2);
};
const printCalculateCriticalPoint = (k1, k2) => {
  if (!k1 || !k2) return null;
  const avgK = (Number(k1) + Number(k2)) / 2;
  if (avgK > 43) return (23.5 - (avgK - 43) / 3).toFixed(2);
  return (23.5 - (avgK - 43) / 2.5).toFixed(2);
};
const printFormatValue = (v) => { if (v == null || v === '') return '-'; const n = Number(v); return isNaN(n) ? '-' : (Number.isInteger(n) ? String(n) : Number(n).toFixed(2)); };
// 打印时判断“无数据”：用于隐藏无检查数据的行，避免报告出现大量 “-”
const isPrintValueEmpty = (v) => { if (v == null || v === '') return true; const s = String(v).trim(); return s === '' || s === '-'; };
// 视力：与页面一致只显示数值部分（不打上标）
const printFormatVision = (v) => { if (v == null || v === '') return '-'; const n = Number(v); if (isNaN(n)) return '-'; const s = n.toFixed(2); return s[s.length - 1] === '0' ? n.toFixed(1) : s; };

// 视功能检查打印：与原页面一致的表格结构（眼位和聚散、AC/A和CA/C、调节检查）
const printFmt = (v) => (v != null && v !== '' ? String(v) : '-');
const printParseEyePositionValue = (exoValue, esoValue) => {
  if (exoValue != null && exoValue !== '') {
    const num = parseFloat(String(exoValue).replace(/^\+/, ''));
    if (!isNaN(num)) return -Math.abs(num);
  }
  if (esoValue != null && esoValue !== '') {
    const num = parseFloat(String(esoValue).replace(/^\+/, ''));
    if (!isNaN(num)) return Math.abs(num);
  }
  return 0;
};
const printCalculatedACARatio = (record) => {
  if (!record) return '-';
  const pd = record.subjective_both_pupil_distance ?? record.objective_pupil_distance ?? record.vaec_both_pupil_distance;
  if (pd == null || pd === '') return '-';
  const pdNum = parseFloat(pd);
  if (isNaN(pdNum)) return '-';
  const farVal = printParseEyePositionValue(record.pli_exo_distance_lateral_phoria, record.plo_eso_distance_lateral_phoria);
  const nearVal = printParseEyePositionValue(record.pli_exo_near_lateral_phoria, record.plo_eso_near_lateral_phoria);
  const result = pdNum / 10 + (nearVal - farVal) / 2.5;
  return isNaN(result) ? '-' : result.toFixed(1);
};
const printCalculatedACARatioRef = (record) => {
  if (!record) return 'PD/10';
  const pd = record.subjective_both_pupil_distance ?? record.objective_pupil_distance ?? record.vaec_both_pupil_distance;
  if (pd == null || pd === '') return 'PD/10';
  const pdNum = parseFloat(pd);
  if (isNaN(pdNum)) return 'PD/10';
  return (pdNum / 10).toFixed(1) + '△/D';
};
const printFormatEyePositionCell = (exo, eso) => {
  if (exo != null && exo !== '') {
    const n = parseFloat(String(exo).replace(/^\+/, ''));
    if (!isNaN(n)) return `外${n}△`;
  }
  if (eso != null && eso !== '') {
    const n = parseFloat(String(eso).replace(/^\+/, ''));
    if (!isNaN(n)) return `内${n}△`;
  }
  return '-';
};
const printFormatVerticalCell = (dir, val) => {
  const hasDir = dir != null && dir !== '' && dir !== '正位';
  const v = val != null && val !== '' ? parseFloat(val) : null;
  if (hasDir && v != null && !isNaN(v)) return `${dir}${v}△`;
  if (hasDir) return dir;
  return '-';
};
const buildFunctionalPrintHtml = (record) => {
  if (!record) return '';
  const esc = escapeHtml;
  const fmt = printFmt;
  const t = (tag, content) => `<${tag}>${content}</${tag}>`;
  const th = (c) => t('th', esc(c));
  const td = (c) => t('td', esc(c));
  let html = '';
  // 1. 眼位和聚散检查（与原页一致；预览智能隐藏：仅保留至少有一列有值的行，全为"-"的行不显示）
  const eyePosRowsAll = [
    ['5m水平眼位', printFormatEyePositionCell(record.pli_exo_distance_lateral_phoria, record.plo_eso_distance_lateral_phoria), fmt(record.fusional_convergence_distance_blur), fmt(record.fusional_convergence_distance_break), fmt(record.fusional_convergence_distance_recovery), fmt(record.fusional_disvergence_distance_blur), fmt(record.fusional_disvergence_distance_break), fmt(record.fusional_disvergence_distance_recovery)],
    ['40cm水平眼位', printFormatEyePositionCell(record.pli_exo_near_lateral_phoria, record.plo_eso_near_lateral_phoria), fmt(record.fusional_convergence_near_blur), fmt(record.fusional_convergence_near_break), fmt(record.fusional_convergence_near_recovery), fmt(record.fusional_disvergence_near_blur), fmt(record.fusional_disvergence_near_break), fmt(record.fusional_disvergence_near_recovery)],
    ['5m垂直眼位', printFormatVerticalCell(record.vertical_eye_position_far ?? record.fusional_convergence_distance_vertical_direction ?? record.far_vertical_eye_direction, record.vertical_eye_position_far_value ?? record.far_vertical_eye_break), '-', fmt(record.fusional_vertical_up_distance_break ?? record.fusional_convergence_distance_vertical_break), fmt(record.fusional_vertical_up_distance_recovery ?? record.fusional_convergence_distance_vertical_recovery), '-', fmt(record.fusional_vertical_down_distance_break ?? record.fusional_disvergence_distance_vertical_break), fmt(record.fusional_vertical_down_distance_recovery ?? record.fusional_disvergence_distance_vertical_recovery)],
    ['40cm垂直眼位', printFormatVerticalCell(record.vertical_eye_position_near ?? record.fusional_convergence_near_vertical_direction ?? record.near_vertical_eye_direction, record.vertical_eye_position_near_value ?? record.near_vertical_eye_break), '-', fmt(record.fusional_vertical_up_near_break ?? record.fusional_convergence_near_vertical_break), fmt(record.fusional_vertical_up_near_recovery ?? record.fusional_convergence_near_vertical_recovery), '-', fmt(record.fusional_vertical_down_near_break ?? record.fusional_disvergence_near_vertical_break), fmt(record.fusional_vertical_down_near_recovery ?? record.fusional_disvergence_near_vertical_recovery)]
  ];
  const hasDataCell = (c) => { const s = (typeof c === 'string' ? c : String(c)).trim(); return s !== '' && s !== '-'; };
  const eyePosRows = eyePosRowsAll.filter(row => row.slice(1).some(hasDataCell));
  if (eyePosRows.length > 0) {
    // 智能隐藏列：若“集合”三列在所有可见行中全为"-"则隐藏整组，同理“散开”
    const has集合 = eyePosRows.some(row => [row[2], row[3], row[4]].some(hasDataCell));
    const has散开 = eyePosRows.some(row => [row[5], row[6], row[7]].some(hasDataCell));
    const eyeColCount = 2 + (has集合 ? 3 : 0) + (has散开 ? 3 : 0);
    const eyeTableClass = 'print-doc-table print-doc-functional-eye print-doc-functional-eye-cols-' + eyeColCount;
    html += '<table class="' + eyeTableClass + '"><thead><tr>';
    html += '<th rowspan="2">' + esc('眼位和聚散检查') + '</th><th rowspan="2">' + esc('眼位') + '</th>';
    if (has集合) { html += '<th colspan="3">' + esc('集合') + '</th>'; }
    if (has散开) { html += '<th colspan="3">' + esc('散开') + '</th>'; }
    html += '</tr><tr>';
    if (has集合) { html += '<th>' + esc('模糊') + '</th><th>' + esc('破裂') + '</th><th>' + esc('恢复') + '</th>'; }
    if (has散开) { html += '<th>' + esc('模糊') + '</th><th>' + esc('破裂') + '</th><th>' + esc('恢复') + '</th>'; }
    html += '</tr></thead><tbody>';
    eyePosRows.forEach(row => {
      const cells = [row[0], row[1]];
      if (has集合) cells.push(row[2], row[3], row[4]);
      if (has散开) cells.push(row[5], row[6], row[7]);
      html += '<tr>' + cells.map(c => t('td', typeof c === 'string' ? (c === '' ? '-' : esc(c)) : esc(String(c)))).join('') + '</tr>';
    });
    html += '</tbody></table>';
  }
  // 2. AC/A和CA/C检查（检查项目、检查结果、参考值）
  const acaHeaders = ['检查项目', '检查结果', '参考值'];
  const gradientAca = [fmt(record.ac_a_gradient_ratio_plus), fmt(record.ac_a_gradient_ratio_minus), fmt(record.ac_a_gradient_ratio_average)].filter(x => x !== '-').length
    ? `+1.00：${fmt(record.ac_a_gradient_ratio_plus)} -1.00：${fmt(record.ac_a_gradient_ratio_minus)} 平均AC/A：${fmt(record.ac_a_gradient_ratio_average)}`
    : '-';
  const acaRowsAll = [
    ['计算性AC/A（△/D)', printCalculatedACARatio(record), printCalculatedACARatioRef(record)],
    ['梯度型AC/A（△/D）', gradientAca, '3~5△/D'],
    ['CA/C（D/MA）', fmt(record.ca_c_ratio), '0.3~0.6D/MA']
  ];
  const acaRows = acaRowsAll.filter(row => { const v = row[1]; return v != null && String(v).trim() !== '' && String(v).trim() !== '-'; });
  if (acaRows.length > 0) {
    html += '<table class="print-doc-table print-doc-table-3col print-doc-functional-aca"><thead><tr>' + acaHeaders.map(th).join('') + '</tr></thead><tbody>';
    acaRows.forEach(row => { html += '<tr><td class="print-doc-label">' + esc(row[0]) + '</td><td class="print-doc-value">' + esc(row[1]) + '</td><td class="print-doc-unit">' + esc(row[2]) + '</td></tr>'; });
    html += '</tbody></table>';
  }
  // 3. 调节检查（仅当存在任一项调节数据时才输出，与原文一致：无结果则不显示该块）
  const praBlur = record.positive_relative_accommodation_blur ?? record.positive_relative_accommodation;
  const praRec = record.positive_relative_accommodation_recovery;
  const nraBlur = record.negative_relative_accommodation_blur ?? record.negative_relative_accommodation;
  const nraRec = record.negative_relative_accommodation_recovery;
  const praStr = (praBlur != null && praBlur !== '' || praRec != null && praRec !== '') ? `模糊点：${fmt(praBlur)} 恢复点：${fmt(praRec)}` : '-';
  const nraStr = (nraBlur != null && nraBlur !== '' || nraRec != null && nraRec !== '') ? `模糊点：${fmt(nraBlur)} 恢复点：${fmt(nraRec)}` : '-';
  const ampR = record.accommodative_amplitude_right ?? record.accommodation_amplitude_right;
  const ampL = record.accommodative_amplitude_left ?? record.accommodation_amplitude_left;
  const ampStyle = record.accommodation_amplitude_style;
  const ampStr = (ampR != null && ampR !== '' || ampL != null && ampL !== '') ? `右眼：${fmt(ampR)} 左眼：${fmt(ampL)} ${fmt(ampStyle)}` : '-';
  const hasSensVal = (record.accommodation_sensitivity_right_value ?? record.accommodation_sensitivity_right ?? record.accommodation_sensitivity_left_value ?? record.accommodation_sensitivity_left ?? record.accommodation_sensitivity_both_value ?? record.accommodation_sensitivity_both) != null && (record.accommodation_sensitivity_right_value ?? record.accommodation_sensitivity_right ?? record.accommodation_sensitivity_left_value ?? record.accommodation_sensitivity_left ?? record.accommodation_sensitivity_both_value ?? record.accommodation_sensitivity_both) !== '';
  const sensStr = hasSensVal
    ? `${fmt(record.accommodation_sensitivity_lens_power ?? record.accommodation_sensitivity_diopter)} ${fmt(record.accommodation_sensitivity_target ?? record.accommodation_sensitivity_vision)} 右眼：${fmt(record.accommodation_sensitivity_right_value ?? record.accommodation_sensitivity_right)} 左眼：${fmt(record.accommodation_sensitivity_left_value ?? record.accommodation_sensitivity_left)} 双眼：${fmt(record.accommodation_sensitivity_both_value ?? record.accommodation_sensitivity_both)}`
    : '-';
  const reactR = record.accommodation_mem_right_value ?? record.fused_cross_cylinder_right;
  const reactL = record.accommodation_mem_left_value ?? record.fused_cross_cylinder_left;
  const reactB = record.accommodation_amplitude_bcc_style ?? record.fused_cross_cylinder_both;
  const signR = record.accommodation_mem_right_sign;
  const signL = record.accommodation_mem_left_sign;
  const signB = record.accommodation_bcc_sign;
  const fmtReact = (v, sign) => { if (v == null || v === '') return '-'; const n = parseFloat(String(v).replace(/^[+\-]/, '')); return (sign === '-' || (v.toString().startsWith('-')) ? '-' : '+') + (isNaN(n) ? v : n); };
  const reactStr = [reactR, reactL, reactB].some(x => x != null && x !== '') ? `右眼：${fmtReact(reactR, signR)} 左眼：${fmtReact(reactL, signL)} BCC：${fmtReact(reactB, signB)}` : '-';
  const hasAnyAccommodationData = praStr !== '-' || nraStr !== '-' || ampStr !== '-' || sensStr !== '-' || reactStr !== '-';
  if (hasAnyAccommodationData) {
    const accomRowsAll = [
      ['正相对调节（D）', praStr, '小于-3.00D'],
      ['负相对调节（D）', nraStr, '+2.25D±0.25D'],
      ['调节幅度（D）', ampStr, '-'],
      ['调节灵敏度（cpm）', sensStr, '单眼11cpm 双眼8cpm'],
      ['调节反应（D）', reactStr, '+0.50D±0.25D']
    ];
    const accomRows = accomRowsAll.filter(row => { const v = row[1]; return v != null && String(v).trim() !== '' && String(v).trim() !== '-'; });
    if (accomRows.length > 0) {
      html += '<table class="print-doc-table print-doc-table-3col print-doc-functional-accom"><thead><tr>' + acaHeaders.map(th).join('') + '</tr></thead><tbody>';
      accomRows.forEach(row => { html += '<tr><td class="print-doc-label">' + esc(row[0]) + '</td><td class="print-doc-value">' + esc(row[1]) + '</td><td class="print-doc-unit">' + esc(row[2]) + '</td></tr>'; });
      html += '</tbody></table>';
    }
  }
  return html;
};

// 各模块配置：表头、列名与原页面一致
const PRINT_SECTION_CONFIG = {
  'doctor-instructions': { title: '医生建议/备注', type: 'paragraph', contentKey: 'remarks' },
  'treatment-plan': { title: '诊疗方案', type: 'table3', thead: ['方案', '右眼', '左眼'], fields: [
    { label: '阿托品', rightKey: 'right_atropine', leftKey: 'left_atropine', format: 'atropine' },
    { label: '配镜', rightKey: 'right_glasses', leftKey: 'left_glasses', rightPP: 'right_glasses_pp', leftPP: 'left_glasses_pp', format: 'glasses' },
    { label: '低强度红光', rightKey: 'right_hg', leftKey: 'left_hg', rightDW: 'right_hg_dw', leftDW: 'left_hg_dw', format: 'hg' },
    { label: '理疗', rightKey: 'right_physiotherapy', leftKey: 'left_physiotherapy', format: 'yesno' },
    { label: '视觉训练', rightKey: 'right_visual_training', leftKey: 'left_visual_training', format: 'visualtraining' }
  ]},
  'routine': { title: '基础检查', type: 'table3unit', thead: ['检查项目', '数值', '单位'], rows: (record) => [
    { label: '身高', value: printFormatHeight(record.height), unit: 'cm' },
    { label: '体重', value: printFormatWeight(record.weight), unit: 'kg' },
    { label: 'BMI', value: printCalculateBMI(record.height, record.weight, record), unit: '-' },
    { label: '眼压（右眼）', value: printFormatIOP(record.right_intraocular_pressure), unit: 'mmHg' },
    { label: '眼压（左眼）', value: printFormatIOP(record.left_intraocular_pressure), unit: 'mmHg' },
    { label: '修正眼压（右眼）', value: printFormatIOP(printCalculateCorrectedIOP(record.right_intraocular_pressure, record.right_cct)), unit: 'mmHg' },
    { label: '修正眼压（左眼）', value: printFormatIOP(printCalculateCorrectedIOP(record.left_intraocular_pressure, record.left_cct)), unit: 'mmHg' }
  ]},
  'vision': { title: '视力检查', type: 'table3', thead: ['检查项目', '右眼', '左眼'], fields: [
    { label: '裸眼视力', rightKey: 'uva_right_vision', leftKey: 'uva_left_vision', format: 'vision' },
    { label: '戴镜视力', rightKey: 'vaec_right_old_vision', leftKey: 'vaec_left_old_vision', format: 'vision' }
  ]},
  'objective-refraction': { title: '客观验光检查', type: 'table3prescription', thead: ['检查项目', '右眼', '左眼'], rows: (record) => [
    { label: '电脑验光', right: printFormatPrescription(record.objective_right_spherical, record.objective_right_spherical_sign, record.objective_right_cylindrical, record.objective_right_axis), left: printFormatPrescription(record.objective_left_spherical, record.objective_left_spherical_sign, record.objective_left_cylindrical, record.objective_left_axis) }
  ]},
  'subjective-refraction': { title: '主观验光检查', type: 'table3prescription', thead: ['检查项目', '右眼', '左眼'], rows: (record) => [
    { label: '主观验光', right: printFormatPrescription(record.subjective_right_spherical, record.subjective_right_spherical_sign, record.subjective_right_cylindrical, record.subjective_right_axis), left: printFormatPrescription(record.subjective_left_spherical, record.subjective_left_spherical_sign, record.subjective_left_cylindrical, record.subjective_left_axis) }
  ]},
  'functional': { title: '视功能检查', type: 'functional_html', buildHtml: (record) => buildFunctionalPrintHtml(record) },
  'analysis': { title: '结果分析', type: 'analysis_print', contentKey: 'analysis_result' },
  'biometry': { title: '生物测量仪检查', type: 'table3unit4', thead: ['检查项目', '右眼', '左眼', '单位'], rows: (record) => [
    { label: '眼轴长度', right: printFormatValue(record.right_eye_axial_length), left: printFormatValue(record.left_eye_axial_length), unit: 'mm' },
    { label: 'K1', right: printFormatValue(record.right_eye_k1), left: printFormatValue(record.left_eye_k1), unit: 'D' },
    { label: 'K2', right: printFormatValue(record.right_eye_k2), left: printFormatValue(record.left_eye_k2), unit: 'D' },
    { label: 'ΔK', right: printCalculateDeltaK(record.right_eye_k1, record.right_eye_k2), left: printCalculateDeltaK(record.left_eye_k1, record.left_eye_k2), unit: 'D' },
    { label: 'avK', right: printCalculateAvgK(record.right_eye_k1, record.right_eye_k2), left: printCalculateAvgK(record.left_eye_k1, record.left_eye_k2), unit: 'D' },
    { label: '轴率比', right: printCalculateAxialRatio(record.right_eye_axial_length, record.right_eye_k1, record.right_eye_k2), left: printCalculateAxialRatio(record.left_eye_axial_length, record.left_eye_k1, record.left_eye_k2), unit: '参考值 ≤3.0' },
    { label: '近视临界点', right: printCalculateCriticalPoint(record.right_eye_k1, record.right_eye_k2), left: printCalculateCriticalPoint(record.left_eye_k1, record.left_eye_k2), unit: 'mm' },
    { label: '角膜厚度', right: printFormatValue(record.right_cct), left: printFormatValue(record.left_cct), unit: 'μm' },
    { label: '前房深度', right: printFormatValue(record.right_anterior_chamber_depth), left: printFormatValue(record.left_anterior_chamber_depth), unit: 'mm' },
    { label: '晶体厚度', right: printFormatValue(record.right_lens_thickness), left: printFormatValue(record.left_lens_thickness), unit: 'mm' }
  ]}
};

// 在打印文档的结果分析占位容器内渲染眼轴趋势图，渲染完成后用 getDataURL 导出为图片再替换 DOM，避免 html2canvas 对 canvas 截不全
const initPrintAnalysisChart = (container, examinationRecords) => {
  return new Promise((resolve) => {
    const chartEl = container?.querySelector('.print-doc-analysis-chart');
    if (!chartEl || !examinationRecords?.length) {
      if (!chartEl) console.warn('[PatientStyleTwo] initPrintAnalysisChart: 未找到 .print-doc-analysis-chart');
      resolve();
      return;
    }
    // 离屏容器可能导致 ECharts 拿到 0 尺寸，先给占位明确宽高（与打印宽度一致）
    const chartWidth = 547;
    const chartHeight = 280;
    chartEl.style.width = chartWidth + 'px';
    chartEl.style.height = chartHeight + 'px';
    chartEl.style.minWidth = chartWidth + 'px';
    chartEl.style.minHeight = chartHeight + 'px';
    const sorted = [...examinationRecords].sort((a, b) => {
      const da = a.examination_date ? dayjs(a.examination_date).valueOf() : 0;
      const db = b.examination_date ? dayjs(b.examination_date).valueOf() : 0;
      return da - db;
    });
    const dates = [];
    const rightEyeData = [];
    const leftEyeData = [];
    sorted.forEach((rec) => {
      const r = Number(rec.right_eye_axial_length);
      const l = Number(rec.left_eye_axial_length);
      const rv = (!isNaN(r) && r !== 0 && r != null) ? r : null;
      const lv = (!isNaN(l) && l !== 0 && l != null) ? l : null;
      if (rv == null && lv == null) return;
      const dateStr = rec.examination_date ? dayjs(rec.examination_date).format('YYYY-MM-DD') : '';
      const formatted = dateStr.replace(/-/g, '').slice(2);
      dates.push(formatted);
      rightEyeData.push(rv);
      leftEyeData.push(lv);
    });
    if (dates.length === 0) {
      console.warn('[PatientStyleTwo] initPrintAnalysisChart: 无有效眼轴数据，dates.length=0');
      resolve();
      return;
    }
    const chart = initChart(chartEl);
    if (!chart) {
      resolve();
      return;
    }
    const option = {
      ...axialLengthOption,
      xAxis: { ...axialLengthOption.xAxis, data: dates },
      series: [
        { ...axialLengthOption.series[0], data: rightEyeData },
        { ...axialLengthOption.series[1], data: leftEyeData }
      ]
    };
    chart.setOption(option);
    let resolved = false;
    const onDone = () => {
      if (resolved) return;
      resolved = true;
      // 离屏时 ECharts 可能刚触发 finished 尚未真正绘制完，稍等一帧再导出
      const doExport = () => {
        try {
          if (typeof chart.getDataURL !== 'function') {
            resolve();
            return;
          }
          const dataUrl = chart.getDataURL({ type: 'png', pixelRatio: 2 });
          if (!dataUrl || !chartEl.parentNode) {
            if (!dataUrl) console.warn('[PatientStyleTwo] 眼轴图 getDataURL 返回空');
            resolve();
            return;
          }
          const img = document.createElement('img');
          img.src = dataUrl;
          img.alt = '眼轴长度趋势';
          img.style.width = '100%';
          img.style.height = chartHeight + 'px';
          img.style.display = 'block';
          img.style.objectFit = 'contain';
          chartEl.innerHTML = '';
          chartEl.appendChild(img);
          if (typeof chart.dispose === 'function') chart.dispose();
          console.log('[PatientStyleTwo] 眼轴图已替换为图片，dataUrl 长度:', dataUrl.length);
          // 等待图片解码后再 resolve，确保后续 html2canvas 能截到图
          if (img.decode) {
            img.decode().then(() => resolve()).catch(() => resolve());
          } else {
            resolve();
          }
          return;
        } catch (e) {
          console.warn('[PatientStyleTwo] 眼轴图导出为图片失败', e);
        }
        resolve();
      };
      requestAnimationFrame(() => {
        setTimeout(doExport, 80);
      });
    };
    if (typeof chart.on === 'function') {
      chart.on('finished', onDone);
    }
    setTimeout(onDone, 1000);
  });
};

const printDocRef = ref(null);
const buildPrintDocumentHtml = (record, patientInfo, selectedSections, logoUrl) => {
  const patientName = escapeHtml(patientInfo?.name || '-');
  const gender = escapeHtml(patientInfo?.gender || '-');
  const birthDate = patientInfo?.birth_date || patientInfo?.birthDate ? dayjs(patientInfo.birth_date || patientInfo.birthDate).format('YYYY-MM-DD') : '-';
  const examDate = record?.examination_date ? dayjs(record.examination_date).format('YYYY-MM-DD') : '-';
  const nextReviewDate = (() => {
    const rec = record;
    if (!rec) return '-';
    if (rec.review_date) return dayjs(rec.review_date).format('YYYY-MM-DD');
    const base = rec.examination_date ? dayjs(rec.examination_date) : null;
    const days = rec.review_interval_days;
    if (!base || !base.isValid()) return '-';
    if (days === 1) return base.add(1, 'month').format('YYYY-MM-DD');
    if (days === 2) return base.add(2, 'month').format('YYYY-MM-DD');
    if (days === 3) return base.add(3, 'month').format('YYYY-MM-DD');
    return '-';
  })();
  const patientId = (() => { const p = patientInfo; if (!p) return '-'; const id = p.patient_id ?? p.id; if (id != null && id !== '') return String(id); const ids = p.identifiers; if (ids && ids.length > 1 && ids[1]) { const m = String(ids[1]).match(/\d+/); return m ? m[0] : '-'; } return '-'; })();
  const archiveId = (() => { const g = patientInfo?.gkid; if (g) { const m = String(g).match(/\d+/); return m ? m[0] : '-'; } return '-'; })();
  const logoImg = logoUrl ? `<span class="print-doc-logo-wrap"><img src="${escapeHtml(logoUrl)}" alt="" class="print-doc-logo" /></span>` : '';
  let sectionsHtml = '';
  // 顺序由调用方按左侧拖拽顺序传入，此处不再重排
  const orderedSections = [...(selectedSections || [])];
  orderedSections.forEach(key => {
    const config = PRINT_SECTION_CONFIG[key];
    if (!config || !record) return;
    if (config.type === 'paragraph') {
      const raw = record[config.contentKey];
      const escaped = raw != null && raw !== '' ? escapeHtml(String(raw)) : '暂无';
      const text = escaped.replace(/\n/g, '<br>');
      sectionsHtml += `<div class="print-doc-section print-doc-section-para"><div class="print-doc-section-title">${escapeHtml(config.title)}</div><div class="print-doc-para-wrap"><p class="print-doc-para">${text}</p></div></div>`;
      return;
    }
    if (config.type === 'analysis_print') {
      const raw = record[config.contentKey];
      const escaped = raw != null && raw !== '' ? escapeHtml(String(raw)) : '暂无';
      const text = escaped.replace(/\n/g, '<br>');
      sectionsHtml += `<div class="print-doc-section print-doc-section-para"><div class="print-doc-section-title">${escapeHtml(config.title)}</div><div class="print-doc-para-wrap"><p class="print-doc-para">${text}</p></div><div class="print-doc-analysis-chart" style="width:100%;height:280px;"></div></div>`;
      return;
    }
    if (config.type === 'table3' && config.fields) {
      const thead = (config.thead || ['检查项目', '右眼', '左眼']).map(t => `<th>${escapeHtml(t)}</th>`).join('');
      const isNoOrEmpty = (v) => {
        if (v == null || v === '') return true;
        const s = String(v).trim();
        return s === '-' || s === '否';
      };
      const rowData = config.fields.map(f => {
        let vR = record[f.rightKey], vL = record[f.leftKey];
        if (f.format === 'atropine') { vR = printFormatAtropine(vR); vL = printFormatAtropine(vL); }
        else if (f.format === 'glasses') { vR = printFormatGlasses(vR, record[f.rightPP]); vL = printFormatGlasses(vL, record[f.leftPP]); }
        else if (f.format === 'hg') { vR = printFormatHG(vR, record[f.rightDW]); vL = printFormatHG(vL, record[f.leftDW]); }
        else if (f.format === 'yesno') { vR = printFormatYesNo(vR); vL = printFormatYesNo(vL); }
        else if (f.format === 'visualtraining') { vR = printFormatVisualTraining(vR); vL = printFormatVisualTraining(vL); }
        else if (f.format === 'vision') { vR = vR != null && vR !== '' ? printFormatVision(vR) : '-'; vL = vL != null && vL !== '' ? printFormatVision(vL) : '-'; }
        else { vR = vR != null && vR !== '' ? escapeHtml(String(vR)) : '-'; vL = vL != null && vL !== '' ? escapeHtml(String(vL)) : '-'; }
        const isBothNo = isNoOrEmpty(vR) && isNoOrEmpty(vL);
        return { label: f.label, vR, vL, isBothNo };
      });
      const allNo = key === 'treatment-plan' && rowData.every(r => r.isBothNo);
      const rows = rowData.map(r => {
        if (!allNo && r.isBothNo) return '';
        return `<tr><td class="print-doc-label">${escapeHtml(r.label)}</td><td class="print-doc-value">${r.vR}</td><td class="print-doc-value">${r.vL}</td></tr>`;
      }).filter(Boolean).join('');
      if (!rows) return;
      sectionsHtml += `<div class="print-doc-section"><div class="print-doc-section-title">${escapeHtml(config.title)}</div><table class="print-doc-table"><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table></div>`;
      return;
    }
    if (config.type === 'table3unit' && config.rows) {
      const thead = (config.thead || ['检查项目', '数值', '单位']).map(t => `<th>${escapeHtml(t)}</th>`).join('');
      // 隐藏无数据行：空、'-'、以及 0/0.0（如未测体重）
      const rowList = config.rows(record).filter(r => {
        if (isPrintValueEmpty(r.value)) return false;
        const s = String(r.value).trim();
        if (s === '0' || s === '0.0') return false;
        return true;
      });
      if (rowList.length === 0) return;
      const rows = rowList.map(r => `<tr><td class="print-doc-label">${escapeHtml(r.label)}</td><td class="print-doc-value">${r.value === '-' ? '-' : escapeHtml(r.value)}</td><td class="print-doc-unit">${escapeHtml(r.unit)}</td></tr>`).join('');
      sectionsHtml += `<div class="print-doc-section"><div class="print-doc-section-title">${escapeHtml(config.title)}</div><table class="print-doc-table print-doc-table-3col"><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table></div>`;
      return;
    }
    if (config.type === 'table3prescription' && config.rows) {
      const thead = (config.thead || ['检查项目', '右眼', '左眼']).map(t => `<th>${escapeHtml(t)}</th>`).join('');
      const rowList = config.rows(record);
      const rows = rowList.map(r => {
        if (r.right === '-' && r.left === '-') return '';
        return `<tr><td class="print-doc-label">${escapeHtml(r.label)}</td><td class="print-doc-value">${r.right === '-' ? '-' : escapeHtml(r.right)}</td><td class="print-doc-value">${r.left === '-' ? '-' : escapeHtml(r.left)}</td></tr>`;
      }).filter(Boolean).join('');
      if (!rows) return;
      sectionsHtml += `<div class="print-doc-section"><div class="print-doc-section-title">${escapeHtml(config.title)}</div><table class="print-doc-table"><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table></div>`;
      return;
    }
    if (config.type === 'table3unit4' && config.rows) {
      const thead = (config.thead || ['检查项目', '右眼', '左眼', '单位']).map(t => `<th>${escapeHtml(t)}</th>`).join('');
      // 仅当右眼、左眼均为无数据（null/''/'-'）时才隐藏该行，避免误杀有值行（如 0、计算值等）
      const hasVal = (v) => v != null && v !== '' && v !== '-';
      const rowList = config.rows(record).filter(r => hasVal(r.right) || hasVal(r.left));
      if (rowList.length === 0) return;
      const rows = rowList.map(r => `<tr><td class="print-doc-label">${escapeHtml(r.label)}</td><td class="print-doc-value">${r.right === '-' || r.right == null ? '-' : escapeHtml(r.right)}</td><td class="print-doc-value">${r.left === '-' || r.left == null ? '-' : escapeHtml(r.left)}</td><td class="print-doc-unit">${escapeHtml(r.unit)}</td></tr>`).join('');
      sectionsHtml += `<div class="print-doc-section"><div class="print-doc-section-title">${escapeHtml(config.title)}</div><table class="print-doc-table print-doc-table-4col"><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table></div>`;
      return;
    }
    if (config.type === 'table2' && config.fields) {
      const thead = (config.thead || ['项目', '结果']).map(t => `<th>${escapeHtml(t)}</th>`).join('');
      const rows = config.fields.map(f => {
        const v = record[f.key];
        const val = v != null && v !== '' ? escapeHtml(String(v)) : '-';
        if (val === '-') return '';
        return `<tr><td class="print-doc-label">${escapeHtml(f.label)}</td><td class="print-doc-value">${val}</td></tr>`;
      }).filter(Boolean).join('');
      if (!rows) return;
      sectionsHtml += `<div class="print-doc-section"><div class="print-doc-section-title">${escapeHtml(config.title)}</div><table class="print-doc-table print-doc-table-2col"><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table></div>`;
      return;
    }
    if (config.type === 'table2rows' && config.rows) {
      const thead = (config.thead || ['检查项目', '结果']).map(t => `<th>${escapeHtml(t)}</th>`).join('');
      const rowList = config.rows(record).filter(r => !isPrintValueEmpty(r.value));
      if (rowList.length === 0) return;
      const rows = rowList.map(r => {
        const val = r.value != null && r.value !== '' ? escapeHtml(String(r.value)) : '-';
        return `<tr><td class="print-doc-label">${escapeHtml(r.label)}</td><td class="print-doc-value">${val}</td></tr>`;
      }).join('');
      sectionsHtml += `<div class="print-doc-section"><div class="print-doc-section-title">${escapeHtml(config.title)}</div><table class="print-doc-table print-doc-table-2col"><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table></div>`;
      return;
    }
    if (config.type === 'functional_html' && config.buildHtml) {
      sectionsHtml += `<div class="print-doc-section"><div class="print-doc-section-title">${escapeHtml(config.title)}</div>${config.buildHtml(record)}</div>`;
    }
  });
  // 首页基本信息：姓名、档案编号、性别、出生日期、检查日期、下次复查日期（2 行，不显示患者编号）
  const patientBlockHtml = `<div class="print-doc-patient">
        <div class="print-doc-patient-inner">
          <div class="print-doc-patient-item"><span class="print-doc-patient-label">姓名</span><span class="print-doc-patient-value">${patientName}</span></div>
          <div class="print-doc-patient-item"><span class="print-doc-patient-label">档案编号</span><span class="print-doc-patient-value">${archiveId}</span></div>
          <div class="print-doc-patient-item"><span class="print-doc-patient-label">性别</span><span class="print-doc-patient-value">${gender}</span></div>
          <div class="print-doc-patient-item"><span class="print-doc-patient-label">出生日期</span><span class="print-doc-patient-value">${birthDate}</span></div>
          <div class="print-doc-patient-item"><span class="print-doc-patient-label">检查日期</span><span class="print-doc-patient-value">${examDate}</span></div>
          <div class="print-doc-patient-item"><span class="print-doc-patient-label">下次复查日期</span><span class="print-doc-patient-value">${nextReviewDate}</span></div>
        </div>
      </div>`;
  // 非首页顶部：仅展示文字，无容器无框，与正文同宽 531px
  const patientShortHtml = `<div class="print-doc-patient-short" style="position:absolute;left:-9999px;top:0;width:531px;box-sizing:border-box;">
        <span class="print-doc-short-item">姓名：${patientName}</span><span class="print-doc-short-sep">　</span>
        <span class="print-doc-short-item">档案编号：${archiveId}</span><span class="print-doc-short-sep">　</span>
        <span class="print-doc-short-item">性别：${gender}</span><span class="print-doc-short-sep">　</span>
        <span class="print-doc-short-item">出生日期：${birthDate}</span><span class="print-doc-short-sep">　</span>
        <span class="print-doc-short-item">检查日期：${examDate}</span>
      </div>`;
  return `
    <div class="print-doc-wrap">
      <div class="print-doc-header">
        <div class="print-doc-header-top">
          <div class="print-doc-title-wrap">
            <h1 class="print-doc-title">检查报告</h1>
            <span class="print-doc-subtitle">Examination Report</span>
          </div>
          ${logoImg}
        </div>
      </div>
      ${patientBlockHtml}
      <div class="print-doc-body">${sectionsHtml}</div>
    </div>
    ${patientShortHtml}
  `;
};

// 智能分页：仅对正文区域按模块边界断页；支持“仅正文”模式（bodyStartY/bodyHeightPx）及用户指定“在此处分页”
const BLOCK_SELECTORS_PRINT_DOC_HEADER = '.print-doc-header';
const BLOCK_SELECTORS_PRINT_DOC_BODY = '.print-doc-section';
const BLOCK_SELECTORS = '.print-report-header, .doctor-instructions-section, .treatment-plan-section, .style-two-section';
const getSmartPageRanges = (container, contentHeightPx, pageContentHeightPx, options = {}) => {
  const { breakAfterBlockIndices = [], bodyStartY = 0, bodyHeightPx } = options;
  const isPrintDoc = container.firstElementChild?.classList?.contains('print-doc-wrap');
  const bodyOnly = isPrintDoc && bodyHeightPx != null && bodyHeightPx >= 0;
  const selectors = bodyOnly ? BLOCK_SELECTORS_PRINT_DOC_BODY : (isPrintDoc ? BLOCK_SELECTORS_PRINT_DOC_HEADER + ', ' + BLOCK_SELECTORS_PRINT_DOC_BODY : BLOCK_SELECTORS);
  const containerRect = container.getBoundingClientRect();
  const scrollTop = container.scrollTop || 0;
  const bodyEndY = bodyOnly ? bodyStartY + bodyHeightPx : contentHeightPx;
  const heightLimit = bodyOnly ? bodyEndY + 20 : contentHeightPx + 20;
  let blocks = Array.from(container.querySelectorAll(selectors))
    .filter(el => el.offsetParent != null && el.getBoundingClientRect().height > 0)
    .map(el => {
      const r = el.getBoundingClientRect();
      const top = r.top - containerRect.top + scrollTop;
      const height = r.height;
      const bottom = top + height;
      return { top, height, bottom };
    })
    .filter(b => b.top >= (bodyOnly ? bodyStartY - 10 : -10) && b.bottom <= heightLimit);
  if (bodyOnly) {
    blocks = blocks.map(b => ({ ...b, top: b.top - bodyStartY, bottom: b.bottom - bodyStartY }));
  }
  blocks.sort((a, b) => a.top - b.top);
  const effectiveContentH = bodyOnly ? bodyHeightPx : contentHeightPx;
  if (blocks.length === 0) {
    return [[0, Math.min(pageContentHeightPx, effectiveContentH)]];
  }
  const ranges = [];
  let start = 0;
  let currentEnd = 0;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const forceBreakBefore = i > 0 && breakAfterBlockIndices.includes(i - 1);
    if (forceBreakBefore && currentEnd > start) {
      ranges.push([start, currentEnd]);
      start = currentEnd;
      currentEnd = start;
    }
    if (b.bottom - start <= pageContentHeightPx) {
      currentEnd = b.bottom;
    } else {
      if (currentEnd > start) {
        ranges.push([start, currentEnd]);
        start = currentEnd;
      }
      currentEnd = b.bottom;
    }
    if (breakAfterBlockIndices.includes(i) && currentEnd > start) {
      ranges.push([start, currentEnd]);
      start = currentEnd;
      currentEnd = start;
    }
  }
  if (start < currentEnd) {
    ranges.push([start, currentEnd]);
  }
  if (ranges.length === 0) ranges.push([0, Math.min(pageContentHeightPx, effectiveContentH)]);
  return ranges;
};

// 从大 canvas 上裁出 [startY, endY] 段（内容坐标），scale 为截图时的缩放
const sliceCanvas = (sourceCanvas, startY, endY, scale) => {
  const w = sourceCanvas.width;
  const h = Math.max(1, Math.round((endY - startY) * scale));
  const sy = Math.round(startY * scale);
  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = w;
  pageCanvas.height = h;
  const ctx = pageCanvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, sy, w, h, 0, 0, w, h);
  return pageCanvas;
};

// A4 比例：宽 595，高 842（height/width），整页高 = 宽 * A4_RATIO
const A4_RATIO = 842 / 595;
// 页脚高度（逻辑 px），内容区不溢出、页码放页脚居中
const PRINT_FOOTER_HEIGHT_PX = 56;

// 整页画布（无页眉）：主内容区不溢出，页码在页脚居中（兼容旧调用）
const makeFullPageCanvasWithFooter = (contentSlice, pageIndex, totalPages, scale = 1) => {
  return makeFullPageCanvasWithHeaderFooter(null, null, contentSlice, 0, 0, pageIndex, totalPages, scale, '');
};

// 整页画布：统一页眉 + 每页正文顶部的患者信息 + 正文区 + 统一页脚（页码居中）；可选在正文绘制区域正中央绘制 logo 水印（最顶层）
const makeFullPageCanvasWithHeaderFooter = (headerSlice, patientSlice, bodySlice, headerHeightPx, patientHeightPx, pageIndex, totalPages, scale = 1, logoUrl = '') => {
  const w = (bodySlice || headerSlice)?.width || 595 * scale;
  const fullPageH = Math.round(w * A4_RATIO);
  const footerH = Math.round(PRINT_FOOTER_HEIGHT_PX * scale);
  const headerAreaH = headerSlice && headerHeightPx > 0 ? Math.round(headerHeightPx * scale) : 0;
  const patientAreaH = patientSlice && patientHeightPx > 0 ? Math.round(patientHeightPx * scale) : 0;
  const bodyAreaH = fullPageH - headerAreaH - patientAreaH - footerH;
  const bodyDrawY = headerAreaH + patientAreaH;
  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = w;
  pageCanvas.height = fullPageH;
  const ctx = pageCanvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, fullPageH);
  let drawY = 0;
  let bodyDrawH = 0;
  if (headerSlice && headerSlice.height > 0 && headerAreaH > 0) {
    const scaleH = Math.min(headerAreaH / headerSlice.height, w / headerSlice.width);
    const hw = headerSlice.width * scaleH;
    const hh = headerSlice.height * scaleH;
    ctx.drawImage(headerSlice, 0, 0, headerSlice.width, headerSlice.height, (w - hw) / 2, 0, hw, hh);
    drawY = headerAreaH;
  }
  if (patientSlice && patientSlice.height > 0 && patientAreaH > 0) {
    let pw, ph, drawX;
    if (patientSlice.width < w) {
      // 短条（531px）：保持原宽、居中，高度填满预留区，与正文内容区同宽
      pw = patientSlice.width;
      ph = patientAreaH;
      drawX = (w - pw) / 2;
    } else {
      const scaleP = Math.min(patientAreaH / patientSlice.height, w / patientSlice.width);
      pw = patientSlice.width * scaleP;
      ph = patientSlice.height * scaleP;
      drawX = (w - pw) / 2;
    }
    ctx.drawImage(patientSlice, 0, 0, patientSlice.width, patientSlice.height, drawX, drawY, pw, ph);
    drawY += patientAreaH;
  }
  if (bodySlice && bodySlice.height > 0 && bodyAreaH > 0) {
    const scaleFit = Math.min(bodyAreaH / bodySlice.height, w / bodySlice.width);
    const drawW = bodySlice.width * scaleFit;
    const drawH = bodySlice.height * scaleFit;
    bodyDrawH = drawH;
    ctx.drawImage(bodySlice, 0, 0, bodySlice.width, bodySlice.height, (w - drawW) / 2, drawY, drawW, drawH);
  }
  // 页脚页码：简洁灰色，居中
  const text = `第 ${pageIndex + 1} 页 / 共 ${totalPages} 页`;
  const fontSize = Math.max(10, 11 * scale);
  ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = 'rgba(115,115,115,0.85)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, fullPageH - footerH / 2);
  const watermarkCenterX = w / 2;
  const watermarkCenterY = bodyDrawH > 0 ? bodyDrawY + bodyDrawH / 2 : bodyDrawY + bodyAreaH / 2;
  return new Promise((resolve) => {
    if (!logoUrl) {
      resolve(pageCanvas);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      const maxSize = Math.min(w, bodyAreaH) * 0.5;
      const iw = img.naturalWidth || img.width || 1;
      const ih = img.naturalHeight || img.height || 1;
      const r = iw / ih;
      const drawW = r >= 1 ? maxSize : maxSize * r;
      const drawH = r >= 1 ? maxSize / r : maxSize;
      ctx.globalAlpha = 0.12;
      ctx.translate(watermarkCenterX, watermarkCenterY);
      ctx.rotate(-45 * Math.PI / 180);
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
      resolve(pageCanvas);
    };
    img.onerror = () => resolve(pageCanvas);
    img.src = logoUrl;
  });
};

// 处理检查报告打印：使用打印专用文档（独立排版）+ 无裁剪智能分页 + 每页页码
const handleExaminationReportPrint = async () => {
  if (printSelectedSections.value.length === 0) {
    message.warning('请至少选择一个要打印的模块');
    return;
  }
  const record = props.currentRecord;
  const patientInfo = props.patientInfo;
  const selected = printSelectedSections.value;
  const order = printSectionOrder.value;
  const orderedSections = [...selected].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  const container = printDocRef.value;
  if (!record || !container) {
    message.error('无法获取打印区域');
    return;
  }
  container.innerHTML = buildPrintDocumentHtml(record, patientInfo, orderedSections, printHeaderLogoUrl.value);
  await nextTick();
  await new Promise(r => setTimeout(r, 300));
  if (orderedSections.includes('analysis') && props.examinationRecords?.length) {
    await initPrintAnalysisChart(container, props.examinationRecords);
  }
  const headerEl = container.querySelector('.print-doc-header');
  const patientEl = container.querySelector('.print-doc-patient');
  const bodyEl = container.querySelector('.print-doc-body');
  const headerHeightPx = headerEl ? headerEl.offsetHeight : 0;
  const patientHeightPx = patientEl ? patientEl.offsetHeight : 0;
  const bodyStartY = headerHeightPx + patientHeightPx;
  const bodyHeightPx = bodyEl ? Math.max(0, bodyEl.scrollHeight) : 0;
  const images = container.querySelectorAll('img');
  await Promise.all(Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; setTimeout(resolve, 3000); });
  }));
  await new Promise(r => setTimeout(r, 150));
  // 页眉 logo 与 wrap 同时按宽高比设尺寸，避免 80×48 盒子导致 html2canvas 截出拉伸图
  const logoImg = container.querySelector('.print-doc-logo');
  if (logoImg && logoImg instanceof HTMLImageElement && logoImg.naturalWidth && logoImg.naturalHeight) {
    const nw = logoImg.naturalWidth;
    const nh = logoImg.naturalHeight;
    const maxW = 72;
    const maxH = 40;
    let w = maxW;
    let h = maxH;
    if (nw / nh > maxW / maxH) {
      h = Math.max(1, Math.round(maxW * nh / nw));
    } else {
      w = Math.max(1, Math.round(maxH * nw / nh));
    }
    logoImg.style.width = w + 'px';
    logoImg.style.height = h + 'px';
    logoImg.style.maxWidth = w + 'px';
    logoImg.style.maxHeight = h + 'px';
    const wrap = logoImg.closest('.print-doc-logo-wrap');
    if (wrap && wrap instanceof HTMLElement) {
      wrap.style.width = w + 'px';
      wrap.style.height = h + 'px';
      wrap.style.minWidth = w + 'px';
      wrap.style.minHeight = h + 'px';
    }
  }
  message.loading('正在生成 A4 打印内容（智能分页）...', 0);
  try {
    const SCALE = 2;
    const pdfWidth = 595;
    const pdfHeight = 842;
    const contentWidth = container.offsetWidth || PRINT_DOC_WIDTH;
    const pageContentHeightPx = Math.max(200, contentWidth * (pdfHeight / pdfWidth) - PRINT_FOOTER_HEIGHT_PX - headerHeightPx - patientHeightPx);
    const pageRanges = getSmartPageRanges(container, bodyHeightPx, pageContentHeightPx, { bodyStartY, bodyHeightPx, breakAfterBlockIndices: printBreakAfterBlockIndices.value });
    const canvas = await html2canvas(container, {
      scale: SCALE,
      useCORS: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc, clonedEl) => {
        replaceCrossOriginImagesWithPlaceholder(clonedEl);
      }
    });
    const totalPages = pageRanges.length;
    const headerSlice = headerHeightPx > 0 ? sliceCanvas(canvas, 0, headerHeightPx, SCALE) : null;
    const patientSlice = patientHeightPx > 0 ? sliceCanvas(canvas, headerHeightPx, headerHeightPx + patientHeightPx, SCALE) : null;
    let patientShortSlice = null;
    let patientShortHeightPx = 0;
    const patientShortEl = container.querySelector('.print-doc-patient-short');
    if (patientShortEl && totalPages > 1) {
      patientShortHeightPx = patientShortEl.offsetHeight;
      patientShortSlice = await html2canvas(patientShortEl, {
        scale: SCALE,
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
    }
    const logoUrlForWatermark = printHeaderLogoUrl.value || '';
    const pdf = new jsPDF('p', 'pt', 'a4');
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();
      const [startY, endY] = pageRanges[i];
      const bodySlice = sliceCanvas(canvas, bodyStartY + startY, bodyStartY + endY, SCALE);
      const usePatientSlice = (i === 0 || !patientShortSlice) ? patientSlice : patientShortSlice;
      const usePatientHeightPx = (i === 0 || !patientShortSlice) ? patientHeightPx : patientShortHeightPx;
      const fullPage = await makeFullPageCanvasWithHeaderFooter(headerSlice, usePatientSlice, bodySlice, headerHeightPx, usePatientHeightPx, i, totalPages, SCALE, logoUrlForWatermark);
      pdf.addImage(fullPage.toDataURL('image/png', 0.95), 'PNG', 0, 0, pdfWidth, pdfHeight);
    }
    message.destroy();
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);

    if (window.require && window.require('electron')) {
      try {
        const { ipcRenderer } = window.require('electron');
        const pagesArray = [];
        for (let idx = 0; idx < pageRanges.length; idx++) {
          const [startY, endY] = pageRanges[idx];
          const bodySlice = sliceCanvas(canvas, bodyStartY + startY, bodyStartY + endY, SCALE);
          const usePatientSlice = (idx === 0 || !patientShortSlice) ? patientSlice : patientShortSlice;
          const usePatientHeightPx = (idx === 0 || !patientShortSlice) ? patientHeightPx : patientShortHeightPx;
          const fullPage = await makeFullPageCanvasWithHeaderFooter(headerSlice, usePatientSlice, bodySlice, headerHeightPx, usePatientHeightPx, idx, totalPages, SCALE, logoUrlForWatermark);
          pagesArray.push({ qrCodeUrl: fullPage.toDataURL('image/png', 0.95) });
        }
        await ipcRenderer.invoke('print-qrcode', pagesArray);
        message.success('已在浏览器中打开打印页面，请选择 A4 纸张并打印全部页');
        URL.revokeObjectURL(url);
        handleCloseExaminationReportPrint();
        return;
      } catch (e) {
        console.warn('Electron 打印失败，改用新窗口打印', e);
      }
    }

    // 浏览器：新窗口打开 PDF 后调起打印
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => { try { printWindow.print(); } catch (err) {} };
      setTimeout(() => { try { printWindow.print(); } catch (err) {} }, 1200);
      message.success('已打开打印对话框，请选择 A4 纸张并打印全部页');
    } else {
      // 弹窗被拦截时：在当前页用 iframe 加载 PDF 并调起浏览器打印
      try {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
        document.body.appendChild(iframe);
        iframe.onload = () => {
          try {
            iframe.contentWindow?.print();
            message.success('已调起浏览器打印，请选择 A4 纸张并打印全部页');
          } catch (e) {
            fallbackSavePdf();
          }
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        };
        iframe.src = url;
      } catch (e) {
        fallbackSavePdf();
      }
      function fallbackSavePdf() {
        message.warning('无法调起打印，已为您保存 PDF，可在本地打开后打印。');
        pdf.save((props.patientInfo?.name || '患者') + '_' + dayjs(props.currentRecord?.examination_date).format('YYYY-MM-DD') + '_检查报告.pdf');
        URL.revokeObjectURL(url);
      }
    }
    handleCloseExaminationReportPrint();
  } catch (error) {
    message.destroy();
    console.error('打印失败:', error);
    message.error('打印失败: ' + (error?.message || error));
  }
};

// 判断字段是否有值（包括0值）
const hasFieldValue = (value) => {
  // 处理null、undefined、空字符串
  if (value === null || value === undefined || value === '') {
    return false;
  }
  // 处理字符串：去除空白后检查是否为空
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  // 处理数组：空数组视为无值
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  // 处理对象：空对象视为无值
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return false;
  }
  // 其他情况：有值就返回true
  return true;
};

// 辅助函数：检查值是否为有效的图片路径（统一使用，避免重复定义）
const isValidImagePath = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }
  // 排除无效值字符串（包括常见的无效值）
  const invalidValues = ['null', 'undefined', 'false', '0', 'none', '否', '无', '', ' ', 'null', 'Null', 'NULL', 'undefined', 'Undefined'];
  if (invalidValues.includes(trimmed)) {
    return false;
  }
  // 必须看起来像有效的路径或URL（至少10个字符，包含路径分隔符或http）
  // 有效路径示例: /media/xxx.jpg, http://..., https://..., /static/xxx.png
  if (trimmed.length < 10) {
    return false;
  }
  // 检查是否包含路径特征
  const hasPathFeatures = trimmed.includes('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://');
  if (!hasPathFeatures) {
    return false;
  }
  return true;
};

// 判断页面（父容器）是否有数据（用于查看模式下隐藏空的父容器）
const hasPageData = (pageKey, record) => {
  if (!record) return false;
  
  switch (pageKey) {
    case 'page-2': // routine 页面
      // routine 包含：基础检查、视力检查、电脑验光检查、主观验光检查
      return (
        // 基础检查（仅身高、体重、眼压；CCT 不参与，与概览一致）
        hasMeaningfulRoutineValue(record.height) || hasMeaningfulRoutineValue(record.weight) ||
        hasMeaningfulRoutineValue(record.right_intraocular_pressure) || hasMeaningfulRoutineValue(record.left_intraocular_pressure) ||
        // 视力检查
        hasFieldValue(record.right_eye_vision) || hasFieldValue(record.left_eye_vision) ||
        hasFieldValue(record.right_eye_old_vision) || hasFieldValue(record.left_eye_old_vision) ||
        hasFieldValue(record.uva_right_vision) || hasFieldValue(record.uva_left_vision) ||
        hasFieldValue(record.uva_both_vision) ||
        hasFieldValue(record.vaec_right_old_vision) || hasFieldValue(record.vaec_left_old_vision) ||
        hasFieldValue(record.vaec_both_old_vision) ||
        hasFieldValue(record.near_uva_right_vision) || hasFieldValue(record.near_uva_left_vision) ||
        hasFieldValue(record.near_uva_both_vision) ||
        hasFieldValue(record.near_subjective_right_old_vision) || hasFieldValue(record.near_subjective_left_old_vision) ||
        hasFieldValue(record.near_subjective_both_old_vision) ||
        hasFieldValue(record.vaec_right_spherical) || hasFieldValue(record.vaec_left_spherical) ||
        hasFieldValue(record.vaec_right_cylindrical) || hasFieldValue(record.vaec_left_cylindrical) ||
        hasFieldValue(record.vaec_right_axis) || hasFieldValue(record.vaec_left_axis) ||
        hasFieldValue(record.vaec_both_pupil_distance) ||
        hasFieldValue(record.vaec_right_glasses_type) || hasFieldValue(record.vaec_left_glasses_type) ||
        // 客观验光检查
        hasFieldValue(record.objective_right_spherical) || hasFieldValue(record.objective_left_spherical) ||
        hasFieldValue(record.objective_right_cylindrical) || hasFieldValue(record.objective_left_cylindrical) ||
        hasFieldValue(record.objective_right_axis) || hasFieldValue(record.objective_left_axis) ||
        hasFieldValue(record.retinoscopy_right_eye_spherical) || hasFieldValue(record.retinoscopy_left_eye_spherical) ||
        hasFieldValue(record.retinoscopy_right_eye_cylindrical) || hasFieldValue(record.retinoscopy_left_eye_cylindrical) ||
        hasFieldValue(record.retinoscopy_right_eye_axis) || hasFieldValue(record.retinoscopy_left_eye_axis) ||
        hasFieldValue(record.pupillary_objective_right_spherical) || hasFieldValue(record.pupillary_objective_left_spherical) ||
        hasFieldValue(record.pupillary_objective_right_cylindrical) || hasFieldValue(record.pupillary_objective_left_cylindrical) ||
        hasFieldValue(record.pupillary_objective_right_axis) || hasFieldValue(record.pupillary_objective_left_axis) ||
        hasFieldValue(record.pupillary_objective_right_pupil) || hasFieldValue(record.pupillary_objective_left_pupil) ||
        // 主观验光检查
        hasFieldValue(record.subjective_right_spherical) || hasFieldValue(record.subjective_left_spherical) ||
        hasFieldValue(record.subjective_right_cylindrical) || hasFieldValue(record.subjective_left_cylindrical) ||
        hasFieldValue(record.subjective_right_axis) || hasFieldValue(record.subjective_left_axis) ||
        hasFieldValue(record.subjective_right_old_vision) || hasFieldValue(record.subjective_left_old_vision) ||
        hasFieldValue(record.subjective_both_old_vision) ||
        hasFieldValue(record.subjective_right_near_vision) || hasFieldValue(record.subjective_left_near_vision) ||
        hasFieldValue(record.subjective_both_near_vision) ||
        hasFieldValue(record.subjective_right_near_add_power) || hasFieldValue(record.subjective_left_near_add_power) ||
        hasFieldValue(record.subjective_both_pupil_distance) ||
        hasFieldValue(record.pupillary_subjective_right_spherical) || hasFieldValue(record.pupillary_subjective_left_spherical) ||
        hasFieldValue(record.pupillary_subjective_right_cylindrical) || hasFieldValue(record.pupillary_subjective_left_cylindrical) ||
        hasFieldValue(record.pupillary_subjective_right_axis) || hasFieldValue(record.pupillary_subjective_left_axis) ||
        hasFieldValue(record.dominant_eye)
      );
    case 'page-3': // biometry 页面
      // biometry 包含：生物测量仪检查
      return (
        hasFieldValue(record.right_eye_axial_length) || hasFieldValue(record.left_eye_axial_length) ||
        hasFieldValue(record.right_eye_k1) || hasFieldValue(record.left_eye_k1) ||
        hasFieldValue(record.right_eye_k2) || hasFieldValue(record.left_eye_k2) ||
        hasFieldValue(record.right_cct) || hasFieldValue(record.left_cct) ||
        hasFieldValue(record.right_anterior_chamber_depth) || hasFieldValue(record.left_anterior_chamber_depth) ||
        hasFieldValue(record.right_lens_thickness) || hasFieldValue(record.left_lens_thickness) ||
        hasFieldValue(record.right_vitreous_space_thickness) || hasFieldValue(record.left_vitreous_space_thickness) ||
        hasFieldValue(record.right_oct_fovea) || hasFieldValue(record.left_oct_fovea)
      );
    case 'page-4': // functional 页面
      // functional 包含：眼位和聚散检查、调节检查、其他相关检查、同视机检查
      return (
        // 眼位和聚散检查
        hasFieldValue(record.pli_exo_distance_lateral_phoria) || hasFieldValue(record.plo_eso_distance_lateral_phoria) ||
        hasFieldValue(record.pli_exo_near_lateral_phoria) || hasFieldValue(record.plo_eso_near_lateral_phoria) ||
        hasFieldValue(record.fusional_convergence_distance_blur) || hasFieldValue(record.fusional_convergence_distance_break) ||
        hasFieldValue(record.fusional_convergence_distance_recovery) ||
        hasFieldValue(record.fusional_convergence_near_blur) || hasFieldValue(record.fusional_convergence_near_break) ||
        hasFieldValue(record.fusional_convergence_near_recovery) ||
        hasFieldValue(record.fusional_disvergence_distance_blur) || hasFieldValue(record.fusional_disvergence_distance_break) ||
        hasFieldValue(record.fusional_disvergence_distance_recovery) ||
        hasFieldValue(record.fusional_disvergence_near_blur) || hasFieldValue(record.fusional_disvergence_near_break) ||
        hasFieldValue(record.fusional_disvergence_near_recovery) ||
        // 调节检查
        hasFieldValue(record.positive_relative_accommodation_blur) || hasFieldValue(record.positive_relative_accommodation_recovery) ||
        hasFieldValue(record.negative_relative_accommodation_blur) || hasFieldValue(record.negative_relative_accommodation_recovery) ||
        hasFieldValue(record.accommodative_amplitude_right) || hasFieldValue(record.accommodative_amplitude_left) ||
        hasFieldValue(record.accommodation_amplitude_style) ||
        hasFieldValue(record.accommodative_facility) || hasFieldValue(record.accommodative_response) ||
        // 其他相关检查
        hasFieldValue(record.worth_4_type) || hasFieldValue(record.stereopsis_testing) ||
        hasFieldValue(record.aniseikonia) || hasFieldValue(record.alternate_cover_test) ||
        // 同视机检查
        hasFieldValue(record.synoptophore_grade_I) || hasFieldValue(record.synoptophore_grade_II) ||
        hasFieldValue(record.synoptophore_grade_III)
      );
    case 'page-6': // analysis 页面（结果分析）
      // 结果分析页面：只要有检查记录就可以显示，不依赖特定字段
      return true;
    case 'page-5': { // img 页面
      // img 包含：角膜地形图、眼底照相、眼底OCT（包括双眼和多图模式）
      // 检查OCT多图模式
      if (record.images?.oct && Array.isArray(record.images.oct) && record.images.oct.length > 0) {
        const hasAnyOctData = record.images.oct.some(img => 
          img.eye === 'R' || img.eye === 'L' || img.eye === 'B'
        );
        if (hasAnyOctData) {
          return true;
        }
      }
      // 检查角膜地形图：包括所有字段和images对象中的图片（严格检查）
      const cornealTopographyFields = [
        'right_corneal_topography_first', 'left_corneal_topography_first',
        'right_corneal_topography_second', 'left_corneal_topography_second',
        'right_corneal_topography_third', 'left_corneal_topography_third',
        'doble_corneal_topography_first', 'doble_corneal_topography_second', 'doble_corneal_topography_third'
      ];
      
      const hasCornealTopographyField = cornealTopographyFields.some(field => {
        const value = record[field];
        return isValidImagePath(value);
      });
      
      // 检查images对象中的地形图数据，确保数组中有有效的图片路径
      let hasCornealTopographyInImages = false;
      if (record.images) {
        // 检查corneal_topography数组
        if (record.images.corneal_topography && Array.isArray(record.images.corneal_topography) && record.images.corneal_topography.length > 0) {
          // 验证数组中至少有一个有效的图片路径
          hasCornealTopographyInImages = record.images.corneal_topography.some(img => {
            if (typeof img === 'string') {
              return isValidImagePath(img);
            } else if (img && typeof img === 'object' && img.path) {
              return isValidImagePath(img.path);
            }
            return false;
          });
        }
        // 如果corneal_topography没有有效数据，检查topography数组
        if (!hasCornealTopographyInImages && record.images.topography && Array.isArray(record.images.topography) && record.images.topography.length > 0) {
          hasCornealTopographyInImages = record.images.topography.some(img => {
            if (typeof img === 'string') {
              return isValidImagePath(img);
            } else if (img && typeof img === 'object' && img.path) {
              return isValidImagePath(img.path);
            }
            return false;
          });
        }
      }
      // 检查其他检查（images.other）
      const hasOtherImages = record.images?.other && Array.isArray(record.images.other) && record.images.other.length > 0 &&
        record.images.other.some(img => img && img.url && img.url.trim() !== '');
      
      // 检查其他影像数据
      return (
        hasCornealTopographyField || hasCornealTopographyInImages ||
        hasFieldValue(record.fundus_photo_right_path) || hasFieldValue(record.fundus_photo_left_path) ||
        hasFieldValue(record.fundus_photo_doble_path) ||
        hasFieldValue(record.oct_photo_right_path) || hasFieldValue(record.oct_photo_left_path) || 
        hasFieldValue(record.oct_photo_doble_path) ||
        hasOtherImages
      );
    }
    default:
      return true;
  }
};

// 判断板块是否有值（用于查看模式下隐藏空板块）
const hasSectionData = (sectionKey, record) => {
  if (!record) return false;
  
  switch (sectionKey) {
    case 'doctor-instructions':
      // 医生建议：只要有当前检查记录就作为可打印模块（内容可为空显示「暂无」）
      return true;
    case 'treatment-plan':
      // 诊疗方案：有任一治疗方案就显示
      return !!(
        record.right_atropine || record.left_atropine ||
        record.right_glasses || record.left_glasses ||
        record.right_hg || record.left_hg ||
        record.right_physiotherapy || record.left_physiotherapy ||
        record.right_visual_training || record.left_visual_training
      );
    case 'routine':
      // routine板块：仅身高、体重、眼压（CCT 不参与，与概览一致）
      return (
        hasMeaningfulRoutineValue(record.height) || hasMeaningfulRoutineValue(record.weight) ||
        hasMeaningfulRoutineValue(record.right_intraocular_pressure) || hasMeaningfulRoutineValue(record.left_intraocular_pressure)
      );
    case 'vision':
      // 视力检查：有任一视力数据就显示
      return !!(
        record.right_eye_vision || record.left_eye_vision ||
        record.right_eye_old_vision || record.left_eye_old_vision ||
        record.uva_right_vision || record.uva_left_vision ||
        record.vaec_right_old_vision || record.vaec_left_old_vision
      );
    case 'objective-refraction':
      // 客观验光检查：有任一客观验光数据就显示
      return !!(
        record.objective_right_spherical || record.objective_left_spherical ||
        record.objective_right_cylindrical || record.objective_left_cylindrical ||
        record.objective_right_axis || record.objective_left_axis ||
        record.retinoscopy_right_eye_spherical || record.retinoscopy_left_eye_spherical ||
        record.retinoscopy_right_eye_cylindrical || record.retinoscopy_left_eye_cylindrical ||
        record.pupillary_objective_right_spherical || record.pupillary_objective_left_spherical ||
        record.pupillary_objective_left_spherical
      );
    case 'subjective-refraction':
      // 主观验光检查：有任一主观验光数据就显示
      return !!(
        record.subjective_right_spherical || record.subjective_left_spherical ||
        record.subjective_right_cylindrical || record.subjective_left_cylindrical ||
        record.subjective_right_axis || record.subjective_left_axis ||
        record.subjective_right_old_vision || record.subjective_left_old_vision ||
        record.pupillary_subjective_right_spherical || record.pupillary_subjective_left_spherical ||
        record.pupillary_subjective_right_cylindrical || record.pupillary_subjective_left_cylindrical
      );
    case 'functional':
      // functional板块包含：眼位和聚散检查、AC/A、调节检查、其他相关检查、同视机检查
      // 只要任一子板块有数据就显示（含简写字段 eye_position、aca_ratio，与打印表一致）
      return !!(
        record.eye_position || record.aca_ratio ||
        // 眼位和聚散检查
        record.pli_exo_distance_lateral_phoria || record.plo_eso_distance_lateral_phoria ||
        record.pli_exo_near_lateral_phoria || record.plo_eso_near_lateral_phoria ||
        record.fusional_convergence_distance_blur || record.fusional_convergence_near_blur ||
        record.fusional_convergence_distance_break || record.fusional_convergence_near_break ||
        record.fusional_disvergence_distance_blur || record.fusional_disvergence_near_blur ||
        // 调节检查
        record.positive_relative_accommodation || record.negative_relative_accommodation ||
        record.accommodative_amplitude_right || record.accommodative_amplitude_left ||
        record.accommodative_facility || record.accommodative_response ||
        // 其他相关检查
        record.worth_4_type || record.stereopsis_testing || record.aniseikonia ||
        record.alternate_cover_test ||
        // 同视机检查
        record.synoptophore_grade_I || record.synoptophore_grade_II || record.synoptophore_grade_III
      );
    case 'eye-position':
      // 眼位和聚散检查：有任一眼位或聚散数据就显示
      return !!(
        record.pli_exo_distance_lateral_phoria || record.plo_eso_distance_lateral_phoria ||
        record.pli_exo_near_lateral_phoria || record.plo_eso_near_lateral_phoria ||
        record.fusional_convergence_distance_blur || record.fusional_convergence_near_blur ||
        record.fusional_convergence_distance_break || record.fusional_convergence_near_break ||
        record.fusional_disvergence_distance_blur || record.fusional_disvergence_near_blur
      );
    case 'accommodation':
      // 调节检查：有任一调节数据就显示
      return !!(
        record.positive_relative_accommodation || record.negative_relative_accommodation ||
        record.accommodative_amplitude_right || record.accommodative_amplitude_left ||
        record.accommodative_facility || record.accommodative_response
      );
    case 'other-related':
      // 其他相关检查：有任一相关数据就显示
      return !!(
        record.worth_4_type || record.stereopsis_testing || record.aniseikonia ||
        record.alternate_cover_test
      );
    case 'synoptophore':
      // 同视机检查：有任一同视机数据就显示
      return !!(
        record.synoptophore_grade_I || record.synoptophore_grade_II || record.synoptophore_grade_III
      );
    case 'img': {
      // 影像检查：有任一影像数据就显示（包含三个子板块：角膜地形图、眼底照相、眼底OCT）
      // 使用与各子section相同的严格检查逻辑
      
      // 检查角膜地形图（使用严格验证）
      const topographyFields = [
        'right_corneal_topography_first', 'left_corneal_topography_first',
        'right_corneal_topography_second', 'left_corneal_topography_second',
        'right_corneal_topography_third', 'left_corneal_topography_third',
        'doble_corneal_topography_first', 'doble_corneal_topography_second', 'doble_corneal_topography_third'
      ];
      const hasTopographyField = topographyFields.some(field => isValidImagePath(record[field]));
      
      // 检查images对象中的地形图数据，确保数组中有有效的图片路径
      let hasTopographyInImages = false;
      if (record.images) {
        // 检查corneal_topography数组
        if (record.images.corneal_topography && Array.isArray(record.images.corneal_topography) && record.images.corneal_topography.length > 0) {
          // 验证数组中至少有一个有效的图片路径
          hasTopographyInImages = record.images.corneal_topography.some(img => {
            if (typeof img === 'string') {
              return isValidImagePath(img);
            } else if (img && typeof img === 'object' && img.path) {
              return isValidImagePath(img.path);
            }
            return false;
          });
        }
        // 如果corneal_topography没有有效数据，检查topography数组
        if (!hasTopographyInImages && record.images.topography && Array.isArray(record.images.topography) && record.images.topography.length > 0) {
          hasTopographyInImages = record.images.topography.some(img => {
            if (typeof img === 'string') {
              return isValidImagePath(img);
            } else if (img && typeof img === 'object' && img.path) {
              return isValidImagePath(img.path);
            }
            return false;
          });
        }
      }
      
      const hasTopography = hasTopographyField || hasTopographyInImages;
      
      // 检查眼底照相（使用hasFieldValue）
      const hasFundus = hasFieldValue(record.fundus_photo_right_path) || 
        hasFieldValue(record.fundus_photo_left_path) ||
        hasFieldValue(record.fundus_photo_doble_path);
      
      // 检查眼底OCT（使用hasFieldValue和images检查）
      const hasOct = hasFieldValue(record.oct_photo_right_path) || 
        hasFieldValue(record.oct_photo_left_path) || 
        hasFieldValue(record.oct_photo_doble_path) ||
        (record.images?.oct && Array.isArray(record.images.oct) && record.images.oct.length > 0);
      
      // 检查其他检查（images.other）
      const hasOtherImages = record.images?.other && Array.isArray(record.images.other) && record.images.other.length > 0 &&
        record.images.other.some(img => img && img.url && img.url.trim() !== '');
      
      return hasTopography || hasFundus || hasOct || hasOtherImages;
    }
    case 'analysis':
      // 结果分析：只要有当前检查记录就作为可打印模块（内容可为空显示「暂无」）
      return true;
    case 'biometry':
      // 生物测量仪检查：有任一生物测量数据就显示
      return !!(
        record.right_eye_axial_length || record.left_eye_axial_length ||
        record.right_eye_k1 || record.left_eye_k1 ||
        record.right_eye_k2 || record.left_eye_k2 ||
        record.right_cct || record.left_cct ||
        record.right_anterior_chamber_depth || record.left_anterior_chamber_depth ||
        record.right_lens_thickness || record.left_lens_thickness ||
        record.right_vitreous_space_thickness || record.left_vitreous_space_thickness ||
        record.right_oct_fovea || record.left_oct_fovea
      );
    case 'img-topography': {
      // 角膜地形图检查：严格检查所有可能的地形图字段和images对象
      const topographyFields = [
        'right_corneal_topography_first', 'left_corneal_topography_first',
        'right_corneal_topography_second', 'left_corneal_topography_second',
        'right_corneal_topography_third', 'left_corneal_topography_third',
        'doble_corneal_topography_first', 'doble_corneal_topography_second', 'doble_corneal_topography_third'
      ];
      
      const hasTopographyField = topographyFields.some(field => {
        const value = record[field];
        return isValidImagePath(value);
      });
      
      // 检查images对象中的地形图数据，确保数组中有有效的图片路径
      let hasTopographyInImages = false;
      if (record.images) {
        // 检查corneal_topography数组
        if (record.images.corneal_topography && Array.isArray(record.images.corneal_topography) && record.images.corneal_topography.length > 0) {
          // 验证数组中至少有一个有效的图片路径
          hasTopographyInImages = record.images.corneal_topography.some(img => {
            if (typeof img === 'string') {
              return isValidImagePath(img);
            } else if (img && typeof img === 'object' && img.path) {
              return isValidImagePath(img.path);
            }
            return false;
          });
        }
        // 如果corneal_topography没有有效数据，检查topography数组
        if (!hasTopographyInImages && record.images.topography && Array.isArray(record.images.topography) && record.images.topography.length > 0) {
          hasTopographyInImages = record.images.topography.some(img => {
            if (typeof img === 'string') {
              return isValidImagePath(img);
            } else if (img && typeof img === 'object' && img.path) {
              return isValidImagePath(img.path);
            }
            return false;
          });
        }
      }
      
      return hasTopographyField || hasTopographyInImages;
    }
    case 'img-fundus':
      // 眼底照相检查：有任一眼底照相数据就显示（包括右眼、左眼、双眼）
      return (
        hasFieldValue(record.fundus_photo_right_path) || 
        hasFieldValue(record.fundus_photo_left_path) ||
        hasFieldValue(record.fundus_photo_doble_path)
      );
    case 'img-oct':
      // 眼底OCT检查：有任一OCT数据就显示（包括右眼、左眼、双眼）
      // 检查新的多图模式
      if (record.images?.oct && Array.isArray(record.images.oct) && record.images.oct.length > 0) {
        return true;
      }
      // 检查旧的单图模式（包括双眼）
      return !!(
        record.oct_photo_right_path || 
        record.oct_photo_left_path || 
        record.oct_photo_doble_path
      );
    case 'img-other':
      // 其他检查：检查 images.other 数组
      if (record.images?.other && Array.isArray(record.images.other) && record.images.other.length > 0) {
        // 检查是否有任何图片有有效的 url
        return record.images.other.some(img => img && img.url && img.url.trim() !== '');
      }
      return false;
    default:
      return true;
  }
};

// 根据当前记录数据，过滤出有数据的打印板块选项
const availablePrintSections = computed(() => {
  if (!props.currentRecord) return [];
  return printSectionOptions.filter(option => hasSectionData(option.key, props.currentRecord));
});

// 预览左侧模块列表顺序（仅包含当前可用的 key），用于拖拽与展示
const printSidebarOrderedKeys = computed(() => {
  const available = availablePrintSections.value;
  const keys = available.map(o => o.key);
  return printSectionOrder.value.filter(key => keys.includes(key));
});

// 拖拽排序：交换/移动顺序并刷新预览
const onPrintSectionDragStart = (index) => {
  printDragFromIndex.value = index;
};
const onPrintSectionDragOver = (e) => {
  e.preventDefault();
};
const onPrintSectionDrop = (e, toIndex) => {
  e.preventDefault();
  const from = printDragFromIndex.value;
  if (from < 0 || from === toIndex) {
    printDragFromIndex.value = -1;
    return;
  }
  const keys = [...printSectionOrder.value];
  const keySet = new Set(availablePrintSections.value.map(o => o.key));
  const ordered = keys.filter(k => keySet.has(k));
  const fromKey = ordered[from];
  if (fromKey == null) {
    printDragFromIndex.value = -1;
    return;
  }
  ordered.splice(from, 1);
  ordered.splice(toIndex, 0, fromKey);
  printSectionOrder.value = ordered;
  printDragFromIndex.value = -1;
  refreshPrintPreviewImage();
};
const getPrintSectionTitle = (key) => availablePrintSections.value.find(o => o.key === key)?.title ?? key;

// 连续显示模式：返回所有页面（除了第一页overview，因为已经单独处理）
// 注意：现在板块的显示/隐藏由子组件内部处理，这里不再过滤
const styleTwoPages = computed(() => {
  const sectionMap = new Map(styleTwoSectionList.value.map(section => [section.key, section]));
  const pages = pageLayoutConfig
    .map(layout => {
      const pageSections = layout.sections
        .map(key => sectionMap.get(key))
        .filter(Boolean);
      return {
        key: layout.key,
        sections: pageSections
      };
    })
    .filter(page => page.sections.length);
  return pages;
});
</script>

<style scoped lang="scss">
/* 患者主页根：固定高度，与 main 可见视窗一致，下缘不超出；顶部与下方共用变量保证总宽一致 */
.style-two-root {
  --layout-padding-x: clamp(24px, 3vw, 48px);
  --layout-gap: clamp(8px, 1vw, 14px);
  width: 100%;
  max-width: 100%;
  height: calc(100vh - 280px);
  max-height: calc(100vh - 280px);
  min-height: 360px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
  /* 美化背景 */
  background: 
    /* 主渐变背景 */
    linear-gradient(135deg, #f5f7fa 0%, #e8edf5 25%, #f0f4ff 50%, #f5f7fa 75%, #ffffff 100%),
    /* 微妙的网格图案 */
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(34, 75, 150, 0.02) 2px,
      rgba(34, 75, 150, 0.02) 4px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(34, 75, 150, 0.02) 2px,
      rgba(34, 75, 150, 0.02) 4px
    ),
    /* 装饰性圆形图案 */
    radial-gradient(circle at 20% 30%, rgba(34, 75, 150, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(74, 123, 200, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(107, 163, 232, 0.02) 0%, transparent 60%);
  background-size: 
    100% 100%,
    40px 40px,
    40px 40px,
    600px 600px,
    500px 500px,
    800px 800px;
  background-position:
    0 0,
    0 0,
    0 0,
    -100px -100px,
    calc(100% + 50px) calc(100% - 50px),
    center center;
  background-attachment: fixed;
}

// 顶部栏：左右比例及间距与下方 style-two-layout 一致
.top-bar-unified {
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: clamp(330px, 30vw, 560px) minmax(0, 1fr);
  gap: var(--layout-gap);
  padding: 8px var(--layout-padding-x) 10px;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(34, 75, 150, 0.08);
  border: 1px solid rgba(226, 114, 68, 0.1);
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

.top-bar-left {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
}

.top-bar-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  min-width: 0;
}

.top-bar-right .top-bar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.top-bar-right .top-bar-nav-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  min-width: 0;
  width: 100%;
}

.top-bar-nav-buttons::-webkit-scrollbar {
  height: 3px;
}

.top-bar-nav-buttons::-webkit-scrollbar-thumb {
  background: rgba(34, 75, 150, 0.2);
  border-radius: 2px;
}

/* 患者基本信息：无底色，两行三列，label 列垂直对齐 */
.top-bar-info-inner {
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 6px 48px;
  padding: 0;
  margin: 0;
  align-content: start;
}

.top-bar-info-inner .info-row {
  display: contents;
}

.top-bar-info-inner .info-item {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
  white-space: nowrap;
  min-width: 0;
}

.top-bar-info-inner .info-label {
  text-align: left;
  color: #64748b;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 400;
}

/* 每列 label 统一最小宽度，实现垂直对齐：列1 姓名/年龄，列2 性别/患者编号，列3 出生年月/档案编号 */
.top-bar-info-inner .info-item:nth-child(1) .info-label,
.top-bar-info-inner .info-item:nth-child(4) .info-label {
  min-width: 2.5em;
  display: inline-block;
}
.top-bar-info-inner .info-item:nth-child(2) .info-label,
.top-bar-info-inner .info-item:nth-child(5) .info-label {
  min-width: 5em;
  display: inline-block;
}
.top-bar-info-inner .info-item:nth-child(3) .info-label,
.top-bar-info-inner .info-item:nth-child(6) .info-label {
  min-width: 5em;
  display: inline-block;
}

.top-bar-info-inner .info-colon {
  margin: 0 2px 0 0;
  color: #94a3b8;
  flex-shrink: 0;
  font-size: 14px;
}

.top-bar-info-inner .info-value {
  color: #1e293b;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.02em;
}

.top-bar-info-inner .info-value-id {
  color: #224b96;
  font-weight: 600;
  font-size: 15px;
  font-family: inherit;
}

.top-bar-actions {
  font-size: 13px;
}

.top-bar-nav-btn,
.action-btn-text {
  font-size: 13px !important;
  padding: 0 10px !important;
  height: 28px !important;
  line-height: 26px !important;
}

/* 左右两列区域：无左右 padding，使 aside 左侧、content 右侧与 layout 左右缘对齐，中间间隙不变 */
.style-two-layout {
  display: grid;
  grid-template-columns: clamp(330px, 30vw, 560px) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: var(--layout-gap);
  align-items: stretch;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0;
  box-sizing: border-box;
  padding: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 左侧栏：高度由 grid 限定，不随右侧变高，仅检查记录列表内部滚动 */
.style-two-side {
  min-height: 0;
  height: 100%;
  max-height: 100%;
  background: #ffffff;
  border-radius: clamp(10px, 1.2vw, 14px);
  box-shadow: 0 6px 24px rgba(34, 75, 150, 0.1);
  padding: clamp(8px, 1vw, 14px) clamp(12px, 1.2vw, 18px);
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 0.8vw, 10px);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  align-self: stretch;
}

/* 左侧栏上下分布：诊断记录固定，检查记录列表占据剩余高度并独立滚动 */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
}
.side-panel-diagnosis {
  flex: 0 1 auto;
  min-height: 164px; /* 原 140px + 一行（日期行）约 24px */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.side-panel-examination {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.side-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #224b96;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 4px;
  border-bottom: 1px solid #e0e6f5;
  flex-shrink: 0;
}
.side-panel-add-btn {
  padding: 0 4px;
  font-size: 12px;
}
/* 横向日期条：可横向滚动，点击切换当前诊断 */
.diagnosis-date-bar {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 0 6px;
  margin: 0 -2px;
  flex-shrink: 0;
  scrollbar-width: thin;
}
.diagnosis-date-bar::-webkit-scrollbar {
  height: 4px;
}
.diagnosis-date-bar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
}
.diagnosis-date-bar::-webkit-scrollbar-thumb {
  background: rgba(34, 75, 150, 0.3);
  border-radius: 2px;
}
.diagnosis-date-chip {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 12px;
  color: #5a6c7d;
  background: #f0f4f8;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid transparent;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.diagnosis-date-chip:hover {
  background: #e8eef5;
  color: #224b96;
}
.diagnosis-date-chip.active {
  background: #224b96;
  color: #fff;
  border-color: #224b96;
}
.diagnosis-list {
  flex: 1 1 0;
  min-height: 96px; /* 原 72px + 一行约 24px */
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-right: 4px;
}
.diagnosis-list::-webkit-scrollbar {
  width: 6px;
}
.diagnosis-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}
.diagnosis-list::-webkit-scrollbar-thumb {
  background: rgba(34, 75, 150, 0.3);
  border-radius: 3px;
}
.diagnosis-empty {
  color: #999;
  font-size: 13px;
  padding: 16px 0;
  text-align: center;
}
.diagnosis-entry {
  border-radius: 8px;
  background: #f8fafc;
  padding: 8px 10px;
  border: 1px solid #e8eef5;
  position: relative;
}
.diagnosis-entry-row {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  word-break: break-word;
}
.diagnosis-entry-date {
  font-size: 12px;
  color: #718096;
  margin-bottom: 6px;
  /* 第一行：诊断日期 */
}
.diagnosis-entry-detail {
  color: #2d3748;
  margin-bottom: 4px;
  /* 第二行：诊断详情 */
}
.diagnosis-entry-remarks-line {
  font-size: 12px;
  color: #718096;
  line-height: 1.5;
  /* 第二行：备注 */
}
.diagnosis-entry-remarks {
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
  line-height: 1.5;
}
.diagnosis-entry-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 2px;
}
.diagnosis-entry-actions .ant-btn {
  padding: 0 4px;
}

.patient-info-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: clamp(10px, 1.2vw, 14px);
  line-height: 1.6;
  font-size: clamp(13px, 1.3vw, 15px);
}

.patient-info-line .info-item {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  color: #2d3748;
}

.patient-info-line .info-label {
  color: #718096;
  font-weight: 500;
  margin-right: 4px;
  font-size: clamp(12px, 1.2vw, 14px);
}

.patient-info-line .info-value {
  color: #1a202c;
  font-weight: 600;
  font-size: clamp(13px, 1.3vw, 15px);
}

.patient-info-line .info-separator {
  color: #cbd5e0;
  font-weight: 300;
  margin: 0 2px;
  font-size: clamp(12px, 1.2vw, 14px);
  user-select: none;
}

.style-two-date-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.circular-btn {
  width: clamp(32px, 3.5vw, 40px);
  height: clamp(32px, 3.5vw, 40px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: clamp(14px, 1.8vw, 18px);
  border: 2px solid transparent;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.circular-btn:hover:not(.disabled) {
  background: #e2e8f0;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.circular-btn.active {
  background: linear-gradient(135deg, #E27244 0%, #E29D44 100%);
  color: #ffffff;
  border-color: #E27244;
  box-shadow: 0 4px 12px rgba(226, 114, 68, 0.4);
  transform: scale(1.1);
}

.circular-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f0f0f0;
  color: #bfbfbf;
}

.circular-btn.disabled:hover {
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}



/* 检查记录列表：独立滚动 */
.style-two-date-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  touch-action: pan-y;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scroll-behavior: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

.style-two-date-list::-webkit-scrollbar {
  width: 8px;
}

.style-two-date-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.style-two-date-list::-webkit-scrollbar-thumb {
  background: rgba(34, 75, 150, 0.3);
  border-radius: 4px;
}

.style-two-date-entry {
  border-radius: 10px;
  background: #f4f7ff;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  /* 移除固定高度，让高度自适应内容 */
  height: auto;
  min-height: auto;
  overflow: visible; /* 移除overflow限制，让内容自然显示 */
  word-wrap: break-word;
  /* 确保内容可以正常换行和扩展 */
  display: flex;
  flex-direction: column;
}

.style-two-date-entry.active {
  border-color: #ff6b35;
  background: #fff4f0;
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.3);
}

.style-two-date-entry:hover {
  transform: translateX(3px);
  box-shadow: 0 8px 24px rgba(34, 75, 150, 0.12);
}

// 第一行：检查日期、眼轴对比、功能按钮（压缩间距）
.entry-row-1 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding: 6px 8px;
  border-bottom: 1px solid #e0e6f5;
  border-radius: 8px;
  background: #e0e8f5;
  gap: 8px;
}

.entry-date {
  font-size: 15px;
  font-weight: 600;
  color: #224b96;
  flex-shrink: 0;
}

.entry-axial-comparison {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  flex: 1;
  justify-content: center;
  white-space: nowrap;
}

.entry-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.entry-action-btn {
  padding: 0 !important;
  width: 24px !important;
  height: 24px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px !important;
}

.comp-label {
  color: #666;
  font-weight: 500;
  margin-right: 2px;
}

.comp-value {
  color: #333;
  font-weight: 500;
  margin-right: 8px;
}

// 第二行：检查项目
.entry-row-2 {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 12px;
  line-height: 1.5;
  /* 确保可以正常换行，不会被截断 */
  overflow: visible;
  max-height: none;
}

.row-content {
  color: #333;
  flex: 1;
  word-break: break-word;
  /* 确保文本可以正常显示和换行 */
  white-space: normal;
  overflow: visible;
}

// 第三行：诊疗方案
.entry-row-3 {
  display: flex;
  align-items: flex-start;
  font-size: 12px;
  line-height: 1.5;
  /* 确保可以正常显示内容，不被截断 */
  overflow: visible;
  max-height: none;
}

.treatment-plan-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
  /* 确保内容可以正常显示和换行 */
  overflow: visible;
  flex-wrap: wrap;
}

.treatment-eye-item {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  line-height: 1.6;
  flex: 1;
}

.treatment-eye-right {
  justify-content: flex-start;
}

.treatment-eye-left {
  justify-content: flex-end;
}

.treatment-separator {
  color: #999;
  font-weight: 500;
  flex-shrink: 0;
  margin: 0 4px;
}

.eye-label-small {
  color: #224b96;
  font-weight: 500;
  flex-shrink: 0;
  min-width: 36px;
}

.eye-label-large {
  color: #8bb3e8;
  font-weight: 700;
  font-size: 20px;
  flex-shrink: 0;
  margin-right: 4px;
  line-height: 1;
  opacity: 0.7;
  display: inline-block;
  vertical-align: baseline;
}

.treatment-content {
  flex: 1;
  word-break: break-word;
  // 不设置默认颜色，让子元素自己控制颜色
  color: #333;
  /* 确保内容可以正常显示，不被截断 */
  overflow: visible;
  max-height: none;
  white-space: normal;
  
  // 确保标记样式优先级足够高
  :deep(.treatment-new) {
    color: #ff4d4f !important;
    font-weight: normal;
  }
  
  :deep(.treatment-deleted) {
    color: #999 !important;
    text-decoration: line-through;
  }
}

.treatment-empty {
  color: #999;
  font-style: italic;
}

.row-label {
  color: #666;
  font-weight: 500;
  flex-shrink: 0;
  min-width: 60px;
}

.row-content {
  color: #333;
  flex: 1;
  word-break: break-word;
}

// 全局样式（确保标记样式正确应用）
.treatment-new {
  color: #ff4d4f !important;
  font-weight: normal;
}

.treatment-deleted {
  color: #999 !important;
  text-decoration: line-through;
}

.axial-rise {
  color: #ff4d4f;
}

.axial-drop {
  color: #52c41a;
}

.axial-flat {
  color: #8c8c8c;
}

// 右侧悬浮窗已移到顶部导航栏，样式已移除

/* 右侧检查详情区域：严格限制在父容器内，超出则本区域内部滚动 */
.style-two-main {
  display: block;
  width: 100% !important;
  max-width: 100% !important;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  touch-action: pan-y;
  padding-right: clamp(4px, 0.5vw, 8px);
  box-sizing: border-box;
  position: relative;
  scroll-behavior: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  align-self: stretch;
  background: 
    linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.4) 100%
    );
}

.style-two-main::-webkit-scrollbar {
  width: 8px;
}

.style-two-main::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.style-two-main::-webkit-scrollbar-thumb {
  background: rgba(34, 75, 150, 0.3);
  border-radius: 4px;
}

.style-two-main::-webkit-scrollbar-thumb:hover {
  background: rgba(34, 75, 150, 0.5);
}

.style-two-content {
  display: block;
  width: 100%;
  max-width: 100%;
  /* 确保有足够高度让sticky生效 - 必须包含所有内容 */
  position: relative;
  text-align: center;
  box-sizing: border-box;
  /* 添加内容区域的背景，使内容更清晰（压缩间距） */
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 8px;
  margin: 0 auto;
  box-shadow: 
    0 4px 20px rgba(34, 75, 150, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

// 内容导航按钮栏
.nav-button {
  height: clamp(32px, 4vw, 36px);
  padding: 0 clamp(14px, 1.8vw, 18px);
  font-size: clamp(13px, 1.4vw, 14px);
  border-radius: 6px;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.nav-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.chart-buttons-bar-sticky {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  gap: clamp(6px, 0.8vw, 10px);
  padding: clamp(6px, 0.8vw, 10px) 0;
  width: 100%;
  max-width: min(250mm, 100%);
  margin: 0 auto clamp(6px, 0.8vw, 10px);
  box-sizing: border-box;
  justify-content: center;
  flex-wrap: wrap;
  background: #ffffff;
  border-bottom: 1px solid #e0e6f5;
  /* 确保sticky定位生效 */
  align-self: flex-start;
  /* 添加阴影增强视觉效果 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-btn {
  min-width: 100px;
  height: 38px;
  border-radius: 10px;
  font-weight: 500;
  font-size: 11.2px; // 16px * 0.7 = 11.2px (小30%)
  transition: all 0.3s ease;
  border: none;
  
  // 默认状态：淡蓝色背景
  &:not(.ant-btn-primary) {
    background: #e0e8f5;
    color: #224b96;
    
    &:hover {
      background: #d0d8e5;
      color: #224b96;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(34, 75, 150, 0.15);
    }
  }
  
  // 激活状态（primary）：更深的蓝色
  &.ant-btn-primary {
    background: #224b96;
    color: #FFFFFF;
    box-shadow: 0 2px 8px rgba(34, 75, 150, 0.3);
    border: none;
    
    &:hover {
      background: #1a3a7a;
      color: #FFFFFF;
      box-shadow: 0 4px 12px rgba(34, 75, 150, 0.4);
    }
  }
}

.style-two-pages-wrapper {
  width: 100% !important;
  max-width: 100% !important;
  display: flex;
  justify-content: center;
  /* 移除max-height限制，让容器可以无限延长 */
  /* 不设置 overflow，使用父容器的滚动条 */
  overflow: visible;
  /* 确保sticky定位的上下文正确 */
  position: relative;
  box-sizing: border-box;
  /* 确保与page-content宽度一致 */
  padding: 0;
}

/* A4容器不再需要滚动条，滚动条样式已移除 */

.style-two-continuous-page {
  /* 连续显示模式：宽度增加至250mm（比A4宽约20%），高度自动适应内容 */
  width: min(250mm, 100%);
  max-width: 100%;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  box-sizing: border-box;
  position: relative;
  margin: 0 auto;
  /* 高度由内容决定，自动延长 */
  height: auto;
  min-height: auto;
  /* 确保缩放时从顶部中心点开始 */
  transform-origin: top center;
  /* 平滑过渡缩放效果 */
  transition: transform 0.2s ease-out;
}

/* 打印模式：页眉仅标题 + Logo；患者基本信息在正文最先 */
.print-report-header {
  width: 100%;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}
.print-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
}
.print-report-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}
.print-header-logo {
  max-width: 80px;
  max-height: 48px;
  object-fit: contain;
}
.print-report-patient {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
}
.print-patient-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px 32px;
  margin-bottom: 4px;
}
.print-patient-row:last-child {
  margin-bottom: 0;
}
.print-date {
  margin-left: auto;
}

/* 打印专用文档：排版样式必须用 :deep()，否则 innerHTML 注入的内容没有 data-v-xxx，scoped 不生效 */
.print-doc-container {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 595px;
  max-width: 595px;
  background: #fff;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
}
.print-doc-container :deep(.print-doc-wrap) {
  display: block !important;
  width: 100%;
  max-width: 100%;
  padding: 20px 32px 32px;
  font-size: 14px;
  line-height: 1.58;
  color: #262626;
  box-sizing: border-box;
  flex: 0 0 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  letter-spacing: 0.02em;
}
.print-doc-container :deep(.print-doc-header) {
  margin-bottom: 0;
  padding-bottom: 16px;
  border-bottom: none;
  flex-shrink: 0;
  position: relative;
}
.print-doc-container :deep(.print-doc-header)::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 64px;
  height: 3px;
  background: linear-gradient(90deg, #1890ff 0%, rgba(24,144,255,0.4) 100%);
  border-radius: 0 2px 2px 0;
}
.print-doc-container :deep(.print-doc-body) {
  display: block !important;
  flex: none !important;
  height: auto !important;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  position: relative;
  margin-top: 0;
  padding-top: 4px;
}
/* Logo 水印：正文区居中、最顶层，逆时针 45°，低透明度（参考 ExaminationReportPreview） */
.print-doc-container :deep(.print-doc-watermark) {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  opacity: 0.12;
  max-width: 70%;
  max-height: 70%;
  width: auto;
  height: auto;
  object-fit: contain;
  z-index: 99999;
  pointer-events: none;
  filter: grayscale(15%) blur(0.3px);
}
.print-doc-container :deep(.print-doc-header-top) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
  gap: 28px;
  min-width: 0;
}
.print-doc-container :deep(.print-doc-title-wrap) {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.print-doc-container :deep(.print-doc-title) {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #0d1a26;
  letter-spacing: 0.08em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}
.print-doc-container :deep(.print-doc-subtitle) {
  font-size: 11px;
  font-weight: 500;
  color: #8c8c8c;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.print-doc-container :deep(.print-doc-logo-wrap) {
  flex: 0 0 auto;
  width: 72px;
  min-width: 72px;
  height: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
}
.print-doc-container :deep(.print-doc-logo) {
  max-width: 72px;
  max-height: 40px;
  width: auto !important;
  height: auto !important;
  min-width: 0;
  object-fit: contain;
  object-position: right center;
  display: block;
}
/* 基本信息区：紧凑卡片，少占版面 */
.print-doc-container :deep(.print-doc-patient) {
  margin: 0 0 12px 0;
  flex-shrink: 0;
  height: auto;
  min-height: 0;
  overflow: visible;
  box-sizing: border-box;
  background: linear-gradient(135deg, #fafbfd 0%, #f5f7fa 100%);
  border-radius: 6px;
  border: 1px solid #e8ecf1;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  position: relative;
}
.print-doc-container :deep(.print-doc-patient)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #1890ff 0%, rgba(24,144,255,0.5) 100%);
  border-radius: 6px 0 0 6px;
}
/* 首页基本信息：6 项 2 行（3 列） */
.print-doc-container :deep(.print-doc-patient-inner) {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px 20px;
  padding: 8px 12px 8px 16px;
}
.print-doc-container :deep(.print-doc-patient-item) {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.print-doc-container :deep(.print-doc-patient-label) {
  font-size: 10px;
  font-weight: 600;
  color: #8c8c8c;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  line-height: 1.2;
}
.print-doc-container :deep(.print-doc-patient-value) {
  font-size: 12px;
  font-weight: 600;
  color: #0d1a26;
  line-height: 1.3;
}
/* 非首页顶部：仅文字，无容器无框，一行展示；左缩进与下方检查标题文字起始对齐（12px+4px 蓝条） */
.print-doc-container :deep(.print-doc-patient-short) {
  margin: 0;
  padding: 4px 0 6px calc(16px + 0.5em);
  font-size: 12px;
  color: #434343;
  line-height: 1.4;
  background: none;
  border: none;
  box-shadow: none;
  display: block;
  min-height: 0;
  box-sizing: border-box;
}
.print-doc-container :deep(.print-doc-patient-short::before) {
  display: none;
}
.print-doc-container :deep(.print-doc-short-item) {
  white-space: nowrap;
}
.print-doc-container :deep(.print-doc-short-sep) {
  user-select: none;
  color: #434343;
}
@media (max-width: 400px) {
  .print-doc-container :deep(.print-doc-patient-inner) {
    grid-template-columns: repeat(2, 1fr);
  }
}
.print-doc-container :deep(.print-doc-section) {
  margin-bottom: 18px;
  margin-top: 0;
  page-break-inside: avoid;
}
.print-doc-container :deep(.print-doc-section:first-child) {
  margin-top: 0;
}
/* 医生建议等段落模块：允许段内分页，避免页眉下空间不足时被挤坏 */
.print-doc-container :deep(.print-doc-section-para) {
  page-break-inside: auto;
}
.print-doc-container :deep(.print-doc-para-wrap) {
  min-width: 0;
  overflow-wrap: break-word;
  word-break: break-word;
}
.print-doc-container :deep(.print-doc-section-title) {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
  padding: 6px 0 6px 12px;
  border-left: 4px solid #1890ff;
  border-bottom: none;
  background: linear-gradient(to right, rgba(24,144,255,0.06) 0%, transparent 100%);
  border-radius: 0 4px 4px 0;
}
.print-doc-container :deep(.print-doc-table) {
  width: 100%;
  max-width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 16px;
}
.print-doc-container :deep(.print-doc-table th),
.print-doc-container :deep(.print-doc-table td) {
  padding: 8px 12px;
  vertical-align: middle;
  border: 1px solid #e8ecf1;
  text-align: left;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 0;
}
.print-doc-container :deep(.print-doc-table th) {
  background: #f0f5ff;
  color: #434343;
  font-weight: 600;
  font-size: 18px;
  text-transform: none;
  letter-spacing: 0.2px;
}
.print-doc-container :deep(.print-doc-table td) {
  font-size: 16px;
}
.print-doc-container :deep(.print-doc-table-2col th:first-child),
.print-doc-container :deep(.print-doc-table-2col td:first-child) { width: 32%; }
.print-doc-container :deep(.print-doc-table-2col th:last-child),
.print-doc-container :deep(.print-doc-table-2col td:last-child) { width: 68%; }
.print-doc-container :deep(.print-doc-table-3col th:first-child),
.print-doc-container :deep(.print-doc-table-3col td:first-child) { width: 28%; }
.print-doc-container :deep(.print-doc-table-3col th:nth-child(2)),
.print-doc-container :deep(.print-doc-table-3col td:nth-child(2)) { width: 44%; }
.print-doc-container :deep(.print-doc-table-3col th:nth-child(3)),
.print-doc-container :deep(.print-doc-table-3col td:nth-child(3)) { width: 28%; }
.print-doc-container :deep(.print-doc-table-4col th:first-child),
.print-doc-container :deep(.print-doc-table-4col td:first-child) { width: 22%; }
.print-doc-container :deep(.print-doc-table-4col th:nth-child(2)),
.print-doc-container :deep(.print-doc-table-4col td:nth-child(2)),
.print-doc-container :deep(.print-doc-table-4col th:nth-child(3)),
.print-doc-container :deep(.print-doc-table-4col td:nth-child(3)) { width: 28%; }
.print-doc-container :deep(.print-doc-table-4col th:nth-child(4)),
.print-doc-container :deep(.print-doc-table-4col td:nth-child(4)),
.print-doc-container :deep(.print-doc-table-4col .print-doc-unit) { width: 22%; }
.print-doc-container :deep(.print-doc-table:not(.print-doc-table-2col):not(.print-doc-table-3col):not(.print-doc-table-4col) th:first-child),
.print-doc-container :deep(.print-doc-table:not(.print-doc-table-2col):not(.print-doc-table-3col):not(.print-doc-table-4col) td:first-child) { width: 28%; }
.print-doc-container :deep(.print-doc-table:not(.print-doc-table-2col):not(.print-doc-table-3col):not(.print-doc-table-4col) th:nth-child(2)),
.print-doc-container :deep(.print-doc-table:not(.print-doc-table-2col):not(.print-doc-table-3col):not(.print-doc-table-4col) td:nth-child(2)),
.print-doc-container :deep(.print-doc-table:not(.print-doc-table-2col):not(.print-doc-table-3col):not(.print-doc-table-4col) th:nth-child(3)),
.print-doc-container :deep(.print-doc-table:not(.print-doc-table-2col):not(.print-doc-table-3col):not(.print-doc-table-4col) td:nth-child(3)) { width: 36%; }
.print-doc-container :deep(.print-doc-table tr:last-child td) {
  border-bottom: 1px solid #e8ecf1;
}
.print-doc-container :deep(.print-doc-label) {
  color: #595959;
  font-weight: 500;
}
.print-doc-container :deep(.print-doc-value) {
  color: #1a1a1a;
}
.print-doc-container :deep(.print-doc-para) {
  font-size: 13px;
  color: #434343;
  line-height: 1.7;
  margin: 0;
  padding: 6px 0 0;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}
.print-doc-container :deep(.print-doc-unit) {
  color: #8c8c8c;
  font-size: 16px;
}
/* 视功能检查：眼位和聚散 8 列表格，与原文一致；显式分配 8 列宽避免“散开”列被挤掉 */
.print-doc-container :deep(.print-doc-functional-eye) {
  font-size: 16px;
  table-layout: fixed;
  width: 100%;
  margin-bottom: 12px;
}
.print-doc-container :deep(.print-doc-functional-eye th) {
  font-size: 18px;
}
.print-doc-container :deep(.print-doc-functional-eye td) {
  font-size: 16px;
}
.print-doc-container :deep(.print-doc-functional-eye th),
.print-doc-container :deep(.print-doc-functional-eye td) {
  padding: 4px 6px;
  word-break: break-all;
}
/* 眼位表列宽：按实际列数分配（智能隐藏列后为 2 / 5 / 8 列） */
.print-doc-container :deep(.print-doc-functional-eye-cols-2 th:nth-child(1)),
.print-doc-container :deep(.print-doc-functional-eye-cols-2 td:nth-child(1)) { width: 50%; }
.print-doc-container :deep(.print-doc-functional-eye-cols-2 th:nth-child(2)),
.print-doc-container :deep(.print-doc-functional-eye-cols-2 td:nth-child(2)) { width: 50%; }
.print-doc-container :deep(.print-doc-functional-eye-cols-5 th:nth-child(1)),
.print-doc-container :deep(.print-doc-functional-eye-cols-5 td:nth-child(1)) { width: 20%; }
.print-doc-container :deep(.print-doc-functional-eye-cols-5 th:nth-child(2)),
.print-doc-container :deep(.print-doc-functional-eye-cols-5 td:nth-child(2)) { width: 20%; }
.print-doc-container :deep(.print-doc-functional-eye-cols-5 th:nth-child(n+3)),
.print-doc-container :deep(.print-doc-functional-eye-cols-5 td:nth-child(n+3)) { width: 20%; }
.print-doc-container :deep(.print-doc-functional-eye-cols-8 th:nth-child(1)),
.print-doc-container :deep(.print-doc-functional-eye-cols-8 td:nth-child(1)) { width: 16%; }
.print-doc-container :deep(.print-doc-functional-eye-cols-8 th:nth-child(2)),
.print-doc-container :deep(.print-doc-functional-eye-cols-8 td:nth-child(2)) { width: 12%; }
.print-doc-container :deep(.print-doc-functional-eye-cols-8 th:nth-child(n+3)),
.print-doc-container :deep(.print-doc-functional-eye-cols-8 td:nth-child(n+3)) { width: 12%; }
.print-doc-container :deep(.print-doc-functional-aca),
.print-doc-container :deep(.print-doc-functional-accom) {
  margin-bottom: 12px;
}

.style-two-page-content {
  width: 100% !important;
  max-width: 100% !important;
  padding: clamp(8px, 1vw, 12px) clamp(16px, 2vw, 24px) clamp(10px, 1.2vw, 14px) clamp(16px, 2vw, 24px);
  display: flex;
  flex-direction: column;
  gap: 0;
  box-sizing: border-box;
  /* 高度由内容决定，自动延长 */
  height: auto;
  min-height: auto;
  position: relative;
  /* 整体放大内容 */
  font-size: 1.15em; // 放大15%
}

.style-two-page-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  margin-bottom: 8px;
  padding-bottom: 6px;
  
  // 当包含 PatientStyleTwoPageOne 且最后一个 section (treatment-plan) 处于 collapsed 状态时，缩小间距
  &:has(.page-one-container .treatment-plan-section.collapsed) {
    margin-bottom: 2px !important;
    padding-bottom: 0 !important;
  }
  
  // 当包含其他检查组件且它们的 section-block 处于 collapsed 状态时，也缩小间距
  // 对于 routine，检测第一个 section-block（基础检查）或最后一个 section-block（主观验光检查）是否 collapsed
  &:has(.routine-exam-style-two .section-block:first-child.collapsed),
  &:has(.routine-exam-style-two .section-block:last-child.collapsed),
  &:has(.biometry-exam-style-two .section-block.collapsed),
  &:has(.functional-exam-style-two .section-block:first-child.collapsed),
  &:has(.img-exam-style-two .section-block:first-child.collapsed) {
    margin-bottom: 2px !important;
    padding-bottom: 0 !important;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #f0f2f5;
  }
}

// Logo水印：按A4规格（每297mm高度）重复显示
.page-watermark-item {
  position: absolute;
  left: 0;
  width: 100%;
  height: 297mm;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 9999;
}

.watermark-logo {
  width: 500px;
  height: 500px;
  object-fit: contain;
  opacity: 0.1;
  transform: rotate(-45deg);
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -250px;
  margin-left: -250px;
}

.style-two-page.placeholder {
  border: 1px dashed #d9d9d9;
  background: repeating-linear-gradient(45deg, rgba(240, 244, 252, 0.6), rgba(240, 244, 252, 0.6) 12px, rgba(255, 255, 255, 0.6) 12px, rgba(255, 255, 255, 0.6) 24px);
  box-shadow: none;
  align-items: center;
  justify-content: center;
  color: #bfbfbf;
  font-size: 16px;
  padding: 0;
}

.style-two-page-placeholder {
  text-align: center;
}

.style-two-title {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.style-two-title h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  color: #224b96;
}

.style-two-basic {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #4a4a4a;
  font-size: 14px;
}

.style-two-section {
  page-break-inside: avoid;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  z-index: 2;
  margin-bottom: 8px;
  padding-bottom: 6px;
  
  // 统一处理：当组件中的 section-block 处于 collapsed 状态时，缩小该 section 的间距
  // 这样不同组件之间的标题栏间距就会保持一致
  // 对于 routine，检测第一个 section-block（基础检查）或最后一个 section-block（主观验光检查）是否 collapsed
  &:has(.routine-exam-style-two .section-block:first-child.collapsed),
  &:has(.routine-exam-style-two .section-block:last-child.collapsed),
  &:has(.biometry-exam-style-two .section-block.collapsed),
  &:has(.functional-exam-style-two .section-block:first-child.collapsed),
  &:has(.img-exam-style-two .section-block:first-child.collapsed) {
    margin-bottom: 2px !important;
    padding-bottom: 0 !important;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #f0f2f5;
  }
}

.style-two-section-header {
  display: flex;
  align-items: center;
  justify-content: flex-start; // 确保内容居左对齐
  gap: 12px;
  cursor: pointer;
  user-select: none;
  padding: 10px 12px;
  margin-bottom: 10px;
  position: relative;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, rgba(34, 75, 150, 0.08) 0%, rgba(234, 240, 255, 0.6) 100%);
  border-radius: 8px;
  border-left: 4px solid #224b96;
  min-height: 48px; // 确保高度与其他标题一致
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, #e8edf5 10%, #e8edf5 90%, transparent 100%);
    transition: all 0.3s ease;
  }
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #224b96 0%, #4a7bc8 100%);
    transition: width 0.3s ease;
  }
  
  &:hover {
    background: linear-gradient(135deg, rgba(34, 75, 150, 0.12) 0%, rgba(234, 240, 255, 0.8) 100%);
    border-left-color: #4a7bc8;
    
    &::before {
      width: 100%;
    }
    
    .section-title {
      color: #224b96;
    }
    
    .section-icon {
      transform: scale(1.05);
    }
  }
}

.section-icon {
  width: 32px;
  height: 32px;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.section-title {
  font-size: 18px; // 与其他标题一致（从20px改为18px）
  font-weight: 600;
  color: #224b96;
  flex: 1;
  transition: color 0.3s ease;
  letter-spacing: 0.5px;
  position: relative;
  text-align: left; // 确保文字居左
  line-height: 1.5; // 确保行高一致
}

.section-toggle-icon {
  margin-left: auto;
  color: #666;
  font-size: 14px;
}

// 结果分析标题特殊样式（无图标）
.style-two-section-header.analysis-header {
  .section-title {
    margin-left: 0; // 去掉图标后，不需要左边距
  }
}

.style-two-section-body {
  background: transparent;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
}

.style-two-section-body :deep(.ant-card) {
  background: transparent;
  box-shadow: none;
}

/* 检查详情区表格：单元格 16px，表头（列头/行头）略大 18px */
.style-two-section-body :deep(.ant-table) {
  font-size: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.style-two-section-body :deep(.ant-table-thead > tr > th) {
  background: linear-gradient(180deg, rgba(34, 75, 150, 0.12) 0%, rgba(34, 75, 150, 0.08) 100%) !important;
  color: #224b96 !important;
  font-weight: 600 !important;
  font-size: 18px !important;
  border-bottom: 2px solid rgba(34, 75, 150, 0.15) !important;
  padding: 10px 12px !important;
}

.style-two-section-body :deep(.ant-table-tbody > tr) {
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(34, 75, 150, 0.04) !important;
  }
}

.style-two-section-body :deep(.ant-table-tbody > tr > td) {
  font-size: 16px !important;
  border-bottom: 1px solid #f0f2f5 !important;
  padding: 10px 12px !important;
}

/* 检查详情区内原生 table：表头 18px，单元格 16px */
.style-two-section-body :deep(table thead th),
.style-two-section-body :deep(table th) {
  font-size: 18px !important;
}
.style-two-section-body :deep(table tbody td),
.style-two-section-body :deep(table td) {
  font-size: 16px !important;
}

.style-two-section-body :deep(.echarts) {
  height: 320px !important;
}

.style-two-empty {
  width: 210mm;
  min-height: 297mm;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #666;
}


/* 检查报告打印预览模态：左侧勾选模块 + 右侧 A4 效果预览 */
.print-preview-modal :deep(.ant-modal-content) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}
.print-preview-modal :deep(.ant-modal-header) {
  padding: 16px 24px;
  border-bottom: 1px solid #e8ecf1;
  background: linear-gradient(to bottom, #fafbfd 0%, #fff 100%);
}
.print-preview-modal .ant-modal-body {
  padding: 0;
  max-height: 78vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.print-preview-modal-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 16px;
  margin-bottom: 0;
  border-bottom: 1px solid #e8ecf1;
  background: linear-gradient(to bottom, #fafbfd 0%, #fff 100%);
}
.print-preview-modal-title .title-left {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}
.print-preview-modal-title .title-left .anticon {
  color: #1890ff;
}
.print-preview-modal-body {
  display: flex;
  flex: 1;
  min-height: 420px;
  overflow: hidden;
}
.print-preview-sidebar {
  width: 260px;
  flex-shrink: 0;
  padding: 20px;
  background: #fafbfd;
  border-right: 1px solid #e8ecf1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.print-preview-sidebar .sidebar-title {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 14px;
  font-size: 14px;
  padding-bottom: 10px;
  border-bottom: 2px solid #1890ff;
  width: fit-content;
}
.print-preview-sidebar .sidebar-header {
  padding: 10px 0;
  border-bottom: 1px solid #e8ecf1;
  margin-bottom: 14px;
}
.print-preview-sidebar .sidebar-drag-hint {
  font-size: 12px;
  color: #8c8c8c;
  margin: 0 0 10px 0;
  line-height: 1.4;
}
.print-preview-sidebar .sidebar-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.print-preview-sidebar .sidebar-item {
  padding: 8px 10px;
  border-radius: 6px;
  transition: background 0.2s;
}
.print-preview-sidebar .sidebar-item:hover {
  background: rgba(24, 144, 255, 0.06);
}
.print-preview-sidebar .sidebar-item-draggable {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: grab;
}
.print-preview-sidebar .sidebar-item-draggable:active {
  cursor: grabbing;
}
.print-preview-sidebar .sidebar-order-num {
  flex-shrink: 0;
  width: 18px;
  text-align: right;
  font-size: 12px;
  color: #8c8c8c;
  user-select: none;
}
.print-preview-sidebar .sidebar-drag-handle {
  flex-shrink: 0;
  color: #8c8c8c;
  font-size: 14px;
  line-height: 1;
  user-select: none;
  cursor: grab;
}
.print-preview-sidebar .sidebar-drag-handle:hover {
  color: #1890ff;
}
.print-preview-sidebar .print-break-settings {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #e8ecf1;
}
.print-preview-sidebar .print-break-settings-title {
  font-size: 13px;
  font-weight: 600;
  color: #434343;
  margin-bottom: 10px;
}
.print-preview-sidebar .print-break-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.print-preview-sidebar .print-break-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  gap: 8px;
}
.print-preview-sidebar .print-break-item .print-break-label {
  flex: 1;
  font-size: 12px;
  color: #595959;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.print-preview-sidebar .print-break-divider {
  height: 1px;
  background: #e8ecf1;
  margin: 2px 0;
}
.print-preview-sidebar .sidebar-footer {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e8ecf1;
}
.print-preview-sidebar .a4-hint {
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.4;
}
.print-preview-sidebar .no-sections-tip {
  padding: 24px 0;
  text-align: center;
  color: #8c8c8c;
  font-size: 13px;
  line-height: 1.5;
}
.print-preview-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
  background: #f5f6f8;
}
.print-preview-main .preview-label {
  font-weight: 600;
  color: #434343;
  margin-bottom: 12px;
  font-size: 14px;
}
.print-preview-main .preview-scroll {
  flex: 1;
  overflow: auto;
  background: linear-gradient(180deg, #e8eaef 0%, #dfe2e8 100%);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 24px;
  min-height: 360px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}
.print-preview-main .preview-image-wrap {
  max-width: 100%;
}
.print-preview-main .preview-image {
  max-width: 100%;
  height: auto;
  display: block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  background: #fff;
}
/* 预览区域固定为 A4 尺寸（595×842 px），与 A4 纸一致，模拟纸张效果 */
.print-preview-main .preview-page-block {
  margin-bottom: 32px;
  text-align: center;
  position: relative;
  width: 595px;
  flex-shrink: 0;
}
.print-preview-main .preview-page-block:last-child {
  margin-bottom: 0;
}
.print-preview-main .preview-page-caption {
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
}
.print-preview-main .preview-page-image {
  width: 595px;
  height: 842px;
  display: block;
  margin: 0 auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  background: #fff;
  object-fit: fill;
  object-position: top left;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.print-preview-main .preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px;
  color: #8c8c8c;
}

.print-section-selector {
  max-height: 400px;
  overflow-y: auto;
}

.selector-header {
  padding: 8px 0;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 12px;
}

.selector-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selector-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.selector-item:last-child {
  border-bottom: none;
}

.no-data-tip {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

@media print {
  .style-two-layout {
    display: block;
  }

  .style-two-side {
    display: none !important;
  }
  
  .action-buttons-top {
    display: none !important;
  }

  .style-two-content {
    display: block;
  }

  .style-two-pages {
    display: block;
  }

  .style-two-page-row {
    display: block;
  }

  .style-two-page {
    width: 210mm;
    /* 打印时也严格按照 A4 高度控制 */
    height: 297mm;
    box-shadow: none;
    border-radius: 0;
    padding: 24mm 18mm;
    page-break-after: always;
  }

  .style-two-page:last-child {
    page-break-after: auto;
  }

  .style-two-page.placeholder {
    display: none;
  }

  .chart-buttons-bar-sticky {
    display: none !important;
  }

  .style-two-section-body {
    box-shadow: none;
    background: transparent;
    padding: 0;
  }
}

// 响应式布局 - 大屏幕（1200px以上）
@media (min-width: 1200px) {
  .style-two-layout {
    grid-template-columns: clamp(330px, 30vw, 560px) minmax(0, 1fr);
  }
}

// 中等屏幕（992px - 1199px）
@media (max-width: 1199px) and (min-width: 992px) {
  .style-two-layout {
    grid-template-columns: clamp(280px, 28vw, 480px) minmax(0, 1fr);
    gap: clamp(10px, 1.2vw, 16px);
    padding: 0 !important;
  }
  
  .style-two-page-content {
    padding: clamp(12px, 1.5vw, 16px) clamp(14px, 1.8vw, 20px) clamp(14px, 1.8vw, 18px) clamp(14px, 1.8vw, 20px) !important;
  }
  
  .top-bar-area {
    padding: 0 clamp(20px, 2.5vw, 32px) !important;
  }
}

// 小屏幕（768px - 991px）- 两列布局
@media (max-width: 991px) and (min-width: 768px) {
  .style-two-layout {
    grid-template-columns: clamp(240px, 30vw, 360px) minmax(0, 1fr) !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
  }
  
  .style-two-side {
    width: 100% !important;
  }
  
  .patient-info-line {
    gap: clamp(8px, 1vw, 10px);
  }
  
  .patient-info-line .info-item {
    font-size: clamp(12px, 1.2vw, 14px);
  }
  
  .style-two-main {
    width: 100% !important;
    max-width: 100% !important;
  }
}

// 超小屏幕（小于768px）- 单列布局
@media (max-width: 767px) {
  .style-two-root {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
  }
  
  .style-two-layout {
    grid-template-columns: 1fr !important;
    gap: clamp(8px, 2vw, 12px) !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
  }
  
  .style-two-side {
    position: relative !important;
    top: 0 !important;
    max-height: none !important;
    margin-bottom: clamp(10px, 2vw, 16px);
    width: 100% !important;
    max-width: 100% !important;
  }
  
  .patient-info-line {
    gap: clamp(8px, 1vw, 10px) !important;
  }
  
  .patient-info-line .info-separator {
    display: none;
  }
  
  .patient-info-line .info-item {
    flex: 1 1 auto;
    min-width: calc(50% - 4px);
  }
  
  .style-two-main {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
  }
  
  .content-navigation-bar-top {
    flex-direction: column !important;
    align-items: stretch !important;
  }
  
  .nav-buttons-left {
    margin-bottom: clamp(8px, 1.5vw, 12px);
  }
  
  .action-buttons-top {
    justify-content: center !important;
    flex-wrap: wrap;
  }
  
  .style-two-content {
    width: 100% !important;
    max-width: 100% !important;
    padding: clamp(12px, 2vw, 16px) !important;
    border-radius: 12px !important;
  }
  
  
  .patient-info-card-top {
    padding: clamp(10px, 1.2vw, 14px) clamp(12px, 1.5vw, 16px) !important;
    margin-bottom: clamp(8px, 1vw, 10px) !important;
  }
  
  .patient-info-card-top .patient-info-line {
    gap: clamp(8px, 1vw, 10px) !important;
    font-size: clamp(12px, 1.2vw, 13px) !important;
  }
  
  .content-navigation-bar-top {
    padding: clamp(8px, 1.2vw, 12px) clamp(10px, 1.5vw, 14px) !important;
    gap: clamp(6px, 0.8vw, 8px) !important;
  }
  
  .content-navigation-bar-top .nav-button {
    height: clamp(28px, 3.5vw, 32px) !important;
    padding: 0 clamp(10px, 1.5vw, 12px) !important;
    font-size: clamp(11px, 1.2vw, 12px) !important;
  }
  
  .patient-info-card-top .patient-info-line .info-separator {
    display: none;
  }
  
  .patient-info-card-top .patient-info-line .info-item {
    flex-shrink: 0;
  }
  
  .style-two-pages-wrapper {
    width: 100% !important;
    max-width: 100% !important;
  }
  
  .style-two-continuous-page {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
  }
  
  .style-two-page-content {
    width: 100% !important;
    max-width: 100% !important;
    padding: clamp(10px, 1.5vw, 12px) clamp(12px, 2vw, 16px) !important;
  }
  
  .top-bar-area {
    padding: 0 clamp(12px, 2vw, 16px) !important;
  }
}

// 原有的大屏幕媒体查询保留
@media (max-width: 1680px) and (min-width: 1200px) {
  .style-two-layout {
    gap: clamp(12px, 1.2vw, 16px);
  }

  .style-two-content {
    gap: clamp(16px, 2vw, 24px);
  }

  .style-two-pages {
    gap: clamp(16px, 2vw, 24px);
    width: 100%;
  }

  .style-two-page-row {
    gap: clamp(16px, 2vw, 24px);
  }
}
</style>

