import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  Report,
  User,
} from '#src/db/models';

import {
  DEFAULT_ERROR_MESSAGE,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createFrame,
  createGalerie,
  createProfilePicture,
  createReport,
  createUser,
  getReportsId,
  testReport,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let moderator: User;

describe('/reports', () => {
  describe('/:reportId', () => {
    describe('GET', () => {
      beforeAll(() => {
        sequelize = initSequelize();
        app = initApp();
      });

      beforeEach(async (done) => {
        try {
          await sequelize.sync({ force: true });
          const {
            user,
          } = await createUser({
            role: 'moderator',
          });
          moderator = user;
          const jwt = signAuthToken(moderator);
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
        it('return report with type === \'FRAME\'', async () => {
          const { id: galerieId } = await createGalerie({
            userId: moderator.id,
          });
          const { id: frameId } = await createFrame({
            galerieId,
            userId: moderator.id,
          });
          const report = await createReport({
            frameId,
          });
          const {
            body: {
              action,
              data: {
                report: returnReport,
              },
            },
            status,
          } = await getReportsId(app, token, report.id);
          expect(action);
          expect(returnReport.frame.autoIncrementId).not.toBeUndefined();
          expect(returnReport.frame.createdAt).not.toBeUndefined();
          expect(returnReport.frame.description).not.toBeUndefined();
          expect(returnReport.frame.galerieId).not.toBeUndefined();
          expect(returnReport.frame.id).not.toBeUndefined();
          expect(returnReport.frame.notificationHasBeenSend).toBeUndefined();
          expect(returnReport.frame.numOfLikes).not.toBeUndefined();
          expect(returnReport.frame.updatedAt).toBeUndefined();
          expect(returnReport.frame.userId).not.toBeUndefined();
          expect(returnReport.profilePicture).toBeUndefined();
          expect(returnReport.type).toBe('FRAME');
          expect(status).toBe(200);
          testReport(returnReport, report);
        });
        it('return report with type === \'PROFILE_PICTURE\'', async () => {
          const { id: profilePictureId } = await createProfilePicture({
            userId: moderator.id,
          });
          const report = await createReport({
            profilePictureId,
          });
          const {
            body: {
              data: {
                report: returnReport,
              },
            },
          } = await getReportsId(app, token, report.id);
          expect(returnReport.frame).toBeUndefined();
          expect(returnReport.profilePicture.autoIncrementId).not.toBeUndefined();
          expect(returnReport.profilePicture.createdAt).not.toBeUndefined();
          expect(returnReport.profilePicture.cropedImageId).toBeUndefined();
          expect(returnReport.profilePicture.current).not.toBeUndefined();
          expect(returnReport.profilePicture.originalImageId).toBeUndefined();
          expect(returnReport.profilePicture.id).not.toBeUndefined();
          expect(returnReport.profilePicture.updatedAt).toBeUndefined();
          expect(returnReport.profilePicture.userId).not.toBeUndefined();
          expect(returnReport.type).toBe('PROFILE_PICTURE');
          testReport(returnReport, report);
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.reportId is not a UUIDv4', async () => {
          const {
            body,
            status,
          } = await getReportsId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('report'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('report not found', async () => {
          const {
            body,
            status,
          } = await getReportsId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('report'));
          expect(status).toBe(404);
        });
      });
      describe('should return status 500 if', () => {
        it('report.frameId === null && report.profilePictureId === null', async () => {
          const { id: reportId } = await createReport({});
          const {
            body,
            status,
          } = await getReportsId(app, token, reportId);
          const report = await Report.findByPk(reportId);
          expect(body.errors).toBe(DEFAULT_ERROR_MESSAGE);
          expect(report).toBeNull();
          expect(status).toBe(500);
        });
      });
    });
  });
});
