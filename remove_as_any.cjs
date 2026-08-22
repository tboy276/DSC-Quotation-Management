const fs = require("fs");

function updateFile2(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  for (let rep of replacements) {
    content = content.replace(rep.regex, rep.replaceVal);
  }
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated ${filePath}`);
}

const removeAsAny = [
  {
    regex: / as any/g,
    replaceVal: ""
  }
];

updateFile2("src/components/rfq/MachiningOpsList.tsx", removeAsAny);
updateFile2("src/components/rfq/Section5SummaryCard.tsx", removeAsAny);
updateFile2("src/components/rfq/ToolingAmortizationSection.tsx", removeAsAny);
updateFile2("src/components/rfq/RfqHeaderForm.tsx", removeAsAny);
