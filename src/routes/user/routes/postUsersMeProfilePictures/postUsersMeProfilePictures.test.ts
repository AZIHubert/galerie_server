import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import { FILE_IS_REQUIRED } from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  login,
  postProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

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
    jest.clearAllMocks();
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
    describe('profilePicture', () => {
      describe('POST', () => {
        describe('should return status 200 and', () => {
          it('create a profile picture, images and store in Google buckets', async () => {
            const { status } = response;
            expect(status).toBe(200);
            expect(profilePictures.length).toBe(1);
          });
          it('should set all other profile picture\'s to null', async () => {});
          it('store the pending image', async () => {
            const { status } = response;
            const pendingImages = await Image.findAll({
              where: {
                bucketName: GALERIES_BUCKET_PP_PENDING,
              },
            });
            expect(status).toBe(200);
            expect(pendingImages.length).toBe(1);
            expect(profilePictures[0].pendingImageId).toBe(pendingImages[0].id);
          });
          it('set the user\'s current profile picture', async () => {
            const { body: { id } } = response;
            const { currentProfilePictureId } = await user.reload();
            expect(currentProfilePictureId).toBe(id);
          });
        });
        describe('should return error 400 if', () => {
          it('image is not attached', async () => {
            const { body, status } = await agent
              .post('/users/me/ProfilePictures')
              .set('authorization', token);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                image: FILE_IS_REQUIRED,
              },
            });
          });
          it('attached file\'s name is not \'image\'', async () => {
            const { body, status } = await agent
              .post('/users/me/ProfilePictures')
              .set('authorization', token)
              .attach('file', `${__dirname}/../../ressources/image.jpg`);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: 'something went wrong with attached file',
            });
          });
          it('multiple files are attached', async () => {
            const { body, status } = await agent
              .post('/users/me/ProfilePictures')
              .set('authorization', token)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: 'something went wrong with attached file',
            });
          });
          it('attached file is not jpg/jpeg/png', async () => {
            const { body, status } = await agent
              .post('/users/me/ProfilePictures')
              .set('authorization', token)
              .attach('image', `${__dirname}/../../ressources/text.txt`);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                image: 'uploaded file must be an image',
              },
            });
          });
        });
      });
    });
  });
});
