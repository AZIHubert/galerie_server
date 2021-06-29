import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '#src/helpers/initEnv';

import {
  User,
} from '#src/db/models';

import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createBlackList,
  createUser,
  getUsers,
  testUser,
} from '#src/helpers/test';

import initApp from '#src/server';

jest.mock('#src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('GET', () => {
    beforeAll(() => {
      sequelize = initSequelize();
      app = initApp();
    });

    beforeEach(async (done) => {
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
        it('exept black listed users...', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await createBlackList({
            userId: userTwo.id,
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
        it('...even if request.params.blackListed === \'true\'', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await createBlackList({
            userId: userTwo.id,
          });
          const {
            body: {
              data: {
                users,
              },
            },
          } = await getUsers(app, token, { blackListed: 'true' });
          expect(users.length).toBe(0);
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
          expect(users[0].hasNewNotifications).toBeUndefined();
          testUser(users[0]);
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
          } = await getUsers(app, token, {
            previousUser: firstPack[firstPack.length - 1].userName,
          });
          expect(firstPack.length).toBe(20);
          expect(secondPack.length).toBe(1);
        });
        it('order users by userName (ASC)', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'e',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'd',
          });
          const { user: userFour } = await createUser({
            email: 'user4@email.com',
            userName: 'c',
          });
          const { user: userFive } = await createUser({
            email: 'user5@email.com',
            userName: 'b',
          });
          const { user: userSix } = await createUser({
            email: 'user6@email.com',
            userName: 'a',
          });
          const {
            body: {
              data: {
                users,
              },
            },
          } = await getUsers(app, token);
          expect(users.length).toBe(5);
          expect(users[0].id).toBe(userSix.id);
          expect(users[1].id).toBe(userFive.id);
          expect(users[2].id).toBe(userFour.id);
          expect(users[3].id).toBe(userThree.id);
          expect(users[4].id).toBe(userTwo.id);
        });
        it('filter by userName', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'a',
          });
          await createUser({
            email: 'user3@email.com',
            userName: 'b',
          });
          const {
            body: {
              data: {
                users,
              },
            },
          } = await getUsers(app, token, {
            userName: 'a',
          });
          expect(users.length).toBe(1);
          expect(users[0].id).toBe(userTwo.id);
        });
        it('filter by userName should be case insensitive', async () => {
          const userName = 'user2';
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName,
          });
          const {
            body: {
              data: {
                users,
              },
            },
          } = await getUsers(app, token, {
            userName: userName.toUpperCase(),
          });
          expect(users.length).toBe(1);
          expect(users[0].id).toBe(userTwo.id);
        });
        describe('if currentUser.role === \'admin\' | \'superAdmin\'', () => {
          let tokenTwo: string;

          beforeEach(async (done) => {
            try {
              const { user: createdUser } = await createUser({
                email: 'admin@email.com',
                role: 'admin',
                userName: 'admin',
              });
              const jwt = signAuthToken(createdUser);
              tokenTwo = jwt.token;
            } catch (err) {
              done(err);
            }
            done();
          });

          it('return non blacklisted and blackListed users', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createBlackList({
              userId: userTwo.id,
              createdById: user.id,
            });
            const {
              body: {
                data: {
                  users,
                },
              },
            } = await getUsers(app, tokenTwo);
            expect(users.length).toBe(2);
          });
          it('return only non blackListed users', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createBlackList({
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  users,
                },
              },
            } = await getUsers(app, tokenTwo, { blackListed: 'false' });
            expect(users.length).toBe(1);
            expect(users[0].id).toBe(user.id);
          });
          it('return only blackListed users', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createBlackList({
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  users,
                },
              },
            } = await getUsers(app, tokenTwo, { blackListed: 'true' });
            expect(users.length).toBe(1);
            expect(users[0].id).toBe(userTwo.id);
          });
        });
      });
    });
  });
});
