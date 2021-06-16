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
  cleanGoogleBuckets,
  createProfilePicture,
  createTicket,
  createUser,
  getTicketsId,
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
          await cleanGoogleBuckets();
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
          expect(ticket.body).toBe(createdTicket.body);
          expect(new Date(ticket.createdAt)).toEqual(createdTicket.createdAt);
          expect(ticket.header).toBe(createdTicket.header);
          expect(ticket.id).toBe(createdTicket.id);
          expect(ticket.updatedAt).toBeUndefined();
          testUser(ticket.user, user);
          expect(ticket.userId).toBeUndefined();
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
