import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  cleanGoogleBuckets,
  createBlackList,
  createProfilePicture,
  createUser,
  deleteUsersMe,
  getBlackLists,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let password: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/blackLists', () => {
  describe('GET', () => {
    beforeAll(() => {
      sequelize = initSequelize();
      app = initApp();
    });

    beforeEach(async (done) => {
      mockDate.reset();
      jest.clearAllMocks();
      (signedUrl as jest.Mock).mockImplementation(() => ({
        OK: true,
        signedUrl: 'signedUrl',
      }));
      try {
        await cleanGoogleBuckets();
        await sequelize.sync({ force: true });
        const {
          password: createdPassword,
          user: createdUser,
        } = await createUser({
          role: 'superAdmin',
        });
        password = createdPassword;
        user = createdUser;
        const jwt = signAuthToken(user);
        token = jwt.token;
      } catch (err) {
        done(err);
      }
      done();
    });

    afterAll(async (done) => {
      mockDate.reset();
      jest.clearAllMocks();
      try {
        await cleanGoogleBuckets();
        await sequelize.sync({ force: true });
        await sequelize.close();
      } catch (err) {
        done(err);
      }
      app.close();
      done();
    });

    describe('should return status 200 and', () => {
      it('return no black list', async () => {
        const {
          body: {
            action,
            data: {
              blackLists,
            },
          },
          status,
        } = await getBlackLists(app, token);
        expect(action).toBe('GET');
        expect(blackLists.length).toBe(0);
        expect(status).toBe(200);
      });
      it('return one black list', async () => {
        const { user: userTwo } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        await createBlackList({
          adminId: user.id,
          userId: userTwo.id,
        });
        const {
          body: {
            data: {
              blackLists,
            },
          },
        } = await getBlackLists(app, token);
        expect(blackLists.length).toBe(1);
        expect(blackLists[0].admin.authTokenVersion).toBeUndefined();
        expect(blackLists[0].admin.blackLitedAt).toBeUndefined();
        expect(blackLists[0].admin.confirmed).toBeUndefined();
        expect(blackLists[0].admin.confirmTokenVersion).toBeUndefined();
        expect(blackLists[0].admin.createdAt).not.toBeUndefined();
        expect(blackLists[0].admin.currentProfilePicture).not.toBeUndefined();
        expect(blackLists[0].admin.defaultProfilePicture).not.toBeUndefined();
        expect(blackLists[0].admin.email).toBeUndefined();
        expect(blackLists[0].admin.emailTokenVersion).toBeUndefined();
        expect(blackLists[0].admin.facebookId).toBeUndefined();
        expect(blackLists[0].admin.googleId).toBeUndefined();
        expect(blackLists[0].admin.hash).toBeUndefined();
        expect(blackLists[0].admin.id).not.toBeUndefined();
        expect(blackLists[0].admin.isBlackListed).toBeUndefined();
        expect(blackLists[0].admin.pseudonym).not.toBeUndefined();
        expect(blackLists[0].admin.resetPasswordTokenVersion).toBeUndefined();
        expect(blackLists[0].admin.role).not.toBeUndefined();
        expect(blackLists[0].admin.salt).toBeUndefined();
        expect(blackLists[0].admin.socialMediaUserName).not.toBeUndefined();
        expect(blackLists[0].admin.updatedAt).toBeUndefined();
        expect(blackLists[0].admin.updatedEmailTokenVersion).toBeUndefined();
        expect(blackLists[0].admin.userName).not.toBeUndefined();
        expect(blackLists[0].adminId).toBeUndefined();
        expect(blackLists[0].createdAt).not.toBeUndefined();
        expect(blackLists[0].id).not.toBeUndefined();
        expect(blackLists[0].reason).not.toBeUndefined();
        expect(blackLists[0].updatedAt).not.toBeUndefined();
        expect(blackLists[0].updatedBy).toBeNull();
        expect(blackLists[0].updatedById).toBeUndefined();
        expect(blackLists[0].user.authTokenVersion).toBeUndefined();
        expect(blackLists[0].user.blackListedAt).toBeUndefined();
        expect(blackLists[0].user.confirmed).toBeUndefined();
        expect(blackLists[0].user.confirmTokenVersion).toBeUndefined();
        expect(blackLists[0].user.createdAt).not.toBeUndefined();
        expect(blackLists[0].user.currentProfilePicture).toBeNull();
        expect(blackLists[0].user.defaultProfilePicture).not.toBeUndefined();
        expect(blackLists[0].user.email).toBeUndefined();
        expect(blackLists[0].user.emailTokenVersion).toBeUndefined();
        expect(blackLists[0].user.facebookId).toBeUndefined();
        expect(blackLists[0].user.googleId).toBeUndefined();
        expect(blackLists[0].user.id).not.toBeUndefined();
        expect(blackLists[0].user.isBlackListed).toBeUndefined();
        expect(blackLists[0].user.hash).toBeUndefined();
        expect(blackLists[0].user.pseudonym).not.toBeUndefined();
        expect(blackLists[0].user.resetPasswordTokenVersion).toBeUndefined();
        expect(blackLists[0].user.role).not.toBeUndefined();
        expect(blackLists[0].user.salt).toBeUndefined();
        expect(blackLists[0].user.socialMediaUserName).not.toBeUndefined();
        expect(blackLists[0].user.updatedAt).toBeUndefined();
        expect(blackLists[0].user.updatedEmailTokenVersion).toBeUndefined();
        expect(blackLists[0].user.userName).not.toBeUndefined();
        expect(blackLists[0].userId).toBeUndefined();
      });
      it('return two black lists', async () => {
        const { user: userTwo } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        const { user: userThree } = await createUser({
          email: 'user3@email.com',
          userName: 'user3',
        });
        await createBlackList({
          adminId: user.id,
          userId: userTwo.id,
        });
        await createBlackList({
          adminId: user.id,
          userId: userThree.id,
        });
        const {
          body: {
            data: {
              blackLists,
            },
          },
        } = await getBlackLists(app, token);
        expect(blackLists.length).toBe(2);
      });
      it('return a pack of 20 black lists', async () => {
        const NUM = 21;
        const numOfBlackLists = Array(NUM).fill(0);
        await Promise.all(
          numOfBlackLists.map(async (_, index) => {
            const { user: newUser } = await createUser({
              email: `user${index + 2}@email.com`,
              userName: `user${index + 2}`,
            });
            await createBlackList({
              adminId: user.id,
              userId: newUser.id,
            });
          }),
        );
        const {
          body: {
            data: {
              blackLists: firstPack,
            },
          },
        } = await getBlackLists(app, token);
        const {
          body: {
            data: {
              blackLists: secondPack,
            },
          },
        } = await getBlackLists(app, token, { page: 2 });
        expect(firstPack.length).toBe(20);
        expect(secondPack.length).toBe(1);
      });
      it('include black listed user current profile picture', async () => {
        const {
          user: userTwo,
        } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        await createProfilePicture({
          current: true,
          userId: userTwo.id,
        });
        await createBlackList({
          adminId: user.id,
          userId: userTwo.id,
        });
        const {
          body: {
            data: {
              blackLists: [{
                user: {
                  currentProfilePicture,
                },
              }],
            },
          },
        } = await getBlackLists(app, token);
        expect(currentProfilePicture.createdAt).not.toBeUndefined();
        expect(currentProfilePicture.cropedImage.createdAt).toBeUndefined();
        expect(currentProfilePicture.cropedImage.format).not.toBeUndefined();
        expect(currentProfilePicture.cropedImage.height).not.toBeUndefined();
        expect(currentProfilePicture.cropedImage.id).toBeUndefined();
        expect(currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
        expect(currentProfilePicture.cropedImage.size).not.toBeUndefined();
        expect(currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
        expect(currentProfilePicture.cropedImage.width).not.toBeUndefined();
        expect(currentProfilePicture.cropedImageId).toBeUndefined();
        expect(currentProfilePicture.current).toBeUndefined();
        expect(currentProfilePicture.id).not.toBeUndefined();
        expect(currentProfilePicture.originalImage.createdAt).toBeUndefined();
        expect(currentProfilePicture.originalImage.format).not.toBeUndefined();
        expect(currentProfilePicture.originalImage.height).not.toBeUndefined();
        expect(currentProfilePicture.originalImage.id).toBeUndefined();
        expect(currentProfilePicture.originalImage.signedUrl).not.toBeUndefined();
        expect(currentProfilePicture.originalImage.size).not.toBeUndefined();
        expect(currentProfilePicture.originalImage.updatedAt).toBeUndefined();
        expect(currentProfilePicture.originalImage.width).not.toBeUndefined();
        expect(currentProfilePicture.originalImageId).toBeUndefined();
        expect(currentProfilePicture.pendingImage.createdAt).toBeUndefined();
        expect(currentProfilePicture.pendingImage.format).not.toBeUndefined();
        expect(currentProfilePicture.pendingImage.height).not.toBeUndefined();
        expect(currentProfilePicture.pendingImage.id).toBeUndefined();
        expect(currentProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
        expect(currentProfilePicture.pendingImage.size).not.toBeUndefined();
        expect(currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
        expect(currentProfilePicture.pendingImage.width).not.toBeUndefined();
        expect(currentProfilePicture.pendingImageId).toBeUndefined();
        expect(currentProfilePicture.updatedAt).toBeUndefined();
        expect(currentProfilePicture.userId).toBeUndefined();
      });
      it('include admin current profile picture', async () => {
        const { user: userTwo } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        await createBlackList({
          adminId: user.id,
          userId: userTwo.id,
        });
        await createProfilePicture({
          current: true,
          userId: user.id,
        });
        const {
          body: {
            data: {
              blackLists: [{
                admin: {
                  currentProfilePicture,
                },
              }],
            },
          },
        } = await getBlackLists(app, token);
        expect(currentProfilePicture.createdAt).not.toBeUndefined();
        expect(currentProfilePicture.cropedImage.createdAt).toBeUndefined();
        expect(currentProfilePicture.cropedImage.format).not.toBeUndefined();
        expect(currentProfilePicture.cropedImage.height).not.toBeUndefined();
        expect(currentProfilePicture.cropedImage.id).toBeUndefined();
        expect(currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
        expect(currentProfilePicture.cropedImage.size).not.toBeUndefined();
        expect(currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
        expect(currentProfilePicture.cropedImage.width).not.toBeUndefined();
        expect(currentProfilePicture.cropedImageId).toBeUndefined();
        expect(currentProfilePicture.current).toBeUndefined();
        expect(currentProfilePicture.id).not.toBeUndefined();
        expect(currentProfilePicture.originalImage.createdAt).toBeUndefined();
        expect(currentProfilePicture.originalImage.format).not.toBeUndefined();
        expect(currentProfilePicture.originalImage.height).not.toBeUndefined();
        expect(currentProfilePicture.originalImage.id).toBeUndefined();
        expect(currentProfilePicture.originalImage.signedUrl).not.toBeUndefined();
        expect(currentProfilePicture.originalImage.size).not.toBeUndefined();
        expect(currentProfilePicture.originalImage.updatedAt).toBeUndefined();
        expect(currentProfilePicture.originalImage.width).not.toBeUndefined();
        expect(currentProfilePicture.originalImageId).toBeUndefined();
        expect(currentProfilePicture.pendingImage.createdAt).toBeUndefined();
        expect(currentProfilePicture.pendingImage.format).not.toBeUndefined();
        expect(currentProfilePicture.pendingImage.height).not.toBeUndefined();
        expect(currentProfilePicture.pendingImage.id).toBeUndefined();
        expect(currentProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
        expect(currentProfilePicture.pendingImage.size).not.toBeUndefined();
        expect(currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
        expect(currentProfilePicture.pendingImage.width).not.toBeUndefined();
        expect(currentProfilePicture.pendingImageId).toBeUndefined();
        expect(currentProfilePicture.updatedAt).toBeUndefined();
        expect(currentProfilePicture.userId).toBeUndefined();
      });
      it('should not include admin if he have deleted his account', async () => {
        const {
          user: userTwo,
        } = await createUser({
          email: 'user2@email.com',
          role: 'admin',
          userName: 'user2',
        });
        const { user: userThree } = await createUser({
          email: 'user3@email.com',
          userName: 'user3',
        });
        const { token: tokenTwo } = signAuthToken(userTwo);
        await createBlackList({
          adminId: userTwo.id,
          userId: userThree.id,
        });
        await deleteUsersMe(app, tokenTwo, {
          body: {
            deleteAccountSentence: 'delete my account',
            password,
            userNameOrEmail: userTwo.email,
          },
        });
        const {
          body: {
            data: {
              blackLists: [{
                admin,
              }],
            },
          },
        } = await getBlackLists(app, token);
        expect(admin).toBeNull();
      });
      it('include BlackLists with time if there are not expired', async () => {
        const timeStamp = 1434319925275;
        const time = 1000 * 60 * 10;
        mockDate.set(timeStamp);
        const {
          user: userTwo,
        } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        await createBlackList({
          adminId: user.id,
          time,
          userId: userTwo.id,
        });
        mockDate.set(timeStamp + time - 1);
        const {
          body: {
            data: {
              blackLists,
            },
          },
        } = await getBlackLists(app, token);
        expect(blackLists.length).toBe(1);
      });
      it('do not include BlackLists with time if there are expired', async () => {
        const timeStamp = 1434319925275;
        const time = 1000 * 60 * 10;
        mockDate.set(timeStamp);
        const {
          user: userTwo,
        } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        await createBlackList({
          adminId: user.id,
          time,
          userId: userTwo.id,
        });
        mockDate.set(timeStamp + time + 1);
        const {
          body: {
            data: {
              blackLists,
            },
          },
        } = await getBlackLists(app, token);
        expect(blackLists.length).toBe(0);
      });
      it('order BlackLists by createdAt', async () => {
        const {
          user: userTwo,
        } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        const {
          user: userThree,
        } = await createUser({
          email: 'user3@email.com',
          userName: 'user3',
        });
        const {
          user: userFour,
        } = await createUser({
          email: 'user4@email.com',
          userName: 'user4',
        });
        const {
          user: userFive,
        } = await createUser({
          email: 'user5@email.com',
          userName: 'user5',
        });
        const blackListOne = await createBlackList({
          adminId: user.id,
          userId: userTwo.id,
        });
        const blackListTwo = await createBlackList({
          adminId: user.id,
          userId: userThree.id,
        });
        const blackListThree = await createBlackList({
          adminId: user.id,
          userId: userFour.id,
        });
        const blackListFour = await createBlackList({
          adminId: user.id,
          userId: userFive.id,
        });
        const {
          body: {
            data: {
              blackLists,
            },
          },
        } = await getBlackLists(app, token);
        expect(blackLists[0].id).toBe(blackListFour.id);
        expect(blackLists[1].id).toBe(blackListThree.id);
        expect(blackLists[2].id).toBe(blackListTwo.id);
        expect(blackLists[3].id).toBe(blackListOne.id);
      });
      it('include only active blackLists', async () => {
        const {
          user: userTwo,
        } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        await createBlackList({
          adminId: user.id,
          userId: userTwo.id,
        });
        await createBlackList({
          adminId: user.id,
          userId: userTwo.id,
        });
        const {
          body: {
            data: {
              blackLists,
            },
          },
        } = await getBlackLists(app, token);
        expect(blackLists.length).toBe(1);
      });
    });
  });
});
