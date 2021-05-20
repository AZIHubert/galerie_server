import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Invitation,
  User,
} from '@src/db/models';

import { INVALID_UUID } from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  getGaleriesIdInvitations,
  login,
  postGalerie,
  postGaleriesIdInvitations,
  postProfilePicture,
  postGaleriesSubscribe,
  putGaleriesIdUsersId,
  postBlackListUser,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/galeries', () => {
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

  describe('/:id', () => {
    describe('/invitations', () => {
      describe('GET', () => {
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
          it('should return 1 invitation', async () => {
            await postGaleriesIdInvitations(app, token, galerieId, {});
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
            expect(invitations[0].user.authTokenVersion).toBeUndefined();
            expect(invitations[0].user.confirmed).toBeUndefined();
            expect(invitations[0].user.createdAt).not.toBeUndefined();
            expect(invitations[0].user.confirmTokenVersion).toBeUndefined();
            expect(invitations[0].user.currentProfilePicture).not.toBeUndefined();
            expect(invitations[0].user.defaultProfilePicture).not.toBeUndefined();
            expect(invitations[0].user.email).toBeUndefined();
            expect(invitations[0].user.emailTokenVersion).toBeUndefined();
            expect(invitations[0].user.facebookId).toBeUndefined();
            expect(invitations[0].user.googleId).toBeUndefined();
            expect(invitations[0].user.password).toBeUndefined();
            expect(invitations[0].user.pseudonym).not.toBeUndefined();
            expect(invitations[0].user.resetPasswordTokenVersion).toBeUndefined();
            expect(invitations[0].user.role).not.toBeUndefined();
            expect(invitations[0].user.updatedAt).toBeUndefined();
            expect(invitations[0].user.updatedEmailTokenVersion).toBeUndefined();
            expect(invitations[0].userId).toBeUndefined();
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
            } = await getGaleriesIdInvitations(app, token, galerieId, 2);
            expect(firstPack.length).toBe(20);
            expect(secondPack.length).toBe(1);
          });
          it('return user\'s profile picture', async () => {
            await postGaleriesIdInvitations(app, token, galerieId, {});
            await postProfilePicture(app, token);
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
          it('return invitation.user === null if user is black listed', async () => {
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
            await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
            await postGaleriesIdInvitations(app, tokenTwo, galerieId, {});
            await postBlackListUser(app, token, userTwo.id, {
              reason: 'black list reason',
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
            expect(body.errors).toBe('galerie not found');
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
              body: {
                data: {
                  galerie: {
                    id,
                  },
                },
              },
            } = await postGalerie(app, tokenTwo, {
              name: 'galeries\'name',
            });
            const {
              body,
              status,
            } = await getGaleriesIdInvitations(app, token, id);
            expect(body.errors).toBe('galerie not found');
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
