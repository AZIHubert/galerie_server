import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  Frame,
  GaleriePicture,
  Image,
  Like,
  Notification,
  NotificationFramePosted,
  Report,
  ReportUser,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createFrame,
  createGalerie,
  createGalerieUser,
  createLike,
  createNotificationFrameLiked,
  createNotificationFramePosted,
  createReport,
  createUser,
  deleteFramesId,
} from '#src/helpers/test';

import initApp from '#src/server';

jest.mock('#src/helpers/gc', () => ({
  __esModule: true,
  default: ({
    bucket: () => ({
      file: () => ({
        delete: () => Promise.resolve(),
      }),
    }),
  }),
}));

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/frames', () => {
      describe('/:frameId', () => {
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

          describe('it should return status 200 and', () => {
            it('delete frame', async () => {
              const createdFrame = await createFrame({
                galerieId,
                userId: user.id,
              });
              const {
                body: {
                  action,
                  data,
                },
                status,
              } = await deleteFramesId(app, token, createdFrame.id);
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
              expect(action).toBe('DELETE');
              expect(data.frameId).toBe(createdFrame.id);
              expect(data.galerieId).toBe(galerieId);
              expect(frame).toBeNull();
              expect(galeriePictures.length).toBe(0);
              expect(images.length).toBe(0);
              expect(status).toBe(200);
            });
            it('destroy all likes', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              const { id: likeId } = await createLike({
                frameId,
                userId: user.id,
              });
              await deleteFramesId(app, token, frameId);
              const like = await Like.findOne({
                where: {
                  id: likeId,
                },
              });
              expect(like).toBeNull();
            });
            it('destroy frame if it\'s not posted by current user but his role fot this galerie is \'admin\'', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const { id: frameId } = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              await deleteFramesId(app, token, frameId);
              const frame = await Frame.findByPk(frameId);
              expect(frame).toBeNull();
            });
            it('destroy frame if it\'s not posted by current user but his role for this galerie is \'moderator\'', async () => {
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
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              await createGalerieUser({
                galerieId,
                role: 'moderator',
                userId: userThree.id,
              });
              const { token: tokenThree } = signAuthToken(userThree);
              const { id: frameId } = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              await deleteFramesId(app, tokenThree, frameId);
              const frame = await Frame.findByPk(frameId);
              expect(frame).toBeNull();
            });
            it('destroy frame if it\'s not posted by current user but currentUser.role is \'moderator\'', async () => {
              const { user: moderator } = await createUser({
                email: 'moderator@email.com',
                role: 'moderator',
                userName: 'moderator',
              });
              const { token: tokenTwo } = signAuthToken(moderator);
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              await deleteFramesId(app, tokenTwo, frameId);
              const frame = await Frame.findByPk(frameId);
              expect(frame).toBeNull();
            });
            it('decrement all notifications where type === \'FRAME_POSTED\', num > 1 && notification.framePosted.id === request.params.frameId', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const frameOne = await createFrame({
                galerieId,
                userId: user.id,
              });
              const frameTwo = await createFrame({
                galerieId,
                userId: user.id,
              });
              const notification = await createNotificationFramePosted({
                frameId: frameOne.id,
                galerieId,
                userId: userTwo.id,
              });
              await NotificationFramePosted.create({
                frameId: frameTwo.id,
                notificationId: notification.id,
              });
              await notification.increment({ num: 1 });
              await deleteFramesId(app, token, frameOne.id);
              await notification.reload();
              const notificationFramePosted = await NotificationFramePosted.findOne({
                where: {
                  notificationId: notification.id,
                  frameId: frameOne.id,
                },
              });
              expect(notification.num).toBe(1);
              expect(notificationFramePosted).toBeNull();
            });
            it('destroy all notifications where type === \'FRAME_POSTED\', num <= 1 && notification.framePosted.id === request.params.frameId', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              const { id: notificationId } = await createNotificationFramePosted({
                frameId,
                galerieId,
                userId: userTwo.id,
              });
              await deleteFramesId(app, token, frameId);
              const notification = await Notification.findByPk(notificationId);
              expect(notification).toBeNull();
            });
            it('destroy notification where type === \'FRAME_LIKED\' and frameId === request.params.frameId', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              await createLike({
                frameId,
                userId: userTwo.id,
              });
              const { id: notificationId } = await createNotificationFrameLiked({
                frameId,
                likedById: userTwo.id,
                userId: user.id,
              });
              await deleteFramesId(app, token, frameId);
              const notification = await Notification.findByPk(notificationId);
              expect(notification).toBeNull();
            });
            it('destoy reports', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              const { id: reportId } = await createReport({
                frameId,
                userId: user.id,
              });
              await deleteFramesId(app, token, frameId);
              const report = await Report.findByPk(reportId);
              const reportUser = await ReportUser.findOne({
                where: {
                  reportId,
                  userId: user.id,
                },
              });
              expect(report).toBeNull();
              expect(reportUser).toBeNull();
            });
          });
          describe('it should return status 400', () => {
            it('req.params.frameId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await deleteFramesId(app, token, '100');
              expect(body.errors).toBe(INVALID_UUID('frame'));
              expect(status).toBe(400);
            });
            it('user\'s role for this galerie is \'user\'', async () => {
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
              const { token: tokenThree } = signAuthToken(userThree);
              const { id: frameId } = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await deleteFramesId(app, tokenThree, frameId);
              expect(body.errors).toBe('your not allow to delete this frame');
              expect(status).toBe(400);
            });
            it('the user who post the frame is the admin of this galerie and the role of current user for this galerie is \'moderator\'', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                role: 'moderator',
                userId: userTwo.id,
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              const {
                body,
                status,
              } = await deleteFramesId(app, tokenTwo, frameId);
              expect(body.errors).toBe('your not allow to delete this frame');
              expect(status).toBe(400);
            });
          });
          describe('it should return status 404', () => {
            it('frame not found', async () => {
              const {
                body,
                status,
              } = await deleteFramesId(app, token, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
              expect(status).toBe(404);
            });
            it('frame exist but currentUser is not susbcribe to the galerie it was posted', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const galerieTwo = await createGalerie({
                userId: userTwo.id,
              });
              const { id: frameId } = await createFrame({
                galerieId: galerieTwo.id,
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await deleteFramesId(app, token, frameId);
              expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
