import { Router, Response } from 'express';
import log from "logger";
import { Container } from 'typedi';
// import CacheInstance from "cache"
import DatabaseInstance from "database";
import QueueInstance, { NOTIFICATION_QUEUE, DURO_QUEUE, MERCHANT_REGISTRATION_QUEUE } from "queue"
import { sendError, sendSuccess } from 'expressapp/src/utils';
import { Merchant, Branch, Admin, Queue, Input } from 'database/src/models';
import { extract, adminAuth, comparePassword, hashPassword, signJWT } from "auth"
import * as validator from './middleware';
const router = Router();

// const cache = Container.get(CacheInstance);
const database = Container.get(DatabaseInstance);
const queue = Container.get(QueueInstance);

// onboard...
router.post('/onboard', validator.createMerchantValidation, async (_req, res) => {
  const { company_name } = _req.body as Input<Merchant>;
  const { location, coordinates } = _req.body as Input<Branch>;
  const { username, email, password } = _req.body as Input<Admin>;

  try {
    let merchant, admin;
    admin = await database.getAdminByEmail(email);
    if (admin)
      throw new Error("this email is already associated with a merchant.")

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
  } catch (error: any) {
    log.error(error.message);
    return sendError(res, error.message)
  }
});

// admin logins...
router.post('/login', validator.loginValidator, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await database.getAdminByEmail(email);
    if (!user)
      throw new Error("oops! invalid email and password combination.");

    const isValid = await comparePassword({ hashedPassword: user.password, password });
    if (!isValid)
      throw new Error("oops! invalid email and password combination.")

    const new_user = extract(user, 'password');
    return sendSuccess(
      res,
      "Logged in successfully!",
      { data: { token: signJWT({ email }), user: new_user } }
    )
  } catch (error: any) {
    return sendError(res, `closed sesame: ${error.message}`, { status: 401 });
  }
})

router.post('/queue/user/dismiss', validator.dismissUserValidation, adminAuth(false), async (req: any & { user: Admin }, res: any) => {
  try {
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
  } catch (error: any) {
    log.error(error.message)
    return sendError(res, "an error occured while dismissing the user.")
  }
})

// queue actions
router.post('/queue/advance', validator.advanceQueueValidation, adminAuth(false), async (req: any & { user: Admin }, res: Response) => {
  try {
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
    const userToAttendTo: string | null = await queue.dequeue<any, string>(DURO_QUEUE, { topic: queueId })
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
  } catch (error: any) {
    log.error(error.message);
    return sendError(res, "Error occured while advancing queue.")
  }
})

router.get('/currently-attending-to', validator.queueActionValidation, adminAuth(false), async (req: any & { user: Admin }, res) => {
  try {
    const { queueId } = req.body;
    const { branchId } = req.user;
    const queueTendingTo = await database.getQueueById(queueId)

    if (branchId !== queueTendingTo.branchId) {
      log.info("a sly fox tried to steal our hen.")
      return sendError(res, "closed sesame.", { status: 401 })
    }

    const people = await database.getUsers({ current_queue: queueId, in_queue: true });
    return sendSuccess(res, "Suceessfully retrieved list of currently attending to", { data: people });
  } catch (error: any) {
    return sendError(res, "An error occured while getting the list of people you're currently attending to. Please try again later.")
  }
});

// SUPERADMIN JOB!
router.post('/branch/create', adminAuth(true), async (req: any & { user: Admin }, res: any) => {
  const { location, coordinates } = req.body;
  const { username, email, password } = req.body as Input<Admin>;
  const { merchantId } = req.user;

  try {
    const { id, company_name } = await database.getMerchantById(merchantId);
    const admin = await database.getAdminByEmail(email);
    if (admin)
      throw new Error("this email is already attached to an admin. please try another.")

    const branch = await database.insertBranch({
      merchantId,
      location,
      coordinates,
      slug: `${location.split(" ").join("_").toLowerCase()}__${company_name}`
    })

    const company_queue = await database.insertQueue({
      description: "Default queue for this branch.",
      name: `${company_name} queue`,
      branchId: branch.id,
      active: false
    })

    const _password = await hashPassword(password);
    await database.insertAdmin({
      merchantId,
      branchId: branch.id,
      username, email, password: _password, superAdmin: false
    })
    await queue.enqueue(MERCHANT_REGISTRATION_QUEUE, company_queue.id);

    log.info("successfully added branch to list. :", id)
    return sendSuccess(res, "Successfully registered your business branch.")
  } catch (error: any) {
    log.error(error.message);
    return sendError(res, error.message)
  }
});

router.get('/branch/list', adminAuth(true), async (req: any & { user: Admin }, res: any) => {
  const { merchantId } = req.user;

  try {
    const { branch: branches } = await database.getMerchantById(merchantId);
    return sendSuccess(res, "Successfully retrieved branch list", { data: branches });
  } catch (error: any) {
    log.error(error.message);
    return sendError(res, error.message)
  }
});


// queues
router.post('/queue/create', adminAuth(false), async (req: any & { user: Admin }, res: any) => {
  try {
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
  } catch (error: any) {
    log.info(error.message);
    return sendError(res, "An error occured while creating a queue. please try again or contact support");
  }
});

router.delete('/queue/delete', validator.queueActionValidation, adminAuth(false), async (req: any & { user: Admin }, res: any) => {
  try {
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
      throw new Error("You cannot have less than one queue at a given time.")

    if (queueTendingTo.users && queueTendingTo.users?.length > 0)
      return sendError(res, "you cannot delete a queue that still has participants.")

    await database.deleteQueue(queueId);
    return sendSuccess(res, "Queue successfully deleted.");
  } catch (error: any) {
    log.error(error.message)
    return sendError(res, `An error occured while deleting this queue. ${error.message}`)
  }
});

router.get('/queue/list', adminAuth(false), async (req: any & { user: Admin }, res: any) => {
  try {
    const { branchId } = req.user;
    const list = await database.getBranchQueues(branchId);
    return sendSuccess(res, "Successfully retrieved list of queues.", { data: list })
  } catch (error: any) {
    return sendError(res, `An error occured while retrieving your list of queues: ${error.message}`)
  }
});

// update merchant details
//router.patch('/merchant', async (req, res) => {
//  console.log(req, res);
//})



export default router;

