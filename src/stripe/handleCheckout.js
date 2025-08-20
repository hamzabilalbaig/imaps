import { checkout } from "../api/functions/apiFunctions"

export const handleCheckout = async (plan, setLoading, customerId, userEmail) => {
    setLoading(true)
    try {
        const data = await checkout(plan, customerId, userEmail)
        setLoading(false)
        return data
    } catch (error) {
        setLoading(false)
        return { error: error.message }
    }
}