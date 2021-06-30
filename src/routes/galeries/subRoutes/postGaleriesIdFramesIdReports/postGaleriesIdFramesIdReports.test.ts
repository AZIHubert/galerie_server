import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
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
  createReport,
  createUser,
  postGaleriesIdFramesIdReports,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let creator: User;
let frameId: string;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;
let userTwo: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/frames', () => {
      describe('/:frameId', () => {
        describe('/reports', () => {
          describe('POST', () => {
            beforeAll(() => {
              sequelize = initSequelize();
              app = initApp();
            });

            beforeEach(async (done) => {
              try {
                await sequelize.sync({ force: true });
                const { user: userOne } = await createUser({});
                const { user: craetedUserOne } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const { user: createdUserTwo } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                creator = userOne;
                user = craetedUserOne;
                userTwo = createdUserTwo;
                const jwt = signAuthToken(user);
                token = jwt.token;
                const galerie = await createGalerie({
                  userId: creator.id,
                });
                galerieId = galerie.id;
                await createGalerieUser({
                  galerieId,
                  userId: user.id,
                });
                await createGalerieUser({
                  galerieId,
                  userId: userTwo.id,
                });
                const frame = await createFrame({
                  galerieId,
                  userId: userTwo.id,
                });
                frameId = frame.id;
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
              describe('if report for this frame already exist', () => {
                it('create a ReportUser and increment numOfReports', async () => {
                  const numOfReports = 1;
                  const report = await createReport({
                    frameId,
                    numOfReports,
                  });
                  const {
                    body: {
                      action,
                      data,
                    },
                    status,
                  } = await postGaleriesIdFramesIdReports(app, token, galerieId, frameId);
                  await report.reload();
                  const reportUser = await ReportUser.findOne({
                    where: {
                      reportId: report.id,
                      userId: user.id,
                    },
                  });
                  const reports = await Report.findAll();
                  expect(action).toBe('POST');
                  expect(data.frameId).toBe(frameId);
                  expect(data.galerieId).toBe(galerieId);
                  expect(report.numOfReports).toBe(numOfReports + 1);
                  expect(reportUser).not.toBeNull();
                  expect(reports.length).toBe(1);
                  expect(status).toBe(200);
                });
                it('set classed to false', async () => {
                  const report = await createReport({
                    classed: true,
                    frameId,
                  });
                  const {
                    status,
                  } = await postGaleriesIdFramesIdReports(app, token, galerieId, frameId);
                  await report.reload();
                  expect(report.classed).toBe(false);
                  expect(status).toBe(200);
                });
              });
              describe('if report for this frame doesn\'t exist', () => {
                it('create a Report and a ReportUser', async () => {
                  await postGaleriesIdFramesIdReports(app, token, galerieId, frameId);
                  const reports = await Report.findAll({
                    include: [
                      {
                        model: User,
                      },
                    ],
                  });
                  expect(reports.length).toBe(1);
                  expect(reports[0].numOfReports).toBe(1);
                  expect(reports[0].frameId).toBe(frameId);
                  expect(reports[0].profilePictureId).toBeNull();
                  expect(reports[0].users[0].id).toBe(user.id);
                });
              });
            });
            describe('should return status 400 if', () => {
              it('currentUser.id === frame.userId', async () => {
                const { token: tokenTwo } = signAuthToken(userTwo);
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdReports(app, tokenTwo, galerieId, frameId);
                expect(body.errors).toBe('you are not allow to report your own frame');
                expect(status).toBe(400);
              });
              it('currentUser.role !== \'user\'', async () => {
                const { user: admin } = await createUser({
                  email: 'admin@email.com',
                  role: 'admin',
                  userName: 'admin',
                });
                const { token: tokenTwo } = signAuthToken(admin);
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdReports(app, tokenTwo, galerieId, frameId);
                expect(body.errors).toBe('you are not allow to report this frame');
                expect(status).toBe(400);
              });
              it('request.params.galerieId is not a UUIDv4', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdReports(app, token, '100', '100');
                expect(body.errors).toBe(INVALID_UUID('galerie'));
                expect(status).toBe(400);
              });
              it('request.params.frameId is not a UUIDv4', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdReports(app, token, galerieId, '100');
                expect(body.errors).toBe(INVALID_UUID('frame'));
                expect(status).toBe(400);
              });
              it('currentUser role for this galerie is \'creator\'', async () => {
                const { token: tokenTwo } = signAuthToken(creator);
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdReports(app, tokenTwo, galerieId, frameId);
                expect(body.errors).toBe('you are not allow to report this frame');
                expect(status).toBe(400);
              });
              it('currentUser already report this frame', async () => {
                await createReport({
                  frameId,
                  userId: user.id,
                });
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdReports(app, token, galerieId, frameId);
                expect(body.errors).toBe('you have already report this frame');
                expect(status).toBe(400);
              });
            });
            describe('should return status 404 if', () => {
              it('galerie not found', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdReports(app, token, uuidv4(), uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
                expect(status).toBe(404);
              });
              it('galerie exist but user is not subscribe to it and user.role === \'user\'', async () => {
                const { user: userThree } = await createUser({
                  email: 'user4',
                  userName: 'user4',
                });
                const galerieTwo = await createGalerie({
                  userId: userThree.id,
                });
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdReports(app, token, galerieTwo.id, uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
                expect(status).toBe(404);
              });
              it('frame not found', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdReports(app, token, galerieId, uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
                expect(status).toBe(404);
              });
              it('frame exist but was not post on this galerie', async () => {
                const { user: userThree } = await createUser({
                  email: 'user4',
                  userName: 'user4',
                });
                const galerieTwo = await createGalerie({
                  userId: userThree.id,
                });
                const frameTwo = await createFrame({
                  galerieId: galerieTwo.id,
                  userId: userThree.id,
                });
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdReports(app, token, galerieId, frameTwo.id);
                expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
                expect(status).toBe(404);
              });
            });
          });
        });
      });
    });
  });
});
