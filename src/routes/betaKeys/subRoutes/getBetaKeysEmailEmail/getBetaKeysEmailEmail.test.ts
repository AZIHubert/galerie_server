import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '#src/helpers/initEnv';

import {
  User,
} from '#src/db/models';

import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createBetaKey,
  createUser,
  getBetaKeysEmailEmail,
  testBetaKey,
  testUser,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/betaKeys', () => {
  describe('/email', () => {
    describe('/:email', () => {
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

      describe('should return status 200', () => {
        it('return no beta key', async () => {
          const {
            body: {
              action,
              data: {
                betaKeys,
              },
            },
            status,
          } = await getBetaKeysEmailEmail(app, token, 'a');
          expect(action).toBe('GET');
          expect(betaKeys.length).toBe(0);
          expect(status).toBe(200);
        });
        it('return one beta key with request.body.email === \'.com\'', async () => {
          await createBetaKey({
            email: 'user2@email.com',
          });
          const {
            body: {
              data: {
                betaKeys,
              },
            },
          } = await getBetaKeysEmailEmail(app, token, '.com');
          expect(betaKeys.length).toBe(1);
          testBetaKey(betaKeys[0]);
        });
        it('return one beta key with request.body.email === \'@em\'', async () => {
          await createBetaKey({
            email: 'user2@email.com',
          });
          const {
            body: {
              data: {
                betaKeys,
              },
            },
          } = await getBetaKeysEmailEmail(app, token, '@em');
          expect(betaKeys.length).toBe(1);
        });
        it('return a pack of twenty beta keys', async () => {
          const email = 'user';
          const NUM = 21;
          const numOfBetaKeys = new Array(NUM).fill(0);
          await Promise.all(
            numOfBetaKeys.map(async (_, index) => {
              await createBetaKey({
                email: `${email}${index}@email.Com`,
              });
            }),
          );
          const {
            body: {
              data: {
                betaKeys: firstPack,
              },
            },
          } = await getBetaKeysEmailEmail(app, token, email);
          const {
            body: {
              data: {
                betaKeys: secondPack,
              },
            },
          } = await getBetaKeysEmailEmail(app, token, email, { page: 2 });
          expect(firstPack.length).toBe(20);
          expect(secondPack.length).toBe(1);
        });
        it('order beta keys by createdAt', async () => {
          const email = 'user';
          const betaKeyOne = await createBetaKey({
            email: `${email}1@email.Com`,
          });
          const betaKeyTwo = await createBetaKey({
            email: `${email}2@email.Com`,
          });
          const betaKeyThree = await createBetaKey({
            email: `${email}3@email.Com`,
          });
          const betaKeyFour = await createBetaKey({
            email: `${email}4@email.Com`,
          });
          const betaKeyFive = await createBetaKey({
            email: `${email}5@email.Com`,
          });
          const betaKeySix = await createBetaKey({
            email: `${email}5@email.Com`,
          });
          const {
            body: {
              data: {
                betaKeys,
              },
            },
          } = await getBetaKeysEmailEmail(app, token, email);
          expect(betaKeys.length).toBe(6);
          expect(betaKeys[0].id).toBe(betaKeySix.id);
          expect(betaKeys[1].id).toBe(betaKeyFive.id);
          expect(betaKeys[2].id).toBe(betaKeyFour.id);
          expect(betaKeys[3].id).toBe(betaKeyThree.id);
          expect(betaKeys[4].id).toBe(betaKeyTwo.id);
          expect(betaKeys[5].id).toBe(betaKeyOne.id);
        });
        it('request.params.email is case insensitive', async () => {
          const email = 'user';
          await createBetaKey({
            email: `${email}@email.com`,
          });
          await createBetaKey({
            email: `new${email}@email.com`,
          });
          const {
            body: {
              data: {
                betaKeys,
              },
            },
          } = await getBetaKeysEmailEmail(app, token, email.toUpperCase());
          expect(betaKeys.length).toBe(2);
        });
        it('do not include betaKey.email not match with request.params.email', async () => {
          await createBetaKey({
            email: 'user@email.com',
          });
          await createBetaKey({
            email: 'user2@email.com',
          });
          const {
            body: {
              data: {
                betaKeys,
              },
            },
          } = await getBetaKeysEmailEmail(app, token, 'emmail');
          expect(betaKeys.length).toBe(0);
        });
        it('include createdBy', async () => {
          const email = 'user';
          await createBetaKey({
            createdById: user.id,
            email: `${email}@email.com`,
          });
          const {
            body: {
              data: {
                betaKeys,
              },
            },
          } = await getBetaKeysEmailEmail(app, token, email);
          expect(betaKeys[0].createdBy.hasNewNotifications).toBeUndefined();
          testUser(betaKeys[0].createdBy);
        });
        it('include user', async () => {
          const email = 'user';
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await createBetaKey({
            email: `${email}@email.com`,
            userId: userTwo.id,
          });
          const {
            body: {
              data: {
                betaKeys,
              },
            },
          } = await getBetaKeysEmailEmail(app, token, email);
          expect(betaKeys[0].user.hasNewNotifications).toBeUndefined();
          testUser(betaKeys[0].user);
        });
      });
    });
  });
});
