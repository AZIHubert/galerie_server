import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Frame,
  Galerie,
  GalerieUser,
  GaleriePicture,
  Image,
  Invitation,
  Like,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  createFrame,
  createGalerie,
  createGalerieBlackList,
  createGalerieUser,
  createInvitation,
  createLike,
  createUser,
  deleteGaleriesIdUsersId,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('@src/helpers/gc', () => ({
  __esModule: true,
  default: ({
    bucket: () => ({
      file: () => ({
        delete: () => Promise.resolve(),
      }),
    }),
  }),
}));

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/users', () => {
      describe('/:userId', () => {
        describe('DELETE', () => {
          beforeAll(() => {
            sequelize = initSequelize();
            app = initApp();
          });

          beforeEach(async (done) => {
            jest.clearAllMocks();
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

            it('delete model GalerieUser', async () => {
              const {
                body: {
                  action,
                  data: {
                    galerieId: returnedGalerieId,
                    userId: returnedUserId,
                  },
                },
                status,
              } = await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const galerieUser = await GalerieUser.findOne({
                where: {
                  galerieId,
                  userId: userTwo.id,
                },
              });
              expect(action).toBe('DELETE');
              expect(galerieUser).toBeNull();
              expect(returnedGalerieId).toBe(galerieId);
              expect(returnedUserId).toBe(userTwo.id);
              expect(status).toBe(200);
            });
            it('delete all frames/galeriePictures/images posted by the deleted user', async () => {
              const createdFrame = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const frame = await Frame.findByPk(createdFrame.id);
              const galeriePictures = await GaleriePicture.findAll({
                where: {
                  id: createdFrame.galeriePictures
                    .map((galeriePicture) => galeriePicture.id),
                },
              });
              const images = await Image.findAll({
                where: {
                  id: createdFrame.galeriePictures
                    .map((galeriePicture) => galeriePicture.originalImageId),
                },
              });
              expect(frame).toBeNull();
              expect(galeriePictures.length).toBe(0);
              expect(images.length).toBe(0);
            });
            it('delete all likes posted on frames posted by the deleted user', async () => {
              const createdFrame = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              const { id: likeId } = await createLike({
                frameId: createdFrame.id,
                userId: user.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const like = await Like.findByPk(likeId);
              expect(like).toBeNull();
            });
            it('delete all likes posted by the deleted user', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              const { id: likeId } = await createLike({
                frameId,
                userId: userTwo.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const like = await Like.findByPk(likeId);
              expect(like).toBeNull();
            });
            it('decrement all frames.numOfLikes liked by the deleted user', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              await createLike({
                frameId,
                incrementNumOfLikes: true,
                userId: userTwo.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const frame = await Frame.findByPk(frameId) as Frame;
              expect(frame.numOfLikes).toBe(0);
            });
            it('delete all invitation posted by the deleted user', async () => {
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: userTwo.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const invitation = await Invitation.findByPk(invitationId);
              expect(invitation).toBeNull();
            });
            it('set createdById === null for all galerieBlackLists posted by the deleted user', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const galerieBlackList = await createGalerieBlackList({
                createdById: userTwo.id,
                galerieId,
                userId: userThree.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              await galerieBlackList.reload();
              expect(galerieBlackList.createdById).toBeNull();
            });
            it('do not set createdById === null for galerieBlackLists posted by other user', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const galerieBlackList = await createGalerieBlackList({
                createdById: user.id,
                galerieId,
                userId: userThree.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              await galerieBlackList.reload();
              expect(galerieBlackList.createdById).toBe(user.id);
            });
            it('do not set createdById === null for galerieBlackLists posted by the black listed user on other galeries', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const galerieTwo = await createGalerie({
                userId: userTwo.id,
              });
              const galerieBlackList = await createGalerieBlackList({
                createdById: userTwo.id,
                galerieId: galerieTwo.id,
                userId: userThree.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              await galerieBlackList.reload();
              expect(galerieBlackList.createdById).toBe(userTwo.id);
            });
            it('delete user if is an admin and current user is creator of this galerie', async () => {
              const {
                user: userThree,
              } = await createUser({
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
              } = await deleteGaleriesIdUsersId(app, tokenThree, galerieId, userTwo.id);
              expect(status).toBe(200);
            });
            describe('do not delete {{}} posted by other users', () => {
              it('frames', async () => {
                const { id: frameId } = await createFrame({
                  galerieId,
                  userId: user.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const frame = await Frame.findByPk(frameId);
                expect(frame).not.toBeNull();
              });
              it('likes', async () => {
                const { id: frameId } = await createFrame({
                  galerieId,
                  userId: user.id,
                });
                const { id: likeId } = await createLike({
                  frameId,
                  userId: user.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const like = await Like.findByPk(likeId);
                expect(like).not.toBeNull();
              });
              it('invitations', async () => {
                const { id: invitationId } = await createInvitation({
                  galerieId,
                  userId: user.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const invitation = await Invitation.findByPk(invitationId);
                expect(invitation).not.toBeNull();
              });
            });
            describe('do not delete {{}} from other galeries', () => {
              let galerieTwo: Galerie;

              beforeEach(async (done) => {
                try {
                  galerieTwo = await createGalerie({
                    userId: userTwo.id,

                  });
                } catch (err) {
                  done(err);
                }
                done();
              });

              it('frames', async () => {
                const { id: frameId } = await createFrame({
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const frame = await Frame.findByPk(frameId);
                expect(frame).not.toBeNull();
              });
              it('likes', async () => {
                const { id: frameId } = await createFrame({
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                const { id: likeId } = await createLike({
                  frameId,
                  userId: userTwo.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const like = await Like.findByPk(likeId);
                expect(like).not.toBeNull();
              });
              it('invitations', async () => {
                const { id: invitationId } = await createInvitation({
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const invitation = await Invitation.findByPk(invitationId);
                expect(invitation).not.toBeNull();
              });
            });
          });
          describe('should return status 400 if', () => {
            it('request.params.galerieId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, '100', uuidv4());
              expect(body.errors).toBe(INVALID_UUID('galerie'));
              expect(status).toBe(400);
            });
            it('request.params.userId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, uuidv4(), '100');
              expect(body.errors).toBe(INVALID_UUID('user'));
              expect(status).toBe(400);
            });
            it('request.params.userId is the same as current user.id', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, galerieId, user.id);
              expect(body.errors).toBe('you cannot delete yourself');
              expect(status).toBe(400);
            });
            it('the role of current user for this galerie is \'user\'', async () => {
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
              } = await deleteGaleriesIdUsersId(app, tokenTwo, galerieId, user.id);
              expect(body.errors).toBe('you should be an admin or the creator of this galerie to delete a user');
              expect(status).toBe(400);
            });
            it('user with :userId is the creator of this galerie', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              await createGalerieUser({
                galerieId,
                role: 'admin',
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, tokenTwo, galerieId, user.id);
              expect(body.errors).toBe('you can\'t delete the creator of this galerie');
              expect(status).toBe(400);
            });
            it('user with :userId is an admin and current user is an admin', async () => {
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
                role: 'admin',
                userId: userTwo.id,
              });
              await createGalerieUser({
                galerieId,
                role: 'admin',
                userId: userThree.id,
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, tokenTwo, galerieId, userThree.id);
              expect(body.errors).toBe('you should be the creator of this galerie to delete an admin');
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('galerie not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, uuidv4(), uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('galerie exist but current user is not subscribe to this galerie', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const galerieTwo = await createGalerie({
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, galerieTwo.id, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('user not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, galerieId, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
              expect(status).toBe(404);
            });
            it('user with id === :userId is not subscribe to this galerie', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
