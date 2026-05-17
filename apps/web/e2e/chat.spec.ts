import { test, expect } from "@playwright/test";

test("persists a sent message across reload", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Morning team")).toBeVisible();
  await page.getByLabel("Message").fill("Persistence check");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Persistence check")).toBeVisible();

  await page.reload();

  await expect(page.getByText("Persistence check")).toBeVisible();
});
