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
  cleanGoogleBuckets,
  createProfilePicture,
  createTicket,
  createUser,
  getTickets,
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
        await cleanGoogleBuckets();
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
        await cleanGoogleBuckets();
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
        expect(tickets[0].body).not.toBeUndefined();
        expect(tickets[0].createdAt).not.toBeUndefined();
        expect(tickets[0].header).not.toBeUndefined();
        expect(tickets[0].id).not.toBeUndefined();
        expect(tickets[0].updatedAt).toBeUndefined();
        expect(tickets[0].userId).toBeUndefined();
        expect(tickets[0].user.authTokenVersion).toBeUndefined();
        expect(tickets[0].user.blackListedAt).toBeUndefined();
        expect(tickets[0].user.confirmed).toBeUndefined();
        expect(tickets[0].user.confirmTokenVersion).toBeUndefined();
        expect(tickets[0].user.createdAt).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture).not.toBeUndefined();
        expect(tickets[0].user.defaultProfilePicture).toBe(user.defaultProfilePicture);
        expect(tickets[0].user.email).toBeUndefined();
        expect(tickets[0].user.emailTokenVersion).toBeUndefined();
        expect(tickets[0].user.facebookId).toBeUndefined();
        expect(tickets[0].user.googleId).toBeUndefined();
        expect(tickets[0].user.hash).toBeUndefined();
        expect(tickets[0].user.id).toBe(user.id);
        expect(tickets[0].user.isBlackListed).toBeUndefined();
        expect(tickets[0].user.pseudonym).toBe(user.pseudonym);
        expect(tickets[0].user.resetPasswordTokenVersion).toBeUndefined();
        expect(tickets[0].user.role).toBe(user.role);
        expect(tickets[0].user.salt).toBeUndefined();
        expect(tickets[0].user.socialMediaUserName).toBe(user.socialMediaUserName);
        expect(tickets[0].user.updateEmailTokenVersion).toBeUndefined();
        expect(tickets[0].user.updatedAt).toBeUndefined();
        expect(tickets[0].user.userName).toBe(user.userName);
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
        expect(tickets[0].user.currentProfilePicture.createdAt).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.cropedImage.bucketName).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.cropedImage.createdAt).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.cropedImage.fileName).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.cropedImage.format).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.cropedImage.height).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.cropedImage.id).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.cropedImage.size).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.cropedImage.width).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.cropedImagesId).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.current).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.id).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.originalImage.bucketName).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.originalImage.createdAt).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.originalImage.fileName).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.originalImage.format).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.originalImage.height).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.originalImage.id).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.originalImage.signedUrl).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.originalImage.size).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.originalImage.updatedAt).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.originalImage.width).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.originalImageId).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.pendingImage.bucketName).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.pendingImage.createdAt).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.pendingImage.fileName).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.pendingImage.format).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.pendingImage.height).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.pendingImage.id).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.pendingImage.size).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.pendingImage.width).not.toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.pendingImageId).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.updatedAt).toBeUndefined();
        expect(tickets[0].user.currentProfilePicture.userId).toBeUndefined();
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
