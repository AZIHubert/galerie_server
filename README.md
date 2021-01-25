# Galerie REST Server

#### TODLIST

Install in dev :
Install webpack and use it with babel

1. initialise git/github
2. **DONE** install eslint/pretify and initialize it **DONE**
3. install sequilize and initialize it
4. install jest and all other test tools
    1. auth strategy
        1. create a first root for _auth_
        2. test if server is running on default port
        3. test to add a new user
            - check if his username is valid (_need to be unique_)
                - 2-15 (_15 or more ?_) chars **DONE**
                    - if not, receive an error code **DONE**
            - check if his username doesn't already exist yet
                - if not, receive an error code **DONE**
            - check if his email doesn't already exist yet
                - if not, receive an error code **DONE**
            - check if his password is valid **DONE**
                - 8-20 chars **DONE**
                - need 1 uppercase **DONE**
                - need 1 special char **DONE**
                    - if not, receive an error code **DONE**
            - double check his password **DONE**
                - if not, receive an error code
        4. test to get this user **DONE**
        5. test to get a user who doesn't exist
        6. test to delete this user
        7. test to delete a user who doesn't exist
        8. encrypt his password (with **bcrypt**)
        9. try to login
            - need to use **cookies**
            - check if his encrypted password match
        10. try to login without being connected
        11. try to logout
            - need to delete **cookies**
        12. try to login without being connected
        13. send an email to verify is account
            - It should not be able to login if is account is not verify
            - test email sending strategy
        14. create an account with **passportjs**
            - test **faceboook** strategy
            - test **google** strategy
        15. allow user to change their username
        16. allow user to change their email adress
            - need 2 fields
                1. old email
                2. new email
            - send an email to their new email to confirm the change
        17. allow user to change their password
            - need 3 fields:
                1. old password
                2. new password
                3. confirm new password
            - send an email to confirm their new password
        18. add a default PP to the user
            - use **Google Storage** ?
            - if a default PP doesn't exist when get request is send, add automatically this default PP
        19. allow user to upload PP
            - all of his uploaded PP need to be encrypted
            - all of his requested PP need to be decrypted
        20. allow user to delete PP
        21. allow user to change PP
        22. delete all PP from this user if he delete his account
        23. need a way to become a admin
            - all admin can have the possibility to delete any users
    2. galerie
        - create galerie and become the admin of this galerie
            - name of the galerie
            - update name of the galerie
            - picture of the galerie
            - update picture of the galerie
        - delete galerie if your an admin
        - add user to the galerie
        - delete none admin user to this galerie
        - level up a user to be an admin to this galerie
        - add image to this galerie
        - add multiple image to this galerie
        - share image to an other galerie
        - add an image to multiple galerie
        - delete image to this galerie
        - like an image to this galerie
        - delete any galerie if your a high level admin
        - accept an invitation to a gallerie
        - get all galeries
        - unsubscribe to a galerie
    3. interact with other user
        - black list users
        - black list galeries
