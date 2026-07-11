# 🗺️ Complete End-to-End Project Workflow & Execution Steps

This report details the complete, step-by-step operational flow of the Fintech Wealth Manager platform—from user session initialization to PDF parsing, machine learning clustering, tax computation, and interactive AI consultation.

---

## 50 Chronological Steps of the System Flow

### Phase 1: Authentication & Dashboard Handshake
1. **User Sign-In Challenge**: The user visits `/auth/login` and submits credentials, which are handled securely by the NextAuth v5 authentication handlers.
2. **Session Token Issuance**: NextAuth verifies credentials, establishes an active session, issues cookie tokens, and redirects the user to `/dashboard`.
3. **Database Profile Check**: The server queries the database `userProfiles` table using Drizzle ORM to verify if the user's KYC, occupation, and financial consents are registered.
4. **Linked Accounts Ingestion**: The server queries the `bankAccounts` table to load active accounts linked to the authenticated user ID.
5. **Dashboard Cache Resolution**: Next.js attempts to resolve the dashboard stats from Redis cache (`dashboard:${userId}`) to render details in under 50ms.
6. **Polishing UI States**: The client dashboard hydrates, displaying responsive glassmorphic cards, charts, and net worth balances.

### Phase 2: Bank Statement Upload & Pre-Processing
7. **Upload Navigation**: The user navigates to the `/upload` page to import their statement.
8. **File Drop Validation**: The frontend drops handler (`components/upload-statement.tsx`) captures the uploaded statement and validates the file extension (PDF, CSV, or Excel) and checks size constraints (max 10MB).
9. **API Ingestion Dispatch**: A multipart `POST` request carrying the binary file buffer, target bank account ID, and encryption password (if any) is dispatched to `/api/upload/statement`.
10. **API Rate Limiter Check**: The route handler passes the request through `@upstash/ratelimit` to ensure the user has not exceeded API caps.
11. **Processing Job Enqueueing**: The server inserts a new record into `statementUploads` table with status `processing` to track the parsing run.
12. **PDF Encryption Check**: The PDF parser scans the final 2KB trailer section of the buffer looking for the `/Encrypt` key dictionary.
13. **Bank Auto-Detection**: If the document is unencrypted, the system reads the first 4096 bytes looking for distinct keyword profiles (e.g. HDFC, ICICI, SBI) to identify the bank.
14. **Encryption Challenge**: If the PDF is encrypted and no password was passed in the request, the route returns a `PasswordRequiredError (422)` with custom bank-specific password hints.
15. **Local QPDF Decryption**: If a password is provided, the server writes the buffer to a temporary directory and executes a local `qpdf` subprocess (`qpdf --decrypt --password=...`) to decrypt it.
16. **Decryption Verification**: If `qpdf` decrypts successfully, it outputs an unencrypted PDF buffer; if the password fails, it throws a `PasswordRequiredError`.

### Phase 3: Pure-JS Text Extraction & LLM Ingestion
17. **ESM PDF Loader Initialization**: The unencrypted PDF buffer is loaded into the `PDFParse` instance from the `pdf-parse` package.
18. **Plain Text Streaming**: The parser extracts all text strings page-by-page, joining page arrays into a single, clean text representation.
19. **Metadata Extraction Hook**: The system sends the first 3000 characters of text to a specialized Groq prompt to extract header fields (holder name, account number, IFSC, period).
20. **Text Chunking**: The extracted plain text is split into sequential chunks of `6000` characters to fit within context limits.
30. **Key Rotator Verification**: The `GroqKeyManager` checks Redis key `groq:cooldown:${key}` to locate the next active API key that is not on cooldown.
31. **LLM Extraction Dispatch**: The text chunk is formatted with a strict Zod-compatible prompt and sent to Groq's `llama-3.3-70b-versatile` endpoint.
32. **Rate Limit 429 Handling**: If Groq returns a `429` error on the active key, the key manager marks that key as cooling down in Redis for 60 seconds and retries the call with the next key in rotation.
33. **Non-429 Call Error Handling**: If the API call fails for other reasons, the key is put to sleep for 15 seconds, and the execution is retried up to 6 times.
34. **Structured JSON Validation**: Groq returns the transactions as a JSON object, which is parsed and strictly validated against `TransactionListSchema` (`date`, `description`, `refNo`, `debit`, `credit`, `balance`).
35. **Balance Continuity Checking**: The system runs a mathematical continuity check across all parsed rows ($Balance_{curr} = Balance_{prev} + Credit - Debit$).
36. **Sanity Check Warnings**: If continuity checks fail (tolerance $> 0.01$), the system flags the anomalous row indices but allows the process to continue, presenting warnings on the upload dashboard.

### Phase 4: Downstream Normalization & Database Sync
37. **Date Object Resolution**: Raw date strings are parsed robustly into standard JS `Date` objects using regex mapping rules.
38. **Local Keyword Categorization**: Each transaction description is checked against regex rules in `categorizer.ts` to assign categories (e.g. food, salary, fuel) and recurring flags.
39. **Merchant Inferences**: Extraneous tags (like UPI references, bank codes) are stripped from descriptions to clean up merchant names.
40. **Payment Method Identification**: Payment types (UPI, NEFT, IMPS, Cash, Card, Netbanking) are inferred from description patterns.
41. **Deduplication Hashing**: A SHA-256 hash is generated for each transaction using its date, amount, and description.
42. **Database Merging**: The system compares hashes against the database to isolate duplicate rows, inserting only new records into the `transactions` table.
43. **Cache Invalidation**: The server invalidates the user's dashboard caches in Redis (`dashboard:${userId}`) to force data hydration.

### Phase 5: Machine Learning Clustering & Analytics
44. **Python ML Script Invocation**: The server executes the python script `/ml-service/app/main.py` via a background subprocess, passing the updated transaction records.
45. **Circular Temporal Encoding**: Python encodes the transaction's weekday and hour fields using sine/cosine trigonometry to preserve cyclical time patterns.
46. **K-Means Clustering**: Computes 4 distinct clusters representing spending behaviors (Micro-Transactions, Standard, High-Value, Major).
47. **DBSCAN Outlier Detection**: Runs DBSCAN to flag anomalies based on amount log-scales and late-night timestamps.
48. **Clustering Sync**: The computed cluster labels, centroids, and summaries are updated in the `clusterMetadata` table.

### Phase 6: Tax Calculations & AI Virtual CA Advice
49. **Regime Liability Modeling**: The tax engine calculates the user's current income tax liability under both the Old and New regimes for the financial year.
50. **Interactive AI Consultation**: The user opens `/ai-ca` and chats with the AI Virtua CA, which retrieves the profile, tax calculations, and ML cluster contexts, verifying access via Oracle Access Control, and streaming the response.
