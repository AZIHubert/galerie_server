import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import signedUrl from '@src/helpers/signedUrl';
import {
  cleanGoogleBuckets,
  createUser,
  getProfilePictures,
  postProfilePictures,
  postUsersLogin,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

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
    jest.clearAllMocks();
    (signedUrl as jest.Mock).mockImplementation(() => ({
      OK: true,
      signedUrl: 'signedUrl',
    }));
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
    jest.clearAllMocks();
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
      it('return no profile picture', async () => {
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
      it('return one profile picture', async () => {
        await postProfilePictures(app, token);
        const {
          body: {
            data: {
              profilePictures: [
                returnProfilePicture,
              ],
            },
          },
        } = await getProfilePictures(app, token);
        expect(returnProfilePicture.createdAt).not.toBeUndefined();
        expect(returnProfilePicture.cropedImageId).toBeUndefined();
        expect(returnProfilePicture.cropedImage.bucketName).toBeUndefined();
        expect(returnProfilePicture.cropedImage.createdAt).toBeUndefined();
        expect(returnProfilePicture.cropedImage.fileName).toBeUndefined();
        expect(returnProfilePicture.cropedImage.format).not.toBeUndefined();
        expect(returnProfilePicture.cropedImage.height).not.toBeUndefined();
        expect(returnProfilePicture.cropedImage.id).toBeUndefined();
        expect(returnProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
        expect(returnProfilePicture.cropedImage.size).not.toBeUndefined();
        expect(returnProfilePicture.cropedImage.updatedAt).toBeUndefined();
        expect(returnProfilePicture.cropedImage.width).not.toBeUndefined();
        expect(returnProfilePicture.current).not.toBeUndefined();
        expect(returnProfilePicture.id).not.toBeUndefined();
        expect(returnProfilePicture.originalImageId).toBeUndefined();
        expect(returnProfilePicture.originalImage.bucketName).toBeUndefined();
        expect(returnProfilePicture.originalImage.createdAt).toBeUndefined();
        expect(returnProfilePicture.originalImage.fileName).toBeUndefined();
        expect(returnProfilePicture.originalImage.format).not.toBeUndefined();
        expect(returnProfilePicture.originalImage.height).not.toBeUndefined();
        expect(returnProfilePicture.originalImage.id).toBeUndefined();
        expect(returnProfilePicture.originalImage.signedUrl).not.toBeUndefined();
        expect(returnProfilePicture.originalImage.size).not.toBeUndefined();
        expect(returnProfilePicture.originalImage.updatedAt).toBeUndefined();
        expect(returnProfilePicture.originalImage.width).not.toBeUndefined();
        expect(returnProfilePicture.pendingImageId).toBeUndefined();
        expect(returnProfilePicture.pendingImage.bucketName).toBeUndefined();
        expect(returnProfilePicture.pendingImage.createdAt).toBeUndefined();
        expect(returnProfilePicture.pendingImage.fileName).toBeUndefined();
        expect(returnProfilePicture.pendingImage.format).not.toBeUndefined();
        expect(returnProfilePicture.pendingImage.height).not.toBeUndefined();
        expect(returnProfilePicture.pendingImage.id).toBeUndefined();
        expect(returnProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
        expect(returnProfilePicture.pendingImage.size).not.toBeUndefined();
        expect(returnProfilePicture.pendingImage.updatedAt).toBeUndefined();
        expect(returnProfilePicture.pendingImage.width).not.toBeUndefined();
        expect(returnProfilePicture.updatedAt).toBeUndefined();
        expect(returnProfilePicture.userId).toBeUndefined();
      });
      it('should return a pack of 20 profile pictures', async () => {
        const NUM = 21;
        const numOfProfilePictures = new Array(NUM).fill(0);
        await Promise.all(
          numOfProfilePictures.map(async () => {
            const {
              id: imageId,
            } = await Image.create({
              bucketName: 'bucketName',
              fileName: 'fileName',
              format: 'format',
              height: 10,
              size: 10,
              width: 10,
            });
            await ProfilePicture.create({
              cropedImageId: imageId,
              current: false,
              originalImageId: imageId,
              pendingImageId: imageId,
              userId: user.id,
            });
          }),
        );
        const {
          body: {
            data: {
              profilePictures: firstPack,
            },
          },
        } = await getProfilePictures(app, token);
        const {
          body: {
            data: {
              profilePictures: secondPack,
            },
          },
        } = await getProfilePictures(app, token, { page: 2 });
        expect(firstPack.length).toEqual(20);
        expect(secondPack.length).toEqual(1);
      });
    });
  });
});
