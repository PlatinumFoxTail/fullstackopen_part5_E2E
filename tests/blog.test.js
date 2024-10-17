const { test, expect, beforeEach, describe } = require('@playwright/test')

describe('Blog app', () => {
  beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('Login form shown', async ({ page }) => {
    const loginTitle = await page.locator('text=Log in to application')
    await expect(loginTitle).toBeVisible()

    const usernameInput = await page.locator('input[name="Username"]')
    await expect(usernameInput).toBeVisible()

    const passwordInput = await page.locator('input[name="Password"]')
    await expect(passwordInput).toBeVisible()

    const loginButton = await page.locator('button[type="submit"]')
    await expect(loginButton).toBeVisible()
  })
})