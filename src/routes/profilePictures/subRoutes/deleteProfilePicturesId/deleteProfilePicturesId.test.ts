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
import {
  createProfilePicture,
  createUser,
  deleteProfilePicturesId,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('@src/helpers/gc', () => ({
  __esModule: true,
  default: ({
    bucket: () => ({
      file: () => ({
        delete: () => Promise.resolve(),
      }),
    }),
  }),
}));

describe('/profilePictures', () => {
  describe('/:profilePictureId', () => {
    describe('DELETE', () => {
      beforeAll(() => {
        sequelize = initSequelize();
        app = initApp();
      });

      beforeEach(async (done) => {
        jest.clearAllMocks();
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
        it('return action type/profile picture\'id and delete profile picture/image and all images from Google buckets', async () => {
          const { id: profilePictureId } = await createProfilePicture({
            userId: user.id,
          });
          const {
            body: {
              action,
              data: {
                profilePictureId: returnedProfilePictureId,
              },
            },
            status,
          } = await deleteProfilePicturesId(app, token, profilePictureId);
          const images = await Image.findAll();
          const profilePicture = await ProfilePicture.findByPk(profilePictureId);
          expect(status).toBe(200);
          expect(action).toEqual('DELETE');
          expect(returnedProfilePictureId).toEqual(profilePictureId);
          expect(images.length).toBe(0);
          expect(profilePicture).toBeNull();
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.profilePictureId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await deleteProfilePicturesId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('profile picture'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('profile picture id not found', async () => {
          const {
            body,
            status,
          } = await deleteProfilePicturesId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('profile picture'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
