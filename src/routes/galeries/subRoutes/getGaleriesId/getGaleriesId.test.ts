import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  GaleriePicture,
  GalerieUser,
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

jest.mock('@src/helpers/signedUrl', () => jest.fn());

describe('/galeries', () => {
  describe('/:galerieId', () => {
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
        it('include current profile picture', async () => {
          await createFrame({
            current: true,
            galerieId: galerie.id,
            userId: user.id,
          });
          const {
            body: {
              data: {
                galerie: {
                  currentCoverPicture,
                },
              },
            },
          } = await getGaleriesId(app, token, galerie.id);
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
        it('return galerie.currentCoverPicture === null and destroy the galeriePicture if signedUrl.Ok === false', async () => {
          (signedUrl as jest.Mock).mockImplementation(() => ({
            OK: false,
          }));
          const frame = await createFrame({
            current: true,
            galerieId: galerie.id,
            userId: user.id,
          });
          const {
            body: {
              data: {
                galerie: {
                  currentCoverPicture,
                },
              },
            },
          } = await getGaleriesId(app, token, galerie.id);
          const galeriePictures = await GaleriePicture.findAll({
            where: {
              id: frame.galeriePictures
                .map((galeriePicture) => galeriePicture.id),
            },
          });
          const image = await Image.findAll({
            where: {
              id: frame.galeriePictures
                .map((galeriePicture) => galeriePicture.originalImageId),
            },
          });
          expect(currentCoverPicture).toBeNull();
          expect(galeriePictures.length).toBe(0);
          expect(image.length).toBe(0);
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
        it('galerie exist but user is not subscribe to it', async () => {
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
