import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  GalerieBlackList,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createGalerie,
  createGalerieBlackList,
  deleteGaleriesIdBlackListsId,
  createGalerieUser,
  createUser,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/blackLists', () => {
      describe('/:blackListId', () => {
        describe('DELETE', () => {
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
                role: 'superAdmin',
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
                const { user: createdUser } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                userTwo = createdUser;
              } catch (err) {
                done(err);
              }
              done();
            });

            it('delete a galerieBlackList', async () => {
              const { id: galerieBlackListId } = await createGalerieBlackList({
                createdById: user.id,
                galerieId,
                userId: userTwo.id,
              });
              const {
                body: {
                  action,
                  data: {
                    blackListId,
                    galerieId: returnedGalerieId,
                  },
                },
                status,
              } = await deleteGaleriesIdBlackListsId(app, token, galerieId, galerieBlackListId);
              const galerieBlackList = await GalerieBlackList.findByPk(galerieBlackListId);
              expect(action).toBe('DELETE');
              expect(blackListId).toBe(galerieBlackListId);
              expect(galerieBlackList).toBeNull();
              expect(returnedGalerieId).toBe(galerieId);
              expect(status).toBe(200);
            });
            describe('current user\'s role for this galerie is \'admin\' but', () => {
              let userThree: User;
              let tokenThree: string;

              beforeEach(async (done) => {
                try {
                  const { user: createdUser } = await createUser({
                    email: 'user3@email.com',
                    userName: 'user3',
                  });
                  userThree = createdUser;
                  await createGalerieUser({
                    galerieId,
                    role: 'admin',
                    userId: userThree.id,
                  });
                  const jwt = signAuthToken(userThree);
                  tokenThree = jwt.token;
                } catch (err) {
                  done(err);
                }
                done();
              });

              it('current user\'s role for this galerie is \'admin\' but galerieBlackList.createdById === null', async () => {
                const { id: galerieBlackListId } = await createGalerieBlackList({
                  galerieId,
                  userId: userTwo.id,
                });
                const {
                  status,
                } = await deleteGaleriesIdBlackListsId(
                  app,
                  tokenThree,
                  galerieId,
                  galerieBlackListId,
                );
                const galerieBlackList = await GalerieBlackList.findByPk(galerieBlackListId);
                expect(galerieBlackList).toBeNull();
                expect(status).toBe(200);
              });
              it('this galerieBlackList was posted by him', async () => {
                const { id: galerieBlackListId } = await createGalerieBlackList({
                  createdById: userThree.id,
                  galerieId,
                  userId: userTwo.id,
                });
                const {
                  status,
                } = await deleteGaleriesIdBlackListsId(
                  app,
                  tokenThree,
                  galerieId,
                  galerieBlackListId,
                );
                const galerieBlackList = await GalerieBlackList.findByPk(galerieBlackListId);
                expect(galerieBlackList).toBeNull();
                expect(status).toBe(200);
              });
              it('this galerieBlackList was posted by another admin', async () => {
                const { user: userFour } = await createUser({
                  email: 'user4@email.com',
                  userName: 'user4',
                });
                await createGalerieUser({
                  galerieId,
                  role: 'admin',
                  userId: userFour.id,
                });
                const { id: galerieBlackListId } = await createGalerieBlackList({
                  createdById: userFour.id,
                  galerieId,
                  userId: userTwo.id,
                });
                const {
                  status,
                } = await deleteGaleriesIdBlackListsId(
                  app,
                  tokenThree,
                  galerieId,
                  galerieBlackListId,
                );
                const galerieBlackList = await GalerieBlackList.findByPk(galerieBlackListId);
                expect(galerieBlackList).toBeNull();
                expect(status).toBe(200);
              });
            });
          });
          describe('should return status 400 if', () => {
            it('request.params.galerieId is not a UUIDv4', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdBlackListsId(app, token, '100', '100');
              expect(body.errors).toBe(INVALID_UUID('galerie'));
              expect(status).toBe(400);
            });
            it('request.params.blackListId is not a UUIDv4', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdBlackListsId(app, token, galerieId, '100');
              expect(body.errors).toBe(INVALID_UUID('black list'));
              expect(status).toBe(400);
            });
            it('current user\'s role for this galerie is \'user\'', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const { id: galerieBlackListId } = await createGalerieBlackList({
                createdById: user.id,
                galerieId,
                userId: userThree.id,
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdBlackListsId(app, tokenTwo, galerieId, galerieBlackListId);
              expect(body.errors).toBe('you\'re not allow to delete a black list from this galerie');
              expect(status).toBe(400);
            });
            it('current user\'s role for this galerie is \'admin\' and the galerieBlackList was post by the creator of this galerie', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              await createGalerieUser({
                galerieId,
                role: 'admin',
                userId: userTwo.id,
              });
              const { id: galerieBlackListId } = await createGalerieBlackList({
                createdById: user.id,
                galerieId,
                userId: userThree.id,
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdBlackListsId(app, tokenTwo, galerieId, galerieBlackListId);
              expect(body.errors).toBe('you\'re not allow to delete a black list posted by the creator of this galerie');
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('galerie not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdBlackListsId(app, token, uuidv4(), uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('galerie exist but current user is not subscribe to it', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const galerieTwo = await createGalerie({
                name: 'galerie2',
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdBlackListsId(app, token, galerieTwo.id, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('galeriesBlackList not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdBlackListsId(app, token, galerieId, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('black list'));
              expect(status).toBe(404);
            });
            it('galerieBlackList exist but was not post on this galerie', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const galerieTwo = await createGalerie({
                name: 'galerie2',
                userId: user.id,
              });
              const { id: galerieBlackListId } = await createGalerieBlackList({
                createdById: user.id,
                galerieId: galerieTwo.id,
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdBlackListsId(app, token, galerieId, galerieBlackListId);
              expect(body.errors).toBe(MODEL_NOT_FOUND('black list'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
