import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { getCrossStackOutput } from "./utils";

const fixturesPath = path.join(__dirname, "fixtures");

let url: string;

beforeEach(async () => {
  url = await getCrossStackOutput(process.env.STACK_OUTPUT_KEY!);
});

test("ListWidgets Looks Good", async () => {
  const expected = JSON.parse(fs
    .readFileSync(path.join(fixturesPath, "list-widgets-response.json"))
    .toString());
  const res = await axios.get(`${url}/widgets`, {
    headers: { "Authorization": "secret" }
  });
  expect(expected).toStrictEqual(res.data);
});

test("ListWidgets Unauthorized", async () => {
  let status: number;
  try {
    await axios.get(`${url}/widgets`, {
      headers: { "Authorization": "nope" }
    });
  } catch (err) {
    status = err.response.status;
    expect(status).toBe(403);
  }
});
