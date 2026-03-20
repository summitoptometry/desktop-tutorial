/**
 * 用于 min >= 0 的 a-input-number：禁止通过键盘输入负号，并解析时去掉负号（含粘贴）。
 * 与 ant-design-vue InputNumber 默认 parser 一致地先去掉杂字符，再移除减号类字符。
 */
export function preventMinusKey(e) {
  const k = e.key;
  if (k === '-' || k === '−' || k === '－') {
    e.preventDefault();
    return;
  }
  if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
    e.preventDefault();
  }
}

export function parserStripMinus(displayValue) {
  let s = String(displayValue ?? '');
  s = s.replace(/[^\w.-]+/g, '');
  return s.replace(/[-−－﹣]/g, '');
}

/** 模板中 v-bind="nonNegativeInputNumberBind" 与 v-model / :value 等同时使用 */
export const nonNegativeInputNumberBind = {
  onKeydown: preventMinusKey,
  parser: parserStripMinus,
};
