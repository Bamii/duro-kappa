import { NotificationService, NotificationOptions } from '../'
// import Mailjet from 'node-mailjet';
import log from "logger";
// import _config from "config";
// const config = _config.notifications;

// const fs = require('fs');
const path = require('path');
const process = require('process');
// const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
// const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
// async function loadSavedCredentialsIfExist() {
//   log.info('asfdaf')
//   try {
//     log.info('dssd')
//     const content = await fs.readFileSync(TOKEN_PATH);
//     console.log(content)
//     const credentials = JSON.parse(content);
//     console.log(credentials)
//     return google.auth.fromJSON(credentials);
//   } catch (err) {
//     log.error('error')
//     log.error(err);
//     // throw new Error()
//     return null;
//   }
// }
// async function saveCredentials(client: any) {
//   const content = await fs.readFile(CREDENTIALS_PATH);
//   const keys = JSON.parse(content);
//   const key = keys.installed || keys.web;
//   const payload = JSON.stringify({
//     type: 'authorized_user',
//     client_id: key.client_id,
//     client_secret: key.client_secret,
//     refresh_token: client.credentials.refresh_token,
//   });
//   await fs.writeFile(TOKEN_PATH, payload);
// }

// async function authorize() {
//   let client = await loadSavedCredentialsIfExist();
//   log.info('afda', client)
//   if (client) {
//     return client;
//   }

//   client = await authenticate({
//     scopes: SCOPES,
//     keyfilePath: CREDENTIALS_PATH,
//   });
//   log.info(client);
//   if (client.credentials) {
//     await saveCredentials(client);
//   }
//   return client;
// }
log.info(CREDENTIALS_PATH)

function makeEmail(addy: string) {
  const subject = 'Hello from Gmail API';
  const body = 'This is a test email sent from the Gmail API.';

  const email = `
    From: your_email@gmail.com
    To: ${addy}
    Subject: ${subject}

    ${body}
  `;

  return email;
}

export class EmailNotificationService implements NotificationService {
  client: typeof google | null = null;

  constructor() {
    this.connect();
  }

  async connect(): Promise<this> {
    try {
      this.client = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: SCOPES,
      });
      // this.client = new Gmail({ projectId: "duro-395520" })
      // const auth = new google.auth.GoogleAuth({
      //   // Scopes can be specified either as an array or as a single, space-delimited string.
      //   scopes: ['https://www.googleapis.com/auth/compute']
      // });
      const authClient = await this.client.getClient();
    
      log.info(authClient)

      // obtain the current project Id
      const project = await this.client.getProjectId();

      log.info(project)

      // this.client = authorize();
      log.info('successfully connected to email service.')
    } catch (error: any) {
      log.error(error);
      log.error("error occured while connecting to email");
      throw error;
    }
    return this;
  }

  async sendNotification(notification: NotificationOptions): Promise<void> {
    console.log(notification)
    const gmail = google.gmail({ version: 'v1', auth: this.client });

    try {
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: Buffer.from(makeEmail('bbamii@outlook.com'))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, ''),
        },
      });
      log.info("send email successfully")
    } catch (error: any) {
      log.info(error.message);
      throw error;
    }
  }
}

