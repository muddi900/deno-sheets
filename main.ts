import { getSpreadsheet } from "./sheet.ts";

const ss = await getSpreadsheet();

await ss.loadInfo();

const ws = ss.sheetsByIndex[0];
await ws.loadHeaderRow();
const headers = ws.headerValues;
const rows = [
  headers,
  ...(await ws.getRows()).map((row, _) => Object.values(row.toObject())),
];
console.table(rows);
// ┌───────┬──────────────┬─────────────┬──────────────────────┬──────┐
// │ (idx) │ 0            │ 1           │ 2                    │ 3    │
// ├───────┼──────────────┼─────────────┼──────────────────────┼──────┤
// │     0 │ "First Name" │ "Last Name" │ "Email"              │ "ID" │
// │     1 │ "Alif"       │ "Bay"       │ "alif.bay@fake.fake" │ "1"  │
// │     2 │ "Eh"         │ "Bee"       │ "a.b@fake.fake"      │ "2"  │
// │     3 │ "Ecks"       │ "Wye"       │ "e.w@fake.fake"      │ "3"  │
// └───────┴──────────────┴─────────────┴──────────────────────┴──────┘
