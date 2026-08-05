# Implementation Plan: Cập Nhật Tính Giá Đúc Gang Phần A & B

## 1. Goal Description
Đại tu lại logic và UI của form Tính Giá Đúc (CastingCalculatorForm) để khắc phục 3 lỗi và tối ưu trải nghiệm theo đúng bảng Excel thực tế:
- Sửa lỗi tính sai/hiển thị sai đơn giá gang lỏng (`DG_liquid`) và hồi liệu (`DG_cast_scrap`).
- Tách chi phí Thao cát nhựa ra tính độc lập (Phần B).
- Đổi trình tự hiển thị Phần A theo đúng 4 bước chuẩn (Tính cho mẻ 1000kg trước -> Quy đổi ra 1kg -> Áp dụng cho sản phẩm thực tế).

## 2. Open Questions & User Review Required
> [!IMPORTANT]
> - Yêu cầu C+D mô tả việc thay đổi luồng tính toán theo 4 bước. Việc tính `partA_per_kg` sẽ thực hiện thông qua 1000kg mẻ chuẩn, sau đó nhân với `m_cast` để ra chi phí cho 1 sản phẩm. Công thức mới sẽ không thay đổi số cuối cùng, chỉ thay đổi luồng biểu diễn trên màn hình.
> - Về lỗi tính mác gang: Em phát hiện rằng `fetchLiquidMetalPriceForGrade` trả về đúng giá, tuy nhiên khi load component, nếu mác gang đã có sẵn, store không tự động tính lại giá mới từ BOM mà dùng giá hardcode cũ. Khắc phục bằng cách fetch lại giá BOM lúc form mount và đảm bảo UI lấy đúng giá trị trả về. Xin anh xác nhận.

## 3. Proposed Changes

### 3.1. Fix Lỗi Tính Giá Gang Lỏng (Issue A)
#### [MODIFY] `src/store/useQuotationStore.ts`
- Cập nhật hàm `selectCastingGrade` để gọi `fetchLiquidMetalPriceForGrade(gradeId)` và cập nhật `DG_liquid`, `DG_cast_scrap` vào state.
- Khắc phục lỗi fallback khi lịch sử giá rỗng (bằng cách sửa trong `liquid-metal-calculator.ts` để fallback lấy `latest_price` của vật liệu an toàn).
#### [MODIFY] `src/components/rfq/CastingCalculatorForm.tsx`
- Bổ sung logic `useEffect` để trigger `selectCastingGrade(casting.selected_casting_grade_id)` ngay khi component load (để fetch lại số liệu BOM thực tế thay vì dùng số default).

### 3.2. Cấu Trúc Lại Trình Tự Hiển Thị Phần A (Issue C+D)
#### [MODIFY] `src/components/rfq/CastingCalculatorForm.tsx`
Thay đổi layout Section 1 & 2 thành cấu trúc 4 bước rõ ràng:

**BƯỚC 1: QUY ĐỔI MẺ CHUẨN 1,000KG KIM LOẠI LỎNG**
- Dropdown chọn Mác Gang.
- Hiển thị Chi phí Kim Loại cho 1,000kg (I) = 1000 * DG_liquid.
- Hiển thị Chi phí Hồi Liệu Thu Hồi cho 1,000kg (II) = (1000 * (1 - Y_yield - k_burn_loss)) * DG_cast_scrap.
- Chi phí Lót lò/gầu cho 1,000kg (III).
- Chi phí 3 Vật tư khuôn cố định cho 1,000kg (IV).

**BƯỚC 2: TÍNH TỔNG CHI PHÍ & ĐƠN GIÁ 1KG GANG LỎNG**
- Tổng chi phí mẻ 1,000kg = I - II + III + IV.
- Đơn giá 1kg Gang Lỏng (V) = Tổng chi phí / 1000.

**BƯỚC 3: CHI PHÍ THAO CÁT NHỰA (THEO SẢN PHẨM)**
- Input khối lượng thao cho 1 sản phẩm `m_resin_core`.
- Chi phí thao cho 1 sản phẩm = `m_resin_core * DG_resin_core`.
- Quy đổi chi phí thao ra 1kg thành phẩm = (Chi phí thao 1 SP) / `m_cast`.

**BƯỚC 4: TỔNG HỢP ĐƠN GIÁ PHẦN A (VẬT LIỆU + TẠO KHUÔN)**
- Đơn giá Phần A / 1kg thành phẩm = (V / Y_yield) + (Chi phí thao / kg SP).

### 3.3. Tách & Cập Nhật Công Thức Tính Thao Cát Nhựa (Issue B)
#### [MODIFY] `src/lib/calculation-engine/casting-calculator.ts`
- Điều chỉnh lại logic trong `calculateCastingPrice` để phản ánh đúng toán học của luồng 4 bước:
  - Tính tổng chi phí cho 1000kg kim loại lỏng.
  - Tính đơn giá 1kg kim loại lỏng.
  - Tính chi phí Thao cát nhựa độc lập cho mỗi sản phẩm.
  - Kết hợp để ra `partA_per_kg`.

## 4. Verification Plan
- Chạy thử UI bằng `npm run dev`.
- Vào giao diện form Tính Giá Đúc Gang, kiểm tra xem khi đổi mác gang, giá `DG_liquid` có load đúng từ BOM không.
- Nhập thử các thông số `m_cast`, `Y_yield`, `m_resin_core` và đối chiếu kết quả `partA_per_kg` với bảng tính Excel.
