(callback) => {
  if (!connection.isUploading) {
    return callback(api.metacom.errors.ERR_UPLOAD_NOT_STARTED);
  }
  connection.fileStream.end();
  callback(null, connection.uploadCode.join(''));
}
