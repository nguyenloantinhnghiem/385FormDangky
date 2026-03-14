# 📖 HƯỚNG DẪN NHÂN BẢN HỆ THỐNG ĐĂNG KÝ (Windows)

> ⏱ Thời gian: ~15–20 phút | Miễn phí 100% | Bản độc lập hoàn toàn
>
> Hướng dẫn dành cho **Windows 10/11**. Nếu dùng macOS, xem phần cuối.

---

## 📋 TỔNG QUAN

Bạn sẽ tạo một hệ thống đăng ký riêng, gồm:
- ✅ Website đăng ký trực tuyến (miễn phí mãi mãi)
- ✅ Google Sheet lưu trữ dữ liệu (của bạn, do bạn quản lý)
- ✅ Tuỳ biến form qua Google Sheet — không cần biết lập trình

**Cần tạo 3 tài khoản miễn phí:**

| # | Tài khoản | Đăng ký tại | Mục đích |
|---|---|---|---|
| 1 | **Google (Gmail)** | [accounts.google.com](https://accounts.google.com) | Lưu dữ liệu đăng ký |
| 2 | **GitHub** | [github.com/signup](https://github.com/signup) | Lưu trữ mã nguồn |
| 3 | **Vercel** | [vercel.com/signup](https://vercel.com/signup) | Chạy website (dùng GitHub đăng nhập) |

---

## BƯỚC 1 — Cài đặt phần mềm trên Windows

### 1a. Cài Node.js

1. Mở trình duyệt, vào 👉 **[nodejs.org](https://nodejs.org/)**
2. Nhấn nút xanh lớn **"Download LTS"**
3. Mở file `node-v...msi` vừa tải → nhấn **Next** → **Next** → ... → **Install** → **Finish**
4. **Kiểm tra:** Nhấn phím `Win + R` → gõ `cmd` → Enter → gõ lệnh:
   ```
   node --version
   ```
   ✅ Nếu hiện `v20.x.x` hoặc `v22.x.x` là thành công

### 1b. Cài Git

1. Vào 👉 **[git-scm.com/download/win](https://git-scm.com/download/win)**
2. Nhấn **"Click here to download"** → chạy file cài đặt
3. Nhấn **Next** liên tục (giữ nguyên mặc định) → **Install** → **Finish**
4. **Kiểm tra:** Mở lại **Command Prompt** (đóng cái cũ, mở cái mới), gõ:
   ```
   git --version
   ```
   ✅ Nếu hiện `git version 2.x.x` là thành công

> ⚠️ **Quan trọng:** Sau khi cài xong, **đóng tất cả cửa sổ Command Prompt** rồi mở lại cửa sổ mới để hệ thống nhận được Node.js và Git.

---

## BƯỚC 2 — Fork code về GitHub của bạn

1. Đăng nhập vào 👉 **[github.com](https://github.com)**
2. Mở link: 👉 **[github.com/Hoanq1003/FormDangky](https://github.com/Hoanq1003/FormDangky)**
3. Nhấn nút **Fork** (góc trên bên phải, có biểu tượng nhánh cây)
4. Trong trang "Create a new fork":
   - **Owner**: chọn tên GitHub của bạn
   - **Repository name**: giữ nguyên `FormDangky` hoặc đổi tên tuỳ ý
5. Nhấn **Create fork**
6. ✅ Chờ vài giây — bạn đã có bản code riêng tại `github.com/TEN_CUA_BAN/FormDangky`

---

## BƯỚC 3 — Tạo Google Sheet + Kết nối API

### 3a. Tạo Google Cloud Project

1. Vào 👉 **[console.cloud.google.com](https://console.cloud.google.com/)** (đăng nhập bằng Gmail)
2. Nhấn vào ô **"Select a project"** hoặc **"Chọn dự án"** (thanh trên cùng)
3. Nhấn **New Project** (góc trên phải popup)
4. Đặt tên: `form-dang-ky` → nhấn **Create**
5. Chờ 5–10 giây → nhấn lại **"Select a project"** → chọn `form-dang-ky`

### 3b. Bật Google Sheets API

1. Nhấn menu ☰ (3 gạch ngang, góc trên trái) → **APIs & Services** → **Library**
2. Trong ô tìm kiếm, gõ: **Google Sheets API**
3. Nhấn vào kết quả **Google Sheets API**
4. Nhấn nút xanh **Enable**
5. ✅ Chờ vài giây — API đã bật

### 3c. Tạo Service Account (tài khoản kết nối máy)

1. Menu ☰ → **IAM & Admin** → **Service Accounts**
2. Nhấn **+ Create Service Account**
3. Điền:
   - **Service account name**: `sheets-writer`
   - Bỏ qua phần còn lại → nhấn **Done**
4. Trong danh sách, nhấn vào dòng **sheets-writer** vừa tạo
5. Chuyển sang tab **Keys** (phía trên)
6. Nhấn **Add Key** → **Create New Key**
7. Chọn **JSON** → nhấn **Create**
8. 📥 **File JSON tự tải về máy** (thường nằm trong thư mục `Downloads`)

> ⚠️ File này chứa mật khẩu kết nối — **không chia sẻ cho ai, không đăng lên mạng!**

### 3d. Mở file JSON — lấy 2 thông tin quan trọng

Nhấn chuột phải vào file JSON → **Open with** → **Notepad** (Sổ tay)

Tìm 2 dòng sau và **copy riêng từng giá trị** (không bao gồm dấu ngoặc kép):

```
"client_email": "sheets-writer@form-dang-ky.iam.gserviceaccount.com"
```
👆 Copy phần `sheets-writer@form-dang-ky.iam.gserviceaccount.com` → lưu lại, gọi là **(A)**

```
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEv...rất dài...==\n-----END PRIVATE KEY-----\n"
```
👆 Copy TOÀN BỘ chuỗi từ `-----BEGIN` đến `-----\n` → lưu lại, gọi là **(B)**

### 3e. Tạo Google Spreadsheet mới

1. Vào 👉 **[sheets.google.com](https://sheets.google.com/)**
2. Nhấn **+ Blank spreadsheet** (Bảng tính mới)
3. Đặt tên tuỳ ý (VD: `Đăng ký đạo tràng ABC`)
4. Nhìn lên thanh URL trình duyệt:
   ```
   https://docs.google.com/spreadsheets/d/  1aBcDeFgHiJkLmNoPqRs  /edit
                                             └──── ĐÂY LÀ ID ────┘
   ```
5. Copy phần **ID** → lưu lại, gọi là **(C)**

### 3f. Cấp quyền cho Service Account

1. Trong Google Sheet vừa tạo → nhấn nút **Share** (Chia sẻ, góc trên phải)
2. Trong ô "Add people", paste email **(A)** vào
3. Quyền: chọn **Editor** (Người chỉnh sửa)
4. Bỏ tick "Notify people" (Thông báo)
5. Nhấn **Share** hoặc **Send**

### 3g. Clone code và cài đặt trên máy

Mở **Command Prompt** (`Win + R` → gõ `cmd` → Enter), chạy lần lượt:

```cmd
cd %USERPROFILE%\Desktop
git clone https://github.com/TEN_CUA_BAN/FormDangky.git
cd FormDangky
npm install
copy .env.example .env.local
```

> 💡 Thay `TEN_CUA_BAN` bằng tên GitHub thực của bạn.

### 3h. Điền thông tin vào file `.env.local`

Mở file `.env.local` bằng **Notepad**:
```cmd
notepad .env.local
```

Sửa 3 dòng:

```env
GOOGLE_CLIENT_EMAIL=sheets-writer@form-dang-ky.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...dán toàn bộ chuỗi (B) ở đây...\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=1aBcDeFgHiJkLmNoPqRs
```

Lưu file (`Ctrl + S`), đóng Notepad.

### 3i. Chạy script tự tạo Sheet

```cmd
npx tsx scripts/setup-new-sheet.ts
```

Kết quả mong đợi:
```
🚀 Bắt đầu cài đặt Google Sheet...

  ✅ Tab "cài_đặt" — tạo thành công (7 dữ liệu mẫu)
  ✅ Tab "loại_đăng_ký" — tạo thành công (1 dữ liệu mẫu)
  ✅ Tab "trường_biểu_mẫu" — tạo thành công (6 dữ liệu mẫu)
  ✅ Tab "đăng_ký" — tạo thành công
  ✅ Tab "chi_tiết_đăng_ký" — tạo thành công
  ✅ Tab "nhật_ký" — tạo thành công
  ✅ Tab "danh_mục" — tạo thành công
  ✅ Tab "Tổng hợp đăng ký" — tạo thành công

✅ CÀI ĐẶT HOÀN TẤT!
```

### 3j. Test thử trên máy (tuỳ chọn)

```cmd
npm run dev
```

Mở trình duyệt → vào **http://localhost:3000** → thấy trang đăng ký với form mẫu.

Nhấn `Ctrl + C` trong Command Prompt để tắt.

---

## BƯỚC 4 — Đưa website lên Vercel (trực tuyến)

### 4a. Đăng nhập Vercel

1. Vào 👉 **[vercel.com](https://vercel.com/)**
2. Nhấn **Sign Up** → **Continue with GitHub**
3. Cấp quyền cho Vercel truy cập GitHub

### 4b. Import dự án

1. Nhấn **Add New** → **Project**
2. Tìm repo **FormDangky** trong danh sách → nhấn **Import**

### 4c. Thêm biến môi trường

Cuộn xuống phần **Environment Variables**, thêm lần lượt 3 biến:

| Ô **Name** (gõ chính xác) | Ô **Value** (paste giá trị) |
|---|---|
| `GOOGLE_CLIENT_EMAIL` | Giá trị **(A)** — email Service Account |
| `GOOGLE_PRIVATE_KEY` | Giá trị **(B)** — chuỗi dài bao gồm `-----BEGIN...` |
| `GOOGLE_SPREADSHEET_ID` | Giá trị **(C)** — ID Google Sheet |

> 💡 Mỗi biến: gõ tên vào ô Name → paste giá trị vào ô Value → nhấn **Add**

### 4d. Deploy

1. Nhấn **Deploy**
2. Chờ 1–2 phút (Vercel đang build)
3. ✅ Khi thấy **"Congratulations!"** → website đã lên mạng!
4. Nhấn vào link để xem: VD `form-dang-ky.vercel.app`

### 4e. Bật tự động cập nhật theo bản gốc (cài 1 lần, chạy mãi mãi)

Khi bản gốc có cập nhật (sửa lỗi, thêm tính năng), fork của bạn sẽ **tự động cập nhật** — không cần làm gì!

**Cài đặt 1 lần:**
1. Mở repo fork của bạn trên GitHub: `github.com/TEN_CUA_BAN/FormDangky`
2. Nhấn tab **Actions** (phía trên)
3. Nếu thấy nút **"I understand my workflows, go ahead and enable them"** → nhấn vào
4. ✅ Xong! Hệ thống sẽ tự kiểm tra mỗi ngày lúc 9:00 sáng (giờ VN):
   - Nếu bản gốc có thay đổi → fork tự cập nhật → Vercel tự deploy lại
   - Nếu không có gì mới → không làm gì

> 💡 Bạn cũng có thể chạy thủ công: tab **Actions** → **"🔄 Tự động cập nhật từ bản gốc"** → **Run workflow** → **Run workflow**

> ⚠️ **Dữ liệu Google Sheet không bị ảnh hưởng** — chỉ code website được cập nhật.

---

## 🎉 HOÀN THÀNH!

Website đăng ký của bạn đã hoạt động. Bây giờ bạn có thể:

### ✏️ Tuỳ biến nội dung (trên Google Sheet, không cần code)

| Muốn làm gì | Sửa tab nào |
|---|---|
| Đổi tiêu đề, phụ đề trang chủ | `cài_đặt` |
| Thêm/sửa/xoá loại form | `loại_đăng_ký` |
| Thêm/sửa trường trong form | `trường_biểu_mẫu` |
| Thêm video hướng dẫn cho form | `loại_đăng_ký` → cột I |
| Mở/đóng đăng ký | `cài_đặt` → dòng `registration_open` |

> 🔄 Sau khi sửa Sheet, web tự cập nhật — **không cần deploy lại!**

### 📊 Xem kết quả đăng ký

- Mỗi form tự tạo tab kết quả: `KQ_{tên form}`
- Tab `Tổng hợp đăng ký` chứa tất cả

### 🎬 Thêm video hướng dẫn cho mỗi form

1. Mở video YouTube muốn nhúng
2. Nhấn **Share** → **Embed** → copy phần `src="https://www.youtube.com/embed/..."`
3. Paste link embed vào **cột I** của tab `loại_đăng_ký`
4. Video sẽ hiện trên trang form cho người dùng xem

---

## ❓ XỬ LÝ LỖI THƯỜNG GẶP

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `node` không nhận lệnh | Chưa cài Node.js hoặc chưa mở lại CMD | Cài Node.js (Bước 1a), mở CMD mới |
| `git` không nhận lệnh | Chưa cài Git hoặc chưa mở lại CMD | Cài Git (Bước 1b), mở CMD mới |
| `npm install` báo lỗi | Chưa `cd` vào thư mục dự án | Kiểm tra `cd FormDangky` |
| Script setup báo "Permission" | Chưa share Sheet cho Service Account | Xem lại Bước 3f |
| Script setup báo "API not enabled" | Chưa bật Sheets API | Xem lại Bước 3b |
| Vercel hiện trang trắng/500 | Sai biến môi trường | Kiểm tra 3 biến trong Vercel Settings |
| Không thấy form trên web | Sheet chưa có dữ liệu | Chạy lại `npx tsx scripts/setup-new-sheet.ts` |

---

## 📎 PHỤ LỤC — Hướng dẫn cho macOS

Các bước tương tự, thay thế:

| Windows | macOS |
|---|---|
| **Command Prompt** (`cmd`) | **Terminal** (tìm trong Launchpad) |
| `copy .env.example .env.local` | `cp .env.example .env.local` |
| `notepad .env.local` | `open -e .env.local` hoặc `nano .env.local` |
| `cd %USERPROFILE%\Desktop` | `cd ~/Desktop` |
| Cài Node.js: tải `.msi` | Tải `.pkg` hoặc `brew install node` |
| Cài Git: tải từ git-scm.com | Thường có sẵn, hoặc `xcode-select --install` |

Các bước còn lại (Fork, Google Cloud, Vercel) **giống hệt nhau** trên cả 2 hệ điều hành.

---

> 💡 Mỗi bản nhân bản là **hoàn toàn độc lập** — code riêng, dữ liệu riêng, website riêng, tài khoản riêng.

© 2026 — Hệ thống đăng ký đa năng 🙏
