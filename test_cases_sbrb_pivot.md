# SBRB Analytical Platform: 50+ Test Cases & Execution Guide

Tài liệu này định nghĩa một lượng lớn các test case từ cơ bản tới phức tạp (đặc biệt nhấn mạnh vào **performance** và **edge cases**) để kiểm thử toàn vẹn kiến trúc Pivot 5.0.

## 1. Import DataSheet & Database Rules (15 Cases)

**Category: Basic Validation & Template Types**
1. **[T01]** Import thành công Mẫu Simple chuẩn.
2. **[T02]** Import thành công Mẫu Departmental với 3 phòng ban khác nhau.
3. **[T03]** Import thành công Mẫu P&L (Doanh thu -> Chi phí) có thụt lề chuẩn.
4. **[T04]** Import Mẫu Departmental mà tên phòng ban chứa ký tự đặc biệt (`R&D!@#`, `Sale/Marketing`). Hệ thống phải tạo tên Department chuẩn xác.
5. **[T05]** Import Mẫu Departmental nhưng dòng trống (Empty Rows) xen kẽ giữa các phòng ban.
6. **[T06]** Import dữ liệu chứa chuỗi rác (`"N/A"`, `"NaN"`, `"-"`, `#DIV/0!`). Hệ thống tự ép về `0` và set status `IMPORTED_WITH_WARNINGS`.

**Category: Integrity & Conflict Handling**
7. **[T07]** Import file Excel hoàn toàn trống (không có sheet, không có header). Hệ thống phải bung lỗi Validation thân thiện.
8. **[T08]** Import Mẫu Departmental bị sai cấu trúc (thiếu cột Category hoặc Period).
9. **[T09]** Re-import cùng 1 file, nhưng file mới **đổi tên** các phòng ban. Hệ thống giữ Department cũ hay tạo mới? -> Phải tạo mới Department hoặc báo lỗi.
10. **[T10]** Re-import file Mẫu Simple đè lên 1 DataSheet vốn được import từ Mẫu Departmental. (Cross-template reimport).
11. **[T11]** Re-import file khuyết đi 1 phòng ban (Giữa v1 có "Sale", v2 bị mất "Sale").
12. **[T12]** Import đồng thời 1 cục 5 file Mẫu Departmental nặng 5MB qua API (Load Test).
13. **[T13]** Đăng tải file Excel chứa Macro (`.xlsm` cố tình đổi đuôi thành `.xlsx`) -> Hệ thống phải từ chối.
14. **[T14]** Header chứa kỳ lạ như kiểu Date (`01/01/2026`) thay vì Text. Parser có format string chuẩn không?
15. **[T15]** Dữ liệu số âm cực lớn (`-99999999999`) và số thực lẻ dài (`1.333333333`) -> Kiểm tra JS precision limit trong PostgreSQL.

## 2. Pivot & Department Mapping (10 Cases)

16. **[T16]** 1 DataSeries được sinh ra từ Mẫu Simple (Không có Department), lúc truy vấn `departmentName` có trả null?
17. **[T17]** Cố tình xoá 1 Department ở module khác (nếu có), Widget có bị crash khi fetch Chart Data? Cascade rule type.
18. **[T18]** Đổi tên Department bên ngoài, sau đó quay lại Widget xem Label trên biểu đồ có tự cập nhật tên mới?
19. **[T19]** 2 phòng ban có tên giống hệt nhau (Khác hoa/thường: `"SALE"`, `"Sale"`). Hệ thống gộp 1 hay tách 2? (Nên gộp 1).
20. **[T20]** Mapping một chuỗi dài 1000 Series chia theo 100 Phòng ban -> Kiểm tra API `availableSeries` trả dữ liệu bao lâu?
21. **[T21]** WidgetDataResolver `getChartData` lấy 1000 Series -> Performance bottleneck vì JOIN? (Đã xử lý N+1 query).
22. **[T22]** Khi xoá DataSheet, toàn bộ DataSeries liên quan và Department Mapping phải sạch trơn (Không Orphan records).
23. **[T23]** Xóa 1 Series đang được chọn ở Widget -> Widget UI render fallback hợp lý thay vì văng trắng trang (White Screen of Death).
24. **[T24]** Import Mẫu P&L, hệ thống phải hiểu thứ tự thụt lề (Indentation level) khi lưu vào DataSeries name.
25. **[T25]** Cố tình query GraphQL lấy `DataSeries` với `datasheetId` không thuộc về business của User hiện tại -> Bị chặn bởi ACL/Authorization.

## 3. UI/UX: DataSelector & TreeSelect (15 Cases)

26. **[T26]** Click mở Modal Selector, bấm chọn DataSheet A. Phải ngay lập tức thấy danh sách TreeSelect Series.
27. **[T27]** DataSheet A không có Department (Mẫu Simple), TreeSelect hiển thị dưới branch: "Khác (Không có phòng ban)".
28. **[T28]** DataSheet B có 3 phòng ban. Click Expand/Collapse mượt mà, check All 1 node Department -> Auto tick hết series con.
29. **[T29]** Submit DataSelectorModal với Array `selectedSeriesIds` là RỖNG -> Mặc định chọn tất cả khi render.
30. **[T30]** Đóng Modal DataSelector đột ngột giữa chừng (`ESC`), mở lại -> State form phải clear hoặc giữ bản nháp đúng chuẩn (Tuỳ specs nội bộ).
31. **[T31]** Tại giao diện Import, Layout 3 phần tử (Simple, Dept, P&L) có căn giữa hoàn hảo trên màn mỏng (Tablet 768px).
32. **[T32]** Tải file Mẫu B, giao diện Import Card hiển thị dấu check màu xanh (Đã nhận diện file). Click Upload -> Processing bar chạy chuẩn xác.
33. **[T33]** File hỏng (báo đỏ), hover vào "DataSheet Details" hiển thị chính xác dòng bị lỗi trong ValidationErrors Array.
34. **[T34]** Tương tác với Select Department Search: Gõ chữ tiéng Việt có dấu "Phòng Kế Toán" phải filter đúng các node trong TreeSelect.
35. **[T35]** TreeSelect có hơn 500 nodes (Stress test UI render). Ant Design v5 ảo hoá (Virtualization) có được kích hoạt để tránh lác form?
36. **[T36]** Không chọn Series nào bấm Confirm -> UI xác nhận "Hiển thị toàn bộ dữ liệu mẫu này" hoặc tự động tick tất.
37. **[T37]** Đổi màu Series khi chưa lưu Widget -> Refresh trang, Widget mất config chưa save.
38. **[T38]** Đã có 1 Widget Link sheet X. Đi link đè sheet Y -> Cảnh báo "Xoá liên kết cũ, thay bằng Y"? Mọi Setting màu sắc / type bị xoá.
39. **[T39]** Phân trang danh sách SheetList ở Modal DataSelector (nếu có > 100 Sheets).
40. **[T40]** Dark Mode UI: Box Mẫu B/Mẫu C trên ImportDialog không bị chói lọi, border màu chuẩn.

## 4. UI/UX: Widget Configuration (Type, Axis, Performance) (10 Cases)

41. **[T41]** Tại Widget Edit Panel, Series A đặt `Bar` (`Left Axis`), Series B đặt `Line` (`Right Axis`). Biểu đồ hiện Combo 2 trục tung.
42. **[T42]** Chuyển toàn bộ 5 Series từ `Left Axis` sang `Right Axis` -> Trục trái tự động biến mất và chỉ còn trục phải.
43. **[T43]** Vận hành `Color Picker`: Chọn mã màu trùng với màu của Series khác -> Tooltip nhắc nhở / hoặc cứ cho phép nhưng check trùng màu ở Grid.
44. **[T44]** Khi Series Name rất dài (Ví dụ > 100 kí tự), tên ở Settings Panel bật Dấu Ba chấm (`...`) và Hover Tooltip, không bị vỡ Layout Control Axis.
45. **[T45]** Ở dạng `Pie Chart`, toggle Bar/Line Axis bị Disable hoàn toàn đúng như thiết kế (vì Pie không có Axis).
46. **[T46]** Số lớn định dạng: 10,000,000 chỉnh sang `Short` -> Axis hiển thị `10M`.
47. **[T47]** Cấu hình `Stacked Bar` áp dụng chung toàn bộ Bar Series. Đảm bảo UI Toggle hoạt động bật tắt chuẩn xác.
48. **[T48]** Kéo giãn Widget trên Dashboard, biểu đồ resize Responsive mượt mà với 2 trục Y.
49. **[T49]** Reload trang toàn tập, Setting Của Left/Right Y-Axis vẫn giữ nguyên như vừa Save. Data đúng với GraphQL Response Cache.
50. **[T50]** Concurrent Update: 2 người cùng Edit 1 Widget, đổi Axis khác nhau. Lịch sử Conflict GraphQL được bắt lỗi hoặc Overwrite Last-write-wins.
51. **[T51]** (Bonus) Performance Render: Render 1 biểu đồ Line với 12 trục X x 50 DataSeries. Recharts xử lý mượt, FPS >= 30. Khảo sát giật lag khi re-size trình duyệt.

## Hướng dẫn thao tác Kiểm thử Tự động (Playwright/Cypress)
1. Sử dụng tính năng Mock File để Bypass file OS picker.
2. Tại màn Dashboard, gọi thao tác Insert Widget mới.
3. Kích hoạt Modal, mock GraphQL `dataSheets` query -> Nhập file Mẫu B.
4. Sử dụng DOM query tìm `.ant-select-tree-checkbox` để Check All / Check từng phòng ban.
5. Cập nhật `chartConfig` API -> Chờ Websocket Push hoặc Mutation resolve để check Chart UI.
