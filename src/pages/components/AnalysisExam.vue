<template>
  <div class="analysis-exam-container">
    <div class="analysis-content">
      <!-- 标题已由 PatientStyleTwo 统一显示，这里隐藏内部标题 -->
      <!-- <div class="analysis-header">
        <h3>结果分析</h3>
        <p class="analysis-description">基于检查数据进行智能分析和案例匹配</p>
      </div> -->
      
      <!-- 匹配参数设置区域 -->
      <div class="params-section">
        <div class="params-card">
          <div class="card-header">
            <div class="card-title">
              <span class="title-icon">⚙️</span>
              <span>匹配参数设置</span>
            </div>
            <div class="card-subtitle" v-if="currentPatientData && dataAvailability.hasData">
              中心值基于当前患者数据：左眼(AL:{{ currentPatientData.left?.al || '-' }}, K1:{{ currentPatientData.left?.k1 || '-' }}) 
              右眼(AL:{{ currentPatientData.right?.al || '-' }}, K1:{{ currentPatientData.right?.k1 || '-' }})
            </div>
            <div class="card-subtitle warning" v-else-if="currentPatientData && !dataAvailability.hasData">
              <span style="color: #ff4d4f;">⚠️ {{ dataAvailability.message }}</span>
            </div>
          </div>
          
          <div class="params-container">
            <!-- 第一行：眼轴长度 + 角膜曲率K1 -->
            <div class="param-row">
              <div class="param-group">
                <div class="param-group-header">
                  <div class="param-group-title">
                    <span class="param-icon">📏</span>
                    <span>眼轴长度</span>
                  </div>
                  <div class="param-eye-labels">
                    <span class="eye-label">右眼</span>
                    <span class="eye-label">左眼</span>
                  </div>
                </div>
                <div class="param-rows">
                  <div class="param-row-item">
                    <label class="param-row-label">中心值</label>
                    <div class="param-row-inputs">
                      <div class="input-with-unit">
                        <a-input-number 
                          v-if="currentPatientData?.right?.al !== null && currentPatientData?.right?.al !== undefined"
                          :value="currentPatientData?.right?.al" 
                          :min="20" 
                          :max="30" 
                          :step="0.1" 
                          size="small"
                          placeholder="自动"
                          disabled
                        />
                        <span v-else class="data-missing-text">数据缺失</span>
                        <span class="param-unit">mm</span>
                      </div>
                      <div class="input-with-unit">
                        <a-input-number 
                          v-if="currentPatientData?.left?.al !== null && currentPatientData?.left?.al !== undefined"
                          :value="currentPatientData?.left?.al" 
                          :min="20" 
                          :max="30" 
                          :step="0.1" 
                          size="small"
                          placeholder="自动"
                          disabled
                        />
                        <span v-else class="data-missing-text">数据缺失</span>
                        <span class="param-unit">mm</span>
                      </div>
                    </div>
                  </div>
                  <div class="param-row-item">
                    <label class="param-row-label">容差</label>
                    <div class="param-row-inputs">
                      <div class="input-with-unit">
                        <a-input-number 
                          v-model:value="matchParams.al_tol" 
                          :min="0" 
                          :max="2" 
                          :step="0.1" 
                          size="small"
                          placeholder="±0.5"
                        />
                        <span class="param-unit">mm</span>
                      </div>
                      <div class="input-with-unit">
                        <a-input-number 
                          v-model:value="matchParams.al_tol" 
                          :min="0" 
                          :max="2" 
                          :step="0.1" 
                          size="small"
                          placeholder="±0.5"
                        />
                        <span class="param-unit">mm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="param-group">
                <div class="param-group-header">
                  <div class="param-group-title">
                    <span class="param-icon">🔍</span>
                    <span>角膜曲率K1</span>
                  </div>
                  <div class="param-eye-labels">
                    <span class="eye-label">右眼</span>
                    <span class="eye-label">左眼</span>
                  </div>
                </div>
                <div class="param-rows">
                  <div class="param-row-item">
                    <label class="param-row-label">中心值</label>
                    <div class="param-row-inputs">
                      <div class="input-with-unit">
                        <a-input-number 
                          v-if="currentPatientData?.right?.k1 !== null && currentPatientData?.right?.k1 !== undefined"
                          :value="currentPatientData?.right?.k1" 
                          :min="35" 
                          :max="50" 
                          :step="0.1" 
                          size="small"
                          placeholder="自动"
                          disabled
                        />
                        <span v-else class="data-missing-text">数据缺失</span>
                        <span class="param-unit">D</span>
                      </div>
                      <div class="input-with-unit">
                        <a-input-number 
                          v-if="currentPatientData?.left?.k1 !== null && currentPatientData?.left?.k1 !== undefined"
                          :value="currentPatientData?.left?.k1" 
                          :min="35" 
                          :max="50" 
                          :step="0.1" 
                          size="small"
                          placeholder="自动"
                          disabled
                        />
                        <span v-else class="data-missing-text">数据缺失</span>
                        <span class="param-unit">D</span>
                      </div>
                    </div>
                  </div>
                  <div class="param-row-item">
                    <label class="param-row-label">容差</label>
                    <div class="param-row-inputs">
                      <div class="input-with-unit">
                        <a-input-number 
                          v-model:value="matchParams.k1_tol" 
                          :min="0" 
                          :max="5" 
                          :step="0.1" 
                          size="small"
                          placeholder="±0.5"
                        />
                        <span class="param-unit">D</span>
                      </div>
                      <div class="input-with-unit">
                        <a-input-number 
                          v-model:value="matchParams.k1_tol" 
                          :min="0" 
                          :max="5" 
                          :step="0.1" 
                          size="small"
                          placeholder="±0.5"
                        />
                        <span class="param-unit">D</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 第二行：角膜散光 + 其他参数 -->
            <div class="param-row">
              <div class="param-group">
                <div class="param-group-header">
                  <div class="param-group-title">
                    <span class="param-icon">🌀</span>
                    <span>角膜散光</span>
                  </div>
                  <div class="param-eye-labels">
                    <span class="eye-label">右眼</span>
                    <span class="eye-label">左眼</span>
                  </div>
                </div>
                <div class="param-rows">
                  <div class="param-row-item">
                    <label class="param-row-label">中心值</label>
                    <div class="param-row-inputs">
                      <div class="input-with-unit">
                        <a-input-number 
                          v-if="currentPatientData?.right?.ast !== null && currentPatientData?.right?.ast !== undefined"
                          :value="currentPatientData?.right?.ast" 
                          :min="0" 
                          :max="5" 
                          :step="0.1" 
                          size="small"
                          placeholder="自动"
                          disabled
                        />
                        <span v-else class="data-missing-text">数据缺失</span>
                        <span class="param-unit">D</span>
                      </div>
                      <div class="input-with-unit">
                        <a-input-number 
                          v-if="currentPatientData?.left?.ast !== null && currentPatientData?.left?.ast !== undefined"
                          :value="currentPatientData?.left?.ast" 
                          :min="0" 
                          :max="5" 
                          :step="0.1" 
                          size="small"
                          placeholder="自动"
                          disabled
                        />
                        <span v-else class="data-missing-text">数据缺失</span>
                        <span class="param-unit">D</span>
                      </div>
                    </div>
                  </div>
                  <div class="param-row-item">
                    <label class="param-row-label">容差</label>
                    <div class="param-row-inputs">
                      <div class="input-with-unit">
                        <a-input-number 
                          v-model:value="matchParams.ast_tol" 
                          :min="0" 
                          :max="2" 
                          :step="0.1" 
                          size="small"
                          placeholder="±0.5"
                        />
                        <span class="param-unit">D</span>
                      </div>
                      <div class="input-with-unit">
                        <a-input-number 
                          v-model:value="matchParams.ast_tol" 
                          :min="0" 
                          :max="2" 
                          :step="0.1" 
                          size="small"
                          placeholder="±0.5"
                        />
                        <span class="param-unit">D</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="param-group">
                <div class="param-group-title">
                  <span class="param-icon">👤</span>
                  <span>其他参数</span>
                </div>
                <div class="param-other">
                  <div class="param-field">
                    <label>年龄容差</label>
                    <div class="input-with-unit">
                      <a-input-number 
                        v-model:value="matchParams.age_months_tolerance" 
                        :min="1" 
                        :max="24" 
                        size="small"
                        placeholder="3"
                      />
                      <span class="param-unit">月</span>
                    </div>
                  </div>
                  <div class="param-field">
                    <label>结果数量</label>
                    <div class="input-with-unit">
                      <a-input-number 
                        v-model:value="matchParams.limit" 
                        :min="1" 
                        :max="10000" 
                        size="small"
                        placeholder="不限制"
                      />
                      <span class="param-unit">条</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 数据缺失提示 -->
            <div v-if="!dataAvailability.hasData" class="data-missing-warning">
              <div class="warning-content">
                <span class="warning-icon">⚠️</span>
                <div class="warning-text">
                  <div class="warning-title">数据不完整</div>
                  <div class="warning-message">{{ dataAvailability.message }}</div>
                  <div class="warning-tip">请先完善当前检查记录的生物测量数据（眼轴长度和角膜曲率K1）</div>
                </div>
              </div>
            </div>
            
            <!-- 第三行：操作按钮 -->
            <div class="param-row">
              <a-button 
                type="primary" 
                size="large"
                @click="fetchMatchCases" 
                :loading="isLoading"
                :disabled="!dataAvailability.hasData"
                class="search-btn"
                :class="{ 'disabled': !dataAvailability.hasData }"
              >
                <span class="btn-icon">🔍</span>
                <span>查找相似案例</span>
              </a-button>
              <a-button 
                size="large"
                @click="resetParams"
                :disabled="!dataAvailability.hasData"
                class="reset-btn"
                :class="{ 'disabled': !dataAvailability.hasData }"
              >
                <span class="btn-icon">🔄</span>
                <span>重置参数</span>
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分析结果区域 -->
      <div class="results-section">
        <!-- 分页导航 -->
        <div class="pagination-nav" v-if="analysisStats && analysisStats.totalCases > 0">
          <div class="pagination-tabs">
            <div 
              class="pagination-tab" 
              :class="{ active: currentPage === 1 }"
              @click="changePage(1)"
            >
              <span class="tab-icon">📊</span>
              <span>治疗手段统计</span>
            </div>
            <div 
              class="pagination-tab" 
              :class="{ active: currentPage === 2 }"
              @click="changePage(2)"
            >
              <span class="tab-icon">📈</span>
              <span>眼轴变化分析</span>
            </div>
          </div>
        </div>

        <!-- 第一页：匹配案例结果 -->
        <div class="stats-card" v-if="analysisStats && analysisStats.totalCases > 0 && currentPage === 1">
            <div class="card-header">
              <div class="card-title">
                <span class="title-icon">📊</span>
                <span>相似案例匹配结果</span>
              </div>
              <div class="card-subtitle">基于{{ analysisStats.totalCases }}个相似案例的治疗手段分析</div>
            </div>
            
            <!-- 治疗手段选择率 -->
            <div class="stats-section">
              <div class="stats-section-title">治疗手段选择率</div>
              <div class="stats-grid horizontal">
                <div class="stat-card" :class="{ 'high-rate': analysisStats.atropineRate > 50 }">
                  <div class="stat-icon">💊</div>
                  <div class="stat-content">
                    <div class="stat-title">阿托品</div>
                    <div class="stat-value">{{ analysisStats.atropineRate }}%</div>
                    <div class="stat-detail">{{ analysisStats.atropineCount }}/{{ analysisStats.totalCases }}</div>
                  </div>
                </div>
                
                <div class="stat-card" :class="{ 'high-rate': analysisStats.glassesRate > 50 }">
                  <div class="stat-icon">👓</div>
                  <div class="stat-content">
                    <div class="stat-title">配镜</div>
                    <div class="stat-value">{{ analysisStats.glassesRate }}%</div>
                    <div class="stat-detail">{{ analysisStats.glassesCount }}/{{ analysisStats.totalCases }}</div>
                  </div>
                </div>
                
                <div class="stat-card" :class="{ 'high-rate': analysisStats.phototherapyRate > 50 }">
                  <div class="stat-icon">💡</div>
                  <div class="stat-content">
                    <div class="stat-title">低强度红光</div>
                    <div class="stat-value">{{ analysisStats.phototherapyRate }}%</div>
                    <div class="stat-detail">{{ analysisStats.phototherapyCount }}/{{ analysisStats.totalCases }}</div>
                  </div>
                </div>
                
                <div class="stat-card" :class="{ 'high-rate': analysisStats.physiotherapyRate > 50 }">
                  <div class="stat-icon">🏥</div>
                  <div class="stat-content">
                    <div class="stat-title">理疗</div>
                    <div class="stat-value">{{ analysisStats.physiotherapyRate }}%</div>
                    <div class="stat-detail">{{ analysisStats.physiotherapyCount }}/{{ analysisStats.totalCases }}</div>
                  </div>
                </div>
                
                <div class="stat-card" :class="{ 'high-rate': analysisStats.visualTrainingRate > 50 }">
                  <div class="stat-icon">🎯</div>
                  <div class="stat-content">
                    <div class="stat-title">视觉训练</div>
                    <div class="stat-value">{{ analysisStats.visualTrainingRate }}%</div>
                    <div class="stat-detail">{{ analysisStats.visualTrainingCount }}/{{ analysisStats.totalCases }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 详细分类统计 -->
            <div class="stats-section" v-if="analysisStats.glassesBrandsTop3.length > 0 || analysisStats.phototherapyGearsTop3.length > 0">
              <div class="stats-section-title">详细分类统计</div>
              
              <div class="detailed-stats-row">
                <!-- 配镜品牌Top3 -->
                <div class="top3-section" v-if="analysisStats.glassesBrandsTop3.length > 0">
                  <div class="top3-title">配镜品牌Top3</div>
                  <div class="top3-list">
                    <div v-for="(brand, index) in analysisStats.glassesBrandsTop3" :key="index" class="top3-item">
                      <span class="top3-rank">#{{ index + 1 }}</span>
                      <span class="top3-name">{{ brand.name }}</span>
                      <span class="top3-rate">{{ brand.rate }}%</span>
                      <span class="top3-count">({{ brand.count }}例)</span>
                    </div>
                  </div>
                </div>
                
                <!-- 低强度红光Top3 -->
                <div class="top3-section" v-if="analysisStats.phototherapyGearsTop3.length > 0">
                  <div class="top3-title">低强度红光Top3</div>
                  <div class="top3-list">
                    <div v-for="(gear, index) in analysisStats.phototherapyGearsTop3" :key="index" class="top3-item">
                      <span class="top3-rank">#{{ index + 1 }}</span>
                      <span class="top3-name">{{ gear.name }}</span>
                      <span class="top3-rate">{{ gear.rate }}%</span>
                      <span class="top3-count">({{ gear.count }}例)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 复查周期分布和年龄分布 -->
            <div class="stats-section">
              <div class="distribution-row">
                <!-- 复查周期分布 -->
                <div class="distribution-item" v-if="analysisStats && analysisStats.reviewCycles && Object.keys(analysisStats.reviewCycles).length > 0">
                  <div class="stats-section-title">复查周期分布</div>
                  <div class="cycle-chart">
                    <div 
                      v-for="(cycle, months) in analysisStats.reviewCycles" 
                      :key="months"
                      class="cycle-bar-item"
                    >
                      <div class="cycle-label">{{ months }}个月</div>
                      <div class="cycle-bar">
                        <div 
                          class="cycle-fill" 
                          :style="{ width: cycle.percentage + '%' }"
                        ></div>
                      </div>
                      <div class="cycle-count">{{ cycle.count }}例 ({{ cycle.percentage }}%)</div>
                    </div>
                  </div>
                </div>
                
                <!-- 年龄分布 -->
                <div class="distribution-item">
                  <div class="stats-section-title">年龄分布</div>
                  <div class="age-info">
                    <div class="age-item">
                      <span class="age-label">平均年龄差</span>
                      <span class="age-value">{{ analysisStats.avgAgeDiff }}天</span>
                    </div>
                    <div class="age-item">
                      <span class="age-label">年龄差范围</span>
                      <span class="age-value">{{ analysisStats.minAgeDiff }} - {{ analysisStats.maxAgeDiff }}天</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 详细案例列表 - 暂时隐藏 -->
            <!--
            <div class="stats-section">
              <div class="stats-section-title">详细案例列表</div>
              <div class="case-list">
                <div v-for="(caseItem, index) in paginatedResults" :key="index" class="case-item">
                  <div class="case-header">
                    <span class="case-eye">{{ caseItem.眼别 }}</span>
                    <span class="case-id">患者ID: {{ caseItem.患者id }}</span>
                    <span class="case-date">{{ caseItem.检查日期 }}</span>
                  </div>
                  <div class="case-details">
                    <div class="case-treatments">
                      <div class="treatment-detail" v-for="(value, key) in caseItem.治疗手段详情" :key="key">
                        <span class="treatment-key">{{ key }}:</span>
                        <span class="treatment-value" :class="{ 'has-treatment': value !== '否' && value !== '无' }">{{ value }}</span>
                      </div>
                    </div>
                    <div class="case-meta">
                      <span class="review-cycle">复查周期: {{ caseItem['复查间隔(月)'] }}个月</span>
                      <span class="age-diff">年龄差: {{ caseItem['年龄差(天)'] }}天</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            -->
          </div>

          <!-- 第二页：眼轴变化分析 -->
          <div class="stats-card" v-if="currentPage === 2">
            <!-- 如果没有匹配结果 -->
            <div v-if="!backendResponseData || !backendResponseData.allResults || backendResponseData.allResults.length === 0" class="no-results-card">
              <div class="no-results-content">
                <div class="no-results-icon">📊</div>
                <div class="no-results-title">暂无匹配结果</div>
                <div class="no-results-tip">请先点击"查找相似案例"进行匹配</div>
              </div>
            </div>
            
            <!-- 如果有匹配结果 -->
            <template v-else-if="backendResponseData.allResults.length > 0">
              <div class="card-header">
                <div class="card-title">
                  <span class="title-icon">📈</span>
                  <span>眼轴变化分析</span>
                </div>
                <div class="card-subtitle">基于{{ analysisStats?.totalCases || backendResponseData.allResults.length }}个相似案例的治疗效果分析</div>
              </div>
              
              <!-- 如果眼轴变化分析为空 -->
              <div v-if="axialLengthAnalysis.length === 0" class="no-axial-data-card">
                <div class="no-results-content">
                  <div class="no-results-icon">📈</div>
                  <div class="no-results-title">暂无眼轴变化追踪数据</div>
                  <div class="no-results-tip">匹配的案例中没有包含眼轴变化追踪数据（需要初始检查和后续复查记录）</div>
                  <div class="no-results-detail" style="margin-top: 12px; font-size: 12px; color: #8c8c8c;">
                    当前匹配结果数：{{ backendResponseData.allResults.length }} 个案例
                  </div>
                </div>
              </div>
              
              <!-- 正常显示眼轴变化分析 -->
              <template v-else>
                <!-- 治疗方案组合效果对比 -->
                <div class="stats-section">
                  <div class="stats-section-header">
                    <div class="stats-section-title">治疗方案组合效果对比</div>
                    <div class="grouping-options">
                      <a-radio-group v-model:value="groupingMode" size="small" button-style="solid">
                        <a-radio-button value="type">按方案类型</a-radio-button>
                        <a-radio-button value="brand">按品牌</a-radio-button>
                      </a-radio-group>
                      <a-checkbox v-model:checked="showNoTreatment" style="margin-left: 12px;">
                        显示无治疗
                      </a-checkbox>
                      <a-select 
                        v-model:value="sortBy" 
                        size="small" 
                        style="width: 140px; margin-left: 12px;"
                      >
                        <a-select-option value="monthlyChange">月变化 ↑</a-select-option>
                        <a-select-option value="monthlyChangeDesc">月变化 ↓</a-select-option>
                        <a-select-option value="caseCount">案例数 ↑</a-select-option>
                        <a-select-option value="caseCountDesc">案例数 ↓</a-select-option>
                        <a-select-option value="initialAL">初始眼轴 ↑</a-select-option>
                        <a-select-option value="initialALDesc">初始眼轴 ↓</a-select-option>
                      </a-select>
                    </div>
                  </div>
                  <div class="treatment-comparison">
                    <div v-for="(group, index) in axialLengthAnalysis" :key="index" class="treatment-group">
                  <div class="group-header" @click="toggleGroupExpansion(index)">
                    <div class="group-count">{{ group.caseCount }}例</div>
                    <div class="group-title">{{ group.treatment }}</div>
                    <div class="expand-icon" :class="{ expanded: expandedGroups.has(index) }">
                      <span>▼</span>
                    </div>
                  </div>
                  <!-- 样本量提示 -->
                  <div v-if="group.caseCount < 10" class="sample-size-warning">
                    <span class="warning-icon">⚠️</span>
                    <span class="warning-text">样本量太少可能存在偏倚，建议酌情采纳</span>
                  </div>
                  <div class="group-stats">
                    <div class="stat-item">
                      <span class="stat-label">平均初始眼轴</span>
                      <span class="stat-value">{{ group.avgInitialAL.toFixed(2) }}mm</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">平均最终眼轴</span>
                      <span class="stat-value">{{ group.avgFinalAL.toFixed(2) }}mm</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">平均月化变化</span>
                      <span class="stat-value" :style="{ color: getChangeColor(group.avgChange) }">
                        {{ formatALChange(group.avgChange) }}
                      </span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">平均随访时间</span>
                      <span class="stat-value">{{ group.avgFollowUpMonths.toFixed(1) }}个月</span>
                    </div>
                  </div>
                  <div class="group-chart">
                    <div class="chart-bar">
                      <div class="bar-segment initial" :style="{ width: '50%' }">
                        <span class="bar-label">初始</span>
                        <span class="bar-value">{{ group.avgInitialAL.toFixed(2) }}mm</span>
                      </div>
                      <div class="bar-segment final" :style="{ width: '50%' }">
                        <span class="bar-label">最终</span>
                        <span class="bar-value">{{ group.avgFinalAL.toFixed(2) }}mm</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 展开的详细案例眼轴变化 -->
                  <div v-if="expandedGroups.has(index)" class="group-details">
                    <div class="details-title">详细案例眼轴变化</div>
                    <div class="axial-cases">
                      <div v-for="(caseItem, caseIndex) in group.cases" :key="caseIndex" class="axial-case">
                        <div class="case-info">
                          <span class="case-patient">患者{{ caseItem.patientId }} - {{ caseItem.eye }}</span>
                          <span class="case-months">{{ caseItem.followUpMonths }}个月随访</span>
                        </div>
                        <div class="case-axial-timeline">
                          <!-- 初始检查 -->
                          <div class="timeline-item initial">
                            <div class="timeline-date">{{ formatDate(caseItem.initialDate) }}</div>
                            <div class="timeline-al">{{ caseItem.initialAL.toFixed(2) }}mm</div>
                            <div class="timeline-label">初始</div>
                          </div>
                          
                          <!-- 复查记录 -->
                          <template v-for="(record, recordIndex) in caseItem.followUpRecords" :key="recordIndex">
                            <!-- 箭头 -->
                            <div class="timeline-arrow">
                              <div class="arrow-line"></div>
                              <div class="arrow-head">→</div>
                            </div>
                            
                            <!-- 复查记录卡片 -->
                            <div class="timeline-item followup">
                              <div class="timeline-date">{{ formatDate(record.date) }}</div>
                              <div class="timeline-al">{{ record.al.toFixed(2) }}mm</div>
                              <div class="timeline-change" :style="{ color: getChangeColor(record.al - caseItem.initialAL) }">
                                {{ formatALChange((record.al - caseItem.initialAL) / record.monthsFromInitial) }}
                              </div>
                              <div class="timeline-months">{{ record.monthsFromInitial }}个月</div>
                            </div>
                          </template>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                </div>
              </template>
            </template>
          </div>

          <!-- 加载状态 -->
          <div class="loading-card" v-if="isLoading">
            <div class="loading-content">
              <div class="loading-spinner">
                <div class="spinner"></div>
              </div>
              <div class="loading-text">正在查找匹配案例...</div>
            </div>
          </div>

        <!-- 无结果提示 -->
        <div class="no-results-card" v-if="!isLoading && (!analysisStats || analysisStats.totalCases === 0) && hasSearched">
          <div class="no-results-content">
            <div class="no-results-icon">🔍</div>
            <div class="no-results-title">未找到匹配的案例</div>
            <div class="no-results-tip">请尝试调整匹配参数范围</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

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
  isDualScreen: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: [String, Number],
    required: true
  },
  patientInfo: {
    type: Object,
    default: () => ({})
  }
})

// 响应式数据
const isLoading = ref(false)
const matchResults = ref([])
const hasSearched = ref(false)
const backendResponseData = ref(null) // 临时保存后端返回的原始数据
const analysisStats = ref(null) // 统计分析结果
const currentPage = ref(1) // 当前页码
const pageSize = ref(10) // 每页显示数量
const expandedGroups = ref(new Set()) // 展开的治疗方案组合
const groupingMode = ref('type') // 分组模式：'type' 按方案类型，'brand' 按品牌
const showNoTreatment = ref(false) // 是否显示"无治疗"组，默认不显示
const sortBy = ref('monthlyChange') // 排序方式：默认按月变化从小到大

// 预约医生显示
const appointmentDoctorId = ref(null)
const appointmentDoctorName = ref('')
const appointmentDoctorDisplay = computed(() => {
  if (!appointmentDoctorId.value) return ''
  return appointmentDoctorName.value || `医生ID: ${appointmentDoctorId.value}`
})

// 加载医生列表（本地缓存优先）
const doctorCacheKey = 'doctor_list_cache'
const loadDoctorsFromCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(doctorCacheKey) || '[]')
    return Array.isArray(cached) ? cached : []
  } catch {
    return []
  }
}

const saveDoctorsToCache = (list) => {
  try { localStorage.setItem(doctorCacheKey, JSON.stringify(list || [])) } catch {}
}

const fetchDoctorList = async () => {
  const orgId = localStorage.getItem('organization_id')
  const csrftoken = localStorage.getItem('csrftoken')
  if (!orgId) return []
  try {
    const res = await fetch(`https://aiforoptometry.com/doctor/list/?organization_id=${orgId}`, {
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken }
    })
    const data = await res.json()
    const list = data?.data?.results || data?.data || []
    const simplified = list.map(d => ({ id: d.id, name: d.name }))
    saveDoctorsToCache(simplified)
    return simplified
  } catch {
    return []
  }
}

const resolveDoctorName = async (doctorId) => {
  if (!doctorId) return ''
  let list = loadDoctorsFromCache()
  let found = list.find(d => d.id === doctorId)
  if (found) return found.name
  list = await fetchDoctorList()
  found = list.find(d => d.id === doctorId)
  return found ? found.name : ''
}

// 当为自定义预约时，根据检查记录ID拉取邀约获取医生ID
const fetchInviteDoctorByExamRecord = async (examRecordId) => {
  if (!examRecordId) return null
  const orgId = localStorage.getItem('organization_id')
  if (!orgId) return null
  const csrftoken = localStorage.getItem('csrftoken')
  try {
    const url = `https://aiforoptometry.com/api/invites?exam_record_id=${examRecordId}&organization_id=${orgId}`
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken } })
    const data = await res.json()
    const first = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null
    return first?.doctor_id || null
  } catch {
    return null
  }
}

const tryLoadAppointmentDoctor = async () => {
  const rec = props.record
  if (!rec) return
  // 自定义预约：review_interval_days === 0
  if (rec.review_interval_days === 0) {
    // 优先使用检查记录自带字段
    let did = rec.appointment_doctor || rec.doctor_id || null
    if (!did) {
      // 若无，尝试通过邀约记录关联
      did = await fetchInviteDoctorByExamRecord(rec.id)
    }
    if (did) {
      appointmentDoctorId.value = did
      appointmentDoctorName.value = await resolveDoctorName(did)
    } else {
      appointmentDoctorId.value = null
      appointmentDoctorName.value = ''
    }
  } else {
    appointmentDoctorId.value = null
    appointmentDoctorName.value = ''
  }
}

// 匹配参数
const matchParams = ref({
  al: 24.0, // 眼轴中心值（mm）
  al_tol: 0.5, // 眼轴容差（mm）
  k1: 43.0, // K1中心值（D）
  k1_tol: 0.5, // K1容差（D）
  ast: 0.8, // 角膜散光（D）
  ast_tol: 0.5, // 散光容差（D）
  age_months_tolerance: 3, // 年龄容差（月），默认3个月
  limit: null // 不设置默认值，让后端返回所有结果
})

// 计算患者信息
const patientInfo = computed(() => {
  if (!props.examinationRecords.length) return null
  
  // 从第一条检查记录中获取患者信息
  const firstRecord = props.examinationRecords[0]
  console.log('计算患者信息 - 第一条记录:', firstRecord)
  console.log('计算患者信息 - 第一条记录的所有字段:', Object.keys(firstRecord))
  
  // 尝试不同的患者信息字段名
  const patientData = firstRecord?.patient || 
                     firstRecord?.patient_id || 
                     firstRecord?.patientInfo ||
                     firstRecord?.patient_data
  console.log('计算患者信息 - 患者信息:', patientData)
  return patientData || null
})

// 计算当前患者的检查数据
const currentPatientData = computed(() => {
  if (!props.record) return null
  
  return {
    left: getCurrentExamData('left'),
    right: getCurrentExamData('right')
  }
})

// 检查数据完整性
const dataAvailability = computed(() => {
  if (!currentPatientData.value) {
    return {
      hasData: false,
      missingData: [],
      leftComplete: false,
      rightComplete: false,
      message: '检查记录数据不可用'
    }
  }
  
  const left = currentPatientData.value.left
  const right = currentPatientData.value.right
  
  const missingData = []
  let leftComplete = true
  let rightComplete = true
  
  // 检查左眼数据
  if (!left || left.al === null || left.al === undefined || isNaN(left.al)) {
    missingData.push('左眼眼轴长度')
    leftComplete = false
  }
  if (!left || left.k1 === null || left.k1 === undefined || isNaN(left.k1)) {
    missingData.push('左眼K1')
    leftComplete = false
  }
  
  // 检查右眼数据
  if (!right || right.al === null || right.al === undefined || isNaN(right.al)) {
    missingData.push('右眼眼轴长度')
    rightComplete = false
  }
  if (!right || right.k1 === null || right.k1 === undefined || isNaN(right.k1)) {
    missingData.push('右眼K1')
    rightComplete = false
  }
  
  const hasData = leftComplete && rightComplete
  
  let message = ''
  if (!hasData) {
    if (missingData.length > 0) {
      message = `缺少必要数据：${missingData.join('、')}，无法进行匹配`
    } else {
      message = '检查数据不完整，无法进行匹配'
    }
  }
  
  return {
    hasData,
    missingData,
    leftComplete,
    rightComplete,
    message
  }
})

// 计算有效的复查周期数据
const validReviewCycles = computed(() => {
  if (!analysisStats.value || !analysisStats.value.reviewCycles) {
    return []
  }
  
  return Object.entries(analysisStats.value.reviewCycles)
    .filter(([months, cycle]) => 
      months !== undefined && 
      months !== null && 
      months !== '' && 
      !isNaN(months) &&
      cycle && 
      cycle.count > 0
    )
    .map(([months, cycle]) => ({
      months: months,
      cycle: cycle
    }))
    .sort((a, b) => {
      const aNum = parseInt(a.months)
      const bNum = parseInt(b.months)
      return isNaN(aNum) || isNaN(bNum) ? 0 : aNum - bNum
    })
})

// 分页相关计算属性
const totalPages = computed(() => {
  return 2 // 固定两页：统计结果 + 眼轴变化分析
})

const paginatedResults = computed(() => {
  if (!backendResponseData.value?.allResults) return []
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return backendResponseData.value.allResults.slice(start, end)
})

// 眼轴变化分析数据
const axialLengthAnalysis = computed(() => {
  if (!backendResponseData.value?.allResults) {
    console.log('axialLengthAnalysis: backendResponseData.value?.allResults 为空', backendResponseData.value)
    return []
  }
  
  const results = backendResponseData.value.allResults
  console.log('axialLengthAnalysis: 开始处理', results.length, '条结果')
  
  if (!Array.isArray(results) || results.length === 0) {
    console.warn('axialLengthAnalysis: allResults 不是数组或为空', results)
    return []
  }
  
  if (results.length > 0) {
    console.log('axialLengthAnalysis: 第一条结果示例', results[0])
    console.log('axialLengthAnalysis: 第一条结果的所有字段', Object.keys(results[0]))
  }
  
  const analysis = []
  
  // 按治疗方案组合分组
  const treatmentGroups = {}
  
  results.forEach((result, index) => {
    console.log(`处理第${index + 1}条结果:`, {
      result,
      '所有字段': Object.keys(result),
      'index字段': result.index,
      '治疗手段详情': result.治疗手段详情 || result.treatment_details,
      '后续检查': result.后续检查 || result.follow_up
    })
    
    const treatmentDetails = result.治疗手段详情 || result.treatment_details || {}
    const treatmentKey = getTreatmentKey(treatmentDetails, groupingMode.value)
    
    if (!treatmentGroups[treatmentKey]) {
      treatmentGroups[treatmentKey] = {
        treatment: treatmentKey,
        cases: [],
        avgInitialAL: 0,
        avgFinalAL: 0,
        avgChange: 0,
        caseCount: 0
      }
    }
    
    // 获取眼轴数据 - 尝试多种字段名和数据结构
    let initialAL = 0
    if (result.index && typeof result.index === 'object') {
      // 尝试从 index 对象中获取
      initialAL = parseFloat(result.index.AL) || 
                  parseFloat(result.index.axial_length) ||
                  parseFloat(result.index.al) || 
                  0
    } else {
      // 尝试直接从 result 中获取
      initialAL = parseFloat(result.index?.AL) || 
                  parseFloat(result.AL) || 
                  parseFloat(result.axial_length) ||
                  parseFloat(result.al) ||
                  parseFloat(result.初始眼轴) || 
                  0
    }
    
    const initialDate = result.检查日期 || 
                       result.examination_date || 
                       result.date ||
                       (result.index && result.index.检查日期) ||
                       (result.index && result.index.examination_date)
    
    // 获取所有复查记录 - 尝试多种字段名
    const followUpRecords = []
    const followUpData = result.后续检查 || result.follow_up || result.followUp || result.follow_ups || []
    
    if (followUpData && Array.isArray(followUpData) && followUpData.length > 0) {
      followUpData.forEach((followUp, followIndex) => {
        const followUpAL = parseFloat(followUp.AL) || 
                          parseFloat(followUp.axial_length) || 
                          parseFloat(followUp.al) ||
                          parseFloat(followUp.眼轴) || 
                          0
        
        if (followUpAL && followUpAL > 0 && initialDate) {
          const followUpDate = followUp.检查日期 || 
                               followUp.examination_date || 
                               followUp.date ||
                               followUp.复查日期
          
          if (followUpDate) {
            const monthsDiff = getMonthsDifference(initialDate, followUpDate)
            followUpRecords.push({
              date: followUpDate,
              al: followUpAL,
              monthsFromInitial: monthsDiff
            })
          }
        }
      })
    }
    
    console.log(`第${index + 1}条结果处理:`, {
      '初始眼轴': initialAL,
      '初始日期': initialDate,
      '复查记录数': followUpRecords.length,
      '复查记录详情': followUpRecords,
      '治疗方案': treatmentKey
    })
    
    // 只添加有后续检查数据的案例
    if (initialAL > 0 && followUpRecords.length > 0) {
      // 按时间排序复查记录
      followUpRecords.sort((a, b) => new Date(a.date) - new Date(b.date))
      
      // 计算最终眼轴和总变化
      const finalAL = followUpRecords[followUpRecords.length - 1].al
      const totalChange = finalAL - initialAL
      const totalMonths = followUpRecords[followUpRecords.length - 1].monthsFromInitial
      
      treatmentGroups[treatmentKey].cases.push({
        patientId: result.患者id || result.patient_id || result.patientId || result.id,
        eye: result.眼别 || result.eye || result.side || '未知',
        initialAL: initialAL,
        initialDate: initialDate,
        finalAL: finalAL,
        change: totalChange,
        followUpMonths: totalMonths,
        followUpRecords: followUpRecords
      })
      
      console.log(`第${index + 1}条结果已添加到${treatmentKey}: 初始眼轴=${initialAL}, 最终眼轴=${finalAL}, 随访月数=${totalMonths}, 案例数=${treatmentGroups[treatmentKey].cases.length}`)
    } else {
      console.log(`第${index + 1}条结果跳过: 初始眼轴=${initialAL}, 复查记录数=${followUpRecords.length}`)
    }
  })
  
  // 计算每个治疗方案组合的统计数据
  Object.values(treatmentGroups).forEach(group => {
    if (group.cases.length > 0) {
      // 所有案例都已经是有完整数据的有效案例
      const validCases = group.cases
      
      // 计算平均初始眼轴
      group.avgInitialAL = validCases.reduce((sum, c) => sum + c.initialAL, 0) / validCases.length
      
      // 计算平均最终眼轴
      group.avgFinalAL = validCases.reduce((sum, c) => sum + c.finalAL, 0) / validCases.length
      
      // 计算月化后的平均变化（月化增长率）
      const monthlyChanges = validCases.map(c => {
        if (c.followUpMonths > 0) {
          // 计算月化变化：(最终眼轴 - 初始眼轴) / 随访月数
          return (c.finalAL - c.initialAL) / c.followUpMonths
        }
        return 0
      })
      
      // 计算平均月化变化
      group.avgChange = monthlyChanges.reduce((sum, change) => sum + change, 0) / monthlyChanges.length
      
      // 计算平均随访月数
      group.avgFollowUpMonths = validCases.reduce((sum, c) => sum + c.followUpMonths, 0) / validCases.length
      
      group.caseCount = validCases.length
    }
  })
  
  // 过滤结果：默认不显示"无治疗"组
  const filteredGroups = Object.values(treatmentGroups).filter(group => {
    if (group.caseCount > 0) {
      // 如果用户未勾选"显示无治疗"，则过滤掉"无治疗"组
      if (!showNoTreatment.value && group.treatment === '无治疗') {
        return false
      }
      return true
    }
    return false
  })
  
  // 排序
  const sortedGroups = [...filteredGroups].sort((a, b) => {
    switch (sortBy.value) {
      case 'monthlyChange':
        // 月变化从小到大（负值优先，表示眼轴缩短）
        return (a.avgChange || 0) - (b.avgChange || 0)
      case 'monthlyChangeDesc':
        // 月变化从大到小
        return (b.avgChange || 0) - (a.avgChange || 0)
      case 'caseCount':
        // 案例数从小到大
        return a.caseCount - b.caseCount
      case 'caseCountDesc':
        // 案例数从大到小
        return b.caseCount - a.caseCount
      case 'initialAL':
        // 初始眼轴从小到大
        return (a.avgInitialAL || 0) - (b.avgInitialAL || 0)
      case 'initialALDesc':
        // 初始眼轴从大到小
        return (b.avgInitialAL || 0) - (a.avgInitialAL || 0)
      default:
        return 0
    }
  })
  
  console.log('axialLengthAnalysis: 处理完成', {
    '总结果数': results.length,
    '治疗方案组数': Object.keys(treatmentGroups).length,
    '过滤后组数': filteredGroups.length,
    '排序后组数': sortedGroups.length,
    '治疗方案组详情': sortedGroups.map(g => ({
      treatment: g.treatment,
      caseCount: g.caseCount,
      avgChange: g.avgChange
    }))
  })
  
  return sortedGroups
})

// 获取治疗方案组合的键名
const getTreatmentKey = (treatmentDetails, mode = 'type') => {
  const treatments = []
  
  // 阿托品
  if (treatmentDetails.阿托品 === '是') {
    treatments.push('阿托品')
  }
  
  // 配镜相关
  if (treatmentDetails.配镜手段 && treatmentDetails.配镜手段 !== '无' && treatmentDetails.配镜手段 !== '否') {
    if (mode === 'brand') {
      // 按品牌：在方案类型基础上显示品牌信息
      const brand = treatmentDetails.眼镜品牌
      if (brand && brand !== '无' && brand !== '否' && brand !== '') {
        // 显示：配镜手段 + 品牌，如"离焦镜(品牌A)"
        treatments.push(`${treatmentDetails.配镜手段}(${brand})`)
      } else {
        // 没有品牌信息时，只显示配镜手段
        treatments.push(treatmentDetails.配镜手段)
      }
    } else {
      // 按类型：只显示配镜手段
      treatments.push(treatmentDetails.配镜手段)
    }
  }
  
  // 低强度红光相关
  const phototherapyValue = treatmentDetails.哺光仪 || treatmentDetails.低强度红光
  if (phototherapyValue && phototherapyValue !== '无' && phototherapyValue !== '否') {
    if (mode === 'brand') {
      // 按品牌：在方案类型基础上显示品牌和档位
      // phototherapyValue 本身就是品牌名称（如"品牌A"），档位是额外信息
      const gear = treatmentDetails.档位 && treatmentDetails.档位 !== '无' && treatmentDetails.档位 !== '否' 
                   ? treatmentDetails.档位 
                   : '未知档位'
      // 显示：低强度红光类型 + 品牌 + 档位，如"低强度红光(品牌A-档位1)"
      treatments.push(`低强度红光(${phototherapyValue}-${gear})`)
    } else {
      // 按类型：只显示通用类型名
      treatments.push('低强度红光')
    }
  }
  
  // 理疗
  if (treatmentDetails.理疗 === '是') {
    treatments.push('理疗')
  }
  
  // 视觉训练
  if (treatmentDetails.视觉训练 === '是') {
    treatments.push('视觉训练')
  }
  
  return treatments.length > 0 ? treatments.join(' + ') : '无治疗'
}

// 获取后续检查的眼轴数据
const getFollowUpAL = (result) => {
  if (result.后续检查 && result.后续检查.length > 0) {
    const latestFollowUp = result.后续检查[result.后续检查.length - 1]
    return parseFloat(latestFollowUp.AL) || null
  }
  return null
}

// 获取随访月数
const getFollowUpMonths = (result) => {
  if (result.后续检查 && result.后续检查.length > 0) {
    const firstCheck = new Date(result.检查日期)
    const lastCheck = new Date(result.后续检查[result.后续检查.length - 1].检查日期)
    return Math.round((lastCheck - firstCheck) / (1000 * 60 * 60 * 24 * 30))
  }
  return 0
}

// 计算两个日期之间的月份差
const getMonthsDifference = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.round((end - start) / (1000 * 60 * 60 * 24 * 30))
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

// 获取当前检查记录的关键数据
const getCurrentExamData = (side) => {
  const record = props.record
  if (!record) {
    console.warn('getCurrentExamData: props.record 为空')
    return null
  }
  
  const prefix = side === 'left' ? 'left_' : 'right_'
  const alField = `${prefix}eye_axial_length`
  const k1Field = `${prefix}eye_k1`
  const k2Field = `${prefix}eye_k2`
  
  // 获取眼轴长度，转换为数字，如果为null/undefined则返回null
  const alRaw = record[alField]
  const al = (alRaw !== null && alRaw !== undefined && alRaw !== '') 
    ? parseFloat(alRaw) 
    : null
  
  // 获取K1，转换为数字，如果为null/undefined则返回null
  const k1Raw = record[k1Field]
  const k1 = (k1Raw !== null && k1Raw !== undefined && k1Raw !== '') 
    ? parseFloat(k1Raw) 
    : null
  
  // 获取K2，转换为数字，如果为null/undefined则返回null
  const k2Raw = record[k2Field]
  const k2 = (k2Raw !== null && k2Raw !== undefined && k2Raw !== '') 
    ? parseFloat(k2Raw) 
    : null
  
  // 计算散光值：K2 - K1（只有当K1和K2都存在时才计算）
  const ast = (k1 !== null && k2 !== null && !isNaN(k1) && !isNaN(k2)) 
    ? parseFloat((k2 - k1).toFixed(2)) 
    : null
  
  console.log(`获取${side === 'left' ? '左眼' : '右眼'}数据:`, {
    'record对象': record,
    '字段名': { alField, k1Field, k2Field },
    '原始值': { alRaw, k1Raw, k2Raw },
    '转换后': { al, k1, k2, ast },
    'record中所有字段': Object.keys(record).filter(k => k.includes('eye') || k.includes('axial') || k.includes('k1') || k.includes('k2'))
  })
  
  return {
    al: al,
    k1: k1,
    k2: k2,
    ast: ast
  }
}

// 发送单眼匹配请求
const fetchSingleEyeMatch = async (side, patientInfoData) => {
  const csrftoken = localStorage.getItem('csrftoken')
  
  // 获取当前患者的实际检查数据作为中心值
  const currentData = getCurrentExamData(side)
  if (!currentData) {
    console.error(`${side === 'left' ? '左眼' : '右眼'}检查数据不可用`)
    // 移除 message 提示，静默处理
    return { side: side, results: [], success: false }
  }
  
  // 验证必需的数据是否存在
  if (currentData.al === null || currentData.al === undefined || isNaN(currentData.al)) {
    console.error(`${side === 'left' ? '左眼' : '右眼'}眼轴长度数据不可用:`, currentData.al)
    // 移除 message 提示，静默处理
    return { side: side, results: [], success: false }
  }
  
  if (currentData.k1 === null || currentData.k1 === undefined || isNaN(currentData.k1)) {
    console.error(`${side === 'left' ? '左眼' : '右眼'}K1数据不可用:`, currentData.k1)
    // 移除 message 提示，静默处理
    return { side: side, results: [], success: false }
  }
  
  // 确保数据是数字类型（不是字符串或null）
  const alValue = typeof currentData.al === 'number' && !isNaN(currentData.al) 
    ? currentData.al 
    : parseFloat(currentData.al)
  const k1Value = typeof currentData.k1 === 'number' && !isNaN(currentData.k1) 
    ? currentData.k1 
    : parseFloat(currentData.k1)
  const astValue = (currentData.ast !== null && currentData.ast !== undefined && !isNaN(currentData.ast))
    ? (typeof currentData.ast === 'number' ? currentData.ast : parseFloat(currentData.ast))
    : 0.0
  
  // 再次验证转换后的值
  if (isNaN(alValue) || isNaN(k1Value)) {
    console.error(`${side === 'left' ? '左眼' : '右眼'}数据转换失败:`, { alValue, k1Value, currentData })
    // 移除 message 提示，静默处理
    return { side: side, results: [], success: false }
  }
  
  const requestData = {
    side: side,
    gender: patientInfoData.gender || 'female',
    reference_examination_date: formatDate(props.record?.examination_date),
    reference_birth_date: formatDate(patientInfoData.birthDate),
    al: alValue, // 使用当前患者的眼轴长度作为中心值（确保是数字）
    al_tol: matchParams.value.al_tol, // 眼轴容差
    k1: k1Value, // 使用当前患者的K1作为中心值（确保是数字）
    k1_tol: matchParams.value.k1_tol, // K1容差
    ast: astValue, // 角膜散光（K2-K1计算得出，如果为null则使用0.0）
    ast_tol: matchParams.value.ast_tol, // 散光容差
    age_months_tolerance: matchParams.value.age_months_tolerance, // 年龄容差参数
    exclude_patient_ids: [parseInt(props.patientId)]
  }
  
  // 只有当limit不为null时才添加limit参数
  if (matchParams.value.limit !== null) {
    requestData.limit = matchParams.value.limit
  }
  
  console.log(`发送${side === 'left' ? '左眼' : '右眼'}匹配请求:`, requestData)
  console.log(`请求数据详情:`, {
    'al (类型)': typeof requestData.al,
    'al (值)': requestData.al,
    'k1 (类型)': typeof requestData.k1,
    'k1 (值)': requestData.k1,
    'ast (类型)': typeof requestData.ast,
    'ast (值)': requestData.ast,
    '原始currentData': currentData
  })
  
  // 验证请求数据中没有null值
  if (requestData.al === null || requestData.k1 === null) {
    console.error('请求数据包含null值！', requestData)
    // 移除 message 提示，静默处理
    return { side: side, results: [], success: false }
  }
  
  try {
    const response = await fetch('https://aiforoptometry.com/cases/match-by-side/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify(requestData),
      credentials: 'include'
    })
    
    if (response.ok) {
      const results = await response.json()
      console.log(`=== ${side === 'left' ? '左眼' : '右眼'}后端返回的原始数据 ===`)
      console.log('响应状态:', response.status)
      console.log('响应头:', Object.fromEntries(response.headers.entries()))
      console.log('响应数据:', results)
      console.log('数据类型:', typeof results)
      console.log('是否为数组:', Array.isArray(results))
      if (Array.isArray(results)) {
        console.log('数组长度:', results.length)
        console.log('数组内容详情:', results)
      }
      
      return {
        side: side,
        results: results,
        success: true
      }
    } else {
      console.error(`${side === 'left' ? '左眼' : '右眼'}请求失败:`, response.status, response.statusText)
      console.error('错误响应内容:', await response.text())
      return {
        side: side,
        results: [],
        success: false
      }
    }
  } catch (error) {
    console.error(`${side === 'left' ? '左眼' : '右眼'}匹配请求出错:`, error)
    return {
      side: side,
      results: [],
      success: false
    }
  }
}

// 发送匹配请求（同时请求左眼和右眼）
const fetchMatchCases = async () => {
  console.log('=== 开始匹配请求（左眼+右眼） ===')
  console.log('patientInfo.value:', patientInfo.value)
  console.log('props.examinationRecords:', props.examinationRecords)
  console.log('props.record:', props.record)
  console.log('props.patientId:', props.patientId)
  
  // 尝试多种方式获取患者信息
  let patientInfoData = null
  
  // 首先尝试从父组件传递的patientInfo获取
  if (props.patientInfo && Object.keys(props.patientInfo).length > 0) {
    patientInfoData = props.patientInfo
    console.log('从父组件获取患者信息:', patientInfoData)
  }
  
  // 如果父组件没有，尝试从computed获取
  if (!patientInfoData) {
    patientInfoData = patientInfo.value
    console.log('从computed获取患者信息:', patientInfoData)
  }
  
  // 如果computed获取不到，尝试直接从检查记录中获取
  if (!patientInfoData && props.examinationRecords.length > 0) {
    const firstRecord = props.examinationRecords[0]
    patientInfoData = firstRecord?.patient
    console.log('从第一条记录获取患者信息:', patientInfoData)
  }
  
  // 如果还是获取不到，尝试从当前记录获取
  if (!patientInfoData && props.record) {
    patientInfoData = props.record.patient
    console.log('从当前记录获取患者信息:', patientInfoData)
  }
  
  if (!patientInfoData) {
    console.warn('未找到患者信息字段，使用临时患者信息对象')
    console.log('可用的检查记录:', props.examinationRecords.map(r => ({ id: r.id, patient: r.patient })))
    console.log('父组件传递的患者信息:', props.patientInfo)
    
    // 创建一个临时的患者信息对象，使用props.patientId作为基础
    console.log('创建临时患者信息对象')
    patientInfoData = {
      id: props.patientId,
      gender: 'female', // 默认值，用户可以在界面上看到并修改
      birthDate: '1990-01-01' // 默认值
    }
    console.log('临时患者信息:', patientInfoData)
  } else {
    console.log('成功获取患者信息:', patientInfoData)
  }
  
  const leftEyeData = getCurrentExamData('left')
  const rightEyeData = getCurrentExamData('right')
  
  if (!leftEyeData && !rightEyeData) {
    console.error('当前检查数据不可用')
    return
  }
  
  isLoading.value = true
  hasSearched.value = true
  
  try {
    // 同时请求左眼和右眼的匹配结果
    console.log('开始同时请求左眼和右眼匹配结果...')
    
    const [leftResult, rightResult] = await Promise.all([
      fetchSingleEyeMatch('left', patientInfoData),
      fetchSingleEyeMatch('right', patientInfoData)
    ])
    
    console.log('=== 所有匹配请求完成 ===')
    console.log('左眼结果:', leftResult)
    console.log('右眼结果:', rightResult)
    
    // 合并所有结果
    const allResults = []
    
    // 处理左眼结果
    if (leftResult.success && leftResult.results) {
      // 后端可能返回数组，也可能是 { results: [...] } 格式
      const leftData = Array.isArray(leftResult.results) 
        ? leftResult.results 
        : (leftResult.results.results || leftResult.results.data || [])
      
      if (leftData.length > 0) {
        console.log('左眼匹配结果数量:', leftData.length)
        allResults.push(...leftData)
      }
    }
    
    // 处理右眼结果
    if (rightResult.success && rightResult.results) {
      // 后端可能返回数组，也可能是 { results: [...] } 格式
      const rightData = Array.isArray(rightResult.results) 
        ? rightResult.results 
        : (rightResult.results.results || rightResult.results.data || [])
      
      if (rightData.length > 0) {
        console.log('右眼匹配结果数量:', rightData.length)
        allResults.push(...rightData)
      }
    }
    
    console.log('=== 合并后的所有结果 ===')
    console.log('总结果数量:', allResults.length)
    console.log('所有结果详情:', allResults)
    
    // 保存原始数据到临时变量
    backendResponseData.value = {
      leftEye: leftResult,
      rightEye: rightResult,
      allResults: allResults
    }
    
    // 计算统计分析结果
    if (allResults.length > 0) {
      analysisStats.value = calculateAnalysisStats(allResults)
      console.log('=== 统计分析结果 ===')
      console.log('分析统计:', analysisStats.value)
    }
    
    // 暂时不显示结果，保持空数组
    matchResults.value = []
    
  } catch (error) {
    console.error('匹配请求出错:', error)
    matchResults.value = []
  } finally {
    isLoading.value = false
  }
}

// 计算统计分析结果
const calculateAnalysisStats = (results) => {
  if (!results || results.length === 0) return null
  
  const totalCases = results.length
  
  // 统计治疗手段使用情况
  let atropineCount = 0
  let glassesCount = 0
  let phototherapyCount = 0
  let physiotherapyCount = 0
  let visualTrainingCount = 0
  
  // 统计品牌和档位
  const glassesBrands = {}
  const phototherapyGears = {}
  
  // 统计复查周期分布
  const reviewCycles = {}
  const ageDiffs = []
  
  results.forEach(result => {
    // 解析治疗手段详情
    const treatmentDetails = result.治疗手段详情 || {}
    
    // 辅助函数：检查字段是否有有效值（排除空字符串、"否"、"无"等）
    const hasValidValue = (value) => {
      return value && 
             value !== '无' && 
             value !== '否' && 
             value !== '' &&
             value !== null &&
             value !== undefined
    }
    
    // 统计各种治疗手段的使用
    // 阿托品：检查是否为"是"或有有效值（如浓度值）
    if (hasValidValue(treatmentDetails.阿托品) && treatmentDetails.阿托品 !== '否') {
      atropineCount++
    }
    
    // 配镜手段统计
    if (hasValidValue(treatmentDetails.配镜手段)) {
      glassesCount++
      // 统计眼镜品牌
      if (hasValidValue(treatmentDetails.眼镜品牌)) {
        glassesBrands[treatmentDetails.眼镜品牌] = (glassesBrands[treatmentDetails.眼镜品牌] || 0) + 1
      }
    }
    
    // 低强度红光统计（兼容"哺光仪"和"低强度红光"两个字段名）
    // 优先使用"哺光仪"（后端原始字段名），如果没有则使用"低强度红光"
    const phototherapyValue = treatmentDetails.哺光仪 || treatmentDetails.低强度红光
    if (hasValidValue(phototherapyValue)) {
      phototherapyCount++
      // 统计品牌-档位组合
      const brand = phototherapyValue
      const gear = hasValidValue(treatmentDetails.档位) 
                   ? treatmentDetails.档位 
                   : '未知档位'
      const key = `${brand}-${gear}`
      phototherapyGears[key] = (phototherapyGears[key] || 0) + 1
    }
    
    // 理疗统计：检查是否为"是"或有有效值
    if (hasValidValue(treatmentDetails.理疗) && treatmentDetails.理疗 !== '否') {
      physiotherapyCount++
    }
    
    // 视觉训练统计：检查是否为"是"或有有效值
    if (hasValidValue(treatmentDetails.视觉训练) && treatmentDetails.视觉训练 !== '否') {
      visualTrainingCount++
    }
    
    // 统计复查周期 - 使用新的字段名
    const cycle = result['复查间隔(月)']
    
    // 过滤掉无效的复查周期数据
    if (cycle !== undefined && cycle !== null && cycle !== '' && !isNaN(cycle)) {
      if (reviewCycles[cycle]) {
        reviewCycles[cycle].count++
      } else {
        reviewCycles[cycle] = { count: 1 }
      }
    }
    
    // 收集年龄差数据
    if (result['年龄差(天)'] !== undefined) {
      ageDiffs.push(result['年龄差(天)'])
    }
  })
  
  // 计算眼镜品牌Top3
  const glassesBrandsTop3 = getTop3(glassesBrands, totalCases)
  
  // 计算低强度红光档位Top3
  const phototherapyGearsTop3 = getTop3(phototherapyGears, totalCases)
  
  // 计算复查周期百分比
  Object.keys(reviewCycles).forEach(cycle => {
    reviewCycles[cycle].percentage = Math.round((reviewCycles[cycle].count / totalCases) * 100)
  })
  
  
  // 计算年龄差统计
  const avgAgeDiff = ageDiffs.length > 0 ? Math.round(ageDiffs.reduce((a, b) => a + b, 0) / ageDiffs.length) : 0
  const minAgeDiff = ageDiffs.length > 0 ? Math.min(...ageDiffs) : 0
  const maxAgeDiff = ageDiffs.length > 0 ? Math.max(...ageDiffs) : 0
  
  return {
    totalCases,
    // 治疗手段使用率
    atropineCount,
    atropineRate: Math.round((atropineCount / totalCases) * 100),
    glassesCount,
    glassesRate: Math.round((glassesCount / totalCases) * 100),
    phototherapyCount,
    phototherapyRate: Math.round((phototherapyCount / totalCases) * 100),
    physiotherapyCount,
    physiotherapyRate: Math.round((physiotherapyCount / totalCases) * 100),
    visualTrainingCount,
    visualTrainingRate: Math.round((visualTrainingCount / totalCases) * 100),
    // Top3统计
    glassesBrandsTop3,
    phototherapyGearsTop3,
    // 复查周期分布
    reviewCycles,
    // 年龄差统计
    avgAgeDiff,
    minAgeDiff,
    maxAgeDiff
  }
}

// 获取Top3选择率
const getTop3 = (items, total) => {
  return Object.entries(items)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({
      name,
      count,
      rate: Math.round((count / total) * 100)
    }))
}

// 重置参数
const resetParams = () => {
  matchParams.value = {
    al: 24.0, // 眼轴中心值（mm）
    al_tol: 0.5, // 眼轴容差（mm）
    k1: 43.0, // K1中心值（D）
    k1_tol: 0.5, // K1容差（D）
    ast: 0.8, // 角膜散光（D）
    ast_tol: 0.5, // 散光容差（D）
    age_months_tolerance: 3, // 年龄容差（月），默认3个月
    limit: null // 不设置默认值，让后端返回所有结果
  }
  matchResults.value = []
  hasSearched.value = false
  backendResponseData.value = null // 清空保存的后端数据
  analysisStats.value = null // 清空统计分析结果
  currentPage.value = 1 // 重置到第一页
}

// 分页切换方法
const changePage = (page) => {
  currentPage.value = page
}

// 切换治疗方案组合展开状态
const toggleGroupExpansion = (groupIndex) => {
  if (expandedGroups.value.has(groupIndex)) {
    expandedGroups.value.delete(groupIndex)
  } else {
    expandedGroups.value.add(groupIndex)
  }
}

// 格式化眼轴变化显示
const formatALChange = (change) => {
  if (change === null || change === undefined) return '-'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(3)}mm/月`
}

// 获取眼轴变化趋势颜色
const getChangeColor = (change) => {
  if (change === null || change === undefined) return '#999'
  if (change < -0.1) return '#52c41a' // 绿色：眼轴缩短
  if (change < 0.1) return '#1890ff'  // 蓝色：基本稳定
  return '#ff4d4f' // 红色：眼轴增长
}

// 不再监听数据变化自动请求，仅由用户点击「查找相似案例」触发加载

// 组件挂载时只加载预约医生等，不自动请求相似案例
onMounted(() => {
  tryLoadAppointmentDoctor()
})

// 监听record变化，输出检查数据
watch(() => props.record, (newRecord) => {
  console.log('=== 结果分析页面 - 当前检查记录 ===')
  console.log('患者ID:', props.patientId)
  console.log('检查记录ID:', newRecord?.id)
  console.log('检查日期:', newRecord?.examination_date)
  
  if (newRecord) {
    console.log('\n--- 常规检查数据 ---')
    
    // 左眼常规检查数据
    console.log('【左眼】')
    console.log('  眼轴长度:', newRecord.left_eye_axial_length, 'mm')
    console.log('  K1:', newRecord.left_eye_k1, 'D')
    console.log('  K2:', newRecord.left_eye_k2, 'D')
    console.log('  ΔK:', newRecord.left_eye_delta_k, 'D')
    console.log('  角膜厚度:', newRecord.left_cct, 'μm')
    console.log('  前房深度:', newRecord.left_anterior_chamber_depth, 'mm')
    console.log('  晶体厚度:', newRecord.left_lens_thickness, 'mm')
    console.log('  玻璃体长度:', newRecord.left_vitreous_space_thickness, 'mm')
    console.log('  脉络膜厚度:', newRecord.left_oct_fovea, 'μm')
    console.log('  眼压:', newRecord.left_intraocular_pressure, 'mmHg')
    console.log('  裸眼视力:', newRecord.uva_left_vision)
    console.log('  旧镜视力:', newRecord.vaec_left_old_vision)
    
    // 右眼常规检查数据
    console.log('\n【右眼】')
    console.log('  眼轴长度:', newRecord.right_eye_axial_length, 'mm')
    console.log('  K1:', newRecord.right_eye_k1, 'D')
    console.log('  K2:', newRecord.right_eye_k2, 'D')
    console.log('  ΔK:', newRecord.right_eye_delta_k, 'D')
    console.log('  角膜厚度:', newRecord.right_cct, 'μm')
    console.log('  前房深度:', newRecord.right_anterior_chamber_depth, 'mm')
    console.log('  晶体厚度:', newRecord.right_lens_thickness, 'mm')
    console.log('  玻璃体长度:', newRecord.right_vitreous_space_thickness, 'mm')
    console.log('  脉络膜厚度:', newRecord.right_oct_fovea, 'μm')
    console.log('  眼压:', newRecord.right_intraocular_pressure, 'mmHg')
    console.log('  裸眼视力:', newRecord.uva_right_vision)
    console.log('  旧镜视力:', newRecord.vaec_right_old_vision)
    
    // 双眼数据
    console.log('\n【双眼】')
    console.log('  裸眼视力:', newRecord.uva_both_vision)
    console.log('  旧镜视力:', newRecord.vaec_both_old_vision)
    
    // 身高体重
    console.log('\n【基本信息】')
    console.log('  身高:', newRecord.height, 'cm')
    console.log('  体重:', newRecord.weight, 'kg')
    
    console.log('\n--- 诊疗方案数据 ---')
    
    // 左眼诊疗方案
    console.log('【左眼治疗方案】')
    console.log('  阿托品:', newRecord.left_atropine || '否')
    console.log('  配镜手段:', newRecord.left_glasses || '否')
    if (newRecord.left_glasses_pp) {
      console.log('  配镜参数:', newRecord.left_glasses_pp)
    }
    console.log('  低强度红光:', newRecord.left_hg || '否')
    if (newRecord.left_hg_dw !== undefined && newRecord.left_hg_dw !== '') {
      console.log('  低强度红光档位:', newRecord.left_hg_dw)
    }
    console.log('  理疗:', newRecord.left_physiotherapy || '否')
    console.log('  视觉训练:', newRecord.left_visual_training || '否')
    
    // 右眼诊疗方案
    console.log('\n【右眼治疗方案】')
    console.log('  阿托品:', newRecord.right_atropine || '否')
    console.log('  配镜手段:', newRecord.right_glasses || '否')
    if (newRecord.right_glasses_pp) {
      console.log('  配镜参数:', newRecord.right_glasses_pp)
    }
    console.log('  低强度红光:', newRecord.right_hg || '否')
    if (newRecord.right_hg_dw !== undefined && newRecord.right_hg_dw !== '') {
      console.log('  低强度红光档位:', newRecord.right_hg_dw)
    }
    console.log('  理疗:', newRecord.right_physiotherapy || '否')
    console.log('  视觉训练:', newRecord.right_visual_training || '否')
    
    // 复查安排
    console.log('\n【复查安排】')
    console.log('  检查间隔:', newRecord.review_interval_days, '天')
    console.log('  下次检查日期:', newRecord.review_date)
    console.log('  双眼同步:', newRecord.sync_eyes ? '是' : '否')
  }
}, { immediate: true, deep: true })

// 当检查记录变化时，尝试加载预约医生信息
watch(() => props.record, () => {
  tryLoadAppointmentDoctor()
})

// 监听previousRecord变化
watch(() => props.previousRecord, (newPreviousRecord) => {
  console.log('=== 结果分析页面 - 上次检查记录 ===')
  if (newPreviousRecord) {
    console.log('上次检查记录ID:', newPreviousRecord.id)
    console.log('上次检查日期:', newPreviousRecord.examination_date)
    console.log('上次检查记录:', newPreviousRecord)
  } else {
    console.log('无上次检查记录')
  }
}, { immediate: true })

// 监听examinationRecords变化
watch(() => props.examinationRecords, (newRecords) => {
  console.log('=== 结果分析页面 - 所有检查记录 ===')
  console.log('检查记录总数:', newRecords.length)
  console.log('所有检查记录:', newRecords)
}, { immediate: true })

// 监听isDualScreen变化
watch(() => props.isDualScreen, (newIsDualScreen) => {
  console.log('=== 结果分析页面 - 双屏模式 ===')
  console.log('是否为双屏模式:', newIsDualScreen)
}, { immediate: true })
</script>

<style scoped lang="scss">
.analysis-exam-container {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.analysis-content {
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.analysis-header {
  margin-bottom: 24px;
  text-align: center;
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: #333;
  }
  
  .analysis-description {
    margin: 0;
    font-size: 16px;
    color: #666;
  }
}

// 参数设置区域
.params-section {
  margin-top: 16px;
  margin-bottom: 20px;
}

// 分析结果区域
.results-section {
  margin-top: 24px;
}

// 卡片通用样式
.current-data-card, .params-card, .stats-card, .loading-card, .no-results-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.card-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  
  .title-icon {
    font-size: 20px;
  }
}

.card-subtitle {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
  
  &.warning {
    color: #ff4d4f;
    font-weight: 500;
  }
}


// 参数设置卡片
.params-container {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

// 参数行布局（每行是一个独立的行）
.param-row {
  display: flex;
  gap: 12px;
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
  flex-wrap: wrap;
  
  &:last-child {
    justify-content: flex-start;
    gap: 12px;
  }
}

// 参数组（眼轴长度、角膜曲率K1等）
.param-group {
  flex: 1;
  min-width: 0; // 允许 flex 项目收缩
  background: #f8f9fa;
  border-radius: 6px;
  padding: 8px 10px;
  border: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-sizing: border-box;
}

// 参数组头部（标题 + 眼别标签）
.param-group-header {
  display: flex;
  flex-direction: column; // 改为垂直布局
  align-items: flex-start;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e8e8e8;
  gap: 8px;
}

.param-group-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #333;
  font-size: 12px;
  
  .param-icon {
    font-size: 12px;
  }
}

// 眼别标签行
.param-eye-labels {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center; // 居中对齐
  width: 212px; // 与输入框容器宽度一致：100px + 12px gap + 100px = 212px
  margin: 0 auto; // 居中对齐
}

.eye-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
  width: 100px; // 与输入框宽度一致，确保对齐
  text-align: center;
  flex-shrink: 0;
}

// 参数行容器
.param-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// 参数行项（中心值或容差）
.param-row-item {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center; // 整体居中
  position: relative;
}

.param-row-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
  min-width: 50px;
  flex-shrink: 0;
  position: absolute; // 绝对定位到左边
  left: 0;
}

.param-row-inputs {
  display: flex;
  gap: 12px;
  width: 212px; // 固定宽度：100px + 12px gap + 100px = 212px
  justify-content: center; // 居中对齐
  margin: 0 auto; // 居中对齐
  
  .input-with-unit {
    width: 100px; // 固定宽度，缩短一半
    flex-shrink: 0; // 不允许收缩，确保对齐
    flex-grow: 0; // 不允许扩展
    display: flex;
    align-items: center;
    gap: 4px;
    
    .data-missing-text {
      width: 100%;
      text-align: center;
    }
  }
}

.param-fields {
  display: flex;
  gap: 6px;
  flex: 1;
  min-width: 0; // 允许 flex 项目收缩
  box-sizing: border-box;
}

.param-field {
  flex: 1;
  min-width: 0; // 允许 flex 项目收缩
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-sizing: border-box;
  
  label {
    font-size: 10px;
    color: #999;
    font-weight: 500;
  }
}

// 其他参数布局
.param-other {
  display: flex;
  gap: 12px;
  align-items: center;
  
  .param-field {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    
    label {
      font-size: 11px;
      color: #666;
      font-weight: 500;
      white-space: nowrap;
      min-width: 60px;
    }
  }
}

// 详细分类统计左右布局
.detailed-stats-row {
  display: flex;
  gap: 20px;
}

.top3-section {
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e8e8e8;
}

// 分布统计左右布局
.distribution-row {
  display: flex;
  gap: 20px;
}

.distribution-item {
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e8e8e8;
}

.param-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  font-size: 14px;
  
  .param-icon {
    font-size: 16px;
  }
}

.param-inputs {
  display: flex;
  gap: 12px;
  
  &.horizontal {
    flex-direction: row;
  }
}

.eye-params-container {
  display: flex;
  gap: 16px;
}

.eye-param-group {
  flex: 1;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid transparent;
  
  &:first-child {
    border-color: #e3f2fd;
  }
  
  &:last-child {
    border-color: #fff3e0;
  }
}

.eye-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 13px;
  
  .eye-icon {
    font-size: 14px;
  }
}

.param-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
  
  :deep(.ant-input-number) {
    flex: 1;
    min-width: 0;
    max-width: 100%;
  }
}

.param-unit {
  font-size: 11px;
  color: #999;
  min-width: 18px;
  flex-shrink: 0;
}

.search-btn, .reset-btn {
  height: 36px;
  border-radius: 6px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  padding: 0 20px;
  
  .btn-icon {
    font-size: 13px;
  }
}

.search-btn {
  background: linear-gradient(135deg, #E27244, #ff8c69);
  border: none;
  color: white;
  
  &:hover:not(.disabled) {
    background: linear-gradient(135deg, #d65a2b, #e67a4a);
  }
  
  &.disabled {
    background: #d9d9d9;
    color: #999;
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.reset-btn {
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  color: #666;
  
  &:hover:not(.disabled) {
    background: #e9ecef;
    border-color: #d1d5db;
  }
  
  &.disabled {
    background: #f5f5f5;
    color: #bfbfbf;
    cursor: not-allowed;
    opacity: 0.6;
  }
}

// 数据缺失提示样式
.data-missing-text {
  font-size: 12px;
  color: #ff4d4f;
  font-weight: 500;
  padding: 0 8px;
  text-align: center;
  line-height: 32px;
  height: 32px;
  display: inline-block;
  width: 100px;
}

.data-missing-warning {
  margin: 16px 0;
  padding: 16px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  
  .warning-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  
  .warning-icon {
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .warning-text {
    flex: 1;
  }
  
  .warning-title {
    font-size: 14px;
    font-weight: 600;
    color: #d46b08;
    margin-bottom: 4px;
  }
  
  .warning-message {
    font-size: 13px;
    color: #d46b08;
    margin-bottom: 8px;
    line-height: 1.5;
  }
  
  .warning-tip {
    font-size: 12px;
    color: #8c8c8c;
    line-height: 1.5;
  }
}

// 统计分析卡片
.stats-card {
  min-height: 600px;
}

.stats-section {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.stats-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .stats-section-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }
  
  .grouping-options {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    
    :deep(.ant-radio-group) {
      .ant-radio-button-wrapper {
        font-size: 12px;
        padding: 4px 12px;
      }
    }
    
    :deep(.ant-checkbox-wrapper) {
      font-size: 12px;
    }
    
    :deep(.ant-select) {
      font-size: 12px;
      
      .ant-select-selector {
        height: 28px;
        line-height: 28px;
      }
    }
  }
}

.stats-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  
  &.horizontal {
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  
  &.high-rate {
    border-color: #E27244;
    background: #fff5f5;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-content {
  .stat-title {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
  }
  
  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
    
    .high-rate & {
      color: #E27244;
    }
  }
  
  .stat-detail {
    font-size: 11px;
    color: #999;
  }
}

// 复查周期图表
.cycle-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cycle-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .cycle-label {
    min-width: 70px;
    font-weight: 500;
    color: #666;
    font-size: 14px;
  }
  
  .cycle-bar {
    flex: 1;
    height: 24px;
    background: #f0f0f0;
    border-radius: 12px;
    overflow: hidden;
    
    .cycle-fill {
      height: 100%;
      background: linear-gradient(90deg, #E27244, #ff8c69);
      transition: width 0.5s ease;
    }
  }
  
  .cycle-count {
    min-width: 80px;
    font-size: 12px;
    color: #666;
    text-align: right;
  }
}

// 年龄信息
.age-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.age-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  
  .age-label {
    font-weight: 500;
    color: #666;
  }
  
  .age-value {
    font-weight: 600;
    color: #333;
  }
}

// 案例列表样式
.case-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fafafa;
}

.case-item {
  background: white;
  border-bottom: 1px solid #e8e8e8;
  padding: 16px;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f8f9fa;
  }
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.case-eye {
  background: #1890ff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.case-id {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.case-date {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.case-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.case-treatments {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.treatment-detail {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.treatment-key {
  color: #666;
  min-width: 60px;
}

.treatment-value {
  color: #999;
  font-weight: 500;
  
  &.has-treatment {
    color: #52c41a;
    font-weight: 600;
  }
}

.case-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.review-cycle {
  background: #e6f7ff;
  color: #1890ff;
  padding: 4px 8px;
  border-radius: 4px;
}

.age-diff {
  background: #fff7e6;
  color: #fa8c16;
  padding: 4px 8px;
  border-radius: 4px;
}

// Top3统计样式
.top3-section {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.top3-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
}

.top3-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.top3-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.top3-rank {
  background: #1890ff;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  min-width: 24px;
  text-align: center;
}

.top3-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.top3-rate {
  font-size: 16px;
  font-weight: 600;
  color: #52c41a;
}

.top3-count {
  font-size: 12px;
  color: #999;
}

// 加载状态
.loading-card {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  margin-bottom: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #E27244;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  color: #666;
}

// 无结果状态
.no-results-card {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-results-content {
  text-align: center;
  
  .no-results-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.6;
  }
  
  .no-results-title {
    font-size: 18px;
    font-weight: 500;
    color: #666;
    margin-bottom: 8px;
  }
  
  .no-results-tip {
    font-size: 14px;
    color: #999;
  }
}

// 分页导航样式
.pagination-nav {
  margin-bottom: 20px;
}

.pagination-tabs {
  display: flex;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}

.pagination-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #666;
  
  &:hover {
    background: #e9ecef;
    color: #333;
  }
  
  &.active {
    background: #E27244;
    color: white;
    box-shadow: 0 2px 4px rgba(226, 114, 68, 0.3);
  }
  
  .tab-icon {
    font-size: 16px;
  }
}

// 眼轴变化分析样式
.treatment-comparison {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.treatment-group {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e8e8e8;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f5f5f5;
    border-radius: 4px;
    padding: 8px;
    margin: -8px -8px 4px -8px;
  }
}

.group-count {
  background: #1890ff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  line-height: 1.4;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: fit-content;
  white-space: nowrap;
  flex-shrink: 0;
}

.group-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  text-align: left;
  line-height: 1.5;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.expand-icon {
  margin-left: auto;
  transition: transform 0.2s ease;
  color: #666;
  flex-shrink: 0;
  font-size: 12px;
  
  &.expanded {
    transform: rotate(180deg);
  }
}

.group-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

.details-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.sample-size-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  font-size: 12px;
  color: #d46b08;
  
  .warning-icon {
    font-size: 14px;
    flex-shrink: 0;
  }
  
  .warning-text {
    flex: 1;
    line-height: 1.5;
  }
}

.group-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-align: center;
  line-height: 1.5;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  text-align: center;
  line-height: 1.5;
}

.group-chart {
  margin-top: 12px;
}

.chart-bar {
  display: flex;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.bar-segment {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-align: center;
  
  &.initial {
    background: linear-gradient(135deg, #1890ff, #40a9ff);
    color: white;
  }
  
  &.final {
    background: linear-gradient(135deg, #52c41a, #73d13d);
    color: white;
  }
}

.bar-label {
  font-size: 10px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
}

.bar-value {
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
}

// 详细眼轴变化样式
.axial-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.axial-group {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e8e8e8;
}

.axial-group-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.axial-cases {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.axial-case {
  background: white;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #f0f0f0;
}

.case-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

.case-patient {
  font-weight: 500;
  text-align: left;
  line-height: 1.5;
  flex: 1;
}

.case-months {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 6px;
  border-radius: 4px;
  text-align: center;
  line-height: 1.4;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}

.case-axial-timeline {
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
  padding: 12px 0;
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 100px;
  position: relative;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  text-align: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &.initial {
    background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
    border: 2px solid #1890ff;
    border-radius: 12px;
  }
  
  &.followup {
    background: linear-gradient(135deg, #f6ffed 0%, #f0fff0 100%);
    border: 2px solid #52c41a;
    border-radius: 12px;
  }
}

.timeline-arrow {
  display: flex;
  align-items: center;
  margin: 0 8px;
  position: relative;
  
  .arrow-line {
    width: 20px;
    height: 2px;
    background: linear-gradient(90deg, #1890ff, #52c41a);
    border-radius: 1px;
  }
  
  .arrow-head {
    font-size: 16px;
    color: #1890ff;
    font-weight: bold;
    margin-left: 2px;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.timeline-date {
  font-size: 11px;
  color: #666;
  font-weight: 500;
  margin-bottom: 2px;
  text-align: center;
  line-height: 1.4;
  width: 100%;
}

.timeline-al {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
  text-align: center;
  line-height: 1.5;
  width: 100%;
}

.timeline-label {
  font-size: 10px;
  color: #1890ff;
  font-weight: 600;
  background: rgba(24, 144, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  text-align: center;
  line-height: 1.4;
  white-space: nowrap;
  display: inline-block;
}

.timeline-change {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
  margin-bottom: 2px;
  text-align: center;
  line-height: 1.4;
  white-space: nowrap;
  display: inline-block;
}

.timeline-months {
  font-size: 10px;
  color: #8c8c8c;
  font-weight: 500;
  text-align: center;
  line-height: 1.4;
  width: 100%;
  margin-top: 2px;
}

.axial-label {
  font-size: 10px;
  color: #999;
  font-weight: 500;
}

.axial-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.axial-arrow {
  font-size: 16px;
  color: #999;
  font-weight: bold;
}

.axial-change {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 60px;
}

.change-label {
  font-size: 10px;
  color: #999;
  font-weight: 500;
}

.change-value {
  font-size: 14px;
  font-weight: 600;
}

// 响应式设计
@media (max-width: 1200px) {
  .param-inputs {
    flex-direction: column;
    
    &.horizontal {
      flex-direction: row;
    }
  }
  
  .eye-params-container {
    flex-direction: column;
  }
  
  .group-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .param-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .param-eyes {
    flex-direction: column;
    gap: 8px;
  }
  
  .param-other {
    flex-direction: column;
    gap: 8px;
    
    .param-field {
      flex-direction: row;
    }
  }
  
  .detailed-stats-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .distribution-row {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .analysis-exam-container {
    padding: 16px;
  }
  
  .param-inputs.horizontal {
    flex-direction: column;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    
    &.horizontal {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  .pagination-tabs {
    flex-direction: column;
  }
  
  .case-axial {
    flex-direction: column;
    gap: 8px;
  }
  
  .axial-arrow {
    transform: rotate(90deg);
  }
}
</style>
