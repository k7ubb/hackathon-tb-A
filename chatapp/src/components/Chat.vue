<script setup>
import { inject, ref, reactive, onMounted } from "vue"
import io from "socket.io-client"
import "../styles/chat.css"

// constants
const publishInterval = 5

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const socket = io()
// #endregion

// #region reactive variable
const chatContent = ref("")
const chatList = reactive([])
const memoList = reactive([])

const lastPublishTime = ref(0)
const show_order = ref(true)
// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
// #endregion

// #region browser event handler
// 投稿メッセージをサーバに送信する
const onPublish = () => {
  const currentTime = Date.now()
  event.preventDefault()

  try{
    // 任意時間で連投できないようにする
    if(currentTime - lastPublishTime.value < publishInterval){
      throw new Error('5秒に一度しか送信はできません．お待ち下さい')
    }
    // 空での投稿時
    if(chatContent.value.trim() === ""){
      throw new Error('メッセージを入力してください。')
    }
    if(chatContent.value.includes('\n')){
      throw new Error('不正な改行があります。')
    }
  }
  catch(e) {
    alert(e.message)
    return
  }

  if(chat){
    chat_type = "report_message";
  }

  socket.emit("publishEvent", JSON.stringify({
    type: "message",
    message_type: chat_type,
    username: userName.value,
    message: chatContent.value,
    unixtime: Date.now()
  }))

  lastPublishTime.value = currentTime

  // 入力欄を初期化
  chatContent.value = ''
}

// 報告ボタン
const onReport = () => {
  chatContent.value = "aaaaaaa";
  chat_type = "report_message";
}

// 連絡ボタン
const onContact = () => {
  chatContent.value = "bbbbbbbb";
  chat_type = "contact_message";
}

// 相談ボタン
const onConsultation = () => {
  chatContent.value = "ccccccccc";
  chat_type = "consult_message";
}

// 確認ボタン
const onConfirmation = () => {

}


// メモを画面上に表示する
const onMemo = () => {
  memoList.push({
    type: "memo",
    username: userName.value,
    message: chatContent.value,
    unixtime: Date.now()
  });

  // 入力欄を初期化
  chatContent.value = ''
}

// 退室メッセージをサーバに送信する
const onExit = () => {
  socket.emit("exitEvent", JSON.stringify({
    type: "leave_message",
    username: userName.value,
    message: userName.value + "さんが退室しました",
    unixtime: Date.now()
  }))
}
// #endregion

// #region socket event handler
// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (data) => {
  chatList.push(JSON.parse(data))
}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = (data) => {
  chatList.push(JSON.parse(data))
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (data) => {
  chatList.push(JSON.parse(data))
}
// #endregion

// #region local methods
// イベント登録をまとめる
const registerSocketEvent = () => {
  // 入室イベントを受け取ったら実行
  socket.on("enterEvent", (data) => {
    onReceiveEnter(data)
  })

  // 退室イベントを受け取ったら実行
  socket.on("exitEvent", (data) => {
    onReceiveExit(data)
  })

  // 投稿イベントを受け取ったら実行
  socket.on("publishEvent", (data) => {
    onReceivePublish(data)
  })

  // エラーの実行
  // 現状， 連続投稿の場合の処理に使用
  socket.on("error", (data) => {
    alert(data) // エラーメッセージをアラートとして表示
  })
}
// #endregion
</script>

<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
    <div class="'input-section mt-10'">
      <p class="login-user">ログインユーザ：{{ userName }}さん</p>
      <div>
        <button class="button-normal" @click="onReport">報告</button>
        <button class="button-normal" @click="onContact">連絡</button>
        <button class="button-normal" @click="onConsultation">相談</button>
        <button class="button-normal" @click="onConfirmation">確認</button>
      </div>
      <!-- Enter キーが押されたときに投稿可能 -->
      <textarea @keydown.enter.exact="onPublish" variant="outlined" placeholder="投稿文を入力してください " v-model="chatContent" rows="4" class="area"></textarea>
      <div class="mt-5">
          <button class="button-normal" @click="onPublish">投稿</button>
          <button class="button-normal util-ml-8px" @click="onMemo">メモ</button>
          <label><input type="checkbox" v-model="show_order"> 新しいメッセージを上に表示</label>
      </div>
    </div>
    <div class="chat-memo-container mt-10">
      <div class="chat-section">
        <div class="mt-5" v-if="chatList.length !== 0">
          <ul>
            <li class="item mt-4" v-for="(chat, i) in show_order? chatList.slice().reverse() : chatList.slice()" :key="i" :class="{ 'my-message': (chat.type === 'message' && chat.username === userName) }">
              <!-- chat を pre タグ内で表示 -->
              <pre class="{ chat.type }" v-if="chat.type=='message'">{{ chat.username + "さん :" + chat.message +"["+new Date(chat.unixtime).toLocaleString("jp-JP")+"]"}}</pre>
              <pre class="{ chat.type }"  v-else>{{ chat.message }}</pre>
            </li>
          </ul>
        </div>
      </div>
      <div class="memo-section">
        <h3>メモ一覧</h3>
        <ul>
          <li v-for="(memo, i) in memoList.slice().reverse()" :key="i">
            <!-- memo を pre タグ内で表示 -->
            <pre>{{ memo }}</pre>
          </li>
        </ul>
      </div>
    </div>
    <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit" @click="onExit">退室する</button>
    </router-link>
  </div>
</template>
