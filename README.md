# Use Google Sheets as free database(using Deno)[38 before 38]

![](/images/38%20before%2038%2031.png)

_This blog is part of my ~~38~~
[34 before 38](https://chapra.blog/category/38-before-38/) series. I write a
blog for every single day for the 38 days leading up to my 38th Birthday._

I have
[written previously](https://chapra.blog/use-google-sheets-as-a-database-with-python-30-days-of-blog-4-1d288c614163-6/)
how you can use python to create a CRUD(**C**reate, **R**ecord, **U**pdate,
**D**elete) app out of Google Sheets. Since then, I have actually implemented
that technology, when helping out a family member with their small business. I
implemented it on the server side using Flask. I wanted to do something similar
in Typescript/Javascript. Just for experimentation's sake.

However, until recently, it was a chore. `Node.js`, the sever side JS runtime,
is a crufty, unweildy mess. It requires hundreds of dependencies to do even the
most basic tasks. Unlike python, which has a "batteries included" philosophy,
Node is quite barebones. Then the creators of Node, came up with Deno.

Deno has a similar philosophy than python. And it is cross compatible with node
packages via npm. So I decided to try it for myself.

## The Setup

Like last time, I am using Service Account credentials. You can see how to do
that
[here](https://developers.google.com/workspace/guides/create-credentials#service-account).
Also
[enable google sheets API](https://medium.com/@a.marenkov/how-to-get-credentials-for-google-sheets-456b7e88c430)
You need to install "Deno" in your local system. You can check the instructions
out on deno's [official site](https://docs.deno.com/runtime/).

Create a folder where you want to host your project, initialize deno.

```bash
mkdir deno-sheets
cd deno-sheets
deno init
```

Deno by default uses TypeScript. Copy the credential json file you downloaded
from Google in the same folder as `client_secret.json`:

```json
//client_secret.json
{
  "type": "service_account",
  "project_id": "<project id>",
  "private_key_id": "<your key id>",
  "private_key": "<your key>",
  "client_email": "<client email>",
  "client_id": "<client id>",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "",
  "client_x509_cert_url": "",
  "universe_domain": "googleapis.com"
}
```

Copy the `client_email` value from your file. Create new google sheet. Name it
whatever. clic the "Share" button, and paste the email you copied from the json
file. Also copy the sheet ID from url. Create a new file in your root folder
`.env` and add the following text

![Screenshot of a google sheet highlighting the ID section of URL](/images/sheet_id.png)

```bash
# .env

SHEET_ID=<your sheet id>
```

We are formatting this sheet as a simple user table. Our set up is complete.

## Getting the sheet

Create a new file in the root folder `sheet.ts` . The is where we will write our
functions to get the sheet and create a model for our user.

```tsx
import { GoogleSpreadsheet } from "npm:google-spreadsheet";
import { JWT } from "npm:google-auth-library";

export async function getAuth(filePath?: string): Promise<JWT> {
  const jsonText = await Deno.readTextFile(filePath || "./client_secret.json");

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
  sheetId?: string,
): Promise<GoogleSpreadsheet> {
  const auth = await getAuth();

  return new GoogleSpreadsheet(
    sheetId || Deno.env.get("SHEET_ID")!,
    auth,
  );
}
```

This is where we see a lot of cool things about deno show up. Instead of running
cli commands or updating `package.json` you can just import npm packages
directly. The `getAuth` method here generates the authentication for our sheet.
And the `getSpreadsheet` function returns the feed file you want.

Now we will write a model for our user.

```tsx
export interface User {
  firstName: string;
  lastName: string;
  email: string;
  id: number;
}
```

## Demo

Lets check if it works. Lets create a `main.ts` where we write a way to log the
data from the sheet.

```tsx
//main.ts
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

// ┌───────┬─────────────┬────────────┬───────────────────┬──────┐
// │ (idx) │ 0           │ 1          │ 2                 │ 3    │
// ├───────┼─────────────┼────────────┼───────────────────┼──────┤
// │     0 │ "firstName" │ "lastName" │ "email"           │ "id" │
// │     1 │ "Alif"      │ "Bay"      │ "dbac@fake.fake"  │ "1"  │
// │     2 │ "Ecks"      │ "Wye"      │ "e.w@fake.fake"   │ "3"  │
// │     3 │ "John"      │ "Cena"     │ "jcena@fake.fake" │ "4"  │
// └───────┴─────────────┴────────────┴───────────────────┴──────┘
```

As you can see our code pulls the data directly from sheet. Now lets write our
server.

## Server

I decided to do this the hard way. Deno has a decent built-in http server
option. Like python, it is very limited. Deno can use Node packages like
express, and it has it's own packages for middleware and routing like hono.
However, today we are only going to setup a bare bones REST API server.

```tsx
import { getSpreadsheet, User } from "./sheet.ts";

async function handler(req: Request): Promise<Response> {
  return new Response(
    JSON.stringify({
      "message": "Hello",
    }),
    {
      status: 200,
    },
  );
}

Deno.serve(handler);
```

```bash
❯ deno run --allow-all --allow-env main.ts

❯ curl http://localhost:8000/ | jq
  
{
  "message": "Hello"
}
```

### Routing

Since the built in option is limited for routing, I decide to use only 1 route,
`/users` .

First lets get information of a user. All users, and an individual user as well.

### Implementing the CRUD

```ts
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

  if (reqUrl.search("users") > -1) {
    if (method === "GET") {
      const body = getUsers(reqUrl, rows);
      return new Response(JSON.stringify(body));
    }

    //..
  }
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
```

```bash
❯ curl http://localhost:8000/users | jq
  
[
  {
    "firstName": "Alif",
    "lastName": "Bay",
    "email": "dbac@fake.fake",
    "id": "1"
  },
  {
    "firstName": "Ecks",
    "lastName": "Wye",
    "email": "e.w@fake.fake",
    "id": "3"
  },
  {
    "firstName": "John",
    "lastName": "Cena",
    "email": "jcena@fake.fake",
    "id": "4"
  }
]


❯ curl http://localhost:8000/users/4 | jq

{
  "firstName": "John",
  "lastName": "Cena",
  "email": "jcena@fake.fake",
  "id": "4"
}
```

Now we need to add an user as well. So we receive the POST requests.

```ts
async function handler(req: Request): Promise<Response> {
  //...
  if (reqUrl.search("users") > -1) {
    //...

    if (method === "POST") {
      const body = JSON.parse(await req.text());

      const users: User[] = body["users"];
      const respBody = await setUsers(users, ws);
      return new Response(JSON.stringify(respBody));
    }

    //..
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

//...

async function updateUser(
  id: number,
  userData: PartialUser,
  rows: GoogleSpreadsheetRow[],
) {
  const row = rows.find((v, _) => v.get("id") == id)!;
  row.assign(userData);

  await row.save();
}

Deno.serve(handler);
```

```bash
❯ curl -X POST http://localhost:8000/users \
     -H "Content-Type: application/json" \
     -d '{
          "users": [
              {
                  "firstName": "Eh",
                  "lastName": "Bee",
                  "email": "ab@fake.fake",
                  "id": 2
              }
          ]
     }' | jq
[
  {
    "firstName": "Eh",
    "lastName": "Bee",
    "email": "ab@fake.fake",
    "id": "2"
  }
]
```

![Screenshot with an arrow pointing towards the newly added row](/images/post_req.png)

We can also update a user using the http `PUT` method.

```bash
curl -X PUT http://localhost:8000/users/1 \
     -H "Content-Type: application/json" \
     -d '{
          "email": "alifb@fake.fake"
     }' | jq

{
  "message": "1 updated"
}
```

![Screenshot with an arrow pointing to the edited cell](/images/put_req.png)

We then add a `DELETE` method, to complete our CRUD implementation.

```ts
async function handler(req: Request): Promise<Response> {
 

  if (reqUrl.search("users") > -1) {
  //...

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

//...
Deno.serve(handler);
```

```bash
❯ curl -X DELETE "http://localhost:8000/users/2" | jq
 
{
  "message": "2 has been deleted"
}
```

![Screenshot showing that the row has been deleted](/images/del_req.png)

## Conclusion

This is a very simple barebones implementation but it shows how useful this can
be. I would not recommend using it in a real production web app, but you can use
it to automate a lot of data entry tasks.
