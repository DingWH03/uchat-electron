<template>
  <div class="contact-list-panel">
    <ContactSection 
      title="好友" 
      :items="friendList" 
      type="friend"
      :selected-type="selectedType"
      :selected-id="selectedId"
      @select-item="handleSelectFriend"
      @add-item="showAddFriend"
    />
    <ContactSection 
      title="群聊" 
      :items="groupList" 
      type="group"
      :selected-type="selectedType"
      :selected-id="selectedId"
      @select-item="handleSelectGroup"
      @add-item="showCreateGroup"
    />
  </div>
</template>

<script setup lang="ts">
import { UserSimpleInfoWithStatus, GroupSimpleInfo } from '@apiType/HttpRespond'
import ContactSection from './ContactSection.vue'

interface Props {
  friendList: UserSimpleInfoWithStatus[]
  groupList: GroupSimpleInfo[]
  selectedType: 'friend' | 'group' | ''
  selectedId: number | null
}

interface Emits {
  (e: 'select-friend', friend: UserSimpleInfoWithStatus): void
  (e: 'select-group', group: GroupSimpleInfo): void
  (e: 'show-add-friend'): void
  (e: 'show-create-group'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleSelectFriend = (item: UserSimpleInfoWithStatus | GroupSimpleInfo): void => {
  if ('base' in item) {
    emit('select-friend', item as UserSimpleInfoWithStatus)
  }
}

const handleSelectGroup = (item: UserSimpleInfoWithStatus | GroupSimpleInfo): void => {
  if ('group_id' in item) {
    emit('select-group', item as GroupSimpleInfo)
  }
}

const showAddFriend = (): void => {
  emit('show-add-friend')
}

const showCreateGroup = (): void => {
  emit('show-create-group')
}
</script>

<style scoped>
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
</style> 