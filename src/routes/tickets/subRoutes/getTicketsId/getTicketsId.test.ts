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
  cleanGoogleBuckets,
  createUser,
  getTicketsId,
  deleteUsersMe,
  postProfilePictures,
  postTickets,
  postUsersLogin,
} from '@src/helpers/test';

import initApp from '@src/server';

let adminToken: string;
let app: Server;
let password: string;
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

      describe('should return status 200 and', () => {
        it('return a ticket', async () => {
          const body = 'ticket\'s body';
          const header = 'ticket\'s header';
          await postTickets(app, token, {
            body: {
              body,
              header,
            },
          });
          const [ticket] = await Ticket.findAll();
          const {
            body: {
              action,
              data: {
                ticket: returnedTicket,
              },
            },
            status,
          } = await getTicketsId(app, adminToken, ticket.id);
          expect(action).toBe('GET');
          expect(status).toBe(200);
          expect(returnedTicket.body).toBe(body);
          expect(new Date(returnedTicket.createdAt)).toEqual(ticket.createdAt);
          expect(returnedTicket.header).toBe(header);
          expect(returnedTicket.id).toBe(ticket.id);
          expect(returnedTicket.updatedAt).toBeUndefined();
          expect(returnedTicket.user.authTokenVersion).toBeUndefined();
          expect(returnedTicket.user.confirmed).toBeUndefined();
          expect(returnedTicket.user.confirmTokenVersion).toBeUndefined();
          expect(new Date(returnedTicket.user.createdAt)).toEqual(user.createdAt);
          expect(returnedTicket.user.currentProfilePicture).toBeNull();
          expect(returnedTicket.user.defaultProfilePicture).toBeNull();
          expect(returnedTicket.user.email).toBeUndefined();
          expect(returnedTicket.user.emailTokenVersion).toBeUndefined();
          expect(returnedTicket.user.facebookId).toBeUndefined();
          expect(returnedTicket.user.googleId).toBeUndefined();
          expect(returnedTicket.user.hash).toBeUndefined();
          expect(returnedTicket.user.id).toBe(user.id);
          expect(returnedTicket.user.pseudonym).toBe(user.pseudonym);
          expect(returnedTicket.user.resetPasswordTokenVersion).toBeUndefined();
          expect(returnedTicket.user.role).toBe(user.role);
          expect(returnedTicket.user.salt).toBeUndefined();
          expect(returnedTicket.user.socialMediaUserName).toBe(user.socialMediaUserName);
          expect(returnedTicket.user.updatedEmailTokenVersion).toBeUndefined();
          expect(returnedTicket.user.updatedAt).toBeUndefined();
          expect(returnedTicket.user.userName).toBe(user.userName);
          expect(returnedTicket.userId).toBeUndefined();
        });
        it('and return ticket with user\'s profile picture', async () => {
          await postTickets(app, token, {
            body: {
              body: 'ticket\'s body',
              header: 'ticket\'s header',
            },
          });
          const {
            body: {
              data: {
                profilePicture,
              },
            },
          } = await postProfilePictures(app, token);
          const [ticket] = await Ticket.findAll();
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
          } = await getTicketsId(app, adminToken, ticket.id);
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
          await postTickets(app, token, {
            body: {
              body: 'ticket\'s body',
              header: 'ticket\'s header',
            },
          });
          await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const [ticket] = await Ticket.findAll();
          const {
            body: {
              data: {
                ticket: returnedTicket,
              },
            },
          } = await getTicketsId(app, adminToken, ticket.id);
          expect(returnedTicket.user).toBeNull();
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.ticketId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await getTicketsId(app, adminToken, '100');
          expect(body.errors).toBe(INVALID_UUID('ticket'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('ticket not found', async () => {
          const {
            body,
            status,
          } = await getTicketsId(app, adminToken, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('ticket'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
