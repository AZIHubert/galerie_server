import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  getGaleriesId,
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
      await cleanGoogleBuckets();
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
      await cleanGoogleBuckets();
      await sequelize.sync({ force: true });
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe(':id', () => {
    describe('GET', () => {
      describe('it should return status 200 and', () => {
        it('return galerie if user is the creator', async () => {
          const {
            body: {
              data: {
                galerie: returnedGalerie,
              },
            },
          } = await postGalerie(app, token, {
            name: 'galerie\'s name',
          });
          const {
            body: {
              action,
              data: {
                galerie,
              },
            },
            status,
          } = await getGaleriesId(app, token, returnedGalerie.id);
          expect(action).toBe('GET');
          expect(galerie.archived).toBe(returnedGalerie.archived);
          expect(galerie.createdAt).toBe(returnedGalerie.createdAt);
          expect(galerie.currentCoverPicture).toBe(returnedGalerie.currentCoverPicture);
          expect(galerie.defaultCoverPicture).toBe(returnedGalerie.defaultCoverPicture);
          expect(galerie.id).toBe(returnedGalerie.id);
          expect(galerie.name).toBe(returnedGalerie.name);
          expect(galerie.role).toBe(returnedGalerie.role);
          expect(galerie.updatedAt).toBeUndefined();
          expect(galerie.users.length).toBe(0);
          expect(status).toBe(200);
        });
        it('TODO: return galerie if user is subscribe to it', async () => {});
        it('TODO: include current profile picture', async () => {});
      });
      describe('it should return error 404 if', () => {
        it('galerie id doesn\'t exist', async () => {
          const {
            body,
            status,
          } = await getGaleriesId(app, token, '100');
          expect(body.errors).toBe('galerie not found');
          expect(status).toBe(404);
        });
        it('galerie exist but user is not subscribe to it or the creator', async () => {
          const userTwo = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              token: tokenTwo,
            },
          } = await login(app, userTwo.email, userPassword);
          const {
            body: {
              data: {
                galerie: {
                  id,
                },
              },
            },
          } = await postGalerie(app, tokenTwo, {
            name: 'galerie\'s name',
          });
          const {
            body,
            status,
          } = await getGaleriesId(app, token, id);
          expect(body.errors).toBe('galerie not found');
          expect(status).toBe(404);
        });
      });
    });
  });
});
