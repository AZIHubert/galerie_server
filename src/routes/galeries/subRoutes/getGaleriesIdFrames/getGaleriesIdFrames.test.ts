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
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  createBlackList,
  createFrame,
  createGalerie,
  createGalerieUser,
  createProfilePicture,
  createLike,
  createUser,
  getGaleriesIdFrames,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('@src/helpers/signedUrl', () => jest.fn());

describe('/galeries', () => {
  describe(':/galerieId', () => {
    describe('/frames', () => {
      describe('POST', () => {
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
          it('return no frame', async () => {
            const {
              body: {
                action,
                data: {
                  galerieId: returnedGalerieId,
                  frames,
                },
              },
              status,
            } = await getGaleriesIdFrames(app, token, galerieId);
            expect(action).toBe('GET');
            expect(frames.length).toBe(0);
            expect(returnedGalerieId).toBe(galerieId);
            expect(status).toBe(200);
          });
          it('return one frame', async () => {
            await createFrame({
              galerieId,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  frames,
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
            expect(frames.length).toBe(1);
            expect(frames[0].createdAt).not.toBeUndefined();
            expect(frames[0].description).not.toBeUndefined();
            expect(frames[0].galerieId).toBeUndefined();
            expect(frames[0].galeriePictures[0].current).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].createdAt).toBeUndefined();
            expect(frames[0].galeriePictures[0].cropedImage.createdAt).toBeUndefined();
            expect(frames[0].galeriePictures[0].cropedImage.format).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].cropedImage.height).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].cropedImage.id).toBeUndefined();
            expect(frames[0].galeriePictures[0].cropedImage.signedUrl).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].cropedImage.size).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].cropedImage.updatedAt).toBeUndefined();
            expect(frames[0].galeriePictures[0].cropedImage.width).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].cropedImageId).toBeUndefined();
            expect(frames[0].galeriePictures[0].id).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].index).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].originalImage.createdAt).toBeUndefined();
            expect(frames[0].galeriePictures[0].originalImage.format).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].originalImage.height).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].originalImage.id).toBeUndefined();
            expect(frames[0].galeriePictures[0].originalImage.signedUrl).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].originalImage.size).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].originalImage.updatedAt).toBeUndefined();
            expect(frames[0].galeriePictures[0].originalImage.width).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].originalImageId).toBeUndefined();
            expect(frames[0].galeriePictures[0].pendingImage.createdAt).toBeUndefined();
            expect(frames[0].galeriePictures[0].pendingImage.format).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].pendingImage.height).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].pendingImage.id).toBeUndefined();
            expect(frames[0].galeriePictures[0].pendingImage.signedUrl).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].pendingImage.size).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].pendingImage.updatedAt).toBeUndefined();
            expect(frames[0].galeriePictures[0].pendingImage.width).not.toBeUndefined();
            expect(frames[0].galeriePictures[0].pendingImageId).toBeUndefined();
            expect(frames[0].id).not.toBeUndefined();
            expect(frames[0].liked).not.toBeUndefined();
            expect(frames[0].likes).toBeUndefined();
            expect(frames[0].numOfLikes).not.toBeUndefined();
            expect(frames[0].updatedAt).toBeUndefined();
            expect(frames[0].user.authTokenVersion).toBeUndefined();
            expect(frames[0].user.blackListedAt).toBeUndefined();
            expect(frames[0].user.confirmed).toBeUndefined();
            expect(frames[0].user.confirmTokenVersion).toBeUndefined();
            expect(frames[0].user.createdAt).not.toBeUndefined();
            expect(frames[0].user.defaultProfilePicture).not.toBeUndefined();
            expect(frames[0].user.email).toBeUndefined();
            expect(frames[0].user.emailTokenVersion).toBeUndefined();
            expect(frames[0].user.facebookId).toBeUndefined();
            expect(frames[0].user.googleId).toBeUndefined();
            expect(frames[0].user.hash).toBeUndefined();
            expect(frames[0].user.id).not.toBeUndefined();
            expect(frames[0].user.isBlackListed).toBeUndefined();
            expect(frames[0].user.pseudonym).not.toBeUndefined();
            expect(frames[0].user.resetPasswordTokenVersion).toBeUndefined();
            expect(frames[0].user.role).not.toBeUndefined();
            expect(frames[0].user.salt).toBeUndefined();
            expect(frames[0].user.socialMediaUserName).not.toBeUndefined();
            expect(frames[0].user.updatedAt).toBeUndefined();
            expect(frames[0].user.updatedEmailTokenVersion).toBeUndefined();
            expect(frames[0].user.userName).not.toBeUndefined();
          });
          it('should return a pack of 20 frames', async () => {
            const NUMBER = 21;
            const numOfFrames = new Array(NUMBER).fill(0);
            await Promise.all(
              numOfFrames.map(async () => {
                await createFrame({
                  galerieId,
                  userId: user.id,
                });
              }),
            );
            const {
              body: {
                data: {
                  frames: firstPack,
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
            const {
              body: {
                data: {
                  frames: secondPack,
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId, { page: 2 });
            expect(firstPack.length).toBe(20);
            expect(secondPack.length).toBe(1);
          });
          it('should order by created at', async () => {
            const frameOne = await createFrame({
              galerieId,
              userId: user.id,
            });
            const frameTwo = await createFrame({
              galerieId,
              userId: user.id,
            });
            const frameThree = await createFrame({
              galerieId,
              userId: user.id,
            });
            const frameFour = await createFrame({
              galerieId,
              userId: user.id,
            });
            const frameFive = await createFrame({
              galerieId,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  frames,
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
            expect(frames.length).toBe(5);
            expect(frames[0].id).toBe(frameFive.id);
            expect(frames[1].id).toBe(frameFour.id);
            expect(frames[2].id).toBe(frameThree.id);
            expect(frames[3].id).toBe(frameTwo.id);
            expect(frames[4].id).toBe(frameOne.id);
          });
          it('should include user\'s current profile picture', async () => {
            await createFrame({
              galerieId,
              userId: user.id,
            });
            await createProfilePicture({
              userId: user.id,
            });
            const {
              body: {
                data: {
                  frames,
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
            expect(frames[0].user.currentProfilePicture.createdAt).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.cropedImage.createdAt).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.cropedImage.format).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.cropedImage.height).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.cropedImage.id).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.cropedImage.size).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.cropedImage.width).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.cropedImageId).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.current).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.id).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.originalImage.createdAt).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.originalImage.format).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.originalImage.height).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.originalImage.id).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.originalImage.signedUrl)
              .not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.originalImage.size).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.originalImage.updatedAt).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.originalImage.width).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.originalImageId).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.pendingImage.createdAt).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.pendingImage.format).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.pendingImage.height).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.pendingImage.id).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.pendingImage.size).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.pendingImage.width).not.toBeUndefined();
            expect(frames[0].user.currentProfilePicture.pendingImageId).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.updatedAt).toBeUndefined();
            expect(frames[0].user.currentProfilePicture.userId).toBeUndefined();
          });
          it('return with liked === false if user don\'t have like a frame', async () => {
            await createFrame({
              galerieId,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  frames,
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
            expect(frames[0].liked).toBe(false);
          });
          it('return with liked === true if user have like a frame', async () => {
            const { id: frameId } = await createFrame({
              galerieId,
              userId: user.id,
            });
            await createLike({
              frameId,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  frames,
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
            expect(frames[0].liked).toBe(true);
          });
          it('return with liked === false if another user have like a frame', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { id: frameId } = await createFrame({
              galerieId,
              userId: user.id,
            });
            await createLike({
              frameId,
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  frames,
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
            expect(frames[0].liked).toBe(false);
          });
          it('should return frame.user === null if user is blackListed', async () => {
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
            await createFrame({
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
                  frames: [frame],
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
            expect(frame.user).toBeNull();
          });
          it('return frame.user if blackList is expired', async () => {
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
            await createFrame({
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
                  frames: [frame],
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
            expect(frame.user).not.toBeNull();
            await userTwo.reload();
            expect(userTwo.blackListedAt).toBeNull();
            expect(userTwo.isBlackListed).toBe(false);
          });
          it('return null and destroy frame if frame don\'t have galeriePictures', async () => {
            const { id: frameId } = await Frame.create({
              galerieId,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  frames,
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
            const frame = await Frame.findByPk(frameId);
            expect(frame).toBeNull();
            expect(frames.length).toBe(1);
            expect(frames[0]).toBeNull();
          });
          it('return null and destroy frame if signedUrl.OK === false', async () => {
            (signedUrl as jest.Mock).mockImplementation(() => ({
              OK: false,
            }));
            const createdFrame = await createFrame({
              galerieId,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  frames,
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
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
            expect(frames.length).toBe(1);
            expect(frames[0]).toBeNull();
            expect(frame).toBeNull();
            expect(galeriePictures.length).toBe(0);
            expect(images.length).toBe(0);
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.galerieId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdFrames(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('galerie'));
            expect(status).toBe(400);
          });
        });
        describe('should return status 404 if', () => {
          it('galerie not found', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdFrames(app, token, uuidv4());
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
            const galerieTwo = await createGalerie({
              userId: userTwo.id,
            });
            const {
              body,
              status,
            } = await getGaleriesIdFrames(app, token, galerieTwo.id);
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
