import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  getGaleries,
  login,
  postGalerie,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('galeries', () => {
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
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('GET', () => {
    it('TODO: return subscribed galeries', async () => {});
    it('TODO: return current cover picture', async () => {});

    describe('it should return status 200 and', () => {
      it('retun galeries', async () => {
        const {
          body: {
            data: {
              galerie,
            },
          },
        } = await postGalerie(app, token, {
          name: 'galerie\'s name',
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
        expect(galeries[0].archived).toBe(galerie.archived);
        expect(galeries[0].createdAt).toBe(galerie.createdAt);
        expect(galeries[0].currentCoverPicture).toBe(galerie.currentCoverPicture);
        expect(galeries[0].defaultProfilePicture).toBe(galerie.defaultProfilePicture);
        expect(galeries[0].id).toBe(galerie.id);
        expect(galeries[0].name).toBe(galerie.name);
        expect(galeries[0].role).toBe(galerie.role);
        expect(galeries[0].users.length).toBe(0);
        expect(status).toBe(200);
      });
      it('return a pack of 20 galeries', async () => {
        const numOfGaleries = new Array(25).fill(0);
        await Promise.all(
          numOfGaleries.map(async () => {
            await postGalerie(app, token, {
              name: 'galerie\'s name',
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
        } = await getGaleries(app, token, 2);
        expect(firstPack.length).toBe(20);
        expect(secondPack.length).toBe(5);
      });
      it('don\'t return galerie if user is not subscribe to it', async () => {
        const userTwo = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        const {
          body: {
            token: tokenTwo,
          },
        } = await login(app, userTwo.email, userPassword);
        await postGalerie(app, tokenTwo, {
          name: 'galerie\'s name',
        });
        await postGalerie(app, token, {
          name: 'galerie\'s name',
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
