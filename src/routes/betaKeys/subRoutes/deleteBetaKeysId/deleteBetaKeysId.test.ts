import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  BetaKey,
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
  deleteBetaKeysId,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/betaKeys', () => {
  describe('/:betaKeyId', () => {
    describe('DELETE', () => {
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

      describe('should return status 200 and', () => {
        it('destroy the beta key', async () => {
          const betaKey = await createBetaKey({
            createdById: user.id,
          });
          const {
            body: {
              action,
              data: {
                betaKeyId,
              },
            },
            status,
          } = await deleteBetaKeysId(app, token, betaKey.id);
          const deletedBetaKey = await BetaKey.findByPk(betaKey.id);
          expect(action).toBe('DELETE');
          expect(betaKeyId).toBe(betaKey.id);
          expect(deletedBetaKey).toBeNull();
          expect(status).toBe(200);
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.betaKeyId is not a UUIDv4', async () => {
          const {
            body,
            status,
          } = await deleteBetaKeysId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('beta key'));
          expect(status).toBe(400);
        });
        it('betaKey was not created by current user', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            role: 'superAdmin',
            userName: 'user2',
          });
          const { id: betaKeyId } = await createBetaKey({
            createdById: userTwo.id,
          });
          const {
            body,
            status,
          } = await deleteBetaKeysId(app, token, betaKeyId);
          expect(body.errors).toBe('you are not allow to delete this beta key');
          expect(status).toBe(400);
        });
        it('betaKey is used by a user', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: betaKeyId } = await createBetaKey({
            createdById: user.id,
            userId: userTwo.id,
          });
          const {
            body,
            status,
          } = await deleteBetaKeysId(app, token, betaKeyId);
          expect(body.errors).toBe('you are not allow to delete this beta key');
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('betaKey not found', async () => {
          const {
            body,
            status,
          } = await deleteBetaKeysId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('beta key'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
