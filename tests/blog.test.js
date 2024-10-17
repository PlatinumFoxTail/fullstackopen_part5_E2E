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
    test('a user can delete own created blogs', async ({ page }) => {
      console.log("Start test for deleting blog.")
      
      //creating a new blog
      await page.click('button:has-text("new blog")')
      console.log("Clicking 'new blog' button.")
      
      await page.fill('input[placeholder="title"]', 'BS Blog')
      await page.fill('input[placeholder="author"]', 'Mr. BS')
      await page.fill('input[placeholder="url"]', 'www.bsblog.com')
      await page.click('button[type="submit"]')
      console.log("Filled in blog details and submitted the blog.")
      
      //ensuring blog is visible and created
      const createdBlog = await page.locator('.blog-summary', { hasText: 'BS Blog Mr. BS' }).first()
      await expect(createdBlog).toBeVisible()
      console.log("Created blog visible:", await createdBlog.isVisible())
      
      //veriifying that view button is visible and can click it
      const viewButton = createdBlog.locator('button:has-text("view")')
      const isViewButtonVisible = await viewButton.isVisible()
      console.log("'view' button visible?:", isViewButtonVisible)
      
      if (!isViewButtonVisible) {
        console.error("View button not visible")
        throw new Error("View button not visible.")
      }
      
      await viewButton.click()
      console.log("Clicking'view' button to see blog details.")
      
      //wait to ensure blog details rendered
      await page.waitForTimeout(1000)
      
      //ensure that blog details with the remove button is visible
      const blogDetails = createdBlog.locator('.blog-details')
      const isDetailsVisible = await blogDetails.isVisible()
      console.log("Blog details visible after clicking 'view'?:", isDetailsVisible)
      
      if (!isDetailsVisible) {
        console.error("Blog details are not visible after clicking 'view'")
        throw new Error("Blog details are not visible.")
      }
      
      await expect(blogDetails).toBeVisible()
      
      //click remove button
      const deleteButton = blogDetails.locator('button:has-text("remove")')
      await expect(deleteButton).toBeVisible()
      console.log("Delete button is visible:", await deleteButton.isVisible())
      
      //handle confirmation dialog
      page.once('dialog', async dialog => {
        console.log("Dialog message:", dialog.message())
        await expect(dialog.message()).toContain('Remove blog BS Blog by Mr. BS?')
        await dialog.accept()
      })
      
      await deleteButton.click()
      console.log("Clicked the 'remove' button.")
      
      //check blog has been created
      const deletedBlog = await page.locator('.blog-summary').filter({ hasText: 'BS Blog Mr. BS' })
      await expect(deletedBlog).toHaveCount(0)
      console.log("Deleted blog is no longer visible.")
    })
  })
})