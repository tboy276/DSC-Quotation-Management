$content = Get-Content "src\components\quotations\AstemoQuotationPdfContent.tsx" -Encoding UTF8
$content = $content -replace "const config = propConfig \|\| document\.display_config \|\| DEFAULT_DISPLAY_CONFIG;", ""
$content = $content -replace "isSeparateTooling,", ""
$content = $content -replace "toolingPriceVnd,", ""
$content = $content -replace "toolingLife", ""
Set-Content -Path "src\components\quotations\AstemoQuotationPdfContent.tsx" -Value $content -Encoding UTF8
