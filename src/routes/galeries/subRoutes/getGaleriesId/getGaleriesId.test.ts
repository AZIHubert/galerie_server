import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  GalerieUser,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import { signAuthToken } from '@src/helpers/issueJWT';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createGalerie,
  createGalerieUser,
  createUser,
  getGaleriesId,
  testGalerie,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
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
        let galerie: any;

        beforeEach(async (done) => {
          try {
            const returnedGalerie = await createGalerie({
              description: 'galerie\'s description',
              userId: user.id,
            });
            galerie = returnedGalerie;
          } catch (err) {
            done(err);
          }
          done();
        });

        it('return galerie if user is the creator', async () => {
          const {
            body: {
              action,
              data: {
                galerie: returnedGalerie,
              },
            },
            status,
          } = await getGaleriesId(app, token, galerie.id);
          expect(action).toBe('GET');
          expect(status).toBe(200);
          testGalerie(returnedGalerie, galerie);
        });
        it('return galerie if user is subscribe to it', async () => {
          const {
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { token: tokenTwo } = signAuthToken(userTwo);
          await createGalerieUser({
            galerieId: galerie.id,
            userId: userTwo.id,
          });
          const {
            status,
          } = await getGaleriesId(app, tokenTwo, galerie.id);
          expect(status).toBe(200);
        });
        it('return galerie if currentUser is not subscribe to it but currentUser.role === \'admin\' | \'superAdmin\'', async () => {
          const { user: admin } = await createUser({
            email: 'admin@email.com',
            role: 'admin',
            userName: 'admin',
          });
          const { token: tokenTwo } = signAuthToken(admin);
          const {
            status,
          } = await getGaleriesId(app, tokenTwo, galerie.id);
          expect(status).toBe(200);
        });
        it('set GalerieUser.hasNewFrames to false', async () => {
          const {
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          await createGalerieUser({
            galerieId,
            hasNewFrames: true,
            userId: user.id,
          });
          await getGaleriesId(app, token, galerieId);
          const galerieUser = await GalerieUser.findOne({
            where: {
              galerieId,
              userId: user.id,
            },
          }) as GalerieUser;
          expect(galerieUser.hasNewFrames).toBeFalsy();
        });
      });
      describe('it should return status 400 if', () => {
        it('request.params.galerieId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await getGaleriesId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('galerie'));
          expect(status).toBe(400);
        });
      });
      describe('it should return status 404 if', () => {
        it('galerie id doesn\'t exist', async () => {
          const {
            body,
            status,
          } = await getGaleriesId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
          expect(status).toBe(404);
        });
        it('galerie exist but currentUser is not subscribe to it and currentUser.role === \'user\'', async () => {
          const {
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          const {
            body,
            status,
          } = await getGaleriesId(app, token, galerieId);
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
