const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const XLSX = require('xlsx')
const fs = require('fs')
const os = require('os')
const QRCode = require('qrcode')

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: '视光中心-桌面应用程序',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    }
  })

  // 直接使用 Vite 开发服务器的默认地址
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    // 生产环境下加载打包后的文件
    // win.loadFile(path.join(__dirname, '../dist/index.html'))
    // const indexPath = path.resolve(__dirname, '..', 'dist', 'index.html'); // 20250314 zsm
    // console.log('Loading file:', indexPath); // 打印路径进行调试20250314 zsm
    // win.loadFile(indexPath).catch(err => console.error('Failed to load index.html:', err));//20250314 zsm


    // 直接加载线上 HTML  20250314 zsm
  const onlineIndex = "https://aiforoptometry.com/media/exehtml/index.html";
  console.log("Loading online page:", onlineIndex);

  win.loadURL(onlineIndex)
    .then(() => console.log("Successfully loaded online index.html"))
    .catch(err => console.error("Failed to load online index.html:", err));
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Excel Files', extensions: ['xls', 'xlsx'] }]
  })
  return result.filePaths[0]
})

ipcMain.handle('read-excel', async (event, filePath) => {
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet)
  return data
})

ipcMain.handle('save-template', async () => {
  const result = await dialog.showSaveDialog({
    defaultPath: '批量导入模板.xlsx',
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
  })
  if (!result.canceled) {
    const workbook = XLSX.utils.book_new()
    const worksheetData = [
      ['姓名', '手机号', '性别', '出生日期', '建档日期'],
      ['张三', '13812345678', '男', '1990/1/1', '2024/11/1']
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    XLSX.writeFile(workbook, result.filePath)
    return result.filePath
  }
  return null
})

// 确保所有 ipcMain.handle 定义都在此之后
console.log('Registering ipcMain handler for print-qrcode');

function createTempHtmlFile(data) {
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, 'batch_qrcode_print.html');

  // 处理单个二维码和批量二维码的情况
  const qrCodeImages = Array.isArray(data) 
    ? data.map(patient => `
      <div style="page-break-after: always;">
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
          <img src="${patient.qrCodeUrl}" alt="患者二维码" style="max-width: 100%;" />
        </div>
      </div>
    `).join('')
    : `
      <div style="text-align: center;">
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
          <img src="${data}" alt="患者二维码" style="max-width: 100%;" />
        </div>
      </div>
    `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            div {
              page-break-inside: avoid;
            }
          }
        </style>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }, 500);
          };
        </script>
      </head>
      <body>
        ${qrCodeImages}
      </body>
    </html>
  `;

  fs.writeFileSync(tempFilePath, htmlContent);
  return tempFilePath;
}

ipcMain.handle('print-qrcode', async (event, qrCodeUrl) => {
  console.log('ipcMain received print-qrcode with URL:', qrCodeUrl);
  return new Promise((resolve, reject) => {
    try {
      const tempFilePath = createTempHtmlFile(qrCodeUrl);
      
      shell.openExternal(`file://${tempFilePath}`)
        .then(() => {
          console.log('成功在浏览器中打开打印页面');
          resolve();
        })
        .catch(err => {
          console.error('打开浏览器失败:', err);
          reject(err);
        });
    } catch (error) {
      console.error('创建临时文件失败:', error);
      reject(error);
    }
  });
});

ipcMain.handle('batch-print-qrcode', async (event, patientsWithQrCode) => {
  console.log('ipcMain received batch-print-qrcode with patients:', patientsWithQrCode);
  return new Promise((resolve, reject) => {
    try {
      // 确保传入的是数组
      const patientsArray = Array.isArray(patientsWithQrCode) ? patientsWithQrCode : [patientsWithQrCode];
      
      const tempFilePath = createTempHtmlFile(patientsArray);
      
      shell.openExternal(`file://${tempFilePath}`)
        .then(() => {
          console.log('成功在浏览器中打开批量打印页面');
          resolve();
        })
        .catch(err => {
          console.error('打开浏览器失败:', err);
          reject(err);
        });
    } catch (error) {
      console.error('批量打印失败:', error);
      reject(error);
    }
  });
});

ipcMain.handle('print-sales-order', async (event, salesOrderData) => {
  console.log('ipcMain received print-sales-order with data:', salesOrderData);
  return new Promise((resolve, reject) => {
    try {
      // 生成所有页面的HTML
      let allPagesHTML = '';
      
      for (let pageIndex = 0; pageIndex < salesOrderData.totalPages; pageIndex++) {
        const startIndex = pageIndex * salesOrderData.itemsPerPage;
        const endIndex = Math.min(startIndex + salesOrderData.itemsPerPage, salesOrderData.items.length);
        const pageItems = salesOrderData.items.slice(startIndex, endIndex);
        
        // 计算当前页的金额汇总
        const pageTotalAmount = pageItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        // 生成商品行HTML
        const itemsHTML = pageItems.map(item => {
          const productName = item.product_name || '未知商品';
          const productDetails = getProductDetails(item);
          const quantity = item.quantity || 1;
          const salePrice = (item.sale_price || 0).toFixed(2);
          const discount = formatDiscount(item.discount, item.sale_price);
          const totalPrice = (item.total_price || 0).toFixed(2);
          
          return `<div class="table-row">
            <div>${productName}</div>
            <div>${productDetails}</div>
            <div>${quantity}</div>
            <div>¥${salePrice}</div>
            <div>${discount}</div>
            <div>¥${totalPrice}</div>
          </div>`;
        }).join('');
        
        // 生成空行HTML
        const emptyRowsHTML = Array(Math.max(0, 10 - pageItems.length)).fill().map(() => 
          `<div class="table-row empty-row">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>`
        ).join('');
        
        // 生成金额汇总HTML
        const summaryHTML = pageIndex === salesOrderData.totalPages - 1 ? 
          `<div class="summary-row">
            <span>商品总额：</span>
            <span>¥${(salesOrderData.totalAmount || 0).toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>应收金额：</span>
            <span>¥${(salesOrderData.receivableAmount || 0).toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>收款详情：</span>
            <span>${getPaymentChannelsText(salesOrderData.paymentChannels)}</span>
          </div>
          <div class="summary-row total">
            <span>实收金额：</span>
            <span>¥${(salesOrderData.actualAmount || 0).toFixed(2)}</span>
          </div>
          ${salesOrderData.debtAmount > 0 ? 
            `<div class="summary-row debt">
              <span>欠款金额：</span>
              <span>¥${(salesOrderData.debtAmount || 0).toFixed(2)}</span>
            </div>` 
            : ''}` 
          : 
          `<div class="summary-row">
            <span>本页小计：</span>
            <span>¥${pageTotalAmount.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>（未完待续）</span>
            <span></span>
          </div>`;
        
        const pageHTML = `<div class="print-page" style="page-break-after: ${pageIndex < salesOrderData.totalPages - 1 ? 'always' : 'avoid'};">
          <div class="print-preview">
            <div class="sales-header">
              <div class="clinic-info">
                <h1>${salesOrderData.clinicName}</h1>
                <p>地址：${salesOrderData.clinicAddress}</p>
                <p>电话：${salesOrderData.clinicPhone}</p>
              </div>
              <div class="sales-info">
                <h2>销售单${salesOrderData.totalPages > 1 ? ` (第${pageIndex + 1}页/共${salesOrderData.totalPages}页)` : ''}</h2>
                <p>日期：${salesOrderData.saleDate}</p>
                <p>操作员：${salesOrderData.operator}</p>
              </div>
            </div>

            <div class="patient-info">
              <h3>患者信息</h3>
              <div class="info-grid">
                <div>姓名：${salesOrderData.patientInfo?.name || ''}</div>
                <div>性别：${salesOrderData.patientInfo?.gender === 'male' ? '男' : '女'}</div>
                <div>手机号：${salesOrderData.patientInfo?.phone || ''}</div>
                <div>出生日期：${salesOrderData.patientInfo?.birthDate || ''}</div>
              </div>
            </div>

            <div class="sales-items">
              <h3>销售明细</h3>
              <div class="items-table">
                <div class="table-header">
                  <div>商品名称</div>
                  <div>规格/详情</div>
                  <div>数量</div>
                  <div>单价</div>
                  <div>优惠价</div>
                  <div>小计</div>
                </div>
                <div class="table-body">
                  ${itemsHTML}
                  ${emptyRowsHTML}
                </div>
              </div>
            </div>

            <div class="amount-summary">
              ${summaryHTML}
            </div>

            <div class="footer-info">
              <div class="print-time">
                <p>打印时间：${salesOrderData.printTime}</p>
              </div>
            </div>
          </div>
        </div>`;
        
        allPagesHTML += pageHTML;
      }
      
      // 构建完整的HTML内容
      const printHTML = `<!DOCTYPE html>
<html>
  <head>
    <title>销售单</title>
    <style>
      /* 自定义横版纸张样式 - 240mm × 160mm */
      @page { 
        size: 240mm 160mm; 
        margin: 6mm 4mm; 
      }
      
      body { 
        margin: 0; 
        padding: 0; 
        font-family: 'Microsoft YaHei', Arial, sans-serif; 
        font-size: 13px; 
        line-height: 1.4;
        width: 232mm; /* 240mm宽度减去8mm边距 */
        height: 148mm; /* 160mm高度减去12mm边距 */
      }
      
      .print-page {
        width: 232mm;
        height: 148mm;
        margin: 0;
        padding: 0;
      }
      
      .sales-header { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 10px; 
        border-bottom: 1px solid #000; 
        padding-bottom: 6px; 
      }
      
      .clinic-info h1 { 
        font-size: 18px; 
        font-weight: bold; 
        margin: 0 0 3px 0; 
        color: #1890ff; 
      }
      
      .clinic-info p { 
        margin: 2px 0; 
        font-size: 11px; 
        color: #666; 
      }
      
      .sales-info h2 { 
        font-size: 16px; 
        font-weight: bold; 
        margin: 0 0 6px 0; 
        text-align: center; 
        color: #1890ff; 
      }
      
      .sales-info p { 
        margin: 2px 0; 
        font-size: 11px; 
      }
      
      .patient-info, .sales-items, .amount-summary { 
        margin-bottom: 10px; 
      }
      
      .patient-info h3, .sales-items h3 { 
        font-size: 15px; 
        font-weight: bold; 
        margin: 0 0 6px 0; 
        border-bottom: 1px solid #1890ff; 
        padding-bottom: 3px; 
        color: #1890ff; 
      }
      
      .info-grid { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 6px; 
        font-size: 12px;
      }
      
      .items-table { 
        border: 1px solid #d9d9d9; 
        margin-top: 6px; 
        font-size: 11px;
        height: 180px; /* 固定高度 - 调整为适应10个条目，增加更多空间 */
        overflow: hidden;
      }
      
      .table-header { 
        display: grid; 
        grid-template-columns: 1.2fr 1.5fr 0.6fr 0.6fr 0.6fr 0.8fr; 
        background: #f5f5f5; 
        font-weight: bold; 
        border-bottom: 1px solid #d9d9d9; 
        height: 28px; /* 固定表头高度 - 增加高度 */
      }
      
      .table-body {
        height: 152px; /* 固定表格体高度 - 调整为适应10个条目，增加更多空间 */
        overflow: hidden;
      }
      
      .table-row { 
        display: grid; 
        grid-template-columns: 1.2fr 1.5fr 0.6fr 0.6fr 0.6fr 0.8fr; 
        border-bottom: 1px solid #f0f0f0; 
        height: 15.2px; /* 固定行高，152px / 10行 = 15.2px */
      }
      
      .empty-row {
        background: #fafafa;
      }
      
      .table-header > div, .table-row > div { 
        padding: 2px 3px; 
        border-right: 1px solid #f0f0f0; 
        display: flex; 
        align-items: center; 
        word-break: break-word; 
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .table-header > div:last-child, .table-row > div:last-child { 
        border-right: none; 
      }
      
      .summary-row { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 4px; 
        padding: 2px 0; 
        font-size: 12px;
      }
      
      .summary-row.total { 
        font-weight: bold; 
        font-size: 14px; 
        border-top: 1px solid #1890ff; 
        padding-top: 6px; 
        margin-top: 6px; 
        color: #1890ff; 
      }
      
      .summary-row.debt { 
        color: #ff4d4f; 
        font-weight: bold; 
      }
      
      .footer-info { 
        margin-top: 15px; 
        display: flex; 
        justify-content: flex-end; 
        border-top: 1px solid #d9d9d9; 
        padding-top: 10px; 
        font-size: 11px;
      }
      
      .print-time { 
        text-align: right; 
        font-size: 10px; 
        color: #999; 
      }
      
      /* 确保内容不超出自定义横版页面 */
      .print-preview {
        max-width: 232mm;
        max-height: 148mm;
        overflow: hidden;
      }
      
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .print-page {
          page-break-inside: avoid;
        }
      }
    </style>
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
          setTimeout(function() {
            window.close();
          }, 1000);
        }, 500);
      };
    </script>
  </head>
  <body>
    ${allPagesHTML}
  </body>
</html>`;

      // 创建临时HTML文件
      const tempFilePath = path.join(os.tmpdir(), `sales-order-${Date.now()}.html`);
      
      fs.writeFileSync(tempFilePath, printHTML);
      
      shell.openExternal(`file://${tempFilePath}`)
        .then(() => {
          console.log('成功在浏览器中打开销售单打印页面');
          resolve();
        })
        .catch(err => {
          console.error('打开浏览器失败:', err);
          reject(err);
        });
    } catch (error) {
      console.error('销售单打印失败:', error);
      reject(error);
    }
  });
});

// 辅助函数
function getProductDetails(item) {
  const details = [];
  
  if (item.category === 'lens') {
    if (item.sphere !== undefined) details.push(`球镜: ${Number(item.sphere).toFixed(2)}D`);
    if (item.cylinder !== undefined && item.cylinder !== 0) details.push(`柱镜: ${Number(item.cylinder).toFixed(2)}D`);
    if (item.axis !== undefined) details.push(`轴位: ${item.axis}°`);
    if (item.eye) details.push(`眼别: ${item.eye === 'left' ? '左眼' : '右眼'}`);
  } else if (item.category === 'frame') {
    if (item.model) details.push(`型号: ${item.model}`);
    if (item.material) details.push(`材质: ${item.material}`);
  } else if (item.category === 'soft_contact') {
    if (item.type) details.push(`类型: ${item.type}`);
    if (item.sphere !== undefined) details.push(`球镜: ${Number(item.sphere).toFixed(2)}D`);
    if (item.batch_number) details.push(`批号: ${item.batch_number}`);
  } else if (item.category === 'solution') {
    if (item.type) details.push(`类型: ${item.type}`);
    if (item.specification) details.push(`规格: ${item.specification}`);
    if (item.batch_number) details.push(`批号: ${item.batch_number}`);
  } else if (item.category === 'non_medical') {
    if (item.production_date) details.push(`生产日期: ${item.production_date}`);
    if (item.expiry_date) details.push(`到期日期: ${item.expiry_date}`);
  } else if (item.category === 'service') {
    if (item.remark) details.push(`备注: ${item.remark}`);
  }
  
  return details.length > 0 ? details.join(', ') : '无';
}

function formatDiscount(discount, sale_price) {
  if (discount === null || discount === undefined || discount === 1) {
    return `¥${sale_price?.toFixed(2) || '0.00'}`;
  }
  if (discount === 0) return '免费';
  const discountedPrice = (sale_price || 0) * discount;
  return `¥${discountedPrice.toFixed(2)}`;
}

// 获取收款渠道信息文本
function getPaymentChannelsText(paymentChannels) {
  const channels = paymentChannels || {};
  const channelList = [];
  
  if (channels.cash_amount && channels.cash_amount > 0) {
    channelList.push(`现金 ¥${Number(channels.cash_amount).toFixed(2)}`);
  }
  if (channels.alipay_amount && channels.alipay_amount > 0) {
    channelList.push(`支付宝 ¥${Number(channels.alipay_amount).toFixed(2)}`);
  }
  if (channels.wechat_amount && channels.wechat_amount > 0) {
    channelList.push(`微信 ¥${Number(channels.wechat_amount).toFixed(2)}`);
  }
  if (channels.bank_amount && channels.bank_amount > 0) {
    channelList.push(`银行卡 ¥${Number(channels.bank_amount).toFixed(2)}`);
  }
  if (channels.meituan_amount && channels.meituan_amount > 0) {
    channelList.push(`美团 ¥${Number(channels.meituan_amount).toFixed(2)}`);
  }
  if (channels.douyin_amount && channels.douyin_amount > 0) {
    channelList.push(`抖音 ¥${Number(channels.douyin_amount).toFixed(2)}`);
  }
  if (channels.other_amount && channels.other_amount > 0) {
    channelList.push(`其他 ¥${Number(channels.other_amount).toFixed(2)}`);
  }
  
  return channelList.length > 0 ? channelList.join(', ') : '未记录';
}