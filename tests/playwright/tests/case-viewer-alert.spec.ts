import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth } from '../utils/index.js';

test.describe('Case viewer alert', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);

    await page.route('**/socket.io/socket.io.js', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: ''
      });
    });
  });

  test('shows single viewer alert when the `viewers-updated` socketInstance, reports one other user', async ({ page, i18nSetup }) => {
    await page.addInitScript(() => {
      type SocketHandler = (payload?: { viewerCount: number; firstViewerName?: string }) => void;
      const handlers: Record<string, SocketHandler> = {};

      const socket = {
        connected: true,
        on(event: string, callback: SocketHandler) {
          handlers[event] = callback;

          if (event === 'viewers-updated') {
            setTimeout(() => {
              callback({ viewerCount: 2, firstViewerName: 'Alex Arnold Chamberlain' });
            }, 0);
          }

          return socket;
        },
        emit() {
          return undefined;
        }
      };

      (window as Window & { io?: () => typeof socket }).io = () => socket;
    });

    await page.goto(getClientDetailsUrlByStatus('new'));

    await expect(page.locator('#case-viewer-alert-row')).toBeVisible();
    await expect(page.locator('#viewer-alert-single')).toBeVisible();
    await expect(page.locator('#viewer-alert-multiple')).toBeHidden();
    await expect(page.locator('#viewer-alert-single .moj-alert__heading')).toHaveText('Alex Arnold Chamberlain is currently viewing this case');
  });
});
