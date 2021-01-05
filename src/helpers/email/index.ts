import nodemailer from 'nodemailer';

import accEnv from '@src/helpers/accEnv';

const MAIL_USERNAME = accEnv('MAIL_USERNAME');
const MAIL_PASSWORD = accEnv('MAIL_PASSWORD');

const mailConfig = {
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: MAIL_USERNAME,
    pass: MAIL_PASSWORD,
  },
};
const transporter = nodemailer.createTransport(mailConfig);

const confirmAccountMessage = (email: string, token: string) => ({
  from: 'Galeries <sender@mail.com>',
  to: email,
  subject: 'validate your account',
  text: 'Hello',
  html: `<html>
    <body>
      <h1>Galeries</h1>
      <p>Please click this link to confirm your email:</p>
      <a href='https://www.localhost:3000/confirmation/${token}'>
        https://www.localhost:3000/confirmation/${token}
      </a>
    </body>
  </html>`,
});

const resetPasswordMessage = (email: string, token: string) => ({
  from: 'Galeries <sender@mail.com>',
  to: email,
  subject: 'reset your password',
  text: 'Hello',
  html: `<html>
    <body>
      <h1>Galeries</h1>
      <p>Please click this link to reset your password:</p>
      <a href='https://www.localhost:3000/resetPassword/${token}'>
        https://www.localhost:3000/resetPassword/${token}
      </a>
    </body>
  </html>`,
});

export const sendConfirmAccount = (email: string, emailToken: string) => transporter.sendMail(
  confirmAccountMessage(email, emailToken),
);
export const sendResetPassword = (email: string, emailToken: string) => transporter.sendMail(
  resetPasswordMessage(email, emailToken),
);
