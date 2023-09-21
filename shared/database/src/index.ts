import { Token } from 'typedi';
import { Prisma } from './impl/prisma'
import { Database } from './models';
import * as dotenv from 'dotenv';
import 'reflect-metadata';
dotenv.config();

// this structure is very much up for debate... 
const databases: Record<string, typeof Database> = {
  "prisma": Prisma
} as const;

type DatabaseName = keyof typeof databases;
type FactorySettings = {
  database: DatabaseName;
  connection_string?: string;
}

function DatabaseFactory({ database = "prisma" }: FactorySettings) {
  return databases[database] as Token<Database>;
}

export default (function() {
  return DatabaseFactory({ database: "prisma" });
})();
