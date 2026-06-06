import { Utensils, HeartPulse, ShoppingCart, Car, Clapperboard, Package } from "lucide-react"

export const CATEGORY_CONFIG = {
    Food:          { color: "#f97316", Icon: Utensils },
    Medical:       { color: "#ef4444", Icon: HeartPulse },
    Groceries:     { color: "#22c55e", Icon: ShoppingCart },
    Transport:     { color: "#3b82f6", Icon: Car },
    Entertainment: { color: "#a855f7", Icon: Clapperboard },
    Other:         { color: "#6b7280", Icon: Package },
}

export const CATEGORY_LIST = Object.entries(CATEGORY_CONFIG).map(([value, cfg]) => ({
    value,
    label: value,
    ...cfg,
}))
