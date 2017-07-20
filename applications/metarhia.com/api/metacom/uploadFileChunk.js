(chunk, callback) => {
  if (typeof chunk !== 'string' ||
      chunk.length > application.config.metacom.MAX_CHUNK_SIZE) {
    return callback(api.jstp.ERR_INVALID_SIGNATURE);
  }

  if (connection.isUploadingRightNow) {
    return callback(api.metacom.errors.ERR_PREVIOUS_UPLOAD_NOT_FINISHED);
  }

  connection.isUploadingRightNow = true;

  function finishChunkUpload() {
    connection.isUploadingRightNow = false;
    callback();
  }

  function writeChunkToFileWriteStream() {
    if (!connection.fileStream.write(chunk)) {
      connection.fileStream.on('drain', finishChunkUpload);
    } else {
      finishChunkUpload();
    }
  }

  function finishUpload() {
    connection.fileStream = null;
    connection.isUploading = false;
    connection.removeListener('close', connectionCloseListener);
  }

  function connectionCloseListener() {
    connection.fileStream.end();
  }

  if (!connection.isUploading) {
    connection.uploadCode = api.metacom.generateFileCode();
    const uploadDir = api.path.join(
      application.dir,
      'files',
      connection.uploadCode[0],
      connection.uploadCode[1]
    );

    api.mkdirp(uploadDir, () => {
      connection.fileStream = api.fs.createWriteStream(
        api.path.join(uploadDir, connection.uploadCode[2]),
        'base64'
      );

      connection.fileStream.on('error', (error) => {
        application.log.error(
          `In uploadFileChunk on file WriteStream: ${error}`
        );
        finishUpload();
      });

      const creationErrorListener = () =>
        callback(api.jstp.ERR_INTERNAL_API_ERROR);
      connection.fileStream.once('error', creationErrorListener);

      connection.fileStream.once('open', () => {
        connection.fileStream.removeListener('error', creationErrorListener);
        connection.isUploading = true;
        connection.once('close', connectionCloseListener);
        writeChunkToFileWriteStream();
      });

      connection.fileStream.once('finish', finishUpload);

    });
  } else {
    writeChunkToFileWriteStream();
  }
}
