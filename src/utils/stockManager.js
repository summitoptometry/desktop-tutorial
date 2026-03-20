// 库存记录的数据结构
const createStockRecord = (params) => {
  const {
    productId,
    productName,
    type, // 产品类型：frame/lens/soft_contact/solution/accessory
    adjustType, // 调整类型：in/out
    adjustAmount, // 调整数量
    beforeStock, // 调整前库存
    afterStock, // 调整后库存
    remark, // 备注
    operator = '系统', // 操作人
    type_id, // 新增：类型表中的id
    detail // 新增：详情
  } = params;

  return {
    id: Date.now(), // 使用时间戳作为唯一ID
    timestamp: new Date().toISOString(),
    productId,
    productName,
    type,
    adjustType,
    adjustAmount,
    beforeStock,
    afterStock,
    remark,
    operator,
    type_id, // 新增
    detail // 新增
  };
};

// 获取库存记录
const getStockHistory = (type) => {
  const key = `${type}_stock_history`;
  const history = localStorage.getItem(key);
  return history ? JSON.parse(history) : [];
};

// 保存库存记录
const saveStockHistory = (type, record) => {
  const key = `${type}_stock_history`;
  const history = getStockHistory(type);
  history.unshift(record); // 新记录添加到开头
  localStorage.setItem(key, JSON.stringify(history));
};

// 调整库存
const adjustStock = async (params) => {
  const {
    type, // 产品类型
    productId,
    adjustAmount,
    adjustType,
    remark
  } = params;

  // 获取当前库存数据
  const key = type === 'soft_contact' ? 'softcontactdata' : (type === 'non_medical' ? 'accessorydata' : `${type}data`);
  const currentData = JSON.parse(localStorage.getItem(key) || '[]');
  const item = currentData.find(item => String(item.id) === String(productId));

  if (!item) {
    throw new Error('未找到对应的库存记录');
  }

  // 计算调整后的库存
  const beforeStock = item.currentStock;
  const afterStock = adjustType === 'in' 
    ? beforeStock + adjustAmount 
    : beforeStock - adjustAmount;

  // 检查库存是否足够
  if (adjustType === 'out' && afterStock < 0) {
    throw new Error('库存不足');
  }

  // 更新库存
  item.currentStock = afterStock;
  localStorage.setItem(key, JSON.stringify(currentData));

  // 获取产品信息
  const productData = JSON.parse(localStorage.getItem('ProductModaldata') || '[]');
  const product = productData.find(p => p.id === item.productid);

  // 生成detail字段
  let detail = '';
  if (type === 'lens') {
    // 镜片：品名/球镜/柱镜
    const sphere = item.sphere !== undefined ? item.sphere : '';
    const cylinder = item.cylinder !== undefined ? item.cylinder : '';
    detail = `${product ? product.name : '未知产品'}/${sphere}/${cylinder}`;
  } else if (type === 'frame') {
    // 镜框：品名/型号
    const model = item.model !== undefined ? item.model : '';
    detail = `${product ? product.name : '未知产品'}/${model}`;
  } else if (type === 'soft_contact') {
    // 软镜：品名/球镜度数/批号
    const sphere = item.sphere !== undefined ? item.sphere : '';
    const batchNumber = item.batchNumber !== undefined ? item.batchNumber : '';
    detail = `${product ? product.name : '未知产品'}/${sphere}/${batchNumber}`;
  } else if (type === 'solution') {
    // 护理液及药品：品名/批号
    const batchNumber = item.batchNumber !== undefined ? item.batchNumber : '';
    detail = `${product ? product.name : '未知产品'}/${batchNumber}`;
  } else if (type === 'non_medical' || type === 'accessory') {
    // 非医疗产品：品名+销售价格
    detail = product ? `${product.name}+${product.salePrice}` : '未知产品';
  } else {
    // 其他类型只用品名
    detail = product ? product.name : '未知产品';
  }

  // 创建库存记录
  const record = createStockRecord({
    productId: item.id,
    productName: product ? product.name : '未知产品',
    type,
    adjustType,
    adjustAmount,
    beforeStock,
    afterStock,
    remark,
    type_id: item.id, // 新增
    detail // 新增
  });

  // 保存库存记录
  saveStockHistory(type, record);

  return {
    success: true,
    data: {
      ...item,
      beforeStock,
      afterStock
    }
  };
};

export {
  adjustStock,
  getStockHistory,
  createStockRecord
}; 