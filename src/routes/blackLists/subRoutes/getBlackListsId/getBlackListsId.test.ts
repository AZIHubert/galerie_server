import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteUser,
  getBlackListsId,
  login,
  postBlackListUser,
  postProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/blackLists', () => {
  let app: Server;
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
      user = await createUser({
        role: 'superAdmin',
      });

      const { body } = await login(app, user.email, userPassword);
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

  describe('/:blackListId', () => {
    describe('GET', () => {
      describe('should return status 200 and', () => {
        let userTwo: User;

        beforeEach(async (done) => {
          try {
            userTwo = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
          } catch (err) {
            done(err);
          }
          done();
        });

        it('return black list', async () => {
          const {
            body: {
              data: {
                blackList: {
                  id: blackListId,
                },
              },
            },
          } = await postBlackListUser(app, token, userTwo.id, {
            reason: 'black list user',
          });
          const {
            body: {
              action,
              data: {
                blackList,
              },
            },
            status,
          } = await getBlackListsId(app, token, blackListId);
          expect(action).toBe('GET');
          expect(blackList.admin.authTokenVersion).toBeUndefined();
          expect(blackList.admin.confirmed).toBeUndefined();
          expect(blackList.admin.confirmTokenVersion).toBeUndefined();
          expect(blackList.admin.createdAt).not.toBeUndefined();
          expect(blackList.admin.currentProfilePicture).not.toBeUndefined();
          expect(blackList.admin.defaultProfilePicture).not.toBeUndefined();
          expect(blackList.admin.email).toBeUndefined();
          expect(blackList.admin.emailTokenVersion).toBeUndefined();
          expect(blackList.admin.facebookId).toBeUndefined();
          expect(blackList.admin.googleId).toBeUndefined();
          expect(blackList.admin.password).toBeUndefined();
          expect(blackList.admin.pseudonym).not.toBeUndefined();
          expect(blackList.admin.resetPasswordTokenVersion).toBeUndefined();
          expect(blackList.admin.role).not.toBeUndefined();
          expect(blackList.admin.socialMediaUserName).not.toBeUndefined();
          expect(blackList.admin.updatedAt).toBeUndefined();
          expect(blackList.admin.updatedEmailTokenVersion).toBeUndefined();
          expect(blackList.admin.userName).not.toBeUndefined();
          expect(blackList.admin.id).not.toBeUndefined();
          expect(blackList.adminId).toBeUndefined();
          expect(blackList.createdAt).not.toBeUndefined();
          expect(blackList.id).not.toBeUndefined();
          expect(blackList.reason).not.toBeUndefined();
          expect(blackList.user.authTokenVersion).toBeUndefined();
          expect(blackList.user.confirmed).toBeUndefined();
          expect(blackList.user.confirmTokenVersion).toBeUndefined();
          expect(blackList.user.createdAt).not.toBeUndefined();
          expect(blackList.user.currentProfilePicture).toBeNull();
          expect(blackList.user.defaultProfilePicture).not.toBeUndefined();
          expect(blackList.user.email).toBeUndefined();
          expect(blackList.user.emailTokenVersion).toBeUndefined();
          expect(blackList.user.facebookId).toBeUndefined();
          expect(blackList.user.googleId).toBeUndefined();
          expect(blackList.user.password).toBeUndefined();
          expect(blackList.user.pseudonym).not.toBeUndefined();
          expect(blackList.user.resetPasswordTokenVersion).toBeUndefined();
          expect(blackList.user.role).not.toBeUndefined();
          expect(blackList.user.socialMediaUserName).not.toBeUndefined();
          expect(blackList.user.updatedAt).toBeUndefined();
          expect(blackList.user.updatedEmailTokenVersion).toBeUndefined();
          expect(blackList.user.userName).not.toBeUndefined();
          expect(blackList.user.id).not.toBeUndefined();
          expect(blackList.userId).toBeUndefined();
          expect(status).toBe(200);
        });
        it('include black listed user current profile picture', async () => {
          const {
            body: {
              token: tokenTwo,
            },
          } = await login(app, userTwo.email, userPassword);
          await postProfilePicture(app, tokenTwo);
          const {
            body: {
              data: {
                blackList: {
                  id: blackListId,
                },
              },
            },
          } = await postBlackListUser(app, token, userTwo.id, {
            reason: 'black list user',
          });
          const {
            body: {
              data: {
                blackList: {
                  user: {
                    currentProfilePicture,
                  },
                },
              },
            },
          } = await getBlackListsId(app, token, blackListId);
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
          await postProfilePicture(app, token);
          const {
            body: {
              data: {
                blackList: {
                  id: blackListId,
                },
              },
            },
          } = await postBlackListUser(app, token, userTwo.id, {
            reason: 'black list user',
          });
          const {
            body: {
              data: {
                blackList: {
                  admin: {
                    currentProfilePicture,
                  },
                },
              },
            },
          } = await getBlackListsId(app, token, blackListId);
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
        it('do not include admin if he have delete his account', async () => {
          const userThree = await createUser({
            email: 'user3@email.com',
            role: 'admin',
            userName: 'user3',
          });
          const {
            body: {
              token: tokenTwo,
            },
          } = await login(app, userThree.email, userPassword);
          const {
            body: {
              data: {
                blackList: {
                  id: blackListId,
                },
              },
            },
          } = await postBlackListUser(app, tokenTwo, userTwo.id, {
            reason: 'black list reason',
          });
          await deleteUser(app, tokenTwo, {
            deleteAccountSentence: 'delete my account',
            password: userPassword,
            userNameOrEmail: userThree.email,
          });
          const {
            body: {
              data: {
                blackList: {
                  admin,
                },
              },
            },
          } = await getBlackListsId(app, token, blackListId);
          expect(admin).toBeNull();
        });
      });
      describe('should return status 404 if', () => {
        it('black list doesn\'t exist', async () => {
          const {
            body,
            status,
          } = await getBlackListsId(app, token, uuidv4());
          expect(body.errors).toBe('black list not found');
          expect(status).toBe(404);
        });
      });
    });
  });
});
