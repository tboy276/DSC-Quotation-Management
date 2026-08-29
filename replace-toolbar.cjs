const fs = require('fs');
let content = fs.readFileSync('src/components/rfq/CostingPageToolbar.tsx', 'utf8');

content = content.replace(
  '  rfqRecord: any;',
  '  rfqRecord: any;\n  disableSave?: boolean;\n  disableSaveReason?: string;'
);

content = content.replace(
  '  rfqRecord,\n}: CostingPageToolbarProps',
  '  rfqRecord,\n  disableSave,\n  disableSaveReason,\n}: CostingPageToolbarProps'
);

content = content.replace(
  /disabled=\{saving\}/g,
  'disabled={saving || disableSave}'
);

content = content.replace(
  /title="Lưu bản nháp tính giá \(Save Draft\)"/g,
  'title={disableSave ? disableSaveReason : "Lưu bản nháp tính giá (Save Draft)"}'
);

content = content.replace(
  /title="Hoàn thành tính giá"/g,
  'title={disableSave ? disableSaveReason : "Hoàn thành tính giá"}'
);

fs.writeFileSync('src/components/rfq/CostingPageToolbar.tsx', content, 'utf8');
