$content = Get-Content "src\components\quotations\AstemoQuotationPdfContent.tsx" -Encoding UTF8
$content = $content -replace "import \{ DEFAULT_DISPLAY_CONFIG \} from '../../types/quotation-document';", ""
$content = $content -replace "config: propConfig,", ""
Set-Content -Path "src\components\quotations\AstemoQuotationPdfContent.tsx" -Value $content -Encoding UTF8
