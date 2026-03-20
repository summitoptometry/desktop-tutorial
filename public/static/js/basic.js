// 在文件最开头添加
console.log("basic.js 被加载");

// 设置模块名
window.currentModule = 'basic';

// 监听检查记录更新事件
window.addEventListener("currentExaminationRecordUpdated", (event) => {
    // 检查当前模块是否为 basic
    if (window.currentModule !== 'basic') {
        return;
    }

    if (event.detail && event.detail.record) {
        window.currentExaminationRecord = event.detail.record;
        refreshBasicExaminationPage();
    }
});

// 创建预览模态框
function createImagePreviewModal() {
    if (!document.getElementById('imagePreviewModal')) {
        const modal = document.createElement('div');
        modal.id = 'imagePreviewModal';
        modal.className = 'image-preview-modal';
        modal.innerHTML = `
            <span class="preview-close">&times;</span>
            <img class="preview-image" src="" alt="预览图片">
        `;
        document.body.appendChild(modal);

        // 添加关闭事件
        const closeBtn = modal.querySelector('.preview-close');
        closeBtn.onclick = closePreview;
        modal.onclick = (e) => {
            if (e.target === modal) {
                closePreview();
            }
        };
    }
}

// 打开预览
function openPreview(imageSrc) {
    const modal = document.getElementById('imagePreviewModal');
    const previewImage = modal.querySelector('.preview-image');
    previewImage.src = imageSrc;
    modal.style.display = 'block';
    previewImage.classList.add('zoom-in');
    document.addEventListener('keydown', handleEscKey);
}

// 关闭预览
function closePreview() {
    const modal = document.getElementById('imagePreviewModal');
    const previewImage = modal.querySelector('.preview-image');
    previewImage.classList.remove('zoom-in');
    previewImage.classList.add('zoom-out');

    setTimeout(() => {
        modal.style.display = 'none';
        previewImage.classList.remove('zoom-out');
    }, 300);

    document.removeEventListener('keydown', handleEscKey);
}

// ESC 键关闭预览
function handleEscKey(e) {
    if (e.key === 'Escape') {
        closePreview();
    }
}

// 刷新基础检查页面的函数
function refreshBasicExaminationPage() {
    createImagePreviewModal();

    console.log("开始刷新基础检查页面的数据...");
    console.log("当前检查记录:", window.currentExaminationRecord);

    if (!window.currentExaminationRecord) {
        console.error("当前检查记录不存在！");
        return;
    }

    // 重置所有图片容器的显示状态
    resetImageContainers();

    // 更新眼底照相
    updateImage('fundusPhotoLeft', window.currentExaminationRecord.fundus_photo_left_path);
    updateImage('fundusPhotoRight', window.currentExaminationRecord.fundus_photo_right_path);

    // 更新角膜地形图
    updateCornealTopographySection();

    console.log("基础检查页面刷新完成");
}

// 重置所有图片容器的显示状态
function resetImageContainers() {
    // 重置眼底照相图片
    const fundusPhotos = ['fundusPhotoLeft', 'fundusPhotoRight'];
    fundusPhotos.forEach(id => {
        const imgElement = document.getElementById(id);
        if (imgElement) {
            imgElement.style.display = 'block'; // 显示图片元素
            imgElement.src = ''; // 清空图片源
            imgElement.onclick = null; // 移除点击事件
            imgElement.style.cursor = 'default';
            // 移除可能存在的 "无" 文本
            const noImageText = imgElement.nextElementSibling;
            if (noImageText?.classList.contains('no-image-text')) {
                noImageText.remove();
            }
        }
    });

    // 重置角膜地形图容器
    const topographyContainer = document.querySelector('.corneal-topography-container');
    if (topographyContainer) {
        // 保留标题，清空其他内容
        topographyContainer.innerHTML = '<h3>角膜地形图</h3>';
    }
}

// 更新图片的函数
function updateImage(elementId, imagePath) {
    const imgElement = document.getElementById(elementId);
    if (imgElement) {
        if (imagePath) {
            const fullUrl = 'https://aiforoptometry.com' + imagePath;
            imgElement.style.display = 'block'; // 确保图片可见
            imgElement.src = fullUrl;
            imgElement.onclick = () => openPreview(fullUrl);
            imgElement.style.cursor = 'pointer';
            // 移除可能存在的 "无" 文本
            imgElement.nextElementSibling?.remove();
        } else {
            // 如果没有图片，显示 "无"
            imgElement.style.display = 'none'; // 隐藏图片元素
            if (!imgElement.nextElementSibling?.classList.contains('no-image-text')) {
                const noImageText = document.createElement('div');
                noImageText.textContent = '无';
                noImageText.classList.add('no-image-text');
                noImageText.style.textAlign = 'center';
                noImageText.style.padding = '20px';
                noImageText.style.color = '#999';
                imgElement.parentNode.appendChild(noImageText);
            }
        }
    }
}

// 更新角膜地形图部分
function updateCornealTopographySection() {
    const record = window.currentExaminationRecord;
    const baseUrl = 'https://aiforoptometry.com';
    const topographyContainer = document.querySelector('.corneal-topography-container');

    // 首先检查是否有任何角膜地形图
    const examGroups = ['First', 'Second', 'Third'];
    let hasAnyTopography = examGroups.some(suffix => {
        return ['left', 'right', 'doble'].some(type => {
            const path = record[`${type}_corneal_topography_${suffix.toLowerCase()}`];
            return path && path.length > 0;
        });
    });

    // 如果没有任何角膜地形图，显示 "无"
    if (!hasAnyTopography) {
        topographyContainer.innerHTML = `
            <h3>角膜地形图</h3>
            <div class="no-image-text">无</div>
        `;
        return; // 提前返回，不继续处理
    }

    // 如果有图片，重建完整的 HTML 结构
    topographyContainer.innerHTML = `
        <h3>角膜地形图</h3>
        <!-- 第一次检查 -->
        <div class="corneal-exam-group" id="firstCornealExam">
            <div class="photo-group">
                <div class="photo-item" id="leftFirst" style="display: none;">
                    <label>左眼</label>
                    <img id="leftCornealTopographyFirst" src="" alt="左眼角膜地形图">
                </div>
                <div class="photo-item" id="rightFirst" style="display: none;">
                    <label>右眼</label>
                    <img id="rightCornealTopographyFirst" src="" alt="右眼角膜地形图">
                </div>
                <div class="photo-item" id="doubleFirst" style="display: none;">
                    <label>双眼</label>
                    <img id="doubleCornealTopographyFirst" src="" alt="双眼角膜地形图">
                </div>
            </div>
        </div>

        <!-- 第二次检查 -->
        <div class="corneal-exam-group" id="secondCornealExam" style="display: none;">
            <h4>第二次检查</h4>
            <div class="photo-group">
                <div class="photo-item" id="leftSecond" style="display: none;">
                    <label>左眼</label>
                    <img id="leftCornealTopographySecond" src="" alt="左眼角膜地形图">
                </div>
                <div class="photo-item" id="rightSecond" style="display: none;">
                    <label>右眼</label>
                    <img id="rightCornealTopographySecond" src="" alt="右眼角膜地形图">
                </div>
                <div class="photo-item" id="doubleSecond" style="display: none;">
                    <label>双眼</label>
                    <img id="doubleCornealTopographySecond" src="" alt="双眼角膜地形图">
                </div>
            </div>
        </div>

        <!-- 第三次检查 -->
        <div class="corneal-exam-group" id="thirdCornealExam" style="display: none;">
            <h4>第三次检查</h4>
            <div class="photo-group">
                <div class="photo-item" id="leftThird" style="display: none;">
                    <label>左眼</label>
                    <img id="leftCornealTopographyThird" src="" alt="左眼角膜地形图">
                </div>
                <div class="photo-item" id="rightThird" style="display: none;">
                    <label>右眼</label>
                    <img id="rightCornealTopographyThird" src="" alt="右眼角膜地形图">
                </div>
                <div class="photo-item" id="doubleThird" style="display: none;">
                    <label>双眼</label>
                    <img id="doubleCornealTopographyThird" src="" alt="双眼角膜地形图">
                </div>
            </div>
        </div>
    `;

    // 处理三次检查的数据
    examGroups.forEach((suffix, index) => {
        const images = {
            left: record[`left_corneal_topography_${suffix.toLowerCase()}`],
            right: record[`right_corneal_topography_${suffix.toLowerCase()}`],
            double: record[`doble_corneal_topography_${suffix.toLowerCase()}`]
        };

        // 检查是否有图片
        const hasImages = Object.values(images).some(img => img);
        if (hasImages) {
            if (index > 0) {
                document.getElementById(`${suffix.toLowerCase()}CornealExam`).style.display = 'block';
            }
            updateExamGroup(suffix, images);
        }
    });
}

// 更新检查组的函数
function updateExamGroup(suffix, images) {
    const baseUrl = 'https://aiforoptometry.com';
    ['left', 'right', 'double'].forEach(type => {
        if (images[type]) {
            const containerId = `${type}${suffix}`;
            const container = document.getElementById(containerId);
            const imageId = `${type}CornealTopography${suffix}`;

            // 添加错误处理
            if (!container) {
                console.warn(`未找到容器元素: ${containerId}`);
                return;
            }

            container.style.display = 'block';
            updateCornealTopography(imageId, baseUrl + images[type]);
        }
    });
}

// 更新角膜地形图的函数
function updateCornealTopography(elementId, fullUrl) {
    const imgElement = document.getElementById(elementId);
    if (!imgElement) {
        console.warn(`未找到图片元素: ${elementId}`);
        return;
    }

    imgElement.src = fullUrl;
    imgElement.onclick = () => openPreview(fullUrl);
    imgElement.style.cursor = 'pointer';

    // 移除可能存在的 "无" 文本
    imgElement.nextElementSibling?.remove();
}
