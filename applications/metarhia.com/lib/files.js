api.files = {};

api.files.attachmentNameToFilePath = (
  // transofrms attachmentName to file path in filesystem
  attachmentName // name which can be got from uploadFile
) => {
  const prefix1 = attachmentName.slice(0, 2);
  const prefix2 = attachmentName.slice(2, 4);
  const fileName = attachmentName.slice(4);
  const filePath = (
    application.dir + '/files/' +
    prefix1 + '/' + prefix2 + '/' + fileName
  );
  return filePath;
};

{
  const impress = {};
  impress.ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  impress.ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
  impress.ALPHA = impress.ALPHA_UPPER + impress.ALPHA_LOWER;
  impress.DIGIT = '0123456789';
  impress.ALPHA_DIGIT = impress.ALPHA + impress.DIGIT;
  
  api.files.uploadFile = (
    // Upload file to files folder.
    options, // <Readable> | { inp: <Readable>, timeout: <string> }. 
             // Readable is data of the file.
             // timeout defines time after which remove file
    callback // <Function> (err, downloadedCode).
             // downloadedCoded represents file.
            // Can be passed to downloadFile.
  ) => {
    let inp, timeout;
    if (options instanceof api.stream.Readable) {
      inp = options;
    } else {
      inp = options.inp;
      timeout = options.timeout;
    }
  
    const folder1 = api.common.generateKey(2, impress.DIGIT);
    const folder2 = api.common.generateKey(2, impress.DIGIT);
    const code = api.common.generateKey(8, impress.ALPHA_DIGIT);
    const downloadCode = folder1 + folder2 + code;
    const targetDir = application.dir + '/files/' + folder1 + '/' + folder2;
  
    const storagePath = targetDir + '/' + code;
    api.mkdirp(targetDir, () => {
      const ws = api.fs.createWriteStream(storagePath);
      inp.pipe(ws);
      inp.on('end', () => {
        if (timeout !== undefined) {
          api.files.addToDeletingTask(storagePath, timeout);
        }
        callback(null, downloadCode);
      });
    });
  };
}

api.files.addToDeletingTask = (
  // Remove storagePath from filesystem after timeout.
  // Task runs every application.tasks.fileDeleteing.interval and check if file is needed to remote
  storagePath, // path to removing object
  timeout // timeout for removing.
          // timeout must be less than config.filestorage.MAX_TIMEOUIT.
          // If timeout is 0 then config.filestorage.DEFAULT_TIMEOUT is taken. 
) => {
  const { DEFAULT_TIMEOUT, MAX_TIMEOUT } = application.filestorage;
  timeout = timeout ? Math.min(timeout, MAX_TIMEOUT) : DEFAULT_TIMEOUT;

  application.tasks.fileDeleting.files[storagePath] = {
    uploadTime: Date.now(),
    timeout,
  };
};
