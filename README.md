# DURO by team kappa

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/57e3873561594453a85d0a2a015949e4)](https://app.codacy.com/gh/PipelineV2/duro-kappa/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

## description
It is time to move away from people self-organising (by writing names on paper and assigning numbers to themselves) or randomly storming an office, hoping to be attended to.

Customers will use Duro to make an appointment and join a virtual queue, by filling a form, scanning a QR code or sending SMS to a mobile number. 

They then get assigned a spot on the queue and receive tailored communication (SMS or notifications) to ensure they get in, only when it’s their turn. No more crowded waiting rooms. No more jumping the queue. No more disgruntled customers putting pressure on maxed-out staff.

The QR code and mobile phone number are displayed visibly and outside the premises. The system can be configured for these to change on a routine (e.g daily or hourly), and can use geo-fencing. This way, the business can decide to prohibit people from saving a spot friends until they show up at the premises

## how to run.
### node
- if you don't have pnpm on your system, install it using ```yarn add -g pnpm``` or  ```npm i -g pnpm``` or go to the [official installation instructions](https://pnpm.io/installation)
- run ```pnpm i```
- edit the .env_sample to reflect your values and change it to .env
- run ```pnpm run start``` to run the full project(frontend and backend)

### docker
- edit the .env_docker_sample to reflect values of your own... and save it as .env_docker
- run ```docker compose up```
(the backend runs on port 4000, while the frontend runs on 3000)


## some details on how it works...
businesses will have more than one branches, and each branch will have their own queues.
only one admin email will be attached to each branch, and each email must be unique.
each queue will have a qr code, and a unique link for the users to join.
admins will be able to advance queues and dismiss users from queues.


## architecture.
