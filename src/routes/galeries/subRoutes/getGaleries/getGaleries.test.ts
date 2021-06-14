import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Galerie,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  createFrame,
  createGalerie,
  createGalerieUser,
  createUser,
  getGaleries,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('GET', () => {
    beforeAll(() => {
      sequelize = initSequelize();
      app = initApp();
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

    describe('it should return status 200 and', () => {
      it('retun galeries', async () => {
        await createGalerie({
          userId: user.id,
        });
        const {
          body: {
            action,
            data: {
              galeries,
            },
          },
          status,
        } = await getGaleries(app, token);
        expect(action).toBe('GET');
        expect(galeries.length).toBe(1);
        expect(galeries[0].archived).not.toBeUndefined();
        expect(galeries[0].createdAt).not.toBeUndefined();
        expect(galeries[0].currentCoverPicture).not.toBeUndefined();
        expect(galeries[0].defaultCoverPicture).not.toBeUndefined();
        expect(galeries[0].description).not.toBeUndefined();
        expect(galeries[0].frames).not.toBeUndefined();
        expect(galeries[0].hasNewFrames).not.toBeUndefined();
        expect(galeries[0].id).not.toBeUndefined();
        expect(galeries[0].name).not.toBeUndefined();
        expect(galeries[0].role).not.toBeUndefined();
        expect(galeries[0].updatedAt).toBeUndefined();
        expect(galeries[0].users).not.toBeUndefined();
        expect(status).toBe(200);
      });
      it('return a pack of 20 galeries', async () => {
        const NUM = 21;
        const numOfGaleries = new Array(NUM).fill(0);
        await Promise.all(
          numOfGaleries.map(async () => {
            await createGalerie({
              userId: user.id,
            });
          }),
        );
        const {
          body: {
            data: {
              galeries: firstPack,
            },
          },
        } = await getGaleries(app, token);
        const {
          body: {
            data: {
              galeries: secondPack,
            },
          },
        } = await getGaleries(app, token, { page: 2 });
        expect(firstPack.length).toBe(20);
        expect(secondPack.length).toBe(1);
      });
      it('order galeries by created at', async () => {
        const galerieOne = await createGalerie({
          userId: user.id,
        });
        const galerieTwo = await createGalerie({
          userId: user.id,
        });
        const galerieThree = await createGalerie({
          userId: user.id,
        });
        const galerieFour = await createGalerie({
          userId: user.id,
        });
        const galerieFive = await createGalerie({
          userId: user.id,
        });
        const {
          body: {
            data: {
              galeries,
            },
          },
        } = await getGaleries(app, token);
        expect(galeries.length).toBe(5);
        expect(galeries[0].id).toBe(galerieFive.id);
        expect(galeries[1].id).toBe(galerieFour.id);
        expect(galeries[2].id).toBe(galerieThree.id);
        expect(galeries[3].id).toBe(galerieTwo.id);
        expect(galeries[4].id).toBe(galerieOne.id);
      });
      it('return subscribed galeries', async () => {
        const {
          user: userTwo,
        } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        const { token: tokenTwo } = signAuthToken(userTwo);
        const { id: galerieId } = await createGalerie({
          userId: user.id,
        });
        await createGalerieUser({
          galerieId,
          userId: userTwo.id,
        });
        const {
          body: {
            data: {
              galeries,
            },
          },
        } = await getGaleries(app, tokenTwo);
        const subscribedGalerie = galeries
          .find((galerie: Galerie) => galerie.id === galerieId);
        expect(galeries.length).toBe(1);
        expect(subscribedGalerie).not.toBeNull();
      });
      it('don\'t return galerie if user is not subscribe to it', async () => {
        const {
          user: userTwo,
        } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        await createGalerie({
          userId: user.id,
        });
        await createGalerie({
          userId: userTwo.id,
        });
        const {
          body: {
            data: {
              galeries,
            },
          },
        } = await getGaleries(app, token);
        expect(galeries.length).toBe(1);
      });
      it('include current cover picture', async () => {
        const { id: galerieId } = await createGalerie({
          userId: user.id,
        });
        await createFrame({
          current: true,
          galerieId,
          userId: user.id,
        });
        const {
          body: {
            data: {
              galeries: [{
                currentCoverPicture,
              }],
            },
          },
        } = await getGaleries(app, token);
        expect(currentCoverPicture.current).not.toBeUndefined();
        expect(currentCoverPicture.createdAt).toBeUndefined();
        expect(currentCoverPicture.cropedImageId).toBeUndefined();
        expect(currentCoverPicture.cropedImage.bucketName).toBeUndefined();
        expect(currentCoverPicture.cropedImage.createdAt).toBeUndefined();
        expect(currentCoverPicture.cropedImage.fileName).toBeUndefined();
        expect(currentCoverPicture.cropedImage.format).not.toBeUndefined();
        expect(currentCoverPicture.cropedImage.height).not.toBeUndefined();
        expect(currentCoverPicture.cropedImage.id).toBeUndefined();
        expect(currentCoverPicture.cropedImage.signedUrl).not.toBeUndefined();
        expect(currentCoverPicture.cropedImage.size).not.toBeUndefined();
        expect(currentCoverPicture.cropedImage.updatedAt).toBeUndefined();
        expect(currentCoverPicture.cropedImage.width).not.toBeUndefined();
        expect(currentCoverPicture.frameId).toBeUndefined();
        expect(currentCoverPicture.id).not.toBeUndefined();
        expect(currentCoverPicture.index).not.toBeUndefined();
        expect(currentCoverPicture.originalImageId).toBeUndefined();
        expect(currentCoverPicture.originalImage.bucketName).toBeUndefined();
        expect(currentCoverPicture.originalImage.createdAt).toBeUndefined();
        expect(currentCoverPicture.originalImage.fileName).toBeUndefined();
        expect(currentCoverPicture.originalImage.format).not.toBeUndefined();
        expect(currentCoverPicture.originalImage.height).not.toBeUndefined();
        expect(currentCoverPicture.originalImage.id).toBeUndefined();
        expect(currentCoverPicture.originalImage.signedUrl).not.toBeUndefined();
        expect(currentCoverPicture.originalImage.size).not.toBeUndefined();
        expect(currentCoverPicture.originalImage.updatedAt).toBeUndefined();
        expect(currentCoverPicture.originalImage.width).not.toBeUndefined();
        expect(currentCoverPicture.pendingImageId).toBeUndefined();
        expect(currentCoverPicture.pendingImage.bucketName).toBeUndefined();
        expect(currentCoverPicture.pendingImage.createdAt).toBeUndefined();
        expect(currentCoverPicture.pendingImage.fileName).toBeUndefined();
        expect(currentCoverPicture.pendingImage.format).not.toBeUndefined();
        expect(currentCoverPicture.pendingImage.height).not.toBeUndefined();
        expect(currentCoverPicture.pendingImage.id).toBeUndefined();
        expect(currentCoverPicture.pendingImage.signedUrl).not.toBeUndefined();
        expect(currentCoverPicture.pendingImage.size).not.toBeUndefined();
        expect(currentCoverPicture.pendingImage.updatedAt).toBeUndefined();
        expect(currentCoverPicture.pendingImage.width).not.toBeUndefined();
        expect(currentCoverPicture.updatedAt).toBeUndefined();
      });
    });
  });
});
