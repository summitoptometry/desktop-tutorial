<template>
  <div class="inventory-page">
    <a-card>
      <a-tabs v-model:activeKey="activeSubKey" type="card">
        <a-tab-pane key="stock-list" tab="库存列表">
          <a-tabs v-model:activeKey="stockListSubKey" type="card" size="small">
            <a-tab-pane key="managed" tab="库管商品列表">
              <div class="stock-list-wrap">
                <div class="stock-list-toolbar">
                  <a-select
                    v-model:value="stockListCategoryFilter"
                    placeholder="全部类型"
                    allow-clear
                    style="width: 160px; margin-right: 8px"
                    :options="stockListCategoryFilterOptions"
                  />
                  <a-input
                    v-model:value="stockSearchKeyword"
                    placeholder="商品名称（支持拼音首字母检索）"
                    allow-clear
                    style="width: 280px; margin-right: 8px"
                  />
                </div>
                <a-table
                  :columns="stockListColumnsWithAction"
                  :data-source="filteredStockList"
                  :pagination="false"
                  :locale="tableLocale"
                  row-key="id"
                  size="small"
                  class="stock-list-table"
                >
                  <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'index'">{{ index + 1 }}</template>
                    <template v-else-if="column.key === 'category'">{{ getCategoryName(record) }}</template>
                    <template v-else-if="column.key === 'retailPrice'">{{ formatPrice(record.retailPrice) }}</template>
                    <template v-else-if="column.key === 'purchasePrice'">{{ formatPrice(record.purchasePrice) }}</template>
                    <template v-else-if="column.key === 'stockQty'">{{ displayStockQuantity(record) }}</template>
                    <template v-else-if="column.key === 'viewDetail'">
                      <a-button type="link" size="small" @click="openStockDetail(record)">查看库存明细</a-button>
                    </template>
                    <template v-else-if="column.key === 'warning'">
                      <a-button type="link" size="small" @click="openWarningModal(record)">库存预警</a-button>
                    </template>
                    <template v-else-if="column.key === 'outbound'">
                      <a-button type="link" size="small" @click="openOutboundModal(record)">出库</a-button>
                    </template>
                    <template v-else-if="column.key === 'action'">
                      <a-popconfirm
                        title="确定清空该商品的库存数量吗？"
                        ok-text="确定"
                        cancel-text="取消"
                        @confirm="clearStockForProduct(record)"
                      >
                        <a-button type="link" size="small">清空库存</a-button>
                      </a-popconfirm>
                    </template>
                  </template>
                </a-table>
              </div>
            </a-tab-pane>
            <a-tab-pane key="custom" tab="定制商品列表">
              <div class="stock-list-wrap">
                <div class="stock-list-toolbar">
                  <a-select
                    v-model:value="customListCategoryFilter"
                    placeholder="全部类型"
                    allow-clear
                    style="width: 160px; margin-right: 8px"
                    :options="stockListCategoryFilterOptions"
                  />
                  <a-input
                    v-model:value="customSearchKeyword"
                    placeholder="商品名称（支持拼音首字母检索）"
                    allow-clear
                    style="width: 280px; margin-right: 8px"
                  />
                </div>
                <a-table
                  :columns="stockListColumnsWithAction"
                  :data-source="filteredCustomList"
                  :pagination="false"
                  :locale="tableLocale"
                  row-key="id"
                  size="small"
                  class="stock-list-table"
                >
                  <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'index'">{{ index + 1 }}</template>
                    <template v-else-if="column.key === 'category'">{{ getCategoryName(record) }}</template>
                    <template v-else-if="column.key === 'retailPrice'">{{ formatPrice(record.retailPrice) }}</template>
                    <template v-else-if="column.key === 'purchasePrice'">{{ formatPrice(record.purchasePrice) }}</template>
                    <template v-else-if="column.key === 'stockQty'">{{ displayStockQuantity(record) }}</template>
                    <template v-else-if="column.key === 'viewDetail'">
                      <a-button type="link" size="small" @click="openStockDetail(record)">查看库存明细</a-button>
                    </template>
                    <template v-else-if="column.key === 'warning'">-</template>
                    <template v-else-if="column.key === 'outbound'">
                      <a-button type="link" size="small" @click="openOutboundModal(record)">出库</a-button>
                    </template>
                    <template v-else-if="column.key === 'action'">
                      <a-popconfirm
                        title="确定清空该商品的库存数量吗？"
                        ok-text="确定"
                        cancel-text="取消"
                        @confirm="clearStockForProduct(record)"
                      >
                        <a-button type="link" size="small">清空库存</a-button>
                      </a-popconfirm>
                    </template>
                  </template>
                </a-table>
              </div>
            </a-tab-pane>
          </a-tabs>
        </a-tab-pane>
        <a-tab-pane key="warning-list" tab="库存预警列表">
          <div class="stock-list-wrap">
            <div class="stock-list-toolbar">
              <a-select
                v-model:value="warningListCategoryFilter"
                placeholder="全部类型"
                allow-clear
                style="width: 160px; margin-right: 8px"
                :options="stockListCategoryFilterOptions"
              />
              <a-input
                v-model:value="warningListSearchKeyword"
                placeholder="商品名称（支持拼音首字母检索）"
                allow-clear
                style="width: 280px; margin-right: 8px"
              />
            </div>
            <a-table
              :columns="warningListColumns"
              :data-source="filteredWarningList"
              :pagination="false"
              row-key="id"
              size="small"
              class="stock-list-table"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'index'">{{ index + 1 }}</template>
                <template v-else-if="column.key === 'category'">{{ getCategoryName(record) }}</template>
                <template v-else-if="column.key === 'warningCount'">{{ record.warningCount }} {{ getProductUnit(record) }}</template>
                <template v-else-if="column.key === 'viewWarning'">
                  <a-button type="link" size="small" @click="openViewWarningModal(record)">预警查看</a-button>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
        <a-tab-pane key="in-out-log" tab="出入库日志">
          <a-tabs v-model:activeKey="inOutLogSubKey" type="line" class="sub-tabs">
            <a-tab-pane key="in" tab="入库记录">
              <a-table
                :columns="inOutLogColumnsIn"
                :data-source="inLogList"
                :pagination="{ pageSize: 20 }"
                row-key="id"
                size="small"
                class="in-out-log-table"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'retailPrice'">{{ formatInOutPrice(record.retailPrice) }}</template>
                  <template v-else-if="column.key === 'purchasePrice'">{{ formatInOutPrice(record.purchasePrice) }}</template>
                  <template v-else-if="column.key === 'amount'">{{ formatInOutPrice(record.amount) }}</template>
                  <template v-else-if="column.key === 'viewDetail'">
                    <a @click="openLogDetail(record, 'in')">查看入库明细</a>
                    <a-divider type="vertical" />
                    <a-popconfirm title="确定删除该条入库记录吗？" ok-text="确定" cancel-text="取消" @confirm="deleteLogRecord(record)">
                      <a class="log-action-delete">删除</a>
                    </a-popconfirm>
                  </template>
                </template>
              </a-table>
            </a-tab-pane>
            <a-tab-pane key="out" tab="出库记录">
              <a-table
                :columns="inOutLogColumnsOut"
                :data-source="outLogList"
                :pagination="{ pageSize: 20 }"
                row-key="id"
                size="small"
                class="in-out-log-table"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'retailPrice'">{{ formatInOutPrice(record.retailPrice) }}</template>
                  <template v-else-if="column.key === 'purchasePrice'">{{ formatInOutPrice(record.purchasePrice) }}</template>
                  <template v-else-if="column.key === 'amount'">{{ formatInOutPrice(record.amount) }}</template>
                  <template v-else-if="column.key === 'viewDetail'">
                    <a @click="openLogDetail(record, 'out')">查看出库明细</a>
                    <a-divider type="vertical" />
                    <a-popconfirm title="确定删除该条出库记录吗？" ok-text="确定" cancel-text="取消" @confirm="deleteLogRecord(record)">
                      <a class="log-action-delete">删除</a>
                    </a-popconfirm>
                  </template>
                </template>
              </a-table>
            </a-tab-pane>
          </a-tabs>
        </a-tab-pane>
      </a-tabs>
    </a-card>
    <!-- 出入库记录明细弹窗：有光度时显示光度表格 -->
    <a-modal
      v-model:visible="logDetailVisible"
      :title="logDetailRecord ? (logDetailType === 'in' ? '入库明细' : '出库明细') + ' - ' + (logDetailRecord.productName || '') : ''"
      width="800px"
      :footer="null"
      @cancel="closeLogDetail"
    >
      <div v-if="logDetailRecord" class="log-detail-content">
        <template v-if="logDetailGrid.rows.length">
          <table class="plan-detail-grid" v-if="logDetailGrid.rows.length">
            <thead>
              <tr class="plan-detail-summary">
                <th :colspan="logDetailGrid.columns.length + 1">光度个数：{{ logDetailGrid.cellCount }}，总数量：{{ logDetailGrid.totalQty }} 片</th>
              </tr>
              <tr>
                <th class="plan-detail-corner">球镜/柱镜</th>
                <th v-for="c in logDetailGrid.columns" :key="c" class="plan-detail-th">{{ formatPowerValue(c) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in logDetailGrid.rows" :key="s">
                <td class="plan-detail-td-label">{{ formatSphereValue(s) }}</td>
                <td v-for="c in logDetailGrid.columns" :key="`${s}-${c}`" class="plan-detail-td">
                  {{ logDetailGrid.getQty(s, c) || '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>
        <p v-else class="plan-detail-empty">总数量：{{ logDetailRecord.quantity }} 片（无分光度明细）</p>
      </div>
    </a-modal>
    <!-- 有光度范围：库存明细表格弹窗（与采购列表查看明细一致，显示光度表格中的数量） -->
    <a-modal
      v-model:visible="stockDetailModalVisible"
      :title="stockDetailProduct ? `库存明细 - ${stockDetailProduct.name}` : '查看库存明细'"
      width="800px"
      :footer="null"
    >
      <div v-if="stockDetailProduct" class="stock-detail-content">
        <table class="plan-detail-grid" v-if="stockDetailGrid.rows.length">
          <thead>
            <tr class="plan-detail-summary">
              <th :colspan="stockDetailGrid.columns.length + 1">光度个数：{{ stockDetailGrid.cellCount }}，总数量：{{ stockDetailGrid.totalQty }} {{ getProductUnit(stockDetailProduct) }}</th>
            </tr>
            <tr>
              <th class="plan-detail-corner">球镜/柱镜</th>
              <th v-for="c in stockDetailGrid.columns" :key="c" class="plan-detail-th">{{ formatPowerValue(c) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in stockDetailGrid.rows" :key="s">
              <td class="plan-detail-td-label">{{ formatSphereValue(s) }}</td>
              <td v-for="c in stockDetailGrid.columns" :key="`${s}-${c}`" class="plan-detail-td">
                {{ stockDetailGrid.getQty(s, c) ?? '' }}
              </td>
            </tr>
          </tbody>
        </table>
        <table v-else-if="stockDetailModelEntries.length" class="plan-detail-grid plan-detail-model-table">
          <thead>
            <tr class="plan-detail-summary">
              <th colspan="2">型号明细，总数量：{{ stockDetailModelTotalQty }} {{ getProductUnit(stockDetailProduct) }}</th>
            </tr>
            <tr>
              <th>型号</th>
              <th>数量（{{ getProductUnit(stockDetailProduct) }}）</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(e, i) in stockDetailModelEntries" :key="i">
              <td>{{ e.model }}</td>
              <td>{{ e.quantity }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="plan-detail-empty">该商品暂无库存明细。</p>
      </div>
    </a-modal>
    <!-- 无光度范围时直接显示数量 -->
    <a-modal
      v-model:visible="quantityModalVisible"
      title="库存数量"
      :footer="null"
      width="360px"
    >
      <p v-if="quantityModalProduct" class="quantity-desc">在库数量：{{ displayStockQuantity(quantityModalProduct) }} {{ getProductUnit(quantityModalProduct) }}</p>
    </a-modal>

    <!-- 库存预警：有光度范围时与采购相同方式选择格子，左键+1、右键-1；无光度为数量预警 -->
    <a-modal
      v-model:visible="warningModalVisible"
      :title="warningProduct ? `库存预警 - ${warningProduct.name}` : '库存预警'"
      :width="warningProduct && !warningGrid.rows.length ? '420px' : '900px'"
      :body-style="{ maxHeight: '85vh', overflowY: 'auto' }"
      ok-text="保存"
      cancel-text="取消"
      @ok="saveWarningModal"
      @cancel="closeWarningModal"
    >
      <div v-if="warningProduct && warningGrid.rows.length" class="warning-modal-body">
        <div class="power-range-tip">鼠标左键预警数量+1，鼠标右键预警数量-1，可拖拉选中。</div>
        <div
          class="power-range-grid-wrap"
          @mousedown="onWarningGridMouseDown"
          @mousemove="onWarningGridMouseMove"
          @mouseup="onWarningGridMouseUp"
          @mouseleave="cancelWarningGridDrag"
          @contextmenu.prevent
        >
          <table class="power-range-table">
            <thead>
              <tr>
                <th class="power-range-corner">球镜/柱镜</th>
                <th v-for="c in warningGrid.columns" :key="c" class="power-range-th">{{ formatPowerValue(c) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in warningGrid.rows" :key="s" :data-sphere="s">
                <td class="power-range-td-label">{{ formatSphereValue(s) }}</td>
                <td
                  v-for="c in warningGrid.columns"
                  :key="`${s}-${c}`"
                  class="power-range-td"
                  :class="{ selected: isWarningCellSelected(s, c) }"
                  :data-sphere="s"
                  :data-cylinder="c"
                >
                  <span v-if="getWarningQtyDisplay(s, c) != null" class="power-range-cell-qty">{{ getWarningQtyDisplay(s, c) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="warningProduct" class="no-power-warning-wrap">
        <p class="quantity-desc">当前在库数量：{{ displayStockQuantity(warningProduct) }} {{ getProductUnit(warningProduct) }}</p>
        <div class="no-power-warning-row">
          <span>预警数量({{ getProductUnit(warningProduct) }})：</span>
          <div class="number-with-controls">
            <a-button size="small" @click="stepNoPowerWarningQty(-1)">-</a-button>
            <a-input-number
              v-model:value="noPowerWarningQty"
              :min="0"
              :controls="false"
              placeholder="0"
              style="width: 80px"
            />
            <a-button size="small" @click="stepNoPowerWarningQty(1)">+</a-button>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 预警查看：左键增加采购数量、右键减少，采购数量绿色，基数=预警数量，可点采购/取消 -->
    <a-modal
      v-model:visible="viewWarningModalVisible"
      :title="viewWarningProduct ? `预警查看 - ${viewWarningProduct.name}` : '预警查看'"
      width="900px"
      :body-style="{ maxHeight: '85vh', overflowY: 'auto' }"
      ok-text="采购"
      cancel-text="取消"
      @ok="confirmViewWarningPurchase"
      @cancel="closeViewWarningModal"
    >
      <div v-if="viewWarningProduct && viewWarningGrid.rows.length" class="view-warning-modal-body">
        <p class="warning-tip-inline"><span class="warning-tip-label">提示：</span>红色：库存数量＜预警数量，黑色：库存数量≥预警数量，绿色：采购数量/预警数量。<br />采购数量编辑方法：鼠标左键+/鼠标右键-，拖拉批量选择：行/列</p>
        <div
          class="power-range-grid-wrap"
          @mousedown="onViewWarningGridMouseDown"
          @mousemove="onViewWarningGridMouseMove"
          @mouseup="onViewWarningGridMouseUp"
          @mouseleave="cancelViewWarningGridDrag"
          @contextmenu.prevent
        >
          <table class="power-range-table">
            <thead>
              <tr>
                <th class="power-range-corner">球镜/柱镜</th>
                <th v-for="c in viewWarningGrid.columns" :key="c" class="power-range-th">{{ formatPowerValue(c) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in viewWarningGrid.rows" :key="s" :data-sphere="s">
                <td class="power-range-td-label">{{ formatSphereValue(s) }}</td>
                <td
                  v-for="c in viewWarningGrid.columns"
                  :key="`${s}-${c}`"
                  class="power-range-td view-warning-cell-td"
                  :class="{ selected: isViewWarningCellSelected(s, c), disabled: !getViewWarningQty(s, c) }"
                  :data-sphere="s"
                  :data-cylinder="c"
                >
                  <span v-if="getViewWarningQty(s, c)" class="view-warning-cell-text">
                    <template v-if="getViewWarningPurchaseQty(s, c) > 0">
                      <span class="view-purchase-qty">{{ getViewWarningPurchaseQty(s, c) }}</span>/{{ getViewWarningQty(s, c) }}
                    </template>
                    <template v-else>
                      <span :class="{ 'view-stock-alert': getViewWarningStock(s, c) < getViewWarningQty(s, c) }">{{ getViewWarningStock(s, c) }}</span>/{{ getViewWarningQty(s, c) }}
                    </template>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="viewWarningProduct && getViewWarningNoPowerQty() != null" class="no-power-warning-wrap">
        <p class="quantity-desc">当前在库数量：{{ displayStockQuantity(viewWarningProduct) }} {{ getProductUnit(viewWarningProduct) }}</p>
        <p class="quantity-desc">预警数量：{{ getViewWarningNoPowerQty() }} {{ getProductUnit(viewWarningProduct) }}</p>
        <div class="no-power-warning-row">
          <span>建议采购数量({{ getProductUnit(viewWarningProduct) }})：</span>
          <div class="number-with-controls">
            <a-button size="small" @click="stepNoPowerViewPurchaseQty(-1)">-</a-button>
            <a-input-number
              v-model:value="noPowerViewPurchaseQty"
              :min="0"
              :controls="false"
              placeholder="0"
              style="width: 80px"
            />
            <a-button size="small" @click="stepNoPowerViewPurchaseQty(1)">+</a-button>
          </div>
        </div>
      </div>
      <p v-else-if="viewWarningProduct" class="plan-detail-empty">该商品无光度范围或暂无预警设置。</p>
    </a-modal>

    <!-- 出库：有光度范围时按格子选数量（左键+1、右键-1）；无光度为数量输入 -->
    <a-modal
      v-model:visible="outboundModalVisible"
      :title="outboundProduct ? `出库 - ${outboundProduct.name}` : '出库'"
      :width="outboundProduct && outboundGrid.rows.length ? '900px' : '420px'"
      :body-style="{ maxHeight: '85vh', overflowY: 'auto' }"
      ok-text="确认出库"
      cancel-text="取消"
      @ok="confirmOutbound"
      @cancel="closeOutboundModal"
    >
      <div v-if="outboundProduct && outboundGrid.rows.length" class="warning-modal-body">
        <div class="power-range-tip">
          鼠标左键出库数量+1，鼠标右键出库数量-1，可拖拉选中。出库数量不能超过在库数量。
        </div>
        <div
          class="power-range-grid-wrap"
          @mousedown="onOutboundGridMouseDown"
          @mousemove="onOutboundGridMouseMove"
          @mouseup="onOutboundGridMouseUp"
          @mouseleave="cancelOutboundGridDrag"
          @contextmenu.prevent
        >
          <table class="power-range-table">
            <thead>
              <tr>
                <th class="power-range-corner">球镜/柱镜</th>
                <th v-for="c in outboundGrid.columns" :key="c" class="power-range-th">{{ formatPowerValue(c) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in outboundGrid.rows" :key="s" :data-sphere="s">
                <td class="power-range-td-label">{{ formatSphereValue(s) }}</td>
                <td
                  v-for="c in outboundGrid.columns"
                  :key="`${s}-${c}`"
                  class="power-range-td"
                  :class="{ selected: isOutboundCellSelected(s, c) }"
                  :data-sphere="s"
                  :data-cylinder="c"
                >
                  <span v-if="getOutboundCellStock(s, c) > 0" class="power-range-cell-qty">
                    {{ getOutboundQty(s, c) != null ? getOutboundQty(s, c) + '/' : '' }}{{ getOutboundCellStock(s, c) }}
                  </span>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="outbound-modal-footer-left">
          <a-button v-if="!outboundFullSelectMode" type="primary" @click="selectAllOutbound">全选</a-button>
          <a-button v-else type="primary" @click="clearOutboundSelection">取消</a-button>
        </div>
      </div>
      <div v-else-if="outboundProduct" class="no-power-warning-wrap">
        <p class="quantity-desc">当前在库数量：{{ displayStockQuantity(outboundProduct) }} {{ getProductUnit(outboundProduct) }}</p>
        <div class="no-power-warning-row">
          <span>出库数量({{ getProductUnit(outboundProduct) }})：</span>
          <div class="number-with-controls">
            <a-button size="small" @click="stepOutboundNoPowerQty(-1)">-</a-button>
            <a-input-number
              v-model:value="outboundNoPowerQty"
              :min="1"
              :max="displayStockQuantity(outboundProduct)"
              :controls="false"
              placeholder="请输入"
              style="width: 120px"
            />
            <a-button size="small" @click="stepOutboundNoPowerQty(1)">+</a-button>
          </div>
        </div>
      </div>
    </a-modal>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, onBeforeUnmount, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { pinyin } from 'pinyin-pro';

const PRODUCT_STORAGE_KEY = 'ProductModaldata';
const CATEGORY_STORAGE_KEY = 'ProductCategoryData';
const POWER_TEMPLATE_STORAGE_KEY = 'PowerRangeTemplates';
const LENS_DATA_KEY = 'lensdata';
const LENS_WARNING_KEY = 'LensWarningData';
const NO_POWER_WARNING_KEY = '__noPower__'; // 无光度商品的数量预警在 storage 中的 key
const PURCHASE_PLAN_ENTRIES_KEY = 'PurchasePlanEntries';
const IN_OUT_LOG_KEY = 'InOutLogData';

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
const CYLINDER_EXCLUDE = -0.25;

const activeSubKey = ref('stock-list');
const stockListSubKey = ref('managed');
const stockSearchKeyword = ref('');
const stockListCategoryFilter = ref(null);
const customSearchKeyword = ref('');
const customListCategoryFilter = ref(null);
const productList = ref([]);
const categoryList = ref([]);
const powerRangeTemplates = ref([]);
const stockDetailModalVisible = ref(false);
const stockDetailProduct = ref(null);
const quantityModalVisible = ref(false);
const quantityModalProduct = ref(null);
const warningModalVisible = ref(false);
const warningProduct = ref(null);
const warningCellValues = ref({});
const warningDrag = ref({ start: null, current: null, mode: 'add', button: 0 });
const noPowerWarningQty = ref(undefined); // 无光度时的单一预警数量（数字）
const warningListSearchKeyword = ref('');
const warningListCategoryFilter = ref(null);
const viewWarningModalVisible = ref(false);
const viewWarningProduct = ref(null);
const viewWarningPurchaseQty = ref({});
const noPowerViewPurchaseQty = ref(0); // 无光度预警查看时的建议采购数量
const viewWarningDrag = ref({ start: null, current: null, mode: 'add', button: 0, axisLock: null });
const outboundModalVisible = ref(false);
const outboundProduct = ref(null);
const outboundCellValues = ref({});
const outboundNoPowerQty = ref(undefined);
const outboundDrag = ref({ start: null, current: null, mode: 'add', button: 0 });
const outboundFullSelectMode = ref(false); // true 时显示「取消」，false 时显示「全选」
const warningListColumns = [
  { title: '序号', key: 'index', width: 72, align: 'center' },
  { title: '商品名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类别', key: 'category', width: 140 },
  { title: '预警数量', key: 'warningCount', width: 120, align: 'center' },
  { title: '预警查看', key: 'viewWarning', width: 100, align: 'center' }
];

const tableLocale = {
  triggerAsc: '点击升序',
  triggerDesc: '点击降序',
  cancelSort: '点击取消排序'
};

const stockListColumns = [
  { title: '序号', key: 'index', width: 72, align: 'center' },
  { title: '商品名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类别', key: 'category', width: 140, sorter: (a, b) => getCategoryName(a).localeCompare(getCategoryName(b), 'zh-CN') },
  { title: '零售价格', key: 'retailPrice', width: 110, align: 'right' },
  { title: '在库数量', key: 'stockQty', width: 110, align: 'center', sorter: (a, b) => displayStockQuantity(a) - displayStockQuantity(b) },
  { title: '查看库存明细', key: 'viewDetail', width: 120, align: 'center' },
  { title: '库存预警', key: 'warning', width: 100, align: 'center' },
  { title: '出库', key: 'outbound', width: 80, align: 'center' },
  { title: '采购价格', key: 'purchasePrice', width: 110, align: 'right' }
];
const stockListColumnsWithAction = [
  ...stockListColumns,
  { title: '操作', key: 'action', width: 140, align: 'center' }
];

const inOutLogSubKey = ref('in');
const inOutLogList = ref([]);
function getInOutLogListRaw() {
  try {
    const raw = localStorage.getItem(IN_OUT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function loadInOutLogList() {
  inOutLogList.value = getInOutLogListRaw();
}
function generateInOutCode(type) {
  const prefix = type === 'out' ? 'CK' : 'RK';
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const datePrefix = `${prefix}${yy}${mm}${dd}`;
  const list = getInOutLogListRaw();
  const todayCodes = list.filter((x) => x.type === type && x.code && String(x.code).startsWith(datePrefix));
  const maxSeq = todayCodes.length
    ? Math.max(...todayCodes.map((x) => parseInt(String(x.code).slice(-3), 10) || 0), 0)
    : 0;
  const seq = String(maxSeq + 1).padStart(3, '0');
  return `${datePrefix}${seq}`;
}
function appendInOutLog(type, payload) {
  const list = getInOutLogListRaw();
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
const inLogList = computed(() => inOutLogList.value.filter((x) => x.type === 'in').slice().reverse());
const outLogList = computed(() => inOutLogList.value.filter((x) => x.type === 'out').slice().reverse());
const inOutLogColumnsIn = [
  { title: '编号', dataIndex: 'code', key: 'code', width: 120, align: 'center' },
  { title: '入库时间', dataIndex: 'time', key: 'time', width: 170, ellipsis: true },
  { title: '商品名称', dataIndex: 'productName', key: 'productName', ellipsis: true },
  { title: '零售价格', key: 'retailPrice', width: 100, align: 'right' },
  { title: '入库数量', dataIndex: 'quantity', key: 'quantity', width: 110, align: 'center' },
  { title: '操作', key: 'viewDetail', width: 160, align: 'center' },
  { title: '采购单价', key: 'purchasePrice', width: 100, align: 'right' },
  { title: '采购金额', key: 'amount', width: 110, align: 'right' }
];
const inOutLogColumnsOut = [
  { title: '编号', dataIndex: 'code', key: 'code', width: 120, align: 'center' },
  { title: '出库时间', dataIndex: 'time', key: 'time', width: 170, ellipsis: true },
  { title: '商品名称', dataIndex: 'productName', key: 'productName', ellipsis: true },
  { title: '零售价格', key: 'retailPrice', width: 100, align: 'right' },
  { title: '出库数量', dataIndex: 'quantity', key: 'quantity', width: 110, align: 'center' },
  { title: '操作', key: 'viewDetail', width: 160, align: 'center' },
  { title: '采购单价', key: 'purchasePrice', width: 100, align: 'right' },
  { title: '采购金额', key: 'amount', width: 110, align: 'right' }
];
function formatInOutPrice(val) {
  if (val == null || val === '') return '-';
  const n = Number(val);
  if (Number.isNaN(n)) return '-';
  return `¥ ${n.toFixed(1)}`;
}

const logDetailVisible = ref(false);
const logDetailRecord = ref(null);
const logDetailType = ref('in');
const logDetailGrid = computed(() => {
  const record = logDetailRecord.value;
  const entries = record && record.detailEntries ? record.detailEntries : [];
  if (!entries.length) return { rows: [], columns: [], cellCount: 0, totalQty: 0, getQty: () => null };
  const cellMap = {};
  const sphereSet = new Set();
  const cylinderSet = new Set();
  entries.forEach((e) => {
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
function openLogDetail(record, type) {
  logDetailRecord.value = record;
  logDetailType.value = type;
  logDetailVisible.value = true;
}
function closeLogDetail() {
  logDetailVisible.value = false;
  logDetailRecord.value = null;
}
function saveInOutLogList(list) {
  localStorage.setItem(IN_OUT_LOG_KEY, JSON.stringify(list));
}
function deleteLogRecord(record) {
  const list = getInOutLogListRaw().filter((x) => x.id !== record.id);
  saveInOutLogList(list);
  loadInOutLogList();
  if (logDetailRecord.value && logDetailRecord.value.id === record.id) closeLogDetail();
  message.success('已删除');
}

function getProductListRaw() {
  const raw = localStorage.getItem(PRODUCT_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function loadProductList() {
  const rawList = getProductListRaw();
  productList.value = rawList.map((p) => ({
    ...p,
    categoryId: p.categoryId != null ? p.categoryId : (typeof p.category === 'number' ? p.category : null),
    inventoryManageType: p.inventoryManageType === 'stock' ? 'stock' : 'custom'
  }));
}

function loadCategoryList() {
  const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
  categoryList.value = raw ? JSON.parse(raw) : [];
}

function formatPowerValue(v) {
  return (Number(v) === v ? Number(v).toFixed(2) : String(v));
}
function formatSphereValue(v) {
  const n = Number(v);
  if (n !== n) return String(v);
  return n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
}
function parsePowerRangeDesc(desc) {
  if (!desc || typeof desc !== 'string') return null;
  const m = desc.match(/球镜\s*([+-]?\d+\.?\d*)D.*柱镜\s*([+-]?\d+\.?\d*)D/);
  if (!m) return null;
  const s = Number(m[1]);
  const c = Number(m[2]);
  return Number.isNaN(s) || Number.isNaN(c) ? null : { s, c };
}
function getPowerTemplateDescription(t) {
  if (!t) return '';
  return `球镜 ${formatSphereValue(t.sphereMin)}D ~ ${formatSphereValue(t.sphereMax)}D，柱镜 ${formatPowerValue(t.cylinderMin)}D ~ ${formatPowerValue(t.cylinderMax)}D`;
}

function loadPowerRangeTemplates() {
  const raw = localStorage.getItem(POWER_TEMPLATE_STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  powerRangeTemplates.value = list.map((t) => ({ ...t, description: getPowerTemplateDescription(t) }));
}

function getCategoryName(product) {
  const id = product.categoryId != null ? product.categoryId : (typeof product.category === 'number' ? product.category : null);
  if (id == null) return product.category != null ? String(product.category) : '-';
  const c = categoryList.value.find((x) => x.id === id);
  return c ? c.name : '-';
}

/** 商品数量单位：按类别取 unit（如护理液为瓶），默认片 */
function getProductUnit(product) {
  if (!product) return '片';
  const id = product.categoryId != null ? product.categoryId : (typeof product.category === 'number' ? product.category : null);
  if (id == null) return '片';
  const c = categoryList.value.find((x) => x.id === id);
  return (c && c.unit != null && String(c.unit).trim() !== '') ? String(c.unit).trim() : '片';
}

function formatPrice(v) {
  if (v == null || v === '') return '-';
  const n = Number(v);
  if (Number.isNaN(n)) return '-';
  return `¥ ${n.toFixed(1)}`;
}

function getLensData() {
  const raw = localStorage.getItem(LENS_DATA_KEY);
  return raw ? JSON.parse(raw) : [];
}

function displayStockQuantity(product) {
  const lensData = getLensData();
  const productId = product.id != null ? String(product.id) : '';
  const items = lensData.filter((item) => String(item.productid || item.productId) === productId);
  return items.reduce((sum, item) => sum + (Number(item.currentStock) || 0), 0);
}

const stockDetailGrid = computed(() => {
  const product = stockDetailProduct.value;
  if (!product || !product.powerRangeTemplateId) return { rows: [], columns: [], cellCount: 0, totalQty: 0, getQty: () => null };
  const t = powerRangeTemplates.value.find((x) => x.id === product.powerRangeTemplateId);
  if (!t) return { rows: [], columns: [], cellCount: 0, totalQty: 0, getQty: () => null };
  const sMin = Math.min(t.sphereMin, t.sphereMax);
  const sMax = Math.max(t.sphereMin, t.sphereMax);
  const cMin = Math.min(t.cylinderMin, t.cylinderMax);
  const cMax = Math.max(t.cylinderMin, t.cylinderMax);
  const rows = sphereValuesArr.filter((s) => s >= sMin && s <= sMax);
  const columns = cylinderValuesArr.filter((c) => c >= cMin && c <= cMax && c !== CYLINDER_EXCLUDE);
  const lensData = getLensData();
  const productId = String(product.id);
  const cellMap = {};
  let totalQty = 0;
  lensData.forEach((item) => {
    if (String(item.productid || item.productId) !== productId) return;
    const s = Number(item.sphere);
    const c = Number(item.cylinder);
    if (Number.isNaN(s) || Number.isNaN(c)) return;
    const key = `${s},${c}`;
    const q = Math.floor(Number(item.currentStock) || 0);
    cellMap[key] = (cellMap[key] || 0) + q;
    totalQty += q;
  });
  const cellCount = Object.keys(cellMap).filter((k) => (cellMap[k] || 0) > 0).length;
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

// 无光度商品：按型号汇总的库存明细（采购时输入了型号则按型号显示）
const stockDetailModelEntries = computed(() => {
  const product = stockDetailProduct.value;
  if (!product) return [];
  const productId = String(product.id);
  const lensData = getLensData();
  const map = {};
  lensData.forEach((item) => {
    if (String(item.productid || item.productId) !== productId) return;
    const q = Math.floor(Number(item.currentStock) || 0);
    if (q <= 0) return;
    const modelDisplay = (item.model != null && String(item.model).trim() !== '') ? String(item.model).trim() : '未填型号';
    map[modelDisplay] = (map[modelDisplay] || 0) + q;
  });
  return Object.entries(map).map(([model, quantity]) => ({ model, quantity })).sort((a, b) => a.model.localeCompare(b.model, 'zh-CN'));
});
const stockDetailModelTotalQty = computed(() => stockDetailModelEntries.value.reduce((sum, e) => sum + e.quantity, 0));

const warningGrid = computed(() => {
  const product = warningProduct.value;
  if (!product || !product.powerRangeTemplateId) return { rows: [], columns: [] };
  const t = powerRangeTemplates.value.find((x) => x.id === product.powerRangeTemplateId);
  if (!t) return { rows: [], columns: [] };
  const sMin = Math.min(t.sphereMin, t.sphereMax);
  const sMax = Math.max(t.sphereMin, t.sphereMax);
  const cMin = Math.min(t.cylinderMin, t.cylinderMax);
  const cMax = Math.max(t.cylinderMin, t.cylinderMax);
  const rows = sphereValuesArr.filter((s) => s >= sMin && s <= sMax);
  const columns = cylinderValuesArr.filter((c) => c >= cMin && c <= cMax && c !== CYLINDER_EXCLUDE);
  return { rows, columns };
});

const outboundGrid = computed(() => {
  const product = outboundProduct.value;
  if (!product || !product.powerRangeTemplateId) return { rows: [], columns: [] };
  const t = powerRangeTemplates.value.find((x) => x.id === product.powerRangeTemplateId);
  if (!t) return { rows: [], columns: [] };
  const sMin = Math.min(t.sphereMin, t.sphereMax);
  const sMax = Math.max(t.sphereMin, t.sphereMax);
  const cMin = Math.min(t.cylinderMin, t.cylinderMax);
  const cMax = Math.max(t.cylinderMin, t.cylinderMax);
  const rows = sphereValuesArr.filter((s) => s >= sMin && s <= sMax);
  const columns = cylinderValuesArr.filter((c) => c >= cMin && c <= cMax && c !== CYLINDER_EXCLUDE);
  return { rows, columns };
});

function getOutboundCellStock(s, c) {
  const product = outboundProduct.value;
  if (!product) return 0;
  const productId = String(product.id);
  const lensData = getLensData();
  let sum = 0;
  lensData.forEach((item) => {
    if (String(item.productid || item.productId) !== productId) return;
    if (Number(item.sphere) === s && Number(item.cylinder) === c) {
      sum += Math.floor(Number(item.currentStock) || 0);
    }
  });
  return sum;
}

function getOutboundQty(s, c) {
  const v = outboundCellValues.value[getWarningKey(s, c)];
  const n = v !== undefined && v !== null && v !== '' ? Number(v) : 0;
  return n > 0 ? n : null;
}

function isOutboundCellInRange(s, c) {
  const g = outboundGrid.value;
  return g.rows.includes(s) && g.columns.includes(c);
}

function isOutboundCellSelected(s, c) {
  const drag = outboundDrag.value;
  if (drag.start != null && drag.current != null) {
    const sMin = Math.min(drag.start.sphere, drag.current.sphere);
    const sMax = Math.max(drag.start.sphere, drag.current.sphere);
    const cMin = Math.min(drag.start.cylinder, drag.current.cylinder);
    const cMax = Math.max(drag.start.cylinder, drag.current.cylinder);
    if (s >= sMin && s <= sMax && c >= cMin && c <= cMax) return true;
  }
  return (outboundCellValues.value[getWarningKey(s, c)] || 0) > 0;
}

function getCellsInRectForOutbound(sMin, sMax, cMin, cMax) {
  const g = outboundGrid.value;
  const cells = [];
  g.rows.forEach((s) => {
    if (s < sMin || s > sMax) return;
    g.columns.forEach((c) => {
      if (c >= cMin && c <= cMax) cells.push({ s, c });
    });
  });
  return cells;
}

function onOutboundGridMouseDown(e) {
  const cell = getCellFromEvent(e);
  if (!cell || !isOutboundCellInRange(cell.sphere, cell.cylinder)) return;
  const stock = getOutboundCellStock(cell.sphere, cell.cylinder);
  if (stock <= 0) return;
  const mode = e.button === 0 ? 'add' : 'subtract';
  outboundDrag.value = { start: { ...cell }, current: { ...cell }, mode, button: e.button };
}

function onOutboundGridMouseMove(e) {
  const drag = outboundDrag.value;
  if (drag.start == null) return;
  const wantButton = drag.button === 0 ? 1 : 2;
  if ((e.buttons & wantButton) === 0) return;
  const cell = getCellFromEvent(e);
  if (!cell) return;
  outboundDrag.value = { ...drag, current: cell };
}

function onOutboundGridMouseUp(e) {
  const drag = outboundDrag.value;
  if (drag.start == null) return;
  if (e && e.button !== drag.button) return;
  const cells = getCellsInRectForOutbound(
    Math.min(drag.start.sphere, drag.current.sphere),
    Math.max(drag.start.sphere, drag.current.sphere),
    Math.min(drag.start.cylinder, drag.current.cylinder),
    Math.max(drag.start.cylinder, drag.current.cylinder)
  );
  const map = { ...outboundCellValues.value };
  const delta = drag.mode === 'add' ? 1 : -1;
  cells.forEach(({ s, c }) => {
    const key = getWarningKey(s, c);
    const cur = (map[key] || 0) + delta;
    const stock = getOutboundCellStock(s, c);
    map[key] = Math.max(0, Math.min(stock, cur));
  });
  outboundCellValues.value = map;
  outboundDrag.value = { start: null, current: null, mode: 'add', button: 0 };
}

function cancelOutboundGridDrag() {
  if (outboundDrag.value.start != null) {
    outboundDrag.value = { start: null, current: null, mode: 'add', button: 0 };
  }
}

function getWarningStorage() {
  const raw = localStorage.getItem(LENS_WARNING_KEY);
  return raw ? JSON.parse(raw) : {};
}

function getWarningKey(s, c) {
  return `${s},${c}`;
}

function getWarningQtyDisplay(s, c) {
  const v = warningCellValues.value[getWarningKey(s, c)];
  const n = v !== undefined && v !== null && v !== '' ? Number(v) : 0;
  return n > 0 ? n : null;
}

function getCellFromEvent(e) {
  const el = e.target?.closest?.('[data-sphere][data-cylinder]');
  if (!el) return null;
  const s = Number(el.getAttribute('data-sphere'));
  const c = Number(el.getAttribute('data-cylinder'));
  return { sphere: s, cylinder: c };
}

function isWarningCellInRange(s, c) {
  const g = warningGrid.value;
  return g.rows.includes(s) && g.columns.includes(c);
}

function isWarningCellSelected(s, c) {
  const drag = warningDrag.value;
  if (drag.start != null && drag.current != null) {
    const sMin = Math.min(drag.start.sphere, drag.current.sphere);
    const sMax = Math.max(drag.start.sphere, drag.current.sphere);
    const cMin = Math.min(drag.start.cylinder, drag.current.cylinder);
    const cMax = Math.max(drag.start.cylinder, drag.current.cylinder);
    if (s >= sMin && s <= sMax && c >= cMin && c <= cMax) return true;
  }
  return (warningCellValues.value[getWarningKey(s, c)] || 0) > 0;
}

function getCellsInRectForWarning(sMin, sMax, cMin, cMax) {
  const g = warningGrid.value;
  const cells = [];
  g.rows.forEach((s) => {
    if (s < sMin || s > sMax) return;
    g.columns.forEach((c) => {
      if (c >= cMin && c <= cMax) cells.push({ s, c });
    });
  });
  return cells;
}

function onWarningGridMouseDown(e) {
  if (e.button !== 0 && e.button !== 2) return;
  const cell = getCellFromEvent(e);
  if (!cell || !isWarningCellInRange(cell.sphere, cell.cylinder)) return;
  const mode = e.button === 0 ? 'add' : 'remove';
  warningDrag.value = { start: { ...cell }, current: { ...cell }, mode, button: e.button };
}

function onWarningGridMouseMove(e) {
  const drag = warningDrag.value;
  if (drag.start == null) return;
  const wantButton = drag.button === 0 ? 1 : 2;
  if ((e.buttons & wantButton) === 0) return;
  const cell = getCellFromEvent(e);
  if (!cell) return;
  warningDrag.value = { ...drag, current: cell };
}

function cancelWarningGridDrag() {
  warningDrag.value = { start: null, current: null, mode: 'add', button: 0 };
}

function onWarningGridMouseUp(e) {
  const drag = warningDrag.value;
  if (drag.start == null) return;
  if (e && e.button !== drag.button) return;
  const { start, current, mode } = drag;
  const sMin = Math.min(start.sphere, current.sphere);
  const sMax = Math.max(start.sphere, current.sphere);
  const cMin = Math.min(start.cylinder, current.cylinder);
  const cMax = Math.max(start.cylinder, current.cylinder);
  const cells = getCellsInRectForWarning(sMin, sMax, cMin, cMax);
  const map = { ...warningCellValues.value };
  cells.forEach(({ s, c }) => {
    const key = getWarningKey(s, c);
    if (mode === 'add') {
      map[key] = (map[key] || 0) + 1;
    } else {
      const q = (map[key] || 0) - 1;
      if (q <= 0) delete map[key];
      else map[key] = q;
    }
  });
  warningCellValues.value = map;
  warningDrag.value = { start: null, current: null, mode: 'add', button: 0 };
}

function openWarningModal(product) {
  warningProduct.value = product;
  const storage = getWarningStorage();
  const productId = String(product.id);
  const saved = storage[productId] || {};
  if (product.powerRangeTemplateId == null || product.powerRangeTemplateId === '') {
    noPowerWarningQty.value = saved[NO_POWER_WARNING_KEY] != null ? Number(saved[NO_POWER_WARNING_KEY]) : undefined;
    warningCellValues.value = {};
  } else {
    noPowerWarningQty.value = undefined;
    const { [NO_POWER_WARNING_KEY]: _, ...rest } = saved;
    warningCellValues.value = { ...rest };
  }
  warningModalVisible.value = true;
}

function closeWarningModal() {
  warningModalVisible.value = false;
  warningProduct.value = null;
  warningCellValues.value = {};
  noPowerWarningQty.value = undefined;
  warningDrag.value = { start: null, current: null, mode: 'add', button: 0 };
}

function stepNoPowerWarningQty(delta) {
  const v = noPowerWarningQty.value;
  const n = (v != null && !Number.isNaN(Number(v)) ? Number(v) : 0) + delta;
  noPowerWarningQty.value = Math.max(0, n);
}

function stepNoPowerViewPurchaseQty(delta) {
  const v = noPowerViewPurchaseQty.value;
  const n = (v != null && !Number.isNaN(Number(v)) ? Number(v) : 0) + delta;
  noPowerViewPurchaseQty.value = Math.max(0, n);
}

function saveWarningModal() {
  if (!warningProduct.value) return;
  const product = warningProduct.value;
  const storage = getWarningStorage();
  const productId = String(product.id);
  if (product.powerRangeTemplateId == null || product.powerRangeTemplateId === '') {
    const n = noPowerWarningQty.value != null ? Number(noPowerWarningQty.value) : NaN;
    if (Number.isNaN(n) || n < 0) {
      message.warning('请输入有效的预警数量（≥0）');
      return;
    }
    storage[productId] = { [NO_POWER_WARNING_KEY]: Math.floor(n) };
  } else {
    const toSave = {};
    Object.entries(warningCellValues.value).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && Number(v) >= 0) toSave[k] = Number(v);
    });
    storage[productId] = toSave;
  }
  localStorage.setItem(LENS_WARNING_KEY, JSON.stringify(storage));
  closeWarningModal();
  message.success('预警数量已保存');
}

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
  } catch (e) {}
  return false;
}

const stockListCategoryFilterOptions = computed(() => {
  const options = [{ label: '全部类型', value: null }];
  categoryList.value.forEach((c) => options.push({ label: c.name, value: c.id }));
  return options;
});

const filteredStockList = computed(() => {
  let list = productList.value.filter((p) => p.inventoryManageType === 'stock' && !p.zeroPurchase);
  const catId = stockListCategoryFilter.value;
  if (catId != null && String(catId) !== '') {
    list = list.filter((p) => String(p.categoryId != null ? p.categoryId : p.category) === String(catId));
  }
  return list.filter((p) => matchProductSearch(p, stockSearchKeyword.value));
});

const filteredCustomList = computed(() => {
  let list = productList.value.filter((p) => p.inventoryManageType !== 'stock' && !p.zeroPurchase);
  const catId = customListCategoryFilter.value;
  if (catId != null && String(catId) !== '') {
    list = list.filter((p) => String(p.categoryId != null ? p.categoryId : p.category) === String(catId));
  }
  return list.filter((p) => matchProductSearch(p, customSearchKeyword.value));
});

// 库存预警列表：有光度按格子统计触发数；无光度为数量预警，当前库存≤预警数量即显示（排除零采购商品）
const warningListData = computed(() => {
  const products = productList.value.filter((p) => !p.zeroPurchase);
  const lensData = getLensData();
  const warningStorage = getWarningStorage();
  const list = [];
  products.forEach((product) => {
    const productId = String(product.id);
    const saved = warningStorage[productId] || {};
    if (product.powerRangeTemplateId == null || product.powerRangeTemplateId === '') {
      const q = saved[NO_POWER_WARNING_KEY];
      const warningQty = q != null ? Number(q) : 0;
      if (Number.isNaN(warningQty) || warningQty <= 0) return;
      const currentStock = displayStockQuantity(product);
      if (currentStock <= warningQty) list.push({ ...product, warningCount: 1 });
      return;
    }
    const t = powerRangeTemplates.value.find((x) => x.id === product.powerRangeTemplateId);
    if (!t) return;
    if (Object.keys(saved).filter((k) => k !== NO_POWER_WARNING_KEY).length === 0) return;
    let warningCount = 0;
    Object.entries(saved).forEach(([key, warningQty]) => {
      if (key === NO_POWER_WARNING_KEY) return;
      const q = Number(warningQty);
      if (Number.isNaN(q) || q <= 0) return;
      const [s, c] = key.split(',').map(Number);
      const item = lensData.find(
        (x) =>
          String(x.productid || x.productId) === productId &&
          Number(x.sphere) === s &&
          Number(x.cylinder) === c
      );
      const currentStock = item ? Math.floor(Number(item.currentStock) || 0) : 0;
      if (currentStock <= q) warningCount += 1;
    });
    if (warningCount > 0) list.push({ ...product, warningCount });
  });
  return list;
});

const filteredWarningList = computed(() => {
  let list = warningListData.value;
  const catId = warningListCategoryFilter.value;
  if (catId != null && String(catId) !== '') {
    list = list.filter((p) => String(p.categoryId != null ? p.categoryId : p.category) === String(catId));
  }
  return list.filter((p) => matchProductSearch(p, warningListSearchKeyword.value));
});

const viewWarningGrid = computed(() => {
  const product = viewWarningProduct.value;
  if (!product || !product.powerRangeTemplateId) return { rows: [], columns: [] };
  const t = powerRangeTemplates.value.find((x) => x.id === product.powerRangeTemplateId);
  if (!t) return { rows: [], columns: [] };
  const sMin = Math.min(t.sphereMin, t.sphereMax);
  const sMax = Math.max(t.sphereMin, t.sphereMax);
  const cMin = Math.min(t.cylinderMin, t.cylinderMax);
  const cMax = Math.max(t.cylinderMin, t.cylinderMax);
  const rows = sphereValuesArr.filter((s) => s >= sMin && s <= sMax);
  const columns = cylinderValuesArr.filter((c) => c >= cMin && c <= cMax && c !== CYLINDER_EXCLUDE);
  return { rows, columns };
});

function getViewWarningNoPowerQty() {
  const product = viewWarningProduct.value;
  if (!product || (product.powerRangeTemplateId != null && product.powerRangeTemplateId !== '')) return null;
  const storage = getWarningStorage();
  const v = storage[String(product.id)]?.[NO_POWER_WARNING_KEY];
  const n = v != null ? Number(v) : 0;
  return n > 0 ? n : null;
}

function getViewWarningQty(s, c) {
  const product = viewWarningProduct.value;
  if (!product) return null;
  const storage = getWarningStorage();
  const saved = storage[String(product.id)] || {};
  const v = saved[getWarningKey(s, c)];
  const n = v !== undefined && v !== null && v !== '' ? Number(v) : 0;
  return n > 0 ? n : null;
}

function getViewWarningStock(s, c) {
  const product = viewWarningProduct.value;
  if (!product) return 0;
  const lensData = getLensData();
  const productId = String(product.id);
  const items = lensData.filter(
    (x) =>
      String(x.productid || x.productId) === productId &&
      Number(x.sphere) === s &&
      Number(x.cylinder) === c
  );
  return items.reduce((sum, x) => sum + Math.floor(Number(x.currentStock) || 0), 0);
}

function getViewWarningCellText(s, c) {
  const warningQty = getViewWarningQty(s, c);
  if (warningQty == null) return '';
  const stock = getViewWarningStock(s, c);
  return `${stock}/${warningQty}`;
}

function isViewWarningAlert(s, c) {
  const warningQty = getViewWarningQty(s, c);
  if (warningQty == null) return false;
  const stock = getViewWarningStock(s, c);
  return stock < warningQty;
}

function getViewWarningPurchaseQty(s, c) {
  const v = viewWarningPurchaseQty.value[getWarningKey(s, c)];
  return v !== undefined && v !== null ? Number(v) : 0;
}

function isViewWarningCellInRange(s, c) {
  return !!getViewWarningQty(s, c);
}

function isViewWarningCellInDragRect(s, c) {
  const drag = viewWarningDrag.value;
  if (drag.start == null || drag.current == null) return false;
  const sMin = Math.min(drag.start.sphere, drag.current.sphere);
  const sMax = Math.max(drag.start.sphere, drag.current.sphere);
  const cMin = Math.min(drag.start.cylinder, drag.current.cylinder);
  const cMax = Math.max(drag.start.cylinder, drag.current.cylinder);
  return s >= sMin && s <= sMax && c >= cMin && c <= cMax;
}

function isViewWarningCellSelected(s, c) {
  if (isViewWarningCellInDragRect(s, c)) return true;
  return getViewWarningPurchaseQty(s, c) > 0;
}

function getCellsInRectForViewWarning(sMin, sMax, cMin, cMax) {
  const g = viewWarningGrid.value;
  const cells = [];
  g.rows.forEach((s) => {
    if (s < sMin || s > sMax) return;
    g.columns.forEach((c) => {
      if (c >= cMin && c <= cMax && getViewWarningQty(s, c)) cells.push({ s, c });
    });
  });
  return cells;
}

function onViewWarningGridMouseDown(e) {
  if (e.button !== 0 && e.button !== 2) return;
  const cell = getCellFromEvent(e);
  if (!cell || !isViewWarningCellInRange(cell.sphere, cell.cylinder)) return;
  const mode = e.button === 0 ? 'add' : 'remove';
  viewWarningDrag.value = { start: { ...cell }, current: { ...cell }, mode, button: e.button, axisLock: null };
}

function onViewWarningGridMouseMove(e) {
  const drag = viewWarningDrag.value;
  if (drag.start == null) return;
  const wantButton = drag.button === 0 ? 1 : 2;
  if ((e.buttons & wantButton) === 0) return;
  const cell = getCellFromEvent(e);
  if (!cell) return;
  const g = viewWarningGrid.value;
  const inGrid = g.rows.includes(cell.sphere) && g.columns.includes(cell.cylinder);
  if (!inGrid) return;
  const start = drag.start;
  const cur = drag.current;
  let axisLock = drag.axisLock;
  let current;
  if (axisLock === 'column') {
    current = { sphere: cell.sphere, cylinder: start.cylinder };
  } else if (axisLock === 'row') {
    current = { sphere: start.sphere, cylinder: cell.cylinder };
  } else {
    const same = (a, b) => Math.abs((a || 0) - (b || 0)) < 1e-6;
    const isFirstMove = same(cur.sphere, start.sphere) && same(cur.cylinder, start.cylinder);
    const distS = Math.abs(cell.sphere - start.sphere);
    const distC = Math.abs(cell.cylinder - start.cylinder);
    const movedToNewCell = distS > 1e-6 || distC > 1e-6;
    if (isFirstMove && movedToNewCell) {
      if (distC < 1e-6) axisLock = 'column';
      else if (distS < 1e-6) axisLock = 'row';
      else axisLock = distS >= distC ? 'column' : 'row';
    }
    if (axisLock === 'column') current = { sphere: cell.sphere, cylinder: start.cylinder };
    else if (axisLock === 'row') current = { sphere: start.sphere, cylinder: cell.cylinder };
    else current = { ...cell };
  }
  if (cur && cur.sphere === current.sphere && cur.cylinder === current.cylinder && axisLock === drag.axisLock) return;
  viewWarningDrag.value = { ...drag, current, axisLock };
}

function cancelViewWarningGridDrag() {
  viewWarningDrag.value = { start: null, current: null, mode: 'add', button: 0, axisLock: null };
}

function onViewWarningGridMouseUp(e) {
  const drag = viewWarningDrag.value;
  if (drag.start == null) return;
  if (e && e.button !== drag.button) return;
  const { start, current, mode } = drag;
  const sMin = Math.min(start.sphere, current.sphere);
  const sMax = Math.max(start.sphere, current.sphere);
  const cMin = Math.min(start.cylinder, current.cylinder);
  const cMax = Math.max(start.cylinder, current.cylinder);
  const cells = getCellsInRectForViewWarning(sMin, sMax, cMin, cMax);
  const map = { ...viewWarningPurchaseQty.value };
  cells.forEach(({ s, c }) => {
    const key = getWarningKey(s, c);
    if (mode === 'add') {
      map[key] = (map[key] || 0) + 1;
    } else {
      const q = (map[key] || 0) - 1;
      if (q <= 0) delete map[key];
      else map[key] = q;
    }
  });
  viewWarningPurchaseQty.value = map;
  viewWarningDrag.value = { start: null, current: null, mode: 'add', button: 0, axisLock: null };
}

function closeViewWarningModal() {
  viewWarningModalVisible.value = false;
  viewWarningProduct.value = null;
  viewWarningPurchaseQty.value = {};
  noPowerViewPurchaseQty.value = 0;
  viewWarningDrag.value = { start: null, current: null, mode: 'add', button: 0, axisLock: null };
}

function generatePurchaseOrderNumber() {
  const raw = localStorage.getItem(PURCHASE_PLAN_ENTRIES_KEY);
  const entries = raw ? JSON.parse(raw) : [];
  const d = new Date();
  const prefix = `CG${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const todayNumbers = entries
    .filter((e) => e.orderNumber && String(e.orderNumber).startsWith(prefix))
    .map((e) => parseInt(String(e.orderNumber).slice(-2), 10))
    .filter((n) => !Number.isNaN(n));
  const maxSeq = todayNumbers.length ? Math.max(...todayNumbers) : 0;
  return `${prefix}${String(maxSeq + 1).padStart(2, '0')}`;
}

function confirmViewWarningPurchase() {
  const product = viewWarningProduct.value;
  if (!product) return;
  const noPowerQty = getViewWarningNoPowerQty();
  let toAdd;
  if (noPowerQty != null) {
    const qty = noPowerViewPurchaseQty.value != null ? Number(noPowerViewPurchaseQty.value) : 0;
    if (Number.isNaN(qty) || qty <= 0) {
      message.warning('请输入建议采购数量（大于0）');
      return;
    }
    toAdd = [{ quantity: Math.floor(qty), powerRangeDesc: '无光度' }];
  } else {
    toAdd = Object.entries(viewWarningPurchaseQty.value)
      .filter(([, q]) => (q || 0) > 0)
      .map(([key, qty]) => {
        const [s, c] = key.split(',').map(Number);
        return { s, c, quantity: Number(qty), powerRangeDesc: `球镜 ${formatSphereValue(s)}D，柱镜 ${formatPowerValue(c)}D` };
      });
    if (toAdd.length === 0) {
      message.warning('请至少左键点击格子增加采购数量');
      return;
    }
  }
  const raw = localStorage.getItem(PURCHASE_PLAN_ENTRIES_KEY);
  const list = raw ? JSON.parse(raw) : [];
  let nextId = list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
  const orderNumber = generatePurchaseOrderNumber();
  toAdd.forEach((entry) => {
    list.push({
      id: nextId++,
      orderNumber,
      productId: product.id,
      productName: product.name,
      quantity: entry.quantity,
      powerRangeDesc: entry.powerRangeDesc
    });
  });
  localStorage.setItem(PURCHASE_PLAN_ENTRIES_KEY, JSON.stringify(list));
  closeViewWarningModal();
  message.success('已加入采购计划单');
  if (typeof window.openTab === 'function') {
    window.openTab('purchase');
  }
}

function openViewWarningModal(record) {
  viewWarningProduct.value = record;
  viewWarningPurchaseQty.value = {};
  viewWarningDrag.value = { start: null, current: null, mode: 'add', button: 0, axisLock: null };
  const noPowerQty = record && (record.powerRangeTemplateId == null || record.powerRangeTemplateId === '')
    ? (getWarningStorage()[String(record.id)]?.[NO_POWER_WARNING_KEY] != null ? Number(getWarningStorage()[String(record.id)][NO_POWER_WARNING_KEY]) : 0)
    : 0;
  const current = record ? displayStockQuantity(record) : 0;
  noPowerViewPurchaseQty.value = noPowerQty > 0 ? Math.max(0, noPowerQty - current) : 0;
  viewWarningModalVisible.value = true;
}

function openStockDetail(product) {
  stockDetailProduct.value = product;
  stockDetailModalVisible.value = true;
}

function openOutboundModal(record) {
  outboundProduct.value = record;
  outboundCellValues.value = {};
  outboundNoPowerQty.value = undefined;
  outboundDrag.value = { start: null, current: null, mode: 'add', button: 0 };
  outboundFullSelectMode.value = false;
  outboundModalVisible.value = true;
}

function selectAllOutbound() {
  const product = outboundProduct.value;
  if (!product || !product.powerRangeTemplateId) return;
  const grid = outboundGrid.value;
  const map = {};
  grid.rows.forEach((s) => {
    grid.columns.forEach((c) => {
      const stock = getOutboundCellStock(s, c);
      if (stock > 0) {
        map[getWarningKey(s, c)] = stock;
      }
    });
  });
  outboundCellValues.value = map;
  outboundFullSelectMode.value = true;
}

function clearOutboundSelection() {
  outboundCellValues.value = {};
  outboundFullSelectMode.value = false;
}

function stepOutboundNoPowerQty(delta) {
  const product = outboundProduct.value;
  if (!product) return;
  const maxQty = displayStockQuantity(product);
  const current = outboundNoPowerQty.value != null ? Math.floor(Number(outboundNoPowerQty.value) || 0) : 0;
  const next = Math.max(1, Math.min(maxQty, current + delta));
  outboundNoPowerQty.value = next;
}

function closeOutboundModal() {
  outboundModalVisible.value = false;
  outboundProduct.value = null;
  outboundCellValues.value = {};
  outboundNoPowerQty.value = undefined;
  outboundDrag.value = { start: null, current: null, mode: 'add', button: 0 };
  outboundFullSelectMode.value = false;
}

function confirmOutbound() {
  const product = outboundProduct.value;
  if (!product) return;
  const productId = String(product.id);
  const productListRaw = getProductListRaw();
  const productInfo = productListRaw.find((p) => String(p.id) === productId);
  const retailPrice = productInfo && productInfo.retailPrice != null && productInfo.retailPrice !== '' ? Number(productInfo.retailPrice) : 0;
  const purchasePrice = productInfo && productInfo.purchasePrice != null && productInfo.purchasePrice !== '' ? Number(productInfo.purchasePrice) : 0;

  if (product.powerRangeTemplateId != null && product.powerRangeTemplateId !== '') {
    const toOut = Object.entries(outboundCellValues.value)
      .filter(([, q]) => (q || 0) > 0)
      .map(([key, qty]) => {
        const [s, c] = key.split(',').map(Number);
        return { s, c, quantity: Number(qty), powerRangeDesc: `球镜 ${formatSphereValue(s)}D，柱镜 ${formatPowerValue(c)}D` };
      });
    if (toOut.length === 0) {
      message.warning('请先在表格中选择要出库的光度数量（左键+1、右键-1）');
      return;
    }
    const totalQty = toOut.reduce((sum, x) => sum + x.quantity, 0);
    const amount = totalQty * purchasePrice;
    const unit = getProductUnit(product);

    Modal.confirm({
      title: '确认出库',
      content: h('div', [
        h('p', `本次出库数量：${totalQty} ${unit}`),
        h('p', `采购单价：${purchasePrice || 0}`),
        h('p', `采购金额：${amount}`)
      ]),
      okText: '确认出库',
      cancelText: '取消',
      onOk() {
        const lensData = getLensData().slice();
        for (const { s, c, quantity } of toOut) {
          let remain = quantity;
          for (const item of lensData) {
            if (String(item.productid || item.productId) !== productId) continue;
            if (Number(item.sphere) !== s || Number(item.cylinder) !== c) continue;
            const cur = Math.floor(Number(item.currentStock) || 0);
            if (cur <= 0) continue;
            const deduct = Math.min(remain, cur);
            item.currentStock = cur - deduct;
            remain -= deduct;
            if (remain <= 0) break;
          }
          if (remain > 0) {
            message.warning(`光度 球镜${formatSphereValue(s)}D 柱镜${formatPowerValue(c)}D 出库数量超过在库数量`);
            return;
          }
        }
        localStorage.setItem(LENS_DATA_KEY, JSON.stringify(lensData));
        appendInOutLog('out', {
          productName: product.name,
          retailPrice,
          purchasePrice,
          quantity: totalQty,
          amount,
          detailEntries: toOut.map((e) => ({ powerRangeDesc: e.powerRangeDesc, quantity: e.quantity }))
        });
        loadProductList();
        loadInOutLogList();
        closeOutboundModal();
        message.success('出库成功，库存已更新');
      }
    });
  } else {
    const qty = outboundNoPowerQty.value != null ? Math.floor(Number(outboundNoPowerQty.value) || 0) : 0;
    if (qty <= 0) {
      message.warning('请输入出库数量（大于0）');
      return;
    }
    const totalStock = displayStockQuantity(product);
    if (qty > totalStock) {
      const unit = getProductUnit(product);
      message.warning(`出库数量不能大于在库数量（当前 ${totalStock} ${unit}）`);
      return;
    }
    const amount = qty * purchasePrice;
    const unit = getProductUnit(product);
    Modal.confirm({
      title: '确认出库',
      content: h('div', [
        h('p', `本次出库数量：${qty} ${unit}`),
        h('p', `采购单价：${purchasePrice || 0}`),
        h('p', `采购金额：${amount}`)
      ]),
      okText: '确认出库',
      cancelText: '取消',
      onOk() {
        const lensData = getLensData().slice();
        let remain = qty;
        for (const item of lensData) {
          if (String(item.productid || item.productId) !== productId) continue;
          const cur = Math.floor(Number(item.currentStock) || 0);
          if (cur <= 0) continue;
          const deduct = Math.min(remain, cur);
          item.currentStock = cur - deduct;
          remain -= deduct;
          if (remain <= 0) break;
        }
        if (remain > 0) {
          message.warning('在库数量不足');
          return;
        }
        localStorage.setItem(LENS_DATA_KEY, JSON.stringify(lensData));
        appendInOutLog('out', {
          productName: product.name,
          retailPrice,
          purchasePrice,
          quantity: qty,
          amount,
          detailEntries: [{ powerRangeDesc: '无光度', quantity: qty }]
        });
        loadProductList();
        loadInOutLogList();
        closeOutboundModal();
        message.success('出库成功，库存已更新');
      }
    });
  }
}

function clearStockForProduct(record) {
  const productId = String(record.id);
  const lensData = getLensData().filter((item) => String(item.productid || item.productId) !== productId);
  localStorage.setItem(LENS_DATA_KEY, JSON.stringify(lensData));
  loadProductList();
  message.success('已清空该商品库存');
}

const INVENTORY_TYPE_CHANGED_EVENT = 'product-inventory-manage-type-changed';

function refreshData() {
  loadProductList();
  loadCategoryList();
  loadPowerRangeTemplates();
  loadInOutLogList();
}

function onInventoryTypeChanged() {
  refreshData();
}

onMounted(() => {
  refreshData();
  window.addEventListener(INVENTORY_TYPE_CHANGED_EVENT, onInventoryTypeChanged);
});

onBeforeUnmount(() => {
  window.removeEventListener(INVENTORY_TYPE_CHANGED_EVENT, onInventoryTypeChanged);
});

onActivated(() => {
  refreshData();
});
</script>

<style scoped>
.inventory-page {
  padding: 16px;
}
.stock-list-wrap {
  padding: 8px 0;
}
.stock-list-toolbar {
  margin-bottom: 12px;
}
.stock-list-table {
  margin-top: 0;
}
.placeholder-content {
  padding: 24px;
  text-align: center;
  color: #999;
}
.quantity-desc {
  margin: 0;
  font-size: 14px;
}
.no-power-warning-wrap .quantity-desc {
  margin-bottom: 8px;
}
.no-power-warning-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.number-with-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}
.number-with-controls .ant-input-number {
  margin: 0;
}
.number-with-controls .ant-input-number-input {
  text-align: center;
}
.stock-detail-content {
  max-height: 70vh;
  overflow: auto;
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
  min-width: 48px;
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
  min-width: 80px;
}
.plan-detail-th {
  background: #fafafa;
  font-weight: 600;
}
.plan-detail-td-label {
  background: #fafafa;
  font-weight: 500;
}
.plan-detail-model-table thead tr:last-child th {
  background: #fafafa;
  font-weight: 600;
}
.plan-detail-empty {
  color: #999;
  text-align: center;
  padding: 24px;
}
.log-action-delete {
  color: #ff4d4f;
}
.warning-tip-inline {
  margin-bottom: 12px;
  font-size: 13px;
  color: #666;
}
.warning-tip-inline .warning-tip-label {
  color: #ff4d4f;
  font-weight: 500;
}
.view-warning-cell-alert {
  color: #ff4d4f;
  font-weight: 600;
}
.warning-modal-body .power-range-tip {
  margin-bottom: 12px;
  font-size: 13px;
  color: #666;
}
.warning-modal-body .power-range-grid-wrap {
  overflow: auto;
  max-height: 70vh;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}
.warning-modal-body .power-range-table {
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
  min-width: 800px;
}
.warning-modal-body .power-range-corner {
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
.warning-modal-body .power-range-th {
  position: sticky;
  top: 0;
  z-index: 2;
  min-width: 44px;
  padding: 4px 4px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  font-weight: 600;
}
.warning-modal-body .power-range-td-label {
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
.warning-modal-body .power-range-td {
  min-width: 44px;
  height: 22px;
  padding: 0 4px;
  border: 1px solid #e8e8e8;
  cursor: default;
  user-select: none;
}
.warning-modal-body .power-range-td.selected {
  background: #bae7ff;
}
.warning-modal-body .power-range-cell-qty {
  display: block;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
}
.outbound-modal-footer-left {
  margin-top: 12px;
  text-align: left;
}

/* 预警查看弹窗：库存采购数量绿色、表格样式与预警设置弹窗一致 */
.view-purchase-qty {
  color: #52c41a;
  font-weight: 600;
}
.view-warning-modal-body .power-range-grid-wrap {
  overflow: auto;
  max-height: 70vh;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  user-select: none;
}
.view-warning-modal-body .power-range-grid-wrap .power-range-td::selection,
.view-warning-modal-body .power-range-grid-wrap .power-range-td *::selection {
  background: transparent;
  color: inherit;
}
.view-warning-modal-body .power-range-table {
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
  min-width: 800px;
}
.view-warning-modal-body .power-range-corner,
.view-warning-modal-body .power-range-th,
.view-warning-modal-body .power-range-td-label,
.view-warning-modal-body .power-range-td {
  border: 1px solid #e8e8e8;
  padding: 4px 6px;
  text-align: center;
}
.view-warning-modal-body .power-range-td.selected {
  background: #bae7ff;
}
.view-warning-modal-body .power-range-td.selected.disabled {
  background: #e6f7ff;
  color: #666;
}
.view-warning-modal-body .power-range-td.disabled {
  background: #f5f5f5;
  color: #bbb;
}
.view-warning-modal-body .view-stock-alert {
  color: #ff4d4f;
  font-weight: 600;
}
</style>
