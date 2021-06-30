import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  BetaKey,
  User,
} from '#src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_AN_EMAIL,
  MODEL_NOT_FOUND,
  INVALID_UUID,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createBetaKey,
  createUser,
  putBetaKeysId,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/betaKeys', () => {
  describe('/:betaKeyId', () => {
    describe('PUT', () => {
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
        it('update betaKey.email', async () => {
          const betaKey = await createBetaKey({
            createdById: user.id,
          });
          const email = 'user2@email.com';
          const {
            body: {
              action,
              data: {
                betaKeyId,
                email: returnedEmail,
              },
            },
            status,
          } = await putBetaKeysId(app, token, betaKey.id, {
            body: {
              email,
            },
          });
          await betaKey.reload();
          expect(action).toBe('PUT');
          expect(betaKey.email).toBe(email);
          expect(betaKeyId).toBe(betaKey.id);
          expect(returnedEmail).toBe(email);
          expect(status).toBe(200);
        });
        it('trim request.body.email', async () => {
          const betaKey = await createBetaKey({
            createdById: user.id,
          });
          const email = 'user2@email.com';
          const {
            body: {
              action,
              data: {
                betaKeyId,
                email: returnedEmail,
              },
            },
            status,
          } = await putBetaKeysId(app, token, betaKey.id, {
            body: {
              email: ` ${email} `,
            },
          });
          await betaKey.reload();
          expect(action).toBe('PUT');
          expect(betaKey.email).toBe(email);
          expect(betaKeyId).toBe(betaKey.id);
          expect(returnedEmail).toBe(email);
          expect(status).toBe(200);
        });
        it('set requesy.body.email to lowercase', async () => {
          const betaKey = await createBetaKey({
            createdById: user.id,
          });
          const email = 'user2@email.com';
          const {
            body: {
              action,
              data: {
                betaKeyId,
                email: returnedEmail,
              },
            },
            status,
          } = await putBetaKeysId(app, token, betaKey.id, {
            body: {
              email: email.toUpperCase(),
            },
          });
          await betaKey.reload();
          expect(action).toBe('PUT');
          expect(betaKey.email).toBe(email);
          expect(betaKeyId).toBe(betaKey.id);
          expect(returnedEmail).toBe(email);
          expect(status).toBe(200);
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.betaKeyId id not a UUIDv4', async () => {
          const {
            body,
            status,
          } = await putBetaKeysId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('beta key'));
          expect(status).toBe(400);
        });
        it('betaKey was not created by this user', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            role: 'admin',
            userName: 'user2',
          });
          const { id: betaKeyId } = await createBetaKey({
            userId: userTwo.id,
          });
          const {
            body,
            status,
          } = await putBetaKeysId(app, token, betaKeyId);
          expect(body.errors).toBe('you only can modify a beta key you have posted');
          expect(status).toBe(400);
        });
        it('betaKey.email !== null', async () => {
          const { id: betaKeyId } = await createBetaKey({
            createdById: user.id,
            email: 'user@email.com',
          });
          const {
            body,
            status,
          } = await putBetaKeysId(app, token, betaKeyId);
          expect(body.errors).toBe('you can\'t update an beta key if email is already defined');
          expect(status).toBe(400);
        });
        describe('a betaKey with email equal', () => {
          let betaKeyOne: BetaKey;

          beforeEach(async (done) => {
            try {
              betaKeyOne = await createBetaKey({
                createdById: user.id,
                email: 'user2@email.com',
              });
            } catch (err) {
              done(err);
            }
            done();
          });

          it('request.body.email already exist', async () => {
            const betaKeyTwo = await createBetaKey({
              createdById: user.id,
            });
            const {
              body,
              status,
            } = await putBetaKeysId(app, token, betaKeyTwo.id, {
              body: {
                email: betaKeyOne.email,
              },
            });
            expect(body.errors).toBe('this email is already used on a beta key');
            expect(status).toBe(400);
          });
          it('trimed request.body.email already exist', async () => {
            const betaKeyTwo = await createBetaKey({
              createdById: user.id,
            });
            const {
              body,
              status,
            } = await putBetaKeysId(app, token, betaKeyTwo.id, {
              body: {
                email: ` ${betaKeyOne.email} `,
              },
            });
            expect(body.errors).toBe('this email is already used on a beta key');
            expect(status).toBe(400);
          });
          it('request.body.email to upper case already exist', async () => {
            const betaKeyTwo = await createBetaKey({
              createdById: user.id,
            });
            const {
              body,
              status,
            } = await putBetaKeysId(app, token, betaKeyTwo.id, {
              body: {
                email: betaKeyOne.email.toUpperCase(),
              },
            });
            expect(body.errors).toBe('this email is already used on a beta key');
            expect(status).toBe(400);
          });
        });
        describe('a user is already register with', () => {
          let betaKeyId: string;
          let userTwo: User;

          beforeEach(async (done) => {
            try {
              const { user: createdUser } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const betaKey = await createBetaKey({
                createdById: user.id,
              });
              userTwo = createdUser;
              betaKeyId = betaKey.id;
            } catch (err) {
              done(err);
            }
            done();
          });

          it('request.body.email', async () => {
            const {
              body,
              status,
            } = await putBetaKeysId(app, token, betaKeyId, {
              body: {
                email: userTwo.email,
              },
            });
            expect(body.errors).toEqual({
              email: 'this email is already used with this email',
            });
            expect(status).toBe(400);
          });
          it('trim request.body.email', async () => {
            const {
              body,
              status,
            } = await putBetaKeysId(app, token, betaKeyId, {
              body: {
                email: ` ${userTwo.email} `,
              },
            });
            expect(body.errors).toEqual({
              email: 'this email is already used with this email',
            });
            expect(status).toBe(400);
          });
          it('request.body.email.toLowerCase()', async () => {
            const {
              body,
              status,
            } = await putBetaKeysId(app, token, betaKeyId, {
              body: {
                email: userTwo.email.toUpperCase(),
              },
            });
            expect(body.errors).toEqual({
              email: 'this email is already used with this email',
            });
            expect(status).toBe(400);
          });
        });
        describe('email', () => {
          it('is not send', async () => {
            const { id: betaKeyId } = await createBetaKey({
              createdById: user.id,
            });
            const {
              body,
              status,
            } = await putBetaKeysId(app, token, betaKeyId);
            expect(body.errors).toEqual({
              email: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const { id: betaKeyId } = await createBetaKey({
              createdById: user.id,
            });
            const {
              body,
              status,
            } = await putBetaKeysId(app, token, betaKeyId, {
              body: {
                email: 1234,
              },
            });
            expect(body.errors).toEqual({
              email: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const { id: betaKeyId } = await createBetaKey({
              createdById: user.id,
            });
            const {
              body,
              status,
            } = await putBetaKeysId(app, token, betaKeyId, {
              body: {
                email: '',
              },
            });
            expect(body.errors).toEqual({
              email: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('is not an email', async () => {
            const { id: betaKeyId } = await createBetaKey({
              createdById: user.id,
            });
            const {
              body,
              status,
            } = await putBetaKeysId(app, token, betaKeyId, {
              body: {
                email: 'not an email',
              },
            });
            expect(body.errors).toEqual({
              email: FIELD_SHOULD_BE_AN_EMAIL,
            });
            expect(status).toBe(400);
          });
        });
      });
      describe('should return status 404 if', () => {
        it('beta key not found', async () => {
          const {
            body,
            status,
          } = await putBetaKeysId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('beta key'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
