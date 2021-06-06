import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  BlackList,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteUsersMe,
  getBlackLists,
  postBlackListUserId,
  postProfilePictures,
  postUsersLogin,
  putBlackListsId,
} from '@src/helpers/test';

import initApp from '@src/server';

describe('/blackLists', () => {
  let app: Server;
  let password: string;
  let sequelize: Sequelize;
  let token: string;
  let user: User;

  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });

  beforeEach(async (done) => {
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

      const { body } = await postUsersLogin(app, {
        body: {
          password,
          userNameOrEmail: user.email,
        },
      });
      token = body.token;
    } catch (err) {
      done(err);
    }
    done();
  });

  afterAll(async (done) => {
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

  describe('GET', () => {
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
        await postBlackListUserId(app, token, userTwo.id, {
          body: {
            reason: 'black list reason',
          },
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
        expect(blackLists[0].admin.confirmed).toBeUndefined();
        expect(blackLists[0].admin.confirmTokenVersion).toBeUndefined();
        expect(blackLists[0].admin.createdAt).not.toBeUndefined();
        expect(blackLists[0].admin.currentProfilePicture).not.toBeUndefined();
        expect(blackLists[0].admin.defaultProfilePicture).not.toBeUndefined();
        expect(blackLists[0].admin.email).toBeUndefined();
        expect(blackLists[0].admin.emailTokenVersion).toBeUndefined();
        expect(blackLists[0].admin.facebookId).toBeUndefined();
        expect(blackLists[0].admin.googleId).toBeUndefined();
        expect(blackLists[0].admin.password).toBeUndefined();
        expect(blackLists[0].admin.pseudonym).not.toBeUndefined();
        expect(blackLists[0].admin.resetPasswordTokenVersion).toBeUndefined();
        expect(blackLists[0].admin.role).not.toBeUndefined();
        expect(blackLists[0].admin.socialMediaUserName).not.toBeUndefined();
        expect(blackLists[0].admin.updatedAt).toBeUndefined();
        expect(blackLists[0].admin.updatedEmailTokenVersion).toBeUndefined();
        expect(blackLists[0].admin.userName).not.toBeUndefined();
        expect(blackLists[0].admin.id).not.toBeUndefined();
        expect(blackLists[0].adminId).toBeUndefined();
        expect(blackLists[0].createdAt).not.toBeUndefined();
        expect(blackLists[0].id).not.toBeUndefined();
        expect(blackLists[0].reason).not.toBeUndefined();
        expect(blackLists[0].updatedAt).not.toBeUndefined();
        expect(blackLists[0].updatedBy).not.toBeUndefined();
        expect(blackLists[0].updatedById).toBeUndefined();
        expect(blackLists[0].user.authTokenVersion).toBeUndefined();
        expect(blackLists[0].user.confirmed).toBeUndefined();
        expect(blackLists[0].user.confirmTokenVersion).toBeUndefined();
        expect(blackLists[0].user.createdAt).not.toBeUndefined();
        expect(blackLists[0].user.currentProfilePicture).toBeNull();
        expect(blackLists[0].user.defaultProfilePicture).not.toBeUndefined();
        expect(blackLists[0].user.email).toBeUndefined();
        expect(blackLists[0].user.emailTokenVersion).toBeUndefined();
        expect(blackLists[0].user.facebookId).toBeUndefined();
        expect(blackLists[0].user.googleId).toBeUndefined();
        expect(blackLists[0].user.password).toBeUndefined();
        expect(blackLists[0].user.pseudonym).not.toBeUndefined();
        expect(blackLists[0].user.resetPasswordTokenVersion).toBeUndefined();
        expect(blackLists[0].user.role).not.toBeUndefined();
        expect(blackLists[0].user.socialMediaUserName).not.toBeUndefined();
        expect(blackLists[0].user.updatedAt).toBeUndefined();
        expect(blackLists[0].user.updatedEmailTokenVersion).toBeUndefined();
        expect(blackLists[0].user.userName).not.toBeUndefined();
        expect(blackLists[0].user.id).not.toBeUndefined();
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
        await postBlackListUserId(app, token, userTwo.id, {
          body: {
            reason: 'black list reason',
          },
        });
        await postBlackListUserId(app, token, userThree.id, {
          body: {
            reason: 'black list reason',
          },
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
            await BlackList.create({
              adminId: user.id,
              reason: 'black list reason',
              time: null,
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
          password: passwordTwo,
          user: userTwo,
        } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        const {
          body: {
            token: tokenTwo,
          },
        } = await postUsersLogin(app, {
          body: {
            password: passwordTwo,
            userNameOrEmail: userTwo.email,
          },
        });
        await postProfilePictures(app, tokenTwo);
        await postBlackListUserId(app, token, userTwo.id, {
          body: {
            reason: 'black list reason',
          },
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
        await postBlackListUserId(app, token, userTwo.id, {
          body: {
            reason: 'black list reason',
          },
        });
        await postProfilePictures(app, token);
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
          password: passwordTwo,
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
        const {
          body: {
            token: tokenTwo,
          },
        } = await postUsersLogin(app, {
          body: {
            password: passwordTwo,
            userNameOrEmail: userTwo.email,
          },
        });
        await postBlackListUserId(app, tokenTwo, userThree.id, {
          body: {
            reason: 'black list reason',
          },
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
      it('include updatedBy', async () => {
        const { user: userTwo } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        const {
          body: {
            data: {
              blackList: {
                id: blackListId,
              },
            },
          },
        } = await postBlackListUserId(app, token, userTwo.id, {
          body: {
            reason: 'black list reason',
          },
        });
        await putBlackListsId(app, token, blackListId, {
          body: {
            time: (1000 * 60 * 10),
          },
        });
        const {
          body: {
            data: {
              blackLists: [{
                updatedBy,
              }],
            },
          },
        } = await getBlackLists(app, token);
        expect(updatedBy.authTokenVersion).toBeUndefined();
        expect(updatedBy.confirmed).toBeUndefined();
        expect(updatedBy.confirmTokenVersion).toBeUndefined();
        expect(updatedBy.createdAt).not.toBeUndefined();
        expect(updatedBy.currentProfilePicture).not.toBeUndefined();
        expect(updatedBy.defaultProfilePicture).not.toBeUndefined();
        expect(updatedBy.email).toBeUndefined();
        expect(updatedBy.emailTokenVersion).toBeUndefined();
        expect(updatedBy.facebookId).toBeUndefined();
        expect(updatedBy.googleId).toBeUndefined();
        expect(updatedBy.password).toBeUndefined();
        expect(updatedBy.pseudonym).not.toBeUndefined();
        expect(updatedBy.resetPasswordTokenVersion).toBeUndefined();
        expect(updatedBy.role).not.toBeUndefined();
        expect(updatedBy.socialMediaUserName).not.toBeUndefined();
        expect(updatedBy.updatedAt).toBeUndefined();
        expect(updatedBy.updatedEmailTokenVersion).toBeUndefined();
        expect(updatedBy.userName).not.toBeUndefined();
        expect(updatedBy.id).not.toBeUndefined();
      });
      it('include updatedBy current profile picture', async () => {
        const { user: userTwo } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        const {
          body: {
            data: {
              blackList: {
                id: blackListId,
              },
            },
          },
        } = await postBlackListUserId(app, token, userTwo.id, {
          body: {
            reason: 'black list reason',
          },
        });
        await putBlackListsId(app, token, blackListId, {
          body: {
            time: (1000 * 60 * 10),
          },
        });
        await postProfilePictures(app, token);
        const {
          body: {
            data: {
              blackLists: [{
                updatedBy: {
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
      it('do not include updatedBy current profile picture if he had deleted his account', async () => {
        const { user: userTwo } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        const { user: userThree } = await createUser({
          email: 'user3@email.com',
          role: 'superAdmin',
          userName: 'user3',
        });
        const {
          body: {
            token: tokenThree,
          },
        } = await postUsersLogin(app, {
          body: {
            password,
            userNameOrEmail: userThree.email,
          },
        });
        const {
          body: {
            data: {
              blackList: {
                id: blackListId,
              },
            },
          },
        } = await postBlackListUserId(app, token, userTwo.id, {
          body: {
            reason: 'black list reason',
          },
        });
        await putBlackListsId(app, tokenThree, blackListId, {
          body: {
            time: (1000 * 60 * 10),
          },
        });
        await deleteUsersMe(app, tokenThree, {
          body: {
            deleteAccountSentence: 'delete my account',
            password,
            userNameOrEmail: userThree.email,
          },
        });
        const {
          body: {
            data: {
              blackLists: [{
                updatedBy,
              }],
            },
          },
        } = await getBlackLists(app, token);
        expect(updatedBy).toBeNull();
      });
    });
  });
});
