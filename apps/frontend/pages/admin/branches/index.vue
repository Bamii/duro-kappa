<template>
    <Jumbotron />

    <div class="w-[10rem] h-max mx-auto mt-[2rem] w-full">
        <div class="grid grid-cols-2">
            <div
                class="flex items-end justify-end px-[18px] py-[12px] h-[86px] text-[24px] tracking-[-1.2px] font-[700] border-black border-y-2 border-r-2 lg:border-x-2 col-span-1"
            >
                branches
            </div>
            <div
                class="flex items-end justify-end px-[18px] py-[12px] h-[86px] text-[24px] tracking-[-1.2px] font-[700] border-black border-y-2 lg:border-r-2 col-span-1"
            >
                <div @click="open('create-queue')" class="">
                    create new branch
                </div>
            </div>

            <Modal modal_title="create-queue">
                <div class="w-[20rem] p-5">
                    <div class="text-2xl pb-5">create a new branch</div>
                    <div>creterd</div>
                </div>
            </Modal>

            <Modal modal_title="delete-queue">
                <div class="w-[20rem] p-5">
                    <div class="text-2xl pb-5">delete branch</div>
                    <div>creterd</div>
                </div>
            </Modal>
            <div class="col-span-2">
                <div
                    class="lg:border-x-2 lg:border-b-2 lg:gap-y-[10px] grid md:grid-cols-2 border-black"
                >
                    <div
                        v-for="(branch, index) in branches"
                        :key="index"
                        class="h-[160px] bg-transparent text-white lg:translate-x-[-10px] lg:translate-y-[10px] flex p-4 border-b-2 md:odd:border-x-2 md:even:border-r-2 lg:border-t-2 border-black shadow-outset"
                    >
                        <div class="mt-auto w-full">
                            <a
                                class="flex gap-[8px] justify-between items-end block w-full"
                                :key="index"
                                href="/admin/dashboard/queue/"
                            >
                                <div>
                                    <div class="text-xl">
                                        branch location: {{ branch.location }}
                                    </div>
                                    <span class="text-sm text-gray-400"
                                        >branch coordinates:
                                        {{ branch.coordinates }}</span
                                    >
                                    <div class="mt-5 text-bold">admin:</div>
                                    <div>
                                        {{
                                            branch?.admin?.username
                                                ? `${branch.admin.username}  -  `
                                                : ''
                                        }}
                                        {{ branch?.admin?.email }}
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>

                    <div
                        v-if="branches?.length == 0"
                        class="w-full text-center py-5 px-2"
                    >
                        oh no! you have no branches!.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { apis } from '~/api'
const { open } = useModalStore()

const data = await useAsyncData('branches', () => apis.get_branches())
const branches = data.data.value.map((e) => ({ ...e }))

console.log(data.data.value)
console.log(branches)

</script>
