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
