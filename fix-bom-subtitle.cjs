const fs = require('fs');

let content = fs.readFileSync('src/components/master-data/CastingBomManager.tsx', 'utf8');

const oldTag = `<p className="text-[10px] text-[#787774]">{item.material?.category}</p>`;
const newTag = `<p className="text-[10px] text-[#787774]">{item.material?.notes || item.material?.category}</p>`;

content = content.replace(oldTag, newTag);

fs.writeFileSync('src/components/master-data/CastingBomManager.tsx', content);
console.log('Fixed Material Name Column Subtitle');
