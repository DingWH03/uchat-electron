<script setup lang="ts">
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import MainContent from './components/MainContent.vue'

const route = useRoute()
</script>

<template>
  <div v-if="route.meta.layout === 'full'">
    <router-view />
  </div>
  <div v-else class="app-layout">
    <Sidebar />
    <MainContent />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}
</style>
