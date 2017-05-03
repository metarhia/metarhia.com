api.files = {};

api.files.attachmentNameToFilePath = (attachmentName) => {
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
  
  api.files.uploadFile = (options, callback) => {
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

api.files.addToDeletingTask = (storagePath, timeout) => {
  const { DEFAULT_TIMEOUT, MAX_TIMEOUT } = application.filestorage;
  timeout = timeout ? Math.min(timeout, MAX_TIMEOUT) : DEFAULT_TIMEOUT;

  application.tasks.fileDeleting.files[storagePath] = {
    uploadTime: Date.now(),
    timeout,
  };
};
