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
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  createUser,
  createTicket,
  deleteTicketsId,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/tickets', () => {
  describe('/:ticketId', () => {
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
          } = await createUser({});
          const {
            user: admin,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
            role: 'superAdmin',
          });
          user = createdUser;
          const jwt = signAuthToken(admin);
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
        it('delete ticket', async () => {
          const ticket = await createTicket({
            userId: user.id,
          });
          const {
            body: {
              action,
              data: {
                ticketId,
              },
            },
            status,
          } = await deleteTicketsId(app, token, ticket.id);
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
          } = await deleteTicketsId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('ticket'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('ticket doesn\'t exist', async () => {
          const {
            body,
            status,
          } = await deleteTicketsId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('ticket'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
