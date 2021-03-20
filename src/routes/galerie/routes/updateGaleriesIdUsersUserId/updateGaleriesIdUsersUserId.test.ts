describe('galerie', () => {
  describe(':id', () => {
    describe('users', () => {
      describe(':userId', () => {
        describe('PUT', () => {
          describe('should return status 200 and', () => {
            it('and update user\'s role to user if previous role was admin', () => {});
            it('and update user\'s role to admin if previous role was user', () => {});
          });
          describe('should return status 400', () => {
            it('if userId and current user id are the same', () => {});
            it('if current user role in this galerie is "user"', () => {});
            it('if userId role is creator', () => {});
            it('if userId role is admin and current user role is admin', () => {});
          });
          describe('should return status 404', () => {
            it('if galerie not found', () => {});
            it('if user not found', () => {});
          });
        });
      });
    });
  });
});
