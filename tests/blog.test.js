const { test, expect, beforeEach, describe } = require('@playwright/test')

/*test.use({
  launchOptions: {
    headless: false,
    slowMo: 1000,
  },
})*/

test('remove button not seen by user, that did not create the blog', async ({ page, request }) => {
  //resetting database
  await request.post('http://localhost:3003/api/testing/reset')

  //mluukkai user created
  await request.post('http://localhost:3003/api/users', {
    data: {
      name: 'Matti Luukkainen',
      username: 'mluukkai',
      password: 'salainen'
    }
  })

  //mluukkai loggin in
  await page.goto('http://localhost:5173')
  await page.fill('input[name="Username"]', 'mluukkai')
  await page.fill('input[name="Password"]', 'salainen')
  await page.click('button[type="submit"]')

  //mluukkai crating blog
  await page.click('button:has-text("new blog")')
  await page.fill('input[placeholder="title"]', 'My secret blog')
  await page.fill('input[placeholder="author"]', 'Mr. Secret')
  await page.fill('input[placeholder="url"]', 'www.secret.com')
  await page.click('button[type="submit"]')

  const newBlog = await page.locator('.blog').filter({ hasText: 'My secret blog Mr. Secret' }).first()
  await expect(newBlog).toBeVisible()

  //log out mluukkai
  await page.click('button:has-text("logout")')

  //curiousape user created
  const response = await request.post('http://localhost:3003/api/users', {
    data: {
      name: 'George Curious',
      username: 'curiousape',
      password: 'password123'
    }
  })

  console.log('user creation response status:', response.status())
  console.log('user creation response body:', await response.body())

  //logging in curiousape
  await page.goto('http://localhost:5173')
  await page.fill('input[name="Username"]', 'curiousape')
  await page.fill('input[name="Password"]', 'password123')
  await page.click('button[type="submit"]')

  //curiouspae searching for blog created by mluukkai
  const blogCuriousApe = await page.locator('.blog').filter({ hasText: 'My secret blog Mr. Secret' }).first()
  await expect(blogCuriousApe).toBeVisible()

  const viewButton = blogCuriousApe.locator('button:has-text("view")')
  await viewButton.click()

  //checking remove button not visible for curiousape
  const removeButton = blogCuriousApe.locator('button:has-text("remove")')
  await expect(removeButton).toHaveCount(0)
})


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
      await page.fill('input[placeholder="title"]', 'Too good blog')
      await page.fill('input[placeholder="author"]', 'Mr. Almost Perfect')
      await page.fill('input[placeholder="url"]', 'www.blog2.com')
      await page.click('button[type="submit"]')

      const newBlog = await page.locator('.blog').filter({ hasText: 'Too good blog Mr. Almost Perfect' }).first()
      await expect(newBlog).toBeVisible()
        
      const viewButton = newBlog.locator('button:has-text("view")')
      await viewButton.click()
  
      const likeButton = newBlog.locator('button:has-text("like")')
      const likesCount = newBlog.locator('.blog-likes')
      await expect(likesCount).toBeVisible()
        
      const initialLikesText = await likesCount.innerText()
      const initialLikes = parseInt(initialLikesText.split(' ')[0])
  
      await likeButton.click()
      
      await expect(likesCount).toContainText(`${initialLikes + 1} likes`)
    })

    test('removing a blog is possible if the user created it', async ({ page }) => {
      await page.click('button:has-text("new blog")')
      await page.fill('input[placeholder="title"]', 'Forget blog')
      await page.fill('input[placeholder="author"]', 'Mr. Remove')
      await page.fill('input[placeholder="url"]', 'www.remove.com')
      await page.click('button[type="submit"]')
      
      const blog = await page.locator('.blog-summary').filter({ hasText: 'Forget blog Mr. Remove' }).first()
      await expect(blog).toBeVisible()

      const viewButton = blog.locator('button:has-text("view")')
      await viewButton.click()

      page.once('dialog', async dialog => {
        console.log('Dialog message:', dialog.message())
        expect(dialog.message()).toContain('Remove blog Forget blog by Mr. Remove?')
        await dialog.accept()
        console.log('Dialog accepted')
      })
  
      const removeButton = await page.locator('button', { hasText: 'remove' })
      await removeButton.click()
      console.log('remove button clicked')

      await expect(blog).not.toBeVisible()
      console.log('Blog removed')
    })  
  })
})
