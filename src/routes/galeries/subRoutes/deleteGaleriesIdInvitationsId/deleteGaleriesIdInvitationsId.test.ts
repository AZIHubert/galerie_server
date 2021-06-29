import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  Invitation,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createGalerie,
  createGalerieUser,
  createInvitation,
  createUser,
  deleteGaleriesIdInvitationId,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/invations', () => {
      describe('/:invitationId', () => {
        describe('DELETE', () => {
          beforeAll(() => {
            sequelize = initSequelize();
            app = initApp();
          });

          beforeEach(async (done) => {
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
            it('destroy invitation', async () => {
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: user.id,
              });
              const {
                body: {
                  action,
                  data: {
                    galerieId: returnedGalerieId,
                    invitationId: returnedInvitationId,
                  },
                },
                status,
              } = await deleteGaleriesIdInvitationId(app, token, galerieId, invitationId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(action).toBe('DELETE');
              expect(invitation).toBeNull();
              expect(returnedGalerieId).toBe(galerieId);
              expect(returnedInvitationId).toBe(invitationId);
              expect(status).toBe(200);
            });
            it('destroy the invitation if current user role for this galerie is \'admin\'', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              await createGalerieUser({
                galerieId,
                role: 'admin',
                userId: userTwo.id,
              });
              await createGalerieUser({
                galerieId,
                role: 'admin',
                userId: userThree.id,
              });
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: userTwo.id,
              });
              const {
                status,
              } = await deleteGaleriesIdInvitationId(app, token, galerieId, invitationId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(invitation).toBeNull();
              expect(status).toBe(200);
            });
          });
          describe('should return status 400 if', () => {
            it('req.params.galerieId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, token, '100', uuidv4());
              expect(body.errors).toBe(INVALID_UUID('galerie'));
              expect(status).toBe(400);
            });
            it('req.params.invitationId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, token, uuidv4(), '100');
              expect(body.errors).toBe(INVALID_UUID('invitation'));
              expect(status).toBe(400);
            });
            it('user\'s role is \'user\' for this galerie', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              const {
                id: invitationId,
              } = await createInvitation({
                galerieId,
                userId: user.id,
              });
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, tokenTwo, galerieId, invitationId);
              expect(body.errors).toBe('you\'re not allow to delete this invitation');
              expect(status).toBe(400);
            });
            it('creator of this invitation is the creator of this galerie', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                role: 'admin',
                userId: userTwo.id,
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: user.id,
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, tokenTwo, galerieId, invitationId);
              expect(body.errors).toBe('you\'re not allow to delete this invitation');
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('galerie not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, token, uuidv4(), uuidv4());
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
              const galerie = await createGalerie({
                name: 'galerie2',
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, token, galerie.id, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('invitation not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, token, galerieId, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
              expect(status).toBe(404);
            });
            it('invitation exist but does not belong to this galerie', async () => {
              const galerie = await createGalerie({
                name: 'galerie2',
                userId: user.id,
              });
              const { id: invitationId } = await createInvitation({
                galerieId: galerie.id,
                userId: user.id,
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, token, galerieId, invitationId);
              expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
