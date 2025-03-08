import { request } from "./req";

export type RequestOptions<T> = Partial<PostRequestOptions<T>> & {
  body?: T
}

export type PostRequestOptions<T> = {
  body: T
};

export type OnboardMerchant = {
  company_name: string,
  location: string,
  coordinates?: string,
  username: string,
  email: string,
  password: string
}

export type LoginMerchant = Pick<OnboardMerchant, "email" & "password">

export type JoinQueueInput = {
  username?: string
  password: string
  type: JoinQueueType
  email: string
}

export type JoinQueueType = "login" | "register"

export type CreateQueueInput = {
  name: string
  description: string
}

export type CreateBranchInput = Omit<OnboardMerchant, 'company_name'>

async function onboard({ body, ...opts }: PostRequestOptions<OnboardMerchant>) {
  return request('/admin/onboard', { method: 'post', body, ...opts })
}

async function login_merchant({ body, ...opts }: PostRequestOptions<LoginMerchant>) {
  return request('/admin/login', { method: 'post', body, ...opts })
}

async function get_queues() {
  return request('/queue/list', { method: 'get', withCredentials: true });
}

async function get_queue_details() {
  return request('/queue/details', { method: 'get', withCredentials: true })
}

async function preview_queue(queue: string) {
  return request(`/queue/preview/${queue}`, { method: 'get' });
}

async function join_queue(queue: string, opts: JoinQueueInput) {
  return request(`/queue/join/${queue}`, { method: 'post', body: { ...opts } });
}

async function leave_queue() {
  return request(`/queue/leave`, { method: 'post', withCredentials: true });
}

async function list_admin_queues() {
  return request('/admin/queue/list', { method: 'get', withCredentials: true })
}

async function delete_queue(id: string) {
  return request('/admin/queue/delete', { method: 'delete', withCredentials: true, body: { queueId: id } })
}

async function get_branches() {
  return request('/admin/branch/list', { method: 'get', withCredentials: true })
}

async function advance_queue(opts: { queueId?: number, userId?: number }) {
  return request('/admin/queue/advance', { method: 'post', body: opts, withCredentials: true })
}

async function dismiss_user(user: string) {
  return request('/admin/queue/user/dismiss', { method: 'post', withCredentials: true, body: { userId: user } })
}

//async function delete_branch() {
//  return request('/admin/branch/branchId', { method: 'delete' })
//}

async function create_branch(opts: CreateBranchInput) {
  return request('/admin/branch/create', { method: 'post', body: opts, withCredentials: true })
}

async function create_queue(opts: CreateQueueInput) {
  return request('/admin/queue/create', { method: 'post', body: opts, withCredentials: true })
}

export const api = {
  admin: {
    onboard: ({ body, ...opts }: PostRequestOptions<OnboardMerchant>) =>
      request('/onboard', { method: 'post', body, ...opts }),
    login: ({ body, ...opts }: PostRequestOptions<LoginMerchant>) =>
      request('/login', { method: 'post', body, ...opts }),
    queue: {

    },
    branch: {

    }
  },
  client: {
    join_queue: () => { },
    leave_queue: () => { },
    get_position: () => { },
    get_queue_list: () => { }
  }
}


export const apis = {
  onboard,
  login_merchant,
  get_queues,
  preview_queue,
  get_queue_details,
  join_queue,
  leave_queue,
  list_admin_queues,
  delete_queue,
  create_branch,
  get_branches,
  advance_queue,
  dismiss_user,
  create_queue
}

