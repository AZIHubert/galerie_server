import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  getGaleriesIdInvitationsId,
  postBlackListUserId,
  postGaleries,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  postProfilePictures,
  postUsersLogin,
  putGaleriesIdUsersId,
} from '@src/helpers/test';

import initApp from '@src/server';

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
      const {
        password,
        user: createdUser,
      } = await createUser({
        role: 'superAdmin',
      });

      user = createdUser;

      const { body } = await postUsersLogin(app, {
        body: {
          password,
          userNameOrEmail: user.email,
        },
      });
      token = body.token;
      const {
        body: {
          data: {
            galerie: {
              id,
            },
          },
        },
      } = await postGaleries(app, token, {
        body: {
          name: 'galerie\'s name',
        },
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
      describe('/:invitationId', () => {
        describe('should return status 200 and', () => {
          it('return the invitation', async () => {
            const {
              body: {
                data: {
                  invitation,
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId);
            const {
              body: {
                action,
                data: {
                  galerieId: returnedGalerieId,
                  invitation: returnedInvitation,
                },
              },
              status,
            } = await getGaleriesIdInvitationsId(app, token, galerieId, invitation.id);
            expect(action).toBe('GET');
            expect(returnedGalerieId).toBe(galerieId);
            expect(returnedInvitation.code).toBe(invitation.code);
            expect(returnedInvitation.createdAt).toBe(invitation.createdAt);
            expect(returnedInvitation.galerieId).toBeUndefined();
            expect(returnedInvitation.id).toBe(invitation.id);
            expect(returnedInvitation.numOfInvits).toBe(invitation.numOfInvits);
            expect(returnedInvitation.time).toBe(invitation.time);
            expect(returnedInvitation.updatedAt).toBeUndefined();
            expect(returnedInvitation.user.authTokenVersion).toBeUndefined();
            expect(returnedInvitation.user.confirmed).toBeUndefined();
            expect(returnedInvitation.user.confirmTokenVersion).toBeUndefined();
            expect(returnedInvitation.user.createdAt).not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture)
              .toBe(invitation.user.currentProfilePicture);
            expect(returnedInvitation.user.defaultProfilePicture)
              .toBe(invitation.user.defaultProfilePicture);
            expect(returnedInvitation.user.email).toBeUndefined();
            expect(returnedInvitation.user.emailTokenVersion).toBeUndefined();
            expect(returnedInvitation.user.facebookId).toBeUndefined();
            expect(returnedInvitation.user.googleId).toBeUndefined();
            expect(returnedInvitation.user.id).toBe(invitation.user.id);
            expect(returnedInvitation.user.password).toBeUndefined();
            expect(returnedInvitation.user.pseudonym).toBe(invitation.user.pseudonym);
            expect(returnedInvitation.user.resetPasswordTokenVersion).toBeUndefined();
            expect(returnedInvitation.user.role).toBe(invitation.user.role);
            expect(returnedInvitation.user.socialMediaUserName)
              .toBe(invitation.user.socialMediaUserName);
            expect(returnedInvitation.user.updatedAt).toBeUndefined();
            expect(returnedInvitation.user.updatedEmailTokenVersion).toBeUndefined();
            expect(returnedInvitation.user.userName).toBe(invitation.user.userName);
            expect(returnedInvitation.userId).toBeUndefined();
            expect(status).toBe(200);
          });
          it('return user\'s profile picture', async () => {
            await postProfilePictures(app, token);
            const {
              body: {
                data: {
                  invitation,
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId);
            const {
              body: {
                data: {
                  invitation: returnedInvitation,
                },
              },
            } = await getGaleriesIdInvitationsId(app, token, galerieId, invitation.id);
            expect(returnedInvitation.user.currentProfilePicture.createdAt).not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.cropedImageId).toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.cropedImage.bucketName)
              .toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.cropedImage.createdAt)
              .toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.cropedImage.fileName)
              .toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.cropedImage.format)
              .not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.cropedImage.id).toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.cropedImage.signedUrl)
              .not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.cropedImage.size)
              .not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.cropedImage.updatedAt)
              .toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.cropedImage.width)
              .not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.current).toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.id).not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.originalImageId).toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.originalImage.bucketName)
              .toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.originalImage.createdAt)
              .toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.originalImage.fileName)
              .toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.originalImage.format)
              .not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.originalImage.id).toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.originalImage.signedUrl)
              .not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.originalImage.size)
              .not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.originalImage.updatedAt)
              .toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.originalImage.width)
              .not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.pendingImageId).toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.pendingImage.bucketName)
              .toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.pendingImage.createdAt)
              .toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.pendingImage.fileName)
              .toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.pendingImage.format)
              .not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.pendingImage.id).toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.pendingImage.signedUrl)
              .not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.pendingImage.size)
              .not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.pendingImage.updatedAt)
              .toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.pendingImage.width)
              .not.toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.updatedAt).toBeUndefined();
            expect(returnedInvitation.user.currentProfilePicture.userId).toBeUndefined();
          });
          it('does not return user if he\'s black listed', async () => {
            const {
              password: passwordTwo,
              user: userTwo,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                token: tokenTwo,
              },
            } = await postUsersLogin(app, {
              body: {
                password: passwordTwo,
                userNameOrEmail: userTwo.email,
              },
            });
            const {
              body: {
                data: {
                  invitation: {
                    code,
                  },
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId);
            await postGaleriesSubscribe(app, tokenTwo, {
              body: {
                code,
              },
            });
            await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
            const {
              body: {
                data: {
                  invitation: {
                    id: invitationId,
                  },
                },
              },
            } = await postGaleriesIdInvitations(app, tokenTwo, galerieId);
            await postBlackListUserId(app, token, userTwo.id, {
              body: {
                reason: 'black list reason',
              },
            });
            const {
              body: {
                data: {
                  invitation: {
                    user: invitationUser,
                  },
                },
              },
            } = await getGaleriesIdInvitationsId(app, token, galerieId, invitationId);
            expect(invitationUser).toBeNull();
          });
        });
        describe('should return error 400 if', () => {
          it('user\'s role of this galerie is \'user\'', async () => {
            const {
              password: passwordTwo,
              user: userTwo,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                token: tokenTwo,
              },
            } = await postUsersLogin(app, {
              body: {
                password: passwordTwo,
                userNameOrEmail: userTwo.email,
              },
            });
            const {
              body: {
                data: {
                  invitation: {
                    id: invitationId,
                    code,
                  },
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId);
            await postGaleriesSubscribe(app, tokenTwo, {
              body: {
                code,
              },
            });
            const {
              body,
              status,
            } = await getGaleriesIdInvitationsId(app, tokenTwo, galerieId, invitationId);
            expect(body.errors).toBe('you\'re not allow to fetch the invitation');
            expect(status).toBe(400);
          });
        });
        describe('should return status 400', () => {
          it('request.params.galerieId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdInvitationsId(app, token, '100', uuidv4());
            expect(body.errors).toBe(INVALID_UUID('galerie'));
            expect(status).toBe(400);
          });
          it('request.params.invitationId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdInvitationsId(app, token, uuidv4(), '100');
            expect(body.errors).toBe(INVALID_UUID('invitation'));
            expect(status).toBe(400);
          });
        });
        describe('should return status 404 if', () => {
          it('galerie doesn\'t exist', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdInvitationsId(app, token, uuidv4(), uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
          it('galerie exist but user is not subscribe to it', async () => {
            const {
              password: passwordTwo,
              user: userTwo,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                token: tokenTwo,
              },
            } = await postUsersLogin(app, {
              body: {
                password: passwordTwo,
                userNameOrEmail: userTwo.email,
              },
            });
            const {
              body: {
                data: {
                  galerie: {
                    id,
                  },
                },
              },
            } = await postGaleries(app, tokenTwo, {
              body: {
                name: 'galeries\'name',
              },
            });
            const {
              body,
              status,
            } = await getGaleriesIdInvitationsId(app, token, id, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
          it('invitation doesn\'t exist', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdInvitationsId(app, token, galerieId, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
            expect(status).toBe(404);
          });
          it('invitation exist but does not belong to galerie', async () => {
            const {
              body: {
                data: {
                  galerie,
                },
              },
            } = await postGaleries(app, token, {
              body: {
                name: 'galerie\'s name',
              },
            });
            const {
              body: {
                data: {
                  invitation,
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerie.id);
            const {
              body,
              status,
            } = await getGaleriesIdInvitationsId(app, token, galerieId, invitation.id);
            expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
