import pinia, { defineStore } from "pinia"

export const useModalStore = defineStore('modalStore', {
  state: () => ({
    name: "create-dialog",
    isOpen: false
  }),
  actions: {
    open(title: string) {
      // @ts-ignore
      this.name = title;
      // @ts-ignore
      this.isOpen = true;
    },
    close() {
      // @ts-ignore
      this.name = null;
      // @ts-ignore
      this.isOpen = false;
    }
  }
})