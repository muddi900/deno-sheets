import {
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
} from "npm:google-spreadsheet";
import RawRowData from "npm:google-spreadsheets/types";
import { getSpreadsheet, User } from "./sheet.ts";

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

  if (method === "POST") {
    const body = JSON.parse(await req.text());

    const users: User[] = body["users"];
    const respBody = await setUsers(users, ws);
    return new Response(JSON.stringify(respBody));
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

async function setUsers(
  users: User[],
  ws: GoogleSpreadsheetWorksheet,
): Promise<User[]> {
  const r = await ws.addRows(users as RawRowData[]);
  return r.map((v, _) => v.toObject() as User);
}

function getUsers(
  url: string,
  rows: GoogleSpreadsheetRow[],
): User | User[] {
  const match = getUserRoute.exec(url);
  if (!match) {
    return rows.map((r, _) => r.toObject() as User);
  }

  const row = rows.find((r, _) => r.get("ID") === match.pathname.groups.id);

  return row!.toObject() as User;
}

Deno.serve(handler);
