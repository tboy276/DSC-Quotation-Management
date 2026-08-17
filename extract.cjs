const fs = require('fs');
const html = fs.readFileSync('dist/stats.html', 'utf8');
const scriptMatch = html.match(/<script[^>]*>(.*?)<\/script>/s);

if (scriptMatch) {
    const code = scriptMatch[1];
    let extractedData = null;
    
    // We can just extract the 'const data = ...' block with a simple AST parser or string manipulation
    // Since the code is bundled, it looks like: const data = [{"name":"...
    const dataIndex = code.indexOf('const data = [');
    if (dataIndex !== -1) {
        // find the matching semicolon
        const endStr = '];\n';
        let endIndex = code.indexOf(endStr, dataIndex);
        if (endIndex === -1) {
             endIndex = code.indexOf('];\r\n', dataIndex);
        }
        if (endIndex !== -1) {
            const jsonStr = code.substring(dataIndex + 13, endIndex + 1);
            try {
                extractedData = JSON.parse(jsonStr);
                fs.writeFileSync('stats.json', JSON.stringify(extractedData, null, 2));
                console.log("Extracted via string search!");
            } catch(e) {
                console.log("JSON parse error:", e.message);
            }
        } else {
            console.log("Could not find end of array");
        }
    } else {
        console.log("Could not find 'const data = ['");
    }
}
