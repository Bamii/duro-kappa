<template>
    <DCard>
        <a class='text-[#282828] flex flex-col lg:flex-row gap-y-12 md:gap-y-4 gap-[8px] justify-between lg:items-end w-full' :href="props.link">
          <div class="gap-6">
            <div class='text-[40px] tracking-[-2.8px] font-[700] leading-[1]'>{{props.name}}</div>
            <span class='mt-2 block text-sm'>{{props.description}}</span>
          </div>
          <span class="w-max flex">{{props.subtext}}</span>
        </a>
    </DCard>
</template>

<script setup>
const props = defineProps({
  subtext: String,
  description: String,
  name: String,
  link: String
})
</script>
