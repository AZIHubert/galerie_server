import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  User,
} from '#src/db/models';

import * as email from '#src/helpers/email';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createBetaKey,
  postBetaKeysIdSend,
  createUser,
} from '#src/helpers/test';

import initApp from '#src/server';

const emailMocked = jest.spyOn(email, 'sendBetaKey');
let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/betaKeys', () => {
  describe('/:betaKeyId', () => {
    describe('/send', () => {
      describe('POST', () => {
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
              role: 'superAdmin',
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

        describe('should return status 204 and', () => {
          it('send an email', async () => {
            const betaKey = await createBetaKey({
              email: 'user2@email.com',
            });
            const {
              status,
            } = await postBetaKeysIdSend(app, token, betaKey.id);
            expect(status).toBe(204);
            expect(emailMocked).toHaveBeenCalledTimes(1);
            expect(emailMocked).toHaveBeenCalledWith(betaKey.email, betaKey.code);
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.betaKeyId is not a UUIDv4', async () => {
            const {
              body,
              status,
            } = await postBetaKeysIdSend(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('beta key'));
            expect(status).toBe(400);
          });
          it('betaKey.email === null', async () => {
            const { id: betaKeyId } = await createBetaKey({});
            const {
              body,
              status,
            } = await postBetaKeysIdSend(app, token, betaKeyId);
            expect(body.errors).toBe('no email registered');
            expect(status).toBe(400);
          });
          it('betaKey.userId !== null', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { id: betaKeyId } = await createBetaKey({
              email: userTwo.email,
              userId: userTwo.id,
            });
            const {
              body,
              status,
            } = await postBetaKeysIdSend(app, token, betaKeyId);
            expect(body.errors).toBe('this beta key is already used');
            expect(status).toBe(400);
          });
        });
        describe('should return status 404 if', () => {
          it('betaKey not found', async () => {
            const {
              body,
              status,
            } = await postBetaKeysIdSend(app, token, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('beta key'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
