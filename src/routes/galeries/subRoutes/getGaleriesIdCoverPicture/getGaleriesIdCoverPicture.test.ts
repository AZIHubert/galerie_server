import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import { signAuthToken } from '@src/helpers/issueJWT';
import initSequelize from '@src/helpers/initSequelize.js';
import signedUrl from '@src/helpers/signedUrl';
import {
  createFrame,
  createGalerie,
  // createGalerieUser,
  createUser,
  getGaleriesIdCoverPicture,
  testGaleriePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('@src/helpers/signedUrl', () => jest.fn());

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/coverPicture', () => {
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

        describe('should return status 200 and', () => {
          let galerieId: string;

          beforeEach(async (done) => {
            try {
              const galerie = await createGalerie({
                userId: user.id,
              });
              galerieId = galerie.id;
            } catch (err) {
              done(err);
            }
            done();
          });

          it('return coverPicture === null', async () => {
            const {
              body: {
                action,
                data: {
                  coverPicture,
                  galerieId: returnedGalerieId,
                },
              },
              status,
            } = await getGaleriesIdCoverPicture(app, token, galerieId);
            expect(action).toBe('GET');
            expect(coverPicture).toBeNull();
            expect(returnedGalerieId).toBe(galerieId);
            expect(status).toBe(200);
          });
          it('return coverPicture', async () => {
            await createFrame({
              current: true,
              galerieId,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  coverPicture,
                },
              },
            } = await getGaleriesIdCoverPicture(app, token, galerieId);
            testGaleriePicture(coverPicture);
          });
          it('return coverPicture === null if signedUrl.OK === false', async () => {
            (signedUrl as jest.Mock).mockImplementation(() => ({
              OK: false,
            }));
            await createFrame({
              current: true,
              galerieId,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  coverPicture,
                },
              },
            } = await getGaleriesIdCoverPicture(app, token, galerieId);
            const galeriePictures = await GaleriePicture.findAll();
            const images = await Image.findAll();
            expect(coverPicture).toBeNull();
            expect(galeriePictures.length).toBe(0);
            expect(images.length).toBe(0);
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.galerieId is not a UUIDv4', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdCoverPicture(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('galerie'));
            expect(status).toBe(400);
          });
        });
        describe('should return 404 if', () => {
          it('galerie not found', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdCoverPicture(app, token, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
          it('galerie exist but currentUser is not subscribe to it', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { id: galerieId } = await createGalerie({
              userId: userTwo.id,
            });
            const {
              body,
              status,
            } = await getGaleriesIdCoverPicture(app, token, galerieId);
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
