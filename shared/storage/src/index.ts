import { createClient } from '@supabase/supabase-js'
import log from "logger";
import _config, { ApplicationError } from "config";
const config = _config.storage;

// Create a single supabase client for interacting with your database
export interface Storage {
  client: any;

  connect(): this;

  get(file: string): string

  upload<T>(file: string, object: T): Promise<string>
}



class Supabase implements Storage {
  client: any;

  connect(): this {
    try {
      this.client = createClient(config.connection_url, config.private_key);
      return this;
    } catch (error: any) {
      log.error('could not connect to client', error);
      throw new ApplicationError("An error occured while connecting to the client.");
    }
  }

  get(file: string): string {
    return file;
  }

  // this function will replace the old file with the latest one provided the file 
  // has been uploaded already
  async upload<T>(file: string, object: T): Promise<string> {
    log.info(file, object);
    const { error } = await this.client
      .storage
      .from(config.qr_bucket)
      .upload(`public/${file}`, object, {
        contentType: 'image/png',
        upsert: false,
        cacheControl: 3600
      });
    if (error) throw new ApplicationError("An error occured while uploading the object.")
    log.info("successfully uploaded file ", file);

    const { data: { publicUrl: url } } = this.client
      .storage
      .from(config.qr_bucket)
      .getPublicUrl(`public/${file}`)
    return url;
  }
}

export default (function() {
  let instance: Storage;

  return (): Storage => {
    if (!instance)
      instance = new Supabase();
    return instance;
  }
})();


