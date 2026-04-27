import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('should match homepage snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('should match registration page snapshot', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveScreenshot('registration-page.png');
  });

  test('should match dashboard snapshot', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test_token');
    });
    await page.reload();
    await expect(page).toHaveScreenshot('dashboard.png');
  });

  test('should match waste submission form snapshot', async ({ page }) => {
    await page.goto('/submit-waste');
    await expect(page).toHaveScreenshot('waste-submission-form.png');
  });

  test('should match incentive list snapshot', async ({ page }) => {
    await page.goto('/incentives');
    await expect(page).toHaveScreenshot('incentive-list.png');
  });

  test('should match admin dashboard snapshot', async ({ page }) => {
    await page.goto('/admin');
    await page.evaluate(() => {
      localStorage.setItem('user_role', 'admin');
    });
    await page.reload();
    await expect(page).toHaveScreenshot('admin-dashboard.png');
  });
});
