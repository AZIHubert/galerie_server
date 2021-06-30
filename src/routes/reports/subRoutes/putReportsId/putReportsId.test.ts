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
  createProfilePicture,
  createReport,
  createUser,
  putReportsId,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let moderator: User;

describe('/reports', () => {
  describe('/:reportId', () => {
    describe('PUT', () => {
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
        it('set classed to true', async () => {
          const { id: profilePictureId } = await createProfilePicture({
            userId: moderator.id,
          });
          const report = await createReport({
            profilePictureId,
          });
          const {
            body: {
              action,
              data: {
                classed,
                reportId,
              },
            },
            status,
          } = await putReportsId(app, token, report.id);
          await report.reload();
          expect(action).toBe('PUT');
          expect(classed).toBe(true);
          expect(report.classed).toBe(true);
          expect(reportId).toBe(report.id);
          expect(status).toBe(200);
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.reportId is not a UUIDv4', async () => {
          const {
            body,
            status,
          } = await putReportsId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('report'));
          expect(status).toBe(400);
        });
        it('report.classed === true', async () => {
          const { id: profilePictureId } = await createProfilePicture({
            userId: moderator.id,
          });
          const { id: reportId } = await createReport({
            classed: true,
            profilePictureId,
          });
          const {
            body,
            status,
          } = await putReportsId(app, token, reportId);
          expect(body.errors).toBe('this report is already classed');
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('report not found', async () => {
          const {
            body,
            status,
          } = await putReportsId(app, token, uuidv4());
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
          } = await putReportsId(app, token, reportId);
          const report = await Report.findByPk(reportId);
          expect(body.errors).toBe(DEFAULT_ERROR_MESSAGE);
          expect(report).toBeNull();
          expect(status).toBe(500);
        });
      });
    });
  });
});
