import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  BlackList,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
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

describe('/users', () => {
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

  describe('/:id', () => {
    describe('GET', () => {
      describe('shouls return status 200 and', () => {
        it('return user', async () => {
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
              action,
              data: {
                user: returnedUser,
              },
            },
            status,
          } = await getUserId(app, token, id);
          expect(action).toBe('GET');
          expect(status).toBe(200);
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
              data: {
                profilePicture: {
                  id: profilePictureId,
                },
              },
            },
          } = await postProfilePicture(app, tokenTwo);
          const {
            body: {
              data: {
                user: {
                  currentProfilePicture,
                },
              },
            },
          } = await getUserId(app, token, id);
          expect(currentProfilePicture.createdAt).not.toBeUndefined();
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
          expect(currentProfilePicture.cropedImagesId).toBeUndefined();
          expect(currentProfilePicture.current).toBeUndefined();
          expect(currentProfilePicture.id).toBe(profilePictureId);
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
          expect(currentProfilePicture.originalImageId).toBeUndefined();
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
          expect(currentProfilePicture.pendingImageId).toBeUndefined();
          expect(currentProfilePicture.updatedAt).toBeUndefined();
          expect(currentProfilePicture.userId).toBeUndefined();
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.userId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await getUserId(app, token, '100');
          expect(body.errors).toEqual(INVALID_UUID('user'));
          expect(status).toBe(400);
        });
        it('params.userId is the same as the current user.id', async () => {
          const {
            body,
            status,
          } = await getUserId(app, token, user.id);
          expect(body.errors).toEqual('params.id cannot be the same as your current one');
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('user not found', async () => {
          const {
            body,
            status,
          } = await getUserId(app, token, uuidv4());
          expect(status).toBe(404);
          expect(body).toEqual({
            errors: USER_NOT_FOUND,
          });
        });
        it('user is not confirmed', async () => {
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
          expect(body).toEqual({
            errors: USER_NOT_FOUND,
          });
        });
        it('user is black listed', async () => {
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
          expect(body).toEqual({
            errors: 'user is black listed',
          });
        });
      });
    });
  });
});
