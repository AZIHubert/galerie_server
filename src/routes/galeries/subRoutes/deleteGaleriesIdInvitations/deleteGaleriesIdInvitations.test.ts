import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Invitation,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  createGalerie,
  createInvitation,
  createUser,
  deleteGaleriesIdInvitations,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/invitations', () => {
      describe('DELETE', () => {
        beforeAll(() => {
          sequelize = initSequelize();
          app = initApp();
        });

        beforeEach(async (done) => {
          mockDate.reset();
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
          try {
            await sequelize.sync({ force: true });
            await sequelize.close();
          } catch (err) {
            done(err);
          }
          app.close();
          done();
        });

        describe('should return 204 and', () => {
          it('destroy all expired invitations', async () => {
            const timeStamp = 1434319925275;
            const time = 1000 * 60 * 10;
            mockDate.set(timeStamp);
            await createInvitation({
              galerieId,
              time,
              userId: user.id,
            });
            await createInvitation({
              galerieId,
              time,
              userId: user.id,
            });
            mockDate.set(timeStamp + time + 1);
            const {
              status,
            } = await deleteGaleriesIdInvitations(app, token, galerieId);
            const invitations = await Invitation.findAll({
              where: {
                galerieId,
              },
            });
            expect(invitations.length).toBe(0);
            expect(status).toBe(204);
          });
          it('destoy all invitations where numOfInvits < 1', async () => {
            await createInvitation({
              galerieId,
              numOfInvits: 0,
              userId: user.id,
            });
            await createInvitation({
              galerieId,
              numOfInvits: 0,
              userId: user.id,
            });
            await deleteGaleriesIdInvitations(app, token, galerieId);
            const invitations = await Invitation.findAll({
              where: {
                galerieId,
              },
            });
            expect(invitations.length).toBe(0);
          });
          it('do not destoy invitations from other galeries even if there are supposed to be deleted', async () => {
            const galerieTwo = await createGalerie({
              name: 'galerie2',
              userId: user.id,
            });
            const { id: invitationId } = await createInvitation({
              galerieId: galerieTwo.id,
              numOfInvits: 0,
              userId: user.id,
            });
            await deleteGaleriesIdInvitations(app, token, galerieId);
            const invitation = await Invitation.findByPk(invitationId);
            expect(invitation).not.toBeNull();
          });
          describe('do not destroy invitations if numOfInvit > 0', () => {
            it('and time = null', async () => {
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: user.id,
              });
              await deleteGaleriesIdInvitations(app, token, galerieId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(invitation).not.toBeNull();
            });
            it('and time < date.now()', async () => {
              const timeStamp = 1434319925275;
              const time = 1000 * 60 * 10;
              mockDate.set(timeStamp);
              const { id: invitationId } = await createInvitation({
                galerieId,
                time,
                userId: user.id,
              });
              await deleteGaleriesIdInvitations(app, token, galerieId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(invitation).not.toBeNull();
            });
          });
        });
      });
    });
  });
});
