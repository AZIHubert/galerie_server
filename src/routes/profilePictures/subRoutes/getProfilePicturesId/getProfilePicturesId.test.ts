import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  ProfilePicture,
  Image,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import signedUrl from '#src/helpers/signedUrl';
import {
  createUser,
  createProfilePicture,
  getProfilePicturesId,
  testProfilePicture,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('#src/helpers/signedUrl', () => jest.fn());

describe('/profilePictures', () => {
  describe('/:profilePictureId', () => {
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
        it('return profile picture', async () => {
          const { id: profilePictureId } = await createProfilePicture({
            userId: user.id,
          });
          const {
            body: {
              action,
              data: {
                profilePicture,
              },
            },
            status,
          } = await getProfilePicturesId(app, token, profilePictureId);
          expect(action).toEqual('GET');
          expect(status).toEqual(200);
          testProfilePicture(profilePicture);
        });
        describe('should return status 400 if', () => {
          it('request.params.profilePictureId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await getProfilePicturesId(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('profile picture'));
            expect(status).toBe(400);
          });
        });
        describe('should return status 404 if', () => {
          it('profile picture id not found', async () => {
            const {
              body,
              status,
            } = await getProfilePicturesId(app, token, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('profile picture'));
            expect(status).toBe(404);
          });
          it('profile picture was not post by current user', async () => {
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
            } = await getProfilePicturesId(app, token, profilePictureId);
            expect(body.errors).toBe(MODEL_NOT_FOUND('profile picture'));
            expect(status).toBe(404);
          });
          it('signUrl.OK === false', async () => {
            (signedUrl as jest.Mock).mockImplementation(() => ({
              OK: false,
            }));
            const { id: profilePictureId } = await createProfilePicture({
              userId: user.id,
            });
            const {
              body,
              status,
            } = await getProfilePicturesId(app, token, profilePictureId);
            const profilePicture = await ProfilePicture.findByPk(profilePictureId);
            const images = await Image.findAll();
            expect(body.errors).toBe(MODEL_NOT_FOUND('profile picture'));
            expect(profilePicture).toBeNull();
            expect(images.length).toBe(0);
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
