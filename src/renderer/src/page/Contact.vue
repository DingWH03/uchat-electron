<template>
  <div class="contact-layout">
    <div class="contact-list-panel">
      <div class="contacts-section">
        <h2>好友</h2>
        <div v-if="friendList.length === 0" class="empty">暂无好友</div>
        <ul>
          <li v-for="friend in friendList" :key="friend.base.user_id" class="contact-item" :class="{selected: selectedType==='friend' && selectedId===friend.base.user_id}" @click="selectFriend(friend)">
            <span class="icon">👤</span>
            <span class="name">{{ friend.base.username }}</span>
            <span class="status" :class="friend.online ? 'online' : 'offline'">
              {{ friend.online ? '在线' : '离线' }}
            </span>
          </li>
        </ul>
      </div>
      <div class="contacts-section">
        <h2>群聊</h2>
        <div v-if="groupList.length === 0" class="empty">暂无群聊</div>
        <ul>
          <li v-for="group in groupList" :key="group.group_id" class="contact-item" :class="{selected: selectedType==='group' && selectedId===group.group_id}" @click="selectGroup(group)">
            <span class="icon">👥</span>
            <span class="name">{{ group.title }}</span>
          </li>
        </ul>
      </div>
    </div>
    <div class="contact-detail-panel">
      <div v-if="selectedType==='friend' && selectedFriend">
        <h2>好友信息</h2>
        <div class="detail-row"><b>用户名：</b>{{ selectedFriend.base.username }}</div>
        <div class="detail-row"><b>用户ID：</b>{{ selectedFriend.base.user_id }}</div>
        <div class="detail-row"><b>状态：</b><span :class="selectedFriend.online ? 'online' : 'offline'">{{ selectedFriend.online ? '在线' : '离线' }}</span></div>
        <button class="open-chat-btn" @click="openChat">打开会话</button>
      </div>
      <div v-else-if="selectedType==='group' && selectedGroup">
        <h2>群聊信息</h2>
        <div class="detail-row"><b>群名：</b>{{ selectedGroup.title }}</div>
        <div class="detail-row"><b>群ID：</b>{{ selectedGroup.group_id }}</div>
        <button class="open-chat-btn" @click="openChat">打开会话</button>
      </div>
      <div v-else class="empty-detail">请选择左侧联系人或群聊</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { friend_list_v2, group_list } from '../ipcApi'
import { UserSimpleInfoWithStatus, GroupSimpleInfo, RequestResponse } from '@apiType/HttpRespond'
import { useRouter } from 'vue-router'

const friendList = ref<UserSimpleInfoWithStatus[]>([])
const groupList = ref<GroupSimpleInfo[]>([])

const selectedType = ref<'friend'|'group'|''>('')
const selectedId = ref<number|null>(null)
const selectedFriend = ref<UserSimpleInfoWithStatus|null>(null)
const selectedGroup = ref<GroupSimpleInfo|null>(null)

const router = useRouter()

function selectFriend(friend: UserSimpleInfoWithStatus): void {
  selectedType.value = 'friend'
  selectedId.value = friend.base.user_id
  selectedFriend.value = friend
  selectedGroup.value = null
}
function selectGroup(group: GroupSimpleInfo): void {
  selectedType.value = 'group'
  selectedId.value = group.group_id
  selectedGroup.value = group
  selectedFriend.value = null
}
function openChat(): void {
  if (selectedType.value === 'friend' && selectedFriend.value) {
    router.push(`/chat/friend/${selectedFriend.value.base.user_id}`)
  } else if (selectedType.value === 'group' && selectedGroup.value) {
    router.push(`/chat/group/${selectedGroup.value.group_id}`)
  }
}

onMounted(async () => {
  const flist: RequestResponse<UserSimpleInfoWithStatus[]> = await friend_list_v2()
  if (flist.status === true) {
    friendList.value = flist.data ?? []
  }
  const glist: RequestResponse<GroupSimpleInfo[]> = await group_list()
  if (glist.status === true) {
    groupList.value = glist.data ?? []
  }
})
</script>

<style scoped>
.contact-layout {
  display: flex;
  height: 100%;
  background: #f7faff;
}
.contact-list-panel {
  width: 300px;
  min-width: 220px;
  background: #fff;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px 0 24px 0;
  box-sizing: border-box;
}
.contacts-section {
  padding: 0 18px;
}
.contacts-section h2 {
  font-size: 18px;
  margin-bottom: 12px;
  color: #409eff;
  font-weight: bold;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}
.contact-item:last-child {
  border-bottom: none;
}
.contact-item.selected {
  background: #e6f7ff;
  color: #409eff;
  font-weight: bold;
}
.icon {
  font-size: 18px;
}
.name {
  flex: 1;
}
.status {
  font-size: 13px;
  margin-left: 6px;
}
.online {
  color: #52c41a;
}
.offline {
  color: #bfbfbf;
}
.empty {
  color: #bfbfbf;
  text-align: center;
  padding: 12px 0;
}
.contact-detail-panel {
  flex: 1;
  background: #f7faff;
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
}
.detail-row {
  margin-bottom: 18px;
  font-size: 16px;
}
.empty-detail {
  color: #bfbfbf;
  font-size: 18px;
  margin-top: 60px;
}
.open-chat-btn {
  margin-top: 18px;
  padding: 8px 28px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}
.open-chat-btn:hover {
  background: #307fd6;
}
</style> 