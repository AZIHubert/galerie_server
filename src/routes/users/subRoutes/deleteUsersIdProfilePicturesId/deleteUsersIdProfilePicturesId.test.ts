import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  Image,
  ProfilePicture,
  Report,
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
  deleteUsersIdProfilePicturesId,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

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

describe('/users', () => {
  describe('/:userId', () => {
    describe('/profilePictures', () => {
      describe('/:profilePictureId', () => {
        describe('DELETE', () => {
          beforeAll(() => {
            app = initApp();
            sequelize = initSequelize();
          });

          beforeEach(async (done) => {
            jest.clearAllMocks();
            try {
              await sequelize.sync({ force: true });
              const {
                user: createdUser,
              } = await createUser({
                role: 'admin',
              });
              user = createdUser;
              const jwt = signAuthToken(user);
              token = jwt.token;
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
            let profilePictureId: string;

            beforeEach(async (done) => {
              try {
                const { user: createdUser } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                userTwo = createdUser;
                const profilePicture = await createProfilePicture({
                  userId: userTwo.id,
                });
                profilePictureId = profilePicture.id;
              } catch (err) {
                done(err);
              }
              done();
            });

            it('delete profile picture/images', async () => {
              const {
                body: {
                  action,
                  data: {
                    profilePictureId: returnedProfilePictureId,
                    userId,
                  },
                },
                status,
              } = await deleteUsersIdProfilePicturesId(app, token, userTwo.id, profilePictureId);
              const profilePicture = await ProfilePicture.findByPk(profilePictureId);
              expect(action).toBe('DELETE');
              expect(profilePicture).toBeNull();
              expect(returnedProfilePictureId).toBe(profilePictureId);
              expect(status).toBe(200);
              expect(userId).toBe(userTwo.id);
            });
            it('delete images', async () => {
              await deleteUsersIdProfilePicturesId(app, token, userTwo.id, profilePictureId);
              const images = await Image.findAll();
              expect(images.length).toBe(0);
            });
            it('do not delete other profile pictures posted by user', async () => {
              const profilePictureTwo = await createProfilePicture({
                userId: userTwo.id,
              });
              await deleteUsersIdProfilePicturesId(app, token, userTwo.id, profilePictureId);
              const profilePicture = await ProfilePicture
                .findByPk(profilePictureTwo.id) as ProfilePicture;
              const image = await Image.findByPk(profilePicture.cropedImageId);
              expect(image).not.toBeNull();
              expect(profilePicture).not.toBeNull();
            });
            it('do not delete other profile pictures posted by other user', async () => {
              const profilePictureTwo = await createProfilePicture({
                userId: user.id,
              });
              await deleteUsersIdProfilePicturesId(app, token, userTwo.id, profilePictureId);
              const profilePicture = await ProfilePicture
                .findByPk(profilePictureTwo.id) as ProfilePicture;
              const image = await Image.findByPk(profilePicture.cropedImageId);
              expect(image).not.toBeNull();
              expect(profilePicture).not.toBeNull();
            });
            it('delete report', async () => {
              const { id: reportId } = await createReport({
                profilePictureId,
              });
              const {
                status,
              } = await deleteUsersIdProfilePicturesId(app, token, userTwo.id, profilePictureId);
              const report = await Report.findByPk(reportId);
              expect(report).toBeNull();
              expect(status).toBe(200);
            });
          });
          describe('should return status 400 if', () => {
            it('request.params.userId is not a UUIDv4', async () => {
              const {
                body,
                status,
              } = await deleteUsersIdProfilePicturesId(app, token, '100', '100');
              expect(body.errors).toBe(INVALID_UUID('user'));
              expect(status).toBe(400);
            });
            it('request.params.profilePictureId is not a UUIDv4', async () => {
              const {
                body,
                status,
              } = await deleteUsersIdProfilePicturesId(app, token, uuidv4(), '100');
              expect(body.errors).toBe(INVALID_UUID('profile picture'));
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('user not found', async () => {
              const {
                body,
                status,
              } = await deleteUsersIdProfilePicturesId(app, token, uuidv4(), uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
              expect(status).toBe(404);
            });
            it('profile picture not found', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await deleteUsersIdProfilePicturesId(app, token, userTwo.id, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('profile picture'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
