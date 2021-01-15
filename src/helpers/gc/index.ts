import { Storage } from '@google-cloud/storage';
import path from 'path';

import accEnv from '../accEnv';

const GC_PROJECT_ID = accEnv('GC_PROJECT_ID');

export default new Storage({
  keyFilename: path.join('./googleApi.json'),
  projectId: GC_PROJECT_ID,
});
