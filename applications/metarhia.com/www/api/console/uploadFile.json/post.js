(client, callback) => {
  client.upload(({ storageName }) => {
    const filePath = api.files.attachmentNameToFilePath(storageName);
    api.files.addToDeletingTask(filePath, client.query.timeout);
    callback({ storageCode: storageName });
  });
}
