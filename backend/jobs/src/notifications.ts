import log from "logger";
import notificationService, { NotificationOptions, NotificationService } from "notifications";
import { NOTIFICATION_QUEUE } from "queue";
import Container from "typedi";
import PubSubService from "pub-sub";

const pubsub = Container.get(PubSubService);
const notifications = notificationService();

async function run() {
  try {
    const channels = {
      email: await notifications.getInstanceOfNotificationType("email").connect(),
      sms: await notifications.getInstanceOfNotificationType("sms").connect()
    }

    await pubsub.consume(NOTIFICATION_QUEUE, async (value: string) => {
      const { destination, channel, type, data, message } = JSON.parse(value) as NotificationOptions;
      log.info(value);
      log.info(`${type}, ${destination}`);

      try {
        const transporter: NotificationService = channels[channel];
        await transporter.sendNotification({
          message,
          type, data,
          destination
        });
      } catch (error: any) {
        log.error(error.message);
      }
    })
  } catch (e: any) {
    log.error("ERROR", e.message)
  }
}

export default run;

