# Galerie REST Server

#### TODLIST

Install in dev :
Install webpack and use it with babel

clean FB/Google loggers
remove FB/Google registration for beta
create a seed for admin
create invitation code (send it by email)
=> new model with generated code
require invitation code to signin (beta)
style email

comment frame
frame.text = 'lorem ipsum';

1/2/3... like your frame

1/2/3... accept your invitation

type = frame/invitation
us has many
numOfUsers
frameId
galerieId

when likes, create a notification
when unlike, check if notification with notificationUserId/frameId exist
and numOfUsers - 1, if numOfUsers === 0. delete notification

when accept a invit, send notification to all admins/creators

add notification id to user

notificationUser => userId, NotificationId

Test create notification invitation

Add frame numOfLikes (number)

// sequelize migration blacklist userId
user profile picture => current
galerie cover picture => current
