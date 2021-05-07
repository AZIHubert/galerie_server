import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  ProfilePicture,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  login,
  postProfilePicture,
  putProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/profilePictures', () => {
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
    describe('PUT', () => {
      describe('should return status 200 and', () => {
        it('should return profile picture and action', async () => {
          const {
            body: {
              data: {
                profilePicture: {
                  id,
                },
              },
            },
          } = await postProfilePicture(app, token);
          const {
            body: {
              action,
              data: {
                profilePicture,
              },
            },
            status,
          } = await putProfilePicture(app, token, id);
          expect(action).toBe('PUT');
          expect(profilePicture.createdAt).toBeTruthy();
          expect(profilePicture.cropedImage.bucketName).toBeUndefined();
          expect(profilePicture.cropedImage.createdAt).toBeUndefined();
          expect(profilePicture.cropedImage.fileName).toBeUndefined();
          expect(profilePicture.cropedImage.format).toBeTruthy();
          expect(profilePicture.cropedImage.height).toBeTruthy();
          expect(profilePicture.cropedImage.id).toBeUndefined();
          expect(profilePicture.cropedImage.signedUrl).toBeTruthy();
          expect(profilePicture.cropedImage.size).toBeTruthy();
          expect(profilePicture.cropedImage.updatedAt).toBeUndefined();
          expect(profilePicture.cropedImage.width).toBeTruthy();
          expect(profilePicture.cropedImageId).toBeUndefined();
          expect(profilePicture.current).toBeFalsy();
          expect(profilePicture.id).toBe(id);
          expect(profilePicture.originalImage.bucketName).toBeUndefined();
          expect(profilePicture.originalImage.createdAt).toBeUndefined();
          expect(profilePicture.originalImage.fileName).toBeUndefined();
          expect(profilePicture.originalImage.format).toBeTruthy();
          expect(profilePicture.originalImage.height).toBeTruthy();
          expect(profilePicture.originalImage.id).toBeUndefined();
          expect(profilePicture.originalImage.signedUrl).toBeTruthy();
          expect(profilePicture.originalImage.size).toBeTruthy();
          expect(profilePicture.originalImage.updatedAt).toBeUndefined();
          expect(profilePicture.originalImage.width).toBeTruthy();
          expect(profilePicture.originalImageId).toBeUndefined();
          expect(profilePicture.pendingImage.bucketName).toBeUndefined();
          expect(profilePicture.pendingImage.createdAt).toBeUndefined();
          expect(profilePicture.pendingImage.fileName).toBeUndefined();
          expect(profilePicture.pendingImage.format).toBeTruthy();
          expect(profilePicture.pendingImage.height).toBeTruthy();
          expect(profilePicture.pendingImage.id).toBeUndefined();
          expect(profilePicture.pendingImage.signedUrl).toBeTruthy();
          expect(profilePicture.pendingImage.size).toBeTruthy();
          expect(profilePicture.pendingImage.updatedAt).toBeUndefined();
          expect(profilePicture.pendingImage.width).toBeTruthy();
          expect(profilePicture.pendingImageId).toBeUndefined();
          expect(profilePicture.updatedAt).toBeUndefined();
          expect(profilePicture.userId).toBeUndefined();
          expect(status).toBe(200);
        });
        it('should set current to true and the previous one to false', async () => {
          const {
            body: {
              data: {
                profilePicture: {
                  id,
                },
              },
            },
          } = await postProfilePicture(app, token);
          const {
            body: {
              data: {
                profilePicture: {
                  id: previousCurrentId,
                },
              },
            },
          } = await postProfilePicture(app, token);
          await putProfilePicture(app, token, id);
          const profilePicture = await ProfilePicture.findByPk(id) as ProfilePicture;
          const previousCurrentProfilePicture = await ProfilePicture
            .findByPk(previousCurrentId) as ProfilePicture;
          expect(profilePicture.current).toBeTruthy();
          expect(previousCurrentProfilePicture.current).toBeFalsy();
        });
      });
      describe('should return status 404 if', () => {
        it('profile picture id not found', async () => {
          const {
            body,
            status,
          } = await putProfilePicture(app, token, '1');
          expect(body.errors).toBe('profile picture not found');
          expect(status).toBe(404);
        });
      });
    });
  });
});
