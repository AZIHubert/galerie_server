import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Ticket,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  deleteTicketsId,
  postTickets,
  postUsersLogin,
} from '@src/helpers/test';

import initApp from '@src/server';

describe('/tickets', () => {
  let adminToken: string;
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
      const {
        password,
        user: createdUser,
      } = await createUser({});
      const {
        password: passwordTwo,
        user: admin,
      } = await createUser({
        email: 'user2@email.com',
        userName: 'user2',
        role: 'superAdmin',
      });

      user = createdUser;

      const { body } = await postUsersLogin(app, {
        body: {
          password,
          userNameOrEmail: user.email,
        },
      });
      const { body: adminLoginBody } = await postUsersLogin(app, {
        body: {
          password: passwordTwo,
          userNameOrEmail: admin.email,
        },
      });
      token = body.token;
      adminToken = adminLoginBody.token;
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

  describe('/:ticketId', () => {
    describe('DELETE', () => {
      describe('should return status 200 and', () => {
        it('delete ticket', async () => {
          await postTickets(app, token, {
            body: {
              body: 'ticket\'s body',
              header: 'ticket\'s header',
            },
          });
          const [ticket] = await Ticket.findAll();
          const {
            body: {
              action,
              data: {
                ticketId,
              },
            },
            status,
          } = await deleteTicketsId(app, adminToken, ticket.id);
          expect(action).toBe('DELETE');
          expect(ticketId).toEqual(ticket.id);
          expect(status).toBe(200);
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.ticketId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await deleteTicketsId(app, adminToken, '100');
          expect(body.errors).toBe(INVALID_UUID('ticket'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('token :id doesn\'t exist', async () => {
          const {
            body,
            status,
          } = await deleteTicketsId(app, adminToken, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('ticket'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
