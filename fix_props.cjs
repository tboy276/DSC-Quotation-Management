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
    regex: /quoted_moq: number \| undefined;/g,
    replaceVal: "quoted_moq?: number;"
  },
  {
    regex: /onMoqChange: \(moq: number\) => void;/g,
    replaceVal: "onMoqChange: (moq: number | undefined) => void;"
  },
  {
    regex: /DG_heat_treat_per_kg: number \| undefined;/g,
    replaceVal: "DG_heat_treat_per_kg?: number;"
  },
  {
    regex: /onDGHeatTreatChange: \(dg: number\) => void;/g,
    replaceVal: "onDGHeatTreatChange: (dg: number | undefined) => void;"
  },
  {
    regex: /DG_paint_per_kg: number \| undefined;/g,
    replaceVal: "DG_paint_per_kg?: number;"
  },
  {
    regex: /onDGPaintChange: \(dg: number\) => void;/g,
    replaceVal: "onDGPaintChange: (dg: number | undefined) => void;"
  }
]);

updateFile2("src/components/rfq/ToolingAmortizationSection.tsx", [
  {
    regex: /N_order: number;/g,
    replaceVal: "N_order?: number;"
  },
  {
    regex: /onNOrderChange: \(value: number\) => void;/g,
    replaceVal: "onNOrderChange: (value: number | undefined) => void;"
  }
]);
