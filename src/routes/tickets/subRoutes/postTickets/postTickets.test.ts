import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import {
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MAX_LENGTH_TWO_HUNDRER,
  FIELD_MIN_LENGTH_OF_FIVE,
  FIELD_MIN_LENGTH_OF_TEN,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  login,
  postTicket,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/tickets', () => {
  let app: Server;
  let sequelize: Sequelize;
  let token: string;
  let user: User;

  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });

  beforeEach(async (done) => {
    try {
      await sequelize.sync({ force: true });
      user = await createUser({});
      const { body } = await login(app, user.email, userPassword);
      token = body.token;
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

  describe('POST', () => {
    describe('should return status 204 and', () => {
      it('create a ticket', async () => {
        const body = 'ticket body';
        const header = 'header body';
        const {
          body: {
            action,
            data: {
              ticket,
            },
          },
          status,
        } = await postTicket(app, token, {
          body,
          header,
        });
        expect(action).toBe('POST');
        expect(status).toBe(200);
        expect(ticket.createdAt).not.toBeUndefined();
        expect(ticket.body).toBe(body);
        expect(ticket.header).toBe(header);
        expect(ticket.id).not.toBeUndefined();
        expect(ticket.updatedAt).toBeUndefined();
        expect(ticket.userId).toBe(user.id);
      });
      it('should trim request.body', async () => {
        const body = 'ticket body';
        const header = 'header body';
        const {
          body: {
            data: {
              ticket,
            },
          },
        } = await postTicket(app, token, {
          body: ` ${body} `,
          header: ` ${header} `,
        });
        expect(ticket.body).toBe(body);
        expect(ticket.header).toBe(header);
      });
    });
  });
  describe('should return status 400 if', () => {
    describe('body', () => {
      it('is not set', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          header: 'ticket header',
        });
        expect(body.errors).toEqual({
          body: FIELD_IS_REQUIRED,
        });
        expect(status).toBe(400);
      });
      it('is an empty string', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: '',
          header: 'ticket header',
        });
        expect(body.errors).toEqual({
          body: FIELD_IS_EMPTY,
        });
        expect(status).toBe(400);
      });
      it('is not a string', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 1234,
          header: 'ticket header',
        });
        expect(body.errors).toEqual({
          body: FIELD_NOT_A_STRING,
        });
        expect(status).toBe(400);
      });
      it('has less than 10 characters', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'a'.repeat(9),
          header: 'ticket header',
        });
        expect(body.errors).toEqual({
          body: FIELD_MIN_LENGTH_OF_TEN,
        });
        expect(status).toBe(400);
      });
      it('has more than 200 characters', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'a'.repeat(201),
          header: 'ticket header',
        });
        expect(body.errors).toEqual({
          body: FIELD_MAX_LENGTH_TWO_HUNDRER,
        });
        expect(status).toBe(400);
      });
    });
    describe('header', () => {
      it('is not set', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'ticket body',
        });
        expect(body.errors).toEqual({
          header: FIELD_IS_REQUIRED,
        });
        expect(status).toBe(400);
      });
      it('is an empty string', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'ticket body',
          header: '',
        });
        expect(body.errors).toEqual({
          header: FIELD_IS_EMPTY,
        });
        expect(status).toBe(400);
      });
      it('is not a string', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'ticket body',
          header: 1234,
        });
        expect(body.errors).toEqual({
          header: FIELD_NOT_A_STRING,
        });
        expect(status).toBe(400);
      });
      it('has less than 5 characters', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'ticket body',
          header: 'a'.repeat(4),
        });
        expect(body.errors).toEqual({
          header: FIELD_MIN_LENGTH_OF_FIVE,
        });
        expect(status).toBe(400);
      });
      it('has more than 30 characters', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'ticket body',
          header: 'a'.repeat(31),
        });
        expect(body.errors).toEqual({
          header: FIELD_MAX_LENGTH_THRITY,
        });
        expect(status).toBe(400);
      });
    });
  });
});
