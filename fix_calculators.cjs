const fs = require("fs");
const path = require("path");

function updateFile2(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  for (let rep of replacements) {
    content = content.replace(rep.regex, rep.replaceVal);
  }
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated ${filePath}`);
}

const calculatorFiles = [
  "src/lib/calculation-engine/casting-calculator.ts",
  "src/lib/calculation-engine/forging-calculator.ts",
  "src/lib/calculation-engine/machining-calculator.ts",
  "src/lib/calculation-engine/sawing-calculator.ts"
];

const replacements = [
  {
    regex: /\(op\.t_prep_min \+ op\.t_man_min\)/g,
    replaceVal: "((op.t_prep_min || 0) + (op.t_man_min || 0))"
  }
];

calculatorFiles.forEach(file => updateFile2(file, replacements));
