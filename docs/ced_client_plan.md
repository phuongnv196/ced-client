# Phân tích giao diện Postman và Kế hoạch phát triển `ced-client`

## 1. Phân tích chi tiết giao diện Postman (dựa trên ảnh chụp)

Giao diện Postman được thiết kế tối ưu cho workflow kiểm thử API, chia thành các vùng chức năng rõ ràng:

### A. Sidebar Navigation (Thanh điều hướng bên trái)
Đây là trung tâm quản lý tài nguyên của workspace.
- **Header:** Tên "My Workspace", các nút hành động nhanh như "New", "Import" và icon "+".
- **Vertical Menu (Menu dọc ngoài cùng):** Các tab chính đại diện cho các tính năng cốt lõi:
  - **Collections:** Quản lý các file API requests dạng thư mục/nhóm.
  - **Environments:** Quản lý biến môi trường (dev, prod, staging).
  - **History:** Lịch sử các request đã gửi.
- **List View (Khu vực danh sách):** 
  - Khung tìm kiếm "Search collections".
  - Danh sách các collections hiển thị theo cấu trúc cây (Tree-view). Trong ảnh, collection `Github Copilot` đang mở rộ ra, hiển thị rõ danh sách các requests. Các request được gắn nhãn màu theo HTTP Method (POST có màu cam, GET có màu xanh lá) để dễ dàng nhận biết. Request nào đang mở sẽ được highlight sáng bằng nền xám.
- **Bottom Left Icons:** Cloud View, Find and replace, Console (để debug script), và Terminal.

### B. Main Workspace (Khu vực làm việc chính giữa)
Nơi mà các thao tác tạo và cấu hình request thực tế diễn ra.
- **Tabs Navigation (Phần trên cùng):**
  - Hệ thống tab cho phép mở cùng lúc nhiều file/request (+). Tab đang mở có biểu tượng trạng thái (như dấu chấm cam báo hiệu chưa save).
  - Góc phải là Breadcrumbs hiển thị đường dẫn thư mục `⚏ Github Copilot / Create session`, nút `Save` và `Share`. Tab Environment selector vẫn giữ góc phải.
- **Request Setup (Nửa trên của không gian làm việc):**
  - **URL Bar:** Dropdown chọn HTTP Method (ví dụ POST được tô nền cam nổi bật), input nhập URL Endpoint, và nút `Send` lớn màu xanh dương.
  - **Request Configurations (Chi tiết các tab cấu hình):** Gồm các tab chính như `Docs`, `Params`, `Authorization`, `Headers`, `Body`, `Scripts`, `Settings`. Tab nào đang có dữ liệu sẽ hiển thị chấm màu xanh lá nổi bật hoặc hiển thị số lượng (VD: Headers (10)).
    - **Tab Params:** Quản lý Query Params. Giao diện dạng grid/table với các cột: Checkbox (ẩn/hiện tham số), Key, Value, Description. Có tính năng `Bulk Edit`. Nếu gõ chuỗi truy vấn thẳng trên URL (VD: `?query=1`), bảng sẽ tự động đồng bộ sinh ra dòng tương ứng.
    - **Tab Authorization:** Bên trái là Dropdown chọn loại `Auth Type` (như API Key...). Bên phải là form điền chi tiết tương ứng (VD: Key, Value, và dropdown báo thêm vào `Header` hoặc `QueryParams`).
    - **Tab Headers:** Giao diện bảng tương tự Params. Có nút `Hide auto-generated headers`. Khung hiển thị các header tự động lấy thông tin từ hệ thống (kèm icon chữ 'i' info) như `Host`, `User-Agent`, `Content-Length`. Có tính năng `Presets` chọn nhanh bộ header mẫu.
    - **Tab Body:** Hỗ trợ đa dạng cấu hình bằng hàng Radio button: `none`, `form-data`, `x-www-form-urlencoded`, `raw` (đang chọn), `binary`, `GraphQL`. Khi dùng `raw`, sẽ có dropdown chọn định dạng (như `JSON`) và nút `Beautify` để format code.
    - **Tab Scripts:** Giao diện chia 2 cột dọc. Cột trái chọn `Pre-request` (script chạy trước/tiền xử lý) hoặc `Post-response` (xử lý hậu kỳ sau khi có kết quả). Cột phải rỗng là Code Editor hỗ trợ JavaScript (Có placeholder gợi ý AI "Ctrl+Alt+P to Ask AI"). Các tiện ích góc phải dưới là kho `Packages` và `</> Snippets` text mẫu.
- **Response Section (Nửa dưới bằng cách chia pane):**
  - Thanh ngăn cách kéo thả (Resizable Divider) chia màn hình chính giữa phần Request và Response.
  - Các tab `Response` và `History`.
  - Panel hiển thị trạng thái chờ `Click Send to get a response` kèm hình ảnh minh họa (phi hành gia) khi chưa gọi API.

### C. Bottom Status Bar (Thanh công cụ bên dưới)
Chứa các tiện ích và trạng thái toàn phiên:
- Góc phải: Runner (chạy test suite), Start Proxy, Quản lý Cookies, Vault (bảo mật), Trash (thùng rác), Settings và Help.

---

## 2. Kế hoạch phát triển công cụ `ced-client`

Mục tiêu là xây dựng một API Client nhẹ, nhanh, tập trung vào các tính năng cốt lõi nhất được lấy cảm hứng từ Postman. Tên ứng dụng là `ced-client`.

Dự án nằm trong workspace `NodeJS`, do đó tôi đề xuất **kiến trúc Web App** sử dụng **Vite (React + TypeScript)** hoặc **Next.js** kết hợp với **Tailwind CSS**. Nếu muốn thành desktop app sau này, ta có thể dễ dàng gói gọn bằng Electron.

### Giai đoạn 1: Khởi tạo và Thiết lập nền tảng (Foundation)
- **Framework:** Sử dụng `vite` với template React-Typescript vì tốc độ siêu nhanh.
- **UI & Styling:** Dùng `Tailwind CSS` để dàn trang và style. Dùng thư viện icon `lucide-react`. Dùng các Headless UI component như `radix-ui` hoặc `shadcn/ui` để xử lý các UI phức tạp (Resizable panels, Tabs, Dropdowns).
- **State Management:** Dùng `Zustand` để quản lý local state của hàng loạt Tabs mở cùng lúc, dữ liệu Collections, Environments.

### Giai đoạn 2: Xây dựng Layout và UI Core (Static UI)
- **App Layout:** Chia màn hình thành 3 khu vực chính (Panel trái dạng sidebar có thể kéo thả độ rộng, Main panel trung tâm chứa Tabs, Footer ở dưới cùng).
- **Xây dựng Sidebar:**
  - Component Tree-view quản lý Collections (hỗ trợ tạo folder, request con, Drag and Drop).
  - Thanh tìm kiếm và filtering requests.
- **Hệ thống Tabs & Breadcrumbs:** Cho phép mở/đóng/chuyển đổi đa nhiệm và hiển thị đường dẫn hiện tại (Collection > Folder > Request) kèm nút Save.
- **Request Panel (Main Area - Split Top):**
  - Bar định dạng: Dropdown chọn Method (có màu sắc khác nhau GET/POST/PUT/DELETE...), Khung Input URL (hỗ trợ liên kết tự động bóc tách `?query=...` thành mảng Params và ngược lại), Nút "Send" to rõ màu xanh dương.
  - **Xây dựng UI Layout cho các Sub-Tabs:** (Cần làm nổi bật các tab đang có dữ liệu thông qua chấm nhận diện màu xanh lá)
    - **Params & Headers:** Xây dựng Table Component dạng Data Grid nhập liệu động (Dynamic Data-grid), hỗ trợ tự động thêm dòng mới khi gõ, các checkbox toggle (enable/disable), và chế độ edit raw text (Bulk Edit).
    - **Authorization:** Layout chia hai cột dạng Master-Detail. Component Dropdown bên trái điều hướng render ra các Dynamic Form nhập liệu chuyên biệt bên phải (Token, API Key, Basic Auth...).
    - **Body:** Cấu trúc Radio thay đổi cơ chế render phía dưới (render Key-Value Grid cho form-data, hoặc render Text Editor cho Raw JSON/GraphQL). Thêm tính năng bấm format `Beautify` làm đẹp code.
    - **Scripts:** Layout Vertical Tabs cho `Pre-request` / `Post-response` bên trái, bên phải là không gian soạn thảo script cùng panel chèn `Snippets` tiện ích.
  - **Hệ thống Soạn thảo mạnh mẽ:** Tích hợp sâu thư viện `Monaco Editor` của Microsoft để highlight text, tự động focus dòng lỗi, auto-complete cú pháp JavaScript (trong Scripts) và cấu trúc JSON/XML (trong Body).
- **Response Panel (Main Area - Split Bottom):**
  - Dùng `react-resizable-panes` (hoặc tương tự) để tạo thanh kéo thả (divider) dọc/ngang điều chỉnh độ rộng giữa Request editor và Response view.
  - Trạng thái trống sinh động minh hoạ 'Click Send to get a response'.

### Giai đoạn 3: Hiện thực logic gọi API (Core Logic)
- **Thực thi HTTP Request:** 
  - Xây dựng module gọi mạng sử dụng `axios` hoặc `fetch` API gốc.
  - Hiển thị Response sinh động: Status Code (màu xanh cho 2xx, đỏ cho 4xx/5xx), Time taken, Size.
  - *Vấn đề CORS:* Để Web app có thể gọi API bên ngoài tự do, ta sẽ cần tích hợp một NodeJS Proxy Server nhẹ (hoặc electron main process nếu là app desktop).
- **Biến môi trường (Environments):** Phân tích cú pháp chuỗi `{{baseUrl}}/api/users` để thay thế bằng giá trị tương ứng trong Environment đang active trước khi gọi hàm.
- **Local Storage:** Tích hợp `IndexedDB` (thông qua `localforage`) để lưu trữ offline toàn bộ Collections, trạng thái bộ nhớ Tabs đang mở. Đảm bảo F5 không mất phiên làm việc.

### Giai đoạn 4: Tính năng nâng cao và Hoàn thiện (Polishing)
- **Response Viewer:** Hiển thị Response Body với JSON syntax highlighting, format đẹp mắt, hỗ trợ xem raw text / preview image.
- **History:** Lưu tự động toàn bộ lịch sử các request đã gửi thành danh sách.
- **Dark/Light Mode:** Xây dựng theme cao cấp.
- **Animation UX:** Chuyển đổi mượt mà giữa các tab và trạng thái loading bằng Framer Motion hoặc CSS.
