import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  // BetaKey,
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  createProfilePicture,
  createBetaKey,
  createUser,
  getBetaKeys,
  testProfilePicture,
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
        await createBetaKey({});
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
      it('include createdBy current profile picture', async () => {
        await createBetaKey({
          createdById: user.id,
        });
        await createProfilePicture({
          userId: user.id,
        });
        const {
          body: {
            data: {
              betaKeys,
            },
          },
        } = await getBetaKeys(app, token);
        testProfilePicture(betaKeys[0].createdBy.currentProfilePicture);
      });
      it('do not include createdBy current profile picture if signedUrl.OK === false', async () => {
        (signedUrl as jest.Mock).mockImplementation(() => ({
          OK: false,
        }));
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
        const images = await Image.findAll();
        const profilePictures = await ProfilePicture.findAll();
        expect(betaKeys[0].createdBy.currentProfilePicture).toBeNull();
        expect(images.length).toBe(0);
        expect(profilePictures.length).toBe(0);
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
      it('include user current profile picture', async () => {
        const { user: userTwo } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        await createProfilePicture({
          userId: userTwo.id,
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
        testProfilePicture(betaKeys[0].user.currentProfilePicture);
      });
      it('do not include user current profile picture if signedUrl.OK === false', async () => {
        (signedUrl as jest.Mock).mockImplementation(() => ({
          OK: false,
        }));
        const { user: userTwo } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        await createProfilePicture({
          userId: userTwo.id,
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
        const images = await Image.findAll();
        const profilePictures = await ProfilePicture.findAll();
        expect(betaKeys[0].user.currentProfilePicture).toBeNull();
        expect(images.length).toBe(0);
        expect(profilePictures.length).toBe(0);
      });
      it('return a pack of 20 betaKey', async () => {
        const NUM = 21;
        const numOfBetaKeys = new Array(NUM).fill(0);
        await Promise.all(
          numOfBetaKeys.map(async () => {
            await createBetaKey({});
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
      it('order by usedAt first then order by createdAt', async () => {
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
        const betaKeyOne = await createBetaKey({
          userId: userTwo.id,
        });
        const betaKeyTwo = await createBetaKey({
          userId: userThree.id,
        });
        const betaKeyThree = await createBetaKey({
          userId: userFour.id,
        });
        const betaKeyFour = await createBetaKey({});
        const betaKeyFive = await createBetaKey({});
        const betaKeySix = await createBetaKey({});
        const {
          body: {
            data: {
              betaKeys,
            },
          },
        } = await getBetaKeys(app, token);
        expect(betaKeys.length).toBe(6);
        expect(betaKeys[0].id).toBe(betaKeyOne.id);
        expect(betaKeys[1].id).toBe(betaKeyTwo.id);
        expect(betaKeys[2].id).toBe(betaKeyThree.id);
        expect(betaKeys[3].id).toBe(betaKeySix.id);
        expect(betaKeys[4].id).toBe(betaKeyFive.id);
        expect(betaKeys[5].id).toBe(betaKeyFour.id);
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
          const betaKeyOne = await createBetaKey({
            userId: userTwo.id,
          });
          const betaKeyTwo = await createBetaKey({
            userId: userThree.id,
          });
          await createBetaKey({});
          await createBetaKey({});
          const {
            body: {
              data: {
                betaKeys,
              },
            },
          } = await getBetaKeys(app, token, { used: 'true' });
          expect(betaKeys.length).toBe(2);
          expect(betaKeys[0].id).toBe(betaKeyOne.id);
          expect(betaKeys[1].id).toBe(betaKeyTwo.id);
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
          await createBetaKey({
            userId: userTwo.id,
          });
          await createBetaKey({
            userId: userThree.id,
          });
          const betaKeyOne = await createBetaKey({});
          const betaKeyTwo = await createBetaKey({});
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
        it('created by current user', async () => {
          const betaKeyOne = await createBetaKey({
            createdById: user.id,
          });
          const betaKeyTwo = await createBetaKey({
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
          } = await getBetaKeys(app, token, { me: 'true' });
          expect(betaKeys.length).toBe(2);
          expect(betaKeys[0].id).toBe(betaKeyTwo.id);
          expect(betaKeys[1].id).toBe(betaKeyOne.id);
        });
        it('created by current user and used', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const betaKeyOne = await createBetaKey({
            createdById: user.id,
            userId: userTwo.id,
          });
          const betaKeyTwo = await createBetaKey({
            createdById: user.id,
            userId: userTwo.id,
          });
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
          } = await getBetaKeys(app, token, {
            me: 'true',
            used: 'true',
          });
          expect(betaKeys.length).toBe(2);
          expect(betaKeys[0].id).toBe(betaKeyOne.id);
          expect(betaKeys[1].id).toBe(betaKeyTwo.id);
        });
        it('created by current user and not used', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await createBetaKey({
            createdById: user.id,
            userId: userTwo.id,
          });
          await createBetaKey({
            createdById: user.id,
            userId: userTwo.id,
          });
          const betaKeyOne = await createBetaKey({
            createdById: user.id,
          });
          const betaKeyTwo = await createBetaKey({
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
          } = await getBetaKeys(app, token, {
            me: 'true',
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
