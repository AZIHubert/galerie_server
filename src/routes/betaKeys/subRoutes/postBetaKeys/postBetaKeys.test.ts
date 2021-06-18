import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  BetaKey,
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  createProfilePicture,
  createUser,
  postBetaKey,
  testProfilePicture,
  testBetaKey,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/betaKeys', () => {
  describe('POST', () => {
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
        } = await createUser({
          role: 'superAdmin',
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
      it('create a betaKey', async () => {
        const {
          body: {
            action,
            data: {
              betaKey,
            },
          },
          status,
        } = await postBetaKey(app, token);
        const createdBetaKey = await BetaKey.findByPk(betaKey.id) as BetaKey;
        expect(action).toBe('POST');
        expect(status).toBe(200);
        expect(createdBetaKey).not.toBeNull();
        expect(createdBetaKey.userId).toBeNull();
        testBetaKey(betaKey);
        testUser(betaKey.createdBy, user);
      });
      it('include createdBy current profile picture', async () => {
        const profilePicture = await createProfilePicture({
          userId: user.id,
        });
        const {
          body: {
            data: {
              betaKey: {
                createdBy: {
                  currentProfilePicture,
                },
              },
            },
          },
        } = await postBetaKey(app, token);
        testProfilePicture(currentProfilePicture, profilePicture);
      });
      it('do not include createdBy current profile picture if signedUrl.OK === false', async () => {
        (signedUrl as jest.Mock).mockImplementation(() => ({
          OK: false,
        }));
        await createProfilePicture({
          userId: user.id,
        });
        const {
          body: {
            data: {
              betaKey: {
                createdBy: {
                  currentProfilePicture,
                },
              },
            },
          },
        } = await postBetaKey(app, token);
        const images = await Image.findAll();
        const profilePictures = await ProfilePicture.findAll();
        expect(currentProfilePicture).toBeNull();
        expect(images.length).toBe(0);
        expect(profilePictures.length).toBe(0);
      });
      it('TODO: send an email if request.body.sendTo is send', async () => {});
    });
    describe('TODO: should return status 400 if', () => {
      // TODO:
      // test that request.body.email is of type email.
    });
  });
});
