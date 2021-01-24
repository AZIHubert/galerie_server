import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import {
  BlackList,
  User,
} from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const cleanDatas = async () => {
  await BlackList.sync({ force: true });
  await User.sync({ force: true });
};

const newUser = {
  email: 'user@email.com',
  password: 'password',
  userName: 'userName',
};

describe('users', () => {
  let agent: request.SuperAgentTest;
  let app: Server;
  let sequelize: Sequelize;
  let user: User;
  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });
  beforeEach(async (done) => {
    agent = request.agent(app);
    try {
      await cleanDatas();
      const hashPassword = await hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        password: hashPassword,
        role: 'admin',
      });
      await agent
        .get('/users/login')
        .send({
          password: newUser.password,
          userNameOrEmail: user.userName,
        });
    } catch (err) {
      done(err);
    }
    done();
  });
  afterAll(async (done) => {
    try {
      await cleanDatas();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe('blackList', () => {
    describe('GET', () => {
      describe('should return status 200 and', () => {
        it('don\'t return non black listed user', async () => {
          await User.create({
            confirmed: true,
            email: 'user2@email.com',
            password: 'password',
            userName: 'user2',
          });
          const { body, status } = await agent
            .get('/users/blackList/');
          expect(status).toBe(200);
          expect(body.length).toBe(0);
        });
        it('get all black listed users with relevent attributes', async () => {
          const reason = 'black list user two';
          const { id: blackListIdOne } = await BlackList.create({
            adminId: user.id,
            reason,
          });
          const {
            email,
            id,
            userName,
          } = await User.create({
            blackListId: blackListIdOne,
            confirmed: true,
            email: 'user2@email.com',
            password: 'password',
            userName: 'user2',
          });
          const { body, status } = await agent
            .get('/users/blackList/');
          const [returnedUser] = body;
          expect(status).toBe(200);
          expect(body.length).toBe(1);
          expect(returnedUser.defaultProfilePicture).toBeNull();
          expect(returnedUser.email).toBe(email);
          expect(typeof returnedUser.createdAt).toBe('string');
          expect(returnedUser.id).toBe(id);
          expect(typeof returnedUser.updatedAt).toBe('string');
          expect(returnedUser.userName).toBe(userName);
          expect(returnedUser.authTokenVersion).toBeUndefined();
          expect(returnedUser.blackListId).toBeUndefined();
          expect(returnedUser.confirmed).toBeUndefined();
          expect(returnedUser.confirmTokenVersion).toBeUndefined();
          expect(returnedUser.currentProfilePictureId).toBeUndefined();
          expect(returnedUser.emailTokenVersion).toBeUndefined();
          expect(returnedUser.password).toBeUndefined();
          expect(returnedUser.resetPasswordTokenVersion).toBeUndefined();
          expect(returnedUser.role).toBeUndefined();
          expect(returnedUser.updatedEmailTokenVersion).toBeUndefined();
        });
        it('include black list with relevent attributes', async () => {
          const reason = 'black list user two';
          const { id: blackListId } = await BlackList.create({
            adminId: user.id,
            reason,
          });
          await User.create({
            blackListId,
            confirmed: true,
            email: 'user2@email.com',
            password: 'password',
            userName: 'user2',
          });
          const { body, status } = await agent.get('/users/blackList/');
          const [{ blackList }] = body;
          expect(status).toBe(200);
          expect(body.length).toBe(1);
          expect(blackList.admin.id).toBe(user.id);
          expect(blackList.id).toBe(blackListId);
          expect(blackList.reason).toBe(reason);
          expect(blackList.time).toBe(null);
          expect(blackList.adminId).toBeUndefined();
          expect(blackList.deletedAt).toBeNull();
          expect(blackList.userId).toBeUndefined();
          expect(blackList.admin.authTokenVersion).toBeUndefined();
          expect(blackList.admin.blackListId).toBeUndefined();
          expect(blackList.admin.confirmed).toBeUndefined();
          expect(blackList.admin.confirmTokenVersion).toBeUndefined();
          expect(blackList.admin.createdAt).toBeUndefined();
          expect(blackList.admin.currentProfilePictureId).toBeUndefined();
          expect(blackList.admin.email).toBeUndefined();
          expect(blackList.admin.emailTokenVersion).toBeUndefined();
          expect(blackList.admin.deletedAt).toBeUndefined();
          expect(blackList.admin.googleId);
          expect(blackList.admin.password).toBeUndefined();
          expect(blackList.admin.resetPasswordTokenVersion).toBeUndefined();
          expect(blackList.admin.updatedAt).toBeUndefined();
          expect(blackList.admin.updatedEmailTokenVersion).toBeUndefined();
        });
        describe('include current profile picture', () => {
          it('with only relevent attributes', async () => {
            const hashPassword = await hash(newUser.password, saltRounds);
            const userTwo = await User.create({
              confirmed: true,
              email: 'user2@email.com',
              password: hashPassword,
              userName: 'user2',
            });
            const agentTwo = request.agent(app);
            await agentTwo
              .get('/users/login')
              .send({
                password: newUser.password,
                userNameOrEmail: userTwo.userName,
              });
            const {
              body: {
                cropedImage,
                id,
                originalImage,
                pendingImage,
              },
            } = await agentTwo
              .post('/users/me/ProfilePictures')
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            const { id: blackListId } = await BlackList.create({
              adminId: user.id,
              reason: 'black list user two',
            });
            await userTwo.update({ blackListId });
            const { body, status } = await agent.get('/users/blackList/');
            const [{ currentProfilePicture }] = body;
            expect(status).toBe(200);
            expect(currentProfilePicture.id).toBe(id);
            expect(currentProfilePicture.createdAt).toBeUndefined();
            expect(currentProfilePicture.cropedImageId).toBeUndefined();
            expect(currentProfilePicture.deletedAt).toBeUndefined();
            expect(currentProfilePicture.originalImageId).toBeUndefined();
            expect(currentProfilePicture.pendingImageId).toBeUndefined();
            expect(currentProfilePicture.updatedAt).toBeUndefined();
            expect(currentProfilePicture.userId).toBeUndefined();
            expect(currentProfilePicture.cropedImage.id).toBe(cropedImage.id);
            expect(currentProfilePicture.cropedImage.bucketName).toBe(cropedImage.bucketName);
            expect(currentProfilePicture.cropedImage.fileName).toBe(cropedImage.fileName);
            expect(currentProfilePicture.cropedImage.format).toBe(cropedImage.format);
            expect(currentProfilePicture.cropedImage.height).toBe(cropedImage.height);
            expect(currentProfilePicture.cropedImage.size).toBe(cropedImage.size);
            expect(currentProfilePicture.cropedImage.width).toBe(cropedImage.width);
            expect(currentProfilePicture.cropedImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.cropedImage.deletedAt).toBeUndefined();
            expect(currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
            expect(currentProfilePicture.originalImage.id).toBe(originalImage.id);
            expect(currentProfilePicture.originalImage.bucketName).toBe(originalImage.bucketName);
            expect(currentProfilePicture.originalImage.fileName).toBe(originalImage.fileName);
            expect(currentProfilePicture.originalImage.format).toBe(originalImage.format);
            expect(currentProfilePicture.originalImage.height).toBe(originalImage.height);
            expect(currentProfilePicture.originalImage.size).toBe(originalImage.size);
            expect(currentProfilePicture.originalImage.width).toBe(originalImage.width);
            expect(currentProfilePicture.originalImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.originalImage.deletedAt).toBeUndefined();
            expect(currentProfilePicture.originalImage.updatedAt).toBeUndefined();
            expect(currentProfilePicture.pendingImage.id).toBe(pendingImage.id);
            expect(currentProfilePicture.pendingImage.bucketName).toBe(pendingImage.bucketName);
            expect(currentProfilePicture.pendingImage.fileName).toBe(pendingImage.fileName);
            expect(currentProfilePicture.pendingImage.format).toBe(pendingImage.format);
            expect(currentProfilePicture.pendingImage.height).toBe(pendingImage.height);
            expect(currentProfilePicture.pendingImage.size).toBe(pendingImage.size);
            expect(currentProfilePicture.pendingImage.width).toBe(pendingImage.width);
            expect(currentProfilePicture.pendingImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.pendingImage.deletedAt).toBeUndefined();
            expect(currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
          });
          it('with signed urls', async () => {
            const hashPassword = await hash(newUser.password, saltRounds);
            const userTwo = await User.create({
              confirmed: true,
              email: 'user2@email.com',
              password: hashPassword,
              userName: 'user2',
            });
            const agentTwo = request.agent(app);
            await agentTwo
              .get('/users/login')
              .send({
                password: newUser.password,
                userNameOrEmail: userTwo.userName,
              });
            await agentTwo
              .post('/users/me/ProfilePictures')
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            const { id: blackListId } = await BlackList.create({
              adminId: user.id,
              reason: 'black list user two',
            });
            await userTwo.update({ blackListId });
            const { body: [returnedUser], status } = await agent.get('/users/blackList/');
            expect(status).toBe(200);
            expect(returnedUser.currentProfilePicture.cropedImage.signedUrl).not.toBeNull();
            expect(returnedUser.currentProfilePicture.originalImage.signedUrl).not.toBeNull();
            expect(returnedUser.currentProfilePicture.pendingImage.signedUrl).not.toBeNull();
          });
        });
      });
    });
  });
});
