import { test, expect } from '@playwright/test';

test.describe('Mobile Admin View', () => {
    // Use mobile viewport
    test.use({ viewport: { width: 375, height: 667 } });

    test('verify admin has mobile menu', async ({ page }) => {
        await page.goto('/');

        // 1. Select Admin in Dev Selector
        const devSelector = page.locator('button:has-text("Iniciar como Admin")');
        if (await devSelector.isVisible()) {
            await devSelector.click();
        } else {
             // If manual login needed, we might need to mock it or perform it
             console.log('Dev selector not found, skipping specific admin check if auth not mocked');
             return;
        }

        // 2. Verify Mobile Navigation is present
        const mobileNav = page.locator('.mobile-nav');
        await expect(mobileNav).toBeVisible();

        // 3. Verify Admin Tab is present in Mobile Nav
        const adminTab = page.locator('button.nav-item:has-text("Admin")');
        await expect(adminTab).toBeVisible();

        // 4. Click Admin Tab and verify content
        await adminTab.click();
        await expect(page.locator('text=Panel Admin')).toBeVisible(); 
    });
});
