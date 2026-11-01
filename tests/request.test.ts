import { expect, it } from "vitest";
import { readJson } from "../supabase/functions/_shared/body";
it("bounds streamed request bodies even without a trustworthy content-length", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    body: JSON.stringify({ question: "x".repeat(6000) }),
  });
  await expect(readJson(request)).rejects.toMatchObject({ status: 413 });
});
it("rejects malformed JSON and arrays, accepts a bounded object", async () => {
  for (const body of ["no json", "[]", "null"])
    await expect(
      readJson(new Request("https://example.test", { method: "POST", body })),
    ).rejects.toMatchObject({ status: 400 });
  expect(
    await readJson(
      new Request("https://example.test", {
        method: "POST",
        body: '{"consent":true}',
      }),
    ),
  ).toEqual({ consent: true });
});
