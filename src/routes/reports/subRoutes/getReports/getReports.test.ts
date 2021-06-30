import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '#src/helpers/initEnv';

import {
  User,
} from '#src/db/models';

import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createFrame,
  createGalerie,
  createProfilePicture,
  createReport,
  createUser,
  getReports,
  testReport,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let admin: User;

describe('/reports', () => {
  describe('POST', () => {
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
          role: 'admin',
        });
        admin = user;
        const jwt = signAuthToken(admin);
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
      it('return no reports', async () => {
        const {
          body: {
            action,
            data: {
              reports,
            },
          },
          status,
        } = await getReports(app, token);
        expect(action).toBe('GET');
        expect(reports.length).toBe(0);
        expect(status).toBe(200);
      });
      it('return one report where type === \'FRAME\'', async () => {
        const { id: galerieId } = await createGalerie({
          userId: admin.id,
        });
        const { id: frameId } = await createFrame({
          galerieId,
          userId: admin.id,
        });
        await createReport({
          frameId,
          userId: admin.id,
        });
        const {
          body: {
            data: {
              reports,
            },
          },
        } = await getReports(app, token);
        expect(reports.length).toBe(1);
        expect(reports[0].frame.autoIncrementId).not.toBeUndefined();
        expect(reports[0].frame.createdAt).not.toBeUndefined();
        expect(reports[0].frame.description).not.toBeUndefined();
        expect(reports[0].frame.galerieId).not.toBeUndefined();
        expect(reports[0].frame.id).not.toBeUndefined();
        expect(reports[0].frame.notificationHasBeenSend).toBeUndefined();
        expect(reports[0].frame.numOfLikes).not.toBeUndefined();
        expect(reports[0].frame.updatedAt).toBeUndefined();
        expect(reports[0].frame.userId).not.toBeUndefined();
        expect(reports[0].profilePicture).toBeUndefined();
        expect(reports[0].type).toBe('FRAME');
        testReport(reports[0]);
      });
      it('return one report where type === \'PROFILE_PICTURE\'', async () => {
        const { id: profilePictureId } = await createProfilePicture({
          userId: admin.id,
        });
        await createReport({
          profilePictureId,
          userId: admin.id,
        });
        const {
          body: {
            data: {
              reports,
            },
          },
        } = await getReports(app, token);
        expect(reports.length).toBe(1);
        expect(reports[0].frame).toBeUndefined();
        expect(reports[0].profilePicture.autoIncrementId).not.toBeUndefined();
        expect(reports[0].profilePicture.createdAt).not.toBeUndefined();
        expect(reports[0].profilePicture.cropedImageId).toBeUndefined();
        expect(reports[0].profilePicture.current).not.toBeUndefined();
        expect(reports[0].profilePicture.originalImageId).toBeUndefined();
        expect(reports[0].profilePicture.id).not.toBeUndefined();
        expect(reports[0].profilePicture.pendingImageId).toBeUndefined();
        expect(reports[0].profilePicture.updatedAt).toBeUndefined();
        expect(reports[0].profilePicture.userId).not.toBeUndefined();
        expect(reports[0].type).toBe('PROFILE_PICTURE');
        testReport(reports[0]);
      });
      it('return a pack of 20 reports', async () => {
        const NUM = 21;
        const numOfReports = new Array(NUM).fill(0);
        await Promise.all(
          numOfReports.map(
            async () => {
              const { id: profilePictureId } = await createProfilePicture({
                userId: admin.id,
              });
              await createReport({
                profilePictureId,
                userId: admin.id,
              });
            },
          ),
        );
        const {
          body: {
            data: {
              reports: firstPack,
            },
          },
        } = await getReports(app, token);
        const {
          body: {
            data: {
              reports: secondPack,
            },
          },
        } = await getReports(app, token, {
          previousReport: firstPack[firstPack.length - 1].autoIncrementId,
        });
        expect(firstPack.length).toBe(20);
        expect(secondPack.length).toBe(1);
      });
      it('order reports by createdAt (ASC)', async () => {
        const profilePictureOne = await createProfilePicture({
          userId: admin.id,
        });
        const profilePictureTwo = await createProfilePicture({
          userId: admin.id,
        });
        const profilePictureThree = await createProfilePicture({
          userId: admin.id,
        });
        const profilePictureFour = await createProfilePicture({
          userId: admin.id,
        });
        const profilePictureFive = await createProfilePicture({
          userId: admin.id,
        });
        const reportOne = await createReport({
          profilePictureId: profilePictureOne.id,
          userId: admin.id,
        });
        const reportTwo = await createReport({
          profilePictureId: profilePictureTwo.id,
          userId: admin.id,
        });
        const reportThree = await createReport({
          profilePictureId: profilePictureThree.id,
          userId: admin.id,
        });
        const reportFour = await createReport({
          profilePictureId: profilePictureFour.id,
          userId: admin.id,
        });
        const reportFive = await createReport({
          profilePictureId: profilePictureFive.id,
          userId: admin.id,
        });
        const {
          body: {
            data: {
              reports,
            },
          },
        } = await getReports(app, token);
        expect(reports[0].id).toBe(reportOne.id);
        expect(reports[1].id).toBe(reportTwo.id);
        expect(reports[2].id).toBe(reportThree.id);
        expect(reports[3].id).toBe(reportFour.id);
        expect(reports[4].id).toBe(reportFive.id);
      });
      it('return all reports if request.query.classed is undefined', async () => {
        const profilePictureOne = await createProfilePicture({
          userId: admin.id,
        });
        await createReport({
          profilePictureId: profilePictureOne.id,
          userId: admin.id,
        });
        const profilePictureTwo = await createProfilePicture({
          userId: admin.id,
        });
        await createReport({
          profilePictureId: profilePictureTwo.id,
          classed: true,
          userId: admin.id,
        });
        const {
          body: {
            data: {
              reports,
            },
          },
        } = await getReports(app, token);
        expect(reports.length).toBe(2);
      });
      it('return classed reports if request.query.classed === \'true\'', async () => {
        const profilePictureOne = await createProfilePicture({
          userId: admin.id,
        });
        await createReport({
          profilePictureId: profilePictureOne.id,
          userId: admin.id,
        });
        const profilePictureTwo = await createProfilePicture({
          userId: admin.id,
        });
        const { id: reportId } = await createReport({
          profilePictureId: profilePictureTwo.id,
          classed: true,
          userId: admin.id,
        });
        const {
          body: {
            data: {
              reports,
            },
          },
        } = await getReports(app, token, {
          classed: 'true',
        });
        expect(reports.length).toBe(1);
        expect(reports[0].id).toBe(reportId);
      });
      it('return not classed reports if request.query.classed === \'false\'', async () => {
        const profilePictureOne = await createProfilePicture({
          userId: admin.id,
        });
        const { id: reportId } = await createReport({
          profilePictureId: profilePictureOne.id,
          userId: admin.id,
        });
        const profilePictureTwo = await createProfilePicture({
          userId: admin.id,
        });
        await createReport({
          profilePictureId: profilePictureTwo.id,
          classed: true,
          userId: admin.id,
        });
        const {
          body: {
            data: {
              reports,
            },
          },
        } = await getReports(app, token, {
          classed: 'false',
        });
        expect(reports.length).toBe(1);
        expect(reports[0].id).toBe(reportId);
      });
      it('return all reports if reques.query.classed !== \'true\' | \'false\'', async () => {
        const profilePictureOne = await createProfilePicture({
          userId: admin.id,
        });
        await createReport({
          profilePictureId: profilePictureOne.id,
          userId: admin.id,
        });
        const profilePictureTwo = await createProfilePicture({
          userId: admin.id,
        });
        await createReport({
          profilePictureId: profilePictureTwo.id,
          classed: true,
          userId: admin.id,
        });
        const {
          body: {
            data: {
              reports,
            },
          },
        } = await getReports(app, token, {
          classed: 'wrongValue',
        });
        expect(reports.length).toBe(2);
      });
      it('do not return reports where frameId === null && profilePictureId === null', async () => {
        await createReport({});
        const {
          body: {
            data: {
              reports,
            },
          },
        } = await getReports(app, token, {});
        expect(reports.length).toBe(0);
      });
      describe('should return firsy reports if request.query.previousReport', () => {
        let reportId: string;

        beforeEach(async (done) => {
          try {
            const profilePictureOne = await createProfilePicture({
              userId: admin.id,
            });
            const report = await createReport({
              profilePictureId: profilePictureOne.id,
              userId: admin.id,
            });
            const profilePictureTwo = await createProfilePicture({
              userId: admin.id,
            });
            await createReport({
              profilePictureId: profilePictureTwo.id,
              userId: admin.id,
            });
            reportId = report.id;
          } catch (err) {
            done(err);
          }
          done();
        });

        it('is not a number', async () => {
          const {
            body: {
              data: {
                reports,
              },
            },
          } = await getReports(app, token, {
            previousReport: 'notANumber',
          });
          expect(reports.length).toBe(2);
          expect(reports[0].id).toBe(reportId);
        });
        it('is less than 0', async () => {
          const {
            body: {
              data: {
                reports,
              },
            },
          } = await getReports(app, token, {
            previousReport: '-1',
          });
          expect(reports.length).toBe(2);
          expect(reports[0].id).toBe(reportId);
        });
      });
    });
  });
});
