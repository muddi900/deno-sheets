import { GoogleSpreadsheet } from "npm:google-spreadsheet";
import { JWT } from "npm:google-auth-library";

export async function getJwt(filePath?: string): Promise<JWT> {
  const jsonText = await Deno.readTextFile(filePath || "./client_secret.json");

  return new JWT(...JSON.parse(jsonText));
}

export async function getSpreadsheet(
  sheetId?: string
): Promise<GoogleSpreadsheet> {
  const auth = await getJwt();

  return new GoogleSpreadsheet(
    sheetId || Deno.env.get("SHEET_ID")!,
    auth
  );
}

interface User {
    firstName: string
    lastName: string
    email: string
    id: number
}