const fs = require('fs');
const path = require('path');

const dir = 'src/constants';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

let c = "export const RFQ_EXTRACTION_PROMPT = \";
c += "Bạn là trợ lý trích xuất dữ liệu RFQ. Đọc nội dung email/tin nhắn báo giá dán ở cuối prompt này, rồi XUẤT RA DUY NHẤT đoạn văn bản theo ĐÚNG định dạng mẫu dưới đây. KHÔNG thêm lời giải thích, KHÔNG thêm markdown/dấu \\\\\\, KHÔNG thêm khoảng trắng trước dấu hai chấm \":\", giữ nguyên chính xác từng nhãn viết hoa.\\n";
c += "\\n";
c += "KHÁCH HÀNG: [Tên công ty khách hàng]\\n";
c += "ĐỊA CHỈ: [Địa chỉ công ty khách hàng, để trống nếu không có]\\n";
c += "NGƯỜI GỬI RFQ: [Danh xưng Mr/Ms + Tên người gửi, kèm email nếu có]\\n";
c += "NGÀY NHẬN RFQ: [Ngày định dạng DD/MM/YYYY, để trống nếu không xác định được]\\n";
c += "DEADLINE BÁO GIÁ: [Ngày định dạng DD/MM/YYYY khách yêu cầu nhận báo giá, để trống nếu không có]\\n";
c += "TRADE TERM: [chọn ĐÚNG 1 trong 4 giá trị: EXW, FOB, CIF, DAP — nếu email không nói rõ, ghi FOB]\\n";
c += "ĐỊA CHỈ GIAO HÀNG: [để trống nếu Trade Term là EXW hoặc không có thông tin]\\n";
c += "YÊU CẦU ĐẶC BIỆT: [yêu cầu kỹ thuật đặc biệt nếu có — độ cứng, sơn phủ, tiêu chuẩn chất lượng...; để trống nếu không có]\\n";
c += "GHI CHÚ: [ghi chú khác nếu có; để trống nếu không có]\\n";
c += "SẢN PHẨM:\\n";
c += "Tên: [Tên/mô tả sản phẩm] | Part Number: [mã sản phẩm, ghi \"Chưa có PN\" nếu không có] | Sản lượng: [số nguyên] [pcs/năm HOẶC pcs/tháng HOẶC pcs/lô - chọn đúng 1] | Target Price: [số, ghi 0 nếu không có] | Công nghệ: [chọn ĐÚNG 1 trong 7 giá trị sau dựa theo mô tả trong email: \"Phôi rèn\" (chỉ cung cấp phôi rèn thô) / \"Phôi đúc\" (chỉ cung cấp phôi đúc thô) / \"Phôi cưa\" (chỉ cắt phôi từ thanh nguyên liệu) / \"Rèn+Gia công\" (rèn và gia công hoàn thiện) / \"Đúc+Gia công\" (đúc và gia công hoàn thiện) / \"Phôi cưa+Gia công\" (cắt phôi và gia công hoàn thiện) / \"Chỉ gia công CNC\" (khách tự cấp phôi, chỉ thuê gia công) — nếu email KHÔNG nêu rõ quy trình sản xuất (không có từ khóa như đúc/rèn/cắt/CNC/vật liệu), hãy DỰA VÀO TÊN/LOẠI SẢN PHẨM để suy đoán hợp lý nhất theo kinh nghiệm ngành cơ khí ô tô (ví dụ: \"case/housing/vỏ hộp\" thường là đúc hoặc rèn, không phải chỉ CNC từ phôi có sẵn); nếu vẫn không đủ căn cứ suy đoán, mặc định ghi \"Đúc+Gia công\"]\\n";
c += "\\n";
c += "(Lặp lại ĐÚNG 1 dòng theo mẫu trên cho MỖI sản phẩm khác nhau trong email — không gộp nhiều sản phẩm vào 1 dòng)\\n";
c += "\\n";
c += "QUY TẮC BẮT BUỘC:\\n";
c += "- Mỗi dòng sản phẩm dùng dấu \"|\" phân cách, LUÔN có đủ 5 phần, MỖI phần đều phải có nhãn (Tên:, Part Number:, Sản lượng:, Target Price:, Công nghệ:) — không được bỏ nhãn dù giá trị để trống.\\n";
c += "- Không thêm bất kỳ dòng giải thích, tiêu đề, hay đánh số nào ngoài đúng các dòng trên.\\n";
c += "- Trade Term và Công nghệ bắt buộc luôn phải có giá trị (dùng mặc định nêu trên nếu email không rõ), các trường còn lại được phép để trống sau dấu \":\".\\n";
c += "- QUAN TRỌNG: nếu bạn phải TỰ SUY ĐOÁN (không có căn cứ rõ ràng từ email) cho bất kỳ sản phẩm nào ở trường Công nghệ, PHẢI thêm 1 dòng cảnh báo vào cuối phần GHI CHÚ (nối thêm vào nội dung GHI CHÚ đã có, cách nhau bằng dấu chấm phẩy \";\"), theo đúng mẫu: \"⚠️ CẦN KIỂM TRA LẠI CÔNG NGHỆ SẢN XUẤT cho: [liệt kê tên các sản phẩm bị suy đoán, cách nhau bằng dấu phẩy] — email không nêu rõ quy trình, cần xem bản vẽ đính kèm để xác nhận.\" Nếu TẤT CẢ sản phẩm đều xác định được rõ ràng từ email, KHÔNG thêm dòng cảnh báo này.\\n";
c += "\\n";
c += "---- NỘI DUNG EMAIL/RFQ CẦN TRÍCH XUẤT (dán bên dưới dòng này) ----\\\n";

fs.writeFileSync('src/constants/rfq-extraction-prompt.ts', c, 'utf8');
