const fs = require('fs');
let matContent = fs.readFileSync('src/components/master-data/MaterialsManager.tsx', 'utf8');

const oldFilter = `<option value="ALL">Tất cả Nhóm</option>
            <option value="Thép cán - Rèn">Thép cán - Rèn</option>
            <option value="Gang thỏi">Gang thỏi</option>
            <option value="Thép phế đúc">Thép phế đúc</option>
            <option value="Hồi liệu">Hồi liệu</option>
            <option value="Fe-Si">Fe-Si</option>`;
            
const newFilter = `<option value="ALL">Tất cả Nhóm</option>
            {ALL_MATERIAL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}`;

matContent = matContent.replace(/<option value="ALL">Tất cả Nhóm<\/option>[\s\S]*?<option value="Fe-Si">Fe-Si<\/option>/, newFilter);

const oldSelect = `<option value="Thép cán - Rèn">Thép cán - Rèn</option>
                <option value="Gang thỏi">Gang thỏi</option>
                <option value="Thép phế đúc">Thép phế đúc</option>
                <option value="Hồi liệu">Hồi liệu</option>
                <option value="Fe-Si">Fe-Si</option>`;

const newSelect = `{ALL_MATERIAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}`;

matContent = matContent.replace(/<option value="Thép cán - Rèn">Thép cán - Rèn<\/option>[\s\S]*?<option value="Fe-Si">Fe-Si<\/option>/, newSelect);

fs.writeFileSync('src/components/master-data/MaterialsManager.tsx', matContent);
console.log('Fixed dropdowns in MaterialsManager');
