<template>
  <a-spin :spinning="isLoading">
    <div class="wrapper">
      <div v-if="isFirstLoad" style="text-align: center; margin: 20px;">
        <h3>首次加载，请耐心等待...</h3>
      </div>
      <div class="header-container"
           style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div class="header-title">
          <img-icon class="header-icon" title="复检"/>
          <h2 class="title" style="margin: 0;">快速复查</h2>
        </div>
        <div class="filter-container" style="display: flex; align-items: center;">
          <!-- 新增编号搜索框 -->
          <!-- <a-input
              class="header-input"
              v-model:value="searchGkid"
              placeholder="请输入患者编号"
              allowClear
              style="width: 200px; margin-right: 8px;"
          >
            <template #suffix>
              <img-icon class="input-icon" style="margin-right: 0" title="搜索"/>
            </template>
          </a-input>
          <a-button class="header-btn" type="primary" style="margin-right: 8px;" @click="handleSearchByGkid">
            编号查询
          </a-button> -->
          
          <a-input
              class="header-input"
              v-model:value="searchName"
              placeholder="请输入患者姓名"
              allowClear
              style="width: 200px; margin-right: 8px;"
          >
            <template #suffix>
              <img-icon class="input-icon" style="margin-right: 0" title="搜索"/>
            </template>
          </a-input>
          <a-date-picker
              class="header-input"
              v-model:value="searchDate"
              :format="dateFormat"
              style="width: 200px; margin-right: 8px;"
              :locale="locale"
          >
            <template #suffixIcon>
              <img-icon class="input-icon" title="日历" style="margin-right: 0"/>
            </template>
          </a-date-picker>
          <a-button class="header-little-btn" type="primary" style="margin-right: 8px;" @click="prevDay">
            <template #icon>
              <left-outlined/>
            </template>
          </a-button>
          <a-button class="header-little-btn" type="primary" style="margin-right: 8px;" @click="nextDay">
            <template #icon>
              <right-outlined/>
            </template>
          </a-button>
          <a-select
              class="header-input"
              v-model:value="searchStatus"
              style="width: 120px;"
              :options="[
              { value: 'all', label: '全部' },
              { value: 'complete', label: '已完善' },
              { value: 'incomplete', label: '未完善' }
            ]"
          >
            <template #suffixIcon>
              <img-icon class="input-icon" title="展开" style="margin-right: 0"/>
            </template>
          </a-select>
          <a-button class="header-btn" type="primary" style="margin-left: 16px;" @click="handleSyncAll">同步全部
          </a-button>
          <a-button class="header-btn" type="default" style="margin-left: 8px;" @click="handleRefresh" :loading="isRefreshing">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
        </div>
      </div>

      <a-table
          :columns="columns"
          :dataSource="pagedExaminations"
          rowKey="examination_id"
          :pagination="false"
          :locale="tableLocale"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <span :class="record.isComplete ? 'status-complete' : 'status-incomplete'">
              {{ record.isComplete ? '已完善' : '未完善' }}
            </span>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="primary" size="small" @click="handleView(record)">查看</a-button>
              <a-button type="danger" size="small" @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <div class="pagination" style="margin-top: 16px; text-align: center;">
        <a-pagination
            class="pagination"
            v-model:current="currentPage"
            :total="total"
            :pageSize="pageSize"
            @change="handlePageChange"
        />
      </div>

      <!-- 检查详情弹窗 -->
      <a-modal
          v-model:visible="detailModalVisible"
          width="800px"
          :footer="null"
          @cancel="handleModalCancel"
          :maskClosable="false"
          :keyboard="false"
          :getContainer="modalContainer"
      >
        <template #title>
          <div
              style="display: flex; align-items: center;justify-content: space-between;padding-bottom:16px;margin-bottom:16px;border-bottom: 1px solid rgba(0,0,0,0.1) ">
            <div style="display: flex; align-items: center;">
              <img-icon class="header-icon" title="检查"/>
              检查详情
            </div>
            <a-button class="print-btn modal-btn" type="primary" @click="handleOpenPrintModal">
              打印
            </a-button>
          </div>
        </template>
        <div class="modal-content">
          <a-form>
            <!-- 基本信息 -->
            <div class="detail-section">
              <h4>基本信息
                <a-button type="primary" size="small" @click="handleSyncLastBasic" style="margin-left: 8px;">
                  同步上次
                </a-button>
              </h4>
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="身高">
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.height"
                        :min="0"
                        :max="300"
                        :precision="1"
                        addon-after="cm"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="体重">
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.weight"
                        :min="0"
                        :max="500"
                        :precision="1"
                        addon-after="kg"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>

            <!-- 视力检查 -->
            <div class="detail-section">
              <h4>视力检查
                <a-button type="primary" size="small" @click="handleSyncLastVision" style="margin-left: 8px;">
                  同步上次
                </a-button>
              </h4>
              <a-row :gutter="16">
                <a-col :span="24">
                  <div style="margin-left: 24px" class="vision-group">
                    <span style="margin-right: 8px" class="vision-label">裸眼视力：</span>
                    <a-input-group compact>
                      <a-input
                          class="modal-input modal-input-compact"
                          v-model:value="currentRecord.uva_right_vision"
                          style="width: 70px"
                          placeholder="右眼"
                          @change="handleVisionInput($event, 'uva_right_vision')"
                      />
                      <a-dropdown :trigger="['click']" overlayClassName="vision-dropdown">
                        <a-button class="modal-btn-compact">
                          <img-icon class="input-icon" style="margin-right: 0" title="展开-白"/>
                        </a-button>
                        <template #overlay>
                          <a-menu @click="(e) => handleVisionSelect(e.key, 'uva_right_vision')">
                            <a-menu-item v-for="v in visionOptions" :key="v">{{ v }}</a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                    </a-input-group>

                    <a-input-group compact>
                      <a-input
                          class="modal-input modal-input-compact"
                          v-model:value="currentRecord.uva_left_vision"
                          style="width: 70px"
                          placeholder="左眼"
                          @change="handleVisionInput($event, 'uva_left_vision')"
                      />
                      <a-dropdown :trigger="['click']" overlayClassName="vision-dropdown">
                        <a-button class="modal-btn-compact">
                          <img-icon class="input-icon" style="margin-right: 0" title="展开-白"/>
                        </a-button>
                        <template #overlay>
                          <a-menu @click="(e) => handleVisionSelect(e.key, 'uva_left_vision')">
                            <a-menu-item v-for="v in visionOptions" :key="v">{{ v }}</a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                    </a-input-group>

                    <a-input-group compact>
                      <a-input
                          class="modal-input modal-input-compact"
                          v-model:value="currentRecord.uva_both_vision"
                          style="width: 70px"
                          placeholder="双眼"
                          @change="handleVisionInput($event, 'uva_both_vision')"
                      />
                      <a-dropdown :trigger="['click']" overlayClassName="vision-dropdown">
                        <a-button class="modal-btn-compact">
                          <img-icon class="input-icon" style="margin-right: 0" title="展开-白"/>
                        </a-button>
                        <template #overlay>
                          <a-menu @click="(e) => handleVisionSelect(e.key, 'uva_both_vision')">
                            <a-menu-item v-for="v in visionOptions" :key="v">{{ v }}</a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                    </a-input-group>
                  </div>
                </a-col>
              </a-row>
              <a-row :gutter="16" style="margin-top: 16px;">
                <a-col :span="24">
                  <div class="vision-group">
                    <a-checkbox v-model:checked="hasGlasses" style="min-width: 80px;">戴镜视力：</a-checkbox>
                    <a-input-group compact :class="{ 'disabled-group': !hasGlasses }">
                      <a-input
                          class="modal-input modal-input-compact"
                          v-model:value="currentRecord.vaec_right_old_vision"
                          style="width: 70px"
                          placeholder="右眼"
                          :disabled="!hasGlasses"
                          @change="handleVisionInput($event, 'vaec_right_old_vision')"
                      />
                      <a-dropdown :trigger="['click']" :disabled="!hasGlasses" overlayClassName="vision-dropdown">
                        <a-button :disabled="!hasGlasses" class="modal-btn-compact">
                          <img-icon class="input-icon" style="margin-right: 0" title="展开-白"/>
                        </a-button>
                        <template #overlay>
                          <a-menu @click="(e) => handleVisionSelect(e.key, 'vaec_right_old_vision')">
                            <a-menu-item v-for="v in visionOptions" :key="v">{{ v }}</a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                    </a-input-group>

                    <a-input-group compact :class="{ 'disabled-group': !hasGlasses }">
                      <a-input
                          class="modal-input modal-input-compact"
                          v-model:value="currentRecord.vaec_left_old_vision"
                          style="width: 70px"
                          placeholder="左眼"
                          :disabled="!hasGlasses"
                          @change="handleVisionInput($event, 'vaec_left_old_vision')"
                      />
                      <a-dropdown :trigger="['click']" :disabled="!hasGlasses" overlayClassName="vision-dropdown">
                        <a-button :disabled="!hasGlasses" class="modal-btn-compact">
                          <img-icon class="input-icon" style="margin-right: 0" title="展开-白"/>
                        </a-button>
                        <template #overlay>
                          <a-menu @click="(e) => handleVisionSelect(e.key, 'vaec_left_old_vision')">
                            <a-menu-item v-for="v in visionOptions" :key="v">{{ v }}</a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                    </a-input-group>

                    <a-input-group compact :class="{ 'disabled-group': !hasGlasses }">
                      <a-input
                          class="modal-input modal-input-compact"
                          v-model:value="currentRecord.vaec_both_old_vision"
                          style="width: 70px"
                          placeholder="双眼"
                          :disabled="!hasGlasses"
                          @change="handleVisionInput($event, 'vaec_both_old_vision')"
                      />
                      <a-dropdown :trigger="['click']" :disabled="!hasGlasses" overlayClassName="vision-dropdown">
                        <a-button :disabled="!hasGlasses" class="modal-btn-compact">
                          <img-icon class="input-icon" style="margin-right: 0" title="展开-白"/>
                        </a-button>
                        <template #overlay>
                          <a-menu @click="(e) => handleVisionSelect(e.key, 'vaec_both_old_vision')">
                            <a-menu-item v-for="v in visionOptions" :key="v">{{ v }}</a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                    </a-input-group>
                  </div>
                </a-col>
              </a-row>
            </div>

            <!-- 旧镜度数部分（只在戴镜时显示） -->
            <div v-if="hasGlasses" class="detail-section">
              <h4>旧镜度数
                <a-button type="primary" size="small" @click="handleSyncLastVaec" style="margin-left: 8px;">
                  同步上次
                </a-button>
              </h4>
              <a-row :gutter="16">
                <a-col :span="24">
                  <div class="refraction-group">
                    <span class="eye-label">右眼：</span>
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.vaec_right_spherical"
                        :precision="2"
                        :step="0.25"
                        placeholder="球镜"
                        addon-after="D"
                    />
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.vaec_right_cylindrical"
                        :precision="2"
                        :step="0.25"
                        placeholder="柱镜"
                        addon-after="D"
                    />
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.vaec_right_axis"
                        :min="0"
                        :max="180"
                        placeholder="轴向"
                        addon-after="°"
                    />
                  </div>
                </a-col>
              </a-row>
              <a-row :gutter="16" style="margin-top: 16px;">
                <a-col :span="24">
                  <div class="refraction-group">
                    <span class="eye-label">左眼：</span>
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.vaec_left_spherical"
                        :precision="2"
                        :step="0.25"
                        placeholder="球镜"
                        addon-after="D"
                    />
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.vaec_left_cylindrical"
                        :precision="2"
                        :step="0.25"
                        placeholder="柱镜"
                        addon-after="D"
                    />
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.vaec_left_axis"
                        :min="0"
                        :max="180"
                        placeholder="轴向"
                        addon-after="°"
                    />
                  </div>
                </a-col>
              </a-row>
            </div>

            <!-- 电脑验光 -->
            <div class="detail-section">
              <h4>电脑验光
                <a-button type="primary" size="small" @click="handleSyncLastObjective" style="margin-left: 8px;">
                  同步上次
                </a-button>
              </h4>
              <a-row :gutter="16">
                <a-col :span="24">
                  <div class="refraction-group">
                    <span class="eye-label">右眼：</span>
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.objective_right_spherical"
                        :precision="2"
                        :step="0.25"
                        placeholder="球镜"
                        addon-after="D"
                    />
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.objective_right_cylindrical"
                        :precision="2"
                        :step="0.25"
                        placeholder="柱镜"
                        addon-after="D"
                    />
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.objective_right_axis"
                        :min="0"
                        :max="180"
                        placeholder="轴向"
                        addon-after="°"
                    />
                  </div>
                </a-col>
              </a-row>
              <a-row :gutter="16" style="margin-top: 16px;">
                <a-col :span="24">
                  <div class="refraction-group">
                    <span class="eye-label">左眼：</span>
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.objective_left_spherical"
                        :precision="2"
                        :step="0.25"
                        placeholder="球镜"
                        addon-after="D"
                    />
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.objective_left_cylindrical"
                        :precision="2"
                        :step="0.25"
                        placeholder="柱镜"
                        addon-after="D"
                    />
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.objective_left_axis"
                        :min="0"
                        :max="180"
                        placeholder="轴向"
                        addon-after="°"
                    />
                  </div>
                </a-col>
              </a-row>
            </div>

            <!-- 生物参数 -->
            <div class="detail-section">
              <h4>生物参数</h4>
              <a-row :gutter="16">
                <a-col :span="24">
                  <div class="biometric-group">
                    <span class="eye-label">右眼：</span>
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.right_eye_axial_length"
                        :precision="2"
                        placeholder="眼轴长度"
                        addon-after="mm"
                    />
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.right_eye_k1"
                        :precision="2"
                        placeholder="K1"
                        addon-after="D"
                    />
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.right_eye_k2"
                        :precision="2"
                        placeholder="K2"
                        addon-after="D"
                    />
                  </div>
                </a-col>
              </a-row>
              <a-row :gutter="16" style="margin-top: 16px;">
                <a-col :span="24">
                  <div class="biometric-group">
                    <span class="eye-label">左眼：</span>
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.left_eye_axial_length"
                        :precision="2"
                        placeholder="眼轴长度"
                        addon-after="mm"
                    />
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.left_eye_k1"
                        :precision="2"
                        placeholder="K1"
                        addon-after="D"
                    />
                    <a-input-number
                        class="modal-input"
                        v-model:value="currentRecord.left_eye_k2"
                        :precision="2"
                        placeholder="K2"
                        addon-after="D"
                    />
                  </div>
                </a-col>
              </a-row>
            </div>

            <!-- 诊疗方案 -->
            <div class="detail-section">
              <h4>诊疗方案
                <a-checkbox v-model:checked="syncEyes" style="margin-left: 8px;">双眼同步</a-checkbox>
                <a-button type="primary" size="small" @click="handleSyncLastTreatment" style="margin-left: 8px;">
                  同步上次
                </a-button>
              </h4>
              <a-row :gutter="16">
                <a-col :span="12">
                  <div class="treatment-card">
                    <div class="treatment-title">
                      <img-icon class="header-icon" title="裸眼视力"/>
                      右眼方案
                    </div>
                    <div class="treatment-row">
                      <span class="treatment-label">阿托品：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.right_atropine"
                          style="width: 120px"
                          @change="handleRightEyeChange"
                      >
                        <a-select-option value="否">否</a-select-option>
                        <a-select-option value="0.01%">0.01%</a-select-option>
                        <a-select-option value="0.02%">0.02%</a-select-option>
                        <a-select-option value="0.05%">0.05%</a-select-option>
                      </a-select>
                    </div>
                    <div class="treatment-row">
                      <span class="treatment-label">配镜手段：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.right_glasses"
                          style="width: 140px"
                          @change="handleRightGlassesChange"
                      >
                        <a-select-option value="否">否</a-select-option>
                        <a-select-option v-for="option in Object.keys(glassesPPOptions)" :key="option" :value="option">
                          {{ option }}
                        </a-select-option>
                      </a-select>
                    </div>
                    <div class="treatment-row" v-if="currentRecord.right_glasses && currentRecord.right_glasses !== '否'">
                      <span class="treatment-label">配镜品牌：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.right_glasses_pp"
                          style="width: 120px"
                          @change="handleRightEyeChange"
                      >
                        <a-select-option v-for="option in glassesPPOptions[currentRecord.right_glasses]" :key="option" :value="option">
                          {{ option }}
                        </a-select-option>
                      </a-select>
                    </div>
                    <div class="treatment-row">
                      <span class="treatment-label">低强度红光：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.right_hg"
                          style="width: 120px"
                          @change="handleRightHgChange"
                      >
                        <a-select-option value="否">否</a-select-option>
                        <a-select-option value="唯迪科">唯迪科</a-select-option>
                        <a-select-option value="小太阳">小太阳</a-select-option>
                      </a-select>
                    </div>
                    <div class="treatment-row" v-if="currentRecord.right_hg && currentRecord.right_hg !== '否'">
                      <span class="treatment-label">低强度红光档位：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.right_hg_dw"
                          style="width: 100px"
                          @change="handleRightEyeChange"
                      >
                        <a-select-option v-for="option in hgDWOptions[currentRecord.right_hg]" :key="option" :value="option">
                          {{ option }}
                        </a-select-option>
                      </a-select>
                    </div>
                    <div class="treatment-row">
                      <span class="treatment-label">理疗：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.right_physiotherapy"
                          style="width: 100px"
                          @change="handleRightEyeChange"
                      >
                        <a-select-option value="否">否</a-select-option>
                        <a-select-option value="是">是</a-select-option>
                      </a-select>
                    </div>
                    <div class="treatment-row">
                      <span class="treatment-label">视觉训练：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.right_visual_training"
                          style="width: 100px"
                          @change="handleRightEyeChange"
                      >
                        <a-select-option value="否">否</a-select-option>
                        <a-select-option value="是">是</a-select-option>
                      </a-select>
                    </div>
                  </div>
                </a-col>
                <a-col :span="12">
                  <div class="treatment-card">
                    <div class="treatment-title">
                      <img-icon class="header-icon" title="裸眼视力"/>
                      左眼方案
                    </div>
                    <div class="treatment-row">
                      <span class="treatment-label">阿托品：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.left_atropine"
                          style="width: 120px"
                          :disabled="syncEyes"
                      >
                        <a-select-option value="否">否</a-select-option>
                        <a-select-option value="0.01%">0.01%</a-select-option>
                        <a-select-option value="0.02%">0.02%</a-select-option>
                        <a-select-option value="0.05%">0.05%</a-select-option>
                      </a-select>
                    </div>
                    <div class="treatment-row">
                      <span class="treatment-label">配镜手段：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.left_glasses"
                          style="width: 140px"
                          :disabled="syncEyes"
                      >
                        <a-select-option value="否">否</a-select-option>
                        <a-select-option v-for="option in Object.keys(glassesPPOptions)" :key="option" :value="option">
                          {{ option }}
                        </a-select-option>
                      </a-select>
                    </div>
                    <div class="treatment-row" v-if="currentRecord.left_glasses && currentRecord.left_glasses !== '否'">
                      <span class="treatment-label">配镜品牌：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.left_glasses_pp"
                          style="width: 120px"
                          :disabled="syncEyes"
                      >
                        <a-select-option v-for="option in glassesPPOptions[currentRecord.left_glasses]" :key="option" :value="option">
                          {{ option }}
                        </a-select-option>
                      </a-select>
                    </div>
                    <div class="treatment-row">
                      <span class="treatment-label">低强度红光：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.left_hg"
                          style="width: 120px"
                          :disabled="syncEyes"
                      >
                        <a-select-option value="否">否</a-select-option>
                        <a-select-option value="唯迪科">唯迪科</a-select-option>
                        <a-select-option value="小太阳">小太阳</a-select-option>
                      </a-select>
                    </div>
                    <div class="treatment-row" v-if="currentRecord.left_hg && currentRecord.left_hg !== '否'">
                      <span class="treatment-label">低强度红光档位：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.left_hg_dw"
                          style="width: 100px"
                          :disabled="syncEyes"
                      >
                        <a-select-option v-for="option in hgDWOptions[currentRecord.left_hg]" :key="option" :value="option">
                          {{ option }}
                        </a-select-option>
                      </a-select>
                    </div>
                    <div class="treatment-row">
                      <span class="treatment-label">理疗：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.left_physiotherapy"
                          style="width: 100px"
                          :disabled="syncEyes"
                      >
                        <a-select-option value="否">否</a-select-option>
                        <a-select-option value="是">是</a-select-option>
                      </a-select>
                    </div>
                    <div class="treatment-row">
                      <span class="treatment-label">视觉训练：</span>
                      <a-select
                          class="modal-input"
                          v-model:value="currentRecord.left_visual_training"
                          style="width: 100px"
                          :disabled="syncEyes"
                      >
                        <a-select-option value="否">否</a-select-option>
                        <a-select-option value="是">是</a-select-option>
                      </a-select>
                    </div>
                  </div>
                </a-col>
              </a-row>
            </div>

            <div style="display: flex;justify-content: center">
              <a-button class="modal-btn modal-btn-plain" type="primary" @click="handleModalCancel">Cancel</a-button>
              <a-button class="modal-btn" type="primary" @click="handleSave">提交</a-button>
            </div>
          </a-form>
        </div>
      </a-modal>

      <!-- 打印设置弹窗 -->
      <a-modal
          v-model:visible="printModalVisible"
          width="900px"
          :footer="null"
          @cancel="handleModalCancel"
          :maskClosable="false"
          :keyboard="false"
          :getContainer="modalContainer"
      >
        <a-spin :spinning="printModalLoading" tip="正在加载历史检查记录...">
          <template #title>
            <div
                style="display: flex; align-items: center;justify-content: space-between;padding-bottom:16px;margin-bottom:16px;border-bottom: 1px solid rgba(0,0,0,0.1) ">
              <div style="display: flex; align-items: center;">
                <img-icon class="header-icon" title="打印"/>
                打印设置
              </div>
            </div>
          </template>
          <div class="modal-content">
            <a-form>
              <!-- 打印抬头设置 start -->
              <div class="content-item">
                <a-form-item label="Logo设置">
                 <div style="display: flex;align-items: center;justify-content: space-between">
                   <div style="display: flex; gap: 8px;">
                     <input id="real-input-file" type="file" accept="image/*" @change="onLogoChange"/>
                     <a-button type="primary" @click="handleUpload">选择文件</a-button>
                     <a-button type="default" @click="fetchOrganizationLogo">从后端获取</a-button>
                   </div>
                   <div v-if="logoUrl" style="margin:8px 0;"><img :src="logoUrl" style="max-width:120px;max-height:80px;"/>
                   </div>
                   <p v-if="!logoUrl" class="file-note">未选择任何文件</p>
                 </div>
                </a-form-item>
                <a-form-item label="机构名称">
                  <a-input
                      class="modal-input"
                      v-model:value="orgName"
                      placeholder="请输入机构名称"
                      allowClear
                      @change="saveOrgName"
                  />
                </a-form-item>
                <div style="display: flex;justify-content: center">
                  <a-button class="modal-btn" type="primary" @click="saveHeaderSetting">保存样式</a-button>
                </div>
              </div>
              <div class="content-item">
                <!-- 打印抬头设置 end -->
                <a-row :gutter="16">
                  <a-col :span="24">
                    <a-form-item label="打印字段">
                      <a-checkbox-group
                          v-model:value="selectedPrintFields"
                          :options="[
                        { label: '裸眼视力', value: 'naked_vision' },
                        { label: '戴镜视力', value: 'corrected_vision' },
                        { label: '旧镜度数', value: 'old_glasses' },
                        { label: '电脑验光', value: 'objective_refraction' },
                        { label: '眼轴长度', value: 'axial_length' },
                        { label: '轴率比', value: 'axial_ratio' },
                        { label: '轴余', value: 'axial_residual' },
                        { label: '身高/体重', value: 'height_weight' }
                      ]"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="24">
                    <a-form-item label="排序方式">
                      <a-radio-group v-model:value="sortOrder">
                        <a-radio value="asc">日期升序</a-radio>
                        <a-radio value="desc">日期降序</a-radio>
                      </a-radio-group>
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="24">
                    <a-form-item label="复查日期">
                      <div style="display: flex; gap: 16px; align-items: center;">
                        <a-radio-group v-model:value="reviewType" style="min-width: 120px;">
                          <a-radio value="period">复查周期</a-radio>
                          <a-radio value="custom">自定义日期</a-radio>
                        </a-radio-group>
                        <template v-if="reviewType === 'period'">
                          <a-select
                              class="modal-input"
                              v-model:value="reviewPeriod"
                              style="width: 120px;"
                              :options="[
                            { value: 1, label: '一个月' },
                            { value: 2, label: '两个月' },
                            { value: 3, label: '三个月' },
                            { value: 0, label: '自定义' }
                          ]"
                          >
                            <template #suffixIcon>
                             <img-icon class="input-icon" title="展开"/>
                            </template>
                          </a-select>
                        </template>
                        <template v-if="reviewType === 'custom'">
                          <a-date-picker
                              class="modal-input"
                              v-model:value="customReviewDateRaw"
                              :format="dateFormat"
                              style="width: 200px;"
                              allowClear
                              :value="reviewDate ? dayjs(reviewDate) : null"
                              :locale="locale"
                          >
                            <template #suffixIcon>
                              <img-icon class="input-icon" title="日历"/>
                            </template>
                          </a-date-picker>
                        </template>
                      </div>
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="24">
                    <a-form-item label="打印检查">
                      <a-checkbox-group
                          v-model:value="selectedPrintExams"
                          :options="[
                        { label: '本次检查', value: currentRecord.examination_id, disabled: true },
                        ...historyRecords.slice(0, 4).map(item => ({
                          label: (item.examination_date || '-') ,
                          value: item.examination_id
                        }))
                      ]"
                          :max="5"
                      />
                      <div style="color:#888;font-size:12px;">默认选择本次检查+最多4条历史检查，可手动调整</div>
                    </a-form-item>
                  </a-col>
                </a-row>
              </div>
                <PrintPreview
                    ref="printPreviewRef"
                    :patient="currentRecord"
                    :exams="[
                      // 转换currentRecord为扁平结构
                      {
                        examination_id: currentRecord.examination_id,
                        examination_date: currentRecord.examination?.examination_date || currentRecord.examination_date,
                        name: currentRecord.name,
                        gkid: currentRecord.gkid,
                        ...currentRecord.examination,
                        ...currentRecord
                      },
                      // 历史记录已经是扁平结构
                      ...historyRecords.filter(h => selectedPrintExams.includes(h.examination_id))
                    ]"
                    :fields="selectedPrintFields"
                    :logo-url="logoUrl"
                    :org-name="orgName"
                    :sort-order="sortOrder"
                    :review-date="reviewDate"
                />
              <div style="text-align: right; margin-top: 24px;">
                <a-space>
                  <a-button class="modal-btn" type="primary" @click="handlePrintConfirm">确认</a-button>
                </a-space>
              </div>
            </a-form>
          </div>
        </a-spin>
      </a-modal>
    </div>
  </a-spin>
</template>

<script>
import {defineComponent, ref, computed, onMounted, onBeforeUnmount, nextTick, h, watch} from 'vue';
import {
  LeftOutlined,
  RightOutlined,
  DownOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN';
import PrintPreview from '@/components/PrintPreview.vue';
import {Button as a, message} from 'ant-design-vue';
import html2canvas from 'html2canvas';
import {Modal} from 'ant-design-vue';
import ImgIcon from "@/pages/components/ImgIcon.vue";
import { getCache, updateCache } from '@/utils/cacheManager';

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');

export default defineComponent({
  name: 'Examination1',
  components: {
    ImgIcon,
    LeftOutlined,
    RightOutlined,
    DownOutlined,
    PrintPreview
  },
  setup() {
    const isLoading = ref(false);
    const isRefreshing = ref(false);
    const isFirstLoad = ref(false);
    const examinations = ref([]);
    const searchGkid = ref('');
    const searchName = ref('');
    const searchDate = ref(dayjs());
    const searchStatus = ref('all');
    const currentPage = ref(1);
    const pageSize = ref(10);
    const detailModalVisible = ref(false);
    const currentRecord = ref({});
    const originalRecord = ref({});
    const dateFormat = 'YYYY-MM-DD';
    const hasGlasses = ref(false);
    const modalContainer = ref(null);
    // 添加请求控制器来防止竞态条件
    const currentRequestController = ref(null);
    const currentRequestDate = ref('');
    const visionOptions = ref([
      '1.5', '1.2', '1.0', '0.9', '0.8', '0.7',
      '0.6', '0.5', '0.4', '0.3', '0.2', '0.1'
    ]);
    const printModalVisible = ref(false);
    const printModalLoading = ref(false);
    const printData = ref({});
    const selectedPrintFields = ref(['naked_vision', 'corrected_vision', 'axial_length', 'objective_refraction', 'height_weight']);
    const historyRecords = ref([]);
    const selectedPrintExams = ref([]);
    const logoUrl = ref('');
    const orgName = ref('');
    const printPreviewRef = ref(null);
    const sortOrder = ref('desc');
    const reviewType = ref('period');
    const reviewPeriod = ref(1); // 默认一个月
    const reviewDate = ref('');
    const customReviewDateRaw = ref(null);
    const syncEyes = ref(false);

    // 诊疗方案选项
    const glassesPPOptions = {
      '离焦镜': ['星趣控', '新乐学', '轻松控', '爱眼星', '成长乐', '小乐园', '奥拉', '学趣控', '成长怡'],
      '点扩散': ['控优点', '爱眼星', '柯学优'],
      'OK镜': ['亨泰', '普诺瞳', 'CRT', '阿尔法', '露晰德', '欧几里德', '梦戴维', '天瞳', '菁眸', '目立康'],
      '离焦软镜': ['misight', '蝶适'],
      'RGP': ['目力康', '菲仕康'],
      '单光镜': ['蔡司', '依视路', '国产'],
      '渐近镜': ['蔡司', '依视路', '国产'],
      '双效离焦点扩散': ['格林视通', '爱眼星']
    };
    const hgDWOptions = {
      '唯迪科': [0, 3, 6, 9, 12, 15],
      '小太阳': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    };

    const columns = [
      {
        title: '患者编号',
        dataIndex: ['patient', 'gkid'],
        key: 'gkid',
        width: 180
      },
      {
        title: '患者姓名',
        dataIndex: ['patient', 'name'],
        key: 'name',
        width: 120
      },
      {
        title: '检查日期',
        dataIndex: ['examination', 'examination_date'],
        key: 'examination_date',
        width: 120,
        sorter: (a, b) => {
          const dateA = new Date(a.examination.examination_date);
          const dateB = new Date(b.examination.examination_date);
          return dateA - dateB;
        },
        defaultSortOrder: 'descend'
      },
      {
        title: '年龄',
        key: 'age',
        width: 80,
        customRender: ({record}) => {
          if (record.patient?.birthDate) {
            const age = ((Date.now() - new Date(record.patient.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)).toFixed(1);
            return `${age}岁`;
          }
          return '-';
        }
      },
      {
        title: '完善状态',
        key: 'status',
        width: 100,
        customRender: ({record}) => {
          const isComplete = checkExaminationComplete(record);
          return h('span', {
            style: {
              color: isComplete ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold'
            }
          }, isComplete ? '已完善' : '未完善');
        }
      },
      {
        title: '操作',
        key: 'action',
        width: 150,
        fixed: 'right',
        customRender: ({record}) => {
          return h('div', [
            h('a-button', {
              type: 'link',
              onClick: () => handleView(record),
              style: {marginRight: '8px'}
            }, '查看'),
            h('a-button', {
              type: 'link',
              onClick: () => handleDelete(record),
              danger: true
            }, '删除')
          ]);
        }
      }
    ];

    const tableLocale = {
      filterConfirm: '确定',
      filterReset: '重置',
      emptyText: '暂无数据',
      triggerDesc: '点击降序',
      triggerAsc: '点击升序',
      cancelSort: '取消排序'
    };

    // 检查数据是否完整
    const checkExaminationComplete = (record) => {
      if (!record?.examination) return false;

      const examination = record.examination;

      // 检查基本信息（身高体重）是否完整
      const hasBasicInfo =
          (examination.height !== null && examination.height !== undefined) &&
          (examination.weight !== null && examination.weight !== undefined);

      // 检查裸眼视力是否完整
      const hasUva =
          (examination.uva_right_vision !== null && examination.uva_right_vision !== undefined) &&
          (examination.uva_left_vision !== null && examination.uva_left_vision !== undefined) &&
          (examination.uva_both_vision !== null && examination.uva_both_vision !== undefined);

      // 检查电脑验光是否完整
      const hasObjectiveRefraction =
          (examination.objective_right_spherical !== null && examination.objective_right_spherical !== undefined) &&
          (examination.objective_right_cylindrical !== null && examination.objective_right_cylindrical !== undefined) &&
          (examination.objective_right_axis !== null && examination.objective_right_axis !== undefined) &&
          (examination.objective_left_spherical !== null && examination.objective_left_spherical !== undefined) &&
          (examination.objective_left_cylindrical !== null && examination.objective_left_cylindrical !== undefined) &&
          (examination.objective_left_axis !== null && examination.objective_left_axis !== undefined);

      // 检查生物参数是否完整
      const hasBiometric =
          (examination.right_eye_axial_length !== null && examination.right_eye_axial_length !== undefined) &&
          (examination.right_eye_k1 !== null && examination.right_eye_k1 !== undefined) &&
          (examination.right_eye_k2 !== null && examination.right_eye_k2 !== undefined) &&
          (examination.left_eye_axial_length !== null && examination.left_eye_axial_length !== undefined) &&
          (examination.left_eye_k1 !== null && examination.left_eye_k1 !== undefined) &&
          (examination.left_eye_k2 !== null && examination.left_eye_k2 !== undefined);

      // 检查诊疗方案是否完整
      // 检查主字段是否有内容（空值不算内容，但"否"算内容）
      const hasRightAtropine = examination.right_atropine !== null && examination.right_atropine !== undefined && examination.right_atropine !== '';
      const hasRightGlasses = examination.right_glasses !== null && examination.right_glasses !== undefined && examination.right_glasses !== '';
      const hasRightHg = examination.right_hg !== null && examination.right_hg !== undefined && examination.right_hg !== '';
      const hasRightPhysiotherapy = examination.right_physiotherapy !== null && examination.right_physiotherapy !== undefined && examination.right_physiotherapy !== '';
      const hasRightVisualTraining = examination.right_visual_training !== null && examination.right_visual_training !== undefined && examination.right_visual_training !== '';
      
      const hasLeftAtropine = examination.left_atropine !== null && examination.left_atropine !== undefined && examination.left_atropine !== '';
      const hasLeftGlasses = examination.left_glasses !== null && examination.left_glasses !== undefined && examination.left_glasses !== '';
      const hasLeftHg = examination.left_hg !== null && examination.left_hg !== undefined && examination.left_hg !== '';
      const hasLeftPhysiotherapy = examination.left_physiotherapy !== null && examination.left_physiotherapy !== undefined && examination.left_physiotherapy !== '';
      const hasLeftVisualTraining = examination.left_visual_training !== null && examination.left_visual_training !== undefined && examination.left_visual_training !== '';

      // 检查附加选择器字段
      // 如果主字段选择了"否"，则附加选择器默认为"否"
      // 如果主字段选择了其他选项，则附加选择器必须有值
      const hasRightGlassesPP = (examination.right_glasses === '否') || 
          (examination.right_glasses && examination.right_glasses !== '否' && 
           examination.right_glasses_pp !== null && examination.right_glasses_pp !== undefined && examination.right_glasses_pp !== '');
      
      const hasRightHgDW = (examination.right_hg === '否') || 
          (examination.right_hg && examination.right_hg !== '否' && 
           examination.right_hg_dw !== null && examination.right_hg_dw !== undefined && examination.right_hg_dw !== '');
      
      const hasLeftGlassesPP = (examination.left_glasses === '否') || 
          (examination.left_glasses && examination.left_glasses !== '否' && 
           examination.left_glasses_pp !== null && examination.left_glasses_pp !== undefined && examination.left_glasses_pp !== '');
      
      const hasLeftHgDW = (examination.left_hg === '否') || 
          (examination.left_hg && examination.left_hg !== '否' && 
           examination.left_hg_dw !== null && examination.left_hg_dw !== undefined && examination.left_hg_dw !== '');

      const hasTreatmentPlan = hasRightAtropine && hasRightGlasses && hasRightGlassesPP && hasRightHg && hasRightHgDW && 
                               hasRightPhysiotherapy && hasRightVisualTraining && hasLeftAtropine && hasLeftGlasses && 
                               hasLeftGlassesPP && hasLeftHg && hasLeftHgDW && hasLeftPhysiotherapy && hasLeftVisualTraining;

      // 检查是否有戴镜视力数据
      const hasGlasses = !!(
          examination.vaec_right_old_vision ||
          examination.vaec_left_old_vision ||
          examination.vaec_both_old_vision ||
          examination.vaec_right_spherical ||
          examination.vaec_left_spherical
      );

      // 如果有戴镜视力，检查戴镜视力和旧镜度数是否完整
      if (hasGlasses) {
        const hasVaec =
            (examination.vaec_right_old_vision !== null && examination.vaec_right_old_vision !== undefined) &&
            (examination.vaec_left_old_vision !== null && examination.vaec_left_old_vision !== undefined) &&
            (examination.vaec_both_old_vision !== null && examination.vaec_both_old_vision !== undefined);

        const hasOldGlasses =
            (examination.vaec_right_spherical !== null && examination.vaec_right_spherical !== undefined) &&
            (examination.vaec_right_cylindrical !== null && examination.vaec_right_cylindrical !== undefined) &&
            (examination.vaec_right_axis !== null && examination.vaec_right_axis !== undefined) &&
            (examination.vaec_left_spherical !== null && examination.vaec_left_spherical !== undefined) &&
            (examination.vaec_left_cylindrical !== null && examination.vaec_left_cylindrical !== undefined) &&
            (examination.vaec_left_axis !== null && examination.vaec_left_axis !== undefined);

        // 对于戴镜患者，不检查裸眼视力数据
        return hasBasicInfo && hasObjectiveRefraction && hasBiometric && hasVaec && hasOldGlasses && hasTreatmentPlan;
      }

      // 如果没有戴镜视力，只检查基本项目
      return hasBasicInfo && hasUva && hasObjectiveRefraction && hasBiometric && hasTreatmentPlan;
    };

    // 过滤后的检查记录
    const filteredExaminations = computed(() => {
      console.log('过滤检查记录, 当前examinations:', examinations.value);

      if (!Array.isArray(examinations.value)) {
        console.warn('examinations 不是数组:', examinations.value);
        return [];
      }

      // 获取当前机构名称
      const currentOrganizationName = localStorage.getItem('organization_name');
      if (!currentOrganizationName) {
        console.warn('未找到当前机构名称');
        return [];
      }

      const filtered = examinations.value.filter(item => {
        if (!item?.patient || !item?.examination) {
          console.warn('无效的记录:', item);
          return false;
        }

        // 检查机构名称是否匹配
        if (!item.patient.gkid.includes(currentOrganizationName)) {
          return false;
        }

        const nameMatch = !searchName.value ||
            (item.patient.name && item.patient.name.toLowerCase().includes(searchName.value.toLowerCase()));

        // 日期匹配：examinations.value 已经是当前日期的数据，这里不需要再过滤日期
        // 因为 examinations.value 本身就是从完整缓存中按日期筛选出来的

        // 计算完善状态
        const isComplete = checkExaminationComplete(item);

        // 添加完善状态到记录中
        item.isComplete = isComplete;

        const statusMatch = searchStatus.value === 'all' ||
            (searchStatus.value === 'complete' && isComplete) ||
            (searchStatus.value === 'incomplete' && !isComplete);

        return nameMatch && statusMatch;
      });

      console.log('过滤后的结果:', filtered);
      return filtered;
    });

    const pagedExaminations = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return filteredExaminations.value.slice(start, end);
    });

    const total = computed(() => filteredExaminations.value.length);

    // 初始化数据
    const initializeData = async () => {
      // 从本地存储加载数据
      const cachedData = localStorage.getItem('checkmanagementlist');

      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          // 确保 parsedData.data 是数组
          if (parsedData.data && Array.isArray(parsedData.data)) {
            console.log('✅ 从缓存加载检查记录数据成功，共', parsedData.data.length, '条记录');
            
            // 从完整缓存中筛选出当前日期的数据并立即显示
            const currentDate = searchDate.value ? searchDate.value.format(dateFormat) : '';
            const currentDateData = parsedData.data.filter(item => 
              item.examination?.examination_date === currentDate
            );
            
            examinations.value = currentDateData;
            console.log('✅ 从完整缓存中筛选并显示当前日期数据:', currentDate, '共', currentDateData.length, '条记录');
            
            // 后台请求当前日期数据来更新完整缓存
            fetchExaminationData(false);
          } else {
            console.warn('缓存数据格式不正确，请求当前日期数据');
            examinations.value = [];
            // 缓存格式不正确，显示加载动画
            isLoading.value = true;
            await fetchExaminationData(true);
          }
        } catch (error) {
          console.error('解析缓存数据失败:', error);
          examinations.value = [];
          // 缓存解析失败，显示加载动画
          isLoading.value = true;
          await fetchExaminationData(true);
        }
      } else {
        // 如果没有缓存数据，显示加载动画
        console.log('无缓存数据，显示加载动画');
        isLoading.value = true;
        await fetchExaminationData(true);
      }
    };

    // 获取检查数据
    const fetchExaminationData = async (showLoading = false) => {
      const organizationId = localStorage.getItem('organization_id');
      const csrftoken = localStorage.getItem('csrftoken');

      // 取消之前的请求
      if (currentRequestController.value) {
        console.log('取消之前的请求:', currentRequestDate.value);
        currentRequestController.value.abort();
      }

      // 创建新的请求控制器
      currentRequestController.value = new AbortController();
      const targetDate = searchDate.value.format(dateFormat);
      currentRequestDate.value = targetDate;

      if (showLoading) {
        isLoading.value = true;
      }

      try {
        // 构建URL，请求当前日期的数据
        const url = `https://aiforoptometry.com/organization/${organizationId}/examinations/?date=${targetDate}`;
        
        console.log('请求特定日期数据:', targetDate, 'URL:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          signal: currentRequestController.value.signal
        });

        const data = await response.json();

        // 检查请求是否已被取消
        if (currentRequestDate.value !== targetDate) {
          console.log('请求已被取消，当前日期已变为:', currentRequestDate.value);
          return;
        }

        if (response.ok && data && data.data) {
          console.log('获取到单日数据:', targetDate, '共', data.data.length, '条记录');
          
          // 智能合并到现有缓存中
          const existingData = localStorage.getItem('checkmanagementlist');
          let finalMergedData;

          if (existingData) {
            try {
              const existingParsed = JSON.parse(existingData);
              
              if (existingParsed.data && Array.isArray(existingParsed.data)) {
                console.log('现有缓存数据量:', existingParsed.data.length);
                
                // 1. 移除该日期的旧数据
                const otherDateData = existingParsed.data.filter(item => 
                  item.examination?.examination_date !== targetDate
                );
                
                console.log('其他日期数据量:', otherDateData.length);
                console.log('新获取的当前日期数据量:', data.data.length);
                
                // 2. 合并数据：其他日期数据 + 新获取的该日期数据
                finalMergedData = {
                  ...existingParsed,
                  data: [...otherDateData, ...data.data]
                };
                
                console.log('✅ 合并后总数据量:', finalMergedData.data.length);
                console.log('✅ 其他日期数据已保留，缓存完整性得到维护');
              } else {
                console.warn('现有缓存数据格式不正确，使用新数据');
                finalMergedData = data;
              }
            } catch (error) {
              console.error('解析现有缓存失败，使用新数据:', error);
              finalMergedData = data;
            }
          } else {
            console.log('无现有缓存，创建新缓存');
            finalMergedData = data;
          }

          // 再次检查请求是否已被取消
          if (currentRequestDate.value !== targetDate) {
            console.log('请求已被取消，不更新UI，当前日期已变为:', currentRequestDate.value);
            return;
          }

          // 更新localStorage缓存
          localStorage.setItem('checkmanagementlist', JSON.stringify(finalMergedData));
          console.log('✅ localStorage缓存已更新，总数据量:', finalMergedData.data.length);
          
          // 验证缓存数据完整性
          validateCacheIntegrity();
          
          // 从完整缓存中筛选当前日期数据来更新UI
          const currentDateData = finalMergedData.data.filter(item => 
            item.examination?.examination_date === targetDate
          );
          examinations.value = currentDateData;
          console.log('UI已更新，当前日期数据量:', currentDateData.length);
          
          // 同步更新到IndexedDB
          if (organizationId) {
            console.log('同步更新IndexedDB...');
            
            // 异步更新IndexedDB，不阻塞UI
            updateChecksCache()
              .then(success => {
                if (success) {
                  console.log('✅ IndexedDB同步更新成功');
                  localStorage.setItem('checkmanagementlist_storage', 'indexedDB');
                  localStorage.setItem('checkmanagementlist_indexedDB_key', `checkmanagementlist_${organizationId}`);
                } else {
                  console.warn('IndexedDB同步更新失败');
                }
              })
              .catch(error => {
                console.error('IndexedDB同步更新出错:', error);
              });
          }
          
        } else {
          console.error('获取数据失败:', data);
          if (!examinations.value.length) {
            message.error('获取数据失败，请刷新页面重试');
          }
        }
      } catch (error) {
        // 检查是否是取消请求的错误
        if (error.name === 'AbortError') {
          console.log('请求已被取消:', targetDate);
          return;
        }
        
        console.error('获取数据失败:', error);
        if (!examinations.value.length) {
          message.error('网络请求失败，请检查网络连接后重试');
        }
      } finally {
        // 只有在当前请求仍然有效时才清除loading状态
        if (currentRequestDate.value === targetDate && showLoading) {
          isLoading.value = false;
        }
      }
    };

    // 检查记录是否被修改
    const hasRecordChanged = () => {
      const currentKeys = Object.keys(currentRecord.value);
      const originalKeys = Object.keys(originalRecord.value);

      // 如果键的数量不同，说明有修改
      if (currentKeys.length !== originalKeys.length) {
        return true;
      }

      // 比较每个字段的值
      return currentKeys.some(key => {
        const currentValue = currentRecord.value[key];
        const originalValue = originalRecord.value[key];

        // 特殊处理数值类型，避免精度问题
        if (typeof currentValue === 'number' && typeof originalValue === 'number') {
          return Math.abs(currentValue - originalValue) > 0.001;
        }

        return currentValue !== originalValue;
      });
    };

    // 查看详情
    const handleView = async (record) => {
      currentRecord.value = {
        ...record.examination,
        patient_id: record.patient_id,  // 添加patient_id到currentRecord中
        examination_id: record.examination_id,  // 确保examination_id正确保存
        name: record.patient?.name, // 合并患者姓名
        gkid: record.patient?.gkid,  // 合并患者编号
        review_reminder: record.review_reminder // 关键：合并复查提醒信息
      };
      originalRecord.value = {
        ...record.examination,
        patient_id: record.patient_id,  // 同样保存到originalRecord中
        examination_id: record.examination_id,
        name: record.patient?.name,
        gkid: record.patient?.gkid,
        review_reminder: record.review_reminder // 保持一致
      };

      // 根据是否有戴镜视力数据来设置hasGlasses的初始状态
      hasGlasses.value = !!(
          record.examination?.vaec_right_old_vision ||
          record.examination?.vaec_left_old_vision ||
          record.examination?.vaec_both_old_vision ||
          record.examination?.vaec_right_spherical ||
          record.examination?.vaec_left_spherical
      );

      // 初始化诊疗方案字段
      if (!currentRecord.value.right_atropine) currentRecord.value.right_atropine = null;
      if (!currentRecord.value.right_glasses) currentRecord.value.right_glasses = null;
      if (!currentRecord.value.right_glasses_pp) currentRecord.value.right_glasses_pp = null;
      if (!currentRecord.value.right_hg) currentRecord.value.right_hg = null;
      if (!currentRecord.value.right_hg_dw) currentRecord.value.right_hg_dw = null;
      if (!currentRecord.value.right_physiotherapy) currentRecord.value.right_physiotherapy = null;
      if (!currentRecord.value.right_visual_training) currentRecord.value.right_visual_training = null;
      if (!currentRecord.value.left_atropine) currentRecord.value.left_atropine = null;
      if (!currentRecord.value.left_glasses) currentRecord.value.left_glasses = null;
      if (!currentRecord.value.left_glasses_pp) currentRecord.value.left_glasses_pp = null;
      if (!currentRecord.value.left_hg) currentRecord.value.left_hg = null;
      if (!currentRecord.value.left_hg_dw) currentRecord.value.left_hg_dw = null;
      if (!currentRecord.value.left_physiotherapy) currentRecord.value.left_physiotherapy = null;
      if (!currentRecord.value.left_visual_training) currentRecord.value.left_visual_training = null;

      // 默认勾选双眼同步
      syncEyes.value = true;

      // 从后端获取患者的复查周期设置
      await fetchPatientReviewPeriod(record.patient_id);

      detailModalVisible.value = true;
    };

    // 删除记录
    const handleDelete = async (record) => {
      Modal.confirm({
        title: '确认删除',
        content: '确定要删除这条检查记录吗？此操作不可恢复。',
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          const csrftoken = localStorage.getItem('csrftoken');

          try {
            const response = await fetch('https://aiforoptometry.com/medicalrecords/delete', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
              },
              body: JSON.stringify({
                patient_id: record.patient_id,
                records_id: record.examination_id
              })
            });

            if (response.ok) {
              // 从本地存储中删除对应记录
              const cachedData = localStorage.getItem('checkmanagementlist');
              if (cachedData) {
                try {
                  const parsedData = JSON.parse(cachedData);
                  // 确保 parsedData.data 是数组
                  if (parsedData.data && Array.isArray(parsedData.data)) {
                    const updatedData = {
                      ...parsedData,
                      data: parsedData.data.filter(
                          item => item.examination_id !== record.examination_id
                      )
                    };

                    // 先更新本地存储
                    localStorage.setItem('checkmanagementlist', JSON.stringify(updatedData));

                    // 同步更新到IndexedDB
                    const organizationId = localStorage.getItem('organization_id');
                    if (organizationId) {
                      const checkKey = `checkmanagementlist_${organizationId}`;
                      console.log('删除记录后同步更新IndexedDB，key:', checkKey);
                      
                      // 异步更新缓存，不阻塞UI
                      updateChecksCache()
                        .then(success => {
                          if (success) {
                            console.log('删除记录后缓存同步更新成功');
                          } else {
                            console.warn('删除记录后缓存同步更新失败');
                          }
                        })
                        .catch(error => {
                          console.error('删除记录后缓存同步更新出错:', error);
                        });
                    }

                    // 使用 nextTick 确保 DOM 更新
                    nextTick(() => {
                      // 从完整缓存中筛选出当前日期的数据
                      const currentDate = searchDate.value ? searchDate.value.format(dateFormat) : '';
                      const currentDateData = updatedData.data.filter(item => 
                        item.examination?.examination_date === currentDate
                      );
                      examinations.value = currentDateData;
                      console.log('✅ 删除后更新UI，当前日期数据量:', currentDateData.length);
                    });
                  } else {
                    console.warn('缓存数据格式不正确，无法删除记录');
                  }
                } catch (error) {
                  console.error('更新本地存储失败:', error);
                }
              }

              message.success('删除成功');
            } else {
              const errorData = await response.json();
              message.error('删除失败: ' + (errorData.error || '未知错误'));
            }
          } catch (error) {
            console.error('删除失败:', error);
            message.error('删除失败: ' + error.message);
          }
        }
      });
    };

    // 保存记录
    const handleSave = async () => {
      const csrftoken = localStorage.getItem('csrftoken');

      try {
        if (!currentRecord.value.patient_id || !currentRecord.value.examination_id) {
          throw new Error('缺少必要的患者ID或检查记录ID');
        }

        // 准备要提交的数据
        const submitData = {
          records_id: currentRecord.value.examination_id.toString(),
          patient_id: currentRecord.value.patient_id,
          data: {
            height: currentRecord.value.height !== null && currentRecord.value.height !== undefined && currentRecord.value.height !== '' ? parseFloat(currentRecord.value.height) : null,
            weight: currentRecord.value.weight !== null && currentRecord.value.weight !== undefined && currentRecord.value.weight !== '' ? parseFloat(currentRecord.value.weight) : null,
            uva_right_vision: currentRecord.value.uva_right_vision !== null && currentRecord.value.uva_right_vision !== undefined && currentRecord.value.uva_right_vision !== '' ? parseFloat(currentRecord.value.uva_right_vision) : null,
            uva_left_vision: currentRecord.value.uva_left_vision !== null && currentRecord.value.uva_left_vision !== undefined && currentRecord.value.uva_left_vision !== '' ? parseFloat(currentRecord.value.uva_left_vision) : null,
            uva_both_vision: currentRecord.value.uva_both_vision !== null && currentRecord.value.uva_both_vision !== undefined && currentRecord.value.uva_both_vision !== '' ? parseFloat(currentRecord.value.uva_both_vision) : null,
            vaec_right_old_vision: currentRecord.value.vaec_right_old_vision !== null && currentRecord.value.vaec_right_old_vision !== undefined && currentRecord.value.vaec_right_old_vision !== '' ? parseFloat(currentRecord.value.vaec_right_old_vision) : null,
            vaec_left_old_vision: currentRecord.value.vaec_left_old_vision !== null && currentRecord.value.vaec_left_old_vision !== undefined && currentRecord.value.vaec_left_old_vision !== '' ? parseFloat(currentRecord.value.vaec_left_old_vision) : null,
            vaec_both_old_vision: currentRecord.value.vaec_both_old_vision !== null && currentRecord.value.vaec_both_old_vision !== undefined && currentRecord.value.vaec_both_old_vision !== '' ? parseFloat(currentRecord.value.vaec_both_old_vision) : null,
            objective_right_spherical: currentRecord.value.objective_right_spherical !== null && currentRecord.value.objective_right_spherical !== undefined && currentRecord.value.objective_right_spherical !== '' ? parseFloat(currentRecord.value.objective_right_spherical) : null,
            objective_right_cylindrical: currentRecord.value.objective_right_cylindrical !== null && currentRecord.value.objective_right_cylindrical !== undefined && currentRecord.value.objective_right_cylindrical !== '' ? parseFloat(currentRecord.value.objective_right_cylindrical) : null,
            objective_right_axis: currentRecord.value.objective_right_axis !== null && currentRecord.value.objective_right_axis !== undefined && currentRecord.value.objective_right_axis !== '' ? parseInt(currentRecord.value.objective_right_axis) : null,
            objective_left_spherical: currentRecord.value.objective_left_spherical !== null && currentRecord.value.objective_left_spherical !== undefined && currentRecord.value.objective_left_spherical !== '' ? parseFloat(currentRecord.value.objective_left_spherical) : null,
            objective_left_cylindrical: currentRecord.value.objective_left_cylindrical !== null && currentRecord.value.objective_left_cylindrical !== undefined && currentRecord.value.objective_left_cylindrical !== '' ? parseFloat(currentRecord.value.objective_left_cylindrical) : null,
            objective_left_axis: currentRecord.value.objective_left_axis !== null && currentRecord.value.objective_left_axis !== undefined && currentRecord.value.objective_left_axis !== '' ? parseInt(currentRecord.value.objective_left_axis) : null,
            right_eye_axial_length: currentRecord.value.right_eye_axial_length !== null && currentRecord.value.right_eye_axial_length !== undefined && currentRecord.value.right_eye_axial_length !== '' ? parseFloat(currentRecord.value.right_eye_axial_length) : null,
            left_eye_axial_length: currentRecord.value.left_eye_axial_length !== null && currentRecord.value.left_eye_axial_length !== undefined && currentRecord.value.left_eye_axial_length !== '' ? parseFloat(currentRecord.value.left_eye_axial_length) : null,
            right_eye_k1: currentRecord.value.right_eye_k1 !== null && currentRecord.value.right_eye_k1 !== undefined && currentRecord.value.right_eye_k1 !== '' ? parseFloat(currentRecord.value.right_eye_k1) : null,
            left_eye_k1: currentRecord.value.left_eye_k1 !== null && currentRecord.value.left_eye_k1 !== undefined && currentRecord.value.left_eye_k1 !== '' ? parseFloat(currentRecord.value.left_eye_k1) : null,
            right_eye_k2: currentRecord.value.right_eye_k2 !== null && currentRecord.value.right_eye_k2 !== undefined && currentRecord.value.right_eye_k2 !== '' ? parseFloat(currentRecord.value.right_eye_k2) : null,
            left_eye_k2: currentRecord.value.left_eye_k2 !== null && currentRecord.value.left_eye_k2 !== undefined && currentRecord.value.left_eye_k2 !== '' ? parseFloat(currentRecord.value.left_eye_k2) : null,
            vaec_right_spherical: currentRecord.value.vaec_right_spherical !== null && currentRecord.value.vaec_right_spherical !== undefined && currentRecord.value.vaec_right_spherical !== '' ? parseFloat(currentRecord.value.vaec_right_spherical) : null,
            vaec_right_cylindrical: currentRecord.value.vaec_right_cylindrical !== null && currentRecord.value.vaec_right_cylindrical !== undefined && currentRecord.value.vaec_right_cylindrical !== '' ? parseFloat(currentRecord.value.vaec_right_cylindrical) : null,
            vaec_right_axis: currentRecord.value.vaec_right_axis !== null && currentRecord.value.vaec_right_axis !== undefined && currentRecord.value.vaec_right_axis !== '' ? parseInt(currentRecord.value.vaec_right_axis) : null,
            vaec_left_spherical: currentRecord.value.vaec_left_spherical !== null && currentRecord.value.vaec_left_spherical !== undefined && currentRecord.value.vaec_left_spherical !== '' ? parseFloat(currentRecord.value.vaec_left_spherical) : null,
            vaec_left_cylindrical: currentRecord.value.vaec_left_cylindrical !== null && currentRecord.value.vaec_left_cylindrical !== undefined && currentRecord.value.vaec_left_cylindrical !== '' ? parseFloat(currentRecord.value.vaec_left_cylindrical) : null,
            vaec_left_axis: currentRecord.value.vaec_left_axis !== null && currentRecord.value.vaec_left_axis !== undefined && currentRecord.value.vaec_left_axis !== '' ? parseInt(currentRecord.value.vaec_left_axis) : null,
            // 诊疗方案字段
            right_atropine: currentRecord.value.right_atropine || null,
            right_glasses: currentRecord.value.right_glasses || null,
            right_glasses_pp: currentRecord.value.right_glasses_pp || null,
            right_hg: currentRecord.value.right_hg || null,
            right_hg_dw: currentRecord.value.right_hg_dw !== null && currentRecord.value.right_hg_dw !== undefined ? currentRecord.value.right_hg_dw : null,
            right_physiotherapy: currentRecord.value.right_physiotherapy || null,
            right_visual_training: currentRecord.value.right_visual_training || null,
            left_atropine: currentRecord.value.left_atropine || null,
            left_glasses: currentRecord.value.left_glasses || null,
            left_glasses_pp: currentRecord.value.left_glasses_pp || null,
            left_hg: currentRecord.value.left_hg || null,
            left_hg_dw: currentRecord.value.left_hg_dw !== null && currentRecord.value.left_hg_dw !== undefined ? currentRecord.value.left_hg_dw : null,
            left_physiotherapy: currentRecord.value.left_physiotherapy || null,
            left_visual_training: currentRecord.value.left_visual_training || null
          }
        };

        // 过滤掉空值
        Object.keys(submitData.data).forEach(key => {
          if (submitData.data[key] === null) {
            delete submitData.data[key];
          }
        });

        console.log('提交的数据:', submitData);

        const response = await fetch('https://aiforoptometry.com/medicalrecords/updaterecordspartial', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify(submitData)
        });

        const data = await response.json();

        if (data.success === "记录更新成功") {
          // 更新本地存储中的对应记录
          const cachedData = localStorage.getItem('checkmanagementlist');
          if (cachedData) {
            try {
              const parsedData = JSON.parse(cachedData);
              // 确保 parsedData.data 是数组
              if (parsedData.data && Array.isArray(parsedData.data)) {
                const updatedData = {
                  ...parsedData,
                  data: parsedData.data.map(item =>
                      item.examination_id === currentRecord.value.examination_id
                          ? {...item, examination: {...item.examination, ...submitData.data}}
                          : item
                  )
                };

                // 更新本地存储
                localStorage.setItem('checkmanagementlist', JSON.stringify(updatedData));

                // 同步更新到IndexedDB
                const organizationId = localStorage.getItem('organization_id');
                if (organizationId) {
                  const checkKey = `checkmanagementlist_${organizationId}`;
                  console.log('保存记录后同步更新IndexedDB，key:', checkKey);
                  
                  // 异步更新缓存，不阻塞UI
                  updateChecksCache()
                    .then(success => {
                      if (success) {
                        console.log('保存记录后缓存同步更新成功');
                      } else {
                        console.warn('保存记录后缓存同步更新失败');
                      }
                    })
                    .catch(error => {
                      console.error('保存记录后缓存同步更新出错:', error);
                    });
                }

                // 使用 nextTick 确保 DOM 更新
                nextTick(() => {
                  // 从完整缓存中筛选出当前日期的数据
                  const currentDate = searchDate.value ? searchDate.value.format(dateFormat) : '';
                  const currentDateData = updatedData.data.filter(item => 
                    item.examination?.examination_date === currentDate
                  );
                  examinations.value = currentDateData;
                  console.log('✅ 保存后更新UI，当前日期数据量:', currentDateData.length);
                  detailModalVisible.value = false;
                });
              } else {
                console.warn('缓存数据格式不正确，无法更新记录');
                detailModalVisible.value = false;
              }
            } catch (error) {
              console.error('更新本地存储失败:', error);
              detailModalVisible.value = false;
            }
          }

          message.success('保存成功');
        } else {
          message.error('保存失败: ' + (data.error || '未知错误'));
        }
      } catch (error) {
        console.error('保存失败:', error);
        message.error('保存失败: ' + error.message);
      }
    };

    const handleModalCancel = () => {
      if (hasRecordChanged()) {
        Modal.confirm({
          title: '确认取消',
          content: '是否保存更改？',
          okText: '保存',
          cancelText: '不保存',
          onOk: () => {
            handleSave();
          },
          onCancel: () => {
            detailModalVisible.value = false;
          }
        });
      } else {
        detailModalVisible.value = false;
      }
    };

    const prevDay = () => {
      if (!searchDate.value) {
        searchDate.value = dayjs();
      }
      searchDate.value = dayjs(searchDate.value).subtract(1, 'day');
      
      // 优先从缓存快速显示数据
      const cachedData = localStorage.getItem('checkmanagementlist');
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (parsedData.data && Array.isArray(parsedData.data)) {
            const currentDate = searchDate.value.format(dateFormat);
            const currentDateData = parsedData.data.filter(item => 
              item.examination?.examination_date === currentDate
            );
            
            examinations.value = currentDateData;
            console.log('✅ 从完整缓存中筛选并显示前一天数据:', currentDate, '共', currentDateData.length, '条记录');
            
            // 后台请求该日期数据来更新完整缓存（静默更新）
            fetchExaminationData(false);
            return;
          }
        } catch (error) {
          console.error('从缓存读取数据失败:', error);
        }
      }
      
      // 如果缓存中没有数据，从后端获取
      console.log('缓存中无该日期数据，从后端获取:', searchDate.value.format(dateFormat));
      fetchExaminationData(false);
    };

    const nextDay = () => {
      if (!searchDate.value) {
        searchDate.value = dayjs();
      }
      searchDate.value = dayjs(searchDate.value).add(1, 'day');
      
      // 优先从缓存快速显示数据
      const cachedData = localStorage.getItem('checkmanagementlist');
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (parsedData.data && Array.isArray(parsedData.data)) {
            const currentDate = searchDate.value.format(dateFormat);
            const currentDateData = parsedData.data.filter(item => 
              item.examination?.examination_date === currentDate
            );
            
            examinations.value = currentDateData;
            console.log('✅ 从完整缓存中筛选并显示后一天数据:', currentDate, '共', currentDateData.length, '条记录');
            
            // 后台请求该日期数据来更新完整缓存（静默更新）
            fetchExaminationData(false);
            return;
          }
        } catch (error) {
          console.error('从缓存读取数据失败:', error);
        }
      }
      
      // 如果缓存中没有数据，从后端获取
      console.log('缓存中无该日期数据，从后端获取:', searchDate.value.format(dateFormat));
      fetchExaminationData(false);
    };

    const handlePageChange = (page) => {
      currentPage.value = page;
    };

    // 格式化数值
    const formatNumber = (value) => {
      if (value === null) return '';
      const num = parseFloat(value);
      if (isNaN(num)) return '';
      return (num >= 0 ? '+' : '') + num.toFixed(2);
    };

    // 同步上次旧镜度数
    const handleSyncLastVaec = async () => {
      if (!currentRecord.value.examination_id) {
        message.error('请先选择一条检查记录');
        return;
      }

      const cachedData = localStorage.getItem('checkmanagementlist');
      if (!cachedData) {
        message.error('未找到历史检查记录');
        return;
      }

      try {
        const parsedData = JSON.parse(cachedData);
        if (!parsedData.data || !Array.isArray(parsedData.data)) {
          message.error('历史检查记录格式不正确');
          return;
        }
        const allExaminations = parsedData.data;

        // 找到该患者的所有检查记录并按日期排序
        const patientExaminations = allExaminations
            .filter(item => item.patient_id === currentRecord.value.patient_id)
            .sort((a, b) => new Date(b.examination.examination_date) - new Date(a.examination.examination_date));

        // 找到当前检查记录之前的最近一次检查
        const currentIndex = patientExaminations.findIndex(
            item => item.examination_id === currentRecord.value.examination_id
        );

        if (currentIndex === -1 || currentIndex === patientExaminations.length - 1) {
          message.error('未找到上次检查记录');
          return;
        }

        const lastExamination = patientExaminations[currentIndex + 1].examination;

        // 更新旧镜度数
        currentRecord.value = {
          ...currentRecord.value,
          vaec_right_spherical: lastExamination.vaec_right_spherical,
          vaec_right_cylindrical: lastExamination.vaec_right_cylindrical,
          vaec_right_axis: lastExamination.vaec_right_axis,
          vaec_left_spherical: lastExamination.vaec_left_spherical,
          vaec_left_cylindrical: lastExamination.vaec_left_cylindrical,
          vaec_left_axis: lastExamination.vaec_left_axis
        };

        message.success('同步成功');
      } catch (error) {
        console.error('同步出错:', error);
        message.error('同步出错：' + error.message);
      }
    };

    // 获取打印数据
    const getPrintData = (record) => {
      if (!record) return null;
      // 直接返回原始记录，不做计算
      return record;
    };

    // 计算下次复查日期
    const calculateNextReviewDate = (type, period) => {
      if (!currentRecord.value?.examination?.examination_date) return '';
      const currentDate = dayjs(currentRecord.value.examination.examination_date);
      if (type === 'period') {
        return currentDate.add(Number(period), 'month').format('YYYY-MM-DD');
      }
      // type === 'custom' 时，reviewDate 由用户选择
      return reviewDate.value ? dayjs(reviewDate.value).format('YYYY-MM-DD') : '';
    };

    // 监听复查类型和周期的变化
    watch([reviewType, reviewPeriod], ([newType, newPeriod]) => {
      if (newType === 'period') {
        let baseDate = '';
        if (currentRecord.value?.examination?.examination_date) {
          baseDate = currentRecord.value.examination.examination_date;
        } else if (currentRecord.value?.examination_date) {
          baseDate = currentRecord.value.examination_date;
        }
        if (baseDate) {
          // 直接使用数字值
          const months = newPeriod || 1;
          
          // 如果是自定义（0），切换到自定义模式且不预置日期
          if (newPeriod === 0) {
            reviewType.value = 'custom';
            reviewDate.value = ''; // 清空日期，让用户手动选择
          } else {
            reviewDate.value = dayjs(baseDate).add(months, 'month').format('YYYY-MM-DD');
          }
          console.log('[Examination1] 周期模式 reviewDate:', reviewDate.value, '（传递给PrintPreview）');
        }
      }
    });

    // 监听复查周期的变化，当选择自定义时自动切换到自定义模式
    watch(reviewPeriod, (newPeriod) => {
      // 如果选择自定义（0），自动切换到自定义模式
      if (newPeriod === 0) {
        reviewType.value = 'custom';
      }
      
      // 保存到本地缓存
      const systemSettings = localStorage.getItem('systemSettings');
      if (systemSettings) {
        try {
          const settings = JSON.parse(systemSettings);
          settings.checkCycle = newPeriod;
          localStorage.setItem('systemSettings', JSON.stringify(settings));
          console.log('复查周期已保存到本地缓存:', newPeriod);
        } catch (error) {
          console.error('保存复查周期到本地缓存失败:', error);
        }
      }
    });



    // 监听自定义日期的变化
    watch(customReviewDateRaw, (newVal) => {
      if (reviewType.value === 'custom' && newVal) {
        reviewDate.value = dayjs(newVal).format('YYYY-MM-DD');
        console.log('[Examination1] 自定义模式 reviewDate:', reviewDate.value, '（传递给PrintPreview）');
      }
    });

    // 监听系统设置变化事件，自动更新打印设置
    const handleSystemSettingsChanged = () => {
      console.log('检测到系统设置变化，重新获取最新设置并缓存图片');
      fetchSystemSettings();
    };

    // 添加事件监听器
    onMounted(() => {
      window.addEventListener('system-settings-changed', handleSystemSettingsChanged);
    });

    // 在组件卸载时移除事件监听器和清理请求
    onBeforeUnmount(() => {
      window.removeEventListener('system-settings-changed', handleSystemSettingsChanged);
      
      // 取消正在进行的请求
      if (currentRequestController.value) {
        console.log('组件卸载，取消正在进行的请求');
        currentRequestController.value.abort();
      }
    });

    // 打开打印设置弹窗
    const handleOpenPrintModal = async () => {
      if (currentRecord.value.patient) {
        currentRecord.value.name = currentRecord.value.patient.name;
        currentRecord.value.gkid = currentRecord.value.patient.gkid;
      }

      // 先尝试从本地缓存获取历史记录
      const cachedHistoryRecords = getCachedHistoryRecords(currentRecord.value.patient_id, currentRecord.value.examination_id);
      
      if (cachedHistoryRecords.length > 0) {
        // 有缓存数据，立即显示modal
        console.log('使用缓存的历史记录，立即显示modal');
        showPrintModalWithData(cachedHistoryRecords);
        
        // 后台异步获取最新数据
        getHistoryRecords(currentRecord.value.patient_id, currentRecord.value.examination_id).then(newHistoryRecords => {
          console.log('后台获取到最新历史记录，更新显示');
          // 短暂显示加载状态提示用户数据正在更新
          printModalLoading.value = true;
          setTimeout(() => {
            showPrintModalWithData(newHistoryRecords);
          }, 300); // 短暂延迟让用户看到更新提示
        }).catch(error => {
          console.warn('后台获取历史记录失败，继续使用缓存数据:', error);
        });
      } else {
        // 没有缓存数据，显示等待动画
        console.log('没有缓存数据，显示等待动画');
        printModalLoading.value = true;
        printModalVisible.value = true; // 先显示modal，但内容在加载中
        
        try {
          const historyRecordsData = await getHistoryRecords(currentRecord.value.patient_id, currentRecord.value.examination_id);
          showPrintModalWithData(historyRecordsData);
        } catch (error) {
          console.error('获取历史记录失败:', error);
          message.error('获取历史记录失败，请重试');
          printModalLoading.value = false;
        }
      }
      
      // 从后端获取最新的系统设置（异步执行，不阻塞弹窗显示）
      fetchSystemSettings();
      
      // 调试：检查当前logo状态
      console.log('当前logo状态:', {
        logoUrl: logoUrl.value,
        logoUrlType: logoUrl.value ? (logoUrl.value.startsWith('data:') ? 'base64' : 'url') : 'none',
        logoUrlLength: logoUrl.value ? logoUrl.value.length : 0
      });
    };

    // 显示打印modal的辅助函数
    const showPrintModalWithData = (historyRecordsData) => {
      // 停止加载动画
      printModalLoading.value = false;
      
      const currentRecordData = {...currentRecord.value};
      const historyRecordsDataProcessed = historyRecordsData.map(record => ({...record}));
      printData.value = currentRecordData;
      historyRecords.value = historyRecordsDataProcessed;
      
      // 默认选择所有检查记录（本次+最多4次的历史）
      selectedPrintExams.value = [
        currentRecord.value.examination_id, // 本次检查
        ...historyRecordsDataProcessed.slice(0, 4).map(item => item.examination_id) // 最多4次历史检查
      ];
      
      // 显示modal
      printModalVisible.value = true;
      
      // 读取本地打印设置
      const saved = localStorage.getItem('print_settings');
      if (saved) {
        try {
          const obj = JSON.parse(saved);
          if (obj.reviewType) reviewType.value = obj.reviewType;
          if (obj.reviewPeriod) reviewPeriod.value = obj.reviewPeriod;
          if (obj.sortOrder) sortOrder.value = obj.sortOrder;
        } catch (e) {
          // ignore
        }
      } else {
        // 没有本地设置，默认周期模式1个月
        reviewType.value = 'period';
        reviewPeriod.value = 1;
        sortOrder.value = 'desc';
      }
      
      // 初始化复查日期
      let baseDate = '';
      if (currentRecord.value?.examination?.examination_date) {
        baseDate = currentRecord.value.examination.examination_date;
      } else if (currentRecord.value?.examination_date) {
        baseDate = currentRecord.value.examination_date;
      }
      if (baseDate) {
        reviewDate.value = dayjs(baseDate).add(1, 'month').format('YYYY-MM-DD');
      } else {
        reviewDate.value = '';
      }
      
      console.log('[Examination1] 传递给PrintPreview的reviewDate:', reviewDate.value);
    };

    // 从本地缓存获取历史记录
    const getCachedHistoryRecords = (patientId, currentExamId) => {
      const all = examinations.value.filter(item => item.patient_id === patientId && item.examination_id !== currentExamId);
      // 按日期倒序，取最近4条
      return all.sort((a, b) => new Date(b.examination.examination_date) - new Date(a.examination.examination_date)).slice(0, 4);
    };

    // 从后端获取机构logo
    const fetchOrganizationLogo = async () => {
      try {
        const orgId = localStorage.getItem('organization_id');
        if (!orgId) {
          console.warn('未找到机构ID，无法获取logo');
          message.warning('未找到机构ID，无法获取logo');
          return;
        }

        // 显示加载状态
        message.loading('正在获取logo...', 0);

        const response = await fetch(`https://aiforoptometry.com/organization/${orgId}/logo/`, {
          method: 'GET',
          headers: {
            'X-CSRFToken': localStorage.getItem('csrftoken') || ''
          }
        });

        if (response.ok) {
          // 获取图片的blob数据
          const blob = await response.blob();
          
          // 将blob转换为base64
          const reader = new FileReader();
          reader.onload = () => {
            const base64Data = reader.result;
            logoUrl.value = base64Data;
            
            // 保存到本地存储
            localStorage.setItem('cached_logo_base64', base64Data);
            localStorage.setItem('cached_logo_timestamp', Date.now().toString());
            console.log('Logo已获取并保存到本地存储');
            message.destroy();
            message.success('Logo获取成功');
          };
          reader.readAsDataURL(blob);
        } else if (response.status === 404) {
          console.warn('该机构没有上传Logo');
          message.destroy();
          message.warning('该机构没有上传Logo');
          // 清除之前的logo
          logoUrl.value = '';
          localStorage.removeItem('cached_logo_base64');
          localStorage.removeItem('cached_logo_timestamp');
        } else {
          console.error('获取logo失败:', response.status, response.statusText);
          message.destroy();
          message.error('获取logo失败: ' + response.statusText);
        }
      } catch (error) {
        console.error('获取logo出错:', error);
        message.destroy();
        message.error('获取logo出错: ' + error.message);
      }
    };

    // 从后端获取系统设置并缓存图片
    const fetchSystemSettings = async () => {
      try {
        const orgId = localStorage.getItem('organization_id');
        if (!orgId) {
          console.warn('未找到机构ID，无法获取系统设置');
          return;
        }

        const response = await fetch(`https://aiforoptometry.com/organization/detail/${orgId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': localStorage.getItem('csrftoken') || ''
          }
        });

        const data = await response.json();
        if (data.code === 200) {
          const orgData = data.data;
          
          // 获取logo
          await fetchOrganizationLogo();
          
          orgName.value = orgData.print_name || '';
          
          // 将后端返回的天数转换为前端显示的文字格式
          const daysToPeriodText = (days) => {
            if (days <= 30) return '一个月';
            if (days <= 60) return '两个月';
            if (days <= 90) return '三个月';
            return '自定义'; // 超过90天或特殊天数，显示为自定义
          };
          
          // 更新本地存储
          const systemSettings = {
            logoUrl: logoUrl.value,
            printName: orgData.print_name || '',
            checkCycle: orgData.review_interval_days || 1,
            reviewPeriodText: daysToPeriodText(orgData.review_interval_days || 1),
            autoRefreshMode: orgData.auto_refresh_mode || 'auto',
            autoRefreshInterval: orgData.auto_refresh_interval || 15,
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
          console.log('已从后端获取最新系统设置');
        } else {
          console.error('获取系统设置失败:', data.message);
        }
      } catch (error) {
        console.error('获取系统设置出错:', error);
        // 如果获取失败，使用本地缓存
        loadCachedSettings();
      }
    };

    // 使用img标签将图片转换为base64
    const convertImageToBase64 = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // 设置超时
        const timeout = setTimeout(() => {
          reject(new Error('图片加载超时'));
        }, 10000);
        
        img.onload = () => {
          clearTimeout(timeout);
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const base64Data = canvas.toDataURL('image/png');
            console.log('图片转换base64成功，大小:', base64Data.length);
            resolve(base64Data);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = (error) => {
          clearTimeout(timeout);
          console.error('图片加载失败:', url, error);
          reject(new Error('图片加载失败'));
        };
        
        // 添加重试机制
        let retryCount = 0;
        const maxRetries = 3;
        
        const loadImage = () => {
          try {
            img.src = url;
          } catch (error) {
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`图片加载重试 ${retryCount}/${maxRetries}:`, url);
              setTimeout(loadImage, 1000);
            } else {
              reject(error);
            }
          }
        };
        
        loadImage();
      });
    };

    // 加载本地缓存的设置
    const loadCachedSettings = () => {
      const systemSettings = localStorage.getItem('systemSettings');
      if (systemSettings) {
        try {
          const settings = JSON.parse(systemSettings);
          
          // 优先使用缓存的base64 logo
          const cachedLogoBase64 = localStorage.getItem('cached_logo_base64');
          const cachedTimestamp = localStorage.getItem('cached_logo_timestamp');
          
          if (cachedLogoBase64 && cachedTimestamp) {
            // 检查缓存是否过期（7天）
            const cacheAge = Date.now() - parseInt(cachedTimestamp);
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
            
            if (cacheAge < maxAge) {
              logoUrl.value = cachedLogoBase64;
              console.log('使用缓存的logo base64，缓存时间:', Math.round(cacheAge / (1000 * 60 * 60)), '小时前');
            } else {
              console.log('缓存logo已过期，将重新获取');
              localStorage.removeItem('cached_logo_base64');
              localStorage.removeItem('cached_logo_timestamp');
            }
          }
          
          // 如果没有有效的缓存，使用系统设置中的URL（兼容旧版本）
          if (!logoUrl.value && settings.logoUrl) {
            const logoUrlFromSettings = settings.logoUrl.startsWith('http://') ? 
              settings.logoUrl.replace('http://', 'https://') : settings.logoUrl;
            logoUrl.value = logoUrlFromSettings;
            console.log('使用系统设置中的logo URL:', logoUrlFromSettings);
          }
          
          orgName.value = settings.printName || '';
          

          
          // 如果有保存的复查周期，使用它并计算复查日期
          if (settings.checkCycle !== undefined) {
            reviewPeriod.value = settings.checkCycle;
            console.log('加载保存的复查周期:', settings.checkCycle);
            
            // 根据复查周期计算下次复查日期
            const baseDate = currentRecord.value?.examination?.examination_date || currentRecord.value?.examination_date;
            if (baseDate) {
              if (settings.checkCycle === 0) {
                // 自定义模式，不设置日期，让用户手动选择
                reviewDate.value = '';
                reviewType.value = 'custom';
                console.log('自定义模式，下次复查日期由用户选择');
              } else {
                // 根据复查周期计算下次复查日期
                const months = settings.checkCycle;
                reviewDate.value = dayjs(baseDate).add(months, 'month').format('YYYY-MM-DD');
                reviewType.value = 'period';
                console.log('计算下次复查日期:', baseDate, '+', months, '个月 =', reviewDate.value);
              }
            }
          }
          
          console.log('加载本地设置完成，logoUrl:', logoUrl.value ? '已设置' : '未设置');
        } catch (e) {
          console.error('解析本地系统设置失败:', e);
        }
      } else {
        console.log('没有找到本地系统设置');
      }
    };

    // 获取历史检查记录（不含本次）
    const getHistoryRecords = async (patientId, currentExamId) => {
      try {
        // 即时获取该患者的所有检查记录
        const csrftoken = localStorage.getItem('csrftoken');
        const response = await fetch('https://aiforoptometry.com/medicalrecords/allrecords_patient_id_2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify({
            patient_id: patientId
          }),
          credentials: 'include'
        });

        const recordsData = await response.json();
        console.log('获取到的患者检查记录:', recordsData);

        if (recordsData.examination_records && Array.isArray(recordsData.examination_records)) {
          // 过滤掉当前检查记录，并按日期倒序排序
          const allRecords = recordsData.examination_records.filter(item => item.id !== currentExamId);
          const sortedRecords = allRecords.sort((a, b) => new Date(b.examination_date) - new Date(a.examination_date));
          
          // 转换数据结构以匹配PrintPreview.vue的期望格式
          const convertedRecords = sortedRecords.map(record => {
            console.log('处理历史记录:', record);
            return {
              examination_id: record.id,
              patient_id: record.patient_id,
              examination_date: record.examination_date,
              name: record.patient?.name,
              gkid: record.patient?.gkid,
              // 保留所有原始数据
              ...record
            };
          });
          
          // 取最近4条记录
          const result = convertedRecords.slice(0, 4);
          console.log('返回的历史记录:', result);
          return result;
        } else {
          console.warn('未找到检查记录或数据格式不正确');
          return [];
        }
      } catch (error) {
        console.error('获取患者历史检查记录失败:', error);
        // 如果API调用失败，回退到使用本地缓存数据
        const all = examinations.value.filter(item => item.patient_id === patientId && item.examination_id !== currentExamId);
        return all.sort((a, b) => new Date(b.examination.examination_date) - new Date(a.examination.examination_date)).slice(0, 4);
      }
    };

    // 验证图片加载状态的辅助函数
    const validateImages = (container) => {
      const images = container.querySelectorAll('img');
      const results = [];
      
      images.forEach((img, index) => {
        const result = {
          index,
          src: img.src ? img.src.substring(0, 50) + '...' : 'no src',
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          width: img.width,
          height: img.height,
          style: {
            display: img.style.display,
            visibility: img.style.visibility,
            opacity: img.style.opacity,
            position: img.style.position
          },
          className: img.className,
          crossOrigin: img.crossOrigin
        };
        results.push(result);
      });
      
      return results;
    };

    // 诊断打印问题的调试函数
    const diagnosePrintIssue = () => {
      const previewArea = document.querySelector('.a4-preview-box');
      if (!previewArea) {
        return { error: '未找到预览区域' };
      }

      const rect = previewArea.getBoundingClientRect();
      const style = window.getComputedStyle(previewArea);
      const images = previewArea.querySelectorAll('img');
      
      const diagnosis = {
        previewArea: {
          exists: true,
          rect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          },
          style: {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            transform: style.transform,
            width: style.width,
            height: style.height
          }
        },
        images: {
          count: images.length,
          details: Array.from(images).map((img, index) => ({
            index,
            src: img.src ? img.src.substring(0, 30) + '...' : 'no src',
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            className: img.className
          }))
        },
        pageInfo: {
          title: document.querySelector('.title')?.textContent,
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      };

      console.log('打印问题诊断报告:', diagnosis);
      return diagnosis;
    };

    // 等待图表渲染完成的函数
    const waitForChartsToRender = async (container) => {
      const maxWaitTime = 3000; // 最大等待3秒
      const checkInterval = 100; // 每100ms检查一次
      let waitedTime = 0;
      
      while (waitedTime < maxWaitTime) {
        // 检查是否有图表容器
        const chartContainers = container.querySelectorAll('[id*="chart"]');
        let allChartsReady = true;
        
        for (const chartContainer of chartContainers) {
          // 检查图表容器是否有内容
          const hasContent = chartContainer.children.length > 0;
          if (!hasContent) {
            allChartsReady = false;
            break;
          }
        }
        
        if (allChartsReady && chartContainers.length > 0) {
          console.log('图表渲染完成，等待时间:', waitedTime + 'ms');
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waitedTime += checkInterval;
      }
      
      if (waitedTime >= maxWaitTime) {
        console.warn('图表渲染等待超时，继续执行打印流程');
      }
    };

    // 确认打印
    const handlePrintConfirm = async () => {
      // 首先进行问题诊断
      console.log('开始打印流程，进行问题诊断...');
      const diagnosis = diagnosePrintIssue();
      
      // 确保水印在截图时可见
      const previewArea = document.querySelector('.a4-preview-box');
      if (!previewArea) {
        message.error('未找到打印区域');
        return;
      }

      // 检查预览区域的可见性和尺寸
      const previewRect = previewArea.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(previewArea);
      console.log('预览区域状态检查:', {
        rect: {
          width: previewRect.width,
          height: previewRect.height,
          top: previewRect.top,
          left: previewRect.left,
          bottom: previewRect.bottom,
          right: previewRect.right
        },
        style: {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          transform: computedStyle.transform,
          width: computedStyle.width,
          height: computedStyle.height,
          position: computedStyle.position,
          overflow: computedStyle.overflow
        },
        element: {
          offsetWidth: previewArea.offsetWidth,
          offsetHeight: previewArea.offsetHeight,
          clientWidth: previewArea.clientWidth,
          clientHeight: previewArea.clientHeight,
          scrollWidth: previewArea.scrollWidth,
          scrollHeight: previewArea.scrollHeight
        }
      });

      // 检查预览区域是否真正不可见 - 使用多种方式检查
      const rectWidth = previewRect.width;
      const rectHeight = previewRect.height;
      const offsetWidth = previewArea.offsetWidth;
      const offsetHeight = previewArea.offsetHeight;
      const display = computedStyle.display;
      const visibility = computedStyle.visibility;
      
      // 多种检查方式
      const isRectZero = rectWidth === 0 || rectHeight === 0;
      const isOffsetZero = offsetWidth === 0 || offsetHeight === 0;
      const isDisplayNone = display === 'none';
      const isVisibilityHidden = visibility === 'hidden';
      
      const isPreviewAreaHidden = isRectZero || isOffsetZero || isDisplayNone || isVisibilityHidden;
      
      console.log('预览区域可见性检查:', {
        rect: { width: rectWidth, height: rectHeight },
        offset: { width: offsetWidth, height: offsetHeight },
        style: { display, visibility },
        checks: {
          isRectZero,
          isOffsetZero,
          isDisplayNone,
          isVisibilityHidden
        },
        isHidden: isPreviewAreaHidden
      });
      
      if (isPreviewAreaHidden) {
        console.warn('预览区域不可见，尝试修复...');
        
        // 强制设置预览区域为可见
        previewArea.style.display = 'block';
        previewArea.style.visibility = 'visible';
        previewArea.style.opacity = '1';
        previewArea.style.position = 'relative';
        previewArea.style.width = '794px';
        previewArea.style.height = '1123px';
        
        // 特别处理：如果是快速复查页面，可能需要额外的等待时间
        const isQuickReviewPage = document.querySelector('.title')?.textContent?.includes('快速复查');
        if (isQuickReviewPage) {
          console.log('检测到快速复查页面，增加额外等待时间...');
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // 等待DOM更新
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 重新检查
        const newRect = previewArea.getBoundingClientRect();
        if (newRect.width === 0 || newRect.height === 0) {
          message.error('预览区域无法显示，请刷新页面后重试');
          return;
        }
      } else {
        console.log('预览区域状态正常，尺寸:', previewRect.width, 'x', previewRect.height);
        
        // 特别处理：如果是快速复查页面，增加等待时间确保图表完全渲染
        const isQuickReviewPage = document.querySelector('.title')?.textContent?.includes('快速复查');
        if (isQuickReviewPage) {
          console.log('检测到快速复查页面，等待图表渲染完成...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // 检查水印元素是否存在
      const watermarkElement = previewArea.querySelector('.logo-watermark');
      if (watermarkElement) {
        console.log('找到水印元素:', {
          src: watermarkElement.src?.substring(0, 50),
          style: watermarkElement.style.cssText,
          display: window.getComputedStyle(watermarkElement).display,
          visibility: window.getComputedStyle(watermarkElement).visibility,
          opacity: window.getComputedStyle(watermarkElement).opacity
        });
        
        // 确保水印在截图时可见
        watermarkElement.style.display = 'block';
        watermarkElement.style.visibility = 'visible';
        watermarkElement.style.opacity = '0.15';
        watermarkElement.style.zIndex = '9999';
      } else {
        console.warn('未找到水印元素');
      }

      // 显示加载提示
      message.loading('正在生成打印图片，请稍候...', 0);

      try {
        // 等待所有图片完全加载
        const images = previewArea.querySelectorAll('img');
        console.log('找到的图片数量:', images.length);
        
        // 使用验证函数详细记录每个图片的状态
        const imageValidationResults = validateImages(previewArea);
        console.log('图片验证结果:', imageValidationResults);

        // 等待所有图片加载完成，包括重试机制
        if (images.length > 0) {
          await Promise.all(
            Array.from(images).map(img => {
              return new Promise((resolve) => {
                if (img.complete && img.naturalWidth > 0) {
                  console.log('图片已加载完成:', img.src?.substring(0, 50));
                  resolve();
                } else {
                  console.log('等待图片加载:', img.src?.substring(0, 50));
                  img.onload = () => {
                    console.log('图片加载成功:', img.src?.substring(0, 50));
                    resolve();
                  };
                  img.onerror = () => {
                    console.warn('图片加载失败:', img.src?.substring(0, 50));
                    resolve(); // 即使失败也继续
                  };
                  
                  // 如果图片还没有开始加载，强制触发加载
                  if (!img.src) {
                    console.warn('图片没有src属性');
                    resolve();
                  }
                }
              });
            })
          );
        }

        // 额外等待一段时间确保图片完全渲染
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 特别等待图表渲染完成
        console.log('等待图表渲染完成...');
        await waitForChartsToRender(previewArea);

        // 生成Canvas，带重试机制
        let canvas;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            console.log(`尝试生成Canvas (第${retryCount + 1}次)`);
            
            // 使用改进的 html2canvas 配置
            canvas = await html2canvas(previewArea, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#fff',
          scale: 2, // 降低scale以提高性能
          logging: true, // 开启日志以便调试
          imageTimeout: 30000, // 增加超时时间
          removeContainer: false,
          foreignObjectRendering: false, // 禁用foreignObject渲染以提高兼容性
          width: 794, // 明确指定宽度
          height: 1123, // 明确指定高度
          ignoreElements: (element) => {
            // 不要忽略水印元素
            return false;
          },
                      onclone: (clonedDoc) => {
              console.log('开始克隆文档');
              
              // 确保克隆的文档中的图片能够正确加载
              const clonedImages = clonedDoc.querySelectorAll('img');
              clonedImages.forEach((img, index) => {
                console.log(`克隆图片${index + 1}:`, {
                  src: img.src ? img.src.substring(0, 50) + '...' : 'no src',
                  complete: img.complete,
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight,
                  className: img.className
                });
                
                // 对于URL图片，移除crossOrigin属性以避免CORS问题
                if (img.src && img.src.startsWith('http')) {
                  img.removeAttribute('crossorigin');
                  console.log('移除URL图片的crossOrigin属性');
                }
                
                // 对于Base64图片，确保正确设置
                if (img.src && img.src.startsWith('data:')) {
                  img.crossOrigin = 'anonymous';
                  console.log('设置Base64图片crossOrigin');
                }
                
                // 确保图片可见
                img.style.display = 'block';
                img.style.visibility = 'visible';
                img.style.opacity = '1';
                img.style.position = 'relative';
                
                // 特殊处理水印图片
                if (img.classList.contains('logo-watermark')) {
                  console.log('处理水印图片');
                  img.style.opacity = '0.15';
                  img.style.zIndex = '9999';
                  img.style.position = 'absolute';
                  img.style.left = '50%';
                  img.style.top = '50%';
                  img.style.transform = 'translate(-50%, -50%) rotate(-25deg)';
                  img.style.maxWidth = '70%';
                  img.style.maxHeight = '70%';
                  img.style.pointerEvents = 'none';
                  img.style.filter = 'grayscale(15%) blur(0.3px)';
                }
              });
              
              // 确保预览区域可见
              const clonedPreviewArea = clonedDoc.querySelector('.a4-preview-box');
              if (clonedPreviewArea) {
                clonedPreviewArea.style.display = 'block';
                clonedPreviewArea.style.visibility = 'visible';
                clonedPreviewArea.style.opacity = '1';
                clonedPreviewArea.style.position = 'relative';
                clonedPreviewArea.style.overflow = 'visible';
                
                // 确保预览区域内的水印可见
                const clonedWatermark = clonedPreviewArea.querySelector('.logo-watermark');
                if (clonedWatermark) {
                  console.log('克隆预览区域中找到水印元素');
                  clonedWatermark.style.display = 'block';
                  clonedWatermark.style.visibility = 'visible';
                  clonedWatermark.style.opacity = '0.15';
                  clonedWatermark.style.zIndex = '9999';
                }
              }
              
              // 隐藏小齿轮按钮（打印时不显示）
              const logoEditBtn = clonedDoc.querySelector('.logo-edit-btn-preview');
              if (logoEditBtn) {
                logoEditBtn.style.display = 'none';
                console.log('已隐藏小齿轮按钮');
              }
              
              // 验证克隆后的图片状态
              const clonedImageValidationResults = validateImages(clonedDoc);
              console.log('克隆后图片验证结果:', clonedImageValidationResults);
            }
        });

            console.log(`Canvas生成完成 (第${retryCount + 1}次)，尺寸:`, canvas.width, 'x', canvas.height);
            
            // 检查Canvas是否有效
            if (canvas.width > 0 && canvas.height > 0) {
              break; // 成功生成，退出重试循环
            } else {
              throw new Error(`Canvas尺寸无效: ${canvas.width}x${canvas.height}`);
            }
            
          } catch (error) {
            retryCount++;
            console.error(`Canvas生成失败 (第${retryCount}次):`, error);
            
            if (retryCount > maxRetries) {
              throw error; // 重试次数用完，抛出错误
            }
            
            // 等待一段时间后重试
            console.log(`等待${1000 * retryCount}ms后重试...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            
            // 重试前再次确保预览区域可见
            previewArea.style.display = 'block';
            previewArea.style.visibility = 'visible';
            previewArea.style.opacity = '1';
            previewArea.style.width = '794px';
            previewArea.style.height = '1123px';
          }
        }
        
        // 验证Canvas尺寸，避免在尺寸为0时调用getImageData
        if (canvas.width === 0 || canvas.height === 0) {
          message.destroy();
          console.error('Canvas尺寸无效:', { width: canvas.width, height: canvas.height });
          message.error('生成图片失败：预览区域尺寸无效，请检查页面显示是否正常');
          return;
        }
        
        // 调试：检查canvas中是否包含水印
        const canvasContext = canvas.getContext('2d');
        let imageData;
        try {
          imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
          console.log('Canvas图像数据:', {
            width: imageData.width,
            height: imageData.height,
            dataLength: imageData.data.length
          });
        } catch (err) {
          message.destroy();
          console.error('获取Canvas图像数据失败:', err);
          message.error('生成图片失败：无法获取图像数据，请重试');
          return;
        }

        // 如果水印没有在canvas中，手动添加水印
        const watermarkElement = previewArea.querySelector('.logo-watermark');
        if (watermarkElement && watermarkElement.src) {
          console.log('尝试手动添加水印到canvas');
          try {
            const watermarkImg = new Image();
            watermarkImg.crossOrigin = 'anonymous';
            watermarkImg.onload = () => {
              // 计算水印位置和大小
              const canvasWidth = canvas.width;
              const canvasHeight = canvas.height;
              const watermarkWidth = watermarkImg.width * 0.7; // 70% of original size
              const watermarkHeight = watermarkImg.height * 0.7;
              const x = (canvasWidth - watermarkWidth) / 2;
              const y = (canvasHeight - watermarkHeight) / 2;
              
              // 设置透明度
              canvasContext.globalAlpha = 0.15;
              
              // 绘制水印
              canvasContext.save();
              canvasContext.translate(x + watermarkWidth/2, y + watermarkHeight/2);
              canvasContext.rotate(-25 * Math.PI / 180); // -25度
              canvasContext.drawImage(watermarkImg, -watermarkWidth/2, -watermarkHeight/2, watermarkWidth, watermarkHeight);
              canvasContext.restore();
              
              console.log('水印已手动添加到canvas');
            };
            watermarkImg.src = watermarkElement.src;
          } catch (error) {
            console.warn('手动添加水印失败:', error);
          }
        }

        // 转为高质量图片
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // 关闭加载提示
        message.destroy();

        // 打开新窗口并插入图片
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(
              '<html>' +
              '<head>' +
              '<title>打印复查报告</title>' +
              '<style>' +
              'html,body{height:100%;margin:0;padding:0;background:#fff;}' +
              '@media print {' +
              'body,html{margin:0;padding:0;height:100%;width:100%;}' +
              'img{display:block;margin:auto;max-width:100vw;max-height:100vh;width:auto;height:auto;object-fit:contain;}' +
              '}' +
              'img{display:block;margin:auto;max-width:100vw;max-height:100vh;width:auto;height:auto;object-fit:contain;}' +
              '</style>' +
              '</head>' +
              '<body>' +
              `<img src="${imgData}" />` +
              '<script>' +
              'window.onload = function(){setTimeout(function(){window.print();window.close();}, 500);};' +
              '<\/script>' +
              '</body>' +
              '</html>'
          );
          printWindow.document.close();
          printWindow.focus();
          
          message.success('打印图片生成成功');
        }
      } catch (err) {
        message.destroy();
        console.error('生成打印图片失败:', err);
        
        // 根据错误类型提供更详细的错误信息
        let errorMessage = '生成图片失败：';
        if (err.message.includes('Canvas尺寸无效') || err.message.includes('IndexSizeError')) {
          errorMessage += '预览区域尺寸异常，请检查页面显示是否正常。建议刷新页面后重试。';
        } else if (err.message.includes('CORS') || err.message.includes('crossOrigin')) {
          errorMessage += '图片跨域问题，请检查图片资源是否正常加载。';
        } else if (err.message.includes('timeout')) {
          errorMessage += '生成超时，请稍后重试。';
        } else {
          errorMessage += err.message || '未知错误，请重试。';
        }
        
        message.error(errorMessage);
        
        // 提供解决建议
        console.log('打印失败解决建议:', {
          '检查预览区域': '确保.a4-preview-box元素可见且尺寸正常',
          '检查图片加载': '确保所有图片都已正确加载',
          '检查页面缩放': '避免页面缩放比例过大',
          '刷新页面': '如果问题持续，建议刷新页面后重试'
        });
      }

      // 保存打印设置到localStorage
      if (reviewType.value === 'period') {
        localStorage.setItem('print_settings', JSON.stringify({
          reviewType: reviewType.value,
          reviewPeriod: reviewPeriod.value,
          sortOrder: sortOrder.value
        }));
      }
      
      // 发送复查周期和日期到后端
      console.log('复查周期:', reviewPeriod.value);
      console.log('复查日期:', reviewDate.value);

      // 提交复查信息到后端（无论是否自定义，都发送复查周期和日期）
      if (currentRecord.value.patient_id && reviewDate.value) {
        console.log('[handlePrintConfirm] 即将发送复查信息到后端:', {
          patient_id: currentRecord.value.patient_id,
          period: reviewPeriod.value,
          review_date: reviewDate.value
        });
        
        // 发送复查周期和日期到后端
        await updateReviewPeriodToServer(currentRecord.value.patient_id, reviewPeriod.value, reviewDate.value);
      } else if (currentRecord.value.patient_id) {
        // 如果没有复查日期，提示用户
        message.warning('请设置复查日期');
        return;
      }
    };

    // 设置输入限制
    const setupInputRestrictions = () => {
      // 身高体重输入限制（保留1位小数）
      const heightWeightInputs = ['detailHeight', 'detailWeight'];
      heightWeightInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
          input.addEventListener('input', (e) => {
            let value = e.target.value;
            value = value.replace(/[^\d.]/g, '');
            if (value.includes('.')) {
              const parts = value.split('.');
              if (parts[1].length > 1) {
                value = parts[0] + '.' + parts[1].slice(0, 1);
              }
            }
            e.target.value = value;
          });

          input.addEventListener('blur', (e) => {
            let value = e.target.value;
            if (value) {
              const num = parseFloat(value);
              if (!isNaN(num)) {
                value = num.toFixed(1);
              }
            }
            e.target.value = value;
          });
        }
      });

      // 视力输入限制（保留1位小数）
      const visionInputs = [
        'detailUvaRight', 'detailUvaLeft', 'detailUvaBoth',
        'detailVaecRight', 'detailVaecLeft', 'detailVaecBoth'
      ];
      visionInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
          input.addEventListener('input', (e) => {
            let value = e.target.value;
            value = value.replace(/[^\d.]/g, '');
            if (value.includes('.')) {
              const parts = value.split('.');
              if (parts[1].length > 1) {
                value = parts[0] + '.' + parts[1].slice(0, 1);
              }
            }
            e.target.value = value;
          });
        }
      });

      // 验光和生物参数输入限制（保留2位小数）
      const precisionInputs = [
        'objective_right_spherical', 'objective_right_cylindrical',
        'objective_left_spherical', 'objective_left_cylindrical',
        'right_eye_axial_length', 'left_eye_axial_length',
        'right_eye_k1', 'left_eye_k1',
        'right_eye_k2', 'left_eye_k2'
      ];
      precisionInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
          input.addEventListener('input', (e) => {
            let value = e.target.value;
            value = value.replace(/[^\d.-]/g, '');
            if (value.includes('.')) {
              const parts = value.split('.');
              if (parts[1].length > 2) {
                value = parts[0] + '.' + parts[1].slice(0, 2);
              }
            }
            e.target.value = value;
          });

          input.addEventListener('blur', (e) => {
            let value = e.target.value;
            if (value) {
              const num = parseFloat(value);
              if (!isNaN(num)) {
                value = (num >= 0 ? '+' : '') + num.toFixed(2);
              }
            }
            e.target.value = value;
          });
        }
      });
    };

    // 处理视力值的手动输入
    const handleVisionInput = (event, field) => {
      let value = event.target.value;
      if (!value) {
        currentRecord.value[field] = '';
        return;
      }

      // 直接使用输入的值，不做格式化和验证
      currentRecord.value[field] = value;
    };

    // 处理视力值的选择
    const handleVisionSelect = (value, field) => {
      if (!currentRecord.value) {
        currentRecord.value = {};
      }
      currentRecord.value[field] = value;
    };

    // 同步全部检查记录
    const handleSyncAll = async () => {
      const organizationId = localStorage.getItem('organization_id');
      const csrftoken = localStorage.getItem('csrftoken');
      
      // 取消之前的请求
      if (currentRequestController.value) {
        console.log('取消之前的请求:', currentRequestDate.value);
        currentRequestController.value.abort();
      }
      
      isLoading.value = true;
      try {
        // 同步全部时，请求所有数据（不带日期参数）
        const url = `https://aiforoptometry.com/organization/${organizationId}/examinations/`;
        console.log('同步全部数据，请求URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          }
        });
        
        const data = await response.json();
        if (response.ok && data && data.data && Array.isArray(data.data)) {
          console.log('✅ 同步全部数据成功，总数据量:', data.data.length);
          
          // 更新localStorage缓存为完整数据
          localStorage.setItem('checkmanagementlist', JSON.stringify(data));
          console.log('✅ localStorage缓存已更新为完整数据');
          
          // 验证缓存数据完整性
          validateCacheIntegrity();
          
          // 从完整数据中筛选出当前日期的数据来显示
          const currentDate = searchDate.value ? searchDate.value.format(dateFormat) : '';
          const currentDateData = data.data.filter(item => 
            item.examination?.examination_date === currentDate
          );
          examinations.value = currentDateData;
          
          console.log('✅ UI已更新，当前日期数据量:', currentDateData.length);
          
          // 同步更新到IndexedDB
          if (organizationId) {
            console.log('同步更新IndexedDB...');
            
            // 异步更新缓存，不阻塞UI
            updateChecksCache()
              .then(success => {
                if (success) {
                  console.log('✅ IndexedDB同步更新成功');
                  localStorage.setItem('checkmanagementlist_storage', 'indexedDB');
                  localStorage.setItem('checkmanagementlist_indexedDB_key', `checkmanagementlist_${organizationId}`);
                } else {
                  console.warn('IndexedDB同步更新失败');
                }
              })
              .catch(error => {
                console.error('IndexedDB同步更新出错:', error);
              });
          }
          
          message.success(`同步完成！总数据量: ${data.data.length}, 当前日期: ${currentDateData.length}条记录`);
        } else {
          console.warn('后端返回的数据格式不正确:', data);
          message.error('同步失败: 数据格式不正确');
        }
      } catch (error) {
        console.error('同步失败:', error);
        message.error('同步失败: ' + error.message);
      } finally {
        isLoading.value = false;
      }
    };

    // 刷新当前UI显示的数据
    const handleRefresh = async () => {
      const organizationId = localStorage.getItem('organization_id');
      const csrftoken = localStorage.getItem('csrftoken');
      
      // 取消之前的请求
      if (currentRequestController.value) {
        console.log('取消之前的请求:', currentRequestDate.value);
        currentRequestController.value.abort();
      }
      
      isRefreshing.value = true;
      try {
        // 根据当前搜索条件重新获取数据
        const currentDate = searchDate.value ? searchDate.value.format(dateFormat) : '';
        const url = `https://aiforoptometry.com/organization/${organizationId}/examinations/?date=${currentDate}`;
        console.log('刷新数据，请求URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          }
        });
        
        const data = await response.json();
        if (response.ok && data && data.data && Array.isArray(data.data)) {
          console.log('✅ 刷新数据成功，数据量:', data.data.length);
          
          // 更新localStorage缓存
          const existingData = localStorage.getItem('checkmanagementlist');
          let mergedData;
          
          if (existingData) {
            try {
              const parsedExisting = JSON.parse(existingData);
              // 合并数据，保留现有数据，更新当前日期的数据
              const existingIds = new Set(parsedExisting.data.map(item => item.examination_id));
              const newData = data.data.filter(item => !existingIds.has(item.examination_id));
              
              // 更新现有记录的数据
              const updatedExistingData = parsedExisting.data.map(existingItem => {
                const updatedItem = data.data.find(
                  newItem => newItem.examination_id === existingItem.examination_id
                );
                return updatedItem || existingItem;
              });
              
              mergedData = {
                ...parsedExisting,
                data: [...updatedExistingData, ...newData]
              };
            } catch (error) {
              console.error('合并缓存数据失败:', error);
              mergedData = data;
            }
          } else {
            mergedData = data;
          }
          
          // 更新本地存储和UI
          localStorage.setItem('checkmanagementlist', JSON.stringify(mergedData));
          examinations.value = data.data || [];
          
          message.success(`刷新完成！当前显示 ${data.data.length} 条记录`);
        } else {
          console.warn('后端返回的数据格式不正确:', data);
          message.error('刷新失败: 数据格式不正确');
        }
      } catch (error) {
        console.error('刷新失败:', error);
        message.error('刷新失败: ' + error.message);
      } finally {
        isRefreshing.value = false;
      }
    };





    // 检查当前请求是否仍然有效
    const isCurrentRequestValid = (requestDate) => {
      return currentRequestDate.value === requestDate;
    };

    // 验证缓存数据完整性
    const validateCacheIntegrity = () => {
      const cachedData = localStorage.getItem('checkmanagementlist');
      if (!cachedData) {
        console.log('⚠️ 无localStorage缓存数据');
        return false;
      }

      try {
        const parsed = JSON.parse(cachedData);
        if (!parsed.data || !Array.isArray(parsed.data)) {
          console.log('⚠️ 缓存数据格式不正确');
          return false;
        }

        // 检查数据完整性
        const validRecords = parsed.data.filter(item => 
          item && 
          item.examination_id && 
          item.patient_id && 
          item.examination && 
          item.examination.examination_date
        );

        if (validRecords.length !== parsed.data.length) {
          console.warn('⚠️ 发现无效记录:', parsed.data.length - validRecords.length, '条');
        }

        // 检查日期分布
        const dateCounts = {};
        validRecords.forEach(item => {
          const date = item.examination.examination_date;
          dateCounts[date] = (dateCounts[date] || 0) + 1;
        });

        console.log('✅ 缓存数据完整性检查通过');
        console.log('  - 总记录数:', validRecords.length);
        console.log('  - 日期数量:', Object.keys(dateCounts).length);
        console.log('  - 日期分布:', dateCounts);

        return true;
      } catch (error) {
        console.error('❌ 缓存数据完整性检查失败:', error);
        return false;
      }
    };

    // 调试函数：检查缓存状态
    const debugCacheStatus = () => {
      const cachedData = localStorage.getItem('checkmanagementlist');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          console.log('=== 缓存状态调试 ===');
          console.log('localStorage缓存数据总数:', parsed.data?.length || 0);
          console.log('当前UI显示数据总数:', examinations.value.length);
          
          // 检查日期分布
          if (parsed.data && Array.isArray(parsed.data)) {
            const dateCounts = {};
            parsed.data.forEach(item => {
              const date = item.examination?.examination_date;
              if (date) {
                dateCounts[date] = (dateCounts[date] || 0) + 1;
              }
            });
            console.log('缓存中日期分布:', dateCounts);
            console.log('缓存中包含的日期数量:', Object.keys(dateCounts).length);
            
            // 显示当前日期的数据统计
            const currentDate = searchDate.value ? searchDate.value.format(dateFormat) : '';
            const currentDateCount = dateCounts[currentDate] || 0;
            console.log('当前日期数据量:', currentDate, '共', currentDateCount, '条记录');
            
            // 检查是否有重复记录
            const ids = parsed.data.map(item => item.examination_id);
            const uniqueIds = new Set(ids);
            const duplicateCount = ids.length - uniqueIds.size;
            console.log('缓存中重复记录数:', duplicateCount);
            
            // 检查IndexedDB状态
            const organizationId = localStorage.getItem('organization_id');
            if (organizationId) {
              const checkKey = `checkmanagementlist_${organizationId}`;
              console.log('IndexedDB key:', checkKey);
              console.log('存储方式标记:', localStorage.getItem('checkmanagementlist_storage'));
            }
            
            return {
              cachedCount: parsed.data.length,
              displayedCount: examinations.value.length,
              hasDuplicates: duplicateCount > 0,
              dateCount: Object.keys(dateCounts).length,
              currentDateCount: currentDateCount,
              duplicateCount: duplicateCount
            };
          }
        } catch (error) {
          console.error('解析缓存数据失败:', error);
          return null;
        }
      } else {
        console.log('没有找到localStorage缓存数据');
        return null;
      }
    };
    function handleUpload() {
      const realInputFile = document.getElementById('real-input-file');
      realInputFile.click();
    }

    function onLogoChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (evt) {
        logoUrl.value = evt.target.result;
        localStorage.setItem('print_logo_url', logoUrl.value);
      };
      reader.readAsDataURL(file);
    }

    function saveOrgName() {
      localStorage.setItem('print_org_name', orgName.value);
    }

    function saveHeaderSetting() {
      localStorage.setItem('print_logo_url', logoUrl.value);
      localStorage.setItem('print_org_name', orgName.value);
      message.success('保存成功！');
    }

    const updateReviewDateToServer = async (reminderId, reviewDate) => {
      const csrftoken = localStorage.getItem('csrftoken');
      const url = 'https://aiforoptometry.com/reminders/update_review_date/';
      const body = {
        id: reminderId,
        review_date: reviewDate
      };
      console.log('[updateReviewDateToServer] 请求参数:', body, 'url:', url);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        console.log('[updateReviewDateToServer] 响应:', data);
        if (response.ok) {
          message.success('已同步到服务器');
        } else {
          message.error(data.error || '同步失败，请重新确认打印');
        }
      } catch (err) {
        console.error('[updateReviewDateToServer] 网络错误:', err);
        message.error('网络错误，复查日期同步失败');
      }
    };

    // 获取患者的复查周期设置
    const fetchPatientReviewPeriod = async (patientId) => {
      try {
        const csrftoken = localStorage.getItem('csrftoken');
        const response = await fetch(`https://aiforoptometry.com/api/patients/${patientId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('获取到患者信息:', data);
          
          // 设置复查周期
          if (data.review_interval_days !== undefined) {
            // 将后端返回的数字转换为前端使用的格式
            const periodMap = {
              0: 0,  // 自定义
              1: 1,  // 一个月
              2: 2,  // 两个月
              3: 3   // 三个月
            };
            reviewPeriod.value = periodMap[data.review_interval_days] || 1;
            console.log('设置复查周期:', data.review_interval_days, '转换为:', reviewPeriod.value);
          }
          
          // 根据复查周期计算下次复查日期
          if (data.review_interval_days !== undefined) {
            const baseDate = currentRecord.value?.examination?.examination_date || currentRecord.value?.examination_date;
            if (baseDate) {
              if (data.review_interval_days === 0) {
                // 自定义模式，不设置日期，让用户手动选择
                reviewDate.value = '';
                reviewType.value = 'custom';
                console.log('自定义模式，下次复查日期由用户选择');
              } else {
                // 根据复查周期计算下次复查日期
                const months = data.review_interval_days;
                reviewDate.value = dayjs(baseDate).add(months, 'month').format('YYYY-MM-DD');
                reviewType.value = 'period';
                console.log('计算下次复查日期:', baseDate, '+', months, '个月 =', reviewDate.value);
              }
            }
          }
          
          // 保存到本地缓存
          const systemSettings = localStorage.getItem('systemSettings');
          if (systemSettings) {
            try {
              const settings = JSON.parse(systemSettings);
              settings.checkCycle = reviewPeriod.value;
              // 保存计算出的下次复查日期
              if (reviewDate.value) {
                settings.nextReviewDate = reviewDate.value;
              }
              localStorage.setItem('systemSettings', JSON.stringify(settings));
              console.log('患者复查信息已保存到本地缓存');
            } catch (error) {
              console.error('保存患者复查信息到本地缓存失败:', error);
            }
          }
          
        } else {
          console.warn('获取患者信息失败，使用默认值');
          reviewPeriod.value = 1; // 默认一个月
        }
      } catch (error) {
        console.error('获取患者信息出错:', error);
        reviewPeriod.value = 1; // 默认一个月
      }
    };

    // 发送复查周期和日期到后端
    const updateReviewPeriodToServer = async (patientId, period, reviewDate) => {
      const csrftoken = localStorage.getItem('csrftoken');
      const url = 'https://aiforoptometry.com/reminders/update_review_period/';
      const body = {
        patient_id: patientId,
        period: period,  // 0, 1, 2, 3
        review_date: reviewDate
      };
      console.log('[updateReviewPeriodToServer] 请求参数:', body, 'url:', url);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        console.log('[updateReviewPeriodToServer] 响应:', data);
        if (response.ok) {
          console.log('复查信息已同步到服务器');
          message.success('复查信息已保存');
        } else {
          console.error('复查信息同步失败:', data.error);
          message.error('复查信息保存失败: ' + (data.error || '未知错误'));
        }
      } catch (err) {
        console.error('[updateReviewPeriodToServer] 网络错误:', err);
        message.error('网络错误，请稍后重试');
      }
    };

    // 同步上次基本信息
    const handleSyncLastBasic = async () => {
      if (!currentRecord.value.examination_id) {
        message.error('请先选择一条检查记录');
        return;
      }

      const cachedData = localStorage.getItem('checkmanagementlist');
      if (!cachedData) {
        message.error('未找到历史检查记录');
        return;
      }

      try {
        const parsedData = JSON.parse(cachedData);
        if (!parsedData.data || !Array.isArray(parsedData.data)) {
          message.error('历史检查记录格式不正确');
          return;
        }
        const allExaminations = parsedData.data;

        // 找到该患者的所有检查记录并按日期排序
        const patientExaminations = allExaminations
            .filter(item => item.patient_id === currentRecord.value.patient_id)
            .sort((a, b) => new Date(b.examination.examination_date) - new Date(a.examination.examination_date));

        // 找到当前检查记录之前的最近一次检查
        const currentIndex = patientExaminations.findIndex(
            item => item.examination_id === currentRecord.value.examination_id
        );

        if (currentIndex === -1 || currentIndex === patientExaminations.length - 1) {
          message.error('未找到上次检查记录');
          return;
        }

        const lastExamination = patientExaminations[currentIndex + 1].examination;

        // 检查是否有基本数据
        const hasBasicData = lastExamination.height !== null && lastExamination.height !== undefined &&
            lastExamination.weight !== null && lastExamination.weight !== undefined;

        if (!hasBasicData) {
          message.warning('同步成功，但是上次该部分数据缺失');
          return;
        }

        // 更新基本信息
        currentRecord.value = {
          ...currentRecord.value,
          height: lastExamination.height,
          weight: lastExamination.weight
        };

        message.success('同步成功');
      } catch (error) {
        console.error('同步出错:', error);
        message.error('同步出错：' + error.message);
      }
    };

    // 同步上次视力检查
    const handleSyncLastVision = async () => {
      if (!currentRecord.value.examination_id) {
        message.error('请先选择一条检查记录');
        return;
      }

      const cachedData = localStorage.getItem('checkmanagementlist');
      if (!cachedData) {
        message.error('未找到历史检查记录');
        return;
      }

      try {
        const parsedData = JSON.parse(cachedData);
        if (!parsedData.data || !Array.isArray(parsedData.data)) {
          message.error('历史检查记录格式不正确');
          return;
        }
        const allExaminations = parsedData.data;

        // 找到该患者的所有检查记录并按日期排序
        const patientExaminations = allExaminations
            .filter(item => item.patient_id === currentRecord.value.patient_id)
            .sort((a, b) => new Date(b.examination.examination_date) - new Date(a.examination.examination_date));

        // 找到当前检查记录之前的最近一次检查
        const currentIndex = patientExaminations.findIndex(
            item => item.examination_id === currentRecord.value.examination_id
        );

        if (currentIndex === -1 || currentIndex === patientExaminations.length - 1) {
          message.error('未找到上次检查记录');
          return;
        }

        const lastExamination = patientExaminations[currentIndex + 1].examination;

        // 检查是否有视力数据
        const hasVisionData = lastExamination.uva_right_vision !== null && lastExamination.uva_right_vision !== undefined &&
            lastExamination.uva_left_vision !== null && lastExamination.uva_left_vision !== undefined &&
            lastExamination.uva_both_vision !== null && lastExamination.uva_both_vision !== undefined;

        // 检查是否有戴镜视力数据
        const hasVaecData = lastExamination.vaec_right_old_vision !== null && lastExamination.vaec_right_old_vision !== undefined &&
            lastExamination.vaec_left_old_vision !== null && lastExamination.vaec_left_old_vision !== undefined &&
            lastExamination.vaec_both_old_vision !== null && lastExamination.vaec_both_old_vision !== undefined;

        if (!hasVisionData && !hasVaecData) {
          message.warning('同步成功，但是上次该部分数据缺失');
          return;
        }

        // 更新视力数据
        const updatedData = {
          ...currentRecord.value
        };

        // 同步裸眼视力数据
        if (hasVisionData) {
          updatedData.uva_right_vision = lastExamination.uva_right_vision;
          updatedData.uva_left_vision = lastExamination.uva_left_vision;
          updatedData.uva_both_vision = lastExamination.uva_both_vision;
        }

        // 同步戴镜视力数据
        if (hasVaecData) {
          updatedData.vaec_right_old_vision = lastExamination.vaec_right_old_vision;
          updatedData.vaec_left_old_vision = lastExamination.vaec_left_old_vision;
          updatedData.vaec_both_old_vision = lastExamination.vaec_both_old_vision;
          // 自动勾选戴镜视力
          hasGlasses.value = true;
        }

        currentRecord.value = updatedData;

        message.success('同步成功');
      } catch (error) {
        console.error('同步出错:', error);
        message.error('同步出错：' + error.message);
      }
    };

    // 同步上次电脑验光
    const handleSyncLastObjective = async () => {
      if (!currentRecord.value.examination_id) {
        message.error('请先选择一条检查记录');
        return;
      }

      const cachedData = localStorage.getItem('checkmanagementlist');
      if (!cachedData) {
        message.error('未找到历史检查记录');
        return;
      }

      try {
        const parsedData = JSON.parse(cachedData);
        if (!parsedData.data || !Array.isArray(parsedData.data)) {
          message.error('历史检查记录格式不正确');
          return;
        }
        const allExaminations = parsedData.data;

        // 找到该患者的所有检查记录并按日期排序
        const patientExaminations = allExaminations
            .filter(item => item.patient_id === currentRecord.value.patient_id)
            .sort((a, b) => new Date(b.examination.examination_date) - new Date(a.examination.examination_date));

        // 找到当前检查记录之前的最近一次检查
        const currentIndex = patientExaminations.findIndex(
            item => item.examination_id === currentRecord.value.examination_id
        );

        if (currentIndex === -1 || currentIndex === patientExaminations.length - 1) {
          message.error('未找到上次检查记录');
          return;
        }

        const lastExamination = patientExaminations[currentIndex + 1].examination;

        // 检查是否有电脑验光数据
        const hasObjectiveData = lastExamination.objective_right_spherical !== null && lastExamination.objective_right_spherical !== undefined &&
            lastExamination.objective_right_cylindrical !== null && lastExamination.objective_right_cylindrical !== undefined &&
            lastExamination.objective_right_axis !== null && lastExamination.objective_right_axis !== undefined &&
            lastExamination.objective_left_spherical !== null && lastExamination.objective_left_spherical !== undefined &&
            lastExamination.objective_left_cylindrical !== null && lastExamination.objective_left_cylindrical !== undefined &&
            lastExamination.objective_left_axis !== null && lastExamination.objective_left_axis !== undefined;

        if (!hasObjectiveData) {
          message.warning('同步成功，但是上次该部分数据缺失');
          return;
        }

        // 更新电脑验光数据
        currentRecord.value = {
          ...currentRecord.value,
          objective_right_spherical: lastExamination.objective_right_spherical,
          objective_right_cylindrical: lastExamination.objective_right_cylindrical,
          objective_right_axis: lastExamination.objective_right_axis,
          objective_left_spherical: lastExamination.objective_left_spherical,
          objective_left_cylindrical: lastExamination.objective_left_cylindrical,
          objective_left_axis: lastExamination.objective_left_axis
        };

        message.success('同步成功');
      } catch (error) {
        console.error('同步出错:', error);
        message.error('同步出错：' + error.message);
      }
    };

    // 诊疗方案相关函数
    // 右眼字段变化处理
    const handleRightEyeChange = () => {
      if (syncEyes.value) {
        syncEyesToLeft();
      }
    };

    // 监听双眼同步状态变化
    watch(syncEyes, (newVal) => {
      if (newVal) {
        // 当重新勾选双眼同步时，将右眼数据同步到左眼
        syncEyesToLeft();
      }
    });

    // 右眼配镜手段变化处理
    const handleRightGlassesChange = () => {
      // 清空右眼配镜手段的附加选项
      currentRecord.value.right_glasses_pp = null;
      if (syncEyes.value) {
        syncEyesToLeft();
      }
    };

    // 右眼低强度红光变化处理
    const handleRightHgChange = () => {
      // 清空右眼低强度红光的附加选项
      currentRecord.value.right_hg_dw = null;
      if (syncEyes.value) {
        syncEyesToLeft();
      }
    };

    // 右眼字段同步到左眼
    const syncEyesToLeft = () => {
      currentRecord.value.left_atropine = currentRecord.value.right_atropine;
      currentRecord.value.left_glasses = currentRecord.value.right_glasses;
      currentRecord.value.left_glasses_pp = currentRecord.value.right_glasses_pp;
      currentRecord.value.left_hg = currentRecord.value.right_hg;
      currentRecord.value.left_hg_dw = currentRecord.value.right_hg_dw;
      currentRecord.value.left_physiotherapy = currentRecord.value.right_physiotherapy;
      currentRecord.value.left_visual_training = currentRecord.value.right_visual_training;
    };

    // 编号搜索处理函数
    const handleSearchByGkid = () => {
      if (!searchGkid.value || searchGkid.value.trim() === '') {
        message.warning('请输入患者编号');
        return;
      }

      const searchNumber = searchGkid.value.trim();
      console.log('正在搜索编号:', searchNumber);

      // 从localStorage获取patientlist
      const patientListData = localStorage.getItem('patientlist');
      if (!patientListData) {
        console.log('未找到patientlist数据');
        message.warning('未找到患者列表数据');
        return;
      }

      try {
        const patientList = JSON.parse(patientListData);
        if (!Array.isArray(patientList)) {
          console.log('patientlist数据格式不正确');
          message.warning('患者列表数据格式不正确');
          return;
        }

        // 精确匹配gkid的数字部分
        const matchedPatients = patientList.filter(patient => {
          if (!patient.gkid) return false;
          
          // 提取gkid中的数字部分
          const gkidNumbers = patient.gkid.match(/\d+/g);
          if (!gkidNumbers) return false;
          
          // 检查是否有任何一个数字部分完全等于搜索的数字
          return gkidNumbers.some(num => num === searchNumber);
        });

        if (matchedPatients.length > 0) {
          console.log('找到匹配的患者:', matchedPatients);
          matchedPatients.forEach(patient => {
            console.log(`患者ID: ${patient.id}, 编号: ${patient.gkid}, 姓名: ${patient.name}`);
          });
          message.success(`找到 ${matchedPatients.length} 个匹配的患者`);
        } else {
          console.log('未找到匹配的患者');
          message.info('未找到匹配的患者编号');
        }
      } catch (error) {
        console.error('解析patientlist数据失败:', error);
        message.error('解析患者列表数据失败');
      }
    };

    // 同步上次诊疗方案
    const handleSyncLastTreatment = async () => {
      if (!currentRecord.value.examination_id) {
        message.error('请先选择一条检查记录');
        return;
      }

      const cachedData = localStorage.getItem('checkmanagementlist');
      if (!cachedData) {
        message.error('未找到历史检查记录');
        return;
      }

      try {
        const parsedData = JSON.parse(cachedData);
        if (!parsedData.data || !Array.isArray(parsedData.data)) {
          message.error('历史检查记录格式不正确');
          return;
        }
        const allExaminations = parsedData.data;

        // 找到该患者的所有检查记录并按日期排序
        const patientExaminations = allExaminations
            .filter(item => item.patient_id === currentRecord.value.patient_id)
            .sort((a, b) => new Date(b.examination.examination_date) - new Date(a.examination.examination_date));

        // 找到当前检查记录之前的最近一次检查
        const currentIndex = patientExaminations.findIndex(
            item => item.examination_id === currentRecord.value.examination_id
        );

        if (currentIndex === -1 || currentIndex === patientExaminations.length - 1) {
          message.error('未找到上次检查记录');
          return;
        }

        const lastExamination = patientExaminations[currentIndex + 1].examination;

        // 检查是否有诊疗方案数据（使用与完善判定相同的逻辑）
        const hasRightAtropine = lastExamination.right_atropine !== null && lastExamination.right_atropine !== undefined && lastExamination.right_atropine !== '';
        const hasRightGlasses = lastExamination.right_glasses !== null && lastExamination.right_glasses !== undefined && lastExamination.right_glasses !== '';
        const hasRightHg = lastExamination.right_hg !== null && lastExamination.right_hg !== undefined && lastExamination.right_hg !== '';
        const hasRightPhysiotherapy = lastExamination.right_physiotherapy !== null && lastExamination.right_physiotherapy !== undefined && lastExamination.right_physiotherapy !== '';
        const hasRightVisualTraining = lastExamination.right_visual_training !== null && lastExamination.right_visual_training !== undefined && lastExamination.right_visual_training !== '';
        
        const hasLeftAtropine = lastExamination.left_atropine !== null && lastExamination.left_atropine !== undefined && lastExamination.left_atropine !== '';
        const hasLeftGlasses = lastExamination.left_glasses !== null && lastExamination.left_glasses !== undefined && lastExamination.left_glasses !== '';
        const hasLeftHg = lastExamination.left_hg !== null && lastExamination.left_hg !== undefined && lastExamination.left_hg !== '';
        const hasLeftPhysiotherapy = lastExamination.left_physiotherapy !== null && lastExamination.left_physiotherapy !== undefined && lastExamination.left_physiotherapy !== '';
        const hasLeftVisualTraining = lastExamination.left_visual_training !== null && lastExamination.left_visual_training !== undefined && lastExamination.left_visual_training !== '';

        const hasRightGlassesPP = (lastExamination.right_glasses === '否') || 
            (lastExamination.right_glasses && lastExamination.right_glasses !== '否' && 
             lastExamination.right_glasses_pp !== null && lastExamination.right_glasses_pp !== undefined && lastExamination.right_glasses_pp !== '');
        
        const hasRightHgDW = (lastExamination.right_hg === '否') || 
            (lastExamination.right_hg && lastExamination.right_hg !== '否' && 
             lastExamination.right_hg_dw !== null && lastExamination.right_hg_dw !== undefined && lastExamination.right_hg_dw !== '');
        
        const hasLeftGlassesPP = (lastExamination.left_glasses === '否') || 
            (lastExamination.left_glasses && lastExamination.left_glasses !== '否' && 
             lastExamination.left_glasses_pp !== null && lastExamination.left_glasses_pp !== undefined && lastExamination.left_glasses_pp !== '');
        
        const hasLeftHgDW = (lastExamination.left_hg === '否') || 
            (lastExamination.left_hg && lastExamination.left_hg !== '否' && 
             lastExamination.left_hg_dw !== null && lastExamination.left_hg_dw !== undefined && lastExamination.left_hg_dw !== '');

        const hasTreatmentData = hasRightAtropine && hasRightGlasses && hasRightGlassesPP && hasRightHg && hasRightHgDW && 
                                hasRightPhysiotherapy && hasRightVisualTraining && hasLeftAtropine && hasLeftGlasses && 
                                hasLeftGlassesPP && hasLeftHg && hasLeftHgDW && hasLeftPhysiotherapy && hasLeftVisualTraining;

        if (!hasTreatmentData) {
          message.warning('同步成功，但是上次该部分数据缺失');
          return;
        }

        // 更新诊疗方案数据
        currentRecord.value = {
          ...currentRecord.value,
          right_atropine: lastExamination.right_atropine,
          right_glasses: lastExamination.right_glasses,
          right_glasses_pp: lastExamination.right_glasses_pp,
          right_hg: lastExamination.right_hg,
          right_hg_dw: lastExamination.right_hg_dw,
          right_physiotherapy: lastExamination.right_physiotherapy,
          right_visual_training: lastExamination.right_visual_training,
          left_atropine: lastExamination.left_atropine,
          left_glasses: lastExamination.left_glasses,
          left_glasses_pp: lastExamination.left_glasses_pp,
          left_hg: lastExamination.left_hg,
          left_hg_dw: lastExamination.left_hg_dw,
          left_physiotherapy: lastExamination.left_physiotherapy,
          left_visual_training: lastExamination.left_visual_training
        };

        // 同步上次后，取消双眼同步勾选，因为数据已经不同步了
        syncEyes.value = false;

        message.success('同步成功');
      } catch (error) {
        console.error('同步出错:', error);
        message.error('同步出错：' + error.message);
      }
    };

    onMounted(() => {
      console.log('组件挂载，开始初始化数据');
      // 确保日期被正确初始化
      if (!searchDate.value) {
        searchDate.value = dayjs();
      }
      modalContainer.value = document.body;
      
      // 清理旧的base64缓存，避免存储空间浪费
      if (localStorage.getItem('cached_logo_base64')) {
        localStorage.removeItem('cached_logo_base64');
        console.log('已清理旧的base64缓存');
      }
      
      // 初始化logo和机构名称从系统设置
      loadCachedSettings();
    
      // 从后端获取最新的系统设置和logo
      fetchSystemSettings();
      
      // 如果缓存中没有logo，立即获取
      if (!logoUrl.value) {
        fetchOrganizationLogo();
      }
      
      // 检查缓存状态
      const cacheStatus = debugCacheStatus();
      if (cacheStatus) {
        console.log('当前缓存状态:', cacheStatus);
        if (cacheStatus.dateCount === 1) {
          console.log('📅 缓存中只包含单日数据，这是正常的首次访问状态');
        } else if (cacheStatus.dateCount > 1) {
          console.log('✅ 缓存中包含多日数据，缓存状态良好');
        } else {
          console.log('⚠️ 缓存中无日期数据，需要初始化');
        }
      } else {
        console.log('📝 无缓存数据，将进行首次数据加载');
      }
      
      initializeData();
      setupInputRestrictions();
    });

    // 从缓存加载检查记录数据
    const loadChecksFromCache = async () => {
      try {
        const organizationId = localStorage.getItem('organization_id');
        if (!organizationId) {
          console.log('未找到organization_id，无法从IndexedDB加载缓存');
          return false;
        }

        console.log('正在从IndexedDB加载检查记录数据...');
        const result = await getCache('checkmanagementlist', organizationId);
        
        if (result.data && Array.isArray(result.data)) {
          // 将IndexedDB的数据同步到localStorage
          const completeData = {
            data: result.data,
            // 可以添加其他元数据
          };
          localStorage.setItem('checkmanagementlist', JSON.stringify(completeData));
          
          // 从完整缓存中筛选出当前日期的数据来显示
          const currentDate = searchDate.value ? searchDate.value.format(dateFormat) : '';
          const currentDateData = result.data.filter(item => 
            item.examination?.examination_date === currentDate
          );
          
          examinations.value = currentDateData;
          console.log(`✅ 从IndexedDB加载检查记录数据成功，共${result.data.length}条记录，当前日期: ${currentDateData.length}条，数据来源: ${result.source}`);
          return true;
        } else {
          console.log('IndexedDB中未找到检查记录数据');
          return false;
        }
      } catch (error) {
        console.error('从IndexedDB加载检查记录数据失败:', error);
        return false;
      }
    };

    // 更新缓存中的检查记录数据
    const updateChecksCache = async () => {
      try {
        const organizationId = localStorage.getItem('organization_id');
        if (!organizationId) {
          console.log('未找到organization_id，无法更新IndexedDB缓存');
          return false;
        }

        // 获取完整的缓存数据
        const cachedData = localStorage.getItem('checkmanagementlist');
        if (!cachedData) {
          console.log('未找到localStorage缓存数据，无法更新IndexedDB');
          return false;
        }

        const completeData = JSON.parse(cachedData);
        console.log('正在更新IndexedDB缓存，数据量:', completeData.data?.length || 0);
        
        // 确保传递给updateCache的是完整的数据结构
        const success = await updateCache('checkmanagementlist', completeData, organizationId);
        
        if (success) {
          console.log('✅ IndexedDB缓存更新成功');
          return true;
        } else {
          console.error('IndexedDB缓存更新失败');
          return false;
        }
      } catch (error) {
        console.error('更新IndexedDB缓存失败:', error);
        return false;
      }
    };

    

    return {
      isLoading,
      isRefreshing,
      isFirstLoad,
      searchGkid,
      searchName,
      searchDate,
      searchStatus,
      columns,
      filteredExaminations,
      pagedExaminations,
      currentPage,
      pageSize,
      total,
      detailModalVisible,
      currentRecord,
      originalRecord,
      tableLocale,
      dateFormat,
      visionOptions,
      hasGlasses,
      modalContainer,
      handleView,
      handleDelete,
      handleSave,
      handleModalCancel,
      prevDay,
      nextDay,
      handlePageChange,
      formatNumber,
      handleSyncLastVaec,
      handleOpenPrintModal,
      getHistoryRecords,
      handlePrintConfirm,
      printModalVisible,
      printModalLoading,
      printData,
      selectedPrintFields,
      historyRecords,
      selectedPrintExams,
      handleSyncAll,
      handleRefresh,
      logoUrl,
      orgName,
      onLogoChange,
      saveOrgName,
      saveHeaderSetting,
      printPreviewRef,
      handleVisionSelect,
      handleVisionInput,
      getPrintData,
      sortOrder,
      reviewType,
      reviewPeriod,
      customReviewDateRaw,
      reviewDate,
      handleSyncLastBasic,
      handleSyncLastVision,
      handleSyncLastObjective,
      handleUpload,
      locale,
      syncEyes,
      glassesPPOptions,
      hgDWOptions,
      handleRightEyeChange,
      handleRightGlassesChange,
      handleRightHgChange,
      handleSyncLastTreatment,
      handleSearchByGkid,
      fetchOrganizationLogo,
      updateReviewPeriodToServer,
      fetchPatientReviewPeriod,
      debugCacheStatus,
      loadChecksFromCache,
      updateChecksCache,
      validateCacheIntegrity,
      isCurrentRequestValid,
      diagnosePrintIssue,
      waitForChartsToRender
    };
  }
});
</script>

<style scoped lang="scss">
.wrapper {
  background: #FFFFFF;
  border-radius: 10px 10px 10px 10px;
  border: 1px solid #FFFFFF;
  padding: 10px;
}

.header-title {
  display: flex;
  align-items: center;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.header-title .title {
  font-weight: 500;
  font-size: 22px;
  color: #000714;
  text-align: left;
  font-style: normal;
  text-transform: none;
}

.detail-section {
  padding: 18px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #EEF3FC 0%, #FFFFFF 100%);
  border-radius: 20px 20px 20px 20px;
  border: 1px solid #E4ECFC;

  h4 {
    font-weight: 500;
    font-size: 20px;
    color: #000714;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    margin: 0 0 16px 0 ;
    border-bottom: 1px solid rgba(34, 75, 150, 0.1);
  }

  :deep(.modal-input) {
    background: #FFFFFF;
    border-radius: 8px 8px 8px 8px;
    border: 1px solid #E27244;
    .ant-input-number {
      border: none;
    }
    .ant-input-number-group-addon{
      background: #E27244;
      border: none;
      color: #ffffff;
    }
  }

  :deep(.modal-input-compact) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  :deep(.ant-input-group) {
    display: flex;
  }

  :deep(.modal-btn-compact) {
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #E27244;
    border: none;
    width: 40px;
    height: 40px;
  }
}

.vision-group,
.refraction-group,
.biometric-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.vision-label,
.eye-label {
  min-width: 80px;
  color: #555;
  font-weight: 500;
}

.status-complete {
  color: #52c41a;
  font-weight: bold;
}

.status-incomplete {
  color: #ff4d4f;
  font-weight: bold;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .vision-group,
  .refraction-group,
  .biometric-group {
    flex-direction: column;
    align-items: flex-start;
  }

  .vision-label,
  .eye-label {
    margin-bottom: 8px;
  }
}

.print-btn {
  margin-right: 36px;
}

@media print {
  .modal-buttons,
  .pagination,
  .filter-container {
    display: none !important;
  }
}

.vision-group .ant-input-group {
  width: auto !important;
  margin-right: 8px;
}

.vision-group .ant-input-group.disabled-group {
  opacity: 0.65;
}

:deep(.vision-dropdown) {
  max-height: 300px;
  overflow-y: auto;
}

:deep(.ant-dropdown-menu) {
  max-height: 300px;
  overflow-y: auto;
}

.refraction-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.refraction-group .ant-input-number {
  width: 120px;
}

.eye-label {
  min-width: 80px;
  color: #555;
  font-weight: 500;
}

:deep(.ant-table) {
  th.ant-table-cell {
    background-color: rgba(34, 75, 150, 0.1);
  }
}

.header-input {
  width: 188px;
  height: 38px;
  background: #FFFFFF;
  border-radius: 8px 8px 8px 8px;
  border: 1px solid #E27244;
}

:deep(.header-input) {
  .ant-select-selector {
    border: none;
    height: 36px;
  }

  .ant-select-selection-item {
    line-height: 38px;
  }
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

.header-little-btn {
  width: 38px;
  height: 38px;
  background: linear-gradient(-90deg, #E27244 0%, #E29D44 100%);
  border-radius: 8px 8px 8px 8px;
}

:deep(.pagination) {
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

.content-item {
  background: linear-gradient(135deg, #EEF3FC 0%, #FFFFFF 100%);
  border-radius: 20px 20px 20px 20px;
  border: 1px solid #E4ECFC;
  padding: 24px;
  margin-bottom: 16px;
  position: relative;

  #real-input-file {
    position: absolute;
    width: 0;
    height: 0;
    top: 0;
    left: 0;
    opacity: 0;
  }

  .file-note {
    font-weight: 400;
    font-size: 16px;
    color: #E27244;
    margin: 0;
  }
}

:deep(.modal-input) {
  background: #FFFFFF;
  border-radius: 8px 8px 8px 8px;
  border: 1px solid #E27244;
  .ant-input-number {
    border: none;
  }
}
:deep(.ant-checkbox-wrapper){
  &:hover {
    .ant-checkbox .ant-checkbox-inner{
      background-color: transparent !important;
      border-color: #E27244 !important;
    }

    .ant-checkbox-checked .ant-checkbox-inner{
      background-color: #E27244 !important;
    }
  }
}

:deep(.ant-checkbox-checked) {
  .ant-checkbox-inner{
    background-color: #E27244;
    border-color: #E27244;
  }
}

:deep(.ant-radio-checked) {
   .ant-radio-inner{
     background-color: #E27244;
     border-color: #E27244;
   }
}

.treatment-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  padding: 18px 20px 12px 20px;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.treatment-title {
  font-size: 16px;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.treatment-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}

.treatment-label {
  min-width: 80px;
  color: #666;
  display: inline-block;
  text-align: right;
  font-weight: 500;
}
</style>
