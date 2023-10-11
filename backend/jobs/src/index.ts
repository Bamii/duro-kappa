import express from "expressapp";
import { Router } from 'express';
import merchant_registration from "./merchant-registration"
import notifications from "./notifications";
import { delete_queue_end_queue, dequeue_all_users } from "./cron-fns";
import sms from './sms'

// endpoints.
const router = Router();
router.use(sms);

// cron jobs.
notifications();
merchant_registration();
delete_queue_end_queue();
dequeue_all_users();


export default express(router);
