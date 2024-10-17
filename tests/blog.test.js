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

  test('fails with wrong credentials', async ({ page }) => {
    await page.fill('input[name="Username"]', 'mluu')
    await page.fill('input[name="Password"]', 'sala')
    await page.click('button[type="submit"]')
  
    const errorMessage = await page.locator('text=wrong credentials')
    await expect(errorMessage).toBeVisible()

    const loginForm = await page.locator('text=Log in to application')
    await expect(loginForm).toBeVisible()
  })

  describe('when logged in', () => {
    beforeEach(async ({ page }) => {
      await page.fill('input[name="Username"]', 'mluukkai')
      await page.fill('input[name="Password"]', 'salainen')
      await page.click('button[type="submit"]')

      const loggedInUser = await page.locator('text=blogs')
      await expect(loggedInUser).toBeVisible()
    })
          
    test('creating a new blog', async ({ page }) => {
      await page.click('button:has-text("new blog")')
      
      await page.fill('input[placeholder="title"]', 'The Best Blog')
      await page.fill('input[placeholder="author"]', 'Mr. Perfect')
      await page.fill('input[placeholder="url"]', 'www.blog.com')
      
      await page.click('button[type="submit"]')
      
      const newBlog = await page.locator('.blog-summary').filter({ hasText: 'The Best Blog Mr. Perfect' }).first()
      await expect(newBlog).toBeVisible()
    })

    test('liking a blog possible', async ({ page }) => {
      await page.click('button:has-text("new blog")')
      await page.fill('input[placeholder="title"]', 'Next Best Blog')
      await page.fill('input[placeholder="author"]', 'Mr. Almost Perfect')
      await page.fill('input[placeholder="url"]', 'www.blog2.com')
      await page.click('button[type="submit"]')
        
      const viewButton = await page.locator('button', { hasText: 'view' }).first()
      await viewButton.click()
  
      const likeButton = await page.locator('button', { hasText: 'like' }).first()
      const likesCount = await page.locator('.blog-likes').first()
        
      const initialLikesText = await likesCount.innerText()
      const initialLikes = parseInt(initialLikesText.split(' ')[0])
  
      await likeButton.click()
      
      await expect(likesCount).toContainText(`${initialLikes + 1} likes`)
    })
  })
})