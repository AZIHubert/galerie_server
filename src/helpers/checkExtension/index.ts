export default (file: any) => {
  const {
    mimetype,
    originalname,
  } = file;
  const filetypes = /jpeg|jpg|png/;
  const extnameExtension = filetypes.test(originalname.toLowerCase());
  const mimetypeExtension = filetypes.test(mimetype);
  return (extnameExtension && mimetypeExtension);
};
