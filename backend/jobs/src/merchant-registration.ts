import queueClient, { MERCHANT_REGISTRATION_QUEUE, NOTIFICATION_QUEUE } from "queue"
import log from "logger";
import storageClient from "storage";
import databaseClient from 'database';
import { Queue } from "database/src/models";
import qrcode = require("qrcode");
import { readFileSync, rmSync } from "node:fs";
import _config from "config";
const MERCHANT_QR_URL_BASE = _config.app_url;

async function run() {
  const queue = await queueClient().connect();
  const database = databaseClient().connect();
  const storage = storageClient().connect();

  try {
    await queue.consume(MERCHANT_REGISTRATION_QUEUE, {}, async (value: string) => {
      try {
        const id = value;
        if (!id)
          throw new Error("invalid id");

        let { branch, users, ...new_queue }: Queue = await database.getQueueById(Number.parseInt(id))
        const merchant_url: string = `${MERCHANT_QR_URL_BASE}/${new_queue.id}`;
        console.log('sd', new_queue)
        const filename = `${branch.id}__${new_queue.id}`;

        // generate qr.
        // const _stream = createWriteStream(filename)
        await qrcode.toFile(filename, merchant_url);
        const url: string = await storage.upload(filename, readFileSync(filename))
        rmSync(filename);
        //const url = `${merchant_url}/${filename}`
        // update the merchant's qr_code url.
        await database.updateQueueById(Number.parseInt(id), { ...new_queue, qr_code: url });
        const business = await database.getBusinessBranchById(`${new_queue.branchId}`);
        log.info(`Successfully updated queue with id:${id}'s qr_code: ${url}`)

        // enqueue notification.
        await queue.enqueue(
          NOTIFICATION_QUEUE,
          {
            topic: "",
            value: JSON.stringify({
              channel: "email",
              destination: business.admin?.email,
              type: "MERCHANT_REGISTRATION"
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

