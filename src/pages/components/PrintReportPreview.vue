<template>
  <div class="print-report-preview">
    <div class="preview-container">
      <div class="a4-preview-box">
        <!-- Logo水印 -->
        <img 
          v-if="logoUrl" 
          :src="logoUrl" 
          class="logo-watermark" 
          :crossorigin="logoUrl && logoUrl.startsWith('data:') ? 'anonymous' : undefined" 
          @error="handleLogoError" 
        />
        
        <div id="print-preview-area" class="print-preview-area" ref="printAreaRef">
          <!-- 固定抬头区域 -->
          <div class="header-area-fixed">
            <img 
              v-if="logoUrl" 
              :src="logoUrl" 
              class="logo-fixed" 
              :style="logoStyle"
              :crossorigin="logoUrl && logoUrl.startsWith('data:') ? 'anonymous' : undefined" 
              @error="handleLogoError" 
            />
            <div v-if="orgName" class="orgname-fixed">
              {{ orgName }}
            </div>
          </div>
          
          <!-- 报表标题 -->
          <h2 class="report-title">营业额报表</h2>
          
          <!-- 报表信息 -->
          <div class="report-info-row" style="margin-bottom: 16px;">
            <span>统计日期：{{ dateRangeText }}</span>
            <span style="margin-left: 32px;">生成时间：{{ generateTime }}</span>
          </div>
          
          <!-- 统计摘要 -->
          <div class="summary-section" style="margin-bottom: 20px;">
            <div class="summary-row">
              <div class="summary-item">
                <span class="summary-label">总营业额：</span>
                <span class="summary-value">¥{{ formatAmount(statistics.totalRevenue) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">订单数量：</span>
                <span class="summary-value">{{ statistics.totalOrders }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">平均订单金额：</span>
                <span class="summary-value">¥{{ formatAmount(statistics.avgOrderAmount) }}</span>
              </div>
            </div>
            <div class="summary-row" style="margin-top: 12px;">
              <div class="summary-item">
                <span class="summary-label">现金收款：</span>
                <span class="summary-value">¥{{ formatAmount(statistics.paymentStats.cash) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">支付宝收款：</span>
                <span class="summary-value">¥{{ formatAmount(statistics.paymentStats.alipay) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">微信收款：</span>
                <span class="summary-value">¥{{ formatAmount(statistics.paymentStats.wechat) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 报表表格 -->
          <div class="report-table-area">
            <table class="report-table">
              <thead>
                <tr>
                  <th class="col-order-no">订单号</th>
                  <th class="col-date">订单日期</th>
                  <th class="col-operator">操作员</th>
                  <th class="col-amount">订单金额</th>
                  <th class="col-amount">实收金额</th>
                  <th class="col-amount">欠款金额</th>
                  <th class="col-status">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in reportData" :key="row.order_id || idx">
                  <td>{{ row.order_no || '-' }}</td>
                  <td>{{ formatDate(row.sale_date) }}</td>
                  <td>{{ row.operator || '-' }}</td>
                  <td class="amount">¥{{ formatAmount(row.total_amount) }}</td>
                  <td class="amount">¥{{ formatAmount(row.actual_amount) }}</td>
                  <td class="amount">¥{{ formatAmount(row.debt_amount) }}</td>
                  <td>{{ row.status || '-' }}</td>
                </tr>
                <!-- 占位行，撑满高度 -->
                <tr v-for="i in (15 - reportData.length)" v-if="reportData.length < 15" :key="'empty'+i">
                  <td v-for="col in 7" :key="col">&nbsp;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 打印按钮 -->
    <div class="print-actions">
      <a-button type="primary" size="large" @click="handlePrint">
        打印
      </a-button>
      <a-button size="large" @click="$emit('close')" style="margin-left: 8px;">
        关闭
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { defineProps, defineEmits } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');

const props = defineProps({
  reportData: {
    type: Array,
    default: () => []
  },
  statistics: {
    type: Object,
    default: () => ({
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderAmount: 0,
      paymentStats: {
        cash: 0,
        alipay: 0,
        wechat: 0,
        bank: 0,
        other: 0
      }
    })
  },
  dateRange: {
    type: Array,
    default: () => []
  },
  logoUrl: String,
  orgName: String
});

const emit = defineEmits(['print', 'close']);

const printAreaRef = ref(null);

// Logo样式
const logoStyle = ref({
  maxWidth: '72px',
  maxHeight: '48px',
  top: '10px',
  right: '40px'
});

// 加载保存的logo样式
const loadLogoStyle = () => {
  const savedStyle = localStorage.getItem('print_logo_style');
  if (savedStyle) {
    try {
      const style = JSON.parse(savedStyle);
      logoStyle.value = { ...logoStyle.value, ...style };
    } catch (error) {
      console.error('解析保存的logo样式失败:', error);
    }
  }
};

// 日期范围文本
const dateRangeText = computed(() => {
  if (!props.dateRange || props.dateRange.length < 2) {
    return '-';
  }
  const start = dayjs(props.dateRange[0]).format('YYYY-MM-DD');
  const end = dayjs(props.dateRange[1]).format('YYYY-MM-DD');
  return `${start} 至 ${end}`;
});

// 生成时间
const generateTime = computed(() => {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
});

// 格式化金额
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00';
  return Number(amount).toFixed(2);
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY-MM-DD');
};

// 处理打印
const handlePrint = async () => {
  await nextTick();
  if (printAreaRef.value) {
    emit('print', printAreaRef.value);
  }
};

// 处理logo加载错误
const handleLogoError = (event) => {
  console.error('[PrintReportPreview] Logo加载失败:', event.target.src);
};

onMounted(() => {
  loadLogoStyle();
});
</script>

<style scoped>
.print-report-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
  position: relative;
  width: 100%;
  flex: 1;
  padding: 20px;
  box-sizing: border-box;
  overflow: auto;
}

.a4-preview-box {
  width: 794px;
  height: 1123px;
  background: #fff;
  margin: 0 auto;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.08);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.print-preview-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
  background: transparent !important;
}

.header-area-fixed {
  position: relative;
  width: 100%;
  height: 60px;
  margin-bottom: 0;
  background: transparent;
}

.logo-fixed {
  position: absolute;
  top: 10px;
  right: 40px;
  max-width: 72px;
  max-height: 48px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.orgname-fixed {
  position: absolute;
  top: 14px;
  left: 32px;
  font-size: 24px;
  font-weight: 700;
  color: #1976d2;
  letter-spacing: 2px;
  font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', Arial, sans-serif;
}

.report-title {
  text-align: center;
  color: #224B96;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 4px;
  margin: 16px 0;
  font-family: 'Segoe UI', 'PingFang SC', Arial, sans-serif;
}

.report-info-row {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.summary-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  margin: 4px 0;
}

.summary-label {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.report-table-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.report-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(25,118,210,0.04);
}

.report-table th {
  background: #e3f0fb;
  color: #1976d2;
  font-weight: 700;
  font-size: 14px;
  padding: 10px 8px;
  text-align: center;
  border-bottom: 2px solid #e3eaf2;
}

.report-table td {
  background: #fff;
  color: #222;
  font-size: 13px;
  padding: 8px;
  text-align: center;
  border-bottom: 1px solid #e3eaf2;
}

.report-table tr:last-child td {
  border-bottom: none;
}

.report-table .amount {
  text-align: right;
  font-weight: 500;
}

.report-table .col-order-no {
  width: 15%;
}

.report-table .col-date {
  width: 12%;
}

.report-table .col-operator {
  width: 10%;
}

.report-table .col-amount {
  width: 15%;
}

.report-table .col-status {
  width: 10%;
}

.logo-watermark {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(-25deg);
  opacity: 0.15;
  max-width: 70%;
  max-height: 70%;
  z-index: 99999;
  pointer-events: none;
  filter: grayscale(15%) blur(0.3px);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.print-actions {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: white;
  border-top: 1px solid #e8e8e8;
}

/* 打印样式 */
@media print {
  @page {
    size: A4 portrait;
    margin: 0;
    padding: 0;
    width: 210mm;
    height: 297mm;
  }
  
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  html, body {
    background: #fff !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
  }
  
  .preview-container {
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  .a4-preview-box {
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    background: #fff !important;
    transform: none !important;
  }
  
  .print-preview-area {
    padding: 15mm !important;
    height: calc(297mm - 30mm) !important;
    box-sizing: border-box !important;
  }
  
  .print-actions {
    display: none !important;
  }
  
  .logo-watermark {
    opacity: 0.12 !important;
    filter: grayscale(20%) blur(0.2px) !important;
  }
}
</style>
