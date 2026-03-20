console.log("routine.js 加载完成并开始监听 currentExaminationRecordUpdated 事件");

let chartInstance = null; // ECharts实例
let currentChartType = 'axialLength'; // 初始图表类型
let isEditing = false;

// 引入 ECharts 库
const echartsScript = document.createElement('script');
echartsScript.src = 'Echarts.js';
document.head.appendChild(echartsScript);

// 监听父页面发送的 `currentExaminationRecordUpdated` 事件
window.addEventListener("currentExaminationRecordUpdated", (event) => {
    console.log("接收到 currentExaminationRecord 更新事件");

    // 获取当前检查记录和所有检查记录
    window.currentExaminationRecord = event.detail.record;
    window.allExaminationRecords = event.detail.allRecords || window.allExaminationRecords || [];

    console.log("当前检查记录内容：", window.currentExaminationRecord);
    console.log("所有检查记录内容（用于图表）：", window.allExaminationRecords);

    refreshRoutineCheckupPage(); // 切换到 routine 页面时重新渲染
});



// 刷新常规检查页面的数据
function refreshRoutineCheckupPage() {
    console.log("刷新常规检查页面的数据...");

    if (!window.currentExaminationRecord) {
        console.error("当前检查记录不存在！");
        return;
    }

    console.log("当前检查记录内容：", window.currentExaminationRecord);

    // 计算MALWT函数
    const calculateMALWT = (axialLength, K1, K2) => {
        // 打印调试信息，查看输入数据是否正确
        console.log(`计算MALWT: axialLength=${axialLength}, K1=${K1}, K2=${K2}`);
        return axialLength - ((K1 + K2) / 2 - 43) / (axialLength <= 25 ? 3 : 2.5);
    };

    // 格式化小数为两位
    const formatDecimal = (value, decimals) => {
        return value.toFixed(decimals);
    };

    // 遍历所有检查记录，找到最早有效的检查记录
    let rightMalwt = "N/A";  // 默认值为 "N/A"
    let leftMalwt = "N/A";   // 默认值为 "N/A"

    // 从后往前遍历检查记录
    for (let i = window.allExaminationRecords.length - 1; i >= 0; i--) {
        const record = window.allExaminationRecords[i];

        // 转换为数字进行计算
        const rightEyeAxialLength = parseFloat(record.right_eye_axial_length);
        const rightEyeK1 = parseFloat(record.right_eye_k1);
        const rightEyeK2 = parseFloat(record.right_eye_k2);
        const leftEyeAxialLength = parseFloat(record.left_eye_axial_length);
        const leftEyeK1 = parseFloat(record.left_eye_k1);
        const leftEyeK2 = parseFloat(record.left_eye_k2);

        // 检查是否有有效的数据（不是NaN，确保是数字）
        if (!isNaN(rightEyeAxialLength) && !isNaN(rightEyeK1) && !isNaN(rightEyeK2) &&
            !isNaN(leftEyeAxialLength) && !isNaN(leftEyeK1) && !isNaN(leftEyeK2)) {

            // 计算右眼和左眼的MALWT
            rightMalwt = calculateMALWT(rightEyeAxialLength, rightEyeK1, rightEyeK2);
            leftMalwt = calculateMALWT(leftEyeAxialLength, leftEyeK1, leftEyeK2);

            // 检查MALWT是否有效（不是NaN）
            if (!isNaN(rightMalwt) && !isNaN(leftMalwt)) {
                // 输出找到的有效记录的索引和相关数据
                console.log(`找到有效的检查记录: 索引 ${i}，检查日期: ${record.examination_date}`);
                console.log("右眼数据：", {
                    rightEyeAxialLength, rightEyeK1, rightEyeK2,
                    rightMalwt
                });
                console.log("左眼数据：", {
                    leftEyeAxialLength, leftEyeK1, leftEyeK2,
                    leftMalwt
                });
                break;  // 找到有效值，跳出循环
            }
        }
    }

    // 填充右眼数据
    const rightEyeAxialLength = window.currentExaminationRecord.right_eye_axial_length || "N/A";
    const rightEyeK1 = window.currentExaminationRecord.right_eye_k1 || "N/A";
    const rightEyeK2 = window.currentExaminationRecord.right_eye_k2 || "N/A";
    document.getElementById("right_eye_axial_length").textContent = rightEyeAxialLength || "N/A";
    document.getElementById("right_eye_k1").textContent = rightEyeK1 || "N/A";
    document.getElementById("right_eye_k2").textContent = rightEyeK2 || "N/A";
    document.getElementById("right_cct").textContent = window.currentExaminationRecord.right_cct || "N/A";
    document.getElementById("right_anterior_chamber_depth").textContent = window.currentExaminationRecord.right_anterior_chamber_depth || "N/A";
    document.getElementById("right_lens_thickness").textContent = window.currentExaminationRecord.right_lens_thickness || "N/A";
    document.getElementById("right_vitreous_space_thickness").textContent = window.currentExaminationRecord.right_vitreous_space_thickness || "N/A";
    document.getElementById("right_choroidal_thickness").textContent = window.currentExaminationRecord.right_choroidal_thickness || "N/A";
    document.getElementById("right_intraocular_pressure").textContent = window.currentExaminationRecord.right_intraocular_pressure || "N/A";
    document.getElementById("uva_right_vision").textContent = window.currentExaminationRecord.uva_right_vision || "N/A";

    // 填充左眼数据
    const leftEyeAxialLength = window.currentExaminationRecord.left_eye_axial_length || "N/A";
    const leftEyeK1 = window.currentExaminationRecord.left_eye_k1 || "N/A";
    const leftEyeK2 = window.currentExaminationRecord.left_eye_k2 || "N/A";
    document.getElementById("left_eye_axial_length").textContent = leftEyeAxialLength || "N/A";
    document.getElementById("left_eye_k1").textContent = leftEyeK1 || "N/A";
    document.getElementById("left_eye_k2").textContent = leftEyeK2 || "N/A";
    document.getElementById("left_cct").textContent = window.currentExaminationRecord.left_cct || "N/A";
    document.getElementById("left_anterior_chamber_depth").textContent = window.currentExaminationRecord.left_anterior_chamber_depth || "N/A";
    document.getElementById("left_lens_thickness").textContent = window.currentExaminationRecord.left_lens_thickness || "N/A";
    document.getElementById("left_vitreous_space_thickness").textContent = window.currentExaminationRecord.left_vitreous_space_thickness || "N/A";
    document.getElementById("left_choroidal_thickness").textContent = window.currentExaminationRecord.left_choroidal_thickness || "N/A";
    document.getElementById("left_intraocular_pressure").textContent = window.currentExaminationRecord.left_intraocular_pressure || "N/A";
    document.getElementById("uva_left_vision").textContent = window.currentExaminationRecord.uva_left_vision || "N/A";
    document.getElementById("examination_date").textContent = window.currentExaminationRecord.examination_date || "N/A";

    // 将计算结果转为字符串并填充到相应的元素
    document.getElementById('right_malwt').textContent = (rightMalwt === "N/A") ? "N/A" : formatDecimal(rightMalwt, 2);
    document.getElementById('left_malwt').textContent = (leftMalwt === "N/A") ? "N/A" : formatDecimal(leftMalwt, 2);

    console.log(`右眼 MALWT: ${rightMalwt}, 左眼 MALWT: ${leftMalwt}`);

    // 计算轴率比
    const calculateAxisRatio = (axialLength, K1, K2) => {
        // 确保 K1 和 K2 转换为有效数字，如果无效则返回 "N/A"
        const validK1 = parseFloat(K1);
        const validK2 = parseFloat(K2);

        // 如果转换失败，返回 "N/A"
        if (isNaN(validK1) || isNaN(validK2)) {
            return "N/A";  // 无效数据时，返回 "N/A"
        }

        // 计算轴率比
        const axisRatio = axialLength * ((validK1 + validK2) / (2 * 337.5));

        // 如果计算结果是有效的数字，返回格式化后的值，否则返回 "N/A"
        return isNaN(axisRatio) ? "N/A" : axisRatio.toFixed(2); // 保留两位小数
    };

    // 计算右眼和左眼的轴率比
    const rightAxisRatio = calculateAxisRatio(rightEyeAxialLength, rightEyeK1, rightEyeK2);
    const leftAxisRatio = calculateAxisRatio(leftEyeAxialLength, leftEyeK1, leftEyeK2);

    // 填充轴率比到页面上
    document.getElementById('right_al_cr').textContent = rightAxisRatio;
    document.getElementById('left_al_cr').textContent = leftAxisRatio;





    // 从 window 对象恢复当前图表类型
    const savedChartType = window.currentroutineChartType || 'axialLength'; // 如果没有保存，则默认为 'axialLength'

    // 初始化图表并更新选项
    initializeChart(savedChartType);
    updateRadioSelection(savedChartType);  // 更新单选按钮状态
}

// 切换图表类型
function switchChartData(type) {
    window.currentroutineChartType = type;  // 保存当前图表类型到 window 对象
    updateChartData(window.currentroutineChartType);  // 重新渲染图表
}


// 初始化 ECharts 图表
function initializeChart() {
    const chartContainer = document.getElementById('echarts-container');
    if (!chartContainer) {
        console.error("图表容器未找到，无法初始化图表。");
        return;
    }

    // 如果没有在 window 对象上找到当前图表类型，则使用默认值
    if (!window.currentroutineChartType) {
        window.currentroutineChartType = 'axialLength';  // 默认图表类型
    }

    // 销毁旧的图表实例，防止重叠
    if (chartInstance) {
        chartInstance.dispose();
    }

    chartInstance = echarts.init(chartContainer);
    updateChartData(window.currentroutineChartType); // 使用全局变量来初始化图表类型
}

// 更新图表的数据
function updateChartData(type) {
    if (!window.allExaminationRecords || window.allExaminationRecords.length === 0) {
        console.warn("没有检查记录数据，无法生成图表");
        return;
    }

    let rightData = [], leftData = [], dates = [];
    let yAxisMin = 0, yAxisMax = 0, yAxisInterval = null;
    let rightMalwtData = [], leftMalwtData = [];

    // 假设这两个值是你已经计算好的

    const rightMalwt = parseFloat(document.getElementById('right_malwt').textContent) || 0;
    const leftMalwt = parseFloat(document.getElementById('left_malwt').textContent) || 0;


    // 过滤无效数据的辅助函数
    const isValidData = (value) => {
        return value !== null && value !== 'N/A' && value !== '' && value !== 0 && !isNaN(value);
    };

    // 选择不同的图表类型
    switch (type) {
        case 'axialLength':
            // 眼轴数据
            window.allExaminationRecords.forEach(record => {
                const rightAxial = parseFloat(record.right_eye_axial_length) || null;
                const leftAxial = parseFloat(record.left_eye_axial_length) || null;

                // 过滤掉无效数据
                if (isValidData(rightAxial) && isValidData(leftAxial)) {
                    rightData.push(rightAxial);
                    leftData.push(leftAxial);
                    rightMalwtData.push(rightMalwt);  // 每个日期的右眼MALWT
                    leftMalwtData.push(leftMalwt);    // 每个日期的左眼MALWT
                    dates.push(record.examination_date);  // 仅当数据有效时，才添加日期
                }
            });
            break;

        case 'eyePressure':
            // 眼压数据
            window.allExaminationRecords.forEach(record => {
                const rightPressure = parseFloat(record.right_intraocular_pressure) || null;
                const leftPressure = parseFloat(record.left_intraocular_pressure) || null;

                // 过滤掉无效数据
                if (isValidData(rightPressure) && isValidData(leftPressure)) {
                    rightData.push(rightPressure);
                    leftData.push(leftPressure);
                    dates.push(record.examination_date);  // 仅当数据有效时，才添加日期
                }
            });
            break;

        case 'unaidedVision':
            // 裸眼视力数据
            window.allExaminationRecords.forEach(record => {
                const rightVision = formatVision(record.uva_right_vision);
                const leftVision = formatVision(record.uva_left_vision);

                // 过滤掉无效数据
                if (isValidData(rightVision) && isValidData(leftVision)) {
                    rightData.push(rightVision);
                    leftData.push(leftVision);
                    dates.push(record.examination_date);  // 仅当数据有效时，才添加日期
                }
            });
            yAxisMin = 0;
            yAxisMax = 1.5;
            yAxisInterval = 0.1;
            break;

        case 'choroidalThickness':
            // 脉络膜厚度数据
            window.allExaminationRecords.forEach(record => {
                const rightThickness = parseFloat(record.right_choroidal_thickness) || null;
                const leftThickness = parseFloat(record.left_choroidal_thickness) || null;

                // 过滤掉无效数据
                if (isValidData(rightThickness) && isValidData(leftThickness)) {
                    rightData.push(rightThickness);
                    leftData.push(leftThickness);
                    dates.push(record.examination_date);  // 仅当数据有效时，才添加日期
                }
            });
            break;

        default:
            console.warn("未知的图表类型:", type);
            return;
    }

    // 如果没有有效数据，直接返回
    if (rightData.length === 0 && leftData.length === 0) {
        console.warn("没有有效的数据，无法显示图表");
        return;
    }

    // 根据日期排序：将日期转化为 Date 对象，然后排序
    const sortedData = dates
        .map((date, index) => ({ date: new Date(date), right: rightData[index], left: leftData[index], rightMalwt: rightMalwtData[index], leftMalwt: leftMalwtData[index] })) // 将日期与数据关联
        .sort((a, b) => a.date - b.date); // 按日期升序排序

    // 更新排序后的数据
    dates = sortedData.map(item => item.date.toLocaleDateString()); // 获取排序后的日期
    rightData = sortedData.map(item => item.right); // 获取排序后的右眼数据
    leftData = sortedData.map(item => item.left); // 获取排序后的左眼数据
    rightMalwtData = sortedData.map(item => item.rightMalwt); // 获取排序后的右眼MALWT数据
    leftMalwtData = sortedData.map(item => item.leftMalwt); // 获取排序后的左眼MALWT数据

    // 根据有效数据计算Y轴范围
    const allData = [...rightData, ...leftData];
    yAxisMin = Math.min(...allData) - 0.1;
    yAxisMax = Math.max(...allData) + 0.1;

    const decimalPlaces = type === 'axialLength' ? 2 : type === 'unaidedVision' ? 1 : null;

    const option = {
        title: { text: getChartTitle(type) },
        tooltip: {
            trigger: 'axis',
            formatter: params => {
                const formatValue = value => {
                    if (typeof value === 'number') {
                        return value.toFixed(decimalPlaces); // 格式化数字
                    }
                    return value === 'N/A' ? 'N/A' : '';  // 如果是 'N/A'，返回 'N/A'
                };

                // 获取右眼和左眼的数值
                const rightValue = formatValue(params.find(item => item.seriesName === '右眼')?.data || 'N/A');
                const leftValue = formatValue(params.find(item => item.seriesName === '左眼')?.data || 'N/A');

                // 获取右眼和左眼的 MALWT 值
                const rightMalwt = rightMalwtData[params[0].dataIndex] || 'N/A';  // 右眼MALWT
                const leftMalwt = leftMalwtData[params[0].dataIndex] || 'N/A';    // 左眼MALWT

                // 计算右眼和左眼的轴率差值
                const calculateDifference = (malwt, value) => {
                    if (malwt === 'N/A' || value === 'N/A') {
                        return 'N/A';
                    }
                    const difference = (malwt - value).toFixed(2);  // 保留两位小数
                    return difference;  // 返回差值
                };

                const rightDifference = calculateDifference(parseFloat(rightMalwt), parseFloat(rightValue));
                const leftDifference = calculateDifference(parseFloat(leftMalwt), parseFloat(leftValue));

                return `
                    日期: ${params[0].axisValue}<br />
                    <span style="color:red;">右眼: ${rightValue} (轴余: ${rightDifference})</span><br />
                    <span style="color:blue;">左眼: ${leftValue} (轴余: ${leftDifference})</span>
                `;
            },
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: '#ccc',
            borderWidth: 1,
            textStyle: { color: '#333' }
        },
        legend: { data: ['右眼', '左眼', '右眼近视预警线', '左眼近视预警线'] }, // 添加MALWT到图例
        xAxis: { type: 'category', data: dates },  // 只显示有效日期
        yAxis: {
            type: 'value',
            min: yAxisMin,
            max: yAxisMax,
            interval: yAxisInterval
        },
        series: [
            {
                name: '右眼',
                type: 'line',
                data: rightData,
                itemStyle: { color: 'red' },
                label: {
                    show: true,
                    position: 'top',
                    distance: 15,
                    formatter: params => decimalPlaces !== null ? params.value.toFixed(decimalPlaces) : params.value,
                    color: 'red',
                    fontSize: 16
                }
            },
            {
                name: '左眼',
                type: 'line',
                data: leftData,
                itemStyle: { color: 'blue' },
                label: {
                    show: true,
                    position: 'bottom',
                    distance: 15,
                    formatter: params => decimalPlaces !== null ? params.value.toFixed(decimalPlaces) : params.value,
                    color: 'blue',
                    fontSize: 16
                }
            },
            {
                name: '右眼近视预警线',
                type: 'line',
                data: rightMalwtData,
                itemStyle: { color: 'pink' },
                showSymbol: false, // 不显示点
                lineStyle: {
                    type: 'dashed',
                    color: 'red'
                }
            },
            {
                name: '左眼近视预警线',
                type: 'line',
                data: leftMalwtData,
                itemStyle: { color: 'lightblue' },
                showSymbol: false, // 不显示点
                lineStyle: {
                    type: 'dashed',
                    color: 'blue'
                }
            }
        ]
    };

    chartInstance.setOption(option);
}





function formatValue(value) {
    // 如果值是数字，则使用 toFixed 进行格式化
    if (typeof value === 'number') {
        return value.toFixed(2);  // 或者指定你想要的精度
    }
    // 如果不是数字，返回原值或其他处理方式
    return value;
}


// 裸眼视力格式化函数：将裸眼视力数值（如4.9、5.0等）转换为小数计数法
function formatVision(vision) {
    if (vision === null || vision === undefined) return 0;
    const visionValue = parseFloat(vision);

    // 将大于 3 的裸眼视力数值转换为小数计数法
    if (visionValue >= 3) {
        switch (visionValue) {
            case 3.0: return 0.01;
            case 3.1: return 0.02;
            case 3.2: return 0.03;
            case 3.3: return 0.04;
            case 3.4: return 0.05;
            case 3.5: return 0.06;
            case 3.6: return 0.08;
            case 3.7: return 0.1;
            case 3.8: return 0.12;
            case 3.9: return 0.15;
            case 4.0: return 0.2;
            case 4.1: return 0.25;
            case 4.2: return 0.3;
            case 4.3: return 0.4;
            case 4.4: return 0.5;
            case 4.5: return 0.6;
            case 4.6: return 0.7;
            case 4.7: return 0.7;
            case 4.8: return 0.8;
            case 4.9: return 0.8;
            case 5.0: return 1.0;
            case 5.1: return 1.2;
            case 5.2: return 1.5;
            case 5.3: return 1.5;
            default: return 0; // 对于未定义的值返回 0 或者其它默认值
        }
    }

    // 如果是其他数值，直接返回原值或视为 logMAR 计数法（根据具体需求处理）
    return visionValue;
}


// 获取图表标题
function getChartTitle(type) {
    switch (type) {
        case 'axialLength': return '眼轴变化';
        case 'eyePressure': return '眼压变化';
        case 'unaidedVision': return '裸眼视力变化';
        case 'choroidalThickness': return '脉络膜厚度变化';
        default: return '检查数据变化';
    }
}



// 更新单选按钮的选中状态
function updateRadioSelection(selectedType) {
    // 获取所有的 radio 按钮
    const radioButtons = document.querySelectorAll('input[name="chartType"]');

    // 遍历所有单选按钮，设置选中状态
    radioButtons.forEach(radio => {
        if (radio.value === selectedType) {
            radio.checked = true;  // 设置为选中状态
        }
    });
}




function enterroutineEditMode() {
    if (isEditing) return;
    isEditing = true;

    // 显示提交和取消按钮，隐藏编辑按钮
    document.getElementById("editroutineButton").style.display = "none";
    document.getElementById("submitroutineButton").style.display = "inline-block";
    document.getElementById("cancelroutineButton").style.display = "inline-block";

    // 转换检查日期为日期选择器
    const dateCell = document.getElementById("examination_date");
    const currentDate = dateCell.textContent === "N/A" ? "" : dateCell.textContent;
    dateCell.innerHTML = `<input type="date" value="${currentDate}" style="width: 100%; box-sizing: border-box;" />`;

    // 将所有单元格的内容转换为输入框，并固定输入框宽度以保持表格大小不变
    const editableFields = [
        "right_eye_axial_length", "right_cct", "right_anterior_chamber_depth",
        "right_lens_thickness", "right_vitreous_space_thickness",
        "right_choroidal_thickness", "right_intraocular_pressure", "uva_right_vision",
        "left_eye_axial_length", "left_cct", "left_anterior_chamber_depth",
        "left_lens_thickness", "left_vitreous_space_thickness",
        "left_choroidal_thickness", "left_intraocular_pressure", "uva_left_vision"
    ];

    editableFields.forEach(id => {
        const cell = document.getElementById(id);
        const value = cell.textContent === "N/A" ? "" : cell.textContent;
        cell.innerHTML = `<input type="text" value="${value}" style="width: 100%; box-sizing: border-box;" />`;
    });
}


function cancelroutineEditMode() {
    isEditing = false;

    // 隐藏提交和取消按钮，显示编辑按钮
    document.getElementById("editroutineButton").style.display = "inline-block";
    document.getElementById("submitroutineButton").style.display = "none";
    document.getElementById("cancelroutineButton").style.display = "none";

    // 还原原来的内容
    refreshRoutineCheckupPage();
}

function submitroutineEditMode() {
    isEditing = false;

    // 初始化更新的记录对象
    const updatedRecord = {};

    // 获取检查日期并添加到更新记录中
    const dateInput = document.getElementById("examination_date").querySelector("input");
    updatedRecord.examination_date = (dateInput.value || "").trim();

    // 获取数据单元格的输入值并将其转化为更新记录
    const editableFields = [
        "right_eye_axial_length", "right_cct", "right_anterior_chamber_depth",
        "right_lens_thickness", "right_vitreous_space_thickness",
        "right_choroidal_thickness", "right_intraocular_pressure", "uva_right_vision",
        "left_eye_axial_length", "left_cct", "left_anterior_chamber_depth",
        "left_lens_thickness", "left_vitreous_space_thickness",
        "left_choroidal_thickness", "left_intraocular_pressure", "uva_left_vision"
    ];

    editableFields.forEach(id => {
        const cell = document.getElementById(id);
        const input = cell.querySelector("input");
        if (input) {
            let newValue = input.value.trim();

            // 如果字段值为 "N/A", "null", 或 "none", 则将其转为空字符串
            if (newValue === "N/A" || newValue === "null" || newValue === "none" || newValue === null) {
                newValue = "";
            }

            updatedRecord[id] = newValue;
            cell.textContent = newValue || "N/A";  // 提交后显示文本
        }
    });

    // 获取 CSRF token 和 patient_id
    const csrftoken = localStorage.getItem("csrftoken");
    const patientId = window.currentExaminationRecord.patient_id_id;
    updatedRecord.patient_id = patientId;

    // 获取 id 并添加到更新记录中
    const recordId = window.currentExaminationRecord.id;
    updatedRecord.id = recordId;

    // 打印要发送的数据到控制台
    console.log("发送的数据:", updatedRecord);

    // 发送到后端
    fetch('https://aiforoptometry.com/medicalrecords/recordsedit', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,  // 确保 csrftoken 是正确的
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedRecord)
    })
    .then(response => response.json())
    .then(data => {
        console.log("后端返回结果:", data);

        // 判断后端返回的数据中 "检查记录更新成功" 的值是否与提交的记录 ID 一致
        if (data.status_code === 200) {
            window.currentExaminationRecord = { ...window.currentExaminationRecord, ...updatedRecord };  // 更新当前记录
            alert("数据提交成功");
             // 提交成功后刷新页面
             window.location.reload();  // 刷新页面以展示更新后的数据

            // 这里可以添加提交成功后的界面更新代码
        } else {
            alert("数据提交失败: " + (data.message || "未知错误"));
            cancelroutineEditMode();  // 提交失败时恢复数据和界面
        }
    })
    .catch(error => {
        console.error("数据提交出错:", error);
        cancelroutineEditMode();  // 请求出错时也恢复数据和界面
    });

    // 切换按钮状态
    document.getElementById("editroutineButton").style.display = "inline-block";
    document.getElementById("submitroutineButton").style.display = "none";
    document.getElementById("cancelroutineButton").style.display = "none";
}
