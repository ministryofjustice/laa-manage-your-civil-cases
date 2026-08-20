import { test, expect } from '../fixtures/index.js';
import { setupAuth } from '../utils/index.js';

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('feedback component switches sections and resets on cancel', async ({ page }) => {
  // Navigate to the new cases page
  await page.goto('/cases/new');

  const initial = page.locator('[data-feedback-section="initial"]');
  const messageYes = page.locator('[data-feedback-section="messageYes"]');
  const messageNo = page.locator('[data-feedback-section="messageNo"]');
  const final = page.locator('[data-feedback-section="final"]');

  // Assert the different section of feedback component in are in correct hidden/shown state
  await expect(initial).toBeVisible();
  await expect(messageYes).toBeHidden();
  await expect(messageNo).toBeHidden();
  await expect(final).toBeHidden();

  // Trigger `Yes` comment input  and cancel
  await initial.locator('[data-feedback-role="initial-trigger-yes"]').click();
  await expect(messageYes).toBeVisible();
  const commentYes = messageYes.locator('textarea[name="satisfactionComment"]');
  await commentYes.fill('A positive comment');
  await messageYes.locator('[data-feedback-role="cancel"]').click();

  // Trigger `No` comment input and cancel
  await initial.locator('[data-feedback-role="initial-trigger-no"]').click();
  await expect(messageNo).toBeVisible();
  const commentNo = messageNo.locator('textarea[name="satisfactionComment"]');
  await commentNo.fill('A negative comment');
  await messageNo.locator('[data-feedback-role="cancel"]').click();

  // Assert back to initial state and comment boxes are cleared
  await expect(initial).toBeVisible();
  await expect(commentYes).toHaveValue('');
  await expect(commentNo).toHaveValue('');
  await expect(messageYes).toBeHidden();
});

test('feedback component submits satisfaction and comment', async ({ page }) => {
  // Navigate to the new cases page
  await page.goto('/cases/new');

  await page.route('**/feedback', async (route) => {
    await route.fulfill({ status: 200 });
  });

  const initial = page.locator('[data-feedback-section="initial"]');
  const messageNo = page.locator('[data-feedback-section="messageNo"]');
  const final = page.locator('[data-feedback-section="final"]');

  // Trigger `No` comment input and send
  await initial.locator('[data-feedback-role="initial-trigger-no"]').click();
  await expect(messageNo).toBeVisible();
  await messageNo.locator('textarea[name="satisfactionComment"]').fill('A negative comment');
  const requestPromise = page.waitForRequest('**/feedback');
  await messageNo.locator('[data-feedback-role="submit-text"]').click();
  const request = await requestPromise;

  // Assert POST has happened and we get final Thank you message. 
  expect(request.method()).toBe('POST');
  expect(request.postDataJSON()).toEqual(expect.objectContaining({
    satisfaction: 'No',
    comment: 'A negative comment'
  }));
  await expect(final).toBeVisible();
  await expect(messageNo).toBeHidden();
});