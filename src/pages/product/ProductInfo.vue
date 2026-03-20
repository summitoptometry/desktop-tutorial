<template>
  <div class="product-info-page">
    <a-card :bordered="false">
      <a-tabs v-model:activeKey="activeTab" type="line" class="product-tabs">
        <a-tab-pane key="new" tab="新建商品">
          <div class="tab-content category-tab">
            <a-tabs v-model:activeKey="categorySubTab" type="line" class="sub-tabs">
              <a-tab-pane key="product-list" tab="商品列表">
                <div class="category-toolbar">
                  <a-select
                    v-model:value="productListCategoryFilter"
                    placeholder="全部类型"
                    allow-clear
                    style="width: 160px; margin-right: 8px"
                    :options="productListCategoryOptions"
                  />
                  <a-input
                    v-model:value="productSearchKeyword"
                    placeholder="商品名称（支持拼音首字母检索）"
                    allow-clear
                    style="width: 280px; margin-right: 8px"
                    @input="onProductSearchInput"
                  />
                </div>
                <a-table
                  :columns="productListColumns"
                  :data-source="filteredProductList"
                  :pagination="false"
                  row-key="id"
                  size="small"
                  class="category-table product-list-table"
                >
                  <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'index'">
                      {{ index + 1 }}
                    </template>
                    <template v-else-if="column.key === 'category'">
                      {{ getProductCategoryName(record) }}
                    </template>
                    <template v-else-if="column.key === 'attrNames'">
                      {{ getProductAttrNames(record) || '-' }}
                    </template>
                    <template v-else-if="column.key === 'retailPrice'">
                      {{ formatRetailPrice(record.retailPrice) }}
                    </template>
                    <template v-else-if="column.key === 'powerRangeDesc'">
                      {{ getProductPowerRangeDescription(record) }}
                    </template>
                    <template v-else-if="column.key === 'inventoryManage'">
                      <a-button type="link" size="small" @click="toggleInventoryManage(record)">
                        {{ getInventoryManageLabel(record) }}
                      </a-button>
                    </template>
                    <template v-else-if="column.key === 'action'">
                      <a-space>
                        <a-button type="link" size="small" @click="openProductEdit(record)">编辑</a-button>
                        <a-popconfirm
                          title="确定删除该商品吗？"
                          ok-text="确定"
                          cancel-text="取消"
                          @confirm="deleteProduct(record)"
                        >
                          <a-button type="link" danger size="small">删除</a-button>
                        </a-popconfirm>
                      </a-space>
                    </template>
                  </template>
                </a-table>
                <a-modal
                  v-model:visible="productEditVisible"
                  :title="productEditingId ? '编辑商品' : '新增商品'"
                  ok-text="保存"
                  cancel-text="取消"
                  @ok="submitProductEdit"
                >
                  <a-form layout="vertical" :model="productForm" ref="productFormRef">
                    <a-form-item label="商品名称" required>
                      <a-input v-model:value="productForm.name" placeholder="请输入商品名称" />
                    </a-form-item>
                    <a-form-item label="类别" required>
                      <a-select
                        v-model:value="productForm.categoryId"
                        placeholder="请选择类别"
                        :options="categorySelectOptions"
                        :field-names="{ label: 'label', value: 'value' }"
                        style="width: 100%"
                      />
                    </a-form-item>
                    <a-form-item class="product-edit-inline-row">
                      <div class="product-edit-inline">
                        <span class="product-edit-inline-label">零售价格：</span>
                        <a-input-number
                          v-model:value="productForm.retailPrice"
                          placeholder="零售价格"
                          :min="0"
                          :precision="1"
                          :controls="false"
                          class="product-edit-inline-input"
                        />
                      </div>
                    </a-form-item>
                    <template v-for="paramName in configuredParamNamesForProductEdit" :key="paramName">
                      <a-form-item class="product-edit-inline-row">
                        <div class="product-edit-inline">
                          <span class="product-edit-inline-label">{{ paramName }}：</span>
                          <a-select
                            :value="(productForm.parameterValues && productForm.parameterValues[paramName]) || []"
                            mode="tags"
                            :placeholder="`请选择或输入${paramName}`"
                            :options="getParamValueOptionsForProductEdit(paramName)"
                            allow-clear
                            :max-tag-count="1"
                            class="product-edit-inline-input"
                            @update:value="(v) => { if (!productForm.parameterValues) productForm.parameterValues = {}; productForm.parameterValues[paramName] = v; }"
                          />
                        </div>
                      </a-form-item>
                    </template>
                    <a-form-item>
                      <a-checkbox v-model:checked="productForm.retailPriceHalf">零售价格/2（新建销售时该商品显示的零售价格为商品列表零售价格的一半）</a-checkbox>
                    </a-form-item>
                    <a-form-item>
                      <a-checkbox v-model:checked="productForm.requireEyeSide">区分眼别（选中后该商品在新建销售中添加商品后需要选择眼别区分眼别）</a-checkbox>
                    </a-form-item>
                    <a-form-item>
                      <a-checkbox v-model:checked="productForm.warrantyOneYear">1年售后（选中后该商品销售后会在售后列表中显示）</a-checkbox>
                    </a-form-item>
                    <a-form-item>
                      <a-checkbox v-model:checked="productForm.modelEnabled">型号管理（采购与入库时需填写型号）</a-checkbox>
                    </a-form-item>
                    <a-form-item>
                      <a-checkbox v-model:checked="productForm.zeroPurchase">零采购（不需要采购与库存管理，直接销售，如验光、视觉训练等）</a-checkbox>
                    </a-form-item>
                    <a-form-item>
                      <a-checkbox v-model:checked="productForm.expiryManageEnabled">效期管理（入库时需填写生产编号、生产日期）</a-checkbox>
                    </a-form-item>
                    <a-form-item v-if="productForm.expiryManageEnabled" class="expiry-months-row">
                      <div class="expiry-months-inline">
                        <span class="expiry-months-label">有效期（月）：</span>
                        <a-input-number
                          v-model:value="productForm.expiryMonths"
                          placeholder="月数"
                          :min="1"
                          :controls="false"
                          class="expiry-months-input"
                        />
                      </div>
                    </a-form-item>
                  </a-form>
                </a-modal>
              </a-tab-pane>
              <a-tab-pane key="category-list" tab="类别列表">
                <div class="category-toolbar">
                  <a-input
                    v-model:value="categoryNameInput"
                    placeholder="请输入类别名称"
                    allow-clear
                    style="width: 240px; margin-right: 8px"
                    @press-enter="addCategory"
                  />
                  <a-button type="primary" @click="addCategory">添加</a-button>
                </div>
                <a-table
                  :columns="categoryColumns"
                  :data-source="categoryList"
                  :pagination="false"
                  row-key="id"
                  size="small"
                  class="category-table"
                >
                  <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'index'">
                      {{ index + 1 }}
                    </template>
                    <template v-else-if="column.key === 'unit'">
                      <a-input
                        v-model:value="record.unit"
                        placeholder="单位"
                        allow-clear
                        size="small"
                        style="width: 100%"
                        @blur="saveCategoryUnit"
                      />
                    </template>
                    <template v-else-if="column.key === 'attrConfig'">
                      <a-button type="link" size="small" @click="openAttrConfig(record)">
                        {{ getCategoryAttrConfigText(record) }}
                      </a-button>
                    </template>
                    <template v-else-if="column.key === 'newProduct'">
                      <a-button type="link" size="small" @click="openNewProductModal(record)">新建商品</a-button>
                    </template>
                    <template v-else-if="column.key === 'action'">
                      <a-space>
                        <a-button type="link" size="small" @click="openCategoryEdit(record)">编辑</a-button>
                        <a-popconfirm
                          title="确定删除该类别吗？"
                          ok-text="确定"
                          cancel-text="取消"
                          @confirm="deleteCategory(record)"
                        >
                          <a-button type="link" danger size="small">删除</a-button>
                        </a-popconfirm>
                      </a-space>
                    </template>
                  </template>
                </a-table>
                <!-- 编辑类别弹窗 -->
                <a-modal
                  v-model:visible="categoryEditVisible"
                  title="编辑类别"
                  ok-text="保存"
                  cancel-text="取消"
                  @ok="submitCategoryEdit"
                >
                  <a-form layout="vertical">
                    <a-form-item label="类别名称">
                      <a-input v-model:value="categoryEditName" placeholder="请输入类别名称" />
                    </a-form-item>
                  </a-form>
                </a-modal>
                <!-- 参数配置弹窗 -->
                <a-modal
                  v-model:visible="attrConfigVisible"
                  title="参数配置"
                  ok-text="保存"
                  cancel-text="取消"
                  @ok="submitAttrConfig"
                >
                  <div v-if="attrConfigCategory" class="attr-config-modal">
                    <p class="attr-config-category-name">类别：{{ attrConfigCategory.name }}</p>
                    <div class="attr-config-label">勾选该类别下的参数：</div>
                    <div class="attr-config-item">
                      <a-checkbox v-model:checked="attrConfigPowerRangeEnabled">光度范围</a-checkbox>
                    </div>
                    <a-checkbox-group v-model:value="attrConfigSelectedIds" class="attr-config-list">
                      <div
                        v-for="(attr, index) in attrList"
                        :key="attr.id"
                        class="attr-config-item"
                      >
                        <a-checkbox :value="attr.id">{{ index + 1 }}. {{ attr.name }}</a-checkbox>
                      </div>
                    </a-checkbox-group>
                    <p v-if="!attrList.length" class="attr-config-empty">暂无参数，请先在「商品参数管理」中添加。</p>
                    <div v-if="attrConfigCategory && attrConfigCategory.parameterNameHistory && attrConfigCategory.parameterNameHistory.length > 0" class="attr-config-history">
                      <div class="attr-config-label">已确认参数名称（本类别可勾选）：</div>
                      <a-checkbox-group v-model:value="attrConfigSelectedParamNames" class="attr-config-list">
                        <div v-for="(pname, idx) in (attrConfigCategory.parameterNameHistory || [])" :key="idx" class="attr-config-item">
                          <a-checkbox :value="pname">{{ pname }}</a-checkbox>
                        </div>
                      </a-checkbox-group>
                    </div>
                  </div>
                </a-modal>
                <!-- 新建商品弹窗 -->
                <a-modal
                  v-model:visible="newProductModalVisible"
                  :title="newProductCategory ? `新建商品 - ${newProductCategory.name}` : '新建商品'"
                  width="640px"
                  ok-text="确定"
                  cancel-text="取消"
                  @ok="submitNewProduct"
                  @cancel="closeNewProductModal"
                >
                  <a-form v-if="newProductCategory" layout="vertical" :model="newProductForm" class="new-product-form">
                    <a-form-item class="new-product-inline-row">
                      <div class="new-product-inline">
                        <span class="new-product-inline-label">商品名称：</span>
                        <a-input :value="generatedProductName" placeholder="根据品牌、系列、参数与类别自动生成" readonly class="new-product-inline-input new-product-name-input" />
                      </div>
                    </a-form-item>
                    <a-form-item class="new-product-inline-row" required>
                      <div class="new-product-inline">
                        <span class="new-product-inline-label">品牌：</span>
                        <a-select
                          v-model:value="newProductForm.brandId"
                          placeholder="请选择品牌"
                          allow-clear
                          :options="brandSelectOptions"
                          :field-names="{ label: 'label', value: 'value' }"
                          class="new-product-inline-input"
                          @change="onNewProductBrandChange"
                        />
                      </div>
                    </a-form-item>
                    <a-form-item v-if="seriesOptionsForSelectedBrand.length" class="new-product-inline-row">
                      <div class="new-product-inline">
                        <span class="new-product-inline-label">系列：</span>
                        <a-select
                          v-model:value="newProductForm.seriesId"
                          placeholder="请选择系列"
                          allow-clear
                          :options="seriesOptionsForSelectedBrand"
                          :field-names="{ label: 'label', value: 'value' }"
                          class="new-product-inline-input"
                        />
                      </div>
                    </a-form-item>
                    <template v-for="paramName in configuredParamNamesForNewProduct" :key="paramName">
                      <a-form-item class="new-product-inline-row">
                        <div class="new-product-inline">
                          <span class="new-product-inline-label">{{ paramName }}：</span>
                          <a-select
                            v-model:value="newProductForm.parameterValues[paramName]"
                            v-model:open="newProductParamDropdownOpen[paramName]"
                            mode="tags"
                            :placeholder="`请选择或输入${paramName}`"
                            :options="getParamValueOptions(paramName)"
                            allow-clear
                            :max-tag-count="1"
                            class="new-product-inline-input"
                            @change="() => (newProductParamDropdownOpen[paramName] = false)"
                          />
                        </div>
                      </a-form-item>
                    </template>
                    <a-form-item v-if="newProductCategory && newProductCategory.powerRangeEnabled" class="new-product-inline-row">
                      <div class="new-product-inline">
                        <span class="new-product-inline-label">光度范围：</span>
                        <a-space>
                          <a-select
                            v-model:value="newProductForm.powerRangeTemplateId"
                            placeholder="选择模版"
                            allow-clear
                            class="new-product-inline-input new-product-power-template-select"
                            :options="powerTemplateSelectOptions"
                            :field-names="{ label: 'label', value: 'value' }"
                            :dropdown-style="{ minWidth: '400px' }"
                          />
                          <a-button size="small" @click="openPowerRangeModalFromNewProduct">光度范围</a-button>
                        </a-space>
                      </div>
                    </a-form-item>
                    <a-form-item class="new-product-inline-row">
                      <div class="new-product-inline">
                        <span class="new-product-inline-label">零售价格：</span>
                        <a-input
                          v-model:value="newProductForm.retailPrice"
                          placeholder="零售价格"
                          allow-clear
                          class="new-product-inline-input"
                        />
                      </div>
                    </a-form-item>
                    <a-form-item>
                      <a-checkbox v-model:checked="newProductForm.retailPriceHalf">零售价格/2（新建销售时该商品显示的零售价格为商品列表零售价格的一半）</a-checkbox>
                    </a-form-item>
                    <a-form-item>
                      <a-checkbox v-model:checked="newProductForm.requireEyeSide">区分眼别（选中后该商品在新建销售中添加商品后需要选择眼别区分眼别）</a-checkbox>
                    </a-form-item>
                    <a-form-item>
                      <a-checkbox v-model:checked="newProductForm.warrantyOneYear">1年售后（选中后该商品销售后会在售后列表中显示）</a-checkbox>
                    </a-form-item>
                    <a-form-item>
                      <a-checkbox v-model:checked="newProductForm.modelEnabled">型号管理（采购与入库时需填写型号）</a-checkbox>
                    </a-form-item>
                    <a-form-item>
                      <a-checkbox v-model:checked="newProductForm.zeroPurchase">零采购（不需要采购与库存管理，直接销售，如验光、视觉训练等）</a-checkbox>
                    </a-form-item>
                    <a-form-item>
                      <a-checkbox v-model:checked="newProductForm.expiryManageEnabled">效期管理（入库时需填写生产编号、生产日期）</a-checkbox>
                    </a-form-item>
                    <a-form-item v-if="newProductForm.expiryManageEnabled" class="new-product-inline-row">
                      <div class="new-product-inline">
                        <span class="new-product-inline-label">有效期（月）：</span>
                        <a-input-number
                          v-model:value="newProductForm.expiryMonths"
                          placeholder="月数"
                          :min="1"
                          :controls="false"
                          class="new-product-inline-input new-product-expiry-input"
                        />
                      </div>
                    </a-form-item>
                  </a-form>
                </a-modal>
                <!-- 新建商品内光度范围选择弹窗 -->
                <a-modal
                  v-model:visible="powerRangeModalVisible"
                  title="光度范围选择"
                  width="1280px"
                  :footer="null"
                  cancel-text="取消"
                  @cancel="closePowerRangeModal"
                >
                  <div class="power-range-tip">提示：左键拖拉批量选中，再次拖拉为取消选中！</div>
                  <div
                    ref="powerRangeGridWrapRef"
                    class="power-range-grid-wrap"
                    @mousedown="onPowerGridMouseDown"
                    @mousemove="onPowerGridMouseMove"
                    @mouseup="onPowerGridMouseUp"
                    @mouseleave="onPowerGridMouseUp"
                  >
                    <table class="power-range-table">
                      <thead>
                        <tr>
                          <th class="power-range-corner">球镜\柱镜</th>
                          <th v-for="c in cylinderValues" :key="c" class="power-range-th">{{ formatPowerValue(c) }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="s in sphereValues" :key="s" :data-sphere="s">
                          <td class="power-range-td-label">{{ formatSphereValue(s) }}</td>
                          <td
                            v-for="c in cylinderValues"
                            :key="`${s}-${c}`"
                            class="power-range-td"
                            :class="{ selected: isPowerCellSelected(s, c) }"
                            :data-sphere="s"
                            :data-cylinder="c"
                          />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="power-range-templates">
                    <a-button type="primary" size="small" :disabled="!powerRangeSelection || powerRangeSelection.size === 0" @click="savePowerRangeAsTemplate">保存为模版</a-button>
                  </div>
                  <a-modal
                    v-model:visible="powerTemplateEditVisible"
                    title="编辑光度模版"
                    ok-text="保存"
                    cancel-text="取消"
                    @ok="submitPowerTemplateEdit"
                  >
                    <a-form layout="vertical">
                      <a-form-item label="球镜范围（D）">
                        <a-space>
                          <a-input-number v-model:value="powerTemplateForm.sphereMin" :min="-20" :max="20" :step="0.25" :precision="2" placeholder="最小" style="width: 100px" />
                          <span>~</span>
                          <a-input-number v-model:value="powerTemplateForm.sphereMax" :min="-20" :max="20" :step="0.25" :precision="2" placeholder="最大" style="width: 100px" />
                        </a-space>
                      </a-form-item>
                      <a-form-item label="柱镜范围（D）">
                        <a-space>
                          <a-input-number v-model:value="powerTemplateForm.cylinderMin" :min="-6" :max="0" :step="0.25" :precision="2" placeholder="最小" style="width: 100px" />
                          <span>~</span>
                          <a-input-number v-model:value="powerTemplateForm.cylinderMax" :min="-6" :max="0" :step="0.25" :precision="2" placeholder="最大" style="width: 100px" />
                        </a-space>
                      </a-form-item>
                    </a-form>
                  </a-modal>
                </a-modal>
              </a-tab-pane>
              <a-tab-pane key="attr" tab="商品参数管理">
                <div class="sub-tab-content">
                  <ProductAttrMgmt />
                </div>
              </a-tab-pane>
              <a-tab-pane key="func-attr" tab="光度范围">
                <div class="sub-tab-content func-attr-tab">
                  <PowerRange />
                </div>
              </a-tab-pane>
            </a-tabs>
          </div>
        </a-tab-pane>
        <a-tab-pane key="brand" tab="品牌管理">
          <div class="tab-content brand-tab">
            <div class="category-toolbar">
              <a-input
                v-model:value="brandNameInput"
                placeholder="请输入品牌名称"
                allow-clear
                style="width: 240px; margin-right: 8px"
                @press-enter="addBrand"
              />
              <a-button type="primary" @click="addBrand">添加</a-button>
            </div>
            <a-table
              :columns="brandColumns"
              :data-source="brandListExpanded"
              :pagination="false"
              row-key="brandRowKey"
              size="small"
              class="category-table brand-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'series'">
                  <div v-if="record._seriesItem" class="brand-series-cell series-single-row">
                    <span class="series-name">{{ record._seriesRowIndex + 1 }}. {{ record._seriesItem.name }}</span>
                    <a-space>
                      <a-tooltip title="编辑">
                        <a-button type="link" size="small" @click="openSeriesEdit(record._brand, record._seriesItem)">
                          <template #icon><EditOutlined /></template>
                        </a-button>
                      </a-tooltip>
                      <a-popconfirm
                        title="确定删除该系列吗？"
                        ok-text="确定"
                        cancel-text="取消"
                        @confirm="deleteSeries(record._brand, record._seriesItem)"
                      >
                        <a-tooltip title="删除">
                          <a-button type="link" size="small" danger>
                            <template #icon><DeleteOutlined /></template>
                          </a-button>
                        </a-tooltip>
                      </a-popconfirm>
                    </a-space>
                  </div>
                </template>
              </template>
            </a-table>
            <a-modal
              v-model:visible="brandEditVisible"
              title="编辑品牌"
              ok-text="保存"
              cancel-text="取消"
              @ok="submitBrandEdit"
            >
              <a-form layout="vertical">
                <a-form-item label="品牌名称">
                  <a-input v-model:value="brandEditName" placeholder="请输入品牌名称" />
                </a-form-item>
              </a-form>
            </a-modal>
            <a-modal
              v-model:visible="seriesAddVisible"
              title="添加系列"
              ok-text="添加"
              cancel-text="取消"
              @ok="submitAddSeries"
            >
              <a-form layout="vertical">
                <a-form-item v-if="seriesAddBrand" label="品牌">
                  <span>{{ seriesAddBrand.name }}</span>
                </a-form-item>
                <a-form-item label="系列名称" required>
                  <a-input v-model:value="seriesNameInput" placeholder="请输入系列名称" />
                </a-form-item>
              </a-form>
            </a-modal>
            <a-modal
              v-model:visible="seriesEditVisible"
              title="编辑系列"
              ok-text="保存"
              cancel-text="取消"
              @ok="submitSeriesEdit"
            >
              <a-form layout="vertical">
                <a-form-item v-if="seriesEditBrand" label="品牌">
                  <span>{{ seriesEditBrand.name }}</span>
                </a-form-item>
                <a-form-item label="系列名称" required>
                  <a-input v-model:value="seriesEditName" placeholder="请输入系列名称" />
                </a-form-item>
              </a-form>
            </a-modal>
          </div>
        </a-tab-pane>
        <a-tab-pane key="supplier" tab="供应商管理">
          <div class="tab-content supplier-tab">
            <div class="category-toolbar">
              <a-input
                v-model:value="supplierNameInput"
                placeholder="请输入名称"
                allow-clear
                style="width: 240px; margin-right: 8px"
                @press-enter="addSupplier"
              />
              <a-button type="primary" @click="addSupplier">添加</a-button>
            </div>
            <a-table
              :columns="supplierColumns"
              :data-source="supplierList"
              :pagination="false"
              row-key="id"
              size="small"
              class="category-table"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'index'">{{ index + 1 }}</template>
                <template v-else-if="column.key === 'action'">
                  <a-space>
                    <a-button type="link" size="small" @click="openSupplierEdit(record)">编辑</a-button>
                    <a-popconfirm title="确定删除吗？" ok-text="确定" cancel-text="取消" @confirm="deleteSupplier(record)">
                      <a-button type="link" danger size="small">删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
            <a-modal
              v-model:visible="supplierEditVisible"
              title="编辑供应商"
              width="720px"
              ok-text="保存"
              cancel-text="取消"
              @ok="submitSupplierEdit"
            >
              <a-form layout="vertical" :model="supplierForm" class="party-form manufacturer-form-grid">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item label="公司名称">
                      <a-input v-model:value="supplierForm.companyName" placeholder="请输入公司名称" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="联系地址">
                      <a-input v-model:value="supplierForm.contactAddress" placeholder="请输入联系地址" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item label="联系人">
                      <a-input v-model:value="supplierForm.contactPerson" placeholder="请输入联系人" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="联系电话">
                      <a-input v-model:value="supplierForm.contactPhone" placeholder="请输入联系电话" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <div class="qual-section">相关资质</div>
                <a-row v-for="rowKeys in supplierQualRows" :key="rowKeys.join('-')" :gutter="16">
                  <a-col v-for="key in rowKeys" :key="key" :span="8">
                    <div class="qual-item">
                      <div class="qual-label">{{ key }}</div>
                      <div class="qual-image-row">
                        <input
                          type="file"
                          accept="image/*"
                          class="qual-file-input"
                          @change="(e) => onQualImageChange('supplier', key, e)"
                        />
                        <img v-if="supplierForm.qualifications[key]?.image" :src="supplierForm.qualifications[key].image" class="qual-preview" alt="" />
                        <span v-else class="qual-placeholder">点击上传图片</span>
                      </div>
                      <div class="qual-expiry">
                        <span class="qual-expiry-label">有效期：</span>
                        <a-date-picker
                          v-model:value="supplierForm.qualifications[key].expiryDate"
                          placeholder="选择日期"
                          value-format="YYYY-MM-DD"
                          :locale="datePickerLocale"
                          class="qual-expiry-picker"
                        />
                      </div>
                    </div>
                  </a-col>
                </a-row>
              </a-form>
            </a-modal>
          </div>
        </a-tab-pane>
        <a-tab-pane key="manufacturer" tab="生产商管理">
          <div class="tab-content supplier-tab">
            <div class="category-toolbar">
              <a-input
                v-model:value="manufacturerNameInput"
                placeholder="请输入名称"
                allow-clear
                style="width: 240px; margin-right: 8px"
                @press-enter="addManufacturer"
              />
              <a-button type="primary" @click="addManufacturer">添加</a-button>
            </div>
            <a-table
              :columns="manufacturerColumns"
              :data-source="manufacturerList"
              :pagination="false"
              row-key="id"
              size="small"
              class="category-table"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'index'">{{ index + 1 }}</template>
                <template v-else-if="column.key === 'action'">
                  <a-space>
                    <a-button type="link" size="small" @click="openManufacturerEdit(record)">编辑</a-button>
                    <a-popconfirm title="确定删除吗？" ok-text="确定" cancel-text="取消" @confirm="deleteManufacturer(record)">
                      <a-button type="link" danger size="small">删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
            <a-modal
              v-model:visible="manufacturerEditVisible"
              title="编辑生产商"
              width="720px"
              ok-text="保存"
              cancel-text="取消"
              @ok="submitManufacturerEdit"
            >
              <a-form layout="vertical" :model="manufacturerForm" class="party-form manufacturer-form-grid">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item label="公司名称">
                      <a-input v-model:value="manufacturerForm.companyName" placeholder="请输入公司名称" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="联系地址">
                      <a-input v-model:value="manufacturerForm.contactAddress" placeholder="请输入联系地址" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item label="联系人">
                      <a-input v-model:value="manufacturerForm.contactPerson" placeholder="请输入联系人" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="联系电话">
                      <a-input v-model:value="manufacturerForm.contactPhone" placeholder="请输入联系电话" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <div class="qual-section">相关资质</div>
                <a-row v-for="rowKeys in manufacturerQualRows" :key="rowKeys.join('-')" :gutter="16">
                  <a-col v-for="key in rowKeys" :key="key" :span="12">
                    <div class="qual-item">
                      <div class="qual-label">{{ key }}</div>
                      <div class="qual-image-row">
                        <input
                          type="file"
                          accept="image/*"
                          class="qual-file-input"
                          @change="(e) => onQualImageChange('manufacturer', key, e)"
                        />
                        <img v-if="manufacturerForm.qualifications[key]?.image" :src="manufacturerForm.qualifications[key].image" class="qual-preview" alt="" />
                        <span v-else class="qual-placeholder">点击上传图片</span>
                      </div>
                      <div class="qual-expiry">
                        <span class="qual-expiry-label">有效期：</span>
                        <a-date-picker
                          v-model:value="manufacturerForm.qualifications[key].expiryDate"
                          placeholder="选择日期"
                          value-format="YYYY-MM-DD"
                          :locale="datePickerLocale"
                          class="qual-expiry-picker"
                        />
                      </div>
                    </div>
                  </a-col>
                </a-row>
              </a-form>
            </a-modal>
          </div>
        </a-tab-pane>
        <a-tab-pane key="price-list" tab="价目册管理">
          <div class="tab-content category-tab">
            <a-tabs v-model:activeKey="priceListSubTab" type="line" class="sub-tabs">
              <a-tab-pane key="lens" tab="镜片价目册">
                <div class="price-list-placeholder">暂无内容</div>
              </a-tab-pane>
              <a-tab-pane key="frame" tab="镜架价目册">
                <div class="price-list-placeholder">暂无内容</div>
              </a-tab-pane>
            </a-tabs>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, nextTick, h } from 'vue';
import { message, Modal, Button, Space, Popconfirm } from 'ant-design-vue';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { pinyin } from 'pinyin-pro';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import datePickerLocale from 'ant-design-vue/es/date-picker/locale/zh_CN';
import ProductAttrMgmt from './ProductAttrMgmt.vue';
import PowerRange from './PowerRange.vue';

dayjs.locale('zh-cn');

const CATEGORY_STORAGE_KEY = 'ProductCategoryData';
const ATTR_STORAGE_KEY = 'ProductAttributeData';
const PRODUCT_STORAGE_KEY = 'ProductModaldata';
const BRAND_STORAGE_KEY = 'ProductBrandData';
const SUPPLIER_STORAGE_KEY = 'SupplierModaldata';
const MANUFACTURER_STORAGE_KEY = 'ProductManufacturerData';

const supplierQualKeys = ['营业执照', '二类医疗器械经营备案', '三类医疗经营许可证', '食品经营许可证', '药品经营许可证'];
const manufacturerQualKeys = ['营业执照', '医疗器械生产许可证'];

function createEmptyQual(keys) {
  const o = {};
  keys.forEach((k) => { o[k] = { image: '', expiryDate: null }; });
  return o;
}
function cloneQual(src, keys) {
  const o = {};
  keys.forEach((k) => { o[k] = { image: (src && src[k]?.image) || '', expiryDate: src && src[k]?.expiryDate != null ? src[k].expiryDate : null }; });
  return o;
}

const activeTab = ref('new');
const categorySubTab = ref('product-list'); // 新建商品下子标签：商品列表 | 类别列表 | 商品参数管理 | 光度范围
const priceListSubTab = ref('lens'); // 价目册管理下子标签：镜片价目册 | 镜架价目册

// 功能键列表（程序预置，仅展示）
const funcAttrColumns = [
  { title: '序号', key: 'index', width: 80, align: 'center' },
  { title: '功能按钮展示', dataIndex: 'buttonDisplay', key: 'buttonDisplay', width: 160 },
  { title: '功能说明', dataIndex: 'description', key: 'description', ellipsis: true }
];
const funcAttrList = [
  { id: 1, buttonDisplay: '类别选择框', description: '选择类别后仅显示该类别下的商品，选“全部类型”则显示所有商品。' },
  { id: 2, buttonDisplay: '配置', description: '为当前类别配置可选商品参数，新建或编辑商品时可从已配置参数中选择。' },
  { id: 3, buttonDisplay: '编辑', description: '编辑商品名称、所属类别等基础信息。' },
  { id: 4, buttonDisplay: '删除', description: '从商品列表中移除该商品，操作前需二次确认。' },
  { id: 5, buttonDisplay: '添加', description: '在类别列表、商品参数管理、品牌/供应商/生产商等模块中新增一条记录。' },
  { id: 6, buttonDisplay: '编辑（列表行）', description: '编辑当前行的类别名称、参数名称、品牌名称或系列等。' },
  { id: 7, buttonDisplay: '删除（列表行）', description: '删除当前行记录，部分删除需二次确认。' },
  { id: 8, buttonDisplay: '光度范围', description: '点击后弹出光度选择框，横坐标为柱镜(0～-6.00D，步长0.25)，纵坐标为球镜(-20.00～+20.00D，步长0.25)，可拖拉框选范围，再次拖拉或点击取消选中。' }
];

// 光度范围：柱镜 0～-6 步长 0.25，球镜 -20～+20 步长 0.25
function genCylinderValues() {
  const arr = [0]; // 0.00 单独一列
  for (let i = 1; i <= 24; i++) arr.push(Number((-i * 0.25).toFixed(2)));
  return arr;
}
function genSphereValues() {
  const arr = [];
  for (let v = -20; v <= 20; v += 0.25) arr.push(Number(v.toFixed(2)));
  return arr;
}
const cylinderValues = genCylinderValues();
const sphereValues = genSphereValues();

const formatPowerValue = (v) => (Number(v) === v ? Number(v).toFixed(2) : String(v));
const formatSphereValue = (v) => {
  const n = Number(v);
  if (n !== n) return String(v);
  const s = n.toFixed(2);
  return n > 0 ? `+${s}` : s;
};

const powerRangeModalVisible = ref(false);
const powerRangeSelection = ref(new Set()); // Set<string> 每个元素 "s,c" 表示选中的格子
const powerRangeDrag = ref({ start: null, current: null, mode: 'add' }); // mode: 'add' | 'remove'

const powerRangeKey = (s, c) => `${s},${c}`;

function getCellsInRect(sMin, sMax, cMin, cMax) {
  const cells = [];
  sphereValues.forEach((s) => {
    if (s < sMin || s > sMax) return;
    cylinderValues.forEach((c) => {
      if (c < cMin || c > cMax) return;
      cells.push({ s, c });
    });
  });
  return cells;
}

const powerRangeGridWrapRef = ref(null);

const openPowerRangeModal = () => {
  powerRangeSelection.value = new Set();
  powerRangeDrag.value = { start: null, current: null, mode: 'add' };
  loadPowerRangeTemplates();
  powerRangeModalVisible.value = true;
  nextTick(() => {
    setTimeout(scrollPowerGridToSphereZero, 150);
  });
};

function scrollPowerGridToSphereZero() {
  const wrap = powerRangeGridWrapRef.value;
  if (!wrap) return;
  const row = wrap.querySelector('tr[data-sphere="0"]');
  if (!row) return;
  const rowTop = row.offsetTop;
  const wrapHeight = wrap.clientHeight;
  const rowHeight = row.offsetHeight;
  wrap.scrollTop = Math.max(0, rowTop - wrapHeight + rowHeight);
}

const closePowerRangeModal = () => {
  powerRangeModalVisible.value = false;
  powerRangeSelection.value = new Set();
};

const getCellFromEvent = (e) => {
  const el = e.target?.closest?.('[data-sphere][data-cylinder]');
  if (!el) return null;
  const s = Number(el.getAttribute('data-sphere'));
  const c = Number(el.getAttribute('data-cylinder'));
  return { sphere: s, cylinder: c };
};

const onPowerGridMouseDown = (e) => {
  const cell = getCellFromEvent(e);
  if (!cell) return;
  const key = powerRangeKey(cell.sphere, cell.cylinder);
  const inSelection = powerRangeSelection.value.has(key);
  const mode = inSelection ? 'remove' : 'add';
  powerRangeDrag.value = { start: { ...cell }, current: { ...cell }, mode };
};

const onPowerGridMouseMove = (e) => {
  if (powerRangeDrag.value.start == null) return;
  const cell = getCellFromEvent(e);
  if (!cell) return;
  powerRangeDrag.value = { ...powerRangeDrag.value, current: cell };
};

const onPowerGridMouseUp = () => {
  if (powerRangeDrag.value.start == null) return;
  const { start, current, mode } = powerRangeDrag.value;
  const sMin = Math.min(start.sphere, current.sphere);
  const sMax = Math.max(start.sphere, current.sphere);
  const cMin = Math.min(start.cylinder, current.cylinder);
  const cMax = Math.max(start.cylinder, current.cylinder);
  const set = new Set(powerRangeSelection.value);
  const cells = getCellsInRect(sMin, sMax, cMin, cMax);
  if (mode === 'add') {
    cells.forEach(({ s, c }) => set.add(powerRangeKey(s, c)));
  } else {
    cells.forEach(({ s, c }) => set.delete(powerRangeKey(s, c)));
  }
  powerRangeSelection.value = set;
  powerRangeDrag.value = { start: null, current: null, mode: 'add' };
};

const isPowerCellSelected = (s, c) => {
  const key = powerRangeKey(s, c);
  const drag = powerRangeDrag.value;
  if (drag.start != null && drag.current != null) {
    const sMin = Math.min(drag.start.sphere, drag.current.sphere);
    const sMax = Math.max(drag.start.sphere, drag.current.sphere);
    const cMin = Math.min(drag.start.cylinder, drag.current.cylinder);
    const cMax = Math.max(drag.start.cylinder, drag.current.cylinder);
    const inRect = s >= sMin && s <= sMax && c >= cMin && c <= cMax;
    const inSet = powerRangeSelection.value.has(key);
    if (drag.mode === 'add') return inSet || inRect;
    return inSet && !inRect;
  }
  return powerRangeSelection.value.has(key);
};

const powerRangeDisplay = computed(() => {
  const set = powerRangeSelection.value;
  if (!set || set.size === 0) {
    const drag = powerRangeDrag.value;
    if (drag.start != null && drag.current != null) {
      return {
        sphereMin: Math.min(drag.start.sphere, drag.current.sphere),
        sphereMax: Math.max(drag.start.sphere, drag.current.sphere),
        cylinderMin: Math.min(drag.start.cylinder, drag.current.cylinder),
        cylinderMax: Math.max(drag.start.cylinder, drag.current.cylinder)
      };
    }
    return null;
  }
  let sphereMin = Infinity, sphereMax = -Infinity, cylinderMin = Infinity, cylinderMax = -Infinity;
  set.forEach((key) => {
    const [s, c] = key.split(',').map(Number);
    sphereMin = Math.min(sphereMin, s);
    sphereMax = Math.max(sphereMax, s);
    cylinderMin = Math.min(cylinderMin, c);
    cylinderMax = Math.max(cylinderMax, c);
  });
  return { sphereMin, sphereMax, cylinderMin, cylinderMax };
});

const POWER_TEMPLATE_STORAGE_KEY = 'PowerRangeTemplates';
const powerRangeTemplates = ref([]);
const powerTemplateColumns = [
  { title: '序号', key: 'index', width: 80, align: 'center' },
  { title: '模版说明', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: 160 }
];
const powerTemplateEditVisible = ref(false);
const powerTemplateEditingId = ref(null);
const powerTemplateForm = ref({ sphereMin: null, sphereMax: null, cylinderMin: null, cylinderMax: null });

const getPowerTemplateDescription = (t) => {
  if (!t) return '';
  return `球镜 ${formatSphereValue(t.sphereMin)}D ~ ${formatSphereValue(t.sphereMax)}D，柱镜 ${formatPowerValue(t.cylinderMin)}D ~ ${formatPowerValue(t.cylinderMax)}D`;
};

const loadPowerRangeTemplates = () => {
  const raw = localStorage.getItem(POWER_TEMPLATE_STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  powerRangeTemplates.value = list.map((t) => ({ ...t, description: getPowerTemplateDescription(t) }));
};

const savePowerRangeTemplates = (list) => {
  const raw = list.map((t) => ({ id: t.id, sphereMin: t.sphereMin, sphereMax: t.sphereMax, cylinderMin: t.cylinderMin, cylinderMax: t.cylinderMax }));
  localStorage.setItem(POWER_TEMPLATE_STORAGE_KEY, JSON.stringify(raw));
  loadPowerRangeTemplates();
};

const savePowerRangeAsTemplate = () => {
  const d = powerRangeDisplay.value;
  if (!d) return;
  const list = [...powerRangeTemplates.value.map((t) => ({ id: t.id, sphereMin: t.sphereMin, sphereMax: t.sphereMax, cylinderMin: t.cylinderMin, cylinderMax: t.cylinderMax }))];
  const newId = list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
  list.push({ id: newId, sphereMin: d.sphereMin, sphereMax: d.sphereMax, cylinderMin: d.cylinderMin, cylinderMax: d.cylinderMax });
  savePowerRangeTemplates(list);
  message.success('已保存为模版');
};

const openPowerTemplateEdit = (record) => {
  powerTemplateEditingId.value = record.id;
  powerTemplateForm.value = {
    sphereMin: record.sphereMin,
    sphereMax: record.sphereMax,
    cylinderMin: record.cylinderMin,
    cylinderMax: record.cylinderMax
  };
  powerTemplateEditVisible.value = true;
};

const submitPowerTemplateEdit = () => {
  const { sphereMin, sphereMax, cylinderMin, cylinderMax } = powerTemplateForm.value;
  if (sphereMin == null || sphereMax == null || cylinderMin == null || cylinderMax == null) {
    message.warning('请填写完整范围');
    return;
  }
  const list = powerRangeTemplates.value.map((t) => {
    if (t.id !== powerTemplateEditingId.value) return { id: t.id, sphereMin: t.sphereMin, sphereMax: t.sphereMax, cylinderMin: t.cylinderMin, cylinderMax: t.cylinderMax };
    return { id: t.id, sphereMin, sphereMax, cylinderMin, cylinderMax };
  });
  savePowerRangeTemplates(list);
  powerTemplateEditVisible.value = false;
  powerTemplateEditingId.value = null;
  message.success('保存成功');
};

const deletePowerTemplate = (record) => {
  const list = powerRangeTemplates.value.filter((t) => t.id !== record.id);
  savePowerRangeTemplates(list);
  message.success('已删除');
};

// 商品列表
const productSearchKeyword = ref('');
const productListCategoryFilter = ref(null);
const productList = ref([]);

const productListCategoryOptions = computed(() => {
  const options = [{ label: '全部类型', value: null }];
  categoryList.value.forEach((c) => options.push({ label: c.name, value: c.id }));
  return options;
});
const productListColumns = [
  { title: '序号', key: 'index', width: 80, align: 'center' },
  { title: '商品名称', dataIndex: 'name', key: 'name', width: 480, ellipsis: false },
  { title: '类别', key: 'category', width: 200 },
  { title: '商品参数', key: 'attrNames', ellipsis: true },
  { title: '零售价格', dataIndex: 'retailPrice', key: 'retailPrice', width: 120, align: 'right' },
  { title: '光度范围说明', key: 'powerRangeDesc', width: 360, ellipsis: false, align: 'center' },
  { title: '库存管理', key: 'inventoryManage', width: 100, align: 'center' },
  { title: '操作', key: 'action', width: 160 }
];
const productEditVisible = ref(false);
const productForm = ref({
  name: '',
  categoryId: undefined,
  retailPrice: undefined,
  retailPriceHalf: false,
  requireEyeSide: false,
  warrantyOneYear: false,
  parameterValues: {},
  modelEnabled: false,
  zeroPurchase: false,
  expiryManageEnabled: false,
  expiryMonths: undefined
});
const productEditingId = ref(null);
const productFormRef = ref(null);

// 根据类别获取已配置的参数名称列表（商品参数管理 + 类别配置）
const getParamNamesForCategory = (cat) => {
  if (!cat) return [];
  const fromAttrs = (cat.attributeIds || [])
    .map((id) => attrList.value.find((a) => a.id === id)?.name)
    .filter(Boolean);
  const fromHistory = cat.parameterNameHistory || [];
  const fromSelected = cat.selectedParameterNames || [];
  return Array.from(new Set([...fromAttrs, ...fromHistory, ...fromSelected]));
};

const configuredParamNamesForProductEdit = computed(() => {
  const categoryId = productForm.value.categoryId;
  const cat = categoryList.value.find((c) => c.id === categoryId);
  return getParamNamesForCategory(cat);
});

const getParamValueOptionsForProductEdit = (paramName) => {
  const categoryId = productForm.value.categoryId;
  const cat = categoryList.value.find((c) => c.id === categoryId);
  const opts = cat && cat.parameterValueOptions && cat.parameterValueOptions[paramName] ? cat.parameterValueOptions[paramName] : [];
  const baseList = Array.isArray(opts) ? opts.slice() : [];
  const selected = productForm.value.parameterValues && productForm.value.parameterValues[paramName];
  const selectedArr = Array.isArray(selected) ? selected : (selected != null && selected !== '' ? [selected] : []);
  const seen = new Set(baseList.map((v) => String(v).trim()).filter(Boolean));
  selectedArr.forEach((v) => {
    const s = v != null ? String(v).trim() : '';
    if (s && !seen.has(s)) {
      seen.add(s);
      baseList.push(s);
    }
  });
  return baseList.map((v) => ({ label: v, value: v }));
};

const categorySelectOptions = computed(() =>
  categoryList.value.map((c) => ({ label: c.name, value: c.id }))
);

const getProductListRaw = () => {
  const raw = localStorage.getItem(PRODUCT_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

const loadProductList = () => {
  const rawList = getProductListRaw();
  productList.value = rawList.map((p) => ({
    ...p,
    categoryId: p.categoryId != null ? p.categoryId : (typeof p.category === 'number' ? p.category : null),
    inventoryManageType: p.inventoryManageType === 'stock' ? 'stock' : 'custom'
  }));
};

const getInventoryManageLabel = (record) => (record.inventoryManageType === 'stock' ? '库存管理' : '定制管理');

const INVENTORY_TYPE_CHANGED_EVENT = 'product-inventory-manage-type-changed';

const toggleInventoryManage = (record) => {
  const rawList = getProductListRaw();
  const next = record.inventoryManageType === 'stock' ? 'custom' : 'stock';
  const idx = rawList.findIndex((p) => String(p.id) === String(record.id));
  if (idx >= 0) {
    rawList[idx] = { ...rawList[idx], inventoryManageType: next };
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(rawList));
    loadProductList();
    message.success(next === 'stock' ? '已切换为库存管理' : '已切换为定制管理');
    window.dispatchEvent(new CustomEvent(INVENTORY_TYPE_CHANGED_EVENT));
  }
};

const getProductCategoryName = (product) => {
  const id = product.categoryId != null ? product.categoryId : (typeof product.category === 'number' ? product.category : null);
  if (id == null) return product.category != null ? String(product.category) : '-';
  const c = categoryList.value.find((x) => x.id === id);
  return c ? c.name : '-';
};

const getProductAttrNames = (product) => {
  const id = product.categoryId != null ? product.categoryId : (typeof product.category === 'number' ? product.category : null);
  if (id == null) return '';
  const c = categoryList.value.find((x) => x.id === id);
  if (!c || !c.attributeIds || !c.attributeIds.length) return '';
  const names = c.attributeIds
    .map((aid) => attrList.value.find((a) => a.id === aid)?.name)
    .filter(Boolean);
  return names.join('、');
};

const formatRetailPrice = (v) => {
  if (v == null || v === '') return '-';
  const n = Number(v);
  if (Number.isNaN(n)) return '-';
  return `¥ ${n.toFixed(1)}`;
};

const getProductPowerRangeDescription = (product) => {
  const id = product.powerRangeTemplateId;
  if (id == null || id === '') return '-';
  const t = powerRangeTemplates.value.find((x) => x.id === id);
  return t && t.description ? t.description : '-';
};

const matchProductSearch = (product, keyword) => {
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
};

const filteredProductList = computed(() => {
  let list = productList.value.filter((p) => matchProductSearch(p, productSearchKeyword.value));
  const catId = productListCategoryFilter.value;
  if (catId != null && String(catId) !== '') {
    list = list.filter((p) => String(p.categoryId != null ? p.categoryId : p.category) === String(catId));
  }
  return list;
});

const onProductSearchInput = () => {}; // 仅用于触发 filteredProductList 更新

const openProductEdit = (record = null) => {
  productEditingId.value = record ? record.id : null;
  if (record) {
    const categoryId = record.categoryId != null ? record.categoryId : (typeof record.category === 'number' ? record.category : undefined);
    const cat = categoryList.value.find((c) => c.id === categoryId);
    const paramNames = getParamNamesForCategory(cat);
    const parameterValues = {};
    paramNames.forEach((p) => {
      const v = record.parameterValues && record.parameterValues[p];
      parameterValues[p] = v != null && v !== '' ? [String(v)] : [];
    });
    let expiryMonths = undefined;
    if (record.expiryMonths != null) {
      const m = Number(record.expiryMonths);
      if (!Number.isNaN(m) && m >= 1) expiryMonths = m;
    }
    productForm.value = {
      name: record.name,
      categoryId,
      retailPrice: record.retailPrice != null ? record.retailPrice : undefined,
      retailPriceHalf: !!record.retailPriceHalf,
      requireEyeSide: !!record.requireEyeSide || !!(record.eyeSideMode != null && String(record.eyeSideMode).trim() !== ''),
      warrantyOneYear: !!record.warrantyOneYear,
      parameterValues,
      modelEnabled: !!record.modelEnabled,
      zeroPurchase: !!record.zeroPurchase,
      expiryManageEnabled: !!record.expiryManageEnabled,
      expiryMonths
    };
  } else {
    productForm.value = {
      name: '',
      categoryId: undefined,
      retailPrice: undefined,
      retailPriceHalf: false,
      requireEyeSide: false,
      warrantyOneYear: false,
      parameterValues: {},
      modelEnabled: false,
      zeroPurchase: false,
      expiryManageEnabled: false,
      expiryMonths: undefined
    };
  }
  productEditVisible.value = true;
};

const submitProductEdit = () => {
  const name = (productForm.value.name || '').trim();
  if (!name) {
    message.warning('请输入商品名称');
    return;
  }
  if (productForm.value.categoryId == null || productForm.value.categoryId === '') {
    message.warning('请选择类别');
    return;
  }
  const categoryId = productForm.value.categoryId;
  const cat = categoryList.value.find((c) => c.id === categoryId);
  const paramNames = getParamNamesForCategory(cat);
  const paramValues = {};
  const valueOptions = { ...(cat && cat.parameterValueOptions ? cat.parameterValueOptions : {}) };
  paramNames.forEach((paramName) => {
    const v = productForm.value.parameterValues && productForm.value.parameterValues[paramName];
    const str = Array.isArray(v) ? (v.length ? (v[0] && String(v[0]).trim()) : '') : (v != null ? String(v).trim() : '');
    if (str) {
      paramValues[paramName] = str;
      const arr = valueOptions[paramName] || [];
      if (!arr.includes(str)) valueOptions[paramName] = [...arr, str];
    }
  });
  if (productForm.value.expiryManageEnabled) {
    const m = Number(productForm.value.expiryMonths);
    if (!Number.isFinite(m) || m < 1) {
      message.warning('启用效期管理时请填写有效期（月），且不少于 1');
      return;
    }
  }
  const rawList = getProductListRaw();
  const retailPrice = productForm.value.retailPrice != null && productForm.value.retailPrice !== '' ? productForm.value.retailPrice : undefined;
  let expiryMonths = undefined;
  if (productForm.value.expiryManageEnabled && productForm.value.expiryMonths != null) {
    const m = Number(productForm.value.expiryMonths);
    if (!Number.isNaN(m) && m >= 1) expiryMonths = m;
  }
  const modelEnabled = !!productForm.value.modelEnabled;
  const zeroPurchase = !!productForm.value.zeroPurchase;
  const expiryManageEnabled = !!productForm.value.expiryManageEnabled;
  if (productEditingId.value != null) {
    const idx = rawList.findIndex((p) => String(p.id) === String(productEditingId.value));
    if (idx >= 0) {
      rawList[idx] = {
        ...rawList[idx],
        name,
        categoryId,
        retailPrice,
        retailPriceHalf: !!productForm.value.retailPriceHalf,
        requireEyeSide: !!productForm.value.requireEyeSide,
        warrantyOneYear: !!productForm.value.warrantyOneYear,
        parameterValues: paramValues,
        modelEnabled,
        zeroPurchase,
        expiryManageEnabled,
        expiryMonths
      };
    }
    message.success('保存成功');
  } else {
    const newId = rawList.length ? Math.max(...rawList.map((p) => Number(p.id) || 0)) + 1 : 1;
    rawList.push({
      id: newId,
      name,
      categoryId,
      retailPrice,
      retailPriceHalf: !!productForm.value.retailPriceHalf,
      requireEyeSide: !!productForm.value.requireEyeSide,
      warrantyOneYear: !!productForm.value.warrantyOneYear,
      parameterValues: paramValues,
      modelEnabled,
      zeroPurchase,
      expiryManageEnabled,
      expiryMonths
    });
    message.success('新增成功');
  }
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(rawList));
  if (cat) {
    const list = categoryList.value.map((c) =>
      c.id === cat.id ? { ...c, parameterValueOptions: valueOptions } : c
    );
    saveCategoryList(list);
  }
  loadProductList();
  productEditVisible.value = false;
  productEditingId.value = null;
};

const deleteProduct = (record) => {
  const rawList = getProductListRaw().filter((p) => String(p.id) !== String(record.id));
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(rawList));
  loadProductList();
  message.success('已删除');
};

// 类别管理
const categoryNameInput = ref('');
const categoryList = ref([]);
const categoryColumns = [
  { title: '序号', key: 'index', width: 80, align: 'center' },
  { title: '类别名称', dataIndex: 'name', key: 'name' },
  { title: '单位', key: 'unit', width: 120 },
  { title: '参数配置', key: 'attrConfig', width: 120 },
  { title: '新建商品', key: 'newProduct', width: 100 },
  { title: '操作', key: 'action', width: 160 }
];
const categoryEditVisible = ref(false);
const categoryEditName = ref('');
const categoryEditingId = ref(null);
const attrConfigVisible = ref(false);
const attrConfigCategory = ref(null);
const attrConfigSelectedIds = ref([]);
const attrConfigPowerRangeEnabled = ref(false);
const attrConfigSelectedParamNames = ref([]);

const loadCategoryList = () => {
  const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  categoryList.value = list.map((c) => ({
    ...c,
    unit: c.unit != null ? c.unit : '',
    attributeIds: c.attributeIds || [],
    parameterNameHistory: c.parameterNameHistory || [],
    selectedParameterNames: c.selectedParameterNames || [],
    parameterValueOptions: c.parameterValueOptions || {}
  }));
};

const saveCategoryList = (list) => {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(list));
  loadCategoryList();
};

const addCategory = () => {
  const name = (categoryNameInput.value || '').trim();
  if (!name) {
    message.warning('请输入类别名称');
    return;
  }
  const list = [...categoryList.value];
  if (list.some((item) => item.name === name)) {
    message.warning('该类别已存在');
    return;
  }
  const newId = list.length ? Math.max(...list.map((c) => c.id)) + 1 : 1;
  list.push({ id: newId, name, unit: '', attributeIds: [], parameterNameHistory: [], selectedParameterNames: [], parameterValueOptions: {} });
  saveCategoryList(list);
  categoryNameInput.value = '';
  message.success('添加成功');
};

const openCategoryEdit = (record) => {
  categoryEditingId.value = record.id;
  categoryEditName.value = record.name;
  categoryEditVisible.value = true;
};

const submitCategoryEdit = () => {
  const name = (categoryEditName.value || '').trim();
  if (!name) {
    message.warning('请输入类别名称');
    return;
  }
  const list = categoryList.value.map((c) =>
    c.id === categoryEditingId.value ? { ...c, name } : c
  );
  saveCategoryList(list);
  categoryEditVisible.value = false;
  categoryEditingId.value = null;
  message.success('保存成功');
};

const deleteCategory = (record) => {
  const list = categoryList.value.filter((c) => c.id !== record.id);
  saveCategoryList(list);
  message.success('已删除');
};

const saveCategoryUnit = () => {
  saveCategoryList(categoryList.value);
};

const getCategoryAttrConfigText = (record) => {
  const ids = record.attributeIds || [];
  return ids.length > 0 ? `配置(${ids.length})` : '配置';
};

const openAttrConfig = (record) => {
  attrConfigCategory.value = record;
  attrConfigSelectedIds.value = [...(record.attributeIds || [])];
  attrConfigPowerRangeEnabled.value = !!record.powerRangeEnabled;
  attrConfigSelectedParamNames.value = [...(record.selectedParameterNames || [])];
  attrConfigVisible.value = true;
};

const submitAttrConfig = () => {
  if (!attrConfigCategory.value) return;
  const list = categoryList.value.map((c) =>
    c.id === attrConfigCategory.value.id
      ? { ...c, attributeIds: [...attrConfigSelectedIds.value], powerRangeEnabled: attrConfigPowerRangeEnabled.value, selectedParameterNames: [...attrConfigSelectedParamNames.value] }
      : c
  );
  saveCategoryList(list);
  attrConfigVisible.value = false;
  attrConfigCategory.value = null;
  message.success('保存成功');
};

// 新建商品（按类别）
const newProductModalVisible = ref(false);
const newProductCategory = ref(null);
/** 新建商品弹窗中每个参数下拉的展开状态，选择后关闭以免遮挡下方表单项 */
const newProductParamDropdownOpen = reactive({});
const newProductForm = ref({
  productName: '',
  brandId: undefined,
  seriesId: undefined,
  parameterValues: {},
  powerRangeTemplateId: undefined,
  retailPrice: undefined,
  retailPriceHalf: false,
  requireEyeSide: false,
  warrantyOneYear: false,
  modelEnabled: false,
  zeroPurchase: false,
  expiryManageEnabled: false,
  expiryMonths: undefined
});
const brandSelectOptions = computed(() =>
  brandList.value.map((b) => ({ label: b.name, value: b.id }))
);

const seriesOptionsForSelectedBrand = computed(() => {
  const brandId = newProductForm.value.brandId;
  if (brandId == null) return [];
  const brand = brandList.value.find((b) => b.id === brandId);
  if (!brand || !brand.series || !brand.series.length) return [];
  return brand.series.map((s) => ({ label: s.name, value: s.id }));
});

const configuredParamNamesForNewProduct = computed(() => {
  const cat = newProductCategory.value;
  if (!cat) return [];
  const fromAttrs = (cat.attributeIds || [])
    .map((id) => attrList.value.find((a) => a.id === id)?.name)
    .filter(Boolean);
  const fromHistory = cat.parameterNameHistory || [];
  const fromSelected = cat.selectedParameterNames || [];
  const set = new Set([...fromAttrs, ...fromHistory, ...fromSelected]);
  return Array.from(set);
});

const getParamValueOptions = (paramName) => {
  const cat = newProductCategory.value;
  const opts = cat && cat.parameterValueOptions && cat.parameterValueOptions[paramName] ? cat.parameterValueOptions[paramName] : [];
  const baseList = Array.isArray(opts) ? opts.slice() : [];
  const selected = newProductForm.value.parameterValues && newProductForm.value.parameterValues[paramName];
  const selectedArr = Array.isArray(selected) ? selected : (selected != null && selected !== '' ? [selected] : []);
  const seen = new Set(baseList.map((v) => String(v).trim()).filter(Boolean));
  selectedArr.forEach((v) => {
    const s = v != null ? String(v).trim() : '';
    if (s && !seen.has(s)) {
      seen.add(s);
      baseList.push(s);
    }
  });
  return baseList.map((v) => ({ label: v, value: v }));
};

const powerTemplateSelectOptions = computed(() =>
  powerRangeTemplates.value.map((t) => ({ label: t.description, value: t.id }))
);

const isPriceParameter = (paramName) => {
  const n = (paramName || '').trim();
  return n === '零售价' || n === '价格';
};

const generatedProductName = computed(() => {
  const cat = newProductCategory.value;
  if (!cat) return '';
  const parts = [];
  const brandId = newProductForm.value.brandId;
  if (brandId != null) {
    const brand = brandList.value.find((b) => b.id === brandId);
    if (brand && brand.name) parts.push(brand.name);
  }
  const seriesId = newProductForm.value.seriesId;
  if (seriesId != null && brandId != null) {
    const brand = brandList.value.find((b) => b.id === brandId);
    const series = brand && brand.series ? brand.series.find((s) => s.id === seriesId) : null;
    if (series && series.name) parts.push(series.name + '系列');
  }
  configuredParamNamesForNewProduct.value.forEach((paramName) => {
    if (isPriceParameter(paramName)) return;
    const v = newProductForm.value.parameterValues && newProductForm.value.parameterValues[paramName];
    const str = Array.isArray(v) ? (v.length ? (v[0] && String(v[0]).trim()) : '') : (v != null ? String(v).trim() : '');
    if (str) parts.push(str);
  });
  if (cat.name) parts.push(cat.name);
  return parts.join(' ');
});

const openNewProductModal = (record) => {
  newProductCategory.value = record;
  const paramNames = (record.attributeIds || [])
    .map((id) => attrList.value.find((a) => a.id === id)?.name)
    .filter(Boolean);
  const more = [...(record.parameterNameHistory || []), ...(record.selectedParameterNames || [])];
  const allParams = Array.from(new Set([...paramNames, ...more]));
  const parameterValues = {};
  allParams.forEach((p) => { parameterValues[p] = []; });
  Object.keys(newProductParamDropdownOpen).forEach((k) => delete newProductParamDropdownOpen[k]);
  newProductForm.value = {
    productName: '',
    brandId: undefined,
    seriesId: undefined,
    parameterValues,
    powerRangeTemplateId: undefined,
    retailPrice: undefined,
    retailPriceHalf: false,
    requireEyeSide: false,
    warrantyOneYear: false,
    modelEnabled: false,
    zeroPurchase: false,
    expiryManageEnabled: false,
    expiryMonths: undefined
  };
  newProductModalVisible.value = true;
};

const onNewProductBrandChange = () => {
  newProductForm.value.seriesId = undefined;
};

const closeNewProductModal = () => {
  newProductModalVisible.value = false;
  newProductCategory.value = null;
};

const openPowerRangeModalFromNewProduct = () => {
  newProductModalVisible.value = false;
  openPowerRangeModal();
};

const submitNewProduct = () => {
  const cat = newProductCategory.value;
  if (!cat) return;
  const name = (generatedProductName.value || '').trim();
  if (!name) {
    message.warning('请至少选择品牌或填写参数后再保存，以生成商品名称');
    return;
  }
  if (newProductForm.value.expiryManageEnabled) {
    const m = Number(newProductForm.value.expiryMonths);
    if (!Number.isFinite(m) || m < 1) {
      message.warning('启用效期管理时请填写有效期（月），且不少于 1');
      return;
    }
  }
  const rawList = getProductListRaw();
  const newId = rawList.length ? Math.max(...rawList.map((p) => Number(p.id) || 0)) + 1 : 1;
  const paramValues = {};
  const valueOptions = { ...(cat.parameterValueOptions || {}) };
  let retailPrice = undefined;
  // 优先使用新建商品弹窗中的「零售价格」输入框
  const formPrice = newProductForm.value.retailPrice;
  if (formPrice != null && formPrice !== '') {
    const num = Number(String(formPrice).replace(/[^\d.-]/g, ''));
    if (!Number.isNaN(num) && num >= 0) retailPrice = num;
  }
  Object.keys(newProductForm.value.parameterValues || {}).forEach((paramName) => {
    const v = newProductForm.value.parameterValues[paramName];
    const str = Array.isArray(v) ? (v.length ? (v[0] && String(v[0]).trim()) : '') : (v != null ? String(v).trim() : '');
    if (isPriceParameter(paramName)) {
      if (str && retailPrice === undefined) {
        const num = Number(String(str).replace(/[^\d.-]/g, ''));
        if (!Number.isNaN(num) && num >= 0) retailPrice = num;
        const arr = valueOptions[paramName] || [];
        if (!arr.includes(str)) valueOptions[paramName] = [...arr, str];
      }
      return;
    }
    if (str) paramValues[paramName] = str;
    if (str) {
      const arr = valueOptions[paramName] || [];
      if (!arr.includes(str)) valueOptions[paramName] = [...arr, str];
    }
  });
  let expiryMonths = undefined;
  if (newProductForm.value.expiryManageEnabled && newProductForm.value.expiryMonths != null) {
    const m = Number(newProductForm.value.expiryMonths);
    if (!Number.isNaN(m) && m >= 1) expiryMonths = m;
  }
  const sameRetailPrice = (a, b) => {
    const na = a != null && a !== '' ? Number(String(a).replace(/[^\d.-]/g, '')) : NaN;
    const nb = b != null && b !== '' ? Number(String(b).replace(/[^\d.-]/g, '')) : NaN;
    if (Number.isNaN(na) && Number.isNaN(nb)) return true;
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb;
    return false;
  };
  const existingProduct = rawList.find(
    (p) => (String(p.name || '').trim() === name && sameRetailPrice(p.retailPrice, retailPrice))
  );
  const exists = !!existingProduct;
  const doAdd = () => {
    rawList.push({
      id: newId,
      name,
      categoryId: cat.id,
      brandId: newProductForm.value.brandId,
      seriesId: newProductForm.value.seriesId,
      powerRangeTemplateId: cat.powerRangeEnabled ? newProductForm.value.powerRangeTemplateId : undefined,
      parameterValues: paramValues,
      retailPrice,
      retailPriceHalf: !!newProductForm.value.retailPriceHalf,
      requireEyeSide: !!newProductForm.value.requireEyeSide,
      warrantyOneYear: !!newProductForm.value.warrantyOneYear,
      modelEnabled: !!newProductForm.value.modelEnabled,
      zeroPurchase: !!newProductForm.value.zeroPurchase,
      expiryManageEnabled: !!newProductForm.value.expiryManageEnabled,
      expiryMonths
    });
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(rawList));
    const list = categoryList.value.map((c) =>
      c.id === cat.id ? { ...c, parameterValueOptions: valueOptions } : c
    );
    saveCategoryList(list);
    loadProductList();
    closeNewProductModal();
    message.success('新建成功');
  };
  if (exists) {
    const existingName = existingProduct ? String(existingProduct.name || '').trim() : '';
    const existingPrice = existingProduct != null ? formatRetailPrice(existingProduct.retailPrice) : '-';
    const newPriceStr = formatRetailPrice(retailPrice);
    Modal.confirm({
      width: 560,
      title: '提示',
      content: h('div', { style: 'line-height: 1.8;' }, [
        h('p', { style: 'margin: 0 0 4px 0;' }, ['已有商品名称：', existingName, '，零售价格：', existingPrice]),
        h('p', { style: 'margin: 0 0 8px 0;' }, ['新建商品名称：', name, '，零售价格：', newPriceStr]),
        h('p', { style: 'margin: 0; font-weight: 500;' }, '是否仍要添加？')
      ]),
      okText: '确认',
      cancelText: '取消',
      onOk: doAdd
    });
  } else {
    doAdd();
  }
};

// 商品参数管理
const attrNameInput = ref('');
const attrList = ref([]);
const attrColumns = [
  { title: '序号', key: 'index', width: 80, align: 'center' },
  { title: '参数名称', dataIndex: 'name', key: 'name' },
  { title: '参数说明', dataIndex: 'description', key: 'description', width: 320, ellipsis: true },
  { title: '操作', key: 'action', width: 160 }
];
const attrEditVisible = ref(false);
const attrEditName = ref('');
const attrEditDescription = ref('');
const attrEditingId = ref(null);

const loadAttrList = () => {
  const raw = localStorage.getItem(ATTR_STORAGE_KEY);
  attrList.value = raw ? JSON.parse(raw) : [];
};

const saveAttrList = (list) => {
  localStorage.setItem(ATTR_STORAGE_KEY, JSON.stringify(list));
  loadAttrList();
};

const addAttr = () => {
  const name = (attrNameInput.value || '').trim();
  if (!name) {
    message.warning('请输入参数名称');
    return;
  }
  const list = [...attrList.value];
  if (list.some((item) => item.name === name)) {
    message.warning('该参数已存在');
    return;
  }
  const newId = list.length ? Math.max(...list.map((a) => a.id)) + 1 : 1;
  list.push({ id: newId, name, description: '' });
  saveAttrList(list);
  attrNameInput.value = '';
  message.success('添加成功');
};

const openAttrEdit = (record) => {
  attrEditingId.value = record.id;
  attrEditName.value = record.name;
  attrEditDescription.value = record.description || '';
  attrEditVisible.value = true;
};

const submitAttrEdit = () => {
  const name = (attrEditName.value || '').trim();
  if (!name) {
    message.warning('请输入参数名称');
    return;
  }
  const description = (attrEditDescription.value || '').trim();
  const list = attrList.value.map((a) =>
    a.id === attrEditingId.value ? { ...a, name, description } : a
  );
  saveAttrList(list);
  attrEditVisible.value = false;
  attrEditingId.value = null;
  message.success('保存成功');
};

const deleteAttr = (record) => {
  const list = attrList.value.filter((a) => a.id !== record.id);
  saveAttrList(list);
  message.success('已删除');
};

// 品牌管理
const brandNameInput = ref('');
const brandList = ref([]);
// 品牌表展开行：每个品牌多系列时占多行，第一行是品牌名+第一个系列，后续行仅系列
const brandListExpanded = computed(() => {
  const rows = [];
  const list = brandList.value || [];
  list.forEach((brand, brandIndex) => {
    const series = brand.series || [];
    const rowSpan = Math.max(1, series.length);
    if (series.length === 0) {
      rows.push({
        brandRowKey: `${brand.id}_0`,
        _brand: brand,
        _brandIndex: brandIndex,
        _seriesRowIndex: 0,
        _seriesItem: null,
        _rowSpan: 1
      });
    } else {
      series.forEach((s, sIndex) => {
        rows.push({
          brandRowKey: `${brand.id}_${sIndex}_${s.id}`,
          _brand: brand,
          _brandIndex: brandIndex,
          _seriesRowIndex: sIndex,
          _seriesItem: s,
          _rowSpan: rowSpan
        });
      });
    }
  });
  return rows;
});
const brandEditVisible = ref(false);
const brandEditName = ref('');
const brandEditingId = ref(null);
const seriesAddVisible = ref(false);
const seriesAddBrand = ref(null);
const seriesNameInput = ref('');
const seriesEditVisible = ref(false);
const seriesEditBrand = ref(null);
const seriesEditItem = ref(null);
const seriesEditName = ref('');

const loadBrandList = () => {
  const raw = localStorage.getItem(BRAND_STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  brandList.value = list.map((b) => ({ ...b, series: b.series || [] }));
};

const saveBrandList = (list) => {
  localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(list));
  loadBrandList();
};

const addBrand = () => {
  const name = (brandNameInput.value || '').trim();
  if (!name) {
    message.warning('请输入品牌名称');
    return;
  }
  const list = [...brandList.value];
  if (list.some((b) => b.name === name)) {
    message.warning('该品牌已存在');
    return;
  }
  const newId = list.length ? Math.max(...list.map((b) => b.id)) + 1 : 1;
  list.push({ id: newId, name, series: [] });
  saveBrandList(list);
  brandNameInput.value = '';
  message.success('添加成功');
};

const openBrandEdit = (record) => {
  brandEditingId.value = record.id;
  brandEditName.value = record.name;
  brandEditVisible.value = true;
};

const submitBrandEdit = () => {
  const name = (brandEditName.value || '').trim();
  if (!name) {
    message.warning('请输入品牌名称');
    return;
  }
  const list = brandList.value.map((b) =>
    b.id === brandEditingId.value ? { ...b, name } : b
  );
  saveBrandList(list);
  brandEditVisible.value = false;
  brandEditingId.value = null;
  message.success('保存成功');
};

const deleteBrand = (record) => {
  const list = brandList.value.filter((b) => b.id !== record.id);
  saveBrandList(list);
  message.success('已删除');
};

const brandColumns = computed(() => [
  {
    title: '序号',
    key: 'index',
    width: 80,
    align: 'center',
    customCell: ({ record }) => ({ props: { rowSpan: record._seriesRowIndex === 0 ? record._rowSpan : 0 } }),
    customRender: ({ record }) => (record._seriesRowIndex === 0 ? record._brandIndex + 1 : null)
  },
  {
    title: '品牌名称',
    dataIndex: 'name',
    key: 'name',
    width: 160,
    customCell: ({ record }) => ({ props: { rowSpan: record._seriesRowIndex === 0 ? record._rowSpan : 0 } }),
    customRender: ({ record }) => (record._seriesRowIndex === 0 ? record._brand.name : null)
  },
  { title: '系列', key: 'series', ellipsis: false },
  {
    title: '添加系列',
    key: 'addSeries',
    width: 100,
    align: 'center',
    customCell: ({ record }) => ({ props: { rowSpan: record._seriesRowIndex === 0 ? record._rowSpan : 0 } }),
    customRender: ({ record }) =>
      record._seriesRowIndex === 0
        ? h(Button, { type: 'link', size: 'small', onClick: () => openAddSeries(record._brand) }, '添加系列')
        : null
  },
  {
    title: '操作',
    key: 'action',
    width: 160,
    align: 'right',
    customCell: ({ record }) => ({ props: { rowSpan: record._seriesRowIndex === 0 ? record._rowSpan : 0 } }),
    customRender: ({ record }) =>
      record._seriesRowIndex === 0
        ? h(Space, [
            h(Button, { type: 'link', size: 'small', onClick: () => openBrandEdit(record._brand) }, '编辑'),
            h(Popconfirm, {
              title: '确定删除该品牌吗？',
              okText: '确定',
              cancelText: '取消',
              onConfirm: () => deleteBrand(record._brand)
            }, { default: () => h(Button, { type: 'link', danger: true, size: 'small' }, '删除') })
          ])
        : null
  }
]);

const openAddSeries = (record) => {
  seriesAddBrand.value = record;
  seriesNameInput.value = '';
  seriesAddVisible.value = true;
};

const submitAddSeries = () => {
  const name = (seriesNameInput.value || '').trim();
  if (!name) {
    message.warning('请输入系列名称');
    return;
  }
  if (!seriesAddBrand.value) return;
  const list = brandList.value.map((b) => {
    if (b.id !== seriesAddBrand.value.id) return b;
    const series = b.series || [];
    const newId = series.length ? Math.max(...series.map((s) => s.id)) + 1 : 1;
    return { ...b, series: [...series, { id: newId, name }] };
  });
  saveBrandList(list);
  seriesAddVisible.value = false;
  seriesAddBrand.value = null;
  message.success('添加成功');
};

const openSeriesEdit = (record, seriesItem) => {
  seriesEditBrand.value = record;
  seriesEditItem.value = seriesItem;
  seriesEditName.value = seriesItem.name;
  seriesEditVisible.value = true;
};

const submitSeriesEdit = () => {
  const name = (seriesEditName.value || '').trim();
  if (!name) {
    message.warning('请输入系列名称');
    return;
  }
  if (!seriesEditBrand.value || !seriesEditItem.value) return;
  const list = brandList.value.map((b) => {
    if (b.id !== seriesEditBrand.value.id) return b;
    const series = (b.series || []).map((s) =>
      s.id === seriesEditItem.value.id ? { ...s, name } : s
    );
    return { ...b, series };
  });
  saveBrandList(list);
  seriesEditVisible.value = false;
  seriesEditBrand.value = null;
  seriesEditItem.value = null;
  message.success('保存成功');
};

const deleteSeries = (record, seriesItem) => {
  const list = brandList.value.map((b) => {
    if (b.id !== record.id) return b;
    const series = (b.series || []).filter((s) => s.id !== seriesItem.id);
    return { ...b, series };
  });
  saveBrandList(list);
  message.success('已删除');
};

// 供应商管理
const supplierNameInput = ref('');
const supplierList = ref([]);
const supplierColumns = [
  { title: '序号', key: 'index', width: 80, align: 'center' },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '操作', key: 'action', width: 160 }
];
const supplierEditVisible = ref(false);
const supplierEditingId = ref(null);
const supplierForm = ref({
  companyName: '',
  contactPerson: '',
  contactPhone: '',
  contactAddress: '',
  qualifications: createEmptyQual(supplierQualKeys)
});

const supplierQualRows = computed(() => {
  const keys = supplierQualKeys;
  const rows = [];
  for (let i = 0; i < keys.length; i += 3) rows.push(keys.slice(i, i + 3));
  return rows;
});

const loadSupplierList = () => {
  const raw = localStorage.getItem(SUPPLIER_STORAGE_KEY);
  supplierList.value = raw ? JSON.parse(raw) : [];
};

const saveSupplierList = (list) => {
  localStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(list));
  loadSupplierList();
};

const addSupplier = () => {
  const name = (supplierNameInput.value || '').trim();
  if (!name) { message.warning('请输入名称'); return; }
  const list = [...supplierList.value];
  if (list.some((s) => s.name === name)) { message.warning('该名称已存在'); return; }
  const newId = list.length ? Math.max(...list.map((s) => s.id)) + 1 : 1;
  list.push({ id: newId, name, companyName: name, contactPerson: '', contactPhone: '', contactAddress: '', qualifications: createEmptyQual(supplierQualKeys) });
  saveSupplierList(list);
  supplierNameInput.value = '';
  message.success('添加成功');
};

const openSupplierEdit = (record) => {
  supplierEditingId.value = record.id;
  supplierForm.value = {
    companyName: record.companyName ?? record.name ?? '',
    contactPerson: record.contactPerson ?? '',
    contactPhone: record.contactPhone ?? '',
    contactAddress: record.contactAddress ?? '',
    qualifications: cloneQual(record.qualifications, supplierQualKeys)
  };
  supplierEditVisible.value = true;
};

const submitSupplierEdit = () => {
  const list = supplierList.value.map((s) =>
    s.id === supplierEditingId.value
      ? { ...s, companyName: supplierForm.value.companyName, name: supplierForm.value.companyName || s.name, contactPerson: supplierForm.value.contactPerson, contactPhone: supplierForm.value.contactPhone, contactAddress: supplierForm.value.contactAddress, qualifications: { ...supplierForm.value.qualifications } }
      : s
  );
  saveSupplierList(list);
  supplierEditVisible.value = false;
  message.success('保存成功');
};

const deleteSupplier = (record) => {
  const list = supplierList.value.filter((s) => s.id !== record.id);
  saveSupplierList(list);
  message.success('已删除');
};

const onQualImageChange = (type, key, e) => {
  const file = e.target?.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (type === 'supplier') {
      supplierForm.value.qualifications[key] = { ...supplierForm.value.qualifications[key], image: reader.result };
    } else {
      manufacturerForm.value.qualifications[key] = { ...manufacturerForm.value.qualifications[key], image: reader.result };
    }
  };
  reader.readAsDataURL(file);
  e.target.value = '';
};

// 生产商管理
const manufacturerNameInput = ref('');
const manufacturerList = ref([]);
const manufacturerColumns = [
  { title: '序号', key: 'index', width: 80, align: 'center' },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '操作', key: 'action', width: 160 }
];
const manufacturerEditVisible = ref(false);
const manufacturerEditingId = ref(null);
const manufacturerForm = ref({
  companyName: '',
  contactPerson: '',
  contactPhone: '',
  contactAddress: '',
  qualifications: createEmptyQual(manufacturerQualKeys)
});

const manufacturerQualRows = computed(() => {
  const keys = manufacturerQualKeys;
  const rows = [];
  for (let i = 0; i < keys.length; i += 2) rows.push(keys.slice(i, i + 2));
  return rows;
});

const loadManufacturerList = () => {
  const raw = localStorage.getItem(MANUFACTURER_STORAGE_KEY);
  manufacturerList.value = raw ? JSON.parse(raw) : [];
};

const saveManufacturerList = (list) => {
  localStorage.setItem(MANUFACTURER_STORAGE_KEY, JSON.stringify(list));
  loadManufacturerList();
};

const addManufacturer = () => {
  const name = (manufacturerNameInput.value || '').trim();
  if (!name) { message.warning('请输入名称'); return; }
  const list = [...manufacturerList.value];
  if (list.some((m) => m.name === name)) { message.warning('该名称已存在'); return; }
  const newId = list.length ? Math.max(...list.map((m) => m.id)) + 1 : 1;
  list.push({ id: newId, name, companyName: name, contactPerson: '', contactPhone: '', contactAddress: '', qualifications: createEmptyQual(manufacturerQualKeys) });
  saveManufacturerList(list);
  manufacturerNameInput.value = '';
  message.success('添加成功');
};

const openManufacturerEdit = (record) => {
  manufacturerEditingId.value = record.id;
  manufacturerForm.value = {
    companyName: record.companyName ?? record.name ?? '',
    contactPerson: record.contactPerson ?? '',
    contactPhone: record.contactPhone ?? '',
    contactAddress: record.contactAddress ?? '',
    qualifications: cloneQual(record.qualifications, manufacturerQualKeys)
  };
  manufacturerEditVisible.value = true;
};

const submitManufacturerEdit = () => {
  const list = manufacturerList.value.map((m) =>
    m.id === manufacturerEditingId.value
      ? { ...m, companyName: manufacturerForm.value.companyName, name: manufacturerForm.value.companyName || m.name, contactPerson: manufacturerForm.value.contactPerson, contactPhone: manufacturerForm.value.contactPhone, contactAddress: manufacturerForm.value.contactAddress, qualifications: { ...manufacturerForm.value.qualifications } }
      : m
  );
  saveManufacturerList(list);
  manufacturerEditVisible.value = false;
  message.success('保存成功');
};

const deleteManufacturer = (record) => {
  const list = manufacturerList.value.filter((m) => m.id !== record.id);
  saveManufacturerList(list);
  message.success('已删除');
};

onMounted(() => {
  loadCategoryList();
  loadAttrList();
  loadProductList();
  loadBrandList();
  loadSupplierList();
  loadManufacturerList();
  loadPowerRangeTemplates();
});
</script>

<style scoped>
.product-info-page {
  padding: 16px;
}
.product-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}
.product-tabs :deep(.ant-tabs-tab) {
  padding: 12px 16px;
}
.product-tabs :deep(.ant-tabs-ink-bar) {
  height: 3px;
}
.tab-content {
  padding: 28px 0 24px;
  min-height: 200px;
}
.placeholder-text {
  text-align: center;
  color: #999;
  margin: 0;
}
.category-tab {
  padding-top: 0;
}
.sub-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 30px;
}
.sub-tabs :deep(.ant-tabs-tab) {
  padding: 10px 14px;
  font-size: 14px;
}
.sub-tab-content {
  min-height: 120px;
}
.price-list-placeholder {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}
.func-attr-tab {
  padding-top: 8px;
}
.power-range-page-toolbar {
  margin-bottom: 16px;
}
.power-range-page-list-title {
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 14px;
}
.power-range-page-list {
  max-width: 800px;
}
.power-range-tip {
  margin-bottom: 12px;
  font-size: 13px;
  color: red;
}
.expiry-months-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}
.expiry-months-inline .expiry-months-label {
  color: rgba(0, 0, 0, 0.65);
  white-space: nowrap;
  width: 6em;
  text-align: right;
  display: inline-block;
}
.expiry-months-inline .expiry-months-input {
  width: 88px;
}
.product-edit-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}
.product-edit-inline .product-edit-inline-label {
  color: rgba(0, 0, 0, 0.65);
  white-space: nowrap;
  width: 6em;
  text-align: right;
  display: inline-block;
}
.product-edit-inline .product-edit-inline-input {
  width: 140px;
  flex-shrink: 0;
}
.new-product-form .ant-form-item {
  margin-bottom: 14px;
}
.new-product-form .ant-form-item:last-child {
  margin-bottom: 0;
}
.new-product-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}
.new-product-inline .new-product-inline-label {
  color: rgba(0, 0, 0, 0.65);
  white-space: nowrap;
  width: 7em;
  text-align: right;
  display: inline-block;
}
.new-product-inline .new-product-inline-input {
  width: 160px;
  flex-shrink: 0;
}
.new-product-inline .new-product-name-input {
  width: 360px;
  max-width: 100%;
}
.new-product-inline .new-product-power-template-select {
  min-width: 280px;
  width: 320px;
}
.new-product-inline .new-product-expiry-input {
  width: 88px;
}
.power-range-grid-wrap {
  overflow: auto;
  max-height: 600px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}
.power-range-table {
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
  min-width: 980px;
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
  min-width: 36px;
  padding: 4px 2px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  font-weight: 600;
  font-size: 12px;
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
  min-width: 36px;
  height: 22px;
  padding: 0 4px;
  border: 1px solid #e8e8e8;
  cursor: default;
  user-select: none;
}
.power-range-td.selected {
  background: #bae7ff;
}
.power-range-result {
  margin-top: 12px;
  padding: 8px 12px;
  background: #e6f7ff;
  border-radius: 4px;
  font-size: 13px;
}
.power-range-templates {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
.power-range-templates-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.power-range-templates-title {
  font-weight: 600;
  font-size: 14px;
}
.power-template-table {
  font-size: 12px;
}
.category-toolbar {
  margin-top: 14px;
  margin-bottom: 20px;
}
.category-table {
  max-width: 700px;
}
.attr-config-modal .attr-config-category-name {
  margin-bottom: 8px;
  color: #333;
}
.attr-config-label {
  margin-bottom: 12px;
  color: #666;
  font-size: 14px;
}
.attr-config-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px 0;
}
.attr-config-item {
  line-height: 32px;
}
.attr-config-empty {
  color: #999;
  margin: 16px 0 0;
  font-size: 14px;
}
.attr-config-history {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.brand-tab {
  padding-top: 16px;
}
/* 品牌名、序号、添加系列、操作与第一个系列同行：合并单元格内容顶对齐 */
.brand-table.ant-table .ant-table-cell {
  vertical-align: top;
}
.brand-series-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.brand-series-cell .series-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}
.brand-series-cell .series-name {
  margin-right: 4px;
}
.brand-series-cell.series-single-row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.supplier-tab {
  padding-top: 16px;
}
.party-form .qual-section {
  margin: 16px 0 8px;
  font-weight: 600;
  color: #333;
}
.party-form .qual-item {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.party-form .qual-item:last-child {
  border-bottom: none;
}
.party-form .qual-label {
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}
.party-form .qual-image-row {
  position: relative;
  display: block;
  width: 100%;
  min-height: 150px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
}
.party-form .qual-file-input {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}
.party-form .qual-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}
.party-form .qual-placeholder {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999;
  pointer-events: none;
}
.party-form .qual-image-row {
  cursor: pointer;
}
.party-form .qual-expiry {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 0;
}
.party-form .qual-expiry-label {
  flex-shrink: 0;
}
.party-form .qual-expiry-picker {
  width: 140px;
}
</style>
