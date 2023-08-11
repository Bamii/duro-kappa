import express from "expressapp";
import { Router } from 'express';
import merchant_registration from "./merchant-registration"
import sms from './sms'

const router = Router();

// endpoints.
router.use(
  sms
);

router.use(() => {
  merchant_registration();
})


export default express(router);
