import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Galerie,
  GaleriePicture,
  Image,
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
  testGalerie,
  testGaleriePicture,
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
        expect(status).toBe(200);
        testGalerie(galeries[0]);
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
        const { user: userTwo } = await createUser({
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
        testGaleriePicture(currentCoverPicture);
      });
      it('return galerie.currentCoverPicture === null and destroy the galeriePicture if signedUrl.Ok === false', async () => {
        (signedUrl as jest.Mock).mockImplementation(() => ({
          OK: false,
        }));
        const { id: galerieId } = await createGalerie({
          userId: user.id,
        });
        const createdFrame = await createFrame({
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
        const galeriePictures = await GaleriePicture.findAll({
          where: {
            id: createdFrame.galeriePictures
              .map((galeriePicure: GaleriePicture) => galeriePicure.id),
          },
        });
        const images = await Image.findAll({
          where: {
            id: createdFrame.galeriePictures
              .map((galeriePicure: GaleriePicture) => galeriePicure.originalImageId),
          },
        });
        expect(currentCoverPicture).toBeNull();
        expect(galeriePictures.length).toBe(0);
        expect(images.length).toBe(0);
      });
    });
  });
});
