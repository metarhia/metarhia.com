(code, callback) => {
  if (typeof code !== 'string') {
    return callback(api.jstp.ERR_INVALID_SIGNATURE);
  }

  const prefix1 = code.slice(0, 2);
  const prefix2 = code.slice(2, 4);
  const fileName = code.slice(4);
  const filePath = api.path.join(
    application.dir,
    'files',
    prefix1,
    prefix2,
    fileName
  );

  // 3/4 because of base64 encoding
  const subchunkLength = application.config.metacom.MAX_CHUNK_SIZE * 3 / 4;

  const readStream = api.fs.createReadStream(filePath);
  let isOpen = false;
  let mimeTypeSent = false;

  readStream.on('error', (error) => {
    if (!isOpen) {
      return callback(api.metacom.errors.ERR_NO_SUCH_FILE);
    }
    application.log.error(
      `In metacom.downloadFile on reading the file: ${error}`
    );
  });

  readStream.once('open', () => {
    isOpen = true;
    callback();
  });

  readStream.on('data', (chunk) => {
    if (!mimeTypeSent) {
      let fileType = api.fileType(chunk);
      if (fileType) {
        fileType = fileType.mime;
      }
      connection.emitRemoteEvent('metacom', 'downloadFileStart', [fileType]);
      mimeTypeSent = true;
    }
    let subchunkStart = 0;
    let subchunkEnd;
    while (subchunkStart !== chunk.length) {
      subchunkEnd = Math.min(chunk.length, subchunkStart + subchunkLength);
      connection.emitRemoteEvent('metacom', 'downloadFileChunk',
        [chunk.toString('base64', subchunkStart, subchunkEnd)]);
      subchunkStart = subchunkEnd;
    }
  });

  readStream.once('end', () => {
    connection.emitRemoteEvent('metacom', 'downloadFileEnd', []);
    api.fs.unlink(filePath, (error) => {
      if (error) {
        application.log.error(
          `In metacom.downloadFile on unlinking the file: ${error}`
        );
      }
    });
  });
}
