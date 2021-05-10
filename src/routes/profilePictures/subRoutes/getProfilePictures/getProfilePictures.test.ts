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
  getProfilePictures,
  login,
  postProfilePicture,
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

  describe('GET', () => {
    describe('should return status 200 and', () => {
      it('return an empty array', async () => {
        const {
          body: {
            action,
            data: {
              profilePictures,
            },
          },
          status,
        } = await getProfilePictures(app, token);
        expect(action).toBe('GET');
        expect(profilePictures.length).toBe(0);
        expect(status).toBe(200);
      });
      it('return profiles pictures with relevant attributes', async () => {
        const {
          body: {
            data: {
              profilePicture: {
                id: profilePictureId,
                current,
              },
            },
          },
        } = await postProfilePicture(app, token);
        const {
          body: {
            data: {
              profilePictures: [
                returnProfilePicture,
              ],
            },
          },
        } = await getProfilePictures(app, token);
        expect(returnProfilePicture.createdAt).toBeUndefined();
        expect(returnProfilePicture.cropedImageId).toBeUndefined();
        expect(returnProfilePicture.current).toEqual(current);
        expect(returnProfilePicture.id).toEqual(profilePictureId);
        expect(returnProfilePicture.originalImageId).toBeUndefined();
        expect(returnProfilePicture.pendingImageId).toBeUndefined();
        expect(returnProfilePicture.updatedAt).toBeUndefined();
        expect(returnProfilePicture.userId).toBeUndefined();
        expect(returnProfilePicture.cropedImage.signedUrl).toBeTruthy();
        expect(returnProfilePicture.cropedImage.createdAt).toBeUndefined();
        expect(returnProfilePicture.cropedImage.updatedAt).toBeUndefined();
        expect(returnProfilePicture.originalImage.signedUrl).toBeTruthy();
        expect(returnProfilePicture.originalImage.createdAt).toBeUndefined();
        expect(returnProfilePicture.originalImage.updatedAt).toBeUndefined();
        expect(returnProfilePicture.pendingImage.signedUrl).toBeTruthy();
        expect(returnProfilePicture.pendingImage.createdAt).toBeUndefined();
        expect(returnProfilePicture.pendingImage.updatedAt).toBeUndefined();
      });
      it('should return a pack of 20 profile pictures', async () => {
        const NUMBER = 5;
        const numOfProfilePictures = new Array(NUMBER).fill(0);
        await Promise.all(
          numOfProfilePictures.map(async () => {
            await postProfilePicture(app, token);
          }),
        );
        const {
          body: {
            data: {
              profilePictures: firstPack,
            },
          },
        } = await getProfilePictures(app, token);
        expect(firstPack.length).toEqual(NUMBER);
      });
    });
  });
});
