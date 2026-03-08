# 🙏 Form Đăng Ký Đa Năng — Dynamic Registration System

Hệ thống đăng ký trực tuyến, tuỳ biến hoàn toàn qua **Google Sheet** — không cần sửa code.

## ✨ Tính năng chính

- **Nhiều loại form đăng ký** — mỗi form là 1 link riêng (`/dang-ky/{mã}`)
- **Phân nhóm cha-con** — VD: "An vị lô hương" → click vào chọn trường hợp
- **7 loại trường nhập liệu:** text, textarea, select, checkbox, multichoice, number, repeatable
- **Kết quả tách sheet riêng** — mỗi form → 1 tab `KQ_{tên form}`
- **Tuỳ chọn cột riêng/gom chung** — admin chọn trường nào ra cột riêng
- **Mobile-first**, responsive, auto-save draft
- **Tra cứu đăng ký lại** bằng SĐT
- **Video hướng dẫn** nhúng trên trang chủ

## 🛠 Tech Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Google Sheets API** (database)
- **Vercel** (hosting miễn phí)
- **shadcn/ui** + Vanilla CSS

---

# 📖 HƯỚNG DẪN NHÂN BẢN DỰ ÁN

> Dành cho người muốn tạo hệ thống đăng ký riêng cho đạo tràng/nhóm/tổ chức của mình.

## Bước 1: Fork/Clone code

```bash
# Cách 1: Fork trên GitHub
# Vào https://github.com/Hoanq1003/FormDangky → Fork

# Cách 2: Clone trực tiếp
git clone https://github.com/Hoanq1003/FormDangky.git my-form
cd my-form
npm install
```

## Bước 2: Tạo Google Cloud Project + Service Account

### 2.1 Tạo Project
1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới → đặt tên (VD: `form-dang-ky`)
3. Bật **Google Sheets API**: Menu → APIs & Services → Library → tìm "Google Sheets API" → **Enable**

### 2.2 Tạo Service Account (tài khoản máy)
1. Menu → IAM & Admin → Service Accounts → **Create Service Account**
2. Đặt tên: `sheets-writer`
3. Bỏ qua vai trò → Done
4. Click vào tài khoản vừa tạo → tab **Keys** → Add Key → Create New Key → **JSON**
5. **Tải file JSON về** — file này chứa `client_email` và `private_key`

## Bước 3: Tạo Google Spreadsheet

### 3.1 Tạo Spreadsheet mới
1. Vào [Google Sheets](https://sheets.google.com/) → tạo file mới
2. Copy **Spreadsheet ID** từ URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_Ở_ĐÂY/edit`

### 3.2 Share cho Service Account
1. Mở file JSON đã tải → copy giá trị `client_email` (VD: `sheets-writer@project.iam.gserviceaccount.com`)
2. Trong Google Sheet → **Share** → paste email đó → quyền **Editor** → Send

### 3.3 Tạo các tab (tự động hoặc thủ công)

**Cách nhanh — chạy script tự động:**
```bash
# Sau khi cấu hình .env.local (bước 4), chạy:
npx tsx scripts/standardize-headers.ts
```

**Cách thủ công — tạo 7 tab với tên chính xác:**

| Tab | Mục đích |
|---|---|
| `settings` | Cài đặt chung (tiêu đề, video, đóng/mở đăng ký) |
| `registration_types` | Các loại form đăng ký |
| `form_fields` | Các trường của mỗi form |
| `submissions` | Dữ liệu đăng ký (hệ thống ghi) |
| `submission_items` | Chi tiết từng mục (hệ thống ghi) |
| `audit_logs` | Lịch sử thao tác (hệ thống ghi) |
| `Tổng hợp đăng ký` | Tổng hợp dễ đọc (hệ thống ghi) |

## Bước 4: Cấu hình biến môi trường

```bash
cp .env.example .env.local
```

Mở `.env.local` và điền:

```env
GOOGLE_CLIENT_EMAIL=sheets-writer@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=abc123xyz
ADMIN_PASSWORD=matkhau_admin
```

> **Lưu ý:** `GOOGLE_PRIVATE_KEY` copy nguyên từ file JSON, giữ nguyên `\n`.

## Bước 5: Chạy thử local

```bash
npm run dev
# Mở http://localhost:3000
```

## Bước 6: Deploy lên Vercel (miễn phí)

1. Push code lên GitHub repository của bạn
2. Vào [vercel.com](https://vercel.com/) → **Import Project** từ GitHub
3. Thêm **Environment Variables** (giống `.env.local`):
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_SPREADSHEET_ID`
   - `ADMIN_PASSWORD`
4. Click **Deploy** → chờ 1-2 phút

> Mỗi lần push code mới lên GitHub, Vercel sẽ tự deploy lại.

---

# 🎨 HƯỚNG DẪN TUỲ BIẾN QUA GOOGLE SHEET

## Tab `settings` — Cài đặt chung

| Khoá cài đặt | Giá trị | Ý nghĩa |
|---|---|---|
| `landing_title` | Đăng Ký Cầu Siêu | Tiêu đề trang chủ |
| `landing_subtitle` | Xem video hướng dẫn... | Phụ đề trang chủ |
| `video_url` | https://youtube.com/embed/xxx | Link video hướng dẫn nhúng |
| `registration_open` | TRUE / FALSE | Mở/đóng đăng ký |
| `registration_close_message` | Đăng ký đã đóng... | Thông báo khi đóng |
| `next_registration_date` | 15/04/2026 | Ngày mở đợt tiếp |
| `landing_notes` | Dòng 1\nDòng 2 | Lưu ý trên trang chủ (mỗi dòng = 1 mục) |

## Tab `registration_types` — Các loại form

| Cột | Ý nghĩa | VD |
|---|---|---|
| **A - Mã loại** | Mã để tạo link (không dấu) | `cau_sieu` |
| **B - Tên hiển thị** | Tên button trên trang chủ | `Đăng ký Cầu Siêu` |
| **C - Mô tả ngắn** | Dòng phụ dưới tên | `Đăng ký danh sách cầu siêu` |
| **D - Icon** | Emoji | 🙏 |
| **E - Đang mở** | TRUE/FALSE | `TRUE` |
| **F - Thứ tự** | Số (nhỏ hiện trước) | `1` |
| **G - Mã form** | Khớp với form_fields | `cau_sieu` |
| **H - Thuộc nhóm cha** | Mã loại cha (trống = root) | *(trống)* hoặc `AVLH` |

### Tạo loại đơn giản (1 dòng):
```
cau_sieu | Đăng ký Cầu Siêu | Mô tả | 🙏 | TRUE | 1 | cau_sieu |
```

### Tạo nhóm có trường hợp con (1 cha + N con):
```
AVLH     | Đăng ký AVLH      |       | 📋 | TRUE | 2 |          |         ← cha (Mã form TRỐNG)
avlh_th1 | Trường hợp 1      |       | 🔥 | TRUE | 1 | avlh_th1 | AVLH    ← con
avlh_th2 | Trường hợp 2      |       | 🔥 | TRUE | 2 | avlh_th2 | AVLH    ← con
```

> **Link trực tiếp:** `your-domain.vercel.app/dang-ky/{Mã loại}`

## Tab `form_fields` — Các trường trong form

| Cột | Ý nghĩa | VD |
|---|---|---|
| **A - Mã form** | Khớp cột G của registration_types | `avlh_th1` |
| **B - Nhóm** | Tên section gom trường | `Thông tin` |
| **C - Mã trường** | Mã lưu dữ liệu (không dấu) | `hoTen` |
| **D - Tên trường** | Nhãn hiển thị cho người dùng | `Họ tên` |
| **E - Loại trường** | Kiểu input | `text` |
| **F - Bắt buộc** | TRUE/FALSE | `TRUE` |
| **G - Gợi ý nhập** | Placeholder | `VD: Nguyễn Văn A` |
| **H - Các lựa chọn** | Dùng cho select/multichoice, ngăn `\|` | `A\|B\|C` |
| **I - Thứ tự** | Số (nhỏ hiện trước) | `1` |
| **J - Ghi chú trường** | Text nhỏ dưới input | `Theo âm lịch` |
| **K - Cột riêng** | TRUE = cột riêng trong sheet KQ | `TRUE` |

### Các loại trường hỗ trợ:

| Loại | Hiển thị | Cần cột H? |
|---|---|---|
| `text` | Ô nhập 1 dòng | Không |
| `textarea` | Ô nhập nhiều dòng | Không |
| `number` | Ô nhập số | Không |
| `select` | Dropdown (chọn 1) | ✅ VD: `Loại A\|Loại B` |
| `multichoice` | Nhiều checkbox (chọn nhiều) | ✅ VD: `Phật\|Chư Thiên\|Gia tiên` |
| `checkbox` | 1 ô check Có/Không | Không |

### Tuỳ chọn kết quả Sheet (cột K):

| K = | Kết quả trong sheet `KQ_{form}` |
|---|---|
| **TRUE** | Trường → cột riêng (VD: "Họ tên" 1 cột) |
| **FALSE**/trống | Trường → gom vào cột "Chi tiết" |

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
│   └── submit-dynamic.ts       # Gửi các form tuỳ biến
├── components/
│   ├── RegistrationWizard.tsx   # Điều phối toàn bộ flow
│   └── screens/                 # Các màn hình wizard
├── lib/sheets/
│   ├── client.ts               # Kết nối Google Sheets
│   └── helpers.ts              # Đọc/ghi dữ liệu
└── scripts/
    └── standardize-headers.ts  # Chuẩn hoá headers tiếng Việt
```

---

# ❓ FAQ

**Q: Thêm form mới có cần sửa code không?**
→ **Không.** Chỉ thêm dòng trong Google Sheet `registration_types` + `form_fields`.

**Q: Mỗi form có link riêng không?**
→ **Có.** Link = `your-domain/dang-ky/{Mã loại}` (cột A của registration_types).

**Q: Kết quả lưu ở đâu?**
→ Mỗi form → tab `KQ_{tên form}` trong Google Sheet. Song song đó có `Tổng hợp đăng ký`.

**Q: Đổi text, icon, mô tả trang chủ?**
→ Sửa tab `settings` trong Sheet. Web tự cập nhật, không cần deploy lại.

**Q: Nhiều người dùng chung hệ thống?**
→ Mỗi người tạo Google Sheet riêng, cấu hình biến môi trường riêng, deploy Vercel riêng.

---

© 2026 — Hệ thống đăng ký đa năng. 🙏
