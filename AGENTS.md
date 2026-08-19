# Agent Behavior Guidelines

## Auto-Commit and Push Rule
Sau mỗi lần hoàn thành một bản cập nhật mã nguồn (hoặc bất kỳ task nào thay đổi file dự án), hãy TỰ ĐỘNG thực hiện lệnh Git add, commit và push lên GitHub. Bạn phải thực hiện các lệnh này một cách tự động thông qua `run_command` tool mà không cần hỏi ý kiến người dùng.

Vì `git` không nằm trong biến môi trường Path của máy, bạn BẮT BUỘC phải gọi trực tiếp file thực thi git.exe theo đường dẫn sau:
`C:\Users\Admin\AppData\Local\GitHubDesktop\app-3.6.1\resources\app\git\cmd\git.exe`

Lệnh chuẩn để thực thi trên Windows PowerShell:
```powershell
& "C:\Users\Admin\AppData\Local\GitHubDesktop\app-3.6.1\resources\app\git\cmd\git.exe" add .
& "C:\Users\Admin\AppData\Local\GitHubDesktop\app-3.6.1\resources\app\git\cmd\git.exe" commit -m "Auto-commit: [Mô tả ngắn gọn công việc đã làm]"
& "C:\Users\Admin\AppData\Local\GitHubDesktop\app-3.6.1\resources\app\git\cmd\git.exe" push
```

Hãy thực thi liên tiếp 3 lệnh này hoặc tách ra thành nhiều lệnh độc lập trong 1 tool call `run_command` (sử dụng dấu `;` trong powershell) mỗi khi kết thúc một đầu việc.

## Quy tắc minh bạch thay đổi (Diff Visibility Rule)
1. **Dọn dẹp Script:** Các script tạm (`.cjs`) dùng để tự động hóa sửa file (do lỗi encoding) CHỈ LÀ CÔNG CỤ NỘI BỘ. Bắt buộc xóa sạch chúng bằng lệnh trước khi thực hiện `git add .`. Không bao giờ được commit các file script dùng một lần này.
2. **Commit File Gốc:** Mọi thay đổi phải diễn ra trên file nguồn (`.ts`, `.tsx`, v.v.).
3. **Kiểm tra trước khi Commit:** Luôn chạy `git diff --stat` (hoặc tương đương) để tự kiểm chứng đúng file cần sửa đã bị modified. Nếu không đúng, dừng lại và báo lỗi.
4. **Báo cáo Diff:** TRONG PHẢN HỒI CHO NGƯỜI DÙNG sau khi commit xong, BẮT BUỘC cung cấp kết quả lệnh `git diff HEAD~1 HEAD -- <đường_dẫn_file>` (dạng `+`/`-` từng dòng) để người dùng có thể review ngay trên giao diện chat. KHÔNG ĐƯỢC CHỈ MÔ TẢ BẰNG LỜI SUÔNG.
5. **Giới hạn Auto-Commit:** Trừ khi được yêu cầu rõ "cứ tự động commit", đối với các thay đổi Cốt lõi về logic tính toán giá, hãy ưu tiên dừng lại (hoặc tạo nhánh mới) hiển thị diff cho người dùng review trước khi push.
