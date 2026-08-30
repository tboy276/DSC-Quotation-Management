const fs = require('fs');
let content = fs.readFileSync('src/components/rfq/RealtimeSummaryPanel.tsx', 'utf8');

content = content.replace(
  /\{\(segment === 'forging' \|\| segment === 'casting'\) && \(/g,
  "{(segment === 'forging' || segment === 'casting') && !isSeparateTooling && ("
);

fs.writeFileSync('src/components/rfq/RealtimeSummaryPanel.tsx', content, 'utf8');
