import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './stores/pinia'
import '@haodacai/ui/tokens.css'
import './styles/global.scss'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
