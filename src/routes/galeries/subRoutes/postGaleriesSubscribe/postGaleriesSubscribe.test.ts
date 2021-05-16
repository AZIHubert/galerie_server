import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Galerie,
  GalerieUser,
  Invitation,
  User,
} from '@src/db/models';

import {
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  login,
  postGalerie,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/galeries', () => {
  let app: Server;
  let galerieId: string;
  let sequelize: Sequelize;
  let token: string;
  let tokenTwo: string;
  let user: User;
  let userTwo: User;

  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });

  beforeEach(async (done) => {
    try {
      await cleanGoogleBuckets();
      await sequelize.sync({ force: true });
      user = await createUser({});
      userTwo = await createUser({
        email: 'user2@email.com',
        userName: 'user2',
      });
      const { body } = await login(app, user.email, userPassword);
      token = body.token;
      const {
        body: bodyTwo,
      } = await login(app, userTwo.email, userPassword);
      tokenTwo = bodyTwo.token;
      const {
        body: {
          data: {
            galerie: {
              id,
            },
          },
        },
      } = await postGalerie(app, tokenTwo, {
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

  describe('/subscribe', () => {
    describe('should return status 200 and', () => {
      it('create galerieUser', async () => {
        const {
          body: {
            data: {
              invitation: {
                code,
              },
            },
          },
        } = await postGaleriesIdInvitations(app, tokenTwo, galerieId, {});
        const {
          body: {
            action,
            data: {
              galerieId: returnedGalerieId,
            },
          },
          status,
        } = await postGaleriesSubscribe(app, token, {
          code,
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
        const {
          body: {
            data: {
              invitation: {
                code,
              },
            },
          },
        } = await postGaleriesIdInvitations(app, tokenTwo, galerieId, {});
        const {
          status,
        } = await postGaleriesSubscribe(app, token, {
          code: ` ${code} `,
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
        const {
          body: {
            data: {
              invitation: {
                code,
              },
            },
          },
        } = await postGaleriesIdInvitations(app, tokenTwo, galerieId, {});
        const {
          status,
        } = await postGaleriesSubscribe(app, token, {
          code: code.toUpperCase(),
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
      it('decrement numOfInvit if it\'s not a null field', async () => {
        const {
          body: {
            data: {
              invitation: {
                code,
                id,
                numOfInvit,
              },
            },
          },
        } = await postGaleriesIdInvitations(app, tokenTwo, galerieId, {
          numOfInvit: 2,
        });
        await postGaleriesSubscribe(app, token, {
          code,
        });
        const invitation = await Invitation.findByPk(id) as Invitation;
        expect(invitation.numOfInvit).toBe(numOfInvit - 1);
      });
      it('delete invitation if numOfInvit < 1', async () => {
        const {
          body: {
            data: {
              invitation: {
                code,
                id,
              },
            },
          },
        } = await postGaleriesIdInvitations(app, tokenTwo, galerieId, {
          numOfInvit: 1,
        });
        await postGaleriesSubscribe(app, token, {
          code,
        });
        const invitation = await Invitation.findByPk(id);
        expect(invitation).toBeNull();
      });
    });
    describe('should return error 400 if', () => {
      it('current user is already subscribe to this galerie', async () => {
        const {
          body: {
            data: {
              invitation: {
                code,
              },
            },
          },
        } = await postGaleriesIdInvitations(app, tokenTwo, galerieId, {});
        await postGaleriesSubscribe(app, token, {
          code,
        });
        const {
          body,
          status,
        } = await postGaleriesSubscribe(app, token, {
          code,
        });
        expect(body.errors).toBe('you are already subscribe to this galerie');
        expect(status).toBe(400);
      });
      it('galerie is archived', async () => {
        const {
          body: {
            data: {
              invitation: {
                code,
              },
            },
          },
        } = await postGaleriesIdInvitations(app, tokenTwo, galerieId, {});
        await Galerie.update({
          archived: true,
        }, {
          where: {
            id: galerieId,
          },
        });
        const {
          body,
          status,
        } = await postGaleriesSubscribe(app, token, {
          code,
        });
        expect(body.errors).toBe('this invitation is not valid');
        expect(status).toBe(400);
      });
      describe('code', () => {
        it('is not a send', async () => {
          const {
            body,
            status,
          } = await postGaleriesSubscribe(app, token, {});
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
            code: 1234,
          });
          expect(body.errors).toEqual({
            code: FIELD_NOT_A_STRING,
          });
          expect(status).toBe(400);
        });
        it('is an empty string', async () => {
          const {
            body,
            status,
          } = await postGaleriesSubscribe(app, token, {
            code: '',
          });
          expect(body.errors).toEqual({
            code: FIELD_IS_EMPTY,
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
          code: 'wrong code',
        });
        expect(body.errors).toBe('invitation not found');
        expect(status).toBe(404);
      });
    });
  });
});
