<template>
  <div class="patient-sales">
    <div class="header" style="display: flex; align-items: center; margin-bottom: 8px;">
    <h2>销售开单 - {{ salesData.patientInfo.name }}</h2>
      <a-button type="primary" @click="showSalesModal" style="margin-left: 20px;">
        开单
      </a-button>
    </div>
    <div class="sales-content">
      <h3 style="margin-bottom: 8px;">患者信息：</h3>
      <div class="patient-info-row">
        <div class="info-item">
          <span class="info-label">姓名：</span>
          <span class="info-value">{{ salesData.patientInfo.name }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">性别：</span>
          <span class="info-value">{{ salesData.patientInfo.gender === '男' ? '男' : '女' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">出生日期：</span>
          <span class="info-value">{{ salesData.patientInfo.birthDate ? dayjs(salesData.patientInfo.birthDate).format('YYYY-MM-DD') : '未知' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">手机号：</span>
          <span class="info-value">{{ salesData.patientInfo.phone }}</span>
        </div>
      </div>

      <!-- 消费统计信息已移至新的统计区域 -->

      <!-- 修改历史消费记录表格 -->
      <div class="sales-history" style="margin-top: 4px;">
        <h3 style="margin-bottom: 8px;">历史消费记录</h3>
        
        <!-- 过滤条件区域 -->
        <div class="filter-section">
          <div class="date-filters">
            <div class="date-item">
              <label>选择日期：</label>
              <input 
                type="date" 
                v-model="selectedDate" 
                class="date-input"
                @change="onFilterChange"
              />
            </div>
            <div class="date-item">
              <label>完成度：</label>
              <select v-model="selectedStatus" class="date-input" @change="onFilterChange">
                <option value="">全部状态</option>
                <option value="已结清">已结清</option>
                <option value="已完成">已完成</option>
                <option value="尚有欠款">尚有欠款</option>
                <option value="部分退单">部分退单</option>
                <option value="全部退单">全部退单</option>
              </select>
            </div>
          </div>
          <button @click="applyFilters" class="confirm-btn">筛选</button>
        </div>

       

        <!-- 记录列表区域 -->
        <div class="records-section">
          <div v-if="loading" class="loading">
            加载中...
          </div>
          <div v-else-if="saleHistory.length === 0" class="no-data">
            暂无记录
          </div>
          <div v-else class="records-content">
            <!-- 销售记录表格 -->
            <div class="table-container">
              <table class="records-table">
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>订单日期</th>
                    <th>操作员</th>
                    <th>商品数量</th>
                    <th>订单金额</th>
                    <th>完成度</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(record, index) in paginatedRecords" :key="index" class="record-row">
                    <td>{{ record.order_no || record.order_id || 'N/A' }}</td>
                    <td>{{ formatDate(record.sale_date) }}</td>
                    <td>{{ record.operator || 'N/A' }}</td>
                    <td>{{ record.items?.length || 0 }}</td>
                    <td class="amount">¥{{ record.total_amount || 0 }}</td>
                    <td>
                      <span :class="['status-tag', getPaymentStatus(record).class]">
                        {{ getPaymentStatus(record).text }}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button @click="viewOrderDetails(record)" class="view-btn">查看详情</button>
                        <button @click="printOrder(record)" class="print-btn">打印销售单</button>
                      </div>
                    </td>
                  </tr>
                  <!-- 空行填充 -->
                  <tr v-for="i in (pageSize - paginatedRecords.length)" :key="`empty-${i}`" class="empty-row">
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 分页控件 -->
            <div class="pagination" v-if="totalPages > 1">
              <button 
                @click="changePage(currentPage - 1)" 
                :disabled="currentPage === 1"
                class="page-btn"
              >
                上一页
              </button>
              
              <div class="page-numbers">
                <button 
                  v-for="page in visiblePages" 
                  :key="page"
                  @click="changePage(page)"
                  :class="['page-btn', { active: page === currentPage }]"
                >
                  {{ page }}
                </button>
              </div>
              
              <button 
                @click="changePage(currentPage + 1)" 
                :disabled="currentPage === totalPages"
                class="page-btn"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
        </div>

      
    </div>

    <!-- 开单模态框 -->
    <div v-if="salesModalVisible" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>销售开单 - {{ salesData.patientInfo.name }} - {{ salesData.patientInfo.gkid || '无编号' }} - {{ salesData.patientInfo.phone }}</h3>
          <div style="display: flex; align-items: center; gap: 16px;">
            <a-date-picker
              v-model:value="saleDate"
              :format="dateFormat"
              style="width: 200px"
              placeholder="选择开单日期"
              :locale="locale"
            />
            <a-button type="text" @click="handleSalesModalCancel">
              <close-outlined />
            </a-button>
          </div>
        </div>
        <div class="modal-body">
          <div class="sales-modal-content">
            <!-- 消费条目列表 -->
            <div class="sales-items-list">
              <div class="list-header">
                <h3>消费条目</h3>
                <a-button type="primary" @click="addSalesItem">
                  新增消费
                </a-button>
              </div>
              
              <a-table
                :columns="salesItemColumns"
                :data-source="salesItems"
                :pagination="false"
                :scroll="{ y: 'calc(85vh - 450px)', x: 1200 }"
                style="height: calc(85vh - 450px); min-height: 300px;"
                class="sales-table"
              >
                <template #bodyCell="{ column, record, index }">
                  <template v-if="column.key === 'category'">
                    <a-select
                      v-model:value="record.category"
                      style="width: 120px"
                      @change="(value) => handleCategoryChange(value, index)"
                    >
                      <a-select-option value="lens">镜片</a-select-option>
                      <a-select-option value="frame">镜架</a-select-option>
                      <a-select-option value="soft_contact">隐形眼镜</a-select-option>
                      <a-select-option value="solution">护理液/药品</a-select-option>
                      <a-select-option value="non_medical">非医疗用品</a-select-option>
                      <a-select-option value="service">服务</a-select-option>
                    </a-select>
                  </template>
                  <template v-if="column.key === 'item'">
                    <a-select
                      v-model:value="record.itemId"
                      style="width: 200px"
                      :options="getItemOptions(record.category)"
                      @change="(value) => handleItemChange(value, index)"
                      show-search
                      :filter-option="(input, option) => 
                        option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0"
                    />
                  </template>
                  <template v-if="column.key === 'details'">
                    <div style="display: flex; gap: 8px; align-items: center;">
                      <!-- 镜架型号和材质 -->
                      <template v-if="record.category === 'frame'">
                        <a-select
                          v-model:value="record.model"
                          style="width: 120px"
                          placeholder="型号"
                          :options="getFrameModelOptions(record.itemId)"
                          @change="(value) => handleModelChange(value, index)"
                          show-search
                          :filter-option="(input, option) => 
                            option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0"
                          allow-clear
                        />
                        <a-select
                          v-if="record.model"
                          v-model:value="record.material"
                          style="width: 120px"
                          placeholder="材质"
                          :options="getFrameMaterialOptions(record.itemId, record.model)"
                          @change="(value) => handleMaterialChange(value, index)"
                        />
                      </template>
                      <!-- 镜片度数和眼别 -->
                      <template v-if="record.category === 'lens'">
                        <a-input-number
                          v-model:value="record.sphere"
                          :min="-20"
                          :max="20"
                          :step="0.25"
                          style="width: 100px"
                          placeholder="球镜度数"
                          @change="(value) => handleSphereChange(value, index)"
                        />
                        <a-input-number
                          v-model:value="record.cylinder"
                          :min="-6"
                          :max="6"
                          :step="0.25"
                          style="width: 100px"
                          placeholder="柱镜度数"
                          @change="(value) => handleCylinderChange(value, index)"
                        />
                        <a-input-number
                          v-model:value="record.axis"
                          :min="0"
                          :max="180"
                          :step="1"
                          style="width: 100px"
                          placeholder="轴位"
                          @change="(value) => handleAxisChange(value, index)"
                        />
                        <a-select
                          v-model:value="record.eye"
                          style="width: 80px"
                          placeholder="眼别"
                          @change="(value) => handleEyeChange(value, index)"
                        >
                          <a-select-option value="left">左眼</a-select-option>
                          <a-select-option value="right">右眼</a-select-option>
                        </a-select>
                      </template>
                      <!-- 隐形眼镜类型、度数和批号 -->
                      <template v-if="record.category === 'soft_contact'">
                        <a-select
                          v-model:value="record.sphere"
                          style="width: 100px"
                          placeholder="球镜度数"
                          :options="getSoftContactSphereOptions(record.itemId, record.type)"
                          @change="(value) => handleSoftContactSphereChange(value, index)"
                          show-search
                          :filter-option="(input, option) => option.label.toString().indexOf(input) >= 0"
                          allow-clear
                        />
                        <a-input-number
                          v-model:value="record.cylinder"
                          :min="-6"
                          :max="6"
                          :step="0.25"
                          style="width: 100px"
                          placeholder="柱镜度数"
                          @change="(value) => handleSoftContactCylinderChange(value, index)"
                        />
                        <a-select
                          v-model:value="record.type"
                          style="width: 120px"
                          placeholder="类型"
                          :options="getSoftContactTypeOptions(record.itemId)"
                          @change="(value) => handleSoftContactTypeChange(value, index)"
                          :disabled="disabledFields[`type_${index}`]"
                        />
                        <a-select
                          v-if="record.type && record.sphere !== undefined"
                          v-model:value="record.batchNumber"
                          style="width: 120px"
                          placeholder="批号"
                          :options="getSoftContactBatchOptions(record.itemId, record.type)"
                          @change="(value) => handleSoftContactBatchChange(value, index)"
                          show-search
                          :filter-option="(input, option) => 
                            option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0"
                          allow-clear
                          mode="tags"
                          :token-separators="[',']"
                          :disabled="disabledFields[`batch_${index}`]"
                        />
                      </template>
                      <!-- 护理液类型、规格、单位和批号 -->
                      <template v-if="record.category === 'solution'">
                        <a-select
                          v-model:value="record.type"
                          style="width: 120px"
                          placeholder="类型"
                          :options="getSolutionTypeOptions(record.itemId).options"
                          @change="(value) => handleSolutionTypeChange(value, index)"
                          :disabled="disabledFields[`type_${index}`]"
                        />
                        <a-select
                          v-if="record.type"
                          v-model:value="record.specification"
                          style="width: 120px"
                          placeholder="规格"
                          :options="getSolutionSpecOptions(record.itemId, record.type).options"
                          @change="(value) => handleSolutionSpecChange(value, index)"
                          :disabled="disabledFields[`spec_${index}`]"
                        />
                        <a-select
                          v-if="record.specification"
                          v-model:value="record.unit"
                          style="width: 120px"
                          placeholder="单位"
                          :options="getSolutionUnitOptions(record.itemId, record.type, record.specification).options"
                          @change="(value) => handleSolutionUnitChange(value, index)"
                          :disabled="disabledFields[`unit_${index}`]"
                        />
                        <a-select
                          v-if="record.unit"
                          v-model:value="record.batchNumber"
                          style="width: 120px"
                          placeholder="批号"
                          :options="getSolutionBatchOptions(record.itemId, record.type, record.specification, record.unit).options"
                          @change="(value) => handleSolutionBatchChange(value, index)"
                          show-search
                          :filter-option="(input, option) => 
                            option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0"
                          allow-clear
                          mode="tags"
                          :token-separators="[',']"
                          :disabled="disabledFields[`batch_${index}`]"
                        />
                      </template>
                      <!-- 非医疗产品生产日期和到期日期 -->
                      <template v-if="record.category === 'non_medical'">
                        <template v-if="getAccessoryDateOptions(record.itemId).hasDates">
                          <a-select
                            v-model:value="record.dateOption"
                            style="width: 240px"
                            placeholder="选择日期（可选）"
                            :options="[
                              { label: '不选择日期', value: null },
                              ...getAccessoryDateOptions(record.itemId).dates.map(date => ({
                                label: `${date.productionDate ? '生产日期: ' + date.productionDate : ''} ${date.expiryDate ? '到期日期: ' + date.expiryDate : ''}`,
                                value: date
                              }))
                            ]"
                            @change="(value) => handleAccessoryDateChange(value, index)"
                            :disabled="disabledFields[`date_${index}`]"
                            allowClear
                          />
                        </template>
                        <template v-else>
                          <span style="color: #999;">无日期信息</span>
                        </template>
                      </template>
                      <!-- 服务备注 -->
                      <template v-if="record.category === 'service'">
                        <a-input
                          v-model:value="record.remark"
                          style="width: 300px"
                          placeholder="备注"
                          @change="(value) => handleServiceRemarkChange(value, index)"
                        />
                      </template>
                    </div>
                  </template>
                  <template v-if="column.key === 'quantity'">
                    <a-input-number
                      v-model:value="record.quantity"
                      :min="1"
                      :max="99"
                      style="width: 80px"
                      @change="(value) => handleQuantityChange(value, index)"
                    />
                  </template>
                  <template v-if="column.key === 'stock'">
                    <span v-if="record.category === 'lens' && record.sphere !== undefined">
                      {{ getLensStock(record) }}
                    </span>
                    <span v-else-if="record.category === 'frame' && record.material">
                      {{ getFrameStock(record) }}
                    </span>
                    <span v-else-if="record.category === 'soft_contact' && record.batchNumber">
                      {{ getSoftContactStock(record) }}
                    </span>
                    <span v-else-if="record.category === 'solution' && record.batchNumber">
                      {{ getSolutionStock(record) }}
                    </span>
                    <span v-else-if="record.category === 'non_medical'">
                      {{ getAccessoryStock(record) }}
                    </span>
                    <span v-else>0</span>
                  </template>
                  <template v-if="column.key === 'price'">
                    ¥{{ record.price.toFixed(2) }}
                  </template>
                  <template v-if="column.key === 'discount'">
                    <a-input-number
                      v-model:value="record.discount"
                      :min="0"
                      :max="1"
                      :step="0.01"
                      :precision="2"
                      style="width: 80px"
                      @change="(value) => handleDiscountChange(value, index)"
                      @blur="(e) => handleDiscountBlur(e, index)"
                    />
                  </template>
                  <template v-if="column.key === 'subtotal'">
                    <a-input-number
                      v-model:value="record.subtotal"
                      :min="0"
                      :precision="2"
                      style="width: 100px"
                      placeholder="0.00"
                      @change="(value) => handleSubtotalChange(value, index)"
                      @blur="(e) => handleSubtotalBlur(e, index)"
                    />
                  </template>
                  <template v-if="column.key === 'action'">
                    <a-button type="link" danger @click="removeSalesItem(index)">
                      删除
                    </a-button>
                  </template>
                </template>
              </a-table>

              <div class="total-amount">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 16px; font-weight: bold;">总金额（折后）：¥{{ calculateTotalAmount().toFixed(2) }}</span>
                  </div>
                  <!-- 收款信息区域 -->
                  <div class="payment-section" style="margin-top: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <span style="font-weight: 600; color: #1890ff; font-size: 13px;">收款方式</span>
                      <span style="font-weight: bold; color: #52c41a; font-size: 13px;"></span>
                    </div>
                    
                    <!-- 收款方式一行显示 -->
                    <div style="display: flex; gap: 4px; margin-bottom: 6px; align-items: center;">
                      <span style="font-size: 11px; color: #666;">现金:</span>
                      <a-input-number
                        v-model:value="paymentMethods.cash_amount"
                        :min="0"
                        :precision="2"
                        style="width: 60px"
                        size="small"
                        placeholder="0"
                        @change="handlePaymentMethodChange"
                      />
                      <span style="font-size: 11px; color: #666; margin-left: 4px;">支付宝:</span>
                      <a-input-number
                        v-model:value="paymentMethods.alipay_amount"
                        :min="0"
                        :precision="2"
                        style="width: 60px"
                        size="small"
                        placeholder="0"
                        @change="handlePaymentMethodChange"
                      />
                      <span style="font-size: 11px; color: #666; margin-left: 4px;">微信:</span>
                      <a-input-number
                        v-model:value="paymentMethods.wechat_amount"
                        :min="0"
                        :precision="2"
                        style="width: 60px"
                        size="small"
                        placeholder="0"
                        @change="handlePaymentMethodChange"
                      />
                      <span style="font-size: 11px; color: #666; margin-left: 4px;">银行卡:</span>
                      <a-input-number
                        v-model:value="paymentMethods.bank_amount"
                        :min="0"
                        :precision="2"
                        style="width: 60px"
                        size="small"
                        placeholder="0"
                        @change="handlePaymentMethodChange"
                      />
                      <span style="font-size: 11px; color: #666; margin-left: 4px;">美团:</span>
                      <a-input-number
                        v-model:value="paymentMethods.meituan_amount"
                        :min="0"
                        :precision="2"
                        style="width: 60px"
                        size="small"
                        placeholder="0"
                        @change="handlePaymentMethodChange"
                      />
                      <span style="font-size: 11px; color: #666; margin-left: 4px;">抖音:</span>
                      <a-input-number
                        v-model:value="paymentMethods.douyin_amount"
                        :min="0"
                        :precision="2"
                        style="width: 60px"
                        size="small"
                        placeholder="0"
                        @change="handlePaymentMethodChange"
                      />
                      <span style="font-size: 11px; color: #666; margin-left: 4px;">其他:</span>
                      <a-input-number
                        v-model:value="paymentMethods.other_amount"
                        :min="0"
                        :precision="2"
                        style="width: 60px"
                        size="small"
                        placeholder="0"
                        @change="handlePaymentMethodChange"
                      />
                    </div>
                    
                    <!-- 金额信息、经办人和备注 -->
                    <div style="display: flex; gap: 12px; align-items: center; font-size: 12px; flex-wrap: wrap;">
                      <span>应收: <span style="font-weight: bold; color: #1890ff;">¥{{ receivableAmount.toFixed(2) }}</span></span>
                      <span>实收: <span style="font-weight: bold; color: #52c41a;">¥{{ actualAmount.toFixed(2) }}</span></span>
                      <span>欠款: <span style="font-weight: bold; color: #ff4d4f;">¥{{ calculateDebtAmount().toFixed(2) }}</span></span>
                      
                      <!-- 经办人 -->
                      <div style="display: flex; align-items: center; gap: 4px; margin-left: 8px;">
                        <span style="color: #666;">经办人:</span>
                        <a-input
                          v-model:value="operator"
                          style="width: 80px"
                          size="small"
                          placeholder="经办人"
                        />
                      </div>
                      
                      <!-- 备注 -->
                      <div style="display: flex; align-items: center; gap: 4px;">
                        <span style="color: #666;">备注:</span>
                        <a-input
                          v-model:value="remark"
                          style="width: 200px"
                          size="small"
                          placeholder="备注信息"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <a-button @click="handleSalesModalCancel">取消</a-button>
          <a-button type="primary" @click="handleSalesModalOk">确定</a-button>
        </div>
      </div>
    </div>

    <!-- 详情查看Modal -->
    <div v-if="detailsModalVisible" class="modal-overlay" @click="closeDetailModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>订单详情</h3>
          <button @click="closeDetailModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body" v-if="selectedRecord">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">姓名:</span>
                <span class="detail-value">{{ selectedRecord.patient?.name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">电话:</span>
                <span class="detail-value">{{ selectedRecord.patient?.phone }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">出生日期:</span>
                <span class="detail-value">{{ formatDate(selectedRecord.patient?.birth_date) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">订单号:</span>
                <span class="detail-value">{{ selectedRecord.order_no }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">销售日期:</span>
                <span class="detail-value">{{ formatDate(selectedRecord.sale_date) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">操作员:</span>
                <span class="detail-value">{{ selectedRecord.operator }}</span>
              </div>
            </div>
            
            <!-- 第二行：总金额、实收金额、完成度、收款渠道 -->
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">总金额:</span>
                <span class="detail-value">¥{{ selectedRecord.total_amount }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">实收金额:</span>
                <span class="detail-value">¥{{ selectedRecord.actual_amount }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">完成度:</span>
                <span class="detail-value">
                  <span :class="['status-tag', getPaymentStatus(selectedRecord).class]">
                    {{ getPaymentStatus(selectedRecord).text }}
                  </span>
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">收款渠道:</span>
                <span class="detail-value">{{ getPaymentChannels(selectedRecord) }}</span>
              </div>
            </div>
            
            <!-- 欠款金额显示 -->
            <div v-if="getPaymentStatus(selectedRecord).text === '尚有欠款'" class="payment-section compact">
              <div class="balance-info">
                <span class="balance-label">欠款金额:</span>
                <span class="balance-amount">¥{{ selectedRecord.total_amount - selectedRecord.actual_amount }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selectedRecord.items && selectedRecord.items.length > 0">
            <h4>商品明细</h4>
            <div class="detail-actions" style="margin-bottom: 16px; text-align: right;">
              <button @click="printCurrentRecord" class="print-btn">打印销售单</button>
            </div>
            <div class="items-table-container">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>商品名称</th>
                    <th>详细信息</th>
                    <th>类别</th>
                    <th>数量</th>
                    <th>单价</th>
                    <th>优惠价</th>
                    <th>小计</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in selectedRecord.items" :key="index" class="item-row">
                    <td class="product-name">{{ item.product_name }}</td>
                    <td class="item-details">
                      <div v-if="item.category === 'lens'">
                        <div v-if="item.detail?.sphere !== undefined">球镜: {{ Number(item.detail.sphere).toFixed(2) }}D</div>
                        <div v-if="item.detail?.cylinder !== undefined">柱镜: {{ Number(item.detail.cylinder).toFixed(2) }}D</div>
                        <div v-if="item.detail?.axis !== undefined">轴位: {{ item.detail.axis }}°</div>
                        <div v-if="item.detail?.eye !== undefined">眼别: {{ getEyeName(item.detail.eye) }}</div>
                      </div>
                      <div v-else-if="item.category === 'frame'">
                        <div v-if="item.detail?.model">型号: {{ item.detail.model }}</div>
                        <div v-if="item.detail?.material">材质: {{ getMaterialName(item.detail.material) }}</div>
                      </div>
                      <div v-else-if="item.category === 'soft_contact'">
                        <div v-if="item.detail?.type">类型: {{ getSoftContactTypeName(item.detail.type) }}</div>
                        <div v-if="item.detail?.sphere !== undefined">球镜: {{ Number(item.detail.sphere).toFixed(2) }}D</div>
                        <div v-if="item.detail?.cylinder !== undefined">柱镜: {{ Number(item.detail.cylinder).toFixed(2) }}D</div>
                        <div v-if="item.detail?.axis !== undefined">轴位: {{ item.detail.axis }}°</div>
                        <div v-if="item.detail?.eye !== undefined">眼别: {{ getEyeName(item.detail.eye) }}</div>
                        <div v-if="item.detail?.batch_number">批号: {{ item.detail.batch_number }}</div>
                        <div v-if="item.detail?.expiry_date">有效期: {{ formatDate(item.detail.expiry_date) }}</div>
                      </div>
                      <div v-else-if="item.category === 'solution'">
                        <div v-if="item.detail?.type">类型: {{ getSolutionTypeName(item.detail.type) }}</div>
                        <div v-if="item.detail?.specification">规格: {{ getSpecName(item.detail.specification) }}</div>
                        <div v-if="item.detail?.unit">单位: {{ getUnitName(item.detail.unit) }}</div>
                        <div v-if="item.detail?.batch_number">批号: {{ item.detail.batch_number }}</div>
                        <div v-if="item.detail?.expiry_date">有效期: {{ formatDate(item.detail.expiry_date) }}</div>
                      </div>
                      <div v-else>
                        <div v-if="item.detail?.specification">规格: {{ getSpecName(item.detail.specification) }}</div>
                        <div v-if="item.detail?.unit">单位: {{ getUnitName(item.detail.unit) }}</div>
                        <div v-if="item.detail?.batch_number">批号: {{ item.detail.batch_number }}</div>
                        <div v-if="item.detail?.expiry_date">有效期: {{ formatDate(item.detail.expiry_date) }}</div>
                        <div v-if="item.detail?.model">型号: {{ item.detail.model }}</div>
                        <div v-if="item.detail?.material">材质: {{ getMaterialName(item.detail.material) }}</div>
                        <div v-if="item.detail?.sphere">球镜: {{ Number(item.detail.sphere).toFixed(2) }}D</div>
                        <div v-if="item.detail?.cylinder">柱镜: {{ Number(item.detail.cylinder).toFixed(2) }}D</div>
                        <div v-if="item.detail?.axis">轴位: {{ item.detail.axis }}°</div>
                        <div v-if="item.detail?.eye">眼别: {{ getEyeName(item.detail.eye) }}</div>
                      </div>
                    </td>
                    <td>
                      <span class="category-tag" :class="getCategoryColor(item.category)">
                        {{ getCategoryName(item.category) }}
                      </span>
                    </td>
                    <td class="quantity">{{ item.quantity }}</td>
                    <td class="price">¥{{ item.sale_price }}</td>
                    <td class="discounted-price">¥{{ getDiscountedUnitPrice(item) }}</td>
                    <td class="subtotal">¥{{ item.total_price }}</td>
                    <td class="remark">{{ item.remark || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 打印销售单模态框 -->
    <PrintSalesOrder
      v-model:visible="printModalVisible"
      :sales-data="printSalesData"
      @close="handlePrintModalClose"
    />
    
    <!-- 选择打印条目模态框 -->
    <a-modal
      v-model:open="selectPrintItemsModalVisible"
      title="选择要打印的销售条目"
      width="1000px"
      :footer="null"
      class="select-print-modal"
    >
      <div class="select-print-content">
        <div class="print-info">
          <h3>消费信息</h3>
          <div class="info-summary">
            <p><strong>消费日期：</strong>{{ formatDate(selectedRecord?.sale_date) }}</p>
            <p><strong>总金额：</strong>¥{{ selectedRecord?.total_amount?.toFixed(2) }}</p>
            <p><strong>消费项目数：</strong>{{ selectedRecord?.item_count }} 项</p>
          </div>
        </div>
        
        <div class="select-items">
          <div class="select-header">
            <h3>选择要打印的条目</h3>
            <div class="select-actions">
              <a-button size="small" @click="selectAllItems">全选</a-button>
              <a-button size="small" @click="deselectAllItems">取消全选</a-button>
            </div>
          </div>
          
          <a-table
            :columns="selectPrintColumns"
            :data-source="selectedRecord?.items || []"
            :pagination="false"
            :row-selection="{
              selectedRowKeys: selectedPrintItems,
              onChange: handlePrintItemsChange,
              getCheckboxProps: (record) => ({
                disabled: false
              })
            }"
            size="small"
            :row-key="(record, index) => record.id || `item_${index}`"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'sale_price'">
                <span class="price">¥{{ record.sale_price?.toFixed(2) || '-' }}</span>
              </template>
              <template v-if="column.key === 'total_price'">
                <span class="price">¥{{ (record.total_price || record.sale_price * (record.quantity || 1) || 0).toFixed(2) }}</span>
              </template>
              <template v-if="column.key === 'category'">
                <a-tag :color="getCategoryColor(record.category)">
                  {{ 
                    record.category === 'lens' ? '镜片' :
                    record.category === 'frame' ? '镜架' :
                    record.category === 'soft_contact' ? '隐形眼镜' :
                    record.category === 'solution' ? '护理液/药品' :
                    record.category === 'non_medical' ? '非医疗用品' :
                    record.category === 'service' ? '服务' : record.category || '-'
                  }}
                </a-tag>
              </template>
              <template v-if="column.key === 'details'">
                <div class="detail-info">
                  <div v-if="record.category === 'lens'">
                    <div v-if="record.sphere !== undefined">球镜: {{ Number(record.sphere).toFixed(2) }}D</div>
                    <div v-if="record.cylinder !== undefined">柱镜: {{ Number(record.cylinder).toFixed(2) }}D</div>
                    <div v-if="record.axis !== undefined">轴位: {{ record.axis }}°</div>
                    <div v-if="record.eye">眼别: {{ record.eye === 'left' ? '左眼' : '右眼' }}</div>
                  </div>
                  <div v-else-if="record.category === 'frame'">
                    <div v-if="record.model">型号: {{ record.model }}</div>
                    <div v-if="record.material">材质: {{ record.material }}</div>
                  </div>
                  <div v-else-if="record.category === 'soft_contact'">
                    <div v-if="record.type">类型: {{ record.type }}</div>
                    <div v-if="record.sphere !== undefined">球镜: {{ Number(record.sphere).toFixed(2) }}D</div>
                    <div v-if="record.cylinder !== undefined && record.cylinder !== 0">柱镜: {{ Number(record.cylinder).toFixed(2) }}D</div>
                    <div v-if="record.batch_number">批号: {{ record.batch_number }}</div>
                  </div>
                  <div v-else-if="record.category === 'solution'">
                    <div v-if="record.specification">规格: {{ record.specification }}</div>
                    <div v-if="record.unit">单位: {{ record.unit }}</div>
                    <div v-if="record.batch_number">批号: {{ record.batch_number }}</div>
                  </div>
                  <div v-else-if="record.category === 'non_medical'">
                    <div v-if="record.production_date">生产日期: {{ record.production_date }}</div>
                    <div v-if="record.expiry_date">到期日期: {{ record.expiry_date }}</div>
                  </div>
                  <div v-else-if="record.category === 'service'">
                    <div v-if="record.remark">备注: {{ record.remark }}</div>
                  </div>
                  <div v-else>
                    <div v-if="record.product_supplier">供应商: {{ record.product_supplier }}</div>
                    <div v-if="record.current_stock !== undefined">库存: {{ record.current_stock }}</div>
                  </div>
                </div>
              </template>
              <template v-if="column.key === 'discount'">
                <a-tag :color="getDiscountColor(record)">
                  {{ calculateDiscount(record) }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </div>
        
        <div class="print-summary">
          <div class="summary-info">
            <p><strong>已选择：</strong>{{ selectedPrintItems.length }} 项</p>
            <p><strong>选择金额：</strong>¥{{ calculateSelectedAmount().toFixed(2) }}</p>
          </div>
        </div>
        
        <div class="select-print-actions">
          <a-button @click="handleSelectPrintCancel">取消</a-button>
          <a-button 
            type="primary" 
            @click="handleSelectPrintConfirm"
            :disabled="selectedPrintItems.length === 0"
          >
            确认打印 ({{ selectedPrintItems.length }}项)
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, watchEffect, h, nextTick, computed } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/zh-cn';
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN';
import { CloseOutlined } from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import PrintSalesOrder from '../components/PrintSalesOrder.vue';

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');
// 启用 UTC 和时区插件
dayjs.extend(utc);
dayjs.extend(timezone);

// 定义props
const props = defineProps({
  salesRecord: {
    type: Object,
    required: true
  }
});

// 定义emit
const emit = defineEmits(['open-new-tab']);

// 获取当前标签页ID
const getCurrentTabId = () => {
  const tabs = document.querySelectorAll('.ant-tabs-tab');
  const activeTab = Array.from(tabs).find(tab => tab.classList.contains('ant-tabs-tab-active'));
  return activeTab?.getAttribute('data-key');
};

// 初始化销售数据
const initSalesData = () => {
  const tabId = getCurrentTabId();
  if (tabId) {
    const data = sessionStorage.getItem(`sales_${tabId}`);
    if (data) {
      return JSON.parse(data);
    }
  }
  return {
    patientInfo: props.salesRecord || {},
  salesItems: [],
  totalAmount: 0,
    createTime: new Date().toISOString()
  };
};

const salesData = ref(initSalesData());

// 计算年龄
const calculateAge = (birthday) => {
  if (!birthday) return '未知';
  const birthDate = dayjs(birthday);
  const today = dayjs();
  return today.diff(birthDate, 'year');
};

// 处理开单
const handleNewSales = () => {
  const payload = {
    key: 'sales',
    title: `销售开单-${salesData.value.patientInfo.name}`,
    salesRecord: salesData.value.patientInfo
  };
  console.log('准备打开新的销售开单页面:', payload);
  emit('open-new-tab', payload);
};

// 保存数据到sessionStorage
const saveSalesData = () => {
  const tabId = getCurrentTabId();
  if (tabId) {
    sessionStorage.setItem(`sales_${tabId}`, JSON.stringify(salesData.value));
  }
};

// 组件挂载时加载数据
onMounted(() => {
  console.log('PatientSales组件接收到的props:', props);
  console.log('PatientSales组件初始化数据:', salesData.value);
  
  // 初始化日期
  initDates();
  
  // 获取历史消费记录
  fetchSaleHistory();
  
  // 检查并初始化镜片数据
  const lensData = localStorage.getItem('lensdata');
  if (!lensData) {
    // 如果数据不存在，设置初始数据
    const initialLensData = [
      {
        "id": 1,
        "productid": 1,
        "name": "星趣控膜岩",
        "sphere": -2,
        "cylinder": -0.5,
        "currentStock": 4,
        "salePrice": 1200,
        "createdAt": "2025-05-22T08:44:49Z",
        "updatedAt": "2025-05-22T12:27:42Z",
        "organization": 1
      }
      // ... 其他数据
    ];
    localStorage.setItem('lensdata', JSON.stringify(initialLensData));
  }
  
  // 消费统计已移至新的统计区域，不再需要单独初始化
});

// 组件卸载前保存数据
onBeforeUnmount(() => {
  saveSalesData();
});

// 监听数据变化，自动保存
watch(salesData, () => {
  saveSalesData();
  console.log('销售数据已更新:', salesData.value);
}, { deep: true });

// 模态框相关
const salesModalVisible = ref(false);
const salesItems = ref([]);
const actualAmount = ref(0);
const receivableAmount = ref(0);

// 收款方式相关
const paymentMethods = ref({
  cash_amount: 0,
  alipay_amount: 0,
  wechat_amount: 0,
  bank_amount: 0,
  other_amount: 0,
  meituan_amount: 0,
  douyin_amount: 0
});

// 经办人和备注
const operator = ref('');
const remark = ref('');

// 计算总收款金额
const calculateTotalPayment = () => {
  return Object.values(paymentMethods.value).reduce((sum, amount) => sum + (amount || 0), 0);
};

// 处理收款方式变更
const handlePaymentMethodChange = () => {
  const totalPayment = calculateTotalPayment();
  actualAmount.value = totalPayment;
  isManualActualChange.value = true;
};

// 从localStorage获取产品数据
const getProductData = () => {
  const data = localStorage.getItem('ProductModaldata');
  return data ? JSON.parse(data) : [];
};

// 修改表格列定义
const salesItemColumns = [
  { title: '类别', dataIndex: 'category', key: 'category', width: 120 },
  { title: '项目', dataIndex: 'item', key: 'item', width: 200 },
  { title: '明细', dataIndex: 'details', key: 'details', width: 400 },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
  { title: '库存', dataIndex: 'stock', key: 'stock', width: 80 },
  { title: '单价', dataIndex: 'price', key: 'price', width: 100 },
  { title: '折扣', dataIndex: 'discount', key: 'discount', width: 100 },
  { title: '小计', dataIndex: 'subtotal', key: 'subtotal', width: 120 },
  { title: '操作', key: 'action', width: 80 }
];

// 获取镜架数据
const getFrameData = () => {
  const data = localStorage.getItem('framedata');
  return data ? JSON.parse(data) : [];
};

// 获取镜架型号选项
const getFrameModelOptions = (productId) => {
  const frameData = getFrameData();
  return frameData
    .filter(item => item.productid === productId)
    .map(item => ({
      label: item.model,
      value: item.model,
      material: item.material,
      price: item.salePrice,
      stock: item.currentStock
    }));
};

// 获取材质中文名称
const getMaterialName = (material) => {
  const materialMap = {
    'titanium': '钛',
    'alloy': '合金',
    'tr': 'TR',
    'metal': '金属',
    'plastic': '塑料',
    'carbon': '碳纤维'
  };
  return materialMap[material] || material;
};

// 获取镜架材质选项
const getFrameMaterialOptions = (productId, model) => {
  const frameData = getFrameData();
  return frameData
    .filter(item => item.productid === productId && item.model === model)
    .map(item => ({
      label: getMaterialName(item.material), // 使用中文显示
      value: item.material, // 保持英文值用于存储
      price: item.salePrice,
      stock: item.currentStock
    }));
};

// 添加销售条目
const addSalesItem = () => {
  salesItems.value.push({
    category: undefined,
    itemId: undefined,
    price: 0,
    discount: 1.00, // 默认折扣为1.00（无折扣）
    subtotal: 0, // 初始化小计为0
    sphere: undefined,
    cylinder: 0.00,
    eye: undefined,
    model: undefined,
    material: undefined,
    quantity: 1,  // 默认数量为1
    batchNumber: [] // 批号为数组
  });
};

// 删除销售条目
const removeSalesItem = (index) => {
  salesItems.value.splice(index, 1);
};

// 获取项目选项
const getItemOptions = (category) => {
  const allData = getProductData();
  return allData
    .filter(item => item.category === category)
    .map(item => ({
      label: item.name,
      value: item.id,
      price: item.salePrice
    }));
};

// 处理眼别变更
const handleEyeChange = (value, index) => {
  const currentItem = salesItems.value[index];
  
  // 检查是否已经存在对应的眼别条目
  const hasOppositeEye = salesItems.value.some((item, idx) => 
    idx !== index && 
    item.category === currentItem.category &&
    item.itemId === currentItem.itemId &&
    item.eye === (value === 'left' ? 'right' : 'left')
  );

  // 如果不存在对应的眼别条目，则创建
  if (!hasOppositeEye) {
    const oppositeEye = value === 'left' ? 'right' : 'left';
    const newItem = {
      ...currentItem,
      eye: oppositeEye,
      sphere: undefined,  // 不复制度数
      cylinder: undefined,  // 不复制度数
      axis: undefined,  // 不复制轴位
      subtotal: 0 // 初始化小计为0
    };
    
    // 在当前位置后插入新条目
    salesItems.value.splice(index + 1, 0, newItem);
    
    // 强制更新视图，确保小计显示
    nextTick(() => {
      // 重新计算新条目的小计
      const newIndex = index + 1;
      if (salesItems.value[newIndex]) {
        const item = salesItems.value[newIndex];
        const basePrice = item.price * (item.quantity || 1);
        item.subtotal = Number((basePrice * (item.discount ?? 1)).toFixed(2));
      }
    });
  }
};

// 处理类别变更
const handleCategoryChange = (value, index) => {
  const currentItem = salesItems.value[index];
  currentItem.itemId = undefined;
  currentItem.price = 0;
  
  // 根据类别重置相关字段
  if (value === 'lens') {
    currentItem.sphere = undefined;
    currentItem.cylinder = 0.00;
    currentItem.eye = undefined;
  } else if (value === 'frame') {
    currentItem.model = undefined;
    currentItem.material = undefined;
  } else if (value === 'soft_contact') {
    currentItem.type = undefined;
    currentItem.batchNumber = undefined;
    currentItem.sphere = undefined;
    currentItem.cylinder = 0.00;
  } else if (value === 'solution') {
    currentItem.type = undefined;
    currentItem.specification = undefined;
    currentItem.unit = undefined;
    currentItem.batchNumber = undefined;
  }
  
  // 重置折扣为默认值
  currentItem.discount = 1.00;
  // 重置小计为0
  currentItem.subtotal = 0;
  
  // 如果存在对应的眼别条目，也清空其数据
  const oppositeIndex = salesItems.value.findIndex((item, idx) => 
    idx !== index && 
    item.category === currentItem.category &&
    item.itemId === currentItem.itemId &&
    item.sphere === currentItem.sphere &&
    item.cylinder === currentItem.cylinder
  );
  
      if (oppositeIndex !== -1) {
      const oppositeItem = salesItems.value[oppositeIndex];
      oppositeItem.itemId = undefined;
      oppositeItem.price = 0;
      
      if (value === 'lens') {
        oppositeItem.sphere = undefined;
        oppositeItem.cylinder = 0.00;
        oppositeItem.eye = undefined;
      } else if (value === 'frame') {
        oppositeItem.model = undefined;
        oppositeItem.material = undefined;
      } else if (value === 'soft_contact') {
        oppositeItem.type = undefined;
        oppositeItem.batchNumber = undefined;
        oppositeItem.sphere = undefined;
        oppositeItem.cylinder = 0.00;
      } else if (value === 'solution') {
        oppositeItem.type = undefined;
        oppositeItem.specification = undefined;
        oppositeItem.unit = undefined;
        oppositeItem.batchNumber = undefined;
      }
      
      // 重置折扣为默认值
      oppositeItem.discount = 1.00;
      // 重置小计为0
      oppositeItem.subtotal = 0;
    }
};

// 获取镜片库存
const getLensStock = (record) => {
  if (!record.itemId || record.sphere === undefined) return '-';
  
  // 从localStorage获取数据并确保是数组
  const lensDataStr = localStorage.getItem('lensdata');
  console.log('原始localStorage数据:', lensDataStr);
  
  let lensData = [];
  try {
    lensData = lensDataStr ? JSON.parse(lensDataStr) : [];
  } catch (e) {
    console.error('解析镜片数据失败:', e);
    return '-';
  }
  
  console.log('当前记录:', record);
  console.log('镜片数据:', lensData);
  
  const matchingLens = lensData.find(lens => {
    const match = Number(lens.productid) === Number(record.itemId) && 
                 Number(lens.sphere) === Number(record.sphere) && 
                 Number(lens.cylinder) === Number(record.cylinder);
    if (match) {
      console.log('找到匹配:', lens);
    }
    return match;
  });
  
  console.log('匹配结果:', matchingLens);
  return matchingLens ? matchingLens.currentStock : 0;
};

// 处理球镜度数变更
const handleSphereChange = (value, index) => {
  salesItems.value[index].sphere = value;
  
  // 更新小计
  const item = salesItems.value[index];
  const basePrice = item.price * (item.quantity || 1);
  item.subtotal = Number((basePrice * (item.discount ?? 1)).toFixed(2));
};

// 处理柱镜度数变更
const handleCylinderChange = (value, index) => {
  salesItems.value[index].cylinder = value;
  
  // 更新小计
  const item = salesItems.value[index];
  const basePrice = item.price * (item.quantity || 1);
  item.subtotal = Number((basePrice * (item.discount ?? 1)).toFixed(2));
};

// 处理轴位变更
const handleAxisChange = (value, index) => {
  salesItems.value[index].axis = value;
  
  // 更新小计
  const item = salesItems.value[index];
  const basePrice = item.price * (item.quantity || 1);
  item.subtotal = Number((basePrice * (item.discount ?? 1)).toFixed(2));
};

// 处理项目变更
const handleItemChange = (value, index) => {
  const allData = getProductData();
  const selectedItem = allData.find(item => item.id === value);
  if (selectedItem) {
    salesItems.value[index].price = selectedItem.salePrice;
    salesItems.value[index].itemId = Number(value);
    
    // 根据新价格自动更新小计
    const item = salesItems.value[index];
    const basePrice = selectedItem.salePrice * (item.quantity || 1);
    item.subtotal = Number((basePrice * (item.discount ?? 1)).toFixed(2));
    
    // 如果是镜架，清空型号和材质
    if (selectedItem.category === 'frame') {
      salesItems.value[index].model = undefined;
      salesItems.value[index].material = undefined;
    }
    
    // 如果是护理液，清空之前的字段信息并检查并自动填充唯一选项
    if (selectedItem.category === 'solution') {
      // 清空之前的字段信息
      salesItems.value[index].type = undefined;
      salesItems.value[index].specification = undefined;
      salesItems.value[index].unit = undefined;
      salesItems.value[index].batchNumber = undefined;
      
      const typeOptions = getSolutionTypeOptions(Number(value));
      if (typeOptions.isSingle) {
        const type = typeOptions.options[0].value;
        salesItems.value[index].type = type;
        
        const specOptions = getSolutionSpecOptions(Number(value), type);
        if (specOptions.isSingle) {
          const spec = specOptions.options[0].value;
          salesItems.value[index].specification = spec;
          
          const unitOptions = getSolutionUnitOptions(Number(value), type, spec);
          if (unitOptions.isSingle) {
            const unit = unitOptions.options[0].value;
            salesItems.value[index].unit = unit;
          }
        }
      }
    }
    
    // 如果是非医疗产品，不强制自动填充日期，让用户自己选择
    if (selectedItem.category === 'non_medical') {
      // 清空之前的日期信息，让用户重新选择
      salesItems.value[index].productionDate = undefined;
      salesItems.value[index].expiryDate = undefined;
    }
    
    // 如果存在对应的眼别条目，也更新其项目信息
    const currentItem = salesItems.value[index];
    const oppositeIndex = salesItems.value.findIndex((item, idx) => 
      idx !== index && 
      item.category === currentItem.category &&
      item.sphere === currentItem.sphere &&
      item.cylinder === currentItem.cylinder &&
      ((currentItem.eye === 'left' && item.eye === 'right') || 
       (currentItem.eye === 'right' && item.eye === 'left'))
    );
    
    if (oppositeIndex !== -1) {
      salesItems.value[oppositeIndex].price = selectedItem.salePrice;
      salesItems.value[oppositeIndex].itemId = Number(value);
      
      // 更新对应条目的小计
      const oppositeItem = salesItems.value[oppositeIndex];
      const basePrice = selectedItem.salePrice * (oppositeItem.quantity || 1);
      oppositeItem.subtotal = Number((basePrice * (oppositeItem.discount ?? 1)).toFixed(2));
      
      if (selectedItem.category === 'frame') {
        salesItems.value[oppositeIndex].model = undefined;
        salesItems.value[oppositeIndex].material = undefined;
      }
    }
  }
};

// 处理型号变更
const handleModelChange = (value, index) => {
  salesItems.value[index].model = value;
  salesItems.value[index].material = undefined; // 清空材质
  // 如果输入的是新型号，更新价格
  if (value && !getFrameModelOptions(salesItems.value[index].itemId).some(opt => opt.value === value)) {
    salesItems.value[index].price = 0; // 新型号默认价格为0
  }
};

// 处理材质变更
const handleMaterialChange = (value, index) => {
  const frameData = getFrameData();
  const selectedFrame = frameData.find(item => 
    item.productid === salesItems.value[index].itemId && 
    item.model === salesItems.value[index].model && 
    item.material === value
  );
  
  if (selectedFrame) {
    salesItems.value[index].material = value;
    salesItems.value[index].price = selectedFrame.salePrice;
    
    // 根据新价格自动更新小计
    const item = salesItems.value[index];
    const basePrice = selectedFrame.salePrice * (item.quantity || 1);
    item.subtotal = Number((basePrice * (item.discount ?? 1)).toFixed(2));
    
    // 如果存在对应的眼别条目，也更新其价格和小计
    const currentItem = salesItems.value[index];
    const oppositeIndex = salesItems.value.findIndex((oppositeItem, idx) => 
      idx !== index && 
      oppositeItem.category === currentItem.category &&
      oppositeItem.itemId === currentItem.itemId &&
      oppositeItem.model === currentItem.model &&
      oppositeItem.material === currentItem.material
    );
    
    if (oppositeIndex !== -1) {
      salesItems.value[oppositeIndex].price = selectedFrame.salePrice;
      const oppositeItem = salesItems.value[oppositeIndex];
      const oppositeBasePrice = selectedFrame.salePrice * (oppositeItem.quantity || 1);
      oppositeItem.subtotal = Number((oppositeBasePrice * (oppositeItem.discount ?? 1)).toFixed(2));
    }
  }
};

// 计算总金额（折后总价）
const calculateTotalAmount = () => {
  return salesItems.value.reduce((sum, item) => {
    // 使用subtotal字段，如果不存在则按原逻辑计算
    const itemTotal = item.subtotal || (item.price * (item.quantity || 1) * (item.discount ?? 1));
    return sum + itemTotal;
  }, 0);
};

// 计算欠款金额
const calculateDebtAmount = () => {
  return receivableAmount.value - actualAmount.value;
};

// 显示开单模态框
const showSalesModal = () => {
  salesModalVisible.value = true;
  // 重置手动修改标记
  isManualActualChange.value = false;
  // 初始化应收金额为总金额，实收金额为0
  const total = calculateTotalAmount();
  receivableAmount.value = total;
  actualAmount.value = 0;
  // 重置收款方式
  paymentMethods.value = {
    cash_amount: 0,
    alipay_amount: 0,
    wechat_amount: 0,
    bank_amount: 0,
    other_amount: 0,
    meituan_amount: 0,
    douyin_amount: 0
  };
  // 重置经办人和备注
  operator.value = '';
  remark.value = '';
};

// 检查条目是否存在于库存缓存
function findStockInCache(item) {
  if (item.category === 'lens') {
    const lensData = JSON.parse(localStorage.getItem('lensdata') || '[]');
    const found = lensData.find(lens =>
      lens.productid === item.itemId &&
      Number(lens.sphere) === Number(item.sphere) &&
      Number(lens.cylinder) === Number(item.cylinder)
    );
    console.log(`查找镜片库存: itemId=${item.itemId}, sphere=${item.sphere}, cylinder=${item.cylinder}, 找到:`, found);
    return found;
  } else if (item.category === 'frame') {
    const frameData = JSON.parse(localStorage.getItem('framedata') || '[]');
    const found = frameData.find(frame =>
      frame.productid === item.itemId &&
      frame.model === item.model &&
      frame.material === item.material
    );
    console.log(`查找镜架库存: itemId=${item.itemId}, model=${item.model}, material=${item.material}, 找到:`, found);
    return found;
  } else if (item.category === 'solution') {
    const solutionData = JSON.parse(localStorage.getItem('solutiondata') || '[]');
    const found = solutionData.find(sol =>
      sol.productid === item.itemId &&
      sol.type === item.type &&
      sol.specification === item.specification &&
      sol.unit === item.unit &&
      sol.batchNumber === (Array.isArray(item.batchNumber) ? item.batchNumber[0] : item.batchNumber)
    );
    console.log(`查找护理液库存: itemId=${item.itemId}, type=${item.type}, spec=${item.specification}, unit=${item.unit}, batch=${item.batchNumber}, 找到:`, found);
    return found;
  } else if (item.category === 'soft_contact') {
    const softContactData = JSON.parse(localStorage.getItem('softcontactdata') || '[]');
    const found = softContactData.find(soft =>
      soft.productid === item.itemId &&
      soft.type === item.type &&
      Number(soft.sphere) === Number(item.sphere) &&
      soft.batchNumber === (Array.isArray(item.batchNumber) ? item.batchNumber[0] : item.batchNumber)
    );
    console.log(`查找隐形眼镜库存: itemId=${item.itemId}, type=${item.type}, sphere=${item.sphere}, batch=${item.batchNumber}, 找到:`, found);
    return found;
  } else if (item.category === 'non_medical') {
    const accessoryData = JSON.parse(localStorage.getItem('accessorydata') || '[]');
    const found = accessoryData.find(acc =>
      acc.productid === item.itemId &&
      // 如果日期为空，则匹配空日期；如果日期不为空，则精确匹配
      (item.productionDate === undefined || item.productionDate === null || item.productionDate === '' ? 
        (acc.productionDate === undefined || acc.productionDate === null || acc.productionDate === '') : 
        acc.productionDate === item.productionDate) &&
      (item.expiryDate === undefined || item.expiryDate === null || item.expiryDate === '' ? 
        (acc.expiryDate === undefined || acc.expiryDate === null || acc.expiryDate === '') : 
        acc.expiryDate === item.expiryDate)
    );
    console.log(`查找非医疗用品库存: itemId=${item.itemId}, prodDate=${item.productionDate}, expDate=${item.expiryDate}, 找到:`, found);
    return found;
  }
  return null;
}

// 新增库存条目（根据类型调用不同接口）
async function createStockEntry(item) {
  const organization_id = localStorage.getItem('organization_id');
  const username = localStorage.getItem('username') || 'admin';
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  if (item.category === 'lens') {
    // 镜片
    return await fetch('https://aiforoptometry.com/lensinventory/add/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken')
      },
      body: JSON.stringify({
        organization_id,
        product_id: item.itemId,
        sphere: Number(Number(item.sphere).toFixed(2)),
        cylinder: Number(Number(item.cylinder).toFixed(2)),
        current_stock: 0,
        created_at: now,
        updated_at: now
      }),
      credentials: 'include'
    });
  } else if (item.category === 'frame') {
    // 镜架
    return await fetch('https://aiforoptometry.com/inventory/add/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken')
      },
      body: JSON.stringify({
        organization_id,
        product_id: item.itemId,
        model: item.model,
        material: item.material,
        current_stock: 0,
        operator: username,
        created_at: now,
        updated_at: now
      }),
      credentials: 'include'
    });
  } else if (item.category === 'solution') {
    // 护理液/药品
    return await fetch('https://aiforoptometry.com/inventory/solution/add/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken')
      },
      body: JSON.stringify({
        organization_id,
        product_id: item.itemId,
        type: item.type,
        specification: item.specification,
        unit: item.unit,
        production_date: item.productionDate,
        expiry_date: item.expiryDate,
        batch_number: Array.isArray(item.batchNumber) ? item.batchNumber[0] : item.batchNumber,
        current_stock: 0,
        operator: username,
        created_at: now,
        updated_at: now
      }),
      credentials: 'include'
    });
  } else if (item.category === 'soft_contact') {
    // 软镜
    return await fetch('https://aiforoptometry.com/inventory/soft_contact/add/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken')
      },
      body: JSON.stringify({
        organization_id,
        product_id: item.itemId,
        type: item.type,
        sphere: Number(Number(item.sphere).toFixed(2)),
        batch_number: Array.isArray(item.batchNumber) ? item.batchNumber[0] : item.batchNumber,
        current_stock: 0,
        operator: username,
        created_at: now,
        updated_at: now
      }),
      credentials: 'include'
    });
  } else if (item.category === 'non_medical') {
    // 非医疗
    return await fetch('https://aiforoptometry.com/inventory/accessory/add/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken')
      },
      body: JSON.stringify({
        organization_id,
        product_id: item.itemId,
        production_date: item.productionDate,
        expiry_date: item.expiryDate,
        current_stock: 0,
        operator: username,
        created_at: now,
        updated_at: now
      }),
      credentials: 'include'
    });
  }
}

// 刷新所有缓存
async function refreshAllCache() {
  // 这里只能简单地重新拉取页面（或调用各自的fetchXXXData），实际项目可优化
  // 这里只刷新页面用到的缓存
}

// 主提交逻辑
const handleSalesModalOk = async () => {
  console.log('点击了确定按钮');
  console.log('当前所有消费条目:', salesItems.value);
  
  // 详细检查每个条目
  const validationResults = salesItems.value.map((item, index) => {
    const issues = [];
    
    // 检查类别
    if (!item.category) {
      issues.push('类别未选择');
    }
    
    // 检查项目ID
    if (!item.itemId) {
      issues.push('项目未选择');
    }
    
    // 检查价格
    if (!item.price || item.price <= 0) {
      issues.push('价格无效或为0');
    }
    
    // 根据类别检查特定字段
    if (item.category === 'lens') {
      if (item.sphere === undefined || item.sphere === null) {
        issues.push('镜片球镜度数未填写');
      }
      if (!item.eye) {
        issues.push('镜片眼别未选择');
      }
    } else if (item.category === 'frame') {
      if (!item.model) {
        issues.push('镜架型号未选择');
      }
      if (!item.material) {
        issues.push('镜架材质未选择');
      }
    } else if (item.category === 'soft_contact') {
      if (!item.type) {
        issues.push('隐形眼镜类型未选择');
      }
      if (item.sphere === undefined || item.sphere === null) {
        issues.push('隐形眼镜球镜度数未填写');
      }
      if (!item.batchNumber || (Array.isArray(item.batchNumber) && item.batchNumber.length === 0)) {
        issues.push('隐形眼镜批号未选择');
      }
    } else if (item.category === 'solution') {
      if (!item.type) {
        issues.push('护理液类型未选择');
      }
      if (!item.specification) {
        issues.push('护理液规格未选择');
      }
      if (!item.unit) {
        issues.push('护理液单位未选择');
      }
      if (!item.batchNumber || (Array.isArray(item.batchNumber) && item.batchNumber.length === 0)) {
        issues.push('护理液批号未选择');
      }
    } else if (item.category === 'non_medical') {
      // 非医疗用品日期允许为空，不强制要求填写
      // const dateOptions = getAccessoryDateOptions(item.itemId);
      // if (dateOptions.hasDates && (!item.productionDate || !item.expiryDate)) {
      //   issues.push('非医疗用品日期信息未选择');
      // }
    } else if (item.category === 'service') {
      // 服务备注可以不写，传空值
      // if (!item.remark || item.remark.trim() === '') {
      //   issues.push('服务备注未填写');
      // }
    }
    
    return {
      index: index + 1,
      category: item.category || '未选择',
      itemName: getProductName(item),
      issues: issues,
      itemData: item
    };
  });
  
  // 过滤出有问题的条目
  const emptyItems = validationResults.filter(result => result.issues.length > 0);
  
  if (emptyItems.length > 0) {
    console.error('发现以下未完善的消费条目:');
    emptyItems.forEach(item => {
      console.error(`条目 ${item.index}: ${item.category} - ${item.itemName}`);
      console.error(`  问题: ${item.issues.join(', ')}`);
      console.error(`  详细信息:`, item.itemData);
    });
    
    // 显示具体的错误信息
    const errorMessages = emptyItems.map(item => 
      `条目${item.index}(${item.category}): ${item.issues.join(', ')}`
    ).join('; ');
    
    message.error(`请完善以下消费条目信息: ${errorMessages}`);
    return;
  }
  
  console.log('所有消费条目验证通过，开始提交...');

  // 添加更多调试信息
  console.log('=== 消费条目详细信息 ===');
  salesItems.value.forEach((item, index) => {
    console.log(`条目 ${index + 1}:`, {
      类别: item.category,
      项目ID: item.itemId,
      项目名称: getProductName(item),
      价格: item.price,
      数量: item.quantity,
      折扣: item.discount,
      小计: item.subtotal,
      球镜: item.sphere,
      柱镜: item.cylinder,
      轴位: item.axis,
      眼别: item.eye,
      型号: item.model,
      材质: item.material,
      类型: item.type,
      批号: item.batchNumber,
      规格: item.specification,
      单位: item.unit,
      生产日期: item.productionDate,
      到期日期: item.expiryDate,
      备注: item.remark
    });
  });
  console.log('=== 调试信息结束 ===');

  // 1. 检查所有非服务类销售条目是否都能在缓存中找到
  const missingItems = salesItems.value.filter(item => 
    item.category !== 'service' && !findStockInCache(item)
  );
  if (missingItems.length > 0) {
    Modal.confirm({
      title: '发现未录入库存的商品',
      content: '有商品未录入库存，是否现在创建库存条目？',
      okText: '是，立即创建',
      cancelText: '否，返回',
      onOk: async () => {
        try {
          // 创建所有缺失的库存条目
          for (const item of missingItems) {
            const response = await createStockEntry(item);
            if (!response) {
              throw new Error('创建库存记录失败：未收到响应');
            }
            const result = await response.json();
            
            // 根据返回结果更新对应的缓存
            if (result.code === 200) {
              if (item.category === 'lens') {
                // 更新镜片缓存
                const lensData = JSON.parse(localStorage.getItem('lensdata') || '[]');
                lensData.push({
                  id: result.data.id,
                  productid: result.data.product,
                  name: result.data.name,
                  sphere: Number(result.data.sphere), // 转换为数字类型
                  cylinder: Number(result.data.cylinder), // 转换为数字类型
                  currentStock: result.data.current_stock,
                  salePrice: Number(result.data.salePrice), // 转换为数字类型
                  createdAt: result.data.created_at,
                  updatedAt: result.data.updated_at,
                  organization: result.data.organization
                });
                localStorage.setItem('lensdata', JSON.stringify(lensData));
                console.log('镜片缓存已更新:', lensData);
              } else if (item.category === 'frame') {
                // 更新镜架缓存
                const frameData = JSON.parse(localStorage.getItem('framedata') || '[]');
                frameData.push({
                  id: result.data.id,
                  productid: result.data.product,
                  name: result.data.name,
                  model: result.data.model,
                  material: result.data.material,
                  currentStock: result.data.current_stock,
                  salePrice: Number(result.data.salePrice), // 转换为数字类型
                  createdAt: result.data.created_at,
                  updatedAt: result.data.updated_at,
                  organization: result.data.organization
                });
                localStorage.setItem('framedata', JSON.stringify(frameData));
                console.log('镜架缓存已更新:', frameData);
              } else if (item.category === 'soft_contact') {
                // 更新隐形眼镜缓存
                const softContactData = JSON.parse(localStorage.getItem('softcontactdata') || '[]');
                softContactData.push({
                  id: result.data.id,
                  productid: result.data.product,
                  name: result.data.name,
                  type: result.data.type,
                  sphere: Number(result.data.sphere), // 转换为数字类型
                  batchNumber: result.data.batch_number,
                  currentStock: result.data.current_stock,
                  salePrice: Number(result.data.salePrice), // 转换为数字类型
                  createdAt: result.data.created_at,
                  updatedAt: result.data.updated_at,
                  organization: result.data.organization
                });
                localStorage.setItem('softcontactdata', JSON.stringify(softContactData));
                console.log('隐形眼镜缓存已更新:', softContactData);
              } else if (item.category === 'solution') {
                // 更新护理液缓存
                const solutionData = JSON.parse(localStorage.getItem('solutiondata') || '[]');
                solutionData.push({
                  id: result.data.id,
                  productid: result.data.product,
                  name: result.data.name,
                  type: result.data.type,
                  specification: result.data.specification,
                  unit: result.data.unit,
                  batchNumber: result.data.batch_number,
                  currentStock: result.data.current_stock,
                  salePrice: Number(result.data.salePrice), // 转换为数字类型
                  createdAt: result.data.created_at,
                  updatedAt: result.data.updated_at,
                  organization: result.data.organization
                });
                localStorage.setItem('solutiondata', JSON.stringify(solutionData));
                console.log('护理液缓存已更新:', solutionData);
              } else if (item.category === 'non_medical') {
                // 更新非医疗用品缓存
                const accessoryData = JSON.parse(localStorage.getItem('accessorydata') || '[]');
                accessoryData.push({
                  id: result.data.id,
                  productid: result.data.product,
                  name: result.data.name,
                  productionDate: result.data.production_date,
                  expiryDate: result.data.expiry_date,
                  currentStock: result.data.current_stock,
                  salePrice: Number(result.data.salePrice), // 转换为数字类型
                  createdAt: result.data.created_at,
                  updatedAt: result.data.updated_at,
                  organization: result.data.organization
                });
                localStorage.setItem('accessorydata', JSON.stringify(accessoryData));
                console.log('非医疗用品缓存已更新:', accessoryData);
              }
            } else {
              console.error('创建库存条目失败:', result);
              throw new Error(result.message || '创建库存条目失败');
            }
          }
          
          message.success('已自动创建库存条目，正在重新提交...');
          
          // 强制刷新缓存并重新检查
          console.log('强制刷新缓存检查...');
          
          // 添加一个小延迟确保缓存更新完成
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 重新检查是否所有非服务类商品都有库存
          const stillMissingItems = salesItems.value.filter(item => {
            if (item.category === 'service') return false;
            const found = findStockInCache(item);
            console.log(`检查商品 ${item.category} - ${item.itemId}:`, found ? '找到' : '未找到', found);
            return !found;
          });
          
          if (stillMissingItems.length === 0) {
            // 如果所有商品都有库存了，继续提交销售单
            console.log('所有商品都已找到库存，开始提交销售单...');
            await submitSalesOrder();
          } else {
            console.error('仍有商品未找到库存:', stillMissingItems);
            // 显示更详细的错误信息
            const missingDetails = stillMissingItems.map(item => 
              `${item.category}: ${item.itemId} (球镜:${item.sphere}, 柱镜:${item.cylinder})`
            ).join(', ');
            message.error(`部分商品仍未成功创建库存: ${missingDetails}，请刷新页面后重试`);
          }
        } catch (error) {
          message.error('创建库存条目失败：' + error.message);
        }
      },
      onCancel: () => {
        message.info('请先补录库存后再提交销售单');
      }
    });
    return;
  }

  // 2. 全部有库存，直接提交
  await submitSalesOrder();
};

// 提取提交销售单的逻辑为单独的函数
const submitSalesOrder = async () => {
  try {
    const organization_id = localStorage.getItem('organization_id');
    const username = localStorage.getItem('username') || '管理员';
    const patient_id = salesData.value.patientInfo.id;

    // 使用模板中绑定的 saleDate，而不是重新定义
    // 确保使用本地时区的日期，避免时区转换导致日期显示为前一天
    const selectedDate = saleDate.value || dayjs();
    // 获取本地时区的年月日字符串，直接使用本地时区避免时区转换问题
    let saleDateStr;
    if (selectedDate && typeof selectedDate.format === 'function') {
      // 使用本地时区的年月日，避免时区转换导致日期显示为前一天
      const year = selectedDate.year();
      const month = String(selectedDate.month() + 1).padStart(2, '0'); // dayjs 的 month 从 0 开始
      const date = String(selectedDate.date()).padStart(2, '0');
      saleDateStr = `${year}-${month}-${date}`;
    } else {
      // 如果不是 dayjs 对象，使用当前日期
      const now = dayjs();
      const year = now.year();
      const month = String(now.month() + 1).padStart(2, '0');
      const date = String(now.date()).padStart(2, '0');
      saleDateStr = `${year}-${month}-${date}`;
    }
    const dateFormat = 'YYYY-MM-DD';

    // 使用用户输入的应收金额和实收金额
    const receivableAmountValue = receivableAmount.value;
    const actualAmountValue = actualAmount.value;

    const items = salesItems.value.map(item => {
      const stock = findStockInCache(item);
      // 直接使用subtotal字段，如果不存在则按原逻辑计算
      const itemTotal = item.subtotal || (item.price * (item.quantity || 1) * (item.discount || 1));
      
      let detail = {};
      if (item.category === 'lens') {
        detail = {
          sphere: item.sphere,
          cylinder: item.cylinder,
          axis: item.axis,
          eye: item.eye
        };
      } else if (item.category === 'frame') {
        detail = {
          model: item.model,
          material: item.material
        };
      } else if (item.category === 'soft_contact') {
        detail = {
          type: item.type,
          sphere: item.sphere,
          batchNumber: Array.isArray(item.batchNumber) ? item.batchNumber[0] : item.batchNumber
        };
        if (item.cylinder && Number(item.cylinder) !== 0) {
          detail.cylinder = item.cylinder;
        }
      } else if (item.category === 'solution') {
        detail = {
          type: item.type,
          specification: item.specification,
          unit: item.unit,
          batchNumber: Array.isArray(item.batchNumber) ? item.batchNumber[0] : item.batchNumber
        };
      } else if (item.category === 'non_medical') {
        detail = {
          productionDate: item.productionDate,
          expiryDate: item.expiryDate
        };
      } else if (item.category === 'service') {
        detail = {
          remark: item.remark
        };
      }
      return {
        id: stock ? stock.id : null,
        product_id: stock ? stock.productid : item.itemId,
        category: item.category,
        quantity: item.quantity || 1,
        sale_price: item.price,
        discount: Number((item.discount ?? 1.00).toFixed(2)), // 添加折扣字段，强制转为2位小数
        total_price: itemTotal, // 添加总价字段
        detail
      };
    });

    // 计算欠款金额
    const debtAmount = receivableAmountValue - actualAmountValue;
    
    // 根据是否有欠款设置状态
    const status = debtAmount > 0 ? '尚有欠款' : '已完成';
    
    const requestData = {
      organization_id: Number(organization_id),
      operator: operator.value || username,
      patient_id,
      sale_date: saleDateStr, // 订单销售日期（使用本地时区，避免时区转换问题）
      total_amount: receivableAmountValue, // 应收金额（发送给后端）
      actual_amount: actualAmountValue, // 实收金额
      debt_amount: debtAmount, // 欠款金额
      status: status, // 状态：尚有欠款/已完成
      remark: remark.value || '', // 备注
      // 收款方式
      cash_amount: paymentMethods.value.cash_amount || 0,
      alipay_amount: paymentMethods.value.alipay_amount || 0,
      wechat_amount: paymentMethods.value.wechat_amount || 0,
      bank_amount: paymentMethods.value.bank_amount || 0,
      other_amount: paymentMethods.value.other_amount || 0,
      meituan_amount: paymentMethods.value.meituan_amount || 0,
      douyin_amount: paymentMethods.value.douyin_amount || 0,
      items
    };

    const response = await fetch('https://aiforoptometry.com/sale/create/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken')
      },
      body: JSON.stringify(requestData),
      credentials: 'include'
    });
    const result = await response.json();
    if (result.code === 200) {
      message.success('销售记录创建成功');
      
      // 保存当前销售数据用于打印
      const currentSalesItems = [...salesItems.value];
      const currentReceivableAmount = receivableAmount.value;
      const currentActualAmount = actualAmount.value;
      const currentTotalAmount = calculateTotalAmount();
      const currentDebtAmount = calculateDebtAmount();
      const currentOperator = operator.value || localStorage.getItem('username') || '管理员';
      const currentRemark = remark.value || '';
      
      // 清空销售模态框数据
      salesModalVisible.value = false;
      salesItems.value = [];
      actualAmount.value = 0;
      receivableAmount.value = 0;
      isManualActualChange.value = false;
      // 清空经办人和备注
      operator.value = '';
      remark.value = '';
      
      // 询问是否打印销售单
      Modal.confirm({
        title: '销售单创建成功',
        content: '是否立即打印销售单？',
        okText: '是，打印',
        cancelText: '否，关闭',
        onOk: () => {
          // 准备打印数据
          printSalesData.value = {
            saleId: result.data?.id || '待生成',
            saleDate: saleDateStr, // 使用本地时区的日期字符串，避免时区转换问题
            operator: currentOperator,
            patientInfo: salesData.value.patientInfo,
            items: currentSalesItems.map(item => {
              return {
                product_name: getProductName(item),
                category: item.category,
                quantity: item.quantity || 1,
                sale_price: item.price,
                total_price: item.price * (item.quantity || 1) * (item.discount ?? 1),
                discount: item.discount ?? 1,
                // 根据类别添加详情字段
                sphere: item.sphere,
                cylinder: item.cylinder,
                axis: item.axis,
                eye: item.eye,
                model: item.model,
                material: item.material,
                type: item.type,
                batch_number: Array.isArray(item.batchNumber) ? item.batchNumber[0] : item.batchNumber,
                specification: item.specification,
                unit: item.unit,
                production_date: item.productionDate,
                expiry_date: item.expiryDate,
                remark: item.remark
              };
            }),
            totalAmount: currentTotalAmount,
            receivableAmount: currentReceivableAmount,
            actualAmount: currentActualAmount,
            debtAmount: currentDebtAmount,
            remark: currentRemark,
            // 收款方式信息
            paymentMethods: {
              cash_amount: paymentMethods.value.cash_amount || 0,
              alipay_amount: paymentMethods.value.alipay_amount || 0,
              wechat_amount: paymentMethods.value.wechat_amount || 0,
              bank_amount: paymentMethods.value.bank_amount || 0,
              other_amount: paymentMethods.value.other_amount || 0,
              meituan_amount: paymentMethods.value.meituan_amount || 0,
              douyin_amount: paymentMethods.value.douyin_amount || 0
            }
          };
          printModalVisible.value = true;
        }
      });
      
      // 重新获取历史消费记录
      await fetchSaleHistory(currentPage.value);
    } else {
      throw new Error(result.message || '创建销售记录失败');
    }
  } catch (error) {
    message.error(error.message || '创建销售记录失败');
  }
};

// 处理模态框取消
const handleSalesModalCancel = () => {
  salesModalVisible.value = false;
  salesItems.value = [];
  actualAmount.value = 0;
  receivableAmount.value = 0;
  isManualActualChange.value = false;
  // 重置收款方式
  paymentMethods.value = {
    cash_amount: 0,
    alipay_amount: 0,
    wechat_amount: 0,
    bank_amount: 0,
    other_amount: 0,
    meituan_amount: 0,
    douyin_amount: 0
  };
  // 重置经办人和备注
  operator.value = '';
  remark.value = '';
};

// 添加获取镜架库存的方法
const getFrameStock = (record) => {
  if (!record.itemId || !record.model || !record.material) return '-';
  
  const frameData = getFrameData();
  const matchingFrame = frameData.find(frame => 
    Number(frame.productid) === Number(record.itemId) && 
    frame.model === record.model && 
    frame.material === record.material
  );
  
  return matchingFrame ? matchingFrame.currentStock : 0;
};

// 添加数量变更处理方法
const handleQuantityChange = (value, index) => {
  salesItems.value[index].quantity = value;
  
  // 根据数量自动更新小计
  const item = salesItems.value[index];
  const basePrice = item.price * value;
  item.subtotal = Number((basePrice * (item.discount ?? 1)).toFixed(2));
};

// 添加折扣变更处理方法
const handleDiscountChange = (value, index) => {
  // 验证输入范围
  if (value !== null && (value < 0 || value > 1)) {
    message.warning('折扣只能输入0~1之间的数字');
    // 重置为有效值
    salesItems.value[index].discount = value < 0 ? 0 : 1;
    return;
  }
  salesItems.value[index].discount = value;
  
  // 根据折扣自动计算小计
  const item = salesItems.value[index];
  const basePrice = item.price * (item.quantity || 1);
  item.subtotal = Number((basePrice * (value ?? 1)).toFixed(2));
};

// 添加折扣失焦处理方法
const handleDiscountBlur = (e, index) => {
  const value = e.target.value;
  // 强制转为2位小数
  if (value !== null && value !== undefined && value !== '') {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      salesItems.value[index].discount = Number(numValue.toFixed(2));
    }
  }
};

// 添加小计变更处理方法
const handleSubtotalChange = (value, index) => {
  const item = salesItems.value[index];
  const basePrice = item.price * (item.quantity || 1);
  
  if (basePrice > 0) {
    // 根据小计自动计算折扣
    const calculatedDiscount = Number((value / basePrice).toFixed(2));
    item.discount = calculatedDiscount;
    item.subtotal = Number(value.toFixed(2));
  } else {
    item.subtotal = Number(value.toFixed(2));
  }
};

// 添加小计失焦处理方法
const handleSubtotalBlur = (e, index) => {
  const value = e.target.value;
  // 强制转为2位小数
  if (value !== null && value !== undefined && value !== '') {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      const item = salesItems.value[index];
      const basePrice = item.price * (item.quantity || 1);
      
      if (basePrice > 0) {
        // 根据小计自动计算折扣
        const calculatedDiscount = Number((numValue / basePrice).toFixed(2));
        item.discount = calculatedDiscount;
      }
      item.subtotal = Number(numValue.toFixed(2));
    }
  }
};

// 处理应收金额变更
const handleReceivableChange = (value) => {
  receivableAmount.value = value;
  // 实收金额会通过监听器自动调整（除非用户手动修改过）
};

// 处理抹零金额变更 - 已移除抹零功能

// 处理实收金额变更
const handleActualChange = (value) => {
  actualAmount.value = value;
  // 标记用户手动修改了实收金额
  isManualActualChange.value = true;
};

// 添加获取隐形眼镜数据的方法
const getSoftContactData = () => {
  const data = localStorage.getItem('softcontactdata');
  return data ? JSON.parse(data) : [];
};

// 获取隐形眼镜类型选项
const getSoftContactTypeOptions = (productId) => {
  const softContactData = getSoftContactData();
  const typeMap = {
    'daily': '日抛',
    'weekly': '周抛',
    'monthly': '月抛',
    'quarterly': '季抛',
    'yearly': '年抛'
  };
  
  return softContactData
    .filter(item => item.productid === productId)
    .map(item => ({
      label: typeMap[item.type] || item.type,
      value: item.type,
      sphere: item.sphere,
      batchNumber: item.batchNumber,
      price: item.salePrice,
      stock: item.currentStock
    }));
};

// 获取隐形眼镜批号选项
const getSoftContactBatchOptions = (productId, type) => {
  const softContactData = getSoftContactData();
  return softContactData
    .filter(item => item.productid === productId && item.type === type)
    .map(item => ({
      label: item.batchNumber,
      value: item.batchNumber,
      sphere: item.sphere,
      price: item.salePrice,
      stock: item.currentStock
    }));
};

// 修改隐形眼镜相关处理方法
const handleSoftContactSphereChange = (value, index) => {
  salesItems.value[index].sphere = value;
  // 自动赋值价格
  const softContactData = getSoftContactData();
  const cylinder = salesItems.value[index].cylinder;
  const selectedItem = softContactData.find(item =>
    item.productid === salesItems.value[index].itemId &&
    item.type === salesItems.value[index].type &&
    Number(item.sphere) === Number(salesItems.value[index].sphere) &&
    String(item.batchNumber) === String(Array.isArray(salesItems.value[index].batchNumber) ? salesItems.value[index].batchNumber[0] : salesItems.value[index].batchNumber) &&
    (Number(cylinder) === 0 || Number(cylinder) === 0.00 || Number(item.cylinder) === Number(cylinder) || item.cylinder === undefined)
  );
  if (selectedItem) {
    salesItems.value[index].price = selectedItem.salePrice;
  } else {
    salesItems.value[index].price = 0;
  }
};

const handleSoftContactCylinderChange = (value, index) => {
  salesItems.value[index].cylinder = value;
};

const handleSoftContactTypeChange = (value, index) => {
  salesItems.value[index].type = value;
  salesItems.value[index].batchNumber = undefined; // 清空批号
  // 自动赋值价格
  const softContactData = getSoftContactData();
  const cylinder = salesItems.value[index].cylinder;
  const selectedItem = softContactData.find(item =>
    item.productid === salesItems.value[index].itemId &&
    item.type === value &&
    Number(item.sphere) === Number(salesItems.value[index].sphere) &&
    String(item.batchNumber) === String(Array.isArray(salesItems.value[index].batchNumber) ? salesItems.value[index].batchNumber[0] : salesItems.value[index].batchNumber) &&
    (Number(cylinder) === 0 || Number(cylinder) === 0.00 || Number(item.cylinder) === Number(cylinder) || item.cylinder === undefined)
  );
  if (selectedItem) {
    salesItems.value[index].price = selectedItem.salePrice;
  } else {
    salesItems.value[index].price = 0;
  }
};

const handleSoftContactBatchChange = (value, index) => {
  const softContactData = getSoftContactData();
  const cylinder = salesItems.value[index].cylinder;
  const selectedItem = softContactData.find(item => 
    item.productid === salesItems.value[index].itemId && 
    item.type === salesItems.value[index].type && 
    Number(item.sphere) === Number(salesItems.value[index].sphere) && 
    String(item.batchNumber) === String(value) &&
    (Number(cylinder) === 0 || Number(cylinder) === 0.00 || Number(item.cylinder) === Number(cylinder) || item.cylinder === undefined)
  );
  if (selectedItem) {
    salesItems.value[index].batchNumber = value;
    salesItems.value[index].price = selectedItem.salePrice;
  } else {
    salesItems.value[index].batchNumber = value;
    salesItems.value[index].price = 0;
  }
};

// 添加获取隐形眼镜库存的方法
const getSoftContactStock = (record) => {
  if (!record.itemId || !record.type || !record.batchNumber) return '-';
  
  const softContactData = getSoftContactData();
  const matchingItem = softContactData.find(item => 
    Number(item.productid) === Number(record.itemId) && 
    item.type === record.type && 
    item.batchNumber === record.batchNumber
  );
  
  return matchingItem ? matchingItem.currentStock : 0;
};

// 添加获取护理液数据的方法
const getSolutionData = () => {
  const data = localStorage.getItem('solutiondata');
  return data ? JSON.parse(data) : [];
};

// 添加获取非医疗产品数据的方法
const getAccessoryData = () => {
  const data = localStorage.getItem('accessorydata');
  return data ? JSON.parse(data) : [];
};

// 获取护理液类型选项
const getSolutionTypeOptions = (productId) => {
  const solutionData = getSolutionData();
  const typeMap = {
    'solution': '护理液',
    'disinfectant': '消毒液',
    'cleanser': '清洁液',
    'medicine': '药品'
  };
  
  // 先获取所有匹配的产品记录
  const matchingItems = solutionData.filter(item => item.productid === productId);
  
  // 对类型进行去重
  const uniqueTypes = [...new Set(matchingItems.map(item => item.type))];
  
  const options = uniqueTypes.map(type => ({
    label: typeMap[type] || type,
    value: type
  }));

  return {
    options,
    isSingle: options.length === 1
  };
};

// 获取护理液规格选项
const getSolutionSpecOptions = (productId, type) => {
  const solutionData = getSolutionData();
  const specMap = {
    '50ml': '50毫升',
    '100ml': '100毫升',
    '150ml': '150毫升',
    '250ml': '250毫升',
    '500ml': '500毫升'
  };
  
  // 先获取所有匹配的产品记录
  const matchingItems = solutionData.filter(item => item.productid === productId && item.type === type);
  
  // 对规格进行去重
  const uniqueSpecs = [...new Set(matchingItems.map(item => item.specification))];
  
  const options = uniqueSpecs.map(spec => ({
    label: specMap[spec] || spec,
    value: spec
  }));

  return {
    options,
    isSingle: options.length === 1
  };
};

// 获取护理液单位选项
const getSolutionUnitOptions = (productId, type, specification) => {
  const solutionData = getSolutionData();
  const unitMap = {
    'bottle': '瓶',
    'box': '盒',
    'piece': '片',
    'pair': '对',
    'tube': '支',
    'pack': '包'
  };
  
  // 先获取所有匹配的产品记录
  const matchingItems = solutionData.filter(item => 
    item.productid === productId && 
    item.type === type && 
    item.specification === specification
  );
  
  // 对单位进行去重
  const uniqueUnits = [...new Set(matchingItems.map(item => item.unit))];
  
  const options = uniqueUnits.map(unit => ({
    label: unitMap[unit] || unit,
    value: unit
  }));

  return {
    options,
    isSingle: options.length === 1
  };
};

// 获取非医疗产品日期选项
const getAccessoryDateOptions = (productId) => {
  const accessoryData = getAccessoryData();
  const product = accessoryData.find(item => item.productid === productId);
  
  if (!product) return { hasDates: false };
  
  const dates = accessoryData
    .filter(item => item.productid === productId)
    .map(item => ({
      productionDate: item.productionDate,
      expiryDate: item.expiryDate
    }))
    .filter((item, index, self) => 
      index === self.findIndex(t => 
        t.productionDate === item.productionDate && 
        t.expiryDate === item.expiryDate
      )
    );
  
  return {
    hasDates: dates.length > 0,
    dates: dates,
    isSingle: dates.length === 1
  };
};

// 添加非医疗产品日期变更处理方法
const handleAccessoryDateChange = (value, index) => {
  if (value) {
    salesItems.value[index].productionDate = value.productionDate;
    salesItems.value[index].expiryDate = value.expiryDate;
  } else {
    // 如果选择"不选择日期"或清空选择，则清空日期信息
    salesItems.value[index].productionDate = undefined;
    salesItems.value[index].expiryDate = undefined;
  }
};

// 修改护理液相关处理方法
const handleSolutionTypeChange = (value, index) => {
  salesItems.value[index].type = value;
  salesItems.value[index].specification = undefined;
  salesItems.value[index].unit = undefined;
  salesItems.value[index].batchNumber = undefined;

  // 检查并自动填充唯一规格
  const specOptions = getSolutionSpecOptions(salesItems.value[index].itemId, value);
  if (specOptions.isSingle) {
    const spec = specOptions.options[0].value;
    salesItems.value[index].specification = spec;
    
    // 检查并自动填充唯一单位
    const unitOptions = getSolutionUnitOptions(salesItems.value[index].itemId, value, spec);
    if (unitOptions.isSingle) {
      const unit = unitOptions.options[0].value;
      salesItems.value[index].unit = unit;
    }
  }
};

const handleSolutionSpecChange = (value, index) => {
  salesItems.value[index].specification = value;
  salesItems.value[index].unit = undefined;
  salesItems.value[index].batchNumber = undefined;

  // 检查并自动填充唯一单位
  const unitOptions = getSolutionUnitOptions(
    salesItems.value[index].itemId,
    salesItems.value[index].type,
    value
  );
  if (unitOptions.isSingle) {
    const unit = unitOptions.options[0].value;
    salesItems.value[index].unit = unit;
  }
};

const handleSolutionUnitChange = (value, index) => {
  salesItems.value[index].unit = value;
  salesItems.value[index].batchNumber = undefined;
};

const handleSolutionBatchChange = (value, index) => {
  salesItems.value[index].batchNumber = Array.isArray(value) ? value : [value];
  // 如只需单值可用 salesItems.value[index].batchNumber[0]
};

// 获取护理液批号选项
const getSolutionBatchOptions = (productId, type, specification, unit) => {
  const solutionData = getSolutionData();
  
  // 先获取所有匹配的产品记录
  const matchingItems = solutionData.filter(item =>
    item.productid === productId &&
    item.type === type &&
    item.specification === specification &&
    item.unit === unit
  );
  
  // 对批号进行去重（虽然批号通常是唯一的，但为了安全起见）
  const uniqueBatchNumbers = [...new Set(matchingItems.map(item => item.batchNumber))];
  
  const options = uniqueBatchNumbers.map(batchNumber => ({
    label: batchNumber,
    value: batchNumber
  }));
  
  return {
    options,
    isSingle: options.length === 1
  };
};

// 添加获取护理液库存的方法
const getSolutionStock = (record) => {
  if (!record.itemId || !record.type || !record.specification || !record.unit || !record.batchNumber) {
    console.log('护理液库存检查失败，缺少必要字段:', {
      itemId: record.itemId,
      type: record.type,
      specification: record.specification,
      unit: record.unit,
      batchNumber: record.batchNumber
    });
    return '-';
  }
  
  const solutionData = getSolutionData();
  // 处理批号可能是数组的情况
  const batchNumber = Array.isArray(record.batchNumber) ? record.batchNumber[0] : record.batchNumber;
  
  console.log('护理液库存查找参数:', {
    itemId: record.itemId,
    type: record.type,
    specification: record.specification,
    unit: record.unit,
    batchNumber: batchNumber,
    solutionDataLength: solutionData.length
  });
  
  const matchingItem = solutionData.find(item => 
    Number(item.productid) === Number(record.itemId) && 
    item.type === record.type &&
    item.specification === record.specification &&
    item.unit === record.unit &&
    String(item.batchNumber) === String(batchNumber)
  );
  
  console.log('护理液库存匹配结果:', matchingItem);
  
  return matchingItem ? matchingItem.currentStock : 0;
};

// 添加获取非医疗产品库存的方法
const getAccessoryStock = (record) => {
  if (!record.itemId) return '-';
  
  const accessoryData = getAccessoryData();
  const matchingItem = accessoryData.find(item => 
    Number(item.productid) === Number(record.itemId)
  );
  
  return matchingItem ? matchingItem.currentStock : 0;
};

// 添加服务相关处理方法
const handleServiceRemarkChange = (value, index) => {
  salesItems.value[index].remark = value;
};

// 新增：自动填充唯一选项并禁用下拉框的辅助方法
const disabledFields = ref({});

// 自动填充护理液相关唯一选项
watchEffect(() => {
  salesItems.value.forEach((item, idx) => {
    // 护理液类型
    if (item.category === 'solution' && item.itemId) {
      const typeOptions = getSolutionTypeOptions(item.itemId);
      if (typeOptions.isSingle && !item.type) {
        item.type = typeOptions.options[0].value;
        disabledFields.value[`type_${idx}`] = true;
      } else {
        disabledFields.value[`type_${idx}`] = false;
      }
      // 规格
      if (item.type) {
        const specOptions = getSolutionSpecOptions(item.itemId, item.type);
        if (specOptions.isSingle && !item.specification) {
          item.specification = specOptions.options[0].value;
          disabledFields.value[`spec_${idx}`] = true;
        } else {
          disabledFields.value[`spec_${idx}`] = false;
        }
        // 单位
        if (item.specification) {
          const unitOptions = getSolutionUnitOptions(item.itemId, item.type, item.specification);
          if (unitOptions.isSingle && !item.unit) {
            item.unit = unitOptions.options[0].value;
            disabledFields.value[`unit_${idx}`] = true;
          } else {
            disabledFields.value[`unit_${idx}`] = false;
          }
          // 批号
          if (item.unit) {
            const batchOptions = getSolutionBatchOptions(item.itemId, item.type, item.specification, item.unit);
            if (batchOptions.isSingle && (!item.batchNumber || item.batchNumber.length === 0)) {
              item.batchNumber = [batchOptions.options[0].value];
              disabledFields.value[`batch_${idx}`] = true;
            } else {
              disabledFields.value[`batch_${idx}`] = false;
            }
          }
        }
      }
    }
    // 非医疗产品日期 - 允许为空，不强制自动填充
    if (item.category === 'non_medical' && item.itemId) {
      const dateOptions = getAccessoryDateOptions(item.itemId);
      // 即使只有一个日期选项，也不强制自动填充，让用户自己选择
      disabledFields.value[`date_${idx}`] = false;
    }
  });
});

// 添加历史消费记录相关的状态
const saleHistory = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const allSaleHistory = ref([]); // 存储所有历史记录

// 过滤条件相关状态
const selectedDate = ref('');
const selectedStatus = ref('');

// 初始化日期为空（显示所有日期）
const initDates = () => {
  selectedDate.value = '';
};

// 计算属性
const totalRecords = computed(() => {
  return saleHistory.value.length;
});

const totalAmount = computed(() => {
  return saleHistory.value.reduce((total, record) => {
    return total + (record.total_amount || 0);
  }, 0);
});

const totalActualAmount = computed(() => {
  return saleHistory.value.reduce((total, record) => {
    return total + (record.actual_amount || 0);
  }, 0);
});

const totalDebtAmount = computed(() => {
  return saleHistory.value.reduce((total, record) => {
    const debt = (record.total_amount || 0) - (record.actual_amount || 0);
    return total + Math.max(0, debt);
  }, 0);
});

const totalPages = computed(() => {
  return Math.ceil(saleHistory.value.length / pageSize.value);
});

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return saleHistory.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// 详情模态框相关
const detailsModalVisible = ref(false);
const selectedRecord = ref(null);

// 打印模态框相关
const printModalVisible = ref(false);
const printSalesData = ref({});

// 选择打印条目模态框相关
const selectPrintItemsModalVisible = ref(false);
const selectedPrintItems = ref([]);

// 详情模态框列定义
const detailColumns = [
  { title: '商品名称', dataIndex: 'product_name', key: 'product_name', width: 150 },
  { title: '详细信息', key: 'details', width: 300 },
  { title: '类别', dataIndex: 'category', key: 'category', width: 100 },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
  { title: '单价', dataIndex: 'sale_price', key: 'sale_price', width: 100 },
  { title: '总价', dataIndex: 'total_price', key: 'total_price', width: 100 },
  { title: '折扣', key: 'discount', width: 80 }
];

// 选择打印条目表格列定义
const selectPrintColumns = [
  { title: '商品名称', dataIndex: 'product_name', key: 'product_name', width: 150 },
  { title: '详细信息', key: 'details', width: 300 },
  { title: '类别', dataIndex: 'category', key: 'category', width: 100 },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
  { title: '单价', dataIndex: 'sale_price', key: 'sale_price', width: 100 },
  { title: '总价', dataIndex: 'total_price', key: 'total_price', width: 100 },
  { title: '折扣', key: 'discount', width: 80 }
];

// 格式化日期
// 后端返回的日期时间可能是 UTC 时间，需要转换为本地时区后再格式化
const formatDate = (dateString) => {
  if (!dateString) return '';
  // 如果字符串包含时间部分，先按 UTC 解析，再转换为本地时区
  // 如果字符串只有日期部分（YYYY-MM-DD），直接使用
  if (dateString.includes(' ') || dateString.includes('T')) {
    // 包含时间部分，假设是 UTC 时间，转换为本地时区
    const utcDate = dayjs.utc(dateString);
    const localDate = utcDate.local();
    return localDate.format('YYYY-MM-DD');
  } else {
    // 只有日期部分，直接格式化
    return dayjs(dateString).format('YYYY-MM-DD');
  }
};

// 获取支付状态
const getPaymentStatus = (record) => {
  // 直接使用后端返回的 status 字段
  const status = record.status || '';
  
  if (status === '已结清' || status === '已完成') {
    return {
      text: status,
      class: 'status-completed',
      hasBalance: false
    };
  } else if (status === '尚有欠款' || status === '部分退单' || status === '全部退单') {
    return {
      text: status,
      class: 'status-pending',
      hasBalance: true
    };
  } else {
    // 如果没有 status 字段，则根据金额计算（兼容旧数据）
    const totalAmount = record.total_amount || 0;
    const actualAmount = record.actual_amount || 0;
    
    if (actualAmount >= totalAmount) {
      return {
        text: '已完成',
        class: 'status-completed',
        hasBalance: false
      };
    } else {
      return {
        text: '尚有欠款',
        class: 'status-pending',
        hasBalance: true
      };
    }
  }
};

// 切换页面
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// 监听过滤条件变化
const onFilterChange = () => {
  currentPage.value = 1; // 重置到第一页
  applyFilters();
};

// 应用过滤条件
const applyFilters = () => {
  let filteredRecords = [...allSaleHistory.value];

  // 日期过滤
  if (selectedDate.value) {
    filteredRecords = filteredRecords.filter(record => {
      if (!record.sale_date) return false;
      const recordDate = record.sale_date.split(' ')[0]; // 只取日期部分，去掉时间
      return recordDate === selectedDate.value;
    });
  }

  // 完成度过滤
  if (selectedStatus.value) {
    filteredRecords = filteredRecords.filter(record => {
      return record.status === selectedStatus.value;
    });
  }

  saleHistory.value = filteredRecords;
};

// 生成报表
const generateReport = () => {
  message.info('报表生成功能开发中...');
};

// 打开退单模态框
const openReturnModal = (record) => {
  message.info('退单功能开发中...');
};


// 这些方法在新的表格设计中不再需要，已移除

// 渲染产品详细信息
// 这些方法在新的表格设计中不再需要，已移除

// 这些方法在新的表格设计中不再需要，已移除

// 获取类别颜色
const getCategoryColor = (category) => {
  const colorMap = {
    'lens': 'blue',
    'frame': 'green',
    'soft_contact': 'purple',
    'solution': 'orange',
    'non_medical': 'cyan',
    'service': 'red'
  };
  return colorMap[category] || 'default';
};

// 计算折扣
const calculateDiscount = (item) => {
  const totalPrice = item.total_price || 0;
  const unitPrice = item.sale_price || 0;
  const quantity = item.quantity || 1;
  const originalPrice = unitPrice * quantity;
  
  if (originalPrice === 0) return '-';
  
  const discount = totalPrice / originalPrice;
  const discountValue = discount * 10;
  
  if (discountValue === 0) return '免费赠送';
  if (discountValue === 10) return '原价';
  
  return `${discountValue.toFixed(1)}折`;
};

// 获取折扣颜色
const getDiscountColor = (item) => {
  const totalPrice = item.total_price || 0;
  const unitPrice = item.sale_price || 0;
  const quantity = item.quantity || 1;
  const originalPrice = unitPrice * quantity;
  
  if (originalPrice === 0) return 'default';
  
  const discount = totalPrice / originalPrice;
  const discountValue = discount * 10;
  
  if (discountValue === 0) return 'green'; // 免费赠送
  if (discountValue === 10) return 'default'; // 原价
  if (discount >= 1) return 'default'; // 无折扣
  if (discount >= 0.8) return 'green'; // 8折以上
  if (discount >= 0.6) return 'orange'; // 6-8折
  if (discount >= 0.4) return 'red'; // 4-6折
  return 'volcano'; // 4折以下
};

// 获取收款渠道信息
const getPaymentChannels = (record) => {
  const channels = [];
  
  if (record.cash_amount && record.cash_amount > 0) {
    channels.push(`现金 ¥${record.cash_amount}`);
  }
  if (record.alipay_amount && record.alipay_amount > 0) {
    channels.push(`支付宝 ¥${record.alipay_amount}`);
  }
  if (record.wechat_amount && record.wechat_amount > 0) {
    channels.push(`微信 ¥${record.wechat_amount}`);
  }
  if (record.bank_amount && record.bank_amount > 0) {
    channels.push(`银行卡 ¥${record.bank_amount}`);
  }
  if (record.meituan_amount && record.meituan_amount > 0) {
    channels.push(`美团 ¥${record.meituan_amount}`);
  }
  if (record.douyin_amount && record.douyin_amount > 0) {
    channels.push(`抖音 ¥${record.douyin_amount}`);
  }
  if (record.other_amount && record.other_amount > 0) {
    channels.push(`其他 ¥${record.other_amount}`);
  }
  
  return channels.length > 0 ? channels.join(', ') : '未记录';
};

// 获取分类名称
const getCategoryName = (category) => {
  const nameMap = {
    'lens': '镜片',
    'frame': '镜架',
    'soft_contact': '隐形眼镜',
    'solution': '护理液/药品',
    'non_medical': '非医疗用品',
    'service': '服务'
  };
  return nameMap[category] || category;
};

// 获取眼别名称
const getEyeName = (eye) => {
  return eye === 'left' ? '左眼' : eye === 'right' ? '右眼' : eye;
};

// 获取隐形眼镜类型名称
const getSoftContactTypeName = (type) => {
  return type || '-';
};

// 获取护理液类型名称
const getSolutionTypeName = (type) => {
  return type || '-';
};

// 获取规格名称
const getSpecName = (spec) => {
  return spec || '-';
};

// 获取单位名称
const getUnitName = (unit) => {
  return unit || '-';
};

// 获取折扣后的单价
const getDiscountedUnitPrice = (item) => {
  const sale_price = item.sale_price || 0;
  const discount = item.discount;
  
  if (discount === null || discount === undefined || discount === 1) {
    return sale_price;
  }
  if (discount === 0) return 0; // 免费
  return sale_price * discount;
};

// 查看详情
const viewOrderDetails = (order) => {
  selectedRecord.value = order;
  detailsModalVisible.value = true;
};

// 关闭详情Modal
const closeDetailModal = () => {
  detailsModalVisible.value = false;
  selectedRecord.value = null;
};

// 打印订单
const printOrder = (order) => {
  printSalesData.value = {
    saleId: order.order_no || order.order_id || '历史记录',
    saleDate: order.sale_date,
    operator: order.operator || '未知',
    patientInfo: salesData.value.patientInfo, // 使用当前页面的完整患者信息，而不是历史订单中可能不完整的信息
    items: order.items || [],
    totalAmount: order.total_amount || 0,
    receivableAmount: order.total_amount || 0,
    actualAmount: order.actual_amount || 0,
    debtAmount: order.debt_amount || 0,
    // 收款方式信息（如果后端返回的数据中包含）
    paymentMethods: {
      cash_amount: order.cash_amount || 0,
      alipay_amount: order.alipay_amount || 0,
      wechat_amount: order.wechat_amount || 0,
      bank_amount: order.bank_amount || 0,
      other_amount: order.other_amount || 0,
      meituan_amount: order.meituan_amount || 0,
      douyin_amount: order.douyin_amount || 0
    }
  };
  printModalVisible.value = true;
};

// 显示打印选择模态框
const showPrintSelection = (record) => {
  selectedRecord.value = record;
  selectedPrintItems.value = []; // 清空选择
  selectPrintItemsModalVisible.value = true;
};

// 处理打印条目选择变化
const handlePrintItemsChange = (selectedRowKeys, selectedRows) => {
  selectedPrintItems.value = selectedRowKeys;
};

// 全选条目
const selectAllItems = () => {
  if (selectedRecord.value?.items) {
    selectedPrintItems.value = selectedRecord.value.items.map((item, index) => item.id || `item_${index}`);
  }
};

// 取消全选
const deselectAllItems = () => {
  selectedPrintItems.value = [];
};

// 计算选中条目的总金额
const calculateSelectedAmount = () => {
  if (!selectedRecord.value?.items) return 0;
  
  return selectedRecord.value.items
    .filter((item, index) => selectedPrintItems.value.includes(item.id || `item_${index}`))
    .reduce((sum, item) => {
      const totalPrice = item.total_price || item.sale_price * (item.quantity || 1) || 0;
      return sum + totalPrice;
    }, 0);
};

// 处理选择打印取消
const handleSelectPrintCancel = () => {
  selectPrintItemsModalVisible.value = false;
  selectedPrintItems.value = [];
};

// 处理选择打印确认
const handleSelectPrintConfirm = () => {
  if (selectedPrintItems.value.length === 0) {
    message.warning('请至少选择一个条目进行打印');
    return;
  }
  
  // 准备打印数据
  const selectedItems = selectedRecord.value.items.filter((item, index) => 
    selectedPrintItems.value.includes(item.id || `item_${index}`)
  );
  
  printSalesData.value = {
    saleId: selectedRecord.value.order_no || selectedRecord.value.order_id || '历史记录',
    saleDate: selectedRecord.value.sale_date,
    operator: selectedRecord.value.operator || '未知',
    patientInfo: salesData.value.patientInfo,
    items: selectedItems,
    totalAmount: calculateSelectedAmount(),
    receivableAmount: calculateSelectedAmount(),
    actualAmount: calculateSelectedAmount(),
    debtAmount: 0, // 选择打印时欠款金额为0
    // 收款方式信息（如果后端返回的数据中包含）
    paymentMethods: {
      cash_amount: selectedRecord.value.cash_amount || 0,
      alipay_amount: selectedRecord.value.alipay_amount || 0,
      wechat_amount: selectedRecord.value.wechat_amount || 0,
      bank_amount: selectedRecord.value.bank_amount || 0,
      other_amount: selectedRecord.value.other_amount || 0,
      meituan_amount: selectedRecord.value.meituan_amount || 0,
      douyin_amount: selectedRecord.value.douyin_amount || 0
    }
  };
  
  // 关闭选择模态框，打开打印模态框
  selectPrintItemsModalVisible.value = false;
  selectedPrintItems.value = [];
  printModalVisible.value = true;
};

// 打印当前详情记录
const printCurrentRecord = () => {
  if (!selectedRecord.value) {
    message.warning('没有可打印的记录');
    return;
  }
  
  // 准备打印数据（打印所有条目）
  printSalesData.value = {
    saleId: selectedRecord.value.order_no || selectedRecord.value.order_id || '历史记录',
    saleDate: selectedRecord.value.sale_date,
    operator: selectedRecord.value.operator || '未知',
    patientInfo: salesData.value.patientInfo,
    items: selectedRecord.value.items || [],
    totalAmount: selectedRecord.value.total_amount || 0,
    receivableAmount: selectedRecord.value.total_amount || 0,
    actualAmount: selectedRecord.value.actual_amount || 0,
    debtAmount: selectedRecord.value.debt_amount || 0,
    // 收款方式信息（如果后端返回的数据中包含）
    paymentMethods: {
      cash_amount: selectedRecord.value.cash_amount || 0,
      alipay_amount: selectedRecord.value.alipay_amount || 0,
      wechat_amount: selectedRecord.value.wechat_amount || 0,
      bank_amount: selectedRecord.value.bank_amount || 0,
      other_amount: selectedRecord.value.other_amount || 0,
      meituan_amount: selectedRecord.value.meituan_amount || 0,
      douyin_amount: selectedRecord.value.douyin_amount || 0
    }
  };
  
  // 关闭详情模态框，打开打印模态框
  detailsModalVisible.value = false;
  printModalVisible.value = true;
};

// 添加筛选相关的状态
// 这些变量在新的表格设计中不再需要，已移除

// 获取历史消费记录
const fetchSaleHistory = async (page = 1) => {
  try {
    loading.value = true;
    const organization_id = localStorage.getItem('organization_id');
    
    if (!organization_id) {
      message.error('未找到机构ID，请重新登录');
      return;
    }

    const response = await fetch('https://aiforoptometry.com/sale/records/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrftoken')
      },
      body: JSON.stringify({
        organization_id: Number(organization_id),
        patient_id: salesData.value.patientInfo.id,
        page: page,
        page_size: 100,
        mode: "order"
      }),
      credentials: 'include'
    });

    const result = await response.json();
    
    if (result.code === 200) {
      allSaleHistory.value = result.data || [];
      // 获取数据后立即应用筛选
      applyFilters();
      console.log('处理后的记录数据:', saleHistory.value);
    } else {
      console.error('获取记录失败:', result.message || '未知错误');
      message.error('获取记录失败: ' + (result.message || '未知错误'));
    }
  } catch (error) {
    console.error('请求错误:', error);
    message.error('网络请求失败，请检查网络连接');
  } finally {
    loading.value = false;
  }
};

// 消费统计已移至新的统计区域，不再需要单独的方法

// 添加筛选应用方法
// 这些方法在新的表格设计中不再需要，已移除

// 获取隐形眼镜球镜度数选项
const getSoftContactSphereOptions = (productId, type) => {
  const softContactData = getSoftContactData();
  // 只筛选当前品名和类型下的所有球镜度数，去重
  const spheres = softContactData
    .filter(item => item.productid === productId && (!type || item.type === type))
    .map(item => Number(item.sphere))
    .filter(s => !isNaN(s));
  // 去重并排序
  const uniqueSpheres = Array.from(new Set(spheres)).sort((a, b) => a - b);
  return uniqueSpheres.map(s => ({ label: s.toFixed(2), value: s }));
};

const saleDate = ref(dayjs());
const dateFormat = 'YYYY-MM-DD';

// 计算消费统计信息
// 消费统计已移至新的统计区域，不再需要单独的变量

// 消费统计已移至新的统计区域，不再需要单独的监听器

// 标记是否由用户手动修改实收金额
const isManualActualChange = ref(false);

// 获取商品名称的辅助函数
const getProductName = (item) => {
  const allData = getProductData();
  const product = allData.find(p => p.id === item.itemId);
  return product ? product.name : '未知商品';
};

// 处理打印模态框关闭
const handlePrintModalClose = () => {
  printModalVisible.value = false;
  printSalesData.value = {};
};

// 监听总金额变化，自动调整应收金额
watch(() => calculateTotalAmount(), (total) => {
  // 总金额变化时，应收金额跟着变化
  receivableAmount.value = total;
  
  // 如果实收金额不是用户手动设置的，则自动跟随应收金额
  if (!isManualActualChange.value) {
    actualAmount.value = total;
  }
}, { immediate: true });

// 监听抹零金额变化 - 已移除抹零功能

// 监听应收金额变化，自动调整实收金额（除非用户手动修改过）
watch(receivableAmount, (receivable) => {
  if (!isManualActualChange.value) {
    actualAmount.value = receivable;
  }
});
</script>

<style scoped>
.patient-sales {
  padding: 16px;
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.sales-content {
  margin-top: 8px;
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

h2 {
  margin: 0;
  color: #1890ff;
  font-size: 24px;
}

h3 {
  margin-bottom: 8px;
  color: #1890ff;
  font-size: 18px;
}

.sales-items {
  background: #fafafa;
  padding: 24px;
  border-radius: 4px;
  flex: 1;
  overflow: auto;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  width: 90%;
  max-width: 1400px;
  height: 85%;
  min-height: 600px;
  max-height: 90vh;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .modal-container {
    width: 95%;
    height: 90%;
    max-height: 95vh;
  }
}

@media (max-width: 768px) {
  .modal-container {
    width: 98%;
    height: 95%;
    max-height: 98vh;
    min-height: 500px;
  }
  
  .modal-header {
    padding: 16px 20px;
  }
  
  .modal-header h3 {
    font-size: 16px;
  }
  
  .list-header {
    padding: 12px 20px;
  }
  
  /* 中等屏幕下优化表格 */
  .sales-table {
    font-size: 13px;
  }
  
  .sales-table .ant-table-thead > tr > th,
  .sales-table .ant-table-tbody > tr > td {
    padding: 10px 6px;
  }
}

@media (max-width: 480px) {
  .modal-container {
    width: 100%;
    height: 100%;
    border-radius: 0;
    max-height: 100vh;
  }
  
  .modal-overlay {
    padding: 0;
  }
  
  /* 小屏幕下优化表格显示 */
  .sales-items-list .ant-table {
    font-size: 12px;
  }
  
  .sales-items-list .ant-table-thead > tr > th,
  .sales-items-list .ant-table-tbody > tr > td {
    padding: 8px 4px;
  }
  
  /* 调整表格列宽 */
  .sales-items-list .ant-table .ant-table-cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* 小屏幕下优化表格滚动 */
  .sales-table {
    font-size: 12px;
  }
  
  .sales-table .ant-table-thead > tr > th,
  .sales-table .ant-table-tbody > tr > td {
    padding: 8px 4px;
  }
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  color: #1890ff;
  font-size: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 40px);
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.sales-modal-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.sales-items-list {
  flex: 1;
  background: #fff;
  padding: 0;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

:deep(.ant-descriptions) {
  margin-bottom: 4px;
}

:deep(.ant-descriptions-item) {
  padding: 8px 12px;
}

:deep(.ant-descriptions-item-label) {
  font-weight: 600;
  color: #333;
}

:deep(.ant-descriptions-item-content) {
  color: #666;
}

:deep(.ant-table-wrapper) {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

:deep(.ant-table-body) {
  overflow: auto !important;
}

.total-amount {
  padding: 16px 24px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  text-align: right;
  flex-shrink: 0;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.fixed-table-height {
  height: 600px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.expanded-row {
  padding: 16px 24px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-top: 8px;
}

.expanded-row .ant-table {
  background: white;
  border-radius: 4px;
}

.expanded-row .ant-table-tbody > tr > td {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.expanded-row .ant-table-tbody > tr:last-child > td {
  border-bottom: none;
}

.detail-info {
  font-size: 12px;
  line-height: 1.4;
  color: #666;
}

.detail-info > div {
  margin-bottom: 2px;
}

.detail-info > div:last-child {
  margin-bottom: 0;
}

/* 详情模态框样式 */
.detail-modal {
  .ant-modal-content {
    border-radius: 8px;
    overflow: hidden;
  }
  
  .ant-modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-bottom: none;
    
    .ant-modal-title {
      color: white;
      font-weight: 600;
      font-size: 18px;
    }
  }
  
  .ant-modal-body {
    padding: 0;
  }
}

.detail-modal-content {
  .detail-header {
    background: #f8f9fa;
    padding: 20px;
    border-bottom: 1px solid #e8e8e8;
    
    .detail-summary {
      .ant-descriptions {
        background: white;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        
        .ant-descriptions-item-label {
          font-weight: 600;
          color: #333;
          background: #fafafa;
        }
        
        .detail-value {
          font-weight: 500;
          color: #1890ff;
          
          &.amount {
            color: #52c41a;
            font-size: 16px;
            font-weight: 600;
          }
        }
      }
    }
  }
  
  .detail-table-container {
    padding: 20px;
    
    .detail-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
      
      .ant-btn {
        border-radius: 6px;
        font-weight: 500;
      }
    }
    
    .detail-table {
      .ant-table-thead > tr > th {
        background: #fafafa;
        font-weight: 600;
        color: #333;
        border-bottom: 2px solid #e8e8e8;
      }
      
      .ant-table-tbody > tr > td {
        padding: 12px 8px;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .ant-table-tbody > tr:hover > td {
        background: #f5f5f5;
      }
      
      .price {
        font-weight: 600;
        color: #52c41a;
      }
      
      .detail-info {
        font-size: 12px;
        line-height: 1.4;
        color: #666;
        
        > div {
          margin-bottom: 2px;
          padding: 2px 0;
          
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }
}

.consumption-stats {
  margin-bottom: 4px;
}

.consumption-stats .ant-card {
  text-align: center;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.consumption-stats .ant-statistic-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.consumption-stats .ant-statistic-content {
  font-size: 24px;
  font-weight: bold;
}

/* 选择打印条目模态框样式 */
.select-print-modal {
  .ant-modal-content {
    border-radius: 8px;
    overflow: hidden;
  }
  
  .ant-modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-bottom: none;
    
    .ant-modal-title {
      color: white;
      font-weight: 600;
      font-size: 18px;
    }
  }
  
  .ant-modal-body {
    padding: 0;
  }
}

.select-print-content {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
  
  .print-info {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 6px;
    margin-bottom: 20px;
    border-left: 4px solid #1890ff;
    
    h3 {
      margin: 0 0 12px 0;
      color: #1890ff;
      font-size: 16px;
      font-weight: 600;
    }
    
    .info-summary {
      p {
        margin: 4px 0;
        font-size: 14px;
        
        strong {
          color: #333;
        }
      }
    }
  }
  
  .select-items {
    margin-bottom: 20px;
    
    .select-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      h3 {
        margin: 0;
        color: #1890ff;
        font-size: 16px;
        font-weight: 600;
      }
      
      .select-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .ant-table {
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      
      .ant-table-thead > tr > th {
        background: #fafafa;
        font-weight: 600;
        color: #333;
        border-bottom: 2px solid #e8e8e8;
      }
      
      .ant-table-tbody > tr > td {
        padding: 12px 8px;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .ant-table-tbody > tr:hover > td {
        background: #f5f5f5;
      }
      
      .price {
        font-weight: 600;
        color: #52c41a;
      }
      
      .detail-info {
        font-size: 12px;
        line-height: 1.4;
        color: #666;
        
        > div {
          margin-bottom: 2px;
          padding: 2px 0;
          
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }
  
  .print-summary {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 6px;
    margin-bottom: 20px;
    border-left: 4px solid #52c41a;
    
    .summary-info {
      p {
        margin: 4px 0;
        font-size: 14px;
        
        strong {
          color: #333;
        }
      }
    }
  }
  
  .select-print-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
  
  /* 历史记录表格样式优化 */
  .history-table {
    .ant-table-thead > tr > th {
      background: #fafafa;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #e8e8e8;
      padding: 12px 8px;
      text-align: center;
      
      &.ant-table-cell-fix-left,
      &.ant-table-cell-fix-right {
        background: #f0f8ff;
        border-right: 1px solid #e8e8e8;
      }
    }
    
    .ant-table-tbody > tr > td {
      padding: 12px 8px;
      border-bottom: 1px solid #f0f0f0;
      text-align: center;
      
      &.ant-table-cell-fix-left,
      &.ant-table-cell-fix-right {
        background: #fafbfc;
        border-right: 1px solid #f0f0f0;
      }
    }
    
    .ant-table-tbody > tr:hover > td {
      background: #f5f5f5;
      
      &.ant-table-cell-fix-left,
      &.ant-table-cell-fix-right {
        background: #e6f7ff;
      }
    }
    
    /* 日期列样式 */
    .date-column {
      font-weight: 500;
      color: #333;
    }
    
    /* 金额列样式 */
    .amount-column {
      font-weight: 600;
      color: #52c41a;
    }
    
    /* 操作列样式 */
    .action-column {
      .ant-btn-link {
        padding: 4px 8px;
        height: auto;
        font-size: 12px;
        
        &:hover {
          background: #f0f0f0;
          border-radius: 4px;
        }
      }
    }
    
    /* 项目数列样式 */
    .item-count-column {
      font-weight: 500;
      color: #666;
    }
    
    /* 操作员列样式 */
    .operator-column {
      color: #666;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

/* 新增的销售记录管理样式 */
/* 过滤条件区域样式 */
.filter-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
}

.date-filters {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  flex: 1;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
}

.date-item label {
  font-weight: 500;
  color: #555;
  min-width: 80px;
  white-space: nowrap;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 120px;
}

.confirm-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.confirm-btn:hover {
  background: #0056b3;
}

.confirm-btn:active {
  transform: translateY(1px);
}

.report-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.report-btn:hover {
  background: #218838;
}

.report-btn:active {
  transform: translateY(1px);
}

/* 统计信息区域样式 */
.stats-section {
  background: #e9ecef;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-label {
  font-weight: 500;
  color: #555;
}

.stat-value {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

/* 记录列表区域样式 */
.records-section {
  min-height: calc(100vh - 300px);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.records-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}

/* 表格样式 */
.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
  margin-bottom: 16px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  height: 650px;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  flex: 1;
  min-height: 0;
  table-layout: fixed;
}

/* 设置各列的宽度 */
.records-table th:nth-child(1), /* 订单号 */
.records-table td:nth-child(1) {
  width: 15%;
}

.records-table th:nth-child(2), /* 订单日期 */
.records-table td:nth-child(2) {
  width: 12%;
}

.records-table th:nth-child(3), /* 操作员 */
.records-table td:nth-child(3) {
  width: 10%;
}

.records-table th:nth-child(4), /* 商品数量 */
.records-table td:nth-child(4) {
  width: 8%;
}

.records-table th:nth-child(5), /* 订单金额 */
.records-table td:nth-child(5) {
  width: 12%;
}

.records-table th:nth-child(6), /* 完成度 */
.records-table td:nth-child(6) {
  width: 10%;
}

.records-table th:nth-child(7), /* 操作 */
.records-table td:nth-child(7) {
  width: 33%;
}

/* 操作列表头居中 */
.records-table th:nth-child(7) {
  text-align: center;
}

.records-table th {
  background: #f8f9fa;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  height: 50px;
  vertical-align: middle;
}

.records-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  color: #555;
  height: 60px;
  vertical-align: middle;
}

.records-table tr:hover {
  background: #f8f9fa;
}

.empty-row {
  height: 60px;
  background: #fafafa;
}

.empty-row td {
  border-bottom: 1px solid #f0f0f0;
}

.record-row {
  transition: background-color 0.2s;
}

.amount {
  font-weight: 600;
  color: #28a745;
}

.view-btn {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 80px;
}

.view-btn:hover {
  background: #138496;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(23, 162, 184, 0.3);
}

.print-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 80px;
}

.print-btn:hover {
  background: #218838;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
}

.return-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 80px;
}

.return-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 状态标签样式 */
.status-tag {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-completed {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-pending {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  flex-shrink: 0;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
}

.page-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 1200px;
  width: 70%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h4 {
  color: #333;
  margin: 0 0 15px 0;
  font-size: 18px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 5px;
}

.detail-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.detail-grid:last-child {
  margin-bottom: 0;
}

.detail-item {
  flex: 1;
  min-width: 180px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.detail-label {
  font-weight: 500;
  color: #555;
  margin-right: 8px;
}

.detail-value {
  font-weight: 600;
  color: #333;
}

/* 补款区域样式 */
.payment-section {
  margin-top: 20px;
  padding: 15px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.payment-section.compact {
  margin-top: 10px;
  padding: 8px 12px;
  gap: 10px;
}

.balance-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.balance-label {
  font-weight: 500;
  color: #856404;
}

.balance-amount {
  font-weight: 600;
  color: #721c24;
  font-size: 16px;
}

.payment-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.payment-btn.compact {
  padding: 6px 12px;
  font-size: 12px;
}

.payment-btn:hover {
  background: #c82333;
}

.payment-btn:active {
  transform: translateY(1px);
}

/* 商品明细表格样式 */
.items-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th {
  background: #f8f9fa;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
}

.items-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  color: #555;
  vertical-align: top;
}

.items-table tr:hover {
  background: #f8f9fa;
}

.item-row {
  transition: background-color 0.2s;
}

.product-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.category-tag {
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.category-tag.blue {
  background-color: #1890ff;
}

.category-tag.green {
  background-color: #52c41a;
}

.category-tag.purple {
  background-color: #722ed1;
}

.category-tag.orange {
  background-color: #fa8c16;
}

.category-tag.cyan {
  background-color: #13c2c2;
}

.category-tag.red {
  background-color: #f5222d;
}

.category-tag.default {
  background-color: #6c757d;
}

.item-details {
  font-size: 13px;
  line-height: 1.4;
}

.item-details > div {
  margin-bottom: 4px;
}

.item-details > div:last-child {
  margin-bottom: 0;
}

.quantity {
  text-align: center;
  font-weight: 500;
}

.price {
  font-weight: 600;
  color: #28a745;
}

.subtotal {
  font-weight: 600;
  color: #007bff;
}

.remark {
  font-size: 13px;
  color: #666;
  max-width: 150px;
  word-wrap: break-word;
}

/* 患者信息行样式 */
.patient-info-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  margin-left: -8px;
}

.info-item {
  display: flex;
  align-items: center;
  min-width: 12%;
  flex: 0;
}

.info-label {
  font-weight: 500;
  color: #666;
  margin-right: 6px;
  white-space: nowrap;
  font-size: 14px;
}

.info-value {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>