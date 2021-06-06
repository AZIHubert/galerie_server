import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  getUsersMe,
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
    app = initApp();
    sequelize = initSequelize();
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

  describe('/me', () => {
    describe('GET', () => {
      describe('should return status 200 and', () => {
        it('return your own account with relevent properties', async () => {
          const {
            body: {
              action,
              data: {
                user: returnedUser,
              },
            },
            status,
          } = await getUsersMe(app, token);
          expect(action).toBe('GET');
          expect(status).toBe(200);
          expect(returnedUser.authTokenVersion).toBeUndefined();
          expect(returnedUser.confirmed).toBeUndefined();
          expect(returnedUser.confirmTokenVersion).toBeUndefined();
          expect(new Date(returnedUser.createdAt)).toEqual(user.createdAt);
          expect(returnedUser.defaultProfilePicture).toBeNull();
          expect(returnedUser.email).toBeUndefined();
          expect(returnedUser.emeilTokenVersion).toBeUndefined();
          expect(returnedUser.facebookId).toBeUndefined();
          expect(returnedUser.googleId).toBeUndefined();
          expect(returnedUser.id).toEqual(user.id);
          expect(returnedUser.password).toBeUndefined();
          expect(returnedUser.pseudonym).toEqual(user.pseudonym);
          expect(returnedUser.resetPasswordTokenVersion).toBeUndefined();
          expect(returnedUser.role).toEqual(user.role);
          expect(returnedUser.updatedAt).toBeUndefined();
          expect(returnedUser.updatedEmailTokenVersion).toBeUndefined();
          expect(returnedUser.userName).toEqual(user.userName);
        });
        it('return current profile picture', async () => {
          await postProfilePictures(app, token);
          const {
            body: {
              data: {
                user: {
                  currentProfilePicture,
                },
              },
            },
          } = await getUsersMe(app, token);
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
