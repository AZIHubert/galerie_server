import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  ProfilePicture,
  Image,
  User,
} from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  createProfilePicture,
  createUser,
  getProfilePictures,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/profilePictures', () => {
  describe('GET', () => {
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
        const {
          user: createdUser,
        } = await createUser({});
        user = createdUser;
        const jwt = signAuthToken(user);
        token = jwt.token;
      } catch (err) {
        done(err);
      }
      done();
    });

    afterAll(async (done) => {
      jest.clearAllMocks();
      try {
        await sequelize.sync({ force: true });
        await sequelize.close();
      } catch (err) {
        done(err);
      }
      app.close();
      done();
    });

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
        await createProfilePicture({
          userId: user.id,
        });
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
            await createProfilePicture({
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
      it('order profile pictures by createdAt', async () => {
        const profilePictureOne = await createProfilePicture({
          userId: user.id,
        });
        const profilePictureTwo = await createProfilePicture({
          userId: user.id,
        });
        const profilePictureThree = await createProfilePicture({
          userId: user.id,
        });
        const profilePictureFour = await createProfilePicture({
          userId: user.id,
        });
        const profilePictureFive = await createProfilePicture({
          userId: user.id,
        });
        const {
          body: {
            data: {
              profilePictures,
            },
          },
        } = await getProfilePictures(app, token);
        expect(profilePictures.length).toBe(5);
        expect(profilePictures[0].id).toBe(profilePictureFive.id);
        expect(profilePictures[1].id).toBe(profilePictureFour.id);
        expect(profilePictures[2].id).toBe(profilePictureThree.id);
        expect(profilePictures[3].id).toBe(profilePictureTwo.id);
        expect(profilePictures[4].id).toBe(profilePictureOne.id);
      });
      it('do not return profile pictures from other users', async () => {
        const { user: userTwo } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        await createProfilePicture({
          userId: userTwo.id,
        });
        const {
          body: {
            data: {
              profilePictures,
            },
          },
        } = await getProfilePictures(app, token);
        expect(profilePictures.length).toBe(0);
      });
      it('return profilePicture === null if signedUrl.OK === false', async () => {
        (signedUrl as jest.Mock).mockImplementation(() => ({
          OK: false,
        }));
        const { id: profilePicureId } = await createProfilePicture({
          userId: user.id,
        });
        const {
          body: {
            data: {
              profilePictures,
            },
          },
        } = await getProfilePictures(app, token);
        const profilePicture = await ProfilePicture.findByPk(profilePicureId);
        const images = await Image.findAll();
        expect(profilePicture).toBeNull();
        expect(profilePictures[0]).toBeNull();
        expect(images.length).toBe(0);
      });
    });
  });
});
