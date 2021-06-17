import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Image,
  GalerieBlackList,
  ProfilePicture,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  createBlackList,
  createGalerie,
  createGalerieBlackList,
  createGalerieUser,
  createProfilePicture,
  createUser,
  getGaleriesIdBlackListsId,
  testProfilePicture,
  testGalerieBlackList,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('@src/helpers/signedUrl', () => jest.fn());

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
            jest.clearAllMocks();
            (signedUrl as jest.Mock).mockImplementation(() => ({
              OK: true,
              signedUrl: 'signedUrl',
            }));
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
                  adminId: user.id,
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
              testUser(blackList.admin, user);
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
            it('do not return user if he\'s black listed', async () => {
              await createBlackList({
                adminId: user.id,
                userId: userTwo.id,
              });
              const {
                body: {
                  data: {
                    blackList,
                  },
                },
              } = await getGaleriesIdBlackListsId(app, token, galerieId, galerieBlackList.id);
              expect(blackList.user).toBeNull();
            });
            it('include user current profile picture', async () => {
              const profilePicture = await createProfilePicture({
                userId: userTwo.id,
              });
              const {
                body: {
                  data: {
                    blackList,
                  },
                },
              } = await getGaleriesIdBlackListsId(app, token, galerieId, galerieBlackList.id);

              testProfilePicture(blackList.user.currentProfilePicture, profilePicture);
            });
            it('do not include user current profile picture if signedUrl.OK === false', async () => {
              (signedUrl as jest.Mock).mockImplementation(() => ({
                OK: false,
              }));
              const { id: profilePictureId } = await createProfilePicture({
                userId: userTwo.id,
              });
              const {
                body: {
                  data: {
                    blackList,
                  },
                },
              } = await getGaleriesIdBlackListsId(app, token, galerieId, galerieBlackList.id);
              const images = await Image.findAll();
              const profilePicture = await ProfilePicture.findByPk(profilePictureId);
              expect(blackList.user.currentProfilePicture).toBeNull();
              expect(images.length).toBe(0);
              expect(profilePicture).toBeNull();
            });
            it('do not include admin if he is \'globally\' black listed', async () => {
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
                adminId: userFour.id,
                galerieId,
                userId: userThree.id,
              });
              await createBlackList({
                adminId: user.id,
                userId: userFour.id,
              });
              const {
                body: {
                  data: {
                    blackList,
                  },
                },
              } = await getGaleriesIdBlackListsId(app, token, galerieId, galerieBlackListId);
              expect(blackList.admin).toBeNull();
            });
            it('do not include admin if galerieBlackList.admiId === null', async () => {
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
              expect(blackList.admin).toBeNull();
            });
            it('include admin current profile picture', async () => {
              const profilePicture = await createProfilePicture({
                userId: user.id,
              });
              const {
                body: {
                  data: {
                    blackList,
                  },
                },
              } = await getGaleriesIdBlackListsId(app, token, galerieId, galerieBlackList.id);
              testProfilePicture(blackList.admin.currentProfilePicture, profilePicture);
            });
            it('do not include user admin profile picture if signedUrl.OK === false', async () => {
              (signedUrl as jest.Mock).mockImplementation(() => ({
                OK: false,
              }));
              const { id: profilePictureId } = await createProfilePicture({
                userId: user.id,
              });
              const {
                body: {
                  data: {
                    blackList,
                  },
                },
              } = await getGaleriesIdBlackListsId(app, token, galerieId, galerieBlackList.id);
              const images = await Image.findAll();
              const profilePicture = await ProfilePicture.findByPk(profilePictureId);
              expect(blackList.admin.currentProfilePicture).toBeNull();
              expect(images.length).toBe(0);
              expect(profilePicture).toBeNull();
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
                userId: user.id,
              });
              const { id: galerieBlackListId } = await createGalerieBlackList({
                adminId: user.id,
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
