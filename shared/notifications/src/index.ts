import log from "logger";
import { EmailNotificationService } from "./impl/email";
import { SMSNotificationService } from "./impl/sms";

const NotificationServices = {
  "email": EmailNotificationService,
  "sms": SMSNotificationService
} as const;


export abstract class NotificationService {
  constructor() { }
  abstract connect(): Promise<this>
  abstract sendNotification(notification: Omit<NotificationOptions, 'channel' | 'type'>): Promise<void>
}

export type NotificationOptions = {
  destination: "broadcast" | string;
  type: string
  message: string
  channel: NotificationType;
}
export type NotificationType = keyof typeof NotificationServices;
type NotificationServicesListType<Type> = { -readonly [Property in keyof Type]: Type[Property] }
type NotificationServicesListType1<Type> = { -readonly [Property in keyof Type]: NotificationService }

class Factory {
  data: NotificationServicesListType1<typeof NotificationServices>;

  constructor(values: NotificationServicesListType<typeof NotificationServices>) {
    this.data = {} as NotificationServicesListType1<typeof NotificationServices>
    for (let i of Object.keys(values)) {
      const idx = i as NotificationType;
      const Constructor = values[idx];
      this.data[idx] = new Constructor();
    }
  }

  getInstanceOfNotificationType = (type: NotificationType): NotificationService => {
    return this.data[type];
  }
}

export default (function() {
  log.info("this is entering")
  let instance: Factory;
  return (): Factory => {
    if (!instance) instance = new Factory(NotificationServices);
    return instance;
  }
})()

// const me = yo();
// const email = me.getInstanceOfNotificationType("email");

// email.sendNotification({
//   destination: "",
//   message: "hello"
// });
