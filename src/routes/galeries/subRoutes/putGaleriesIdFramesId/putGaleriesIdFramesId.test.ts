import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  Frame,
  User,
} from '#src/db/models';

import {
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import signedUrl from '#src/helpers/signedUrl';
import {
  createUser,
  createFrame,
  createGalerie,
  putGaleriesIdFramesId,
  createGalerieUser,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('#src/helpers/signedUrl', () => jest.fn());

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/frames', () => {
      describe('/:frameId', () => {
        describe('PUT', () => {
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
            let frameId: string;
            let galerieId: string;

            beforeEach(async (done) => {
              try {
                const galerie = await createGalerie({
                  userId: user.id,
                });
                const frame = await createFrame({
                  galerieId: galerie.id,
                  userId: user.id,
                });
                frameId = frame.id;
                galerieId = galerie.id;
              } catch (err) {
                done(err);
              }
              done();
            });

            it('update frame.description', async () => {
              const description = 'new frame\'s description';
              const {
                body: {
                  action,
                  data: {
                    description: returnedDescription,
                    frameId: returnedFrameId,
                    galerieId: returnedGalerieId,
                  },
                },
                status,
              } = await putGaleriesIdFramesId(app, token, galerieId, frameId, {
                body: {
                  description,
                },
              });
              const frame = await Frame.findByPk(returnedFrameId) as Frame;
              expect(action).toBe('PUT');
              expect(frame.description).toBe(description);
              expect(returnedDescription).toBe(description);
              expect(returnedFrameId).toBe(frameId);
              expect(returnedGalerieId).toBe(galerieId);
              expect(status).toBe(200);
            });
            it('trim request.body.description', async () => {
              const description = 'new frame\'s description';
              const {
                body: {
                  data: {
                    description: returnedDescription,
                    frameId: returnedFrameId,
                  },
                },
              } = await putGaleriesIdFramesId(app, token, galerieId, frameId, {
                body: {
                  description: ` ${description} `,
                },
              });
              const frame = await Frame.findByPk(returnedFrameId) as Frame;
              expect(frame.description).toBe(description);
              expect(returnedDescription).toBe(description);
            });
          });
          describe('should return status 400 if', () => {
            it('request.body.galerieId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdFramesId(app, token, '100', uuidv4());
              expect(body.errors).toBe(INVALID_UUID('galerie'));
              expect(status).toBe(400);
            });
            it('request.body.frameId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdFramesId(app, token, uuidv4(), '100');
              expect(body.errors).toBe(INVALID_UUID('frame'));
              expect(status).toBe(400);
            });
            it('frame was not post by this user', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const { id: galerieId } = await createGalerie({
                userId: user.id,
              });
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const { id: frameId } = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await putGaleriesIdFramesId(app, token, galerieId, frameId, {
                body: {
                  description: 'new galerie\'s description',
                },
              });
              expect(body.errors).toBe('you can\'t modify this frame');
              expect(status).toBe(400);
            });
            it('request.body.description === frame.description', async () => {
              const description = 'frame\'s description';
              const { id: galerieId } = await createGalerie({
                userId: user.id,
              });
              const { id: frameId } = await createFrame({
                description,
                galerieId,
                userId: user.id,
              });
              const {
                body,
                status,
              } = await putGaleriesIdFramesId(app, token, galerieId, frameId, {
                body: {
                  description,
                },
              });
              expect(body.errors).toBe('no change submited');
              expect(status).toBe(400);
            });
            describe('description', () => {
              let frameId: string;
              let galerieId: string;

              beforeEach(async (done) => {
                try {
                  const galerie = await createGalerie({
                    userId: user.id,
                  });
                  const frame = await createFrame({
                    galerieId: galerie.id,
                    userId: user.id,
                  });
                  frameId = frame.id;
                  galerieId = galerie.id;
                } catch (err) {
                  done(err);
                }
                done();
              });

              it('is not send', async () => {
                const {
                  body,
                  status,
                } = await putGaleriesIdFramesId(app, token, galerieId, frameId);
                expect(body.errors).toEqual({
                  description: FIELD_IS_REQUIRED,
                });
                expect(status).toBe(400);
              });
              it('is not a string', async () => {
                const {
                  body,
                  status,
                } = await putGaleriesIdFramesId(app, token, galerieId, frameId, {
                  body: {
                    description: 1234,
                  },
                });
                expect(body.errors).toEqual({
                  description: FIELD_SHOULD_BE_A_STRING,
                });
                expect(status).toBe(400);
              });
              it('has more than 200 characters', async () => {
                const {
                  body,
                  status,
                } = await putGaleriesIdFramesId(app, token, galerieId, frameId, {
                  body: {
                    description: 'a'.repeat(201),
                  },
                });
                expect(body.errors).toEqual({
                  description: FIELD_MAX_LENGTH(200),
                });
                expect(status).toBe(400);
              });
            });
          });
          describe('should return status 404 if', () => {
            it('galerie does not exist', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdFramesId(app, token, uuidv4(), uuidv4());
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
              } = await putGaleriesIdFramesId(app, token, galerieId, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('frame does not exist', async () => {
              const { id: galerieId } = await createGalerie({
                userId: user.id,
              });
              const {
                body,
                status,
              } = await putGaleriesIdFramesId(app, token, galerieId, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
              expect(status).toBe(404);
            });
            it('frame exist but was not post on this galerie', async () => {
              const galerieOne = await createGalerie({
                userId: user.id,
              });
              const galerieTwo = await createGalerie({
                name: 'galerie2',
                userId: user.id,
              });
              const { id: frameId } = await createFrame({
                galerieId: galerieOne.id,
                userId: user.id,
              });
              const {
                body,
                status,
              } = await putGaleriesIdFramesId(app, token, galerieTwo.id, frameId);
              expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
