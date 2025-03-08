<template>
    <div v-if="queue_data" class="mx-auto">
        <UContainer :ui="{ constrained: 'max-w-md' }">
            <div class="text-center mt-4 mb-6">
                you are about to join: {{ queue_data.branch.merchant.company_name }}'s
                <h2 class="text-4xl">
                    {{ queue_data.name }}
                </h2>
                <h3 class="text-gray-400">
                    {{ queue_data.description }}
                </h3>
            </div>

            <div v-if="true">
                <div class="w-full flex mb-5">
                    <div
                        class="bg-gray-600 rounded-full mx-auto flex gap-2 px-2 py-1 text-[13px]"
                    >
                        <label
                            for="login"
                            :class="`${type == 'login' ? 'bg-gray-900' : ''} px-3 py-1 rounded-full has-[:checked]:bg-gray-900`"
                        >
                            <div>login</div>
                            <input
                                class="hidden"
                                v-model="type"
                                type="radio"
                                name="type"
                                value="login"
                                id="login"
                            />
                        </label>
    
                        <label
                            for="register"
                            :class="`${type == 'register' ? 'bg-gray-900' : ''} px-3 py-1 rounded-full has-[:checked]:bg-gray-900`"
                        >
                            <div>register</div>
                            <input
                                class="hidden"
                                v-model="type"
                                type="radio"
                                name="type"
                                value="register"
                                id="register"
                            />
                        </label>
                    </div>
                </div>
    
                <UForm
                    :schema="type == 'login' ? login_schema : register_schema"
                    :state="state"
                    class="space-y-4"
                    @submit="onSubmit"
                >
                    <UFormGroup label="Email" name="email">
                        <UInput v-model="state.email" />
                    </UFormGroup>

                     <UFormGroup
                        v-if="type == 'register'"
                        label="Name"
                        name="name"
                    >
                        <UInput v-model="state.name" />
                    </UFormGroup>   

                    <UFormGroup
                        v-if="type == 'register'"
                        label="Username"
                        name="username"
                    >
                        <UInput v-model="state.username" />
                    </UFormGroup>
    
                    <UFormGroup label="Password" name="password">
                        <UInput v-model="state.password" type="password" />
                    </UFormGroup>
    
                    <UButton class="mx-auto" type="submit"> Submit </UButton>
                </UForm>
            </div>

            <div v-else @click="onSubmit">join queue</div>
        </UContainer>
    </div>

    <div v-else>hmmmm...</div>
</template>

<script setup lang="ts">
import { apis } from '~/api'
import { object, string, type InferType } from 'yup'
import type { FormSubmitEvent } from '#ui/types'

const router = useRouter()
const type = ref<"login" | "register">('login')
const login_schema = object({
    email: string().email('Invalid email').required('Required'),
    password: string()
        .min(3, 'Must be at least 3 characters')
        .required('Required'),
})
const register_schema = object({
    email: string().email('Invalid email').required('Required'),
    username: string().min(3, 'Invalid username').required('Required'),
    name: string().min(3, 'Invalid username').required('Required'),
    password: string()
        .min(3, 'Must be at least 3 characters')
        .required('Required'),
})

try {
    await useAsyncData('user_queue', () => apis.get_queue_details())
    router.push({ path: "/queue/details" })
} catch (error) {}

type Schema = InferType<typeof login_schema | typeof register_schema>

const state = reactive({
    email: undefined,
    username: undefined,
    name: undefined,
    password: undefined,
})

const route = useRoute()
const id: string = route.params.id as string
const queue_data = await apis.preview_queue(id)

async function onSubmit(event: FormSubmitEvent<Schema>) {
    try {
        const result = await apis.join_queue(id, { ...event.data, type: type.value })
        router.push({ path: "/queue/details/" })
    } catch (error) {}
}
</script>
