<template>
  <UModal v-model="isModalOpen" prevent-close @close-prevented="manualClose">
    <!-- <slot name="trigger"></slot> -->
    <slot></slot>
  </UModal>
</template>

<script setup>
const props = defineProps({
  modal_title: String
})
const store = useModalStore();
const isModalOpen = ref((store.name == props.modal_title))

const manualClose = function(e) {
  console.log(e)
  store.close()
  // isModalOpen.value = false;
}

watch(() => store.name, function (a, b) {
  console.log(a, b)
  console.log(props.modal_title)
  if(props.modal_title == a) {
    isModalOpen.value = true;
  } else {
    isModalOpen.value = false
  }
})

// defineShortcuts({
//   escape: {
//     usingInput: true,
//     whenever: [isOpen],
//     handler: () => { isOpen.value = false }
//   }
// })
</script>