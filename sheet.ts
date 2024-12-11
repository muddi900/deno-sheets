import { GoogleSpreadsheet } from "npm:google-spreadsheet";
import { JWT } from "npm:google-auth-library";

export async function getAuth(filePath?: string): Promise<JWT> {
  const jsonText = await Deno.readTextFile(filePath || "./client_secret.json");

  const clientSecret = JSON.parse(jsonText);
  return new JWT({
    email: clientSecret.client_email,
    key: clientSecret.private_key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
    keyId: clientSecret.private_key_id,
  });
}

export async function getSpreadsheet(
  sheetId?: string
): Promise<GoogleSpreadsheet>{
  const auth = await getAuth()

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