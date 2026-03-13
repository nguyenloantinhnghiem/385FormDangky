# 📖 HƯỚNG DẪN NHÂN BẢN HỆ THỐNG (Cho người không biết code)

> ⏱ Thời gian: ~15 phút | Miễn phí 100%

---

## 📋 Cần chuẩn bị 3 tài khoản (miễn phí)

| Tài khoản | Đăng ký tại | Dùng để |
|---|---|---|
| **Gmail** | [accounts.google.com](https://accounts.google.com) | Lưu trữ dữ liệu (Google Sheet) |
| **GitHub** | [github.com/signup](https://github.com/signup) | Lưu bản code riêng |
| **Vercel** | [vercel.com/signup](https://vercel.com/signup) | Chạy website (dùng GitHub đăng nhập) |

---

## Bước 1 — Fork code (1 phút)

1. Đăng nhập GitHub
2. Mở link: **github.com/Hoanq1003/FormDangky**
3. Nhấn nút **Fork** (góc trên phải)
4. Nhấn **Create fork**
5. ✅ Xong — bạn đã có bản code riêng

---

## Bước 2 — Tạo "chìa khoá" Google (8 phút)

### 2a. Vào Google Cloud Console
- Mở: **console.cloud.google.com**
- Nhấn **Select a project** → **New Project**
- Đặt tên: `form-dang-ky` → **Create**

### 2b. Bật Google Sheets API
- Menu trái → **APIs & Services** → **Library**
- Tìm: **Google Sheets API**
- Nhấn **Enable**

### 2c. Tạo Service Account (tài khoản máy)
- Menu trái → **IAM & Admin** → **Service Accounts**
- Nhấn **Create Service Account**
- Name: `sheets-writer` → **Done**
- Nhấn vào tên `sheets-writer` vừa tạo
- Tab **Keys** → **Add Key** → **Create New Key** → chọn **JSON** → **Create**
- 📥 File JSON sẽ tự tải về máy

### 2d. Lấy thông tin từ file JSON
Mở file JSON vừa tải, tìm 2 dòng:
```
"client_email": "sheets-writer@xxx.iam.gserviceaccount.com"   ← GHI LẠI
"private_key": "-----BEGIN PRIVATE KEY-----\n..."              ← GHI LẠI
```

---

## Bước 3 — Tạo Google Sheet (3 phút)

### 3a. Copy Sheet mẫu
- Mở link Sheet mẫu (admin cung cấp)
- Nhấn **File** → **Make a copy** → **Make a copy**
- ✅ Bạn đã có Sheet riêng với đầy đủ cấu trúc

> **Nếu không có link mẫu:** Tạo Sheet mới tại [sheets.google.com](https://sheets.google.com), rồi chạy script cài đặt (xem README.md).

### 3b. Lấy Sheet ID
- Nhìn thanh URL: `docs.google.com/spreadsheets/d/` **abc123xyz** `/edit`
- Copy phần **abc123xyz** ← đây là Sheet ID

### 3c. Share cho Service Account
- Trong Google Sheet → nhấn **Share** (góc trên phải)
- Paste email: `sheets-writer@xxx.iam.gserviceaccount.com` (từ bước 2d)
- Chọn quyền: **Editor**
- Nhấn **Send**

---

## Bước 4 — Deploy website (2 phút)

### 4a. Mở Vercel
- Vào **vercel.com** → đăng nhập bằng GitHub
- Nhấn **Add New** → **Project**
- Chọn repo **FormDangky** → **Import**

### 4b. Thêm 3 biến môi trường
Trong phần **Environment Variables**, thêm:

| Name | Value |
|---|---|
| `GOOGLE_CLIENT_EMAIL` | Email từ bước 2d (sheets-writer@...) |
| `GOOGLE_PRIVATE_KEY` | Khoá từ bước 2d (chuỗi dài -----BEGIN...) |
| `GOOGLE_SPREADSHEET_ID` | Sheet ID từ bước 3b |

### 4c. Deploy
- Nhấn **Deploy**
- Chờ 1-2 phút
- ✅ **Xong!** Vercel cho bạn 1 link website (VD: `form-dang-ky.vercel.app`)

---

## 🎉 Sau khi xong

1. Mở link website Vercel → thấy trang đăng ký với form mẫu
2. Thử đăng ký test → dữ liệu xuất hiện trong Google Sheet
3. Tuỳ biến form: sửa trực tiếp trên Google Sheet, web tự cập nhật

### Các tab cần biết trong Google Sheet:

| Tab | Sửa gì |
|---|---|
| `cài_đặt` | Tiêu đề, phụ đề, video, đóng/mở đăng ký |
| `loại_đăng_ký` | Thêm/sửa/xoá các loại form |
| `trường_biểu_mẫu` | Thêm/sửa trường nhập liệu cho mỗi form |

> 💡 **Không cần sửa code!** Mọi thay đổi chỉ trên Google Sheet.

---

## ❓ Gặp lỗi?

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| Trang trắng / lỗi 500 | Thiếu biến môi trường | Kiểm tra 3 biến trên Vercel |
| "Unable to read sheet" | Chưa share Sheet | Share Sheet cho Service Account email |
| Không thấy form | Sheet trống | Thêm dòng vào tab `loại_đăng_ký` |
