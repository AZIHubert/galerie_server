import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  BlackList,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  deleteBlackListsId,
  login,
  postBlackListUser,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/blackLists', () => {
  let app: Server;
  let sequelize: Sequelize;
  let token: string;
  let user: User;

  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });

  beforeEach(async (done) => {
    try {
      await sequelize.sync({ force: true });
      user = await createUser({
        role: 'superAdmin',
      });

      const { body } = await login(app, user.email, userPassword);
      token = body.token;
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

  describe('/:blackListId', () => {
    describe('DELETE', () => {
      describe('should return status 200 and', () => {
        it('delete blackList', async () => {
          const userTwo = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              data: {
                blackList: {
                  id: blackListId,
                },
              },
            },
          } = await postBlackListUser(app, token, userTwo.id, {
            reason: 'black list reason',
          });
          const {
            body: {
              action,
              data: {
                blackListId: returnedBlackListId,
              },
            },
            status,
          } = await deleteBlackListsId(app, token, blackListId);
          const blackList = await BlackList.findByPk(blackListId);
          expect(action).toBe('DELETE');
          expect(blackList).toBeNull();
          expect(returnedBlackListId).toBe(blackListId);
          expect(status).toBe(200);
        });
      });
      describe('should return status 400 if', () => {
        it('req.params.blackListId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await deleteBlackListsId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('black list'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('black list doesn\'t exist', async () => {
          const {
            body,
            status,
          } = await deleteBlackListsId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('black list'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
