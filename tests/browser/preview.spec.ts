import { expect, test } from "@playwright/test";
test("empty journal, native-only recording, settings and unconfigured services are honest", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("Your story starts outside")).toBeVisible();
  await page.getByRole("button", { name: "Record an activity" }).click();
  await expect(
    page.getByRole("button", { name: "Start activity" }),
  ).toBeDisabled();
  await page.getByRole("tab", { name: "Activities" }).click();
  await expect(page.getByText("A clean slate")).toBeVisible();
  await page.getByRole("tab", { name: "Profile" }).click();
  await page.getByRole("button", { name: "Settings & privacy" }).click();
  await page.getByRole("button", { name: "light", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Settings & privacy" }),
  ).toBeVisible();
  await page.goto("/auth");
  await page.getByLabel("Email", { exact: true }).fill("test@example.test");
  await page.getByLabel("Password", { exact: true }).fill("testpassword123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText(/Connect Supabase using/)).toBeVisible();
  await page.screenshot({
    path: "test-results/preview-auth.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("home preview renders at phone and tablet widths without invented workouts", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Your story starts outside")).toBeVisible();
  await page.screenshot({
    path: "test-results/preview-home-phone.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByText("Your story starts outside")).toBeVisible();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(horizontalOverflow).toBe(false);
});
