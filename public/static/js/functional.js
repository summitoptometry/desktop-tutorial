// functional.js

// 初始化功能页面，获取并渲染初始数据
function initializeFunctionalPage() {
    renderfunctionalData(); // 首次渲染数据

    // 监听数据变化事件
    window.addEventListener("currentExaminationRecordUpdated", () => {
        renderfunctionalData(); // 数据更新后重新渲染功能页面
    });
}

// 渲染功能页面数据的函数
function renderfunctionalData() {
    if (window.currentExaminationRecord) {
        console.log("当前检查记录数据(视功能):", window.currentExaminationRecord);
        fillfunctionalPageData(window.currentExaminationRecord);
    }
}

// 填充检查记录页面的数据（显示为文本）
function fillfunctionalPageData(record) {
    document.getElementById("distance_prism").innerText = formatValue(record.pli_exo_distance_lateral_phoria || record.plo_eso_distance_lateral_phoria, "prism");
    document.getElementById("near_prism").innerText = formatValue(record.pli_exo_near_lateral_phoria || record.plo_eso_near_lateral_phoria, "prism");

    // 填充其他字段
    document.getElementById("fusional_convergence_distance_blur").innerText = formatValue(record.fusional_convergence_distance_blur);
    document.getElementById("fusional_convergence_distance_break").innerText = formatValue(record.fusional_convergence_distance_break);
    document.getElementById("fusional_convergence_distance_recovery").innerText = formatValue(record.fusional_convergence_distance_recovery);
    document.getElementById("fusional_disvergence_distance_blur").innerText = formatValue(record.fusional_disvergence_distance_blur);
    document.getElementById("fusional_disvergence_distance_break").innerText = formatValue(record.fusional_disvergence_distance_break);
    document.getElementById("fusional_disvergence_distance_recovery").innerText = formatValue(record.fusional_disvergence_distance_recovery);

    document.getElementById("accommodation_sensitivity_right").innerText = formatValue(record.accommodation_sensitivity_right);
    document.getElementById("right_near_point_of_accommodation_distance").innerText = formatValue(record.right_near_point_of_accommodation_distance);

    document.getElementById("fusional_convergence_near_blur").innerText = formatValue(record.fusional_convergence_near_blur);
    document.getElementById("fusional_convergence_near_break").innerText = formatValue(record.fusional_convergence_near_break);
    document.getElementById("fusional_convergence_near_recovery").innerText = formatValue(record.fusional_convergence_near_recovery);
    document.getElementById("fusional_disvergence_near_blur").innerText = formatValue(record.fusional_disvergence_near_blur);
    document.getElementById("fusional_disvergence_near_break").innerText = formatValue(record.fusional_disvergence_near_break);
    document.getElementById("fusional_disvergence_near_recovery").innerText = formatValue(record.fusional_disvergence_near_recovery);

    document.getElementById("accommodation_sensitivity_left").innerText = formatValue(record.accommodation_sensitivity_left);
    document.getElementById("left_near_point_of_accommodation_distance").innerText = formatValue(record.left_near_point_of_accommodation_distance);

    document.getElementById("near_point_of_convergence_distance").innerText = formatValue(record.near_point_of_convergence_distance);
    document.getElementById("near_point_of_convergence_ma").innerText = formatValue(record.near_point_of_convergence_ma);
    document.getElementById("near_point_of_convergence_prism").innerText = formatValue(record.near_point_of_convergence_prism);
    document.getElementById("accommodation_sensitivity_both").innerText = formatValue(record.accommodation_sensitivity_both);
    document.getElementById("near_point_of_accommodation_distance").innerText = formatValue(record.near_point_of_accommodation_distance);

    document.getElementById("negative_relative_accommodation_blur").innerText = formatValue(record.negative_relative_accommodation_blur);
    document.getElementById("negative_relative_accommodation_recovery").innerText = formatValue(record.negative_relative_accommodation_recovery);
    document.getElementById("positive_relative_accommodation_blur").innerText = formatValue(record.positive_relative_accommodation_blur);
    document.getElementById("positive_relative_accommodation_recovery").innerText = formatValue(record.positive_relative_accommodation_recovery);
}


// 格式化数值，确保添加正确的符号并保留小数位
function formatValue(value, type = "default") {
    if (value == null || value === '') return ''; // 如果值为空，直接返回空字符串

    // 确保字符串中没有多余的空格
    value = value.toString().trim();

    // 检查是否已经带符号
    if (value.startsWith('+') || value.startsWith('-')) {
        return value; // 如果已经有符号，直接返回原值
    }

    // 根据类型添加符号
    if (type === "prism") {
        // 对于眼位：exo 类型加负号，eso 类型加正号
        return value.includes("exo") ? `-${value}` : `+${value}`;
    } else {
        // 默认：正数加正号，负数保持不变
        return `+${value}`;
    }
}


// 进入编辑模式
function enterfunctionalEditMode() {
    const fields = document.querySelectorAll(".editable-cell");
    fields.forEach(cell => {
        const text = cell.innerText; // 获取当前文本内容
        cell.innerHTML = `<input type="text" value="${text.replace(/^(\+|-)/, '')}" style="width: 100%;">`; // 转换为输入框，去掉符号
    });
    toggleButtons(true);
}

// 退出编辑模式并还原内容
function exitfunctionalEditMode() {
    renderfunctionalData(); // 重新渲染文本模式的数据
    toggleButtons(false);
}

// 保存数据
function saveChanges() {
    const updatedRecord = {
        id: window.currentExaminationRecord.id,
        distance_prism: getInputValue("distance_prism"),
        near_prism: getInputValue("near_prism"),
        fusional_convergence_distance_blur: getInputValue("fusional_convergence_distance_blur"),
        fusional_convergence_distance_break: getInputValue("fusional_convergence_distance_break"),
        fusional_convergence_distance_recovery: getInputValue("fusional_convergence_distance_recovery"),
        fusional_disvergence_distance_blur: getInputValue("fusional_disvergence_distance_blur"),
        fusional_disvergence_distance_break: getInputValue("fusional_disvergence_distance_break"),
        fusional_disvergence_distance_recovery: getInputValue("fusional_disvergence_distance_recovery"),
        accommodation_sensitivity_right: getInputValue("accommodation_sensitivity_right"),
        right_near_point_of_accommodation_distance: getInputValue("right_near_point_of_accommodation_distance"),
        fusional_convergence_near_blur: getInputValue("fusional_convergence_near_blur"),
        fusional_convergence_near_break: getInputValue("fusional_convergence_near_break"),
        fusional_convergence_near_recovery: getInputValue("fusional_convergence_near_recovery"),
        fusional_disvergence_near_blur: getInputValue("fusional_disvergence_near_blur"),
        fusional_disvergence_near_break: getInputValue("fusional_disvergence_near_break"),
        fusional_disvergence_near_recovery: getInputValue("fusional_disvergence_near_recovery"),
        accommodation_sensitivity_left: getInputValue("accommodation_sensitivity_left"),
        left_near_point_of_accommodation_distance: getInputValue("left_near_point_of_accommodation_distance"),
        near_point_of_convergence_distance: getInputValue("near_point_of_convergence_distance"),
        near_point_of_convergence_ma: getInputValue("near_point_of_convergence_ma"),
        near_point_of_convergence_prism: getInputValue("near_point_of_convergence_prism"),
        accommodation_sensitivity_both: getInputValue("accommodation_sensitivity_both"),
        near_point_of_accommodation_distance: getInputValue("near_point_of_accommodation_distance"),
        negative_relative_accommodation_blur: getInputValue("negative_relative_accommodation_blur"),
        negative_relative_accommodation_recovery: getInputValue("negative_relative_accommodation_recovery"),
        positive_relative_accommodation_blur: getInputValue("positive_relative_accommodation_blur"),
        positive_relative_accommodation_recovery: getInputValue("positive_relative_accommodation_recovery")
    };

    fetch('https://aiforoptometry.com/medicalrecords/recordsedit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord)
    })
    .then(response => response.json())
    .then(data => {
        // 检查后端返回的字段 "检查记录更新成功"
        if (data.status_code === 200) {
            // 更新页面数据
            window.currentExaminationRecord = { ...window.currentExaminationRecord, ...updatedRecord };
            alert("更新成功！");
            renderfunctionalData(); // 刷新页面显示
        } else {
            alert("更新失败！"); // 如果没有返回成功，提示更新失败
        }
        // 退出编辑模式
        exitfunctionalEditMode();
    })
    .catch(error => {
        console.error("更新失败:", error);
        alert("更新失败！");
        exitfunctionalEditMode();
    });
    
}

// 从输入框中获取值并确保符号保持正确
function getInputValue(id) {
    const value = document.getElementById(id).querySelector("input").value;
    return value.startsWith("-") || value.startsWith("+") ? value : `+${value}`;
}

// 切换按钮显示状态
function toggleButtons(isEditing) {
    document.getElementById("editfunctionalButton").style.display = isEditing ? "none" : "inline";
    document.getElementById("savefunctionalButton").style.display = isEditing ? "inline" : "none";
    document.getElementById("cancelfunctionalButton").style.display = isEditing ? "inline" : "none";
}
