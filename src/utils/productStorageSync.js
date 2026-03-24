/** 商品模块共用 localStorage 变更后广播，便于多页面/多子组件无需整页刷新即可重载数据 */
export const PRODUCT_AUX_STORAGE_EVENT = 'product-aux-storage-changed';

/**
 * @param {'brand' | 'supplier' | 'manufacturer' | 'attr' | 'powerTemplate'} type
 */
export function broadcastProductAuxStorage(type) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PRODUCT_AUX_STORAGE_EVENT, { detail: { type } }));
}
