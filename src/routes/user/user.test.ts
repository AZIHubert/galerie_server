import request from 'supertest';

import initApp from '@src/server';

interface User {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const sendPostRequest = async (newUser: User) => request(initApp()).post('/users').send(newUser);

describe('users', () => {
  describe('POST', () => {
    const newUser: User = {
      userName: 'user',
      email: 'user@email.com',
      password: 'Aaoudjiuvhds9!',
      confirmPassword: 'Aaoudjiuvhds9!',
    };
    let response: request.Response;
    beforeEach(async () => {
      response = await sendPostRequest(newUser);
    });
    it('should return 200', () => {
      const { status } = response;
      expect(status).toBe(200);
    });
    it('should return a user', () => {
      const { body } = response;
      expect(body).toEqual({ id: 0, ...newUser });
    });

    describe('should return 400', () => {
      const passwordLessThanHeightChar = 'Abc9!';
      const passwordMoreThanThirtyChar = `Ac9!${'a'.repeat(31)}`;
      const passwordWithoutUppercase = 'aaoudjiuvhds9!';
      const passwordWithoutLowercase = 'AAOUDJIUVHDS9!';
      const passwordWithoutNumber = 'Aaoudjiuvhds!';
      const passwordWithoutSpecialChar = 'Aaoudjiuvhds9';

      const newUserWithEmptyUserName: User = { ...newUser, userName: '' };
      const newUserWithEmptyEmail: User = { ...newUser, email: '' };
      const newUserWithEmailNotValid: User = { ...newUser, email: 'notValid' };
      const newUserWithEmptyPassword: User = { ...newUser, password: '' };
      const newUserWithPasswordsNotMatch: User = { ...newUser, confirmPassword: 'passwor' };
      const newUserWithPasswordLessThanHeightChars: User = {
        ...newUser,
        password: passwordLessThanHeightChar,
        confirmPassword: passwordLessThanHeightChar,
      };
      const newUserWithPasswordWithoutLowercase: User = {
        ...newUser,
        password: passwordWithoutLowercase,
        confirmPassword: passwordWithoutLowercase,
      };
      const newUserWithPasswordMoreThanThirtyChars: User = {
        ...newUser,
        password: passwordMoreThanThirtyChar,
        confirmPassword: passwordMoreThanThirtyChar,
      };
      const newUserWithPasswordWithoutNumber: User = {
        ...newUser,
        password: passwordWithoutNumber,
        confirmPassword: passwordWithoutNumber,
      };
      const newUserWithPasswordWithoutChar: User = {
        ...newUser,
        password: passwordWithoutSpecialChar,
        confirmPassword: passwordWithoutSpecialChar,
      };
      const newUserWithPasswordWithoutUppercase: User = {
        ...newUser,
        password: passwordWithoutUppercase,
        confirmPassword: passwordWithoutUppercase,
      };
      const newUserWithUserNameLessThanThree: User = { ...newUser, userName: 'ab' };
      const newUserWithUserNameMoreThanThirty: User = { ...newUser, userName: 'a'.repeat(31) };

      it('if userName is empty', async () => {
        const { status } = await sendPostRequest(newUserWithEmptyUserName);
        expect(status).toBe(400);
      });
      it('if email is empty', async () => {
        const { status } = await sendPostRequest(newUserWithEmptyEmail);
        expect(status).toBe(400);
      });
      it('if email is not valid', async () => {
        const { status } = await sendPostRequest(newUserWithEmailNotValid);
        expect(status).toBe(400);
      });
      it('if password is empty', async () => {
        const { status } = await sendPostRequest(newUserWithEmptyPassword);
        expect(status).toBe(400);
      });
      it('if password contain less than 8 char', async () => {
        const { status } = await sendPostRequest(newUserWithPasswordLessThanHeightChars);
        expect(status).toBe(400);
      });
      it('if password contain more than 30 char', async () => {
        const { status } = await sendPostRequest(newUserWithPasswordMoreThanThirtyChars);
        expect(status).toBe(400);
      });
      it('if password doesn\'t contain any uppercase', async () => {
        const { status } = await sendPostRequest(newUserWithPasswordWithoutUppercase);
        expect(status).toBe(400);
      });
      it('if password doesn\'t contain any lowercase', async () => {
        const { status } = await sendPostRequest(newUserWithPasswordWithoutLowercase);
        expect(status).toBe(400);
      });
      it('if password doesn\'t contain any number', async () => {
        const { status } = await sendPostRequest(newUserWithPasswordWithoutNumber);
        expect(status).toBe(400);
      });
      it('if password doesn\'t contain any special char', async () => {
        const { status } = await sendPostRequest(newUserWithPasswordWithoutChar);
        expect(status).toBe(400);
      });
      it('if passwords not match', async () => {
        const { status } = await sendPostRequest(newUserWithPasswordsNotMatch);
        expect(status).toBe(400);
      });
      it('if userName is less than 3 char', async () => {
        const { status } = await sendPostRequest(newUserWithUserNameLessThanThree);
        expect(status).toBe(400);
      });
      it('if userName is less than 30 char', async () => {
        const { status } = await sendPostRequest(newUserWithUserNameMoreThanThirty);
        expect(status).toBe(400);
      });
    });
  });
});
