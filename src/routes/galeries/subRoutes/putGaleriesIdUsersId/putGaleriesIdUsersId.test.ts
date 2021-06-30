import fs from 'fs';
import { Server } from 'http';
import { verify } from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import { User } from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createGalerie,
  createGalerieUser,
  createUser,
  putGaleriesIdUsersId,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/users', () => {
      describe('/:userId', () => {
        describe('PUT', () => {
          beforeAll(() => {
            sequelize = initSequelize();
            app = initApp();
          });

          beforeEach(async (done) => {
            try {
              await sequelize.sync({ force: true });
              const {
                user: createdUser,
              } = await createUser({
                role: 'admin',
              });
              user = createdUser;
              const jwt = signAuthToken(user);
              token = jwt.token;
              const galerie = await createGalerie({
                userId: user.id,
              });
              galerieId = galerie.id;
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
            let userTwo: User;

            beforeEach(async (done) => {
              try {
                const {
                  user: createdUser,
                } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                userTwo = createdUser;
                await createGalerieUser({
                  galerieId,
                  userId: userTwo.id,
                });
              } catch (err) {
                done(err);
              }
              done();
            });

            it('and update user\'s role to moderator if previous role was user', async () => {
              const {
                body: {
                  action,
                  data: {
                    galerieId: returnedGalerieId,
                    role,
                    userId: returnedUserId,
                  },
                },
                status,
              } = await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              expect(action).toBe('PUT');
              expect(returnedGalerieId).toBe(galerieId);
              expect(returnedUserId).toBe(userTwo.id);
              expect(role).toBe('moderator');
              expect(status).toBe(200);
            });
            it('update user\'s role to user if previous role was moderator', async () => {
              await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const {
                body: {
                  data: {
                    role,
                  },
                },
              } = await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              expect(role).toBe('user');
            });
            it('update user role if current user\'s role for this galerie is \'moderator\'', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const { token: tokenThree } = signAuthToken(userThree);
              await createGalerieUser({
                galerieId,
                role: 'moderator',
                userId: userThree.id,
              });
              const { status } = await putGaleriesIdUsersId(app, tokenThree, galerieId, userTwo.id);
              expect(status).toBe(200);
            });
            it('return notificationToken if role === \'moderator\'', async () => {
              const {
                body: {
                  data: {
                    notificationToken,
                  },
                },
                status,
              } = await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const PUB_KEY = fs.readFileSync(path.join('./id_rsa_pub.notificationToken.pem'));
              const splitToken = (<string>notificationToken).split(' ');
              const verifyToken = verify(splitToken[1], PUB_KEY) as {
                data: {
                  galerieId: string;
                  role: string;
                  userId: string;
                }
                type: string;
              };
              expect(notificationToken).not.toBeUndefined();
              expect(status).toBe(200);
              expect(verifyToken.data.galerieId).toBe(galerieId);
              expect(verifyToken.data.role).toBe('moderator');
              expect(verifyToken.data.userId).toBe(userTwo.id);
              expect(verifyToken.type).toBe('GALERIE_ROLE_CHANGE');
            });
            it('do not return notificationToken if role === \'user\'', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              await createGalerieUser({
                galerieId,
                role: 'moderator',
                userId: userThree.id,
              });
              const {
                body: {
                  data: {
                    notificationToken,
                  },
                },
                status,
              } = await putGaleriesIdUsersId(app, token, galerieId, userThree.id);
              expect(notificationToken).toBeUndefined();
              expect(status).toBe(200);
            });
          });
          describe('should return status 400 if', () => {
            it('request.params.galerieId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, '100', uuidv4());
              expect(body.errors).toBe(INVALID_UUID('galerie'));
              expect(status).toBe(400);
            });
            it('request.params.userId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, uuidv4(), '100');
              expect(body.errors).toBe(INVALID_UUID('user'));
              expect(status).toBe(400);
            });
            it('userId and current user id are the same', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, galerieId, user.id);
              expect(body.errors).toBe('you cannot change your role yourself');
              expect(status).toBe(400);
            });
            it('current user role for this galerie is \'user\'', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, tokenTwo, galerieId, user.id);
              expect(body.errors).toBe('you should be an admin or the moderator to update the role of a user');
              expect(status).toBe(400);
            });
            it('user\'s role is admin', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, tokenTwo, galerieId, user.id);
              expect(body.errors).toBe('you can\'t change the role of the admin of this galerie');
              expect(status).toBe(400);
            });
            it('user\'s role is moderator and current user role is moderator', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                user: userThree,
              } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              await createGalerieUser({
                galerieId,
                role: 'moderator',
                userId: userTwo.id,
              });
              await createGalerieUser({
                galerieId,
                userId: userThree.id,
              });
              await putGaleriesIdUsersId(app, token, galerieId, userThree.id);
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, tokenTwo, galerieId, userThree.id);
              expect(body.errors).toBe('you should be the admin of this galerie to update the role of a moderator');
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('galerie not found', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, uuidv4(), uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('galerie exist but current user is not subscribe to it', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const galerie = await createGalerie({
                name: 'galerie2',
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, galerie.id, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('user not found', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, galerieId, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
              expect(status).toBe(404);
            });
            it('user exist but is not subscribe to this galerie', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
