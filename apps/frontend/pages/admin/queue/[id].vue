<template>
    <div class="">
        <div
            class="rounded-[24px] border-2 border-black shadow-[8px_8px_#282828] flex flex-col lg:flex-row _bg-[#D1EAF0] justify-between font-[700] _h-[100px]"
        >
            <div class="flex flex-col w-full">
                <div class="p-[12px] tracking-[-1.8px] text-[36px]">
                    {{ queue?.name }}
                    <div class="text-[16px] tracking-[-0.8px] font-[600]">
                        opens 8am; closes 5pm
                    </div>
                </div>

                <div
                    class="mt-auto h-[27px] text-[16px] px-2 border-t border-black text-right w-full"
                >
                    download qr code
                </div>
                <div
                    class="h-[27px] text-[16px] px-2 border-t border-black text-right w-full"
                >
                    copy queue link
                </div>
                <div
                    class="h-[27px] text-[16px] px-2 border-t border-black text-right w-full"
                >
                    extend today's time
                </div>
                <div
                    class="h-[27px] text-[16px] px-2 border-t border-black text-right w-full"
                >
                    edit queue
                </div>
                <div
                    class="h-[27px] text-[16px] px-2 border-t border-black text-right w-full"
                >
                    delete queue
                </div>
            </div>
            <div class="">
                <div
                    class="h-[220px] w-[220px] border-l border-black hidden lg:block"
                ></div>
                <div
                    class="h-[27px] text-[16px] px-2 lg:border-l lg:border-t border-black text-right w-full"
                >
                    enlarge qr code
                </div>
            </div>
        </div>

        <div class="w-full flex mt-10">
            <div
                @click="advance_queue"
                class="cursor-pointer mx-auto rounded-full bg-gray-500 px-4 py-1.5"
            >
                <div class="text-[14px]">Advance Queue</div>
            </div>
        </div>

        <Dialog title="create-dialog"></Dialog>

        <div class="mt-[1rem] grid md:grid-cols-2">
            <div
                class="border-b mb-[16px] shadow-[8px_8px_#282828] md:md-none md:border-r border-x-2 border-black col-span-2 md:col-span-1"
            >
                <div
                    class="rounded-t-[24px] md:rounded-r-none bg-[#A4D4DF] flex items-end justify-end px-[18px] py-[12px] h-[86px] text-[24px] tracking-[-1.2px] font-[700] border-black border-y col-span-1"
                >
                    current queue occupants
                </div>
                <!-- <div class="bg-[#D1EAF0] font-[700] flex flex-col border-b border-black">
                    <div class="h-[27px] text-[16px] px-2 border-black text-right w-full">
                        call in next user.
                    </div>
                </div> -->

                <div
                    class="lg:space-y-[10px] p-3 grid gap-x-8 gap-y-8 _border-2"
                >
                    <!-- <div
                        v-for="user in remainder_on_queue"
                        :key="user.id"
                        class="shadow-[6px_6px_#D1EAF0,_8px_8px_#282828] rounded-t-[24px] rounded-b-[24px] 
                        bg-white lg:h-[160px] flex p-5 border-2 border-black shadow-outset"
                    >
                        <div class="mt-auto w-full">
                            <div
                                class="flex flex-col lg:flex-row gap-y-12 md:gap-y-4 gap-[8px] justify-between lg:items-end w-full"
                            >
                                <div class="gap-6">
                                    <div
                                        class="text-[40px] tracking-[-2.8px] font-[700] leading-[1]"
                                    >
                                        {{user.name ?? user.email}}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> -->

                    <div
                        v-if="remainder_on_queue.length == 0"
                        class="font-[600] py-5 text-[24px] w-full text-center px-[7px]"
                    >
                        there's currently nobody on the queue
                    </div>
                    <UTable
                        v-else
                        v-model="selected_on_queue"
                        :rows="
                            remainder_on_queue
                        "
                    />
                </div>
            </div>

            <div
                class="border-x-2 mb-[16px] _bg-[#F3EAE2] md:md-none rounded-t-[24px] md:rounded-r-[24px] md:rounded-l-none rounded-b-none shadow-[8px_8px_#282828] border-black lg:border-r border-b col-span-2 md:col-span-1"
            >
                <div
                    class="rounded-t-[24px] md:rounded-l-none rounded-b-none bg-[#A4D4DF] col-span-2 md:col-span-1 flex items-end justify-end px-[18px] py-[12px] h-[86px] text-[24px] tracking-[-1.2px] font-[700] border-black border-r border-t-2"
                >
                    you are currently attending to:
                </div>
                <!-- <div
                    class="bg-[#D1EAF0] font-[700] flex flex-col border-b border-black"
                >
                    <div
                        class="h-[27px] text-[16px] px-2 border-t border-black text-right w-full"
                    >
                        advance queue
                    </div>
                    <div
                        class="h-[27px] text-[16px] px-2 border-t border-black text-right w-full"
                    >
                        dismiss selected user(s)
                    </div>
                    <div
                        class="h-[27px] text-[16px] px-2 border-t border-black text-right w-full"
                    >
                        dismiss selected user(s) & advance queue
                    </div>
                    <div
                        class="h-[27px] text-[16px] px-2 border-t border-black text-right w-full"
                    >
                        select all
                    </div>
                </div> -->

                <div class="flex flex-col lg:gap-[14px] mt-[14px]">
                    <!-- <div
                        v-for="(queue, index) in currently_attending"
                        :key="queue.id"
                        class="bg-[#D1EAF0] lg:translate-x-[-14px] lg:translate-y-[14px] 
                        flex border-b lg:border-x lg:border-t border-black shadow-outset "
                    >
                        <div class="mt-auto w-full">
                            <div
                                class="flex flex-col justify-between items-start block w-full"
                                :key="index"
                            >
                                <div
                                    class="p-5 text-[40px] tracking-[-2.8px] font-[700]"
                                >
                                    username
                                </div>
                                <div
                                    class="h-[27px] font-[700] text-[16px] px-2 border-t border-black text-right w-full"
                                >
                                    dismiss user
                                </div>
                                <div
                                    class="h-[27px] font-[600] text-[16px] px-2 border-t border-black text-right w-full"
                                >
                                    dismiss user & advance queue
                                </div>
                            </div>
                        </div>
                    </div> -->

                    <div
                        v-if="currently_attending == 0"
                        class="font-[600] py-5 text-[24px] w-full text-center px-[7px]"
                    >
                        you're currently not attending to anybody
                    </div>
                    <UTable
                        v-model="selected_attending_to"
                        v-else
                        :rows="currently_attending"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { apis } from '~/api'
const route = useRoute()
const data = await useAsyncData('queues', () => apis.list_admin_queues())
const meta = data.data.value
const queue = meta?.find((e) => e.id == route.params.id)
console.log(route.params)
console.log(meta, data)

const selected_on_queue = ref([])
const selected_attending_to = ref([])
// const { queue } = defineProps({
//   queue: { users: any },
// })

async function advance_queue() {
    try {
    const requests = []
    let prev;
        if (selected_on_queue.value.length > 0) {
            requests.push(
                apis.advance_queue({ queueId: parseInt(route.params.id) })
            )
            const [_prev, ...remainder] = remainder_on_queue.value;
            prev = _prev
            remainder_on_queue.value = remainder
            selected_on_queue.value = [];
            // prev = remainder_on_queue.value.unshift()
        }

        if (selected_attending_to.value.length > 0) {
            requests.push(apis.dismiss_user(selected_attending_to.value[0].id))
            currently_attending.value = currently_attending.value.filter(e => e.id != selected_attending_to.value[0].id)
            selected_attending_to.value = [];
        }
        if (prev) currently_attending.value.push(prev);

        const results = await Promise.allSettled(requests);
        console.log(results)
    } catch (error) {
        console.log(error)
    }
}

const currently_attending =ref( queue?.users?.filter((e) => e.attending_to) ?? [])
const remainder_on_queue = ref(queue?.users?.filter((e) => !e.attending_to) ?? [])
</script>
