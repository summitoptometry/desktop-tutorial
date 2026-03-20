<template>
  <a-modal
    :open="visible"
    title="打印销售单"
    width="1200px"
    :footer="null"
    @cancel="handleCancel"
    @update:open="(val) => emit('update:visible', val)"
  >
    <div class="print-content">
      <div class="print-preview" ref="printRef">
                 <div class="sales-header">
           <div class="clinic-info">
             <h1>{{ getClinicName() }}</h1>
             <p>地址：{{ getClinicAddress() }}</p>
             <p>电话：{{ getClinicPhone() }}</p>
           </div>
                     <div class="sales-info">
             <h2>销售单</h2>
             <p>日期：{{ formatDate(salesData.saleDate) }}</p>
             <p>操作员：{{ salesData.operator }}</p>
           </div>
        </div>

        <div class="patient-info">
          <h3>患者信息</h3>
          <div class="info-grid">
            <div>姓名：{{ salesData.patientInfo?.name }}</div>
            <div>性别：{{ getGenderText(salesData.patientInfo?.gender) }}</div>
            <div>手机号：{{ salesData.patientInfo?.phone }}</div>
            <div>出生日期：{{ formatDate(salesData.patientInfo?.birthDate) }}</div>
          </div>
        </div>

        <div class="sales-items">
          <h3>销售明细</h3>
          <div v-if="getTotalPages() > 1" class="page-info">
            <span>共{{ getTotalPages() }}页，每页最多10个条目</span>
          </div>
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
              <div v-for="(item, index) in salesData.items" :key="index" class="table-row">
                <div>{{ getProductName(item) }}</div>
                <div>{{ getProductDetails(item) }}</div>
                <div>{{ item.quantity || 1 }}</div>
                <div>¥{{ item.sale_price?.toFixed(2) || '0.00' }}</div>
                <div>{{ formatDiscount(item.discount, item.sale_price) }}</div>
                <div>¥{{ (item.total_price || 0).toFixed(2) }}</div>
              </div>
              <div v-for="i in Math.max(0, 10 - (salesData.items || []).length)" :key="`empty-${i}`" class="table-row empty-row">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="amount-summary">
          <div class="summary-row">
            <span>商品总额：</span>
            <span>¥{{ salesData.totalAmount?.toFixed(2) || '0.00' }}</span>
          </div>
          <div class="summary-row">
            <span>应收金额：</span>
            <span>¥{{ salesData.receivableAmount?.toFixed(2) || '0.00' }}</span>
          </div>
          <div class="summary-row">
            <span>收款详情：</span>
            <span>{{ getPaymentChannelsText() }}</span>
          </div>
          <div class="summary-row total">
            <span>实收金额：</span>
            <span>¥{{ salesData.actualAmount?.toFixed(2) || '0.00' }}</span>
          </div>
          <div v-if="salesData.debtAmount > 0" class="summary-row debt">
            <span>欠款金额：</span>
            <span>¥{{ salesData.debtAmount?.toFixed(2) || '0.00' }}</span>
          </div>
        </div>

                 <div class="footer-info">
           <div class="print-time">
             <p>打印时间：{{ formatDateTime(new Date()) }}</p>
           </div>
         </div>
      </div>

      <div class="print-actions">
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" @click="handlePrint">打印</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import dayjs from 'dayjs';
import { message } from 'ant-design-vue';
import html2canvas from 'html2canvas';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  salesData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:visible', 'close']);
const printRef = ref(null);

const formatDate = (dateString) => {
  if (!dateString) return '';
  return dayjs(dateString).format('YYYY-MM-DD');
};

const formatDateTime = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

// 获取性别文本
const getGenderText = (gender) => {
  console.log('性别处理调试 - 原始值:', gender, '类型:', typeof gender);
  
  if (!gender) return '未知';
  
  // 转换为字符串并转为小写，以便统一处理
  const genderStr = String(gender).toLowerCase();
  console.log('性别处理调试 - 处理后:', genderStr);
  
  // 支持多种性别格式
  if (genderStr === 'male' || genderStr === 'm' || genderStr === '1' || genderStr === '男') {
    console.log('性别处理调试 - 识别为男性');
    return '男';
  } else if (genderStr === 'female' || genderStr === 'f' || genderStr === '2' || genderStr === '女') {
    console.log('性别处理调试 - 识别为女性');
    return '女';
  } else {
    console.log('性别处理调试 - 无法识别，返回未知');
    return '未知';
  }
};

const getProductName = (item) => {
  return item.product_name || '未知商品';
};

// 获取材质名称
const getMaterialName = (material) => {
  const materialMap = {
    'titanium': '钛',
    'alloy': '合金',
    'tr': 'TR',
    'metal': '金属',
    'plastic': '塑料',
    'carbon': '碳纤维'
  };
  return materialMap[material] || material;
};

// 获取眼别名称
const getEyeName = (eye) => {
  if (eye === 'left') return '左眼';
  if (eye === 'right') return '右眼';
  return eye;
};

// 获取隐形眼镜类型名称
const getSoftContactTypeName = (type) => {
  const typeMap = {
    'daily': '日抛',
    'weekly': '周抛',
    'monthly': '月抛',
    'quarterly': '季抛',
    'yearly': '年抛'
  };
  return typeMap[type] || type;
};

// 获取护理液类型名称
const getSolutionTypeName = (type) => {
  const typeMap = {
    'solution': '护理液',
    'disinfectant': '消毒液',
    'cleanser': '清洁液',
    'medicine': '药品'
  };
  return typeMap[type] || type;
};

// 获取规格名称
const getSpecName = (spec) => {
  const specMap = {
    '50ml': '50毫升',
    '100ml': '100毫升',
    '150ml': '150毫升',
    '250ml': '250毫升',
    '500ml': '500毫升'
  };
  return specMap[spec] || spec;
};

const getProductDetails = (item) => {
  const details = [];
  
  if (item.category === 'lens') {
    if (item.sphere !== undefined) details.push(`球镜: ${Number(item.sphere).toFixed(2)}D`);
    if (item.cylinder !== undefined && item.cylinder !== 0) details.push(`柱镜: ${Number(item.cylinder).toFixed(2)}D`);
    if (item.axis !== undefined) details.push(`轴位: ${item.axis}°`);
    if (item.eye) details.push(`眼别: ${getEyeName(item.eye)}`);
  } else if (item.category === 'frame') {
    if (item.model) details.push(`型号: ${item.model}`);
    if (item.material) details.push(`材质: ${getMaterialName(item.material)}`);
  } else if (item.category === 'soft_contact') {
    if (item.type) details.push(`类型: ${getSoftContactTypeName(item.type)}`);
    if (item.sphere !== undefined) details.push(`球镜: ${Number(item.sphere).toFixed(2)}D`);
    if (item.cylinder !== undefined && item.cylinder !== 0) details.push(`柱镜: ${Number(item.cylinder).toFixed(2)}D`);
    if (item.axis !== undefined) details.push(`轴位: ${item.axis}°`);
    if (item.eye) details.push(`眼别: ${getEyeName(item.eye)}`);
    if (item.batch_number) details.push(`批号: ${item.batch_number}`);
  } else if (item.category === 'solution') {
    if (item.type) details.push(`类型: ${getSolutionTypeName(item.type)}`);
    if (item.specification) details.push(`规格: ${getSpecName(item.specification)}`);
    if (item.batch_number) details.push(`批号: ${item.batch_number}`);
  } else if (item.category === 'non_medical') {
    if (item.production_date) details.push(`生产日期: ${item.production_date}`);
    if (item.expiry_date) details.push(`到期日期: ${item.expiry_date}`);
  } else if (item.category === 'service') {
    if (item.remark) details.push(`备注: ${item.remark}`);
  }
  
  return details.length > 0 ? details.join(', ') : '无';
};

const formatDiscount = (discount, sale_price) => {
  if (discount === null || discount === undefined || discount === 1) {
    return `¥${sale_price?.toFixed(2) || '0.00'}`;
  }
  if (discount === 0) return '免费';
  const discountedPrice = (sale_price || 0) * discount;
  return `¥${discountedPrice.toFixed(2)}`;
};

// 获取机构信息
const getClinicName = () => {
  const systemSettings = localStorage.getItem('systemSettings');
  if (systemSettings) {
    const settings = JSON.parse(systemSettings);
    return settings.printName || '智慧眼科诊所';
  }
  return '智慧眼科诊所';
};

const getClinicAddress = () => {
  const systemSettings = localStorage.getItem('systemSettings');
  if (systemSettings) {
    const settings = JSON.parse(systemSettings);
    return settings.address || '北京市朝阳区智慧大厦A座';
  }
  return '北京市朝阳区智慧大厦A座';
};

const getClinicPhone = () => {
  const systemSettings = localStorage.getItem('systemSettings');
  if (systemSettings) {
    const settings = JSON.parse(systemSettings);
    return settings.external_contact || '010-12345678';
  }
  return '010-12345678';
};

// 获取收款渠道信息文本
const getPaymentChannelsText = () => {
  // 支持两种字段名：paymentChannels 和 paymentMethods
  const channels = props.salesData.paymentChannels || props.salesData.paymentMethods || {};
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
};

    const getTotalPages = () => {
      const items = props.salesData.items || [];
      const itemsPerPage = 10;
      return Math.ceil(items.length / itemsPerPage);
    };

const handleCancel = () => {
  emit('update:visible', false);
  emit('close');
};

const handlePrint = async () => {
  try {
    // 检查数据是否存在
    if (!props.salesData || Object.keys(props.salesData).length === 0) {
      message.error('销售数据为空，无法打印');
      return;
    }

    console.log('打印数据:', props.salesData);
    
    message.loading('正在生成打印图片...', 0);

    // 等待DOM更新
    await nextTick();

    // 获取打印预览的DOM元素
    const printElement = printRef.value;
    if (!printElement) {
      message.destroy();
      message.error('打印预览元素未找到');
      return;
    }

    // 计算精确的打印纸尺寸（240mm × 139.7mm）
    // 使用 96 DPI 作为基准（浏览器标准），scale 用于提高分辨率
    const mmToPx = (mm) => (mm / 25.4) * 96; // 转换毫米到像素
    const paperWidth = mmToPx(240);  // 约 906px
    const paperHeight = mmToPx(139.7); // 约 528px
    
    // 使用 html2canvas 将销售单转换为图片
    const canvas = await html2canvas(printElement, {
      scale: 3, // 3倍分辨率，确保打印清晰（相当于 288 DPI）
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: paperWidth,   // 精确的纸张宽度
      height: paperHeight  // 精确的纸张高度
    });

    // 将 canvas 转换为 base64 图片
    const imageDataUrl = canvas.toDataURL('image/png', 1.0);
    
    message.destroy();
    console.log('销售单图片生成成功，大小:', (imageDataUrl.length / 1024).toFixed(2), 'KB');

    // 使用与二维码打印相同的方式传递数据
    const { ipcRenderer } = window.require('electron');
    await ipcRenderer.invoke('print-qrcode', imageDataUrl);
    
    message.success('打印指令已发送');
  } catch (error) {
    message.destroy();
    console.error('打印失败:', error);
    message.error('打印失败: ' + error.message);
  }
};
</script>

<style scoped>
.print-content {
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.print-preview {
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 20px;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  /* S2针孔打印纸尺寸 - 240mm × 139.7mm */
  width: 240mm;
  height: 139.7mm;
  margin: 0 auto 20px auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: scale(0.95);
  transform-origin: top center;
  box-sizing: border-box;
  overflow: hidden; /* 防止内容溢出 */
}

.sales-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
  border-bottom: 1px solid #1890ff;
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
  font-size: 9px;
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

.page-info {
  margin-bottom: 6px;
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  font-size: 12px;
}

.items-table {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-top: 6px;
  overflow: hidden;
  font-size: 11px;
  height: 155px; /* 适应139.7mm纸张高度 */
}

.table-header {
  display: grid;
  grid-template-columns: 1.2fr 1.5fr 0.6fr 0.6fr 0.6fr 0.8fr;
  background: #f5f5f5;
  font-weight: bold;
  border-bottom: 1px solid #d9d9d9;
  height: 25px; /* 表头高度 */
}

.table-row {
  display: grid;
  grid-template-columns: 1.2fr 1.5fr 0.6fr 0.6fr 0.6fr 0.8fr;
  border-bottom: 1px solid #f0f0f0;
  height: 13px; /* 固定行高，130px / 10行 = 13px */
}

.table-body {
  height: 130px; /* 表格体高度 - 适应10个条目 */
  overflow: hidden;
}

.empty-row {
  background: #fafafa;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #f9f9f9;
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
  font-size: 9px;
}

.print-time {
  text-align: right;
  font-size: 8px;
  color: #999;
}

.print-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>