import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Ticket,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteUsersMe,
  getTickets,
  postProfilePictures,
  postTickets,
  postUsersLogin,
} from '@src/helpers/test';

import initApp from '@src/server';

describe('/tickets', () => {
  let adminToken: string;
  let app: Server;
  let password: string;
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
      await cleanGoogleBuckets();
      const {
        password: createdPassword,
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

      password = createdPassword;
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
      await cleanGoogleBuckets();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('GET', () => {
    describe('should return status 200 and', () => {
      it('return all tickets', async () => {
        const body = 'ticket\'s body';
        const header = 'ticket\'s header';
        const {
          body: {
            data: {
              profilePicture,
            },
          },
        } = await postProfilePictures(app, token);
        await postTickets(app, token, {
          body,
          header,
        });
        await postTickets(app, token, {
          body: 'ticket\'s body',
          header: 'ticket\'s header',
        });
        const {
          body: {
            action,
            data: {
              tickets,
            },
          },
          status,
        } = await getTickets(app, adminToken);
        expect(action).toBe('GET');
        expect(status).toBe(200);
        expect(tickets.length).toBe(2);
        expect(tickets[0].body).toBe(body);
        expect(tickets[0].createdAt).not.toBeUndefined();
        expect(tickets[0].header).toBe(header);
        expect(tickets[0].id).not.toBeUndefined();
        expect(tickets[0].updatedAt).toBeUndefined();
        expect(tickets[0].userId).toBeUndefined();
        expect(tickets[0].user.authTokenVersion).toBeUndefined();
        expect(tickets[0].user.confirmed).toBeUndefined();
        expect(tickets[0].user.confirmTokenVersion).toBeUndefined();
        expect(tickets[0].user.createdAt).not.toBeUndefined();
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
        expect(tickets[0].user.currentProfilePicture.id).toBe(profilePicture.id);
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
        expect(tickets[0].user.defaultProfilePicture).toBe(user.defaultProfilePicture);
        expect(tickets[0].user.email).toBeUndefined();
        expect(tickets[0].user.emailTokenVersion).toBeUndefined();
        expect(tickets[0].user.facebookId).toBeUndefined();
        expect(tickets[0].user.googleId).toBeUndefined();
        expect(tickets[0].user.id).toBe(user.id);
        expect(tickets[0].user.password).toBeUndefined();
        expect(tickets[0].user.pseudonym).toBe(user.pseudonym);
        expect(tickets[0].user.resetPasswordTokenVersion).toBeUndefined();
        expect(tickets[0].user.role).toBe(user.role);
        expect(tickets[0].user.socialMediaUserName).toBe(user.socialMediaUserName);
        expect(tickets[0].user.updateEmailTokenVersion).toBeUndefined();
        expect(tickets[0].user.updatedAt).toBeUndefined();
        expect(tickets[0].user.userName).toBe(user.userName);
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
        } = await getTickets(app, adminToken);
        const {
          body: {
            data: {
              tickets: secondPack,
            },
          },
        } = await getTickets(app, adminToken, 2);
        expect(firstPack.length).toBe(20);
        expect(secondPack.length).toBe(1);
      });
      it('return ticket even if it\'s user has delete his account', async () => {
        await postTickets(app, token, {
          body: 'ticket\'s body',
          header: 'ticket\'s header',
        });
        await deleteUsersMe(app, token, {
          deleteAccountSentence: 'delete my account',
          password,
          userNameOrEmail: user.email,
        });
        const {
          body: {
            data: {
              tickets,
            },
          },
        } = await getTickets(app, adminToken);
        expect(tickets.length).toBe(1);
        expect(tickets[0].user).toBeNull();
      });
    });
  });
});
