import { parseStatement } from "../lib/parser/parseStatement"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function testPdfParser() {
  console.log("Testing PDF Statement Parser...")
  // Simple PDF sample or text parser check
  const sampleStatement = `
    HDFC BANK LIMITED
    Account Statement from 01/01/2026 to 31/01/2026
    Account Number: 50100234567890
    Customer Name: SANGHARSH GEDEKAR
    IFSC: HDFC0001234
    
    Date        Narration                             Chq/Ref No     Value Dt    Withdrawal(Dr)  Deposit(Cr)    Closing Balance
    02/01/2026  SALARY CREDITED FROM TECH CORP        INF/12345      02/01/2026                  150,000.00     150,000.00
    05/01/2026  UPI-SWIGGY-BANGALORE-UPI/54321        UPI/54321      05/01/2026  850.00                         149,150.00
    10/01/2026  ACH/ZERODHA/MUTUAL FUND ELSS          ACH/9988       10/01/2026  12,500.00                      136,650.00
    15/01/2026  AMAZON INDIA SHOPPING                 POS/7766       15/01/2026  4,200.00                       132,450.00
  `
  
  const { buildExtractionPrompt } = await import("../lib/parser/promptBuilder")
  const { callGroq } = await import("../lib/groq/client")
  const { TransactionListSchema } = await import("../lib/parser/schema")

  const prompt = buildExtractionPrompt(sampleStatement)
  console.log("Sending extraction prompt to Groq...")
  const rawResponse = await callGroq(prompt)
  console.log("Raw LLM Response:\n", rawResponse)

  const cleaned = rawResponse.replace(/```json|```/g, "").trim()
  const parsedJson = JSON.parse(cleaned)
  const list = TransactionListSchema.safeParse(parsedJson?.transactions ?? [])

  if (list.success) {
    console.log(`\n🎉 Extracted ${list.data.length} transactions successfully:`)
    console.table(list.data)
  } else {
    console.error("Validation error:", list.error)
  }
}

testPdfParser().catch(console.error)
