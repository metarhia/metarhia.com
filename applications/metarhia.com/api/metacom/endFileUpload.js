(callback) => {
  if (!connection.upload) {
    return callback(api.metacom.errors.ERR_UPLOAD_NOT_STARTED);
  }
  connection.upload = false;
  callback(null, connection.uploadCode.join(''));
}
