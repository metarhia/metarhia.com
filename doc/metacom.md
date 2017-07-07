## Interface `metacom`

### Methods

| Description | Name | Arguments | Return value | Possible erors |
|-------------|------|-----------|--------------|----------------|
| Join chat room | `join` | `room: String` | `hasInterlocutor: Boolean` | `ERR_ROOM_TAKEN` (30) |
| Send message in chat | `send` | `message: String` | None | `ERR_NOT_IN_CHAT` (31), `ERR_NO_INTERLOCUTOR` (32) |
| Leave chat room | `leave` | None | None | `ERR_NOT_IN_CHAT` (31) |
| Start file transfer in chat | `startChatFileTransfer` | `mimeType: String` | None | `ERR_NOT_IN_CHAT` (31), `ERR_NO_INTERLOCUTOR` (32) |
| Send next file chunk in chat | `sendFileChunkToChat` | `chunk: String` | None | `ERR_NOT_IN_CHAT` (31), `ERR_NO_INTERLOCUTOR` (32) |
| End file transfer in chat | `endChatFileTransfer` | None | None | `ERR_NOT_IN_CHAT` (31), `ERR_NO_INTERLOCUTOR` (32) |
| Upload next file chunk to server | `uploadFileChunk` | `chunk: String` | None | None |
| End file upload to server | `endFileUpload` | None | `code: String` | `ERR_UPLOAD_NOT_STARTED (34)` |
| Start file download | `downloadFile` | `code: String` | None | `ERR_NO_SUCH_FILE` (33) |

### Events

| Description | Name | Payload |
|-------------|------|---------|
| Emitted when another user joins current chat | `chatJoin` | None |
| Emitted when chat interlocutor leaves the chat | `chatLeave` | None |
| Emitted when chat interlocutor sends a message | `message` | `message: String` |
| Emitted when chat interlocutor starts file transfer | `chatFileTransferStart` | `mimeType: String` |
| Emitted when chat interlocutor sends file chunk | `chatFileTransferChunk` | `fileChunk: String` |
| Emitted when chat interlocutor ends file transfer | `chatFileTransferEnd` | None |
| Emitted when starting a download from server | `downloadFileStart` | `mimeType: String` |
| Emitted when server sends file chunk | `downloadFileChunk` | `fileChunk: String` |
| Emitted when file is completely downloaded | `downloadFileEnd` | None |

### Error codes

| Code | Name | Description |
|------|------|-------------|
| 30   | `ERR_ROOM_TAKEN` | Occurs when joining room that already has 2 people in it. |
| 31   | `ERR_NOT_IN_CHAT` | Occurs when it is required to join chat before the current action. |
| 32   | `ERR_NO_INTERLOCUTOR` | Occurs when user is the only one person in the room. |
| 33   | `ERR_NO_SUCH_FILE` | Occurs when user tries to download file with incorrect code. |
| 34   | `ERR_UPLOAD_NOT_STARTED` | Occurs when user tries to finish uploading file to the server without starting it first. |

### Additional information

Due to the limitations of the protocol, file chunks are encoded as strings
in base64 and maximal chunk size is set to `2^22` bytes (~4MB).
