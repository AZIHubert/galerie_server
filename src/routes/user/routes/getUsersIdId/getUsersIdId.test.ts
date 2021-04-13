import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  BlackList,
  User,
} from '@src/db/models';

import {
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  getUserId,
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
    app = initApp();
    sequelize = initSequelize();
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

  describe('id', () => {
    describe(':id', () => {
      describe('GET', () => {
        describe('shouls return status 200 and', () => {
          it('get user :id with only relevent attributes', async () => {
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
              body: returnedUser,
              status,
            } = await getUserId(app, token, id);
            expect(status).toBe(200);
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
            const {
              body: {
                currentProfilePicture,
              },
            } = await getUserId(app, token, id);
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
        describe('should return status 400 if', () => {
          it('params.id is the same than the current one', async () => {
            const { body, status } = await getUserId(app, token, user.id);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: 'params.id is the same as your current one',
            });
          });
        });
        describe('should return status 404 if', () => {
          it('user params.id not found', async () => {
            const {
              body,
              status,
            } = await getUserId(app, token, '1000');
            expect(status).toBe(404);
            expect(body).toStrictEqual({
              errors: USER_NOT_FOUND,
            });
          });
          it('user params.id is not confirmed', async () => {
            const {
              id,
            } = await createUser({
              confirmed: false,
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await getUserId(app, token, id);
            expect(status).toBe(404);
            expect(body).toStrictEqual({
              errors: USER_NOT_FOUND,
            });
          });
          it('user params.id is black listed', async () => {
            const {
              id,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await BlackList.create({
              adminId: user.id,
              reason: 'black list reason',
              userId: id,
            });
            const {
              body,
              status,
            } = await getUserId(app, token, id);
            expect(status).toBe(404);
            expect(body).toStrictEqual({
              errors: USER_NOT_FOUND,
            });
          });
        });
      });
    });
  });
});
