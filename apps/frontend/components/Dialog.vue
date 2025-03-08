<template>
    <Modal :modal_title="title">
        <slot name="header">
            <div class="w-[20rem] p-5">
                <div class="text-2xl pb-5">create a new branch</div>
                <div>creterd</div>
            </div>
        </slot>

        <slot name="body"></slot>

        <slot name="controls">
            <div class="w-full grid grid-cols-2 p-2 gap-2">
              <UButton block>
                Close
              </UButton>
              <UButton block>
                Confirm
              </UButton>
            </div>
        </slot>
    </Modal>
</template>

<script setup>
defineProps({
    title: String,
})
</script>
