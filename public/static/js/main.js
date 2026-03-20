// 从 localStorage 获取 CSRF Token
const csrftoken = localStorage.getItem('csrftoken');
if (!csrftoken) {
    console.error('CSRF Token 未找到，请确认 localStorage 中是否正确存储了 csrftoken。');
}

// 全局变量：所有检查记录和当前选择的检查记录
let allExaminationRecords = []; // 存储所有检查记录
let currentExaminationRecord = null; // 当前选中的检查记录
let currentModule = 'routine'; // 默认模块为 'routine'

// 从 Vue 页面接收患者数据
let patientId = null; // 患者 ID
let patientData = null; // 患者数据

window.addEventListener("message", (event) => {
  if (event.data && event.data.record) {
    const record = event.data.record;
    console.log("从 Vue 页面接收到的记录数据:", record);

    // 提取患者数据
    patientId = record.id;
    patientData = record;

    // 调试日志
    console.log("patientId:", patientId);
    console.log("patientData:", patientData);

    // 初始化页面
    fetchPatientData();
  } else {
    console.error("未接收到有效的 record 数据");
  }
});

// 获取患者数据并初始化页面
function fetchPatientData() {
    console.log("fetchPatientData 函数被调用");

    if (!patientId || !patientData) {
        console.error("未接收到患者数据");
        return;
    }

    // 直接使用从 Vue 页面传递的数据
    console.log("从 Vue 页面获取的患者数据:", patientData);
    fillPatientInfo(patientData); // 填充患者基础信息
    fetchPatientRecords(patientId); // 获取患者检查记录
}

// 填充患者基本信息
function fillPatientInfo(patientData) {
    // 显示姓名、性别、电话
    document.getElementById("patientName").textContent = `姓名: ${patientData.name}`;
    document.getElementById("patientGender").textContent = `性别: ${patientData.gender}`;
    document.getElementById("patientPhone").textContent = `联系电话: ${patientData.phone}`;

    // 显示建档日期
    if (patientData.createDate) {
        const createDate = new Date(patientData.createDate);
        const formattedCreateDate = `${createDate.getFullYear()}/${createDate.getMonth() + 1}/${createDate.getDate()}`;
        document.getElementById("create_date").textContent = `建档日期: ${formattedCreateDate}`;
    } else {
        document.getElementById("create_date").textContent = `建档日期: 无`;
    }

    // 计算并显示年龄
    if (patientData.birthDate) {
        const birthDate = new Date(patientData.birthDate);
        const currentDate = new Date();
        const age = (currentDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000); // 计算年龄（保留小数）
        const formattedAge = age.toFixed(1); // 保留一位小数
        const formattedBirthDate = `${birthDate.getFullYear()}/${birthDate.getMonth() + 1}/${birthDate.getDate()}`;
        document.getElementById("patientAge").textContent = `年龄: ${formattedAge}岁 (${formattedBirthDate})`;
    } else {
        document.getElementById("patientAge").textContent = `年龄: 无`;
    }

    // 显示初始轴率比
    document.getElementById("initialAxisRatio").textContent = "初始轴率比: 无";
}

// 获取患者的所有检查记录
function fetchPatientRecords(patientId) {
    console.log("fetchPatientRecords 函数被调用");

    fetch(`https://aiforoptometry.com/medicalrecords/allrecords_patient_id_2`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ patient_id: patientId }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(recordsData => {
        console.log("从后端获取的检查记录数据:", recordsData);

        // 更新全局的检查记录数组
        allExaminationRecords = recordsData.examination_records || [];
        console.log("全局数据中的所有检查记录（allExaminationRecords）:", allExaminationRecords);

        // 确保数据准备完成后通知子页面
        const event = new CustomEvent("allExaminationRecordsLoaded", { detail: { records: allExaminationRecords } });
        window.dispatchEvent(event);

        if (allExaminationRecords.length > 0) {
            setCurrentExaminationRecord(allExaminationRecords[0]); // 默认设置最近一次记录
            loadModule(currentModule); // 默认加载 'routine' 模块
        }

        fillRecordList(allExaminationRecords); // 渲染检查记录列表
        displayInitialAxisRatio(); // 显示最早的轴率比数据
    })
    .catch(error => {
        console.error("获取检查记录数据时出错:", error);
    });
}

// 设置当前检查记录并通知子页面更新
function setCurrentExaminationRecord(record) {
    window.currentExaminationRecord = record;
    console.log("当前检查记录已更新为：", window.currentExaminationRecord);

    const eventDetail = {
        record: window.currentExaminationRecord,
        allRecords: allExaminationRecords // 使用全局变量
    };
    console.log("即将发送事件的数据：", eventDetail);

    setTimeout(() => {
        const event = new CustomEvent("currentExaminationRecordUpdated", { detail: eventDetail });
        window.dispatchEvent(event);
        console.log("currentExaminationRecordUpdated 事件已触发"); // 添加日志
    }, 100);
}


// 填充检查记录年份和日期
function fillRecordList(records) {
    const yearList = document.getElementById("yearList");
    yearList.innerHTML = ''; // 清空现有内容

    const recordsByYear = {};
    records.forEach(record => {
        const date = new Date(record.examination_date);
        const year = date.getFullYear();
        const monthDay = `${date.getMonth() + 1}月${date.getDate()}日`;

        if (!recordsByYear[year]) recordsByYear[year] = [];
        recordsByYear[year].push({ ...record, displayDate: monthDay });
    });

    const sortedYears = Object.keys(recordsByYear).sort((a, b) => b - a);
    sortedYears.forEach(year => {
        const yearItem = document.createElement("li");
        yearItem.classList.add("year-item");
        yearItem.innerHTML = `<span class="year-icon">📅</span><strong>${year}年</strong><span class="arrow">▼</span>`;

        yearItem.onclick = (e) => {
            e.stopPropagation();
            const existingDateList = yearItem.nextElementSibling;
            if (existingDateList && existingDateList.classList.contains("date-list")) {
                existingDateList.remove();
                yearItem.querySelector(".arrow").textContent = "▼";
            } else {
                document.querySelectorAll(".date-list").forEach(list => list.remove());
                document.querySelectorAll(".arrow").forEach(arrow => arrow.textContent = "▼");

                const dateList = document.createElement("ul");
                dateList.classList.add("date-list");

                recordsByYear[year].sort((a, b) => new Date(b.examination_date) - new Date(a.examination_date))
                    .forEach(record => {
                        const dateItem = document.createElement("li");
                        dateItem.classList.add("date-item");
                        dateItem.textContent = record.displayDate;

                        dateItem.onclick = (e) => {
                            e.stopPropagation();
                            setCurrentExaminationRecord(record); // 设置当前记录
                            updateActiveDateItem(dateItem);
                        };
                        dateList.appendChild(dateItem);
                    });

                yearItem.insertAdjacentElement("afterend", dateList);
                yearItem.querySelector(".arrow").textContent = "▲";
            }
        };

        yearList.appendChild(yearItem);
    });
}

// 更新选中日期的样式
function updateActiveDateItem(selectedItem) {
    document.querySelectorAll(".date-item").forEach(item => item.classList.remove("selected"));
    selectedItem.classList.add("selected");
}

// 显示最早的轴率比数据
function displayInitialAxisRatio() {
    if (!allExaminationRecords.length) {
        document.getElementById("initialAxisRatio").textContent = "初始轴率比: 数据缺失";
        return;
    }

    let leftAxisRatio, rightAxisRatio;

    // 从后往前遍历检查记录，直到找到有效数据
    for (let i = allExaminationRecords.length - 1; i >= 0; i--) {
        const record = allExaminationRecords[i];

        // 转换为数字进行计算
        const rightEyeAxialLength = parseFloat(record.right_eye_axial_length);
        const rightEyeK1 = parseFloat(record.right_eye_k1);
        const rightEyeK2 = parseFloat(record.right_eye_k2);
        const leftEyeAxialLength = parseFloat(record.left_eye_axial_length);
        const leftEyeK1 = parseFloat(record.left_eye_k1);
        const leftEyeK2 = parseFloat(record.left_eye_k2);
            // 格式化小数为两位
    const formatDecimal = (value, decimals) => {
        return value.toFixed(decimals);
    };

        // 检查数据是否有效（确保是数字）
        if (!isNaN(rightEyeAxialLength) && !isNaN(rightEyeK1) && !isNaN(rightEyeK2) &&
            !isNaN(leftEyeAxialLength) && !isNaN(leftEyeK1) && !isNaN(leftEyeK2)) {

            // 计算轴率比
            rightAxisRatio = rightEyeAxialLength * ((rightEyeK1 + rightEyeK2) / (2 * 337.5));
            leftAxisRatio = leftEyeAxialLength * ((leftEyeK1 + leftEyeK2) / (2 * 337.5));

            // 格式化为两位小数
            rightAxisRatio = formatDecimal(rightAxisRatio, 2);
            leftAxisRatio = formatDecimal(leftAxisRatio, 2);

            break;  // 找到有效数据后跳出循环
        }
    }

    // 如果没有有效数据
    if (leftAxisRatio == null || rightAxisRatio == null) {
        document.getElementById("initialAxisRatio").textContent = "初始轴率比: 数据缺失";
    } else {
        document.getElementById("initialAxisRatio").textContent = `初始轴率比: 右眼${rightAxisRatio}/左眼${leftAxisRatio}`;
    }
}

// 切换子页面
function loadModule(moduleName) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ''; // 清空当前页面内容
    currentModule = moduleName; // 更新当前模块名

    // 动态加载模块 HTML
    fetch(`../../templates/modulename/${moduleName}.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load module: ${moduleName} (status: ${response.status})`);
            }
            return response.text();
        })
        .then(html => {
            mainContent.innerHTML = html; // 插入模块的 HTML

            // 动态加载 CSS
            if (!document.getElementById(`css-${moduleName}`)) {
                const link = document.createElement('link');
                link.id = `css-${moduleName}`;
                link.rel = 'stylesheet';
                link.href = `../../static/css/${moduleName}.css`;
                document.head.appendChild(link);
            }

            // 动态加载 JavaScript，并在加载完成后调用初始化函数
            if (!document.getElementById(`js-${moduleName}`)) {
                const script = document.createElement('script');
                script.id = `js-${moduleName}`;
                script.src = `../../static/js/${moduleName}.js`;

                script.onload = () => {
                    console.log(`${moduleName}.js 加载完成`);

                    // 根据模块名调用对应的初始化函数
                    if (moduleName === 'routine') {
                        if (typeof refreshRoutineCheckupPage === 'function') {
                            refreshRoutineCheckupPage(); // 调用 routine 页面初始化
                        }
                    } else if (moduleName === 'vision') {
                        if (typeof refreshCurrentModule === 'function') {
                            refreshCurrentModule(); // 调用 vision 页面初始化
                        }
                    } else if (moduleName === 'functional') {
                        if (typeof initializeFunctionalPage === 'function') {
                            initializeFunctionalPage(); // 调用 functional 页面初始化
                        }
                    } else if (moduleName === 'treatment') {
                        if (typeof initializeTreatmentPage === 'function') {
                            initializeTreatmentPage(); // 调用 treatment 页面初始化
                        }
                    } else if (moduleName === 'basic') {
                        if (typeof refreshBasicExaminationPage === 'function') {
                            refreshBasicExaminationPage(); // 调用 basic 页面初始化
                        }
                    }
                };

                document.body.appendChild(script);
            } else {
                // 如果 script 已经加载过，直接调用刷新函数
                if (moduleName === 'routine') {
                    if (typeof refreshRoutineCheckupPage === 'function') {
                        refreshRoutineCheckupPage();
                    }
                } else if (moduleName === 'vision') {
                    if (typeof refreshCurrentModule === 'function') {
                        refreshCurrentModule();
                    }
                } else if (moduleName === 'functional') {
                    if (typeof initializeFunctionalPage === 'function') {
                        initializeFunctionalPage(); // 调用 functional 页面初始化
                    }
                } else if (moduleName === 'treatment') {
                    if (typeof initializeTreatmentPage === 'function') {
                        initializeTreatmentPage(); // 调用 treatment 页面初始化
                    }
                } else if (moduleName === 'basic') {
                    if (typeof refreshBasicExaminationPage === 'function') {
                        refreshBasicExaminationPage(); // 调用 basic 页面初始化
                    }
                }
            }

            updateActiveButton(moduleName); // 更新当前活动按钮的状态
        })
        .catch(error => {
            console.error("加载模块时出错:", error);
            mainContent.innerHTML = `<p>无法加载 ${moduleName} 模块，请稍后再试。</p>`;
        });
}

// 刷新当前模块的函数，根据不同模块调用对应的刷新函数
function refreshCurrentModule() {
    switch (currentModule) {
        case 'basic':
            if (typeof refreshBasicExaminationPage === 'function') {
                refreshBasicExaminationPage();
            }
            break;
        case 'routine':
            if (typeof refreshRoutineCheckupPage === 'function') {
                refreshRoutineCheckupPage();
            }
            break;
        case 'vision': // 新增 vision 模块的刷新支持
            if (typeof refreshVisionPage === 'function') {
                refreshVisionPage();
            }
            break;
        default:
            console.warn("未知的模块，无法刷新数据。");
    }
}


// 更新按钮的选中状态
function updateActiveButton(moduleName) {
    document.querySelectorAll('.top-bar button').forEach(button => button.classList.remove('active'));
    const activeButton = document.querySelector(`.top-bar button[onclick="loadModule('${moduleName}')"]`);
    if (activeButton) activeButton.classList.add('active');
}

// 页面加载完成后，获取患者数据并加载默认模块
document.addEventListener("DOMContentLoaded", () => {
    fetchPatientData(); // 获取患者数据
});
