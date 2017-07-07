(chunk, callback) => {
  if (typeof chunk !== 'string' ||
      chunk.length > application.config.metacom.MAX_CHUNK_SIZE) {
    return callback(api.jstp.ERR_INVALID_SIGNATURE);
  }

  if (!connection.upload) {
    connection.upload = true;
    connection.uploadBuffer = '';
    connection.uploadStream = new api.stream.Readable({
      read() {
        let canPushMore = true;
        canPushMore = this.push(connection.uploadBuffer, 'base64');
        connection.uploadBuffer = '';
        if (!connection.upload && canPushMore) {
          this.push(null);
        }
      }
    });

    connection.uploadCode = api.metacom.generateFileCode();
    const uploadDir = api.path.join(
      application.dir,
      'files',
      connection.uploadCode[0],
      connection.uploadCode[1]
    );

    api.mkdirp(uploadDir, () => {
      connection.uploadStream.pipe(api.fs.createWriteStream(
        api.path.join(uploadDir, connection.uploadCode[2])
      ));
    });
  }

  connection.uploadBuffer += chunk;

  callback();
}
