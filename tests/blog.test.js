const { test, expect, beforeEach, describe } = require('@playwright/test')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
        data: {
          name: 'Matti Luukkainen',
          username: 'mluukkai',
          password: 'salainen'
        }
      })
    
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

  describe('when logged in', () => {
      test('succeeds with correct credentials', async ({ page }) => {
          await page.fill('input[name="Username"]', 'mluukkai')
          await page.fill('input[name="Password"]', 'salainen')
          await page.click('button[type="submit"]')

          const loggedInUser = await page.locator('text=blogs')
          await expect(loggedInUser).toBeVisible()
      })

      test('fails with wrong credentials', async ({ page }) => {
          await page.fill('input[name="Username"]', 'mluu')
          await page.fill('input[name="Password"]', 'sala')
          await page.click('button[type="submit"]')
    
          const errorMessage = await page.locator('text=wrong credentials')
          await expect(errorMessage).toBeVisible()

          const loginForm = await page.locator('text=Log in to application')
          await expect(loginForm).toBeVisible()
      })
    })
})