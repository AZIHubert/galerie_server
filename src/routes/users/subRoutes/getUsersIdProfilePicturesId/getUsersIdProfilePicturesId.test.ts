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
  createUser,
  getUsersIdProfilePicturesId,
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
    describe('/profilePictures', () => {
      describe('/:profilePictureId', () => {
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
              } = await createUser({
                role: 'admin',
              });
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
            it('return profile picture', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const createdProfilePicture = await createProfilePicture({
                userId: userTwo.id,
              });
              const profilePicture = createdProfilePicture;
              const {
                body: {
                  action,
                  data: {
                    profilePicture: returnedProfilePicture,
                    userId,
                  },
                },
                status,
              } = await getUsersIdProfilePicturesId(app, token, userTwo.id, profilePicture.id);
              expect(action).toBe('GET');
              expect(status).toBe(200);
              expect(userId).toBe(userTwo.id);
              testProfilePicture(returnedProfilePicture, profilePicture);
            });
          });
          describe('should return status 400 if', () => {
            it('request.params.userId is not a UUIDv4', async () => {
              const {
                body,
                status,
              } = await getUsersIdProfilePicturesId(app, token, '100', '100');
              expect(body.errors).toBe(INVALID_UUID('user'));
              expect(status).toBe(400);
            });
            it('request.params.profilePictureId is not a UUIDv4', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await getUsersIdProfilePicturesId(app, token, userTwo.id, '100');
              expect(body.errors).toBe(INVALID_UUID('profile picture'));
              expect(status).toBe(400);
            });
          });
          describe('should return 404 if', () => {
            it('user not found', async () => {
              const {
                body,
                status,
              } = await getUsersIdProfilePicturesId(app, token, uuidv4(), uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
              expect(status).toBe(404);
            });
            it('profile picture not found', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await getUsersIdProfilePicturesId(app, token, userTwo.id, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('profile picture'));
              expect(status).toBe(404);
            });
            it('signedUrl.OK === false', async () => {
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
                body,
                status,
              } = await getUsersIdProfilePicturesId(app, token, userTwo.id, profilePictureId);
              const images = await Image.findAll();
              const profilePictures = await ProfilePicture.findAll();
              expect(body.errors).toBe(MODEL_NOT_FOUND('profile picture'));
              expect(images.length).toBe(0);
              expect(profilePictures.length).toBe(0);
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
