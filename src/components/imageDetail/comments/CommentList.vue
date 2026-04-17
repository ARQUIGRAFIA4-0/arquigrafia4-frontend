<template>
  <div class="comment-list">
    <CommentItem v-for="comment in comments" :key="comment.id" :comment="comment" @delete="$emit('delete', $event)"
      @report="$emit('report', $event)" />
  </div>
</template>

<script setup>
import CommentItem from './CommentItem.vue'

defineProps({
  comments: {
    type: Array,
    required: true,
  },
})

defineEmits(['like', 'delete', 'report'])
</script>