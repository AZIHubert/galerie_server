import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  Frame,
  GaleriePicture,
  Image,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import signedUrl from '#src/helpers/signedUrl';
import {
  createBlackList,
  createFrame,
  createGalerie,
  createGalerieUser,
  createLike,
  createReport,
  createUser,
  getGaleriesIdFrames,
  testFrame,
  testUser,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('#src/helpers/signedUrl', () => jest.fn());

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
            } = await createUser({});
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
            expect(frames[0].user.hasNewNotifications).toBeUndefined();
            testFrame(frames[0]);
            testUser(frames[0].user);
          });
          it('do not return frames if user is not subscribe to this galerie', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const galerieTwo = await createGalerie({
              name: 'galerie2',
              userId: userTwo.id,
            });
            await createFrame({
              galerieId: galerieTwo.id,
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  frames,
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
            expect(frames.length).toBe(0);
          });
          it('return frame if currentUser is not subscribe to this galerie currentUser.role === \'admin\' or \'moderator\'', async () => {
            const { user: moderator } = await createUser({
              email: 'moderator@email.com',
              role: 'moderator',
              userName: 'moderator',
            });
            const { token: tokenTwo } = signAuthToken(moderator);
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
            } = await getGaleriesIdFrames(app, tokenTwo, galerieId);
            expect(frames.length).toBe(1);
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
            } = await getGaleriesIdFrames(app, token, galerieId, {
              previousFrame: firstPack[firstPack.length - 1].autoIncrementId,
            });
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
          it('return frame.user.isBlackListed === false if user is blackListed', async () => {
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
              createdById: user.id,
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  frames: [frame],
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
            expect(frame.user.isBlackListed).toBe(true);
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
              createdById: user.id,
              time,
              userId: userTwo.id,
            });
            mockDate.set(timeStamp + time + 1);
            const {
              body: {
                data: {
                  frames: [{
                    user: {
                      isBlackListed,
                    },
                  }],
                },
              },
            } = await getGaleriesIdFrames(app, token, galerieId);
            expect(isBlackListed).not.toBeNull();
            await userTwo.reload();
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
          it('return frame === null if currentUser report this frame', async () => {
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
            const { token: tokenTwo } = signAuthToken(userTwo);
            const { id: frameId } = await createFrame({
              galerieId,
              userId: user.id,
            });
            await createReport({
              frameId,
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  frames,
                },
              },
            } = await getGaleriesIdFrames(app, tokenTwo, galerieId);
            expect(frames.length).toBe(0);
          });
          it('return frame if currentUser report this frame but his role for this galerie !== \'user\'', async () => {
            const { id: frameId } = await createFrame({
              galerieId,
              userId: user.id,
            });
            await createReport({
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
            expect(frames.length).toBe(1);
          });
          it('return frame if currentUser report this frame but his role !== \'user\'', async () => {
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
            await createReport({
              frameId,
              userId: admin.id,
            });
            const {
              body: {
                data: {
                  frames,
                },
              },
            } = await getGaleriesIdFrames(app, tokenTwo, galerieId);
            expect(frames.length).toBe(1);
          });
          it('return frame if currentUser report this frame but his role !== \'user\' and is not subscribe to this galerie', async () => {
            const { user: admin } = await createUser({
              email: 'admin@email.com',
              role: 'admin',
              userName: 'admin',
            });
            await createGalerieUser({
              galerieId,
              userId: admin.id,
            });
            const { token: tokenTwo } = signAuthToken(admin);
            const { id: frameId } = await createFrame({
              galerieId,
              userId: user.id,
            });
            await createReport({
              frameId,
              userId: admin.id,
            });
            const {
              body: {
                data: {
                  frames,
                },
              },
            } = await getGaleriesIdFrames(app, tokenTwo, galerieId);
            expect(frames.length).toBe(1);
          });
          describe('return first frames if req.query.previousFrame', () => {
            let frameId: string;

            beforeEach(async (done) => {
              try {
                await createFrame({
                  galerieId,
                  userId: user.id,
                });
                const frame = await createFrame({
                  galerieId,
                  userId: user.id,
                });
                frameId = frame.id;
              } catch (err) {
                done(err);
              }
              done();
            });

            it('is not a number', async () => {
              const {
                body: {
                  data: {
                    frames,
                  },
                },
              } = await getGaleriesIdFrames(app, token, galerieId, {
                previousFrame: 'notANumber',
              });
              expect(frames.length).toBe(2);
              expect(frames[0].id).toBe(frameId);
            });
            it('is less than 0', async () => {
              const {
                body: {
                  data: {
                    frames,
                  },
                },
              } = await getGaleriesIdFrames(app, token, galerieId, {
                previousFrame: '-1',
              });
              expect(frames.length).toBe(2);
              expect(frames[0].id).toBe(frameId);
            });
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
          it('galerie exist but user is not subscribe to it and currentUser.role === \'user\'', async () => {
            const {
              user: userTwo,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const galerieTwo = await createGalerie({
              name: 'galerie2',
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
