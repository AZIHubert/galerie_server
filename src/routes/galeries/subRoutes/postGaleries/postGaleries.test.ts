import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '#src/helpers/initEnv';

import {
  Galerie,
  User,
} from '#src/db/models';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createGalerie,
  createUser,
  postGaleries,
  testGalerie,
} from '#src/helpers/test';

import initApp from '#src/server';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
} from '#src/helpers/errorMessages';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galerie', () => {
  describe('POST', () => {
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
      it('create a galerie', async () => {
        const name = 'galeries\'s name';
        const {
          body: {
            action,
            data: {
              galerie: returnedGalerie,
            },
          },
          status,
        } = await postGaleries(app, token, {
          body: {
            name,
          },
        });
        const galerie = await Galerie.findByPk(returnedGalerie.id);
        expect(action).toBe('POST');
        expect(galerie).not.toBeNull();
        expect(returnedGalerie.hiddenName).toBe(`${name}-0`);
        expect(status).toBe(200);
        testGalerie(returnedGalerie);
      });
      it('create a galerie with a unque hiddenName', async () => {
        const { name } = await createGalerie({
          name: 'galerie',
          userId: user.id,
        });
        const {
          body: {
            data: {
              galerie: galerieOne,
            },
          },
        } = await postGaleries(app, token, {
          body: { name },
        });
        const {
          body: {
            data: {
              galerie: galerieTwo,
            },
          },
        } = await postGaleries(app, token, {
          body: { name },
        });
        const {
          body: {
            data: {
              galerie: galerieThree,
            },
          },
        } = await postGaleries(app, token, {
          body: { name },
        });
        const {
          body: {
            data: {
              galerie: galerieFour,
            },
          },
        } = await postGaleries(app, token, {
          body: {
            name: `${name}a`,
          },
        });
        expect(galerieOne.hiddenName).toBe(`${name}-1`);
        expect(galerieTwo.hiddenName).toBe(`${name}-2`);
        expect(galerieThree.hiddenName).toBe(`${name}-3`);
        expect(galerieFour.hiddenName).toBe(`${name}a-0`);
      });
      it('create galerie with descrition', async () => {
        const description = 'galerie\'s description';
        const {
          body: {
            data: {
              galerie,
            },
          },
        } = await postGaleries(app, token, {
          body: {
            name: 'galerie\'s name',
            description,
          },
        });
        expect(galerie.description).toBe(description);
      });
      it('create a galerie with an empty description', async () => {
        const description = '';
        const {
          body: {
            data: {
              galerie,
            },
          },
        } = await postGaleries(app, token, {
          body: {
            name: 'galerie\'s name',
            description,
          },
        });
        expect(galerie.description).toBe(description);
      });
      it('trim request.body', async () => {
        const name = 'galeries\'s name';
        const description = 'galerie\'s description';
        const {
          body: {
            data: {
              galerie,
            },
          },
        } = await postGaleries(app, token, {
          body: {
            description: ` ${description} `,
            name: ` ${name} `,
          },
        });
        expect(galerie.description).toBe(description);
        expect(galerie.name).toBe(name);
      });
    });
    describe('should return status 400 if', () => {
      describe('description', () => {
        it('is not a string', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token, {
            body: {
              description: 1234,
              name: 'galerie\'s name',
            },
          });
          expect(body.errors).toEqual({
            description: FIELD_SHOULD_BE_A_STRING,
          });
          expect(status).toBe(400);
        });
        it('has more than 200 characters', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token, {
            body: {
              description: 'a'.repeat(201),
              name: 'galerie\'s name',
            },
          });
          expect(body.errors).toEqual({
            description: FIELD_MAX_LENGTH(200),
          });
          expect(status).toBe(400);
        });
      });
      describe('name', () => {
        it('is not send', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token);
          expect(body.errors).toEqual({
            name: FIELD_IS_REQUIRED,
          });
          expect(status).toBe(400);
        });
        it('is an empty string', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token, {
            body: {
              name: '',
            },
          });
          expect(body.errors).toEqual({
            name: FIELD_CANNOT_BE_EMPTY,
          });
          expect(status).toBe(400);
        });
        it('is not a string', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token, {
            body: {
              name: 1234,
            },
          });
          expect(body.errors).toEqual({
            name: FIELD_SHOULD_BE_A_STRING,
          });
          expect(status).toBe(400);
        });
        it('is less than 3 characters', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token, {
            body: {
              name: 'a'.repeat(2),
            },
          });
          expect(body.errors).toEqual({
            name: FIELD_MIN_LENGTH(3),
          });
          expect(status).toBe(400);
        });
        it('is more than 30 characters', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token, {
            body: {
              name: 'a'.repeat(31),
            },
          });
          expect(body.errors).toEqual({
            name: FIELD_MAX_LENGTH(30),
          });
          expect(status).toBe(400);
        });
      });
    });
  });
});
