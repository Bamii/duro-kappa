import { Router, Response } from 'express';
import log from "logger";
import { Container } from 'typedi';
import DatabaseInstance from "database";
import QueueInstance, { NOTIFICATION_QUEUE, DURO_QUEUE, MERCHANT_REGISTRATION_QUEUE } from "queue"
import { sendError, sendSuccess } from 'expressapp/src/utils';
import { Merchant, Branch, Admin, Queue, Input } from 'database/src/models';
import { ApplicationError } from "config";
import { extract, adminAuth, comparePassword, hashPassword, signJWT } from "auth"
import * as validator from './middleware';
import CacheInstance, { QUEUE_DURATION_CACHE } from 'cache';

const router = Router();
const database = Container.get(DatabaseInstance);
const queue = Container.get(QueueInstance);
const cache = Container.get(CacheInstance)

// onboard...
router.post('/onboard', validator.createMerchantValidation, async (_req, res) => {
  const { company_name } = _req.body as Input<Merchant>;
  const { location, coordinates } = _req.body as Input<Branch>;
  const { username, email, password } = _req.body as Input<Admin>;

  let merchant, admin;
  admin = await database.getAdminByEmail(email);
  if (admin)
    throw new ApplicationError("this email is already associated with a merchant.")

  merchant = await database.insertMerchant({ company_name: company_name.toLowerCase() })
  const branch = await database.insertBranch({
    merchantId: merchant.id,
    location,
    coordinates,
    slug: `${location.split(" ").join("_").toLowerCase()}__${company_name}`
  })
  const hashedPassword = await hashPassword(password);
  admin = await database.insertAdmin({
    merchantId: merchant.id,
    branchId: branch.id,
    username, email, password: hashedPassword, superAdmin: true
  })

  const company_queue = await database.insertQueue({
    description: "Default queue for this branch.",
    name: `${company_name} queue`,
    duration: "9-17",
    branchId: branch.id,
    active: false
  })

  await queue.enqueue(
    MERCHANT_REGISTRATION_QUEUE,
    { topic: "", value: `${company_queue.id}` }
  );

  log.info("successfully added business to list. :", merchant.id)
  const clean_user = extract(admin, 'password');

  return sendSuccess(
    res,
    "Successfully registered your business. You will get an email with details about your qr code. Thank you for using our service!",
    { data: { user: clean_user, token: signJWT({ email }) } }
  )
});

// admin logins...
router.post('/login', validator.loginValidator, async (req, res) => {
  const { email, password } = req.body;
  const user = await database.getAdminByEmail(email);
  if (!user)
    throw new ApplicationError("oops! invalid email and password combination.");

  const isValid = await comparePassword({ hashedPassword: user.password, password });
  if (!isValid)
    throw new ApplicationError("oops! invalid email and password combination.")

  const new_user = extract(user, 'password');
  return sendSuccess(
    res,
    "Logged in successfully!",
    { data: { token: signJWT({ email }), user: new_user } }
  )
})

router.post('/queue/user/dismiss', validator.dismissUserValidation, adminAuth(false), async (req: any & { user: Admin }, res: any) => {
  const { userId } = req.body;
  const { id, branchId } = req.user;
  const userToDismiss = await database.getUserById(userId);

  if (!userToDismiss)
    return sendError(res, "hmmm... user could not be found");

  if (!userToDismiss.current_queue)
    return sendError(res, "this user is currently not on any queue, champ.")

  if (!userToDismiss.attending_to)
    return sendError(res, "you're currently not attending to this user yet.")

  const q = await database.getQueueById(userToDismiss.current_queue);
  log.info(`admin:${id} is trying to advance queue with queueId ${userToDismiss.current_queue}`)

  if (q.branchId !== branchId) {
    log.info("a sly fox tried to steal our hen.")
    return sendError(res, "closed sesame.", { status: 401 })
  }

  log.info(`dispatching user ${userToDismiss.id}. au reviour!`)
  await database.updateUserById(
    userToDismiss.id,
    { in_queue: false, attending_to: false, current_queue: null },
    //{ current_queue: userToDismiss.current_queue, in_queue: true }
  );

  return sendSuccess(res, "successfully dismissed the user from the queue.")
})

// queue actions
router.post('/queue/advance', validator.advanceQueueValidation, adminAuth(false), async (req: any & { user: Admin }, res: Response) => {
  const { userId: previousAttendedTo, queueId } = req.body;
  const { id, branchId } = req.user;
  const queueToAdvance = await database.getQueueById(Number.parseInt(queueId))
  log.info(`admin:${id} is trying to advance queue with queueId ${queueId}`)

  if (!queueToAdvance)
    return sendError(res, "hmmm... queue could not be found");

  if (branchId !== queueToAdvance.branchId) {
    log.info("a sly fox tried to steal our hen.")
    return sendError(res, "closed sesame.", { status: 401 })
  }

  // update previous users' attending_to and current queue
  // and ensure that only the users in the admin's queue are updated.
  if (previousAttendedTo) {
    let previous = await database.getUserById(previousAttendedTo);

    if (previous && previous.in_queue && queueToAdvance.id === previous.current_queue) {
      log.info(`dispatching user ${previousAttendedTo}. au reviour!`)
      await database.updateUserById(
        previousAttendedTo,
        { in_queue: false, attending_to: false, current_queue: null },
        //{ current_queue: queueId, in_queue: true }
      );
    }
  }

  // get the next user to attend to & update their relevant fields.
  const userToAttendTo: string | null = await queue.dequeue<string>(DURO_QUEUE, { topic: queueId })
  log.info(userToAttendTo ? `this is user to attend: ${userToAttendTo}` : 'there are no users to attend to. relax, & chop life.')
  if (!userToAttendTo)
    return sendSuccess(res, "There is nobody currently on the queue.");
  const { email } = await database.updateUserById(
    Number.parseInt(userToAttendTo),
    { attending_to: true, current_queue: queueId }
  )

  // notify the user.
  await queue.enqueue(
    NOTIFICATION_QUEUE,
    {
      topic: "",
      value: JSON.stringify({
        channel: "email",
        destination: email,
        message: "Congrats!!"
      })
    }
  );
  return sendSuccess(res, "Suceessfully advanced queue. A Notification will be sent to the next user");
})

router.get('/currently-attending-to', validator.queueActionValidation, adminAuth(false), async (req: any & { user: Admin }, res) => {
  const { queueId } = req.body;
  const { branchId } = req.user;
  const queueTendingTo = await database.getQueueById(queueId)

  if (branchId !== queueTendingTo.branchId) {
    log.info("a sly fox tried to steal our hen.")
    return sendError(res, "closed sesame.", { status: 401 })
  }

  const people = await database.getUsers({ current_queue: queueId, in_queue: true });
  return sendSuccess(res, "Suceessfully retrieved list of currently attending to", { data: people });
});

router.post('/queue/extend', validator.advanceQueueValidation, adminAuth(true), async (req: any & { user: Admin }, res: Response) => {
  const { branchId } = req.user;
  const { queueId, time } = req.body;
  const queueToAdvance = await database.getQueueById(Number.parseInt(queueId))

  if (!queueToAdvance)
    return sendError(res, "hmmm... queue could not be found");

  if (branchId !== queueToAdvance.branchId) {
    log.info("a sly fox tried to steal our hen.")
    return sendError(res, "closed sesame.", { status: 401 })
  }

  await cache.insert(QUEUE_DURATION_CACHE, { key: queueId, value: time });
  return sendSuccess(res, "Successfully extended queue time.")
})

// SUPERADMIN JOB!
router.post('/branch/create', adminAuth(true), async (req: any & { user: Admin }, res: any) => {
  const { location, coordinates } = req.body;
  const { username, email, password } = req.body as Input<Admin>;
  const { merchantId } = req.user;

  const { id, company_name } = await database.getMerchantById(merchantId);
  const admin = await database.getAdminByEmail(email);
  if (admin)
    throw new ApplicationError("this email is already attached to an admin. please try another.")

  const branch = await database.insertBranch({
    merchantId,
    location,
    coordinates,
    slug: `${location.split(" ").join("_").toLowerCase()}__${company_name}`
  })

  const company_queue = await database.insertQueue({
    description: "Default queue for this branch.",
    name: `${company_name} queue`,
    duration: "9-17",
    branchId: branch.id,
    active: false
  })

  const _password = await hashPassword(password);
  await database.insertAdmin({
    merchantId,
    branchId: branch.id,
    username, email, password: _password, superAdmin: false
  })
  await queue.enqueue(
    MERCHANT_REGISTRATION_QUEUE,
    { topic: "", value: `${company_queue.id}` }
  );

  log.info("successfully added branch to list. :", id)
  return sendSuccess(res, "Successfully registered your business branch.")
});

router.get('/branch/list', adminAuth(true), async (req: any & { user: Admin }, res: any) => {
  const { merchantId } = req.user;

  const { branch: branches } = await database.getMerchantById(merchantId);
  return sendSuccess(res, "Successfully retrieved branch list", { data: branches });
});


// queues
router.post('/queue/create', adminAuth(false), async (req: any & { user: Admin }, res: any) => {
  const { branchId } = req.user;
  const { name, description, duration } = req.body as Input<Queue>;
  let q = await database.getQueueByName(name);
  if (q)
    return sendError(res, "There's already a queue with this name :(");

  q = await database.insertQueue({ active: false, branchId, name, description, duration });
  await queue.enqueue(
    MERCHANT_REGISTRATION_QUEUE,
    { topic: "", value: `${q.id}` }
  );
  return sendSuccess(res, "Successfully created a queue");
});

router.delete('/queue/delete', validator.queueActionValidation, adminAuth(false), async (req: any & { user: Admin }, res: any) => {
  const { branchId } = req.user;
  const { queueId } = req.body;
  const queueTendingTo = await database.getQueueById(queueId)

  console.log(queueTendingTo)
  if (!queueTendingTo)
    return sendError(res, "this queue is nonexistent, capo.")

  if (branchId !== queueTendingTo.branchId) {
    log.info("a sly fox tried to steal our hen.")
    return sendError(res, "closed sesame.", { status: 401 })
  }

  const queues = await database.getBranchQueues(branchId);
  if (queues.length === 1)
    throw new ApplicationError("You cannot have less than one queue at a given time.")

  if (queueTendingTo.users && queueTendingTo.users?.length > 0)
    return sendError(res, "you cannot delete a queue that still has participants.")

  await database.deleteQueue(queueId);
  return sendSuccess(res, "Queue successfully deleted.");
});

router.get('/queue/list', adminAuth(false), async (req: any & { user: Admin }, res: any) => {
  const { branchId } = req.user;
  const list = await database.getBranchQueues(branchId);
  return sendSuccess(res, "Successfully retrieved list of queues.", { data: list })
});

export default router;
