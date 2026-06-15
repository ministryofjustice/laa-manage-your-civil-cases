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
    const middlewareUrl = pathToFileURL(
      path.resolve(process.cwd(), 'src/middlewares/caseViewerSocketMiddleware.ts')
    ).href;
    await import(`${middlewareUrl}?test=${Date.now()}`);
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  };

  beforeEach(async () => {
    dom = new JSDOM(
      `<!doctype html>
      <html>
        <head>
          <meta name="user-email" content="viewer@example.com" />
        </head>
        <body>
          <div data-case-reference="HW-0000-0000" data-session-id="session-123" data-user-name="Specialist Provider"></div>
          <div id="case-viewer-alert-row" hidden></div>
          <div id="case-viewer-alert-column" hidden></div>
          <div id="case-viewer-alert" hidden></div>
          <div id="viewer-alert-single" hidden>
            <h2 class="moj-alert__heading"></h2>
          </div>
          <div id="viewer-alert-multiple" hidden>
            <p class="moj-alert__paragraph"></p>
          </div>
        </body>
      </html>`,
      { url: 'http://localhost:3000' }
    );

    socketHandlers = {};
    const socketMock = {
      connected: false,
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
    expect(dom.window.document.getElementById('viewer-alert-single')?.hidden).to.equal(false);
    expect(dom.window.document.getElementById('viewer-alert-multiple')?.hidden).to.equal(true);
    expect(
      dom.window.document.querySelector('#viewer-alert-single .moj-alert__heading')?.textContent
    ).to.equal('Alex Arnold Chamberlain is currently viewing this case');
  });

  it('shows multiple viewer alert count and hides single alert for 2+ other users', () => {
    const handler = socketHandlers['viewers-updated'] as ViewerUpdateHandler;
    expect(handler).to.be.a('function');

    handler({ viewerCount: 4 });

    expect(dom.window.document.getElementById('viewer-alert-single')?.hidden).to.equal(true);
    expect(dom.window.document.getElementById('viewer-alert-multiple')?.hidden).to.equal(false);
    expect(
      dom.window.document.querySelector('#viewer-alert-multiple .moj-alert__paragraph')?.textContent
    ).to.equal('Multiple users are currently viewing this case');
  });
});
