import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '#src/helpers/initEnv';

import {
  BetaKey,
  User,
} from '#src/db/models';

import {
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_AN_EMAIL,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createBetaKey,
  createUser,
  postBetaKey,
  testBetaKey,
  testUser,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/betaKeys', () => {
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

    describe('should return status 200 and', () => {
      it('create a betaKey', async () => {
        const {
          body: {
            action,
            data: {
              betaKey,
            },
          },
          status,
        } = await postBetaKey(app, token);
        const createdBetaKey = await BetaKey.findByPk(betaKey.id) as BetaKey;
        expect(action).toBe('POST');
        expect(status).toBe(200);
        expect(createdBetaKey).not.toBeNull();
        expect(createdBetaKey.email).toBeNull();
        expect(createdBetaKey.userId).toBeNull();
        expect(betaKey.createdBy.hasNewNotifications).toBeUndefined();
        testBetaKey(betaKey);
        testUser(betaKey.createdBy, user);
      });
      it('create a betaKey with email', async () => {
        const email = 'user2@email.com';
        const {
          body: {
            data: {
              betaKey,
            },
          },
        } = await postBetaKey(app, token, {
          body: {
            email,
          },
        });
        const createdBetaKey = await BetaKey.findByPk(betaKey.id) as BetaKey;
        expect(betaKey.email).toBe(email);
        expect(createdBetaKey.email).toBe(email);
      });
      it('create a betaKey without an email if request.body.email === \'\'', async () => {
        const {
          body: {
            data: {
              betaKey,
            },
          },
        } = await postBetaKey(app, token, {
          body: {
            email: '',
          },
        });
        const createdBetaKey = await BetaKey.findByPk(betaKey.id) as BetaKey;
        expect(betaKey.email).toBeNull();
        expect(createdBetaKey.email).toBeNull();
      });
      it('should trim email', async () => {
        const email = 'user2@email.com';
        const {
          body: {
            data: {
              betaKey,
            },
          },
        } = await postBetaKey(app, token, {
          body: {
            email: ` ${email} `,
          },
        });
        const createdBetaKey = await BetaKey.findByPk(betaKey.id) as BetaKey;
        expect(betaKey.email).toBe(email);
        expect(createdBetaKey.email).toBe(email);
      });
      it('should set req.body.email to lowercase', async () => {
        const email = 'user2@email.com';
        const {
          body: {
            data: {
              betaKey,
            },
          },
        } = await postBetaKey(app, token, {
          body: {
            email: email.toUpperCase(),
          },
        });
        const createdBetaKey = await BetaKey.findByPk(betaKey.id) as BetaKey;
        expect(betaKey.email).toBe(email);
        expect(createdBetaKey.email).toBe(email);
      });
    });
    describe('should return status 400 if', () => {
      describe('a betaKey with email equal', () => {
        let betaKey: BetaKey;

        beforeEach(async (done) => {
          try {
            betaKey = await createBetaKey({
              createdById: user.id,
              email: 'user2@email.com',
            });
          } catch (err) {
            done(err);
          }
          done();
        });

        it('request.body.email already exist', async () => {
          const {
            body,
            status,
          } = await postBetaKey(app, token, {
            body: {
              email: betaKey.email,
            },
          });
          expect(body.errors).toBe('this email is already used on a beta key');
          expect(status).toBe(400);
        });
        it('trimed request.body.email already exist', async () => {
          const {
            body,
            status,
          } = await postBetaKey(app, token, {
            body: {
              email: ` ${betaKey.email} `,
            },
          });
          expect(body.errors).toBe('this email is already used on a beta key');
          expect(status).toBe(400);
        });
        it('request.body.email to upper case already exist', async () => {
          const {
            body,
            status,
          } = await postBetaKey(app, token, {
            body: {
              email: betaKey.email.toUpperCase(),
            },
          });
          expect(body.errors).toBe('this email is already used on a beta key');
          expect(status).toBe(400);
        });
      });
      describe('a user is already register with', () => {
        let userTwo: User;

        beforeEach(async (done) => {
          try {
            const { user: createdUser } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            userTwo = createdUser;
          } catch (err) {
            done(err);
          }
          done();
        });

        it('request.body.email', async () => {
          const {
            body,
            status,
          } = await postBetaKey(app, token, {
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
          } = await postBetaKey(app, token, {
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
          } = await postBetaKey(app, token, {
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
        it('is not a string', async () => {
          const {
            body,
            status,
          } = await postBetaKey(app, token, {
            body: {
              email: 1234,
            },
          });
          expect(body.errors).toEqual({
            email: FIELD_SHOULD_BE_A_STRING,
          });
          expect(status).toBe(400);
        });
        it('is not an email', async () => {
          const {
            body,
            status,
          } = await postBetaKey(app, token, {
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
  });
});
