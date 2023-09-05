let lastUser = ""
let chat_count = 0
let connectedUsers = []

export default (io, socket) => {
  socket.emit("onlineUsers", JSON.stringify(connectedUsers))

  // ログイン前に、usernameが使用可能か確認する
  socket.on("tryEnter", (username) =>{
    socket.emit(connectedUsers.includes(username)? "login_deny" : "login_arrow")
  })

  for(let event of ["enterEvent", "exitEvent", "publishEvent", "publishReplyEvent"]){
    socket.on(event, (data_json) => {
      const data = JSON.parse(data_json)
      const user = data.username

      switch(event) {
        case "enterEvent":
          if (connectedUsers.includes(user)) {
            socket.emit("error", "その名前は既に使われています。他の名前で入室してください")
            return
          }
          connectedUsers.push(user);
          break

        case "exitEvent":
          connectedUsers = connectedUsers.filter((x) => x != user)
          break

        case "publishEvent":
          if (user === lastUser) {
            socket.emit("error", "連続して投稿することはできません。")
            return
          }
          lastUser = user
          break
      }
      
      io.sockets.emit("onlineUsers", JSON.stringify(connectedUsers))

      data.chatID = ++chat_count
      data.unixtime = Date.now()
      io.sockets.emit(event, JSON.stringify(data))
    })
  }
}
