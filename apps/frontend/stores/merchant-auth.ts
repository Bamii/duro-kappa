import pinia, { defineStore } from "pinia"
import { apis } from "~/api"
import { useStorage } from "@vueuse/core"

type Merchant = {}

export const useMerchantAuthStore = defineStore('merchantAuth', {
  state: () => ({
    user: useCookie('user'),
    admin: useCookie('admin')
    // token: useCookie('token')
  }),
  hydrate(state, initialState) {
  //   // in this case we can completely ignore the initial state since we
  //   // want to read the value from the browser
    // @ts-ignore
    state.user = useCookie("user")
    // @ts-ignore
    state.admin = useCookie("admin")

  //   // @ts-ignore
  //   // state.token = useCookie("token")
  },
  actions: {
    async login(data: { email: string, password: string }) {
      try {
        const result = await apis.login_merchant({ body: data })
        console.log(result)
  
        // window.localStorage.se.valuetItem("duro-key", JSON.stringify(result.data))
        // const user = 
        if(result) {
          // @ts-ignore
          // const m = useCookie('user', result.user)
          // m.value = result.user;
          // @ts-ignore
          this.user = result.user;
          // @ts-ignore
          // const y = useCookie('token', result.token)
          // y.value = result.token;
          // @ts-ignore
          // this.token = result.token
          return result;
        } else { throw new Error() }
      } catch (error) {
        console.log(error)  
      }
    }    
  }
})



