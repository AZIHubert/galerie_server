import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  GalerieUser,
  Invitation,
  User,
} from '@src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  createGalerie,
  createGalerieBlackList,
  createGalerieUser,
  createInvitation,
  createUser,
  postGaleriesSubscribe,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;
let userTwo: User;

describe('/galeries', () => {
  describe('/subscribe', () => {
    describe('POST', () => {
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
          const {
            user: createdUserTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          user = createdUser;
          userTwo = createdUserTwo;
          const jwt = signAuthToken(user);
          token = jwt.token;
          const galerie = await createGalerie({
            userId: userTwo.id,
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
      describe('should return status 200 and', () => {
        it('create galerieUser', async () => {
          const { code } = await createInvitation({
            galerieId,
            userId: userTwo.id,
          });
          const {
            body: {
              action,
              data: {
                galerieId: returnedGalerieId,
              },
            },
            status,
          } = await postGaleriesSubscribe(app, token, {
            body: {
              code,
            },
          });
          const galerieUser = await GalerieUser.findOne({
            where: {
              userId: user.id,
              galerieId,
            },
          });
          expect(action).toBe('POST');
          expect(galerieUser).not.toBeNull();
          expect(returnedGalerieId).toBe(galerieId);
          expect(status).toBe(200);
        });
        it('trim req.body.code', async () => {
          const { code } = await createInvitation({
            galerieId,
            userId: userTwo.id,
          });
          const {
            status,
          } = await postGaleriesSubscribe(app, token, {
            body: {
              code: ` ${code} `,
            },
          });
          expect(status).toBe(200);
          const galerieUser = await GalerieUser.findOne({
            where: {
              userId: user.id,
              galerieId,
            },
          });
          expect(galerieUser).not.toBeNull();
        });
        it('set req.body.code to lower case', async () => {
          const { code } = await createInvitation({
            galerieId,
            userId: userTwo.id,
          });
          const {
            status,
          } = await postGaleriesSubscribe(app, token, {
            body: {
              code: code.toUpperCase(),
            },
          });
          expect(status).toBe(200);
          const galerieUser = await GalerieUser.findOne({
            where: {
              userId: user.id,
              galerieId,
            },
          });
          expect(galerieUser).not.toBeNull();
        });
        it('decrement numOfInvits if it\'s not a null field', async () => {
          const numOfInvits = 2;
          const invitation = await createInvitation({
            galerieId,
            numOfInvits,
            userId: userTwo.id,
          });
          await postGaleriesSubscribe(app, token, {
            body: {
              code: invitation.code,
            },
          });
          await invitation.reload();
          expect(invitation.numOfInvits).toBe(numOfInvits - 1);
        });
        it('delete invitation if numOfInvits < 1', async () => {
          const {
            code,
            id: invitationId,
          } = await createInvitation({
            galerieId,
            numOfInvits: 1,
            userId: userTwo.id,
          });
          await postGaleriesSubscribe(app, token, {
            body: {
              code,
            },
          });
          const invitation = await Invitation.findByPk(invitationId);
          expect(invitation).toBeNull();
        });
        it('subscribe if invitation.time !== null and and not expired', async () => {
          const timeStamp = 1434319925275;
          const time = 1000 * 60 * 10;
          mockDate.set(timeStamp);
          const {
            code,
          } = await createInvitation({
            galerieId,
            time,
            userId: userTwo.id,
          });
          const { status } = await postGaleriesSubscribe(app, token, {
            body: {
              code,
            },
          });
          expect(status).toBe(200);
        });
        it('subscribe to this galerie even if current user is black listed from other galeries', async () => {
          const galerieTwo = await createGalerie({
            userId: userTwo.id,
          });
          await createGalerieBlackList({
            createdById: userTwo.id,
            galerieId: galerieTwo.id,
            userId: user.id,
          });
          const {
            code,
          } = await createInvitation({
            galerieId,
            userId: userTwo.id,
          });
          const {
            status,
          } = await postGaleriesSubscribe(app, token, {
            body: {
              code,
            },
          });
          const galerieUser = await GalerieUser.findOne({
            where: {
              galerieId,
              userId: user.id,
            },
          });
          expect(status).toBe(200);
          expect(galerieUser).not.toBeNull();
        });
      });
      describe('should return error 400 if', () => {
        it('invitation.numOfInvits < 1', async () => {
          const {
            code,
            id: invitationId,
          } = await createInvitation({
            galerieId,
            numOfInvits: 0,
            userId: userTwo.id,
          });
          const {
            body,
            status,
          } = await postGaleriesSubscribe(app, token, {
            body: {
              code,
            },
          });
          const invitation = await Invitation.findByPk(invitationId);
          expect(body.errors).toBe('this invitation is not valid');
          expect(invitation).toBeNull();
          expect(status).toBe(400);
        });
        it('invitation is expired', async () => {
          const timeStamp = 1434319925275;
          const time = 1000 * 60 * 10;
          mockDate.set(timeStamp);
          const {
            code,
            id: invitationId,
          } = await createInvitation({
            galerieId,
            time,
            userId: userTwo.id,
          });
          mockDate.set(timeStamp + time + 1);
          const {
            body,
            status,
          } = await postGaleriesSubscribe(app, token, {
            body: {
              code,
            },
          });
          const invitation = await Invitation.findByPk(invitationId);
          expect(body.errors).toBe('this invitation is not valid');
          expect(invitation).toBeNull();
          expect(status).toBe(400);
        });
        it('current user is already subscribe to this galerie', async () => {
          await createGalerieUser({
            galerieId,
            userId: user.id,
          });
          const { code } = await createInvitation({
            galerieId,
            userId: userTwo.id,
          });
          const {
            body,
            status,
          } = await postGaleriesSubscribe(app, token, {
            body: {
              code,
            },
          });
          expect(body.errors).toBe('you are already subscribe to this galerie');
          expect(status).toBe(400);
        });
        it('galerie is archived', async () => {
          const galerieTwo = await createGalerie({
            archived: true,
            userId: userTwo.id,
          });
          const { code } = await createInvitation({
            galerieId: galerieTwo.id,
            userId: userTwo.id,
          });
          const {
            body,
            status,
          } = await postGaleriesSubscribe(app, token, {
            body: {
              code,
            },
          });
          expect(body.errors).toBe('this invitation is not valid');
          expect(status).toBe(400);
        });
        describe('code', () => {
          it('is not a send', async () => {
            const {
              body,
              status,
            } = await postGaleriesSubscribe(app, token);
            expect(body.errors).toEqual({
              code: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const {
              body,
              status,
            } = await postGaleriesSubscribe(app, token, {
              body: {
                code: 1234,
              },
            });
            expect(body.errors).toEqual({
              code: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const {
              body,
              status,
            } = await postGaleriesSubscribe(app, token, {
              body: {
                code: '',
              },
            });
            expect(body.errors).toEqual({
              code: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
        });
      });
      describe('should return error 404 if', () => {
        it('invitation not found', async () => {
          const {
            body,
            status,
          } = await postGaleriesSubscribe(app, token, {
            body: {
              code: 'wrong code',
            },
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
          expect(status).toBe(404);
        });
        it('user is black listed from this galerie', async () => {
          const { code } = await createInvitation({
            galerieId,
            userId: userTwo.id,
          });
          await createGalerieBlackList({
            createdById: userTwo.id,
            galerieId,
            userId: user.id,
          });
          const {
            body,
            status,
          } = await postGaleriesSubscribe(app, token, {
            body: {
              code,
            },
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
