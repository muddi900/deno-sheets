import { GoogleSpreadsheetRow } from "npm:google-spreadsheet";
import { getSpreadsheet } from "./sheet.ts";

const getUserRoute = new URLPattern({ pathname: "/users/:id" });

async function handler(req: Request): Promise<Response> {
  const sheet = await getSpreadsheet();
  await sheet.loadInfo();
  const ws = sheet.sheetsByIndex[0];
  const rows = await ws.getRows();

  const reqUrl = req.url;
  const method = req.method;

  if (method === "GET") {
    const body = getUsers(reqUrl, rows);
    return new Response(JSON.stringify(body));
  }

  return new Response(
    JSON.stringify({
      "message": "Hello",
    }),
    {
      status: 200,
    },
  );
}

function getUsers(
  url: string,
  rows: GoogleSpreadsheetRow[],
): Object | Object[] {
  const match = getUserRoute.exec(url);
  if (!match) {
    return rows.map((r, _) => r.toObject());
  }

  const row = rows.find((r, _) => r.get("ID") === match.pathname.groups.id);

  return row!.toObject();
}

Deno.serve(handler);
