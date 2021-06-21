import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  createBetaKey,
  createUser,
  getBetaKeys,
  testBetaKey,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/betaKeys', () => {
  describe('GET', () => {
    beforeAll(() => {
      sequelize = initSequelize();
      app = initApp();
    });

    beforeEach(async (done) => {
      jest.clearAllMocks();
      (signedUrl as jest.Mock).mockImplementation(() => ({
        OK: true,
        signedUrl: 'signedUrl',
      }));
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
      jest.clearAllMocks();
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
      it('return no betaKey', async () => {
        const {
          body: {
            action,
            data: {
              betaKeys,
            },
          },
          status,
        } = await getBetaKeys(app, token);
        expect(action).toBe('GET');
        expect(betaKeys.length).toBe(0);
        expect(status).toBe(200);
      });
      it('return one betaKey', async () => {
        await createBetaKey({
          createdById: user.id,
        });
        const {
          body: {
            data: {
              betaKeys,
            },
          },
        } = await getBetaKeys(app, token);
        expect(betaKeys.length).toBe(1);
        testBetaKey(betaKeys[0]);
      });
      it('include createdBy', async () => {
        await createBetaKey({
          createdById: user.id,
        });
        const {
          body: {
            data: {
              betaKeys,
            },
          },
        } = await getBetaKeys(app, token);
        testUser(betaKeys[0].createdBy);
      });
      it('include user', async () => {
        const { user: userTwo } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        await createBetaKey({
          createdById: user.id,
          userId: userTwo.id,
        });
        const {
          body: {
            data: {
              betaKeys,
            },
          },
        } = await getBetaKeys(app, token);
        testUser(betaKeys[0].user);
      });
      it('return a pack of 20 betaKey', async () => {
        const NUM = 21;
        const numOfBetaKeys = new Array(NUM).fill(0);
        await Promise.all(
          numOfBetaKeys.map(async () => {
            await createBetaKey({
              createdById: user.id,
            });
          }),
        );
        const {
          body: {
            data: {
              betaKeys: firstPack,
            },
          },
        } = await getBetaKeys(app, token);
        const {
          body: {
            data: {
              betaKeys: secondPack,
            },
          },
        } = await getBetaKeys(app, token, { page: 2 });
        expect(firstPack.length).toBe(20);
        expect(secondPack.length).toBe(1);
      });
      it('order by createdAt', async () => {
        const betaKeyOne = await createBetaKey({
          createdById: user.id,
        });
        const betaKeyTwo = await createBetaKey({
          createdById: user.id,
        });
        const betaKeyThree = await createBetaKey({
          createdById: user.id,
        });
        const betaKeyFour = await createBetaKey({
          createdById: user.id,
        });
        const betaKeyFive = await createBetaKey({
          createdById: user.id,
        });
        const betaKeySix = await createBetaKey({
          createdById: user.id,
        });
        const {
          body: {
            data: {
              betaKeys,
            },
          },
        } = await getBetaKeys(app, token);
        expect(betaKeys.length).toBe(6);
        expect(betaKeys[0].id).toBe(betaKeySix.id);
        expect(betaKeys[1].id).toBe(betaKeyFive.id);
        expect(betaKeys[2].id).toBe(betaKeyFour.id);
        expect(betaKeys[3].id).toBe(betaKeyThree.id);
        expect(betaKeys[4].id).toBe(betaKeyTwo.id);
        expect(betaKeys[5].id).toBe(betaKeyOne.id);
      });
      describe('return only betaKey', () => {
        it('used', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const { user: userFour } = await createUser({
            email: 'user4@email.com',
            userName: 'user4',
          });
          // me = true && used = true
          const betaKeyOne = await createBetaKey({
            createdById: user.id,
            userId: userTwo.id,
          });
          // me = true && used = true
          const betaKeyTwo = await createBetaKey({
            createdById: user.id,
            userId: userThree.id,
          });
          // me = true && used = false
          await createBetaKey({
            createdById: user.id,
          });
          // me = false && used = true
          await createBetaKey({
            userId: userFour.id,
          });
          // me = false && used = false
          await createBetaKey({});
          const {
            body: {
              data: {
                betaKeys,
              },
            },
          } = await getBetaKeys(app, token, { used: 'true' });
          expect(betaKeys.length).toBe(2);
          expect(betaKeys[0].id).toBe(betaKeyTwo.id);
          expect(betaKeys[1].id).toBe(betaKeyOne.id);
        });
        it('not used', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          // me = true && used = false
          const betaKeyOne = await createBetaKey({
            createdById: user.id,
          });
          // me = true && used = false
          const betaKeyTwo = await createBetaKey({
            createdById: user.id,
          });
          // me = true && used = true
          await createBetaKey({
            createdById: user.id,
            userId: userTwo.id,
          });
          // me = false && used = true
          await createBetaKey({
            userId: userThree.id,
          });
          await createBetaKey({});
          const {
            body: {
              data: {
                betaKeys,
              },
            },
          } = await getBetaKeys(app, token, { used: 'false' });
          expect(betaKeys.length).toBe(2);
          expect(betaKeys[0].id).toBe(betaKeyTwo.id);
          expect(betaKeys[1].id).toBe(betaKeyOne.id);
        });
        it('created by all users', async () => {
          await createBetaKey({
            createdById: user.id,
          });
          await createBetaKey({
            createdById: user.id,
          });
          await createBetaKey({});
          await createBetaKey({});
          const {
            body: {
              data: {
                betaKeys,
              },
            },
          } = await getBetaKeys(app, token, { me: 'false' });
          expect(betaKeys.length).toBe(4);
        });
        it('created by all users and used', async () => {
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const { user: userFour } = await createUser({
            email: 'user4@email.com',
            userName: 'user4',
          });
          // me = true && used = true
          const betaKeyOne = await createBetaKey({
            createdById: user.id,
            userId: userThree.id,
          });
          // me = false && used = true
          const betaKeyTwo = await createBetaKey({
            userId: userFour.id,
          });
          // me = true && used = false
          await createBetaKey({
            createdById: user.id,
          });
          // me = false && userd = false
          await createBetaKey({});
          const {
            body: {
              data: {
                betaKeys,
              },
            },
          } = await getBetaKeys(app, token, {
            me: 'false',
            used: 'true',
          });
          expect(betaKeys.length).toBe(2);
          expect(betaKeys[0].id).toBe(betaKeyTwo.id);
          expect(betaKeys[1].id).toBe(betaKeyOne.id);
        });
        it('created by all users and not used', async () => {
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const { user: userFour } = await createUser({
            email: 'user4@email.com',
            userName: 'user4',
          });
          // me = true && used = true
          await createBetaKey({
            createdById: user.id,
            userId: userThree.id,
          });
          // me = false && used = true
          await createBetaKey({
            userId: userFour.id,
          });
          // me = true && used = false
          const betaKeyOne = await createBetaKey({
            createdById: user.id,
          });
          // me = false && userd = false
          const betaKeyTwo = await createBetaKey({});
          const {
            body: {
              data: {
                betaKeys,
              },
            },
          } = await getBetaKeys(app, token, {
            me: 'false',
            used: 'false',
          });
          expect(betaKeys.length).toBe(2);
          expect(betaKeys[0].id).toBe(betaKeyTwo.id);
          expect(betaKeys[1].id).toBe(betaKeyOne.id);
        });
      });
    });
  });
});
