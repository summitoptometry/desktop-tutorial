<template>
  <div class="biometry-exam-style-two">
    <div v-if="!record" class="no-data">暂无检查数据</div>
    <div v-else>
      <!-- 生物测量仪检查 -->
      <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasBiometryData" 
           class="section-block"
           :class="{ 'collapsed': enableCollapse && !sectionExpanded?.biometry }">
        <h3 
          v-if="!reportLayout && (viewMode === 'view' || !isReportMode)"
          class="section-title"
          :class="{ 'clickable': enableCollapse }"
          @click="enableCollapse && handleToggleSection('biometry')"
        >
          生物测量仪检查
          <span v-if="enableCollapse" class="section-toggle-icon">
            <UpOutlined v-if="sectionExpanded?.biometry" />
            <DownOutlined v-else />
          </span>
        </h3>
        <div v-show="viewMode === 'print' || (enableCollapse ? sectionExpanded?.biometry : true)">
        <table v-if="reportLayout" class="exam-sheet exam-table-biometry biometry-report-by-eye">
          <tbody>
            <tr>
              <th class="side-title" rowspan="3">
                <span class="report-section-side-title-text">生物测量仪</span>
              </th>
              <th class="row-head">眼别</th>
              <th class="col-head">眼轴/mm</th>
              <th class="col-head">平均K/D</th>
              <th class="col-head">轴率比</th>
              <th class="col-head col-critical">参考临界值</th>
              <th class="col-head">K1/D</th>
              <th class="col-head">K2/D</th>
              <th class="col-head">ΔK/D</th>
              <th class="col-head">角膜厚度<br>μm</th>
              <th class="col-head">前房深度<br>mm</th>
              <th class="col-head">晶体厚度<br>mm</th>
              <th class="col-head">玻璃体腔厚度<br>mm</th>
              <th v-if="viewMode !== 'view' || hasChoroidThickness" class="col-head">脉络膜厚度<br>μm</th>
            </tr>
            <tr>
              <th class="eye-cell eye-name">右眼</th>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number
                      v-bind="nonNegativeInputNumberBind"
                      :value="editForm.right_eye_axial_length"
                      :min="0"
                      :precision="2"
                      :step="0.01"
                      class="cell-number"
                      style="width: 100%"
                      @update:value="(v) => { editForm.right_eye_axial_length = coerceNonNegativeAxial(v); }"
                    />
                  </template>
                  <template v-else>{{ formatValue(record?.right_eye_axial_length) }}</template>
                </div>
              </td>
              <td class="cell-computed">
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">{{ formatValue(calculateAvgK(editForm.right_eye_k1, editForm.right_eye_k2)) }}</template>
                  <template v-else>{{ formatValue(calculateAvgK(record?.right_eye_k1, record?.right_eye_k2)) }}</template>
                </div>
              </td>
              <td class="cell-computed">
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">{{ formatValue(calculateAxialRatio(editForm.right_eye_axial_length, editForm.right_eye_k1, editForm.right_eye_k2)) }}</template>
                  <template v-else>{{ formatValue(calculateAxialRatio(record?.right_eye_axial_length, record?.right_eye_k1, record?.right_eye_k2)) }}</template>
                </div>
              </td>
              <td class="col-critical cell-computed">
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">{{ formatValue(calculateCriticalPoint(editForm.right_eye_k1, editForm.right_eye_k2)) }}</template>
                  <template v-else>{{ formatValue(calculateCriticalPoint(record?.right_eye_k1, record?.right_eye_k2)) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_eye_k1" :min="0" :precision="2" :step="0.25" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatValue(record?.right_eye_k1) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_eye_k2" :min="0" :precision="2" :step="0.25" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatValue(record?.right_eye_k2) }}</template>
                </div>
              </td>
              <td class="cell-computed">
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">{{ formatValue(calculateDeltaK(editForm.right_eye_k1, editForm.right_eye_k2)) }}</template>
                  <template v-else>{{ formatValue(calculateDeltaK(record?.right_eye_k1, record?.right_eye_k2)) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_cct" :min="0" :precision="0" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatCctValue(record?.right_cct) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_anterior_chamber_depth" :min="0" :precision="2" :step="0.01" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatValue(record?.right_anterior_chamber_depth) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_lens_thickness" :min="0" :precision="2" :step="0.01" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatValue(record?.right_lens_thickness) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_vitreous_space_thickness" :min="0" :precision="2" :step="0.01" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatValue(record?.right_vitreous_space_thickness) }}</template>
                </div>
              </td>
              <td v-if="viewMode !== 'view' || hasChoroidThickness">
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_oct_fovea" :min="0" :precision="0" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatValue(record?.right_oct_fovea) }}</template>
                </div>
              </td>
            </tr>
            <tr>
              <th class="eye-cell eye-name">左眼</th>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number
                      v-bind="nonNegativeInputNumberBind"
                      :value="editForm.left_eye_axial_length"
                      :min="0"
                      :precision="2"
                      :step="0.01"
                      class="cell-number"
                      style="width: 100%"
                      @update:value="(v) => { editForm.left_eye_axial_length = coerceNonNegativeAxial(v); }"
                    />
                  </template>
                  <template v-else>{{ formatValue(record?.left_eye_axial_length) }}</template>
                </div>
              </td>
              <td class="cell-computed">
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">{{ formatValue(calculateAvgK(editForm.left_eye_k1, editForm.left_eye_k2)) }}</template>
                  <template v-else>{{ formatValue(calculateAvgK(record?.left_eye_k1, record?.left_eye_k2)) }}</template>
                </div>
              </td>
              <td class="cell-computed">
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">{{ formatValue(calculateAxialRatio(editForm.left_eye_axial_length, editForm.left_eye_k1, editForm.left_eye_k2)) }}</template>
                  <template v-else>{{ formatValue(calculateAxialRatio(record?.left_eye_axial_length, record?.left_eye_k1, record?.left_eye_k2)) }}</template>
                </div>
              </td>
              <td class="col-critical cell-computed">
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">{{ formatValue(calculateCriticalPoint(editForm.left_eye_k1, editForm.left_eye_k2)) }}</template>
                  <template v-else>{{ formatValue(calculateCriticalPoint(record?.left_eye_k1, record?.left_eye_k2)) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_eye_k1" :min="0" :precision="2" :step="0.25" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatValue(record?.left_eye_k1) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_eye_k2" :min="0" :precision="2" :step="0.25" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatValue(record?.left_eye_k2) }}</template>
                </div>
              </td>
              <td class="cell-computed">
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">{{ formatValue(calculateDeltaK(editForm.left_eye_k1, editForm.left_eye_k2)) }}</template>
                  <template v-else>{{ formatValue(calculateDeltaK(record?.left_eye_k1, record?.left_eye_k2)) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_cct" :min="0" :precision="0" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatCctValue(record?.left_cct) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_anterior_chamber_depth" :min="0" :precision="2" :step="0.01" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatValue(record?.left_anterior_chamber_depth) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_lens_thickness" :min="0" :precision="2" :step="0.01" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatValue(record?.left_lens_thickness) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_vitreous_space_thickness" :min="0" :precision="2" :step="0.01" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatValue(record?.left_vitreous_space_thickness) }}</template>
                </div>
              </td>
              <td v-if="viewMode !== 'view' || hasChoroidThickness">
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_oct_fovea" :min="0" :precision="0" class="cell-number" style="width: 100%" />
                  </template>
                  <template v-else>{{ formatValue(record?.left_oct_fovea) }}</template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <table v-else class="biometry-table">
          <thead>
            <tr>
              <th>检查项目</th>
              <th>右眼</th>
              <th>左眼</th>
              <th>单位</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="item-label">眼轴长度</td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number
                    v-bind="nonNegativeInputNumberBind"
                    :value="editForm.right_eye_axial_length"
                    :min="0"
                    :precision="2"
                    :step="0.01"
                    style="width: 100%"
                    @update:value="(v) => { editForm.right_eye_axial_length = coerceNonNegativeAxial(v); }"
                  />
                </template>
                <template v-else>{{ formatValue(record?.right_eye_axial_length) }}</template>
              </td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number
                    v-bind="nonNegativeInputNumberBind"
                    :value="editForm.left_eye_axial_length"
                    :min="0"
                    :precision="2"
                    :step="0.01"
                    style="width: 100%"
                    @update:value="(v) => { editForm.left_eye_axial_length = coerceNonNegativeAxial(v); }"
                  />
                </template>
                <template v-else>{{ formatValue(record?.left_eye_axial_length) }}</template>
              </td>
              <td class="unit-cell">mm</td>
            </tr>
            <tr>
              <td class="item-label">K1</td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_eye_k1" :min="0" :precision="2" :step="0.25" style="width: 100%" />
                </template>
                <template v-else>{{ formatValue(record?.right_eye_k1) }}</template>
              </td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_eye_k1" :min="0" :precision="2" :step="0.25" style="width: 100%" />
                </template>
                <template v-else>{{ formatValue(record?.left_eye_k1) }}</template>
              </td>
              <td class="unit-cell">D</td>
            </tr>
            <tr>
              <td class="item-label">K2</td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_eye_k2" :min="0" :precision="2" :step="0.25" style="width: 100%" />
                </template>
                <template v-else>{{ formatValue(record?.right_eye_k2) }}</template>
              </td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_eye_k2" :min="0" :precision="2" :step="0.25" style="width: 100%" />
                </template>
                <template v-else>{{ formatValue(record?.left_eye_k2) }}</template>
              </td>
              <td class="unit-cell">D</td>
            </tr>
            <tr>
              <td class="item-label">ΔK</td>
              <td class="cell-computed">
                <template v-if="viewMode === 'edit'">
                  {{ formatValue(calculateDeltaK(viewMode === 'edit' ? editForm.right_eye_k1 : record?.right_eye_k1, viewMode === 'edit' ? editForm.right_eye_k2 : record?.right_eye_k2)) }}
                </template>
                <template v-else>{{ formatValue(calculateDeltaK(record?.right_eye_k1, record?.right_eye_k2)) }}</template>
              </td>
              <td class="cell-computed">
                <template v-if="viewMode === 'edit'">
                  {{ formatValue(calculateDeltaK(viewMode === 'edit' ? editForm.left_eye_k1 : record?.left_eye_k1, viewMode === 'edit' ? editForm.left_eye_k2 : record?.left_eye_k2)) }}
                </template>
                <template v-else>{{ formatValue(calculateDeltaK(record?.left_eye_k1, record?.left_eye_k2)) }}</template>
              </td>
              <td class="unit-cell">D</td>
            </tr>
            <tr>
              <td class="item-label">avK</td>
              <td class="cell-computed">
                <template v-if="viewMode === 'edit'">
                  {{ formatValue(calculateAvgK(viewMode === 'edit' ? editForm.right_eye_k1 : record?.right_eye_k1, viewMode === 'edit' ? editForm.right_eye_k2 : record?.right_eye_k2)) }}
                </template>
                <template v-else>{{ formatValue(calculateAvgK(record?.right_eye_k1, record?.right_eye_k2)) }}</template>
              </td>
              <td class="cell-computed">
                <template v-if="viewMode === 'edit'">
                  {{ formatValue(calculateAvgK(viewMode === 'edit' ? editForm.left_eye_k1 : record?.left_eye_k1, viewMode === 'edit' ? editForm.left_eye_k2 : record?.left_eye_k2)) }}
                </template>
                <template v-else>{{ formatValue(calculateAvgK(record?.left_eye_k1, record?.left_eye_k2)) }}</template>
              </td>
              <td class="unit-cell">D</td>
            </tr>
            <tr>
              <td class="item-label">轴率比</td>
              <td class="cell-computed">
                <template v-if="viewMode === 'edit'">
                  {{ formatValue(calculateAxialRatio(viewMode === 'edit' ? editForm.right_eye_axial_length : record?.right_eye_axial_length, viewMode === 'edit' ? editForm.right_eye_k1 : record?.right_eye_k1, viewMode === 'edit' ? editForm.right_eye_k2 : record?.right_eye_k2)) }}
                </template>
                <template v-else>{{ formatValue(calculateAxialRatio(record?.right_eye_axial_length, record?.right_eye_k1, record?.right_eye_k2)) }}</template>
              </td>
              <td class="cell-computed">
                <template v-if="viewMode === 'edit'">
                  {{ formatValue(calculateAxialRatio(viewMode === 'edit' ? editForm.left_eye_axial_length : record?.left_eye_axial_length, viewMode === 'edit' ? editForm.left_eye_k1 : record?.left_eye_k1, viewMode === 'edit' ? editForm.left_eye_k2 : record?.left_eye_k2)) }}
                </template>
                <template v-else>{{ formatValue(calculateAxialRatio(record?.left_eye_axial_length, record?.left_eye_k1, record?.left_eye_k2)) }}</template>
              </td>
              <td class="unit-cell biometry-ref-inline">参考值 <span class="biometry-ref-threshold">≤3.0</span></td>
            </tr>
            <tr>
              <td class="item-label">参考临界值</td>
              <td class="cell-computed">
                <template v-if="viewMode === 'edit'">
                  {{ formatValue(calculateCriticalPoint(viewMode === 'edit' ? editForm.right_eye_k1 : record?.right_eye_k1, viewMode === 'edit' ? editForm.right_eye_k2 : record?.right_eye_k2)) }}
                </template>
                <template v-else>{{ formatValue(calculateCriticalPoint(record?.right_eye_k1, record?.right_eye_k2)) }}</template>
              </td>
              <td class="cell-computed">
                <template v-if="viewMode === 'edit'">
                  {{ formatValue(calculateCriticalPoint(viewMode === 'edit' ? editForm.left_eye_k1 : record?.left_eye_k1, viewMode === 'edit' ? editForm.left_eye_k2 : record?.left_eye_k2)) }}
                </template>
                <template v-else>{{ formatValue(calculateCriticalPoint(record?.left_eye_k1, record?.left_eye_k2)) }}</template>
              </td>
              <td class="unit-cell">mm</td>
            </tr>
            <tr>
              <td class="item-label">角膜厚度</td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_cct" :min="0" :precision="0" style="width: 100%" />
                </template>
                <template v-else>{{ formatCctValue(record?.right_cct) }}</template>
              </td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_cct" :min="0" :precision="0" style="width: 100%" />
                </template>
                <template v-else>{{ formatCctValue(record?.left_cct) }}</template>
              </td>
              <td class="unit-cell">μm</td>
            </tr>
            <tr>
              <td class="item-label">前房深度</td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_anterior_chamber_depth" :min="0" :precision="2" :step="0.01" style="width: 100%" />
                </template>
                <template v-else>{{ formatValue(record?.right_anterior_chamber_depth) }}</template>
              </td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_anterior_chamber_depth" :min="0" :precision="2" :step="0.01" style="width: 100%" />
                </template>
                <template v-else>{{ formatValue(record?.left_anterior_chamber_depth) }}</template>
              </td>
              <td class="unit-cell">mm</td>
            </tr>
            <tr>
              <td class="item-label">晶体厚度</td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_lens_thickness" :min="0" :precision="2" :step="0.01" style="width: 100%" />
                </template>
                <template v-else>{{ formatValue(record?.right_lens_thickness) }}</template>
              </td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_lens_thickness" :min="0" :precision="2" :step="0.01" style="width: 100%" />
                </template>
                <template v-else>{{ formatValue(record?.left_lens_thickness) }}</template>
              </td>
              <td class="unit-cell">mm</td>
            </tr>
            <tr>
              <td class="item-label">玻璃体长度</td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_vitreous_space_thickness" :min="0" :precision="2" :step="0.01" style="width: 100%" />
                </template>
                <template v-else>{{ formatValue(record?.right_vitreous_space_thickness) }}</template>
              </td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_vitreous_space_thickness" :min="0" :precision="2" :step="0.01" style="width: 100%" />
                </template>
                <template v-else>{{ formatValue(record?.left_vitreous_space_thickness) }}</template>
              </td>
              <td class="unit-cell">mm</td>
            </tr>
            <tr v-if="viewMode !== 'view' || hasChoroidThickness">
              <td class="item-label">脉络膜厚度</td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.right_oct_fovea" :min="0" :precision="0" style="width: 100%" />
                </template>
                <template v-else>{{ formatValue(record?.right_oct_fovea) }}</template>
              </td>
              <td>
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-bind="nonNegativeInputNumberBind" v-model:value="editForm.left_oct_fovea" :min="0" :precision="0" style="width: 100%" />
                </template>
                <template v-else>{{ formatValue(record?.left_oct_fovea) }}</template>
              </td>
              <td class="unit-cell">μm</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { UpOutlined, DownOutlined } from '@ant-design/icons-vue';
import { nonNegativeInputNumberBind } from '@/utils/nonNegativeNumberInput.js';

const props = defineProps({
  record: {
    type: Object,
    default: () => ({})
  },
  viewMode: {
    type: String,
    default: 'view' // 'view', 'edit', 'print'
  },
  sectionExpanded: {
    type: Object,
    default: () => ({})
  },
  isReportMode: {
    type: Boolean,
    default: false
  },
  enableCollapse: {
    type: Boolean,
    default: false
  },
  reportLayout: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle-section', 'update-record']);

// 切换section展开/收起状态
const handleToggleSection = (sectionKey) => {
  emit('toggle-section', sectionKey);
};

// 编辑表单数据
const editForm = ref({});
let isUpdatingFromRecord = false; // 标志：是否正在从record同步到editForm

/** 眼轴长度不允许为负：非法值置为 null，避免入库或展示负数 */
const coerceNonNegativeAxial = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return n < 0 ? null : n;
};

const sanitizeAxialFieldsInPlace = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  obj.right_eye_axial_length = coerceNonNegativeAxial(obj.right_eye_axial_length);
  obj.left_eye_axial_length = coerceNonNegativeAxial(obj.left_eye_axial_length);
};

// 监听record变化，同步到editForm
watch(() => props.record, (newVal) => {
  if (newVal && props.viewMode === 'edit') {
    isUpdatingFromRecord = true; // 设置标志，防止触发update-record
    const copy = JSON.parse(JSON.stringify(newVal));
    sanitizeAxialFieldsInPlace(copy);
    editForm.value = copy;
    console.log('[BiometryExamStyleTwo] record变化，已同步到editForm:', editForm.value);
    // 使用nextTick确保标志在watch执行后重置
    nextTick(() => {
      isUpdatingFromRecord = false;
    });
  }
}, { immediate: true, deep: true });

// 监听viewMode变化，进入编辑模式时重新同步数据
watch(() => props.viewMode, (newMode) => {
  if (newMode === 'edit' && props.record) {
    isUpdatingFromRecord = true; // 设置标志，防止触发update-record
    const copy = JSON.parse(JSON.stringify(props.record));
    sanitizeAxialFieldsInPlace(copy);
    editForm.value = copy;
    console.log('[BiometryExamStyleTwo] 进入编辑模式，已同步数据到editForm:', editForm.value);
    nextTick(() => {
      isUpdatingFromRecord = false;
    });
  }
});

// 监听editForm变化，通知父组件更新
watch(() => editForm.value, (newVal) => {
  if (props.viewMode === 'edit' && !isUpdatingFromRecord) {
    emit('update-record', newVal);
  }
}, { deep: true });

// 判断字段是否有值（包括0值）
const hasFieldValue = (value) => {
  return value !== null && value !== undefined && value !== '';
};

// 判断生物测量仪检查是否有数据
const hasBiometryData = computed(() => {
  const record = props.record;
  if (!record) return false;
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
});

// 格式化值，空值显示"-"
const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  // 如果是数字，保留2位小数
  if (typeof value === 'number') {
    if (value < 0) return '-';
    return value.toFixed(2);
  }
  // 如果是字符串，尝试转换为数字
  const num = parseFloat(value);
  if (!isNaN(num)) {
    if (num < 0) return '-';
    return num.toFixed(2);
  }
  return value;
};

/** 角膜厚度（μm）为整数 */
const formatCctValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num) || num < 0) return '-';
  return String(Math.round(num));
};

// 计算ΔK（K1和K2的差值）
const calculateDeltaK = (k1, k2) => {
  if (!k1 || !k2) return null;
  return Math.abs(Number(k1) - Number(k2));
};

// 计算avK（K1和K2的平均值）
const calculateAvgK = (k1, k2) => {
  if (!k1 || !k2) return null;
  return (Number(k1) + Number(k2)) / 2;
};

// 计算轴率比（眼轴长度/角膜曲率半径）
const calculateAxialRatio = (axialLength, k1, k2) => {
  if (!axialLength || !k1 || !k2) return null;
  // 角膜曲率半径 = 337.5 / 平均K值
  const avgK = (Number(k1) + Number(k2)) / 2;
  const radius = 337.5 / avgK;
  return Number(axialLength) / radius;
};

// 计算参考临界值
const calculateCriticalPoint = (k1, k2) => {
  if (!k1 || !k2) return null;
  const avgK = (Number(k1) + Number(k2)) / 2;
  
  // 根据平均K值分情况计算
  if (avgK > 43) {
    // 平均K > 43: 临界值 = 23.5 - (平均K - 43) / 3
    return 23.5 - (avgK - 43) / 3;
  } else {
    // 平均K ≤ 43: 临界值 = 23.5 - (平均K - 43) / 2.5
    return 23.5 - (avgK - 43) / 2.5;
  }
};

// 检查是否有脉络膜厚度数据
const hasChoroidThickness = computed(() => {
  return props.record?.right_oct_fovea || props.record?.left_oct_fovea;
});
</script>

<style scoped lang="scss">
.biometry-exam-style-two {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  
  // 报告模式下（没有标题）优化间距
  &:not(:has(.section-title)) {
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 12px;
  }
  
  // 收缩状态缩小间距（优先级最高）
  &.collapsed {
    margin-bottom: 2px !important;
    padding-bottom: 0 !important;
    gap: 0 !important;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #f0f2f5;
  }
}

.section-title {
  font-size: 18px; // 从16px放大到18px
  font-weight: 600;
  color: #224b96;
  margin: 0;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  position: relative;
  background: linear-gradient(135deg, rgba(34, 75, 150, 0.08) 0%, rgba(234, 240, 255, 0.6) 100%);
  border-radius: 8px;
  border-left: 4px solid #224b96;
  
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
  
  &.clickable {
    cursor: pointer;
    user-select: none;
    
    &:hover {
      background: linear-gradient(135deg, rgba(34, 75, 150, 0.12) 0%, rgba(234, 240, 255, 0.8) 100%);
      border-left-color: #4a7bc8;
      &::before {
        width: 100%;
      }
      color: #224b96;
    }
  }
}

.section-toggle-icon {
  margin-left: auto;
  color: #666;
  font-size: 14px;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 14px;
}

/* 编辑/列表用宽表；报告式带 .exam-sheet 由全局 exam-sheet.css */
.biometry-table:not(.exam-sheet) {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;
  border-radius: 8px;
  overflow: hidden;

  thead {
    background: linear-gradient(180deg, rgba(34, 75, 150, 0.12) 0%, rgba(34, 75, 150, 0.08) 100%);
  }

  th {
    padding: 10px 12px;
    text-align: center;
    font-weight: 600;
    color: #224b96;
    border: 1px solid rgba(34, 75, 150, 0.15);
    border-bottom: 2px solid rgba(34, 75, 150, 0.15);
    line-height: 1.3;
  }

  tbody tr {
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(34, 75, 150, 0.04) !important;
    }
  }

  td {
    padding: 10px 12px;
    text-align: center;
    color: #333;
    border: 1px solid #f0f2f5;
    border-top: none;
    line-height: 1.3;
  }

  tbody tr:nth-child(even) {
    background: #ffffff;
  }

  tbody tr:nth-child(odd) {
    background: #fafbff;
  }
}

.item-label {
  background: #fafbff;
  font-weight: 500;
  color: #666;
  text-align: left;
  padding-left: 4mm;
}

.unit-cell {
  color: #888;
  font-size: 13px; // 调整为与检查数据字体大小一致（从10px改为13px）
}

/* 非报告紧凑表保留原样；报告式 .exam-sheet 由全局 exam-sheet.css 统一 */
.biometry-report-by-eye:not(.exam-sheet) {
  table-layout: fixed;
  font-size: 10px;
  line-height: 1.1;

  th,
  td {
    border: 1px solid #b0d4e8;
    padding: 2px 2px;
  }

  thead th {
    background: #f0f9fd;
    font-weight: 600;
    font-size: 9px;
    padding: 2px 2px;
    line-height: 1.15;
  }

  thead th.report-section-side-title {
    background: #cceaf5;
    color: #2a3542;
    font-weight: 600;
    font-size: 11px;
    writing-mode: vertical-rl;
    text-orientation: upright;
    letter-spacing: 0.14em;
    border-color: #b0d4e8;
    border-right-color: #b0d4e8;
    width: 26px;
    min-width: 26px;
    max-width: 30px;
    padding: 4px 3px;
    vertical-align: middle;
  }

  tbody td {
    font-size: 10px;
    line-height: 1.1;
  }
}

/* 轴率比行「参考值 ≤3.0」：阈值略小于单位列正文字号 */
.biometry-ref-inline .biometry-ref-threshold {
  font-size: max(8px, calc(var(--exr-font-body, 11px) - 2px));
}
</style>

