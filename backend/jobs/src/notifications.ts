import log from "logger";
import notificationService, { NotificationOptions, NotificationService } from "notifications";
import { NOTIFICATION_QUEUE } from "queue";
import Container from "typedi";
import PubSubService from "pub-sub";

const message = (type: string) => {
  switch (type) {
    case "MERCHANT_REGISTRATION":
      return `congratulations, you have registered your business. you can add more branches on your dashboard.`
    default:
      return ``;
  }
};

const pubsub = Container.get(PubSubService);
async function run() {
  try {
    const notifications = notificationService();

    const channels = {
      email: notifications.getInstanceOfNotificationType("email").connect(),
      sms: notifications.getInstanceOfNotificationType("sms").connect()
    }

    await pubsub.consume(NOTIFICATION_QUEUE, async (value: string) => {
      const { destination, channel, type } = JSON.parse(value) as NotificationOptions;
      log.info(value);
      log.info(`${type}, ${destination}`)
      try {
        const transporter: NotificationService = channels[channel];
        await transporter.sendNotification({ message: message(type), destination })
      } catch (error: any) {
        log.error(error.message);
      }
    })
  } catch (e: any) {
    log.error("ERROR", e.message)
  }
}

export default run;

