# 🙏 Form Đăng Ký Đa Năng — Dynamic Registration System

Hệ thống đăng ký trực tuyến, tuỳ biến hoàn toàn qua **Google Sheet** — không cần sửa code.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Hoanq1003/FormDangky&env=GOOGLE_CLIENT_EMAIL,GOOGLE_PRIVATE_KEY,GOOGLE_SPREADSHEET_ID&envDescription=Cần%203%20biến%20từ%20Google%20Cloud%20%2B%20Sheet.%20Xem%20hướng%20dẫn%20README.&project-name=form-dang-ky)

## ✨ Tính năng chính

- **Nhiều loại form đăng ký** — mỗi form là 1 link riêng (`/dang-ky/{mã}`)
- **Phân nhóm cha-con** — VD: "An vị lô hương" → click vào chọn trường hợp
- **7 loại trường nhập liệu:** text, textarea, select, checkbox, multichoice, number, group (lặp lại)
- **Kết quả tách sheet riêng** — mỗi form → 1 tab `KQ_{tên form}`
- **Tuỳ chọn cột riêng/gom chung** — admin chọn trường nào ra cột riêng
- **Mobile-first**, responsive
- **Tra cứu đăng ký lại** bằng SĐT + lọc theo loại form
- **Video hướng dẫn** nhúng trên trang chủ

## 🛠 Tech Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Google Sheets API** (database)
- **Vercel** (hosting miễn phí)
- **shadcn/ui** + Tailwind CSS

---

# 📖 NHÂN BẢN DỰ ÁN — 4 BƯỚC

> ⏱ Thời gian: ~15 phút. Cần tạo **3 tài khoản miễn phí**.

## 📋 Tài khoản cần có

| # | Tài khoản | Link đăng ký | Dùng để |
|---|---|---|---|
| 1 | **Google** (Gmail) | [accounts.google.com](https://accounts.google.com) | Tạo Google Sheet + Service Account |
| 2 | **GitHub** | [github.com/signup](https://github.com/signup) | Fork code dự án |
| 3 | **Vercel** | [vercel.com/signup](https://vercel.com/signup) | Hosting miễn phí (đăng nhập bằng GitHub) |

---

## Bước 1: Fork code (2 phút)

1. Đăng nhập **GitHub**
2. Vào 👉 [github.com/Hoanq1003/FormDangky](https://github.com/Hoanq1003/FormDangky)
3. Nhấn nút **Fork** (góc trên phải) → **Create fork**
4. Bạn đã có bản sao code riêng!

## Bước 2: Tạo Google Sheet + Service Account (10 phút)

### 2.1 Bật Google Sheets API
1. Vào 👉 [console.cloud.google.com](https://console.cloud.google.com/)
2. Tạo project mới → đặt tên (VD: `form-dang-ky`)
3. Menu → **APIs & Services** → **Library** → tìm "Google Sheets API" → **Enable**

### 2.2 Tạo Service Account
1. Menu → **IAM & Admin** → **Service Accounts** → **Create Service Account**
2. Đặt tên: `sheets-writer` → Done
3. Click vào tài khoản vừa tạo → tab **Keys** → **Add Key** → **Create New Key** → **JSON**
4. 📥 **Tải file JSON** − mở file, copy 2 giá trị:
   - `client_email` → VD: `sheets-writer@project.iam.gserviceaccount.com`
   - `private_key` → chuỗi dài bắt đầu `-----BEGIN PRIVATE KEY-----`

### 2.3 Tạo Google Spreadsheet
1. Vào 👉 [sheets.google.com](https://sheets.google.com/) → tạo file mới
2. Copy **ID từ URL**: `https://docs.google.com/spreadsheets/d/`**`ID_Ở_ĐÂY`**`/edit`
3. **Share** cho Service Account: nhấn Share → paste `client_email` → quyền **Editor** → Send

### 2.4 Tạo các tab tự động
```bash
# Clone code về máy (chỉ cần làm 1 lần)
git clone https://github.com/YOUR_USERNAME/FormDangky.git
cd FormDangky
npm install

# Tạo file .env.local
cp .env.example .env.local
# → Mở .env.local, điền 3 giá trị từ bước 2.2 + 2.3

# Chạy script cài đặt tự động
npx tsx scripts/setup-new-sheet.ts
```

> Script sẽ tự tạo 8 tab, ghi headers, và thêm form mẫu.

## Bước 3: Deploy lên Vercel (3 phút)

**Cách 1: Nút bấm 1 click**
- Nhấn nút **"Deploy with Vercel"** ở đầu trang GitHub
- Điền 3 biến: `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SPREADSHEET_ID`
- Nhấn **Deploy** → chờ 1-2 phút

**Cách 2: Kết nối GitHub**
1. Vào [vercel.com](https://vercel.com/) → **Add New Project**
2. Import repo `FormDangky` từ GitHub
3. Thêm **Environment Variables** (3 biến như trên)
4. **Deploy** → xong!

## Bước 4: Kiểm tra

1. Mở link Vercel cho bạn (VD: `form-dang-ky.vercel.app`)
2. Sẽ thấy trang chủ với form mẫu
3. Thử đăng ký → kiểm tra dữ liệu trong Google Sheet

🎉 **Xong! Hệ thống đã hoạt động.**

---

# 🎨 TUỲ BIẾN QUA GOOGLE SHEET

> Không cần sửa code − chỉ sửa Google Sheet, web tự cập nhật.

## Tab `cài_đặt` — Cài đặt chung

| Khoá | Giá trị mẫu | Ý nghĩa |
|---|---|---|
| `landing_title` | 🙏 Hệ Thống Đăng Ký | Tiêu đề trang chủ |
| `landing_subtitle` | Chọn loại đăng ký... | Phụ đề |
| `video_url` | https://youtube.com/embed/xxx | Video hướng dẫn |
| `registration_open` | TRUE / FALSE | Mở/đóng đăng ký |
| `registration_close_message` | Đăng ký đã đóng | Thông báo khi đóng |
| `landing_notes` | Dòng 1\nDòng 2 | Lưu ý trang chủ |

## Tab `loại_đăng_ký` — Các loại form

| Cột | Ý nghĩa | VD |
|---|---|---|
| **A** | Mã loại (không dấu) | `cau_sieu` |
| **B** | Tên hiển thị | `Đăng ký Cầu Siêu` |
| **C** | Mô tả ngắn | `Đăng ký danh sách cầu siêu` |
| **D** | Icon | 🙏 |
| **E** | Đang mở (TRUE/FALSE) | `TRUE` |
| **F** | Thứ tự | `1` |
| **G** | Mã form | `cau_sieu` |
| **H** | Nhóm cha (trống = root) | *(trống)* |

## Tab `trường_biểu_mẫu` — Các trường form

| Cột | Ý nghĩa | VD |
|---|---|---|
| **A** | Mã form (khớp cột G bên trên) | `cau_sieu` |
| **B** | Tên nhóm trường | `Thông tin` |
| **C** | Mã trường | `hoTen` |
| **D** | Tên trường (hiển thị) | `Họ tên` |
| **E** | Loại trường | `text` |
| **F** | Bắt buộc | `TRUE` |
| **G** | Gợi ý nhập | `VD: Nguyễn Văn A` |
| **H** | Các lựa chọn (ngăn bởi \|) | `A\|B\|C` |
| **I** | Thứ tự | `1` |
| **J** | Ghi chú | `Theo âm lịch` |
| **K** | Cột riêng trong KQ | `TRUE` |
| **L** | Điều kiện hiện | `nghiep_chon=X` |

### Loại trường hỗ trợ:

| Loại | Hiển thị |
|---|---|
| `text` | Ô nhập 1 dòng |
| `textarea` | Ô nhập nhiều dòng |
| `number` | Ô nhập số |
| `select` | Dropdown chọn 1 (cần cột H) |
| `radio` | Nút chọn 1 (cần cột H) |
| `multichoice` | Checkbox chọn nhiều (cần cột H) |
| `checkbox` | 1 ô check Có/Không |
| `group` | Nhóm lặp lại (thêm/bớt được) |

---

# 📁 Cấu trúc dự án

```
src/
├── app/
│   ├── page.tsx                # Trang chủ
│   ├── dang-ky/[key]/page.tsx  # Link riêng mỗi form
│   └── admin/page.tsx          # Admin tra cứu
├── actions/
│   ├── settings.ts             # Đọc cấu hình từ Sheet
│   ├── form-fields.ts          # Đọc trường form từ Sheet
│   ├── submit.ts               # Gửi đăng ký Cầu Siêu
│   ├── submit-dynamic.ts       # Gửi các form tuỳ biến
│   └── lookup.ts               # Tra cứu SĐT
├── components/
│   ├── RegistrationWizard.tsx   # Điều phối toàn bộ flow
│   └── screens/                 # Các màn hình wizard
├── lib/sheets/
│   ├── client.ts               # Kết nối Google Sheets
│   └── helpers.ts              # Đọc/ghi dữ liệu
└── scripts/
    └── setup-new-sheet.ts      # Cài đặt Sheet tự động
```

---

# ❓ FAQ

**Thêm form mới có cần sửa code không?**
→ **Không.** Chỉ thêm dòng trong Sheet `loại_đăng_ký` + `trường_biểu_mẫu`.

**Mỗi form có link riêng không?**
→ **Có.** Link = `your-domain/dang-ky/{Mã loại}`.

**Kết quả lưu ở đâu?**
→ Mỗi form → tab `KQ_{tên form}` trong Google Sheet.

**Đổi text, icon, mô tả?**
→ Sửa tab `cài_đặt` hoặc `loại_đăng_ký`, web tự cập nhật.

**Nhiều người dùng hệ thống?**
→ Mỗi người Fork → tạo Sheet riêng → Deploy Vercel riêng. Hoàn toàn độc lập.

---

© 2026 — Hệ thống đăng ký đa năng. 🙏
