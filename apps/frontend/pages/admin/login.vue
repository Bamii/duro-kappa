<template>
    <UContainer :ui="{ constrained: 'max-w-md' }">
        <UForm
            :schema="schema"
            :state="state"
            class="space-y-4"
            @submit="onSubmit"
        >
            <UFormGroup label="Email" name="email">
                <UInput v-model="state.email" />
            </UFormGroup>

            <UFormGroup label="Password" name="password">
                <UInput v-model="state.password" type="password" />
            </UFormGroup>

            <UButton type="submit"> Submit </UButton>
        </UForm>
    </UContainer>
</template>

<script setup lang="ts">
import { useMerchantAuthStore } from '../../stores/merchant-auth'
// import { useRouter } from 'vue-router'
import { object, string, type InferType } from 'yup'
import type { FormSubmitEvent } from '#ui/types'

const schema = object({
    email: string().email('Invalid email').required('Required'),
    password: string()
        .min(3, 'Must be at least 3 characters')
        .required('Required'),
})

type Schema = InferType<typeof schema>

const { login } = useMerchantAuthStore()
const router = useRouter();
const state = reactive({
    email: undefined,
    password: undefined,
})

const that = this
async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log(event)
  // event.preventDefault();
    // Do something with event.data
    console.log(event.data)
    const data = await login(event.data)
    console.log(data)
    // @ts-ignore
    // await navigateTo('/admin/dashboard')
}
</script>
