
// Create a single supabase client for interacting with your database
import { Token } from "typedi";
import Supabase from "./impl/supabase";

export interface Storage {
  client: any;

  connect(): this;

  get(file: string): string

  upload<T>(file: string, object: T): Promise<string>
}


export default (function() {
  return Supabase as Token<Storage>
})();


