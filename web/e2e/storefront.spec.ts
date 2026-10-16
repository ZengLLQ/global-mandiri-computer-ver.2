import { test, expect } from "@playwright/test";

const routes = [
  { path: "/", titleFragment: "Global Mandiri Computer" },
  { path: "/shop", titleFragment: "Katalog" },
  { path: "/cart", titleFragment: "Keranjang" },
  { path: "/checkout", titleFragment: "Checkout" },
  { path: "/account", titleFragment: "Akun" },
  { path: "/login", titleFragment: "Masuk" },
  { path: "/register", titleFragment: "Daftar" },
  { path: "/about", titleFragment: "Tentang" },
  { path: "/contact", titleFragment: "Kontak" },
  { path: "/privacy", titleFragment: "Privasi" },
  { path: "/terms", titleFragment: "Syarat" },
];

for (const route of routes) {
  test(`Storefront route ${route.path} renders without console errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto(route.path, { waitUntil: "networkidle" });
    expect(response?.status()).toBeLessThan(400);

    // Verify header and footer are present
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();

    // Verify no unhandled console errors (filter out expected 401 for unauthenticated auth/me checks)
    const fatalErrors = consoleErrors.filter(
      (err) => !err.includes("401") && !err.includes("Unauthorized")
    );
    expect(fatalErrors).toEqual([]);
  });
}
