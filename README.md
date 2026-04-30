# 青飞的小站（qingfei-blog-fullstack）

> 一个基于 React + Express + SQLite 的个人全栈博客系统

线上地址：https://qingfei.online

---

## 项目简介

青飞的小站是一个轻量级个人博客系统，采用前后端分离架构。前端使用 React 构建交互式界面，后端使用 Express 提供 RESTful API，数据持久化存储在 SQLite 中。支持文章发布、分类管理、标签归档、后台管理等功能。

---

## 技术栈

### 前端

| 技术 | 说明 |
|------|------|
| **React 18** | UI 框架，组件化开发 |
| **TypeScript** | 静态类型，提升代码健壮性 |
| **Webpack 5** | 模块打包与构建 |
| **Tailwind CSS** | 原子化 CSS 框架，快速构建响应式界面 |
| **react-router-dom** | 前端路由管理（Hash 模式） |
| **Framer Motion** | 动画效果库 |

### 后端

| 技术 | 说明 |
|------|------|
| **Express 4** | Node.js Web 框架 |
| **TypeScript** | 后端同构类型安全 |
| **better-sqlite3** | 高性能 SQLite 数据库驱动 |
| **JWT** | JSON Web Token 认证 |
| **bcryptjs** | 密码哈希加密 |
| **CORS** | 跨域资源共享 |

### 部署与运维

| 技术 | 说明 |
|------|------|
| **Nginx** | 反向代理与静态文件服务 |
| **PM2** | Node.js 进程管理，守护后端服务 |
| **Let's Encrypt** | 免费 SSL/TLS 证书 |
| **腾讯云轻量应用服务器** | 云主机部署 |

---

## 功能特性

- **文章管理**：支持文章的创建、编辑、删除，富文本编辑器支持 Markdown/HTML
- **分类与标签**：文章可按分类归档，支持多标签关联
- **时间归档**：按年月自动归档文章
- **全文搜索**：支持按标题搜索文章
- **后台管理**：独立的登录认证后台，JWT Token 鉴权
- **响应式布局**：适配桌面端与移动端
- **HTTPS 支持**：全站 SSL 加密访问

---

## 项目结构

```
qingfei-blog-fullstack/
├── src/                          # 前端源码
│   ├── components/               # UI 组件
│   ├── pages/                    # 页面组件（首页、文章详情、后台等）
│   ├── hooks/                    # 自定义 React Hooks
│   ├── services/                 # API 请求封装
│   ├── styles/                   # 全局样式
│   ├── App.tsx                   # 应用根组件
│   └── index.tsx                 # 入口文件
├── server/                       # 后端服务
│   ├── src/
│   │   ├── server.ts             # Express 服务入口
│   │   ├── db/
│   │   │   └── index.ts          # SQLite 数据库操作
│   │   ├── routes/
│   │   │   ├── posts.ts          # 文章 API
│   │   │   └── auth.ts           # 认证 API
│   │   └── middleware/
│   │       └── auth.ts           # JWT 鉴权中间件
│   ├── data/
│   │   └── blog.db               # SQLite 数据库文件
│   ├── package.json
│   └── tsconfig.json
├── dist/                         # 前端生产构建产物
├── scripts/                      # 部署脚本
├── webpack.config.js             # Webpack 配置
├── package.json
└── .coze                         # Coze 平台配置
```

---

## API 接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/health` | 健康检查 | 否 |
| POST | `/api/auth/login` | 管理员登录 | 否 |
| GET | `/api/posts` | 获取所有文章 | 否 |
| GET | `/api/posts/:id` | 获取单篇文章 | 否 |
| POST | `/api/posts` | 创建文章 | Bearer Token |
| PUT | `/api/posts/:id` | 更新文章 | Bearer Token |
| DELETE | `/api/posts/:id` | 删除文章 | Bearer Token |
| GET | `/api/posts/category/:category` | 按分类获取 | 否 |
| GET | `/api/posts/search/:keyword` | 搜索文章 | 否 |
| GET | `/api/posts/meta/categories` | 获取分类列表 | 否 |
| GET | `/api/posts/meta/tags` | 获取标签列表 | 否 |
| GET | `/api/posts/meta/archives` | 获取归档 | 否 |

---

## 部署架构

```
用户浏览器
    |
    | HTTPS (443)
    v
Nginx (腾讯云)
    |
    | 反向代理
    v
Express (localhost:5000)
    |-- 提供 /api/* RESTful 接口
    |-- 托管前端 dist/ 静态文件
    |
    v
SQLite (blog.db)
```

---

## 本地开发

### 环境要求

- Node.js >= 24
- pnpm

### 启动方式

```bash
# 安装前端依赖
cd qingfei-blog-fullstack
pnpm install

# 终端 1：启动前端开发服务器
pnpm run dev

# 终端 2：启动后端服务
cd server
pnpm install
pnpm run dev
```

前端开发服务器运行于 `http://localhost:3266`，后端 API 运行于 `http://localhost:3015`。开发模式下 Webpack DevServer 会自动将 `/api` 请求代理到后端。

---

## 生产部署

```bash
# 构建前端
pnpm run build

# 构建后端
cd server
pnpm run build

# 启动生产服务
NODE_ENV=production PORT=5000 node dist/server.js
```

生产环境下，Express 同时提供 API 接口和前端静态文件服务，由 Nginx 做反向代理并处理 HTTPS。

---

## 安全建议

- 首次部署后立即修改管理员默认密码
- 设置强随机字符串作为 `JWT_SECRET`
- 定期备份 `server/data/blog.db` 数据库文件
- 使用 PM2 管理进程，配置开机自启

---

## 许可证

MIT
