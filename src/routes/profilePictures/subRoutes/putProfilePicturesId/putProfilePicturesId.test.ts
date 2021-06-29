import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
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
  createProfilePicture,
  createUser,
  putProfilePicturesId,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('#src/helpers/signedUrl', () => jest.fn());

describe('/profilePictures', () => {
  describe('/:profilePictureId', () => {
    describe('PUT', () => {
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
        it('set current to false', async () => {
          const profilePicture = await createProfilePicture({
            userId: user.id,
          });
          const {
            body: {
              action,
              data: {
                current,
                profilePictureId,
              },
            },
            status,
          } = await putProfilePicturesId(app, token, profilePicture.id);
          await profilePicture.reload();
          expect(action).toBe('PUT');
          expect(current).toBe(false);
          expect(profilePicture.current).toBe(false);
          expect(profilePictureId).toBe(profilePicture.id);
          expect(status).toBe(200);
        });
        it('set profile picture to true and the previous current to false', async () => {
          const profilePictureOne = await createProfilePicture({
            current: false,
            userId: user.id,
          });
          const profilePictureTwo = await createProfilePicture({
            userId: user.id,
          });
          const {
            body: {
              data: {
                current,
              },
            },
          } = await putProfilePicturesId(app, token, profilePictureOne.id);
          await profilePictureOne.reload();
          await profilePictureTwo.reload();
          expect(current).toBe(true);
          expect(profilePictureOne.current).toBe(true);
          expect(profilePictureTwo.current).toBe(false);
        });
        it('don\'t update profile pictures posted by other user', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const profilePictureOne = await createProfilePicture({
            userId: user.id,
          });
          const profilePictureTwo = await createProfilePicture({
            userId: userTwo.id,
          });
          await putProfilePicturesId(app, token, profilePictureOne.id);
          await profilePictureTwo.reload();
          expect(profilePictureTwo.current).toBe(true);
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.profilePictureId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await putProfilePicturesId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('profile picture'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('profile picture id not found', async () => {
          const {
            body,
            status,
          } = await putProfilePicturesId(app, token, uuidv4());
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
          } = await putProfilePicturesId(app, token, profilePictureId);
          expect(body.errors).toBe(MODEL_NOT_FOUND('profile picture'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
