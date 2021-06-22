import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Frame,
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
  createBlackList,
  createFrame,
  createGalerie,
  createGalerieUser,
  createLike,
  createUser,
  getGaleriesIdFramesId,
  testFrame,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('@src/helpers/signedUrl', () => jest.fn());

describe('/galeries', () => {
  describe('/:id', () => {
    describe('/frames', () => {
      describe('/:frameId', () => {
        describe('GET', () => {
          beforeAll(() => {
            sequelize = initSequelize();
            app = initApp();
          });

          beforeEach(async (done) => {
            mockDate.reset();
            jest.clearAllMocks();
            (signedUrl as jest.Mock).mockImplementation(() => ({
              OK: true,
              signedUrl: 'signedUrl',
            }));
            try {
              await sequelize.sync({ force: true });
              const {
                user: createdUser,
              } = await createUser({
                role: 'superAdmin',
              });
              user = createdUser;
              const jwt = signAuthToken(user);
              token = jwt.token;
              const galerie = await createGalerie({
                userId: user.id,
              });
              galerieId = galerie.id;
            } catch (err) {
              done(err);
            }
            done();
          });

          afterAll(async (done) => {
            mockDate.reset();
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
            it('return frame', async () => {
              const frame = await createFrame({
                galerieId,
                description: 'frame\'s description',
                userId: user.id,
              });
              const {
                body: {
                  action,
                  data: {
                    frame: returnedFrame,
                    galerieId: returnedGalerieId,
                  },
                },
                status,
              } = await getGaleriesIdFramesId(app, token, galerieId, frame.id);
              expect(action).toBe('GET');
              testFrame(returnedFrame, frame);
              expect(returnedGalerieId).toBe(galerieId);
              expect(status).toBe(200);
              testUser(returnedFrame.user);
            });
            it('return frame if currentUser is not subscribe to the galerie and currentUser.role === \'admin\' | \'superAdmin\'', async () => {
              const { user: admin } = await createUser({
                email: 'admin@email.com',
                role: 'admin',
                userName: 'admin',
              });
              const { token: tokenTwo } = signAuthToken(admin);
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              const {
                status,
              } = await getGaleriesIdFramesId(app, tokenTwo, galerieId, frameId);
              expect(status).toBe(200);
            });
            it('return liked === false if user don\'t have liked this frame', async () => {
              const frame = await createFrame({
                galerieId,
                userId: user.id,
              });
              const {
                body: {
                  data: {
                    frame: returnedFrame,
                  },
                },
              } = await getGaleriesIdFramesId(app, token, galerieId, frame.id);
              expect(returnedFrame.liked).toBe(false);
            });
            it('return liked === true if user have liked this frame', async () => {
              const frame = await createFrame({
                galerieId,
                userId: user.id,
              });
              await createLike({
                frameId: frame.id,
                userId: user.id,
              });
              const {
                body: {
                  data: {
                    frame: returnedFrame,
                  },
                },
              } = await getGaleriesIdFramesId(app, token, galerieId, frame.id);
              expect(returnedFrame.liked).toBe(true);
            });
            it('return liked === false if another user have liked this frame', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const frame = await createFrame({
                galerieId,
                userId: user.id,
              });
              await createLike({
                frameId: frame.id,
                userId: userTwo.id,
              });
              const {
                body: {
                  data: {
                    frame: returnedFrame,
                  },
                },
              } = await getGaleriesIdFramesId(app, token, galerieId, frame.id);
              expect(returnedFrame.liked).toBe(false);
            });
            it('return frame.user.isBlackListed === true if he\'s black listed', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const { id: frameId } = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              await createBlackList({
                createdById: user.id,
                userId: userTwo.id,
              });
              const {
                body: {
                  data: {
                    frame: {
                      user: {
                        isBlackListed,
                      },
                    },
                  },
                },
              } = await getGaleriesIdFramesId(app, token, galerieId, frameId);
              expect(isBlackListed).toBe(true);
            });
            it('return frame.user.isBlackListed === false if his blackList is expired', async () => {
              const timeStamp = 1434319925275;
              const time = 1000 * 60 * 10;
              mockDate.set(timeStamp);
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const { id: frameId } = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              await createBlackList({
                createdById: user.id,
                time,
                userId: userTwo.id,
              });
              mockDate.set(timeStamp + time + 1);
              const {
                body: {
                  data: {
                    frame: {
                      user: {
                        isBlackListed,
                      },
                    },
                  },
                },
              } = await getGaleriesIdFramesId(app, token, galerieId, frameId);
              await userTwo.reload();
              expect(isBlackListed).toBe(false);
              expect(userTwo.isBlackListed).toBe(false);
            });
          });
          describe('should return status 400 if', () => {
            it('request.params.galerieId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await getGaleriesIdFramesId(app, token, '100', uuidv4());
              expect(body.errors).toBe(INVALID_UUID('galerie'));
              expect(status).toBe(400);
            });
            it('request.params.frameId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await getGaleriesIdFramesId(app, token, uuidv4(), '100');
              expect(body.errors).toBe(INVALID_UUID('frame'));
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('galerie not found', async () => {
              const {
                body,
                status,
              } = await getGaleriesIdFramesId(app, token, uuidv4(), uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('frame not found', async () => {
              const {
                body,
                status,
              } = await getGaleriesIdFramesId(app, token, galerieId, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
              expect(status).toBe(404);
            });
            it('galerie exist but user is not subscribe to it and currentUser.role === \'user\'', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              const {
                body,
                status,
              } = await getGaleriesIdFramesId(app, tokenTwo, uuidv4(), uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('frame with :frameId does not belong to galerie with :galerieId', async () => {
              const galerie = await createGalerie({
                userId: user.id,
              });
              const { id: frameId } = await createFrame({
                galerieId: galerie.id,
                userId: user.id,
              });
              const {
                body,
                status,
              } = await getGaleriesIdFramesId(app, token, galerieId, frameId);
              expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
              expect(status).toBe(404);
            });
            it('frame don\'t have galeriePicture', async () => {
              const { id: frameId } = await Frame.create({
                galerieId,
                userId: user.id,
              });
              const {
                body,
                status,
              } = await getGaleriesIdFramesId(app, token, galerieId, frameId);
              const frame = await Frame.findByPk(frameId);
              expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
              expect(frame).toBeNull();
              expect(status).toBe(404);
            });
            it('signedUrl.OK === false', async () => {
              (signedUrl as jest.Mock).mockImplementation(() => ({
                OK: false,
              }));
              const createdFrame = await createFrame({
                galerieId,
                userId: user.id,
              });
              const {
                body,
                status,
              } = await getGaleriesIdFramesId(app, token, galerieId, createdFrame.id);
              const frame = await Frame.findByPk(createdFrame.id);
              const galeriePictures = await GaleriePicture.findAll({
                where: {
                  id: createdFrame.galeriePictures
                    .map((galeriePicture) => galeriePicture.id),
                },
              });
              const images = await Image.findAll({
                where: {
                  id: createdFrame.galeriePictures
                    .map((galeriePicture) => galeriePicture.originalImageId),
                },
              });
              expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
              expect(frame).toBeNull();
              expect(galeriePictures.length).toBe(0);
              expect(images.length).toBe(0);
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
