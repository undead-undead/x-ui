# API 模块详细教学文档

> 本文档详细讲解 `/src/api` 目录下所有文件的代码实现和工作原理

---

## 📁 目录结构

```
api/
├── apiClient.ts        # 共享的 axios 实例和拦截器配置
├── system.ts           # 系统相关 API
├── inbound.ts          # Inbound 相关 API
├── client.ts           # 客户端相关 API
└── index.ts            # 统一导出入口
```

---

## 1️⃣ apiClient.ts - 核心配置文件

### 📝 文件作用

这是整个 API 模块的**核心配置文件**，负责：
1. 创建共享的 axios 实例
2. 配置请求拦截器（自动添加 token）
3. 配置响应拦截器（自动处理错误）
4. 定义 API 路径常量

### 📖 代码详解

#### 第一部分：导入依赖

```typescript
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/useAuthStore';
```

**说明：**
- `axios`: HTTP 请求库，用于发送网络请求
- `AxiosError`: axios 的错误类型，用于类型安全
- `useAuthStore`: 认证状态管理，用于获取用户 token

---

#### 第二部分：API 路径常量

```typescript
export const API_PATHS = {
    // 认证相关
    AUTH_LOGIN: '/auth/login',
    AUTH_UPDATE: '/auth/update',
    // 服务器相关
    SERVER_SYS_STATS: '/server/sysStats',
    SERVER_RESTART_XRAY: '/server/restartXray',
    SERVER_UPDATE_XRAY: '/server/updateXray',
    SERVER_GET_LOGS: '/server/getLogs',
    SERVER_EXPORT_DB: '/server/export-db',
    SERVER_IMPORT_DB: '/server/import-db',
    // Inbound 相关
    INBOUNDS: '/inbounds',
    // 客户端相关
    CLIENTS: '/clients',
} as const;
```

**说明：**
- **作用**: 集中管理所有 API 路径，避免硬编码
- **`as const`**: TypeScript 语法，将对象变为只读常量
- **好处**: 
  - 修改路径只需要改一个地方
  - 避免拼写错误
  - 提供智能提示

**使用示例：**
```typescript
// ❌ 不推荐：硬编码
await apiClient.post('/server/sysStats');

// ✅ 推荐：使用常量
await apiClient.post(API_PATHS.SERVER_SYS_STATS);
```

---

#### 第三部分：创建 axios 实例

```typescript
export const apiClient = axios.create({
    baseURL: '/api',
    timeout: 5000,
});
```

**说明：**
- **`axios.create()`**: 创建一个 axios 实例
- **`baseURL: '/api'`**: 所有请求的基础路径
  - 例如：请求 `/server/sysStats` 实际会请求 `/api/server/sysStats`
- **`timeout: 5000`**: 请求超时时间（5秒）
  - 如果 5 秒内没有响应，会抛出超时错误

**为什么要创建实例？**
- 可以配置统一的设置（baseURL、timeout 等）
- 可以添加拦截器
- 多个实例可以有不同的配置

---

#### 第四部分：请求拦截器

```typescript
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        console.error('[API Request Error]:', error.message);
        return Promise.reject(error);
    }
);
```

**说明：**

##### 成功回调函数
```typescript
(config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}
```

**执行时机**: 在发送请求之前自动执行

**工作流程**:
1. 从 `useAuthStore` 获取用户的 token
2. 如果 token 存在，添加到请求头
3. 返回修改后的配置

**实际效果**:
```typescript
// 你的代码
await apiClient.post('/server/sysStats');

// 实际发送的请求
POST /api/server/sysStats
Headers: {
    Authorization: 'Bearer abc123xyz...'
}
```

##### 错误回调函数
```typescript
(error: AxiosError) => {
    console.error('[API Request Error]:', error.message);
    return Promise.reject(error);
}
```

**执行时机**: 如果请求配置出错时执行

**作用**: 记录错误日志，然后继续抛出错误

---

#### 第五部分：响应拦截器

```typescript
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const url = error.config?.url || '';
        const status = error.response?.status;

        // 处理 401 未授权错误
        if (status === 401) {
            const isAuthEndpoint = 
                url.includes(API_PATHS.AUTH_LOGIN) || 
                url.includes(API_PATHS.AUTH_UPDATE);
            
            if (!isAuthEndpoint) {
                console.warn('[API] 401 Unauthorized - Logging out');
                useAuthStore.getState().logout();
            }
        }

        // 记录其他错误
        if (status && status >= 500) {
            console.error('[API Server Error]:', {
                url,
                status,
                message: error.message,
            });
        }

        return Promise.reject(error);
    }
);
```

**说明：**

##### 成功回调
```typescript
(response) => response
```
- **执行时机**: 请求成功（状态码 2xx）时执行
- **作用**: 直接返回响应，不做任何处理

##### 错误回调
```typescript
(error: AxiosError) => { ... }
```

**执行时机**: 请求失败（状态码 4xx、5xx）时执行

**工作流程**:

1. **获取错误信息**
```typescript
const url = error.config?.url || '';
const status = error.response?.status;
```

2. **处理 401 未授权错误**
```typescript
if (status === 401) {
    const isAuthEndpoint = 
        url.includes(API_PATHS.AUTH_LOGIN) || 
        url.includes(API_PATHS.AUTH_UPDATE);
    
    if (!isAuthEndpoint) {
        console.warn('[API] 401 Unauthorized - Logging out');
        useAuthStore.getState().logout();
    }
}
```

**逻辑说明**:
- 如果状态码是 401（未授权）
- 检查是否是登录或更新凭据接口
- 如果不是，自动登出用户
- **为什么要排除登录接口？** 避免循环登出

3. **记录服务器错误**
```typescript
if (status && status >= 500) {
    console.error('[API Server Error]:', {
        url,
        status,
        message: error.message,
    });
}
```

**作用**: 记录 5xx 服务器错误的详细信息

---

### 🎯 apiClient.ts 总结

| 功能 | 说明 |
|------|------|
| **API_PATHS** | 集中管理所有 API 路径常量 |
| **apiClient** | 共享的 axios 实例 |
| **请求拦截器** | 自动添加 token 到请求头 |
| **响应拦截器** | 自动处理 401 错误和记录日志 |

**核心优势**:
- ✅ 所有 API 模块共享同一个配置
- ✅ 拦截器只需要配置一次
- ✅ 统一的错误处理
- ✅ 易于维护和修改

---

## 2️⃣ system.ts - 系统 API 模块

### 📝 文件作用

提供所有**系统相关**的 API 方法，包括：
- 获取系统状态
- 重启 Xray 服务
- 切换 Xray 版本
- 更新用户凭据
- 获取日志
- 导出/导入数据库

### 📖 代码详解

#### 第一部分：导入依赖

```typescript
import { apiClient, API_PATHS } from './apiClient';
import type {
    ApiSysStatus,
    ApiLogsResponse,
    UpdateCredentialsRequest,
    UpdateXrayVersionRequest,
    ApiResponse,
} from '../types/api';
import { downloadFile, generateTimestampedFilename } from '../utils/fileUtils';
```

**说明：**
- **`apiClient`**: 共享的 axios 实例
- **`API_PATHS`**: API 路径常量
- **类型定义**: 从 `../types/api` 导入所有类型
- **工具函数**: 文件下载相关的工具函数

---

#### 第二部分：导出 sysApi 对象

```typescript
export const sysApi = {
    // ... 所有方法
};
```

**说明：**
- 导出一个对象，包含所有系统相关的 API 方法
- 每个方法都是异步函数（`async`）
- 每个方法都有明确的返回类型

---

#### 方法 1：获取系统状态

```typescript
/**
 * 获取系统实时状态
 */
getSystemStatus: async (): Promise<ApiSysStatus> => {
    const response = await apiClient.post<ApiSysStatus>(API_PATHS.SERVER_SYS_STATS);
    return response.data;
},
```

**详细说明：**

1. **JSDoc 注释**
```typescript
/**
 * 获取系统实时状态
 */
```
- 提供方法说明
- IDE 会显示智能提示

2. **方法签名**
```typescript
getSystemStatus: async (): Promise<ApiSysStatus> => { ... }
```
- `async`: 异步函数
- `(): Promise<ApiSysStatus>`: 返回类型是 `Promise<ApiSysStatus>`

3. **发送请求**
```typescript
const response = await apiClient.post<ApiSysStatus>(API_PATHS.SERVER_SYS_STATS);
```
- 使用 `apiClient.post()` 发送 POST 请求
- `<ApiSysStatus>`: 指定响应数据的类型
- `API_PATHS.SERVER_SYS_STATS`: 使用路径常量

4. **返回数据**
```typescript
return response.data;
```
- 只返回响应的 `data` 部分
- 不返回完整的 axios 响应对象

**使用示例：**
```typescript
import { sysApi } from '../api';

const data = await sysApi.getSystemStatus();
console.log(data.obj.cpu);  // 访问 CPU 使用率
```

---

#### 方法 2：重启 Xray 服务

```typescript
/**
 * 重启 Xray 服务
 */
restartXray: async (): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(API_PATHS.SERVER_RESTART_XRAY);
    return response.data;
},
```

**说明：**
- 与 `getSystemStatus` 类似
- 返回通用的 `ApiResponse` 类型
- 不需要传递参数

---

#### 方法 3：切换 Xray 版本

```typescript
/**
 * 切换 Xray 版本
 * @param version - 目标版本号
 */
switchXrayVersion: async (version: string): Promise<ApiResponse> => {
    const payload: UpdateXrayVersionRequest = { version };
    const response = await apiClient.post<ApiResponse>(API_PATHS.SERVER_UPDATE_XRAY, payload);
    return response.data;
},
```

**详细说明：**

1. **参数说明**
```typescript
@param version - 目标版本号
```
- JSDoc 参数说明
- IDE 会显示参数提示

2. **方法签名**
```typescript
switchXrayVersion: async (version: string): Promise<ApiResponse> => { ... }
```
- `version: string`: 接收一个字符串参数

3. **构造请求数据**
```typescript
const payload: UpdateXrayVersionRequest = { version };
```
- 创建请求数据对象
- 指定类型为 `UpdateXrayVersionRequest`

4. **发送请求**
```typescript
const response = await apiClient.post<ApiResponse>(
    API_PATHS.SERVER_UPDATE_XRAY, 
    payload  // 第二个参数是请求体
);
```

**使用示例：**
```typescript
await sysApi.switchXrayVersion('1.8.0');
```

---

#### 方法 4：更新用户凭据

```typescript
/**
 * 更新用户凭据（用户名和密码）
 * @param data - 包含旧凭据和新凭据的对象
 */
updateCredentials: async (data: UpdateCredentialsRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(API_PATHS.AUTH_UPDATE, data);
    return response.data;
},
```

**说明：**
- 接收一个对象参数 `data`
- 类型为 `UpdateCredentialsRequest`
- 包含旧用户名、旧密码、新用户名、新密码

**使用示例：**
```typescript
await sysApi.updateCredentials({
    oldUsername: 'admin',
    oldPassword: 'old123',
    newUsername: 'admin',
    newPassword: 'new456',
});
```

---

#### 方法 5：获取运行日志

```typescript
/**
 * 获取运行日志
 */
getLogs: async (): Promise<ApiLogsResponse> => {
    const response = await apiClient.post<ApiLogsResponse>(API_PATHS.SERVER_GET_LOGS);
    return response.data;
},
```

**说明：**
- 返回类型是 `ApiLogsResponse`
- 包含日志字符串数组

---

#### 方法 6：导出数据库

```typescript
/**
 * 导出数据库
 * 自动下载数据库备份文件
 */
exportDb: async (): Promise<void> => {
    try {
        const response = await apiClient.get(API_PATHS.SERVER_EXPORT_DB, {
            responseType: 'blob',
        });

        const blob = new Blob([response.data]);
        const filename = generateTimestampedFilename('x-ui_backup', 'db');
        downloadFile(blob, filename);
    } catch (error) {
        console.error('[Export DB Error]:', error);
        throw error;
    }
},
```

**详细说明：**

1. **返回类型**
```typescript
Promise<void>
```
- 不返回数据，只执行下载操作

2. **try-catch 错误处理**
```typescript
try {
    // ... 主要逻辑
} catch (error) {
    console.error('[Export DB Error]:', error);
    throw error;  // 重新抛出错误
}
```

3. **获取文件**
```typescript
const response = await apiClient.get(API_PATHS.SERVER_EXPORT_DB, {
    responseType: 'blob',  // 重要：指定响应类型为二进制数据
});
```

4. **创建 Blob 对象**
```typescript
const blob = new Blob([response.data]);
```
- `Blob`: 二进制大对象，用于处理文件数据

5. **生成文件名**
```typescript
const filename = generateTimestampedFilename('x-ui_backup', 'db');
```
- 调用工具函数生成带时间戳的文件名
- 例如：`x-ui_backup_2025-12-29T12-00-00.db`

6. **触发下载**
```typescript
downloadFile(blob, filename);
```
- 调用工具函数触发浏览器下载

**使用示例：**
```typescript
await sysApi.exportDb();  // 自动下载数据库文件
```

---

#### 方法 7：导入数据库

```typescript
/**
 * 导入数据库
 * @param file - 数据库文件
 */
importDb: async (file: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('db', file);

    const response = await apiClient.post<ApiResponse>(
        API_PATHS.SERVER_IMPORT_DB,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return response.data;
},
```

**详细说明：**

1. **参数类型**
```typescript
file: File
```
- 浏览器的 `File` 对象
- 通常来自 `<input type="file">`

2. **创建 FormData**
```typescript
const formData = new FormData();
formData.append('db', file);
```
- `FormData`: 用于发送文件的数据格式
- `append('db', file)`: 添加文件，字段名为 'db'

3. **发送请求**
```typescript
const response = await apiClient.post<ApiResponse>(
    API_PATHS.SERVER_IMPORT_DB,
    formData,  // 请求体是 FormData
    {
        headers: {
            'Content-Type': 'multipart/form-data',  // 重要：指定内容类型
        },
    }
);
```

**使用示例：**
```typescript
// 从文件输入获取文件
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

// 上传文件
const result = await sysApi.importDb(file);
console.log(result.msg);  // 显示结果消息
```

---

### 🎯 system.ts 总结

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `getSystemStatus` | 获取系统状态 | 无 | `ApiSysStatus` |
| `restartXray` | 重启 Xray | 无 | `ApiResponse` |
| `switchXrayVersion` | 切换版本 | `version: string` | `ApiResponse` |
| `updateCredentials` | 更新凭据 | `data: UpdateCredentialsRequest` | `ApiResponse` |
| `getLogs` | 获取日志 | 无 | `ApiLogsResponse` |
| `exportDb` | 导出数据库 | 无 | `void` |
| `importDb` | 导入数据库 | `file: File` | `ApiResponse` |

---

## 3️⃣ inbound.ts - Inbound API 模块

### 📝 文件作用

提供所有 **Inbound 相关**的 API 方法，包括完整的 CRUD 操作。

### 📖 代码详解

#### 第一部分：类型定义

```typescript
// Inbound 相关类型定义
export interface Inbound {
    id: string;
    port: number;
    protocol: string;
    remark: string;
    enable: boolean;
    settings: any;
}

export interface CreateInboundRequest {
    port: number;
    protocol: string;
    remark: string;
    settings?: any;
}

export interface UpdateInboundRequest {
    port?: number;
    protocol?: string;
    remark?: string;
    settings?: any;
}
```

**说明：**

##### Inbound 接口
```typescript
export interface Inbound {
    id: string;           // Inbound ID
    port: number;         // 端口号
    protocol: string;     // 协议类型
    remark: string;       // 备注
    enable: boolean;      // 是否启用
    settings: any;        // 设置（具体结构取决于协议）
}
```

##### CreateInboundRequest 接口
```typescript
export interface CreateInboundRequest {
    port: number;         // 必填
    protocol: string;     // 必填
    remark: string;       // 必填
    settings?: any;       // 可选（? 表示可选）
}
```

##### UpdateInboundRequest 接口
```typescript
export interface UpdateInboundRequest {
    port?: number;        // 可选
    protocol?: string;    // 可选
    remark?: string;      // 可选
    settings?: any;       // 可选
}
```
- 所有字段都是可选的
- 只需要传递要更新的字段

---

#### 第二部分：CRUD 操作

##### 1. 获取所有 Inbound

```typescript
/**
 * 获取所有 Inbound
 */
getInbounds: async (): Promise<ApiResponse<Inbound[]>> => {
    const response = await apiClient.get<ApiResponse<Inbound[]>>('/inbounds');
    return response.data;
},
```

**说明：**
- 使用 `GET` 方法
- 返回 `Inbound` 数组
- `ApiResponse<Inbound[]>`: 泛型类型，表示响应数据是 Inbound 数组

---

##### 2. 获取单个 Inbound

```typescript
/**
 * 获取单个 Inbound
 * @param id - Inbound ID
 */
getInbound: async (id: string): Promise<ApiResponse<Inbound>> => {
    const response = await apiClient.get<ApiResponse<Inbound>>(`/inbounds/${id}`);
    return response.data;
},
```

**说明：**
- 使用模板字符串构造 URL
- `/inbounds/${id}` 例如：`/inbounds/123`
- 返回单个 `Inbound` 对象

---

##### 3. 创建 Inbound

```typescript
/**
 * 创建 Inbound
 * @param data - Inbound 数据
 */
createInbound: async (data: CreateInboundRequest): Promise<ApiResponse<Inbound>> => {
    const response = await apiClient.post<ApiResponse<Inbound>>('/inbounds', data);
    return response.data;
},
```

**说明：**
- 使用 `POST` 方法
- 传递 `CreateInboundRequest` 对象
- 返回创建的 `Inbound` 对象

**使用示例：**
```typescript
const newInbound = await inboundApi.createInbound({
    port: 8080,
    protocol: 'vmess',
    remark: '测试节点',
    settings: { /* ... */ }
});
```

---

##### 4. 更新 Inbound

```typescript
/**
 * 更新 Inbound
 * @param id - Inbound ID
 * @param data - 更新的数据
 */
updateInbound: async (id: string, data: UpdateInboundRequest): Promise<ApiResponse<Inbound>> => {
    const response = await apiClient.put<ApiResponse<Inbound>>(`/inbounds/${id}`, data);
    return response.data;
},
```

**说明：**
- 使用 `PUT` 方法
- 需要传递 ID 和更新数据
- 返回更新后的 `Inbound` 对象

**使用示例：**
```typescript
await inboundApi.updateInbound('123', {
    port: 9090,  // 只更新端口
});
```

---

##### 5. 删除 Inbound

```typescript
/**
 * 删除 Inbound
 * @param id - Inbound ID
 */
deleteInbound: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/inbounds/${id}`);
    return response.data;
},
```

**说明：**
- 使用 `DELETE` 方法
- 返回 `ApiResponse<void>`（不返回数据）

---

##### 6. 切换 Inbound 状态

```typescript
/**
 * 切换 Inbound 启用状态
 * @param id - Inbound ID
 */
toggleInbound: async (id: string): Promise<ApiResponse<Inbound>> => {
    const response = await apiClient.patch<ApiResponse<Inbound>>(`/inbounds/${id}/toggle`);
    return response.data;
},
```

**说明：**
- 使用 `PATCH` 方法
- 切换启用/禁用状态
- 返回更新后的 `Inbound` 对象

---

##### 7. 重启 Inbound

```typescript
/**
 * 重启 Inbound
 * @param id - Inbound ID
 */
restartInbound: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>(`/inbounds/${id}/restart`);
    return response.data;
},
```

**说明：**
- 使用 `POST` 方法
- 重启指定的 Inbound
- 不返回数据

---

### 🎯 inbound.ts 总结

| 方法 | HTTP 方法 | 路径 | 说明 |
|------|-----------|------|------|
| `getInbounds` | GET | `/inbounds` | 获取所有 |
| `getInbound` | GET | `/inbounds/:id` | 获取单个 |
| `createInbound` | POST | `/inbounds` | 创建 |
| `updateInbound` | PUT | `/inbounds/:id` | 更新 |
| `deleteInbound` | DELETE | `/inbounds/:id` | 删除 |
| `toggleInbound` | PATCH | `/inbounds/:id/toggle` | 切换状态 |
| `restartInbound` | POST | `/inbounds/:id/restart` | 重启 |

**HTTP 方法说明：**
- **GET**: 获取数据
- **POST**: 创建数据或执行操作
- **PUT**: 更新数据（完整更新）
- **PATCH**: 部分更新
- **DELETE**: 删除数据

---

## 4️⃣ client.ts - 客户端 API 模块

### 📝 文件作用

提供所有**客户端相关**的 API 方法。

### 📖 代码详解

```typescript
import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/api';

/**
 * 客户端（Client）相关 API
 */
export const clientApi = {
    /**
     * 获取所有客户端
     */
    getClients: async (): Promise<ApiResponse> => {
        const response = await apiClient.get('/clients');
        return response.data;
    },

    /**
     * 获取单个客户端
     * @param id - 客户端 ID
     */
    getClient: async (id: string): Promise<ApiResponse> => {
        const response = await apiClient.get(`/clients/${id}`);
        return response.data;
    },

    /**
     * 创建客户端
     * @param data - 客户端数据
     */
    createClient: async (data: any): Promise<ApiResponse> => {
        const response = await apiClient.post('/clients', data);
        return response.data;
    },

    /**
     * 更新客户端
     * @param id - 客户端 ID
     * @param data - 更新的数据
     */
    updateClient: async (id: string, data: any): Promise<ApiResponse> => {
        const response = await apiClient.put(`/clients/${id}`, data);
        return response.data;
    },

    /**
     * 删除客户端
     * @param id - 客户端 ID
     */
    deleteClient: async (id: string): Promise<ApiResponse> => {
        const response = await apiClient.delete(`/clients/${id}`);
        return response.data;
    },
};
```

**说明：**
- 与 `inbound.ts` 结构类似
- 提供基本的 CRUD 操作
- 使用 `any` 类型（可以改进为具体的类型定义）

---

## 5️⃣ index.ts - 统一导出入口

### 📝 文件作用

作为"桶文件"（Barrel File），统一导出所有 API 模块。

### 📖 代码详解

```typescript
/**
 * API 统一入口
 * 导出所有 API 模块
 */

// 方式 1：分别导出（推荐）
export { sysApi } from './system';
export { inboundApi } from './inbound';
export { clientApi } from './client';

// 导出类型
export type * from './system';
export type * from './inbound';
export type * from './client';
```

**说明：**

#### 重新导出 API
```typescript
export { sysApi } from './system';
```
- 从 `./system` 导入 `sysApi`
- 立即重新导出
- 等同于：
  ```typescript
  import { sysApi } from './system';
  export { sysApi };
  ```

#### 导出类型
```typescript
export type * from './inbound';
```
- 导出 `inbound.ts` 中的所有类型
- 包括 `Inbound`、`CreateInboundRequest`、`UpdateInboundRequest`

---

### 🎯 index.ts 的优势

#### 使用前（没有 index.ts）

```typescript
// 需要从不同文件导入
import { sysApi } from '../api/system';
import { inboundApi } from '../api/inbound';
import { clientApi } from '../api/client';
import type { Inbound } from '../api/inbound';
```

#### 使用后（有 index.ts）

```typescript
// 从一个地方导入所有
import { sysApi, inboundApi, clientApi } from '../api';
import type { Inbound } from '../api';
```

**优势：**
- ✅ 导入路径更简洁
- ✅ 不需要记住每个 API 在哪个文件
- ✅ 易于重构（修改文件结构只需要改 index.ts）

---

## 📊 整体架构图

```
┌─────────────────────────────────────────────────┐
│                  组件/Store                      │
│  import { sysApi, inboundApi } from '../api'    │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│              index.ts（统一入口）                │
│  export { sysApi } from './system'              │
│  export { inboundApi } from './inbound'         │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
    ┌────────┬────────┬────────┐
    │system  │inbound │client  │
    │.ts     │.ts     │.ts     │
    └───┬────┴────┬───┴────┬───┘
        │         │        │
        └─────────┼────────┘
                  │
                  ▼
        ┌──────────────────┐
        │  apiClient.ts    │
        │  - axios 实例    │
        │  - 拦截器配置    │
        │  - API 路径常量  │
        └──────────────────┘
                  │
                  ▼
        ┌──────────────────┐
        │   后端 API       │
        └──────────────────┘
```

---

## 🔄 完整的请求流程

### 示例：获取系统状态

```typescript
// 1. 组件调用
const data = await sysApi.getSystemStatus();

// 2. 进入 system.ts
getSystemStatus: async () => {
    const response = await apiClient.post(API_PATHS.SERVER_SYS_STATS);
    return response.data;
}

// 3. 请求拦截器（apiClient.ts）
apiClient.interceptors.request.use((config) => {
    // 自动添加 token
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// 4. 发送 HTTP 请求
POST /api/server/sysStats
Headers: { Authorization: 'Bearer xxx' }

// 5. 服务器处理并返回

// 6. 响应拦截器（apiClient.ts）
apiClient.interceptors.response.use(
    (response) => response,  // 成功：直接返回
    (error) => {
        // 失败：处理 401 等错误
        if (error.response?.status === 401) {
            logout();
        }
    }
);

// 7. 返回数据给组件
return response.data;
```

---

## 🎯 最佳实践总结

### 1. 代码组织

✅ **推荐：**
- 按功能模块分离（system、inbound、client）
- 使用共享的 axios 实例
- 统一的类型定义

❌ **不推荐：**
- 所有 API 写在一个文件
- 每个文件创建自己的 axios 实例
- 硬编码 API 路径

---

### 2. 类型安全

✅ **推荐：**
```typescript
// 明确的类型定义
getSystemStatus: async (): Promise<ApiSysStatus> => { ... }

// 使用接口定义请求数据
createInbound: async (data: CreateInboundRequest) => { ... }
```

❌ **不推荐：**
```typescript
// 使用 any 类型
getSystemStatus: async (): Promise<any> => { ... }
```

---

### 3. 错误处理

✅ **推荐：**
```typescript
// 在拦截器中统一处理
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // 统一的错误处理逻辑
    }
);

// 特殊情况单独处理
exportDb: async () => {
    try {
        // ...
    } catch (error) {
        console.error('[Export DB Error]:', error);
        throw error;
    }
}
```

---

### 4. 常量管理

✅ **推荐：**
```typescript
// 使用常量
await apiClient.post(API_PATHS.SERVER_SYS_STATS);
```

❌ **不推荐：**
```typescript
// 硬编码
await apiClient.post('/server/sysStats');
```

---

## 📚 学习要点

### 初学者需要掌握

1. **axios 基础**
   - 如何创建实例
   - 如何发送请求（GET、POST、PUT、DELETE）
   - 如何处理响应

2. **拦截器概念**
   - 什么是拦截器
   - 请求拦截器的作用
   - 响应拦截器的作用

3. **TypeScript 类型**
   - 接口（interface）的使用
   - 泛型（`<T>`）的基本概念
   - 可选属性（`?`）

### 进阶开发者需要理解

1. **架构设计**
   - 为什么要分离 API 模块
   - 为什么要使用共享实例
   - 如何设计可扩展的 API 结构

2. **错误处理策略**
   - 如何统一处理错误
   - 如何处理特殊情况
   - 如何避免循环登出

3. **代码复用**
   - 如何提取公共逻辑
   - 如何使用工具函数
   - 如何避免代码重复

---

## 🎓 练习建议

### 练习 1：添加新的 API 方法

在 `system.ts` 中添加一个新方法：

```typescript
/**
 * 获取系统版本
 */
getSystemVersion: async (): Promise<ApiResponse<string>> => {
    const response = await apiClient.get<ApiResponse<string>>(API_PATHS.SERVER_VERSION);
    return response.data;
},
```

记得在 `apiClient.ts` 中添加路径常量：
```typescript
export const API_PATHS = {
    // ...
    SERVER_VERSION: '/server/version',
};
```

---

### 练习 2：创建新的 API 模块

创建 `user.ts`，提供用户管理相关的 API：

```typescript
import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/api';

export interface User {
    id: string;
    username: string;
    email: string;
}

export const userApi = {
    getUsers: async (): Promise<ApiResponse<User[]>> => {
        const response = await apiClient.get('/users');
        return response.data;
    },
    
    // ... 其他方法
};
```

然后在 `index.ts` 中导出：
```typescript
export { userApi } from './user';
```

---

### 练习 3：优化类型定义

将 `client.ts` 中的 `any` 类型替换为具体的接口：

```typescript
export interface Client {
    id: string;
    name: string;
    // ... 其他字段
}

export const clientApi = {
    getClients: async (): Promise<ApiResponse<Client[]>> => {
        // ...
    },
    
    createClient: async (data: Omit<Client, 'id'>): Promise<ApiResponse<Client>> => {
        // ...
    },
};
```

---

## 🎉 总结

这个 API 模块的设计遵循了以下原则：

1. **单一职责**: 每个文件负责一个功能模块
2. **DRY (Don't Repeat Yourself)**: 拦截器只配置一次
3. **类型安全**: 使用 TypeScript 提供完整的类型定义
4. **易于维护**: 清晰的代码结构和注释
5. **可扩展**: 容易添加新的 API 模块

通过学习这个 API 模块，您应该能够：
- ✅ 理解 axios 拦截器的工作原理
- ✅ 掌握如何组织 API 代码
- ✅ 学会使用 TypeScript 提高代码质量
- ✅ 能够独立添加新的 API 方法和模块

**继续加油！** 🚀
