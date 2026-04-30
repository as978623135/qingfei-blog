#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 显式声明关键环境变量
export PORT=5000
export NODE_ENV=production

# 清理 5000 端口残留进程（绝不碰 9000）
fuser -k 5000/tcp 2>/dev/null || true
sleep 1

# 启动后端服务（同时提供 API 和前端静态文件）
cd "$PROJECT_DIR/server"
exec pnpm exec ts-node src/server.ts
