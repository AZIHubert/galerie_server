import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Invitation,
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
  cleanGoogleBuckets,
  createBlackList,
  createGalerie,
  createGalerieUser,
  createInvitation,
  createProfilePicture,
  createUser,
  getGaleriesIdInvitations,
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
    describe('/invitations', () => {
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
          it('return no invitation', async () => {
            const {
              body: {
                action,
                data: {
                  galerieId: returnedGalerieId,
                  invitations,
                },
              },
              status,
            } = await getGaleriesIdInvitations(app, token, galerieId);
            expect(action).toBe('GET');
            expect(returnedGalerieId).toBe(galerieId);
            expect(invitations.length).toBe(0);
            expect(status).toBe(200);
          });
          it('return 1 invitation', async () => {
            await createInvitation({
              galerieId,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  invitations,
                },
              },
            } = await getGaleriesIdInvitations(app, token, galerieId);
            expect(invitations.length).toBe(1);
            expect(invitations[0].code).not.toBeUndefined();
            expect(invitations[0].createdAt).not.toBeUndefined();
            expect(invitations[0].galerieId).toBeUndefined();
            expect(invitations[0].id).not.toBeUndefined();
            expect(invitations[0].numOfInvits).not.toBeUndefined();
            expect(invitations[0].time).not.toBeUndefined();
            expect(invitations[0].updatedAt).toBeUndefined();
            testUser(invitations[0].user);
            expect(invitations[0].userId).toBeUndefined();
          });
          it('return invitations if there are not expired', async () => {
            const timeStamp = 1434319925275;
            const time = 1000 * 60 * 10;
            mockDate.set(timeStamp);
            await createInvitation({
              galerieId,
              time,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  invitations,
                },
              },
            } = await getGaleriesIdInvitations(app, token, galerieId);
            expect(invitations.length).toBe(1);
          });
          it('return invitations if numOfInvits > 0', async () => {
            await createInvitation({
              galerieId,
              numOfInvits: 1,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  invitations,
                },
              },
            } = await getGaleriesIdInvitations(app, token, galerieId);
            expect(invitations.length).toBe(1);
          });
          it('return a pack of 20 invitations', async () => {
            const NUM = 21;
            const numOfInvitations = new Array(NUM).fill(0);
            await Promise.all(
              numOfInvitations.map(async () => {
                await Invitation.create({
                  code: 'code',
                  galerieId,
                  userId: user.id,
                });
              }),
            );
            const {
              body: {
                data: {
                  invitations: firstPack,
                },
              },
            } = await getGaleriesIdInvitations(app, token, galerieId);
            const {
              body: {
                data: {
                  invitations: secondPack,
                },
              },
            } = await getGaleriesIdInvitations(app, token, galerieId, { page: 2 });
            expect(firstPack.length).toBe(20);
            expect(secondPack.length).toBe(1);
          });
          it('order invitations by createdAt', async () => {
            const invitationOne = await createInvitation({
              galerieId,
              userId: user.id,
            });
            const invitationTwo = await createInvitation({
              galerieId,
              userId: user.id,
            });
            const invitationThree = await createInvitation({
              galerieId,
              userId: user.id,
            });
            const invitationFour = await createInvitation({
              galerieId,
              userId: user.id,
            });
            const invitationFive = await createInvitation({
              galerieId,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  invitations,
                },
              },
            } = await getGaleriesIdInvitations(app, token, galerieId);
            expect(invitations.length).toBe(5);
            expect(invitations[0].id).toBe(invitationFive.id);
            expect(invitations[1].id).toBe(invitationFour.id);
            expect(invitations[2].id).toBe(invitationThree.id);
            expect(invitations[3].id).toBe(invitationTwo.id);
            expect(invitations[4].id).toBe(invitationOne.id);
          });
          it('return user\'s profile picture', async () => {
            await createInvitation({
              galerieId,
              userId: user.id,
            });
            await createProfilePicture({
              userId: user.id,
            });
            const {
              body: {
                data: {
                  invitations,
                },
              },
            } = await getGaleriesIdInvitations(app, token, galerieId);
            expect(invitations[0].user.currentProfilePicture.createdAt).not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.cropedImageId).toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.cropedImage.bucketName)
              .toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.cropedImage.createdAt).toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.cropedImage.fileName).toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.cropedImage.format)
              .not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.cropedImage.height)
              .not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.cropedImage.id).toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.cropedImage.signedUrl)
              .not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.cropedImage.size).not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.cropedImage.width).not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.current).toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.originalImageId).toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.originalImage.bucketName)
              .toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.originalImage.createdAt)
              .toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.originalImage.fileName)
              .toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.originalImage.format)
              .not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.originalImage.height)
              .not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.originalImage.id).toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.originalImage.signedUrl)
              .not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.originalImage.size)
              .not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.originalImage.updatedAt)
              .toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.originalImage.width)
              .not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.id).not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.pendingImageId).toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.pendingImage.bucketName)
              .toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.pendingImage.createdAt)
              .toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.pendingImage.fileName).toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.pendingImage.format)
              .not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.pendingImage.height)
              .not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.pendingImage.id).toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.pendingImage.signedUrl)
              .not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.pendingImage.size).not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.pendingImage.updatedAt)
              .toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.pendingImage.width)
              .not.toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.updatedAt).toBeUndefined();
            expect(invitations[0].user.currentProfilePicture.userId).toBeUndefined();
          });
          it('not return invitation if it\'s expired', async () => {
            const timeStamp = 1434319925275;
            const time = 1000 * 60 * 10;
            mockDate.set(timeStamp);
            await createInvitation({
              galerieId,
              time,
              userId: user.id,
            });
            mockDate.set(timeStamp + time + 1);
            const {
              body: {
                data: {
                  invitations,
                },
              },
            } = await getGaleriesIdInvitations(app, token, galerieId);
            expect(invitations.length).toBe(0);
          });
          it('not return invitation if numOfInvits < 1', async () => {
            await createInvitation({
              galerieId,
              numOfInvits: 0,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  invitations,
                },
              },
            } = await getGaleriesIdInvitations(app, token, galerieId);
            expect(invitations.length).toBe(0);
          });
          it('return invitation.user === null if user is black listed', async () => {
            const {
              user: userTwo,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createGalerieUser({
              galerieId,
              role: 'admin',
              userId: userTwo.id,
            });
            await createInvitation({
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
                  invitations: [{
                    user: invitationUser,
                  }],
                },
              },
            } = await getGaleriesIdInvitations(app, token, galerieId);
            expect(invitationUser).toBeNull();
          });
          it('return user if his blackList is expired', async () => {
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
              role: 'admin',
              userId: userTwo.id,
            });
            await createInvitation({
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
                  invitations,
                },
              },
            } = await getGaleriesIdInvitations(app, token, galerieId);
            await userTwo.reload();
            expect(invitations[0].user).not.toBeNull();
            expect(userTwo.blackListedAt).toBeNull();
            expect(userTwo.isBlackListed).toBe(false);
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.invitationId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdInvitations(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('galerie'));
            expect(status).toBe(400);
          });
          it('user\'s role for this galerie is \'user\'', async () => {
            const {
              user: userTwo,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { token: tokenTwo } = signAuthToken(userTwo);
            await createGalerieUser({
              galerieId,
              userId: userTwo.id,
            });
            const {
              body,
              status,
            } = await getGaleriesIdInvitations(app, tokenTwo, galerieId);
            expect(body.errors).toBe('you\'re not allow to fetch the invitations');
            expect(status).toBe(400);
          });
        });
        describe('should return error 404 if', () => {
          it('galerie not found', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdInvitations(app, token, uuidv4());
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
            } = await getGaleriesIdInvitations(app, token, galerieTwo.id);
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
