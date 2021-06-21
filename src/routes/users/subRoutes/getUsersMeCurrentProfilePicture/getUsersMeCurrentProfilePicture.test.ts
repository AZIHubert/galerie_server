import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
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
  getUsersMeCurrentProfilePicture,
  testProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('/me', () => {
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
          it('return currentProfilePicture === null', async () => {
            const {
              body: {
                action,
                data: {
                  currentProfilePicture,
                },
              },
              status,
            } = await getUsersMeCurrentProfilePicture(app, token);
            expect(action).toBe('GET');
            expect(currentProfilePicture).toBeNull();
            expect(status).toBe(200);
          });
          it('return currentProfilePicture', async () => {
            const profilePicture = await createProfilePicture({
              userId: user.id,
            });
            const {
              body: {
                data: {
                  currentProfilePicture,
                },
              },
            } = await getUsersMeCurrentProfilePicture(app, token);
            testProfilePicture(currentProfilePicture, profilePicture);
          });
          it('return currentProfilePicture === null if signedUrl.OK === false', async () => {
            (signedUrl as jest.Mock).mockImplementation(() => ({
              OK: false,
            }));
            await createProfilePicture({
              userId: user.id,
            });
            const {
              body: {
                data: {
                  currentProfilePicture,
                },
              },
            } = await getUsersMeCurrentProfilePicture(app, token);
            const images = await Image.findAll();
            const profilePictures = await ProfilePicture.findAll();
            expect(currentProfilePicture).toBeNull();
            expect(images.length).toBe(0);
            expect(profilePictures.length).toBe(0);
          });
        });
      });
    });
  });
});
