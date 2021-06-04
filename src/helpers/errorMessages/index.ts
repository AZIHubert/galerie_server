export const FIELD_CANNOT_BE_EMPTY = 'cannot be an empty field';
export const FIELD_CANNOT_CONTAIN_SPACES = 'can not contain spaces';
export const FIELD_IS_ALREADY_TAKEN = 'already taken';
export const FIELD_IS_REQUIRED = 'is required';
export const FIELD_MAX_LENGTH = (number: number) => `should have a maximum length of ${number}`;
export const FIELD_MIN_LENGTH = (number: number) => `should have a minimum length of ${number}`;
export const FIELD_SHOULD_BE_A_NUMBER = 'should be a type of \'number\'';
export const FIELD_SHOULD_BE_A_PASSWORD = 'need at least on lowercase, one uppercase, one number and one special char';
export const FIELD_SHOULD_BE_A_STRING = 'should be a type of \'text\'';
export const FIELD_SHOULD_BE_AN_EMAIL = 'should be a valid email';
export const FIELD_SHOULD_MATCH = (
  type:
  'password',
) => `must match ${type}`;
export const FILE_IS_REQUIRED = 'file is required';
export const FILE_SHOULD_BE_AN_IMAGE = 'uploaded file must be an image';
export const FILES_ARE_REQUIRED = 'files are required';
export const INVALID_UUID = (
  type:
  'black list' |
  'frame' |
  'galerie' |
  'galerie picture' |
  'invitation' |
  'profile picture' |
  'ticket' |
  'user',
) => `${type} id is not valide`;
export const MODEL_NOT_FOUND = (
  type:
  'black list' |
  'frame' |
  'galerie' |
  'galerie picture' |
  'invitation' |
  'profile picture' |
  'ticket' |
  'user',
) => `${type} not found`;
export const TOKEN_NOT_FOUND = 'token not found';
export const USER_SHOULD_BE_A_SUPER_ADMIN = 'you need to be a super admin';
export const USER_SHOULD_BE_AN_ADMIN = 'you need to be an admin';
export const USER_SHOULD_BE_AUTHENTICATED = 'not authenticated';
export const USER_SHOULD_BE_CONFIRED = 'You\'re account need to be confimed';
export const USER_SHOULD_NOT_BE_AUTHENTICATED = 'you are already authenticated';
export const USER_SHOULD_NOT_BE_BLACK_LISTED = 'your account is black listed';
export const USER_SHOULD_NOT_BE_CONFIRMED = 'your account is already confirmed';
export const USER_SHOULD_NOT_BE_REGISTERED_WITH_A_SOCIAL_MEDIA = 'you cannot be registered with a social media SDK';
export const WRONG_PASSWORD = 'wrong password';
export const WRONG_TOKEN = 'wrong token';
export const WRONG_TOKEN_VERSION = 'wrong token version';
export const WRONG_TOKEN_USER_ID = 'token user id are not the same as your current id';
