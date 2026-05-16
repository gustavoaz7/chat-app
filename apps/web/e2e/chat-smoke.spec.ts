import { expect, test } from "@playwright/test";

test("send message flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Launch Room")).toBeVisible();
  await expect(page.getByText("Morning team. Today's rollout is still on track.")).toBeVisible();

  await page.getByLabel("Message").fill("hello from e2e");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText("hello from e2e")).toBeVisible();
});
