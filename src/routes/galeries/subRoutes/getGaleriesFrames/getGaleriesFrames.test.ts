import { Server } from 'http';
import mockDate from 'mockdate';
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
  createBlackList,
  createFrame,
  createGalerie,
  createGalerieUser,
  createLike,
  createUser,
  getGaleriesFrames,
  testFrame,
  testUser,
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
          testFrame(frames[0]);
          expect(frames[0].user.hasNewNotifications).toBeUndefined();
          testUser(frames[0].user);
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
            name: 'galerie2',
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
        it('return with liked === false if user don\'t have like a frame', async () => {
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
          expect(frames[0].liked).toBe(false);
        });
        it('return with liked === true if user have like a frame', async () => {
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
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
          } = await getGaleriesFrames(app, token);
          expect(frames[0].liked).toBe(true);
        });
        it('return with liked === false if another user have like a frame', async () => {
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await createGalerieUser({
            galerieId,
            userId: userTwo.id,
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
          } = await getGaleriesFrames(app, token);
          expect(frames[0].liked).toBe(false);
        });
        it('return frame.user.isBlackListed === true if user is blackListed', async () => {
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          const { user: userTwo } = await createUser({
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
            createdById: user.id,
            userId: userTwo.id,
          });
          await userTwo.reload();
          const {
            body: {
              data: {
                frames: [{
                  user: returnedUser,
                }],
              },
            },
          } = await getGaleriesFrames(app, token);
          expect(returnedUser.isBlackListed).toBe(true);
        });
        it('return frame.user.isBlackListed === false but his blackList is expired', async () => {
          const timeStamp = 1434319925275;
          const time = 1000 * 60 * 10;
          mockDate.set(timeStamp);
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          const { user: userTwo } = await createUser({
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
            createdById: user.id,
            time,
            userId: userTwo.id,
          });
          mockDate.set(timeStamp + time + 1);
          const {
            body: {
              data: {
                frames: [{
                  user: returnedUser,
                }],
              },
            },
          } = await getGaleriesFrames(app, token);
          await userTwo.reload();
          expect(userTwo.isBlackListed).toBe(false);
          expect(returnedUser.isBlackListed).toBe(false);
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
