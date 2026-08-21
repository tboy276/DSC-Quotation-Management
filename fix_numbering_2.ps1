$content = Get-Content "src\components\quotations\QuotationPreviewPanel.tsx" -Encoding UTF8
$content = $content -replace "1. NgA'n Ng_ Hin Th<", "1. Ngôn Ng? Hi?n Th?"
$content = $content -replace "2. ?<nh Dng Form BAo GiA", "2. Ð?nh D?ng Form Báo Giá"
$content = $content -replace "3. "n / Hin CTt Trong Bng Chi PhA-", "3. ?n / Hi?n C?t Trong B?ng Chi Phí"
$content = $content -replace "4. Ghi ChA & ?i?u Khon", "4. Ghi Chú & Ði?u Kho?n"
Set-Content -Path "src\components\quotations\QuotationPreviewPanel.tsx" -Value $content -Encoding UTF8
