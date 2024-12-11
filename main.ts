import { GoogleSpreadsheet } from "npm:google-spreadsheet";
import { JWT } from "npm:google-auth-library";

export async function getJwt(filePath?: string): Promise<JWT> {
  const jsonText = await Deno.readTextFile(filePath || "./client_secret.json");

  return new JWT(...JSON.parse(jsonText));
}
