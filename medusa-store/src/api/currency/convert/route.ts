import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

// In-memory cache: Currency -> { rates: Record<string, number>, timestamp: number }
const ratesCache = new Map<string, { rates: Record<string, number>; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

const querySchema = z.object({
    amount: z.string().transform((val) => parseFloat(val)).refine((val) => !isNaN(val) && val >= 0, {
        message: "Amount must be a non-negative number",
    }),
    from: z.string().length(3).toUpperCase(),
    to: z.string().length(3).toUpperCase(),
})

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    try {
        // 1. Validate parameters
        const validatedQuery = querySchema.safeParse(req.query)

        if (!validatedQuery.success) {
            res.status(400).json({
                message: "Invalid parameters",
                errors: validatedQuery.error.errors,
            })
            return
        }

        const { amount, from, to } = validatedQuery.data

        // 2. Check Cache
        const now = Date.now()
        let rates = ratesCache.get(from)

        if (!rates || now - rates.timestamp > CACHE_TTL) {
            // 3. Fetch from External API
            try {
                const response = await fetch(`https://open.er-api.com/v6/latest/${from}`)

                if (!response.ok) {
                    throw new Error(`External API error: ${response.statusText}`)
                }

                const data = (await response.json()) as { result: string; rates: Record<string, number> }

                if (data.result !== "success") {
                    throw new Error("Failed to fetch exchange rates")
                }

                rates = {
                    rates: data.rates,
                    timestamp: now,
                }
                ratesCache.set(from, rates)
            } catch (error) {
                console.error("Currency conversion error:", error)
                res.status(503).json({
                    message: "Service unavailable. Unable to fetch exchange rates.",
                })
                return
            }
        }

        // 4. Convert
        const rate = rates.rates[to]

        if (rate === undefined) {
            res.status(400).json({
                message: `Currency code '${to}' not found for base '${from}'`,
            })
            return
        }

        const convertedAmount = amount * rate

        res.json({
            from,
            to,
            amount,
            rate,
            convertedAmount,
            cached: !!(ratesCache.get(from) && ratesCache.get(from)!.timestamp === rates.timestamp && now - rates.timestamp < CACHE_TTL), // Simple indicator if it was from cache logic (approx)
        })
    } catch (error) {
        console.error("Unexpected error:", error)
        res.status(500).json({
            message: "Internal server error",
        })
    }
}

export const config = {
    auth: false,
}
