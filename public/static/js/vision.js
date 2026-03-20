// 使用 window 对象定义全局变量，避免重复声明
window.currentChartType = window.currentChartType || 'subjective'; // 默认是主觉验光图表


// 检查是否已加载 ECharts 库，避免重复加载
if (typeof echarts === 'undefined') {
    const echartsScript = document.createElement('script');
    echartsScript.src = '../../assets/lib/Echarts.js';
    document.head.appendChild(echartsScript);

    echartsScript.onload = () => {
        console.log("ECharts 库已加载完成");
        initializePage(); // 初始化页面，绘制默认图表
    };
} else {
    console.log("ECharts 库已存在，直接初始化图表");
    initializePage(); // 初始化页面，绘制默认图表
}

// 初始化页面：填充表格内容并渲染图表
function initializePage() {
    if (window.currentExaminationRecord) {
        fillVisionPageData(window.currentExaminationRecord); // 填充当前检查记录
    }
    if (window.allExaminationRecords) {
        renderChart(window.allExaminationRecords, window.currentChartType); // 使用当前选择的图表类型
    }
    setupChartSwitch(); // 设置图表切换逻辑
}

// 填充表格数据
function fillVisionPageData(record) {
    const setTextContent = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value != null ? value : '';
        }
    };

    console.log("正在填充当前检查记录的数据：", record);

    setTextContent("examination_date", record.examination_date);

    // 主觉验光部分
    setTextContent("subjective_right_spherical", record.subjective_right_spherical);
    setTextContent("subjective_right_cylindrical", record.subjective_right_cylindrical);
    setTextContent("subjective_right_axis", record.subjective_right_axis);
    setTextContent("bcva_right_vision", record.bcva_right_vision);

    setTextContent("subjective_left_spherical", record.subjective_left_spherical);
    setTextContent("subjective_left_cylindrical", record.subjective_left_cylindrical);
    setTextContent("subjective_left_axis", record.subjective_left_axis);
    setTextContent("bcva_left_vision", record.bcva_left_vision);

    setTextContent("bcva_both_vision", record.bcva_both_vision);
    setTextContent("subjective_both_pupil_distance", record.subjective_both_pupil_distance);

    // 电脑验光部分
    setTextContent("objective_right_spherical", record.objective_right_spherical);
    setTextContent("objective_right_cylindrical", record.objective_right_cylindrical);
    setTextContent("objective_right_axis", record.objective_right_axis);

    setTextContent("objective_left_spherical", record.objective_left_spherical);
    setTextContent("objective_left_cylindrical", record.objective_left_cylindrical);
    setTextContent("objective_left_axis", record.objective_left_axis);

    setTextContent("objective_pupil_distance", record.objective_pupil_distance);

    // 旧镜参数部分
    setTextContent("vaec_right_spherical", record.vaec_right_spherical);
    setTextContent("vaec_right_cylindrical", record.vaec_right_cylindrical);
    setTextContent("vaec_right_axis", record.vaec_right_axis);
    setTextContent("vaec_right_old_vision", record.vaec_right_old_vision);

    setTextContent("vaec_left_spherical", record.vaec_left_spherical);
    setTextContent("vaec_left_cylindrical", record.vaec_left_cylindrical);
    setTextContent("vaec_left_axis", record.vaec_left_axis);
    setTextContent("vaec_left_old_vision", record.vaec_left_old_vision);

    setTextContent("vaec_both_old_vision", record.vaec_both_old_vision);
    setTextContent("vaec_both_pupil_distance", record.vaec_both_pupil_distance);

    // 配镜处方部分
    setTextContent("vacc_right_spherical", record.vacc_right_spherical);
    setTextContent("vacc_right_cylindrical", record.vacc_right_cylindrical);
    setTextContent("vacc_right_axis", record.vacc_right_axis);
    setTextContent("vacc_right_old_vision", record.vacc_right_old_vision);

    setTextContent("vacc_left_spherical", record.vacc_left_spherical);
    setTextContent("vacc_left_cylindrical", record.vacc_left_cylindrical);
    setTextContent("vacc_left_axis", record.vacc_left_axis);
    setTextContent("vacc_left_old_vision", record.vacc_left_old_vision);

    setTextContent("vacc_both_old_vision", record.vacc_both_old_vision);
    setTextContent("vacc_both_pupil_distance", record.vacc_both_pupil_distance);
}

function setupChartSwitch() {
    // 根据当前图表类型同步radio按钮
    document.querySelectorAll("input[name='chartType']").forEach(input => {
        // 如果当前图表类型与radio值匹配，设置选中状态
        if (input.value === window.currentChartType) {
            input.checked = true;
        }

        input.addEventListener('change', event => {
            // 更新当前图表类型
            window.currentChartType = event.target.value;
            renderChart(window.allExaminationRecords, window.currentChartType);
        });
    });
}




// 渲染图表
function renderChart(records, chartType) {
    const chartContainer = document.getElementById('chartContainer');
    if (!chartContainer) {
        console.warn("找不到 chartContainer 元素，请检查 HTML 中的元素 ID 是否正确。");
        return;
    }

    const myChart = echarts.init(chartContainer);

    // 根据 chartType 决定使用的字段
    const titleText = chartType === 'subjective' ? '主觉验光图表' : '配镜处方图表';

    // 数据过滤函数：有效值为数字，且不为 0
    const isValidData = (value) => value !== null && value !== 'N/A' && value !== '' && value !== 0 && !isNaN(value);

    // 处理右眼球镜、右眼柱镜、左眼球镜、左眼柱镜的值，过滤掉无效数据
    const rightSpherical = chartType === 'subjective'
        ? records.map(record => isValidData(record.subjective_right_spherical) ? record.subjective_right_spherical : null)
        : records.map(record => isValidData(record.vacc_right_spherical) ? record.vacc_right_spherical : null);

    const rightCylindrical = chartType === 'subjective'
        ? records.map(record => isValidData(record.subjective_right_cylindrical) ? record.subjective_right_cylindrical : null)
        : records.map(record => isValidData(record.vacc_right_cylindrical) ? record.vacc_right_cylindrical : null);

    const leftSpherical = chartType === 'subjective'
        ? records.map(record => isValidData(record.subjective_left_spherical) ? record.subjective_left_spherical : null)
        : records.map(record => isValidData(record.vacc_left_spherical) ? record.vacc_left_spherical : null);

    const leftCylindrical = chartType === 'subjective'
        ? records.map(record => isValidData(record.subjective_left_cylindrical) ? record.subjective_left_cylindrical : null)
        : records.map(record => isValidData(record.vacc_left_cylindrical) ? record.vacc_left_cylindrical : null);

    // 将日期格式调整为 'YYYY/MM/DD'，确保年份为四位数
    const dates = records.map(record => {
        const date = new Date(record.examination_date);
        const year = String(date.getFullYear()); // 使用四位数年份
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份补零
        const day = String(date.getDate()).padStart(2, '0'); // 日期补零
        return `${year}/${month}/${day}`;
    });

    // 过滤掉无效数据点及对应的日期
    const filteredData = (data, dates) => {
        return data
            .map((value, index) => value !== null ? { value, date: dates[index] } : null)
            .filter(item => item !== null);
    };

    const validRightSpherical = filteredData(rightSpherical, dates);
    const validRightCylindrical = filteredData(rightCylindrical, dates);
    const validLeftSpherical = filteredData(leftSpherical, dates);
    const validLeftCylindrical = filteredData(leftCylindrical, dates);

    // 重新整理过滤后的日期和数据
    const validData = validRightSpherical.map((item, index) => ({
        date: item.date,
        rightSpherical: validRightSpherical[index].value,
        rightCylindrical: validRightCylindrical[index].value,
        leftSpherical: validLeftSpherical[index].value,
        leftCylindrical: validLeftCylindrical[index].value,
    }));

    // 按照日期排序，从早到晚（使用完整的年份进行比较）
    validData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 提取排序后的数据
    const validDates = validData.map(item => item.date);
    const validRightSphericalData = validData.map(item => item.rightSpherical);
    const validRightCylindricalData = validData.map(item => item.rightCylindrical);
    const validLeftSphericalData = validData.map(item => item.leftSpherical);
    const validLeftCylindricalData = validData.map(item => item.leftCylindrical);

    // 配置图表选项
    const option = {
        title: {
            text: titleText,
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
                let tooltipContent = `${params[0].axisValue}<br/>`;  // 显示日期
                params.forEach(param => {
                    let value = param.value;

                    // 如果 param.value 是对象，则取其 value 属性
                    if (typeof value === 'object' && value !== null) {
                        value = value.value;  // 获取实际的数据值
                    }

                    // 检查值是否为有效数字
                    if (!isNaN(value) && value !== null) {
                        tooltipContent += `${param.seriesName}: ${Number(value).toFixed(2)}<br/>`;
                    } else {
                        tooltipContent += `${param.seriesName}: N/A<br/>`;  // 如果不是有效数字，显示 N/A
                    }
                });
                return tooltipContent;
            }

        },
        legend: {
            data: ['右眼球镜', '右眼柱镜', '左眼球镜', '左眼柱镜'],
            top: '30px', // 将图例放在标题正下方
            left: 'center'
        },
        xAxis: {
            type: 'category',
            data: validDates,  // 使用过滤后的日期数据
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            name: '度数',
            inverse: true, // 反转坐标轴，负值在上，正值在下
            splitLine: { show: false }
        },
        series: [
            {
                name: '右眼球镜',
                type: 'bar',
                data: validRightSphericalData,  // 使用过滤后的右眼球镜数据
                itemStyle: { color: '#e57373' },
                label: {
                    show: true,
                    position: 'inside',
                    color: '#ffffff',
                    fontSize: 12
                }
            },
            {
                name: '右眼柱镜',
                type: 'bar',
                data: validRightCylindricalData,  // 使用过滤后的右眼柱镜数据
                itemStyle: { color: '#ffcdd2' },
                label: {
                    show: true,
                    position: 'inside',
                    color: '#000000',
                    fontSize: 12
                }
            },
            {
                name: '左眼球镜',
                type: 'bar',
                data: validLeftSphericalData,  // 使用过滤后的左眼球镜数据
                itemStyle: { color: '#64b5f6' },
                label: {
                    show: true,
                    position: 'inside',
                    color: '#ffffff',
                    fontSize: 12
                }
            },
            {
                name: '左眼柱镜',
                type: 'bar',
                data: validLeftCylindricalData,  // 使用过滤后的左眼柱镜数据
                itemStyle: { color: '#bbdefb' },
                label: {
                    show: true,
                    position: 'inside',
                    color: '#000000',
                    fontSize: 12
                }
            }
        ]
    };

    // 设置选项并渲染图表
    myChart.setOption(option);
}




// 定义 refreshCurrentModule 函数，供主页面调用
function refreshCurrentModule() {
    console.log("刷新 vision 子页面的内容");
    initializePage(); // 调用 initializePage 进行数据渲染
}

// 编辑模式切换函数
function entervisionEditMode() {
    // 1. 将表格的单元格设置为可编辑
    let cells = document.querySelectorAll('#textExaminationData td');
    cells.forEach(cell => {
        if (cell.id && cell.id !== "examination_date") {
            cell.contentEditable = "true";
        }
    });

    // 2. 隐藏编辑按钮，显示提交和取消按钮
    document.getElementById('editvisionButton').style.display = 'none';
    document.getElementById('submitvisionButton').style.display = 'inline-block';
    document.getElementById('cancelvisionButton').style.display = 'inline-block';
}

// 提交编辑的数据
function submitvisionEditMode() {
    // 获取当前表格中所有的字段值
    let updatedRecord = {};

    let cells = document.querySelectorAll('#textExaminationData td');
    cells.forEach(cell => {
        if (cell.id && cell.id !== "examination_date") {
            let value = cell.innerText.trim();
            // 如果值为空，N/A 或 null，替换为 ""
            updatedRecord[cell.id] = value === "" || value === "N/A" || value === "null" ? "" : value;
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

    // 发送更新的记录到后端
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
        } else {
            alert("数据提交失败: " + (data.message || "未知错误"));
            cancelvisionEditMode();  // 提交失败时恢复数据和界面
        }
    })
    .catch(error => {
        console.error("数据提交出错:", error);
        alert("数据提交失败: " + error.message);
        cancelvisionEditMode();  // 请求出错时也恢复数据和界面
    });
}

// 取消编辑模式并恢复表格
function cancelvisionEditMode() {
    // 1. 恢复表格的所有单元格为不可编辑
    let cells = document.querySelectorAll('#textExaminationData td');
    cells.forEach(cell => {
        if (cell.id && cell.id !== "examination_date") {
            cell.contentEditable = "false";
        }
    });

    // 2. 隐藏提交和取消按钮，显示编辑按钮
    document.getElementById('editvisionButton').style.display = 'inline-block';
    document.getElementById('submitvisionButton').style.display = 'none';
    document.getElementById('cancelvisionButton').style.display = 'none';

    // 3. 需要恢复表格内容（这里假设 window.currentExaminationRecord 中保存了原始数据）
    restoreTableData();
}

// 恢复表格数据
function restoreTableData() {
    let record = window.currentExaminationRecord;

    // 遍历所有表格单元格，恢复原始数据
    let cells = document.querySelectorAll('#textExaminationData td');
    cells.forEach(cell => {
        if (cell.id && cell.id !== "examination_date") {
            cell.innerText = record[cell.id] || "";
        }
    });
}

// 监听按钮点击事件
document.getElementById('editvisionButton').addEventListener('click', entervisionEditMode);
document.getElementById('submitvisionButton').addEventListener('click', submitvisionEditMode);
document.getElementById('cancelvisionButton').addEventListener('click', cancelvisionEditMode);




// 如果主页面数据有更新，监听并重新渲染数据
window.addEventListener("currentExaminationRecordUpdated", () => {
    if (window.currentExaminationRecord) {
        fillVisionPageData(window.currentExaminationRecord);
    }
    if (window.allExaminationRecords) {
        renderChart(window.allExaminationRecords, window.currentChartType);
    }
});
