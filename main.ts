import {
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
} from "npm:google-spreadsheet";
import RawRowData from "npm:google-spreadsheets/types";
import { getSpreadsheet, PartialUser, User } from "./sheet.ts";

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

  if (method === "PUT" || method === "PATCH") {
    const id = getUserRoute.exec(reqUrl)?.pathname.groups.id;
    const userData = JSON.parse(await req.text());
    await updateUser(Number(id), userData, rows);
    return new Response(
      JSON.stringify({
        "message": `${id} updated`,
      }),
      {
        status: 200,
      },
    );
  }

  if (method === "DELETE") {
    const id = getUserRoute.exec(reqUrl)?.pathname.groups.id;
    const row = await rows.find((v, _i) => v.get("id") == id)!;

    const d = await row.delete();
    console.log(d);
    return new Response(
      JSON.stringify({
        "message": `${id} has been deleted`,
      }),
      {
        status: 200,
      },
    );
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

async function updateUser(
  id: number,
  userData: PartialUser,
  rows: GoogleSpreadsheetRow[],
) {
  const row = rows.find((v, _) => v.get("id") == id)!;
  row.assign(userData);

  await row.save();
}

function getUsers(
  url: string,
  rows: GoogleSpreadsheetRow[],
): User | User[] {
  const match = getUserRoute.exec(url);
  if (!match) {
    return rows.map((r, _) => r.toObject() as User);
  }

  const row = rows.find((r, _) => r.get("id") === match.pathname.groups.id);

  return row!.toObject() as User;
}

Deno.serve(handler);
