/**
 * API 统一入口
 * 导出所有 API 模块
 */


// 方式 1：分别导出（推荐）
export { sysApi } from './system';
export { inboundApi } from './inbound';
export { clientApi } from './client';

// 方式 2：统一导出为一个对象（可选）


// 导出类型
export type * from './system';
export type * from './inbound';
export type * from './client';

/**
 * 使用示例：
 * 
 * // 方式 1：分别导入
 * import { sysApi, inboundApi } from './api';
 * await sysApi.getSystemStatus();
 * await inboundApi.getInbounds();
 * 
 * // 方式 2：统一导入
 * import { api } from './api';
 * await api.system.getSystemStatus();
 * await api.inbound.getInbounds();
 */
