(client, callback) => {

  client.upload((file) => {
    console.dir({ uploadedFile: file });
    callback({ storageCode: file.storageName });
  }, (doneCount) => {
    console.log('All ' + doneCount + ' file(s) are uploaded.');
  });

}
