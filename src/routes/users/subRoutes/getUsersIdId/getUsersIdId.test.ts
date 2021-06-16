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
  createBlackList,
  createProfilePicture,
  createUser,
  getUsersIdId,
  testProfilePicture,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('/id', () => {
    describe('/:userId', () => {
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
      describe('GET', () => {
        describe('shouls return status 200 and', () => {
          it('return user', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                action,
                data: {
                  user: returnedUser,
                },
              },
              status,
            } = await getUsersIdId(app, token, userTwo.id);
            expect(action).toBe('GET');
            expect(status).toBe(200);
            testUser(returnedUser, userTwo);
          });
          it('include current profile picture', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const profilePicture = await createProfilePicture({
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  user: {
                    currentProfilePicture,
                  },
                },
              },
            } = await getUsersIdId(app, token, userTwo.id);
            testProfilePicture(currentProfilePicture, profilePicture);
          });
          it('do not include profile picture if signedUrl.OK === false', async () => {
            (signedUrl as jest.Mock).mockImplementation(() => ({
              OK: false,
            }));
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { id: profilePictureId } = await createProfilePicture({
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  user: {
                    currentProfilePicture,
                  },
                },
              },
            } = await getUsersIdId(app, token, userTwo.id);
            const images = await Image.findAll();
            const profilePicture = await ProfilePicture.findByPk(profilePictureId);
            expect(images.length).toBe(0);
            expect(profilePicture).toBeNull();
            expect(currentProfilePicture).toBeNull();
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.userId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await getUsersIdId(app, token, '100');
            expect(body.errors).toEqual(INVALID_UUID('user'));
            expect(status).toBe(400);
          });
          it('params.userId is the same as the current user.id', async () => {
            const {
              body,
              status,
            } = await getUsersIdId(app, token, user.id);
            expect(body.errors).toEqual('params.id cannot be the same as your current one');
            expect(status).toBe(400);
          });
        });
        describe('should return status 404 if', () => {
          it('user not found', async () => {
            const {
              body,
              status,
            } = await getUsersIdId(app, token, uuidv4());
            expect(status).toBe(404);
            expect(body).toEqual({
              errors: MODEL_NOT_FOUND('user'),
            });
          });
          it('user is not confirmed', async () => {
            const {
              user: {
                id,
              },
            } = await createUser({
              confirmed: false,
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await getUsersIdId(app, token, id);
            expect(status).toBe(404);
            expect(body).toEqual({
              errors: MODEL_NOT_FOUND('user'),
            });
          });
          it('user is black listed', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createBlackList({
              adminId: user.id,
              userId: userTwo.id,
            });
            const {
              body,
              status,
            } = await getUsersIdId(app, token, userTwo.id);
            expect(status).toBe(404);
            expect(body).toEqual({
              errors: MODEL_NOT_FOUND('user'),
            });
          });
        });
      });
    });
  });
});
