import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteProfilePicturesId,
  postProfilePictures,
  postUsersLogin,
} from '@src/helpers/test';

import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

describe('/profilePictures', () => {
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

  describe('/:profilePictureId', () => {
    describe('DELETE', () => {
      describe('should return status 200 and', () => {
        it('return action type/profile picture\'id and delete profile picture/image and all images from Google buckets', async () => {
          const {
            body: {
              data: {
                profilePicture: {
                  id: profilePictureId,
                },
              },
            },
          } = await postProfilePictures(app, token);
          const {
            body: {
              action,
              data: {
                profilePictureId: returnedProfilePictureId,
              },
            },
            status,
          } = await deleteProfilePicturesId(app, token, profilePictureId);
          const [bucketCropedImages] = await gc
            .bucket(GALERIES_BUCKET_PP_CROP)
            .getFiles();
          const [bucketOriginalImages] = await gc
            .bucket(GALERIES_BUCKET_PP)
            .getFiles();
          const [bucketPendingImages] = await gc
            .bucket(GALERIES_BUCKET_PP_PENDING)
            .getFiles();
          const images = await Image.findAll();
          const profilePicture = await ProfilePicture.findByPk(profilePictureId);
          expect(status).toBe(200);
          expect(action).toEqual('DELETE');
          expect(returnedProfilePictureId).toEqual(profilePictureId);
          expect(bucketCropedImages.length).toBe(0);
          expect(bucketOriginalImages.length).toBe(0);
          expect(bucketPendingImages.length).toBe(0);
          expect(images.length).toBe(0);
          expect(profilePicture).toBeNull();
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.profilePictureId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await deleteProfilePicturesId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('profile picture'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('profile picture id not found', async () => {
          const {
            body,
            status,
          } = await deleteProfilePicturesId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('profile picture'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
