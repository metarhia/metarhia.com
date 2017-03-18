(client, callback) => {
  client.upload((file) => {
    callback({ storageCode: file.storageName });
  });
}
