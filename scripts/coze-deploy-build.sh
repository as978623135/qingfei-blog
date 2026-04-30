#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# 安装前端依赖并构建
echo "Installing frontend dependencies..."
pnpm install

echo "Building frontend..."
pnpm run build

# 安装后端依赖并构建
echo "Installing backend dependencies..."
cd "$PROJECT_DIR/server"
pnpm install

echo "Building backend..."
pnpm run build
