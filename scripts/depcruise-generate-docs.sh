#!/bin/bash

# Bật tính năng pipefail: Nếu bất kỳ lệnh nào trong chuỗi pipe (|) lỗi, cả chuỗi sẽ tính là lỗi
set -o pipefail

# Lấy tên module từ tham số truyền vào, nếu không truyền mặc định là "payment"
MODULE_NAME=${1:-"payment"}

# Tạo thư mục chứa ảnh và cấu trúc nếu chưa tồn tại
mkdir -p docs/pictures

echo "📊 Đang khởi chạy tiến trình phân tích kiến trúc cho module: [${MODULE_NAME}]..."

# Biến cờ dùng để theo dõi trạng thái lỗi tổng thể
ANY_ERROR=0

# Định nghĩa một hàm helper để chạy lệnh và gom vết lỗi độc lập
run_depcruise() {
  local label=$1
  local suffix=$2
  shift 2 # Bỏ 2 tham số đầu, còn lại là các tùy chọn của depcruise
  
  echo "-> Đang xuất sơ đồ: ${label}..."
  
  # Thực thi lệnh depcruise với các tham số động
  depcruise src "$@" --exclude "\.spec\.ts$" --output-type dot \
    | tee "docs/pictures/${suffix}.dot" \
    | dot -T png > "docs/pictures/${suffix}.png"
  
  # Nhờ set -o pipefail, $? ở đây phản ánh chính xác nếu depcruise hoặc dot bị lỗi
  if [ $? -ne 0 ]; then
    echo "❌ Lỗi tại bước: ${label}"
    ANY_ERROR=1
  fi
}

# -----------------------------------------------------------------------------
# 1. Tổng quan Kiến trúc (Collapse sub-modules)
# -----------------------------------------------------------------------------
echo "-> Đang xuất sơ đồ: Tổng quan (Architecture Summary)..."
depcruise src --include-only "src/modules/${MODULE_NAME}" --exclude "\.spec\.ts$" --collapse "src/modules/[^/]+/[^/]+" --output-type dot \
  | tee "docs/pictures/architecture-summary.dot" \
  | dot -T png > "docs/pictures/architecture-summary.png"

if [ $? -ne 0 ]; then
  echo "❌ Lỗi tại bước: Tổng quan Kiến trúc"
  ANY_ERROR=1
fi

# -----------------------------------------------------------------------------
# 2. Chi tiết toàn bộ module và các tầng con (Sử dụng hàm helper)
# -----------------------------------------------------------------------------
run_depcruise "Chi tiết toàn bộ module" "architecture" --include-only "src/modules/${MODULE_NAME}"
run_depcruise "Chi tiết tầng Domain" "architecture-domain" --include-only "src/modules/${MODULE_NAME}/domain"
run_depcruise "Chi tiết tầng Application" "architecture-application" --include-only "src/modules/${MODULE_NAME}/application"
run_depcruise "Chi tiết tầng Infrastructure" "architecture-infrastructure" --include-only "src/modules/${MODULE_NAME}/infrastructure"
run_depcruise "Chi tiết tầng API" "architecture-api" --include-only "src/modules/${MODULE_NAME}/api"

# -----------------------------------------------------------------------------
# Kiểm tra tổng kết trạng thái toàn bộ tiến trình
# -----------------------------------------------------------------------------
echo "================================================================="
if [ $ANY_ERROR -eq 0 ]; then
    echo "✅ [SUCCESS] Tất cả sơ đồ kiến trúc module [${MODULE_NAME}] đã được cập nhật!"
    echo "📂 Thư mục đầu ra: docs/pictures/"
    echo "📝 Định dạng đã xuất: Gồm cả file cấu trúc (.dot) và file hình ảnh (.png)"
    echo "================================================================="
    exit 0
else
    echo "❌ [ERROR] Đã xảy ra lỗi trong quá trình phân tích hoặc biên dịch đồ thị."
    echo "================================================================="
    exit 1
fi