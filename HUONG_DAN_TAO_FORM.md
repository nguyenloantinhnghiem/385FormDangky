# 📝 HƯỚNG DẪN TẠO FORM ĐĂNG KÝ

> Tất cả thao tác chỉ trên **Google Sheet** — không cần sửa code!

---

## 1. TẠO FORM MỚI

Mở Google Sheet → tab **`loại_đăng_ký`** → thêm 1 dòng mới:

| Cột | Tên cột | Điền gì | Ví dụ |
|---|---|---|---|
| **A** | Mã loại | Mã không dấu, không khoảng trắng | `tu_bai_8` |
| **B** | Tên hiển thị | Tên nút trên trang chủ | `Đăng ký tu Bài 8` |
| **C** | Mô tả ngắn | Dòng phụ dưới tên | `Đăng ký tu tập bài 8` |
| **D** | Icon | 1 emoji | `📿` |
| **E** | Đang mở | TRUE hoặc FALSE | `TRUE` |
| **F** | Thứ tự | Số (nhỏ hiện trước) | `1` |
| **G** | Mã form | Trùng với cột A | `tu_bai_8` |
| **H** | Nhóm cha | Để trống (form độc lập) | *(trống)* |
| **I** | Video | Link YouTube embed (tuỳ chọn) | `https://www.youtube.com/embed/...` |

✅ Sau khi thêm → web tự hiện form mới trên trang chủ.

**Link trực tiếp đến form:** `your-site.vercel.app/dang-ky/tu_bai_8` (dùng mã cột A)

---

## 2. THÊM TRƯỜNG CHO FORM

Mở tab **`trường_biểu_mẫu`** → thêm các dòng, mỗi dòng = 1 trường:

| Cột | Tên | Điền gì | Ví dụ |
|---|---|---|---|
| **A** | Mã form | Trùng cột G bên `loại_đăng_ký` | `tu_bai_8` |
| **B** | Nhóm | Tên section gom trường | `Thông tin cá nhân` |
| **C** | Mã trường | Mã không dấu | `ho_ten` |
| **D** | Tên trường | Nhãn hiển thị | `Họ tên` |
| **E** | Loại trường | Xem bảng bên dưới | `text` |
| **F** | Bắt buộc | TRUE / FALSE | `TRUE` |
| **G** | Gợi ý | Placeholder | `VD: Nguyễn Văn A` |
| **H** | Lựa chọn / nhóm cha | Ngăn bởi `\|`, hoặc mã `group`/`block` cha | `Nam\|Nữ` |
| **I** | Thứ tự | Số | `1` |
| **J** | Ghi chú | Text nhỏ dưới input | `Ghi theo CCCD` |
| **K** | Cột riêng | TRUE = cột riêng trong kết quả | `TRUE` |
| **L** | Điều kiện hiện | `mã_trường=giá_trị` | `loai=Loại A` |
| **M** | Màu sắc | Màu cho tên trường, `block`/`group`/`notice`/`heading` | `blue` |

---

## 3. CÁC LOẠI TRƯỜNG

| Loại (cột E) | Hiển thị | Cần cột H? |
|---|---|---|
| `text` | Ô nhập 1 dòng | Không |
| `textarea` | Ô nhập nhiều dòng | Không |
| `number` | Ô nhập số | Không |
| `select` | Dropdown chọn 1 | ✅ `Chọn A\|Chọn B\|Chọn C` |
| `radio` | Nút tròn chọn 1 | ✅ `Có\|Không` |
| `multichoice` | Checkbox chọn nhiều | ✅ `A\|B\|C` |
| `checkbox` | 1 ô check Có/Không | Không |
| `group` | Nhóm lặp lại (thêm/bớt) | Không |
| `block` | Khối trường con cố định, không thêm/bớt | Không |
| `khoi` / `khối` | Tên khác của `block` | Không |
| `notice` / `info` / `luu_y` | Hộp thông tin/nhấn mạnh, không ghi dữ liệu | Không |
| `heading` / `title` / `tieu_de` | Tiêu đề phụ có màu, không ghi dữ liệu | Không |
| `reading` / `tai_lieu` / `yeu_cau_doc` / `xac_nhan_cam_ket` | Tài liệu/cam kết bắt buộc đọc xong mới hiện trường phía sau | Không |
| `image` | Tải ảnh | Không |
| `signature` | Chữ ký | Không |

---

## 4. VÍ DỤ THỰC TẾ

### Form đơn giản: "Đăng ký khóa tu"

**Tab `loại_đăng_ký`:**

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| khoa_tu | Đăng ký Khóa Tu | Khóa tu mùa hè 2026 | 🧘 | TRUE | 1 | khoa_tu |

**Tab `trường_biểu_mẫu`:**

| A | B | C | D | E | F | G | H | I | K |
|---|---|---|---|---|---|---|---|---|---|
| khoa_tu | Thông tin | ho_ten | Họ tên | text | TRUE | VD: Nguyễn Văn A | | 1 | TRUE |
| khoa_tu | Thông tin | gioi_tinh | Giới tính | radio | TRUE | | Nam\|Nữ | 2 | TRUE |
| khoa_tu | Thông tin | tuoi | Tuổi | number | TRUE | VD: 30 | | 3 | TRUE |
| khoa_tu | Đăng ký | loai_phong | Loại phòng | select | TRUE | | Phòng đơn\|Phòng đôi\|Phòng tập thể | 4 | TRUE |
| khoa_tu | Đăng ký | an_chay | Ăn chay | checkbox | FALSE | | | 5 | FALSE |
| khoa_tu | Ghi chú | ghi_chu | Ghi chú thêm | textarea | FALSE | Nếu có yêu cầu đặc biệt... | | 6 | FALSE |

**Kết quả:** Form có 3 section (Thông tin, Đăng ký, Ghi chú) với 6 trường.

---

## 5. TÍNH NĂNG NÂNG CAO

### 5a. Màu sắc, tiêu đề phụ và hộp nhấn mạnh

Hệ thống tự tô màu cho từng nhóm form. Nếu muốn tự chọn màu tên trường hoặc khung nhấn mạnh, điền cột **M** với các giá trị. Cột **H** vẫn là cột **Các lựa chọn** hoặc mã nhóm cha.

Vị trí của `notice`/`heading` chạy theo cột **I - Thứ tự**:

- Muốn hiện ở đầu section: cột **H** để trống, cột **C** dùng mã độc lập như `luu_y_dau_form`.
- Muốn hiện trong `block`/`group`: cột **C** ghi dạng `ma_block.luu_y`, hoặc cột **H** ghi mã `block/group` cha. Khi đó thứ tự được tính trong nội bộ khối.

| Màu muốn dùng | Ghi ở cột M |
|---|---|
| Vàng/cảnh báo | `amber`, `vang`, `warning` |
| Xanh dương/thông tin | `blue`, `xanh_duong`, `info` |
| Xanh lá/thành công | `emerald`, `green`, `xanh_la`, `success` |
| Tím | `purple`, `tim` |
| Đỏ/quan trọng | `rose`, `red`, `do`, `danger` |
| Xanh ngọc | `teal`, `ngoc` |
| Xám/trung tính | `stone`, `gray`, `xam` |

**Hộp thông tin/nhấn mạnh (`notice`)**

| A | B | C | D | E | G | H | I | J | M |
|---|---|---|---|---|---|---|---|---|---|
| mau_form | Hướng dẫn | luu_y_truoc_khi_dang_ky | Lưu ý trước khi đăng ký | **notice** | Vui lòng chuẩn bị đầy đủ thông tin trước khi gửi. | | 1 | Thông tin đã gửi sẽ được lưu vào Google Sheet. | blue |

**Tiêu đề phụ (`heading`)**

| A | B | C | D | E | G | H | I | M |
|---|---|---|---|---|---|---|---|---|
| mau_form | Nội dung | tieu_de_phap_hoi | Thông tin tham dự pháp hội | **heading** | Các mục bên dưới dùng để ban tổ chức sắp xếp chỗ ngồi. | | 2 | emerald |

### 5b. Tài liệu bắt buộc đọc trước khi điền form

Dùng loại trường `reading` nếu muốn người đăng ký phải đọc tài liệu/quy định/cam kết trước. Khi chưa bấm **Tôi xác nhận đã đọc xong và cam kết thực hiện**, các trường có thứ tự phía sau sẽ chưa hiện ra.

| A | B | C | D | E | G | H | I | J | M |
|---|---|---|---|---|---|---|---|---|---|
| mau_form | Hướng dẫn | quy_dinh_doc_truoc | Quy định trước khi đăng ký | **reading** | Vui lòng đọc kỹ toàn bộ quy định trước khi nhập thông tin. | | 1 | **Cam kết:** thông tin đăng ký là chính xác. | amber |

Ghi chú:

- Cột **G** là nội dung chính cần đọc.
- Cột **J** là nội dung bổ sung, có thể xuống dòng và dùng Markdown.
- Cột **I** càng nhỏ thì tài liệu càng hiện sớm.
- Có thể ghi cột **E** là `xac_nhan_cam_ket` nếu muốn gọi rõ đây là phần cam kết.
- Nếu đặt trong `block` hoặc `group`, trường phía sau trong khối và trường phía sau khối cũng bị khóa cho đến khi xác nhận.

### 5c. In đậm, in nghiêng trong đoạn hướng dẫn

Có thể ghi Markdown nhẹ trong cột **G** và **J** cho `notice`, `heading`, `reading`, hoặc ghi chú dưới trường nhập.

| Muốn hiển thị | Ghi trong Google Sheet |
|---|---|
| In đậm | `**Nội dung quan trọng**` |
| In nghiêng | `*Nội dung cần lưu ý*` |
| Vừa đậm vừa nghiêng | `***Nội dung rất quan trọng***` |
| Gạch đầu dòng | Mỗi dòng bắt đầu bằng `- ` |

Ví dụ ghi trong cột **J**:

```text
**Lưu ý trước khi đăng ký**
- Kiểm tra kỹ họ tên và số điện thoại.
- *Nếu nhập sai, ban tổ chức có thể không liên hệ được.*
```

### 5d. Form có nhóm con (cha-con)

VD: "Đăng ký AVLH" → bấm vào → chọn "Trường hợp 1" hoặc "Trường hợp 2"

**Tab `loại_đăng_ký`:**

| A | B | D | E | F | G | H |
|---|---|---|---|---|---|---|
| AVLH | Đăng ký AVLH | 📋 | TRUE | 1 | *(trống)* | *(trống)* |
| avlh_th1 | Trường hợp 1 | 🔥 | TRUE | 1 | avlh_th1 | **AVLH** |
| avlh_th2 | Trường hợp 2 | 🔥 | TRUE | 2 | avlh_th2 | **AVLH** |

> Dòng cha: **cột G trống**, cột H trống
> Dòng con: cột G = mã form, **cột H = mã cha**

### 5c. Nhóm lặp lại (group)

VD: Nhập nhiều nghiệp, mỗi nghiệp có tên + mô tả:

| A | B | C | D | E | H |
|---|---|---|---|---|---|
| shct | Nghiệp | nghiep_list | Danh sách nghiệp | **group** | |
| shct | Nghiệp | nghiep | Tên nghiệp | textarea | **nghiep_list** |
| shct | Nghiệp | hien_tuong | Hiện tượng | textarea | **nghiep_list** |

> Trường con (nghiep, hien_tuong) để **cột H = mã nhóm cha** (`nghiep_list`)

### 5d. Hiện trường theo điều kiện

VD: Chỉ hiện trường "Mô tả" khi chọn nghiệp "TTTS":

| C | D | E | **L** |
|---|---|---|---|
| mo_ta_ttts | Mô tả TTTS | textarea | `nghiep_chon=TTTS` |

> Cột L (Điều kiện hiện): `mã_trường=giá_trị`

### 5e. Khối điều kiện (block)

`block` giống `group` ở chỗ có các trường con, nhưng chỉ có **1 khối cố định** và **không có nút thêm/bớt**. Dùng khi chọn mục A thì hiện cả cụm trường riêng của mục A.

VD: Chọn "Loại A" thì hiện khối gồm "Hình thức" và "Số lần":

| A | B | C | D | E | H | I | L | M |
|---|---|---|---|---|---|---|---|---|
| mau_form | Đăng ký | loai_dang_ky | Loại đăng ký | select | Loại A\|Loại B | 1 | | |
| mau_form | Đăng ký | khoi_loai_a | Thông tin loại A | **block** | | 2 | `loai_dang_ky=Loại A` | amber |
| mau_form | Đăng ký | khoi_loai_a.hinh_thuc | Hình thức | select | Một lần\|Nhiều lần | 3 | | |
| mau_form | Đăng ký | khoi_loai_a.so_lan | Số lần | number | | 4 | `hinh_thuc=Nhiều lần` | |

Ghi chú:
- Field con có thể trỏ về khối cha bằng cách đặt **cột H = mã block**, ví dụ `khoi_loai_a`.
- Nếu field con cũng cần lựa chọn ở cột H, hãy đặt **cột C theo dạng `mã_block.mã_field_con`**, ví dụ `khoi_loai_a.hinh_thuc`.
- Điều kiện trong nội bộ block dùng mã field con, ví dụ `hinh_thuc=Nhiều lần`.

### 5f. Điều kiện hiện bên trong group

Trong `group`, field con cũng dùng được cột **L** theo dữ liệu của từng dòng group.

VD: Trong mỗi dòng "Danh sách nghiệp", chọn loại nghiệp là `TTTS` thì mới hiện ô mô tả TTTS:

| A | B | C | D | E | H | I | L |
|---|---|---|---|---|---|---|---|
| shct | Nghiệp | nghiep_list | Danh sách nghiệp | **group** | | 1 | |
| shct | Nghiệp | nghiep_list.loai_nghiep | Loại nghiệp | select | TTTS\|Khác | 2 | |
| shct | Nghiệp | nghiep_list.mo_ta_ttts | Mô tả TTTS | textarea | | 3 | `loai_nghiep=TTTS` |

---

## 6. XEM KẾT QUẢ

- Mỗi form tự tạo tab kết quả: **`KQ_{tên form}`**
- Trường có **cột K = TRUE** → cột riêng trong sheet kết quả
- Trường có cột K = FALSE → gom chung vào cột "Chi tiết"
