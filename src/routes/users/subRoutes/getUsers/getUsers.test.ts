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
  getUsers,
  postProfilePictures,
  postUsersLogin,
} from '@src/helpers/test';

import initApp from '@src/server';

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
      const {
        password,
        user: createdUser,
      } = await createUser({});

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
      await sequelize.sync({ force: true });
      await cleanGoogleBuckets();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('GET', () => {
    describe('should return status 200 and', () => {
      describe('get all users', () => {
        it('exept current one', async () => {
          const {
            body: {
              action,
              data: {
                users,
              },
            },
            status,
          } = await getUsers(app, token);
          expect(action).toBe('GET');
          expect(users.length).toBe(0);
          expect(status).toBe(200);
        });
        it('exept not confirmed', async () => {
          await createUser({
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
          } = await getUsers(app, token);
          expect(users.length).toBe(0);
        });
        it('exept black listed users', async () => {
          const {
            user: {
              id,
            },
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
          } = await getUsers(app, token);
          expect(users.length).toBe(0);
        });
        it('should return a pack of 20 users', async () => {
          const NUM = 21;
          const numOfUsers = new Array(NUM).fill(0);
          await Promise.all(
            numOfUsers.map(async (_, index) => {
              await createUser({
                email: `user${index + 2}@email.com`,
                userName: `user${index + 2}`,
              });
            }),
          );
          const {
            body: {
              data: {
                users: firstPack,
              },
            },
          } = await getUsers(app, token);
          const {
            body: {
              data: {
                users: secondPack,
              },
            },
          } = await getUsers(app, token, 2);
          expect(firstPack.length).toBe(20);
          expect(secondPack.length).toBe(1);
        });
        it('return only relevent attributes', async () => {
          const {
            user: {
              id,
              pseudonym,
              role,
              userName,
            },
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
          } = await getUsers(app, token);
          expect(returnedUser.authTokenVersion).toBeUndefined();
          expect(returnedUser.blackList).toBeUndefined();
          expect(returnedUser.confirmed).toBeUndefined();
          expect(returnedUser.confirmTokenVersion).toBeUndefined();
          expect(returnedUser.createdAt).not.toBeUndefined();
          expect(returnedUser.defaultProfilePicture).toBeNull();
          expect(returnedUser.emailTokenVersion).toBeUndefined();
          expect(returnedUser.email).toBeUndefined();
          expect(returnedUser.emailTokenVersion).toBeUndefined();
          expect(returnedUser.facebookId).toBeUndefined();
          expect(returnedUser.googleId).toBeUndefined();
          expect(returnedUser.id).toEqual(id);
          expect(returnedUser.password).toBeUndefined();
          expect(returnedUser.pseudonym).toEqual(pseudonym);
          expect(returnedUser.resetPasswordTokenVersion).toBeUndefined();
          expect(returnedUser.role).toEqual(role);
          expect(returnedUser.updatedAt).toBeUndefined();
          expect(returnedUser.userName).toEqual(userName);
        });
        it('include current profile picture', async () => {
          const {
            password,
            user: {
              email,
            },
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
              password,
              userNameOrEmail: email,
            },
          });
          const {
            body: {
              data: {
                profilePicture: {
                  id,
                },
              },
            },
          } = await postProfilePictures(app, tokenTwo);
          const {
            body: {
              data: {
                users: [{
                  currentProfilePicture,
                }],
              },
            },
          } = await getUsers(app, token);
          expect(currentProfilePicture.createdAt).not.toBeUndefined();
          expect(currentProfilePicture.cropedImageId).toBeUndefined();
          expect(currentProfilePicture.current).toBeUndefined();
          expect(currentProfilePicture.id).toEqual(id);
          expect(currentProfilePicture.originalImageId).toBeUndefined();
          expect(currentProfilePicture.pendingImageId).toBeUndefined();
          expect(currentProfilePicture.updatedAt).toBeUndefined();
          expect(currentProfilePicture.userId).toBeUndefined();
          expect(currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
          expect(currentProfilePicture.cropedImage.createdAt).toBeUndefined();
          expect(currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
          expect(currentProfilePicture.originalImage.signedUrl).not.toBeUndefined();
          expect(currentProfilePicture.originalImage.createdAt).toBeUndefined();
          expect(currentProfilePicture.originalImage.updatedAt).toBeUndefined();
          expect(currentProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
          expect(currentProfilePicture.pendingImage.createdAt).toBeUndefined();
          expect(currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
        });
      });
    });
  });
});
