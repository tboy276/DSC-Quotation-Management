const fs = require('fs');

function replaceLabel(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/label="Đóng Cửa Sổ"/g, 'label="Đóng"');
  content = content.replace(/label="Đóng Màn Hình"/g, 'label="Đóng"');
  content = content.replace(/label="Huỷ Màn Hình"/g, 'label="Đóng"'); // just in case
  fs.writeFileSync(file, content);
}

replaceLabel('src/components/rfq/CastingCalculatorForm.tsx');
replaceLabel('src/components/rfq/QuoteDetailModal.tsx');
console.log('Fixed labels');
