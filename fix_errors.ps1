$content = Get-Content "src\components\quotations\AstemoQuotationPdfContent.tsx" -Encoding UTF8
$content = $content -replace "import \{ formatNum \} from '../../utils/quotation-tooling-columns';", ""
$content = $content -replace "companyNameVi", "companyName"
Set-Content -Path "src\components\quotations\AstemoQuotationPdfContent.tsx" -Value $content -Encoding UTF8
