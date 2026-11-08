import { normalizeEmail } from "./auth";

const cases: Array<[string, string | null]> = [
  ["  SuperAdmin@Staffen.com ", "superadmin@staffen.com"],
  ["bu.sari@warung.co.id", "bu.sari@warung.co.id"],
  ["bu sari@warung.com", null],
  ["busari@warung", null],
  ["@warung.com", null],
];

for (const [input, wanted] of cases) {
  const actual = normalizeEmail(input);
  if (actual !== wanted) throw new Error(`${input}: got ${actual}, want ${wanted}`);
}
console.log("auth ok");
