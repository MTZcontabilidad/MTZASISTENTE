import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        
        // Bypass Dev Selector if present
        const devSelector = page.locator('button:has-text("Iniciar como Invitado")');
        if (await devSelector.isVisible()) {
            await devSelector.click();
        }
        
        // Bypass Welcome if present
        const startButton = page.locator('button:has-text("Comenzar con Arise")');
        if (await startButton.isVisible()) {
            await startButton.click();
        }
    });

    test('Send a message and receive response', async ({ page }) => {
        const chatInput = page.getByPlaceholder('Escribe tu mensaje...');
        
        // 1. Send "Hola"
        await chatInput.fill('Hola');
        await page.locator('button[aria-label="Enviar mensaje"]').click();

        // 2. Wait for response
        // Look for a bubble that is NOT the user's
        const responseBubble = page.locator('.chat-bubble.bot').first();
        await expect(responseBubble).toBeVisible({ timeout: 10000 });
        
        // 3. Check content
        await expect(responseBubble).not.toBeEmpty();
    });
});
