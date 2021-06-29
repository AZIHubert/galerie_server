import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '#src/helpers/initEnv';

import {
  Ticket,
  User,
} from '#src/db/models';

import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createTicket,
  createUser,
  getTickets,
  testTicket,
  testUser,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/tickets', () => {
  describe('GET', () => {
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
          role: 'superAdmin',
          userName: 'user2',
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
      it('return 1 tickets', async () => {
        await createTicket({
          userId: user.id,
        });
        const {
          body: {
            action,
            data: {
              tickets,
            },
          },
          status,
        } = await getTickets(app, token);
        expect(action).toBe('GET');
        expect(status).toBe(200);
        expect(tickets.length).toBe(1);
        expect(tickets[0].user.hasNewNotifications).toBeUndefined();
        testTicket(tickets[0]);
        testUser(tickets[0].user);
      });
      it('return a pack of 20 tickets', async () => {
        const NUM = 21;
        const numOfTickets = new Array(NUM).fill(0);
        await Promise.all(
          numOfTickets.map(async () => {
            await Ticket.create({
              body: 'ticket\'s body',
              header: 'ticket\'s header',
              userId: user.id,
            });
          }),
        );
        const {
          body: {
            data: {
              tickets: firstPack,
            },
          },
        } = await getTickets(app, token);
        const {
          body: {
            data: {
              tickets: secondPack,
            },
          },
        } = await getTickets(app, token, {
          previousTicket: firstPack[firstPack.length - 1].autoIncrementId,
        });
        expect(firstPack.length).toBe(20);
        expect(secondPack.length).toBe(1);
      });
      it('order by createdAt', async () => {
        const ticketOne = await createTicket({});
        const ticketTwo = await createTicket({});
        const ticketThree = await createTicket({});
        const ticketFour = await createTicket({});
        const ticketFive = await createTicket({});
        const {
          body: {
            data: {
              tickets,
            },
          },
        } = await getTickets(app, token);
        expect(tickets[0].id).toBe(ticketFive.id);
        expect(tickets[1].id).toBe(ticketFour.id);
        expect(tickets[2].id).toBe(ticketThree.id);
        expect(tickets[3].id).toBe(ticketTwo.id);
        expect(tickets[4].id).toBe(ticketOne.id);
      });
      it('return ticket even if it\'s user has delete his account', async () => {
        await createTicket({});
        const {
          body: {
            data: {
              tickets,
            },
          },
        } = await getTickets(app, token);
        expect(tickets.length).toBe(1);
        expect(tickets[0].user).toBeNull();
      });
      describe('should return first tickets id req.queru.previousTicket', () => {
        let ticketId: string;

        beforeEach(async (done) => {
          try {
            await createTicket({});
            const ticket = await createTicket({});
            ticketId = ticket.id;
          } catch (err) {
            done(err);
          }
          done();
        });

        it('is not a number', async () => {
          const {
            body: {
              data: {
                tickets,
              },
            },
          } = await getTickets(app, token, {
            previousTicket: 'notANumber',
          });
          expect(tickets.length).toBe(2);
          expect(tickets[0].id).toBe(ticketId);
        });
        it('is less than 0', async () => {
          const {
            body: {
              data: {
                tickets,
              },
            },
          } = await getTickets(app, token, {
            previousTicket: '-1',
          });
          expect(tickets.length).toBe(2);
          expect(tickets[0].id).toBe(ticketId);
        });
      });
    });
  });
});
