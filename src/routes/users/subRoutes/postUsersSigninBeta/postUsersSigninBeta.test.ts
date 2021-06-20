import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_CANNOT_CONTAIN_SPACES,
  FIELD_CANNOT_CONTAIN_SPECIAL_CHARS,
  FIELD_IS_ALREADY_TAKEN,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_PASSWORD,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_AN_EMAIL,
  FIELD_SHOULD_MATCH,
  FIELD_IS_REQUIRED,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  createBetaKey,
  postUsersSigninBeta,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;

describe('/users', () => {
  describe('/signin', () => {
    describe('/beta', () => {
      describe('POST', () => {
        beforeAll(() => {
          sequelize = initSequelize();
          app = initApp();
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
          it('create a user', async () => {
            const betaKey = await createBetaKey({});
            const password = 'Password0!';
            const {
              body: {
                action,
                data: {
                  user,
                },
              },
              status,
            } = await postUsersSigninBeta(app, {
              body: {
                betaKey: betaKey.code,
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'user',
              },
            });
            const users = await User.findAll();
            expect(action).toBe('POST');
            expect(status).toBe(200);
            expect(users.length).toBe(1);
            testUser(user);
          });
          it('create a user with user.userName === \'@request.body.userName\'', async () => {
            const betaKey = await createBetaKey({});
            const password = 'Password0!';
            const userName = 'userName';
            const {
              body: {
                data: {
                  user,
                },
              },
            } = await postUsersSigninBeta(app, {
              body: {
                betaKey: betaKey.code,
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName,
              },
            });
            const createdUser = await User.findByPk(user.id) as User;
            expect(createdUser.userName).toBe(`@${userName}`);
            expect(user.userName).toBe(`@${userName}`);
          });
          it('create a user with user.pseudonym === request.body.userName', async () => {
            const betaKey = await createBetaKey({});
            const password = 'Password0!';
            const userName = 'userName';
            const {
              body: {
                data: {
                  user,
                },
              },
            } = await postUsersSigninBeta(app, {
              body: {
                betaKey: betaKey.code,
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName,
              },
            });
            const createdUser = await User.findByPk(user.id) as User;
            expect(createdUser.pseudonym).toBe(userName);
            expect(user.pseudonym).toBe(userName);
          });
          it('trim request.body.betaKey', async () => {
            const betaKey = await createBetaKey({});
            const password = 'Password0!';
            const {
              status,
            } = await postUsersSigninBeta(app, {
              body: {
                betaKey: ` ${betaKey.code} `,
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'user',
              },
            });
            expect(status).toBe(200);
          });
          it('trim request.body.email', async () => {
            const betaKey = await createBetaKey({});
            const password = 'Password0!';
            const email = 'user2@email.com';
            const {
              body: {
                data: {
                  user,
                },
              },
            } = await postUsersSigninBeta(app, {
              body: {
                betaKey: betaKey.code,
                confirmPassword: password,
                email: ` ${email} `,
                password,
                userName: 'user',
              },
            });
            const createdUser = await User.findByPk(user.id) as User;
            expect(createdUser.email).toBe(email);
          });
          it('trim request.body.userName', async () => {
            const betaKey = await createBetaKey({});
            const password = 'Password0!';
            const userName = 'userName';
            const {
              body: {
                data: {
                  user,
                },
              },
            } = await postUsersSigninBeta(app, {
              body: {
                betaKey: betaKey.code,
                confirmPassword: password,
                email: 'user2@email.com',
                password,
                userName: ` ${userName} `,
              },
            });
            const createdUser = await User.findByPk(user.id) as User;
            expect(createdUser.userName).toBe(`@${userName}`);
            expect(createdUser.pseudonym).toBe(userName);
            expect(user.userName).toBe(`@${userName}`);
            expect(user.pseudonym).toBe(userName);
          });
          it('set email to lowercase', async () => {
            const betaKey = await createBetaKey({});
            const password = 'Password0!';
            const email = 'user@email.com';
            const {
              body: {
                data: {
                  user,
                },
              },
            } = await postUsersSigninBeta(app, {
              body: {
                betaKey: betaKey.code,
                confirmPassword: password,
                email: email.toUpperCase(),
                password,
                userName: 'userName',
              },
            });
            const createdUser = await User.findByPk(user.id) as User;
            expect(createdUser.email).toBe(email);
          });
          it('update betaKey', async () => {
            const betaKey = await createBetaKey({});
            const password = 'Password0!';
            const {
              body: {
                data: {
                  user,
                },
              },
            } = await postUsersSigninBeta(app, {
              body: {
                betaKey: betaKey.code,
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'userName',
              },
            });
            await betaKey.reload();
            expect(betaKey.userId).toBe(user.id);
          });
        });
        describe('should return status 400 if', () => {
          it('betaKey with code === request.body.code not found', async () => {
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSigninBeta(app, {
              body: {
                betaKey: 'wrong code',
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'userName',
              },
            });
            expect(body.errors).toEqual({
              betaKey: 'this betaKey doesn\'t exist',
            });
            expect(status).toBe(400);
          });
          it('betaKey is already used', async () => {
            const {
              user: {
                id: userId,
              },
            } = await createUser({});
            const betaKey = await createBetaKey({
              userId,
            });
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSigninBeta(app, {
              body: {
                betaKey: betaKey.code,
                confirmPassword: password,
                email: 'user2@email.com',
                password,
                userName: 'user2',
              },
            });
            expect(body.errors).toEqual({
              betaKey: 'this beta key is already used',
            });
            expect(status).toBe(400);
          });
          it('request.body.email is already used by a user', async () => {
            const { user } = await createUser({});
            const betaKey = await createBetaKey({});
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSigninBeta(app, {
              body: {
                betaKey: betaKey.code,
                confirmPassword: password,
                email: user.email,
                password,
                userName: 'userName',
              },
            });
            expect(body.errors).toEqual({
              email: FIELD_IS_ALREADY_TAKEN,
            });
            expect(status).toBe(400);
          });
          it('request.body.userName is already used by a user', async () => {
            const { user } = await createUser({});
            const betaKey = await createBetaKey({});
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSigninBeta(app, {
              body: {
                betaKey: betaKey.code,
                confirmPassword: password,
                email: 'user2@email.com',
                password,
                userName: user.pseudonym,
              },
            });
            expect(body.errors).toEqual({
              userName: FIELD_IS_ALREADY_TAKEN,
            });
            expect(status).toBe(400);
          });
          describe('request.body', () => {
            describe('.betaKey', () => {
              it('is not send', async () => {
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    confirmPassword: password,
                    email: 'user2@email.com',
                    password,
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  betaKey: FIELD_IS_REQUIRED,
                });
                expect(status).toBe(400);
              });
              it('is not a string', async () => {
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: 1234,
                    confirmPassword: password,
                    email: 'user2@email.com',
                    password,
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  betaKey: FIELD_SHOULD_BE_A_STRING,
                });
                expect(status).toBe(400);
              });
              it('is an empty string', async () => {
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: '',
                    confirmPassword: password,
                    email: 'user2@email.com',
                    password,
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  betaKey: FIELD_CANNOT_BE_EMPTY,
                });
                expect(status).toBe(400);
              });
            });
            describe('.confirmPassword', () => {
              it('is not send', async () => {
                const betaKey = await createBetaKey({});
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    email: 'user2@email.com',
                    password: 'Password0!',
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_IS_REQUIRED,
                });
                expect(status).toBe(400);
              });
              it('is not as string', async () => {
                const betaKey = await createBetaKey({});
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: 1234,
                    email: 'user2@email.com',
                    password: 'Password0!',
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_SHOULD_BE_A_STRING,
                });
                expect(status).toBe(400);
              });
              it('is empty', async () => {
                const betaKey = await createBetaKey({});
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: '',
                    email: 'user2@email.com',
                    password: 'Password0!',
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_CANNOT_BE_EMPTY,
                });
                expect(status).toBe(400);
              });
              it('not match password', async () => {
                const betaKey = await createBetaKey({});
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: `a${password}`,
                    email: 'user2@email.com',
                    password,
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_SHOULD_MATCH('password'),
                });
                expect(status).toBe(400);
              });
            });
            describe('.email', () => {
              it('is not send', async () => {
                const betaKey = await createBetaKey({});
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: password,
                    password,
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  email: FIELD_IS_REQUIRED,
                });
                expect(status).toBe(400);
              });
              it('is not a string', async () => {
                const betaKey = await createBetaKey({});
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: password,
                    email: 1234,
                    password,
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  email: FIELD_SHOULD_BE_A_STRING,
                });
                expect(status).toBe(400);
              });
              it('is an empty string', async () => {
                const betaKey = await createBetaKey({});
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: password,
                    email: '',
                    password,
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  email: FIELD_CANNOT_BE_EMPTY,
                });
                expect(status).toBe(400);
              });
              it('is not an email', async () => {
                const betaKey = await createBetaKey({});
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: password,
                    email: 'notAnEmail',
                    password,
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  email: FIELD_SHOULD_BE_AN_EMAIL,
                });
                expect(status).toBe(400);
              });
            });
            describe('.password', () => {
              it('is not send', async () => {
                const betaKey = await createBetaKey({});
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: 'Password0!',
                    email: 'user@email.com',
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_SHOULD_MATCH('password'),
                  password: FIELD_IS_REQUIRED,
                });
                expect(status).toBe(400);
              });
              it('is not a string', async () => {
                const betaKey = await createBetaKey({});
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: 'Password0!',
                    email: 'user@email.com',
                    password: 1234,
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_SHOULD_MATCH('password'),
                  password: FIELD_SHOULD_BE_A_STRING,
                });
                expect(status).toBe(400);
              });
              it('is an empty string', async () => {
                const betaKey = await createBetaKey({});
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: 'Password0!',
                    email: 'user@email.com',
                    password: '',
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_SHOULD_MATCH('password'),
                  password: FIELD_CANNOT_BE_EMPTY,
                });
                expect(status).toBe(400);
              });
              it('contain spaces', async () => {
                const betaKey = await createBetaKey({});
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: 'Password0!',
                    email: 'user@email.com',
                    password: 'Password 0!',
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_SHOULD_MATCH('password'),
                  password: FIELD_CANNOT_CONTAIN_SPACES,
                });
                expect(status).toBe(400);
              });
              it('has less than 8 characters', async () => {
                const betaKey = await createBetaKey({});
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: 'Password0!',
                    email: 'user@email.com',
                    password: 'Pa!0',
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_SHOULD_MATCH('password'),
                  password: FIELD_MIN_LENGTH(8),
                });
                expect(status).toBe(400);
              });
              it('has more than 30 characters', async () => {
                const betaKey = await createBetaKey({});
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: 'Password0!',
                    email: 'user@email.com',
                    password: 'a'.repeat(31),
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_SHOULD_MATCH('password'),
                  password: FIELD_MAX_LENGTH(30),
                });
                expect(status).toBe(400);
              });
              it('do not contain uppercase', async () => {
                const betaKey = await createBetaKey({});
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: 'Password0!',
                    email: 'user@email.com',
                    password: 'password0!',
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_SHOULD_MATCH('password'),
                  password: FIELD_SHOULD_BE_A_PASSWORD,
                });
                expect(status).toBe(400);
              });
              it('do not contain lowercase', async () => {
                const betaKey = await createBetaKey({});
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: 'Password0!',
                    email: 'user@email.com',
                    password: 'PASSWORD0!',
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_SHOULD_MATCH('password'),
                  password: FIELD_SHOULD_BE_A_PASSWORD,
                });
                expect(status).toBe(400);
              });
              it('do not contain number', async () => {
                const betaKey = await createBetaKey({});
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: 'Password0!',
                    email: 'user@email.com',
                    password: 'Password!',
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_SHOULD_MATCH('password'),
                  password: FIELD_SHOULD_BE_A_PASSWORD,
                });
                expect(status).toBe(400);
              });
              it('do not contain special character', async () => {
                const betaKey = await createBetaKey({});
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: 'Password0!',
                    email: 'user@email.com',
                    password: 'password0',
                    userName: 'user',
                  },
                });
                expect(body.errors).toEqual({
                  confirmPassword: FIELD_SHOULD_MATCH('password'),
                  password: FIELD_SHOULD_BE_A_PASSWORD,
                });
                expect(status).toBe(400);
              });
            });
            describe('.userName', () => {
              it('is not send', async () => {
                const betaKey = await createBetaKey({});
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: password,
                    email: 'user@email.com',
                    password,
                  },
                });
                expect(body.errors).toEqual({
                  userName: FIELD_IS_REQUIRED,
                });
                expect(status).toBe(400);
              });
              it('is not a string', async () => {
                const betaKey = await createBetaKey({});
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: password,
                    email: 'user@email.com',
                    password,
                    userName: 1234,
                  },
                });
                expect(body.errors).toEqual({
                  userName: FIELD_SHOULD_BE_A_STRING,
                });
                expect(status).toBe(400);
              });
              it('is an empty string', async () => {
                const betaKey = await createBetaKey({});
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: password,
                    email: 'user@email.com',
                    password,
                    userName: '',
                  },
                });
                expect(body.errors).toEqual({
                  userName: FIELD_CANNOT_BE_EMPTY,
                });
                expect(status).toBe(400);
              });
              it('contain spaces', async () => {
                const betaKey = await createBetaKey({});
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: password,
                    email: 'user@email.com',
                    password,
                    userName: 'user name',
                  },
                });
                expect(body.errors).toEqual({
                  userName: FIELD_CANNOT_CONTAIN_SPACES,
                });
                expect(status).toBe(400);
              });
              it('contain a special characters (#?!@$%^&*-.)', async () => {
                const betaKey = await createBetaKey({});
                const password = 'Password0!';
                const body = {
                  betaKey: betaKey.code,
                  confirmPassword: password,
                  email: 'user@email.com',
                  password,
                };
                const {
                  body: bodyOne,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    ...body,
                    userName: 'user.Name',
                  },
                });
                const {
                  body: bodyTwo,
                } = await postUsersSigninBeta(app, {
                  body: {
                    ...body,
                    userName: 'us@erName',
                  },
                });
                const {
                  body: bodyThree,
                } = await postUsersSigninBeta(app, {
                  body: {
                    ...body,
                    userName: 'userNa?me',
                  },
                });
                expect(bodyOne.errors).toEqual({
                  userName: FIELD_CANNOT_CONTAIN_SPECIAL_CHARS,
                });
                expect(bodyTwo.errors).toEqual({
                  userName: FIELD_CANNOT_CONTAIN_SPECIAL_CHARS,
                });
                expect(bodyThree.errors).toEqual({
                  userName: FIELD_CANNOT_CONTAIN_SPECIAL_CHARS,
                });
                expect(status).toBe(400);
              });
              it('has less than 3 characters', async () => {
                const betaKey = await createBetaKey({});
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: password,
                    email: 'user@email.com',
                    password,
                    userName: 'a'.repeat(2),
                  },
                });
                expect(body.errors).toEqual({
                  userName: FIELD_MIN_LENGTH(3),
                });
                expect(status).toBe(400);
              });
              it('has more than 30 characters', async () => {
                const betaKey = await createBetaKey({});
                const password = 'Password0!';
                const {
                  body,
                  status,
                } = await postUsersSigninBeta(app, {
                  body: {
                    betaKey: betaKey.code,
                    confirmPassword: password,
                    email: 'user@email.com',
                    password,
                    userName: 'a'.repeat(31),
                  },
                });
                expect(body.errors).toEqual({
                  userName: FIELD_MAX_LENGTH(30),
                });
                expect(status).toBe(400);
              });
            });
          });
        });
      });
    });
  });
});
