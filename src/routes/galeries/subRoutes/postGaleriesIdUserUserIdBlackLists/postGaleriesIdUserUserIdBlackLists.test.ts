import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  GalerieBlackList,
  GalerieUser,
  Image,
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
  createGalerie,
  createGalerieBlackList,
  createGalerieUser,
  createProfilePicture,
  createUser,
  postGaleriesIdUserUserIdBlackLists,
  testGalerieBlackList,
  testProfilePicture,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/users', () => {
      describe('/:userId', () => {
        describe('/blackList', () => {
          describe('POST', () => {
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
                } = await createUser({});
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

              beforeEach(async (done) => {
                try {
                  const { user: createdUser } = await createUser({
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
              it('blackList a user', async () => {
                const {
                  body: {
                    action,
                    data: {
                      galerieBlackList,
                      galerieId: returnedGalerieId,
                      userId,
                    },
                  },
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const createdGAlerieBlackList = await GalerieBlackList
                  .findByPk(galerieBlackList.id);
                expect(action).toBe('POST');
                expect(createdGAlerieBlackList).not.toBeNull();
                expect(returnedGalerieId).toBe(galerieId);
                expect(userId).toBe(userTwo.id);
                expect(status).toBe(200);
                testGalerieBlackList(galerieBlackList);
                testUser(galerieBlackList.admin);
                testUser(galerieBlackList.user);
              });
              it('include user current profile picture', async () => {
                await createProfilePicture({
                  userId: userTwo.id,
                });
                const {
                  body: {
                    data: {
                      galerieBlackList: {
                        user: {
                          currentProfilePicture,
                        },
                      },
                    },
                  },
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                testProfilePicture(currentProfilePicture);
              });
              it('include admin current profile picture', async () => {
                await createProfilePicture({
                  userId: user.id,
                });
                const {
                  body: {
                    data: {
                      galerieBlackList: {
                        admin: {
                          currentProfilePicture,
                        },
                      },
                    },
                  },
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                testProfilePicture(currentProfilePicture);
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
                      galerieBlackList: {
                        user: {
                          currentProfilePicture,
                        },
                      },
                    },
                  },
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const profilePicture = await ProfilePicture.findByPk(profilePictureId);
                const images = await Image.findAll();
                expect(currentProfilePicture).toBeNull();
                expect(profilePicture).toBeNull();
                expect(images.length).toBe(0);
              });
              it('do not include user current profile picture if signedUrl.OK === false', async () => {
                (signedUrl as jest.Mock).mockImplementation(() => ({
                  OK: false,
                }));
                const { id: profilePictureId } = await createProfilePicture({
                  userId: user.id,
                });
                const {
                  body: {
                    data: {
                      galerieBlackList: {
                        admin: {
                          currentProfilePicture,
                        },
                      },
                    },
                  },
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const profilePicture = await ProfilePicture.findByPk(profilePictureId);
                const images = await Image.findAll();
                expect(currentProfilePicture).toBeNull();
                expect(profilePicture).toBeNull();
                expect(images.length).toBe(0);
              });
              it('delete GalerieUser', async () => {
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const galerieUser = await GalerieUser.findOne({
                  where: {
                    galerieId,
                    userId: userTwo.id,
                  },
                });
                expect(galerieUser).toBeNull();
              });
              it('do not destroy other GalerieUser', async () => {
                const galerieTwo = await createGalerie({
                  userId: user.id,
                });
                const galerieThree = await createGalerie({
                  userId: userTwo.id,
                });
                await createGalerieUser({
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const galerieUserOne = await GalerieUser.findOne({
                  where: {
                    galerieId: galerieTwo.id,
                    userId: userTwo.id,
                  },
                });
                const galerieUserTwo = await GalerieUser.findOne({
                  where: {
                    galerieId: galerieThree.id,
                    userId: userTwo.id,
                  },
                });
                const galerieUserThree = await GalerieUser.findOne({
                  where: {
                    galerieId,
                    userId: user.id,
                  },
                });
                expect(galerieUserOne).not.toBeNull();
                expect(galerieUserTwo).not.toBeNull();
                expect(galerieUserThree).not.toBeNull();
              });
              it('blackList an admin of this galerie if current user is the creator of this galerie', async () => {
                const { user: userThree } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                await createGalerieUser({
                  galerieId,
                  role: 'admin',
                  userId: userThree.id,
                });
                const {
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                expect(status).toBe(200);
              });
              it('blackList a user even if is blackListed from other galeries', async () => {
                const galerieTwo = await createGalerie({
                  userId: user.id,
                });
                await createGalerieBlackList({
                  adminId: user.id,
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                const {
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                expect(status).toBe(200);
              });
            });
            describe('should return status 400 if', () => {
              it('request.body.galerieId is not a UUID v4', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, '100', '100');
                expect(body.errors).toBe(INVALID_UUID('galerie'));
                expect(status).toBe(400);
              });
              it('request.body.userId is not a UUID v4', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, '100');
                expect(body.errors).toBe(INVALID_UUID('user'));
                expect(status).toBe(400);
              });
              it('currentUser.id === request.body.userId', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, user.id);
                expect(body.errors).toBe('you can\'t black list yourself');
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
                await createGalerieUser({
                  galerieId,
                  userId: userTwo.id,
                });
                await createGalerieUser({
                  galerieId,
                  userId: userThree.id,
                });
                const { token: tokenTwo } = signAuthToken(userTwo);
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(
                  app,
                  tokenTwo,
                  galerieId,
                  userThree.id,
                );
                expect(body.errors).toBe('you\'re not allow to black list a user from this galerie');
                expect(status).toBe(400);
              });
              it('user is the creator of this galerie', async () => {
                const { user: userTwo } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                await createGalerieUser({
                  galerieId,
                  role: 'admin',
                  userId: userTwo.id,
                });
                const { token: tokenTwo } = signAuthToken(userTwo);
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, tokenTwo, galerieId, user.id);
                expect(body.errors).toBe('the creator of this galerie can\'t be black listed');
                expect(status).toBe(400);
              });
              it('user and currentUser role for this galerie is \'admin\'', async () => {
                const { user: userTwo } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const { user: userThree } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                await createGalerieUser({
                  galerieId,
                  role: 'admin',
                  userId: userTwo.id,
                });
                await createGalerieUser({
                  galerieId,
                  role: 'admin',
                  userId: userThree.id,
                });
                const { token: tokenTwo } = signAuthToken(userTwo);
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(
                  app,
                  tokenTwo,
                  galerieId,
                  userThree.id,
                );
                expect(body.errors).toBe('you\re not allow to black list an admin');
                expect(status).toBe(400);
              });
              it('user is already blackListed', async () => {
                const { user: userTwo } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                await createGalerieUser({
                  galerieId,
                  userId: userTwo.id,
                });
                await createGalerieBlackList({
                  adminId: user.id,
                  galerieId,
                  userId: userTwo.id,
                });
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const galerieUser = await GalerieUser.findOne({
                  where: {
                    galerieId,
                    userId: userTwo.id,
                  },
                });
                expect(body.errors).toBe('this user is already black listed from this galerie');
                expect(galerieUser).toBeNull();
                expect(status).toBe(400);
              });
            });
            describe('should return status 404 if', () => {
              it('galerie not found', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, uuidv4(), uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
                expect(status).toBe(404);
              });
              it('galerie exist but current user is not subscribe to it', async () => {
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
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieTwo.id, uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
                expect(status).toBe(404);
              });
              it('user not found', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
                expect(status).toBe(404);
              });
              it('user exist but is not subscribed to this galerie', async () => {
                const { user: userTwo } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
                expect(status).toBe(404);
              });
            });
          });
        });
      });
    });
  });
});