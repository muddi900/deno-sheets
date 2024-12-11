import { GoogleSpreadsheet } from "npm:google-spreadsheet";
import { JWT } from "npm:google-auth-library";


// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  console.log("Add 2 + 3 =", add(2, 3));
}
