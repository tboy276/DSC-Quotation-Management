const fs = require("fs");

function updateFile2(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  for (let rep of replacements) {
    content = content.replace(rep.regex, rep.replaceVal);
  }
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated ${filePath}`);
}

updateFile2("src/components/rfq/MachiningOpsList.tsx", [
  {
    regex: /\(op\.t_prep_min \+ op\.t_man_min\)/g,
    replaceVal: "((op.t_prep_min || 0) + (op.t_man_min || 0))"
  }
]);
