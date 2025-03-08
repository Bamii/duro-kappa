// import useLocalStorage from "use-local-storage"

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
// const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4005'
type RequestOptions = {
    method: string
    body?: any
    withCredentials?: boolean
}
export async function request(
    url: string,
    { method, body, withCredentials }: RequestOptions
) {
    const key = useCookie("token")
    console.log("keyyy", key)

    try {
        url = `${BASE_URL}/api/v1${url}`
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
        }

        if (method.toLowerCase() != 'get') options.body = body
        // if (method.toLowerCase() != 'get') options.body = JSON.stringify(body)

        if (withCredentials) {
            options.headers = {
                ...options.headers,
                Authorization: `Bearer ${key.value ?? ''}`,
            }
        }

        const data = await $fetch(url, {
        // @ts-ignore
            method: options.method!,
            headers: options.headers,
            body: options.body,
        })
        
        console.log("something: ", data)

        // @ts-ignore
        if (data.status !== 'success') throw new Error(data.message)

        // @ts-ignore
        return data.data
    } catch (error: any) {
        console.log(error)
        throw new Error(error.message)
    }
}
