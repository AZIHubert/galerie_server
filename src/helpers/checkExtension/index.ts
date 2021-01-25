export default (file: any) => {
  const {
    originalname,
    mimetype,
  } = file;
  const filetypes = /jpeg|jpg|png/;
  const extnameExtension = filetypes.test(originalname.toLowerCase());
  const mimetypeExtension = filetypes.test(mimetype);
  return (mimetypeExtension && extnameExtension);
};
