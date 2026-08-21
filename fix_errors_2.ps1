$content = Get-Content "src\components\quotations\AstemoQuotationPdfContent.tsx" -Encoding UTF8
$content = $content -replace "DISOCO_COMPANY_CONFIG\.companyName", "DISOCO_COMPANY_CONFIG.name"
$content = $content -replace "import \{ DISOCO_COMPANY_CONFIG, DOCUMENT_FORM_CODE, DOCUMENT_REVISION_NO, DOCUMENT_ISSUE_DATE \} from '../../config/company-config';", "import { DISOCO_COMPANY_CONFIG } from '../../config/company-config';"
$content = $content -replace "import \{ ASTEMO_FORM_CONFIG \} from '../../config/astemo-form-config';", ""
$content = $content -replace "(?s)const getText =.*?};", ""
Set-Content -Path "src\components\quotations\AstemoQuotationPdfContent.tsx" -Value $content -Encoding UTF8
