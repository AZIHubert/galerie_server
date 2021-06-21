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
  MODEL_NOT_FOUND,
  INVALID_UUID,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  createProfilePicture,
  createUser,
  getUsersIdCurrentProfilePicture,
  testProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('/:userId', () => {
    describe('/currentProfilePicture', () => {
      describe('GET', () => {
        beforeAll(() => {
          app = initApp();
          sequelize = initSequelize();
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
            user = createdUser;
            const jwt = signAuthToken(user);
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
          let userTwo: User;

          beforeEach(async (done) => {
            try {
              const { user: createdUser } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              userTwo = createdUser;
            } catch (err) {
              done(err);
            }
            done();
          });
          it('return current profile picture === null', async () => {
            const {
              body: {
                action,
                data: {
                  currentProfilePicture,
                },
              },
              status,
            } = await getUsersIdCurrentProfilePicture(app, token, userTwo.id);
            expect(action).toBe('GET');
            expect(currentProfilePicture).toBeNull();
            expect(status).toBe(200);
          });
          it('return current profile picture', async () => {
            const profilePicture = await createProfilePicture({
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  currentProfilePicture,
                },
              },
            } = await getUsersIdCurrentProfilePicture(app, token, userTwo.id);
            testProfilePicture(currentProfilePicture, profilePicture);
          });
          it('return current profile picture === null if signedUrl.OK === false', async () => {
            (signedUrl as jest.Mock).mockImplementation(() => ({
              OK: false,
            }));
            await createProfilePicture({
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  currentProfilePicture,
                },
              },
            } = await getUsersIdCurrentProfilePicture(app, token, userTwo.id);
            const images = await Image.findAll();
            const profilePictures = await ProfilePicture.findAll();
            expect(currentProfilePicture).toBeNull();
            expect(images.length).toBe(0);
            expect(profilePictures.length).toBe(0);
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.userId is not a UUIDv4', async () => {
            const {
              body,
              status,
            } = await getUsersIdCurrentProfilePicture(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('user'));
            expect(status).toBe(400);
          });
        });
        describe('should return status 404 if', () => {
          it('user not found', async () => {
            const {
              body,
              status,
            } = await getUsersIdCurrentProfilePicture(app, token, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
