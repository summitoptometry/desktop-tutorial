// treatment.js

// 全局变量，用于保存原始数据
let originalRecord = {};
document.addEventListener('DOMContentLoaded', function () {
document.getElementById('sync_eyes').checked = false;
// 监听period变化事件
document.getElementById("period").addEventListener("change", updateReviewDate);

// 监听examination_date变化事件
document.getElementById("examination_date").addEventListener("input", updateReviewDate);


})





// 初始化页面，获取并渲染初始数据
function initializeTreatmentPage() {
    rendertreatmentData(); // 首次渲染数据

    // 监听数据变化事件
    window.addEventListener("currentExaminationRecordUpdated", () => {
        rendertreatmentData(); // 数据更新后重新渲染功能页面
    });
}

// 渲染功能页面数据的函数
function rendertreatmentData() {
    if (window.currentExaminationRecord) {
        // 打印输出 window.currentExaminationRecord
        console.log("当前检查记录数据（方案）:", window.currentExaminationRecord);

        // 填充检查记录页面的数据
        filltreatmentPageData(window.currentExaminationRecord);
    }

}

// 填充检查记录页面数据的函数（示例）
function filltreatmentPageData(record) {
    console.log("填充检查记录数据:", record);

    // 填充数据到右眼和左眼的字段
    document.getElementById("right_hg").value = formatValue(record.right_hg);
    document.getElementById("right_hg_dw").value = formatValue(record.right_hg_dw);
    document.getElementById("right_glasses").value = formatValue(record.right_glasses);
    document.getElementById("right_glasses_pp").value = formatValue(record.right_glasses_pp);
    document.getElementById("right_atropine").value = formatValue(record.right_atropine);
    document.getElementById("right_visual_training").value = formatValue(record.right_visual_training);
    document.getElementById("right_physiotherapy").value = formatValue(record.right_physiotherapy);
    document.getElementById("uva_right_vision").value = formatValue(record.uva_right_vision);
    document.getElementById("vaec_right_old_vision").value = formatValue(record.vaec_right_old_vision);

    document.getElementById("left_hg").value = formatValue(record.left_hg);
    document.getElementById("left_hg_dw").value = formatValue(record.left_hg_dw);
    document.getElementById("left_glasses").value = formatValue(record.left_glasses);
    document.getElementById("left_glasses_pp").value = formatValue(record.left_glasses_pp);
    document.getElementById("left_atropine").value = formatValue(record.left_atropine);
    document.getElementById("left_visual_training").value = formatValue(record.left_visual_training);
    document.getElementById("left_physiotherapy").value = formatValue(record.left_physiotherapy);
    document.getElementById("uva_left_vision").value = formatValue(record.uva_left_vision);
    document.getElementById("vaec_left_old_vision").value = formatValue(record.vaec_left_old_vision);

    document.getElementById("uva_both_vision").value = formatValue(record.uva_both_vision);
    document.getElementById("vaec_both_old_vision").value = formatValue(record.vaec_both_old_vision);

    // 填充身高和体重
    document.getElementById("height").value = formatValue(record.height);
    document.getElementById("weight").value = formatValue(record.weight);

    // 填充检查日期和下次检查日期
    document.getElementById("examination_date").value = formatValue(record.examination_date);
    document.getElementById("review_date").value = formatValue(record.review_date);

    // 填充检查间隔
    fillPeriod(record.examination_date, record.review_date);

    // 启用左眼相关字段
    enableLeftEyeFields();

    // 填充治疗方案相关字段
    if (record.right_glasses && record.right_glasses !== '否') {
        updateTreatmentOptions('right');
        document.getElementById('right_glasses_pp').value = record.right_glasses_pp || '';
    }

    if (record.left_glasses && record.left_glasses !== '否') {
        updateTreatmentOptions('left');
        document.getElementById('left_glasses_pp').value = record.left_glasses_pp || '';
    }

    if (record.right_hg && record.right_hg !== '否') {
        updateTreatmentOptions('right');
        document.getElementById('right_hg_dw').value = record.right_hg_dw || '';
    }

    if (record.left_hg && record.left_hg !== '否') {
        updateTreatmentOptions('left');
        document.getElementById('left_hg_dw').value = record.left_hg_dw || '';
    }

    // 禁用所有输入框和选择器
    disableAllInputs();
}

// 计算并填充检查间隔
function fillPeriod(examination_date, review_date) {
    const examinationDate = new Date(examination_date);
    const reviewDate = new Date(review_date);

    // 计算两个日期之间的差异（单位：天）
    const diffTime = reviewDate - examinationDate;
    const diffDays = diffTime / (1000 * 3600 * 24); // 转换为天数

    // 计算检查间隔（以月为单位）
    const diffMonths = Math.floor(diffDays / 30);

    // 填充检查间隔字段
    let periodValue = '0'; // 默认值是自定义
    if (diffMonths === 1) {
        periodValue = '1'; // 一个月
    } else if (diffMonths === 2) {
        periodValue = '2'; // 两个月
    } else if (diffMonths === 3) {
        periodValue = '3'; // 三个月
    } else {
        periodValue = '0'; // 自定义
    }

    document.getElementById("period").value = periodValue;
}

// 启用左眼相关字段
function enableLeftEyeFields() {
    // 使左眼字段可用，解除禁用状态
    document.getElementById("left_atropine").disabled = false;
    document.getElementById("left_glasses").disabled = false;
    document.getElementById("left_glasses_pp").disabled = false;
    document.getElementById("left_hg").disabled = false;
    document.getElementById("left_hg_dw").disabled = false;
    document.getElementById("left_physiotherapy").disabled = false;
    document.getElementById("left_visual_training").disabled = false;
}

// 格式化值，确保不会填充空值
function formatValue(value) {
    // 如果值是 null 或 undefined，返回空字符串或默认值
    if (value === null || value === undefined) {
        return '';
    }
    return value.toString(); // 确保返回字符串
}





// 双眼同步相关逻辑
function syncEyes() {
    const rightFields = {
        'right_atropine': 'left_atropine',
        'right_glasses': 'left_glasses',
        'right_hg': 'left_hg',
        'right_physiotherapy': 'left_physiotherapy',
        'right_visual_training': 'left_visual_training',
        'right_glasses_pp': 'left_glasses_pp',
        'right_hg_dw': 'left_hg_dw'
    };

    for (const [rightField, leftField] of Object.entries(rightFields)) {
        const rightValue = document.getElementById(rightField).value;
        document.getElementById(leftField).value = rightValue;
    }
    updateTreatmentOptions('left');
console.log('右眼数据:', {
    right_atropine: document.getElementById('right_atropine').value,
    right_glasses: document.getElementById('right_glasses').value,
    right_hg: document.getElementById('right_hg').value,
    right_physiotherapy: document.getElementById('right_physiotherapy').value,
    right_visual_training: document.getElementById('right_visual_training').value,
    right_glasses_pp: document.getElementById('right_glasses_pp').value,
    right_hg_dw: document.getElementById('right_hg_dw').value
});

console.log('左眼数据:', {
    left_atropine: document.getElementById('left_atropine').value,
    left_glasses: document.getElementById('left_glasses').value,
    left_hg: document.getElementById('left_hg').value,
    left_physiotherapy: document.getElementById('left_physiotherapy').value,
    left_visual_training: document.getElementById('left_visual_training').value,
    left_glasses_pp: document.getElementById('left_glasses_pp').value,
    left_hg_dw: document.getElementById('left_hg_dw').value
});


    document.getElementById('left_glasses_pp').value = document.getElementById('right_glasses_pp').value;
    document.getElementById('left_hg_dw').value = document.getElementById('right_hg_dw').value;
}

function toggleSync() {
    const syncEnabled = document.getElementById('sync_eyes').checked;

    const leftFields = ['left_atropine', 'left_glasses', 'left_hg', 'left_physiotherapy', 'left_visual_training'];
    const leftGlassesPP = document.getElementById('left_glasses_pp');
    const leftHgDW = document.getElementById('left_hg_dw');

    leftFields.forEach(field => {
        document.getElementById(field).disabled = syncEnabled;
    });
    leftGlassesPP.disabled = syncEnabled;
    leftHgDW.disabled = syncEnabled;

    if (syncEnabled) {
        syncEyes(); // 勾选后立即同步

        // 当右眼数据变化时，同步到左眼
        document.getElementById('right_glasses').onchange = () => {
            updateTreatmentOptions('right');
            syncEyes();
        };
        document.getElementById('right_hg').onchange = () => {
            updateTreatmentOptions('right');
            syncEyes();
        };
        document.getElementById('right_glasses_pp').onchange = syncEyes;
        document.getElementById('right_hg_dw').onchange = syncEyes;
        document.getElementById('right_atropine').onchange = syncEyes;
        document.getElementById('right_physiotherapy').onchange = syncEyes;
        document.getElementById('right_visual_training').onchange = syncEyes;
    } else {
        leftFields.forEach(field => {
            document.getElementById(field).disabled = false;
        });
        leftGlassesPP.disabled = false;
        leftHgDW.disabled = false;

        // 在取消同步时，解除右眼的变化绑定
        document.getElementById('left_glasses').onchange = () => updateTreatmentOptions('left');
        document.getElementById('left_hg').onchange = () => updateTreatmentOptions('left');
    }
}

function updateTreatmentOptions(eye) {
    const glassesSelector = document.getElementById(`${eye}_glasses`);
    const glassesPPSelector = document.getElementById(`${eye}_glasses_pp`);
    const hgSelector = document.getElementById(`${eye}_hg`);
    const hgDWSelector = document.getElementById(`${eye}_hg_dw`);

    const glassesValue = glassesSelector.value;
    const hgValue = hgSelector.value;

    const previousGlassesPPValue = glassesPPSelector.value;
    const previousHgDWValue = hgDWSelector.value;

    const glassesPPOptions = {
        '离焦镜': ['星趣控', '新乐学', '轻松控','爱眼星','成长乐','小乐园'],
        '点扩散': ['控优点', '爱眼星'],
        'OK镜': ['亨泰', '普诺瞳', 'CRT', '阿尔法', '露晰德', '欧几里德', '梦戴维'],
        '离焦软镜': ['misight', '蝶适'],
        'RGP': ['目力康', '菲仕康'],
        '单光镜': ['蔡司', '依视路', '国产'],
        '渐近镜': ['蔡司', '依视路', '国产'],
        '双效离焦点扩散': ['格林视通', '爱眼星']
    };

    glassesPPSelector.innerHTML = '';
    if (glassesValue !== '否' && glassesPPOptions[glassesValue]) {
        glassesPPSelector.style.display = 'inline-block';
        glassesPPOptions[glassesValue].forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.innerText = option;
            glassesPPSelector.appendChild(opt);
        });
        glassesPPSelector.value = glassesPPOptions[glassesValue].includes(previousGlassesPPValue)
            ? previousGlassesPPValue
            : glassesPPOptions[glassesValue][0];
    } else {
        glassesPPSelector.style.display = 'none';
    }

    const hgDWOptions = {
        '唯迪科': [0,3, 6, 9, 12, 15],
        '小太阳': [0,1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15]
    };

    hgDWSelector.innerHTML = '';
    if (hgValue !== '否' && hgDWOptions[hgValue]) {
        hgDWSelector.style.display = 'inline-block';
        hgDWOptions[hgValue].forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.innerText = option;
            hgDWSelector.appendChild(opt);
        });
        hgDWSelector.value = hgDWOptions[hgValue].includes(previousHgDWValue)
            ? previousHgDWValue
            : hgDWOptions[hgValue][0];
    } else {
        hgDWSelector.style.display = 'none';
    }
}

// 启用编辑模式
function starttreatmentEdit() {
    // 1. 启用所有输入框和选择器
    enableAllInputs();

    // 2. 强制将sync_eyes元素的checked设置为true
    const syncEyes = document.getElementById("sync_eyes");
    if (syncEyes) {
        syncEyes.checked = true;  // 强制刷新为true
    }
    toggleSync();

    // 3. 隐藏编辑按钮，显示保存和取消按钮
    document.getElementById("edittreatmentButton").style.display = "none";
    document.getElementById("savetreatmentButton").style.display = "inline-block";
    document.getElementById("canceltreatmentButton").style.display = "inline-block";

    // 4. 保存原始数据（以防取消时恢复）
    originalRecord = { ...window.currentExaminationRecord };
}

// 启用所有输入框和选择器
function enableAllInputs() {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.disabled = false;
    });
}


// 保存数据到后端
function savetreatmentData() {
    // 1. 收集表单数据
    const updatedRecord = gatherFormData();

    // 2. 获取当前记录的ID并添加到updatedRecord
    const recordId = window.currentExaminationRecord.id;
    const recordPatientID = window.currentExaminationRecord.patient_id_id;
    updatedRecord.id = recordId;
    updatedRecord.patient_id = recordPatientID;

    // 3. 打印即将发送的数据
    console.log("发送的数据:", updatedRecord);

    // 4. 发送数据到后端
    fetch('https://aiforoptometry.com/medicalrecords/recordsedit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord)
    })
    .then(response => response.json())
    .then(data => {
        // 根据状态码判断更新是否成功
        if (data.status_code === 200) {
            // 5. 更新页面的记录
            window.currentExaminationRecord = { ...window.currentExaminationRecord, ...updatedRecord };
            alert("更新成功！");
            rendertreatmentData(); // 刷新页面显示
            exittreatmentEditMode(); // 退出编辑模式
        } else {
            alert("更新失败！");
            exittreatmentEditMode(); // 退出编辑模式
        }
    })
    .catch(error => {
        console.error("更新失败:", error);
        alert("更新失败！");
        exittreatmentEditMode(); // 退出编辑模式
    });
    }

// 收集表单数据
function gatherFormData() {
    const updatedRecord = {
        right_hg: document.getElementById("right_hg").value,
        right_hg_dw: document.getElementById("right_hg_dw").value,
        right_glasses: document.getElementById("right_glasses").value,
        right_glasses_pp: document.getElementById("right_glasses_pp").value,
        right_atropine: document.getElementById("right_atropine").value,
        right_visual_training: document.getElementById("right_visual_training").value,
        right_physiotherapy: document.getElementById("right_physiotherapy").value,
        left_hg: document.getElementById("left_hg").value,
        left_hg_dw: document.getElementById("left_hg_dw").value,
        left_glasses: document.getElementById("left_glasses").value,
        left_glasses_pp: document.getElementById("left_glasses_pp").value,
        left_atropine: document.getElementById("left_atropine").value,
        left_visual_training: document.getElementById("left_visual_training").value,
        left_physiotherapy: document.getElementById("left_physiotherapy").value,
        height: document.getElementById("height").value,
        weight: document.getElementById("weight").value,
        examination_date: document.getElementById("examination_date").value,
        review_date: document.getElementById("review_date").value,
        period: document.getElementById("period").value,
        uva_right_vision: document.getElementById("uva_right_vision").value,
        uva_left_vision: document.getElementById("uva_left_vision").value,
        uva_both_vision: document.getElementById("uva_both_vision").value,
        vaec_right_old_vision: document.getElementById("vaec_right_old_vision").value,
        vaec_left_old_vision: document.getElementById("vaec_left_old_vision").value,
        vaec_both_old_vision: document.getElementById("vaec_both_old_vision").value
    };

    return updatedRecord;
}

// 退出编辑模式
function exittreatmentEditMode() {
    // 1. 禁用所有输入框和选择器
    disableAllInputs();

    // 2. 隐藏保存和取消按钮，显示编辑按钮
    document.getElementById("edittreatmentButton").style.display = "inline-block";
    document.getElementById("savetreatmentButton").style.display = "none";
    document.getElementById("canceltreatmentButton").style.display = "none";

    // 3. 恢复原始数据（如果更新失败）
    if (window.currentExaminationRecord) {
        rendertreatmentData();
    }
}

// 禁用所有输入框和选择器
function disableAllInputs() {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.disabled = true;
    });
}

// 取消编辑，恢复原始数据
function canceltreatmentEdit() {
    // 恢复原始数据
    window.currentExaminationRecord = { ...originalRecord };
    rendertreatmentData(); // 渲染原始数据

    // 退出编辑模式
    exittreatmentEditMode();
}



// 计算检查间隔，并更新 period
function updatePeriodBasedOnReviewDate() {
    const examinationDate = document.getElementById("examination_date").value; // 获取检查日期
    const reviewDateInput = document.getElementById("review_date"); // 获取下次检查日期输入框
    const periodInput = document.getElementById("period"); // 获取检查间隔输入框

    if (!examinationDate || !reviewDateInput.value) {
        return; // 如果没有检查日期或下次检查日期，则不更新
    }

    // 将日期转换为 Date 对象
    const examDate = new Date(examinationDate);
    const reviewDate = new Date(reviewDateInput.value);

    // 计算日期差（以月份为单位）
    let monthsDiff = (reviewDate.getFullYear() - examDate.getFullYear()) * 12 + (reviewDate.getMonth() - examDate.getMonth());

    // 根据月份差来设置检查间隔 period
    let periodValue = "0"; // 默认值为自定义
    if (monthsDiff === 3) {
        periodValue = "3";
    } else if (monthsDiff === 2) {
        periodValue = "2";
    } else if (monthsDiff === 1) {
        periodValue = "1";
    }

    // 更新检查间隔
    periodInput.value = periodValue;
}

// 自动计算并更新下次检查日期
function updateReviewDate() {
    const examinationDate = document.getElementById("examination_date").value; // 获取检查日期
    const period = document.getElementById("period").value; // 获取检查间隔
    const reviewDateInput = document.getElementById("review_date"); // 获取下次检查日期输入框

    if (!examinationDate || period === "0") {
        return; // 如果没有检查日期，或者选择的是"自定义"，则不做任何操作
    }

    // 将检查日期转换为日期对象
    const examDate = new Date(examinationDate);

    // 根据检查间隔计算下次检查日期
    let nextReviewDate = new Date(examDate); // 创建一个新的日期对象避免修改原始日期
    switch (period) {
        case "3":
            nextReviewDate.setMonth(examDate.getMonth() + 3); // 三个月后
            break;
        case "2":
            nextReviewDate.setMonth(examDate.getMonth() + 2); // 两个月后
            break;
        case "1":
            nextReviewDate.setMonth(examDate.getMonth() + 1); // 一个月后
            break;
        default:
            return; // 如果是自定义，不做任何修改
    }

    // 设置下次检查日期的值
    const year = nextReviewDate.getFullYear();
    const month = (nextReviewDate.getMonth() + 1).toString().padStart(2, '0'); // 月份补零
    const day = nextReviewDate.getDate().toString().padStart(2, '0'); // 日期补零

    reviewDateInput.value = `${year}-${month}-${day}`; // 填充下次检查日期
}

// autoTabYear：处理检查日期输入时的操作
function autoTabYear(input) {
    const inputDate = input.value;
    if (!inputDate) return; // 如果没有输入日期，直接返回
    updateReviewDate();  // 调用更新下次检查日期的函数
}



