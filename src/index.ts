import 'dotenv/config';
import 'module-alias/register';

import '@src/db';
import accessEnv from '@src/helpers';
import initApp from '@src/server';

const PORT = accessEnv('PORT', 8000);
initApp().listen(PORT, () => {
  console.log(`App starte on port ${PORT}`);
});
