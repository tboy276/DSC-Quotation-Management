const fs = require("fs");

function updateFile2(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  for (let rep of replacements) {
    content = content.replace(rep.regex, rep.replaceVal);
  }
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated ${filePath}`);
}

updateFile2("src/components/rfq/Section5SummaryCard.tsx", [
  {
    regex: /onMoqChange\?: \(val: number\) => void;/g,
    replaceVal: "onMoqChange?: (val: number | undefined) => void;"
  },
  {
    regex: /onDGHeatTreatChange\?: \(val: number\) => void;/g,
    replaceVal: "onDGHeatTreatChange?: (val: number | undefined) => void;"
  },
  {
    regex: /onDGPaintChange\?: \(val: number\) => void;/g,
    replaceVal: "onDGPaintChange?: (val: number | undefined) => void;"
  }
]);

updateFile2("src/components/rfq/ToolingAmortizationSection.tsx", [
  {
    regex: /onNOrderChange: \(value: number\) => void;/g,
    replaceVal: "onNOrderChange: (value: number | undefined) => void;"
  }
]);
