<template>
  <div class="img-exam-style-two">
    <div v-if="!record" class="no-data">暂无检查数据</div>
    <div v-else>
      <!-- 角膜地形图检查 -->
      <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasTopographyData" 
           v-show="!showOnlySection || showOnlySection === 'img-topography'"
           class="section-block"
           :class="{ 'collapsed': enableCollapse && !sectionExpanded?.['img-topography'] }">
        <h3 
          v-if="viewMode === 'view' || !isReportMode"
          class="section-title"
          :class="{ 'clickable': enableCollapse }"
          @click="enableCollapse && handleToggleSection('img-topography')"
        >
          <span class="section-title-text">角膜地形图检查</span>
          <!-- 编辑模式下的上传按钮 -->
          <span v-if="viewMode === 'edit'" class="section-title-actions" @click.stop>
            <a-button 
              type="primary" 
              size="small" 
              @click="showTopographyUploadModal"
              class="title-upload-btn"
            >
              <UploadOutlined />
              添加图片
            </a-button>
          </span>
          <span v-if="enableCollapse" class="section-toggle-icon">
            <UpOutlined v-if="sectionExpanded?.['img-topography']" />
            <DownOutlined v-else />
          </span>
        </h3>
        <div v-show="viewMode === 'print' || (enableCollapse ? sectionExpanded?.['img-topography'] : true)">
        <div class="img-batch-tabs">
          <div 
            :class="['batch-tab-item', { active: batchTab === 1 }]" 
            @click="batchTab = 1"
          >
            轴向图
          </div>
          <div 
            :class="['batch-tab-item', { active: batchTab === 2 }]" 
            @click="batchTab = 2"
          >
            切线图
          </div>
          <div 
            :class="['batch-tab-item', { active: batchTab === 3 }]" 
            @click="batchTab = 3"
          >
            差异图
          </div>
        </div>
        <div class="img-group">
          <div class="img-block">
            <div class="img-label">右眼</div>
            <div class="img-container">
              <!-- 只显示第一张图片，点击后可以左右滑动浏览所有图片 -->
              <div class="img-item">
                <template v-if="getTopoImg('right')">
                  <template v-if="hasImageError(getImageKey('topo', 'right', batchTab))">
                    <div class="img-broken">
                      <div class="img-broken-icon">🖼️</div>
                      <div class="img-broken-text">图片加载失败</div>
                    </div>
                    <div class="img-label-text">{{ batchLabel }}</div>
                  </template>
                  <template v-else>
                    <div class="img-wrapper" @mouseenter="console.log('[删除按钮] 鼠标悬停 - 右眼:', { viewMode: viewMode, shouldShow: viewMode === 'edit' })">
                      <img 
                        :src="fullUrl(getTopoImg('right'))" 
                        alt="右眼" 
                        class="img-display" 
                        @click="showTopoPreview('right', 0)"
                        @error="handleImageError(getImageKey('topo', 'right', batchTab))"
                      />
                      <a-button 
                        v-if="viewMode === 'edit'" 
                        type="primary" 
                        danger 
                        shape="circle" 
                        size="small"
                        class="img-delete-btn"
                        @click.stop="deleteTopoImage('right')"
                        title="删除图片"
                      >
                        ×
                      </a-button>
                    </div>
                    <div class="img-label-text">{{ batchLabel }}</div>
                  </template>
                </template>
                <template v-else>
                  <div class="no-test">未测</div>
                </template>
              </div>
            </div>
          </div>
          <div class="img-block">
            <div class="img-label">左眼</div>
            <div class="img-container">
              <!-- 只显示第一张图片，点击后可以左右滑动浏览所有图片 -->
              <div class="img-item">
                <template v-if="getTopoImg('left')">
                  <template v-if="hasImageError(getImageKey('topo', 'left', batchTab))">
                    <div class="img-broken">
                      <div class="img-broken-icon">🖼️</div>
                      <div class="img-broken-text">图片加载失败</div>
                    </div>
                    <div class="img-label-text">{{ batchLabel }}</div>
                  </template>
                  <template v-else>
                    <div class="img-wrapper">
                      <img 
                        :src="fullUrl(getTopoImg('left'))" 
                        alt="左眼" 
                        class="img-display" 
                        @click="showTopoPreview('left', 0)"
                        @error="handleImageError(getImageKey('topo', 'left', batchTab))"
                      />
                      <a-button 
                        v-if="viewMode === 'edit'" 
                        type="primary" 
                        danger 
                        shape="circle" 
                        size="small"
                        class="img-delete-btn"
                        @click.stop="deleteTopoImage('left')"
                        title="删除图片"
                      >
                        ×
                      </a-button>
                    </div>
                    <div class="img-label-text">{{ batchLabel }}</div>
                  </template>
                </template>
                <template v-else>
                  <div class="no-test">未测</div>
                </template>
              </div>
            </div>
          </div>
          <div class="img-block">
            <div class="img-label">双眼</div>
            <div class="img-container">
              <!-- 只显示第一张图片，点击后可以左右滑动浏览所有图片 -->
              <div class="img-item">
                <template v-if="getTopoImg('doble')">
                  <template v-if="hasImageError(getImageKey('topo', 'doble', batchTab))">
                    <div class="img-broken">
                      <div class="img-broken-icon">🖼️</div>
                      <div class="img-broken-text">图片加载失败</div>
                    </div>
                    <div class="img-label-text">{{ batchLabel }}</div>
                  </template>
                  <template v-else>
                    <div class="img-wrapper">
                      <img 
                        :src="fullUrl(getTopoImg('doble'))" 
                        alt="双眼" 
                        class="img-display" 
                        @click="showTopoPreview('doble', 0)"
                        @error="handleImageError(getImageKey('topo', 'doble', batchTab))"
                      />
                      <a-button 
                        v-if="viewMode === 'edit'" 
                        type="primary" 
                        danger 
                        shape="circle" 
                        size="small"
                        class="img-delete-btn"
                        @click.stop="deleteTopoImage('doble')"
                        title="删除图片"
                      >
                        ×
                      </a-button>
                    </div>
                    <div class="img-label-text">{{ batchLabel }}</div>
                  </template>
                </template>
                <template v-else>
                  <div class="no-test">未测</div>
                </template>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- 眼底照相检查 -->
      <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasFundusData" 
           v-show="!showOnlySection || showOnlySection === 'img-fundus'"
           class="section-block"
           :class="{ 'collapsed': enableCollapse && !sectionExpanded?.['img-fundus'] }">
        <h3 
          v-if="viewMode === 'view' || !isReportMode"
          class="section-title"
          :class="{ 'clickable': enableCollapse }"
          @click="enableCollapse && handleToggleSection('img-fundus')"
        >
          <span class="section-title-text">眼底照相检查</span>
          <!-- 编辑模式下的上传按钮 -->
          <span v-if="viewMode === 'edit'" class="section-title-actions" @click.stop>
            <a-button 
              type="primary" 
              size="small" 
              @click="showFundusUploadModal"
              class="title-upload-btn"
            >
              <UploadOutlined />
              添加图片
            </a-button>
          </span>
          <span v-if="enableCollapse" class="section-toggle-icon">
            <UpOutlined v-if="sectionExpanded?.['img-fundus']" />
            <DownOutlined v-else />
          </span>
        </h3>
        <div v-show="viewMode === 'print' || (enableCollapse ? sectionExpanded?.['img-fundus'] : true)">
        <div class="img-group">
          <div class="img-block">
            <div class="img-label">右眼</div>
            <div class="img-container">
              <!-- 只显示第一张图片，点击后可以左右滑动浏览所有图片 -->
              <div class="img-item">
                <template v-if="getFundusImg('right')">
                  <template v-if="hasImageError(getImageKey('fundus', 'right'))">
                    <div class="img-broken">
                      <div class="img-broken-icon">🖼️</div>
                      <div class="img-broken-text">图片加载失败</div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="img-wrapper">
                      <img 
                        :src="fullUrl(getFundusImg('right'))" 
                        alt="右眼" 
                        class="img-display" 
                        @click="showFundusPreview('right', 0)"
                        @error="handleImageError(getImageKey('fundus', 'right'))"
                      />
                      <a-button 
                        v-if="viewMode === 'edit'" 
                        type="primary" 
                        danger 
                        shape="circle" 
                        size="small"
                        class="img-delete-btn"
                        @click.stop="deleteFundusImage('right')"
                        title="删除图片"
                      >
                        ×
                      </a-button>
                    </div>
                  </template>
                </template>
                <template v-else>
                  <div class="no-test">未测</div>
                </template>
              </div>
            </div>
          </div>
          <div class="img-block">
            <div class="img-label">左眼</div>
            <div class="img-container">
              <!-- 只显示第一张图片，点击后可以左右滑动浏览所有图片 -->
              <div class="img-item">
                <template v-if="getFundusImg('left')">
                  <template v-if="hasImageError(getImageKey('fundus', 'left'))">
                    <div class="img-broken">
                      <div class="img-broken-icon">🖼️</div>
                      <div class="img-broken-text">图片加载失败</div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="img-wrapper">
                      <img 
                        :src="fullUrl(getFundusImg('left'))" 
                        alt="左眼" 
                        class="img-display" 
                        @click="showFundusPreview('left', 0)"
                        @error="handleImageError(getImageKey('fundus', 'left'))"
                      />
                      <a-button 
                        v-if="viewMode === 'edit'" 
                        type="primary" 
                        danger 
                        shape="circle" 
                        size="small"
                        class="img-delete-btn"
                        @click.stop="deleteFundusImage('left')"
                        title="删除图片"
                      >
                        ×
                      </a-button>
                    </div>
                  </template>
                </template>
                <template v-else>
                  <div class="no-test">未测</div>
                </template>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- 眼底OCT检查 -->
      <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasOCTData || sectionExpanded?.['img-oct']" 
           v-show="!showOnlySection || showOnlySection === 'img-oct'"
           class="section-block img-oct-section"
           :class="{ 'collapsed': enableCollapse && !sectionExpanded?.['img-oct'] }"
           data-section-key="img-oct">
        <h3 
          v-if="viewMode === 'view' || !isReportMode"
          class="section-title"
          :class="{ 'clickable': enableCollapse }"
          @click="enableCollapse && handleToggleSection('img-oct')"
        >
          <span class="section-title-text">眼底OCT检查</span>
          <!-- 编辑模式下的上传按钮 -->
          <span v-if="viewMode === 'edit'" class="section-title-actions" @click.stop>
            <a-button 
              type="primary" 
              size="small" 
              @click="showOctUploadModal"
              class="title-upload-btn"
            >
              <UploadOutlined />
              添加图片
            </a-button>
          </span>
          <span v-if="enableCollapse" class="section-toggle-icon">
            <UpOutlined v-if="sectionExpanded?.['img-oct']" />
            <DownOutlined v-else />
          </span>
        </h3>
        <div v-show="viewMode === 'print' || (enableCollapse ? sectionExpanded?.['img-oct'] : true)">
        <div class="img-group">
          <div class="img-block">
            <div class="img-label">右眼</div>
            <div class="img-container">
              <!-- 只显示第一张图片，点击后可以左右滑动浏览所有图片 -->
              <div class="img-item">
                <template v-if="getOctImages('right').length > 0">
                  <template v-if="hasImageError(getImageKey('oct', 'right', 0))">
                    <div class="img-broken">
                      <div class="img-broken-icon">🖼️</div>
                      <div class="img-broken-text">图片加载失败</div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="img-wrapper">
                      <img 
                        :src="fullUrl(getOctImages('right')[0].url)" 
                        alt="右眼 OCT" 
                        class="img-display" 
                        @click="showOctPreview('right', 0)"
                        @error="handleImageError(getImageKey('oct', 'right', 0))"
                      />
                      <a-button 
                        v-if="viewMode === 'edit'" 
                        type="primary" 
                        danger 
                        shape="circle" 
                        size="small"
                        class="img-delete-btn"
                        @click.stop="deleteOctImage('right')"
                        title="删除图片"
                      >
                        ×
                      </a-button>
                    </div>
                  </template>
                  <div v-if="getOctImages('right').length > 1" class="oct-album-badge">
                    <span class="oct-album-icon">📷</span>
                    <span class="oct-album-count">{{ getOctImages('right').length }}张</span>
                  </div>
                </template>
                <template v-else>
                  <div class="no-test">未测</div>
                </template>
              </div>
            </div>
          </div>
          <div class="img-block">
            <div class="img-label">左眼</div>
            <div class="img-container">
              <!-- 只显示第一张图片，点击后可以左右滑动浏览所有图片 -->
              <div class="img-item">
                <template v-if="getOctImages('left').length > 0">
                  <template v-if="hasImageError(getImageKey('oct', 'left', 0))">
                    <div class="img-broken">
                      <div class="img-broken-icon">🖼️</div>
                      <div class="img-broken-text">图片加载失败</div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="img-wrapper">
                      <img 
                        :src="fullUrl(getOctImages('left')[0].url)" 
                        alt="左眼 OCT" 
                        class="img-display" 
                        @click="showOctPreview('left', 0)"
                        @error="handleImageError(getImageKey('oct', 'left', 0))"
                      />
                      <a-button 
                        v-if="viewMode === 'edit'" 
                        type="primary" 
                        danger 
                        shape="circle" 
                        size="small"
                        class="img-delete-btn"
                        @click.stop="deleteOctImage('left')"
                        title="删除图片"
                      >
                        ×
                      </a-button>
                    </div>
                  </template>
                  <div v-if="getOctImages('left').length > 1" class="oct-album-badge">
                    <span class="oct-album-icon">📷</span>
                    <span class="oct-album-count">{{ getOctImages('left').length }}张</span>
                  </div>
                </template>
                <template v-else>
                  <div class="no-test">未测</div>
                </template>
              </div>
            </div>
          </div>
          <div class="img-block">
            <div class="img-label">双眼</div>
            <div class="img-container">
              <div class="img-item">
                <template v-if="getOctImages('doble').length > 0">
                  <template v-if="hasImageError(getImageKey('oct', 'doble', 0))">
                    <div class="img-broken">
                      <div class="img-broken-icon">🖼️</div>
                      <div class="img-broken-text">图片加载失败</div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="img-wrapper">
                      <img 
                        :src="fullUrl(getOctImages('doble')[0].url)" 
                        alt="双眼 OCT" 
                        class="img-display" 
                        @click="showOctPreview('doble', 0)"
                        @error="handleImageError(getImageKey('oct', 'doble', 0))"
                      />
                      <a-button 
                        v-if="viewMode === 'edit'" 
                        type="primary" 
                        danger 
                        shape="circle" 
                        size="small"
                        class="img-delete-btn"
                        @click.stop="deleteOctImage('doble')"
                        title="删除图片"
                      >
                        ×
                      </a-button>
                    </div>
                  </template>
                  <div v-if="getOctImages('doble').length > 1" class="oct-album-badge">
                    <span class="oct-album-icon">📷</span>
                    <span class="oct-album-count">{{ getOctImages('doble').length }}张</span>
                  </div>
                </template>
                <template v-else>
                  <div class="no-test">未测</div>
                </template>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- 其他检查 -->
      <div v-if="(viewMode !== 'view' && viewMode !== 'print') || hasOtherData" 
           v-show="!showOnlySection || showOnlySection === 'img-other'"
           class="section-block img-other-section"
           :class="{ 'collapsed': enableCollapse && !sectionExpanded?.['img-other'] }"
           data-section-key="img-other">
        <h3 
          v-if="viewMode === 'view' || !isReportMode"
          class="section-title"
          :class="{ 'clickable': enableCollapse }"
          @click="enableCollapse && handleToggleSection('img-other')"
        >
          <span class="section-title-text">其他检查</span>
          <!-- 编辑模式下的上传按钮 -->
          <span v-if="viewMode === 'edit'" class="section-title-actions" @click.stop>
            <input 
              type="file" 
              accept="image/*" 
              multiple
              :ref="el => { if (el) otherFileInput = el }"
              @change="handleOtherFileChange"
              style="display: none"
            />
            <a-button 
              type="primary" 
              size="small" 
              @click="otherFileInput?.click()"
              class="title-upload-btn"
            >
              <UploadOutlined />
              添加图片
            </a-button>
          </span>
          <span v-if="enableCollapse" class="section-toggle-icon">
            <UpOutlined v-if="sectionExpanded?.['img-other']" />
            <DownOutlined v-else />
          </span>
        </h3>
        <div v-show="viewMode === 'print' || (enableCollapse ? sectionExpanded?.['img-other'] : true)">
          <div class="other-images-grid">
            <template v-if="getOtherImages().length > 0">
              <div 
                v-for="(img, index) in getOtherImages()" 
                :key="`other-${img.id || index}-${img.url}`"
                class="other-image-item"
              >
                <div class="img-wrapper">
                  <template v-if="hasImageError(getImageKey('other', index))">
                    <div class="img-broken">
                      <div class="img-broken-icon">🖼️</div>
                      <div class="img-broken-text">图片加载失败</div>
                    </div>
                  </template>
                  <template v-else>
                    <img 
                      :src="fullUrl(img.url)" 
                      alt="其他检查" 
                      class="img-display" 
                      @click="showOtherPreview(index)"
                      @error="handleImageError(getImageKey('other', index))"
                    />
                    <a-button 
                      v-if="viewMode === 'edit'" 
                      type="primary" 
                      danger 
                      shape="circle" 
                      size="small"
                      class="img-delete-btn"
                      @click.stop="deleteOtherImage(img.id)"
                      title="删除图片"
                    >
                      ×
                    </a-button>
                  </template>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="no-test">暂无图片</div>
            </template>
          </div>
        </div>
      </div>

      <!-- 图片预览弹窗 -->
      <a-modal 
        v-model:open="previewVisible" 
        :footer="null" 
        width="auto" 
        centered 
        :bodyStyle="{padding:0,background:'#000'}" 
        :maskClosable="true"
      >
        <div class="preview-container">
          <a-button 
            type="text" 
            class="preview-close-btn" 
            @click="previewVisible = false" 
            title="关闭"
            aria-label="关闭"
          >
            <CloseOutlined />
          </a-button>
          <div class="preview-toolbar">
            <a-button-group>
              <a-button 
                type="primary" 
                size="small" 
                @click="rotateImage(90)"
                title="顺时针旋转90°"
              >
                <template #icon>🔄</template>
                旋转90°
              </a-button>
              <a-button 
                type="primary" 
                size="small" 
                @click="rotateImage(180)"
                title="旋转180°"
              >
                <template #icon>🔄</template>
                旋转180°
              </a-button>
              <a-button 
                type="primary" 
                size="small" 
                @click="rotateImage(270)"
                title="逆时针旋转90°"
              >
                <template #icon>🔄</template>
                旋转270°
              </a-button>
              <a-button 
                type="default" 
                size="small" 
                @click="resetRotation"
                title="重置旋转"
              >
                <template #icon>↺</template>
                重置
              </a-button>
            </a-button-group>
            <a-button-group style="margin-left: 10px;">
              <a-button 
                type="primary" 
                size="small" 
                @click="zoomIn"
                title="放大 (快捷键: +)"
              >
                <template #icon>🔍+</template>
                放大
              </a-button>
              <a-button 
                type="primary" 
                size="small" 
                @click="zoomOut"
                title="缩小 (快捷键: -)"
              >
                <template #icon>🔍-</template>
                缩小
              </a-button>
              <a-button 
                type="default" 
                size="small" 
                @click="resetZoom"
                title="重置缩放 (快捷键: 0)"
              >
                <template #icon>🔍</template>
                重置
              </a-button>
            </a-button-group>
          </div>
          <div class="preview-tips">
            <span>ESC: 关闭 | 方向键: 旋转 | +/-: 缩放 | 0: 重置缩放 | 滚轮: 缩放</span>
            <span v-if="previewImageList.length > 1" style="margin-left: 20px;">
              | ←/→: 上一张/下一张 | {{ currentImageIndex + 1 }} / {{ previewImageList.length }}
            </span>
          </div>
          <div 
            class="preview-image-container" 
            @wheel="handleWheel"
          >
            <img 
              :src="previewImg" 
              alt="预览" 
              class="preview-image" 
              :style="{ transform: `rotate(${rotationAngle}deg) scale(${scale})` }"
            />
            <!-- 删除按钮（编辑模式下显示） -->
            <a-button 
              v-if="viewMode === 'edit'"
              type="primary" 
              danger 
              shape="circle" 
              size="large"
              class="preview-delete-btn"
              @click="deleteCurrentImage"
              title="删除当前图片"
            >
              ×
            </a-button>
            <!-- 上一张/下一张导航按钮 - 始终显示，但单张图片时禁用 -->
            <div v-if="previewImageList.length > 0" class="preview-navigation">
              <a-button 
                type="primary" 
                shape="circle"
                :disabled="previewImageList.length <= 1 || currentImageIndex === 0"
                @click="prevImage"
                class="nav-btn nav-btn-prev"
                title="上一张 (←)"
              >
                <template #icon>
                  <LeftOutlined />
                </template>
              </a-button>
              <a-button 
                type="primary" 
                shape="circle"
                :disabled="previewImageList.length <= 1 || currentImageIndex === previewImageList.length - 1"
                @click="nextImage"
                class="nav-btn nav-btn-next"
                title="下一张 (→)"
              >
                <template #icon>
                  <RightOutlined />
                </template>
              </a-button>
            </div>
          </div>
        </div>
      </a-modal>

      <!-- 角膜地形图上传弹窗 -->
      <a-modal 
        v-model:open="topographyUploadVisible" 
        title="上传角膜地形图"
        @ok="handleTopographyUpload"
        @cancel="handleTopographyUploadCancel"
        :confirmLoading="uploading"
        okText="上传"
        cancelText="取消"
        width="500px"
      >
        <div class="upload-form">
          <div class="form-item">
            <label>图片类型：</label>
            <a-select v-model:value="uploadForm.type" style="width: 100%">
              <a-select-option value="axial">轴向图</a-select-option>
              <a-select-option value="tangential">切线图</a-select-option>
              <a-select-option value="difference">差异图</a-select-option>
            </a-select>
          </div>
          <div class="form-item">
            <label>眼别：</label>
            <a-select v-model:value="uploadForm.eye" style="width: 100%">
              <a-select-option value="R">右眼</a-select-option>
              <a-select-option value="L">左眼</a-select-option>
              <a-select-option value="both">双眼</a-select-option>
            </a-select>
          </div>
          <div class="form-item">
            <label>选择图片：</label>
            <div class="file-select-row">
              <input 
                type="file" 
                accept="image/*" 
                multiple
                ref="topographyFileInput"
                @change="handleTopographyFileChange"
                style="width: 100%"
              />
              <a-button 
                v-if="selectedFiles.length > 0" 
                type="default" 
                size="small" 
                @click="clearAllFiles"
                class="clear-all-btn"
              >
                清除所有
              </a-button>
            </div>
            <div v-if="selectedFiles.length > 0" class="file-count-info">
              已选择 {{ selectedFiles.length }} 个文件
            </div>
            <div v-if="selectedFiles.length > 0" class="file-preview-list">
              <div 
                v-for="(fileInfo, index) in selectedFiles" 
                :key="`${fileInfo.file.name}-${fileInfo.file.size}-${index}`" 
                class="file-preview-item"
              >
                <div class="file-thumbnail">
                  <img v-if="fileInfo.preview" :src="fileInfo.preview" :alt="fileInfo.file.name" />
                  <div v-else class="file-no-preview">无预览</div>
                  <div class="file-remove" @click.stop="removeFile(index)" title="移除">
                    ×
                  </div>
                </div>
                <div class="file-name">{{ fileInfo.file.name }}</div>
              </div>
            </div>
          </div>
        </div>
      </a-modal>

      <!-- 眼底照相上传弹窗 -->
      <a-modal 
        v-model:open="fundusUploadVisible" 
        title="上传眼底照相"
        @ok="handleFundusUpload"
        @cancel="handleFundusUploadCancel"
        :confirmLoading="fundusUploading"
        okText="添加"
        cancelText="取消"
        width="500px"
      >
        <div class="upload-form">
          <div class="form-item">
            <label>眼别：</label>
            <a-select v-model:value="fundusUploadForm.eye" style="width: 100%">
              <a-select-option value="R">右眼</a-select-option>
              <a-select-option value="L">左眼</a-select-option>
              <a-select-option value="B">双眼</a-select-option>
            </a-select>
          </div>
          <div class="form-item">
            <label>选择图片：</label>
            <div class="file-select-row">
              <input 
                type="file" 
                accept="image/*" 
                multiple
                :ref="el => { if (el) fundusModalFileInput = el }"
                @change="handleFundusModalFileChange"
                style="width: 100%"
              />
              <a-button 
                v-if="fundusSelectedFiles.length > 0" 
                type="default" 
                size="small" 
                @click="clearFundusFiles"
                class="clear-all-btn"
              >
                清除所有
              </a-button>
            </div>
            <div v-if="fundusSelectedFiles.length > 0" class="file-count-info">
              已选择 {{ fundusSelectedFiles.length }} 个文件
            </div>
            <div v-if="fundusSelectedFiles.length > 0" class="file-preview-list">
              <div 
                v-for="(fileInfo, index) in fundusSelectedFiles" 
                :key="`fundus-${fileInfo.file.name}-${fileInfo.file.size}-${index}`" 
                class="file-preview-item"
              >
                <div class="file-thumbnail">
                  <img v-if="fileInfo.preview" :src="fileInfo.preview" :alt="fileInfo.file.name" />
                  <div v-else class="file-no-preview">无预览</div>
                  <div class="file-remove" @click.stop="removeFundusFile(index)" title="移除">×</div>
                </div>
                <div class="file-name">{{ fileInfo.file.name }}</div>
              </div>
            </div>
          </div>
        </div>
      </a-modal>

      <!-- 眼底OCT上传弹窗 -->
      <a-modal 
        v-model:open="octUploadVisible" 
        title="上传眼底OCT"
        @ok="handleOctUpload"
        @cancel="handleOctUploadCancel"
        :confirmLoading="octUploading"
        okText="添加"
        cancelText="取消"
        width="500px"
      >
        <div class="upload-form">
          <div class="form-item">
            <label>眼别：</label>
            <a-select v-model:value="octUploadForm.eye" style="width: 100%">
              <a-select-option value="R">右眼</a-select-option>
              <a-select-option value="L">左眼</a-select-option>
              <a-select-option value="B">双眼</a-select-option>
            </a-select>
          </div>
          <div class="form-item">
            <label>选择图片：</label>
            <div class="file-select-row">
              <input 
                type="file" 
                accept="image/*" 
                multiple
                :ref="el => { if (el) octModalFileInput = el }"
                @change="handleOctModalFileChange"
                style="width: 100%"
              />
              <a-button 
                v-if="octSelectedFiles.length > 0" 
                type="default" 
                size="small" 
                @click="clearOctFiles"
                class="clear-all-btn"
              >
                清除所有
              </a-button>
            </div>
            <div v-if="octSelectedFiles.length > 0" class="file-count-info">
              已选择 {{ octSelectedFiles.length }} 个文件
            </div>
            <div v-if="octSelectedFiles.length > 0" class="file-preview-list">
              <div 
                v-for="(fileInfo, index) in octSelectedFiles" 
                :key="`oct-${fileInfo.file.name}-${fileInfo.file.size}-${index}`" 
                class="file-preview-item"
              >
                <div class="file-thumbnail">
                  <img v-if="fileInfo.preview" :src="fileInfo.preview" :alt="fileInfo.file.name" />
                  <div v-else class="file-no-preview">无预览</div>
                  <div class="file-remove" @click.stop="removeOctFile(index)" title="移除">×</div>
                </div>
                <div class="file-name">{{ fileInfo.file.name }}</div>
              </div>
            </div>
          </div>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, nextTick } from 'vue';
import { UpOutlined, DownOutlined, UploadOutlined, LeftOutlined, RightOutlined, CloseOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

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
    default: null // 如果设置，只显示指定的 section（如 'img-topography', 'img-fundus', 'img-oct'）
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

const emit = defineEmits(['toggle-section', 'update-image', 'pending-delete-images', 'pending-delete-old-images']);

// 预删除的图片ID列表（临时记录，点击保存后才真正删除）
const pendingDeleteImageIds = ref([]);
// 预删除的旧字段图片列表（没有ID的旧数据图片，使用URL标识）
const pendingDeleteOldImages = ref([]);

// 切换section展开/收起状态
const handleToggleSection = (sectionKey) => {
  emit('toggle-section', sectionKey);
};

// 图片上传处理函数
const handleImageUpload = async (event, type, eye, batch = null, imageIndex = 1) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件');
    return;
  }
  
  // 验证文件大小（限制10MB）
  if (file.size > 10 * 1024 * 1024) {
    alert('图片大小不能超过10MB');
    return;
  }
  
  // 创建预览URL
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageUrl = e.target.result;
    
    // 根据类型更新对应的字段
    const updateData = {};
    if (type === 'topo') {
      // 角膜地形图
      const batchMap = { 1: 'first', 2: 'second', 3: 'third' };
      const batchKey = batchMap[batch];
      if (eye === 'right') {
        if (batchKey === 'first') {
          updateData[imageIndex === 1 ? 'right_corneal_topography_first' : 'right_corneal_topography_second'] = imageUrl;
        } else if (batchKey === 'second') {
          updateData[imageIndex === 1 ? 'right_corneal_topography_second' : 'right_corneal_topography_third'] = imageUrl;
        } else if (batchKey === 'third') {
          updateData[imageIndex === 1 ? 'right_corneal_topography_third' : 'right_corneal_topography_first'] = imageUrl;
        }
      } else if (eye === 'left') {
        if (batchKey === 'first') {
          updateData[imageIndex === 1 ? 'left_corneal_topography_first' : 'left_corneal_topography_second'] = imageUrl;
        } else if (batchKey === 'second') {
          updateData[imageIndex === 1 ? 'left_corneal_topography_second' : 'left_corneal_topography_third'] = imageUrl;
        } else if (batchKey === 'third') {
          updateData[imageIndex === 1 ? 'left_corneal_topography_third' : 'left_corneal_topography_first'] = imageUrl;
        }
      } else if (eye === 'doble') {
        if (batchKey === 'first') {
          updateData['doble_corneal_topography_first'] = imageUrl;
        } else if (batchKey === 'second') {
          updateData['doble_corneal_topography_second'] = imageUrl;
        } else if (batchKey === 'third') {
          updateData['doble_corneal_topography_third'] = imageUrl;
        }
      }
    } else if (type === 'fundus') {
      // 眼底照相
      if (eye === 'right') {
        updateData[imageIndex === 1 ? 'fundus_photo_right_path' : 'fundus_photo_right_path_2'] = imageUrl;
      } else if (eye === 'left') {
        updateData[imageIndex === 1 ? 'fundus_photo_left_path' : 'fundus_photo_left_path_2'] = imageUrl;
      }
    } else if (type === 'oct') {
      // OCT - 需要添加到images.oct数组
      if (!props.record.images) {
        props.record.images = {};
      }
      if (!props.record.images.oct) {
        props.record.images.oct = [];
      }
      // 映射眼睛类型
      const eyeMap = { 'right': 'R', 'left': 'L', 'doble': 'B' };
      const mappedEye = eyeMap[eye] || eye;
      // 添加新图片到数组
      props.record.images.oct.push({
        eye: mappedEye,
        url: imageUrl,
        upload_time: new Date().toISOString()
      });
    }
    
    // 直接更新record对象
    if (Object.keys(updateData).length > 0) {
      Object.assign(props.record, updateData);
    }
    
    // 触发更新事件
    emit('update-image', {
      type,
      eye,
      batch,
      imageIndex,
      imageUrl,
      updateData
    });
    
    // 重置input
    event.target.value = '';
  };
  
  reader.readAsDataURL(file);
};

// 判断字段是否有值
const hasFieldValue = (value) => {
  return value !== null && value !== undefined && value !== '';
};

// 判断各板块是否有数据
const hasTopographyData = computed(() => {
  const record = props.record;
  if (!record) return false;
  
  // 检查新的 images.ct 数组
  const ctImages = record.images?.ct;
  if (ctImages && Array.isArray(ctImages) && ctImages.length > 0) {
    // 检查是否有任何眼睛的图片（R、L、B）
    const hasAnyEyeData = ctImages.some(img => 
      (img.eye === 'R' || img.eye === 'L' || img.eye === 'B') && img.url
    );
    if (hasAnyEyeData) {
      return true;
    }
  }
  
  // 检查旧的单图模式
  return (
    hasFieldValue(record.right_corneal_topography_first) || hasFieldValue(record.left_corneal_topography_first) ||
    hasFieldValue(record.right_corneal_topography_second) || hasFieldValue(record.left_corneal_topography_second) ||
    hasFieldValue(record.right_corneal_topography_third) || hasFieldValue(record.left_corneal_topography_third) ||
    hasFieldValue(record.doble_corneal_topography_first) || 
    hasFieldValue(record.doble_corneal_topography_second) || 
    hasFieldValue(record.doble_corneal_topography_third)
  );
});

const hasFundusData = computed(() => {
  const record = props.record;
  if (!record) return false;
  
  // 检查新的 images.fundus 数组
  const fundusImages = record.images?.fundus;
  if (fundusImages && Array.isArray(fundusImages) && fundusImages.length > 0) {
    // 检查是否有任何眼睛的图片（R、L）
    const hasAnyEyeData = fundusImages.some(img => 
      (img.eye === 'R' || img.eye === 'L') && img.url
    );
    if (hasAnyEyeData) {
      return true;
    }
  }
  
  // 检查旧的单图模式
  return (
    hasFieldValue(record.fundus_photo_right_path) || hasFieldValue(record.fundus_photo_left_path)
  );
});

const hasOCTData = computed(() => {
  const record = props.record;
  if (!record) {
    console.log('[风格2 OCT] record为空，hasOCTData = false');
    return false;
  }
  
  // 检查新的多图模式：只要数组中有数据就返回true（包括R、L、B）
  if (record.images?.oct && Array.isArray(record.images.oct) && record.images.oct.length > 0) {
    console.log('[风格2 OCT] 多图模式检测:', {
      octArrayLength: record.images.oct.length,
      octArray: record.images.oct,
      eyeTypes: record.images.oct.map(img => img.eye)
    });
    
    // 检查是否有任何眼睛的图片（R、L、B）
    const hasAnyEyeData = record.images.oct.some(img => 
      img.eye === 'R' || img.eye === 'L' || img.eye === 'B'
    );
    
    console.log('[风格2 OCT] 多图模式判定结果:', {
      hasAnyEyeData,
      hasOCTData: hasAnyEyeData
    });
    
    if (hasAnyEyeData) {
      return true;
    }
  }
  
  // 检查旧的单图模式（包括双眼）
  const rightPath = hasFieldValue(record.oct_photo_right_path);
  const leftPath = hasFieldValue(record.oct_photo_left_path);
  const doblePath = hasFieldValue(record.oct_photo_doble_path);
  
  console.log('[风格2 OCT] 单图模式检测:', {
    rightPath: record.oct_photo_right_path,
    leftPath: record.oct_photo_left_path,
    doblePath: record.oct_photo_doble_path,
    hasRight: rightPath,
    hasLeft: leftPath,
    hasDoble: doblePath
  });
  
  const result = rightPath || leftPath || doblePath;
  console.log('[风格2 OCT] 单图模式判定结果:', {
    hasOCTData: result
  });
  
  return result;
});

const hasOtherData = computed(() => {
  const record = props.record;
  if (!record) {
    console.log('[其他检查] record为空，hasOtherData = false');
    return false;
  }
  
  // 检查新的 images.other 数组
  const otherImages = record.images?.other;
  console.log('[其他检查] 检查数据:', {
    hasRecord: !!record,
    hasImages: !!record.images,
    hasOther: !!otherImages,
    otherImagesLength: otherImages?.length || 0,
    otherImages: otherImages,
    viewMode: props.viewMode,
    recordKeys: Object.keys(record),
    imagesKeys: record.images ? Object.keys(record.images) : []
  });
  
  if (otherImages && Array.isArray(otherImages) && otherImages.length > 0) {
    // 检查是否有任何图片（必须同时有 img 对象和 url）
    const hasAnyData = otherImages.some(img => {
      const hasUrl = img && img.url && img.url.trim() !== '';
      console.log('[其他检查] 检查单个图片:', {
        img,
        hasUrl,
        url: img?.url
      });
      return hasUrl;
    });
    console.log('[其他检查] 判定结果:', {
      hasAnyData,
      hasOtherData: hasAnyData,
      viewMode: props.viewMode,
      filteredCount: otherImages.filter(img => img && img.url && img.url.trim() !== '').length
    });
    if (hasAnyData) {
      return true;
    }
  }
  
  console.log('[其他检查] 没有数据，hasOtherData = false, viewMode:', props.viewMode);
  return false;
});

// 计算其他检查区域的显示状态
const otherDisplayStatus = computed(() => {
  const viewMode = props.viewMode;
  const hasData = hasOtherData.value;
  
  // v-if 条件（与角膜地形图和眼底照相保持一致）
  const vIfCondition = (viewMode !== 'view' && viewMode !== 'print') || hasData;
  
  // v-show 条件
  const vShowCondition = !props.showOnlySection || props.showOnlySection === 'img-other';
  
  const finalVisible = vIfCondition && vShowCondition;
  
  return {
    viewMode,
    hasOtherData: hasData,
    showOnlySection: props.showOnlySection,
    vIfCondition,
    vShowCondition,
    finalVisible
  };
});

// 监控显示状态变化
watch(otherDisplayStatus, (status) => {
  console.log('[其他检查] 显示状态变化:', status);
}, { immediate: true, deep: true });

// 监控viewMode变化
watch(() => props.viewMode, (newMode, oldMode) => {
  console.log('[其他检查] viewMode变化:', {
    from: oldMode,
    to: newMode,
    hasOtherData: hasOtherData.value,
    otherDisplayStatus: otherDisplayStatus.value
  });
});

// 计算OCT区域的显示状态
const octDisplayStatus = computed(() => {
  const viewMode = props.viewMode;
  const hasData = hasOCTData.value;
  const sectionExpanded = props.sectionExpanded?.['img-oct'];
  
  // v-if 条件
  const vIfCondition = (viewMode !== 'view' && viewMode !== 'print') || hasData || sectionExpanded;
  
  // v-show 条件
  const vShowCondition = viewMode === 'print' || viewMode !== 'view' || hasData || sectionExpanded;
  
  const finalVisible = vIfCondition && vShowCondition;
  
  return {
    viewMode,
    hasOCTData: hasData,
    sectionExpanded,
    vIfCondition,
    vShowCondition,
    finalVisible
  };
});

// 监控显示状态变化
watch(octDisplayStatus, (status) => {
  console.log('[风格2 OCT] 显示状态变化:', status);
}, { immediate: true, deep: true });

// 监控viewMode变化
watch(() => props.viewMode, (newMode, oldMode) => {
  console.log('[风格2 OCT] viewMode变化:', {
    from: oldMode,
    to: newMode,
    hasOCTData: hasOCTData.value,
    octDisplayStatus: octDisplayStatus.value
  });
});

const batchTab = ref(1); // 第几次检查
const batchLabel = computed(() => ['第一次','第二次','第三次'][batchTab.value-1]);

// 角膜地形图上传相关
const topographyUploadVisible = ref(false);
const topographyFileInput = ref(null);
const selectedFiles = ref([]); // 改为数组，支持多文件
const uploading = ref(false);
const uploadForm = reactive({
  type: 'axial', // 默认轴向图
  eye: 'both' // 默认双眼
});

// 眼底照相上传弹窗
const fundusUploadVisible = ref(false);
const fundusModalFileInput = ref(null);
const fundusSelectedFiles = ref([]);
const fundusUploading = ref(false);
const fundusUploadForm = reactive({ eye: 'R' }); // R=右眼, L=左眼, B=双眼

// 眼底OCT上传弹窗
const octUploadVisible = ref(false);
const octModalFileInput = ref(null);
const octSelectedFiles = ref([]);
const octUploading = ref(false);
const octUploadForm = reactive({ eye: 'R' });

const fundusRightFirstInput = ref(null);
const fundusRightSecondInput = ref(null);
const fundusLeftFirstInput = ref(null);
const fundusLeftSecondInput = ref(null);
const octRightInput = ref(null);
const octLeftInput = ref(null);
const octDobleInput = ref(null);
const otherFileInput = ref(null); // 其他检查标题中的文件输入

const imgCache = reactive({});
// 跟踪图片加载失败状态
const imgLoadErrors = reactive({});

watch(() => props.record, (newRecord) => {
  console.log('[风格2 OCT] record变化:', {
    hasRecord: !!newRecord,
    hasImagesOct: !!newRecord?.images?.oct,
    octArrayLength: newRecord?.images?.oct?.length || 0,
    octArray: newRecord?.images?.oct,
    viewMode: props.viewMode
  });
  
  // 强制触发hasOCTData计算
  const hasData = hasOCTData.value;
  console.log('[风格2 OCT] record变化后，hasOCTData =', hasData);
  
  // 输出其他检查的数据
  console.log('[其他检查] record变化:', {
    hasRecord: !!newRecord,
    hasImages: !!newRecord?.images,
    hasOther: !!newRecord?.images?.other,
    otherArrayLength: newRecord?.images?.other?.length || 0,
    otherArray: newRecord?.images?.other,
    viewMode: props.viewMode
  });
  
  // 强制触发hasOtherData计算
  const hasOtherDataValue = hasOtherData.value;
  console.log('[其他检查] record变化后，hasOtherData =', hasOtherDataValue);
  
  Object.keys(imgCache).forEach(key => delete imgCache[key]);
  Object.keys(imgLoadErrors).forEach(key => delete imgLoadErrors[key]);
}, { deep: true, immediate: true });

// 组件挂载时输出信息
onMounted(() => {
  console.log('[风格2 OCT] 组件已挂载:', {
    hasRecord: !!props.record,
    viewMode: props.viewMode,
    sectionExpanded: props.sectionExpanded,
    hasOCTData: hasOCTData.value,
    octDisplayStatus: octDisplayStatus.value
  });
  
  // 输出删除按钮相关状态
  console.log('[删除按钮] 组件挂载时的状态:', {
    viewMode: props.viewMode,
    shouldShowDeleteBtn: props.viewMode === 'edit',
    deleteBtnCondition: `viewMode === 'edit'`,
    btnClasses: {
      'img-delete-btn': 'opacity: 0, visibility: hidden (默认)',
      'hover显示': '鼠标悬停 .img-wrapper 时显示'
    }
  });
  
  // 检查 DOM 中是否存在删除按钮
  nextTick(() => {
    const deleteBtns = document.querySelectorAll('.img-delete-btn');
    console.log('[删除按钮] DOM 检查:', {
      buttonsCount: deleteBtns.length,
      buttonsExist: deleteBtns.length > 0,
      viewMode: props.viewMode,
      message: deleteBtns.length === 0 ? '❌ 删除按钮不存在于 DOM 中（因为 viewMode !== "edit"）' : '✅ 删除按钮存在于 DOM 中'
    });
    
    if (deleteBtns.length > 0) {
      deleteBtns.forEach((btn, index) => {
        const computedStyle = window.getComputedStyle(btn);
        console.log(`[删除按钮] 按钮 ${index + 1} 的样式:`, {
          opacity: computedStyle.opacity,
          visibility: computedStyle.visibility,
          display: computedStyle.display,
          zIndex: computedStyle.zIndex,
          position: computedStyle.position
        });
      });
    }
  });
});

// 监听 viewMode 变化
watch(() => props.viewMode, (newMode, oldMode) => {
  console.log('[删除按钮] viewMode 变化:', {
    from: oldMode,
    to: newMode,
    shouldShowDeleteBtn: newMode === 'edit'
  });
}, { immediate: true });

function getTopoImg(eye) {
  const key = `${eye}_${batchTab.value}`;
  // 清除缓存，确保能获取最新数据（包括预删除状态）
  delete imgCache[key];
  let img = '';
  
  // 优先从新的 images.ct 数组获取图片
  const ctImages = props.record?.images?.ct;
  if (ctImages && Array.isArray(ctImages) && ctImages.length > 0) {
    // 将 eye 转换为 eyeCode: 'right' -> 'R', 'left' -> 'L', 'doble' -> 'B'
    let eyeCode = '';
    if (eye === 'right') eyeCode = 'R';
    else if (eye === 'left') eyeCode = 'L';
    else if (eye === 'doble') eyeCode = 'B';
    
    // 根据 batchTab 确定类型关键词：1=轴向图(axial), 2=切线图(tangential), 3=差异图(difference)
    let typeKeyword = '';
    if (batchTab.value === 1) typeKeyword = 'axial';
    else if (batchTab.value === 2) typeKeyword = 'tangential';
    else if (batchTab.value === 3) typeKeyword = 'difference';
    
    // 过滤出对应眼睛和类型的图片，排除预删除的图片，返回第一张图片的URL
    const filteredImages = ctImages.filter(item => {
      if (item.eye !== eyeCode || !item.url) return false;
      // 排除预删除的图片
      if (pendingDeleteImageIds.value.includes(item.id)) return false;
      // 如果有 remark，检查是否包含类型关键词；如果没有 remark，则包含（兼容旧数据）
      if (item.remark) {
        return item.remark.toLowerCase().includes(typeKeyword.toLowerCase());
      }
      // 如果没有 remark，默认包含（可能是旧数据，或者不区分类型）
      return true;
    });
    
    // 返回第一张图片的URL
    if (filteredImages.length > 0 && filteredImages[0].url) {
      img = filteredImages[0].url;
      imgCache[key] = img;
      return img;
    }
    // 如果新字段存在但过滤不到匹配类型的图片，返回空字符串（不再回退到旧字段）
    if (ctImages.length > 0) {
      imgCache[key] = '';
      return '';
    }
  }
  
  // 如果没有新字段数据，回退到旧字段
  let oldImg = '';
  if (eye==='right') {
    if (batchTab.value===1) oldImg = props.record.right_corneal_topography_first;
    if (batchTab.value===2) oldImg = props.record.right_corneal_topography_second;
    if (batchTab.value===3) oldImg = props.record.right_corneal_topography_third;
  }
  if (eye==='left') {
    if (batchTab.value===1) oldImg = props.record.left_corneal_topography_first;
    if (batchTab.value===2) oldImg = props.record.left_corneal_topography_second;
    if (batchTab.value===3) oldImg = props.record.left_corneal_topography_third;
  }
  if (eye==='doble') {
    if (batchTab.value===1) oldImg = props.record.doble_corneal_topography_first;
    if (batchTab.value===2) oldImg = props.record.doble_corneal_topography_second;
    if (batchTab.value===3) oldImg = props.record.doble_corneal_topography_third;
  }
  
  // 检查旧图片是否被标记为预删除
  if (oldImg) {
    const isDeleted = pendingDeleteOldImages.value.some(item => 
      item.type === 'topo' && item.eye === eye && item.batch === batchTab.value && item.url === oldImg
    );
    if (!isDeleted) {
      img = oldImg;
    }
  }
  
  imgCache[key] = img;
  return img;
}

// 获取角膜地形图第二张图片（用于显示两张图片）
function getTopoImg2(eye) {
  const key = `${eye}_${batchTab.value}_2`;
  if (imgCache[key]) return imgCache[key];
  let img = '';
  // 如果有第二张图片字段，使用第二张；否则使用第一张作为第二张显示
  if (eye==='right') {
    if (batchTab.value===1) img = props.record.right_corneal_topography_second || props.record.right_corneal_topography_first;
    if (batchTab.value===2) img = props.record.right_corneal_topography_third || props.record.right_corneal_topography_second;
    if (batchTab.value===3) img = props.record.right_corneal_topography_first || props.record.right_corneal_topography_third;
  }
  if (eye==='left') {
    if (batchTab.value===1) img = props.record.left_corneal_topography_second || props.record.left_corneal_topography_first;
    if (batchTab.value===2) img = props.record.left_corneal_topography_third || props.record.left_corneal_topography_second;
    if (batchTab.value===3) img = props.record.left_corneal_topography_first || props.record.left_corneal_topography_third;
  }
  imgCache[key] = img;
  return img;
}

// 获取角膜地形图某个批次、某个眼睛的所有图片列表（用于多图预览）
// 返回包含 url 和 id 的对象数组
function getTopoImages(eye) {
  const images = [];
  
  // 优先从新的 images.ct 数组获取图片
  const ctImages = props.record?.images?.ct;
  if (ctImages && Array.isArray(ctImages) && ctImages.length > 0) {
    // 将 eye 转换为 eyeCode: 'right' -> 'R', 'left' -> 'L', 'doble' -> 'B'
    let eyeCode = '';
    if (eye === 'right') eyeCode = 'R';
    else if (eye === 'left') eyeCode = 'L';
    else if (eye === 'doble') eyeCode = 'B';
    
    // 根据 batchTab 确定类型关键词：1=轴向图(axial), 2=切线图(tangential), 3=差异图(difference)
    let typeKeyword = '';
    if (batchTab.value === 1) typeKeyword = 'axial';
    else if (batchTab.value === 2) typeKeyword = 'tangential';
    else if (batchTab.value === 3) typeKeyword = 'difference';
    
    console.log('[getTopoImages] 调试信息:', {
      eye,
      eyeCode,
      batchTab: batchTab.value,
      typeKeyword,
      ctImagesLength: ctImages.length,
      allCtImages: ctImages
    });
    
    // 过滤出对应眼睛和类型的图片，排除预删除的图片，返回包含 url 和 id 的对象
    // 如果 remark 中包含类型关键词，或者没有 remark（兼容旧数据），则包含该图片
    const filteredImages = ctImages
      .filter(item => {
        if (item.eye !== eyeCode || !item.url) return false;
        // 排除预删除的图片
        if (pendingDeleteImageIds.value.includes(item.id)) return false;
        // 如果有 remark，检查是否包含类型关键词；如果没有 remark，则包含（兼容旧数据）
        if (item.remark) {
          const matches = item.remark.toLowerCase().includes(typeKeyword.toLowerCase());
          console.log('[getTopoImages] 检查图片:', {
            id: item.id,
            eye: item.eye,
            remark: item.remark,
            typeKeyword,
            matches
          });
          return matches;
        }
        // 如果没有 remark，默认包含（可能是旧数据，或者不区分类型）
        return true;
      })
      .map(item => ({
        url: item.url,
        id: item.id || null
      }));
    
    console.log('[getTopoImages] 过滤结果:', {
      filteredImagesLength: filteredImages.length,
      filteredImages
    });
    
    // 如果从新字段过滤到了图片，直接返回（不再回退到旧字段）
    // 如果新字段存在但过滤结果为空，说明该类型下没有图片，应该返回空数组（不回退到旧字段，因为旧字段是按"第几次检查"分类，不是按类型分类）
    if (filteredImages.length > 0) {
      return filteredImages;
    }
    // 如果新字段存在但过滤不到匹配的图片，返回空数组（不再回退到旧字段）
    if (ctImages.length > 0) {
      console.log('[getTopoImages] 新字段存在但过滤不到匹配类型的图片，返回空数组');
      return [];
    }
  }
  
  // 如果没有新字段数据（images.ct不存在或为空），才回退到旧字段
  let firstImg = '';
  let secondImg = '';
  
  if (eye === 'right') {
    if (batchTab.value === 1) {
      firstImg = props.record.right_corneal_topography_first;
      secondImg = props.record.right_corneal_topography_second;
    } else if (batchTab.value === 2) {
      firstImg = props.record.right_corneal_topography_second;
      secondImg = props.record.right_corneal_topography_third;
    } else if (batchTab.value === 3) {
      firstImg = props.record.right_corneal_topography_third;
      secondImg = props.record.right_corneal_topography_first;
    }
  } else if (eye === 'left') {
    if (batchTab.value === 1) {
      firstImg = props.record.left_corneal_topography_first;
      secondImg = props.record.left_corneal_topography_second;
    } else if (batchTab.value === 2) {
      firstImg = props.record.left_corneal_topography_second;
      secondImg = props.record.left_corneal_topography_third;
    } else if (batchTab.value === 3) {
      firstImg = props.record.left_corneal_topography_third;
      secondImg = props.record.left_corneal_topography_first;
    }
  } else if (eye === 'doble') {
    if (batchTab.value === 1) {
      firstImg = props.record.doble_corneal_topography_first;
      secondImg = props.record.doble_corneal_topography_second;
    } else if (batchTab.value === 2) {
      firstImg = props.record.doble_corneal_topography_second;
      secondImg = props.record.doble_corneal_topography_third;
    } else if (batchTab.value === 3) {
      firstImg = props.record.doble_corneal_topography_third;
      secondImg = props.record.doble_corneal_topography_first;
    }
  }
  
  // 检查旧图片是否被标记为预删除
  const isFirstImgDeleted = firstImg && pendingDeleteOldImages.value.some(item => 
    item.type === 'topo' && item.eye === eye && item.batch === batchTab.value && item.url === firstImg
  );
  const isSecondImgDeleted = secondImg && pendingDeleteOldImages.value.some(item => 
    item.type === 'topo' && item.eye === eye && item.batch === batchTab.value && item.url === secondImg
  );
  
  // 添加第一张图片（如果存在且未被预删除）
  if (firstImg && !isFirstImgDeleted) {
    images.push({ url: firstImg, id: null });
  }
  
  // 添加第二张图片（如果存在且与第一张不同且未被预删除）
  if (secondImg && secondImg !== firstImg && !isSecondImgDeleted) {
    images.push({ url: secondImg, id: null });
  }
  
  return images;
}

function getFundusImg(eye) {
  const key = `fundus_${eye}`;
  // 清除缓存，确保能获取最新数据（包括预删除状态）
  delete imgCache[key];
  let img = '';
  
  // 优先从新的 images.fundus 数组获取图片
  const fundusImages = props.record?.images?.fundus;
  if (fundusImages && Array.isArray(fundusImages) && fundusImages.length > 0) {
    // 将 eye 转换为 eyeCode: 'right' -> 'R', 'left' -> 'L'
    let eyeCode = '';
    if (eye === 'right') eyeCode = 'R';
    else if (eye === 'left') eyeCode = 'L';
    
    // 过滤出对应眼睛的图片，排除预删除的图片，返回第一张图片的URL
    const filteredImages = fundusImages.filter(item => 
      item.eye === eyeCode && 
      item.url && 
      !pendingDeleteImageIds.value.includes(item.id)
    );
    if (filteredImages.length > 0 && filteredImages[0].url) {
      img = filteredImages[0].url;
      imgCache[key] = img;
      return img;
    }
  }
  
  // 如果没有新字段数据，回退到旧字段
  let oldImg = '';
  if (eye==='right') oldImg = props.record.fundus_photo_right_path;
  if (eye==='left') oldImg = props.record.fundus_photo_left_path;
  
  // 检查旧图片是否被标记为预删除
  if (oldImg && !pendingDeleteOldImages.value.some(item => 
    item.type === 'fundus' && item.eye === eye && item.url === oldImg
  )) {
    img = oldImg;
  }
  
  imgCache[key] = img;
  return img;
}

// 获取眼底照相第二张图片（用于显示两张图片）
function getFundusImg2(eye) {
  const key = `fundus_${eye}_2`;
  // 清除缓存，确保能获取最新数据（包括预删除状态）
  delete imgCache[key];
  let img = '';
  
  // 优先从新的 images.fundus 数组获取图片
  const fundusImages = props.record?.images?.fundus;
  if (fundusImages && Array.isArray(fundusImages) && fundusImages.length > 0) {
    // 将 eye 转换为 eyeCode: 'right' -> 'R', 'left' -> 'L'
    let eyeCode = '';
    if (eye === 'right') eyeCode = 'R';
    else if (eye === 'left') eyeCode = 'L';
    
    // 过滤出对应眼睛的图片，排除预删除的图片，返回第二张图片的URL（如果有）
    const filteredImages = fundusImages.filter(item => 
      item.eye === eyeCode && 
      item.url && 
      !pendingDeleteImageIds.value.includes(item.id)
    );
    if (filteredImages.length > 1 && filteredImages[1].url) {
      img = filteredImages[1].url;
      imgCache[key] = img;
      return img;
    } else if (filteredImages.length > 0 && filteredImages[0].url) {
      // 如果只有一张，使用第一张作为第二张显示
      img = filteredImages[0].url;
      imgCache[key] = img;
      return img;
    }
  }
  
  // 如果没有新字段数据，回退到旧字段
  // 如果有第二张图片字段，使用第二张；否则使用第一张作为第二张显示
  let oldImg = '';
  if (eye==='right') oldImg = props.record.fundus_photo_right_path_2 || props.record.fundus_photo_right_path;
  if (eye==='left') oldImg = props.record.fundus_photo_left_path_2 || props.record.fundus_photo_left_path;
  
  // 检查旧图片是否被标记为预删除
  if (oldImg && !pendingDeleteOldImages.value.some(item => 
    item.type === 'fundus' && item.eye === eye && item.url === oldImg
  )) {
    img = oldImg;
  }
  
  imgCache[key] = img;
  return img;
}

// 获取眼底照相某个眼睛的所有图片列表（用于多图预览）
// 返回包含 url 和 id 的对象数组
function getFundusImages(eye) {
  const images = [];
  
  // 优先从新的 images.fundus 数组获取图片
  const fundusImages = props.record?.images?.fundus;
  if (fundusImages && Array.isArray(fundusImages) && fundusImages.length > 0) {
    // 将 eye 转换为 eyeCode: 'right' -> 'R', 'left' -> 'L'
    let eyeCode = '';
    if (eye === 'right') eyeCode = 'R';
    else if (eye === 'left') eyeCode = 'L';
    
    // 过滤出对应眼睛的图片，排除预删除的图片，返回包含 url 和 id 的对象数组
    const filteredImages = fundusImages
      .filter(item => item.eye === eyeCode && item.url && !pendingDeleteImageIds.value.includes(item.id))
      .map(item => ({
        url: item.url,
        id: item.id || null
      }));
    
    if (filteredImages.length > 0) {
      return filteredImages;
    }
  }
  
  // 如果没有新字段数据，回退到旧字段
  let firstImg = '';
  let secondImg = '';
  
  if (eye === 'right') {
    firstImg = props.record.fundus_photo_right_path;
    secondImg = props.record.fundus_photo_right_path_2;
  } else if (eye === 'left') {
    firstImg = props.record.fundus_photo_left_path;
    secondImg = props.record.fundus_photo_left_path_2;
  }
  
  // 检查旧图片是否被标记为预删除
  const isFirstImgDeleted = firstImg && pendingDeleteOldImages.value.some(item => 
    item.type === 'fundus' && item.eye === eye && item.url === firstImg
  );
  const isSecondImgDeleted = secondImg && pendingDeleteOldImages.value.some(item => 
    item.type === 'fundus' && item.eye === eye && item.url === secondImg
  );
  
  // 添加第一张图片（如果存在且未被预删除）
  if (firstImg && !isFirstImgDeleted) {
    images.push({ url: firstImg, id: null });
  }
  
  // 添加第二张图片（如果存在且与第一张不同且未被预删除）
  if (secondImg && secondImg !== firstImg && !isSecondImgDeleted) {
    images.push({ url: secondImg, id: null });
  }
  
  return images;
}

// 获取OCT图片数组（支持多图模式）
function getOctImages(eye) {
  let eyeCode = '';
  if (eye === 'right') {
    eyeCode = 'R';
  } else if (eye === 'left') {
    eyeCode = 'L';
  } else if (eye === 'doble') {
    eyeCode = 'B'; // 双眼代码
  }
  
  const octImages = props.record?.images?.oct;
  
  if (octImages && Array.isArray(octImages) && octImages.length > 0) {
    // 过滤出对应眼睛的图片，排除预删除的图片
    const filteredImages = octImages.filter(img => img.eye === eyeCode && !pendingDeleteImageIds.value.includes(img.id));
    if (filteredImages.length > 0) {
      return filteredImages.map(img => ({
        url: img.url,
        id: img.id,
        remark: img.remark,
        created_at: img.created_at
      }));
    }
  }
  
  // 兼容旧的单图模式
  let oldPath = '';
  if (eye === 'right') {
    oldPath = props.record.oct_photo_right_path;
  } else if (eye === 'left') {
    oldPath = props.record.oct_photo_left_path;
  } else if (eye === 'doble') {
    oldPath = props.record.oct_photo_doble_path;
  }
  
  // 检查旧图片是否被标记为预删除
  const isOldPathDeleted = oldPath && pendingDeleteOldImages.value.some(item => 
    item.type === 'oct' && item.eye === eye && item.url === oldPath
  );
  
  if (oldPath && !isOldPathDeleted) {
    return [{
      url: oldPath,
      id: null,
      remark: null,
      created_at: null
    }];
  }
  
  return [];
}

// 获取其他检查的所有图片（不分眼别）
function getOtherImages() {
  const otherImages = props.record?.images?.other;
  
  if (otherImages && Array.isArray(otherImages) && otherImages.length > 0) {
    // 返回所有图片，排除预删除的图片，包含 url 和 id
    return otherImages
      .filter(img => img.url && !pendingDeleteImageIds.value.includes(img.id))
      .map(img => ({
        url: img.url,
        id: img.id || null
      }));
  }
  
  return [];
}

function fullUrl(path) {
  if (!path) return '';
  
  // Data URL（弹窗添加的本地图片）直接返回，不要拼接域名
  if (path.startsWith('data:')) {
    return path;
  }
  
  // 处理异常的URL格式（如：https://summit-eyeexam-images.https://oss-cn-chengdu.aliyuncs.com/...）
  // 如果URL中包含多个https://，修复它
  if (path.includes('https://') && path.split('https://').length > 2) {
    // 找到第一个https://之后的位置
    const firstHttpsIndex = path.indexOf('https://');
    const afterFirstHttps = path.substring(firstHttpsIndex + 8); // 跳过第一个https://
    // 移除后续的https://
    path = 'https://' + afterFirstHttps.replace(/https:\/\//g, '');
  }
  
  // 如果是完整的URL（包括http://、https://、//等），直接返回
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return path;
  }
  // 如果是相对路径，拼接基础URL
  // 保证拼接时有斜杠
  if (!path.startsWith('/')) path = '/' + path;
  return 'https://aiforoptometry.com' + path;
}

// 处理图片加载错误
function handleImageError(key) {
  imgLoadErrors[key] = true;
}

// 获取图片加载错误状态
function hasImageError(key) {
  return imgLoadErrors[key] === true;
}

// 生成图片的唯一key
function getImageKey(type, eye, batch = null) {
  if (batch !== null) {
    return `${type}_${eye}_${batch}`;
  }
  // 如果 eye 是数字（索引），用于其他检查
  if (typeof eye === 'number') {
    return `${type}_${eye}`;
  }
  return `${type}_${eye}`;
}

const previewVisible = ref(false);
const previewImg = ref('');
const previewImageList = ref([]); // 预览图片列表（用于多图模式，包含 url 和 id）
const currentImageIndex = ref(0); // 当前预览图片索引
const previewImageType = ref(''); // 预览图片类型：'topo', 'fundus', 'oct' 等
const rotationAngle = ref(0);
const scale = ref(1);
let previewKeydownHandler = null; // 保存键盘事件处理函数引用

function showPreview(url) {
  previewImg.value = url;
  previewImageList.value = [url]; // 单图模式
  currentImageIndex.value = 0;
  previewVisible.value = true;
  rotationAngle.value = 0;
  scale.value = 1;
  
  setupPreviewKeyboard();
}

// OCT多图预览
function showOctPreview(eye, startIndex) {
  const images = getOctImages(eye);
  if (images.length === 0) return;
  
  previewImageList.value = images.map(img => ({
    url: fullUrl(img.url),
    id: img.id
  }));
  currentImageIndex.value = Math.min(startIndex, images.length - 1);
  previewImg.value = previewImageList.value[currentImageIndex.value].url;
  previewImageType.value = 'oct'; // 设置图片类型
  previewVisible.value = true;
  rotationAngle.value = 0;
  scale.value = 1;
  
  setupPreviewKeyboard();
}

// 角膜地形图多图预览
function showTopoPreview(eye, startIndex = 0) {
  const images = getTopoImages(eye);
  console.log('[角膜地形图预览] 获取图片列表:', { eye, images, startIndex });
  if (images.length === 0) {
    console.warn('[角膜地形图预览] 没有图片');
    return;
  }
  
  previewImageList.value = images.map(img => ({
    url: fullUrl(img.url),
    id: img.id
  }));
  currentImageIndex.value = Math.min(startIndex, images.length - 1);
  previewImg.value = previewImageList.value[currentImageIndex.value].url;
  previewImageType.value = 'topo';
  previewVisible.value = true;
  rotationAngle.value = 0;
  scale.value = 1;
  
  console.log('[角膜地形图预览] 预览列表:', {
    previewImageListLength: previewImageList.value.length,
    currentImageIndex: currentImageIndex.value,
    previewImageList: previewImageList.value
  });
  
  setupPreviewKeyboard();
}

// 眼底照相多图预览
function showFundusPreview(eye, startIndex = 0) {
  const images = getFundusImages(eye);
  if (images.length === 0) return;
  
  previewImageList.value = images.map(img => ({
    url: fullUrl(img.url),
    id: img.id
  }));
  currentImageIndex.value = Math.min(startIndex, images.length - 1);
  previewImg.value = previewImageList.value[currentImageIndex.value].url;
  previewImageType.value = 'fundus'; // 设置图片类型
  previewVisible.value = true;
  rotationAngle.value = 0;
  scale.value = 1;
  
  setupPreviewKeyboard();
}

// 其他检查多图预览
function showOtherPreview(startIndex = 0) {
  const images = getOtherImages();
  if (images.length === 0) return;
  
  previewImageList.value = images.map(img => ({
    url: fullUrl(img.url),
    id: img.id
  }));
  currentImageIndex.value = Math.min(startIndex, images.length - 1);
  previewImg.value = previewImageList.value[currentImageIndex.value].url;
  previewImageType.value = 'other'; // 设置图片类型
  previewVisible.value = true;
  rotationAngle.value = 0;
  scale.value = 1;
  
  setupPreviewKeyboard();
}

// 设置预览键盘事件
function setupPreviewKeyboard() {
  // 移除旧的监听器
  if (previewKeydownHandler) {
    document.removeEventListener('keydown', previewKeydownHandler);
  }
  
  // 添加键盘事件监听
  previewKeydownHandler = (e) => {
    if (e.key === 'Escape') {
      previewVisible.value = false;
    } else if (e.key === 'ArrowLeft') {
      // 如果有多张图片，左右方向键切换图片；否则旋转
      if (previewImageList.value.length > 1) {
        prevImage();
      } else {
        rotateImage(-90);
      }
    } else if (e.key === 'ArrowRight') {
      // 如果有多张图片，左右方向键切换图片；否则旋转
      if (previewImageList.value.length > 1) {
        nextImage();
      } else {
        rotateImage(90);
      }
    } else if (e.key === 'r' || e.key === 'R') {
      resetRotation();
    } else if (e.key === '+' || e.key === '=') {
      zoomIn();
    } else if (e.key === '-') {
      zoomOut();
    } else if (e.key === '0') {
      resetZoom();
    }
  };
  
  document.addEventListener('keydown', previewKeydownHandler);
  
  // 监听模态框关闭，移除键盘事件监听
  const unwatch = watch(previewVisible, (newVal) => {
    if (!newVal) {
      if (previewKeydownHandler) {
        document.removeEventListener('keydown', previewKeydownHandler);
        previewKeydownHandler = null;
      }
      unwatch();
    }
  });
}

// 上一张图片
function prevImage() {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
    const img = previewImageList.value[currentImageIndex.value];
    previewImg.value = typeof img === 'string' ? img : img.url;
    rotationAngle.value = 0; // 切换图片时重置旋转
    scale.value = 1; // 切换图片时重置缩放
  }
}

// 下一张图片
function nextImage() {
  if (currentImageIndex.value < previewImageList.value.length - 1) {
    currentImageIndex.value++;
    const img = previewImageList.value[currentImageIndex.value];
    previewImg.value = typeof img === 'string' ? img : img.url;
    rotationAngle.value = 0; // 切换图片时重置旋转
    scale.value = 1; // 切换图片时重置缩放
  }
}

// 删除眼底照相缩略图（第一张图片）- 预删除模式
function deleteFundusImage(eye) {
  const images = getFundusImages(eye);
  if (images.length === 0) {
    message.warn('没有可删除的图片');
    return;
  }
  
  const firstImage = images[0];
  const imageId = firstImage.id;
  const imageUrl = firstImage.url;
  
  // 如果没有ID（可能是旧数据），使用URL标识
  if (!imageId) {
    // 检查是否已经标记为删除
    const oldImageKey = `fundus_${eye}_${imageUrl}`;
    if (pendingDeleteOldImages.value.some(item => item.key === oldImageKey)) {
      message.warn('该图片已标记为删除');
      return;
    }
    
    // 添加到旧图片预删除列表（不可变更新，触发 Vue 响应式）
    pendingDeleteOldImages.value = [...pendingDeleteOldImages.value, {
      key: oldImageKey,
      type: 'fundus',
      eye: eye,
      url: imageUrl
    }];
    message.success('图片已标记为删除，保存后生效');
    
    // 清除相关图片缓存，强制UI更新
    Object.keys(imgCache).forEach(key => {
      if (key.startsWith('fundus_')) {
        delete imgCache[key];
      }
    });
    
    // 通知父组件预删除的旧图片
    emit('pending-delete-old-images', [...pendingDeleteOldImages.value]);
    
    // 触发UI更新（图片会从列表中消失）
    emit('update-image', {
      type: 'fundus',
      deleted: false // 标记为预删除，不是真正删除
    });
    return;
  }
  
  // 如果有ID，添加到预删除列表（不可变更新，触发 Vue 响应式）
  if (!pendingDeleteImageIds.value.includes(imageId)) {
    pendingDeleteImageIds.value = [...pendingDeleteImageIds.value, imageId];
    message.success('图片已标记为删除，保存后生效');
    
    // 清除相关图片缓存，强制UI更新
    Object.keys(imgCache).forEach(key => {
      if (key.startsWith('fundus_')) {
        delete imgCache[key];
      }
    });
    
    // 通知父组件预删除的图片ID列表
    emit('pending-delete-images', [...pendingDeleteImageIds.value]);
    
    // 触发UI更新（图片会从列表中消失）
    emit('update-image', {
      type: 'fundus',
      deleted: false // 标记为预删除，不是真正删除
    });
  }
}

// 删除OCT缩略图（第一张图片）- 预删除模式
function deleteOctImage(eye) {
  const images = getOctImages(eye);
  if (images.length === 0) {
    message.warn('没有可删除的图片');
    return;
  }
  
  const firstImage = images[0];
  const imageId = firstImage.id;
  const imageUrl = firstImage.url;
  
  // 如果没有ID（可能是旧数据），使用URL标识
  if (!imageId) {
    // 检查是否已经标记为删除
    const oldImageKey = `oct_${eye}_${imageUrl}`;
    if (pendingDeleteOldImages.value.some(item => item.key === oldImageKey)) {
      message.warn('该图片已标记为删除');
      return;
    }
    
    // 添加到旧图片预删除列表（不可变更新，触发 Vue 响应式）
    pendingDeleteOldImages.value = [...pendingDeleteOldImages.value, {
      key: oldImageKey,
      type: 'oct',
      eye: eye,
      url: imageUrl
    }];
    message.success('图片已标记为删除，保存后生效');
    
    // 清除相关图片缓存，强制UI更新
    Object.keys(imgCache).forEach(key => {
      if (key.includes('oct_')) {
        delete imgCache[key];
      }
    });
    
    // 通知父组件预删除的旧图片
    emit('pending-delete-old-images', [...pendingDeleteOldImages.value]);
    
    // 触发UI更新（图片会从列表中消失）
    emit('update-image', {
      type: 'oct',
      deleted: false // 标记为预删除，不是真正删除
    });
    return;
  }
  
  // 如果有ID，添加到预删除列表（不可变更新，触发 Vue 响应式）
  if (!pendingDeleteImageIds.value.includes(imageId)) {
    pendingDeleteImageIds.value = [...pendingDeleteImageIds.value, imageId];
    message.success('图片已标记为删除，保存后生效');
    
    // 清除相关图片缓存，强制UI更新
    Object.keys(imgCache).forEach(key => {
      if (key.includes('oct_')) {
        delete imgCache[key];
      }
    });
    
    // 通知父组件预删除的图片ID列表
    emit('pending-delete-images', [...pendingDeleteImageIds.value]);
    
    // 触发UI更新（图片会从列表中消失）
    emit('update-image', {
      type: 'oct',
      deleted: false // 标记为预删除，不是真正删除
    });
  }
}

// 删除角膜地形图缩略图（第一张图片）- 预删除模式
function deleteTopoImage(eye) {
  console.log('[删除按钮] deleteTopoImage 被调用:', { eye, viewMode: props.viewMode });
  
  // 获取当前类型和眼睛的第一张图片
  const images = getTopoImages(eye);
  console.log('[删除按钮] 获取的图片列表:', { eye, imagesLength: images.length, images });
  
  if (images.length === 0) {
    message.warn('没有可删除的图片');
    return;
  }
  
  const firstImage = images[0];
  const imageId = firstImage.id;
  const imageUrl = firstImage.url;
  
  console.log('[删除按钮] 准备预删除图片:', { eye, imageId, imageUrl: firstImage.url });
  
  // 如果没有ID（可能是旧数据），使用URL标识
  if (!imageId) {
    // 检查是否已经标记为删除
    const oldImageKey = `topo_${eye}_${batchTab.value}_${imageUrl}`;
    if (pendingDeleteOldImages.value.some(item => item.key === oldImageKey)) {
      message.warn('该图片已标记为删除');
      return;
    }
    
    // 添加到旧图片预删除列表（不可变更新，触发 Vue 响应式）
    pendingDeleteOldImages.value = [...pendingDeleteOldImages.value, {
      key: oldImageKey,
      type: 'topo',
      eye: eye,
      batch: batchTab.value,
      url: imageUrl
    }];
    message.success('图片已标记为删除，保存后生效');
    
    // 清除相关图片缓存，强制UI更新
    Object.keys(imgCache).forEach(key => {
      if (key.includes('right_') || key.includes('left_') || key.includes('doble_')) {
        delete imgCache[key];
      }
    });
    
    // 通知父组件预删除的旧图片
    emit('pending-delete-old-images', [...pendingDeleteOldImages.value]);
    
    // 触发UI更新（图片会从列表中消失）
    emit('update-image', {
      type: 'topo',
      deleted: false // 标记为预删除，不是真正删除
    });
    return;
  }
  
  // 如果有ID，添加到预删除列表（不可变更新，触发 Vue 响应式）
  if (!pendingDeleteImageIds.value.includes(imageId)) {
    pendingDeleteImageIds.value = [...pendingDeleteImageIds.value, imageId];
    message.success('图片已标记为删除，保存后生效');
    
    // 清除相关图片缓存，强制UI更新
    Object.keys(imgCache).forEach(key => {
      if (key.includes('right_') || key.includes('left_') || key.includes('doble_')) {
        delete imgCache[key];
      }
    });
    
    // 通知父组件预删除的图片ID列表
    emit('pending-delete-images', [...pendingDeleteImageIds.value]);
    
    // 触发UI更新（图片会从列表中消失）
    emit('update-image', {
      type: 'topo',
      deleted: false // 标记为预删除，不是真正删除
    });
  }
}

// 删除其他检查图片 - 预删除模式
function deleteOtherImage(imageId) {
  if (!imageId) {
    message.warn('无法获取图片ID');
    return;
  }
  
  // 添加到预删除列表（不可变更新，触发 Vue 响应式）
  if (!pendingDeleteImageIds.value.includes(imageId)) {
    pendingDeleteImageIds.value = [...pendingDeleteImageIds.value, imageId];
    message.success('图片已标记为删除，保存后生效');
    
    // 清除相关图片缓存，强制UI更新
    Object.keys(imgCache).forEach(key => {
      if (key.includes('other_')) {
        delete imgCache[key];
      }
    });
    
    // 通知父组件预删除的图片ID列表
    emit('pending-delete-images', [...pendingDeleteImageIds.value]);
    
    // 触发UI更新（图片会从列表中消失）
    emit('update-image', {
      type: 'other',
      deleted: false // 标记为预删除，不是真正删除
    });
  }
}

// 删除当前预览图片 - 预删除模式
function deleteCurrentImage() {
  const currentImg = previewImageList.value[currentImageIndex.value];
  if (!currentImg) return;
  
  const imageId = typeof currentImg === 'string' ? null : currentImg.id;
  const imageUrl = typeof currentImg === 'string' ? currentImg : currentImg.url;
  
  // 如果没有ID（可能是旧数据），使用URL标识
  if (!imageId) {
    // 检查是否已经标记为删除
    const oldImageKey = `${previewImageType.value}_preview_${imageUrl}`;
    if (pendingDeleteOldImages.value.some(item => item.key === oldImageKey)) {
      message.warn('该图片已标记为删除');
      return;
    }
    
    // 添加到旧图片预删除列表（不可变更新，触发 Vue 响应式）
    pendingDeleteOldImages.value = [...pendingDeleteOldImages.value, {
      key: oldImageKey,
      type: previewImageType.value,
      url: imageUrl
    }];
    message.success('图片已标记为删除，保存后生效');
    
    // 清除相关图片缓存，强制UI更新
    Object.keys(imgCache).forEach(key => {
      delete imgCache[key]; // 清除所有缓存，确保UI更新
    });
    
    // 通知父组件预删除的旧图片
    emit('pending-delete-old-images', [...pendingDeleteOldImages.value]);
    
    // 从预览列表中移除当前图片
    previewImageList.value.splice(currentImageIndex.value, 1);
    
    // 如果列表为空，关闭预览
    if (previewImageList.value.length === 0) {
      previewVisible.value = false;
    } else {
      // 调整索引
      if (currentImageIndex.value >= previewImageList.value.length) {
        currentImageIndex.value = previewImageList.value.length - 1;
      }
      const img = previewImageList.value[currentImageIndex.value];
      previewImg.value = typeof img === 'string' ? img : img.url;
    }
    
    // 触发UI更新（图片会从列表中消失）
    emit('update-image', {
      type: previewImageType.value,
      deleted: false // 标记为预删除，不是真正删除
    });
    return;
  }
  
  // 如果有ID，添加到预删除列表（不可变更新，触发 Vue 响应式）
  if (!pendingDeleteImageIds.value.includes(imageId)) {
    pendingDeleteImageIds.value = [...pendingDeleteImageIds.value, imageId];
    message.success('图片已标记为删除，保存后生效');
    
    // 清除相关图片缓存，强制UI更新
    Object.keys(imgCache).forEach(key => {
      delete imgCache[key]; // 清除所有缓存，确保UI更新
    });
    
    // 通知父组件预删除的图片ID列表
    emit('pending-delete-images', [...pendingDeleteImageIds.value]);
    
    // 从预览列表中移除当前图片
    previewImageList.value.splice(currentImageIndex.value, 1);
    
    // 如果列表为空，关闭预览
    if (previewImageList.value.length === 0) {
      previewVisible.value = false;
    } else {
      // 调整索引
      if (currentImageIndex.value >= previewImageList.value.length) {
        currentImageIndex.value = previewImageList.value.length - 1;
      }
      const img = previewImageList.value[currentImageIndex.value];
      previewImg.value = typeof img === 'string' ? img : img.url;
    }
    
    // 触发UI更新（图片会从列表中消失）
    emit('update-image', {
      type: previewImageType.value,
      deleted: false // 标记为预删除，不是真正删除
    });
  }
}

function rotateImage(degrees) {
  rotationAngle.value = (rotationAngle.value + degrees) % 360;
}

function resetRotation() {
  rotationAngle.value = 0;
}

function zoomIn() {
  if (scale.value < 3) {
    scale.value = Math.min(3, scale.value + 0.25);
  }
}

function zoomOut() {
  if (scale.value > 0.25) {
    scale.value = Math.max(0.25, scale.value - 0.25);
  }
}

function resetZoom() {
  scale.value = 1;
}

function handleWheel(event) {
  event.preventDefault();
  const delta = event.deltaY;
  if (delta > 0) {
    zoomOut();
  } else {
    zoomIn();
  }
}

// 显示角膜地形图上传弹窗
const showTopographyUploadModal = () => {
  topographyUploadVisible.value = true;
  // 重置表单
  uploadForm.type = 'axial';
  uploadForm.eye = 'both';
  selectedFiles.value = [];
  if (topographyFileInput.value) {
    topographyFileInput.value.value = '';
  }
};

// 处理文件选择（支持多文件）
const handleTopographyFileChange = (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) {
    return;
  }
  
  // 先过滤和验证文件
  const validFiles = files.filter(file => {
    if (!file.type.startsWith('image/')) {
      message.error(`文件 ${file.name} 不是图片格式，已跳过`);
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error(`文件 ${file.name} 大小超过10MB，已跳过`);
      return false;
    }
    return true;
  });
  
  if (validFiles.length === 0) {
    if (topographyFileInput.value) {
      topographyFileInput.value.value = '';
    }
    return;
  }
  
  // 异步读取所有文件预览
  const filePromises = validFiles.map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          file: file,
          preview: e.target.result
        });
      };
      reader.onerror = () => {
        // 如果读取失败，仍然添加文件信息，但不提供预览
        resolve({
          file: file,
          preview: null
        });
      };
      reader.readAsDataURL(file);
    });
  });
  
  // 等待所有文件读取完成
  Promise.all(filePromises).then(fileInfos => {
    selectedFiles.value = [...selectedFiles.value, ...fileInfos];
  });
};

// 移除文件
const removeFile = (index) => {
  if (index < 0 || index >= selectedFiles.value.length) {
    return;
  }
  const fileInfo = selectedFiles.value[index];
  // 清理预览URL（data URL 不需要 revokeObjectURL）
  
  // 创建新数组以确保响应式更新
  const newFiles = [...selectedFiles.value];
  newFiles.splice(index, 1);
  selectedFiles.value = newFiles;
  
  // 如果文件列表为空，重置input
  if (selectedFiles.value.length === 0 && topographyFileInput.value) {
    topographyFileInput.value.value = '';
  }
};

// 清除所有文件
const clearAllFiles = () => {
  // 清理所有预览URL
  selectedFiles.value.forEach(fileInfo => {
    if (fileInfo.preview && fileInfo.preview.startsWith('data:')) {
      // data URL 不需要 revokeObjectURL
    }
  });
  selectedFiles.value = [];
  if (topographyFileInput.value) {
    topographyFileInput.value.value = '';
  }
};

// 取消上传
const handleTopographyUploadCancel = () => {
  topographyUploadVisible.value = false;
  // 清理预览URL，释放内存
  selectedFiles.value.forEach(fileInfo => {
    if (fileInfo.preview && fileInfo.preview.startsWith('data:')) {
      URL.revokeObjectURL(fileInfo.preview);
    }
  });
  selectedFiles.value = [];
  uploadForm.type = 'axial';
  uploadForm.eye = 'both';
  if (topographyFileInput.value) {
    topographyFileInput.value.value = '';
  }
};

// 上传角膜地形图（支持多文件）
const handleTopographyUpload = async () => {
  if (selectedFiles.value.length === 0) {
    message.error('请至少选择一张图片');
    return;
  }
  
  // 获取必要参数
  const organizationId = localStorage.getItem('organization_id');
  if (!organizationId) {
    message.error('无法获取机构ID，请重新登录');
    return;
  }
  
  // 获取患者gkid - 尝试多个可能的路径
  const gkid = props.record?.gkid || 
               props.record?.patient?.gkid || 
               props.patientInfo?.gkid;
  if (!gkid) {
    console.error('无法获取患者GKID，record:', props.record, 'patientInfo:', props.patientInfo);
    message.error('无法获取患者GKID，请检查患者信息是否完整');
    return;
  }
  
  // 获取检查日期，格式化为 YYYY-MM-DD
  let date = props.record?.examination_date;
  if (date) {
    // 如果是日期字符串，转换为 YYYY-MM-DD 格式
    if (typeof date === 'string') {
      date = dayjs(date).format('YYYY-MM-DD');
    } else if (date instanceof Date) {
      date = dayjs(date).format('YYYY-MM-DD');
    } else {
      date = dayjs(date).format('YYYY-MM-DD');
    }
  } else {
    date = dayjs().format('YYYY-MM-DD');
  }
  
  uploading.value = true;
  
  const csrftoken = localStorage.getItem('csrftoken');
  let successCount = 0;
  let failCount = 0;
  
  try {
    // 逐个上传文件
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const fileInfo = selectedFiles.value[i];
      
      try {
        // 创建 FormData
        const formData = new FormData();
        formData.append('file', fileInfo.file);
        formData.append('organization_id', organizationId);
        formData.append('gkid', gkid);
        formData.append('type', uploadForm.type);
        formData.append('eye', uploadForm.eye);
        formData.append('date', date);
        
        // 发送请求
        const response = await fetch('https://aiforoptometry.com/jt/medmontcorneal', {
          method: 'POST',
          headers: {
            'X-CSRFToken': csrftoken || ''
          },
          body: formData,
          credentials: 'include'
        });
        
        const result = await response.json();
        
        // 后端返回 success: true 表示上传成功
        if (response.ok && result.success === true) {
          successCount++;
        } else {
          failCount++;
          console.error(`上传 ${fileInfo.file.name} 失败:`, result);
        }
      } catch (error) {
        failCount++;
        console.error(`上传 ${fileInfo.file.name} 出错:`, error);
      }
    }
    
    // 显示上传结果
    if (successCount > 0) {
      if (failCount === 0) {
        message.success(`成功上传 ${successCount} 张图片`);
      } else {
        message.warning(`成功上传 ${successCount} 张，失败 ${failCount} 张`);
      }
      
      // 清理并关闭弹窗
      selectedFiles.value.forEach(fileInfo => {
        if (fileInfo.preview && fileInfo.preview.startsWith('data:')) {
          URL.revokeObjectURL(fileInfo.preview);
        }
      });
      topographyUploadVisible.value = false;
      selectedFiles.value = [];
      uploadForm.type = 'axial';
      uploadForm.eye = 'both';
      if (topographyFileInput.value) {
        topographyFileInput.value.value = '';
      }
      
      // 触发刷新数据事件
      emit('update-image', {
        type: 'topo',
        uploaded: true
      });
    } else {
      message.error(`所有图片上传失败`);
    }
  } catch (error) {
    console.error('上传角膜地形图失败:', error);
    message.error('上传失败: ' + (error.message || '网络错误，请稍后重试'));
  } finally {
    uploading.value = false;
  }
};

// ---------- 眼底照相上传弹窗 ----------
const showFundusUploadModal = () => {
  fundusUploadVisible.value = true;
  fundusUploadForm.eye = 'R';
  fundusSelectedFiles.value = [];
  if (fundusModalFileInput.value) fundusModalFileInput.value.value = '';
};

const handleFundusModalFileChange = (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;
  const validFiles = files.filter(file => {
    if (!file.type.startsWith('image/')) {
      message.warning(`已跳过非图片文件: ${file.name}`);
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.warning(`已跳过超过10MB的文件: ${file.name}`);
      return false;
    }
    return true;
  });
  if (validFiles.length === 0) {
    if (fundusModalFileInput.value) fundusModalFileInput.value.value = '';
    return;
  }
  const filePromises = validFiles.map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ file, preview: e.target.result });
      reader.onerror = () => resolve({ file, preview: null });
      reader.readAsDataURL(file);
    });
  });
  Promise.all(filePromises).then(fileInfos => {
    fundusSelectedFiles.value = [...fundusSelectedFiles.value, ...fileInfos];
  });
};

const removeFundusFile = (index) => {
  const newFiles = [...fundusSelectedFiles.value];
  newFiles.splice(index, 1);
  fundusSelectedFiles.value = newFiles;
  if (fundusSelectedFiles.value.length === 0 && fundusModalFileInput.value) {
    fundusModalFileInput.value.value = '';
  }
};

const clearFundusFiles = () => {
  fundusSelectedFiles.value = [];
  if (fundusModalFileInput.value) fundusModalFileInput.value.value = '';
};

const handleFundusUploadCancel = () => {
  fundusUploadVisible.value = false;
  fundusSelectedFiles.value = [];
  fundusUploadForm.eye = 'R';
  if (fundusModalFileInput.value) fundusModalFileInput.value.value = '';
};

const handleFundusUpload = async () => {
  if (fundusSelectedFiles.value.length === 0) {
    message.error('请至少选择一张图片');
    return;
  }
  const record = props.record;
  if (!record) return;
  if (!record.images) record.images = {};
  if (!Array.isArray(record.images.fundus)) record.images.fundus = [];

  fundusUploading.value = true;
  const eye = fundusUploadForm.eye; // 'R' | 'L' | 'B'
  let added = 0;

  try {
    for (let i = 0; i < fundusSelectedFiles.value.length; i++) {
      const fileInfo = fundusSelectedFiles.value[i];
      const url = fileInfo.preview || await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(fileInfo.file);
      });
      const item = { url, id: null, upload_time: new Date().toISOString() };
      if (eye === 'B') {
        record.images.fundus.push({ ...item, eye: 'R' });
        record.images.fundus.push({ ...item, eye: 'L' });
        added += 2;
      } else {
        record.images.fundus.push({ ...item, eye });
        added++;
      }
    }
    message.success(`已添加 ${added} 张眼底图片`);
    emit('update-image', { type: 'fundus', added: true });
    fundusUploadVisible.value = false;
    fundusSelectedFiles.value = [];
    fundusUploadForm.eye = 'R';
    if (fundusModalFileInput.value) fundusModalFileInput.value.value = '';
  } finally {
    fundusUploading.value = false;
  }
};

// ---------- 眼底OCT上传弹窗 ----------
const showOctUploadModal = () => {
  octUploadVisible.value = true;
  octUploadForm.eye = 'R';
  octSelectedFiles.value = [];
  if (octModalFileInput.value) octModalFileInput.value.value = '';
};

const handleOctModalFileChange = (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;
  const validFiles = files.filter(file => {
    if (!file.type.startsWith('image/')) {
      message.warning(`已跳过非图片文件: ${file.name}`);
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.warning(`已跳过超过10MB的文件: ${file.name}`);
      return false;
    }
    return true;
  });
  if (validFiles.length === 0) {
    if (octModalFileInput.value) octModalFileInput.value.value = '';
    return;
  }
  const filePromises = validFiles.map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ file, preview: e.target.result });
      reader.onerror = () => resolve({ file, preview: null });
      reader.readAsDataURL(file);
    });
  });
  Promise.all(filePromises).then(fileInfos => {
    octSelectedFiles.value = [...octSelectedFiles.value, ...fileInfos];
  });
};

const removeOctFile = (index) => {
  const newFiles = [...octSelectedFiles.value];
  newFiles.splice(index, 1);
  octSelectedFiles.value = newFiles;
  if (octSelectedFiles.value.length === 0 && octModalFileInput.value) {
    octModalFileInput.value.value = '';
  }
};

const clearOctFiles = () => {
  octSelectedFiles.value = [];
  if (octModalFileInput.value) octModalFileInput.value.value = '';
};

const handleOctUploadCancel = () => {
  octUploadVisible.value = false;
  octSelectedFiles.value = [];
  octUploadForm.eye = 'R';
  if (octModalFileInput.value) octModalFileInput.value.value = '';
};

const handleOctUpload = async () => {
  if (octSelectedFiles.value.length === 0) {
    message.error('请至少选择一张图片');
    return;
  }
  const record = props.record;
  if (!record) return;
  if (!record.images) record.images = {};
  if (!Array.isArray(record.images.oct)) record.images.oct = [];

  octUploading.value = true;
  const eye = octUploadForm.eye; // 'R' | 'L' | 'B'

  try {
    for (let i = 0; i < octSelectedFiles.value.length; i++) {
      const fileInfo = octSelectedFiles.value[i];
      const url = fileInfo.preview || await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(fileInfo.file);
      });
      record.images.oct.push({
        eye,
        url,
        id: null,
        upload_time: new Date().toISOString()
      });
    }
    const count = octSelectedFiles.value.length;
    message.success(`已添加 ${count} 张OCT图片`);
    emit('update-image', { type: 'oct', added: true });
    octUploadVisible.value = false;
    octSelectedFiles.value = [];
    octUploadForm.eye = 'R';
    if (octModalFileInput.value) octModalFileInput.value.value = '';
  } finally {
    octUploading.value = false;
  }
};

// 处理其他检查文件选择
const handleOtherFileChange = async (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) {
    return;
  }
  
  // 先过滤和验证文件
  const validFiles = files.filter(file => {
    if (!file.type.startsWith('image/')) {
      message.error(`文件 ${file.name} 不是图片格式，已跳过`);
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error(`文件 ${file.name} 大小超过10MB，已跳过`);
      return false;
    }
    return true;
  });
  
  if (validFiles.length === 0) {
    if (otherFileInput.value) {
      otherFileInput.value.value = '';
    }
    return;
  }
  
  // 获取必要参数
  const organizationId = localStorage.getItem('organization_id');
  if (!organizationId) {
    message.error('无法获取机构ID，请重新登录');
    if (otherFileInput.value) {
      otherFileInput.value.value = '';
    }
    return;
  }
  
  // 获取记录ID和患者ID
  const recordId = props.record?.id;
  const patientId = props.record?.patient_id || props.record?.patient?.id;
  
  if (!recordId) {
    message.error('无法获取检查记录ID');
    if (otherFileInput.value) {
      otherFileInput.value.value = '';
    }
    return;
  }
  
  if (!patientId) {
    message.error('无法获取患者ID');
    if (otherFileInput.value) {
      otherFileInput.value.value = '';
    }
    return;
  }
  
  const csrftoken = localStorage.getItem('csrftoken');
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  let successCount = 0;
  let failCount = 0;
  
  try {
    // 逐个上传文件
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      
      try {
        // 创建 FormData，按照用户提供的格式
        const formData = new FormData();
        
        // 添加文件（使用 "files" 作为字段名，后端会接收为数组）
        formData.append('files', file);
        
        // 添加其他参数
        formData.append('records_id', String(recordId));
        formData.append('patient_id', String(patientId));
        formData.append('organization_id', String(organizationId));
        formData.append('device', 'other'); // 图片类型：其他检查
        formData.append('eye_code', 'B'); // 双眼/整体（其他检查图片不区分左右眼）
        
        // 创建 updateData 对象（如果需要更新其他字段，可以在这里添加）
        const updateData = {};
        formData.append('data', JSON.stringify(updateData));
        
        // 发送请求
        const response = await fetch('https://aiforoptometry.com/medicalrecords/updaterecordspartial', {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'X-CSRFToken': csrftoken || '',
            // 注意：不要设置 Content-Type，让浏览器自动设置，以便正确设置 multipart/form-data 的 boundary
          },
          body: formData,
          credentials: 'include'
        });
        
        const result = await response.json();
        
        // 后端返回 success: true 或 code: 200 表示上传成功
        if (response.ok && (result.success === true || result.code === 200)) {
          successCount++;
        } else {
          failCount++;
          console.error(`上传 ${file.name} 失败:`, result);
        }
      } catch (error) {
        failCount++;
        console.error(`上传 ${file.name} 出错:`, error);
      }
    }
    
    // 显示上传结果
    if (successCount > 0) {
      if (failCount === 0) {
        message.success(`成功上传 ${successCount} 张图片`);
      } else {
        message.warning(`成功上传 ${successCount} 张，失败 ${failCount} 张`);
      }
      
      // 触发刷新数据事件
      emit('update-image', {
        type: 'other',
        uploaded: true
      });
    } else {
      message.error(`所有图片上传失败`);
    }
  } catch (error) {
    console.error('上传其他检查图片失败:', error);
    message.error('上传失败: ' + (error.message || '网络错误，请稍后重试'));
  } finally {
    // 重置input
    if (otherFileInput.value) {
      otherFileInput.value.value = '';
    }
  }
};
</script>

<style scoped lang="scss">
.img-exam-style-two {
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
  font-size: 18px;
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
  
  .section-title-text {
    flex: 1;
    text-align: left;
  }
  
  .section-title-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-right: 8px;
  }
  
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

// 批次标签（第一次/第二次/第三次）
.img-batch-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.batch-tab-item {
  flex: 1;
  padding: 6px 12px;
  text-align: center;
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  border: 1px solid #e0e6f5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e6f0ff;
    border-color: #224b96;
  }

  &.active {
    color: #fff;
    background: #224b96;
    border-color: #224b96;
    font-weight: 500;
  }
}


// 图片组
.img-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.img-block {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e0e6f5;
  border-radius: 4px;
  padding: 8px;
}

.img-label {
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: #224b96;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #e0e6f5;
}

.img-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 120px;
  justify-content: center;
}

.img-container-multi {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-height: 120px;
  justify-content: center;
  flex-wrap: wrap;
}

.img-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  position: relative;
}

.img-display {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  border: 1px solid #e0e6f5;
  background: #f5f5f5;
  object-fit: contain;
  cursor: pointer;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(34, 75, 150, 0.15);
  }
}

.img-label-text {
  font-size: 11px;
  color: #888;
  text-align: center;
}

.no-test {
  color: #ff7875;
  font-size: 13px;
  font-style: italic;
  padding: 20px;
}

.img-broken {
  width: 100%;
  min-height: 120px;
  max-height: 200px;
  border-radius: 4px;
  border: 2px dashed #ff7875;
  background: #fff5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(255, 120, 117, 0.15);
}

.img-broken-icon {
  font-size: 32px;
  opacity: 0.6;
}

.img-broken-text {
  font-size: 12px;
  color: #ff7875;
  font-weight: 500;
}

// OCT图册封面徽章样式
.oct-album-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 5px;
  pointer-events: none;
  backdrop-filter: blur(4px);
  z-index: 10;
}

.oct-album-icon {
  font-size: 14px;
}

.oct-album-count {
  font-size: 12px;
}

// 预览导航按钮
.preview-navigation {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
  padding: 0 20px;
  z-index: 1000;
}

.nav-btn {
  pointer-events: auto;
  width: 48px;
  height: 48px;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

// 预览弹窗样式
.preview-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px;
}

.preview-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1010;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.45);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
  &:hover {
    color: #fff;
    background: rgba(0, 0, 0, 0.65);
  }
}

.preview-toolbar {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

.preview-tips {
  font-size: 12px;
  color: #ccc;
  margin-bottom: 10px;
}

.preview-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
  min-height: 400px;
  
  // 鼠标悬停时显示删除按钮
  &:hover .preview-delete-btn {
    opacity: 1;
    visibility: visible;
  }
}

.preview-image {
  max-width: 90vw;
  max-height: 80vh;
  display: block;
  margin: auto;
  object-fit: contain;
}

// 响应式：A4宽度限制
@media print {
  .img-group {
    flex-direction: column;
  }
  
  .img-block {
    width: 100%;
  }
  
  .img-display {
    max-height: 150px;
  }
}

// 上传按钮样式
.img-upload-btn {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.upload-button {
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.title-upload-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  height: 28px;
  padding: 0 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  }
}

.upload-form {
  padding: 16px 0;
  
  .form-item {
    margin-bottom: 20px;
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }
  }
  
  .file-select-row {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .clear-all-btn {
      white-space: nowrap;
    }
  }
  
  .file-count-info {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
  }
  
  .file-preview-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 12px;
  }
  
  .file-preview-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100px;
  }
  
  .file-thumbnail {
    position: relative;
    width: 100px;
    height: 100px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    background: #f5f5f5;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .file-no-preview {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 12px;
    }
    
    .file-remove {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 24px;
      height: 24px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      line-height: 1;
      transition: all 0.2s;
      user-select: none;
      
      &:hover {
        background: rgba(255, 0, 0, 0.9);
        transform: scale(1.1);
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
  }
  
  .file-name {
    font-size: 12px;
    color: #666;
    text-align: center;
    word-break: break-all;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.img-item {
  position: relative;
}

.img-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  // 鼠标悬停时显示删除按钮
  &:hover .img-delete-btn {
    opacity: 1;
    visibility: visible;
  }
}

.img-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 100;
  min-width: 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.5);
  background-color: #ff4d4f !important;
  border-color: #ff4d4f !important;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s, transform 0.2s;
  
  &:hover {
    background-color: #ff7875 !important;
    border-color: #ff7875 !important;
    transform: scale(1.1);
  }
}

.preview-delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2000;
  min-width: 40px;
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.5);
  background-color: #ff4d4f !important;
  border-color: #ff4d4f !important;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s, transform 0.2s;
  
  &:hover {
    background-color: #ff7875 !important;
    border-color: #ff7875 !important;
    transform: scale(1.1);
  }
}

// 其他检查网格布局
.other-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e0e6f5;
  border-radius: 4px;
}

.other-image-item {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e0e6f5;
  background: #f5f5f5;
  
  .img-display {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
    transition: box-shadow 0.2s;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(34, 75, 150, 0.15);
    }
  }
  
  .img-broken {
    width: 100%;
    height: 100%;
    min-height: 150px;
    border-radius: 4px;
    border: 2px dashed #ff7875;
    background: #fff5f5;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(255, 120, 117, 0.15);
  }
}
</style>

