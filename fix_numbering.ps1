$content = Get-Content "src\components\quotations\QuotationPreviewPanel.tsx" -Raw
$content = $content -replace "1. Ngôn Ng? Hi?n Th?", "2. Ngôn Ng? Hi?n Th?"
$content = $content -replace "2. Ð?nh D?ng Form Báo Giá", "3. Ð?nh D?ng Form Báo Giá"
$content = $content -replace "3. ?n / Hi?n C?t Trong B?ng Chi Phí", "4. ?n / Hi?n C?t Trong B?ng Chi Phí"
$content = $content -replace "4. Ghi Chú & Ði?u Kho?n", "5. Ghi Chú & Ði?u Kho?n"
Set-Content -Path "src\components\quotations\QuotationPreviewPanel.tsx" -Value $content
