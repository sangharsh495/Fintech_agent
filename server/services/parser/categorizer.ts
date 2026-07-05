export type TransactionCategory =
  | "salary" | "freelance" | "investment_return" | "refund" | "gift_received"
  | "rental_income" | "food_dining" | "groceries" | "transportation" | "fuel"
  | "utilities" | "rent" | "emi_loan" | "insurance" | "healthcare" | "education"
  | "entertainment" | "shopping" | "travel" | "subscriptions" | "personal_care"
  | "charity" | "miscellaneous" | "transfer"

interface CategoryResult {
  category: TransactionCategory
  subcategory?: string
  isRecurring: boolean
  merchant?: string
}

const RULES: Array<{
  keywords: string[]
  category: TransactionCategory
  subcategory?: string
  isRecurring?: boolean
}> = [
  // Income
  { keywords: ["salary", "sal credit", "ctc", "payroll", "pay credit", "monthly pay", "basic salary", "net salary"], category: "salary", isRecurring: true },
  { keywords: ["freelance", "upwork", "fiverr", "toptal", "consulting fee"], category: "freelance" },
  { keywords: ["dividend", "interest credit", "fd interest", "mutual fund"], category: "investment_return" },
  { keywords: ["refund", "cashback", "reversal", "return credit"], category: "refund" },
  { keywords: ["rental income", "rent received"], category: "rental_income" },
  // Food
  { keywords: ["swiggy", "zomato", "food panda", "uber eats", "blinkit food"], category: "food_dining", subcategory: "food_delivery" },
  { keywords: ["mcdonald", "kfc", "domino", "pizza hut", "burger king", "subway", "starbucks", "cafe coffee day", "ccd", "barista"], category: "food_dining", subcategory: "restaurant" },
  { keywords: ["restaurant", "dhaba", "biryani", "canteen", "tiffin", "hotel food"], category: "food_dining" },
  // Groceries
  { keywords: ["bigbasket", "big basket", "grofers", "blinkit", "zepto", "dunzo", "jiomart", "instamart"], category: "groceries", subcategory: "online_grocery" },
  { keywords: ["dmart", "d-mart", "reliance fresh", "reliance smart", "nature's basket", "spencers", "star bazaar"], category: "groceries", subcategory: "supermarket" },
  { keywords: ["grocery", "vegetables", "fruits", "milk", "dairy", "kirana", "supermarket", "provision"], category: "groceries" },
  // Transport
  { keywords: ["ola", "uber", "rapido", "meru", "taxi", "cab booking"], category: "transportation", subcategory: "ride_hailing" },
  { keywords: ["metro", "dmrc", "bmtc", "best bus", "bus pass", "local train"], category: "transportation", subcategory: "public_transport" },
  { keywords: ["irctc", "rail ticket", "railway"], category: "travel", subcategory: "train" },
  // Fuel
  { keywords: ["petrol", "diesel", "fuel", "hp fuel", "iocl", "bpcl", "bharat petroleum", "hindustan petroleum", "indian oil", "shell", "essar fuel"], category: "fuel" },
  // Utilities
  { keywords: ["electricity", "power bill", "bescom", "msedcl", "tpddl", "bses", "kseb", "tangedco", "adani electricity"], category: "utilities", subcategory: "electricity", isRecurring: true },
  { keywords: ["water bill", "water charges", "jal board"], category: "utilities", subcategory: "water", isRecurring: true },
  { keywords: ["gas bill", "piped gas", "indane gas", "bharat gas", "hp gas", "mahanagar gas", "igl", "mgl"], category: "utilities", subcategory: "gas", isRecurring: true },
  { keywords: ["broadband", "internet", "wifi", "jio fiber", "airtel fiber", "bsnl broadband", "act fiber"], category: "utilities", subcategory: "internet", isRecurring: true },
  { keywords: ["mobile recharge", "phone bill", "airtel", "vodafone", "vi ", "jio prepaid", "bsnl", "tata docomo"], category: "utilities", subcategory: "mobile", isRecurring: true },
  // Rent
  { keywords: ["rent", "house rent", "pg rent", "accommodation", "flat rent", "apartment rent", "nobroker"], category: "rent", isRecurring: true },
  // EMI
  { keywords: ["emi", "loan emi", "home loan", "car loan", "personal loan emi", "bike emi", "consumer loan"], category: "emi_loan", isRecurring: true },
  { keywords: ["credit card bill", "cc payment", "hdfc cc", "icici cc", "sbi card", "axis cc", "kotak cc", "amex"], category: "emi_loan", subcategory: "credit_card", isRecurring: true },
  // Insurance
  { keywords: ["insurance", "premium", "lic", "life insurance", "health insurance", "term insurance", "vehicle insurance", "niva bupa", "star health", "hdfc life", "sbi life", "bajaj allianz"], category: "insurance", isRecurring: true },
  // Healthcare
  { keywords: ["hospital", "clinic", "doctor", "medical", "pharmacy", "apollo", "fortis", "medplus", "netmeds", "1mg", "pharmeasy", "diagnostic"], category: "healthcare" },
  // Education
  { keywords: ["school fees", "college fees", "tuition", "coaching", "byju", "unacademy", "vedantu", "coursera", "udemy", "course fee", "exam fee"], category: "education" },
  // Streaming/Subscriptions
  { keywords: ["netflix", "hotstar", "amazon prime", "zee5", "sonyliv", "voot", "jiocinema", "spotify", "gaana", "youtube premium"], category: "subscriptions", subcategory: "streaming", isRecurring: true },
  // Entertainment
  { keywords: ["movie", "pvr", "inox", "cinepolis", "cinema", "bookmyshow", "theatre", "concert"], category: "entertainment", subcategory: "movies" },
  { keywords: ["gaming", "steam", "playstation", "xbox", "dream11", "fantasy"], category: "entertainment", subcategory: "gaming" },
  // Shopping
  { keywords: ["amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho", "snapdeal", "shopsy", "tata cliq", "reliance digital", "croma", "vijay sales"], category: "shopping", subcategory: "online" },
  { keywords: ["clothes", "fashion", "apparel", "shoes", "footwear", "mall", "jewellery"], category: "shopping", subcategory: "fashion" },
  { keywords: ["electronics", "mobile phone", "laptop", "gadget", "appliances"], category: "shopping", subcategory: "electronics" },
  // Travel
  { keywords: ["makemytrip", "goibibo", "yatra", "cleartrip", "ixigo", "booking.com", "oyo", "airbnb", "hotel", "resort"], category: "travel", subcategory: "hotel" },
  { keywords: ["indigo", "air india", "vistara", "spicejet", "go air", "akasa", "flight", "airline", "air ticket"], category: "travel", subcategory: "flight" },
  // Personal Care
  { keywords: ["salon", "spa", "haircut", "manicure", "pedicure", "beauty", "lakme", "loreal"], category: "personal_care" },
  // Charity
  { keywords: ["donation", "charity", "ngo", "temple", "church", "mosque", "gurudwara", "pm relief", "pm cares"], category: "charity" },
  // Transfer
  { keywords: ["neft", "rtgs", "imps transfer", "upi transfer", "sent to", "transfer to", "self transfer", "atm withdrawal", "cash withdrawal"], category: "transfer" },
]

export function categorizeTransaction(description: string, amount: number, type: "credit" | "debit"): CategoryResult {
  const lower = description.toLowerCase()

  // Income categories (credits)
  if (type === "credit") {
    const incomeCategories = ["salary", "freelance", "investment_return", "refund", "rental_income", "gift_received"]
    for (const rule of RULES) {
      if (incomeCategories.includes(rule.category) && rule.keywords.some((kw) => lower.includes(kw))) {
        return { category: rule.category, subcategory: rule.subcategory, isRecurring: rule.isRecurring ?? false, merchant: extractMerchant(description) }
      }
    }
    return { category: "transfer", isRecurring: false, merchant: extractMerchant(description) }
  }

  // Debit categories
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return { category: rule.category, subcategory: rule.subcategory, isRecurring: rule.isRecurring ?? false, merchant: extractMerchant(description) }
    }
  }

  return { category: "miscellaneous", isRecurring: false, merchant: extractMerchant(description) }
}

function extractMerchant(description: string): string {
  const cleaned = description.replace(/UPI-/gi, "").replace(/NEFT-/gi, "").replace(/IMPS-/gi, "").replace(/\d{6,}/g, "").replace(/\s+/g, " ").trim()
  return cleaned.split(/[-\/|]/)[0]?.trim().slice(0, 40) || description.slice(0, 40)
}
