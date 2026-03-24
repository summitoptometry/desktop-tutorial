<template>
  <div class="routine-exam-style-two" :class="{ 'routine-exam-style-two--edit': viewMode === 'edit' }">
    <!-- 基础检查 -->
    <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasRoutineData || (reportLayout && hasRetinoscopyData)" 
         v-show="!showOnlySection || showOnlySection === 'routine'"
         class="section-block"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.routine }">
      <h3 
        v-if="!reportLayout && (viewMode !== 'view' || showSectionTitlesInView)"
        class="section-title"
        :class="{ 'clickable': enableCollapse }"
        @click="enableCollapse && handleToggleSection('routine')"
      >
        基础检查
        <span v-if="enableCollapse" class="section-toggle-icon">
          <UpOutlined v-if="sectionExpanded?.routine" />
          <DownOutlined v-else />
        </span>
      </h3>
      <div v-show="viewMode === 'print' || showOnlySection === 'routine' || (enableCollapse ? sectionExpanded?.routine : true)">
      <div v-if="reportLayout" class="exam-report-basic-retinoscopy-row">
        <table v-if="viewMode === 'edit' || hasRoutineData" class="exam-sheet exam-table-basic routine-info-table routine-report-by-eye">
        <colgroup>
          <col class="basic-col-eye" />
          <col class="basic-col-iop" />
          <col class="basic-col-corrected-iop" />
          <col class="basic-col-height" />
          <col class="basic-col-weight" />
          <col class="basic-col-bmi" />
        </colgroup>
        <tbody>
          <tr>
            <th
              class="group-head report-section-top-title"
              colspan="6"
              :class="{ clickable: enableCollapse }"
              @click="enableCollapse && handleToggleSection('routine')"
            >
              <span>基础检查</span>
              <span v-if="enableCollapse" class="section-toggle-icon report-section-side-toggle">
                <UpOutlined v-if="sectionExpanded?.routine" />
                <DownOutlined v-else />
              </span>
            </th>
          </tr>
          <tr>
            <th class="row-head">眼别</th>
            <th class="col-head basic-th-iop">眼压/mmHg</th>
            <th class="col-head basic-th-corrected-iop">修正眼压/mmHg</th>
            <th class="col-head basic-th-height">身高/cm</th>
            <th class="col-head basic-th-weight">体重/kg</th>
            <th class="col-head basic-th-bmi">BMI</th>
          </tr>
          <tr>
            <th class="eye-cell eye-name">右眼</th>
            <td class="basic-td-iop">
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-model:value="editForm.right_intraocular_pressure" :min="0" :precision="1" style="width: 100%" placeholder="mmHg" />
                </template>
                <template v-else>{{ formatIOP(record?.right_intraocular_pressure) }}</template>
              </div>
            </td>
            <td class="basic-td-corrected-iop cell-computed">
              <div class="cell-field">{{ formatIOP(calculateCorrectedIOP(viewMode === 'edit' ? editForm.right_intraocular_pressure : record?.right_intraocular_pressure, viewMode === 'edit' ? editForm.right_cct : record?.right_cct)) }}</div>
            </td>
            <td class="basic-td-height" rowspan="2">
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-model:value="editForm.height" :min="0" :precision="0" style="width: 100%" placeholder="cm" />
                </template>
                <template v-else>{{ formatHeight(record?.height) }}</template>
              </div>
            </td>
            <td class="basic-td-weight" rowspan="2">
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-model:value="editForm.weight" :min="0" :precision="1" style="width: 100%" placeholder="kg" />
                </template>
                <template v-else>{{ formatWeight(record?.weight) }}</template>
              </div>
            </td>
            <td rowspan="2" class="cell-computed basic-td-bmi">
              <div class="cell-field">{{ calculateBMI(viewMode === 'edit' ? editForm.height : record?.height, viewMode === 'edit' ? editForm.weight : record?.weight) }}</div>
            </td>
          </tr>
          <tr>
            <th class="eye-cell eye-name">左眼</th>
            <td class="basic-td-iop">
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-model:value="editForm.left_intraocular_pressure" :min="0" :precision="1" style="width: 100%" placeholder="mmHg" />
                </template>
                <template v-else>{{ formatIOP(record?.left_intraocular_pressure) }}</template>
              </div>
            </td>
            <td class="basic-td-corrected-iop cell-computed">
              <div class="cell-field">{{ formatIOP(calculateCorrectedIOP(viewMode === 'edit' ? editForm.left_intraocular_pressure : record?.left_intraocular_pressure, viewMode === 'edit' ? editForm.left_cct : record?.left_cct)) }}</div>
            </td>
          </tr>
        </tbody>
      </table>
        <table v-if="viewMode === 'edit' || hasRetinoscopyData" class="exam-sheet exam-table-objective-retinoscopy objective-report-by-eye">
          <tbody>
            <tr>
              <th class="group-head report-section-top-title" colspan="4">
                <span>检影验光</span>
              </th>
            </tr>
            <tr>
              <th class="col-head">眼别</th>
              <th class="col-head">球镜</th>
              <th class="col-head">柱镜</th>
              <th class="col-head">轴位</th>
            </tr>
            <tr>
              <th class="eye-cell eye-name">右眼</th>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input :value="getSphericalDisplayValue('retinoscopy_right_eye_spherical')" @input="handleSphericalChange('retinoscopy_right_eye_spherical', $event)" @blur="handleSphericalBlur('retinoscopy_right_eye_spherical')" class="prescription-input prescription-spherical cell-number" placeholder="球镜" style="width: 100%" /></template>
                  <template v-else>{{ formatSphere(record?.retinoscopy_right_eye_spherical, record?.retinoscopy_right_eye_spherical_sign) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <div class="objective-cyl-tooltip-wrap">
                      <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('retinoscopy_right_eye_cylindrical')">
                        <div class="cell-sphere-wrap"><a-input :value="getCylindricalDisplayValue('retinoscopy_right_eye_cylindrical')" @input="handleCylindricalChange('retinoscopy_right_eye_cylindrical', $event)" @blur="handleCylindricalBlur('retinoscopy_right_eye_cylindrical')" class="prescription-input prescription-cylindrical cell-input" placeholder="请填写负柱镜-" /></div>
                      </a-tooltip>
                    </div>
                  </template>
                  <template v-else><span class="cell-readonly-value">{{ formatCylinder(record?.retinoscopy_right_eye_cylindrical) }}</span></template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.retinoscopy_right_eye_axis" class="prescription-input prescription-axis cell-input" placeholder="轴位" /></template>
                  <template v-else><span class="cell-readonly-value">{{ formatAxis(record?.retinoscopy_right_eye_axis) }}</span></template>
                </div>
              </td>
            </tr>
            <tr>
              <th class="eye-cell eye-name">左眼</th>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input :value="getSphericalDisplayValue('retinoscopy_left_eye_spherical')" @input="handleSphericalChange('retinoscopy_left_eye_spherical', $event)" @blur="handleSphericalBlur('retinoscopy_left_eye_spherical')" class="prescription-input prescription-spherical cell-number" placeholder="球镜" style="width: 100%" /></template>
                  <template v-else>{{ formatSphere(record?.retinoscopy_left_eye_spherical, record?.retinoscopy_left_eye_spherical_sign) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <div class="objective-cyl-tooltip-wrap">
                      <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('retinoscopy_left_eye_cylindrical')">
                        <div class="cell-sphere-wrap"><a-input :value="getCylindricalDisplayValue('retinoscopy_left_eye_cylindrical')" @input="handleCylindricalChange('retinoscopy_left_eye_cylindrical', $event)" @blur="handleCylindricalBlur('retinoscopy_left_eye_cylindrical')" class="prescription-input prescription-cylindrical cell-input" placeholder="请填写负柱镜-" /></div>
                      </a-tooltip>
                    </div>
                  </template>
                  <template v-else><span class="cell-readonly-value">{{ formatCylinder(record?.retinoscopy_left_eye_cylindrical) }}</span></template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.retinoscopy_left_eye_axis" class="prescription-input prescription-axis cell-input" placeholder="轴位" /></template>
                  <template v-else><span class="cell-readonly-value">{{ formatAxis(record?.retinoscopy_left_eye_axis) }}</span></template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <table v-else class="routine-info-table">
        <thead>
          <tr>
            <th>检查项目</th>
            <th>数值</th>
            <th>单位</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="item-label">身高</td>
            <td>
            <template v-if="viewMode === 'edit'">
              <a-input-number 
                v-model:value="editForm.height" 
                :min="0" 
                :precision="0"
                  style="width: 24%" 
                placeholder="cm"
              />
            </template>
              <template v-else>{{ formatHeight(record?.height) }}</template>
            </td>
            <td class="unit-cell">cm</td>
          </tr>
          <tr>
            <td class="item-label">体重</td>
            <td>
            <template v-if="viewMode === 'edit'">
              <a-input-number 
                v-model:value="editForm.weight" 
                :min="0" 
                :precision="1"
                  style="width: 24%" 
                placeholder="kg"
              />
            </template>
              <template v-else>{{ formatWeight(record?.weight) }}</template>
            </td>
            <td class="unit-cell">kg</td>
          </tr>
          <tr>
            <td class="item-label">BMI</td>
            <td class="cell-computed">{{ calculateBMI(viewMode === 'edit' ? editForm.height : record?.height, viewMode === 'edit' ? editForm.weight : record?.weight) }}</td>
            <td class="unit-cell">-</td>
          </tr>
          <tr>
            <td class="item-label">眼压（右眼）</td>
            <td>
            <template v-if="viewMode === 'edit'">
              <a-input-number 
                v-model:value="editForm.right_intraocular_pressure" 
                :min="0" 
                :precision="1"
                  style="width: 24%" 
                placeholder="mmHg"
              />
              </template>
              <template v-else>{{ formatIOP(record?.right_intraocular_pressure) }}</template>
            </td>
            <td class="unit-cell">mmHg</td>
          </tr>
          <tr>
            <td class="item-label">眼压（左眼）</td>
            <td>
              <template v-if="viewMode === 'edit'">
              <a-input-number 
                v-model:value="editForm.left_intraocular_pressure" 
                :min="0" 
                :precision="1"
                  style="width: 24%" 
                placeholder="mmHg"
              />
              </template>
              <template v-else>{{ formatIOP(record?.left_intraocular_pressure) }}</template>
            </td>
            <td class="unit-cell">mmHg</td>
          </tr>
          <tr>
            <td class="item-label">修正眼压（右眼）</td>
            <td class="cell-computed">{{ formatIOP(calculateCorrectedIOP(viewMode === 'edit' ? editForm.right_intraocular_pressure : record?.right_intraocular_pressure, viewMode === 'edit' ? editForm.right_cct : record?.right_cct)) }}</td>
            <td class="unit-cell">mmHg</td>
          </tr>
          <tr>
            <td class="item-label">修正眼压（左眼）</td>
            <td class="cell-computed">{{ formatIOP(calculateCorrectedIOP(viewMode === 'edit' ? editForm.left_intraocular_pressure : record?.left_intraocular_pressure, viewMode === 'edit' ? editForm.left_cct : record?.left_cct)) }}</td>
            <td class="unit-cell">mmHg</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- 视力检查 -->
    <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasVisionData" 
         v-show="!showOnlySection || showOnlySection === 'vision'"
         class="section-block"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.vision }">
      <h3 
        v-if="!reportLayout && (viewMode === 'edit' || showSectionTitlesInView)"
        class="section-title"
        :class="{ 'clickable': enableCollapse }"
        @click="enableCollapse && handleToggleSection('vision')"
      >
        视力检查
        <span v-if="enableCollapse" class="section-toggle-icon">
          <UpOutlined v-if="sectionExpanded?.vision" />
          <DownOutlined v-else />
        </span>
      </h3>
      <div v-show="viewMode === 'print' || showOnlySection === 'vision' || (enableCollapse ? sectionExpanded?.vision : true)">
      <table v-if="reportLayout" class="exam-sheet exam-table-vision vision-table vision-report-by-eye">
        <tbody>
          <tr>
            <th
              class="side-title report-section-side-title"
              rowspan="5"
              :class="{ clickable: enableCollapse }"
              @click="enableCollapse && handleToggleSection('vision')"
            >
              <span class="report-section-side-title-text">视力检查</span>
              <span v-if="enableCollapse" class="section-toggle-icon report-section-side-toggle">
                <UpOutlined v-if="sectionExpanded?.vision" />
                <DownOutlined v-else />
              </span>
            </th>
            <th class="row-head" rowspan="2">眼别</th>
            <th class="group-head" colspan="2">裸眼视力</th>
            <th class="group-head" colspan="2">戴镜视力</th>
            <th class="group-head" rowspan="2">旧镜类型</th>
            <th class="group-head" colspan="3">旧镜光度</th>
          </tr>
          <tr>
            <th class="sub-head">远用</th>
            <th class="sub-head">近用</th>
            <th class="sub-head">远用</th>
            <th class="sub-head">近用</th>
            <th class="sub-head">球镜</th>
            <th class="sub-head">柱镜</th>
            <th class="sub-head">轴位</th>
          </tr>
          <tr>
            <th class="eye-cell eye-name">右眼</th>
            <td>
              <div class="cell-field">
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'uva_right_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('uva_right_vision')" @input="onVisionInput('uva_right_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('uva_right_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('uva_right_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'uva_right_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'uva_right_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'uva_right_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'uva_right_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'uva_right_vision').superscriptPart">{{ getVisionDisplayParts(record, 'uva_right_vision').superscriptPart }}</sup></span>
              </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'near_uva_right_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_uva_right_vision')" @input="onVisionInput('near_uva_right_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_uva_right_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_uva_right_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'near_uva_right_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'near_uva_right_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_uva_right_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_uva_right_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_uva_right_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_uva_right_vision').superscriptPart }}</sup></span>
              </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'vaec_right_old_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('vaec_right_old_vision')" @input="onVisionInput('vaec_right_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('vaec_right_old_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('vaec_right_old_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'vaec_right_old_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'vaec_right_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'vaec_right_old_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'vaec_right_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'vaec_right_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'vaec_right_old_vision').superscriptPart }}</sup></span>
              </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'near_subjective_right_old_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_subjective_right_old_vision')" @input="onVisionInput('near_subjective_right_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_subjective_right_old_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_subjective_right_old_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'near_subjective_right_old_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'near_subjective_right_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_subjective_right_old_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_subjective_right_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_subjective_right_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_subjective_right_old_vision').superscriptPart }}</sup></span>
              </template>
              </div>
            </td>
            <td rowspan="3" class="vision-glasses-type-cell">
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-select :value="bothGlassesType" @change="handleBothGlassesTypeChange" class="glasses-type-select" placeholder="旧镜类型" allowClear popup-class-name="glasses-type-dropdown" :dropdown-match-select-width="false">
                    <a-select-option value="单焦点">单焦点</a-select-option>
                    <a-select-option value="点扩散">点扩散</a-select-option>
                    <a-select-option value="多点离焦">多点离焦</a-select-option>
                    <a-select-option value="渐进">渐进</a-select-option>
                    <a-select-option value="抗疲劳">抗疲劳</a-select-option>
                    <a-select-option value="变色">变色</a-select-option>
                  </a-select>
                </template>
                <template v-else>{{ formatOldGlassesType(record?.vaec_right_glasses_type, record?.vaec_left_glasses_type) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-input :value="getSphericalDisplayValue('vaec_right_spherical')" @input="handleSphericalChange('vaec_right_spherical', $event)" @blur="handleSphericalBlur('vaec_right_spherical')" class="prescription-input prescription-spherical" placeholder="球镜" style="width: 100%" />
                </template>
                <template v-else>{{ formatSphere(record?.vaec_right_spherical, record?.vaec_right_spherical_sign) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('vaec_right_cylindrical')">
                    <div class="cell-sphere-wrap">
                      <a-input :value="getCylindricalDisplayValue('vaec_right_cylindrical')" @input="handleCylindricalChange('vaec_right_cylindrical', $event)" @blur="handleCylindricalBlur('vaec_right_cylindrical')" class="prescription-input prescription-cylindrical" placeholder="请填写负柱镜-" />
                    </div>
                  </a-tooltip>
                </template>
                <template v-else>{{ formatCylinder(record?.vaec_right_cylindrical) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-model:value="editForm.vaec_right_axis" :min="0" :max="180" class="prescription-input prescription-axis" placeholder="轴位" style="width: 100%" />
                </template>
                <template v-else>{{ formatAxis(record?.vaec_right_axis) }}</template>
              </div>
            </td>
          </tr>
          <tr>
            <th class="eye-cell eye-name">左眼</th>
            <td>
              <div class="cell-field">
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'uva_left_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('uva_left_vision')" @input="onVisionInput('uva_left_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('uva_left_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('uva_left_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'uva_left_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'uva_left_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'uva_left_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'uva_left_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'uva_left_vision').superscriptPart">{{ getVisionDisplayParts(record, 'uva_left_vision').superscriptPart }}</sup></span>
              </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'near_uva_left_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_uva_left_vision')" @input="onVisionInput('near_uva_left_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_uva_left_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_uva_left_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'near_uva_left_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'near_uva_left_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_uva_left_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_uva_left_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_uva_left_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_uva_left_vision').superscriptPart }}</sup></span>
              </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'vaec_left_old_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('vaec_left_old_vision')" @input="onVisionInput('vaec_left_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('vaec_left_old_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('vaec_left_old_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'vaec_left_old_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'vaec_left_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'vaec_left_old_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'vaec_left_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'vaec_left_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'vaec_left_old_vision').superscriptPart }}</sup></span>
              </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'near_subjective_left_old_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_subjective_left_old_vision')" @input="onVisionInput('near_subjective_left_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_subjective_left_old_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_subjective_left_old_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'near_subjective_left_old_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'near_subjective_left_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_subjective_left_old_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_subjective_left_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_subjective_left_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_subjective_left_old_vision').superscriptPart }}</sup></span>
              </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-input :value="getSphericalDisplayValue('vaec_left_spherical')" @input="handleSphericalChange('vaec_left_spherical', $event)" @blur="handleSphericalBlur('vaec_left_spherical')" class="prescription-input prescription-spherical" placeholder="球镜" style="width: 100%" />
                </template>
                <template v-else>{{ formatSphere(record?.vaec_left_spherical, record?.vaec_left_spherical_sign) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('vaec_left_cylindrical')">
                    <div class="cell-sphere-wrap">
                      <a-input :value="getCylindricalDisplayValue('vaec_left_cylindrical')" @input="handleCylindricalChange('vaec_left_cylindrical', $event)" @blur="handleCylindricalBlur('vaec_left_cylindrical')" class="prescription-input prescription-cylindrical" placeholder="请填写负柱镜-" />
                    </div>
                  </a-tooltip>
                </template>
                <template v-else>{{ formatCylinder(record?.vaec_left_cylindrical) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-input-number v-model:value="editForm.vaec_left_axis" :min="0" :max="180" class="prescription-input prescription-axis" placeholder="轴位" style="width: 100%" />
                </template>
                <template v-else>{{ formatAxis(record?.vaec_left_axis) }}</template>
              </div>
            </td>
          </tr>
          <tr>
            <th class="eye-cell eye-name">双眼</th>
            <td>
              <div class="cell-field">
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'uva_both_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('uva_both_vision')" @input="onVisionInput('uva_both_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('uva_both_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('uva_both_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'uva_both_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'uva_both_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'uva_both_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'uva_both_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'uva_both_vision').superscriptPart">{{ getVisionDisplayParts(record, 'uva_both_vision').superscriptPart }}</sup></span>
              </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'near_uva_both_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_uva_both_vision')" @input="onVisionInput('near_uva_both_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_uva_both_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_uva_both_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'near_uva_both_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'near_uva_both_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_uva_both_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_uva_both_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_uva_both_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_uva_both_vision').superscriptPart }}</sup></span>
              </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'vaec_both_old_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('vaec_both_old_vision')" @input="onVisionInput('vaec_both_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('vaec_both_old_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('vaec_both_old_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'vaec_both_old_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'vaec_both_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'vaec_both_old_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'vaec_both_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'vaec_both_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'vaec_both_old_vision').superscriptPart }}</sup></span>
              </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'near_subjective_both_old_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_subjective_both_old_vision')" @input="onVisionInput('near_subjective_both_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_subjective_both_old_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_subjective_both_old_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'near_subjective_both_old_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'near_subjective_both_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_subjective_both_old_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_subjective_both_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_subjective_both_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_subjective_both_old_vision').superscriptPart }}</sup></span>
              </template>
              </div>
            </td>
            <td colspan="3" class="pd-cell-report">
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <span class="pd-label">瞳距</span>
                  <a-input-number v-model:value="editForm.vaec_both_pupil_distance" :min="0" :precision="1" class="pd-input-number" placeholder="mm" />
                  <span class="pd-unit">mm</span>
                </template>
                <template v-else>瞳距 {{ formatPDNumber(record?.vaec_both_pupil_distance) }} mm</template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <table v-else class="vision-table">
        <thead>
          <tr>
            <th>检查项目</th>
            <th>远用/近用</th>
            <th class="eye-name">右眼</th>
            <th class="eye-name">左眼</th>
            <th class="eye-name">双眼</th>
          </tr>
        </thead>
        <tbody>
          <!-- 裸眼视力 -->
          <tr>
            <td class="vision-label" rowspan="2">裸眼视力</td>
            <td class="vision-sub-label-cell">远用</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'uva_right_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('uva_right_vision')" @input="onVisionInput('uva_right_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('uva_right_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('uva_right_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'uva_right_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'uva_right_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'uva_right_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'uva_right_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'uva_right_vision').superscriptPart">{{ getVisionDisplayParts(record, 'uva_right_vision').superscriptPart }}</sup></span>
              </template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'uva_left_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('uva_left_vision')" @input="onVisionInput('uva_left_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('uva_left_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('uva_left_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'uva_left_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'uva_left_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'uva_left_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'uva_left_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'uva_left_vision').superscriptPart">{{ getVisionDisplayParts(record, 'uva_left_vision').superscriptPart }}</sup></span>
              </template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'uva_both_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('uva_both_vision')" @input="onVisionInput('uva_both_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('uva_both_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('uva_both_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'uva_both_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'uva_both_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'uva_both_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'uva_both_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'uva_both_vision').superscriptPart">{{ getVisionDisplayParts(record, 'uva_both_vision').superscriptPart }}</sup></span>
              </template>
            </td>
          </tr>
          <tr>
            <td class="vision-sub-label-cell">近用</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'near_uva_right_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_uva_right_vision')" @input="onVisionInput('near_uva_right_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_uva_right_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_uva_right_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'near_uva_right_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'near_uva_right_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_uva_right_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_uva_right_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_uva_right_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_uva_right_vision').superscriptPart }}</sup></span>
              </template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'near_uva_left_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_uva_left_vision')" @input="onVisionInput('near_uva_left_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_uva_left_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_uva_left_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'near_uva_left_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'near_uva_left_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_uva_left_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_uva_left_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_uva_left_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_uva_left_vision').superscriptPart }}</sup></span>
              </template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'near_uva_both_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_uva_both_vision')" @input="onVisionInput('near_uva_both_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_uva_both_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_uva_both_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'near_uva_both_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'near_uva_both_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_uva_both_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_uva_both_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_uva_both_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_uva_both_vision').superscriptPart }}</sup></span>
              </template>
            </td>
          </tr>
          <!-- 戴镜视力 -->
          <tr>
            <td class="vision-label" rowspan="2">戴镜视力</td>
            <td class="vision-sub-label-cell">远用</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'vaec_right_old_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('vaec_right_old_vision')" @input="onVisionInput('vaec_right_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('vaec_right_old_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('vaec_right_old_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'vaec_right_old_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'vaec_right_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'vaec_right_old_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'vaec_right_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'vaec_right_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'vaec_right_old_vision').superscriptPart }}</sup></span>
              </template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'vaec_left_old_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('vaec_left_old_vision')" @input="onVisionInput('vaec_left_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('vaec_left_old_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('vaec_left_old_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'vaec_left_old_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'vaec_left_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'vaec_left_old_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'vaec_left_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'vaec_left_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'vaec_left_old_vision').superscriptPart }}</sup></span>
              </template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'vaec_both_old_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('vaec_both_old_vision')" @input="onVisionInput('vaec_both_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('vaec_both_old_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('vaec_both_old_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'vaec_both_old_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'vaec_both_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'vaec_both_old_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'vaec_both_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'vaec_both_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'vaec_both_old_vision').superscriptPart }}</sup></span>
              </template>
            </td>
          </tr>
          <tr>
            <td class="vision-sub-label-cell">近用</td>
            <td>
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'near_subjective_right_old_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_subjective_right_old_vision')" @input="onVisionInput('near_subjective_right_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_subjective_right_old_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_subjective_right_old_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'near_subjective_right_old_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'near_subjective_right_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_subjective_right_old_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_subjective_right_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_subjective_right_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_subjective_right_old_vision').superscriptPart }}</sup></span>
              </template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'near_subjective_left_old_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_subjective_left_old_vision')" @input="onVisionInput('near_subjective_left_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_subjective_left_old_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_subjective_left_old_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'near_subjective_left_old_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'near_subjective_left_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_subjective_left_old_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_subjective_left_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_subjective_left_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_subjective_left_old_vision').superscriptPart }}</sup></span>
              </template>
            </td>
            <td>
              <template v-if="viewMode === 'edit'">
                <template v-if="visionFocusedCell === 'near_subjective_both_old_vision'">
                  <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_subjective_both_old_vision')" @input="onVisionInput('near_subjective_both_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_subjective_both_old_vision', el)" />
                </template>
                <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_subjective_both_old_vision')">
                  <span>{{ getVisionDisplayParts(editForm, 'near_subjective_both_old_vision').valuePart }}</span>
                  <sup v-if="getVisionDisplayParts(editForm, 'near_subjective_both_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_subjective_both_old_vision').superscriptPart }}</sup>
                </div>
              </template>
              <template v-else>
                <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_subjective_both_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_subjective_both_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_subjective_both_old_vision').superscriptPart }}</sup></span>
              </template>
            </td>
          </tr>
          <!-- 旧镜光度 -->
          <tr v-if="viewMode !== 'view' || hasOldGlasses" class="old-glasses-row">
            <td class="old-glasses-label">旧镜光度</td>
            <td class="old-glasses-cell">
              <template v-if="viewMode === 'edit'">
                <a-select 
                  :value="bothGlassesType" 
                  @change="handleBothGlassesTypeChange" 
                  class="glasses-type-select"
                  placeholder="旧镜类型" 
                  allowClear
                  popup-class-name="glasses-type-dropdown"
                  :dropdown-match-select-width="false"
                >
                  <a-select-option value="单焦点">单焦点</a-select-option>
                  <a-select-option value="点扩散">点扩散</a-select-option>
                  <a-select-option value="多点离焦">多点离焦</a-select-option>
                  <a-select-option value="渐进">渐进</a-select-option>
                  <a-select-option value="抗疲劳">抗疲劳</a-select-option>
                  <a-select-option value="变色">变色</a-select-option>
                </a-select>
              </template>
              <template v-else>{{ formatOldGlassesType(record?.vaec_right_glasses_type, record?.vaec_left_glasses_type) }}</template>
            </td>
            <td class="old-glasses-cell">
              <template v-if="viewMode === 'edit'">
                <div class="prescription-input-group">
                  <a-input
                    :value="getSphericalDisplayValue('vaec_right_spherical')"
                    @input="handleSphericalChange('vaec_right_spherical', $event)"
                    @blur="handleSphericalBlur('vaec_right_spherical')"
                    class="prescription-input prescription-spherical"
                    placeholder="球镜"
                  />
                  <a-input-number 
                    v-model:value="editForm.vaec_right_cylindrical" 
                    :step="0.25" 
                    :precision="2"
                    class="prescription-input prescription-cylindrical" 
                    placeholder="柱镜" 
                  />
                  <a-input-number 
                    v-model:value="editForm.vaec_right_axis" 
                    :min="0"
                    :max="180"
                    class="prescription-input prescription-axis" 
                    placeholder="轴位" 
                  />
                </div>
              </template>
              <template v-else>{{ formatPrescriptionWithoutSign(record?.vaec_right_spherical, record?.vaec_right_cylindrical, record?.vaec_right_axis) }}</template>
            </td>
            <td class="old-glasses-cell">
              <template v-if="viewMode === 'edit'">
                <div class="prescription-input-group">
                  <a-input
                    :value="getSphericalDisplayValue('vaec_left_spherical')"
                    @input="handleSphericalChange('vaec_left_spherical', $event)"
                    @blur="handleSphericalBlur('vaec_left_spherical')"
                    class="prescription-input prescription-spherical"
                    placeholder="球镜"
                  />
                  <a-input-number 
                    v-model:value="editForm.vaec_left_cylindrical" 
                    :step="0.25" 
                    :precision="2"
                    class="prescription-input prescription-cylindrical" 
                    placeholder="柱镜" 
                  />
                  <a-input-number 
                    v-model:value="editForm.vaec_left_axis" 
                    :min="0"
                    :max="180"
                    class="prescription-input prescription-axis" 
                    placeholder="轴位" 
                  />
                </div>
              </template>
              <template v-else>{{ formatPrescriptionWithoutSign(record?.vaec_left_spherical, record?.vaec_left_cylindrical, record?.vaec_left_axis) }}</template>
            </td>
            <td class="old-glasses-cell">
              <template v-if="viewMode === 'edit'">
                <a-input-number v-model:value="editForm.vaec_both_pupil_distance" :min="0" :precision="1" class="pd-input-number" placeholder="瞳距" />
              </template>
              <template v-else>PD：{{ formatPDNumber(record?.vaec_both_pupil_distance) }} mm</template>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <template v-if="reportLayout">
      <slot name="report-after-vision" />
    </template>

    <!-- 电脑验光检查 -->
    <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasObjectiveComputerBlockData || (!reportLayout && hasRetinoscopyData)" 
         v-show="!showOnlySection || showOnlySection === 'objective-refraction'"
         class="section-block"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.['objective-refraction'] }">
      <h3 
        v-if="!reportLayout && (viewMode !== 'view' || showSectionTitlesInView)"
        class="section-title"
        :class="{ 'clickable': enableCollapse }"
        @click="enableCollapse && handleToggleSection('objective-refraction')"
      >
        电脑验光检查
        <span v-if="enableCollapse" class="section-toggle-icon">
          <UpOutlined v-if="sectionExpanded?.['objective-refraction']" />
          <DownOutlined v-else />
        </span>
      </h3>
      <div v-show="viewMode === 'print' || showOnlySection === 'objective-refraction' || (enableCollapse ? sectionExpanded?.['objective-refraction'] : true)">
        <table v-if="reportLayout" class="exam-sheet exam-table-objective-refraction objective-report-by-eye">
          <tbody>
            <tr>
              <th
                class="side-title report-section-side-title"
                rowspan="4"
                :class="{ clickable: enableCollapse }"
                @click="enableCollapse && handleToggleSection('objective-refraction')"
              >
                <span class="report-section-side-title-text">电脑验光检查</span>
                <span v-if="enableCollapse" class="section-toggle-icon report-section-side-toggle">
                  <UpOutlined v-if="sectionExpanded?.['objective-refraction']" />
                  <DownOutlined v-else />
                </span>
              </th>
              <th class="sub-head">（小瞳）</th>
              <th class="sub-head">球镜</th>
              <th class="sub-head">柱镜</th>
              <th class="sub-head">轴位</th>
              <th class="sub-head">瞳孔直径</th>
              <th class="sub-head">等效球镜</th>
              <th class="sub-head">瞳距</th>
              <th class="sub-head objective-pupillary-col-head">（散瞳）</th>
              <th class="sub-head">球镜</th>
              <th class="sub-head">柱镜</th>
              <th class="sub-head">轴位</th>
              <th class="sub-head">瞳孔直径</th>
              <th class="sub-head">等效球镜</th>
            </tr>
            <tr>
              <th class="eye-cell eye-name">右眼</th>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input :value="getSphericalDisplayValue('objective_right_spherical')" @input="handleSphericalChange('objective_right_spherical', $event)" @blur="handleSphericalBlur('objective_right_spherical')" class="prescription-input prescription-spherical cell-number" placeholder="球镜" style="width: 100%" /></template>
                  <template v-else>{{ formatSphere(record?.objective_right_spherical, record?.objective_right_spherical_sign) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <div class="objective-cyl-tooltip-wrap">
                      <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('objective_right_cylindrical')">
                        <div class="cell-sphere-wrap"><a-input :value="getCylindricalDisplayValue('objective_right_cylindrical')" @input="handleCylindricalChange('objective_right_cylindrical', $event)" @blur="handleCylindricalBlur('objective_right_cylindrical')" class="prescription-input prescription-cylindrical cell-input" placeholder="请填写负柱镜-" /></div>
                      </a-tooltip>
                    </div>
                  </template>
                  <template v-else><span class="cell-readonly-value">{{ formatCylinder(record?.objective_right_cylindrical) }}</span></template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.objective_right_axis" class="prescription-input prescription-axis cell-input" placeholder="轴位" /></template>
                  <template v-else><span class="cell-readonly-value">{{ formatAxis(record?.objective_right_axis) }}</span></template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.objective_right_pupil" class="prescription-input prescription-pupil cell-input" placeholder="mm" style="width: 100%" /></template>
                  <template v-else><span class="cell-readonly-value"><template v-if="hasValue(record?.objective_right_pupil)">{{ formatPS(record?.objective_right_pupil) }}mm</template><template v-else>-</template></span></template>
                </div>
              </td>
              <td class="cell-computed">
                <div class="cell-field"><span class="cell-readonly-value">{{ formatSE(viewMode === 'edit' ? editForm.objective_right_spherical : record?.objective_right_spherical, viewMode === 'edit' ? editForm.objective_right_cylindrical : record?.objective_right_cylindrical, viewMode === 'edit' ? editForm.objective_right_spherical_sign : record?.objective_right_spherical_sign) }}</span></div>
              </td>
              <td rowspan="3">
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input-number v-model:value="editForm.subjective_both_pupil_distance" :min="0" :precision="1" class="cell-number" style="width: 100%" placeholder="mm" /></template>
                  <template v-else>{{ formatPDNumber(record?.subjective_both_pupil_distance ?? record?.objective_pupil_distance ?? record?.vaec_both_pupil_distance) }}</template>
                </div>
              </td>
              <th class="eye-cell eye-name">右眼</th>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input :value="getSphericalDisplayValue('pupillary_objective_right_spherical')" @input="handleSphericalChange('pupillary_objective_right_spherical', $event)" @blur="handleSphericalBlur('pupillary_objective_right_spherical')" class="prescription-input prescription-spherical cell-number" placeholder="球镜" style="width: 100%" /></template>
                  <template v-else>{{ formatSphere(record?.pupillary_objective_right_spherical, record?.pupillary_objective_right_spherical_sign) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <div class="objective-cyl-tooltip-wrap">
                      <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('pupillary_objective_right_cylindrical')">
                        <div class="cell-sphere-wrap"><a-input :value="getCylindricalDisplayValue('pupillary_objective_right_cylindrical')" @input="handleCylindricalChange('pupillary_objective_right_cylindrical', $event)" @blur="handleCylindricalBlur('pupillary_objective_right_cylindrical')" class="prescription-input prescription-cylindrical cell-input" placeholder="请填写负柱镜-" /></div>
                      </a-tooltip>
                    </div>
                  </template>
                  <template v-else><span class="cell-readonly-value">{{ formatCylinder(record?.pupillary_objective_right_cylindrical) }}</span></template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.pupillary_objective_right_axis" class="prescription-input prescription-axis cell-input" placeholder="轴位" /></template>
                  <template v-else><span class="cell-readonly-value">{{ formatAxis(record?.pupillary_objective_right_axis) }}</span></template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.pupillary_objective_right_pupil" class="prescription-input prescription-pupil cell-input" placeholder="mm" style="width: 100%" /></template>
                  <template v-else><span class="cell-readonly-value"><template v-if="hasValue(record?.pupillary_objective_right_pupil)">{{ formatPS(record?.pupillary_objective_right_pupil) }}mm</template><template v-else>-</template></span></template>
                </div>
              </td>
              <td class="cell-computed">
                <div class="cell-field"><span class="cell-readonly-value">{{ formatSE(viewMode === 'edit' ? editForm.pupillary_objective_right_spherical : record?.pupillary_objective_right_spherical, viewMode === 'edit' ? editForm.pupillary_objective_right_cylindrical : record?.pupillary_objective_right_cylindrical, viewMode === 'edit' ? editForm.pupillary_objective_right_spherical_sign : record?.pupillary_objective_right_spherical_sign) }}</span></div>
              </td>
            </tr>
            <tr>
              <th class="eye-cell eye-name">左眼</th>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input :value="getSphericalDisplayValue('objective_left_spherical')" @input="handleSphericalChange('objective_left_spherical', $event)" @blur="handleSphericalBlur('objective_left_spherical')" class="prescription-input prescription-spherical cell-number" placeholder="球镜" style="width: 100%" /></template>
                  <template v-else>{{ formatSphere(record?.objective_left_spherical, record?.objective_left_spherical_sign) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <div class="objective-cyl-tooltip-wrap">
                      <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('objective_left_cylindrical')">
                        <div class="cell-sphere-wrap"><a-input :value="getCylindricalDisplayValue('objective_left_cylindrical')" @input="handleCylindricalChange('objective_left_cylindrical', $event)" @blur="handleCylindricalBlur('objective_left_cylindrical')" class="prescription-input prescription-cylindrical cell-input" placeholder="请填写负柱镜-" /></div>
                      </a-tooltip>
                    </div>
                  </template>
                  <template v-else><span class="cell-readonly-value">{{ formatCylinder(record?.objective_left_cylindrical) }}</span></template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.objective_left_axis" class="prescription-input prescription-axis cell-input" placeholder="轴位" /></template>
                  <template v-else><span class="cell-readonly-value">{{ formatAxis(record?.objective_left_axis) }}</span></template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.objective_left_pupil" class="prescription-input prescription-pupil cell-input" placeholder="mm" style="width: 100%" /></template>
                  <template v-else><span class="cell-readonly-value"><template v-if="hasValue(record?.objective_left_pupil)">{{ formatPS(record?.objective_left_pupil) }}mm</template><template v-else>-</template></span></template>
                </div>
              </td>
              <td class="cell-computed">
                <div class="cell-field"><span class="cell-readonly-value">{{ formatSE(viewMode === 'edit' ? editForm.objective_left_spherical : record?.objective_left_spherical, viewMode === 'edit' ? editForm.objective_left_cylindrical : record?.objective_left_cylindrical, viewMode === 'edit' ? editForm.objective_left_spherical_sign : record?.objective_left_spherical_sign) }}</span></div>
              </td>
              <th class="eye-cell eye-name">左眼</th>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input :value="getSphericalDisplayValue('pupillary_objective_left_spherical')" @input="handleSphericalChange('pupillary_objective_left_spherical', $event)" @blur="handleSphericalBlur('pupillary_objective_left_spherical')" class="prescription-input prescription-spherical cell-number" placeholder="球镜" style="width: 100%" /></template>
                  <template v-else>{{ formatSphere(record?.pupillary_objective_left_spherical, record?.pupillary_objective_left_spherical_sign) }}</template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'">
                    <div class="objective-cyl-tooltip-wrap">
                      <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('pupillary_objective_left_cylindrical')">
                        <div class="cell-sphere-wrap"><a-input :value="getCylindricalDisplayValue('pupillary_objective_left_cylindrical')" @input="handleCylindricalChange('pupillary_objective_left_cylindrical', $event)" @blur="handleCylindricalBlur('pupillary_objective_left_cylindrical')" class="prescription-input prescription-cylindrical cell-input" placeholder="请填写负柱镜-" /></div>
                      </a-tooltip>
                    </div>
                  </template>
                  <template v-else><span class="cell-readonly-value">{{ formatCylinder(record?.pupillary_objective_left_cylindrical) }}</span></template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.pupillary_objective_left_axis" class="prescription-input prescription-axis cell-input" placeholder="轴位" /></template>
                  <template v-else><span class="cell-readonly-value">{{ formatAxis(record?.pupillary_objective_left_axis) }}</span></template>
                </div>
              </td>
              <td>
                <div class="cell-field">
                  <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.pupillary_objective_left_pupil" class="prescription-input prescription-pupil cell-input" placeholder="mm" style="width: 100%" /></template>
                  <template v-else><span class="cell-readonly-value"><template v-if="hasValue(record?.pupillary_objective_left_pupil)">{{ formatPS(record?.pupillary_objective_left_pupil) }}mm</template><template v-else>-</template></span></template>
                </div>
              </td>
              <td class="cell-computed">
                <div class="cell-field"><span class="cell-readonly-value">{{ formatSE(viewMode === 'edit' ? editForm.pupillary_objective_left_spherical : record?.pupillary_objective_left_spherical, viewMode === 'edit' ? editForm.pupillary_objective_left_cylindrical : record?.pupillary_objective_left_cylindrical, viewMode === 'edit' ? editForm.pupillary_objective_left_spherical_sign : record?.pupillary_objective_left_spherical_sign) }}</span></div>
              </td>
            </tr>
            <tr>
              <th class="eye-cell eye-name">双眼</th>
              <td colspan="5" class="cell-muted">
                <div class="cell-field">—</div>
              </td>
              <th class="eye-cell eye-name">双眼</th>
              <td colspan="5" class="cell-muted">
                <div class="cell-field">—</div>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- 电脑验光检查表格（检影 / 小瞳 / 散瞳） -->
      <table v-else class="refraction-table">
        <thead>
          <tr>
            <th rowspan="2">检查项目</th>
            <th colspan="3">右眼</th>
            <th colspan="3">左眼</th>
          </tr>
          <tr>
            <th>球镜</th>
            <th>柱镜</th>
            <th>轴位</th>
            <th>球镜</th>
            <th>柱镜</th>
            <th>轴位</th>
          </tr>
        </thead>

        <tbody>
          <!-- （小瞳）行（共2行） -->
          <tr>
            <td class="refraction-label" rowspan="2">（小瞳）</td>
            <!-- 右眼球镜列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input
                  :value="getSphericalDisplayValue('objective_right_spherical')"
                  @input="handleSphericalChange('objective_right_spherical', $event)"
                  @blur="handleSphericalBlur('objective_right_spherical')"
                  class="prescription-input prescription-spherical"
                  placeholder="球镜"
                  style="width: 100%"
                />
              </template>
              <template v-else>{{ formatSphere(record?.objective_right_spherical, record?.objective_right_spherical_sign) }}</template>
            </td>
            <!-- 右眼柱镜列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('objective_right_cylindrical')">
                  <div class="cell-sphere-wrap">
                    <a-input 
                      :value="getCylindricalDisplayValue('objective_right_cylindrical')" 
                      @input="handleCylindricalChange('objective_right_cylindrical', $event)"
                      @blur="handleCylindricalBlur('objective_right_cylindrical')"
                      class="prescription-input prescription-cylindrical" 
                      placeholder="请填写负柱镜-" 
                    />
                  </div>
                </a-tooltip>
              </template>
              <template v-else>
                {{ formatCylinder(record?.objective_right_cylindrical) }}
              </template>
            </td>
            <!-- 右眼轴位列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input v-model:value="editForm.objective_right_axis" class="prescription-input prescription-axis" placeholder="轴位" />
              </template>
              <template v-else>
                {{ formatAxis(record?.objective_right_axis) }}
              </template>
            </td>
            <!-- 左眼球镜列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input
                  :value="getSphericalDisplayValue('objective_left_spherical')"
                  @input="handleSphericalChange('objective_left_spherical', $event)"
                  @blur="handleSphericalBlur('objective_left_spherical')"
                  class="prescription-input prescription-spherical"
                  placeholder="球镜"
                  style="width: 100%"
                />
              </template>
              <template v-else>
                {{ formatSphere(record?.objective_left_spherical, record?.objective_left_spherical_sign) }}
              </template>
            </td>
            <!-- 左眼柱镜列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('objective_left_cylindrical')">
                  <div class="cell-sphere-wrap">
                    <a-input 
                      :value="getCylindricalDisplayValue('objective_left_cylindrical')" 
                      @input="handleCylindricalChange('objective_left_cylindrical', $event)"
                      @blur="handleCylindricalBlur('objective_left_cylindrical')"
                      class="prescription-input prescription-cylindrical" 
                      placeholder="请填写负柱镜-" 
                    />
                  </div>
                </a-tooltip>
              </template>
              <template v-else>
                {{ formatCylinder(record?.objective_left_cylindrical) }}
              </template>
            </td>
            <!-- 左眼轴位列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input v-model:value="editForm.objective_left_axis" class="prescription-input prescription-axis" placeholder="轴位" />
              </template>
              <template v-else>
                {{ formatAxis(record?.objective_left_axis) }}
              </template>
            </td>
          </tr>
          <tr>
            <!-- 右眼：球镜列显示"瞳孔直径" -->
            <td>
              <template v-if="viewMode === 'edit'">
                <span style="color: #666;">瞳孔直径</span>
              </template>
              <template v-else>
                <span>瞳孔直径</span>
              </template>
            </td>
            <!-- 右眼：柱镜列显示PS（瞳孔直径） -->
            <td style="position: relative; padding: 2.5mm;">
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <template v-if="viewMode === 'edit'">
                  <a-input v-model:value="editForm.objective_right_pupil" class="prescription-input prescription-pupil" placeholder="PS" style="width: 100%" />
                </template>
                <template v-else>
                  <template v-if="hasValue(record?.objective_right_pupil)">{{ formatPS(record?.objective_right_pupil) }}mm</template>
                  <template v-else>-</template>
                </template>
              </div>
            </td>
            <!-- 右眼：SE在轴位列，与柱镜列后半部分合并显示 -->
            <td class="cell-computed" style="padding-left: 0; border-left: none;">
              <template v-if="viewMode === 'edit'">
                <span style="color: #666;">SE: {{ formatSE(viewMode === 'edit' ? editForm.objective_right_spherical : record?.objective_right_spherical, viewMode === 'edit' ? editForm.objective_right_cylindrical : record?.objective_right_cylindrical, viewMode === 'edit' ? editForm.objective_right_spherical_sign : record?.objective_right_spherical_sign) }}</span>
              </template>
              <template v-else>
                <template v-if="hasSEValue(record?.objective_right_spherical, record?.objective_right_cylindrical)">SE: </template>{{ formatSE(record?.objective_right_spherical, record?.objective_right_cylindrical, record?.objective_right_spherical_sign) }}
              </template>
            </td>
            <!-- 左眼：球镜列显示"瞳孔直径" -->
            <td>
              <template v-if="viewMode === 'edit'">
                <span style="color: #666;">瞳孔直径</span>
              </template>
              <template v-else>
                <span>瞳孔直径</span>
              </template>
            </td>
            <!-- 左眼：柱镜列显示PS（瞳孔直径） -->
            <td style="position: relative; padding: 2.5mm;">
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <template v-if="viewMode === 'edit'">
                  <a-input v-model:value="editForm.objective_left_pupil" class="prescription-input prescription-pupil" placeholder="PS" style="width: 100%" />
                </template>
                <template v-else>
                  <template v-if="hasValue(record?.objective_left_pupil)">{{ formatPS(record?.objective_left_pupil) }}mm</template>
                  <template v-else>-</template>
                </template>
              </div>
            </td>
            <!-- 左眼：SE在轴位列，与柱镜列后半部分合并显示 -->
            <td class="cell-computed" style="padding-left: 0; border-left: none;">
              <template v-if="viewMode === 'edit'">
                <span style="color: #666;">SE: {{ formatSE(viewMode === 'edit' ? editForm.objective_left_spherical : record?.objective_left_spherical, viewMode === 'edit' ? editForm.objective_left_cylindrical : record?.objective_left_cylindrical, viewMode === 'edit' ? editForm.objective_left_spherical_sign : record?.objective_left_spherical_sign) }}</span>
              </template>
              <template v-else>
                <template v-if="hasSEValue(record?.objective_left_spherical, record?.objective_left_cylindrical)">SE: </template>{{ formatSE(record?.objective_left_spherical, record?.objective_left_cylindrical, record?.objective_left_spherical_sign) }}
              </template>
            </td>
          </tr>

          <!-- （散瞳）行（共2行） -->
          <tr>
            <td class="refraction-label pupillary-objective-label" rowspan="2">（散瞳）</td>
            <!-- 右眼球镜列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input
                  :value="getSphericalDisplayValue('pupillary_objective_right_spherical')"
                  @input="handleSphericalChange('pupillary_objective_right_spherical', $event)"
                  @blur="handleSphericalBlur('pupillary_objective_right_spherical')"
                  class="prescription-input prescription-spherical"
                  placeholder="球镜"
                  style="width: 100%"
                />
              </template>
              <template v-else>{{ formatSphere(record?.pupillary_objective_right_spherical, record?.pupillary_objective_right_spherical_sign) }}</template>
            </td>
            <!-- 右眼柱镜列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('pupillary_objective_right_cylindrical')">
                  <div class="cell-sphere-wrap">
                    <a-input 
                      :value="getCylindricalDisplayValue('pupillary_objective_right_cylindrical')" 
                      @input="handleCylindricalChange('pupillary_objective_right_cylindrical', $event)"
                      @blur="handleCylindricalBlur('pupillary_objective_right_cylindrical')"
                      class="prescription-input prescription-cylindrical" 
                      placeholder="请填写负柱镜-" 
                    />
                  </div>
                </a-tooltip>
              </template>
              <template v-else>
                {{ formatCylinder(record?.pupillary_objective_right_cylindrical) }}
              </template>
            </td>
            <!-- 右眼轴位列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input v-model:value="editForm.pupillary_objective_right_axis" class="prescription-input prescription-axis" placeholder="轴位" />
              </template>
              <template v-else>
                {{ formatAxis(record?.pupillary_objective_right_axis) }}
              </template>
            </td>
            <!-- 左眼球镜列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input
                  :value="getSphericalDisplayValue('pupillary_objective_left_spherical')"
                  @input="handleSphericalChange('pupillary_objective_left_spherical', $event)"
                  @blur="handleSphericalBlur('pupillary_objective_left_spherical')"
                  class="prescription-input prescription-spherical"
                  placeholder="球镜"
                  style="width: 100%"
                />
              </template>
              <template v-else>{{ formatSphere(record?.pupillary_objective_left_spherical, record?.pupillary_objective_left_spherical_sign) }}</template>
            </td>
            <!-- 左眼柱镜列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('pupillary_objective_left_cylindrical')">
                  <div class="cell-sphere-wrap">
                    <a-input 
                      :value="getCylindricalDisplayValue('pupillary_objective_left_cylindrical')" 
                      @input="handleCylindricalChange('pupillary_objective_left_cylindrical', $event)"
                      @blur="handleCylindricalBlur('pupillary_objective_left_cylindrical')"
                      class="prescription-input prescription-cylindrical" 
                      placeholder="请填写负柱镜-" 
                    />
                  </div>
                </a-tooltip>
              </template>
              <template v-else>
                {{ formatCylinder(record?.pupillary_objective_left_cylindrical) }}
              </template>
            </td>
            <!-- 左眼轴位列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input v-model:value="editForm.pupillary_objective_left_axis" class="prescription-input prescription-axis" placeholder="轴位" />
              </template>
              <template v-else>
                {{ formatAxis(record?.pupillary_objective_left_axis) }}
              </template>
            </td>
          </tr>
          <tr>
            <!-- 右眼：球镜列显示"瞳孔直径" -->
            <td>
              <template v-if="viewMode === 'edit'">
                <span style="color: #666;">瞳孔直径</span>
              </template>
              <template v-else>
                <span>瞳孔直径</span>
              </template>
            </td>
            <!-- 右眼：柱镜列显示PS（瞳孔直径） -->
            <td style="position: relative; padding: 2.5mm;">
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <template v-if="viewMode === 'edit'">
                  <a-input v-model:value="editForm.pupillary_objective_right_pupil" class="prescription-input prescription-pupil" placeholder="PS" style="width: 100%" />
                </template>
                <template v-else>
                  <template v-if="hasValue(record?.pupillary_objective_right_pupil)">{{ formatPS(record?.pupillary_objective_right_pupil) }}mm</template>
                  <template v-else>-</template>
                </template>
              </div>
            </td>
            <!-- 右眼：SE在轴位列，与柱镜列后半部分合并显示 -->
            <td class="cell-computed" style="padding-left: 0; border-left: none;">
              <template v-if="viewMode === 'edit'">
                <span style="color: #666;">SE: {{ formatSE(viewMode === 'edit' ? editForm.pupillary_objective_right_spherical : record?.pupillary_objective_right_spherical, viewMode === 'edit' ? editForm.pupillary_objective_right_cylindrical : record?.pupillary_objective_right_cylindrical, viewMode === 'edit' ? editForm.pupillary_objective_right_spherical_sign : record?.pupillary_objective_right_spherical_sign) }}</span>
              </template>
              <template v-else>
                <template v-if="hasSEValue(record?.pupillary_objective_right_spherical, record?.pupillary_objective_right_cylindrical)">SE: </template>{{ formatSE(record?.pupillary_objective_right_spherical, record?.pupillary_objective_right_cylindrical, record?.pupillary_objective_right_spherical_sign) }}
              </template>
            </td>
            <!-- 左眼：球镜列显示"瞳孔直径" -->
            <td>
              <template v-if="viewMode === 'edit'">
                <span style="color: #666;">瞳孔直径</span>
              </template>
              <template v-else>
                <span>瞳孔直径</span>
              </template>
            </td>
            <!-- 左眼：柱镜列显示PS（瞳孔直径） -->
            <td style="position: relative; padding: 2.5mm;">
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <template v-if="viewMode === 'edit'">
                  <a-input v-model:value="editForm.pupillary_objective_left_pupil" class="prescription-input prescription-pupil" placeholder="PS" style="width: 100%" />
                </template>
                <template v-else>
                  <template v-if="hasValue(record?.pupillary_objective_left_pupil)">{{ formatPS(record?.pupillary_objective_left_pupil) }}mm</template>
                  <template v-else>-</template>
                </template>
              </div>
            </td>
            <!-- 左眼：SE在轴位列，与柱镜列后半部分合并显示 -->
            <td class="cell-computed" style="padding-left: 0; border-left: none;">
              <template v-if="viewMode === 'edit'">
                <span style="color: #666;">SE: {{ formatSE(viewMode === 'edit' ? editForm.pupillary_objective_left_spherical : record?.pupillary_objective_left_spherical, viewMode === 'edit' ? editForm.pupillary_objective_left_cylindrical : record?.pupillary_objective_left_cylindrical, viewMode === 'edit' ? editForm.pupillary_objective_left_spherical_sign : record?.pupillary_objective_left_spherical_sign) }}</span>
              </template>
              <template v-else>
                <template v-if="hasSEValue(record?.pupillary_objective_left_spherical, record?.pupillary_objective_left_cylindrical)">SE: </template>{{ formatSE(record?.pupillary_objective_left_spherical, record?.pupillary_objective_left_cylindrical, record?.pupillary_objective_left_spherical_sign) }}
              </template>
            </td>
          </tr>

          <!-- 检影验光行 -->
          <tr>
            <td class="refraction-label">检影验光</td>
            <!-- 右眼球镜列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input
                  :value="getSphericalDisplayValue('retinoscopy_right_eye_spherical')"
                  @input="handleSphericalChange('retinoscopy_right_eye_spherical', $event)"
                  @blur="handleSphericalBlur('retinoscopy_right_eye_spherical')"
                  class="prescription-input prescription-spherical"
                  placeholder="球镜"
                  style="width: 100%"
                />
              </template>
              <template v-else>{{ formatSphere(record?.retinoscopy_right_eye_spherical, record?.retinoscopy_right_eye_spherical_sign) }}</template>
            </td>
            <!-- 右眼柱镜列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('retinoscopy_right_eye_cylindrical')">
                  <div class="cell-sphere-wrap">
                    <a-input 
                      :value="getCylindricalDisplayValue('retinoscopy_right_eye_cylindrical')" 
                      @input="handleCylindricalChange('retinoscopy_right_eye_cylindrical', $event)"
                      @blur="handleCylindricalBlur('retinoscopy_right_eye_cylindrical')"
                      class="prescription-input prescription-cylindrical" 
                      placeholder="请填写负柱镜-" 
                    />
                  </div>
                </a-tooltip>
              </template>
              <template v-else>
                {{ formatCylinder(record?.retinoscopy_right_eye_cylindrical) }}
              </template>
            </td>
            <!-- 右眼轴位列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input v-model:value="editForm.retinoscopy_right_eye_axis" class="prescription-input prescription-axis" placeholder="轴位" />
              </template>
              <template v-else>
                {{ formatAxis(record?.retinoscopy_right_eye_axis) }}
              </template>
            </td>
            <!-- 左眼球镜列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input
                  :value="getSphericalDisplayValue('retinoscopy_left_eye_spherical')"
                  @input="handleSphericalChange('retinoscopy_left_eye_spherical', $event)"
                  @blur="handleSphericalBlur('retinoscopy_left_eye_spherical')"
                  class="prescription-input prescription-spherical"
                  placeholder="球镜"
                  style="width: 100%"
                />
              </template>
              <template v-else>{{ formatSphere(record?.retinoscopy_left_eye_spherical, record?.retinoscopy_left_eye_spherical_sign) }}</template>
            </td>
            <!-- 左眼柱镜列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('retinoscopy_left_eye_cylindrical')">
                  <div class="cell-sphere-wrap">
                    <a-input 
                      :value="getCylindricalDisplayValue('retinoscopy_left_eye_cylindrical')" 
                      @input="handleCylindricalChange('retinoscopy_left_eye_cylindrical', $event)"
                      @blur="handleCylindricalBlur('retinoscopy_left_eye_cylindrical')"
                      class="prescription-input prescription-cylindrical" 
                      placeholder="请填写负柱镜-" 
                    />
                  </div>
                </a-tooltip>
              </template>
              <template v-else>
                {{ formatCylinder(record?.retinoscopy_left_eye_cylindrical) }}
              </template>
            </td>
            <!-- 左眼轴位列 -->
            <td>
              <template v-if="viewMode === 'edit'">
                <a-input v-model:value="editForm.retinoscopy_left_eye_axis" class="prescription-input prescription-axis" placeholder="轴位" />
              </template>
              <template v-else>
                {{ formatAxis(record?.retinoscopy_left_eye_axis) }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- 主觉验光检查 -->
    <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasSubjectiveRefractionData" 
         v-show="!showOnlySection || showOnlySection === 'subjective-refraction'"
         class="section-block"
         :class="{ 'collapsed': enableCollapse && !sectionExpanded?.['subjective-refraction'] }">
      <h3 
        v-if="!reportLayout && (viewMode !== 'view' || showSectionTitlesInView)"
        class="section-title"
        :class="{ 'clickable': enableCollapse }"
        @click="enableCollapse && handleToggleSection('subjective-refraction')"
      >
        主觉验光检查
        <span v-if="enableCollapse" class="section-toggle-icon">
          <UpOutlined v-if="sectionExpanded?.['subjective-refraction']" />
          <DownOutlined v-else />
        </span>
      </h3>
      <div v-show="viewMode === 'print' || showOnlySection === 'subjective-refraction' || (enableCollapse ? sectionExpanded?.['subjective-refraction'] : true)">
      <!-- 主觉验光：报告式 exam-sheet -->
      <table v-if="reportLayout" class="exam-sheet exam-table-subjective-refraction subjective-report-by-eye">
        <tbody>
          <tr>
            <th
              class="side-title report-section-side-title"
              rowspan="4"
              :class="{ clickable: enableCollapse }"
              @click="enableCollapse && handleToggleSection('subjective-refraction')"
            >
              <span class="report-section-side-title-text">主觉验光检查</span>
              <span v-if="enableCollapse" class="section-toggle-icon report-section-side-toggle">
                <UpOutlined v-if="sectionExpanded?.['subjective-refraction']" />
                <DownOutlined v-else />
              </span>
            </th>
            <th class="row-head">眼别</th>
            <th class="sub-head">球镜</th>
            <th class="sub-head">柱镜</th>
            <th class="sub-head">轴位</th>
            <th class="sub-head">矫正视力</th>
            <th class="sub-head">ADD</th>
            <th class="sub-head subjective-pupillary-col-head">（散瞳）</th>
            <th class="sub-head">球镜</th>
            <th class="sub-head">柱镜</th>
            <th class="sub-head">轴位</th>
            <th class="sub-head">矫正视力</th>
          </tr>
          <tr>
            <th class="eye-cell eye-name">右眼</th>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input :value="getSphericalDisplayValue('subjective_right_spherical')" @input="handleSphericalChange('subjective_right_spherical', $event)" @blur="handleSphericalBlur('subjective_right_spherical')" class="prescription-input prescription-spherical cell-number" placeholder="球镜" style="width: 100%" /></template>
                <template v-else>{{ formatSphere(record?.subjective_right_spherical, record?.subjective_right_spherical_sign) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('subjective_right_cylindrical')">
                    <div class="cell-sphere-wrap"><a-input :value="getCylindricalDisplayValue('subjective_right_cylindrical')" @input="handleCylindricalChange('subjective_right_cylindrical', $event)" @blur="handleCylindricalBlur('subjective_right_cylindrical')" class="prescription-input prescription-cylindrical cell-input" placeholder="请填写负柱镜-" /></div>
                  </a-tooltip>
                </template>
                <template v-else>{{ formatCylinder(record?.subjective_right_cylindrical) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.subjective_right_axis" class="prescription-input prescription-axis cell-input" placeholder="轴位" /></template>
                <template v-else>{{ formatAxis(record?.subjective_right_axis) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <template v-if="visionFocusedCell === 'subjective_right_old_vision'">
                    <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('subjective_right_old_vision')" @input="onVisionInput('subjective_right_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('subjective_right_old_vision', el)" />
                  </template>
                  <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('subjective_right_old_vision')">
                    <span>{{ getVisionDisplayParts(editForm, 'subjective_right_old_vision').valuePart }}</span>
                    <sup v-if="getVisionDisplayParts(editForm, 'subjective_right_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'subjective_right_old_vision').superscriptPart }}</sup>
                  </div>
                </template>
                <template v-else>
                  <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'subjective_right_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'subjective_right_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'subjective_right_old_vision').superscriptPart }}</sup></span>
                </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-select v-model:value="editForm.subjective_right_near_add_power" class="vision-value-select cell-select" placeholder="ADD" allowClear popup-class-name="add-power-dropdown" :dropdown-match-select-width="false" style="width: 100%;">
                    <a-select-option v-for="opt in addOptions" :key="opt" :value="parseFloat(opt)">{{ opt }}</a-select-option>
                  </a-select>
                </template>
                <template v-else>{{ formatADD(record?.subjective_right_near_add_power) }}</template>
              </div>
            </td>
            <th class="eye-cell eye-name">右眼</th>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input :value="getSphericalDisplayValue('pupillary_subjective_right_spherical')" @input="handleSphericalChange('pupillary_subjective_right_spherical', $event)" @blur="handleSphericalBlur('pupillary_subjective_right_spherical')" class="prescription-input prescription-spherical cell-number" placeholder="球镜" style="width: 100%" /></template>
                <template v-else>{{ formatSphere(record?.pupillary_subjective_right_spherical, record?.pupillary_subjective_right_spherical_sign) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('pupillary_subjective_right_cylindrical')">
                    <div class="cell-sphere-wrap"><a-input :value="getCylindricalDisplayValue('pupillary_subjective_right_cylindrical')" @input="handleCylindricalChange('pupillary_subjective_right_cylindrical', $event)" @blur="handleCylindricalBlur('pupillary_subjective_right_cylindrical')" class="prescription-input prescription-cylindrical cell-input" placeholder="请填写负柱镜-" /></div>
                  </a-tooltip>
                </template>
                <template v-else>{{ formatCylinder(record?.pupillary_subjective_right_cylindrical) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.pupillary_subjective_right_axis" class="prescription-input prescription-axis cell-input" placeholder="轴位" /></template>
                <template v-else>{{ formatAxis(record?.pupillary_subjective_right_axis) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <template v-if="visionFocusedCell === 'pupillary_bcva_right_vision'">
                    <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('pupillary_bcva_right_vision')" @input="onVisionInput('pupillary_bcva_right_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('pupillary_bcva_right_vision', el)" />
                  </template>
                  <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('pupillary_bcva_right_vision')">
                    <span>{{ getVisionDisplayParts(editForm, 'pupillary_bcva_right_vision').valuePart }}</span>
                    <sup v-if="getVisionDisplayParts(editForm, 'pupillary_bcva_right_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'pupillary_bcva_right_vision').superscriptPart }}</sup>
                  </div>
                </template>
                <template v-else>
                  <span class="vision-cell-superscript"><span>{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_right_vision', 'pupillary_subjective_right_old_vision').valuePart }}</span><sup v-if="getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_right_vision', 'pupillary_subjective_right_old_vision').superscriptPart">{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_right_vision', 'pupillary_subjective_right_old_vision').superscriptPart }}</sup></span>
                </template>
              </div>
            </td>
          </tr>
          <tr>
            <th class="eye-cell eye-name">左眼</th>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input :value="getSphericalDisplayValue('subjective_left_spherical')" @input="handleSphericalChange('subjective_left_spherical', $event)" @blur="handleSphericalBlur('subjective_left_spherical')" class="prescription-input prescription-spherical cell-number" placeholder="球镜" style="width: 100%" /></template>
                <template v-else>{{ formatSphere(record?.subjective_left_spherical, record?.subjective_left_spherical_sign) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('subjective_left_cylindrical')">
                    <div class="cell-sphere-wrap"><a-input :value="getCylindricalDisplayValue('subjective_left_cylindrical')" @input="handleCylindricalChange('subjective_left_cylindrical', $event)" @blur="handleCylindricalBlur('subjective_left_cylindrical')" class="prescription-input prescription-cylindrical cell-input" placeholder="请填写负柱镜-" /></div>
                  </a-tooltip>
                </template>
                <template v-else>{{ formatCylinder(record?.subjective_left_cylindrical) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.subjective_left_axis" class="prescription-input prescription-axis cell-input" placeholder="轴位" /></template>
                <template v-else>{{ formatAxis(record?.subjective_left_axis) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <template v-if="visionFocusedCell === 'subjective_left_old_vision'">
                    <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('subjective_left_old_vision')" @input="onVisionInput('subjective_left_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('subjective_left_old_vision', el)" />
                  </template>
                  <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('subjective_left_old_vision')">
                    <span>{{ getVisionDisplayParts(editForm, 'subjective_left_old_vision').valuePart }}</span>
                    <sup v-if="getVisionDisplayParts(editForm, 'subjective_left_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'subjective_left_old_vision').superscriptPart }}</sup>
                  </div>
                </template>
                <template v-else>
                  <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'subjective_left_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'subjective_left_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'subjective_left_old_vision').superscriptPart }}</sup></span>
                </template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-select v-model:value="editForm.subjective_left_near_add_power" class="vision-value-select cell-select" placeholder="ADD" allowClear popup-class-name="add-power-dropdown" :dropdown-match-select-width="false" style="width: 100%;">
                    <a-select-option v-for="opt in addOptions" :key="opt" :value="parseFloat(opt)">{{ opt }}</a-select-option>
                  </a-select>
                </template>
                <template v-else>{{ formatADD(record?.subjective_left_near_add_power) }}</template>
              </div>
            </td>
            <th class="eye-cell eye-name">左眼</th>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input :value="getSphericalDisplayValue('pupillary_subjective_left_spherical')" @input="handleSphericalChange('pupillary_subjective_left_spherical', $event)" @blur="handleSphericalBlur('pupillary_subjective_left_spherical')" class="prescription-input prescription-spherical cell-number" placeholder="球镜" style="width: 100%" /></template>
                <template v-else>{{ formatSphere(record?.pupillary_subjective_left_spherical, record?.pupillary_subjective_left_spherical_sign) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('pupillary_subjective_left_cylindrical')">
                    <div class="cell-sphere-wrap"><a-input :value="getCylindricalDisplayValue('pupillary_subjective_left_cylindrical')" @input="handleCylindricalChange('pupillary_subjective_left_cylindrical', $event)" @blur="handleCylindricalBlur('pupillary_subjective_left_cylindrical')" class="prescription-input prescription-cylindrical cell-input" placeholder="请填写负柱镜-" /></div>
                  </a-tooltip>
                </template>
                <template v-else>{{ formatCylinder(record?.pupillary_subjective_left_cylindrical) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'"><a-input v-model:value="editForm.pupillary_subjective_left_axis" class="prescription-input prescription-axis cell-input" placeholder="轴位" /></template>
                <template v-else>{{ formatAxis(record?.pupillary_subjective_left_axis) }}</template>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <template v-if="visionFocusedCell === 'pupillary_bcva_left_vision'">
                    <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('pupillary_bcva_left_vision')" @input="onVisionInput('pupillary_bcva_left_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('pupillary_bcva_left_vision', el)" />
                  </template>
                  <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('pupillary_bcva_left_vision')">
                    <span>{{ getVisionDisplayParts(editForm, 'pupillary_bcva_left_vision').valuePart }}</span>
                    <sup v-if="getVisionDisplayParts(editForm, 'pupillary_bcva_left_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'pupillary_bcva_left_vision').superscriptPart }}</sup>
                  </div>
                </template>
                <template v-else>
                  <span class="vision-cell-superscript"><span>{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_left_vision', 'pupillary_subjective_left_old_vision').valuePart }}</span><sup v-if="getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_left_vision', 'pupillary_subjective_left_old_vision').superscriptPart">{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_left_vision', 'pupillary_subjective_left_old_vision').superscriptPart }}</sup></span>
                </template>
              </div>
            </td>
          </tr>
          <tr>
            <th class="eye-cell eye-name">双眼</th>
            <td colspan="3">
              <div class="cell-field dominant-eye-pd-report">
                <div class="dominant-eye-pd-container">
                  <div class="dominant-eye-pd-item">
                    <span class="dominant-eye-pd-label">主导眼：</span>
                    <template v-if="viewMode === 'edit'">
                      <div class="dominant-eye-toggle-group" role="group" aria-label="主导眼">
                        <button
                          type="button"
                          class="dominant-eye-toggle-btn"
                          :class="{ 'dominant-eye-toggle-btn--active': formatDominantEye(editForm.subjective_leading_eye) === '右眼' }"
                          :aria-pressed="formatDominantEye(editForm.subjective_leading_eye) === '右眼'"
                          @click="toggleDominantEye('右眼')"
                        >右眼</button>
                        <button
                          type="button"
                          class="dominant-eye-toggle-btn"
                          :class="{ 'dominant-eye-toggle-btn--active': formatDominantEye(editForm.subjective_leading_eye) === '左眼' }"
                          :aria-pressed="formatDominantEye(editForm.subjective_leading_eye) === '左眼'"
                          @click="toggleDominantEye('左眼')"
                        >左眼</button>
                      </div>
                    </template>
                    <template v-else>
                      <span v-if="record?.subjective_leading_eye || record?.dominant_eye">{{ formatDominantEye(record.subjective_leading_eye || record.dominant_eye) }}</span>
                      <span v-else>-</span>
                    </template>
                  </div>
                  <div class="dominant-eye-pd-item">
                    <span class="dominant-eye-pd-label">瞳距：</span>
                    <template v-if="viewMode === 'edit'">
                      <a-input v-model:value="editForm.subjective_both_pupil_distance" class="pupil-distance-input cell-input" placeholder="mm" />
                    </template>
                    <template v-else>{{ formatPDNumber(record?.subjective_both_pupil_distance) }}</template>
                    <span class="pupil-distance-unit">mm</span>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <template v-if="visionFocusedCell === 'subjective_both_old_vision'">
                    <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('subjective_both_old_vision')" @input="onVisionInput('subjective_both_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('subjective_both_old_vision', el)" />
                  </template>
                  <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('subjective_both_old_vision')">
                    <span>{{ getVisionDisplayParts(editForm, 'subjective_both_old_vision').valuePart }}</span>
                    <sup v-if="getVisionDisplayParts(editForm, 'subjective_both_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'subjective_both_old_vision').superscriptPart }}</sup>
                  </div>
                </template>
                <template v-else>
                  <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'subjective_both_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'subjective_both_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'subjective_both_old_vision').superscriptPart }}</sup></span>
                </template>
              </div>
            </td>
            <td class="cell-muted">
              <div class="cell-field">—</div>
            </td>
            <th class="eye-cell eye-name">双眼</th>
            <td colspan="3" class="cell-muted">
              <div class="cell-field">—</div>
            </td>
            <td>
              <div class="cell-field">
                <template v-if="viewMode === 'edit'">
                  <template v-if="visionFocusedCell === 'pupillary_bcva_both_vision'">
                    <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('pupillary_bcva_both_vision')" @input="onVisionInput('pupillary_bcva_both_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('pupillary_bcva_both_vision', el)" />
                  </template>
                  <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('pupillary_bcva_both_vision')">
                    <span>{{ getVisionDisplayParts(editForm, 'pupillary_bcva_both_vision').valuePart }}</span>
                    <sup v-if="getVisionDisplayParts(editForm, 'pupillary_bcva_both_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'pupillary_bcva_both_vision').superscriptPart }}</sup>
                  </div>
                </template>
                <template v-else>
                  <span class="vision-cell-superscript"><span>{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_both_vision', 'pupillary_subjective_both_old_vision').valuePart }}</span><sup v-if="getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_both_vision', 'pupillary_subjective_both_old_vision').superscriptPart">{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_both_vision', 'pupillary_subjective_both_old_vision').superscriptPart }}</sup></span>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- 主觉验光：编辑/常规表 -->
      <table v-else class="refraction-table subjective-table">
     <thead>
       <tr>
         <th class="col-check-item">检查项目</th>
         <th>眼别</th>
         <th>球镜</th>
         <th>柱镜</th>
         <th>轴位</th>
         <th>远视力</th>
         <th>近视力</th>
         <th class="col-add-pd">ADD</th>
         <th class="col-pupillary-eye">（散瞳）</th>
       </tr>
     </thead>

     <tbody>
       <!-- 主觉验光 -->
       <tr>
         <td rowspan="3" class="col-check-item">主觉验光</td>
         <td class="eye-name">右眼</td>
         <td>
           <template v-if="viewMode === 'edit'">
             <a-input
               :value="getSphericalDisplayValue('subjective_right_spherical')"
               @input="handleSphericalChange('subjective_right_spherical', $event)"
               @blur="handleSphericalBlur('subjective_right_spherical')"
               class="prescription-input prescription-spherical"
               placeholder="球镜"
               style="width: 100%"
             />
           </template>
           <template v-else>
             {{ formatSphere(record?.subjective_right_spherical, record?.subjective_right_spherical_sign) }}
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('subjective_right_cylindrical')">
               <div class="cell-sphere-wrap">
                 <a-input 
                   :value="getCylindricalDisplayValue('subjective_right_cylindrical')" 
                   @input="handleCylindricalChange('subjective_right_cylindrical', $event)"
                   @blur="handleCylindricalBlur('subjective_right_cylindrical')"
                   class="prescription-input prescription-cylindrical" 
                   placeholder="请填写负柱镜-" 
                 />
               </div>
             </a-tooltip>
           </template>
           <template v-else>{{ formatCylinder(record?.subjective_right_cylindrical) }}</template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <a-input v-model:value="editForm.subjective_right_axis" class="prescription-input prescription-axis" placeholder="轴位" />
           </template>
           <template v-else>{{ formatAxis(record?.subjective_right_axis) }}</template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <template v-if="visionFocusedCell === 'subjective_right_old_vision'">
               <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('subjective_right_old_vision')" @input="onVisionInput('subjective_right_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('subjective_right_old_vision', el)" />
             </template>
             <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('subjective_right_old_vision')">
               <span>{{ getVisionDisplayParts(editForm, 'subjective_right_old_vision').valuePart }}</span>
               <sup v-if="getVisionDisplayParts(editForm, 'subjective_right_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'subjective_right_old_vision').superscriptPart }}</sup>
             </div>
           </template>
           <template v-else>
             <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'subjective_right_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'subjective_right_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'subjective_right_old_vision').superscriptPart }}</sup></span>
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <template v-if="visionFocusedCell === 'near_subjective_right_old_vision'">
               <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_subjective_right_old_vision')" @input="onVisionInput('near_subjective_right_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_subjective_right_old_vision', el)" />
             </template>
             <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_subjective_right_old_vision')">
               <span>{{ getVisionDisplayParts(editForm, 'near_subjective_right_old_vision').valuePart }}</span>
               <sup v-if="getVisionDisplayParts(editForm, 'near_subjective_right_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_subjective_right_old_vision').superscriptPart }}</sup>
             </div>
           </template>
           <template v-else>
             <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_subjective_right_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_subjective_right_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_subjective_right_old_vision').superscriptPart }}</sup></span>
           </template>
         </td>
         <td class="col-add-pd">
           <template v-if="viewMode === 'edit'">
             <a-select v-model:value="editForm.subjective_right_near_add_power" class="vision-value-select" placeholder="ADD" allowClear popup-class-name="add-power-dropdown" :dropdown-match-select-width="false" style="width: 100%;">
               <a-select-option v-for="opt in addOptions" :key="opt" :value="parseFloat(opt)">{{ opt }}</a-select-option>
             </a-select>
           </template>
           <template v-else>{{ formatADD(record?.subjective_right_near_add_power) }}</template>
         </td>
         <td class="col-pupillary-eye cell-muted">
           <div class="cell-field">—</div>
         </td>
       </tr>
       <tr>
         <td class="eye-name">左眼</td>
         <td>
           <template v-if="viewMode === 'edit'">
             <a-input
               :value="getSphericalDisplayValue('subjective_left_spherical')"
               @input="handleSphericalChange('subjective_left_spherical', $event)"
               @blur="handleSphericalBlur('subjective_left_spherical')"
               class="prescription-input prescription-spherical"
               placeholder="球镜"
               style="width: 100%"
             />
           </template>
           <template v-else>
             {{ formatSphere(record?.subjective_left_spherical, record?.subjective_left_spherical_sign) }}
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('subjective_left_cylindrical')">
               <div class="cell-sphere-wrap">
                 <a-input 
                   :value="getCylindricalDisplayValue('subjective_left_cylindrical')" 
                   @input="handleCylindricalChange('subjective_left_cylindrical', $event)"
                   @blur="handleCylindricalBlur('subjective_left_cylindrical')"
                   class="prescription-input prescription-cylindrical" 
                   placeholder="请填写负柱镜-" 
                 />
               </div>
             </a-tooltip>
           </template>
           <template v-else>{{ formatCylinder(record?.subjective_left_cylindrical) }}</template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <a-input v-model:value="editForm.subjective_left_axis" class="prescription-input prescription-axis" placeholder="轴位" />
           </template>
           <template v-else>{{ formatAxis(record?.subjective_left_axis) }}</template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <template v-if="visionFocusedCell === 'subjective_left_old_vision'">
               <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('subjective_left_old_vision')" @input="onVisionInput('subjective_left_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('subjective_left_old_vision', el)" />
             </template>
             <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('subjective_left_old_vision')">
               <span>{{ getVisionDisplayParts(editForm, 'subjective_left_old_vision').valuePart }}</span>
               <sup v-if="getVisionDisplayParts(editForm, 'subjective_left_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'subjective_left_old_vision').superscriptPart }}</sup>
             </div>
           </template>
           <template v-else>
             <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'subjective_left_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'subjective_left_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'subjective_left_old_vision').superscriptPart }}</sup></span>
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <template v-if="visionFocusedCell === 'near_subjective_left_old_vision'">
               <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_subjective_left_old_vision')" @input="onVisionInput('near_subjective_left_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_subjective_left_old_vision', el)" />
             </template>
             <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_subjective_left_old_vision')">
               <span>{{ getVisionDisplayParts(editForm, 'near_subjective_left_old_vision').valuePart }}</span>
               <sup v-if="getVisionDisplayParts(editForm, 'near_subjective_left_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_subjective_left_old_vision').superscriptPart }}</sup>
             </div>
           </template>
           <template v-else>
             <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_subjective_left_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_subjective_left_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_subjective_left_old_vision').superscriptPart }}</sup></span>
           </template>
         </td>
         <td class="col-add-pd">
           <template v-if="viewMode === 'edit'">
             <a-select v-model:value="editForm.subjective_left_near_add_power" class="vision-value-select" placeholder="ADD" allowClear popup-class-name="add-power-dropdown" :dropdown-match-select-width="false" style="width: 100%;">
               <a-select-option v-for="opt in addOptions" :key="opt" :value="parseFloat(opt)">{{ opt }}</a-select-option>
             </a-select>
           </template>
           <template v-else>{{ formatADD(record?.subjective_left_near_add_power) }}</template>
         </td>
         <td class="col-pupillary-eye cell-muted">
           <div class="cell-field">—</div>
         </td>
       </tr>
       <tr>
         <td class="eye-name">双眼</td>
         <td colspan="3" class="dominant-eye-pd-cell">
           <div class="dominant-eye-pd-container">
             <div class="dominant-eye-pd-item">
               <span class="dominant-eye-pd-label">主导眼：</span>
               <template v-if="viewMode === 'edit'">
                 <div class="dominant-eye-toggle-group" role="group" aria-label="主导眼">
                   <button
                     type="button"
                     class="dominant-eye-toggle-btn"
                     :class="{ 'dominant-eye-toggle-btn--active': formatDominantEye(editForm.subjective_leading_eye) === '右眼' }"
                     :aria-pressed="formatDominantEye(editForm.subjective_leading_eye) === '右眼'"
                     @click="toggleDominantEye('右眼')"
                   >右眼</button>
                   <button
                     type="button"
                     class="dominant-eye-toggle-btn"
                     :class="{ 'dominant-eye-toggle-btn--active': formatDominantEye(editForm.subjective_leading_eye) === '左眼' }"
                     :aria-pressed="formatDominantEye(editForm.subjective_leading_eye) === '左眼'"
                     @click="toggleDominantEye('左眼')"
                   >左眼</button>
                 </div>
               </template>
               <template v-else>
                 <span v-if="record?.subjective_leading_eye || record?.dominant_eye">{{ formatDominantEye(record.subjective_leading_eye || record.dominant_eye) }}</span>
                 <span v-else>-</span>
               </template>
             </div>
             <div class="dominant-eye-pd-item">
               <span class="dominant-eye-pd-label">瞳距：</span>
               <template v-if="viewMode === 'edit'">
                 <a-input v-model:value="editForm.subjective_both_pupil_distance" class="pupil-distance-input" placeholder="mm" />
               </template>
               <template v-else>{{ formatPDNumber(record?.subjective_both_pupil_distance) }}</template>
               <span class="pupil-distance-unit">mm</span>
             </div>
           </div>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <template v-if="visionFocusedCell === 'subjective_both_old_vision'">
               <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('subjective_both_old_vision')" @input="onVisionInput('subjective_both_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('subjective_both_old_vision', el)" />
             </template>
             <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('subjective_both_old_vision')">
               <span>{{ getVisionDisplayParts(editForm, 'subjective_both_old_vision').valuePart }}</span>
               <sup v-if="getVisionDisplayParts(editForm, 'subjective_both_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'subjective_both_old_vision').superscriptPart }}</sup>
             </div>
           </template>
           <template v-else>
             <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'subjective_both_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'subjective_both_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'subjective_both_old_vision').superscriptPart }}</sup></span>
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <template v-if="visionFocusedCell === 'near_subjective_both_old_vision'">
               <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('near_subjective_both_old_vision')" @input="onVisionInput('near_subjective_both_old_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('near_subjective_both_old_vision', el)" />
             </template>
             <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('near_subjective_both_old_vision')">
               <span>{{ getVisionDisplayParts(editForm, 'near_subjective_both_old_vision').valuePart }}</span>
               <sup v-if="getVisionDisplayParts(editForm, 'near_subjective_both_old_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'near_subjective_both_old_vision').superscriptPart }}</sup>
             </div>
           </template>
           <template v-else>
             <span class="vision-cell-superscript"><span>{{ getVisionDisplayParts(record, 'near_subjective_both_old_vision').valuePart }}</span><sup v-if="getVisionDisplayParts(record, 'near_subjective_both_old_vision').superscriptPart">{{ getVisionDisplayParts(record, 'near_subjective_both_old_vision').superscriptPart }}</sup></span>
           </template>
         </td>
         <td class="col-add-pd"></td>
         <td class="col-pupillary-eye cell-muted">
           <div class="cell-field">—</div>
         </td>
       </tr>

       <!-- （散瞳）主觉验光 -->
       <tr>
         <td rowspan="3" class="col-check-item pupillary-subjective-label">（散瞳）</td>
         <td class="eye-name">右眼</td>
         <td>
           <template v-if="viewMode === 'edit'">
             <a-input
               :value="getSphericalDisplayValue('pupillary_subjective_right_spherical')"
               @input="handleSphericalChange('pupillary_subjective_right_spherical', $event)"
               @blur="handleSphericalBlur('pupillary_subjective_right_spherical')"
               class="prescription-input prescription-spherical"
               placeholder="球镜"
               style="width: 100%"
             />
           </template>
           <template v-else>
             {{ formatSphere(record?.pupillary_subjective_right_spherical, record?.pupillary_subjective_right_spherical_sign) }}
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('pupillary_subjective_right_cylindrical')">
               <div class="cell-sphere-wrap">
                 <a-input 
                   :value="getCylindricalDisplayValue('pupillary_subjective_right_cylindrical')" 
                   @input="handleCylindricalChange('pupillary_subjective_right_cylindrical', $event)"
                   @blur="handleCylindricalBlur('pupillary_subjective_right_cylindrical')"
                   class="prescription-input prescription-cylindrical" 
                   placeholder="请填写负柱镜-" 
                 />
               </div>
             </a-tooltip>
           </template>
           <template v-else>
             {{ formatCylinder(record?.pupillary_subjective_right_cylindrical) }}
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <a-input v-model:value="editForm.pupillary_subjective_right_axis" class="prescription-input prescription-axis" placeholder="轴位" />
           </template>
           <template v-else>
             {{ formatAxis(record?.pupillary_subjective_right_axis) }}
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <template v-if="visionFocusedCell === 'pupillary_bcva_right_vision'">
               <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('pupillary_bcva_right_vision')" @input="onVisionInput('pupillary_bcva_right_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('pupillary_bcva_right_vision', el)" />
             </template>
             <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('pupillary_bcva_right_vision')">
               <span>{{ getVisionDisplayParts(editForm, 'pupillary_bcva_right_vision').valuePart }}</span>
               <sup v-if="getVisionDisplayParts(editForm, 'pupillary_bcva_right_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'pupillary_bcva_right_vision').superscriptPart }}</sup>
             </div>
           </template>
           <template v-else>
             <span class="vision-cell-superscript"><span>{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_right_vision', 'pupillary_subjective_right_old_vision').valuePart }}</span><sup v-if="getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_right_vision', 'pupillary_subjective_right_old_vision').superscriptPart">{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_right_vision', 'pupillary_subjective_right_old_vision').superscriptPart }}</sup></span>
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <template v-if="visionFocusedCell === 'pupillary_bcva_near_right_vision'">
               <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('pupillary_bcva_near_right_vision')" @input="onVisionInput('pupillary_bcva_near_right_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('pupillary_bcva_near_right_vision', el)" />
             </template>
             <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('pupillary_bcva_near_right_vision')">
               <span>{{ getVisionDisplayParts(editForm, 'pupillary_bcva_near_right_vision').valuePart }}</span>
               <sup v-if="getVisionDisplayParts(editForm, 'pupillary_bcva_near_right_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'pupillary_bcva_near_right_vision').superscriptPart }}</sup>
             </div>
           </template>
          <template v-else>
            <span class="vision-cell-superscript"><span>{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_near_right_vision', 'pupillary_subjective_near_right_old_vision').valuePart }}</span><sup v-if="getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_near_right_vision', 'pupillary_subjective_near_right_old_vision').superscriptPart">{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_near_right_vision', 'pupillary_subjective_near_right_old_vision').superscriptPart }}</sup></span>
          </template>
        </td>
        <td class="col-add-pd"></td>
        <th class="col-pupillary-eye" scope="row">右眼</th>
      </tr>
      <tr>
        <td class="eye-name">左眼</td>
         <td>
           <template v-if="viewMode === 'edit'">
             <a-input
               :value="getSphericalDisplayValue('pupillary_subjective_left_spherical')"
               @input="handleSphericalChange('pupillary_subjective_left_spherical', $event)"
               @blur="handleSphericalBlur('pupillary_subjective_left_spherical')"
               class="prescription-input prescription-spherical"
               placeholder="球镜"
               style="width: 100%"
             />
           </template>
           <template v-else>
             {{ formatSphere(record?.pupillary_subjective_left_spherical, record?.pupillary_subjective_left_spherical_sign) }}
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <a-tooltip title="请填写负柱镜-" :open="needCylindricalSignHint('pupillary_subjective_left_cylindrical')">
               <div class="cell-sphere-wrap">
                 <a-input 
                   :value="getCylindricalDisplayValue('pupillary_subjective_left_cylindrical')" 
                   @input="handleCylindricalChange('pupillary_subjective_left_cylindrical', $event)"
                   @blur="handleCylindricalBlur('pupillary_subjective_left_cylindrical')"
                   class="prescription-input prescription-cylindrical" 
                   placeholder="请填写负柱镜-" 
                 />
               </div>
             </a-tooltip>
           </template>
           <template v-else>
             {{ formatCylinder(record?.pupillary_subjective_left_cylindrical) }}
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <a-input v-model:value="editForm.pupillary_subjective_left_axis" class="prescription-input prescription-axis" placeholder="轴位" />
           </template>
           <template v-else>
             {{ formatAxis(record?.pupillary_subjective_left_axis) }}
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <template v-if="visionFocusedCell === 'pupillary_bcva_left_vision'">
               <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('pupillary_bcva_left_vision')" @input="onVisionInput('pupillary_bcva_left_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('pupillary_bcva_left_vision', el)" />
             </template>
             <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('pupillary_bcva_left_vision')">
               <span>{{ getVisionDisplayParts(editForm, 'pupillary_bcva_left_vision').valuePart }}</span>
               <sup v-if="getVisionDisplayParts(editForm, 'pupillary_bcva_left_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'pupillary_bcva_left_vision').superscriptPart }}</sup>
             </div>
           </template>
           <template v-else>
             <span class="vision-cell-superscript"><span>{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_left_vision', 'pupillary_subjective_left_old_vision').valuePart }}</span><sup v-if="getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_left_vision', 'pupillary_subjective_left_old_vision').superscriptPart">{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_left_vision', 'pupillary_subjective_left_old_vision').superscriptPart }}</sup></span>
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <template v-if="visionFocusedCell === 'pupillary_bcva_near_left_vision'">
               <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('pupillary_bcva_near_left_vision')" @input="onVisionInput('pupillary_bcva_near_left_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('pupillary_bcva_near_left_vision', el)" />
             </template>
             <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('pupillary_bcva_near_left_vision')">
               <span>{{ getVisionDisplayParts(editForm, 'pupillary_bcva_near_left_vision').valuePart }}</span>
               <sup v-if="getVisionDisplayParts(editForm, 'pupillary_bcva_near_left_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'pupillary_bcva_near_left_vision').superscriptPart }}</sup>
             </div>
           </template>
          <template v-else>
            <span class="vision-cell-superscript"><span>{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_near_left_vision', 'pupillary_subjective_near_left_old_vision').valuePart }}</span><sup v-if="getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_near_left_vision', 'pupillary_subjective_near_left_old_vision').superscriptPart">{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_near_left_vision', 'pupillary_subjective_near_left_old_vision').superscriptPart }}</sup></span>
          </template>
        </td>
        <td class="col-add-pd"></td>
        <th class="col-pupillary-eye" scope="row">左眼</th>
      </tr>
      <tr>
        <td class="eye-name">双眼</td>
         <td colspan="3"></td>
         <td>
           <template v-if="viewMode === 'edit'">
             <template v-if="visionFocusedCell === 'pupillary_bcva_both_vision'">
               <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('pupillary_bcva_both_vision')" @input="onVisionInput('pupillary_bcva_both_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('pupillary_bcva_both_vision', el)" />
             </template>
             <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('pupillary_bcva_both_vision')">
               <span>{{ getVisionDisplayParts(editForm, 'pupillary_bcva_both_vision').valuePart }}</span>
               <sup v-if="getVisionDisplayParts(editForm, 'pupillary_bcva_both_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'pupillary_bcva_both_vision').superscriptPart }}</sup>
             </div>
           </template>
           <template v-else>
             <span class="vision-cell-superscript"><span>{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_both_vision', 'pupillary_subjective_both_old_vision').valuePart }}</span><sup v-if="getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_both_vision', 'pupillary_subjective_both_old_vision').superscriptPart">{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_both_vision', 'pupillary_subjective_both_old_vision').superscriptPart }}</sup></span>
           </template>
         </td>
         <td>
           <template v-if="viewMode === 'edit'">
             <template v-if="visionFocusedCell === 'pupillary_bcva_near_both_vision'">
               <input type="text" inputmode="text" class="vision-combined-input" autocomplete="off" :value="getVisionInputDisplay('pupillary_bcva_near_both_vision')" @input="onVisionInput('pupillary_bcva_near_both_vision', $event.target.value)" @blur="visionFocusedCell = null" :ref="el => setVisionInputRef('pupillary_bcva_near_both_vision', el)" />
             </template>
             <div v-else class="vision-cell-superscript vision-edit-display" @click="focusVisionCell('pupillary_bcva_near_both_vision')">
               <span>{{ getVisionDisplayParts(editForm, 'pupillary_bcva_near_both_vision').valuePart }}</span>
               <sup v-if="getVisionDisplayParts(editForm, 'pupillary_bcva_near_both_vision').superscriptPart">{{ getVisionDisplayParts(editForm, 'pupillary_bcva_near_both_vision').superscriptPart }}</sup>
             </div>
           </template>
          <template v-else>
            <span class="vision-cell-superscript"><span>{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_near_both_vision', 'pupillary_subjective_near_both_old_vision').valuePart }}</span><sup v-if="getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_near_both_vision', 'pupillary_subjective_near_both_old_vision').superscriptPart">{{ getVisionDisplayPartsWithFallback(record, 'pupillary_bcva_near_both_vision', 'pupillary_subjective_near_both_old_vision').superscriptPart }}</sup></span>
          </template>
        </td>
        <td class="col-add-pd"></td>
        <th class="col-pupillary-eye" scope="row">双眼</th>
      </tr>
     </tbody>
  </table>
      </div>
</div>

  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { UpOutlined, DownOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const props = defineProps({
  record: {
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
  previousRecord: {
    type: Object,
    default: () => null
  },
  examinationRecords: {
    type: Array,
    default: () => []
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
    default: null // 如果设置，只显示指定的 section（如 'routine', 'vision', 'objective-refraction', 'subjective-refraction'）
  },
  showSectionTitlesInView: {
    type: Boolean,
    default: false
  },
  reportLayout: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle-section', 'update-record']);

// 编辑表单数据
const editForm = ref({});
let isUpdatingFromRecord = false; // 标志：是否正在从record同步到editForm

// 视力选项（倒序排列：从2.0到0.05）- 提前定义，供formatVisionForEdit使用
const visionOptions = ['2.0', '1.5', '1.2', '1.0', '0.8', '0.6', '0.5', '0.4', '0.3', '0.2', '0.1', '0.05'];

// 格式化视力值用于编辑模式填充（将后端存储的2位小数转换为符合formatVision逻辑的值）
// 例如：1.00 -> 1.0（转换为数字1，匹配Number('1.0') = 1），0.05 -> 0.05
const formatVisionForEdit = (value) => {
  if (value === null || value === undefined || value === '') return value;
  const num = Number(value);
  if (isNaN(num)) return value;
  
  // 将visionOptions转换为数字数组，用于匹配
  const visionOptionsNums = visionOptions.map(opt => Number(opt));
  
  // 检查是否为真2位小数（小数点后第二位不为0）
  // 例如：0.05 -> 小数部分 0.05，转换为字符串 '0.05'，第二位是 '5'（不为0）
  // 例如：1.00 -> 小数部分 0.00，转换为字符串 '0'，或者可能是 '0.00'
  const decimalPart = Math.abs(num % 1);
  
  // 检查是否有两位小数且第二位不为0
  // 先将数字格式化为2位小数，然后检查第二位
  const twoDecimalStr = num.toFixed(2);
  const parts = twoDecimalStr.split('.');
  if (parts.length === 2 && parts[1].length === 2) {
    const secondDecimal = parseInt(parts[1][1], 10);
    // 如果第二位不为0，说明是真2位小数，需要匹配0.05这样的选项
    if (secondDecimal !== 0) {
      // 查找最接近的值（应该精确匹配0.05）
      const matchedValue = visionOptionsNums.find(opt => Math.abs(opt - num) < 0.001);
      return matchedValue !== undefined ? matchedValue : num;
    }
  }
  
  // 否则，是1位小数或整数，转换为1位小数对应的数字
  // 例如：1.00 -> 1.0 -> Number('1.0') = 1
  const oneDecimalStr = num.toFixed(1);
  const oneDecimalNum = Number(oneDecimalStr);
  // 查找最接近的值
  const matchedValue = visionOptionsNums.find(opt => Math.abs(opt - oneDecimalNum) < 0.001);
  return matchedValue !== undefined ? matchedValue : oneDecimalNum;
};

// 确保vision_level字段为空时设置为undefined（用于显示空值）
// 同时格式化视力值字段
const normalizeVisionLevels = (data) => {
  if (!data) return data;
  const levelFields = [
    'uva_right_vision_level', 'uva_left_vision_level', 'uva_both_vision_level',
    'near_uva_right_vision_level', 'near_uva_left_vision_level', 'near_uva_both_vision_level',
    'vaec_right_old_vision_level', 'vaec_left_old_vision_level', 'vaec_both_old_vision_level',
    'near_subjective_right_old_vision_level', 'near_subjective_left_old_vision_level', 'near_subjective_both_old_vision_level',
    // BCVA远视力级别字段
    'pupillary_bcva_right_vision_level', 'pupillary_bcva_left_vision_level', 'pupillary_bcva_both_vision_level',
    // BCVA近视力级别字段
    'pupillary_bcva_near_right_vision_level', 'pupillary_bcva_near_left_vision_level', 'pupillary_bcva_near_both_vision_level',
    // 兼容旧字段
    'pupillary_subjective_right_old_vision_level', 'pupillary_subjective_left_old_vision_level', 'pupillary_subjective_both_old_vision_level',
    'pupillary_subjective_near_right_old_vision_level', 'pupillary_subjective_near_left_old_vision_level', 'pupillary_subjective_near_both_old_vision_level'
  ];
  levelFields.forEach(field => {
    if (data[field] === null || data[field] === '' || data[field] === undefined) {
      data[field] = undefined;
    }
  });
  
  // 格式化视力值字段（用于编辑模式填充）
  const visionFields = [
    'uva_right_vision', 'uva_left_vision', 'uva_both_vision',
    'near_uva_right_vision', 'near_uva_left_vision', 'near_uva_both_vision',
    'vaec_right_old_vision', 'vaec_left_old_vision', 'vaec_both_old_vision',
    // 主觉验光检查 - 远视力
    'subjective_right_old_vision', 'subjective_left_old_vision', 'subjective_both_old_vision',
    // 主觉验光检查 - 近视力
    'near_subjective_right_old_vision', 'near_subjective_left_old_vision', 'near_subjective_both_old_vision',
    // 散瞳主觉验光检查 - 远视力（BCVA字段，兼容旧字段）
    'pupillary_bcva_right_vision', 'pupillary_bcva_left_vision', 'pupillary_bcva_both_vision',
    'pupillary_subjective_right_old_vision', 'pupillary_subjective_left_old_vision', 'pupillary_subjective_both_old_vision',
    // 散瞳主觉验光检查 - 近视力（BCVA字段，兼容旧字段）
    'pupillary_bcva_near_right_vision', 'pupillary_bcva_near_left_vision', 'pupillary_bcva_near_both_vision',
    'pupillary_subjective_near_right_old_vision', 'pupillary_subjective_near_left_old_vision', 'pupillary_subjective_near_both_old_vision'
  ];
  visionFields.forEach(field => {
    if (data[field] !== null && data[field] !== undefined && data[field] !== '') {
      data[field] = formatVisionForEdit(data[field]);
    }
  });
  
  return data;
};

// 监听record变化，同步到editForm
watch(() => props.record, (newVal) => {
  if (newVal && props.viewMode === 'edit') {
    isUpdatingFromRecord = true; // 设置标志，防止触发update-record
    const normalizedData = normalizeVisionLevels(JSON.parse(JSON.stringify(newVal)));
    
    // 处理BCVA字段的兼容性：如果新字段为空但旧字段有值，则复制到新字段
    const bcvaFieldMap = {
      // 远视力字段
      'pupillary_bcva_right_vision': 'pupillary_subjective_right_old_vision',
      'pupillary_bcva_left_vision': 'pupillary_subjective_left_old_vision',
      'pupillary_bcva_both_vision': 'pupillary_subjective_both_old_vision',
      'pupillary_bcva_right_vision_sign': 'pupillary_subjective_right_old_vision_sign',
      'pupillary_bcva_left_vision_sign': 'pupillary_subjective_left_old_vision_sign',
      'pupillary_bcva_both_vision_sign': 'pupillary_subjective_both_old_vision_sign',
      'pupillary_bcva_right_vision_level': 'pupillary_subjective_right_old_vision_level',
      'pupillary_bcva_left_vision_level': 'pupillary_subjective_left_old_vision_level',
      'pupillary_bcva_both_vision_level': 'pupillary_subjective_both_old_vision_level',
      // 近视力字段
      'pupillary_bcva_near_right_vision': 'pupillary_subjective_near_right_old_vision',
      'pupillary_bcva_near_left_vision': 'pupillary_subjective_near_left_old_vision',
      'pupillary_bcva_near_both_vision': 'pupillary_subjective_near_both_old_vision',
      'pupillary_bcva_near_right_vision_sign': 'pupillary_subjective_near_right_old_vision_sign',
      'pupillary_bcva_near_left_vision_sign': 'pupillary_subjective_near_left_old_vision_sign',
      'pupillary_bcva_near_both_vision_sign': 'pupillary_subjective_near_both_old_vision_sign',
      'pupillary_bcva_near_right_vision_level': 'pupillary_subjective_near_right_old_vision_level',
      'pupillary_bcva_near_left_vision_level': 'pupillary_subjective_near_left_old_vision_level',
      'pupillary_bcva_near_both_vision_level': 'pupillary_subjective_near_both_old_vision_level'
    };
    
    Object.keys(bcvaFieldMap).forEach(newField => {
      const oldField = bcvaFieldMap[newField];
      if ((normalizedData[newField] === null || normalizedData[newField] === undefined || normalizedData[newField] === '') &&
          normalizedData[oldField] !== null && normalizedData[oldField] !== undefined && normalizedData[oldField] !== '') {
        normalizedData[newField] = normalizedData[oldField];
      }
    });
    
    // 处理主导眼字段的兼容性
    if ((normalizedData.subjective_leading_eye === null || normalizedData.subjective_leading_eye === undefined || normalizedData.subjective_leading_eye === '') &&
        normalizedData.dominant_eye !== null && normalizedData.dominant_eye !== undefined && normalizedData.dominant_eye !== '') {
      normalizedData.subjective_leading_eye = normalizedData.dominant_eye;
    }
    
    editForm.value = normalizedData;
    console.log('[RoutineExamStyleTwo] record变化，已同步到editForm:', editForm.value);
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
    const normalizedData = normalizeVisionLevels(JSON.parse(JSON.stringify(props.record)));
    
    // 处理BCVA字段的兼容性：如果新字段为空但旧字段有值，则复制到新字段
    const bcvaFieldMap = {
      // 远视力字段
      'pupillary_bcva_right_vision': 'pupillary_subjective_right_old_vision',
      'pupillary_bcva_left_vision': 'pupillary_subjective_left_old_vision',
      'pupillary_bcva_both_vision': 'pupillary_subjective_both_old_vision',
      'pupillary_bcva_right_vision_sign': 'pupillary_subjective_right_old_vision_sign',
      'pupillary_bcva_left_vision_sign': 'pupillary_subjective_left_old_vision_sign',
      'pupillary_bcva_both_vision_sign': 'pupillary_subjective_both_old_vision_sign',
      'pupillary_bcva_right_vision_level': 'pupillary_subjective_right_old_vision_level',
      'pupillary_bcva_left_vision_level': 'pupillary_subjective_left_old_vision_level',
      'pupillary_bcva_both_vision_level': 'pupillary_subjective_both_old_vision_level',
      // 近视力字段
      'pupillary_bcva_near_right_vision': 'pupillary_subjective_near_right_old_vision',
      'pupillary_bcva_near_left_vision': 'pupillary_subjective_near_left_old_vision',
      'pupillary_bcva_near_both_vision': 'pupillary_subjective_near_both_old_vision',
      'pupillary_bcva_near_right_vision_sign': 'pupillary_subjective_near_right_old_vision_sign',
      'pupillary_bcva_near_left_vision_sign': 'pupillary_subjective_near_left_old_vision_sign',
      'pupillary_bcva_near_both_vision_sign': 'pupillary_subjective_near_both_old_vision_sign',
      'pupillary_bcva_near_right_vision_level': 'pupillary_subjective_near_right_old_vision_level',
      'pupillary_bcva_near_left_vision_level': 'pupillary_subjective_near_left_old_vision_level',
      'pupillary_bcva_near_both_vision_level': 'pupillary_subjective_near_both_old_vision_level'
    };
    
    Object.keys(bcvaFieldMap).forEach(newField => {
      const oldField = bcvaFieldMap[newField];
      if ((normalizedData[newField] === null || normalizedData[newField] === undefined || normalizedData[newField] === '') &&
          normalizedData[oldField] !== null && normalizedData[oldField] !== undefined && normalizedData[oldField] !== '') {
        normalizedData[newField] = normalizedData[oldField];
      }
    });
    
    // 处理主导眼字段的兼容性
    if ((normalizedData.subjective_leading_eye === null || normalizedData.subjective_leading_eye === undefined || normalizedData.subjective_leading_eye === '') &&
        normalizedData.dominant_eye !== null && normalizedData.dominant_eye !== undefined && normalizedData.dominant_eye !== '') {
      normalizedData.subjective_leading_eye = normalizedData.dominant_eye;
    }
    
    editForm.value = normalizedData;
    console.log('[RoutineExamStyleTwo] 进入编辑模式，已同步数据到editForm:', editForm.value);
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

// 判断基础检查是否有“有效数据”（用于是否显示整块：0、"0" 与空视为无数据，避免无任何填写时仍显示基础检查）
const hasMeaningfulRoutineValue = (value) => {
  if (value === null || value === undefined) return false;
  if (value === '') return false;
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length > 0 && t !== '0';
  }
  if (typeof value === 'number') return value !== 0 && !Number.isNaN(value);
  return false; // 仅数字和字符串视为有效，其余不算有值
};

// 判断各板块是否有数据（仅身高、体重、眼压；CCT 属于生物测量，不参与，避免仅有 CCT 时仍显示基础检查块）
const hasRoutineData = computed(() => {
  const record = props.record;
  if (!record) return false;
  return (
    hasMeaningfulRoutineValue(record.height) || hasMeaningfulRoutineValue(record.weight) ||
    hasMeaningfulRoutineValue(record.right_intraocular_pressure) || hasMeaningfulRoutineValue(record.left_intraocular_pressure)
  );
});

const hasVisionData = computed(() => {
  const record = props.record;
  if (!record) return false;
  return (
    hasFieldValue(record.right_eye_vision) || hasFieldValue(record.left_eye_vision) ||
    hasFieldValue(record.right_eye_old_vision) || hasFieldValue(record.left_eye_old_vision) ||
    hasFieldValue(record.uva_right_vision) || hasFieldValue(record.uva_left_vision) ||
    hasFieldValue(record.uva_both_vision) ||
    hasFieldValue(record.vaec_right_old_vision) || hasFieldValue(record.vaec_left_old_vision) ||
    hasFieldValue(record.vaec_both_old_vision) ||
    hasFieldValue(record.near_uva_right_vision) || hasFieldValue(record.near_uva_left_vision) ||
    hasFieldValue(record.near_uva_both_vision) ||
    hasFieldValue(record.near_subjective_right_old_vision) || hasFieldValue(record.near_subjective_left_old_vision) ||
    hasFieldValue(record.near_subjective_both_old_vision) ||
    hasFieldValue(record.vaec_right_spherical) || hasFieldValue(record.vaec_left_spherical) ||
    hasFieldValue(record.vaec_right_cylindrical) || hasFieldValue(record.vaec_left_cylindrical) ||
    hasFieldValue(record.vaec_right_axis) || hasFieldValue(record.vaec_left_axis) ||
    hasFieldValue(record.vaec_both_pupil_distance) ||
    hasFieldValue(record.vaec_right_glasses_type) || hasFieldValue(record.vaec_left_glasses_type)
  );
});

const hasRetinoscopyData = computed(() => {
  const record = props.record;
  if (!record) return false;
  return (
    hasFieldValue(record.retinoscopy_right_eye_spherical) || hasFieldValue(record.retinoscopy_left_eye_spherical) ||
    hasFieldValue(record.retinoscopy_right_eye_cylindrical) || hasFieldValue(record.retinoscopy_left_eye_cylindrical) ||
    hasFieldValue(record.retinoscopy_right_eye_axis) || hasFieldValue(record.retinoscopy_left_eye_axis)
  );
});

/** （小瞳）+（散瞳）电脑验光检查（不含检影；报告式下检影与基础检查同一行） */
const hasObjectiveComputerBlockData = computed(() => {
  const record = props.record;
  if (!record) return false;
  return (
    hasFieldValue(record.objective_right_spherical) || hasFieldValue(record.objective_left_spherical) ||
    hasFieldValue(record.objective_right_cylindrical) || hasFieldValue(record.objective_left_cylindrical) ||
    hasFieldValue(record.objective_right_axis) || hasFieldValue(record.objective_left_axis) ||
    hasFieldValue(record.pupillary_objective_right_spherical) || hasFieldValue(record.pupillary_objective_left_spherical) ||
    hasFieldValue(record.pupillary_objective_right_cylindrical) || hasFieldValue(record.pupillary_objective_left_cylindrical) ||
    hasFieldValue(record.pupillary_objective_right_axis) || hasFieldValue(record.pupillary_objective_left_axis) ||
    hasFieldValue(record.pupillary_objective_right_pupil) || hasFieldValue(record.pupillary_objective_left_pupil)
  );
});

const hasSubjectiveRefractionData = computed(() => {
  const record = props.record;
  if (!record) return false;
  return (
    hasFieldValue(record.subjective_right_spherical) || hasFieldValue(record.subjective_left_spherical) ||
    hasFieldValue(record.subjective_right_cylindrical) || hasFieldValue(record.subjective_left_cylindrical) ||
    hasFieldValue(record.subjective_right_axis) || hasFieldValue(record.subjective_left_axis) ||
    hasFieldValue(record.subjective_right_old_vision) || hasFieldValue(record.subjective_left_old_vision) ||
    hasFieldValue(record.subjective_both_old_vision) ||
    hasFieldValue(record.subjective_right_near_vision) || hasFieldValue(record.subjective_left_near_vision) ||
    hasFieldValue(record.subjective_both_near_vision) ||
    hasFieldValue(record.subjective_right_near_add_power) || hasFieldValue(record.subjective_left_near_add_power) ||
    hasFieldValue(record.subjective_both_pupil_distance) ||
    hasFieldValue(record.pupillary_subjective_right_spherical) || hasFieldValue(record.pupillary_subjective_left_spherical) ||
    hasFieldValue(record.pupillary_subjective_right_cylindrical) || hasFieldValue(record.pupillary_subjective_left_cylindrical) ||
    hasFieldValue(record.pupillary_subjective_right_axis) || hasFieldValue(record.pupillary_subjective_left_axis) ||
    hasFieldValue(record.subjective_leading_eye) || hasFieldValue(record.dominant_eye)
  );
});

// 判断是否有旧镜数据
const hasOldGlasses = computed(() => {
  return props.record?.vaec_right_spherical || props.record?.vaec_left_spherical ||
         props.record?.vaec_right_cylindrical || props.record?.vaec_left_cylindrical ||
         props.record?.vaec_right_axis || props.record?.vaec_left_axis ||
         props.record?.vaec_both_pupil_distance;
});

// 判断是否有旧镜类型数据
const hasOldGlassesType = computed(() => {
  return props.record?.vaec_right_glasses_type || props.record?.vaec_left_glasses_type;
});

// 格式化旧镜类型（支持左右眼）
const formatOldGlassesType = (rightValue, leftValue) => {
  // 处理空值、undefined、null、空字符串等情况
  const right = (rightValue && rightValue !== '' && rightValue !== 'none' && rightValue !== '否') ? String(rightValue) : null;
  const left = (leftValue && leftValue !== '' && leftValue !== 'none' && leftValue !== '否') ? String(leftValue) : null;
  
  if (!right && !left) return '-';
  if (right && left) {
    if (right === left) return right;
    return `${right}/${left}`;
  }
  return right || left || '-';
};

// 格式化身高
const formatHeight = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return `${num}`;
};

// 格式化体重
const formatWeight = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return num.toFixed(1);
};

// 计算BMI
const calculateBMI = (height, weight) => {
  if (!height || !weight) {
    if (props.record?.bmi) {
      const bmi = Number(props.record.bmi);
      if (!isNaN(bmi)) return bmi.toFixed(1);
    }
    return '-';
  }
  const h = Number(height);
  const w = Number(weight);
  if (isNaN(h) || isNaN(w) || h === 0) return '-';
  const bmi = w / Math.pow(h / 100, 2);
  return bmi.toFixed(1);
};

// 格式化眼压
const formatIOP = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return num.toFixed(1);
};

// 计算修正眼压（Ehlers公式）
// 修正眼压 = 测量眼压 - (CCT - 520) / 70
// 其中：CCT是角膜厚度（μm），520是标准角膜厚度（μm），70是修正系数
const calculateCorrectedIOP = (iop, cct) => {
  if (!iop || !cct) return null;
  const iopNum = Number(iop);
  const cctNum = Number(cct);
  if (isNaN(iopNum) || isNaN(cctNum)) return null;
  
  // Ehlers公式：修正眼压 = 测量眼压 - (CCT - 520) / 70
  const correctedIOP = iopNum - (cctNum - 520) / 40;
  return correctedIOP;
};

// 格式化视力（基础函数，只返回数值）
// 显示一位小数（除非是真2位小数，即小数点后第二位不为0）
const formatVision = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  
  // 先格式化为2位小数，然后检查第二位是否为0
  const twoDecimalStr = num.toFixed(2);
  // 如果第二位小数是0，显示1位小数；否则显示2位小数
  // 例如：1 -> "1.00" -> 第二位是'0' -> 返回"1.0"
  // 例如：1.20 -> "1.20" -> 第二位是'0' -> 返回"1.2"
  // 例如：0.05 -> "0.05" -> 第二位是'5' -> 返回"0.05"
  // 兼容整数和一位小数：如果最后一位是'0'，返回1位小数格式
  if (twoDecimalStr.length >= 4 && twoDecimalStr[twoDecimalStr.length - 1] === '0') {
    return num.toFixed(1);
  }
  return twoDecimalStr;
};

// 格式化视力（带符号和级别），返回格式如：0.8<sup>-4</sup> 或 1.0<sup>+1</sup>
// 规则：填写个数必须写正负符号，填写正负符号不一定要写个数
const formatVisionWithSign = (record, fieldPrefix) => {
  const vision = record?.[fieldPrefix] ?? null;
  const sign = record?.[`${fieldPrefix}_sign`] ?? null;
  const level = record?.[`${fieldPrefix}_level`] ?? null;
  
  if (vision === null || vision === undefined || vision === '') return '-';
  
  let result = formatVision(vision);
  
  // 如果有级别，必须要有符号才能显示（规则：填写个数必须写正负符号）
  if (level !== null && level !== undefined && level !== '') {
    if (sign) {
      // 有级别和符号，组合显示为上标：0.8<sup>- 4</sup>（符号和级别之间有间距，符号字体稍大）
      result += ` <sup><span class="vision-sign">${sign}</span> ${level}</sup>`;
    }
    // 如果没有符号但有级别，不显示级别（因为规则要求填写个数必须写正负符号）
  } else if (sign) {
    // 只有符号，也显示为上标（规则：填写正负符号不一定要写个数）
    result += ` <sup><span class="vision-sign">${sign}</span></sup>`;
  }
  
  return result;
};

// ---------- 视力单输入（与手机端一致：1.0+2 解析，展示为上标） ----------
const parseVisionCombinedInput = (str) => {
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
};
const getVisionCombinedDisplayString = (eyeData) => {
  if (!eyeData) return '';
  const value = (eyeData.value != null && eyeData.value !== '') ? String(eyeData.value).trim() : '';
  if (!value) return '';
  const sign = eyeData.sign === '-' ? '-' : '+';
  const number = (eyeData.number != null && eyeData.number !== '') ? String(eyeData.number).trim() : '';
  if (number !== '') return value + sign + number;
  if (sign === '-') return value + sign;
  return value;
};
const formatVisionValueForSup = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return '';
  const twoDecimalStr = num.toFixed(2);
  if (twoDecimalStr.length >= 4 && twoDecimalStr[twoDecimalStr.length - 1] === '0') return num.toFixed(1);
  return twoDecimalStr;
};
const formatVisionCellSuperscript = (eyeData) => {
  if (!eyeData || eyeData.value == null || eyeData.value === '') {
    return { valuePart: '', superscriptPart: '' };
  }
  const valuePart = formatVisionValueForSup(eyeData.value);
  const sign = eyeData.sign || '+';
  const number = eyeData.number;
  let superscriptPart = '';
  if (number !== null && number !== undefined && number !== '') {
    superscriptPart = sign + number;
  } else if (sign === '-') {
    superscriptPart = '-';
  }
  return { valuePart, superscriptPart };
};
// 从 record 或 editForm 取某视力字段的 { value, sign, number }
const getVisionCellData = (obj, fieldPrefix) => {
  if (!obj) return { value: '', sign: '+', number: '' };
  const value = obj[fieldPrefix];
  const sign = obj[`${fieldPrefix}_sign`];
  const level = obj[`${fieldPrefix}_level`];
  return {
    value: value != null && value !== '' ? String(value) : '',
    sign: sign || '+',
    number: level != null && level !== '' ? String(level) : ''
  };
};
// 查看/展示：返回 { valuePart, superscriptPart } 用于「值 + 上标」显示
const getVisionDisplayParts = (source, fieldPrefix) => {
  return formatVisionCellSuperscript(getVisionCellData(source, fieldPrefix));
};
// 散瞳视力查看：优先显示 bcva 字段，无值时回退到 subjective_old 字段
const getVisionDisplayPartsWithFallback = (source, primaryKey, fallbackKey) => {
  const primary = getVisionDisplayParts(source, primaryKey);
  if (primary.valuePart || primary.superscriptPart) return primary;
  return getVisionDisplayParts(source, fallbackKey);
};

const visionRawByCell = ref({});
const visionFocusedCell = ref(null);
const visionInputRefs = {};
const setVisionInputRef = (fieldPrefix, el) => { if (el) visionInputRefs[fieldPrefix] = el; };
const focusVisionCell = (fieldPrefix) => {
  visionFocusedCell.value = fieldPrefix;
  setTimeout(() => visionInputRefs[fieldPrefix]?.focus(), 50);
};
const getVisionInputDisplay = (fieldPrefix) => {
  const raw = visionRawByCell.value[fieldPrefix];
  if (raw !== undefined && raw !== null) return String(raw);
  return getVisionCombinedDisplayString(getVisionCellData(editForm.value, fieldPrefix));
};
const onVisionInput = (fieldPrefix, value) => {
  visionRawByCell.value[fieldPrefix] = value;
  const parsed = parseVisionCombinedInput(value);
  if (!editForm.value) editForm.value = {};
  const numVal = parsed.value === '' ? undefined : (parseFloat(parsed.value) || undefined);
  editForm.value[fieldPrefix] = numVal;
  editForm.value[`${fieldPrefix}_sign`] = parsed.sign === '-' ? '-' : '+';
  const levelNum = parsed.number === '' ? undefined : parseInt(parsed.number, 10);
  editForm.value[`${fieldPrefix}_level`] = (levelNum >= 1 && levelNum <= 4) ? levelNum : undefined;
};

// 格式化处方（球镜、柱镜、轴位）
// 格式：球镜/柱镜×轴位，例如：-1.75D/-2.00D×95°
const formatPrescription = (spherical, sphericalSign, cylindrical, axis) => {
  const s = formatSphere(spherical, sphericalSign);
  const c = formatCylinder(cylindrical);
  const a = formatAxis(axis);
  
  // 如果所有值都为空，返回 '-'
  if (s === '-' && c === '-' && a === '-') return '-';
  
  // 如果球镜为空，返回 '-'
  if (s === '-') return '-';
  
  // 构建格式：球镜/柱镜×轴位
  let result = s + 'D';
  
  // 如果有柱镜，添加柱镜和轴位
  if (c !== '-' && a !== '-') {
    result += '/' + c + 'D×' + a + '°';
  } else if (c !== '-') {
    // 只有柱镜没有轴位
    result += '/' + c + 'D';
  } else if (a !== '-') {
    // 只有轴位没有柱镜（这种情况不太可能，但处理一下）
    result += '×' + a + '°';
  }
  
  return result;
};

// 格式化旧镜光度（不包含符号）：球镜/柱镜×轴位
const formatPrescriptionWithoutSign = (spherical, cylindrical, axis) => {
  // 格式化球镜（不包含符号）
  const formatSphereValue = (val) => {
    if (val === null || val === undefined || val === '') return '-';
    const num = Number(val);
    if (isNaN(num)) return '-';
    return num.toFixed(2);
  };
  
  // 格式化柱镜
  const formatCylinderValue = (val) => {
    if (val === null || val === undefined || val === '') return '-';
    const num = Number(val);
    if (isNaN(num)) return '-';
    return num.toFixed(2);
  };
  
  // 格式化轴位
  const formatAxisValue = (val) => {
    if (val === null || val === undefined || val === '') return '-';
    const num = Number(val);
    if (isNaN(num)) return '-';
    return num.toString();
  };
  
  const s = formatSphereValue(spherical);
  const c = formatCylinderValue(cylindrical);
  const a = formatAxisValue(axis);
  
  // 如果所有值都为空，返回 '-'
  if (s === '-' && c === '-' && a === '-') return '-';
  
  // 如果球镜为空，返回 '-'
  if (s === '-') return '-';
  
  // 构建格式：球镜/柱镜×轴位
  let result = s + 'D';
  
  // 如果有柱镜，添加柱镜和轴位
  if (c !== '-' && a !== '-') {
    result += '/' + c + 'D×' + a + '°';
  } else if (c !== '-') {
    // 只有柱镜没有轴位
    result += '/' + c + 'D';
  } else if (a !== '-') {
    // 只有轴位没有柱镜（不太可能，但处理一下）
    result += '/×' + a + '°';
  }
  
  return result;
};

// 格式化瞳距（单位：cm）
const formatPD = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  // 如果原始数据是mm，转换为cm（除以10）
  // 假设后端存储的是mm，需要转换为cm
  const cmValue = num / 10;
  return `${cmValue.toFixed(1)} cm`;
};

// 格式化瞳距（纯数字，用于验光检查表格，单位：mm）
const formatPDNumber = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  // 直接显示mm值，保留1位小数
  return num.toFixed(1);
};

// 格式化瞳孔大小 PS（单位mm，一位小数，无符号）
const formatPS = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return Math.abs(num).toFixed(1); // 一位小数，无符号
};

// 格式化球镜（允许正负号，没有符号时自动添加正号）
const formatSphere = (value, sign) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  
  // 如果有符号，使用符号
  if (sign === '+') {
    return '+' + Math.abs(num).toFixed(2);
  } else if (sign === '-') {
    return '-' + Math.abs(num).toFixed(2);
  }
  
  // 没有符号时，按数值本身的正负显示
  const inferred = num >= 0 ? '+' : '-';
  return inferred + Math.abs(num).toFixed(2);
};

// 格式化柱镜（与球镜一致：保留正负号，无符号时按数值推断）
const formatCylinder = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  const inferred = num >= 0 ? '+' : '-';
  return inferred + Math.abs(num).toFixed(2);
};

// 格式化轴位（无符号，整数）
const formatAxis = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  // 轴位无符号，取绝对值并四舍五入为整数
  return Math.abs(Math.round(num)).toString();
};

// 计算等效球镜 SE = S + C/2（显示带单位 D，如 -2.25D）
const formatSE = (spherical, cylindrical, sphericalSign) => {
  // 如果球镜为空，返回"-"
  if (spherical === null || spherical === undefined || spherical === '') return '-';
  let s = Number(spherical);
  if (isNaN(s)) return '-';
  
  // 兼容两种后端：有 sign 字段 / 只有一个字段存储“符号+值”
  // - 若 sphericalSign 存在，按 sign 纠正
  // - 否则直接用 s 本身的正负（后端字段可能是 "-0.50"）
  if (sphericalSign === '+') s = Math.abs(s);
  if (sphericalSign === '-') s = -Math.abs(s);
  
  const c = Number(cylindrical);
  if (isNaN(c) || c === 0) {
    // 只有球镜，没有柱镜时，显示球镜值（带符号）
    const v = s >= 0 ? '+' + s.toFixed(2) : s.toFixed(2);
    return v + 'D';
  }
  // SE = 球镜 + 柱镜/2（柱镜按实际正负值参与计算）
  const se = s + c / 2;
  const v = se >= 0 ? '+' + se.toFixed(2) : se.toFixed(2);
  return v + 'D';
};

// 格式化主导眼
const formatDominantEye = (value) => {
  if (!value || value === null || value === undefined || value === '') return '';
  // 处理各种可能的格式
  const valueStr = String(value).trim();
  if (valueStr === 'right' || valueStr === '右' || valueStr === 'R' || valueStr === '右眼') return '右眼';
  if (valueStr === 'left' || valueStr === '左' || valueStr === 'L' || valueStr === '左眼') return '左眼';
  // 如果已经是正确的格式，直接返回
  return valueStr;
};

/** 主导眼：点选切换；再次点击已选项则清空 */
const toggleDominantEye = (eye) => {
  if (!editForm.value) return;
  const cur = formatDominantEye(editForm.value.subjective_leading_eye);
  if (cur === eye) {
    editForm.value.subjective_leading_eye = null;
  } else {
    editForm.value.subjective_leading_eye = eye;
  }
};

// 判断值是否为空
const hasValue = (value) => {
  return value !== null && value !== undefined && value !== '' && value !== '-';
};


// ADD选项（近附加）
const addOptions = ['+0.50', '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00', '+3.25', '+3.50', '+3.75', '+4.00'];

// 判断SE值是否为空
const hasSEValue = (spherical, cylindrical) => {
  const s = Number(spherical);
  return !isNaN(s) && spherical !== null && spherical !== undefined && spherical !== '';
};

// 格式化ADD（近附加）
const formatADD = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  // 显示时带+号
  return '+' + num.toFixed(2);
};

// 切换视力符号（+/-按钮点击事件）
const toggleVisionSign = (fieldName, sign) => {
  if (!editForm.value) {
    editForm.value = {};
  }
  
  // 处理BCVA字段的兼容性：同时更新新字段和旧字段
  const bcvaFieldMap = {
    // 远视力字段映射
    'pupillary_bcva_right_vision_sign': 'pupillary_subjective_right_old_vision_sign',
    'pupillary_bcva_left_vision_sign': 'pupillary_subjective_left_old_vision_sign',
    'pupillary_bcva_both_vision_sign': 'pupillary_subjective_both_old_vision_sign',
    // 近视力字段映射
    'pupillary_bcva_near_right_vision_sign': 'pupillary_subjective_near_right_old_vision_sign',
    'pupillary_bcva_near_left_vision_sign': 'pupillary_subjective_near_left_old_vision_sign',
    'pupillary_bcva_near_both_vision_sign': 'pupillary_subjective_near_both_old_vision_sign'
  };
  
  const oldFieldName = bcvaFieldMap[fieldName];
  
  // 如果当前值已经是点击的符号，则清除（切换为undefined）
  const currentSign = editForm.value[fieldName] || (oldFieldName ? editForm.value[oldFieldName] : null);
  if (currentSign === sign) {
    editForm.value[fieldName] = undefined;
    if (oldFieldName) {
      editForm.value[oldFieldName] = undefined;
    }
    // 如果清除符号，且该字段有级别但没有符号，则清除级别（规则：填写个数必须写正负符号）
    const levelFieldName = fieldName.replace('_sign', '_level');
    const oldLevelFieldName = oldFieldName ? oldFieldName.replace('_sign', '_level') : null;
    if (editForm.value[levelFieldName] !== null && editForm.value[levelFieldName] !== undefined && editForm.value[levelFieldName] !== '') {
      editForm.value[levelFieldName] = undefined;
    }
    if (oldLevelFieldName && editForm.value[oldLevelFieldName] !== null && editForm.value[oldLevelFieldName] !== undefined && editForm.value[oldLevelFieldName] !== '') {
      editForm.value[oldLevelFieldName] = undefined;
    }
  } else {
    // 否则设置为点击的符号
    editForm.value[fieldName] = sign;
    if (oldFieldName) {
      editForm.value[oldFieldName] = sign;
    }
  }
};

// 监听级别变化，如果填写了级别但没有符号，则清除级别（规则：填写个数必须写正负符号）
const handleVisionLevelChange = (levelFieldName, value) => {
  if (!editForm.value) {
    editForm.value = {};
  }
  
  const signFieldName = levelFieldName.replace('_level', '_sign');
  // 如果填写了级别但没有符号，则清除级别并提示用户
  if (value !== null && value !== undefined && value !== '') {
    if (!editForm.value[signFieldName] || editForm.value[signFieldName] === '') {
      // 提示用户需要先填写符号
      message.warning('填写个数前需要先选择正负符号');
      editForm.value[levelFieldName] = undefined;
      return;
    }
  }
  
  editForm.value[levelFieldName] = value;
};

// 切换处方符号（+/-按钮点击事件，用于球镜）
const togglePrescriptionSign = (fieldName, sign) => {
  if (!editForm.value) {
    editForm.value = {};
  }
  // 如果当前值已经是点击的符号，则清除（切换为undefined）
  if (editForm.value[fieldName] === sign) {
    editForm.value[fieldName] = undefined;
  } else {
    // 否则设置为点击的符号
    editForm.value[fieldName] = sign;
  }
};

// 切换section展开/收起状态
const handleToggleSection = (sectionKey) => {
  emit('toggle-section', sectionKey);
};

// 球镜编辑：输入过程中原样显示字符串；已落库为数字时与柱镜一致带 +/-、两位小数（仅展示，不干扰输入过程）
const getSphericalDisplayValue = (fieldName) => {
  if (!editForm.value || editForm.value[fieldName] === null || editForm.value[fieldName] === undefined || editForm.value[fieldName] === '') return '';
  const value = editForm.value[fieldName];
  if (typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (isNaN(value)) return '';
    const inferred = value >= 0 ? '+' : '-';
    return inferred + Math.abs(value).toFixed(2);
  }
  return String(value);
};

// 处理球镜输入：输入过程中只存字符串，不打断 -1. 等中间态
const handleSphericalChange = (fieldName, e) => {
  if (!editForm.value) editForm.value = {};
  const value = e.target ? e.target.value : e;
  editForm.value[fieldName] = value;
};

// 失焦：解析为数字并保留最多两位小数（与柱镜 blur 一致）
const handleSphericalBlur = (fieldName) => {
  if (!editForm.value) return;
  const raw = editForm.value[fieldName];
  if (raw === null || raw === undefined || raw === '') {
    editForm.value[fieldName] = '';
    return;
  }
  const value = typeof raw === 'string' ? raw.trim() : raw;
  if (value === '') {
    editForm.value[fieldName] = '';
    return;
  }
  const num = Number(String(value).replace(/[^\d.+-]/g, ''));
  if (!isNaN(num)) editForm.value[fieldName] = parseFloat(num.toFixed(2));
};

// 获取柱镜显示值（与 formatCylinder 一致：数值型带 +/-，避免 toFixed 去掉正号）
const getCylindricalDisplayValue = (fieldName) => {
  if (!editForm.value || editForm.value[fieldName] === null || editForm.value[fieldName] === undefined || editForm.value[fieldName] === '') return '';
  const value = editForm.value[fieldName];
  if (typeof value === 'number') {
    const inferred = value >= 0 ? '+' : '-';
    return inferred + Math.abs(value).toFixed(2);
  }
  return String(value);
};

// 处理柱镜输入变化（与球镜一致：符号在文本框内）
const handleCylindricalChange = (fieldName, e) => {
  if (!editForm.value) editForm.value = {};
  const inputValue = e.target ? e.target.value : e;
  editForm.value[fieldName] = inputValue;
};

// 处理柱镜失去焦点，格式化为2位小数（保留用户输入的正负号）
const handleCylindricalBlur = (fieldName) => {
  if (!editForm.value || editForm.value[fieldName] === null || editForm.value[fieldName] === undefined || editForm.value[fieldName] === '') {
    editForm.value[fieldName] = '';
    return;
  }
  const value = editForm.value[fieldName];
  const num = Number(value);
  if (!isNaN(num)) editForm.value[fieldName] = parseFloat(num.toFixed(2));
};

// 柱镜：与球镜一致，输入时若无+/-符号则显示提示
const needCylindricalSignHint = (fieldName) => {
  if (!editForm.value) return false;
  const val = editForm.value[fieldName];
  if (val == null || String(val).trim() === '') return false;
  const t = String(val).trim();
  if (t === '0' || t === '0.00') return false;
  return !t.startsWith('+') && !t.startsWith('-');
};

// 合并的旧镜类型（计算属性）
const bothGlassesType = computed({
  get() {
    const right = editForm.value?.vaec_right_glasses_type;
    const left = editForm.value?.vaec_left_glasses_type;
    // 如果左右眼相同，返回该值；如果不同，返回null（显示为空，让用户重新选择）
    if (right && left && right === left) {
      return right;
    }
    // 如果只有一个有值，返回该值
    if (right && !left) return right;
    if (left && !right) return left;
    return undefined;
  },
  set(value) {
    if (!editForm.value) {
      editForm.value = {};
    }
    // 同时更新左右眼的值
    editForm.value.vaec_right_glasses_type = value;
    editForm.value.vaec_left_glasses_type = value;
  }
});

// 处理旧镜类型变化
const handleBothGlassesTypeChange = (value) => {
  if (!editForm.value) {
    editForm.value = {};
  }
  // 同时更新左右眼的值
  editForm.value.vaec_right_glasses_type = value;
  editForm.value.vaec_left_glasses_type = value;
};
</script>

<style scoped lang="scss">
.routine-exam-style-two {
  /* 与表内输入框 32px 一致；报告式 .exam-sheet 表格内仍由 exam-sheet.css 使用 22px */
  --exr-select-h: 32px;
  /* 视力 +/- 网格内紧凑下拉，保持原 26px 行高布局 */
  --exr-vision-grid-select-h: 26px;
  --exr-font-body: 11px; /* 表内输入/下拉基础字号（略小于原 12px） */
  --exr-font-table: 12px; /* 视力/验光表体字号（略小于原 13px） */
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  
  // 所有输入框文本居中显示
  // a-input组件文本居中
  :deep(.ant-input) {
    text-align: center !important;
    font-size: var(--exr-font-body);
    height: 32px; // 统一输入框高度
    line-height: 32px; // 统一行高
  }
  
  // a-input-number组件文本居中
  :deep(.ant-input-number) {
    height: 32px !important; // 统一输入框高度
  }
  
  :deep(.ant-input-number-input) {
    text-align: center !important;
    font-size: var(--exr-font-body);
    height: 32px; // 统一输入框高度
    line-height: 32px; // 统一行高
  }

  // 表格内文本框：不显示占位灰字（避免「背景字」与内容重叠）
  table {
    :deep(.ant-input::placeholder),
    :deep(.ant-input-number-input::placeholder) {
      color: transparent !important;
      opacity: 0 !important;
    }
  }
  
  // a-select组件文本居中（高度与统一报告表下拉一致）
  :deep(.ant-select-selector) {
    .ant-select-selection-item,
    .ant-select-selection-placeholder {
      text-align: center;
      line-height: calc(var(--exr-select-h, 32px) - 2px);
    }
  }
  
  // a-select组件字体大小
  :deep(.ant-select-selector) {
    font-size: var(--exr-font-body);
  }
  
  :deep(.ant-select-selection-item) {
    font-size: var(--exr-font-body);
  }
  
  :deep(.ant-select-selection-placeholder) {
    font-size: var(--exr-font-body);
  }
  
  // 下拉选项字体缩小（全局样式，因为下拉菜单挂载在body上）
  :deep(.ant-select-dropdown) {
    .ant-select-item {
      font-size: var(--exr-font-body);
    }
  }

  // 主导眼 / 瞳距：报告式字号由 exam-sheet 与眼别 th.eye-cell.eye-name 对齐；非报告式主觉表与本表 td.eye-name 一致
  .dominant-eye-pd-report .dominant-eye-pd-container {
    font-size: inherit;
  }

  .subjective-table .dominant-eye-pd-cell .dominant-eye-pd-container {
    font-size: var(--exr-font-body);

    .dominant-eye-pd-label {
      font-size: inherit;
    }

    .dominant-eye-toggle-group {
      flex: 0 0 auto;
    }

    .dominant-eye-toggle-btn {
      font-size: max(9px, calc(var(--exr-font-body, 11px) - 1px)) !important;
    }

    .pupil-distance-input :deep(input) {
      font-size: inherit !important;
    }

    .pupil-distance-unit {
      font-size: inherit;
    }
  }
}

// 编辑模式：表内可填数值与查看态一致，与「身高」等格同用 --exr-font-body
.routine-exam-style-two.routine-exam-style-two--edit {
  --exr-font-body: 11px;
  --exr-font-table: 12px;

  .section-title {
    font-size: 15px;
  }

  .section-toggle-icon {
    font-size: 12px;
  }

  .vision-combined-input {
    font-size: var(--exr-font-body);
  }

  .routine-info-table:not(.exam-sheet),
  .dominant-eye-table {
    font-size: var(--exr-font-body);
  }

  .vision-sign-btn {
    font-size: 13px;
  }
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  
  // 报告模式下（没有标题）缩小间距
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
  font-size: 16px;
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
  font-size: 13px;
}

.routine-info-table:not(.exam-sheet) {
  width: 100%;
  border-collapse: collapse;
  font-size: clamp(0.7rem, 1.4vw, 0.875rem);
  margin-bottom: 16px;
  
  th, td {
    padding: 10px 12px;
    text-align: center;
    border: 1px solid #e0e6f5;
  }
  
  th {
    background: linear-gradient(135deg, rgba(34, 75, 150, 0.08) 0%, rgba(234, 240, 255, 0.6) 100%);
    color: #224b96;
    font-weight: 600;
}

  td.item-label {
    background: linear-gradient(135deg, rgba(34, 75, 150, 0.05) 0%, rgba(234, 240, 255, 0.4) 100%);
    color: #333;
    font-weight: 500;
    text-align: center;
  }
  
  td.unit-cell {
  color: #666;
  font-weight: 500;
  }
  
  td {
    color: #333;
  }
  
  // 隐藏输入数字框的上下箭头
  :deep(.ant-input-number-handler-wrap) {
    display: none;
  }
  
  :deep(.ant-input-number) {
    width: 50% !important; // 缩小50%，从100%改为50%
  }
  
  :deep(.ant-input-number-input) {
    text-align: center;
  }
}

.dominant-eye-table {
  width: 100%;
  border-collapse: collapse;
  font-size: clamp(0.7rem, 1.4vw, 0.875rem);
  margin-bottom: 16px;
  
  th, td {
    padding: 10px 12px;
    text-align: center;
    border: 1px solid #e0e6f5;
  }
  
  th {
    background: linear-gradient(135deg, rgba(34, 75, 150, 0.08) 0%, rgba(234, 240, 255, 0.6) 100%);
    color: #224b96;
    font-weight: 600;
  }
  
  td.item-label {
    background: linear-gradient(135deg, rgba(34, 75, 150, 0.05) 0%, rgba(234, 240, 255, 0.4) 100%);
  color: #333;
  font-weight: 500;
    text-align: center;
  }
  
  td.unit-cell {
    color: #666;
    font-weight: 500;
  }
  
  td {
    color: #333;
  }
}

// 体重项向后移动1.5个汉字位置
.weight-item {
  margin-left: 1.5em; // 1.5个汉字位置（使用em单位，1em约等于一个汉字宽度）
}

.vision-table:not(.exam-sheet) {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--exr-font-table, 12px);
  table-layout: fixed;
}

.vision-table:not(.exam-sheet) {
  border-radius: 8px;
  overflow: hidden;
}

.vision-table:not(.exam-sheet) thead {
  background: linear-gradient(180deg, rgba(34, 75, 150, 0.12) 0%, rgba(34, 75, 150, 0.08) 100%);
}

.vision-table:not(.exam-sheet) th {
  padding: 10px 12px;
  text-align: center;
  font-weight: 600;
  color: #224b96;
  border: 1px solid rgba(34, 75, 150, 0.15);
  border-bottom: 2px solid rgba(34, 75, 150, 0.15);
  line-height: 1.3;
}

/* 眼别列：右眼/左眼/双眼 略小于表头 */
.vision-table:not(.exam-sheet) th.eye-name {
  font-size: 10px;
}

.vision-table:not(.exam-sheet) tbody tr {
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(34, 75, 150, 0.04) !important;
  }
}

.vision-table:not(.exam-sheet) td {
  border: 1px solid #f0f2f5;
  border-top: none;
}

// 检查项目列（第1列）- 增加宽度，强制单行显示
.vision-table:not(.exam-sheet) th:nth-child(1),
.vision-table:not(.exam-sheet) td:nth-child(1) {
  width: 14%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 80px;
}

// 远用/近用列（第2列）- 与第一列保持一致
.vision-table:not(.exam-sheet) th:nth-child(2),
.vision-table:not(.exam-sheet) td:nth-child(2) {
  width: 14%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 80px;
}

// 右眼列（第3列）- 按1:1:1比例分配，三等分
.vision-table:not(.exam-sheet) th:nth-child(3),
.vision-table:not(.exam-sheet) td:nth-child(3) {
  width: calc((100% - 14% - 14%) / 3);
  min-width: 100px;
}

// 左眼列（第4列）- 按1:1:1比例分配，三等分
.vision-table:not(.exam-sheet) th:nth-child(4),
.vision-table:not(.exam-sheet) td:nth-child(4) {
  width: calc((100% - 14% - 14%) / 3);
  min-width: 100px;
}

// 双眼列（第5列）- 按1:1:1比例分配，三等分
.vision-table:not(.exam-sheet) th:nth-child(5),
.vision-table:not(.exam-sheet) td:nth-child(5) {
  width: calc((100% - 14% - 14%) / 3);
  min-width: 100px;
}

.vision-table:not(.exam-sheet) td {
  padding: 2.5mm 2.5mm; // 从2mm增加25%到2.5mm
  text-align: center;
  color: #333;
  border: 1px solid #e0e6f5;
  line-height: 1.3;
}

.vision-table:not(.exam-sheet) .vision-label {
  text-align: center;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: #fafbff;
  vertical-align: middle;
  padding: 2.5mm 2.5mm; // 从2mm增加25%到2.5mm
}

.vision-table:not(.exam-sheet) .vision-sub-label-cell {
  text-align: center;
  color: #999;
  font-weight: 500;
  background: #fafbff;
  padding: 2.5mm 2.5mm; // 从2mm增加25%到2.5mm
  font-size: var(--exr-font-table, 12px);
}

.vision-table:not(.exam-sheet) .old-glasses-row {
  background: #f9faff;
}

.vision-table:not(.exam-sheet) .old-glasses-row td {
  border-top: 2px solid #d0d8f0;
}

.vision-table:not(.exam-sheet) .old-glasses-label {
  text-align: center;
  padding: 2.5mm 2.5mm; // 从2mm增加25%到2.5mm
  font-size: var(--exr-font-table, 12px);
  color: #666;
  font-weight: 500;
  background: #f9faff;
}

.vision-table:not(.exam-sheet) .old-glasses-cell {
  text-align: center;
  padding: 2.5mm 2.5mm; // 从2mm增加25%到2.5mm
  font-size: var(--exr-font-table, 12px);
  color: #333;
}

// 旧镜类型选择框：触发器样式见下；下拉面板见 .glasses-type-dropdown（与 ADD 下拉同理）
.vision-table:not(.exam-sheet) .glasses-type-select {
  width: auto !important;
  max-width: 100px !important;
  min-width: 76px;
  margin-left: auto;
  margin-right: auto;

  :deep(.ant-select-selector) {
    display: flex;
    align-items: center;
    padding-right: 7px !important;
    padding-left: 5px !important;
    background: #fff !important;
    border: 1px solid #d9d9d9 !important;
    border-radius: 6px !important;
    min-height: var(--exr-select-h, 32px);
    height: var(--exr-select-h, 32px) !important;
    font-size: var(--exr-font-table, 12px);
  }

  :deep(.ant-select-selection-item) {
    line-height: calc(var(--exr-select-h, 32px) - 2px);
    padding-right: 0;
    padding-left: 0;
    font-size: var(--exr-font-table, 12px);
    font-weight: 500;
  }

  :deep(.ant-select-selection-placeholder) {
    line-height: calc(var(--exr-select-h, 32px) - 2px);
    padding-left: 0;
    font-size: var(--exr-font-body, 11px);
    color: #bfbfbf;
    font-weight: 400;
  }

  :deep(.ant-select-arrow) {
    top: 50% !important;
    transform: translateY(-50%) !important;
    right: 2px !important;
    margin-top: 0 !important;
    color: #8c8c8c !important;
    font-size: 10px;
  }

  :deep(.ant-select-clear) {
    top: 50%;
    transform: translateY(-50%);
    right: 11px;
  }
  
  &:hover :deep(.ant-select-selector) {
    border-color: #40a9ff !important;
  }
  
  &.ant-select-focused :deep(.ant-select-selector) {
    border-color: #40a9ff !important;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
  }
}

.refraction-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--exr-font-table, 12px);
  table-layout: fixed;
}

// 主觉验光表格列宽调整
.subjective-table {
  /* 眼别列文字（右眼/左眼/双眼）略小于表体 13px */
  td.eye-name {
    font-size: 11px;
    font-weight: 600;
  }

  .col-check-item {
    width: 12%;
  }
  
  // 眼别列（第2列）- 自适应宽度，保证内容能放在同一行
  th:nth-child(2),
  td:nth-child(2) {
    width: 8%;
    white-space: nowrap;
  }
  
  // 球镜列（第3列）- 压缩宽度
  th:nth-child(3),
  td:nth-child(3) {
    width: 10%;
  }
  
  // 柱镜列（第4列）- 与球镜宽度一致，压缩宽度
  th:nth-child(4),
  td:nth-child(4) {
    width: 10%;
  }
  
  // 轴位列（第5列）- 增加宽度
  th:nth-child(5),
  td:nth-child(5) {
    width: 9%;
  }
  
  // 远视力列（第6列）- 增加宽度（从球镜和柱镜压缩出来的空间）
  th:nth-child(6),
  td:nth-child(6) {
    width: 13%;
    
    // 远视力下拉框宽度
    .vision-value-select {
      flex: 1;
      min-width: 0;
    }
  }
  
  // 近视力列（第7列）- 与远视力宽度一致；ADD/（散瞳）列勿套用
  th:nth-child(7):not(.col-pupillary-eye),
  td:nth-child(7):not(.col-pupillary-eye):not(.col-add-pd) {
    width: 13%;
    
    .vision-value-select {
      flex: 1;
      min-width: 0;
    }
  }
  
  /* （散瞳）眼别列：在 ADD 右侧，与报告式 exam-sheet 一致 */
  th.col-pupillary-eye,
  td.col-pupillary-eye {
    width: 6% !important;
    min-width: 48px !important;
    max-width: 72px !important;
    white-space: nowrap !important;
    text-align: center !important;
    vertical-align: middle !important;
    overflow: visible !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    color: #2a3542 !important;
  }

  thead th.col-pupillary-eye {
    font-weight: 600;
    font-size: 11px;
    background: #f0f9fd;
    color: #2a3542;
  }

  /* 散瞳块内「（散瞳）」列眼别：与眼别列视觉一致 */
  tbody th.col-pupillary-eye {
    background: #fafbff;
    font-weight: 600;
  }

  // ADD列 - 与柱镜宽度一致（11%）
  th.col-add-pd,
  td.col-add-pd {
    width: 11%;
  }
  
  // 主觉验光表格中球镜和柱镜输入框：统一减小内边距
  .prescription-spherical,
  .prescription-cylindrical {
    &.ant-input-number {
      :deep(.ant-input-number-input) {
        padding: 0 6px !important; // 减小内边距从11px到6px
      }
    }
    
    :deep(.ant-input) {
      padding: 0 6px !important; // 减小内边距从11px到6px
    }
  }
  
  // 主导眼和瞳距单元格：水平垂直居中
  .dominant-eye-pd-cell {
    text-align: center !important;
    vertical-align: middle !important;
    padding: 8px 12px;
    
    .dominant-eye-pd-container {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: center;
      gap: 14px;
      width: 100%;
      font-weight: 400;
      
      .dominant-eye-pd-item {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: center;
        gap: 6px;
        flex: 0 0 auto;
        width: auto;
        
        .dominant-eye-pd-label {
          white-space: nowrap;
          flex-shrink: 0;
          font-weight: 400;
        }
        
        .dominant-eye-toggle-group {
          flex: 0 0 auto;
        }
        
        // 瞳距：短输入框，与 mm 间距收紧
        .pupil-distance-input {
          width: 4.8ch !important;
          min-width: 4ch !important;
          max-width: 5.5ch !important;
          flex: 0 0 auto !important;
          text-align: center;
          
          :deep(input) {
            text-align: center;
            padding-left: 2px !important;
            padding-right: 2px !important;
          }
        }
        
        .pupil-distance-unit {
          white-space: nowrap;
          margin-left: 0;
          flex-shrink: 0;
        }
      }
    }
  }
}

.refraction-table {
  border-radius: 8px;
  overflow: hidden;
}

.refraction-table thead {
  background: linear-gradient(180deg, rgba(34, 75, 150, 0.12) 0%, rgba(34, 75, 150, 0.08) 100%);
}

.refraction-table th {
  padding: 10px 12px;
  text-align: center;
  font-weight: 600;
  color: #224b96;
  border: 1px solid rgba(34, 75, 150, 0.15);
  border-bottom: 2px solid rgba(34, 75, 150, 0.15);
  line-height: 1.3;
}

.refraction-table tbody tr {
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(34, 75, 150, 0.04) !important;
  }
}

.refraction-table td {
  padding: 10px 12px;
  text-align: center;
  color: #333;
  border: 1px solid #f0f2f5;
  border-top: none;
  line-height: 1.3;
}

// 确保电脑验光检查表格所有单元格内容居中
.refraction-table tbody td {
  text-align: center !important;
}

.refraction-table .refraction-value-top {
  text-align: center;
  padding: 2.5mm 2.5mm; // 从2mm增加25%到2.5mm
  font-size: var(--exr-font-table, 12px);
  color: #333;
  border: 1px solid #e0e6f5;
  line-height: 1.3;
  vertical-align: middle;
}

.refraction-table .refraction-value-bottom {
  text-align: center;
  padding: 2.5mm 2.5mm; // 从2mm增加25%到2.5mm
  font-size: var(--exr-font-table, 12px);
  color: #666;
  border: 1px solid #e0e6f5;
  line-height: 1.3;
  vertical-align: top;
}

.refraction-table .refraction-label {
  text-align: left;
  color: #666;
  font-weight: 500;
  background: #fafbff;
  width: 34%;
  vertical-align: middle;
  padding: 2.5mm 2.5mm; // 从2mm增加25%到2.5mm
  font-size: var(--exr-font-table, 12px);
}

// 主觉验光检查表格的检查项目列宽为14%
.subjective-table .refraction-label {
  width: 14%;
}

// 散瞳主觉验光标签字体与主觉验光一致（移除字体缩小）
.subjective-table .pupillary-subjective-label {
  line-height: 1.3;
}

// 「（散瞳）」侧栏标签字体与「（小瞳）」一致（移除字体缩小）
.refraction-table .pupillary-objective-label {
  line-height: 1.3;
}

.refraction-table .refraction-note {
  font-size: 9px;
  color: #999;
  font-weight: normal;
  display: block;
  margin-top: 0.5mm;
}

.refraction-table .vision-dominant-row {
  border-top: 2px solid #d0d8f0;
}

.refraction-table .vision-dominant-row td {
  border-top: 2px solid #d0d8f0;
}

.refraction-table .vision-dominant-cell {
  text-align: center;
  padding: 2.5mm 2.5mm; // 从2mm增加25%到2.5mm
  font-size: var(--exr-font-table, 12px);
  color: #333;
  border: 1px solid #e0e6f5;
  line-height: 1.3;
  width: auto;
}

.refraction-table .vision-dominant-label {
  text-align: center;
  padding: 2.5mm 2.5mm; // 从2mm增加25%到2.5mm
  font-size: var(--exr-font-table, 12px);
  color: #666;
  font-weight: 500;
  background: #fafbff;
  border: 1px solid #e0e6f5;
  line-height: 1.3;
  width: auto;
}

// 斜线单元格（用于双眼的S/C/A列）
.refraction-table .diagonal-cell {
  position: relative;
  padding: 2.5mm 2.5mm; // 从2mm增加25%到2.5mm
  background: linear-gradient(to bottom right, transparent calc(50% - 0.5px), #999 calc(50% - 0.5px), #999 calc(50% + 0.5px), transparent calc(50% + 0.5px));
}

// 视力输入组样式
.vision-input-group {
  display: flex;
  gap: 2px;
  align-items: center;
  width: 100%;
}

// 视力单输入（表格单元格内：无边框、透明底、居中，与裸眼/矫正视力统一）
.vision-combined-input {
  width: 100%;
  padding: 4px 6px;
  border: none;
  border-radius: 0;
  font-size: 13px;
  box-sizing: border-box;
  background: transparent;
  outline: none;
  text-align: center;
}
/* 避免 Chrome 自动填充时整块变黄底 */
.vision-combined-input:-webkit-autofill,
.vision-combined-input:-webkit-autofill:hover,
.vision-combined-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px transparent inset;
  transition: background-color 99999s ease-out;
}
.vision-cell-superscript {
  display: inline-flex;
  align-items: baseline;
}
.vision-cell-superscript sup {
  font-size: 0.75em;
  margin-left: 2px;
  vertical-align: super;
  line-height: 0;
  position: relative;
  top: -0.4em;
}
.vision-edit-display {
  min-height: 28px;
  padding: 4px 6px;
  border: none;
  border-radius: 0;
  cursor: text;
  background: transparent;
  width: 100%;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  -webkit-tap-highlight-color: transparent;
}
.vision-edit-display:focus-visible {
  outline: none;
}

// 远视力单元格2x2网格布局：左上+按钮，右上视力值，左下-按钮，右下个数
.vision-grid-2x2 {
  display: grid;
  grid-template-columns: 22px 1fr; // 左列固定22px（压缩按钮宽度），右列填满剩余空间
  grid-template-rows: 1fr 1fr; // 两行等高
  gap: 2px;
  width: 100%;
  height: 54px; // 压缩后总高度：26px + 2px + 26px = 54px
  
  // 左上：+按钮
  .vision-plus-btn {
    grid-column: 1;
    grid-row: 1;
    width: 22px; // 压缩按钮宽度
    height: 26px !important; // 压缩按钮高度，使用!important确保优先级
  }
  
  // 右上：视力值下拉框 - 高度与按钮+一致
  .vision-value-select {
    grid-column: 2;
    grid-row: 1;
    height: var(--exr-vision-grid-select-h, 26px) !important; // 与按钮+高度一致，使用!important确保优先级
    max-width: 100%; // 加宽，移除宽度限制
    
    // 确保内部选择器高度也正确
    :deep(.ant-select-selector) {
      height: var(--exr-vision-grid-select-h, 26px) !important;
      min-height: var(--exr-vision-grid-select-h, 26px) !important;
      line-height: var(--exr-vision-grid-select-h, 26px) !important;
    }
  }
  
  // 左下：-按钮
  .vision-minus-btn {
    grid-column: 1;
    grid-row: 2;
    width: 22px; // 压缩按钮宽度
    height: 26px !important; // 压缩按钮高度，使用!important确保优先级
  }
  
  // 右下：个数下拉框 - 高度与按钮-一致
  .vision-level-select {
    grid-column: 2;
    grid-row: 2;
    height: var(--exr-vision-grid-select-h, 26px) !important; // 与按钮-高度一致，使用!important确保优先级
    width: 100%;
    max-width: 60px; // 加宽个数下拉框
    
    // 确保内部选择器高度也正确
    :deep(.ant-select-selector) {
      height: var(--exr-vision-grid-select-h, 26px) !important;
      min-height: var(--exr-vision-grid-select-h, 26px) !important;
      line-height: var(--exr-vision-grid-select-h, 26px) !important;
    }
  }
}

// 处方输入组样式（+/-按钮、球镜、柱镜、轴位）
.prescription-input-group {
  display: flex;
  gap: 2px;
  align-items: center;
  flex-wrap: nowrap;
  width: 100%;
  justify-content: center;
}

// 处方输入框基础样式
.prescription-input {
  height: 32px;
  font-size: var(--exr-font-body, 11px);
  text-align: center;
  
  // 所有输入框内容居中
  :deep(.ant-input),
  :deep(.ant-input-number-input),
  :deep(input) {
    text-align: center !important;
  }
  
  // 选择器文本居中（与表内下拉高度一致）
  :deep(.ant-select-selector) {
    text-align: center;
    
    .ant-select-selection-item,
    .ant-select-selection-placeholder {
      text-align: center;
      line-height: calc(var(--exr-select-h, 32px) - 2px);
    }
  }
}

// 球镜输入框：在球镜列中，与+/-按钮一起显示
.prescription-input-group .prescription-spherical {
  flex: 1;
  min-width: 0;
}

// 电脑验光检查表格中的球镜和柱镜输入框宽度调整
.refraction-table {
  // 增加球镜输入框宽度（通过增加flex值，让球镜输入框占用更多空间）
  .prescription-input-group .prescription-spherical {
    flex: 1.5; // 从默认的flex: 1增加到1.5，让球镜输入框更宽
    min-width: 0;
  }
  
  // 电脑验光检查表格中的球镜输入框：隐藏箭头并居中
  .prescription-spherical {
    &.ant-input-number {
      height: 32px !important;
      border: 1px solid #d9d9d9 !important;
      border-radius: 2px !important;
      background-color: #fff !important;
      
      :deep(.ant-input-number-handler-wrap) {
        display: none !important;
      }
      
      :deep(.ant-input-number-input-wrap) {
        padding-right: 0 !important;
        padding-left: 0 !important;
        height: 100% !important;
      }
      
      :deep(.ant-input-number-input) {
        text-align: center !important;
        height: 32px !important;
        line-height: 32px !important;
        font-size: var(--exr-font-body, 11px) !important;
        padding: 0 11px !important;
        border: none !important;
        background: transparent !important;
      }
      
      &:hover {
        border-color: #40a9ff !important;
      }
      
      &:focus,
      &.ant-input-number-focused {
        border-color: #40a9ff !important;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
        outline: 0 !important;
      }
    }
  }
  
  // 电脑验光检查表格中的柱镜和轴位输入框：统一样式
  .prescription-cylindrical,
  .prescription-axis {
    :deep(.ant-input) {
      height: 32px !important;
      line-height: 32px !important;
      font-size: var(--exr-font-body, 11px) !important;
      padding: 0 11px !important;
      text-align: center !important;
      border: 1px solid #d9d9d9 !important;
      border-radius: 2px !important;
      background-color: #fff !important;
      
      &:hover {
        border-color: #40a9ff !important;
      }
      
      &:focus {
        border-color: #40a9ff !important;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
        outline: 0 !important;
      }
    }
  }
  
  // 统一"输入框内文字"（值/placeholder）的字号、颜色、水平&垂直居中
  // 注意：这里不要再对 ant-input-number 用 flex + line-height: 1，否则会导致球镜与柱镜/轴位观感不一致
  :deep(.ant-input),
  :deep(.ant-input-number-input) {
    height: 32px !important;
    line-height: 32px !important;
    font-size: var(--exr-font-body, 11px) !important;
    font-weight: 400 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    font-variant-numeric: normal !important;
    -webkit-font-smoothing: antialiased !important;
    -moz-osx-font-smoothing: grayscale !important;
    color: rgba(0, 0, 0, 0.85) !important;
    padding: 0 11px !important;
    text-align: center !important;
    letter-spacing: normal !important;
  }

  // a-input-number 组件本身也要统一样式
  :deep(.ant-input-number) {
    font-weight: 400 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
  }

  :deep(.ant-input::placeholder),
  :deep(.ant-input-number-input::placeholder) {
    color: transparent !important;
    opacity: 0 !important;
  }
}

// 柱镜输入框：在柱镜列中单独显示，填满单元格（全局默认样式）
.prescription-cylindrical {
  width: 100%;
  
  :deep(.ant-input) {
    height: 32px !important;
    line-height: 32px !important;
    text-align: center !important;
    font-size: var(--exr-font-body, 11px) !important;
    padding: 0 11px !important;
  }
}

// 轴位输入框：在轴位列中单独显示，填满单元格
.prescription-axis {
  width: 100%;
  
  :deep(.ant-input) {
    height: 32px !important;
    line-height: 32px !important;
    text-align: center !important;
    font-size: var(--exr-font-body, 11px) !important;
    padding: 0 11px !important;
  }
}

// 瞳孔直径输入框：在PS列中单独显示
.prescription-pupil {
  width: 100%;
  height: 32px;
  
  :deep(.ant-input) {
    height: 32px !important;
    line-height: 32px;
    text-align: center !important;
    font-size: var(--exr-font-body, 11px);
  }
}

// 旧镜光度输入框样式调整
.old-glasses-cell {
  // 球镜/柱镜/轴位与类型选择：与 --exr-select-h 一致
  .prescription-input-group .prescription-input,
  .ant-input-number {
    height: 32px !important;
    text-align: center;

    :deep(.ant-input),
    :deep(.ant-input-number-input) {
      height: 32px !important;
      line-height: 32px;
      text-align: center;
    }

    :deep(input) {
      text-align: center;
    }
  }

  .glasses-type-select {
    height: var(--exr-select-h, 32px) !important;
    text-align: center;

    :deep(.ant-select-selector) {
      height: var(--exr-select-h, 32px) !important;
      min-height: var(--exr-select-h, 32px) !important;
      line-height: calc(var(--exr-select-h, 32px) - 2px);
      padding-right: 7px !important;
      padding-left: 5px !important;
    }

    :deep(.ant-select-arrow) {
      top: 50% !important;
      transform: translateY(-50%) !important;
      right: 2px !important;
      margin-top: 0 !important;
    }

    :deep(.ant-select-clear) {
      top: 50% !important;
      transform: translateY(-50%) !important;
      right: 11px !important;
    }

    :deep(.ant-select-selection-item),
    :deep(.ant-select-selection-placeholder) {
      text-align: center;
      line-height: calc(var(--exr-select-h, 32px) - 2px) !important;
      font-size: var(--exr-font-table, 12px);
    }

    :deep(.ant-select-selection-placeholder) {
      font-size: var(--exr-font-body, 11px);
      color: #bfbfbf;
    }
  }
  
  // 按3:3:2比例分配输入框宽度
  .prescription-input-group {
    gap: 4px;
    
    .prescription-spherical {
      flex: 3; // 球镜占3份
      min-width: 0;
      max-width: 100%;
    }
    
    .prescription-cylindrical {
      flex: 3; // 柱镜占3份
      min-width: 0;
      max-width: 100%;
    }
    
    .prescription-axis {
      flex: 2; // 轴位占2份
      min-width: 0;
      max-width: 100%;
      
      // 取消轴位输入框的内边距，确保三位数完整显示
      :deep(.ant-input-number-input) {
        padding-left: 4px !important;
        padding-right: 4px !important;
      }
    }
  }
  
  // 隐藏数字输入框的上下箭头
  .ant-input-number {
    :deep(.ant-input-number-handler-wrap) {
      display: none !important;
    }
    
    :deep(.ant-input-number-input-wrap) {
      padding-right: 4px !important;
    }
  }
}

/* ADD/视力值等：仅常规主觉表（非 exam-sheet），与处方输入 32px 同高；勿用 line-height:1 以免占位灰字偏上 */
.refraction-table.subjective-table .vision-value-select {
  flex: 1;
  min-width: 0;
  text-align: center;
  height: 32px;

  :deep(.ant-select-selector) {
    text-align: center;
    height: 32px !important;
    min-height: 32px !important;
    display: flex !important;
    align-items: center !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  :deep(.ant-select-selection-item),
  :deep(.ant-select-selection-placeholder) {
    text-align: center;
    line-height: 32px !important;
    margin: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
}

/* 报告式 exam-sheet 内 ADD：高度由 exam-sheet.css 控制，行高与框一致以垂直居中 */
.exam-sheet .vision-value-select {
  :deep(.ant-select-selector) {
    display: flex !important;
    align-items: center !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  :deep(.ant-select-selection-item),
  :deep(.ant-select-selection-placeholder) {
    line-height: var(--exr-select-h, 22px) !important;
    margin: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
}

/* 主导眼：右眼 / 左眼切换（再点已选项可取消） */
.dominant-eye-toggle-group {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  flex-wrap: nowrap;
}

.dominant-eye-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: calc(var(--exr-select-h, 32px) - 8px);
  min-height: calc(var(--exr-select-h, 32px) - 8px);
  min-width: 32px;
  padding: 0 5px;
  margin: 0;
  font-size: max(9px, calc(var(--exr-font-body, 11px) - 1px));
  font-weight: 500;
  line-height: normal;
  text-align: center;
  color: rgba(0, 0, 0, 0.85);
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;

  &:hover {
    border-color: #40a9ff;
    color: #1890ff;
  }

  &--active {
    border-color: #224b96;
    background: rgba(34, 75, 150, 0.1);
    color: #224b96;
    font-weight: 600;
  }

  &:focus-visible {
    outline: 2px solid #40a9ff;
    outline-offset: 1px;
  }
}

// +/-按钮容器（垂直布局）
.vision-sign-buttons {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
  height: 32px; // 与输入框高度对齐（Ant Design 默认输入框高度）
  align-self: stretch; // 确保与输入框高度一致
}

// 独立的+/-按钮样式（按照图片设计）
.vision-sign-btn {
  width: 28px;
  flex: 1; // 平均分配高度，适应容器高度
  min-height: 0; // 允许flex收缩
  padding: 0;
  margin: 0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 300; // 减细图标，从600改为300
  transition: all 0.3s;
  outline: none;
  line-height: 1;
  text-align: center;
  box-sizing: border-box;
  
  // 确保符号在水平和垂直方向完全居中
  &::before {
    content: '';
    flex: 0 0 0;
  }
  
  &:hover {
    border-color: #40a9ff;
  }
  
  &:active {
    transform: scale(0.95);
  }
}

// 确保"-"按钮图标垂直居中
.vision-minus-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  
  // 使用伪元素来确保垂直居中
  &::after {
    content: '';
    display: inline-block;
    vertical-align: middle;
    height: 100%;
  }
}

.vision-plus-btn {
  color: #666;
  background: #fff;
  
  &.active {
    background: #1890ff;
    color: #fff;
    border-color: #1890ff;
  }
}

.vision-minus-btn {
  color: #666;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  
  // 确保"-"符号垂直居中
  // 由于按钮已经使用 flexbox，只需确保内容对齐
  & {
    align-items: center;
    justify-content: center;
  }
  
  // 微调"-"符号的显示，确保完全垂直居中
  & > * {
    line-height: 1;
    display: inline-block;
    vertical-align: middle;
  }
  
  &.active {
    background: #1890ff;
    color: #fff;
    border-color: #1890ff;
  }
}

.vision-level-select {
  width: 50px;
  flex-shrink: 0;
  
  :deep(.ant-select-selector) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: 0 !important;
    padding-left: 0 !important;
    position: relative;
    font-size: var(--exr-font-body, 11px);
  }
  
  :deep(.ant-select-selection-item) {
    text-align: center;
    padding: 0 !important;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: var(--exr-font-body, 11px);
  }
  
  :deep(.ant-select-selection-placeholder) {
    display: none !important;
  }
  
  :deep(.ant-select-arrow) {
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    right: auto !important;
    margin-top: 0 !important;
    margin-left: 0 !important;
  }
  
  :deep(.ant-select-clear) {
    top: 50%;
    transform: translateY(-50%);
    right: 8px;
  }
}

// 视力显示中的上标间距
.vision-table sup {
  margin-left: 2px;
  font-size: 0.85em;
}

// 视力符号字体稍大
.vision-table sup .vision-sign {
  font-size: 1.1em;
}

@media print {
  .routine-exam-style-two {
    gap: 0;
  }

  .section-block {
    gap: 3mm;
  }
}

.routine-report-by-eye,
.objective-report-by-eye,
.subjective-report-by-eye,
.vision-report-by-eye {
  line-height: 1.1;

  &:not(.exam-sheet) th,
  &:not(.exam-sheet) td {
    border: 1px solid #b0d4e8;
    text-align: center;
    vertical-align: middle;
    font-size: 10px;
    padding: 2px 3px;
  }

  &:not(.exam-sheet) thead th {
    background: #f0f9fd;
    font-weight: 600;
    font-size: 9px;
    padding: 2px 2px;
    line-height: 1.15;
  }

  /* 视力/客观等：侧栏仍在 thead（非 exam-sheet 布局） */
  &:not(.exam-sheet) thead th.report-section-side-title {
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

  &:not(.exam-sheet) tbody td {
    font-size: 10px;
    line-height: 1.1;
  }
}

/* exam-sheet 视力表：跨行「旧镜类型」列；下拉宽度按文案收紧、格内居中 */
.vision-report-by-eye.exam-sheet.vision-table .vision-glasses-type-cell {
  vertical-align: middle;
}

.vision-report-by-eye.exam-sheet.vision-table .vision-glasses-type-cell .cell-field {
  min-height: 58px;
  align-self: stretch;
  display: flex;
  justify-content: center;
  align-items: center;
}

.vision-report-by-eye.exam-sheet.vision-table .vision-glasses-type-cell .cell-field :deep(.ant-select) {
  width: auto !important;
  max-width: 100px !important;
  min-width: 76px;
  margin-left: auto;
  margin-right: auto;
}

.vision-report-by-eye.exam-sheet.vision-table .vision-glasses-type-cell .glasses-type-select {
  :deep(.ant-select-selector) {
    display: flex !important;
    align-items: center !important;
    min-height: 26px !important;
    height: 26px !important;
    padding: 0 6px 0 4px !important;
    border-radius: 4px !important;
    font-size: var(--exr-font-body, 11px);
  }

  :deep(.ant-select-selection-item),
  :deep(.ant-select-selection-placeholder) {
    font-size: var(--exr-font-body, 11px);
    line-height: 26px !important;
  }

  :deep(.ant-select-selection-placeholder) {
    color: #bfbfbf;
    font-weight: 400;
    font-size: 11px;
    line-height: 26px !important;
  }

  :deep(.ant-select-arrow) {
    top: 50% !important;
    transform: translateY(-50%) !important;
    right: 2px !important;
    margin-top: 0 !important;
  }

  :deep(.ant-select-clear) {
    top: 50% !important;
    transform: translateY(-50%) !important;
    right: 9px !important;
  }
}

.refraction-table.subjective-table thead th.report-section-side-title {
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

.cell-computed {
  background: rgba(82, 196, 26, 0.08);
  font-weight: 500;
}

.cell-muted {
  color: #8c8c8c;
  background: #fafafa;
}

.pd-cell-report {
  text-align: center;
  white-space: nowrap;
  line-height: 1.1;

  .pd-label {
    margin-right: 4px;
    font-size: 10px;
  }

  .pd-unit {
    margin-left: 2px;
    font-size: 10px;
  }
}

/* 非报告式视力表：旧镜行末格瞳距输入，勿 width:100% 拉满 */
.vision-table:not(.exam-sheet) .old-glasses-cell .pd-input-number {
  width: 5.5ch !important;
  min-width: 4.5ch !important;
  max-width: 8ch !important;
}
</style>

<style lang="scss">
/* 旧镜类型下拉：与 ADD 一致，选项居中，面板宽度略宽于触发条、并限制最大宽度 */
.glasses-type-dropdown.ant-select-dropdown {
  padding: 6px 0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  min-width: 112px !important;
  max-width: 168px !important;

  .ant-select-item {
    font-size: var(--app-select-font, 13px) !important;
    line-height: var(--app-select-line, 30px) !important;
    padding: 4px 8px !important;
    min-height: var(--app-select-h, 32px) !important;
    justify-content: center !important;
    text-align: center;
  }

  .ant-select-item-option-content {
    white-space: nowrap;
    text-align: center;
    width: 100%;
  }
}

/* ADD 近附加：下拉略宽于触发条即可，避免比格子里「框」突出太多 */
.add-power-dropdown.ant-select-dropdown {
  min-width: 128px !important;
  max-width: 156px !important;

  .ant-select-item {
    justify-content: center !important;
    text-align: center;
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
}
</style>
