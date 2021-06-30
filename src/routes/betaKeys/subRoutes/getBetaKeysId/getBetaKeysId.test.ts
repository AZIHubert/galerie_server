import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  User,
} from '#src/db/models';

import {
  MODEL_NOT_FOUND,
  INVALID_UUID,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createBetaKey,
  createUser,
  getBetaKeysId,
  testBetaKey,
  testUser,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/betaKeys', () => {
  describe('/:betaKeyId', () => {
    beforeAll(() => {
      sequelize = initSequelize();
      app = initApp();
    });

    beforeEach(async (done) => {
      try {
        await sequelize.sync({ force: true });
        const {
          user: createdUser,
        } = await createUser({
          role: 'admin',
        });
        user = createdUser;
        const jwt = signAuthToken(user);
        token = jwt.token;
      } catch (err) {
        done(err);
      }
      done();
    });

    afterAll(async (done) => {
      try {
        await sequelize.sync({ force: true });
        await sequelize.close();
      } catch (err) {
        done(err);
      }
      app.close();
      done();
    });

    describe('should return status 200 and', () => {
      it('return betaKey', async () => {
        const betaKey = await createBetaKey({});
        const {
          body: {
            action,
            data: {
              betaKey: returnedBetaKey,
            },
          },
          status,
        } = await getBetaKeysId(app, token, betaKey.id);
        expect(action).toBe('GET');
        expect(status).toBe(200);
        testBetaKey(returnedBetaKey, betaKey);
      });
      it('include createdBy', async () => {
        const { id: betaKeyId } = await createBetaKey({
          createdById: user.id,
        });
        const {
          body: {
            data: {
              betaKey: {
                createdBy,
              },
            },
          },
        } = await getBetaKeysId(app, token, betaKeyId);
        expect(createdBy.hasNewNotifications).toBeUndefined();
        testUser(createdBy, user);
      });
      it('include user', async () => {
        const { user: userTwo } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        const { id: betaKeyId } = await createBetaKey({
          userId: userTwo.id,
        });
        const {
          body: {
            data: {
              betaKey,
            },
          },
        } = await getBetaKeysId(app, token, betaKeyId);
        expect(betaKey.user.hasNewNotifications).toBeUndefined();
        testUser(betaKey.user, userTwo);
      });
    });
    describe('should return status 400', () => {
      it('request.betaKeyId is not a UUIDv4', async () => {
        const {
          body,
          status,
        } = await getBetaKeysId(app, token, '100');
        expect(body.errors).toBe(INVALID_UUID('beta key'));
        expect(status).toBe(400);
      });
    });
    describe('should return status 404 if', () => {
      it('betaKey not found', async () => {
        const {
          body,
          status,
        } = await getBetaKeysId(app, token, uuidv4());
        expect(body.errors).toBe(MODEL_NOT_FOUND('beta key'));
        expect(status).toBe(404);
      });
    });
  });
});
