<template>
    <div class="w-screen flex flex-col mt-[5rem]">
          <div v-if="meta && !user?.attending_to" class="_mx-auto">
            <!-- <Jumbotron
              :user="store.user"
            /> -->
            <div class="mt-6">
              you are number {{meta.position}} on the list!
            </div>
            <div class="mt-8 underline"> here's the queue list </div>
              <div v-for="user in meta.queue.users" class="my-1 hover:border-r " :key=user.id> - {{user.name ?? user.email}}</div>
          </div>
          <div v-else-if="user?.attending_to"> 
            you are currently being attended to :).
          </div>
    </div>
</template>

<script setup>
import { apis } from '~/api'
import { BASE_URL } from '~/api/req'

const router = useRouter()
const data = await useAsyncData('user_queue', () => apis.get_queue_details())
const meta = data.data.value

if(!data?.data?.value) {
  router.push('/login')
}

const eventSource = new EventSource(BASE_URL + '/api/v1/queue/events/'+meta.queue.id);

eventSource.onmessage = function(event) {
  const newData = JSON.parse(event.data);
  // Update your meta data or handle the new data as needed
  meta.queue.users = newData.queue.users;
};

eventSource.onerror = function(error) {
  console.error('EventSource failed:', error);
};
</script>