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
  getBlackListedUsers,
  login,
  postProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('users', () => {
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
      await sequelize.sync({ force: true });
      await cleanGoogleBuckets();
      user = await createUser({
        role: 'admin',
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
      await sequelize.sync({ force: true });
      await cleanGoogleBuckets();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('blackList', () => {
    // TODO:
    it('should return black listed user even if admin is deleted', () => {});
    describe('GET', () => {
      describe('should return status 200 and', () => {
        it('don\'t return non black listed user', async () => {
          await createUser({
            confirmed: false,
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { body, status } = await getBlackListedUsers(app, token);
          expect(status).toBe(200);
          expect(body.length).toBe(0);
        });
        it('get all black listed users with relevent attributes', async () => {
          const {
            createdAt,
            id,
            pseudonym,
            updatedAt,
            userName,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const reason = 'black list user two';
          const {
            createdAt: blackListCreatedAt,
            id: blackListId,
            updatedAt: blackListUpdatedAt,
          } = await BlackList.create({
            adminId: user.id,
            reason,
            userId: id,
          });
          const {
            body: [returnedUser],
          } = await getBlackListedUsers(app, token);
          expect(returnedUser.authTokenVersion).toBeUndefined();
          expect(returnedUser.confirmed).toBeUndefined();
          expect(returnedUser.confirmTokenVersion).toBeUndefined();
          expect(new Date(returnedUser.createdAt)).toEqual(createdAt);
          expect(returnedUser.defaultProfilePicture).toBeNull();
          expect(returnedUser.email).toBeUndefined();
          expect(returnedUser.emailTokenVersion).toBeUndefined();
          expect(returnedUser.facebookId).toBeUndefined();
          expect(returnedUser.googleId).toBeUndefined();
          expect(returnedUser.id).toEqual(id);
          expect(returnedUser.password).toBeUndefined();
          expect(returnedUser.pseudonym).toEqual(pseudonym);
          expect(returnedUser.resetPasswordTokenVersion).toBeUndefined();
          expect(new Date(returnedUser.updatedAt)).toEqual(updatedAt);
          expect(returnedUser.userName).toEqual(userName);
          expect(returnedUser.blackList.adminId).toBeUndefined();
          expect(new Date(returnedUser.blackList.createdAt)).toEqual(blackListCreatedAt);
          expect(returnedUser.blackList.id).toEqual(blackListId);
          expect(returnedUser.blackList.reason).toEqual(reason);
          expect(returnedUser.blackList.time).toEqual(null);
          expect(new Date(returnedUser.blackList.updatedAt)).toEqual(blackListUpdatedAt);
          expect(returnedUser.blackList.userId).toBeUndefined();
          expect(returnedUser.blackList.admin.authTokenVersion).toBeUndefined();
          expect(returnedUser.blackList.admin.confirmed).toBeUndefined();
          expect(returnedUser.blackList.admin.confirmTokenVersion).toBeUndefined();
          expect(new Date(returnedUser.blackList.admin.createdAt)).toEqual(user.createdAt);
          expect(returnedUser.blackList.admin.defaultProfilePicture).toBeNull();
          expect(returnedUser.blackList.admin.email).toBeUndefined();
          expect(returnedUser.blackList.admin.emailTokenVersion).toBeUndefined();
          expect(returnedUser.blackList.admin.facebookId).toBeUndefined();
          expect(returnedUser.blackList.admin.googleId).toBeUndefined();
          expect(returnedUser.blackList.admin.id).toEqual(user.id);
          expect(returnedUser.blackList.admin.password).toBeUndefined();
          expect(returnedUser.blackList.admin.pseudonym).toEqual(user.pseudonym);
          expect(returnedUser.blackList.admin.resetPasswordTokenVersion).toBeUndefined();
          expect(returnedUser.blackList.admin.role).toEqual(user.role);
          expect(returnedUser.blackList.admin.updatedEmailTokenVersion).toBeUndefined();
          expect(new Date(returnedUser.blackList.admin.updatedAt)).toEqual(user.updatedAt);
          expect(returnedUser.blackList.admin.userName).toEqual(user.userName);
        });
        it('should return only the first 20th black listed users', async () => {
          const numOfUsers = new Array(25).fill(0);
          await Promise.all(
            numOfUsers.map(async (_, index) => {
              const { id } = await createUser({
                email: `user${index + 2}@email.com`,
                userName: `user${index + 2}`,
              });
              await BlackList.create({
                adminId: user.id,
                reason: 'black list reason',
                userId: id,
              });
            }),
          );
          const { body: bodyFirst } = await getBlackListedUsers(app, token);
          const { body: bodySecond } = await getBlackListedUsers(app, token, 2);
          expect(bodyFirst.length).toEqual(20);
          expect(bodySecond.length).toEqual(5);
        });
        it('should include users current profile picture', async () => {
          const {
            email,
            id,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              token: tokenTwo,
            },
          } = await login(app, email, userPassword);
          const {
            body: {
              profilePicture: {
                id: profilePictureId,
              },
            },
          } = await postProfilePicture(app, tokenTwo);
          await BlackList.create({
            adminId: user.id,
            reason: 'black list reason',
            userId: id,
          });
          const {
            body: [{
              currentProfilePicture,
            }],
          } = await getBlackListedUsers(app, token);
          expect(currentProfilePicture.createdAt).toBeUndefined();
          expect(currentProfilePicture.cropedImageId).toBeUndefined();
          expect(currentProfilePicture.current).toBeUndefined();
          expect(currentProfilePicture.id).toEqual(profilePictureId);
          expect(currentProfilePicture.originalImageId).toBeUndefined();
          expect(currentProfilePicture.pendingImageId).toBeUndefined();
          expect(currentProfilePicture.updatedAt).toBeUndefined();
          expect(currentProfilePicture.userId).toBeUndefined();
          expect(currentProfilePicture.cropedImage.signedUrl).toBeTruthy();
          expect(currentProfilePicture.cropedImage.createdAt).toBeUndefined();
          expect(currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
          expect(currentProfilePicture.originalImage.signedUrl).toBeTruthy();
          expect(currentProfilePicture.originalImage.createdAt).toBeUndefined();
          expect(currentProfilePicture.originalImage.updatedAt).toBeUndefined();
          expect(currentProfilePicture.pendingImage.signedUrl).toBeTruthy();
          expect(currentProfilePicture.pendingImage.createdAt).toBeUndefined();
          expect(currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
        });
        it('should include admin current profile picture', async () => {
          const {
            body: {
              profilePicture: {
                id: profilePictureId,
              },
            },
          } = await postProfilePicture(app, token);
          const { id } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await BlackList.create({
            adminId: user.id,
            reason: 'black list reason',
            userId: id,
          });
          const {
            body: [{
              blackList: {
                admin: {
                  currentProfilePicture,
                },
              },
            }],
          } = await getBlackListedUsers(app, token);
          expect(currentProfilePicture.createdAt).toBeUndefined();
          expect(currentProfilePicture.cropedImageId).toBeUndefined();
          expect(currentProfilePicture.current).toBeUndefined();
          expect(currentProfilePicture.id).toEqual(profilePictureId);
          expect(currentProfilePicture.originalImageId).toBeUndefined();
          expect(currentProfilePicture.pendingImageId).toBeUndefined();
          expect(currentProfilePicture.updatedAt).toBeUndefined();
          expect(currentProfilePicture.userId).toBeUndefined();
          expect(currentProfilePicture.cropedImage.signedUrl).toBeTruthy();
          expect(currentProfilePicture.cropedImage.createdAt).toBeUndefined();
          expect(currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
          expect(currentProfilePicture.originalImage.signedUrl).toBeTruthy();
          expect(currentProfilePicture.originalImage.createdAt).toBeUndefined();
          expect(currentProfilePicture.originalImage.updatedAt).toBeUndefined();
          expect(currentProfilePicture.pendingImage.signedUrl).toBeTruthy();
          expect(currentProfilePicture.pendingImage.createdAt).toBeUndefined();
          expect(currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
        });
      });
    });
  });
});
