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
  createBlackList,
  createGalerie,
  createGalerieBlackList,
  createGalerieUser,
  createUser,
  getGaleriesIdBlackListsId,
  testGalerieBlackList,
  testUser,
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
            let galerieBlackList: GalerieBlackList;

            beforeEach(async (done) => {
              try {
                const { user: createdUser } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                userTwo = createdUser;
                galerieBlackList = await createGalerieBlackList({
                  createdById: user.id,
                  galerieId,
                  userId: userTwo.id,
                });
              } catch (err) {
                done(err);
              }
              done();
            });

            it('return galerieBlackList', async () => {
              const {
                body: {
                  action,
                  data: {
                    blackList,
                    galerieId: returnedGalerieId,
                  },
                },
                status,
              } = await getGaleriesIdBlackListsId(app, token, galerieId, galerieBlackList.id);
              expect(action).toBe('GET');
              expect(returnedGalerieId).toBe(galerieId);
              expect(status).toBe(200);
              testGalerieBlackList(blackList, galerieBlackList);
              expect(blackList.createdBy.hasNewNotifications).toBeUndefined();
              expect(blackList.user.hasNewNotifications).toBeUndefined();
              testUser(blackList.createdBy, user);
              testUser(blackList.user, userTwo);
            });
            it('current user role for this galerie is \'admin\'', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const { token: tokenThree } = signAuthToken(userThree);
              await createGalerieUser({
                galerieId,
                role: 'admin',
                userId: userThree.id,
              });
              const {
                status,
              } = await getGaleriesIdBlackListsId(app, tokenThree, galerieId, galerieBlackList.id);
              expect(status).toBe(200);
            });
            it('blackList.user.isBlackListed === true if he\'s black listed', async () => {
              await createBlackList({
                createdById: user.id,
                userId: userTwo.id,
              });
              const {
                body: {
                  data: {
                    blackList,
                  },
                },
              } = await getGaleriesIdBlackListsId(app, token, galerieId, galerieBlackList.id);
              expect(blackList.user.isBlackListed).toBe(true);
            });
            it('blackList.createdBy.isBlackListed === true if he is \'globally\' black listed', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
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
                userId: userThree.id,
              });
              await createBlackList({
                createdById: user.id,
                userId: userFour.id,
              });
              const {
                body: {
                  data: {
                    blackList,
                  },
                },
              } = await getGaleriesIdBlackListsId(app, token, galerieId, galerieBlackListId);
              expect(blackList.createdBy.isBlackListed).toBe(true);
            });
            it('do not include createdBy if galerieBlackList.createdById === null', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const { id: galerieBlackListId } = await createGalerieBlackList({
                galerieId,
                userId: userThree.id,
              });
              const {
                body: {
                  data: {
                    blackList,
                  },
                },
              } = await getGaleriesIdBlackListsId(app, token, galerieId, galerieBlackListId);
              expect(blackList.createdBy).toBeNull();
            });
          });
          describe('should return status 400 if', () => {
            it('request.params.galerieId is not a UUIDv4', async () => {
              const {
                body,
                status,
              } = await getGaleriesIdBlackListsId(app, token, '100', '100');
              expect(body.errors).toBe(INVALID_UUID('galerie'));
              expect(status).toBe(400);
            });
            it('request.params.blackListId is not a UUIDv4', async () => {
              const {
                body,
                status,
              } = await getGaleriesIdBlackListsId(app, token, galerieId, '100');
              expect(body.errors).toBe(INVALID_UUID('black list'));
              expect(status).toBe(400);
            });
            it('current user role for this galerie is \'user\'', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              const {
                body,
                status,
              } = await getGaleriesIdBlackListsId(app, tokenTwo, galerieId, uuidv4());
              expect(body.errors).toBe('you\'re not allow get the black lists from this galerie');
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('galerie not found', async () => {
              const {
                body,
                status,
              } = await getGaleriesIdBlackListsId(app, token, uuidv4(), uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('galerie exist but user is not subscribe to it', async () => {
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
              } = await getGaleriesIdBlackListsId(app, token, galerieTwo.id, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('galerieBlackList not found', async () => {
              const {
                body,
                status,
              } = await getGaleriesIdBlackListsId(app, token, galerieId, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('black list'));
              expect(status).toBe(404);
            });
            it('galerieBlackList exist but it not belong to the galerie', async () => {
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
              } = await getGaleriesIdBlackListsId(app, token, galerieId, galerieBlackListId);
              expect(body.errors).toBe(MODEL_NOT_FOUND('black list'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
