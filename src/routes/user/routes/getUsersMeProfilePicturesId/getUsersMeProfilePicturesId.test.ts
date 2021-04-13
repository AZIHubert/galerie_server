import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  getProfilePicture,
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
    describe('profilePictures', () => {
      describe(':id', () => {
        describe('GET', () => {
          describe('should return status 200 and', () => {
            it('return profile picture', async () => {
              const {
                body: {
                  profilePicture: {
                    id,
                    current,
                  },
                },
              } = await postProfilePicture(app, token);
              const {
                body: {
                  action,
                  profilePicture,
                },
                status,
              } = await getProfilePicture(app, token, id);
              expect(action).toEqual('GET');
              expect(status).toEqual(200);
              expect(profilePicture.createdAt).toBeUndefined();
              expect(profilePicture.cropedImageId).toBeUndefined();
              expect(profilePicture.current).toEqual(current);
              expect(profilePicture.id).toEqual(id);
              expect(profilePicture.originalImageId).toBeUndefined();
              expect(profilePicture.pendingImageId).toBeUndefined();
              expect(profilePicture.updatedAt).toBeUndefined();
              expect(profilePicture.userId).toBeUndefined();
              expect(profilePicture.cropedImage.signedUrl).toBeTruthy();
              expect(profilePicture.cropedImage.createdAt).toBeUndefined();
              expect(profilePicture.cropedImage.updatedAt).toBeUndefined();
              expect(profilePicture.originalImage.signedUrl).toBeTruthy();
              expect(profilePicture.originalImage.createdAt).toBeUndefined();
              expect(profilePicture.originalImage.updatedAt).toBeUndefined();
              expect(profilePicture.pendingImage.signedUrl).toBeTruthy();
              expect(profilePicture.pendingImage.createdAt).toBeUndefined();
              expect(profilePicture.pendingImage.updatedAt).toBeUndefined();
            });
            describe('should return status 404 if', () => {
              it('profile picture id not found', async () => {
                const { body, status } = await getProfilePicture(app, token, '1000');
                expect(status).toBe(404);
                expect(body).toStrictEqual({
                  errors: 'profile picture not found',
                });
              });
            });
          });
        });
      });
    });
  });
});
