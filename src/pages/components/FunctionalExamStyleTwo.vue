<template>
  <div class="functional-exam-style-two">
    <!-- 眼位和聚散检查 -->
    <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasEyePositionData || (reportLayout && hasACACAData)"
         v-show="!showOnlySection || showOnlySection === 'functional' || showOnlySection === 'functional-core'"
         class="section-block"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.['eye-position'] }">
      <h3 
        v-if="!reportLayout && (viewMode === 'view' || !isReportMode)"
        class="section-title"
        :class="{ 'clickable': enableCollapse }"
        @click="enableCollapse && handleToggleSection('eye-position')"
      >
        眼位和聚散检查
        <span v-if="enableCollapse" class="section-toggle-icon">
          <UpOutlined v-if="sectionExpanded?.['eye-position']" />
          <DownOutlined v-else />
        </span>
      </h3>
      <div v-show="viewMode === 'print' || (enableCollapse ? sectionExpanded?.['eye-position'] : true)">
      <table v-if="reportLayout" class="exam-sheet exam-table-binocular">
        <colgroup>
          <col class="binocol-side" />
          <col class="binocol-distance" />
          <col class="binocol-phoria-h" />
          <col class="binocol-tight" span="6" />
          <col class="binocol-phoria-v" />
          <col class="binocol-tight" span="4" />
        </colgroup>
        <tbody>
          <tr class="func-report-row-tall">
            <th class="side-title" rowspan="5">
              <span class="report-section-side-title-text">眼位和聚散检查</span>
            </th>
            <th class="group-head group-head-nowrap" rowspan="2">检测距离</th>
            <th class="group-head group-head-nowrap" rowspan="2">水平眼位/△（内/外）</th>
            <th class="group-head" colspan="3">集合</th>
            <th class="group-head" colspan="3">散开</th>
            <th class="group-head group-head-nowrap" rowspan="2">垂直眼位/△（高位）</th>
            <th class="group-head" colspan="2">集合</th>
            <th class="group-head" colspan="2">散开</th>
          </tr>
          <tr class="func-report-row-tall">
            <th class="sub-head">模糊点</th>
            <th class="sub-head">破裂点</th>
            <th class="sub-head">恢复点</th>
            <th class="sub-head">模糊点</th>
            <th class="sub-head">破裂点</th>
            <th class="sub-head">恢复点</th>
            <th class="sub-head">模糊点</th>
            <th class="sub-head">破裂点</th>
            <th class="sub-head">模糊点</th>
            <th class="sub-head">破裂点</th>
          </tr>
          <tr class="func-report-row-tall">
            <th class="eye-cell eye-name">5m</th>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <div class="binocular-cell-edit">
                    <div class="binocular-dir-row">
                      <div class="binocular-dir-btns binocular-dir-btns--horizontal">
                        <a-button size="small" class="binocular-dir-tap" :type="farEyeDirection === '外' ? 'primary' : 'default'" @click="toggleFarEyeDirection('外')">外</a-button>
                        <a-button size="small" class="binocular-dir-tap" :type="farEyeDirection === '内' ? 'primary' : 'default'" @click="toggleFarEyeDirection('内')">内</a-button>
                      </div>
                    </div>
                    <a-input-number
                      :key="'far-lat-phoria'"
                      v-model:value="farEyeValue"
                      class="cell-number prism-phoria-placeholder"
                      :precision="2"
                      :step="0.25"
                      style="width: 52px"
                      placeholder="填0为正位"
                    />
                  </div>
                </template>
                <template v-else><span v-html="formatEyePositionWithUnit(record?.pli_exo_distance_lateral_phoria, record?.plo_eso_distance_lateral_phoria)"></span></template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_convergence_distance_blur" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_convergence_distance_blur, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_convergence_distance_break" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_convergence_distance_break, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_convergence_distance_recovery" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_convergence_distance_recovery, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_disvergence_distance_blur" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_disvergence_distance_blur, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_disvergence_distance_break" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_disvergence_distance_break, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_disvergence_distance_recovery" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_disvergence_distance_recovery, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <div class="binocular-cell-edit">
                    <div class="binocular-dir-row">
                      <div class="binocular-dir-btns binocular-dir-btns--horizontal">
                        <a-button size="small" class="binocular-dir-tap" :type="farVerticalEyeDirection === '右' ? 'primary' : 'default'" @click="toggleFarVerticalEyeDirection('右')">右</a-button>
                        <a-button size="small" class="binocular-dir-tap" :type="farVerticalEyeDirection === '左' ? 'primary' : 'default'" @click="toggleFarVerticalEyeDirection('左')">左</a-button>
                      </div>
                    </div>
                    <a-input-number
                      :key="'far-ver-phoria'"
                      v-model:value="farVerticalEyeBreak"
                      class="cell-number prism-phoria-placeholder"
                      :precision="2"
                      :step="0.25"
                      style="width: 52px"
                      placeholder="填0为正位"
                    />
                  </div>
                </template>
                <template v-else>
                  <span>{{ formatVerticalEyePosition(record?.vertical_eye_position_far || record?.fusional_convergence_distance_vertical_direction || record?.far_vertical_eye_direction || null, record?.vertical_eye_position_far_value || record?.far_vertical_eye_break) }}</span>
                </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_vertical_up_distance_blur" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_vertical_up_distance_blur, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_vertical_up_distance_break" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_vertical_up_distance_break || record?.fusional_convergence_distance_vertical_break, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_vertical_down_distance_blur" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_vertical_down_distance_blur, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_vertical_down_distance_break" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_vertical_down_distance_break || record?.fusional_disvergence_distance_vertical_break, true) }}</template>
              </div>
            </td>
          </tr>
          <tr class="func-report-row-tall">
            <th class="eye-cell eye-name">40cm</th>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <div class="binocular-cell-edit">
                    <div class="binocular-dir-row">
                      <div class="binocular-dir-btns binocular-dir-btns--horizontal">
                        <a-button size="small" class="binocular-dir-tap" :type="nearEyeDirection === '外' ? 'primary' : 'default'" @click="toggleNearEyeDirection('外')">外</a-button>
                        <a-button size="small" class="binocular-dir-tap" :type="nearEyeDirection === '内' ? 'primary' : 'default'" @click="toggleNearEyeDirection('内')">内</a-button>
                      </div>
                    </div>
                    <a-input-number
                      :key="'near-lat-phoria'"
                      v-model:value="nearEyeValue"
                      class="cell-number prism-phoria-placeholder"
                      :precision="2"
                      :step="0.25"
                      style="width: 52px"
                      placeholder="填0为正位"
                    />
                  </div>
                </template>
                <template v-else><span v-html="formatEyePositionWithUnit(record?.pli_exo_near_lateral_phoria, record?.plo_eso_near_lateral_phoria)"></span></template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_convergence_near_blur" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_convergence_near_blur, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_convergence_near_break" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_convergence_near_break, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_convergence_near_recovery" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_convergence_near_recovery, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_disvergence_near_blur" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_disvergence_near_blur, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_disvergence_near_break" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_disvergence_near_break, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_disvergence_near_recovery" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_disvergence_near_recovery, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <div class="binocular-cell-edit">
                    <div class="binocular-dir-row">
                      <div class="binocular-dir-btns binocular-dir-btns--horizontal">
                        <a-button size="small" class="binocular-dir-tap" :type="nearVerticalEyeDirection === '右' ? 'primary' : 'default'" @click="toggleNearVerticalEyeDirection('右')">右</a-button>
                        <a-button size="small" class="binocular-dir-tap" :type="nearVerticalEyeDirection === '左' ? 'primary' : 'default'" @click="toggleNearVerticalEyeDirection('左')">左</a-button>
                      </div>
                    </div>
                    <a-input-number
                      :key="'near-ver-phoria'"
                      v-model:value="nearVerticalEyeBreak"
                      class="cell-number prism-phoria-placeholder"
                      :precision="2"
                      :step="0.25"
                      style="width: 52px"
                      placeholder="填0为正位"
                    />
                  </div>
                </template>
                <template v-else>
                  <span>{{ formatVerticalEyePosition(record?.vertical_eye_position_near || record?.fusional_convergence_near_vertical_direction || record?.near_vertical_eye_direction || null, record?.vertical_eye_position_near_value || record?.near_vertical_eye_break) }}</span>
                </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_vertical_up_near_blur" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_vertical_up_near_blur, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_vertical_up_near_break" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_vertical_up_near_break || record?.fusional_convergence_near_vertical_break, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_vertical_down_near_blur" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_vertical_down_near_blur, true) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.fusional_vertical_down_near_break" class="cell-number" :precision="1" /></template>
                <template v-else>{{ formatValue(record?.fusional_vertical_down_near_break || record?.fusional_disvergence_near_vertical_break, true) }}</template>
              </div>
            </td>
          </tr>
          <tr>
            <td colspan="13" class="inner-table-cell">
              <table class="inner-exam-table binocular-bottom-table">
                <colgroup>
                  <col class="aca-col-gradient" />
                  <col class="aca-col-lens" span="3" />
                  <col class="aca-col-ref1" />
                  <col class="aca-col-calc" />
                  <col class="aca-col-exam" />
                  <col class="aca-col-ref2" />
                  <col class="cac-col-label" />
                  <col class="cac-col-result" />
                  <col class="cac-col-ref" />
                </colgroup>
                <tbody>
                  <tr class="func-report-row-tall">
                    <th class="group-head" colspan="8">AC/A检查(△/D)</th>
                    <th class="group-head" colspan="3">CA/C检查(D/MA)</th>
                  </tr>
                  <tr class="func-report-row-tall">
                    <th class="sub-head" rowspan="2">梯度性AC/A</th>
                    <th class="sub-head">±1.00</th>
                    <th class="sub-head">+1.00</th>
                    <th class="sub-head">-1.00</th>
                    <th class="sub-head">参考值</th>
                    <th class="sub-head aca-calculated-head" rowspan="2">
                      计算性AC/A
                    </th>
                    <th class="sub-head">检查结果</th>
                    <th class="sub-head">参考值</th>
                    <th class="sub-head" rowspan="2">CA/C</th>
                    <th class="sub-head">检查结果</th>
                    <th class="sub-head">参考值</th>
                  </tr>
                  <tr class="func-report-row-tall">
                    <td>
                      <div class="cell-field">
                        <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.ac_a_gradient_ratio_average" class="cell-number" :precision="1" :step="0.1" /></template>
                        <template v-else>{{ formatACACARatio(record?.ac_a_gradient_ratio_average) }}</template>
                      </div>
                    </td>
                    <td>
                      <div class="cell-field">
                        <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.ac_a_gradient_ratio_plus" class="cell-number" :precision="1" :step="0.1" /></template>
                        <template v-else>{{ formatACACARatio(record?.ac_a_gradient_ratio_plus) }}</template>
                      </div>
                    </td>
                    <td>
                      <div class="cell-field">
                        <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.ac_a_gradient_ratio_minus" class="cell-number" :precision="1" :step="0.1" /></template>
                        <template v-else>{{ formatACACARatio(record?.ac_a_gradient_ratio_minus) }}</template>
                      </div>
                    </td>
                    <td><div class="cell-field italic-text accommodation-ref-value">4±1</div></td>
                    <td>
                      <div class="cell-field">
                        <span class="value-display calculated-value">{{ calculatedACARatio }}</span>
                      </div>
                    </td>
                    <td><div class="cell-field accommodation-ref-value" :class="{ 'italic-text aca-ref-pd10-hint': calculatedACARatioReferenceIsFormula }">{{ calculatedACARatioReference }}</div></td>
                    <td>
                      <div class="cell-field">
                        <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.ca_c_ratio" class="cell-number" :precision="2" :step="0.01" /></template>
                        <template v-else>{{ formatACACARatio(record?.ca_c_ratio) }}</template>
                      </div>
                    </td>
                    <td><div class="cell-field italic-text accommodation-ref-value">0.3~0.6</div></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      <table v-else class="eye-position-table">
        <thead>
          <tr>
            <th rowspan="2">
              <span class="report-section-side-title-text">眼位和聚散检查</span>
            </th>
            <th rowspan="2">眼位</th>
            <th colspan="3">集合</th>
            <th colspan="3">散开</th>
          </tr>
          <tr>
            <th>模糊</th>
            <th>破裂</th>
            <th>恢复</th>
            <th>模糊</th>
            <th>破裂</th>
            <th>恢复</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>5m水平眼位/△（内/外）</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <div class="eye-position-dir-flex">
                  <div class="binocular-dir-row">
                    <div class="binocular-dir-btns binocular-dir-btns--horizontal">
                      <a-button size="small" class="binocular-dir-tap" :type="farEyeDirection === '外' ? 'primary' : 'default'" @click="toggleFarEyeDirection('外')">外</a-button>
                      <a-button size="small" class="binocular-dir-tap" :type="farEyeDirection === '内' ? 'primary' : 'default'" @click="toggleFarEyeDirection('内')">内</a-button>
                    </div>
                  </div>
                  <div class="eye-position-input-wrapper">
                    <a-input-number v-model:value="farEyeValue" class="prism-phoria-placeholder" :precision="2" :step="0.25" style="width: 80px" placeholder="填0为正位" />
                    <span class="eye-position-unit">△</span>
                  </div>
                </div>
              </template>
              <template v-else><span v-html="formatEyePositionWithUnit(record?.pli_exo_distance_lateral_phoria, record?.plo_eso_distance_lateral_phoria)"></span></template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_convergence_distance_blur" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_convergence_distance_blur, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_convergence_distance_break" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_convergence_distance_break, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_convergence_distance_recovery" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_convergence_distance_recovery, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_disvergence_distance_blur" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_disvergence_distance_blur, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_disvergence_distance_break" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_disvergence_distance_break, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_disvergence_distance_recovery" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_disvergence_distance_recovery, true) }}</template>
            </td>
          </tr>
          <tr>
            <td>40cm水平眼位/△（内/外）</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <div class="eye-position-dir-flex">
                  <div class="binocular-dir-row">
                    <div class="binocular-dir-btns binocular-dir-btns--horizontal">
                      <a-button size="small" class="binocular-dir-tap" :type="nearEyeDirection === '外' ? 'primary' : 'default'" @click="toggleNearEyeDirection('外')">外</a-button>
                      <a-button size="small" class="binocular-dir-tap" :type="nearEyeDirection === '内' ? 'primary' : 'default'" @click="toggleNearEyeDirection('内')">内</a-button>
                    </div>
                  </div>
                  <div class="eye-position-input-wrapper">
                    <a-input-number v-model:value="nearEyeValue" class="prism-phoria-placeholder" :precision="2" :step="0.25" style="width: 80px" placeholder="填0为正位" />
                    <span class="eye-position-unit">△</span>
                  </div>
                </div>
              </template>
              <template v-else><span v-html="formatEyePositionWithUnit(record?.pli_exo_near_lateral_phoria, record?.plo_eso_near_lateral_phoria)"></span></template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_convergence_near_blur" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_convergence_near_blur, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_convergence_near_break" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_convergence_near_break, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_convergence_near_recovery" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_convergence_near_recovery, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_disvergence_near_blur" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_disvergence_near_blur, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_disvergence_near_break" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_disvergence_near_break, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_disvergence_near_recovery" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_disvergence_near_recovery, true) }}</template>
            </td>
          </tr>
          <!-- 垂直眼位 - 5m -->
          <tr>
            <td>5m垂直眼位/△（高位）</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <div class="eye-position-dir-flex">
                  <div class="binocular-dir-row">
                    <div class="binocular-dir-btns binocular-dir-btns--horizontal">
                      <a-button size="small" class="binocular-dir-tap" :type="farVerticalEyeDirection === '右' ? 'primary' : 'default'" @click="toggleFarVerticalEyeDirection('右')">右</a-button>
                      <a-button size="small" class="binocular-dir-tap" :type="farVerticalEyeDirection === '左' ? 'primary' : 'default'" @click="toggleFarVerticalEyeDirection('左')">左</a-button>
                    </div>
                  </div>
                  <div class="eye-position-input-wrapper">
                    <a-input-number v-model:value="farVerticalEyeBreak" class="prism-phoria-placeholder" :precision="2" :step="0.25" style="width: 80px" placeholder="填0为正位" />
                    <span class="eye-position-unit">△</span>
                  </div>
                </div>
              </template>
              <template v-else>
                <span>{{ formatVerticalEyePosition(record?.vertical_eye_position_far || record?.fusional_convergence_distance_vertical_direction || record?.far_vertical_eye_direction || null, record?.vertical_eye_position_far_value || record?.far_vertical_eye_break) }}</span>
              </template>
            </td>
            <td></td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_vertical_up_distance_break" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_vertical_up_distance_break || record?.fusional_convergence_distance_vertical_break, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_vertical_up_distance_recovery" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_vertical_up_distance_recovery || record?.fusional_convergence_distance_vertical_recovery, true) }}</template>
            </td>
            <td></td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_vertical_down_distance_break" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_vertical_down_distance_break || record?.fusional_disvergence_distance_vertical_break, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_vertical_down_distance_recovery" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_vertical_down_distance_recovery || record?.fusional_disvergence_distance_vertical_recovery, true) }}</template>
            </td>
          </tr>
          <!-- 垂直眼位 - 40cm -->
          <tr>
            <td>40cm垂直眼位/△（高位）</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <div class="eye-position-dir-flex">
                  <div class="binocular-dir-row">
                    <div class="binocular-dir-btns binocular-dir-btns--horizontal">
                      <a-button size="small" class="binocular-dir-tap" :type="nearVerticalEyeDirection === '右' ? 'primary' : 'default'" @click="toggleNearVerticalEyeDirection('右')">右</a-button>
                      <a-button size="small" class="binocular-dir-tap" :type="nearVerticalEyeDirection === '左' ? 'primary' : 'default'" @click="toggleNearVerticalEyeDirection('左')">左</a-button>
                    </div>
                  </div>
                  <div class="eye-position-input-wrapper">
                    <a-input-number v-model:value="nearVerticalEyeBreak" class="prism-phoria-placeholder" :precision="2" :step="0.25" style="width: 80px" placeholder="填0为正位" />
                    <span class="eye-position-unit">△</span>
                  </div>
                </div>
              </template>
              <template v-else>
                <span>{{ formatVerticalEyePosition(record?.vertical_eye_position_near || record?.fusional_convergence_near_vertical_direction || record?.near_vertical_eye_direction || null, record?.vertical_eye_position_near_value || record?.near_vertical_eye_break) }}</span>
              </template>
            </td>
            <td></td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_vertical_up_near_break" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_vertical_up_near_break || record?.fusional_convergence_near_vertical_break, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_vertical_up_near_recovery" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_vertical_up_near_recovery || record?.fusional_convergence_near_vertical_recovery, true) }}</template>
            </td>
            <td></td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_vertical_down_near_break" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_vertical_down_near_break || record?.fusional_disvergence_near_vertical_break, true) }}</template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.fusional_vertical_down_near_recovery" :precision="1" style="width: 100%" />
              </template>
              <template v-else>{{ formatValue(record?.fusional_vertical_down_near_recovery || record?.fusional_disvergence_near_vertical_recovery, true) }}</template>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- AC/A和CA/C检查 -->
    <div v-if="((viewMode !== 'view' && viewMode !== 'print') || hasACACAData) && !reportLayout"
         v-show="!showOnlySection || showOnlySection === 'functional' || showOnlySection === 'functional-core'"
         class="section-block"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.['ac-aca'] }">
      <h3 
        v-if="!reportLayout && (viewMode === 'view' || !isReportMode)"
        class="section-title"
        :class="{ 'clickable': enableCollapse }"
        @click="enableCollapse && handleToggleSection('ac-aca')"
      >
        AC/A和CA/C检查
        <span v-if="enableCollapse" class="section-toggle-icon">
          <UpOutlined v-if="sectionExpanded?.['ac-aca']" />
          <DownOutlined v-else />
        </span>
      </h3>
      <div v-show="viewMode === 'print' || (enableCollapse ? sectionExpanded?.['ac-aca'] : true)">
      <!-- 报告式：与其它表一致，左侧整列竖排标题占满表高 -->
      <table v-if="reportLayout" class="aca-report-table">
        <thead>
          <tr>
            <th rowspan="4" class="report-section-side-title">
              <span class="report-section-side-title-text">AC/A和CA/C检查</span>
            </th>
            <th>项目</th>
            <th>检查结果</th>
            <th>参考值</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>计算性AC/A（△/D）</td>
            <td class="aca-report-result">
              <span class="value-display calculated-value">{{ calculatedACARatio }}</span>
            </td>
            <td :class="{ 'italic-text aca-ref-pd10-hint': calculatedACARatioReferenceIsFormula }">{{ calculatedACARatioReference }}</td>
          </tr>
          <tr>
            <td>梯度型AC/A（△/D）</td>
            <td class="aca-report-result">
              <template v-if="viewMode === 'edit'">
                <span class="input-label">+1.00：</span>
                <a-input-number v-model:value="editForm.ac_a_gradient_ratio_plus" :precision="1" :step="0.1" style="width: 100px; margin-right: 8px" placeholder="输入数值" />
                <span class="input-label">-1.00：</span>
                <a-input-number v-model:value="editForm.ac_a_gradient_ratio_minus" :precision="1" :step="0.1" style="width: 100px; margin-right: 8px" placeholder="输入数值" />
                <span class="input-label">平均AC/A：</span>
                <a-input-number v-model:value="editForm.ac_a_gradient_ratio_average" :precision="1" :step="0.1" style="width: 100px" placeholder="输入数值" />
              </template>
              <template v-else>
                <span class="input-label">+1.00：</span>
                <span class="value-display">{{ formatACACARatio(record?.ac_a_gradient_ratio_plus) }}</span>
                <span class="input-label">-1.00：</span>
                <span class="value-display">{{ formatACACARatio(record?.ac_a_gradient_ratio_minus) }}</span>
                <span class="input-label">平均AC/A：</span>
                <span class="value-display">{{ formatACACARatio(record?.ac_a_gradient_ratio_average) }}</span>
              </template>
            </td>
            <td>3~5△/D</td>
          </tr>
          <tr>
            <td>CA/C（D/MA）</td>
            <td class="aca-report-result">
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.ca_c_ratio" :precision="2" :step="0.01" style="width: 100px" placeholder="输入数值" />
              </template>
              <template v-else>
                <span class="value-display">{{ formatACACARatio(record?.ca_c_ratio) }}</span>
              </template>
            </td>
            <td>0.3~0.6D/MA</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="func-exam-col">
        <div class="func-exam-col-bg">
          <div class="func-table-header">
            <div class="func-table-col item">AC/A和CA/C检查</div>
            <div class="func-table-col result">检查结果</div>
            <div class="func-table-col reference">参考值</div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">计算性AC/A（△/D）</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <span class="value-display calculated-value">{{ calculatedACARatio }}</span>
              </template>
              <template v-else>
                <span class="value-display calculated-value">{{ calculatedACARatio }}</span>
              </template>
            </div>
            <div class="func-table-col reference" :class="{ 'aca-ref-pd10-hint': calculatedACARatioReferenceIsFormula }">{{ calculatedACARatioReference }}</div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">梯度型AC/A（△/D）</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <span class="input-label">+1.00：</span>
                <a-input-number v-model:value="editForm.ac_a_gradient_ratio_plus" :precision="1" :step="0.1" style="width: 100px; margin-right: 8px" placeholder="输入数值" />
                <span class="input-label">-1.00：</span>
                <a-input-number v-model:value="editForm.ac_a_gradient_ratio_minus" :precision="1" :step="0.1" style="width: 100px; margin-right: 8px" placeholder="输入数值" />
                <span class="input-label">平均AC/A：</span>
                <a-input-number v-model:value="editForm.ac_a_gradient_ratio_average" :precision="1" :step="0.1" style="width: 100px" placeholder="输入数值" />
              </template>
              <template v-else>
                <span class="input-label">+1.00：</span>
                <span class="value-display">{{ formatACACARatio(record?.ac_a_gradient_ratio_plus) }}</span>
                <span class="input-label">-1.00：</span>
                <span class="value-display">{{ formatACACARatio(record?.ac_a_gradient_ratio_minus) }}</span>
                <span class="input-label">平均AC/A：</span>
                <span class="value-display">{{ formatACACARatio(record?.ac_a_gradient_ratio_average) }}</span>
              </template>
            </div>
            <div class="func-table-col reference">3~5△/D</div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">CA/C（D/MA）</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.ca_c_ratio" :precision="2" :step="0.01" style="width: 100px" placeholder="输入数值" />
              </template>
              <template v-else>
                <span class="value-display">{{ formatACACARatio(record?.ca_c_ratio) }}</span>
              </template>
            </div>
            <div class="func-table-col reference">0.3~0.6D/MA</div>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- 调节检查 -->
    <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasAccommodationData" 
         v-show="!showOnlySection || showOnlySection === 'functional' || showOnlySection === 'functional-core'"
         class="section-block"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.accommodation }">
      <h3 
        v-if="!reportLayout && (viewMode === 'view' || !isReportMode)"
        class="section-title"
        :class="{ 'clickable': enableCollapse }"
        @click="enableCollapse && handleToggleSection('accommodation')"
      >
        调节检查
        <span v-if="enableCollapse" class="section-toggle-icon">
          <UpOutlined v-if="sectionExpanded?.accommodation" />
          <DownOutlined v-else />
        </span>
      </h3>
      <div v-show="viewMode === 'print' || (enableCollapse ? sectionExpanded?.accommodation : true)">
      <!-- 报告式：顶部 NRA/PRA + 下部眼别×灵敏度/反应/幅度（侧栏 rowspan 与下方 10 列对齐） -->
      <table v-if="reportLayout" class="exam-sheet exam-table-accommodation">
        <colgroup>
          <col class="acc-col-side" />
          <col class="acc-col-eye" />
          <col class="acc-col-sens-result" />
          <col class="acc-col-sens-pass" />
          <col class="acc-col-sens-ref" />
          <col class="acc-col-sens-param" />
          <col class="acc-col-react-result" />
          <col class="acc-col-react-ref" />
          <col class="acc-col-amp-result" />
          <col class="acc-col-amp-ref" />
          <col class="acc-col-amp-style" />
        </colgroup>
        <tbody>
          <tr>
            <th class="side-title" rowspan="8">
              <span class="report-section-side-title-text">调节检查</span>
            </th>
            <td colspan="10" class="inner-table-cell accommodation-top-block">
              <table class="inner-exam-table accommodation-nra-pra-inner">
                <tbody>
                  <tr class="func-report-row-tall">
                    <th class="group-head" colspan="3">正相对调节NRA</th>
                    <th class="group-head" colspan="3">负相对调节PRA</th>
                  </tr>
                  <tr class="func-report-row-tall">
                    <th class="sub-head">模糊值</th>
                    <th class="sub-head">恢复值</th>
                    <th class="sub-head">参考值</th>
                    <th class="sub-head">模糊值</th>
                    <th class="sub-head">恢复值</th>
                    <th class="sub-head">参考值</th>
                  </tr>
                  <tr class="func-report-row-tall">
                    <td>
                      <div class="cell-field">
                        <template v-if="viewMode === 'edit'">
                          <div class="accommodation-input-wrapper positive">
                            <span class="accommodation-sign">+</span>
                            <a-input-number v-model:value="negativeRelativeAccommodationBlur" class="cell-number" :precision="2" :min="0" :step="0.01" style="width: 44px" />
                          </div>
                        </template>
                        <template v-else>{{ formatRelativeAccommodation(record?.negative_relative_accommodation_blur) }}</template>
                      </div>
                    </td>
                    <td>
                      <div class="cell-field">
                        <template v-if="viewMode === 'edit'">
                          <div class="accommodation-input-wrapper positive">
                            <span class="accommodation-sign">+</span>
                            <a-input-number v-model:value="negativeRelativeAccommodationRecovery" class="cell-number" :precision="2" :min="0" :step="0.01" style="width: 44px" />
                          </div>
                        </template>
                        <template v-else>{{ formatRelativeAccommodation(record?.negative_relative_accommodation_recovery) }}</template>
                      </div>
                    </td>
                    <td><div class="cell-field accommodation-ref-value">+2.25D±0.25D</div></td>
                    <td>
                      <div class="cell-field">
                        <template v-if="viewMode === 'edit'">
                          <div class="accommodation-input-wrapper negative">
                            <span class="accommodation-sign">-</span>
                            <a-input-number v-model:value="positiveRelativeAccommodationBlur" class="cell-number" :precision="2" :min="0" :step="0.01" style="width: 44px" />
                          </div>
                        </template>
                        <template v-else>{{ formatRelativeAccommodation(record?.positive_relative_accommodation_blur) }}</template>
                      </div>
                    </td>
                    <td>
                      <div class="cell-field">
                        <template v-if="viewMode === 'edit'">
                          <div class="accommodation-input-wrapper negative">
                            <span class="accommodation-sign">-</span>
                            <a-input-number v-model:value="positiveRelativeAccommodationRecovery" class="cell-number" :precision="2" :min="0" :step="0.01" style="width: 44px" />
                          </div>
                        </template>
                        <template v-else>{{ formatRelativeAccommodation(record?.positive_relative_accommodation_recovery) }}</template>
                      </div>
                    </td>
                    <td><div class="cell-field accommodation-pra-ref"><span>-2.25D</span><span class="accommodation-pra-ref-up">↑</span></div></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr class="func-report-row-tall">
            <th class="row-head" rowspan="2">眼别</th>
            <th class="group-head" colspan="4">调节灵敏度</th>
            <th class="group-head" colspan="2">调节反应</th>
            <th class="group-head" colspan="3">调节幅度</th>
          </tr>
          <tr class="func-report-row-tall">
            <th class="sub-head">检查结果</th>
            <th class="sub-head">通过情况</th>
            <th class="sub-head">参考值</th>
            <th class="sub-head">检查参数</th>
            <th class="sub-head">检查结果</th>
            <th class="sub-head">参考值</th>
            <th class="sub-head">检查结果</th>
            <th class="sub-head">参考值</th>
            <th class="sub-head">检查方式</th>
          </tr>
          <tr class="func-report-row-tall">
            <th class="eye-cell eye-name">右眼</th>
            <td>
              <div class="cell-field accommodation-sensitivity-result-cell">
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-model:value="accommodationSensitivityRight" class="cell-number" :min="0" :precision="0" />
                  <span class="accommodation-cpm-suffix">cpm</span>
                </template>
                <template v-else>{{ formatAccommodationSensitivityCpmDisplay(record?.accommodation_sensitivity_right_value || record?.accommodation_sensitivity_right) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field accommodation-pass-cell">
                <template v-if="viewMode === 'edit'">
                  <div class="accommodation-pass-btns">
                    <button
                      v-for="sym in accommodationPassSymbols"
                      :key="'r-pass-' + sym"
                      type="button"
                      class="accommodation-pass-btn"
                      :class="{ active: getAccommodationSensitivityPass('right') === sym }"
                      @click="toggleAccommodationSensitivityPass('right', sym)"
                    >{{ sym }}</button>
                  </div>
                </template>
                <template v-else>{{ formatAccommodationPassDisplay(record?.accommodation_sensitivity_pass_right) }}</template>
              </div>
            </td>
            <td><div class="cell-field accommodation-ref-value">11cpm</div></td>
            <td rowspan="3">
              <div class="cell-field cell-field-column">
                <template v-if="viewMode === 'edit'">
                  <div class="accommodation-param-btns">
                    <div class="accommodation-param-cols">
                      <div class="accommodation-param-col">
                        <div class="accommodation-param-col-title">检查光度</div>
                        <button
                          v-for="opt in accommodationSensitivityLensOptions"
                          :key="'l-' + opt"
                          type="button"
                          class="accommodation-param-choice"
                          :class="{ 'is-active': accommodationSensitivityDiopter === opt }"
                          @click="setAccommodationSensitivityLens(opt)"
                        >
                          <span class="accommodation-param-dot" aria-hidden="true"></span>
                          <span class="accommodation-param-label">{{ opt }}</span>
                        </button>
                      </div>
                      <div class="accommodation-param-col">
                        <div class="accommodation-param-col-title">检查视标</div>
                        <button
                          v-for="opt in accommodationSensitivityVisionOptions"
                          :key="'v-' + opt"
                          type="button"
                          class="accommodation-param-choice"
                          :class="{ 'is-active': accommodationSensitivityVision === opt }"
                          @click="setAccommodationSensitivityVision(opt)"
                        >
                          <span class="accommodation-param-dot" aria-hidden="true"></span>
                          <span class="accommodation-param-label">{{ opt }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="accommodation-param-view-stack">
                    <div class="accommodation-param-view-line">检查光度：{{ (record?.accommodation_sensitivity_lens_power || record?.accommodation_sensitivity_diopter) || '±2.00D' }}</div>
                    <div class="accommodation-param-view-line">检查视标：{{ (record?.accommodation_sensitivity_target || record?.accommodation_sensitivity_vision) || '20/30' }}</div>
                  </div>
                </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-input v-model:value="editForm.accommodation_mem_right_text" class="cell-number" style="width: 72px" allow-clear @blur="syncReactionNumericFromText('right')" />
                </template>
                <template v-else>{{ displayReaction(record, 'right') }}</template>
              </div>
            </td>
            <td><div class="cell-field accommodation-ref-value">+0.50D±0.25D</div></td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-model:value="editForm.accommodative_amplitude_right" class="cell-number" :precision="2" :min="0" :step="0.01" />
                </template>
                <template v-else>{{ formatAmplitudeValue(record?.accommodative_amplitude_right) }}</template>
              </div>
            </td>
            <td><div class="cell-field accommodation-ref-value">{{ getAmplitudeReference() }}</div></td>
            <td>
              <div class="cell-field cell-field--amplitude-style">
                <template v-if="viewMode === 'edit'">
                  <div class="accommodation-pass-btns accommodation-amplitude-style-btns">
                    <button
                      v-for="opt in accommodationAmplitudeStyleOptions"
                      :key="'amp-style-r-' + opt"
                      type="button"
                      class="accommodation-pass-btn accommodation-amplitude-style-btn"
                      :class="{ active: editForm.accommodation_amplitude_style === opt }"
                      @click="toggleAccommodationAmplitudeStyle(opt)"
                    >{{ opt }}</button>
                  </div>
                </template>
                <template v-else>{{ formatAmplitudeStyle(record?.accommodation_amplitude_style) }}</template>
              </div>
            </td>
          </tr>
          <tr class="func-report-row-tall">
            <th class="eye-cell eye-name">左眼</th>
            <td>
              <div class="cell-field accommodation-sensitivity-result-cell">
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-model:value="accommodationSensitivityLeft" class="cell-number" :min="0" :precision="0" />
                  <span class="accommodation-cpm-suffix">cpm</span>
                </template>
                <template v-else>{{ formatAccommodationSensitivityCpmDisplay(record?.accommodation_sensitivity_left_value || record?.accommodation_sensitivity_left) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field accommodation-pass-cell">
                <template v-if="viewMode === 'edit'">
                  <div class="accommodation-pass-btns">
                    <button
                      v-for="sym in accommodationPassSymbols"
                      :key="'l-pass-' + sym"
                      type="button"
                      class="accommodation-pass-btn"
                      :class="{ active: getAccommodationSensitivityPass('left') === sym }"
                      @click="toggleAccommodationSensitivityPass('left', sym)"
                    >{{ sym }}</button>
                  </div>
                </template>
                <template v-else>{{ formatAccommodationPassDisplay(record?.accommodation_sensitivity_pass_left) }}</template>
              </div>
            </td>
            <td><div class="cell-field accommodation-ref-value">11cpm</div></td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-input v-model:value="editForm.accommodation_mem_left_text" class="cell-number" style="width: 72px" allow-clear @blur="syncReactionNumericFromText('left')" />
                </template>
                <template v-else>{{ displayReaction(record, 'left') }}</template>
              </div>
            </td>
            <td><div class="cell-field accommodation-ref-value">+0.50D±0.25D</div></td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-model:value="editForm.accommodative_amplitude_left" class="cell-number" :precision="2" :min="0" :step="0.01" />
                </template>
                <template v-else>{{ formatAmplitudeValue(record?.accommodative_amplitude_left) }}</template>
              </div>
            </td>
            <td><div class="cell-field accommodation-ref-value">{{ getAmplitudeReference() }}</div></td>
            <td>
              <div class="cell-field cell-field--amplitude-style">
                <template v-if="viewMode === 'edit'">
                  <div class="accommodation-pass-btns accommodation-amplitude-style-btns">
                    <button
                      v-for="opt in accommodationAmplitudeStyleOptions"
                      :key="'amp-style-l-' + opt"
                      type="button"
                      class="accommodation-pass-btn accommodation-amplitude-style-btn"
                      :class="{ active: editForm.accommodation_amplitude_style === opt }"
                      @click="toggleAccommodationAmplitudeStyle(opt)"
                    >{{ opt }}</button>
                  </div>
                </template>
                <template v-else>{{ formatAmplitudeStyle(record?.accommodation_amplitude_style) }}</template>
              </div>
            </td>
          </tr>
          <tr class="func-report-row-tall">
            <th class="eye-cell eye-name">双眼</th>
            <td>
              <div class="cell-field accommodation-sensitivity-result-cell">
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-model:value="accommodationSensitivityBoth" class="cell-number" :min="0" :precision="0" />
                  <span class="accommodation-cpm-suffix">cpm</span>
                </template>
                <template v-else>{{ formatAccommodationSensitivityCpmDisplay(record?.accommodation_sensitivity_both_value || record?.accommodation_sensitivity_both) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field accommodation-pass-cell">
                <template v-if="viewMode === 'edit'">
                  <div class="accommodation-pass-btns">
                    <button
                      v-for="sym in accommodationPassSymbols"
                      :key="'b-pass-' + sym"
                      type="button"
                      class="accommodation-pass-btn"
                      :class="{ active: getAccommodationSensitivityPass('both') === sym }"
                      @click="toggleAccommodationSensitivityPass('both', sym)"
                    >{{ sym }}</button>
                  </div>
                </template>
                <template v-else>{{ formatAccommodationPassDisplay(record?.accommodation_sensitivity_pass_both) }}</template>
              </div>
            </td>
            <td><div class="cell-field accommodation-ref-value">8cpm</div></td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-input v-model:value="editForm.accommodation_mem_bcc_text" class="cell-number" style="width: 72px" allow-clear @blur="syncReactionNumericFromText('both')" />
                </template>
                <template v-else>{{ displayReaction(record, 'both') }}</template>
              </div>
            </td>
            <td><div class="cell-field accommodation-ref-value">+0.50D±0.25D</div></td>
            <td colspan="3" class="accommodation-amplitude-both-merged">
              <div class="cell-field accommodation-amplitude-both-merged-inner">
                <span class="accommodation-amplitude-both-placeholder">—</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="func-exam-col">
        <div class="func-exam-col-bg">
          <div class="func-table-header">
            <div class="func-table-col item">调节检查</div>
            <div class="func-table-col result">检查结果</div>
            <div class="func-table-col pass-col">通过情况</div>
            <div class="func-table-col reference">参考值</div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">正相对调节（D）</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <span class="input-label">模糊点：</span>
                <div class="accommodation-input-wrapper negative">
                  <span class="accommodation-sign">-</span>
                  <a-input-number v-model:value="positiveRelativeAccommodationBlur" :precision="2" :min="0" :step="0.01" style="width: 80px; margin-right: 8px" />
                </div>
                <span class="input-label">恢复点：</span>
                <div class="accommodation-input-wrapper negative">
                  <span class="accommodation-sign">-</span>
                  <a-input-number v-model:value="positiveRelativeAccommodationRecovery" :precision="2" :min="0" :step="0.01" style="width: 80px" />
                </div>
              </template>
              <template v-else>
                <span class="input-label">模糊点：</span>
                <span class="value-display">{{ formatRelativeAccommodation(record?.positive_relative_accommodation_blur) }}</span>
                <span class="input-label">恢复点：</span>
                <span class="value-display">{{ formatRelativeAccommodation(record?.positive_relative_accommodation_recovery) }}</span>
              </template>
            </div>
            <div class="func-table-col pass-col cell-pass-empty-col">—</div>
            <div class="func-table-col reference accommodation-pra-ref"><span>-2.25D</span><span class="accommodation-pra-ref-up">↑</span></div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">负相对调节（D）</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <span class="input-label">模糊点：</span>
                <div class="accommodation-input-wrapper positive">
                  <span class="accommodation-sign">+</span>
                  <a-input-number v-model:value="negativeRelativeAccommodationBlur" :precision="2" :min="0" :step="0.01" style="width: 80px; margin-right: 8px" />
                </div>
                <span class="input-label">恢复点：</span>
                <div class="accommodation-input-wrapper positive">
                  <span class="accommodation-sign">+</span>
                  <a-input-number v-model:value="negativeRelativeAccommodationRecovery" :precision="2" :min="0" :step="0.01" style="width: 80px" />
                </div>
              </template>
              <template v-else>
                <span class="input-label">模糊点：</span>
                <span class="value-display">{{ formatRelativeAccommodation(record?.negative_relative_accommodation_blur) }}</span>
                <span class="input-label">恢复点：</span>
                <span class="value-display">{{ formatRelativeAccommodation(record?.negative_relative_accommodation_recovery) }}</span>
              </template>
            </div>
            <div class="func-table-col pass-col cell-pass-empty-col">—</div>
            <div class="func-table-col reference">+2.25D±0.25D</div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">调节幅度（D）</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <span class="input-label">右眼：</span>
                <a-input-number v-model:value="editForm.accommodative_amplitude_right" :precision="2" :min="0" :step="0.01" style="width: 80px; margin-right: 8px" />
                <span class="input-label">左眼：</span>
                <a-input-number v-model:value="editForm.accommodative_amplitude_left" :precision="2" :min="0" :step="0.01" style="width: 80px; margin-right: 8px" />
                <span class="input-label">方式：</span>
                <span class="accommodation-pass-btns accommodation-amplitude-style-btns accommodation-amplitude-style-btns--inline">
                  <button
                    v-for="opt in accommodationAmplitudeStyleOptions"
                    :key="'amp-style-nl-' + opt"
                    type="button"
                    class="accommodation-pass-btn accommodation-amplitude-style-btn"
                    :class="{ active: editForm.accommodation_amplitude_style === opt }"
                    @click="toggleAccommodationAmplitudeStyle(opt)"
                  >{{ opt }}</button>
                </span>
              </template>
              <template v-else>
                <span class="input-label">右眼：</span>
                <span class="value-display">{{ formatAmplitudeValue(record?.accommodative_amplitude_right) }}</span>
                <span class="input-label">左眼：</span>
                <span class="value-display">{{ formatAmplitudeValue(record?.accommodative_amplitude_left) }}</span>
                <span class="value-display">{{ formatAmplitudeStyle(record?.accommodation_amplitude_style) }}</span>
              </template>
            </div>
            <div class="func-table-col pass-col cell-pass-empty-col">—</div>
            <div class="func-table-col reference">{{ getAmplitudeReference() }}</div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">调节灵敏度（cpm）</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <div class="accommodation-param-btns accommodation-param-btns--inline">
                  <div class="accommodation-param-cols">
                    <div class="accommodation-param-col">
                      <div class="accommodation-param-col-title">检查光度</div>
                      <button
                        v-for="opt in accommodationSensitivityLensOptions"
                        :key="'l-' + opt"
                        type="button"
                        class="accommodation-param-choice"
                        :class="{ 'is-active': accommodationSensitivityDiopter === opt }"
                        @click="setAccommodationSensitivityLens(opt)"
                      >
                        <span class="accommodation-param-dot" aria-hidden="true"></span>
                        <span class="accommodation-param-label">{{ opt }}</span>
                      </button>
                    </div>
                    <div class="accommodation-param-col">
                      <div class="accommodation-param-col-title">检查视标</div>
                      <button
                        v-for="opt in accommodationSensitivityVisionOptions"
                        :key="'v-' + opt"
                        type="button"
                        class="accommodation-param-choice"
                        :class="{ 'is-active': accommodationSensitivityVision === opt }"
                        @click="setAccommodationSensitivityVision(opt)"
                      >
                        <span class="accommodation-param-dot" aria-hidden="true"></span>
                        <span class="accommodation-param-label">{{ opt }}</span>
                      </button>
                    </div>
                  </div>
                </div>
                <span class="input-label">右眼：</span>
                <a-input-number v-model:value="accommodationSensitivityRight" :min="0" :precision="0" style="width: 40px; margin-right: 2px" />
                <span class="accommodation-cpm-suffix accommodation-cpm-suffix--inline">cpm</span>
                <span class="input-label">左眼：</span>
                <a-input-number v-model:value="accommodationSensitivityLeft" :min="0" :precision="0" style="width: 40px; margin-right: 2px" />
                <span class="accommodation-cpm-suffix accommodation-cpm-suffix--inline">cpm</span>
                <span class="input-label">双眼：</span>
                <a-input-number v-model:value="accommodationSensitivityBoth" :min="0" :precision="0" style="width: 40px; margin-right: 2px" />
                <span class="accommodation-cpm-suffix accommodation-cpm-suffix--inline">cpm</span>
              </template>
              <template v-else>
                <div class="accommodation-param-view-stack accommodation-param-view-stack--inline">
                  <div class="accommodation-param-view-line">检查光度：{{ (record?.accommodation_sensitivity_lens_power || record?.accommodation_sensitivity_diopter) || '±2.00D' }}</div>
                  <div class="accommodation-param-view-line">检查视标：{{ (record?.accommodation_sensitivity_target || record?.accommodation_sensitivity_vision) || '20/30' }}</div>
                </div>
                <span class="input-label">右眼：</span>
                <span class="value-display">{{ formatAccommodationSensitivityCpmDisplay(record?.accommodation_sensitivity_right_value || record?.accommodation_sensitivity_right) }}</span>
                <span class="input-label">左眼：</span>
                <span class="value-display">{{ formatAccommodationSensitivityCpmDisplay(record?.accommodation_sensitivity_left_value || record?.accommodation_sensitivity_left) }}</span>
                <span class="input-label">双眼：</span>
                <span class="value-display">{{ formatAccommodationSensitivityCpmDisplay(record?.accommodation_sensitivity_both_value || record?.accommodation_sensitivity_both) }}</span>
              </template>
            </div>
            <div class="func-table-col pass-col">
              <template v-if="viewMode === 'edit'">
                <div class="accommodation-pass-stack">
                  <div
                    v-for="spec in accommodationSensitivityPassSides"
                    :key="'nl-pass-' + spec.key"
                    class="accommodation-pass-line"
                  >
                    <span class="accommodation-pass-line-label">{{ spec.label }}</span>
                    <div class="accommodation-pass-btns">
                      <button
                        v-for="sym in accommodationPassSymbols"
                        :key="'nl-pass-' + spec.key + sym"
                        type="button"
                        class="accommodation-pass-btn"
                        :class="{ active: getAccommodationSensitivityPass(spec.key) === sym }"
                        @click="toggleAccommodationSensitivityPass(spec.key, sym)"
                      >{{ sym }}</button>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="accommodation-pass-stack accommodation-pass-stack--view">
                  <div
                    v-for="spec in accommodationSensitivityPassSides"
                    :key="'nv-pass-' + spec.key"
                    class="accommodation-pass-line"
                  >
                    <span class="accommodation-pass-line-label">{{ spec.label }}</span>
                    <span class="accommodation-pass-view">{{ formatRecordAccommodationPass(record, spec.key) }}</span>
                  </div>
                </div>
              </template>
            </div>
            <div class="func-table-col reference">11cpm<br>8cpm</div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">调节反应（D）</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <span class="input-label">右眼：</span>
                <a-input v-model:value="editForm.accommodation_mem_right_text" placeholder="MEM" style="width: 76px; margin-right: 8px" allow-clear @blur="syncReactionNumericFromText('right')" />
                <span class="input-label">左眼：</span>
                <a-input v-model:value="editForm.accommodation_mem_left_text" placeholder="MEM" style="width: 76px; margin-right: 8px" allow-clear @blur="syncReactionNumericFromText('left')" />
                <span class="input-label">BCC：</span>
                <a-input v-model:value="editForm.accommodation_mem_bcc_text" style="width: 76px" allow-clear @blur="syncReactionNumericFromText('both')" />
              </template>
              <template v-else>
                <span class="input-label">右眼：</span>
                <span class="value-display">{{ displayReaction(record, 'right') }}</span>
                <span class="input-label">左眼：</span>
                <span class="value-display">{{ displayReaction(record, 'left') }}</span>
                <span class="input-label">BCC：</span>
                <span class="value-display">{{ displayReaction(record, 'both') }}</span>
              </template>
            </div>
            <div class="func-table-col pass-col cell-pass-empty-col">—</div>
            <div class="func-table-col reference">+0.50D±0.25D</div>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- 其他相关检查（子标签：综合验光仪 / 四孔灯 / 同视机；结果分析仅在独立「结果分析」页面展示） -->
    <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasOtherRelatedData" 
         v-show="showOnlySection !== 'functional' && showOnlySection !== 'functional-core' && (!showOnlySection || showOnlySection === 'other-related' || showOnlySection === 'related-functional')"
         class="section-block other-related-block">
      <div
        v-if="!reportLayout && (viewMode === 'view' || !isReportMode) && viewMode !== 'print'"
        class="other-related-tabs-row"
      >
        <div class="other-related-main-tabs" role="tablist" aria-label="其他相关检查">
          <button
            type="button"
            role="tab"
            class="other-related-tab-item"
            :class="{ active: otherRelatedSubTab === 'optometer' }"
            :aria-selected="otherRelatedSubTab === 'optometer'"
            @click="otherRelatedSubTab = 'optometer'"
          >
            综合验光仪
          </button>
          <button
            type="button"
            role="tab"
            class="other-related-tab-item"
            :class="{ active: otherRelatedSubTab === 'four-hole' }"
            :aria-selected="otherRelatedSubTab === 'four-hole'"
            @click="otherRelatedSubTab = 'four-hole'"
          >
            四孔灯检查
          </button>
          <button
            type="button"
            role="tab"
            class="other-related-tab-item"
            :class="{ active: otherRelatedSubTab === 'synoptophore' }"
            :aria-selected="otherRelatedSubTab === 'synoptophore'"
            @click="otherRelatedSubTab = 'synoptophore'"
          >
            同视机检查
          </button>
          <button
            type="button"
            role="tab"
            class="other-related-tab-item"
            :class="{ active: otherRelatedSubTab === 'match-params' }"
            :aria-selected="otherRelatedSubTab === 'match-params'"
            @click="otherRelatedSubTab = 'match-params'"
          >
            匹配参数设置
          </button>
        </div>
      </div>
      <div
        v-show="viewMode === 'print' || reportLayout || otherRelatedSubTab === 'optometer'"
        class="other-related-panel"
      >
      <div class="func-exam-col">
        <div class="func-exam-col-bg optometer-related-table">
          <div class="func-table-header">
            <div class="func-table-col item">综合验光仪</div>
            <div class="func-table-col result">检查结果</div>
            <div class="func-table-col reference">参考值</div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">Worth4点检查</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <a-select v-model:value="editForm.worth_4_type" style="width: 25%" placeholder="选择结果" allowClear>
                  <a-select-option :value="null">-- 请选择 --</a-select-option>
                  <a-select-option value="4">4</a-select-option>
                  <a-select-option value="2">2</a-select-option>
                  <a-select-option value="3">3</a-select-option>
                  <a-select-option value="5">5</a-select-option>
                  <a-select-option value="NG">NG</a-select-option>
                </a-select>
              </template>
              <template v-else>
                <span class="value-display">{{ formatWorth4(record?.worth_4_type) }}</span>
              </template>
            </div>
            <div class="func-table-col reference">4</div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">立体视检查</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <a-select v-model:value="editForm.stereopsis_testing" style="width: 25%" placeholder="选择结果" allowClear>
                  <a-select-option :value="null">-- 请选择 --</a-select-option>
                  <a-select-option :value="1">1'</a-select-option>
                  <a-select-option :value="2">2'</a-select-option>
                  <a-select-option :value="4">4'</a-select-option>
                  <a-select-option :value="10">10'</a-select-option>
                  <a-select-option value="NG">NG</a-select-option>
                </a-select>
              </template>
              <template v-else>
                <span class="value-display">{{ formatStereopsis(record?.stereopsis_testing) }}</span>
              </template>
            </div>
            <div class="func-table-col reference">-</div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">不等像视检查</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <span class="input-label">是否等像：</span>
                <a-select v-model:value="editForm.aniseikonia" style="width: 25%" placeholder="选择结果" allowClear>
                  <a-select-option :value="null">-- 请选择 --</a-select-option>
                  <a-select-option value="是">是</a-select-option>
                  <a-select-option value="否">否</a-select-option>
                </a-select>
              </template>
              <template v-else>
                <span class="input-label">是否等像：</span>
                <span class="value-display">{{ formatAniseikonia(record?.aniseikonia) }}</span>
              </template>
            </div>
            <div class="func-table-col reference">是</div>
          </div>
        </div>
      </div>
      </div>
      <div
        v-show="viewMode === 'print' || reportLayout || otherRelatedSubTab === 'four-hole'"
        class="other-related-panel"
      >
      <!-- 四孔灯检查 -->
      <div class="func-exam-col">
        <div class="func-exam-col-bg four-hole-lamp-table">
          <div class="func-table-header">
            <div class="func-table-col item">四孔灯检查</div>
            <div class="func-table-col result">检查结果</div>
            <div class="func-table-col reference">结果</div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">2m</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <div class="four-hole-container">
                  <div class="four-hole-primary-row">
                    <div class="button-group">
                      <button 
                        type="button"
                        class="four-hole-btn"
                        :class="{ active: editForm.check_distance_2m === '4' }"
                        @click="handleFourHole2mClick('4')"
                      >4</button>
                      <button 
                        type="button"
                        class="four-hole-btn"
                        :class="{ active: editForm.check_distance_2m === '5' }"
                        @click="handleFourHole2mClick('5')"
                      >5</button>
                    </div>
                    <div v-if="editForm.check_distance_2m === '4'" class="dominant-eye-select">
                      <span class="input-label">优势眼：</span>
                      <a-select
                        v-model:value="editForm.dominant_eye_color_2m"
                        class="four-hole-lamp-select four-hole-lamp-select--compact"
                        size="large"
                        dropdown-class-name="four-hole-select-dropdown"
                        :dropdown-match-select-width="false"
                        allowClear
                      >
                      <a-select-option value="黄">黄</a-select-option>
                      <a-select-option value="红">红</a-select-option>
                      <a-select-option value="绿">绿</a-select-option>
                      <a-select-option value="红绿交替">红绿交替</a-select-option>
                    </a-select>
                    </div>
                  </div>
                  <div v-if="editForm.check_distance_2m === '5'" class="five-options-container five-options-container--second-row">
                    <div class="five-option-item">
                      <span class="input-label">水平：</span>
                      <a-select
                        v-model:value="editForm.horizontal_option_2m"
                        class="four-hole-lamp-select four-hole-lamp-select--narrow"
                        size="large"
                        dropdown-class-name="four-hole-select-dropdown"
                        :dropdown-match-select-width="false"
                        allowClear
                      >
                        <a-select-option value="左红右绿">左红右绿</a-select-option>
                        <a-select-option value="右红左绿">右红左绿</a-select-option>
                      </a-select>
                    </div>
                    <div class="five-option-item">
                      <span class="input-label">垂直：</span>
                      <a-select
                        v-model:value="editForm.vertical_option_2m"
                        class="four-hole-lamp-select four-hole-lamp-select--narrow"
                        size="large"
                        dropdown-class-name="four-hole-select-dropdown"
                        :dropdown-match-select-width="false"
                        allowClear
                      >
                        <a-select-option value="右高">右</a-select-option>
                        <a-select-option value="左高">左</a-select-option>
                      </a-select>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <span class="value-display" v-html="formatFourHole2mRawData(record)"></span>
              </template>
            </div>
            <div class="func-table-col reference" v-html="viewMode === 'edit' ? formatFourHole2mResult(editForm) : formatFourHole2mResult(record)"></div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">40cm</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <div class="four-hole-container">
                  <div class="four-hole-primary-row">
                    <div class="button-group">
                      <button 
                        type="button"
                        class="four-hole-btn"
                        :class="{ active: editForm.check_distance_40cm === '4' }"
                        @click="handleFourHole40cmClick('4')"
                      >4</button>
                      <button 
                        type="button"
                        class="four-hole-btn"
                        :class="{ active: editForm.check_distance_40cm === '5' }"
                        @click="handleFourHole40cmClick('5')"
                      >5</button>
                    </div>
                    <div v-if="editForm.check_distance_40cm === '4'" class="dominant-eye-select">
                      <span class="input-label">优势眼：</span>
                      <a-select
                        v-model:value="editForm.dominant_eye_color_40cm"
                        class="four-hole-lamp-select four-hole-lamp-select--compact"
                        size="large"
                        dropdown-class-name="four-hole-select-dropdown"
                        :dropdown-match-select-width="false"
                        allowClear
                      >
                      <a-select-option value="黄">黄</a-select-option>
                      <a-select-option value="红">红</a-select-option>
                      <a-select-option value="绿">绿</a-select-option>
                      <a-select-option value="红绿交替">红绿交替</a-select-option>
                    </a-select>
                    </div>
                  </div>
                  <div v-if="editForm.check_distance_40cm === '5'" class="five-options-container five-options-container--second-row">
                    <div class="five-option-item">
                      <span class="input-label">水平：</span>
                      <a-select
                        v-model:value="editForm.horizontal_option_40cm"
                        class="four-hole-lamp-select four-hole-lamp-select--narrow"
                        size="large"
                        dropdown-class-name="four-hole-select-dropdown"
                        :dropdown-match-select-width="false"
                        allowClear
                      >
                        <a-select-option value="左红右绿">左红右绿</a-select-option>
                        <a-select-option value="右红左绿">右红左绿</a-select-option>
                      </a-select>
                    </div>
                    <div class="five-option-item">
                      <span class="input-label">垂直：</span>
                      <a-select
                        v-model:value="editForm.vertical_option_40cm"
                        class="four-hole-lamp-select four-hole-lamp-select--narrow"
                        size="large"
                        dropdown-class-name="four-hole-select-dropdown"
                        :dropdown-match-select-width="false"
                        allowClear
                      >
                        <a-select-option value="右高">右</a-select-option>
                        <a-select-option value="左高">左</a-select-option>
                      </a-select>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <span class="value-display" v-html="formatFourHole40cmRawData(record)"></span>
              </template>
            </div>
            <div class="func-table-col reference" v-html="viewMode === 'edit' ? formatFourHole40cmResult(editForm) : formatFourHole40cmResult(record)"></div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">抑制</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <div class="suppression-container">
                  <div class="button-group">
                    <button 
                      type="button"
                      class="four-hole-btn"
                      :class="{ active: editForm.value === '2' }"
                      @click="handleSuppressionClick('2')"
                    >2</button>
                    <button 
                      type="button"
                      class="four-hole-btn"
                      :class="{ active: editForm.value === '3' }"
                      @click="handleSuppressionClick('3')"
                    >3</button>
                    <button 
                      type="button"
                      class="four-hole-btn"
                      :class="{ active: editForm.value === '其他' }"
                      @click="handleSuppressionClick('其他')"
                    >交替</button>
                  </div>
                  <!-- 交替的选择框 -->
                  <div v-if="editForm.value === '其他'" class="suppression-options">
                    <div class="suppression-alternate-item">
                      <a-input-number 
                        v-model:value="editForm.alternate_suppression_distance" 
                        :min="0" 
                        :precision="1"
                        style="width: 80px; margin-right: 4px" 
                        placeholder="距离"
                      />
                      <span style="margin-right: 8px;">m以内</span>
                      <div class="button-group-small">
                        <button 
                          type="button"
                          class="four-hole-btn-small"
                          :class="{ active: editForm.alternate_suppression_direction === '右' }"
                          @click="editForm.alternate_suppression_direction = editForm.alternate_suppression_direction === '右' ? null : '右'"
                        >右</button>
                        <button 
                          type="button"
                          class="four-hole-btn-small"
                          :class="{ active: editForm.alternate_suppression_direction === '左' }"
                          @click="editForm.alternate_suppression_direction = editForm.alternate_suppression_direction === '左' ? null : '左'"
                        >左</button>
                      </div>
                    </div>
                  </div>
                  <!-- 右眼（2）的选择框 -->
                  <div v-if="editForm.value === '2'" class="suppression-options">
                    <div class="suppression-option-item">
                      <span class="input-label">右眼：</span>
                      <a-select v-model:value="editForm.right_eye_suppression_type" style="width: 140px" allowClear>
                        <a-select-option value="全程抑制">全程抑制</a-select-option>
                        <a-select-option value="非全程抑制">非全程抑制</a-select-option>
                      </a-select>
                    </div>
                    <div v-if="editForm.right_eye_suppression_type === '非全程抑制'" class="suppression-detail">
                      <a-input-number 
                        v-model:value="editForm.right_eye_suppression_distance" 
                        :min="0" 
                        :precision="1"
                        style="width: 80px; margin-right: 8px" 
                        placeholder="距离"
                      />
                      <span style="margin-right: 8px;">m</span>
                      <div class="button-group-small">
                        <button 
                          type="button"
                          class="four-hole-btn-small"
                          :class="{ active: editForm.right_eye_suppression_direction === '内' }"
                          @click="editForm.right_eye_suppression_direction = editForm.right_eye_suppression_direction === '内' ? null : '内'"
                        >内</button>
                        <button 
                          type="button"
                          class="four-hole-btn-small"
                          :class="{ active: editForm.right_eye_suppression_direction === '外' }"
                          @click="editForm.right_eye_suppression_direction = editForm.right_eye_suppression_direction === '外' ? null : '外'"
                        >外</button>
                      </div>
                    </div>
                  </div>
                  <!-- 左眼（3）的选择框 -->
                  <div v-if="editForm.value === '3'" class="suppression-options">
                    <div class="suppression-option-item">
                      <span class="input-label">左眼：</span>
                      <a-select v-model:value="editForm.left_eye_suppression_type" style="width: 140px" allowClear>
                        <a-select-option value="全程抑制">全程抑制</a-select-option>
                        <a-select-option value="非全程抑制">非全程抑制</a-select-option>
                      </a-select>
                    </div>
                    <div v-if="editForm.left_eye_suppression_type === '非全程抑制'" class="suppression-detail">
                      <a-input-number 
                        v-model:value="editForm.left_eye_suppression_distance" 
                        :min="0" 
                        :precision="1"
                        style="width: 80px; margin-right: 8px" 
                        placeholder="距离"
                      />
                      <span style="margin-right: 8px;">m</span>
                      <div class="button-group-small">
                        <button 
                          type="button"
                          class="four-hole-btn-small"
                          :class="{ active: editForm.left_eye_suppression_direction === '内' }"
                          @click="editForm.left_eye_suppression_direction = editForm.left_eye_suppression_direction === '内' ? null : '内'"
                        >内</button>
                        <button 
                          type="button"
                          class="four-hole-btn-small"
                          :class="{ active: editForm.left_eye_suppression_direction === '外' }"
                          @click="editForm.left_eye_suppression_direction = editForm.left_eye_suppression_direction === '外' ? null : '外'"
                        >外</button>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <span class="value-display" v-html="formatSuppressionRawData(record)"></span>
              </template>
            </div>
            <div class="func-table-col reference" v-html="viewMode === 'edit' ? formatSuppressionResult(editForm) : formatSuppressionResult(record)"></div>
          </div>
        </div>
      </div>
      </div>
      <!-- 同视机检查：Ⅰ/Ⅱ/Ⅲ 级同一表纵向排列 -->
      <div
        v-show="viewMode === 'print' || reportLayout || otherRelatedSubTab === 'synoptophore'"
        class="other-related-panel other-related-panel--synoptophore"
      >
        <div class="func-exam-col">
          <div class="func-exam-col-bg synoptophore-table">
            <div class="func-table-header">
              <div class="func-table-col item">检查项目</div>
              <div class="func-table-col result">检查结果</div>
              <div class="func-table-col reference">参考值</div>
            </div>
            <div class="func-table-row">
              <div class="func-table-col item">Ⅰ级</div>
              <div class="func-table-col result">
                <template v-if="viewMode === 'edit'">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;">
                    <a-select v-model:value="editForm.synoptophore_level1_sign" style="width: 120px; flex-shrink: 0;" allowClear placeholder="选择">
                      <a-select-option value="-">-</a-select-option>
                      <a-select-option value="+">+</a-select-option>
                      <a-select-option value="正位">正位</a-select-option>
                    </a-select>
                    <a-input-number 
                      v-model:value="editForm.synoptophore_level1_value" 
                      :min="0" 
                      :precision="2" 
                      :step="0.25" 
                      style="width: 150px; flex-shrink: 0;" 
                      placeholder="输入结果"
                      addon-after="°"
                    />
                  </div>
                </template>
                <template v-else>
                  <span class="value-display" v-html="formatSynoptophoreGradeI(record)"></span>
                </template>
              </div>
              <div class="func-table-col reference">-</div>
            </div>
            <div class="func-table-row">
              <div class="func-table-col item">Ⅱ级</div>
              <div class="func-table-col result">
                <template v-if="viewMode === 'edit'">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;">
                    <a-input-number 
                      v-model:value="editForm.synoptophore_level2_positive" 
                      :min="0" 
                      :precision="2" 
                      :step="0.25" 
                      style="width: 150px; flex-shrink: 0;" 
                      placeholder="输入"
                      addon-before="+"
                      addon-after="°"
                    />
                    <span style="flex-shrink: 0;">~</span>
                    <a-input-number 
                      v-model:value="editForm.synoptophore_level2_negative" 
                      :min="0" 
                      :precision="2" 
                      :step="0.25" 
                      style="width: 150px; flex-shrink: 0;" 
                      placeholder="输入"
                      addon-before="-"
                      addon-after="°"
                    />
                  </div>
                </template>
                <template v-else>
                  <span class="value-display" v-html="formatSynoptophoreGradeII(record)"></span>
                </template>
              </div>
              <div class="func-table-col reference">-</div>
            </div>
            <div class="func-table-row">
              <div class="func-table-col item">Ⅲ级</div>
              <div class="func-table-col result">
                <template v-if="viewMode === 'edit'">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;">
                    <a-select v-model:value="editForm.synoptophore_level3_stereo" style="width: 120px; flex-shrink: 0;" placeholder="选择结果" allowClear>
                      <a-select-option value="有">有</a-select-option>
                      <a-select-option value="无">无</a-select-option>
                    </a-select>
                    <a-input-number 
                      v-model:value="editForm.synoptophore_level3_value" 
                      :min="0" 
                      :precision="2" 
                      :step="0.25" 
                      style="width: 150px; flex-shrink: 0;" 
                      placeholder="输入值"
                      addon-after="°"
                      :disabled="editForm.synoptophore_level3_stereo !== '有'"
                    />
                  </div>
                </template>
                <template v-else>
                  <span class="value-display" v-html="formatSynoptophoreGradeIII(record)"></span>
                </template>
              </div>
              <div class="func-table-col reference">-</div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-show="viewMode === 'print' || reportLayout || otherRelatedSubTab === 'match-params'"
        class="other-related-panel other-related-panel--analysis"
      >
        <AnalysisExam
          :record="record"
          :previous-record="previousRecord"
          :examination-records="examinationRecords"
          :patient-id="analysisPatientId"
          :patient-info="patientInfo"
          :view-mode="viewMode"
          :initial-main-tab="'params'"
          :hide-main-tabs="true"
          @refresh="emit('refresh')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { UpOutlined, DownOutlined } from '@ant-design/icons-vue';
import AnalysisExam from './AnalysisExam.vue';

const props = defineProps({
  record: {
    type: Object,
    default: () => ({})
  },
  previousRecord: {
    type: Object,
    default: null
  },
  examinationRecords: {
    type: Array,
    default: () => []
  },
  patientId: {
    type: [String, Number],
    default: null
  },
  patientInfo: {
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
  showOnlySection: {
    type: String,
    default: null // 如果设置，只显示指定的 section（如 'other-related'），'functional' 表示显示所有
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

// 调试：监听record变化，查看查看模式下的数据（仅打印原始数据，避免引用未初始化函数）
watch(() => props.record, (newVal) => {
  if (newVal && (props.viewMode === 'view' || props.viewMode === 'print')) {
    if (newVal.vertical_eye_position_far || newVal.fusional_convergence_distance_vertical_direction || newVal.far_vertical_eye_direction || newVal.vertical_eye_position_far_value || newVal.far_vertical_eye_break) {
      console.log('[FunctionalExamStyleTwo] 查看模式 - 5m垂直眼位数据:', {
        vertical_eye_position_far: newVal.vertical_eye_position_far,
        vertical_eye_position_far_value: newVal.vertical_eye_position_far_value,
        fusional_convergence_distance_vertical_direction: newVal.fusional_convergence_distance_vertical_direction,
        far_vertical_eye_direction: newVal.far_vertical_eye_direction,
        far_vertical_eye_break: newVal.far_vertical_eye_break
      });
    }
    const fourHoleData = {
      check_distance_2m: newVal.check_distance_2m,
      dominant_eye_color_2m: newVal.dominant_eye_color_2m,
      horizontal_option_2m: newVal.horizontal_option_2m,
      vertical_option_2m: newVal.vertical_option_2m,
      check_distance_40cm: newVal.check_distance_40cm,
      dominant_eye_color_40cm: newVal.dominant_eye_color_40cm,
      horizontal_option_40cm: newVal.horizontal_option_40cm,
      vertical_option_40cm: newVal.vertical_option_40cm,
      value: newVal.value,
      right_eye_suppression_type: newVal.right_eye_suppression_type,
      right_eye_suppression_distance: newVal.right_eye_suppression_distance,
      right_eye_suppression_direction: newVal.right_eye_suppression_direction,
      left_eye_suppression_type: newVal.left_eye_suppression_type,
      left_eye_suppression_distance: newVal.left_eye_suppression_distance,
      left_eye_suppression_direction: newVal.left_eye_suppression_direction,
      alternate_suppression_distance: newVal.alternate_suppression_distance,
      alternate_suppression_direction: newVal.alternate_suppression_direction
    };
    const hasFourHoleData = Object.values(fourHoleData).some(v => v !== null && v !== undefined && v !== '');
    if (hasFourHoleData) {
      console.log('[FunctionalExamStyleTwo] 查看模式 - 四孔灯检查数据:', fourHoleData);
    } else {
      console.log('[FunctionalExamStyleTwo] 查看模式 - 四孔灯检查数据为空或不存在');
    }
  }
}, { immediate: true, deep: true });

const emit = defineEmits(['toggle-section', 'update-record', 'refresh']);

/** 其他相关检查：综合验光仪 / 四孔灯 / 同视机 */
const otherRelatedSubTab = ref('optometer');

const analysisPatientId = computed(() => {
  if (props.patientId != null && props.patientId !== '') return props.patientId;
  const p = props.patientInfo;
  if (!p) return '';
  return p.patient_id ?? p.id ?? '';
});

// 切换section展开/收起状态
const handleToggleSection = (sectionKey) => {
  emit('toggle-section', sectionKey);
};

// 编辑表单数据
const editForm = ref({});
let isUpdatingFromRecord = false; // 标志：是否正在从record同步到editForm
let isCalculatingACAAverage = false; // 标志：是否正在自动计算AC/A平均值

// 初始化综合验光仪相关字段的默认值
const initOptometerFields = (data) => {
  if (!data) return data;
  const defaultFields = {
    worth_4_type: null,
    stereopsis_testing: null,
    aniseikonia: null
  };
  // 确保所有字段都存在，如果不存在则设置为默认值
  Object.keys(defaultFields).forEach(key => {
    if (!(key in data)) {
      data[key] = defaultFields[key];
    } else if (data[key] === undefined || data[key] === '') {
      // 如果字段值为 undefined 或空字符串，也设置为 null
      data[key] = null;
    }
  });
  return data;
};

// 四孔灯检查字段列表（用于组装数组）
const fourHoleLampFields = [
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

// 初始化四孔灯检查相关字段的默认值
// 注意：后端返回的字段是平铺的，不在数组中，所以不需要从数组读取
const initFourHoleLampFields = (data) => {
  if (!data) return data;
  
  const defaultFields = {
    distance: null,
    value: null,
    other: null,
    check_distance_2m: null,
    check_distance_40cm: null,
    dominant_eye_color_2m: null,
    dominant_eye_color_40cm: null,
    horizontal_option_2m: null,
    vertical_option_2m: null,
    horizontal_option_40cm: null,
    vertical_option_40cm: null,
    left_eye_suppression_type: null,
    left_eye_suppression_distance: null,
    left_eye_suppression_direction: null,
    right_eye_suppression_type: null,
    right_eye_suppression_distance: null,
    right_eye_suppression_direction: null,
    alternate_suppression_distance: null,
    alternate_suppression_direction: null
  };
  // 确保所有字段都存在，如果不存在则设置为默认值
  Object.keys(defaultFields).forEach(key => {
    if (!(key in data)) {
      data[key] = defaultFields[key];
    }
  });
  return data;
};

// 将平铺字段组装成four_hole_lamp_list数组的第一个元素
const buildFourHoleLampArray = (data) => {
  if (!data) return data;
  
  // 构建数组元素对象
  const arrayItem = {};
  let hasData = false;
  
  fourHoleLampFields.forEach(field => {
    const value = data[field];
    if (value !== null && value !== undefined && value !== '') {
      arrayItem[field] = value;
      hasData = true;
    }
  });
  
  // 如果有数据，则创建数组；否则设置为空数组
  if (hasData) {
    data.four_hole_lamp_list = [arrayItem];
  } else {
    data.four_hole_lamp_list = [];
  }
  
  return data;
};

// 监听record变化，同步到editForm
watch(() => props.record, (newVal) => {
  if (newVal && props.viewMode === 'edit') {
    isUpdatingFromRecord = true; // 设置标志，防止触发update-record
    const clonedData = JSON.parse(JSON.stringify(newVal));
    let processedData = initOptometerFields(clonedData);
    processedData = initFourHoleLampFields(processedData);
    
    // 处理垂直眼位字段的兼容性：如果新字段为空但旧字段有值，则复制到新字段
    // 5m垂直眼位方向
    if ((processedData.vertical_eye_position_far === null || processedData.vertical_eye_position_far === undefined || processedData.vertical_eye_position_far === '') &&
        (processedData.fusional_convergence_distance_vertical_direction || processedData.far_vertical_eye_direction)) {
      processedData.vertical_eye_position_far = processedData.fusional_convergence_distance_vertical_direction || processedData.far_vertical_eye_direction;
    }
    // 5m垂直眼位数值
    if ((processedData.vertical_eye_position_far_value === null || processedData.vertical_eye_position_far_value === undefined || processedData.vertical_eye_position_far_value === '') &&
        processedData.far_vertical_eye_break !== null && processedData.far_vertical_eye_break !== undefined && processedData.far_vertical_eye_break !== '') {
      processedData.vertical_eye_position_far_value = processedData.far_vertical_eye_break;
    }
    // 40cm垂直眼位方向
    if ((processedData.vertical_eye_position_near === null || processedData.vertical_eye_position_near === undefined || processedData.vertical_eye_position_near === '') &&
        (processedData.fusional_convergence_near_vertical_direction || processedData.near_vertical_eye_direction)) {
      processedData.vertical_eye_position_near = processedData.fusional_convergence_near_vertical_direction || processedData.near_vertical_eye_direction;
    }
    // 40cm垂直眼位数值
    if ((processedData.vertical_eye_position_near_value === null || processedData.vertical_eye_position_near_value === undefined || processedData.vertical_eye_position_near_value === '') &&
        processedData.near_vertical_eye_break !== null && processedData.near_vertical_eye_break !== undefined && processedData.near_vertical_eye_break !== '') {
      processedData.vertical_eye_position_near_value = processedData.near_vertical_eye_break;
    }
    
    // 处理垂直融合范围字段的兼容性：如果新字段为空但旧字段有值，则复制到新字段
    // 远距离（5m）垂直融合范围
    if ((processedData.fusional_vertical_up_distance_break === null || processedData.fusional_vertical_up_distance_break === undefined || processedData.fusional_vertical_up_distance_break === '') &&
        processedData.fusional_convergence_distance_vertical_break !== null && processedData.fusional_convergence_distance_vertical_break !== undefined && processedData.fusional_convergence_distance_vertical_break !== '') {
      processedData.fusional_vertical_up_distance_break = processedData.fusional_convergence_distance_vertical_break;
    }
    if ((processedData.fusional_vertical_up_distance_recovery === null || processedData.fusional_vertical_up_distance_recovery === undefined || processedData.fusional_vertical_up_distance_recovery === '') &&
        processedData.fusional_convergence_distance_vertical_recovery !== null && processedData.fusional_convergence_distance_vertical_recovery !== undefined && processedData.fusional_convergence_distance_vertical_recovery !== '') {
      processedData.fusional_vertical_up_distance_recovery = processedData.fusional_convergence_distance_vertical_recovery;
    }
    if ((processedData.fusional_vertical_down_distance_break === null || processedData.fusional_vertical_down_distance_break === undefined || processedData.fusional_vertical_down_distance_break === '') &&
        processedData.fusional_disvergence_distance_vertical_break !== null && processedData.fusional_disvergence_distance_vertical_break !== undefined && processedData.fusional_disvergence_distance_vertical_break !== '') {
      processedData.fusional_vertical_down_distance_break = processedData.fusional_disvergence_distance_vertical_break;
    }
    if ((processedData.fusional_vertical_down_distance_recovery === null || processedData.fusional_vertical_down_distance_recovery === undefined || processedData.fusional_vertical_down_distance_recovery === '') &&
        processedData.fusional_disvergence_distance_vertical_recovery !== null && processedData.fusional_disvergence_distance_vertical_recovery !== undefined && processedData.fusional_disvergence_distance_vertical_recovery !== '') {
      processedData.fusional_vertical_down_distance_recovery = processedData.fusional_disvergence_distance_vertical_recovery;
    }
    // 近距离（40cm）垂直融合范围
    if ((processedData.fusional_vertical_up_near_break === null || processedData.fusional_vertical_up_near_break === undefined || processedData.fusional_vertical_up_near_break === '') &&
        processedData.fusional_convergence_near_vertical_break !== null && processedData.fusional_convergence_near_vertical_break !== undefined && processedData.fusional_convergence_near_vertical_break !== '') {
      processedData.fusional_vertical_up_near_break = processedData.fusional_convergence_near_vertical_break;
    }
    if ((processedData.fusional_vertical_up_near_recovery === null || processedData.fusional_vertical_up_near_recovery === undefined || processedData.fusional_vertical_up_near_recovery === '') &&
        processedData.fusional_convergence_near_vertical_recovery !== null && processedData.fusional_convergence_near_vertical_recovery !== undefined && processedData.fusional_convergence_near_vertical_recovery !== '') {
      processedData.fusional_vertical_up_near_recovery = processedData.fusional_convergence_near_vertical_recovery;
    }
    if ((processedData.fusional_vertical_down_near_break === null || processedData.fusional_vertical_down_near_break === undefined || processedData.fusional_vertical_down_near_break === '') &&
        processedData.fusional_disvergence_near_vertical_break !== null && processedData.fusional_disvergence_near_vertical_break !== undefined && processedData.fusional_disvergence_near_vertical_break !== '') {
      processedData.fusional_vertical_down_near_break = processedData.fusional_disvergence_near_vertical_break;
    }
    if ((processedData.fusional_vertical_down_near_recovery === null || processedData.fusional_vertical_down_near_recovery === undefined || processedData.fusional_vertical_down_near_recovery === '') &&
        processedData.fusional_disvergence_near_vertical_recovery !== null && processedData.fusional_disvergence_near_vertical_recovery !== undefined && processedData.fusional_disvergence_near_vertical_recovery !== '') {
      processedData.fusional_vertical_down_near_recovery = processedData.fusional_disvergence_near_vertical_recovery;
    }

    ensureReactionDisplayText(processedData);
    editForm.value = processedData;
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
    const clonedData = JSON.parse(JSON.stringify(props.record));
    let processedData = initOptometerFields(clonedData);
    processedData = initFourHoleLampFields(processedData);
    // 处理垂直眼位字段的兼容性：如果新字段为空但旧字段有值，则复制到新字段
    const verticalFieldMap = {
      'vertical_eye_position_far': ['fusional_convergence_distance_vertical_direction', 'far_vertical_eye_direction'],
      'vertical_eye_position_far_value': ['far_vertical_eye_break'],
      'vertical_eye_position_near': ['fusional_convergence_near_vertical_direction', 'near_vertical_eye_direction'],
      'vertical_eye_position_near_value': ['near_vertical_eye_break']
    };
    
    Object.keys(verticalFieldMap).forEach(newField => {
      const oldFields = verticalFieldMap[newField];
      if ((processedData[newField] === null || processedData[newField] === undefined || processedData[newField] === '') &&
          oldFields.some(oldField => processedData[oldField] !== null && processedData[oldField] !== undefined && processedData[oldField] !== '')) {
        const oldValue = oldFields.find(oldField => processedData[oldField] !== null && processedData[oldField] !== undefined && processedData[oldField] !== '');
        if (oldValue) {
          processedData[newField] = processedData[oldValue];
        }
      }
    });
    
    // 处理垂直融合范围字段的兼容性：如果新字段为空但旧字段有值，则复制到新字段
    const verticalFusionFieldMap = {
      'fusional_vertical_up_distance_break': ['fusional_convergence_distance_vertical_break'],
      'fusional_vertical_up_distance_recovery': ['fusional_convergence_distance_vertical_recovery'],
      'fusional_vertical_down_distance_break': ['fusional_disvergence_distance_vertical_break'],
      'fusional_vertical_down_distance_recovery': ['fusional_disvergence_distance_vertical_recovery'],
      'fusional_vertical_up_near_break': ['fusional_convergence_near_vertical_break'],
      'fusional_vertical_up_near_recovery': ['fusional_convergence_near_vertical_recovery'],
      'fusional_vertical_down_near_break': ['fusional_disvergence_near_vertical_break'],
      'fusional_vertical_down_near_recovery': ['fusional_disvergence_near_vertical_recovery']
    };
    
    Object.keys(verticalFusionFieldMap).forEach(newField => {
      const oldFields = verticalFusionFieldMap[newField];
      if ((processedData[newField] === null || processedData[newField] === undefined || processedData[newField] === '') &&
          oldFields.some(oldField => processedData[oldField] !== null && processedData[oldField] !== undefined && processedData[oldField] !== '')) {
        const oldValue = oldFields.find(oldField => processedData[oldField] !== null && processedData[oldField] !== undefined && processedData[oldField] !== '');
        if (oldValue) {
          processedData[newField] = processedData[oldValue];
        }
      }
    });

    ensureReactionDisplayText(processedData);
    editForm.value = processedData;
    
    // 调试：打印从record同步到editForm的垂直眼位数据
    if (props.record.vertical_eye_position_far || props.record.fusional_convergence_distance_vertical_direction || props.record.far_vertical_eye_direction || props.record.vertical_eye_position_far_value || props.record.far_vertical_eye_break) {
      console.log('[FunctionalExamStyleTwo] viewMode变化 - 从record同步到editForm - 5m垂直眼位数据:', {
        vertical_eye_position_far: props.record.vertical_eye_position_far,
        vertical_eye_position_far_value: props.record.vertical_eye_position_far_value,
        fusional_convergence_distance_vertical_direction: props.record.fusional_convergence_distance_vertical_direction,
        far_vertical_eye_direction: props.record.far_vertical_eye_direction,
        far_vertical_eye_break: props.record.far_vertical_eye_break
      });
    }
    nextTick(() => {
      isUpdatingFromRecord = false;
    });
  }
});

// 监听梯度性AC/A的+1和-1值，自动计算平均值
watch([
  () => editForm.value?.ac_a_gradient_ratio_plus,
  () => editForm.value?.ac_a_gradient_ratio_minus,
  () => editForm.value?.ac_a_gradient_ratio_average
], ([plus, minus, average]) => {
  if (props.viewMode === 'edit' && !isUpdatingFromRecord && !isCalculatingACAAverage) {
    // 如果平均值已经有值，不计算
    if (average !== null && average !== undefined && average !== '') {
      return;
    }
    
    // 如果+1和-1都有值，则计算平均值
    if (plus !== null && plus !== undefined && plus !== '' && 
        minus !== null && minus !== undefined && minus !== '') {
      const plusNum = typeof plus === 'number' ? plus : parseFloat(plus);
      const minusNum = typeof minus === 'number' ? minus : parseFloat(minus);
      
      if (!isNaN(plusNum) && !isNaN(minusNum)) {
        const calculatedAverage = (plusNum + minusNum) / 2;
        // 设置标志，防止循环更新
        isCalculatingACAAverage = true;
        // 使用 nextTick 确保不会触发循环更新
        nextTick(() => {
          if (editForm.value) {
            editForm.value.ac_a_gradient_ratio_average = parseFloat(calculatedAverage.toFixed(1));
          }
          // 重置标志
          nextTick(() => {
            isCalculatingACAAverage = false;
          });
        });
      }
    }
    // 如果+1或-1缺少值，则不计算（保持平均值不变）
  }
}, { immediate: false });

// 监听editForm变化，通知父组件更新
watch(() => editForm.value, (newVal) => {
  if (props.viewMode === 'edit' && !isUpdatingFromRecord) {
    syncAllReactionNumericFromText();
    // 调试：打印垂直眼位相关字段
    if (newVal.vertical_eye_position_far || newVal.fusional_convergence_distance_vertical_direction || newVal.far_vertical_eye_direction || newVal.vertical_eye_position_far_value || newVal.far_vertical_eye_break) {
      console.log('[FunctionalExamStyleTwo] 更新记录 - 5m垂直眼位数据:', {
        vertical_eye_position_far: newVal.vertical_eye_position_far,
        vertical_eye_position_far_value: newVal.vertical_eye_position_far_value,
        fusional_convergence_distance_vertical_direction: newVal.fusional_convergence_distance_vertical_direction,
        far_vertical_eye_direction: newVal.far_vertical_eye_direction,
        far_vertical_eye_break: newVal.far_vertical_eye_break
      });
    }
    
    // 处理垂直融合范围字段的兼容性：保存时同时写入新旧字段（过渡期）
    const verticalFusionCompatibilityMap = {
      'fusional_vertical_up_distance_break': 'fusional_convergence_distance_vertical_break',
      'fusional_vertical_up_distance_recovery': 'fusional_convergence_distance_vertical_recovery',
      'fusional_vertical_down_distance_break': 'fusional_disvergence_distance_vertical_break',
      'fusional_vertical_down_distance_recovery': 'fusional_disvergence_distance_vertical_recovery',
      'fusional_vertical_up_near_break': 'fusional_convergence_near_vertical_break',
      'fusional_vertical_up_near_recovery': 'fusional_convergence_near_vertical_recovery',
      'fusional_vertical_down_near_break': 'fusional_disvergence_near_vertical_break',
      'fusional_vertical_down_near_recovery': 'fusional_disvergence_near_vertical_recovery'
    };
    
    Object.keys(verticalFusionCompatibilityMap).forEach(newField => {
      const oldField = verticalFusionCompatibilityMap[newField];
      // 如果新字段有值，同时写入旧字段（兼容性）
      if (newVal[newField] !== null && newVal[newField] !== undefined && newVal[newField] !== '') {
        newVal[oldField] = newVal[newField];
      } else if (newVal[newField] === null || newVal[newField] === undefined || newVal[newField] === '') {
        // 如果新字段为空，也清空旧字段
        newVal[oldField] = null;
      }
    });
    
    // 将四孔灯检查的平铺字段组装成four_hole_lamp_list数组
    buildFourHoleLampArray(newVal);
    
    emit('update-record', newVal);
  }
}, { deep: true });

// 监听三级视功能选择，如果选择"无"或清空，则清空值输入框
watch(() => editForm.value?.synoptophore_level3_stereo, (newVal) => {
  if (newVal !== '有') {
    if (editForm.value) {
      editForm.value.synoptophore_level3_value = null;
    }
  }
});

// 远距离眼位方向和值
const farEyeDirection = computed({
  get() {
    const exo = editForm.value?.pli_exo_distance_lateral_phoria;
    const eso = editForm.value?.plo_eso_distance_lateral_phoria;
    // exo/eso 含 '' 表示已选外/内但尚未填数，须保留；仅字面量 '0' 表示无按钮时填 0 的正位
    if (exo !== null && exo !== undefined) {
      if (exo === '0' && (eso === null || eso === undefined)) {
        return undefined;
      }
      return '外';
    }
    if (eso !== null && eso !== undefined) {
      if (eso === '0' && (exo === null || exo === undefined)) {
        return undefined;
      }
      return '内';
    }
    return undefined;
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    if (!val || val === null || val === undefined) {
      editForm.value.pli_exo_distance_lateral_phoria = null;
      editForm.value.plo_eso_distance_lateral_phoria = null;
    } else if (val === '正') {
      editForm.value.pli_exo_distance_lateral_phoria = null;
      editForm.value.plo_eso_distance_lateral_phoria = null;
    } else if (val === '外') {
      const currentValue = farEyeValue.value;
      // 即使没有数值，也要保存方向标记，使用空字符串或0来标记方向已选择
      if (currentValue !== null && currentValue !== undefined) {
        editForm.value.pli_exo_distance_lateral_phoria = `+${currentValue.toString().replace(/^[+\-]/, '')}`;
      } else {
        // 如果只有方向没有数值，保存一个空字符串标记，这样查看时也能识别方向
        editForm.value.pli_exo_distance_lateral_phoria = '';
      }
      editForm.value.plo_eso_distance_lateral_phoria = null;
    } else if (val === '内') {
      const currentValue = farEyeValue.value;
      if (currentValue !== null && currentValue !== undefined) {
        editForm.value.plo_eso_distance_lateral_phoria = `+${currentValue.toString().replace(/^[+\-]/, '')}`;
      } else {
        editForm.value.plo_eso_distance_lateral_phoria = '';
      }
      editForm.value.pli_exo_distance_lateral_phoria = null;
    }
  }
});

const farEyeValue = computed({
  get() {
    if (!editForm.value) return null;
    const exo = editForm.value.pli_exo_distance_lateral_phoria;
    const eso = editForm.value.plo_eso_distance_lateral_phoria;
    // 如果字段存在但值为空字符串，返回 null（表示方向已选择但数值未输入）
    if (exo !== null && exo !== undefined && exo !== '') {
      const num = parseFloat(exo.toString().replace(/^\+/, ''));
      return isNaN(num) ? null : num;
    }
    if (eso !== null && eso !== undefined && eso !== '') {
      const num = parseFloat(eso.toString().replace(/^\+/, ''));
      return isNaN(num) ? null : num;
    }
    return null;
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    if (!val && val !== 0) {
      // 如果清除数值，但方向已选择，保留方向标记（空字符串）
      const direction = farEyeDirection.value;
      if (direction === '外') {
        editForm.value.pli_exo_distance_lateral_phoria = '';
        editForm.value.plo_eso_distance_lateral_phoria = null;
      } else if (direction === '内') {
        editForm.value.plo_eso_distance_lateral_phoria = '';
        editForm.value.pli_exo_distance_lateral_phoria = null;
      } else {
        editForm.value.pli_exo_distance_lateral_phoria = null;
        editForm.value.plo_eso_distance_lateral_phoria = null;
      }
      return;
    }
    const num = val.toString().replace(/^[+\-]/, '');
    const direction = farEyeDirection.value;
    if (direction === '外') {
      editForm.value.pli_exo_distance_lateral_phoria = `+${num}`;
      editForm.value.plo_eso_distance_lateral_phoria = null;
    } else if (direction === '内') {
      editForm.value.plo_eso_distance_lateral_phoria = `+${num}`;
      editForm.value.pli_exo_distance_lateral_phoria = null;
    } else {
      // 未选外/内：仅 0 存为字面量正位，其它非空不保存（清空）
      if (val === 0 && num === '0') {
        editForm.value.pli_exo_distance_lateral_phoria = '0';
        editForm.value.plo_eso_distance_lateral_phoria = null;
      } else {
        editForm.value.pli_exo_distance_lateral_phoria = null;
        editForm.value.plo_eso_distance_lateral_phoria = null;
      }
    }
  }
});

// 近距离眼位方向和值
const nearEyeDirection = computed({
  get() {
    const exo = editForm.value?.pli_exo_near_lateral_phoria;
    const eso = editForm.value?.plo_eso_near_lateral_phoria;
    if (exo !== null && exo !== undefined) {
      if (exo === '0' && (eso === null || eso === undefined)) {
        return undefined;
      }
      return '外';
    }
    if (eso !== null && eso !== undefined) {
      if (eso === '0' && (exo === null || exo === undefined)) {
        return undefined;
      }
      return '内';
    }
    return undefined;
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    if (!val || val === null || val === undefined) {
      editForm.value.pli_exo_near_lateral_phoria = null;
      editForm.value.plo_eso_near_lateral_phoria = null;
    } else if (val === '正') {
      editForm.value.pli_exo_near_lateral_phoria = null;
      editForm.value.plo_eso_near_lateral_phoria = null;
    } else if (val === '外') {
      const currentValue = nearEyeValue.value;
      if (currentValue !== null && currentValue !== undefined) {
        editForm.value.pli_exo_near_lateral_phoria = `+${currentValue.toString().replace(/^[+\-]/, '')}`;
      } else {
        editForm.value.pli_exo_near_lateral_phoria = '';
      }
      editForm.value.plo_eso_near_lateral_phoria = null;
    } else if (val === '内') {
      const currentValue = nearEyeValue.value;
      if (currentValue !== null && currentValue !== undefined) {
        editForm.value.plo_eso_near_lateral_phoria = `+${currentValue.toString().replace(/^[+\-]/, '')}`;
      } else {
        editForm.value.plo_eso_near_lateral_phoria = '';
      }
      editForm.value.pli_exo_near_lateral_phoria = null;
    }
  }
});

const nearEyeValue = computed({
  get() {
    if (!editForm.value) return null;
    const exo = editForm.value.pli_exo_near_lateral_phoria;
    const eso = editForm.value.plo_eso_near_lateral_phoria;
    // 如果字段存在但值为空字符串，返回 null（表示方向已选择但数值未输入）
    if (exo !== null && exo !== undefined && exo !== '') {
      const num = parseFloat(exo.toString().replace(/^\+/, ''));
      return isNaN(num) ? null : num;
    }
    if (eso !== null && eso !== undefined && eso !== '') {
      const num = parseFloat(eso.toString().replace(/^\+/, ''));
      return isNaN(num) ? null : num;
    }
    return null;
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    if (!val && val !== 0) {
      // 如果清除数值，但方向已选择，保留方向标记（空字符串）
      const direction = nearEyeDirection.value;
      if (direction === '外') {
        editForm.value.pli_exo_near_lateral_phoria = '';
        editForm.value.plo_eso_near_lateral_phoria = null;
      } else if (direction === '内') {
        editForm.value.plo_eso_near_lateral_phoria = '';
        editForm.value.pli_exo_near_lateral_phoria = null;
      } else {
        editForm.value.pli_exo_near_lateral_phoria = null;
        editForm.value.plo_eso_near_lateral_phoria = null;
      }
      return;
    }
    const num = val.toString().replace(/^[+\-]/, '');
    const direction = nearEyeDirection.value;
    if (direction === '外') {
      editForm.value.pli_exo_near_lateral_phoria = `+${num}`;
      editForm.value.plo_eso_near_lateral_phoria = null;
    } else if (direction === '内') {
      editForm.value.plo_eso_near_lateral_phoria = `+${num}`;
      editForm.value.pli_exo_near_lateral_phoria = null;
    } else {
      if (val === 0 && num === '0') {
        editForm.value.pli_exo_near_lateral_phoria = '0';
        editForm.value.plo_eso_near_lateral_phoria = null;
      } else {
        editForm.value.pli_exo_near_lateral_phoria = null;
        editForm.value.plo_eso_near_lateral_phoria = null;
      }
    }
  }
});

/** 垂直眼位：存库为 右高/左高（或历史 右/左），界面按钮与回显统一为 右/左 */
function verticalDirStoredToUi(stored) {
  if (stored === '右高' || stored === '右') return '右';
  if (stored === '左高' || stored === '左') return '左';
  return stored;
}
function verticalDirUiToStored(ui) {
  if (ui === '右') return '右高';
  if (ui === '左') return '左高';
  return ui;
}

// 远距离垂直眼位方向和值
// 兼容后端字段 vertical_eye_position_far 和旧字段
const farVerticalEyeDirection = computed({
  get() {
    if (!editForm.value) return undefined;
    // 优先从后端字段 vertical_eye_position_far 读取，如果没有则从旧字段读取
    const direction = editForm.value.vertical_eye_position_far ||
                      editForm.value.fusional_convergence_distance_vertical_direction ||
                      editForm.value.far_vertical_eye_direction;
    // 无数据时返回 undefined，选择框为空（不默认「正位」）
    if (direction === null || direction === undefined || direction === '') return undefined;
    return verticalDirStoredToUi(direction);
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    // 仅清除（allowClear）时清空；选「正位」须保存字符串，否则 getter 得到 null 下拉无法回显
    if (val === null || val === undefined) {
      editForm.value.vertical_eye_position_far = null;
      editForm.value.fusional_convergence_distance_vertical_direction = null;
      editForm.value.far_vertical_eye_direction = null;
      editForm.value.vertical_eye_position_far_value = null;
      editForm.value.far_vertical_eye_break = null;
      return;
    }
    const toStore = verticalDirUiToStored(val);
    const prev = editForm.value.vertical_eye_position_far ||
      editForm.value.fusional_convergence_distance_vertical_direction ||
      editForm.value.far_vertical_eye_direction;
    editForm.value.vertical_eye_position_far = toStore;
    editForm.value.fusional_convergence_distance_vertical_direction = toStore;
    editForm.value.far_vertical_eye_direction = toStore;
    if (prev === '正位' && (toStore === '右高' || toStore === '左高')) {
      editForm.value.vertical_eye_position_far_value = null;
      editForm.value.far_vertical_eye_break = null;
    }
  }
});

// 兼容后端字段 vertical_eye_position_far_value 和旧字段
const farVerticalEyeBreak = computed({
  get() {
    if (!editForm.value) return null;
    const rawDir = editForm.value.vertical_eye_position_far ||
      editForm.value.fusional_convergence_distance_vertical_direction ||
      editForm.value.far_vertical_eye_direction;
    if (rawDir === '正位') {
      const v = editForm.value.vertical_eye_position_far_value ?? editForm.value.far_vertical_eye_break;
      if (v === null || v === undefined || v === '') return 0;
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      return isNaN(n) ? 0 : n;
    }
    return editForm.value.vertical_eye_position_far_value ||
      editForm.value.far_vertical_eye_break ||
      null;
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    const rawDir = editForm.value.vertical_eye_position_far ||
      editForm.value.fusional_convergence_distance_vertical_direction ||
      editForm.value.far_vertical_eye_direction;

    if (!val && val !== 0) {
      if (rawDir === '正位') {
        editForm.value.vertical_eye_position_far = null;
        editForm.value.fusional_convergence_distance_vertical_direction = null;
        editForm.value.far_vertical_eye_direction = null;
        editForm.value.vertical_eye_position_far_value = null;
        editForm.value.far_vertical_eye_break = null;
      } else if (rawDir === '右高' || rawDir === '左高') {
        editForm.value.vertical_eye_position_far_value = null;
        editForm.value.far_vertical_eye_break = null;
      } else {
        editForm.value.vertical_eye_position_far_value = null;
        editForm.value.far_vertical_eye_break = null;
      }
      return;
    }

    if (val === 0) {
      if (!rawDir || rawDir === '') {
        editForm.value.vertical_eye_position_far = '正位';
        editForm.value.fusional_convergence_distance_vertical_direction = '正位';
        editForm.value.far_vertical_eye_direction = '正位';
        editForm.value.vertical_eye_position_far_value = null;
        editForm.value.far_vertical_eye_break = null;
        return;
      }
      if (rawDir === '正位') {
        editForm.value.vertical_eye_position_far_value = null;
        editForm.value.far_vertical_eye_break = null;
        return;
      }
      editForm.value.vertical_eye_position_far_value = val;
      editForm.value.far_vertical_eye_break = val;
      return;
    }

    const uiDir = verticalDirStoredToUi(rawDir);
    if (uiDir === '右' || uiDir === '左') {
      editForm.value.vertical_eye_position_far_value = val;
      editForm.value.far_vertical_eye_break = val;
      return;
    }

    editForm.value.vertical_eye_position_far_value = null;
    editForm.value.far_vertical_eye_break = null;
  }
});

const farVerticalEyeRecovery = computed({
  get() {
    return editForm.value.far_vertical_eye_recovery || null;
  },
  set(val) {
    editForm.value.far_vertical_eye_recovery = val;
  }
});

// 近距离垂直眼位方向和值
// 兼容后端字段 vertical_eye_position_near 和旧字段
const nearVerticalEyeDirection = computed({
  get() {
    if (!editForm.value) return undefined;
    const direction = editForm.value.vertical_eye_position_near ||
                      editForm.value.fusional_convergence_near_vertical_direction ||
                      editForm.value.near_vertical_eye_direction;
    if (direction === null || direction === undefined || direction === '') return undefined;
    return verticalDirStoredToUi(direction);
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    if (val === null || val === undefined) {
      editForm.value.vertical_eye_position_near = null;
      editForm.value.fusional_convergence_near_vertical_direction = null;
      editForm.value.near_vertical_eye_direction = null;
      editForm.value.vertical_eye_position_near_value = null;
      editForm.value.near_vertical_eye_break = null;
      return;
    }
    const toStore = verticalDirUiToStored(val);
    const prev = editForm.value.vertical_eye_position_near ||
      editForm.value.fusional_convergence_near_vertical_direction ||
      editForm.value.near_vertical_eye_direction;
    editForm.value.vertical_eye_position_near = toStore;
    editForm.value.fusional_convergence_near_vertical_direction = toStore;
    editForm.value.near_vertical_eye_direction = toStore;
    if (prev === '正位' && (toStore === '右高' || toStore === '左高')) {
      editForm.value.vertical_eye_position_near_value = null;
      editForm.value.near_vertical_eye_break = null;
    }
  }
});

// 兼容后端字段 vertical_eye_position_near_value 和旧字段
const nearVerticalEyeBreak = computed({
  get() {
    if (!editForm.value) return null;
    const rawDir = editForm.value.vertical_eye_position_near ||
      editForm.value.fusional_convergence_near_vertical_direction ||
      editForm.value.near_vertical_eye_direction;
    if (rawDir === '正位') {
      const v = editForm.value.vertical_eye_position_near_value ?? editForm.value.near_vertical_eye_break;
      if (v === null || v === undefined || v === '') return 0;
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      return isNaN(n) ? 0 : n;
    }
    return editForm.value.vertical_eye_position_near_value ||
      editForm.value.near_vertical_eye_break ||
      null;
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    const rawDir = editForm.value.vertical_eye_position_near ||
      editForm.value.fusional_convergence_near_vertical_direction ||
      editForm.value.near_vertical_eye_direction;

    if (!val && val !== 0) {
      if (rawDir === '正位') {
        editForm.value.vertical_eye_position_near = null;
        editForm.value.fusional_convergence_near_vertical_direction = null;
        editForm.value.near_vertical_eye_direction = null;
        editForm.value.vertical_eye_position_near_value = null;
        editForm.value.near_vertical_eye_break = null;
      } else if (rawDir === '右高' || rawDir === '左高') {
        editForm.value.vertical_eye_position_near_value = null;
        editForm.value.near_vertical_eye_break = null;
      } else {
        editForm.value.vertical_eye_position_near_value = null;
        editForm.value.near_vertical_eye_break = null;
      }
      return;
    }

    if (val === 0) {
      if (!rawDir || rawDir === '') {
        editForm.value.vertical_eye_position_near = '正位';
        editForm.value.fusional_convergence_near_vertical_direction = '正位';
        editForm.value.near_vertical_eye_direction = '正位';
        editForm.value.vertical_eye_position_near_value = null;
        editForm.value.near_vertical_eye_break = null;
        return;
      }
      if (rawDir === '正位') {
        editForm.value.vertical_eye_position_near_value = null;
        editForm.value.near_vertical_eye_break = null;
        return;
      }
      editForm.value.vertical_eye_position_near_value = val;
      editForm.value.near_vertical_eye_break = val;
      return;
    }

    const uiDir = verticalDirStoredToUi(rawDir);
    if (uiDir === '右' || uiDir === '左') {
      editForm.value.vertical_eye_position_near_value = val;
      editForm.value.near_vertical_eye_break = val;
      return;
    }

    editForm.value.vertical_eye_position_near_value = null;
    editForm.value.near_vertical_eye_break = null;
  }
});

const nearVerticalEyeRecovery = computed({
  get() {
    return editForm.value.near_vertical_eye_recovery || null;
  },
  set(val) {
    editForm.value.near_vertical_eye_recovery = val;
  }
});

/** 眼位方向清空（供切换逻辑复用） */
function clearFarEyeDirection() {
  farEyeDirection.value = undefined;
}
function clearNearEyeDirection() {
  nearEyeDirection.value = undefined;
}
function clearFarVerticalEyeDirection() {
  farVerticalEyeDirection.value = undefined;
}
function clearNearVerticalEyeDirection() {
  nearVerticalEyeDirection.value = undefined;
}

/** 外/内、右/左（存库 右高/左高）：点选切换，再次点击已选项则取消（正/正位由数据回显，无单独按钮） */
function toggleFarEyeDirection(val) {
  if (farEyeDirection.value === val) {
    clearFarEyeDirection();
  } else {
    farEyeDirection.value = val;
  }
}
function toggleNearEyeDirection(val) {
  if (nearEyeDirection.value === val) {
    clearNearEyeDirection();
  } else {
    nearEyeDirection.value = val;
  }
}
function toggleFarVerticalEyeDirection(val) {
  if (farVerticalEyeDirection.value === val) {
    clearFarVerticalEyeDirection();
  } else {
    farVerticalEyeDirection.value = val;
  }
}
function toggleNearVerticalEyeDirection(val) {
  if (nearVerticalEyeDirection.value === val) {
    clearNearVerticalEyeDirection();
  } else {
    nearVerticalEyeDirection.value = val;
  }
}

// 正相对调节 - 模糊点（输入框显示绝对值，存储负值）
const positiveRelativeAccommodationBlur = computed({
  get() {
    if (!editForm.value) return null;
    const value = editForm.value.positive_relative_accommodation_blur;
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return null;
    // 如果是负值，返回绝对值；如果是正值，也返回绝对值（统一显示绝对值）
    return Math.abs(num);
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    if (val === null || val === undefined || val === '') {
      editForm.value.positive_relative_accommodation_blur = null;
    } else {
      // 存储为负值
      editForm.value.positive_relative_accommodation_blur = -Math.abs(val);
    }
  }
});

// 正相对调节 - 恢复点（输入框显示绝对值，存储负值）
const positiveRelativeAccommodationRecovery = computed({
  get() {
    if (!editForm.value) return null;
    const value = editForm.value.positive_relative_accommodation_recovery;
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return null;
    // 如果是负值，返回绝对值；如果是正值，也返回绝对值（统一显示绝对值）
    return Math.abs(num);
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    if (val === null || val === undefined || val === '') {
      editForm.value.positive_relative_accommodation_recovery = null;
    } else {
      // 存储为负值
      editForm.value.positive_relative_accommodation_recovery = -Math.abs(val);
    }
  }
});

// 负相对调节 - 模糊点（输入框显示绝对值，存储正值）
const negativeRelativeAccommodationBlur = computed({
  get() {
    if (!editForm.value) return null;
    const value = editForm.value.negative_relative_accommodation_blur;
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return null;
    // 返回绝对值（输入框显示绝对值）
    return Math.abs(num);
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    if (val === null || val === undefined || val === '') {
      editForm.value.negative_relative_accommodation_blur = null;
    } else {
      // 存储为正值
      editForm.value.negative_relative_accommodation_blur = Math.abs(val);
    }
  }
});

// 负相对调节 - 恢复点（输入框显示绝对值，存储正值）
const negativeRelativeAccommodationRecovery = computed({
  get() {
    if (!editForm.value) return null;
    const value = editForm.value.negative_relative_accommodation_recovery;
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return null;
    // 返回绝对值（输入框显示绝对值）
    return Math.abs(num);
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    if (val === null || val === undefined || val === '') {
      editForm.value.negative_relative_accommodation_recovery = null;
    } else {
      // 存储为正值
      editForm.value.negative_relative_accommodation_recovery = Math.abs(val);
    }
  }
});

/** 调节灵敏度检查参数：检查光度 / 检查视标（按钮式选项） */
const accommodationSensitivityLensOptions = ['±2.00D', '±1.50D', '±1.00D'];
const accommodationSensitivityVisionOptions = ['20/30', '20/40', '20/50'];
/** 调节灵敏度「通过情况」：+ / - / ±，点选切换，再次点击同选项取消 */
const accommodationPassSymbols = ['+', '-', '±'];
const accommodationSensitivityPassSides = [
  { key: 'right', label: '右' },
  { key: 'left', label: '左' },
  { key: 'both', label: '双' }
];

// 调节灵敏度 - 屈光度选择（±1.00D/±1.50D/±2.00D）
// 兼容旧字段 accommodation_sensitivity_diopter 和新字段 accommodation_sensitivity_lens_power
const accommodationSensitivityDiopter = computed({
  get() {
    if (!editForm.value) return '±2.00D';
    // 优先读取新字段，如果没有则读取旧字段
    return editForm.value.accommodation_sensitivity_lens_power || 
           editForm.value.accommodation_sensitivity_diopter || 
           '±2.00D';
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    const value = val || '±2.00D';
    // 同时保存到新字段和旧字段（兼容性）
    editForm.value.accommodation_sensitivity_lens_power = value;
    editForm.value.accommodation_sensitivity_diopter = value;
  }
});

// 调节灵敏度 - 视力选择（20/30, 20/40, 20/50）
// 兼容旧字段 accommodation_sensitivity_vision 和新字段 accommodation_sensitivity_target
const accommodationSensitivityVision = computed({
  get() {
    if (!editForm.value) return '20/30';
    // 优先读取新字段，如果没有则读取旧字段
    return editForm.value.accommodation_sensitivity_target || 
           editForm.value.accommodation_sensitivity_vision || 
           '20/30';
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    const value = val || '20/30';
    // 同时保存到新字段和旧字段（兼容性）
    editForm.value.accommodation_sensitivity_target = value;
    editForm.value.accommodation_sensitivity_vision = value;
  }
});

function setAccommodationSensitivityLens(opt) {
  accommodationSensitivityDiopter.value = opt;
}

function setAccommodationSensitivityVision(opt) {
  accommodationSensitivityVision.value = opt;
}

function getAccommodationSensitivityPass(side) {
  if (!editForm.value) return null;
  const k = `accommodation_sensitivity_pass_${side}`;
  return editForm.value[k] ?? null;
}

function toggleAccommodationSensitivityPass(side, sym) {
  if (!editForm.value) editForm.value = {};
  const k = `accommodation_sensitivity_pass_${side}`;
  const cur = editForm.value[k];
  editForm.value[k] = cur === sym ? null : sym;
}

/** 调节幅度检查方式：推近法 / 负镜片法，点选切换，再点同一项取消 */
const accommodationAmplitudeStyleOptions = ['推近法', '负镜片法'];

/** 无保存文本时，由数值生成默认展示串（老数据） */
function formatReactionSignedDisplay(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  const neg = n < 0;
  const a = Math.abs(n);
  if (a === 0 || Object.is(a, 0)) {
    return neg ? '-0' : '+0';
  }
  const body = parseFloat(a.toPrecision(15)).toString();
  return neg ? `-${body}` : `+${body}`;
}

function getSignedReactionNFromFormData(data, side) {
  if (!data) return null;
  if (side === 'right') {
    const v = data.fused_cross_cylinder_right;
    if (v !== null && v !== undefined && v !== '') {
      const p = typeof v === 'number' ? v : parseFloat(v);
      if (!isNaN(p)) return p;
    }
    if (data.accommodation_mem_right_value !== null && data.accommodation_mem_right_value !== undefined && data.accommodation_mem_right_value !== '') {
      const abs = Math.abs(parseFloat(data.accommodation_mem_right_value));
      if (isNaN(abs)) return null;
      return data.accommodation_mem_right_sign === '-' ? -abs : abs;
    }
  } else if (side === 'left') {
    const v = data.fused_cross_cylinder_left;
    if (v !== null && v !== undefined && v !== '') {
      const p = typeof v === 'number' ? v : parseFloat(v);
      if (!isNaN(p)) return p;
    }
    if (data.accommodation_mem_left_value !== null && data.accommodation_mem_left_value !== undefined && data.accommodation_mem_left_value !== '') {
      const abs = Math.abs(parseFloat(data.accommodation_mem_left_value));
      if (isNaN(abs)) return null;
      return data.accommodation_mem_left_sign === '-' ? -abs : abs;
    }
  } else if (side === 'both') {
    const v = data.fused_cross_cylinder_both;
    if (v !== null && v !== undefined && v !== '') {
      const p = typeof v === 'number' ? v : parseFloat(v);
      if (!isNaN(p)) return p;
    }
    if (data.accommodation_amplitude_bcc_style !== null && data.accommodation_amplitude_bcc_style !== undefined && data.accommodation_amplitude_bcc_style !== '') {
      const abs = Math.abs(parseFloat(data.accommodation_amplitude_bcc_style));
      if (isNaN(abs)) return null;
      return data.accommodation_bcc_sign === '-' ? -abs : abs;
    }
  }
  return null;
}

/** 载入记录：若无原始输入文本，则用数值生成一格内展示（不覆盖已有 text） */
function ensureReactionDisplayText(data) {
  if (!data) return;
  const rows = [
    { textKey: 'accommodation_mem_right_text', side: 'right' },
    { textKey: 'accommodation_mem_left_text', side: 'left' },
    { textKey: 'accommodation_mem_bcc_text', side: 'both' }
  ];
  for (const { textKey, side } of rows) {
    const existing = data[textKey];
    if (existing !== null && existing !== undefined && String(existing).trim() !== '') continue;
    const n = getSignedReactionNFromFormData(data, side);
    if (n !== null && !Number.isNaN(n)) {
      data[textKey] = formatReactionSignedDisplay(n);
    }
  }
}

/** 未完成的小数输入（如 +0. ）不解析，避免误写成 0 */
function isIncompleteReactionText(raw) {
  const s = String(raw ?? '').trim();
  if (s === '' || s === '+' || s === '-') return true;
  if (/^[+\-]?\d+\.$/.test(s)) return true;
  return false;
}

/** 从文本解析并写回数值字段（供保存/计算）；保留 text 不动 */
function syncReactionNumericFromText(side) {
  if (!editForm.value || isUpdatingFromRecord) return;
  const map = {
    right: {
      textKey: 'accommodation_mem_right_text',
      valueKey: 'accommodation_mem_right_value',
      signKey: 'accommodation_mem_right_sign',
      fusedKey: 'fused_cross_cylinder_right'
    },
    left: {
      textKey: 'accommodation_mem_left_text',
      valueKey: 'accommodation_mem_left_value',
      signKey: 'accommodation_mem_left_sign',
      fusedKey: 'fused_cross_cylinder_left'
    },
    both: {
      textKey: 'accommodation_mem_bcc_text',
      valueKey: 'accommodation_amplitude_bcc_style',
      signKey: 'accommodation_bcc_sign',
      fusedKey: 'fused_cross_cylinder_both'
    }
  };
  const m = map[side];
  const raw = editForm.value[m.textKey];
  const t = raw === null || raw === undefined ? '' : String(raw).trim();
  if (t === '') {
    editForm.value[m.valueKey] = null;
    editForm.value[m.signKey] = null;
    editForm.value[m.fusedKey] = null;
    return;
  }
  if (isIncompleteReactionText(t)) return;
  const n = parseFloat(t.replace(/^\+/, ''));
  if (Number.isNaN(n)) return;
  const abs = Math.abs(n);
  editForm.value[m.valueKey] = abs;
  editForm.value[m.signKey] = n < 0 ? '-' : '+';
  editForm.value[m.fusedKey] = n;
}

function syncAllReactionNumericFromText() {
  ['right', 'left', 'both'].forEach((s) => syncReactionNumericFromText(s));
}

function toggleAccommodationAmplitudeStyle(value) {
  if (!editForm.value) editForm.value = {};
  const cur = editForm.value.accommodation_amplitude_style;
  editForm.value.accommodation_amplitude_style = cur === value ? null : value;
}

function formatAccommodationPassDisplay(v) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}

function formatRecordAccommodationPass(rec, side) {
  if (!rec) return '—';
  return formatAccommodationPassDisplay(rec[`accommodation_sensitivity_pass_${side}`]);
}

// 调节灵敏度 - 右眼（兼容旧字段和新字段）
const accommodationSensitivityRight = computed({
  get() {
    if (!editForm.value) return null;
    // 优先读取新字段，如果没有则读取旧字段
    return editForm.value.accommodation_sensitivity_right_value || 
           editForm.value.accommodation_sensitivity_right || 
           null;
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    // 同时保存到新字段和旧字段（兼容性）
    editForm.value.accommodation_sensitivity_right_value = val;
    editForm.value.accommodation_sensitivity_right = val;
  }
});

// 调节灵敏度 - 左眼（兼容旧字段和新字段）
const accommodationSensitivityLeft = computed({
  get() {
    if (!editForm.value) return null;
    // 优先读取新字段，如果没有则读取旧字段
    return editForm.value.accommodation_sensitivity_left_value || 
           editForm.value.accommodation_sensitivity_left || 
           null;
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    // 同时保存到新字段和旧字段（兼容性）
    editForm.value.accommodation_sensitivity_left_value = val;
    editForm.value.accommodation_sensitivity_left = val;
  }
});

// 调节灵敏度 - 双眼（兼容旧字段和新字段）
const accommodationSensitivityBoth = computed({
  get() {
    if (!editForm.value) return null;
    // 优先读取新字段，如果没有则读取旧字段
    return editForm.value.accommodation_sensitivity_both_value || 
           editForm.value.accommodation_sensitivity_both || 
           null;
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    // 同时保存到新字段和旧字段（兼容性）
    editForm.value.accommodation_sensitivity_both_value = val;
    editForm.value.accommodation_sensitivity_both = val;
  }
});

// 判断字段是否有值（包括0值）
const hasFieldValue = (value) => {
  return value !== null && value !== undefined && value !== '';
};

// 判断各板块是否有数据
const hasEyePositionData = computed(() => {
  const record = props.record;
  if (!record) return false;
  return (
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
    hasFieldValue(record.vertical_eye_position_far) || hasFieldValue(record.vertical_eye_position_near) ||
    hasFieldValue(record.vertical_eye_position_far_value) || hasFieldValue(record.vertical_eye_position_near_value) ||
    hasFieldValue(record.fusional_convergence_distance_vertical_direction) || hasFieldValue(record.fusional_convergence_near_vertical_direction) ||
    hasFieldValue(record.fusional_vertical_up_distance_break) || hasFieldValue(record.fusional_vertical_up_near_break) ||
    hasFieldValue(record.fusional_vertical_down_distance_break) || hasFieldValue(record.fusional_vertical_down_near_break)
  );
});

const hasACACAData = computed(() => {
  const record = props.record;
  if (!record) return false;
  // 计算性AC/A是自动计算的，只要有眼位数据就可以显示
  // 检查是否有梯度型AC/A或CA/C数据，或者有眼位数据（可以计算计算性AC/A）
  const hasGradientOrCAC = hasFieldValue(record.ac_a_gradient_ratio_plus) || 
                           hasFieldValue(record.ac_a_gradient_ratio_minus) || 
                           hasFieldValue(record.ac_a_gradient_ratio_average) || 
                           hasFieldValue(record.ca_c_ratio);
  // 检查是否有眼位数据（用于计算计算性AC/A）
  const hasEyePositionForCalculation = hasFieldValue(record.pli_exo_distance_lateral_phoria) || 
                                        hasFieldValue(record.plo_eso_distance_lateral_phoria) ||
                                        hasFieldValue(record.pli_exo_near_lateral_phoria) || 
                                        hasFieldValue(record.plo_eso_near_lateral_phoria);
  return hasGradientOrCAC || hasEyePositionForCalculation;
});

const hasAccommodationData = computed(() => {
  const record = props.record;
  if (!record) return false;
  return (
    hasFieldValue(record.positive_relative_accommodation_blur) || hasFieldValue(record.positive_relative_accommodation_recovery) ||
    hasFieldValue(record.negative_relative_accommodation_blur) || hasFieldValue(record.negative_relative_accommodation_recovery) ||
    hasFieldValue(record.accommodative_amplitude_right) || hasFieldValue(record.accommodative_amplitude_left) ||
    hasFieldValue(record.accommodation_amplitude_style) ||
    hasFieldValue(record.accommodative_facility) || hasFieldValue(record.accommodative_response) ||
    hasFieldValue(record.accommodation_sensitivity_pass_right) || hasFieldValue(record.accommodation_sensitivity_pass_left) || hasFieldValue(record.accommodation_sensitivity_pass_both)
  );
});

const hasSynoptophoreData = computed(() => {
  const record = props.record;
  if (!record) return false;
  return (
    hasFieldValue(record.synoptophore_level1_sign) || hasFieldValue(record.synoptophore_level1_value) || 
    hasFieldValue(record.synoptophore_level2_positive) || hasFieldValue(record.synoptophore_level2_negative) ||
    hasFieldValue(record.synoptophore_level3_stereo) || hasFieldValue(record.synoptophore_level3_value)
  );
});

const hasOtherRelatedData = computed(() => {
  const record = props.record;
  if (!record) return false;
  return (
    hasFieldValue(record.worth_4_type) || hasFieldValue(record.stereopsis_testing) ||
    hasFieldValue(record.aniseikonia) ||
    // 四孔灯检查字段（新平铺字段）
    hasFieldValue(record.check_distance_2m) || hasFieldValue(record.check_distance_40cm) ||
    hasFieldValue(record.dominant_eye_color_2m) || hasFieldValue(record.dominant_eye_color_40cm) ||
    hasFieldValue(record.horizontal_option_2m) || hasFieldValue(record.vertical_option_2m) ||
    hasFieldValue(record.horizontal_option_40cm) || hasFieldValue(record.vertical_option_40cm) ||
    hasFieldValue(record.value) ||
    hasFieldValue(record.right_eye_suppression_type) || hasFieldValue(record.right_eye_suppression_distance) || hasFieldValue(record.right_eye_suppression_direction) ||
    hasFieldValue(record.left_eye_suppression_type) || hasFieldValue(record.left_eye_suppression_distance) || hasFieldValue(record.left_eye_suppression_direction) ||
    hasFieldValue(record.alternate_suppression_distance) || hasFieldValue(record.alternate_suppression_direction) ||
    // 四孔灯检查字段
    hasFieldValue(record.four_hole_lamp_2m) || hasFieldValue(record.four_hole_lamp_2m_dominant) ||
    hasFieldValue(record.four_hole_lamp_2m_horizontal) || hasFieldValue(record.four_hole_lamp_2m_vertical) ||
    hasFieldValue(record.four_hole_lamp_40cm) || hasFieldValue(record.four_hole_lamp_40cm_dominant) ||
    hasFieldValue(record.four_hole_lamp_40cm_horizontal) || hasFieldValue(record.four_hole_lamp_40cm_vertical) ||
    hasFieldValue(record.four_hole_lamp_suppression) || hasFieldValue(record.four_hole_lamp_suppression_2_type) ||
    hasFieldValue(record.four_hole_lamp_suppression_2_distance) || hasFieldValue(record.four_hole_lamp_suppression_2_direction) ||
    hasFieldValue(record.four_hole_lamp_suppression_3_type) || hasFieldValue(record.four_hole_lamp_suppression_3_distance) ||
    hasFieldValue(record.four_hole_lamp_suppression_3_direction) || hasFieldValue(record.four_hole_lamp_suppression_alternate_within_distance) ||
    hasFieldValue(record.four_hole_lamp_suppression_alternate_within_eye) ||
    hasSynoptophoreData.value ||
    !!(props.examinationRecords?.length && props.record?.id)
  );
});

// 判断是否有视功能数据
const hasFunctionalData = computed(() => {
  const record = props.record;
  if (!record) return false;
  return (
    hasEyePositionData.value || hasACACAData.value || hasAccommodationData.value || 
    hasOtherRelatedData.value
  );
});

// 格式化值，空值显示"-"表示未测，但0是有意义的，要保留
// 对于集合和散开字段，显示1位小数；其他字段显示整数
const formatValue = (value, isFusional = false) => {
  // 如果值为 null、undefined、空字符串、字符串 "null"/"undefined" 或仅空白，显示 "-" 表示未测
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string' && (value.trim() === '' || value.trim().toLowerCase() === 'null' || value.trim().toLowerCase() === 'undefined')) return '-';
  if (value === 'null' || value === 'undefined') return '-';
  // 如果是数字0，保留0（0是有意义的）
  if (typeof value === 'number' && value === 0) return isFusional ? '0.0' : 0;
  // 如果是数字，根据类型格式化
  if (typeof value === 'number') {
    return isFusional ? value.toFixed(1) : Math.round(value);
  }
  // 如果是字符串，尝试转换为数字（去除可能的+号）
  const num = parseFloat(value.toString().replace(/^\+/, ''));
  // 如果转换后是NaN，显示 "-" 表示未测
  if (isNaN(num)) return '-';
  return isFusional ? num.toFixed(1) : Math.round(num);
};

/** 调节灵敏度检查结果：数值后附 cpm */
function formatAccommodationSensitivityCpmDisplay(value) {
  const s = formatValue(value);
  if (s === '-') return '-';
  return `${s} cpm`;
}

// 格式化调节反应值：「+/-」+ 数值，不自动补全小数位
const formatReactionValue = (value, sign = null) => {
  if (value === null || value === undefined || value === '') return '-';
  const absNum = typeof value === 'number' ? Math.abs(value) : Math.abs(parseFloat(value));
  if (isNaN(absNum)) return '-';
  let n;
  if (sign === '+') n = absNum;
  else if (sign === '-') n = -absNum;
  else {
    const originalValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(originalValue)) return '-';
    n = originalValue;
  }
  return formatReactionSignedDisplay(n) ?? '-';
};

/** 查看态：优先显示用户保存的原始字符串（与输入一致） */
function displayReaction(record, side) {
  if (!record) return '-';
  const key =
    side === 'right' ? 'accommodation_mem_right_text' : side === 'left' ? 'accommodation_mem_left_text' : 'accommodation_mem_bcc_text';
  const text = record[key];
  if (text !== null && text !== undefined && String(text).trim() !== '') {
    return String(text).trim();
  }
  if (side === 'right') {
    return formatReactionValue(record.accommodation_mem_right_value || record.fused_cross_cylinder_right, record.accommodation_mem_right_sign);
  }
  if (side === 'left') {
    return formatReactionValue(record.accommodation_mem_left_value || record.fused_cross_cylinder_left, record.accommodation_mem_left_sign);
  }
  return formatReactionValue(record.accommodation_amplitude_bcc_style || record.fused_cross_cylinder_both, record.accommodation_bcc_sign);
}

// 格式化AC/A和CA/C比值：显示一位小数
const formatACACARatio = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '-';
  return num.toFixed(1);
};

// 解析眼位值：从字段中提取数值（考虑正负）
// 内隐斜（eso）为正值，外隐斜（exo）为负值
const parseEyePositionValue = (exoValue, esoValue) => {
  // 如果有外隐斜值，返回负数
  if (exoValue !== null && exoValue !== undefined && exoValue !== '') {
    const num = typeof exoValue === 'number' ? exoValue : parseFloat(exoValue.toString().replace(/^\+/, ''));
    if (!isNaN(num)) return -Math.abs(num);
  }
  // 如果有内隐斜值，返回正数
  if (esoValue !== null && esoValue !== undefined && esoValue !== '') {
    const num = typeof esoValue === 'number' ? esoValue : parseFloat(esoValue.toString().replace(/^\+/, ''));
    if (!isNaN(num)) return Math.abs(num);
  }
  return 0;
};

/** 计算性 AC/A 所用数据源：编辑态用 editForm，否则用 record */
function getRecordOrEditFormForACA() {
  return props.viewMode === 'edit' && editForm.value ? editForm.value : props.record;
}

/**
 * 仅主觉验光瞳距（mm）。与 objective_pupil_distance（电脑验光）、vaec_both_pupil_distance（旧镜等）独立，不做回退。
 */
function getSubjectivePupilDistanceMmForACA() {
  const src = getRecordOrEditFormForACA();
  if (!src) return null;
  const pd = src.subjective_both_pupil_distance;
  if (pd === null || pd === undefined || pd === '') return null;
  return pd;
}

/** 5m 或 40cm 水平眼位：外/内隐斜至少一侧已填且能解析为数值（含 0）则视为已输入 */
function hasHorizontalEyePositionInput(exoValue, esoValue) {
  const hasExo = exoValue !== null && exoValue !== undefined && exoValue !== '';
  const hasEso = esoValue !== null && esoValue !== undefined && esoValue !== '';
  if (!hasExo && !hasEso) return false;
  if (hasExo) {
    const n = typeof exoValue === 'number' ? exoValue : parseFloat(String(exoValue).replace(/^\+/, ''));
    if (!isNaN(n)) return true;
  }
  if (hasEso) {
    const n = typeof esoValue === 'number' ? esoValue : parseFloat(String(esoValue).replace(/^\+/, ''));
    if (!isNaN(n)) return true;
  }
  return false;
}

/**
 * 计算性 AC/A：仅当 ①5m 水平眼位 ②40cm 水平眼位 ③主觉验光瞳距 三者均已输入时才计算；否则为空。
 * 公式：主觉瞳距/10 + (近水平眼位 - 远水平眼位) / 2.5，瞳距只用 subjective_both_pupil_distance。
 */
const calculatedACARatio = computed(() => {
  const src = getRecordOrEditFormForACA();
  if (!src) return '';

  if (!hasHorizontalEyePositionInput(src.pli_exo_distance_lateral_phoria, src.plo_eso_distance_lateral_phoria)) {
    return '';
  }
  if (!hasHorizontalEyePositionInput(src.pli_exo_near_lateral_phoria, src.plo_eso_near_lateral_phoria)) {
    return '';
  }

  const pd = src.subjective_both_pupil_distance;
  if (pd === null || pd === undefined || pd === '') return '';

  const pdNum = typeof pd === 'number' ? pd : parseFloat(pd);
  if (isNaN(pdNum)) return '';

  const farEyeValue = parseEyePositionValue(
    src.pli_exo_distance_lateral_phoria,
    src.plo_eso_distance_lateral_phoria
  );
  const nearEyeValue = parseEyePositionValue(
    src.pli_exo_near_lateral_phoria,
    src.plo_eso_near_lateral_phoria
  );

  const result = pdNum / 10 + (nearEyeValue - farEyeValue) / 2.5;
  if (isNaN(result)) return '';

  return result.toFixed(1);
});

/** 计算性 AC/A 参考值：有主觉瞳距时为 瞳距/10 的数值；无主觉瞳距时显示公式文案「PD/10」（不用电脑/旧镜瞳距） */
const calculatedACARatioReference = computed(() => {
  const pd = getSubjectivePupilDistanceMmForACA();

  if (!pd || pd === null || pd === undefined || pd === '') {
    return 'PD/10';
  }

  const pdNum = typeof pd === 'number' ? pd : parseFloat(pd);
  if (isNaN(pdNum)) {
    return 'PD/10';
  }

  return (pdNum / 10).toFixed(1);
});

/** 参考值是否展示公式占位「PD/10」（无主觉瞳距数值时），用于斜体/浅底样式 */
const calculatedACARatioReferenceIsFormula = computed(() => {
  const pd = getSubjectivePupilDistanceMmForACA();
  if (!pd || pd === null || pd === undefined || pd === '') return true;
  const pdNum = typeof pd === 'number' ? pd : parseFloat(pd);
  return isNaN(pdNum);
});

// 格式化正负相对调节值：补充+号，显示为两位小数
const formatRelativeAccommodation = (value) => {
  // 如果值为null、undefined或空字符串，显示"-"
  if (value === null || value === undefined || value === '') return '-';
  // 转换为数字
  const num = typeof value === 'number' ? value : parseFloat(value.toString().replace(/^\+/, ''));
  // 如果转换后是NaN，返回"-"
  if (isNaN(num)) return '-';
  // 格式化为两位小数，正数前面加+号
  const formatted = num.toFixed(2);
  if (num >= 0) {
    return `+${formatted}`;
  }
  return formatted;
};

// 格式化眼位值，根据外隐斜和内隐斜字段显示
const formatEyePosition = (exo, eso) => {
  // 如果外隐斜有值，显示为"外  几"（两个空格）
  if (exo && exo !== null && exo !== undefined && exo !== '') {
    const num = parseFloat(exo.toString().replace(/^\+/, ''));
    if (!isNaN(num)) {
      return num === 0 ? '正' : `外  ${num}`;
    }
  }
  // 如果内隐斜有值，显示为"内  几"（两个空格）
  if (eso && eso !== null && eso !== undefined && eso !== '') {
    const num = parseFloat(eso.toString().replace(/^\+/, ''));
    if (!isNaN(num)) {
      return num === 0 ? '正' : `内  ${num}`;
    }
  }
  // 都没有值，显示"正"
  return '正';
};

// 格式化眼位值，带单位△下标；空值显示 "-" 表示未测
const formatEyePositionWithUnit = (exo, eso) => {
  const empty = (v) => v === null || v === undefined || v === '' || (typeof v === 'string' && v.trim() === '');
  // 如果外隐斜有值（包括空字符串，表示方向已选择但数值未输入）
  if (!empty(exo)) {
    const num = parseFloat(String(exo).replace(/^\+/, ''));
    if (!isNaN(num)) {
      return num === 0 ? '正' : `外 ${num}△`;
    }
    if (exo === '') return '外';
  }
  // 如果内隐斜有值（包括空字符串，表示方向已选择但数值未输入）
  if (!empty(eso)) {
    const num = parseFloat(String(eso).replace(/^\+/, ''));
    if (!isNaN(num)) {
      return num === 0 ? '正' : `内 ${num}△`;
    }
    if (eso === '') return '内';
  }
  // 都没有值（后端 null/空），显示 "-" 表示未测
  return '-';
};

// 垂直眼位方向展示：右高/左高 → 右/左
const formatVerticalDirLabel = (direction) => {
  if (direction === '右高' || direction === '右') return '右';
  if (direction === '左高' || direction === '左') return '左';
  return direction;
};

// 格式化垂直眼位值；空值显示 "-" 表示未测
const formatVerticalEyePosition = (direction, breakValue) => {
  const dirEmpty = direction === null || direction === undefined || direction === '' || (typeof direction === 'string' && direction.trim() === '');
  const breakEmpty = breakValue === null || breakValue === undefined || breakValue === '' || (typeof breakValue === 'string' && String(breakValue).trim() === '');
  // 方向为空且无破裂值：未测，显示 "-"
  if (dirEmpty && breakEmpty) return '-';
  // 如果方向为空、null、undefined 或空字符串，但破裂值有内容，仍显示 "-"（以方向为准表示未测）
  if (dirEmpty) return '-';
  // 如果方向是 '正位'，直接返回 '正位'
  if (direction === '正位') return '正位';
  const dirLabel = formatVerticalDirLabel(direction);
  // 如果有破裂值，显示方向和数值
  if (!breakEmpty) {
    const num = parseFloat(breakValue);
    if (!isNaN(num) && num !== 0) return `${dirLabel} ${num}△`;
  }
  // 如果只有方向没有数值，只显示方向（如「右」或「左」）
  return dirLabel;
};

// 格式化调节幅度值：显示两位小数，不显示符号
const formatAmplitudeValue = (value) => {
  // 如果值为null、undefined或空字符串，显示"-"
  if (value === null || value === undefined || value === '') return '-';
  // 转换为数字（去除可能的+号）
  const num = typeof value === 'number' ? value : parseFloat(value.toString().replace(/^\+/, ''));
  // 如果转换后是NaN，返回"-"
  if (isNaN(num)) return '-';
  // 格式化为两位小数，不显示符号
  return num.toFixed(2);
};

// 格式化调节幅度方法
const formatAmplitudeStyle = (value) => {
  if (!value || value === null || value === undefined || value === '') return '-';
  const styleMap = {
    '负镜片法': '负镜片法',
    '推近法': '推近法',
    '拉远法': '拉远法',
    '未测': '未测'
  };
  return styleMap[value] || value;
};

// 调节幅度参考值（Hoffstetter 最小值）：15-年龄/4，按年龄自动计算，展示为整数（D）
const getAmplitudeReference = () => {
  const rawBirth =
    props.patientInfo?.birth_date ?? props.patientInfo?.birthDate ?? props.patientInfo?.birthday;
  if (!props.patientInfo || !rawBirth) {
    return '15-年龄/4';
  }
  try {
    const birthDate = new Date(rawBirth);
    if (isNaN(birthDate.getTime())) {
      return '15-年龄/4';
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 0 || age > 150) {
      return '15-年龄/4';
    }
    const reference = 15 - age / 4;
    return `${Math.round(reference)}D`;
  } catch (e) {
    return '15-年龄/4';
  }
};

// 格式化Worth4点检查
const formatWorth4 = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return value;
};

// 格式化立体视检查
const formatStereopsis = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  
  // 处理字符串格式（NG）
  if (typeof value === 'string' && value === 'NG') {
    return 'NG';
  }
  
  // 处理数字格式（整数）
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (!isNaN(numValue)) {
    // 对于整数，添加单位 '
    return `${numValue}'`;
  }
  
  return value;
};

// 格式化不等像视检查
const formatAniseikonia = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  
  // 不等像视的映射
  const aniseikoniaMap = {
    '0': '无',
    '1': '存在',
    '2': '未测'
  };
  
  const strValue = String(value);
  return aniseikoniaMap[strValue] || value;
};

// 处理2m按钮点击（单选模式，但2m和40cm可以同时选择）
const handleFourHole2mClick = (value) => {
  // 如果点击的是已选中的选项，则取消选择
  if (editForm.value.check_distance_2m === value) {
    editForm.value.check_distance_2m = null;
    // 清除所有相关数据
    editForm.value.dominant_eye_color_2m = null;
    editForm.value.horizontal_option_2m = null;
    editForm.value.vertical_option_2m = null;
  } else {
    // 选择新选项，先清除2m相关数据
    editForm.value.dominant_eye_color_2m = null;
    editForm.value.horizontal_option_2m = null;
    editForm.value.vertical_option_2m = null;
    // 清除抑制部分的选择（抑制部分与2m/40cm互斥）
    editForm.value.value = null;
    editForm.value.right_eye_suppression_type = null;
    editForm.value.right_eye_suppression_distance = null;
    editForm.value.right_eye_suppression_direction = null;
    editForm.value.left_eye_suppression_type = null;
    editForm.value.left_eye_suppression_distance = null;
    editForm.value.left_eye_suppression_direction = null;
    editForm.value.alternate_suppression_distance = null;
    editForm.value.alternate_suppression_direction = null;
    // 设置新选项（不清除40cm，允许同时选择）
    editForm.value.check_distance_2m = value;
  }
};

// 处理40cm按钮点击（单选模式，但2m和40cm可以同时选择）
const handleFourHole40cmClick = (value) => {
  // 如果点击的是已选中的选项，则取消选择
  if (editForm.value.check_distance_40cm === value) {
    editForm.value.check_distance_40cm = null;
    // 清除所有相关数据
    editForm.value.dominant_eye_color_40cm = null;
    editForm.value.horizontal_option_40cm = null;
    editForm.value.vertical_option_40cm = null;
  } else {
    // 选择新选项，先清除40cm相关数据
    editForm.value.dominant_eye_color_40cm = null;
    editForm.value.horizontal_option_40cm = null;
    editForm.value.vertical_option_40cm = null;
    // 清除抑制部分的选择（抑制部分与2m/40cm互斥）
    editForm.value.value = null;
    editForm.value.right_eye_suppression_type = null;
    editForm.value.right_eye_suppression_distance = null;
    editForm.value.right_eye_suppression_direction = null;
    editForm.value.left_eye_suppression_type = null;
    editForm.value.left_eye_suppression_distance = null;
    editForm.value.left_eye_suppression_direction = null;
    editForm.value.alternate_suppression_distance = null;
    editForm.value.alternate_suppression_direction = null;
    // 设置新选项（不清除2m，允许同时选择）
    editForm.value.check_distance_40cm = value;
  }
};

// 格式化2m原始检查数据（用于检查结果列）
const formatFourHole2mRawData = (data) => {
  if (!data) return '-';
  const value = String(data.check_distance_2m || '');
  if (!value || value === 'null' || value === 'undefined' || value === '') {
    return '-';
  }
  
  const parts = [value];
  
  if (value === '4') {
    const dominant = data.dominant_eye_color_2m;
    if (dominant) {
      parts.push(dominant);
    }
  } else if (value === '5') {
    const horizontal = data.horizontal_option_2m;
    const vertical = data.vertical_option_2m;
    if (horizontal) {
      parts.push(horizontal);
    }
    if (vertical) {
      parts.push(formatVerticalDirLabel(vertical));
    }
  }
  
  return parts.join('，');
};

// 格式化2m结果（用于结果列，显示分析结果）
const formatFourHole2mResult = (data) => {
  if (!data) return '-';
  // 处理字符串和数字类型
  const value = String(data.check_distance_2m || '');
  // 调试：打印数据
  if (value && value !== 'null' && value !== 'undefined') {
    console.log('[formatFourHole2mResult] 数据:', { value, raw: data.check_distance_2m, dominant: data.dominant_eye_color_2m, horizontal: data.horizontal_option_2m, vertical: data.vertical_option_2m });
  }
  if (value === '5' || value === 5) {
    const results = [];
    const horizontal = data.horizontal_option_2m;
    const vertical = data.vertical_option_2m;
    
    if (horizontal === '左红右绿') {
      results.push('外斜：交叉复视');
    } else if (horizontal === '右红左绿') {
      results.push('内斜：非交叉复视');
    }
    
    if (vertical === '右高') {
      results.push('垂直斜：右眼高位');
    } else if (vertical === '左高') {
      results.push('垂直斜：左眼高位');
    }
    
    return results.length > 0 ? results.join(' ') : '5';
  }
  if (value === '4' || value === 4) {
    const dominant = data.dominant_eye_color_2m;
    if (dominant === '黄') return '双眼和谐';
    if (dominant === '红') return '优势眼：右眼';
    if (dominant === '绿') return '优势眼：左眼';
    if (dominant === '红绿交替') return '双眼竞争';
    return '4';
  }
  // 如果值存在但不是4或5，直接返回原值
  if (value && value !== 'null' && value !== 'undefined' && value !== '') {
    return String(value);
  }
  return '-';
};

// 格式化40cm原始检查数据（用于检查结果列）
const formatFourHole40cmRawData = (data) => {
  if (!data) return '-';
  const value = String(data.check_distance_40cm || '');
  if (!value || value === 'null' || value === 'undefined' || value === '') {
    return '-';
  }
  
  const parts = [value];
  
  if (value === '4') {
    const dominant = data.dominant_eye_color_40cm;
    if (dominant) {
      parts.push(dominant);
    }
  } else if (value === '5') {
    const horizontal = data.horizontal_option_40cm;
    const vertical = data.vertical_option_40cm;
    if (horizontal) {
      parts.push(horizontal);
    }
    if (vertical) {
      parts.push(formatVerticalDirLabel(vertical));
    }
  }
  
  return parts.join('，');
};

// 格式化40cm结果（用于结果列，显示分析结果）
const formatFourHole40cmResult = (data) => {
  if (!data) return '-';
  // 处理字符串和数字类型
  const value = String(data.check_distance_40cm || '');
  // 调试：打印数据
  if (value && value !== 'null' && value !== 'undefined') {
    console.log('[formatFourHole40cmResult] 数据:', { value, raw: data.check_distance_40cm, dominant: data.dominant_eye_color_40cm, horizontal: data.horizontal_option_40cm, vertical: data.vertical_option_40cm });
  }
  if (value === '5' || value === 5) {
    const results = [];
    const horizontal = data.horizontal_option_40cm;
    const vertical = data.vertical_option_40cm;
    
    if (horizontal === '左红右绿') {
      results.push('外斜：交叉复视');
    } else if (horizontal === '右红左绿') {
      results.push('内斜：非交叉复视');
    }
    
    if (vertical === '右高') {
      results.push('垂直斜：右眼高位');
    } else if (vertical === '左高') {
      results.push('垂直斜：左眼高位');
    }
    
    return results.length > 0 ? results.join(' ') : '5';
  }
  if (value === '4' || value === 4) {
    const dominant = data.dominant_eye_color_40cm;
    if (dominant === '黄') return '双眼和谐';
    if (dominant === '红') return '优势眼：右眼';
    if (dominant === '绿') return '优势眼：左眼';
    if (dominant === '红绿交替') return '双眼竞争';
    return '4';
  }
  // 如果值存在但不是4或5，直接返回原值
  if (value && value !== 'null' && value !== 'undefined' && value !== '') {
    return String(value);
  }
  return '-';
};

// 处理抑制按钮点击（单选模式）
const handleSuppressionClick = (value) => {
  // 如果点击的是已选中的选项，则取消选择
  if (editForm.value.value === value) {
    editForm.value.value = null;
    // 清除所有相关数据
    editForm.value.right_eye_suppression_type = null;
    editForm.value.right_eye_suppression_distance = null;
    editForm.value.right_eye_suppression_direction = null;
    editForm.value.left_eye_suppression_type = null;
    editForm.value.left_eye_suppression_distance = null;
    editForm.value.left_eye_suppression_direction = null;
    editForm.value.alternate_suppression_distance = null;
    editForm.value.alternate_suppression_direction = null;
  } else {
    // 选择新选项，先清除所有相关数据（包括抑制部分和2m、40cm）
    editForm.value.right_eye_suppression_type = null;
    editForm.value.right_eye_suppression_distance = null;
    editForm.value.right_eye_suppression_direction = null;
    editForm.value.left_eye_suppression_type = null;
    editForm.value.left_eye_suppression_distance = null;
    editForm.value.left_eye_suppression_direction = null;
    editForm.value.alternate_suppression_distance = null;
    editForm.value.alternate_suppression_direction = null;
    // 清除2m和40cm的选择
    editForm.value.check_distance_2m = null;
    editForm.value.dominant_eye_color_2m = null;
    editForm.value.horizontal_option_2m = null;
    editForm.value.vertical_option_2m = null;
    editForm.value.check_distance_40cm = null;
    editForm.value.dominant_eye_color_40cm = null;
    editForm.value.horizontal_option_40cm = null;
    editForm.value.vertical_option_40cm = null;
    // 设置新选项
    editForm.value.value = value;
  }
};

// 格式化抑制原始检查数据（用于检查结果列）
const formatSuppressionRawData = (data) => {
  if (!data) return '-';
  let value = String(data.value || '');
  if (!value || value === 'null' || value === 'undefined' || value === '') {
    return '-';
  }
  
  // 将"其他"转换为"交替"用于显示
  if (value === '其他') {
    value = '交替';
  }
  
  const parts = [value];
  
  if (value === '交替') {
    const distance = data.alternate_suppression_distance;
    const direction = data.alternate_suppression_direction;
    if (distance) {
      parts.push(`${distance}m以内`);
    }
    if (direction) {
      parts.push(direction);
    }
  } else if (value === '2') {
    const type = data.right_eye_suppression_type;
    if (type) {
      parts.push(type);
    }
    if (type === '非全程抑制') {
      const distance = data.right_eye_suppression_distance;
      const direction = data.right_eye_suppression_direction;
      if (distance) {
        parts.push(`${distance}m`);
      }
      if (direction) {
        parts.push(direction);
      }
    }
  } else if (value === '3') {
    const type = data.left_eye_suppression_type;
    if (type) {
      parts.push(type);
    }
    if (type === '非全程抑制') {
      const distance = data.left_eye_suppression_distance;
      const direction = data.left_eye_suppression_direction;
      if (distance) {
        parts.push(`${distance}m`);
      }
      if (direction) {
        parts.push(direction);
      }
    }
  }
  
  return parts.join('，');
};

// 格式化抑制结果（用于结果列，显示分析结果）
const formatSuppressionResult = (data) => {
  if (!data) return '-';
  // 处理字符串类型，后端存储"其他"，前端显示"交替"
  let value = String(data.value || '');
  // 将"其他"转换为"交替"用于显示
  if (value === '其他') {
    value = '交替';
  }
  // 调试：打印数据
  if (value && value !== 'null' && value !== 'undefined' && value !== '') {
    console.log('[formatSuppressionResult] 数据:', { value, raw: data.value, type2: data.right_eye_suppression_type, type3: data.left_eye_suppression_type });
  }
  
  if (value === '交替') {
    const withinDistance = data.alternate_suppression_distance;
    const withinEye = data.alternate_suppression_direction;
    
    if (withinDistance && withinEye) {
      const eyeName = withinEye === '右' ? '右眼' : '左眼';
      return `${withinDistance}m以内 ${eyeName}抑制`;
    }
    
    return '交替';
  }
  
  if (value === '2' || value === 2) {
    // 右眼
    const type = data.right_eye_suppression_type;
    if (type === '全程抑制') {
      return '右眼全程抑制';
    } else if (type === '非全程抑制') {
      const distance = data.right_eye_suppression_distance;
      const direction = data.right_eye_suppression_direction;
      if (distance && direction) {
        return `右眼${distance}m${direction}抑制`;
      } else if (distance) {
        return `右眼${distance}m抑制`;
      } else if (direction) {
        return `右眼${direction}抑制`;
      }
      return '右眼非全程抑制';
    }
    return '2';
  }
  
  if (value === '3' || value === 3) {
    // 左眼
    const type = data.left_eye_suppression_type;
    if (type === '全程抑制') {
      return '左眼全程抑制';
    } else if (type === '非全程抑制') {
      const distance = data.left_eye_suppression_distance;
      const direction = data.left_eye_suppression_direction;
      if (distance && direction) {
        return `左眼${distance}m${direction}抑制`;
      } else if (distance) {
        return `左眼${distance}m抑制`;
      } else if (direction) {
        return `左眼${direction}抑制`;
      }
      return '左眼非全程抑制';
    }
    return '3';
  }
  
  return '-';
};

// 格式化同视机Ⅱ级结果
const formatSynoptophoreGradeII = (data) => {
  if (!data) return '-';
  const positive = data.synoptophore_level2_positive;
  const negative = data.synoptophore_level2_negative;
  
  if ((positive === null || positive === undefined || positive === '') && 
      (negative === null || negative === undefined || negative === '')) {
    return '-';
  }
  
  const parts = [];
  
  if (positive !== null && positive !== undefined && positive !== '') {
    parts.push(`+${positive}°`);
  }
  
  if (negative !== null && negative !== undefined && negative !== '') {
    if (parts.length > 0) {
      parts.push(`~-${negative}°`);
    } else {
      parts.push(`-${negative}°`);
    }
  }
  
  return parts.length > 0 ? parts.join('') : '-';
};

// 格式化同视机Ⅰ级结果
const formatSynoptophoreGradeI = (data) => {
  if (!data) return '-';
  const sign = data.synoptophore_level1_sign;
  const value = data.synoptophore_level1_value;
  
  if (sign === '正位') {
    return '正位';
  }
  
  if (!sign && (value === null || value === undefined || value === '')) {
    return '-';
  }
  
  const parts = [];
  if (sign) {
    parts.push(sign);
  }
  if (value !== null && value !== undefined && value !== '') {
    parts.push(`${value}°`);
  }
  
  return parts.length > 0 ? parts.join('') : '-';
};

// 格式化同视机Ⅲ级结果
const formatSynoptophoreGradeIII = (data) => {
  if (!data) return '-';
  const stereo = data.synoptophore_level3_stereo;
  const value = data.synoptophore_level3_value;
  
  if (!stereo && (value === null || value === undefined || value === '')) {
    return '-';
  }
  
  const parts = [];
  if (stereo) {
    parts.push(stereo);
  }
  if (value !== null && value !== undefined && value !== '') {
    parts.push(`${value}°`);
  }
  
  return parts.length > 0 ? parts.join(' ') : '-';
};

</script>

<style scoped lang="scss">
.functional-exam-style-two {
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
  text-align: left;
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

.exam-table-binocular .binocular-cell-edit {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.binocular-dir-row {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-start;
}

.binocular-dir-btns {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
}

.binocular-dir-btns--horizontal {
  flex-direction: row;
  gap: 4px;
}

.binocular-dir-btns--vertical {
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}

.binocular-dir-tap {
  min-width: 20px !important;
  height: 16px !important;
  padding: 0 2px !important;
  font-size: 9px !important;
  line-height: 1.05 !important;
  white-space: nowrap;
}

/* 调节灵敏度：检查光度 / 检查视标 — 圆形单选 + 数值，两列；整体在格内居中 */
.accommodation-param-btns {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.accommodation-param-btns--inline {
  display: inline-block;
  margin-right: 8px;
  vertical-align: middle;
  max-width: 100%;
}

.accommodation-param-cols {
  display: grid;
  grid-template-columns: max-content max-content;
  gap: 4px 12px;
  align-items: start;
  justify-items: center;
  width: max-content;
  max-width: 100%;
  margin: 0 auto;
}

.accommodation-param-btns--inline .accommodation-param-cols {
  min-width: 148px;
}

.accommodation-param-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.accommodation-param-col-title {
  font-size: 9px;
  font-weight: 600;
  color: #5a6a7e;
  line-height: 1.2;
  text-align: center;
  margin-bottom: 1px;
  padding: 0 1px;
  white-space: nowrap;
}

.accommodation-param-choice {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: auto;
  max-width: 100%;
  margin: 0;
  padding: 2px 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 9px;
  color: #2a3542;
  text-align: center;
  line-height: 1.2;
  border-radius: 2px;
  box-sizing: border-box;
  transition: background 0.15s;
}

.accommodation-param-choice:hover {
  background: rgba(24, 144, 255, 0.06);
}

.accommodation-param-dot {
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1px solid #b0b4ba;
  background: #fff;
  box-sizing: border-box;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}

.accommodation-param-choice.is-active .accommodation-param-dot {
  border-color: #1890ff;
  background: #1890ff;
  box-shadow: inset 0 0 0 1px #fff;
}

.accommodation-param-choice.is-active .accommodation-param-label {
  color: #1890ff;
  font-weight: 600;
}

.accommodation-param-label {
  flex: 0 1 auto;
  min-width: 0;
  white-space: nowrap;
}

/* 查看态：检查参数 —「检查光度：」「检查视标：」上下两行（字号/颜色与编辑态 accommodation-param-choice 一致） */
.accommodation-param-view-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
}

.accommodation-param-view-stack--inline {
  display: inline-flex;
  width: auto;
  max-width: 100%;
  margin-right: 10px;
  vertical-align: middle;
  align-items: flex-start;
  text-align: left;
}

.accommodation-param-view-line {
  font-size: 9px;
  font-weight: 500;
  line-height: 1.2;
  color: #2a3542;
}

/* 负相对调节 PRA 参考值「-2.25D」与「↑」之间间距 */
.accommodation-pra-ref {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  white-space: nowrap;
}
.accommodation-pra-ref-up {
  margin-left: 4px;
}

/* 调节灵敏度检查结果：数值 + cpm */
.accommodation-sensitivity-result-cell {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-wrap: nowrap;
}

.accommodation-cpm-suffix {
  font-size: 9px;
  color: #5a6a7e;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.2;
}

.accommodation-cpm-suffix--inline {
  font-size: 12px;
  margin-right: 6px;
  margin-left: 2px;
}

/* 调节灵敏度「通过情况」：+ / - / ± */
.accommodation-pass-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  width: 100%;
}

.accommodation-pass-btns {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 3px;
  justify-content: center;
  align-items: center;
}

.accommodation-pass-btn {
  min-width: 22px;
  height: 20px;
  padding: 0 4px;
  margin: 0;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  background: #fff;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  color: #2a3542;
  box-sizing: border-box;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.accommodation-pass-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.accommodation-pass-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

/* 调节幅度「检查方式」：推近法 / 负镜片法，与通过情况按钮同交互（再点取消） */
.accommodation-amplitude-style-btns {
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 3px;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
}

.accommodation-amplitude-style-btns--inline {
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 4px;
  vertical-align: middle;
  margin-left: 2px;
  width: auto;
  max-width: none;
}

/* 推近法 / 负镜片法：统一宽度（略窄于原 76px，仍容纳四字不换行） */
.accommodation-amplitude-style-btn {
  box-sizing: border-box;
  width: 64px;
  min-width: 64px;
  max-width: 64px;
  height: 17px;
  padding: 0 1px;
  font-size: 9px;
  line-height: 1;
  text-align: center;
}

/* 报告表内：格高勿锁 28px，避免两枚竖排按钮与下行重叠 */
.exam-table-accommodation .cell-field.cell-field--amplitude-style {
  height: auto !important;
  min-height: 40px !important;
  padding: 4px 2px !important;
  line-height: 1.2 !important;
  align-items: center;
  justify-content: center;
}

.accommodation-pass-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: stretch;
  width: 100%;
}

.accommodation-pass-line {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  justify-content: flex-start;
}

.accommodation-pass-line-label {
  flex: 0 0 14px;
  font-size: 11px;
  color: #5a6a7e;
  text-align: center;
}

.accommodation-pass-view {
  font-size: 12px;
  font-weight: 600;
  color: #2a3542;
}

/* 棱镜眼位：占位略小，数值与提示均格内居中 */
.prism-phoria-placeholder {
  :deep(.ant-input-number-input) {
    text-align: center;
  }
  :deep(.ant-input-number-input::placeholder) {
    font-size: 62%;
    line-height: 1.2;
    text-align: center;
  }
}

.eye-position-dir-flex {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
}

.eye-position-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px; // 与调节检查表格字体一致
  table-layout: fixed;
}

// 眼位聚散检查列（第1列）
.eye-position-table th:nth-child(1),
.eye-position-table td:nth-child(1) {
  width: 12%;
}

// 眼位列（第2列）- 减少宽度，为集合和散开列腾出空间
.eye-position-table th:nth-child(2),
.eye-position-table td:nth-child(2) {
  width: 9%; // 从12%减少到9%
}

// 集合列（第3、4、5列）- 增加宽度
.eye-position-table th:nth-child(3),
.eye-position-table th:nth-child(4),
.eye-position-table th:nth-child(5),
.eye-position-table td:nth-child(3),
.eye-position-table td:nth-child(4),
.eye-position-table td:nth-child(5) {
  width: 14.33%; // 从13.5%增加到14.33%（约14.33%）
}

// 散开列（第6、7、8列）- 增加宽度
.eye-position-table th:nth-child(6),
.eye-position-table th:nth-child(7),
.eye-position-table th:nth-child(8),
.eye-position-table td:nth-child(6),
.eye-position-table td:nth-child(7),
.eye-position-table td:nth-child(8) {
  width: 14.33%; // 从13.5%增加到14.33%（约14.33%）
}

// 眼位输入框样式，将△符号放在输入框内右侧
.eye-position-input-wrapper {
  position: relative;
  display: inline-block;
  
  .eye-position-unit {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    font-size: 12px;
    pointer-events: none;
    z-index: 1;
  }
  
  :deep(.ant-input-number) {
    width: 80px;
  }
  
  :deep(.ant-input-number-input) {
    padding-right: 20px;
  }
  
  // 隐藏输入框的上下箭头按钮
  :deep(.ant-input-number-handler-wrap) {
    display: none;
  }
  
  :deep(.ant-input-number-input) {
    padding-right: 20px;
  }
}

.eye-position-table thead {
  background: #f2f5ff;
}

.eye-position-table {
  border-radius: 8px;
  overflow: hidden;
}

.eye-position-table thead {
  background: #f0f9fd;
}

.eye-position-table th {
  padding: 10px 12px;
  text-align: center;
  font-weight: 600;
  color: #2a3542;
  border: 1px solid #b0d4e8;
  border-bottom: 2px solid #b0d4e8;
  line-height: 1.3;
}

.eye-position-table thead th.report-section-side-title {
  background: #cceaf5 !important;
  color: #2a3542 !important;
  font-size: 11px;
  padding: 4px 3px;
  width: 26px;
  min-width: 26px;
  max-width: 30px;
  writing-mode: vertical-rl;
  text-orientation: upright;
  letter-spacing: 0.14em;
  vertical-align: middle;
  border-color: #b0d4e8 !important;
}

.aca-report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
  line-height: 1.1;

  th,
  td {
    border: 1px solid #b0d4e8;
    vertical-align: middle;
  }

  thead th {
    background: #f0f9fd;
    font-weight: 600;
    font-size: 9px;
    padding: 2px 2px;
  }

  tbody td {
    font-size: 10px;
    padding: 2px 3px;
  }

  tbody td:first-child {
    text-align: center;
    vertical-align: middle;
  }

  .aca-report-result {
    text-align: left;
  }
}

/* AC/A 明细表中「计算性AC/A」单元格强制居中 */
.exam-sheet .binocular-bottom-table th.aca-calculated-head {
  text-align: center !important;
  vertical-align: middle !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  line-height: 1.2;
}

.exam-sheet .binocular-bottom-table th.aca-calculated-head .aca-calculated-num {
  display: inline-block;
  margin-top: 2px;
}

/* 计算性 AC/A 参考值：无主觉瞳距时显示公式「PD/10」— 斜体、略灰（浅底由 .accommodation-ref-value / .func-table-row .func-table-col.reference 统一） */
.aca-ref-pd10-hint {
  font-style: italic !important;
  color: #5a6a7e !important;
}

/* 非报告式明细：参考值列与 PD/10 同底 #eef2f6 */
.func-table-row .func-table-col.reference {
  background: #eef2f6;
  border-radius: 2px;
}

.eye-position-table tbody tr {
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(34, 75, 150, 0.04) !important;
  }
}

.eye-position-table td {
  padding: 10px 12px;
  text-align: center;
  color: #333;
  border: 1px solid #f0f2f5;
  border-top: none;
  line-height: 1.3;
  
  // 隐藏集合和散开列的输入框上下箭头按钮
  :deep(.ant-input-number-handler-wrap) {
    display: none;
  }
}

// 第一列（距离）样式
.eye-position-table tbody td:first-child {
  background: #fafbff;
  font-weight: 500;
  color: #666;
  text-align: center;
}

// 第二列（眼位）样式
.eye-position-table tbody td:nth-child(2) {
  background: #fafbff;
  font-weight: 500;
  color: #666;
  text-align: center;
  
  // 使眼位输入框容器居中显示
  > div {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// 调节检查 - 适配A4宽度
.func-exam-col {
  width: 100%;
  display: flex;
  background: #ffffff;
  border: 1px solid #e0e6f5;
  border-radius: 4px;
  overflow: hidden;

  .func-exam-col-bg {
    width: 100%;
    background: #ffffff;
  }
}

.func-exam-col {
  border-radius: 8px;
  overflow: hidden;
}

.func-table-header {
  display: flex;
  font-weight: 600;
  background: linear-gradient(180deg, rgba(34, 75, 150, 0.12) 0%, rgba(34, 75, 150, 0.08) 100%);
  border-bottom: 2px solid rgba(34, 75, 150, 0.15);
  font-size: 13px; // 与眼位表格字体一致
  line-height: 1.3; // 与眼位表格行高一致
  color: #224b96; // 与眼位表格表头颜色一致
}

.func-table-row {
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(34, 75, 150, 0.04) !important;
  }
}

.func-table-col {
  flex: 1;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px; // 与眼位表格字体一致
  line-height: 1.3; // 与眼位表格行高一致
  border-right: 1px solid #e0e6f5;
  text-align: center;
  box-sizing: border-box;
}

.func-table-col:last-child {
  border-right: none;
}

.func-table-col.item {
  flex: 1.08; // 缩短10%，从1.2变为1.08
  color: #224b96; // 与眼位表格表头颜色一致（蓝色）
  font-weight: 500;
  justify-content: center;
  text-align: center;
}

.func-table-col.result {
  flex: 2.62; // 补充缩短的10%，从2.5变为2.62
  color: #333;
  
  // 隐藏调节检查中除调节幅度方式外的所有输入框上下箭头按钮
  :deep(.ant-input-number-handler-wrap) {
    display: none;
  }
  
  // 调节检查输入框文本居中显示
  :deep(.ant-input-number-input) {
    text-align: center;
  }
}

.func-table-col.pass-col {
  flex: 0 0 104px;
  min-width: 88px;
  max-width: 140px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 6px;
  font-size: 12px;
  color: #333;
}

.cell-pass-empty-col {
  color: #bfbfbf;
  font-size: 12px;
}

.func-table-col.reference {
  flex: 0 0 auto; // 改为固定宽度，不伸缩
  min-width: 110px; // 设置最小宽度，确保最宽的参考值能完整显示（从90px增加到110px）
  width: 110px; // 固定宽度，按照最宽参考值对齐（从90px增加到110px）
  color: #666;
  font-weight: 500;
  text-align: center;
  white-space: normal; // 允许换行
  word-break: break-word; // 允许单词内换行
  /* 与 exam-sheet 参考值列一致，略小于正文可填数值 */
  font-size: max(8px, calc(var(--exr-font-body, 11px) - 2px));
}

// 四孔灯检查表格特定样式
.four-hole-lamp-table {
  /* 表头三列与「检查结果」一致：深灰、加粗，不用蓝色链接感 */
  .func-table-header {
    color: #333;
  }

  .func-table-header .func-table-col.item {
    color: #333;
    font-weight: 600;
    text-decoration: none;
  }

  .func-table-header .func-table-col.result {
    color: #333;
    font-weight: 600;
  }

  .func-table-header .func-table-col.reference {
    font-size: 13px;
    line-height: 1.3;
    font-weight: 600;
    color: #333;
  }

  .func-table-col.result {
    flex: 1.5; // 压缩检查结果列宽度（从2.62压缩到1.5）
    white-space: normal; // 选 5 时第二行水平/垂直需换行展示，不能用 nowrap
    overflow: visible; // 避免第二行被裁切导致「垂直」等控件不显示
    text-overflow: clip;
    align-items: center;
    justify-content: center;
    padding-top: 6px;
    padding-bottom: 6px;
  }
  
  .func-table-col.reference {
    flex: 0 0 auto;
    min-width: 220px; // 结果列宽度加一倍（从110px增加到220px）
    width: 220px;
    white-space: nowrap; // 结果列不换行，保持在同一行
    overflow: hidden;
    text-overflow: ellipsis; // 如果内容过长，显示省略号
    /* 覆盖全局 reference 的过小字号（max(..., 9px)），与「检查结果」列可读性一致 */
    font-size: 16px;
    line-height: 1.45;
    font-weight: 600;
  }

  .dominant-eye-select .input-label,
  .five-option-item .input-label {
    font-size: 14px;
  }

  :deep(
    .four-hole-lamp-select.ant-select:not(.four-hole-lamp-select--compact):not(
        .four-hole-lamp-select--narrow
      )
  ) {
    min-width: 188px;
    width: 188px;
  }

  :deep(.four-hole-lamp-select--compact.ant-select) {
    min-width: 120px;
    width: 120px;
    max-width: 120px;
  }

  :deep(.four-hole-lamp-select--narrow.ant-select) {
    min-width: 132px;
    width: 132px;
    max-width: 132px;
  }

  /* 选 5 第二行：水平+垂直同一行，缩窄宽度避免换行成上下两行 */
  :deep(.five-options-container--second-row .four-hole-lamp-select--narrow.ant-select) {
    min-width: 108px;
    width: 108px;
    max-width: 108px;
  }

  :deep(.four-hole-lamp-select .ant-select-selector) {
    font-size: 16px;
    min-height: 40px;
    padding: 6px 12px;
  }

  :deep(.four-hole-lamp-select .ant-select-selection-item),
  :deep(.four-hole-lamp-select .ant-select-selection-placeholder) {
    font-size: 16px;
    line-height: 28px;
  }

  :deep(.four-hole-lamp-select--compact .ant-select-selection-item),
  :deep(.four-hole-lamp-select--narrow .ant-select-selection-item) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
}

// 综合验光仪 / 同视机：参考值数据列 + 表头三列（与四孔灯、与「检查结果」一致）
.optometer-related-table,
.synoptophore-table {
  .func-table-col.reference {
    font-size: 16px;
    line-height: 1.45;
    font-weight: 500;
    color: #333;
  }

  /* 表头三列：深灰、13px（与四孔灯 func-table-header）；首列不再用全局蓝色 item */
  .func-table-header {
    color: #333;
  }

  .func-table-header .func-table-col.item,
  .func-table-header .func-table-col.result {
    color: #333;
    font-weight: 600;
    font-size: 13px;
    line-height: 1.3;
    text-decoration: none;
  }

  .func-table-header .func-table-col.reference {
    font-size: 13px;
    line-height: 1.3;
    font-weight: 600;
    color: #333;
  }
}

// 同视机检查表格特定样式
.synoptophore-table {
  .func-table-col.result {
    white-space: nowrap; // 检查结果列不换行，保持在同一行
    overflow: visible; // 允许内容溢出，确保输入框完整显示
    text-overflow: ellipsis; // 如果内容过长，显示省略号
    align-items: center; // 垂直居中
    justify-content: center; // 水平居中
  }
}

.func-table-row {
  display: flex;
  border-bottom: 1px solid #e0e6f5;
  min-height: auto;
}

.func-table-row:nth-child(even) {
  background: #ffffff;
}

.func-table-row:nth-child(odd) {
  background: #fafbff;
}

.func-table-row:last-child {
  border-bottom: none;
}

.input-label {
  color: #888;
  margin-right: 2px;
  min-width: 28px;
  display: inline-block;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
}

.value-display {
  display: inline-block;
  color: #333;
  margin-right: 4px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}

// 计算得出的值样式
.calculated-value {
  color: #333;
  font-size: 13px;
  font-weight: 500;
}

// 正相对调节和负相对调节使用较小的宽度
.func-exam-col-bg > .func-table-row:nth-child(2) .value-display,
.func-exam-col-bg > .func-table-row:nth-child(3) .value-display {
  width: 50px;
}

// 其他项目使用更小的宽度
.func-exam-col-bg > .func-table-row:nth-child(4) .value-display,
.func-exam-col-bg > .func-table-row:nth-child(5) .value-display,
.func-exam-col-bg > .func-table-row:nth-child(6) .value-display {
  width: 45px;
}

// 调节幅度的"选择方法"使用较小宽度
.func-exam-col-bg > .func-table-row:nth-child(4) .value-display:last-of-type {
  width: 70px;
  margin-left: 4px;
}

// 正负相对调节输入框包装器，用于显示符号
.accommodation-input-wrapper {
  position: relative;
  display: inline-block;
  
  .accommodation-sign {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    font-size: 14px;
    font-weight: 500;
    pointer-events: none;
    z-index: 1;
  }
  
  :deep(.ant-input-number) {
    width: 80px;
  }
  
  :deep(.ant-input-number-input) {
    padding-left: 20px;
    text-align: center;
  }
  
  :deep(.ant-input-number-handler-wrap) {
    display: none;
  }
}

// 四孔灯检查容器：首行「4/5 + 优势眼」同一行不换行；选 5 时水平/垂直另起块
.four-hole-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.four-hole-primary-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

// 四孔灯检查按钮组
.button-group {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.four-hole-btn {
  min-width: 60px;
  height: 32px;
  padding: 0 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #f5f5f5;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  outline: none;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    border-color: #40a9ff;
    color: #40a9ff;
  }
  
  &.active {
    background: #1890ff;
    color: #fff;
    border-color: #1890ff;
  }
  
  &:active {
    transform: scale(0.95);
  }
}

// 优势眼选择框容器样式
.dominant-eye-select {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
  flex-shrink: 0;
  
  .input-label {
    flex-shrink: 0;
    margin-right: 0;
  }
}

// 选择5时的选项容器样式（第二行：水平 + 垂直并排）
.five-options-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.five-options-container--second-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.five-options-container--second-row .five-option-item {
  flex: 0 0 auto;
  flex-shrink: 0;
}

.five-option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
  
  .input-label {
    flex-shrink: 0;
    margin-right: 0;
  }
}

// 抑制容器样式
.suppression-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.suppression-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.suppression-option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
  
  .input-label {
    flex-shrink: 0;
    margin-right: 0;
  }
}

.suppression-detail {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 28px; // 与"右眼："/"左眼："标签对齐
}

.suppression-alternate-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.button-group-small {
  display: flex;
  gap: 4px;
  align-items: center;
}

.four-hole-btn-small {
  min-width: 50px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #f5f5f5;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  outline: none;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    border-color: #40a9ff;
    color: #40a9ff;
  }
  
  &.active {
    background: #1890ff;
    color: #fff;
    border-color: #1890ff;
  }
  
  &:active {
    transform: scale(0.95);
  }
}

/* 报告式调节表：使用全局 exam-sheet */
.exam-table-accommodation {
  :deep(.accommodation-input-wrapper) {
    gap: 2px;
  }

  /* 调节幅度双眼行：无单项检查结果，合并三列为灰底占位（无输入） */
  td.accommodation-amplitude-both-merged {
    background: #eef2f6 !important;
    padding: 0 !important;
    vertical-align: middle;
  }

  .accommodation-amplitude-both-merged-inner {
    min-height: var(--exr-input-h, 28px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eef2f6;
    color: #8c8c8c;
    font-weight: 500;
    width: 100%;
    box-sizing: border-box;
  }

  .accommodation-amplitude-both-placeholder {
    user-select: none;
    pointer-events: none;
  }
}

.accommodation-both-amplitude-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-align: center;
  font-size: 11px;
  line-height: 1.25;
  width: 100%;
}

.accommodation-both-amplitude-ref {
  font-size: 10px;
  color: #595959;
}

/* 其他相关检查：与影像检查 img-main-tabs 一致的子标签样式 */
.other-related-tabs-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  width: 100%;
  min-width: 0;
}

.other-related-main-tabs {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(34, 75, 150, 0.25);
    border-radius: 2px;
  }
}

.other-related-tab-item {
  flex: 0 1 auto;
  padding: 5px 10px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  color: #224b96;
  background: linear-gradient(135deg, rgba(34, 75, 150, 0.08) 0%, rgba(234, 240, 255, 0.6) 100%);
  border: 1px solid #e0e6f5;
  border-radius: 6px;
  border-left: 3px solid #b8c9e8;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  font-family: inherit;
  white-space: nowrap;

  &:hover {
    border-color: #224b96;
    background: linear-gradient(135deg, rgba(34, 75, 150, 0.12) 0%, rgba(234, 240, 255, 0.85) 100%);
  }

  &.active {
    color: #fff;
    background: #224b96;
    border-color: #224b96;
    border-left-color: #224b96;
  }
}

.other-related-panel {
  width: 100%;
  min-width: 0;
}

.other-related-panel--synoptophore {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.other-related-panel--analysis {
  min-width: 0;
  max-width: 100%;
}

.other-related-panel--analysis :deep(.analysis-exam-container) {
  padding-top: 0;
}

</style>

<!-- 下拉挂载在 body，需非 scoped 才能命中选项列表 -->
<style lang="scss">
.four-hole-select-dropdown.ant-select-dropdown {
  min-width: 168px !important;

  .ant-select-item {
    padding: 10px 14px !important;
    min-height: 40px;
  }

  .ant-select-item-option-content {
    font-size: 16px;
    line-height: 1.45;
  }
}
</style>

