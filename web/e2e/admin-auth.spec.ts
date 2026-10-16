import { test, expect } from "@playwright/test";

test.describe("Admin Foundations & Authentication", () => {
  test("Unauthenticated user accessing /admin is redirected to /admin/login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/admin/login", { timeout: 10000 });
    expect(page.url()).toContain("/admin/login");

    // Check login page elements using exact roles
    await expect(page.getByRole("heading", { name: "GMC Back-Office" })).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toContainText("Masuk ke Sistem");
  });

  test("Login fails with invalid credentials and displays error message", async ({ page }) => {
    await page.goto("/admin/login");

    await page.fill("input[type='email']", "admin@globalmandiri.com");
    await page.fill("input[type='password']", "WrongPassword123!");
    await page.click("button[type='submit']");

    // Should stay on login and show error message
    const errorMsg = page.getByText("email atau kata sandi tidak valid").first();
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
  });

  test("Login succeeds with valid credentials, navigates to dashboard, account settings, and logs out", async ({ page }) => {
    await page.goto("/admin/login");

    // Enter correct credentials
    await page.fill("input[type='email']", "admin@globalmandiri.com");
    await page.fill("input[type='password']", "AdminGMC2026!Secure");
    await page.click("button[type='submit']");

    // Wait for redirect to /admin
    await page.waitForURL("**/admin", { timeout: 15000 });
    expect(page.url()).toMatch(/\/admin$/);

    // Verify Dashboard UI elements
    await expect(page.locator("aside").getByText("GMC Back-Office")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Selamat datang/ })).toBeVisible();
    await expect(page.getByText("Pesanan Menunggu", { exact: true })).toBeVisible();
    await expect(page.getByText("Stok Menipis", { exact: true })).toBeVisible();

    // Verify Command Palette triggers on ⌘K button
    const cmdkBtn = page.locator("button:has-text('⌘K')");
    await expect(cmdkBtn).toBeVisible();
    await cmdkBtn.click();
    await expect(page.getByText("Navigasi Menu")).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");

    // Navigate to Account settings
    await page.goto("/admin/account");
    await page.waitForURL("**/admin/account", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Pengaturan Akun & Keamanan" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ganti Kata Sandi" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Verifikasi Dua Faktor (2FA)" })).toBeVisible();

    // Perform Logout via button
    const logoutBtn = page.locator("button[title='Keluar']");
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Should redirect back to /admin/login
    await page.waitForURL("**/admin/login", { timeout: 10000 });
    expect(page.url()).toContain("/admin/login");
  });
});
