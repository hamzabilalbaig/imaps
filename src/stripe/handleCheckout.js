import { checkout } from "../api/hooks/useAPI"

 export const handleCheckout = async (plan, setLoading) => {
    setLoading(true)
    try {
        const data = await checkout(plan)
        setLoading(false)
        return data
    } catch (error) {
        setLoading(false)
        return { error: error.message }
    }
  }