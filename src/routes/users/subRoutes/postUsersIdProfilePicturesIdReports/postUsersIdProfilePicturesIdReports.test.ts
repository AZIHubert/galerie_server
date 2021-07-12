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
  createProfilePicture,
  createReport,
  createUser,
  postUsersIdProfilePicturesIdReports,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let currentUser: User;
let profilePictureId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('/:userId', () => {
    describe('/profilePictures', () => {
      describe('/:profilePictureId', () => {
        describe('/reposts', () => {
          describe('POST', () => {
            beforeAll(() => {
              sequelize = initSequelize();
              app = initApp();
            });

            beforeEach(async (done) => {
              try {
                await sequelize.sync({ force: true });
                const { user: userOne } = await createUser({});
                const { user: userTwo } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                currentUser = userTwo;
                user = userOne;
                const jwt = signAuthToken(currentUser);
                const profilePicture = await createProfilePicture({
                  userId: user.id,
                });
                profilePictureId = profilePicture.id;
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
              describe('if report for this profile picture already exist', () => {
                it('increment numOfReports', async () => {
                  const numOfReports = 1;
                  const report = await createReport({
                    profilePictureId,
                    numOfReports,
                  });
                  const {
                    body: {
                      action,
                      data,
                    },
                    status,
                  } = await postUsersIdProfilePicturesIdReports(
                    app,
                    token,
                    user.id,
                    profilePictureId,
                    {
                      body: {
                        reason: 'scam',
                      },
                    },
                  );
                  await report.reload();
                  const reports = await Report.findAll({
                    where: {
                      profilePictureId,
                    },
                  });
                  const reportUser = await ReportUser.findOne({
                    where: {
                      reportId: report.id,
                      userId: currentUser.id,
                    },
                  });
                  expect(action).toBe('POST');
                  expect(data.userId).toBe(user.id);
                  expect(data.profilePictureId).toBe(profilePictureId);
                  expect(report.numOfReports).toBe(numOfReports + 1);
                  expect(reports.length).toBe(1);
                  expect(reportUser).not.toBeNull();
                  expect(status).toBe(200);
                });
                it('increment correct reason', async () => {
                  const report = await createReport({
                    profilePictureId,
                  });
                  await postUsersIdProfilePicturesIdReports(
                    app,
                    token,
                    user.id,
                    profilePictureId,
                    {
                      body: {
                        reason: 'scam',
                      },
                    },
                  );
                  await report.reload();
                  expect(report.reasonDisinformation).toBe(0);
                  expect(report.reasonHarassment).toBe(0);
                  expect(report.reasonHate).toBe(0);
                  expect(report.reasonIntellectualPropery).toBe(0);
                  expect(report.reasonNudity).toBe(0);
                  expect(report.reasonScam).toBe(1);
                });
                it('set classed to false', async () => {
                  const report = await createReport({
                    classed: true,
                    profilePictureId,
                  });
                  const { status } = await postUsersIdProfilePicturesIdReports(
                    app,
                    token,
                    user.id,
                    profilePictureId,
                    {
                      body: {
                        reason: 'scam',
                      },
                    },
                  );
                  await report.reload();
                  expect(report.classed).toBe(false);
                  expect(status).toBe(200);
                });
              });
              describe('if no report for this profile picture exist', () => {
                it('create a report', async () => {
                  const { status } = await postUsersIdProfilePicturesIdReports(
                    app,
                    token,
                    user.id,
                    profilePictureId,
                    {
                      body: {
                        reason: 'scam',
                      },
                    },
                  );
                  const report = await Report.findOne({
                    include: [
                      {
                        model: User,
                        where: {
                          id: currentUser.id,
                        },
                      },
                    ],
                    where: {
                      profilePictureId,
                    },
                  }) as Report;
                  expect(report).not.toBeNull();
                  expect(report.classed).toBe(false);
                  expect(report.frameId).toBeNull();
                  expect(report.numOfReports).toBe(1);
                  expect(report.profilePictureId).toBe(profilePictureId);
                  expect(status).toBe(200);
                });
                it('increment correct reason', async () => {
                  await postUsersIdProfilePicturesIdReports(
                    app,
                    token,
                    user.id,
                    profilePictureId,
                    {
                      body: {
                        reason: 'scam',
                      },
                    },
                  );
                  const report = await Report.findOne({
                    where: {
                      profilePictureId,
                    },
                  }) as Report;
                  expect(report.reasonDisinformation).toBe(0);
                  expect(report.reasonHarassment).toBe(0);
                  expect(report.reasonHate).toBe(0);
                  expect(report.reasonIntellectualPropery).toBe(0);
                  expect(report.reasonNudity).toBe(0);
                  expect(report.reasonScam).toBe(1);
                });
              });
            });
            describe('should return status 400 if', () => {
              it('currentUser.Role !== \'user\'', async () => {
                const { user: moderator } = await createUser({
                  email: 'moderator@email.com',
                  role: 'moderator',
                  userName: 'moderator',
                });
                const { token: tokenTwo } = signAuthToken(moderator);
                const {
                  body,
                  status,
                } = await postUsersIdProfilePicturesIdReports(
                  app,
                  tokenTwo,
                  user.id,
                  profilePictureId,
                );
                expect(body.errors).toBe('you are not allow to report this profile picture');
                expect(status).toBe(400);
              });
              it('request.params.userId is not a UUIDv4', async () => {
                const {
                  body,
                  status,
                } = await postUsersIdProfilePicturesIdReports(
                  app,
                  token,
                  '100',
                  '100',
                );
                expect(body.errors).toBe(INVALID_UUID('user'));
                expect(status).toBe(400);
              });
              it('request.params.profilePictureId is not a UUIDv4', async () => {
                const {
                  body,
                  status,
                } = await postUsersIdProfilePicturesIdReports(
                  app,
                  token,
                  user.id,
                  '100',
                );
                expect(body.errors).toBe(INVALID_UUID('profile picture'));
                expect(status).toBe(400);
              });
              it('currentUser.id === request.params.userId', async () => {
                const { token: tokenTwo } = signAuthToken(user);
                const {
                  body,
                  status,
                } = await postUsersIdProfilePicturesIdReports(
                  app,
                  tokenTwo,
                  user.id,
                  profilePictureId,
                );
                expect(body.errors).toBe('you can\'t report your own profile pictures');
                expect(status).toBe(400);
              });
              it('currentUser already post a report for this profile picture', async () => {
                await createReport({
                  profilePictureId,
                  userId: currentUser.id,
                });
                const {
                  body,
                  status,
                } = await postUsersIdProfilePicturesIdReports(
                  app,
                  token,
                  user.id,
                  profilePictureId,
                  {
                    body: {
                      reason: 'scam',
                    },
                  },
                );
                expect(body.errors).toBe('you have already report this profile picture');
                expect(status).toBe(400);
              });
              it('request.body.reason is invalid', async () => {
                const {
                  body,
                  status,
                } = await postUsersIdProfilePicturesIdReports(
                  app,
                  token,
                  user.id,
                  profilePictureId,
                  {
                    body: {
                      reason: 'wrongReason',
                    },
                  },
                );
                expect(body.errors).toEqual({
                  reason: 'invalid reason',
                });
                expect(status).toBe(400);
              });
            });
            describe('shouls return status 404 if', () => {
              it('user not found', async () => {
                const {
                  body,
                  status,
                } = await postUsersIdProfilePicturesIdReports(
                  app,
                  token,
                  uuidv4(),
                  uuidv4(),
                );
                expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
                expect(status).toBe(404);
              });
              it('profile picture not found', async () => {
                const {
                  body,
                  status,
                } = await postUsersIdProfilePicturesIdReports(
                  app,
                  token,
                  user.id,
                  uuidv4(),
                );
                expect(body.errors).toBe(MODEL_NOT_FOUND('profile picture'));
                expect(status).toBe(404);
              });
              it('profile picture exist but was not posted by this user', async () => {
                const { user: userThree } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                const profilePicture = await createProfilePicture({
                  userId: userThree.id,
                });
                const {
                  body,
                  status,
                } = await postUsersIdProfilePicturesIdReports(
                  app,
                  token,
                  user.id,
                  profilePicture.id,
                );
                expect(body.errors).toBe(MODEL_NOT_FOUND('profile picture'));
                expect(status).toBe(404);
              });
            });
          });
        });
      });
    });
  });
});
