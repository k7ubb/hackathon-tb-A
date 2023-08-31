import { createRouter, createWebHistory } from "vue-router"
import Chat from "../components/Chat.vue"
import Login from "../components/Login.vue"
import Reply from "../components/Reply.vue"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "login",
      component: Login
    },{
      path: "/chat/",
      name: "chat",
      component: Chat,
      beforeEnter: (to, from, next) => {
        if(from.name === "login" || from.name === "reply"){
          next()
        } else {
          next({ name:"login" })
        }
      },
    },
    {
      path: '/chat/reply/:chatId',
      name: 'reply',
      component: Reply,
      props: route => ({ chatId: route.params.chatId, message: route.params.message })
    }
  ],
})

export default router