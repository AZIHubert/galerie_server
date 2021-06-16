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
  cleanGoogleBuckets,
  createUser,
  createProfilePicture,
  getUsers,
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
  describe('GET', () => {
    beforeAll(() => {
      jest.clearAllMocks();
      (signedUrl as jest.Mock).mockImplementation(() => ({
        OK: true,
        signedUrl: 'signedUrl',
      }));
      sequelize = initSequelize();
      app = initApp();
    });

    beforeEach(async (done) => {
      try {
        await sequelize.sync({ force: true });
        await cleanGoogleBuckets();
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
        await cleanGoogleBuckets();
        await sequelize.close();
      } catch (err) {
        done(err);
      }
      app.close();
      done();
    });

    describe('should return status 200 and', () => {
      describe('get all users', () => {
        it('exept current one', async () => {
          const {
            body: {
              action,
              data: {
                users,
              },
            },
            status,
          } = await getUsers(app, token);
          expect(action).toBe('GET');
          expect(users.length).toBe(0);
          expect(status).toBe(200);
        });
        it('return one user', async () => {
          await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              data: {
                users,
              },
            },
          } = await getUsers(app, token);
          expect(users.length).toBe(1);
          testUser(users[0]);
        });
        it('exept not confirmed', async () => {
          await createUser({
            confirmed: false,
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              data: {
                users,
              },
            },
          } = await getUsers(app, token);
          expect(users.length).toBe(0);
        });
        it('exept black listed users', async () => {
          await createUser({
            email: 'user2@email.com',
            isBlackListed: true,
            userName: 'user2',
          });
          const {
            body: {
              data: {
                users,
              },
            },
          } = await getUsers(app, token);
          expect(users.length).toBe(0);
        });
        it('should return a pack of 20 users', async () => {
          const NUM = 21;
          const numOfUsers = new Array(NUM).fill(0);
          await Promise.all(
            numOfUsers.map(async (_, index) => {
              await createUser({
                email: `user${index + 2}@email.com`,
                userName: `user${index + 2}`,
              });
            }),
          );
          const {
            body: {
              data: {
                users: firstPack,
              },
            },
          } = await getUsers(app, token);
          const {
            body: {
              data: {
                users: secondPack,
              },
            },
          } = await getUsers(app, token, { page: 2 });
          expect(firstPack.length).toBe(20);
          expect(secondPack.length).toBe(1);
        });
        it('order by pseudonym', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'a',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'b',
          });
          const { user: userFour } = await createUser({
            email: 'user4@email.com',
            userName: 'c',
          });
          const { user: userFive } = await createUser({
            email: 'user5@email.com',
            userName: 'd',
          });
          const { user: userSix } = await createUser({
            email: 'user6@email.com',
            userName: 'e',
          });
          const {
            body: {
              data: {
                users,
              },
            },
          } = await getUsers(app, token);
          expect(users.length).toBe(5);
          expect(users[0].id).toBe(userTwo.id);
          expect(users[1].id).toBe(userThree.id);
          expect(users[2].id).toBe(userFour.id);
          expect(users[3].id).toBe(userFive.id);
          expect(users[4].id).toBe(userSix.id);
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
                users: [{
                  currentProfilePicture,
                }],
              },
            },
          } = await getUsers(app, token);
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
                users: [{
                  currentProfilePicture,
                }],
              },
            },
          } = await getUsers(app, token);
          const images = await Image.findAll();
          const profilePicture = await ProfilePicture.findByPk(profilePictureId);
          expect(images.length).toBe(0);
          expect(profilePicture).toBeNull();
          expect(currentProfilePicture).toBeNull();
        });
      });
    });
  });
});
