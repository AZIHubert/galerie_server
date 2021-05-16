import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  deleteTicketId,
  postTicket,
  login,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

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
      user = await createUser({});
      const admin = await createUser({
        email: 'user2@email.com',
        userName: 'user2',
        role: 'superAdmin',
      });
      const { body } = await login(app, user.email, userPassword);
      const { body: adminLoginBody } = await login(app, admin.email, userPassword);
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
          const {
            body: {
              data: {
                ticket,
              },
            },
          } = await postTicket(app, token, {
            body: 'ticket\'s body',
            header: 'ticket\'s header',
          });
          const {
            body: {
              action,
              data: {
                ticketId,
              },
            },
            status,
          } = await deleteTicketId(app, adminToken, ticket.id);
          expect(action).toBe('DELETE');
          expect(ticketId).toEqual(ticket.id);
          expect(status).toBe(200);
        });
      });
      describe('should return status 404 if', () => {
        it('token :id doesn\'t exist', async () => {
          const {
            body,
            status,
          } = await deleteTicketId(app, adminToken, '100');
          expect(body.errors).toBe('ticket not found');
          expect(status).toBe(404);
        });
      });
    });
  });
});
