import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import { USER_SHOULD_NOT_BE_BLACK_LISTED } from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createBlackList,
  createUser,
  postUsersLoginSocialMedia,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;

describe('/users', () => {
  describe('/login', () => {
    describe('/socialMedia', () => {
      describe('POST', () => {
        beforeAll(() => {
          app = initApp();
          sequelize = initSequelize();
        });

        beforeEach(async (done) => {
          try {
            await sequelize.sync({ force: true });
          } catch (err) {
            done(err);
          }
          done();
        });

        afterAll(async (done) => {
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
          it('create a user if type is Facebook and no other user with same FacebookId exist', async () => {
            const facebookId = '1';
            const userName = 'user';
            await createUser({
              facebookId: '2',
            });
            const {
              body: {
                data: {
                  expiresIn,
                  token: loginToken,
                },
              },
              status,
            } = await postUsersLoginSocialMedia(app, {
              body: {
                id: facebookId,
                type: 'Facebook',
                userName,
              },
            });
            const facebookUser = await User.findOne({
              where: {
                facebookId,
              },
            }) as User;
            expect(expiresIn).toBe(1800);
            expect(facebookUser).not.toBeNull();
            expect(facebookUser.confirmed).toBe(true);
            expect(facebookUser.defaultProfilePicture).toBeNull();
            expect(facebookUser.email).toBeNull();
            expect(facebookUser.facebookId).toBe(facebookId);
            expect(facebookUser.googleId).toBeNull();
            expect(facebookUser.hash).toBeNull();
            expect(facebookUser.pseudonym).toBe(userName);
            expect(facebookUser.role).toBe('user');
            expect(facebookUser.salt).toBeNull();
            expect(facebookUser.socialMediaUserName).toBe(userName);
            expect(facebookUser.userName).toBeNull();
            expect(loginToken).not.toBeUndefined();
            expect(status).toBe(200);
          });
          it('create a user if type is Google and no other user with same GoogleId exist', async () => {
            const googleId = '1';
            const userName = 'user';
            await createUser({
              googleId: '2',
            });
            const {
              body: {
                data: {
                  expiresIn,
                  token: loginToken,
                },
              },
            } = await postUsersLoginSocialMedia(app, {
              body: {
                id: googleId,
                userName,
                type: 'Google',
              },
            });
            const googleUser = await User.findOne({
              where: {
                googleId,
              },
            }) as User;
            expect(expiresIn).toBe(1800);
            expect(googleUser).not.toBeNull();
            expect(googleUser.confirmed).toBeTruthy();
            expect(googleUser.defaultProfilePicture).toBeNull();
            expect(googleUser.email).toBeNull();
            expect(googleUser.facebookId).toBeNull();
            expect(googleUser.googleId).toBe(googleId);
            expect(googleUser.hash).toBeNull();
            expect(googleUser.pseudonym).toBe(userName);
            expect(googleUser.role).toBe('user');
            expect(googleUser.salt).toBeNull();
            expect(googleUser.socialMediaUserName).toBe(userName);
            expect(googleUser.userName).toBeNull();
            expect(loginToken).not.toBeUndefined();
          });
          it('update default profile picture if Google/Facebook\'s profile picture has changed', async () => {
            const facebookId = '1';
            const newProfilePicture = 'http://profilePicture';
            await postUsersLoginSocialMedia(app, {
              body: {
                id: facebookId,
                userName: 'user',
                type: 'Facebook',
              },
            });
            await postUsersLoginSocialMedia(app, {
              body: {
                id: facebookId,
                profilePicture: newProfilePicture,
                type: 'Facebook',
              },
            });
            const user = await User.findOne({
              where: {
                facebookId,
              },
            }) as User;
            expect(user.defaultProfilePicture).toEqual(newProfilePicture);
          });
          it('update email if Google/Facebook\'s email has changed', async () => {
            const facebookId = '1';
            const newEmail = 'user@email.com';
            await postUsersLoginSocialMedia(app, {
              body: {
                id: facebookId,
                userName: 'user',
                type: 'Facebook',
              },
            });
            await postUsersLoginSocialMedia(app, {
              body: {
                id: facebookId,
                email: newEmail,
                type: 'Facebook',
              },
            });
            const user = await User.findOne({
              where: {
                facebookId,
              },
            }) as User;
            expect(user.email).toEqual(newEmail);
          });
        });
        describe('should return status 400 if', () => {
          it('id is not found', async () => {
            const {
              body,
              status,
            } = await postUsersLoginSocialMedia(app, {
              body: {
                userName: 'user',
              },
            });
            expect(body.errors).toBe('id not found');
            expect(status).toBe(400);
          });
          it('userName is not found if id is not register', async () => {
            const {
              body,
              status,
            } = await postUsersLoginSocialMedia(app, {
              body: {
                id: '1',
                type: 'Facebook',
              },
            });
            expect(body.errors).toBe('user name not found');
            expect(status).toBe(400);
          });
          it('type is Facebook and email is already used for a Google account', async () => {
            const email = 'user@email.com';
            await postUsersLoginSocialMedia(app, {
              body: {
                id: '1',
                userName: 'user',
                email,
                type: 'Google',
              },
            });
            const {
              body,
              status,
            } = await postUsersLoginSocialMedia(app, {
              body: {
                id: '1',
                userName: 'user',
                email,
                type: 'Facebook',
              },
            });
            expect(body.errors).toBe('you\'re email is already used for a google account');
            expect(status).toBe(400);
          });
          it('type is Facebook and email is already used for a regular account', async () => {
            const email = 'user@email.com';
            await createUser({
              email,
            });
            const {
              body,
              status,
            } = await postUsersLoginSocialMedia(app, {
              body: {
                id: '1',
                userName: 'user',
                email,
                type: 'Facebook',
              },
            });
            expect(body.errors).toBe('you\'re email is already used');
            expect(status).toBe(400);
          });
          it('type is Google and email is already used for a Facebook account', async () => {
            const email = 'user@email.com';
            await postUsersLoginSocialMedia(app, {
              body: {
                email,
                id: '1',
                type: 'Facebook',
                userName: 'user',
              },
            });
            const {
              body,
              status,
            } = await postUsersLoginSocialMedia(app, {
              body: {
                email,
                id: '1',
                type: 'Google',
                userName: 'user',
              },
            });
            expect(body.errors).toBe('you\'re email is already used for a facebook account');
            expect(status).toBe(400);
          });
          it('type is Google and email is already used for a regular account', async () => {
            const email = 'user@email.com';
            await createUser({
              email,
            });
            const {
              body,
              status,
            } = await postUsersLoginSocialMedia(app, {
              body: {
                id: '1',
                userName: 'user',
                email,
                type: 'Google',
              },
            });
            expect(body.errors).toBe('you\'re email is already used');
            expect(status).toBe(400);
          });
          it('user exist and is black listed', async () => {
            const facebookId = '1';
            const { user } = await createUser({
              role: 'admin',
            });
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              facebookId,
              userName: 'user2',
              socialMediaUserName: 'user',
            });
            await createBlackList({
              adminId: user.id,
              userId: userTwo.id,
            });
            const {
              body,
              status,
            } = await postUsersLoginSocialMedia(app, {
              body: {
                id: facebookId,
                type: 'Facebook',
              },
            });
            expect(body.errors).toBe(USER_SHOULD_NOT_BE_BLACK_LISTED);
            expect(status).toBe(400);
          });
        });
      });
    });
  });
});
