import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Galerie,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  createGalerie,
  createGalerieUser,
  createUser,
  getGaleries,
  testGalerie,
} from '@src/helpers/test';

import initApp from '@src/server';

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
      it('return no galerie', async () => {
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
        expect(galeries.length).toBe(0);
        expect(status).toBe(200);
      });
      it('retun galeries if currentUser.role === \'admin\'', async () => {
        await createGalerie({
          userId: user.id,
        });
        const {
          body: {
            data: {
              galeries,
            },
          },
        } = await getGaleries(app, token);
        expect(galeries.length).toBe(1);
        testGalerie(galeries[0]);
      });
      it('do not return not subscribe galerie', async () => {
        const { user: userTwo } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
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
        expect(galeries.length).toBe(0);
      });
      it('return subscribed galerie if currentUser.role === \'admin\' | \'superAdmin\' && request.query.all !== \'true\'', async () => {
        const { user: admin } = await createUser({
          email: 'admin@email.com',
          role: 'admin',
          userName: 'admin',
        });
        const { id: galerieId } = await createGalerie({
          userId: user.id,
        });
        const { token: tokenTwo } = signAuthToken(admin);
        await createGalerie({
          name: 'galerie2',
          userId: user.id,
        });
        await createGalerieUser({
          galerieId,
          userId: admin.id,
        });
        const {
          body: {
            data: {
              galeries,
            },
          },
        } = await getGaleries(app, tokenTwo);
        expect(galeries.length).toBe(1);
        expect(galeries[0].id).toBe(galerieId);
      });
      it('return subscribed and not subscribe galerie if currentUser.role === \'admin\' | \'superAdmin\' && request.query.all !== \'true\'', async () => {
        const { user: admin } = await createUser({
          email: 'admin@email.com',
          role: 'admin',
          userName: 'admin',
        });
        const { token: tokenTwo } = signAuthToken(admin);
        const { id: galerieId } = await createGalerie({
          userId: user.id,
        });
        const galerieTwo = await createGalerie({
          name: 'galerie2',
          userId: user.id,
        });
        await createGalerieUser({
          galerieId,
          userId: admin.id,
        });
        const {
          body: {
            data: {
              galeries,
            },
          },
        } = await getGaleries(app, tokenTwo, { all: 'true' });
        const nonSubscribeGalerie = galeries.find((galerie: any) => galerie.id === galerieTwo.id);
        expect(galeries.length).toBe(2);
        expect(nonSubscribeGalerie.role).toBeNull();
      });
      it('return a pack of 20 galeries', async () => {
        const NUM = 21;
        const numOfGaleries = new Array(NUM).fill(0);
        await Promise.all(
          numOfGaleries.map(async (_, index) => {
            await createGalerie({
              name: `galerie${index + 2}`,
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
        } = await getGaleries(app, token, {
          previousGalerie: firstPack[firstPack.length - 1].hiddenName,
        });
        expect(firstPack.length).toBe(20);
        expect(secondPack.length).toBe(1);
      });
      it('order galeries by name (ASC)', async () => {
        const galerieOne = await createGalerie({
          name: 'a',
          userId: user.id,
        });
        const galerieTwo = await createGalerie({
          name: 'b',
          userId: user.id,
        });
        const galerieThree = await createGalerie({
          name: 'c',
          userId: user.id,
        });
        const galerieFour = await createGalerie({
          name: 'd',
          userId: user.id,
        });
        const galerieFive = await createGalerie({
          name: 'e',
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
        expect(galeries[0].id).toBe(galerieOne.id);
        expect(galeries[1].id).toBe(galerieTwo.id);
        expect(galeries[2].id).toBe(galerieThree.id);
        expect(galeries[3].id).toBe(galerieFour.id);
        expect(galeries[4].id).toBe(galerieFive.id);
      });
      it('keep if multiple galeries have the same name', async () => {
        const galerieOne = await createGalerie({
          name: 'a',
          userId: user.id,
        });
        const galerieTwo = await createGalerie({
          name: 'b',
          userId: user.id,
        });
        const galerieThree = await createGalerie({
          name: 'b',
          userId: user.id,
        });
        const galerieFour = await createGalerie({
          name: 'b',
          userId: user.id,
        });
        const galerieFive = await createGalerie({
          name: 'c',
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
        expect(galeries[0].id).toBe(galerieOne.id);
        expect(galeries[1].id).toBe(galerieTwo.id);
        expect(galeries[2].id).toBe(galerieThree.id);
        expect(galeries[3].id).toBe(galerieFour.id);
        expect(galeries[4].id).toBe(galerieFive.id);
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
          name: 'galerie2',
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
    });
  });
});
