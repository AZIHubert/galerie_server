import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  cleanGoogleBuckets,
  createBlackList,
  createUser,
  getUsersUserNameUserName,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('/userName', () => {
    describe('/:userName', () => {
      describe('GET', () => {
        beforeAll(() => {
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
          it('do not return current user', async () => {
            const {
              body: {
                action,
                data: {
                  users,
                },
              },
              status,
            } = await getUsersUserNameUserName(app, token, user.userName);
            expect(action).toBe('GET');
            expect(status).toBe(200);
            expect(users.length).toBe(0);
          });
          it('do not return not confirmed users', async () => {
            const {
              user: {
                userName,
              },
            } = await createUser({
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
            } = await getUsersUserNameUserName(app, token, userName);
            expect(users.length).toBe(0);
          });
          it('do not return black listed users', async () => {
            const userName = 'user2';
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName,
            });
            await createBlackList({
              createdById: user.id,
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  users,
                },
              },
            } = await getUsersUserNameUserName(app, token, userName);
            expect(users.length).toBe(0);
          });
          it('return one user', async () => {
            const userName = 'user2';
            await createUser({
              email: 'user2@email.com',
              userName,
            });
            const {
              body: {
                data: {
                  users,
                },
              },
            } = await getUsersUserNameUserName(app, token, userName);
            expect(users.length).toBe(1);
            testUser(users[0]);
          });
          it('return a pack of 20 users', async () => {
            const NUM = 21;
            const userName = 'user';
            const numOfUsers = new Array(NUM).fill(0);
            await Promise.all(
              numOfUsers.map(async (_, index) => {
                await createUser({
                  email: `user${index + 2}@email.com`,
                  userName: `${userName}${index + 2}`,
                });
              }),
            );
            const {
              body: {
                data: {
                  users: firstPack,
                },
              },
            } = await getUsersUserNameUserName(app, token, userName);
            const {
              body: {
                data: {
                  users: secondPack,
                },
              },
            } = await getUsersUserNameUserName(app, token, userName, { page: 2 });
            expect(firstPack.length).toBe(20);
            expect(secondPack.length).toBe(1);
          });
          it('should be case insensitive', async () => {
            const userName = 'user2';
            await createUser({
              email: 'user2@email.com',
              userName,
            });
            const {
              body: {
                data: {
                  users,
                },
              },
            } = await getUsersUserNameUserName(app, token, userName.toUpperCase());
            expect(users.length).toBe(1);
          });
          it('order users by pseudonym', async () => {
            const userName = 'user';
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: `${userName}a`,
            });
            const { user: userThree } = await createUser({
              email: 'user3@email.com',
              userName: `${userName}b`,
            });
            const { user: userFour } = await createUser({
              email: 'user4@email.com',
              userName: `${userName}c`,
            });
            const { user: userFive } = await createUser({
              email: 'user5@email.com',
              userName: `${userName}d`,
            });
            const { user: userSix } = await createUser({
              email: 'user6@email.com',
              userName: `${userName}e`,
            });
            const {
              body: {
                data: {
                  users,
                },
              },
            } = await getUsersUserNameUserName(app, token, userName);
            expect(users.length).toBe(5);
            expect(users[0].id).toBe(userTwo.id);
            expect(users[1].id).toBe(userThree.id);
            expect(users[2].id).toBe(userFour.id);
            expect(users[3].id).toBe(userFive.id);
            expect(users[4].id).toBe(userSix.id);
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

            it('return non blackListed and blackListed users', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: `a${user.pseudonym}`,
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
              } = await getUsersUserNameUserName(app, tokenTwo, user.pseudonym);
              expect(users.length).toBe(2);
            });
            it('return only non blackListed users', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: `a${user.pseudonym}`,
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
              } = await getUsersUserNameUserName(app, tokenTwo, user.pseudonym, { blackListed: 'false' });
              expect(users.length).toBe(1);
              expect(users[0].id).toBe(user.id);
            });
            it('return only blacKlisted users', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: `a${user.pseudonym}`,
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
              } = await getUsersUserNameUserName(app, tokenTwo, user.pseudonym, { blackListed: 'true' });
              expect(users.length).toBe(1);
              expect(users[0].id).toBe(userTwo.id);
            });
          });
        });
      });
    });
  });
});
