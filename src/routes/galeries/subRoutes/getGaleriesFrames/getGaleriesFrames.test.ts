import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Frame,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  createFrame,
  createGalerie,
  createGalerieUser,
  createProfilePicture,
  createUser,
  getGaleriesFrames,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/frames', () => {
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
          } = await createUser({
            role: 'superAdmin',
          });
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
        it('return no frame', async () => {
          const {
            body: {
              action,
              data: {
                frames,
              },
            },
            status,
          } = await getGaleriesFrames(app, token);
          expect(action).toBe('GET');
          expect(frames.length).toBe(0);
          expect(status).toBe(200);
        });
        it('return one frame', async () => {
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
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
          } = await getGaleriesFrames(app, token);
          expect(frames.length).toBe(1);
        });
        it('return frames with relevent attributes', async () => {
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
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
          } = await getGaleriesFrames(app, token);
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
          expect(frames[0].numOfLikes).not.toBeUndefined();
          expect(frames[0].updatedAt).toBeUndefined();
          expect(frames[0].user.authTokenVersion).toBeUndefined();
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
          expect(frames[0].user.pseudonym).not.toBeUndefined();
          expect(frames[0].user.resetPasswordTokenVersion).toBeUndefined();
          expect(frames[0].user.role).not.toBeUndefined();
          expect(frames[0].user.salt).toBeUndefined();
          expect(frames[0].user.socialMediaUserName).not.toBeUndefined();
          expect(frames[0].user.updatedAt).toBeUndefined();
          expect(frames[0].user.updatedEmailTokenVersion).toBeUndefined();
          expect(frames[0].user.userName).not.toBeUndefined();
        });
        it('return frames with user with his current profile picture', async () => {
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          await createFrame({
            galerieId,
            userId: user.id,
          });
          await createProfilePicture({
            current: true,
            userId: user.id,
          });
          const {
            body: {
              data: {
                frames,
              },
            },
          } = await getGaleriesFrames(app, token);
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
        it('return two frames from two different galeries', async () => {
          const {
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const galerieOne = await createGalerie({
            userId: userTwo.id,
          });
          const galerieTwo = await createGalerie({
            userId: user.id,
          });
          await createGalerieUser({
            galerieId: galerieOne.id,
            userId: user.id,
          });
          await createFrame({
            galerieId: galerieTwo.id,
            userId: userTwo.id,
          });
          await createFrame({
            galerieId: galerieTwo.id,
            userId: user.id,
          });
          const {
            body: {
              data: {
                frames,
              },
            },
          } = await getGaleriesFrames(app, token);
          expect(frames.length).toBe(2);
        });
        it('return a pack of 20 frames', async () => {
          const NUMBER = 21;
          const numOfFrames = new Array(NUMBER).fill(0);
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          await Promise.all(
            numOfFrames.map(async () => {
              const {
                id: frameId,
              } = await Frame.create({
                galerieId,
                userId: user.id,
              });
              const {
                id: imageId,
              } = await Image.create({
                bucketName: 'bucketName',
                fileName: 'fileName',
                format: 'format',
                height: 10,
                size: 10,
                width: 10,
              });
              await GaleriePicture.create({
                cropedImageId: imageId,
                current: false,
                frameId,
                originalImageId: imageId,
                pendingImageId: imageId,
              });
            }),
          );
          const {
            body: {
              data: {
                frames: firstPack,
              },
            },
          } = await getGaleriesFrames(app, token);
          const {
            body: {
              data: {
                frames: secondPack,
              },
            },
          } = await getGaleriesFrames(app, token, { page: 2 });
          expect(firstPack.length).toBe(20);
          expect(secondPack.length).toBe(1);
        });
        it('don\'t return frame of galerie where user is not subscribed', async () => {
          const {
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          await createFrame({
            galerieId,
            userId: userTwo.id,
          });
          const {
            body: {
              data: {
                frames,
              },
            },
          } = await getGaleriesFrames(app, token);
          expect(frames.length).toBe(0);
        });
        it('return frames ordered by createdAt', async () => {
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
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
          } = await getGaleriesFrames(app, token);
          expect(frames[0].id).toBe(frameFive.id);
          expect(frames[1].id).toBe(frameFour.id);
          expect(frames[2].id).toBe(frameThree.id);
          expect(frames[3].id).toBe(frameTwo.id);
          expect(frames[4].id).toBe(frameOne.id);
        });
        it('return null and destroy frame if frame don\'t have galeriePictures', async () => {
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
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
          } = await getGaleriesFrames(app, token);
          const frame = await Frame.findByPk(frameId);
          expect(frame).toBeNull();
          expect(frames.length).toBe(1);
          expect(frames[0]).toBeNull();
        });
        it('return null and destroy frame if signedUrl.OK === false', async () => {
          (signedUrl as jest.Mock).mockImplementation(() => ({
            OK: false,
          }));
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
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
          } = await getGaleriesFrames(app, token);
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
    });
  });
});
