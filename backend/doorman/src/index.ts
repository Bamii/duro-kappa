import expressapp from 'expressapp/src/index';
import { Router } from "express";
// @ts-ignore
import proxy from "express-http-proxy"
import duro from "duro-queue/src/routes";
// import { listener } from "frontend/.output/server/index.mjs"
// import { listener } from "frontend/.nuxt/dev/index.mjs"
// import { server } from "frontend/.output/server/index.mjs"
import admin from "admin/src/routes";

// import "newrelic";
// import { loadNuxt, build } from "nuxt"
import * as dotenv from "dotenv";
dotenv.config();

const router = Router();

router.get('/api/v1/', (_, res) => { res.send("Welcome to DURO doorman! happy waiting :)") })
router.use('/api/v1/admin', admin)
router.use('/api/v1/queue', duro)

;(async function() {
  const test = false
  if(test) {
    // @ts-ignore
    const mod = await import("../../../apps/frontend/.output/server/index.mjs");
  
    router.use("/", mod.listener);
  } else {
    router.use("/", proxy("http://localhost:3000"));
  }
})();

expressapp(Router().use('/', router), []);
