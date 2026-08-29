const fs = require('fs');
let content = fs.readFileSync('src/components/rfq/RealtimeSummaryPanel.tsx', 'utf8');

content = content.replace(
  '  const isForging = segment === ''forging'';',
  '  const isForging = segment === ''forging'';\n  const isCastingInputValid = segment !== ''casting'' || (castingInput.Y_yield !== undefined && castingInput.Y_yield > 0);'
);

const targetString = '      {/* Target Price vs Quoted Price Side-by-Side Comparison */}';
const [before, after] = content.split(targetString);

const newAfter = \      {!isCastingInputValid ? (
        <div className="p-4 rounded-[10px] bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center space-x-2">
          <span>⚠️ Vui lòng nhập đầy đủ Tỷ lệ thu hồi kim loại (%) để xem giá</span>
        </div>
      ) : (
        <>
\\
        </>
      )}\;

fs.writeFileSync('src/components/rfq/RealtimeSummaryPanel.tsx', before + newAfter, 'utf8');
