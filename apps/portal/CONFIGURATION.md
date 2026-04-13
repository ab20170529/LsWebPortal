# 后端接口配置指南

## 概述

本项目使用环境变量来配置后端接口地址，支持不同环境（开发、测试、生产）的配置。

## 配置文件

### 1. 环境变量文件

项目支持以下环境变量文件：

- `.env` - 默认配置（会被其他环境文件覆盖）
- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置
- `.env.staging` - 测试环境配置

### 2. 配置变量

| 变量名 | 描述 | 默认值 | 示例 |
|--------|------|--------|------|
| `VITE_API_BASE_URL` | 后端API基础URL | `http://localhost:8080` | `https://api.example.com` |
| `VITE_AUTH_ENDPOINT` | 认证相关API端点前缀 | `/api/auth` | `/api/v1/auth` |
| `VITE_SYSTEM_ENDPOINT` | 系统相关API端点前缀 | `/api/system` | `/api/v1/system` |
| `VITE_APP_ENV` | 应用环境 | `development` | `production` |
| `VITE_APP_NAME` | 应用名称 | `LsERPPortal` | `LsERPPortal (生产)` |

### 3. 环境配置示例

#### 开发环境 (`.env.development`)
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_AUTH_ENDPOINT=/api/auth
VITE_SYSTEM_ENDPOINT=/api/system
VITE_APP_ENV=development
VITE_APP_NAME=LsERPPortal (开发环境)
```

#### 生产环境 (`.env.production`)
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_AUTH_ENDPOINT=/api/auth
VITE_SYSTEM_ENDPOINT=/api/system
VITE_APP_ENV=production
VITE_APP_NAME=LsERPPortal
```

## 使用方法

### 1. 在代码中使用配置

```typescript
import { apiConfig, appConfig } from '../config';

// 使用API配置
const loginUrl = apiConfig.auth.login; // 返回完整URL: http://localhost:8080/api/auth/login
const employeesUrl = apiConfig.auth.employees; // 返回完整URL: http://localhost:8080/api/auth/employees

// 使用应用配置
console.log(appConfig.name); // 应用名称
console.log(appConfig.env); // 环境
console.log(appConfig.isDevelopment); // 是否为开发环境

// 使用URL构建器
const customUrl = apiConfig.buildUrl('/api/custom/endpoint');
const relativeUrl = apiConfig.buildUrl('api/custom/endpoint');
const fullUrl = apiConfig.buildUrl('https://other-api.com/endpoint');
```

### 2. 在HTTP客户端中使用

HTTP客户端已自动使用配置的API基础URL。所有API请求都会自动使用配置的URL。

### 3. 在认证服务中使用

认证服务已更新为使用配置的端点：

```typescript
// 获取员工列表
const employees = await fetchEmployeeOptions(); // 使用配置的端点

// 获取服务器列表
const servers = await fetchServerOptions(123); // 使用配置的端点

// 登录
const session = await loginWithPassword(payload); // 使用配置的端点
```

## 环境切换

### 1. 开发环境
```bash
# 默认使用 .env.development
pnpm dev
```

### 2. 生产环境构建
```bash
# 使用 .env.production
pnpm build
```

### 3. 指定环境
```bash
# 使用特定环境文件
VITE_APP_ENV=staging pnpm dev
```

## 配置验证

项目包含一个配置测试文件，可用于验证配置是否正确加载：

```typescript
import config from './config';

console.log('API基础URL:', config.api.baseUrl);
console.log('认证端点:', config.api.auth.login);
console.log('环境:', config.app.env);
```

## 注意事项

1. **环境变量前缀**：所有Vite环境变量必须以`VITE_`开头才能在客户端代码中访问
2. **类型安全**：环境变量类型在`src/config/env.d.ts`中定义
3. **热重载**：修改环境变量后需要重启开发服务器
4. **安全性**：不要将敏感信息（如API密钥）直接放在环境变量文件中，应使用服务器端环境变量

## 故障排除

### 1. 配置未生效
- 检查环境变量文件名是否正确
- 确保环境变量以`VITE_`开头
- 重启开发服务器

### 2. TypeScript错误
- 检查`src/config/env.d.ts`中的类型定义
- 确保导入路径正确

### 3. API请求失败
- 检查`VITE_API_BASE_URL`是否正确
- 验证后端服务是否运行
- 检查网络连接和CORS配置