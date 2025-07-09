<template>
  <div class="contact-layout">
    <ContactListPanel
      :friend-list="friendList"
      :group-list="groupList"
      :selected-type="selectedType"
      :selected-id="selectedId"
      @select-friend="selectFriend"
      @select-group="selectGroup"
      @show-add-friend="handleShowAddFriend"
      @show-create-group="handleShowCreateGroup"
    />
    <ContactDetailPanel
      :selected-type="selectedType"
      :selected-friend="selectedFriend"
      :selected-group="selectedGroup"
      :friend-list="friendList"
      :show-add-friend-form="showAddFriendForm"
      :show-create-group-form="showCreateGroupForm"
      @hide-add-friend-form="hideAddFriendForm"
      @hide-create-group-form="hideCreateGroupForm"
      @refresh-lists="refreshLists"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { UserSimpleInfoWithStatus, GroupSimpleInfo } from '@apiType/HttpRespond'
import ContactListPanel from '../components/ContactListPanel.vue'
import ContactDetailPanel from '../components/ContactDetailPanel.vue'
import { ApiResponse } from '@apiType/Model'
import { friend_list, group_list } from '@renderer/ipcApi'
import { getSecureFriendAvatarUrls, getSecureGroupAvatarUrls } from '../utils/fileUtils'

const friendList = ref<UserSimpleInfoWithStatus[]>([])
const groupList = ref<GroupSimpleInfo[]>([])

const selectedType = ref<'friend' | 'group' | ''>('')
const selectedId = ref<number | null>(null)
const selectedFriend = ref<UserSimpleInfoWithStatus | null>(null)
const selectedGroup = ref<GroupSimpleInfo | null>(null)

// 表单显示状态
const showAddFriendForm = ref(false)
const showCreateGroupForm = ref(false)

function selectFriend(friend: UserSimpleInfoWithStatus): void {
  selectedType.value = 'friend'
  selectedId.value = friend.base.user_id
  selectedFriend.value = friend
  selectedGroup.value = null
  // 隐藏表单
  showAddFriendForm.value = false
  showCreateGroupForm.value = false
}

function selectGroup(group: GroupSimpleInfo): void {
  selectedType.value = 'group'
  selectedId.value = group.group_id
  selectedGroup.value = group
  selectedFriend.value = null
  // 隐藏表单
  showAddFriendForm.value = false
  showCreateGroupForm.value = false
}

function handleShowAddFriend(): void {
  showAddFriendForm.value = true
  showCreateGroupForm.value = false
  // 清除选择
  selectedType.value = ''
  selectedId.value = null
  selectedFriend.value = null
  selectedGroup.value = null
}

function handleShowCreateGroup(): void {
  showCreateGroupForm.value = true
  showAddFriendForm.value = false
  // 清除选择
  selectedType.value = ''
  selectedId.value = null
  selectedFriend.value = null
  selectedGroup.value = null
}

function hideAddFriendForm(): void {
  showAddFriendForm.value = false
}

function hideCreateGroupForm(): void {
  showCreateGroupForm.value = false
}

async function refreshLists(): Promise<void> {
  await loadData()
}

async function loadData(): Promise<void> {
  const flist: ApiResponse<UserSimpleInfoWithStatus[]> = await friend_list()
  // console.log('Friend list loaded:', flist)
  if (flist.success === true) {
    const friends = flist.data ?? []
    // 处理好友头像
    friendList.value = await getSecureFriendAvatarUrls(friends)
  }
  const glist: ApiResponse<GroupSimpleInfo[]> = await group_list()
  if (glist.success === true) {
    const groups = glist.data ?? []
    // 处理群组头像
    groupList.value = await getSecureGroupAvatarUrls(groups)
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.contact-layout {
  display: flex;
  height: 100%;
  background: #f7faff;
}
</style>
