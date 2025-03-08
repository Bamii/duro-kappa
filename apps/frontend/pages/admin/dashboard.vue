<template>
    <Jumbotron />

    <div class="grid grid-cols-2 mt-[2rem]">
        <div
            class="rounded-t-[24px] shadow-[8px_8px_#282828] bg-[#A4D4DF] col-span-2 md:col-span-1 flex items-end justify-end px-[18px] py-[12px] h-[86px] text-[24px] tracking-[-1.2px] font-[700] border-black border-x-2 border-t-2"
        >
            <Link href="/admin/dashboard/queue/create"> create new queue </Link>
        </div>

        <div
            class="col-span-2 shadow-[8px_8px_#282828] lg:rounded-r-[24px] rounded-b-[24px]"
        >
            <div class="">
                <div
                    class="p-6 gap-x-8 gap-y-8 border-2 bg-white md:rounded-b-[24px] md:rounded-r-[24px] grid md:grid-cols-2 border-black"
                >
                    <QueueCard
                        name="create queue"
                        description=""
                        link="/admin/dashboard/queue/create"
                    />

                    <div v-for="queue in meta.concat(meta.concat(meta))">
                        <QueueCard
                            :key="queue.id"
                            :name="queue.name"
                            :description="queue.description"
                            :subtext="`${queue.users.length} occupants`"
                            :link="`/admin/queue/${queue.id}`"
                        />
                    </div>

                    <div
                        v-if="meta.length == 0"
                        class="w-full text-center py-5 px-2"
                    >
                        no current queues on list.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { apis } from '~/api'

const data = await useAsyncData('queues', () => apis.list_admin_queues())
// console.log(data)
const meta = data.data.value
</script>
