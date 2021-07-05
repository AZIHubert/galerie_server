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
  deleteInvitationId,
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
                role: 'admin',
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
            it('destroy invitation if currentUser is the creator of this invitation', async () => {
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
              } = await deleteInvitationId(app, token, invitationId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(action).toBe('DELETE');
              expect(invitation).toBeNull();
              expect(returnedGalerieId).toBe(galerieId);
              expect(returnedInvitationId).toBe(invitationId);
              expect(status).toBe(200);
            });
            it('destroy invitation if currentUser\'s role for this galerie is admin', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: userTwo.id,
              });
              const {
                status,
              } = await deleteInvitationId(app, token, invitationId);
              expect(status).toBe(200);
              const invitation = await Invitation.findByPk(invitationId);
              expect(invitation).toBeNull();
            });
          });
          describe('should return status 400 if', () => {
            it('req.params.invitationId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await deleteInvitationId(app, token, '100');
              expect(body.errors).toBe(INVALID_UUID('invitation'));
              expect(status).toBe(400);
            });
            it('currentUser\'s role for this galerie is \'user\'', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
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
              } = await deleteInvitationId(app, tokenTwo, invitationId);
              expect(body.errors).toBe('you\'re not allow to delete this invitation');
              expect(status).toBe(400);
            });
            it('currentUser\'s role for this galerie is \'moderator\'', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                role: 'moderator',
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
              } = await deleteInvitationId(app, tokenTwo, invitationId);
              expect(body.errors).toBe('you\'re not allow to delete this invitation');
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('invitation not found', async () => {
              const {
                body,
                status,
              } = await deleteInvitationId(app, token, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
              expect(status).toBe(404);
            });
            it('currentUser is not subscribe to the galerie where the invitation was posted', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const galerieTwo = await createGalerie({
                userId: userTwo.id,
              });
              const { id: invitationId } = await createInvitation({
                galerieId: galerieTwo.id,
                userId: user.id,
              });
              const {
                body,
                status,
              } = await deleteInvitationId(app, token, invitationId);
              expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
