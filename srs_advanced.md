# SBRB Analytical Dashboard: System Requirements Specification (SRS)

**Version:** 2.0 (Pivot & Component Architecture)
**Date:** 2026-04-11
**Project:** SBRB (Small Business Report Board) - Advanced Business Features

---

## 1. Overview & Vision

Mục tiêu của chặng phát triển này là chuyển đổi SBRB từ một trình xem biểu đồ đơn giản thành một nền tảng **Phân Tích Đa Chiều (Multi-dimensional Analysis Platform)**. Hệ thống cho phép doanh nghiệp map dữ liệu tài chính phức tạp theo từng phòng ban, trích xuất cấu trúc báo cáo P&L đa lớp và trực quan hóa độc lập trên từng trục toạ độ. 

Hệ thống được cấu thành từ 3 trụ cột tính năng chính:

| Feature | Scope | Status | 
|---------|-------|--------|
| **A. Business Hierarchy** | Quản lý cấu trúc Phòng ban / Chi nhánh tự động phân rã. | **Completed** | 
| **B. Excel Import Templates** | Nhập liệu bằng 3 Mẫu Excel Cố định (Simple, Departmental, P&L). | **Completed** | 
| **C. Pivot Combo Charts** | Cấu hình UI cho phép gán Loại biểu đồ (Bar/Line) và Trục Tung (Left/Right) riêng rẽ trên từng Chuỗi Dữ Liệu (DataSeries). | **Completed** | 

---

## 2. Trụ cột Kiến trúc (Data Models & Hierarchy)

### 2.1 Cấu trúc Phòng ban (Business Hierarchy)
Giải quyết bài toán bóc tách dữ liệu doanh nghiệp từ dạng phẳng sang phân cấp đa tầng (Chi nhánh -> Phòng Ban -> Nhóm).

**Mô hình cấp bậc:**
`Business (1) ──< Department (N, self-referencing parentId)`
`Department (1) ──< DataSeries (N, department_id)`

**Quy tắc:**
- Không gán DepartmentID trực tiếp vào DataSheet (File Excel). Thay vào đó, gán DepartmentID trực tiếp vào **DataSeries** (Mỗi dòng trong biểu đồ). Điều này giúp 1 File Excel (DataSheet) có thể chứa dữ liệu của nhiều Phòng ban độc lập.

### 2.2 Đa hình Biểu đồ (Combo Chart pivot)
Giải quyết vấn đề trước đây khi một Widget chỉ biểu diễn được 1 loại biểu đồ duy nhất (Chỉ toàn Line hoặc chỉ toàn Bar).

**Cấu trúc Lập trình (JSONB `chartConfig`):**
```typescript
interface ISeriesConfig {
  type: 'bar' | 'line';
  yAxis: 'left' | 'right';
}

interface IChartConfig {
  type: ChartType; // Default type
  seriesConfig?: Record<string, ISeriesConfig>; // Ví dụ: { "Doanh thu": { type: "bar", yAxis: "left" } }
}
```

---

## 3. Hệ thống Template & Logic Nhập liệu (Excel Parser)

SBRB cung cấp sẵn 3 tệp mẫu Excel có định dạng tiêu chuẩn (Templates). 

### 3.1 Quy định Hardcode Mẫu Báo Cáo
- **Chính sách Hardcode:** Nhằm đảm bảo dữ liệu chạy đúng luồng Parser, 3 mẫu này được **hardcode tĩnh** (Fixed Schema) trên hệ thống. 
- **Giải thích UI/UX:** Quá trình Import Web UI hiển thị rõ 3 hộp UI bằng đồ hoạ (Box Card Explainer). Nội dung đi kèm giải nghĩa trực quan bằng cú pháp bình dân (Ví dụ: Chú thích rõ *P&L là Báo cáo Lỗ Lãi định dạng thụt lề*) để End-User không bị bối rối.

### 3.2 Đặc tả 3 Template Cốt lõi
1. **Template A (Mẫu Simple):** Bảng phẳng truyền thống (Dòng là Tên Series, Cột là Kỳ Báo cáo). Không có phòng ban.
2. **Template B (Mẫu Departmental):** 
   - Nhóm tự động theo tên Phòng ban nằm ở cột Header.
   - Parser tự động bóc tách tiền tố chuỗi, **Tự động Khởi tạo Department Entity mới** trong DB nếu hệ thống chưa có tên phòng ban đó.
3. **Template C (Mẫu P&L - Statement):**
   - Hỗ trợ tạo thứ bậc dữ liệu (Hierarchy) thông qua việc phân tích khoảng trống ký tự đầu (Indentation levels) thành độ sâu.

### 3.3 Rule Xử lý Rác (Garbage Data & Validation Fallback)
*Logic bảo vệ toàn vẹn dữ liệu trong quá trình import:*
- Nếu người dùng nhập chuỗi văn bản sai (Ví dụ: `N/A`, `NaN`, `Trống`, `Lỗi #DIV/0!`) vào vùng Giá Trị (Values cell) trong Excel.
- **Nghiệp vụ tuyệt đối KHÔNG chặn luồng Import** (Không sinh Exception hay văng lỗi 500).
- **Luật Fallback:** Mọi ô hỏng đều được hệ thống Parser ép kiểu thầm lặng về `0`. 
- **Cảnh báo (Alert):** API ngay lập tức tự động gán Cờ (Status) cho DataSheet là `IMPORTED_WITH_WARNINGS`. Component Dashboard sẽ ánh xạ cờ này để bật viền cảnh báo màu Vàng cho User tự rà soát.

---

## 4. Giao diện & Trải nghiệm Widget Pivot (UI/UX Guidelines)

### 4.1 Cơ chế Data Selector (TreeSelect)
Khi User gắn dữ liệu Excel vào một Widget Biểu Đồ, hệ thống kích hoạt **DataSelectorModal**.
- Dữ liệu `DataSeries` sẽ được Render lồng nhau qua TreeSelect: Nhánh cha là *Department*, Nhánh con là *Tên Dòng Dữ liệu*.
- User có thể Check All từng Phòng ban tốc độ cao (Tránh N+1 GraphQL query nhờ cơ chế `leftJoinAndSelect` ở Backend).

### 4.2 Lật Trục Tung & Kiểu Trình Bày Tự Do (Conflict Prevention)
Chức năng `SeriesColorPicker` trong Modal Settings cung cấp công năng toàn diện để config từng Line biểu đồ:
- **Nguyên tắc "Độc Lập Phân Tầng":** User được cấp tự do quyền sửa Trục Trái/Phải và Line/Bar cho **bất kì Series nào độc lập**, kể cả khi chúng khác nhóm phòng ban.
- Ví dụ: Trong cùng 1 biểu đồ, Khách hàng có thể map: 
    - `Phòng Marketing -> Mức Chi Phí` (Dạng cột BAR, Bám Trục Trái - VND).
    - `Phòng kinh doanh -> Tăng Trưởng Doanh thu` (Dạng đường LINE, Bám Trục Phải - %).
- Cơ chế Mix được thiết lập vô hiệu hoá `Stacked Bar` để tránh đụng độ lớp Layer Recharts/Chart.js.

---

## 5. Hiệu suất & Kế hoạch Lắp ghép 

### 5.1 Ước lượng Tải và N+1 Issue
Toàn bộ logic Graph API truy vấn cây thư mục Pivot được bảo mật theo phiên User và xử lý Join SQL để chịu tải lên đến **1000 chuỗi dữ liệu (DataSeries)** chia cho **100 phòng ban** mà không lag văng trình duyệt, bảo toàn FPS rendering phía Client.

### 5.2 Lịch sử Xây dựng & Timeline (Final Status)

| Phase | Thành phần cốt lõi | Status | Nhận xét |
|---|---|---|---|
| Phase A | Hệ sinh thái Business Hierarchy | **Completed** | Chạy độc lập, tự động mapping auto-ids. |
| Phase B | 3 Chuẩn Excel Pivot & Garbage Fallbacks | **Completed** | Hỗ trợ 3 mẫu hardcode kèm cảnh báo Vàng. |
| Phase C | Combo Charts & Dual Y-Axis Settings | **Completed** | UI độc lập rẽ nhánh, UX TreeSelect vượt trội. |
| **Final** | **Hoàn thành toàn phần Khối Phân Tích Đa Chiều** | **COMPLETED** | Total Estimate 32h reached. |

*(Để xem đầy đủ các tình huống lỗi vặt và 50+ Test Cases nghiệp vụ chạy thực tế trên Web, vui lòng đối chiếu qua tài liệu đính kèm: `test_cases_sbrb_pivot.md`).*
