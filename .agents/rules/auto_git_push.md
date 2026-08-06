# Tự động Git Push

**Trường hợp sử dụng:** Sau khi hoàn thành một task và cập nhật cấu trúc app/source code thành công.

**Hướng dẫn:**
Từ nay về sau, mỗi khi làm xong một task và cập nhật code, phải TỰ ĐỘNG thực thi lệnh git để add, commit, và push lên GitHub bằng PowerShell. 
Sử dụng chính xác đường dẫn tuyệt đối sau đây để gọi `git.exe` vì biến môi trường (PATH) không chứa lệnh `git`:

```powershell
$git = "C:\Users\Admin\AppData\Local\GitHubDesktop\app-3.6.1\resources\app\git\cmd\git.exe"
& $git add .
& $git commit -m "chore: auto commit from agent" # Chú ý: thay đổi commit message cho mô tả đúng phần việc vừa làm!
& $git push
```

Yêu cầu thực hiện thao tác này vào CUỐI mỗi lượt thực thi task nếu có thay đổi trong thư mục làm việc mà không cần người dùng nhắc lại.
