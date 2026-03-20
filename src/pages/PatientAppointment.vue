<template>
  <a-spin :spinning="isLoading">
    <div class="wrapper">
      <div class="header-container">
        <div class="header-title">
          <img-icon class="header-icon" title="预约"/>
          <h2 class="title" style="margin: 0;">预约管理</h2>
        </div>
        <!-- 搜索和筛选区域 -->
        <div class="filter-container">
          <a-input
              class="header-input"
              v-model:value="searchText"
              placeholder="搜索患者姓名或预约编号"
              style="width: 300px; margin-right: 16px;"
              @search="handleSearch"
          >
            <template #suffix>
              <img-icon class="input-icon" style="margin-right: 0" title="搜索"/>
            </template>
          </a-input>
          <a-date-picker
              class="header-input"
              v-model:value="selectedDate"
              :disabledDate="disabledDate"
              style="margin-right: 16px; width: 200px;"
              placeholder="选择日期（留空显示全部）"
              :locale="locale"
              :allowClear="true"
              @change="handleDateChange"
          >
            <template #suffixIcon>
              <img-icon class="input-icon" title="日历" style="margin-right: 0"/>
            </template>
          </a-date-picker>
          <a-select
              class="header-input"
              v-model:value="selectedDoctors"
              placeholder="筛选医生（可多选）"
              mode="multiple"
              :allowClear="true"
              style="margin-right: 16px; width: 200px;"
              :options="doctorListOptions"
              :field-names="{ label: 'name', value: 'id' }"
              :loading="doctorList.length === 0"
          >
            <template #suffixIcon>
              <img-icon class="input-icon" title="展开" style="margin-right: 0"/>
            </template>
          </a-select>
          <a-button class="header-btn" type="primary" @click="handleRefreshInvites" style="margin-right: 16px;">
            刷新
          </a-button>
          <a-button v-if="false" class="header-btn" type="primary" @click="handleAddAppointment">新增预约</a-button>
          <a-button class="header-btn" type="primary" @click="handleOpenScheduleModal" style="margin-left: 8px;">
            坐诊管理
          </a-button>
        </div>
      </div>
      <!-- 新增排班概览组件 -->
      <div class="schedule-overview" style="margin-bottom: 16px;">
        <a-tag
            v-for="item in overviewScheduleWithName"
            :key="item.id"
            class="custom-appointment-tag"
        >
          <img
              :src="item.professionalImage && item.professionalImage.startsWith('http') ? item.professionalImage : `https://aiforoptometry.com/media/${item.professionalImage}`"
              alt="avatar"
          />
          <span>{{ item.professionalName }} - {{ item.professionalRole }}</span>
          <template v-if="item.shift">
            <span>{{ item.shift }}</span>
          </template>
          <template v-else-if="item.start_time && item.end_time">
            <span>{{ formatTime(item.start_time) }} - {{ formatTime(item.end_time) }}</span>
          </template>
        </a-tag>
      </div>
      <!-- 表格展示预约记录 -->
      <a-table
          :columns="columns"
          :dataSource="filteredAppointments"
          rowKey="id"
          :pagination="pagination"
          :row-class-name="getRowClassName"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-tooltip title="编辑">
              <a-button type="link" @click="handleEditAppointment(record)" style="margin-right: 8px;">
                修改
              </a-button>
            </a-tooltip>
          </template>
          <template v-if="column.key === 'status_action'">
            <!-- 状态显示和操作 -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <!-- 状态标签 -->
              <a-tag 
                v-if="record.status === '待提醒' || (!record.status && !record.reminder_sent)"
                color="orange"
                style="cursor: pointer;"
                @click="handleInitiateInvite(record)"
              >
                待提醒
              </a-tag>
              <a-tag 
                v-else-if="record.status === '已提醒' || record.reminder_sent"
                color="green"
              >
                已提醒
              </a-tag>
              <a-tag 
                v-else-if="record.status === '已逾期未到'"
                color="volcano"
                style="cursor: pointer;"
                @click="handleReschedule(record)"
              >
                已逾期未到
              </a-tag>
              <a-tag 
                v-else-if="record.status === '已改期'"
                color="blue"
              >
                已改期
              </a-tag>
              <a-tag 
                v-else
                color="default"
              >
                {{ record.status || '未知' }}
              </a-tag>
            </div>
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
    </div>

    <!-- 新增/编辑预约弹窗 -->
    <a-modal
        v-model:open="isModalVisible"
        :title="modalTitle"
        @cancel="handleCancelModal"
        footer=" "
        :width="500"
    >
      <a-form layout="vertical">
        <!-- 编辑模式下显示只读信息 -->
        <template v-if="appointmentForm.id">
          <a-form-item label="患者编号">
            <a-input v-model:value="appointmentForm.patientId" disabled style="width: 100%;"/>
          </a-form-item>
          <a-form-item label="患者姓名">
            <a-input v-model:value="appointmentForm.patientName" disabled style="width: 100%;"/>
          </a-form-item>
          <a-form-item label="联系电话">
            <a-input v-model:value="appointmentForm.patientPhone" disabled style="width: 100%;"/>
          </a-form-item>
          <a-form-item label="当前状态">
            <a-input v-model:value="appointmentForm.status" disabled style="width: 100%;"/>
          </a-form-item>
          <a-form-item label="预约日期（可修改）">
            <a-date-picker 
              v-model:value="appointmentForm.date" 
              style="width: 100%;" 
              :locale="locale"
              placeholder="请选择新的预约日期"
            >
              <template #suffixIcon>
                <img-icon class="input-icon" title="日历" style="margin-right: 0"/>
              </template>
            </a-date-picker>
          </a-form-item>
          <a-form-item label="医生（可修改）">
            <a-select 
              v-model:value="appointmentForm.doctorId" 
              placeholder="请选择医生"
              style="width: 100%;"
              :options="doctorListOptions"
              :field-names="{ label: 'name', value: 'id' }"
            >
              <template #suffixIcon>
                <img-icon class="input-icon" title="展开" style="margin-right: 0"/>
              </template>
            </a-select>
          </a-form-item>
        </template>
        <!-- 新增模式下显示完整表单 -->
        <template v-else>
          <a-form-item label="患者姓名">
            <a-select 
              v-model:value="appointmentForm.patientId" 
              placeholder="请选择患者（支持姓名、编号、电话搜索）"
              style="width: 100%;"
              :loading="patientListLoading"
              :options="patientListOptions"
              :field-names="{ label: 'label', value: 'id' }"
              show-search
              :filter-option="false"
              @search="patientSearchText = $event"
              @change="handlePatientSelect"
            >
              <template #suffixIcon>
                <img-icon class="input-icon" title="展开" style="margin-right: 0"/>
              </template>
            </a-select>
          </a-form-item>
          <a-form-item label="联系电话">
            <a-input v-model:value="appointmentForm.phone" placeholder="自动关联" disabled style="width: 100%;"/>
          </a-form-item>
          <a-form-item label="预约日期">
            <a-date-picker v-model:value="appointmentForm.date" style="width: 100%;" :locale="locale">
              <template #suffixIcon>
                <img-icon class="input-icon" title="日历" style="margin-right: 0"/>
              </template>
            </a-date-picker>
          </a-form-item>
          <a-form-item label="预约医生">
            <a-select 
              v-model:value="appointmentForm.doctorId" 
              placeholder="请选择医生"
              style="width: 100%;"
              :options="doctorListOptions"
              :field-names="{ label: 'name', value: 'id' }"
            >
              <template #suffixIcon>
                <img-icon class="input-icon" title="展开" style="margin-right: 0"/>
              </template>
            </a-select>
          </a-form-item>
          <a-form-item label="操作员">
            <a-select 
              v-model:value="appointmentForm.operator" 
              placeholder="选择操作员"
              style="width: 100%;"
              :loading="employeeListLoading"
              :options="employeeList"
              :field-names="{ label: 'label', value: 'value' }"
            >
              <template #suffixIcon>
                <img-icon class="input-icon" title="展开" style="margin-right: 0"/>
              </template>
            </a-select>
          </a-form-item>
        </template>
        <a-form-item style="text-align: right; margin-top: 16px;">
          <a-button @click="handleCancelModal" style="margin-right: 8px;">取消</a-button>
          <a-button type="primary" @click="submitAppointment">提交</a-button>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 修改后的坐诊管理弹窗部分 -->
    <a-modal
        v-model:open="isScheduleModalVisible"
        @cancel="handleCancelScheduleModal"
        footer=" "
        :width="800"
    >
      <template #title>
        <div
            style="display: flex; align-items: center;justify-content:space-between;padding-bottom:16px;margin-bottom:16px;border-bottom: 1px solid rgba(0,0,0,0.1) ">
          <div style="display: flex; align-items: center ">
            <img-icon class="header-icon" title="坐诊"/>
            坐诊管理
            <a-tabs class="modal-tabs" v-model:activeKey="activeScheduleTab">
              <!-- 专业人员管理 -->
              <a-tab-pane key="professionals" tab="专业人员管理">
              </a-tab-pane>

              <!-- 排班管理 -->
              <a-tab-pane key="schedule" tab="排班管理">
              </a-tab-pane>

              <!-- 修改后的排班表 -->
              <a-tab-pane key="timetable" tab="排班表">
              </a-tab-pane>
            </a-tabs>
          </div>
          <a-button class="modal-btn modal-btn-title" type="primary" @click="handleAddProfessional">
            新增专业人员
          </a-button>
        </div>
      </template>
      <a-table
          v-show="activeScheduleTab === 'professionals'"
          :dataSource="professionals"
          :columns="professionalColumns"
          rowKey="id"
          :pagination="professionalPagination"
          :rowClassName="setProfessionalRowClass">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-tooltip title="编辑">
              <a-button type="link" @click="handleEditProfessional(record)" style="margin-right: 8px;">
                <edit-outlined/>
              </a-button>
            </a-tooltip>
            <a-tooltip :title="record.status === 'active' ? '停用' : '启用'">
              <a-button type="link" @click="handleToggleProfessionalStatus(record)">
                {{ record.status === 'active' ? '停用' : '启用' }}
              </a-button>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'status'">
            {{ record.status === 'active' ? '启用' : '停用' }}
          </template>
          <template v-else>
            {{ record[column.dataIndex] }}
          </template>
        </template>
      </a-table>
      <div v-show="activeScheduleTab === 'schedule'" style="display: flex;justify-content: center">
        <a-form style="margin-top: 16px">
          <a-form-item>
            <template #label>
              <span style="width: 100px;text-align-last: justify">选择专业人员</span>
            </template>
            <a-select class="modal-input" v-model:value="scheduleForm.professionalId" placeholder="请选择专业人员"
                      style="width: 150px">
              <template #suffixIcon>
                <img-icon class="input-icon" title="展开" style="margin-right: 0"/>
              </template>
              <a-select-option
                  v-for="prof in professionals"
                  :key="prof.id"
                  :value="prof.id">
                {{ prof.name }} - {{ prof.role }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <template #label>
              <span style="width: 100px;text-align-last: justify">排班日期</span>
            </template>
            <a-date-picker class="modal-input" v-model:value="scheduleForm.scheduleDate" style="width: 150px"
                           :locale="locale">
              <template #suffixIcon>
                <img-icon class="input-icon" title="日历" style="margin-right: 0"/>
              </template>
            </a-date-picker>
          </a-form-item>
          <a-form-item>
            <template #label>
              <span style="width: 100px;text-align-last: justify">排班方式</span>
            </template>
            <a-radio-group v-model:value="scheduleForm.shiftType">
              <a-radio value="shift">班次</a-radio>
              <a-radio value="timeRange">时间段</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item v-if="scheduleForm.shiftType === 'shift'">
            <template #label>
              <span style="width: 100px;text-align-last: justify">选择班次</span>
            </template>
            <a-select class="modal-input" v-model:value="scheduleForm.shift" placeholder="请选择班次"
                      style="width: 150px">
              <template #suffixIcon>
                <img-icon class="input-icon" title="展开" style="margin-right: 0"/>
              </template>
              <a-select-option value="AM">上午</a-select-option>
              <a-select-option value="PM">下午</a-select-option>
              <a-select-option value="FULL">全天</a-select-option>
            </a-select>
          </a-form-item>
          <template v-if="scheduleForm.shiftType === 'timeRange'">
            <a-form-item>
              <template #label>
                <span style="width: 100px;text-align-last: justify">开始时间</span>
              </template>
              <a-time-picker class="modal-input" v-model:value="scheduleForm.startTime" style="width: 150px"
                             format="HH:mm">
                <template #suffixIcon>
                  <img-icon class="input-icon" title="日历" style="margin-right: 0"/>
                </template>
              </a-time-picker>
            </a-form-item>
            <a-form-item>
              <template #label>
                <span style="width: 100px;text-align-last: justify">结束时间</span>
              </template>
              <a-time-picker class="modal-input" v-model:value="scheduleForm.endTime" style="width: 150px"
                             format="HH:mm">
                <template #suffixIcon>
                  <img-icon class="input-icon" title="日历" style="margin-right: 0"/>
                </template>
              </a-time-picker>
            </a-form-item>
          </template>
          <div style="display: flex;justify-content: center">
            <a-button class="modal-btn" type="primary" @click="submitSchedule">提交排班</a-button>
          </div>
        </a-form>

      </div>
      <div v-show="activeScheduleTab === 'timetable'" class="weekly-schedules" style="margin-top: 20px;">
        <div style="display: flex;align-items: center;margin-bottom: 16px">
          <p style="margin-right: 16px">本周排班情况</p>
          <a-tabs style="margin: 0" v-model:activeKey="activeWeekDay" @change="handleWeekDayChange">
            <a-tab-pane v-for="day in weekDays" :key="day.value" :tab="day.label"/>
          </a-tabs>
        </div>
        <a-table
            :dataSource="filteredCurrentWeekSchedules"
            :columns="weeklyScheduleColumns"
            rowKey="id"
            :pagination="false"
            :scroll="{ y: 300 }"
            size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-button type="link" @click="handleEditSchedule(record)">编辑</a-button>
              <a-button type="link" danger @click="handleDeleteSchedule(record.id)">删除</a-button>
            </template>
          </template>
        </a-table>

        <div style="display: flex;align-items: center;margin-bottom: 16px">
          <h3 style="margin-right: 16px">下周排班情况</h3>
          <a-tabs style="margin: 0" v-model:activeKey="activeNextWeekDay" @change="handleNextWeekDayChange">
            <a-tab-pane v-for="day in nextWeekDays" :key="day.value" :tab="day.label"/>
          </a-tabs>
        </div>
        <a-table
            :dataSource="filteredNextWeekSchedules"
            :columns="weeklyScheduleColumns"
            rowKey="id"
            :pagination="false"
            :scroll="{ y: 300 }"
            size="small"
        />
      </div>
    </a-modal>

    <!-- 专业人员增删改查弹窗 -->
    <a-modal
        v-model:open="isProfessionalModalVisible"
        @cancel="handleCancelProfessionalModal"
        footer=" "
        :width="900"
    >
      <template #title>
        <div
            style="display: flex; align-items: center;padding-bottom:16px;margin-bottom:16px;border-bottom: 1px solid rgba(0,0,0,0.1) ">
          <img-icon class="header-icon" title="编辑"/>
          {{ professionalModalTitle }}
        </div>
      </template>
      <div style="display: flex;justify-content: center">
        <a-form style="width: 600px;">
          <div style="display: flex; justify-content: space-between">
            <a-form-item style="">
              <template #label>
                <span style="width: 80px;text-align-last: justify">姓名</span>
              </template>
              <a-input style="width: 150px" class="modal-input" v-model:value="professionalForm.name"
                       placeholder="请输入姓名"/>
            </a-form-item>
            <a-form-item>
              <template #label>
                <span style="width: 80px;text-align-last: justify">角色</span>
              </template>
              <a-select style="width: 150px" class="modal-input" v-model:value="professionalForm.role"
                        placeholder="请选择角色">
                <a-select-option value="医师">医师</a-select-option>
                <a-select-option value="视光师">视光师</a-select-option>
                <a-select-option value="护士">护士</a-select-option>
              </a-select>
            </a-form-item>
          </div>
          <a-form-item>
            <template #label>
              <span style="width: 80px;text-align-last: justify">职称</span>
            </template>
            <a-input style="width: 150px" class="modal-input" v-model:value="professionalForm.title"
                     placeholder="请输入职称"/>
          </a-form-item>
          <a-form-item>
            <template #label>
              <span style="width: 80px;text-align-last: justify">头像</span>
            </template>
            <a-upload
                list-type="picture-card"
                :fileList="fileList"
                @change="handleUploadChange"
                @remove="handleRemove"
                :maxCount="1"
                :beforeUpload="handleBeforeUpload"
                accept=".jpg,.jpeg,.png">
              <div>
                <plus-outlined/>
                <div style="margin-top: 8px;">上传头像</div>
              </div>
            </a-upload>
          </a-form-item>
          <a-form-item>
            <template #label>
              <span style="width: 80px;text-align-last: justify">简介</span>
            </template>
            <a-textarea class="modal-input" v-model:value="professionalForm.bio" placeholder="请输入简介" rows="3"/>
          </a-form-item>
          <a-form-item>
            <template #label>
              <span style="width: 80px;text-align-last: justify">擅长领域</span>
            </template>
            <a-textarea class="modal-input" v-model:value="professionalForm.expertise" placeholder="请输入擅长领域"
                        rows="3"/>
          </a-form-item>
          <div style="display: flex;justify-content: center">
            <a-button class="modal-btn" type="primary" @click="submitProfessional">提交</a-button>
          </div>
        </a-form>
      </div>
    </a-modal>

    <!-- Edit Schedule Modal -->
    <a-modal
        v-model:open="isEditScheduleModalVisible"
        title="编辑排班"
        @cancel="handleCancelEditScheduleModal"
        footer=" "
        :width="700"
    >
      <a-form layout="vertical">
        <a-form-item label="选择专业人员">
          <a-select
              v-model:value="scheduleForm.professionalId"
              placeholder="请选择专业人员"
              style="width: 150px"
          >
            <a-select-option
                v-for="prof in professionals"
                :key="prof.id"
                :value="prof.id"
            >
              {{ prof.name }} - {{ prof.role }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="排班日期">
          <a-date-picker
              v-model:value="scheduleForm.scheduleDate"
              style="width: 150px"
              :locale="locale"
          />
        </a-form-item>
        <a-form-item label="排班方式">
          <a-radio-group v-model:value="scheduleForm.shiftType">
            <a-radio value="shift">班次</a-radio>
            <a-radio value="timeRange">时间段</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-if="scheduleForm.shiftType === 'shift'" label="选择班次">
          <a-select
              v-model:value="scheduleForm.shift"
              placeholder="请选择班次"
              style="width: 150px"
          >
            <a-select-option value="AM">上午</a-select-option>
            <a-select-option value="PM">下午</a-select-option>
            <a-select-option value="FULL">全天</a-select-option>
          </a-select>
        </a-form-item>
        <template v-if="scheduleForm.shiftType === 'timeRange'">
          <a-form-item label="开始时间">
            <a-time-picker
                v-model:value="scheduleForm.startTime"
                style="width: 150px"
                format="HH:mm"
            />
          </a-form-item>
          <a-form-item label="结束时间">
            <a-time-picker
                v-model:value="scheduleForm.endTime"
                style="width: 150px"
                format="HH:mm"
            />
          </a-form-item>
        </template>
        <a-form-item style="text-align: right;">
          <a-button type="primary" @click="submitEditSchedule">提交</a-button>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 发起邀约模态框 -->
    <a-modal
        v-model:open="isInviteModalVisible"
        @cancel="closeInviteModal"
        :width="600"
        :footer="null"
    >
      <template #title>
        <div
            style="display: flex; align-items: center;padding-bottom:16px;margin-bottom:16px;border-bottom: 1px solid rgba(0,0,0,0.1) ">
          <img-icon class="header-icon" title="确认提示"/>
          发起邀约
        </div>
      </template>
      <div style="display: flex ; justify-content: center">
        <a-form>
          <div style="display: flex; flex-direction: column; gap: 16px; width: 100%;">
            <div style="display: flex; gap: 16px; justify-content: center;">
              <a-form-item :colon="false" label="操作员">
                <a-select 
                  class="modal-input" 
                  v-model:value="inviteForm.operator" 
                  placeholder="选择操作员"
                  style="width: 200px;"
                  :loading="employeeListLoading"
                  :options="employeeList"
                  :field-names="{ label: 'label', value: 'value' }"
                >
                  <template #suffixIcon>
                    <img-icon class="input-icon" title="展开" style="margin-right: 0"/>
                  </template>
                </a-select>
              </a-form-item>
              <a-form-item :colon="false" label="提醒方式">
                <a-input class="modal-input" v-model:value="inviteForm.remind_type" placeholder="如：电话、短信、微信等"
                         style="width: 200px;">
                  <template #suffix>
                    <img-icon class="input-icon" title="提醒方式" style="margin-right: 0"/>
                  </template>
                </a-input>
              </a-form-item>
            </div>
            <div style="display: flex; justify-content: center; width: 100%;">
              <a-form-item :colon="false" label="备注" style="width: 100%;">
                <a-textarea 
                  class="modal-textarea" 
                  v-model:value="inviteForm.remarks" 
                  placeholder="请输入备注信息..."
                  :rows="3"
                  style="width: 100%; max-width: 500px;"
                />
              </a-form-item>
            </div>
            <div style="display: flex;justify-content: center; margin-top: 16px;">
              <a-button class="modal-btn modal-btn-plain" type="primary" @click="closeInviteModal">取消</a-button>
              <a-button class="modal-btn" type="primary" @click="submitInvite">确定</a-button>
            </div>
          </div>
        </a-form>
      </div>
    </a-modal>

    <!-- 改期提醒模态框 -->
    <a-modal
        v-model:open="isRescheduleModalVisible"
        @cancel="closeRescheduleModal"
        :width="600"
        :footer="null"
    >
      <template #title>
        <div
            style="display: flex; align-items: center;padding-bottom:16px;margin-bottom:16px;border-bottom: 1px solid rgba(0,0,0,0.1) ">
          <img-icon class="header-icon" title="确认提示"/>
          逾期患者改期提醒
        </div>
      </template>
      <div style="display: flex ; justify-content: center">
        <a-form>
          <div style="display: flex; flex-direction: column; gap: 16px; width: 100%;">
            <div style="display: flex; gap: 16px; justify-content: center;">
              <a-form-item :colon="false" label="操作员">
                <a-select 
                  class="modal-input" 
                  v-model:value="rescheduleForm.operator" 
                  placeholder="选择操作员"
                  style="width: 200px;"
                  :loading="employeeListLoading"
                  :options="employeeList"
                  :field-names="{ label: 'label', value: 'value' }"
                >
                  <template #suffixIcon>
                    <img-icon class="input-icon" title="展开" style="margin-right: 0"/>
                  </template>
                </a-select>
              </a-form-item>
              <a-form-item :colon="false" label="提醒方式">
                <a-input class="modal-input" v-model:value="rescheduleForm.remind_type" placeholder="如：电话、短信、微信等"
                         style="width: 200px;">
                  <template #suffix>
                    <img-icon class="input-icon" title="提醒方式" style="margin-right: 0"/>
                  </template>
                </a-input>
              </a-form-item>
            </div>
            <div style="display: flex; gap: 16px; justify-content: center;">
              <a-form-item :colon="false" label="改期日期">
                <a-date-picker 
                  class="modal-input" 
                  v-model:value="rescheduleForm.reschedule_date" 
                  placeholder="选择新的复查日期"
                  :locale="locale"
                  style="width: 200px;"
                >
                  <template #suffixIcon>
                    <img-icon class="input-icon" title="日历" style="margin-right: 0"/>
                  </template>
                </a-date-picker>
              </a-form-item>
            </div>
            <div style="display: flex; justify-content: center; width: 100%;">
              <a-form-item :colon="false" label="备注" style="width: 100%;">
                <a-textarea 
                  class="modal-textarea" 
                  v-model:value="rescheduleForm.remarks" 
                  placeholder="请输入备注信息..."
                  :rows="3"
                  style="width: 100%; max-width: 500px;"
                />
              </a-form-item>
            </div>
            <div style="display: flex;justify-content: center; margin-top: 16px;">
              <a-button class="modal-btn modal-btn-plain" type="primary" @click="closeRescheduleModal">取消</a-button>
              <a-button class="modal-btn" type="primary" @click="submitReschedule">确定</a-button>
            </div>
          </div>
        </a-form>
      </div>
    </a-modal>
  </a-spin>
</template>

<script>
import {ref, computed, onMounted, watch, h} from 'vue';
import {
  Spin,
  Card,
  Table,
  Input,
  Button,
  DatePicker,
  TimePicker,
  Form,
  Modal,
  Select,
  Tooltip,
  Tabs,
  List,
  Tag
} from 'ant-design-vue';
import {EditOutlined, DeleteOutlined, PlusOutlined} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN';
import defaultAvatar from '../assets/icons/touxiang.png';
import axios from 'axios';
import ImgIcon from "@/pages/components/ImgIcon.vue";
import { pinyin } from 'pinyin-pro';

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');

export default {
  name: 'PatientAppointment',
  components: {
    'img-icon': ImgIcon,
    'a-spin': Spin,
    'a-card': Card,
    'a-table': Table,
    'a-input-search': Input.Search,
    'a-input': Input,
    'a-textarea': Input.TextArea,
    'a-button': Button,
    'a-modal': Modal,
    'a-date-picker': DatePicker,
    'a-time-picker': TimePicker,
    'a-form': Form,
    'a-form-item': Form.Item,
    'a-select': Select,
    'a-select-option': Select.Option,
    'a-tooltip': Tooltip,
    'a-tabs': Tabs,
    'a-tab-pane': Tabs.TabPane,
    'edit-outlined': EditOutlined,
    'delete-outlined': DeleteOutlined,
    'plus-outlined': PlusOutlined,
    'a-list': List,
    'a-tag': Tag
  },
  setup() {
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    // 预约管理相关
    const isLoading = ref(false);
    const searchText = ref('');
    const selectedDate = ref(null); // 默认不选中日期，显示全部
    const selectedDoctors = ref([]); // 选中的医生ID列表（支持多选）
    const isModalVisible = ref(false);
    const modalTitle = ref('新增预约');
    const appointmentForm = ref({
      id: null,
      patientId: null, // 患者ID
      patientName: '',
      phone: '',
      date: null,
      operator: '',
      doctorId: null // 预约医生ID
    });

    // 员工列表相关数据
    const employeeList = ref([]);
    const employeeListLoading = ref(false);
    
    // 医生列表相关数据
    const doctorList = ref([]);
    const doctorNameMap = computed(() => {
      const map = {};
      doctorList.value.forEach(doctor => {
        map[doctor.id] = doctor.name;
      });
      return map;
    });
    // 医生列表选项（用于下拉框）
    const doctorListOptions = computed(() => {
      return doctorList.value.map(doctor => ({
        id: doctor.id,
        name: doctor.name
      }));
    });
    
    // 患者列表相关数据
    const patientList = ref([]);
    const patientListLoading = ref(false);
    const patientSearchText = ref('');
    
    // 从缓存加载患者列表
    const loadPatientListFromCache = () => {
      try {
        const cachedPatients = localStorage.getItem('patientlist');
        if (cachedPatients) {
          const patients = JSON.parse(cachedPatients);
          const currentOrgId = localStorage.getItem('organization_id');
          
          // 过滤出当前机构的患者
          const filteredPatients = patients.filter(patient => {
            const patientOrgId = patient.organizationid || patient.organization_id;
            return patientOrgId == currentOrgId && patient.status === 'active';
          });
          
          patientList.value = filteredPatients;
          console.log('从缓存加载患者列表，共', filteredPatients.length, '条');
          return filteredPatients;
        }
      } catch (error) {
        console.error('从缓存加载患者列表失败:', error);
      }
      return [];
    };
    
    // 检查姓名是否匹配（支持中文和拼音首字母）
    const matchPatientName = (name, searchText) => {
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
        
        // 检查拼音首字母是否包含搜索文本
        if (pinyinInitials.indexOf(search) !== -1) {
          return true;
        }
      } catch (error) {
        console.warn('拼音转换失败:', error);
        // 如果拼音转换失败，仅使用中文匹配
      }
      
      return false;
    };
    
    // 患者列表选项（用于下拉框，支持搜索）
    const patientListOptions = computed(() => {
      // 提取gkid数字并格式化显示
      const formatPatientOptions = (patients) => {
        return patients.map(patient => {
          let gkidNumber = extractGkidNumber(patient.gkid);
          // 如果返回的是'-'或原始值，尝试提取数字
          if (gkidNumber === '-' || (gkidNumber && !/^\d+$/.test(gkidNumber))) {
            const numbers = patient.gkid ? patient.gkid.match(/\d+/g) : null;
            gkidNumber = numbers && numbers.length > 0 ? numbers[numbers.length - 1] : '';
          }
          return {
            id: patient.id,
            label: `${patient.name} (${gkidNumber})`,
            name: patient.name,
            gkid: patient.gkid,
            gkidNumber: gkidNumber,
            phone: patient.phone
          };
        });
      };
      
      if (!patientSearchText.value) {
        return formatPatientOptions(patientList.value);
      }
      
      const search = patientSearchText.value.trim();
      
      // 判断是否为纯数字查询
      const isNumericSearch = /^\d+$/.test(search);
      
      return formatPatientOptions(
        patientList.value.filter(patient => {
          if (isNumericSearch) {
            // 数字查询：完全匹配gkid中的数字部分
            let gkidNumber = extractGkidNumber(patient.gkid);
            // 如果返回的是'-'或原始值，尝试提取数字
            if (gkidNumber === '-' || (gkidNumber && !/^\d+$/.test(gkidNumber))) {
              const numbers = patient.gkid ? patient.gkid.match(/\d+/g) : null;
              gkidNumber = numbers && numbers.length > 0 ? numbers[numbers.length - 1] : '';
            }
            return gkidNumber === search;
          } else {
            // 非数字查询：支持姓名匹配（中文和拼音首字母）
            const nameMatch = matchPatientName(patient.name, search);
            return nameMatch;
          }
        })
      );
    });

    // 获取机构员工列表
    const fetchEmployeeList = async () => {
      try {
        employeeListLoading.value = true;
        
        // 优先使用缓存的成员列表
        const cachedMembers = getMemberListFromCache();
        if (cachedMembers && cachedMembers.length > 0) {
          // 过滤出员工账号（中文用户名）
          employeeList.value = cachedMembers.filter(member => 
            member.account && /^[\u4e00-\u9fa5]+$/.test(member.account)
          ).map(member => ({
            value: member.account,
            label: member.account,
            id: member.id
          }));
          
          console.log('使用缓存的员工列表:', employeeList.value);
          return;
        }
        
        // 如果缓存不存在或为空，从API获取
        console.log('缓存不存在或为空，从API获取员工列表');
        const orgId = localStorage.getItem('organization_id');
        const csrftoken = localStorage.getItem('csrftoken');
        
        if (!orgId) {
          console.error('未找到机构ID');
          return;
        }
        
        const response = await fetch(`https://aiforoptometry.com/subaccount/list/?organization_id=${orgId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          }
        });
        
        if (response.ok) {
          const responseData = await response.json();
          // Main.vue中的接口返回格式是 {code: 200, data: [...]}
          const data = responseData.code === 200 ? responseData.data : responseData;
          // 过滤出员工账号（中文用户名）
          employeeList.value = data.filter(member => 
            member.account && /^[\u4e00-\u9fa5]+$/.test(member.account)
          ).map(member => ({
            value: member.account,
            label: member.account,
            id: member.id
          }));
          
          console.log('从API获取员工列表成功:', employeeList.value);
        } else {
          console.error('获取员工列表失败:', response.status);
        }
      } catch (error) {
        console.error('获取员工列表出错:', error);
      } finally {
        employeeListLoading.value = false;
      }
    };

    // 获取当前登录员工账号
    const getCurrentEmployeeAccount = () => {
      const username = localStorage.getItem('current_username');
      // 如果是员工账号（中文用户名），返回用户名
      if (username && /^[\u4e00-\u9fa5]+$/.test(username)) {
        return username;
      }
      return null;
    };

    // 获取缓存的成员列表（复用Main.vue的逻辑）
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
    
    // 获取医生列表
    const fetchDoctorList = async () => {
      try {
        const orgId = localStorage.getItem('organization_id');
        const csrftoken = localStorage.getItem('csrftoken');
        
        if (!orgId) {
          console.error('未找到机构ID');
          return;
        }
        
        const response = await fetch(`https://aiforoptometry.com/doctor/list/?organization_id=${orgId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          }
        });
        
        if (response.ok) {
          const responseData = await response.json();
          // 处理API响应格式
          const data = responseData.code === 200 ? responseData.data.results : responseData.data || responseData;
          doctorList.value = data.map(doctor => ({
            id: doctor.id,
            name: doctor.name
          }));
          
          console.log('获取医生列表成功:', doctorList.value);
        } else {
          console.error('获取医生列表失败:', response.status);
        }
      } catch (error) {
        console.error('获取医生列表出错:', error);
      }
    };
    
    // 从patient_gkid中提取数字部分
    const extractGkidNumber = (gkid) => {
      if (!gkid) return '-';
      // 提取所有数字
      const numbers = gkid.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        // 返回最后一个数字序列（通常是编号）
        return numbers[numbers.length - 1];
      }
      return gkid; // 如果没有数字，返回原始值
    };

    // 预约数据（从 /api/invites 获取）
    const appointments = ref([]);
    const columns = [
      {title: '患者编号', dataIndex: 'patientId', key: 'patientId'},
      {title: '患者姓名', dataIndex: 'patientName', key: 'patientName'},
      {title: '患者电话', dataIndex: 'patientPhone', key: 'patientPhone'},
      {title: '预约日期', dataIndex: 'date', key: 'date'},
      {title: '医生', dataIndex: 'doctor', key: 'doctor'},
      {title: '状态/操作', key: 'status_action'},
      {title: '操作', key: 'action'}
    ];
    const pagination = {
      pageSize: 10,
      showTotal: total => `共 ${total} 条`
    };
    const filteredAppointments = computed(() => {
      let filtered = appointments.value.filter(app => {
        const matchesSearch =
            !searchText.value ||
            (app.patientName && app.patientName.includes(searchText.value)) ||
            (String(app.patientId) && String(app.patientId).includes(searchText.value));
        const matchesDate = !selectedDate.value ||
            dayjs(app.date).isSame(dayjs(selectedDate.value), 'day');
        const matchesDoctor = !selectedDoctors.value || selectedDoctors.value.length === 0 ||
            (app.doctorId && selectedDoctors.value.includes(app.doctorId));
        return matchesSearch && matchesDate && matchesDoctor;
      });
      
      // 按预约日期倒序排序（最新的在前）
      filtered.sort((a, b) => {
        const dateA = dayjs(a.date);
        const dateB = dayjs(b.date);
        if (dateA.isBefore(dateB)) return 1;
        if (dateA.isAfter(dateB)) return -1;
        return 0;
      });
      
      return filtered;
    });
    const handleSearch = value => {
      searchText.value = value;
    };
    const handleDateChange = date => {
      selectedDate.value = date;
    };

    // 手动刷新邀约列表
    const handleRefreshInvites = async () => {
      await fetchInvites();
    };

    // 获取预约列表（邀约）
    const fetchInvites = async () => {
      try {
        isLoading.value = true;
        const csrftoken = localStorage.getItem('csrftoken');
        const organizationId = localStorage.getItem('organization_id');
        
        if (!organizationId) {
          console.error('未找到机构ID');
          Modal.error({content: '未找到机构ID，请重新登录'});
          return;
        }
        
        // 按后端约定：需要传递 organization_id 参数
        const url = `https://aiforoptometry.com/api/invites?organization_id=${organizationId}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          }
        });
        const data = await res.json();
        const list = Array.isArray(data.results) ? data.results : [];
        
        // 映射为页面需要的字段结构（依据新的后端返回格式）
        appointments.value = list.map(item => {
          // 从patient_gkid中提取数字部分作为患者编号（显示用）
          const patientGkidNumber = extractGkidNumber(item.patient_gkid);
          
          return {
            id: item.id,
            patientId: patientGkidNumber, // 患者编号（从gkid提取的数字部分，用于显示）
            patient_id: item.patient_id, // 保留原始patient_id，用于操作
            patientName: item.patient_name || '',
            patientPhone: item.patient_phone || '-',
            date: item.review_date || '', // 字段名从 proposed_date 改为 review_date
            status: item.status || '', // 字段名从 status_label 改为 status
            doctor: item.doctor_name || '-', // 后端直接返回医生名字，无需映射
            doctorId: item.doctor_id, // 保留原始医生ID，用于操作
            examRecordId: item.examinationrecords_id ?? null, // 字段名从 exam_record_id 改为 examinationrecords_id
            remind_type: item.remind_type || '', // 提醒方式
            remarks: item.remarks || '', // 备注
            reminder_person: item.reminder_person || '', // 提醒人员
            reminder_date: item.reminder_date || '', // 提醒时间
            reminder_sent: item.reminder_sent || false // 是否已提醒
          };
        });
      } catch (e) {
        console.error('获取邀约列表失败:', e);
        appointments.value = [];
      } finally {
        isLoading.value = false;
      }
    };
    // 处理患者选择
    const handlePatientSelect = (patientId) => {
      const selectedPatient = patientList.value.find(p => p.id === patientId);
      if (selectedPatient) {
        appointmentForm.value.patientName = selectedPatient.name;
        appointmentForm.value.phone = selectedPatient.phone || '';
        appointmentForm.value.patientId = patientId;
      }
    };
    
    const handleAddAppointment = async () => {
      modalTitle.value = '新增预约';
      appointmentForm.value = {
        id: null,
        patientId: null,
        patientName: '',
        phone: '',
        date: null,
        operator: getCurrentEmployeeAccount() || '',
        doctorId: null
      };
      patientSearchText.value = ''; // 清空搜索文本
      isModalVisible.value = true;
      
      // 打开modal时加载患者列表和员工列表
      loadPatientListFromCache();
      await Promise.all([fetchEmployeeList(), fetchDoctorList()]);
    };
    const handleEditAppointment = async (record) => {
      modalTitle.value = '编辑预约';
      // 保存完整的记录数据，包括原始值用于比较
      appointmentForm.value = {
        ...record,
        doctorId: record.doctorId ?? null,
        originalDate: record.date, // 保存原始日期用于比较
        originalDoctorId: record.doctorId ?? null // 保存原始医生ID用于比较
      };
      // 设置默认操作员
      if (!appointmentForm.value.operator) {
        appointmentForm.value.operator = getCurrentEmployeeAccount() || '';
      }
      if (record.date) {
        appointmentForm.value.date = dayjs(record.date);
      }
      if (record.time) {
        appointmentForm.value.time = dayjs(record.time, 'HH:mm');
      }
      isModalVisible.value = true;
      
      // 打开modal时才获取员工列表和医生列表
      await Promise.all([fetchEmployeeList(), fetchDoctorList()]);
    };
    // 发起邀约相关
    const isInviteModalVisible = ref(false);
    const inviteModalRecord = ref({});
    const inviteForm = ref({
      operator: '',
      remind_type: '',
      remarks: ''
    });

    // 改期相关
    const isRescheduleModalVisible = ref(false);
    const rescheduleModalRecord = ref({});
    const rescheduleForm = ref({
      operator: '',
      remind_type: '',
      remarks: '',
      reschedule_date: null
    });

    // 发起邀约（打开模态框）
    const handleInitiateInvite = async (record) => {
      isInviteModalVisible.value = true;
      inviteModalRecord.value = record;
      // 预置表单数据
      inviteForm.value.operator = getCurrentEmployeeAccount() || '';
      inviteForm.value.remind_type = record.remind_type || '';
      inviteForm.value.remarks = record.remarks || '';
      
      // 打开modal时才获取员工列表
      await fetchEmployeeList();
    };

    // 关闭邀约模态框
    const closeInviteModal = () => {
      isInviteModalVisible.value = false;
      inviteModalRecord.value = {};
      inviteForm.value = {
        operator: '',
        remind_type: '',
        remarks: ''
      };
    };

    // 提交邀约（调用提醒接口，因为复查表和邀约表在后端数据库的同一个表中）
    const submitInvite = async () => {
      try {
        if (!inviteForm.value.operator) {
          Modal.warning({content: '操作员不能为空'});
          return;
        }

        const csrftoken = localStorage.getItem('csrftoken');
        const remindRequestData = {
          id: inviteModalRecord.value.id,
          operator: inviteForm.value.operator,
          reminder_person: inviteForm.value.operator,
          reminder_date: dayjs().format('YYYY-MM-DD'),
          remind_type: inviteForm.value.remind_type,
          remarks: inviteForm.value.remarks
        };
        console.log('发送邀约提醒更新请求数据:', remindRequestData);
        const response = await fetch('https://aiforoptometry.com/reminders/update_reminder_info/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify(remindRequestData)
        });

        const data = await response.json();
        console.log('接收到的邀约提醒更新响应:', data);
        if (data.success) {
          Modal.success({content: '邀约提醒成功'});
          const index = appointments.value.findIndex(p => p.id === inviteModalRecord.value.id);
          console.log('找到的预约记录索引:', index);
          
          if (index !== -1) {
            // 更新 appointments 数组中的数据
            appointments.value[index].reminder_sent = true;
            appointments.value[index].reminder_person = inviteForm.value.operator;
            appointments.value[index].reminder_date = dayjs().format('YYYY-MM-DD');
            appointments.value[index].remind_type = inviteForm.value.remind_type;
            appointments.value[index].remarks = inviteForm.value.remarks;
            appointments.value[index].status = '已提醒';
            
            // 强制触发响应式更新
            appointments.value = [...appointments.value];
            
            console.log('更新后的预约数据:', appointments.value[index]);
          }
          
          // 延迟关闭modal，确保UI更新完成
          setTimeout(() => {
            closeInviteModal();
            // 刷新邀约列表
            fetchInvites();
          }, 100);
        } else {
          Modal.error({content: '邀约提醒失败'});
        }
      } catch (error) {
        console.error('邀约提醒失败:', error);
        Modal.error({content: '邀约提醒失败'});
      }
    };

    // 处理改期（逾期未到患者）
    const handleReschedule = async (record) => {
      isRescheduleModalVisible.value = true;
      rescheduleModalRecord.value = record;
      // 预置表单数据
      rescheduleForm.value.operator = getCurrentEmployeeAccount() || '';
      rescheduleForm.value.remind_type = record.remind_type || '';
      rescheduleForm.value.remarks = record.remarks || '';
      rescheduleForm.value.reschedule_date = record.date ? dayjs(record.date) : null; // 默认设置为当前复查日期
      
      // 打开modal时才获取员工列表
      await fetchEmployeeList();
    };

    // 关闭改期模态框
    const closeRescheduleModal = () => {
      isRescheduleModalVisible.value = false;
      rescheduleModalRecord.value = {};
      rescheduleForm.value = {
        operator: '',
        remind_type: '',
        remarks: '',
        reschedule_date: null
      };
    };

    // 提交改期
    const submitReschedule = async () => {
      try {
        if (!rescheduleForm.value.operator) {
          Modal.warning({content: '操作员不能为空'});
          return;
        }

        if (!rescheduleForm.value.reschedule_date) {
          Modal.warning({content: '请选择改期日期'});
          return;
        }

        const csrftoken = localStorage.getItem('csrftoken');
        const rescheduleRequestData = {
          id: rescheduleModalRecord.value.id,
          operator: rescheduleForm.value.operator,
          reminder_person: rescheduleForm.value.operator,
          reminder_date: dayjs().format('YYYY-MM-DD'),
          remind_type: rescheduleForm.value.remind_type,
          remarks: rescheduleForm.value.remarks,
          new_date: rescheduleForm.value.reschedule_date.format('YYYY-MM-DD')
        };
        console.log('发送改期请求数据:', rescheduleRequestData);
        const response = await fetch('https://aiforoptometry.com/reminders/update_reschedule_info/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify(rescheduleRequestData)
        });

        const data = await response.json();
        console.log('接收到的改期响应:', data);
        if (data.success) {
          Modal.success({content: '改期成功'});
          const index = appointments.value.findIndex(p => p.id === rescheduleModalRecord.value.id);
          console.log('找到的预约记录索引:', index);
          
          if (index !== -1) {
            // 更新 appointments 数组中的数据
            appointments.value[index].reminder_sent = true;
            appointments.value[index].reminder_person = rescheduleForm.value.operator;
            appointments.value[index].reminder_date = dayjs().format('YYYY-MM-DD');
            appointments.value[index].review_date = rescheduleForm.value.reschedule_date.format('YYYY-MM-DD');
            appointments.value[index].date = rescheduleForm.value.reschedule_date.format('YYYY-MM-DD');
            appointments.value[index].status = '已改期';
            appointments.value[index].isOverdue = false; // 改期后不再是逾期状态
            
            // 强制触发响应式更新
            appointments.value = [...appointments.value];
            
            console.log('更新后的预约数据:', appointments.value[index]);
          }
          
          // 延迟关闭modal，确保UI更新完成
          setTimeout(() => {
            closeRescheduleModal();
            // 刷新邀约列表
            fetchInvites();
          }, 100);
        } else {
          Modal.error({content: '改期失败'});
        }
      } catch (error) {
        console.error('改期失败:', error);
        Modal.error({content: '改期失败'});
      }
    };
    // 获取表格行的类名，用于区分逾期患者
    const getRowClassName = (record) => {
      if (record.isOverdue || record.status === '已逾期未到') {
        return 'overdue-row';
      }
      return '';
    };

         const handleCancelModal = () => {
       isModalVisible.value = false;
       patientSearchText.value = ''; // 清空患者搜索文本
     };
     
     const handlePageChange = (page) => {
       currentPage.value = page;
     };
    const submitAppointment = async () => {
      // 如果是编辑模式，验证并提交日期和/或医生
      if (appointmentForm.value.id) {
        try {
          isLoading.value = true;
          const csrftoken = localStorage.getItem('csrftoken');
          const inviteId = appointmentForm.value.id;
          
          // 构建更新请求体：只传递需要修改的字段
          const payload = {};
          
          // 检查日期是否有变化
          if (appointmentForm.value.date) {
            const formattedDate = dayjs(appointmentForm.value.date).format('YYYY-MM-DD');
            const originalDate = appointmentForm.value.originalDate 
              ? dayjs(appointmentForm.value.originalDate).format('YYYY-MM-DD') 
              : null;
            
            // 如果日期有变化，添加日期字段
            if (formattedDate !== originalDate) {
              payload.review_date = formattedDate;
            }
          }
          
          // 检查医生是否有变化
          const currentDoctorId = appointmentForm.value.doctorId !== null && appointmentForm.value.doctorId !== undefined 
            ? Number(appointmentForm.value.doctorId) 
            : null;
          const originalDoctorId = appointmentForm.value.originalDoctorId !== null && appointmentForm.value.originalDoctorId !== undefined
            ? Number(appointmentForm.value.originalDoctorId)
            : null;
          
          // 如果医生有变化，添加医生字段
          if (currentDoctorId !== originalDoctorId) {
            if (currentDoctorId === null) {
              Modal.error({content: '医生不能为空'});
              return;
            }
            payload.doctor_id = currentDoctorId;
          }
          
          // 如果没有任何要更新的字段，提示用户
          if (Object.keys(payload).length === 0) {
            Modal.warning({content: '请至少修改预约日期或医生'});
            isLoading.value = false;
            return;
          }
          
          const response = await fetch(`https://aiforoptometry.com/api/invites/${inviteId}/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(payload)
          });
          
          const data = await response.json();
          
          if (response.ok || response.status === 200 || data.success || data.code === 200) {
            Modal.success({content: '预约修改成功'});
            isModalVisible.value = false;
            // 刷新邀约列表
            await fetchInvites();
          } else {
            Modal.error({content: data.error || data.message || '预约修改失败'});
          }
        } catch (error) {
          console.error('修改预约失败:', error);
          Modal.error({content: '修改预约失败，请重试'});
        } finally {
          isLoading.value = false;
        }
      } else {
        // 新增模式：验证所有必填字段
        if (!appointmentForm.value.patientId || !appointmentForm.value.date) {
          Modal.error({content: '请选择患者和预约日期'});
          return;
        }
        
        try {
          isLoading.value = true;
          const csrftoken = localStorage.getItem('csrftoken');
          const organizationId = localStorage.getItem('organization_id');
          
          // 构建请求数据
          const payload = {
            patient_id: appointmentForm.value.patientId,
            review_date: dayjs(appointmentForm.value.date).format('YYYY-MM-DD'),
            organization_id: organizationId
          };
          
          // 如果有选择医生，添加医生ID
          if (appointmentForm.value.doctorId) {
            payload.doctor_id = appointmentForm.value.doctorId;
          }
          
          // 如果有操作员，添加操作员信息
          if (appointmentForm.value.operator) {
            payload.operator = appointmentForm.value.operator;
          }
          
          console.log('新增预约请求数据:', payload);
          
          const response = await fetch('https://aiforoptometry.com/api/invites/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(payload)
          });
          
          const data = await response.json();
          console.log('新增预约响应:', data);
          
          if (response.ok || response.status === 201 || data.success || data.id) {
            Modal.success({content: '预约创建成功'});
            isModalVisible.value = false;
            // 刷新邀约列表
            await fetchInvites();
          } else {
            Modal.error({content: data.error || data.message || '预约创建失败'});
          }
        } catch (error) {
          console.error('创建预约失败:', error);
          Modal.error({content: '创建预约失败，请重试'});
        } finally {
          isLoading.value = false;
        }
      }
    };

    // 坐诊管理相关（包含专业人员管理和排班管理）
    const isScheduleModalVisible = ref(false);
    const activeScheduleTab = ref('professionals'); // professionals / schedule
    // 排班表单（改为选择专业人员）
    const scheduleForm = ref({
      professionalId: '',
      scheduleDate: null,
      shiftType: '', // 新增：班次类型（上午/下午/全天）
      shift: '', // 可选：班次
      startTime: null, // 可选：开始时间
      endTime: null // 可选：结束时间
    });
    const handleOpenScheduleModal = () => {
      isScheduleModalVisible.value = true;
      // 重置排班表单
      scheduleForm.value = {
        professionalId: '',
        scheduleDate: null,
        shiftType: '',
        shift: '',
        startTime: null,
        endTime: null
      };
      // 获取机构专业人员列表
      fetchProfessionals();
      // 获取本周和下周排班情况
      fetchWeeklySchedules();
    };
    const handleCancelScheduleModal = () => {
      isScheduleModalVisible.value = false;
    };
    const submitSchedule = async () => {
      try {
        // 创建一个新的对象，只包含需要提交的字段
        const payload = {
          professional: scheduleForm.value.professionalId,
          date: scheduleForm.value.scheduleDate ? scheduleForm.value.scheduleDate.format('YYYY-MM-DD') : null,
          shift: scheduleForm.value.shiftType === 'shift' ? scheduleForm.value.shift : null,
          start_time: scheduleForm.value.shiftType === 'timeRange' && scheduleForm.value.startTime ?
              scheduleForm.value.startTime.format('HH:mm') : null,
          end_time: scheduleForm.value.shiftType === 'timeRange' && scheduleForm.value.endTime ?
              scheduleForm.value.endTime.format('HH:mm') : null,
          organization: localStorage.getItem('organization_id') // 将 organization_id 添加到请求体中
        };

        // 检查必填字段
        if (!payload.professional || !payload.date) {
          Modal.error({content: '请选择专业人员和排班日期'});
          return;
        }

        // 从localStorage中获取token
        const csrftoken = localStorage.getItem('csrftoken');

        const response = await axios.post(
            `https://aiforoptometry.com/schedule/add/`, // 使用正确的新增排班接口
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
              }
            }
        );

        if (response.data.message) {
          Modal.success({content: '排班新增成功'});
          // 重置表单
          scheduleForm.value = {
            professionalId: '',
            scheduleDate: null,
            shiftType: '',
            shift: '',
            startTime: null,
            endTime: null
          };
          // 刷新排班数据
          fetchWeeklySchedules();
        }
      } catch (error) {
        console.error('排班新增失败:', error);
        Modal.error({content: '排班新增失败'});
      }
    };

    // 专业人员管理相关
    const professionals = ref([]);
    const professionalColumns = [
      {title: '姓名', dataIndex: 'name', key: 'name'},
      {title: '角色', dataIndex: 'role', key: 'role'},
      {title: '职称', dataIndex: 'title', key: 'title'},
      {title: '状态', dataIndex: 'status', key: 'status'},
      {title: '操作', key: 'action'}
    ];
    const professionalPagination = {
      pageSize: 5,
      showTotal: total => `共 ${total} 条`
    };
    const isProfessionalModalVisible = ref(false);
    const professionalForm = ref({
      id: null,
      name: '',
      role: '',
      title: '',
      bio: '',
      expertise: '',
      professionalimage: '',
      status: 'active'
    });
    const professionalModalTitle = ref('新增专业人员');
    const fileList = ref([]);
    const uploadUrl = ref("https://aiforoptometry.com/upload/professional_image/");
    const getFileFromUrl = async (url) => {
      const response = await fetch(url);
      const blob = await response.blob();
      return new File([blob], 'avatar.png', {type: blob.type});
    };
    const handleBeforeUpload = (file) => {
      if (fileList.value && fileList.value.length > 0) {
        Modal.error({content: '请先删除当前头像，再上传新的头像'});
        return false;
      }
      return false; // 总是返回 false 防止自动上传
    };
    const handleUploadChange = (info) => {
      console.log("调试 - 上传事件全部内容：", info);
      const fileObj = info.file.originFileObj || info.file;
      if (!fileObj) return;
      fileObj.preview = URL.createObjectURL(fileObj);
      console.log("调试 - 用户选择的图片文件信息：", fileObj);
      fileList.value = [{
        uid: info.file.uid,
        name: info.file.name,
        status: 'done',
        url: fileObj.preview
      }];
      professionalForm.value.professionalimage = fileObj;
    };
    const fetchProfessionals = async () => {
      const organizationId = localStorage.getItem('organization_id');
      const csrftoken = localStorage.getItem('csrftoken');
      console.log("获取专业人员列表：请求 URL：", `https://aiforoptometry.com/professional/list/${organizationId}/`);
      try {
        const response = await fetch(`https://aiforoptometry.com/professional/list/${organizationId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          }
        });
        const data = await response.json();
        console.log("获取专业人员列表：响应数据：", data);
        // 保存数据到 localStorage，便于其他地方使用
        localStorage.setItem("professionals", JSON.stringify(data.data));
        professionals.value = data.data;
      } catch (error) {
        console.error('获取专业人员失败:', error);
        Modal.error({content: '获取专业人员失败，请重试'});
      }
    };
    const handleAddProfessional = () => {
      professionalModalTitle.value = '新增专业人员';
      professionalForm.value = {
        id: null,
        name: '',
        role: '',
        title: '',
        bio: '',
        expertise: '',
        professionalimage: '',
        status: 'active'
      };
      fileList.value = [];
      isProfessionalModalVisible.value = true;
    };
    const handleEditProfessional = record => {
      console.log("编辑专业人员预填充信息：", record);
      professionalModalTitle.value = '编辑专业人员';
      professionalForm.value = {...record};
      if (record.professionalimage) {
        let imageUrl = record.professionalimage;
        if (!imageUrl.startsWith('http')) {
          imageUrl = `https://aiforoptometry.com/media/${imageUrl}`;
        }
        fileList.value = [{
          uid: '-1',
          name: 'avatar',
          url: imageUrl
        }];
      } else {
        fileList.value = [];
      }
      isProfessionalModalVisible.value = true;
    };
    const handleDeleteProfessional = record => {
      Modal.confirm({
        title: '确认删除',
        content: `确定删除 ${record.name} 吗？`,
        onOk: async () => {
          const csrftoken = localStorage.getItem('csrftoken');
          console.log("删除专业人员：请求 URL：", `https://aiforoptometry.com/professional/update/${record.id}/`);
          console.log("删除专业人员：Payload：", {status: 'inactive'});
          try {
            const response = await fetch(`https://aiforoptometry.com/professional/update/${record.id}/`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
              },
              body: JSON.stringify({status: 'inactive'})
            });
            const data = await response.json();
            console.log("删除专业人员：响应数据：", data);
            if (data.message) {
              Modal.success({content: '删除成功'});
              professionals.value = professionals.value.filter(pro => pro.id !== record.id);
            } else {
              Modal.error({content: '删除失败'});
            }
          } catch (error) {
            console.error('删除专业人员失败:', error);
            Modal.error({content: '删除失败'});
          }
        }
      });
    };
    const handleCancelProfessionalModal = () => {
      isProfessionalModalVisible.value = false;
    };
    const submitProfessional = async () => {
      const formData = new FormData();
      formData.append('name', professionalForm.value.name);
      formData.append('role', professionalForm.value.role);
      formData.append('title', professionalForm.value.title);
      formData.append('bio', professionalForm.value.bio);
      formData.append('expertise', professionalForm.value.expertise);
      formData.append('status', professionalForm.value.status);
      const organizationId = localStorage.getItem('organization_id');
      formData.append('organization', organizationId);

      if (!professionalForm.value.professionalimage) {
        professionalForm.value.professionalimage = await getFileFromUrl(defaultAvatar);
      }

      if (professionalForm.value.professionalimage instanceof File) {
        const originalFile = professionalForm.value.professionalimage;
        const ext = originalFile.name.split('.').pop();
        const newFileName = `${Date.now()}.${ext}`;
        const newFile = new File([originalFile], newFileName, {type: originalFile.type});
        professionalForm.value.professionalimage = newFile;
        formData.append('professionalimage', professionalForm.value.professionalimage);
      } else {
        formData.append('professionalimage', professionalForm.value.professionalimage);
      }

      if (professionalForm.value.id) {
        const requestUrl = `https://aiforoptometry.com/professional/update/${professionalForm.value.id}/`;
        console.log("编辑专业人员：请求 URL：", requestUrl);
        console.log("编辑专业人员：发送的数据：");
        for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
        }
        axios.put(requestUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
            .then(response => {
              console.log("编辑专业人员：响应数据：", response.data);
              Modal.success({content: '专业人员更新成功'});
              isProfessionalModalVisible.value = false;
              fetchProfessionals();
            })
            .catch(error => {
              console.error("编辑专业人员请求错误：", error);
              Modal.error({content: '更新专业人员失败'});
            });
      } else {
        const requestUrl = `https://aiforoptometry.com/professional/add/`;
        console.log("新增专业人员：请求 URL：", requestUrl);
        console.log("新增专业人员：发送的数据：");
        for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
        }
        axios.post(requestUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
            .then(response => {
              console.log("新增专业人员：响应数据：", response.data);
              Modal.success({content: '专业人员创建成功'});
              isProfessionalModalVisible.value = false;
              fetchProfessionals();
            })
            .catch(error => {
              console.error("新增专业人员请求错误：", error);
              Modal.error({content: '创建专业人员失败'});
            });
      }
    };

    const handleRemove = (file) => {
      professionalForm.value.professionalimage = '';
      fileList.value = [];
    };

    const handleToggleProfessionalStatus = async (record) => {
      const csrftoken = localStorage.getItem('csrftoken');
      const newStatus = record.status === 'active' ? 'inactive' : 'active';
      try {
        const response = await fetch(`https://aiforoptometry.com/professional/update/${record.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify({status: newStatus})
        });
        const data = await response.json();
        console.log("状态切换响应数据：", data);
        if (data.message) {
          Modal.success({content: '状态更新成功'});
          const idx = professionals.value.findIndex(item => item.id === record.id);
          if (idx !== -1) {
            professionals.value[idx].status = newStatus;
          }
        } else {
          Modal.error({content: '状态更新失败'});
        }
      } catch (e) {
        console.error('状态更新失败', e);
        Modal.error({content: '状态更新失败'});
      }
    };

    const setProfessionalRowClass = (record, index) => {
      return record.status === 'inactive' ? 'professional-disabled' : '';
    };

    // 排班管理相关：排班概览和周排班数据
    const overviewSchedule = ref([]);
    // 更新 computed 属性，将排班概览中的专业人员id转换为包含头像、姓名和角色的信息
    const overviewScheduleWithName = computed(() => {
      let storedProfessionals = [];
      try {
        storedProfessionals = JSON.parse(localStorage.getItem("professionals") || "[]");
      } catch (error) {
        console.error("读取localStorage中的专业人员数据失败", error);
      }
      return overviewSchedule.value.map(item => {
        // 优先使用后端返回的 professional_info 数据
        let professionalName, professionalImage, professionalRole;
        
        if (item.professional_info && item.professional_info.name) {
          professionalName = item.professional_info.name;
          professionalImage = item.professional_info.professionalimage || '';
          professionalRole = item.professional_info.role || '';
        } else {
          // 如果后端没有返回 professional_info，则从 localStorage 中查找
          const found = storedProfessionals.find(pro => pro.id == item.professional);
          professionalName = found ? found.name : item.professional;
          professionalImage = found ? found.professionalimage : '';
          professionalRole = found ? found.role : '';
        }
        
        return {
          ...item,
          professionalName: professionalName,
          professionalImage: professionalImage,
          professionalRole: professionalRole,
          shift: item.shift === 'AM' ? '上午' : item.shift === 'PM' ? '下午' : item.shift === 'FULL' ? '全天' : item.shift
        };
      });
    });
    const currentWeekSchedules = ref([]);
    const nextWeekSchedules = ref([]);
    const weeklyScheduleColumns = [
      {
        title: '专业人员',
        dataIndex: 'professional',
        key: 'professional',
        customRender: ({record}) => {
          // 优先使用后端返回的 professional_info 数据
          if (record.professional_info && record.professional_info.name) {
            return record.professional_info.name;
          }
          // 如果后端没有返回 professional_info，则从 localStorage 中查找
          let storedProfessionals = [];
          try {
            storedProfessionals = JSON.parse(localStorage.getItem("professionals") || "[]");
          } catch (error) {
            console.error("读取localStorage中的专业人员数据失败", error);
          }
          const found = storedProfessionals.find(pro => pro.id == record.professional);
          return found ? found.name : '未知';
        }
      },
      {
        title: '日期',
        dataIndex: 'date',
        key: 'date'
      },
      {
        title: '班次',
        dataIndex: 'shift',
        key: 'shift',
        customRender: ({record}) => {
          if (record.shift === 'AM') return '上午';
          if (record.shift === 'PM') return '下午';
          if (record.shift === 'FULL') return '全天';
          return record.shift; // 默认显示原始值
        }
      },
      {
        title: '时间段',
        dataIndex: 'timeRange',
        key: 'timeRange',
        customRender: ({record}) => {
          return record.start_time && record.end_time ? record.start_time + ' - ' + record.end_time : '';
        }
      },
      {
        title: '操作',
        key: 'action',
        customRender: ({record}) => {
          return h('div', [
            h(
                Button,
                {
                  type: 'link',
                  onClick: () => handleEditSchedule(record)
                },
                '编辑'
            ),
            h(
                Button,
                {
                  type: 'link',
                  danger: true,
                  onClick: () => handleDeleteSchedule(record.id)
                },
                '删除'
            )
          ]);
        }
      }
    ];

    const disabledDate = (current) => {
      // 允许选择任意日期，不限制
      return false;
    };

    const fetchScheduleOverview = async () => {
      // 如果未选择日期，不获取排班概览
      if (!selectedDate.value) {
        overviewSchedule.value = [];
        return;
      }
      
      const organizationId = localStorage.getItem('organization_id');
      const csrftoken = localStorage.getItem('csrftoken');
      const selected = dayjs(selectedDate.value).format("YYYY-MM-DD");
      const url = `https://aiforoptometry.com/schedule/list/organization/${organizationId}/?start_date=${selected}&end_date=${selected}`;

      // 输出前端发送的信息
      console.log("发送获取排班概览请求的URL:", url);
      console.log("请求头部信息:", {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      });

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          }
        });
        const data = await response.json();

        // 输出后端返回的数据
        console.log("后端返回的排班概览数据:", data);
        overviewSchedule.value = data.data || [];
      } catch (error) {
        console.error("获取排班概览失败:", error);
        overviewSchedule.value = [];
      }
    };

    watch(selectedDate, (newDate) => {
      // 无论是否选择日期，都刷新预约列表
      fetchInvites();
      // 只有选择日期时才获取排班概览
      if (newDate) {
        fetchScheduleOverview();
      } else {
        // 清空排班概览
        overviewSchedule.value = [];
      }
    }, {immediate: false}); // 移除 immediate，避免初始化时执行

    const fetchWeeklySchedules = async () => {
      const organizationId = localStorage.getItem('organization_id');
      const csrftoken = localStorage.getItem('csrftoken');
      const currentWeekStart = dayjs().startOf('week').format("YYYY-MM-DD");
      const currentWeekEnd = dayjs().endOf('week').format("YYYY-MM-DD");
      const nextWeekStart = dayjs().add(1, 'week').startOf('week').format("YYYY-MM-DD");
      const nextWeekEnd = dayjs().add(1, 'week').endOf('week').format("YYYY-MM-DD");
      
      console.log("获取周排班 - 本周日期范围:", currentWeekStart, "到", currentWeekEnd);
      console.log("获取周排班 - 下周日期范围:", nextWeekStart, "到", nextWeekEnd);
      
      try {
        const currentResponse = await fetch(`https://aiforoptometry.com/schedule/list/organization/${organizationId}/?start_date=${currentWeekStart}&end_date=${currentWeekEnd}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          }
        });
        const currentData = await currentResponse.json();
        console.log("获取周排班 - 本周数据:", currentData);
        currentWeekSchedules.value = currentData.data || [];

        const nextResponse = await fetch(`https://aiforoptometry.com/schedule/list/organization/${organizationId}/?start_date=${nextWeekStart}&end_date=${nextWeekEnd}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          }
        });
        const nextData = await nextResponse.json();
        console.log("获取周排班 - 下周数据:", nextData);
        nextWeekSchedules.value = nextData.data || [];
      } catch (error) {
        console.error("获取周排班失败:", error);
        currentWeekSchedules.value = [];
        nextWeekSchedules.value = [];
      }
    };

    // 添加 formatTime 方法，格式化时间（仅保留时和分）
    const formatTime = (time) => {
      return dayjs(time, "HH:mm:ss").format("HH:mm");
    };

    // Add these computed properties and refs in the setup() function
    const weekDays = computed(() => {
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      const today = dayjs();
      // 修复：正确计算本周的周一
      // 如果今天是周日，则本周的周一是今天+1天
      // 如果今天是其他天，则本周的周一是今天减去当前是周几的天数
      const currentDayOfWeek = today.day(); // 0=周日, 1=周一, ..., 6=周六
      const startOfWeek = currentDayOfWeek === 0 
        ? today.add(1, 'day') // 如果今天是周日，周一是明天
        : today.subtract(currentDayOfWeek - 1, 'day'); // 否则减去相应天数到周一
      
      console.log('日期计算调试:', {
        today: today.format('YYYY-MM-DD'),
        currentDayOfWeek,
        startOfWeek: startOfWeek.format('YYYY-MM-DD')
      });
      
      return days.map((day, index) => {
        const date = startOfWeek.add(index, 'day');
        return {
          label: today.isSame(date, 'day') ? '今天' : day,
          value: date.format('YYYY-MM-DD'),
          isToday: today.isSame(date, 'day')
        };
      });
    });

    const activeWeekDay = ref(weekDays.value.find(day => day.isToday)?.value || weekDays.value[0].value);

    const nextWeekDays = computed(() => {
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      const today = dayjs();
      // 修复：正确计算下周的周一
      const currentDayOfWeek = today.day(); // 0=周日, 1=周一, ..., 6=周六
      const startOfThisWeek = currentDayOfWeek === 0 
        ? today.add(1, 'day') // 如果今天是周日，本周的周一是明天
        : today.subtract(currentDayOfWeek - 1, 'day'); // 否则减去相应天数到本周周一
      const startOfNextWeek = startOfThisWeek.add(7, 'day'); // 下周的周一
      
      return days.map((day, index) => {
        const date = startOfNextWeek.add(index, 'day');
        return {
          label: day,
          value: date.format('YYYY-MM-DD')
        };
      });
    });

    const activeNextWeekDay = ref(nextWeekDays.value[0].value);

    // 添加计算属性来显示过滤后的数据
    const filteredCurrentWeekSchedules = computed(() => {
      const filtered = currentWeekSchedules.value.filter(schedule => schedule.date === activeWeekDay.value);
      console.log("过滤后的本周排班数据:", {
        activeWeekDay: activeWeekDay.value,
        totalSchedules: currentWeekSchedules.value.length,
        filteredCount: filtered.length,
        filteredData: filtered
      });
      return filtered;
    });

    const filteredNextWeekSchedules = computed(() => {
      const filtered = nextWeekSchedules.value.filter(schedule => schedule.date === activeNextWeekDay.value);
      console.log("过滤后的下周排班数据:", {
        activeNextWeekDay: activeNextWeekDay.value,
        totalSchedules: nextWeekSchedules.value.length,
        filteredCount: filtered.length,
        filteredData: filtered
      });
      return filtered;
    });

    // Add these handler functions
    const handleWeekDayChange = (date) => {
      activeWeekDay.value = date;
      fetchScheduleOverview();
    };

    const handleNextWeekDayChange = (date) => {
      activeNextWeekDay.value = date;
    };

    const fetchScheduleByProfessionalAndDate = async (professionalId, date) => {
      try {
        console.log('获取排班信息 - 请求参数:', {professionalId, date}); // 打印请求参数
        const response = await axios.get('/schedule/get_by_professional_and_date/', {
          params: {
            professional_id: professionalId,
            date: date,
          },
        });
        console.log('获取排班信息 - 响应数据:', response.data); // 打印响应数据
        return response.data.data; // 返回排班信息，包括排班 ID
      } catch (error) {
        console.error('获取排班信息失败:', error);
        return null;
      }
    };

    // Add this ref to track edit modal visibility
    const isEditScheduleModalVisible = ref(false);

    // Modify handleEditSchedule function
    const handleEditSchedule = (record) => {
      console.log('编辑排班 - 排班信息:', record); // 打印排班信息
      if (!record || !record.id) {
        console.error('无效的排班记录:', record);
        Modal.error({content: '无效的排班记录'});
        return;
      }

      scheduleForm.value = {
        id: record.id,
        professionalId: record.professional,
        scheduleDate: dayjs(record.date),
        shiftType: record.shift ? 'shift' : 'timeRange',
        shift: record.shift,
        startTime: record.start_time ? dayjs(record.start_time, 'HH:mm') : null,
        endTime: record.end_time ? dayjs(record.end_time, 'HH:mm') : null
      };
      isEditScheduleModalVisible.value = true;
    };

    // Modify submitEditSchedule function
    const submitEditSchedule = async () => {
      try {
        if (!scheduleForm.value.id) {
          throw new Error('排班ID未定义');
        }

        const payload = {
          professional: scheduleForm.value.professionalId,
          date: scheduleForm.value.scheduleDate.format('YYYY-MM-DD'),
          shift: scheduleForm.value.shiftType === 'shift' ? scheduleForm.value.shift : null,
          start_time: scheduleForm.value.shiftType === 'timeRange' ?
              scheduleForm.value.startTime.format('HH:mm') : null,
          end_time: scheduleForm.value.shiftType === 'timeRange' ?
              scheduleForm.value.endTime.format('HH:mm') : null
        };

        const response = await axios.post(
            `https://aiforoptometry.com/schedule/update/${scheduleForm.value.id}/`,
            payload
        );

        if (response.data.message) {
          Modal.success({content: '排班更新成功'});
          isEditScheduleModalVisible.value = false;
          fetchWeeklySchedules();
        }
      } catch (error) {
        console.error('排班更新失败:', error);
        Modal.error({
          content: error.message || '排班更新失败'
        });
      }
    };

    const handleDeleteSchedule = (scheduleId) => {
      Modal.confirm({
        title: '确认删除',
        content: `确定删除该排班信息吗？`,
        onOk: async () => {
          await deleteScheduleById(scheduleId);
        },
      });
    };

         const deleteScheduleById = async (scheduleId) => {
       try {
         console.log('删除排班 - 排班ID:', scheduleId); // 打印排班ID
         const response = await axios.delete(
             `https://aiforoptometry.com/schedule/delete/${scheduleId}/`,
             {
               headers: {
                 'Content-Type': 'application/json',
                 'X-CSRFToken': localStorage.getItem('csrftoken')
               }
             }
         );

         console.log('删除排班 - 响应数据:', response.data); // 打印响应数据

         // 即使后端没有返回数据，我们也认为删除成功
         Modal.success({content: '排班删除成功'});
         // 刷新排班数据
         fetchWeeklySchedules();
       } catch (error) {
         console.error('删除排班失败:', error);
         Modal.error({
           content: error.response?.data?.message || '排班删除失败'
         });
       }
     };

     const handleCancelEditScheduleModal = () => {
       isEditScheduleModalVisible.value = false;
     };

    // 在 setup() 函数中添加以下代码
    watch(activeScheduleTab, (newTab) => {
      if (newTab === 'schedule') {
        // 重置排班表单
        scheduleForm.value = {
          professionalId: '',
          scheduleDate: null,
          shiftType: '',
          shift: '',
          startTime: null,
          endTime: null
        };
      }
    });

    onMounted(() => {
      fetchProfessionals();
      fetchInvites();
      fetchDoctorList(); // 加载医生列表用于筛选
    });

         return {
       // 预约管理
       currentPage,
       pageSize,
       total,
       isLoading,
       searchText,
       selectedDate,
       selectedDoctors,
       disabledDate,
       overviewSchedule,
       overviewScheduleWithName,
       filteredAppointments,
       columns,
       pagination,
       isModalVisible,
       modalTitle,
       appointmentForm,
       handleSearch,
       handleDateChange,
       handleAddAppointment,
       handleEditAppointment,
       handleCancelModal,
       // 发起邀约相关
       isInviteModalVisible,
       inviteForm,
       handleInitiateInvite,
       closeInviteModal,
       submitInvite,
       // 改期相关
       isRescheduleModalVisible,
       rescheduleForm,
       handleReschedule,
       closeRescheduleModal,
       submitReschedule,
       submitAppointment,
       handleRefreshInvites,
       fetchInvites,
       handlePageChange,
       getRowClassName,
       // 员工列表相关
       employeeList,
       employeeListLoading,
       fetchEmployeeList,
       getCurrentEmployeeAccount,
       // 医生列表相关
       doctorList,
       doctorListOptions,
       fetchDoctorList,
       // 患者列表相关
       patientListOptions,
       handlePatientSelect,
       patientSearchText,
       // 坐诊管理 & 排班管理
       isScheduleModalVisible,
       activeScheduleTab,
       scheduleForm,
       handleOpenScheduleModal,
       currentWeekSchedules,
       nextWeekSchedules,
       filteredCurrentWeekSchedules,
       filteredNextWeekSchedules,
       weeklyScheduleColumns,
       handleCancelScheduleModal,
       submitSchedule,
       // 专业人员管理
       professionals,
       professionalColumns,
       professionalPagination,
       isProfessionalModalVisible,
       professionalForm,
       professionalModalTitle,
       fileList,
       uploadUrl,
       handleUploadChange,
       handleBeforeUpload,
       handleAddProfessional,
       handleEditProfessional,
       handleDeleteProfessional,
       handleCancelProfessionalModal,
       submitProfessional,
       handleRemove,
       handleToggleProfessionalStatus,
       setProfessionalRowClass,

       // 新增的排班时间格式化方法
       formatTime,
       weekDays,
       activeWeekDay,
       handleWeekDayChange,
       nextWeekDays,
       activeNextWeekDay,
       handleNextWeekDayChange,
       fetchScheduleByProfessionalAndDate,
       handleEditSchedule,
       handleDeleteSchedule,
       deleteScheduleById,
       isEditScheduleModalVisible,
       handleCancelEditScheduleModal,
       submitEditSchedule,
       locale
     };
  }
};
</script>

<style scoped>
.wrapper {
  background: #FFFFFF;
  border-radius: 10px 10px 10px 10px;
  border: 1px solid #FFFFFF;
  padding: 10px;
}

.filter-container {
  display: flex;
  align-items: center;
}

.professional-disabled {
  background-color: #f5f5f5;
  color: #999;
}

.custom-appointment-tag {
  margin: 8px 8px 0 0;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background-color: #fff;
  font-size: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.custom-appointment-tag img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
}

.custom-appointment-tag span {
  margin-right: 8px;
  font-weight: 500;
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

.modal-input {
  background: #FFFFFF;
  border-radius: 8px 8px 8px 8px;
  border: 1px solid #E27244;
  .ant-select-selector {
    border: none;
  }
}

.modal-btn {
  width: 159px;
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

:deep(.modal-tabs) {
  .ant-tabs-nav {
    margin: 0 24px 0 24px;
  }
}

.modal-btn-title {
  margin-right: 16px;
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

.modal-textarea {
  background: #FFFFFF;
  border-radius: 8px 8px 8px 8px;
  border: 1px solid #E27244;
  resize: vertical;
}

.modal-textarea:focus {
  border-color: #E27244;
  box-shadow: 0 0 0 2px rgba(226, 114, 68, 0.2);
}

/* 排班表格样式 */
.weekly-schedules {
  .ant-table {
    .ant-table-tbody > tr > td {
      padding: 8px 12px;
      font-size: 14px;
    }
    
    .ant-table-thead > tr > th {
      padding: 12px;
      font-size: 14px;
      font-weight: 600;
    }
  }
}

/* 确保表格容器有足够的高度 */
.ant-modal-body {
  max-height: 70vh;
  overflow-y: auto;
}

/* 逾期行样式 */
:deep(.overdue-row) {
  background-color: rgba(255, 77, 79, 0.1) !important;
}

:deep(.overdue-row:hover) {
  background-color: rgba(255, 77, 79, 0.2) !important;
}
</style>
