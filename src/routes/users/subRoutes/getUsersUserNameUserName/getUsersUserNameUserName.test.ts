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
  getUsersUserName,
  login,
  postProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/users', () => {
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
      user = await createUser({});
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

  describe('/userName', () => {
    describe('/:userName', () => {
      describe('GET', () => {
        describe('should return status 200 and', () => {
          it('should not return current user', async () => {
            const {
              body: {
                action,
                data: {
                  users,
                },
              },
              status,
            } = await getUsersUserName(app, token, user.userName);
            expect(action).toBe('GET');
            expect(status).toBe(200);
            expect(users.length).toBe(0);
          });
          it('should not return not confirmed users', async () => {
            const { userName } = await createUser({
              confirmed: false,
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                data: {
                  users,
                },
              },
            } = await getUsersUserName(app, token, userName);
            expect(users.length).toBe(0);
          });
          it('should not return black listed users', async () => {
            const {
              id,
              userName,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await BlackList.create({
              adminId: user.id,
              reason: 'black list user',
              userId: id,
            });
            const {
              body: {
                data: {
                  users,
                },
              },
            } = await getUsersUserName(app, token, userName);
            expect(users.length).toBe(0);
          });
          it('should return users with relevent attributes', async () => {
            const {
              createdAt,
              id,
              pseudonym,
              role,
              userName,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                data: {
                  users: [returnedUser],
                },
              },
            } = await getUsersUserName(app, token, userName);
            expect(returnedUser.authTokenVersion).toBeUndefined();
            expect(returnedUser.blackList).toBeUndefined();
            expect(returnedUser.confirmed).toBeUndefined();
            expect(returnedUser.confirmTokenVersion).toBeUndefined();
            expect(new Date(returnedUser.createdAt)).toEqual(createdAt);
            expect(returnedUser.defaultProfilePicture).toBeNull();
            expect(returnedUser.emailTokenVersion).toBeUndefined();
            expect(returnedUser.email).toBeUndefined();
            expect(returnedUser.facebookId).toBeUndefined();
            expect(returnedUser.googleId).toBeUndefined();
            expect(returnedUser.id).toEqual(id);
            expect(returnedUser.password).toBeUndefined();
            expect(returnedUser.pseudonym).toEqual(pseudonym);
            expect(returnedUser.resetPasswordTokenVersion).toBeUndefined();
            expect(returnedUser.role).toEqual(role);
            expect(returnedUser.updatedEmailTokenVersion).toBeUndefined();
            expect(returnedUser.updatedAt).toBeUndefined();
            expect(returnedUser.userName).toEqual(userName);
          });
          it('should return a pack of 20 users', async () => {
            const userName = 'user';
            const numOfUsers = new Array(25).fill(0);
            await Promise.all(
              numOfUsers.map(async (_, index) => {
                await createUser({
                  email: `user${index + 2}@email.com`,
                  userName: `${userName}${index + 2}`,
                });
              }),
            );
            const {
              body: {
                data: {
                  users: firstPack,
                },
              },
            } = await getUsersUserName(app, token, userName, 1);
            const {
              body: {
                data: {
                  users: secondPack,
                },
              },
            } = await getUsersUserName(app, token, userName, 2);
            expect(firstPack.length).toBe(20);
            expect(secondPack.length).toBe(5);
          });
          it('should be case insensitive', async () => {
            const {
              userName,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                data: {
                  users,
                },
              },
            } = await getUsersUserName(app, token, userName.toUpperCase());
            expect(users.length).toBe(1);
          });
          it('should return current profile picture with relevent attributes', async () => {
            const {
              email,
              userName,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                token: tokenTwo,
              },
            } = await login(app, email, userPassword);
            await postProfilePicture(app, tokenTwo);
            const {
              body: {
                data: {
                  users: [{
                    currentProfilePicture,
                  }],
                },
              },
            } = await getUsersUserName(app, token, userName);
            expect(currentProfilePicture.createdAt).not.toBeUndefined();
            expect(currentProfilePicture.cropedImageId).toBeUndefined();
            expect(currentProfilePicture.cropedImage.bucketName).toBeUndefined();
            expect(currentProfilePicture.cropedImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.cropedImage.fileName).toBeUndefined();
            expect(currentProfilePicture.cropedImage.format).not.toBeUndefined();
            expect(currentProfilePicture.cropedImage.height).not.toBeUndefined();
            expect(currentProfilePicture.cropedImage.id).toBeUndefined();
            expect(currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
            expect(currentProfilePicture.cropedImage.size).not.toBeUndefined();
            expect(currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
            expect(currentProfilePicture.cropedImage.width).not.toBeUndefined();
            expect(currentProfilePicture.current).toBeUndefined();
            expect(currentProfilePicture.id).not.toBeUndefined();
            expect(currentProfilePicture.originalImageId).toBeUndefined();
            expect(currentProfilePicture.originalImage.bucketName).toBeUndefined();
            expect(currentProfilePicture.originalImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.originalImage.fileName).toBeUndefined();
            expect(currentProfilePicture.originalImage.format).not.toBeUndefined();
            expect(currentProfilePicture.originalImage.height).not.toBeUndefined();
            expect(currentProfilePicture.originalImage.id).toBeUndefined();
            expect(currentProfilePicture.originalImage.signedUrl).not.toBeUndefined();
            expect(currentProfilePicture.originalImage.size).not.toBeUndefined();
            expect(currentProfilePicture.originalImage.updatedAt).toBeUndefined();
            expect(currentProfilePicture.originalImage.width).not.toBeUndefined();
            expect(currentProfilePicture.pendingImageId).toBeUndefined();
            expect(currentProfilePicture.pendingImage.bucketName).toBeUndefined();
            expect(currentProfilePicture.pendingImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.pendingImage.fileName).toBeUndefined();
            expect(currentProfilePicture.pendingImage.format).not.toBeUndefined();
            expect(currentProfilePicture.pendingImage.height).not.toBeUndefined();
            expect(currentProfilePicture.pendingImage.id).toBeUndefined();
            expect(currentProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
            expect(currentProfilePicture.pendingImage.size).not.toBeUndefined();
            expect(currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
            expect(currentProfilePicture.pendingImage.width).not.toBeUndefined();
            expect(currentProfilePicture.updatedAt).toBeUndefined();
            expect(currentProfilePicture.userId).toBeUndefined();
          });
        });
      });
    });
  });
});
