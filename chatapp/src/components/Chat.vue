<script setup>
import { inject, ref, reactive, onMounted, onUnmounted } from "vue"
import { useStore } from 'vuex';
import { useRouter } from 'vue-router'
import io from "socket.io-client"
import "../styles/chat.css"

// constants
const publishInterval = 5
const validCharaLength = 300 // 文字数制限

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const router = useRouter()
const store = useStore();
const socket = io()
// #endregion

// #region reactive variable
const chatContent = inject("chatContent")
const chatList = reactive([])
const memoList = reactive([])

const lastPublishTime = ref(0)
const show_order = ref(true)
const chat_type = inject("chat_type")

const valid_date = ref(null)
const isConsultVisible = ref(false)
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
    if(chatContent.value.length > validCharaLength){
      throw new Error('文字数上限を超えています。'+chatContent.value.length+"/"+validCharaLength)
    }
  }
  catch(e) {
    alert(e.message)
    return
  }

  if(chat_type.value === "report_message"){
    // 報告ボタン
    // alert("報告")
  }
  else if(chat_type.value === "contact_message"){
    // 連絡ボタン
    // alert("連絡")
  }
  else if(chat_type.value === "consult_message"){
    // 相談ボタン
    // alert("相談")
  }
  else if(chat_type.value === "confirm_message"){
    // 確認ボタン
    // alert("確認")
  }

  if(isConsultVisible.value===false){
    valid_date.value = null
  }

  const json_chat = {
    type: "message",
    message_type: chat_type.value,
    username: userName.value,
    message: chatContent.value,
    unixtime: Date.now(),
    valid_date: valid_date.value
  }

  socket.emit("publishEvent", JSON.stringify(json_chat));
  store.commit('addChat', json_chat);

  lastPublishTime.value = currentTime
  // 入力欄を初期化
  chatContent.value = ''
  onOptions("report_message");
}


// ほうれんそう選択時の処理
const onOptions = (chatType) => {
  chat_type.value = chatType;
  if(chatType === "report_message"){
    // 報告ボタン
    chatContent.value = "- 進捗・結果：\n";
    isConsultVisible.value = false
  }else if(chatType === "contact_message"){
    // 連絡ボタン
    chatContent.value = "- 現状：\n";
    isConsultVisible.value = false
  }else if(chatType === "consult_message"){
    // 相談ボタン
    chatContent.value = "- 現状の問題点：\n- 考えられる原因：";
    isConsultVisible.value = true
  }else if(chatType === "confirm_message"){
    // 確認ボタン
    chatContent.value = "ccccccccc";
    isConsultVisible.value = false
  }
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
  store.state.chatList.push(JSON.parse(data))
}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = (data) => {
  store.state.chatList.push(JSON.parse(data))
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (data) => {
  store.state.chatList.push(JSON.parse(data))
}
// #endregion

const onReply = (chat) => {
  store.commit('setMessage', chat.message);
  store.commit('setUser', chat.username);
  router.push({ name: "reply", params:{chatId: chat.unixtime}})
}

// #region local methods
// イベント登録をまとめる
const registerSocketEvent = () => {
  const handleEnterEvent = (data) => {
    store.commit('addChat', JSON.parse(data));
  };

  const handleExitEvent = (data) => {
    store.commit('addChat', JSON.parse(data));
  };

  const handlePublishEvent = (data) => {
    store.commit('addChat', JSON.parse(data));
  };

  socket.on("enterEvent", handleEnterEvent);
  socket.on("exitEvent", handleExitEvent);
  socket.on("publishEvent", handlePublishEvent);

  onUnmounted(() => {
    socket.off("enterEvent", handleEnterEvent);
    socket.off("exitEvent", handleExitEvent);
    socket.off("publishEvent", handlePublishEvent);
  });
};
// #endregion
</script>

<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">ほうれんそう チャットルーム</h1>
    <div class="'input-section mt-10'">
      <p class="login-user">ログインユーザ：{{ userName }}さん</p>
      <div class="flex">
        <div>
          <input type="radio" name="options" @click="onOptions('report_message')" checked>報告
          <input type="radio" name="options" @click="onOptions('contact_message')">連絡
          <input type="radio" name="options" @click="onOptions('consult_message')">相談
          <input type="radio" name="options" @click="onOptions('confirm_message')">確認
        </div>
        <div class="inputdate">
          <p class="consult-option" v-if="isConsultVisible"> 回答期限:<input type="datetime-local" step="300" v-model="valid_date"></p>
        </div>
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
        <div class="mt-5" v-if="store.state.chatList.length !== 0">
          <ul>
            <li class="item mt-4" v-for="(chat, i) in show_order? store.state.chatList.slice().reverse() : store.state.chatList.slice()" :key="i">
              <!-- chat を pre タグ内で表示 -->
              <div class="{ chat.type }" v-if="chat.type=='message'">
                <div class="flex">
                  <div class="item1">
                    <div class="optionIcon" v-if="chat.message_type==='report_message'">報告</div>
                    <div class="optionIcon" v-else-if="chat.message_type==='contact_message'">連絡</div>
                    <div class="optionIcon" v-else-if="chat.message_type==='consult_message'">相談</div>
                    <div class="optionIcon" v-else-if="chat.message_type==='confirm_message'">確認</div>
                  </div>
                  <div class="item2"  :class="{ 'my-message': (chat.type === 'message' && chat.username === userName) }">
                    <pre>{{ chat.username + "さん " +"["+new Date(chat.unixtime).toLocaleString("jp-JP")+"]" }}</pre>
                    <pre id="messageContent">{{ chat.message }}</pre>
                    <pre><button class="button-normal" @click="onReply(chat)">返信</button><span class="consult-option notes" v-if="chat.valid_date!=null">{{ "※回答期限："+chat.valid_date }}</span></pre>

                  </div>
                </div>
              </div>
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
            <pre>{{ memo.message }}</pre>
          </li>
        </ul>
      </div>
    </div>
    <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit" @click="onExit">退室する</button>
    </router-link>
  </div>
</template>
