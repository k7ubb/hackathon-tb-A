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
  <v-container fluid fill-height class="d-flex justify-center align-center">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <img src="../images/CL_logo_login_2.png" alt="CL Logo" class="cl-logo">
          <v-card-text>
            <v-text-field
              v-model="userName"
              label="ユーザー名"
              @keydown.enter="onEnter"
            ></v-text-field>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn @click="onEnter">入室する</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>