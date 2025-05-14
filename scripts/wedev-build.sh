#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 输出带颜色的进度信息
print_progress() {
    echo -e "${BLUE}[Build Progress]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[Success]${NC} $1"
}


print_progress "开始构建 @we-dev-client..."

# 执行构建命令
pnpm build:client

# 检查构建是否成功
if [ $? -ne 0 ]; then
    echo "Error: Build failed"
    exit 1
fi

print_success "构建完成"
print_progress "准备移动文件..."


print_progress "正在清理旧文件..."

# 清理目标目录
rm -rf apps/we-dev-next/public/wedev_public/*

print_progress "正在移动文件..."

# 移动 dist 目录下的所有文件到 public/wedev_public
mkdir -p apps/we-dev-next/public/wedev_public
mv apps/we-dev-client/dist/* apps/we-dev-next/public/wedev_public/

# 检查移动是否成功
if [ $? -ne 0 ]; then
    echo "Error: Failed to move files"
    exit 1
fi

print_success "文件移动完成"
print_success "所有操作已完成！"

# 显示结果
echo -e "\n${GREEN}构建结果：${NC}"
echo "文件已被移动到: apps/we-dev-next/public/wedev_public/"

print_progress "正在检查 index.html 中的资源引用..."

# 读取 index.html 文件
INDEX_FILE="apps/we-dev-next/public/wedev_public/index.html"
if [ -f "$INDEX_FILE" ]; then
    print_progress "正在替换资源路径..."

    # 创建临时文件
    TEMP_FILE="${INDEX_FILE}.tmp"

    # 使用 sed 替换 ./assets 为 wedev_public/assets
    sed 's|"./assets|"wedev_public/assets|g' "$INDEX_FILE" > "$TEMP_FILE"

    # 将临时文件移动回原文件
    mv "$TEMP_FILE" "$INDEX_FILE"

    # 显示替换后的结果
    FOUND_ASSETS=$(grep -o 'wedev_public/assets[^"]*' "$INDEX_FILE" || true)

    if [ ! -z "$FOUND_ASSETS" ]; then
        print_success "资源路径已更新，当前引用如下："
        echo "$FOUND_ASSETS"
    else
        echo -e "${BLUE}未找到资源引用${NC}"
    fi
else
    echo "Error: index.html 文件不存在"
fi
