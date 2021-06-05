import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteUsersMe,
  getBlackListsId,
  postBlackListUserId,
  postProfilePictures,
  postUsersLogin,
  putBlackListsId,
} from '@src/helpers/test';

import initApp from '@src/server';

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
      const {
        password,
        user: createdUser,
      } = await createUser({
        role: 'superAdmin',
      });
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

  describe('/:blackListId', () => {
    describe('GET', () => {
      describe('should return status 200 and', () => {
        let passwordTwo: string;
        let userTwo: User;

        beforeEach(async (done) => {
          try {
            const {
              password: createdPassword,
              user: createdUser,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            passwordTwo = createdPassword;
            userTwo = createdUser;
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
          } = await postBlackListUserId(app, token, userTwo.id, {
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
          expect(blackList.updatedById).toBeUndefined();
          expect(blackList.updatedBy).toBeNull();
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
          } = await postUsersLogin(app, {
            body: {
              password: passwordTwo,
              userNameOrEmail: userTwo.email,
            },
          });
          await postProfilePictures(app, tokenTwo);
          const {
            body: {
              data: {
                blackList: {
                  id: blackListId,
                },
              },
            },
          } = await postBlackListUserId(app, token, userTwo.id, {
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
          await postProfilePictures(app, token);
          const {
            body: {
              data: {
                blackList: {
                  id: blackListId,
                },
              },
            },
          } = await postBlackListUserId(app, token, userTwo.id, {
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
          const {
            password: passwordThree,
            user: userThree,
          } = await createUser({
            email: 'user3@email.com',
            role: 'admin',
            userName: 'user3',
          });
          const {
            body: {
              token: tokenTwo,
            },
          } = await postUsersLogin(app, {
            body: {
              password: passwordThree,
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
          } = await postBlackListUserId(app, tokenTwo, userTwo.id, {
            reason: 'black list reason',
          });
          await deleteUsersMe(app, tokenTwo, {
            body: {
              deleteAccountSentence: 'delete my account',
              password: passwordThree,
              userNameOrEmail: userThree.email,
            },
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
        it('include updatedBy', async () => {
          const {
            body: {
              data: {
                blackList: {
                  id: blackListId,
                },
              },
            },
          } = await postBlackListUserId(app, token, userTwo.id, {
            reason: 'black list reason',
          });
          await putBlackListsId(app, token, blackListId, {
            body: {
              time: (1000 * 60 * 10),
            },
          });
          const {
            body: {
              data: {
                blackList: {
                  updatedBy,
                },
              },
            },
          } = await getBlackListsId(app, token, blackListId);
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
          const {
            body: {
              data: {
                blackList: {
                  id: blackListId,
                },
              },
            },
          } = await postBlackListUserId(app, token, userTwo.id, {
            reason: 'black list reason',
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
                blackList: {
                  updatedBy: {
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
        it('do not updatedBy if a had deleted his account', async () => {
          const {
            password: passwordThree,
            user: userThree,
          } = await createUser({
            email: 'use3@email.com',
            role: 'superAdmin',
            userName: 'user3',
          });
          const {
            body: {
              token: tokenThree,
            },
          } = await postUsersLogin(app, {
            body: {
              password: passwordThree,
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
            reason: 'black list reason',
          });
          await putBlackListsId(app, tokenThree, blackListId, {
            body: {
              time: (1000 * 60 * 10),
            },
          });
          await deleteUsersMe(app, tokenThree, {
            body: {
              deleteAccountSentence: 'delete my account',
              password: passwordThree,
              userNameOrEmail: userThree.email,
            },
          });
          const {
            body: {
              data: {
                blackList: {
                  updatedBy,
                },
              },
            },
          } = await getBlackListsId(app, token, blackListId);
          expect(updatedBy).toBeNull();
        });
      });
      describe('should return status 400 if', () => {
        it('req.params.blackListId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await getBlackListsId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('black list'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('black list doesn\'t exist', async () => {
          const {
            body,
            status,
          } = await getBlackListsId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('black list'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
