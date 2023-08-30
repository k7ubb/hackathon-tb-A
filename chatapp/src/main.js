import { createApp } from "vue"
import "./styles/common.css"
import App from "./App.vue"
import router from "./router"
import vuetify from "./plugins/vuetify"
import store from './store/store';  // <-- ここでインポート

createApp(App).use(vuetify).use(router).use(store).mount("#app")
