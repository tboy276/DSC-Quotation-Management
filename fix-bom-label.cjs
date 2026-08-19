const fs = require('fs');

let content = fs.readFileSync('src/components/master-data/CastingBomManager.tsx', 'utf8');

// The original pattern in the file:
// {m.name} ({m.category}) — {m.latest_price?.toLocaleString('vi-VN')} đ/{m.unit}
// Need to replace `{m.name} ({m.category}) —` with `{m.name}{m.notes ? \` — \${m.notes}\` : ''} —`

const oldLabel = `{m.name} ({m.category}) — {m.latest_price?.toLocaleString('vi-VN')} đ/{m.unit}`;
const newLabel = `{m.name}{m.notes ? \` — \${m.notes}\` : ''} — {m.latest_price?.toLocaleString('vi-VN')} đ/{m.unit}`;

content = content.replace(oldLabel, newLabel);

fs.writeFileSync('src/components/master-data/CastingBomManager.tsx', content);
console.log('Fixed Material Option Label format');
