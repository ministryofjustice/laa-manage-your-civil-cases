import { strict as assert } from 'assert';
import sinon from 'sinon';
import { getTheOtherViewerName } from '#utils/server/caseViewerService.js';

describe('caseViewerService', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns the earliest joined other viewer name for the current session', async () => {
    const redisClient = {
      hGetAll: sinon.stub().resolves({
        'session-1': JSON.stringify({
          userId: 'user-1',
          sessionId: 'session-1',
          joinedAt: 1000,
          userName: 'First Person'
        }),
        'session-2': JSON.stringify({
          userId: 'user-2',
          sessionId: 'session-2',
          joinedAt: 2000,
          userName: 'Second Person'
        }),
        'session-3': JSON.stringify({
          userId: 'user-3',
          sessionId: 'session-3',
          joinedAt: 3000,
          userName: 'Third Person'
        })
      })
    } as any;

    const result = await getTheOtherViewerName(redisClient, 'HW-0000-0000', 'session-2');

    assert.equal(result, 'First Person');
  });

  it('returns undefined when no other viewer exists', async () => {
    const redisClient = {
      hGetAll: sinon.stub().resolves({
        'session-2': JSON.stringify({
          userId: 'user-2',
          sessionId: 'session-2',
          joinedAt: 2000,
          userName: 'Second Person'
        })
      })
    } as any;

    const result = await getTheOtherViewerName(redisClient, 'HW-0000-0000', 'session-2');

    assert.equal(result, undefined);
  });
});

