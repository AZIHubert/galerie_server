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
  login,
  postProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('users', () => {
  let app: Server;
  let sequelize: Sequelize;
  let user: User;
  let token: string;

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

  describe('GET', () => {
    describe('should return status 200 and', () => {
      describe('get all users', () => {
        it('exept current', async () => {
          const { body, status } = await getUsers(app, token);
          expect(body.length).toBe(0);
          expect(status).toBe(200);
        });
        it('exept not confirmed', async () => {
          await createUser({
            confirmed: false,
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { body } = await getUsers(app, token);
          expect(body.length).toBe(0);
        });
        it('exept black listed users', async () => {
          const { id } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await BlackList.create({
            adminId: user.id,
            reason: 'black list user',
            userId: id,
          });
          const { body } = await getUsers(app, token);
          expect(body.length).toBe(0);
        });
        it('return one user', async () => {
          await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { body } = await getUsers(app, token);
          expect(body.length).toBe(1);
        });
        it('should return only the first 20th users order by userName', async () => {
          const numOfUsers = new Array(25).fill(0);
          await Promise.all(
            numOfUsers.map(async (_, index) => {
              await createUser({
                email: `user${index + 2}@email.com`,
                userName: `user${index + 2}`,
              });
            }),
          );
          const { body: bodyFirst } = await getUsers(app, token);
          const { body: bodySecond } = await getUsers(app, token, 2);
          expect(bodyFirst.length).toBe(20);
          expect(bodySecond.length).toBe(5);
        });
        it('return only relevent attributes', async () => {
          const {
            createdAt,
            id,
            pseudonym,
            role,
            updatedAt,
            userName,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: [returnedUser],
          } = await getUsers(app, token);
          expect(returnedUser.authTokenVersion).toBeUndefined();
          expect(returnedUser.blackList).toBeUndefined();
          expect(returnedUser.confirmed).toBeUndefined();
          expect(returnedUser.confirmTokenVersion).toBeUndefined();
          expect(new Date(returnedUser.createdAt)).toEqual(createdAt);
          expect(returnedUser.defaultProfilePicture).toBeNull();
          expect(returnedUser.email).toBeUndefined();
          expect(returnedUser.facebookId).toBeUndefined();
          expect(returnedUser.googleId).toBeUndefined();
          expect(returnedUser.id).toEqual(id);
          expect(returnedUser.password).toBeUndefined();
          expect(returnedUser.pseudonym).toEqual(pseudonym);
          expect(returnedUser.resetPasswordTokenVersion).toBeUndefined();
          expect(returnedUser.role).toEqual(role);
          expect(returnedUser.updatedEmailTokenVersion).toBeUndefined();
          expect(new Date(returnedUser.updatedAt)).toEqual(updatedAt);
          expect(returnedUser.userName).toEqual(userName);
        });
        it('include current profile picture', async () => {
          const { email } = await createUser({
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
                id,
              },
            },
          } = await postProfilePicture(app, tokenTwo);
          const {
            body: [{
              currentProfilePicture,
            }],
          } = await getUsers(app, token);
          expect(currentProfilePicture.createdAt).toBeUndefined();
          expect(currentProfilePicture.cropedImageId).toBeUndefined();
          expect(currentProfilePicture.current).toBeUndefined();
          expect(currentProfilePicture.id).toEqual(id);
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
