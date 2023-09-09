<script setup>
import { inject, ref } from "vue"
import { useRouter } from "vue-router"
import io from "socket.io-client"
import "../styles/login.css"
import "../styles_responsive/login.css"

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

socket.on("login_allow", () => {
  socket.emit("enterEvent", JSON.stringify({
    type: "enter_message",
    username: userName.value,
    message:  "入室："+userName.value+"さん",
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
</script>

<template>
  <div class="login">
    <div>
      <h1>コミュニケーションラボ</h1>
      <input @keydown.enter="onEnter" type="text" v-model="userName" placeholder="ユーザー名" />
      <button @click="onEnter">入室する</button>
    </div>
  </div>
</template>
