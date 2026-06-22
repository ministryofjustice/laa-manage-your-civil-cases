import { expect } from 'chai';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';
import path from 'path';
import { pathToFileURL } from 'url';

type ViewerUpdateHandler = (data: { viewerCount: number; firstViewerName?: string }) => void;

describe('caseViewerSocketMiddleware', () => {
  let dom: JSDOM;
  let socketHandlers: Record<string, (...args: any[]) => void>;

  const loadMiddleware = async (): Promise<void> => {
    const middlewarePath = path.resolve('src/middlewares/caseViewerSocketMiddleware.js');
    const middlewareUrl = pathToFileURL(middlewarePath).href;
    await import(`${middlewareUrl}?test=${Date.now()}`);
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  };

  beforeEach(async () => {
    dom = new JSDOM(`
      <meta name="user-email" content="viewer@example.com" />

      <div
        data-case-reference="HW-0000-0000"
        data-session-id="session-123"
        data-user-name="Specialist Provider">
      </div>

      <div class="govuk-grid-row mcc-alert-summary" id="case-viewer-alert-row" hidden>
        <div class="govuk-grid-column-two-thirds mcc-error-banner" id="case-viewer-alert-column" hidden>
          <div id="case-viewer-alert" class="govuk-!-margin-bottom-4" hidden>
            <div role="region" class="moj-alert moj-alert--warning" aria-label="warning: " data-module="moj-alert">
              <div class="moj-alert__content"></div>
            </div>
          </div>
        </div>
      </div>
    `);

    socketHandlers = {};
    const socketMock = {
      connected: true,
      on: (eventName: string, callback: (...args: any[]) => void) => {
        socketHandlers[eventName] = callback;
        return socketMock;
      },
      emit: sinon.stub()
    };

    const ioStub = sinon.stub().returns(socketMock);

    (globalThis as any).window = dom.window;
    (globalThis as any).document = dom.window.document;
    (dom.window as any).io = ioStub;
    (globalThis as any).window.io = ioStub;

    await loadMiddleware();
  });

  afterEach(() => {
    dom.window.dispatchEvent(new dom.window.Event('beforeunload'));
    dom.window.close();
    sinon.restore();
    delete (globalThis as any).window;
    delete (globalThis as any).document;
  });

  it('shows single viewer alert when one other user is viewing the case', () => {
    const handler = socketHandlers['viewers-updated'] as ViewerUpdateHandler;
    expect(handler).to.be.a('function');

    handler({ viewerCount: 2, firstViewerName: 'Alex Arnold Chamberlain' });

    expect(dom.window.document.getElementById('case-viewer-alert-row')?.hidden).to.equal(false);
    expect(dom.window.document.getElementById('case-viewer-alert-column')?.hidden).to.equal(false);
    expect(dom.window.document.getElementById('case-viewer-alert')?.hidden).to.equal(false);
    expect(dom.window.document.querySelector('#case-viewer-alert .moj-alert__heading')?.textContent).to.equal('Alex Arnold Chamberlain is currently viewing this case');
  });

  it('shows multiple viewer alert count and hides single alert for 2+ other users', () => {
    const handler = socketHandlers['viewers-updated'] as ViewerUpdateHandler;
    expect(handler).to.be.a('function');

    handler({ viewerCount: 4, firstViewerName: 'Alex Arnold Chamberlain' });

    expect(dom.window.document.querySelector('#case-viewer-alert .moj-alert__heading')?.textContent).to.equal('Multiple users are currently viewing this case');
  });

  it('hides viewer alert when no other users are viewing the case', () => {
    const handler = socketHandlers['viewers-updated'] as ViewerUpdateHandler;

    handler({ viewerCount: 1 });

    expect(dom.window.document.getElementById('case-viewer-alert-row')?.hidden).to.equal(true);
    expect(dom.window.document.getElementById('case-viewer-alert-column')?.hidden).to.equal(true);
    expect(dom.window.document.getElementById('case-viewer-alert')?.hidden).to.equal(true);
  });
});
