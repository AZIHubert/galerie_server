import nodemailer from 'nodemailer';

import accEnv from '#src/helpers/accEnv';

const MAIL_PASSWORD = accEnv('MAIL_PASSWORD');
const MAIL_USERNAME = accEnv('MAIL_USERNAME');

const mailConfig = {
  auth: {
    pass: MAIL_PASSWORD,
    user: MAIL_USERNAME,
  },
  host: 'smtp.ethereal.email',
  port: 587,
};

const betaKeyMessage = (email: string, code: string) => ({
  html: `<html>
    <body>
      <h1>Galeries</h1>
      <p>You've receive a betaKey to use Galerie</p>
      <h2>betaKey</h2>
      <p>${code}</p>
      <a target="_blank" href='https://www.localhost:1234/'>
        signin
      </a>
    </body>
  </html>`,
  from: 'Galeries <sender@mail.com>',
  subject: 'validate your email',
  text: 'Hello',
  to: email,
});

const confirmAccountMessage = (email: string, token: string) => ({
  html: `<html>
    <body>
      <h1>Galeries</h1>
      <p>thank you for using galeries</p>
      <p>Please click this link to confirm your email:</p>
      <a target='_blank' href='https://www.localhost:1234/confirmation/${token}'>
        https://www.localhost:1234/confirmation/${token}
      </a>
    </body>
  </html>`,
  from: 'Galeries <sender@mail.com>',
  subject: 'validate your account',
  text: 'Hello',
  to: email,
});

const resetPasswordMessage = (email: string, token: string) => ({
  html: `<html>
    <body>
      <h1>Galeries</h1>
      <p>Please click this link to reset your password:</p>
      <a target="_blank" href='https://www.localhost:1234/resetPassword/${token}'>
        https://www.localhost:1234/resetPassword/${token}
      </a>
    </body>
  </html>`,
  from: 'Galeries <sender@mail.com>',
  subject: 'reset your password',
  text: 'Hello',
  to: email,
});

const updateEmailMessage = (email: string, token: string) => ({
  html: `<html>
    <body>
      <h1>Galeries</h1>
      <p>Please click this link to update your email:</p>
      <a target="_blank" href='https://www.localhost:1234/updateEmail/${token}'>
        https://www.localhost:1234/updateEmail/${token}
      </a>
    </body>
  </html>`,
  from: 'Galeries <sender@mail.com>',
  subject: 'update your email',
  text: 'Hello',
  to: email,
});

const validateEmailMessage = (email: string, token: string) => ({
  html: `<html>
    <body>
      <h1>Galeries</h1>
      <p>Please click this link to validate your email:</p>
      <a target="_blank" href='https://www.localhost:1234/validateEmail/${token}'>
        https://www.localhost:1234/updateEmail/${token}
      </a>
    </body>
  </html>`,
  from: 'Galeries <sender@mail.com>',
  subject: 'validate your email',
  text: 'Hello',
  to: email,
});

export const sendBetaKey = (email: string, code: string) => {
  const transporter = nodemailer.createTransport(mailConfig);
  transporter.sendMail(
    betaKeyMessage(email, code),
    (err) => {
      if (err) transporter.close();
    },
  );
  transporter.close();
};
export const sendConfirmAccount = (email: string, token: string) => {
  const transporter = nodemailer.createTransport(mailConfig);
  transporter.sendMail(
    confirmAccountMessage(email, token),
    (err) => {
      if (err) transporter.close();
    },
  );
  transporter.close();
};
export const sendResetPassword = (email: string, token: string) => {
  const transporter = nodemailer.createTransport(mailConfig);
  transporter.sendMail(
    resetPasswordMessage(email, token),
    (err) => {
      if (err) transporter.close();
    },
  );
  transporter.close();
};
export const sendUpdateEmailMessage = (email: string, token: string) => {
  const transporter = nodemailer.createTransport(mailConfig);
  transporter.sendMail(
    updateEmailMessage(email, token),
    (err) => {
      if (err) transporter.close();
    },
  );
  transporter.close();
};

export const sendValidateEmailMessage = (email: string, token: string) => {
  const transporter = nodemailer.createTransport(mailConfig);
  transporter.sendMail(
    validateEmailMessage(email, token),
    (err) => {
      if (err) transporter.close();
    },
  );
  transporter.close();
};
