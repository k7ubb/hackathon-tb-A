<script setup>
import { inject, ref } from "vue"
import { useRouter } from "vue-router"
import io from "socket.io-client"
import "../styles/login.css"
import "../styles_mobile/login.css"

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const router = useRouter()
const socket = io()
// #endregion

// #region reactive variable
const inputUserName = ref("")
// #endregion

// #region local methods
socket.on("login_deny", () => {
  alert("このユーザ名はすでに使われています。")
})

socket.on("login_arrow", () => {
  socket.emit("enterEvent", JSON.stringify({
    type: "enter_message",
    username: userName.value,
    message: userName.value + "さんが入室しました",
    unixtime: Date.now()
  }))
  router.push({ name: "chat" })
})
// #endregion

// #region browser event handler
// 入室メッセージをクライアントに送信する
const onEnter = () => {
  
  if(userName.value === ""){
    alert("ユーザー名を入力してください。")
    return
  }
  if(userName.value.length>20){
    alert("20文字以内で入力してください。")
    return
  }

  socket.emit("tryEnter", userName.value)
}



// #regin debug
//userName.value = "test" + Math.floor(Math.random()*100)
// #endregion
</script>

<template>
  <div class="login">
    <div>
      <h1>コミュニケーションラボ</h1>
      <input type="text" v-model="userName" />
      <button @click="onEnter">入室する</button>
    </div>
  </div>
</template>


