import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  BlackList,
  User,
} from '@src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_A_NUMBER,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  cleanGoogleBuckets,
  createProfilePicture,
  createUser,
  postBlackListUserId,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/blackLists', () => {
  describe('/:userId', () => {
    describe('POST', () => {
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

        it('create black list without time', async () => {
          const reason = 'black list reason';
          const {
            body: {
              action,
              data: {
                blackList: returnedBlackList,
              },
            },
            status,
          } = await postBlackListUserId(app, token, userTwo.id, {
            body: {
              reason,
            },
          });
          const blackList = await BlackList.findOne({
            where: {
              adminId: user.id,
              userId: userTwo.id,
            },
          });
          expect(action).toBe('POST');
          expect(blackList).not.toBeNull();
          expect(returnedBlackList.admin.authTokenVersion).toBeUndefined();
          expect(returnedBlackList.admin.blackListedAt).toBeUndefined();
          expect(returnedBlackList.admin.confirmed).toBeUndefined();
          expect(returnedBlackList.admin.confirmTokenVersion).toBeUndefined();
          expect(new Date(returnedBlackList.admin.createdAt)).toEqual(user.createdAt);
          expect(returnedBlackList.admin.currentProfilePicture).toBeNull();
          expect(returnedBlackList.admin.defaultProfilePicture).toBe(user.defaultProfilePicture);
          expect(returnedBlackList.admin.email).toBeUndefined();
          expect(returnedBlackList.admin.emailTokenVersion).toBeUndefined();
          expect(returnedBlackList.admin.facebookId).toBeUndefined();
          expect(returnedBlackList.admin.googleId).toBeUndefined();
          expect(returnedBlackList.admin.hash).toBeUndefined();
          expect(returnedBlackList.admin.id).toBe(user.id);
          expect(returnedBlackList.admin.isBlackListed).toBeUndefined();
          expect(returnedBlackList.admin.pseudonym).toBe(user.pseudonym);
          expect(returnedBlackList.admin.resetPasswordTokenVersion).toBeUndefined();
          expect(returnedBlackList.admin.role).toBe(user.role);
          expect(returnedBlackList.admin.salt).toBeUndefined();
          expect(returnedBlackList.admin.socialMediaUserName).toBe(user.socialMediaUserName);
          expect(returnedBlackList.admin.updatedAt).toBeUndefined();
          expect(returnedBlackList.admin.updatedEmailTokenVersion).toBeUndefined();
          expect(returnedBlackList.admin.userName).toBe(user.userName);
          expect(returnedBlackList.adminId).toBeUndefined();
          expect(returnedBlackList.active).toBe(true);
          expect(returnedBlackList.createdAt).not.toBeUndefined();
          expect(returnedBlackList.id).not.toBeUndefined();
          expect(returnedBlackList.reason).toBe(reason);
          expect(returnedBlackList.time).toBeNull();
          expect(returnedBlackList.updatedAt).not.toBeUndefined();
          expect(returnedBlackList.updatedById).toBeUndefined();
          expect(returnedBlackList.updatedBy).toBeNull();
          expect(returnedBlackList.user.authTokenVersion).toBeUndefined();
          expect(returnedBlackList.user.blackListedAt).toBeUndefined();
          expect(returnedBlackList.user.confirmed).toBeUndefined();
          expect(returnedBlackList.user.confirmTokenVersion).toBeUndefined();
          expect(new Date(returnedBlackList.user.createdAt)).toEqual(userTwo.createdAt);
          expect(returnedBlackList.user.currentProfilePicture).toBeNull();
          expect(returnedBlackList.user.defaultProfilePicture).toBe(userTwo.defaultProfilePicture);
          expect(returnedBlackList.user.email).toBeUndefined();
          expect(returnedBlackList.user.emailTokenVersion).toBeUndefined();
          expect(returnedBlackList.user.facebookId).toBeUndefined();
          expect(returnedBlackList.user.googleId).toBeUndefined();
          expect(returnedBlackList.user.hash).toBeUndefined();
          expect(returnedBlackList.user.id).toBe(userTwo.id);
          expect(returnedBlackList.user.isBlackListed).toBeUndefined();
          expect(returnedBlackList.user.isBlackListed).toBeUndefined();
          expect(returnedBlackList.user.pseudonym).toBe(userTwo.pseudonym);
          expect(returnedBlackList.user.resetPasswordTokenVersion).toBeUndefined();
          expect(returnedBlackList.user.role).toBe(userTwo.role);
          expect(returnedBlackList.user.salt).toBeUndefined();
          expect(returnedBlackList.user.socialMediaUserName).toBe(userTwo.socialMediaUserName);
          expect(returnedBlackList.user.updatedAt).toBeUndefined();
          expect(returnedBlackList.user.updatedEmailTokenVersion).toBeUndefined();
          expect(returnedBlackList.user.userName).toBe(userTwo.userName);
          expect(returnedBlackList.userId).toBeUndefined();
          expect(status).toBe(200);
        });
        it('post black list with a time', async () => {
          const timeStamp = 1434319925275;
          const time = 1000 * 60 * 10;
          mockDate.set(timeStamp);
          const {
            body: {
              data: {
                blackList,
              },
            },
          } = await postBlackListUserId(app, token, userTwo.id, {
            body: {
              reason: 'black list reason',
              time,
            },
          });
          expect(new Date(timeStamp + time)).toEqual(new Date(blackList.time));
        });
        it('trim reason', async () => {
          const reason = 'black list reason';
          const {
            body: {
              data: {
                blackList: {
                  reason: returnedReason,
                },
              },
            },
          } = await postBlackListUserId(app, token, userTwo.id, {
            body: {
              reason: ` ${reason} `,
            },
          });
          expect(returnedReason).toBe(reason);
        });
        it('set user.isBlackListed and user.blackListedAt', async () => {
          const timeStamp = 1434319925275;
          mockDate.set(timeStamp);
          await postBlackListUserId(app, token, userTwo.id, {
            body: {
              reason: 'blackList reason',
            },
          });
          await userTwo.reload();
          expect(userTwo.blackListedAt).toEqual(new Date(timeStamp));
          expect(userTwo.isBlackListed).toBe(true);
        });
        it('black list an admin if current user role is superAdmin', async () => {
          const {
            user: userThree,
          } = await createUser({
            email: 'user3@email.com',
            role: 'admin',
            userName: 'user3',
          });
          const {
            status,
          } = await postBlackListUserId(app, token, userThree.id, {
            body: {
              reason: 'black list reason',
            },
          });
          expect(status).toBe(200);
        });
        it('return black listed user current profile picture', async () => {
          await createProfilePicture({
            current: true,
            userId: userTwo.id,
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
          } = await postBlackListUserId(app, token, userTwo.id, {
            body: {
              reason: 'black list reason',
            },
          });
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
        it('return admin/superAdmin current profile picture', async () => {
          await createProfilePicture({
            current: true,
            userId: user.id,
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
          } = await postBlackListUserId(app, token, userTwo.id, {
            body: {
              reason: 'black list reason',
            },
          });
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
        it('req.params.userId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await postBlackListUserId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('user'));
          expect(status).toBe(400);
        });
        it('current user.id === :userId', async () => {
          const {
            body,
            status,
          } = await postBlackListUserId(app, token, user.id);
          expect(body.errors).toBe('you can\'t put your own account on the black list');
          expect(status).toBe(400);
        });
        it('user.role === \'superAdmin\'', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            role: 'superAdmin',
            userName: 'user2',
          });
          const {
            body,
            status,
          } = await postBlackListUserId(app, token, userTwo.id);
          expect(body.errors).toBe('you can\'t black list a super admin');
          expect(status).toBe(400);
        });
        it('current user.role === \'admin\' and user.role === \'admin\'', async () => {
          const {
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            role: 'admin',
            userName: 'user2',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            role: 'admin',
            userName: 'user3',
          });
          const { token: tokenTwo } = signAuthToken(userTwo);
          const {
            body,
            status,
          } = await postBlackListUserId(app, tokenTwo, userThree.id);
          expect(body.errors).toBe('you can\'t black list an admin');
          expect(status).toBe(400);
        });
        describe('reason', () => {
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

          it('is not send', async () => {
            const {
              body,
              status,
            } = await postBlackListUserId(app, token, userTwo.id);
            expect(body.errors).toEqual({
              reason: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const {
              body,
              status,
            } = await postBlackListUserId(app, token, userTwo.id, {
              body: {
                reason: 1234,
              },
            });
            expect(body.errors).toEqual({
              reason: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const {
              body,
              status,
            } = await postBlackListUserId(app, token, userTwo.id, {
              body: {
                reason: '',
              },
            });
            expect(body.errors).toEqual({
              reason: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('has less than 10 characters', async () => {
            const {
              body,
              status,
            } = await postBlackListUserId(app, token, userTwo.id, {
              body: {
                reason: 'a'.repeat(9),
              },
            });
            expect(body.errors).toEqual({
              reason: FIELD_MIN_LENGTH(10),
            });
            expect(status).toBe(400);
          });
          it('has more than 200 characters', async () => {
            const {
              body,
              status,
            } = await postBlackListUserId(app, token, userTwo.id, {
              body: {
                reason: 'a'.repeat(201),
              },
            });
            expect(body.errors).toEqual({
              reason: FIELD_MAX_LENGTH(200),
            });
            expect(status).toBe(400);
          });
        });
        describe('time', () => {
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

          it('is not a number', async () => {
            const {
              body,
              status,
            } = await postBlackListUserId(app, token, userTwo.id, {
              body: {
                reason: 'black list reason',
                time: 'not a number',
              },
            });
            expect(body.errors).toEqual({
              time: FIELD_SHOULD_BE_A_NUMBER,
            });
            expect(status).toBe(400);
          });
          it('is less thans 10 minutes (1000 * 60 * 10)', async () => {
            const {
              body,
              status,
            } = await postBlackListUserId(app, token, userTwo.id, {
              body: {
                reason: 'black list reason',
                time: (1000 * 60 * 10) - 1,
              },
            });
            expect(body.errors).toEqual({
              time: 'should be ban at least 10 minutes',
            });
            expect(status).toBe(400);
          });
          it('is more than 1 year (1000 * 60 * 60 * 24 * 365)', async () => {
            const {
              body,
              status,
            } = await postBlackListUserId(app, token, userTwo.id, {
              body: {
                reason: 'black list reason',
                time: (1000 * 60 * 60 * 24 * 365) + 1,
              },
            });
            expect(body.errors).toEqual({
              time: 'should be ban at most 1 year',
            });
            expect(status).toBe(400);
          });
        });
      });
      describe('should return status 404 if', () => {
        it('user not found', async () => {
          const {
            body,
            status,
          } = await postBlackListUserId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
          expect(status).toBe(404);
        });
        it('user is not confirmed', async () => {
          const { user: userTwo } = await createUser({
            confirmed: false,
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body,
            status,
          } = await postBlackListUserId(app, token, userTwo.id, {
            body: {
              reason: 'black list reason',
            },
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
