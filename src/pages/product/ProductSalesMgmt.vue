<template>
  <div class="product-sales-page">
    <a-card>
      <a-tabs v-model:activeKey="activeTabKey" type="line" class="sales-main-tabs">
        <a-tab-pane key="new-sale" tab="新建销售">
          <div class="new-sale-section">
            <!-- 客户：与患者列表关联，按姓名/拼音首字母检索并选择 -->
            <div class="new-sale-toolbar">
              <span class="field-label">客户:</span>
              <a-dropdown
                v-model:open="patientSearchDropdownOpen"
                :trigger="[]"
                overlay-class-name="patient-search-dropdown"
              >
                <a-input
                  v-model:value="patientSearchText"
                  placeholder="输入客户姓名或首字母检索"
                  allow-clear
                  class="patient-search-input"
                  :spellcheck="false"
                  autocomplete="off"
                  @input="onPatientSearchInput"
                  @focus="onPatientSearchFocus"
                  @blur="onPatientSearchBlur"
                >
                  <template #prefix>
                    <SearchOutlined />
                  </template>
                </a-input>
                <template #overlay>
                  <div class="patient-search-dropdown-list">
                    <template v-if="dropdownPatientList.length === 0">
                      <div class="patient-search-dropdown-empty">{{ patientSearchText?.trim() ? '无匹配患者' : '无当日检查患者' }}</div>
                    </template>
                    <template v-else>
                      <div
                        v-for="item in dropdownPatientList"
                        :key="getPatientId(item) || item.name"
                        class="patient-search-dropdown-item"
                        @mousedown.prevent
                        @click="onSelectPatient(item)"
                      >
                        <span class="patient-search-name">{{ item.name }}</span>
                        <span v-if="getPatientId(item)" class="patient-search-id">编号 {{ getPatientId(item) }}</span>
                        <span
                          class="patient-search-import"
                          @mousedown.prevent="onImportRefractionForPatient(item)"
                          @click.stop
                        >导入主观验光</span>
                      </div>
                    </template>
                  </div>
                </template>
              </a-dropdown>
            </div>
            <!-- 检索框和配镜处方之间显示已选患者 -->
            <div v-if="selectedPatient" class="patient-info-section">
              <div class="patient-info-row">
                <span class="patient-info-item"><span class="patient-info-label">姓名：</span>{{ selectedPatient.name || '—' }}</span>
                <span class="patient-info-item"><span class="patient-info-label">患者编号：</span>{{ getArchivedListPatientId(selectedPatient) || getPatientId(selectedPatient) || '—' }}</span>
                <span class="patient-info-item"><span class="patient-info-label">性别：</span>{{ formatGender(selectedPatient.gender) }}</span>
                <span class="patient-info-item"><span class="patient-info-label">年龄：</span>{{ formatAge(selectedPatient.birthDate ?? selectedPatient.birth_date) }}</span>
                <span class="patient-info-item"><span class="patient-info-label">联系电话：</span>{{ selectedPatient.phone || '—' }}</span>
                <span class="patient-info-item patient-info-import-wrap">
                  <a-button type="primary" size="small" @click="openImportRefractionModal">导入主观验光</a-button>
                </span>
              </div>
            </div>
            <!-- 配镜处方标题 + 检查时间 -->
            <div class="prescription-section-header">
              <div class="section-title">配镜处方</div>
              <div class="prescription-exam-time">
                <span class="prescription-exam-time-label">检查时间：</span>
                <span>{{ prescriptionExamTime || '—' }}</span>
              </div>
            </div>
            <a-table
              :columns="prescriptionColumns"
              :data-source="prescriptionData"
              :pagination="false"
              bordered
              class="prescription-table"
            />
            <!-- 配镜处方下方：商品检索（商品名称 / 拼音首字母） -->
            <div class="product-search-toolbar">
              <span class="field-label">商品检索:</span>
              <a-dropdown
                v-model:open="productSearchDropdownOpen"
                :trigger="[]"
                overlay-class-name="product-search-dropdown"
              >
                <a-input
                  v-model:value="productSearchText"
                  placeholder="输入商品名称、拼音首字母或零售价格检索"
                  allow-clear
                  class="product-search-input"
                  :spellcheck="false"
                  autocomplete="off"
                  @input="onProductSearchInput"
                  @focus="onProductSearchFocus"
                  @blur="onProductSearchBlur"
                >
                  <template #prefix>
                    <SearchOutlined />
                  </template>
                </a-input>
                <template #overlay>
                  <div class="product-search-dropdown-list">
                    <template v-if="dropdownProductList.length === 0">
                      <div class="product-search-dropdown-empty">{{ productSearchText?.trim() ? '无匹配商品' : '输入商品名称、拼音首字母或零售价格检索' }}</div>
                    </template>
                    <template v-else>
                      <div
                        v-for="item in dropdownProductList"
                        :key="item.id"
                        class="product-search-dropdown-item"
                        @mousedown.prevent
                        @click="onSelectProduct(item)"
                      >
                        <span class="product-search-name">{{ item.name }}</span>
                        <span v-if="item.retailPrice != null && item.retailPrice !== ''" class="product-search-price">¥ {{ formatProductPrice(item.retailPrice) }}</span>
                      </div>
                    </template>
                  </div>
                </template>
              </a-dropdown>
            </div>
            <!-- 商品列表 -->
            <div class="sales-product-list-wrap">
              <a-table
                :columns="salesProductColumns"
                :data-source="salesProductList"
                :pagination="false"
                bordered
                size="small"
                row-key="id"
                class="sales-product-table"
              />
            </div>
            <div class="sales-order-summary-bar">
              <div class="sales-order-summary-total">
                总金额：<span class="sales-order-summary-money">{{ formatMoneyOneDecimal(totalSaleAmount) }}</span>
              </div>
              <div class="sales-order-summary-open-btn">
                <a-button
                  type="primary"
                  :disabled="!selectedPatient || salesProductList.length === 0"
                  @click="openSalesOrderModal"
                >开单</a-button>
              </div>
            </div>
          </div>
        </a-tab-pane>
        <a-tab-pane key="sales-list" tab="销售列表">
          <div class="sales-list-page">
            <div class="sales-list-filters">
              <span class="field-label">姓名：</span>
              <a-input
                v-model:value="salesListSearchText"
                placeholder="输入患者姓名首字母检索"
                allow-clear
                class="sales-list-search-input"
              />
              <span class="field-label">时间：</span>
              <a-date-picker
                v-model:value="salesListSelectedDate"
                value-format="YYYY-MM-DD"
                :locale="datePickerLocale"
                class="sales-list-date-input"
                placeholder="选择日期"
              />
            </div>

            <div class="sales-list-content">
              <div v-if="filteredSalesOrders.length === 0" class="placeholder-content">暂无销售记录</div>
              <div
                v-for="(order, index) in filteredSalesOrders"
                :key="order.saleOrderNo"
                class="sales-list-order"
                :class="{
                  'sales-list-order-returned': isOrderReturned(order),
                  'sales-list-order-alt-green': !isOrderReturned(order) && index % 2 === 0,
                  'sales-list-order-alt-white': !isOrderReturned(order) && index % 2 === 1
                }"
              >
                <div class="sales-list-order-head">
                  <div><span class="sales-list-order-date">{{ formatSaleDate(order.createdAt) }}</span> 销售单号：{{ order.saleOrderNo }}</div>
                  <div>患者姓名：{{ order.patient?.name || '—' }}</div>
                </div>

                <table class="sales-list-order-table">
                  <thead>
                    <tr>
                      <th>商品名称</th>
                      <th>商品参数</th>
                      <th>数量</th>
                      <th>零售价格</th>
                      <th>销售价格</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="it in order.items || []" :key="it.productName + '_' + (it.quantity ?? '')">
                      <td class="sales-list-td-name">{{ it.productName || '—' }}</td>
                      <td class="sales-list-td-params">{{ it.paramsText || '—' }}</td>
                      <td class="sales-list-td-qty">{{ it.quantity ?? '—' }}</td>
                      <td class="sales-list-td-retail">{{ formatMoneyOneDecimal(it.retailPrice ?? 0) }}</td>
                      <td class="sales-list-td-price">{{ formatMoneyOneDecimal(it.salePrice ?? 0) }}</td>
                    </tr>
                  </tbody>
                </table>

                <div class="sales-list-order-total">
                  <span>销售金额：{{ formatMoneyOneDecimal(order.totalAmount ?? 0) }}</span>
                  <a-button v-if="!isOrderReturned(order)" type="link" size="small" class="sales-list-return-btn" @click="openReturnModal(order)">退货</a-button>
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>
        <a-tab-pane key="customer-list" tab="客户列表">
          <div class="placeholder-content">客户列表 - 待开发</div>
        </a-tab-pane>
        <a-tab-pane key="return-list" tab="退货列表">
          <div class="return-list-page">
            <div class="return-list-filters">
              <span class="field-label">姓名：</span>
              <a-input
                v-model:value="returnListSearchText"
                placeholder="输入患者姓名检索"
                allow-clear
                class="return-list-search-input"
              />
              <span class="field-label">时间：</span>
              <a-date-picker
                v-model:value="returnListSelectedDate"
                value-format="YYYY-MM-DD"
                :locale="datePickerLocale"
                class="return-list-date-input"
                placeholder="选择日期"
              />
            </div>

            <div class="return-list-content">
              <div v-if="filteredReturnOrders.length === 0" class="placeholder-content">暂无退货记录</div>
              <div
                v-for="ro in filteredReturnOrders"
                :key="ro.returnOrderNo"
                class="return-list-order"
              >
                <div class="return-list-order-head">
                  <div><span class="return-list-order-date">{{ formatReturnDate(ro.createdAt) }}</span> 退货单号：{{ ro.returnOrderNo }}</div>
                  <div>患者姓名：{{ ro.patientName || '—' }}</div>
                  <div>原销售单号：{{ ro.originalSaleOrderNo || '—' }}</div>
                </div>
                <table class="return-list-order-table">
                  <thead>
                    <tr>
                      <th>商品名称</th>
                      <th>商品参数</th>
                      <th>数量</th>
                      <th>零售价格</th>
                      <th>销售价格</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="it in ro.items || []" :key="it.productName + '_' + (it.quantity ?? '')">
                      <td class="return-list-td-name">{{ it.productName || '—' }}</td>
                      <td class="return-list-td-params">{{ it.paramsText || '—' }}</td>
                      <td class="return-list-td-qty">{{ it.quantity ?? '—' }}</td>
                      <td class="return-list-td-retail">{{ formatMoneyOneDecimal(it.retailPrice ?? 0) }}</td>
                      <td class="return-list-td-price">{{ formatMoneyOneDecimal(it.salePrice ?? 0) }}</td>
                    </tr>
                  </tbody>
                </table>
                <div class="return-list-order-meta">
                  <span class="return-list-reason-label">退货原因：</span>
                  <span class="return-list-reason-text">{{ ro.returnReason || '—' }}</span>
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>
        <a-tab-pane key="aftersale-list" tab="售后列表">
          <a-tabs v-model:activeKey="aftersaleSubTabKey" class="aftersale-sub-tabs">
            <a-tab-pane key="pending" tab="待售后列表">
              <div class="aftersale-list-page">
                <div class="aftersale-list-filters">
                  <span class="field-label">姓名：</span>
                  <a-input
                    v-model:value="aftersaleListSearchText"
                    placeholder="输入患者姓名检索"
                    allow-clear
                    class="aftersale-list-search-input"
                  />
                  <span class="field-label">时间：</span>
                  <a-date-picker
                    v-model:value="aftersaleListSelectedDate"
                    value-format="YYYY-MM-DD"
                    :locale="datePickerLocale"
                    class="aftersale-list-date-input"
                    placeholder="选择日期"
                  />
                  <span class="field-label">销售单号：</span>
                  <a-input
                    v-model:value="aftersaleListSaleOrderNo"
                    placeholder="输入销售单号检索"
                    allow-clear
                    class="aftersale-list-order-no-input"
                  />
                </div>

                <div class="aftersale-list-content">
                  <div v-if="filteredAftersaleOrders.length === 0" class="placeholder-content">暂无售后记录</div>
                  <div
                    v-for="(order, index) in filteredAftersaleOrders"
                    :key="order.saleOrderNo"
                    class="aftersale-list-order"
                    :class="{
                      'aftersale-list-order-completed': isAftersaleOrderCompleted(order),
                      'aftersale-list-order-alt-purple': index % 2 === 0,
                      'aftersale-list-order-alt-blue': index % 2 === 1
                    }"
                  >
                    <div class="aftersale-list-order-head">
                      <div>
                        <span class="aftersale-expiry">售后到期：<span v-if="isAftersaleOrderCompleted(order)" class="aftersale-expiry-done">已售后</span><template v-else>{{ getAftersaleExpiryDate(order.createdAt) + '（' + aftersaleExpiryLabel(order.createdAt) + '）' }}</template></span>
                        <span class="aftersale-list-order-date">{{ formatSaleDate(order.createdAt) }}</span>
                        销售单号：{{ order.saleOrderNo }}
                      </div>
                      <div>患者姓名：{{ order.patient?.name || '—' }}</div>
                    </div>
                    <table class="aftersale-list-order-table">
                      <thead>
                        <tr>
                          <th v-if="!isAftersaleOrderCompleted(order)" class="aftersale-list-th-select">选择</th>
                          <th>商品名称</th>
                          <th>商品参数</th>
                          <th>数量</th>
                          <th>零售价格</th>
                          <th>销售价格</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(it, idx) in order.items || []" :key="it.productName + '_' + (it.quantity ?? '') + '_' + idx">
                          <td v-if="!isAftersaleOrderCompleted(order)" class="aftersale-list-td-select">
                            <a-checkbox
                              :checked="isAftersaleItemSelected(order.saleOrderNo, idx)"
                              @change="(e) => toggleAftersaleItemSelection(order.saleOrderNo, idx, e.target.checked)"
                            />
                          </td>
                          <td class="aftersale-list-td-name">{{ it.productName || '—' }}</td>
                          <td class="aftersale-list-td-params">{{ it.paramsText || '—' }}</td>
                          <td class="aftersale-list-td-qty">{{ it.quantity ?? '—' }}</td>
                          <td class="aftersale-list-td-retail">{{ formatMoneyOneDecimal(it.retailPrice ?? 0) }}</td>
                          <td class="aftersale-list-td-price">{{ formatMoneyOneDecimal(it.salePrice ?? 0) }}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div class="aftersale-list-order-total">
                      <span>销售金额：{{ formatMoneyOneDecimal(order.totalAmount ?? 0) }}</span>
                      <a-button v-if="!isAftersaleOrderCompleted(order)" type="link" size="small" class="aftersale-list-btn" @click="onAftersaleClick(order)">售后</a-button>
                    </div>
                  </div>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="completed" tab="已售后列表">
              <div class="aftersale-list-page">
                <div class="aftersale-list-filters">
                  <span class="field-label">姓名：</span>
                  <a-input
                    v-model:value="aftersaleListSearchText"
                    placeholder="输入患者姓名检索"
                    allow-clear
                    class="aftersale-list-search-input"
                  />
                  <span class="field-label">时间：</span>
                  <a-date-picker
                    v-model:value="aftersaleListSelectedDate"
                    value-format="YYYY-MM-DD"
                    :locale="datePickerLocale"
                    class="aftersale-list-date-input"
                    placeholder="选择日期"
                  />
                  <span class="field-label">销售单号：</span>
                  <a-input
                    v-model:value="aftersaleListSaleOrderNo"
                    placeholder="输入销售单号检索"
                    allow-clear
                    class="aftersale-list-order-no-input"
                  />
                </div>
                <div class="aftersale-list-content">
                  <div v-if="filteredCompletedAftersaleOrders.length === 0" class="placeholder-content">暂无已售后记录</div>
                  <div
                    v-for="(order, index) in filteredCompletedAftersaleOrders"
                    :key="order.saleOrderNo"
                    class="aftersale-list-order"
                    :class="{
                      'aftersale-list-order-alt-purple': index % 2 === 0,
                      'aftersale-list-order-alt-blue': index % 2 === 1
                    }"
                  >
                    <div class="aftersale-list-order-head">
                      <div>
                        <span class="aftersale-list-order-patient">患者姓名：{{ order.patient?.name || '—' }}</span>
                        <span class="aftersale-expiry"><span class="aftersale-expiry-done">已售后</span></span>
                        <span class="aftersale-list-order-date">{{ formatSaleDate(order.createdAt) }}</span>
                        销售单号：{{ order.saleOrderNo }}
                      </div>
                    </div>
                    <table class="aftersale-list-order-table">
                      <thead>
                        <tr>
                          <th>商品名称</th>
                          <th>商品参数</th>
                          <th>数量</th>
                          <th>零售价格</th>
                          <th>销售价格</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(it, idx) in order.items || []" :key="it.productName + '_' + (it.quantity ?? '') + '_' + idx">
                          <td class="aftersale-list-td-name">{{ it.productName || '—' }}</td>
                          <td class="aftersale-list-td-params">{{ it.paramsText || '—' }}</td>
                          <td class="aftersale-list-td-qty">{{ it.quantity ?? '—' }}</td>
                          <td class="aftersale-list-td-retail">{{ formatMoneyOneDecimal(it.retailPrice ?? 0) }}</td>
                          <td class="aftersale-list-td-price">{{ formatMoneyOneDecimal(it.salePrice ?? 0) }}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div class="aftersale-list-order-total">
                      <span>销售金额：{{ formatMoneyOneDecimal(order.totalAmount ?? 0) }}</span>
                    </div>
                    <template v-if="getAftersaleCompletedNewItems(order.saleOrderNo).length > 0">
                      <div class="aftersale-list-new-items-label">售后商品</div>
                      <table class="aftersale-list-order-table aftersale-list-new-items-table">
                        <thead>
                          <tr>
                            <th>商品名称</th>
                            <th>眼别</th>
                            <th>光度</th>
                            <th>数量</th>
                            <th>零售价格</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(it, idx) in getAftersaleCompletedNewItems(order.saleOrderNo)" :key="(it.productName || '') + '_' + idx">
                            <td class="aftersale-list-td-name">{{ it.productName || '—' }}</td>
                            <td class="aftersale-list-td-eye">{{ it.eyeSide || '—' }}</td>
                            <td class="aftersale-list-td-params">{{ it.paramText || '—' }}</td>
                            <td class="aftersale-list-td-qty">{{ it.quantity ?? '—' }}</td>
                            <td class="aftersale-list-td-retail">{{ formatMoneyOneDecimal(it.retailPrice ?? 0) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </template>
                  </div>
                </div>
              </div>
            </a-tab-pane>
          </a-tabs>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 选择患者历史验光数据弹窗：挂载到 body 并提高 z-index，避免被售后弹窗等遮挡 -->
    <a-modal
      v-model:open="importRefractionModalVisible"
      title="选择患者的历史验光数据"
      width="680px"
      :footer="null"
      :force-render="true"
      wrap-class-name="import-refraction-modal-wrap"
      :get-container="getImportRefractionModalContainer"
      :z-index="10000"
      @cancel="closeImportRefractionModal"
    >
      <div v-if="selectedPatient" class="import-refraction-patient-info">
        <span class="import-refraction-patient-name">患者姓名：{{ selectedPatient.name || '—' }}</span>
        <span class="import-refraction-patient-id">患者编号：{{ getArchivedListPatientId(selectedPatient) || getPatientId(selectedPatient) || '—' }}</span>
      </div>
      <a-spin :spinning="importRefractionLoading">
        <a-table
          :columns="importRefractionColumns"
          :data-source="importRefractionList"
          :pagination="{ pageSize: 8 }"
          size="small"
          row-key="id"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">{{ index + 1 }}</template>
            <template v-else-if="column.key === 'action'">
              <a-button type="link" size="small" @click="onImportRefractionSelect(record)">选择</a-button>
            </template>
          </template>
        </a-table>
      </a-spin>
      <div v-if="!importRefractionLoading && importRefractionList.length === 0" class="import-refraction-empty">暂无历史主观验光数据</div>
    </a-modal>

    <!-- 镜片商品选择眼别弹窗 -->
    <a-modal
      v-model:open="lensEyeSideModalVisible"
      title="选择眼别"
      width="380px"
      centered
      :footer="null"
      @cancel="onCancelLensEyeSideModal"
    >
      <div v-if="pendingLensProduct" class="lens-eye-side-modal">
        <p class="lens-eye-side-product">商品：{{ pendingLensProduct.name }}</p>
        <p class="lens-eye-side-tip">请选择眼别：</p>
        <div class="lens-eye-side-btns">
          <a-button type="primary" @click="onConfirmLensEyeSide('双眼')">双眼</a-button>
          <a-button @click="onConfirmLensEyeSide('右眼')">右眼</a-button>
          <a-button @click="onConfirmLensEyeSide('左眼')">左眼</a-button>
        </div>
      </div>
    </a-modal>

    <!-- 开单弹窗 -->
    <a-modal
      v-model:open="salesOrderModalVisible"
      title="确认开单"
      width="920px"
      ok-text="确定"
      cancel-text="取消"
      @ok="confirmCreateSalesOrder"
      @cancel="salesOrderModalVisible = false"
    >
      <div class="sales-order-modal">
        <div class="sales-order-modal-section">
          <div class="sales-order-row">
            <span class="sales-order-label">销售单号：</span>
            <span class="sales-order-value">{{ salesOrderNo }}</span>
          </div>
          <div class="sales-order-row sales-order-patient-one-line">
            <span class="sales-order-inline-item">
              <span class="sales-order-label">姓名：</span>
              <span class="sales-order-value">{{ selectedPatient?.name || '—' }}</span>
            </span>
            <span class="sales-order-inline-item">
              <span class="sales-order-label">出生年月：</span>
              <span class="sales-order-value">{{ selectedPatient?.birthDate ?? selectedPatient?.birth_date ?? '—' }}</span>
            </span>
            <span class="sales-order-inline-item">
              <span class="sales-order-label">联系电话：</span>
              <span class="sales-order-value">{{ selectedPatient?.phone || '—' }}</span>
            </span>
            <span class="sales-order-inline-item">
              <span class="sales-order-label">患者编号：</span>
              <span class="sales-order-value">{{ getArchivedListPatientId(selectedPatient) || getPatientId(selectedPatient) || '—' }}</span>
            </span>
          </div>
        </div>

        <div v-if="hasPrescriptionData" class="sales-order-modal-section">
          <div class="sales-order-row">
            <span class="sales-order-label">配镜处方：</span>
          </div>
          <div v-if="prescriptionRightLine !== '—'" class="sales-order-prescription-line">右眼：{{ prescriptionRightLine }}</div>
          <div v-if="prescriptionLeftLine !== '—'" class="sales-order-prescription-line">左眼：{{ prescriptionLeftLine }}</div>
          <div v-if="prescriptionPdText && prescriptionPdText !== '—'" class="sales-order-prescription-line">瞳距：{{ prescriptionPdText }}</div>
        </div>

        <div class="sales-order-modal-section">
          <div class="sales-order-row">
            <span class="sales-order-label">商品列表：</span>
          </div>
          <table class="sales-order-goods-table">
            <thead>
              <tr>
                <th>商品名称</th>
                <th>商品参数</th>
                <th>数量</th>
                <th>零售价格</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in salesProductList" :key="row.id">
                <td class="sales-order-goods-name">{{ row.productName }}</td>
                <td class="sales-order-goods-params">{{ getSalesRowParamsText(row) }}</td>
                <td class="sales-order-goods-qty">{{ row.quantity }}</td>
                <td class="sales-order-goods-price">{{ formatMoneyOneDecimal(row.retailPrice) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="sales-order-total">
          <span class="sales-order-total-label">总金额：</span>
          <span class="sales-order-total-value">{{ formatMoneyOneDecimal(totalSaleAmount) }}</span>
        </div>
      </div>
    </a-modal>

    <!-- 退货弹窗 -->
    <a-modal
      v-model:open="returnModalVisible"
      title="退货"
      width="720px"
      ok-text="确定"
      cancel-text="取消"
      @ok="submitReturn"
      @cancel="closeReturnModal"
    >
      <div class="return-modal">
        <div class="return-modal-row">
          <span class="return-modal-label">退货原因：</span>
          <a-textarea
            v-model:value="returnReason"
            placeholder="请输入退货原因"
            :rows="3"
            class="return-modal-reason"
          />
        </div>
        <div class="return-modal-row">
          <span class="return-modal-label">退货商品选择：</span>
          <div class="return-modal-goods">
            <div
              v-for="(it, idx) in (returnOrder?.items || [])"
              :key="idx"
              class="return-modal-goods-item"
            >
              <a-checkbox
                :checked="returnSelectedIndices.includes(idx)"
                @change="(e) => toggleReturnItem(idx, e.target.checked)"
              >
                {{ it.productName }}{{ it.paramsText ? `（${it.paramsText}）` : '' }} 数量 {{ it.quantity ?? 0 }} 金额 {{ formatMoneyOneDecimal((it.quantity ?? 0) * (it.salePrice ?? 0)) }}
              </a-checkbox>
            </div>
          </div>
        </div>
        <div class="return-modal-row return-modal-amount-row">
          <span class="return-modal-label">退货金额：</span>
          <a-input-number
            v-model:value="returnAmount"
            :min="0"
            :precision="1"
            class="return-modal-amount-input"
          />
          <a-button type="primary" size="small" @click="setReturnAmountFull">全部</a-button>
        </div>
      </div>
    </a-modal>

    <!-- 售后弹窗 -->
    <a-modal
      v-model:open="aftersaleModalVisible"
      title="售后"
      width="1060px"
      ok-text="确定"
      cancel-text="取消"
      @ok="confirmAftersaleModal"
      @cancel="closeAftersaleModal"
    >
      <div class="aftersale-modal">
        <div class="aftersale-modal-row">
          <span class="aftersale-modal-label">患者姓名：</span>
          <span class="aftersale-modal-value">{{ aftersaleModalOrder?.patient?.name || '—' }}</span>
          <span class="aftersale-modal-label" style="margin-left: 16px;">患者编号：</span>
          <span class="aftersale-modal-value">{{ getAftersaleModalPatientId(aftersaleModalOrder?.patient) || '—' }}</span>
          <span class="aftersale-modal-label" style="margin-left: 16px;">销售单号：</span>
          <span class="aftersale-modal-value">{{ aftersaleModalOrder?.saleOrderNo || '—' }}</span>
        </div>

        <div class="aftersale-modal-section">
          <div class="aftersale-modal-label-row">售后商品明细</div>
          <table class="aftersale-modal-goods-table">
            <thead>
              <tr>
                <th>商品名称</th>
                <th>商品参数</th>
                <th>数量</th>
                <th>零售价格</th>
                <th>销售价格</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in aftersaleModalSelectedItems" :key="it.productName + '_' + (it.quantity ?? '')">
                <td>{{ it.productName || '—' }}</td>
                <td>{{ it.paramsText || '—' }}</td>
                <td>{{ it.quantity ?? '—' }}</td>
                <td>{{ formatMoneyOneDecimal(it.retailPrice ?? 0) }}</td>
                <td>{{ formatMoneyOneDecimal(it.salePrice ?? 0) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="aftersale-modal-section">
          <div class="aftersale-modal-section-head">
            <span class="aftersale-modal-label-row">光度填写</span>
          </div>
          <table class="aftersale-modal-prescription-table">
            <thead>
              <tr>
                <th>眼别</th>
                <th>球镜（D）</th>
                <th>柱镜（D）</th>
                <th>轴位（°）</th>
                <th>矫正视力</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="aftersale-prescription-eye">右眼</td>
                <td><a-input v-model:value="aftersalePrescription.right.sphere" placeholder="球镜" class="aftersale-prescription-input" /></td>
                <td><a-input v-model:value="aftersalePrescription.right.cylinder" placeholder="柱镜" class="aftersale-prescription-input" /></td>
                <td><a-input v-model:value="aftersalePrescription.right.axis" placeholder="轴位" class="aftersale-prescription-input" /></td>
                <td><a-input v-model:value="aftersalePrescription.right.va" placeholder="矫正视力" class="aftersale-prescription-input" /></td>
              </tr>
              <tr>
                <td class="aftersale-prescription-eye">左眼</td>
                <td><a-input v-model:value="aftersalePrescription.left.sphere" placeholder="球镜" class="aftersale-prescription-input" /></td>
                <td><a-input v-model:value="aftersalePrescription.left.cylinder" placeholder="柱镜" class="aftersale-prescription-input" /></td>
                <td><a-input v-model:value="aftersalePrescription.left.axis" placeholder="轴位" class="aftersale-prescription-input" /></td>
                <td><a-input v-model:value="aftersalePrescription.left.va" placeholder="矫正视力" class="aftersale-prescription-input" /></td>
              </tr>
            </tbody>
          </table>
          <div class="aftersale-modal-pd-row">
            <span class="aftersale-modal-label">瞳距（mm）：</span>
            <a-input v-model:value="aftersalePrescription.pd" placeholder="瞳距" class="aftersale-prescription-input aftersale-pd-input" />
          </div>
        </div>

        <div class="aftersale-modal-section">
          <div class="aftersale-modal-label-row">商品检索</div>
          <a-dropdown
            v-model:open="aftersaleProductSearchDropdownOpen"
            :trigger="[]"
            overlay-class-name="product-search-dropdown"
          >
            <a-input
              v-model:value="aftersaleProductSearchText"
              placeholder="输入商品名称、拼音首字母或零售价格检索"
              allow-clear
              class="aftersale-product-search-input"
              :spellcheck="false"
              autocomplete="off"
              @input="onAftersaleProductSearchInput"
              @focus="aftersaleProductSearchDropdownOpen = true"
              @blur="onAftersaleProductSearchBlur"
            >
              <template #prefix>
                <SearchOutlined />
              </template>
            </a-input>
            <template #overlay>
              <div class="product-search-dropdown-list">
                <template v-if="dropdownAftersaleProductList.length === 0">
                  <div class="product-search-dropdown-empty">{{ aftersaleProductSearchText?.trim() ? '无匹配商品' : '输入商品名称、拼音首字母或零售价格检索' }}</div>
                </template>
                <template v-else>
                  <div
                    v-for="item in dropdownAftersaleProductList"
                    :key="item.id"
                    class="product-search-dropdown-item"
                    @mousedown.prevent
                    @click="onAftersaleModalSelectProduct(item)"
                  >
                    <span class="product-search-name">{{ item.name }}</span>
                    <span v-if="item.retailPrice != null && item.retailPrice !== ''" class="product-search-price">¥ {{ formatProductPrice(item.retailPrice) }}</span>
                  </div>
                </template>
              </div>
            </template>
          </a-dropdown>
          <div class="aftersale-modal-label-row" style="margin-top: 8px;">商品列表</div>
          <div class="aftersale-modal-product-list-wrap">
            <a-table
              :columns="aftersaleModalProductColumns"
              :data-source="aftersaleModalProductList"
              :pagination="false"
              bordered
              size="small"
              row-key="id"
              class="aftersale-modal-product-table"
            />
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, nextTick } from 'vue';
import { pinyin } from 'pinyin-pro';
import { SearchOutlined } from '@ant-design/icons-vue';
import { Input, InputNumber, Tooltip, Select, Button, message } from 'ant-design-vue';
import { DeleteOutlined } from '@ant-design/icons-vue';
import datePickerLocale from 'ant-design-vue/es/date-picker/locale/zh_CN';

const activeTabKey = ref('new-sale');
const patientSearchText = ref('');
const patientList = ref([]);
const selectedPatient = ref(null); // 当前选中的患者（来自患者列表）
const patientSearchDropdownOpen = ref(false);
const prescriptionExamTime = ref(''); // 配镜处方右侧显示的检查时间（导入历史验光时设为该次检查日期）

// 商品检索（配镜处方下方）：从商品信息 localStorage 读取，支持名称/拼音首字母
const PRODUCT_STORAGE_KEY = 'ProductModaldata';
const CATEGORY_STORAGE_KEY = 'ProductCategoryData';
const ATTR_STORAGE_KEY = 'ProductAttributeData';
const productList = ref([]);
const categoryList = ref([]);
const attrList = ref([]);
const productSearchText = ref('');
const productSearchDropdownOpen = ref(false);
let productSearchBlurTimer = null;

function getProductListRaw() {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PRODUCT_STORAGE_KEY) : null;
  return raw ? JSON.parse(raw) : [];
}

/** 库存数据 localStorage key（与库存管理各子模块一致） */
const INVENTORY_DATA_KEYS = ['lensdata', 'framedata', 'accessorydata', 'softcontactdata', 'solutiondata'];

/** 根据商品 ID 汇总各库存数据源中的在库数量（用于判断是否有库存，非镜片或无光度商品） */
function getProductStockTotal(productId) {
  if (productId == null || productId === '') return 0;
  const idStr = String(productId);
  let total = 0;
  INVENTORY_DATA_KEYS.forEach((key) => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return;
      list.forEach((item) => {
        const pid = item.productid != null ? String(item.productid) : (item.productId != null ? String(item.productId) : '');
        if (pid === idStr) total += Math.floor(Number(item.currentStock) || 0);
      });
    } catch (_) {}
  });
  return total;
}

/** 从处方行解析球镜、柱镜数值（轴位 col4 不参与库存匹配）。
 * 显示格式「-1.00/-0.50」表示：前为球镜、后为柱镜。col2=球镜，col3=柱镜；库存匹配时球镜、柱镜均按正负号和数值匹配。 */
function parsePrescriptionSphereCylinder(row) {
  if (!row) return null;
  const s = row.col2 != null && String(row.col2).trim() !== '' ? Number(row.col2) : NaN; // 球镜
  const cRaw = row.col3; // 柱镜
  const c = (cRaw != null && cRaw !== '' && cRaw !== '-') ? Number(cRaw) : 0;
  if (Number.isNaN(s)) return null;
  return { sphere: s, cylinder: Number.isNaN(c) ? 0 : c };
}

/** 有光度范围的商品：按球镜、柱镜查找是否有库存。
 * 光度范围/库存明细中纵坐标=球镜、横坐标=柱镜；球镜、柱镜均按正负号和数值匹配，轴位不参与。 */
function getLensStockForSalesRow(record) {
  if (!record || record.productId == null || !record.hasPowerRange) return 0;
  const rows = prescriptionData.value || [];
  const pairs = [];
  if (record.eyeSide === '右眼' && rows[0]) {
    const p = parsePrescriptionSphereCylinder(rows[0]);
    if (p) pairs.push(p);
  } else if (record.eyeSide === '左眼' && rows[1]) {
    const p = parsePrescriptionSphereCylinder(rows[1]);
    if (p) pairs.push(p);
  } else if (record.eyeSide === '双眼') {
    if (rows[0]) { const p = parsePrescriptionSphereCylinder(rows[0]); if (p) pairs.push(p); }
    if (rows[1]) { const p = parsePrescriptionSphereCylinder(rows[1]); if (p) pairs.push(p); }
  }
  if (pairs.length === 0) return 0;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('lensdata') : null;
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return 0;
    const idStr = String(record.productId);
    let total = 0;
    list.forEach((item) => {
      const pid = item.productid != null ? String(item.productid) : (item.productId != null ? String(item.productId) : '');
      if (pid !== idStr) return;
      const s = Number(item.sphere);   // 库存纵坐标：球镜
      const c = Number(item.cylinder); // 库存横坐标：柱镜
      if (Number.isNaN(s)) return;
      // 球镜、柱镜均按正负号和数值匹配（与球镜一致）
      const match = pairs.some((p) => {
        const ds = Math.abs(p.sphere - s);
        const dc = (p.cylinder == null || p.cylinder === '' || Number.isNaN(Number(p.cylinder)))
          ? (c === 0 || Number.isNaN(c) ? 0 : 1)
          : Math.abs(Number(p.cylinder) - c);
        return ds < 1e-3 && dc < 1e-3;
      });
      if (match) total += Math.floor(Number(item.currentStock) || 0);
    });
    return total;
  } catch (_) {
    return 0;
  }
}

/** 该销售行对应的可用库存数：有光度范围则按球镜、柱镜查镜片库存，否则按商品 ID 汇总 */
function getStockForSalesRow(record) {
  if (!record || record.productId == null) return 0;
  if (record.hasPowerRange) return getLensStockForSalesRow(record); // 有光度：按球镜、柱镜查
  return getProductStockTotal(record.productId);
}

/**
 * 按光度查询镜片库存（球镜、柱镜均按正负号和数值匹配；轴位不参与匹配）。
 * 可在控制台调用：checkLensStockByPower(-1, -0.25) 查询 -1.00/-0.25 的库存。
 * @param sphere 球镜（D），如 -1 或 -1.00
 * @param cylinder 柱镜（D），如 -0.25
 * @returns { total: number, byProduct: Array<{ productId, name?, currentStock }> }
 */
function checkLensStockByPower(sphere, cylinder) {
  const s = Number(sphere);
  const c = Number(cylinder);
  if (Number.isNaN(s)) return { total: 0, byProduct: [] };
  const cNum = Number.isNaN(c) ? 0 : c;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('lensdata') : null;
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return { total: 0, byProduct: [] };
    const products = getProductListRaw();
    const byProduct = [];
    let total = 0;
    list.forEach((item) => {
      const itemS = Number(item.sphere);
      const itemC = Number(item.cylinder);
      if (Number.isNaN(itemS)) return;
      const ds = Math.abs(itemS - s);
      const dc = Number.isNaN(itemC) ? (cNum === 0 ? 0 : 1) : Math.abs(itemC - cNum);
      if (ds >= 1e-3 || dc >= 1e-3) return;
      const stock = Math.floor(Number(item.currentStock) || 0);
      const pid = item.productid != null ? String(item.productid) : (item.productId != null ? String(item.productId) : '');
      const name = products.find((p) => String(p.id) === pid)?.name || pid;
      byProduct.push({ productId: pid, name, currentStock: stock });
      total += stock;
    });
    return { total, byProduct };
  } catch (_) {
    return { total: 0, byProduct: [] };
  }
}

/** 该销售行是否为「库存管理」商品（非零采购且管理类型为库存） */
function isInventoryManagedSalesRow(record) {
  if (!record || record.productId == null) return false;
  const rawList = getProductListRaw();
  const prod = rawList.find((p) => String(p.id) === String(record.productId));
  if (!prod) return false;
  return prod.inventoryManageType === 'stock' && !prod.zeroPurchase;
}

/** 库存管理商品无库存时显示红色、有库存时显示绿色；非库存管理不染色 */
function getSalesProductNameStockClass(record) {
  if (!isInventoryManagedSalesRow(record)) return '';
  return getStockForSalesRow(record) > 0 ? 'sales-product-stock-green' : 'sales-product-stock-red';
}

/** 商品参数列：有光度范围时，该光度无库存显示红色、有库存显示绿色；无光度范围时沿用商品名库存样式 */
function getSalesParamStockClass(record) {
  if (record.hasPowerRange) {
    const stock = getStockForSalesRow(record);
    return stock > 0 ? 'sales-product-stock-green' : 'sales-product-stock-red';
  }
  return getSalesProductNameStockClass(record);
}

function loadProductList() {
  const rawList = getProductListRaw();
  productList.value = rawList.map((p) => ({
    ...p,
    categoryId: p.categoryId != null ? p.categoryId : (typeof p.category === 'number' ? p.category : null),
  }));
}

function loadCategoryList() {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CATEGORY_STORAGE_KEY) : null;
  const list = raw ? JSON.parse(raw) : [];
  categoryList.value = list;
}

function loadAttrList() {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ATTR_STORAGE_KEY) : null;
  attrList.value = raw ? JSON.parse(raw) : [];
}

function getProductCategoryName(product) {
  const id = product.categoryId != null ? product.categoryId : (typeof product.category === 'number' ? product.category : null);
  if (id == null) return product.category != null ? String(product.category) : '—';
  const c = categoryList.value.find((x) => x.id === id);
  return c ? c.name : '—';
}

/** 是否为镜片类型商品（按类别名称包含「镜片」判断） */
function isLensProduct(product) {
  const name = getProductCategoryName(product);
  return name && String(name).indexOf('镜片') !== -1;
}

/** 新建销售添加该商品时是否需要选择眼别：镜片类别 或 商品勾选了区分眼别 */
function needsEyeSideSelection(product) {
  if (isLensProduct(product)) return true;
  const rawList = getProductListRaw();
  const latest = rawList.find((p) => String(p.id) === String(product.id));
  const p = latest != null ? latest : product;
  if (p.requireEyeSide) return true;
  return p.eyeSideMode != null && String(p.eyeSideMode).trim() !== '';
}

function getProductParamText(product) {
  const pv = product.parameterValues;
  if (!pv || typeof pv !== 'object') return '—';
  const parts = Object.entries(pv)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('、') : v}`);
  return parts.length ? parts.join('；') : '—';
}

// 商品匹配：名称（中文 + 拼音首字母 + 全拼）+ 零售价格
function matchProductSearch(product, keyword) {
  const k = (keyword || '').trim().toLowerCase();
  if (!k) return true;
  const name = (product.name || '').trim();
  if (name.toLowerCase().includes(k)) return true;
  try {
    const first = pinyin(name, { toneType: 'none', pattern: 'first' }).replace(/\s+/g, '').toLowerCase();
    if (first.indexOf(k) !== -1) return true;
    const full = pinyin(name, { toneType: 'none', pattern: 'pinyin' }).replace(/\s+/g, '').toLowerCase();
    if (full.indexOf(k) !== -1) return true;
  } catch (_) {}
  // 零售价格检索：价格字符串包含检索词（如 "1280"、"128" 匹配 1280）
  const priceVal = product.retailPrice;
  if (priceVal != null && priceVal !== '') {
    const priceStr = String(priceVal).trim();
    if (priceStr.indexOf(k) !== -1) return true;
    const priceNum = Number(priceVal);
    if (!Number.isNaN(priceNum) && String(priceNum).indexOf(k) !== -1) return true;
  }
  return false;
}

function formatProductPrice(v) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  return Number.isNaN(n) ? '—' : n.toFixed(1);
}

const dropdownProductList = computed(() => {
  const search = productSearchText.value?.trim();
  const list = productList.value.filter((p) => matchProductSearch(p, search));
  return list.slice(0, 50);
});

function onProductSearchInput() {
  productSearchDropdownOpen.value = true;
}

function onProductSearchFocus() {
  if (productSearchBlurTimer) {
    clearTimeout(productSearchBlurTimer);
    productSearchBlurTimer = null;
  }
  // 只有输入过内容后才弹出选项，避免弹窗关闭后焦点回填时自动弹出
  if (productSearchText.value?.trim()) {
    productSearchDropdownOpen.value = true;
  }
}

function onProductSearchBlur() {
  productSearchBlurTimer = setTimeout(() => {
    productSearchDropdownOpen.value = false;
    productSearchBlurTimer = null;
  }, 200);
}

// 销售商品列表（配镜处方下方表格）
let salesRowId = 0;
const salesProductList = ref([]);
const eyeSideOptions = [
  { label: '左眼', value: '左眼' },
  { label: '右眼', value: '右眼' },
  { label: '双眼', value: '双眼' },
];

/** 折扣保留小数点后一位 */
function roundDiscountOneDecimal(d) {
  if (Number.isNaN(d) || d <= 0) return 100;
  return Math.round(d * 10) / 10;
}

function getSalesRowId() {
  salesRowId += 1;
  return `sales-row-${salesRowId}`;
}

// 根据眼别从配镜处方取球镜/柱镜×轴位（用于有光度范围商品）
function getPrescriptionSphereCylAxis(eyeSide) {
  const rows = prescriptionData.value;
  const row = eyeSide === '右眼' ? rows[0] : eyeSide === '左眼' ? rows[1] : null;
  if (!row) {
    const r0 = rows[0];
    const r1 = rows[1];
    const s0 = r0 ? formatSphereCylAxis(r0) : '';
    const s1 = r1 ? formatSphereCylAxis(r1) : '';
    if (s0 && s1) return `右: ${s0}  左: ${s1}`;
    if (s0) return `右: ${s0}`;
    if (s1) return `左: ${s1}`;
    return '—';
  }
  return formatSphereCylAxis(row);
}

// 开单弹窗商品行：需要展示光度时，若处方无数据则返回空字符串（不显示“—”）
function getSalesRowOpticsText(row) {
  if (!row || !row.hasPowerRange) return '';
  const txt = getPrescriptionSphereCylAxis(row.eyeSide);
  return txt && txt !== '—' ? txt : '';
}

function getSalesRowParamsText(row) {
  if (!row) return '';
  const parts = [];
  const optics = getSalesRowOpticsText(row);
  if (optics) parts.push(`光度：${optics}`);
  const model = row.modelEnabled ? (row.model || '') : '';
  if (model && String(model).trim() !== '') parts.push(`型号：${String(model).trim()}`);
  return parts.length ? parts.join('；') : '';
}

function formatSphereCylAxis(row) {
  const sphere = (row.col2 != null && String(row.col2).trim() !== '') ? String(row.col2).trim() : '';
  const cylRaw = row.col3;
  const cyl = (cylRaw != null && cylRaw !== '' && cylRaw !== '-') ? String(cylRaw).replace(/^-/, '') : '';
  const axis = (row.col4 != null && String(row.col4).trim() !== '') ? String(row.col4).trim() : '';
  if (!sphere) return '—';
  const part = cyl ? (axis ? `${sphere}/-${cyl}×${axis}°` : `${sphere}/-${cyl}`) : sphere;
  return part;
}

/**
 * @param {object} product - 商品对象
 * @param {{ eyeSide?: string, eyeSideReadOnly?: boolean }} [opts] - 眼别及是否只读（镜片通过弹窗选择时传入）
 */
function addSalesProduct(product, opts = {}) {
  // 从 localStorage 取该商品最新数据，确保「零售价格/2」「眼别」等编辑后的设置生效（避免内存中的 productList 未刷新）
  const rawList = getProductListRaw();
  const latest = rawList.find((p) => String(p.id) === String(product.id));
  const prod = latest != null ? latest : product;
  const noEyeDistinction = !prod.requireEyeSide && (!prod.eyeSideMode || String(prod.eyeSideMode).trim() === '');
  const eyeSide = opts.eyeSide !== undefined ? opts.eyeSide : (noEyeDistinction ? '—' : '双眼');
  const eyeSideReadOnly = opts.eyeSideReadOnly !== undefined ? opts.eyeSideReadOnly : noEyeDistinction;
  const baseRetail = prod.retailPrice != null && prod.retailPrice !== '' ? Number(prod.retailPrice) : 0;
  const retail = prod.retailPriceHalf ? baseRetail / 2 : baseRetail;
  const hasPowerRange = product.powerRangeTemplateId != null && product.powerRangeTemplateId !== '';
  const modelEnabled = !!product.modelEnabled;
  const row = {
    id: getSalesRowId(),
    productId: product.id,
    categoryName: getProductCategoryName(product),
    productName: product.name || '—',
    eyeSide,
    eyeSideReadOnly,
    hasPowerRange,
    modelEnabled,
    model: '',       // 有型号时填写
    paramInput: '',  // 无光度无型号时填写
    quantity: 1,
    retailPrice: retail,
    discount: 100,
    warrantyOneYear: !!prod.warrantyOneYear,
  };
  salesProductList.value = salesProductList.value.concat(row);
}

function removeSalesProduct(record) {
  salesProductList.value = salesProductList.value.filter((r) => r.id !== record.id);
}

function getSalePrice(row) {
  const q = Number(row.quantity);
  const r = Number(row.retailPrice);
  const d = Number(row.discount);
  if (Number.isNaN(q) || q < 0 || Number.isNaN(r) || Number.isNaN(d) || d <= 0) return 0;
  return (r * q * d) / 100;
}

/** 表格中显示的销售价格：若用户手动输入过则显示输入值，否则按折扣计算 */
function getDisplaySalePrice(record) {
  const v = record.salePrice;
  if (v != null && v !== '' && !Number.isNaN(Number(v))) return Number(v);
  return getSalePrice(record);
}

// --------------------
// 开单弹窗 & 单号生成
// --------------------
const SALES_ORDER_STORAGE_KEY = 'SalesOrderData';
const RETURN_ORDER_STORAGE_KEY = 'ReturnOrderData';
const AFTERSALE_COMPLETED_STORAGE_KEY = 'AftersaleCompletedOrderNos';
const AFTERSALE_COMPLETED_DETAILS_KEY = 'AftersaleCompletedDetails';
const salesOrderModalVisible = ref(false);
const salesOrderNo = ref('');

function loadSalesOrdersRaw() {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SALES_ORDER_STORAGE_KEY) : null;
  return raw ? JSON.parse(raw) : [];
}

function saveSalesOrdersRaw(list) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SALES_ORDER_STORAGE_KEY, JSON.stringify(list || []));
}

function loadReturnOrdersRaw() {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(RETURN_ORDER_STORAGE_KEY) : null;
  return raw ? JSON.parse(raw) : [];
}

function saveReturnOrdersRaw(list) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(RETURN_ORDER_STORAGE_KEY, JSON.stringify(list || []));
}

// 退货单号：TH + YYMMDD + 两位序号（如 TH26031901）
function generateReturnOrderNo() {
  const d = new Date();
  const yy = String(d.getFullYear() % 100).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const prefix = `TH${yy}${mm}${dd}`;

  const list = loadReturnOrdersRaw();
  let maxSeq = 0;
  (Array.isArray(list) ? list : []).forEach((o) => {
    const no = o?.returnOrderNo;
    const s = no != null ? String(no) : '';
    if (!s.startsWith(prefix)) return;
    const tail = s.slice(-2);
    const seq = Number(tail);
    if (!Number.isNaN(seq)) maxSeq = Math.max(maxSeq, seq);
  });

  const nextSeq = String(maxSeq + 1).padStart(2, '0');
  return `${prefix}${nextSeq}`;
}

// 生成销售单号：XS + YYMMDD + 三位序号（例如 XS260319001）
function generateSaleOrderNo() {
  const d = new Date();
  const yy = String(d.getFullYear() % 100).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const prefix = `XS${yy}${mm}${dd}`; // XS + YYMMDD

  const list = loadSalesOrdersRaw();
  let maxSeq = 0;
  (Array.isArray(list) ? list : []).forEach((o) => {
    const no = o?.saleOrderNo;
    const s = no != null ? String(no) : '';
    if (!s.startsWith(prefix)) return;
    const tail = s.slice(-3); // 最后3位序号
    const seq = Number(tail);
    if (!Number.isNaN(seq)) maxSeq = Math.max(maxSeq, seq);
  });

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}

function formatMoneyOneDecimal(v) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  return Number.isNaN(n) ? '—' : `¥ ${n.toFixed(1)}`;
}

const totalSaleAmount = computed(() => {
  return salesProductList.value.reduce((sum, row) => {
    const v = getDisplaySalePrice(row);
    return sum + (Number.isNaN(Number(v)) ? 0 : Number(v));
  }, 0);
});

const prescriptionRightText = computed(() => getPrescriptionSphereCylAxis('右眼'));
const prescriptionLeftText = computed(() => getPrescriptionSphereCylAxis('左眼'));

function getPrescriptionCorrectedVA(eyeSide) {
  const rows = prescriptionData.value;
  const row = eyeSide === '右眼' ? rows[0] : eyeSide === '左眼' ? rows[1] : null;
  if (!row) return '';
  const v = row.col5;
  return v != null && String(v).trim() !== '' ? String(v).trim() : '';
}

function getPrescriptionPdText() {
  const rows = prescriptionData.value;
  const r0 = rows[0];
  const r1 = rows[1];
  const pdDouble = r0 && r0.col6 != null && String(r0.col6).trim() !== '' ? String(r0.col6).trim() : '';
  if (pdDouble) return `${pdDouble}mm`;
  const pdRight = r0 && r0.col7 != null && String(r0.col7).trim() !== '' ? String(r0.col7).trim() : '';
  const pdLeft = r1 && r1.col7 != null && String(r1.col7).trim() !== '' ? String(r1.col7).trim() : '';
  const parts = [];
  if (pdRight) parts.push(`右眼：${pdRight}mm`);
  if (pdLeft) parts.push(`左眼：${pdLeft}mm`);
  return parts.length ? parts.join('；') : '—';
}

const prescriptionRightVA = computed(() => getPrescriptionCorrectedVA('右眼'));
const prescriptionLeftVA = computed(() => getPrescriptionCorrectedVA('左眼'));
const prescriptionPdText = computed(() => getPrescriptionPdText());

const prescriptionRightLine = computed(() => {
  const axisText = prescriptionRightText.value;
  if (!axisText || axisText === '—') return '—';
  const vaText = prescriptionRightVA.value;
  if (vaText && vaText !== '—') return `${axisText}→${vaText}`;
  return axisText;
});

const prescriptionLeftLine = computed(() => {
  const axisText = prescriptionLeftText.value;
  if (!axisText || axisText === '—') return '—';
  const vaText = prescriptionLeftVA.value;
  if (vaText && vaText !== '—') return `${axisText}→${vaText}`;
  return axisText;
});

const hasPrescriptionData = computed(() => {
  const hasSphere = (prescriptionRightText.value && prescriptionRightText.value !== '—') || (prescriptionLeftText.value && prescriptionLeftText.value !== '—');
  const hasVA = (prescriptionRightVA.value && prescriptionRightVA.value !== '—') || (prescriptionLeftVA.value && prescriptionLeftVA.value !== '—');
  const hasPd = prescriptionPdText.value && prescriptionPdText.value !== '—';
  return hasSphere || hasVA || hasPd;
});

function openSalesOrderModal() {
  if (!selectedPatient.value) {
    message.warning('请先选择患者');
    return;
  }
  if (!salesProductList.value.length) {
    message.warning('请先添加商品');
    return;
  }
  salesOrderNo.value = generateSaleOrderNo();
  salesOrderModalVisible.value = true;
}

function confirmCreateSalesOrder() {
  const list = loadSalesOrdersRaw();
  const payload = {
    saleOrderNo: salesOrderNo.value,
    createdAt: new Date().toISOString(),
    patient: selectedPatient.value ? {
      name: selectedPatient.value.name,
      birthDate: selectedPatient.value.birthDate ?? selectedPatient.value.birth_date,
      phone: selectedPatient.value.phone,
      patientId: getArchivedListPatientId(selectedPatient.value) || getPatientId(selectedPatient.value),
      id: selectedPatient.value.id,
      patient_id: selectedPatient.value.patient_id,
    } : null,
    prescription: hasPrescriptionData.value ? {
      right: prescriptionRightText.value,
      left: prescriptionLeftText.value,
      rightVA: prescriptionRightVA.value || '',
      leftVA: prescriptionLeftVA.value || '',
      pd: prescriptionPdText.value || '',
    } : null,
    items: salesProductList.value.map((r) => ({
      productName: r.productName,
      paramsText: getSalesRowParamsText(r),
      quantity: r.quantity,
      retailPrice: r.retailPrice,
      salePrice: getDisplaySalePrice(r), // 行销售金额（用于展示销售价格）
      warrantyOneYear: !!r.warrantyOneYear,
    })),
    totalAmount: totalSaleAmount.value,
  };

  const newList = Array.isArray(list) ? list.concat(payload) : [payload];
  saveSalesOrdersRaw(newList);

  // 先刷新销售列表（从 localStorage 读取，确保包含本条），再切到销售列表 tab，日期用本地“今天”以便新单能显示
  loadSalesOrders();
  salesListSearchText.value = '';
  salesListSelectedDate.value = getTodayDateStr();
  salesOrderModalVisible.value = false;
  message.success('开单成功');
  activeTabKey.value = 'sales-list';
}

// --------------------
// 销售列表页（销售列表 tab）
// --------------------
const salesListSearchText = ref('');
const salesListSelectedDate = ref(getTodayDateStr());
const salesOrders = ref([]);

function loadSalesOrders() {
  const rawList = loadSalesOrdersRaw();
  salesOrders.value = (Array.isArray(rawList) ? rawList : []).map((o) => ({
    saleOrderNo: o.saleOrderNo ?? '',
    createdAt: o.createdAt ?? '',
    patient: o.patient ?? null,
    prescription: o.prescription ?? null,
    items: Array.isArray(o.items) ? o.items : [],
    totalAmount: o.totalAmount ?? 0,
  }));
}

// 销售时间显示与筛选均按本地日期（年月日），避免时区导致新开单不显示
function formatSaleDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const filteredSalesOrders = computed(() => {
  const keyword = salesListSearchText.value?.trim();
  const dateStr = salesListSelectedDate.value;

  let list = salesOrders.value.slice();
  if (keyword) {
    list = list.filter((o) => {
      const name = o?.patient?.name ? String(o.patient.name) : '';
      return matchName(name, keyword);
    });
  }
  if (dateStr) {
    list = list.filter((o) => formatSaleDate(o.createdAt) === dateStr);
  }

  // 默认按创建时间倒序
  list.sort((a, b) => {
    const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  return list;
});

// 退货弹窗
const returnModalVisible = ref(false);
const returnOrder = ref(null);
const returnReason = ref('');
const returnSelectedIndices = ref([]);
const returnAmount = ref(0);

function openReturnModal(order) {
  returnOrder.value = order;
  returnReason.value = '';
  returnSelectedIndices.value = [];
  returnAmount.value = 0;
  returnModalVisible.value = true;
}

function closeReturnModal() {
  returnModalVisible.value = false;
  returnOrder.value = null;
}

function toggleReturnItem(idx, checked) {
  const order = returnOrder.value;
  const items = order?.items || [];
  const it = items[idx];
  const itemAmount = (it?.quantity ?? 0) * (it?.salePrice ?? 0);

  const arr = returnSelectedIndices.value.slice();
  if (checked) {
    arr.push(idx);
    returnAmount.value = (returnAmount.value ?? 0) + itemAmount;
  } else {
    arr.splice(arr.indexOf(idx), 1);
    returnAmount.value = Math.max(0, (returnAmount.value ?? 0) - itemAmount);
  }
  returnSelectedIndices.value = arr;
}

function setReturnAmountFull() {
  const order = returnOrder.value;
  if (!order) return;
  const items = order.items || [];
  // 全部选中所有商品
  returnSelectedIndices.value = items.map((_, i) => i);
  returnAmount.value = order.totalAmount ?? 0;
}

function submitReturn() {
  const order = returnOrder.value;
  if (!order) return;

  const items = order.items || [];
  const selectedItems = returnSelectedIndices.value
    .slice()
    .sort((a, b) => a - b)
    .map((i) => items[i])
    .filter(Boolean);

  const list = loadReturnOrdersRaw();
  const payload = {
    returnOrderNo: generateReturnOrderNo(),
    createdAt: new Date().toISOString(),
    patientName: order.patient?.name ?? '',
    originalSaleOrderNo: order.saleOrderNo ?? '',
    items: selectedItems.map((it) => ({
      productName: it.productName,
      paramsText: it.paramsText,
      quantity: it.quantity,
      retailPrice: it.retailPrice,
      salePrice: it.salePrice,
    })),
    returnReason: returnReason.value?.trim() ?? '',
    returnAmount: returnAmount.value ?? 0,
  };

  const newList = Array.isArray(list) ? list.concat(payload) : [payload];
  saveReturnOrdersRaw(newList);

  loadReturnOrders();
  returnListSearchText.value = '';
  returnListSelectedDate.value = getTodayDateStr();
  closeReturnModal();
  message.success('退货已提交');
  activeTabKey.value = 'return-list';
}

// --------------------
// 退货列表页（退货列表 tab）
// --------------------
const returnListSearchText = ref('');
const returnListSelectedDate = ref(getTodayDateStr());
const returnOrders = ref([]);

function loadReturnOrders() {
  const rawList = loadReturnOrdersRaw();
  returnOrders.value = (Array.isArray(rawList) ? rawList : []).map((o) => ({
    returnOrderNo: o.returnOrderNo ?? '',
    createdAt: o.createdAt ?? '',
    patientName: o.patientName ?? '',
    originalSaleOrderNo: o.originalSaleOrderNo ?? '',
    items: Array.isArray(o.items) ? o.items : [],
    returnReason: o.returnReason ?? '',
    returnAmount: o.returnAmount ?? 0,
  }));
}

function formatReturnDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const filteredReturnOrders = computed(() => {
  const keyword = returnListSearchText.value?.trim();
  const dateStr = returnListSelectedDate.value;

  let list = returnOrders.value.slice();
  if (keyword) {
    list = list.filter((o) => {
      const name = o?.patientName ? String(o.patientName) : '';
      return name.includes(keyword);
    });
  }
  if (dateStr) {
    list = list.filter((o) => formatReturnDate(o.createdAt) === dateStr);
  }

  list.sort((a, b) => {
    const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  return list;
});

// --------------------
// 售后列表页（售后列表 tab）：仅显示至少包含一个「1年售后」商品的销售单
// --------------------
const aftersaleSubTabKey = ref('pending'); // 待售后列表 | 已售后列表
const aftersaleListSearchText = ref('');
const aftersaleListSelectedDate = ref(getTodayDateStr());
const aftersaleListSaleOrderNo = ref('');

function getAftersaleExpiryDate(createdAt) {
  if (!createdAt) return '—';
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '—';
  d.setFullYear(d.getFullYear() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getAftersaleRemainingDays(createdAt) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (24 * 60 * 60 * 1000));
}

function aftersaleExpiryLabel(createdAt) {
  const days = getAftersaleRemainingDays(createdAt);
  if (days === null) return '—';
  if (days < 0) return `已过期${-days}天`;
  return `剩余${days}天`;
}

// 已售后：销售单号集合，售后弹窗确认后写入并持久化
function loadAftersaleCompletedOrderNos() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(AFTERSALE_COMPLETED_STORAGE_KEY) : null;
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}
function saveAftersaleCompletedOrderNos(nos) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(AFTERSALE_COMPLETED_STORAGE_KEY, JSON.stringify(nos || []));
}
const aftersaleCompletedOrderNos = ref(loadAftersaleCompletedOrderNos());
function isAftersaleOrderCompleted(order) {
  const no = order?.saleOrderNo;
  return no && aftersaleCompletedOrderNos.value.includes(no);
}
function markAftersaleOrderCompleted(saleOrderNo) {
  if (!saleOrderNo || aftersaleCompletedOrderNos.value.includes(saleOrderNo)) return;
  const next = aftersaleCompletedOrderNos.value.slice();
  next.push(saleOrderNo);
  aftersaleCompletedOrderNos.value = next;
  saveAftersaleCompletedOrderNos(next);
}

// 已售后商品：按单号存储 { saleOrderNo: [{ productName, eyeSide, paramText, quantity, retailPrice }] }
function loadAftersaleCompletedDetails() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(AFTERSALE_COMPLETED_DETAILS_KEY) : null;
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === 'object' ? obj : {};
  } catch (_) {
    return {};
  }
}
function saveAftersaleCompletedDetails(details) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(AFTERSALE_COMPLETED_DETAILS_KEY, JSON.stringify(details || {}));
}
const aftersaleCompletedDetails = ref(loadAftersaleCompletedDetails());
function getAftersaleCompletedNewItems(saleOrderNo) {
  const list = aftersaleCompletedDetails.value[saleOrderNo];
  return Array.isArray(list) ? list : [];
}
function setAftersaleCompletedNewItems(saleOrderNo, newItems) {
  const next = { ...aftersaleCompletedDetails.value };
  next[saleOrderNo] = newItems;
  aftersaleCompletedDetails.value = next;
  saveAftersaleCompletedDetails(next);
}

// 待售后列表：按销售单号记录选中的商品下标 { saleOrderNo: [idx, ...] }
const aftersaleSelectedItems = ref({});

function isAftersaleItemSelected(saleOrderNo, idx) {
  const arr = aftersaleSelectedItems.value[saleOrderNo];
  return Array.isArray(arr) && arr.includes(idx);
}

function toggleAftersaleItemSelection(saleOrderNo, idx, checked) {
  const next = { ...aftersaleSelectedItems.value };
  const arr = next[saleOrderNo] ? next[saleOrderNo].slice() : [];
  if (checked) {
    if (!arr.includes(idx)) arr.push(idx);
  } else {
    const i = arr.indexOf(idx);
    if (i >= 0) arr.splice(i, 1);
  }
  next[saleOrderNo] = arr;
  aftersaleSelectedItems.value = next;
}

const aftersaleModalVisible = ref(false);
const aftersaleModalOrder = ref(null);

const aftersaleModalSelectedItems = computed(() => {
  const order = aftersaleModalOrder.value;
  if (!order?.saleOrderNo) return [];
  const indices = aftersaleSelectedItems.value[order.saleOrderNo] || [];
  const items = order.items || [];
  return indices.map((i) => items[i]).filter(Boolean);
});

const aftersalePrescription = ref({
  right: { sphere: '', cylinder: '', axis: '', va: '' },
  left: { sphere: '', cylinder: '', axis: '', va: '' },
  pd: '',
});

const aftersaleProductSearchText = ref('');
const aftersaleProductSearchDropdownOpen = ref(false);
let aftersaleProductSearchBlurTimer = null;

// 售后弹窗内已选商品列表（表格数据）
const aftersaleModalProductList = ref([]);

const dropdownAftersaleProductList = computed(() => {
  const kw = (aftersaleProductSearchText.value || '').trim();
  if (!kw) return [];
  return productList.value.filter((p) => matchProductSearch(p, kw)).slice(0, 50);
});

let aftersaleModalRowId = 0;
function getAftersaleModalRowId() {
  aftersaleModalRowId += 1;
  return `aftersale-row-${aftersaleModalRowId}`;
}

function getAftersalePrescriptionParamText(eyeSide) {
  const pre = aftersalePrescription.value;
  const side = eyeSide === '右眼' ? pre.right : eyeSide === '左眼' ? pre.left : null;
  if (!side) return '—';
  const s = (side.sphere ?? '').trim();
  const c = (side.cylinder ?? '').trim();
  const a = (side.axis ?? '').trim();
  const parts = [];
  if (s) parts.push(s);
  if (c) parts.push(a ? `${c}×${a}°` : c);
  return parts.length ? parts.join(' ') : '—';
}

function addAftersaleModalProduct(product, opts = {}) {
  const rawList = getProductListRaw();
  const latest = rawList.find((p) => String(p.id) === String(product.id));
  const prod = latest != null ? latest : product;
  const noEyeDistinction = !prod.requireEyeSide && (!prod.eyeSideMode || String(prod.eyeSideMode).trim() === '');
  const eyeSide = opts.eyeSide !== undefined ? opts.eyeSide : (noEyeDistinction ? '—' : '双眼');
  const eyeSideReadOnly = opts.eyeSideReadOnly !== undefined ? opts.eyeSideReadOnly : noEyeDistinction;
  const baseRetail = prod.retailPrice != null && prod.retailPrice !== '' ? Number(prod.retailPrice) : 0;
  const retail = prod.retailPriceHalf ? baseRetail / 2 : baseRetail;
  const hasPowerRange = product.powerRangeTemplateId != null && product.powerRangeTemplateId !== '';
  const modelEnabled = !!product.modelEnabled;
  const row = {
    id: getAftersaleModalRowId(),
    productId: product.id,
    categoryName: getProductCategoryName(product),
    productName: product.name || '—',
    eyeSide,
    eyeSideReadOnly,
    hasPowerRange,
    modelEnabled,
    model: '',
    paramInput: '',
    quantity: 1,
    retailPrice: retail,
  };
  aftersaleModalProductList.value = aftersaleModalProductList.value.concat(row);
}

function removeAftersaleModalProduct(record) {
  aftersaleModalProductList.value = aftersaleModalProductList.value.filter((r) => r.id !== record.id);
}

const aftersaleModalProductColumns = [
  { title: '序号', key: 'index', width: 56, align: 'center', customRender: ({ index }) => index + 1 },
  { title: '类别', dataIndex: 'categoryName', key: 'categoryName', width: 72, align: 'center', ellipsis: true },
  { title: '商品名称', dataIndex: 'productName', key: 'productName', width: 280, align: 'center', ellipsis: false },
  {
    title: '眼别',
    dataIndex: 'eyeSide',
    key: 'eyeSide',
    width: 72,
    align: 'center',
    customRender: ({ text, record }) => {
      if (record.eyeSideReadOnly) {
        const side = record.eyeSide;
        if (side === '—' || side == null || side === '') return '';
        return h('span', side);
      }
      return h(Select, {
        value: record.eyeSide,
        options: eyeSideOptions,
        size: 'small',
        style: { width: '100%' },
        'onUpdate:value': (v) => { record.eyeSide = v; aftersaleModalProductList.value = aftersaleModalProductList.value.slice(); },
      });
    },
  },
  {
    title: '商品参数',
    key: 'paramText',
    width: 160,
    align: 'center',
    ellipsis: true,
    customRender: ({ record }) => {
      if (record.hasPowerRange) {
        return h('span', { class: 'param-prescription-text' }, getAftersalePrescriptionParamText(record.eyeSide));
      }
      if (record.modelEnabled) {
        return h(Input, {
          value: record.model,
          placeholder: '请输入型号',
          size: 'small',
          allowClear: true,
          class: 'param-input-inline',
          'onUpdate:value': (v) => { record.model = v ?? ''; aftersaleModalProductList.value = aftersaleModalProductList.value.slice(); },
        });
      }
      return h(Input, {
        value: record.paramInput,
        placeholder: '可填写',
        size: 'small',
        allowClear: true,
        class: 'param-input-inline',
        'onUpdate:value': (v) => { record.paramInput = v ?? ''; aftersaleModalProductList.value = aftersaleModalProductList.value.slice(); },
      });
    },
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 56,
    align: 'center',
    customRender: ({ text, record }) => h(InputNumber, {
      value: record.quantity,
      min: 0.01,
      step: 1,
      size: 'small',
      style: { width: '52px' },
      'onUpdate:value': (v) => {
        record.quantity = v ?? 1;
        aftersaleModalProductList.value = aftersaleModalProductList.value.slice();
      },
    }),
  },
  {
    title: '零售价格',
    dataIndex: 'retailPrice',
    key: 'retailPrice',
    width: 82,
    align: 'center',
    customRender: ({ text }) => (text != null && text !== '' ? `¥ ${Number(text).toFixed(1)}` : '—'),
  },
  {
    title: '操作',
    key: 'action',
    width: 64,
    align: 'center',
    customRender: ({ record }) => h(Button, {
      type: 'link',
      danger: true,
      size: 'small',
      icon: h(DeleteOutlined),
      onClick: () => removeAftersaleModalProduct(record),
    }, () => '删除'),
  },
];

function onAftersaleProductSearchInput() {
  aftersaleProductSearchDropdownOpen.value = true;
}

function onAftersaleProductSearchBlur() {
  aftersaleProductSearchBlurTimer = setTimeout(() => {
    aftersaleProductSearchDropdownOpen.value = false;
  }, 200);
}

function getAftersaleModalPatientId(patient) {
  if (!patient) return '';
  return getPatientId(patient) ?? '';
}

function openAftersaleModal(order) {
  if (aftersaleProductSearchBlurTimer) {
    clearTimeout(aftersaleProductSearchBlurTimer);
    aftersaleProductSearchBlurTimer = null;
  }
  aftersaleModalOrder.value = order;
  aftersalePrescription.value = {
    right: { sphere: '', cylinder: '', axis: '', va: '' },
    left: { sphere: '', cylinder: '', axis: '', va: '' },
    pd: '',
  };
  aftersaleProductSearchText.value = '';
  aftersaleModalProductList.value = [];
  aftersaleProductSearchDropdownOpen.value = false;
  aftersaleModalVisible.value = true;
}

function closeAftersaleModal() {
  aftersaleModalVisible.value = false;
  aftersaleModalOrder.value = null;
  aftersaleModalProductList.value = [];
}

function confirmAftersaleModal() {
  const order = aftersaleModalOrder.value;
  const saleOrderNo = order?.saleOrderNo;
  if (saleOrderNo) {
    markAftersaleOrderCompleted(saleOrderNo);
    // 保存本次售后新增商品明细（含光度/商品参数），供已售后列表展示
    const newItems = aftersaleModalProductList.value.map((record) => {
      let paramText = '';
      if (record.hasPowerRange) {
        paramText = getAftersalePrescriptionParamText(record.eyeSide);
      } else if (record.modelEnabled) {
        paramText = record.model ?? '';
      } else {
        paramText = record.paramInput ?? '';
      }
      return {
        productName: record.productName || '—',
        eyeSide: record.eyeSide && record.eyeSide !== '—' ? record.eyeSide : '',
        paramText: paramText || '—',
        quantity: record.quantity ?? 1,
        retailPrice: record.retailPrice != null ? record.retailPrice : 0,
      };
    });
    setAftersaleCompletedNewItems(saleOrderNo, newItems);
  }
  message.success('售后已提交');
  closeAftersaleModal();
}

function onAftersaleModalSelectProduct(p) {
  if (aftersaleProductSearchBlurTimer) {
    clearTimeout(aftersaleProductSearchBlurTimer);
    aftersaleProductSearchBlurTimer = null;
  }
  aftersaleProductSearchText.value = '';
  aftersaleProductSearchDropdownOpen.value = false;
  if (needsEyeSideSelection(p)) {
    lensEyeSideContext.value = 'aftersale';
    pendingLensProduct.value = p;
    lensEyeSideModalVisible.value = true;
    return;
  }
  addAftersaleModalProduct(p);
}

function onAftersaleClick(order) {
  const selected = aftersaleSelectedItems.value[order.saleOrderNo] || [];
  const items = order.items || [];
  const selectedItems = selected.map((i) => items[i]).filter(Boolean);
  if (selectedItems.length === 0) {
    message.warning('请先勾选要售后的商品');
    return;
  }
  openAftersaleModal(order);
}

const filteredAftersaleOrders = computed(() => {
  const keyword = aftersaleListSearchText.value?.trim();
  const dateStr = aftersaleListSelectedDate.value;
  const orderNo = aftersaleListSaleOrderNo.value?.trim();

  let list = salesOrders.value.filter((order) => {
    const items = order.items || [];
    return items.some((it) => !!it.warrantyOneYear);
  });

  if (keyword) {
    list = list.filter((o) => {
      const name = o?.patient?.name ? String(o.patient.name) : '';
      return name.includes(keyword);
    });
  }
  if (dateStr) {
    list = list.filter((o) => formatSaleDate(o.createdAt) === dateStr);
  }
  if (orderNo) {
    list = list.filter((o) => (o.saleOrderNo || '').toLowerCase().includes(orderNo.toLowerCase()));
  }

  list = list.slice();
  list.sort((a, b) => {
    const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  return list;
});

// 已售后列表：仅包含已提交过售后的单，筛选条件与待售后一致，展示内容一致（无选择列、无售后按钮，售后到期显示已售后）
const filteredCompletedAftersaleOrders = computed(() => {
  const keyword = aftersaleListSearchText.value?.trim();
  const dateStr = aftersaleListSelectedDate.value;
  const orderNo = aftersaleListSaleOrderNo.value?.trim();
  const completedSet = new Set(aftersaleCompletedOrderNos.value);
  let list = salesOrders.value.filter((order) => {
    const items = order.items || [];
    const hasWarranty = items.some((it) => !!it.warrantyOneYear);
    return hasWarranty && completedSet.has(order.saleOrderNo);
  });
  if (keyword) {
    list = list.filter((o) => {
      const name = o?.patient?.name ? String(o.patient.name) : '';
      return name.includes(keyword);
    });
  }
  if (dateStr) {
    list = list.filter((o) => formatSaleDate(o.createdAt) === dateStr);
  }
  if (orderNo) {
    list = list.filter((o) => (o.saleOrderNo || '').toLowerCase().includes(orderNo.toLowerCase()));
  }
  list = list.slice();
  list.sort((a, b) => {
    const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  return list;
});

// 该销售单是否已有退货记录（有则销售列表不显示退货按钮并灰色底色）
function isOrderReturned(order) {
  if (!order?.saleOrderNo) return false;
  return returnOrders.value.some((ro) => ro.originalSaleOrderNo === order.saleOrderNo);
}

// 镜片选择眼别弹窗：选中镜片时先弹出选择双眼/右眼/左眼（新建销售与售后弹窗共用）
const lensEyeSideModalVisible = ref(false);
const pendingLensProduct = ref(null);
/** 'new-sale' | 'aftersale'：弹窗来自新建销售还是售后弹窗商品检索 */
const lensEyeSideContext = ref('new-sale');

function onSelectProduct(item) {
  productSearchText.value = '';
  productSearchDropdownOpen.value = false;
  if (productSearchBlurTimer) {
    clearTimeout(productSearchBlurTimer);
    productSearchBlurTimer = null;
  }
  if (needsEyeSideSelection(item)) {
    lensEyeSideContext.value = 'new-sale';
    pendingLensProduct.value = item;
    lensEyeSideModalVisible.value = true;
    return;
  }
  addSalesProduct(item);
}

function onConfirmLensEyeSide(choice) {
  const product = pendingLensProduct.value;
  if (!product) return;
  lensEyeSideModalVisible.value = false;
  const isAftersale = lensEyeSideContext.value === 'aftersale';
  if (isAftersale) {
    if (choice === '双眼') {
      addAftersaleModalProduct(product, { eyeSide: '右眼', eyeSideReadOnly: true });
      addAftersaleModalProduct(product, { eyeSide: '左眼', eyeSideReadOnly: true });
    } else {
      addAftersaleModalProduct(product, { eyeSide: choice, eyeSideReadOnly: true });
    }
  } else {
    if (choice === '双眼') {
      addSalesProduct(product, { eyeSide: '右眼', eyeSideReadOnly: true });
      addSalesProduct(product, { eyeSide: '左眼', eyeSideReadOnly: true });
    } else {
      addSalesProduct(product, { eyeSide: choice, eyeSideReadOnly: true });
    }
  }
  pendingLensProduct.value = null;
  lensEyeSideContext.value = 'new-sale';
}

function onCancelLensEyeSideModal() {
  lensEyeSideModalVisible.value = false;
  pendingLensProduct.value = null;
  lensEyeSideContext.value = 'new-sale';
}

const salesProductColumns = [
  { title: '序号', key: 'index', width: 64, align: 'center', customRender: ({ index }) => index + 1 },
  { title: '类别', dataIndex: 'categoryName', key: 'categoryName', width: 72, align: 'center', ellipsis: true },
  {
    title: '商品名称',
    dataIndex: 'productName',
    key: 'productName',
    width: 280,
    align: 'center',
    ellipsis: false,
    customRender: ({ text, record }) => {
      const cls = getSalesProductNameStockClass(record);
      return h('span', { class: cls || undefined }, text ?? '—');
    },
  },
  {
    title: '眼别',
    dataIndex: 'eyeSide',
    key: 'eyeSide',
    width: 72,
    align: 'center',
    customRender: ({ text, record }) => {
      if (record.eyeSideReadOnly) {
        const side = record.eyeSide;
        if (side === '—' || side == null || side === '') return ''; // 未区分眼别的商品：眼别列为空，不显示
        return h('span', side);
      }
      return h(Select, {
        value: record.eyeSide,
        options: eyeSideOptions,
        size: 'small',
        style: { width: '100%' },
        'onUpdate:value': (v) => { record.eyeSide = v; salesProductList.value = salesProductList.value.slice(); },
      });
    },
  },
  {
    title: '商品参数',
    key: 'paramText',
    width: 200,
    align: 'center',
    ellipsis: true,
    customRender: ({ record }) => {
      const stockCls = getSalesParamStockClass(record);
      let inner;
      if (record.hasPowerRange) {
        inner = h('span', { class: 'param-prescription-text' }, getPrescriptionSphereCylAxis(record.eyeSide));
      } else if (record.modelEnabled) {
        inner = h(Input, {
          value: record.model,
          placeholder: '请输入型号',
          size: 'small',
          allowClear: true,
          class: 'param-input-inline',
          'onUpdate:value': (v) => { record.model = v ?? ''; salesProductList.value = salesProductList.value.slice(); },
        });
      } else {
        inner = h(Input, {
          value: record.paramInput,
          placeholder: '可填写',
          size: 'small',
          allowClear: true,
          class: 'param-input-inline',
          'onUpdate:value': (v) => { record.paramInput = v ?? ''; salesProductList.value = salesProductList.value.slice(); },
        });
      }
      return stockCls ? h('span', { class: stockCls }, inner) : inner;
    },
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 56,
    align: 'center',
    customRender: ({ text, record }) => h(InputNumber, {
      value: record.quantity,
      min: 0.01,
      step: 1,
      size: 'small',
      style: { width: '52px' },
      'onUpdate:value': (v) => {
        record.quantity = v ?? 1;
        record.salePrice = undefined;
        salesProductList.value = salesProductList.value.slice();
      },
    }),
  },
  {
    title: '零售价格',
    dataIndex: 'retailPrice',
    key: 'retailPrice',
    width: 82,
    align: 'center',
    customRender: ({ text }) => (text != null && text !== '' ? `¥ ${Number(text).toFixed(1)}` : '—'),
  },
  {
    title: '折扣',
    dataIndex: 'discount',
    key: 'discount',
    width: 68,
    align: 'center',
    customRender: ({ text, record }) => h(InputNumber, {
      value: record.discount != null ? record.discount / 10 : 10,
      min: 0.1,
      max: 10,
      step: 0.1,
      precision: 1,
      size: 'small',
      style: { width: '100%' },
      'onUpdate:value': (v) => {
        const zhe = v != null ? Number(v) : 10;
        const pct = Number.isNaN(zhe) || zhe <= 0 ? 100 : roundDiscountOneDecimal(zhe * 10);
        record.discount = pct;
        record.salePrice = undefined;
        salesProductList.value = salesProductList.value.slice();
      },
    }),
  },
  {
    title: '销售价格',
    key: 'salePrice',
    width: 82,
    align: 'center',
    customRender: ({ record }) => h(InputNumber, {
      value: getDisplaySalePrice(record),
      min: 0,
      step: 0.1,
      precision: 1,
      size: 'small',
      style: { width: '100%' },
      controls: false,
      'onUpdate:value': (v) => {
        const num = Number(v);
        if (Number.isNaN(num) || num < 0) return;
        record.salePrice = num;
        const q = Number(record.quantity);
        const r = Number(record.retailPrice);
        const base = r * q;
        if (base > 0) record.discount = roundDiscountOneDecimal((num / base) * 100);
        salesProductList.value = salesProductList.value.slice();
      },
    }),
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    align: 'center',
    customRender: ({ record }) => h(Button, {
      type: 'link',
      danger: true,
      size: 'small',
      icon: h(DeleteOutlined),
      onClick: () => removeSalesProduct(record),
    }, () => '删除'),
  },
];

// 导入主观验光弹窗：选择历史验光数据（按患者本地缓存，不重复请求）
const importRefractionModalVisible = ref(false);
const importRefractionLoading = ref(false);
const importRefractionList = ref([]);
/** 患者主观验光历史缓存：key = 患者 id/编号，value = 带主观验光的记录列表 */
const patientRefractionCache = new Map();
const importRefractionColumns = [
  { title: '序号', key: 'index', width: 56, align: 'center' },
  { title: '检查日期', dataIndex: 'examination_date', key: 'examination_date', width: 110, customRender: ({ text }) => formatExamDate(text) },
  { title: '右眼球镜/柱镜×轴位', key: 'right_eye', width: 180, customRender: ({ record }) => formatSubjectivePrescription(record, 'right') },
  { title: '左眼球镜/柱镜×轴位', key: 'left_eye', width: 180, customRender: ({ record }) => formatSubjectivePrescription(record, 'left') },
  { title: '', key: 'action', width: 80 },
];

function formatExamDate(val) {
  if (!val) return '-';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatSubjectivePrescription(record, side) {
  const pre = side === 'right' ? 'subjective_right_' : 'subjective_left_';
  const s = record[pre + 'spherical'];
  const c = record[pre + 'cylindrical'];
  const a = record[pre + 'axis'];
  const parts = [];
  if (s != null && s !== '') {
    const num = Number(s);
    const signChar = num < 0 ? '-' : (record[pre + 'spherical_sign'] === '-' ? '-' : '+');
    parts.push(signChar + Math.abs(num).toFixed(2) + 'D');
  }
  if (c != null && c !== '' && Number(c) !== 0) {
    const axisPart = (a != null && a !== '') ? '×' + a + '°' : '';
    parts.push((Number(c) < 0 ? '' : '+') + Number(c).toFixed(2) + 'D' + axisPart);
  }
  return parts.length ? parts.join('/') : '-';
}
// 配镜处方表格：12 列 2 行，部分表头合并（瞳距、水平棱镜、垂直棱镜）
// 球镜：输入时若无+/-符号则一直显示提示；仅作提示，不限制编辑
function needSphereSignHint(val) {
  if (val == null || String(val).trim() === '') return false;
  const t = String(val).trim();
  if (t === '0' || t === '0.00') return false;
  return !t.startsWith('+') && !t.startsWith('-');
}
const sphereHintText = '请填写+/-';
// 柱镜：与球镜一致，输入时若无+/-符号则显示提示
function needCylinderSignHint(val) {
  if (val == null || String(val).trim() === '') return false;
  const t = String(val).trim();
  if (t === '0' || t === '0.00') return false;
  return !t.startsWith('+') && !t.startsWith('-');
}

const prescriptionColumns = [
  { title: '眼别', dataIndex: 'col1', key: 'col1', width: 80 },
  {
    title: '球镜（D）',
    dataIndex: 'col2',
    key: 'col2',
    width: 80,
    customRender: ({ text, record }) => {
      const val = record.col2;
      const rowKey = record.key;
      // 若无符号则用 Tooltip 悬浮一直显示，切换到其他单元格编辑时也保持提示
      const showHint = needSphereSignHint(val);
      const input = h(Input, {
        value: val,
        placeholder: '请填写+/-',
        class: 'prescription-input',
        'onUpdate:value': (v) => {
          record.col2 = v ?? '';
          prescriptionData.value = prescriptionData.value.slice();
          nextTick(() => {
            const el = document.querySelector(
              `.prescription-table [data-row-key="${rowKey}"][data-col="col2"] input`
            );
            el?.focus();
          });
        },
      });
      const wrap = h('span', { class: 'prescription-input-wrap', 'data-row-key': rowKey, 'data-col': 'col2' }, [input]);
      return h(Tooltip, {
        title: sphereHintText,
        open: showHint,
      }, { default: () => h('div', { class: 'cell-sphere-wrap' }, [wrap]) });
    },
  },
  {
    title: '柱镜（D）',
    dataIndex: 'col3',
    key: 'col3',
    width: 80,
    customRender: ({ text, record }) => {
      const val = record.col3;
      const rowKey = record.key;
      const showHint = needCylinderSignHint(val);
      // 文本框不显示默认负号：空或仅 '-' 时显示为空
      const displayVal = (val == null || val === '' || String(val).trim() === '-') ? '' : String(val);
      const input = h(Input, {
        value: displayVal,
        placeholder: '请填写+/-',
        class: 'prescription-input prescription-cylinder-input',
        'onUpdate:value': (v) => {
          record.col3 = v ?? '';
          prescriptionData.value = prescriptionData.value.slice();
          nextTick(() => {
            const el = document.querySelector(
              `.prescription-table [data-row-key="${rowKey}"][data-col="col3"] input`
            );
            el?.focus();
          });
        },
      });
      const wrap = h('span', { class: 'prescription-input-wrap', 'data-row-key': rowKey, 'data-col': 'col3' }, [input]);
      return h(Tooltip, {
        title: sphereHintText,
        open: showHint,
      }, { default: () => h('div', { class: 'cell-sphere-wrap' }, [wrap]) });
    },
  },
  {
    title: '轴位（°）',
    dataIndex: 'col4',
    key: 'col4',
    width: 80,
    customRender: ({ text, record }) => {
      const val = record.col4 ?? '';
      const cStr = String(record.col3 ?? '').trim();
      const cylinderHasValue = cStr !== '' && cStr !== '-' && cStr.replace(/^[+-]/, '').trim() !== '';
      const axisEmpty = val == null || String(val).trim() === '';
      const showAxisHint = cylinderHasValue && axisEmpty;
      const axisNum = val === '' ? NaN : parseFloat(val);
      const axisOver180 = !axisEmpty && !isNaN(axisNum) && axisNum > 180;
      const axisTooltipOpen = showAxisHint || axisOver180;
      const axisTooltipTitle = axisOver180 ? '轴位超过180°' : (showAxisHint ? '请填写轴位' : '');
      const input = h(Input, {
        value: val,
        placeholder: '0',
        class: 'prescription-input',
        'onUpdate:value': (v) => {
          const s = String(v ?? '').replace(/\D/g, '');
          record.col4 = s;
          prescriptionData.value = prescriptionData.value.slice();
        },
        onKeydown: (e) => {
          if (e.key === '.' || e.key === '+' || e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
        },
      });
      return h(Tooltip, { title: axisTooltipTitle, open: axisTooltipOpen }, { default: () => h('div', { class: 'axis-cell-wrap' }, [input]) });
    },
  },
  {
    title: '矫正视力',
    dataIndex: 'col5',
    key: 'col5',
    width: 80,
    customRender: ({ text, record }) => {
      const input = h(Input, {
        value: record.col5 ?? '',
        placeholder: '如 1.0+2',
        class: 'prescription-input',
        'onUpdate:value': (v) => {
          record.col5 = v ?? '';
          prescriptionData.value = prescriptionData.value.slice();
        },
      });
      return h('div', { class: 'axis-cell-wrap' }, [input]);
    },
  },
  {
    title: '瞳距（mm）',
    key: 'pd',
    children: [
      {
        title: '双眼瞳距',
        dataIndex: 'col6',
        key: 'col6',
        width: 80,
        customRender: ({ text, record, index }) => {
          if (index !== 0) {
            return { children: null, props: { rowSpan: 0 } };
          }
          const input = h(Input, {
            value: record.col6 ?? '',
            placeholder: '双眼瞳距',
            class: 'prescription-input',
            'onUpdate:value': (v) => {
              record.col6 = v ?? '';
              const other = prescriptionData.value.find((r) => r.key !== record.key);
              if (other) other.col6 = v ?? '';
              nextTick(() => { prescriptionData.value = prescriptionData.value.slice(); });
            },
          });
          const cellContent = h('div', { class: 'pd-merged-cell' }, [input]);
          return { children: cellContent, props: { rowSpan: 2 } };
        },
      },
      {
        title: '单眼瞳距',
        dataIndex: 'col7',
        key: 'col7',
        width: 80,
        customRender: ({ text, record }) => {
          const isRight = record.key === '1';
          return h(Input, {
            value: record.col7 ?? '',
            placeholder: isRight ? '右眼瞳距' : '左眼瞳距',
            class: 'prescription-input',
            'onUpdate:value': (v) => {
              record.col7 = v ?? '';
              nextTick(() => { prescriptionData.value = prescriptionData.value.slice(); });
            },
          });
        },
      },
    ],
  },
  {
    title: '下加光（D）',
    dataIndex: 'col8',
    key: 'col8',
    width: 80,
    customRender: ({ text, record }) => {
      const raw = record.col8;
      const numPart = (raw === '+' || raw == null || raw === '') ? '' : String(raw).replace(/^\+/, '');
      return h(Input, {
        value: numPart,
        placeholder: '0.00',
        class: 'prescription-input prescription-add-input',
        'onUpdate:value': (v) => {
          let s = (v ?? '').replace(/[^\d.]/g, '').replace(/^\./, '0.').replace(/(\..*)\./g, '$1');
          record.col8 = s === '' ? '+' : '+' + s;
          nextTick(() => { prescriptionData.value = prescriptionData.value.slice(); });
        },
        onKeydown: (e) => {
          if (e.key === '-' || e.key === '+') e.preventDefault();
        },
      }, {
        prefix: () => h('span', { class: 'add-plus-inline' }, '+'),
      });
    },
  },
  {
    title: '水平棱镜（△）',
    key: 'horizontalPrism',
    children: [
      {
        title: '棱镜方向',
        dataIndex: 'col9',
        key: 'col9',
        width: 80,
        customRender: ({ record }) => {
          return h(Select, {
            value: record.col9 || undefined,
            placeholder: 'BI/BO',
            allowClear: true,
            options: [
              { label: 'BI', value: 'BI' },
              { label: 'BO', value: 'BO' },
            ],
            class: 'prescription-input prescription-select',
            'onUpdate:value': (v) => {
              record.col9 = v ?? '';
              nextTick(() => { prescriptionData.value = prescriptionData.value.slice(); });
            },
          });
        },
      },
      {
        title: '棱镜度',
        dataIndex: 'col10',
        key: 'col10',
        width: 80,
        customRender: ({ record }) => {
          return h(Input, {
            value: record.col10 ?? '',
            placeholder: record.key === '1' ? '右眼棱镜度' : '左眼棱镜度',
            class: 'prescription-input',
            'onUpdate:value': (v) => {
              record.col10 = v ?? '';
              nextTick(() => { prescriptionData.value = prescriptionData.value.slice(); });
            },
          });
        },
      },
    ],
  },
  {
    title: '垂直棱镜（△）',
    key: 'verticalPrism',
    children: [
      {
        title: '棱镜方向',
        dataIndex: 'col11',
        key: 'col11',
        width: 80,
        customRender: ({ record }) => {
          return h(Select, {
            value: record.col11 || undefined,
            placeholder: 'BU/BD',
            allowClear: true,
            options: [
              { label: 'BU', value: 'BU' },
              { label: 'BD', value: 'BD' },
            ],
            class: 'prescription-input prescription-select',
            'onUpdate:value': (v) => {
              record.col11 = v ?? '';
              nextTick(() => { prescriptionData.value = prescriptionData.value.slice(); });
            },
          });
        },
      },
      {
        title: '棱镜度',
        dataIndex: 'col12',
        key: 'col12',
        width: 80,
        customRender: ({ record }) => {
          return h(Input, {
            value: record.col12 ?? '',
            placeholder: record.key === '1' ? '右眼棱镜度' : '左眼棱镜度',
            class: 'prescription-input',
            'onUpdate:value': (v) => {
              record.col12 = v ?? '';
              nextTick(() => { prescriptionData.value = prescriptionData.value.slice(); });
            },
          });
        },
      },
    ],
  },
];
const prescriptionData = ref([
  { key: '1', col1: '右眼', col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '+', col9: '', col10: '', col11: '', col12: '' },
  { key: '2', col1: '左眼', col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '+', col9: '', col10: '', col11: '', col12: '' },
]);
// 从 localStorage 读取患者列表（与患者列表页同源）
function loadPatientList() {
  try {
    const raw = localStorage.getItem('patientlist');
    if (raw) {
      const data = JSON.parse(raw);
      patientList.value = Array.isArray(data) ? data : [];
    } else {
      patientList.value = [];
    }
  } catch (e) {
    console.warn('加载患者列表失败', e);
    patientList.value = [];
  }
}

// 性别显示：英文转中文
function formatGender(gender) {
  if (gender == null || gender === '') return '—';
  const g = String(gender).toLowerCase();
  if (g === 'male' || g === '男') return '男';
  if (g === 'female' || g === '女') return '女';
  return gender;
}
// 根据出生日期计算年龄
function formatAge(birthDate) {
  if (!birthDate) return '—';
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return '—';
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? String(age) : '—';
}

// 提取患者编号（与建档患者列表、患者列表中“患者编号”一致）：优先 patientId（开单保存的），再 identifiers 中数字最长的，再 id / patient_id / gkid
function getPatientId(record) {
  if (!record) return null;
  if (record.patientId != null && record.patientId !== '') return String(record.patientId).trim();
  const ids = record.identifiers;
  if (ids && Array.isArray(ids) && ids.length > 0) {
    let maxLen = 0;
    let result = null;
    ids.forEach((id) => {
      const m = id ? id.match(/\d+/) : null;
      if (m && m[0].length > maxLen) {
        maxLen = m[0].length;
        result = m[0];
      }
    });
    if (result) return result;
  }
  const direct = record.id ?? record.patient_id ?? record.gkid;
  if (direct != null && direct !== '') return String(direct).trim();
  return null;
}

// 建档患者列表中的患者编号：仅从 identifiers 中取数字最长的（与 PatientList 建档患者列表列一致，避免取到档案编号）
function getArchivedListPatientId(record) {
  if (!record) return null;
  const ids = record.identifiers;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return null;
  let maxLen = 0;
  let result = null;
  ids.forEach((id) => {
    const m = id ? id.match(/\d+/) : null;
    if (m && m[0].length > maxLen) {
      maxLen = m[0].length;
      result = m[0];
    }
  });
  return result;
}

// 提取档案编号（identifiers 中数字最短的，需至少两条）
function getArchiveId(record) {
  const ids = record?.identifiers;
  if (!ids || !Array.isArray(ids) || ids.length < 2) return null;
  let minLen = Infinity;
  let result = null;
  ids.forEach((id) => {
    const m = id ? id.match(/\d+/) : null;
    if (m && m[0].length < minLen) {
      minLen = m[0].length;
      result = m[0];
    }
  });
  return result;
}

// 姓名匹配：中文 + 拼音首字母
function matchName(name, search) {
  if (!name || !search) return false;
  const s = search.toLowerCase().trim();
  const n = name.trim();
  if (n.indexOf(s) !== -1) return true;
  try {
    const initials = pinyin(n, { toneType: 'none', pattern: 'first' }).replace(/\s+/g, '').toLowerCase();
    if (initials.indexOf(s) !== -1) return true;
    const full = pinyin(n, { toneType: 'none', pattern: 'pinyin' }).replace(/\s+/g, '').toLowerCase();
    if (full.indexOf(s) !== -1) return true;
  } catch (_) {}
  return false;
}

// 当日日期 YYYY-MM-DD
function getTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// 从 latestexamdate 等字段解析出 YYYY-MM-DD
function getExamDateStr(item) {
  const val = item?.latestexamdate ?? item?.createDate;
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 当日检查的患者（最近检查日期为今天）
const todayExaminedPatientList = computed(() => {
  const list = patientList.value;
  const today = getTodayDateStr();
  return list.filter((item) => getExamDateStr(item) === today);
});

const filteredPatientList = computed(() => {
  const list = patientList.value;
  const search = patientSearchText.value?.trim();
  if (!search) return [];
  return list.filter((item) => matchName(item.name, search));
});

// 下拉展示：无检索词时显示当日检查的患者，有检索词时显示按姓名/拼音过滤结果
const dropdownPatientList = computed(() => {
  const search = patientSearchText.value?.trim();
  if (search) return filteredPatientList.value.slice(0, 50);
  return todayExaminedPatientList.value.slice(0, 50);
});

function onPatientSearchInput() {
  patientSearchDropdownOpen.value = true;
}

function onPatientSearchFocus() {
  if (patientSearchBlurTimer) {
    clearTimeout(patientSearchBlurTimer);
    patientSearchBlurTimer = null;
  }
  patientSearchDropdownOpen.value = true;
}

let patientSearchBlurTimer = null;
function onPatientSearchBlur() {
  patientSearchBlurTimer = setTimeout(() => {
    patientSearchDropdownOpen.value = false;
    patientSearchBlurTimer = null;
  }, 400);
}

function onSelectPatient(item) {
  selectedPatient.value = item;
  patientSearchText.value = item?.name ?? '';
  patientSearchDropdownOpen.value = false;
  if (patientSearchBlurTimer) {
    clearTimeout(patientSearchBlurTimer);
    patientSearchBlurTimer = null;
  }
}

const patientColumns = [
  { title: '患者编号', key: 'patientId', dataIndex: 'patientId', width: 120 },
  { title: '档案编号', key: 'archiveId', dataIndex: 'archiveId', width: 120 },
  { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 120 },
  { title: '性别', dataIndex: 'gender', key: 'gender', width: 60 },
  { title: '出生日期', dataIndex: 'birthDate', key: 'birthDate', width: 110 },
];

function openAddTempPatient() {
  if (typeof window !== 'undefined' && window.openTab) {
    window.openTab('patient-list');
  }
}

function onImportSubjectiveRefraction() {
  // 导入主觉验光：待实现（可对接验光数据并回填配镜处方，此时 selectedPatient 为当前患者）
}

function getPatientRefractionCacheKey(patient) {
  if (!patient) return '';
  return String(patient.id ?? patient.patient_id ?? getPatientId(patient) ?? '');
}

async function loadPatientRefractionHistory(patient) {
  const apiPatientId = getPatientRefractionCacheKey(patient);
  if (!apiPatientId) {
    importRefractionList.value = [];
    return;
  }
  // 优先从本地缓存取，不重复请求
  const cached = patientRefractionCache.get(apiPatientId);
  if (cached !== undefined) {
    importRefractionList.value = cached;
    return;
  }
  importRefractionLoading.value = true;
  importRefractionList.value = [];
  try {
    const csrftoken = localStorage.getItem('csrftoken');
    const response = await fetch('https://aiforoptometry.com/medicalrecords/allrecords_patient_id_2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken || '' },
      body: JSON.stringify({ patient_id: apiPatientId }),
      credentials: 'include',
    });
    const data = await response.json();
    const records = data?.examination_records || [];
    const withSubjective = records.filter((r) => {
      const has = (r.subjective_right_spherical != null && r.subjective_right_spherical !== '') ||
        (r.subjective_left_spherical != null && r.subjective_left_spherical !== '') ||
        (r.subjective_right_cylindrical != null && r.subjective_right_cylindrical !== '') ||
        (r.subjective_left_cylindrical != null && r.subjective_left_cylindrical !== '');
      return has;
    });
    withSubjective.sort((a, b) => {
      const ta = a.examination_date ? new Date(a.examination_date).getTime() : 0;
      const tb = b.examination_date ? new Date(b.examination_date).getTime() : 0;
      return tb - ta;
    });
    importRefractionList.value = withSubjective;
    patientRefractionCache.set(apiPatientId, withSubjective);
  } catch (e) {
    console.warn('加载历史验光失败', e);
    message.error('加载历史验光数据失败');
  } finally {
    importRefractionLoading.value = false;
  }
}

function s2Sphere(v, sign) {
  if (v == null || v === '') return '';
  const num = Number(v);
  const signChar = num < 0 ? '-' : (sign === '-' ? '-' : '+');
  return signChar + Math.abs(num).toFixed(2);
}

/** 导入时格式化柱镜：保留正负号，格式为 +x.xx 或 -x.xx */
function s2Cylinder(v) {
  if (v == null || v === '') return '';
  const num = Number(v);
  if (Number.isNaN(num)) return String(v).trim() !== '' ? String(v) : '';
  const signChar = num < 0 ? '-' : '+';
  return signChar + Math.abs(num).toFixed(2);
}

/** 导入时拼接矫正视力：值 + 上标（如 1.0+2），与验光页「值+符号+个数」一致 */
function buildVisionCol5(value, sign, level) {
  if (value == null || value === '') return '';
  const v = String(value).trim();
  if (!v) return '';
  const s = sign === '-' ? '-' : '+';
  const n = level != null && level !== '' ? String(level).trim() : '';
  if (n !== '') return v + s + n;
  if (s === '-') return v + s;
  return v;
}

/** 与主观验光一致：解析「1.0+2」「0.8」等输入为 { value, sign, number } */
function parseVisionCombinedInput(str) {
  if (str === null || str === undefined) str = '';
  const s = String(str).trim();
  if (!s) return { value: '', sign: '+', number: '' };
  const match = s.match(/^(\d+(?:\.\d*)?)\s*([+-])?\s*(\d*)$/);
  if (!match) {
    const signIdx = s.search(/[+-]/);
    if (signIdx > 0) {
      const valuePart = s.slice(0, signIdx).trim();
      const rest = s.slice(signIdx);
      const numMatch = rest.match(/^([+-])(\d*)$/);
      if (valuePart && numMatch) {
        const value = /^\d+(?:\.\d*)?$/.test(valuePart) ? valuePart : '';
        return { value, sign: numMatch[1], number: numMatch[2] || '' };
      }
    }
    return { value: s.replace(/[^0-9.]/g, ''), sign: '+', number: '' };
  }
  const value = match[1] || '';
  const sign = (match[2] === '-' ? '-' : '+');
  const number = match[3] || '';
  return { value, sign, number };
}
/** 与主观验光一致：由 { value, sign, number } 得到展示/存储字符串 */
function getVisionCombinedDisplayString(eyeData) {
  if (!eyeData) return '';
  const value = (eyeData.value != null && eyeData.value !== '') ? String(eyeData.value).trim() : '';
  if (!value) return '';
  const sign = eyeData.sign === '-' ? '-' : '+';
  const number = (eyeData.number != null && eyeData.number !== '') ? String(eyeData.number).trim() : '';
  if (number !== '') return value + sign + number;
  if (sign === '-') return value + sign;
  return value;
}
/** 解析矫正视力字符串为「主值 + 上标」用于显示（如 "1.0+2" -> valuePart "1.0", superscriptPart "+2"） */
function parseVisionDisplayParts(str) {
  if (str == null || String(str).trim() === '') return { valuePart: '', superscriptPart: '' };
  const s = String(str).trim();
  const m = s.match(/^(.+?)([+-]\d+)$/);
  if (m) return { valuePart: m[1], superscriptPart: m[2] };
  return { valuePart: s, superscriptPart: '' };
}

function applyRefractionToPrescription(record) {
  const row1 = prescriptionData.value[0];
  const row2 = prescriptionData.value[1];
  if (!row1 || !row2) return;
  row1.col2 = s2Sphere(record.subjective_right_spherical, record.subjective_right_spherical_sign);
  row1.col3 = s2Cylinder(record.subjective_right_cylindrical);
  row1.col4 = record.subjective_right_axis != null && record.subjective_right_axis !== '' ? String(record.subjective_right_axis) : '';
  // 矫正视力仅作输入框，不随导入数据填充
  row2.col2 = s2Sphere(record.subjective_left_spherical, record.subjective_left_spherical_sign);
  row2.col3 = s2Cylinder(record.subjective_left_cylindrical);
  row2.col4 = record.subjective_left_axis != null && record.subjective_left_axis !== '' ? String(record.subjective_left_axis) : '';
  const pd = record.subjective_both_pupil_distance ?? record.objective_pupil_distance;
  if (pd != null && pd !== '') {
    row1.col6 = String(pd);
    row2.col6 = String(pd);
  }
  const addR = record.subjective_right_near_add_power ?? record.subjective_both_near_add_power;
  const addL = record.subjective_left_near_add_power ?? record.subjective_both_near_add_power;
  if (addR != null && addR !== '') row1.col8 = '+' + (Number(addR).toFixed(2) || '');
  if (addL != null && addL !== '') row2.col8 = '+' + (Number(addL).toFixed(2) || '');
  prescriptionData.value = prescriptionData.value.slice();
  prescriptionExamTime.value = record.examination_date ? formatExamDate(record.examination_date) : '';
  importRefractionModalVisible.value = false;
  message.success('已导入主观验光数据');
}

function onImportRefractionSelect(record) {
  applyRefractionToPrescription(record);
}

function closeImportRefractionModal() {
  importRefractionModalVisible.value = false;
}

function onImportRefractionForPatient(item) {
  if (patientSearchBlurTimer) {
    clearTimeout(patientSearchBlurTimer);
    patientSearchBlurTimer = null;
  }
  selectedPatient.value = item;
  patientSearchText.value = item?.name ?? '';
  // 先打开弹窗，再在下一帧关闭下拉，避免下拉关闭导致事件/渲染竞态弹窗不出现
  importRefractionModalVisible.value = true;
  loadPatientRefractionHistory(item);
  nextTick(() => {
    patientSearchDropdownOpen.value = false;
  });
}

function getImportRefractionModalContainer() {
  if (typeof document === 'undefined') return false;
  return document.body;
}

/** 从已选患者信息栏打开导入主观验光弹窗（不依赖下拉，保证弹窗能出现） */
function openImportRefractionModal() {
  const patient = selectedPatient.value;
  if (!patient) return;
  loadPatientRefractionHistory(patient);
  nextTick(() => {
    importRefractionModalVisible.value = true;
  });
}

onMounted(() => {
  loadPatientList();
  loadProductList();
  loadCategoryList();
  loadAttrList();
  loadSalesOrders();
  loadReturnOrders();
  if (typeof window !== 'undefined') window.checkLensStockByPower = checkLensStockByPower;
});
</script>

<style scoped>
.product-sales-page {
  padding: 16px;
}

.sales-main-tabs {
  margin-top: 0;
}

.sales-main-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 16px;
}

.new-sale-section {
  padding: 0 4px;
}

.new-sale-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.patient-search-input {
  width: 260px;
}

.new-sale-patient-table {
  margin-top: 0;
}

.field-label {
  margin-right: 8px;
  color: rgba(0, 0, 0, 0.85);
}

.prescription-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.prescription-section-header .section-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin: 0;
  padding: 0;
  border: none;
}
.prescription-exam-time {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}
.prescription-exam-time-label {
  color: rgba(0, 0, 0, 0.45);
  margin-right: 4px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin: 20px 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.patient-info-section {
  margin-top: 20px;
}
.patient-info-import-wrap {
  margin-left: 8px;
}
.patient-info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px 32px;
  padding: 12px 0;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}
.patient-info-item {
  display: inline-flex;
  align-items: center;
}
.patient-info-label {
  color: rgba(0, 0, 0, 0.45);
  margin-right: 4px;
}

.prescription-table {
  margin-bottom: 16px;
}

.product-search-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  margin-bottom: 8px;
}

.product-search-input {
  width: 320px;
}

.sales-product-list-wrap {
  margin-top: 16px;
}

.sales-product-table {
  margin-bottom: 16px;
}

/* 新建销售：库存管理商品无库存时红色、有库存时绿色（用 :deep 确保 customRender 里 h() 生成的 span 能命中） */
.sales-product-table :deep(.sales-product-stock-red),
.sales-product-table :deep(.sales-product-stock-red .param-prescription-text) {
  color: #cf1322 !important;
  font-weight: 500;
}
.sales-product-table :deep(.sales-product-stock-red .ant-input),
.sales-product-table :deep(.sales-product-stock-red input) {
  color: #cf1322;
}
.sales-product-table :deep(.sales-product-stock-green),
.sales-product-table :deep(.sales-product-stock-green .param-prescription-text) {
  color: #389e0d !important;
  font-weight: 500;
}
.sales-product-table :deep(.sales-product-stock-green .ant-input),
.sales-product-table :deep(.sales-product-stock-green input) {
  color: #389e0d;
}

.sales-product-table :deep(.ant-table-cell) {
  padding: 8px 10px;
}

.param-prescription-text {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.88);
}

/* 矫正视力：与主观验光一致，值+上标显示，点击出现原生输入框 */
.prescription-table .vision-cell-superscript.vision-edit-display.prescription-col5-display {
  cursor: pointer;
  text-align: center;
  min-height: 32px;
  line-height: 32px;
}
.prescription-table .vision-cell-superscript sup {
  font-size: 0.75em;
  margin-left: 1px;
}
.prescription-table .prescription-col5-input-wrap {
  display: block;
  width: 100%;
  min-height: 32px;
}
.prescription-table .vision-combined-input.prescription-vision-input {
  width: 100%;
  height: 32px;
  padding: 0 11px;
  font-size: 12px;
  text-align: center;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  outline: none;
  box-sizing: border-box;
}
.prescription-table .vision-combined-input.prescription-vision-input:focus {
  border-color: #4096ff;
  box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1);
}

.sales-product-table .param-input-inline {
  /* 让“商品参数”里输入框不要铺满单元格，避免遮挡或显得太宽 */
  width: 160px;
  max-width: 100%;
  margin: 0 auto;
}
/* 固定列宽，选择前后列宽不变 */
.prescription-table :deep(table) {
  table-layout: fixed;
}
/* 表头单元格：文字居中 */
.prescription-table :deep(.ant-table-thead .ant-table-cell) {
  padding: 12px 10px;
  text-align: center;
}
/* 数据行（两行）增加行高，文字居中 */
.prescription-table :deep(.ant-table-tbody .ant-table-cell) {
  padding: 16px 10px;
  min-height: 48px;
  height: 48px;
  box-sizing: border-box;
  text-align: center;
}

.cell-sphere-wrap {
  display: block;
  width: 100%;
}
.prescription-input-wrap {
  display: block;
  width: 100%;
}
.prescription-table .prescription-input {
  width: 100%;
  text-align: center;
  cursor: text;
}

/* 柱镜：符号在文本框内，与球镜一致 */
.prescription-table .prescription-cylinder-input {
  text-align: center;
}
.add-plus-inline {
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
}
.prescription-table .prescription-add-input {
  text-align: left;
}

/* 棱镜方向下拉：文本框可随选中内容变窄，列宽由 table-layout: fixed 保持不变 */

.axis-cell-wrap {
  display: block;
  width: 100%;
}

/* 瞳距双眼：合并单元格内输入框居中 */
.prescription-table :deep(.ant-table-cell) {
  vertical-align: middle;
}
.pd-merged-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}
.pd-merged-cell .prescription-input {
  width: 100%;
  max-width: 100%;
}

.placeholder-content {
  padding: 48px 24px;
  text-align: center;
  color: #999;
  min-height: 200px;
}

.import-refraction-patient-info {
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 4px;
  display: flex;
  gap: 24px;
}
.import-refraction-patient-name,
.import-refraction-patient-id {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}
.import-refraction-empty {
  padding: 24px;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
}

.lens-eye-side-modal .lens-eye-side-product {
  margin-bottom: 8px;
}
.lens-eye-side-modal .lens-eye-side-tip {
  margin-bottom: 12px;
  color: rgba(0, 0, 0, 0.65);
}
.lens-eye-side-modal .lens-eye-side-btns {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.lens-eye-side-modal .lens-eye-side-btns .ant-btn {
  min-width: 80px;
}

.sales-order-summary-bar {
  /* 用 grid 按列宽对齐到表格列位置（更接近“零售价格”列附近） */
  display: grid;
  grid-template-columns: 64px 72px 280px 72px 200px 56px 82px 68px 82px 80px;
  column-gap: 14px;
  align-items: center;
  margin-top: 12px;
  padding-left: 10px;
}

.sales-order-summary-total {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
  grid-column: 7 / 10; /* 对齐到“零售价格 + 折扣 + 销售价格”区域 */
  justify-self: end;
}

.sales-order-summary-money {
  margin-left: 6px;
}

.sales-order-summary-open-btn {
  grid-column: 10 / 11; /* 对齐到“操作”列位置 */
  justify-self: start;
}

.sales-order-modal {
  padding: 4px 2px;
}

.sales-order-modal-section {
  margin-top: 12px;
}

.sales-order-row {
  display: flex;
  flex-wrap: wrap;
  margin: 8px 0;
}

.sales-order-inline-item {
  display: inline-flex;
  align-items: baseline;
}

.sales-order-patient-one-line {
  flex-wrap: nowrap;
  margin: 8px 0;
  overflow-x: auto;
  gap: 16px;
}

.sales-order-patient-one-line .sales-order-label {
  min-width: auto;
}

.sales-order-label {
  min-width: 120px;
  color: rgba(0, 0, 0, 0.65);
}

.sales-order-value {
  color: rgba(0, 0, 0, 0.88);
}

.sales-order-prescription-line {
  margin-left: 120px;
  color: rgba(0, 0, 0, 0.88);
}

.sales-order-goods-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.sales-order-goods-table th,
.sales-order-goods-table td {
  border: 1px solid #f0f0f0;
  padding: 8px 10px;
  text-align: center;
}

.sales-order-goods-name {
  text-align: left;
}

.sales-order-total {
  margin-top: 12px;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.sales-order-total-label {
  color: rgba(0, 0, 0, 0.65);
}

.sales-order-total-value {
  color: rgba(0, 0, 0, 0.88);
}

.sales-list-page {
  padding: 8px 4px 0 4px;
}

.sales-list-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.sales-list-search-input {
  width: 220px;
}

.sales-list-date-input {
  width: 160px;
}

.sales-list-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sales-list-order {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 10px 12px;
}

/* 销售列表交替：浅灰绿 / 白色 区分每单 */
.sales-list-order-alt-green {
  background: #e8f0e8;
}
.sales-list-order-alt-white {
  background: #fff;
}

.sales-list-order-returned {
  background: #f5f5f5;
}

/* 表头底色与所在单一致 */
.sales-list-order-alt-green .sales-list-order-table th {
  background: #e8f0e8;
}
.sales-list-order-alt-white .sales-list-order-table th {
  background: #fff;
}

.sales-list-order-head {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.sales-list-order-date {
  margin-right: 12px;
}

.sales-list-order-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-size: 13px;
}

.sales-list-order-table th,
.sales-list-order-table td {
  border: 1px solid #f0f0f0;
  padding: 8px 10px;
  text-align: left;
}

.sales-list-order-table th {
  background: #fafafa;
  font-weight: 600;
  text-align: center;
}

.sales-list-td-name {
  min-width: 200px;
}

.sales-list-td-params {
  min-width: 160px;
  color: rgba(0, 0, 0, 0.65);
}

/* 数量、零售价格、销售价格：表头与数据均居中 */
.sales-list-order-table th:nth-child(3),
.sales-list-order-table th:nth-child(4),
.sales-list-order-table th:nth-child(5),
.sales-list-td-qty,
.sales-list-td-retail,
.sales-list-td-price {
  text-align: center;
}

.sales-list-td-qty {
  width: 80px;
}

.sales-list-td-retail {
  width: 100px;
}

.sales-list-td-price {
  width: 100px;
}

.sales-list-order-total {
  margin-top: 10px;
  font-weight: 700;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.sales-list-return-btn {
  padding: 0 4px;
  font-weight: 500;
}

/* 退货弹窗 */
.return-modal {
  padding: 8px 0;
}

.return-modal-row {
  margin-bottom: 16px;
}

.return-modal-row:last-child {
  margin-bottom: 0;
}

.return-modal-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.return-modal-reason {
  width: 100%;
}

.return-modal-goods {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 10px 12px;
  max-height: 200px;
  overflow-y: auto;
}

.return-modal-goods-item {
  margin-bottom: 8px;
}

.return-modal-goods-item:last-child {
  margin-bottom: 0;
}

.return-modal-amount-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.return-modal-amount-input {
  width: 140px;
}

/* 退货列表 */
.return-list-page {
  padding: 0 4px;
}

.return-list-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.return-list-search-input {
  width: 220px;
}

.return-list-date-input {
  width: 160px;
}

.return-list-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.return-list-order {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 10px 12px;
}

.return-list-order-head {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.return-list-order-date {
  margin-right: 12px;
}

.return-list-order-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-size: 13px;
}

.return-list-order-table th,
.return-list-order-table td {
  border: 1px solid #f0f0f0;
  padding: 8px 10px;
  text-align: left;
}

.return-list-order-table th {
  background: #fafafa;
  font-weight: 600;
  text-align: center;
}

.return-list-order-table th:nth-child(3),
.return-list-order-table th:nth-child(4),
.return-list-order-table th:nth-child(5),
.return-list-td-qty,
.return-list-td-retail,
.return-list-td-price {
  text-align: center;
}

.return-list-td-name {
  min-width: 200px;
}

.return-list-td-params {
  min-width: 160px;
  color: rgba(0, 0, 0, 0.65);
}

.return-list-td-qty {
  width: 80px;
}

.return-list-td-retail {
  width: 100px;
}

.return-list-td-price {
  width: 100px;
}

.return-list-order-meta {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  color: rgba(0, 0, 0, 0.65);
  font-size: 13px;
}

.return-list-reason-label {
  font-weight: 500;
  margin-right: 6px;
}

/* 售后列表 */
.aftersale-sub-tabs {
  margin-top: -8px;
}
.aftersale-sub-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}

.aftersale-list-page {
  padding: 0 4px;
}

.aftersale-list-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.aftersale-list-search-input {
  width: 220px;
}

.aftersale-list-date-input {
  width: 160px;
}

.aftersale-list-order-no-input {
  width: 200px;
}

.aftersale-list-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.aftersale-list-order {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 10px 12px;
}

/* 同一列表内交替：白色 / 浅蓝 便于区分每单 */
.aftersale-list-order-alt-purple {
  background: #fff;
}
.aftersale-list-order-alt-blue {
  background: #e6f4ff;
}


.aftersale-list-new-items-label {
  margin-top: 14px;
  margin-bottom: 6px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
}

.aftersale-list-new-items-table {
  margin-top: 0;
}

.aftersale-list-td-eye {
  width: 72px;
  text-align: center;
}

.aftersale-list-order-head {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.aftersale-expiry {
  margin-right: 12px;
  color: rgba(0, 0, 0, 0.65);
  font-weight: 500;
}
.aftersale-expiry-done {
  color: #ff4d4f;
  font-weight: 600;
}

.aftersale-list-order-date {
  margin-right: 12px;
}

.aftersale-list-order-patient {
  margin-right: 12px;
}

.aftersale-list-order-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-size: 13px;
}

.aftersale-list-order-table th,
.aftersale-list-order-table td {
  border: 1px solid #d9d9d9;
  padding: 8px 10px;
  text-align: left;
}

.aftersale-list-order-table th {
  background: #fafafa;
  font-weight: 600;
  text-align: center;
}

/* 表头底色与所在单的卡片底色一致 */
.aftersale-list-order-alt-purple .aftersale-list-order-table th {
  background: #fff;
}
.aftersale-list-order-alt-blue .aftersale-list-order-table th {
  background: #e6f4ff;
}

.aftersale-list-order-table th:nth-child(4),
.aftersale-list-order-table th:nth-child(5),
.aftersale-list-order-table th:nth-child(6),
.aftersale-list-td-qty,
.aftersale-list-td-retail,
.aftersale-list-td-price {
  text-align: center;
}

.aftersale-list-th-select,
.aftersale-list-td-select {
  width: 56px;
  text-align: center;
}

.aftersale-list-td-name {
  min-width: 200px;
}

.aftersale-list-td-params {
  min-width: 160px;
  color: rgba(0, 0, 0, 0.65);
}

.aftersale-list-td-qty {
  width: 80px;
}

.aftersale-list-td-retail {
  width: 100px;
}

.aftersale-list-td-price {
  width: 100px;
}

.aftersale-list-order-total {
  margin-top: 10px;
  font-weight: 700;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.aftersale-list-btn {
  padding: 0 4px;
  font-weight: 500;
}

/* 售后弹窗 */
.aftersale-modal {
  padding: 4px 0;
}

.aftersale-modal-row {
  margin-bottom: 12px;
}

.aftersale-modal-label {
  font-weight: 500;
  margin-right: 4px;
}

.aftersale-modal-value {
  color: rgba(0, 0, 0, 0.88);
}

.aftersale-modal-section {
  margin-top: 16px;
}

.aftersale-modal-label-row {
  font-weight: 600;
  margin-bottom: 8px;
}

.aftersale-modal-goods-table,
.aftersale-modal-prescription-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 8px;
}

.aftersale-modal-goods-table th,
.aftersale-modal-goods-table td,
.aftersale-modal-prescription-table th,
.aftersale-modal-prescription-table td {
  border: 1px solid #f0f0f0;
  padding: 6px 8px;
  text-align: left;
}

.aftersale-modal-goods-table th,
.aftersale-modal-prescription-table th {
  background: #fafafa;
  font-weight: 600;
}

.aftersale-modal-section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.aftersale-modal-section-head .aftersale-modal-label-row {
  margin-bottom: 0;
}

.aftersale-modal-pd-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.aftersale-prescription-input {
  width: 100%;
}

.aftersale-pd-input {
  width: 120px;
}

.aftersale-prescription-eye {
  width: 64px;
  font-weight: 500;
}

.aftersale-product-search-input {
  width: 100%;
  max-width: 360px;
}

.aftersale-modal-product-list-wrap {
  margin-top: 4px;
}

.aftersale-modal-product-table {
  font-size: 13px;
}

.aftersale-modal-product-table :deep(.param-input-inline) {
  width: 100%;
  max-width: 140px;
}

</style>

<!-- 客户检索下拉 overlay 渲染在 body 下，需全局样式 -->
<style>
/* 选择患者历史验光数据弹窗：确保显示在最上层，不被售后等弹窗遮挡 */
.import-refraction-modal-wrap {
  z-index: 10000 !important;
}
.import-refraction-modal-wrap .ant-modal-wrap {
  z-index: 10000 !important;
}
.patient-search-dropdown-list {
  min-width: 260px;
  max-height: 280px;
  overflow-y: auto;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  padding: 4px 0;
}
.patient-search-dropdown-empty {
  padding: 12px 16px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}
.patient-search-dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.patient-search-dropdown-item:hover {
  background: #f5f5f5;
}
.patient-search-import {
  margin-left: auto;
  font-size: 12px;
  color: #1677ff;
  flex-shrink: 0;
}
.patient-search-import:hover {
  text-decoration: underline;
}
.patient-search-name {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
}
.patient-search-id {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

/* 商品检索下拉 */
.product-search-dropdown-list {
  min-width: 320px;
  max-height: 280px;
  overflow-y: auto;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  padding: 4px 0;
}
.product-search-dropdown-empty {
  padding: 12px 16px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}
.product-search-dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.product-search-dropdown-item:hover {
  background: #f5f5f5;
}
.product-search-name {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-search-price {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  flex-shrink: 0;
}
</style>
