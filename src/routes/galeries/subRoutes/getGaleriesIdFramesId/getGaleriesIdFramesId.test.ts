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
  cleanGoogleBuckets,
  createBlackList,
  createFrame,
  createGalerie,
  createGalerieUser,
  createProfilePicture,
  createUser,
  getGaleriesIdFramesId,
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
              await cleanGoogleBuckets();
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
              await cleanGoogleBuckets();
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
              expect(new Date(returnedFrame.createdAt)).toEqual(frame.createdAt);
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
              expect(returnedFrame.user.blackListedAt).toBeUndefined();
              expect(returnedFrame.user.confirmed).toBeUndefined();
              expect(returnedFrame.user.confirmedTokenVersion).toBeUndefined();
              expect(returnedFrame.user.createdAt).not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture).not.toBeUndefined();
              expect(returnedFrame.user.defaultProfilePicture).not.toBeUndefined();
              expect(returnedFrame.user.email).toBeUndefined();
              expect(returnedFrame.user.emailTokenVersion).toBeUndefined();
              expect(returnedFrame.user.facebookId).toBeUndefined();
              expect(returnedFrame.user.googleId).toBeUndefined();
              expect(returnedFrame.user.hash).toBeUndefined();
              expect(returnedFrame.user.id).not.toBeUndefined();
              expect(returnedFrame.user.isBlackListed).toBeUndefined();
              expect(returnedFrame.user.pseudonym).not.toBeUndefined();
              expect(returnedFrame.user.resetPasswordTokenVersion).toBeUndefined();
              expect(returnedFrame.user.role).not.toBeUndefined();
              expect(returnedFrame.user.salt).toBeUndefined();
              expect(returnedFrame.user.socialMediaUserName).not.toBeUndefined();
              expect(returnedFrame.user.updatedAt).toBeUndefined();
              expect(returnedFrame.user.updatedEmailTokenVersion).toBeUndefined();
              expect(returnedFrame.user.userName).not.toBeUndefined();
              expect(returnedFrame.userId).toBeUndefined();
              expect(returnedGalerieId).toBe(galerieId);
              expect(status).toBe(200);
            });
            it('include current profile picture', async () => {
              const frame = await createFrame({
                galerieId,
                userId: user.id,
              });
              const profilePicture = await createProfilePicture({
                userId: user.id,
              });
              const {
                body: {
                  data: {
                    frame: returnedFrame,
                  },
                },
              } = await getGaleriesIdFramesId(app, token, galerieId, frame.id);
              expect(returnedFrame.user.currentProfilePicture.createdAt).not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.cropedImageId).toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.cropedImage.bucketName)
                .toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.cropedImage.createdAt)
                .toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.cropedImage.format)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.cropedImage.fileName).toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.cropedImage.height)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.cropedImage.id).toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.cropedImage.signedUrl)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.cropedImage.size).not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.cropedImage.updatedAt)
                .toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.cropedImage.width)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.current).toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.id).toBe(profilePicture.id);
              expect(returnedFrame.user.currentProfilePicture.originalImageId).toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.originalImage.bucketName)
                .toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.originalImage.createdAt)
                .toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.originalImage.format)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.originalImage.fileName)
                .toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.originalImage.height)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.originalImage.id).toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.originalImage.signedUrl)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.originalImage.size)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.originalImage.updatedAt)
                .toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.originalImage.width)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.pendingImageId).toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.pendingImage.bucketName)
                .toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.pendingImage.createdAt)
                .toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.pendingImage.format)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.pendingImage.fileName)
                .toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.pendingImage.height)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.pendingImage.id).toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.pendingImage.signedUrl)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.pendingImage.size)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.pendingImage.updatedAt)
                .toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.pendingImage.width)
                .not.toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.updatedAt).toBeUndefined();
              expect(returnedFrame.user.currentProfilePicture.userId).toBeUndefined();
            });
            it('should return frame.user === null if he\'s black listed', async () => {
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
                adminId: user.id,
                userId: userTwo.id,
              });
              const {
                body: {
                  data: {
                    frame: {
                      user: frameUser,
                    },
                  },
                },
              } = await getGaleriesIdFramesId(app, token, galerieId, frameId);
              expect(frameUser).toBeNull();
            });
            it('should return frame.user if his blackList is expired', async () => {
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
                adminId: user.id,
                time,
                userId: userTwo.id,
              });
              mockDate.set(timeStamp + time + 1);
              const {
                body: {
                  data: {
                    frame: {
                      user: frameUser,
                    },
                  },
                },
              } = await getGaleriesIdFramesId(app, token, galerieId, frameId);
              await userTwo.reload();
              expect(frameUser).not.toBeNull();
              expect(userTwo.blackListedAt).toBeNull();
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
            it('galerie exist but user is not subscribe to it', async () => {
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
