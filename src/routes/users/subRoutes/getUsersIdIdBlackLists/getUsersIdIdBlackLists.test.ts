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
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  cleanGoogleBuckets,
  createBlackList,
  createProfilePicture,
  createUser,
  deleteUsersMe,
  getUsersIdIdBlackLists,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('/id', () => {
    describe('/:userId', () => {
      describe('/blackLists', () => {
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
              await cleanGoogleBuckets();
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
            let userTwo: User;

            beforeEach(async (done) => {
              try {
                const {
                  user: createdUser,
                } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                userTwo = createdUser;
              } catch (err) {
                done(err);
              }
              done();
            });

            it('return no blackList', async () => {
              const {
                body: {
                  action,
                  data: {
                    blackLists,
                    userId,
                  },
                },
                status,
              } = await getUsersIdIdBlackLists(app, token, userTwo.id);
              expect(action).toBe('GET');
              expect(blackLists.length).toBe(0);
              expect(userId).toBe(userTwo.id);
              expect(status).toBe(200);
            });
            it('return one blackList', async () => {
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
              } = await getUsersIdIdBlackLists(app, token, userTwo.id);
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
              expect(blackLists[0].admin.hash).toBeUndefined();
              expect(blackLists[0].admin.id).not.toBeUndefined();
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
            it('return a pack of 20 blackLists', async () => {
              const NUM = 21;
              const numOfBlackLists = Array(NUM).fill(0);
              await Promise.all(
                numOfBlackLists.map(async () => {
                  await createBlackList({
                    adminId: user.id,
                    userId: userTwo.id,
                  });
                }),
              );
              const {
                body: {
                  data: {
                    blackLists: firstPack,
                  },
                },
              } = await getUsersIdIdBlackLists(app, token, userTwo.id);
              const {
                body: {
                  data: {
                    blackLists: secondPack,
                  },
                },
              } = await getUsersIdIdBlackLists(app, token, userTwo.id, {
                page: 2,
              });
              expect(firstPack.length).toBe(20);
              expect(secondPack.length).toBe(1);
            });
            it('order blackLists by createdAt', async () => {
              const blackListOne = await createBlackList({
                adminId: user.id,
                userId: userTwo.id,
              });
              const blackListTwo = await createBlackList({
                adminId: user.id,
                userId: userTwo.id,
              });
              const blackListThree = await createBlackList({
                adminId: user.id,
                userId: userTwo.id,
              });
              const blackListFour = await createBlackList({
                adminId: user.id,
                userId: userTwo.id,
              });
              const {
                body: {
                  data: {
                    blackLists,
                  },
                },
              } = await getUsersIdIdBlackLists(app, token, userTwo.id);
              expect(blackLists[0].id).toBe(blackListFour.id);
              expect(blackLists[1].id).toBe(blackListThree.id);
              expect(blackLists[2].id).toBe(blackListTwo.id);
              expect(blackLists[3].id).toBe(blackListOne.id);
            });
            it('do not include admin if he has deleted his account', async () => {
              const {
                password: passwordThree,
                user: userThree,
              } = await createUser({
                email: 'user3@email.com',
                role: 'admin',
                userName: 'user3',
              });
              const { token: tokenThree } = signAuthToken(userThree);
              await createBlackList({
                adminId: userThree.id,
                userId: userTwo.id,
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
                    blackLists,
                  },
                },
              } = await getUsersIdIdBlackLists(app, token, userTwo.id);
              expect(blackLists[0].admin).toBeNull();
            });
            it('include updatedBy', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                role: 'admin',
                userName: 'user3',
              });
              await createBlackList({
                adminId: user.id,
                updatedById: userThree.id,
                userId: userTwo.id,
              });
              const {
                body: {
                  data: {
                    blackLists: [{
                      updatedBy,
                    }],
                  },
                },
              } = await getUsersIdIdBlackLists(app, token, userTwo.id);
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
              expect(updatedBy.hash).toBeUndefined();
              expect(updatedBy.id).not.toBeUndefined();
              expect(updatedBy.pseudonym).not.toBeUndefined();
              expect(updatedBy.resetPasswordTokenVersion).toBeUndefined();
              expect(updatedBy.role).not.toBeUndefined();
              expect(updatedBy.salt).toBeUndefined();
              expect(updatedBy.socialMediaUserName).not.toBeUndefined();
              expect(updatedBy.updatedAt).toBeUndefined();
              expect(updatedBy.updatedEmailTokenVersion).toBeUndefined();
              expect(updatedBy.userName).not.toBeUndefined();
            });
            it('do not include updatedBy if he has deleted his account', async () => {
              const {
                password: passwordThree,
                user: userThree,
              } = await createUser({
                email: 'user3@email.com',
                role: 'admin',
                userName: 'user3',
              });
              const { token: tokenThree } = signAuthToken(userThree);
              await createBlackList({
                adminId: user.id,
                updatedById: userThree.id,
                userId: userTwo.id,
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
                    blackLists: [{
                      updatedBy,
                    }],
                  },
                },
              } = await getUsersIdIdBlackLists(app, token, userTwo.id);
              expect(updatedBy).toBeNull();
            });
            it('include user\'s current profile picture', async () => {
              await createProfilePicture({
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
              } = await getUsersIdIdBlackLists(app, token, userTwo.id);
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
            it('include admin\'s current profile picture', async () => {
              await createProfilePicture({
                userId: user.id,
              });
              await createBlackList({
                adminId: user.id,
                userId: userTwo.id,
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
              } = await getUsersIdIdBlackLists(app, token, userTwo.id);
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
            it('include updatedBy\'s current profile picture', async () => {
              await createProfilePicture({
                userId: user.id,
              });
              await createBlackList({
                adminId: user.id,
                updatedById: user.id,
                userId: userTwo.id,
              });
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
              } = await getUsersIdIdBlackLists(app, token, userTwo.id);
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
          });
          describe('should return status 400 if', () => {
            it('request.params.userId is not a UUIDv4', async () => {
              const {
                body,
                status,
              } = await getUsersIdIdBlackLists(app, token, '100');
              expect(body.errors).toBe(INVALID_UUID('user'));
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('user not found', async () => {
              const {
                body,
                status,
              } = await getUsersIdIdBlackLists(app, token, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
