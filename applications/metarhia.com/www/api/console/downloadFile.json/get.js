(client, callback) => {
  const attachmentName = client.query.file;
  if (!attachmentName) callback({ error: 'file not found' });
  const filePath = api.files.attachmentNameToFilePath(attachmentName);
  client.download(filePath, attachmentName, () => {
    api.fs.unlink(filePath, callback);
  });
}
