<template>
  <div>
    <a-config-provider :theme="{
      token: {
        colorPrimary: '#F4BB22'
      },
      components: {
        Button: {
          colorLink: '#E27244',
          colorLinkHover: '#E27244'
        }
      }
    }">
      <!-- 当未登录时显示登录页面 -->
      <Login v-if="!loggedIn" @login-success="handleLoginSuccess"/>
      <!-- 登录成功后显示主界面 -->
      <Main v-else @logout="handleLogout"/>
    </a-config-provider>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import Login from './components/Login.vue';
import Main from './components/Main.vue';

const loggedIn = ref(false);

function handleLoginSuccess() {
  loggedIn.value = true;
}

function handleLogout() {
  loggedIn.value = false;
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}
#app {
  height: 100%;
}
.action-icon {
  width: 15px;
  height: 15px;
}
.input-icon {
  width: 20px;
  height: 20px;
}
</style>
