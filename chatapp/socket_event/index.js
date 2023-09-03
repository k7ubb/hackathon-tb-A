let lastUser=null
let connectedUsers = [];

export default (io, socket) => {
  socket.emit("onlineUsers", JSON.stringify(connectedUsers));

  socket.on("enterEvent", (data) => {
    const user = JSON.parse(data).username;
    console.log(user)
    if (!connectedUsers.includes(user)) {
      connectedUsers.push(user);
    }
    console.log(connectedUsers)
    io.sockets.emit("onlineUsers", JSON.stringify(connectedUsers));

    socket.broadcast.emit("enterEvent", data)
  })

  socket.on("exitEvent", (data) => {
    const user = JSON.parse(data).username;
    const index = connectedUsers.indexOf(user);
    if (index > -1) {
      connectedUsers.splice(index, 1);
    }
    io.sockets.emit("onlineUsers", JSON.stringify(connectedUsers));
    socket.broadcast.emit("exitEvent", data);
  });

  // 投稿メッセージを送信する
  socket.on("publishEvent", (data) => {
    const user = JSON.parse(data).username

    if (user === lastUser ) {
      socket.emit("error", "連続して投稿することはできません。");
      lastUser = user
      return;
    }

    lastUser = user
    io.sockets.emit("publishEvent", data)
  })

  socket.on('publishReplyEvent', (data) => {
    const newReply = JSON.parse(data);
    io.emit('publishReplyEvent', JSON.stringify(newReply));
  });
}