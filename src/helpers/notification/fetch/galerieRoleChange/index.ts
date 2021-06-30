import {
  Notification,
} from '#src/db/models';

export default (
  notification: Notification,
) => ({
  ...notification.toJSON(),
  frame: undefined,
  num: undefined,
});
