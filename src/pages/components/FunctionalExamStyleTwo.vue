<template>
  <div class="functional-exam-style-two">
    <!-- 眼位和聚散检查 -->
    <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasEyePositionData" 
         v-show="!showOnlySection || showOnlySection === 'functional'"
         class="section-block"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.['eye-position'] }">
      <h3 
        v-if="viewMode === 'view' || !isReportMode"
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
      <table class="eye-position-table">
        <thead>
          <tr>
            <th rowspan="2">眼位和聚散检查</th>
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
            <td>5m水平眼位</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <a-select v-model:value="farEyeDirection" style="width: 70px" placeholder="选择" allowClear>
                    <a-select-option value="外">外</a-select-option>
                    <a-select-option value="内">内</a-select-option>
                    <a-select-option value="正">正</a-select-option>
                  </a-select>
                  <div v-if="farEyeDirection && farEyeDirection !== '正'" class="eye-position-input-wrapper">
                    <a-input-number v-model:value="farEyeValue" :precision="2" :step="0.25" style="width: 80px" placeholder="数值" />
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
            <td>40cm水平眼位</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <a-select v-model:value="nearEyeDirection" style="width: 70px" placeholder="选择" allowClear>
                    <a-select-option value="外">外</a-select-option>
                    <a-select-option value="内">内</a-select-option>
                    <a-select-option value="正">正</a-select-option>
                  </a-select>
                  <div v-if="nearEyeDirection && nearEyeDirection !== '正'" class="eye-position-input-wrapper">
                    <a-input-number v-model:value="nearEyeValue" :precision="2" :step="0.25" style="width: 80px" placeholder="数值" />
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
            <td>5m垂直眼位</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <a-select v-model:value="farVerticalEyeDirection" style="width: 70px" placeholder="选择" allowClear>
                    <a-select-option value="正位">正位</a-select-option>
                    <a-select-option value="右高">右高</a-select-option>
                    <a-select-option value="左高">左高</a-select-option>
                  </a-select>
                  <div v-if="farVerticalEyeDirection && farVerticalEyeDirection !== '正位' && farVerticalEyeDirection !== null" class="eye-position-input-wrapper">
                    <a-input-number v-model:value="farVerticalEyeBreak" :precision="2" :step="0.25" style="width: 80px" placeholder="数值" />
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
            <td>40cm垂直眼位</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <a-select v-model:value="nearVerticalEyeDirection" style="width: 70px" placeholder="选择" allowClear>
                    <a-select-option value="正位">正位</a-select-option>
                    <a-select-option value="右高">右高</a-select-option>
                    <a-select-option value="左高">左高</a-select-option>
                  </a-select>
                  <div v-if="nearVerticalEyeDirection && nearVerticalEyeDirection !== '正位' && nearVerticalEyeDirection !== null" class="eye-position-input-wrapper">
                    <a-input-number v-model:value="nearVerticalEyeBreak" :precision="2" :step="0.25" style="width: 80px" placeholder="数值" />
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
    <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasACACAData" 
         v-show="!showOnlySection || showOnlySection === 'functional'"
         class="section-block"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.['ac-aca'] }">
      <h3 
        v-if="viewMode === 'view' || !isReportMode"
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
      <div class="func-exam-col">
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
            <div class="func-table-col reference">{{ calculatedACARatioReference }}</div>
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
         v-show="!showOnlySection || showOnlySection === 'functional'"
         class="section-block"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.accommodation }">
      <h3 
        v-if="viewMode === 'view' || !isReportMode"
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
      <div class="func-exam-col">
        <div class="func-exam-col-bg">
          <div class="func-table-header">
            <div class="func-table-col item">调节检查</div>
            <div class="func-table-col result">检查结果</div>
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
            <div class="func-table-col reference">小于-3.00D</div>
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
                <a-select v-model:value="editForm.accommodation_amplitude_style" style="width: 100px" placeholder="方式">
                  <a-select-option value="推近法">推近法</a-select-option>
                  <a-select-option value="负镜片法">负镜片法</a-select-option>
                </a-select>
              </template>
              <template v-else>
                <span class="input-label">右眼：</span>
                <span class="value-display">{{ formatAmplitudeValue(record?.accommodative_amplitude_right) }}</span>
                <span class="input-label">左眼：</span>
                <span class="value-display">{{ formatAmplitudeValue(record?.accommodative_amplitude_left) }}</span>
                <span class="value-display">{{ formatAmplitudeStyle(record?.accommodation_amplitude_style) }}</span>
              </template>
            </div>
            <div class="func-table-col reference">{{ getAmplitudeReference() }}</div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">调节灵敏度（cpm）</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <a-select v-model:value="accommodationSensitivityDiopter" style="width: 95px; margin-right: 4px" placeholder="选择">
                  <a-select-option value="±1.00D">±1.00D</a-select-option>
                  <a-select-option value="±1.50D">±1.50D</a-select-option>
                  <a-select-option value="±2.00D">±2.00D</a-select-option>
                </a-select>
                <a-select v-model:value="accommodationSensitivityVision" style="width: 80px; margin-right: 4px" placeholder="选择">
                  <a-select-option value="20/30">20/30</a-select-option>
                  <a-select-option value="20/40">20/40</a-select-option>
                  <a-select-option value="20/50">20/50</a-select-option>
                </a-select>
                <span class="input-label">右眼：</span>
                <a-input-number v-model:value="accommodationSensitivityRight" :min="0" :precision="0" style="width: 40px; margin-right: 4px" />
                <span class="input-label">左眼：</span>
                <a-input-number v-model:value="accommodationSensitivityLeft" :min="0" :precision="0" style="width: 40px; margin-right: 4px" />
                <span class="input-label">双眼：</span>
                <a-input-number v-model:value="accommodationSensitivityBoth" :min="0" :precision="0" style="width: 40px" />
              </template>
              <template v-else>
                <span class="value-display" style="margin-right: 8px;">{{ (record?.accommodation_sensitivity_lens_power || record?.accommodation_sensitivity_diopter) || '±2.00D' }}</span>
                <span class="value-display" style="margin-right: 8px;">{{ (record?.accommodation_sensitivity_target || record?.accommodation_sensitivity_vision) || '20/30' }}</span>
                <span class="input-label">右眼：</span>
                <span class="value-display">{{ formatValue(record?.accommodation_sensitivity_right_value || record?.accommodation_sensitivity_right) }}</span>
                <span class="input-label">左眼：</span>
                <span class="value-display">{{ formatValue(record?.accommodation_sensitivity_left_value || record?.accommodation_sensitivity_left) }}</span>
                <span class="input-label">双眼：</span>
                <span class="value-display">{{ formatValue(record?.accommodation_sensitivity_both_value || record?.accommodation_sensitivity_both) }}</span>
              </template>
            </div>
            <div class="func-table-col reference">单眼11cpm<br>双眼8cpm</div>
          </div>
          <div class="func-table-row">
            <div class="func-table-col item">调节反应（D）</div>
            <div class="func-table-col result">
              <template v-if="viewMode === 'edit'">
                <span class="input-label">右眼：</span>
                <div class="accommodation-reaction-wrapper">
                  <div class="accommodation-sign-buttons">
                    <button 
                      type="button"
                      class="accommodation-sign-btn accommodation-plus-btn"
                      :class="{ active: getReactionSign('right') === '+' }"
                      @click="toggleReactionSign('right', '+')"
                    >+</button>
                    <button 
                      type="button"
                      class="accommodation-sign-btn accommodation-minus-btn"
                      :class="{ active: getReactionSign('right') === '-' }"
                      @click="toggleReactionSign('right', '-')"
                    >-</button>
                  </div>
                  <a-input-number v-model:value="fusedCrossCylinderRight" :precision="2" :step="0.01" placeholder="MEM" style="width: 70px; margin-right: 8px" />
                </div>
                <span class="input-label">左眼：</span>
                <div class="accommodation-reaction-wrapper">
                  <div class="accommodation-sign-buttons">
                    <button 
                      type="button"
                      class="accommodation-sign-btn accommodation-plus-btn"
                      :class="{ active: getReactionSign('left') === '+' }"
                      @click="toggleReactionSign('left', '+')"
                    >+</button>
                    <button 
                      type="button"
                      class="accommodation-sign-btn accommodation-minus-btn"
                      :class="{ active: getReactionSign('left') === '-' }"
                      @click="toggleReactionSign('left', '-')"
                    >-</button>
                  </div>
                  <a-input-number v-model:value="fusedCrossCylinderLeft" :precision="2" :step="0.01" placeholder="MEM" style="width: 70px; margin-right: 8px" />
                </div>
                <span class="input-label">BCC：</span>
                <div class="accommodation-reaction-wrapper">
                  <div class="accommodation-sign-buttons">
                    <button 
                      type="button"
                      class="accommodation-sign-btn accommodation-plus-btn"
                      :class="{ active: getReactionSign('both') === '+' }"
                      @click="toggleReactionSign('both', '+')"
                    >+</button>
                    <button 
                      type="button"
                      class="accommodation-sign-btn accommodation-minus-btn"
                      :class="{ active: getReactionSign('both') === '-' }"
                      @click="toggleReactionSign('both', '-')"
                    >-</button>
                  </div>
                  <a-input-number v-model:value="fusedCrossCylinderBoth" :precision="2" :step="0.01" style="width: 70px" />
                </div>
              </template>
              <template v-else>
                <span class="input-label">右眼：</span>
                <span class="value-display">{{ formatReactionValue(record?.accommodation_mem_right_value || record?.fused_cross_cylinder_right, record?.accommodation_mem_right_sign) }}</span>
                <span class="input-label">左眼：</span>
                <span class="value-display">{{ formatReactionValue(record?.accommodation_mem_left_value || record?.fused_cross_cylinder_left, record?.accommodation_mem_left_sign) }}</span>
                <span class="input-label">BCC：</span>
                <span class="value-display">{{ formatReactionValue(record?.accommodation_amplitude_bcc_style || record?.fused_cross_cylinder_both, record?.accommodation_bcc_sign) }}</span>
              </template>
            </div>
            <div class="func-table-col reference">+0.50D±0.25D</div>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- 其他相关检查 -->
    <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasOtherRelatedData" 
         v-show="showOnlySection !== 'functional' && (!showOnlySection || showOnlySection === 'other-related')"
         class="section-block"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.['other-related'] }">
      <h3 
        v-if="viewMode === 'view' || !isReportMode"
        class="section-title"
        :class="{ 'clickable': enableCollapse }"
        @click="enableCollapse && handleToggleSection('other-related')"
      >
        其他相关检查
        <span v-if="enableCollapse" class="section-toggle-icon">
          <UpOutlined v-if="sectionExpanded?.['other-related']" />
          <DownOutlined v-else />
        </span>
      </h3>
      <div v-show="viewMode === 'print' || (enableCollapse ? sectionExpanded?.['other-related'] : true)">
      <div class="func-exam-col">
        <div class="func-exam-col-bg">
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
                    <a-select v-model:value="editForm.dominant_eye_color_2m" style="width: 140px" allowClear>
                      <a-select-option value="黄">黄</a-select-option>
                      <a-select-option value="红">红</a-select-option>
                      <a-select-option value="绿">绿</a-select-option>
                      <a-select-option value="红绿交替">红绿交替</a-select-option>
                    </a-select>
                  </div>
                  <div v-if="editForm.check_distance_2m === '5'" class="five-options-container">
                    <div class="five-option-item">
                      <span class="input-label">水平：</span>
                      <a-select v-model:value="editForm.horizontal_option_2m" style="width: 140px" allowClear>
                        <a-select-option value="左红右绿">左红右绿</a-select-option>
                        <a-select-option value="右红左绿">右红左绿</a-select-option>
                      </a-select>
                    </div>
                    <div class="five-option-item">
                      <span class="input-label">垂直：</span>
                      <a-select v-model:value="editForm.vertical_option_2m" style="width: 140px" allowClear>
                        <a-select-option value="右高">右高</a-select-option>
                        <a-select-option value="左高">左高</a-select-option>
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
                    <a-select v-model:value="editForm.dominant_eye_color_40cm" style="width: 140px" allowClear>
                      <a-select-option value="黄">黄</a-select-option>
                      <a-select-option value="红">红</a-select-option>
                      <a-select-option value="绿">绿</a-select-option>
                      <a-select-option value="红绿交替">红绿交替</a-select-option>
                    </a-select>
                  </div>
                  <div v-if="editForm.check_distance_40cm === '5'" class="five-options-container">
                    <div class="five-option-item">
                      <span class="input-label">水平：</span>
                      <a-select v-model:value="editForm.horizontal_option_40cm" style="width: 140px" allowClear>
                        <a-select-option value="左红右绿">左红右绿</a-select-option>
                        <a-select-option value="右红左绿">右红左绿</a-select-option>
                      </a-select>
                    </div>
                    <div class="five-option-item">
                      <span class="input-label">垂直：</span>
                      <a-select v-model:value="editForm.vertical_option_40cm" style="width: 140px" allowClear>
                        <a-select-option value="右高">右高</a-select-option>
                        <a-select-option value="左高">左高</a-select-option>
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
    </div>

    <!-- 同视机检查 -->
    <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasSynoptophoreData" 
         v-show="!showOnlySection || showOnlySection === 'functional'"
         class="section-block"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.synoptophore }">
      <h3 
        v-if="viewMode === 'view' || !isReportMode"
        class="section-title"
        :class="{ 'clickable': enableCollapse }"
        @click="enableCollapse && handleToggleSection('synoptophore')"
      >
        同视机检查
        <span v-if="enableCollapse" class="section-toggle-icon">
          <UpOutlined v-if="sectionExpanded?.synoptophore" />
          <DownOutlined v-else />
        </span>
      </h3>
      <div v-show="viewMode === 'print' || (enableCollapse ? sectionExpanded?.synoptophore : true)">
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
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { UpOutlined, DownOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  record: {
    type: Object,
    default: () => ({})
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

const emit = defineEmits(['toggle-section', 'update-record']);

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
    editForm.value = processedData;
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
    // 检查外隐斜字段（包括空字符串，表示方向已选择）
    if (exo !== null && exo !== undefined) {
      return '外';
    }
    // 检查内隐斜字段（包括空字符串，表示方向已选择）
    if (eso !== null && eso !== undefined) {
      return '内';
    }
    // 如果都没有值，返回'正'（表示正位）
    return '正';
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
      // 如果方向为空，根据值的正负来决定（但通常应该先选择方向）
      editForm.value.pli_exo_distance_lateral_phoria = null;
      editForm.value.plo_eso_distance_lateral_phoria = null;
    }
  }
});

// 近距离眼位方向和值
const nearEyeDirection = computed({
  get() {
    const exo = editForm.value?.pli_exo_near_lateral_phoria;
    const eso = editForm.value?.plo_eso_near_lateral_phoria;
    // 检查外隐斜字段（包括空字符串，表示方向已选择）
    if (exo !== null && exo !== undefined) {
      return '外';
    }
    // 检查内隐斜字段（包括空字符串，表示方向已选择）
    if (eso !== null && eso !== undefined) {
      return '内';
    }
    // 如果都没有值，返回'正'（表示正位）
    return '正';
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
      // 如果方向为空，根据值的正负来决定（但通常应该先选择方向）
      editForm.value.pli_exo_near_lateral_phoria = null;
      editForm.value.plo_eso_near_lateral_phoria = null;
    }
  }
});

// 远距离垂直眼位方向和值
// 兼容后端字段 vertical_eye_position_far 和旧字段
const farVerticalEyeDirection = computed({
  get() {
    if (!editForm.value) return '正位';
    // 优先从后端字段 vertical_eye_position_far 读取，如果没有则从旧字段读取
    const direction = editForm.value.vertical_eye_position_far || 
                      editForm.value.fusional_convergence_distance_vertical_direction || 
                      editForm.value.far_vertical_eye_direction;
    // 如果方向为空、null、undefined 或空字符串，返回 '正位'（表示正位）
    return direction || '正位';
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    // 同时更新后端字段和旧字段以确保兼容性
    // 如果 val 是 '正位'、null 或 undefined，设置为 null；否则设置为 val
    const valueToSet = (val === '正位' || val === null || val === undefined) ? null : val;
    // 确保所有字段都正确设置
    if (valueToSet !== null) {
      // 优先保存到后端字段
      editForm.value.vertical_eye_position_far = valueToSet;
      // 同时保存到旧字段（兼容性）
      editForm.value.fusional_convergence_distance_vertical_direction = valueToSet;
      editForm.value.far_vertical_eye_direction = valueToSet;
    } else {
      // 当选择"正位"时，将所有字段都设置为 null
      editForm.value.vertical_eye_position_far = null;
      editForm.value.fusional_convergence_distance_vertical_direction = null;
      editForm.value.far_vertical_eye_direction = null;
      // 同时清空 break 值
      editForm.value.vertical_eye_position_far_value = null;
      editForm.value.far_vertical_eye_break = null;
    }
  }
});

// 兼容后端字段 vertical_eye_position_far_value 和旧字段
const farVerticalEyeBreak = computed({
  get() {
    if (!editForm.value) return null;
    // 优先从后端字段读取，如果没有则从旧字段读取
    return editForm.value.vertical_eye_position_far_value || 
           editForm.value.far_vertical_eye_break || 
           null;
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    // 同时保存到后端字段和旧字段（兼容性）
    editForm.value.vertical_eye_position_far_value = val;
    editForm.value.far_vertical_eye_break = val;
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
    if (!editForm.value) return '正位';
    // 优先从后端字段 vertical_eye_position_near 读取，如果没有则从旧字段读取
    const direction = editForm.value.vertical_eye_position_near || 
                      editForm.value.fusional_convergence_near_vertical_direction || 
                      editForm.value.near_vertical_eye_direction;
    // 如果方向为空、null、undefined 或空字符串，返回 '正位'（表示正位）
    return direction || '正位';
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    // 同时更新后端字段和旧字段以确保兼容性
    // 如果 val 是 '正位'、null 或 undefined，设置为 null；否则设置为 val
    const valueToSet = (val === '正位' || val === null || val === undefined) ? null : val;
    // 确保所有字段都正确设置
    if (valueToSet !== null) {
      // 优先保存到后端字段
      editForm.value.vertical_eye_position_near = valueToSet;
      // 同时保存到旧字段（兼容性）
      editForm.value.fusional_convergence_near_vertical_direction = valueToSet;
      editForm.value.near_vertical_eye_direction = valueToSet;
    } else {
      // 当选择"正位"时，将所有字段都设置为 null
      editForm.value.vertical_eye_position_near = null;
      editForm.value.fusional_convergence_near_vertical_direction = null;
      editForm.value.near_vertical_eye_direction = null;
      // 同时清空 break 值
      editForm.value.vertical_eye_position_near_value = null;
      editForm.value.near_vertical_eye_break = null;
    }
  }
});

// 兼容后端字段 vertical_eye_position_near_value 和旧字段
const nearVerticalEyeBreak = computed({
  get() {
    if (!editForm.value) return null;
    // 优先从后端字段读取，如果没有则从旧字段读取
    return editForm.value.vertical_eye_position_near_value || 
           editForm.value.near_vertical_eye_break || 
           null;
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    // 同时保存到后端字段和旧字段（兼容性）
    editForm.value.vertical_eye_position_near_value = val;
    editForm.value.near_vertical_eye_break = val;
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

// 调节反应 - 右眼（处理符号和数值）
// 兼容旧字段 fused_cross_cylinder_right 和新字段 accommodation_mem_right_value + accommodation_mem_right_sign
const fusedCrossCylinderRight = computed({
  get() {
    if (!editForm.value) return null;
    // 优先读取新字段（分离的符号和值）
    if (editForm.value.accommodation_mem_right_value !== null && 
        editForm.value.accommodation_mem_right_value !== undefined && 
        editForm.value.accommodation_mem_right_value !== '') {
      return Math.abs(parseFloat(editForm.value.accommodation_mem_right_value));
    }
    // 兼容旧字段（合并的符号和值）
    const value = editForm.value.fused_cross_cylinder_right;
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'number' ? value : parseFloat(value.toString().replace(/^[+\-]/, ''));
    if (isNaN(num)) return null;
    return Math.abs(num);
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    if (val === null || val === undefined || val === '') {
      // 清除新字段和旧字段
      editForm.value.accommodation_mem_right_value = null;
      editForm.value.fused_cross_cylinder_right = null;
    } else {
      const sign = getReactionSign('right');
      const num = Math.abs(parseFloat(val));
      // 保存到新字段（分离的符号和值）
      editForm.value.accommodation_mem_right_value = num;
      editForm.value.accommodation_mem_right_sign = sign || null;
      // 同时保存到旧字段（兼容性）
      editForm.value.fused_cross_cylinder_right = sign === '-' ? -num : num;
    }
  }
});

// 调节反应 - 左眼（处理符号和数值）
// 兼容旧字段 fused_cross_cylinder_left 和新字段 accommodation_mem_left_value + accommodation_mem_left_sign
const fusedCrossCylinderLeft = computed({
  get() {
    if (!editForm.value) return null;
    // 优先读取新字段（分离的符号和值）
    if (editForm.value.accommodation_mem_left_value !== null && 
        editForm.value.accommodation_mem_left_value !== undefined && 
        editForm.value.accommodation_mem_left_value !== '') {
      return Math.abs(parseFloat(editForm.value.accommodation_mem_left_value));
    }
    // 兼容旧字段（合并的符号和值）
    const value = editForm.value.fused_cross_cylinder_left;
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'number' ? value : parseFloat(value.toString().replace(/^[+\-]/, ''));
    if (isNaN(num)) return null;
    return Math.abs(num);
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    if (val === null || val === undefined || val === '') {
      // 清除新字段和旧字段
      editForm.value.accommodation_mem_left_value = null;
      editForm.value.fused_cross_cylinder_left = null;
    } else {
      const sign = getReactionSign('left');
      const num = Math.abs(parseFloat(val));
      // 保存到新字段（分离的符号和值）
      editForm.value.accommodation_mem_left_value = num;
      editForm.value.accommodation_mem_left_sign = sign || null;
      // 同时保存到旧字段（兼容性）
      editForm.value.fused_cross_cylinder_left = sign === '-' ? -num : num;
    }
  }
});

// 调节反应 - 双眼/BCC（处理符号和数值）
// 兼容旧字段 fused_cross_cylinder_both 和新字段 accommodation_amplitude_bcc_style + accommodation_bcc_sign
const fusedCrossCylinderBoth = computed({
  get() {
    if (!editForm.value) return null;
    // 优先读取新字段（分离的符号和值）
    if (editForm.value.accommodation_amplitude_bcc_style !== null && 
        editForm.value.accommodation_amplitude_bcc_style !== undefined && 
        editForm.value.accommodation_amplitude_bcc_style !== '') {
      return Math.abs(parseFloat(editForm.value.accommodation_amplitude_bcc_style));
    }
    // 兼容旧字段（合并的符号和值）
    const value = editForm.value.fused_cross_cylinder_both;
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'number' ? value : parseFloat(value.toString().replace(/^[+\-]/, ''));
    if (isNaN(num)) return null;
    return Math.abs(num);
  },
  set(val) {
    if (!editForm.value) {
      editForm.value = {};
    }
    if (val === null || val === undefined || val === '') {
      // 清除新字段和旧字段
      editForm.value.accommodation_amplitude_bcc_style = null;
      editForm.value.fused_cross_cylinder_both = null;
    } else {
      const sign = getReactionSign('both');
      const num = Math.abs(parseFloat(val));
      // 保存到新字段（分离的符号和值）
      editForm.value.accommodation_amplitude_bcc_style = num;
      editForm.value.accommodation_bcc_sign = sign || null;
      // 同时保存到旧字段（兼容性）
      editForm.value.fused_cross_cylinder_both = sign === '-' ? -num : num;
    }
  }
});

// 获取调节反应的符号
// 兼容旧字段（合并的符号和值）和新字段（分离的符号和值）
const getReactionSign = (type) => {
  if (!editForm.value) return null;
  
  // 优先读取新字段（分离的符号）
  if (type === 'right') {
    if (editForm.value.accommodation_mem_right_sign) {
      return editForm.value.accommodation_mem_right_sign;
    }
    // 兼容旧字段
    const value = editForm.value.fused_cross_cylinder_right;
    if (value !== null && value !== undefined && value !== '') {
      const actualValue = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(actualValue)) {
        return actualValue < 0 ? '-' : '+';
      }
    }
  } else if (type === 'left') {
    if (editForm.value.accommodation_mem_left_sign) {
      return editForm.value.accommodation_mem_left_sign;
    }
    // 兼容旧字段
    const value = editForm.value.fused_cross_cylinder_left;
    if (value !== null && value !== undefined && value !== '') {
      const actualValue = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(actualValue)) {
        return actualValue < 0 ? '-' : '+';
      }
    }
  } else if (type === 'both') {
    if (editForm.value.accommodation_bcc_sign) {
      return editForm.value.accommodation_bcc_sign;
    }
    // 兼容旧字段
    const value = editForm.value.fused_cross_cylinder_both;
    if (value !== null && value !== undefined && value !== '') {
      const actualValue = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(actualValue)) {
        return actualValue < 0 ? '-' : '+';
      }
    }
  }
  
  return null;
};

// 切换调节反应的符号
// 兼容旧字段和新字段，同时更新两者
const toggleReactionSign = (type, sign) => {
  if (!editForm.value) {
    editForm.value = {};
  }
  
  if (type === 'right') {
    // 获取当前值（优先新字段）
    let currentValue = editForm.value.accommodation_mem_right_value;
    if (currentValue === null || currentValue === undefined || currentValue === '') {
      currentValue = editForm.value.fused_cross_cylinder_right;
    }
    
    if (currentValue === null || currentValue === undefined || currentValue === '') {
      // 如果没有值，设置一个默认值0并应用符号
      editForm.value.accommodation_mem_right_value = 0;
      editForm.value.accommodation_mem_right_sign = sign;
      editForm.value.fused_cross_cylinder_right = sign === '-' ? -0 : 0;
    } else {
      const num = typeof currentValue === 'number' ? Math.abs(currentValue) : Math.abs(parseFloat(currentValue.toString().replace(/^[+\-]/, '')));
      if (!isNaN(num)) {
        const currentSign = getReactionSign(type);
        if (currentSign === sign) {
          // 如果当前符号与点击的符号相同，则清除值
          editForm.value.accommodation_mem_right_value = null;
          editForm.value.accommodation_mem_right_sign = null;
          editForm.value.fused_cross_cylinder_right = null;
        } else {
          // 切换符号
          editForm.value.accommodation_mem_right_value = num;
          editForm.value.accommodation_mem_right_sign = sign;
          editForm.value.fused_cross_cylinder_right = sign === '-' ? -num : num;
        }
      }
    }
  } else if (type === 'left') {
    // 获取当前值（优先新字段）
    let currentValue = editForm.value.accommodation_mem_left_value;
    if (currentValue === null || currentValue === undefined || currentValue === '') {
      currentValue = editForm.value.fused_cross_cylinder_left;
    }
    
    if (currentValue === null || currentValue === undefined || currentValue === '') {
      editForm.value.accommodation_mem_left_value = 0;
      editForm.value.accommodation_mem_left_sign = sign;
      editForm.value.fused_cross_cylinder_left = sign === '-' ? -0 : 0;
    } else {
      const num = typeof currentValue === 'number' ? Math.abs(currentValue) : Math.abs(parseFloat(currentValue.toString().replace(/^[+\-]/, '')));
      if (!isNaN(num)) {
        const currentSign = getReactionSign(type);
        if (currentSign === sign) {
          editForm.value.accommodation_mem_left_value = null;
          editForm.value.accommodation_mem_left_sign = null;
          editForm.value.fused_cross_cylinder_left = null;
        } else {
          editForm.value.accommodation_mem_left_value = num;
          editForm.value.accommodation_mem_left_sign = sign;
          editForm.value.fused_cross_cylinder_left = sign === '-' ? -num : num;
        }
      }
    }
  } else if (type === 'both') {
    // 获取当前值（优先新字段）
    let currentValue = editForm.value.accommodation_amplitude_bcc_style;
    if (currentValue === null || currentValue === undefined || currentValue === '') {
      currentValue = editForm.value.fused_cross_cylinder_both;
    }
    
    if (currentValue === null || currentValue === undefined || currentValue === '') {
      editForm.value.accommodation_amplitude_bcc_style = 0;
      editForm.value.accommodation_bcc_sign = sign;
      editForm.value.fused_cross_cylinder_both = sign === '-' ? -0 : 0;
    } else {
      const num = typeof currentValue === 'number' ? Math.abs(currentValue) : Math.abs(parseFloat(currentValue.toString().replace(/^[+\-]/, '')));
      if (!isNaN(num)) {
        const currentSign = getReactionSign(type);
        if (currentSign === sign) {
          editForm.value.accommodation_amplitude_bcc_style = null;
          editForm.value.accommodation_bcc_sign = null;
          editForm.value.fused_cross_cylinder_both = null;
        } else {
          editForm.value.accommodation_amplitude_bcc_style = num;
          editForm.value.accommodation_bcc_sign = sign;
          editForm.value.fused_cross_cylinder_both = sign === '-' ? -num : num;
        }
      }
    }
  }
};

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
    hasFieldValue(record.fusional_disvergence_near_recovery)
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
    hasFieldValue(record.accommodative_facility) || hasFieldValue(record.accommodative_response)
  );
});

const hasOtherRelatedData = computed(() => {
  const record = props.record;
  if (!record) return false;
  return (
    hasFieldValue(record.worth_4_type) || hasFieldValue(record.stereopsis_testing) ||
    hasFieldValue(record.aniseikonia) ||
    // 四孔灯检查字段
    hasFieldValue(record.four_hole_lamp_2m) || hasFieldValue(record.four_hole_lamp_2m_dominant) ||
    hasFieldValue(record.four_hole_lamp_2m_horizontal) || hasFieldValue(record.four_hole_lamp_2m_vertical) ||
    hasFieldValue(record.four_hole_lamp_40cm) || hasFieldValue(record.four_hole_lamp_40cm_dominant) ||
    hasFieldValue(record.four_hole_lamp_40cm_horizontal) || hasFieldValue(record.four_hole_lamp_40cm_vertical) ||
    hasFieldValue(record.four_hole_lamp_suppression) || hasFieldValue(record.four_hole_lamp_suppression_2_type) ||
    hasFieldValue(record.four_hole_lamp_suppression_2_distance) || hasFieldValue(record.four_hole_lamp_suppression_2_direction) ||
    hasFieldValue(record.four_hole_lamp_suppression_3_type) || hasFieldValue(record.four_hole_lamp_suppression_3_distance) ||
    hasFieldValue(record.four_hole_lamp_suppression_3_direction) || hasFieldValue(record.four_hole_lamp_suppression_alternate_within_distance) ||
    hasFieldValue(record.four_hole_lamp_suppression_alternate_within_eye)
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

// 判断是否有视功能数据
const hasFunctionalData = computed(() => {
  const record = props.record;
  if (!record) return false;
  return (
    hasEyePositionData.value || hasACACAData.value || hasAccommodationData.value || 
    hasOtherRelatedData.value || hasSynoptophoreData.value
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

// 格式化调节反应值：显示两位小数，包含符号
// 兼容旧字段（合并的符号和值）和新字段（分离的符号和值）
const formatReactionValue = (value, sign = null) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'number' ? Math.abs(value) : Math.abs(parseFloat(value));
  if (isNaN(num)) return '-';
  const formatted = num.toFixed(2);
  // 优先使用传入的符号，如果没有则从值中判断（兼容旧字段）
  if (sign) {
    return `${sign}${formatted}`;
  }
  // 兼容旧字段：从值中判断符号
  const originalValue = typeof value === 'number' ? value : parseFloat(value);
  if (originalValue >= 0) {
    return `+${formatted}`;
  }
  return formatted;
};

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

// 计算计算性AC/A：PD/10 + (近眼位 - 远眼位) / 2.5
const calculatedACARatio = computed(() => {
  // 获取PD值，优先使用主观验光瞳距，其次客观验光瞳距
  const pd = props.record?.subjective_both_pupil_distance || 
             props.record?.objective_pupil_distance || 
             props.record?.vaec_both_pupil_distance;
  
  if (!pd || pd === null || pd === undefined || pd === '') {
    return '-';
  }
  
  const pdNum = typeof pd === 'number' ? pd : parseFloat(pd);
  if (isNaN(pdNum)) {
    return '-';
  }
  
  // 获取远眼位值（内隐斜为+，外隐斜为-）
  const farEyeValue = parseEyePositionValue(
    props.record?.pli_exo_distance_lateral_phoria,
    props.record?.plo_eso_distance_lateral_phoria
  );
  
  // 获取近眼位值（内隐斜为+，外隐斜为-）
  const nearEyeValue = parseEyePositionValue(
    props.record?.pli_exo_near_lateral_phoria,
    props.record?.plo_eso_near_lateral_phoria
  );
  
  // 计算：PD/10 + (近眼位 - 远眼位) / 2.5
  // 例如：PD=60, 远眼位=外5(-5), 近眼位=内5(+5)
  // 结果 = 60/10 + (5 - (-5)) / 2.5 = 6 + 10/2.5 = 6 + 4 = 10
  const result = pdNum / 10 + (nearEyeValue - farEyeValue) / 2.5;
  
  if (isNaN(result)) {
    return '-';
  }
  
  return result.toFixed(1);
});

// 计算计算性AC/A的参考值：PD/10
const calculatedACARatioReference = computed(() => {
  const pd = props.record?.subjective_both_pupil_distance || 
             props.record?.objective_pupil_distance || 
             props.record?.vaec_both_pupil_distance;
  
  if (!pd || pd === null || pd === undefined || pd === '') {
    return 'PD/10';
  }
  
  const pdNum = typeof pd === 'number' ? pd : parseFloat(pd);
  if (isNaN(pdNum)) {
    return 'PD/10';
  }
  
  const reference = pdNum / 10;
  return `${reference.toFixed(1)}△/D`;
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
  // 如果有破裂值，显示方向和数值
  if (!breakEmpty) {
    const num = parseFloat(breakValue);
    if (!isNaN(num) && num !== 0) return `${direction} ${num}△`;
  }
  // 如果只有方向没有数值，只显示方向（如"右高"或"左高"）
  return direction;
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

// 计算调节幅度参考值：15-年龄/4
const getAmplitudeReference = () => {
  if (!props.patientInfo || !props.patientInfo.birth_date) {
    return '15-年龄/4';
  }
  try {
    const birthDate = new Date(props.patientInfo.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    const reference = 15 - age / 4;
    return `${reference.toFixed(2)}D`;
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
      parts.push(vertical);
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
      parts.push(vertical);
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
  background: linear-gradient(180deg, rgba(34, 75, 150, 0.12) 0%, rgba(34, 75, 150, 0.08) 100%);
}

.eye-position-table th {
  padding: 10px 12px;
  text-align: center;
  font-weight: 600;
  color: #224b96;
  border: 1px solid rgba(34, 75, 150, 0.15);
  border-bottom: 2px solid rgba(34, 75, 150, 0.15);
  line-height: 1.3;
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

.func-table-col.reference {
  flex: 0 0 auto; // 改为固定宽度，不伸缩
  min-width: 110px; // 设置最小宽度，确保最宽的参考值能完整显示（从90px增加到110px）
  width: 110px; // 固定宽度，按照最宽参考值对齐（从90px增加到110px）
  color: #666;
  font-weight: 500;
  text-align: center;
  white-space: normal; // 允许换行
  word-break: break-word; // 允许单词内换行
}

// 四孔灯检查表格特定样式
.four-hole-lamp-table {
  .func-table-col.result {
    flex: 1.5; // 压缩检查结果列宽度（从2.62压缩到1.5）
    white-space: nowrap; // 检查结果列不换行，保持在同一行
    overflow: hidden;
    text-overflow: ellipsis; // 如果内容过长，显示省略号
    align-items: center; // 垂直居中
    justify-content: center; // 水平居中
  }
  
  .func-table-col.reference {
    flex: 0 0 auto;
    min-width: 220px; // 结果列宽度加一倍（从110px增加到220px）
    width: 220px;
    white-space: nowrap; // 结果列不换行，保持在同一行
    overflow: hidden;
    text-overflow: ellipsis; // 如果内容过长，显示省略号
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
  color: #1890ff; // 使用蓝色表示计算得出的值
  font-weight: 600; // 稍微加粗以区分
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

// 调节反应输入框包装器，包含+/-按钮
.accommodation-reaction-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

// +/-按钮容器（垂直布局）
.accommodation-sign-buttons {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
  height: 32px;
  align-self: stretch;
}

// +/-按钮样式
.accommodation-sign-btn {
  width: 28px;
  flex: 1;
  min-height: 0;
  padding: 0;
  margin: 0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 300;
  transition: all 0.3s;
  outline: none;
  line-height: 1;
  text-align: center;
  box-sizing: border-box;
  
  &:hover {
    border-color: #40a9ff;
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.accommodation-plus-btn {
  color: #666;
  background: #fff;
  
  &.active {
    background: #1890ff;
    color: #fff;
    border-color: #1890ff;
  }
}

.accommodation-minus-btn {
  color: #666;
  background: #fff;
  
  &.active {
    background: #1890ff;
    color: #fff;
    border-color: #1890ff;
  }
}

// 四孔灯检查容器
.four-hole-container {
  display: flex;
  align-items: center;
  gap: 24px;
  justify-content: flex-start;
  flex-wrap: wrap;
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

// 选择5时的选项容器样式
.five-options-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
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

</style>

