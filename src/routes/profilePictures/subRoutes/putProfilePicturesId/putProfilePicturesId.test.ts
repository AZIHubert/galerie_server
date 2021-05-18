import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  ProfilePicture,
  User,
} from '@src/db/models';

import { INVALID_UUID } from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  login,
  postProfilePicture,
  putProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/profilePictures', () => {
  let app: Server;
  let sequelize: Sequelize;
  let token: string;
  let user: User;

  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
  });

  beforeEach(async (done) => {
    try {
      await sequelize.sync({ force: true });
      await cleanGoogleBuckets();
      user = await createUser({});
      const { body } = await login(app, user.email, userPassword);
      token = body.token;
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

  describe('/:profilePictureId', () => {
    describe('PUT', () => {
      describe('should return status 200 and', () => {
        it('set current to false', async () => {
          const {
            body: {
              data: {
                profilePicture: {
                  id: profilePictureId,
                },
              },
            },
          } = await postProfilePicture(app, token);
          const {
            body: {
              action,
              data: {
                current,
                profilePictureId: returnedProfilePictureId,
              },
            },
            status,
          } = await putProfilePicture(app, token, profilePictureId);
          const profilePicture = await ProfilePicture.findByPk(profilePictureId) as ProfilePicture;
          expect(action).toBe('PUT');
          expect(current).toBeFalsy();
          expect(profilePicture.current).toBeFalsy();
          expect(returnedProfilePictureId).toBe(profilePictureId);
          expect(status).toBe(200);
        });
        it('set profile picture to true and the previous current to false', async () => {
          const {
            body: {
              data: {
                profilePicture: {
                  id: profilePictureId,
                },
              },
            },
          } = await postProfilePicture(app, token);
          const {
            body: {
              data: {
                profilePicture: {
                  id: previousCurrentId,
                },
              },
            },
          } = await postProfilePicture(app, token);
          const {
            body: {
              data: {
                current,
              },
            },
          } = await putProfilePicture(app, token, profilePictureId);
          const profilePicture = await ProfilePicture.findByPk(profilePictureId) as ProfilePicture;
          const previousCurrentProfilePicture = await ProfilePicture
            .findByPk(previousCurrentId) as ProfilePicture;
          expect(current).toBeTruthy();
          expect(profilePicture.current).toBeTruthy();
          expect(previousCurrentProfilePicture.current).toBeFalsy();
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.profilePictureId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await putProfilePicture(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('profile picture'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('profile picture id not found', async () => {
          const {
            body,
            status,
          } = await putProfilePicture(app, token, uuidv4());
          expect(body.errors).toBe('profile picture not found');
          expect(status).toBe(404);
        });
      });
    });
  });
});
