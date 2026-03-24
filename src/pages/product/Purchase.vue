<template>
  <div class="purchase-page">
    <a-card>
      <a-tabs v-model:activeKey="mainTabKey" type="line" class="main-tabs">
        <a-tab-pane key="new" tab="新建采购">
          <div class="purchase-toolbar">
            <a-input
              v-model:value="searchKeyword"
              placeholder="商品名称检索"
              allow-clear
              style="width: 240px; margin-right: 8px"
            />
          </div>
          <a-table
            :columns="columns"
            :data-source="filteredProductList"
            :pagination="{ pageSize: 20 }"
            row-key="id"
            size="small"
            class="purchase-table"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'index'">{{ index + 1 }}</template>
              <template v-else-if="column.key === 'category'">
                {{ getCategoryName(record) }}
              </template>
              <template v-else-if="column.key === 'retailPrice'">
                {{ formatRetailPrice(record.retailPrice) }}
              </template>
              <template v-else-if="column.key === 'purchasePrice'">
                <a-input
                  :value="editingPurchasePriceId === record.id ? editingPurchasePriceValue : formatPurchasePriceDisplay(record.purchasePrice)"
                  size="small"
                  style="width: 100%; text-align: center"
                  @input="(e) => onPurchasePriceInput(record.id, e.target.value)"
                  @focus="(e) => startEditPurchasePrice(record, e)"
                  @blur="savePurchasePrice(record)"
                />
              </template>
              <template v-else-if="column.key === 'supplier'">
                <a-button type="link" size="small" @click="openSupplierModal(record)">
                  {{ getSupplierName(record.supplierId) || '关联供应商' }}
                </a-button>
              </template>
              <template v-else-if="column.key === 'manufacturer'">
                <a-button type="link" size="small" @click="openManufacturerModal(record)">
                  {{ getManufacturerName(record.manufacturerId) || '关联生产商' }}
                </a-button>
              </template>
              <template v-else-if="column.key === 'purchaseBtn'">
                <a-button type="primary" size="small" @click="openPurchaseModal(record)">采购</a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="list" tab="采购列表">
          <a-tabs v-model:activeKey="listSubTabKey" type="line" class="sub-tabs">
            <a-tab-pane key="plan" tab="采购计划单">
              <div class="plan-section">
                <a-table
                  :columns="planEntryColumns"
                  :data-source="purchasePlanList"
                  :pagination="{ pageSize: 20 }"
                  row-key="orderNumber"
                  size="small"
                  class="purchase-table"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'totalAmount'">{{ formatPlanAmount(record.totalAmount) }}</template>
                    <template v-else-if="column.key === 'viewDetail'">
                      <a @click="openPlanDetailModal(record)">查看明细</a>
                    </template>
                    <template v-else-if="column.key === 'action'">
                      <span class="plan-action-cell">
                        <a class="plan-action-link" href="javascript:;" @click="onStockInClick(record)">入库</a>
                        <a-divider type="vertical" />
                        <a class="plan-action-link" @click="openPlanEditModal(record)">编辑</a>
                        <a-divider type="vertical" />
                        <a class="plan-action-link plan-action-delete" @click="deletePlanOrder(record)">删除</a>
                      </span>
                    </template>
                  </template>
                </a-table>
              </div>
            </a-tab-pane>
            <a-tab-pane key="custom" tab="销售定制单">
              <div class="placeholder-content">销售定制单 - 待开发</div>
            </a-tab-pane>
            <a-tab-pane key="zeroPurchase" tab="零采购列表">
              <div class="zero-purchase-section">
                <div class="zero-purchase-toolbar">
                  <a-select
                    v-model:value="zeroPurchaseCategoryFilter"
                    placeholder="全部类型"
                    allow-clear
                    style="width: 160px; margin-right: 8px"
                    :options="zeroPurchaseCategoryOptions"
                  />
                  <a-input
                    v-model:value="zeroPurchaseSearchKeyword"
                    placeholder="商品名称检索"
                    allow-clear
                    style="width: 240px; margin-right: 8px"
                  />
                </div>
                <a-table
                  :columns="zeroPurchaseColumns"
                  :data-source="filteredZeroPurchaseList"
                  :pagination="{ pageSize: 20 }"
                  row-key="id"
                  size="small"
                  class="purchase-table"
                >
                  <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'index'">{{ index + 1 }}</template>
                    <template v-else-if="column.key === 'category'">{{ getCategoryName(record) }}</template>
                    <template v-else-if="column.key === 'retailPrice'">{{ formatRetailPrice(record.retailPrice) }}</template>
                  </template>
                </a-table>
              </div>
            </a-tab-pane>
          </a-tabs>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 选择供应商弹窗 -->
    <a-modal
      v-model:visible="supplierModalVisible"
      title="选择供应商"
      width="560px"
      ok-text="确定"
      cancel-text="取消"
      @ok="confirmSupplier"
    >
      <a-input
        v-model:value="supplierSearch"
        placeholder="搜索供应商名称"
        allow-clear
        style="margin-bottom: 12px"
      />
      <a-table
        :columns="supplierColumns"
        :data-source="filteredSupplierList"
        :pagination="false"
        row-key="id"
        size="small"
        :row-selection="supplierRowSelection"
        :scroll="{ y: 320 }"
      >
        <template #bodyCell="{ column, index }">
          <template v-if="column.key === 'index'">{{ index + 1 }}</template>
        </template>
      </a-table>
    </a-modal>

    <!-- 选择生产商弹窗 -->
    <a-modal
      v-model:visible="manufacturerModalVisible"
      title="选择生产商"
      width="560px"
      ok-text="确定"
      cancel-text="取消"
      @ok="confirmManufacturer"
    >
      <a-input
        v-model:value="manufacturerSearch"
        placeholder="搜索生产商名称"
        allow-clear
        style="margin-bottom: 12px"
      />
      <a-table
        :columns="manufacturerColumns"
        :data-source="filteredManufacturerList"
        :pagination="false"
        row-key="id"
        size="small"
        :row-selection="manufacturerRowSelection"
        :scroll="{ y: 320 }"
      >
        <template #bodyCell="{ column, index }">
          <template v-if="column.key === 'index'">{{ index + 1 }}</template>
        </template>
      </a-table>
    </a-modal>

    <!-- 入库确认弹窗（有光度时显示光度明细；效期管理时需填生产编号、生产日期） -->
    <a-modal
      v-model:visible="stockInConfirmVisible"
      title="确认入库"
      :width="stockInHasPowerRange ? '800px' : '480px'"
      ok-text="确定"
      cancel-text="取消"
      @ok="confirmStockIn"
    >
      <template #footer>
        <div class="stock-in-modal-footer">
          <a-button v-if="stockInHasPowerRange" type="primary" @click="selectAllStockIn">全选</a-button>
          <div class="stock-in-modal-footer-right">
            <a-button @click="stockInConfirmVisible = false">取消</a-button>
            <a-button type="primary" @click="confirmStockIn">确定</a-button>
          </div>
        </div>
      </template>
      <div v-if="stockInPendingOrder" class="stock-in-confirm-body">
        <!-- 有光度范围时显示光度明细和数量（可点击选择入库：左键+1，右键取消） -->
        <div v-if="stockInHasPowerRange" class="plan-detail-content stock-in-detail">
          <p class="stock-in-table-tip">左键点击格子选择入库（每次+1），右键取消选中。</p>
          <table class="plan-detail-grid stock-in-grid" v-if="stockInDetailGrid.rows.length">
            <thead>
              <tr class="plan-detail-summary">
                <th :colspan="stockInDetailGrid.columns.length + 1">
                  光度个数：{{ stockInDetailGrid.cellCount }}，总数量：{{ stockInDetailGrid.totalQty }} {{ stockInDetailUnit }}
                </th>
              </tr>
              <tr>
                <th class="plan-detail-corner">球镜/柱镜</th>
                <th v-for="c in stockInDetailGrid.columns" :key="c" class="plan-detail-th">
                  {{ formatPowerValue(c) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in stockInDetailGrid.rows" :key="s">
                <td class="plan-detail-td-label">{{ formatSphereValue(s) }}</td>
                <td
                  v-for="c in stockInDetailGrid.columns"
                  :key="`${s}-${c}`"
                  class="plan-detail-td stock-in-cell-td"
                  :class="{ 'stock-in-cell-selected': getStockInSelectionQty(s, c) > 0 }"
                  @click="onStockInCellClick(s, c)"
                  @contextmenu.prevent="onStockInCellRightClick(s, c)"
                >
                  <span>{{ stockInDetailGrid.getQty(s, c) || '' }}</span><span v-if="getStockInSelectionQty(s, c) > 0" class="stock-in-sel-inline"> 已选{{ getStockInSelectionQty(s, c) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="stockInSelectedList.length" class="stock-in-selected-list">
            <div class="stock-in-selected-summary">
              已选镜片数量：<span class="stock-in-selected-summary-num">{{ stockInSelectedTotalPieces }}</span> {{ stockInDetailUnit }}，已选光度数量：<span class="stock-in-selected-summary-num">{{ stockInSelectedList.length }}</span>
            </div>
            <table class="stock-in-selected-table">
              <thead>
                <tr>
                  <th>选中光度</th>
                  <th>数量</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in stockInSelectedList" :key="item.key">
                  <td>{{ item.powerDesc }}</td>
                  <td class="stock-in-selected-qty-cell">
                    <span class="stock-in-selected-qty-wrap">
                      <a-button type="text" size="small" class="stock-in-qty-btn" @click="onStockInCellRightClick(item.s, item.c)">－</a-button>
                      <span class="stock-in-selected-qty-num">{{ item.quantity }}</span>
                      <a-button type="text" size="small" class="stock-in-qty-btn" @click="onStockInCellClick(item.s, item.c)">＋</a-button>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <template v-if="stockInNeedExpiry">
          <a-form layout="vertical" class="stock-in-expiry-form">
            <a-form-item label="生产编号" required>
              <a-input v-model:value="stockInExpiryForm.productionCode" placeholder="请输入生产编号" allow-clear />
            </a-form-item>
            <a-form-item label="生产日期" required>
              <a-date-picker
                v-model:value="stockInExpiryForm.productionDate"
                placeholder="请选择生产日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </a-form-item>
          </a-form>
        </template>
        <template v-else>
          <p>是否确认入库？</p>
        </template>
      </div>
    </a-modal>

    <!-- 采购弹窗：宽度随柱镜列数响应式，完整显示所有柱镜列无需横向滑动 -->
    <a-modal
      v-model:visible="purchaseModalVisible"
      class="purchase-power-modal"
      :title="purchaseProduct ? `采购 - ${purchaseProduct.name}` : '采购'"
      :width="purchaseModalWidth"
      :body-style="{ maxHeight: '85vh', overflowY: 'auto', overflowX: 'visible' }"
      ok-text="确定"
      cancel-text="取消"
      @ok="onPurchaseOkClick"
      @cancel="closePurchaseModal"
    >
      <a-form layout="vertical" v-if="purchaseProduct">
        <!-- 仅当配置了采购参数时显示对应表单项 -->
        <template v-if="purchaseParamList.length">
          <a-form-item v-for="param in purchaseParamList" :key="param.id" :label="param.name">
            <a-input
              :value="purchaseParamValues[param.name]"
              :placeholder="`请输入${param.name}`"
              allow-clear
              @update:value="(v) => setPurchaseParamValue(param.name, v)"
            />
          </a-form-item>
        </template>
        <!-- 新建商品中启用了型号时：每行显示「型号」输入框 + 「数量」输入框 -->
        <a-form-item v-if="purchaseProduct && purchaseProduct.modelEnabled" label="型号与数量">
          <div class="no-power-range-models">
            <div v-for="(row, idx) in noPowerRangeModels" :key="row.key" class="no-power-range-row">
              <span class="no-power-range-label">型号</span>
              <a-input v-model:value="row.model" placeholder="请输入型号" allow-clear class="no-power-model-input" />
              <span class="no-power-range-label">数量</span>
              <a-input-number v-model:value="row.quantity" :min="1" placeholder="数量" class="no-power-qty-input" />
              <a-button type="text" danger size="small" @click="removeNoPowerRangeModel(idx)" :disabled="noPowerRangeModels.length <= 1">删除</a-button>
            </div>
            <a-button type="dashed" @click="addNoPowerRangeModel" class="add-model-btn">+ 添加型号</a-button>
          </div>
        </a-form-item>
        <!-- 有光度范围时显示光度表格 -->
        <a-form-item v-if="purchaseProductHasPowerRange">
          <div class="power-range-tip purchase-power-tip">提示：点击左键增加+1数量，点击右键减少-1数量。<br /><span class="purchase-power-tip-second">左键拖拉批量选中，右键拖拉批量减少。</span></div>
          <div
            ref="purchasePowerGridWrapRef"
            class="power-range-grid-wrap purchase-modal-grid-wrap"
            @mousedown="onPurchasePowerGridMouseDown"
            @mousemove="onPurchasePowerGridMouseMove"
            @mouseup="onPurchasePowerGridMouseUp"
            @mouseleave="cancelPurchasePowerGridDrag"
            @contextmenu.prevent
          >
            <table class="power-range-table" :style="purchaseTableInlineStyle">
              <thead>
                <tr>
                  <th class="power-range-corner">球镜/柱镜</th>
                  <th v-for="c in purchaseCylinderValues" :key="c" class="power-range-th">{{ formatPowerValue(c) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in purchaseSphereValues" :key="s" :data-sphere="s">
                  <td class="power-range-td-label">{{ formatSphereValue(s) }}</td>
                  <td
                    v-for="c in purchaseCylinderValues"
                    :key="`${s}-${c}`"
                    class="power-range-td"
                    :class="{ selected: isPurchasePowerCellSelected(s, c), disabled: !isCellInTemplateRange(s, c) }"
                    :data-sphere="s"
                    :data-cylinder="c"
                  >
                    <span v-if="getQuantityForCell(s, c) != null" class="power-range-cell-qty">{{ getQuantityForCell(s, c) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </a-form-item>
        <!-- 第一行：采购数量 -->
        <a-form-item class="purchase-row-inline">
          <div class="purchase-row-inline-wrap">
            <span class="purchase-row-label">采购数量：</span>
            <template v-if="purchaseProductHasPowerRange">
              <span class="purchase-total-value">{{ purchaseConfirmTotalQty }}</span>
            </template>
            <template v-else-if="purchaseProduct && purchaseProduct.modelEnabled">
              <span class="purchase-total-value">{{ purchaseQuantitySumDisplay }}</span>
            </template>
            <a-input-number v-else v-model:value="noPowerRangeQuantity" :min="1" placeholder="数量" class="quantity-input-short" />
          </div>
        </a-form-item>
        <!-- 第二行：采购单价（只读，不可修改） -->
        <a-form-item class="purchase-row-inline">
          <div class="purchase-row-inline-wrap">
            <span class="purchase-row-label">采购单价：</span>
            <span class="purchase-total-value">{{ purchaseUnitPrice != null && purchaseUnitPrice !== '' ? '¥ ' + Number(purchaseUnitPrice).toFixed(2) : '-' }}</span>
          </div>
        </a-form-item>
        <!-- 第三行：采购金额 -->
        <a-form-item class="purchase-row-inline">
          <div class="purchase-row-inline-wrap">
            <span class="purchase-row-label">采购金额：</span>
            <span class="purchase-total-value">{{ purchaseTotal != null ? '¥ ' + purchaseTotal : '-' }}</span>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 确认弹窗：商品名称、选中光度的数量 -->
    <a-modal
      v-model:visible="purchaseConfirmVisible"
      title="确认采购"
      width="420px"
      :body-style="{ maxHeight: '85vh', overflowY: 'auto' }"
      ok-text="确定"
      cancel-text="取消"
      @ok="doConfirmPurchase"
      @cancel="onPurchaseConfirmCancel"
    >
      <div class="purchase-confirm-content" v-if="purchaseProduct">
        <p><strong>商品名称：</strong>{{ purchaseProduct.name }}</p>
        <template v-if="purchaseConfirmDetailList.length">
          <div class="confirm-table-wrap">
          <table class="purchase-confirm-table">
            <thead>
              <tr class="confirm-table-summary">
                <td colspan="3">选择的光度个数：{{ purchaseConfirmDetailList.length }}，总数量：{{ purchaseConfirmTotalQty }} {{ purchaseUnit }}</td>
              </tr>
              <tr>
                <th>序号</th>
                <th>光度明细</th>
                <th>数量（{{ purchaseUnit }}）</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in purchaseConfirmDetailList" :key="item.powerLabel">
                <td>{{ index + 1 }}</td>
                <td>{{ item.powerLabel }}</td>
                <td>{{ item.quantity }}</td>
              </tr>
            </tbody>
          </table>
          </div>
        </template>
        <p v-else>未选择光度，将按数量 1 加入计划。</p>
      </div>
    </a-modal>

    <!-- 采购计划单 - 查看明细：该整单的光度范围表格（纵坐标球镜、横坐标柱镜） -->
    <a-modal
      v-model:visible="planDetailVisible"
      :title="planDetailOrder ? `明细 - ${planDetailOrder.productName}` : '查看明细'"
      width="800px"
      :footer="null"
    >
      <div v-if="planDetailOrder" class="plan-detail-content">
        <table class="plan-detail-grid" v-if="planDetailGrid.rows.length">
          <thead>
            <tr class="plan-detail-summary">
              <th :colspan="planDetailGrid.columns.length + 1">光度个数：{{ planDetailGrid.cellCount }}，总数量：{{ planDetailGrid.totalQty }} {{ planDetailUnit }}</th>
            </tr>
            <tr>
              <th class="plan-detail-corner">球镜/柱镜</th>
              <th v-for="c in planDetailGrid.columns" :key="c" class="plan-detail-th">{{ formatPowerValue(c) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in planDetailGrid.rows" :key="s">
              <td class="plan-detail-td-label">{{ formatSphereValue(s) }}</td>
              <td v-for="c in planDetailGrid.columns" :key="`${s}-${c}`" class="plan-detail-td">
                {{ planDetailGrid.getQty(s, c) || '' }}
              </td>
            </tr>
          </tbody>
        </table>
        <table v-else-if="planDetailModelEntries.length" class="plan-detail-model-table">
          <thead>
            <tr class="plan-detail-summary">
              <th colspan="2">型号明细，总数量：{{ planDetailModelTotalQty }} {{ planDetailUnit }}</th>
            </tr>
            <tr>
              <th>型号</th>
              <th>数量（{{ planDetailUnit }}）</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(e, i) in planDetailModelEntries" :key="i">
              <td>{{ e.model }}</td>
              <td>{{ e.quantity }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="plan-detail-empty">该单无光度明细（未按光度拆分）。</p>
      </div>
    </a-modal>

    <!-- 编辑弹窗：光度范围全部显示，可左键/右键修改数量；无光度时显示型号+数量可编辑 -->
    <a-modal
      v-model:visible="planEditVisible"
      :title="planEditOrder ? `编辑 - ${planEditOrder.productName}` : '编辑'"
      width="900px"
      :body-style="{ maxHeight: '85vh', overflowY: 'auto' }"
      ok-text="保存"
      cancel-text="取消"
      @ok="confirmPlanEdit"
      @cancel="closePlanEditModal"
    >
      <div v-if="planEditOrder" class="plan-edit-content">
        <template v-if="planEditOrderIsModelType">
          <div class="no-power-range-models">
            <div v-for="(row, idx) in planEditModels" :key="row.key" class="no-power-range-row">
              <a-input v-model:value="row.model" placeholder="型号" allow-clear class="no-power-model-input" />
              <a-input-number v-model:value="row.quantity" :min="1" placeholder="数量" class="no-power-qty-input" />
              <a-button type="text" danger size="small" @click="removePlanEditModel(idx)" :disabled="planEditModels.length <= 1">删除</a-button>
            </div>
            <a-button type="dashed" block @click="addPlanEditModel" class="add-model-btn">+ 添加型号</a-button>
          </div>
        </template>
        <template v-else>
          <div
            class="power-range-grid-wrap"
            @mousedown="onEditGridMouseDown"
            @mousemove="onEditGridMouseMove"
            @mouseup="onEditGridMouseUp"
            @mouseleave="cancelEditGridDrag"
            @contextmenu.prevent
          >
            <table class="power-range-table">
              <thead>
                <tr>
                  <th class="power-range-corner">球镜/柱镜</th>
                  <th v-for="c in editCylinderValues" :key="c" class="power-range-th">{{ formatPowerValue(c) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in editSphereValues" :key="s" :data-sphere="s">
                  <td class="power-range-td-label">{{ formatSphereValue(s) }}</td>
                  <td
                    v-for="c in editCylinderValues"
                    :key="`${s}-${c}`"
                    class="power-range-td"
                    :class="{ selected: isEditCellSelected(s, c), disabled: !isEditCellInRange(s, c) }"
                    :data-sphere="s"
                    :data-cylinder="c"
                  >
                    <span v-if="getEditQuantityForCell(s, c) != null" class="power-range-cell-qty">{{ getEditQuantityForCell(s, c) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { PRODUCT_AUX_STORAGE_EVENT } from '../../utils/productStorageSync.js';

const PRODUCT_STORAGE_KEY = 'ProductModaldata';
const ATTR_STORAGE_KEY = 'ProductAttributeData';
const SUPPLIER_STORAGE_KEY = 'SupplierModaldata';
const MANUFACTURER_STORAGE_KEY = 'ProductManufacturerData';
const CATEGORY_STORAGE_KEY = 'ProductCategoryData';
const POWER_TEMPLATE_STORAGE_KEY = 'PowerRangeTemplates';
const PURCHASE_PLAN_ENTRIES_KEY = 'PurchasePlanEntries';
const IN_OUT_LOG_KEY = 'InOutLogData';
const PARAM_TYPE_PURCHASE_ID = 2; // 采购参数在参数类型中的 id

function getInOutLogList() {
  try {
    const raw = localStorage.getItem(IN_OUT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveInOutLogList(list) {
  localStorage.setItem(IN_OUT_LOG_KEY, JSON.stringify(list));
}
function generateInOutCode(type) {
  const prefix = type === 'out' ? 'CK' : 'RK';
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const datePrefix = `${prefix}${yy}${mm}${dd}`;
  const list = getInOutLogList();
  const todayCodes = list.filter((x) => x.type === type && x.code && String(x.code).startsWith(datePrefix));
  const maxSeq = todayCodes.length
    ? Math.max(...todayCodes.map((x) => parseInt(String(x.code).slice(-3), 10) || 0), 0)
    : 0;
  const seq = String(maxSeq + 1).padStart(3, '0');
  return `${datePrefix}${seq}`;
}
function appendInOutLog(type, payload) {
  const list = getInOutLogList();
  const id = list.length ? Math.max(...list.map((x) => x.id || 0), 0) + 1 : 1;
  const code = generateInOutCode(type);
  const time = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const item = {
    id,
    code,
    type,
    time,
    productName: payload.productName || '',
    retailPrice: payload.retailPrice != null ? payload.retailPrice : '',
    purchasePrice: payload.purchasePrice != null ? payload.purchasePrice : '',
    quantity: payload.quantity != null ? payload.quantity : 0,
    amount: payload.amount != null ? payload.amount : 0
  };
  if (payload.detailEntries && payload.detailEntries.length) {
    item.detailEntries = payload.detailEntries.map((e) => ({ powerRangeDesc: e.powerRangeDesc, quantity: e.quantity || 0 }));
  }
  list.push(item);
  saveInOutLogList(list);
}

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
const cylinderValuesArr = genCylinderValues();
const sphereValuesArr = genSphereValues();

const mainTabKey = ref('new');
const listSubTabKey = ref('plan');
const searchKeyword = ref('');
const productList = ref([]);
const zeroPurchaseProductList = ref([]);
const zeroPurchaseCategoryFilter = ref(null);
const zeroPurchaseSearchKeyword = ref('');
const categoryList = ref([]);
const supplierList = ref([]);
const manufacturerList = ref([]);

const columns = [
  { title: '序号', key: 'index', width: 72, align: 'center' },
  { title: '商品名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类别', key: 'category', width: 140 },
  { title: '零售价格', key: 'retailPrice', width: 110, align: 'right' },
  { title: '采购价格', key: 'purchasePrice', width: 130, align: 'center' },
  { title: '关联供应商', key: 'supplier', width: 140 },
  { title: '关联生产商', key: 'manufacturer', width: 140 },
  { title: '采购', key: 'purchaseBtn', width: 90, align: 'center' }
];

const supplierColumns = [
  { title: '序号', key: 'index', width: 72, align: 'center' },
  { title: '名称', dataIndex: 'name', key: 'name' }
];

const manufacturerColumns = [
  { title: '序号', key: 'index', width: 72, align: 'center' },
  { title: '名称', dataIndex: 'name', key: 'name' }
];

const planEntryColumns = [
  { title: '采购单号', dataIndex: 'orderNumber', key: 'orderNumber', width: 120, align: 'center' },
  { title: '商品名称', dataIndex: 'productName', key: 'productName', ellipsis: true },
  { title: '采购数量', dataIndex: 'totalQuantity', key: 'totalQuantity', width: 100, align: 'center' },
  { title: '入库状态', dataIndex: 'stockInStatus', key: 'stockInStatus', width: 110, align: 'center' },
  { title: '采购金额', key: 'totalAmount', width: 120, align: 'right' },
  { title: '查看明细', key: 'viewDetail', width: 100, align: 'center' },
  { title: '操作', key: 'action', width: 220, align: 'center', ellipsis: false }
];

const zeroPurchaseColumns = [
  { title: '序号', key: 'index', width: 72, align: 'center' },
  { title: '商品名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类别', key: 'category', width: 140 },
  { title: '零售价格', key: 'retailPrice', width: 120, align: 'right', sorter: (a, b) => (Number(a.retailPrice) || 0) - (Number(b.retailPrice) || 0) }
];

const LENS_DATA_KEY = 'lensdata';

const stockInConfirmVisible = ref(false);
const stockInPendingOrder = ref(null);
const stockInExpiryForm = ref({ productionCode: '', productionDate: null });
// 入库弹窗：表格中选择入库的光度与数量，key 为 "s,c"，value 为数量
const stockInSelection = ref({});

// 入库弹窗：有光度范围时显示的光度明细表格（与 planDetailGrid 同构）
const stockInDetailGrid = computed(() => {
  const order = stockInPendingOrder.value;
  if (!order || !order.entries || !order.entries.length) return { rows: [], columns: [], getQty: () => null };
  const cellMap = {};
  const sphereSet = new Set();
  const cylinderSet = new Set();
  order.entries.forEach((e) => {
    const parsed = parsePowerRangeDesc(e.powerRangeDesc);
    if (parsed) {
      const key = `${parsed.s},${parsed.c}`;
      cellMap[key] = (cellMap[key] || 0) + (e.quantity || 0);
      sphereSet.add(parsed.s);
      cylinderSet.add(parsed.c);
    }
  });
  const rows = Array.from(sphereSet).sort((a, b) => b - a);
  const columns = Array.from(cylinderSet).sort((a, b) => b - a);
  const cellCount = Object.keys(cellMap).length;
  const totalQty = Object.values(cellMap).reduce((sum, q) => sum + q, 0);
  return {
    rows,
    columns,
    cellCount,
    totalQty,
    getQty(s, c) {
      const q = cellMap[`${s},${c}`];
      return q > 0 ? q : null;
    }
  };
});
const stockInHasPowerRange = computed(() => {
  const order = stockInPendingOrder.value;
  return order && order.entries && order.entries.some((e) => parsePowerRangeDesc(e.powerRangeDesc));
});
const stockInDetailUnit = computed(() => {
  const order = stockInPendingOrder.value;
  if (!order) return '片';
  const product = productList.value.find((p) => String(p.id) === String(order.productId));
  return getCategoryUnit(product || { categoryId: order.productId });
});

// 入库弹窗：选中项列表（选中光度 + 数量），用于表格下方展示
const stockInSelectedList = computed(() => {
  const sel = stockInSelection.value;
  const grid = stockInDetailGrid.value;
  return Object.entries(sel)
    .filter(([, q]) => q > 0)
    .map(([key, quantity]) => {
      const [s, c] = key.split(',').map(Number);
      const powerDesc = `球镜 ${formatSphereValue(s)}D，柱镜 ${formatPowerValue(c)}D`;
      return { key, s, c, powerDesc, quantity };
    })
    .sort((a, b) => (a.c !== b.c ? a.c - b.c : a.s - b.s));
});
// 入库弹窗：已选镜片总数量（用于已选入库明细汇总行）
const stockInSelectedTotalPieces = computed(() =>
  stockInSelectedList.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
);

function getStockInSelectionQty(s, c) {
  return stockInSelection.value[`${s},${c}`] || 0;
}

function onStockInCellClick(s, c) {
  const grid = stockInDetailGrid.value;
  const orderQty = grid.getQty(s, c);
  if (orderQty == null || orderQty <= 0) return;
  const key = `${s},${c}`;
  const current = stockInSelection.value[key] || 0;
  const next = Math.min(current + 1, orderQty);
  stockInSelection.value = { ...stockInSelection.value, [key]: next };
}

function onStockInCellRightClick(s, c) {
  const key = `${s},${c}`;
  const current = stockInSelection.value[key] || 0;
  if (current <= 0) return;
  const next = current - 1;
  const nextSel = { ...stockInSelection.value };
  if (next === 0) delete nextSel[key];
  else nextSel[key] = next;
  stockInSelection.value = nextSel;
}

function selectAllStockIn() {
  const grid = stockInDetailGrid.value;
  if (!grid.rows.length) return;
  const sel = {};
  grid.rows.forEach((s) => {
    grid.columns.forEach((c) => {
      const q = grid.getQty(s, c);
      if (q != null && q > 0) sel[`${s},${c}`] = q;
    });
  });
  stockInSelection.value = sel;
}

const supplierModalVisible = ref(false);
const manufacturerModalVisible = ref(false);
const linkingProduct = ref(null);
const selectedSupplierId = ref(null);
const selectedManufacturerId = ref(null);
const supplierSearch = ref('');
const manufacturerSearch = ref('');
const editingPurchasePriceId = ref(null);
const editingPurchasePriceValue = ref('');

const purchaseModalVisible = ref(false);
const purchaseProduct = ref(null);
const powerRangeTemplates = ref([]);
// 左键=增加数量，右键=减少数量。拖拉或点击的矩形为“选中范围”，每个范围独立记数量
const purchasePowerRangeDrag = ref({ start: null, current: null, mode: 'add', button: 0 });
const purchasePowerGridWrapRef = ref(null);
// 按单元格存储数量，key 为 "球镜,柱镜" 如 "s,c"，value 为数量
const purchasePowerCellQuantities = ref({});
// 无光度范围时：型号+数量列表，每项 { key, model, quantity }
const noPowerRangeModels = ref([{ key: 0, model: '', quantity: 1 }]);
const noPowerRangeQuantity = ref(1);
let noPowerRangeModelKey = 1;
// 采购参数（商品参数管理中 paramTypeId=2 的参数），在采购弹窗中显示并填写
const purchaseParamList = ref([]);
const purchaseParamValues = ref({});
const purchaseQuantity = ref(1);
const purchaseUnitPrice = ref(undefined);
const purchaseQuantitySumDisplay = computed(() =>
  noPowerRangeModels.value.reduce((s, r) => s + (Number(r.quantity) || 0), 0)
);
const purchaseTotal = computed(() => {
  const p = Number(purchaseUnitPrice.value);
  if (p !== p) return null;
  if (purchaseProductHasPowerRange.value) {
    const totalQty = purchaseConfirmTotalQty.value;
    return (totalQty * p).toFixed(2);
  }
  if (purchaseProduct.value && purchaseProduct.value.modelEnabled) {
    const totalQty = noPowerRangeModels.value.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
    return (totalQty * p).toFixed(2);
  }
  const q = Number(noPowerRangeQuantity.value);
  if (q !== q) return null;
  return (q * p).toFixed(2);
});
const purchaseConfirmVisible = ref(false);
const planDetailVisible = ref(false);
const planDetailOrder = ref(null); // 当前查看明细的整单 { productId, productName, totalQuantity, entries, ... }
const planEditVisible = ref(false);
const planEditOrder = ref(null); // 当前编辑的整单
const planEditCellQuantities = ref({}); // 编辑弹窗内按单元格的数量
const planEditDrag = ref({ start: null, current: null, mode: 'add', button: 0 });
// 编辑弹窗：无光度时型号+数量列表，每项 { key, model, quantity }
const planEditModels = ref([]);
let planEditModelKey = 0;

const purchaseConfirmTotalQty = computed(() => {
  const map = purchasePowerCellQuantities.value;
  return Object.values(map).reduce((sum, q) => sum + (q || 0), 0);
});

// 选中光度明细：球镜/柱镜 + 数量，如 -1.00/-1.50  2
const purchaseConfirmDetailList = computed(() => {
  const map = purchasePowerCellQuantities.value;
  return Object.entries(map)
    .filter(([, q]) => q > 0)
    .map(([key, quantity]) => {
      const [s, c] = key.split(',').map(Number);
      const powerLabel = `${formatSphereValue(s)}/${formatPowerValue(c)}`;
      return { powerLabel, quantity, s, c };
    })
    .sort((a, b) => (a.c !== b.c ? b.c - a.c : b.s - a.s)); // 柱镜降序、球镜降序
});

const filteredProductList = computed(() => {
  const kw = (searchKeyword.value || '').trim().toLowerCase();
  if (!kw) return productList.value;
  return productList.value.filter((p) => (p.name || '').toLowerCase().includes(kw));
});

const zeroPurchaseCategoryOptions = computed(() => {
  const options = [{ label: '全部类型', value: null }];
  categoryList.value.forEach((c) => options.push({ label: c.name, value: c.id }));
  return options;
});

const filteredZeroPurchaseList = computed(() => {
  let list = zeroPurchaseProductList.value;
  const catId = zeroPurchaseCategoryFilter.value;
  if (catId != null && String(catId) !== '') {
    list = list.filter((p) => String(p.categoryId != null ? p.categoryId : p.category) === String(catId));
  }
  const kw = (zeroPurchaseSearchKeyword.value || '').trim().toLowerCase();
  if (kw) {
    list = list.filter((p) => (p.name || '').toLowerCase().includes(kw));
  }
  return list;
});

const purchasePlanEntries = ref([]);

const purchaseProductHasPowerRange = computed(() => {
  const p = purchaseProduct.value;
  if (!p || p.powerRangeTemplateId == null) return false;
  const t = powerRangeTemplates.value.find((x) => x.id === p.powerRangeTemplateId);
  return !!t;
});

const purchaseTemplateRange = computed(() => {
  const p = purchaseProduct.value;
  if (!p || p.powerRangeTemplateId == null) return null;
  const t = powerRangeTemplates.value.find((x) => x.id === p.powerRangeTemplateId);
  return t || null;
});

const purchaseSphereValues = computed(() => {
  const tr = purchaseTemplateRange.value;
  if (!tr) return sphereValuesArr;
  const sMin = Math.min(tr.sphereMin, tr.sphereMax);
  const sMax = Math.max(tr.sphereMin, tr.sphereMax);
  return sphereValuesArr.filter((s) => s >= sMin && s <= sMax);
});
const purchaseCylinderValues = computed(() => {
  const tr = purchaseTemplateRange.value;
  const excludeC = -0.25; // 光度范围中不显示柱镜 -0.25 列
  if (!tr) return cylinderValuesArr.filter((c) => c !== excludeC);
  const cMin = Math.min(tr.cylinderMin, tr.cylinderMax);
  const cMax = Math.max(tr.cylinderMin, tr.cylinderMax);
  return cylinderValuesArr.filter((c) => c >= cMin && c <= cMax && c !== excludeC);
});

// 窗口宽度，用于采购弹窗响应式宽度（随 resize 更新）
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1920);
// 采购弹窗内表格宽度：严格按柱镜列数，使弹窗完整显示无需横向滑动
const purchaseTableWidthPx = computed(() => {
  if (!purchaseProduct.value || !purchaseProductHasPowerRange.value) return 0;
  const n = purchaseCylinderValues.value.length;
  const cornerWidth = 72;
  const colWidth = 44;
  return cornerWidth + n * colWidth;
});
const purchaseTableInlineStyle = computed(() => {
  const w = purchaseTableWidthPx.value;
  if (!w) return {};
  return { width: `${w}px`, minWidth: `${w}px` };
});
// 采购弹窗宽度：无光度时固定较窄宽度，有光度时随柱镜列数响应式
const purchaseModalWidth = computed(() => {
  if (!purchaseProduct.value || !purchaseProductHasPowerRange.value) return '480px';
  const tableW = purchaseTableWidthPx.value;
  const modalPadding = 96;
  const totalPx = tableW + modalPadding;
  const maxVw = Math.floor(windowWidth.value * 0.98);
  const width = Math.min(Math.max(totalPx, 400), maxVw);
  return `${width}px`;
});

const purchasePowerRangeDisplay = computed(() => {
  const drag = purchasePowerRangeDrag.value;
  if (drag.start != null && drag.current != null) {
    const sMin = Math.min(drag.start.sphere, drag.current.sphere);
    const sMax = Math.max(drag.start.sphere, drag.current.sphere);
    const cMin = Math.min(drag.start.cylinder, drag.current.cylinder);
    const cMax = Math.max(drag.start.cylinder, drag.current.cylinder);
    return { sphereMin: sMin, sphereMax: sMax, cylinderMin: cMin, cylinderMax: cMax };
  }
  return null;
});

// 从 powerRangeDesc 解析出球镜、柱镜数值，如 "球镜 -1.00D，柱镜 -0.50D" -> { s: -1, c: -0.5 }
function parsePowerRangeDesc(desc) {
  if (!desc || typeof desc !== 'string') return null;
  const m = desc.match(/球镜\s*([+-]?\d+\.?\d*)D.*柱镜\s*([+-]?\d+\.?\d*)D/);
  if (!m) return null;
  const s = Number(m[1]);
  const c = Number(m[2]);
  return Number.isNaN(s) || Number.isNaN(c) ? null : { s, c };
}

// 查看明细弹窗：该整单的光度表格数据（纵坐标球镜、横坐标柱镜），柱镜排除 -0.25
const planDetailGrid = computed(() => {
  const order = planDetailOrder.value;
  if (!order || !order.entries || !order.entries.length) return { rows: [], columns: [], getQty: () => null };
  const cellMap = {}; // key "s,c" -> quantity
  const sphereSet = new Set();
  const cylinderSet = new Set();
  order.entries.forEach((e) => {
    const parsed = parsePowerRangeDesc(e.powerRangeDesc);
    if (parsed) {
      const key = `${parsed.s},${parsed.c}`;
      cellMap[key] = (cellMap[key] || 0) + (e.quantity || 0);
      sphereSet.add(parsed.s);
      cylinderSet.add(parsed.c);
    }
  });
  const rows = Array.from(sphereSet).sort((a, b) => b - a);
  const columns = Array.from(cylinderSet).sort((a, b) => b - a);
  const cellCount = Object.keys(cellMap).length;
  const totalQty = Object.values(cellMap).reduce((sum, q) => sum + q, 0);
  return {
    rows,
    columns,
    cellCount,
    totalQty,
    getQty(s, c) {
      const q = cellMap[`${s},${c}`];
      return q > 0 ? q : null;
    }
  };
});

// 查看明细弹窗：无光度时的型号明细列表（与库存明细弹窗的型号展示一致：空为「未填型号」）
const planDetailModelEntries = computed(() => {
  const order = planDetailOrder.value;
  if (!order || !order.entries || !order.entries.length) return [];
  return order.entries
    .filter((e) => !parsePowerRangeDesc(e.powerRangeDesc))
    .map((e) => {
      const raw = e.model != null ? String(e.model).trim() : '';
      const model = raw !== '' ? raw : '未填型号';
      return { model, quantity: e.quantity || 0 };
    });
});
const planDetailModelTotalQty = computed(() =>
  planDetailModelEntries.value.reduce((sum, e) => sum + (e.quantity || 0), 0)
);

// 编辑弹窗：是否为无光度（按型号）整单
const planEditOrderIsModelType = computed(() => {
  const order = planEditOrder.value;
  if (!order || !order.entries || !order.entries.length) return false;
  const hasPower = order.entries.some((e) => parsePowerRangeDesc(e.powerRangeDesc));
  return !hasPower;
});

// 编辑弹窗：当前编辑整单对应的商品模板范围与光度轴
const editTemplateRange = computed(() => {
  const order = planEditOrder.value;
  if (!order) return null;
  const product = productList.value.find((p) => String(p.id) === String(order.productId));
  if (!product || product.powerRangeTemplateId == null) return null;
  return powerRangeTemplates.value.find((x) => x.id === product.powerRangeTemplateId) || null;
});
const editSphereValues = computed(() => {
  const tr = editTemplateRange.value;
  if (!tr) return sphereValuesArr;
  const sMin = Math.min(tr.sphereMin, tr.sphereMax);
  const sMax = Math.max(tr.sphereMin, tr.sphereMax);
  return sphereValuesArr.filter((s) => s >= sMin && s <= sMax);
});
const editCylinderValues = computed(() => {
  const tr = editTemplateRange.value;
  const excludeC = -0.25;
  if (!tr) return cylinderValuesArr.filter((c) => c !== excludeC);
  const cMin = Math.min(tr.cylinderMin, tr.cylinderMax);
  const cMax = Math.max(tr.cylinderMin, tr.cylinderMax);
  return cylinderValuesArr.filter((c) => c >= cMin && c <= cMax && c !== excludeC);
});

// 生成采购单号：CG+年后两位+月+日+当日序号，如 CG26031401
function getTodayOrderPrefix() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `CG${yy}${mm}${dd}`;
}

function generateNextOrderNumber() {
  const prefix = getTodayOrderPrefix();
  const entries = purchasePlanEntries.value;
  const todayNumbers = entries
    .filter((e) => e.orderNumber && String(e.orderNumber).startsWith(prefix))
    .map((e) => parseInt(String(e.orderNumber).slice(-2), 10))
    .filter((n) => !Number.isNaN(n));
  const maxSeq = todayNumbers.length ? Math.max(...todayNumbers) : 0;
  const seq = String(maxSeq + 1).padStart(2, '0');
  return `${prefix}${seq}`;
}

// 按采购单号分组：同一 orderNumber 的条目合并为一行
const purchasePlanList = computed(() => {
  const entries = purchasePlanEntries.value;
  const map = new Map(); // orderNumber -> { orderNumber, productId, productName, totalQuantity, totalAmount, entries }
  let noOrderSeq = 0;
  entries.forEach((e) => {
    const key = e.orderNumber != null && e.orderNumber !== '' ? String(e.orderNumber) : `_no_${e.productId}`;
    if (!map.has(key)) {
      const product = productList.value.find((p) => String(p.id) === String(e.productId));
      const price = product && product.purchasePrice != null && product.purchasePrice !== '' ? Number(product.purchasePrice) : 0;
      const displayOrderNumber = e.orderNumber && String(e.orderNumber).startsWith('CG')
        ? e.orderNumber
        : getTodayOrderPrefix() + String(++noOrderSeq).padStart(2, '0');
      map.set(key, {
        orderNumber: e.orderNumber && String(e.orderNumber).startsWith('CG') ? e.orderNumber : displayOrderNumber,
        productId: e.productId,
        productName: e.productName,
        totalQuantity: 0,
        unitPrice: price,
        totalAmount: 0,
        entries: []
      });
    }
    const row = map.get(key);
    row.totalQuantity += e.quantity || 0;
    row.entries.push(e);
  });
  map.forEach((row) => {
    row.totalAmount = row.totalQuantity * (row.unitPrice || 0);
    const originalTotal = row.entries.reduce((sum, e) => sum + (e.originalQuantity ?? e.quantity ?? 0), 0);
    const stocked = Math.max(0, originalTotal - row.totalQuantity);
    row.stockInStatus = `${stocked}/${originalTotal}`;
  });
  return Array.from(map.values());
});

const filteredSupplierList = computed(() => {
  const kw = (supplierSearch.value || '').trim().toLowerCase();
  if (!kw) return supplierList.value;
  return supplierList.value.filter((s) => (s.name || '').toLowerCase().includes(kw));
});

const filteredManufacturerList = computed(() => {
  const kw = (manufacturerSearch.value || '').trim().toLowerCase();
  if (!kw) return manufacturerList.value;
  return manufacturerList.value.filter((m) => (m.name || '').toLowerCase().includes(kw));
});

const supplierRowSelection = computed(() => ({
  type: 'radio',
  selectedRowKeys: selectedSupplierId.value != null ? [selectedSupplierId.value] : [],
  onChange: (keys) => {
    selectedSupplierId.value = keys.length ? keys[0] : null;
  }
}));

const manufacturerRowSelection = computed(() => ({
  type: 'radio',
  selectedRowKeys: selectedManufacturerId.value != null ? [selectedManufacturerId.value] : [],
  onChange: (keys) => {
    selectedManufacturerId.value = keys.length ? keys[0] : null;
  }
}));

const stockInNeedExpiry = computed(() => {
  const order = stockInPendingOrder.value;
  if (!order || !order.entries?.length) return false;
  const productListRaw = getProductListRaw();
  return order.entries.some((e) => {
    const p = productListRaw.find((pr) => String(pr.id) === String(e.productId));
    return p && p.expiryManageEnabled;
  });
});

function getProductListRaw() {
  const raw = localStorage.getItem(PRODUCT_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function getCategoryName(product) {
  const id = product.categoryId != null ? product.categoryId : product.category;
  if (id == null) return '-';
  const c = categoryList.value.find((x) => x.id === id);
  return c ? c.name : '-';
}

function getCategoryUnit(product) {
  const id = product && (product.categoryId != null ? product.categoryId : product.category);
  if (id == null) return '片';
  const c = categoryList.value.find((x) => x.id === id);
  return (c && c.unit != null && String(c.unit).trim() !== '') ? String(c.unit).trim() : '片';
}

const purchaseUnit = computed(() => getCategoryUnit(purchaseProduct.value || {}));
const planDetailUnit = computed(() => {
  const order = planDetailOrder.value;
  if (!order) return '片';
  const product = productList.value.find((p) => String(p.id) === String(order.productId));
  return getCategoryUnit(product || { categoryId: order.productId });
});

function getSupplierName(supplierId) {
  if (supplierId == null) return '';
  const s = supplierList.value.find((x) => x.id === supplierId);
  return s ? s.name : '';
}

function getManufacturerName(manufacturerId) {
  if (manufacturerId == null) return '';
  const m = manufacturerList.value.find((x) => x.id === manufacturerId);
  return m ? m.name : '';
}

function formatPowerValue(v) {
  return Number(v) === v ? Number(v).toFixed(2) : String(v);
}
function formatSphereValue(v) {
  const n = Number(v);
  if (n !== n) return String(v);
  const s = n.toFixed(2);
  return n > 0 ? `+${s}` : s;
}

function isCellInTemplateRange(s, c) {
  const tr = purchaseTemplateRange.value;
  if (!tr) return true;
  const sMin = Math.min(tr.sphereMin, tr.sphereMax);
  const sMax = Math.max(tr.sphereMin, tr.sphereMax);
  const cMin = Math.min(tr.cylinderMin, tr.cylinderMax);
  const cMax = Math.max(tr.cylinderMin, tr.cylinderMax);
  return s >= sMin && s <= sMax && c >= cMin && c <= cMax;
}

function isEditCellInRange(s, c) {
  const rows = editSphereValues.value;
  const cols = editCylinderValues.value;
  return rows.includes(s) && cols.includes(c);
}

function getEditQuantityForCell(s, c) {
  const q = planEditCellQuantities.value[powerRangeKey(s, c)];
  return q > 0 ? q : null;
}

function isEditCellSelected(s, c) {
  const drag = planEditDrag.value;
  if (drag.start != null && drag.current != null) {
    const sMin = Math.min(drag.start.sphere, drag.current.sphere);
    const sMax = Math.max(drag.start.sphere, drag.current.sphere);
    const cMin = Math.min(drag.start.cylinder, drag.current.cylinder);
    const cMax = Math.max(drag.start.cylinder, drag.current.cylinder);
    if (s >= sMin && s <= sMax && c >= cMin && c <= cMax) return true;
  }
  return (planEditCellQuantities.value[powerRangeKey(s, c)] || 0) > 0;
}

function getCellsInRectForEdit(sMin, sMax, cMin, cMax) {
  const rows = editSphereValues.value;
  const cols = editCylinderValues.value;
  const cells = [];
  rows.forEach((s) => {
    if (s < sMin || s > sMax) return;
    cols.forEach((c) => {
      if (c >= cMin && c <= cMax) cells.push({ s, c });
    });
  });
  return cells;
}

function onEditGridMouseDown(e) {
  if (e.button !== 0 && e.button !== 2) return;
  const cell = getCellFromEvent(e);
  if (!cell || !isEditCellInRange(cell.sphere, cell.cylinder)) return;
  const mode = e.button === 0 ? 'add' : 'remove';
  planEditDrag.value = { start: { ...cell }, current: { ...cell }, mode, button: e.button };
}

function onEditGridMouseMove(e) {
  const drag = planEditDrag.value;
  if (drag.start == null) return;
  const wantButton = drag.button === 0 ? 1 : 2;
  if ((e.buttons & wantButton) === 0) return;
  const cell = getCellFromEvent(e);
  if (!cell) return;
  planEditDrag.value = { ...drag, current: cell };
}

function cancelEditGridDrag() {
  planEditDrag.value = { start: null, current: null, mode: 'add', button: 0 };
}

function onEditGridMouseUp(e) {
  const drag = planEditDrag.value;
  if (drag.start == null) return;
  if (e && e.button !== drag.button) return;
  const { start, current, mode } = drag;
  const sMin = Math.min(start.sphere, current.sphere);
  const sMax = Math.max(start.sphere, current.sphere);
  const cMin = Math.min(start.cylinder, current.cylinder);
  const cMax = Math.max(start.cylinder, current.cylinder);
  const cells = getCellsInRectForEdit(sMin, sMax, cMin, cMax);
  const map = { ...planEditCellQuantities.value };
  cells.forEach(({ s, c }) => {
    const key = powerRangeKey(s, c);
    if (mode === 'add') {
      map[key] = (map[key] || 0) + 1;
    } else {
      const q = (map[key] || 0) - 1;
      if (q <= 0) delete map[key];
      else map[key] = q;
    }
  });
  planEditCellQuantities.value = map;
  planEditDrag.value = { start: null, current: null, mode: 'add', button: 0 };
}

const powerRangeKey = (s, c) => `${s},${c}`;

function getCellsInRect(sMin, sMax, cMin, cMax) {
  const cells = [];
  sphereValuesArr.forEach((s) => {
    if (s < sMin || s > sMax) return;
    cylinderValuesArr.forEach((c) => {
      if (c < cMin || c > cMax) return;
      cells.push({ s, c });
    });
  });
  return cells;
}

function getCellFromEvent(e) {
  const el = e.target?.closest?.('[data-sphere][data-cylinder]');
  if (!el) return null;
  const s = Number(el.getAttribute('data-sphere'));
  const c = Number(el.getAttribute('data-cylinder'));
  return { sphere: s, cylinder: c };
}

function isPurchasePowerCellSelected(s, c) {
  const drag = purchasePowerRangeDrag.value;
  if (drag.start != null && drag.current != null) {
    const sMin = Math.min(drag.start.sphere, drag.current.sphere);
    const sMax = Math.max(drag.start.sphere, drag.current.sphere);
    const cMin = Math.min(drag.start.cylinder, drag.current.cylinder);
    const cMax = Math.max(drag.start.cylinder, drag.current.cylinder);
    if (s >= sMin && s <= sMax && c >= cMin && c <= cMax) return true;
  }
  const key = powerRangeKey(s, c);
  return (purchasePowerCellQuantities.value[key] || 0) > 0;
}

function onPurchasePowerGridMouseDown(e) {
  if (e.button !== 0 && e.button !== 2) return; // 仅左键(0)与右键(2)
  const cell = getCellFromEvent(e);
  if (!cell || !isCellInTemplateRange(cell.sphere, cell.cylinder)) return;
  const mode = e.button === 0 ? 'add' : 'remove'; // 左键增加数量，右键减少数量
  purchasePowerRangeDrag.value = { start: { ...cell }, current: { ...cell }, mode, button: e.button };
}

function onPurchasePowerGridMouseMove(e) {
  const drag = purchasePowerRangeDrag.value;
  if (drag.start == null) return;
  const wantButton = drag.button === 0 ? 1 : 2; // 1=left, 2=right
  if ((e.buttons & wantButton) === 0) return;
  const cell = getCellFromEvent(e);
  if (!cell) return;
  purchasePowerRangeDrag.value = { ...drag, current: cell };
}

function cancelPurchasePowerGridDrag() {
  purchasePowerRangeDrag.value = { start: null, current: null, mode: 'add', button: 0 };
}

function onPurchasePowerGridMouseUp(e) {
  const drag = purchasePowerRangeDrag.value;
  if (drag.start == null) return;
  if (e && e.button !== drag.button) return;
  const { start, current, mode } = drag;
  const sMin = Math.min(start.sphere, current.sphere);
  const sMax = Math.max(start.sphere, current.sphere);
  const cMin = Math.min(start.cylinder, current.cylinder);
  const cMax = Math.max(start.cylinder, current.cylinder);
  const cells = getCellsInRect(sMin, sMax, cMin, cMax);
  const map = { ...purchasePowerCellQuantities.value };
  cells.forEach(({ s, c }) => {
    if (!isCellInTemplateRange(s, c)) return;
    const key = powerRangeKey(s, c);
    if (mode === 'add') {
      map[key] = (map[key] || 0) + 1;
    } else {
      const q = (map[key] || 0) - 1;
      if (q <= 0) delete map[key];
      else map[key] = q;
    }
  });
  purchasePowerCellQuantities.value = map;
  purchasePowerRangeDrag.value = { start: null, current: null, mode: 'add', button: 0 };
}

function formatRetailPrice(v) {
  if (v == null || v === '') return '-';
  const n = Number(v);
  if (Number.isNaN(n)) return '-';
  return `¥ ${n.toFixed(1)}`;
}

function formatPurchasePriceDisplay(v) {
  if (v == null || v === '') return '';
  const n = Number(v);
  if (Number.isNaN(n)) return '';
  return `¥ ${n.toFixed(2)}`;
}

function startEditPurchasePrice(record, e) {
  editingPurchasePriceId.value = record.id;
  editingPurchasePriceValue.value = record.purchasePrice != null && record.purchasePrice !== '' ? String(record.purchasePrice) : '';
  nextTick(() => {
    const el = e?.target;
    if (el && typeof el.setSelectionRange === 'function') {
      const len = (el.value || '').length;
      el.setSelectionRange(len, len);
    }
  });
}

function onPurchasePriceInput(recordId, value) {
  if (editingPurchasePriceId.value !== recordId) {
    const record = productList.value.find((p) => p.id === recordId);
    if (record) startEditPurchasePrice(record);
  }
  editingPurchasePriceValue.value = value;
}

function parsePurchasePriceInput(value) {
  if (value === '' || value == null) return null;
  const s = String(value).replace(/^¥\s*/, '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function saveProductPurchasePrice(productId, value) {
  const rawList = getProductListRaw();
  const num = parsePurchasePriceInput(value);
  const isEmpty = (value ?? '').toString().replace(/^¥\s*/, '').trim() === '';
  const list = rawList.map((p) =>
    String(p.id) === String(productId)
      ? { ...p, purchasePrice: isEmpty ? null : (num ?? p.purchasePrice) }
      : p
  );
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(list));
  loadProductList();
}

function savePurchasePrice(record) {
  const productId = record.id;
  const value = editingPurchasePriceValue.value;
  saveProductPurchasePrice(productId, value);
  editingPurchasePriceId.value = null;
  editingPurchasePriceValue.value = '';
  message.success('采购价格已保存');
}

function loadProductList() {
  const raw = getProductListRaw();
  productList.value = raw
    .filter((p) => !p.zeroPurchase)
    .map((p) => ({
      ...p,
      categoryId: p.categoryId != null ? p.categoryId : (typeof p.category === 'number' ? p.category : null)
    }));
  zeroPurchaseProductList.value = raw.filter((p) => p.zeroPurchase);
}

function loadCategoryList() {
  const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
  categoryList.value = raw ? JSON.parse(raw) : [];
}

function loadSupplierList() {
  const raw = localStorage.getItem(SUPPLIER_STORAGE_KEY);
  supplierList.value = raw ? JSON.parse(raw) : [];
}

function loadManufacturerList() {
  const raw = localStorage.getItem(MANUFACTURER_STORAGE_KEY);
  manufacturerList.value = raw ? JSON.parse(raw) : [];
}

function loadPowerRangeTemplates() {
  const raw = localStorage.getItem(POWER_TEMPLATE_STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  powerRangeTemplates.value = list;
}

function loadPurchasePlanEntries() {
  const raw = localStorage.getItem(PURCHASE_PLAN_ENTRIES_KEY);
  let list = raw ? JSON.parse(raw) : [];
  // 若误存了商品列表到计划单 key，不要当作计划单使用，避免入库时误写
  const first = list[0];
  if (list.length > 0 && first && 'name' in first && 'categoryId' in first && !('orderNumber' in first) && !('productId' in first)) {
    console.warn('[loadPurchasePlanEntries] 检测到计划单 key 内为商品列表数据，已忽略并清空该 key');
    localStorage.setItem(PURCHASE_PLAN_ENTRIES_KEY, '[]');
    list = [];
  }
  const needMigration = list.some((e) => e.orderNumber == null || e.orderNumber === '');
  if (needMigration) {
    const prefix = getTodayOrderPrefix();
    const withOrder = list.filter((e) => e.orderNumber != null && e.orderNumber !== '');
    const todaySeqs = withOrder
      .filter((e) => String(e.orderNumber).startsWith(prefix))
      .map((e) => parseInt(String(e.orderNumber).slice(-2), 10))
      .filter((n) => !Number.isNaN(n));
    let nextSeq = todaySeqs.length ? Math.max(...todaySeqs) + 1 : 1;
    const withoutOrder = list.filter((e) => e.orderNumber == null || e.orderNumber === '');
    const byProduct = new Map();
    withoutOrder.forEach((e) => {
      const id = e.productId;
      if (!byProduct.has(id)) byProduct.set(id, []);
      byProduct.get(id).push(e);
    });
    byProduct.forEach((entries) => {
      const orderNumber = `${prefix}${String(nextSeq).padStart(2, '0')}`;
      nextSeq += 1;
      entries.forEach((e) => { e.orderNumber = orderNumber; });
    });
    list = [...list];
    localStorage.setItem(PURCHASE_PLAN_ENTRIES_KEY, JSON.stringify(list));
  }
  purchasePlanEntries.value = list;
}

function savePurchasePlanEntries(list) {
  if (!Array.isArray(list)) return;
  // 防止误将商品列表写入计划单：计划单条目应有 orderNumber 或 productId，不应是商品结构（name/categoryId）
  const first = list[0];
  if (list.length > 0 && first && 'name' in first && 'categoryId' in first && !('orderNumber' in first) && !('productId' in first)) {
    console.error('[savePurchasePlanEntries] 拒绝写入：数据疑似商品列表，已忽略');
    return;
  }
  localStorage.setItem(PURCHASE_PLAN_ENTRIES_KEY, JSON.stringify(list));
  purchasePlanEntries.value = list;
}

function addNoPowerRangeModel() {
  noPowerRangeModels.value.push({ key: noPowerRangeModelKey++, model: '', quantity: 1 });
}
function removeNoPowerRangeModel(index) {
  if (noPowerRangeModels.value.length <= 1) return;
  noPowerRangeModels.value.splice(index, 1);
}

function loadPurchaseParamList() {
  const raw = localStorage.getItem(ATTR_STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  purchaseParamList.value = list.filter((a) => a.paramTypeId === PARAM_TYPE_PURCHASE_ID);
}

function setPurchaseParamValue(name, val) {
  purchaseParamValues.value = { ...purchaseParamValues.value, [name]: val };
}

function openPurchaseModal(record) {
  if (record.supplierId == null || record.supplierId === '') {
    message.warning('请关联供应商');
    return;
  }
  purchaseProduct.value = record;
  purchasePowerRangeDrag.value = { start: null, current: null, mode: 'add', button: 0 };
  purchasePowerCellQuantities.value = {};
  noPowerRangeModels.value = [{ key: noPowerRangeModelKey++, model: '', quantity: 1 }];
  noPowerRangeQuantity.value = 1;
  purchaseQuantity.value = 1;
  purchaseUnitPrice.value = record.purchasePrice != null && record.purchasePrice !== '' ? Number(record.purchasePrice) : undefined;
  purchaseParamValues.value = {};
  loadPurchaseParamList();
  loadPowerRangeTemplates();
  purchaseModalVisible.value = true;
}

function closePurchaseModal() {
  purchaseModalVisible.value = false;
  purchaseProduct.value = null;
  purchasePowerCellQuantities.value = {};
}

function getQuantityForCell(s, c) {
  const q = purchasePowerCellQuantities.value[powerRangeKey(s, c)];
  return q > 0 ? q : null;
}

function onPurchaseOkClick() {
  const p = Number(purchaseUnitPrice.value);
  if (p !== p || p < 0) {
    message.warning('请填写采购单价');
    return;
  }
  if (purchaseProductHasPowerRange.value) {
    const totalQty = purchaseConfirmTotalQty.value;
    if (!totalQty || totalQty < 1) {
      message.warning('请在光度范围表格中选择至少一个格子并填写数量');
      return;
    }
    purchaseConfirmVisible.value = true;
    return;
  }
  const q = Number(noPowerRangeQuantity.value);
  if (q !== q || q < 1) {
    message.warning('请填写数量');
    return;
  }
  // 无光度范围：按是否启用型号显示不同表单，此处仅做校验
  if (purchaseProduct.value.modelEnabled) {
    const validRows = noPowerRangeModels.value.filter((r) => (r.quantity || 0) > 0);
    if (!validRows.length) {
      message.warning('请至少填写一行型号与数量');
      return;
    }
  } else {
    const q = Math.floor(Number(noPowerRangeQuantity.value) || 0);
    if (q < 1) {
      message.warning('请填写数量');
      return;
    }
  }
  confirmPurchaseNoPowerRange();
}

function doConfirmPurchase() {
  purchaseConfirmVisible.value = false;
  confirmPurchase();
}

function onPurchaseConfirmCancel() {
  purchaseConfirmVisible.value = false;
  purchaseModalVisible.value = true; // 重新打开采购弹窗
}

function formatPlanAmount(val) {
  if (val == null || Number.isNaN(Number(val))) return '-';
  return `¥ ${Number(val).toFixed(2)}`;
}

function openPlanDetailModal(record) {
  planDetailOrder.value = record;
  planDetailVisible.value = true;
}

function addPlanEditModel() {
  planEditModels.value.push({ key: planEditModelKey++, model: '', quantity: 1 });
}
function removePlanEditModel(index) {
  if (planEditModels.value.length <= 1) return;
  planEditModels.value.splice(index, 1);
}

function openPlanEditModal(record) {
  planEditOrder.value = record;
  const entries = record.entries || [];
  const isModelType = entries.length > 0 && !entries.some((e) => parsePowerRangeDesc(e.powerRangeDesc));
  if (isModelType) {
    planEditModels.value = entries.map((e) => ({
      key: planEditModelKey++,
      model: e.model != null ? String(e.model) : '',
      quantity: e.quantity || 1
    }));
    planEditCellQuantities.value = {};
  } else {
    const cellMap = {};
    entries.forEach((e) => {
      const parsed = parsePowerRangeDesc(e.powerRangeDesc);
      if (parsed) {
        const key = powerRangeKey(parsed.s, parsed.c);
        cellMap[key] = (cellMap[key] || 0) + (e.quantity || 0);
      }
    });
    planEditCellQuantities.value = cellMap;
    planEditModels.value = [];
  }
  planEditDrag.value = { start: null, current: null, mode: 'add', button: 0 };
  planEditVisible.value = true;
}

function closePlanEditModal() {
  planEditVisible.value = false;
  planEditOrder.value = null;
  planEditCellQuantities.value = {};
  planEditModels.value = [];
  planEditDrag.value = { start: null, current: null, mode: 'add', button: 0 };
}

function confirmPlanEdit() {
  const order = planEditOrder.value;
  if (!order) return;
  const hasStoredOrderNumber = order.entries && order.entries[0] && order.entries[0].orderNumber && String(order.entries[0].orderNumber).startsWith('CG');
  const orderNumber = hasStoredOrderNumber ? order.orderNumber : generateNextOrderNumber();
  const list = hasStoredOrderNumber
    ? purchasePlanEntries.value.filter((e) => String(e.orderNumber) !== String(order.orderNumber))
    : purchasePlanEntries.value.filter((e) => String(e.productId) !== String(order.productId));
  let nextId = list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;

  if (planEditOrderIsModelType.value) {
    const validRows = planEditModels.value.filter((r) => (r.quantity || 0) > 0);
    if (!validRows.length) {
      message.warning('请至少填写一行数量');
      return;
    }
    validRows.forEach((r) => {
      const qty = Number(r.quantity) || 1;
      list.push({
        id: nextId++,
        orderNumber,
        productId: order.productId,
        productName: order.productName,
        quantity: qty,
        originalQuantity: qty,
        powerRangeDesc: null,
        model: (r.model || '').trim()
      });
    });
  } else {
    const map = planEditCellQuantities.value;
    const entries = Object.entries(map).filter(([, q]) => q > 0);
    if (entries.length > 0) {
      entries.forEach(([key, quantity]) => {
        const [s, c] = key.split(',').map(Number);
        const powerRangeDesc = `球镜 ${formatSphereValue(s)}D，柱镜 ${formatPowerValue(c)}D`;
        list.push({ id: nextId++, orderNumber, productId: order.productId, productName: order.productName, quantity, originalQuantity: quantity, powerRangeDesc });
      });
    } else {
      list.push({
        id: nextId,
        orderNumber,
        productId: order.productId,
        productName: order.productName,
        quantity: 1,
        originalQuantity: 1,
        powerRangeDesc: null
      });
    }
  }
  savePurchasePlanEntries(list);
  closePlanEditModal();
  message.success('已保存修改');
}

function getLensData() {
  const raw = localStorage.getItem(LENS_DATA_KEY);
  return raw ? JSON.parse(raw) : [];
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function onStockInClick(record) {
  stockInPendingOrder.value = record;
  stockInExpiryForm.value = { productionCode: '', productionDate: null };
  stockInSelection.value = {};
  stockInConfirmVisible.value = true;
}

function confirmStockIn() {
  const record = stockInPendingOrder.value;
  if (!record) return;
  if (stockInNeedExpiry.value) {
    const code = (stockInExpiryForm.value.productionCode || '').trim();
    const date = stockInExpiryForm.value.productionDate;
    if (!code) {
      message.warning('请填写生产编号');
      nextTick(() => { stockInConfirmVisible.value = true; });
      return;
    }
    if (!date) {
      message.warning('请选择生产日期');
      nextTick(() => { stockInConfirmVisible.value = true; });
      return;
    }
  }
  if (stockInHasPowerRange.value) {
    if (stockInSelectedList.value.length === 0) {
      message.warning('请先在表格中选择要入库的光度');
      return;
    }
    const expiryInfo = stockInNeedExpiry.value
      ? { productionCode: stockInExpiryForm.value.productionCode, productionDate: stockInExpiryForm.value.productionDate }
      : undefined;
    const entriesToStock = stockInSelectedList.value.map((item) => ({
      productId: record.productId,
      productName: record.productName,
      quantity: item.quantity,
      powerRangeDesc: `球镜 ${formatSphereValue(item.s)}D，柱镜 ${formatPowerValue(item.c)}D`
    }));
    const recordToStock = { ...record, entries: entriesToStock };
    stockInPlanOrder(recordToStock, expiryInfo, true);
    const list = purchasePlanEntries.value.map((entry) => {
      if (String(entry.orderNumber) !== String(record.orderNumber) || String(entry.productId) !== String(record.productId)) return entry;
      const parsed = parsePowerRangeDesc(entry.powerRangeDesc);
      if (!parsed) return entry;
      const key = `${parsed.s},${parsed.c}`;
      const stocked = stockInSelection.value[key] || 0;
      const newQty = Math.floor(Number(entry.quantity) || 0) - stocked;
      if (newQty <= 0) return null;
      return { ...entry, quantity: newQty };
    }).filter(Boolean);
    savePurchasePlanEntries(list);
  } else {
    const expiryInfo = stockInNeedExpiry.value
      ? { productionCode: stockInExpiryForm.value.productionCode, productionDate: stockInExpiryForm.value.productionDate }
      : undefined;
    stockInPlanOrder(record, expiryInfo);
  }
  stockInConfirmVisible.value = false;
  stockInPendingOrder.value = null;
  stockInExpiryForm.value = { productionCode: '', productionDate: null };
  stockInSelection.value = {};
}

function stockInPlanOrder(record, expiryInfo, skipPlanUpdate = false) {
  const entries = record.entries || [];
  if (!entries.length) {
    message.warning('该采购单无明细');
    return;
  }
  const lensData = getLensData();
  const productListRaw = getProductListRaw();
  let maxLensId = lensData.length ? Math.max(...lensData.map((x) => Number(x.id) || 0), 0) : 0;

  for (const e of entries) {
    const productId = e.productId;
    const quantity = Math.floor(Number(e.quantity) || 0);
    if (quantity <= 0) continue;

    const parsed = parsePowerRangeDesc(e.powerRangeDesc);
    const sphere = parsed ? Number(parsed.s) : 0;
    const cylinder = parsed ? Number(parsed.c) : 0;
    const model = e.model != null ? String(e.model).trim() : '';

    const product = productListRaw.find((p) => String(p.id) === String(productId));
    const name = e.productName || (product ? product.name : '');
    const salePrice = product && product.retailPrice != null && product.retailPrice !== '' ? Number(product.retailPrice) : 0;
    const needExpiry = product && product.expiryManageEnabled && expiryInfo && expiryInfo.productionCode && expiryInfo.productionDate;
    const productionCode = needExpiry ? expiryInfo.productionCode : undefined;
    const productionDate = needExpiry ? expiryInfo.productionDate : undefined;
    const expiryMonths = product && product.expiryMonths != null ? Number(product.expiryMonths) : 0;
    const expiryDate = needExpiry && expiryMonths >= 1 ? addMonths(expiryInfo.productionDate, expiryMonths) : undefined;

    const existing = lensData.find(
      (item) =>
        String(item.productid || item.productId) === String(productId) &&
        Number(item.sphere) === sphere &&
        Number(item.cylinder) === cylinder &&
        (String(item.model || '').trim() === model)
    );
    if (existing) {
      existing.currentStock = Math.floor(Number(existing.currentStock) || 0) + quantity;
      if (productionCode !== undefined) existing.productionCode = productionCode;
      if (productionDate !== undefined) existing.productionDate = productionDate;
      if (expiryDate !== undefined) existing.expiryDate = expiryDate;
    } else {
      maxLensId += 1;
      const item = {
        id: maxLensId,
        productid: productId,
        name: name || '未知商品',
        sphere,
        cylinder,
        model: model || '',
        currentStock: quantity,
        salePrice
      };
      if (productionCode !== undefined) item.productionCode = productionCode;
      if (productionDate !== undefined) item.productionDate = productionDate;
      if (expiryDate !== undefined) item.expiryDate = expiryDate;
      lensData.push(item);
    }
  }

  localStorage.setItem(LENS_DATA_KEY, JSON.stringify(lensData));

  const product = productListRaw.find((p) => String(p.id) === String(record.productId));
  const totalQty = entries.reduce((s, e) => s + Math.floor(Number(e.quantity) || 0), 0);
  const unitPrice = product && product.purchasePrice != null && product.purchasePrice !== '' ? Number(product.purchasePrice) : 0;
  const amount = totalQty * unitPrice;
  const retailPrice = product && product.retailPrice != null && product.retailPrice !== '' ? Number(product.retailPrice) : 0;
  appendInOutLog('in', {
    productName: record.productName || (product ? product.name : ''),
    retailPrice,
    purchasePrice: unitPrice,
    quantity: totalQty,
    amount,
    detailEntries: record.entries
  });

  if (!skipPlanUpdate) {
    const hasStoredOrderNumber = record.entries[0] && record.entries[0].orderNumber && String(record.entries[0].orderNumber).startsWith('CG');
    const filteredPlanEntries = hasStoredOrderNumber
      ? purchasePlanEntries.value.filter((e) => String(e.orderNumber) !== String(record.orderNumber))
      : purchasePlanEntries.value.filter((e) => String(e.productId) !== String(record.productId));
    savePurchasePlanEntries(filteredPlanEntries);
  }

  if (planDetailVisible.value && planDetailOrder.value && String(planDetailOrder.value.orderNumber) === String(record.orderNumber)) {
    planDetailVisible.value = false;
    planDetailOrder.value = null;
  }

  message.success('入库成功，商品库存已更新');
}

function deletePlanOrder(record) {
  const hasStoredOrderNumber = record.entries && record.entries[0] && record.entries[0].orderNumber && String(record.entries[0].orderNumber).startsWith('CG');
  const list = hasStoredOrderNumber
    ? purchasePlanEntries.value.filter((e) => String(e.orderNumber) !== String(record.orderNumber))
    : purchasePlanEntries.value.filter((e) => String(e.productId) !== String(record.productId));
  savePurchasePlanEntries(list);
  message.success('已删除该采购单');
  if (planDetailVisible.value && planDetailOrder.value) {
    const same = hasStoredOrderNumber
      ? String(planDetailOrder.value.orderNumber) === String(record.orderNumber)
      : String(planDetailOrder.value.productId) === String(record.productId);
    if (same) {
      planDetailVisible.value = false;
      planDetailOrder.value = null;
    }
  }
}

function confirmPurchaseNoPowerRange() {
  const product = purchaseProduct.value;
  if (!product) return;
  const orderNumber = generateNextOrderNumber();
  const list = [...purchasePlanEntries.value];
  let nextId = list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
  if (product.modelEnabled) {
    const validRows = noPowerRangeModels.value.filter((r) => (r.quantity || 0) > 0);
    if (!validRows.length) return;
    validRows.forEach((r) => {
      const qty = Number(r.quantity) || 1;
      list.push({
        id: nextId++,
        orderNumber,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        originalQuantity: qty,
        powerRangeDesc: null,
        model: (r.model || '').trim()
      });
    });
  } else {
    const q = Math.floor(Number(noPowerRangeQuantity.value) || 0) || 1;
    list.push({
      id: nextId++,
      orderNumber,
      productId: product.id,
      productName: product.name,
      quantity: q,
      originalQuantity: q,
      powerRangeDesc: null,
      model: ''
    });
  }
  savePurchasePlanEntries(list);
  closePurchaseModal();
  message.success('已加入采购计划单');
}

function confirmPurchase() {
  const product = purchaseProduct.value;
  if (!product) return;
  const orderNumber = generateNextOrderNumber();
  const list = [...purchasePlanEntries.value];
  let nextId = list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
  const cellMap = purchasePowerCellQuantities.value;
  const entries = Object.entries(cellMap).filter(([, q]) => q > 0);
  if (entries.length > 0) {
    entries.forEach(([key, quantity]) => {
      const [s, c] = key.split(',').map(Number);
      const powerRangeDesc = `球镜 ${formatSphereValue(s)}D，柱镜 ${formatPowerValue(c)}D`;
      list.push({ id: nextId++, orderNumber, productId: product.id, productName: product.name, quantity, originalQuantity: quantity, powerRangeDesc });
    });
  } else {
    list.push({
      id: nextId,
      orderNumber,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      originalQuantity: 1,
      powerRangeDesc: null
    });
  }
  savePurchasePlanEntries(list);
  closePurchaseModal();
  message.success('已加入采购计划单');
}

function saveProductSupplier(productId, supplierId) {
  const rawList = getProductListRaw();
  const list = rawList.map((p) =>
    String(p.id) === String(productId) ? { ...p, supplierId } : p
  );
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(list));
  loadProductList();
}

function saveProductManufacturer(productId, manufacturerId) {
  const rawList = getProductListRaw();
  const list = rawList.map((p) =>
    String(p.id) === String(productId) ? { ...p, manufacturerId } : p
  );
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(list));
  loadProductList();
}

function openSupplierModal(record) {
  linkingProduct.value = record;
  selectedSupplierId.value = record.supplierId != null ? record.supplierId : null;
  supplierSearch.value = '';
  supplierModalVisible.value = true;
}

function openManufacturerModal(record) {
  linkingProduct.value = record;
  selectedManufacturerId.value = record.manufacturerId != null ? record.manufacturerId : null;
  manufacturerSearch.value = '';
  manufacturerModalVisible.value = true;
}

function confirmSupplier() {
  const product = linkingProduct.value;
  if (!product) return;
  saveProductSupplier(product.id, selectedSupplierId.value ?? undefined);
  supplierModalVisible.value = false;
  linkingProduct.value = null;
  message.success('已关联供应商');
}

function confirmManufacturer() {
  const product = linkingProduct.value;
  if (!product) return;
  saveProductManufacturer(product.id, selectedManufacturerId.value ?? undefined);
  manufacturerModalVisible.value = false;
  linkingProduct.value = null;
  message.success('已关联生产商');
}

const onWindowResize = () => {
  windowWidth.value = window.innerWidth;
};

function onProductAuxStorageSync(e) {
  const t = e.detail?.type;
  if (!t) return;
  if (t === 'supplier') loadSupplierList();
  if (t === 'manufacturer') loadManufacturerList();
  if (t === 'attr') loadPurchaseParamList();
  if (t === 'powerTemplate') loadPowerRangeTemplates();
}

onMounted(() => {
  loadCategoryList();
  loadProductList();
  loadSupplierList();
  loadManufacturerList();
  loadPowerRangeTemplates();
  loadPurchasePlanEntries();
  window.addEventListener('resize', onWindowResize);
  window.addEventListener(PRODUCT_AUX_STORAGE_EVENT, onProductAuxStorageSync);
});
onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener(PRODUCT_AUX_STORAGE_EVENT, onProductAuxStorageSync);
});
</script>

<style scoped>
.purchase-page {
  padding: 16px;
}
.purchase-toolbar {
  margin-bottom: 16px;
}
.purchase-table {
  margin-top: 0;
}
.main-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}
.sub-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}
.plan-section {
  margin-bottom: 24px;
}
.plan-section:last-child {
  margin-bottom: 0;
}
.zero-purchase-section {
  padding: 8px 0;
}
.zero-purchase-toolbar {
  margin-bottom: 12px;
}
.placeholder-content {
  padding: 48px 24px;
  text-align: center;
  color: #999;
}
.power-range-tip {
  margin-bottom: 12px;
  font-size: 13px;
  color: #666;
}
.purchase-power-tip {
  color: red;
  text-align: left;
}
.purchase-power-tip-second {
  display: inline-block;
  padding-left: 3em;
}
.power-range-grid-wrap {
  overflow: auto;
  max-height: 70vh;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}
/* 采购弹窗内：不横向滚动，表格宽度由柱镜列数决定，完整显示 */
.purchase-power-modal .purchase-modal-grid-wrap {
  overflow-x: visible;
  overflow-y: auto;
}
.purchase-power-modal .power-range-table {
  min-width: unset;
}
.power-range-table {
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
  min-width: 800px;
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
  min-width: 44px;
  padding: 4px 4px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  font-weight: 600;
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
  min-width: 44px;
  height: 22px;
  padding: 0 4px;
  border: 1px solid #e8e8e8;
  cursor: default;
  user-select: none;
}
.power-range-td.selected {
  background: #bae7ff;
}
.power-range-cell-qty {
  display: block;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
}
.power-range-td.disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}
.power-range-result {
  margin-top: 12px;
  padding: 8px 12px;
  background: #e6f7ff;
  border-radius: 4px;
  font-size: 13px;
}
.purchase-no-power-product-name {
  font-weight: 500;
  color: #333;
}
.no-power-range-models {
  margin-top: 8px;
}
.no-power-range-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.no-power-range-row .no-power-range-label {
  color: rgba(0, 0, 0, 0.65);
  white-space: nowrap;
}
.no-power-range-row .no-power-model-input {
  width: 180px;
}
.no-power-range-row .no-power-qty-input {
  width: 80px;
}
.add-model-btn {
  margin-top: 8px;
  max-width: 140px;
}
.quantity-input-short {
  width: 80px;
}
.purchase-row-inline {
  margin-bottom: 8px;
}
.purchase-row-inline:last-child {
  margin-bottom: 0;
}
.purchase-row-inline-wrap {
  display: flex;
  align-items: center;
  gap: 0;
}
.purchase-row-inline-wrap .purchase-row-label {
  margin-right: 0;
  color: rgba(0, 0, 0, 0.65);
  white-space: nowrap;
}
.purchase-unit-price-input {
  width: 120px;
}
.purchase-total-value {
  font-weight: 500;
  color: #333;
}
.plan-detail-model-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}
.plan-detail-model-table th,
.plan-detail-model-table td {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
  text-align: center;
}
.plan-detail-model-table .plan-detail-summary th {
  background: #e6f7ff;
  font-weight: 500;
}
.plan-detail-model-table thead tr:last-child th {
  background: #fafafa;
  font-weight: 600;
}
.purchase-confirm-content p {
  margin-bottom: 8px;
}
.purchase-confirm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.purchase-confirm-table th,
.purchase-confirm-table td {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
  text-align: center;
}
.purchase-confirm-table th {
  background: #fafafa;
  font-weight: 600;
}
.purchase-confirm-table .confirm-table-summary td {
  background: #e6f7ff;
  font-weight: 500;
  text-align: center;
  border: 1px solid #91d5ff;
}
.confirm-table-wrap {
  max-height: 580px;
  overflow-y: auto;
  margin-top: 12px;
}
.plan-action-cell {
  white-space: nowrap;
}
.plan-action-link {
  margin: 0 4px;
}
.plan-action-delete {
  color: #ff4d4f;
}
.plan-detail-content {
  max-height: 70vh;
  overflow: auto;
}
.stock-in-confirm-body .stock-in-detail {
  margin-bottom: 16px;
}
.stock-in-table-tip {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #666;
}
.stock-in-grid.plan-detail-grid .plan-detail-td {
  cursor: pointer;
  user-select: none;
}
.stock-in-grid.plan-detail-grid .plan-detail-td.stock-in-cell-td {
  white-space: nowrap;
}
.stock-in-grid.plan-detail-grid .plan-detail-td .stock-in-sel-inline {
  font-size: 11px;
  color: #1890ff;
}
.stock-in-grid.plan-detail-grid .plan-detail-td.stock-in-cell-selected {
  background: #e6f7ff;
  border-color: #91d5ff;
}
.stock-in-selected-list {
  margin-top: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}
.stock-in-selected-list-title {
  padding: 8px 12px;
  background: #fafafa;
  font-weight: 600;
  font-size: 13px;
}
.stock-in-selected-summary {
  padding: 6px 12px;
  background: #fafafa;
  font-size: 13px;
  color: #333;
  border-top: 1px solid #e8e8e8;
}
.stock-in-selected-summary-num {
  color: #1890ff;
  font-weight: 500;
}
.stock-in-selected-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.stock-in-selected-table th,
.stock-in-selected-table td {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
  text-align: left;
}
.stock-in-selected-table th {
  background: #fafafa;
  font-weight: 600;
  width: 60%;
}
.stock-in-selected-table th:last-child {
  width: 40%;
}
.stock-in-selected-qty-cell {
  text-align: center;
}
.stock-in-selected-qty-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.stock-in-qty-btn {
  min-width: 28px;
  padding: 0 6px;
  font-size: 14px;
  line-height: 1;
}
.stock-in-selected-qty-num {
  min-width: 1.5em;
  text-align: center;
  font-weight: 500;
}
.stock-in-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.stock-in-modal-footer-right {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.plan-detail-grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.plan-detail-grid th,
.plan-detail-grid td {
  border: 1px solid #e8e8e8;
  padding: 6px 10px;
  text-align: center;
  min-width: 56px;
  white-space: nowrap;
}
.plan-detail-summary th {
  background: #e6f7ff;
  font-weight: 500;
  text-align: center;
  border: 1px solid #91d5ff;
  padding: 8px 12px;
}
.plan-detail-corner {
  background: #fafafa;
  font-weight: 600;
  min-width: 88px;
  width: 88px;
}
.plan-detail-th {
  background: #fafafa;
  font-weight: 600;
  min-width: 56px;
}
.plan-detail-td-label {
  background: #fafafa;
  font-weight: 500;
  min-width: 88px;
  width: 88px;
}
.plan-detail-empty {
  color: #999;
  text-align: center;
  padding: 24px;
}
</style>
