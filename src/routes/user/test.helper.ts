const passwordLessThanHeightChar = 'Abc9!';
const passwordWithoutLowercase = 'AAOUDJIUVHDS9!';
const passwordMoreThanThirtyChar = `Ac9!${'a'.repeat(31)}`;
const passwordWithoutNumber = 'Aaoudjiuvhds!';
const passwordWithoutSpecialChar = 'Aaoudjiuvhds9';
const passwordWithoutUppercase = 'aaoudjiuvhds9!';

export interface UserI {
  userName: string | number;
  email: string;
  password: string;
  confirmPassword: string;
}

const newUser: UserI = {
  userName: 'user',
  email: 'user@email.com',
  password: 'Aaoudjiuvhds90!',
  confirmPassword: 'Aaoudjiuvhds90!',
};

export const users: { [key:string]: UserI } = {
  newUser: { ...newUser },
  newUserTwo: {
    ...newUser,
    userName: 'userTwo',
    email: 'userTwo@email.com',
  },
  newUserWithUserNameNotString: {
    ...newUser,
    userName: 12345,
  },
  newUserWithEmptyUserName: {
    ...newUser,
    userName: '',
  },
  newUserWithUserNameWithSpaces: {
    ...newUser,
    userName: 'Allan Aoudji',
  },
  newUserWithUserNameLessThanThree: {
    ...newUser,
    userName: 'ab',
  },
  newUserWithUserNameMoreThanThirty: {
    ...newUser,
    userName: 'a'.repeat(31),
  },
  newUserWithSameUserName: {
    ...newUser,
    email: 'userTwo@email.com',
  },
  newUserWithEmptyEmail: {
    ...newUser,
    email: '',
  },
  newUserWithEmailNotValid: {
    ...newUser,
    email: 'notValid',
  },
  newUserWithSameEmail: {
    ...newUser,
    userName: 'userTwo',
  },
  newUserWithEmptyPassword: {
    ...newUser,
    password: '',
    confirmPassword: '',
  },
  newUserWithPasswordLessThanHeightChars: {
    ...newUser,
    password: passwordLessThanHeightChar,
    confirmPassword: passwordLessThanHeightChar,
  },
  newUserWithPasswordWithoutLowercase: {
    ...newUser,
    password: passwordWithoutLowercase,
    confirmPassword: passwordWithoutLowercase,
  },
  newUserWithPasswordMoreThanThirtyChars: {
    ...newUser,
    password: passwordMoreThanThirtyChar,
    confirmPassword: passwordMoreThanThirtyChar,
  },
  newUserWithPasswordWithoutNumber: {
    ...newUser,
    password: passwordWithoutNumber,
    confirmPassword: passwordWithoutNumber,
  },
  newUserWithPasswordWithoutChar: {
    ...newUser,
    password: passwordWithoutSpecialChar,
    confirmPassword: passwordWithoutSpecialChar,
  },
  newUserWithPasswordWithoutUppercase: {
    ...newUser,
    password: passwordWithoutUppercase,
    confirmPassword: passwordWithoutUppercase,
  },
  newUserWithEmptyConfirmPassword: {
    ...newUser,
    confirmPassword: '',
  },
  newUserWithPasswordsNotMatch: {
    ...newUser,
    confirmPassword: 'Aaoudji',
  },
};
