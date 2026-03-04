# Ced-Client Development Checklist

## Giai đoạn 1: Khởi tạo & Thiết lập nền tảng (Foundation)
- [x] Khởi tạo dự án bằng Vite (React + TypeScript).
- [x] Cài đặt và cấu hình Tailwind CSS v4.
- [x] Cài đặt các thư viện thiết yếu: `lucide-react`, `zustand`, `axios`, `localforage`.
- [x] Cài đặt các thư viện UI: `react-resizable-panels`, `classnames`, `monaco-editor`.
- [x] Đóng gói thành Desktop App bằng Electron (tạo `main.cjs`, `preload.cjs`, tinh chỉnh `package.json`).

## Giai đoạn 2: Xây dựng Layout và UI Core (Static UI)
- [x] Xây dựng khung App Layout 3 phần (Sidebar trái, Main Panel chính giữa chia làm 2 pane trên/dưới, thanh Footer dưới cùng).
- [x] Xây dựng tĩnh Sidebar hiển thị danh mục Collections theo cấu trúc Tree-view có chia màu theo HTTP Method.
- [x] Xây dựng hệ thống Tabs đa nhiệm (Mở/đóng tab linh hoạt, hiển thị breadcrumbs).
- [ ] Xây dựng Request Panel (Nửa trên khu vực trung tâm):
  - [x] URL Bar: Thanh chọn HTTP Method và Input URL.
  - [x] **Tab Params:** Xây dựng Data-grid thêm/xoá/sửa tham số Query động (có checkmark). Tính năng đồng bộ hoá giá trị giữa ô URL và danh sách Grid.
  - [x] **Tab Authorization:** Thiết kế layout chia 2 cột dạng Master-Detail chọn Auth Type (API Key, Basic...).
  - [x] **Tab Headers:** Xây dựng Data-grid tương tự Params. Bổ sung Auto-generated headers và tính năng Presets.
  - [x] **Tab Body:** Hệ thống Radio box điều hướng, cơ chế chuyển đổi giữa Grid-form và không gian nhập liệu Raw.
  - [x] **Tab Scripts:** Layout dọc chia Pre-request và Post-response đi kèm các snippet phụ trợ.
  - [x] Tích hợp đầy đủ trình soạn thảo `Monaco Editor` (Scripts).
- [ ] Xây dựng Response Panel (Nửa dưới khu vực trung tâm):
  - [x] Thêm dải Resizer kéo thả điều chỉnh kích thước dọc x ngang mượt mà.
  - [x] Xây dựng Component Empty State "Click Send to get a response" kèm minh hoạ.
  - [x] Hiện thực hoá bộ khung hiển thị Metadata (Status code, thời gian phản hồi, kích thước nội dung trả về).

## Giai đoạn 3: Tính năng Lõi (Core Logic & Networking)
- [x] Tách nhỏ chức năng từ giao diện tĩnh của `App.tsx` thành các Components độc lập (`Sidebar`, `RequestTabs`, `CodeEditor`, `DataGrid`...).
- [x] Cấu hình kiến trúc `Zustand` Store để quản lý State tập trung cho Collection Files, Tabs hiện tại, và trạng thái cấu hình Request.
- [x] Xây dựng engine thực thi HTTP Request qua Electron Main Process hoặc `axios` chuẩn để bỏ qua rào cản CORS.
- [x] Logic nhận diện biến môi trường (Ví dụ tự thay chuỗi `{{baseUrl}}/api` bằng giá trị tương ứng).
- [x] Khởi chạy `IndexedDB/localforage` để tự động lưu lại phiên làm việc (Cửa sổ bật lại không mất dữ liệu).

## Giai đoạn 4: Hoàn thiện (Polishing & Advanced)
- [x] Tính năng Beautify: Nút format làm đẹp Code JSON phản hồi.
- [x] Response Viewer: Hiển thị highlight JSON syntax, hỗ trợ Preview ảnh (Binary) & Raw text.
- [x] Tự động lưu vết Request thành danh sách History tách biệt trong Sidebar.
- [x] Monaco IntelliSense: Hỗ trợ gợi ý object `pm` và các phương thức `pm.request.headers.add`.
- [x] Bug Fixed: Sửa lỗi trùng lặp Header khi sử dụng tính năng Presets.
- [ ] Khả năng xuất/nhập file Collection chuẩn để dùng chung với Postman.
- [ ] Tính năng thay đổi giao diện DarkMode (Chủ đề sáng/tối).
- [ ] Thêm các hiệu ứng (Animations) vi mô khi Loading và thao tác UI.
