export const message = (type: string) => {
    switch (type) {
        case 'MERCHANT_REGISTRATION':
            return `congratulations, you have registered your business. you can add more branches on your dashboard.`
        default:
            return ``
    }
}
