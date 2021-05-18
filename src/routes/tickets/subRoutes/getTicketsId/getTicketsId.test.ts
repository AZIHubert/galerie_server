import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  getTicketId,
  deleteUser,
  postTicket,
  postProfilePicture,
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
      await cleanGoogleBuckets();
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
      await cleanGoogleBuckets();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('/:id', () => {
    describe('GET', () => {
      describe('should return status 200 and', () => {
        it('and return a ticket', async () => {
          const body = 'ticket\'s body';
          const header = 'ticket\'s header';
          const {
            body: {
              data: {
                ticket: {
                  id,
                  createdAt,
                },
              },
            },
          } = await postTicket(app, token, {
            body,
            header,
          });
          const {
            body: {
              action,
              data: {
                ticket,
              },
            },
            status,
          } = await getTicketId(app, adminToken, id);
          expect(action).toBe('GET');
          expect(status).toBe(200);
          expect(ticket.body).toBe(body);
          expect(ticket.createdAt).toEqual(createdAt);
          expect(ticket.header).toBe(header);
          expect(ticket.id).toBe(id);
          expect(ticket.updatedAt).toBeUndefined();
          expect(ticket.user.authTokenVersion).toBeUndefined();
          expect(ticket.user.confirmed).toBeUndefined();
          expect(ticket.user.confirmTokenVersion).toBeUndefined();
          expect(new Date(ticket.user.createdAt)).toEqual(user.createdAt);
          expect(ticket.user.currentProfilePicture).toBeNull();
          expect(ticket.user.defaultProfilePicture).toBeNull();
          expect(ticket.user.email).toBeUndefined();
          expect(ticket.user.emailTokenVersion).toBeUndefined();
          expect(ticket.user.facebookId).toBeUndefined();
          expect(ticket.user.googleId).toBeUndefined();
          expect(ticket.user.id).toBe(user.id);
          expect(ticket.user.password).toBeUndefined();
          expect(ticket.user.pseudonym).toBe(user.pseudonym);
          expect(ticket.user.resetPasswordTokenVersion).toBeUndefined();
          expect(ticket.user.role).toBe(user.role);
          expect(ticket.user.socialMediaUserName).toBe(user.socialMediaUserName);
          expect(ticket.user.updatedEmailTokenVersion).toBeUndefined();
          expect(ticket.user.updatedAt).toBeUndefined();
          expect(ticket.user.userName).toBe(user.userName);
          expect(ticket.userId).toBeUndefined();
        });
        it('and return ticket with user\'s profile picture', async () => {
          const {
            body: {
              data: {
                ticket: {
                  id,
                },
              },
            },
          } = await postTicket(app, token, {
            body: 'ticket\'s body',
            header: 'ticket\'s header',
          });
          const {
            body: {
              data: {
                profilePicture,
              },
            },
          } = await postProfilePicture(app, token);
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
          } = await getTicketId(app, adminToken, id);
          expect(currentProfilePicture.createdAt).not.toBeUndefined();
          expect(currentProfilePicture.cropedImage.bucketName).toBeUndefined();
          expect(currentProfilePicture.cropedImage.createdAt).toBeUndefined();
          expect(currentProfilePicture.cropedImage.fileName).toBeUndefined();
          expect(currentProfilePicture.cropedImage.format).not.toBeUndefined();
          expect(currentProfilePicture.cropedImage.height).not.toBeUndefined();
          expect(currentProfilePicture.cropedImage.id).toBeUndefined();
          expect(currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
          expect(currentProfilePicture.cropedImage.size).not.toBeUndefined();
          expect(currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
          expect(currentProfilePicture.cropedImage.width).not.toBeUndefined();
          expect(currentProfilePicture.cropedImagesId).toBeUndefined();
          expect(currentProfilePicture.current).toBeUndefined();
          expect(currentProfilePicture.id).toBe(profilePicture.id);
          expect(currentProfilePicture.originalImage.bucketName).toBeUndefined();
          expect(currentProfilePicture.originalImage.createdAt).toBeUndefined();
          expect(currentProfilePicture.originalImage.fileName).toBeUndefined();
          expect(currentProfilePicture.originalImage.format).not.toBeUndefined();
          expect(currentProfilePicture.originalImage.height).not.toBeUndefined();
          expect(currentProfilePicture.originalImage.id).toBeUndefined();
          expect(currentProfilePicture.originalImage.signedUrl).not.toBeUndefined();
          expect(currentProfilePicture.originalImage.size).not.toBeUndefined();
          expect(currentProfilePicture.originalImage.updatedAt).toBeUndefined();
          expect(currentProfilePicture.originalImage.width).not.toBeUndefined();
          expect(currentProfilePicture.originalImageId).toBeUndefined();
          expect(currentProfilePicture.pendingImage.bucketName).toBeUndefined();
          expect(currentProfilePicture.pendingImage.createdAt).toBeUndefined();
          expect(currentProfilePicture.pendingImage.fileName).toBeUndefined();
          expect(currentProfilePicture.pendingImage.format).not.toBeUndefined();
          expect(currentProfilePicture.pendingImage.height).not.toBeUndefined();
          expect(currentProfilePicture.pendingImage.id).toBeUndefined();
          expect(currentProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
          expect(currentProfilePicture.pendingImage.size).not.toBeUndefined();
          expect(currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
          expect(currentProfilePicture.pendingImage.width).not.toBeUndefined();
          expect(currentProfilePicture.pendingImageId).toBeUndefined();
          expect(currentProfilePicture.updatedAt).toBeUndefined();
          expect(currentProfilePicture.userId).toBeUndefined();
        });
        it('return ticket event if his user has deleted his account', async () => {
          const {
            body: {
              data: {
                ticket: {
                  id,
                },
              },
            },
          } = await postTicket(app, token, {
            body: 'ticket\'s body',
            header: 'ticket\'s header',
          });
          await deleteUser(app, token, {
            deleteAccountSentence: 'delete my account',
            password: userPassword,
            userNameOrEmail: user.email,
          });
          const {
            body: {
              data: {
                ticket,
              },
            },
          } = await getTicketId(app, adminToken, id);
          expect(ticket.user).toBeNull();
        });
      });
      describe('should return status 404 if', () => {
        it('ticket not found', async () => {
          const {
            body,
            status,
          } = await getTicketId(app, adminToken, uuidv4());
          expect(body.errors).toBe('ticket not found');
          expect(status).toBe(404);
        });
      });
    });
  });
});
