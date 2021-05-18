import {
  validate as uuidValidate,
  version as uuidVersion,
} from 'uuid';

export default (uuid: string) => uuidValidate(uuid) && uuidVersion(uuid) === 4;
