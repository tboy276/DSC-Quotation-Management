const fs = require("fs");

function updateFile2(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  for (let rep of replacements) {
    content = content.replace(rep.regex, rep.replaceVal);
  }
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated ${filePath}`);
}

updateFile2("src/types/quote.ts", [
  {
    regex: /annual_volume: number;/g,
    replaceVal: "annual_volume?: number;"
  },
  {
    regex: /target_price: number;/g,
    replaceVal: "target_price?: number;"
  }
]);
