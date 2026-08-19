const fs = require('fs');

let content = fs.readFileSync('src/components/master-data/MaterialsManager.tsx', 'utf8');

const oldCheck = `          // Check duplicate in same paste
          if (seenNames.has(name.toLowerCase())) {
            skippedCount++;
            continue;
          }
          seenNames.add(name.toLowerCase());`;

const newCheck = `          // Check duplicate in same paste (by name AND notes)
          const dupKey = \`\${name.toLowerCase()}|||\${(notes || '').toLowerCase()}\`;
          if (seenNames.has(dupKey)) {
            skippedCount++;
            continue;
          }
          seenNames.add(dupKey);`;

content = content.replace(oldCheck, newCheck);

fs.writeFileSync('src/components/master-data/MaterialsManager.tsx', content);
console.log('Fixed handleImportSubmit duplicate check logic');
