import { NotificationService, NotificationOptions } from "../"
import Mailjet from "node-mailjet";
import log from "logger"

export class SMSNotificationService implements NotificationService {
  client: Mailjet | null = null;

  async connect(): Promise<this> {
    const api_token = process.env.API_TOKEN ?? "";

    log.info(api_token)
    this.client = Mailjet.smsConnect(
      api_token,
      {
        config: {},
        options: {}
      }
    );

    return this;
  }

  async sendNotification(notification: NotificationOptions): Promise<void> {
    console.log(notification)
  }
}


