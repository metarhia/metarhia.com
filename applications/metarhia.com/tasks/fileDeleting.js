{
  caption: 'Deleting files',
  execute: 'server',

  interval: '5s',

  run(task, callback) {
    const { files } = task;
    const filePathes = Object.keys(files);

    if (filePathes.length === 0) {
      callback(null);
    }

    api.metasync.map(filePathes, (filePath, callback) => {
      const file = files[filePath];
      const { uploadTime, timeout } = file;

      if (Date.now() > uploadTime + timeout) {
        api.fs.unlink(filePath, (err) => {
          callback(null, [null, err ? filePath : null]);  
        });
      } else {
        callback(null, [file, filePath]);
      }
    }, (_, filesResult) => {
      const newFiles = {};
      for (const [file, filePath] of filesResult) {
        if (file !== null) {
          newFiles[filePath] = file;
        } else if (filePath !== null) {
          application.log.warning(`Can not unlink file ${filePath}`);
        }
      }
      task.files = newFiles;
      callback(null);
    });
  },

  files: {},
}
