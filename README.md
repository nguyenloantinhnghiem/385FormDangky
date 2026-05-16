# 🙏 Form Đăng Ký Đa Năng — Dynamic Registration System

Hệ thống đăng ký trực tuyến, tuỳ biến hoàn toàn qua **Google Sheet** — không cần sửa code.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Hoanq1003/FormDangky&env=GOOGLE_CLIENT_EMAIL,GOOGLE_PRIVATE_KEY,GOOGLE_SPREADSHEET_ID&envDescription=Cần%203%20biến%20từ%20Google%20Cloud%20%2B%20Sheet.%20Xem%20hướng%20dẫn%20README.&project-name=form-dang-ky)

## ✨ Tính năng chính

- **Nhiều loại form đăng ký** — mỗi form là 1 link riêng (`/dang-ky/{mã}`)
- **Phân nhóm cha-con** — VD: "An vị lô hương" → click vào chọn trường hợp
- **Nhiều loại trường nhập liệu:** text, textarea, select, checkbox, multichoice, number, group, block, image, signature
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

### Cập nhật fork khi dự án gốc có phiên bản mới

Khi repo gốc `Hoanq1003/FormDangky` có cập nhật mới, người đã fork có thể đồng bộ về fork của mình.

**Cách nhanh trên GitHub:**
1. Mở repo fork của bạn: `github.com/YOUR_USERNAME/FormDangky`
2. Vào tab **Code**
3. Nhấn **Sync fork** → **Update branch**
4. Nếu repo fork đang kết nối Vercel, Vercel sẽ tự deploy lại sau khi sync xong.

**Nếu không thấy nút Sync fork:**

Nút này chỉ hiện khi GitHub nhận repo của bạn là một **fork thật** của `Hoanq1003/FormDangky`. Nếu bạn tạo repo bằng nút **Deploy with Vercel**, import, upload code, hoặc tạo repo mới rồi copy code vào, GitHub có thể không xem đó là fork nên sẽ không hiện **Sync fork**.

Bạn vẫn có thể đồng bộ bằng workflow có sẵn trong repo:
1. Mở repo của bạn trên GitHub
2. Vào tab **Actions**
3. Nếu GitHub hỏi, nhấn **I understand my workflows, go ahead and enable them**
4. Chọn workflow **Đồng bộ từ repo gốc**
5. Nhấn **Run workflow** → giữ `target_branch` là `main` → **Run workflow**

Nếu workflow báo lỗi quyền push, vào **Settings** → **Actions** → **General** → **Workflow permissions**, chọn **Read and write permissions**, lưu lại rồi chạy workflow lần nữa.

Nếu repo của bạn chưa có workflow **Đồng bộ từ repo gốc**, hãy dùng phần dòng lệnh bên dưới để sync một lần. Sau lần sync đó, workflow sẽ xuất hiện trong tab **Actions** cho các lần cập nhật sau.

**Nếu GitHub báo conflict hoặc muốn dùng dòng lệnh:**
```bash
cd FormDangky
git remote add upstream https://github.com/Hoanq1003/FormDangky.git
git fetch upstream
git checkout main
git merge upstream/main --allow-unrelated-histories
git push origin main
```

> Nếu đã thêm `upstream` trước đó và bị báo `remote upstream already exists`, bỏ qua dòng `git remote add upstream ...`.
> Nếu repo được tạo bằng Vercel/import/copy code, tuỳ chọn `--allow-unrelated-histories` giúp Git cập nhật được dù GitHub không xem repo đó là fork thật.

**Nếu đã cài GitHub CLI (`gh`):**
```bash
gh repo sync YOUR_USERNAME/FormDangky -b main
```

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
| **H** | Các lựa chọn hoặc mã `group`/`block` cha | `A\|B\|C` |
| **I** | Thứ tự | `1` |
| **J** | Ghi chú | `Theo âm lịch` |
| **K** | Cột riêng trong KQ | `TRUE` |
| **L** | Điều kiện hiện | `nghiep_chon=X` |
| **M** | Màu sắc cho tên trường, `block`, `group`, `notice`, `heading` | `blue` |
| **N** | Chữ nút xác nhận cho `reading` | `Tôi đồng ý tham gia` |
| **O** | Chữ nút khi chưa cuộn hết `reading` | `Đọc hết nội dung để xác nhận` |
| **P** | Chữ sau khi đã xác nhận `reading` | `Đã xác nhận cam kết` |
| **Q** | Mô tả hướng dẫn dưới tiêu đề `reading` | `Vui lòng đọc kỹ phần này.` |

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
| `block` | Khối trường con cố định, không có nút thêm/bớt |
| `khoi` / `khối` | Tên khác của `block` |
| `notice` / `info` / `luu_y` | Hộp thông tin/nhấn mạnh, không ghi dữ liệu |
| `heading` / `title` / `tieu_de` | Tiêu đề phụ có màu, không ghi dữ liệu |
| `reading` / `tai_lieu` / `yeu_cau_doc` / `xac_nhan_cam_ket` | Tài liệu/cam kết bắt buộc đọc xong mới hiện các trường phía sau |
| `image` | Tải ảnh |
| `signature` | Chữ ký |

### Màu sắc và hộp thông tin

Cột **M** có thể điền màu cho tên trường của mọi loại field. Với `block`, `group`, `notice`, `heading`, màu này cũng dùng cho khung/tiêu đề nhấn mạnh. Cột **H** vẫn giữ đúng vai trò là **Các lựa chọn** hoặc mã nhóm cha.

Vị trí hiển thị luôn theo cột **I - Thứ tự**. Nếu muốn `notice`/`heading` hiện ở đầu toàn bộ section, để cột **H** trống và mã trường ở cột **C** là mã độc lập, ví dụ `luu_y_dau_form`. Nếu muốn `notice`/`heading` nằm bên trong một `block`/`group`, cột **C** có thể ghi dạng `ma_block.luu_y` hoặc cột **H** ghi mã `block/group` cha; khi đó thứ tự được tính trong chính khối đó.

| Màu | Cách ghi ở cột M |
|---|---|
| Vàng/cảnh báo | `amber`, `vang`, `warning` |
| Xanh dương/thông tin | `blue`, `xanh_duong`, `info` |
| Xanh lá/thành công | `emerald`, `green`, `xanh_la`, `success` |
| Tím | `purple`, `tim` |
| Đỏ/quan trọng | `rose`, `red`, `do`, `danger` |
| Xanh ngọc | `teal`, `ngoc` |
| Xám/trung tính | `stone`, `gray`, `xam` |

Ví dụ tạo hộp nhấn mạnh:

| A | B | C | D | E | G | H | I | J | M |
|---|---|---|---|---|---|---|---|---|---|
| `mau_form` | `Hướng dẫn` | `luu_y_truoc_khi_dang_ky` | `Lưu ý trước khi đăng ký` | `notice` | `Vui lòng chuẩn bị đầy đủ thông tin trước khi gửi.` | | `1` | `Thông tin đã gửi sẽ được lưu vào Google Sheet.` | `blue` |

Ví dụ tạo tiêu đề phụ:

| A | B | C | D | E | G | H | I | M |
|---|---|---|---|---|---|---|---|---|
| `mau_form` | `Nội dung` | `tieu_de_phap_hoi` | `Thông tin tham dự pháp hội` | `heading` | `Các mục bên dưới dùng để ban tổ chức sắp xếp chỗ ngồi.` | | `2` | `emerald` |

### Tài liệu bắt buộc đọc trước khi điền form

Dùng loại trường `reading` nếu muốn người đăng ký phải đọc xong tài liệu/thông tin/quy định rồi mới thấy các trường phía sau. Trường này không ghi dữ liệu vào kết quả.

| Cột | Cách ghi |
|---|---|
| **C** | Mã trường, ví dụ `quy_dinh_truoc_khi_dang_ky` |
| **D** | Tiêu đề tài liệu |
| **E** | `reading`, `tai_lieu`, `yeu_cau_doc`, `doc_bat_buoc`, `quy_dinh`, `cam_ket`, `xac_nhan_cam_ket` |
| **G** | Nội dung chính cần đọc |
| **J** | Nội dung bổ sung, có thể dùng Markdown |
| **I** | Thứ tự; các trường có thứ tự phía sau sẽ ẩn cho đến khi đọc và xác nhận xong |
| **M** | Màu hiển thị, ví dụ `blue`, `amber`, `rose` |
| **N** | Chữ trên nút xác nhận; bỏ trống sẽ dùng mặc định |
| **O** | Chữ trên nút khi người đăng ký chưa cuộn hết nội dung |
| **P** | Chữ trạng thái sau khi đã xác nhận |
| **Q** | Dòng mô tả nhỏ dưới tiêu đề tài liệu/cam kết |

Ví dụ:

| A | B | C | D | E | G | H | I | J | M | N | O | P | Q |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `mau_form` | `Hướng dẫn` | `quy_dinh_doc_truoc` | `Quy định trước khi đăng ký` | `reading` | `Vui lòng đọc kỹ quy định trước khi nhập thông tin.` | | `1` | `**Cam kết:** thông tin đăng ký là chính xác.` | `amber` | `Tôi đồng ý với quy định này` | `Đọc hết quy định để xác nhận` | `Đã đồng ý quy định` | `Bạn cần xác nhận trước khi điền thông tin.` |

Nếu đặt `reading` trong `block` hoặc `group`, các trường phía sau trong khối đó và các trường phía sau khối cũng sẽ tạm ẩn cho đến khi người đăng ký xác nhận đã đọc.

### In đậm, in nghiêng trong nội dung hướng dẫn

Các cột **G** và **J** có thể dùng Markdown nhẹ cho `notice`, `heading`, `reading` và ghi chú dưới trường nhập:

| Muốn hiển thị | Cách ghi |
|---|---|
| In đậm | `**Nội dung quan trọng**` |
| In nghiêng | `*Nội dung cần lưu ý*` |
| Vừa đậm vừa nghiêng | `***Nội dung rất quan trọng***` |
| Danh sách gạch đầu dòng | Mỗi dòng bắt đầu bằng `- ` |

Ví dụ cột **J**:

```text
**Lưu ý quan trọng**
- Mang theo CCCD khi đến nhận thẻ.
- *Thông tin sai có thể bị từ chối.*
```

### Khối điều kiện và điều kiện trong nhóm

**`block`** dùng khi muốn chọn một mục rồi hiện cả một khối trường con, nhưng không cho người dùng bấm thêm nhiều dòng như `group`.

Ví dụ: chọn "Loại A" thì hiện khối "Thông tin loại A":

| A | B | C | D | E | H | I | L | M |
|---|---|---|---|---|---|---|---|---|
| `mau_form` | `Đăng ký` | `loai_dang_ky` | `Loại đăng ký` | `select` | `Loại A\|Loại B` | `1` | | |
| `mau_form` | `Đăng ký` | `khoi_loai_a` | `Thông tin loại A` | `block` | | `2` | `loai_dang_ky=Loại A` | `amber` |
| `mau_form` | `Đăng ký` | `khoi_loai_a.hinh_thuc` | `Hình thức` | `select` | `Một lần\|Nhiều lần` | `3` | | |
| `mau_form` | `Đăng ký` | `khoi_loai_a.so_lan` | `Số lần` | `number` | | `4` | `hinh_thuc=Nhiều lần` | |

Trong `block` hoặc `group`, cột **L** có thể tham chiếu field nội bộ bằng `mã_field_con=giá_trị` như `hinh_thuc=Nhiều lần`. Nếu field con cũng cần lựa chọn ở cột H, đặt mã field theo dạng `mã_block.mã_field_con` hoặc `mã_group.mã_field_con`.

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
