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
| **H** | Lựa chọn | Ngăn bởi dấu `\|` | `Nam\|Nữ` |
| **I** | Thứ tự | Số | `1` |
| **J** | Ghi chú | Text nhỏ dưới input | `Ghi theo CCCD` |
| **K** | Cột riêng | TRUE = cột riêng trong kết quả | `TRUE` |

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

### 5a. Form có nhóm con (cha-con)

VD: "Đăng ký AVLH" → bấm vào → chọn "Trường hợp 1" hoặc "Trường hợp 2"

**Tab `loại_đăng_ký`:**

| A | B | D | E | F | G | H |
|---|---|---|---|---|---|---|
| AVLH | Đăng ký AVLH | 📋 | TRUE | 1 | *(trống)* | *(trống)* |
| avlh_th1 | Trường hợp 1 | 🔥 | TRUE | 1 | avlh_th1 | **AVLH** |
| avlh_th2 | Trường hợp 2 | 🔥 | TRUE | 2 | avlh_th2 | **AVLH** |

> Dòng cha: **cột G trống**, cột H trống
> Dòng con: cột G = mã form, **cột H = mã cha**

### 5b. Nhóm lặp lại (group)

VD: Nhập nhiều nghiệp, mỗi nghiệp có tên + mô tả:

| A | B | C | D | E | H |
|---|---|---|---|---|---|
| shct | Nghiệp | nghiep_list | Danh sách nghiệp | **group** | |
| shct | Nghiệp | nghiep | Tên nghiệp | textarea | **nghiep_list** |
| shct | Nghiệp | hien_tuong | Hiện tượng | textarea | **nghiep_list** |

> Trường con (nghiep, hien_tuong) để **cột H = mã nhóm cha** (`nghiep_list`)

### 5c. Hiện trường theo điều kiện

VD: Chỉ hiện trường "Mô tả" khi chọn nghiệp "TTTS":

| C | D | E | **L** |
|---|---|---|---|
| mo_ta_ttts | Mô tả TTTS | textarea | `nghiep_chon=TTTS` |

> Cột L (Điều kiện hiện): `mã_trường=giá_trị`

---

## 6. XEM KẾT QUẢ

- Mỗi form tự tạo tab kết quả: **`KQ_{tên form}`**
- Trường có **cột K = TRUE** → cột riêng trong sheet kết quả
- Trường có cột K = FALSE → gom chung vào cột "Chi tiết"
