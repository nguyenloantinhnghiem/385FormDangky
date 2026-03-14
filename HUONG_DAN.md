# 📖 HƯỚNG DẪN NHÂN BẢN HỆ THỐNG ĐĂNG KÝ

> ⏱ Thời gian: ~15 phút | Miễn phí 100% | Bản độc lập hoàn toàn

---

## 📋 Cần tạo 3 tài khoản miễn phí

| # | Tài khoản | Link đăng ký | Dùng để |
|---|---|---|---|
| 1 | **Google (Gmail)** | [accounts.google.com](https://accounts.google.com) | Lưu trữ dữ liệu |
| 2 | **GitHub** | [github.com/signup](https://github.com/signup) | Lưu code |
| 3 | **Vercel** | [vercel.com/signup](https://vercel.com/signup) | Chạy website |

---

## BƯỚC 1 — Cài đặt công cụ trên máy tính

### 🪟 Windows

1. **Cài Node.js:**
   - Vào 👉 [nodejs.org](https://nodejs.org/)
   - Tải bản **LTS** (nút xanh lớn) → chạy file cài đặt → nhấn **Next** liên tục → **Install**
   - Kiểm tra: mở **Command Prompt** (gõ `cmd` ở Start menu), gõ:
     ```
     node --version
     ```
     Nếu hiện `v20...` hoặc `v22...` là thành công

2. **Cài Git:**
   - Vào 👉 [git-scm.com/download/win](https://git-scm.com/download/win)
   - Tải → cài đặt (nhấn **Next** liên tục → **Install**)
   - Kiểm tra: mở lại **Command Prompt**, gõ:
     ```
     git --version
     ```

### 🍎 macOS

1. **Cài Node.js:**
   - Vào 👉 [nodejs.org](https://nodejs.org/)
   - Tải bản **LTS** → mở file `.pkg` → cài đặt
   - Hoặc dùng Terminal:
     ```bash
     brew install node
     ```
   - Kiểm tra: mở **Terminal**, gõ:
     ```bash
     node --version
     ```

2. **Cài Git:**
   - macOS thường đã có sẵn Git. Kiểm tra:
     ```bash
     git --version
     ```
   - Nếu chưa có, cài Xcode Command Line Tools:
     ```bash
     xcode-select --install
     ```

---

## BƯỚC 2 — Fork code về GitHub của bạn

1. Đăng nhập **GitHub**
2. Mở 👉 [github.com/Hoanq1003/FormDangky](https://github.com/Hoanq1003/FormDangky)
3. Nhấn nút **Fork** (góc trên phải) → **Create fork**
4. ✅ Xong — bạn đã có bản code riêng tại `github.com/TEN_CUA_BAN/FormDangky`

---

## BƯỚC 3 — Tạo Google Sheet + Service Account

### 3a. Tạo Google Cloud Project
1. Vào 👉 [console.cloud.google.com](https://console.cloud.google.com/)
2. Nhấn **Select a project** (trên cùng) → **New Project**
3. Tên: `form-dang-ky` → nhấn **Create**
4. Chờ tạo xong (10 giây)

### 3b. Bật Google Sheets API
1. Menu trái ☰ → **APIs & Services** → **Library**
2. Tìm: **Google Sheets API**
3. Nhấn **Enable**

### 3c. Tạo Service Account
1. Menu trái ☰ → **IAM & Admin** → **Service Accounts**
2. Nhấn **+ Create Service Account**
3. Tên: `sheets-writer` → nhấn **Done** (bỏ qua bước 2, 3)
4. Nhấn vào dòng `sheets-writer` vừa tạo
5. Tab **Keys** → **Add Key** → **Create New Key** → chọn **JSON** → **Create**
6. 📥 **File JSON tự tải về máy** — giữ lại, **không chia sẻ cho ai!**

### 3d. Lấy thông tin từ file JSON
Mở file JSON bằng Notepad (Windows) hoặc TextEdit (macOS), tìm:
```
"client_email": "sheets-writer@xxx.iam.gserviceaccount.com"   ← COPY GIỮ LẠI (1)
"private_key": "-----BEGIN PRIVATE KEY-----\n..."              ← COPY GIỮ LẠI (2)
```

### 3e. Tạo Google Spreadsheet
1. Vào 👉 [sheets.google.com](https://sheets.google.com/) → Tạo bảng tính mới
2. Copy **ID** từ URL:
   ```
   https://docs.google.com/spreadsheets/d/  ABC123XYZ  /edit
                                             ↑ ĐÂY LÀ ID ← COPY GIỮ LẠI (3)
   ```
3. Nhấn **Share** (góc trên phải) → paste `client_email` (1) → quyền **Editor** → **Send**

### 3f. Clone code + Cài đặt Sheet tự động

**🪟 Windows (Command Prompt):**
```cmd
git clone https://github.com/TEN_CUA_BAN/FormDangky.git
cd FormDangky
npm install
copy .env.example .env.local
```

**🍎 macOS (Terminal):**
```bash
git clone https://github.com/TEN_CUA_BAN/FormDangky.git
cd FormDangky
npm install
cp .env.example .env.local
```

### 3g. Điền thông tin vào `.env.local`

Mở file `.env.local` bằng trình soạn thảo (Notepad / TextEdit / VS Code):

```env
GOOGLE_CLIENT_EMAIL=sheets-writer@xxx.iam.gserviceaccount.com    ← (1)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"   ← (2)
GOOGLE_SPREADSHEET_ID=ABC123XYZ   ← (3)
```

### 3h. Chạy script tự tạo các tab trong Sheet

```bash
npx tsx scripts/setup-new-sheet.ts
```

Kết quả:
```
✅ Tab "cài_đặt" — tạo thành công
✅ Tab "loại_đăng_ký" — tạo thành công (1 dữ liệu mẫu)
✅ Tab "trường_biểu_mẫu" — tạo thành công (6 dữ liệu mẫu)
...
✅ CÀI ĐẶT HOÀN TẤT!
```

### 3i. Test thử trên máy (tuỳ chọn)

```bash
npm run dev
```
Mở trình duyệt → vào `http://localhost:3000` → thấy trang đăng ký → nhấn `Ctrl+C` để tắt

---

## BƯỚC 4 — Deploy lên Vercel (website chính thức)

1. Vào 👉 [vercel.com](https://vercel.com/) → đăng nhập bằng **GitHub**
2. Nhấn **Add New** → **Project**
3. Tìm repo **FormDangky** → nhấn **Import**
4. Mở phần **Environment Variables**, thêm lần lượt:

   | Name (gõ chính xác) | Value (paste từ file JSON) |
   |---|---|
   | `GOOGLE_CLIENT_EMAIL` | Email từ (1) |
   | `GOOGLE_PRIVATE_KEY` | Khoá từ (2) — bao gồm cả dấu `"` |
   | `GOOGLE_SPREADSHEET_ID` | ID từ (3) |

5. Nhấn **Deploy**
6. Chờ 1-2 phút → ✅ **Xong!**
7. Vercel cho bạn link website: `ten-ban.vercel.app`

---

## 🎉 Sau khi hoàn thành

### Tuỳ biến nội dung (không cần code)
- Mở Google Sheet → tab `cài_đặt` → sửa tiêu đề, mô tả, video
- Tab `loại_đăng_ký` → thêm/sửa loại form
- Tab `trường_biểu_mẫu` → thêm/sửa trường trong form
- **Web tự cập nhật** — không cần deploy lại!

### Thêm video hướng dẫn cho mỗi form
- Trong tab `loại_đăng_ký` → cột **I (Video)** → paste link YouTube embed
- VD: `https://www.youtube.com/embed/abc123`
- Video sẽ hiện trên trang form để người dùng xem trước khi điền

### Xem kết quả đăng ký
- Mỗi form tự tạo tab kết quả riêng: `KQ_{tên form}`
- Tab `Tổng hợp đăng ký` chứa tất cả đăng ký

---

## ❓ Gặp lỗi?

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| Trang trắng / lỗi 500 | Thiếu biến môi trường | Kiểm tra 3 biến trên Vercel Settings → Environment Variables |
| "Unable to read sheet" | Chưa share Sheet | Share Sheet cho Service Account (bước 3e) |
| Không thấy form | Sheet chưa có dữ liệu | Chạy lại `npx tsx scripts/setup-new-sheet.ts` |
| `npx tsx` lỗi | Chưa cài Node.js | Quay lại Bước 1 |
| `git clone` lỗi | Chưa cài Git | Quay lại Bước 1 |

---

> 💡 Mỗi bản clone là **hoàn toàn độc lập** — code riêng, dữ liệu riêng, website riêng.
