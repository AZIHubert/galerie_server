import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  createProfilePicture,
  createTicket,
  createUser,
  getTicketsId,
  testProfilePicture,
  testTicket,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/tickets', () => {
  describe('/:id', () => {
    describe('GET', () => {
      beforeAll(() => {
        sequelize = initSequelize();
        app = initApp();
      });

      beforeEach(async (done) => {
        jest.clearAllMocks();
        (signedUrl as jest.Mock).mockImplementation(() => ({
          OK: true,
          signedUrl: 'signedUrl',
        }));
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
        jest.clearAllMocks();
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
        it('return a ticket', async () => {
          const createdTicket = await createTicket({
            userId: user.id,
          });
          const {
            body: {
              action,
              data: {
                ticket,
              },
            },
            status,
          } = await getTicketsId(app, token, createdTicket.id);
          expect(action).toBe('GET');
          expect(status).toBe(200);
          testTicket(ticket, createdTicket);
          testUser(ticket.user, user);
        });
        it('and return ticket with user\'s profile picture', async () => {
          const { id: ticketId } = await createTicket({
            userId: user.id,
          });
          const profilePicture = await createProfilePicture({
            userId: user.id,
          });
          const {
            body: {
              data: {
                ticket: {
                  user: {
                    currentProfilePicture,
                  },
                },
              },
            },
          } = await getTicketsId(app, token, ticketId);
          testProfilePicture(currentProfilePicture, profilePicture);
        });
        it('return ticket.user === null if ticket.userId === null', async () => {
          const { id: ticketId } = await createTicket({});
          const {
            body: {
              data: {
                ticket: returnedTicket,
              },
            },
          } = await getTicketsId(app, token, ticketId);
          expect(returnedTicket.user).toBeNull();
        });
        it('do not include profile picture if signedUrl.OK === false', async () => {
          (signedUrl as jest.Mock).mockImplementation(() => ({
            OK: false,
          }));
          const { id: ticketId } = await createTicket({
            userId: user.id,
          });
          const { id: profilePictureId } = await createProfilePicture({
            userId: user.id,
          });
          const {
            body: {
              data: {
                ticket: {
                  user: {
                    currentProfilePicture,
                  },
                },
              },
            },
          } = await getTicketsId(app, token, ticketId);
          const image = await Image.findAll();
          const profilePicture = await ProfilePicture.findByPk(profilePictureId);
          expect(currentProfilePicture).toBeNull();
          expect(image.length).toBe(0);
          expect(profilePicture).toBeNull();
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.ticketId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await getTicketsId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('ticket'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('ticket not found', async () => {
          const {
            body,
            status,
          } = await getTicketsId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('ticket'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
