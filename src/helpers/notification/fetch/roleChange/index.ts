import {
  Notification,
} from '#src/db/models';

export default (
  notification: Notification,
) => ({
  ...notification.toJSON(),
  frame: undefined,
  galerie: undefined,
  num: undefined,
});
