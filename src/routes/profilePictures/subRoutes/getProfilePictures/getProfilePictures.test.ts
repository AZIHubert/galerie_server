import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '#src/helpers/initEnv';

import {
  ProfilePicture,
  Image,
  User,
} from '#src/db/models';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import signedUrl from '#src/helpers/signedUrl';
import {
  createProfilePicture,
  createUser,
  getProfilePictures,
  testProfilePicture,
} from '#src/helpers/test';

import initApp from '#src/server';

jest.mock('#src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/profilePictures', () => {
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
        } = await createUser({});
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
      it('return no profile picture', async () => {
        const {
          body: {
            action,
            data: {
              profilePictures,
            },
          },
          status,
        } = await getProfilePictures(app, token);
        expect(action).toBe('GET');
        expect(profilePictures.length).toBe(0);
        expect(status).toBe(200);
      });
      it('return one profile picture', async () => {
        const profilePicture = await createProfilePicture({
          userId: user.id,
        });
        const {
          body: {
            data: {
              profilePictures,
            },
          },
        } = await getProfilePictures(app, token);
        testProfilePicture(profilePictures[0], profilePicture);
      });
      it('should return a pack of 20 profile pictures', async () => {
        const NUM = 21;
        const numOfProfilePictures = new Array(NUM).fill(0);
        await Promise.all(
          numOfProfilePictures.map(async () => {
            await createProfilePicture({
              userId: user.id,
            });
          }),
        );
        const {
          body: {
            data: {
              profilePictures: firstPack,
            },
          },
        } = await getProfilePictures(app, token);
        const {
          body: {
            data: {
              profilePictures: secondPack,
            },
          },
        } = await getProfilePictures(app, token, {
          previousProfilePicture: firstPack[firstPack.length - 1].autoIncrementId,
        });
        expect(firstPack.length).toEqual(20);
        expect(secondPack.length).toEqual(1);
      });
      it('order profile pictures by createdAt', async () => {
        const profilePictureOne = await createProfilePicture({
          userId: user.id,
        });
        const profilePictureTwo = await createProfilePicture({
          userId: user.id,
        });
        const profilePictureThree = await createProfilePicture({
          userId: user.id,
        });
        const profilePictureFour = await createProfilePicture({
          userId: user.id,
        });
        const profilePictureFive = await createProfilePicture({
          userId: user.id,
        });
        const {
          body: {
            data: {
              profilePictures,
            },
          },
        } = await getProfilePictures(app, token);
        expect(profilePictures.length).toBe(5);
        expect(profilePictures[0].id).toBe(profilePictureFive.id);
        expect(profilePictures[1].id).toBe(profilePictureFour.id);
        expect(profilePictures[2].id).toBe(profilePictureThree.id);
        expect(profilePictures[3].id).toBe(profilePictureTwo.id);
        expect(profilePictures[4].id).toBe(profilePictureOne.id);
      });
      it('do not return profile pictures from other users', async () => {
        const { user: userTwo } = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        await createProfilePicture({
          userId: userTwo.id,
        });
        const {
          body: {
            data: {
              profilePictures,
            },
          },
        } = await getProfilePictures(app, token);
        expect(profilePictures.length).toBe(0);
      });
      it('return profilePicture === null if signedUrl.OK === false', async () => {
        (signedUrl as jest.Mock).mockImplementation(() => ({
          OK: false,
        }));
        const { id: profilePicureId } = await createProfilePicture({
          userId: user.id,
        });
        const {
          body: {
            data: {
              profilePictures,
            },
          },
        } = await getProfilePictures(app, token);
        const profilePicture = await ProfilePicture.findByPk(profilePicureId);
        const images = await Image.findAll();
        expect(profilePicture).toBeNull();
        expect(profilePictures[0]).toBeNull();
        expect(images.length).toBe(0);
      });
      describe('should return first profilePictures if req.query.previousProfilePicture', () => {
        let profilePictureId: string;

        beforeEach(async (done) => {
          try {
            await createProfilePicture({
              userId: user.id,
            });
            const profilePicture = await createProfilePicture({
              userId: user.id,
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
          } = await getProfilePictures(app, token, {
            previousProfilePicture: 'notANumber',
          });
          expect(profilePictures.length).toBe(2);
          expect(profilePictures[0].id).toBe(profilePictureId);
        });
        it('is less than 0', async () => {
          const {
            body: {
              data: {
                profilePictures,
              },
            },
          } = await getProfilePictures(app, token, {
            previousProfilePicture: '-1',
          });
          expect(profilePictures.length).toBe(2);
          expect(profilePictures[0].id).toBe(profilePictureId);
        });
      });
    });
  });
});
