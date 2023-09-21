import { Router } from 'express';
import Database from "database";
import log from "logger";
import Queue, { DURO_QUEUE, NOTIFICATION_QUEUE, QUEUE_DURATION_QUEUE } from "queue"
import { sendError, sendSuccess } from 'expressapp/src/utils';
import { NotificationOptions } from 'notifications'
import { joinQueueValidation } from './middleware';
import { signJWT, clientAuth } from "auth"
import { Update, User } from 'database/src/models';
import { Container } from "typedi";

const database = Container.get(Database);
const queue = Container.get(Queue);
const router = Router();

router.get("/", (_, __, next) => {
  next(new Error("heyy"))
})

// join queue.
router.post('/join/:merchant_queue', joinQueueValidation, async (_req, res) => {
  const { email, name } = _req.body;
  const { merchant_queue } = _req.params;
  try {
    if (!merchant_queue || !email)
      throw new Error("Invalid input. Please send in an email.")

    const q = await database.getQueueById(Number.parseInt(merchant_queue));
    if (!q)
      return sendError(res, "this queue is not existent.")

    let user = await database.getUserByEmailOrPhone({ email });
    if (!user) {
      log.info(`User with email: ${email} was not found. Creating a new user.`);
      user = await database.insertUser({ email, in_queue: true, current_queue: Number.parseInt(merchant_queue) })
      log.info(`successfully created user with email: ${email}`)
    } else {
      log.info(`user with email: ${email} was found. yay!`)
      if (user.in_queue && user.current_queue)
        return sendSuccess(
          res,
          user.current_queue == Number.parseInt(merchant_queue)
            ? "you are on the queue... happy waiting!"
            : "You are already on a queue. You have to leave your current queue before you can join another one.",
          { data: { user, token: signJWT({ email }) } }
        );

      let update_object: Update<User> = { in_queue: true, current_queue: Number.parseInt(merchant_queue) };
      if (name) update_object.name = name;

      user = await database.updateUserById(user.id, update_object)
      log.info(`updated user with email: ${email} to be in queue for merchant with id: ${merchant_queue}`)
    }

    // TODO::
    // get the current time and check if its within the bounds of the time for the queue.
    // take note that the bounds can change per day for each queue.
    // check the queue_duration_queue to see if the date has been extended.
    await queue.enqueue(QUEUE_DURATION_QUEUE, {
      topic: "",
      value: JSON.stringify({
        channel: user.email ? 'email' : "sms",
        destination: user.phone
      })
    });

    log.info(`enqueueing the user for the merchant with id: ${merchant_queue}`)
    await queue.enqueue(DURO_QUEUE, { topic: merchant_queue, value: `${user.id}` });
    const length = await queue.length(DURO_QUEUE, { topic: merchant_queue });
    log.info('done')

    log.info(`enqueueing notification to the user.`)
    await queue.enqueue(NOTIFICATION_QUEUE, {
      topic: "",
      value: JSON.stringify({
        channel: user.email ? 'email' : "sms",
        destination: user.phone ?? user.email ?? "",
        message: `You have been queued. you are number ${length} on the queue`
      })
    });
    log.info('done')
    log.info(`successfully queued user with email : ${email}`)

    const token = signJWT({ email });
    return sendSuccess(res, "Successfully joined a queue!.", { data: { token, user } })
  } catch (error: any) {
    log.error(error.message);
    return sendError(res, error.message)
  }
});

router.post('/leave', clientAuth(), async (_req: any & { user: User }, res) => {
  const { email } = _req.user;

  try {
    let user = await database.getUserByEmailOrPhone({ email });

    if (!user || !user.current_queue)
      throw new Error("You are currently not on a queue.");

    if (user.attending_to)
      throw new Error("You are currently being attended to, the admin will do the rest. Cheers!")

    // await database.updateBusinessBranchById(`${user.current_queue}`, { current_attended: (merchant.current_attended ?? 0) + 1 });
    await queue.dequeueItem(DURO_QUEUE, `${user.id}`, { topic: `${user.current_queue}` })
    await database.updateUserById(user.id, { in_queue: false, current_queue: null, attending_to: false })

    // maybe i shouldn't do this.
    await queue.enqueue<NotificationOptions>(NOTIFICATION_QUEUE, {
      channel: user.email ? 'email' : "sms",
      destination: user.phone ?? user.email ?? "",
      type: "QUEUE_LEAVE",
      message: `You have now left the queue. Thank you for using this service.`
    });

    log.info("successfully dequeued user:")
    return sendSuccess(res, "you have successfully left the queue. thank you for using our service! 😏");
  } catch (error: any) {
    log.error(error.message);
    return sendError(res, error.message)
  }
})

router.get('/details', clientAuth(), async (req: any & { user: User }, res: any) => {
  const user = req.user; // parse token.

  try {
    if (!user.in_queue || !user.current_queue)
      return sendError(res, "You are currently not on a queue.");

    if (user.attending_to)
      return sendSuccess(res, "You are currently being attended to.");

    const position = await queue.getIndexOf(DURO_QUEUE, `${user.id}`, { topic: `${user.current_queue}` })
    const length = await queue.length(DURO_QUEUE, { topic: `${user.current_queue}` })
    const q = await database.getQueueById(user.current_queue);

    console.log(position, length);
    if (position < 0)
      throw new Error("You are currently not on the queue.")

    return sendSuccess(res, "Successfully got queue details.", { data: { queue: q, position } });
  } catch (error: any) {
    log.error(error.message);
    return sendError(res, "An error occured, please try again later.")
  }
})

router.get('/preview/:queueId', async (req: any, res: any) => {
  try {
    const { queueId } = req.params;

    const q = await database.getQueueById(Number.parseInt(queueId));
    if (!q)
      return sendError(res, "this queue is invalid")

    delete q.users;
    return sendSuccess(res, "Queue details fetched successfully.", { data: q })
  } catch (error: any) {
    log.error(error.message)
    return sendError(res, "an error occured while gettin queue preview.")
  }
})

export default router;

