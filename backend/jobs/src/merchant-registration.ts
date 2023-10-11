import QueueInstance, { MERCHANT_REGISTRATION_QUEUE, NOTIFICATION_QUEUE } from "queue"
import StorageInstance from "storage";
import PubSubService from "pub-sub";
import DatabaseInstance from 'database';
import NotificationService, { MERCHANT_REGISTRATION_NOTIFICATION } from "notifications";
import { Queue } from "database/src/models";
import qrcode = require("qrcode");
import { readFileSync, rmSync } from "node:fs";
import { Container } from "typedi";
import log from "logger";
import _config from "config";
const MERCHANT_QR_URL_BASE = _config.app_url;

const database = Container.get(DatabaseInstance);
const queue = Container.get(QueueInstance);
const storage = Container.get(StorageInstance);
const pubsub = Container.get(PubSubService);
const notifications = NotificationService();
const email_notification = notifications.getInstanceOfNotificationType("email")

async function run() {
  try {
    await pubsub.consume(MERCHANT_REGISTRATION_QUEUE, async (value: string) => {
      try {
        const id = value;
        if (!id)
          throw new Error("invalid id");

        let { branch, users, ...new_queue }: Queue = await database.getQueueById(Number.parseInt(id))
        const merchant_url: string = `${MERCHANT_QR_URL_BASE}/${new_queue.id}`;
        const filename = `${branch.id}__${new_queue.id}`;

        // generate qr.
        await qrcode.toFile(filename, merchant_url);
        const url: string = await storage.upload(filename, readFileSync(filename))
        console.log("uploaded file")
        log.info(`uploaded file ${url}.`)
        rmSync(filename);

        // update the merchant's qr_code url.
        await database.updateQueueById(Number.parseInt(id), { ...new_queue, qr_code: url });
        const business = await database.getBusinessBranchById(`${new_queue.branchId}`);
        log.info(`Successfully updated queue with id:${id}'s qr_code: ${url}`)

        // create notification user
        await email_notification.registerUser(id, `${business.admin?.email}`)

        // enqueue notification.
        await queue.enqueue(
          NOTIFICATION_QUEUE,
          {
            topic: "",
            value: JSON.stringify({
              channel: "email",
              destination: business.admin?.email,
              type: MERCHANT_REGISTRATION_NOTIFICATION,
              data: { userid: id }
            })
          }
        )
      } catch (error: any) {
        console.log(error);
        log.error(error.message);
      }
    })
  } catch (e: any) {
    log.error("ERROR", e.message)
  }
}

// run()
export default run;

