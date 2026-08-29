const fs = require('fs');
let content = fs.readFileSync('src/pages/CastingCostingPage.tsx', 'utf8');

content = content.replace(
  'const rfq = useQuotationStore(state => state.rfq);',
  'const rfq = useQuotationStore(state => state.rfq);\n  const castingInput = useQuotationStore(state => state.castingInput);\n  const isCastingInputValid = castingInput.Y_yield !== undefined && castingInput.Y_yield > 0;'
);

content = content.replace(
  'itemRecord={activeItemRecord}',
  'itemRecord={activeItemRecord}\n        disableSave={!isCastingInputValid}\n        disableSaveReason="Vui lòng nhập Tỷ lệ thu hồi kim loại trước khi lưu báo giá"'
);

fs.writeFileSync('src/pages/CastingCostingPage.tsx', content, 'utf8');
