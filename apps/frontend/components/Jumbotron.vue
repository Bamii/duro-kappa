<script setup>
import { useMerchantAuthStore } from '~/stores/merchant-auth'
const store = useMerchantAuthStore()
const user = store.user;
</script>

<template>
      <div class="rounded-[24px] shadow-[8px_8px_#282852] bg-transparent border-2 border-[#2B2212] flex flex-col justify-between">
        <div class="text-lg h-[150px] flex p-5 tracking-[-1.2px] items-end"> 
          <div class="text-[32px]"> hello, <span class='ml-1 font-[700] text-[48px]'>{{user.name ?? user.email}}</span>  </div>
        </div>
        <div class='rounded-b-[24px] lg:h-[130px] bg-[#E1D2B7] grid md:grid-cols-2 w-full border-[#2B2212]'>
          <div class='p-4 border-t-2 border-[#2B2212] flex flex-col items-end'>
            <div class="font-[700] tracking-[-1.2px] text-[32px] mt-auto">{{user.merchant.company_name}}</div>
            <div class="text-[14px] font-[500] italic">organisation name</div>
          </div>
          <div class='p-4 border-t-2 md:border-l-2 border-[#2B2212] flex flex-col items-end'>
            <div class="font-[700] tracking-[-1.2px] text-[32px] mt-auto">{{user.branch.location}}</div>
            <div class="text-[14px] font-[500] italic">branch</div>
          </div>
        </div>
      </div>
</template>