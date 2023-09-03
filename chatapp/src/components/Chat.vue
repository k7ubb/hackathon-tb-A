<script setup>
import { inject, ref, reactive, onMounted, onUnmounted } from "vue"
import { useStore } from 'vuex';
import { useRouter } from 'vue-router'
import io from "socket.io-client"
import "../styles/chat.css"

// constants
const publishInterval = 5
const validCharaLength = 300 // 文字数制限
const lastUser = ref(null)
// #region global state
const userName = inject("userName")
// #endregion
const selectedUser = ref(null)

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
const chat_id = inject("chat_id")

//連絡の機能で使用する変数
const contactValidCharaLength = 100
const isContactVisible = ref(false)

// 相談の機能で使用する変数
const valid_date = ref(null)
const isConsultVisible = ref(false)

// 返信表示とメモ表示の切り替え
const isMemoDisplayOn = ref(false)

// 返信表示欄
const replyMessageName = ref('')
const replyMessageID = ref('')
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
    if(chatContent.value.length>contactValidCharaLength){
      alert("「連絡」の文字数は"+contactValidCharaLength+"以下です。現在文字数 : "+chatContent.value.length)
      return
    }
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

  chat_id.value += 1;

  const json_chat = {
    chatID: chat_id.value,
    type: "message",
    message_type: chat_type.value,
    username: userName.value,
    message: chatContent.value,
    unixtime: Date.now(),
    valid_date: valid_date.value,
    targetUser: selectedUser.value,  // 選択されたユーザー
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
    isContactVisible.value = false
  }else if(chatType === "contact_message"){
    // 連絡ボタン
    chatContent.value = "- 現状：\n";
    isConsultVisible.value = false
    isContactVisible.value = true
  }else if(chatType === "consult_message"){
    // 相談ボタン
    chatContent.value = "- 現状の問題点：\n- 考えられる原因：";
    isConsultVisible.value = true
    isContactVisible.value = false
  }else if(chatType === "confirm_message"){
    // 確認ボタン
    chatContent.value = "ccccccccc";
    isConsultVisible.value = false
    isContactVisible.value = false
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

// 返信欄の表示→投稿欄の特定の投稿が押されたとき
const replyDisplayOn = (contributor, chat_number) => {
  replyMessageName.value = contributor;
  replyMessageID.value = chat_number;
  isMemoDisplayOn.value = false;
}

const memoDisplayOn = () =>{
  isMemoDisplayOn.value = true;
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
  store.commit('setID', chat.chatID);
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

  const handleOnlineUsers = (data) => {
    store.commit('setOnlineUsers', JSON.parse(data));
  };

  const handleError = (data) => {
    alert(data)
  }

  socket.on("enterEvent", handleEnterEvent);
  socket.on("exitEvent", handleExitEvent);
  socket.on("publishEvent", handlePublishEvent);
  socket.on("error", handleError)
  socket.on("onlineUsers", handleOnlineUsers);

  onUnmounted(() => {
    socket.off("enterEvent", handleEnterEvent);
    socket.off("exitEvent", handleExitEvent);
    socket.off("publishEvent", handlePublishEvent);
    socket.off("onlineUsers", handleOnlineUsers);
  });
};
// #endregion
</script>

<template>
  <!-- 投稿入力欄 -->
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">報連相 チャットルーム</h1>
    <div class="'input-section mt-10'">
      <p class="login-user">ログインユーザ：{{ userName }}さん</p>

      <div class="flex">
        <div>
          <input type="radio" name="options" class="radiobutton" id="report" @click="onOptions('report_message')" checked><label for="report">報告</label>
          <input type="radio" name="options" class="radiobutton" id="contact" @click="onOptions('contact_message')"><label for="contact">連絡</label>
          <input type="radio" name="options" class="radiobutton" id="consult" @click="onOptions('consult_message')"><label for="consult">相談</label>
          <input type="radio" name="options" class="radiobutton" id="confirm" @click="onOptions('confirm_message')"><label for="confirm">確認</label>
        </div>
        <div class="display-by-function consult-option" v-if="isConsultVisible">回答期限:<input type="datetime-local" step="300" v-model="valid_date"></div>
        <div class="display-by-function contact-option" :class="{ 'red': (chatContent.length>contactValidCharaLength)}" v-else-if="isContactVisible">文字数：{{chatContent.length}}/{{contactValidCharaLength}}</div>
      </div>
      <!-- Enter キーが押されたときに投稿可能 -->
      <!-- オンラインユーザーの表示 -->
      <div class="online-users flex">
        <p>メンションするオンラインユーザー</p>
        <select v-model="selectedUser" class="select">
          <option disabled value="">選択してください</option>
          <option v-for="user in store.state.onlineUsers" :key="user" :value="user">
            {{ user }}
          </option>
        </select>
      </div>
      <textarea @keydown.enter.exact="onPublish" variant="outlined" placeholder="投稿文を入力してください " v-model="chatContent" rows="4" class="area"></textarea>

      <div class="mt-5">
          <button class="button-normal" @click="onPublish">投稿</button>
          <button class="button-normal util-ml-8px" @click="onMemo">メモ</button>
          <label><input type="checkbox" v-model="show_order"> 新しいメッセージを上に表示</label>
      </div>
    </div>

    <!-- 投稿表示欄 -->
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
                  <div class="item2"  :class="{ 'my-message': (chat.type === 'message' && chat.username === userName), 'others-message':  (chat.type === 'message' && chat.username !== userName), 'mentioned': (chat.type === 'message' && chat.targetUser === userName)}">
                    <pre>{{chat.chatID + chat.username + "さん " +"["+new Date(chat.unixtime).toLocaleString("jp-JP")+"]" }}</pre>
                    <pre id="messageContent" @click="replyDisplayOn(chat.username, chat.chatID)">{{ chat.message }}</pre>
                    <span v-if="chat.targetUser !== userName"> ({{ chat.targetUser }}へメンションされています)</span>
                    <span v-else="chat.targetUser === userName">（このメッセージはあなたへメンションされています）</span>
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
        <div class="flex">
          <h3 @click="memoDisplayOn">メモ一覧</h3>
          <h3>返信</h3>
        </div>
        <div v-if="isMemoDisplayOn">
          <ul>
            <li v-for="(memo, i) in memoList.slice().reverse()" :key="i">
              <!-- memo を pre タグ内で表示 -->
              <pre>{{ memo.message }}</pre>
            </li>
          </ul>
        </div>
        <div v-else>
          <ul>
            <li v-for="(reply, i) in store.state.replyList" :key="i">
              <div v-if="reply.chatname===replyMessageName && reply.contentID===replyMessageID">
                <pre>username: {{reply.username}}</pre>
                <pre>{{reply.message}}</pre>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>
    <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit" @click="onExit">退室する</button>
    </router-link>
  </div>
</template>
