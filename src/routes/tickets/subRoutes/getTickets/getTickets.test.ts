import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Image,
  ProfilePicture,
  Ticket,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  createProfilePicture,
  createTicket,
  createUser,
  getTickets,
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
  describe('GET', () => {
    beforeAll(() => {
      jest.clearAllMocks();
      (signedUrl as jest.Mock).mockImplementation(() => ({
        OK: true,
        signedUrl: 'signedUrl',
      }));
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
        testTicket(tickets[0]);
        testUser(tickets[0].user);
      });
      it('include current profile picture', async () => {
        await createProfilePicture({
          userId: user.id,
        });
        await createTicket({
          userId: user.id,
        });
        const {
          body: {
            data: {
              tickets,
            },
          },
        } = await getTickets(app, token);
        testProfilePicture(tickets[0].user.currentProfilePicture);
      });
      it('do not include profile picture if signedUrl.OK === false', async () => {
        (signedUrl as jest.Mock).mockImplementation(() => ({
          OK: false,
        }));
        const { id: profilePictureId } = await createProfilePicture({
          userId: user.id,
        });
        await createTicket({
          userId: user.id,
        });
        const {
          body: {
            data: {
              tickets,
            },
          },
        } = await getTickets(app, token);
        const images = await Image.findAll();
        const profilePicture = await ProfilePicture.findByPk(profilePictureId);
        expect(images.length).toBe(0);
        expect(profilePicture).toBeNull();
        expect(tickets[0].user.currentProfilePicture).toBeNull();
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
        } = await getTickets(app, token, { page: 2 });
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
    });
  });
});
