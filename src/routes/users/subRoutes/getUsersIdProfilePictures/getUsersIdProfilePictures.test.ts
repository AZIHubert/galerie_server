import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
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
  createProfilePicture,
  createUser,
  getUsersIdProfilePictures,
  testProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('/:userId', () => {
    describe('/profilePicture', () => {
      describe('GET', () => {
        beforeAll(() => {
          app = initApp();
          sequelize = initSequelize();
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

          beforeEach(async (done) => {
            try {
              const { user: createdUser } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              userTwo = createdUser;
            } catch (err) {
              done(err);
            }
            done();
          });

          it('return no profile picture', async () => {
            const {
              body: {
                action,
                data: {
                  profilePictures,
                  userId,
                },
              },
              status,
            } = await getUsersIdProfilePictures(app, token, userTwo.id);
            expect(action).toBe('GET');
            expect(profilePictures.length).toBe(0);
            expect(status).toBe(200);
            expect(userId).toBe(userTwo.id);
          });
          it('return on profile picture', async () => {
            await createProfilePicture({
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  profilePictures,
                },
              },
            } = await getUsersIdProfilePictures(app, token, userTwo.id);
            expect(profilePictures.length).toBe(1);
            testProfilePicture(profilePictures[0]);
          });
          it('return a pack of 20 profile pictures', async () => {
            const NUM = 21;
            const numOfProfilePictures = new Array(NUM).fill(0);
            await Promise.all(
              numOfProfilePictures.map(async () => {
                await createProfilePicture({
                  userId: userTwo.id,
                });
              }),
            );
            const {
              body: {
                data: {
                  profilePictures: firstPack,
                },
              },
            } = await getUsersIdProfilePictures(app, token, userTwo.id);
            const {
              body: {
                data: {
                  profilePictures: secondPack,
                },
              },
            } = await getUsersIdProfilePictures(app, token, userTwo.id, {
              previousProfilePicture: firstPack[firstPack.length - 1].autoIncrementId,
            });
            expect(firstPack.length).toBe(20);
            expect(secondPack.length).toBe(1);
          });
          it('order profile pictures by createdAt (DESC)', async () => {
            const profilePictureOne = await createProfilePicture({
              userId: userTwo.id,
            });
            const profilePictureTwo = await createProfilePicture({
              userId: userTwo.id,
            });
            const profilePictureThree = await createProfilePicture({
              userId: userTwo.id,
            });
            const profilePictureFour = await createProfilePicture({
              userId: userTwo.id,
            });
            const profilePictureFive = await createProfilePicture({
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  profilePictures,
                },
              },
            } = await getUsersIdProfilePictures(app, token, userTwo.id);
            expect(profilePictures.length).toBe(5);
            expect(profilePictures[0].id).toBe(profilePictureFive.id);
            expect(profilePictures[1].id).toBe(profilePictureFour.id);
            expect(profilePictures[2].id).toBe(profilePictureThree.id);
            expect(profilePictures[3].id).toBe(profilePictureTwo.id);
            expect(profilePictures[4].id).toBe(profilePictureOne.id);
          });
          it('return profilePicture === null if signedUrl.OK === false', async () => {
            (signedUrl as jest.Mock).mockImplementation(() => ({
              OK: false,
            }));
            await createProfilePicture({
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  profilePictures: returnedProfilePictures,
                },
              },
            } = await getUsersIdProfilePictures(app, token, userTwo.id);
            const images = await Image.findAll();
            const profilePictures = await ProfilePicture.findAll();
            expect(images.length).toBe(0);
            expect(profilePictures.length).toBe(0);
            expect(returnedProfilePictures[0]).toBeNull();
          });
          describe('should return first profile pictures if req.query.previousProfilePicture', () => {
            let profilePictureId: string;

            beforeEach(async (done) => {
              try {
                await createProfilePicture({
                  userId: userTwo.id,
                });
                const profilePicture = await createProfilePicture({
                  userId: userTwo.id,
                });
                profilePictureId = profilePicture.id;
              } catch (err) {
                done(err);
              }
              done();
            });

            it('is not a number', async () => {
              const {
                body: {
                  data: {
                    profilePictures,
                  },
                },
              } = await getUsersIdProfilePictures(app, token, userTwo.id, {
                previousProfilePicture: 'notANumber',
              });
              expect(profilePictures.length).toBe(2);
              expect(profilePictures[0].id).toBe(profilePictureId);
            });
            it('is less than -1', async () => {
              const {
                body: {
                  data: {
                    profilePictures,
                  },
                },
              } = await getUsersIdProfilePictures(app, token, userTwo.id, {
                previousProfilePicture: '-1',
              });
              expect(profilePictures.length).toBe(2);
              expect(profilePictures[0].id).toBe(profilePictureId);
            });
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.userId is not a UUIDv4', async () => {
            const {
              body,
              status,
            } = await getUsersIdProfilePictures(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('user'));
            expect(status).toBe(400);
          });
        });
        describe('should return status 404 if', () => {
          it('user not found', async () => {
            const {
              body,
              status,
            } = await getUsersIdProfilePictures(app, token, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
