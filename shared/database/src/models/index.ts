export abstract class Repository<T> {
  abstract get(): T
  abstract getById(): T
  abstract insert(): T
  abstract update(): T
}

export abstract class Database {
  abstract connect(): Database

  protected client: any;

  abstract transaction(...args: Promise<any>[]): Promise<void>

  // merchants
  abstract insertMerchant(merchant: Input<Merchant>): Promise<Merchant>

  abstract updateMerchantById(id: string, merchant: Partial<Merchant>): Promise<Merchant>

  abstract getMerchantById(id: string): Promise<Merchant>

  abstract deleteMerchantById(id: string): boolean

  // branches
  abstract insertBranch(merchant: Input<Branch>): Promise<Branch>

  abstract getBusinessBranchById(id: string): Promise<Branch>

  abstract getBusinessBranchByBranchName(merchant: number, location: string): Promise<Branch | null>

  abstract updateBusinessBranchById(id: string, merchant: Partial<Branch>): Promise<Branch>

  // user
  abstract getUsers(options: Input<User>): Promise<User[]>

  abstract insertUser(merchant: Input<User>): Promise<User>

  abstract getUserById(id: number): Promise<User>

  abstract getUserByEmailOrPhone(obj: { email?: string, phone?: string }): Promise<User>

  abstract updateUserById(id: number, user: Update<User>, where?: Partial<User>): Promise<User>


  // admin
  abstract insertAdmin(merchant: Input<Admin>): Promise<Admin>

  abstract getAdminById(id: string): Promise<Admin>

  abstract getAdminByEmail(email: string): Promise<Admin>

  abstract updateAdminById(id: string, user: Update<Admin>): Promise<Admin>

  // queues.
  abstract insertQueue(queue: Input<Queue>): Promise<Queue>

  abstract getQueueById(id: number): Promise<Queue>

  abstract getQueueByName(name: string): Promise<Queue | null>

  abstract deleteQueue(id: number): Promise<void>

  abstract getBranchQueues(id: number): Promise<Queue[]>

  abstract updateQueueById(id: number, user: Update<Queue>): Promise<Queue>
}

export type Input<Type> = Omit<Type, "id" | "merchant" | "queue" | "branch" | "admin">

export type Update<Type> = Partial<Input<Type>>;

export type Merchant = {
  id: number
  company_name: string
  branch?: Branch[]
  admin?: Admin[]
}

export type Branch = {
  id: number
  merchantId: number
  merchant: Merchant
  location: string
  coordinates?: string
  slug: string
  admin?: Admin
  current_attended?: number
  queue?: Queue[]
}

export type User = {
  id: number
  name?: string
  email?: string
  phone?: string
  in_queue: boolean
  current_queue?: number | null
  attending_to?: boolean
  queue?: Queue
}

export type UserInput = Omit<User, "in_queue">

export type Admin = {
  id: number
  email: string
  username?: string
  merchantId: number
  merchant: Merchant
  branchId: number
  branch: Branch
  password: string
  superAdmin: boolean
}

export type Queue = {
  id: number
  name: string
  description: string
  branchId: number
  branch: Branch
  duration?: `${string}_${string}`
  qr_code?: string
  users?: User[]
  active: boolean
}

export type CleanAdmin = Omit<Admin, "password">

export type DBAdminType = Admin & { password: string }

