import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./assets/index.css";        // Tailwind
import "@/leancloud";               // 初始化 LeanCloud（只需引入即可）

// 如果你有路由，取消下面两行注释：
import router from "./router";

const app = createApp(App);

// 只在开发环境开启 devtools，且用类型断言避免 TS 报错
if (import.meta.env.DEV) {
  (app.config as any).devtools = true;
}

app.use(createPinia());
app.use(router);

app.mount("#app");
