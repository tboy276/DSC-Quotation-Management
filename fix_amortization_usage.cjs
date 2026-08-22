const fs = require("fs");

function updateFile2(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  for (let rep of replacements) {
    content = content.replace(rep.regex, rep.replaceVal);
  }
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated ${filePath}`);
}

updateFile2("src/components/rfq/ToolingAmortizationSection.tsx", [
  {
    regex: /\{N_order > autoToolLife/g,
    replaceVal: "{(N_order || 0) > autoToolLife"
  },
  {
    regex: /N_order\.toLocaleString\(/g,
    replaceVal: "(N_order || 0).toLocaleString("
  }
]);
