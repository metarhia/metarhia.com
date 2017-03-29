(client, callback) => {
  const attachmentName = client.query.file;
  if (!attachmentName) callback({ error: 'file not found' });
  const prefix1 = attachmentName.slice(0, 2);
  const prefix2 = attachmentName.slice(2, 4);
  const fileName = attachmentName.slice(4);
  const filePath = (
    application.dir + '/files/' +
    prefix1 + '/' + prefix2 + '/' + fileName
  );
  console.dir({ attachmentName, filePath, fileName });
  client.download(filePath, attachmentName, () => {
    console.log('Unlink it!');
    api.fs.unlink(filePath, callback);
  });
}
