import fs from 'fs';
import { Server } from 'http';
import { verify } from 'jsonwebtoken';
import path from 'path';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Frame,
  Like,
  NotificationFrameLiked,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  createFrame,
  createGalerie,
  createGalerieUser,
  createLike,
  createNotificationFrameLiked,
  createUser,
  postGaleriesIdFramesIdLikes,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galerie', () => {
  describe('/:galerieId', () => {
    describe('/frames', () => {
      describe('/:frameId', () => {
        describe('/likes', () => {
          describe('POST', () => {
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
              let frame: any;
              let userTwo: User;

              beforeEach(async (done) => {
                try {
                  const { user: newUser } = await createUser({
                    email: 'user2@email.com',
                    userName: 'user2',
                  });
                  userTwo = newUser;
                  await createGalerieUser({
                    galerieId,
                    userId: userTwo.id,
                  });
                  const createdFrame = await createFrame({
                    galerieId,
                    userId: userTwo.id,
                  });
                  frame = createdFrame;
                } catch (err) {
                  done(err);
                }
                done();
              });

              it('post Like and return notificationToken if this frame wasn\'t like by current user', async () => {
                const {
                  body: {
                    action,
                    data: {
                      frameId: returnedFrameId,
                      galerieId: returnedGalerieId,
                      notificationToken,
                      numOfLikes,
                    },
                  },
                  status,
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                const like = await Like.findOne({
                  where: {
                    frameId: frame.id,
                    userId: user.id,
                  },
                }) as Like;
                const PUB_KEY = fs.readFileSync(path.join('./id_rsa_pub.notificationToken.pem'));
                const splitToken = (<string>notificationToken).split(' ');
                const verifyToken = verify(splitToken[1], PUB_KEY) as {
                  data: {
                    likeId: string;
                  }
                  type: string;
                };
                expect(action).toBe('POST');
                expect(like).not.toBeNull();
                expect(notificationToken).not.toBeUndefined();
                expect(numOfLikes).toBe(frame.numOfLikes + 1);
                expect(returnedFrameId).toBe(frame.id.toString());
                expect(returnedGalerieId).toBe(galerieId);
                expect(status).toBe(200);
                expect(verifyToken.data.likeId).toBe(like.id);
                expect(verifyToken.type).toBe('FRAME_LIKED');
              });
              it('increment frame.numOfLikes if this frame wasn\'t like by current user', async () => {
                const {
                  body: {
                    data: {
                      numOfLikes,
                    },
                  },
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                const updatedFrame = await Frame.findByPk(frame.id) as Frame;
                expect(updatedFrame.numOfLikes).toBe(numOfLikes);
              });
              it('return liked === true if this frame wasn\'t like by current user', async () => {
                const {
                  body: {
                    data: {
                      liked,
                    },
                  },
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                expect(liked).toBe(true);
              });
              it('destroy Like and do not return notificationToken if this frame was like by current user', async () => {
                const {
                  body: {
                    data: {
                      numOfLikes: numOfLikesAfterLike,
                    },
                  },
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                const {
                  body: {
                    data: {
                      numOfLikes: numOfLikesAfterUnlike,
                      notificationToken,
                    },
                  },
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                const like = await Like.findOne({
                  where: {
                    frameId: frame.id,
                    userId: user.id,
                  },
                });
                expect(like).toBeNull();
                expect(notificationToken).toBeUndefined();
                expect(numOfLikesAfterUnlike).toBe(numOfLikesAfterLike - 1);
              });
              it('decrement frame.numOfLikes if this frame was like by current user', async () => {
                await createLike({
                  frameId: frame.id,
                  userId: user.id,
                });
                const {
                  body: {
                    data: {
                      numOfLikes,
                    },
                  },
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                const updatedFrame = await Frame.findByPk(frame.id) as Frame;
                expect(updatedFrame.numOfLikes).toBe(numOfLikes);
              });
              it('return liked === false if this frame was liked by current user', async () => {
                await createLike({
                  frameId: frame.id,
                  userId: user.id,
                });
                const {
                  body: {
                    data: {
                      liked,
                    },
                  },
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                expect(liked).toBe(false);
              });
              it('do not return notificationToken if user like his own frame', async () => {
                const { id: frameId } = await createFrame({
                  galerieId,
                  userId: user.id,
                });
                const {
                  body: {
                    data: {
                      notificationToken,
                    },
                  },
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(notificationToken).toBeUndefined();
              });
              it('destoy notificationFrameLiked if currentUser dislike a frame', async () => {
                await createLike({
                  frameId: frame.id,
                  userId: user.id,
                });
                await createNotificationFrameLiked({
                  frameId: frame.id,
                  likedById: user.id,
                  userId: userTwo.id,
                });
                await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                const notificationsFrameLiked = await NotificationFrameLiked.findAll();
                expect(notificationsFrameLiked.length).toBe(0);
              });
            });
            describe('should return status 400 if', () => {
              it('request.parmas.galerieId is not a UUID v4', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdLikes(app, token, '100', uuidv4());
                expect(body.errors).toBe(INVALID_UUID('galerie'));
                expect(status).toBe(400);
              });
              it('request.parmas.galerieId is not a UUID v4', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdLikes(app, token, uuidv4(), '100');
                expect(body.errors).toBe(INVALID_UUID('frame'));
                expect(status).toBe(400);
              });
            });
            describe('should return status 404 if', () => {
              it('galerie not found', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdLikes(app, token, uuidv4(), uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
                expect(status).toBe(404);
              });
              it('galerie exist by current user is not subscribe to it', async () => {
                const {
                  user: userTwo,
                } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const galerieTwo = await createGalerie({
                  userId: userTwo.id,
                });
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdLikes(app, token, galerieTwo.id, uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
                expect(status).toBe(404);
              });
              it('frame not found', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
                expect(status).toBe(404);
              });
              it('frame exist but it not post on this galerie', async () => {
                const galerieTwo = await createGalerie({
                  userId: user.id,
                });
                const { id: frameId } = await createFrame({
                  galerieId: galerieTwo.id,
                  userId: user.id,
                });
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
                expect(status).toBe(404);
              });
            });
          });
        });
      });
    });
  });
});
