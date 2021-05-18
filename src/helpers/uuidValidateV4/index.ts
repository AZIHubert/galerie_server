import { version as uuidVersion, validate as uuidValidate } from 'uuid';

export default (uuid: string) => uuidValidate(uuid) && uuidVersion(uuid) === 4;
