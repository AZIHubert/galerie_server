import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { FIELD_NOT_A_NUMBER } from '@src/helpers/errorMessages';
import {
  Invitation,
  User,
} from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteUser,
  login,
  postGalerie,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  postProfilePicture,
  putGaleriesIdUsersId,
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
      user = await createUser({});
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

  describe('/:galerieId', () => {
    describe('/invitations', () => {
      describe('POST', () => {
        describe('Should return status 200 and', () => {
          it('create an invit with time/numOfInvit === null', async () => {
            const {
              body: {
                action,
                data: {
                  galerieId: returnedGalerieId,
                  invitation: returnedInvitation,
                },
              },
              status,
            } = await postGaleriesIdInvitations(app, token, galerieId, {});
            const createdInvitation = await Invitation.findByPk(returnedInvitation.id);
            expect(action).toBe('POST');
            expect(createdInvitation).not.toBeNull();
            expect(returnedInvitation.code).not.toBeUndefined();
            expect(returnedInvitation.createdAt).not.toBeUndefined();
            expect(returnedInvitation.galerieId).toBeUndefined();
            expect(returnedInvitation.id).not.toBeUndefined();
            expect(returnedInvitation.numOfInvit).toBeNull();
            expect(returnedInvitation.time).toBeNull();
            expect(returnedInvitation.updatedAt).toBeUndefined();
            expect(returnedInvitation.user.authTokenVersion).toBeUndefined();
            expect(returnedInvitation.user.confirmed).toBeUndefined();
            expect(returnedInvitation.user.confirmTokenVersion).toBeUndefined();
            expect(returnedInvitation.user.createdAt).not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture).not.toBeUndefined();
            expect(returnedInvitation.user.defaultProfilePicture).not.toBeUndefined();
            expect(returnedInvitation.user.email).toBeUndefined();
            expect(returnedInvitation.user.emailTokenVersion).toBeUndefined();
            expect(returnedInvitation.user.facebookId).toBeUndefined();
            expect(returnedInvitation.user.googleId).toBeUndefined();
            expect(returnedInvitation.user.id).not.toBeUndefined();
            expect(returnedInvitation.user.password).toBeUndefined();
            expect(returnedInvitation.user.pseudonym).not.toBeUndefined();
            expect(returnedInvitation.user.resetPasswordTokenVersion).toBeUndefined();
            expect(returnedInvitation.user.role).not.toBeUndefined();
            expect(returnedInvitation.user.socialMediaUserName).not.toBeUndefined();
            expect(returnedInvitation.user.updatedAt).toBeUndefined();
            expect(returnedInvitation.user.updatedEmailTokenVersion).toBeUndefined();
            expect(returnedInvitation.user.userName).not.toBeUndefined();
            expect(returnedInvitation.userId).toBeUndefined();
            expect(returnedGalerieId).toBe(galerieId);
            expect(status).toBe(200);
          });
          it('create an invit with time === null', async () => {
            const numOfInvit = 1;
            const {
              body: {
                data: {
                  invitation,
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId, {
              numOfInvit,
            });
            expect(invitation.numOfInvit).toBe(numOfInvit);
            expect(invitation.time).toBeNull();
          });
          it('create an invit with numOfTime === null', async () => {
            const time = 1000 * 60 * 5;
            const {
              body: {
                data: {
                  invitation,
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId, {
              time,
            });
            expect(invitation.numOfInvit).toBeNull();
            expect(invitation.time).toBe(time);
          });
          it('create an invit with time/numOfTime', async () => {
            const numOfInvit = 1;
            const time = 1000 * 60 * 5;
            const {
              body: {
                data: {
                  invitation,
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId, {
              numOfInvit,
              time,
            });
            expect(invitation.numOfInvit).toBe(numOfInvit);
            expect(invitation.time).toBe(time);
          });
          it('should incude profile picture', async () => {
            await postProfilePicture(app, token);
            const {
              body: {
                data: {
                  invitation: {
                    user: {
                      currentProfilePicture,
                    },
                  },
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId, {});
            expect(currentProfilePicture.createdAt).not.toBeUndefined();
            expect(currentProfilePicture.cropedImageId).toBeUndefined();
            expect(currentProfilePicture.cropedImage.bucketName).toBeUndefined();
            expect(currentProfilePicture.cropedImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.cropedImage.fileName).toBeUndefined();
            expect(currentProfilePicture.cropedImage.format).not.toBeUndefined();
            expect(currentProfilePicture.cropedImage.height).not.toBeUndefined();
            expect(currentProfilePicture.cropedImage.id).toBeUndefined();
            expect(currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
            expect(currentProfilePicture.cropedImage.size).not.toBeUndefined();
            expect(currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
            expect(currentProfilePicture.cropedImage.width).not.toBeUndefined();
            expect(currentProfilePicture.current).toBeUndefined();
            expect(currentProfilePicture.originalImageId).toBeUndefined();
            expect(currentProfilePicture.originalImage.bucketName).toBeUndefined();
            expect(currentProfilePicture.originalImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.originalImage.fileName).toBeUndefined();
            expect(currentProfilePicture.originalImage.format).not.toBeUndefined();
            expect(currentProfilePicture.originalImage.height).not.toBeUndefined();
            expect(currentProfilePicture.originalImage.id).toBeUndefined();
            expect(currentProfilePicture.originalImage.signedUrl).not.toBeUndefined();
            expect(currentProfilePicture.originalImage.size).not.toBeUndefined();
            expect(currentProfilePicture.originalImage.updatedAt).toBeUndefined();
            expect(currentProfilePicture.originalImage.width).not.toBeUndefined();
            expect(currentProfilePicture.id).not.toBeUndefined();
            expect(currentProfilePicture.pendingImageId).toBeUndefined();
            expect(currentProfilePicture.pendingImage.bucketName).toBeUndefined();
            expect(currentProfilePicture.pendingImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.pendingImage.fileName).toBeUndefined();
            expect(currentProfilePicture.pendingImage.format).not.toBeUndefined();
            expect(currentProfilePicture.pendingImage.height).not.toBeUndefined();
            expect(currentProfilePicture.pendingImage.id).toBeUndefined();
            expect(currentProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
            expect(currentProfilePicture.pendingImage.size).not.toBeUndefined();
            expect(currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
            expect(currentProfilePicture.pendingImage.width).not.toBeUndefined();
            expect(currentProfilePicture.updatedAt).toBeUndefined();
            expect(currentProfilePicture.userId).toBeUndefined();
          });
        });
        describe('Should return status 400 if', () => {
          it('user\'s role is \'user\'', async () => {
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
            } = await postGaleriesIdInvitations(app, tokenTwo, galerieId, {});
            expect(body.errors).toBe('you\'re not allow to create an invitation');
            expect(status).toBe(400);
          });
          it('galerie is archived', async () => {
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
            await deleteUser(app, token, {
              deleteAccountSentence: 'delete my account',
              password: userPassword,
              userNameOrEmail: user.email,
            });
            const {
              body,
              status,
            } = await postGaleriesIdInvitations(app, tokenTwo, galerieId, {});
            expect(body.errors).toBe('you cannot post invitation on an archived galerie');
            expect(status).toBe(400);
          });
          describe('numOfInvit', () => {
            it('is not a number', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                numOfInvit: 'wrong field',
              });
              expect(body.errors).toEqual({
                numOfInvit: FIELD_NOT_A_NUMBER,
              });
              expect(status).toBe(400);
            });
            it('is less than 1', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                numOfInvit: 0,
              });
              expect(body.errors).toEqual({
                numOfInvit: 'should be at least 1',
              });
              expect(status).toBe(400);
            });
            it('is more than 200', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                numOfInvit: 201,
              });
              expect(body.errors).toEqual({
                numOfInvit: 'should be at most 200',
              });
              expect(status).toBe(400);
            });
          });
          describe('time', () => {
            it('is not a number', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                time: 'wrong field',
              });
              expect(body.errors).toEqual({
                time: FIELD_NOT_A_NUMBER,
              });
              expect(status).toBe(400);
            });
            it('is less than 5 mn (1000 * 60 * 5)', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                time: (1000 * 60 * 5) - 1,
              });
              expect(body.errors).toEqual({
                time: 'should be at least 5mn',
              });
              expect(status).toBe(400);
            });
            it('is more than 1 year (1000 * 60 * 60 * 24 * 365)', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                time: (1000 * 60 * 60 * 24 * 365) + 1,
              });
              expect(body.errors).toEqual({
                time: 'should be at most 1 year',
              });
              expect(status).toBe(400);
            });
          });
        });
        describe('Should return status 404 if', () => {
          it('galeries not found', async () => {
            const {
              body,
              status,
            } = await postGaleriesIdInvitations(app, token, '100', {});
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
              name: 'galeries\'s name',
            });
            const {
              body,
              status,
            } = await postGaleriesIdInvitations(app, token, id, {});
            expect(body.errors).toBe('galerie not found');
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
