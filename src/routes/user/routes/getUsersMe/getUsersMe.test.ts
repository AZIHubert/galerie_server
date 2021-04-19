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
  getMe,
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

  describe('me', () => {
    describe('GET', () => {
      describe('should return status 200 and', () => {
        it('return your own account with relevent properties', async () => {
          const {
            body: returnedUser,
            status,
          } = await getMe(app, token);
          expect(status).toBe(200);
          expect(returnedUser.authTokenVersion).toBeUndefined();
          expect(returnedUser.blackList).toBeUndefined();
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
          expect(returnedUser.updatedEmailTokenVersion).toBeUndefined();
          expect(new Date(returnedUser.updatedAt)).toEqual(user.updatedAt);
          expect(returnedUser.userName).toEqual(user.userName);
        });
        it('return current profile picture', async () => {
          const {
            body: {
              data: {
                profilePicture: {
                  id: profilePictureId,
                },
              },
            },
          } = await postProfilePicture(app, token);
          const {
            body: {
              currentProfilePicture,
            },
          } = await getMe(app, token);
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
