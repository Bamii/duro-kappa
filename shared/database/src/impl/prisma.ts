import { Branch, Database, User, Admin, Input, Merchant, Update, Queue } from "../models";
import { PrismaClient } from "@prisma/client"
import log from "logger";
import { Service } from "typedi";

@Service()
export class Prisma extends Database {
  constructor() {
    super();
    this.connect();
  }

  connect(): Database {
    try {
      this.client = new PrismaClient()
      log.info('connected to database.');
      return this;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async transaction(...args: Promise<Function>[]): Promise<void> {
    try {
      await this.client?.$transaction(args);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // merchants
  async insertMerchant(merchant: Input<Merchant>): Promise<Merchant> {
    try {
      const _merchant = await this.client.merchant.findMany({ where: { company_name: merchant.company_name } })
      if (_merchant.length > 0)
        throw new Error('this merchant already exists.')

      return this.client.merchant.create({ data: merchant })
    } catch (error: any) {
      console.log(error.message)
      throw new Error(`Merchant cannot be inserted : ${error.message}`)
    }
  }

  async getMerchantById(id: string): Promise<Merchant> {
    try {
      return this.client?.merchant.findUnique({
        where: { id },
        include: {
          branch: {
            include: {
              admin: {
                select: {
                  id: true,
                  username: true,
                  merchantId: true,
                  branchId: true,
                  email: true,
                  superAdmin: true
                }
              }
            }
          }, admin: true
        }
      })
    } catch (error: any) {
      log.error("an error occured while getting merchant by id.")
      throw new Error(error.message)
    }
  }

  async updateMerchantById(id: string, merchant: Partial<Merchant>): Promise<Merchant> {
    return this.client.merchant.update({
      where: { id: Number.parseInt(id) },
      include: { branch: true, admin: true },
      data: merchant
    })
  }

  deleteMerchantById(id: string): boolean {
    return !!id;
  }

  // branches
  async insertBranch(branch: Input<Branch>): Promise<Branch> {
    try {
      return this.client.branch.create({ data: branch })
    } catch (error: any) {
      console.log(error.message)
      throw new Error(`Merchant cannot be inserted : ${error.message}`)
    }
  }

  async getBusinessBranchByBranchName(merchant: number, location: string): Promise<Branch | null> {
    try {
      const branches = await this.client.branch.findMany({
        where: { location, merchantId: merchant },
        include: { merchant: true, admin: true }
      });

      if (branches.length > 0)
        return branches[0];

      return null;
    } catch (error: any) {
      log.error(error.message);
      throw new Error(error.message);
    }
  }

  async getBusinessBranchById(id: string): Promise<Branch> {
    try {
      const me = await this.client.branch.findUnique({
        where: { id: Number.parseInt(id) },
        include: { merchant: true, admin: true }
      });

      if (me == null) throw new Error(`could not find the branch with id: ${id}`)

      return me;
    } catch (error: any) {
      log.error(error.message);
      throw new Error(error.message);
    }
  }

  async updateBusinessBranchById(id: string, branch: Partial<Branch>): Promise<Branch> {
    return this.client.branch.updateMany({
      where: { id: Number.parseInt(id) },
      include: { merchant: true, admin: true },
      data: branch
    })
  }

  // users
  async insertUser(value: Input<User>): Promise<User> {
    try {
      return this.client.user.create({ data: value })
    } catch (error: any) {
      console.log(error.message)
      throw new Error(`Record cannot be inserted : ${error.message}`)
    }
  }

  async getUsers(options: Input<User>): Promise<User[]> {
    try {
      return this.client.user.findMany({ where: { ...options } })
    } catch (error: any) {
      log.info("error occured while getting users");
      throw new Error(error.message);
    }
  }

  async getUserById(id: number): Promise<User> {
    try {
      return this.client.user.findUnique({
        where: { id }
      })
    } catch (error: any) {
      log.error("error occured while getting record")
      throw new Error(error.message);
    }
  }

  async getUserByEmailOrPhone({ email, phone }: { email?: string, phone?: string }): Promise<User> {
    try {
      const identifier = email ? 'email' : 'phone';
      const identifier_value = email ?? phone;
      return this.client.user.findUnique({
        where: { [identifier]: identifier_value }
      })
    } catch (error: any) {
      log.error('Could not get user by email or phone')
      throw new Error(error.message);
    }
  }

  async updateUserById(id: number, user: Update<User>): Promise<User> {
    try {
      return this.client.user.update({
        where: { id },
        data: user
      })
    } catch (error: any) {
      log.error("error occured while updating user record");
      throw new Error(error.message);
    }
  }

  async updateUsers(where: Update<User>, data: Update<User>): Promise<void> {
    await this.client.user.updateMany({
      where: { ...where },
      data: { ...data }
    });
  }

  // admin
  async insertAdmin(value: Input<Admin>): Promise<Admin> {
    try {
      return this.client.admin.create({ data: value })
    } catch (error: any) {
      console.log(error.message)
      throw new Error(`admin record could not be inserted : ${error.message}`)
    }
  }

  async getAdminById(id: string): Promise<Admin> {
    try {
      return this.client.admin.findUnique({
        where: { id },
        include: { branch: true, merchant: true }
      })
    } catch (error: any) {
      log.error('Could not get user by email or phone')
      throw new Error(error.message);
    }
  }

  async getAdminByEmail(email: string): Promise<Admin> {
    try {
      return this.client.admin.findUnique({
        where: { email },
        include: { branch: true, merchant: true }
      })
    } catch (error: any) {
      log.error('Could not get user by email or phone')
      throw new Error(error.message);
    }
  }

  async updateAdminById(id: string, user: Update<Admin>): Promise<Admin> {
    return this.client.admin.update(
      {
        where: { id: Number.parseInt(id) },
        include: { branch: true, merchant: true },
        data: user
      },
    )
  }

  async getAdminsByBranch(id: number) {
    return this.client.admin.findMany({
      where: { branchId: id },
      include: { merchant: true, branch: true }
    })
  }

  /// queues
  async updateQueueById(id: number, queue: Update<Queue>): Promise<Queue> {
    return this.client.queue.update({
      where: { id },
      include: { branch: true, users: true },
      data: queue
    });
  }

  async getQueues(where: Update<Queue>): Promise<Queue[]> {
    return this.client.queue.findMany({ where });
  }

  async insertQueue(queue: Input<Queue>): Promise<Queue> {
    return this.client.queue.create({ data: queue });
  }

  async getQueueById(id: number): Promise<Queue> {
    return this.client.queue.findUnique({
      where: { id },
      include: { branch: { include: { merchant: true } }, users: true }
    });
  }

  async getQueueByName(name: string): Promise<Queue | null> {
    const res = this.client.queue.findMany({
      where: { name },
      include: { branch: true, users: true }
    })
    if (res.length > 1) return res[0];
    return null;
  }

  async deleteQueue(id: number): Promise<void> {
    return this.client.queue.delete({
      where: { id }
    });
  }

  async getBranchQueues(id: number): Promise<Queue[]> {
    return this.client.queue.findMany({
      where: { branchId: id },
      include: { branch: true, users: true }
    })
  }
}

