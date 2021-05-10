import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  login,
  postProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/profilePicture', () => {
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

  describe('POST', () => {
    describe('should return status 200 and', () => {
      it('create a profile picture, images and store in Google buckets', async () => {
        const {
          body: {
            action,
            data: {
              profilePicture,
            },
          },
          status,
        } = await postProfilePicture(app, token);
        const images = await Image.findAll();
        expect(action).toBe('POST');
        expect(status).toBe(200);
        expect(images.length).toBe(3);
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
        expect(profilePicture.current).toBeTruthy();
        expect(profilePicture.id).toBeTruthy();
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
      });
      it('should set all other profile picture\'s to null', async () => {
        const {
          body: {
            data: {
              profilePicture: {
                id,
              },
            },
          },
        } = await postProfilePicture(app, token);
        await postProfilePicture(app, token);
        const profilePicture = await ProfilePicture
          .findByPk(id) as ProfilePicture;
        expect(profilePicture.current).toBe(false);
      });
    });
  });
});
