<script setup>
import { inject, ref } from "vue"
import { useRouter } from "vue-router"
import io from "socket.io-client"
import "../styles/login.css"

// #region global state
const userName = inject("userName")
const chatContent = inject("chatContent")
const chat_type = inject("chat_type")

// #endregion

// #region local variable
const router = useRouter()
const socket = io()
// #endregion

// #region reactive variable
const inputUserName = ref("")
// #endregion

// #region browser event handler
// 入室メッセージをクライアントに送信する
const onEnter = () => {
  // ユーザー名が入力されているかチェック
  if(userName.value===""){
    alert("ユーザー名を入力してください。")
    return
  }

  // 入室メッセージを送信
  socket.emit("enterEvent", JSON.stringify({
    type: "enter_message",
    username: userName.value,
    message: userName.value + "さんが入室しました",
    unixtime: Date.now()
  }))

  // chatContentの初期値を「報告」に設定
  chatContent.value = "aaaaaaa";
  chat_type.value = "report_message";

  // チャット画面へ遷移
  router.push({ name: "chat" })
}
// #endregion
</script>

<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat サンプル</h1>
    <div class="mt-10">
      <p>ユーザー名</p>
      <input type="text" v-model="userName" class="user-name-text" />
    </div>
    <button type="button" @click="onEnter" class="button-normal">入室する</button>
  </div>
</template>
