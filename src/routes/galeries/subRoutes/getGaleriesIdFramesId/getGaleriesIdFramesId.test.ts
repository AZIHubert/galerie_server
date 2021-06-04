import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  getGaleriesIdFramesFrameId,
  login,
  postGalerie,
  postGaleriesIdFrames,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  postProfilePicture,
  postBlackListUser,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('galeries', () => {
  let app: Server;
  let galerieId: string;
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
      user = await createUser({
        role: 'superAdmin',
      });
      const { body } = await login(app, user.email, userPassword);
      token = body.token;
      const {
        body: {
          data: {
            galerie: {
              id,
            },
          },
        },
      } = await postGalerie(app, token, {
        name: 'galerie\'s name',
      });
      galerieId = id;
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
    describe('frames', () => {
      describe(':frameId', () => {
        describe('should return status 200 and', () => {
          it('return frame', async () => {
            const {
              body: {
                data: {
                  frame,
                },
              },
            } = await postGaleriesIdFrames(app, token, galerieId, {
              description: 'frame\'s description',
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
            } = await getGaleriesIdFramesFrameId(app, token, galerieId, frame.id);
            expect(action).toBe('GET');
            expect(returnedFrame.createdAt).toBe(frame.createdAt);
            expect(returnedFrame.description).toBe(frame.description);
            expect(returnedFrame.galerieId).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].current).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].createdAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImageId).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.bucketName).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.createdAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.format).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.fileName).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.height).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.id).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.signedUrl).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.size).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.updatedAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.width).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].frameId).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].id).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].index).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImageId).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.bucketName).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.createdAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.format).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.fileName).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.height).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.id).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.signedUrl).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.size).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.updatedAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.width).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImageId).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.bucketName).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.createdAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.format).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.fileName).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.height).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.id).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.signedUrl).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.size).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.updatedAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.width).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].updatedAt).toBeUndefined();
            expect(returnedFrame.id).toBe(frame.id);
            expect(returnedFrame.numOfLikes).toBe(frame.numOfLikes);
            expect(returnedFrame.updatedAt).toBeUndefined();
            expect(returnedFrame.user.authTokenVersion).toBeUndefined();
            expect(returnedFrame.user.confirmed).toBeUndefined();
            expect(returnedFrame.user.confirmedTokenVersion).toBeUndefined();
            expect(returnedFrame.user.createdAt).not.toBeUndefined();
            expect(returnedFrame.user.defaultProfilePicture).not.toBeUndefined();
            expect(returnedFrame.user.emailTokenVersion).toBeUndefined();
            expect(returnedFrame.user.email).toBeUndefined();
            expect(returnedFrame.user.facebookId).toBeUndefined();
            expect(returnedFrame.user.googleId).toBeUndefined();
            expect(returnedFrame.user.id).not.toBeUndefined();
            expect(returnedFrame.user.password).toBeUndefined();
            expect(returnedFrame.user.pseudonym).not.toBeUndefined();
            expect(returnedFrame.user.resetPasswordTokenVersion).toBeUndefined();
            expect(returnedFrame.user.role).not.toBeUndefined();
            expect(returnedFrame.user.socialMediaUserName).not.toBeUndefined();
            expect(returnedFrame.user.updatedAt).toBeUndefined();
            expect(returnedFrame.user.updatedEmailTokenVersion).toBeUndefined();
            expect(returnedFrame.user.userName).not.toBeUndefined();
            expect(returnedFrame.userId).toBeUndefined();
            expect(returnedGalerieId).toBe(galerieId);
            expect(status).toBe(200);
          });
          it('include current profile picture', async () => {
            const {
              body: {
                data: {
                  frame,
                },
              },
            } = await postGaleriesIdFrames(app, token, galerieId);
            const {
              body: {
                data: {
                  profilePicture,
                },
              },
            } = await postProfilePicture(app, token);
            const {
              body: {
                data: {
                  frame: returnedFrame,
                },
              },
            } = await getGaleriesIdFramesFrameId(app, token, galerieId, frame.id);
            expect(returnedFrame.user.currentProfilePicture.createdAt).not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.cropedImageId).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.cropedImage.bucketName).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.cropedImage.createdAt).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.cropedImage.format).not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.cropedImage.fileName).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.cropedImage.height).not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.cropedImage.id).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.cropedImage.signedUrl)
              .not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.cropedImage.size).not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.cropedImage.width).not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.current).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.id).toBe(profilePicture.id);
            expect(returnedFrame.user.currentProfilePicture.originalImageId).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.originalImage.bucketName)
              .toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.originalImage.createdAt)
              .toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.originalImage.format)
              .not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.originalImage.fileName).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.originalImage.height)
              .not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.originalImage.id).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.originalImage.signedUrl)
              .not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.originalImage.size).not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.originalImage.updatedAt)
              .toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.originalImage.width)
              .not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.pendingImageId).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.pendingImage.bucketName)
              .toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.pendingImage.createdAt).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.pendingImage.format)
              .not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.pendingImage.fileName).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.pendingImage.height)
              .not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.pendingImage.id).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.pendingImage.signedUrl)
              .not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.pendingImage.size).not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.pendingImage.width).not.toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.updatedAt).toBeUndefined();
            expect(returnedFrame.user.currentProfilePicture.userId).toBeUndefined();
          });
          it('should not include frame\'s user if he\'s ban', async () => {
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
                  invitation: {
                    code,
                  },
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId, {});
            await postGaleriesSubscribe(app, tokenTwo, { code });
            const {
              body: {
                data: {
                  frame: {
                    id: frameId,
                  },
                },
              },
            } = await postGaleriesIdFrames(app, tokenTwo, galerieId);
            await postBlackListUser(app, token, userTwo.id, {
              reason: 'black list reason',
            });
            const {
              body: {
                data: {
                  frame: {
                    user: frameUser,
                  },
                },
              },
            } = await getGaleriesIdFramesFrameId(app, token, galerieId, frameId);
            expect(frameUser).toBeNull();
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.galerieId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdFramesFrameId(app, token, '100', uuidv4());
            expect(body.errors).toBe(INVALID_UUID('galerie'));
            expect(status).toBe(400);
          });
          it('request.params.frameId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdFramesFrameId(app, token, uuidv4(), '100');
            expect(body.errors).toBe(INVALID_UUID('frame'));
            expect(status).toBe(400);
          });
        });
        describe('should return status 404 if', () => {
          it('galerie not found', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdFramesFrameId(app, token, uuidv4(), uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
          it('frame not found', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdFramesFrameId(app, token, galerieId, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
            expect(status).toBe(404);
          });
          it('galerie exist but user is not subscribe to it', async () => {
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
              body,
              status,
            } = await getGaleriesIdFramesFrameId(app, tokenTwo, uuidv4(), uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
          it('frame with :frameId does not belong to galerie with :galerieId', async () => {
            const {
              body: {
                data: {
                  galerie: {
                    id,
                  },
                },
              },
            } = await postGalerie(app, token, {
              name: 'galerie\'s name',
            });
            const {
              body: {
                data: {
                  frame: {
                    id: frameId,
                  },
                },
              },
            } = await postGaleriesIdFrames(app, token, id);
            const {
              body,
              status,
            } = await getGaleriesIdFramesFrameId(app, token, galerieId, frameId);
            expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
