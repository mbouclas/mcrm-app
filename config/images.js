module.exports = {
  provider: 'CloudinaryProvider',
  cloudinary: {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    folder: process.env.CLOUDINARY_FOLDER || '',
  },
  copies: [

  ],
}
