let lastUser=null

export default (io, socket) => {
  // 入室メッセージをクライアントに送信する
  socket.on("enterEvent", (data) => {
    socket.broadcast.emit("enterEvent", data)
  })

  // 退室メッセージをクライアントに送信する
  socket.on("exitEvent", (data) => {
    socket.broadcast.emit("exitEvent", data)
  })

  // 投稿メッセージを送信する
  // 投稿メッセージを送信する
  socket.on("publishEvent", (data) => {
    const user = JSON.parse(data).username
    if (user === lastUser) {
      socket.emit("error", "連続して投稿することはできません。")
      return
    }
    lastUser = user
    io.sockets.emit("publishEvent", data)
  })

  socket.on('publishReplyEvent', (data) => {
    const newReply = JSON.parse(data);
    // Broadcast the new reply to all connected clients
    io.emit('publishReplyEvent', JSON.stringify(newReply));
  });
}